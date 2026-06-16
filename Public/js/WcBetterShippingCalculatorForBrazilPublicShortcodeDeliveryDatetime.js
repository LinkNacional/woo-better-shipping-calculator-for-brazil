/**
 * Delivery Date & Time Picker for Classic/Shortcode Checkout
 *
 * Uses flatpickr (npm) to provide a date+time picker that:
 * - Only allows selecting days marked as active in the delivery schedule
 * - Disables holidays (from holidays.json)
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

    // Conjunto de datas bloqueadas (feriados)
    const holidayDates = new Set();
    holidaysData.forEach(function (h) {
        if (h.date) holidayDates.add(h.date);
    });

    // Mapeamento de dias da semana ativos
    const dayIndexMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
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
                    start: day.start || '08:00',
                    end: day.end || '18:00',
                };
            }
        }
    });

    // Se nenhum dia ativo, libera todos
    if (enabledDays.length === 0) {
        for (let i = 0; i < 7; i++) enabledDays.push(i);
    }

    // Calcula minTime e maxTime globais
    let globalMinTime = '00:00';
    let globalMaxTime = '23:59';
    const timesFromSchedule = Object.values(daySchedule);
    if (timesFromSchedule.length > 0) {
        globalMinTime = timesFromSchedule.reduce(function (a, b) {
            return a.start < b.start ? a : b;
        }).start;
        globalMaxTime = timesFromSchedule.reduce(function (a, b) {
            return a.end > b.end ? a : b;
        }).end;
    }

    function isDateDisabled(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = yyyy + '-' + mm + '-' + dd;

        if (holidayDates.has(dateStr)) return true;

        const weekday = date.getDay();
        if (enabledDays.indexOf(weekday) === -1) return true;

        return false;
    }

    /**
     * Injeta ícone de calendário dentro do .woocommerce-input-wrapper.
     * Segue o mesmo padrão do campo IE (billing_ie).
     */
    function injectCalendarIcon(input) {
        const fieldWrapper = document.getElementById('billing_delivery_datetime_field');
        if (!fieldWrapper) return;

        // Evita duplicar
        if (document.getElementById('woo_better_delivery_calendar_icon')) return;

        const inputWrapper = fieldWrapper.querySelector('.woocommerce-input-wrapper');
        if (!inputWrapper) return;

        inputWrapper.style.position = 'relative';

        // Container do ícone (posicionado à direita dentro do wrapper)
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

        // Ícone SVG de calendário
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

        // Ao clicar no ícone, foca o input (flatpickr abre)
        iconWrapper.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            input.focus();
        });

        // Espaço extra no input para o ícone não sobrepor o texto
        input.style.paddingRight = '36px';

        inputWrapper.appendChild(iconWrapper);
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
            disable: [
                function (date) {
                    return isDateDisabled(date);
                },
            ],
            onChange: function (selectedDates, dateStr, instance) {
                if (typeof jQuery !== 'undefined') {
                    jQuery('body').trigger('update_checkout');
                }
            },
        });

        input.dataset.flatpickrBound = '1';

        // Injeta o ícone de calendário
        injectCalendarIcon(input);

        return fp;
    }

    // Inicialização
    initPicker(deliveryInput);

    // Observer para campos carregados dinamicamente (ex: AJAX checkout update)
    const observer = new MutationObserver(function () {
        const input = document.getElementById('billing_delivery_datetime');
        if (input && !input.dataset.flatpickrBound) {
            initPicker(input);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
