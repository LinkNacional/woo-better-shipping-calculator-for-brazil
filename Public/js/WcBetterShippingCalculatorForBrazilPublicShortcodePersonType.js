document.addEventListener("DOMContentLoaded", function () {
    
    function initPersonTypeFields() {
        // Buscar o campo billing_document que já existe no DOM
        const documentInput = document.getElementById('billing_document');
        
        if (documentInput) {
            setupFieldEvents();
        }
        
        // Configurar campo de empresa
        setupCompanyField();
        
        // Configurar controle por país
        setupCountryControl();
        
        // Configurar validação no botão de finalizar pedido
        setupOrderSubmitValidation();
    }

    function setupCountryControl() {
        // Aplicar estado inicial baseado no país atual
        const billingCountrySelect = document.getElementById('billing_country');
        if (billingCountrySelect) {
            toggleFieldVisibility(billingCountrySelect.value);
        }

        if (typeof jQuery === 'undefined') {
            return;
        }

        // WooCommerce usa select2 para o dropdown de país.
        // O evento nativo 'change' não dispara no select2 — por isso usamos
        // country_to_state_changing, que o próprio WooCommerce dispara internamente.
        jQuery('body')
            .off('country_to_state_changing.woo_better_person_type')
            .on('country_to_state_changing.woo_better_person_type', function(event, country, wrapper) {
                // Só atua quando é o wrapper de cobrança
                if (wrapper && wrapper.find && wrapper.find('#billing_country').length > 0) {
                    toggleFieldVisibility(country);
                }
            });

        // Fallback delegado: captura mudança direta (sobrevive a re-renderizações do DOM)
        jQuery(document)
            .off('change.woo_better_billing_country', '#billing_country')
            .on('change.woo_better_billing_country', '#billing_country', function() {
                toggleFieldVisibility(jQuery(this).val());
            });
    }

    function toggleFieldVisibility(country) {
        const billingDocumentField = document.getElementById('billing_document_field');
        const documentInput = document.getElementById('billing_document');

        if (!billingDocumentField) {
            return;
        }

        if (country !== 'BR') {
            // Ocultar campo
            billingDocumentField.style.display = 'none';
            billingDocumentField.style.padding = '0px';
            billingDocumentField.style.margin = '0px';
            billingDocumentField.style.height = '0px';
            billingDocumentField.style.overflow = 'hidden';

            // Remover required para o WooCommerce não bloquear o submit
            if (documentInput) {
                documentInput.removeAttribute('required');
            }
            billingDocumentField.classList.remove('validate-required');
            billingDocumentField.classList.add('optional');

            resetDocumentFields();
        } else {
            // Exibir campo
            billingDocumentField.style.display = '';
            billingDocumentField.style.padding = '';
            billingDocumentField.style.margin = '';
            billingDocumentField.style.height = '';
            billingDocumentField.style.overflow = '';

            // Restaurar required se pessoa física/jurídica estiver configurada
            const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined'
                ? WooBetterPersonTypeConfig.person_type : null;
            if (personTypeConfig && personTypeConfig !== 'none') {
                if (documentInput) {
                    documentInput.setAttribute('required', 'required');
                }
                billingDocumentField.classList.add('validate-required');
                billingDocumentField.classList.remove('optional');
            }
        }
    }

    function resetDocumentFields() {
        const documentInput = document.getElementById('billing_document');
        const personTypeInput = document.getElementById('billing_persontype');
        const cpfInput = document.getElementById('billing_cpf');
        const cnpjInput = document.getElementById('billing_cnpj');
        const billingDocumentField = document.getElementById('billing_document_field');
        
        // Resetar valores dos campos
        if (documentInput) {
            documentInput.value = '';
            documentInput.setAttribute('value', '');
        }
        if (personTypeInput) {
            personTypeInput.value = '';
            personTypeInput.setAttribute('value', '');
        }
        if (cpfInput) {
            cpfInput.value = '';
            cpfInput.setAttribute('value', '');
        }
        if (cnpjInput) {
            cnpjInput.value = '';
            cnpjInput.setAttribute('value', '');
        }
        
        // Esconder campo de empresa quando resetar
        hideCompanyField();
        
        // Remover classes de validação e limpar erros
        if (billingDocumentField) {
            billingDocumentField.classList.remove('woocommerce-validated');
            billingDocumentField.classList.remove('woocommerce-invalid');
            billingDocumentField.classList.remove('woocommerce-invalid-required-field');
            
            // Remover qualquer mensagem de erro existente
            const errorElements = billingDocumentField.querySelectorAll('.woocommerce-error, .woocommerce-message');
            errorElements.forEach(el => el.remove());
        }
        
        // Trigger eventos nativos primeiro
        [documentInput, personTypeInput, cpfInput, cnpjInput].forEach(field => {
            if (field) {
                // Dispatch eventos nativos
                field.dispatchEvent(new Event('input', { bubbles: true }));
                field.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
        
        // Trigger jQuery events com delay para garantir que sejam processados
        if (typeof jQuery !== 'undefined') {
            setTimeout(() => {
                if (documentInput) jQuery(documentInput).trigger('input').trigger('change');
                if (personTypeInput) jQuery(personTypeInput).trigger('change');
                if (cpfInput) jQuery(cpfInput).trigger('change');
                if (cnpjInput) jQuery(cnpjInput).trigger('change');
                
                // Trigger eventos do WooCommerce para atualizar totais
                jQuery('body').trigger('update_checkout');
                jQuery('body').trigger('wc_update_cart');
            }, 100);
            
            // Segundo trigger com delay maior para garantir
            setTimeout(() => {
                jQuery('body').trigger('update_checkout');
            }, 300);
        }
    }

    function setupOrderSubmitValidation() {
        const placeOrderButton = document.getElementById('place_order');
        
        if (placeOrderButton && !placeOrderButton.dataset.validationSetup) {
            placeOrderButton.addEventListener('click', handlePlaceOrderClick);
            placeOrderButton.dataset.validationSetup = 'true';

            function handlePlaceOrderClick(event) {
                const billingDocumentInput = document.getElementById('billing_document');

                // Só validar se o campo de documento for necessário (país BR e campo visível)
                if (billingDocumentInput && isDocumentValidationRequired()) {
                    const documentValue = billingDocumentInput.value.trim();
                    const cleanValue = documentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
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
                                errorMessage = 'Por favor, insira um CNPJ válido com 14 caracteres.';
                            }
                        } else if (personTypeConfig === 'both') {
                            // CPF ou CNPJ permitidos
                            if (cleanValue.length === 11 || cleanValue.length === 14) {
                                isValid = true;
                            } else {
                                errorMessage = 'Por favor, insira um CPF completo (11 dígitos) ou CNPJ completo (14 caracteres).';
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
                } else {
                    // Se validação não é necessária (país não é BR), ocultar erro
                    hideDocumentValidationError();
                }
            }
        }
    }

    // Inicializar campos de pessoa
    initPersonTypeFields();

    // Observer para detectar quando os campos aparecem no DOM
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
                        
                        // Se o campo billing_company foi adicionado, configurar eventos
                        if (node.id === 'billing_company' || 
                            (node.querySelector && node.querySelector('#billing_company'))) {
                            setTimeout(setupCompanyField, 100);
                        }
                        
                        // Se o campo billing_country foi adicionado, configurar controle por país
                        if (node.id === 'billing_country' || 
                            (node.querySelector && node.querySelector('#billing_country'))) {
                            setTimeout(setupCountryControl, 100);
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
        
        // CPF é sempre numérico — qualquer letra indica CNPJ alfanumérico (IN RFB 2.229/2024)
        if (/[A-Z]/.test(cleanValue)) {
            return 'cnpj';
        }
        
        // Para configuração 'both', detectar baseado no comprimento
        if (cleanValue.length === 11) {
            return 'cpf'; // CPF completo tem 11 dígitos
        } else if (cleanValue.length > 11) {
            return 'cnpj'; // Mais de 11 caracteres indica CNPJ
        }
        
        return null; // Indeterminado
    }

    function updateHiddenFields(documentValue, detectedType) {
        const personTypeInput = document.getElementById('billing_persontype');
        const cpfInput = document.getElementById('billing_cpf');
        const cnpjInput = document.getElementById('billing_cnpj');
        
        if (detectedType === 'cpf') {
            if (personTypeInput) personTypeInput.value = '1';
            if (cpfInput) cpfInput.value = documentValue;
            if (cnpjInput) cnpjInput.value = '';
            
            // Esconder campo de empresa para CPF
            hideCompanyField();
        } else if (detectedType === 'cnpj') {
            if (personTypeInput) personTypeInput.value = '2';
            if (cpfInput) cpfInput.value = '';
            if (cnpjInput) cnpjInput.value = documentValue;
            
            // Exibir campo de empresa para CNPJ completo
            const cleanValue = documentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
            if (cleanValue.length === 14) {
                showCompanyFieldIfDynamic();
            } else {
                hideCompanyField();
            }
        } else {
            // Indeterminado - manter valor no campo apropriado baseado na configuração
            const personTypeConfig = typeof WooBetterPersonTypeConfig !== 'undefined' ? WooBetterPersonTypeConfig.person_type : 'both';
            
            if (personTypeConfig === 'physical') {
                if (personTypeInput) personTypeInput.value = '1';
                if (cpfInput) cpfInput.value = documentValue;
                if (cnpjInput) cnpjInput.value = '';
                hideCompanyFieldIfDynamic();
            } else if (personTypeConfig === 'legal') {
                if (personTypeInput) personTypeInput.value = '2';
                if (cpfInput) cpfInput.value = '';
                if (cnpjInput) cnpjInput.value = documentValue;
                
                // Para legal, verificar se CNPJ está completo
                const cleanValue = documentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                if (cleanValue.length === 14) {
                    showCompanyFieldIfDynamic();
                } else {
                    hideCompanyField();
                }
            } else {
                // Para 'both', decidir baseado no comprimento parcial
                const cleanValue = documentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                if (cleanValue.length <= 11) {
                    if (cpfInput) cpfInput.value = documentValue;
                    if (cnpjInput) cnpjInput.value = '';
                    hideCompanyFieldIfDynamic();
                } else {
                    if (cpfInput) cpfInput.value = '';
                    if (cnpjInput) cnpjInput.value = documentValue;
                    
                    // Para CNPJ, só exibir campo quando completo (14 dígitos)
                    if (cleanValue.length === 14) {
                        showCompanyFieldIfDynamic();
                    } else {
                        hideCompanyField();
                    }
                }
            }
        }
    }

    function showCompanyFieldIfDynamic() {
        // Verificar se a configuração do campo empresa permite mudanças dinâmicas
        const companyBehavior = typeof WooBetterPersonTypeConfig !== 'undefined' ? 
            WooBetterPersonTypeConfig.company_field_behavior : 'dynamic';
        
        // Só controlar o campo se estiver em modo dinâmico
        if (companyBehavior === 'dynamic') {
            showCompanyField();
        }
        // Se não for dinâmico, não mexe no campo (deixa como está configurado no WooCommerce)
    }

    function hideCompanyFieldIfDynamic() {
        // Verificar se a configuração do campo empresa permite mudanças dinâmicas
        const companyBehavior = typeof WooBetterPersonTypeConfig !== 'undefined' ? 
            WooBetterPersonTypeConfig.company_field_behavior : 'dynamic';
        
        // Só controlar o campo se estiver em modo dinâmico
        if (companyBehavior === 'dynamic') {
            hideCompanyFieldOld();
        }
        // Se não for dinâmico, não mexe no campo (deixa como está configurado no WooCommerce)
    }

    function hideCompanyField() {
        // Verificar se a configuração do campo empresa permite mudanças dinâmicas
        const companyBehavior = typeof WooBetterPersonTypeConfig !== 'undefined' ? 
            WooBetterPersonTypeConfig.company_field_behavior : 'dynamic';
        
        // Só controlar o campo se estiver em modo dinâmico
        if (companyBehavior === 'dynamic') {
            const companyField = document.getElementById('billing_company_field');
            
            if (companyField) {
                companyField.style.display = 'none';
                companyField.style.padding = '0px';
                companyField.style.margin = '0px';
                companyField.style.height = '0px';
                companyField.style.overflow = 'hidden';
                
                // Definir valor específico apenas se campo estiver vazio
                const companyInput = document.getElementById('billing_company');
                if (companyInput) {
                    const currentValue = companyInput.value.trim();
                    if (!currentValue) {
                        companyInput.value = 'woonomedaempresa';
                    }
                    // Se já tem valor, não mexe nele
                }
                
                // Remover classes de erro se existirem
                companyField.classList.remove('woocommerce-invalid');
                companyField.classList.remove('woocommerce-invalid-required-field');
            }
        }
        // Se não for dinâmico, não mexe no campo (deixa como está configurado no WooCommerce)
    }

    function hideCompanyFieldOld() {
        const companyField = document.getElementById('billing_company_field');
        
        if (companyField) {
            companyField.style.display = 'none';
            companyField.style.padding = '0px';
            companyField.style.margin = '0px';
            companyField.style.height = '0px';
            companyField.style.overflow = 'hidden';
            
            // Definir valor específico apenas se campo estiver vazio
            const companyInput = document.getElementById('billing_company');
            if (companyInput) {
                const currentValue = companyInput.value.trim();
                if (!currentValue) {
                    companyInput.value = 'woonomedaempresa';
                }
                // Se já tem valor, não mexe nele
            }
            
            // Remover classes de erro se existirem
            companyField.classList.remove('woocommerce-invalid');
            companyField.classList.remove('woocommerce-invalid-required-field');
        }
    }

    function showCompanyField() {
        // Verificar se a configuração do campo empresa permite mudanças dinâmicas
        const companyBehavior = typeof WooBetterPersonTypeConfig !== 'undefined' ? 
            WooBetterPersonTypeConfig.company_field_behavior : 'dynamic';
        
        // Só controlar o campo se estiver em modo dinâmico
        if (companyBehavior === 'dynamic') {
            const companyField = document.getElementById('billing_company_field');
            
            if (companyField) {
                companyField.style.display = '';
                companyField.style.padding = '';
                companyField.style.margin = '';
                companyField.style.height = '';
                companyField.style.overflow = '';
                
                // Limpar apenas se tiver o valor específico (campo que estava vazio)
                const companyInput = document.getElementById('billing_company');
                if (companyInput && companyInput.value === 'woonomedaempresa') {
                    companyInput.value = '';
                }
                // Se tiver qualquer outro valor, mantém como está
            }
        }
        // Se não for dinâmico, não mexe no campo (deixa como está configurado no WooCommerce)
    }

    function setupCompanyField() {
        const companyInput = document.getElementById('billing_company');
        
        if (companyInput && !companyInput.dataset.eventsSetup) {
            // Verificar se já existe CNPJ completo no campo de documento
            const documentInput = document.getElementById('billing_document');
            let shouldShowCompany = false;
            
            if (documentInput && documentInput.value) {
                const cleanValue = documentInput.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
                
                // Se tem 14 dígitos (CNPJ completo), mostrar campo da empresa
                if (cleanValue.length === 14) {
                    shouldShowCompany = true;
                }
            }
            
            // Mostrar ou esconder campo baseado na presença de CNPJ completo
            if (shouldShowCompany) {
                showCompanyFieldIfDynamic();
            } else {
                hideCompanyField();
            }
            
            companyInput.dataset.eventsSetup = 'true';
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

    // Validação personalizada que considera se o campo está visível
    function isDocumentValidationRequired() {
        const billingCountrySelect = document.getElementById('billing_country');
        const billingDocumentField = document.getElementById('billing_document_field');
        
        // Só validar se o país for Brasil e o campo estiver visível
        if (billingCountrySelect && billingCountrySelect.value === 'BR') {
            if (billingDocumentField && billingDocumentField.style.display !== 'none') {
                return true;
            }
        }
        
        return false;
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
        // Mantém apenas alfanumérico maiúsculo (suporte CNPJ alfanumérico — IN RFB 2.229/2024)
        // Posições 1-12: alfanumérico livre | Posições 13-14 (DVs): somente dígitos
        const rawClean = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
        let clean = rawClean.substring(0, 12);
        const rest = rawClean.substring(12);
        for (let i = 0; i < rest.length && clean.length < 14; i++) {
            if (/\d/.test(rest[i])) {
                clean += rest[i];
            } else {
                break; // Letras não são permitidas nas posições dos dígitos verificadores
            }
        }
        const len = clean.length;
        if (len <= 2) return clean;
        if (len <= 5) return clean.substring(0, 2) + '.' + clean.substring(2);
        if (len <= 8) return clean.substring(0, 2) + '.' + clean.substring(2, 5) + '.' + clean.substring(5);
        if (len <= 12) return clean.substring(0, 2) + '.' + clean.substring(2, 5) + '.' + clean.substring(5, 8) + '/' + clean.substring(8);
        return clean.substring(0, 2) + '.' + clean.substring(2, 5) + '.' + clean.substring(5, 8) + '/' + clean.substring(8, 12) + '-' + clean.substring(12);
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
                const cleanValue = currentValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
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
                    // Ambos: usar detectDocumentType para que letras sejam tratadas como CNPJ alfanumérico
                    const detectedType = detectDocumentType(cleanValue, personTypeConfig);
                    if (detectedType === 'cnpj') {
                        formattedValue = applyCnpjMask(currentValue);
                    } else {
                        formattedValue = applyCpfMask(currentValue);
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
