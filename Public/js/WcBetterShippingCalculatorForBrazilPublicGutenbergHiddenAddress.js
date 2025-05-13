document.addEventListener('DOMContentLoaded', function () {
    // O código abaixo será executado quando o DOM for carregado

    // Cria uma instância do MutationObserver
    const observer = new MutationObserver(function () {

        if (WooBetterAddress.hiddenAddress === 'yes') {
            const shippingStateField = document.querySelector('.wc-block-components-address-form__state');
            if (shippingStateField && shippingStateField.style.display !== 'none') {
                shippingStateField.style.display = 'none';
            }

            const shippingCountryField = document.querySelector('.wc-block-components-address-form__country');
            if (shippingCountryField && shippingCountryField.style.display !== 'none') {
                shippingCountryField.style.display = 'none';
            }

            const shippingCityyField = document.querySelector('.wc-block-components-address-form__city');
            if (shippingCityyField && shippingCityyField.style.display !== 'none') {
                shippingCityyField.style.display = 'none';
            }
        }

    });

    // Configura o MutationObserver para observar alterações no DOM
    const config = { childList: true, subtree: true }; // Observa adições e remoções de nós
    observer.observe(document.body, config);
});
