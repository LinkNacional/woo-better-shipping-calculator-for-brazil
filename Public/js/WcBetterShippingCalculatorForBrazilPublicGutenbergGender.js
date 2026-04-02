document.addEventListener("DOMContentLoaded", function () {
    let billingBlockFound = false
    let submitFound = false
    let genderEventsBound = false
    let placeOrderButton = null
    let intervalCount = 0
    let checkInterval = null
    let updateDataTimeout = null // Timeout para debounce do salvamento
    let genderFieldsActive = false // Flag para controlar se os campos estão ativos

    // Variáveis para salvar dados do campo
    let savedGenderData = {
        billing_gender: ''
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

    // Função para remover campos de gender
    function removeGenderFields() {
        const genderField = document.querySelector('select[name="woo_better_gender"]');
        const genderContainer = genderField ? genderField.closest('.wc-block-components-address-form__gender') : null;
        
        if (genderContainer) {
            genderContainer.remove();
        }
        
        genderFieldsActive = false;
        billingBlockFound = false;
        genderEventsBound = false;
        
        // Limpar dados do Store API
        clearGenderDataFromStore();
    }

    // Função para limpar dados do Store API
    function clearGenderDataFromStore() {
        const emptyData = {
            billing_gender: ''
        };

        // Usar setExtensionData (método principal)
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_gender', emptyData);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_gender',
                data: emptyData
            });
        }
    }

    /**
     * Observer para monitorar containers billing/shipping e recriar campo gender quando necessário
     */
    const checkoutFieldObserver = new MutationObserver((mutations) => {
        // Verifica se a funcionalidade está habilitada
        if (typeof WooBetterGenderData === 'undefined') {
            if (genderFieldsActive) {
                removeGenderFields();
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
            genderFieldsActive = false
            return
        }

        if (targetContainer && !billingBlockFound) {
            billingBlockFound = true
            setTimeout(() => {
                initializeGenderField(targetContainer, containerType)
            }, 200)
        }

        // Verifica se o campo de gênero ainda existe
        const genderInput = document.querySelector('select[name="woo_better_gender"]')
        if (!genderInput && billingBlockFound && targetContainer) {
            genderEventsBound = false
            setTimeout(() => {
                initializeGenderField(targetContainer, containerType)
            }, 300)
        }

        // Observar mudanças no checkbox de mesmo endereço
        const sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]');
        if (sameAddressCheckbox && !sameAddressCheckbox.dataset.genderListener) {
            sameAddressCheckbox.addEventListener('change', function() {
                setTimeout(() => {
                    if (genderFieldsActive) {
                        // Remover campos do container atual
                        removeGenderFields();
                        
                        // Recriar no container apropriado
                        const newUseSameAddress = isUsingSameAddressForBilling();
                        const newTargetContainer = newUseSameAddress ? document.querySelector('#shipping') : document.querySelector('#billing');
                        const newContainerType = newUseSameAddress ? 'shipping' : 'billing';
                        
                        if (newTargetContainer) {
                            initializeGenderField(newTargetContainer, newContainerType);
                        }
                    }
                }, 300);
            });
            sameAddressCheckbox.dataset.genderListener = 'true';
        }
    })

    // Observer para detectar quando o botão "Place Order" é clicado
    const submitObserver = new MutationObserver((mutations) => {
        placeOrderButton = document.querySelector('.wc-block-components-checkout-place-order-button')

        if (placeOrderButton && !submitFound) {
            submitFound = true
            placeOrderButton.addEventListener('click', handleGenderValidationOnSubmit)
        }

        if (!placeOrderButton) {
            submitFound = false
        }
    })

    function handleGenderValidationOnSubmit(event) {
        // Remove validação obrigatória - campo é opcional
        // O usuário pode deixar vazio sem bloqueio do checkout
    }

    checkoutFieldObserver.observe(document.body, { childList: true, subtree: true })
    submitObserver.observe(document.body, { childList: true, subtree: true })

    function initializeGenderField(container, containerType) {
        if (genderEventsBound) return

        // Verificar se a funcionalidade está habilitada
        if (typeof WooBetterGenderData === 'undefined') {
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
                addGenderField(container, containerType);
            }, 300);
        }
    }

    function addGenderField(container, containerType = 'billing') {
        // Verificar se já existe para evitar duplicação
        if (document.querySelector('select[name="woo_better_gender"]')) {
            return;
        }

        // Primeiro procurar pelo campo birthdate como referência
        let referenceField = container.querySelector('input[name="woo_better_birthdate"]');
        
        // Se não encontrar birthdate, usar last_name como referência
        if (!referenceField) {
            referenceField = container.querySelector(`#${containerType}-last_name`);
        }
        
        if (!referenceField) {
            return;
        }

        // Obter valor inicial se existir
        let initialValue = (typeof WooBetterGenderData !== 'undefined' && WooBetterGenderData.billing_gender) ? WooBetterGenderData.billing_gender : '';
        
        // Usar valores salvos se existirem
        if (savedGenderData.billing_gender) {
            initialValue = savedGenderData.billing_gender;
        } else {
            savedGenderData.billing_gender = initialValue;
        }

        // Criar o campo após a referência (birthdate ou last_name)
        const lastInsertedElement = referenceField.parentElement; // Div pai do campo de referência
        const genderContainer = createGenderFieldContainer(initialValue, containerType);
        
        if (!genderContainer) {
            return;
        }

        // Inserir após o campo de referência
        lastInsertedElement.insertAdjacentElement('afterend', genderContainer);
        genderContainer.dataset.genderHighlighted = 'true';
        
        // Marcar como ativo e configurar eventos
        genderFieldsActive = true;
        genderEventsBound = true;
        
        // Configurar eventos do campo
        setupGenderEvents();
        
        // Atualizar dados imediatamente
        if (initialValue) {
            setTimeout(() => {
                saveGenderToExtensionData();
            }, 100);
        }
    }

    function setupGenderEvents() {
        const genderInput = document.querySelector('select[name="woo_better_gender"]');
        const genderContainer = genderInput ? genderInput.closest('.wc-block-components-address-form__gender') : null;
        
        if (!genderInput || !genderContainer) {
            return;
        }

        // Configurar eventos se ainda não foram configurados
        if (!genderInput.dataset.eventsConfigured) {
            genderInput.addEventListener('change', function() {
                savedGenderData.billing_gender = this.value;
                
                // Validação de gênero
                const isValid = validateGenderField(this, genderContainer);
                
                // Controlar exibição do erro baseado na validação
                const errorDiv = genderContainer.querySelector('.wc-block-components-validation-error');
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
                    saveGenderToExtensionData();
                }, 300);
            });

            genderInput.addEventListener('blur', function() {
                savedGenderData.billing_gender = this.value;
                
                // Limpar erro ao perder foco se tiver conteúdo válido
                const errorDiv = genderContainer.querySelector('.wc-block-components-validation-error');
                if (errorDiv && this.value.trim()) {
                    const isValid = validateGenderField(this, genderContainer);
                    if (isValid) {
                        errorDiv.style.display = 'none';
                    }
                }
            });
            
            genderInput.dataset.eventsConfigured = 'true';
        }
    }

    function createGenderFieldContainer(initialValue = '', containerType = 'billing') {
        // Container principal seguindo padrão do WooCommerce Blocks
        const fieldContainer = document.createElement('div');
        fieldContainer.classList.add('wc-block-components-address-form__gender', 'wc-block-components-gender-input', 'wc-block-components-select-input');

        // Container do select
        const selectContainer = document.createElement('div');
        selectContainer.classList.add('wc-blocks-components-select');

        // Container interno do select
        const selectInnerContainer = document.createElement('div');
        selectInnerContainer.classList.add('wc-blocks-components-select__container');

        // Criar label seguindo o padrão correto
        const label = document.createElement('label');
        label.htmlFor = 'billing-gender'; // ID fixo como billing-gender
        label.classList.add('wc-blocks-components-select__label');
        label.textContent = 'Gênero';

        // Criar select
        const select = document.createElement('select');
        select.name = 'woo_better_gender';
        select.id = 'billing-gender'; // ID fixo como billing-gender
        select.classList.add('wc-blocks-components-select__select');
        select.size = 1;
        select.setAttribute('aria-invalid', 'false');
        select.setAttribute('autocomplete', `section-${containerType} ${containerType} additional-info`);

        // Adicionar opções com os valores corretos (texto traduzido como value)
        const options = [
            { value: '', text: 'Selecione...', disabled: false, dataAlternateValues: '[Selecione um gênero]' },
            { value: 'Masculino', text: 'Masculino', dataAlternateValues: '[Masculino]' },
            { value: 'Feminino', text: 'Feminino', dataAlternateValues: '[Feminino]' },
            { value: 'Não-binário', text: 'Não-binário', dataAlternateValues: '[Não-binário]' },
            { value: 'Outro', text: 'Outro', dataAlternateValues: '[Outro]' },
            { value: 'Prefiro não dizer', text: 'Prefiro não dizer', dataAlternateValues: '[Prefiro não dizer]' }
        ];

        options.forEach(optionData => {
            const option = document.createElement('option');
            option.value = optionData.value;
            option.textContent = optionData.text;
            if (optionData.dataAlternateValues) {
                option.setAttribute('data-alternate-values', optionData.dataAlternateValues);
            }
            select.appendChild(option);
        });

        // Sempre definir o valor explicitamente (garantir "Selecione..." quando vazio)
        select.value = initialValue || '';
        console.log(initialValue)

        // Criar SVG da seta (seguindo padrão do WooCommerce)
        const expandSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        expandSvg.setAttribute('viewBox', '0 0 24 24');
        expandSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        expandSvg.setAttribute('width', '24');
        expandSvg.setAttribute('height', '24');
        expandSvg.classList.add('wc-blocks-components-select__expand');
        expandSvg.setAttribute('aria-hidden', 'true');
        expandSvg.setAttribute('focusable', 'false');

        const expandPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        expandPath.setAttribute('d', 'M17.5 11.6L12 16l-5.5-4.4.9-1.2L12 14l4.5-3.6 1 1.2z');
        expandSvg.appendChild(expandPath);

        // Adicionar event listeners
        select.addEventListener('change', function() {
            savedGenderData.billing_gender = this.value;
            
            // Validação de gênero
            const isValid = validateGenderField(this, fieldContainer);
            
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
                saveGenderToExtensionData();
            }, 300);
        });

        select.addEventListener('blur', function() {
            savedGenderData.billing_gender = this.value;
            
            // Limpar erro ao perder foco se tiver conteúdo válido
            const errorDiv = fieldContainer.querySelector('.wc-block-components-validation-error');
            if (errorDiv && this.value.trim()) {
                const isValid = validateGenderField(this, fieldContainer);
                if (isValid) {
                    errorDiv.style.display = 'none';
                }
            }
        });

        // Montar a estrutura correta
        selectInnerContainer.appendChild(label);
        selectInnerContainer.appendChild(select);
        selectInnerContainer.appendChild(expandSvg);
        selectContainer.appendChild(selectInnerContainer);
        fieldContainer.appendChild(selectContainer);

        // Criando a div de erro (inicialmente oculta) - seguindo padrão do WooCommerce
        const errorDiv = document.createElement('div');
        errorDiv.classList.add('wc-block-components-validation-error', 'wc-better-gender');
        errorDiv.setAttribute('role', 'alert');
        errorDiv.style.display = 'none';

        const errorParagraph = document.createElement('p');
        errorParagraph.id = 'validate-error-gender';

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
        errorMessage.textContent = 'Por favor, selecione um gênero válido.';

        errorParagraph.appendChild(errorSvg);
        errorParagraph.appendChild(errorMessage);
        errorDiv.appendChild(errorParagraph);

        // Adicionando a mensagem de erro ao container
        fieldContainer.appendChild(errorDiv);

        return fieldContainer;
    }

    function validateGenderField(select, container) {
        const genderValue = select.value
        
        // Não remove mais as classes antigas - apenas atualiza a mensagem de erro
        let errorDiv = container.querySelector('.wc-block-components-validation-error');
        let errorMessage = errorDiv ? errorDiv.querySelector('span') : null;

        // Lista de gêneros válidos (usando valores corretos - textos traduzidos)
        const validGenders = ['', 'Masculino', 'Feminino', 'Não-binário', 'Outro', 'Prefiro não dizer'];
        
        if (genderValue && !validGenders.includes(genderValue)) {
            if (errorMessage) errorMessage.textContent = 'Por favor, selecione uma opção válida.';
            return false;
        }
        
        return true;
    }

    function saveGenderToExtensionData() {
        const data = {
            billing_gender: savedGenderData.billing_gender
        };

        // Usar setExtensionData (método principal)
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_gender', data);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_gender',
                data: data
            });
        }
    }
});