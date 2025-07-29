document.addEventListener('DOMContentLoaded', function () {
    const WooBetterData = window.WooBetterData || {}; // Dados localizados do PHP
    let containerFound = false;
    let blockPosition = 'h2[class*="order"]' // Posição padrão é 'top'
    let postcodeValue = '';
    let poscodeCache = '';
    let originalButtonText = '';

    function createParentContainer() {
        const parentContainer = document.createElement('div');
        parentContainer.classList.add('woo-better-parent-container');
        return parentContainer;
    }

    function createCurrentPostcodeBlock(postcode, form) {
        const currentPostcodeBlock = document.createElement('div');
        currentPostcodeBlock.classList.add('woo-better-current-postcode-block');

        // Texto com o CEP atual
        const postcodeText = document.createElement('span');
        postcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;
        postcodeText.classList.add('woo-better-current-postcode-text');

        // Botão para alterar o CEP
        const changeButton = document.createElement('button');
        changeButton.type = 'button';
        changeButton.textContent = 'Alterar';
        changeButton.classList.add('woo-better-change-postcode-button');

        changeButton.addEventListener('click', () => {
            currentPostcodeBlock.style.display = 'none'; // Esconde o bloco atual
            form.style.display = 'block'; // Exibe o formulário
        });

        currentPostcodeBlock.appendChild(postcodeText);
        currentPostcodeBlock.appendChild(changeButton);

        return currentPostcodeBlock;
    }

    function darkenColor(hex, amount) {
        // Remove o "#" se estiver presente
        hex = hex.replace('#', '');

        // Converte a cor hexadecimal para RGB
        const num = parseInt(hex, 16);
        let r = (num >> 16) - amount;
        let g = ((num >> 8) & 0x00FF) - amount;
        let b = (num & 0x0000FF) - amount;

        // Garante que os valores estejam no intervalo de 0 a 255
        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        // Converte de volta para hexadecimal
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    function createDynamicStyles() {
        const style = document.createElement('style');

        const originalColor = WooBetterData.inputStyles.backgroundColor || '#ffffff';
        const darkerColor = darkenColor(originalColor, 10);

        // Define os estilos dinamicamente com base nos valores localizados
        const css = `
            .woo-better-info-block {
                background-color: ${originalColor} !important;
                color: ${WooBetterData.inputStyles.color} !important;
                border: ${WooBetterData.inputStyles.borderWidth} ${WooBetterData.inputStyles.borderStyle} ${WooBetterData.inputStyles.borderColor} !important;
                border-radius: ${WooBetterData.inputStyles.borderRadius} !important;
                padding: 10px !important;
                margin: 20px 0px !important;
                font-family: 'Poppins', sans-serif !important;
                font-size: 14px !important;
            }

            .woo-better-current-postcode-block {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 10px;
                padding: 10px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: ${darkerColor} !important;
            }
        `;

        // Adiciona os estilos ao elemento <style>
        style.appendChild(document.createTextNode(css));

        // Insere o elemento <style> no <head> do documento
        document.head.appendChild(style);
    }

    function createInfoBlock(cartInfo, shippingRates, postcode, form) {
        const infoBlock = document.createElement('div');
        infoBlock.classList.add('woo-better-info-block');

        if (!poscodeCache) {
            infoBlock.style.display = 'none';
        }

        // Botão para expandir/contrair o bloco
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.textContent = 'Esconder detalhes de entrega';
        toggleButton.classList.add('woo-better-toggle-button');

        // Conteúdo do bloco (inicialmente escondido)
        const contentBlock = document.createElement('div');
        contentBlock.classList.add('woo-better-content-block');
        contentBlock.style.display = 'none'; // Esconde o conteúdo inicialmente

        // Nome do Produto
        const cartName = document.createElement('p');

        // Cria o elemento <img> separadamente
        const cartIcon = document.createElement('img');
        cartIcon.src = WooBetterData.details_icon.cart;
        cartIcon.alt = 'Produto';
        cartIcon.classList.add('woo-better-icon');
        cartIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        cartName.appendChild(cartIcon);

        const cartText = document.createTextNode(` Carrinho`);
        cartName.appendChild(cartText);

        cartName.classList.add('woo-better-cart-name');

        const cartQuantity = document.createElement('p');

        const quantityIcon = document.createElement('img');
        quantityIcon.src = WooBetterData.details_icon.quantity;
        quantityIcon.alt = 'Quantidade';
        quantityIcon.classList.add('woo-better-icon');
        quantityIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        cartQuantity.appendChild(quantityIcon);

        const quantityText = document.createTextNode(` Quantidade: ${cartInfo.quantity}`);
        cartQuantity.appendChild(quantityText);

        cartQuantity.classList.add('woo-better-cart-quantity');

        // Métodos de Entrega Disponíveis
        const shippingMethods = document.createElement('div');
        shippingMethods.classList.add('woo-better-shipping-methods');

        const shippingTitle = document.createElement('p');

        const shippingIcon = document.createElement('img');
        shippingIcon.src = WooBetterData.icon;
        shippingIcon.alt = 'Entrega';
        shippingIcon.classList.add('woo-better-icon');
        shippingIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        shippingTitle.appendChild(shippingIcon);

        const shippingText = document.createTextNode(' Métodos de Entrega:');
        shippingTitle.appendChild(shippingText);

        shippingMethods.appendChild(shippingTitle);

        const shippingList = document.createElement('ul');
        shippingList.classList.add('woo-better-shipping-list');

        shippingRates.forEach(rate => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `<strong>${rate.currency} ${parseFloat(rate.cost).toFixed(rate.currency_minor_unit).replace('.', ',')}</strong> - ${rate.label}`;
            shippingList.appendChild(listItem);
        });

        shippingMethods.appendChild(shippingList);

        contentBlock.appendChild(cartName);
        contentBlock.appendChild(cartQuantity);
        contentBlock.appendChild(shippingMethods);

        toggleButton.addEventListener('click', () => {
            if (contentBlock.style.display === 'none') {
                contentBlock.style.display = 'block';
                toggleButton.textContent = 'Esconder detalhes de entrega';
            } else {
                contentBlock.style.display = 'none';
                toggleButton.textContent = 'Exibir detalhes de entrega';
            }
        });

        infoBlock.appendChild(toggleButton);

        const currentPostcodeBlock = createCurrentPostcodeBlock(postcode, form);
        infoBlock.appendChild(currentPostcodeBlock);

        infoBlock.appendChild(contentBlock);

        return infoBlock;
    }

    function createForm() {
        const form = document.createElement('form');
        form.id = 'custom-postcode-form';
        form.style.marginTop = '20px';
        form.style.padding = '0px';

        if (poscodeCache) {
            form.style.display = 'none';
        }

        const containerDiv = document.createElement('div');
        containerDiv.classList.add('woo-better-container-current-style');

        const inputButtonGroup = document.createElement('div');
        inputButtonGroup.classList.add('woo-better-input-button-group-current-style');

        const inputWrapper = document.createElement('div');
        inputWrapper.classList.add('woo-better-input-wrapper-current-style');

        const input = document.createElement('input');
        input.type = 'text';
        input.name = 'woo_better_custom_cart_postcode';
        input.placeholder = WooBetterData.placeholder || 'Digite o CEP';
        input.classList.add('woo-better-input-current-style');
        input.autocomplete = 'postal-code';

        if (poscodeCache) {
            input.value = poscodeCache.postcode || '';
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

            const infoBlock = document.querySelector('.woo-better-info-block');
            if (infoBlock) {
                infoBlock.style.display = 'none'; // Esconde o bloco de informações
            }

            // Salva o texto original do botão
            originalButtonText = button.textContent;

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

            // Faz a requisição via fetch
            sendCEP(postcode)
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

    createDynamicStyles();
    // Configura o MutationObserver para monitorar alterações no DOM
    const observer = new MutationObserver(function (mutationsList, observer) {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const targetClass = setPosition();
                const targetElement = document.querySelector(targetClass);
                if (targetElement && !containerFound) {
                    containerFound = true;
                    observeQuantitySelector();
                    observeRemoveLink();

                    const parentContainer = createParentContainer();
                    const form = createForm();

                    const initializeData = {
                        cart: {
                            name: '*******',
                            quantity: WooBetterData.quantity,
                            currency: 'R$',
                            currency_minor_unit: 2,
                        },
                        shipping_rates: [
                            {
                                id: '**********',
                                label: '***********',
                                cost: 12.34,
                            },
                        ],
                        postcode: '123456-789',
                    };

                    const cartInfoBlock = createInfoBlock(initializeData.cart, initializeData.shipping_rates, initializeData.postcode, form);

                    // Adiciona o formulário e o bloco de informações à div pai
                    parentContainer.appendChild(form);
                    parentContainer.appendChild(cartInfoBlock);

                    targetElement.insertAdjacentElement('afterend', parentContainer);

                    poscodeCache = getPoscodeCached();

                    if (poscodeCache) {
                        const checkPostcode = document.querySelector('.woo-better-button-current-style');
                        const inputPostcode = document.querySelector('.woo-better-input-current-style');
                        if (checkPostcode && inputPostcode) {
                            inputPostcode.value = poscodeCache.postcode || '';
                            checkPostcode.click()
                        }
                    }

                    observer.disconnect();
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

                    const addressAPIUrl = WooBetterData.ajaxurl;

                    const formData = new FormData();
                    formData.append('action', 'register_cart_address');
                    formData.append('shipping[address_1]', addressData);
                    formData.append('shipping[city]', cityData);
                    formData.append('shipping[state]', stateData);
                    formData.append('shipping[postcode]', postcodeValue);
                    formData.append('shipping[country]', 'BR');

                    fetch(addressAPIUrl, {
                        method: 'POST',
                        headers: {
                            'nonce': WooBetterData.nonce,
                        },
                        body: formData,
                    })
                        .then(response => response.json())
                        .then(response => {
                            if (response.success) {
                                const infoBlock = document.querySelector('.woo-better-info-block');
                                const form = document.querySelector('#custom-postcode-form');

                                processShippingRates(response.data, form, infoBlock, postcode)
                                    .then(() => {
                                        const button = document.querySelector('.woo-better-button-current-style');
                                        const input = document.querySelector('.woo-better-input-current-style');
                                        // Reabilita o botão e o input após a conclusão da requisição
                                        button.disabled = false;
                                        input.disabled = false;

                                        // Restaura o texto original do botão
                                        button.textContent = originalButtonText;

                                        const cepBlock = document.querySelector('.woo-better-current-postcode-block');
                                        if (cepBlock) {
                                            // Atualiza o texto do bloco de CEP atual
                                            cepBlock.style.display = 'flex';
                                        }

                                        infoBlock.style.display = 'block';

                                        // Remove os estilos de desabilitado
                                        input.style.backgroundColor = WooBetterData.inputStyles.backgroundColor || '#fff';
                                        input.style.cursor = '';
                                        button.style.backgroundColor = WooBetterData.buttonStyles.backgroundColor || '#0073aa';
                                        button.style.cursor = '';

                                        const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                                        if (toggleButton) {
                                            toggleButton.textContent = 'Esconder detalhes de entrega';
                                        }

                                        if (poscodeCache) {
                                            const contentInfoBlock = infoBlock.querySelector('.woo-better-content-block');
                                            if (contentInfoBlock) {
                                                contentInfoBlock.style.display = 'block';
                                            }
                                        }
                                    })
                                    .catch(error => {
                                        console.error('Erro:', error);
                                        alert('Erro: ' + error.message || error);
                                    })
                            } else {
                                console.error('Erro:', response.message);
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

    function processShippingRates(response, form, infoBlock, postcode) {
        return new Promise((resolve, reject) => {
            try {
                const shippingRates = response;

                if (!shippingRates || !Array.isArray(shippingRates.shipping_rates) || shippingRates.shipping_rates.length === 0) {
                    return reject('Nenhuma taxa de envio foi encontrada.');
                }

                // Atualiza o CEP no cache
                const cacheKey = 'woo_better_postcode';
                const cacheData = {
                    postcode: postcode,
                    timestamp: Date.now(),
                };
                poscodeCache = cacheData
                localStorage.setItem(cacheKey, JSON.stringify(cacheData));

                // Esconde o formulário de CEP
                form.style.display = 'none';

                // Atualiza o componente com os dados recebidos
                const contentBlock = infoBlock.querySelector('.woo-better-content-block');

                const shippingList = contentBlock.querySelector('.woo-better-shipping-list');

                const cartQuantity = infoBlock.querySelector('.woo-better-cart-quantity');
                if (cartQuantity) {
                    const cartTextNode = cartQuantity.childNodes[1]; // O nó de texto está na posição 1
                    if (cartTextNode && cartTextNode.nodeType === Node.TEXT_NODE) {
                        cartTextNode.textContent = ` Quantidade: ${shippingRates.cart.quantity}`;
                    }
                }

                // Limpa a lista de métodos de envio antes de popular
                shippingList.innerHTML = '';

                // Popula a lista com os métodos de envio
                shippingRates.shipping_rates.forEach(rate => {
                    const listItem = document.createElement('li');
                    const cost = parseFloat(rate.cost).toFixed(2).replace('.', ',');
                    listItem.innerHTML = `<strong>R$ ${cost}</strong> - ${rate.label}`;
                    shippingList.appendChild(listItem);
                });

                // Atualiza o CEP no bloco de CEP atual
                const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;

                // Resolve a Promise após a conclusão
                resolve();
            } catch (error) {
                console.error('Erro ao processar as taxas de envio:', error);
                reject(error);
            }
        });
    }

    function observeQuantitySelector() {
        const targetClass = '.wc-block-components-quantity-selector__input';
        const targetElements = document.querySelectorAll(targetClass);

        targetElements.forEach((targetElement) => {
            const observer = new MutationObserver(() => {
                // Lógica a ser executada quando o componente for alterado
                setTimeout(() => {
                    poscodeCache = getPoscodeCached();

                    if (poscodeCache) {
                        const form = document.querySelector('#custom-postcode-form');
                        const checkPostcode = document.querySelector('.woo-better-button-current-style');
                        const inputPostcode = document.querySelector('.woo-better-input-current-style');
                        if (form && checkPostcode && inputPostcode) {
                            form.style.display = 'block';
                            inputPostcode.value = poscodeCache.postcode || '';
                            checkPostcode.click();
                        }
                    }
                }, 1000)
            });

            // Configura o observer para monitorar alterações no valor do input
            observer.observe(targetElement, {
                attributes: true, // Monitora alterações nos atributos
                attributeFilter: ['value'], // Monitora especificamente o atributo "value"
            });
        });
    }

    function observeRemoveLink() {
        const targetClass = '.wc-block-cart-item__remove-link';
        const targetElements = document.querySelectorAll(targetClass);

        targetElements.forEach((targetElement) => {
            // Adiciona um listener para o evento 'click'
            targetElement.addEventListener('click', () => {
                setTimeout(() => {
                    // Lógica a ser executada após o clique no botão de remover
                    poscodeCache = getPoscodeCached();

                    if (poscodeCache) {
                        const form = document.querySelector('#custom-postcode-form');
                        const checkPostcode = document.querySelector('.woo-better-button-current-style');
                        const inputPostcode = document.querySelector('.woo-better-input-current-style');
                        if (form && checkPostcode && inputPostcode) {
                            form.style.display = 'block';
                            inputPostcode.value = poscodeCache.postcode || '';
                            checkPostcode.click();
                        }
                    }
                }, 1000); // Aguarda 1 segundo para garantir que o DOM seja atualizado
            });
        });
    }

    function getPoscodeCached() {
        const cacheKey = 'woo_better_postcode'; // Chave fixa
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