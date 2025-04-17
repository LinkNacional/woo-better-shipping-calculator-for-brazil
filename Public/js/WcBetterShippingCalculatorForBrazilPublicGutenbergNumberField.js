document.addEventListener("DOMContentLoaded", function () {
    let shippingBlockFound = false
    let billingBlockFound = false
    let submitFound = false
    let submitEvent = false
    let placeOrderButton = null

    const observer = new MutationObserver((mutationsList) => {
        const shippingBlock = document.querySelector('#shipping')

        const billingBlock = document.querySelector('#billing')

        if (!shippingBlock) {
            shippingBlockFound = false
        }

        if (!billingBlock) {
            billingBlockFound = false
        }

        if (shippingBlock && !shippingBlockFound) {
            const editShippingButton = document.querySelector('span.wc-block-components-address-card__edit[aria-controls="shipping"]');

            if (editShippingButton.getAttribute('aria-expanded') != 'true') {
                editShippingButton.click()
            }

            if (editShippingButton.getAttribute('aria-expanded') == 'true') {

                const shippingAddress1 = shippingBlock.querySelector('.wc-block-components-text-input.wc-block-components-address-form__address_1');

                shippingBlockFound = true

                if (shippingAddress1) {

                    // Criando a div principal
                    const customInputDiv = document.createElement('div');
                    customInputDiv.className = 'wc-block-components-text-input wc-block-components-address-form__number wc-better-shipping-number';

                    // Criando o input
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.id = 'shipping-number';
                    input.setAttribute('autocomplete', 'give-number');
                    input.setAttribute('aria-label', 'Número');
                    input.setAttribute('required', '');
                    input.setAttribute('aria-invalid', 'false');
                    input.setAttribute('autocapitalize', 'sentences');
                    input.value = '';

                    // Criando o label
                    const label = document.createElement('label');
                    label.setAttribute('for', 'shipping-number');
                    label.textContent = 'Número';

                    // Adicionando input e label ao container
                    customInputDiv.appendChild(input);
                    customInputDiv.appendChild(label);

                    // Criando a div de erro (inicialmente oculta)
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'wc-block-components-validation-error wc-better-shipping';
                    errorDiv.setAttribute('role', 'alert');
                    errorDiv.style.display = 'none';

                    const errorParagraph = document.createElement('p');
                    errorParagraph.id = 'validate-error-shipping_number';

                    const errorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    errorSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    errorSvg.setAttribute('viewBox', '-2 -2 24 24');
                    errorSvg.setAttribute('width', '24');
                    errorSvg.setAttribute('height', '24');
                    errorSvg.setAttribute('aria-hidden', 'true');
                    errorSvg.setAttribute('focusable', 'false');

                    const errorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    errorPath.setAttribute('d', 'M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z');

                    errorSvg.appendChild(errorPath);
                    const errorMessage = document.createElement('span');
                    errorMessage.textContent = 'Por favor, insira um número válido.';

                    errorParagraph.appendChild(errorSvg);
                    errorParagraph.appendChild(errorMessage);
                    errorDiv.appendChild(errorParagraph);

                    // Adicionando a mensagem de erro ao input
                    customInputDiv.appendChild(errorDiv);

                    // Também adiciona o checkbox personalizado
                    const clonedCheckbox = document.createElement('div');
                    clonedCheckbox.className = 'wc-block-components-checkbox wc-block-checkout__use-address-for-shipping wc-better';

                    const checkboxLabel = document.createElement('label');
                    checkboxLabel.setAttribute('for', 'wc-shipping-better-checkbox');

                    const checkboxInput = document.createElement('input');
                    checkboxInput.id = 'wc-shipping-better-checkbox';
                    checkboxInput.className = 'wc-block-components-checkbox__input';
                    checkboxInput.type = 'checkbox';
                    checkboxInput.setAttribute('aria-invalid', 'false');

                    const checkboxSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    checkboxSvg.setAttribute('class', 'wc-block-components-checkbox__mark');
                    checkboxSvg.setAttribute('aria-hidden', 'true');
                    checkboxSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                    checkboxSvg.setAttribute('viewBox', '0 0 24 20');

                    const checkboxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    checkboxPath.setAttribute('d', 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');

                    checkboxSvg.appendChild(checkboxPath);

                    const checkboxText = document.createElement('span');
                    checkboxText.className = 'wc-block-components-checkbox__label';
                    checkboxText.textContent = 'Sem número (S/N)';

                    checkboxLabel.appendChild(checkboxInput);
                    checkboxLabel.appendChild(checkboxSvg);
                    checkboxLabel.appendChild(checkboxText);
                    clonedCheckbox.appendChild(checkboxLabel);

                    // Inserindo no DOM
                    shippingAddress1.insertAdjacentElement('afterend', clonedCheckbox);
                    shippingAddress1.insertAdjacentElement('afterend', customInputDiv);

                    input.addEventListener('focus', () => {
                        customInputDiv.classList.add('is-active');
                    });

                    input.addEventListener('blur', () => {
                        if (!input.value) {
                            customInputDiv.classList.remove('is-active');
                        }
                    });
                }

                const billingCheckContainer = document.querySelector('.wc-block-components-checkbox.wc-block-checkout__use-address-for-billing');
                const billingCheck = billingCheckContainer ? billingCheckContainer.querySelector('input') : null;

                if (billingCheck) {
                    billingCheck.addEventListener('change', function () {
                        if (!billingCheck.checked) {
                            billingBlockFound = false
                            const newBillingBlock = document.querySelector('#billing')
                            billingNumberHandle(newBillingBlock);
                        }
                    });
                }
            }
        }

        if (billingBlock && !billingBlockFound) {
            billingNumberHandle(billingBlock)
        }

        const placeOrderContainer = document.querySelector('.wc-block-checkout__actions_row')
        const shippingCheckboxInput = document.getElementById('wc-shipping-better-checkbox')

        if (placeOrderContainer) {
            placeOrderButton = placeOrderContainer.querySelector('button')
        }

        if (placeOrderButton && shippingCheckboxInput && !submitFound) {
            submitFound = true
            const shippingNumberInput = document.getElementById('shipping-number');
            const shippingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-shipping');
            const divInputNumber = document.querySelector('.wc-better-shipping-number');

            shippingCheckboxInput.addEventListener('change', function () {
                if (this.checked) {
                    shippingNumberInput.disabled = true;
                    shippingNumberInput.setAttribute('value', 'S/N');
                    shippingNumberInput.value = 'S/N';
                    shippingNumberInput.style.backgroundColor = '#e0e0e0';
                    shippingNumberInput.style.color = '#808080';
                    if (divInputNumber) {
                        divInputNumber.classList.add('is-active');
                    }
                    if (shippingErrorNumberInput) {
                        shippingErrorNumberInput.style.display = 'none'
                    }
                } else {
                    shippingNumberInput.disabled = false;
                    shippingNumberInput.setAttribute('value', '');
                    shippingNumberInput.value = '';
                    shippingNumberInput.style.backgroundColor = '';
                    shippingNumberInput.style.color = '';
                    if (divInputNumber) {
                        divInputNumber.classList.remove('is-active');
                    }
                }
            });

            if (shippingNumberInput && shippingErrorNumberInput) {
                // Evento de input para monitorar mudanças no campo
                shippingNumberInput.addEventListener('input', function () {
                    if (shippingNumberInput.value.trim().length > 0) {
                        // Remove a restrição ao clique
                        shippingErrorNumberInput.style.display = 'none'
                    } else {
                        // Adiciona novamente a restrição caso fique vazio
                        shippingErrorNumberInput.style.display = 'block'
                    }
                });
            }

            if (placeOrderButton) {
                placeOrderButton.addEventListener('click', handlePlaceOrderClick);

                function handlePlaceOrderClick(event) {
                    const shippingNumberInput = document.getElementById('shipping-number');
                    const billingNumberInput = document.getElementById('billing-number');

                    const shippingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-shipping');
                    const billingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-billing');

                    if (!shippingNumberInput.value.trim().length) {
                        event.stopPropagation(); // Bloqueia a propagação se estiver vazio
                        event.preventDefault(); // Previne o envio do formulário
                        shippingErrorNumberInput.style.display = 'block'

                        shippingNumberInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (!billingNumberInput.value.trim().length) {
                        event.stopPropagation(); // Bloqueia a propagação se estiver vazio
                        event.preventDefault(); // Previne o envio do formulário
                        billingErrorNumberInput.style.display = 'block'

                        billingNumberInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }

        if (shippingBlockFound && submitFound && !submitEvent) {
            (function () {
                const originalFetch = window.fetch;

                window.fetch = async function (input, init) {
                    // Verifica se a requisição é para a rota específica do checkout
                    if (typeof input === 'string' && input.includes('/wp-json/wc/store/v1/checkout')) {
                        try {
                            const body = JSON.parse(init.body);

                            // Obtém o valor do input do número do endereço
                            const shippingNumberInput = document.getElementById('shipping-number');
                            const shippingNumber = shippingNumberInput ? shippingNumberInput.value.trim() : '';

                            const billingNumberInput = document.getElementById('billing-number');
                            const billingNumber = billingNumberInput ? billingNumberInput.value.trim() : '';

                            const billingCheckContainer = document.querySelector('.wc-block-components-checkbox.wc-block-checkout__use-address-for-billing')
                            const billingCheck = billingCheckContainer ? billingCheckContainer.querySelector('input') : ''

                            if (billingCheck) {
                                if (billingCheck.checked) {
                                    if (body?.billing_address?.address_1) {
                                        body.billing_address.address_1 += ` - ${shippingNumber}`;
                                        body['shipping_number'] = shippingNumber
                                    }
                                } else {
                                    if (billingNumber) {
                                        if (body?.billing_address?.address_1) {
                                            body.billing_address.address_1 += ` - ${billingNumber}`;
                                            body['billing_number'] = shippingNumber
                                        }
                                    } else {
                                        if (body?.billing_address?.address_1) {
                                            body.billing_address.address_1 += ` - S/N`;
                                            body['billing_number'] = 'S/N'
                                        }
                                    }
                                }
                            }

                            if (shippingNumber && body?.shipping_address?.address_1) {
                                body.shipping_address.address_1 += ` - ${shippingNumber}`;
                            }

                            // Atualiza o corpo da requisição
                            init.body = JSON.stringify(body);
                        } catch (error) {
                            console.error('Erro ao modificar a requisição do checkout:', error);
                        }
                    }

                    return originalFetch(input, init);
                };
            })();

            submitEvent = true
        }
    });

    // Configuração do observer para observar mudanças no corpo do documento
    observer.observe(document.body, { childList: true, subtree: true });

    function billingNumberHandle(billingBlock) {
        const editBillingButton = document.querySelector('span.wc-block-components-address-card__edit[aria-controls="billing"]');
        const editBillingInput = document.getElementById('billing-number')

        if (editBillingButton.getAttribute('aria-expanded') != 'true') {
            editBillingButton.click()
        }

        if (editBillingButton.getAttribute('aria-expanded') == 'true' && !editBillingInput) {

            const billingAddress1 = billingBlock.querySelector('.wc-block-components-text-input.wc-block-components-address-form__address_1');

            billingBlockFound = true

            if (billingAddress1) {

                // Criando a div principal
                const customInputDiv = document.createElement('div');
                customInputDiv.className = 'wc-block-components-text-input wc-block-components-address-form__number wc-better-billing-number';

                // Criando o input
                const input = document.createElement('input');
                input.type = 'text';
                input.id = 'billing-number';
                input.setAttribute('autocomplete', 'give-number');
                input.setAttribute('aria-label', 'Número');
                input.setAttribute('required', '');
                input.setAttribute('aria-invalid', 'false');
                input.setAttribute('autocapitalize', 'sentences');
                input.value = '';

                // Criando o label
                const label = document.createElement('label');
                label.setAttribute('for', 'billing-number');
                label.textContent = 'Número';

                // Adicionando input e label ao container
                customInputDiv.appendChild(input);
                customInputDiv.appendChild(label);

                // Criando a div de erro (inicialmente oculta)
                const errorDiv = document.createElement('div');
                errorDiv.className = 'wc-block-components-validation-error wc-better-billing';
                errorDiv.setAttribute('role', 'alert');
                errorDiv.style.display = 'none';

                const errorParagraph = document.createElement('p');
                errorParagraph.id = 'validate-error-billing_number';

                const errorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                errorSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                errorSvg.setAttribute('viewBox', '-2 -2 24 24');
                errorSvg.setAttribute('width', '24');
                errorSvg.setAttribute('height', '24');
                errorSvg.setAttribute('aria-hidden', 'true');
                errorSvg.setAttribute('focusable', 'false');

                const errorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                errorPath.setAttribute('d', 'M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z');

                errorSvg.appendChild(errorPath);
                const errorMessage = document.createElement('span');
                errorMessage.textContent = 'Por favor, insira um número válido.';

                errorParagraph.appendChild(errorSvg);
                errorParagraph.appendChild(errorMessage);
                errorDiv.appendChild(errorParagraph);

                // Adicionando a mensagem de erro ao input
                customInputDiv.appendChild(errorDiv);

                // Também adiciona o checkbox personalizado
                const clonedCheckbox = document.createElement('div');
                clonedCheckbox.className = 'wc-block-components-checkbox wc-block-checkout__use-address-for-billing wc-better';

                const checkboxLabel = document.createElement('label');
                checkboxLabel.setAttribute('for', 'wc-billing-better-checkbox');

                const checkboxInput = document.createElement('input');
                checkboxInput.id = 'wc-billing-better-checkbox';
                checkboxInput.className = 'wc-block-components-checkbox__input';
                checkboxInput.type = 'checkbox';
                checkboxInput.setAttribute('aria-invalid', 'false');

                const checkboxSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                checkboxSvg.setAttribute('class', 'wc-block-components-checkbox__mark');
                checkboxSvg.setAttribute('aria-hidden', 'true');
                checkboxSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                checkboxSvg.setAttribute('viewBox', '0 0 24 20');

                const checkboxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                checkboxPath.setAttribute('d', 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');

                checkboxSvg.appendChild(checkboxPath);

                const checkboxText = document.createElement('span');
                checkboxText.className = 'wc-block-components-checkbox__label';
                checkboxText.textContent = 'Sem número (S/N)';

                checkboxLabel.appendChild(checkboxInput);
                checkboxLabel.appendChild(checkboxSvg);
                checkboxLabel.appendChild(checkboxText);
                clonedCheckbox.appendChild(checkboxLabel);

                // Inserindo no DOM
                billingAddress1.insertAdjacentElement('afterend', clonedCheckbox);
                billingAddress1.insertAdjacentElement('afterend', customInputDiv);

                input.addEventListener('focus', () => {
                    customInputDiv.classList.add('is-active');
                });

                input.addEventListener('blur', () => {
                    if (!input.value) {
                        customInputDiv.classList.remove('is-active');
                    }
                });

                const billingCheckboxInput = document.getElementById('wc-billing-better-checkbox')
                const billingNumberInput = document.getElementById('billing-number');

                billingCheckboxInput.addEventListener('change', function () {
                    const divInputNumber = document.querySelector('.wc-better-billing-number');
                    const billingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-billing');

                    if (this.checked) {
                        billingNumberInput.disabled = true;
                        billingNumberInput.setAttribute('value', 'S/N');
                        billingNumberInput.value = 'S/N';
                        billingNumberInput.style.backgroundColor = '#e0e0e0';
                        billingNumberInput.style.color = '#808080';
                        if (divInputNumber) {
                            divInputNumber.classList.add('is-active');
                        }
                        if (billingErrorNumberInput) {
                            billingErrorNumberInput.style.display = 'none'
                        }
                    } else {
                        billingNumberInput.disabled = false;
                        billingNumberInput.setAttribute('value', '');
                        billingNumberInput.value = '';
                        billingNumberInput.style.backgroundColor = '';
                        billingNumberInput.style.color = '';
                        if (divInputNumber) {
                            divInputNumber.classList.remove('is-active');
                        }
                    }
                });

                billingNumberInput.addEventListener('input', function () {
                    const billingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-billing');
                    if (billingNumberInput.value.trim().length > 0) {
                        // Remove a restrição ao clique
                        billingErrorNumberInput.style.display = 'none'
                    } else {
                        // Adiciona novamente a restrição caso fique vazio
                        billingErrorNumberInput.style.display = 'block'
                    }
                });
            }
        }
    }
});

