document.addEventListener("DOMContentLoaded", function () {
    const billingGenderField = document.querySelector("#billing_gender");
    
    // Aplicar padding dinâmico do WooCommerce se o campo existir
    if (billingGenderField) {
        const wooCommercePadding = getWooCommerceInputPadding();
        if (wooCommercePadding) {
            billingGenderField.style.padding = wooCommercePadding;
        }
    }
    
    // Preenche o campo de gênero com valores vindos do wp_localize_script, se existirem
    if (typeof WooBetterGenderData !== 'undefined') {
        if (billingGenderField && WooBetterGenderData.billing_gender) {
            if (window.jQuery) {
                var $billingField = window.jQuery(billingGenderField);
                $billingField.val(WooBetterGenderData.billing_gender).trigger("change");
            } else {
                billingGenderField.value = WooBetterGenderData.billing_gender;
                billingGenderField.dispatchEvent(new Event("change", { bubbles: true }));
            }
        }
    }
    
    // Adiciona validação no campo de gênero
    if (billingGenderField) {
        billingGenderField.addEventListener("change", function () {
            const genderValue = this.value;
            const billingGenderFieldWrapper = document.querySelector("#billing_gender_field");
            
            // Remove classes de erro anteriores
            if (billingGenderFieldWrapper) {
                billingGenderFieldWrapper.classList.remove("woocommerce-invalid", "woocommerce-invalid-required-field");
            }
            
            // Validação simples de gênero
            const validGenders = ['', 'Masculino', 'Feminino', 'Não-binário', 'Outro', 'Prefiro não dizer'];
            if (genderValue && !validGenders.includes(genderValue)) {
                if (billingGenderFieldWrapper) {
                    billingGenderFieldWrapper.classList.add("woocommerce-invalid", "woocommerce-invalid-required-field");
                }
            }
            
            // Trigger update do checkout se jQuery estiver disponível
            if (window.jQuery) {
                window.jQuery('body').trigger('update_checkout');
            }
        });
        
        // Validação ao perder o foco
        billingGenderField.addEventListener("blur", function () {
            this.dispatchEvent(new Event("change", { bubbles: true }));
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
            '.form-row select',
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