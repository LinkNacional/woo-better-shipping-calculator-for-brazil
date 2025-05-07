document.addEventListener('DOMContentLoaded', function () {

    const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
    if (disableShipping) {
        console.log(disableShipping.value);
        if (disableShipping.value === 'all' || disableShipping.value === 'digital') {
            const numberField = document.getElementById('woo_better_calc_number_required');
            const hiddenField = document.getElementById('woo_better_hidden_cart_address');
            const requirePostcode = document.getElementById('woo_better_calc_cep_required');

            if (numberField) {
                numberField.disabled = true;
                numberField.style.backgroundColor = '#f1f1f1'; // Cinza claro
                numberField.style.cursor = 'not-allowed';
            }
            if (hiddenField) {
                hiddenField.disabled = true;
                hiddenField.style.backgroundColor = '#f1f1f1';
                hiddenField.style.cursor = 'not-allowed';
            }
            if (requirePostcode) {
                requirePostcode.disabled = true;
                requirePostcode.style.backgroundColor = '#f1f1f1';
                requirePostcode.style.cursor = 'not-allowed';
            }
        }
    }

    // Mensagem no footer
    const saveButton = document.querySelector('p.submit');
    if (saveButton) {
        const div = document.createElement('div');
        div.innerHTML = `
            <p>
                Quer conhecer mais sobre nossos plugins? Suporte WordPress 24h:
                <a href="https://www.linknacional.com.br/wordpress" target="_blank">Link Nacional</a>
                | Avalie nosso plugin
                <a href="https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews" target="_blank">★★★★★</a>.
            </p>
        `;
        // Inserir abaixo do <p class="submit">
        saveButton.insertAdjacentElement('afterend', div);
    }
});