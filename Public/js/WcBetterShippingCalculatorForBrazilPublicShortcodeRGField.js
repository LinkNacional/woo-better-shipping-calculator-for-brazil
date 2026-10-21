document.addEventListener("DOMContentLoaded", function () {

    var rgInput = null;
    var rgFieldWrapper = null;
    var listenersInitialized = false;

    var RG_MAX_LENGTH = 20;

    function sanitizeRGValue(value) {
        return String(value || '')
            .replace(/[^A-Za-z0-9\-\/\. ]/g, '')
            .toUpperCase()
            .slice(0, RG_MAX_LENGTH);
    }

    function isRGRequired() {
        return typeof WooBetterRGConfig !== 'undefined' &&
            !!WooBetterRGConfig.required;
    }

    function initRGField() {
        rgInput = document.getElementById('billing_rg');
        rgFieldWrapper = document.getElementById('billing_rg_field');

        if (!rgInput || !rgFieldWrapper) {
            return;
        }

        // Preenche o valor salvo, se houver
        if (typeof WooBetterRGData !== 'undefined' && WooBetterRGData.billing_rg) {
            rgInput.value = sanitizeRGValue(WooBetterRGData.billing_rg);
        }

        if (!listenersInitialized) {
            setupFieldListeners();
            listenersInitialized = true;
        }

        // O RG é vinculado ao CPF: só exibe quando o documento é um CPF completo
        updateRGFieldVisibility();
    }

    function setRGRequired(isRequired) {
        if (!rgInput || !rgFieldWrapper) {
            return;
        }

        // O required só vale quando a opção "RG obrigatório" está ligada.
        if (isRequired && isRGRequired()) {
            rgInput.setAttribute('required', 'required');
            rgFieldWrapper.classList.add('validate-required');
            rgFieldWrapper.classList.remove('optional');
        } else {
            rgInput.removeAttribute('required');
            rgFieldWrapper.classList.remove('validate-required');
            rgFieldWrapper.classList.add('optional');
        }
    }

    function updateRGFieldVisibility() {
        if (!rgFieldWrapper) {
            return;
        }

        var billingCountryField = document.getElementById('billing_country');
        var currentCountry = billingCountryField ? billingCountryField.value : 'BR';

        // Fora do Brasil, não exibe RG
        if (currentCountry && currentCountry !== 'BR') {
            hideRGField();
            return;
        }

        var documentInput = document.getElementById('billing_document');
        var documentValue = documentInput ? documentInput.value : '';
        var cleanValue = documentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

        var personTypeInput = document.getElementById('billing_persontype');
        var currentPersonType = personTypeInput ? personTypeInput.value : '';
        var personTypeConfig = typeof WooBetterRGConfig !== 'undefined' ? WooBetterRGConfig.person_type : 'both';

        var isCpfComplete = cleanValue.length === 11;
        var shouldShow = false;

        if (personTypeConfig === 'physical') {
            shouldShow = isCpfComplete;
        } else if (personTypeConfig === 'both') {
            shouldShow = (currentPersonType === '1' && isCpfComplete) || isCpfComplete;
        }

        if (shouldShow) {
            showRGField();
            setRGRequired(true);
        } else {
            hideRGField();
        }
    }

    function showRGField() {
        if (!rgFieldWrapper) {
            return;
        }
        rgFieldWrapper.style.display = '';
        rgFieldWrapper.style.height = '';
        rgFieldWrapper.style.overflow = '';
        rgFieldWrapper.style.padding = '';
        rgFieldWrapper.style.margin = '';
    }

    function hideRGField() {
        if (!rgFieldWrapper) {
            return;
        }

        rgFieldWrapper.style.display = 'none';
        rgFieldWrapper.style.height = '0px';
        rgFieldWrapper.style.overflow = 'hidden';
        rgFieldWrapper.style.padding = '0px';
        rgFieldWrapper.style.margin = '0px';

        setRGRequired(false);

        // NÃO apaga o valor digitado (espelha o checkout em blocos): esconder é só
        // visual, e limpar fazia o cliente perder o RG ao corrigir o CPF. O backend
        // limpa a meta do PEDIDO quando o documento não é CPF (process_rg_from_data).
    }

    function setupFieldListeners() {
        var documentInput = document.getElementById('billing_document');
        var personTypeInput = document.getElementById('billing_persontype');
        var billingCountrySelect = document.getElementById('billing_country');

        if (documentInput) {
            documentInput.addEventListener('input', updateRGFieldVisibility);
            documentInput.addEventListener('change', updateRGFieldVisibility);
        }

        if (personTypeInput) {
            personTypeInput.addEventListener('change', updateRGFieldVisibility);
        }

        if (billingCountrySelect) {
            billingCountrySelect.addEventListener('change', updateRGFieldVisibility);
        }

        // Impede inserção de caracteres inválidos e força maiúsculas no campo RG
        if (rgInput) {
            rgInput.addEventListener('input', function () {
                var normalized = sanitizeRGValue(this.value);
                if (normalized !== this.value) {
                    this.value = normalized;
                }
            });
        }

        if (typeof jQuery !== 'undefined') {
            jQuery(document)
                .off('input.woo_better_rg_billing_document change.woo_better_rg_billing_document', '#billing_document')
                .on('input.woo_better_rg_billing_document change.woo_better_rg_billing_document', '#billing_document', function () {
                    updateRGFieldVisibility();
                });

            jQuery(document)
                .off('change.woo_better_rg_billing_persontype', '#billing_persontype')
                .on('change.woo_better_rg_billing_persontype', '#billing_persontype', function () {
                    updateRGFieldVisibility();
                });

            jQuery(document)
                .off('change.woo_better_rg_country', '#billing_country')
                .on('change.woo_better_rg_country', '#billing_country', function () {
                    updateRGFieldVisibility();
                });

            jQuery('body')
                .off('country_to_state_changing.woo_better_rg')
                .on('country_to_state_changing.woo_better_rg', function (event, country, wrapper) {
                    if (wrapper && wrapper.find && wrapper.find('#billing_country').length > 0) {
                        setTimeout(updateRGFieldVisibility, 100);
                    }
                });
        }
    }

    // Inicializa
    initRGField();

    // Observer para detectar quando os campos aparecem no DOM
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.id === 'billing_rg' ||
                            node.id === 'billing_rg_field' ||
                            (node.querySelector && node.querySelector('#billing_rg'))) {
                            setTimeout(initRGField, 100);
                        }
                        if (node.id === 'billing_persontype' ||
                            node.id === 'billing_document' ||
                            node.id === 'billing_country' ||
                            (node.querySelector && node.querySelector('#billing_persontype'))) {
                            setTimeout(updateRGFieldVisibility, 100);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
