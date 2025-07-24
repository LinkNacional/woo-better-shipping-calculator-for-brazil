document.addEventListener('DOMContentLoaded', function () {
    const WooBetterData = window.WooBetterData || {}; // Dados localizados do PHP
    let containerFound = false;
    let blockPosition = 'h2[class*="order"]' // Posição padrão é 'top'
    let postcodeValue = '';
    let cacheShippingRates = '';

    // Função para criar o formulário
    function createForm() {
        const form = document.createElement('form');
        form.id = 'custom-postcode-form';
        form.style.marginTop = '20px';
        form.style.padding = '0px'; 

        if (cacheShippingRates) {
            form.style.display = 'none';
        }

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
        input.name = 'woo_better_custom_cart_postcode';
        input.placeholder = WooBetterData.placeholder || 'Digite o CEP';
        input.classList.add('woo-better-input-current-style');
        input.autocomplete = 'postal-code';

        if (cacheShippingRates) {
            input.value = cacheShippingRates.postcode || '';
        }

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
            blockPosition = 'div[class*="shipping-block"]';
        } else if (position === 'bottom') {
            blockPosition = 'div[class*="totals-footer"]';
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
                    containerFound = true;
                    cacheShippingRates = getCachedShippingRates();

                    const form = createForm();
                    targetElement.insertAdjacentElement('afterend', form);

                    if (cacheShippingRates) {
                        const addNewCepContainer = document.createElement('div');
                        addNewCepContainer.style.width = '100%';
                        addNewCepContainer.style.textAlign = 'left';
                        addNewCepContainer.style.margin = '0px';

                        // Cria o "link" estilizado
                        const addNewCepButton = document.createElement('a');
                        addNewCepButton.textContent = 'Adicionar novo CEP';
                        addNewCepButton.classList.add('woo-better-add-new-cep-button');
                        addNewCepButton.style.display = 'inline-block';
                        addNewCepButton.style.width = 'fit-content';
                        addNewCepButton.style.cursor = 'pointer';
                        addNewCepButton.style.color = '#0073aa';
                        addNewCepButton.style.textDecoration = 'underline';
                        addNewCepButton.style.fontSize = '16px';
                        addNewCepButton.style.fontFamily = 'poppins, sans-serif';

                        if (WooBetterData.position !== 'top') {
                            addNewCepButton.style.marginTop = '10px';
                        }

                        // Adiciona evento ao "link" para exibir o formulário
                        addNewCepButton.addEventListener('click', function (e) {
                            e.preventDefault(); // Evita o comportamento padrão do link
                            form.style.display = 'block'; // Exibe o formulário
                            addNewCepContainer.style.display = 'none'; // Oculta o link
                        });

                        // Adiciona o "link" à div
                        addNewCepContainer.appendChild(addNewCepButton);

                        // Adiciona a div ao contêiner de destino
                        form.insertAdjacentElement('afterend', addNewCepContainer);

                        const shippingRates = cacheShippingRates.rates;

                        if (!shippingRates || !Array.isArray(shippingRates)) {
                            console.error('Nenhuma taxa de envio encontrada.');
                        } else {
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
                            resultsContainer.style.marginBottom = '20px';
                            resultsContainer.style.padding = '10px';
                            resultsContainer.style.border = WooBetterData.inputStyles.borderWidth + ' ' + WooBetterData.inputStyles.borderStyle + ' ' + WooBetterData.inputStyles.borderColor;
                            resultsContainer.style.borderRadius = WooBetterData.inputStyles.borderRadius;
                            resultsContainer.style.backgroundColor = WooBetterData.inputStyles.backgroundColor;
                            resultsContainer.style.color = WooBetterData.inputStyles.color;
                            resultsContainer.style.width = 'fit-content';

                            // Adiciona um título ao contêiner
                            const title = document.createElement('h4');
                            title.textContent = 'Opções de Envio:';
                            title.style.marginTop = '0px';
                            title.style.marginBottom = '10px';
                            title.style.fontSize = '18px'
                            title.style.fontFamily = 'poppins, sans-serif';
                            resultsContainer.appendChild(title);

                            // Cria uma lista para exibir as taxas de envio
                            const list = document.createElement('ul');
                            list.style.listStyleType = 'none';
                            list.style.padding = '0';
                            list.style.marginTop = '20px';
                            list.style.marginBottom = '0px';

                            shippingRates.forEach(rate => {
                                const name = rate.label;
                                const cost = parseFloat(rate.cost);
                                const price = `${rate.currency}${(cost).toFixed(rate.currency_minor_unit)}`;

                                // Cria um item de lista para cada taxa de envio
                                const listItem = document.createElement('li');
                                title.style.margin = '0px';
                                listItem.style.fontSize = '16px';
                                listItem.style.fontFamily = 'poppins, sans-serif';

                                if (shippingRates.length > 1) {
                                    listItem.style.marginBottom = '5px';
                                } else {
                                    listItem.style.margin = '0px';
                                }

                                // Adiciona o nome e o preço com destaque
                                listItem.innerHTML = `<strong>${name}</strong>: ${price.replace('.', ',')}`;
                                list.appendChild(listItem);
                            });

                            // Adiciona a lista ao contêiner de resultados
                            resultsContainer.appendChild(list);

                            // Adiciona o contêiner de resultados abaixo do formulário
                            addNewCepContainer.insertAdjacentElement('afterend', resultsContainer);
                        }
                    }
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

                    let addressAPIUrl = ''

                    if (typeof wpApiSettings !== 'undefined' && wpApiSettings.root) {
                        addressAPIUrl = wpApiSettings.root + 'lknwcbettershipping/v1/register-address/';
                    } else {
                        addressAPIUrl = window.location.origin + '/wp-json/lknwcbettershipping/v1/register-address/';
                        if (typeof WooBetterData !== 'undefined' && WooBetterData.wooUrl !== '') {
                            addressAPIUrl = WooBetterData.wooUrl + '/wp-json/lknwcbettershipping/v1/register-address/';
                        }
                    }

                    fetch(addressAPIUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            shipping: {
                                address_1: addressData,
                                city: cityData,
                                state: stateData,
                                postcode: postcodeValue,
                                country: 'BR',
                            }
                        }),
                    })
                        .then(response => response.json())
                        .then(data => {
                            if (data.status) {
                                processShippingRates(data.shipping_rates);
                            } else {
                                console.error('Erro:', data.message);
                            }
                        })
                        .catch(error => {
                            console.error('Erro na requisição:', error);
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
            const shippingRates = response;

            if (!shippingRates || !Array.isArray(shippingRates) || shippingRates.length === 0) {
                // Exibe uma mensagem informando que o carrinho está vazio
                const form = document.getElementById('custom-postcode-form');
                let resultsContainer = document.getElementById('shipping-rates-results');
                if (resultsContainer) {
                    resultsContainer.remove();
                }

                resultsContainer = document.createElement('div');
                resultsContainer.id = 'shipping-rates-results';
                resultsContainer.style.marginTop = '20px';
                resultsContainer.style.marginBottom = '20px';
                resultsContainer.style.padding = '10px';
                resultsContainer.style.border = WooBetterData.inputStyles.borderWidth + ' ' + WooBetterData.inputStyles.borderStyle + ' ' + WooBetterData.inputStyles.borderColor;
                resultsContainer.style.borderRadius = WooBetterData.inputStyles.borderRadius;
                resultsContainer.style.backgroundColor = WooBetterData.inputStyles.backgroundColor;
                resultsContainer.style.color = WooBetterData.inputStyles.color;
                resultsContainer.style.width = 'fit-content';

                const emptyMessage = document.createElement('p');
                emptyMessage.textContent = 'O carrinho está vazio ou nenhuma taxa de envio foi encontrada.';
                emptyMessage.style.margin = '10px 0px';
                resultsContainer.appendChild(emptyMessage);

                form.insertAdjacentElement('afterend', resultsContainer);
                return;
            }

            // Armazena os resultados no cache
            const cacheKey = `woo_better_shippingRates`;
            const cacheData = {
                postcode: postcodeValue,
                rates: shippingRates,
                timestamp: Date.now()
            };
            localStorage.setItem(cacheKey, JSON.stringify(cacheData));

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
            resultsContainer.style.marginBottom = '20px';
            resultsContainer.style.padding = '10px';
            resultsContainer.style.border = WooBetterData.inputStyles.borderWidth + ' ' + WooBetterData.inputStyles.borderStyle + ' ' + WooBetterData.inputStyles.borderColor;
            resultsContainer.style.borderRadius = WooBetterData.inputStyles.borderRadius;
            resultsContainer.style.backgroundColor = WooBetterData.inputStyles.backgroundColor;
            resultsContainer.style.color = WooBetterData.inputStyles.color;

            // Adiciona um título ao contêiner
            const title = document.createElement('h4');
            title.textContent = 'Opções de Envio:';
            title.style.marginTop = '0px';
            title.style.marginBottom = '10px';
            title.style.fontSize = '18px'
            title.style.fontFamily = 'poppins, sans-serif';

            resultsContainer.appendChild(title);

            // Cria uma lista para exibir as taxas de envio
            const list = document.createElement('ul');
            list.style.listStyleType = 'none';
            list.style.padding = '0';
            list.style.marginTop = '20px';
            list.style.marginBottom = '0px';

            shippingRates.forEach(rate => {
                const name = rate.label;
                const cost = parseFloat(rate.cost);
                const price = `${rate.currency}${(cost).toFixed(rate.currency_minor_unit)}`;

                // Cria um item de lista para cada taxa de envio
                const listItem = document.createElement('li');
                listItem.style.margin = '0px';
                listItem.style.fontSize = '16px';
                listItem.style.fontFamily = 'poppins, sans-serif';

                if (shippingRates.length > 1) {
                    listItem.style.marginBottom = '5px';
                } else {
                    listItem.style.margin = '0px';
                }

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

            const cacheKey = 'woo_better_shippingRates';
            if (localStorage.getItem(cacheKey)) {
                localStorage.removeItem(cacheKey);
            }
        }
    }

    function getCachedShippingRates() {
        const cacheKey = 'woo_better_shippingRates'; // Chave fixa
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            const parsedData = JSON.parse(cachedData);

            const oneMonth = 30 * 24 * 60 * 60 * 1000;
            if (Date.now() - parsedData.timestamp < oneMonth) {
                return parsedData;
            } else {
                localStorage.removeItem(cacheKey);
            }
        }

        return null; // Retorna null se não houver cache válido
    }

    // Observa o corpo do documento
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});