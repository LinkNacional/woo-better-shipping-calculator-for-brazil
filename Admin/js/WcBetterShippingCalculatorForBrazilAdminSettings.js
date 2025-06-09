document.addEventListener('DOMContentLoaded', function () {
    // Desabilitar campos adicionais
    const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
    if (disableShipping) {
        const numberField = document.querySelectorAll('input[name="woo_better_calc_number_required"]');
        const hiddenField = document.querySelectorAll('input[name="woo_better_hidden_cart_address"]');
        const requirePostcode = document.querySelectorAll('input[name="woo_better_calc_cep_required"]');
        const minimumFreeShippingRadios = document.querySelectorAll('input[name="woo_better_enable_min_free_shipping"]');

        if (minimumFreeShippingRadios.length > 0) {
            const minimumFreeShippingValue = document.getElementById('woo_better_min_free_shipping_value');
            if (minimumFreeShippingValue) {
                function updateMinimumFreeShippingValue() {
                    const selectedOption = Array.from(minimumFreeShippingRadios).find(radio => radio.checked)?.value;

                    if (selectedOption === 'yes') {
                        minimumFreeShippingValue.disabled = false;
                        minimumFreeShippingValue.style.backgroundColor = '';
                        minimumFreeShippingValue.style.cursor = '';
                    } else if (selectedOption === 'no') {
                        minimumFreeShippingValue.value = 0;
                        minimumFreeShippingValue.disabled = true;
                        minimumFreeShippingValue.style.backgroundColor = '#f1f1f1';
                        minimumFreeShippingValue.style.cursor = 'not-allowed';
                    }
                }

                // Atualiza o estado inicial com base na seleção atual
                updateMinimumFreeShippingValue();

                // Adiciona o evento de mudança para cada botão de rádio
                minimumFreeShippingRadios.forEach(radio => {
                    radio.addEventListener('change', updateMinimumFreeShippingValue);
                });
            }
        }

        function handleDisableShippingChange() {
            if (disableShipping.value === 'all') {
                if (numberField) {
                    numberField.forEach(radio => {
                        radio.disabled = true;
                        radio.style.cursor = 'not-allowed';

                        // Marca 'no' e desmarca 'yes' ao desabilitar
                        if (radio.value === 'no') {
                            radio.checked = true;
                        } else if (radio.value === 'yes') {
                            radio.checked = false;
                        }
                    });
                }
                if (hiddenField) {
                    hiddenField.forEach(radio => {
                        radio.disabled = true;
                        radio.style.cursor = 'not-allowed';

                        // Marca 'no' e desmarca 'yes' ao desabilitar
                        if (radio.value === 'no') {
                            radio.checked = true;
                        } else if (radio.value === 'yes') {
                            radio.checked = false;
                        }
                    });
                }
                if (requirePostcode) {
                    requirePostcode.forEach(radio => {
                        radio.disabled = true;
                        radio.style.cursor = 'not-allowed';

                        // Marca 'no' e desmarca 'yes' ao desabilitar
                        if (radio.value === 'no') {
                            radio.checked = true;
                        } else if (radio.value === 'yes') {
                            radio.checked = false;
                        }
                    });
                }
            } else {
                enableAllFields(); // Habilita os campos antes de aplicar a lógica adicional
            }
        }

        // Função para lidar com a lógica adicional do "requirePostcode"
        function handleRequirePostcodeChange() {
            if (requirePostcode) {
                const isPostcodeRequired = Array.from(requirePostcode).some(radio => radio.checked && radio.value === 'yes');
                if (hiddenField) {
                    hiddenField.forEach(radio => {
                        if (isPostcodeRequired) {
                            radio.disabled = false;
                            radio.style.cursor = '';
                        } else {
                            radio.disabled = true;
                            radio.style.cursor = 'not-allowed';
                        }
                    });
                }

                if (!isPostcodeRequired) {
                    hiddenField.forEach(radio => {
                        if (radio.value === 'no') {
                            radio.checked = true; // Marca 'no'
                        } else if (radio.value === 'yes') {
                            radio.checked = false; // Desmarca 'yes'
                        }
                    });
                }
            }
        }

        // Função para habilitar todos os campos
        function enableAllFields() {
            if (numberField) {
                numberField.forEach(radio => {
                    radio.disabled = false;
                    radio.style.cursor = '';
                });
            }
            if (hiddenField) {
                hiddenField.forEach(radio => {
                    radio.disabled = false;
                    radio.style.cursor = '';
                });
            }
            if (requirePostcode) {
                requirePostcode.forEach(radio => {
                    radio.disabled = false;
                    radio.style.cursor = '';
                });
            }
        }

        // Adiciona o evento change ao select "disableShipping"
        if (disableShipping) {
            handleDisableShippingChange();

            disableShipping.addEventListener('change', function () {
                handleDisableShippingChange();
                handleRequirePostcodeChange(); // Chama a lógica adicional após a mudança
            });
        }

        // Adiciona o evento change ao grupo de radios "requirePostcode"
        if (requirePostcode) {
            handleRequirePostcodeChange();

            requirePostcode.forEach(radio => {
                radio.addEventListener('change', handleRequirePostcodeChange);
            });
        }
    }

    // Mensagem no footer
    const saveButton = document.querySelector('p.submit');
    if (saveButton) {
        const div = document.createElement('div');
        div.innerHTML = `
            <p>
                <strong>Próximas funcionalidades:</strong> Gerador de etiqueta, Shortcode cálculo de CEP, Ratreio de pedido e muitos mais. <a href="https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/issues/new">Participe envie sua sugestão</a>.<br>
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
        // Seleciona o <p> com a classe 'description' associado ao campo
        function initializeDescriptionUpdater() {
            const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
            if (disableShipping) {
                // Seleciona o <p> com a classe 'description' associado ao campo
                const descBox = disableShipping.closest('.forminp')?.querySelector('p.description');
                if (descBox) {
                    const descriptions = {
                        all: 'Todos os métodos de entrega e campos de endereço serão desabilitados.',
                        digital: 'Entrega será desabilitada apenas se o carrinho tiver somente produtos digitais.',
                        default: 'Entrega dinâmica será mantida conforme o padrão do Woocommerce.'
                    };

                    function updateDescription() {
                        const selected = disableShipping.value;
                        if (descriptions[selected]) {
                            descBox.textContent = descriptions[selected]; // Atualiza o texto do <p>
                        } else {
                            descBox.textContent = ''; // Limpa o texto se não houver descrição
                        }
                    }

                    // Atualiza a descrição na carga inicial da página
                    updateDescription();

                    // Atualiza a descrição ao mudar o valor do campo
                    disableShipping.addEventListener('change', updateDescription);

                    // Retorna true para indicar que a inicialização foi concluída
                    return true;
                }
            }
            return false; // Retorna false se o componente ainda não estiver disponível
        }

        // Configura o MutationObserver para observar mudanças no DOM
        const observer = new MutationObserver(function () {
            if (initializeDescriptionUpdater()) {
                // Se a inicialização for bem-sucedida, desconecta o observer
                observer.disconnect();
            }
        });

        // Inicia o observer para observar mudanças no body
        observer.observe(document.body, { childList: true, subtree: true });

        // Tenta inicializar imediatamente caso o componente já esteja disponível
        initializeDescriptionUpdater();
    }
});