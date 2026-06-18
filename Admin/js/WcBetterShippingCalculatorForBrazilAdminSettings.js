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
        function initializeDescriptionUpdater() {
            const disableShipping = document.getElementById('woo_better_calc_disabled_shipping');
            if (disableShipping) {
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
                            descBox.textContent = descriptions[selected];
                        } else {
                            descBox.textContent = '';
                        }
                    }

                    updateDescription();

                    disableShipping.addEventListener('change', updateDescription);

                    return true;
                }
            }
            return false;
        }

        const observer = new MutationObserver(function () {
            if (initializeDescriptionUpdater()) {
                observer.disconnect();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        initializeDescriptionUpdater();
    }

    function processShippingLinks() {
        const personTypeField = document.getElementById('woo_better_calc_person_type_select');
        
        if (personTypeField) {
            const container = personTypeField.closest('.forminp');
            const descSpan = container?.querySelector('.woo-forminp-header span');
            
            if (descSpan) {
                const linkText = 'Configurações de Entrega do WooCommerce';
                const currentText = descSpan.textContent || '';
                
                if (currentText.includes(linkText) && !descSpan.querySelector('a')) {
                    const shippingUrl = window.location.origin + '/wp-admin/admin.php?page=wc-settings&tab=shipping&section=options';
                    
                    const beforeLink = currentText.split(linkText)[0];
                    const afterLink = currentText.split(linkText)[1] || '';
                    
                    descSpan.innerHTML = `${beforeLink}<a href="${shippingUrl}" target="_blank" style="color: #0073aa; text-decoration: none;">${linkText}</a>${afterLink}`;
                }
            }
        }
    }

    processShippingLinks();
    
    const linkObserver = new MutationObserver(function() {
        processShippingLinks();
    });
    
    linkObserver.observe(document.body, { childList: true, subtree: true });

    // --- Controle dos checkboxes de dias + horários (Prazo de Entrega) ---
    function initDeliverySchedule() {
        const dayCheckboxes = document.querySelectorAll('.wc-better-delivery-day-checkbox');
        if (dayCheckboxes.length === 0) return;

        dayCheckboxes.forEach(function (checkbox) {
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

            toggleTimeInputs();

            checkbox.addEventListener('change', toggleTimeInputs);
        });
    }

    // --- Controle de add/remove de faixas de horário (Slots de Entrega) ---
    let slotTemplateHtml = '';

    function getSlotTemplate() {
        if (slotTemplateHtml) return slotTemplateHtml;
        const container = document.querySelector('.wc-better-delivery-slots-container');
        if (!container) return null;

        const existingRow = container.querySelector('.wc-better-delivery-slot-row');
        if (existingRow) {
            slotTemplateHtml = existingRow.cloneNode(true);
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

        addBtn.addEventListener('click', function () {
            const newRow = createRow('09:00', '11:00');
            slotsList.appendChild(newRow);
            reindexSlots();
        });
    }

    initDeliverySlots();
    initDeliverySchedule();

    const deliveryObserver = new MutationObserver(function () {
        initDeliverySchedule();
        initDeliverySlots();
    });
    deliveryObserver.observe(document.body, { childList: true, subtree: true });

    // --- Bloqueia propagação de clique nos controles da lista de pedidos ---
    const deliveryOrdersFieldset = document.querySelector('.forminp-delivery-orders fieldset');
    if (deliveryOrdersFieldset) {
        deliveryOrdersFieldset.addEventListener('click', function (e) {
            var t = e.target;
            if (t.tagName === 'INPUT' || t.tagName === 'BUTTON' ||
                (t.tagName === 'A' && t.href && t.href.indexOf('delivery_orders') !== -1)) {
                e.stopPropagation();
            }
        });
    }

    // --- Tabela client-side de pedidos com prazo de entrega ---
    initDeliveryOrdersTable();
});

/**
 * Inicializa a tabela de pedidos de entrega 100% client-side.
 * Os dados vêm do PHP via wcBetterCalcDeliveryOrders.
 */
function initDeliveryOrdersTable() {
    var data = window.wcBetterCalcDeliveryOrders;
    if (!data || !data.orders) return;

    var txt = data.texts || {};
    var perPage = data.per_page || 8;
    var serverTime = data.server_time || Math.floor(Date.now() / 1000);
    var allOrders = data.orders.slice();

    var state = {
        sort: 'asc',
        search: '',
        currentPage: 1
    };

    var searchInput = document.getElementById('delivery_orders_search');
    var searchBtn = document.getElementById('delivery_orders_search_btn');
    var clearBtn = document.getElementById('delivery_orders_clear_btn');
    var sortLink = document.getElementById('delivery_orders_sort_link');
    var container = document.getElementById('delivery-orders-table-container');

    if (!searchInput || !searchBtn || !sortLink || !container) return;

    if (txt.search_placeholder) searchInput.placeholder = txt.search_placeholder;
    if (txt.search_btn) searchBtn.textContent = txt.search_btn;
    updateSortLinkText();

    function sortOrders(orders, dir) {
        return orders.slice().sort(function(a, b) {
            var diff = a.delivery_timestamp - b.delivery_timestamp;
            return dir === 'asc' ? diff : -diff;
        });
    }

    function filterOrders(orders, term) {
        if (!term) return orders;
        var s = term.toLowerCase();
        return orders.filter(function(o) {
            return o.customer_name.toLowerCase().indexOf(s) !== -1
                || String(o.order_id).indexOf(s) !== -1;
        });
    }

    function getDeadlineInfo(deliveryTs) {
        var diffSeconds = deliveryTs - serverTime;
        if (diffSeconds < 0) return { color: '#b32d2e', label: txt.expired || 'Vencido' };
        var diffHours = diffSeconds / 3600;
        var h = Math.floor(diffHours);
        var m = Math.floor((diffSeconds % 3600) / 60);
        var label;
        if (h > 0) {
            label = m > 0 ? sprintf(txt.hours_min || '%dh %dm', h, m) : sprintf(txt.hours || '%dh', h);
        } else {
            label = sprintf(txt.minutes || '%dm', m);
        }
        if (diffHours <= 2) return { color: '#d97706', label: label };
        if (diffHours <= 24) return { color: '#ca8a04', label: label };
        var days = Math.floor(diffHours / 24);
        return { color: '#16a34a', label: sprintf(txt.days || '%dd', days) };
    }

    function renderTable() {
        var filtered = filterOrders(allOrders, state.search);
        var sorted = sortOrders(filtered, state.sort);
        var totalItems = sorted.length;
        var totalPages = Math.max(1, Math.ceil(totalItems / perPage));
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        var offset = (state.currentPage - 1) * perPage;
        var paged = sorted.slice(offset, offset + perPage);
        var html = '';

        if (totalItems === 0) {
            html += '<p class="delivery-orders-no-results">'
                + escHtml(state.search ? (txt.no_results || 'Nenhum pedido encontrado.') : (txt.no_orders || 'Nenhum pedido com prazo de entrega pendente.'))
                + '</p>';
            container.innerHTML = html;
            updateClearBtn();
            return;
        }

        html += '<p style="margin-bottom:10px;font-weight:600;">'
            + escHtml(sprintf(txt.pending_count || '%d pedido(s) pendente(s).', totalItems)) + '</p>';

        html += '<table class="widefat fixed striped" style="table-layout:auto;max-width:100%;"><thead><tr>';
        html += '<th>' + escHtml(txt.order_col || 'Pedido') + '</th>';
        html += '<th>' + escHtml(txt.customer_col || 'Cliente') + '</th>';
        html += '<th>' + escHtml(txt.date_col || 'Data de Entrega') + '</th>';
        html += '<th>' + escHtml(txt.time_col || 'Hor\u00E1rio') + '</th>';
        html += '<th>' + escHtml(txt.deadline_col || 'Prazo') + '</th>';
        html += '</tr></thead><tbody>';

        for (var i = 0; i < paged.length; i++) {
            var o = paged[i];
            var dl = getDeadlineInfo(o.delivery_timestamp);
            html += '<tr>';
            html += '<td><a href="' + escAttr(o.edit_url) + '" target="_blank">#' + o.order_id + '</a></td>';
            html += '<td>' + escHtml(o.customer_name) + '</td>';
            html += '<td>' + escHtml(o.delivery_date) + '</td>';
            html += '<td>' + escHtml(o.delivery_time_slot) + '</td>';
            html += '<td style="color:' + escAttr(dl.color) + ';font-weight:600;">' + escHtml(dl.label) + '</td>';
            html += '</tr>';
        }
        html += '</tbody></table>';

        if (totalPages > 1) {
            html += '<div id="delivery-orders-pagination" class="tablenav" style="margin-top:10px;">'
                + '<div class="tablenav-pages">'
                + '<span class="displaying-num">' + escHtml(sprintf(txt.items_count || '%d itens', totalItems)) + '</span>'
                + '<span class="pagination-links">';

            if (state.currentPage > 1) {
                html += '<a class="first-page button" href="#" data-page="1">\u00AB</a>';
                html += '<a class="prev-page button" href="#" data-page="' + (state.currentPage - 1) + '">\u2039</a>';
            } else {
                html += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">\u00AB</span>';
                html += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">\u2039</span>';
            }

            html += '<span class="paging-input"><span class="current-page">' + state.currentPage + '</span>'
                + '<span class="total-pages">/ ' + totalPages + '</span></span>';

            if (state.currentPage < totalPages) {
                html += '<a class="next-page button" href="#" data-page="' + (state.currentPage + 1) + '">\u203A</a>';
                html += '<a class="last-page button" href="#" data-page="' + totalPages + '">\u00BB</a>';
            } else {
                html += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">\u203A</span>';
                html += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">\u00BB</span>';
            }

            html += '</span></div></div>';
        }

        container.innerHTML = html;

        var pageLinks = container.querySelectorAll('#delivery-orders-pagination a[data-page]');
        for (var j = 0; j < pageLinks.length; j++) {
            pageLinks[j].addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                state.currentPage = parseInt(this.getAttribute('data-page'), 10);
                renderTable();
            });
        }

        updateClearBtn();
    }

    function updateSortLinkText() {
        sortLink.textContent = state.sort === 'asc'
            ? (txt.asc_label || '\u25B2 Mais pr\u00F3ximos')
            : (txt.desc_label || '\u25BC Mais distantes');
    }

    function updateClearBtn() {
        if (clearBtn) clearBtn.style.display = state.search ? 'inline-block' : 'none';
    }

    function doSearch() {
        state.search = searchInput.value.trim();
        state.currentPage = 1;
        renderTable();
    }

    function doClearSearch() {
        searchInput.value = '';
        state.search = '';
        state.currentPage = 1;
        renderTable();
    }

    function doToggleSort(e) {
        e.preventDefault();
        e.stopPropagation();
        state.sort = state.sort === 'asc' ? 'desc' : 'asc';
        state.currentPage = 1;
        updateSortLinkText();
        renderTable();
    }

    // Bloqueia submit do form principal quando disparado pelo bot\u00e3o de busca
    if (searchBtn.form) {
        searchBtn.form.addEventListener('submit', function(e) {
            if (e.submitter && e.submitter.id === 'delivery_orders_search_btn') {
                e.preventDefault();
                e.stopPropagation();
                doSearch();
                return false;
            }
        });
    }

    searchBtn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        doSearch();
    });

    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            doSearch();
        }
    });

    sortLink.addEventListener('click', doToggleSort);

    if (clearBtn) {
        clearBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            doClearSearch();
        });
    }

    renderTable();
}

/**
 * sprintf simplificado.
 */
function sprintf(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    return format.replace(/%[ds]/g, function() { return args.shift() || ''; });
}

/**
 * Escapa HTML para prevenir XSS.
 */
function escHtml(str) {
    if (!str) return '';
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * Escapa atributo HTML.
 */
function escAttr(str) {
    if (!str) return '';
    var map = {
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#039;',
        '<': '&lt;',
        '>': '&gt;'
    };
    return String(str).replace(/[&"'<>]/g, function(ch) { return map[ch]; });
}
