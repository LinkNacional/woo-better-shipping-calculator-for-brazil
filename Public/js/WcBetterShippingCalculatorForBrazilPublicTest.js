(function waitForWcBlocks() {
    if (
        window.wc &&
        window.wc.blocksCheckout &&
        typeof window.wc.blocksCheckout.applyCheckoutFilter === 'function'
    ) {
        console.log('WooCommerce Blocks disponíveis!');

        // Filtro para esconder o campo de postcode (CEP)
        window.wc.blocksCheckout.applyCheckoutFilter(
            'checkoutAddressFields',
            (addressFields, context) => {
                if (context && (context.type === 'billing' || context.type === 'shipping')) {
                    const updatedFields = { ...addressFields };
                    if (updatedFields.postcode) {
                        delete updatedFields.postcode;
                        console.log('Campo postcode removido via filtro JS');
                    }
                    return updatedFields;
                }

                return addressFields;
            }
        );

    } else {
        // Aguarda e tenta novamente em 50ms
        setTimeout(waitForWcBlocks, 50);
    }
})();