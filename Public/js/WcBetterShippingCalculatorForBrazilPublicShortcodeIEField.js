document.addEventListener("DOMContentLoaded", function () {

    var isentoCheckbox = null;
    var ieInput = null;
    var ieFieldWrapper = null;
    var listenersInitialized = false;

    function positionIsentoInsideInput() {
        var isentoWrapper = document.getElementById('woo_better_ie_isento_wrapper');
        if (!ieInput || !ieFieldWrapper || !isentoWrapper) {
            return;
        }

        var inputWrapper = ieFieldWrapper.querySelector('.woocommerce-input-wrapper');
        if (!inputWrapper) {
            return;
        }

        inputWrapper.style.position = 'relative';
        ieInput.style.paddingRight = '96px';
    }

    function initIEField() {
        ieInput = document.getElementById('billing_ie');
        ieFieldWrapper = document.getElementById('billing_ie_field');

        if (!ieInput || !ieFieldWrapper) {
            return;
        }

        // Preenche o valor salvo, se houver
        if (typeof WooBetterIEData !== 'undefined' && WooBetterIEData.billing_ie) {
            ieInput.value = WooBetterIEData.billing_ie;
        }

        // Cria o checkbox "Isento" se ainda não existir
        if (!document.getElementById('woo_better_ie_isento_checkbox')) {
            injectIsentoCheckbox();
        }

        if (!listenersInitialized) {
            setupFieldListeners();
            listenersInitialized = true;
        }

        // IE segue a mesma regra do campo empresa: só exibe para CNPJ completo
        updateIEFieldVisibility();
        positionIsentoInsideInput();
    }

    function injectIsentoCheckbox() {
        if (!ieFieldWrapper) {
            return;
        }

        var inputWrapper = ieFieldWrapper.querySelector('.woocommerce-input-wrapper');
        if (inputWrapper) {
            inputWrapper.style.position = 'relative';
        }

        var checkboxWrapper = document.createElement('span');
        checkboxWrapper.id = 'woo_better_ie_isento_wrapper';
        checkboxWrapper.setAttribute('style',
            'display: flex !important; ' +
            'position: absolute !important; ' +
            'right: 12px !important; ' +
            'top: 50% !important; ' +
            'transform: translateY(-50%) !important; ' +
            'margin: 0 !important; ' +
            'padding: 0 !important; ' +
            'z-index: 2 !important;'
        );

        var label = document.createElement('label');
        label.htmlFor = 'woo_better_ie_isento_checkbox';
        label.setAttribute('style',
            'display: inline-flex !important; ' +
            'align-items: flex-start !important; ' +
            'gap: 4px !important; ' +
            'cursor: pointer !important; ' +
            'font-size: 12px !important; ' +
            'font-weight: normal !important; ' +
            'line-height: 1 !important; ' +
            'letter-spacing: 0 !important; ' +
            'text-transform: none !important; ' +
            'background: transparent !important; ' +
            'padding: 0 !important; ' +
            'margin: 0 !important; ' +
            'border: none !important; ' +
            'box-shadow: none !important;'
        );

        isentoCheckbox = document.createElement('input');
        isentoCheckbox.type = 'checkbox';
        isentoCheckbox.id = 'woo_better_ie_isento_checkbox';
        isentoCheckbox.name = 'woo_better_ie_isento';
        isentoCheckbox.setAttribute('style',
            'margin: 0 !important; ' +
            'padding: 0 !important; ' +
            'width: auto !important; ' +
            'cursor: pointer !important; ' +
            'flex-shrink: 0 !important; ' +
            'vertical-align: middle !important;' +
            'line-height: normal !important;'
        );

        var labelText = document.createTextNode(
            typeof window.wp !== 'undefined' && typeof window.wp.i18n !== 'undefined'
                ? window.wp.i18n.__('Isento', 'woo-better-shipping-calculator-for-brazil')
                : 'Isento'
        );

        label.appendChild(labelText);
        label.appendChild(isentoCheckbox);
        checkboxWrapper.appendChild(label);
        if (inputWrapper) {
            inputWrapper.appendChild(checkboxWrapper);
        } else {
            ieFieldWrapper.appendChild(checkboxWrapper);
        }
        positionIsentoInsideInput();

        // Se o valor já é ISENTO, marcar checkbox e desabilitar o campo
        if (ieInput && ieInput.value === 'ISENTO') {
            isentoCheckbox.checked = true;
            setIEFieldDisabled(true);
        }

        isentoCheckbox.addEventListener('change', function () {
            if (this.checked) {
                ieInput.value = 'ISENTO';
                setIEFieldDisabled(true);
            } else {
                ieInput.value = '';
                setIEFieldDisabled(false);
                ieInput.focus();
            }
            ieInput.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function setIEFieldDisabled(disabled) {
        if (!ieInput) {
            return;
        }
        if (disabled) {
            ieInput.setAttribute('readonly', 'readonly');
            ieInput.classList.add('woo-better-readonly-disabled');
            ieInput.style.opacity = '0.6';
            ieInput.style.cursor = 'not-allowed';
            ieInput.style.pointerEvents = 'none';
        } else {
            ieInput.removeAttribute('readonly');
            ieInput.classList.remove('woo-better-readonly-disabled');
            ieInput.style.opacity = '';
            ieInput.style.cursor = '';
            ieInput.style.pointerEvents = '';
        }
    }

    function setIERequired(isRequired) {
        if (!ieInput || !ieFieldWrapper) {
            return;
        }

        if (isRequired) {
            ieInput.setAttribute('required', 'required');
            ieFieldWrapper.classList.add('validate-required');
            ieFieldWrapper.classList.remove('optional');
        } else {
            ieInput.removeAttribute('required');
            ieFieldWrapper.classList.remove('validate-required');
            ieFieldWrapper.classList.add('optional');
        }
    }

    function updateIEFieldVisibility() {
        if (!ieFieldWrapper) {
            return;
        }

        var billingCountryField = document.getElementById('billing_country');
        var currentCountry = billingCountryField ? billingCountryField.value : 'BR';

        // Fora do Brasil, não exibe IE
        if (currentCountry && currentCountry !== 'BR') {
            hideIEField(true);
            return;
        }

        var documentInput = document.getElementById('billing_document');
        var documentValue = documentInput ? documentInput.value : '';
        var cleanValue = documentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();

        var personTypeInput = document.getElementById('billing_persontype');
        var currentPersonType = personTypeInput ? personTypeInput.value : '';
        var personTypeConfig = typeof WooBetterIEConfig !== 'undefined' ? WooBetterIEConfig.person_type : 'both';

        var isCnpjComplete = cleanValue.length === 14;
        var shouldShow = false;

        if (personTypeConfig === 'legal') {
            shouldShow = isCnpjComplete;
        } else if (personTypeConfig === 'both') {
            shouldShow = (currentPersonType === '2' && isCnpjComplete) || isCnpjComplete;
        }

        if (shouldShow) {
            showIEField();
            setIERequired(true);
        } else {
            hideIEField(true);
        }
    }

    function showIEField() {
        if (!ieFieldWrapper) {
            return;
        }
        ieFieldWrapper.style.display = '';
        ieFieldWrapper.style.height = '';
        ieFieldWrapper.style.overflow = '';
        ieFieldWrapper.style.padding = '';
        ieFieldWrapper.style.margin = '';

        // Mostrar também o wrapper do checkbox isento
        var isentoWrapper = document.getElementById('woo_better_ie_isento_wrapper');
        if (isentoWrapper) {
            isentoWrapper.style.setProperty('display', 'flex', 'important');
        }
    }

    function hideIEField(clearValue) {
        if (!ieFieldWrapper) {
            return;
        }

        ieFieldWrapper.style.display = 'none';
        ieFieldWrapper.style.height = '0px';
        ieFieldWrapper.style.overflow = 'hidden';
        ieFieldWrapper.style.padding = '0px';
        ieFieldWrapper.style.margin = '0px';

        var isentoWrapper = document.getElementById('woo_better_ie_isento_wrapper');
        if (isentoWrapper) {
            isentoWrapper.style.setProperty('display', 'none', 'important');
        }

        setIERequired(false);
        setIEFieldDisabled(false);

        if (isentoCheckbox) {
            isentoCheckbox.checked = false;
        }

        if (clearValue && ieInput) {
            ieInput.value = '';
        }
    }

    function setupFieldListeners() {
        var documentInput = document.getElementById('billing_document');
        var personTypeInput = document.getElementById('billing_persontype');
        var billingCountrySelect = document.getElementById('billing_country');

        if (documentInput) {
            documentInput.addEventListener('input', updateIEFieldVisibility);
            documentInput.addEventListener('change', updateIEFieldVisibility);
        }

        if (personTypeInput) {
            personTypeInput.addEventListener('change', updateIEFieldVisibility);
        }

        if (billingCountrySelect) {
            billingCountrySelect.addEventListener('change', updateIEFieldVisibility);
        }

        window.addEventListener('resize', positionIsentoInsideInput);

        if (typeof jQuery !== 'undefined') {
            jQuery(document)
                .off('input.woo_better_ie_billing_document change.woo_better_ie_billing_document', '#billing_document')
                .on('input.woo_better_ie_billing_document change.woo_better_ie_billing_document', '#billing_document', function () {
                    updateIEFieldVisibility();
                });

            jQuery(document)
                .off('change.woo_better_ie_billing_persontype', '#billing_persontype')
                .on('change.woo_better_ie_billing_persontype', '#billing_persontype', function () {
                    updateIEFieldVisibility();
                });

            jQuery(document)
                .off('change.woo_better_ie_country', '#billing_country')
                .on('change.woo_better_ie_country', '#billing_country', function () {
                    updateIEFieldVisibility();
                });

            jQuery('body')
                .off('country_to_state_changing.woo_better_ie')
                .on('country_to_state_changing.woo_better_ie', function (event, country, wrapper) {
                    if (wrapper && wrapper.find && wrapper.find('#billing_country').length > 0) {
                        setTimeout(updateIEFieldVisibility, 100);
                        setTimeout(positionIsentoInsideInput, 100);
                    }
                });
        }
    }

    // Inicializa
    initIEField();

    // Observer para detectar quando os campos aparecem no DOM
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function (node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.id === 'billing_ie' ||
                            node.id === 'billing_ie_field' ||
                            (node.querySelector && node.querySelector('#billing_ie'))) {
                            setTimeout(initIEField, 100);
                            setTimeout(positionIsentoInsideInput, 100);
                        }
                        if (node.id === 'billing_persontype' ||
                            node.id === 'billing_document' ||
                            node.id === 'billing_country' ||
                            (node.querySelector && node.querySelector('#billing_persontype'))) {
                            setTimeout(updateIEFieldVisibility, 100);
                            setTimeout(positionIsentoInsideInput, 100);
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
