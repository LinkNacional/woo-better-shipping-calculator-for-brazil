(function () {
    let countInterval = 0;
    const bodyInterval = setInterval(() => {
        if (countInterval > 20) {
            clearInterval(bodyInterval);
            return;
        }
        if (document.body) {
            clearInterval(bodyInterval);
            // Desabilitar campos adcionais
            const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
            if (disableShipping) {
                const numberField = document.getElementById('woo_better_calc_number_required');
                const hiddenField = document.getElementById('woo_better_hidden_cart_address');
                const requirePostcode = document.getElementById('woo_better_calc_cep_required');

                const minimumFreeShipping = document.getElementById('woo_better_enable_min_free_shipping');

                if (minimumFreeShipping) {
                    const minimumFreeShippingValue = document.getElementById('woo_better_min_free_shipping_value');
                    if (minimumFreeShippingValue) {
                        if (!minimumFreeShipping.checked && minimumFreeShippingValue) {
                            minimumFreeShippingValue.disabled = true;
                            minimumFreeShippingValue.style.backgroundColor = '#f1f1f1';
                            minimumFreeShippingValue.style.cursor = 'not-allowed';
                            minimumFreeShippingValue.value = 0;
                        }
                        minimumFreeShipping.addEventListener('change', function () {
                            if (minimumFreeShipping.checked) {
                                minimumFreeShippingValue.disabled = false;
                                minimumFreeShippingValue.style.backgroundColor = '';
                                minimumFreeShippingValue.style.cursor = '';
                            } else {
                                minimumFreeShippingValue.value = 0;
                                minimumFreeShippingValue.disabled = true;
                                minimumFreeShippingValue.style.backgroundColor = '#f1f1f1';
                                minimumFreeShippingValue.style.cursor = 'not-allowed';
                            }

                        });
                    }
                }

                if (disableShipping.value === 'all') {
                    if (numberField) {
                        numberField.disabled = true;
                        numberField.style.backgroundColor = '#f1f1f1';
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
                } else {
                    if (requirePostcode && requirePostcode.value === 'no') {
                        if (hiddenField) {
                            hiddenField.disabled = true;
                            hiddenField.style.backgroundColor = '#f1f1f1';
                            hiddenField.style.cursor = 'not-allowed';
                        }
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



            if (disableShipping) {

                const descBox = document.createElement('div');
                descBox.id = 'woo-better-calc-desc-box';
                descBox.style.marginTop = '10px';

                disableShipping.after(descBox);

                const descriptions = {
                    all: 'Todos os métodos de entrega e campos de endereço serão desabilitados.',
                    digital: 'Entrega será desabilitada apenas se o carrinho tiver somente produtos digitais.',
                    default: 'Entrega dinâmica será mantida conforme o padrão do Woocommerce.'
                };

                function updateDescription() {
                    const selected = disableShipping.value;
                    if (descBox && descriptions[selected]) {
                        descBox.innerHTML = '<p>' + (descriptions[selected] || '') + '</p>';
                    } else {
                        descBox.innerHTML = '';
                    }
                }

                if (disableShipping) {
                    updateDescription(); // Run on page load
                    disableShipping.addEventListener('change', updateDescription); // Update on change
                }
            }
        }
        countInterval++;
    }, 10);
})()