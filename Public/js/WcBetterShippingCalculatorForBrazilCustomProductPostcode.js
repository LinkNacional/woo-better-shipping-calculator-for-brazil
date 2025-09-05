document.addEventListener('DOMContentLoaded', function () {
    const WooBetterData = window.WooBetterData || {}; // Dados localizados do PHP
    let containerFound = false;
    let blockPosition = 'h1[class*="title"]' // Posição padrão é 'top'
    let postcodeValue = '';
    let poscodeCache = '';
    let originalButtonText = '';
    let productNonce = '';

    function createParentContainer() {
        const parentContainer = document.createElement('div');
        parentContainer.classList.add('woo-better-parent-container');
        return parentContainer;
    }

    // Função para buscar o nonce via AJAX
    function fetchProductNonce(callback) {
        const formData = new FormData();
        formData.append('action', 'wc_better_calc_get_nonce');
        formData.append('action_nonce', 'woo_better_register_product_address');

        fetch(WooBetterData.ajaxurl, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.nonce) {
                    productNonce = data.data.nonce;
                }
                callback();
            })
            .catch(() => {
                // Em caso de erro, segue normalmente
                callback();
            });
    }

    function enablePostcodeForm() {
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

        // Remove os estilos de desabilitado
        input.style.backgroundColor = WooBetterData.inputStyles.backgroundColor || '#fff';
        input.style.cursor = '';
        button.style.backgroundColor = WooBetterData.buttonStyles.backgroundColor || '#0073aa';
        button.style.cursor = '';
    }

    function createCurrentPostcodeBlock(postcode, form) {
        const currentPostcodeBlock = document.createElement('div');
        currentPostcodeBlock.classList.add('woo-better-current-postcode-block');

        // Cria uma div para agrupar o botão de expandir/contrair e o texto do CEP
        const toggleAndPostcodeWrapper = document.createElement('div');
        toggleAndPostcodeWrapper.classList.add('woo-better-toggle-postcode-wrapper'); // Classe para estilização, se necessário

        // Botão para expandir/contrair o bloco
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
        toggleButton.classList.add('woo-better-toggle-button');

        // Texto com o CEP atual
        const postcodeText = document.createElement('span');
        postcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;
        postcodeText.classList.add('woo-better-current-postcode-text');

        toggleButton.addEventListener('click', () => {
            const contentBlock = document.querySelector('.woo-better-content-block');
            if (contentBlock) {
                if (contentBlock.classList.contains('expanded')) {
                    // Recolhe o bloco
                    contentBlock.style.height = `${contentBlock.scrollHeight}px`; // Define a altura atual
                    requestAnimationFrame(() => {
                        contentBlock.style.height = '0'; // Transição para altura 0
                    });
                    contentBlock.classList.remove('expanded');
                    toggleButton.innerHTML = '';
                    displayButton(toggleButton, 'down', 'Exibir detalhes de entrega');
                } else {
                    // Expande o bloco
                    contentBlock.style.height = `${contentBlock.scrollHeight}px`; // Define a altura para o conteúdo completo
                    contentBlock.classList.add('expanded');
                    toggleButton.innerHTML = '';
                    displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');

                    // Mantém a altura calculada após a transição
                    contentBlock.addEventListener(
                        'transitionend',
                        () => {
                            if (contentBlock.classList.contains('expanded')) {
                                contentBlock.style.height = `${contentBlock.scrollHeight}px`; // Mantém a altura calculada
                            }
                        },
                        { once: true }
                    );
                }
            }
        });

        // Adiciona o botão e o texto do CEP à div agrupadora
        toggleAndPostcodeWrapper.appendChild(toggleButton);
        toggleAndPostcodeWrapper.appendChild(postcodeText);

        // Botão para alterar o CEP
        const changeButton = document.createElement('button');
        changeButton.type = 'button';
        changeButton.textContent = 'Alterar';
        changeButton.classList.add('woo-better-change-postcode-button');

        changeButton.addEventListener('click', () => {
            const infoBlock = document.querySelector('.woo-better-info-block');
            if (infoBlock) {
                infoBlock.style.display = 'none'; // Esconde o bloco atual
            }
            form.style.display = 'block'; // Exibe o formulário
        });

        // Adiciona a div agrupadora e o botão "Alterar" ao bloco principal
        currentPostcodeBlock.appendChild(toggleAndPostcodeWrapper);
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
                color: ${WooBetterData.inputStyles.color} !important;
                border-radius: ${WooBetterData.inputStyles.borderRadius} !important;
                padding: 0px !important;
                margin: 20px 0px !important;
                font-family: 'Poppins', sans-serif !important;
                font-size: 14px !important;
            }

            .woo-better-current-postcode-block {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
                background-color: ${darkerColor} !important;
                min-width: 200px;
            }

            .woo-better-content-block {
                margin-top: -3px;
                padding: 0px 20px;
                background-color: ${originalColor} !important;
                border: none;
                height: 0;
                overflow: hidden;
                transition: height 0.3s ease;
                box-shadow: none;
            }

            .woo-better-content-block.expanded {
                height: auto; 
                padding: 10px 20px;
                border-bottom-right-radius: ${WooBetterData.inputStyles.borderRadius} !important;
                border-bottom-left-radius: ${WooBetterData.inputStyles.borderRadius} !important;
                border: ${WooBetterData.inputStyles.borderWidth} ${WooBetterData.inputStyles.borderStyle} ${WooBetterData.inputStyles.borderColor} !important;
                border-top: 0px !important;
            }
        `;

        // Adiciona os estilos ao elemento <style>
        style.appendChild(document.createTextNode(css));

        // Insere o elemento <style> no <head> do documento
        document.head.appendChild(style);
    }

    function displayButton(component, name, text) {
        const toggleIcon = document.createElement('img');
        toggleIcon.src = WooBetterData.display_icon[name];
        toggleIcon.alt = text;
        toggleIcon.classList.add('woo-better-toggle-icon');
        toggleIcon.classList.add(WooBetterData.iconColor || 'black-icon');
        component.appendChild(toggleIcon);
    }

    function createInfoBlock(productInfo, shippingRates, postcode, form) {
        const infoBlock = document.createElement('div');
        infoBlock.classList.add('woo-better-info-block');

        const lastPostcode = getLastUsedPostcode();
        if (!lastPostcode || WooBetterData.enable_search !== 'yes') {
            // Não exibe cache se:
            // 1. Não há CEP salvo, OU
            // 2. Consulta automática está desabilitada
            infoBlock.style.display = 'none';
        } else {
            // Verifica se existe cache para este CEP (qualquer produto)
            const cache = getProductCache();
            const hasAnyCacheForCep = cache[lastPostcode] && Object.keys(cache[lastPostcode]).length > 0;

            if (hasAnyCacheForCep) {
                // Se há cache para este CEP, exibe o bloco
                infoBlock.style.display = 'block';
            } else {
                // Se não há cache, mantém escondido inicialmente
                infoBlock.style.display = 'none';
            }
        }

        // Conteúdo do bloco (inicialmente escondido)
        const contentBlock = document.createElement('div');
        contentBlock.classList.add('woo-better-content-block');
        contentBlock.style.display = 'none'; // Esconde o conteúdo inicialmente

        // Nome do Produto
        const productName = document.createElement('p');

        // Cria o elemento <img> separadamente
        const productIcon = document.createElement('img');
        productIcon.src = WooBetterData.details_icon.product;
        productIcon.alt = 'Produto';
        productIcon.classList.add('woo-better-icon');
        productIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        productName.appendChild(productIcon);

        const productText = document.createTextNode(` Produto`);
        productName.appendChild(productText);

        productName.classList.add('woo-better-product-name');

        const productQuantity = document.createElement('p');

        const quantityIcon = document.createElement('img');
        quantityIcon.src = WooBetterData.details_icon.quantity;
        quantityIcon.alt = 'Quantidade';
        quantityIcon.classList.add('woo-better-icon');
        quantityIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        productQuantity.appendChild(quantityIcon);

        const quantityText = document.createTextNode(` Quantidade: ${productInfo.quantity}`);
        productQuantity.appendChild(quantityText);

        productQuantity.classList.add('woo-better-product-quantity');

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
            listItem.innerHTML = `<strong>${productInfo.currency_symbol} ${parseFloat(rate.cost).toFixed(productInfo.currency_minor_unit).replace('.', ',')}</strong> - ${rate.label}`;
            shippingList.appendChild(listItem);
        });

        shippingMethods.appendChild(shippingList);

        contentBlock.appendChild(productName);
        contentBlock.appendChild(productQuantity);
        contentBlock.appendChild(shippingMethods);

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

        const lastPostcode = getLastUsedPostcode();
        if (lastPostcode && WooBetterData.enable_search === 'yes') {
            // Só esconde o formulário se há CEP salvo E a consulta automática está habilitada
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
        input.name = 'woo_better_custom_product_postcode';
        input.placeholder = WooBetterData.placeholder || 'Digite o CEP';
        input.classList.add('woo-better-input-current-style');
        input.autocomplete = 'postal-code';

        if (lastPostcode) {
            input.value = lastPostcode;
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

            // Verifica se existe cache para este CEP e produto específico
            const cachedData = getCachedShippingData(postcode, WooBetterData.product_id);
            const infoBlock = document.querySelector('.woo-better-info-block');

            // Verifica se existe algum cache para este CEP (qualquer produto)
            const cache = getProductCache();
            const hasAnyCacheForCep = cache[postcode] && Object.keys(cache[postcode]).length > 0;

            // Só esconde o bloco se não há nenhum cache para este CEP
            if (infoBlock && !hasAnyCacheForCep) {
                infoBlock.style.display = 'none';
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
        if (WooBetterData.position === 'custom') {
            blockPosition = WooBetterData.custom_position || 'h1[class*="title"]'; // Posição personalizada definida pelo usuário
        } else {
            const position = WooBetterData.position || 'top'; // Posição padrão é 'top'
            if (position === 'middle') {
                blockPosition = 'div[class*="price"], p[class*="price"]';
            } else if (position === 'bottom') {
                blockPosition = 'form[class*="cart"]';
            }
        }
        return blockPosition
    }

    createDynamicStyles();

    // Valida e limpa cache antigo baseado no token
    validateCacheToken();

    // Configura o MutationObserver para monitorar alterações no DOM
    const observer = new MutationObserver(function (mutationsList, observer) {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const targetClass = setPosition();
                const targetElement = document.querySelector(targetClass);
                const oldForm = document.querySelector('.wc-block-components-shipping-calculator-address')
                const existingContainer = document.querySelector('.woo-better-parent-container');

                if (targetElement && !containerFound && !oldForm) {
                    containerFound = true;

                    // Remove container antigo se existir (para evitar duplicação ao mudar de produto)
                    if (existingContainer) {
                        existingContainer.remove();
                    }

                    const parentContainer = createParentContainer();
                    const form = createForm();

                    const initializeData = {
                        product: {
                            name: '*******',
                            quantity: WooBetterData.quantity,
                            currency_symbol: 'R$',
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

                    const productInfoBlock = createInfoBlock(initializeData.product, initializeData.shipping_rates, initializeData.postcode, form);

                    // Adiciona o formulário e o bloco de informações à div pai
                    parentContainer.appendChild(form);
                    parentContainer.appendChild(productInfoBlock);

                    targetElement.insertAdjacentElement('afterend', parentContainer);

                    // Chama a função para buscar o nonce e depois executa a lógica do cache
                    fetchProductNonce(function () {
                        const lastPostcode = getLastUsedPostcode();

                        if (lastPostcode) {
                            const inputPostcode = document.querySelector('.woo-better-input-current-style');
                            if (inputPostcode) {
                                inputPostcode.value = lastPostcode;

                                // Sempre mostra o componente imediatamente quando há CEP salvo
                                if (WooBetterData.enable_search && WooBetterData.enable_search === 'yes') {
                                    const infoBlock = document.querySelector('.woo-better-info-block');
                                    if (infoBlock) {
                                        // Mostra o componente com estado de carregamento
                                        infoBlock.style.display = 'block';

                                        const shippingList = infoBlock.querySelector('.woo-better-shipping-list');
                                        if (shippingList) {
                                            shippingList.innerHTML = '<li>Carregando taxas de envio...</li>';
                                        }

                                        const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                                        if (toggleButton) {
                                            toggleButton.innerHTML = '';
                                            displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                                        }

                                        const contentInfoBlock = infoBlock.querySelector('.woo-better-content-block');
                                        if (contentInfoBlock) {
                                            contentInfoBlock.classList.add('expanded');
                                            contentInfoBlock.style.display = 'block';
                                            contentInfoBlock.style.height = 'auto';
                                        }

                                        // Atualiza o CEP no componente
                                        const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                                        if (currentPostcodeText) {
                                            currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${lastPostcode}`;
                                        }
                                    }

                                    // Agora faz a consulta para atualizar os dados
                                    const checkPostcode = document.querySelector('.woo-better-button-current-style');
                                    if (checkPostcode) {
                                        checkPostcode.click();
                                    }
                                }
                                // Se enable_search não estiver habilitado, apenas preenche o campo
                            }
                        }
                        observer.disconnect();
                    });
                }
            }
        });
    });

    // Função para validar e limpar cache baseado no token
    function validateCacheToken() {
        if (!isTokenValid()) {
            clearAllCaches();
            updateTokenCache();
        }
    }

    async function sendCEP(postcode) {
        // Primeiro verifica se existe no cache para este produto específico
        const cachedData = getCachedShippingData(postcode, WooBetterData.product_id);

        if (cachedData) {
            // Se existe no cache para este produto, usa os dados do cache
            setTimeout(() => {
                const infoBlock = document.querySelector('.woo-better-info-block');
                const form = document.querySelector('#custom-postcode-form');

                processShippingRatesFromCache(cachedData, form, infoBlock, postcode);
                enablePostcodeForm();
            }, 300);
            return;
        }

        // Se não existe cache para este produto específico, verifica se há cache para outros produtos com o mesmo CEP
        const cache = getProductCache();
        const hasOtherProductCache = cache[postcode] && Object.keys(cache[postcode]).length > 0;

        if (hasOtherProductCache) {
            // Se há cache para outros produtos, mantém o componente visível com dados temporários
            const infoBlock = document.querySelector('.woo-better-info-block');
            if (infoBlock) {
                // Mantém o bloco visível mas indica que está carregando dados específicos do produto
                const productName = infoBlock.querySelector('.woo-better-product-name');
                if (productName) {
                    const productTextNode = productName.childNodes[1];
                    if (productTextNode && productTextNode.nodeType === Node.TEXT_NODE) {
                        productTextNode.textContent = ' Carregando dados do produto...';
                    }
                }

                const shippingList = infoBlock.querySelector('.woo-better-shipping-list');
                if (shippingList) {
                    shippingList.innerHTML = '<li>Calculando taxas de envio...</li>';
                }

                infoBlock.style.display = 'block';
            }
        }

        // Continua com a consulta normal via API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let apiUrl;
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
                    postcodeValue = postcode
                    addressData = data.address || '';
                    stateData = data.state_sigla || '';
                    cityData = data.city || '';

                    const addressAPIUrl = WooBetterData.ajaxurl;

                    const formData = new FormData();
                    formData.append('action', 'register_product_address');
                    formData.append('product_id', WooBetterData.product_id);
                    formData.append('shipping[address_1]', addressData);
                    formData.append('shipping[city]', cityData);
                    formData.append('shipping[state]', stateData);
                    formData.append('shipping[postcode]', postcodeValue);
                    formData.append('shipping[country]', 'BR');

                    fetch(addressAPIUrl, {
                        method: 'POST',
                        headers: {
                            'nonce': productNonce,
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
                                            toggleButton.innerHTML = '';
                                            displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                                        }

                                        const contentInfoBlock = infoBlock.querySelector('.woo-better-content-block');
                                        if (contentInfoBlock) {
                                            contentInfoBlock.classList.add('expanded');
                                            contentInfoBlock.style.display = 'block';
                                        }
                                    })
                                    .catch(error => {
                                        enablePostcodeForm();

                                        // Só mostra alert para erros de CEP inválido
                                        if (error && error.includes && error.includes('CEP')) {
                                            alert(error);
                                        }
                                    })
                            } else {
                                if (response.data.digital) {
                                    const infoBlock = document.querySelector('.woo-better-info-block');
                                    const form = document.querySelector('#custom-postcode-form');

                                    if (form) {
                                        form.style.display = 'none'; // Esconde o bloco de informações
                                    }

                                    const productName = infoBlock.querySelector('.woo-better-product-name');
                                    if (productName) {
                                        const productTextNode = productName.childNodes[1]; // O nó de texto está na posição 1
                                        if (productTextNode && productTextNode.nodeType === Node.TEXT_NODE) {
                                            productTextNode.textContent = ` Produto: ${response.data.product_name}`;
                                        }
                                    }

                                    if (infoBlock) {
                                        const postcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                                        const shippingList = infoBlock.querySelector('.woo-better-shipping-list');

                                        if (postcodeText) {
                                            postcodeText.innerHTML = `<strong>CEP</strong>: ${postcodeValue}`;
                                        }

                                        if (shippingList) {
                                            shippingList.innerHTML = '<li>Produto digital, não há taxas de envio.</li>';
                                        }

                                        infoBlock.style.display = 'block'; // Exibe o bloco de informações
                                        const contentBlock = infoBlock.querySelector('.woo-better-content-block');
                                        if (contentBlock) {
                                            contentBlock.classList.add('expanded');
                                            contentBlock.style.display = 'block';
                                        }
                                    }


                                    enablePostcodeForm();
                                } else {
                                    // Só mostra alert para erros relacionados ao CEP
                                    const message = response.data.message || 'Erro ao processar as taxas de envio.';

                                    if (message.toLowerCase().includes('cep')) {
                                        alert(message);
                                    }
                                    enablePostcodeForm();
                                }
                            }
                        })
                        .catch(error => {

                            // Só mostra alert para erros de CEP, não para problemas de rede
                            if (error.message && error.message.toLowerCase().includes('cep')) {
                                alert(error.message);
                            }
                            enablePostcodeForm();
                        });
                } else {
                    enablePostcodeForm();

                    // Só mostra alert se for problema específico do CEP
                    if (data.message && data.message.toLowerCase().includes('cep')) {
                        alert('Houve um erro ao consultar o CEP.');
                    }
                }
            })
            .catch(error => {
                enablePostcodeForm();
                clearTimeout(timeoutId); // Também limpa o timeout no erro


                // Só mostra alerts para erros específicos, não para problemas de rede/navegação
                if (error.name === 'AbortError') {

                } else if (error.message && !error.message.toLowerCase().includes('fetch')) {
                    // Só mostra alert se não for erro de fetch (navegação/rede)
                    alert('Erro na consulta do CEP. Tente novamente.');
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

                // Salva no novo sistema de cache estruturado
                setCachedShippingData(postcode, WooBetterData.product_id, shippingRates);

                // Atualiza o último CEP usado
                setLastUsedPostcode(postcode);

                // Esconde o formulário de CEP
                form.style.display = 'none';

                // Atualiza o componente com os dados recebidos
                const contentBlock = infoBlock.querySelector('.woo-better-content-block');

                const shippingList = contentBlock.querySelector('.woo-better-shipping-list');

                const productName = infoBlock.querySelector('.woo-better-product-name');
                if (productName) {
                    const productTextNode = productName.childNodes[1]; // O nó de texto está na posição 1
                    if (productTextNode && productTextNode.nodeType === Node.TEXT_NODE) {
                        productTextNode.textContent = ` Produto: ${shippingRates.product.name}`;
                    }
                }

                const productQuantity = infoBlock.querySelector('.woo-better-product-quantity');
                if (productQuantity) {
                    const productTextNode = productQuantity.childNodes[1]; // O nó de texto está na posição 1
                    if (productTextNode && productTextNode.nodeType === Node.TEXT_NODE) {
                        productTextNode.textContent = ` Quantidade: ${shippingRates.product.quantity}`;
                    }
                }

                // Limpa a lista de métodos de envio antes de popular
                shippingList.innerHTML = '';

                // Popula a lista com os métodos de envio
                shippingRates.shipping_rates.forEach(rate => {
                    const listItem = document.createElement('li');
                    const cost = parseFloat(rate.cost).toFixed(shippingRates.product.currency_minor_unit).replace('.', ',');
                    listItem.innerHTML = `<strong>${shippingRates.product.currency_symbol} ${cost}</strong> - ${rate.label}`;
                    shippingList.appendChild(listItem);
                });

                // Atualiza o CEP no bloco de CEP atual
                const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;

                // Resolve a Promise após a conclusão
                resolve();
            } catch (error) {

                reject(error);
            }
        });
    }

    function processShippingRatesFromCache(cachedData, form, infoBlock, postcode) {
        try {
            const shippingRates = cachedData;

            // Esconde o formulário de CEP
            form.style.display = 'none';

            // Atualiza o último CEP usado
            setLastUsedPostcode(postcode);

            // Mantém o bloco de informações visível e apenas atualiza o conteúdo
            const cepBlock = document.querySelector('.woo-better-current-postcode-block');
            if (cepBlock) {
                cepBlock.style.display = 'flex'; // Mantém visível
            }

            // Atualiza o componente com os dados do cache
            const contentBlock = infoBlock.querySelector('.woo-better-content-block');
            const shippingList = contentBlock.querySelector('.woo-better-shipping-list');

            const productName = infoBlock.querySelector('.woo-better-product-name');
            if (productName) {
                const productTextNode = productName.childNodes[1];
                if (productTextNode && productTextNode.nodeType === Node.TEXT_NODE) {
                    productTextNode.textContent = ` Produto: ${shippingRates.product.name}`;
                }
            }

            const productQuantity = infoBlock.querySelector('.woo-better-product-quantity');
            if (productQuantity) {
                const productTextNode = productQuantity.childNodes[1];
                if (productTextNode && productTextNode.nodeType === Node.TEXT_NODE) {
                    productTextNode.textContent = ` Quantidade: ${shippingRates.product.quantity}`;
                }
            }

            // Limpa e popula a lista de métodos de envio
            shippingList.innerHTML = '';
            shippingRates.shipping_rates.forEach(rate => {
                const listItem = document.createElement('li');
                const cost = parseFloat(rate.cost).toFixed(shippingRates.product.currency_minor_unit).replace('.', ',');
                listItem.innerHTML = `<strong>${shippingRates.product.currency_symbol} ${cost}</strong> - ${rate.label}`;
                shippingList.appendChild(listItem);
            });

            // Atualiza o CEP no bloco de CEP atual
            const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
            currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;

            // Garante que o bloco de informações esteja visível
            infoBlock.style.display = 'block';

            const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
            if (toggleButton) {
                toggleButton.innerHTML = '';
                displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
            }

            // Se o conteúdo não estiver expandido, expande com animação
            const contentInfoBlock = infoBlock.querySelector('.woo-better-content-block');
            if (contentInfoBlock && !contentInfoBlock.classList.contains('expanded')) {
                contentInfoBlock.style.height = '0';
                contentInfoBlock.style.display = 'block';

                // Força um reflow antes da animação
                contentInfoBlock.offsetHeight;

                // Aplica a animação
                contentInfoBlock.classList.add('expanded');
                contentInfoBlock.style.height = `${contentInfoBlock.scrollHeight}px`;

                // Remove a altura fixa após a animação
                contentInfoBlock.addEventListener('transitionend', () => {
                    if (contentInfoBlock.classList.contains('expanded')) {
                        contentInfoBlock.style.height = 'auto';
                    }
                }, { once: true });
            } else if (contentInfoBlock && contentInfoBlock.classList.contains('expanded')) {
                // Se já está expandido, apenas atualiza a altura
                contentInfoBlock.style.height = 'auto';
                contentInfoBlock.style.display = 'block';
            }

        } catch (error) {

            // Em caso de erro, remove o cache corrompido e força nova consulta
            const cache = getProductCache();
            if (cache[postcode] && cache[postcode][WooBetterData.product_id]) {
                delete cache[postcode][WooBetterData.product_id];
                localStorage.setItem('woo_better_product_cache', JSON.stringify(cache));
            }
        }
    }

    function getProductCache() {
        const cacheKey = 'woo_better_product_cache';
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);

                // Verifica se o token é válido
                if (!isTokenValid()) {
                    localStorage.removeItem(cacheKey);
                    return {};
                }

                // Usa o tempo de cache configurado pelo usuário (em minutos). Se for '0', nunca expira
                const cacheTimeMinutes = parseInt(WooBetterData.cache_time) || 0;

                // Se cacheTimeMinutes é 0, nunca expira (pula a limpeza)
                if (cacheTimeMinutes > 0) {
                    const cacheExpirationMs = cacheTimeMinutes * 60 * 1000; // converte minutos para milissegundos

                    // Limpa entradas expiradas
                    let hasExpired = false;
                    Object.keys(parsedData).forEach(cep => {
                        Object.keys(parsedData[cep]).forEach(productId => {
                            if (Date.now() - parsedData[cep][productId].timestamp > cacheExpirationMs) {
                                delete parsedData[cep][productId];
                                hasExpired = true;
                            }
                        });
                        // Remove CEPs vazios
                        if (Object.keys(parsedData[cep]).length === 0) {
                            delete parsedData[cep];
                            hasExpired = true;
                        }
                    });

                    // Atualiza o cache se houve expiração
                    if (hasExpired) {
                        localStorage.setItem(cacheKey, JSON.stringify(parsedData));
                    }
                }

                return parsedData;
            } catch (e) {
                localStorage.removeItem(cacheKey);
                return {};
            }
        }

        return {}; // Retorna objeto vazio se não houver cache
    }

    function getCachedShippingData(postcode, productId) {
        const cache = getProductCache();

        if (cache[postcode] && cache[postcode][productId]) {
            return cache[postcode][productId];
        }

        return null;
    }

    function setCachedShippingData(postcode, productId, shippingData) {
        const cacheKey = 'woo_better_product_cache';
        const cache = getProductCache();

        // Inicializa a estrutura se necessário
        if (!cache[postcode]) {
            cache[postcode] = {};
        }

        // Remove dados desnecessários da API antes de salvar
        const cleanData = {
            product: shippingData.product,
            shipping_rates: shippingData.shipping_rates,
            timestamp: Date.now()
        };

        // Salva os dados limpos
        cache[postcode][productId] = cleanData;

        localStorage.setItem(cacheKey, JSON.stringify(cache));
    }

    // Funções para gerenciar o token centralizado
    function isTokenValid() {
        const currentToken = WooBetterData.cache_token || '';
        const tokenCacheData = getTokenCacheData();

        return tokenCacheData.token === currentToken;
    }

    function updateTokenCache() {
        const currentToken = WooBetterData.cache_token || '';
        const tokenCacheData = getTokenCacheData();
        tokenCacheData.token = currentToken;
        tokenCacheData.last_token_update = Date.now();

        const tokenCacheKey = 'woo_better_token_cache_data';
        localStorage.setItem(tokenCacheKey, JSON.stringify(tokenCacheData));
    }

    function getLastUsedPostcode() {
        if (!isTokenValid()) {
            // Token inválido - limpa todos os caches
            clearAllCaches();
            return null;
        }

        // Primeiro verifica se há um CEP compartilhado salvo no token cache
        const sharedPostcode = getSharedPostcode();
        if (sharedPostcode) {
            return sharedPostcode;
        }

        const cacheTimeMinutes = parseInt(WooBetterData.cache_time) || 0;

        // Se nunca expira, retorna qualquer CEP do cache
        if (cacheTimeMinutes === 0) {
            const cache = getProductCache();
            const cepKeys = Object.keys(cache);
            return cepKeys.length > 0 ? cepKeys[0] : null;
        }

        // Se expira, precisa verificar timestamp - por agora retorna o primeiro CEP válido
        const cache = getProductCache();
        const cacheExpirationMs = cacheTimeMinutes * 60 * 1000;

        for (const cep of Object.keys(cache)) {
            for (const productId of Object.keys(cache[cep])) {
                if (Date.now() - cache[cep][productId].timestamp < cacheExpirationMs) {
                    return cep;
                }
            }
        }

        return null;
    }

    function setLastUsedPostcode(postcode) {
        // Salva o CEP como compartilhado entre produto e carrinho
        setSharedPostcode(postcode);
        updateTokenCache();
    }

    // Funções para gerenciar o CEP compartilhado
    function getSharedPostcode() {
        if (!isTokenValid()) {
            return null;
        }

        const tokenCacheData = getTokenCacheData();
        return tokenCacheData.shared_postcode || null;
    }

    function setSharedPostcode(postcode) {
        const tokenCacheData = getTokenCacheData();
        tokenCacheData.shared_postcode = postcode;
        tokenCacheData.last_updated = Date.now();

        const tokenCacheKey = 'woo_better_token_cache_data';
        localStorage.setItem(tokenCacheKey, JSON.stringify(tokenCacheData));
    }

    function getTokenCacheData() {
        const tokenCacheKey = 'woo_better_token_cache_data';
        const cacheData = localStorage.getItem(tokenCacheKey);

        if (cacheData) {
            try {
                return JSON.parse(cacheData);
            } catch (e) {
                return {};
            }
        }

        return {};
    } function clearAllCaches() {
        localStorage.removeItem('woo_better_product_cache');
        localStorage.removeItem('woo_better_cart_cache');
        localStorage.removeItem('woo_better_token_cache_data');
        // Remove também caches antigos para limpeza
        localStorage.removeItem('woo_better_token_cache');
        localStorage.removeItem('woo_better_postcode_cache');
        localStorage.removeItem('woo_better_last_postcode');
        localStorage.removeItem('woo_better_cart_postcode_cache_simple');
    }

    // Observa o corpo do documento
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});