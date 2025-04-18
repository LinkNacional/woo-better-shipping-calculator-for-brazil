document.addEventListener('DOMContentLoaded', function () {
    let textFound = false;
    let shippingFound = false;
    let countryFound = false;

    function updateText() {
        const addressMethod = document.querySelector('#shipping-option');
        const shippingMethod = document.querySelector('.wc-block-components-totals-shipping');
        const countryField = document.querySelector('.wc-block-components-address-form__country');

        if (!addressMethod) {
            textFound = false;
        }

        if (!shippingMethod) {
            shippingFound = false;
        }

        if (!countryField) {
            countryFound = false;
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
});
