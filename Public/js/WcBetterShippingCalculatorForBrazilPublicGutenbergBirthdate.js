/**
 * Birthdate Field for Gutenberg/Block Checkout
 *
 * Uses flatpickr (npm) for date-only picker.
 * Auto-formats as dd/mm/aaaa as user types. Validates: not future, not >120 years.
 * Saves via wp.data Store API namespace 'woo_better_birthdate'.
 *
 * @since 4.17.0
 */
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const savedData = window.WooBetterBirthdateData || {};

    let birthdateInput = null;
    let fieldContainerType = null;

    // ── Store API ────────────────────────────────────────────────────────

    function saveToStore(dateStr) {
        // Converte d/m/Y para Y-m-d (ISO)
        var parts = dateStr.split('/');
        if (parts.length !== 3) return;
        var iso = parts[2] + '-' + parts[1] + '-' + parts[0];
        var payload = { billing_birthdate: iso };
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                var checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                if (checkoutDispatch && checkoutDispatch.setExtensionData) {
                    checkoutDispatch.setExtensionData('woo_better_birthdate', payload);
                }
            } catch (e) { /* silencioso */ }
        }
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({ namespace: 'woo_better_birthdate', data: payload });
        }
    }

    function clearStoreData() {
        var payload = { billing_birthdate: '' };
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                var checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                if (checkoutDispatch && checkoutDispatch.setExtensionData) {
                    checkoutDispatch.setExtensionData('woo_better_birthdate', payload);
                }
            } catch (e) {}
        }
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({ namespace: 'woo_better_birthdate', data: payload });
        }
    }

    // ── Validation ───────────────────────────────────────────────────────

    function validateBirthdate(dateStr) {
        var parts = dateStr.split('/');
        if (parts.length !== 3) return { valid: false, message: 'Formato inválido. Use dd/mm/aaaa.' };
        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10);
        var year = parseInt(parts[2], 10);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return { valid: false, message: 'Data inválida.' };
        if (year < 1000 || year > 9999) return { valid: false, message: 'Ano inválido.' };
        var dateObj = new Date(year, month - 1, day);
        if (dateObj.getDate() !== day || dateObj.getMonth() !== month - 1 || dateObj.getFullYear() !== year) {
            return { valid: false, message: 'Data inválida.' };
        }
        var now = new Date(); now.setHours(0, 0, 0, 0);
        if (dateObj > now) return { valid: false, message: 'A data de nascimento não pode ser no futuro.' };
        var maxAge = new Date(); maxAge.setFullYear(now.getFullYear() - 120);
        if (dateObj < maxAge) return { valid: false, message: 'Verifique a data de nascimento. Idade não pode ser superior a 120 anos.' };
        return { valid: true };
    }

    // ── Mask ─────────────────────────────────────────────────────────────

    function applyBirthdateMask(input) {
        var val = input.value.replace(/\D/g, '').substring(0, 8);
        if (val.length > 4) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
        } else if (val.length > 2) {
            val = val.substring(0, 2) + '/' + val.substring(2);
        }
        input.value = val;
    }

    // ── DOM builders ─────────────────────────────────────────────────────

    function getBirthdateContainer() {
        return document.querySelector('.wc-better-billing-birthdate');
    }

    function getBirthdateErrorContainer() {
        return document.querySelector('.wc-block-components-validation-error.wc-better-birthdate');
    }

    function showError(msg) {
        var err = getBirthdateErrorContainer();
        if (err) { err.style.display = 'block'; var s = err.querySelector('span'); if (s) s.textContent = msg || 'Por favor, insira uma data válida.'; }
        var c = getBirthdateContainer(); if (c) c.classList.add('has-error');
        if (birthdateInput) birthdateInput.setAttribute('aria-invalid', 'true');
    }

    function hideError() {
        var err = getBirthdateErrorContainer();
        if (err) err.style.display = 'none';
        var c = getBirthdateContainer(); if (c) c.classList.remove('has-error');
        if (birthdateInput) birthdateInput.setAttribute('aria-invalid', 'false');
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
        var containerType = container.id;
        var lastNameField = container.querySelector('#' + containerType + '-last_name');
        if (lastNameField) {
            return lastNameField.closest('.wc-block-components-text-input') || lastNameField;
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
        var container = getBirthdateContainer();
        if (container) container.remove();
        birthdateInput = null;
        fieldContainerType = null;
        clearStoreData();
    }

    function createField(referenceElement) {
        if (getBirthdateContainer()) return getBirthdateContainer();

        var container = document.createElement('div');
        container.className = 'wc-block-components-text-input wc-block-components-address-form__birthdate wc-better-billing-birthdate';

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'woo_better_birthdate';
        input.name = 'woo_better_birthdate';
        input.setAttribute('aria-label', 'Data de Nascimento');
        input.setAttribute('aria-invalid', 'false');
        input.setAttribute('autocomplete', 'bday');
        input.setAttribute('inputmode', 'numeric');
        input.style.paddingRight = '36px';

        var label = document.createElement('label');
        label.setAttribute('for', 'woo_better_birthdate');
        label.textContent = 'Data de Nascimento';

        // Ícone de calendário — mesma estrutura do delivery-datetime
        var iconWrap = document.createElement('span');
        iconWrap.id = 'woo_better_gutenberg_birthdate_calendar_icon';
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

        iconWrap.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); if (input._flatpickr) input._flatpickr.open(); });

        // Error div — mesma estrutura do delivery-datetime
        var errDiv = document.createElement('div');
        errDiv.className = 'wc-block-components-validation-error wc-better-birthdate';
        errDiv.setAttribute('role', 'alert');
        errDiv.style.display = 'none';
        var errP = document.createElement('p');
        errP.id = 'validate-error-birthdate';
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
        errSpan.textContent = 'Por favor, insira uma data válida.';
        errP.appendChild(errSpan);
        errDiv.appendChild(errP);

        // Wrapper principal: input + label + ícone. Mesmo padrão do campo IE
        // (wc-better-ie-main-wrapper). Mantém o ícone absolute alinhado ao input,
        // sem descer quando o erro aparece abaixo.
        var fieldMain = document.createElement('div');
        fieldMain.className = 'wc-better-birthdate-main-wrapper';
        fieldMain.style.position = 'relative';
        fieldMain.appendChild(input);
        fieldMain.appendChild(label);
        fieldMain.appendChild(iconWrap);

        container.appendChild(fieldMain);
        container.appendChild(errDiv);

        // Insere após o elemento de referência (último da cadeia PersonType ou lastName)
        // Insere IMEDIATAMENTE após o elemento de referência (lastName wrapper).
        // Se outros scripts (PersonType) já inseriram campos depois do lastName,
        // o insertBefore empurra esses campos pra frente, mantendo birthdate
        // sempre colado no lastName.
        referenceElement.parentElement.insertBefore(container, referenceElement.nextSibling);

        birthdateInput = input;

        bindFieldEvents();
        return container;
    }

    // ── Events ───────────────────────────────────────────────────────────

    function bindFieldEvents() {
        if (!birthdateInput) return;
        if (birthdateInput.dataset.eventsBound === '1') return;
        birthdateInput.dataset.eventsBound = '1';

        birthdateInput.addEventListener('focus', function () {
            var c = getBirthdateContainer(); if (c) c.classList.add('is-active');
        });
        birthdateInput.addEventListener('blur', function () {
            var c = getBirthdateContainer();
            if (c && !birthdateInput.value.trim()) {
                c.classList.remove('is-active');
                showError('Por favor, insira sua data de nascimento.');
            } else if (c && birthdateInput.value.trim()) {
                c.classList.add('is-active');
            }
        });
    }

    // ── Flatpickr ────────────────────────────────────────────────────────

    function updateActiveState() {
        var c = getBirthdateContainer();
        if (!c) return;
        if (birthdateInput && birthdateInput.value.trim()) {
            c.classList.add('is-active');
        } else {
            c.classList.remove('is-active');
        }
    }

    function initPicker(input) {
        var now = new Date();
        var maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        var minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());

        var fp = flatpickr(input, {
            enableTime: false,
            dateFormat: 'd/m/Y',
            maxDate: maxDate,
            minDate: minDate,
            locale: Portuguese,
            clickOpens: false,   // não abre ao focar — só via ícone
            allowInput: true,     // permite digitar
            onChange: function (selectedDates, dateStr, instance) {
                if (dateStr && dateStr.length === 10) {
                    var result = validateBirthdate(dateStr);
                    if (result.valid) {
                        hideError();
                        saveToStore(dateStr);
                    } else {
                        showError(result.message);
                    }
                }
                updateActiveState();
            },
            onClose: function (selectedDates, dateStr) {
                if (dateStr && dateStr.length === 10) {
                    var result = validateBirthdate(dateStr);
                    if (result.valid) {
                        hideError();
                        saveToStore(dateStr);
                    } else {
                        showError(result.message);
                    }
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
                // Aplica máscara dd/mm/aaaa após digitar
                setTimeout(function () { applyBirthdateMask(input); }, 0);
            },
        });
        input._flatpickr = fp;

        // Preenche valor salvo — converte ISO Y-m-d para d/m/Y
        var savedValue = (savedData.billing_birthdate || '').trim();
        if (savedValue && savedValue.length === 10 && savedValue.indexOf('-') > -1) {
            var isoParts = savedValue.split('-');
            savedValue = isoParts[2] + '/' + isoParts[1] + '/' + isoParts[0];
        }
        if (savedValue && savedValue.length === 10) {
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

        var current = getBirthdateContainer();
        if (current && fieldContainerType && fieldContainerType !== ctx.containerType) {
            removeField();
            current = null;
        }

        if (current) return;

        var ref = getReferenceElement(ctx.container);
        if (!ref) return;

        createField(ref);
        fieldContainerType = ctx.containerType;

        if (birthdateInput && !birthdateInput._flatpickr) {
            initPicker(birthdateInput);
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
            if (!birthdateInput) return;
            if (!birthdateInput.value.trim()) {
                e.stopPropagation();
                e.preventDefault();
                showError('Por favor, insira sua data de nascimento.');
                birthdateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(function () { birthdateInput.focus(); }, 250);
                return;
            }
            var result = validateBirthdate(birthdateInput.value);
            if (!result.valid) {
                e.stopPropagation();
                e.preventDefault();
                showError(result.message);
                birthdateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

        var existing = getBirthdateContainer();
        if (!existing && checkoutBlockFound && ctx.container) {
            setTimeout(function () { ensureField(); }, 300);
        }

        var sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]');
        if (sameAddressCheckbox && !sameAddressCheckbox.dataset.birthdateListener) {
            sameAddressCheckbox.addEventListener('change', function () {
                setTimeout(function () {
                    removeField();
                    ensureField();
                }, 300);
            });
            sameAddressCheckbox.dataset.birthdateListener = 'true';
        }

        bindPlaceOrder();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    ensureField();
    bindPlaceOrder();
});
