document.addEventListener('DOMContentLoaded', function () {
    let observer;
    let previousClickHandler = null;
    let cepFound = false
    let previousCep = ''
    let continueButtonFound = false
    let iconSummary = null
    let addressSummary = null
    let postcodeError = false
    let postcodeValue = ''
    let continueButton = null
    let requestRepeated = false
    let countRequest = 1
    let countRequestTimeOut = null

    let addressData = ''
    let stateData = ''
    let cityData = ''

    let blockObserver = null
    let enableRequest = null

    let shippingBlockIntervalCount = 0

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

    async function handleSubmitClick(continueButton) {
        const postcodeField = document.querySelector('.wc-block-components-text-input.wc-block-components-address-form__postcode');
        const inputPostcode = postcodeField ? postcodeField.querySelector('input') : null;

        if (typeof WooBetterData !== 'undefined' && WooBetterData.wooHiddenAddress === 'no') {
            const cityBlock = document.querySelector('.wc-block-components-text-input.wc-block-components-address-form__city');
            if (cityBlock) {
                const inputCity = cityBlock.querySelector('input');
                if (inputCity && inputCity.value === '') {
                    alert('Campo cidade vazio');
                    inputCity.focus();
                    return;
                }
            }
        }

        if (blockObserver instanceof MutationObserver) {
            blockObserver.disconnect();
        }
        blockObserver = null
        enableRequest = null

        if (continueButton && inputPostcode) {
            disableButton(continueButton)
            continueButton.removeEventListener('click', handleClick);
            continueButton.addEventListener('click', handleClick);
        }

        // Woo versions
        if (typeof WooBetterData !== 'undefined' && WooBetterData.wooVersion === 'woo-block') {
            addressSummary = document.querySelector('.wc-block-components-totals-shipping-address-summary');
        } else if (typeof WooBetterData !== 'undefined' && WooBetterData.wooVersion === 'woo-class') {
            await waitForShippingBlock()
        }

        if (addressSummary) {
            const summaryBlock = document.querySelector('.wc-block-components-totals-shipping-panel');
            if (summaryBlock) {
                iconSummary = summaryBlock.querySelector('.wc-block-components-panel__button-icon');
                if (iconSummary) {
                    iconSummary.addEventListener('click', blockInteraction, true);
                }
            }
            if (isValidCEP(inputPostcode.value)) {
                postcodeValue = inputPostcode.value
                if (inputPostcode.value !== previousCep) {
                    requestRepeated = false

                    addressSummary.addEventListener('click', blockInteraction, true);
                    addressSummary.classList.add('lkn-wc-shipping-address-summary');
                    addressSummary.style.position = 'relative';
                    addressSummary.classList.add('loading');
                    const spinner = addressSummary.querySelector('.spinner');
                    if (!spinner) {
                        addressSummary.insertAdjacentHTML('beforeend', '<span class="spinner is-active"></span>');
                    }

                    enableRequest = setInterval(() => {
                        batchRequest()
                    }, 5000);

                } else {
                    batchRequest()
                }
            } else {
                alert('CEP inválido.');
                addressSummary.removeEventListener('click', blockInteraction, true);
                if (iconSummary) {
                    iconSummary.removeEventListener('click', blockInteraction, true);
                }
            }
        }
    }

    function initObserver() {
        observer = new MutationObserver(async function () {
            let shippingAddressBlock = document.querySelector('.wc-block-components-shipping-address');
            if (!shippingAddressBlock) {
                shippingAddressBlock = document.querySelector('.wc-block-components-totals-shipping__change-address__link');
            }
            const postcodeField = document.querySelector('.wc-block-components-text-input.wc-block-components-address-form__postcode');
            continueButton = document.querySelector('.wc-block-components-button.wp-element-button.wc-block-cart__submit-button.contained');

            if (!continueButton) {
                continueButtonFound = false
            }
            if (continueButton && !continueButtonFound && shippingAddressBlock) {
                continueButtonFound = true
                continueButton.removeEventListener('click', handleClick);
                continueButton.addEventListener('click', handleClick);

                disableButton(continueButton)
            }

            if (!shippingAddressBlock && continueButton) {
                enableButton(continueButton)
            }

            if (!postcodeField) {
                cepFound = false
            }
            if (postcodeField && !cepFound) {
                cepFound = true
                const submitButton = document.querySelector('.wc-block-components-shipping-calculator-address__button');

                const inputPostcode = postcodeField ? postcodeField.querySelector('input') : null;

                if (submitButton && continueButton && inputPostcode) {
                    previousCep = inputPostcode.value
                    if (previousClickHandler) {
                        submitButton.removeEventListener('click', previousClickHandler);
                    }

                    previousClickHandler = () => handleSubmitClick(continueButton);
                    submitButton.addEventListener('click', previousClickHandler);
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

    function blockInteraction(e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }

    async function interceptSubmit() {

        // Guarda o fetch original uma única vez
        const originalFetch = window.fetch;
        // Sobrescreve o fetch
        window.fetch = async function (url, options) {

            if (url.includes('/wp-json/wc/store/v1/batch')) {
                if (!postcodeValue) {
                    const postcodeField = document.querySelector('.wc-block-components-text-input.wc-block-components-address-form__postcode');
                    if (postcodeField) {
                        const inputPostcode = postcodeField ? postcodeField.querySelector('input') : null;
                        if (inputPostcode) {
                            postcodeValue = inputPostcode.value
                        }
                    }
                }

                if (isValidCEP(postcodeValue)) {

                    if (enableRequest) {
                        clearInterval(enableRequest);
                        enableRequest = null
                    }

                    const summaryBlock = document.querySelector('.wc-block-components-totals-shipping-panel');
                    if (summaryBlock) {
                        iconSummary = summaryBlock.querySelector('.wc-block-components-panel__button-icon');
                        if (iconSummary) {
                            iconSummary.addEventListener('click', blockInteraction, true);
                        }
                    }

                    if (!requestRepeated) {
                        requestRepeated = true
                        let apiUrl = ''
                        if (typeof wpApiSettings !== 'undefined' && wpApiSettings.root) {
                            apiUrl = wpApiSettings.root + `lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;
                        } else {
                            if (typeof WooBetterData !== 'undefined' && WooBetterData.wooUrl !== '') {
                                apiUrl = WooBetterData.wooUrl + `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;
                            } else {
                                apiUrl = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;
                            }
                        }

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

                        await fetch(apiUrl, {
                            method: 'GET',
                            signal: controller.signal,
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        })
                            .then(response => response.json())
                            .then(data => {
                                clearTimeout(timeoutId); // Se deu certo, limpa o timeout

                                if (data.status === true) {
                                    if (options && options.body) {
                                        if (!data.address || !data.state_sigla || !data.city) {
                                            postcodeError = true
                                            if (addressSummary) {
                                                removeLoading(addressSummary);
                                                addressSummary.removeEventListener('click', blockInteraction, true);
                                            }
                                            if (iconSummary) {
                                                iconSummary.removeEventListener('click', blockInteraction, true);
                                            }

                                            if (!data.address) {
                                                return alert('Erro: Endereço inválido.');
                                            }

                                            if (!data.state_sigla) {
                                                return alert('Erro: Estado inválido.');
                                            }

                                            if (!data.city) {
                                                return alert('Erro: Cidade inválida.');
                                            }
                                        } else {
                                            postcodeError = false
                                        }

                                        addressData = data.address;
                                        stateData = data.state_sigla;
                                        cityData = data.city;
                                    }
                                } else {
                                    alert('Erro: ' + data.message);
                                    postcodeError = true;
                                    removeLoading(addressSummary);
                                    addressSummary.removeEventListener('click', blockInteraction, true);
                                    if (iconSummary) {
                                        iconSummary.removeEventListener('click', blockInteraction, true);
                                    }
                                }
                            })
                            .catch(error => {
                                clearTimeout(timeoutId); // Também limpa o timeout no erro
                                if (error.name === 'AbortError') {
                                    alert('Erro: Tempo limite de resposta excedido.');
                                } else {
                                    console.error(error);
                                }
                                removeLoading(addressSummary);
                                addressSummary.removeEventListener('click', blockInteraction, true);
                                if (iconSummary) {
                                    iconSummary.removeEventListener('click', blockInteraction, true);
                                }
                            });
                    }

                }

                try {
                    let requestData = JSON.parse(options.body);

                    const updateCustomerRequest = requestData.requests.find(
                        (request) => request.path === '/wc/store/v1/cart/update-customer'
                    );

                    if (updateCustomerRequest) {

                        if (addressData !== '' && WooBetterData.wooHiddenAddress === 'yes' && !postcodeError) {
                            updateCustomerRequest.data.shipping_address.address_1 = addressData
                            updateCustomerRequest.body.shipping_address.address_1 = addressData
                            if (!updateCustomerRequest.data.billing_address) {
                                updateCustomerRequest.data.billing_address = {};
                                updateCustomerRequest.body.billing_address = {};
                                updateCustomerRequest.data.billing_address.postcode = postcodeValue
                                updateCustomerRequest.body.billing_address.postcode = postcodeValue
                            }
                            updateCustomerRequest.data.billing_address.address_1 = addressData
                            updateCustomerRequest.body.billing_address.address_1 = addressData
                        }

                        if (stateData !== '' && WooBetterData.wooHiddenAddress === 'yes') {
                            updateCustomerRequest.data.shipping_address.state = stateData
                            updateCustomerRequest.body.shipping_address.state = stateData
                            updateCustomerRequest.data.billing_address.state = stateData
                            updateCustomerRequest.body.billing_address.state = stateData
                        }

                        if (cityData !== '' && WooBetterData.wooHiddenAddress === 'yes') {
                            updateCustomerRequest.data.shipping_address.city = cityData
                            updateCustomerRequest.body.shipping_address.city = cityData
                            updateCustomerRequest.data.billing_address.city = cityData
                            updateCustomerRequest.body.billing_address.city = cityData
                        }

                        options.body = JSON.stringify(requestData);
                    }
                } catch (err) {
                    console.error('Erro ao modificar o body: ', err);
                    if (addressSummary) {
                        removeLoading(addressSummary)
                        addressSummary.removeEventListener('click', blockInteraction, true);
                    }
                    if (iconSummary) {
                        iconSummary.removeEventListener('click', blockInteraction, true);
                    }
                }

                const result = originalFetch(url, options);

                return result.then(async function (response) {
                    if (!postcodeError) {
                        if (countRequest === 1) {
                            countRequestTimeOut = setTimeout(async () => {
                                countRequest = 0
                                await removeInteractionEvents();
                                resetAddressInteraction();
                            }, 4000);
                        } else if (countRequest > 1) {
                            clearTimeout(countRequestTimeOut);
                            countRequest = 0
                            await removeInteractionEvents();
                            resetAddressInteraction();
                        }

                        countRequest++;
                    }
                    return response;
                }).catch(error => {
                    console.error('Erro na requisição:', error);
                    throw error;
                });
            }

            // Sempre chama o fetch original
            return originalFetch(url, options);

        }
    }

    async function removeInteractionEvents() {
        if (typeof WooBetterData !== 'undefined' && WooBetterData.wooVersion === 'woo-block') {
            addressSummary = document.querySelector('.wc-block-components-totals-shipping-address-summary');
        } else if (WooBetterData.wooVersion === 'woo-class') {
            await waitForShippingBlock();
        }

        if (addressSummary) {
            addressSummary.removeEventListener('click', blockInteraction, true);
        }
        if (iconSummary) {
            iconSummary.removeEventListener('click', blockInteraction, true);
        }
    }

    function resetAddressInteraction() {
        removeLoading(addressSummary);
        enableButton(continueButton);
        addressData = '';
        stateData = '';
        cityData = '';
        countRequestTimeOut = null;
    }

    async function waitForShippingBlock() {
        return new Promise((resolve, reject) => {
            const shippingBlockInterval = setInterval(() => {
                const shippingBlock = document.querySelector('.wc-block-components-shipping-address');

                if (shippingBlock) {
                    addressSummary = shippingBlock
                    clearInterval(shippingBlockInterval);
                    resolve();
                } else if (shippingBlockIntervalCount >= 40) {
                    clearInterval(shippingBlockInterval);
                    resolve();
                }

                shippingBlockIntervalCount++;
            }, 100);
        });
    }

    async function batchRequest() {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        if (typeof wpApiSettings !== 'undefined' && wpApiSettings.root) {
            apiUrl = wpApiSettings.root + `lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;
        } else {
            if (typeof WooBetterData !== 'undefined' && WooBetterData.wooUrl !== '') {
                apiUrl = WooBetterData.wooUrl + `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;
            } else {
                apiUrl = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;
            }
        }

        addressSummary.addEventListener('click', blockInteraction, true);
        addressSummary.classList.add('lkn-wc-shipping-address-summary');
        addressSummary.style.position = 'relative';
        addressSummary.classList.add('loading');
        const spinner = addressSummary.querySelector('.spinner');
        requestRepeated = true
        if (!spinner) {
            addressSummary.insertAdjacentHTML('beforeend', '<span class="spinner is-active"></span>');
        }

        await fetch(apiUrl, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => response.json())
            .then(data => {
                clearTimeout(timeoutId);

                if (data.status === true) {
                    if (!data.address || !data.state_sigla || !data.city) {
                        postcodeError = true
                        if (addressSummary) {
                            removeLoading(addressSummary);
                            addressSummary.removeEventListener('click', blockInteraction, true);
                            if (iconSummary) {

                            }
                            iconSummary.removeEventListener('click', blockInteraction, true);
                        }

                        if (!data.address) {
                            return alert('Erro: Endereço inválido.');
                        }

                        if (!data.state_sigla) {
                            return alert('Erro: Estado inválido.');
                        }

                        if (!data.city) {
                            return alert('Erro: Cidade inválida.');
                        }
                    } else {
                        postcodeError = false
                    }

                    addressData = data.address;
                    stateData = data.state_sigla;
                    cityData = data.city;

                    let wooNonce = ''
                    let wpNonce = ''

                    if (typeof wpApiSettings !== 'undefined' && wpApiSettings?.nonce) {
                        wpNonce = wpApiSettings.nonce
                    }

                    if (wcBlocksMiddlewareConfig) {
                        wooNonce = wcBlocksMiddlewareConfig.storeApiNonce
                    }

                    let batchUrl = ''

                    if (typeof wpApiSettings !== 'undefined' && wpApiSettings.root) {
                        batchUrl = wpApiSettings.root + `/wc/store/v1/batch?_locale=site`;
                    } else {
                        batchUrl = window.location.origin + `/wp-json/wc/store/v1/batch?_locale=site`;
                        if (typeof WooBetterData !== 'undefined' && WooBetterData.wooUrl !== '') {
                            apiUrl = WooBetterData.wooUrl + `/wp-json/wc/store/v1/batch?_locale=site`;
                        } else {
                            apiUrl = `/wp-json/wc/store/v1/batch?_locale=site`;
                        }
                    }

                    fetch(batchUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Nonce': wooNonce,
                            'x-wp-nonce': wpNonce
                        },
                        body: JSON.stringify({
                            requests: [
                                {
                                    method: 'POST',
                                    path: '/wc/store/v1/cart/update-customer',
                                    body: {
                                        shipping_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        },
                                        billing_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        }
                                    },
                                    data: {
                                        shipping_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        },
                                        billing_address: {
                                            postcode: postcodeValue,
                                            address_1: addressData,
                                            state: stateData,
                                            city: cityData
                                        }
                                    },
                                    headers: {
                                        'Nonce': wooNonce
                                    },
                                    cache: 'no-store'
                                }
                            ]
                        })
                    })
                } else {
                    alert('Erro: ' + data.message);
                    removeLoading(addressSummary);
                    postcodeError = true;
                    addressSummary.removeEventListener('click', blockInteraction, true);
                    if (iconSummary) {
                        iconSummary.removeEventListener('click', blockInteraction, true);
                    }
                }
            })
            .catch(error => {
                clearTimeout(timeoutId); // Também limpa o timeout no erro
                if (error.name === 'AbortError') {
                    alert('Erro: Tempo limite de resposta excedido.');
                } else {
                    console.error(error);
                }
                removeLoading(addressSummary);
                addressSummary.removeEventListener('click', blockInteraction, true);
                if (iconSummary) {
                    iconSummary.removeEventListener('click', blockInteraction, true);
                }
            });
    }


    initObserver();
    interceptSubmit()

});
