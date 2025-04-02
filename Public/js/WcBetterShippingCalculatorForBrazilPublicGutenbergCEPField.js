document.addEventListener('DOMContentLoaded', function () {
    let observer;
    let previousClickHandler = null;
    let inputCountry = '';
    let confirmButton = false;
    let previousCep = ''
    let clearCepInterval = true
    let continueButton = ''
    let secondsElapsed = 0;
    let clearCheckInterval = false
    const maxTime = 10;
    let errorRequest = true


    const handleClick = (event) => {
        event.preventDefault();  // Evita a ação do botão enquanto ele estiver desabilitado
        alert('Verifique as opções de entrega');

        const continueButtonClick = document.querySelector('.wc-block-components-button.wp-element-button.wc-block-cart__submit-button.contained');

        const continueSpinner = continueButtonClick.querySelector('.wc-block-components-spinner');
        const continueText = continueButtonClick.querySelector('.wc-block-components-button__text');

        if (continueSpinner) {
            continueSpinner.style.visibility = 'visible';
        }
        if (continueText) {
            continueText.style.visibility = 'hidden';
        }

        setTimeout(() => {
            const continueSpinner = continueButtonClick.querySelector('.wc-block-components-spinner');
            const continueText = continueButtonClick.querySelector('.wc-block-components-button__text');

            if (continueText) {
                continueText.style.visibility = 'visible';
            }
            if (continueSpinner) {
                continueSpinner.style.visibility = 'hidden';
            }
        }, 1000);
    };

    async function removeUnnecessaryFields(shippingAddressComponent) {
        const country = shippingAddressComponent.querySelector('.wc-block-components-address-form__country');
        const city = shippingAddressComponent.querySelector('.wc-block-components-address-form__city');
        const state = shippingAddressComponent.querySelector('.wc-block-components-address-form__state');
        const iconSVG = shippingAddressComponent.querySelector('svg');
        const postcodeDiv = document.querySelector('.wc-block-components-address-form__postcode');
        let postcodeInput = ''

        if (postcodeDiv) {
            postcodeInput = postcodeDiv.querySelector('input');
        }



        if (country) {
            inputCountry = country.querySelector('select');
            country.remove();
        }
        if (city) {
            const cityInput = city.querySelector('input');

            if (cityInput && cityInput.getAttribute('value') === '') {
                cityInput.focus();

                await simulateTyping(cityInput, 'SP').then(() => {
                    cityInput.blur();
                    if (postcodeDiv) {
                        if (postcodeInput) {
                            postcodeInput.focus();
                        }
                    }
                });

                if (cityInput) {
                    if (postcodeInput) {
                        previousCep = postcodeInput.value;
                    }
                    cityInput.remove();
                }
            } else {
                if (cityInput) {
                    if (postcodeInput) {
                        previousCep = postcodeInput.value;
                    }
                    cityInput.remove();
                }
            }
        }
        if (state) {
            state.remove();
        }
        if (iconSVG) iconSVG.remove();
    }

    function simulateTyping(input, text) {
        return new Promise((resolve) => {
            let index = 0;
            const interval = setInterval(() => {
                input.value += text[index];
                index++;

                // Dispara o evento de input para que o valor seja reconhecido
                const event = new Event('input', { bubbles: true });
                input.dispatchEvent(event);

                if (index === text.length) {
                    clearInterval(interval);
                    resolve();
                }
            }, 1);
        });
    }

    function handleSubmitClick(inputPostcode, inputCountry, continueButton) {
        if (continueButton) {
            disableButton(continueButton)
            continueButton.removeEventListener('click', handleClick);
            continueButton.addEventListener('click', handleClick);
        }
        if (isValidCEP(inputPostcode.value)) {
            if (inputPostcode.value !== previousCep || errorRequest) {
                errorRequest = false
                const url = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${inputPostcode.value}&country=${inputCountry.value}`;
                const addressSummary = document.querySelector('.wc-block-components-totals-shipping-address-summary');
                let previousText = ''

                if (addressSummary) {
                    addressSummary.classList.add('lkn-wc-shipping-address-summary');
                    addressSummary.style.position = 'relative';
                    addressSummary.classList.add('loading');
                    const spinner = addressSummary.querySelector('.spinner');
                    if (!spinner) {
                        addressSummary.insertAdjacentHTML('beforeend', '<span class="spinner is-active"></span>');
                    }
                    const strongElement = addressSummary.querySelector('strong');

                    previousText = strongElement.textContent;
                }

                // Armazena o fetch original apenas uma vez
                if (!window.originalFetch) {
                    window.originalFetch = window.fetch;
                }

                fetch(url)
                    .then(response => response.json())
                    .then(data => {
                        if (data.status === true) {
                            const updateUrl = '/wp-json/wc/store/v1/cart/update-customer';
                            const nonce = wcBlocksMiddlewareConfig.storeApiNonce;

                            let bodyData = {
                                shipping_address: {
                                    address_1: data.address ? data.address : ' ',
                                    address_2: ' ',
                                    country: 'BR',
                                    state: data.state_sigla ? data.state_sigla : ' ',
                                    city: data.city ? data.city : ' ',
                                    postcode: inputPostcode.value
                                }
                            };

                            // Função para restaurar o fetch original
                            const restoreFetch = () => {
                                if (window.fetch !== window.originalFetch) {
                                    window.fetch = window.originalFetch;
                                }
                            };

                            // Função para atualizar o carrinho
                            const updateCart = () => {
                                fetch(updateUrl, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Nonce': nonce
                                    },
                                    body: JSON.stringify(bodyData)
                                })
                                    .then(response => response.json())
                                    .then(() => {
                                        const strongElement = addressSummary.querySelector('strong');
                                        if (previousText && strongElement) {
                                            const checkTextChange = setInterval(() => {
                                                if (strongElement.textContent !== previousText || clearCepInterval) {
                                                    clearCepInterval = false;
                                                    strongElement.textContent = `${inputPostcode.value}, ${data.city}, ${data.state}, Brasil`;
                                                    removeLoading(addressSummary);
                                                    previousText = strongElement.textContent;
                                                    enableButton(continueButton);
                                                    clearInterval(checkTextChange);
                                                }
                                            }, 500);
                                        } else {
                                            removeLoading(addressSummary)
                                        }

                                        restoreFetch(); // Remove o interceptador após a requisição
                                    })
                                    .catch(error => {
                                        removeLoading(addressSummary);
                                        restoreFetch(); // Remove o interceptador se houver erro
                                    });
                            };

                            // Interceptador de requisição
                            const interceptBatchRequest = () => {
                                restoreFetch(); // Garante que não há interceptador antigo

                                // Timer para forçar atualização após 6s caso a requisição não ocorra
                                const limitTime = setTimeout(() => {
                                    updateCart();
                                }, 6000);

                                window.fetch = function (url, options) {
                                    if (url.includes('/wp-json/wc/store/v1/batch?_locale=site')) {
                                        clearTimeout(limitTime);

                                        return window.originalFetch(url, options)
                                            .then(response => {
                                                response.clone().json().then(() => {
                                                    updateCart();
                                                });
                                                return response;
                                            })
                                            .catch(error => {
                                                restoreFetch();
                                                return Promise.reject(error);
                                            });
                                    }

                                    return window.originalFetch(url, options);
                                };
                            };

                            interceptBatchRequest();
                        } else {
                            alert('Erro: ' + data.message);
                            removeLoading(addressSummary);
                            errorRequest = true
                        }
                    })
                    .catch(error => {
                        removeLoading(addressSummary);
                    });

            } else {
                clearCepInterval = true
                if (isValidCEP(inputPostcode.value) && errorRequest === false) {
                    enableButton(continueButton)
                }
            }
        } else {
            alert('CEP inválido.');
        }

    }

    function initObserver() {
        observer = new MutationObserver(function (mutationsList) {
            if (!clearCheckInterval) {
                const checkElement = setInterval(() => {
                    const shippingBlock = document.querySelector('.wp-block-woocommerce-cart-order-summary-totals-block')
                    if (!shippingBlock && secondsElapsed === maxTime) {
                        clearInterval(checkElement);
                        secondsElapsed = 0;
                        observer.disconnect();
                        return
                    } else if (shippingBlock) {
                        clearInterval(checkElement);
                        secondsElapsed = 0;
                    }
                    secondsElapsed++;
                }, 1000)
                clearCheckInterval = true
            }

            const shippingAddressComponent = document.querySelector('.wc-block-components-shipping-address');

            if (shippingAddressComponent) {
                continueButton = document.querySelector('.wc-block-components-button.wp-element-button.wc-block-cart__submit-button.contained');

                if (continueButton && !confirmButton) {
                    confirmButton = true;
                    disableButton(continueButton)
                    continueButton.addEventListener('click', handleClick);
                }
                const button = shippingAddressComponent.querySelector('.wc-block-components-panel__button');
                if (button) {
                    const buttonObserver = new MutationObserver(() => {
                        if (button.getAttribute('aria-expanded') === 'false') {
                            button.click();
                            button.style.pointerEvents = 'none';

                            removeUnnecessaryFields(shippingAddressComponent);

                            const postcode = shippingAddressComponent.querySelector('.wc-block-components-address-form__postcode');
                            const inputPostcode = postcode ? postcode.querySelector('input') : null;
                            const submitButton = document.querySelector('.wc-block-components-button.wp-element-button.wc-block-components-shipping-calculator-address__button.outlined');

                            if (inputPostcode && inputCountry && submitButton) {

                                if (previousClickHandler) {
                                    submitButton.removeEventListener('click', previousClickHandler);
                                }

                                previousClickHandler = () => handleSubmitClick(inputPostcode, inputCountry, continueButton);
                                submitButton.addEventListener('click', previousClickHandler);
                            }
                        }
                    });

                    // Configura o observer para monitorar o atributo 'aria-expanded' do botão
                    buttonObserver.observe(button, { attributes: true, attributeFilter: ['aria-expanded'], subtree: true });

                    if (button.getAttribute('aria-expanded') === 'false') {
                        button.click();
                        button.style.pointerEvents = 'none';

                        removeUnnecessaryFields(shippingAddressComponent);

                        const postcode = shippingAddressComponent.querySelector('.wc-block-components-address-form__postcode');
                        const inputPostcode = postcode ? postcode.querySelector('input') : null;
                        const submitButton = document.querySelector('.wc-block-components-button.wp-element-button.wc-block-components-shipping-calculator-address__button.outlined');

                        if (inputPostcode && inputCountry && submitButton) {
                            if (previousClickHandler) {
                                submitButton.removeEventListener('click', previousClickHandler);
                            }

                            previousClickHandler = () => handleSubmitClick(inputPostcode, inputCountry, continueButton);
                            submitButton.addEventListener('click', previousClickHandler);
                        }
                    }
                    observer.disconnect();
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    function removeLoading(addressSummary) {
        if (addressSummary) {
            addressSummary.classList.remove('lkn-wc-shipping-address-summary');
            addressSummary.classList.remove('loading');
            const spinner = addressSummary.querySelector('.spinner');
            if (spinner) spinner.remove();
        }
    }

    function disableButton(button) {
        button.setAttribute('disabled', 'true');  // Desabilita o botão
        button.style.opacity = '0.5';            // Pode adicionar uma opacidade para indicar que o botão está desabilitado
    }

    // Função para habilitar o botão
    function enableButton(button) {
        button.removeAttribute('disabled');
        button.removeEventListener('click', handleClick);    // Habilita o botão
        button.style.opacity = '1';             // Restaura a opacidade
    }

    function isValidCEP(cep) {
        const cepPattern = /^[0-9]{5}-?[0-9]{3}$/;
        return cepPattern.test(cep);
    }

    initObserver();
});
