document.addEventListener('DOMContentLoaded', function () {
    let observer;
    let previousClickHandler = null;
    let inputCountry = '';
    let confirmButton = false;
    let previousCep = ''
    let clearCepInterval = false
    let continueButton = ''

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

        if (country) {
            inputCountry = country.querySelector('select');
            country.remove();
        }
        if (city) {
            const cityInput = city.querySelector('input');
            const postcodeDiv = document.querySelector('.wc-block-components-address-form__postcode');
            const postcodeInput = postcodeDiv.querySelector('input');

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
                    previousCep = postcodeInput.value;
                    cityInput.remove();
                }
            } else {
                if (cityInput) {
                    previousCep = postcodeInput.value;
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

    function handleSubmitClick(inputPostcode, inputCountry) {
        const shippingAddressComponent = document.querySelector('.wc-block-components-shipping-address');
        const newPostcode = shippingAddressComponent.querySelector('.wc-block-components-address-form__postcode');
        const newInputPostcode = newPostcode ? newPostcode.querySelector('input') : null;
        if (newInputPostcode) {
            if (newInputPostcode.value === previousCep) {
                clearCepInterval = true
            }
        };
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

        fetch(url)
            .then(response => response.json())
            .then(data => {
                if (data.status === true) {
                    const updateUrl = '/wp-json/wc/store/v1/cart/update-customer';
                    const nonce = wcBlocksMiddlewareConfig.storeApiNonce;

                    const bodyData = {
                        shipping_address: {
                            address_1: data.address,
                            address_2: '',
                            country: 'BR',
                            state: data.state_sigla,
                            city: data.city,
                            postcode: inputPostcode.value
                        }
                    };

                    // Função para realizar a requisição de atualização do carrinho
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
                            .then(responseObject => {
                                const strongElement = addressSummary.querySelector('strong');
                                if (previousText && strongElement) {
                                    const checkTextChange = setInterval(() => {
                                        if (strongElement.textContent !== previousText || clearCepInterval) {
                                            clearCepInterval = false;
                                            strongElement.textContent = `${inputPostcode.value}, ${data.city}, ${data.state}, Brasil`;
                                            removeLoading(addressSummary);
                                            previousText = strongElement.textContent;
                                            enableButton(continueButton);
                                            clearInterval(checkTextChange); // Para após a mudança
                                        }
                                    }, 500);
                                } else {
                                    removeLoading(addressSummary);
                                }
                            })
                            .catch(error => {
                                console.error('Erro na atualização do carrinho:', error);
                                removeLoading(addressSummary);
                            });
                    };

                    // Função para interceptar a requisição original
                    const interceptBatchRequest = () => {
                        const originalFetch = window.fetch;

                        // Substitui o fetch para monitorar a requisição
                        window.fetch = function (url, options) {
                            // Verifica se a URL é a que queremos interceptar
                            if (url.includes('/wp-json/wc/store/v1/batch?_locale=site')) {
                                return originalFetch(url, options)
                                    .then(response => {
                                        // Após a requisição ser completada, chama a sua requisição
                                        response.clone().json().then(() => {
                                            updateCart();
                                        });
                                        return response;
                                    })
                                    .catch(error => {
                                        console.error('Erro na requisição original:', error);
                                        return Promise.reject(error);
                                    });
                            }

                            // Caso não seja a URL desejada, apenas realiza o fetch normalmente
                            return originalFetch(url, options);
                        };
                    };

                    // Inicialize o interceptador
                    interceptBatchRequest();
                } else {
                    alert('Erro: ' + data.message);
                    removeLoading(addressSummary);
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                removeLoading(addressSummary);
            });
    }

    function initObserver() {
        observer = new MutationObserver(function (mutationsList) {
            const shippingAddressComponent = document.querySelector('.wc-block-components-shipping-address');

            if (shippingAddressComponent) {
                continueButton = document.querySelector('.wc-block-components-button.wp-element-button.wc-block-cart__submit-button.contained');

                if (continueButton && !confirmButton) {
                    confirmButton = true;
                    continueButton.addEventListener('click', handleClick);
                    disableButton(continueButton)
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

                                previousClickHandler = () => handleSubmitClick(inputPostcode, inputCountry);
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

                            previousClickHandler = () => handleSubmitClick(inputPostcode, inputCountry);
                            submitButton.addEventListener('click', previousClickHandler);
                        }
                    }
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

    initObserver();
});
