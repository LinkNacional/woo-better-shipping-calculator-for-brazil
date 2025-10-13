// Monitoramento nativo de todas as requisições fetch
(function () {
    let latestPostcode = null;
    var origFetch = window.fetch;
    window.fetch = function () {
        var url = arguments[0];
        var options = arguments[1] || {};
        return origFetch.apply(this, arguments).then(function (response) {
            // Clona a resposta para não consumir o body
            var clone = response.clone();
            clone.text().then(function (body) {
                let hasCalculatedShipping = false;
                try {
                    var json = JSON.parse(body);
                    const cep = getLatestPostcode(json.responses[0].body)
                    const calculateShipping = json.responses[0].body.has_calculated_shipping ? true : false;

                    if (json && calculateShipping === true) {
                        hasCalculatedShipping = true;
                    }

                    if (cep) {
                        if (latestPostcode !== cep) {
                            latestPostcode = cep
                        } else {
                            hasCalculatedShipping = false
                        }
                    }

                } catch (e) {
                }
                if (hasCalculatedShipping) {
                    wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress');
                }
            });
            return response;
        });
    };

    function getLatestPostcode(data) {
        if (data.shipping_address && data.shipping_address.postcode) {
            return data.shipping_address.postcode;
        } else if (data.billing_address && data.billing_address.postcode) {
            return data.billing_address.postcode;
        }
        return null;
    }
})();