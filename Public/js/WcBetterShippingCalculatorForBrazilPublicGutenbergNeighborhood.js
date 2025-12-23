document.addEventListener("DOMContentLoaded", function () {
    let billingBlockFound = false
    let shippingBlockFound = false
    let submitFound = false
    let placeOrderButton = null
    let intervalCount = 0
    let checkInterval = null
    let updateDataTimeout = null // Timeout para debounce do salvamento
    let countryObserverBilling = null // Observer para mudanças no campo de país billing
    let countryObserverShipping = null // Observer para mudanças no campo de país shipping
    let neighborhoodFieldsActive = false // Flag para controlar se os campos estão ativos

    // Variáveis para salvar dados dos campos
    let savedNeighborhoodData = {
        billing_neighborhood: '',
        shipping_neighborhood: ''
    };

    // Função para verificar se o país selecionado é Brasil
    function isBrazilSelected(context = 'billing') {
        const countryField = document.querySelector(`#${context}-country`) ||
                           document.querySelector(`select[name="${context}_country"]`) ||
                           document.querySelector(`input[name="${context}_country"]`);
        
        if (countryField) {
            return countryField.value === 'BR';
        }
        return false;
    }

    // Função para verificar se pelo menos um dos países (billing ou shipping) é Brasil
    function isAnyCountryBrazil() {
        return isBrazilSelected('billing') || isBrazilSelected('shipping');
    }

    // Função para remover campos de neighborhood
    function removeNeighborhoodFields() {
        const billingNeighborhoodField = document.querySelector('.wc-better-billing-neighborhood');
        const shippingNeighborhoodField = document.querySelector('.wc-better-shipping-neighborhood');
        
        if (billingNeighborhoodField) {
            billingNeighborhoodField.remove();
        }
        if (shippingNeighborhoodField) {
            shippingNeighborhoodField.remove();
        }
        
        neighborhoodFieldsActive = false;
        
        // Limpar dados do Store API
        clearNeighborhoodDataFromStore();
    }

    // Função para limpar dados do Store API
    function clearNeighborhoodDataFromStore() {
        const emptyData = {
            billing_neighborhood: '',
            shipping_neighborhood: ''
        };

        // Usar setExtensionData
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_neighborhood', emptyData);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_neighborhood',
                data: emptyData
            });
        }
    }

    const observer = new MutationObserver((mutationsList) => {
        // Verificar se pelo menos um país é Brasil antes de processar qualquer lógica
        if (!isAnyCountryBrazil()) {
            // Se nenhum país for Brasil e temos campos ativos, removê-los
            if (neighborhoodFieldsActive) {
                removeNeighborhoodFields();
            }
            return;
        }

        const billingBlock = document.querySelector('#billing')
        const shippingBlock = document.querySelector('#shipping')

        if (!billingBlock) {
            billingBlockFound = false
            intervalCount = 0
        }

        if (!shippingBlock) {
            shippingBlockFound = false
        }

        if (billingBlock && !billingBlockFound && isBrazilSelected('billing')) {
            billingNeighborhoodHandle(billingBlock)
        }

        if (shippingBlock && !shippingBlockFound && isBrazilSelected('shipping')) {
            shippingNeighborhoodHandle(shippingBlock)
        }

        // Observar mudanças nos campos de país
        const billingCountryField = document.querySelector('#billing-country');
        const shippingCountryField = document.querySelector('#shipping-country');
        
        if (billingCountryField && !countryObserverBilling) {
            observeCountryChanges('billing');
        }
        if (shippingCountryField && !countryObserverShipping) {
            observeCountryChanges('shipping');
        }

        const placeOrderContainer = document.querySelector('.wc-block-checkout__actions_row')

        if (placeOrderContainer) {
            placeOrderButton = placeOrderContainer.querySelector('button')
        }

        if (placeOrderButton && !submitFound) {
            submitFound = true

            if (placeOrderButton) {
                placeOrderButton.addEventListener('click', handlePlaceOrderClick);

                function handlePlaceOrderClick(event) {
                    // Só validar se pelo menos um país for Brasil
                    if (!isAnyCountryBrazil()) {
                        return;
                    }

                    const billingNeighborhoodInput = document.getElementById('billing-neighborhood');
                    const shippingNeighborhoodInput = document.getElementById('shipping-neighborhood');

                    // Validação dos campos de bairro
                    let hasError = false;

                    // Só validar billing se o país de billing for Brasil
                    if (billingNeighborhoodInput && isBrazilSelected('billing')) {
                        const billingValue = billingNeighborhoodInput.value.trim();
                        if (!billingValue.length) {
                            showNeighborhoodValidationError(billingNeighborhoodInput, 'Por favor, informe o bairro de cobrança.');
                            billingNeighborhoodInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            hasError = true;
                        } else {
                            hideNeighborhoodValidationError(billingNeighborhoodInput);
                        }
                    }

                    // Só validar shipping se o país de shipping for Brasil
                    if (shippingNeighborhoodInput && isBrazilSelected('shipping')) {
                        const shippingValue = shippingNeighborhoodInput.value.trim();
                        if (!shippingValue.length) {
                            showNeighborhoodValidationError(shippingNeighborhoodInput, 'Por favor, informe o bairro de entrega.');
                            if (!hasError) {
                                shippingNeighborhoodInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }
                            hasError = true;
                        } else {
                            hideNeighborhoodValidationError(shippingNeighborhoodInput);
                        }
                    }

                    if (hasError) {
                        event.stopPropagation();
                        event.preventDefault();
                        return;
                    }
                }
            }
        }
    });

    // Configuração do observer para observar mudanças no corpo do documento
    observer.observe(document.body, { childList: true, subtree: true });

    function billingNeighborhoodHandle(billingBlock) {
        // Só processar se o país de billing for Brasil
        if (!isBrazilSelected('billing')) {
            return;
        }

        const editBillingButton = document.querySelector('span.wc-block-components-address-card__edit[aria-controls="billing"]');
        
        if (!editBillingButton) {
            return;
        }

        if (editBillingButton.getAttribute('aria-expanded') != 'true') {
            editBillingButton.click()
        }

        if (editBillingButton.getAttribute('aria-expanded') == 'true') {
            
            // Aguardar um pouco para que os campos sejam renderizados
            setTimeout(() => {
                addBillingNeighborhoodField(billingBlock);
            }, 300);

            billingBlockFound = true
        }
    }

    function shippingNeighborhoodHandle(shippingBlock) {
        // Só processar se o país de shipping for Brasil
        if (!isBrazilSelected('shipping')) {
            return;
        }

        const editShippingButton = document.querySelector('span.wc-block-components-address-card__edit[aria-controls="shipping"]');
        
        if (!editShippingButton) {
            return;
        }

        if (editShippingButton.getAttribute('aria-expanded') != 'true') {
            editShippingButton.click()
        }

        if (editShippingButton.getAttribute('aria-expanded') == 'true') {
            
            // Aguardar um pouco para que os campos sejam renderizados
            setTimeout(() => {
                addShippingNeighborhoodField(shippingBlock);
            }, 300);

            shippingBlockFound = true
        }
    }

    function addBillingNeighborhoodField(billingBlock) {
        // Verificar se o campo já existe
        if (document.getElementById('billing-neighborhood')) {
            return;
        }

        const billingAddress = billingBlock.querySelector('#billing-address_1');
        
        if (!billingAddress) {
            return;
        }

        // Obter valor inicial dos dados da página
        let initialNeighborhood = (typeof WooBetterNeighborhoodData !== 'undefined' && WooBetterNeighborhoodData.billing_neighborhood) ? WooBetterNeighborhoodData.billing_neighborhood : '';

        // Usar valor salvo se existir (prioridade sobre dados iniciais)
        if (savedNeighborhoodData.billing_neighborhood) {
            initialNeighborhood = savedNeighborhoodData.billing_neighborhood;
        } else {
            // Se não temos dados salvos, salvar os dados iniciais
            savedNeighborhoodData.billing_neighborhood = initialNeighborhood;
        }

        let lastInsertedElement = billingAddress.parentElement; // Começar da div pai do address_1

        // Criar o campo de bairro
        createNeighborhoodField(lastInsertedElement, 'billing-neighborhood', 'Bairro', initialNeighborhood);

        // Configurar eventos do campo
        setupNeighborhoodEvents('billing-neighborhood');

        // Atualizar dados imediatamente
        updateNeighborhoodData(true);
    }

    function addShippingNeighborhoodField(shippingBlock) {
        // Verificar se o campo já existe
        if (document.getElementById('shipping-neighborhood')) {
            return;
        }

        const shippingAddress = shippingBlock.querySelector('#shipping-address_1');
        
        if (!shippingAddress) {
            return;
        }

        // Obter valor inicial dos dados da página
        let initialNeighborhood = (typeof WooBetterNeighborhoodData !== 'undefined' && WooBetterNeighborhoodData.shipping_neighborhood) ? WooBetterNeighborhoodData.shipping_neighborhood : '';

        // Usar valor salvo se existir (prioridade sobre dados iniciais)
        if (savedNeighborhoodData.shipping_neighborhood) {
            initialNeighborhood = savedNeighborhoodData.shipping_neighborhood;
        } else {
            // Se não temos dados salvos, salvar os dados iniciais
            savedNeighborhoodData.shipping_neighborhood = initialNeighborhood;
        }

        let lastInsertedElement = shippingAddress.parentElement; // Começar da div pai do address_1

        // Criar o campo de bairro
        createNeighborhoodField(lastInsertedElement, 'shipping-neighborhood', 'Bairro', initialNeighborhood);

        // Configurar eventos do campo
        setupNeighborhoodEvents('shipping-neighborhood');

        // Se temos valor salvo, executar evento de input para sincronizar
        if (initialNeighborhood) {
            setTimeout(() => {
                const neighborhoodInput = document.getElementById('shipping-neighborhood');
                if (neighborhoodInput) {
                    // Executar evento de input para manter sincronização
                    const inputEvent = new Event('input', { bubbles: true });
                    neighborhoodInput.dispatchEvent(inputEvent);
                }
            }, 100);
        }

        // Atualizar dados imediatamente
        updateNeighborhoodData(true);
    }

    // Função para observar mudanças nos campos de país
    function observeCountryChanges(context) {
        const countryField = document.querySelector(`#${context}-country`);
        if (!countryField) {
            return;
        }

        // Observar mudanças diretamente no select do país
        if (!countryField.dataset.neighborhoodListener) {
            countryField.addEventListener('change', function() {
                setTimeout(() => {
                    handleCountryChange();
                }, 300);
            });
            countryField.dataset.neighborhoodListener = 'true';
        }

        // Criar observer específico para mudanças no campo de país
        if (context === 'billing' && !countryObserverBilling) {
            countryObserverBilling = createCountryObserver(countryField, context);
        } else if (context === 'shipping' && !countryObserverShipping) {
            countryObserverShipping = createCountryObserver(countryField, context);
        }
    }

    function createCountryObserver(countryField, context) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' || mutation.type === 'attributes') {
                    setTimeout(() => {
                        const newCountryField = document.querySelector(`#${context}-country`);
                        if (newCountryField && !newCountryField.dataset.neighborhoodListener) {
                            newCountryField.addEventListener('change', function() {
                                setTimeout(() => {
                                    handleCountryChange();
                                }, 300);
                            });
                            newCountryField.dataset.neighborhoodListener = 'true';
                        }
                    }, 100);
                }
            });
        });
        
        // Observar mudanças no container do campo de país
        const containerField = document.querySelector(`#${context}`);
        if (containerField) {
            observer.observe(containerField, {
                childList: true,
                subtree: true,
                attributes: true
            });
        }
        
        return observer;
    }

    function handleCountryChange() {
        if (!isAnyCountryBrazil()) {
            // Se NENHUM país é Brasil, remover TODOS os campos
            if (neighborhoodFieldsActive) {
                removeNeighborhoodFields();
            }
            return;
        }
        
        // Se pelo menos um país é Brasil, verificar campos individuais
        if (!isBrazilSelected('billing')) {
            const billingField = document.querySelector('.wc-better-billing-neighborhood');
            if (billingField) {
                billingField.remove();
            }
        } else {
            // Se billing é Brasil e não tem campo, criar
            if (!document.getElementById('billing-neighborhood')) {
                const billingBlock = document.querySelector('#billing');
                if (billingBlock) {
                    billingNeighborhoodHandle(billingBlock);
                }
            }
        }
        
        if (!isBrazilSelected('shipping')) {
            const shippingField = document.querySelector('.wc-better-shipping-neighborhood');
            if (shippingField) {
                shippingField.remove();
            }
        } else {
            // Se shipping é Brasil e não tem campo, criar
            if (!document.getElementById('shipping-neighborhood')) {
                const shippingBlock = document.querySelector('#shipping');
                if (shippingBlock) {
                    shippingNeighborhoodHandle(shippingBlock);
                }
            }
        }
        
        // Verificar se ainda temos campos ativos
        const hasFields = document.querySelector('.wc-better-billing-neighborhood') || 
                         document.querySelector('.wc-better-shipping-neighborhood');
        neighborhoodFieldsActive = !!hasFields;
    }

    function createNeighborhoodField(insertAfter, fieldId, labelText, initialValue) {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'wc-block-components-text-input wc-block-components-address-form__neighborhood wc-better-' + fieldId.replace('_', '-');

        const input = document.createElement('input');
        input.type = 'text';
        input.id = fieldId;
        input.name = fieldId;
        input.setAttribute('autocomplete', 'address-line2');
        input.setAttribute('aria-label', labelText);
        input.setAttribute('aria-invalid', 'false');
        input.setAttribute('autocapitalize', 'words');
        input.setAttribute('required', 'true');
        input.value = initialValue;
        input.setAttribute('title', 'Digite o nome do bairro');

        let lastValue = initialValue; // Armazenar último valor para detectar mudanças reais
        
        input.addEventListener('input', function() {
            const newValue = this.value.trim();
            
            // Salvar na variável global
            if (fieldId === 'billing-neighborhood') {
                savedNeighborhoodData.billing_neighborhood = newValue;
            } else if (fieldId === 'shipping-neighborhood') {
                savedNeighborhoodData.shipping_neighborhood = newValue;
            }
            
            // Só atualizar se o valor realmente mudou
            if (newValue !== lastValue) {
                lastValue = newValue;
                updateNeighborhoodData();
                
                // Validação em tempo real - ocultar erro se campo ficar preenchido
                if (newValue.length > 0) {
                    hideNeighborhoodValidationError(this);
                }
            }
        });

        const label = document.createElement('label');
        label.setAttribute('for', fieldId);
        label.textContent = labelText;

        fieldContainer.appendChild(input);
        fieldContainer.appendChild(label);

        // Criar elemento de erro (inicialmente oculto)
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wc-block-components-validation-error wc-better-neighborhood-error';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.style.display = 'none';

        const errorParagraph = document.createElement('p');
        errorParagraph.id = 'validate-error-' + fieldId;

        const errorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        errorSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        errorSvg.setAttribute('viewBox', '-2 -2 24 24');
        errorSvg.setAttribute('width', '24');
        errorSvg.setAttribute('height', '24');
        errorSvg.setAttribute('aria-hidden', 'true');
        errorSvg.setAttribute('focusable', 'false');

        const errorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        errorPath.setAttribute('d', 'M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z');

        errorSvg.appendChild(errorPath);
        const errorMessage = document.createElement('span');
        errorMessage.textContent = 'Por favor, informe o bairro.';

        errorParagraph.appendChild(errorSvg);
        errorParagraph.appendChild(errorMessage);
        errorDiv.appendChild(errorParagraph);

        fieldContainer.appendChild(errorDiv);

        if (initialValue) {
            fieldContainer.classList.add('is-active');
        }

        input.addEventListener('focus', () => {
            fieldContainer.classList.add('is-active');
        });

        input.addEventListener('blur', () => {
            if (!input.value.trim()) {
                fieldContainer.classList.remove('is-active');
                showNeighborhoodValidationError(input, 'Por favor, informe o bairro.');
            } else {
                hideNeighborhoodValidationError(input);
            }
        });

        insertAfter.insertAdjacentElement('afterend', fieldContainer);
    }

    function showNeighborhoodValidationError(inputElement, message) {
        const fieldContainer = inputElement.closest('.wc-better-billing-neighborhood, .wc-better-shipping-neighborhood');
        const errorDiv = fieldContainer ? fieldContainer.querySelector('.wc-better-neighborhood-error') : null;
        
        if (errorDiv) {
            const errorMessage = errorDiv.querySelector('span');
            if (errorMessage) {
                errorMessage.textContent = message;
            }
            errorDiv.style.display = 'block';
        }
        
        // Adicionar classe de erro ao container
        if (fieldContainer) {
            fieldContainer.classList.add('has-error');
        }
    }

    function hideNeighborhoodValidationError(inputElement) {
        const fieldContainer = inputElement.closest('.wc-better-billing-neighborhood, .wc-better-shipping-neighborhood');
        const errorDiv = fieldContainer ? fieldContainer.querySelector('.wc-better-neighborhood-error') : null;
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // Remover classe de erro do container
        if (fieldContainer) {
            fieldContainer.classList.remove('has-error');
        }
    }

    function setupNeighborhoodEvents(fieldId) {
        const neighborhoodInput = document.getElementById(fieldId);
        
        if (neighborhoodInput) {
            // Marcar campo como obrigatório
            neighborhoodInput.setAttribute('required', 'true');
        }
    }

    // Função para atualizar dados no Store API com debounce
    function updateNeighborhoodData(immediate = false) {
        // Só atualizar se pelo menos um país for Brasil
        if (!isAnyCountryBrazil()) {
            return;
        }

        // Cancelar timeout anterior se existir
        if (updateDataTimeout) {
            clearTimeout(updateDataTimeout);
            updateDataTimeout = null;
        }

        // Se for imediato, executar diretamente
        if (immediate) {
            executeNeighborhoodDataUpdate();
            return;
        }

        // Definir novo timeout de 1.5 segundos
        updateDataTimeout = setTimeout(() => {
            executeNeighborhoodDataUpdate();
            updateDataTimeout = null;
        }, 1500);
    }

    // Função que efetivamente executa a atualização
    function executeNeighborhoodDataUpdate() {
        // Só executar se pelo menos um país for Brasil
        if (!isAnyCountryBrazil()) {
            return;
        }

        const billingNeighborhoodInput = document.getElementById('billing-neighborhood');
        const shippingNeighborhoodInput = document.getElementById('shipping-neighborhood');

        const data = {
            billing_neighborhood: billingNeighborhoodInput ? billingNeighborhoodInput.value : '',
            shipping_neighborhood: shippingNeighborhoodInput ? shippingNeighborhoodInput.value : ''
        };

        // Usar setExtensionData
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_neighborhood', data);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_neighborhood',
                data: data
            });
        }
    }

    // Função para inicializar os campos no Store API
    function initializeStoreAPINeighborhoodFields() {
        // Só inicializar se pelo menos um país for Brasil
        if (!isAnyCountryBrazil()) {
            return;
        }

        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch, select } = wp.data;
                
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    
                    if (checkoutDispatch.setExtensionData) {
                        const currentData = select('wc/store/checkout').getExtensionData() || {};
                        const neighborhoodData = currentData['woo_better_neighborhood'] || {};
                        
                        // Obter valores iniciais dos dados da página
                        const initialBillingNeighborhood = (typeof WooBetterNeighborhoodData !== 'undefined' && WooBetterNeighborhoodData.billing_neighborhood) ? WooBetterNeighborhoodData.billing_neighborhood : '';
                        const initialShippingNeighborhood = (typeof WooBetterNeighborhoodData !== 'undefined' && WooBetterNeighborhoodData.shipping_neighborhood) ? WooBetterNeighborhoodData.shipping_neighborhood : '';
                        
                        // Inicializar os campos se não existirem
                        if (!neighborhoodData.hasOwnProperty('billing_neighborhood')) {
                            neighborhoodData['billing_neighborhood'] = initialBillingNeighborhood;
                        }
                        if (!neighborhoodData.hasOwnProperty('shipping_neighborhood')) {
                            neighborhoodData['shipping_neighborhood'] = initialShippingNeighborhood;
                        }
                        
                        checkoutDispatch.setExtensionData('woo_better_neighborhood', neighborhoodData);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }
    }

    // Inicializar campos do Store API
    initializeStoreAPINeighborhoodFields();

    // Observar mudanças nos campos e atualizar Store API
    const observerNeighborhood = new MutationObserver(function(mutations) {
        let hasNeighborhoodFieldsChanged = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const neighborhoodInputs = node.querySelectorAll ? 
                            node.querySelectorAll('#billing-neighborhood, #shipping-neighborhood') : [];
                        
                        if (neighborhoodInputs.length > 0 || 
                            (node.id && (node.id === 'billing-neighborhood' || node.id === 'shipping-neighborhood'))) {
                            hasNeighborhoodFieldsChanged = true;
                        }
                    }
                });
            }
        });
        
        if (hasNeighborhoodFieldsChanged) {
            setTimeout(() => {
                updateNeighborhoodData(true);
                
                // Adicionar listeners aos campos se ainda não existem
                const billingNeighborhoodInput = document.getElementById('billing-neighborhood');
                const shippingNeighborhoodInput = document.getElementById('shipping-neighborhood');
                
                if (billingNeighborhoodInput && !billingNeighborhoodInput.dataset.storeApiListener) {
                    let lastBillingValue = billingNeighborhoodInput.value;
                    
                    billingNeighborhoodInput.addEventListener('input', function() {
                        const newValue = this.value.trim();
                        
                        if (newValue !== lastBillingValue) {
                            lastBillingValue = newValue;
                            updateNeighborhoodData();
                            
                            if (newValue.length > 0) {
                                hideNeighborhoodValidationError(this);
                            }
                        }
                    });
                    billingNeighborhoodInput.dataset.storeApiListener = 'true';
                }
                
                if (shippingNeighborhoodInput && !shippingNeighborhoodInput.dataset.storeApiListener) {
                    let lastShippingValue = shippingNeighborhoodInput.value;
                    
                    shippingNeighborhoodInput.addEventListener('input', function() {
                        const newValue = this.value.trim();
                        
                        if (newValue !== lastShippingValue) {
                            lastShippingValue = newValue;
                            updateNeighborhoodData();
                            
                            if (newValue.length > 0) {
                                hideNeighborhoodValidationError(this);
                            }
                        }
                    });
                    shippingNeighborhoodInput.dataset.storeApiListener = 'true';
                }
            }, 100);
        }
    });

    observerNeighborhood.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Configurar listeners iniciais se os campos já existirem e países forem Brasil
    setTimeout(() => {
        // Verificar se pelo menos um país é Brasil antes de fazer qualquer coisa
        if (isAnyCountryBrazil()) {
            updateNeighborhoodData(true);
        
        const billingNeighborhoodInput = document.getElementById('billing-neighborhood');
        const shippingNeighborhoodInput = document.getElementById('shipping-neighborhood');
        
        if (billingNeighborhoodInput && !billingNeighborhoodInput.dataset.storeApiListener) {
            let lastBillingValue = billingNeighborhoodInput.value;
            
            billingNeighborhoodInput.addEventListener('input', function() {
                const newValue = this.value.trim();
                
                if (newValue !== lastBillingValue) {
                    lastBillingValue = newValue;
                    updateNeighborhoodData();
                    
                    if (newValue.length > 0) {
                        hideNeighborhoodValidationError(this);
                    }
                }
            });
            billingNeighborhoodInput.dataset.storeApiListener = 'true';
        }
        
        if (shippingNeighborhoodInput && !shippingNeighborhoodInput.dataset.storeApiListener) {
            let lastShippingValue = shippingNeighborhoodInput.value;
            
            shippingNeighborhoodInput.addEventListener('input', function() {
                const newValue = this.value.trim();
                
                if (newValue !== lastShippingValue) {
                    lastShippingValue = newValue;
                    updateNeighborhoodData();
                    
                    if (newValue.length > 0) {
                        hideNeighborhoodValidationError(this);
                    }
                }
            });
            shippingNeighborhoodInput.dataset.storeApiListener = 'true';
        }
        } // Fecha verificação de país
    }, 500);
});
