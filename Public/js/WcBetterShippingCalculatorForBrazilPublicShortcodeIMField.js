document.addEventListener("DOMContentLoaded", function () {

    var imInput = null;
    var imFieldWrapper = null;
    var listenersInitialized = false;

    function initIMField() {
        imInput = document.getElementById('billing_im');
        imFieldWrapper = document.getElementById('billing_im_field');

        if (!imInput || !imFieldWrapper) {
            return;
        }

        // Preenche o valor salvo, se houver
        if (typeof WooBetterIMData !== 'undefined' && WooBetterIMData.billing_im) {
            imInput.value = String(WooBetterIMData.billing_im).replace(/[^A-Za-z0-9\-\/\. ]/g, '').toUpperCase();
        }

        if (!listenersInitialized) {
            setupFieldListeners();
            listenersInitialized = true;
        }

        // IM segue a mesma regra do campo empresa: só exibe para CNPJ completo
        updateIMFieldVisibility();
    }

    function setIMRequired(isRequired) {
        if (!imInput || !imFieldWrapper) {
            return;
        }

        if (isRequired) {
            imInput.setAttribute('required', 'required');
            imFieldWrapper.classList.add('validate-required');
            imFieldWrapper.classList.remove('optional');
        } else {
            imInput.removeAttribute('required');
            imFieldWrapper.classList.remove('validate-required');
            imFieldWrapper.classList.add('optional');
        }
    }

    function updateIMFieldVisibility() {
        if (!imFieldWrapper) {
            return;
        }

        var billingCountryField = document.getElementById('billing_country');
        var currentCountry = billingCountryField ? billingCountryField.value : 'BR';

        // Fora do Brasil, não exibe IM
        if (currentCountry && currentCountry !== 'BR') {
            hideIMField(true);
            return;
        }

        var documentInput = document.getElementById('billing_document');
        var documentValue = documentInput ? documentInput.value : '';
        var cleanValue = documentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

        var personTypeInput = document.getElementById('billing_persontype');
        var currentPersonType = personTypeInput ? personTypeInput.value : '';
        var personTypeConfig = typeof WooBetterIMConfig !== 'undefined' ? WooBetterIMConfig.person_type : 'both';

        var isCnpjComplete = cleanValue.length === 14;
        var shouldShow = false;

        if (personTypeConfig === 'legal') {
            shouldShow = isCnpjComplete;
        } else if (personTypeConfig === 'both') {
            shouldShow = (currentPersonType === '2' && isCnpjComplete) || isCnpjComplete;
        }

        if (shouldShow) {
            showIMField();
            setIMRequired(true);
        } else {
            hideIMField(true);
        }
    }

    function showIMField() {
        if (!imFieldWrapper) {
            return;
        }
        imFieldWrapper.style.display = '';
        imFieldWrapper.style.height = '';
        imFieldWrapper.style.overflow = '';
        imFieldWrapper.style.padding = '';
        imFieldWrapper.style.margin = '';
    }

    function hideIMField(clearValue) {
        if (!imFieldWrapper) {
            return;
        }

        imFieldWrapper.style.display = 'none';
        imFieldWrapper.style.height = '0px';
        imFieldWrapper.style.overflow = 'hidden';
        imFieldWrapper.style.padding = '0px';
        imFieldWrapper.style.margin = '0px';

        setIMRequired(false);

        if (clearValue && imInput) {
            imInput.value = '';
        }
    }

    function setupFieldListeners() {
        var documentInput = document.getElementById('billing_document');
        var personTypeInput = document.getElementById('billing_persontype');
        var billingCountrySelect = document.getElementById('billing_country');

        if (documentInput) {
            documentInput.addEventListener('input', updateIMFieldVisibility);
            documentInput.addEventListener('change', updateIMFieldVisibility);
        }

        if (personTypeInput) {
            personTypeInput.addEventListener('change', updateIMFieldVisibility);
        }

        if (billingCountrySelect) {
            billingCountrySelect.addEventListener('change', updateIMFieldVisibility);
        }

        // Impede inserção de caracteres inválidos e força maiúsculas no campo IM
        if (imInput) {
            imInput.addEventListener('input', function () {
                var normalized = this.value.replace(/[^A-Za-z0-9\-\/\. ]/g, '').toUpperCase();
                if (normalized !== this.value) {
                    this.value = normalized;
                }
            });
        }

        if (typeof jQuery !== 'undefined') {
            jQuery(document)
                .off('input.woo_better_im_billing_document change.woo_better_im_billing_document', '#billing_document')
                .on('input.woo_better_im_billing_document change.woo_better_im_billing_document', '#billing_document', function () {
                    updateIMFieldVisibility();
                });

            jQuery(document)
                .off('change.woo_better_im_billing_persontype', '#billing_persontype')
                .on('change.woo_better_im_billing_persontype', '#billing_persontype', function () {
                    updateIMFieldVisibility();
                });

            jQuery(document)
                .off('change.woo_better_im_country', '#billing_country')
                .on('change.woo_better_im_country', '#billing_country', function () {
                    updateIMFieldVisibility();
                });

            jQuery('body')
                .off('country_to_state_changing.woo_better_im')
                .on('country_to_state_changing.woo_better_im', function (event, country, wrapper) {
                    if (wrapper && wrapper.find && wrapper.find('#billing_country').length > 0) {
                        setTimeout(updateIMFieldVisibility, 100);
                    }
                });
        }
    }

    // Inicializa
    initIMField();

    // Observer para detectar quando os campos aparecem no DOM
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.id === 'billing_im' ||
                            node.id === 'billing_im_field' ||
                            (node.querySelector && node.querySelector('#billing_im'))) {
                            setTimeout(initIMField, 100);
                        }
                        if (node.id === 'billing_persontype' ||
                            node.id === 'billing_document' ||
                            node.id === 'billing_country' ||
                            (node.querySelector && node.querySelector('#billing_persontype'))) {
                            setTimeout(updateIMFieldVisibility, 100);
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
