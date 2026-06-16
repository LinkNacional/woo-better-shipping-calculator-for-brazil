/**
 * Delivery Date & Time Picker for Gutenberg/Block Checkout
 *
 * Uses flatpickr (npm) to provide a date+time picker.
 * Injects field at the end of the billing address form.
 * Saves via wp.data Store API namespace 'woo_better_delivery_datetime'.
 *
 * @since 4.17.0
 */
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const scheduleData = window.WooBetterDeliverySchedule || {};
    const holidaysData = window.WooBetterDeliveryHolidays || {};
    const savedData = window.WooBetterDeliveryData || {};

    let deliveryInput = null;
    let fieldContainerType = null;
    let isCorrecting = false;

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
    const partialHolidays = {};

    holidaysData.forEach(function (h) {
        if (!h.date) return;
        const startH = typeof h.start_hour === 'number' ? h.start_hour : 0;
        const endH = typeof h.end_hour === 'number' ? h.end_hour : 24;
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
        let gs = Infinity, ge = -Infinity;
        timesArr.forEach(function (t) {
            if (t.startMin < gs) gs = t.startMin;
            if (t.endMin > ge) ge = t.endMin;
        });
        globalMinTime = minutesToTime(gs);
        globalMaxTime = minutesToTime(ge);
    }

    // ── disable / correct ────────────────────────────────────────────────

    function isDateDisabled(date) {
        const dateStr = formatDateKey(date);
        if (fullDayHolidays.has(dateStr)) return true;
        if (enabledDays.indexOf(date.getDay()) === -1) return true;
        return false;
    }

    function correctTimeIfNeeded(selDate) {
        const dateKey = formatDateKey(selDate);
        var mins = selDate.getHours() * 60 + selDate.getMinutes();
        var corrected = false;
        const partial = partialHolidays[dateKey];
        if (partial) {
            if (mins > partial.startMin && mins < partial.endMin) {
                var target;
                if (partial.startMin === 0) {
                    target = partial.endMin;
                } else if (partial.endMin >= 1440) {
                    target = partial.startMin;
                } else {
                    target = (mins - partial.startMin) <= (partial.endMin - mins) ? partial.startMin : partial.endMin;
                }
                if (target < 0) target = 0;
                if (target >= 1440) target = 1439;
                selDate.setHours(Math.floor(target / 60));
                selDate.setMinutes(target % 60);
                corrected = true;
            }
        }
        const sched = daySchedule[selDate.getDay()];
        if (sched) {
            mins = selDate.getHours() * 60 + selDate.getMinutes();
            if (mins < sched.startMin) { selDate.setHours(Math.floor(sched.startMin / 60)); selDate.setMinutes(sched.startMin % 60); corrected = true; }
            else if (mins > sched.endMin) { selDate.setHours(Math.floor(sched.endMin / 60)); selDate.setMinutes(sched.endMin % 60); corrected = true; }
        }
        return corrected;
    }

    // ── Store API ────────────────────────────────────────────────────────

    function saveToStore(value) {
        const payload = { billing_delivery_datetime: (value || '').trim() };
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                if (checkoutDispatch && checkoutDispatch.setExtensionData) {
                    checkoutDispatch.setExtensionData('woo_better_delivery_datetime', payload);
                }
            } catch (e) { /* silencioso */ }
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
        if (err) { err.style.display = 'block'; var s = err.querySelector('span'); if (s) s.textContent = msg || 'Selecione uma data e hora de entrega.'; }
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
        // Pega TODOS os campos filhos diretos (text-input, state-input, select-input etc),
        // não apenas .wc-block-components-text-input. Isso garante que o campo
        // fique depois de state, city, postcode etc — no final do formulário.
        var children = container.children;
        if (children.length === 0) return null;

        // Ignora hidden inputs e checkboxes (ficam no meio do form)
        for (var i = children.length - 1; i >= 0; i--) {
            var child = children[i];
            if (child.tagName === 'INPUT' && child.type === 'hidden') continue;
            if (child.classList.contains('wc-block-checkout__use-address-for-shipping')) continue;
            if (child.classList.contains('wc-block-checkout__use-address-for-billing')) continue;
            // Pula campos do próprio plugin para evitar auto-referência
            if (child.classList.contains('wc-block-components-address-form__birthdate')) continue;
            if (child.classList.contains('wc-block-components-address-form__gender')) continue;
            if (child.classList.contains('wc-block-components-address-form__delivery-datetime')) continue;
            // É um campo visível
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

    function clearStoreData() {
        var payload = { billing_delivery_datetime: '' };
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

    function removeField() {
        var container = getDeliveryContainer();
        if (container) container.remove();
        deliveryInput = null;
        fieldContainerType = null;
        clearStoreData();
    }

    function createField(referenceElement) {
        if (getDeliveryContainer()) return getDeliveryContainer();

        var container = document.createElement('div');
        container.className = 'wc-block-components-text-input wc-block-components-address-form__delivery-datetime wc-better-billing-delivery-datetime';

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'billing-delivery-datetime';
        input.name = 'billing_delivery_datetime';
        input.setAttribute('aria-label', 'Prazo de Entrega');
        input.setAttribute('aria-invalid', 'false');
        input.setAttribute('autocomplete', 'off');
        input.style.paddingRight = '36px';

        var label = document.createElement('label');
        label.setAttribute('for', 'billing-delivery-datetime');
        label.textContent = 'Prazo de Entrega';

        // Ícone de calendário
        var iconWrap = document.createElement('span');
        iconWrap.id = 'woo_better_gutenberg_delivery_calendar_icon';
        iconWrap.setAttribute('style',
            'display:flex;align-items:center;justify-content:center;position:absolute;right:8px;top:50%;' +
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

        iconWrap.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); input.focus(); });

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
        errSpan.textContent = 'Selecione uma data e hora de entrega.';
        errP.appendChild(errSpan);
        errDiv.appendChild(errP);

        // Wrapper principal: input + label + ícone. Mesmo padrão do campo IE
        // (wc-better-ie-main-wrapper) e birthdate (wc-better-birthdate-main-wrapper).
        // Mantém o ícone absolute alinhado ao input, sem descer quando o erro aparece abaixo.
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
                showError('Selecione uma data e hora de entrega.');
            } else if (c && deliveryInput.value.trim()) {
                c.classList.add('is-active');
            }
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
            enableTime: true,
            dateFormat: 'd/m/Y H:i',
            minDate: 'today',
            time_24hr: true,
            locale: Portuguese,
            minTime: globalMinTime,
            maxTime: globalMaxTime,
            disable: [function (date) { return isDateDisabled(date); }],
            onChange: function (selectedDates, dateStr, instance) {
                if (isCorrecting) return;
                if (selectedDates.length === 0) return;
                var d = new Date(selectedDates[0].getTime());
                if (correctTimeIfNeeded(d)) { isCorrecting = true; instance.setDate(d, false); isCorrecting = false; }
                saveToStore(dateStr);
                hideError();
                updateActiveState();
            },
            onOpen: function (selectedDates, dateStr, instance) {
                // Se focus veio do erro de validação (place order), fecha sem disparar onClose
                if (input._blockOpen) {
                    instance.close();
                    // Não reseta _blockOpen — onClose vai usá-lo para pular hideError
                    return;
                }
                if (!input._confirmBtn) {
                    var cal = instance.calendarContainer;
                    if (cal && !cal.querySelector('.wc-better-flatpickr-confirm')) {
                        var btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'wc-better-flatpickr-confirm';
                        btn.textContent = 'Confirmar';
                        btn.setAttribute('style',
                            'display:block;width:100%;padding:10px 0;' +
                            'border:none;border-radius:0 0 4px 4px;background:#2271b1;color:#fff;' +
                            'font-size:14px;font-weight:600;cursor:pointer;'
                        );
                        btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); instance.close(); });
                        cal.appendChild(btn);
                        input._confirmBtn = btn;
                    }
                }
            },
            onClose: function (selectedDates, dateStr) {
                if (input._blockOpen) {
                    input._blockOpen = false;
                    // Não esconde o erro — foi disparado pelo place order
                    updateActiveState();
                    return;
                }
                hideError();
                updateActiveState();
            },
        });
        input._flatpickr = fp;

        // Preenche valor salvo da sessão/user_meta (via wp_localize_script)
        var savedValue = (savedData.billing_delivery_datetime || '').trim();
        if (savedValue) {
            fp.setDate(savedValue, false);
            updateActiveState();
        }

        return fp;
    }

    // ── Ensure field ─────────────────────────────────────────────────────

    function ensureField() {
        var ctx = getTargetContext();
        if (!ctx.container) return;
        if (!ensureAddressEditorOpen(ctx.containerType)) return;

        var current = getDeliveryContainer();
        // Se o container mudou (checkbox toggle), remove e recria no novo local
        if (current && fieldContainerType && fieldContainerType !== ctx.containerType) {
            removeField();
            current = null;
        }

        if (current) return; // já existe, não recria

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
            if (!deliveryInput.value.trim()) {
                e.stopPropagation();
                e.preventDefault();
                showError();
                deliveryInput._blockOpen = true; // bloqueia abertura do calendário nesse focus
                deliveryInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(function () {
                    deliveryInput.focus();
                    // Adiciona has-error para destacar visualmente o campo
                    var c = getDeliveryContainer();
                    if (c) c.classList.add('has-error');
                }, 250);
            }
        });
        placeOrderBound = true;
    }

    // ── Bootstrap ────────────────────────────────────────────────────────

    var checkoutBlockFound = false;

    var observer = new MutationObserver(function () {
        var ctx = getTargetContext();

        // Detecta quando o bloco de checkout aparece pela primeira vez
        if (ctx.container && !checkoutBlockFound) {
            checkoutBlockFound = true;
            setTimeout(function () { ensureField(); }, 200);
        }

        // Se campo sumiu (ex: toggle checkbox), recria
        var existing = getDeliveryContainer();
        if (!existing && checkoutBlockFound && ctx.container) {
            setTimeout(function () { ensureField(); }, 300);
        }

        // Listener no checkbox de "usar mesmo endereço"
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
