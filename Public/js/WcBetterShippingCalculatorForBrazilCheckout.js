(function () {
    var origFetch = window.fetch;
    window.fetch = function () {
        var url = arguments[0];
        var options = arguments[1] || {};
        return origFetch.apply(this, arguments).then(function (response) {
            var clone = response.clone();
            clone.text().then(function (body) {
                try {
                    var json = JSON.parse(body);
                    const calculateShipping = json.responses?.[0]?.body?.has_calculated_shipping ? true : false;

                    if (calculateShipping) {
                        wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress');
                    }
                } catch (e) { }
            });
            return response;
        });
    };
})();