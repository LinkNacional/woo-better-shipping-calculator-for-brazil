(function () {
    let latestBillingPostcode = null;
    let latestShippingPostcode = null;
    let latestDestinationPostcode = null;

    var origFetch = window.fetch;
    window.fetch = function () {
        var url = arguments[0];
        var options = arguments[1] || {};
        return origFetch.apply(this, arguments).then(function (response) {
            var clone = response.clone();
            clone.text().then(function (body) {
                let hasCalculatedShipping = false;
                let cepType = null;
                let cepChanged = false;
                try {
                    var json = JSON.parse(body);

                    // Obtém os CEPs
                    const destinationCep = json.responses?.[0]?.body?.shipping_rates?.[0]?.destination?.postcode || null;
                    const billingCep = json.responses?.[0]?.body?.billing_address?.postcode || null;
                    const shippingCep = json.responses?.[0]?.body?.shipping_address?.postcode || null;
                    const calculateShipping = json.responses?.[0]?.body?.has_calculated_shipping ? true : false;

                    // Decide qual CEP comparar (shipping ou billing)
                    let activeCep = null;
                    if (shippingCep) {
                        activeCep = shippingCep;
                        cepType = 'shipping';
                    } else if (billingCep) {
                        activeCep = billingCep;
                        cepType = 'billing';
                    }

                    // Verifica se o CEP mudou (compare antes de atualizar as variáveis)
                    const billingCepChanged = billingCep && billingCep !== latestBillingPostcode;
                    const shippingCepChanged = shippingCep && shippingCep !== latestShippingPostcode;
                    const destinationCepChanged = destinationCep && destinationCep !== latestDestinationPostcode;

                    cepChanged = billingCepChanged || shippingCepChanged || destinationCepChanged;
                    hasCalculatedShipping = calculateShipping && cepChanged;

                    // Atualiza variáveis salvas (depois da verificação)
                    if (billingCep) latestBillingPostcode = billingCep;
                    if (shippingCep) latestShippingPostcode = shippingCep;
                    if (destinationCep) latestDestinationPostcode = destinationCep;

                } catch (e) { }
                if (hasCalculatedShipping) {
                    wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress');
                }
            });
            return response;
        });
    };
})();