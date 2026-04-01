document.addEventListener('DOMContentLoaded', function () {

    const WooBetterData = window.WooBetterData || {};

    // --- Lógica para sincronizar CEP do carrinho com cache personalizado ---
    const cartCep = WooBetterData.cart_cep || '';
    const lastPostcode = getLastUsedPostcode();
    
    // Normaliza ambos os CEPs para comparação
    const normalizedCartCep = formatCEP(cartCep);
    const normalizedLastPostcode = formatCEP(lastPostcode);
    
    if (normalizedCartCep && normalizedCartCep !== normalizedLastPostcode) {
        // Reseta cache e faz nova consulta usando o CEP do carrinho
        invalidateCache();
        setLastUsedPostcode(normalizedCartCep);
        sendCEP(normalizedCartCep, true);
    }

    // Configura listener para mudanças em produtos variáveis
    setupVariationChangeListener();

    let font_class = WooBetterData.inputStyles.fontClass || '';
    let containerFound = false;
    let blockPosition = 'h1[class*="title"]'
    let postcodeValue = '';
    let poscodeCache = '';
    let originalButtonText = '';
    let productNonce = '';
    let hasUserMadeQuery = false;

    // Função para formatar CEP (XXXXX-XXX)
    function formatCEP(cep) {
        if (!cep) return '';
        
        // Remove tudo que não for dígito
        let cleanCep = cep.replace(/\D/g, '');
        
        // Limita a 8 dígitos
        if (cleanCep.length > 8) {
            cleanCep = cleanCep.slice(0, 8);
        }
        
        // Aplica a formatação se tiver 8 dígitos ou mais de 5
        if (cleanCep.length === 8) {
            return cleanCep.slice(0, 5) + '-' + cleanCep.slice(5);
        } else if (cleanCep.length > 5) {
            return cleanCep.slice(0, 5) + '-' + cleanCep.slice(5);
        }
        
        return cleanCep;
    }

    // Função para aplicar formatação em um input de CEP
    function applyFormatToInput(input, value) {
        if (!input) return;
        
        const formattedValue = formatCEP(value);
        input.value = formattedValue;
        
        // Dispara o evento input para garantir consistência
        const inputEvent = new Event('input', {
            bubbles: true,
            cancelable: true
        });
        input.dispatchEvent(inputEvent);
    }

    function createParentContainer() {
        const parentContainer = document.createElement('div');
        parentContainer.classList.add('woo-better-parent-container');
        return parentContainer;
    }

    function invalidateCache() {
        // Função de reset do cache customizado
        try {
            localStorage.removeItem('woo_better_calc_custom_cache');
        } catch (e) {
            // Ignora erro de localStorage
        }
    }

    function getCurrentVariationId() {
        const variationForm = document.querySelector('.variations_form');
        if (variationForm) {
            const variationInput = variationForm.querySelector('input[name="variation_id"]');
            if (variationInput) {
                if (variationInput.value) {
                    return variationInput.value;
                }
            }
        }
        return 0;
    }

    function isVariableProduct() {
        const isVariable = document.querySelector('.variations_form') !== null;
        return isVariable;
    }

    function getCurrentProductQuantity() {
        // Procura pelo campo de quantidade (pode ser number ou hidden)
        const quantityInput = document.querySelector('input[name="quantity"].qty, input[name="quantity"].input-text, input[name="quantity"][class*="qty"]');
        
        if (quantityInput && quantityInput.value) {
            const quantity = parseInt(quantityInput.value, 10);
            // Verifica se é um número válido e maior que 0
            if (!isNaN(quantity) && quantity > 0) {
                return quantity;
            }
        }
        
        // Retorna 1 como padrão se não encontrar ou valor inválido
        return 1;
    }

    function hasVariationSelected() {
        const variationId = getCurrentVariationId();
        const hasSelected = variationId > 0;
        return hasSelected;
    }

    function setFormDisabled(disabled = true) {
        const button = document.querySelector('.woo-better-button-current-style');
        const input = document.querySelector('.woo-better-input-current-style');
        
        if (!button || !input) {
            return;
        }

        button.disabled = disabled;
        input.disabled = disabled;
        
        if (disabled) {
            // Aplica estilos de desabilitado
            input.style.backgroundColor = '#f5f5f5';
            input.style.color = '#999';
            input.style.cursor = 'not-allowed';
            
            button.style.backgroundColor = '#ccc';
            button.style.color = '#666';
            button.style.cursor = 'not-allowed';
        } else {
            // Restaura estilos normais
            input.style.backgroundColor = WooBetterData.inputStyles.backgroundColor || '#fff';
            input.style.color = WooBetterData.inputStyles.color || '#333';
            input.style.cursor = '';
            
            button.style.backgroundColor = WooBetterData.buttonStyles.backgroundColor || '#0073aa';
            button.style.color = WooBetterData.buttonStyles.color || '#fff';
            button.style.cursor = '';
        }
    }

    function setupVariationChangeListener() {
        const variationForm = document.querySelector('.variations_form');
        if (variationForm) {
            // Escuta mudanças na seleção de variação
            variationForm.addEventListener('found_variation', function(event) {
                // Habilita o formulário agora que uma variação foi selecionada
                setFormDisabled(false);
                
                // Limpa o cache quando uma nova variação é selecionada
                invalidateCache();
                
                // Se já existe um resultado de frete exibido, remove para forçar nova consulta
                const infoBlock = document.querySelector('.woo-better-info-block');
                if (infoBlock) {
                    infoBlock.style.display = 'none';
                }
                
                // Reexibe o formulário de CEP se estava oculto
                const form = document.querySelector('#custom-postcode-form');
                if (form && form.style.display === 'none') {
                    form.style.display = 'block';
                }
                
                // Se tem consulta automática habilitada e já tem CEP salvo, faz nova consulta
                const lastPostcode = getLastUsedPostcode();
                if (WooBetterData.enable_search === 'yes' && lastPostcode) {
                    setTimeout(() => {
                        const submitButton = document.querySelector('.woo-better-button-current-style');
                        if (submitButton && !submitButton.disabled) {
                            submitButton.click();
                        }
                    }, 300);
                }
            });
            
            // Também escuta quando a variação é resetada
            variationForm.addEventListener('reset_data', function(event) {
                // Desabilita o formulário quando variação é resetada
                setFormDisabled(true);
                
                invalidateCache();
                
                const infoBlock = document.querySelector('.woo-better-info-block');
                if (infoBlock) {
                    infoBlock.style.display = 'none';
                }
                
                const form = document.querySelector('#custom-postcode-form');
                if (form && form.style.display === 'none') {
                    form.style.display = 'block';
                }
            });
            
            // Adiciona um observer para mudanças diretas no input variation_id
            const variationInput = variationForm.querySelector('input[name="variation_id"]');
            if (variationInput) {
                // Usando MutationObserver para detectar mudanças de atributo value
                const observer = new MutationObserver(function(mutations) {
                    mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'value') {
                            checkAndUpdateFormState();
                        }
                    });
                });
                
                observer.observe(variationInput, {
                    attributes: true,
                    attributeFilter: ['value']
                });
                
                // Também escuta evento de input
                variationInput.addEventListener('input', function() {
                    checkAndUpdateFormState();
                });
                
                // E evento change
                variationInput.addEventListener('change', function() {
                    checkAndUpdateFormState();
                });
                
                // Verifica periodicamente se o valor mudou (fallback)
                setInterval(function() {
                    const currentValue = variationInput.value;
                    if (currentValue !== variationInput.dataset.lastValue) {
                        variationInput.dataset.lastValue = currentValue;
                        checkAndUpdateFormState();
                    }
                }, 1000);
                
                // Inicializa o valor de referência
                variationInput.dataset.lastValue = variationInput.value;
            }
        }
    }
    
    function checkAndUpdateFormState() {
        if (isVariableProduct()) {
            const currentVariationId = getCurrentVariationId();
            
            // Verifica se a variação mudou (incluindo mudanças entre variações válidas)
            const lastVariationId = window.lastVariationId || null;
            const hasVariationChanged = lastVariationId !== null && lastVariationId !== currentVariationId;
            
            // Atualiza a variação atual para próxima comparação
            window.lastVariationId = currentVariationId;
            
            if (hasVariationSelected()) {
                setFormDisabled(false);
                
                // Se a variação mudou de uma para outra, limpa os resultados antigos
                if (hasVariationChanged && currentVariationId > 0) {
                    
                    // Esconde o bloco de resultados
                    const infoBlock = document.querySelector('.woo-better-info-block');
                    if (infoBlock) {
                        infoBlock.style.display = 'none';
                    }
                    
                    // Mostra o formulário de CEP novamente
                    const form = document.querySelector('#custom-postcode-form');
                    if (form) {
                        form.style.display = 'block';
                    }
                    
                    // Limpa o cache para forçar nova consulta
                    invalidateCache();
                }
                
                // Verifica se deve fazer consulta automática quando variação é selecionada
                if (WooBetterData.enable_search === 'yes' && lastVariationId !== currentVariationId) {
                    const inputPostcode = document.querySelector('.woo-better-input-current-style');
                    if (inputPostcode && inputPostcode.value && inputPostcode.value.trim().length >= 9) {
                        const postcode = inputPostcode.value.trim();
                        
                        // Primeiro verifica se há cache para esta variação específica
                        const cachedData = getCachedShippingData(postcode, WooBetterData.product_id);
                        if (cachedData) {
                            const infoBlock = document.querySelector('.woo-better-info-block');
                            const form = document.querySelector('#custom-postcode-form');
                            processShippingRatesFromCache(cachedData, form, infoBlock, postcode);
                        } else {
                            // Pequeno delay para garantir que a UI está atualizada e simula clique no botão
                            setTimeout(() => {
                                const submitButton = document.querySelector('.woo-better-button-current-style');
                                if (submitButton && !submitButton.disabled) {
                                    submitButton.click();
                                }
                            }, 300);
                        }
                    }
                }
            } else {
                setFormDisabled(true);
                
                // Esconde o bloco de resultados quando não há variação selecionada
                const infoBlock = document.querySelector('.woo-better-info-block');
                if (infoBlock) {
                    infoBlock.style.display = 'none';
                }
                
                // Mostra o formulário de CEP novamente
                const form = document.querySelector('#custom-postcode-form');
                if (form && form.style.display === 'none') {
                    form.style.display = 'block';
                }
            }
        } else {
            setFormDisabled(false);
        }
    }

    function fetchProductNonce(callback) {
        const formData = new FormData();
        formData.append('action', 'wc_better_calc_get_nonce');
        formData.append('action_nonce', 'woo_better_register_product_address');

        // Adiciona timestamp também na URL
        const ajaxUrlWithBuster = WooBetterData.ajaxurl + '?t=' + Date.now();
        
        fetch(ajaxUrlWithBuster, {
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
                callback();
            });
    }

    function enablePostcodeForm() {
        const button = document.querySelector('.woo-better-button-current-style');
        const input = document.querySelector('.woo-better-input-current-style');

        if (button) {
            button.disabled = false;
            // Garante que o texto original seja sempre restaurado
            button.innerHTML = ''; // Limpa qualquer elemento filho (loading icon)
            button.textContent = originalButtonText || 'CONSULTAR';
        }
        
        if (input) {
            input.disabled = false;
        }

        const cepBlock = document.querySelector('.woo-better-current-postcode-block');
        if (cepBlock) {
            cepBlock.style.display = 'flex';
        }

        input.style.backgroundColor = WooBetterData.inputStyles.backgroundColor || '#fff';
        input.style.cursor = '';
        button.style.backgroundColor = WooBetterData.buttonStyles.backgroundColor || '#0073aa';
        button.style.cursor = '';

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
                
                // Reseta o estado do contentBlock para garantir expansão correta na próxima consulta
                const contentBlock = infoBlock.querySelector('.woo-better-content-block');
                if (contentBlock) {
                    contentBlock.classList.remove('expanded');
                    contentBlock.style.height = '';
                    contentBlock.style.display = 'none';
                }
                
                // Reseta o toggle button para o estado padrão (expandido)
                const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                if (toggleButton) {
                    toggleButton.innerHTML = '';
                    displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                }
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
                flex-shrink: 0 !important;
                width: 44px !important;
                height: 44px !important;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                border-radius: 50% !important;
                border: none !important;
                background: transparent !important;
                padding: 0 !important;
                transition: background-color 0.3s ease !important;
                outline: none !important;
            }

            .woo-better-update-icon-container:focus {
                outline: none !important;
                box-shadow: none !important;
            }

            .woo-better-update-icon-container:hover {
                background-color: ${themeColor}1a !important;
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
                margin: 0 0 4px 0 !important;
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

    function createInfoBlock(productInfo, shippingRates, postcode, form) {
        const infoBlock = document.createElement('div');
        infoBlock.classList.add('woo-better-info-block');
        infoBlock.classList.add(font_class);

        const lastPostcode = getLastUsedPostcode();

        // Verifica se os dados passados são dados reais (não placeholder)
        const hasRealData = productInfo && productInfo.name && productInfo.name !== '*******';

        // Sempre inicializa o componente escondido
        // O componente só será exibido após uma consulta (automática ou manual)
        infoBlock.style.display = 'none';

        // Conteúdo do bloco
        const contentBlock = document.createElement('div');
        contentBlock.classList.add('woo-better-content-block');

        // Sempre inicializa o contentBlock escondido
        // O conteúdo só será exibido após uma consulta
        contentBlock.style.display = 'none';

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
        if (font_class) {
            productName.classList.add(font_class);
        }

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
        if (font_class) {
            productQuantity.classList.add(font_class);
        }

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

        // Verifica se é produto digital antes de popular a lista
        if (productInfo.digital === true || (Array.isArray(shippingRates) && shippingRates.length === 0 && productInfo.digital)) {
            // Para produtos digitais, mostra mensagem específica
            const digitalItem = document.createElement('li');
            if (font_class) {
                digitalItem.classList.add(font_class);
            }
            digitalItem.textContent = 'Produto digital, não há taxas de envio.';
            shippingList.appendChild(digitalItem);
        } else {
            // Para produtos físicos, mostra lista normal de taxas
            shippingRates.forEach(rate => {
                const listItem = document.createElement('li');
                if (font_class) {
                    listItem.classList.add(font_class);
                }

                // Decodifica HTML entities do currency symbol
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = productInfo.currency_symbol;
                const decodedSymbol = tempDiv.textContent || tempDiv.innerText || productInfo.currency_symbol;

                listItem.innerHTML = `<strong>${decodedSymbol} ${parseFloat(rate.cost).toFixed(productInfo.currency_minor_unit).replace('.', ',')}</strong> - ${rate.label}`;
                shippingList.appendChild(listItem);
            });
        }

        shippingMethods.appendChild(shippingList);

        // Separador visual
        const separator = document.createElement('hr');
        separator.classList.add('woo-better-separator');

        // Seção de informações de atualização
        const updateSection = document.createElement('div');
        updateSection.classList.add('woo-better-update-section');

        // Container para o ícone
        const iconContainer = document.createElement('button');
        iconContainer.type = 'button';
        iconContainer.classList.add('woo-better-update-icon-container');
        iconContainer.title = 'Clique para atualizar os dados de frete';

        const updateIcon = document.createElement('img');
        updateIcon.src = WooBetterData.update_icon.updates;
        updateIcon.alt = 'Atualizado';
        updateIcon.classList.add('woo-better-update-icon');
        updateIcon.classList.add(WooBetterData.iconColor || 'black-icon');

        // Adiciona funcionalidade de clique para atualizar dados
        iconContainer.addEventListener('click', function () {
            // Impede cliques múltiplos enquanto está atualizando
            if (updateIcon.classList.contains('spinning')) {
                return;
            }

            const currentPostcode = getLastUsedPostcode();
            if (currentPostcode) {
                // Marca que o usuário fez uma consulta manual
                hasUserMadeQuery = true;

                // Adiciona classes de animação
                updateIcon.classList.add('spinning');
                iconContainer.classList.add('spinning-container');

                // Chama sendCEP com forceRequest = true
                sendCEP(formatCEP(currentPostcode), true);
            }
        });

        iconContainer.appendChild(updateIcon);

        // Container para os textos
        const textContainer = document.createElement('div');
        textContainer.classList.add('woo-better-update-text-container');

        // Data de atualização (será atualizada dinamicamente)
        const updateDate = document.createElement('p');
        updateDate.classList.add('woo-better-update-date');

        // Se tem dados reais (do cache), usa a data do cache
        let displayDate;
        if (hasRealData && productInfo.updated_at) {
            displayDate = new Date(productInfo.updated_at).toLocaleString('pt-BR');
        } else {
            displayDate = new Date().toLocaleString('pt-BR');
        }
        updateDate.textContent = `Atualizado em ${displayDate}`;

        // Texto informativo
        const infoText = document.createElement('p');
        infoText.classList.add('woo-better-info-text');
        infoText.textContent = 'Valor de frete estimado para este item. No carrinho, será exibido o frete total da compra.';

        textContainer.appendChild(updateDate);
        textContainer.appendChild(infoText);

        updateSection.appendChild(iconContainer);
        updateSection.appendChild(textContainer);

        contentBlock.appendChild(productName);
        contentBlock.appendChild(productQuantity);
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
        if (font_class) {
            input.classList.add(font_class);
        }
        input.autocomplete = 'postal-code';

        if (lastPostcode) {
            applyFormatToInput(input, lastPostcode);
        }

        // Aplica os estilos do input
        const inputStyles = WooBetterData.inputStyles || {};
        Object.keys(inputStyles).forEach(styleProperty => {
            input.style[styleProperty] = inputStyles[styleProperty];
        });

        input.addEventListener('input', function (e) {
            const formattedValue = formatCEP(e.target.value);
            
            // Só atualiza se o valor mudou para evitar loop infinito
            if (e.target.value !== formattedValue) {
                e.target.value = formattedValue;
            }
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
        
        // Inicializa o texto original do botão
        originalButtonText = button.textContent;
        if (font_class) {
            button.classList.add(font_class);
        }

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
        if (font_class) {
            linkText.classList.add(font_class);
        }
        linkText.target = '_blank';

        // Adiciona o texto ao container
        containerDiv.appendChild(linkText);

        // Adiciona os elementos ao formulário
        form.appendChild(containerDiv);
        
        // Se é produto variável, verifica se deve desabilitar inicialmente
        if (isVariableProduct() && !hasVariationSelected()) {
            // Usa setTimeout para garantir que o formulário esteja completamente renderizado
            setTimeout(() => {
                setFormDisabled(true);
            }, 100);
        }

        // Adiciona o evento de envio ao formulário
        form.addEventListener('submit', function (e) {
            e.preventDefault(); // Impede o envio padrão do formulário

            // Se é produto variável e não tem variação selecionada, não permite envio
            if (isVariableProduct() && !hasVariationSelected()) {
                return; // Simplesmente não faz nada, sem alert
            }

            let postcode = input.value.trim();
            
            // Aplica formatação antes da validação
            postcode = formatCEP(postcode);
            applyFormatToInput(input, postcode);

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

            // Só esconde o bloco se não há nenhum cache para este CEP E o bloco não está visível
            const isBlockVisible = infoBlock && (infoBlock.style.display === 'block' || getComputedStyle(infoBlock).display === 'block');
            if (infoBlock && !hasAnyCacheForCep && !isBlockVisible) {
                infoBlock.style.display = 'none';
            }

            // Salva o texto original do botão (se ainda não foi salvo)
            if (!originalButtonText) {
                originalButtonText = button.textContent || 'CONSULTAR';
            }

            // Substitui o texto do botão por um ícone de carregamento
            button.innerHTML = ''; // Limpa completamente o conteúdo
            const loadingIcon = document.createElement('span');
            loadingIcon.classList.add('loading-icon'); // Usa a classe definida no CSS
            button.appendChild(loadingIcon);

            // Adiciona estilos de desabilitado ao input e botão
            input.style.backgroundColor = '#f0f0f0';
            input.style.cursor = 'not-allowed';
            button.style.backgroundColor = '#ccc';
            button.style.cursor = 'not-allowed';

            // Faz a requisição via fetch
            sendCEP(postcode, true);
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

                    // Verifica se há dados em cache para usar como inicialização
                    const lastPostcode = getLastUsedPostcode();
                    let initializeData = {
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

                    // Se há CEP salvo, tenta carregar dados do cache
                    if (lastPostcode) {
                        const cachedData = getCachedShippingData(lastPostcode, WooBetterData.product_id);
                        if (cachedData) {
                            initializeData = {
                                product: cachedData.product,
                                shipping_rates: cachedData.shipping_rates || [],
                                postcode: lastPostcode,
                            };
                            
                            // Se é produto digital, adiciona a flag para o createInfoBlock
                            if (cachedData.digital === true) {
                                initializeData.product.digital = true;
                                initializeData.shipping_rates = []; // Garante array vazio para produtos digitais
                            }
                        } else {
                            initializeData.postcode = lastPostcode;
                        }
                    }

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
                                
                                // Para produtos variáveis, sempre exibe o formulário inicialmente
                                if (isVariableProduct()) {
                                    form.style.display = 'block';
                                    
                                    // Se não tem variação selecionada, desabilita o formulário
                                    if (!hasVariationSelected()) {
                                        setFormDisabled(true);
                                    } else {
                                        setFormDisabled(false);
                                        
                                        // Se tem variação selecionada E há cache, pode fazer consulta automática
                                        if (WooBetterData.enable_search === 'yes') {
                                            const cachedData = getCachedShippingData(lastPostcode, WooBetterData.product_id);
                                            if (cachedData) {
                                                const infoBlock = document.querySelector('.woo-better-info-block');
                                                processShippingRatesFromCache(cachedData, form, infoBlock, lastPostcode);
                                            } else {
                                                setTimeout(() => {
                                                    const submitButton = document.querySelector('.woo-better-button-current-style');
                                                    if (submitButton && !submitButton.disabled) {
                                                        submitButton.click();
                                                    }
                                                }, 100);
                                            }
                                        }
                                    }
                                    return; // Para aqui para produtos variáveis
                                }

                                // Lógica original para produtos simples/digitais
                                if (WooBetterData.enable_search && WooBetterData.enable_search === 'yes') {
                                    // Verifica se existe cache para este CEP e produto específico
                                    const cachedData = getCachedShippingData(lastPostcode, WooBetterData.product_id);

                                    if (cachedData) {
                                        // Se há cache, usa os dados do cache diretamente sem nova consulta
                                        const infoBlock = document.querySelector('.woo-better-info-block');
                                        processShippingRatesFromCache(cachedData, form, infoBlock, lastPostcode);
                                    } else {
                                        // Não há cache para este produto específico com o CEP atual
                                        // Inconsistência detectada: exibe o formulário imediatamente
                                        form.style.display = 'block';

                                        if (WooBetterData.enable_search === 'yes') {
                                            // Se enable_search estiver habilitado, faz consulta automática
                                            setTimeout(() => {
                                                const submitButton = form.querySelector('.woo-better-button-current-style');
                                                if (submitButton && !submitButton.disabled) {
                                                    submitButton.click();
                                                }
                                            }, 100);
                                        }
                                        // Se enable_search = 'no', apenas exibe o formulário para consulta manual
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

    async function sendCEP(postcode, forceRequest = false) {
        // Garante que o postcode sempre esteja formatado
        postcode = formatCEP(postcode);
        
        // Se forceRequest for true, marca que o usuário fez uma ação manual
        if (forceRequest) {
            hasUserMadeQuery = true;
        }

        // Se forceRequest for true, ignora completamente o cache
        if (!forceRequest) {
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
        }

        // Continua com a consulta normal via API
        // O componente só será exibido após a consulta terminar com sucesso

        // Continua com a consulta normal via API
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        let apiUrl;
        const timestamp = Date.now(); // Cache Buster
        if (typeof wpApiSettings !== 'undefined' && wpApiSettings.root) {
            apiUrl = wpApiSettings.root + `lknwcbettershipping/v1/cep/?postcode=${postcode}&t=${timestamp}`;
        } else {
            if (typeof WooBetterData !== 'undefined' && WooBetterData.wooUrl !== '') {
                apiUrl = WooBetterData.wooUrl + `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcode}&t=${timestamp}`;
            } else {
                apiUrl = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcode}&t=${timestamp}`;
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

                    // Detecta variation_id se o produto for variável
                    let variationId = 0;
                    const variationForm = document.querySelector('.variations_form');
                    if (variationForm) {
                        const variationInput = variationForm.querySelector('input[name="variation_id"]');
                        if (variationInput && variationInput.value) {
                            variationId = variationInput.value;
                        }
                    }

                    // Captura a quantidade atual do produto
                    const currentQuantity = getCurrentProductQuantity();
                    
                    const formData = new FormData();
                    formData.append('action', 'register_product_address');
                    formData.append('product_id', WooBetterData.product_id);
                    formData.append('quantity', currentQuantity);
                    if (variationId > 0) {
                        formData.append('variation_id', variationId);
                    }
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
                                        enablePostcodeForm();
                                    })
                                    .catch(error => {
                                        enablePostcodeForm();

                                        // Só mostra alert para erros de CEP inválido
                                        if (error && error.includes && error.includes('CEP')) {
                                            alert(error);
                                        }
                                    })
                            } else {
                                // Remove o tratamento duplicado de produtos digitais, deixa o processShippingRates() lidar com tudo
                                const infoBlock = document.querySelector('.woo-better-info-block');
                                const form = document.querySelector('#custom-postcode-form');

                                processShippingRates(response.data, form, infoBlock, postcode)
                                    .then(() => {
                                        enablePostcodeForm();
                                    })
                                    .catch(error => {
                                        enablePostcodeForm();
                                        
                                        // Só mostra alert para erros relacionados ao CEP
                                        const message = response.data.message || 'Erro ao processar as taxas de envio.';
                                        if (message.toLowerCase().includes('cep')) {
                                            alert(message);
                                        }
                                    })
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

                // Verifica se é produto digital primeiro
                if (shippingRates.digital === true) {
                    // Cria estrutura de dados para produto digital similar ao formato padrão
                    const digitalProductData = {
                        product: {
                            name: shippingRates.product_name,
                            quantity: WooBetterData.quantity || 1,
                            currency_symbol: 'R$',
                            currency_minor_unit: 2,
                            updated_at: new Date().toISOString()
                        },
                        shipping_rates: [], // Array vazio para produtos digitais
                        digital: true,
                        message: shippingRates.message || 'Produto digital, não há taxas de envio.'
                    };

                    // Salva no cache para evitar consultas futuras
                    setCachedShippingData(postcode, WooBetterData.product_id, digitalProductData);
                    
                    // Atualiza o último CEP usado
                    setLastUsedPostcode(postcode);

                    // Tratamento para produtos digitais
                    const contentBlock = infoBlock.querySelector('.woo-better-content-block');
                    
                    const productName = infoBlock.querySelector('.woo-better-product-name');
                    if (productName) {
                        const productTextNode = productName.childNodes[1];
                        if (productTextNode && productTextNode.nodeType === Node.TEXT_NODE) {
                            productTextNode.textContent = ` Produto: ${shippingRates.product_name}`;
                        }
                    }

                    const shippingList = contentBlock.querySelector('.woo-better-shipping-list');
                    if (shippingList) {
                        shippingList.innerHTML = '<li>Produto digital, não há taxas de envio.</li>';
                    }

                    // Atualiza o CEP no bloco de CEP atual
                    const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                    if (currentPostcodeText) {
                        currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;
                    }

                    // Atualiza a data de atualização para produtos digitais
                    const updateDate = infoBlock.querySelector('.woo-better-update-date');
                    if (updateDate) {
                        const updateTime = new Date().toLocaleString('pt-BR');
                        updateDate.textContent = `Atualizado em ${updateTime}`;
                        
                        // Adiciona a animação de flash para indicar atualização
                        updateDate.classList.remove('flash');
                        updateDate.offsetWidth; // Força reflow
                        updateDate.classList.add('flash');
                        
                        setTimeout(() => {
                            updateDate.classList.remove('flash');
                        }, 2000);
                    }

                    // Esconde o formulário e exibe o bloco de informações
                    form.style.display = 'none';
                    infoBlock.style.display = 'block';
                    
                    const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                    if (toggleButton) {
                        toggleButton.innerHTML = '';
                        displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                    }

                    if (contentBlock) {
                        contentBlock.classList.add('expanded');
                        contentBlock.style.display = 'block';
                    }

                    return resolve();
                }

                if (!shippingRates || !Array.isArray(shippingRates.shipping_rates) || shippingRates.shipping_rates.length === 0) {
                    // Esconde todos os componentes filhos do bloco
                    const contentBlock = infoBlock.querySelector('.woo-better-content-block');
                    if (contentBlock) {
                        // Remove a classe 'expanded' se estiver presente
                        if (contentBlock.classList.contains('expanded')) {
                            contentBlock.classList.remove('expanded');
                            contentBlock.style.height = '';
                        }
                        // Esconde todos os filhos do bloco
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

                        // Só agora exibe o bloco e expande
                        contentBlock.style.display = 'block';
                        contentBlock.classList.add('expanded');
                    }
                    infoBlock.style.display = 'block';
                    form.style.display = 'none';
                    return reject('Nenhuma taxa de envio foi encontrada.');
                }

                // Adiciona a data de atualização aos dados antes de salvar no cache
                const dataWithTimestamp = {
                    ...shippingRates,
                    product: {
                        ...shippingRates.product,
                        updated_at: new Date().toISOString()
                    }
                };

                // Salva no novo sistema de cache estruturado
                setCachedShippingData(postcode, WooBetterData.product_id, dataWithTimestamp);

                // Atualiza o último CEP usado
                setLastUsedPostcode(postcode);

                // Marca que o usuário fez uma consulta manual
                hasUserMadeQuery = true;

                // Esconde o formulário de CEP
                form.style.display = 'none';
                
                // Exibe o bloco de informações
                infoBlock.style.display = 'block';

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

                // Restaura display dos componentes filhos do bloco (exceto erro)
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

                // Limpa a lista de métodos de envio antes de popular
                shippingList.innerHTML = '';

                // Popula a lista com os métodos de envio
                shippingRates.shipping_rates.forEach(rate => {
                    const listItem = document.createElement('li');
                    const cost = parseFloat(rate.cost).toFixed(shippingRates.product.currency_minor_unit).replace('.', ',');

                    // Decodifica HTML entities do currency symbol
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = shippingRates.product.currency_symbol;
                    const decodedSymbol = tempDiv.textContent || tempDiv.innerText || shippingRates.product.currency_symbol;

                    listItem.innerHTML = `<strong>${decodedSymbol} ${cost}</strong> - ${rate.label}`;
                    shippingList.appendChild(listItem);
                });

                // Atualiza o CEP no bloco de CEP atual
                const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
                if (currentPostcodeText) {
                    currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;
                }

                // Atualiza a data de atualização
                const updateDate = infoBlock.querySelector('.woo-better-update-date');
                if (updateDate) {
                    // Usa a data que foi salva com os dados (que é a data atual da consulta)
                    const updateTime = shippingRates.product.updated_at
                        ? new Date(shippingRates.product.updated_at).toLocaleString('pt-BR')
                        : new Date().toLocaleString('pt-BR');
                    updateDate.textContent = `Atualizado em ${updateTime}`;

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

                // Garante que o bloco de conteúdo seja expandido
                if (contentBlock) {
                    const toggleButton = infoBlock.querySelector('.woo-better-toggle-button');
                    if (toggleButton) {
                        toggleButton.innerHTML = '';
                        displayButton(toggleButton, 'up', 'Esconder detalhes de entrega');
                    }
                    
                    // Força expansão mesmo se já tinha a classe expanded
                    contentBlock.classList.add('expanded');
                    contentBlock.style.display = 'block';
                    contentBlock.style.height = `${contentBlock.scrollHeight}px`;
                    
                    // Garante altura automática
                    setTimeout(() => {
                        if (contentBlock.classList.contains('expanded')) {
                            contentBlock.style.height = 'auto';
                        }
                    }, 300);
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

            // Verifica se é produto digital do cache
            if (shippingRates.digital === true) {
                // Tratamento específico para produtos digitais do cache
                shippingList.innerHTML = '<li>Produto digital, não há taxas de envio.</li>';
            } else {
                // Limpa e popula a lista de métodos de envio para produtos físicos
                shippingList.innerHTML = '';
                shippingRates.shipping_rates.forEach(rate => {
                    const listItem = document.createElement('li');
                    const cost = parseFloat(rate.cost).toFixed(shippingRates.product.currency_minor_unit).replace('.', ',');

                    // Decodifica HTML entities do currency symbol
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = shippingRates.product.currency_symbol;
                    const decodedSymbol = tempDiv.textContent || tempDiv.innerText || shippingRates.product.currency_symbol;

                    listItem.innerHTML = `<strong>${decodedSymbol} ${cost}</strong> - ${rate.label}`;
                    shippingList.appendChild(listItem);
                });
            }

            // Atualiza o CEP no bloco de CEP atual
            const currentPostcodeText = infoBlock.querySelector('.woo-better-current-postcode-text');
            currentPostcodeText.innerHTML = `<strong>CEP</strong>: ${postcode}`;

            // Atualiza a data de atualização
            const updateDate = infoBlock.querySelector('.woo-better-update-date');
            if (updateDate) {
                // Usa a data do cache se disponível
                let displayDate;
                if (shippingRates.product && shippingRates.product.updated_at) {
                    displayDate = new Date(shippingRates.product.updated_at).toLocaleString('pt-BR');
                } else if (shippingRates.timestamp) {
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
            } else if (contentInfoBlock) {
                // Força reexpansão mesmo se já tinha a classe expanded
                contentInfoBlock.classList.add('expanded');
                contentInfoBlock.style.display = 'block';
                contentInfoBlock.style.height = `${contentInfoBlock.scrollHeight}px`;
                
                // Garante altura automática
                setTimeout(() => {
                    if (contentInfoBlock.classList.contains('expanded')) {
                        contentInfoBlock.style.height = 'auto';
                    }
                }, 300);
            }

        } catch (error) {

            // Em caso de erro, remove o cache corrompido e força nova consulta
            const cache = getProductCache();
            const variationId = getCurrentVariationId();
            const currentQuantity = getCurrentProductQuantity();
            
            // Inclui a quantidade na chave para remoção do cache
            const cacheKey = variationId > 0 
                ? `${WooBetterData.product_id}_${variationId}_qty${currentQuantity}`
                : `${WooBetterData.product_id}_qty${currentQuantity}`;
            
            if (cache[postcode] && cache[postcode][cacheKey]) {
                delete cache[postcode][cacheKey];
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
        const variationId = getCurrentVariationId();
        const currentQuantity = getCurrentProductQuantity();
        
        // Inclui a quantidade na chave do cache
        const cacheKey = variationId > 0 
            ? `${productId}_${variationId}_qty${currentQuantity}`
            : `${productId}_qty${currentQuantity}`;

        if (cache[postcode] && cache[postcode][cacheKey]) {
            return cache[postcode][cacheKey];
        }

        return null;
    }

    function setCachedShippingData(postcode, productId, shippingData) {
        const cacheKey = 'woo_better_product_cache';
        const cache = getProductCache();
        const variationId = getCurrentVariationId();
        const currentQuantity = getCurrentProductQuantity();
        
        // Inclui a quantidade na chave do cache
        const productCacheKey = variationId > 0 
            ? `${productId}_${variationId}_qty${currentQuantity}`
            : `${productId}_qty${currentQuantity}`;

        // Inicializa a estrutura se necessário
        if (!cache[postcode]) {
            cache[postcode] = {};
        }

        // Remove dados desnecessários da API antes de salvar
        const cleanData = {
            product: shippingData.product,
            shipping_rates: shippingData.shipping_rates,
            quantity: currentQuantity, // Salva a quantidade no cache
            timestamp: Date.now()
        };
        
        // Preserva a flag digital se existir
        if (shippingData.digital !== undefined) {
            cleanData.digital = shippingData.digital;
        }

        // Salva os dados com a nova chave que inclui quantidade
        cache[postcode][productCacheKey] = cleanData;

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
        // Garante que o CEP seja salvo sempre formatado
        const formattedPostcode = formatCEP(postcode);
        // Salva o CEP como compartilhado entre produto e carrinho
        setSharedPostcode(formattedPostcode);
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