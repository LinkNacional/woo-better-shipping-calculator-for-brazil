(function () {
    let countInterval = 0;
    const bodyInterval = setInterval(() => {
        if (document.body) {
            initObserver();
            clearInterval(bodyInterval);
        }
        if (countInterval > 20) {
            clearInterval(bodyInterval);
            return;
        }
        countInterval++;
    }, 10);
})()

function initObserver() {
    let textFound = false;
    let shippingFound = false;
    let countryFound = false;
    let legacyTitle = false;
    let blockBilling = false;

    function updateText() {
        const addressMethod = document.querySelector('#shipping-option');
        const shippingMethod = document.querySelector('.wc-block-components-totals-shipping');
        const countryField = document.querySelector('.wc-block-components-address-form__country');
        const legacyTitleElement = document.querySelector('.woocommerce-billing-fields h3');
        const blockBillingElement = document.querySelector('.wc-block-checkout__billing-fields');

        if (!blockBillingElement) {
            blockBilling = false;
        }

        if (!legacyTitleElement) {
            legacyTitle = false;
        }

        if (!addressMethod) {
            textFound = false;
        }

        if (!shippingMethod) {
            shippingFound = false;
        }

        if (!countryField) {
            countryFound = false;
        }

        if (blockBillingElement && !blockBilling) {
            blockTitle = true;
            const blockTitleElement = blockBillingElement.querySelector('.wc-block-components-checkout-step__heading');
            const legendBilling = document.querySelector('legend.screen-reader-text');
            const blockTitleDescription = document.querySelector('.wc-block-components-checkout-step__description');

            if (blockTitleElement) {
                blockTitleElement.remove();
            }

            if (legendBilling) {
                legendBilling.remove();
            }

            if (blockTitleDescription) {
                blockTitleDescription.remove();
            }
        }

        if (legacyTitleElement && !legacyTitle) {
            legacyTitle = true;
            legacyTitleElement.remove();
        }

        if (shippingMethod && !shippingFound) {
            shippingFound = true
            shippingMethod.remove()
        }

        if (addressMethod && !textFound) {
            textFound = true;
            addressMethod.remove()
        }

        if (countryField && !countryFound) {
            countryFound = true
            countryField.remove()
        }
    }

    // Rodar logo após o DOM carregar
    updateText();

    // Também observar mudanças no DOM, caso o conteúdo seja carregado dinamicamente
    const observer = new MutationObserver(updateText);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
