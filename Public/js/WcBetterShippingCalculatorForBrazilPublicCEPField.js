window.jQuery(($) => {
    const params = window.wc_better_shipping_calculator_for_brazil_params;
    if (!params) return;

    const selectors = params.selectors;
    const refs = {
        body: $(document.body),
    };

    update_refs();
    refs.body.on('updated_wc_div', update_refs);
    refs.body.on('country_to_state_changed', update_refs);

    refs.body.on('keyup', selectors.postcode, apply_postcode_mask);

    function apply_postcode_mask(evt) {
        const input = evt ? $(evt.target) : refs.postcode;
        const value = input.val() || '';
        let postcode = value.replace(/[^0-9]/g, '').slice(0, 8);
        if (postcode.length > 5) {
            postcode = postcode.slice(0, 5) + '-' + postcode.slice(5);
        }
        input.val(postcode);
        input.prop('maxLength', 9); // length of "99999-999"
    }

    function update_refs() {
        const placeholder = params.postcode_placeholder;
        const input_type = params.postcode_input_type;
        refs.postcode = $(selectors.postcode);
        if (placeholder) {
            refs.postcode.prop('placeholder', placeholder);
            refs.postcode.prop('title', placeholder);
        }
        if (input_type) {
            refs.postcode.prop('type', input_type);
        }
        apply_postcode_mask();
    }
});
