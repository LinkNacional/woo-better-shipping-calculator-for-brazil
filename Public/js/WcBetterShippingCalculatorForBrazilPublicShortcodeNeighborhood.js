(function () {
    'use strict';

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    function toggleNeighborhoodField(fieldId, inputId, country) {
        var field = document.getElementById(fieldId);
        var input = document.getElementById(inputId);

        if (!field) {
            return;
        }

        if (country !== 'BR') {
            field.style.display   = 'none';
            field.style.padding   = '0px';
            field.style.margin    = '0px';
            field.style.height    = '0px';
            field.style.overflow  = 'hidden';

            if (input) {
                input.removeAttribute('required');
            }
            field.classList.remove('validate-required');
            field.classList.add('optional');
        } else {
            field.style.display   = '';
            field.style.padding   = '';
            field.style.margin    = '';
            field.style.height    = '';
            field.style.overflow  = '';

            // required é controlado pela configuração PHP — não forçamos aqui,
            // apenas removemos o estado "optional" para que o WooCommerce decida.
            field.classList.remove('optional');
        }
    }

    function applyInitialVisibility() {
        var billingSelect  = document.getElementById('billing_country');
        var shippingSelect = document.getElementById('shipping_country');

        if (billingSelect) {
            toggleNeighborhoodField('billing_neighborhood_field', 'billing_neighborhood', billingSelect.value);
        }

        if (shippingSelect) {
            toggleNeighborhoodField('shipping_neighborhood_field', 'shipping_neighborhood', shippingSelect.value);
        }
    }

    function prefillFields() {
        if (typeof WooBetterNeighborhoodData === 'undefined') {
            return;
        }

        var billingInput  = document.getElementById('billing_neighborhood');
        var shippingInput = document.getElementById('shipping_neighborhood');

        if (billingInput && WooBetterNeighborhoodData.billing_neighborhood) {
            billingInput.value = WooBetterNeighborhoodData.billing_neighborhood;
        }

        if (shippingInput && WooBetterNeighborhoodData.shipping_neighborhood) {
            shippingInput.value = WooBetterNeighborhoodData.shipping_neighborhood;
        }
    }

    // -------------------------------------------------------------------------
    // Inicialização
    // -------------------------------------------------------------------------

    function init() {
        prefillFields();
        applyInitialVisibility();

        if (typeof jQuery === 'undefined') {
            return;
        }

        // WooCommerce usa select2 para o dropdown de país — o evento nativo 'change'
        // não dispara. Usamos country_to_state_changing que o WC dispara internamente.
        jQuery('body')
            .off('country_to_state_changing.woo_better_neighborhood')
            .on('country_to_state_changing.woo_better_neighborhood', function (event, country, $wrapper) {
                if (!$wrapper || !$wrapper.find) {
                    return;
                }

                if ($wrapper.find('#billing_country').length > 0) {
                    toggleNeighborhoodField('billing_neighborhood_field', 'billing_neighborhood', country);
                }

                if ($wrapper.find('#shipping_country').length > 0) {
                    toggleNeighborhoodField('shipping_neighborhood_field', 'shipping_neighborhood', country);
                }
            });

        // Fallback delegado para selects sem select2
        jQuery(document)
            .off('change.woo_better_billing_neighborhood', '#billing_country')
            .on('change.woo_better_billing_neighborhood', '#billing_country', function () {
                toggleNeighborhoodField('billing_neighborhood_field', 'billing_neighborhood', jQuery(this).val());
            });

        jQuery(document)
            .off('change.woo_better_shipping_neighborhood', '#shipping_country')
            .on('change.woo_better_shipping_neighborhood', '#shipping_country', function () {
                toggleNeighborhoodField('shipping_neighborhood_field', 'shipping_neighborhood', jQuery(this).val());
            });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
