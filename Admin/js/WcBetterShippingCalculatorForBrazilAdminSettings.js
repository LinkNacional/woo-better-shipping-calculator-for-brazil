document.addEventListener('DOMContentLoaded', function () {
    // Desabilitar campos adicionais
    const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
    if (disableShipping) {
        const numberField = document.querySelectorAll('input[name="woo_better_calc_number_required"]');
        const minimumFreeShippingRadios = document.querySelectorAll('input[name="woo_better_enable_min_free_shipping"]');

        if (minimumFreeShippingRadios.length > 0) {
            const minimumFreeShippingValue = document.getElementById('woo_better_min_free_shipping_value');
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

        // Controle do rádio de Habilitar/Desabilitar Prazo de Entrega
        const enableDeliveryScheduleRadios = document.querySelectorAll('input[name="woo_better_enable_delivery_schedule"]');
        if (enableDeliveryScheduleRadios.length > 0) {
            function updateDeliveryScheduleState() {
                const selectedOption = Array.from(enableDeliveryScheduleRadios).find(radio => radio.checked)?.value;
                const deliveryScheduleTable = document.querySelector('.wc-better-delivery-schedule-table');
                if (!deliveryScheduleTable) return;

                const timeInputs = deliveryScheduleTable.querySelectorAll('input[type="time"]');
                const checkboxes = deliveryScheduleTable.querySelectorAll('.wc-better-delivery-day-checkbox');

                if (selectedOption === 'yes') {
                    deliveryScheduleTable.style.opacity = '1';
                    deliveryScheduleTable.style.pointerEvents = 'auto';
                    checkboxes.forEach(cb => {
                        cb.disabled = false;
                        cb.style.cursor = 'pointer';
                        // Reavalia estado individual dos time inputs conforme checkbox
                        cb.dispatchEvent(new Event('change', { bubbles: true }));
                    });
                    // Habilita container de slots
                    const slotsContainer = document.querySelector('.wc-better-delivery-slots-container');
                    if (slotsContainer) {
                        slotsContainer.style.opacity = '1';
                        slotsContainer.style.pointerEvents = 'auto';
                    }
                } else if (selectedOption === 'no') {
                    deliveryScheduleTable.style.opacity = '0.5';
                    deliveryScheduleTable.style.pointerEvents = 'none';
                    checkboxes.forEach(cb => {
                        cb.disabled = true;
                        cb.style.cursor = 'not-allowed';
                    });
                    timeInputs.forEach(input => {
                        input.disabled = true;
                        input.style.backgroundColor = '#f1f1f1';
                        input.style.cursor = 'not-allowed';
                    });
                    // Desabilita container de slots
                    const slotsContainer = document.querySelector('.wc-better-delivery-slots-container');
                    if (slotsContainer) {
                        slotsContainer.style.opacity = '0.5';
                        slotsContainer.style.pointerEvents = 'none';
                    }
                }
            }

            updateDeliveryScheduleState();

            enableDeliveryScheduleRadios.forEach(radio => {
                radio.addEventListener('change', updateDeliveryScheduleState);
            });
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

    // --- Controle dos checkboxes de dias + horários (Prazo de Entrega) ---
    function initDeliverySchedule() {
        const dayCheckboxes = document.querySelectorAll('.wc-better-delivery-day-checkbox');
        if (dayCheckboxes.length === 0) return;

        dayCheckboxes.forEach(function (checkbox) {
            // Já processou este checkbox?
            if (checkbox.dataset.deliveryInit === '1') return;
            checkbox.dataset.deliveryInit = '1';

            const row = checkbox.closest('.wc-better-delivery-day-row');
            if (!row) return;

            const timeStart = row.querySelector('.wc-better-delivery-time-start');
            const timeEnd   = row.querySelector('.wc-better-delivery-time-end');

            function toggleTimeInputs() {
                const isChecked = checkbox.checked;
                if (timeStart) {
                    timeStart.disabled = !isChecked;
                    timeStart.style.backgroundColor = isChecked ? '' : '#f1f1f1';
                    timeStart.style.cursor = isChecked ? '' : 'not-allowed';
                }
                if (timeEnd) {
                    timeEnd.disabled = !isChecked;
                    timeEnd.style.backgroundColor = isChecked ? '' : '#f1f1f1';
                    timeEnd.style.cursor = isChecked ? '' : 'not-allowed';
                }
            }

            // Estado inicial
            toggleTimeInputs();

            // Listener
            checkbox.addEventListener('change', toggleTimeInputs);
        });
    }

    // --- Controle de add/remove de faixas de horário (Slots de Entrega) ---
    let slotTemplateHtml = '';

    function getSlotTemplate() {
        if (slotTemplateHtml) return slotTemplateHtml;
        const container = document.querySelector('.wc-better-delivery-slots-container');
        if (!container) return null;

        // Cria um template a partir de uma row existente ou gera novo
        const existingRow = container.querySelector('.wc-better-delivery-slot-row');
        if (existingRow) {
            // Clona a primeira row como template
            slotTemplateHtml = existingRow.cloneNode(true);
            // Não salva o outerHTML direto — usamos uma função de clone
            return 'TEMPLATE_ROW';
        }
        return null;
    }

    function initDeliverySlots() {
        const container = document.querySelector('.wc-better-delivery-slots-container');
        if (!container) return;
        if (container.dataset.slotsInit === '1') return;
        container.dataset.slotsInit = '1';

        const slotsList = container.querySelector('.wc-better-delivery-slots-list');
        const addBtn = container.querySelector('.wc-better-delivery-slot-add');

        if (!slotsList || !addBtn) return;

        // Guarda o template da primeira row se existir
        const firstRow = slotsList.querySelector('.wc-better-delivery-slot-row');
        if (firstRow && !firstRow.dataset.template) {
            firstRow.dataset.template = '1';
        }

        function createRow(startVal, endVal) {
            const div = document.createElement('div');
            div.className = 'wc-better-delivery-slot-row';
            div.setAttribute('style', 'display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px;');

            const idx = slotsList.querySelectorAll('.wc-better-delivery-slot-row').length;

            const startInput = document.createElement('input');
            startInput.type = 'time';
            startInput.className = 'wc-better-delivery-slot-start';
            startInput.name = 'woo_better_delivery_slots[' + idx + '][start]';
            startInput.value = startVal || '09:00';
            startInput.setAttribute('style', 'width: 130px;');

            const span = document.createElement('span');
            span.setAttribute('style', 'white-space: nowrap;');
            span.textContent = 'às';

            const endInput = document.createElement('input');
            endInput.type = 'time';
            endInput.className = 'wc-better-delivery-slot-end';
            endInput.name = 'woo_better_delivery_slots[' + idx + '][end]';
            endInput.value = endVal || '11:00';
            endInput.setAttribute('style', 'width: 130px;');

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'button wc-better-delivery-slot-remove';
            removeBtn.title = 'Remover faixa';
            removeBtn.setAttribute('style', 'color: #b32d2e;');
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', function () {
                div.remove();
                reindexSlots();
            });

            div.appendChild(startInput);
            div.appendChild(span);
            div.appendChild(endInput);
            div.appendChild(removeBtn);

            return div;
        }

        function reindexSlots() {
            const rows = slotsList.querySelectorAll('.wc-better-delivery-slot-row');
            rows.forEach(function (row, i) {
                const start = row.querySelector('.wc-better-delivery-slot-start');
                const end   = row.querySelector('.wc-better-delivery-slot-end');
                if (start) start.name = 'woo_better_delivery_slots[' + i + '][start]';
                if (end)   end.name   = 'woo_better_delivery_slots[' + i + '][end]';
            });
        }

        // Bind remove nos botões existentes
        function bindExistingRemoves() {
            const removeBtns = slotsList.querySelectorAll('.wc-better-delivery-slot-remove');
            removeBtns.forEach(function (btn) {
                if (btn.dataset.bound === '1') return;
                btn.dataset.bound = '1';
                btn.addEventListener('click', function () {
                    btn.closest('.wc-better-delivery-slot-row').remove();
                    reindexSlots();
                });
            });
        }
        bindExistingRemoves();

        // Botão Adicionar
        addBtn.addEventListener('click', function () {
            const newRow = createRow('09:00', '11:00');
            slotsList.appendChild(newRow);
            reindexSlots();
        });
    }

    // Inicializa slots
    initDeliverySlots();

    // Inicializa imediatamente
    initDeliverySchedule();

    // Também observa mudanças no DOM (tabs dinâmicas)
    const deliveryObserver = new MutationObserver(function () {
        initDeliverySchedule();
        initDeliverySlots();
    });
    deliveryObserver.observe(document.body, { childList: true, subtree: true });
});