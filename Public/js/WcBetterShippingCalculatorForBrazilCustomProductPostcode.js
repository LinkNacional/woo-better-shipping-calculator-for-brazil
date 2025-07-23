document.addEventListener('DOMContentLoaded', function () {
    const WooBetterData = window.WooBetterData || {}; // Dados localizados do PHP
    let containerFound = false;
    let blockPosition = '.wp-block-post-title' // Posição padrão é 'top'

    // Função para criar o formulário
    function createForm() {
        const form = document.createElement('form');
        form.id = 'custom-postcode-form';
        form.style.marginTop = '20px';

        const containerDiv = document.createElement('div');
        containerDiv.classList.add('woo-better-container-current-style');

        // Cria a div para agrupar o input com ícone e o botão
        const inputButtonGroup = document.createElement('div');
        inputButtonGroup.classList.add('woo-better-input-button-group-current-style');

        // Cria a div para o input e o ícone
        const inputWrapper = document.createElement('div');
        inputWrapper.classList.add('woo-better-input-wrapper-current-style');

        // Adiciona um campo de entrada
        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'woo_better_custom_product_postcode';
        input.placeholder = WooBetterData.placeholder || 'Digite o CEP';
        input.classList.add('woo-better-input-current-style');
        input.autocomplete = 'postal-code';

        // Aplica os estilos do input
        const inputStyles = WooBetterData.inputStyles || {};
        Object.keys(inputStyles).forEach(styleProperty => {
            input.style[styleProperty] = inputStyles[styleProperty];
        });

        input.addEventListener('input', function (e) {
            let value = e.target.value;

            // Remove todos os caracteres não numéricos, exceto o '-'
            value = value.replace(/[^\d-]/g, '');

            // Garante que o '-' só pode estar na posição 5
            if (value.includes('-')) {
                const parts = value.split('-');

                // Remove o hífen se ele estiver antes da posição 5 ou se houver mais de um hífen
                if (parts.length > 2 || parts[0].length > 5) {
                    value = parts[0].slice(0, 5) + '-' + parts[1]?.slice(0, 3);
                } else if (parts[0].length < 5) {
                    value = parts[0]; // Remove o hífen se ele for digitado antes da posição 5
                }
            }

            // Adiciona o hífen automaticamente se o comprimento for maior que 5 e o hífen não estiver presente
            if (value.length > 5 && !value.includes('-')) {
                value = value.slice(0, 5) + '-' + value.slice(5);
            }

            // Limita o tamanho do CEP a 9 caracteres (XXXXX-XXX)
            if (value.length > 9) {
                value = value.slice(0, 9);
            }

            // Atualiza o valor do campo de texto
            e.target.value = value;
        });

        // Cria o ícone
        const icon = document.createElement('img');
        icon.src = WooBetterData.icon // Define um ícone padrão da variável global
        icon.alt = 'Ícone de entrega';
        icon.classList.add('woo-better-icon-current-style');
        icon.classList.add(WooBetterData.iconColor || 'black-icon');

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(icon);

        // Adiciona um botão de envio
        const button = document.createElement('button');
        button.type = 'submit';
        button.textContent = 'CONSULTAR';
        button.classList.add('woo-better-button-current-style');

        // Aplica os estilos do botão
        const buttonStyles = WooBetterData.buttonStyles || {};
        Object.keys(buttonStyles).forEach(styleProperty => {
            button.style[styleProperty] = buttonStyles[styleProperty];
        });

        inputButtonGroup.appendChild(inputWrapper);
        inputButtonGroup.appendChild(button);

        containerDiv.appendChild(inputButtonGroup);

        const linkText = document.createElement('a');
        linkText.href = 'https://buscacepinter.correios.com.br/app/endereco/index.php';
        linkText.textContent = 'Não sei meu CEP';
        linkText.classList.add('woo-better-link-current-style');
        linkText.target = '_blank';

        // Adiciona o texto ao container
        containerDiv.appendChild(linkText);

        // Adiciona os elementos ao formulário
        form.appendChild(containerDiv);

        // Adiciona o evento de envio ao formulário
        form.addEventListener('submit', function (e) {
            e.preventDefault(); // Impede o envio padrão do formulário

            const postcode = input.value.trim();

            // Verifica se o CEP está no formato válido (XXXXX-XXX)
            const cepRegex = /^\d{5}-\d{3}$/;
            if (!cepRegex.test(postcode)) {
                alert('Por favor, insira um CEP válido no formato XXXXX-XXX.');
                return; // Interrompe o envio se o CEP for inválido
            }

            // Desabilita o botão e o input
            button.disabled = true;
            input.disabled = true;

            // Salva o texto original do botão
            const originalButtonText = button.textContent;

            // Substitui o texto do botão por um ícone de carregamento
            button.textContent = '';
            const loadingIcon = document.createElement('span');
            loadingIcon.classList.add('loading-icon'); // Usa a classe definida no CSS
            button.appendChild(loadingIcon);

            // Adiciona estilos de desabilitado ao input e botão
            input.style.backgroundColor = '#f0f0f0';
            input.style.cursor = 'not-allowed';
            button.style.backgroundColor = '#ccc';
            button.style.cursor = 'not-allowed';

            // Remove o componente de resultados anterior, se existir
            const resultsContainer = document.getElementById('shipping-rates-results');
            if (resultsContainer) {
                resultsContainer.remove();
            }

            // Faz a requisição via fetch
            sendCEP(postcode).finally(() => {
                // Reabilita o botão e o input após a conclusão da requisição
                button.disabled = false;
                input.disabled = false;

                // Restaura o texto original do botão
                button.textContent = originalButtonText;

                // Remove os estilos de desabilitado
                input.style.backgroundColor = WooBetterData.inputStyles.backgroundColor || '#fff';
                input.style.cursor = '';
                button.style.backgroundColor = WooBetterData.buttonStyles.backgroundColor || '#0073aa';
                button.style.cursor = '';
            });
        });

        return form;
    }

    function setPosition() {
        const position = WooBetterData.position || 'top'; // Posição padrão é 'top'
        if (position === 'middle') {
            blockPosition = '.wc-block-components-product-price'
        } else if (position === 'bottom') {
            blockPosition = '.wp-block-add-to-cart-form';
        }

        return blockPosition
    }

    // Configura o MutationObserver para monitorar alterações no DOM
    const observer = new MutationObserver(function (mutationsList, observer) {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const targetClass = setPosition();
                const targetElement = document.querySelector(targetClass);
                if (targetElement && !containerFound) {
                    containerFound = true; // Marca que o contêiner foi encontrado
                    const form = createForm();
                    targetElement.appendChild(form);
                    observer.disconnect(); // Para o observer após inserir o formulário
                }
            }
        });
    });

    async function sendCEP(postcode) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        if (typeof wpApiSettings !== 'undefined' && wpApiSettings.root) {
            apiUrl = wpApiSettings.root + `lknwcbettershipping/v1/cep/?postcode=${postcode}`;
        } else {
            if (typeof WooBetterData !== 'undefined' && WooBetterData.wooUrl !== '') {
                apiUrl = WooBetterData.wooUrl + `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcode}`;
            } else {
                apiUrl = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcode}`;
            }
        }

        await fetch(apiUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                clearTimeout(timeoutId);

                if (data.status === true) {
                    if (!data.address || !data.state_sigla || !data.city) {
                        postcodeError = true
                        if (addressSummary) {
                            removeLoading(addressSummary);
                            addressSummary.removeEventListener('click', blockInteraction, true);
                            if (iconSummary) {

                            }
                            iconSummary.removeEventListener('click', blockInteraction, true);
                        }

                        if (!data.address) {
                            return alert('Erro: Endereço inválido.');
                        }

                        if (!data.state_sigla) {
                            return alert('Erro: Estado inválido.');
                        }

                        if (!data.city) {
                            return alert('Erro: Cidade inválida.');
                        }
                    } else {
                        postcodeError = false
                    }

                    postcodeValue = postcode
                    addressData = data.address;
                    stateData = data.state_sigla;
                    cityData = data.city;

                    let wooNonce = ''
                    let wpNonce = ''

                    if (typeof wpApiSettings !== 'undefined' && wpApiSettings?.nonce) {
                        wpNonce = wpApiSettings.nonce
                    }

                    if (wcBlocksMiddlewareConfig) {
                        wooNonce = wcBlocksMiddlewareConfig.storeApiNonce
                    }

                    let batchUrl = ''

                    if (typeof wpApiSettings !== 'undefined' && wpApiSettings.root) {
                        batchUrl = wpApiSettings.root + `wc/store/v1/batch?_locale=site`;
                    } else {
                        batchUrl = window.location.origin + `/wp-json/wc/store/v1/batch?_locale=site`;
                        if (typeof WooBetterData !== 'undefined' && WooBetterData.wooUrl !== '') {
                            apiUrl = WooBetterData.wooUrl + `/wp-json/wc/store/v1/batch?_locale=site`;
                        } else {
                            apiUrl = `/wp-json/wc/store/v1/batch?_locale=site`;
                        }
                    }

                    fetch(batchUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Nonce': wooNonce,
                            'x-wp-nonce': wpNonce
                        },
                        body: JSON.stringify({
                            requests: [
                                {
                                    method: 'POST',
                                    path: '/wc/store/v1/cart/update-customer',
                                    body: {
                                        shipping_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        },
                                        billing_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        }
                                    },
                                    data: {
                                        shipping_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        },
                                        billing_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        }
                                    },
                                    headers: {
                                        'Nonce': wooNonce
                                    },
                                    cache: 'no-store'
                                }
                            ]
                        })
                    })
                        .then(response => response.json())
                        .then(data => {
                            processShippingRates(data);
                        })
                        .catch(error => {
                            console.error('Erro ao buscar os dados da API:', error);
                        });
                } else {
                    alert('Erro: ' + data.message);
                }
            })
            .catch(error => {
                clearTimeout(timeoutId); // Também limpa o timeout no erro
                if (error.name === 'AbortError') {
                    alert('Erro: Tempo limite de resposta excedido.');
                } else {
                    console.error(error);
                }
            });
    }

    function processShippingRates(response) {
        try {
            const shippingRates = response?.responses?.[0]?.body?.shipping_rates?.[0]?.shipping_rates;

            if (!shippingRates || !Array.isArray(shippingRates)) {
                console.error('Nenhuma taxa de envio encontrada.');
                return;
            }

            // Seleciona o formulário
            const form = document.getElementById('custom-postcode-form');

            // Remove o componente de resultados anterior, se existir
            let resultsContainer = document.getElementById('shipping-rates-results');
            if (resultsContainer) {
                resultsContainer.remove();
            }

            // Cria um novo contêiner para os resultados
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'shipping-rates-results';
            resultsContainer.style.marginTop = '20px';
            resultsContainer.style.padding = '10px';
            resultsContainer.style.border = WooBetterData.inputStyles.borderWidth + ' ' + WooBetterData.inputStyles.borderStyle + ' ' + WooBetterData.inputStyles.borderColor;
            resultsContainer.style.borderRadius = WooBetterData.inputStyles.borderRadius;
            resultsContainer.style.backgroundColor = WooBetterData.inputStyles.backgroundColor;
            resultsContainer.style.color = WooBetterData.inputStyles.color;

            // Adiciona um título ao contêiner
            const title = document.createElement('h4');
            title.textContent = 'Opções de Envio:';
            title.style.margin = '10px 0px';
            resultsContainer.appendChild(title);

            // Cria uma lista para exibir as taxas de envio
            const list = document.createElement('ul');
            list.style.listStyleType = 'none';
            list.style.padding = '0';
            list.style.margin = '20px 0px';

            shippingRates.forEach(rate => {
                const name = rate.name;
                const price = `${rate.currency_prefix}${(rate.price / 100).toFixed(rate.currency_minor_unit)}`;

                // Cria um item de lista para cada taxa de envio
                const listItem = document.createElement('li');
                listItem.style.marginBottom = '5px';

                // Adiciona o nome e o preço com destaque
                listItem.innerHTML = `<strong>${name}</strong>: ${price.replace('.', ',')}`;
                list.appendChild(listItem);
            });

            // Adiciona a lista ao contêiner de resultados
            resultsContainer.appendChild(list);

            // Adiciona o contêiner de resultados abaixo do formulário
            form.insertAdjacentElement('afterend', resultsContainer);
        } catch (error) {
            console.error('Erro ao processar as taxas de envio:', error);
        }
    }

    // Observa o corpo do documento
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});