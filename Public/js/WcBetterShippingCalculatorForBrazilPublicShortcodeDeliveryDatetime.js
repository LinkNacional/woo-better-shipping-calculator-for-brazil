/**
 * Delivery Date & Time Picker for Classic/Shortcode Checkout
 *
 * Uses flatpickr (npm) to provide a date+time picker that:
 * - Only allows selecting days marked as active in the delivery schedule
 * - Disables holidays (from holidays.json), with partial support:
 *   - Holidays with start_hour=0 + end_hour=24 → full day blocked
 *   - Holidays with partial range (ex: 0-12 or 12-24) → only that range is
 *     blocked; the rest of the day follows the normal schedule
 * - Only allows future dates
 * - Injects a calendar icon inside the input wrapper
 *
 * @since 4.17.0
 */
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const deliveryInput = document.getElementById('billing_delivery_datetime');
    if (!deliveryInput) return;

    const scheduleData = window.WooBetterDeliverySchedule || {};
    const holidaysData = window.WooBetterDeliveryHolidays || [];

    // ── Helpers ──────────────────────────────────────────────────────────

    function timeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    function minutesToTime(minutes) {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
    }

    function formatDateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    // ── Processa feriados ────────────────────────────────────────────────

    const fullDayHolidays = new Set();
    const partialHolidays = {}; // dateStr → { startMin, endMin }

    holidaysData.forEach(function (h) {
        if (!h.date) return;

        const startH = typeof h.start_hour === 'number' ? h.start_hour : 0;
        const endH = typeof h.end_hour === 'number' ? h.end_hour : 24;

        if (endH - startH >= 24 || (startH === 0 && endH === 0)) {
            fullDayHolidays.add(h.date);
        } else {
            partialHolidays[h.date] = {
                startMin: startH * 60,
                endMin: endH * 60,
            };
        }
    });

    // ── Processa schedule ────────────────────────────────────────────────

    const dayIndexMap = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6,
    };

    const enabledDays = [];
    const daySchedule = {};

    Object.keys(scheduleData).forEach(function (key) {
        const day = scheduleData[key];
        if (day && day.active) {
            const idx = dayIndexMap[key];
            if (idx !== undefined) {
                enabledDays.push(idx);
                daySchedule[idx] = {
                    startMin: timeToMinutes(day.start || '08:00'),
                    endMin: timeToMinutes(day.end || '18:00'),
                };
            }
        }
    });

    if (enabledDays.length === 0) {
        for (let i = 0; i < 7; i++) enabledDays.push(i);
    }

    let globalMinTime = '00:00';
    let globalMaxTime = '23:59';
    const timesArr = Object.values(daySchedule);
    if (timesArr.length > 0) {
        let globalStartMin = Infinity;
        let globalEndMin = -Infinity;
        timesArr.forEach(function (t) {
            if (t.startMin < globalStartMin) globalStartMin = t.startMin;
            if (t.endMin > globalEndMin) globalEndMin = t.endMin;
        });
        globalMinTime = minutesToTime(globalStartMin);
        globalMaxTime = minutesToTime(globalEndMin);
    }

    // ── Função disable ───────────────────────────────────────────────────

    function isDateDisabled(date) {
        const dateStr = formatDateKey(date);
        if (fullDayHolidays.has(dateStr)) return true;

        const weekday = date.getDay();
        if (enabledDays.indexOf(weekday) === -1) return true;

        return false;
    }

    /**
     * Corrige o horário da data selecionada se ele cair dentro de um bloqueio
     * (feriado parcial ou fora do schedule). Retorna true se houve correção.
     */
    function correctTimeIfNeeded(selDate) {
        const dateKey = formatDateKey(selDate);
        const selMinutes = selDate.getHours() * 60 + selDate.getMinutes();
        let corrected = false;

        // 1. Feriado parcial
        const partial = partialHolidays[dateKey];
        if (partial) {
            // Bloqueio: (startMin, endMin) — o minuto startMin em si é válido
            if (selMinutes > partial.startMin && selMinutes < partial.endMin) {
                let targetMin;

                if (partial.startMin === 0) {
                    // Bloqueio de manhã: empurra para depois do feriado
                    targetMin = partial.endMin;
                } else if (partial.endMin >= 1440) {
                    // Bloqueio de tarde: empurra para o último minuto antes do feriado
                    // Ex: feriado 12:00-24:00 → último horário válido = 12:00 (inclusive)
                    // O usuário pode selecionar até o minuto exato em que o feriado começa
                    targetMin = partial.startMin;
                } else {
                    // Bloqueio no meio do dia: escolhe o lado mais próximo
                    const distToStart = selMinutes - partial.startMin;
                    const distToEnd = partial.endMin - selMinutes;
                    targetMin = distToStart <= distToEnd
                        ? partial.startMin
                        : partial.endMin;
                }

                if (targetMin < 0) targetMin = 0;
                if (targetMin >= 1440) targetMin = 1439;

                selDate.setHours(Math.floor(targetMin / 60));
                selDate.setMinutes(targetMin % 60);
                corrected = true;
            }
        }

        // 2. Schedule do dia (só verifica se não foi corrigido pelo feriado
        //    ou se a correção do feriado já deixou em horário válido)
        const weekday = selDate.getDay();
        const sched = daySchedule[weekday];
        if (sched) {
            const mins = selDate.getHours() * 60 + selDate.getMinutes();
            if (mins < sched.startMin) {
                selDate.setHours(Math.floor(sched.startMin / 60));
                selDate.setMinutes(sched.startMin % 60);
                corrected = true;
            } else if (mins > sched.endMin) {
                selDate.setHours(Math.floor(sched.endMin / 60));
                selDate.setMinutes(sched.endMin % 60);
                corrected = true;
            }
        }

        return corrected;
    }

    // ── Ícone de calendário ──────────────────────────────────────────────

    function injectCalendarIcon(input) {
        const fieldWrapper = document.getElementById('billing_delivery_datetime_field');
        if (!fieldWrapper) return;
        if (document.getElementById('woo_better_delivery_calendar_icon')) return;

        const inputWrapper = fieldWrapper.querySelector('.woocommerce-input-wrapper');
        if (!inputWrapper) return;

        inputWrapper.style.position = 'relative';

        const iconWrapper = document.createElement('span');
        iconWrapper.id = 'woo_better_delivery_calendar_icon';
        iconWrapper.setAttribute(
            'style',
            'display: flex !important; ' +
            'align-items: center !important; ' +
            'justify-content: center !important; ' +
            'position: absolute !important; ' +
            'right: 8px !important; ' +
            'top: 50% !important; ' +
            'transform: translateY(-50%) !important; ' +
            'width: 24px !important; ' +
            'height: 24px !important; ' +
            'cursor: pointer !important; ' +
            'z-index: 2 !important; ' +
            'pointer-events: auto !important;'
        );
        iconWrapper.setAttribute('aria-label', 'Abrir calendário');
        iconWrapper.setAttribute('tabindex', '0');
        iconWrapper.setAttribute('role', 'button');

        iconWrapper.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" ' +
            'width="18" height="18" ' +
            'viewBox="0 0 24 24" ' +
            'fill="none" ' +
            'stroke="#6b7280" ' +
            'stroke-width="2" ' +
            'stroke-linecap="round" ' +
            'stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>' +
            '<line x1="16" y1="2" x2="16" y2="6"></line>' +
            '<line x1="8" y1="2" x2="8" y2="6"></line>' +
            '<line x1="3" y1="10" x2="21" y2="10"></line>' +
            '</svg>';

        iconWrapper.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            input.focus();
        });

        input.style.paddingRight = '36px';
        inputWrapper.appendChild(iconWrapper);
    }

    // ── Inicializa flatpickr ─────────────────────────────────────────────

    /**
     * Flag para evitar recursão no onChange.
     * Quando estamos corrigindo via setDate(), ignoramos o próximo onChange.
     */
    let isCorrecting = false;

    /**
     * Injeta botão "Confirmar" e estilo no calendário flatpickr.
     * Impede fechamento automático — só fecha no blur ou ao clicar em Confirmar.
     */
    function injectConfirmButton(instance) {
        const calendar = instance.calendarContainer;
        if (!calendar || calendar.querySelector('.wc-better-flatpickr-confirm')) return;

        const confirmBtn = document.createElement('button');
        confirmBtn.type = 'button';
        confirmBtn.className = 'wc-better-flatpickr-confirm';
        confirmBtn.textContent = 'Confirmar';
        confirmBtn.setAttribute('style',
            'display: block; width: 100%; padding: 10px 0; ' +
            'border: none; border-radius: 0 0 4px 4px; background: #2271b1; color: #fff; ' +
            'font-size: 14px; font-weight: 600; cursor: pointer;'
        );

        confirmBtn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            instance.close();
        });

        calendar.appendChild(confirmBtn);
    }

    function initPicker(input) {
        const fp = flatpickr(input, {
            enableTime: true,
            dateFormat: 'd/m/Y H:i',
            minDate: 'today',
            time_24hr: true,
            locale: Portuguese,
            minTime: globalMinTime,
            maxTime: globalMaxTime,
            // Sem allowInput — o valor só é definido via calendário/relógio,
            // evitando crash do parseDate com texto inválido.
            disable: [
                function (date) {
                    return isDateDisabled(date);
                },
            ],
            onChange: function (selectedDates, dateStr, instance) {
                if (isCorrecting) return;
                if (selectedDates.length === 0) return;

                const selDate = new Date(selectedDates[0].getTime());
                const needsCorrection = correctTimeIfNeeded(selDate);

                if (needsCorrection) {
                    isCorrecting = true;
                    instance.setDate(selDate, false);
                    isCorrecting = false;
                }

                // Não disparamos update_checkout aqui — o WooCommerce faria
                // AJAX e destruiria o DOM, fechando o picker. Só disparamos
                // no onClose, quando o usuário termina de escolher.
            },
            onOpen: function (selectedDates, dateStr, instance) {
                injectConfirmButton(instance);
            },
            onClose: function (selectedDates, dateStr, instance) {
                if (typeof jQuery !== 'undefined') {
                    jQuery('body').trigger('update_checkout');
                }
            },
        });

        input.dataset.flatpickrBound = '1';
        injectCalendarIcon(input);
        return fp;
    }

    // ── Bootstrap ────────────────────────────────────────────────────────

    initPicker(deliveryInput);

    const observer = new MutationObserver(function () {
        const input = document.getElementById('billing_delivery_datetime');
        if (input && !input.dataset.flatpickrBound) {
            initPicker(input);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
