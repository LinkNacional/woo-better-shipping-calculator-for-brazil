import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import intlTelInputUtils from 'intl-tel-input/build/js/utils.js';
import { pt } from 'intl-tel-input/i18n';

jQuery(function ($) {

    function initPhoneInput() {
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

                let paddingLeftValue = phoneField.style.paddingLeft
                
                phoneField.style.setProperty('padding-left', paddingLeftValue, 'important');
                
                // Formata valor inicial se já existir um número com +
                const initialValue = phoneField.value;
                if (initialValue && initialValue.includes('+')) {
                    setTimeout(() => {
                        formatInitialPhoneValue(initialValue);
                    }, 100);
                }
                
                // Define valor padrão (+55 Brasil) nos campos hidden se estiverem vazios
                function setDefaultCountryCode() {
                    let hiddenFieldId = '';
                    if (phoneField.id === 'billing_phone' || phoneField.id === 'billing-phone') {
                        hiddenFieldId = '#billing_phone_country';
                    } else if (phoneField.id === 'shipping_phone' || phoneField.id === 'shipping-phone') {
                        hiddenFieldId = '#shipping_phone_country';
                    }
                    
                    if (hiddenFieldId) {
                        const hiddenField = document.querySelector(hiddenFieldId);
                        if (hiddenField && (!hiddenField.value || hiddenField.value.trim() === '')) {
                            hiddenField.value = '+55';
                            // Dispara evento change no campo hidden
                            if (window.jQuery) {
                                $(hiddenField).trigger('change');
                            }
                        } else {
                        }
                    }
                }
                
                // Executa a definição do valor padrão imediatamente
                setDefaultCountryCode();
                
                // Verifica se o número já tem código internacional e ajusta o país
                function checkAndSetInitialCountry() {
                    const currentValue = phoneField.value;
                    
                    if (currentValue && currentValue.trim() !== '') {
                        // Deixa a biblioteca detectar automaticamente o país baseado no número
                        // Pequeno delay para garantir que a biblioteca processou
                        setTimeout(() => {
                            const countryData = iti.getSelectedCountryData();
                            const dialCode = '+' + countryData.dialCode;
                            
                            // Atualiza o campo hidden correspondente
                            let hiddenFieldId = '';
                            if (phoneField.id === 'billing_phone' || phoneField.id === 'billing-phone') {
                                hiddenFieldId = '#billing_phone_country';
                            } else if (phoneField.id === 'shipping_phone' || phoneField.id === 'shipping-phone') {
                                hiddenFieldId = '#shipping_phone_country';
                            }
                            
                            if (hiddenFieldId) {
                                const hiddenField = document.querySelector(hiddenFieldId);
                                if (hiddenField) {
                                    hiddenField.value = dialCode;
                                    // Dispara evento change no campo hidden
                                    if (window.jQuery) {
                                        $(hiddenField).trigger('change');
                                    }
                                } else {
                                }
                            }
                        }, 200); // Delay para garantir que a biblioteca processou o número
                    } else {
                    }
                }
                
                // Executa a verificação inicial após um pequeno delay
                setTimeout(checkAndSetInitialCountry, 100);
                
                function formatInitialPhoneValue(initialValue) {
                    try {
                        if (!initialValue || !initialValue.includes('+')) {
                            return;
                        }
                        
                        // Mapeamento de códigos de país (sem depender da API da biblioteca)
                        const dialCodeMap = {
                            '1': 'us', '7': 'ru', '20': 'eg', '27': 'za', '30': 'gr', '31': 'nl', '32': 'be', '33': 'fr',
                            '34': 'es', '36': 'hu', '39': 'it', '40': 'ro', '41': 'ch', '43': 'at', '44': 'gb', '45': 'dk',
                            '46': 'se', '47': 'no', '48': 'pl', '49': 'de', '51': 'pe', '52': 'mx', '53': 'cu', '54': 'ar',
                            '55': 'br', '56': 'cl', '57': 'co', '58': 've', '60': 'my', '61': 'au', '62': 'id', '63': 'ph',
                            '64': 'nz', '65': 'sg', '66': 'th', '81': 'jp', '82': 'kr', '84': 'vn', '86': 'cn', '90': 'tr',
                            '91': 'in', '92': 'pk', '93': 'af', '94': 'lk', '95': 'mm', '98': 'ir', '212': 'ma', '213': 'dz',
                            '216': 'tn', '218': 'ly', '220': 'gm', '221': 'sn', '222': 'mr', '223': 'ml', '224': 'gn',
                            '225': 'ci', '226': 'bf', '227': 'ne', '228': 'tg', '229': 'bj', '230': 'mu', '231': 'lr',
                            '232': 'sl', '233': 'gh', '234': 'ng', '235': 'td', '236': 'cf', '237': 'cm', '238': 'cv',
                            '239': 'st', '240': 'gq', '241': 'ga', '242': 'cg', '243': 'cd', '244': 'ao', '245': 'gw',
                            '246': 'io', '247': 'ac', '248': 'sc', '249': 'sd', '250': 'rw', '251': 'et', '252': 'so',
                            '253': 'dj', '254': 'ke', '255': 'tz', '256': 'ug', '257': 'bi', '258': 'mz', '260': 'zm',
                            '261': 'mg', '262': 're', '263': 'zw', '264': 'na', '265': 'mw', '266': 'ls', '267': 'bw',
                            '268': 'sz', '269': 'km', '290': 'sh', '291': 'er', '297': 'aw', '298': 'fo', '299': 'gl',
                            '350': 'gi', '351': 'pt', '352': 'lu', '353': 'ie', '354': 'is', '355': 'al', '356': 'mt',
                            '357': 'cy', '358': 'fi', '359': 'bg', '370': 'lt', '371': 'lv', '372': 'ee', '373': 'md',
                            '374': 'am', '375': 'by', '376': 'ad', '377': 'mc', '378': 'sm', '380': 'ua', '381': 'rs',
                            '382': 'me', '383': 'xk', '385': 'hr', '386': 'si', '387': 'ba', '389': 'mk', '420': 'cz',
                            '421': 'sk', '423': 'li', '500': 'fk', '501': 'bz', '502': 'gt', '503': 'sv', '504': 'hn',
                            '505': 'ni', '506': 'cr', '507': 'pa', '508': 'pm', '509': 'ht', '590': 'gp', '591': 'bo',
                            '592': 'gy', '593': 'ec', '594': 'gf', '595': 'py', '596': 'mq', '597': 'sr', '598': 'uy',
                            '599': 'cw', '670': 'tl', '672': 'aq', '673': 'bn', '674': 'nr', '675': 'pg', '676': 'to',
                            '677': 'sb', '678': 'vu', '679': 'fj', '680': 'pw', '681': 'wf', '682': 'ck', '683': 'nu',
                            '684': 'as', '685': 'ws', '686': 'ki', '687': 'nc', '688': 'tv', '689': 'pf', '690': 'tk',
                            '691': 'fm', '692': 'mh', '850': 'kp', '852': 'hk', '853': 'mo', '855': 'kh', '856': 'la',
                            '880': 'bd', '886': 'tw', '960': 'mv', '961': 'lb', '962': 'jo', '963': 'sy', '964': 'iq',
                            '965': 'kw', '966': 'sa', '967': 'ye', '968': 'om', '970': 'ps', '971': 'ae', '972': 'il',
                            '973': 'bh', '974': 'qa', '975': 'bt', '976': 'mn', '977': 'np', '992': 'tj', '993': 'tm',
                            '994': 'az', '995': 'ge', '996': 'kg', '998': 'uz'
                        };
                        
                        // Remove espaços e caracteres especiais, mantém só números após o +
                        const cleanValue = initialValue.replace(/[^\d+]/g, '');
                        
                        if (cleanValue.startsWith('+') && cleanValue.length > 1) {
                            // Extrai apenas os números após o +
                            const numbers = cleanValue.substring(1);
                            
                            if (numbers.length > 0) {
                                // Tenta diferentes tamanhos de código de país, do MAIOR para o MENOR (4→3→2→1)
                                let countryDetected = false;
                                
                                for (let codeLength = Math.min(4, numbers.length); codeLength >= 1 && !countryDetected; codeLength--) {
                                    const potentialCode = numbers.substring(0, codeLength);
                                    const remainingNumber = numbers.substring(codeLength); // Remove o código do país
                                    
                                    // Verifica se este código existe no mapeamento
                                    const foundCountryIso = dialCodeMap[potentialCode];
                                    
                                    // Só aceita se o código é válido E tem número suficiente restante
                                    if (foundCountryIso && remainingNumber.length >= 8) { // Mínimo de 8 dígitos para um telefone válido
                                        // Define o país correto ANTES da formatação
                                        iti.setCountry(foundCountryIso);
                                        
                                        // Pequeno delay para garantir que o país foi definido
                                        setTimeout(() => {
                                            try {
                                                // Formata apenas o número local (remainingNumber) SEM o código do país
                                                const formatted = intlTelInputUtils.formatNumber(
                                                    remainingNumber, // Usa APENAS o número sem código
                                                    foundCountryIso, 
                                                    intlTelInputUtils.numberFormat.NATIONAL
                                                );

                                                // VERIFICAÇÃO: Impede formatação que remove dígitos
                                                const inputDigits = remainingNumber.replace(/\D/g, '');
                                                const outputDigits = formatted ? formatted.replace(/\D/g, '') : '';

                                                if (formatted && formatted !== 'Invalid number' && inputDigits === outputDigits) {
                                                    // Resultado final: +código + espaço + número formatado nacionalmente
                                                    phoneField.value = `+${potentialCode} ${formatted}`;
                                                } else {
                                                    // Se formatação falhou, usa formato simples
                                                    phoneField.value = `+${potentialCode} ${remainingNumber}`;
                                                }
                                                
                                                // Atualiza campo hidden
                                                let hiddenFieldId = '';
                                                if (phoneField.id === 'billing_phone' || phoneField.id === 'billing-phone') {
                                                    hiddenFieldId = '#billing_phone_country';
                                                } else if (phoneField.id === 'shipping_phone' || phoneField.id === 'shipping-phone') {
                                                    hiddenFieldId = '#shipping_phone_country';
                                                }
                                                
                                                if (hiddenFieldId) {
                                                    const hiddenField = document.querySelector(hiddenFieldId);
                                                    if (hiddenField) {
                                                        hiddenField.value = `+${potentialCode}`;
                                                        if (window.jQuery) {
                                                            $(hiddenField).trigger('change');
                                                        }
                                                    }
                                                }
                                                
                                            } catch (formatError) {
                                                console.warn('Erro na formatação do número:', formatError);
                                                // Fallback: formato simples
                                                phoneField.value = `+${potentialCode} ${remainingNumber}`;
                                            }
                                        }, 50);
                                        
                                        countryDetected = true;
                                        break;
                                    }
                                }
                                
                                // Se não conseguiu detectar país válido, mantém valor original
                                if (!countryDetected) {
                                    console.warn('Não foi possível detectar país para:', initialValue);
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
                            lastFormattedValue = currentValue;
                            isFormatting = false;
                            return;
                        }
                        
                        // Se o valor contém apenas caracteres especiais sem números, limpa o campo
                        // EXCETO se é apenas '+' no início (permite começar número internacional)
                        const onlyDigits = currentValue.replace(/\D/g, '');
                        if (onlyDigits === '' && currentValue.trim() !== '' && currentValue.trim() !== '+') {
                            const cursorPos = phoneField.selectionStart || 0;
                            setValueAndCursor(phoneField, '', currentValue, cursorPos);
                            lastFormattedValue = '';
                            isFormatting = false;
                            return;
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
                                    // Permite continuar digitando (sem limitação de dígitos)
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
                                                // Se a formatação removeu dígitos, NÃO aplica e limpa caracteres especiais
                                                if (inputDigits.length > outputDigits.length) {
                                                    const cleanedValue = currentValue.replace(/\D/g, '');
                                                    const cursorPos = phoneField.selectionStart || 0;
                                                    setValueAndCursor(phoneField, cleanedValue, currentValue, cursorPos);
                                                    lastFormattedValue = cleanedValue;
                                                    isFormatting = false;
                                                    return;
                                                }
                                                
                                                // Usa o código que o usuário digitou, não o detectado pela biblioteca
                                                const finalValue = `+${userDialCode} ${formatted}`;
                                                
                                                setTimeout(() => {
                                                    const cursorPos = phoneField.selectionStart || 0;
                                                    setValueAndCursor(phoneField, finalValue, currentValue, cursorPos);
                                                    lastFormattedValue = finalValue;
                                                    isFormatting = false;
                                                    
                                                    // Trigger jQuery change após 1s para salvar no shortcode
                                                    setTimeout(() => {
                                                        if (window.jQuery) {
                                                            $(phoneField).trigger('change');
                                                        }
                                                    }, 1000);
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
                            
                            // Função para encontrar país pelo código de discagem
                            function findCountryByDialCode(dialCode) {
                                const dialCodeMap = {
                                    '1': 'us', '7': 'ru', '20': 'eg', '27': 'za', '30': 'gr', '31': 'nl', '32': 'be', '33': 'fr',
                                    '34': 'es', '36': 'hu', '39': 'it', '40': 'ro', '41': 'ch', '43': 'at', '44': 'gb', '45': 'dk',
                                    '46': 'se', '47': 'no', '48': 'pl', '49': 'de', '51': 'pe', '52': 'mx', '53': 'cu', '54': 'ar',
                                    '55': 'br', '56': 'cl', '57': 'co', '58': 've', '60': 'my', '61': 'au', '62': 'id', '63': 'ph',
                                    '64': 'nz', '65': 'sg', '66': 'th', '81': 'jp', '82': 'kr', '84': 'vn', '86': 'cn', '90': 'tr',
                                    '91': 'in', '92': 'pk', '93': 'af', '94': 'lk', '95': 'mm', '98': 'ir', '212': 'ma', '213': 'dz',
                                    '216': 'tn', '218': 'ly', '220': 'gm', '221': 'sn', '222': 'mr', '223': 'ml', '224': 'gn',
                                    '225': 'ci', '226': 'bf', '227': 'ne', '228': 'tg', '229': 'bj', '230': 'mu', '231': 'lr',
                                    '232': 'sl', '233': 'gh', '234': 'ng', '235': 'td', '236': 'cf', '237': 'cm', '238': 'cv',
                                    '239': 'st', '240': 'gq', '241': 'ga', '242': 'cg', '243': 'cd', '244': 'ao', '245': 'gw',
                                    '246': 'io', '247': 'ac', '248': 'sc', '249': 'sd', '250': 'rw', '251': 'et', '252': 'so',
                                    '253': 'dj', '254': 'ke', '255': 'tz', '256': 'ug', '257': 'bi', '258': 'mz', '260': 'zm',
                                    '261': 'mg', '262': 're', '263': 'zw', '264': 'na', '265': 'mw', '266': 'ls', '267': 'bw',
                                    '268': 'sz', '269': 'km', '290': 'sh', '291': 'er', '297': 'aw', '298': 'fo', '299': 'gl',
                                    '350': 'gi', '351': 'pt', '352': 'lu', '353': 'ie', '354': 'is', '355': 'al', '356': 'mt',
                                    '357': 'cy', '358': 'fi', '359': 'bg', '370': 'lt', '371': 'lv', '372': 'ee', '373': 'md',
                                    '374': 'am', '375': 'by', '376': 'ad', '377': 'mc', '378': 'sm', '380': 'ua', '381': 'rs',
                                    '382': 'me', '383': 'xk', '385': 'hr', '386': 'si', '387': 'ba', '389': 'mk', '420': 'cz',
                                    '421': 'sk', '423': 'li', '500': 'fk', '501': 'bz', '502': 'gt', '503': 'sv', '504': 'hn',
                                    '505': 'ni', '506': 'cr', '507': 'pa', '508': 'pm', '509': 'ht', '590': 'gp', '591': 'bo',
                                    '592': 'gy', '593': 'ec', '594': 'gf', '595': 'py', '596': 'mq', '597': 'sr', '598': 'uy',
                                    '599': 'cw', '670': 'tl', '672': 'aq', '673': 'bn', '674': 'nr', '675': 'pg', '676': 'to',
                                    '677': 'sb', '678': 'vu', '679': 'fj', '680': 'pw', '681': 'wf', '682': 'ck', '683': 'nu',
                                    '684': 'as', '685': 'ws', '686': 'ki', '687': 'nc', '688': 'tv', '689': 'pf', '690': 'tk',
                                    '691': 'fm', '692': 'mh', '850': 'kp', '852': 'hk', '853': 'mo', '855': 'kh', '856': 'la',
                                    '880': 'bd', '886': 'tw', '960': 'mv', '961': 'lb', '962': 'jo', '963': 'sy', '964': 'iq',
                                    '965': 'kw', '966': 'sa', '967': 'ye', '968': 'om', '970': 'ps', '971': 'ae', '972': 'il',
                                    '973': 'bh', '974': 'qa', '975': 'bt', '976': 'mn', '977': 'np', '992': 'tj', '993': 'tm',
                                    '994': 'az', '995': 'ge', '996': 'kg', '998': 'uz'
                                };
                                
                                return dialCodeMap[dialCode] || null;
                            }
                            
                            // Função para verificar se ainda há possibilidades de códigos maiores
                            function hasLongerCodePossibilities(currentCode) {
                                const dialCodeMap = {
                                    '1': 'us', '7': 'ru', '20': 'eg', '27': 'za', '30': 'gr', '31': 'nl', '32': 'be', '33': 'fr',
                                    '34': 'es', '36': 'hu', '39': 'it', '40': 'ro', '41': 'ch', '43': 'at', '44': 'gb', '45': 'dk',
                                    '46': 'se', '47': 'no', '48': 'pl', '49': 'de', '51': 'pe', '52': 'mx', '53': 'cu', '54': 'ar',
                                    '55': 'br', '56': 'cl', '57': 'co', '58': 've', '60': 'my', '61': 'au', '62': 'id', '63': 'ph',
                                    '64': 'nz', '65': 'sg', '66': 'th', '81': 'jp', '82': 'kr', '84': 'vn', '86': 'cn', '90': 'tr',
                                    '91': 'in', '92': 'pk', '93': 'af', '94': 'lk', '95': 'mm', '98': 'ir', '212': 'ma', '213': 'dz',
                                    '216': 'tn', '218': 'ly', '220': 'gm', '221': 'sn', '222': 'mr', '223': 'ml', '224': 'gn',
                                    '225': 'ci', '226': 'bf', '227': 'ne', '228': 'tg', '229': 'bj', '230': 'mu', '231': 'lr',
                                    '232': 'sl', '233': 'gh', '234': 'ng', '235': 'td', '236': 'cf', '237': 'cm', '238': 'cv',
                                    '239': 'st', '240': 'gq', '241': 'ga', '242': 'cg', '243': 'cd', '244': 'ao', '245': 'gw',
                                    '246': 'io', '247': 'ac', '248': 'sc', '249': 'sd', '250': 'rw', '251': 'et', '252': 'so',
                                    '253': 'dj', '254': 'ke', '255': 'tz', '256': 'ug', '257': 'bi', '258': 'mz', '260': 'zm',
                                    '261': 'mg', '262': 're', '263': 'zw', '264': 'na', '265': 'mw', '266': 'ls', '267': 'bw',
                                    '268': 'sz', '269': 'km', '290': 'sh', '291': 'er', '297': 'aw', '298': 'fo', '299': 'gl',
                                    '350': 'gi', '351': 'pt', '352': 'lu', '353': 'ie', '354': 'is', '355': 'al', '356': 'mt',
                                    '357': 'cy', '358': 'fi', '359': 'bg', '370': 'lt', '371': 'lv', '372': 'ee', '373': 'md',
                                    '374': 'am', '375': 'by', '376': 'ad', '377': 'mc', '378': 'sm', '380': 'ua', '381': 'rs',
                                    '382': 'me', '383': 'xk', '385': 'hr', '386': 'si', '387': 'ba', '389': 'mk', '420': 'cz',
                                    '421': 'sk', '423': 'li', '500': 'fk', '501': 'bz', '502': 'gt', '503': 'sv', '504': 'hn',
                                    '505': 'ni', '506': 'cr', '507': 'pa', '508': 'pm', '509': 'ht', '590': 'gp', '591': 'bo',
                                    '592': 'gy', '593': 'ec', '594': 'gf', '595': 'py', '596': 'mq', '597': 'sr', '598': 'uy',
                                    '599': 'cw', '670': 'tl', '672': 'aq', '673': 'bn', '674': 'nr', '675': 'pg', '676': 'to',
                                    '677': 'sb', '678': 'vu', '679': 'fj', '680': 'pw', '681': 'wf', '682': 'ck', '683': 'nu',
                                    '684': 'as', '685': 'ws', '686': 'ki', '687': 'nc', '688': 'tv', '689': 'pf', '690': 'tk',
                                    '691': 'fm', '692': 'mh', '850': 'kp', '852': 'hk', '853': 'mo', '855': 'kh', '856': 'la',
                                    '880': 'bd', '886': 'tw', '960': 'mv', '961': 'lb', '962': 'jo', '963': 'sy', '964': 'iq',
                                    '965': 'kw', '966': 'sa', '967': 'ye', '968': 'om', '970': 'ps', '971': 'ae', '972': 'il',
                                    '973': 'bh', '974': 'qa', '975': 'bt', '976': 'mn', '977': 'np', '992': 'tj', '993': 'tm',
                                    '994': 'az', '995': 'ge', '996': 'kg', '998': 'uz'
                                };
                                
                                // Verifica se existe algum código que INICIA com currentCode
                                return Object.keys(dialCodeMap).some(code => 
                                    code.startsWith(currentCode) && code.length > currentCode.length
                                );
                            }
                            
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

                                                            // VERIFICAÇÃO CRÍTICA: Impede formatação que remove dígitos
                                                            const inputDigits = cleanLocalNumber.replace(/\D/g, '');
                                                            const outputDigits = formatted.replace(/\D/g, '');

                                                            if (formatted && formatted !== 'Invalid number') {
                                                                // Se a formatação removeu dígitos, NÃO aplica e limpa caracteres especiais
                                                                if (inputDigits.length > outputDigits.length) {
                                                                    const cleanedValue = currentValue.replace(/\D/g, '');
                                                                    const cursorPos = phoneField.selectionStart || 0;
                                                                    setValueAndCursor(phoneField, cleanedValue, currentValue, cursorPos);
                                                                    lastFormattedValue = cleanedValue;
                                                                    isFormatting = false;
                                                                    return;
                                                                }
                                                                
                                                                // Reconecta: código + espaço + número formatado
                                                                const finalValue = `+${testCode} ${formatted}`;
                                                                
                                                                const cursorPos = phoneField.selectionStart || 0;
                                                                setValueAndCursor(phoneField, finalValue, currentValue, cursorPos);
                                                                lastFormattedValue = finalValue;
                                                                isFormatting = false;
                                                                
                                                                // Atualiza campo hidden
                                                                let hiddenFieldId = '';
                                                                if (phoneField.id === 'billing_phone' || phoneField.id === 'billing-phone') {
                                                                    hiddenFieldId = '#billing_phone_country';
                                                                } else if (phoneField.id === 'shipping_phone' || phoneField.id === 'shipping-phone') {
                                                                    hiddenFieldId = '#shipping_phone_country';
                                                                }
                                                                
                                                                if (hiddenFieldId) {
                                                                    const hiddenField = document.querySelector(hiddenFieldId);
                                                                    if (hiddenField) {
                                                                        hiddenField.value = `+${testCode}`;
                                                                        if (window.jQuery) {
                                                                            $(hiddenField).trigger('change');
                                                                        }
                                                                    }
                                                                }
                                                                
                                                                // Trigger jQuery change após 1s para salvar no shortcode
                                                                setTimeout(() => {
                                                                    if (window.jQuery) {
                                                                        $(phoneField).trigger('change');
                                                                    }
                                                                }, 1000);
                                                                return;
                                                            }
                                                        } catch (formatError) {
                                                            // Continue para próximo código
                                                        }
                                                    }
                                                }
                                            }, 50);
                                            countryDetected = true;
                                        }
                                    }
                                }
                                
                                // Se não detectou país válido, verifica se ainda há possibilidades de códigos maiores
                                if (!countryDetected) {
                                    const currentInput = potentialDialCode;
                                    
                                    // Se não há mais possibilidades de códigos maiores E tem um país válido com o código atual
                                    if (!hasLongerCodePossibilities(currentInput) && findCountryByDialCode(currentInput) && restOfNumber.length >= 1) {
                                        const finalValue = `+${currentInput} ${restOfNumber}`;
                                        
                                        const cursorPos = phoneField.selectionStart || 0;
                                        setValueAndCursor(phoneField, finalValue, currentValue, cursorPos);
                                        lastFormattedValue = finalValue;
                                        isFormatting = false;
                                        return;
                                    }
                                    
                                    // Caso contrário, mantém o valor original (ainda digitando)
                                    lastFormattedValue = currentValue;
                                    isFormatting = false;
                                    return;
                                }
                            }
                        }
                        
                        // Se é um número internacional sem espaço (ainda digitando), preserva
                        if (currentValue.startsWith('+')) {
                            lastFormattedValue = currentValue;
                            isFormatting = false;
                            return;
                        }
                        
                        const cleanValue = currentValue.replace(/\D/g, '');
                        const countryData = iti.getSelectedCountryData();
                        
                        if (cleanValue.length > 0) {
                            try {
                                const formatted = intlTelInputUtils.formatNumber(
                                    cleanValue, 
                                    countryData.iso2, 
                                    intlTelInputUtils.numberFormat.NATIONAL
                                );

                                // VERIFICAÇÃO CRÍTICA: Impede formatação que remove dígitos
                                const inputDigits = cleanValue.replace(/\D/g, '');
                                const outputDigits = formatted.replace(/\D/g, '');

                                if (formatted && formatted !== 'Invalid number' && formatted !== currentValue) {
                                    // Se a formatação removeu dígitos, NÃO aplica e limpa caracteres especiais
                                    if (inputDigits.length > outputDigits.length) {
                                        const cleanedValue = currentValue.replace(/\D/g, '');
                                        const cursorPos = phoneField.selectionStart || 0;
                                        setValueAndCursor(phoneField, cleanedValue, currentValue, cursorPos);
                                        lastFormattedValue = cleanedValue;
                                        isFormatting = false;
                                        return;
                                    }
                                    
                                    const cursorPos = phoneField.selectionStart || 0;
                                    setValueAndCursor(phoneField, formatted, currentValue, cursorPos);
                                    lastFormattedValue = formatted;
                                    isFormatting = false;
                                    
                                    // Trigger jQuery change após 1s para salvar no shortcode
                                    setTimeout(() => {
                                        if (window.jQuery) {
                                            $(phoneField).trigger('change');
                                        }
                                    }, 1000);
                                    return;
                                }
                            } catch (formatError) {
                                // Se houve erro na formatação, mantém o valor atual
                                lastFormattedValue = currentValue;
                                isFormatting = false;
                                return;
                            }
                        }
                        
                        // Para qualquer outro caso, apenas atualiza o estado
                        lastFormattedValue = currentValue;
                        isFormatting = false;
                    } catch (error) {
                        isFormatting = false;
                    }
                }

                // Funções auxiliares para gerenciamento inteligente de cursor
                function calculateSmartCursorPosition(oldValue, newValue, oldCursorPos) {
                    // Remove caracteres especiais que serão filtrados
                    const cleanOld = oldValue.replace(/^[\s()\-]*$/, '');
                    const cleanNew = newValue.replace(/^[\s()\-]*$/, '');
                    
                    if (cleanOld === '' || cleanNew === '') {
                        return newValue.length;
                    }
                    
                    // Conta dígitos até a posição do cursor no valor antigo
                    let digitCount = 0;
                    for (let i = 0; i < Math.min(oldCursorPos, oldValue.length); i++) {
                        if (/\d/.test(oldValue[i])) {
                            digitCount++;
                        }
                    }
                    
                    // Encontra a posição equivalente no novo valor
                    let currentDigits = 0;
                    for (let i = 0; i < newValue.length; i++) {
                        if (/\d/.test(newValue[i])) {
                            currentDigits++;
                            if (currentDigits >= digitCount) {
                                return Math.min(i + 1, newValue.length);
                            }
                        }
                    }
                    
                    return newValue.length;
                }

                function setValueAndCursor(field, newValue, oldValue, cursorPos) {
                    try {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(field, newValue);
                        
                        // Calcula nova posição do cursor
                        const newCursorPos = calculateSmartCursorPosition(oldValue, newValue, cursorPos);
                        
                        // Define a posição do cursor com pequeno delay para garantir que o valor foi definido
                        setTimeout(() => {
                            if (field.setSelectionRange && typeof field.setSelectionRange === 'function') {
                                try {
                                    field.setSelectionRange(newCursorPos, newCursorPos);
                                } catch (e) {
                                    // Fallback silencioso se não conseguir definir a posição
                                }
                            }
                        }, 10);
                    } catch (error) {
                        // Fallback para método padrão se houver erro
                        field.value = newValue;
                    }
                }

                if (!phoneField.dataset.inputListenerAdded) {
                    phoneField.addEventListener('input', function(event) {
                        // Debounce para evitar múltiplas execuções
                        clearTimeout(phoneField.formatTimeout);
                        phoneField.formatTimeout = setTimeout(() => {
                            applyPhoneFormatting(event, 'Input');
                        }, 50);
                    }, { passive: true });
                    phoneField.dataset.inputListenerAdded = 'true';
                }

                if (!phoneField.dataset.countryChangeListenerAdded) {
                    phoneField.addEventListener('countrychange', function(event) {
                        countryChanged = true;
                        // Reset do estado ao mudar país
                        lastFormattedValue = '';
                        
                        // Atualiza o campo hidden correspondente com o código do país
                        const countryData = iti.getSelectedCountryData();
                        const dialCode = '+' + countryData.dialCode;
                        
                        // Identifica qual campo hidden atualizar baseado no ID do campo de telefone
                        let hiddenFieldId = '';
                        if (phoneField.id === 'billing_phone' || phoneField.id === 'billing-phone') {
                            hiddenFieldId = '#billing_phone_country';
                        } else if (phoneField.id === 'shipping_phone' || phoneField.id === 'shipping-phone') {
                            hiddenFieldId = '#shipping_phone_country';
                        }
                        
                        // Atualiza o campo hidden se encontrado
                        if (hiddenFieldId) {
                            const hiddenField = document.querySelector(hiddenFieldId);
                            if (hiddenField) {
                                hiddenField.value = dialCode;
                                // Dispara evento change no campo hidden
                                if (window.jQuery) {
                                    $(hiddenField).trigger('change');
                                }
                            } else {
                            }
                        }
                        
                        clearTimeout(phoneField.formatTimeout);
                        phoneField.formatTimeout = setTimeout(() => {
                            applyPhoneFormatting(event, 'Country Change');
                        }, 100);
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

    initPhoneInput();

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
                            setTimeout(initPhoneInput, 100);
                        }
                        
                        if (node.className && 
                            (node.className.includes('woocommerce-billing-fields') ||
                             node.className.includes('woocommerce-shipping-fields') ||
                             node.className.includes('woocommerce-checkout'))) {
                            setTimeout(initPhoneInput, 200);
                        }
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'id']
    });

});