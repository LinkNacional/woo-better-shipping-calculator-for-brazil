/**
 * Widgets "Prazo de Entrega" e "Pedidos Pendentes" do admin.
 *
 * Handles:
 * - Enable/disable delivery schedule toggle (radio yes/no)
 * - Day checkbox → enable/disable time inputs
 * - Add/remove delivery slots
 * - Sync hidden JSON fields on changes
 * - Tabela de pedidos pendentes (preenchida só quando o PRO localiza os dados)
 *
 * A interface é compartilhada com a versão PRO (que também é dona da lógica);
 * no plugin gratuito os valores não são salvos — quem garante isso é o
 * `WcBetterShippingCalculatorForBrazilAdminProGate` no servidor.
 */
(function () {
    const PREFIX = 'woo_better_';

    // ── Utility: "desabilitado" apenas VISUAL (AGENTS.md § 7) ──
    // O atributo `disabled` exclui o campo do POST; o WooCommerce então MANTÉM o
    // valor antigo salvo e a tela passa a divergir do banco.
    function setFakeDisabled(elements, isDisabled) {
        const list = elements.nodeType === 1 ? [elements] : elements;

        Array.prototype.forEach.call(list, function (element) {
            if (!element) return;

            if (window.wcBetterFakeDisabled) {
                window.wcBetterFakeDisabled(element, isDisabled);
                return;
            }

            element.removeAttribute('disabled');
            element.disabled = false;
            element.style.opacity = isDisabled ? '0.6' : '';
            element.style.cursor = isDisabled ? 'not-allowed' : '';
        });
    }

    // ── Utility: sync schedule table to hidden JSON field ──
    function syncScheduleJSON() {
        const jsonField = document.querySelector('.wc-better-pro-delivery-schedule-json');
        if (!jsonField) return;

        const schedule = {};
        const rows = document.querySelectorAll('.wc-better-pro-delivery-day-row');
        rows.forEach(function (row) {
            const day = row.getAttribute('data-day');
            const checkbox = row.querySelector('.wc-better-pro-delivery-day-checkbox');
            const startInput = row.querySelector('.wc-better-pro-delivery-time-start');
            const endInput = row.querySelector('.wc-better-pro-delivery-time-end');

            schedule[day] = {
                active: checkbox ? checkbox.checked : false,
                start: startInput ? startInput.value : '08:00',
                end: endInput ? endInput.value : '18:00'
            };
        });

        jsonField.value = JSON.stringify(schedule);
    }

    // ── Utility: sync slots list to hidden JSON field ──
    function syncSlotsJSON() {
        const jsonField = document.querySelector('.wc-better-pro-delivery-slots-json');
        if (!jsonField) return;

        const slots = [];
        const rows = document.querySelectorAll('.wc-better-pro-delivery-slot-row');
        rows.forEach(function (row) {
            const startInput = row.querySelector('.wc-better-pro-delivery-slot-start');
            const endInput = row.querySelector('.wc-better-pro-delivery-slot-end');
            if (startInput && endInput) {
                slots.push([startInput.value, endInput.value]);
            }
        });

        jsonField.value = JSON.stringify(slots);
    }

    // ── 1. Enable/Disable delivery schedule toggle ──
    function initDeliveryScheduleToggle() {
        const radios = document.querySelectorAll('input[name="' + PREFIX + 'enable_delivery_schedule"]');
        if (radios.length === 0) return;

        function toggleState() {
            const selected = Array.from(radios).find(function (r) { return r.checked; });
            const isEnabled = selected && selected.value === 'yes';

            const scheduleTable = document.querySelector('.wc-better-pro-delivery-schedule-table');
            const slotsContainer = document.querySelector('.wc-better-pro-delivery-slots-container');

            if (scheduleTable) {
                if (isEnabled) {
                    scheduleTable.style.opacity = '1';
                    scheduleTable.style.pointerEvents = 'auto';
                } else {
                    scheduleTable.style.opacity = '0.5';
                    scheduleTable.style.pointerEvents = 'none';
                }
            }

            if (slotsContainer) {
                if (isEnabled) {
                    slotsContainer.style.opacity = '1';
                    slotsContainer.style.pointerEvents = 'auto';
                } else {
                    slotsContainer.style.opacity = '0.5';
                    slotsContainer.style.pointerEvents = 'none';
                }
            }

            // Enable/disable checkboxes and time inputs. Os checkboxes/horários
            // NÃO têm `name` (o valor vive no hidden JSON, lido pelo JS), então o
            // `disabled` real aqui não perde dado no submit.
            if (scheduleTable) {
                const checkboxes = scheduleTable.querySelectorAll('.wc-better-pro-delivery-day-checkbox');
                const timeInputs = scheduleTable.querySelectorAll('input[type="time"]');

                checkboxes.forEach(function (cb) {
                    cb.disabled = !isEnabled;
                    if (!isEnabled) {
                        cb.style.cursor = 'not-allowed';
                    } else {
                        cb.style.cursor = 'pointer';
                        // Re-trigger per-checkbox state
                        cb.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                });

                if (!isEnabled) {
                    timeInputs.forEach(function (input) {
                        input.disabled = true;
                        input.style.backgroundColor = '#f1f1f1';
                        input.style.cursor = 'not-allowed';
                    });
                }
            }

            // Dependent fields: min preparation hours + ignore local pickup. Estes
            // SÃO opções do banco (têm `name`) → "desabilitado" só visual.
            const prepInput = document.getElementById(PREFIX + 'min_preparation_hours');
            if (prepInput) {
                setFakeDisabled(prepInput, !isEnabled);
            }

            const ignoreRadios = document.querySelectorAll('input[name="' + PREFIX + 'ignore_local_pickup"]');
            setFakeDisabled(ignoreRadios, !isEnabled);
        }

        toggleState();

        radios.forEach(function (radio) {
            radio.addEventListener('change', toggleState);
        });
    }

    // ── 2. Day checkbox → enable/disable time inputs ──
    function initDeliveryScheduleDays() {
        const checkboxes = document.querySelectorAll('.wc-better-pro-delivery-day-checkbox');
        if (checkboxes.length === 0) return;

        checkboxes.forEach(function (checkbox) {
            if (checkbox.dataset.deliveryInit === '1') return;
            checkbox.dataset.deliveryInit = '1';

            const row = checkbox.closest('.wc-better-pro-delivery-day-row');
            if (!row) return;

            const timeStart = row.querySelector('.wc-better-pro-delivery-time-start');
            const timeEnd = row.querySelector('.wc-better-pro-delivery-time-end');

            function toggleTimeInputs() {
                const isChecked = checkbox.checked;
                // Os horários NÃO têm `name`: o valor é lido pelo `syncScheduleJSON()`,
                // então o `disabled` real não perde dado no submit (diferente dos
                // campos de opção, que precisam ficar habilitados — AGENTS.md § 7).
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
                syncScheduleJSON();
            }

            toggleTimeInputs();

            checkbox.addEventListener('change', toggleTimeInputs);
        });

        // Sync on time input changes too
        const timeInputs = document.querySelectorAll('.wc-better-pro-delivery-time-start, .wc-better-pro-delivery-time-end');
        timeInputs.forEach(function (input) {
            if (input.dataset.timeSyncInit === '1') return;
            input.dataset.timeSyncInit = '1';
            input.addEventListener('change', syncScheduleJSON);
        });
    }

    // ── 3. Add/Remove delivery slots ──
    function initDeliverySlots() {
        const container = document.querySelector('.wc-better-pro-delivery-slots-container');
        if (!container) return;
        if (container.dataset.slotsInit === '1') return;
        container.dataset.slotsInit = '1';

        const slotsList = container.querySelector('.wc-better-pro-delivery-slots-list');
        const addBtn = container.querySelector('.wc-better-pro-delivery-slot-add');

        if (!slotsList || !addBtn) return;

        function createRow(startVal, endVal) {
            const div = document.createElement('div');
            div.className = 'wc-better-pro-delivery-slot-row';
            div.setAttribute('style', 'display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px;');

            const startInput = document.createElement('input');
            startInput.type = 'time';
            startInput.className = 'wc-better-pro-delivery-slot-start';
            startInput.value = startVal || '09:00';
            startInput.setAttribute('style', 'width: 130px;');
            startInput.addEventListener('change', syncSlotsJSON);

            const span = document.createElement('span');
            span.setAttribute('style', 'white-space: nowrap;');
            span.textContent = 'às';

            const endInput = document.createElement('input');
            endInput.type = 'time';
            endInput.className = 'wc-better-pro-delivery-slot-end';
            endInput.value = endVal || '11:00';
            endInput.setAttribute('style', 'width: 130px;');
            endInput.addEventListener('change', syncSlotsJSON);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button';
            removeBtn.className = 'button wc-better-pro-delivery-slot-remove';
            removeBtn.title = 'Remover faixa';
            removeBtn.setAttribute('style', 'color: #b32d2e;');
            removeBtn.innerHTML = '&times;';
            removeBtn.addEventListener('click', function () {
                div.remove();
                syncSlotsJSON();
            });

            div.appendChild(startInput);
            div.appendChild(span);
            div.appendChild(endInput);
            div.appendChild(removeBtn);

            return div;
        }

        function bindExistingRemoves() {
            const removeBtns = slotsList.querySelectorAll('.wc-better-pro-delivery-slot-remove');
            removeBtns.forEach(function (btn) {
                if (btn.dataset.bound === '1') return;
                btn.dataset.bound = '1';
                btn.addEventListener('click', function () {
                    btn.closest('.wc-better-pro-delivery-slot-row').remove();
                    syncSlotsJSON();
                });
            });
        }
        bindExistingRemoves();

        // Bind change events on existing time inputs
        const existingTimeInputs = slotsList.querySelectorAll('.wc-better-pro-delivery-slot-start, .wc-better-pro-delivery-slot-end');
        existingTimeInputs.forEach(function (input) {
            if (input.dataset.slotSync === '1') return;
            input.dataset.slotSync = '1';
            input.addEventListener('change', syncSlotsJSON);
        });

        addBtn.addEventListener('click', function () {
            const newRow = createRow('09:00', '11:00');
            slotsList.appendChild(newRow);
            syncSlotsJSON();
        });
    }

    // ── Init all ──
    function initAll() {
        initDeliveryScheduleToggle();
        initDeliveryScheduleDays();
        initDeliverySlots();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }

    // Re-init on MutationObserver for dynamic content
    const observer = new MutationObserver(function () {
        initDeliveryScheduleDays();
        initDeliverySlots();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // ── Delivery Orders Table ─────────────────────────────────────────────
    // Os dados são publicados pelo plugin PRO (`window.wooBetterDeliveryOrders`).
    // Sem eles (plugin gratuito, ou falha ao publicar), a barra de busca e o
    // link de ordenação não teriam handler/handler nenhum — escondemos a barra
    // em vez de deixar controles vazios (o link ficava com `href="#"` e sem texto).
    var ordersData = window.wooBetterDeliveryOrders;
    if (ordersData && ordersData.orders) {
        initDeliveryOrdersTable();
    } else {
        hideDeliveryOrdersToolbar();
    }

    function hideDeliveryOrdersToolbar() {
        var toolbars = document.querySelectorAll('.wc-better-pro-delivery-orders-toolbar');
        for (var i = 0; i < toolbars.length; i++) {
            toolbars[i].hidden = true;
        }
    }

    function initDeliveryOrdersTable() {
        var data = window.wooBetterDeliveryOrders;
        if (!data || !data.orders) return;

        var txt = data.texts || {};
        var perPage = data.per_page || 8;
        var serverTime = data.server_time || Math.floor(Date.now() / 1000);
        var allOrders = data.orders.slice();
        var state = { sort: 'asc', search: '', currentPage: 1 };

        var searchInput = document.getElementById('delivery_orders_search');
        var searchBtn = document.getElementById('delivery_orders_search_btn');
        var clearBtn = document.getElementById('delivery_orders_clear_btn');
        var sortLink = document.getElementById('delivery_orders_sort_link');
        var container = document.getElementById('delivery-orders-table-container');
        if (!searchInput || !searchBtn || !sortLink || !container) return;

        if (txt.search_placeholder) searchInput.placeholder = txt.search_placeholder;
        if (txt.search_btn) searchBtn.textContent = txt.search_btn;
        updateSortLabel();

        function updateSortLabel() {
            sortLink.textContent = state.sort === 'asc'
                ? (txt.asc_label || 'Mais próximos')
                : (txt.desc_label || 'Mais distantes');
        }

        function sortOrders(o, dir) {
            return o.slice().sort(function (a, b) { var d = a.delivery_timestamp - b.delivery_timestamp; return dir === 'asc' ? d : -d; });
        }

        function filterOrders(o, term) {
            if (!term) return o;
            var s = term.toLowerCase();
            return o.filter(function (x) { return x.customer_name.toLowerCase().indexOf(s) !== -1 || String(x.order_id).indexOf(s) !== -1; });
        }

        function getDeadlineInfo(ts) {
            var diff = ts - serverTime;
            if (diff < 0) return { color: '#b32d2e', label: txt.expired || 'Vencido' };
            var h = Math.floor(diff / 3600);
            var m = Math.floor((diff % 3600) / 60);
            var label = h > 0 ? (m > 0 ? h + 'h ' + m + 'm' : h + 'h') : m + 'm';
            if (h <= 2) return { color: '#d97706', label: label };
            if (h <= 24) return { color: '#ca8a04', label: label };
            return { color: '#16a34a', label: Math.floor(h / 24) + 'd' };
        }

        function render() {
            var f = filterOrders(allOrders, state.search);
            var s = sortOrders(f, state.sort);
            var total = s.length;
            var pages = Math.max(1, Math.ceil(total / perPage));
            if (state.currentPage > pages) state.currentPage = pages;
            var offset = (state.currentPage - 1) * perPage;
            var paged = s.slice(offset, offset + perPage);
            var h = '';

            if (total === 0) {
                h = '<p class="delivery-orders-no-results">' + (state.search ? (txt.no_results || 'Nenhum pedido encontrado.') : (txt.no_orders || 'Nenhum pedido com prazo de entrega pendente.')) + '</p>';
                container.innerHTML = h;
                if (clearBtn) clearBtn.style.display = state.search ? 'inline-block' : 'none';
                return;
            }

            h += '<p style="margin-bottom:10px;font-weight:600;">' + total + ' pedido(s) pendente(s).</p>';
            h += '<table class="widefat fixed striped"><thead><tr>';
            h += '<th>' + (txt.order_col || 'Pedido') + '</th><th>' + (txt.customer_col || 'Cliente') + '</th><th>' + (txt.date_col || 'Data de Entrega') + '</th><th>' + (txt.time_col || 'Horário') + '</th><th>' + (txt.deadline_col || 'Prazo') + '</th>';
            h += '</tr></thead><tbody>';

            for (var i = 0; i < paged.length; i++) {
                var o = paged[i], dl = getDeadlineInfo(o.delivery_timestamp);
                h += '<tr><td><a href="' + o.edit_url + '" target="_blank">#' + o.order_id + '</a></td>';
                h += '<td>' + o.customer_name + '</td><td>' + o.delivery_date + '</td><td>' + o.delivery_time_slot + '</td>';
                h += '<td style="color:' + dl.color + ';font-weight:600;">' + dl.label + '</td></tr>';
            }
            h += '</tbody></table>';

            if (pages > 1) {
                h += '<div id="delivery-orders-pagination" class="tablenav"><div class="tablenav-pages">';
                h += '<span class="displaying-num">' + total + ' itens</span><span class="pagination-links">';
                if (state.currentPage > 1) { h += '<a class="first-page button" href="#" data-page="1">&laquo;</a><a class="prev-page button" href="#" data-page="' + (state.currentPage - 1) + '">&lsaquo;</a>'; }
                else { h += '<span class="button disabled">&laquo;</span><span class="button disabled">&lsaquo;</span>'; }
                h += '<span class="paging-input">' + state.currentPage + ' / ' + pages + '</span>';
                if (state.currentPage < pages) { h += '<a class="next-page button" href="#" data-page="' + (state.currentPage + 1) + '">&rsaquo;</a><a class="last-page button" href="#" data-page="' + pages + '">&raquo;</a>'; }
                else { h += '<span class="button disabled">&rsaquo;</span><span class="button disabled">&raquo;</span>'; }
                h += '</span></div></div>';
            }
            container.innerHTML = h;

            var links = container.querySelectorAll('#delivery-orders-pagination a[data-page]');
            for (var j = 0; j < links.length; j++) {
                links[j].addEventListener('click', function (e) { e.preventDefault(); state.currentPage = parseInt(this.getAttribute('data-page'), 10); render(); });
            }
            if (clearBtn) clearBtn.style.display = state.search ? 'inline-block' : 'none';
        }

        searchBtn.addEventListener('click', function (e) { e.preventDefault(); state.search = searchInput.value.trim(); state.currentPage = 1; render(); });
        if (clearBtn) clearBtn.addEventListener('click', function (e) { e.preventDefault(); searchInput.value = ''; state.search = ''; state.currentPage = 1; render(); });
        sortLink.addEventListener('click', function (e) { e.preventDefault(); state.sort = state.sort === 'asc' ? 'desc' : 'asc'; state.currentPage = 1; updateSortLabel(); render(); });
        searchInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); state.search = searchInput.value.trim(); state.currentPage = 1; render(); } });
        render();
    }
})();
