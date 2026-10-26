import {
    attachBrazilPhoneMask,
    brazilMaskType,
    brazilPhoneIsEmpty,
    brazilPhoneInvalid,
    isRequiredPhoneField,
    showBrazilPhoneError
} from './core/BrazilPhoneMask.js';

/**
 * Máscara de telefone SOMENTE BRASIL — sem intl-tel-input, sem DDI e sem bandeira.
 *
 * Roda no checkout clássico (shortcode [woocommerce_checkout]) e na edição de
 * endereço da conta quando a opção "Telefone com Máscara e DDI" está DESLIGADA
 * (qualquer modo do plugin que não seja os dois "Desabilitar"):
 *
 *   - Celular: (DD) NNNNN-NNNN
 *   - Fixo:    (DD) NNNN-NNNN
 *   - "Celular e Fixo": as duas máscaras, com autodetecção pelo tamanho digitado.
 *
 * É um bundle SEPARADO (e leve) do `...CheckoutPhoneMaskShortcode`, que carrega a
 * lib/DDI: assim quem desliga a lib não paga o peso do intl-tel-input. O `+55` é
 * concatenado no backend (o campo só mostra o número nacional).
 *
 * Os dados vêm de `wc_better_checkout_phone_mask_vars` (wp_localize_script).
 */
(function () {
    'use strict';

    var config = (typeof wc_better_checkout_phone_mask_vars !== 'undefined') ? wc_better_checkout_phone_mask_vars : {};

    // Com a lib/DDI ligada quem assume é o outro bundle.
    var maskEnabled = config.phoneMaskEnabled === 'true' || config.phoneMaskEnabled === true;
    if (maskEnabled) {
        return;
    }

    var validateDdd = config.validateDdd === 'true' || config.validateDdd === true;
    var phoneMode = (typeof config.phoneMode !== 'undefined') ? config.phoneMode : '';

    // No modo "apenas celular" o telefone nativo é removido e o campo "Celular"
    // assume o papel de telefone. Nos demais, o celular é um campo SEPARADO (e
    // também recebe a máscara).
    var PHONE_FIELDS = (phoneMode === 'cellphone_only')
        ? ['#billing_cellphone', '#shipping_cellphone']
        : ['#billing_phone', '#shipping_phone', '#billing-phone', '#shipping-phone'];

    var CELLPHONE_FIELDS = ['#billing_cellphone', '#shipping_cellphone'];

    var MASK_FIELDS = PHONE_FIELDS.concat(CELLPHONE_FIELDS).filter(function (selector, index, list) {
        return list.indexOf(selector) === index;
    });

    /**
     * Tipo de máscara de um campo.
     *
     * @param {string} selector Seletor do campo.
     * @returns {string} 'auto' | 'mobile' | 'landline'
     */
    function brazilTypeFor(selector) {
        if (phoneMode === 'cellphone_only' || selector.indexOf('cellphone') !== -1) {
            return 'mobile';
        }

        return brazilMaskType('phone', phoneMode);
    }

    /**
     * Liga a máscara BR no campo (idempotente).
     *
     * @param {HTMLInputElement} field
     * @param {string}           selector Seletor que encontrou o campo.
     * @returns {void}
     */
    function initField(field, selector) {
        if (!field) {
            return;
        }

        field.setAttribute('inputmode', 'numeric');
        // Número nacional (sem código do país): reduz a chance do navegador
        // autocompletar com "+55" embutido no campo.
        field.setAttribute('autocomplete', 'tel-national');

        attachBrazilPhoneMask(field, brazilTypeFor(selector || field.id || ''));
    }

    function initAll() {
        MASK_FIELDS.forEach(function (selector) {
            initField(document.querySelector(selector), selector);
        });

        bindBrazilValidation();
    }

    /**
     * Validação no envio (edição de endereço da conta). No checkout clássico a
     * validação é feita no PHP (`woocommerce_checkout_process`), então ignoramos os
     * formulários de checkout aqui. Só valida campos OBRIGATÓRIOS.
     *
     * @returns {void}
     */
    function bindBrazilValidation() {
        if (!validateDdd) {
            return;
        }

        MASK_FIELDS.forEach(function (selector) {
            var field = document.querySelector(selector);
            if (!field) {
                return;
            }

            var form = field.closest('form');
            if (!form || form.classList.contains('checkout') || form.classList.contains('woocommerce-checkout')) {
                return;
            }
            if (form.dataset.wcBetterBrazilBound === 'true') {
                return;
            }
            form.dataset.wcBetterBrazilBound = 'true';

            form.addEventListener('submit', function (event) {
                var invalidField = null;

                MASK_FIELDS.some(function (sel) {
                    var candidate = document.querySelector(sel);

                    // Um campo só com o DDI (`+55`) conta como vazio.
                    if (!candidate || brazilPhoneIsEmpty(candidate.value) || !isRequiredPhoneField(candidate)) {
                        return false;
                    }
                    if (brazilPhoneInvalid(candidate.value, brazilTypeFor(sel))) {
                        invalidField = candidate;
                        return true;
                    }

                    return false;
                });

                if (!invalidField) {
                    return;
                }

                event.preventDefault();
                event.stopPropagation();
                showBrazilPhoneError(invalidField);
            });
        });
    }

    function init() {
        initAll();

        // Reexecuta quando o checkout recalcula campos (ex.: "enviar para outro
        // endereço") — `initAll` é idempotente.
        var observer = new MutationObserver(initAll);
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // O script é enfileirado no <head> (sem `in_footer`): só age com o body pronto.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
