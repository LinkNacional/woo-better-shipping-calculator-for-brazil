document.addEventListener('DOMContentLoaded', function () {
    // Desabilitar campos adicionais
    const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
    if (disableShipping) {
        const numberField = document.querySelectorAll('input[name="woo_better_calc_number_required"]');
        const minimumFreeShippingRadios = document.querySelectorAll('input[name="woo_better_enable_min_free_shipping"]');

        if (minimumFreeShippingRadios.length > 0) {
            const minimumFreeShippingValue = document.getElementById('woo_better_min_free_shipping_value');
            const minimumFreeShippingCalcBase = document.getElementById('woo_better_free_shipping_calc_base');
            const minimumFreeShippingMessage = document.getElementById('woo_better_min_free_shipping_message');
            const minimumFreeShippingSuccessMessage = document.getElementById('woo_better_min_free_shipping_success_message');
            
            if (minimumFreeShippingValue) {
                function updateMinimumFreeShippingValue() {
                    const selectedOption = Array.from(minimumFreeShippingRadios).find(radio => radio.checked)?.value;

                    // Campos adicionais que dependem do woo_better_enable_min_free_shipping
                    const onlyFreeShippingRadios = document.querySelectorAll('input[name="woo_better_only_free_shipping"]');
                    const avoidDuplicationRadios = document.querySelectorAll('input[name="woo_better_avoid_free_shipping_duplication"]');
                    const progressBarRadios = document.querySelectorAll('input[name="woo_better_enable_progress_bar_value"]');

                    if (selectedOption === 'yes') {
                        minimumFreeShippingValue.readOnly = false;
                        minimumFreeShippingValue.style.backgroundColor = '';
                        minimumFreeShippingValue.style.cursor = '';
                        
                        // Habilita o select de base de cálculo
                        if (minimumFreeShippingCalcBase) {
                            minimumFreeShippingCalcBase.disabled = false;
                            minimumFreeShippingCalcBase.style.backgroundColor = '';
                            minimumFreeShippingCalcBase.style.cursor = '';
                        }
                        
                        // Habilita os campos de mensagem
                        if (minimumFreeShippingMessage) {
                            minimumFreeShippingMessage.readOnly = false;
                            minimumFreeShippingMessage.style.backgroundColor = '';
                            minimumFreeShippingMessage.style.cursor = '';
                        }
                        if (minimumFreeShippingSuccessMessage) {
                            minimumFreeShippingSuccessMessage.readOnly = false;
                            minimumFreeShippingSuccessMessage.style.backgroundColor = '';
                            minimumFreeShippingSuccessMessage.style.cursor = '';
                        }

                        // Habilita os campos de rádio dependentes
                        onlyFreeShippingRadios.forEach(radio => {
                            radio.disabled = false;
                            radio.style.cursor = '';
                        });

                        avoidDuplicationRadios.forEach(radio => {
                            radio.disabled = false;
                            radio.style.cursor = '';
                        });

                        progressBarRadios.forEach(radio => {
                            radio.disabled = false;
                            radio.style.cursor = '';
                        });

                    } else if (selectedOption === 'no') {
                        minimumFreeShippingValue.value = 0;
                        minimumFreeShippingValue.readOnly = true;
                        minimumFreeShippingValue.style.backgroundColor = '#f1f1f1';
                        minimumFreeShippingValue.style.cursor = 'not-allowed';
                        
                        // Desabilita o select de base de cálculo e reseta para subtotal
                        if (minimumFreeShippingCalcBase) {
                            minimumFreeShippingCalcBase.value = 'subtotal';
                            minimumFreeShippingCalcBase.disabled = true;
                            minimumFreeShippingCalcBase.style.backgroundColor = '#f1f1f1';
                            minimumFreeShippingCalcBase.style.cursor = 'not-allowed';
                        }
                        
                        // Desabilita os campos de mensagem
                        if (minimumFreeShippingMessage) {
                            minimumFreeShippingMessage.readOnly = true;
                            minimumFreeShippingMessage.style.backgroundColor = '#f1f1f1';
                            minimumFreeShippingMessage.style.cursor = 'not-allowed';
                        }
                        if (minimumFreeShippingSuccessMessage) {
                            minimumFreeShippingSuccessMessage.readOnly = true;
                            minimumFreeShippingSuccessMessage.style.backgroundColor = '#f1f1f1';
                            minimumFreeShippingSuccessMessage.style.cursor = 'not-allowed';
                        }

                        // Desabilita os campos de rádio dependentes e marca 'no'
                        onlyFreeShippingRadios.forEach(radio => {
                            if (radio.value === 'no') {
                                radio.click();
                                radio.checked = true;
                            } else if (radio.value === 'yes') {
                                radio.checked = false;
                            }
                            radio.disabled = true;
                            radio.style.cursor = 'not-allowed';
                        });

                        avoidDuplicationRadios.forEach(radio => {
                            if (radio.value === 'no') {
                                radio.click();
                                radio.checked = true;
                            } else if (radio.value === 'yes') {
                                radio.checked = false;
                            }
                            radio.disabled = true;
                            radio.style.cursor = 'not-allowed';
                        });

                        progressBarRadios.forEach(radio => {
                            if (radio.value === 'no') {
                                radio.click();
                                radio.checked = true;
                            } else if (radio.value === 'yes') {
                                radio.checked = false;
                            }
                            radio.disabled = true;
                            radio.style.cursor = 'not-allowed';
                        });
                    }
                }

                // Atualiza o estado inicial com base na seleção atual
                updateMinimumFreeShippingValue();

                // Adiciona o evento de mudança para cada botão de rádio
                minimumFreeShippingRadios.forEach(radio => {
                    radio.addEventListener('change', updateMinimumFreeShippingValue);
                });
            }
        }

        function handleDisableShippingChange() {
            if (disableShipping.value === 'all') {
                if (numberField) {
                    numberField.forEach(radio => {
                        radio.disabled = true;
                        radio.style.cursor = 'not-allowed';

                        if (radio.value === 'no') {
                            radio.checked = true;
                        } else if (radio.value === 'yes') {
                            radio.checked = false;
                        }
                    });
                }

            } else {
                enableAllFields(); // Habilita os campos antes de aplicar a lógica adicional
            }
        }



        // Função para habilitar todos os campos
        function enableAllFields() {
            if (numberField) {
                numberField.forEach(radio => {
                    radio.disabled = false;
                    radio.style.cursor = '';
                });
            }
        }

        // Adiciona o evento change ao select "disableShipping"
        if (disableShipping) {
            handleDisableShippingChange();

            disableShipping.addEventListener('change', function () {
                handleDisableShippingChange();
            });
        }
    }

    // Mensagem no footer
    const saveButton = document.querySelector('p.submit');
    if (saveButton) {
        const div = document.createElement('div');
        div.innerHTML = `
            <p>
                <strong>Próximas funcionalidades:</strong> Gerador de etiqueta, Shortcode cálculo de CEP, Ratreio de pedido e muitos mais. <a href="https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/issues/new">Participe envie sua sugestão</a>.<br>
                Quer conhecer mais sobre nossos plugins? Suporte WordPress 24h:
                <a href="https://www.linknacional.com.br/wordpress" target="_blank">Link Nacional</a>
                | Avalie nosso plugin
                <a href="https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews" target="_blank">★★★★★</a>.
            </p>
        `;
        // Inserir abaixo do <p class="submit">
        saveButton.insertAdjacentElement('afterend', div);
    }

    if (disableShipping) {
        // Seleciona o <p> com a classe 'description' associado ao campo
        function initializeDescriptionUpdater() {
            const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
            if (disableShipping) {
                // Seleciona o <p> com a classe 'description' associado ao campo
                const descBox = disableShipping.closest('.forminp')?.querySelector('p.description');
                if (descBox) {
                    const descriptions = {
                        all: 'Todos os métodos de entrega e campos de endereço serão desabilitados.',
                        digital: 'Entrega será desabilitada apenas se o carrinho tiver somente produtos digitais.',
                        default: 'Entrega dinâmica será mantida conforme o padrão do Woocommerce.'
                    };

                    function updateDescription() {
                        const selected = disableShipping.value;
                        if (descriptions[selected]) {
                            descBox.textContent = descriptions[selected]; // Atualiza o texto do <p>
                        } else {
                            descBox.textContent = ''; // Limpa o texto se não houver descrição
                        }
                    }

                    // Atualiza a descrição na carga inicial da página
                    updateDescription();

                    // Atualiza a descrição ao mudar o valor do campo
                    disableShipping.addEventListener('change', updateDescription);

                    // Retorna true para indicar que a inicialização foi concluída
                    return true;
                }
            }
            return false; // Retorna false se o componente ainda não estiver disponível
        }

        // Configura o MutationObserver para observar mudanças no DOM
        const observer = new MutationObserver(function () {
            if (initializeDescriptionUpdater()) {
                // Se a inicialização for bem-sucedida, desconecta o observer
                observer.disconnect();
            }
        });

        // Inicia o observer para observar mudanças no body
        observer.observe(document.body, { childList: true, subtree: true });

        // Tenta inicializar imediatamente caso o componente já esteja disponível
        initializeDescriptionUpdater();
    }

    // Função para processar links em campos específicos
    function processShippingLinks() {
        // Procura especificamente pelo campo person_type_select
        const personTypeField = document.getElementById('woo_better_calc_person_type_select');
        
        if (personTypeField) {
            const container = personTypeField.closest('.forminp');
            const descSpan = container?.querySelector('.woo-forminp-header span');
            
            if (descSpan) {
                const linkText = 'Configurações de Entrega do WooCommerce';
                const currentText = descSpan.textContent || '';
                
                if (currentText.includes(linkText) && !descSpan.querySelector('a')) {
                    // Cria a URL dinamicamente
                    const shippingUrl = window.location.origin + '/wp-admin/admin.php?page=wc-settings&tab=shipping&section=options';
                    
                    const beforeLink = currentText.split(linkText)[0];
                    const afterLink = currentText.split(linkText)[1] || '';
                    
                    descSpan.innerHTML = `${beforeLink}<a href="${shippingUrl}" target="_blank" style="color: #0073aa; text-decoration: none;">${linkText}</a>${afterLink}`;
                }
            }
        }
    }

    // Processa os links quando o DOM está carregado
    processShippingLinks();
    
    // Também processa após mudanças no DOM (caso o campo seja carregado dinamicamente)
    const linkObserver = new MutationObserver(function() {
        processShippingLinks();
    });
    
    linkObserver.observe(document.body, { childList: true, subtree: true });

    // ── Dependência: Data de Nascimento → Obrigatoriedade ──────────────────
    const birthdateFieldRadios = document.querySelectorAll('input[name="woo_better_calc_enable_birthdate_field"]');
    const birthdateRequiredRadios = document.querySelectorAll('input[name="woo_better_calc_birthdate_required"]');

    function lockClickHandler(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function updateBirthdateRequiredState() {
        if (!birthdateRequiredRadios.length) return;
        const selectedValue = Array.from(birthdateFieldRadios).find(r => r.checked)?.value;
        const isLocked = (selectedValue === 'no');

        birthdateRequiredRadios.forEach(radio => {
            // Visual: parece desabilitado mas sem usar o atributo disabled (que exclui do POST)
            radio.style.opacity = isLocked ? '0.6' : '';
            radio.style.pointerEvents = isLocked ? 'none' : '';
            radio.style.cursor = isLocked ? 'not-allowed' : '';

            // Bloqueia clique e força valor 'no' quando está lockado
            if (isLocked) {
                radio.checked = (radio.value === 'no');
                radio.addEventListener('click', lockClickHandler, true);
            } else {
                radio.removeEventListener('click', lockClickHandler, true);
            }
        });
    }

    if (birthdateFieldRadios.length && birthdateRequiredRadios.length) {
        birthdateFieldRadios.forEach(radio => {
            radio.addEventListener('change', updateBirthdateRequiredState);
        });
        updateBirthdateRequiredState(); // estado inicial
    }
});