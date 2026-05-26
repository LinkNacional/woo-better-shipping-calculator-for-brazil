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

        var snWrapper = document.createElement('p');
        snWrapper.id = checkboxId + '_wrapper';
        snWrapper.style.cssText = 'position: absolute; right: 12px; top: 50%; transform: translateY(-50%); margin: 0; z-index: 2;';

        var label = document.createElement('label');
        label.htmlFor = checkboxId;
        label.style.cssText = 'display: inline-flex; align-items: center; gap: 4px; cursor: pointer; font-weight: normal; font-size: 12px; line-height: 1; background: transparent;';

        var snText = document.createTextNode('S/N');

        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = checkboxId;
        checkbox.style.cssText = 'margin: 0; width: auto; cursor: pointer;';

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