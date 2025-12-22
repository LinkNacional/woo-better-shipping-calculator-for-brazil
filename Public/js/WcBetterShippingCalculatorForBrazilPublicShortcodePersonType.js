document.addEventListener("DOMContentLoaded", function () {
    
    function initPersonTypeFields() {
        // Buscar o campo billing_document que já existe no DOM
        const documentInput = document.getElementById('billing_document');
        
        if (documentInput) {
            setupFieldEvents();
        }
        
        // Configurar validação no botão de finalizar pedido
        setupOrderSubmitValidation();
    }

    function setupOrderSubmitValidation() {
        const placeOrderButton = document.getElementById('place_order');
        
        if (placeOrderButton && !placeOrderButton.dataset.validationSetup) {
            placeOrderButton.addEventListener('click', handlePlaceOrderClick);
            placeOrderButton.dataset.validationSetup = 'true';

            function handlePlaceOrderClick(event) {
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

    // Inicializar campos de pessoa
    initPersonTypeFields();

    // Observer para detectar quando o campo billing_document aparece no DOM
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Se o campo billing_document foi adicionado, configurar eventos
                        if (node.id === 'billing_document' || 
                            (node.querySelector && node.querySelector('#billing_document'))) {
                            setTimeout(initPersonTypeFields, 100);
                        }
                        
                        // Se o botão place_order foi adicionado, configurar validação
                        if (node.id === 'place_order' || 
                            (node.querySelector && node.querySelector('#place_order'))) {
                            setTimeout(setupOrderSubmitValidation, 100);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Funções de máscara e utilitários (mantidas para funcionalidade)
    
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

    function updateHiddenFields(documentValue, detectedType) {
        const personTypeInput = document.getElementById('billing_persontype');
        const cpfInput = document.getElementById('billing_cpf');
        const cnpjInput = document.getElementById('billing_cnpj');
        
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
        const fieldContainer = document.getElementById('billing_document_field');
        
        if (fieldContainer) {
            // Remover classe de validado e adicionar classes de erro
            fieldContainer.classList.remove('woocommerce-validated');
            fieldContainer.classList.add('woocommerce-invalid');
            fieldContainer.classList.add('woocommerce-invalid-required-field');
        }
    }

    function hideDocumentValidationError() {
        const fieldContainer = document.getElementById('billing_document_field');
        
        if (fieldContainer) {
            // Remover classes de erro e adicionar classe de validado
            fieldContainer.classList.remove('woocommerce-invalid');
            fieldContainer.classList.remove('woocommerce-invalid-required-field');
            fieldContainer.classList.add('woocommerce-validated');
        }
    }

    // Máscaras de formatação
    function applyCpfMask(value) {
        const cleanValue = value.replace(/\D/g, '');
        return cleanValue
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    function applyCnpjMask(value) {
        const cleanValue = value.replace(/\D/g, '');
        return cleanValue
            .replace(/(\d{2})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1/$2')
            .replace(/(\d{4})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    }

    // Função simples para atualizar campos (sem Store API)
    function updatePersonTypeData() {
        // Para shortcode, apenas garantir que os campos hidden estão atualizados
        // O WooCommerce processará os campos automaticamente no envio
        const personTypeInput = document.getElementById('billing_persontype');
        const cpfInput = document.getElementById('billing_cpf');
        const cnpjInput = document.getElementById('billing_cnpj');
        const documentInput = document.getElementById('billing_document');

        // Trigger jQuery change nos campos para notificar o WooCommerce (como no script de telefone)
        if (typeof jQuery !== 'undefined') {
            if (personTypeInput) jQuery(personTypeInput).trigger('change');
            if (cpfInput) jQuery(cpfInput).trigger('change');
            if (cnpjInput) jQuery(cnpjInput).trigger('change');
            if (documentInput) jQuery(documentInput).trigger('change');
        }
    }

    // Configurar eventos dos campos
    function setupFieldEvents() {
        const documentInput = document.getElementById('billing_document');
        
        if (documentInput && !documentInput.dataset.eventsSetup) {
            documentInput.addEventListener('input', function() {
                const currentValue = this.value;
                const cleanValue = currentValue.replace(/\D/g, '');
                const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
                
                // Aplicar formatação apropriada baseada no tipo detectado
                let formattedValue = '';
                
                if (personTypeConfig === 'physical') {
                    // Apenas CPF
                    formattedValue = applyCpfMask(currentValue);
                } else if (personTypeConfig === 'legal') {
                    // Apenas CNPJ
                    formattedValue = applyCnpjMask(currentValue);
                } else {
                    // Ambos: detectar automaticamente
                    if (cleanValue.length <= 11) {
                        formattedValue = applyCpfMask(currentValue);
                    } else {
                        formattedValue = applyCnpjMask(currentValue);
                    }
                }
                
                // Aplicar o valor formatado
                this.value = formattedValue;
                
                // Detectar tipo do documento baseado no valor atual
                const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                
                // Atualizar campos hidden (se existirem)
                updateHiddenFields(formattedValue, detectedType);
                
                // Trigger jQuery change com delay (como no telefone)
                setTimeout(() => {
                    updatePersonTypeData();
                }, 500);
            });
            documentInput.dataset.eventsSetup = 'true';
        }
    }
});
