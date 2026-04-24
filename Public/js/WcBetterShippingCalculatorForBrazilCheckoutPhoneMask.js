import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import intlTelInputUtils from 'intl-tel-input/build/js/utils.js';
import { pt } from 'intl-tel-input/i18n';

document.addEventListener('DOMContentLoaded', function() {
    // Sistema de debounce simplificado
    let phoneUpdateTimeout;
    let countryUpdateTimeout;
    
    function initPhoneInput() {
        // Verifica se o highlight de telefone está habilitado
        const isHighlightEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                   wc_better_checkout_phone_mask_vars.highlightPhone === 'true');
        
        // Apenas cria campo customizado se o highlight estiver habilitado
        if (isHighlightEnabled) {
            createSimpleCustomField();
        }
    }
    
    function createSimpleCustomField() {
        // Verifica se já foi criado
        if (document.getElementById('wc-custom-phone-field')) {
            return;
        }

        // Encontra o campo de email como referência
        const emailField = document.querySelector('#email, input[name="contact_email"]');
        if (!emailField) {
            return;
        }

        const emailContainer = emailField.closest('.wc-block-components-text-input, .form-row');
        if (!emailContainer) {
            return;
        }

        // Cria o campo customizado
        const customPhoneContainer = createCustomPhoneContainer();
        emailContainer.parentNode.insertBefore(customPhoneContainer, emailContainer.nextSibling);

        const customPhoneField = document.getElementById('custom-phone');
        
        // Verifica se a máscara está habilitada para aplicar formatação
        const isPhoneMaskEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                   wc_better_checkout_phone_mask_vars.phoneMaskEnabled === 'true');
        
        // Inicializa formatação apenas se a máscara estiver habilitada
        if (isPhoneMaskEnabled && !customPhoneField.dataset.intlTelInputInitialized) {
            initializeCustomPhoneField(customPhoneField);
        } else {
            // Campo simples sem formatação, apenas eventos básicos
            setupBasicPhoneField(customPhoneField);
        }
    }
    
    function createCustomPhoneContainer() {
        const customPhoneContainer = document.createElement('div');
        customPhoneContainer.className = 'wc-block-components-text-input wc-block-components-address-form__phone';
        customPhoneContainer.id = 'wc-custom-phone-field';
        
        // Obtém valor salvo na sessão ou usa string vazia
        const customPhoneValue = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                 wc_better_checkout_phone_mask_vars.customPhone) ? 
                                 wc_better_checkout_phone_mask_vars.customPhone : '';
        
        // Define label baseado na obrigatoriedade do campo
        const isPhoneRequired = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                               wc_better_checkout_phone_mask_vars.phoneRequired === 'true');
        const phoneLabel = isPhoneRequired ? 'Telefone' : 'Telefone (opcional)';
        
        customPhoneContainer.innerHTML = `
            <input type="tel" 
                   id="custom-phone" 
                   autocapitalize="characters" 
                   autocomplete="tel" 
                   aria-label="${phoneLabel}" 
                   name="custom_phone" 
                   value="${customPhoneValue}">
            <label for="custom-phone">${phoneLabel}</label>
        `;
        
        // Aplica classe is-active se já tiver valor inicial
        if (customPhoneValue && customPhoneValue.trim() !== '') {
            customPhoneContainer.classList.add('is-active');
        }
        
        return customPhoneContainer;
    }
    
    // Função para converter dial code para código ISO do país
    function getCountryCodeFromDialCode(dialCode) {
        const dialCodeMap = {
            '+55': 'br',   // Brasil
            '+1': 'us',    // Estados Unidos/Canadá
            '+44': 'gb',   // Reino Unido
            '+33': 'fr',   // França
            '+49': 'de',   // Alemanha
            '+34': 'es',   // Espanha
            '+39': 'it',   // Itália
            '+351': 'pt',  // Portugal
            '+54': 'ar',   // Argentina
            '+56': 'cl',   // Chile
            '+57': 'co',   // Colômbia
            '+51': 'pe',   // Peru
        };
        
        return dialCodeMap[dialCode] || 'br'; // Default para Brasil se não encontrar
    }

    function initializeCustomPhoneField(customPhoneField) {
        // Obtém o país customizado das variáveis do PHP
        let initialCountry = 'br'; // Default para Brasil
        let preferredCountries = ['br'];
        
        if (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
            wc_better_checkout_phone_mask_vars.customCountry) {
            const customCountry = wc_better_checkout_phone_mask_vars.customCountry;
            const countryCode = getCountryCodeFromDialCode(customCountry);
            initialCountry = countryCode;
            preferredCountries = [countryCode, 'br']; // Inclui o customizado + Brasil
        }

        let iti = intlTelInput(customPhoneField, {
            initialCountry: initialCountry,
            preferredCountries: preferredCountries,
            separateDialCode: false,
            nationalMode: false,
            formatOnDisplay: false,
            autoHideDialCode: false,
            placeholderNumberType: "MOBILE",
            showSelectedDialCode: false,
            allowDropdown: true,
            autoPlaceholder: "off",
            strictMode: false,
            validation: false,
            i18n: pt,
            utilsScript: intlTelInputUtils
        });

        customPhoneField.dataset.intlTelInputInitialized = 'true';
        
        // Aplica estilo ao campo customizado
        applyPhoneFieldStyling(customPhoneField);
        
        // Aplica classe is-active se campo já tiver valor
        const container = customPhoneField.closest('.wc-block-components-text-input');
        if (container && customPhoneField.value.trim() !== '') {
            container.classList.add('is-active');
        }
        
        // Event listeners com formatação (com suporte a is-active para campo custom)
        setupFormattedPhoneEvents(customPhoneField, iti, true);
        
        // Configura código do país inicial
        setTimeout(() => {
            const countryData = iti.getSelectedCountryData();
            const dialCode = '+' + countryData.dialCode;
            updateCountryCodeExtension(dialCode);
            
            // Executa extensão inicial com valor do campo
            updatePhoneExtension(customPhoneField.value, customPhoneField);
        }, 50);
    }
    
    function setupFormattedPhoneEvents(phoneField, iti, isCustomField = false) {
        // Variáveis de controle para formatação (mesmo padrão dos campos originais)
        let isFormatting = false;
        let lastFormattedValue = '';
        
        phoneField.addEventListener('countrychange', function() {
            const countryData = iti.getSelectedCountryData();
            const dialCode = '+' + countryData.dialCode;
            updateCountryCodeExtension(dialCode);
        });

        // Evento input com formatação automática (mesmo padrão dos campos originais)
        let inputTimeout;
        phoneField.addEventListener('input', function(event) {
            
            // Atualiza classes CSS do container (apenas para campos customizados)
            if (isCustomField) {
                const container = phoneField.closest('.wc-block-components-text-input');
                if (container) {
                    if (phoneField.value.trim() !== '') {
                        container.classList.add('is-active');
                    } else {
                        container.classList.remove('is-active');
                    }
                }
            }
            
            // Atualiza código do país
            const countryData = iti.getSelectedCountryData();
            const dialCode = '+' + countryData.dialCode;
            updateCountryCodeExtension(dialCode);
            
            // Aplica formatação automática (debounce para melhor performance)
            if (inputTimeout) {
                clearTimeout(inputTimeout);
            }
            
            // Só aplica formatação se não for uma mudança de seleção/cursor
            if (event.inputType !== 'insertCompositionText' && 
                event.inputType !== 'selectAll' &&
                !event.isComposing) {
                
                // Para operações de deleção, usa delay menor para melhor responsividade
                const isDelete = event.inputType === 'deleteContentBackward' || 
                               event.inputType === 'deleteContentForward' ||
                               event.data === null;
                const delay = isDelete ? 5 : 10;
                
                inputTimeout = setTimeout(() => {
                    applyCustomPhoneFormatting(phoneField, iti, isFormatting, lastFormattedValue, function(newIsFormatting, newLastValue) {
                        isFormatting = newIsFormatting;
                        lastFormattedValue = newLastValue;
                    });
                }, delay);
            }
        });

        phoneField.addEventListener('blur', function() {
            updatePhoneExtension(phoneField.value, phoneField);
        });
        
        phoneField.addEventListener('focus', function() {
            // Aplica is-active apenas para campos customizados
            if (isCustomField) {
                const container = phoneField.closest('.wc-block-components-text-input');
                if (container && phoneField.value.trim() !== '') {
                    container.classList.add('is-active');
                }
            }
        });
    }
    
    function applyCustomPhoneFormatting(phoneField, iti, isFormatting, lastFormattedValue, updateCallback) {
        try {
            // Evita formatação se já estamos formatando
            if (isFormatting) {
                return;
            }
            
            const currentValue = phoneField.value;
            
            // PROTEÇÃO ANTI-LOOP: Se o valor não mudou desde a última formatação, não faz nada
            if (currentValue === lastFormattedValue) {
                return;
            }
            
            // PROTEÇÃO ADICIONAL: Evita reprocessar valores que já tentamos formatar
            if (!applyCustomPhoneFormatting._processedValues) {
                applyCustomPhoneFormatting._processedValues = new Set();
            }
            
            if (applyCustomPhoneFormatting._processedValues.has(currentValue)) {
                updateCallback(false, currentValue);
                return;
            }
            
            // Adiciona valor à lista de processados
            applyCustomPhoneFormatting._processedValues.add(currentValue);
            
            // Limpa valores antigos da lista (mantém apenas os últimos 10)
            if (applyCustomPhoneFormatting._processedValues.size > 10) {
                const values = Array.from(applyCustomPhoneFormatting._processedValues);
                applyCustomPhoneFormatting._processedValues.clear();
                values.slice(-5).forEach(v => applyCustomPhoneFormatting._processedValues.add(v));
            }
            
            updateCallback(true, lastFormattedValue); // isFormatting = true
            
            // Se o campo está vazio, só atualiza o valor e retorna
            if (!currentValue || currentValue.trim() === '') {
                triggerReactChange(phoneField, currentValue);
                updateCallback(false, currentValue);
                return;
            }
            
            // Se o valor contém apenas caracteres especiais sem números, limpa o campo
            // EXCETO se é apenas '+' no início (permite começar número internacional)
            const onlyDigits = currentValue.replace(/\D/g, '');
            if (onlyDigits === '' && currentValue.trim() !== '' && currentValue.trim() !== '+') {
                const cursorPos = phoneField.selectionStart || 0;
                setValueAndCursor(phoneField, '', cursorPos, currentValue, false);
                updateCallback(false, '');
                return;
            }
            
            // NOVA LÓGICA: Detecta códigos únicos e adiciona espaço automaticamente
            // Testa progressivamente: códigos de 1 dígito (+1), depois 2 dígitos (+55), etc.
            if (!currentValue.includes(' ')) {
                let detectedCode = null;
                let detectedCountry = null;
                
                // Testa códigos de 1 a 4 dígitos progressivamente
                for (let length = 1; length <= 4; length++) {
                    const regex = new RegExp(`^\\+(\\d{${length}})$`);
                    const match = currentValue.match(regex);
                    
                    if (match) {
                        const testCode = match[1];
                        const uniqueMatch = isUniqueCountryCode(testCode);
                        
                        if (uniqueMatch) {
                            detectedCode = testCode;
                            detectedCountry = uniqueMatch;
                            break; // Para no primeiro código único encontrado
                        }
                    }
                }
                
                // Se encontrou um código único, adiciona espaço
                if (detectedCode && detectedCountry) {
                    const newValue = `+${detectedCode} `;
                    
                    // ESTRATÉGIA MÚLTIPLA: Tenta várias formas de alterar o valor
                    let changeSuccess = false;
                    
                    // Método 1: setValueAndCursor (atual)
                    setValueAndCursor(phoneField, newValue, newValue.length, currentValue, false);
                    if (phoneField.value === newValue) {
                        changeSuccess = true;
                    } else {
                        // Método 2: Atribuição direta
                        phoneField.value = newValue;
                        if (phoneField.value === newValue) {
                            changeSuccess = true;
                        } else {
                            
                            // Método 3: Força com descriptor nativo + eventos
                            try {
                                const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                                nativeSetter.call(phoneField, newValue);
                                
                                // Dispara eventos múltiplos
                                phoneField.dispatchEvent(new Event('input', { bubbles: true }));
                                phoneField.dispatchEvent(new Event('change', { bubbles: true }));
                                phoneField.dispatchEvent(new Event('keyup', { bubbles: true }));
                                
                                // Verifica novamente após um pequeno delay
                                setTimeout(() => {
                                    if (phoneField.value === newValue) {
                                        iti.setCountry(detectedCountry);
                                        updateCallback(false, newValue);
                                    } else {
                                        updateCallback(false, currentValue);
                                    }
                                }, 20);
                                
                            } catch (error) {
                                updateCallback(false, currentValue);
                            }
                        }
                    }
                    
                    // Se algum método funcionou imediatamente
                    if (changeSuccess) {
                        iti.setCountry(detectedCountry);
                        updateCallback(false, newValue);
                        
                        // Limpa a lista de valores processados em caso de sucesso
                        if (applyCustomPhoneFormatting._processedValues) {
                            applyCustomPhoneFormatting._processedValues.clear();
                        }
                    }
                    
                    return;
                }
            }
            
            // NOVA DETECÇÃO: Números internacionais "despidos" de formatação
            const strippedInternational = currentValue.match(/^\+(\d{1,4})(\d{6,15})$/);
            if (strippedInternational) {
                const countryCode = strippedInternational[1];
                const phoneNumber = strippedInternational[2];
                
                // Tenta encontrar o país pelo código
                const foundCountryCode = findCustomCountryByDialCode(countryCode);
                if (foundCountryCode) {
                    iti.setCountry(foundCountryCode);
                    
                    setTimeout(() => {
                        try {
                            const formatted = intlTelInputUtils.formatNumber(
                                phoneNumber, 
                                foundCountryCode, 
                                intlTelInputUtils.numberFormat.NATIONAL
                            );
                            
                            if (formatted && formatted !== 'Invalid number') {
                                // Verifica se a formatação não remove dígitos
                                const inputDigits = phoneNumber.replace(/\D/g, '');
                                const outputDigits = formatted.replace(/\D/g, '');
                                
                                if (inputDigits === outputDigits) {
                                    const finalValue = `+${countryCode} ${formatted}`;
                                    const cursorPos = phoneField.selectionStart || 0;
                                    setValueAndCursor(phoneField, finalValue, cursorPos, currentValue, false);
                                    updateCallback(false, finalValue);
                                    return;
                                }
                            }
                        } catch (formatError) {
                            // Se erro na formatação, continua para próxima lógica
                        }
                        updateCallback(false, currentValue);
                    }, 50);
                    return;
                }
            }
            
            // Números internacionais com espaço já separando código do país
            const internationalWithSpace = currentValue.match(/^\+(\d{1,4})\s+(.*)$/);
            
            if (internationalWithSpace) {
                const userDialCode = internationalWithSpace[1]; // Código que o usuário digitou
                
                // Deixa a biblioteca detectar automaticamente e usa getSelectedCountryData
                setTimeout(() => {
                    const countryData = iti.getSelectedCountryData();
                    
                    if (countryData && countryData.dialCode) {
                        const detectedDialCode = countryData.dialCode;
                        const localNumber = internationalWithSpace[2];
                        
                        // Se o usuário está digitando um código diferente do detectado, não formata ainda
                        if (userDialCode !== detectedDialCode) {
                            updateCallback(false, currentValue);
                            return;
                        }
                        
                        // Formata o número local e reconecta com código
                        const cleanLocalNumber = localNumber.replace(/\D/g, '');
                        
                        if (cleanLocalNumber.length > 0) {
                            try {
                                const formatted = intlTelInputUtils.formatNumber(
                                    cleanLocalNumber, 
                                    countryData.iso2, 
                                    intlTelInputUtils.numberFormat.NATIONAL
                                );

                                // VERIFICAÇÃO CRÍTICA: Impede formatação que remove dígitos
                                const inputDigits = cleanLocalNumber.replace(/\D/g, '');
                                const outputDigits = formatted.replace(/\D/g, '');

                                if (formatted && formatted !== 'Invalid number' && inputDigits === outputDigits) {
                                    const finalValue = `+${userDialCode} ${formatted}`;
                                    const cursorPos = phoneField.selectionStart || 0;
                                    setValueAndCursor(phoneField, finalValue, cursorPos, currentValue, false);
                                    updateCallback(false, finalValue);
                                    return;
                                }
                            } catch (formatError) {
                                // Se erro na formatação, mantém o valor original
                            }
                        }
                    }
                    updateCallback(false, currentValue);
                }, 50); // Pequeno delay para garantir processamento da biblioteca
                return;
            }
            
            // Se é um número nacional, aplica formatação nacional
            if (!currentValue.startsWith('+')) {
                const cleanValue = currentValue.replace(/\D/g, '');
                const countryData = iti.getSelectedCountryData();
                
                if (countryData && countryData.dialCode && countryData.iso2 && countryData.dialCode !== 'undefined' && cleanValue.length > 0) {
                    try {
                        const formatted = intlTelInputUtils.formatNumber(
                            cleanValue, 
                            countryData.iso2, 
                            intlTelInputUtils.numberFormat.NATIONAL
                        );

                        // VERIFICAÇÃO CRÍTICA: Impede formatação que remove dígitos
                        const inputDigits = cleanValue.replace(/\D/g, '');
                        const outputDigits = formatted.replace(/\D/g, '');

                        if (formatted && formatted !== 'Invalid number' && inputDigits === outputDigits) {
                            const cursorPos = phoneField.selectionStart || 0;
                            setValueAndCursor(phoneField, formatted, cursorPos, currentValue, false);
                            updateCallback(false, formatted);
                            return;
                        }
                    } catch (formatError) {
                        // Se erro na formatação, mantém valor original
                    }
                }
            }
            
            // Para qualquer outro caso, notifica o React
            triggerReactChange(phoneField, currentValue);
            updateCallback(false, currentValue);
            
            // Limpa valores processados para permitir reprocessamento futuro
            if (applyCustomPhoneFormatting._processedValues) {
                applyCustomPhoneFormatting._processedValues.delete(currentValue);
            }
        } catch (error) {
            // Erro na aplicação da máscara
            updateCallback(false, lastFormattedValue);
            
            // Limpa valores processados em caso de erro
            if (applyCustomPhoneFormatting._processedValues) {
                applyCustomPhoneFormatting._processedValues.clear();
            }
        }
    }
    
    // Funções auxiliares para campo customizado
    function setValueAndCursor(phoneField, newValue, originalCursorPos, originalValue, isDeletion = false) {
        try {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(phoneField, newValue);
            
            // Calcula nova posição do cursor de forma mais inteligente
            let newCursorPos = calculateSmartCursorPosition(originalValue, newValue, originalCursorPos, isDeletion);
            
            // Garante que a posição está dentro dos limites
            newCursorPos = Math.max(0, Math.min(newCursorPos, newValue.length));
            
            // Restaura a posição do cursor
            if (phoneField.setSelectionRange) {
                phoneField.setSelectionRange(newCursorPos, newCursorPos);
            }
            
            triggerReactChange(phoneField, newValue);
        } catch (error) {
            // Erro ao definir valor e cursor
            // Fallback sem preservação de cursor
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(phoneField, newValue);
            triggerReactChange(phoneField, newValue);
        }
    }
    
    function triggerReactChange(phoneField, newValue) {
        try {
            if (!phoneField || typeof phoneField !== 'object') {
                return;
            }

            // Atualiza extensão para telefones customizados
            updatePhoneExtension(newValue, phoneField);
            
            // Dispara eventos nativos para compatibilidade
            const events = [
                new Event('input', { bubbles: true, cancelable: true }),
                new Event('change', { bubbles: true, cancelable: true })
            ];
            
            events.forEach(event => {
                phoneField.dispatchEvent(event);
            });
            
        } catch (error) {
            // Erro ao disparar eventos
        }
    }
    
    function calculateSmartCursorPosition(originalValue, newValue, originalCursorPos, isDeletion = false) {
        // Se os valores são iguais, mantém a posição
        if (originalValue === newValue) {
            return originalCursorPos;
        }
        
        // Proteção contra cursor fora dos limites
        if (originalCursorPos > originalValue.length) {
            return newValue.length;
        }
        
        // Se cursor está no início, mantém no início
        if (originalCursorPos === 0) {
            return 0;
        }
        
        // Se cursor está no final, mantém no final
        if (originalCursorPos >= originalValue.length) {
            return newValue.length;
        }
        
        // Para números internacionais, trata de forma especial
        if (originalValue.startsWith('+') && newValue.startsWith('+')) {
            // Se o cursor está na parte do código do país (+XX), preserva posição relativa
            const firstSpacePos = newValue.indexOf(' ');
            if (firstSpacePos > 0 && originalCursorPos <= firstSpacePos) {
                return originalCursorPos;
            }
        }
        
        // Extrai apenas dígitos de ambos os valores para mapear posições
        const originalDigits = originalValue.replace(/\D/g, '');
        const newValueDigits = newValue.replace(/\D/g, '');
        
        // Conta quantos dígitos há antes da posição original do cursor
        const textBeforeCursor = originalValue.substring(0, originalCursorPos);
        const digitsBeforeCursor = textBeforeCursor.replace(/\D/g, '').length;
        
        // Se não há dígitos antes do cursor, coloca no início
        if (digitsBeforeCursor === 0) {
            return 0;
        }
        
        // Encontra a posição no novo valor onde temos o mesmo número de dígitos
        let digitCount = 0;
        let newPosition = 0;
        
        for (let i = 0; i < newValue.length; i++) {
            const char = newValue[i];
            
            if (/\d/.test(char)) {
                digitCount++;
                if (digitCount === digitsBeforeCursor) {
                    newPosition = i + 1;
                    break;
                }
            }
            
            // Se ainda não chegamos no número de dígitos, continua
            if (digitCount < digitsBeforeCursor) {
                newPosition = i + 1;
            }
        }
        
        // Se não conseguimos encontrar dígitos suficientes, vai para o final
        if (digitCount < digitsBeforeCursor) {
            return newValue.length;
        }
        
        // Garante que a posição não seja maior que o comprimento
        newPosition = Math.min(newPosition, newValue.length);
        
        return newPosition;
    }

    function findCustomCountryByDialCode(dialCode) {
        const dialCodeMap = {
            '1': 'us',    // Estados Unidos/Canadá
            '7': 'ru',    // Rússia
            '20': 'eg',   // Egito
            '27': 'za',   // África do Sul
            '30': 'gr',   // Grécia
            '31': 'nl',   // Holanda
            '32': 'be',   // Bélgica
            '33': 'fr',   // França
            '34': 'es',   // Espanha
            '36': 'hu',   // Hungria
            '39': 'it',   // Itália
            '40': 'ro',   // Romênia
            '41': 'ch',   // Suíça
            '43': 'at',   // Áustria
            '44': 'gb',   // Reino Unido
            '45': 'dk',   // Dinamarca
            '46': 'se',   // Suécia
            '47': 'no',   // Noruega
            '48': 'pl',   // Polônia
            '49': 'de',   // Alemanha
            '51': 'pe',   // Peru
            '52': 'mx',   // México
            '53': 'cu',   // Cuba
            '54': 'ar',   // Argentina
            '55': 'br',   // Brasil
            '56': 'cl',   // Chile
            '57': 'co',   // Colômbia
            '58': 've',   // Venezuela
            '60': 'my',   // Malásia
            '61': 'au',   // Austrália
            '62': 'id',   // Indonésia
            '63': 'ph',   // Filipinas
            '64': 'nz',   // Nova Zelândia
            '65': 'sg',   // Singapura
            '66': 'th',   // Tailândia
            '81': 'jp',   // Japão
            '82': 'kr',   // Coreia do Sul
            '84': 'vn',   // Vietnã
            '86': 'cn',   // China
            '90': 'tr',   // Turquia
            '91': 'in',   // Índia
            '92': 'pk',   // Paquistão
            '93': 'af',   // Afeganistão
            '94': 'lk',   // Sri Lanka
            '95': 'mm',   // Myanmar
            '98': 'ir',   // Irã
            '212': 'ma',  // Marrocos
            '213': 'dz',  // Argélia
            '216': 'tn',  // Tunísia
            '218': 'ly',  // Líbia
            '220': 'gm',  // Gâmbia
            '221': 'sn',  // Senegal
            '351': 'pt',  // Portugal
            '352': 'lu',  // Luxemburgo
            '353': 'ie',  // Irlanda
            '354': 'is',  // Islândia
            '355': 'al',  // Albânia
            '356': 'mt',  // Malta
            '357': 'cy',  // Chipre
            '358': 'fi',  // Finlândia
            '359': 'bg',  // Bulgária
            '370': 'lt',  // Lituânia
            '371': 'lv',  // Letônia
            '372': 'ee',  // Estônia
            '373': 'md',  // Moldávia
            '374': 'am',  // Armênia
            '375': 'by',  // Bielorrússia
            '376': 'ad',  // Andorra
            '377': 'mc',  // Mônaco
            '378': 'sm',  // San Marino
            '380': 'ua',  // Ucrânia
            '381': 'rs',  // Sérvia
            '382': 'me',  // Montenegro
            '383': 'xk',  // Kosovo
            '385': 'hr',  // Croácia
            '386': 'si',  // Eslovênia
            '387': 'ba',  // Bósnia e Herzegovina
            '389': 'mk',  // Macedônia do Norte
            '420': 'cz',  // República Tcheca
            '421': 'sk',  // Eslováquia
            '423': 'li',  // Liechtenstein
            '500': 'fk',  // Ilhas Falkland
            '501': 'bz',  // Belize
            '502': 'gt',  // Guatemala
            '503': 'sv',  // El Salvador
            '504': 'hn',  // Honduras
            '505': 'ni',  // Nicarágua
            '506': 'cr',  // Costa Rica
            '507': 'pa',  // Panamá
            '508': 'pm',  // Saint Pierre e Miquelon
            '509': 'ht',  // Haiti
            '590': 'gp',  // Guadalupe
            '591': 'bo',  // Bolívia
            '592': 'gy',  // Guiana
            '593': 'ec',  // Equador
            '594': 'gf',  // Guiana Francesa
            '595': 'py',  // Paraguai
            '596': 'mq',  // Martinica
            '597': 'sr',  // Suriname
            '598': 'uy',  // Uruguai
            '599': 'cw',  // Curaçao
            '670': 'tl',  // Timor-Leste
            '672': 'aq',  // Antártida
            '673': 'bn',  // Brunei
            '674': 'nr',  // Nauru
            '675': 'pg',  // Papua Nova Guiné
            '676': 'to',  // Tonga
            '677': 'sb',  // Ilhas Salomão
            '678': 'vu',  // Vanuatu
            '679': 'fj',  // Fiji
            '680': 'pw',  // Palau
            '681': 'wf',  // Wallis e Futuna
            '682': 'ck',  // Ilhas Cook
            '683': 'nu',  // Niue
            '684': 'as',  // Samoa Americana
            '685': 'ws',  // Samoa
            '686': 'ki',  // Kiribati
            '687': 'nc',  // Nova Caledônia
            '688': 'tv',  // Tuvalu
            '689': 'pf',  // Polinésia Francesa
            '690': 'tk',  // Tokelau
            '691': 'fm',  // Micronésia
            '692': 'mh',  // Ilhas Marshall
            '850': 'kp',  // Coreia do Norte
            '852': 'hk',  // Hong Kong
            '853': 'mo',  // Macau
            '855': 'kh',  // Camboja
            '856': 'la',  // Laos
            '880': 'bd',  // Bangladesh
            '886': 'tw',  // Taiwan
            '960': 'mv',  // Maldivas
            '961': 'lb',  // Líbano
            '962': 'jo',  // Jordânia
            '963': 'sy',  // Síria
            '964': 'iq',  // Iraque
            '965': 'kw',  // Kuwait
            '966': 'sa',  // Arábia Saudita
            '967': 'ye',  // Iêmen
            '968': 'om',  // Omã
            '970': 'ps',  // Palestina
            '971': 'ae',  // Emirados Árabes Unidos
            '972': 'il',  // Israel
            '973': 'bh',  // Bahrein
            '974': 'qa',  // Catar
            '975': 'bt',  // Butão
            '976': 'mn',  // Mongólia
            '977': 'np',  // Nepal
            '992': 'tj',  // Tadjiquistão
            '993': 'tm',  // Turcomenistão
            '994': 'az',  // Azerbaijão
            '995': 'ge',  // Geórgia
            '996': 'kg',  // Quirguistão
            '998': 'uz'   // Uzbequistão
        };
        
        return dialCodeMap[dialCode] || null;
    }
    
    function isUniqueCountryCode(partialCode) {
        const dialCodeMap = {
            '1': 'us',    // Estados Unidos/Canadá
            '7': 'ru',    // Rússia
            '20': 'eg',   // Egito
            '27': 'za',   // África do Sul
            '30': 'gr',   // Grécia
            '31': 'nl',   // Holanda
            '32': 'be',   // Bélgica
            '33': 'fr',   // França
            '34': 'es',   // Espanha
            '36': 'hu',   // Hungria
            '39': 'it',   // Itália
            '40': 'ro',   // Romênia
            '41': 'ch',   // Suíça
            '43': 'at',   // Áustria
            '44': 'gb',   // Reino Unido
            '45': 'dk',   // Dinamarca
            '46': 'se',   // Suécia
            '47': 'no',   // Noruega
            '48': 'pl',   // Polônia
            '49': 'de',   // Alemanha
            '51': 'pe',   // Peru
            '52': 'mx',   // México
            '53': 'cu',   // Cuba
            '54': 'ar',   // Argentina
            '55': 'br',   // Brasil
            '56': 'cl',   // Chile
            '57': 'co',   // Colômbia
            '58': 've',   // Venezuela
            '60': 'my',   // Malásia
            '61': 'au',   // Austrália
            '62': 'id',   // Indonésia
            '63': 'ph',   // Filipinas
            '64': 'nz',   // Nova Zelândia
            '65': 'sg',   // Singapura
            '66': 'th',   // Tailândia
            '81': 'jp',   // Japão
            '82': 'kr',   // Coreia do Sul
            '84': 'vn',   // Vietnã
            '86': 'cn',   // China
            '90': 'tr',   // Turquia
            '91': 'in',   // Índia
            '92': 'pk',   // Paquistão
            '93': 'af',   // Afeganistão
            '94': 'lk',   // Sri Lanka
            '95': 'mm',   // Myanmar
            '98': 'ir',   // Irã
            '212': 'ma',  // Marrocos
            '213': 'dz',  // Argélia
            '216': 'tn',  // Tunísia
            '218': 'ly',  // Líbia
            '220': 'gm',  // Gâmbia
            '221': 'sn',  // Senegal
            '351': 'pt',  // Portugal
            '352': 'lu',  // Luxemburgo
            '353': 'ie',  // Irlanda
            '354': 'is',  // Islândia
            '355': 'al',  // Albânia
            '356': 'mt',  // Malta
            '357': 'cy',  // Chipre
            '358': 'fi',  // Finlândia
            '359': 'bg',  // Bulgária
            '370': 'lt',  // Lituânia
            '371': 'lv',  // Letônia
            '372': 'ee',  // Estônia
            '373': 'md',  // Moldávia
            '374': 'am',  // Armênia
            '375': 'by',  // Bielorrússia
            '376': 'ad',  // Andorra
            '377': 'mc',  // Mônaco
            '378': 'sm',  // San Marino
            '380': 'ua',  // Ucrânia
            '381': 'rs',  // Sérvia
            '382': 'me',  // Montenegro
            '383': 'xk',  // Kosovo
            '385': 'hr',  // Croácia
            '386': 'si',  // Eslovênia
            '387': 'ba',  // Bósnia e Herzegovina
            '389': 'mk',  // Macedônia do Norte
            '420': 'cz',  // República Tcheca
            '421': 'sk',  // Eslováquia
            '423': 'li',  // Liechtenstein
            '500': 'fk',  // Ilhas Falkland
            '501': 'bz',  // Belize
            '502': 'gt',  // Guatemala
            '503': 'sv',  // El Salvador
            '504': 'hn',  // Honduras
            '505': 'ni',  // Nicarágua
            '506': 'cr',  // Costa Rica
            '507': 'pa',  // Panamá
            '508': 'pm',  // Saint Pierre e Miquelon
            '509': 'ht',  // Haiti
            '590': 'gp',  // Guadalupe
            '591': 'bo',  // Bolívia
            '592': 'gy',  // Guiana
            '593': 'ec',  // Equador
            '594': 'gf',  // Guiana Francesa
            '595': 'py',  // Paraguai
            '596': 'mq',  // Martinica
            '597': 'sr',  // Suriname
            '598': 'uy',  // Uruguai
            '599': 'cw',  // Curaçao
            '670': 'tl',  // Timor-Leste
            '672': 'aq',  // Antártida
            '673': 'bn',  // Brunei
            '674': 'nr',  // Nauru
            '675': 'pg',  // Papua Nova Guiné
            '676': 'to',  // Tonga
            '677': 'sb',  // Ilhas Salomão
            '678': 'vu',  // Vanuatu
            '679': 'fj',  // Fiji
            '680': 'pw',  // Palau
            '681': 'wf',  // Wallis e Futuna
            '682': 'ck',  // Ilhas Cook
            '683': 'nu',  // Niue
            '684': 'as',  // Samoa Americana
            '685': 'ws',  // Samoa
            '686': 'ki',  // Kiribati
            '687': 'nc',  // Nova Caledônia
            '688': 'tv',  // Tuvalu
            '689': 'pf',  // Polinésia Francesa
            '690': 'tk',  // Tokelau
            '691': 'fm',  // Micronésia
            '692': 'mh',  // Ilhas Marshall
            '850': 'kp',  // Coreia do Norte
            '852': 'hk',  // Hong Kong
            '853': 'mo',  // Macau
            '855': 'kh',  // Camboja
            '856': 'la',  // Laos
            '880': 'bd',  // Bangladesh
            '886': 'tw',  // Taiwan
            '960': 'mv',  // Maldivas
            '961': 'lb',  // Líbano
            '962': 'jo',  // Jordânia
            '963': 'sy',  // Síria
            '964': 'iq',  // Iraque
            '965': 'kw',  // Kuwait
            '966': 'sa',  // Arábia Saudita
            '967': 'ye',  // Iêmen
            '968': 'om',  // Omã
            '970': 'ps',  // Palestina
            '971': 'ae',  // Emirados Árabes Unidos
            '972': 'il',  // Israel
            '973': 'bh',  // Bahrein
            '974': 'qa',  // Catar
            '975': 'bt',  // Butão
            '976': 'mn',  // Mongólia
            '977': 'np',  // Nepal
            '992': 'tj',  // Tadjiquistão
            '993': 'tm',  // Turcomenistão
            '994': 'az',  // Azerbaijão
            '995': 'ge',  // Geórgia
            '996': 'kg',  // Quirguistão
            '998': 'uz'   // Uzbequistão
        };
        
        // Se existe exatamente esse código no mapa, é único
        if (dialCodeMap[partialCode]) {
            return dialCodeMap[partialCode];
        }
        
        // Verifica se há apenas uma possibilidade com esse prefixo
        const possibleCodes = Object.keys(dialCodeMap).filter(code => code.startsWith(partialCode));
        
        if (possibleCodes.length === 1) {
            // Se há apenas um código possível com esse prefixo, considera único
            return dialCodeMap[possibleCodes[0]];
        }
        
        return null; // Código ambíguo ou não encontrado
    }
    
    function setupBasicPhoneField(phoneField) {
        // Aplica classe is-active se campo já tiver valor inicial
        const container = phoneField.closest('.wc-block-components-text-input');
        if (container && phoneField.value.trim() !== '') {
            container.classList.add('is-active');
        }
        
        // Eventos básicos para campo sem formatação
        phoneField.addEventListener('input', function() {
            const container = phoneField.closest('.wc-block-components-text-input');
            if (container) {
                if (phoneField.value.trim() !== '') {
                    container.classList.add('is-active');
                } else {
                    container.classList.remove('is-active');
                }
            }
            
            // Atualiza extensão com valor simples
            updatePhoneExtension(phoneField.value, phoneField);
        });
        
        phoneField.addEventListener('focus', function() {
            const container = phoneField.closest('.wc-block-components-text-input');
            if (container && phoneField.value.trim() !== '') {
                container.classList.add('is-active');
            }
        });
        
        phoneField.addEventListener('blur', function() {
            updatePhoneExtension(phoneField.value, phoneField);
        });
        
        // Define código padrão do Brasil para extensão
        updateCountryCodeExtension('+55');
        
        // Executa extensão inicial com valor do campo
        updatePhoneExtension(phoneField.value, phoneField);
    }
    
    function handlePhoneInput(event, iti) {
        const phoneField = event.target;
        const value = phoneField.value;
        
        // Formatação básica para números nacionais
        if (value && !value.startsWith('+')) {
            const countryData = iti.getSelectedCountryData();
            if (countryData && countryData.iso2) {
                try {
                    const cleanValue = value.replace(/\D/g, '');
                    if (cleanValue.length > 0) {
                        const formatted = intlTelInputUtils.formatNumber(
                            cleanValue, 
                            countryData.iso2, 
                            intlTelInputUtils.numberFormat.NATIONAL
                        );
                        
                        if (formatted && formatted !== 'Invalid number' && formatted !== value) {
                            phoneField.value = formatted;
                        }
                    }
                } catch (error) {
                    // Ignora erros de formatação
                }
            }
        }
        
        // Atualiza extensão
        updatePhoneExtension(phoneField.value, phoneField);
    }
    
    function applyPhoneFieldStyling(phoneField) {
        // Aplica !important no input e calcula padding para label
        let inputPadding = 52;
        if (phoneField && phoneField.tagName === 'INPUT') {
            // Tenta pegar o padding-left inline, senão computado
            let pl = phoneField.style.paddingLeft || window.getComputedStyle(phoneField).paddingLeft;
            if (pl && pl.endsWith('px')) {
                inputPadding = parseInt(pl.replace('px', ''), 10);
            }
            phoneField.style.setProperty('padding-left', inputPadding + 'px', 'important');
        }

        // Define padding da label dinamicamente (+4px do input)
        const label = phoneField.closest('.form-row, .wc-block-components-text-input')?.querySelector('label');
        if (label) {
            let labelPad = (inputPadding + 4) + 'px';
            label.style.setProperty('padding-left', labelPad, 'important');
            label.style.transition = 'all 0.3s ease';
            if (label.classList.contains('screen-reader-text') || getComputedStyle(label).position === 'absolute') {
                label.style.setProperty('left', labelPad, 'important');
                label.style.setProperty('padding-left', '0px', 'important');
            }
        }

        const blockLabel = phoneField.closest('.wc-block-components-text-input')?.querySelector('.wc-block-components-text-input__label');
        if (blockLabel) {
            let labelPad = (inputPadding + 4) + 'px';
            blockLabel.style.setProperty('padding-left', labelPad, 'important');
            blockLabel.style.transition = 'all 0.3s ease';
        }

        // Campo já ajustado
    }
    
    function updateCountryCode(dialCode) {
        // Para checkout tradicional - campos hidden
        updateHiddenFields(dialCode);
        
        // Para WooCommerce Blocks - extension data
        updateCountryCodeExtension(dialCode);
    }
    
    function updateCountryCodeExtension(dialCode) {
        // Cancela timeout anterior
        if (countryUpdateTimeout) {
            clearTimeout(countryUpdateTimeout);
        }
        
        // Debounce de 500ms para evitar múltiplas atualizações
        countryUpdateTimeout = setTimeout(() => {
            // Extension para WooCommerce Blocks
            if (window.wc && window.wc.blocksCheckout && 
                typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                
                window.wc.blocksCheckout.extensionCartUpdate({
                    namespace: 'woo_better_phone_country',
                    data: {
                        billing_phone_country_code: dialCode,
                        shipping_phone_country_code: dialCode
                    }
                });
            }
            
            // Backup: Store API para Blocks
            if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
                try {
                    const checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                    if (checkoutDispatch && checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_phone_country', {
                            billing_phone_country_code: dialCode,
                            shipping_phone_country_code: dialCode
                        });
                    }
                } catch (error) {
                    // Ignora erros
                }
            }
            
            countryUpdateTimeout = null;
        }, 500);
    }
    
    function updatePhoneExtension(phoneValue, phoneField) {
        // Cancela timeout anterior
        if (phoneUpdateTimeout) {
            clearTimeout(phoneUpdateTimeout);
        }
        
        // Debounce de 500ms para evitar múltiplas atualizações
        phoneUpdateTimeout = setTimeout(() => {
            // Extension para WooCommerce Blocks
            if (window.wc && window.wc.blocksCheckout && 
                typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                
                // Define dados baseado no tipo do campo
                let data = {
                    billing_phone_formatted: '',
                    shipping_phone_formatted: '',
                    custom_phone_formatted: ''
                };
                
                // Se for campo custom, preenche os 3 campos com o mesmo valor
                if (phoneField && phoneField.id && phoneField.id.includes('custom-phone')) {
                    data.billing_phone_formatted = phoneValue || '';
                    data.shipping_phone_formatted = phoneValue || '';
                    data.custom_phone_formatted = phoneValue || '';
                } else {
                    // Para campos billing/shipping, identifica qual preencher
                    if (phoneField && phoneField.id && phoneField.id.includes('billing')) {
                        data.billing_phone_formatted = phoneValue || '';
                    } else if (phoneField && phoneField.id && phoneField.id.includes('shipping')) {
                        data.shipping_phone_formatted = phoneValue || '';
                    }
                }
                
                window.wc.blocksCheckout.extensionCartUpdate({
                    namespace: 'woo_better_phone_formatter',
                    data: data
                });
            }
            
            phoneUpdateTimeout = null;
        }, 500);
    }
    
    function updateHiddenFields(dialCode) {
        const fieldNames = ['billing_phone_country_code', 'shipping_phone_country_code'];
        
        fieldNames.forEach(fieldName => {
            // Remove campo existente se houver
            const existingField = document.querySelector(`input[name="${fieldName}"]`);
            if (existingField) {
                existingField.value = dialCode;
            } else {
                // Cria novo campo hidden
                const hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = fieldName;
                hiddenField.value = dialCode;
                
                const form = document.querySelector('form.checkout, form[name="checkout"]');
                if (form) {
                    form.appendChild(hiddenField);
                }
            }
        });
    }
    
    // Inicializa após DOM estar pronto
    initPhoneInput();
    
    // Inicializa campos básicos existentes
    initExistingPhoneFields();
    
    // Observer para detectar novos campos adicionados dinamicamente
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const phoneInputs = node.querySelectorAll ? 
                            node.querySelectorAll('input[id*="phone"], input[type="tel"]') : [];
                        
                        if (phoneInputs.length > 0 || 
                            (node.id && node.id.includes('phone')) ||
                            (node.type === 'tel')) {
                            setTimeout(() => {
                                initPhoneInput();
                                initExistingPhoneFields();
                            }, 100);
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

    // Sistema de bloqueio de submit para telefone customizado (mesmo padrão do campo de número)
    let phoneSubmitFound = false;
    let placeOrderButton = null;
    
    // Observer para detectar botão Place Order e implementar validação de telefone obrigatório
    const phoneSubmitObserver = new MutationObserver(function(mutations) {
        // Detecta o botão Place Order
        const placeOrderContainer = document.querySelector('.wc-block-checkout__actions_row');
        
        if (placeOrderContainer) {
            placeOrderButton = placeOrderContainer.querySelector('button');
        }
        
        // Se encontrou o botão e ainda não configurou o bloqueio
        if (placeOrderButton && !phoneSubmitFound) {
            phoneSubmitFound = true;
            
            // Verifica se deve aplicar validação (phoneRequired=true E highlightPhone=true)
            const isPhoneRequired = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                   wc_better_checkout_phone_mask_vars.phoneRequired === 'true');
            const isHighlightEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                       wc_better_checkout_phone_mask_vars.highlightPhone === 'true');
            
            // Só aplica validação se ambas condições forem verdadeiras
            if (isPhoneRequired && isHighlightEnabled) {
                placeOrderButton.addEventListener('click', handlePhoneValidation);
                
                function handlePhoneValidation(event) {
                    const customPhoneInput = document.getElementById('custom-phone');
                    
                    // Se o campo existe e está vazio
                    if (customPhoneInput && !customPhoneInput.value.trim().length) {
                        event.stopPropagation(); // Bloqueia a propagação 
                        event.preventDefault(); // Previne o envio do formulário
                        
                        // Cria ou exibe mensagem de erro
                        let phoneErrorDiv = document.querySelector('.wc-block-components-validation-error.wc-better-custom-phone');
                        if (!phoneErrorDiv) {
                            phoneErrorDiv = createPhoneErrorMessage();
                            const phoneContainer = customPhoneInput.closest('.wc-block-components-text-input');
                            if (phoneContainer) {
                                phoneContainer.appendChild(phoneErrorDiv);
                            }
                        }
                        
                        phoneErrorDiv.style.display = 'block';
                        
                        // Foca no campo e faz scroll suave
                        customPhoneInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        
                        // Timer para focar após o scroll
                        setTimeout(() => {
                            customPhoneInput.focus();
                        }, 500);
                    }
                }
                
                // Adiciona listener para esconder erro quando campo for preenchido
                const customPhoneField = document.getElementById('custom-phone');
                if (customPhoneField) {
                    customPhoneField.addEventListener('input', function() {
                        const phoneErrorDiv = document.querySelector('.wc-block-components-validation-error.wc-better-custom-phone');
                        if (phoneErrorDiv && customPhoneField.value.trim().length > 0) {
                            phoneErrorDiv.style.display = 'none';
                        }
                    });
                }
            }
        }
    });
    
    // Inicia o observer para o sistema de submit
    phoneSubmitObserver.observe(document.body, { childList: true, subtree: true });
    
    // Função para criar mensagem de erro do telefone (mesmo padrão do campo de número)
    function createPhoneErrorMessage() {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'wc-block-components-validation-error wc-better-custom-phone';
        errorDiv.setAttribute('role', 'alert');
        errorDiv.style.display = 'none';
        
        const errorParagraph = document.createElement('p');
        errorParagraph.id = 'validate-error-custom_phone';
        
        const errorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        errorSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        errorSvg.setAttribute('viewBox', '-2 -2 24 24');
        errorSvg.setAttribute('width', '24');
        errorSvg.setAttribute('height', '24');
        errorSvg.setAttribute('aria-hidden', 'true');
        errorSvg.setAttribute('focusable', 'false');
        
        const errorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        errorPath.setAttribute('d', 'M10 2c4.42 0 8 3.58 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z');
        
        errorSvg.appendChild(errorPath);
        const errorMessage = document.createElement('span');
        errorMessage.textContent = 'Por favor, insira um telefone válido.';
        
        errorParagraph.appendChild(errorSvg);
        errorParagraph.appendChild(errorMessage);
        errorDiv.appendChild(errorParagraph);
        
        return errorDiv;
    }

    // Segunda parte da inicialização - campos básicos
    function initExistingPhoneFields() {
        const phoneFields = [
            '#billing_phone',
            '#shipping_phone',
            '#billing-phone',
            '#shipping-phone'
        ];

        phoneFields.forEach(function(fieldSelector) {
            const phoneField = document.querySelector(fieldSelector);
            let countryChanged = false;
            let isFormatting = false;
            let lastFormattedValue = '';
            
            if (phoneField && !phoneField.dataset.intlTelInputInitialized) {
                
                let iti = intlTelInput(phoneField, {
                    initialCountry: 'br',
                    preferredCountries: ['br'],
                    separateDialCode: false,
                    nationalMode: false,
                    formatOnDisplay: false,
                    autoHideDialCode: false,
                    placeholderNumberType: "MOBILE",
                    showSelectedDialCode: false,
                    allowDropdown: true,
                    autoPlaceholder: "off",
                    strictMode: false,
                    validation: false,
                    i18n: pt,
                    utilsScript: intlTelInputUtils
                });

                phoneField.dataset.intlTelInputInitialized = 'true';
                adjustPhoneLabel(phoneField);
                
                // Adicionar watcher para detectar mudanças externas no campo
                let lastKnownValue = phoneField.value;
                const valueWatcher = setInterval(() => {
                    if (phoneField.value !== lastKnownValue) {
                        // Se a mudança externa removeu a formatação, reaplicamos
                        const currentValue = phoneField.value;
                        const wasFormatted = lastKnownValue.includes('(') || lastKnownValue.includes('-') || lastKnownValue.includes(' ');
                        const isUnformatted = !currentValue.includes('(') && !currentValue.includes('-') && currentValue.replace(/\D/g, '').length > 0;
                        
                        if (wasFormatted && isUnformatted && currentValue.startsWith('+')) {
                            // Aguarda um pouco para garantir que a mudança externa terminou
                            setTimeout(() => {
                                // Só formata se o valor ainda está sem formatação
                                if (!phoneField.value.includes('(') && !phoneField.value.includes('-') && phoneField.value.startsWith('+')) {
                                    // Simula um evento de input para reativar a formatação
                                    const syntheticEvent = {
                                        target: phoneField,
                                        type: 'input',
                                        inputType: 'insertText'
                                    };
                                    applyPhoneFormatting(syntheticEvent, 'External Change Recovery');
                                }
                            }, 150);
                        }
                        
                        lastKnownValue = phoneField.value;
                    }
                }, 100);
                
                // Formata valor inicial se já existir um número com +
                const initialValue = phoneField.value;
                if (initialValue && initialValue.includes('+')) {
                    setTimeout(() => {
                        formatInitialPhoneValue(initialValue);
                    }, 100);
                }
                
                // Atualiza o campo de código do país na inicialização
                setTimeout(() => {
                    const countryData = iti.getSelectedCountryData();
                    const dialCode = '+' + countryData.dialCode;
                    
                    // Cria ou atualiza campos hidden dinâmicos para capturar via hook
                    updateHiddenCountryCodeField(fieldSelector, dialCode);
                    
                    // Mantém compatibilidade com campos existentes se necessário
                    let targetFieldId = '';
                    if (fieldSelector.includes('billing')) {
                        targetFieldId = 'billing-phone_number-country_code';
                    } else if (fieldSelector.includes('shipping')) {
                        targetFieldId = 'shipping-phone_number-country_code';
                    }
                    
                    if (targetFieldId) {
                        const countryCodeField = document.getElementById(targetFieldId);
                        if (countryCodeField) {
                            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                            nativeSetter.call(countryCodeField, dialCode);
                            
                            const events = [
                                new Event('input', { bubbles: true }),
                                new Event('change', { bubbles: true })
                            ];
                            
                            events.forEach(event => {
                                countryCodeField.dispatchEvent(event);
                            });
                            
                            triggerReactChange(countryCodeField, dialCode);
                        }
                    }
                }, 50);
                
                function formatInitialPhoneValue(initialValue) {
                    try {
                        if (!initialValue || !initialValue.includes('+')) {
                            return;
                        }
                        
                        // Remove espaços e caracteres especiais, mantém só números após o +
                        const cleanValue = initialValue.replace(/[^\d+]/g, '');
                        
                        if (cleanValue.startsWith('+') && cleanValue.length > 1) {
                            // Extrai apenas os números após o +
                            const numbers = cleanValue.substring(1);
                            
                            if (numbers.length > 0) {
                                // Tenta diferentes tamanhos de código de país (1-4 dígitos)
                                let countryDetected = false;
                                
                                for (let codeLength = 1; codeLength <= 4 && !countryDetected; codeLength++) {
                                    if (numbers.length >= codeLength) {
                                        const potentialCode = numbers.substring(0, codeLength);
                                        const remainingNumber = numbers.substring(codeLength);
                                        
                                        // Tenta definir o país pelo código
                                        try {
                                            const testCountries = iti.getCountryData();
                                            const foundCountry = testCountries.find(country => 
                                                country.dialCode === potentialCode
                                            );
                                            
                                            if (foundCountry && remainingNumber.length > 0) {
                                                // País encontrado, define ele
                                                iti.setCountry(foundCountry.iso2);
                                                
                                                // Agora formata o número restante
                                                try {
                                                    const formatted = intlTelInputUtils.formatNumber(
                                                        remainingNumber, 
                                                        foundCountry.iso2, 
                                                        intlTelInputUtils.numberFormat.NATIONAL
                                                    );
                                        
                                        if (formatted && formatted !== 'Invalid number') {
                                            // Formato final: +{country_code} {número formatado}
                                            const finalValue = `+${potentialCode} ${formatted}`;
                                            
                                            updateHiddenCountryCodeField(fieldSelector, `+${potentialCode}`);
                                                        
                                                        triggerReactChange(phoneField, finalValue);
                                                        countryDetected = true;
                                                    }
                                                } catch (formatError) {
                                                    // Continua tentando outros tamanhos de código
                                                }
                                            }
                                        } catch (error) {
                                            // Continua tentando outros tamanhos de código
                                        }
                                    }
                                }
                                
                                // Se não conseguiu detectar o país, usa o país padrão
                                if (!countryDetected) {
                                    const countryData = iti.getSelectedCountryData();
                                    const dialCode = '+' + countryData.dialCode;
                                    
                                    try {
                                        const formatted = intlTelInputUtils.formatNumber(
                                            numbers, 
                                            countryData.iso2, 
                                            intlTelInputUtils.numberFormat.NATIONAL
                                        );

                                        if (formatted && formatted !== 'Invalid number') {
                                            const finalValue = `${dialCode} ${formatted}`;
                                            
                                            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                            nativeSetter.call(phoneField, finalValue);
                                            
                                            updateHiddenCountryCodeField(fieldSelector, dialCode);
                                            triggerReactChange(phoneField, finalValue);
                                        }
                                    } catch (formatError) {
                                        // Erro na formatação com país padrão
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        // Erro na formatação inicial do telefone
                    }
                }
                
                function applyPhoneFormatting(event, context = 'input') {
                    try {
                        // Evita formatação se já estamos formatando
                        if (isFormatting) {
                            return;
                        }
                        
                        const currentValue = phoneField.value;
                        
                        // Se o valor não mudou desde a última formatação, não faz nada
                        if (currentValue === lastFormattedValue) {
                            return;
                        }
                        
                        isFormatting = true;
                        
                        // Se o campo está vazio, só atualiza o valor e retorna
                        if (!currentValue || currentValue.trim() === '') {
                            triggerReactChange(phoneField, currentValue);
                            lastFormattedValue = currentValue;
                            isFormatting = false;
                            return;
                        }
                        
                        // Se o valor contém apenas caracteres especiais sem números, limpa o campo
                        // EXCETO se é apenas '+' no início (permite começar número internacional)
                        const onlyDigits = currentValue.replace(/\D/g, '');
                        if (onlyDigits === '' && currentValue.trim() !== '' && currentValue.trim() !== '+') {
                            const cursorPos = phoneField.selectionStart || 0;
                            setValueAndCursor('', cursorPos, currentValue, false);
                            lastFormattedValue = '';
                            isFormatting = false;
                            return;
                        }
                        
                        // NOVA DETECÇÃO: Números internacionais "despidos" de formatação
                        const strippedInternational = currentValue.match(/^\+(\d{1,4})(\d{6,15})$/);
                        if (strippedInternational) {
                            const countryCode = strippedInternational[1];
                            const phoneNumber = strippedInternational[2];
                            
                            // Tenta encontrar o país pelo código
                            const foundCountryCode = findCountryByDialCode(countryCode);
                            if (foundCountryCode) {
                                iti.setCountry(foundCountryCode);
                                
                                setTimeout(() => {
                                    try {
                                        const formatted = intlTelInputUtils.formatNumber(
                                            phoneNumber, 
                                            foundCountryCode, 
                                            intlTelInputUtils.numberFormat.NATIONAL
                                        );
                                        
                                        if (formatted && formatted !== 'Invalid number') {
                                            // Verifica se a formatação não remove dígitos
                                            const inputDigits = phoneNumber.replace(/\D/g, '');
                                            const outputDigits = formatted.replace(/\D/g, '');
                                            
                                            if (inputDigits === outputDigits) {
                                                const finalValue = `+${countryCode} ${formatted}`;
                                                const cursorPos = phoneField.selectionStart || 0;
                                                setValueAndCursor(finalValue, cursorPos, currentValue, false);
                                                lastFormattedValue = finalValue;
                                                isFormatting = false;
                                                return;
                                            }
                                        }
                                    } catch (formatError) {
                                        // Se erro na formatação, continua para próxima lógica
                                    }
                                }, 50);
                            }
                        }
                        
                        const internationalWithSpace = currentValue.match(/^\+(\d{1,4})\s+(.*)$/);
                        
                        if (internationalWithSpace) {
                            const userDialCode = internationalWithSpace[1]; // Código que o usuário digitou
                            
                            // Deixa a biblioteca detectar automaticamente e usa getSelectedCountryData
                            setTimeout(() => {
                                const countryData = iti.getSelectedCountryData();
                                
                                if (countryData && countryData.dialCode) {
                                    const detectedDialCode = countryData.dialCode;
                                    const localNumber = internationalWithSpace[2];
                                    
                                    // Se o usuário está digitando um código diferente do detectado, não formata ainda
                                    if (userDialCode !== detectedDialCode) {
                                        lastFormattedValue = currentValue;
                                        isFormatting = false;
                                        return;
                                    }
                                    
                                    // Formata o número local e reconecta com código
                                    const cleanLocalNumber = localNumber.replace(/\D/g, '');
                                    
                                    if (cleanLocalNumber.length > 0) {
                                        try {
                                            const formatted = intlTelInputUtils.formatNumber(
                                                cleanLocalNumber, 
                                                countryData.iso2, 
                                                intlTelInputUtils.numberFormat.NATIONAL
                                            );

                                            // VERIFICAÇÃO CRÍTICA: Impede formatação que remove dígitos
                                            const inputDigits = cleanLocalNumber.replace(/\D/g, '');
                                            const outputDigits = formatted.replace(/\D/g, '');

                                            if (formatted && formatted !== 'Invalid number') {
                                                // Se a formatação removeu dígitos, NÃO aplica
                                                if (inputDigits.length > outputDigits.length) {
                                                    const finalValue = `+${userDialCode} ${cleanLocalNumber}`;
                                                    const cursorPos = phoneField.selectionStart || 0;
                                                    setValueAndCursor(finalValue, cursorPos, currentValue, false);
                                                    lastFormattedValue = finalValue;
                                                    isFormatting = false;
                                                    return;
                                                }
                                                
                                                // Usa o código que o usuário digitou, não o detectado pela biblioteca
                                                const finalValue = `+${userDialCode} ${formatted}`;
                                                
                                                setTimeout(() => {
                                                    const cursorPos = phoneField.selectionStart || 0;
                                                    setValueAndCursor(finalValue, cursorPos, currentValue, false);
                                                    lastFormattedValue = finalValue;
                                                    isFormatting = false;
                                                }, 10);
                                                return;
                                            }
                                        } catch (formatError) {
                                            // Se erro na formatação, mantém o valor original
                                            lastFormattedValue = currentValue;
                                            isFormatting = false;
                                            return;
                                        }
                                    }
                                }
                            }, 50); // Pequeno delay para garantir processamento da biblioteca
                        }
                        
                        const internationalWithoutSpace = currentValue.match(/^\+(\d{1,4})(\d+)$/);
                        
                        if (internationalWithoutSpace) {
                            const potentialDialCode = internationalWithoutSpace[1];
                            const restOfNumber = internationalWithoutSpace[2];
                            
                            // Verifica se tem números suficientes após o código
                            if (restOfNumber.length > 0) {
                                // Tenta diferentes tamanhos de código de país, do MAIOR para o MENOR (4→3→2→1)
                                let countryDetected = false;
                                const fullNumber = potentialDialCode + restOfNumber;
                                
                                for (let codeLength = Math.min(4, potentialDialCode.length + restOfNumber.length); codeLength >= 1 && !countryDetected; codeLength--) {
                                    if (fullNumber.length >= codeLength) {
                                        const testCode = fullNumber.substring(0, codeLength);
                                        const remainingNumber = fullNumber.substring(codeLength);
                                        
                                        const foundCountryCode = findCountryByDialCode(testCode);
                                        
                                        if (foundCountryCode && remainingNumber.length > 0) {
                                            // Define o país detectado
                                            iti.setCountry(foundCountryCode);
                                            
                                            setTimeout(() => {
                                                const countryData = iti.getSelectedCountryData();
                                                
                                                if (countryData && countryData.dialCode === testCode) {
                                                    // Formata apenas o número local (sem incluir o código do país)
                                                    const cleanLocalNumber = remainingNumber.replace(/\D/g, '');
                                                    
                                                    if (cleanLocalNumber.length > 0) {
                                                        try {
                                                            const formatted = intlTelInputUtils.formatNumber(
                                                                cleanLocalNumber, 
                                                                countryData.iso2, 
                                                                intlTelInputUtils.numberFormat.NATIONAL
                                                            );

                                                            if (formatted && formatted !== 'Invalid number') {
                                                                const inputDigits = cleanLocalNumber.replace(/\D/g, '');
                                                                const outputDigits = formatted.replace(/\D/g, '');
                                                                
                                                                if (inputDigits.length > outputDigits.length) {
                                                                    const finalValue = `+${testCode} ${cleanLocalNumber}`;
                                                                    const cursorPos = phoneField.selectionStart || 0;
                                                                    setValueAndCursor(finalValue, cursorPos, currentValue, false);
                                                                } else {
                                                                    const finalValue = `+${testCode} ${formatted}`;
                                                                    const cursorPos = phoneField.selectionStart || 0;
                                                                    setValueAndCursor(finalValue, cursorPos, currentValue, false);
                                                                }
                                                                
                                                                lastFormattedValue = phoneField.value;
                                                                isFormatting = false;
                                                                countryDetected = true;
                                                                return;
                                                            }
                                                        } catch (formatError) {
                                                            // Continua tentando outros tamanhos
                                                        }
                                                    }
                                                }
                                            }, 50);
                                            
                                            if (countryDetected) break;
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Se é um número nacional, aplica formatação nacional
                        if (!currentValue.startsWith('+')) {
                            const cleanValue = currentValue.replace(/\D/g, '');
                            const countryData = iti.getSelectedCountryData();
                            
                            if (countryData && countryData.dialCode && countryData.iso2 && countryData.dialCode !== 'undefined' && cleanValue.length > 0) {
                                try {
                                    const formatted = intlTelInputUtils.formatNumber(
                                        cleanValue, 
                                        countryData.iso2, 
                                        intlTelInputUtils.numberFormat.NATIONAL
                                    );
                                    
                                    if (formatted && formatted !== 'Invalid number' && formatted !== currentValue) {
                                        const inputDigits = cleanValue.replace(/\D/g, '');
                                        const outputDigits = formatted.replace(/\D/g, '');
                                        
                                        if (inputDigits === outputDigits) {
                                            const cursorPos = phoneField.selectionStart || 0;
                                            setValueAndCursor(formatted, cursorPos, currentValue, false);
                                            lastFormattedValue = formatted;
                                            isFormatting = false;
                                            return;
                                        }
                                    }
                                } catch (formatError) {
                                    // Erro na formatação nacional
                                }
                            }
                        }
                        
                        // Para qualquer outro caso, notifica o React
                        triggerReactChange(phoneField, currentValue);
                        lastFormattedValue = currentValue;
                        isFormatting = false;
                    } catch (error) {
                        // Erro na aplicação da máscara
                        isFormatting = false;
                    }
                }
                
                // Função para preservar posição do cursor durante formatação
                function setValueAndCursor(newValue, originalCursorPos, originalValue, isDeletion = false) {
                    try {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(phoneField, newValue);
                        
                        // Calcula nova posição do cursor de forma mais inteligente
                        let newCursorPos = calculateSmartCursorPosition(originalValue, newValue, originalCursorPos, isDeletion);
                        
                        // Garante que a posição está dentro dos limites
                        newCursorPos = Math.max(0, Math.min(newCursorPos, newValue.length));
                        
                        // Restaura a posição do cursor
                        if (phoneField.setSelectionRange) {
                            phoneField.setSelectionRange(newCursorPos, newCursorPos);
                        }
                        
                        triggerReactChange(phoneField, newValue);
                    } catch (error) {
                        // Erro ao definir valor e cursor
                        // Fallback sem preservação de cursor
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(phoneField, newValue);
                        triggerReactChange(phoneField, newValue);
                    }
                }
                
                // Função para calcular posição inteligente do cursor
                function calculateSmartCursorPosition(originalValue, newValue, originalCursorPos, isDeletion = false) {
                    // Se os valores são iguais, mantém a posição
                    if (originalValue === newValue) {
                        return originalCursorPos;
                    }
                    
                    // Proteção contra cursor fora dos limites
                    if (originalCursorPos > originalValue.length) {
                        return newValue.length;
                    }
                    
                    // Se cursor está no início, mantém no início
                    if (originalCursorPos === 0) {
                        return 0;
                    }
                    
                    // Se cursor está no final, mantém no final
                    if (originalCursorPos >= originalValue.length) {
                        return newValue.length;
                    }
                    
                    // Para números internacionais, trata de forma especial
                    if (originalValue.startsWith('+') && newValue.startsWith('+')) {
                        // Se o cursor está na parte do código do país (+XX), preserva posição relativa
                        const firstSpacePos = newValue.indexOf(' ');
                        if (firstSpacePos > 0 && originalCursorPos <= firstSpacePos) {
                            // Cursor está no código do país, mantém posição similar
                            return Math.min(originalCursorPos, firstSpacePos);
                        }
                    }
                    
                    // Extrai apenas dígitos de ambos os valores para mapear posições
                    const originalDigits = originalValue.replace(/\D/g, '');
                    const newValueDigits = newValue.replace(/\D/g, '');
                    
                    // Conta quantos dígitos há antes da posição original do cursor
                    const textBeforeCursor = originalValue.substring(0, originalCursorPos);
                    const digitsBeforeCursor = textBeforeCursor.replace(/\D/g, '').length;
                    
                    // Se não há dígitos antes do cursor, coloca no início
                    if (digitsBeforeCursor === 0) {
                        return 0;
                    }
                    
                    // Encontra a posição no novo valor onde temos o mesmo número de dígitos
                    let digitCount = 0;
                    let newPosition = 0;
                    
                    for (let i = 0; i < newValue.length; i++) {
                        const char = newValue[i];
                        
                        if (/\d/.test(char)) {
                            digitCount++;
                            
                            // Se chegamos ao número de dígitos que havia antes do cursor original
                            if (digitCount === digitsBeforeCursor) {
                                newPosition = i + 1; // Posição após este dígito
                                break;
                            }
                        }
                        
                        // Se ainda não chegamos no número de dígitos, continua
                        if (digitCount < digitsBeforeCursor) {
                            newPosition = i + 1;
                        }
                    }
                    
                    // Se não conseguimos encontrar dígitos suficientes, vai para o final
                    if (digitCount < digitsBeforeCursor) {
                        return newValue.length;
                    }
                    
                    // Garante que a posição não seja maior que o comprimento
                    newPosition = Math.min(newPosition, newValue.length);
                    
                    return newPosition;
                }

                // Função para encontrar país pelo código de discagem
                function findCountryByDialCode(dialCode) {
                    const dialCodeMap = {
                        '1': 'us',    // Estados Unidos/Canadá
                        '7': 'ru',    // Rússia
                        '20': 'eg',   // Egito
                        '27': 'za',   // África do Sul
                        '30': 'gr',   // Grécia
                        '31': 'nl',   // Holanda
                        '32': 'be',   // Bélgica
                        '33': 'fr',   // França
                        '34': 'es',   // Espanha
                        '36': 'hu',   // Hungria
                        '39': 'it',   // Itália
                        '40': 'ro',   // Romênia
                        '41': 'ch',   // Suíça
                        '43': 'at',   // Áustria
                        '44': 'gb',   // Reino Unido
                        '45': 'dk',   // Dinamarca
                        '46': 'se',   // Suécia
                        '47': 'no',   // Noruega
                        '48': 'pl',   // Polônia
                        '49': 'de',   // Alemanha
                        '51': 'pe',   // Peru
                        '52': 'mx',   // México
                        '53': 'cu',   // Cuba
                        '54': 'ar',   // Argentina
                        '55': 'br',   // Brasil
                        '56': 'cl',   // Chile
                        '57': 'co',   // Colômbia
                        '58': 've',   // Venezuela
                        '60': 'my',   // Malásia
                        '61': 'au',   // Austrália
                        '62': 'id',   // Indonésia
                        '63': 'ph',   // Filipinas
                        '64': 'nz',   // Nova Zelândia
                        '65': 'sg',   // Singapura
                        '66': 'th',   // Tailândia
                        '81': 'jp',   // Japão
                        '82': 'kr',   // Coreia do Sul
                        '84': 'vn',   // Vietnã
                        '86': 'cn',   // China
                        '90': 'tr',   // Turquia
                        '91': 'in',   // Índia
                        '92': 'pk',   // Paquistão
                        '93': 'af',   // Afeganistão
                        '94': 'lk',   // Sri Lanka
                        '95': 'mm',   // Myanmar
                        '98': 'ir',   // Irã
                        '212': 'ma',  // Marrocos
                        '213': 'dz',  // Argélia
                        '216': 'tn',  // Tunísia
                        '218': 'ly',  // Líbia
                        '220': 'gm',  // Gâmbia
                        '221': 'sn',  // Senegal
                        '222': 'mr',  // Mauritânia
                        '223': 'ml',  // Mali
                        '224': 'gn',  // Guiné
                        '225': 'ci',  // Costa do Marfim
                        '226': 'bf',  // Burkina Faso
                        '227': 'ne',  // Níger
                        '228': 'tg',  // Togo
                        '229': 'bj',  // Benin
                        '230': 'mu',  // Maurício
                        '231': 'lr',  // Libéria
                        '232': 'sl',  // Serra Leoa
                        '233': 'gh',  // Gana
                        '234': 'ng',  // Nigéria
                        '235': 'td',  // Chade
                        '236': 'cf',  // República Centro-Africana
                        '237': 'cm',  // Camarões
                        '238': 'cv',  // Cabo Verde
                        '239': 'st',  // São Tomé e Príncipe
                        '240': 'gq',  // Guiné Equatorial
                        '241': 'ga',  // Gabão
                        '242': 'cg',  // Congo
                        '243': 'cd',  // República Democrática do Congo
                        '244': 'ao',  // Angola
                        '245': 'gw',  // Guiné-Bissau
                        '246': 'io',  // Território Britânico do Oceano Índico
                        '247': 'ac',  // Ilha de Ascensão
                        '248': 'sc',  // Seychelles
                        '249': 'sd',  // Sudão
                        '250': 'rw',  // Ruanda
                        '251': 'et',  // Etiópia
                        '252': 'so',  // Somália
                        '253': 'dj',  // Djibuti
                        '254': 'ke',  // Quênia
                        '255': 'tz',  // Tanzânia
                        '256': 'ug',  // Uganda
                        '257': 'bi',  // Burundi
                        '258': 'mz',  // Moçambique
                        '260': 'zm',  // Zâmbia
                        '261': 'mg',  // Madagascar
                        '262': 're',  // Reunião
                        '263': 'zw',  // Zimbábue
                        '264': 'na',  // Namíbia
                        '265': 'mw',  // Malawi
                        '266': 'ls',  // Lesoto
                        '267': 'bw',  // Botswana
                        '268': 'sz',  // Suazilândia
                        '269': 'km',  // Comores
                        '290': 'sh',  // Santa Helena
                        '291': 'er',  // Eritreia
                        '297': 'aw',  // Aruba
                        '298': 'fo',  // Ilhas Faroé
                        '299': 'gl',  // Groenlândia
                        '350': 'gi',  // Gibraltar
                        '351': 'pt',  // Portugal
                        '352': 'lu',  // Luxemburgo
                        '353': 'ie',  // Irlanda
                        '354': 'is',  // Islândia
                        '355': 'al',  // Albânia
                        '356': 'mt',  // Malta
                        '357': 'cy',  // Chipre
                        '358': 'fi',  // Finlândia
                        '359': 'bg',  // Bulgária
                        '370': 'lt',  // Lituânia
                        '371': 'lv',  // Letônia
                        '372': 'ee',  // Estônia
                        '373': 'md',  // Moldávia
                        '374': 'am',  // Armênia
                        '375': 'by',  // Bielorrússia
                        '376': 'ad',  // Andorra
                        '377': 'mc',  // Mônaco
                        '378': 'sm',  // San Marino
                        '380': 'ua',  // Ucrânia
                        '381': 'rs',  // Sérvia
                        '382': 'me',  // Montenegro
                        '383': 'xk',  // Kosovo
                        '385': 'hr',  // Croácia
                        '386': 'si',  // Eslovênia
                        '387': 'ba',  // Bósnia e Herzegovina
                        '389': 'mk',  // Macedônia do Norte
                        '420': 'cz',  // República Checa
                        '421': 'sk',  // Eslováquia
                        '423': 'li',  // Liechtenstein
                        '500': 'fk',  // Ilhas Malvinas
                        '501': 'bz',  // Belize
                        '502': 'gt',  // Guatemala
                        '503': 'sv',  // El Salvador
                        '504': 'hn',  // Honduras
                        '505': 'ni',  // Nicarágua
                        '506': 'cr',  // Costa Rica
                        '507': 'pa',  // Panamá
                        '508': 'pm',  // São Pedro e Miquelon
                        '509': 'ht',  // Haiti
                        '590': 'gp',  // Guadalupe
                        '591': 'bo',  // Bolívia
                        '592': 'gy',  // Guiana
                        '593': 'ec',  // Equador
                        '594': 'gf',  // Guiana Francesa
                        '595': 'py',  // Paraguai
                        '596': 'mq',  // Martinica
                        '597': 'sr',  // Suriname
                        '598': 'uy',  // Uruguai
                        '599': 'cw',  // Curaçao
                        '670': 'tl',  // Timor-Leste
                        '672': 'aq',  // Antártida
                        '673': 'bn',  // Brunei
                        '674': 'nr',  // Nauru
                        '675': 'pg',  // Papua-Nova Guiné
                        '676': 'to',  // Tonga
                        '677': 'sb',  // Ilhas Salomão
                        '678': 'vu',  // Vanuatu
                        '679': 'fj',  // Fiji
                        '680': 'pw',  // Palau
                        '681': 'wf',  // Wallis e Futuna
                        '682': 'ck',  // Ilhas Cook
                        '683': 'nu',  // Niue
                        '684': 'as',  // Samoa Americana
                        '685': 'ws',  // Samoa
                        '686': 'ki',  // Kiribati
                        '687': 'nc',  // Nova Caledônia
                        '688': 'tv',  // Tuvalu
                        '689': 'pf',  // Polinésia Francesa
                        '690': 'tk',  // Tokelau
                        '691': 'fm',  // Estados Federados da Micronésia
                        '692': 'mh',  // Ilhas Marshall
                        '850': 'kp',  // Coreia do Norte
                        '852': 'hk',  // Hong Kong
                        '853': 'mo',  // Macau
                        '855': 'kh',  // Camboja
                        '856': 'la',  // Laos
                        '880': 'bd',  // Bangladesh
                        '886': 'tw',  // Taiwan
                        '960': 'mv',  // Maldivas
                        '961': 'lb',  // Líbano
                        '962': 'jo',  // Jordânia
                        '963': 'sy',  // Síria
                        '964': 'iq',  // Iraque
                        '965': 'kw',  // Kuwait
                        '966': 'sa',  // Arábia Saudita
                        '967': 'ye',  // Iêmen
                        '968': 'om',  // Omã
                        '970': 'ps',  // Palestina
                        '971': 'ae',  // Emirados Árabes Unidos
                        '972': 'il',  // Israel
                        '973': 'bh',  // Bahrein
                        '974': 'qa',  // Catar
                        '975': 'bt',  // Butão
                        '976': 'mn',  // Mongólia
                        '977': 'np',  // Nepal
                        '992': 'tj',  // Tadjiquistão
                        '993': 'tm',  // Turcomenistão
                        '994': 'az',  // Azerbaijão
                        '995': 'ge',  // Geórgia
                        '996': 'kg',  // Quirguistão
                        '998': 'uz'   // Uzbequistão
                    };
                    
                    return dialCodeMap[dialCode] || null;
                }

                // SISTEMA DE DEBOUNCE PARA PHONE UPDATES (evita múltiplas requisições)
                let phoneUpdateTimeout;
                let pendingPhoneData = {
                    billing_phone_formatted: '',
                    shipping_phone_formatted: '',
                    custom_phone_formatted: ''
                };
                
                function triggerReactChange(input, newValue) {
                    try {
                        if (!input || typeof input !== 'object') {
                            return;
                        }

                        // SISTEMA DE DEBOUNCE PARA PHONE UPDATES
                        const isPhoneField = (input.id && input.id.includes('phone')) || (input.name && input.name.includes('phone'));
                        
                        if (isPhoneField) {
                            // Cancela timeout anterior se existir
                            if (phoneUpdateTimeout) {
                                clearTimeout(phoneUpdateTimeout);
                            }
                            
                            // Atualiza dados pendentes baseado no tipo do campo
                            if (input.id === 'custom-phone') {
                                // Campo custom: preenche os 3 campos com o mesmo valor
                                pendingPhoneData.billing_phone_formatted = newValue;
                                pendingPhoneData.shipping_phone_formatted = newValue;
                                pendingPhoneData.custom_phone_formatted = newValue;
                            } else if (input.id.includes('billing')) {
                                // Campo billing: só preenche billing_phone_formatted  
                                pendingPhoneData.billing_phone_formatted = newValue;
                                pendingPhoneData.shipping_phone_formatted = '';
                                pendingPhoneData.custom_phone_formatted = '';
                            } else if (input.id.includes('shipping')) {
                                // Campo shipping: só preenche shipping_phone_formatted
                                pendingPhoneData.shipping_phone_formatted = newValue;
                                pendingPhoneData.billing_phone_formatted = '';
                                pendingPhoneData.custom_phone_formatted = '';
                            }
                            
                            // Agenda execução em 1s (agrupa mudanças rápidas)
                            phoneUpdateTimeout = setTimeout(() => {
                                if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                    window.wc.blocksCheckout.extensionCartUpdate({
                                        namespace: 'woo_better_phone_formatter',
                                        data: pendingPhoneData
                                    });
                                }
                                
                                phoneUpdateTimeout = null;
                            }, 1000);
                        }

                        const reactKey = Object.keys(input).find(key => 
                            key.startsWith('__reactInternalInstance') || 
                            key.startsWith('__reactFiber')
                        );
                        
                        if (reactKey) {
                            const reactInstance = input[reactKey];
                            if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
                                try {
                                    const fakeEvent = {
                                        target: input,
                                        currentTarget: input,
                                        preventDefault: () => {},
                                        stopPropagation: () => {}
                                    };
                                    
                                    reactInstance.memoizedProps.onChange(fakeEvent);
                                    return;
                                } catch (reactError) {
                                    // Silent error handling
                                }
                            }
                        }

                        const tracker = input._valueTracker;
                        if (tracker) {
                            tracker.setValue('');
                        }
                        
                        const events = [
                            new Event('focusin', { bubbles: true }),
                            new Event('focus', { bubbles: true }),
                            new InputEvent('beforeinput', { bubbles: true, cancelable: true, data: newValue }),
                            new Event('input', { bubbles: true }),
                            new Event('change', { bubbles: true }),
                            new Event('blur', { bubbles: true }),
                            new Event('focusout', { bubbles: true })
                        ];

                        events.forEach(event => {
                            try {
                                Object.defineProperty(event, 'target', {
                                    writable: false,
                                    value: input
                                });
                                
                                Object.defineProperty(event, 'currentTarget', {
                                    writable: false,
                                    value: input
                                });
                            } catch (defineError) {
                                // Silent error handling
                            }
                        });

                    setTimeout(() => {
                            try {
                                events.forEach((event, index) => {
                                    setTimeout(() => {
                                        if (input && typeof input.dispatchEvent === 'function') {
                                            input.dispatchEvent(event);
                                        }
                                    }, index * 5);
                                });
                            } catch (eventError) {
                                // Silent error handling
                            }
                        }, 0);
                        
                    } catch (mainError) {
                        // Silent error handling
                    }
                }
                
                // Função para criar/atualizar campos hidden dinâmicos
                function updateHiddenCountryCodeField(fieldSelector, dialCode) {
                    // Garante que dialCode seja uma string válida
                    const countryCode = String(dialCode || '+55');
                    
                    let fieldName = '';
                    let otherFieldName = '';
                    if (fieldSelector.includes('billing')) {
                        fieldName = 'billing_phone_country_code';
                        otherFieldName = 'shipping_phone_country_code';
                    } else if (fieldSelector.includes('shipping')) {
                        fieldName = 'shipping_phone_country_code';
                        otherFieldName = 'billing_phone_country_code';
                    }
                    if (fieldName) {
                        // Para Block Checkout
                        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
                            try {
                                const { dispatch, select } = wp.data;
                                
                                // Verifica se é WooCommerce Blocks
                                if (dispatch('wc/store/checkout')) {
                                    const checkoutDispatch = dispatch('wc/store/checkout');
                                    
                                    // Usa o método correto para definir extension data
                                    if (checkoutDispatch.setExtensionData) {
                                        const currentData = select('wc/store/checkout').getExtensionData() || {};
                                        let phoneCountryData = currentData['woo_better_phone_country'] || {};
                                        
                                        // Sempre garantir que ambos os campos existam como strings
                                        phoneCountryData['billing_phone_country_code'] = phoneCountryData['billing_phone_country_code'] || '+55';
                                        phoneCountryData['shipping_phone_country_code'] = phoneCountryData['shipping_phone_country_code'] || '+55';
                                        
                                        // Define o campo específico
                                        phoneCountryData[fieldName] = countryCode;
                                        
                                        // Se o outro campo não existir no DOM, define o mesmo valor para ambos
                                        const otherFieldSelector = fieldSelector.includes('billing') ? 
                                            '#shipping_phone, #shipping-phone' : 
                                            '#billing_phone, #billing-phone';
                                        const otherFieldExists = document.querySelector(otherFieldSelector);
                                        
                                        if (!otherFieldExists) {
                                            phoneCountryData[otherFieldName] = countryCode;
                                        }
                                        
                                        checkoutDispatch.setExtensionData('woo_better_phone_country', phoneCountryData);
                                    } else if (checkoutDispatch.__unstableSetExtensionData) {
                                        // Fallback para versões antigas
                                        const currentData = select('wc/store/checkout').getExtensionData() || {};
                                        let phoneCountryData = currentData['woo_better_phone_country'] || {};
                                        
                                        // Sempre garantir que ambos os campos existam como strings
                                        phoneCountryData['billing_phone_country_code'] = phoneCountryData['billing_phone_country_code'] || '+55';
                                        phoneCountryData['shipping_phone_country_code'] = phoneCountryData['shipping_phone_country_code'] || '+55';
                                        
                                        // Define o campo específico
                                        phoneCountryData[fieldName] = countryCode;
                                        
                                        // Se o outro campo não existir no DOM, define o mesmo valor para ambos
                                        const otherFieldSelector = fieldSelector.includes('billing') ? 
                                            '#shipping_phone, #shipping-phone' : 
                                            '#billing_phone, #billing-phone';
                                        const otherFieldExists = document.querySelector(otherFieldSelector);
                                        
                                        if (!otherFieldExists) {
                                            phoneCountryData[otherFieldName] = countryCode;
                                        }
                                        
                                        checkoutDispatch.__unstableSetExtensionData('woo_better_phone_country', phoneCountryData);
                                    }
                                }
                            } catch (error) {
                                // Silenciar erro
                            }
                        }
                        
                        // Para checkout tradicional
                        // Remove campo existente se houver
                        const existingField = document.querySelector(`input[name="${fieldName}"]`);
                        if (existingField) {
                            existingField.remove();
                        }
                        
                        // Cria novo campo hidden
                        const hiddenField = document.createElement('input');
                        hiddenField.type = 'hidden';
                        hiddenField.name = fieldName;
                        hiddenField.value = countryCode;
                        
                        // Verifica se o outro campo de telefone existe no formulário tradicional
                        const otherFieldSelector = fieldSelector.includes('billing') ? 
                            '#shipping_phone, #shipping-phone' : 
                            '#billing_phone, #billing-phone';
                        const otherFieldExists = document.querySelector(otherFieldSelector);
                        
                        // Se o outro campo não existir, cria também o hidden para o outro endereço
                        if (!otherFieldExists) {
                            const existingOtherField = document.querySelector(`input[name="${otherFieldName}"]`);
                            if (existingOtherField) {
                                existingOtherField.remove();
                            }
                            
                            const otherHiddenField = document.createElement('input');
                            otherHiddenField.type = 'hidden';
                            otherHiddenField.name = otherFieldName;
                            otherHiddenField.value = countryCode;
                            
                            const checkoutForm = document.querySelector('form.checkout');
                            if (checkoutForm) {
                                checkoutForm.appendChild(otherHiddenField);
                            }
                        }
                        
                        // Adiciona o campo principal ao formulário tradicional
                        const checkoutForm = document.querySelector('form.checkout');
                        if (checkoutForm) {
                            checkoutForm.appendChild(hiddenField);
                        }
                    }
                }
                
                if (!phoneField.dataset.inputListenerAdded) {
                    let inputTimeout;
                    
                    phoneField.addEventListener('input', function(event) {
                        // Cancela timeout anterior se existir (debounce para operações rápidas)
                        if (inputTimeout) {
                            clearTimeout(inputTimeout);
                        }
                        
                        // Só aplica formatação se não for uma mudança de seleção/cursor
                        if (event.inputType !== 'insertCompositionText' && 
                            event.inputType !== 'selectAll' &&
                            !event.isComposing) {
                            
                            // Para operações de deleção, usa delay menor para melhor responsividade
                            const isDelete = event.inputType === 'deleteContentBackward' || 
                                           event.inputType === 'deleteContentForward' ||
                                           event.data === null;
                            const delay = isDelete ? 5 : 10;
                            
                            inputTimeout = setTimeout(() => {
                                applyPhoneFormatting(event, 'Input');
                            }, delay);
                        }
                    }, { passive: true });
                    phoneField.dataset.inputListenerAdded = 'true';
                }

                if (!phoneField.dataset.countryChangeListenerAdded) {
                    let countryChangeTimeout;
                    phoneField.addEventListener('countrychange', function(event) {
                        // Debounce para evitar múltiplos eventos
                        if (countryChangeTimeout) {
                            clearTimeout(countryChangeTimeout);
                        }
                        
                        countryChangeTimeout = setTimeout(() => {
                        
                        // Captura o código do país selecionado
                        const countryData = iti.getSelectedCountryData();
                        
                        // Verifica se o countryData é válido
                        if (!countryData || !countryData.dialCode || countryData.dialCode === 'undefined') {
                            return;
                        }
                        
                        countryChanged = true;
                        const dialCode = '+' + countryData.dialCode;
                        
                        // Atualiza campos hidden dinâmicos
                        updateHiddenCountryCodeField(fieldSelector, dialCode);
                        
                        // Mantém compatibilidade com campos existentes se necessário
                        let targetFieldId = '';
                        if (fieldSelector.includes('billing')) {
                            targetFieldId = 'billing-phone_number-country_code';
                        } else if (fieldSelector.includes('shipping')) {
                            targetFieldId = 'shipping-phone_number-country_code';
                        }
                        
                        if (targetFieldId) {
                            const countryCodeField = document.getElementById(targetFieldId);
                            if (countryCodeField) {
                                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                nativeSetter.call(countryCodeField, dialCode);
                                
                                const events = [
                                    new Event('input', { bubbles: true }),
                                    new Event('change', { bubbles: true })
                                ];
                                
                                events.forEach(event => {
                                    countryCodeField.dispatchEvent(event);
                                });
                                
                                triggerReactChange(countryCodeField, dialCode);
                            }
                        }
                        
                        Promise.resolve().then(() => {
                            // Só aplica formatação se o campo não está bem formatado
                            const currentVal = phoneField.value;
                            // Se já tem formatação de telefone brasileiro OU se está digitando código internacional
                            if (currentVal.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/) || 
                                currentVal.match(/^\+\d{1,4}\s/) ||
                                (currentVal.startsWith('+') && currentVal.replace(/\D/g, '').length <= 4)) {
                                return;
                            }
                            applyPhoneFormatting(event, 'Country Change');
                        });
                        
                        }, 100); // 100ms debounce
                    }, { passive: true });
                    phoneField.dataset.countryChangeListenerAdded = 'true';
                }

                // Safari iOS Autofill Detection e Correção
                let autofillDetected = false;
                
                if (!phoneField.dataset.safariAutofillListenerAdded) {
                    phoneField.addEventListener('animationstart', function(e) {
                        if (e.animationName === 'onautofillstart') {
                            autofillDetected = true;
                            // Chama diretamente a formatação quando detecta autofill
                            applyPhoneFormatting(e, 'Safari Autofill Correction');
                            autofillDetected = false;
                        }
                    });
                    
                    phoneField.dataset.safariAutofillListenerAdded = 'true';
                }
            }
        });
    }

    function adjustPhoneLabel(phoneField) {
        // Aplica !important no input e calcula padding para label
        let inputPadding = 52;
        if (phoneField && phoneField.tagName === 'INPUT') {
            // Tenta pegar o padding-left inline, senão computado
            let pl = phoneField.style.paddingLeft || window.getComputedStyle(phoneField).paddingLeft;
            if (pl && pl.endsWith('px')) {
                inputPadding = parseInt(pl.replace('px', ''), 10);
            }
            phoneField.style.setProperty('padding-left', inputPadding + 'px', 'important');
        }

        // Define padding da label dinamicamente (+4px do input)
        const label = phoneField.closest('.form-row, .wc-block-components-text-input')?.querySelector('label');
        if (label) {
            let labelPad = (inputPadding + 4) + 'px';
            label.style.setProperty('padding-left', labelPad, 'important');
            label.style.transition = 'all 0.3s ease';
            if (label.classList.contains('screen-reader-text') || getComputedStyle(label).position === 'absolute') {
                label.style.setProperty('left', labelPad, 'important');
                label.style.setProperty('padding-left', '0px', 'important');
            }
        }

        const blockLabel = phoneField.closest('.wc-block-components-text-input')?.querySelector('.wc-block-components-text-input__label');
        if (blockLabel) {
            let labelPad = (inputPadding + 4) + 'px';
            blockLabel.style.setProperty('padding-left', labelPad, 'important');
            blockLabel.style.transition = 'all 0.3s ease';
        }

        // Campo já ajustado
    }





    // Função para inicializar campos no Store API
    function initializeStoreAPIFields() {
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch, select } = wp.data;
                
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    
                    if (checkoutDispatch.setExtensionData) {
                        const currentData = select('wc/store/checkout').getExtensionData() || {};
                        const phoneCountryData = currentData['woo_better_phone_country'] || {};
                        
                        // Sempre garantir que ambos os campos existam como strings
                        if (!phoneCountryData['billing_phone_country_code']) {
                            phoneCountryData['billing_phone_country_code'] = '+55';
                        }
                        if (!phoneCountryData['shipping_phone_country_code']) {
                            phoneCountryData['shipping_phone_country_code'] = '+55';
                        }
                        
                        checkoutDispatch.setExtensionData('woo_better_phone_country', phoneCountryData);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }
    }

    // Inicializar campos do Store API
    initializeStoreAPIFields();
});