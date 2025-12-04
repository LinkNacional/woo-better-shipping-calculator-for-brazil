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
                
                // Verifica se o número já tem código internacional e ajusta o país
                function checkAndSetInitialCountry() {
                    const currentValue = phoneField.value;
                    if (currentValue && currentValue.trim() !== '') {
                        // Verifica se começa com + e tem código de país
                        const internationalMatch = currentValue.match(/^\+(\d{1,4})/);
                        if (internationalMatch) {
                            const dialCode = internationalMatch[1];
                            const countryByDialCode = findCountryByDialCode(dialCode);
                            
                            if (countryByDialCode) {
                                // Define o país baseado no código encontrado
                                iti.setCountry(countryByDialCode);
                                
                                // Atualiza o campo hidden correspondente
                                const newDialCode = '+' + dialCode;
                                let hiddenFieldId = '';
                                if (phoneField.id === 'billing_phone' || phoneField.id === 'billing-phone') {
                                    hiddenFieldId = '#billing_phone_country';
                                } else if (phoneField.id === 'shipping_phone' || phoneField.id === 'shipping-phone') {
                                    hiddenFieldId = '#shipping_phone_country';
                                }
                                
                                if (hiddenFieldId) {
                                    const hiddenField = document.querySelector(hiddenFieldId);
                                    if (hiddenField) {
                                        hiddenField.value = newDialCode;
                                        // Dispara evento change no campo hidden
                                        if (window.jQuery) {
                                            $(hiddenField).trigger('change');
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Executa a verificação inicial após um pequeno delay
                setTimeout(checkAndSetInitialCountry, 100);
                
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
                            const dialCode = internationalWithSpace[1];
                            const localNumber = internationalWithSpace[2];
                            
                            // Tenta encontrar o país pelo código
                            const countryByDialCode = findCountryByDialCode(dialCode);
                            if (countryByDialCode) {
                                // Seleciona o país automaticamente
                                iti.setCountry(countryByDialCode);
                                
                                // Formata o número local e reconecta com código
                                const cleanLocalNumber = localNumber.replace(/\D/g, '');
                                if (cleanLocalNumber.length > 0) {
                                    try {
                                        const countryData = iti.getSelectedCountryData();
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
                        }
                        
                        // Detecta código internacional sem espaço mas com números após (ex: "+5511987654321")
                        const internationalWithoutSpace = currentValue.match(/^\+(\d{1,4})(.+)$/);
                        if (internationalWithoutSpace) {
                            const dialCode = internationalWithoutSpace[1];
                            const restOfNumber = internationalWithoutSpace[2];
                            
                            // Se tem números após o código, tenta encontrar o país
                            if (restOfNumber.length > 0 && /\d/.test(restOfNumber)) {
                                const countryByDialCode = findCountryByDialCode(dialCode);
                                if (countryByDialCode) {
                                    // Seleciona o país automaticamente
                                    iti.setCountry(countryByDialCode);
                                    
                                    // Separa em: código internacional + número local formatado
                                    const cleanLocalNumber = restOfNumber.replace(/\D/g, '');
                                    if (cleanLocalNumber.length > 0) {
                                        try {
                                            const countryData = iti.getSelectedCountryData();
                                            const formatted = intlTelInputUtils.formatNumber(
                                                cleanLocalNumber, 
                                                countryData.iso2, 
                                                intlTelInputUtils.numberFormat.NATIONAL
                                            );

                                            if (formatted && formatted !== 'Invalid number') {
                                                // Reconecta: código + espaço + número formatado
                                                const finalValue = `+${dialCode} ${formatted}`;
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