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
        return new Promise((resolve) => {
            const observer = new MutationObserver(async () => {
                const country = shippingAddressComponent.querySelector('.wc-block-components-address-form__country');

                if (country) {
                    observer.disconnect(); // Parar de observar

                    const city = shippingAddressComponent.querySelector('.wc-block-components-address-form__city');
                    const state = shippingAddressComponent.querySelector('.wc-block-components-address-form__state');
                    const iconSVG = shippingAddressComponent.querySelector('svg');
                    const postcodeDiv = document.querySelector('.wc-block-components-address-form__postcode');
                    let postcodeInput = '';

                    console.log(postcodeInput)

                    if (postcodeDiv) {
                        console.log('entrei no if')
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
                                if (postcodeInput) {
                                    postcodeInput.focus();
                                }
                            });

                            if (postcodeInput) {
                                console.log('entrei no op 1')
                                console.log(postcodeInput)
                                console.log(postcodeInput.value)
                                previousCep = postcodeInput.value;
                            }

                            cityInput.remove();

                            const errorCity = shippingAddressComponent.querySelector('.wc-block-components-text-input.wc-block-components-address-form__city.has-error')
                            if (errorCity) {
                                errorCity.remove()
                            }
                        } else {
                            if (postcodeInput) {
                                console.log('entrei no op 2')
                                previousCep = postcodeInput.value;
                            }
                            city.remove();
                        }
                    }

                    if (state) state.remove();
                    if (iconSVG) iconSVG.remove();

                    // ⬇️ Agora sim, só resolve a promise depois de tudo
                    resolve();
                }
            });

            observer.observe(shippingAddressComponent, {
                childList: true,
                subtree: true
            });
        });
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
        if (continueButton && wcBetterShippingCalculatorParams.cep_required === 'yes') {
            disableButton(continueButton)
            continueButton.removeEventListener('click', handleClick);
            continueButton.addEventListener('click', handleClick);
        }

        if (isValidCEP(inputPostcode.value)) {
            console.log(inputPostcode.value)
            console.log(previousCep)
            if (inputPostcode.value !== previousCep || errorRequest) {
                errorRequest = false
                const url = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${inputPostcode.value}&country=${inputCountry.value}`;
                const addressSummary = document.querySelector('.wc-block-components-totals-shipping-address-summary');
                console.log('addressSummary', addressSummary)
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

                    if (strongElement) {
                        previousText = strongElement.textContent;
                    } else {
                        previousText = 'old'
                    }
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
                                        const previousPostcode = document.querySelector('.wc-block-components-address-form__postcode');
                                        const inputPreviousPostcode = previousPostcode ? previousPostcode.querySelector('input') : null;
                                        console.log(inputPreviousPostcode)
                                        let strongElement = addressSummary.querySelector('strong');
                                        if (!strongElement) {
                                            const newStrong = document.createElement('strong');
                                            newStrong.textContent = addressSummary.textContent;

                                            // Limpa o conteúdo atual e insere o novo <strong>
                                            addressSummary.textContent = '';
                                            addressSummary.appendChild(newStrong);

                                            strongElement = addressSummary.querySelector('strong');
                                        }
                                        if (previousText && strongElement) {
                                            const checkTextChange = setInterval(() => {
                                                const responseText = `${inputPostcode.value}, ${data.city}, ${data.state}, Brasil`
                                                if (responseText !== previousText || clearCepInterval) {
                                                    clearCepInterval = false;
                                                    strongElement.textContent = responseText;
                                                    removeLoading(addressSummary);
                                                    previousText = strongElement.textContent;
                                                    if (wcBetterShippingCalculatorParams.cep_required === 'yes') {
                                                        enableButton(continueButton);
                                                    }
                                                    if (inputPreviousPostcode) {
                                                        previousCep = inputPreviousPostcode.value;
                                                    }
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
                if (isValidCEP(inputPostcode.value) && errorRequest === false && wcBetterShippingCalculatorParams.cep_required === 'yes') {
                    enableButton(continueButton)
                }
            }
        } else {
            alert('CEP inválido.');
        }

    }

    function initObserver() {
        observer = new MutationObserver(async function (mutationsList) {
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

                if (continueButton && !confirmButton && wcBetterShippingCalculatorParams.cep_required === 'yes') {
                    confirmButton = true;
                    disableButton(continueButton)
                    continueButton.addEventListener('click', handleClick);
                }
                const button = shippingAddressComponent.querySelector('.wc-block-components-panel__button');
                if (button) {
                    const buttonObserver = new MutationObserver(async () => {
                        if (button.getAttribute('aria-expanded') == 'false') {
                            button.click();
                            button.style.pointerEvents = 'none';

                            await removeUnnecessaryFields(shippingAddressComponent);

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

                        await removeUnnecessaryFields(shippingAddressComponent);

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
