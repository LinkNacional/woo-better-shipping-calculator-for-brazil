document.addEventListener('DOMContentLoaded', function () {
    let observer;
    let previousClickHandler = null;
    let cepFound = false
    let previousCep = ''
    let continueButtonFound = false
    let errorRequest = true
    let iconSummary = null
    let addressSummary = null
    let previousText = ''
    let postcodeValue = ''
    let continueButton = null

    let batchRequested = false
    let addressData = ''
    let stateData = ''
    let cityData = ''

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
                    batchRequested = false
                    errorRequest = false

                    addressSummary.addEventListener('click', blockInteraction, true);
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

                } else {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 10000);
                    const apiUrl = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;

                    addressSummary.addEventListener('click', blockInteraction, true);
                    addressSummary.classList.add('lkn-wc-shipping-address-summary');
                    addressSummary.style.position = 'relative';
                    addressSummary.classList.add('loading');
                    const spinner = addressSummary.querySelector('.spinner');
                    if (!spinner) {
                        addressSummary.insertAdjacentHTML('beforeend', '<span class="spinner is-active"></span>');
                    }

                    await fetch(apiUrl, { signal: controller.signal })
                        .then(response => response.json())
                        .then(data => {
                            clearTimeout(timeoutId); // Se deu certo, limpa o timeout

                            if (data.status === true) {
                                enableButton(continueButton)
                                removeLoading(addressSummary);
                                addressSummary.removeEventListener('click', blockInteraction, true);
                                if (iconSummary) {
                                    iconSummary.removeEventListener('click', blockInteraction, true);
                                }
                            } else {
                                alert('Erro: ' + data.message);
                                removeLoading(addressSummary);
                                addressSummary.removeEventListener('click', blockInteraction, true);
                                if (iconSummary) {
                                    iconSummary.removeEventListener('click', blockInteraction, true);
                                }
                                errorRequest = true;
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
                if (!batchRequested && isValidCEP(postcodeValue)) {

                    if (addressSummary) {
                        const summaryBlock = document.querySelector('.wc-block-components-totals-shipping-panel');
                        if (summaryBlock) {
                            iconSummary = summaryBlock.querySelector('.wc-block-components-panel__button-icon');
                            if (iconSummary) {
                                iconSummary.addEventListener('click', blockInteraction, true);
                            }
                        }

                        const apiUrl = `/wp-json/lknwcbettershipping/v1/cep/?postcode=${postcodeValue}`;

                        batchRequested = true

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

                        await fetch(apiUrl, { signal: controller.signal })
                            .then(response => response.json())
                            .then(data => {
                                clearTimeout(timeoutId); // Se deu certo, limpa o timeout

                                if (data.status === true) {
                                    if (options && options.body) {
                                        addressData = data.address ? data.address : ' ';
                                        stateData = data.state_sigla;
                                        cityData = data.city ? data.city : ' ';
                                    }
                                } else {
                                    alert('Erro: ' + data.message);
                                    removeLoading(addressSummary);
                                    addressSummary.removeEventListener('click', blockInteraction, true);
                                    if (iconSummary) {
                                        iconSummary.removeEventListener('click', blockInteraction, true);
                                    }
                                    errorRequest = true;
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

                        if (addressData !== '') {
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

                        if (stateData !== '') {
                            updateCustomerRequest.data.shipping_address.state = stateData
                            updateCustomerRequest.body.shipping_address.state = stateData
                            updateCustomerRequest.data.billing_address.state = stateData
                            updateCustomerRequest.body.billing_address.state = stateData
                        }

                        if (cityData !== '') {
                            updateCustomerRequest.data.shipping_address.city = cityData
                            updateCustomerRequest.body.shipping_address.city = cityData
                            updateCustomerRequest.data.billing_address.city = cityData
                            updateCustomerRequest.body.billing_address.city = cityData
                        }

                        if (addressData !== '' && stateData !== '' && cityData !== '' && !errorRequest) {

                            observer = new MutationObserver((mutationsList) => {
                                for (const mutation of mutationsList) {
                                    if (
                                        mutation.type === 'childList' ||
                                        mutation.type === 'characterData' ||
                                        mutation.type === 'subtree'
                                    ) {
                                        const strongELement = addressSummary.querySelector('strong');
                                        if (strongELement) {
                                            console.log('opa')
                                            addressSummary.removeChild(strongELement);
                                        }
                                    }
                                }
                            });

                            observer.observe(addressSummary, {
                                childList: true,
                                characterData: true,
                                subtree: true
                            });

                            const previousPostcode = document.querySelector('.wc-block-components-address-form__postcode');
                            const inputPreviousPostcode = previousPostcode ? previousPostcode.querySelector('input') : null;

                            let pComponent = addressSummary.querySelector('p');

                            console.log(pComponent)

                            if (!pComponent) {
                                let newP = document.createElement('p');
                                newP.style.margin = '0';

                                const spanField = addressSummary.querySelector('span:not(.spinner)');
                                if (spanField) {
                                    const textNode = Array.from(addressSummary.childNodes).find(node => node.nodeType === Node.TEXT_NODE);

                                    if (textNode) {
                                        addressSummary.removeChild(textNode);

                                        // Insert the <strong> before the <span>
                                        const span = addressSummary.querySelector('span');
                                        addressSummary.insertBefore(newP, span);
                                    }
                                } else {
                                    console.log('opaaaaaaaaa')
                                    addressSummary.appendChild(newP);
                                }
                            }

                            newP = addressSummary.querySelector('p');

                            if (previousText && newP) {
                                let responseText = '';
                                if (WooBetterData.wooVersion === 'woo-block') {
                                    responseText = `${postcodeValue}, ${cityData}, ${stateData}, Brasil `
                                } else {
                                    responseText = `Entrega em ${postcodeValue}, ${cityData}, ${stateData}, Brasil `
                                }

                                if (postcodeValue !== previousCep) {

                                    newP.textContent = responseText;
                                    removeLoading(addressSummary);
                                    previousText = newP.textContent;
                                    enableButton(continueButton);
                                    if (inputPreviousPostcode) {
                                        previousCep = inputPreviousPostcode.value;
                                    }
                                }

                                if (addressSummary) {
                                    addressSummary.removeEventListener('click', blockInteraction, true);
                                }
                                if (iconSummary) {
                                    iconSummary.removeEventListener('click', blockInteraction, true);
                                }
                            } else {
                                removeLoading(addressSummary)
                                if (addressSummary) {
                                    addressSummary.removeEventListener('click', blockInteraction, true);
                                }
                                if (iconSummary) {
                                    iconSummary.removeEventListener('click', blockInteraction, true);
                                }
                            }
                        } else {
                            removeLoading(addressSummary)
                            if (addressSummary) {
                                addressSummary.removeEventListener('click', blockInteraction, true);
                            }
                            if (iconSummary) {
                                iconSummary.removeEventListener('click', blockInteraction, true);
                            }
                        }

                        options.body = JSON.stringify(requestData);
                    }
                } catch (err) {
                    console.error('Erro ao modificar o body: ', err);
                    removeLoading(addressSummary)
                    if (addressSummary) {
                        addressSummary.removeEventListener('click', blockInteraction, true);
                    }
                    if (iconSummary) {
                        iconSummary.removeEventListener('click', blockInteraction, true);
                    }
                }
            }

            // Sempre chama o fetch original
            return originalFetch(url, options);
        };
    }

    async function waitForShippingBlock() {
        return new Promise((resolve, reject) => {
            const shippingBlockInterval = setInterval(() => {
                const shippingBlock = document.querySelector('.wc-block-components-shipping-address');

                if (shippingBlock) {
                    addressSummary = shippingBlock
                    clearInterval(shippingBlockInterval);
                    resolve();
                } else if (shippingBlockIntervalCount >= 20) {
                    clearInterval(shippingBlockInterval);
                    resolve();
                }

                shippingBlockIntervalCount++;
            }, 100);
        });
    }

    initObserver();
    interceptSubmit()

});
