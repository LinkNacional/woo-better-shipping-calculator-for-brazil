document.addEventListener("DOMContentLoaded", function () {
    let shippingBlockFound = false
    let billingBlockFound = false
    let submitFound = false
    let shippingEventsBound = false;
    let billingEventsBound = false;
    let placeOrderButton = null
    let intervalCount = 0
    let checkboxCount = 0

    const observer = new MutationObserver((mutationsList) => {
        const shippingBlock = document.querySelector('#shipping')

        const billingBlock = document.querySelector('#billing')

        if (!shippingBlock) {
            shippingBlockFound = false
            intervalCount = 0
        }

        if (!billingBlock) {
            billingBlockFound = false
        }

        if (shippingBlock && !shippingBlockFound) {

            shippingBlockFound = true

            const observerEditButton = setInterval(() => {

                if (intervalCount > 20) {
                    clearInterval(observerEditButton)
                    return
                }

                const editShippingButton = document.querySelector('span.wc-block-components-address-card__edit[aria-controls="shipping"]');

                if (editShippingButton.getAttribute('aria-expanded') != 'true') {
                    editShippingButton.click()
                }

                if (editShippingButton.getAttribute('aria-expanded') == 'true') {

                    clearInterval(observerEditButton)

                    const shippingAddress1 = shippingBlock.querySelector('.wc-block-components-text-input.wc-block-components-address-form__address_1');
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
                        // Valor inicial
                        const initialValue = (typeof WooBetterNumberData !== 'undefined' && WooBetterNumberData.shipping_number) ? WooBetterNumberData.shipping_number : '';
                        input.value = initialValue;
                        if (initialValue !== '') {
                            customInputDiv.classList.add('is-active');
                        }

                        // Criando o checkbox
                        const shippingCheckboxInput = document.createElement('input');
                        shippingCheckboxInput.id = 'wc-shipping-better-checkbox';
                        shippingCheckboxInput.className = 'wc-block-components-checkbox__input';
                        shippingCheckboxInput.type = 'checkbox';
                        shippingCheckboxInput.setAttribute('aria-invalid', 'false');
                        // Estado inicial do checkbox/input
                        if (typeof WooBetterNumberData !== 'undefined' && WooBetterNumberData.shipping_number === 'S/N') {
                            shippingCheckboxInput.checked = true;
                            input.disabled = true;
                            input.style.backgroundColor = '#e0e0e0';
                            input.style.color = '#808080';
                        }
                        // Evento de input para registrar valor
                        input.addEventListener('input', function () {
                            let val = input.value.trim();
                            if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                let data = { woo_better_shipping_number: val, woo_better_billing_number: '' };
                                const billingNumberInput = document.getElementById('billing-number');
                                if (!billingNumberInput) {
                                    data.woo_better_billing_number = val;
                                } else {
                                    data.woo_better_billing_number = billingNumberInput.value;
                                }
                                window.wc.blocksCheckout.extensionCartUpdate({
                                    namespace: 'woo_better_number_validation',
                                    data: data
                                });
                            }
                        });

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

                        // Criando o checkbox
                        const checkboxInput = document.createElement('input');
                        checkboxInput.id = 'wc-shipping-better-checkbox';
                        checkboxInput.className = 'wc-block-components-checkbox__input';
                        checkboxInput.type = 'checkbox';
                        checkboxInput.setAttribute('aria-invalid', 'false');
                        // Estado inicial do checkbox/input
                        if (typeof WooBetterNumberData !== 'undefined' && WooBetterNumberData.shipping_number === 'S/N') {
                            checkboxInput.checked = true;
                            input.disabled = true;
                            input.style.backgroundColor = '#e0e0e0';
                            input.style.color = '#808080';
                        }
                        // Evento de change para registrar valor
                        checkboxInput.addEventListener('change', function () {
                            let val = this.checked ? 'S/N' : '';
                            if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                                let data = { woo_better_shipping_number: val, woo_better_billing_number: '' };
                                const billingNumberInput = document.getElementById('billing-number');
                                if (!billingNumberInput) {
                                    data.woo_better_billing_number = val;
                                } else {
                                    data.woo_better_billing_number = billingNumberInput.value;
                                }
                                window.wc.blocksCheckout.extensionCartUpdate({
                                    namespace: 'woo_better_number_validation',
                                    data: data
                                });
                            }
                        });

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

                intervalCount++

            }, 5);

        }

        if (billingBlock && !billingBlockFound) {
            billingNumberHandle(billingBlock)
        }

        const placeOrderContainer = document.querySelector('.wc-block-checkout__actions_row')

        if (placeOrderContainer) {
            placeOrderButton = placeOrderContainer.querySelector('button')
        }

        if (placeOrderButton && !submitFound) {
            submitFound = true

            let shippingNumberInput = ''
            let shippingErrorNumberInput = ''


            const checkboxInterval = setInterval(() => {
                const shippingCheckboxInput = document.getElementById('wc-shipping-better-checkbox')

                shippingNumberInput = document.getElementById('shipping-number');
                shippingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-shipping');
                const divInputNumber = document.querySelector('.wc-better-shipping-number');

                if (checkboxCount > 20) {
                    clearInterval(checkboxInterval)
                }

                if (shippingCheckboxInput) {
                    clearInterval(checkboxInterval)
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
                }
            }, 10);

            if (placeOrderButton) {
                placeOrderButton.addEventListener('click', handlePlaceOrderClick);

                function handlePlaceOrderClick(event) {
                    const shippingNumberInput = document.getElementById('shipping-number');
                    const billingNumberInput = document.getElementById('billing-number');

                    const shippingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-shipping');
                    const billingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-billing');

                    if (shippingNumberInput && !shippingNumberInput.value.trim().length) {
                        event.stopPropagation(); // Bloqueia a propagação se estiver vazio
                        event.preventDefault(); // Previne o envio do formulário
                        shippingErrorNumberInput.style.display = 'block'

                        shippingNumberInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    } else if (billingNumberInput && !billingNumberInput.value.trim().length) {
                        event.stopPropagation(); // Bloqueia a propagação se estiver vazio
                        event.preventDefault(); // Previne o envio do formulário
                        billingErrorNumberInput.style.display = 'block'

                        billingNumberInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
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
                // Valor inicial
                const initialValue = (typeof WooBetterNumberData !== 'undefined' && WooBetterNumberData.billing_number) ? WooBetterNumberData.billing_number : '';
                input.value = initialValue;
                if (initialValue !== '') {
                    customInputDiv.classList.add('is-active'); // animação label
                }

                // Criando o checkbox
                const billingCheckboxInput = document.createElement('input');
                billingCheckboxInput.id = 'wc-billing-better-checkbox';
                billingCheckboxInput.className = 'wc-block-components-checkbox__input';
                billingCheckboxInput.type = 'checkbox';
                billingCheckboxInput.setAttribute('aria-invalid', 'false');
                // Estado inicial do checkbox/input
                if (typeof WooBetterNumberData !== 'undefined' && WooBetterNumberData.billing_number === 'S/N') {
                    billingCheckboxInput.checked = true;
                    input.disabled = true;
                    input.style.backgroundColor = '#e0e0e0';
                    input.style.color = '#808080';
                }
                // Evento de input para registrar valor
                input.addEventListener('input', function () {
                    let val = input.value.trim();
                    if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                        let data = { woo_better_shipping_number: '', woo_better_billing_number: val };
                        const shippingNumberInput = document.getElementById('shipping-number');
                        if (!shippingNumberInput) {
                            data.woo_better_shipping_number = val;
                        } else {
                            data.woo_better_shipping_number = shippingNumberInput.value;
                        }

                        window.wc.blocksCheckout.extensionCartUpdate({
                            namespace: 'woo_better_number_validation',
                            data: data
                        });
                    }
                });

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

                // Criando o checkbox
                const checkboxInput = document.createElement('input');
                checkboxInput.id = 'wc-billing-better-checkbox';
                checkboxInput.className = 'wc-block-components-checkbox__input';
                checkboxInput.type = 'checkbox';
                checkboxInput.setAttribute('aria-invalid', 'false');
                // Estado inicial do checkbox/input
                if (typeof WooBetterNumberData !== 'undefined' && WooBetterNumberData.billing_number === 'S/N') {
                    checkboxInput.checked = true;
                    input.disabled = true;
                    input.style.backgroundColor = '#e0e0e0';
                    input.style.color = '#808080';
                }
                // Evento de change para registrar valor
                checkboxInput.addEventListener('change', function () {
                    let val = this.checked ? 'S/N' : '';
                    if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
                        let data = { woo_better_shipping_number: '', woo_better_billing_number: val };
                        const shippingNumberInput = document.getElementById('shipping-number');
                        if (!shippingNumberInput) {
                            data.woo_better_shipping_number = val;
                        } else {
                            data.woo_better_shipping_number = shippingNumberInput.value;
                        }
                        window.wc.blocksCheckout.extensionCartUpdate({
                            namespace: 'woo_better_number_validation',
                            data: data
                        });
                    }
                });

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

                let billingCheckboxInputEl = document.getElementById('wc-billing-better-checkbox');
                let billingNumberInputEl = document.getElementById('billing-number');

                billingCheckboxInputEl.addEventListener('change', function () {
                    const divInputNumber = document.querySelector('.wc-better-billing-number');
                    const billingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-billing');

                    if (this.checked) {
                        billingNumberInputEl.disabled = true;
                        billingNumberInputEl.setAttribute('value', 'S/N');
                        billingNumberInputEl.value = 'S/N';
                        billingNumberInputEl.style.backgroundColor = '#e0e0e0';
                        billingNumberInputEl.style.color = '#808080';
                        if (divInputNumber) {
                            divInputNumber.classList.add('is-active');
                        }
                        if (billingErrorNumberInput) {
                            billingErrorNumberInput.style.display = 'none'
                        }
                    } else {
                        billingNumberInputEl.disabled = false;
                        billingNumberInputEl.setAttribute('value', '');
                        billingNumberInputEl.value = '';
                        billingNumberInputEl.style.backgroundColor = '';
                        billingNumberInputEl.style.color = '';
                        if (divInputNumber) {
                            divInputNumber.classList.remove('is-active');
                        }
                    }
                });

                billingNumberInputEl.addEventListener('input', function () {
                    const billingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-billing');
                    if (billingNumberInputEl) {
                        if (billingNumberInputEl.value.trim().length > 0) {
                            // Remove a restrição ao clique
                            billingErrorNumberInput.style.display = 'none'
                        } else {
                            // Adiciona novamente a restrição caso fique vazio
                            billingErrorNumberInput.style.display = 'block'
                        }
                    }
                });
            }
        }
    }
});

