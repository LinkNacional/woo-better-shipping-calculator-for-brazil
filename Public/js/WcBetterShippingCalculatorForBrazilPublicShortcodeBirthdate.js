document.addEventListener("DOMContentLoaded", function () {
    const billingBirthdateField = document.querySelector("#billing_birthdate");
    
    // Aplicar padding dinâmico do WooCommerce se o campo existir
    if (billingBirthdateField) {
        const wooCommercePadding = getWooCommerceInputPadding();
        if (wooCommercePadding) {
            billingBirthdateField.style.padding = wooCommercePadding;
        }
        
        // Definir limites de data nativos do HTML5
        const now = new Date();
        const maxDate = now.toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
        
        const minDateObj = new Date();
        minDateObj.setFullYear(now.getFullYear() - 120);
        const minDate = minDateObj.toISOString().split('T')[0]; // 120 anos atrás
        
        billingBirthdateField.setAttribute('min', minDate);
        billingBirthdateField.setAttribute('max', maxDate); // Data máxima é hoje
    }
    
    // Preenche o campo de data de nascimento com valores vindos do wp_localize_script, se existirem
    if (typeof wc_better_checkout_shortcode_birthdate_vars !== 'undefined') {
        if (billingBirthdateField && wc_better_checkout_shortcode_birthdate_vars.billing_birthdate) {
            if (window.jQuery) {
                var $billingField = window.jQuery(billingBirthdateField);
                $billingField.val(wc_better_checkout_shortcode_birthdate_vars.billing_birthdate).trigger("change");
            } else {
                billingBirthdateField.value = wc_better_checkout_shortcode_birthdate_vars.billing_birthdate;
                billingBirthdateField.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }
    }
    
    // Adiciona validação de formato de data no campo de data de nascimento
    if (billingBirthdateField) {
        billingBirthdateField.addEventListener("change", function () {
            const dateValue = this.value;
            const billingBirthdateFieldWrapper = document.querySelector("#billing_birthdate_field");
            
            // Remove classes de erro anteriores
            if (billingBirthdateFieldWrapper) {
                billingBirthdateFieldWrapper.classList.remove("woocommerce-invalid", "woocommerce-invalid-required-field");
            }
            
            // Validação simples de data (se não estiver vazio)
            if (dateValue) {
                const dateObj = new Date(dateValue);
                const now = new Date();
                
                // Verifica se a data é válida
                if (isNaN(dateObj.getTime())) {
                    if (billingBirthdateFieldWrapper) {
                        billingBirthdateFieldWrapper.classList.add("woocommerce-invalid", "woocommerce-invalid-required-field");
                    }
                    return;
                }
                
                // Verifica se a data não é futura
                if (dateObj > now) {
                    if (billingBirthdateFieldWrapper) {
                        billingBirthdateFieldWrapper.classList.add("woocommerce-invalid", "woocommerce-invalid-required-field");
                    }
                    return;
                }
                
                // Verifica idade máxima (120 anos)
                const maxAge = new Date();
                maxAge.setFullYear(now.getFullYear() - 120);
                
                if (dateObj < maxAge) {
                    if (billingBirthdateFieldWrapper) {
                        billingBirthdateFieldWrapper.classList.add("woocommerce-invalid", "woocommerce-invalid-required-field");
                    }
                    return;
                }
                

            }
            
            // Trigger update do checkout se jQuery estiver disponível
            if (window.jQuery) {
                window.jQuery('body').trigger('update_checkout');
            }
        });
        
        // Validação em tempo real enquanto digita
        billingBirthdateField.addEventListener("input", function () {
            // Trigger de debounce para não sobrecarregar
            clearTimeout(this.validationTimeout);
            this.validationTimeout = setTimeout(() => {
                this.dispatchEvent(new Event("change", { bubbles: true }));
            }, 500);
        });
    }

    function getWooCommerceInputPadding() {
        // Lista de seletores para capturar padding dos inputs do WooCommerce
        const inputSelectors = [
            '.wc-block-components-text-input.is-active input[type=text]',
            '.wc-block-components-text-input.is-active input[type=email]',  
            '.wc-block-components-text-input.is-active input[type=tel]',
            '.wc-block-components-text-input.is-active input[type=number]',
            '.wc-block-components-form .wc-block-components-text-input.is-active input[type=text]',
            '.wc-block-components-form .wc-block-components-text-input.is-active input[type=email]',
            // Para shortcode, também incluir seletores tradicionais
            '.form-row input[type=text]',
            '.form-row input[type=email]',
            '.form-row input[type=tel]',
            '#billing_first_name',
            '#billing_email',
            '#billing_phone'
        ];

        for (const selector of inputSelectors) {
            const existingInput = document.querySelector(selector);
            if (existingInput) {
                const computedStyle = window.getComputedStyle(existingInput);
                const padding = computedStyle.getPropertyValue('padding');
                
                // Se encontrou padding válido, retorna
                if (padding && padding !== '0px' && padding !== 'auto' && padding !== '') {
                    return padding;
                }
            }
        }

        return null;
    }
});