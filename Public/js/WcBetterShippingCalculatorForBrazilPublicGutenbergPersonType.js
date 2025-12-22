document.addEventListener("DOMContentLoaded", function () {
    let billingBlockFound = false
    let submitFound = false
    let personTypeEventsBound = false
    let placeOrderButton = null
    let intervalCount = 0
    let checkInterval = null
    let updateDataTimeout = null // Timeout para debounce do salvamento

    const observer = new MutationObserver((mutationsList) => {
        const billingBlock = document.querySelector('#billing')

        if (!billingBlock) {
            billingBlockFound = false
            intervalCount = 0
        }

        if (billingBlock && !billingBlockFound) {
            billingPersonTypeHandle(billingBlock)
        }

        const placeOrderContainer = document.querySelector('.wc-block-checkout__actions_row')

        if (placeOrderContainer) {
            placeOrderButton = placeOrderContainer.querySelector('button')
        }

        if (placeOrderButton && !submitFound) {
            submitFound = true

            let billingPersonTypeInput = ''
            let billingCpfInput = ''
            let billingCnpjInput = ''

            if (placeOrderButton) {
                placeOrderButton.addEventListener('click', handlePlaceOrderClick);

                function handlePlaceOrderClick(event) {
                    billingPersonTypeInput = document.getElementById('billing-persontype');
                    const billingDocumentInput = document.getElementById('billing_document');

                    // Validação do campo de documento unificado
                    if (billingDocumentInput) {
                        const documentValue = billingDocumentInput.value.trim();
                        const cleanValue = documentValue.replace(/\D/g, '');
                        const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                        
                        let isValid = false;
                        let errorMessage = '';
                        
                        // Verificar se está vazio
                        if (!documentValue.length) {
                            errorMessage = 'Por favor, insira seu CPF ou CNPJ.';
                            if (personTypeConfig === 'physical') {
                                errorMessage = 'Por favor, insira seu CPF.';
                            } else if (personTypeConfig === 'legal') {
                                errorMessage = 'Por favor, insira seu CNPJ.';
                            }
                        } else {
                            // Validar baseado na configuração
                            if (personTypeConfig === 'physical') {
                                // Apenas CPF permitido
                                if (cleanValue.length === 11) {
                                    isValid = true;
                                } else {
                                    errorMessage = 'Por favor, insira um CPF válido com 11 dígitos.';
                                }
                            } else if (personTypeConfig === 'legal') {
                                // Apenas CNPJ permitido
                                if (cleanValue.length === 14) {
                                    isValid = true;
                                } else {
                                    errorMessage = 'Por favor, insira um CNPJ válido com 14 dígitos.';
                                }
                            } else if (personTypeConfig === 'both') {
                                // CPF ou CNPJ permitidos
                                if (cleanValue.length === 11 || cleanValue.length === 14) {
                                    isValid = true;
                                } else {
                                    errorMessage = 'Por favor, insira um CPF completo (11 dígitos) ou CNPJ completo (14 dígitos).';
                                }
                            }
                        }
                        
                        // Se não for válido, bloquear envio
                        if (!isValid) {
                            event.stopPropagation();
                            event.preventDefault();
                            
                            // Exibir erro visual
                            showDocumentValidationError(errorMessage);
                            
                            // Scroll para o campo
                            billingDocumentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        } else {
                            // Se for válido, ocultar erro
                            hideDocumentValidationError();
                        }
                    }
                }
            }
        }
    });

    // Configuração do observer para observar mudanças no corpo do documento
    observer.observe(document.body, { childList: true, subtree: true });

    function billingPersonTypeHandle(billingBlock) {
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
                addPersonTypeFields(billingBlock);
            }, 300);

            billingBlockFound = true
        }
    }

    function addPersonTypeFields(billingBlock) {
        // Verificar se os campos já existem
        if (document.getElementById('billing_document')) {
            return;
        }

        const billingLastName = billingBlock.querySelector('#billing-last_name');
        
        if (!billingLastName) {
            return;
        }

        // Obter valores iniciais dos dados da página
        const initialPersonType = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_persontype) ? WooBetterPersonTypeData.billing_persontype : '';
        const initialCpf = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cpf) ? WooBetterPersonTypeData.billing_cpf : '';
        const initialCnpj = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cnpj) ? WooBetterPersonTypeData.billing_cnpj : '';

        // Obter configuração do tipo de pessoa
        const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
        const showSelect = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.show_select : true;

        let lastInsertedElement = billingLastName.parentElement; // Começar da div pai do last_name

        // Determinar valor inicial do documento (CPF ou CNPJ existente)
        let initialDocument = '';
        let detectedPersonType = '';
        
        if (initialCpf) {
            initialDocument = initialCpf;
            detectedPersonType = 'physical';
        } else if (initialCnpj) {
            initialDocument = initialCnpj;
            detectedPersonType = 'legal';
        }

        // Criar o campo unificado CPF/CNPJ
        createUnifiedDocumentField(lastInsertedElement, initialDocument, personTypeConfig);

        // Criar input hidden para o tipo de pessoa (gerenciado automaticamente)
        const hiddenPersonTypeInput = document.createElement('input');
        hiddenPersonTypeInput.type = 'hidden';
        hiddenPersonTypeInput.id = 'billing-persontype';
        hiddenPersonTypeInput.name = 'billing-persontype';
        hiddenPersonTypeInput.value = detectedPersonType || getDefaultPersonType(personTypeConfig);
        lastInsertedElement.insertAdjacentElement('afterend', hiddenPersonTypeInput);

        // Criar inputs hidden para CPF e CNPJ (para compatibilidade)
        const hiddenCpfInput = document.createElement('input');
        hiddenCpfInput.type = 'hidden';
        hiddenCpfInput.id = 'billing-cpf';
        hiddenCpfInput.name = 'billing-cpf';
        hiddenCpfInput.value = initialCpf;
        hiddenPersonTypeInput.insertAdjacentElement('afterend', hiddenCpfInput);

        const hiddenCnpjInput = document.createElement('input');
        hiddenCnpjInput.type = 'hidden';
        hiddenCnpjInput.id = 'billing-cnpj';
        hiddenCnpjInput.name = 'billing-cnpj';
        hiddenCnpjInput.value = initialCnpj;
        hiddenCpfInput.insertAdjacentElement('afterend', hiddenCnpjInput);

        // Configurar eventos do campo unificado
        setupUnifiedDocumentEvents();

        // Atualizar dados imediatamente
        updatePersonTypeData(true);
    }

    function createUnifiedDocumentField(insertAfter, initialValue, personTypeConfig) {
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'wc-block-components-text-input wc-block-components-address-form__document wc-better-billing-document';

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'billing_document';
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('aria-label', 'CPF/CNPJ');
        input.setAttribute('aria-invalid', 'false');
        input.setAttribute('autocapitalize', 'none');
        input.value = initialValue;

        // Título dinâmico baseado na configuração
        let titleText = '';
        let labelText = '';
        if (personTypeConfig === 'physical') {
            titleText = 'Digite seu CPF no formato 000.000.000-00';
            labelText = 'CPF';
        } else if (personTypeConfig === 'legal') {
            titleText = 'Digite seu CNPJ no formato 00.000.000/0000-00';
            labelText = 'CNPJ';
        } else {
            titleText = 'Digite seu CPF (000.000.000-00) ou CNPJ (00.000.000/0000-00)';
            labelText = 'CPF/CNPJ';
        }
        
        input.setAttribute('title', titleText);

        // Máscara dinâmica e detecção de tipo
        let lastValue = initialValue; // Armazenar último valor para detectar mudanças reais
        
        input.addEventListener('input', function() {
            const cleanValue = this.value.replace(/\D/g, '');
            const detectedType = detectDocumentType(cleanValue, personTypeConfig);
            
            // Aplicar formatação apropriada
            let formattedValue = '';
            if (detectedType === 'cpf') {
                formattedValue = applyCpfMask(this.value);
            } else if (detectedType === 'cnpj') {
                formattedValue = applyCnpjMask(this.value);
            } else {
                formattedValue = applyDynamicMask(this.value, personTypeConfig);
            }
            
            this.value = formattedValue;
            
            // Só atualizar se o valor realmente mudou (evitar salvamentos desnecessários quando no limite)
            if (formattedValue !== lastValue) {
                lastValue = formattedValue;
                updateHiddenFields(formattedValue, detectedType);
                updatePersonTypeData();
                
                // Validação em tempo real - ocultar erro se campo ficar válido
                validateDocumentRealTime(formattedValue, personTypeConfig);
            }
        });

        const label = document.createElement('label');
        label.setAttribute('for', 'billing_document');
        label.textContent = labelText;

        fieldContainer.appendChild(input);
        fieldContainer.appendChild(label);

        // Criar elemento de erro (inicialmente oculto)
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wc-block-components-validation-error wc-better-document-error';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.style.display = 'none';

        const errorParagraph = document.createElement('p');
        errorParagraph.id = 'validate-error-billing_document';

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
        errorMessage.textContent = 'Por favor, insira um documento válido.';

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
            if (!input.value) {
                fieldContainer.classList.remove('is-active');
                
                // Exibir erro se campo estiver vazio
                let errorMessage = '';
                if (personTypeConfig === 'physical') {
                    errorMessage = 'Por favor insira um CPF válido';
                } else if (personTypeConfig === 'legal') {
                    errorMessage = 'Por favor insira um CNPJ válido';
                } else {
                    errorMessage = 'Por favor insira um CPF/CNPJ válido';
                }
                showDocumentValidationError(errorMessage);
            }
        });

        insertAfter.insertAdjacentElement('afterend', fieldContainer);
    }

    function detectDocumentType(cleanValue, personTypeConfig) {
        // Se configuração permite apenas um tipo, usar esse tipo
        if (personTypeConfig === 'physical') return 'cpf';
        if (personTypeConfig === 'legal') return 'cnpj';
        
        // Para configuração 'both', detectar baseado no comprimento
        if (cleanValue.length >= 11 && cleanValue.length <= 11) {
            return 'cpf'; // CPF completo tem 11 dígitos
        } else if (cleanValue.length >= 14) {
            return 'cnpj'; // CNPJ completo tem 14 dígitos
        } else if (cleanValue.length > 11) {
            return 'cnpj'; // Mais de 11 dígitos indica CNPJ
        }
        
        return null; // Indeterminado
    }

    function applyDynamicMask(value, personTypeConfig) {
        const cleanValue = value.replace(/\D/g, '');
        
        // Se configuração é fixa, aplicar máscara específica
        if (personTypeConfig === 'physical') {
            return applyCpfMask(value);
        } else if (personTypeConfig === 'legal') {
            return applyCnpjMask(value);
        }
        
        // Para configuração 'both', decidir baseado no comprimento
        if (cleanValue.length <= 11) {
            return applyCpfMask(value);
        } else {
            return applyCnpjMask(value);
        }
    }

    function updateHiddenFields(documentValue, detectedType) {
        const personTypeInput = document.getElementById('billing-persontype');
        const cpfInput = document.getElementById('billing-cpf');
        const cnpjInput = document.getElementById('billing-cnpj');
        
        if (detectedType === 'cpf') {
            if (personTypeInput) personTypeInput.value = 'physical';
            if (cpfInput) cpfInput.value = documentValue;
            if (cnpjInput) cnpjInput.value = '';
        } else if (detectedType === 'cnpj') {
            if (personTypeInput) personTypeInput.value = 'legal';
            if (cpfInput) cpfInput.value = '';
            if (cnpjInput) cnpjInput.value = documentValue;
        } else {
            // Indeterminado - manter valor no campo apropriado baseado na configuração
            const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
            
            if (personTypeConfig === 'physical') {
                if (personTypeInput) personTypeInput.value = 'physical';
                if (cpfInput) cpfInput.value = documentValue;
                if (cnpjInput) cnpjInput.value = '';
            } else if (personTypeConfig === 'legal') {
                if (personTypeInput) personTypeInput.value = 'legal';
                if (cpfInput) cpfInput.value = '';
                if (cnpjInput) cnpjInput.value = documentValue;
            } else {
                // Para 'both', decidir baseado no comprimento parcial
                const cleanValue = documentValue.replace(/\D/g, '');
                if (cleanValue.length <= 11) {
                    if (cpfInput) cpfInput.value = documentValue;
                    if (cnpjInput) cnpjInput.value = '';
                } else {
                    if (cpfInput) cpfInput.value = '';
                    if (cnpjInput) cnpjInput.value = documentValue;
                }
            }
        }
    }

    function showDocumentValidationError(message) {
        const errorDiv = document.querySelector('.wc-better-document-error');
        const fieldContainer = document.querySelector('.wc-better-billing-document');
        
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

    function hideDocumentValidationError() {
        const errorDiv = document.querySelector('.wc-better-document-error');
        const fieldContainer = document.querySelector('.wc-better-billing-document');
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // Remover classe de erro do container
        if (fieldContainer) {
            fieldContainer.classList.remove('has-error');
        }
    }

    function validateDocumentRealTime(documentValue, personTypeConfig) {
        const cleanValue = documentValue.replace(/\D/g, '');
        let isValid = false;
        
        if (documentValue.length > 0) {
            if (personTypeConfig === 'physical') {
                isValid = cleanValue.length === 11;
            } else if (personTypeConfig === 'legal') {
                isValid = cleanValue.length === 14;
            } else if (personTypeConfig === 'both') {
                isValid = cleanValue.length === 11 || cleanValue.length === 14;
            }
        }
        
        // Ocultar erro se campo estiver válido
        if (isValid) {
            hideDocumentValidationError();
        }
    }

    function getDefaultPersonType(personTypeConfig) {
        if (personTypeConfig === 'physical') return 'physical';
        if (personTypeConfig === 'legal') return 'legal';
        return ''; // Para 'both', deixar vazio até detecção
    }

    function setupUnifiedDocumentEvents() {
        // Configurar validação do campo unificado
        const documentInput = document.getElementById('billing_document');
        
        if (documentInput) {
            // Adicionar validação de CPF/CNPJ completo
            documentInput.addEventListener('blur', function() {
                const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                const cleanValue = this.value.replace(/\D/g, '');
                const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                
                // Marcar campo como obrigatório se configurado
                if (personTypeConfig !== 'both' || (detectedType && 
                    ((detectedType === 'cpf' && cleanValue.length === 11) || 
                     (detectedType === 'cnpj' && cleanValue.length === 14)))) {
                    this.setAttribute('required', 'true');
                } else if (personTypeConfig === 'both') {
                    this.removeAttribute('required');
                }
            });
        }
    }

    // Máscaras de formatação
    function applyCpfMask(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    function applyCnpjMask(value) {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    // Função para atualizar dados no Store API com debounce
    function updatePersonTypeData(immediate = false) {
        // Cancelar timeout anterior se existir
        if (updateDataTimeout) {
            clearTimeout(updateDataTimeout);
            updateDataTimeout = null;
        }

        // Se for imediato, executar diretamente
        if (immediate) {
            executeDataUpdate();
            return;
        }

        // Definir novo timeout de 1.5 segundos
        updateDataTimeout = setTimeout(() => {
            executeDataUpdate();
            updateDataTimeout = null;
        }, 1500);
    }

    // Função que efetivamente executa a atualização
    function executeDataUpdate() {
        const personTypeInput = document.getElementById('billing-persontype');
        const cpfInput = document.getElementById('billing-cpf');
        const cnpjInput = document.getElementById('billing-cnpj');

        const data = {
            billing_persontype: personTypeInput ? personTypeInput.value : '',
            billing_cpf: cpfInput ? cpfInput.value : '',
            billing_cnpj: cnpjInput ? cnpjInput.value : ''
        };

        // Usar setExtensionData
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_person_type', data);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_person_type',
                data: data
            });
        }
    }

    // Função para inicializar os campos no Store API
    function initializeStoreAPIPersonTypeFields() {
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch, select } = wp.data;
                
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    
                    if (checkoutDispatch.setExtensionData) {
                        const currentData = select('wc/store/checkout').getExtensionData() || {};
                        const personTypeData = currentData['woo_better_person_type'] || {};
                        
                        // Obter valores iniciais dos dados da página
                        const initialPersonType = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_persontype) ? WooBetterPersonTypeData.billing_persontype : '';
                        const initialCpf = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cpf) ? WooBetterPersonTypeData.billing_cpf : '';
                        const initialCnpj = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cnpj) ? WooBetterPersonTypeData.billing_cnpj : '';
                        
                        // Inicializar os campos se não existirem
                        if (!personTypeData.hasOwnProperty('billing_persontype')) {
                            personTypeData['billing_persontype'] = initialPersonType;
                        }
                        if (!personTypeData.hasOwnProperty('billing_cpf')) {
                            personTypeData['billing_cpf'] = initialCpf;
                        }
                        if (!personTypeData.hasOwnProperty('billing_cnpj')) {
                            personTypeData['billing_cnpj'] = initialCnpj;
                        }
                        
                        checkoutDispatch.setExtensionData('woo_better_person_type', personTypeData);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }
    }

    // Inicializar campos do Store API
    initializeStoreAPIPersonTypeFields();

    // Observar mudanças nos campos e atualizar Store API
    const observerPersonType = new MutationObserver(function(mutations) {
        let hasPersonTypeFieldsChanged = false;
        
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const personTypeInputs = node.querySelectorAll ? 
                            node.querySelectorAll('#billing-persontype, #billing_document, #billing-cpf, #billing-cnpj') : [];
                        
                        if (personTypeInputs.length > 0 || 
                            (node.id && (node.id === 'billing-persontype' || node.id === 'billing_document' || 
                                        node.id === 'billing-cpf' || node.id === 'billing-cnpj'))) {
                            hasPersonTypeFieldsChanged = true;
                        }
                    }
                });
            }
        });
        
        if (hasPersonTypeFieldsChanged) {
            setTimeout(() => {
                updatePersonTypeData(true);
                
                // Adicionar listeners aos campos se ainda não existem
                const personTypeInput = document.getElementById('billing-persontype');
                const documentInput = document.getElementById('billing_document');
                const cpfInput = document.getElementById('billing-cpf');
                const cnpjInput = document.getElementById('billing-cnpj');
                
                if (personTypeInput && !personTypeInput.dataset.storeApiListener) {
                    personTypeInput.addEventListener('change', () => updatePersonTypeData());
                    personTypeInput.dataset.storeApiListener = 'true';
                }
                
                if (documentInput && !documentInput.dataset.storeApiListener) {
                    let lastDocumentValue = documentInput.value; // Armazenar último valor
                    
                    documentInput.addEventListener('input', function() {
                        const cleanValue = this.value.replace(/\D/g, '');
                        const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                        const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                        
                        // Aplicar formatação apropriada
                        let formattedValue = '';
                        if (detectedType === 'cpf') {
                            formattedValue = applyCpfMask(this.value);
                        } else if (detectedType === 'cnpj') {
                            formattedValue = applyCnpjMask(this.value);
                        } else {
                            formattedValue = applyDynamicMask(this.value, personTypeConfig);
                        }
                        
                        this.value = formattedValue;
                        
                        // Só atualizar se o valor realmente mudou
                        if (formattedValue !== lastDocumentValue) {
                            lastDocumentValue = formattedValue;
                            updateHiddenFields(formattedValue, detectedType);
                            updatePersonTypeData();
                            
                            // Validação em tempo real
                            validateDocumentRealTime(formattedValue, personTypeConfig);
                        }
                    });
                    documentInput.dataset.storeApiListener = 'true';
                }
            }, 100);
        }
    });

    observerPersonType.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Configurar listeners iniciais se os campos já existirem
    setTimeout(() => {
                updatePersonTypeData(true);
        const personTypeInput = document.getElementById('billing-persontype');
        const documentInput = document.getElementById('billing_document');
        const cpfInput = document.getElementById('billing-cpf');
        const cnpjInput = document.getElementById('billing-cnpj');
        
        if (personTypeInput && !personTypeInput.dataset.storeApiListener) {
            personTypeInput.addEventListener('change', () => updatePersonTypeData());
            personTypeInput.dataset.storeApiListener = 'true';
        }
        
        if (documentInput && !documentInput.dataset.storeApiListener) {
            let lastDocumentValue = documentInput.value; // Armazenar último valor
            
            documentInput.addEventListener('input', function() {
                const cleanValue = this.value.replace(/\D/g, '');
                const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                
                // Aplicar formatação apropriada
                let formattedValue = '';
                if (detectedType === 'cpf') {
                    formattedValue = applyCpfMask(this.value);
                } else if (detectedType === 'cnpj') {
                    formattedValue = applyCnpjMask(this.value);
                } else {
                    formattedValue = applyDynamicMask(this.value, personTypeConfig);
                }
                
                this.value = formattedValue;
                
                // Só atualizar se o valor realmente mudou
                if (formattedValue !== lastDocumentValue) {
                    lastDocumentValue = formattedValue;
                    updateHiddenFields(formattedValue, detectedType);
                    updatePersonTypeData();
                    
                    // Validação em tempo real
                    validateDocumentRealTime(formattedValue, personTypeConfig);
                }
            });
            documentInput.dataset.storeApiListener = 'true';
        }
    }, 500);
});