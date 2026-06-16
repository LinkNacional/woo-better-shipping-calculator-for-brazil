/**
 * Birthdate Field for Classic/Shortcode Checkout
 *
 * Uses flatpickr (npm) for date-only picker.
 * Auto-formats as dd/mm/aaaa as user types. Validates: not future, not >120 years.
 *
 * @since 4.17.0
 */
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var birthdateInput = document.getElementById('billing_birthdate');
    if (!birthdateInput) return;

    birthdateInput.setAttribute('inputmode', 'numeric');

    var now = new Date();
    var maxDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var minDate = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());

    // ── Auto-mask: dd/mm/aaaa ────────────────────────────────────────────

    function applyBirthdateMask(input) {
        var val = input.value.replace(/\D/g, '').substring(0, 8);
        if (val.length > 4) {
            val = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
        } else if (val.length > 2) {
            val = val.substring(0, 2) + '/' + val.substring(2);
        }
        input.value = val;
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

        var nowDate = new Date();
        nowDate.setHours(0, 0, 0, 0);
        if (dateObj > nowDate) return { valid: false, message: 'A data de nascimento não pode ser no futuro.' };

        var maxAgeObj = new Date();
        maxAgeObj.setFullYear(nowDate.getFullYear() - 120);
        if (dateObj < maxAgeObj) return { valid: false, message: 'Verifique a data de nascimento. Idade não pode ser superior a 120 anos.' };

        return { valid: true };
    }

    function toggleWooError(valid, message) {
        var wrapper = document.getElementById('billing_birthdate_field');
        if (!wrapper) return;
        if (!valid) {
            wrapper.classList.add('woocommerce-invalid', 'woocommerce-invalid-required-field');
        } else {
            wrapper.classList.remove('woocommerce-invalid', 'woocommerce-invalid-required-field');
        }
    }

    // ── Calendar Icon ────────────────────────────────────────────────────

    function injectCalendarIcon(input) {
        var fieldWrapper = document.getElementById('billing_birthdate_field');
        if (!fieldWrapper) return;
        if (document.getElementById('wc-better-birthdate-calendar-icon')) return;

        var inputWrapper = fieldWrapper.querySelector('.woocommerce-input-wrapper');
        if (!inputWrapper) return;

        inputWrapper.style.position = 'relative';

        var iconWrap = document.createElement('span');
        iconWrap.id = 'wc-better-birthdate-calendar-icon';
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

        iconWrap.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            if (input._flatpickr) input._flatpickr.open();
        });

        input.style.paddingRight = '36px';
        inputWrapper.appendChild(iconWrap);
    }

    // ── Flatpickr ────────────────────────────────────────────────────────

    // Converte ISO (Y-m-d) para d/m/Y para o defaultDate
    var savedValue = '';
    if (typeof wc_better_checkout_shortcode_birthdate_vars !== 'undefined' &&
        wc_better_checkout_shortcode_birthdate_vars.billing_birthdate) {
        var raw = wc_better_checkout_shortcode_birthdate_vars.billing_birthdate;
        // Se for Y-m-d (10 chars, tem hífen), converte
        if (raw.length === 10 && raw.indexOf('-') > -1) {
            var isoParts = raw.split('-');
            savedValue = isoParts[2] + '/' + isoParts[1] + '/' + isoParts[0];
        } else {
            savedValue = raw;
        }
    }

    function createFlatpickr(input) {
        return flatpickr(input, {
            enableTime: false,
            dateFormat: 'd/m/Y',
            maxDate: maxDate,
            minDate: minDate,
            allowInput: true,
            clickOpens: false,
            locale: Portuguese,
            defaultDate: savedValue || undefined,
            onChange: function (selectedDates, dateStr, instance) {
                if (dateStr && dateStr.length === 10) {
                    var result = validateBirthdate(dateStr);
                    toggleWooError(result.valid, result.message);
                }
                if (typeof jQuery !== 'undefined') {
                    jQuery('body').trigger('update_checkout');
                }
            },
            onClose: function (selectedDates, dateStr) {
                if (!dateStr || dateStr.length < 10) return;
                var result = validateBirthdate(dateStr);
                toggleWooError(result.valid, result.message);
            },
            onKeyDown: function (selectedDates, dateStr, instance, e) {
                // Permite teclas de controle/navegação
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'Tab' ||
                    e.key === 'ArrowLeft' || e.key === 'ArrowRight' ||
                    e.key === 'ArrowUp' || e.key === 'ArrowDown' ||
                    e.key === 'Home' || e.key === 'End' ||
                    e.key === 'Enter' || e.key === 'Escape') return;
                // Bloqueia não-dígitos
                if (!/^\d$/.test(e.key)) {
                    e.preventDefault();
                    return;
                }
                // Aplica máscara após a tecla ser processada
                setTimeout(function () { applyBirthdateMask(input); }, 0);
            },
        });
    }

    var fp = createFlatpickr(birthdateInput);
    injectCalendarIcon(birthdateInput);

    // Observer para recriar se o campo for destruído por AJAX
    var observer = new MutationObserver(function () {
        var input = document.getElementById('billing_birthdate');
        if (input && input !== birthdateInput && !input._flatpickr) {
            input.setAttribute('inputmode', 'numeric');
            birthdateInput = input;
            createFlatpickr(input);
            injectCalendarIcon(input);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
