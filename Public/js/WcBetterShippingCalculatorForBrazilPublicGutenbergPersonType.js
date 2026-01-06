document.addEventListener("DOMContentLoaded", function () {
    let billingBlockFound = false
    let submitFound = false
    let personTypeEventsBound = false
    let placeOrderButton = null
    let intervalCount = 0
    let checkInterval = null
    let updateDataTimeout = null // Timeout para debounce do salvamento
    let countryObserver = null // Observer para mudanças no campo de país
    let personTypeFieldsActive = false // Flag para controlar se os campos estão ativos

    // Variáveis para salvar dados dos campos
    let savedPersonTypeData = {
        billing_persontype: '0',
        billing_cpf: '',
        billing_cnpj: '',
        billing_document: '', // Campo unificado
        billing_company: ''
    };

    /**
     * Observer para esconder campo shipping-company imediatamente
     */
    const shippingCompanyObserver = new MutationObserver((mutations) => {
        const shippingCompanyInput = document.querySelector('#shipping-company');
        if (shippingCompanyInput) {
            const companyContainer = shippingCompanyInput.closest('.wc-block-components-text-input');
            if (companyContainer) {
                companyContainer.style.padding = '0';
                companyContainer.style.margin = '0';
                companyContainer.style.display = 'none';
            }
        }
    });

    // Inicia observer para shipping-company imediatamente
    shippingCompanyObserver.observe(document.body, { childList: true, subtree: true });

    /**
     * Observer específico para monitorar o container (billing ou shipping) e recriar campos quando necessário
     */
    let containerObserver = null;

    function startContainerObserver(container, containerType) {
        if (containerObserver) {
            containerObserver.disconnect();
        }

        if (!container) {
            return;
        }

        containerObserver = new MutationObserver((mutations) => {
            // Só processar se for Brasil
            if (!isBrazilSelected()) {
                return;
            }

            let shouldCheckFields = false;

            mutations.forEach((mutation) => {
                // Verificar se houve mudanças nos filhos do container
                if (mutation.type === 'childList') {
                    // Se elementos foram adicionados ou removidos, verificar campos
                    if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
                        shouldCheckFields = true;
                    }
                }
            });

            if (shouldCheckFields) {
                setTimeout(() => {
                    const editButton = document.querySelector(`span.wc-block-components-address-card__edit[aria-controls="${containerType}"]`);
                    const documentField = document.getElementById('billing_document');
                    
                    // Se container está expandido mas campos customizados não existem, recriar
                    if (editButton && editButton.getAttribute('aria-expanded') === 'true' && !documentField) {
                        const currentContainer = document.querySelector(`#${containerType}`);
                        if (currentContainer) {
                            // Resetar flag para permitir recriação
                            personTypeFieldsActive = false;
                            billingBlockFound = false;
                            
                            // Recriar campos
                            handlePersonTypeContainer(currentContainer, containerType);
                            
                            // Sincronizar campos após recriação
                            setTimeout(() => {
                                const documentInput = document.getElementById('billing_document');
                                if (documentInput && documentInput.value) {
                                    const cleanValue = documentInput.value.replace(/\D/g, '');
                                    const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                                    const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                                    updateHiddenFields(documentInput.value, detectedType);
                                    updatePersonTypeData(true);
                                }
                            }, 400);
                        }
                    }
                }, 200);
            }
        });

        containerObserver.observe(container, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }

    // Manter função original para compatibilidade
    function startBillingBlockObserver() {
        const billingBlock = document.querySelector('#billing');
        if (billingBlock) {
            startContainerObserver(billingBlock, 'billing');
        }
    }

    /**
     * Valida CPF usando algoritmo matemático
     * @param {string} cpf - CPF apenas com números
     * @returns {boolean}
     */
    function validateCPF(cpf) {
        // Remove caracteres não numéricos
        cpf = cpf.replace(/[^0-9]/g, '');
        
        // Verifica se tem 11 dígitos
        if (cpf.length !== 11) {
            return false;
        }
        
        // Verifica sequências inválidas (111.111.111-11, 222.222.222-22, etc.)
        if (/^(\d)\1{10}$/.test(cpf)) {
            return false;
        }
        
        // Calcula primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf[i]) * (10 - i);
        }
        let firstDigit = 11 - (sum % 11);
        if (firstDigit >= 10) {
            firstDigit = 0;
        }
        
        // Verifica primeiro dígito
        if (parseInt(cpf[9]) !== firstDigit) {
            return false;
        }
        
        // Calcula segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf[i]) * (11 - i);
        }
        let secondDigit = 11 - (sum % 11);
        if (secondDigit >= 10) {
            secondDigit = 0;
        }
        
        // Verifica segundo dígito
        return parseInt(cpf[10]) === secondDigit;
    }

    /**
     * Valida CNPJ usando algoritmo matemático
     * @param {string} cnpj - CNPJ apenas com números
     * @returns {boolean}
     */
    function validateCNPJ(cnpj) {
        // Remove caracteres não numéricos
        cnpj = cnpj.replace(/[^0-9]/g, '');
        
        // Verifica se tem 14 dígitos
        if (cnpj.length !== 14) {
            return false;
        }
        
        // Verifica sequências inválidas (11.111.111/0001-11, 22.222.222/0001-22, etc.)
        if (/^(\d)\1{13}$/.test(cnpj)) {
            return false;
        }
        
        // Pesos para o cálculo dos dígitos verificadores
        const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        
        // Calcula primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 12; i++) {
            sum += parseInt(cnpj[i]) * weights1[i];
        }
        let firstDigit = sum % 11;
        firstDigit = firstDigit < 2 ? 0 : 11 - firstDigit;
        
        // Verifica primeiro dígito
        if (parseInt(cnpj[12]) !== firstDigit) {
            return false;
        }
        
        // Calcula segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 13; i++) {
            sum += parseInt(cnpj[i]) * weights2[i];
        }
        let secondDigit = sum % 11;
        secondDigit = secondDigit < 2 ? 0 : 11 - secondDigit;
        
        // Verifica segundo dígito
        return parseInt(cnpj[13]) === secondDigit;
    }

    /**
     * Valida documento (CPF ou CNPJ) baseado no tamanho
     * @param {string} document - Documento com ou sem formatação
     * @returns {object} - {isValid: boolean, type: 'cpf'|'cnpj'|null, message: string}
     */
    function validateDocument(document) {
        const cleanDoc = document.replace(/[^0-9]/g, '');
        
        if (cleanDoc.length === 11) {
            const isValidCPF = validateCPF(cleanDoc);
            return {
                isValid: isValidCPF,
                type: 'cpf',
                message: isValidCPF ? '' : 'CPF inválido. Verifique os números informados.'
            };
        } else if (cleanDoc.length === 14) {
            const isValidCNPJ = validateCNPJ(cleanDoc);
            return {
                isValid: isValidCNPJ,
                type: 'cnpj',
                message: isValidCNPJ ? '' : 'CNPJ inválido. Verifique os números informados.'
            };
        } else {
            return {
                isValid: false,
                type: null,
                message: 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).'
            };
        }
    }

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

    // Função para verificar se o país selecionado é Brasil
    function isBrazilSelected() {
        const countryField = document.querySelector('#billing-country') ||
                           document.querySelector('#shipping-country') ||
                           document.querySelector('select[name="billing_country"]') ||
                           document.querySelector('select[name="shipping_country"]') ||
                           document.querySelector('input[name="billing_country"]') ||
                           document.querySelector('input[name="shipping_country"]');
        
        if (countryField) {
            return countryField.value === 'BR';
        }
        return false;
    }

    // Função para remover campos de person type
    function removePersonTypeFields() {
        const documentField = document.querySelector('.wc-better-billing-document');
        const companyField = document.querySelector('.wc-better-billing-company');
        const personTypeInput = document.getElementById('billing-persontype');
        const cpfInput = document.getElementById('billing-cpf');
        const cnpjInput = document.getElementById('billing-cnpj');
        
        if (documentField) {
            documentField.remove();
        }
        if (companyField) {
            companyField.remove();
        }
        if (personTypeInput) {
            personTypeInput.remove();
        }
        if (cpfInput) {
            cpfInput.remove();
        }
        if (cnpjInput) {
            cnpjInput.remove();
        }
        
        personTypeFieldsActive = false;
        billingBlockFound = false;
        
        // Desconectar observer específico do container
        if (containerObserver) {
            containerObserver.disconnect();
            containerObserver = null;
        }
        
        // Manter compatibilidade com observer antigo
        if (billingBlockObserver) {
            billingBlockObserver.disconnect();
            billingBlockObserver = null;
        }
        
        // Limpar dados do Store API
        clearPersonTypeDataFromStore();
    }

    // Função para limpar dados do Store API
    function clearPersonTypeDataFromStore() {
        const emptyData = {
            billing_persontype: '0',
            billing_cpf: '',
            billing_cnpj: '',
            billing_company: ''
        };

        // Usar setExtensionData
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_person_type', emptyData);
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
                data: emptyData
            });
        }
    }

    const observer = new MutationObserver((mutationsList) => {
        // Verificar se o país é Brasil antes de processar qualquer lógica
        if (!isBrazilSelected()) {
            // Se não for Brasil e temos campos ativos, removê-los
            if (personTypeFieldsActive) {
                removePersonTypeFields();
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
            intervalCount = 0
            personTypeFieldsActive = false
        }

        if (targetContainer && !billingBlockFound) {
            handlePersonTypeContainer(targetContainer, containerType)
        }

        // Verificar se os campos customizados ainda existem quando container existe
        if (targetContainer && billingBlockFound) {
            const documentField = document.getElementById('billing_document');
            const editButton = document.querySelector(`span.wc-block-components-address-card__edit[aria-controls="${containerType}"]`);
            
            // Se o container existe, está expandido, mas nossos campos não existem, recriar
            if (editButton && editButton.getAttribute('aria-expanded') === 'true' && !documentField) {
                // Resetar flags para permitir recriação
                personTypeFieldsActive = false;
                billingBlockFound = false;
                
                setTimeout(() => {
                    handlePersonTypeContainer(targetContainer, containerType);
                }, 100);
            }
        }

        // Detectar se o container foi completamente recriado (nova instância)
        if (targetContainer && billingBlockFound && personTypeFieldsActive) {
            const currentLastName = targetContainer.querySelector(`#${containerType}-last_name`);
            const documentField = document.getElementById('billing_document');
            
            // Se existe last_name mas não existe nosso campo customizado
            if (currentLastName && !documentField) {
                const editButton = document.querySelector(`span.wc-block-components-address-card__edit[aria-controls="${containerType}"]`);
                
                if (editButton && editButton.getAttribute('aria-expanded') === 'true') {
                    // O container foi recriado, precisamos recriar nossos campos
                    personTypeFieldsActive = false;
                    setTimeout(() => {
                        addPersonTypeFields(targetContainer, containerType);
                        startBillingBlockObserver(); // Reiniciar observer específico
                    }, 200);
                }
            }
        }

        // Observar mudanças no checkbox de mesmo endereço
        const sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]');
        if (sameAddressCheckbox && !sameAddressCheckbox.dataset.personTypeListener) {
            sameAddressCheckbox.addEventListener('change', function() {
                setTimeout(() => {
                    if (personTypeFieldsActive) {
                        // Remover campos do container atual
                        removePersonTypeFields();
                        
                        // Recriar nos container apropriado
                        const newUseSameAddress = isUsingSameAddressForBilling();
                        const newTargetContainer = newUseSameAddress ? document.querySelector('#shipping') : document.querySelector('#billing');
                        const newContainerType = newUseSameAddress ? 'shipping' : 'billing';
                        
                        if (newTargetContainer) {
                            handlePersonTypeContainer(newTargetContainer, newContainerType);
                        }
                    }
                }, 300);
            });
            sameAddressCheckbox.dataset.personTypeListener = 'true';
        }

        // Observar mudanças no campo de país
        const countryField = document.querySelector('#billing-country') || document.querySelector('#shipping-country');
        if (countryField && !countryObserver) {
            observeCountryChanges();
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
                    // Só validar se o país for Brasil
                    if (!isBrazilSelected()) {
                        return;
                    }

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
                                    // Validação matemática do CPF
                                    const validation = validateDocument(cleanValue);
                                    if (validation.isValid && validation.type === 'cpf') {
                                        isValid = true;
                                    } else {
                                        errorMessage = validation.message || 'CPF inválido.';
                                    }
                                } else {
                                    errorMessage = 'Por favor, insira um CPF válido com 11 dígitos.';
                                }
                            } else if (personTypeConfig === 'legal') {
                                // Apenas CNPJ permitido
                                if (cleanValue.length === 14) {
                                    // Validação matemática do CNPJ
                                    const validation = validateDocument(cleanValue);
                                    if (validation.isValid && validation.type === 'cnpj') {
                                        isValid = true;
                                    } else {
                                        errorMessage = validation.message || 'CNPJ inválido.';
                                    }
                                } else {
                                    errorMessage = 'Por favor, insira um CNPJ válido com 14 dígitos.';
                                }
                            } else if (personTypeConfig === 'both') {
                                // CPF ou CNPJ permitidos
                                if (cleanValue.length === 11 || cleanValue.length === 14) {
                                    // Validação matemática do documento
                                    const validation = validateDocument(cleanValue);
                                    if (validation.isValid) {
                                        isValid = true;
                                    } else {
                                        errorMessage = validation.message || 'Documento inválido.';
                                    }
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

                    // Validação do campo de empresa para CNPJ
                    const companyInput = document.getElementById('billing-company');
                    let companyContainer = document.querySelector('.wc-better-billing-company');
                    
                    // Se não encontrou nosso container, procurar o nativo
                    if (!companyContainer && companyInput) {
                        companyContainer = companyInput.closest('.wc-block-components-text-input') || 
                                          companyInput.closest('.wc-better-company-controlled') || 
                                          companyInput.parentElement;
                    }
                    
                    if (companyInput && companyContainer && companyContainer.style.display === 'block') {
                        // Campo company está visível, validar se está preenchido para CNPJ
                        const companyValue = companyInput.value.trim();
                        
                        if (!companyValue) {
                            event.stopPropagation();
                            event.preventDefault();
                            
                            // Destacar o campo como obrigatório
                            companyContainer.classList.add('has-error');
                            if (companyInput.style) {
                                companyInput.style.borderColor = '#d63638';
                            }
                            companyInput.setAttribute('aria-invalid', 'true');
                            
                            // Mostrar mensagem de erro
                            showCompanyValidationError('Este campo é obrigatório.');
                            
                            // Scroll para o campo
                            companyInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            
                            // Focar no campo após o scroll
                            setTimeout(() => {
                                companyInput.focus();
                            }, 300);
                            return;
                        } else {
                            // Se está preenchido, remover erro
                            companyContainer.classList.remove('has-error');
                            if (companyInput.style) {
                                companyInput.style.borderColor = '';
                            }
                            companyInput.setAttribute('aria-invalid', 'false');
                            hideCompanyValidationError();
                        }
                    }
                }
            }
        }
    });

    // Configuração do observer para observar mudanças no corpo do documento
    observer.observe(document.body, { childList: true, subtree: true });

    function handlePersonTypeContainer(container, containerType) {
        // Só processar se o país for Brasil
        if (!isBrazilSelected()) {
            return;
        }

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
                addPersonTypeFields(container, containerType);
            }, 300);

            billingBlockFound = true
            
            // Iniciar observer específico para o container
            startContainerObserver(container, containerType);
        }
    }

    function billingPersonTypeHandle(billingBlock) {
        return handlePersonTypeContainer(billingBlock, 'billing');
    }

    function addPersonTypeFields(container, containerType = 'billing') {
        // Só adicionar campos se o país for Brasil
        if (!isBrazilSelected()) {
            return;
        }

        // Verificar se os campos já existem
        if (document.getElementById('billing_document')) {
            return;
        }

        const lastNameField = container.querySelector(`#${containerType}-last_name`);
        
        if (!lastNameField) {
            return;
        }

        // Obter valores iniciais dos dados da página
        let initialPersonType = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_persontype) ? WooBetterPersonTypeData.billing_persontype : '0';
        let initialCpf = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cpf) ? WooBetterPersonTypeData.billing_cpf : '';
        let initialCnpj = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cnpj) ? WooBetterPersonTypeData.billing_cnpj : '';
        let initialCompany = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_company) ? WooBetterPersonTypeData.billing_company : '';
        let initialDocument = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_document) ? WooBetterPersonTypeData.billing_document : '';

        // Usar valores salvos se existirem (prioridade sobre dados iniciais)
        if (savedPersonTypeData.billing_document) {
            // Se temos dados salvos, usar eles
            initialPersonType = savedPersonTypeData.billing_persontype;
            initialCpf = savedPersonTypeData.billing_cpf;
            initialCnpj = savedPersonTypeData.billing_cnpj;
            initialCompany = savedPersonTypeData.billing_company;
        } else {
            // Se não temos dados salvos, salvar os dados iniciais
            savedPersonTypeData.billing_persontype = initialPersonType;
            savedPersonTypeData.billing_cpf = initialCpf;
            savedPersonTypeData.billing_cnpj = initialCnpj;
            savedPersonTypeData.billing_company = initialCompany;
            
            // Construir billing_document baseado no person type
            if (initialDocument) {
                // Se já vem do PHP, usar ele
                savedPersonTypeData.billing_document = initialDocument;
            } else if (initialPersonType === '1' && initialCpf) {
                savedPersonTypeData.billing_document = initialCpf;
            } else if (initialPersonType === '2' && initialCnpj) {
                savedPersonTypeData.billing_document = initialCnpj;
            } else if (initialCpf) {
                savedPersonTypeData.billing_document = initialCpf;
            } else if (initialCnpj) {
                savedPersonTypeData.billing_document = initialCnpj;
            }
        }

        // Obter configuração do tipo de pessoa
        const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
        const showSelect = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.show_select : true;

        let lastInsertedElement = lastNameField.parentElement; // Começar da div pai do last_name

        // Determinar valor inicial do documento (usar dados salvos ou dados do PHP)
        initialDocument = initialDocument || savedPersonTypeData.billing_document || '';
        let detectedPersonType = savedPersonTypeData.billing_persontype || '0';
        
        if (!detectedPersonType || detectedPersonType === '0') {
            if (initialCpf) {
                initialDocument = initialCpf;
                detectedPersonType = '1';
            } else if (initialCnpj) {
                initialDocument = initialCnpj;
                detectedPersonType = '2';
            }
        }

        // Criar o campo unificado CPF/CNPJ primeiro
        createUnifiedDocumentField(lastInsertedElement, initialDocument, personTypeConfig);
        
        // Atualizar lastInsertedElement para apontar para o campo CPF/CNPJ recém criado
        const documentFieldContainer = document.querySelector('.wc-better-billing-document');
        if (documentFieldContainer) {
            lastInsertedElement = documentFieldContainer;
        }

        // Criar o campo company depois do CPF/CNPJ (fica inicialmente oculto)
        const companyFieldContainer = createCompanyField(lastInsertedElement, initialCompany, personTypeConfig);
        if (companyFieldContainer) {
            lastInsertedElement = companyFieldContainer;
        }

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

        // Marcar campos como ativos
        personTypeFieldsActive = true;

        // Se temos valor salvo, executar evento de input para sincronizar
        if (initialDocument) {
            setTimeout(() => {
                const documentInput = document.getElementById('billing_document');
                if (documentInput) {
                    // Executar evento de input para manter sincronização
                    const inputEvent = new Event('input', { bubbles: true });
                    documentInput.dispatchEvent(inputEvent);
                    
                    // Garantir que a detecção de tipo seja executada
                    const cleanValue = documentInput.value.replace(/\D/g, '');
                    const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                    updateHiddenFields(documentInput.value, detectedType);
                }
            }, 100);
        }

        // Forçar sincronização inicial independente do valor
        setTimeout(() => {
            const documentInput = document.getElementById('billing_document');
            if (documentInput && documentInput.value) {
                const cleanValue = documentInput.value.replace(/\D/g, '');
                const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                updateHiddenFields(documentInput.value, detectedType);
                
                // Atualizar dados após sincronização
                updatePersonTypeData(true);
            } else {
                // Mesmo sem valor, atualizar dados para limpar estado anterior
                updatePersonTypeData(true);
            }
        }, 200);

        // Atualizar dados imediatamente
        updatePersonTypeData(true);
    }

    // Função para observar mudanças no campo de país
    function observeCountryChanges() {
        const billingCountryField = document.querySelector('#billing-country');
        const shippingCountryField = document.querySelector('#shipping-country');
        
        // Configurar listener para billing country
        if (billingCountryField && !billingCountryField.dataset.personTypeListener) {
            billingCountryField.addEventListener('change', function() {
                setTimeout(() => {
                    handleCountryChange();
                }, 300);
            });
            billingCountryField.dataset.personTypeListener = 'true';
        }
        
        // Configurar listener para shipping country
        if (shippingCountryField && !shippingCountryField.dataset.personTypeListener) {
            shippingCountryField.addEventListener('change', function() {
                setTimeout(() => {
                    handleCountryChange();
                }, 300);
            });
            shippingCountryField.dataset.personTypeListener = 'true';
        }

        // Função unificada para lidar com mudanças de país
        function handleCountryChange() {
            if (isBrazilSelected()) {
                // Se mudou para Brasil e não temos campos, criar
                if (!personTypeFieldsActive) {
                    const useSameAddress = isUsingSameAddressForBilling();
                    const targetContainer = useSameAddress ? 
                        document.querySelector('#shipping') : 
                        document.querySelector('#billing');
                    const containerType = useSameAddress ? 'shipping' : 'billing';
                    
                    if (targetContainer) {
                        handlePersonTypeContainer(targetContainer, containerType);
                    }
                }
            } else {
                // Se mudou para outro país, remover campos
                if (personTypeFieldsActive) {
                    removePersonTypeFields();
                }
            }
        }

        // Criar observer específico para mudanças nos campos de país
        if (!countryObserver) {
            countryObserver = new MutationObserver(function(mutations) {
                mutations.forEach(function(mutation) {
                    if (mutation.type === 'childList' || mutation.type === 'attributes') {
                        // Re-configurar listeners se os campos foram recriados
                        setTimeout(() => {
                            const newBillingCountryField = document.querySelector('#billing-country');
                            const newShippingCountryField = document.querySelector('#shipping-country');
                            
                            if (newBillingCountryField && !newBillingCountryField.dataset.personTypeListener) {
                                newBillingCountryField.addEventListener('change', function() {
                                    setTimeout(() => {
                                        handleCountryChange();
                                    }, 300);
                                });
                                newBillingCountryField.dataset.personTypeListener = 'true';
                            }
                            
                            if (newShippingCountryField && !newShippingCountryField.dataset.personTypeListener) {
                                newShippingCountryField.addEventListener('change', function() {
                                    setTimeout(() => {
                                        handleCountryChange();
                                    }, 300);
                                });
                                newShippingCountryField.dataset.personTypeListener = 'true';
                            }
                        }, 100);
                    }
                });
            });
            
            // Observar mudanças nos containers de billing e shipping
            const billingContainer = document.querySelector('#billing');
            const shippingContainer = document.querySelector('#shipping');
            
            if (billingContainer) {
                countryObserver.observe(billingContainer, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });
            }
            
            if (shippingContainer) {
                countryObserver.observe(shippingContainer, {
                    childList: true,
                    subtree: true,
                    attributes: true
                });
            }
        }
    }

    // Função para disparar eventos nativos em campos controlados pelo React/WooCommerce
    function setNativeValue(element, value) {
        if (!element) return;
        
        // Usar o setter nativo do HTMLInputElement
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(element, value);
        
        // Disparar evento input
        const inputEvent = new Event('input', { bubbles: true });
        element.dispatchEvent(inputEvent);
    }

    function createCompanyField(insertAfter, initialValue, personTypeConfig) {
        // Só processar se config permitir pessoa jurídica
        if (personTypeConfig === 'physical') {
            return;
        }

        // Verificar se já existe um campo billing-company nativo e removê-lo
        const existingCompanyInput = document.getElementById('billing-company');
        const existingCompanyContainer = existingCompanyInput ? existingCompanyInput.closest('.wc-block-components-text-input') : null;
        
        if (existingCompanyInput && existingCompanyContainer) {
            // Salvar o valor do campo existente se não temos um valor inicial
            if (!initialValue && existingCompanyInput.value) {
                initialValue = existingCompanyInput.value;
            }
            // Remover o campo existente para substituí-lo pelo nosso personalizado
            existingCompanyContainer.remove();
        }
        
        // Verificar se já criamos nosso próprio campo
        if (document.querySelector('.wc-better-billing-company')) {
            return document.querySelector('.wc-better-billing-company');
        }

        // Criar nosso próprio campo se não existir nenhum
        const fieldContainer = document.createElement('div');
        fieldContainer.className = 'wc-block-components-text-input wc-block-components-address-form__company wc-better-billing-company';
        
        // Verificar se deve mostrar inicialmente (se há CNPJ completo nos dados)
        const initialCnpj = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cnpj) ? WooBetterPersonTypeData.billing_cnpj : '';
        const initialDocument = savedPersonTypeData.billing_document || '';
        
        let shouldShowInitially = false;
        if (initialCnpj) {
            const cleanCnpj = initialCnpj.replace(/\D/g, '');
            if (cleanCnpj.length === 14) {
                shouldShowInitially = true;
            }
        }
        if (initialDocument && !shouldShowInitially) {
            const cleanDocument = initialDocument.replace(/\D/g, '');
            if (cleanDocument.length === 14) {
                shouldShowInitially = true;
            }
        }
        
        fieldContainer.style.display = shouldShowInitially ? 'block' : 'none';
        fieldContainer.style.borderColor = ''; // Para controle de erro visual

        const input = document.createElement('input');
        input.type = 'text';
        input.id = 'billing-company';
        input.name = 'billing_company';
        input.setAttribute('autocomplete', 'organization');
        input.setAttribute('aria-label', 'Nome da Empresa');
        input.setAttribute('aria-invalid', 'false');
        input.setAttribute('autocapitalize', 'words');
        input.value = initialValue;
        input.style.borderColor = ''; // Para controle de erro visual

        // Aplicar is-active apenas se o campo tem valor e está visível
        if (shouldShowInitially && input.value && input.value.trim()) {
            fieldContainer.classList.add('is-active');
        }

        const label = document.createElement('label');
        label.setAttribute('for', 'billing-company');
        label.textContent = 'Nome da Empresa';

        fieldContainer.appendChild(input);
        fieldContainer.appendChild(label);

        // Criar div de erro (inicialmente oculta)
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wc-block-components-validation-error wc-better-company-error';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.style.display = 'none';

        const errorParagraph = document.createElement('p');
        errorParagraph.id = 'validate-error-billing-company';

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
        errorMessage.textContent = 'Este campo é obrigatório.';

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
            if (!input.value || !input.value.trim()) {
                fieldContainer.classList.remove('is-active');
                
                // Se o campo está visível e vazio, exibir erro
                if (fieldContainer.style.display === 'block') {
                    showCompanyValidationError('Este campo é obrigatório.');
                    fieldContainer.classList.add('has-error');
                    if (input.style) {
                        input.style.borderColor = '#d63638';
                    }
                    input.setAttribute('aria-invalid', 'true');
                }
            } else {
                // Se tem conteúdo, remover erro
                hideCompanyValidationError();
                fieldContainer.classList.remove('has-error');
                if (input.style) {
                    input.style.borderColor = '';
                }
                input.setAttribute('aria-invalid', 'false');
            }
        });

        input.addEventListener('input', () => {
            savedPersonTypeData.billing_company = input.value;
            
            // Verificar se existe documento preenchido e forçar sincronização
            const documentInput = document.getElementById('billing_document');
            if (documentInput && documentInput.value) {
                const cleanValue = documentInput.value.replace(/\D/g, '');
                const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                updateHiddenFields(documentInput.value, detectedType);
            }
            
            updatePersonTypeData();
            
            // Apenas adicionar is-active quando há conteúdo, não remover
            if (input.value && input.value.trim()) {
                fieldContainer.classList.add('is-active');
            }
            
            // Esconder erro quando começar a digitar
            if (input.value && input.value.trim()) {
                hideCompanyValidationError();
                fieldContainer.classList.remove('has-error');
                if (input.style) {
                    input.style.borderColor = '';
                }
                input.setAttribute('aria-invalid', 'false');
            }
            
            // Remover estilo de erro quando começar a digitar
            fieldContainer.classList.remove('has-error');
            input.style.borderColor = '';
            input.setAttribute('aria-invalid', 'false');
        });

        insertAfter.insertAdjacentElement('afterend', fieldContainer);
        return fieldContainer;
    }

    function setupExistingCompanyField(input, container, initialValue) {
        // Aplicar valor inicial se fornecido e campo estiver vazio
        if (initialValue && !input.value) {
            setNativeValue(input, initialValue);
            if (container.classList) {
                container.classList.add('is-active');
            }
        }

        // Verificar se deve mostrar inicialmente (se há CNPJ completo nos dados)
        const initialCnpj = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cnpj) ? WooBetterPersonTypeData.billing_cnpj : '';
        const initialDocument = savedPersonTypeData.billing_document || '';
        
        // Verificar se há CNPJ completo inicial
        let shouldShowInitially = false;
        if (initialCnpj) {
            const cleanCnpj = initialCnpj.replace(/\D/g, '');
            if (cleanCnpj.length === 14) {
                shouldShowInitially = true;
            }
        }
        if (initialDocument && !shouldShowInitially) {
            const cleanDocument = initialDocument.replace(/\D/g, '');
            if (cleanDocument.length === 14) {
                shouldShowInitially = true;
            }
        }
        
        if (shouldShowInitially) {
            container.style.display = 'block';
            // Aplicar is-active apenas se o campo tem valor
            if (input.value && input.value.trim()) {
                container.classList.add('is-active');
            }
        } else {
            container.style.display = 'none';
        }

        // Adicionar classe identificadora
        if (container.classList) {
            container.classList.add('wc-better-company-controlled');
        }
        
        // Verificar se já existe div de erro, se não, criar
        let existingErrorDiv = container.querySelector('.wc-better-company-error');
        if (!existingErrorDiv) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'wc-block-components-validation-error wc-better-company-error';
            errorDiv.setAttribute('role', 'alert');
            errorDiv.style.display = 'none';

            const errorParagraph = document.createElement('p');
            errorParagraph.id = 'validate-error-billing-company';

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
            errorMessage.textContent = 'Este campo é obrigatório.';

            errorParagraph.appendChild(errorSvg);
            errorParagraph.appendChild(errorMessage);
            errorDiv.appendChild(errorParagraph);
            container.appendChild(errorDiv);
        }

        // Adicionar evento de input se ainda não tem
        if (!input.dataset.betterListener) {
            input.addEventListener('input', () => {
                savedPersonTypeData.billing_company = input.value;
                
                // Verificar se existe documento preenchido e forçar sincronização
                const documentInput = document.getElementById('billing_document');
                if (documentInput && documentInput.value) {
                    const cleanValue = documentInput.value.replace(/\D/g, '');
                    const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                    const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                    updateHiddenFields(documentInput.value, detectedType);
                }
                
                updatePersonTypeData();
                
                // Apenas adicionar is-active quando há conteúdo, não remover
                if (input.value && input.value.trim()) {
                    container.classList.add('is-active');
                }
                
                // Remover estilo de erro quando começar a digitar
                if (input.value && input.value.trim()) {
                    hideCompanyValidationError();
                    container.classList.remove('has-error');
                    if (input.style) {
                        input.style.borderColor = '';
                    }
                    input.setAttribute('aria-invalid', 'false');
                }
            });
            
            input.addEventListener('blur', () => {
                if (!input.value || !input.value.trim()) {
                    container.classList.remove('is-active');
                }
            });
            
            input.dataset.betterListener = 'true';
        }
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
            
            // Salvar na variável global
            savedPersonTypeData.billing_document = formattedValue;
            
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
        
        // Buscar campo company (tanto nosso quanto nativo)
        const companyInput = document.getElementById('billing-company');
        let companyFieldContainer = document.querySelector('.wc-better-billing-company');
        
        // Se não encontrou nosso container, procurar o nativo
        if (!companyFieldContainer && companyInput) {
            companyFieldContainer = companyInput.closest('.wc-block-components-text-input') || 
                                   companyInput.closest('.wc-better-company-controlled') || 
                                   companyInput.parentElement;
        }
        
        // Lógica para controlar visibilidade do campo company
        const cleanValue = documentValue.replace(/\D/g, '');
        const isCnpjComplete = cleanValue.length === 14;
        
        // Controlar visibilidade do campo company
        if (companyFieldContainer && companyInput) {
            if (isCnpjComplete) {
                companyFieldContainer.style.display = 'block';
                // Se o campo tem valor salvo, aplicá-lo
                if (savedPersonTypeData.billing_company && !companyInput.value) {
                    setNativeValue(companyInput, savedPersonTypeData.billing_company);
                }
                // Aplicar is-active apenas se o campo tem valor
                if (companyInput.value && companyInput.value.trim()) {
                    companyFieldContainer.classList.add('is-active');
                } else {
                    companyFieldContainer.classList.remove('is-active');
                }
            } else {
                companyFieldContainer.style.display = 'none';
                // Não limpar o campo, apenas esconder para manter flexibilidade
                companyFieldContainer.classList.remove('is-active');
                // Remover qualquer erro visual
                companyFieldContainer.classList.remove('has-error');
                if (companyInput.style) {
                    companyInput.style.borderColor = '';
                }
                companyInput.setAttribute('aria-invalid', 'false');
            }
        }
        
        if (detectedType === 'cpf') {
            if (personTypeInput) personTypeInput.value = '1';
            if (cpfInput) cpfInput.value = documentValue;
            if (cnpjInput) cnpjInput.value = '';
            
            // Salvar na variável global
            savedPersonTypeData.billing_persontype = '1';
            savedPersonTypeData.billing_cpf = documentValue;
            savedPersonTypeData.billing_cnpj = '';
        } else if (detectedType === 'cnpj') {
            if (personTypeInput) personTypeInput.value = '2';
            if (cpfInput) cpfInput.value = '';
            if (cnpjInput) cnpjInput.value = documentValue;
            
            // Salvar na variável global
            savedPersonTypeData.billing_persontype = '2';
            savedPersonTypeData.billing_cpf = '';
            savedPersonTypeData.billing_cnpj = documentValue;
        } else {
            // Indeterminado - manter valor no campo apropriado baseado na configuração
            const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
            
            if (personTypeConfig === 'physical') {
                if (personTypeInput) personTypeInput.value = '1';
                if (cpfInput) cpfInput.value = documentValue;
                if (cnpjInput) cnpjInput.value = '';
                
                savedPersonTypeData.billing_persontype = '1';
                savedPersonTypeData.billing_cpf = documentValue;
                savedPersonTypeData.billing_cnpj = '';
            } else if (personTypeConfig === 'legal') {
                if (personTypeInput) personTypeInput.value = '2';
                if (cpfInput) cpfInput.value = '';
                if (cnpjInput) cnpjInput.value = documentValue;
                
                savedPersonTypeData.billing_persontype = '2';
                savedPersonTypeData.billing_cpf = '';
                savedPersonTypeData.billing_cnpj = documentValue;
            } else {
                // Para 'both', decidir baseado no comprimento parcial
                const cleanValue = documentValue.replace(/\D/g, '');
                if (cleanValue.length <= 11) {
                    if (personTypeInput) personTypeInput.value = cleanValue.length === 11 ? '1' : '0';
                    if (cpfInput) cpfInput.value = documentValue;
                    if (cnpjInput) cnpjInput.value = '';
                    
                    savedPersonTypeData.billing_persontype = cleanValue.length === 11 ? '1' : '0';
                    savedPersonTypeData.billing_cpf = documentValue;
                    savedPersonTypeData.billing_cnpj = '';
                } else {
                    if (personTypeInput) personTypeInput.value = cleanValue.length === 14 ? '2' : '0';
                    if (cpfInput) cpfInput.value = '';
                    if (cnpjInput) cnpjInput.value = documentValue;
                    
                    savedPersonTypeData.billing_persontype = cleanValue.length === 14 ? '2' : '0';
                    savedPersonTypeData.billing_cpf = '';
                    savedPersonTypeData.billing_cnpj = documentValue;
                }
            }
        }
        
        // Sempre atualizar o document salvo
        savedPersonTypeData.billing_document = documentValue;
    }

    function showCompanyValidationError(message) {
        const errorDiv = document.querySelector('.wc-better-company-error');
        const fieldContainer = document.querySelector('.wc-better-billing-company') || 
                              document.querySelector('.wc-better-company-controlled');
        
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

    function hideCompanyValidationError() {
        const errorDiv = document.querySelector('.wc-better-company-error');
        const fieldContainer = document.querySelector('.wc-better-billing-company') ||
                              document.querySelector('.wc-better-company-controlled');
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // Remover classe de erro do container
        if (fieldContainer) {
            fieldContainer.classList.remove('has-error');
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
        if (personTypeConfig === 'physical') return '1';
        if (personTypeConfig === 'legal') return '2';
        return '0'; // Para 'both', deixar vazio até detecção
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
        // Só atualizar se o país for Brasil
        if (!isBrazilSelected()) {
            return;
        }

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
        // Só executar se o país for Brasil
        if (!isBrazilSelected()) {
            return;
        }

        const personTypeInput = document.getElementById('billing-persontype');
        const cpfInput = document.getElementById('billing-cpf');
        const cnpjInput = document.getElementById('billing-cnpj');
        const companyInput = document.getElementById('billing-company');

        const data = {
            billing_persontype: personTypeInput ? personTypeInput.value : '',
            billing_cpf: cpfInput ? cpfInput.value : '',
            billing_cnpj: cnpjInput ? cnpjInput.value : '',
            billing_company: companyInput ? companyInput.value : ''
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
        // Só inicializar se o país for Brasil
        if (!isBrazilSelected()) {
            return;
        }

        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch, select } = wp.data;
                
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    
                    if (checkoutDispatch.setExtensionData) {
                        const currentData = select('wc/store/checkout').getExtensionData() || {};
                        const personTypeData = currentData['woo_better_person_type'] || {};
                        
                        // Obter valores iniciais dos dados da página
                        const initialPersonType = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_persontype) ? WooBetterPersonTypeData.billing_persontype : '0';
                        const initialCpf = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cpf) ? WooBetterPersonTypeData.billing_cpf : '';
                        const initialCnpj = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_cnpj) ? WooBetterPersonTypeData.billing_cnpj : '';
                        const initialCompany = (typeof WooBetterPersonTypeData !== 'undefined' && WooBetterPersonTypeData.billing_company) ? WooBetterPersonTypeData.billing_company : '';
                        
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
                        if (!personTypeData.hasOwnProperty('billing_company')) {
                            personTypeData['billing_company'] = initialCompany;
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

    // Configurar listeners iniciais se os campos já existirem e país for Brasil
    setTimeout(() => {
        // Verificar se é Brasil antes de fazer qualquer coisa
        if (isBrazilSelected()) {
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
        }
    }, 500);
});