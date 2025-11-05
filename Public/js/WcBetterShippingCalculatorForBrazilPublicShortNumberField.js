document.addEventListener("DOMContentLoaded", function () {
    const billingNumberField = document.querySelector("#lkn_billing_number");
    const billingNumberFieldWrapper = document.querySelector("#lkn_billing_number_field");
    const checkbox = document.querySelector("#lkn_billing_checkbox");

    // Preenche os campos de número com valores vindos do wp_localize_script, se existirem
    if (typeof wc_better_checkout_shortcode_number_vars !== 'undefined') {
        if (billingNumberField && wc_better_checkout_shortcode_number_vars.billing_number) {
            if (window.jQuery) {
                var $billingField = window.jQuery(billingNumberField);
                $billingField.val(wc_better_checkout_shortcode_number_vars.billing_number).trigger("change");
            } else {
                billingNumberField.value = wc_better_checkout_shortcode_number_vars.billing_number;
                billingNumberField.dispatchEvent(new Event("change", { bubbles: true }));
            }
            // Se o valor preenchido for 'S/N', marca o checkbox e desabilita o campo
            if (wc_better_checkout_shortcode_number_vars.billing_number === "S/N" && checkbox) {
                checkbox.checked = true;
                billingNumberField.setAttribute("disabled", "disabled");
                billingNumberFieldWrapper.style.opacity = "0.5";
            }
        }
        // Detecta e preenche o campo de número de shipping se existir
        var shippingNumberField = document.querySelector("#lkn_shipping_number");
        if (shippingNumberField && wc_better_checkout_shortcode_number_vars.shipping_number) {
            if (window.jQuery) {
                var $shippingField = window.jQuery(shippingNumberField);
                $shippingField.val(wc_better_checkout_shortcode_number_vars.shipping_number).trigger("change");
            } else {
                shippingNumberField.value = wc_better_checkout_shortcode_number_vars.shipping_number;
                shippingNumberField.dispatchEvent(new Event("change", { bubbles: true }));
            }
            // Se o valor preenchido for 'S/N', marca o checkbox e desabilita o campo
            var shippingCheckbox = document.querySelector("#lkn_shipping_checkbox");
            var shippingNumberFieldWrapper = document.querySelector("#lkn_shipping_number_field");
            if (wc_better_checkout_shortcode_number_vars.shipping_number === "S/N" && shippingCheckbox) {
                shippingCheckbox.checked = true;
                shippingNumberField.setAttribute("disabled", "disabled");
                if (shippingNumberFieldWrapper) shippingNumberFieldWrapper.style.opacity = "0.5";
            }
        }
    }

    let shippingFound = false

    if (checkbox && billingNumberField) {
        checkbox.addEventListener("change", function () {
            if (this.checked) {
                if (window.jQuery) {
                    var $billingField = window.jQuery(billingNumberField);
                    $billingField.val("S/N").trigger("change");
                } else {
                    billingNumberField.value = "S/N";
                    billingNumberField.dispatchEvent(new Event("change", { bubbles: true }));
                }
                billingNumberField.setAttribute("disabled", "disabled");
                billingNumberFieldWrapper.style.opacity = "0.5";
            } else {
                if (window.jQuery) {
                    var $billingField = window.jQuery(billingNumberField);
                    $billingField.val("").trigger("change");
                } else {
                    billingNumberField.value = "";
                    billingNumberField.dispatchEvent(new Event("change", { bubbles: true }));
                }
                billingNumberField.removeAttribute("disabled");
                billingNumberFieldWrapper.style.opacity = "1";
            }
        });
    }

    const observer = new MutationObserver(() => {
        const shippingCheckbox = document.querySelector("#lkn_shipping_checkbox");

        if (!shippingCheckbox) {
            shippingFound = false
        }

        if (shippingCheckbox && !shippingFound) {
            shippingFound = true
            shippingCheckbox.addEventListener("change", function () {
                const shippingNumberField = document.querySelector("#lkn_shipping_number");
                const shippingNumberFieldWrapper = document.querySelector("#lkn_shipping_number_field");

                if (this.checked) {
                    if (window.jQuery) {
                        var $shippingField = window.jQuery(shippingNumberField);
                        $shippingField.val("S/N").trigger("change");
                    } else {
                        shippingNumberField.value = "S/N";
                        shippingNumberField.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                    shippingNumberField.setAttribute("disabled", "disabled");
                    shippingNumberFieldWrapper.style.opacity = "0.5";
                } else {
                    if (window.jQuery) {
                        var $shippingField = window.jQuery(shippingNumberField);
                        $shippingField.val("").trigger("change");
                    } else {
                        shippingNumberField.value = "";
                        shippingNumberField.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                    shippingNumberField.removeAttribute("disabled");
                    shippingNumberFieldWrapper.style.opacity = "1";
                }
            });
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    (function () {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._isCheckoutRequest = url.includes("wc-ajax=checkout");
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (body) {
            if (this._isCheckoutRequest && typeof body === "string") {

                // Converte a string para um objeto URLSearchParams
                const params = new URLSearchParams(body);

                if (params.has('lkn_billing_checkbox') && params.get('lkn_billing_checkbox') == '1') {
                    params.set("lkn_billing_number", "S/N");
                }

                if (params.has('lkn_shipping_checkbox') && params.get('lkn_shipping_checkbox') == '1') {
                    params.set("lkn_shipping_number", "S/N");
                }

                // Converte de volta para string antes de enviar
                body = params.toString();
            }

            return originalSend.call(this, body);
        };
    })();
});

// Removida a função typeCharacter, agora o valor é setado diretamente e o trigger('change') é chamado via jQuery se disponível.
