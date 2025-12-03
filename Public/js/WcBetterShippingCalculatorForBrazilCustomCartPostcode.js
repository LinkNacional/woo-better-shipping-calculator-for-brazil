document.addEventListener('DOMContentLoaded', function () {
    const WooBetterData = window.WooBetterData || {};

    let font_class = WooBetterData.inputStyles.fontClass || '';

    function debugLog(...args) {
    }

    // --- Lógica para sincronizar CEP do carrinho com cache personalizado ---
    const cartCep = WooBetterData.cart_cep || '';
    const lastPostcode = getLastUsedPostcode();
    if (cartCep && cartCep !== lastPostcode) {
        // Reseta cache e faz nova consulta usando o CEP do carrinho
        invalidateCache();
        setLastUsedPostcode(cartCep);
        sendCEP(cartCep, true);
    }

    let containerFound = false;
    let blockPosition = 'h2[class*="order"]'
    let postcodeValue = '';
    let originalButtonText = '';
    let cartNonce = '';
    let currentCartHash = '';
    let hasUserMadeQuery = false;

    function createParentContainer() {
        const parentContainer = document.createElement('div');
        parentContainer.classList.add('woo-better-parent-container');
        return parentContainer;
    }

    function generateCartHash() {
        const cartData = getCurrentCartData();
        const cartString = JSON.stringify(cartData);
        let hash = 0;
        for (let i = 0; i < cartString.length; i++) {
            const char = cartString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        const finalHash = Math.abs(hash).toString();
        return finalHash;
    }

    function fetchCartNonce(callback) {
        const formData = new FormData();
        formData.append('action', 'wc_better_calc_get_nonce');
        formData.append('action_nonce', 'woo_better_register_cart_address');

        fetch(WooBetterData.ajaxurl, {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data && data.data.nonce) {
                    cartNonce = data.data.nonce;
                }
                callback();
            })
            .catch(error => {
                callback();
            });
    }

    function enablePostcodeForm() {
        const button = document.querySelector('.woo-better-button-current-style');
        const input = document.querySelector('.woo-better-input-current-style');

        if (button) {
            button.disabled = false;
            button.textContent = originalButtonText;
            button.style.backgroundColor = WooBetterData.buttonStyles.backgroundColor || '#0073aa';
            button.style.cursor = '';
        }
        if (input) {
            input.disabled = false;
            input.style.backgroundColor = WooBetterData.inputStyles.backgroundColor || '#fff';
            input.style.cursor = '';
        }

        const cepBlock = document.querySelector('.woo-better-current-postcode-block');
        if (cepBlock) {
            cepBlock.style.display = 'flex';
        }

        const updateIcon = document.querySelector('.woo-better-update-icon');
        const updateIconContainer = document.querySelector('.woo-better-update-icon-container');
        if (updateIcon && updateIcon.classList.contains('spinning')) {
            setTimeout(() => {
                updateIcon.classList.remove('spinning');
                if (updateIconContainer) {
                    updateIconContainer.classList.remove('spinning-container');
                }
            }, 800);
        }
    }

    function createCurrentPostcodeBlock(postcode, form) {
        const currentPostcodeBlock = document.createElement('div');
        currentPostcodeBlock.classList.add('woo-better-current-postcode-block');

        const toggleAndPostcodeWrapper = document.createElement('div');
        toggleAndPostcodeWrapper.classList.add('woo-better-toggle-postcode-wrapper');

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
        toggleButton.classList.add('woo-better-toggle-button');

        const postcodeText = document.createElement('span');
        postcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;
        postcodeText.classList.add('woo-better-current-postcode-text');
        if (font_class) {
            postcodeText.classList.add(font_class);
        }

        toggleButton.addEventListener('click', () => {
            const contentBlock = document.querySelector('.woo-better-content-block');
            if (contentBlock) {
                if (contentBlock.classList.contains('expanded')) {
                    contentBlock.style.height = `${contentBlock.scrollHeight}px`;
                    requestAnimationFrame(() => {
                        contentBlock.style.height = '0';
                    });
                    contentBlock.classList.remove('expanded');
                    toggleButton.innerHTML = '';
                    displayButton(toggleButton, 'down', 'Exibir detalhes de entrega');
                } else {
                    contentBlock.style.height = `${contentBlock.scrollHeight}px`;
                    contentBlock.classList.add('expanded');
                    toggleButton.innerHTML = '';
                    displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');

                    contentBlock.addEventListener(
                        'transitionend',
                        () => {
                            if (contentBlock.classList.contains('expanded')) {
                                contentBlock.style.height = `${contentBlock.scrollHeight}px`;
                            }
                        },
                        { once: true }
                    );
                }
            }
        });

        toggleAndPostcodeWrapper.appendChild(toggleButton);
        toggleAndPostcodeWrapper.appendChild(postcodeText);

        const changeButton = document.createElement('button');
        changeButton.type = 'button';
        changeButton.textContent = 'Alterar';
        changeButton.classList.add('woo-better-change-postcode-button');
        if (font_class) {
            changeButton.classList.add(font_class);
        }

        changeButton.addEventListener('click', () => {
            const infoBlock = document.querySelector('.woo-better-info-block');
            if (infoBlock) {
                infoBlock.style.display = 'none';
            }
            form.style.display = 'block';
        });

        currentPostcodeBlock.appendChild(toggleAndPostcodeWrapper);
        currentPostcodeBlock.appendChild(changeButton);

        return currentPostcodeBlock;
    }

    function darkenColor(hex, amount) {
        hex = hex.replace('#', '');
        const num = parseInt(hex, 16);
        let r = (num >> 16) - amount;
        let g = ((num >> 8) & 0x00FF) - amount;
        let b = (num & 0x0000FF) - amount;

        r = Math.max(0, Math.min(255, r));
        g = Math.max(0, Math.min(255, g));
        b = Math.max(0, Math.min(255, b));

        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    function createDynamicStyles() {
        const style = document.createElement('style');

        const originalColor = WooBetterData.inputStyles.backgroundColor || '#ffffff';
        const darkerColor = darkenColor(originalColor, 10);
        const iconColor = WooBetterData.iconColor || 'blue-icon';
        let themeColor = '#007cba';

        switch (iconColor) {
            case 'black-icon':
                themeColor = '#000000';
                break;
            case 'gray-icon':
                themeColor = '#666666';
                break;
            case 'red-icon':
                themeColor = '#dc3545';
                break;
            case 'pink-icon':
                themeColor = '#e91e63';
                break;
            case 'green-icon':
                themeColor = '#28a745';
                break;
            case 'blue-icon':
            default:
                themeColor = '#007cba';
                break;
        }

        const css = `
            .woo-better-info-block {
                color: ${WooBetterData.inputStyles.color} !important;
                border-radius: ${WooBetterData.inputStyles.borderRadius} !important;
                padding: 0px !important;
                margin: 20px 0px !important;
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

            .woo-better-separator {
                border: none;
                border-top: 1px solid #e0e0e0;
                margin: 15px 0;
                opacity: 0.6;
            }

            .woo-better-update-section {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-top: 10px;
                padding: 10px 0;
            }

            .woo-better-update-icon-container {
                flex-shrink: 0;
                width: 44px;
                height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border-radius: 50%;
                border: none;
                background: transparent;
                padding: 0;
                transition: background-color 0.3s ease;
                outline: none;
            }

            .woo-better-update-icon-container:focus {
                outline: none;
                box-shadow: none;
            }

            .woo-better-update-icon-container:hover {
                background-color: ${themeColor}1a;
            }

            .woo-better-update-icon-container:hover .woo-better-update-icon {
                opacity: 1;
                transform: rotate(180deg);
            }

            .woo-better-update-icon {
                width: 32px;
                height: 32px;
                opacity: 0.8;
                transition: transform 0.3s ease, opacity 0.3s ease;
                pointer-events: none;
            }

            .woo-better-update-icon.spinning {
                animation: woo-better-spin 1s linear infinite;
                opacity: 1;
            }

            .woo-better-update-icon-container.spinning-container {
                opacity: 0.8 !important;
                cursor: not-allowed !important;
            }

            .woo-better-update-icon-container.spinning-container:hover {
                background-color: transparent !important;
            }

            .woo-better-update-icon-container.spinning-container:hover .woo-better-update-icon {
                transform: none !important;
            }

            @keyframes woo-better-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .woo-better-update-text-container {
                flex: 1;
                line-height: 1.4;
            }

            .woo-better-update-date {
                width: fit-content;
                padding: 3px;
                font-size: 13px;
                font-weight: 600;
                margin: 0 0 4px 0;
                color: ${WooBetterData.inputStyles.color || '#333'};
                opacity: 0.8;
                transition: all 0.3s ease;
            }

            .woo-better-update-date.flash {
                animation: woo-better-flash 2s ease-in-out;
            }

            @keyframes woo-better-flash {
                0%, 100% { 
                    background-color: transparent;
                }
                20%, 80% { 
                    background-color: ${themeColor}26;
                    border-radius: 4px;
                }
            }

            .woo-better-info-text {
                font-size: 12px;
                padding: 3px;
                margin: 0;
                color: ${WooBetterData.inputStyles.color || '#333'};
                opacity: 0.7;
                line-height: 1.3;
            }
        `;

        style.appendChild(document.createTextNode(css));
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

    function createInfoBlock(cartInfo, shippingRates, postcode, form) {
        const infoBlock = document.createElement('div');
        infoBlock.classList.add('woo-better-info-block');
        infoBlock.classList.add(font_class);

        const lastPostcode = getLastUsedPostcode();
        const hasRealData = cartInfo && cartInfo.name && cartInfo.name !== '****';

        if (!lastPostcode || WooBetterData.enable_search !== 'yes') {
            infoBlock.style.display = 'none';
        } else if (hasRealData) {
            infoBlock.style.display = 'block';
        } else {
            const cachedData = getCachedCartShippingData(lastPostcode);

            if (cachedData) {
                infoBlock.style.display = 'block';
            } else {
                infoBlock.style.display = 'none';
            }
        }

        const contentBlock = document.createElement('div');
        contentBlock.classList.add('woo-better-content-block');

        if (hasRealData) {
            contentBlock.style.display = 'block';
            contentBlock.classList.add('expanded');
        } else {
            contentBlock.style.display = 'none';
        }

        const cartName = document.createElement('p');
        const cartIcon = document.createElement('img');
        cartIcon.src = WooBetterData.details_icon.cart;
        cartIcon.alt = 'Produto';
        cartIcon.classList.add('woo-better-icon');
        cartIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        cartName.appendChild(cartIcon);

        const cartText = document.createTextNode(` Carrinho`);
        cartName.appendChild(cartText);

        cartName.classList.add('woo-better-cart-name');
        if (font_class) {
            cartName.classList.add(font_class);
        }

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
        if (font_class) {
            cartQuantity.classList.add(font_class);
        }

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
            if (font_class) {
                listItem.classList.add(font_class);
            }
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = cartInfo.currency_symbol;
            const decodedSymbol = tempDiv.textContent || tempDiv.innerText || cartInfo.currency_symbol;

            listItem.innerHTML = `<strong>${decodedSymbol} ${parseFloat(rate.cost).toFixed(cartInfo.currency_minor_unit).replace('.', ',')}</strong> - ${rate.label}`;
            shippingList.appendChild(listItem);
        });

        shippingMethods.appendChild(shippingList);

        const separator = document.createElement('hr');
        separator.classList.add('woo-better-separator');

        const updateSection = document.createElement('div');
        updateSection.classList.add('woo-better-update-section');

        const iconContainer = document.createElement('button');
        iconContainer.type = 'button';
        iconContainer.classList.add('woo-better-update-icon-container');
        iconContainer.title = 'Clique para atualizar os dados de frete do carrinho';

        const updateIcon = document.createElement('img');
        updateIcon.src = WooBetterData.update_icon.updates;
        updateIcon.alt = 'Atualizado';
        updateIcon.classList.add('woo-better-update-icon');
        updateIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        iconContainer.addEventListener('click', function () {
            if (updateIcon.classList.contains('spinning')) {
                return;
            }

            const currentPostcode = getLastUsedPostcode();
            if (currentPostcode) {
                updateIcon.classList.add('spinning');
                iconContainer.classList.add('spinning-container');
                invalidateCache();
                sendCEP(currentPostcode, true);
            }
        });

        iconContainer.appendChild(updateIcon);

        const textContainer = document.createElement('div');
        textContainer.classList.add('woo-better-update-text-container');

        const updateDate = document.createElement('p');
        updateDate.classList.add('woo-better-update-date');
        const currentDate = new Date().toLocaleString('pt-BR');
        updateDate.textContent = `Atualizado em ${currentDate}`;

        const infoText = document.createElement('p');
        infoText.classList.add('woo-better-info-text');
        infoText.textContent = 'Valor de frete calculado para todos os itens do carrinho.';

        textContainer.appendChild(updateDate);
        textContainer.appendChild(infoText);

        updateSection.appendChild(iconContainer);
        updateSection.appendChild(textContainer);

        contentBlock.appendChild(cartName);
        contentBlock.appendChild(cartQuantity);
        contentBlock.appendChild(shippingMethods);
        contentBlock.appendChild(separator);
        contentBlock.appendChild(updateSection);

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
        if (font_class) {
            input.classList.add(font_class);
        }
        input.autocomplete = 'postal-code';

        if (lastPostcode) {
            input.value = lastPostcode;
        }

        const inputStyles = WooBetterData.inputStyles || {};
        Object.keys(inputStyles).forEach(styleProperty => {
            input.style[styleProperty] = inputStyles[styleProperty];
        });

        input.addEventListener('input', function (e) {
            let value = e.target.value;
            value = value.replace(/[^\d-]/g, '');

            if (value.includes('-')) {
                const parts = value.split('-');

                if (parts.length > 2 || parts[0].length > 5) {
                    value = parts[0].slice(0, 5) + '-' + parts[1]?.slice(0, 3);
                } else if (parts[0].length < 5) {
                    value = parts[0];
                }
            }

            if (value.length > 5 && !value.includes('-')) {
                value = value.slice(0, 5) + '-' + value.slice(5);
            }

            if (value.length > 9) {
                value = value.slice(0, 9);
            }

            e.target.value = value;
        });

        const icon = document.createElement('img');
        icon.src = WooBetterData.icon
        icon.alt = 'Ícone de entrega';
        icon.classList.add('woo-better-icon-current-style');
        icon.classList.add(WooBetterData.iconColor || 'black-icon');

        inputWrapper.appendChild(input);
        inputWrapper.appendChild(icon);

        const button = document.createElement('button');
        button.type = 'submit';
        button.textContent = 'CONSULTAR';
        button.classList.add('woo-better-button-current-style');
        if (font_class) {
            button.classList.add(font_class);
        }

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
        if (font_class) {
            linkText.classList.add(font_class);
        }
        linkText.target = '_blank';

        containerDiv.appendChild(linkText);
        form.appendChild(containerDiv);

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const postcode = input.value.trim();
            const cepRegex = /^\d{5}-\d{3}$/;
            if (!cepRegex.test(postcode)) {
                alert('Por favor, insira um CEP válido no formato XXXXX-XXX.');
                return;
            }

            button.disabled = true;
            input.disabled = true;

            const infoBlock = document.querySelector('.woo-better-info-block');
            if (infoBlock) {
                infoBlock.style.display = 'none';
            }

            originalButtonText = button.textContent;
            button.textContent = '';
            const loadingIcon = document.createElement('span');
            loadingIcon.classList.add('loading-icon');
            button.appendChild(loadingIcon);

            input.style.backgroundColor = '#f0f0f0';
            input.style.cursor = 'not-allowed';
            button.style.backgroundColor = '#ccc';
            button.style.cursor = 'not-allowed';

            // Sempre faz uma nova consulta, ignora o cache ao clicar no botão
            sendCEP(postcode, true);
        });

        return form;
    }

    function setPosition() {
        // Detecta se é editor de blocos ou shortcode
        const isBlocksCart = WooBetterData.is_blocks_cart || false;
        
        // Inicia o observador de requisições
        if (isBlocksCart) {
            initCartRequestObserver();
        } else {
            // Para modo shortcode
            initShortcodeCartObserver();
        }
        
        if (WooBetterData.position === 'custom') {
            blockPosition = WooBetterData.custom_position || (isBlocksCart ? '.wc-block-cart__main' : 'h2[class*="order"]');
        } else {
            const position = WooBetterData.position || 'top';
            if (isBlocksCart) {
                // Posições para editor de blocos
                if (position === 'middle') {
                    blockPosition = '.wp-block-woocommerce-cart-order-summary-coupon-form-block';
                } else if (position === 'bottom') {
                    blockPosition = '.wc-block-cart__sidebar';
                } else {
                    blockPosition = '.wc-block-cart__main';
                }
            } else {
                // Posições para shortcode (lógica atual)
                if (position === 'middle') {
                    blockPosition = 'div[class*="cart_totals"]';
                } else if (position === 'bottom') {
                    blockPosition = 'div[class*="totals-footer"]';
                } else {
                    blockPosition = 'form[class="woocommerce-cart-form"]';
                }
            }
        }

        return blockPosition
    }

    function initCartRequestObserver() {
        // Intercepta apenas requisições do WooCommerce Blocks para update/remove de itens
        const originalFetch = window.fetch;
        
        window.fetch = function (...args) {
            const [resource, config] = args;

            // Verifica se é a requisição específica do WooCommerce Blocks batch
            if (typeof resource === 'string' && resource.includes('/wp-json/wc/store/v1/batch')) {
                
                // Verifica se há operações de update-item ou remove-item
                const hasCartOperation = checkForCartOperations(config?.body);
                
                if (hasCartOperation) {
                    // Executa a requisição original e aguarda conclusão
                    return originalFetch.apply(this, args)
                        .then(response => {
                            // Aguarda um pouco para o carrinho ser atualizado
                            setTimeout(() => {
                                updateCepComponentAfterCartChange();
                            }, 500);
                            return response;
                        })
                        .catch(error => {
                            return Promise.reject(error);
                        });
                }
            }

            // Para todas as outras requisições, executa normalmente
            return originalFetch.apply(this, args);
        };
    }

    function checkForCartOperations(requestBody) {
        try {
            if (!requestBody) return false;
            
            let bodyData;
            if (typeof requestBody === 'string') {
                bodyData = JSON.parse(requestBody);
            } else {
                bodyData = requestBody;
            }
            
            // Verifica se há requisições com path update-item ou remove-item
            if (bodyData.requests && Array.isArray(bodyData.requests)) {
                return bodyData.requests.some(request => {
                    return request.path && (
                        request.path.includes('update-item') || 
                        request.path.includes('remove-item')
                    );
                });
            }
            
            return false;
        } catch (e) {
            return false;
        }
    }

    function checkForShortcodeCartOperations(method, url, requestBody) {
        try {
            if (!url) return false;
            
            // Verifica se é requisição POST para /cart-old/ com dados do carrinho
            if (method === 'POST' && url.includes('/cart-old/')) {
                if (requestBody) {
                    let bodyStr = '';
                    if (requestBody instanceof FormData) {
                        // Verifica se contém dados de quantidade ou ação de update_cart
                        for (let [key, value] of requestBody.entries()) {
                            if (key.includes('cart[') && key.includes('][qty]')) {
                                return true;
                            }
                            if (key === 'update_cart') {
                                return true;
                            }
                        }
                    } else if (typeof requestBody === 'string') {
                        bodyStr = requestBody;
                    }
                    
                    // Verifica se contém parâmetros de carrinho
                    if (bodyStr.includes('cart[') && bodyStr.includes('[qty]')) {
                        return true;
                    }
                    if (bodyStr.includes('update_cart') || bodyStr.includes('woocommerce-cart-nonce')) {
                        return true;
                    }
                }
            }
            
            // Verifica se é requisição GET para remoção de item
            if (method === 'GET' && url.includes('remove_item=') && url.includes('_wpnonce=')) {
                return true;
            }
            
            return false;
        } catch (e) {
            return false;
        }
    }

    function initShortcodeCartObserver() {
        // Intercepta XMLHttpRequest para modo shortcode
        const originalXHROpen = XMLHttpRequest.prototype.open;
        const originalXHRSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url, ...rest) {
            this._url = url;
            this._method = method;
            return originalXHROpen.call(this, method, url, ...rest);
        };

        XMLHttpRequest.prototype.send = function (...args) {
            const isCartUpdateRequest = checkForShortcodeCartOperations(this._method, this._url, args[0]);
            
            if (isCartUpdateRequest) {
                this.addEventListener('loadend', () => {
                    if (this.status >= 200 && this.status < 400) {
                        // Aguarda um pouco para o carrinho ser atualizado
                        setTimeout(() => {
                            updateCepComponentAfterCartChange();
                        }, 500);
                    }
                });
            }

            return originalXHRSend.apply(this, args);
        };
        
        // Intercepta cliques em links de remoção
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link && link.href && link.href.includes('remove_item=') && link.href.includes('_wpnonce=')) {
                setTimeout(() => {
                    updateCepComponentAfterCartChange();
                }, 1000); // Delay maior para navegação
            }
        });
    }

    function updateCepComponentAfterCartChange() {
        // Invalida o cache
        invalidateCache();
        
        const lastPostcode = getLastUsedPostcode();
        const infoBlock = document.querySelector('.woo-better-info-block');
        const form = document.querySelector('#custom-postcode-form');

        if (lastPostcode && infoBlock && form) {
            infoBlock.style.display = 'none';
                
            // Mostra o formulário com o CEP preenchido
            form.style.display = 'block';
            
            const input = form.querySelector('.woo-better-input-current-style');
            if (input) {
                input.value = lastPostcode;
            }
            
            // Aguarda um pouco mais e força o clique usando diferentes métodos
            setTimeout(() => {
                const button = form.querySelector('.woo-better-button-current-style');
                
                if (button) {
                    // Garante que o botão não está desabilitado
                    button.disabled = false;

                    // Aguarda um pequeno delay adicional para garantir que o DOM está pronto
                    setTimeout(() => {
                        // Tenta múltiplos métodos para garantir que funcione
                        try {
                            // Método 1: Click direto
                            button.click();
                        } catch (e) {
                            try {
                                // Método 2: Dispatch de evento
                                const clickEvent = new MouseEvent('click', {
                                    view: window,
                                    bubbles: true,
                                    cancelable: true
                                });
                                button.dispatchEvent(clickEvent);
                            } catch (e2) {
                                // Método 3: Submit do form diretamente
                                const submitEvent = new Event('submit', {
                                    bubbles: true,
                                    cancelable: true
                                });
                                form.dispatchEvent(submitEvent);
                            }
                        }
                    }, 100);
                }
            }, 500);
        }
    }

    createDynamicStyles();

    validateCacheToken();

    setTimeout(() => {
        if (!containerFound) {
            const targetClass = setPosition();
            const targetElement = document.querySelector(targetClass);
            if (targetElement) {
                const event = new Event('DOMContentLoaded');
                document.dispatchEvent(event);
            }
        }
    }, 1000);

    const observer = new MutationObserver(function (mutationsList, observer) {
        mutationsList.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const targetClass = setPosition();
                const targetElement = document.querySelector(targetClass);
                if (targetElement && !containerFound) {
                    containerFound = true;

                    const parentContainer = createParentContainer();
                    const form = createForm();

                    const lastPostcode = getLastUsedPostcode();
                    let initializeData = {
                        cart: {
                            name: '****',
                            quantity: WooBetterData.quantity || 1,
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
                        postcode: '12345-678',
                    };

                    if (lastPostcode) {
                        const cachedData = getCachedCartShippingData(lastPostcode);
                        if (cachedData) {
                            initializeData = {
                                cart: cachedData.cart,
                                shipping_rates: cachedData.shipping_rates,
                                postcode: lastPostcode,
                            };
                        } else {
                            initializeData.postcode = lastPostcode;
                        }
                    }

                    const cartInfoBlock = createInfoBlock(initializeData.cart, initializeData.shipping_rates, initializeData.postcode, form);

                    parentContainer.appendChild(form);
                    parentContainer.appendChild(cartInfoBlock);

                    targetElement.insertAdjacentElement('afterend', parentContainer);

                    fetchCartNonce(function () {
                        const lastPostcode = getLastUsedPostcode();

                        if (lastPostcode) {
                            const inputPostcode = document.querySelector('.woo-better-input-current-style');
                            if (inputPostcode) {
                                inputPostcode.value = lastPostcode;


                                if (WooBetterData.enable_search && WooBetterData.enable_search === 'yes') {
                                    const cachedData = getCachedCartShippingData(lastPostcode);

                                    if (cachedData) {
                                        const infoBlock = document.querySelector('.woo-better-info-block');
                                        if (infoBlock) {
                                            const hasRealDataInComponent = cachedData.cart && cachedData.cart.name && cachedData.cart.name !== '****';

                                            if (hasRealDataInComponent) {
                                                infoBlock.style.display = 'block';

                                                const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                                                if (toggleButton) {
                                                    toggleButton.innerHTML = '';
                                                    displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                                                }

                                                const contentInfoBlock = infoBlock.querySelector('.woo-better-content-block');
                                                if (contentInfoBlock) {
                                                    contentInfoBlock.classList.add('expanded');
                                                    contentInfoBlock.style.display = 'block';
                                                    contentInfoBlock.style.height = `${contentInfoBlock.scrollHeight}px`;
                                                }
                                            } else {
                                                processShippingRatesFromCache(cachedData, form, infoBlock, lastPostcode);

                                                infoBlock.style.display = 'block';

                                                const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                                                if (toggleButton) {
                                                    toggleButton.innerHTML = '';
                                                    displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                                                }

                                                const contentInfoBlock = infoBlock.querySelector('.woo-better-content-block');
                                                if (contentInfoBlock) {
                                                    contentInfoBlock.classList.add('expanded');
                                                    contentInfoBlock.style.display = 'block';
                                                    contentInfoBlock.style.height = `${contentInfoBlock.scrollHeight}px`;
                                                }
                                            }

                                            const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                                            if (currentPostcodeText) {
                                                currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${lastPostcode}`;
                                            }
                                        }
                                    } else {
                                        form.style.display = 'block';

                                        if (WooBetterData.enable_search === 'yes') {
                                            // Se enable_search estiver habilitado, apenas exibe o formulário
                                            // Não faz consulta automática - aguarda o usuário clicar
                                        }
                                        // Se enable_search = 'no', apenas exibe o formulário para consulta manual
                                    }
                                }
                                // Se enable_search não estiver habilitado, apenas preenche o campo
                            }
                        }
                        observer.disconnect();
                    });

                    observer.disconnect();
                }
            }
        });
    });

    async function sendCEP(postcode, forceRequest = false) {
        if (forceRequest) {
            hasUserMadeQuery = true;
        }

        // Obtém dados atuais do carrinho ANTES da verificação/requisição
        const currentCartData = getCurrentCartData();

        // Se não for uma requisição forçada, verifica cache
        if (!forceRequest) {
            const cachedData = getCachedCartShippingData(postcode);

            if (cachedData) {
                setTimeout(() => {
                    const infoBlock = document.querySelector('.woo-better-info-block');
                    const form = document.querySelector('#custom-postcode-form');
                    processShippingRatesFromCache(cachedData, form, infoBlock, postcode);
                    enablePostcodeForm();
                }, 300);
                return;
            }
        }

        const infoBlock = document.querySelector('.woo-better-info-block');
        const isComponentCurrentlyVisible = infoBlock && infoBlock.style.display === 'block';

        if (infoBlock && !isComponentCurrentlyVisible) {
            infoBlock.style.display = 'none';
        } else if (infoBlock && isComponentCurrentlyVisible) {
            const shippingList = infoBlock.querySelector('.woo-better-shipping-list');
            if (shippingList) {
                shippingList.innerHTML = '<li>Recalculando taxas de envio...</li>';
            }
        }

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
                    postcodeValue = postcode
                    addressData = data.address || '';
                    stateData = data.state_sigla || '';
                    cityData = data.city || '';

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
                            'nonce': cartNonce,
                        },
                        body: formData,
                    })
                        .then(response => response.json())
                        .then(response => {
                            if (response.success && response.data && response.data.digital) {
                                // Produto digital - sucesso com informação especial
                                const infoBlock = document.querySelector('.woo-better-info-block');
                                const form = document.querySelector('#custom-postcode-form');

                                // SALVA NO CACHE PARA PRODUTOS DIGITAIS
                                setCachedCartShippingData(postcodeValue, response.data, currentCartData);
                                setLastUsedPostcode(postcodeValue);

                                if (form) {
                                    form.style.display = 'none';
                                }

                                const cartQuantity = infoBlock.querySelector('.woo-better-cart-quantity');
                                if (cartQuantity) {
                                    const cartTextNode = cartQuantity.childNodes[1];
                                    if (cartTextNode && cartTextNode.nodeType === Node.TEXT_NODE) {
                                        cartTextNode.textContent = ` Quantidade: ${response.data.cart_count}`;
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

                                    infoBlock.style.display = 'block';
                                    const contentBlock = infoBlock.querySelector('.woo-better-content-block');
                                    if (contentBlock) {
                                        contentBlock.classList.add('expanded');
                                        contentBlock.style.display = 'block';
                                    }
                                }

                                enablePostcodeForm();
                            } else if (response.success && response.data) {
                                // Sucesso - produtos físicos ou digitais
                                const infoBlock = document.querySelector('.woo-better-info-block');
                                const form = document.querySelector('#custom-postcode-form');

                                setCachedCartShippingData(postcodeValue, response.data, currentCartData);
                                setLastUsedPostcode(postcodeValue);

                                processShippingRates(response.data, form, infoBlock, postcode, currentCartData)
                                    .then(() => {
                                        enablePostcodeForm();
                                    })
                                    .catch(error => {
                                        enablePostcodeForm();

                                        if (error && error.includes && error.includes('CEP')) {
                                            alert(error);
                                        }
                                    })
                            } else {
                                // Erro ou caso não tratado
                                const message = response.data.message || 'Erro ao processar as taxas de envio.';
                                if (message.toLowerCase().includes('cep')) {
                                    alert(message);
                                }
                                enablePostcodeForm();
                            }
                        })
                        .catch(error => {
                            if (error.message && error.message.toLowerCase().includes('cep')) {
                                alert(error.message);
                            }
                            enablePostcodeForm();
                        });
                } else {
                    enablePostcodeForm();

                    if (data.message && data.message.toLowerCase().includes('cep')) {
                        alert('Houve um erro ao consultar o CEP.');
                    }
                }
            })
            .catch(error => {
                enablePostcodeForm();
                clearTimeout(timeoutId);

                if (error.name === 'AbortError') {

                } else if (error.message && !error.message.toLowerCase().includes('fetch')) {
                    alert('Erro na consulta do CEP. Tente novamente.');
                }
            });
    }

    function processShippingRates(response, form, infoBlock, postcode, cartDataAtRequestTime = null) {
        return new Promise((resolve, reject) => {
            try {
                const shippingRates = response;
                let contentBlock = infoBlock.querySelector('.woo-better-content-block');

                // Remove mensagem de erro anterior, se existir
                if (contentBlock) {
                    const oldError = contentBlock.querySelector('.woo-better-error-message');
                    if (oldError) oldError.remove();
                }

                if (!shippingRates || !Array.isArray(shippingRates.shipping_rates) || shippingRates.shipping_rates.length === 0) {
                    // Esconde todos os componentes filhos, exceto .woo-better-update-section
                    if (contentBlock) {
                        // Remove a classe 'expanded' se estiver presente
                        if (contentBlock.classList.contains('expanded')) {
                            contentBlock.classList.remove('expanded');
                            contentBlock.style.height = '';
                        }
                        Array.from(contentBlock.children).forEach(child => {
                            child.style.display = 'none';
                        });
                        // Atualiza o CEP no bloco de CEP atual
                        const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                        if (currentPostcodeText) {
                            currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;
                        }
                        // Adiciona mensagem de erro
                        let errorMsg = contentBlock.querySelector('.woo-better-error-message');
                        if (!errorMsg) {
                            errorMsg = document.createElement('p');
                            errorMsg.className = 'woo-better-error-message';
                            errorMsg.style.color = '#222';
                            errorMsg.style.fontWeight = '600';
                            errorMsg.style.padding = '12px 0';
                            errorMsg.textContent = 'Nenhum método de frete disponível para o CEP informado.';
                            contentBlock.appendChild(errorMsg);
                        } else {
                            errorMsg.style.display = 'block';
                        }
                        contentBlock.style.display = 'block';
                        contentBlock.classList.add('expanded');
                    }
                    infoBlock.style.display = 'block';
                    form.style.display = 'none';
                    return reject('Nenhuma taxa de envio foi encontrada.');
                }

                // Salva: CEP => {carrinho + frete} usando dados do momento da requisição
                setCachedCartShippingData(postcode, shippingRates, cartDataAtRequestTime);
                setLastUsedPostcode(postcode);

                // Marca que o usuário fez uma consulta manual
                hasUserMadeQuery = true;

                // Restaura display dos componentes filhos (exceto erro)
                if (contentBlock) {
                    const errorMessage = contentBlock.querySelector('.woo-better-error-message');
                    if (errorMessage) {
                        errorMessage.remove();
                    }
                    Array.from(contentBlock.children).forEach(child => {
                        if (child.classList.contains('woo-better-update-section')) {
                            child.style.display = 'flex';
                        } else {
                            child.style.display = 'block';
                        }
                    });
                }

                // Atualiza a UI
                form.style.display = 'none';
                infoBlock.style.display = 'block';

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
                    const cost = parseFloat(rate.cost).toFixed(shippingRates.cart.currency_minor_unit).replace('.', ',');

                    // Decodifica HTML entities do currency symbol
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = shippingRates.cart.currency_symbol;
                    const decodedSymbol = tempDiv.textContent || tempDiv.innerText || shippingRates.cart.currency_symbol;

                    listItem.innerHTML = `<strong>${decodedSymbol} ${cost}</strong> - ${rate.label}`;
                    shippingList.appendChild(listItem);
                });

                // Atualiza o CEP no bloco de CEP atual
                const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;

                // Atualiza a data de atualização
                const updateDate = infoBlock.querySelector('.woo-better-update-date');
                if (updateDate) {
                    const currentDate = new Date().toLocaleString('pt-BR');
                    updateDate.textContent = `Atualizado em ${currentDate}`;

                    // Adiciona a animação de flash para indicar atualização
                    updateDate.classList.remove('flash');
                    // Força um reflow para reiniciar a animação
                    updateDate.offsetWidth;
                    updateDate.classList.add('flash');

                    // Remove a classe após a animação
                    setTimeout(() => {
                        updateDate.classList.remove('flash');
                    }, 2000);
                }

                // Para a animação do ícone de update se estiver ativa
                const updateIcon = infoBlock.querySelector('.woo-better-update-icon');
                const updateIconContainer = infoBlock.querySelector('.woo-better-update-icon-container');
                if (updateIcon && updateIcon.classList.contains('spinning')) {
                    setTimeout(() => {
                        updateIcon.classList.remove('spinning');
                        if (updateIconContainer) {
                            updateIconContainer.classList.remove('spinning-container');
                        }
                    }, 800);
                }

                // Garante que o toggle button esteja com o ícone correto
                const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                if (toggleButton) {
                    toggleButton.innerHTML = '';
                    displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                }

                // Expande o contentBlock com animação se não estiver expandido
                if (contentBlock && !contentBlock.classList.contains('expanded')) {
                    contentBlock.style.height = '';
                    contentBlock.style.display = 'block';

                    // Força um reflow antes da animação
                    contentBlock.offsetHeight;

                    // Aplica a animação
                    contentBlock.classList.add('expanded');
                    contentBlock.style.height = `${contentBlock.scrollHeight}px`;

                    // Remove a altura fixa após a animação
                    contentBlock.addEventListener('transitionend', () => {
                        if (contentBlock.classList.contains('expanded')) {
                            contentBlock.style.height = 'auto';
                        }
                    }, { once: true });
                } else if (contentBlock && contentBlock.classList.contains('expanded')) {
                    // Se já está expandido, apenas atualiza a altura e garante que está visível
                    contentBlock.style.height = 'auto';
                    contentBlock.style.display = 'block';
                }

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

            const cartQuantity = infoBlock.querySelector('.woo-better-cart-quantity');
            if (cartQuantity) {
                const cartTextNode = cartQuantity.childNodes[1];
                if (cartTextNode && cartTextNode.nodeType === Node.TEXT_NODE) {
                    cartTextNode.textContent = ` Quantidade: ${shippingRates.cart.quantity}`;
                }
            }

            // Limpa e popula a lista de métodos de envio
            shippingList.innerHTML = '';
            
            // Verifica se é produto digital do cache
            if (shippingRates.digital === true) {
                // Produto digital - exibe mensagem específica
                shippingList.innerHTML = '<li>Produto digital, não há taxas de envio.</li>';
            } else {
                // Produtos físicos - exibe taxas de envio
                shippingRates.shipping_rates.forEach(rate => {
                    const listItem = document.createElement('li');
                    const cost = parseFloat(rate.cost).toFixed(shippingRates.cart.currency_minor_unit).replace('.', ',');

                    // Decodifica HTML entities do currency symbol
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = shippingRates.cart.currency_symbol;
                    const decodedSymbol = tempDiv.textContent || tempDiv.innerText || shippingRates.cart.currency_symbol;

                    listItem.innerHTML = `<strong>${decodedSymbol} ${cost}</strong> - ${rate.label}`;
                    shippingList.appendChild(listItem);
                });
            }            // Atualiza o CEP no bloco de CEP atual
            const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
            currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;

            // Atualiza a data de atualização
            const updateDate = infoBlock.querySelector('.woo-better-update-date');
            if (updateDate) {
                // Usa a data do cache se disponível, caso contrário usa data atual
                let displayDate;
                if (shippingRates.timestamp) {
                    displayDate = new Date(shippingRates.timestamp).toLocaleString('pt-BR');
                } else {
                    displayDate = new Date().toLocaleString('pt-BR');
                }
                updateDate.textContent = `Atualizado em ${displayDate}`;

                // NÃO adiciona animação de flash no carregamento do cache
                // A animação só deve aparecer quando o usuário clica no botão update
            }

            // Para a animação do ícone de update se estiver ativa
            const updateIcon = infoBlock.querySelector('.woo-better-update-icon');
            const updateIconContainer = infoBlock.querySelector('.woo-better-update-icon-container');
            if (updateIcon && updateIcon.classList.contains('spinning')) {
                setTimeout(() => {
                    updateIcon.classList.remove('spinning');
                    if (updateIconContainer) {
                        updateIconContainer.classList.remove('spinning-container');
                    }
                }, 800);
            }

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
            const cache = getCartCache();
            if (cache[postcode]) {
                delete cache[postcode];
                localStorage.setItem('woo_better_cart_cache', JSON.stringify(cache));
            }
        }
    }

    // Função para invalidar cache e forçar nova consulta
    function invalidateCache() {
        const lastPostcode = getLastUsedPostcode();
        if (lastPostcode) {
            const cache = getCartCache();
            if (cache[lastPostcode]) {
                delete cache[lastPostcode];
                localStorage.setItem('woo_better_cart_cache', JSON.stringify(cache));
            }
        }
    }

    function getCartCache() {
        const cacheKey = 'woo_better_cart_cache';
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            try {
                const parsedData = JSON.parse(cachedData);

                // Verifica se o token é válido
                const tokenValid = isTokenValid();
                
                if (!tokenValid) {
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
                        const age = Date.now() - parsedData[cep].timestamp;
                        if (age > cacheExpirationMs) {
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

    function getCachedCartShippingData(postcode) {
        const cache = getCartCache();
        const currentCartData = getCurrentCartData();
        

        // Verificando cache para CEP
        if (cache[postcode]) {
            const cachedData = cache[postcode];

            // Verifica se a configuração do carrinho é igual
            if (isCartConfigurationEqual(currentCartData, cachedData.cart_data)) {
                return cachedData;
            } else {
                // Remove o cache conflitante antes de fazer nova consulta
                delete cache[postcode];
                localStorage.setItem('woo_better_cart_cache', JSON.stringify(cache));
                
                // Clica automaticamente no botão de consulta quando detecta conflito
                // Apenas se ainda não foi clicado recentemente (evita loops)
                const lastAutoClick = sessionStorage.getItem('woo_better_last_auto_click');
                const now = Date.now();
                const canAutoClick = !lastAutoClick || (now - parseInt(lastAutoClick)) > 5000; // 5 segundos de intervalo
                
                if (canAutoClick) {
                    setTimeout(() => {
                        const button = document.querySelector('.woo-better-button-current-style');
                        if (button && !button.disabled) {
                            sessionStorage.setItem('woo_better_last_auto_click', now.toString());
                            button.click();
                        }
                    }, 100);
                }
                
                return null;
            }
        }

        return null;
    }

    function setCachedCartShippingData(postcode, shippingData, cartDataAtRequestTime = null) {
        const cacheKey = 'woo_better_cart_cache';
        const cache = getCartCache();
        // Usa os dados do carrinho passados como parâmetro ou obtém novos se não fornecidos
        const currentCartData = cartDataAtRequestTime || getCurrentCartData();

        // Verifica se temos dados válidos para salvar
        if (!currentCartData || currentCartData.length === 0) {
            return;
        }

        // Para produtos digitais, aceita mesmo sem shipping_rates
        const isDigitalProduct = shippingData && shippingData.digital === true;
        
        if (!shippingData || (!shippingData.shipping_rates && !isDigitalProduct)) {
            return;
        }

        // Remove dados desnecessários da API antes de salvar
        let cleanData;
        
        if (isDigitalProduct) {
            // Para produtos digitais, salva estrutura diferente
            cleanData = {
                cart: {
                    quantity: shippingData.cart_count || 1,
                    currency_symbol: 'R$', // padrão
                    currency_minor_unit: 2,
                },
                shipping_rates: [], // lista vazia para produtos digitais
                digital: true,
                message: shippingData.message,
                cart_data: currentCartData, // dados do carrinho atual
                timestamp: Date.now()
            };
        } else {
            // Para produtos físicos, mantém estrutura original
            cleanData = {
                cart: shippingData.cart,
                shipping_rates: shippingData.shipping_rates,
                cart_data: currentCartData, // dados do carrinho atual
                timestamp: Date.now()
            };
        }

        // Salva os dados limpos
        cache[postcode] = cleanData;

        try {
            localStorage.setItem(cacheKey, JSON.stringify(cache));
            
            // 🔍 MOSTRA O VALOR COMPLETO DO LOCALSTORAGE
            const savedValue = localStorage.getItem(cacheKey);
            
        } catch (error) {
            // Erro silenciado
        }
    }    // Função para obter dados simples do carrinho atual
    function getCurrentCartData() {
        let cartData = [];

        // Método 1: Tentar usar WooCommerce Blocks store
        if (window.wc && window.wc.wcBlocksData && window.wp && window.wp.data) {
            try {
                const cartStore = window.wp.data.select('wc/store/cart');
                if (cartStore) {
                    const cartItems = cartStore.getCartData ? cartStore.getCartData().items :
                        cartStore.getItems ? cartStore.getItems() : null;

                    if (cartItems && Array.isArray(cartItems) && cartItems.length > 0) {
                        cartData = cartItems.map(item => {
                            let variationId = item.variation_id || item.variation || 0;
                            // Normaliza arrays vazios como 0
                            if (Array.isArray(variationId)) {
                                variationId = variationId.length > 0 ? variationId[0] : 0;
                            }

                            return {
                                id: item.id || item.product_id || item.key,
                                quantity: parseInt(item.quantity) || 1, // Garante que seja um número
                                variation_id: variationId
                            };
                        });
                    }
                }
            } catch (e) {
                // Falha silenciosa no método 1
            }
        }

        // Método 2: Tentar usar window.wc (WooCommerce Blocks - método antigo)
        if (cartData.length === 0 && window.wc && window.wc.wcBlocksData && window.wc.wcBlocksData.cartItems) {
            const wcCartItems = window.wc.wcBlocksData.cartItems;
            
            cartData = wcCartItems.map(item => {
                let variationId = item.variation_id || 0;
                // Normaliza arrays vazios como 0
                if (Array.isArray(variationId)) {
                    variationId = variationId.length > 0 ? variationId[0] : 0;
                }
                return {
                    id: item.id || item.product_id,
                    quantity: parseInt(item.quantity) || 1,
                    variation_id: variationId
                };
            });
        }

        // Método 3: Tentar usar wc_cart_fragments_params
        if (cartData.length === 0 && window.wc_cart_fragments_params) {
            // Tenta extrair informações dos fragmentos do carrinho
            if (window.wc_cart_fragments_params.fragments) {
                const fragments = window.wc_cart_fragments_params.fragments;

                // Procura por fragmentos que contenham informações do carrinho
                Object.keys(fragments).forEach(selector => {
                    const fragmentContent = fragments[selector];
                    if (typeof fragmentContent === 'string') {
                        // Tenta extrair dados do HTML dos fragmentos
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = fragmentContent;

                        const items = tempDiv.querySelectorAll('[data-product-id], .cart-item, .wc-block-cart-items__row');
                        items.forEach(item => {
                            const productId = item.getAttribute('data-product-id') ||
                                item.getAttribute('data-key') ||
                                item.querySelector('[data-product-id]')?.getAttribute('data-product-id');

                            if (productId) {
                                const quantityEl = item.querySelector('.qty, [name*="quantity"], .quantity');
                                const quantity = quantityEl ? parseInt(quantityEl.value || quantityEl.textContent) || 1 : 1;

                                const variationId = item.getAttribute('data-variation-id') || 0;

                                cartData.push({
                                    id: productId,
                                    quantity: quantity,
                                    variation_id: variationId
                                });
                            }
                        });
                    }
                });

                if (cartData.length > 0) {
                    // 🛒 Dados obtidos via wc_cart_fragments_params
                }
            }
        }

        // Método 4: Analisar o DOM para extrair dados do carrinho
        if (cartData.length === 0) {
            const cartSelectors = [
                '.wc-block-cart-items__row',  // Blocks
                '.cart_item',                 // Shortcode clássico
                'tr.cart_item',              // Shortcode tabela
                '[class*="cart-item"]',      // Genérico
                '.woocommerce-cart-form__cart-item' // Outros temas
            ];
            
            let cartItems = [];
            cartSelectors.forEach(selector => {
                const items = document.querySelectorAll(selector);
                if (items.length > 0) {
                    cartItems = items;
                }
            });


            cartItems.forEach((item, index) => {
                
                const productId = item.getAttribute('data-product-id') ||
                    item.getAttribute('data-id') ||
                    item.querySelector('[data-product-id]')?.getAttribute('data-product-id') ||
                    item.querySelector('input[name*="cart"]')?.name.match(/cart\[([^\]]+)\]/)?.[1] ||
                    `product_${index + 1}`;


                // Busca inputs de quantidade mais abrangente
                const quantitySelectors = [
                    '.wc-block-components-quantity-selector__input',
                    'input[name*="quantity"]',
                    '.qty',
                    'input.qty',
                    '.quantity input',
                    'input[type="number"]'
                ];

                let quantityInput = null;
                let quantity = 1;

                quantitySelectors.forEach(selector => {
                    if (!quantityInput) {
                        quantityInput = item.querySelector(selector);
                    }
                });

                if (quantityInput) {
                    quantity = parseInt(quantityInput.value) || 1;
                } else {
                    // Fallback: busca no texto do elemento
                    const quantityText = item.textContent.match(/(?:Qty|Quantidade|Qtd)[:\s]*(\d+)/i);
                    if (quantityText) {
                        quantity = parseInt(quantityText[1]) || 1;
                    } else {
                    }
                }

                const variationId = item.getAttribute('data-variation-id') ||
                    item.querySelector('[data-variation-id]')?.getAttribute('data-variation-id') ||
                    item.querySelector('input[name*="variation"]')?.value || 0;


                if (productId) {
                    let normalizedVariationId = variationId;
                    // Normaliza arrays vazios como 0
                    if (Array.isArray(normalizedVariationId)) {
                        normalizedVariationId = normalizedVariationId.length > 0 ? normalizedVariationId[0] : 0;
                    }

                    const cartItem = {
                        id: productId,
                        quantity: quantity,
                        variation_id: parseInt(normalizedVariationId) || 0
                    };

                    cartData.push(cartItem);
                }
            });

        }

        // Se ainda não conseguiu dados, usa fallback
        if (cartData.length === 0) {
            
            // Método 5: Tentar extrair do contador de carrinho
            const cartCountElements = document.querySelectorAll('.cart-contents-count, .wc-block-mini-cart__badge, [class*="cart-count"], .cart-contents');
            let totalItems = 0;

            cartCountElements.forEach(element => {
                const count = parseInt(element.textContent) || 0;
                if (count > totalItems) totalItems = count;
            });


            if (totalItems > 0) {
                // Cria entrada baseada no total
                cartData.push({
                    id: 'dom_fallback',
                    quantity: totalItems,
                    variation_id: 0
                });
            } else if (WooBetterData.quantity) {
                // Usa dados do WooBetterData como último recurso
                const quantity = parseInt(WooBetterData.quantity) || 1;
                cartData.push({
                    id: 'unknown',
                    quantity: quantity,
                    variation_id: 0
                });
            } else {
            }
        }

        // Log final dos dados obtidos
        
        // Calcula e loga o total de itens
        const totalQuantity = cartData.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);

        // Ordena os dados para garantir consistência
        cartData.sort((a, b) => {
            if (a.id !== b.id) return a.id.toString().localeCompare(b.id.toString());
            if (a.variation_id !== b.variation_id) return a.variation_id - b.variation_id;
            return a.quantity - b.quantity;
        });

        return cartData;
    }

    // Função para comparar se duas configurações de carrinho são iguais
    function isCartConfigurationEqual(cartData1, cartData2) {

        if (!cartData1 || !cartData2) {
            return false;
        }

        if (cartData1.length !== cartData2.length) {
            return false;
        }

        // Calcula totais para comparação mais robusta
        const total1 = cartData1.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        const total2 = cartData2.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
        

        // Se os totais são diferentes, carrinhos são diferentes
        if (total1 !== total2) {
            return false;
        }

        // Se ambos têm apenas 1 item e mesma quantidade total, considera igual
        // Isso resolve o problema de 'unknown' vs ID real no shortcode
        if (cartData1.length === 1 && cartData2.length === 1) {
            const item1 = cartData1[0];
            const item2 = cartData2[0];
            
            const qty1 = parseInt(item1.quantity) || 0;
            const qty2 = parseInt(item2.quantity) || 0;
            
            // Normaliza variation_id para comparação
            const normalizeVariationId = (variationId) => {
                if (Array.isArray(variationId)) {
                    return variationId.length > 0 ? variationId[0] : 0;
                }
                return parseInt(variationId) || 0;
            };

            const variation1 = normalizeVariationId(item1.variation_id);
            const variation2 = normalizeVariationId(item2.variation_id);
            
            
            // Para carrinho único, compara apenas quantidade e variação
            // Ignora ID porque pode ser 'unknown' no shortcode vs número real nos blocos
            const singleItemEqual = (qty1 === qty2 && variation1 === variation2);
            return singleItemEqual;
        }

        // Para múltiplos itens, faz comparação mais detalhada
        for (let i = 0; i < cartData1.length; i++) {
            const item1 = cartData1[i];
            const item2 = cartData2[i];

            const qty1 = parseInt(item1.quantity) || 0;
            const qty2 = parseInt(item2.quantity) || 0;

            // Normaliza variation_id para comparação
            const normalizeVariationId = (variationId) => {
                if (Array.isArray(variationId)) {
                    return variationId.length > 0 ? variationId[0] : 0;
                }
                return parseInt(variationId) || 0;
            };

            const variation1 = normalizeVariationId(item1.variation_id);
            const variation2 = normalizeVariationId(item2.variation_id);


            // Usa == para comparar string vs number nos IDs
            if (item1.id != item2.id || qty1 !== qty2 || variation1 !== variation2) {
                return false;
            }
        }

        return true;
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
        
        const tokenValid = isTokenValid();
        
        if (!tokenValid) {
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
            const cache = getCartCache();
            const cepKeys = Object.keys(cache);
            const result = cepKeys.length > 0 ? cepKeys[0] : null;
            return result;
        }

        // Se expira, precisa verificar timestamp - por agora retorna o primeiro CEP válido
        const cache = getCartCache();
        const cacheExpirationMs = cacheTimeMinutes * 60 * 1000;

        for (const cep of Object.keys(cache)) {
            const age = Date.now() - cache[cep].timestamp;
            if (age < cacheExpirationMs) {
                return cep;
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
        localStorage.removeItem('woo_better_cart_cache');
        localStorage.removeItem('woo_better_product_cache');
        localStorage.removeItem('woo_better_token_cache_data');
        // Remove também caches antigos para limpeza
        localStorage.removeItem('woo_better_token_cache');
        localStorage.removeItem('woo_better_cart_postcode_cache_simple');
        localStorage.removeItem('woo_better_last_postcode');
        localStorage.removeItem('woo_better_postcode_cache');
    }

    // Função para limpar cache que não bate mais com o carrinho atual  
    function invalidateCache() {
        const cacheKey = 'woo_better_cart_cache';
        const cache = getCartCache();
        const currentCartData = getCurrentCartData();

        // Se não conseguimos obter dados atuais do carrinho, não invalidamos nada
        if (!currentCartData || currentCartData.length === 0) {
            return;
        }

        // Para cada CEP no cache, verifica se ainda bate com o carrinho atual
        Object.keys(cache).forEach(postcode => {
            const cachedData = cache[postcode];

            if (!isCartConfigurationEqual(currentCartData, cachedData.cart_data)) {
                delete cache[postcode];
            }
        });

        // Só salva se ainda temos dados no cache
        if (Object.keys(cache).length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify(cache));
        }
    }

    // Função para validar e limpar cache baseado no token
    function validateCacheToken() {
        if (!isTokenValid()) {
            clearAllCaches();
            updateTokenCache();
        }
    }

    // Observa o corpo do documento
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
});