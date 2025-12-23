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
                        const internationalWithoutSpace = currentValue.match(/^\+(\d{1,4})(.+)$/);
                        
                        if (internationalWithoutSpace) {
                            const restOfNumber = internationalWithoutSpace[2];
                            
                            // Se tem números após o código, deixa a biblioteca detectar automaticamente
                            if (restOfNumber.length > 0 && /\d/.test(restOfNumber)) {
                                setTimeout(() => {
                                    const countryData = iti.getSelectedCountryData();
                                    
                                    if (countryData && countryData.dialCode) {
                                        const dialCode = countryData.dialCode;
                                        
                                        // Separa em: código internacional + número local formatado
                                        const cleanLocalNumber = restOfNumber.replace(/\D/g, '');
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
                                }, 50); // Pequeno delay para garantir processamento da biblioteca
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