jQuery(function ($) {
    // Objeto global para rastrear instâncias ativas do CepAddressFetcher
    var activeCepFetchers = {};
    // Flag global para controlar processamento do observer
    var isProcessingAddressUpdate = false;

    // Função para desabilitar checkbox e label
    function disableCheckboxAndLabel(type) {
        var checkboxId = 'wc-better-checkbox-' + type;
        var $checkboxInput = $('#' + checkboxId);
        var $checkboxLabel = $checkboxInput.closest('label');
        $checkboxInput.prop('disabled', true).addClass('wc-better-checkbox-disabled').prop('checked', false);
        $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
    }

    // Se a variável global não permitir, não executa NENHUMA lógica do checkbox
    var enableCheckbox = true;
    if (typeof wc_better_checkout_vars !== 'undefined' && wc_better_checkout_vars.fill_checkout_address === 'no') {
        enableCheckbox = false;
    }

    function insertCustomCheckboxBelowPostcode(type) {
        if (!enableCheckbox) return; // Não insere o checkbox se não permitido
        var $postcodeInput = $('#' + type + '-postcode');
        if ($postcodeInput.length === 0) return;
        var $parentDiv = $postcodeInput.parent();
        var checkboxId = 'wc-better-checkbox-' + type;
        var $existingCheckbox = $('#' + checkboxId).closest('.wc-block-components-checkbox');
        if ($existingCheckbox.length) {
            // Se já existe, verifica se está logo abaixo do CEP
            if (!$postcodeInput.parent().next().is($existingCheckbox)) {
                $existingCheckbox.insertAfter($postcodeInput.parent());
            }
            // Sempre desabilita ao inserir novo endereço
            disableCheckboxAndLabel(type);
            return;
        }
        var $clonedCheckbox = $('<div>', {
            class: 'wc-block-components-checkbox wc-block-checkout__use-address-for-shipping wc-better'
        });
        var $checkboxLabel = $('<label>', { for: checkboxId });
        var $checkboxInput = $('<input>', {
            id: checkboxId,
            class: 'wc-block-components-checkbox__input wc-better-checkbox-disabled',
            type: 'checkbox',
            'aria-invalid': 'false',
            checked: false,
            disabled: true
        });
        var $checkboxSvg = $(
            '<svg class="wc-block-components-checkbox__mark" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 20"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path></svg>'
        );
        var $checkboxText = $('<span>', {
            class: 'wc-block-components-checkbox__label',
            text: 'Informe acima o código postal (CEP)'
        });
        $checkboxLabel.append($checkboxInput, $checkboxSvg, $checkboxText);
        $clonedCheckbox.append($checkboxLabel);
        $clonedCheckbox.insertAfter($postcodeInput.parent());
        // Instancia o monitoramento do CEP para atualizar label apenas se não existir
        if (!activeCepFetchers[type]) {
            activeCepFetchers[type] = new CepAddressFetcher('#' + type + '-postcode', 'label[for="' + checkboxId + '"]', type);
        }
        // Sempre desabilita ao inserir novo endereço
        disableCheckboxAndLabel(type);
    }

    function updateAddressFields(type, apiData) {
        // Verifica se deve ignorar verificação de processamento
        const skipCheck = apiData.skipProcessingCheck === true;
        
        // Verifica se já está processando para evitar loop (exceto se skipCheck for true)
        if (!skipCheck && isProcessingAddressUpdate) {
            return;
        }
        
        // Mapeia os campos relevantes
        const fieldMap = [
            { id: `${type}-address_1`, key: 'address' },
            { id: `${type}-address_2`, key: 'address_2' },
            { id: `${type}-city`, key: 'city' },
            { id: `${type}-state`, key: 'state' }
        ];

        fieldMap.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input) {
                return;
            }
            const value = apiData[field.key];

            if (field.key === 'state') {
                // Usa o estado retornado pela API
                const currentValue = input.value;
                const newValue = value || '';
                
                if (currentValue !== newValue) {
                    input.value = newValue;
                    // Sempre dispara evento para campo estado na primeira execução
                    if (skipCheck || updateCount <= 1) {
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            } else if (field.key === 'address') {
                // Para o campo endereço principal, sempre atualiza se tiver valor
                if (value && value.trim() !== '') {
                    const currentValue = input.value;
                    if (currentValue !== value) {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(input, value);
                        if (skipCheck || updateCount <= 1) {
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
            } else if (field.key === 'city') {
                // Para cidade, sempre atualiza se tiver valor
                if (value && value.trim() !== '') {
                    const currentValue = input.value;
                    if (currentValue !== value) {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(input, value);
                        if (skipCheck || updateCount <= 1) {
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
            } else if (field.key === 'address_2') {
                // Para address_2, trata especificamente para evitar restauração de valores antigos
                const currentValue = input.value;
                
                if (value && value.trim() !== '') {
                    // Se tem valor na API, usa ele
                    if (currentValue !== value) {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(input, value);
                        if (skipCheck || updateCount <= 1) {
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                } else {
                    // Se não tem valor na API, define um espaço em vez de vazio para evitar restauração
                    const targetValue = ' '; // Espaço em branco em vez de string vazia
                    if (currentValue !== targetValue) {
                        
                        // Define espaço em branco
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(input, targetValue);
                        input.value = targetValue;
                        input.setAttribute('value', targetValue);
                        
                        if (skipCheck || updateCount <= 1) {
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        // Verificação adicional para garantir que mantém o espaço
                        setTimeout(() => {
                            if (input.value !== targetValue && input.value.trim() !== '') {
                                const nativeSetter2 = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                nativeSetter2.call(input, targetValue);
                                input.value = targetValue;
                                input.dispatchEvent(new Event('input', { bubbles: true }));
                                input.dispatchEvent(new Event('change', { bubbles: true }));
                            }
                        }, 200);
                        
                    }
                }
            } else {
                // Para outros campos não mapeados especificamente
                if (value === '' || value === null || value === undefined) {
                    const currentValue = input.value;
                    if (currentValue !== '') {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(input, '');
                        if (skipCheck || updateCount <= 1) {
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                    }
                }
            }
        });
    }

    function toggleCheckboxVisibility(baseId) {
        var $checkboxDiv = $('#wc-better-checkbox-' + baseId).closest('.wc-block-components-checkbox');
        var $countrySelect = $('#' + baseId + '-country');
        if ($countrySelect.length && $checkboxDiv.length) {
            if ($countrySelect.val() !== 'BR') {
                $checkboxDiv.css('display', 'none');
            } else {
                $checkboxDiv.css('display', '');
            }
        }
    }

    // Classe para buscar endereço via CEP e atualizar label do checkbox
    class CepAddressFetcher {
        formatCep(cep) {
            cep = this.sanitizeCep(cep);
            return cep.length === 8 ? cep.slice(0, 5) + '-' + cep.slice(5) : cep;
        }
        constructor(inputSelector, checkboxLabelSelector, context = 'shipping') {
            // Verifica se já existe uma instância para este contexto
            if (activeCepFetchers[context]) {
                activeCepFetchers[context].destroy();
            }
            
            this.input = $(inputSelector);
            this.checkboxLabel = $(checkboxLabelSelector);
            this.context = context;
            this.addressData = null;
            this.checkboxInput = null;
            this._abortController = null;
            this._lastCep = '';
            this._debounceTimer = null;
            this._requestInProgress = false;
            this._lastRequestTime = 0;
            this._minRequestInterval = 500; // Mínimo de 500ms entre requisições
            
            // Registra esta instância
            activeCepFetchers[context] = this;
            
            this.init();
        }
        init() {
            if (!this.input.length) return;
            this.input.on('input.wcBetterCep', this.handleInput.bind(this));
            // Armazena referência ao checkbox
            this.checkboxInput = this.checkboxLabel.find('input[type="checkbox"]');
            // Adiciona evento de change para disparar AJAX
            this.checkboxInput.on('change.wcBetterCep', this.handleCheckboxChange.bind(this));
            // Verifica se já existe um CEP preenchido ao carregar
            const initialCep = this.sanitizeCep(this.input.val());
            if (this.isValidCep(initialCep)) {
                // Executa busca e animação inicial
                this.handleInput({ target: { value: initialCep } });
            }
        }

        destroy() {
            // Remove event listeners com namespace específico
            if (this.input && this.input.length) {
                this.input.off('input.wcBetterCep');
            }
            if (this.checkboxInput && this.checkboxInput.length) {
                this.checkboxInput.off('change.wcBetterCep');
            }
            
            // Cancela debounce timer
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
                this._debounceTimer = null;
            }
            
            // Cancela requisições pendentes
            if (this._abortController) {
                this._abortController.abort();
                this._abortController = null;
            }
            
            // Para animações
            if (this._loadingPulse) {
                clearInterval(this._loadingPulse);
                this._loadingPulse = null;
            }
            
            // Remove da lista de instâncias ativas
            if (activeCepFetchers[this.context] === this) {
                delete activeCepFetchers[this.context];
            }
            
            // Limpa referências
            this.input = null;
            this.checkboxLabel = null;
            this.checkboxInput = null;
            this.addressData = null;
            this._requestInProgress = false;
        }
        async handleCheckboxChange(event) {
            
            if (!enableCheckbox) {
                return; // Não executa requisições nem lógica do checkbox
            }
            
            // Se desmarcou o checkbox
            if (!event.target.checked) {
                // ...existing code...
                return;
            }
            
            // Ao marcar, desabilita imediatamente o checkbox
            if (event.target.checked) {
                const $checkboxInput = $(event.target);
                $checkboxInput.prop('disabled', true).addClass('wc-better-checkbox-disabled');
                $checkboxInput.closest('label').addClass('wc-better-checkbox-disabled-label');
            }
            // Se marcou o checkbox e tem endereço
            // Limpa o campo de número customizado e ajusta checkbox
            var numberFieldId = this.context + '-number';
            var $numberInput = $('#' + numberFieldId);
            if ($numberInput.length) {
                $numberInput.val('').prop('disabled', false).removeAttr('style').trigger('change');
                const $parentDiv = $numberInput.parent();
                $parentDiv.removeClass('is-active');
                var betterCheckboxId = 'wc-' + this.context + '-better-checkbox';
                var $betterCheckbox = $('#' + betterCheckboxId);
                if ($betterCheckbox.length) {
                    $betterCheckbox.prop('checked', false).trigger('change');
                }
            }
            // Se marcou o checkbox e tem endereço
            if (!this.addressData) {
                return;
            }
            
            // Animação de inserção
            this.showInsertingLabel();
            const address = this.addressData;
            
            // Dados para enviar
            const data = {
                action: 'wc_better_insert_address',
                address: address.address,
                city: address.city,
                state: address.state,
                district: address.district,
                postcode: this.formatCep(this.input.val()),
                context: this.context,
                nonce: (typeof wc_better_checkout_vars !== 'undefined' ? wc_better_checkout_vars.nonce : '')
            };
            
            let ajaxCompleted = false;
            // Promise para requisição AJAX
            const ajaxPromise = new Promise((resolve, reject) => {
                $.ajax({
                    url: (typeof wc_better_checkout_vars !== 'undefined' && wc_better_checkout_vars.ajax_url) ? wc_better_checkout_vars.ajax_url : '/wp-admin/admin-ajax.php',
                    method: 'POST',
                    data: data,
                    success: function (response) {
                        
                        ajaxCompleted = true;
                        resolve(response);
                    },
                    error: function (xhr, status, error) {
                        ajaxCompleted = true;
                        reject();
                    }
                });
            });
            
            // Aguarda mínimo de 2s e AJAX
            await Promise.race([
                ajaxPromise,
                new Promise(resolve => setTimeout(resolve, 2000))
            ]);
            if (!ajaxCompleted) {
                await ajaxPromise;
            }
            
            // Mensagem de sucesso
            this.showInsertedLabel(address);

            // Atualiza o endereço do carrinho no Woo Blocks
            if (window.wp && window.wp.data && typeof window.wp.data.dispatch === 'function') {
                try {
                    window.wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress')
                    
                    // Flag para evitar loop infinito
                    let observerActive = true;
                    let updateCount = 0;
                    const maxUpdates = 2; // Máximo 2 atualizações
                    let observerTimeout;
                    
                    // Variável para acessar updateCount dentro da função updateAddressFields
                    window.wcBetterUpdateCount = updateCount;

                    const observer = new MutationObserver((mutations, obs) => {
                        // Verifica limites
                        if (!observerActive || updateCount >= maxUpdates) {
                            obs.disconnect();
                            return;
                        }
                        
                        // Verifica se o campo foi atualizado
                        const input = document.getElementById(`${this.context}-address_1`);
                        if (input) {
                            
                            updateCount++;
                            
                            // Chama updateAddressFields na primeira vez sem verificação
                            if (updateCount === 1) {
                                updateAddressFields(this.context, { ...data, skipProcessingCheck: true });
                                
                                // Ativa flag APÓS a primeira execução
                                setTimeout(() => {
                                    isProcessingAddressUpdate = true;
                                }, 100);
                            } else {
                                // Nas execuções subsequentes, verifica a flag
                                if (isProcessingAddressUpdate) {
                                    return;
                                }
                                isProcessingAddressUpdate = true;
                                updateAddressFields(this.context, data);
                            }
                            
                            // Reset da flag após um delay
                            setTimeout(() => {
                                isProcessingAddressUpdate = false;
                            }, 800);
                            
                            // Reset do timeout
                            clearTimeout(observerTimeout);
                            observerTimeout = setTimeout(() => {
                                observerActive = false;
                                obs.disconnect();
                            }, 3000); // 3 segundos de timeout total
                        }
                    });
                    
                    observer.observe(document.body, { childList: true, subtree: true });
                    
                    // Timeout de segurança absoluto
                    setTimeout(() => {
                        if (observerActive) {
                            observerActive = false;
                            observer.disconnect();
                            isProcessingAddressUpdate = false;
                        }
                    }, 5000);

                } catch (e) {
                    // Reset da flag em caso de erro
                    isProcessingAddressUpdate = false;
                    // Se não for possível atualizar, mostra mensagem de erro na label
                    if (this.checkboxLabel.length) {
                        const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                        $labelSpan.stop(true, true).fadeOut(150, function () {
                            $labelSpan.text('Não foi possivel inserir o endereço, preencha os dados abaixo ou tente novamente.').fadeIn(150);
                        });
                    }
                }
            } else {
                
            }
        }
        showInsertingLabel() {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) {
                clearInterval(this._loadingPulse);
                this._loadingPulse = null;
            }
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            $labelSpan.stop(true, true).css('opacity', 1).text('Inserindo Endereço...').show();
            this._loadingPulse = setInterval(() => {
                $labelSpan.fadeOut(350, function () {
                    $labelSpan.fadeIn(350);
                });
            }, 350);
        }
        showInsertedLabel(address) {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) {
                clearInterval(this._loadingPulse);
                this._loadingPulse = null;
            }
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            // Monta label dinâmica
            let parts = [];
            if (address.address) parts.push(address.address);
            if (address.city) parts.push(address.city);
            if (address.district) parts.push(address.district);
            if (address.state) parts.push(address.state);
            const labelText = `Endereço inserido: ${parts.join(' - ')}`;
            $labelSpan.stop(true, true).css('opacity', 1).text(labelText).show();
        }
        async handleInput(event) {
            const cep = this.sanitizeCep(event.target.value);
            const $checkboxInput = this.checkboxLabel.find('input[type="checkbox"]');
            const $checkboxLabel = $checkboxInput.closest('label');
            

            // Cancela debounce timer anterior
            if (this._debounceTimer) {
                clearTimeout(this._debounceTimer);
                this._debounceTimer = null;
            }

            // Cancela requisição anterior se houver
            if (this._abortController) {
                this._abortController.abort();
                this._abortController = null;
            }
            
            this._lastCep = cep;
            this._requestInProgress = false;
            
            // Limpa qualquer animação anterior do label
            if (this._loadingPulse) {
                clearInterval(this._loadingPulse);
                this._loadingPulse = null;
            }
            if (this.checkboxLabel && this.checkboxLabel.length) {
                const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                $labelSpan.stop(true, true).css('opacity', 1).show();
            }

            if (this.isValidCep(cep)) {
                // Desabilita o checkbox imediatamente
                $checkboxInput.prop('disabled', true);
                $checkboxInput.addClass('wc-better-checkbox-disabled');
                $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
                
                // Implementa debounce de 300ms
                this._debounceTimer = setTimeout(async () => {
                    await this._performCepLookup(cep, $checkboxInput, $checkboxLabel);
                }, 300);
            } else {
                // CEP inválido
                this._handleInvalidCep($checkboxInput, $checkboxLabel);
            }
        }
        
        async _performCepLookup(cep, $checkboxInput, $checkboxLabel) {
            
            // Verifica rate limiting
            const now = Date.now();
            const timeSinceLastRequest = now - this._lastRequestTime;
            
            if (timeSinceLastRequest < this._minRequestInterval) {
                const waitTime = this._minRequestInterval - timeSinceLastRequest;
                setTimeout(() => this._performCepLookup(cep, $checkboxInput, $checkboxLabel), waitTime);
                return;
            }
            
            // Verifica se já tem uma requisição em progresso
            if (this._requestInProgress) {
                return;
            }
            
            this._requestInProgress = true;
            this._lastRequestTime = now;
            
            this.showLoadingLabel();

            // Cria novo AbortController para esta consulta
            const abortController = new AbortController();
            this._abortController = abortController;
            let address;
            
            try {
                await Promise.race([
                    (async () => {
                        address = await this.fetchAddress(cep, abortController.signal);
                    })(),
                    new Promise(resolve => setTimeout(resolve, 5000)) // Timeout de 5 segundos
                ]);
                
                if (address === undefined) {
                    address = await this.fetchAddress(cep, abortController.signal);
                }
                
            } catch (e) {
                if (e.name === 'AbortError') {
                    this._requestInProgress = false;
                    return;
                }
                address = null;
            } finally {
                this._requestInProgress = false;
            }

            // Se o usuário mudou o CEP durante a consulta, não faz nada
            if (this._lastCep !== cep) {
                return;
            }

            if (address) {
                const previousAddress = this.addressData;
                const previousCep = previousAddress && previousAddress._rawCep ? previousAddress._rawCep : null;
                const currentRawCep = this.input.val();
                this.addressData = { ...address, _rawCep: currentRawCep };
                this.updateCheckboxLabel(address);
                $checkboxInput.prop('disabled', false);
                $checkboxInput.removeClass('wc-better-checkbox-disabled');
                $checkboxLabel.removeClass('wc-better-checkbox-disabled-label');
                
                // Garante que a inserção automática ocorra se o endereço mudou OU o CEP digitado mudou
                const shouldAutoInsert = (
                    !previousAddress ||
                    JSON.stringify(previousAddress) !== JSON.stringify(address) ||
                    previousCep !== currentRawCep
                );
                
                if (shouldAutoInsert && $checkboxInput.prop('checked')) {
                    this.handleCheckboxChange({ target: $checkboxInput[0] });
                }
            } else {
                this._handleAddressNotFound(cep, $checkboxInput, $checkboxLabel);
            }
        }
        
        _handleInvalidCep($checkboxInput, $checkboxLabel) {
            $checkboxInput.prop('disabled', true);
            $checkboxInput.addClass('wc-better-checkbox-disabled');
            $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
            $checkboxInput.prop('checked', false);
            if (this.checkboxLabel.length) {
                const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                $labelSpan.text('Informe acima o código Postal (CEP).');
            }
        }
        
        _handleAddressNotFound(cep, $checkboxInput, $checkboxLabel) {
            this.addressData = null;
            this.showNotFoundLabel();
            $checkboxInput.prop('disabled', true);
            $checkboxInput.addClass('wc-better-checkbox-disabled');
            $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
            $checkboxInput.prop('checked', false);
            
            const data = {
                action: 'wc_better_insert_address',
                address: '',
                city: '',
                state: '',
                district: '',
                postcode: this.formatCep(this.input.val()),
                context: this.context,
                not_found: true,
                nonce: (typeof wc_better_checkout_vars !== 'undefined' ? wc_better_checkout_vars.nonce : '')
            };
            
            // Não bloqueia a UI com esta requisição
            $.ajax({
                url: (typeof wc_better_checkout_vars !== 'undefined' && wc_better_checkout_vars.ajax_url) ? wc_better_checkout_vars.ajax_url : '/wp-admin/admin-ajax.php',
                method: 'POST',
                data: data
            }).fail(() => {
                
            });
            
            if (window.wp && window.wp.data && typeof window.wp.data.dispatch === 'function') {
                try {
                    window.wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress');
                } catch (e) {
                    
                }
            }
        }
        showLoadingLabel() {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) {
                clearInterval(this._loadingPulse);
                this._loadingPulse = null;
            }
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            $labelSpan.stop(true, true).css('opacity', 1).text('Carregando Endereço...').show();
            this._loadingPulse = setInterval(() => {
                $labelSpan.fadeOut(350, function () {
                    $labelSpan.fadeIn(350);
                });
            }, 350);
        }

        showNotFoundLabel() {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) {
                clearInterval(this._loadingPulse);
                this._loadingPulse = null;
            }
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            $labelSpan.stop(true, true).css('opacity', 1).fadeOut(150, function () {
                $labelSpan.text('Não encontramos o endereço, preencha os dados abaixo.').fadeIn(150);
            });
        }
        sanitizeCep(cep) {
            return cep.replace(/\D/g, '');
        }
        isValidCep(cep) {
            return /^\d{8}$/.test(cep);
        }
        async fetchAddress(cep, signal) {
            let address = await this.fetchFromBrasilApi(cep, signal);
            if (!address) {
                address = await this.fetchFromViaCep(cep, signal);
            }
            return address;
        }
        async fetchFromBrasilApi(cep, signal) {
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { 
                    signal,
                    headers: {
                        'Accept': 'application/json',
                    },
                    mode: 'cors'
                });
                if (!response.ok) {
                    return null;
                }
                const data = await response.json();
                
                if (data.cep) {
                    return {
                        city: data.city,
                        state: data.state,
                        address: data.street,
                        district: data.neighborhood || '',
                    };
                }
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                return null;
            }
            return null;
        }
        async fetchFromViaCep(cep, signal) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { 
                    signal,
                    headers: {
                        'Accept': 'application/json',
                    },
                    mode: 'cors'
                });
                if (!response.ok) {
                    return null;
                }
                const data = await response.json();
                
                if (data.cep && !data.erro) {
                    return {
                        city: data.localidade,
                        state: data.uf,
                        address: data.logradouro,
                        district: data.bairro || '',
                    };
                }
            } catch (e) {
                if (e.name === 'AbortError') throw e;
                return null;
            }
            return null;
        }
        updateCheckboxLabel(address) {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) clearInterval(this._loadingPulse);
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            // Monta label dinâmica
            let parts = [];
            if (address.address) parts.push(address.address);
            if (address.city) parts.push(address.city);
            if (address.district) parts.push(address.district);
            if (address.state) parts.push(address.state);
            const labelText = `Usar o endereço: ${parts.join(' - ')}`;
            $labelSpan.stop(true, true).text(labelText).show();
        }
    }

    var observer = new MutationObserver(function () {
        var $postcodeDivs = $('.wc-block-components-address-form__postcode');
        $postcodeDivs.each(function () {
            var $divComponent = $(this);
            $divComponent.css('flex', '1 0 calc(100%)');
            var $input = $divComponent.find('input');
            if ($input.length === 0) return;
            var baseId = $input.attr('id').replace('-postcode', '');
            var priorityClass = 'woo-better-priority-' + baseId;
            if ($divComponent.hasClass(priorityClass)) return;
            $divComponent.addClass(priorityClass);

            // Lógica de posicionamento do CEP
            var checkboxId = 'wc-better-checkbox-' + baseId;
            var $checkboxLabel = $('label[for="' + checkboxId + '"]');
            var $addressInput = $('#' + baseId + '-address_1');
            var $addressParentDiv = $addressInput.length ? $addressInput.parent() : null;
            if ($checkboxLabel.length) {
                // Se o checkbox existe, posiciona o CEP acima do checkbox
                var $checkboxDiv = $checkboxLabel.closest('.wc-block-components-checkbox');
                if ($checkboxDiv.length && $checkboxDiv.prev()[0] !== $divComponent[0]) {
                    $divComponent.insertBefore($checkboxDiv);
                }
            } else if ($addressParentDiv) {
                // Se não existe checkbox, posiciona o CEP acima do endereço
                if ($addressParentDiv.prev()[0] !== $divComponent[0]) {
                    $divComponent.insertBefore($addressParentDiv);
                }
            }

            var billingNumber = (window.wc_better_checkout_vars && window.wc_better_checkout_vars.billing_number) || '';
            var shippingNumber = (window.wc_better_checkout_vars && window.wc_better_checkout_vars.shipping_number) || '';
            var numero = (baseId === 'billing' ? billingNumber : shippingNumber);
            if (numero && $addressInput.length) {
                var currentValue = $addressInput.val();
                // Remove apenas o número do final, preservando o bairro
                var regex = new RegExp('\\s*[–-]\\s*' + numero.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
                var newValue = currentValue.replace(regex, '');
                var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeSetter.call($addressInput[0], newValue);
                $addressInput[0].dispatchEvent(new Event('input', { bubbles: true }));
            }

            // Só insere o checkbox se ele ainda não existe
            if ($checkboxLabel.length === 0) {
                insertCustomCheckboxBelowPostcode(baseId);
            } else if (!activeCepFetchers[baseId]) {
                // Se o checkbox existe mas não há instância ativa, cria uma nova
                activeCepFetchers[baseId] = new CepAddressFetcher('#' + baseId + '-postcode', 'label[for="' + checkboxId + '"]', baseId);
            }

            // Esconde/mostra checkbox conforme país
            toggleCheckboxVisibility(baseId);
            // Observa mudança dinâmica do select país
            var $countrySelect = $('#' + baseId + '-country');
            if ($countrySelect.length) {
                $countrySelect.off('change.wcBetterCountry').on('change.wcBetterCountry', function () {
                    toggleCheckboxVisibility(baseId);
                });
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
