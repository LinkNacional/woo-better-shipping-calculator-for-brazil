import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import intlTelInputUtils from 'intl-tel-input/build/js/utils.js';
import { pt } from 'intl-tel-input/i18n';

/**
 * Máscara de telefone no checkout CLÁSSICO (shortcode [woocommerce_checkout]).
 *
 * Aplica a formatação NATIVA do intl-tel-input (formatAsYouType + loadUtils,
 * API v25) diretamente nos campos nativos do WooCommerce
 * (#billing_phone/#shipping_phone). O antigo motor de formatação caseiro foi
 * removido; a restrição de digitação (apenas dígitos + um "+" inicial) fica a
 * cargo do sanitizador universal (PublicPhoneSanitizer).
 *
 * O DDI (bandeira + código do país) só é exibido quando as opções
 * "Telefone com Máscara e DDI" E "Exibir Código do País (DDI)" estão ligadas.
 */
jQuery(function ($) {
    const config = (typeof wc_better_checkout_phone_mask_vars !== 'undefined') ? wc_better_checkout_phone_mask_vars : {};

    const truthy = function (value) {
        return value === 'true' || value === true;
    };

    const phoneMaskEnabled = truthy(config.phoneMaskEnabled);
    const showCountryCode = truthy(config.showCountryCode);
    const validateDdd = truthy(config.validateDdd);
    // DDI exibido apenas com máscara + "Exibir Código do País (DDI)".
    const dialCodeShown = phoneMaskEnabled && showCountryCode;

    const PHONE_FIELDS = ['#billing_phone', '#shipping_phone', '#billing-phone', '#shipping-phone'];

    const DIAL_TO_ISO = {
        '+55': 'br', '+1': 'us', '+44': 'gb', '+33': 'fr', '+49': 'de', '+34': 'es',
        '+39': 'it', '+351': 'pt', '+54': 'ar', '+56': 'cl', '+57': 'co', '+51': 'pe',
        '+52': 'mx'
    };

    /**
     * Nome do campo hidden que guarda o DDI (lido pelo backend no POST).
     *
     * @param {HTMLInputElement} field
     * @returns {string}
     */
    // Nome do campo hidden registrado pelo plugin (woocommerce_checkout_fields),
    // que o backend lê em process_checkout_data_classic ($data['billing_phone_country']).
    function hiddenNameFor(field) {
        if (field.id.indexOf('billing') !== -1) {
            return 'billing_phone_country';
        }
        if (field.id.indexOf('shipping') !== -1) {
            return 'shipping_phone_country';
        }
        return '';
    }

    /**
     * Lê o DDI salvo no campo hidden.
     *
     * @param {HTMLInputElement} field
     * @returns {string} Ex.: "+55" (ou string vazia)
     */
    function readStoredDial(field) {
        const name = hiddenNameFor(field);
        if (!name) {
            return '';
        }
        const hidden = document.querySelector('input[name="' + name + '"]');
        if (hidden && hidden.value) {
            return String(hidden.value).replace(/[^\d+]/g, '');
        }
        return '';
    }

    /**
     * DDI salvo para o campo. Prioriza o valor vindo do PHP (sessão, usado no
     * checkout clássico) e cai no hidden field (default +55) nas demais telas.
     *
     * @param {HTMLInputElement} field
     * @returns {string} Ex.: '+55'
     */
    function savedDialFor(field) {
        const name = hiddenNameFor(field);
        let dial = '';
        if (name === 'billing_phone_country') {
            dial = config.billingCountry || '';
        } else if (name === 'shipping_phone_country') {
            dial = config.shippingCountry || '';
        }
        dial = String(dial).replace(/[^\d+]/g, '');
        return dial || readStoredDial(field) || '+55';
    }

    /**
     * Normaliza o valor que o autofill/autocomplete injeta no campo.
     *
     * O navegador pode preencher o telefone em vários formatos. A regra é:
     *  - "+55..."            → remove o DDI (a bandeira já o representa) e remonta.
     *  - "55..." (>=12 díg.) → DDI embutido sem "+": remove para não duplicar.
     *  - sem "+" e sem "55"  → insere direto, sem tratativa (não prefixa DDI).
     *  - "+<outro DDI>"      → estrangeiro: não mexemos (a lib troca a bandeira).
     *
     * @param {HTMLInputElement} field
     * @param {object}           iti
     * @param {string}           storedDial Ex.: '+55'
     */
    function normalizeAutofill(field, iti, storedDial, force) {
        const raw = String(field.value || '').trim();
        if (!raw) {
            return;
        }

        const digits = raw.replace(/\D/g, '');
        if (!digits) {
            return;
        }

        // DDI brasileiro embutido no número (com ou sem "+"). Detecta pelo
        // CONTEÚDO ("55" no início + tamanho internacional), independente da
        // bandeira selecionada.
        const brazilianDial = digits.indexOf('55') === 0 && digits.length >= 12;

        let national = null;

        if (raw.charAt(0) === '+') {
            if (brazilianDial) {
                national = digits.slice(2);
            } else {
                // DDI estrangeiro explícito: deixa a lib trocar a bandeira.
                return;
            }
        } else if (brazilianDial) {
            // DDI brasileiro sem "+" (ex.: "5585988888888"): remove para não duplicar.
            national = digits.slice(2);
        } else {
            // Sem "+" e sem o DDI "55" embutido: insere direto, sem tratativa.
            // Não prefixa DDI — a bandeira selecionada resolve o DDI no envio.
            return;
        }

        if (!national || national.length < 10) {
            return;
        }

        const international = '+55' + national;
        const apply = function () {
            // "force" (evento input/autocomplete) aplica mesmo com o campo em
            // foco, para a correção ser imediata; nos demais casos preserva o
            // foco para não pular o cursor durante a digitação.
            if (!force && document.activeElement === field) {
                return;
            }
            field.dataset.wcBetterNormalizing = 'true';
            try {
                iti.setNumber(international);
            } catch (error) {
                // Silencioso.
            }
            field.dataset.wcBetterNormalizing = 'false';
        };

        if (iti.promise && typeof iti.promise.then === 'function') {
            iti.promise.then(apply).catch(function () {
                field.dataset.wcBetterNormalizing = 'false';
            });
        } else {
            apply();
        }
    }

    /**
     * Grava o DDI nos campos hidden (o principal com o nome que o backend lê) e
     * dispara "change" para o WooCommerce reconhecer a alteração.
     *
     * @param {HTMLInputElement} field
     * @param {string}           dialCode Ex.: "+55"
     */
    function setHiddenCountry(field, dialCode) {
        const name = hiddenNameFor(field);
        if (!name) {
            return;
        }

        let hidden = document.querySelector('input[name="' + name + '"]');
        if (!hidden) {
            hidden = document.createElement('input');
            hidden.type = 'hidden';
            hidden.name = name;
            const form = document.querySelector('form.checkout, form[name="checkout"]');
            if (form) {
                form.appendChild(hidden);
            }
        }
        hidden.value = dialCode;
        $(hidden).trigger('change');
    }

    /**
     * Aplica o deslocamento (padding-left) do intl-tel-input no input e na label.
     *
     * @param {HTMLInputElement} field
     */
    function applyInputPadding(field) {
        if (!field || field.tagName !== 'INPUT') {
            return;
        }

        const fallbackPadding = dialCodeShown ? 78 : 52;
        let inputPadding = fallbackPadding;
        const pl = field.style.paddingLeft || window.getComputedStyle(field).paddingLeft;
        if (pl && pl.endsWith('px')) {
            inputPadding = parseInt(pl.replace('px', ''), 10) || fallbackPadding;
        }
        field.style.setProperty('padding-left', inputPadding + 'px', 'important');

        const container = field.closest('.form-row, .woocommerce-input-wrapper');
        const label = container ? container.querySelector('label') : null;
        if (label) {
            label.style.setProperty('padding-left', (inputPadding + 2) + 'px', 'important');
        }
    }

    /**
     * Inicializa a máscara em um campo de telefone (idempotente).
     *
     * @param {HTMLInputElement} field
     */
    function initField(field) {
        if (!field || field.dataset.intlTelInputInitialized) {
            return;
        }

        field.setAttribute('inputmode', 'numeric');
        // Número nacional (sem código do país): reduz a chance do navegador
        // autocompletar com "+55" embutido no campo.
        field.setAttribute('autocomplete', 'tel-national');

        const storedDial = savedDialFor(field);
        const initialCountry = DIAL_TO_ISO[storedDial] || 'br';

        // Sem DDI exibido separadamente, garante o valor internacional no input
        // (prefixa o DDI salvo quando o número ainda não começa com "+").
        if (!dialCodeShown) {
            const raw = String(field.value || '').trim();
            if (raw && raw.charAt(0) !== '+') {
                const digits = raw.replace(/[^\d]/g, '');
                if (digits) {
                    field.value = (storedDial || '+55') + digits;
                }
            }
        }

        const iti = intlTelInput(field, {
            initialCountry: initialCountry,
            preferredCountries: ['br'],
            // Exibe a bandeira + o código do país (DDI) quando habilitado.
            separateDialCode: dialCodeShown,
            nationalMode: false,
            formatOnDisplay: true,
            // Na v25 "utilsScript" foi removida; sem loadUtils a formatação
            // enquanto digita não acontece.
            loadUtils: function () {
                return Promise.resolve({ default: intlTelInputUtils });
            },
            autoHideDialCode: false,
            placeholderNumberType: 'MOBILE',
            showSelectedDialCode: false,
            allowDropdown: true,
            autoPlaceholder: 'off',
            strictMode: false,
            validation: false,
            // Valida o número usando a metadata do libphonenumber (~300 países).
            // Fixo + celular: sem esta opção o default ['MOBILE'] rejeitaria fixo.
            validationNumberTypes: ['FIXED_LINE', 'MOBILE'],
            i18n: pt
        });

        field.dataset.intlTelInputInitialized = 'true';
        field.wcBetterIti = iti;

        // Sincroniza o DDI inicial sem depender de interação.
        setHiddenCountry(field, '+' + iti.getSelectedCountryData().dialCode);

        // Normaliza o valor já presente (autofill que veio antes do JS rodar).
        normalizeAutofill(field, iti, storedDial);

        field.addEventListener('countrychange', function () {
            applyInputPadding(field);
            setHiddenCountry(field, '+' + iti.getSelectedCountryData().dialCode);
            $(field).trigger('change');
        });

        field.addEventListener('input', function () {
            applyInputPadding(field);
            // Autofill/autocomplete dispara "input": normaliza já, sem esperar blur.
            normalizeAutofill(field, iti, storedDial, true);
        });

        // Autofill/autocomplete dispara "change": normaliza o formato injetado.
        field.addEventListener('change', function () {
            if (field.dataset.wcBetterNormalizing === 'true') {
                return;
            }
            normalizeAutofill(field, iti, storedDial);
        });

        applyInputPadding(field);
    }

    /**
     * Verifica se o telefone é inválido, usando a biblioteca (libphonenumber).
     *
     * @param {HTMLInputElement} field
     * @returns {boolean}
     */
    function phoneErrorCode(field) {
        const iti = field.wcBetterIti;
        if (!iti || typeof iti.isValidNumberPrecise !== 'function') {
            return false;
        }
        // null = utils ainda não carregadas: não bloqueia.
        return iti.isValidNumberPrecise() === false;
    }

    function initAll() {
        PHONE_FIELDS.forEach(function (selector) {
            initField(document.querySelector(selector));
        });
        bindDddValidation();
    }

    // Validação de DDD na edição de endereço (minha conta). No checkout clássico
    // a validação é feita no PHP (woocommerce_checkout_process), então ignoramos
    // os formulários de checkout aqui.
    function bindDddValidation() {
        if (!(validateDdd && phoneMaskEnabled)) {
            return;
        }

        PHONE_FIELDS.forEach(function (selector) {
            const field = document.querySelector(selector);
            if (!field) {
                return;
            }
            const form = field.closest('form');
            if (!form || form.classList.contains('checkout') || form.classList.contains('woocommerce-checkout')) {
                return;
            }
            if (form.dataset.wcBetterDddBound === 'true') {
                return;
            }
            form.dataset.wcBetterDddBound = 'true';

            form.addEventListener('submit', function (event) {
                let invalidField = null;
                PHONE_FIELDS.some(function (sel) {
                    const f = document.querySelector(sel);
                    if (!f || !f.value.trim()) {
                        return false;
                    }
                    if (phoneErrorCode(f)) {
                        invalidField = f;
                        return true;
                    }
                    return false;
                });

                if (invalidField) {
                    event.preventDefault();
                    event.stopPropagation();
                    invalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(function () {
                        invalidField.focus();
                    }, 250);
                    // Mensagem de erro inline (sem recarregar a página).
                    const row = invalidField.closest('.form-row');
                    if (row) {
                        row.classList.add('woocommerce-invalid');
                        const existing = row.querySelector('.wc-better-ddd-error');
                        if (existing) {
                            existing.remove();
                        }
                        const note = document.createElement('p');
                        note.className = 'wc-better-ddd-error';
                        note.style.color = '#b00020';
                        note.style.margin = '4px 0 0';
                        note.textContent = 'Número de telefone inválido.';
                        row.appendChild(note);
                    }
                }
            });
        });
    }

    initAll();

    // Reexecuta quando o checkout recalcula campos (ex.: "enviar para outro endereço").
    const observer = new MutationObserver(function () {
        initAll();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Autofill nem sempre dispara "change": reaplica a normalização
    // periodicamente (idempotente e ignora o campo em foco).
    setInterval(function () {
        PHONE_FIELDS.forEach(function (selector) {
            const field = document.querySelector(selector);
            if (field && field.wcBetterIti) {
                normalizeAutofill(field, field.wcBetterIti, savedDialFor(field));
            }
        });
    }, 1000);
});
