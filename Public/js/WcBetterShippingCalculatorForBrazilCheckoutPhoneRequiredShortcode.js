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
                                                        
                                                        phoneField.value = finalValue;
                                                        
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
                                            
                                            phoneField.value = finalValue;
                                            
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
                                                    hiddenField.value = dialCode;
                                                    if (window.jQuery) {
                                                        $(hiddenField).trigger('change');
                                                    }
                                                }
                                            }
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
                            lastFormattedValue = currentValue;
                            isFormatting = false;
                            return;
                        }
                        
                        // Detecta código internacional seguido de espaço (ex: "+55 11987654321")
                        const internationalWithSpace = currentValue.match(/^\+(\d{1,4})\s+(.*)$/);
                        
                        if (internationalWithSpace) {
                            // Deixa a biblioteca detectar automaticamente e usa getSelectedCountryData
                            setTimeout(() => {
                                const countryData = iti.getSelectedCountryData();
                                
                                if (countryData && countryData.dialCode) {
                                    const dialCode = countryData.dialCode;
                                    const localNumber = internationalWithSpace[2];
                                    
                                    // Formata o número local e reconecta com código
                                    const cleanLocalNumber = localNumber.replace(/\D/g, '');
                                    if (cleanLocalNumber.length > 0) {
                                        try {
                                            const formatted = intlTelInputUtils.formatNumber(
                                                cleanLocalNumber, 
                                                countryData.iso2, 
                                                intlTelInputUtils.numberFormat.NATIONAL
                                            );

                                            if (formatted && formatted !== 'Invalid number') {
                                                // Reconecta: código + espaço + número formatado
                                                const finalValue = `+${dialCode} ${formatted}`;
                                                setTimeout(() => {
                                                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                                    nativeSetter.call(phoneField, finalValue);
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
                        
                        // Detecta código internacional sem espaço mas com números após (ex: "+5511987654321")
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

                                                            if (formatted && formatted !== 'Invalid number') {
                                                                // Reconecta: código + espaço + número formatado
                                                                const finalValue = `+${testCode} ${formatted}`;
                                                                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                                                nativeSetter.call(phoneField, finalValue);
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
                                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                        nativeSetter.call(phoneField, finalValue);
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

                                if (formatted && formatted !== 'Invalid number' && formatted !== currentValue) {
                                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                    nativeSetter.call(phoneField, formatted);
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
                        console.warn('Erro na aplicação da máscara:', error);
                        isFormatting = false;
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