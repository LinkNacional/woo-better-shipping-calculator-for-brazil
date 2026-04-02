document.addEventListener("DOMContentLoaded", function () {
    let billingBlockFound = false
    let submitFound = false
    let birthdateEventsBound = false
    let placeOrderButton = null
    let intervalCount = 0
    let checkInterval = null
    let updateDataTimeout = null // Timeout para debounce do salvamento
    let birthdateFieldsActive = false // Flag para controlar se os campos estão ativos

    // Variáveis para salvar dados do campo
    let savedBirthdateData = {
        billing_birthdate: ''
    };

    // Função para verificar se está usando mesmo endereço para cobrança
    function isUsingSameAddressForBilling() {
        const checkbox = document.querySelector('input[type="checkbox"][id^="checkbox-control"]');
        if (checkbox) {
            // Verifica se o checkbox está dentro do container correto
            const checkboxContainer = checkbox.closest('.wc-block-checkout__use-address-for-billing');
            if (checkboxContainer) {
                return checkbox.checked;
            }
        }
        return false;
    }

    // Função para remover campos de birthdate
    function removeBirthdateFields() {
        const birthdateField = document.querySelector('input[name="woo_better_birthdate"]');
        const birthdateContainer = birthdateField ? birthdateField.closest('.wc-block-components-text-input') : null;
        
        if (birthdateContainer) {
            birthdateContainer.remove();
        }
        
        birthdateFieldsActive = false;
        billingBlockFound = false;
        birthdateEventsBound = false;
        
        // Limpar dados do Store API
        clearBirthdateDataFromStore();
    }

    // Função para limpar dados do Store API
    function clearBirthdateDataFromStore() {
        const emptyData = {
            billing_birthdate: ''
        };

        // Usar setExtensionData (método principal)
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_birthdate', emptyData);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_birthdate',
                data: emptyData
            });
        }
    }

    /**
     * Observer para monitorar containers billing/shipping e recriar campo birthdate quando necessário
     */
    const checkoutFieldObserver = new MutationObserver((mutations) => {
        // Verifica se a funcionalidade está habilitada
        if (typeof WooBetterBirthdateData === 'undefined') {
            if (birthdateFieldsActive) {
                removeBirthdateFields();
            }
            return;
        }

        const billingBlock = document.querySelector('#billing')
        const shippingBlock = document.querySelector('#shipping')
        const useSameAddress = isUsingSameAddressForBilling()

        // Determinar qual container usar baseado no checkbox
        let targetContainer = useSameAddress ? shippingBlock : billingBlock;
        let containerType = useSameAddress ? 'shipping' : 'billing';

        if (!targetContainer) {
            billingBlockFound = false
            birthdateFieldsActive = false
            return
        }

        if (targetContainer && !billingBlockFound) {
            billingBlockFound = true
            setTimeout(() => {
                initializeBirthdateField(targetContainer, containerType)
            }, 200)
        }

        // Verifica se o campo de data de nascimento ainda existe
        const birthdateInput = document.querySelector('input[name="woo_better_birthdate"]')
        if (!birthdateInput && billingBlockFound && targetContainer) {
            birthdateEventsBound = false
            setTimeout(() => {
                initializeBirthdateField(targetContainer, containerType)
            }, 300)
        }

        // Observar mudanças no checkbox de mesmo endereço
        const sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]');
        if (sameAddressCheckbox && !sameAddressCheckbox.dataset.birthdateListener) {
            sameAddressCheckbox.addEventListener('change', function() {
                setTimeout(() => {
                    if (birthdateFieldsActive) {
                        // Remover campos do container atual
                        removeBirthdateFields();
                        
                        // Recriar no container apropriado
                        const newUseSameAddress = isUsingSameAddressForBilling();
                        const newTargetContainer = newUseSameAddress ? document.querySelector('#shipping') : document.querySelector('#billing');
                        const newContainerType = newUseSameAddress ? 'shipping' : 'billing';
                        
                        if (newTargetContainer) {
                            initializeBirthdateField(newTargetContainer, newContainerType);
                        }
                    }
                }, 300);
            });
            sameAddressCheckbox.dataset.birthdateListener = 'true';
        }
    })

    // Observer para detectar quando o botão "Place Order" é clicado
    const submitObserver = new MutationObserver((mutations) => {
        placeOrderButton = document.querySelector('.wc-block-components-checkout-place-order-button')

        if (placeOrderButton && !submitFound) {
            submitFound = true
            placeOrderButton.addEventListener('click', handleBirthdateValidationOnSubmit)
        }

        if (!placeOrderButton) {
            submitFound = false
        }
    })

    function handleBirthdateValidationOnSubmit(event) {
        const birthdateInput = document.querySelector('input[name="woo_better_birthdate"]');
        const birthdateContainer = birthdateInput ? birthdateInput.closest('.wc-block-components-text-input') : null;
        const birthdateError = birthdateContainer ? birthdateContainer.querySelector('.wc-block-components-validation-error') : null;

        if (birthdateInput && birthdateContainer) {
            const isValid = validateBirthdateField(birthdateInput, birthdateContainer);
            
            // Se campo está vazio ou inválido, bloquear submissão
            if (!birthdateInput.value.trim() || !isValid) {
                event.stopPropagation();
                event.preventDefault();
                
                if (birthdateError) {
                    birthdateError.style.display = 'block';
                }
                
                // Scroll para o campo com erro
                birthdateInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    checkoutFieldObserver.observe(document.body, { childList: true, subtree: true })
    submitObserver.observe(document.body, { childList: true, subtree: true })

    function initializeBirthdateField(container, containerType) {
        if (birthdateEventsBound) return

        // Verificar se a funcionalidade está habilitada
        if (typeof WooBetterBirthdateData === 'undefined') {
            return;
        }

        // Processo similar ao PersonType - encontrar editButton e expandir se necessário
        const editButton = document.querySelector(`span.wc-block-components-address-card__edit[aria-controls="${containerType}"]`);
        
        if (!editButton) {
            return;
        }

        if (editButton.getAttribute('aria-expanded') != 'true') {
            editButton.click()
        }

        if (editButton.getAttribute('aria-expanded') == 'true') {
            // Aguardar um pouco para que os campos sejam renderizados
            setTimeout(() => {
                addBirthdateField(container, containerType);
            }, 300);
        }
    }

    function addBirthdateField(container, containerType = 'billing') {
        // Verificar se já existe para evitar duplicação
        if (document.querySelector('input[name="woo_better_birthdate"]')) {
            return;
        }

        // Encontrar o campo last_name como referência (seguindo padrão do PersonType)
        const lastNameField = container.querySelector(`#${containerType}-last_name`);
        
        if (!lastNameField) {
            return;
        }

        // Obter valor inicial se existir
        let initialValue = (typeof WooBetterBirthdateData !== 'undefined' && WooBetterBirthdateData.billing_birthdate) ? WooBetterBirthdateData.billing_birthdate : '';
        
        // Usar valores salvos se existirem
        if (savedBirthdateData.billing_birthdate) {
            initialValue = savedBirthdateData.billing_birthdate;
        } else {
            savedBirthdateData.billing_birthdate = initialValue;
        }

        // Criar o campo após o last_name (seguindo padrão do PersonType)
        const lastInsertedElement = lastNameField.parentElement; // Div pai do last_name
        const birthdateContainer = createBirthdateFieldContainer(initialValue, containerType);
        
        if (!birthdateContainer) {
            return;
        }

        // Inserir após o last_name
        lastInsertedElement.insertAdjacentElement('afterend', birthdateContainer);
        birthdateContainer.dataset.birthdateHighlighted = 'true';
        
        // Marcar como ativo e configurar eventos
        birthdateFieldsActive = true;
        birthdateEventsBound = true;
        
        // Configurar eventos do campo
        setupBirthdateEvents();
        
        // Atualizar dados imediatamente
        if (initialValue) {
            setTimeout(() => {
                saveBirthdateToExtensionData();
            }, 100);
        }
    }

    function setupBirthdateEvents() {
        const birthdateInput = document.querySelector('input[name="woo_better_birthdate"]');
        const birthdateContainer = birthdateInput ? birthdateInput.closest('.wc-block-components-text-input') : null;
        
        if (!birthdateInput || !birthdateContainer) {
            return;
        }

        // Configurar eventos se ainda não foram configurados
        if (!birthdateInput.dataset.eventsConfigured) {
            birthdateInput.addEventListener('change', function() {
                savedBirthdateData.billing_birthdate = this.value;
                
                // Validação de data
                const isValid = validateBirthdateField(this, birthdateContainer);
                
                // Controlar exibição do erro baseado na validação
                const errorDiv = birthdateContainer.querySelector('.wc-block-components-validation-error');
                if (errorDiv) {
                    if (!isValid) {
                        errorDiv.style.display = 'block';
                    } else {
                        errorDiv.style.display = 'none';
                    }
                }
                
                // Salvar no Store API com debounce
                clearTimeout(updateDataTimeout);
                updateDataTimeout = setTimeout(() => {
                    saveBirthdateToExtensionData();
                }, 300);
            });

            birthdateInput.addEventListener('input', function() {
                savedBirthdateData.billing_birthdate = this.value;
                
                // Limpar erro enquanto digita se tiver conteúdo válido
                const errorDiv = birthdateContainer.querySelector('.wc-block-components-validation-error');
                if (errorDiv && this.value.trim()) {
                    const isValid = validateBirthdateField(this, birthdateContainer);
                    if (isValid) {
                        errorDiv.style.display = 'none';
                    }
                }
            });
            
            birthdateInput.dataset.eventsConfigured = 'true';
        }
    }

    function getWooCommerceInputPadding() {
        // Lista de seletores para capturar padding dos inputs do WooCommerce
        const inputSelectors = [
            '.wc-block-components-text-input.is-active input[type=text]',
            '.wc-block-components-text-input.is-active input[type=email]',  
            '.wc-block-components-text-input.is-active input[type=tel]',
            '.wc-block-components-text-input.is-active input[type=number]',
            '.wc-block-components-form .wc-block-components-text-input.is-active input[type=text]',
            '.wc-block-components-form .wc-block-components-text-input.is-active input[type=email]'
        ];

        for (const selector of inputSelectors) {
            const existingInput = document.querySelector(selector);
            if (existingInput) {
                const computedStyle = window.getComputedStyle(existingInput);
                const padding = computedStyle.getPropertyValue('padding');
                
                // Se encontrou padding válido, retorna
                if (padding && padding !== '0px' && padding !== 'auto' && padding !== '') {
                    return padding;
                }
            }
        }

        // Fallback: tenta encontrar qualquer input dentro de um container .wc-block-components-text-input
        const fallbackInput = document.querySelector('.wc-block-components-text-input input');
        if (fallbackInput) {
            const computedStyle = window.getComputedStyle(fallbackInput);
            const padding = computedStyle.getPropertyValue('padding');
            
            if (padding && padding !== '0px' && padding !== 'auto' && padding !== '') {
                return padding;
            }
        }

        return null;
    }

    function getLastNameFieldDimensions(containerType = 'billing') {
        // Procurar o campo lastname no container específico
        const lastNameInput = document.querySelector(`#${containerType}-last_name`);
        
        if (lastNameInput) {
            const computedStyle = window.getComputedStyle(lastNameInput);
            return {
                height: computedStyle.getPropertyValue('height')
            };
        }

        // Fallback: tentar encontrar qualquer input de lastname
        const fallbackLastName = document.querySelector('input[id$="-last_name"]');
        if (fallbackLastName) {
            const computedStyle = window.getComputedStyle(fallbackLastName);
            return {
                height: computedStyle.getPropertyValue('height')
            };
        }

        return null;
    }

    function createBirthdateFieldContainer(initialValue = '', containerType = 'billing') {
        // Criar container seguindo o padrão dos campos do checkout
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'wc-block-components-text-input wc-block-components-address-form__birthdate is-active';

        // Criar input
        const input = document.createElement('input');
        input.type = 'date';
        input.name = 'woo_better_birthdate';
        input.id = 'woo_better_birthdate';
        input.setAttribute('autocapitalize', 'none');
        input.setAttribute('aria-label', 'Data de Nascimento');
        input.setAttribute('aria-invalid', 'false');
        input.title = '';

        // Definir limites de data nativos do HTML5
        const now = new Date();
        const maxDate = now.toISOString().split('T')[0]; // Data atual no formato YYYY-MM-DD
        
        const minDateObj = new Date();
        minDateObj.setFullYear(now.getFullYear() - 120);
        const minDate = minDateObj.toISOString().split('T')[0]; // 120 anos atrás
        
        // Definir data máxima baseada na idade mínima (18 anos)        
        const maxAgeObj = new Date();
        maxAgeObj.setFullYear(now.getFullYear() - 18);
        const maxAgeDate = maxAgeObj.toISOString().split('T')[0];
        
        input.setAttribute('min', minDate);
        input.setAttribute('max', maxAgeDate); // 18 anos máximo

        // Capturar dimensões do campo lastname para manter consistência visual
        const lastNameDimensions = getLastNameFieldDimensions(containerType);
        if (lastNameDimensions && lastNameDimensions.height && lastNameDimensions.height !== 'auto') {
            // Aplicar apenas a altura do lastname ao birthdate
            input.style.height = lastNameDimensions.height;
        }

        // Aplicar padding dos inputs existentes do WooCommerce
        const existingInputPadding = getWooCommerceInputPadding();
        if (existingInputPadding) {
            input.style.padding = existingInputPadding;
        }

        // Preencher com valor inicial se existir
        if (initialValue) {
            input.value = initialValue;
        }

        // Criar label seguindo o padrão dos outros campos
        const label = document.createElement('label');
        label.htmlFor = 'woo_better_birthdate';
        label.textContent = 'Data de Nascimento';

        // Adicionar event listeners
        input.addEventListener('change', function() {
            savedBirthdateData.billing_birthdate = this.value;
            
            // Validação de data
            const isValid = validateBirthdateField(this, fieldContainer);
            
            // Controlar exibição do erro baseado na validação
            const errorDiv = fieldContainer.querySelector('.wc-block-components-validation-error');
            if (errorDiv) {
                if (!isValid) {
                    errorDiv.style.display = 'block';
                } else {
                    errorDiv.style.display = 'none';
                }
            }
            
            // Salvar no Store API com debounce
            clearTimeout(updateDataTimeout);
            updateDataTimeout = setTimeout(() => {
                saveBirthdateToExtensionData();
            }, 300);
        });

        input.addEventListener('input', function() {
            savedBirthdateData.billing_birthdate = this.value;
            
            // Limpar erro enquanto digita se tiver conteúdo válido
            const errorDiv = fieldContainer.querySelector('.wc-block-components-validation-error');
            if (errorDiv && this.value.trim()) {
                const isValid = validateBirthdateField(this, fieldContainer);
                if (isValid) {
                    errorDiv.style.display = 'none';
                }
            }
        });

        // Montar o campo
        fieldContainer.appendChild(input);
        fieldContainer.appendChild(label);

        // Criando a div de erro (inicialmente oculta) - seguindo padrão do WooCommerce
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wc-block-components-validation-error wc-better-birthdate';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.style.display = 'none';

        const errorParagraph = document.createElement('p');
        errorParagraph.id = 'validate-error-birthdate';

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
        errorMessage.textContent = 'Por favor, insira uma data válida.';

        errorParagraph.appendChild(errorSvg);
        errorParagraph.appendChild(errorMessage);
        errorDiv.appendChild(errorParagraph);

        // Adicionando a mensagem de erro ao container
        fieldContainer.appendChild(errorDiv);

        return fieldContainer;
    }

    function validateBirthdateField(input, container) {
        const dateValue = input.value
        
        // Não remove mais as classes antigas - apenas atualiza a mensagem de erro
        let errorDiv = container.querySelector('.wc-block-components-validation-error');
        let errorMessage = errorDiv ? errorDiv.querySelector('span') : null;

        if (dateValue) {
            const dateObj = new Date(dateValue)
            const now = new Date()
            
            // Verifica se a data é válida
            if (isNaN(dateObj.getTime())) {
                if (errorMessage) errorMessage.textContent = 'Por favor, insira uma data válida.';
                return false
            }
            
            // Verifica se a data não é futura
            if (dateObj > now) {
                if (errorMessage) errorMessage.textContent = 'A data não pode ser futura.';
                return false
            }
            
            // Verifica idade máxima (120 anos)
            const maxAge = new Date()
            maxAge.setFullYear(now.getFullYear() - 120)
            
            if (dateObj < maxAge) {
                if (errorMessage) errorMessage.textContent = 'Data muito antiga. Máximo de 120 anos atrás.';
                return false
            }
            
            // Verifica idade mínima (18 anos)
            const minAge = new Date()
            minAge.setFullYear(now.getFullYear() - 18)
            
            if (dateObj > minAge) {
                if (errorMessage) errorMessage.textContent = 'Idade mínima de 18 anos é necessária.';
                return false
            }
        }
        
        return true
    }

    function saveBirthdateToExtensionData() {
        const data = {
            billing_birthdate: savedBirthdateData.billing_birthdate
        };

        // Usar setExtensionData (método principal)
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_birthdate', data);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_birthdate',
                data: data
            });
        }
    }
});