import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import intlTelInputUtils from 'intl-tel-input/build/js/utils.js';
import { pt } from 'intl-tel-input/i18n';

document.addEventListener('DOMContentLoaded', function() {
    // SISTEMA DE DEBOUNCE GLOBAL - disponível para todas as funções
    let phoneUpdateTimeout;
    let pendingPhoneData = {};
    let countryUpdateTimeout; 
    let pendingCountryData = {};
    let isWatcherDisabled = false;
    
    // Sistema de verificação contínua
    let fieldsToCheck = [];
    let continuousChecker = null;
    
    function initPhoneInput() {
        // Verifica se a máscara de telefone está habilitada
        const isPhoneMaskEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                   wc_better_checkout_phone_mask_vars.phoneMaskEnabled === 'true');
        
        // Se a máscara não está habilitada, apenas configura o destaque se necessário
        if (!isPhoneMaskEnabled) {
            // Configura apenas o destaque do telefone se habilitado
            const isHighlightEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                       wc_better_checkout_phone_mask_vars.highlightPhone === 'true');
            
            if (isHighlightEnabled) {
                setTimeout(() => {
                    setupPhoneFieldHighlight();
                    setupPhoneSync();
                }, 300);
            }
            return;
        }
        
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
                
                // Adiciona campo à lista de verificação contínua
                fieldsToCheck.push(phoneField);
                
                // Sistema de verificação contínua
                if (!continuousChecker) {
                    startContinuousFieldChecker();
                }
                
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
                        console.warn('Erro na formatação inicial do telefone:', error);
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
                        console.warn('Erro na aplicação da máscara:', error);
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
                        console.warn('Erro ao definir valor e cursor:', error);
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
                            
                            // Se campo estiver vazio, envia string vazia, senão envia o valor como está
                            const cleanValue = (!newValue || newValue === '') ? '' : newValue;
                            
                            // Atualiza dados pendentes
                            if (input.id.includes('billing')) {
                                pendingPhoneData.billing_phone_formatted = cleanValue;
                            } else if (input.id.includes('shipping')) {
                                pendingPhoneData.shipping_phone_formatted = cleanValue;
                            } else if (input.id.includes('custom')) {
                                // Campo customizado atualiza ambos billing e shipping
                                pendingPhoneData.billing_phone_formatted = cleanValue;
                                pendingPhoneData.shipping_phone_formatted = cleanValue;
                            }
                            
                            // Agenda execução em 1.5s (agrupa mudanças rápidas)
                            phoneUpdateTimeout = setTimeout(() => {
                                if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                    // Cria cópia dos dados para envio
                                    const dataToSend = { ...pendingPhoneData };
                                    
                                    window.wc.blocksCheckout.extensionCartUpdate({
                                        namespace: 'woo_better_phone_formatter',
                                        data: dataToSend
                                    });
                                }
                                
                                phoneUpdateTimeout = null;
                            }, 1500);
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
                                        
                                        // BACKUP: extensionCartUpdate com debounce de 1.5s (sincronizado com woo_better_phone_formatter)
                                        if (countryUpdateTimeout) {
                                            clearTimeout(countryUpdateTimeout);
                                        }
                                        
                                        // Atualiza dados pendentes
                                        pendingCountryData[fieldName] = countryCode;
                                        if (!otherFieldExists) {
                                            pendingCountryData[otherFieldName] = countryCode;
                                        }
                                        
                                        countryUpdateTimeout = setTimeout(() => {
                                            if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                                const countryDataToSend = { ...pendingCountryData };
                                                window.wc.blocksCheckout.extensionCartUpdate({
                                                    namespace: 'woo_better_phone_country',
                                                    data: countryDataToSend
                                                });
                                            }
                                            countryUpdateTimeout = null;
                                        }, 1500);
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
                                        
                                        // BACKUP: extensionCartUpdate com debounce de 1.5s (sincronizado com woo_better_phone_formatter)
                                        if (countryUpdateTimeout) {
                                            clearTimeout(countryUpdateTimeout);
                                        }
                                        
                                        // Atualiza dados pendentes
                                        pendingCountryData[fieldName] = countryCode;
                                        if (!otherFieldExists) {
                                            pendingCountryData[otherFieldName] = countryCode;
                                        }
                                        
                                        countryUpdateTimeout = setTimeout(() => {
                                            if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                                const countryDataToSend = { ...pendingCountryData };
                                                window.wc.blocksCheckout.extensionCartUpdate({
                                                    namespace: 'woo_better_phone_country',
                                                    data: countryDataToSend
                                                });
                                            }
                                            countryUpdateTimeout = null;
                                        }, 1500);
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
                        // Cancela timeout anterior se existir (debounce de 1.5s para evitar múltiplas requisições)
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
                            const delay = isDelete ? 250 : 1500; // 250ms para delete, 1.5s para input normal
                            
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
        // Verifica se a máscara de telefone está habilitada
        const isPhoneMaskEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                   wc_better_checkout_phone_mask_vars.phoneMaskEnabled === 'true');
        
        // Se a máscara não está habilitada, não aplica as modificações de padding da biblioteca
        if (!isPhoneMaskEnabled) {
            // Configura apenas o destaque e sincronização após um delay se habilitado
            const isHighlightEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                       wc_better_checkout_phone_mask_vars.highlightPhone === 'true');
            
            if (isHighlightEnabled) {
                setTimeout(() => {
                    setupPhoneFieldHighlight();
                    setupPhoneSync();
                }, 300);
            }
            return;
        }
        
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

        // Inicia funcionalidades de destaque e sincronização se configurado após um delay
        const isHighlightEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                   wc_better_checkout_phone_mask_vars.highlightPhone === 'true');
        
        if (isHighlightEnabled) {
            setTimeout(() => {
                setupPhoneFieldHighlight();
                setupPhoneSync();
            }, 300);
        }
    }

    // Sistema de verificação contínua de campos
    function startContinuousFieldChecker() {
        continuousChecker = setInterval(() => {
            checkFieldConsistency();
        }, 1000); // Verifica a cada 1 segundo
    }
    
    function checkFieldConsistency() {
        let allConsistent = true;
        
        fieldsToCheck.forEach(field => {
            if (!field || !field.parentNode) return;
            
            const currentValue = field.value;
            const shouldBeFormatted = currentValue && currentValue.includes('+') && currentValue.replace(/\D/g, '').length > 2;
            const isFormatted = currentValue.includes('(') || currentValue.includes('-') || currentValue.includes(' ');
            
            // Se deveria estar formatado mas não está, ou vice-versa
            if (shouldBeFormatted && !isFormatted) {
                allConsistent = false;
                // Reaplica formatação
                if (field.dataset.intlTelInputInitialized) {
                    setTimeout(() => {
                        const evt = new Event('input', { bubbles: true });
                        field.dispatchEvent(evt);
                    }, 100);
                }
            }
        });
        
        // Se todos os campos estão consistentes, para a verificação
        if (allConsistent && fieldsToCheck.length > 0) {
            clearInterval(continuousChecker);
            continuousChecker = null;
            // Reinicia após 5 segundos para verificação periódica
            setTimeout(() => {
                if (!continuousChecker && fieldsToCheck.length > 0) {
                    startContinuousFieldChecker();
                }
            }, 5000);
        }
    }

    // Função para criar campo de telefone customizado quando highlight está habilitado
    function setupPhoneFieldHighlight() {
        // Verifica se a funcionalidade está habilitada
        if (typeof wc_better_checkout_phone_mask_vars === 'undefined' || 
            wc_better_checkout_phone_mask_vars.highlightPhone !== 'true') {
            return;
        }

        // Verifica se a máscara de telefone está habilitada
        const isPhoneMaskEnabled = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                   wc_better_checkout_phone_mask_vars.phoneMaskEnabled === 'true');

        // Aguarda biblioteca estar carregada
        if (typeof intlTelInput === 'undefined') {
            setTimeout(setupPhoneFieldHighlight, 500);
            return;
        }

        // Encontra o campo de email
        const emailField = document.querySelector('#email, input[name="contact_email"]');
        if (!emailField) {
            return;
        }

        const emailContainer = emailField.closest('.wc-block-components-text-input, .form-row');
        if (!emailContainer) {
            return;
        }

        // Verifica se já foi criado o campo customizado
        if (document.getElementById('wc-custom-phone-field')) {
            return;
        }

        // ESCONDE TODOS os campos de telefone existentes
        const allPhoneSelectors = [
            '#billing_phone',
            '#shipping_phone',
            '#billing-phone', 
            '#shipping-phone',
            'input[id*="phone"]',
            'input[type="tel"]',
            'input[name*="phone"]'
        ];

        const allPhoneFields = document.querySelectorAll(allPhoneSelectors.join(','));
        Array.from(allPhoneFields).forEach(field => {
            const container = field.closest('.wc-block-components-text-input, .form-row');
            if (container) {
                container.style.display = 'none';
                container.dataset.phoneHidden = 'true';
            }
        });

        // Cria o campo customizado usando a estrutura fornecida
        const customPhoneContainer = document.createElement('div');
        customPhoneContainer.className = 'wc-block-components-text-input wc-block-components-address-form__phone';
        customPhoneContainer.id = 'wc-custom-phone-field';
        
        // BUSCA VALOR INICIAL dos campos de telefone existentes
        let initialPhoneValue = '';
        const existingPhoneSelectors = [
            '#billing_phone',
            '#shipping_phone',
            '#billing-phone', 
            '#shipping-phone',
            'input[name="billing_phone"]',
            'input[name="shipping_phone"]'
        ];
        
        // Procura pelo primeiro campo que tenha valor
        for (const selector of existingPhoneSelectors) {
            const existingField = document.querySelector(selector);
            if (existingField && existingField.value && existingField.value.trim() !== '') {
                initialPhoneValue = existingField.value.trim();
                break;
            }
        }
        
        customPhoneContainer.innerHTML = `
            <input type="tel" 
                   id="custom-phone" 
                   autocapitalize="characters" 
                   autocomplete="section-shipping shipping tel" 
                   aria-label="Telefone" 
                   aria-describedby="" 
                   aria-invalid="false" 
                   title="" 
                   name="custom_phone" 
                   value="${initialPhoneValue}">
            <label for="custom-phone">Telefone</label>
        `;

        // Insere o campo customizado após o email
        emailContainer.parentNode.insertBefore(customPhoneContainer, emailContainer.nextSibling);

        // Pega referência do campo customizado
        const customPhoneField = document.getElementById('custom-phone');
        
        // Se há valor inicial, ativa o container e agenda formatação
        if (initialPhoneValue) {
            customPhoneContainer.classList.add('is-active');
        }
        
        // APLICA AS MESMAS FUNÇÕES do campo original no campo customizado
        if (customPhoneField && !customPhoneField.dataset.intlTelInputInitialized) {
            
            // Se phoneMaskEnabled está DESABILITADO, apenas aplica ajustes visuais
            if (!isPhoneMaskEnabled) {
                
                // Marca campo como inicializado (sem biblioteca)
                customPhoneField.dataset.intlTelInputInitialized = 'true';
                
                // Aplica apenas ajuste visual básico sem biblioteca
                adjustCustomPhoneLabelSimple(customPhoneField);
                
                // Configura campo hidden básico sem formatação (Brasil padrão)
                updateCustomHiddenCountryCodeFieldSimple('+55');
                
                // Sistema centralizado de sincronização com debounce
                let syncDebounceTimer = null;
                const SYNC_DEBOUNCE_DELAY = 100; // Reduzido para ser mais reativo
                
                const debouncedSync = (currentValue) => {
                    if (syncDebounceTimer) {
                        clearTimeout(syncDebounceTimer);
                    }
                    
                    syncDebounceTimer = setTimeout(() => {
                        syncPhoneFieldsImmediate(currentValue);
                        syncDebounceTimer = null;
                    }, SYNC_DEBOUNCE_DELAY);
                };
                
                const syncPhoneFieldsImmediate = (currentValue) => {
                    // Evita loops de sincronização
                    if (customPhoneField._isSyncing) return;
                    customPhoneField._isSyncing = true;
                    
                    try {
                        // Sincroniza com billing e shipping
                        const phoneSelectors = [
                            '#billing_phone', '#shipping_phone', 
                            '#billing-phone', '#shipping-phone',
                            'input[name="billing_phone"]', 'input[name="shipping_phone"]',
                            'input[name="billing-phone"]', 'input[name="shipping-phone"]'
                        ];
                        
                        phoneSelectors.forEach(selector => {
                            const targetField = document.querySelector(selector);
                            if (targetField && targetField !== customPhoneField) {
                                
                                // Evita sincronizar campos que já estão sincronizando
                                if (targetField._isSyncing) return;
                                
                                // Usado nativeSetter para evitar trigger de eventos desnecessários
                                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                nativeSetter.call(targetField, currentValue);
                                
                                // Força React sync apenas se necessário
                                if (typeof triggerReactChange === 'function') {
                                    if (!currentValue || currentValue.trim() === '') {
                                        if (targetField._valueTracker) {
                                            targetField._valueTracker.setValue('');
                                        }
                                        triggerReactChange(targetField, '');
                                    } else {
                                        triggerReactChange(targetField, currentValue);
                                    }
                                }
                            }
                        });
                        
                        // **VERIFICAÇÃO SECUNDÁRIA COM DELAY DE 2S**
                        scheduleSecondaryVerification(currentValue, phoneSelectors);
                        
                    } finally {
                        // Libera flag de sincronização após pequeno delay
                        setTimeout(() => {
                            customPhoneField._isSyncing = false;
                        }, 50);
                    }
                };
                
                // Sistema de verificação secundária para garantir sincronização
                let secondaryVerificationTimer = null;
                
                const scheduleSecondaryVerification = (expectedValue, selectors) => {
                    // Cancela verificação anterior se existir
                    if (secondaryVerificationTimer) {
                        clearTimeout(secondaryVerificationTimer);
                    }
                    
                    // Agenda verificação para 2s depois
                    secondaryVerificationTimer = setTimeout(() => {
                        performSecondaryVerification(expectedValue, selectors);
                        secondaryVerificationTimer = null;
                    }, 2000);
                };
                
                const performSecondaryVerification = (expectedValue, selectors) => {
                    let needsResync = false;
                    const fieldsToResync = [];
                    
                    // Verifica se todos os campos têm o valor esperado
                    selectors.forEach(selector => {
                        const targetField = document.querySelector(selector);
                        if (targetField && targetField !== customPhoneField) {
                            const currentFieldValue = targetField.value;
                            
                            // Compara valores (ignora espaços em branco)
                            if (currentFieldValue.trim() !== expectedValue.trim()) {
                                needsResync = true;
                                fieldsToResync.push({
                                    field: targetField,
                                    selector: selector,
                                    currentValue: currentFieldValue,
                                    expectedValue: expectedValue
                                });
                            }
                        }
                    });
                    
                    // Se precisa ressincronizar, faz novamente
                    if (needsResync && fieldsToResync.length > 0) {
                        fieldsToResync.forEach(({ field }) => {
                            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                            nativeSetter.call(field, expectedValue);
                            
                            if (typeof triggerReactChange === 'function') {
                                triggerReactChange(field, expectedValue);
                            }
                        });
                    }
                };
                
                // Único listener centralizado para sincronização
                customPhoneField.addEventListener('input', function(e) {
                    debouncedSync(e.target.value);
                });
                
                customPhoneField.addEventListener('change', function(e) {
                    debouncedSync(e.target.value);
                });
                
                return; // Sai da função sem inicializar intlTelInput
            }
            
            // Se phoneMaskEnabled está HABILITADO, aplica toda a formatação
            
            let countryChanged = false;
            let isFormatting = false;
            let lastFormattedValue = '';
            
            // Inicializa intlTelInput no campo customizado (APENAS se phoneMaskEnabled=true)
            let iti = intlTelInput(customPhoneField, {
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

            customPhoneField.dataset.intlTelInputInitialized = 'true';
            
            // Aplica o ajuste de padding da label para o campo customizado
            adjustCustomPhoneLabel(customPhoneField);
            
            // Função de sincronização para campos com formatação
            const syncFormattedPhoneFields = (valueToSync) => {
                const phoneSelectors = [
                    '#billing_phone', '#shipping_phone', 
                    '#billing-phone', '#shipping-phone',
                    'input[name="billing_phone"]', 'input[name="shipping_phone"]',
                    'input[name="billing-phone"]', 'input[name="shipping-phone"]'
                ];
                
                phoneSelectors.forEach(selector => {
                    const targetField = document.querySelector(selector);
                    if (targetField && targetField !== customPhoneField) {
                        
                        // Sincroniza mesmo que o campo esteja oculto
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(targetField, valueToSync);
                        
                        // Dispara eventos no campo alvo
                        const inputEvent = new Event('input', { bubbles: true });
                        const changeEvent = new Event('change', { bubbles: true });
                        
                        targetField.dispatchEvent(inputEvent);
                        targetField.dispatchEvent(changeEvent);
                        
                        // Força trigger do React
                        if (typeof triggerReactChange === 'function') {
                            // **CORREÇÃO REACT**: Para campos vazios, força sincronização imediata
                            if (!valueToSync || valueToSync.trim() === '') {
                                // Reset do value tracker do React
                                if (targetField._valueTracker) {
                                    targetField._valueTracker.setValue('');
                                }
                                
                                // Força trigger React imediatamente (sem delay)
                                triggerReactChange(targetField, '');
                            } else {
                                triggerReactChange(targetField, valueToSync);
                            }
                        }
                    }
                });
                
                // **VERIFICAÇÃO SECUNDÁRIA COM DELAY DE 2S para campos formatados**
                scheduleFormattedFieldsVerification(valueToSync, phoneSelectors);
            };
            
            // Sistema de verificação secundária para campos formatados
            let formattedFieldsVerificationTimer = null;
            
            const scheduleFormattedFieldsVerification = (expectedValue, selectors) => {
                // Cancela verificação anterior se existir
                if (formattedFieldsVerificationTimer) {
                    clearTimeout(formattedFieldsVerificationTimer);
                }
                
                // Agenda verificação para 2s depois
                formattedFieldsVerificationTimer = setTimeout(() => {
                    performFormattedFieldsVerification(expectedValue, selectors);
                    formattedFieldsVerificationTimer = null;
                }, 2000);
            };
            
            const performFormattedFieldsVerification = (expectedValue, selectors) => {
                let needsResync = false;
                const fieldsToResync = [];
                
                // Verifica se todos os campos têm o valor esperado
                selectors.forEach(selector => {
                    const targetField = document.querySelector(selector);
                    if (targetField && targetField !== customPhoneField) {
                        const currentFieldValue = targetField.value;
                        
                        // Compara valores (ignora espaços em branco)
                        if (currentFieldValue.trim() !== expectedValue.trim()) {
                            needsResync = true;
                            fieldsToResync.push({
                                field: targetField,
                                selector: selector,
                                currentValue: currentFieldValue,
                                expectedValue: expectedValue
                            });
                        }
                    }
                });
                
                // Se precisa ressincronizar, faz novamente com força total
                if (needsResync && fieldsToResync.length > 0) {
                    fieldsToResync.forEach(({ field }) => {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(field, expectedValue);
                        
                        // Força eventos DOM
                        const inputEvent = new Event('input', { bubbles: true });
                        const changeEvent = new Event('change', { bubbles: true });
                        field.dispatchEvent(inputEvent);
                        field.dispatchEvent(changeEvent);
                        
                        // Força React sync
                        if (typeof triggerReactChange === 'function') {
                            triggerReactChange(field, expectedValue);
                        }
                    });
                }
            };
            
            // Adicionar watcher melhorado para detectar mudanças externas no campo customizado
            let lastKnownValue = customPhoneField.value;
            const valueWatcher = setInterval(() => {
                if (customPhoneField.value !== lastKnownValue) {
                    const currentValue = customPhoneField.value;
                    const wasFormatted = lastKnownValue.includes('(') || lastKnownValue.includes('-') || lastKnownValue.includes(' ');
                    const isUnformatted = !currentValue.includes('(') && !currentValue.includes('-') && currentValue.replace(/\D/g, '').length > 0;
                    
                    if (wasFormatted && isUnformatted && currentValue.startsWith('+')) {
                        setTimeout(() => {
                            formatCustomInitialPhoneValue(currentValue);
                        }, 50);
                    } else if (currentValue && !wasFormatted) {
                        // Aplica formatação automaticamente se o valor parece ser um número válido
                        setTimeout(() => {
                            applyCustomPhoneFormatting({ target: customPhoneField }, 'Auto-format Detection');
                        }, 100);
                    }
                    
                    lastKnownValue = customPhoneField.value;
                }
            }, 100);
            
            // Formata valor inicial se já existir um número (SOMENTE SE phoneMaskEnabled estiver habilitado)
            if (isPhoneMaskEnabled) {
                const initialValue = customPhoneField.value;
                if (initialValue && (initialValue.includes('+') || initialValue.replace(/\D/g, '').length >= 8)) {
                    setTimeout(() => {
                        formatCustomInitialPhoneValue(initialValue);
                    }, 100);
                }
            }
            
            // Função para formatar valores iniciais do campo customizado
            function formatCustomInitialPhoneValue(initialValue) {
                try {
                    if (!initialValue || initialValue.trim() === '') {
                        return;
                    }
                    
                    // Verifica se é número internacional com +
                    if (initialValue.includes('+')) {
                        // SOLUÇÃO CORRETA: Remove apenas caracteres especiais, MANTÉM + e espaços
                        const cleanValue = initialValue.replace(/[^\d+\s]/g, '');
                        
                        if (cleanValue.startsWith('+')) {
                            // Quebra em 2 partes: código do país e número local
                            const parts = cleanValue.split(' ');
                            if (parts.length >= 2) {
                                const countryCodePart = parts[0]; // Ex: "+1"
                                const localNumberPart = parts.slice(1).join('').replace(/\D/g, ''); // Ex: "1111111445"
                                
                                // Extrai só os números do código do país
                                const dialCode = countryCodePart.replace(/\D/g, '');
                                
                                // CORREÇÃO: Para países código 1 (US/CA), verifica duplicação
                                let finalLocalNumber = localNumberPart;
                                if (dialCode === '1' && localNumberPart.length === 11 && localNumberPart.startsWith('1')) {
                                    finalLocalNumber = localNumberPart.substring(1); // Remove primeiro '1' duplicado
                                }
                                
                                const foundCountry = findCustomCountryByDialCode(dialCode);
                                
                                if (foundCountry && finalLocalNumber.length > 0) {
                                    
                                    iti.setCountry(foundCountry);
                                    
                                    try {
                                        // Formata APENAS a segunda parte (número local) pela lib
                                        const formattedLocal = intlTelInputUtils.formatNumber(
                                            finalLocalNumber, 
                                            foundCountry, 
                                            intlTelInputUtils.numberFormat.NATIONAL
                                        );
                                        
                                        if (formattedLocal && formattedLocal !== 'Invalid number') {
                                            // Verifica se não perdeu dígitos na formatação
                                            const originalDigits = finalLocalNumber.replace(/\D/g, '');
                                            const formattedDigits = formattedLocal.replace(/\D/g, '');
                                            
                                            if (originalDigits === formattedDigits) {
                                                // Concatena: código do país + espaço + número formatado
                                                const finalResult = `${countryCodePart} ${formattedLocal}`;
                                                
                                                // Aplica o resultado
                                                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                                nativeSetter.call(customPhoneField, finalResult);
                                                triggerCustomReactChange(customPhoneField, finalResult);
                                                
                                                // Atualiza campos hidden
                                                updateCustomHiddenCountryCodeField(countryCodePart);
                                                return;
                                            } else {
                                                console.warn('⚠️ [CUSTOM FORMAT] Formatação removeu dígitos, mantendo original');
                                            }
                                        }
                                    } catch (formatError) {
                                        console.warn('❌ [CUSTOM FORMAT] Erro na formatação:', formatError);
                                    }
                                } else {
                                }
                            } else {
                            }
                        }
                    } else {
                        // Para números nacionais
                        const countryData = iti.getSelectedCountryData();
                        const cleanDigits = initialValue.replace(/\D/g, '');
                        
                        if (countryData && cleanDigits.length >= 8) {
                            try {
                                const formattedNumber = intlTelInputUtils.formatNumber(
                                    cleanDigits, 
                                    countryData.iso2, 
                                    intlTelInputUtils.numberFormat.NATIONAL
                                );
                                
                                if (formattedNumber && formattedNumber !== 'Invalid number') {
                                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                    nativeSetter.call(customPhoneField, formattedNumber);
                                    triggerCustomReactChange(customPhoneField, formattedNumber);
                                    
                                    // Atualiza campos hidden
                                    const countryData = iti.getSelectedCountryData();
                                    if (countryData && countryData.dialCode) {
                                        updateCustomHiddenCountryCodeField('+' + countryData.dialCode);
                                    }
                                }
                            } catch (error) {
                                console.warn('❌ [CUSTOM FORMAT] Erro na formatação nacional:', error);
                            }
                        }
                    }
                } catch (error) {
                    console.warn('❌ [CUSTOM FORMAT] Erro geral na formatação:', error);
                }
            }

            // Función para verificar se um prefixo corresponde a apenas UM país (para auto-espaçamento)
            function findUniqueCountryCode(digits) {
                
                const customDialCodeMap = {
                    // América do Norte
                    '1': 'us',    // Estados Unidos/Canadá
                    
                    // Europa Oriental
                    '7': 'ru',    // Rússia
                    
                    // África
                    '20': 'eg',   // Egito
                    '27': 'za',   // África do Sul
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
                    '268': 'sz',  // Suazilândia/Eswatini
                    '269': 'km',  // Comores
                    '290': 'sh',  // Santa Helena
                    '291': 'er',  // Eritreia
                    
                    // Europa Ocidental
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
                    
                    // América do Sul
                    '51': 'pe',   // Peru
                    '54': 'ar',   // Argentina
                    '55': 'br',   // Brasil
                    '56': 'cl',   // Chile
                    '57': 'co',   // Colômbia
                    '58': 've',   // Venezuela
                    '591': 'bo',  // Bolívia
                    '592': 'gy',  // Guiana
                    '593': 'ec',  // Equador
                    '594': 'gf',  // Guiana Francesa
                    '595': 'py',  // Paraguai
                    '596': 'mq',  // Martinica
                    '597': 'sr',  // Suriname
                    '598': 'uy',  // Uruguai
                    
                    // América Central e Caribe
                    '52': 'mx',   // México
                    '53': 'cu',   // Cuba
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
                    '599': 'cw',  // Curaçao
                    
                    // Ásia Oriental
                    '81': 'jp',   // Japão
                    '82': 'kr',   // Coreia do Sul
                    '84': 'vn',   // Vietnã
                    '86': 'cn',   // China
                    '852': 'hk',  // Hong Kong
                    '853': 'mo',  // Macau
                    '886': 'tw',  // Taiwan
                    '850': 'kp',  // Coreia do Norte
                    
                    // Ásia do Sudeste
                    '60': 'my',   // Malásia
                    '62': 'id',   // Indonésia
                    '63': 'ph',   // Filipinas
                    '65': 'sg',   // Singapura
                    '66': 'th',   // Tailândia
                    '855': 'kh',  // Camboja
                    '856': 'la',  // Laos
                    '673': 'bn',  // Brunei
                    
                    // Oceania
                    '61': 'au',   // Austrália
                    '64': 'nz',   // Nova Zelândia
                    '670': 'tl',  // Timor-Leste
                    '672': 'aq',  // Antártida
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
                    
                    // Ásia Central e Sul
                    '90': 'tr',   // Turquia
                    '91': 'in',   // Índia
                    '92': 'pk',   // Paquistão
                    '93': 'af',   // Afeganistão
                    '94': 'lk',   // Sri Lanka
                    '95': 'mm',   // Myanmar
                    '98': 'ir',   // Irã
                    '880': 'bd',  // Bangladesh
                    '960': 'mv',  // Maldivas
                    '975': 'bt',  // Butão
                    '976': 'mn',  // Mongólia
                    '977': 'np',  // Nepal
                    '992': 'tj',  // Tadjiquistão
                    '993': 'tm',  // Turcomenistão
                    '994': 'az',  // Azerbaijão
                    '995': 'ge',  // Geórgia
                    '996': 'kg',  // Quirguistão
                    '998': 'uz',  // Uzbequistão
                    
                    // Oriente Médio
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
                    
                    // Europa Oriental e Bálcãs
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
                    
                    // Outras ilhas e territórios
                    '500': 'fk'   // Ilhas Malvinas
                };
                
                // Verifica se há uma correspondência EXATA para qualquer prefixo
                const possibleMatches = [];
                for (const dialCode in customDialCodeMap) {
                    if (digits.startsWith(dialCode)) {
                        possibleMatches.push(dialCode);
                    }
                }
                
                // Se há apenas UMA correspondência possível, retorna ela
                if (possibleMatches.length === 1) {
                    const uniqueCode = possibleMatches[0];
                    return uniqueCode;
                }
                
                // Se há múltiplas correspondências, verifica se uma é mais específica
                // Ex: digits="551" pode gerar matches ["55", "551"], prefere "551" se existir
                if (possibleMatches.length > 1) {
                    // Ordena por tamanho (maiores primeiro)
                    possibleMatches.sort((a, b) => b.length - a.length);
                    
                    // Verifica se o maior match é único em seu tamanho
                    const longestMatch = possibleMatches[0];
                    const sameLengthMatches = possibleMatches.filter(code => code.length === longestMatch.length);
                    
                    if (sameLengthMatches.length === 1) {
                        return longestMatch;
                    }
                }
                
                return null; // Múltiplas opções ainda possíveis
            }
            
            // Função para aplicar formatação (REUTILIZA a lógica existente)
            function applyCustomPhoneFormatting(event, context = 'input') {
                try {
                    
                    if (isFormatting) {
                        return;
                    }
                    
                    const currentValue = customPhoneField.value;
                    if (currentValue === lastFormattedValue) {
                        return;
                    }
                    
                    isFormatting = true;
                    
                    if (!currentValue || currentValue.trim() === '') {
                        // Remove classe is-active quando campo estiver vazio
                        customPhoneContainer.classList.remove('is-active');
                        
                        // **CORREÇÃO REACT**: Sincronização IMEDIATA para campos vazios
                        syncFormattedPhoneFields(''); // Força limpeza imediata de todos os campos
                        
                        triggerCustomReactChange(customPhoneField, '');
                        lastFormattedValue = '';
                        isFormatting = false;
                        return;
                    }

                    // Adiciona classe is-active quando campo tem conteúdo
                    customPhoneContainer.classList.add('is-active');

                    // Aplica a mesma lógica de formatação dos campos originais
                    const onlyDigits = currentValue.replace(/\D/g, '');
                    if (onlyDigits === '' && currentValue.trim() !== '' && currentValue.trim() !== '+') {
                        const cursorPos = customPhoneField.selectionStart || 0;
                        setCustomValueAndCursor('', cursorPos, currentValue, false);
                        lastFormattedValue = '';
                        isFormatting = false;
                        return;
                    }

                    // NOVA LÓGICA: Detecção inteligente com auto-espaçamento e tratamento de espaços manuais
                    const internationalWithSpace = currentValue.match(/^\+(\d{1,4})\s(.+)$/); // Ex: +55 123456789
                    const internationalWithoutSpace = currentValue.match(/^\+(\d{1,})$/); // Ex: +55123456789
                    
                    // CASO 1: Número já tem espaço (ex: "+55 123456789")
                    if (internationalWithSpace) {
                        const countryCode = internationalWithSpace[1];
                        const localNumber = internationalWithSpace[2].replace(/\D/g, ''); // Remove não-dígitos do número local
                        
                        const foundCountryCode = findCustomCountryByDialCode(countryCode);
                        if (foundCountryCode && localNumber.length > 0) {
                            iti.setCountry(foundCountryCode);
                            
                            setTimeout(() => {
                                try {
                                    const formattedLocal = intlTelInputUtils.formatNumber(
                                        localNumber, 
                                        foundCountryCode, 
                                        intlTelInputUtils.numberFormat.NATIONAL
                                    );
                                    const finalResult = `+${countryCode} ${formattedLocal || localNumber}`;
                                    
                                    if (finalResult !== currentValue) {
                                        setCustomValueAndCursor(finalResult, customPhoneField.selectionStart || 0, currentValue, false);
                                        lastFormattedValue = finalResult;
                                        updateCustomHiddenCountryCodeField(`+${countryCode}`);
                                    }
                                } catch (formatError) {
                                    console.warn('❌ [CUSTOM FORMATTING] Erro na formatação com espaço:', formatError);
                                }
                                isFormatting = false;
                            }, 50);
                            return;
                        }
                    }
                    
                    // CASO 2: Número sem espaço - verificar auto-espaçamento e formatação completa
                    if (internationalWithoutSpace) {
                        const allDigits = internationalWithoutSpace[1];
                        
                        // AUTO-ESPAÇAMENTO: Verifica se o prefixo atual corresponde a apenas UM país
                        const uniqueCountryCode = findUniqueCountryCode(allDigits);
                        if (uniqueCountryCode && allDigits.length > uniqueCountryCode.length) {
                            const localNumber = allDigits.substring(uniqueCountryCode.length);
                            
                            const foundCountryCode = findCustomCountryByDialCode(uniqueCountryCode);
                            if (foundCountryCode) {
                                iti.setCountry(foundCountryCode);
                                
                                setTimeout(() => {
                                    try {
                                        const autoSpacedNumber = `+${uniqueCountryCode} ${localNumber}`;
                                        
                                        setCustomValueAndCursor(autoSpacedNumber, customPhoneField.selectionStart || 0, currentValue, false);
                                        lastFormattedValue = autoSpacedNumber;
                                        updateCustomHiddenCountryCodeField(`+${uniqueCountryCode}`);
                                    } catch (autoSpaceError) {
                                        console.warn('❌ [CUSTOM FORMATTING] Erro no auto-espaçamento:', autoSpaceError);
                                    }
                                    isFormatting = false;
                                }, 50);
                                return;
                            }
                        }
                        
                        // FORMATAÇÃO COMPLETA: Se há dígitos suficientes, tenta detectar país e formatar
                        if (allDigits.length >= 7) { // Pelo menos country code (1+) + 6 dígitos locais
                            
                            // Tenta diferentes tamanhos de country code (4, 3, 2, 1) - do MAIOR para o MENOR
                            let countryDetected = false;
                            for (let codeLength = Math.min(4, allDigits.length - 6); codeLength >= 1 && !countryDetected; codeLength--) {
                                if (allDigits.length >= codeLength + 6) { // Garante pelo menos 6 dígitos para o número local
                                    const testCountryCode = allDigits.substring(0, codeLength);
                                    const testPhoneNumber = allDigits.substring(codeLength);
                                    
                                    const foundCountryCode = findCustomCountryByDialCode(testCountryCode);
                                    
                                    if (foundCountryCode) {
                                        
                                        countryDetected = true;
                                        iti.setCountry(foundCountryCode);
                                        
                                        setTimeout(() => {
                                            try {
                                                const customFormatted = applyCustomPhoneSpacing(currentValue, testCountryCode);
                                                
                                                if (customFormatted && customFormatted !== currentValue && customFormatted.length >= currentValue.length) {
                                                    setCustomValueAndCursor(customFormatted, customPhoneField.selectionStart || 0, currentValue, false);
                                                    lastFormattedValue = customFormatted;
                                                    updateCustomHiddenCountryCodeField(`+${testCountryCode}`);
                                                    return;
                                                }
                                            } catch (formatError) {
                                                console.warn('❌ [CUSTOM FORMATTING] Erro na formatação completa:', formatError);
                                            }
                                            isFormatting = false;
                                        }, 50);
                                        return;
                                    }
                                }
                            }
                            
                            if (!countryDetected) {
                                // Não foi possível encontrar país para formatação
                            }
                        }
                    }

                    // NOVA LÓGICA: Formatação nacional melhorada
                    if (!currentValue.startsWith('+')) {
                        const cleanValue = currentValue.replace(/\D/g, '');
                        const countryData = iti.getSelectedCountryData();
                        
                        if (countryData && countryData.dialCode && countryData.iso2 && countryData.dialCode !== 'undefined' && cleanValue.length > 0) {
                            try {
                                // Usa formatação nativa da biblioteca intlTelInput
                                const formatted = intlTelInputUtils.formatNumber(
                                    cleanValue, 
                                    countryData.iso2, 
                                    intlTelInputUtils.numberFormat.NATIONAL
                                );
                                
                                if (formatted && formatted !== 'Invalid number' && formatted !== cleanValue) {
                                    setCustomValueAndCursor(formatted, customPhoneField.selectionStart || 0, currentValue, false);
                                    lastFormattedValue = formatted;
                                    isFormatting = false;
                                    return;
                                }
                            } catch (formatError) {
                                console.warn('Erro na formatação nacional customizada:', formatError);
                            }
                        }
                    }

                    triggerCustomReactChange(customPhoneField, currentValue);
                    lastFormattedValue = currentValue;
                    isFormatting = false;
                } catch (error) {
                    console.warn('Erro na aplicação da máscara no campo customizado:', error);
                    isFormatting = false;
                }
            }

            // SISTEMA DE DEBOUNCE PARA PHONE UPDATES CUSTOMIZADO (evita múltiplas requisições)
            let customPhoneUpdateTimeout;
            let customPendingPhoneData = {};
            
            function triggerCustomReactChange(input, newValue) {
                try {
                    if (!input || typeof input !== 'object') {
                        return;
                    }

                    // SISTEMA DE DEBOUNCE PARA PHONE UPDATES - Campo Customizado
                    const isCustomPhoneField = input.id === 'custom-phone' || input.name === 'custom_phone';
                    
                    if (isCustomPhoneField) {
                        // Cancela timeout anterior se existir
                        if (customPhoneUpdateTimeout) {
                            clearTimeout(customPhoneUpdateTimeout);
                        }
                        
                        // Se campo estiver vazio, envia string vazia, senão envia o valor como está
                        const cleanValue = (!newValue || newValue === '') ? '' : newValue;
                        
                        // Atualiza dados pendentes para ambos billing e shipping
                        customPendingPhoneData.billing_phone_formatted = cleanValue;
                        customPendingPhoneData.shipping_phone_formatted = cleanValue;
                        
                        // Agenda execução em 1.5s (agrupa mudanças rápidas - sincronizado com outros timers)
                        customPhoneUpdateTimeout = setTimeout(() => {
                            // Adiciona extensionCartUpdate para campos customizados (seguindo mesma lógica do woo_better_phone_formatter)
                            if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                // Cria cópia dos dados para envio
                                const dataToSend = { ...customPendingPhoneData };
                                
                                window.wc.blocksCheckout.extensionCartUpdate({
                                    namespace: 'woo_better_phone_formatter',
                                    data: dataToSend
                                });
                            }
                            
                            customPhoneUpdateTimeout = null;
                        }, 1500); // 1.5s para sincronizar com outros debounces
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
                                    try {
                                        input.dispatchEvent(event);
                                    } catch (dispatchError) {
                                        // Silent error handling
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

            // Função para preservar cursor (adaptada para campo customizado)
            function setCustomValueAndCursor(newValue, originalCursorPos, originalValue, isDeletion = false) {
                try {
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(customPhoneField, newValue);
                    
                    // Controla classe is-active baseado no valor
                    if (newValue && newValue.trim() !== '') {
                        customPhoneContainer.classList.add('is-active');
                    } else {
                        customPhoneContainer.classList.remove('is-active');
                    }
                    
                    // Usa a mesma lógica inteligente de cálculo de cursor dos campos originais
                    let newCursorPos = calculateCustomSmartCursorPosition(originalValue, newValue, originalCursorPos, isDeletion);
                    
                    // Garante que a posição está dentro dos limites
                    newCursorPos = Math.max(0, Math.min(newCursorPos, newValue.length));
                    
                    // Restaura a posição do cursor
                    if (customPhoneField.setSelectionRange) {
                        customPhoneField.setSelectionRange(newCursorPos, newCursorPos);
                    }
                    
                    triggerCustomReactChange(customPhoneField, newValue);
                } catch (error) {
                    console.warn('Erro ao definir valor e cursor no campo customizado:', error);
                    // Fallback sem preservação de cursor
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(customPhoneField, newValue);
                    triggerCustomReactChange(customPhoneField, newValue);
                }
            }

            // Função para calcular posição inteligente do cursor (campo customizado)
            function calculateCustomSmartCursorPosition(originalValue, newValue, originalCursorPos, isDeletion = false) {
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

            // Função formatInitialPhoneValue adaptada
            function formatInitialPhoneValue(initialValue) {
                try {
                    if (!initialValue || !initialValue.includes('+')) return;
                    
                    const cleanValue = initialValue.replace(/[^\d+]/g, '');
                    if (cleanValue.startsWith('+') && cleanValue.length > 1) {
                        const numbers = cleanValue.substring(1);
                        if (numbers.length > 0) {
                            iti.setNumber(cleanValue);
                            const formatted = iti.getNumber();
                            triggerCustomReactChange(customPhoneField, formatted);
                            
                            // Controla classe is-active
                            if (formatted && formatted.trim() !== '') {
                                customPhoneContainer.classList.add('is-active');
                            } else {
                                customPhoneContainer.classList.remove('is-active');
                            }
                        }
                    }
                } catch (error) {
                    console.warn('Erro na formatação inicial do telefone customizado:', error);
                }
            }

            // FUNÇÕES SIMPLIFICADAS PARA phoneMaskEnabled=false (sem biblioteca intlTelInput)
            
            // Função para aplicar padding da label no campo customizado (versão simples)
            function adjustCustomPhoneLabelSimple(phoneField) {
                
                // Aplica padding básico no input sem biblioteca
                const basicPadding = 16; // Padding padrão sem ícones de país
                if (phoneField && phoneField.tagName === 'INPUT') {
                    phoneField.style.setProperty('padding-left', basicPadding + 'px', 'important');
                }

                // Define padding básico da label 
                const label = phoneField.closest('.form-row, .wc-block-components-text-input')?.querySelector('label');
                if (label) {
                    let labelPad = (basicPadding + 4) + 'px';
                    label.style.setProperty('padding-left', labelPad, 'important');
                    label.style.transition = 'all 0.3s ease';
                    
                    if (label.classList.contains('screen-reader-text') || getComputedStyle(label).position === 'absolute') {
                        label.style.setProperty('left', labelPad, 'important');
                        label.style.setProperty('padding-left', '0px', 'important');
                    }
                }

                const blockLabel = phoneField.closest('.wc-block-components-text-input')?.querySelector('.wc-block-components-text-input__label');
                if (blockLabel) {
                    let labelPad = (basicPadding + 4) + 'px';
                    blockLabel.style.setProperty('padding-left', labelPad, 'important');
                    blockLabel.style.transition = 'all 0.3s ease';
                }
            }
            
            // Função para criar campos hidden básicos (versão simples para Brasil)
            function updateCustomHiddenCountryCodeFieldSimple(dialCode) {
                // Criando campos hidden simples de país
                
                const countryCode = String(dialCode || '+55'); // Brasil padrão
                
                // Para Block Checkout (versão simples)
                if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
                    try {
                        const { dispatch, select } = wp.data;
                        
                        if (dispatch('wc/store/checkout')) {
                            const checkoutDispatch = dispatch('wc/store/checkout');
                            
                            if (checkoutDispatch.setExtensionData) {
                                const phoneCountryData = {
                                    'billing_phone_country_code': countryCode,
                                    'shipping_phone_country_code': countryCode
                                };

                                // Debug temporário - REMOVER
                                
                                checkoutDispatch.setExtensionData('woo_better_phone_country', phoneCountryData);
                            }
                        }
                    } catch (error) {
                        console.warn('Erro ao definir extension data simples:', error);
                    }
                }
                
                // Para checkout tradicional (campos hidden simples)
                const fieldNames = ['billing_phone_country_code', 'shipping_phone_country_code'];
                
                fieldNames.forEach(fieldName => {
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
                    
                    const checkoutForm = document.querySelector('form.checkout');
                    if (checkoutForm) {
                        checkoutForm.appendChild(hiddenField);
                    }
                });
            }

            // Função para aplicar padding da label no campo customizado
            function adjustCustomPhoneLabel(phoneField) {
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
            }

            // Função para encontrar país pelo código de discagem (campo customizado - versão completa)
            function findCustomCountryByDialCode(dialCode) {
                
                const customDialCodeMap = {
                    // América do Norte
                    '1': 'us',    // Estados Unidos/Canadá
                    
                    // Europa Oriental
                    '7': 'ru',    // Rússia
                    
                    // África
                    '20': 'eg',   // Egito
                    '27': 'za',   // África do Sul
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
                    '268': 'sz',  // Suazilândia/Eswatini
                    '269': 'km',  // Comores
                    '290': 'sh',  // Santa Helena
                    '291': 'er',  // Eritreia
                    
                    // Europa Ocidental
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
                    
                    // América do Sul
                    '51': 'pe',   // Peru
                    '54': 'ar',   // Argentina
                    '55': 'br',   // Brasil
                    '56': 'cl',   // Chile
                    '57': 'co',   // Colômbia
                    '58': 've',   // Venezuela
                    '591': 'bo',  // Bolívia
                    '592': 'gy',  // Guiana
                    '593': 'ec',  // Equador
                    '594': 'gf',  // Guiana Francesa
                    '595': 'py',  // Paraguai
                    '596': 'mq',  // Martinica
                    '597': 'sr',  // Suriname
                    '598': 'uy',  // Uruguai
                    
                    // América Central e Caribe
                    '52': 'mx',   // México
                    '53': 'cu',   // Cuba
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
                    '599': 'cw',  // Curaçao
                    
                    // Ásia Oriental
                    '81': 'jp',   // Japão
                    '82': 'kr',   // Coreia do Sul
                    '84': 'vn',   // Vietnã
                    '86': 'cn',   // China
                    '852': 'hk',  // Hong Kong
                    '853': 'mo',  // Macau
                    '886': 'tw',  // Taiwan
                    '850': 'kp',  // Coreia do Norte
                    
                    // Ásia do Sudeste
                    '60': 'my',   // Malásia
                    '62': 'id',   // Indonésia
                    '63': 'ph',   // Filipinas
                    '65': 'sg',   // Singapura
                    '66': 'th',   // Tailândia
                    '855': 'kh',  // Camboja
                    '856': 'la',  // Laos
                    '673': 'bn',  // Brunei
                    
                    // Oceania
                    '61': 'au',   // Austrália
                    '64': 'nz',   // Nova Zelândia
                    '670': 'tl',  // Timor-Leste
                    '672': 'aq',  // Antártida
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
                    
                    // Ásia Central e Sul
                    '90': 'tr',   // Turquia
                    '91': 'in',   // Índia
                    '92': 'pk',   // Paquistão
                    '93': 'af',   // Afeganistão
                    '94': 'lk',   // Sri Lanka
                    '95': 'mm',   // Myanmar
                    '98': 'ir',   // Irã
                    '880': 'bd',  // Bangladesh
                    '960': 'mv',  // Maldivas
                    '975': 'bt',  // Butão
                    '976': 'mn',  // Mongólia
                    '977': 'np',  // Nepal
                    '992': 'tj',  // Tadjiquistão
                    '993': 'tm',  // Turcomenistão
                    '994': 'az',  // Azerbaijão
                    '995': 'ge',  // Geórgia
                    '996': 'kg',  // Quirguistão
                    '998': 'uz',  // Uzbequistão
                    
                    // Oriente Médio
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
                    
                    // Europa Oriental e Bálcãs
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
                    
                    // Outras ilhas e territórios
                    '500': 'fk'   // Ilhas Malvinas
                };
                
                const result = customDialCodeMap[dialCode] || null;
                return result;
            }
            
            // Função para aplicar formatação customizada com espaçamento inteligente
            function applyCustomPhoneSpacing(phoneNumber, countryCode) {
                try {
                    
                    if (!phoneNumber || !countryCode) {
                        return phoneNumber;
                    }
                    
                    // Remove formatação existente, mantém apenas números e o +
                    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
                    
                    // Se não começar com +, adiciona o código do país
                    if (!cleanNumber.startsWith('+')) {
                        const digits = cleanNumber.replace(/\D/g, '');
                        if (digits.length > 0) {
                            const result = `+${countryCode} ${digits}`;
                            return result;
                        }
                        return cleanNumber;
                    }
                    
                    // CORRIGIDO: Usa o country code detectado externamente, não tenta re-detectar
                    if (cleanNumber.startsWith('+') && cleanNumber.length > countryCode.length + 1) {
                        // Remove o + e extrai apenas a parte do número local
                        const allDigits = cleanNumber.substring(1); // Remove o +
                        const localNumber = allDigits.substring(countryCode.length); // Remove o country code
                        
                        // Busca o país pelo código fornecido
                        const foundCountry = findCustomCountryByDialCode(countryCode);
                        
                        if (foundCountry && localNumber.length > 0) {
                            // Usa formatação nativa da biblioteca intlTelInput
                            try {
                                const formattedLocal = intlTelInputUtils.formatNumber(
                                    localNumber, 
                                    foundCountry, 
                                    intlTelInputUtils.numberFormat.NATIONAL
                                );
                                const result = `+${countryCode} ${formattedLocal || localNumber}`;
                                return result;
                            } catch (formatError) {
                                console.warn('❌ [CUSTOM SPACING] Erro ao formatar, usando número original');
                                const result = `+${countryCode} ${localNumber}`;
                                return result;
                            }
                        }
                        
                        // Formatação genérica se país não encontrado
                        if (localNumber.length > 0) {
                            const genericResult = `+${countryCode} ${localNumber}`;
                            return genericResult;
                        }
                    }
                    
                    return phoneNumber;
                } catch (error) {
                    console.warn('❌ [CUSTOM SPACING] Erro na formatação customizada:', error);
                    return phoneNumber;
                }
            }

            // Função para criar/atualizar campos hidden dinâmicos (campo customizado)
            function updateCustomHiddenCountryCodeField(dialCode) {
                
                // Garante que dialCode seja uma string válida
                const countryCode = String(dialCode || '+55');
                
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
                                
                                // Define ambos os campos com o valor do campo customizado
                                phoneCountryData['billing_phone_country_code'] = countryCode;
                                phoneCountryData['shipping_phone_country_code'] = countryCode;
                                
                                checkoutDispatch.setExtensionData('woo_better_phone_country', phoneCountryData);
                                
                            } else if (checkoutDispatch.__unstableSetExtensionData) {
                                // Fallback para versões antigas
                                const currentData = select('wc/store/checkout').getExtensionData() || {};
                                let phoneCountryData = currentData['woo_better_phone_country'] || {};
                                
                                // Sempre garantir que ambos os campos existam como strings
                                phoneCountryData['billing_phone_country_code'] = phoneCountryData['billing_phone_country_code'] || '+55';
                                phoneCountryData['shipping_phone_country_code'] = phoneCountryData['shipping_phone_country_code'] || '+55';
                                
                                // Define ambos os campos com o valor do campo customizado
                                phoneCountryData['billing_phone_country_code'] = countryCode;
                                phoneCountryData['shipping_phone_country_code'] = countryCode;
                                
                                checkoutDispatch.__unstableSetExtensionData('woo_better_phone_country', phoneCountryData);
                                
                            } else {
                                console.warn('⚠️ [HIDDEN FIELDS] Nenhum método setExtensionData disponível!');
                            }
                        } else {
                            console.warn('⚠️ [HIDDEN FIELDS] dispatch(\'wc/store/checkout\') não disponível');
                        }
                    } catch (error) {
                        console.error('❌ [HIDDEN FIELDS] Erro no processamento WooCommerce Blocks:', error);
                    }
                } else {
                }
                
                // Para checkout tradicional
                
                // Verifica campo billing existente
                const existingBillingField = document.querySelector('input[name="billing_phone_country_code"]');
                if (existingBillingField) {
                    if (existingBillingField.value !== countryCode) {
                        existingBillingField.value = countryCode;
                    }
                } else {
                }
                
                // Verifica campo shipping existente
                const existingShippingField = document.querySelector('input[name="shipping_phone_country_code"]');
                if (existingShippingField) {
                    if (existingShippingField.value !== countryCode) {
                        existingShippingField.value = countryCode;
                    }
                } else {
                }
                
                // Só cria novos campos se não existirem
                const needsNewFields = !existingBillingField || !existingShippingField;
                
                if (needsNewFields) {
                    
                    // Cria campo billing somente se não existir
                    if (!existingBillingField) {
                        const billingHiddenField = document.createElement('input');
                        billingHiddenField.type = 'hidden';
                        billingHiddenField.name = 'billing_phone_country_code';
                        billingHiddenField.value = countryCode;
                        
                        // Adiciona ao formulário
                        const formSelectors = [
                            'form.checkout',
                            'form.woocommerce-checkout',
                            '.woocommerce-checkout form',
                            'form[name="checkout"]',
                            'form#checkout',
                            'form:has(input[name*="billing"])',
                            'form:has(input[name*="shipping"])'
                        ];
                        
                        let billingFormFound = false;
                        for (let selector of formSelectors) {
                            const checkoutForm = document.querySelector(selector);
                            if (checkoutForm) {
                                checkoutForm.appendChild(billingHiddenField);
                                billingFormFound = true;
                                break;
                            }
                        }
                        
                        if (!billingFormFound) {
                            const anyForm = document.querySelector('form');
                            if (anyForm) {
                                anyForm.appendChild(billingHiddenField);
                            }
                        }
                    }
                    
                    // Cria campo shipping somente se não existir
                    if (!existingShippingField) {
                        const shippingHiddenField = document.createElement('input');
                        shippingHiddenField.type = 'hidden';
                        shippingHiddenField.name = 'shipping_phone_country_code';
                        shippingHiddenField.value = countryCode;
                        
                        // Adiciona ao formulário
                        const formSelectors = [
                            'form.checkout',
                            'form.woocommerce-checkout',
                            '.woocommerce-checkout form',
                            'form[name="checkout"]',
                            'form#checkout',
                            'form:has(input[name*="billing"])',
                            'form:has(input[name*="shipping"])'
                        ];
                        
                        let shippingFormFound = false;
                        for (let selector of formSelectors) {
                            const checkoutForm = document.querySelector(selector);
                            if (checkoutForm) {
                                checkoutForm.appendChild(shippingHiddenField);
                                shippingFormFound = true;
                                break;
                            }
                        }
                        
                        if (!shippingFormFound) {
                            const anyForm = document.querySelector('form');
                            if (anyForm) {
                                anyForm.appendChild(shippingHiddenField);
                            }
                        }
                    }
                    
                    // Campos hidden processados com sucesso!
                } else {
                    // Todos os campos já existem, nenhuma criação necessária!
                }
                
                // SISTEMA DE DEBOUNCE PARA COUNTRY UPDATES (igual ao woo_better_phone_formatter)
                // Cancela timeout anterior se existir
                if (countryUpdateTimeout) {
                    clearTimeout(countryUpdateTimeout);
                }
                
                // Atualiza dados pendentes
                pendingCountryData.billing_phone_country_code = countryCode;
                pendingCountryData.shipping_phone_country_code = countryCode;
                
                // Agenda execução em 1.5s (igual ao formatter)
                countryUpdateTimeout = setTimeout(() => {
                    if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                        // Enviando extensionCartUpdate como backup para woo_better_phone_country (com debounce 1.5s)
                        // Cria cópia dos dados para envio
                        const countryDataToSend = { ...pendingCountryData };
                        
                        window.wc.blocksCheckout.extensionCartUpdate({
                            namespace: 'woo_better_phone_country',
                            data: countryDataToSend
                        });
                        // extensionCartUpdate executado
                    }
                    
                    countryUpdateTimeout = null;
                }, 1500); // 1.5s igual ao woo_better_phone_formatter
                
                // Verificação final - confirma que os campos estão presentes e com valores corretos
                setTimeout(() => {
                    const billingCheck = document.querySelector('input[name="billing_phone_country_code"]');
                    const shippingCheck = document.querySelector('input[name="shipping_phone_country_code"]');
                }, 100);
            }

            // Sistema centralizado de event handling com debounce coordenado
            if (isPhoneMaskEnabled && !customPhoneField.dataset.inputListenerAdded) {
                customPhoneField.dataset.inputListenerAdded = 'true';
                
                // Sistema de debounce inteligente que evita conflitos
                let coordinatedDebounceTimer = null;
                const COORDINATED_DEBOUNCE_DELAY = 200; // Otimizado para responsividade
                
                const coordinatedHandler = (event, eventType) => {
                    // Evita processamento simultâneo 
                    if (customPhoneField._isProcessingCoordinated) return;
                    
                    if (coordinatedDebounceTimer) {
                        clearTimeout(coordinatedDebounceTimer);
                    }
                    
                    coordinatedDebounceTimer = setTimeout(() => {
                        processCoordinatedUpdate(event, eventType);
                        coordinatedDebounceTimer = null;
                    }, COORDINATED_DEBOUNCE_DELAY);
                };
                
                const processCoordinatedUpdate = (event, eventType) => {
                    customPhoneField._isProcessingCoordinated = true;
                    
                    try {
                        const currentValue = event.target.value;
                        
                        // 1. APLICA FORMATAÇÃO (se phoneMaskEnabled = true)
                        let processedValue = currentValue;
                        if (eventType === 'input' && currentValue && currentValue.length > 0) {
                            // Só aplica formatação se o valor mudou significativamente
                            if (!isMinorChange(currentValue, event.target._lastProcessedValue)) {
                                applyCustomPhoneFormatting(event, 'Coordinated');
                                processedValue = event.target.value; // Valor após formatação
                            }
                        }
                        
                        // 2. CONTROLA CLASSE CSS
                        if (processedValue && processedValue.trim() !== '') {
                            customPhoneContainer.classList.add('is-active');
                        } else {
                            customPhoneContainer.classList.remove('is-active');
                        }
                        
                        // 3. SINCRONIZA COM CAMPOS REACT (usando função existente)
                        syncFormattedPhoneFields(processedValue);
                        
                        // Marca último valor processado
                        event.target._lastProcessedValue = processedValue;
                        
                    } finally {
                        // Libera o bloqueio após um pequeno delay
                        setTimeout(() => {
                            customPhoneField._isProcessingCoordinated = false;
                        }, 100);
                    }
                };
                
                // Função para detectar mudanças menores que não precisam formatação
                const isMinorChange = (currentValue, lastValue) => {
                    if (!lastValue) return false;
                    
                    // Considera mudança menor se diferença for apenas 1-2 caracteres
                    const diff = Math.abs(currentValue.length - lastValue.length);
                    return diff <= 2 && currentValue.includes(lastValue.substring(0, Math.min(lastValue.length, currentValue.length)));
                };
                
                // ÚNICO LISTENER DE INPUT centralizado
                customPhoneField.addEventListener('input', function(event) {
                    // Evita processamento se outros sistemas estão ativos
                    if (this._isSyncing || this._isProcessing) return;
                    
                    // Ignora eventos de composição (IME keyboards)
                    if (event.inputType === 'insertCompositionText' || 
                        event.inputType === 'selectAll' ||
                        event.isComposing) {
                        return;
                    }
                    
                    coordinatedHandler(event, 'input');
                }, { passive: true });
                
                // Listener para change (garantia de sincronização)
                customPhoneField.addEventListener('change', function(event) {
                    if (this._isSyncing || this._isProcessing) return;
                    coordinatedHandler(event, 'change');
                });
                customPhoneField.addEventListener('change', function(event) {
                    const currentValue = customPhoneField.value;
                    syncFormattedPhoneFields(currentValue);
                });
            }

            if (isPhoneMaskEnabled && !customPhoneField.dataset.countryChangeListenerAdded) {
                let countryChangeTimeout;
                customPhoneField.addEventListener('countrychange', function(event) {
                    if (countryChangeTimeout) clearTimeout(countryChangeTimeout);
                    
                    countryChangeTimeout = setTimeout(() => {
                        const countryData = iti.getSelectedCountryData();
                        
                        if (!countryData || !countryData.dialCode || countryData.dialCode === 'undefined') {
                            return;
                        }
                        
                        countryChanged = true;
                        const dialCode = '+' + countryData.dialCode;
                        
                        // Usa a função específica para atualizar campos hidden do campo customizado
                        updateCustomHiddenCountryCodeField(dialCode);
                        
                        Promise.resolve().then(() => {
                            const currentVal = customPhoneField.value;
                            if (currentVal.match(/^\(\d{2}\)\s\d{4,5}-\d{4}$/) || 
                                currentVal.match(/^\+\d{1,4}\s/) ||
                                (currentVal.startsWith('+') && currentVal.replace(/\D/g, '').length <= 4)) {
                                return;
                            }
                            applyCustomPhoneFormatting(event, 'Country Change');
                            
                            // Controla classe is-active após mudança de país
                            const currentValue = customPhoneField.value;
                            if (currentValue && currentValue.trim() !== '') {
                                customPhoneContainer.classList.add('is-active');
                            } else {
                                customPhoneContainer.classList.remove('is-active');
                            }
                            
                            // Sincroniza valor após mudança de país
                            syncFormattedPhoneFields(currentValue);
                        });
                        
                    }, 100);
                }, { passive: true });
                customPhoneField.dataset.countryChangeListenerAdded = 'true';
            }

            // Safari iOS Autofill Detection (SOMENTE SE phoneMaskEnabled estiver habilitado)
            if (isPhoneMaskEnabled && !customPhoneField.dataset.safariAutofillListenerAdded) {
                customPhoneField.addEventListener('animationstart', function(e) {
                    if (e.animationName === 'onautofillstart') {
                        applyCustomPhoneFormatting(e, 'Safari Autofill Correction');
                        
                        // Controla classe is-active após autofill
                        setTimeout(() => {
                            const currentValue = customPhoneField.value;
                            if (currentValue && currentValue.trim() !== '') {
                                customPhoneContainer.classList.add('is-active');
                            } else {
                                customPhoneContainer.classList.remove('is-active');
                            }
                        }, 10);
                    }
                });
                customPhoneField.dataset.safariAutofillListenerAdded = 'true';
            }

            // Atualiza campos hidden na inicialização
            setTimeout(() => {
                const countryData = iti.getSelectedCountryData();
                const dialCode = '+' + countryData.dialCode;
                updateCustomHiddenCountryCodeField(dialCode);
            }, 50);
        }

        // Configura sincronização após criar o campo
        setTimeout(() => {
            setupPhoneSync();
        }, 100);
    }

    // Função de sincronização com campo customizado como "pai"
    function setupPhoneSync() {
        // Verifica se a funcionalidade está habilitada
        if (typeof wc_better_checkout_phone_mask_vars === 'undefined' || 
            wc_better_checkout_phone_mask_vars.highlightPhone !== 'true') {
            return;
        }

        // Busca o campo customizado (pai)
        const customPhoneField = document.getElementById('custom-phone');
        if (!customPhoneField) {
            return;
        }

        // Encontra todos os campos de telefone existentes (filhos)
        const allPhoneFields = document.querySelectorAll([
            '#billing_phone',
            '#shipping_phone', 
            '#billing-phone',
            '#shipping-phone',
            'input[id*="phone"]:not(#custom-phone)',
            'input[type="tel"]:not(#custom-phone)',
            'input[name*="phone"]:not([name="custom_phone"])'
        ].join(','));

        const otherPhoneFields = Array.from(allPhoneFields).filter(field => 
            field !== customPhoneField && field.type === 'tel'
        );

        let syncing = false; // Flag para evitar loop infinito

        // Função para simular evento React (reutilizada)
        function triggerReactEvent(input, value) {
            if (!input) return;
            
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(input, value);

            const inputEvent = new Event('input', { 
                bubbles: true, 
                cancelable: true 
            });
            
            const changeEvent = new Event('change', { 
                bubbles: true, 
                cancelable: true 
            });

            if (input._valueTracker) {
                input._valueTracker.setValue('');
            }

            input.dispatchEvent(inputEvent);
            input.dispatchEvent(changeEvent);

            setTimeout(() => {
                input.dispatchEvent(new Event('blur', { bubbles: true }));
                input.dispatchEvent(new Event('focus', { bubbles: true }));
            }, 10);
        }

        // CAMPO CUSTOMIZADO como PAI - sincroniza para todos os filhos
        // Sistema de sincronização já implementado no listener centralizado acima
        // Remove listener duplicado para evitar conflitos
        customPhoneField.dataset.syncParentListener = 'true';

        // Observer para recriar campos e esconder automaticamente
        const fieldObserver = new MutationObserver(() => {
            // Re-esconde campos que podem ter sido recriados
            const newPhoneFields = document.querySelectorAll([
                '#billing_phone',
                '#shipping_phone',
                '#billing-phone', 
                '#shipping-phone',
                'input[id*="phone"]:not(#custom-phone)',
                'input[type="tel"]:not(#custom-phone)',
                'input[name*="phone"]:not([name="custom_phone"])'
            ].join(','));

            let hasNewFields = false;
            
            Array.from(newPhoneFields).forEach(field => {
                const container = field.closest('.wc-block-components-text-input, .form-row');
                // Usa classe de controle para evitar processamento repetido
                if (container && !container.dataset.phoneHidden && !container.classList.contains('wc-custom-phone-processed')) {
                    container.style.display = 'none';
                    container.dataset.phoneHidden = 'true';
                    container.classList.add('wc-custom-phone-processed');
                    hasNewFields = true;
                    
                    // Sincroniza valor do campo pai para o novo campo
                    if (customPhoneField && field.type === 'tel') {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(field, customPhoneField.value);
                        triggerReactEvent(field, customPhoneField.value);
                    }
                }
            });

            // Só re-configura se houver novos campos
            if (hasNewFields) {
                setTimeout(setupPhoneSync, 100);
            }
        });

        fieldObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class']
        });
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
                        
                        // BACKUP: extensionCartUpdate com debounce de 1.5s para inicialização (sincronizado com woo_better_phone_formatter)
                        if (countryUpdateTimeout) {
                            clearTimeout(countryUpdateTimeout);
                        }
                        
                        // Atualiza dados pendentes na inicialização
                        pendingCountryData.billing_phone_country_code = phoneCountryData.billing_phone_country_code;
                        pendingCountryData.shipping_phone_country_code = phoneCountryData.shipping_phone_country_code;
                        
                        countryUpdateTimeout = setTimeout(() => {
                            if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                const countryDataToSend = { ...pendingCountryData };
                                window.wc.blocksCheckout.extensionCartUpdate({
                                    namespace: 'woo_better_phone_country',
                                    data: countryDataToSend
                                });
                            }
                            countryUpdateTimeout = null;
                        }, 1500);
                    }
                }
            } catch (error) {
                // Silenciar erro
            }
        }
    }

    // Inicializar campos do Store API
    initializeStoreAPIFields();
    
    initPhoneInput();

    // VALIDAÇÃO DO TELEFONE - Impede submissão quando telefone é obrigatório e está vazio
    function setupPhoneValidation() {
        // Verifica se a validação está habilitada
        const isPhoneRequired = (typeof wc_better_checkout_phone_mask_vars !== 'undefined' && 
                                wc_better_checkout_phone_mask_vars.phoneRequired === 'true');
        
        if (!isPhoneRequired) {
            // phoneRequired=false, validação desabilitada
            return;
        }

        // phoneRequired=true, configurando validação

        // Função para validar telefone
        function validatePhoneField() {
            // Busca todos os campos de telefone possíveis
            const phoneFieldsToCheck = [
                document.querySelector('#custom-phone'), // Campo customizado tem prioridade
                document.querySelector('#billing_phone'),
                document.querySelector('#shipping_phone'),
                document.querySelector('#billing-phone'),
                document.querySelector('#shipping-phone'),
                document.querySelector('input[name="billing_phone"]'),
                document.querySelector('input[name="shipping_phone"]')
            ].filter(field => field && field.offsetParent !== null); // Remove campos ocultos


            // Verifica se pelo menos um campo está preenchido
            let hasValidPhone = false;
            let firstEmptyField = null;

            for (const field of phoneFieldsToCheck) {
                const value = field.value.trim();
                
                // Considera válido se tem qualquer conteúdo (não está vazio)
                if (value !== '') {
                    hasValidPhone = true;
                    break;
                } else if (!firstEmptyField) {
                    firstEmptyField = field;
                }
            }

            return {
                isValid: hasValidPhone,
                firstEmptyField: firstEmptyField || phoneFieldsToCheck[0] // Fallback para o primeiro campo
            };
        }

        // Função para exibir erro de validação
        function displayPhoneError(field, message) {
            if (!field) return;


            // Remove erros existentes
            removePhoneError(field);

            // Cria elemento de erro
            const errorElement = document.createElement('div');
            errorElement.className = 'wc-phone-validation-error';
            errorElement.style.cssText = `
                color: #d63638;
                font-size: 14px;
                margin-top: 5px;
                display: block;
                line-height: 1;
            `;
            errorElement.textContent = message;

            // Define ID único para poder remover depois
            errorElement.id = 'wc-phone-error-' + (field.id || field.name || 'generic');

            // Insere o erro após o campo ou seu container
            const container = field.closest('.wc-block-components-text-input, .form-row') || field.parentElement;
            if (container) {
                container.appendChild(errorElement);
            } else {
                field.parentElement.appendChild(errorElement);
            }

            // Adiciona classe de erro ao campo
            field.classList.add('wc-phone-validation-error-field');
            field.style.borderColor = '#d63638';

            // Foco no campo com erro
            setTimeout(() => field.focus(), 100);
        }

        // Função para remover erro de validação
        function removePhoneError(field) {
            if (!field) return;

            const errorId = 'wc-phone-error-' + (field.id || field.name || 'generic');
            const existingError = document.getElementById(errorId);
            if (existingError) {
                existingError.remove();
            }

            // Remove classes de erro
            field.classList.remove('wc-phone-validation-error-field');
            field.style.borderColor = '';
        }

        // Handler para validação no submit do formulário
        function handleFormSubmit(event) {
            
            const validation = validatePhoneField();
            
            if (!validation.isValid) {
                
                event.preventDefault();
                event.stopImmediatePropagation();
                
                const errorMessage = 'Por favor, preencha um número de telefone válido.';
                displayPhoneError(validation.firstEmptyField, errorMessage);
                
                return false;
            }

            removePhoneError(validation.firstEmptyField);
            return true;
        }

        // Intercepta submissão do checkout tradicional
        function setupTraditionalCheckoutValidation() {
            const checkoutForms = document.querySelectorAll('form.checkout, form[name="checkout"]');
            checkoutForms.forEach(form => {
                if (!form.dataset.phoneValidationSetup) {
                    form.addEventListener('submit', handleFormSubmit, { capture: true, passive: false });
                    form.dataset.phoneValidationSetup = 'true';
                    // Validação configurada para checkout tradicional
                }
            });
        }

        // Intercepta submissão do WooCommerce Blocks
        function setupBlocksCheckoutValidation() {
            // Verifica se já foi configurado para evitar múltiplas configurações
            if (window.wcBscBrazilBlocksValidationSetup) {
                return; // Já configurado, não fazer novamente
            }
            
            // Hook para WooCommerce Blocks usando extensionCartUpdate
            if (typeof wp !== 'undefined' && wp.data && wp.hooks) {
                // Intercepta ações de checkout nos blocks
                const checkoutStore = wp.data.select('wc/store/checkout');
                
                if (checkoutStore) {
                    // Monitora mudanças no status do checkout
                    let lastCheckoutStatus = '';
                    
                    const unsubscribe = wp.data.subscribe(() => {
                        try {
                            const currentStatus = checkoutStore.getCheckoutStatus();
                            
                            // Se o status mudou para 'processing' (submissão iniciando)
                            if (currentStatus !== lastCheckoutStatus && currentStatus === 'processing') {
                                // Checkout blocks sendo processado, validando...
                                
                                const validation = validatePhoneField();
                                
                                if (!validation.isValid) {
                                    
                                    const errorMessage = 'Por favor, preencha um número de telefone válido.';
                                    displayPhoneError(validation.firstEmptyField, errorMessage);
                                    
                                    // Tenta interromper o processo (pode não ser 100% efetivo)
                                    setTimeout(() => {
                                        const checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                                        if (checkoutDispatch && checkoutDispatch.setCheckoutStatus) {
                                            checkoutDispatch.setCheckoutStatus('idle');
                                        }
                                    }, 0);
                                } else {
                                    removePhoneError(validation.firstEmptyField);
                                }
                            }
                            
                            lastCheckoutStatus = currentStatus;
                        } catch (error) {
                            console.debug('Erro no monitor de blocks checkout:', error);
                        }
                    });
                    
                    // Cleanup quando sair da página
                    window.addEventListener('beforeunload', unsubscribe);
                    
                    // Marca como configurado e exibe mensagem apenas uma vez
                    window.wcBscBrazilBlocksValidationSetup = true;
                    // Monitor de WooCommerce Blocks configurado
                }
            }

            // Fallback: Intercepta cliques no botão de place order
            function setupPlaceOrderButtonInterception() {
                const placeOrderButtons = document.querySelectorAll(
                    '.wc-block-components-checkout-place-order-button, ' +
                    '.wc-block-checkout__place-order-button, ' +
                    'button[class*="place-order"], ' +
                    'button[class*="checkout-button"]'
                );

                placeOrderButtons.forEach(button => {
                    if (!button.dataset.phoneValidationSetup) {
                        button.addEventListener('click', function(event) {
                            
                            const validation = validatePhoneField();
                            
                            if (!validation.isValid) {
                                
                                event.preventDefault();
                                event.stopImmediatePropagation();
                                
                                const errorMessage = 'Por favor, preencha um número de telefone válido.';
                                displayPhoneError(validation.firstEmptyField, errorMessage);
                                
                                return false;
                            }

                            removePhoneError(validation.firstEmptyField);
                        }, { capture: true, passive: false });
                        
                        button.dataset.phoneValidationSetup = 'true';
                    }
                });
            }

            setupPlaceOrderButtonInterception();
        }

        // Configuração inicial
        setupTraditionalCheckoutValidation();
        setupBlocksCheckoutValidation();

        // Re-configura validação quando novos elementos são adicionados
        const validationObserver = new MutationObserver(() => {
            setupTraditionalCheckoutValidation();
            setupBlocksCheckoutValidation();
        });

        validationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Sistema de validação totalmente configurado
    }

    // Inicializa validação após um delay para garantir que os campos estejam prontos
    setTimeout(setupPhoneValidation, 500);

    const observer = new MutationObserver(function(mutations) {
        try {
            mutations.forEach(function(mutation) {
                try {
                    if (mutation.type === 'childList') {
                        mutation.addedNodes.forEach(function(node) {
                            try {
                                if (node.nodeType === Node.ELEMENT_NODE) {
                                    const phoneInputs = node.querySelectorAll ? 
                                        node.querySelectorAll('input[id*="phone"], input[type="tel"]') : [];
                                    
                                    if (phoneInputs.length > 0 || 
                                        (node.id && node.id.includes('phone')) ||
                                        (node.type === 'tel')) {
                                        setTimeout(initPhoneInput, 100);
                                    }
                                    
                                    if (node.className && 
                                        (node.className.includes('wc-block-components-address-form') ||
                                         node.className.includes('wc-block-checkout'))) {
                                        setTimeout(initPhoneInput, 200);
                                    }
                                }
                            } catch (nodeError) {
                                // Silently ignore node processing errors
                                console.debug('Node processing error:', nodeError);
                            }
                        });
                    }
                } catch (mutationError) {
                    // Silently ignore mutation processing errors
                }
            });
        } catch (observerError) {
            // Silently ignore observer errors
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id']
    });
});