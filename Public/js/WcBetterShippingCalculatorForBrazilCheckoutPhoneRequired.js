import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import intlTelInputUtils from 'intl-tel-input/build/js/utils.js';
import { pt } from 'intl-tel-input/i18n';

document.addEventListener('DOMContentLoaded', function() {
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
                    autoPlaceholder: "aggressive",
                    strictMode: false,
                    i18n: pt,
                    utilsScript: intlTelInputUtils
                });

                phoneField.dataset.intlTelInputInitialized = 'true';
                adjustPhoneLabel(phoneField);
                
                function applyPhoneFormatting(event, context = 'input') {
                    try {
                        const currentValue = phoneField.value;
                        
                        if (currentValue && currentValue.trim() !== '') {
                            const cleanValue = currentValue.replace(/\D/g, '');
                            const countryData = iti.getSelectedCountryData();
                            
                            if (cleanValue.length > 0) {
                                try {
                                    const formatted = intlTelInputUtils.formatNumber(
                                        cleanValue, 
                                        countryData.iso2, 
                                        intlTelInputUtils.numberFormat.NATIONAL
                                    );

                                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                    if (formatted !== currentValue) {
                                        nativeSetter.call(phoneField, formatted);
                                        triggerReactChange(phoneField, formatted);
                                        
                                        return
                                    }
                                } catch (formatError) {
                                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                    if (cleanValue !== currentValue) {
                                        nativeSetter.call(phoneField, cleanValue);
                                        triggerReactChange(phoneField, cleanValue);
                                        return
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.warn('Erro na aplicação da máscara:', error);
                    }
                }

                function triggerReactChange(input, newValue) {
                    const reactKey = Object.keys(input).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('__reactFiber'));
                    
                    if (reactKey) {
                        const reactInstance = input[reactKey];
                        if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.onChange) {
                            const fakeEvent = {
                                target: input,
                                currentTarget: input,
                                preventDefault: () => {},
                                stopPropagation: () => {}
                            };
                            
                            reactInstance.memoizedProps.onChange(fakeEvent);
                            return;
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
                        Object.defineProperty(event, 'target', {
                            writable: false,
                            value: input
                        });
                        
                        Object.defineProperty(event, 'currentTarget', {
                            writable: false,
                            value: input
                        });
                    });

                    setTimeout(() => {
                        events.forEach((event, index) => {
                            setTimeout(() => {
                                input.dispatchEvent(event);
                            }, index * 5);
                        });
                    }, 0);
                }
                
                if (!phoneField.dataset.inputListenerAdded) {
                    phoneField.addEventListener('input', function(event) {
                        Promise.resolve().then(() => {
                            applyPhoneFormatting(event, 'Input');
                        });
                    }, { passive: true });
                    phoneField.dataset.inputListenerAdded = 'true';
                }

                if (!phoneField.dataset.countryChangeListenerAdded) {
                    phoneField.addEventListener('countrychange', function(event) {
                        countryChanged = true;
                        Promise.resolve().then(() => {
                            applyPhoneFormatting(event, 'Country Change');
                        });
                    }, { passive: true });
                    phoneField.dataset.countryChangeListenerAdded = 'true';
                }
            }
        });
    }

    function adjustPhoneLabel(phoneField) {
        const label = phoneField.closest('.form-row, .wc-block-components-text-input')?.querySelector('label');
        if (label) {
            label.style.paddingLeft = '52px';
            label.style.transition = 'all 0.3s ease';
            
            if (label.classList.contains('screen-reader-text') || 
                getComputedStyle(label).position === 'absolute') {
                label.style.left = '52px';
                label.style.paddingLeft = '0px';
            }
        }
        
        const blockLabel = phoneField.closest('.wc-block-components-text-input')?.querySelector('.wc-block-components-text-input__label');
        if (blockLabel) {
            blockLabel.style.paddingLeft = '52px';
            blockLabel.style.transition = 'all 0.3s ease';
        }
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
                            (node.className.includes('wc-block-components-address-form') ||
                             node.className.includes('wc-block-checkout'))) {
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