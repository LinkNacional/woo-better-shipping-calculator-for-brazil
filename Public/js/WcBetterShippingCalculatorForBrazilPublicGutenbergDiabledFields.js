document.addEventListener('DOMContentLoaded', function () {
    let textFound = false;
    let shippingFound = false;

    function updateText() {
        const addressMethod = document.querySelector('#shipping-option');
        const shippingMethod = document.querySelector('.wc-block-components-totals-shipping');

        if (!addressMethod) {
            textFound = false;
        }

        if (!shippingMethod) {
            shippingFound = false;
        }

        if (shippingMethod && !shippingFound) {
            shippingMethod.remove()
        }

        if (addressMethod && !textFound) {
            textFound = true;
            addressMethod.remove()
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
