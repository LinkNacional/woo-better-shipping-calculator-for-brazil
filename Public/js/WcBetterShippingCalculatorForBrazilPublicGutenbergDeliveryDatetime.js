/**
 * Delivery Date + Slot Picker for Gutenberg/Block Checkout
 *
 * Follows the same pattern as birthdate: text input with mask + flatpickr via
 * calendar icon. A time-slot <select> with WC Blocks styling appears below
 * the input after a date is chosen. Saves via Store API.
 *
 * @since 4.17.0
 * @since 5.x  Replaced time picker with slot <select> + manual date input.
 */
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const scheduleData = window.WooBetterDeliverySchedule || {};
    const holidaysData = window.WooBetterDeliveryHolidays || [];
    const savedData    = window.WooBetterDeliveryData || {};
    const slotsData    = window.WooBetterDeliverySlots || [];
    const minPrepHours = (typeof window.WooBetterMinPrepHours !== 'undefined') ? parseInt(window.WooBetterMinPrepHours, 10) || 0 : 0;

    let deliveryInput = null;
    let fieldContainerType = null;
    let slotSelectEl = null;

    // ── Helpers ──────────────────────────────────────────────────────────

    function timeToMinutes(timeStr) {
        const parts = timeStr.split(':');
        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    function formatDateKey(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    }

    // ── Mask (dd/mm/aaaa) ────────────────────────────────────────────────

    function applyDateMask(input) {
        var val = input.value.replace(/\D/g, '').substring(0, 8);
        if (val.length > 4) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
        } else if (val.length > 2) {
            val = val.substring(0, 2) + '/' + val.substring(2);
        }
        input.value = val;
    }

    function isDateComplete(dateStr) {
        return /^\d{2}\/\d{2}\/\d{4}$/.test(dateStr);
    }

    function parseDateParts(dateStr) {
        var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dateStr);
        if (!m) return null;
        return { day: parseInt(m[1], 10), month: parseInt(m[2], 10), year: parseInt(m[3], 10) };
    }

    // ── Processa feriados ────────────────────────────────────────────────

    const fullDayHolidays = new Set();
    const partialHolidays = {};

    holidaysData.forEach(function (h) {
        if (!h.date) return;
        var startH = typeof h.start_hour === 'number' ? h.start_hour : 0;
        var endH   = typeof h.end_hour   === 'number' ? h.end_hour   : 24;
        if (endH - startH >= 24 || (startH === 0 && endH === 0)) {
            fullDayHolidays.add(h.date);
        } else {
            partialHolidays[h.date] = { startMin: startH * 60, endMin: endH * 60 };
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
        var day = scheduleData[key];
        if (day && day.active) {
            var idx = dayIndexMap[key];
            if (idx !== undefined) {
                enabledDays.push(idx);
                daySchedule[idx] = {
                    startMin: timeToMinutes(day.start || '08:00'),
                    endMin:   timeToMinutes(day.end   || '18:00'),
                };
            }
        }
    });
    if (enabledDays.length === 0) {
        for (var i = 0; i < 7; i++) enabledDays.push(i);
    }

    // ── Flatpickr disable ────────────────────────────────────────────────

    function isDateDisabled(date) {
        var dateStr = formatDateKey(date);
        if (fullDayHolidays.has(dateStr)) return true;
        if (enabledDays.indexOf(date.getDay()) === -1) return true;
        return false;
    }

    // ── Slot filtering ───────────────────────────────────────────────────

    function slotLabel(slot) {
        return slot[0] + ' às ' + slot[1];
    }

    function getSlotsForDay(weekday, dateKey) {
        var sched = daySchedule[weekday];
        if (!sched || slotsData.length === 0) return [];

        // Começa com o horário do dia
        var dayStart = sched.startMin;
        var dayEnd   = sched.endMin;

        // Se a data tem feriado parcial, restringe ainda mais o intervalo
        var partial = partialHolidays[dateKey];
        if (partial) {
            // Feriado parcial do tipo 0h às 12h: bloqueia das 0h às 12h.
            // O que sobra é: [partial.endMin, dayEnd]
            // Feriado parcial do tipo 12h às 24h: bloqueia das 12h às 24h.
            // O que sobra é: [dayStart, partial.startMin]
            if (partial.startMin <= dayStart && partial.endMin > dayStart) {
                // Bloqueio começa no início do dia → empurra o início
                dayStart = partial.endMin;
            } else if (partial.endMin >= dayEnd && partial.startMin < dayEnd) {
                // Bloqueio vai até o fim do dia → puxa o fim
                dayEnd = partial.startMin;
            } else if (partial.startMin > dayStart && partial.endMin < dayEnd) {
                // Bloqueio no meio do dia: escolhe o lado com mais slots
                var beforeLen = partial.startMin - dayStart;
                var afterLen  = dayEnd - partial.endMin;
                if (beforeLen >= afterLen) {
                    dayEnd = partial.startMin;  // usa a manhã
                } else {
                    dayStart = partial.endMin;   // usa a tarde
                }
            }
            // Se o bloqueio cobre o dia inteiro, dayStart >= dayEnd → sem slots
        }

        if (dayStart >= dayEnd) return [];

        // Se é hoje, aplica tempo mínimo de preparo (incluindo agora com 0h)
        var todayKey = formatDateKey(new Date());
        if (dateKey === todayKey && minPrepHours >= 0) {
            var nowMin = new Date().getHours() * 60 + new Date().getMinutes() + minPrepHours * 60;
            if (nowMin > dayStart) dayStart = nowMin;
        }

        if (dayStart >= dayEnd) return [];

        return slotsData.filter(function (slot) {
            var s = timeToMinutes(slot[0]);
            var e = timeToMinutes(slot[1]);
            return s >= dayStart && e <= dayEnd;
        });
    }

    // ── Slot <select> (WC Blocks style) ──────────────────────────────────

    function createSlotSelect(input) {
        if (slotSelectEl) return slotSelectEl;

        // Outer wrapper matching WC Blocks select component
        var wrapper = document.createElement('div');
        wrapper.className = 'wc-blocks-components-select wc-better-delivery-slot-wrapper';
        wrapper.setAttribute('style', 'margin-top: 8px; display: none;');

        // Inner container
        var container = document.createElement('div');
        container.className = 'wc-blocks-components-select__container';

        // Label
        var label = document.createElement('label');
        label.className = 'wc-blocks-components-select__label';
        label.setAttribute('for', 'billing_delivery_time_slot');
        label.textContent = 'Horário de Entrega';

        // Select
        var select = document.createElement('select');
        select.id = 'billing_delivery_time_slot';
        select.className = 'wc-blocks-components-select__select';
        select.setAttribute('size', '1');
        select.setAttribute('aria-invalid', 'false');

        var defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = 'Selecione o horário...';
        defaultOpt.disabled = true;
        select.appendChild(defaultOpt);

        // Expand icon (same SVG as WC Blocks)
        var expandSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        expandSvg.setAttribute('viewBox', '0 0 24 24');
        expandSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        expandSvg.setAttribute('width', '24');
        expandSvg.setAttribute('height', '24');
        expandSvg.setAttribute('class', 'wc-blocks-components-select__expand');
        expandSvg.setAttribute('aria-hidden', 'true');
        expandSvg.setAttribute('focusable', 'false');
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z');
        expandSvg.appendChild(path);

        container.appendChild(label);
        container.appendChild(select);
        container.appendChild(expandSvg);
        wrapper.appendChild(container);

        // Insert after the main-wrapper inside the delivery container
        var deliveryContainer = input.closest('.wc-better-billing-delivery-datetime');
        if (deliveryContainer) {
            deliveryContainer.appendChild(wrapper);
        } else {
            input.parentNode.parentNode.appendChild(wrapper);
        }

        slotSelectEl = select;

        select.addEventListener('change', function () {
            var slotVal = select.value;
            var dateStr = input.value.trim();
            if (isDateComplete(dateStr) && slotVal) {
                saveToStore(dateStr, slotVal);
                hideError();
                updateActiveState();
                // Re-sync input in case flatpickr reverted it
                if (input.value.trim() !== dateStr) {
                    input._flatpickr && input._flatpickr.setDate(dateStr, false);
                }
            }
        });

        return select;
    }

    function populateSlotSelect(input) {
        var dateStr = input.value.trim();
        var parts = parseDateParts(dateStr);
        if (!parts) {
            hideSlotSelect();
            return;
        }

        var date = new Date(parts.year, parts.month - 1, parts.day);
        if (isNaN(date.getTime())) {
            hideSlotSelect();
            return;
        }

        var weekday = date.getDay();
        var dateKey = formatDateKey(date);
        var slots = getSlotsForDay(weekday, dateKey);

        var select = createSlotSelect(input);
        // Clear options except default
        while (select.options.length > 1) select.remove(1);

        var wrapper = select.closest('.wc-better-delivery-slot-wrapper');

        if (slots.length === 0) {
            if (wrapper) wrapper.style.display = 'block';
            select.value = '';
            select.options[0].textContent = 'Nenhum horário disponível...';
            return;
        }

        // Restaura texto original
        select.options[0].textContent = 'Selecione o horário...';

        slots.forEach(function (slot) {
            var opt = document.createElement('option');
            opt.value = slotLabel(slot);
            opt.textContent = slotLabel(slot);
            select.appendChild(opt);
        });

        if (wrapper) wrapper.style.display = 'block';
        select.value = '';

        // Restore cached slot if re-selecting same date
        var dateKey = formatDateKey(date);
        if (input._slotCache && input._slotCache.dateKey === dateKey) {
            var cached = input._slotCache.value;
            for (var i = 0; i < select.options.length; i++) {
                if (select.options[i].value === cached) {
                    select.value = cached;
                    saveToStore(dateStr, cached);
                    hideError();
                    updateActiveState();
                    break;
                }
            }
        }
    }

    function hideSlotSelect() {
        if (slotSelectEl) {
            var wrapper = slotSelectEl.closest('.wc-better-delivery-slot-wrapper');
            if (wrapper) wrapper.style.display = 'none';
            slotSelectEl.value = '';
        }
    }

    // ── Store API ────────────────────────────────────────────────────────

    function saveToStore(dateStr, slotStr) {
        var payload = {
            billing_delivery_date: dateStr || '',
            billing_delivery_time_slot: slotStr || '',
        };
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                var checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                if (checkoutDispatch && checkoutDispatch.setExtensionData) {
                    checkoutDispatch.setExtensionData('woo_better_delivery_datetime', payload);
                }
            } catch (e) { /* silencioso */ }
        }
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({ namespace: 'woo_better_delivery_datetime', data: payload });
        }
    }

    function clearStoreData() {
        var payload = {
            billing_delivery_date: '',
            billing_delivery_time_slot: '',
        };
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                var checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                if (checkoutDispatch && checkoutDispatch.setExtensionData) {
                    checkoutDispatch.setExtensionData('woo_better_delivery_datetime', payload);
                }
            } catch (e) {}
        }
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({ namespace: 'woo_better_delivery_datetime', data: payload });
        }
    }

    // ── DOM builders ─────────────────────────────────────────────────────

    function getDeliveryContainer() {
        return document.querySelector('.wc-better-billing-delivery-datetime');
    }

    function getDeliveryErrorContainer() {
        return document.querySelector('.wc-block-components-validation-error.wc-better-delivery-datetime');
    }

    function showError(msg) {
        var err = getDeliveryErrorContainer();
        if (err) { err.style.display = 'block'; var s = err.querySelector('span'); if (s) s.textContent = msg || 'Selecione uma data e horário de entrega.'; }
        var c = getDeliveryContainer(); if (c) c.classList.add('has-error');
        if (deliveryInput) deliveryInput.setAttribute('aria-invalid', 'true');
    }

    function hideError() {
        var err = getDeliveryErrorContainer();
        if (err) err.style.display = 'none';
        var c = getDeliveryContainer(); if (c) c.classList.remove('has-error');
        if (deliveryInput) deliveryInput.setAttribute('aria-invalid', 'false');
    }

    // ── "Usar mesmo endereço" ──────────────────────────────────────────

    function isUsingSameAddressForBilling() {
        var checkbox = document.querySelector('input[type="checkbox"][id^="checkbox-control"]');
        if (!checkbox) return false;
        var checkboxContainer = checkbox.closest('.wc-block-checkout__use-address-for-billing');
        if (!checkboxContainer) return false;
        return checkbox.checked;
    }

    function getTargetContext() {
        var useSame = isUsingSameAddressForBilling();
        var container = useSame ? document.querySelector('#shipping') : document.querySelector('#billing');
        var containerType = useSame ? 'shipping' : 'billing';
        return { container: container, containerType: containerType };
    }

    function getReferenceElement(container) {
        var children = container.children;
        if (children.length === 0) return null;

        for (var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
            if (child.tagName === 'INPUT' && child.type === 'hidden') continue;
            if (child.classList.contains('wc-block-checkout__use-address-for-shipping')) continue;
            if (child.classList.contains('wc-block-checkout__use-address-for-billing')) continue;
            if (child.classList.contains('wc-block-components-address-form__birthdate')) continue;
            if (child.classList.contains('wc-block-components-address-form__gender')) continue;
            if (child.classList.contains('wc-block-components-address-form__delivery-datetime')) continue;
            return child;
        }
        return null;
    }

    function ensureAddressEditorOpen(containerType) {
        var editBtn = document.querySelector('span.wc-block-components-address-card__edit[aria-controls="' + containerType + '"]');
        if (!editBtn) return false;
        if (editBtn.getAttribute('aria-expanded') !== 'true') editBtn.click();
        return editBtn.getAttribute('aria-expanded') === 'true';
    }

    // ── Remove + clear ───────────────────────────────────────────────────

    function removeField() {
        var container = getDeliveryContainer();
        if (container) container.remove();
        deliveryInput = null;
        slotSelectEl = null;
        fieldContainerType = null;
        clearStoreData();
    }

    function createField(referenceElement) {
        if (getDeliveryContainer()) return getDeliveryContainer();

        var container = document.createElement('div');
        container.className = 'wc-block-components-text-input wc-block-components-address-form__delivery-datetime wc-better-billing-delivery-datetime';
        container.style.flex = 'none';
        container.style.width = '100%';

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'billing-delivery-date';
        input.name = 'billing_delivery_date';
        input.setAttribute('aria-label', 'Data de Entrega');
        input.setAttribute('aria-invalid', 'false');
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('inputmode', 'numeric');
        input.style.paddingRight = '36px';

        var label = document.createElement('label');
        label.setAttribute('for', 'billing-delivery-date');
        label.textContent = 'Data de Entrega';

        // Ícone de calendário (mesmo pattern do birthdate)
        var iconWrap = document.createElement('span');
        iconWrap.id = 'woo_better_gutenberg_delivery_calendar_icon';
        iconWrap.setAttribute('style',
            'display:flex;align-items:center;justify-content:center;position:absolute;right:12px;top:50%;' +
            'transform:translateY(-50%);width:24px;height:24px;cursor:pointer;z-index:2;pointer-events:auto;'
        );
        iconWrap.setAttribute('aria-label', 'Abrir calendário');
        iconWrap.setAttribute('tabindex', '0');
        iconWrap.setAttribute('role', 'button');
        iconWrap.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" ' +
            'stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>' +
            '<line x1="16" y1="2" x2="16" y2="6"></line>' +
            '<line x1="8" y1="2" x2="8" y2="6"></line>' +
            '<line x1="3" y1="10" x2="21" y2="10"></line>' +
            '</svg>';

        iconWrap.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            if (input._flatpickr) input._flatpickr.open();
        });

        // Error div
        var errDiv = document.createElement('div');
        errDiv.className = 'wc-block-components-validation-error wc-better-delivery-datetime';
        errDiv.setAttribute('role', 'alert');
        errDiv.style.display = 'none';
        var errP = document.createElement('p');
        errP.id = 'validate-error-billing-delivery-datetime';
        var svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        svgEl.setAttribute('viewBox', '-2 -2 24 24');
        svgEl.setAttribute('width', '24');
        svgEl.setAttribute('height', '24');
        svgEl.setAttribute('aria-hidden', 'true');
        svgEl.setAttribute('focusable', 'false');
        var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', 'M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z');
        svgEl.appendChild(pathEl);
        errP.appendChild(svgEl);
        var errSpan = document.createElement('span');
        errSpan.textContent = 'Selecione uma data e horário de entrega.';
        errP.appendChild(errSpan);
        errDiv.appendChild(errP);

        // Main wrapper: input + label + icon (same pattern as birthdate)
        var fieldMain = document.createElement('div');
        fieldMain.className = 'wc-better-delivery-datetime-main-wrapper';
        fieldMain.style.position = 'relative';
        fieldMain.appendChild(input);
        fieldMain.appendChild(label);
        fieldMain.appendChild(iconWrap);

        container.appendChild(fieldMain);
        container.appendChild(errDiv);

        referenceElement.insertAdjacentElement('afterend', container);

        deliveryInput = input;

        bindFieldEvents();
        return container;
    }

    // ── Events ───────────────────────────────────────────────────────────

    function bindFieldEvents() {
        if (!deliveryInput) return;
        if (deliveryInput.dataset.eventsBound === '1') return;
        deliveryInput.dataset.eventsBound = '1';

        deliveryInput.addEventListener('focus', function () {
            var c = getDeliveryContainer(); if (c) c.classList.add('is-active');
        });
        deliveryInput.addEventListener('blur', function () {
            var c = getDeliveryContainer();
            if (c && !deliveryInput.value.trim()) {
                c.classList.remove('is-active');
                showError('Selecione uma data e horário de entrega.');
            } else if (c && deliveryInput.value.trim()) {
                hideError();
                c.classList.add('is-active');
                // Se completou a data digitando, mostra slots e salva
                if (isDateComplete(deliveryInput.value.trim())) {
                    populateSlotSelect(deliveryInput);
                    var sVal = slotSelectEl ? slotSelectEl.value : '';
                    saveToStore(deliveryInput.value.trim(), sVal);
                }
            }
        });
        deliveryInput.addEventListener('input', function () {
            hideError();
            // Máscara conforme digita
            applyDateMask(deliveryInput);
        });
    }

    // ── Flatpickr ────────────────────────────────────────────────────────

    function updateActiveState() {
        var c = getDeliveryContainer();
        if (!c) return;
        if (deliveryInput && deliveryInput.value.trim()) {
            c.classList.add('is-active');
        } else {
            c.classList.remove('is-active');
        }
    }

    function initPicker(input) {
        var fp = flatpickr(input, {
            enableTime: false,
            dateFormat: 'd/m/Y',
            minDate: 'today',
            locale: Portuguese,
            clickOpens: false,   // só abre via ícone
            allowInput: true,    // permite digitar
            disable: [function (date) { return isDateDisabled(date); }],
            onChange: function (selectedDates, dateStr, instance) {
                if (dateStr && isDateComplete(dateStr)) {
                    hideError();
                    populateSlotSelect(input);
                    // Save date (slot comes from select change event or cache)
                    var sVal = slotSelectEl ? slotSelectEl.value : '';
                    saveToStore(dateStr, sVal);
                } else {
                    hideSlotSelect();
                }
                updateActiveState();
            },
            onClose: function (selectedDates, dateStr) {
                var val = input.value.trim();
                if (val && isDateComplete(val)) {
                    hideError();
                    populateSlotSelect(input);
                    var sVal = slotSelectEl ? slotSelectEl.value : '';
                    saveToStore(val, sVal);
                }
                updateActiveState();
            },
            onKeyDown: function (selectedDates, dateStr, instance, e) {
                // Permite teclas de controle
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
                    e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                    e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                    e.key === 'Home' || e.key === 'End' ||
                    e.key === 'Enter' || e.key === 'Escape') return;
                // Bloqueia letras
                if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                    return;
                }
                // Aplica máscara dd/mm/aaaa
                setTimeout(function () { applyDateMask(input); }, 0);
            },
        });
        input._flatpickr = fp;

        // Preenche valor salvo da sessão/user_meta
        var savedDate = (savedData.billing_delivery_date || '').trim();
        var savedSlot = (savedData.billing_delivery_time_slot || '').trim();

        // Fallback: combined value
        if (!savedDate) {
            var savedCombined = (savedData.billing_delivery_datetime || '').trim();
            if (savedCombined && savedCombined.length >= 10) {
                savedDate = savedCombined.split(' ')[0];
                savedSlot = savedCombined.substring(savedDate.length + 1);
            }
        }

        if (savedDate && savedDate.length === 10) {
            var parts = parseDateParts(savedDate);
            if (parts) {
                var savedDateObj = new Date(parts.year, parts.month - 1, parts.day);
                input._slotCache = {
                    dateKey: formatDateKey(savedDateObj),
                    value: savedSlot || '',
                };
                fp.setDate(savedDate, true);
                updateActiveState();
            }
        }

        return fp;
    }

    // ── Ensure field ─────────────────────────────────────────────────────

    function ensureField() {
        var ctx = getTargetContext();
        if (!ctx.container) return;
        if (!ensureAddressEditorOpen(ctx.containerType)) return;

        var current = getDeliveryContainer();
        if (current && fieldContainerType && fieldContainerType !== ctx.containerType) {
            removeField();
            current = null;
        }

        if (current) return;

        var ref = getReferenceElement(ctx.container);
        if (!ref) return;

        createField(ref);
        fieldContainerType = ctx.containerType;

        if (deliveryInput && !deliveryInput._flatpickr) {
            initPicker(deliveryInput);
            updateActiveState();
        }
    }

    // ── Place Order validation ───────────────────────────────────────────

    var placeOrderBound = false;
    function bindPlaceOrder() {
        if (placeOrderBound) return;
        var btn = document.querySelector('.wc-block-components-checkout-place-order-button') ||
                   document.querySelector('.wc-block-checkout__actions_row button');
        if (!btn) return;

        btn.addEventListener('click', function (e) {
            if (!deliveryInput) return;
            var dateOk = isDateComplete(deliveryInput.value.trim());
            var slotOk = slotSelectEl && slotSelectEl.value;
            if (!dateOk || !slotOk) {
                e.stopPropagation();
                e.preventDefault();
                if (!dateOk) {
                    showError('Selecione uma data de entrega.');
                } else {
                    showError('Selecione um horário de entrega.');
                }
                deliveryInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(function () { deliveryInput.focus(); }, 250);
            }
        });
        placeOrderBound = true;
    }

    // ── Bootstrap ────────────────────────────────────────────────────────

    var checkoutBlockFound = false;

    var observer = new MutationObserver(function () {
        var ctx = getTargetContext();

        if (ctx.container && !checkoutBlockFound) {
            checkoutBlockFound = true;
            setTimeout(function () { ensureField(); }, 200);
        }

        var existing = getDeliveryContainer();
        if (!existing && checkoutBlockFound && ctx.container) {
            setTimeout(function () { ensureField(); }, 300);
        }

        var sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]');
        if (sameAddressCheckbox && !sameAddressCheckbox.dataset.deliveryListener) {
            sameAddressCheckbox.addEventListener('change', function () {
                setTimeout(function () {
                    removeField();
                    ensureField();
                }, 300);
            });
            sameAddressCheckbox.dataset.deliveryListener = 'true';
        }

        bindPlaceOrder();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    ensureField();
    bindPlaceOrder();
});
