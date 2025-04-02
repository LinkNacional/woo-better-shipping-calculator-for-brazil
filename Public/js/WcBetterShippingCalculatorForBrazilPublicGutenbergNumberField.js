document.addEventListener("DOMContentLoaded", function () {
    let blockFound = false
    let submitFound = false
    const observer = new MutationObserver((mutationsList) => {
        const shippingBlock = document.querySelector('#shipping')

        if (shippingBlock && !blockFound) {
            blockFound = true
            const shippingName = shippingBlock.querySelector('.wc-block-components-text-input.wc-block-components-address-form__first_name')
            const editButton = document.querySelector('span.wc-block-components-address-card__edit[aria-controls="shipping"]');

            if (editButton.getAttribute('aria-expanded') != true) {
                editButton.click()
            }

            if (shippingName) {
                // Criando o checkbox clonado e personalizado
                const clonedCheckbox = document.createElement('div');
                clonedCheckbox.className = 'wc-block-components-checkbox wc-block-checkout__use-address-for-billing wc-better';

                // Criando a label
                const checkboxLabel = document.createElement('label');
                checkboxLabel.setAttribute('for', 'wc-better-checkbox');

                // Criando o input checkbox
                const checkboxInput = document.createElement('input');
                checkboxInput.id = 'wc-better-checkbox';
                checkboxInput.className = 'wc-block-components-checkbox__input';
                checkboxInput.type = 'checkbox';
                checkboxInput.setAttribute('aria-invalid', 'false');

                // Criando o SVG do checkmark
                const checkboxSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                checkboxSvg.setAttribute('class', 'wc-block-components-checkbox__mark');
                checkboxSvg.setAttribute('aria-hidden', 'true');
                checkboxSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                checkboxSvg.setAttribute('viewBox', '0 0 24 20');

                // Criando o caminho do checkmark dentro do SVG
                const checkboxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                checkboxPath.setAttribute('d', 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');

                // Adicionando o path ao SVG
                checkboxSvg.appendChild(checkboxPath);

                // Criando o texto da label
                const checkboxText = document.createElement('span');
                checkboxText.className = 'wc-block-components-checkbox__label';
                checkboxText.textContent = 'Sem número (S/N)';

                // Montando a estrutura
                checkboxLabel.appendChild(checkboxInput);
                checkboxLabel.appendChild(checkboxSvg);
                checkboxLabel.appendChild(checkboxText);
                clonedCheckbox.appendChild(checkboxLabel);

                // Adiciona o checkbox antes do input clonado
                shippingBlock.appendChild(clonedCheckbox);

                // Agora clona o input como antes
                const clonedElement = shippingName.cloneNode(true);
                clonedElement.className = 'wc-block-components-text-input wc-block-components-address-form__number is-active';

                const input = clonedElement.querySelector('input');
                if (input) {
                    input.id = 'shipping-number';
                    input.setAttribute('autocomplete', 'give-number');
                    input.setAttribute('aria-label', 'Number');
                    input.value = '';
                }

                const label = clonedElement.querySelector('label');
                if (label) {
                    label.textContent = 'Número';
                    label.setAttribute('for', 'shipping-number');
                }

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
                clonedElement.appendChild(errorDiv);

                // Adiciona o input clonado depois do checkbox
                shippingBlock.appendChild(clonedElement);
            }
        }

        const placeOrderContainer = document.querySelector('.wc-block-checkout__actions_row')

        if (placeOrderContainer && !submitFound) {
            submitFound = true
            const placeOrderButton = placeOrderContainer.querySelector('.wc-block-components-button.wp-element-button.wc-block-components-checkout-place-order-button');
            const shippingNumberInput = document.getElementById('shipping-number');
            const shippingCheckboxInput = document.getElementById('wc-better-checkbox')
            const shippingErrorNumberInput = document.querySelector('.wc-block-components-validation-error.wc-better-shipping');

            shippingCheckboxInput.addEventListener('change', function () {
                if (this.checked) {
                    shippingNumberInput.disabled = true;
                    shippingNumberInput.value = 'S/N';
                    shippingNumberInput.style.backgroundColor = '#e0e0e0';
                    shippingNumberInput.style.color = '#808080';
                } else {
                    shippingNumberInput.disabled = false;
                    shippingNumberInput.value = '';
                    shippingNumberInput.style.backgroundColor = '';
                    shippingNumberInput.style.color = '';
                }
            });

            if (shippingNumberInput && placeOrderButton && shippingErrorNumberInput) {
                // Função para verificar se o input está vazio e bloquear o evento
                function handlePlaceOrderClick(event) {
                    if (!shippingNumberInput.value.trim().length) {
                        event.stopPropagation(); // Bloqueia a propagação se estiver vazio
                        event.preventDefault(); // Previne o envio do formulário
                        shippingErrorNumberInput.style.display = 'block'

                        shippingNumberInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }

                // Adiciona o evento de clique inicialmente para bloquear se necessário
                placeOrderButton.addEventListener('click', handlePlaceOrderClick);

                // Evento de input para monitorar mudanças no campo
                shippingNumberInput.addEventListener('input', function () {
                    if (shippingNumberInput.value.trim().length > 0) {
                        // Remove a restrição ao clique
                        placeOrderButton.removeEventListener('click', handlePlaceOrderClick);
                        shippingErrorNumberInput.style.display = 'none'
                    } else {
                        // Adiciona novamente a restrição caso fique vazio
                        shippingErrorNumberInput.style.display = 'block'
                        placeOrderButton.addEventListener('click', handlePlaceOrderClick);
                    }
                });
            }
        }

        if (blockFound && submitFound) {
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

                            const billingCheck = document.getElementById('checkbox-control-0')

                            if (billingCheck) {
                                if (billingCheck.checked) {
                                    if (body?.billing_address?.address_1) {
                                        body.billing_address.address_1 += ` - ${shippingNumber}`;
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
            observer.disconnect()
        }
    });

    // Configuração do observer para observar mudanças no corpo do documento
    observer.observe(document.body, { childList: true, subtree: true });

    // Definir um tempo limite de 5 segundos para parar o observer se não encontrar o elemento
    setTimeout(() => {
        observer.disconnect();
    }, 10000);
});