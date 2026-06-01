document.addEventListener("DOMContentLoaded", function () {

    var billingSnCheckbox = null;
    var shippingSnCheckbox = null;
    var billingInitialized = false;
    var shippingInitialized = false;

    function setFieldValue(inputEl, value) {
        if (!inputEl) {
            return;
        }
        if (window.jQuery) {
            window.jQuery(inputEl).val(value).trigger('change');
        } else {
            inputEl.value = value;
            inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function setFieldDisabled(inputEl, disabled) {
        if (!inputEl) {
            return;
        }
        if (disabled) {
            inputEl.setAttribute('readonly', 'readonly');
            inputEl.classList.add('wc-better-readonly-disabled');
            inputEl.style.opacity = '0.6';
            inputEl.style.cursor = 'not-allowed';
            inputEl.style.pointerEvents = 'none';
        } else {
            inputEl.removeAttribute('readonly');
            inputEl.classList.remove('wc-better-readonly-disabled');
            inputEl.style.opacity = '';
            inputEl.style.cursor = '';
            inputEl.style.pointerEvents = '';
        }
    }

    function injectSnCheckbox(inputEl, fieldWrapperEl, checkboxId, onCheckedChange) {
        if (!inputEl || !fieldWrapperEl) {
            return null;
        }

        if (document.getElementById(checkboxId)) {
            return document.getElementById(checkboxId);
        }

        var inputWrapper = fieldWrapperEl.querySelector('.woocommerce-input-wrapper');
        if (inputWrapper) {
            inputWrapper.style.position = 'relative';
        }

        var snWrapper = document.createElement('span');
        snWrapper.id = checkboxId + '_wrapper';
        snWrapper.setAttribute('style',
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
        label.htmlFor = checkboxId;
        label.setAttribute('style',
            'display: inline-flex !important; ' +
            'align-items: flex-end !important; ' +
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

        var snText = document.createTextNode('S/N');

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.setAttribute('style',
            'margin: 0 !important; ' +
            'padding: 0 !important; ' +
            'width: auto !important; ' +
            'height: auto !important; ' +
            'cursor: pointer !important; ' +
            'flex-shrink: 0 !important; ' +
            'vertical-align: middle !important;' +
            'line-height: normal !important;'
        );

        label.appendChild(snText);
        label.appendChild(checkbox);
        snWrapper.appendChild(label);

        if (inputWrapper) {
            inputWrapper.appendChild(snWrapper);
        } else {
            fieldWrapperEl.appendChild(snWrapper);
        }

        inputEl.style.paddingRight = '72px';

        checkbox.addEventListener('change', function () {
            onCheckedChange(this.checked);
        });

        if (window.jQuery) {
            window.jQuery(checkbox).on('validate change focusout', function (e) {
                e.stopImmediatePropagation();
            });
        }

        return checkbox;
    }

    function initBillingSnField() {
        var billingNumberField = document.getElementById('billing_number');
        var billingNumberFieldWrapper = document.getElementById('billing_number_field');

        if (!billingNumberField || !billingNumberFieldWrapper) {
            return;
        }

        billingInitialized = true;

        billingSnCheckbox = injectSnCheckbox(
            billingNumberField,
            billingNumberFieldWrapper,
            'lkn_billing_checkbox',
            function (checked) {
                if (checked) {
                    setFieldValue(billingNumberField, 'S/N');
                    setFieldDisabled(billingNumberField, true);
                } else {
                    setFieldValue(billingNumberField, '');
                    setFieldDisabled(billingNumberField, false);
                    billingNumberField.focus();
                }
            }
        );

        // Preenche valor salvo via wp_localize_script
        if (typeof wc_better_checkout_shortcode_number_vars !== 'undefined' && wc_better_checkout_shortcode_number_vars.billing_number) {
            setFieldValue(billingNumberField, wc_better_checkout_shortcode_number_vars.billing_number);
            if (wc_better_checkout_shortcode_number_vars.billing_number === 'S/N' && billingSnCheckbox) {
                billingSnCheckbox.checked = true;
                setFieldDisabled(billingNumberField, true);
            }
        }
    }

    function initShippingSnField() {
        var shippingNumberField = document.getElementById('shipping_number');
        var shippingNumberFieldWrapper = document.getElementById('shipping_number_field');

        if (!shippingNumberField || !shippingNumberFieldWrapper) {
            return;
        }

        shippingInitialized = true;

        shippingSnCheckbox = injectSnCheckbox(
            shippingNumberField,
            shippingNumberFieldWrapper,
            'lkn_shipping_checkbox',
            function (checked) {
                if (checked) {
                    setFieldValue(shippingNumberField, 'S/N');
                    setFieldDisabled(shippingNumberField, true);
                } else {
                    setFieldValue(shippingNumberField, '');
                    setFieldDisabled(shippingNumberField, false);
                    shippingNumberField.focus();
                }
            }
        );

        // Preenche valor salvo via wp_localize_script
        if (typeof wc_better_checkout_shortcode_number_vars !== 'undefined' && wc_better_checkout_shortcode_number_vars.shipping_number) {
            setFieldValue(shippingNumberField, wc_better_checkout_shortcode_number_vars.shipping_number);
            if (wc_better_checkout_shortcode_number_vars.shipping_number === 'S/N' && shippingSnCheckbox) {
                shippingSnCheckbox.checked = true;
                setFieldDisabled(shippingNumberField, true);
            }
        }
    }

    // Inicializa billing
    initBillingSnField();

    // Observer para shipping (aparece dinamicamente quando "enviar para endereço diferente" é marcado)
    var observer = new MutationObserver(function () {
        if (!billingInitialized) {
            initBillingSnField();
        }

        var shippingNumberField = document.getElementById('shipping_number');
        if (!shippingNumberField) {
            shippingInitialized = false;
            shippingSnCheckbox = null;
        }

        if (!shippingInitialized) {
            initShippingSnField();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});