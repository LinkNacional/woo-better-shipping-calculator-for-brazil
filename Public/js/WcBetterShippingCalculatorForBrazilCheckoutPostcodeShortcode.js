jQuery(function ($) {
    // Executa apenas uma vez para cada tipo
    window.moveCheckboxBelowPostcodeField = function (type) {
        var $postcodeField = $('#' + type + '_postcode_field');
        var $checkboxField = $('#wc_better_calc_checkbox_' + type + '_field');
        if ($postcodeField.length && $checkboxField.length) {
            // Remove span.optional do label do checkbox imediatamente
            var $input = $("#wc_better_calc_checkbox_" + type);
            var $label = $input.length ? $input.closest('label') : $();
            if ($label.length) {
                $label.find('span.optional, .optional').remove();
            }
            if (!$postcodeField.next().is($checkboxField)) {
                $checkboxField.insertAfter($postcodeField);
            }
            // NOVO: Se já houver um CEP válido, dispara a requisição e animação
            var $cepInput = $('#' + type + '_postcode');
            if ($cepInput.length) {
                var cep = $cepInput.val().replace(/\D/g, '');
                if (cep.length === 8) {
                    $cepInput.trigger('input');
                }
            }
        } else {
            // ...sem logs de debug...
        }
    }
});


jQuery(function ($) {
    // Se a variável global não permitir, não executa NENHUMA lógica do checkbox
    var enableCheckbox = true;
    if (typeof wc_better_checkout_vars_shortcode !== 'undefined' && wc_better_checkout_vars_shortcode.fill_checkout_address === 'no') {
        enableCheckbox = false;
    }


    function movePostcodeFieldBelowCountry(type) {
        var $countryField = $('#' + type + '_country_field');
        var $postcodeField = $('#' + type + '_postcode_field');
        if ($countryField.length && $postcodeField.length) {
            if (!$countryField.next().is($postcodeField)) {
                $postcodeField.insertAfter($countryField);
            }
        }
    }

    function toggleCheckboxVisibility(type) {
        var $checkboxDiv = $('#wc_better_calc_checkbox_' + type + '_field');
        var $countrySelect = $('#' + type + '_country');
        if ($countrySelect.length && $checkboxDiv.length) {
            if ($countrySelect.val() !== 'BR') {
                $checkboxDiv.hide();
            } else {
                $checkboxDiv.show();
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
            this.input = $(inputSelector);
            this.checkboxLabel = $(checkboxLabelSelector);
            this.context = context;
            this.addressData = null;
            this.checkboxInput = null;
            this._abortController = null;
            this._lastCep = '';
            this.init();
        }
        init() {
            if (!this.input.length) return;
            this.input.on('input', this.handleInput.bind(this));
            // Armazena referência ao checkbox
            this.checkboxInput = this.checkboxLabel.find('input[type="checkbox"]');
            // Adiciona evento de change para disparar AJAX
            this.checkboxInput.on('change', this.handleCheckboxChange.bind(this));
            // Verifica se já existe um CEP preenchido ao carregar
            const initialCep = this.sanitizeCep(this.input.val());
            if (this.isValidCep(initialCep)) {
                // Executa busca e animação inicial
                this.handleInput({ target: { value: initialCep } });
            }
        }
        async handleCheckboxChange(event) {
            if (!enableCheckbox) return; // Não executa requisições nem lógica do checkbox
            // Se desmarcou o checkbox
            if (!event.target.checked) {
                // ...existing code...
                return;
            }
            // Se marcou o checkbox e tem endereço
            // Limpa o campo de número se existir
            var numberFieldId = this.context + '_number';
            var $numberInput = $('#' + numberFieldId);
            if ($numberInput.length) {
                $numberInput.val('');
            }
            // Se marcou o checkbox e tem endereço
            if (!this.addressData) return;
            // Atualiza o campo de CEP para o formato correto
            let cep = this.sanitizeCep(this.input.val());
            let formattedCep = '';
            if (cep.length === 8) {
                formattedCep = cep.slice(0, 5) + '-' + cep.slice(5);
            } else if (/^\d{5}-\d{3}$/.test(this.input.val())) {
                formattedCep = this.input.val();
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
                postcode: formattedCep || this.formatCep(this.input.val()),
                context: this.context,
                nonce: (typeof wc_better_checkout_vars_shortcode !== 'undefined' ? wc_better_checkout_vars_shortcode.nonce : '')
            };
            let ajaxCompleted = false;
            // Promise para requisição AJAX
            const ajaxPromise = new Promise((resolve, reject) => {
                $.ajax({
                    url: (typeof wc_better_checkout_vars_shortcode !== 'undefined' && wc_better_checkout_vars_shortcode.ajax_url) ? wc_better_checkout_vars_shortcode.ajax_url : '/wp-admin/admin-ajax.php',
                    method: 'POST',
                    data: data,
                    success: function (response) {
                        ajaxCompleted = true;
                        resolve(response);
                    },
                    error: function () {
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
            // Removido: atualização do campo de CEP aqui, agora é feito apenas em fillFields
            // Atualiza o endereço do carrinho no Woo Blocks
            if (window.wp && window.wp.data && typeof window.wp.data.dispatch === 'function') {
                try {
                    window.wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress');
                } catch (e) {
                    // Se não for possível atualizar, mostra mensagem de erro na label
                    if (this.checkboxLabel.length) {
                        const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                        $labelSpan.stop(true, true).fadeOut(150, function () {
                            $labelSpan.text('Não foi possivel inserir o endereço, preencha os dados abaixo ou tente novamente.').fadeIn(150);
                        });
                    }
                }
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
            
            // Só inclui o bairro se NÃO existir um campo de bairro separado
            const neighborhoodField = document.getElementById(`${this.context}_neighborhood`);
            if (!neighborhoodField && address.district) parts.push(address.district);
            
            if (address.state) parts.push(address.state);
            const labelText = `Endereço inserido: ${parts.join(' - ')}`;
            $labelSpan.stop(true, true).css('opacity', 1).text(labelText).show();
        }
        async handleInput(event) {
            let rawCep = event.target.value;
            let cep = this.sanitizeCep(rawCep);
            // Aceita 14490000 ou 14490-000, sempre normaliza para 14490-000
            let formattedCep = '';
            if (cep.length === 8) {
                formattedCep = cep.slice(0, 5) + '-' + cep.slice(5);
            } else if (/^\d{5}-\d{3}$/.test(rawCep)) {
                formattedCep = rawCep;
                cep = rawCep.replace(/\D/g, '');
            }
            const $checkboxInput = this.checkboxLabel.find('input[type="checkbox"]');

            // Cancela requisição anterior se houver
            if (this._abortController) {
                this._abortController.abort();
            }
            this._abortController = null;

            // Sempre faz requisição se o valor do campo mudar, mesmo que só o formato (com/sem hífen)
            if (typeof this._lastCep === 'object') this._lastCep = '';
            if (this._lastCep === formattedCep && (this._lastCep || '').replace(/\D/g, '') === cep) {
                // Não mudou nada relevante
                return;
            }
            this._lastCep = formattedCep;

            // Limpa qualquer animação anterior do label
            if (this._loadingPulse) {
                clearInterval(this._loadingPulse);
                this._loadingPulse = null;
            }
            if (this.checkboxLabel && this.checkboxLabel.length) {
                const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                $labelSpan.stop(true, true).css('opacity', 1).show();
            }

            if (this.isValidCep(cep) || /^\d{5}-\d{3}$/.test(rawCep)) {
                $checkboxInput.prop('disabled', true);
                $checkboxInput.addClass('wc-better-checkbox-disabled');
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
                        new Promise(resolve => setTimeout(resolve, 2000))
                    ]);
                    if (address === undefined) {
                        address = await this.fetchAddress(cep, abortController.signal);
                    }
                } catch (e) {
                    if (e.name === 'AbortError') {
                        // Consulta abortada, não faz nada
                        return;
                    }
                }

                // Se o usuário mudou o CEP durante a consulta, não faz nada
                if (this._lastCep !== formattedCep) {
                    return;
                }

                // Removido: atualização do campo de CEP aqui, agora é feito apenas em fillFields

                if (address) {
                    const previousAddress = this.addressData;
                    const previousCep = previousAddress && previousAddress._rawCep ? previousAddress._rawCep : null;
                    const currentRawCep = this.input.val();
                    this.addressData = { ...address, _rawCep: currentRawCep };
                    this.updateCheckboxLabel(address);
                    $checkboxInput.prop('disabled', false);
                    $checkboxInput.removeClass('wc-better-checkbox-disabled');
                    // Garante que a inserção automática ocorra se o endereço mudou OU o CEP digitado mudou
                    if (
                        !previousAddress ||
                        JSON.stringify(previousAddress) !== JSON.stringify(address) ||
                        previousCep !== currentRawCep
                    ) {
                        if ($checkboxInput.prop('checked')) {
                            this.handleCheckboxChange({ target: $checkboxInput[0] });
                        }
                    }
                } else {
                    this.addressData = null;
                    this.showNotFoundLabel();
                    $checkboxInput.prop('disabled', true);
                    $checkboxInput.addClass('wc-better-checkbox-disabled');
                    $checkboxInput.prop('checked', false);
                    const data = {
                        action: 'wc_better_insert_address',
                        address: '',
                        city: '',
                        state: '',
                        district: '',
                        postcode: formattedCep || this.formatCep(this.input.val()),
                        context: this.context,
                        not_found: true,
                        nonce: (typeof wc_better_checkout_vars_shortcode !== 'undefined' ? wc_better_checkout_vars_shortcode.nonce : '')
                    };
                    $.ajax({
                        url: (typeof wc_better_checkout_vars_shortcode !== 'undefined' && wc_better_checkout_vars_shortcode.ajax_url) ? wc_better_checkout_vars_shortcode.ajax_url : '/wp-admin/admin-ajax.php',
                        method: 'POST',
                        data: data
                    });
                }
            } else {
                // Se o CEP não é válido, mantém desabilitado e atualiza texto
                $checkboxInput.prop('disabled', true);
                $checkboxInput.addClass('wc-better-checkbox-disabled');
                $checkboxInput.prop('checked', false);
                if (this.checkboxLabel.length) {
                    const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                    $labelSpan.text('Informe acima o código Postal (CEP).');
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
                const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`, { signal });
                if (!response.ok) return null;
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
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal });
                if (!response.ok) return null;
                const data = await response.json();
                if (data.cep) {
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
            
            // Só inclui o bairro se NÃO existir um campo de bairro separado
            const neighborhoodField = document.getElementById(`${this.context}_neighborhood`);
            if (!neighborhoodField && address.district) parts.push(address.district);
            
            if (address.state) parts.push(address.state);
            const labelText = `Usar o endereço: ${parts.join(' - ')}`;
            $labelSpan.stop(true, true).text(labelText).show();
        }
    }

    let addressSanitized = { billing: false, shipping: false };

    // MutationObserver para monitorar mudanças no DOM
    var observer = new MutationObserver(function () {
        ['billing', 'shipping'].forEach(function (type) {
            movePostcodeFieldBelowCountry(type);
            moveCheckboxBelowPostcodeField(type);
            toggleCheckboxVisibility(type);
            // Lógica para remover número do endereço apenas uma vez
            if (!addressSanitized[type]) {
                var number = (type === 'billing') ? (window.wc_better_checkout_vars_shortcode && window.wc_better_checkout_vars_shortcode.billing_number) : (window.wc_better_checkout_vars_shortcode && window.wc_better_checkout_vars_shortcode.shipping_number);
                var $addressInput = $('#' + type + '_address_1');
                if ($addressInput.length && number) {
                    var currentVal = $addressInput.val();
                    if (currentVal && currentVal.match(new RegExp(`\\s*-?\\s*${number}\\s*$`))) {
                        var sanitized = removeNumberFromAddress(currentVal, number);
                        $addressInput.val(sanitized).trigger('change');
                        addressSanitized[type] = true;
                    }
                } else if ($addressInput.length && !number) {
                    addressSanitized[type] = true; // Não há número, não precisa repetir
                }
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // Chama uma vez para garantir que já está no DOM
    ['billing', 'shipping'].forEach(function (type) {
        movePostcodeFieldBelowCountry(type);
        moveCheckboxBelowPostcodeField(type);
        toggleCheckboxVisibility(type);
        // Monitora mudanças no campo de país
        var $countrySelect = $('#' + type + '_country');
        if ($countrySelect.length) {
            $countrySelect.on('change', function () {
                toggleCheckboxVisibility(type);
            });
        }
    });

    // Função para remover número do endereço
    function removeNumberFromAddress(address, number) {
        if (!address || !number) return address;
        // Remove " - número" do final do endereço, ignorando espaços extras
        const regex = new RegExp(`\\s*-?\\s*${number}\\s*$`);
        return address.replace(regex, '').trim();
    }

    // Função para atualizar a label do checkbox
    function updateCheckboxLabel(type, status, addressText, addressObj) {
        // Busca o input e pega o label pai
        var $input = $("#wc_better_calc_checkbox_" + type);
        var $label = $input.length ? $input.closest('label') : $();
        if (!$label.length) {
            return;
        }
        // Remove span.optional se existir
        $label.find('span.optional, .optional').remove();
        let labelText = '';
        if (status === 'loading') {
            labelText = 'Carregando endereço...';
        } else if (status === 'success') {
            // Endereço foi realmente inserido
            if (addressObj) {
                let parts = [];
                if (addressObj.address) parts.push(addressObj.address);
                if (addressObj.city) parts.push(addressObj.city);
                
                // Só inclui o bairro se NÃO existir um campo de bairro separado
                const neighborhoodField = document.getElementById(`${type}_neighborhood`);
                if (!neighborhoodField && (addressObj.district || addressObj.neighborhood)) {
                    parts.push(addressObj.district || addressObj.neighborhood);
                }
                
                if (addressObj.state) parts.push(addressObj.state);
                labelText = 'Endereço inserido: ' + parts.join(' - ');
            } else {
                labelText = 'Endereço inserido: ' + addressText;
            }
        } else if (status === 'preview') {
            // Apenas pré-visualização, não inserido
            if (addressObj) {
                let parts = [];
                if (addressObj.address) parts.push(addressObj.address);
                if (addressObj.city) parts.push(addressObj.city);
                
                // Só inclui o bairro se NÃO existir um campo de bairro separado
                const neighborhoodField = document.getElementById(`${type}_neighborhood`);
                if (!neighborhoodField && (addressObj.district || addressObj.neighborhood)) {
                    parts.push(addressObj.district || addressObj.neighborhood);
                }
                
                if (addressObj.state) parts.push(addressObj.state);
                labelText = 'Usar o endereço: ' + parts.join(' - ');
            } else {
                labelText = 'Usar o endereço: ' + addressText;
            }
        } else if (status === 'notfound') {
            labelText = 'Não encontramos o endereço, preencha os dados abaixo.';
        } else {
            labelText = 'Informe acima o código postal (CEP).';
        }
        // Remove spans/textos antigos
        $label.contents().filter(function () {
            return (this.nodeType === 3 || (this.nodeType === 1 && this.classList && this.classList.contains('wc-better-label-fade')));
        }).remove();
        // Cria um span para animar o texto
        var $fadeSpan = $('<span class="wc-better-label-fade" style="display:inline"></span>').text(labelText + '\u00A0');
        $label.append($fadeSpan);
    }

    // Função para buscar endereço via API
    async function fetchAddressByCep(cep) {
        // Consulta BrasilAPI
        try {
            let response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
            if (response.ok) {
                let data = await response.json();
                if (data.cep) {
                    const addressObj = {
                        address: data.street || '',
                        city: data.city || '',
                        state: data.state || '',
                        district: data.neighborhood || ''
                    };
                    const addressText = [addressObj.address, addressObj.city, addressObj.state].filter(Boolean).join(' - ');
                    return [true, addressText, addressObj];
                }
            }
        } catch (e) { }
        // Consulta ViaCEP
        try {
            let response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (response.ok) {
                let data = await response.json();
                if (data.cep) {
                    const addressObj = {
                        address: data.logradouro || '',
                        city: data.localidade || '',
                        state: data.uf || '',
                        district: data.bairro || ''
                    };
                    const addressText = [addressObj.address, addressObj.city, addressObj.state].filter(Boolean).join(' - ');
                    return [true, addressText, addressObj];
                }
            }
        } catch (e) { }
        return [false, '', null];
    }

    // Função para preencher campos do checkout clássico (shortcode) igual ao modelo dos Correios
    function fillFields(field, data) {
        // Preenche todos os campos, se não existir valor, seta como ''
        let cep = data.postcode ? String(data.postcode).replace(/\D/g, '') : '';
        if (cep.length === 8) {
            cep = cep.slice(0, 5) + '-' + cep.slice(5);
        }
        $("#" + field + "_postcode").val(cep).trigger("change");

        $("#" + field + "_address_1").val(data.address ? data.address : '').trigger("change");

        // Bairro
        let neighborhood = data.neighborhood ? data.neighborhood : '';
        const neighborhoodField = document.getElementById(field + '_neighborhood');
        if (neighborhoodField) {
            // Se existe campo de bairro separado, insere nele
            $("#" + field + "_neighborhood").val(neighborhood).trigger("change");
        } else {
            // Se não existe campo separado E tem bairro, concatena no endereço
            if (data.address !== '' && neighborhood !== '') {
                $("#" + field + "_address_1").val(data.address + ' - ' + neighborhood).trigger("change");
            }
        }

        $("#" + field + "_city").val(data.city ? data.city : '').trigger("change");
        $("#" + field + "_state").val(data.state ? data.state : '').trigger("change");
        // Limpa campo customizado billing_number ou shipping_number se existir
        var customNumberId = field === 'billing' ? 'billing_number' : (field === 'shipping' ? 'shipping_number' : null);
        var customCheckboxId = field === 'billing' ? 'lkn_billing_checkbox' : (field === 'shipping' ? 'lkn_shipping_checkbox' : null);
        if (customNumberId && $("#" + customNumberId).length) {
            var $customNumber = $("#" + customNumberId);
            $customNumber.val('').prop('disabled', false).trigger('change');
            // Remove opacidade do campo pai
            $customNumber.closest('.form-row').removeAttr('style').css('opacity', '');
            if (customCheckboxId && $("#" + customCheckboxId).length) {
                $("#" + customCheckboxId).prop('checked', false).trigger('change');
            }
        }
    }

    // Adiciona evento de input aos campos de CEP de billing e shipping
    ['billing', 'shipping'].forEach(function (type) {
        var $postcode = $('#' + type + '_postcode');
        var $checkbox = $('#wc_better_calc_checkbox_' + type);
        var addressData = null;
        var checkboxBlocked = false;
        var lastInsertedAddress = null;
        if ($postcode.length && !$postcode.data('hasInputListener')) {
            let loadingPulse = null;
            let lastCepRaw = '';
            let lastValidCep = '';
            // Função para aplicar/remover disabled e classe na label
            function setCheckboxDisabled(disabled) {
                if ($checkbox.length) {
                    $checkbox.prop('disabled', !!disabled);
                    var $label = $checkbox.closest('label');
                    if (disabled) {
                        $checkbox.addClass('wc-better-checkbox-disabled');
                        $label.addClass('wc-better-checkbox-disabled-label');
                    } else {
                        $checkbox.removeClass('wc-better-checkbox-disabled');
                        $label.removeClass('wc-better-checkbox-disabled-label');
                    }
                }
            }
            // Função para bloquear o checkbox após inserção
            function blockCheckbox() {
                checkboxBlocked = true;
                setCheckboxDisabled(true);
            }
            // Função para desbloquear o checkbox
            function unblockCheckbox() {
                checkboxBlocked = false;
                setCheckboxDisabled(false);
            }
            $postcode.on('input', async function (e) {
                const rawValue = e.target.value;
                const cep = rawValue.replace(/\D/g, '');
                // Se o campo foi apagado ou ficou inválido, desabilita e bloqueia
                if (cep.length !== 8) {
                    updateCheckboxLabel(type, 'default');
                    setCheckboxDisabled(true);
                    addressData = null;
                    if (loadingPulse) { clearInterval(loadingPulse); loadingPulse = null; }
                    lastCepRaw = '';
                    lastValidCep = '';
                    checkboxBlocked = false;
                    $checkbox.prop('checked', false);
                    return;
                }
                // Sempre faz requisição se o valor do campo mudar, mesmo que só o formato (com/sem hífen)
                if (lastCepRaw === rawValue) return;
                lastCepRaw = rawValue;
                updateCheckboxLabel(type, 'loading');
                setCheckboxDisabled(true);
                if (loadingPulse) clearInterval(loadingPulse);
                let pulseState = true;
                loadingPulse = setInterval(function () {
                    // Pisca apenas o texto animado
                    var $input = $("#wc_better_calc_checkbox_" + type);
                    var $label = $input.length ? $input.closest('label') : $();
                    var $fadeSpan = $label.find('span.wc-better-label-fade');
                    if ($fadeSpan.length) {
                        $fadeSpan.stop(true, true).fadeTo(250, pulseState ? 0.4 : 1);
                        pulseState = !pulseState;
                    }
                }, 350);
                // Aguarda no mínimo 2 segundos e a resposta da API
                const start = Date.now();
                const fetchPromise = fetchAddressByCep(cep);
                const delayPromise = new Promise(resolve => setTimeout(resolve, 2000));
                const [found, addressText, addressObj] = await Promise.all([
                    fetchPromise,
                    delayPromise
                ]).then(results => results[0]);
                if (loadingPulse) {
                    clearInterval(loadingPulse);
                    loadingPulse = null;
                    // Garante opacidade normal apenas no texto animado
                    var $input = $("#wc_better_calc_checkbox_" + type);
                    var $label = $input.length ? $input.closest('label') : $();
                    var $fadeSpan = $label.find('span.wc-better-label-fade');
                    if ($fadeSpan.length) {
                        $fadeSpan.stop(true, true).fadeTo(100, 1);
                    }
                }
                if (lastCepRaw.replace(/\D/g, '') !== cep) return; // Se o usuário digitou outro CEP, não atualiza
                if (found) {
                    updateCheckboxLabel(type, 'preview', addressText, addressObj);
                    addressData = addressObj || null;
                    lastValidCep = cep;
                    // Só desbloqueia se o campo foi apagado/inválido e depois completado novamente
                    if (!checkboxBlocked) {
                        unblockCheckbox();
                    } else {
                        setCheckboxDisabled(true);
                    }
                    // Se o checkbox já estiver marcado, verifica se o endereço mudou
                    if ($checkbox.prop('checked')) {
                        // Se o endereço mudou, faz inserção automática
                        if (!lastInsertedAddress || JSON.stringify(lastInsertedAddress) !== JSON.stringify(addressData)) {
                            // Animação de inserção
                            var $label = $checkbox.closest('label');
                            var $fadeSpan = $label.find('span.wc-better-label-fade');
                            if ($fadeSpan.length) {
                                $fadeSpan.stop(true, true).css('opacity', 1).text('Inserindo Endereço...').show();
                            }
                            var data = {
                                action: 'wc_better_insert_address',
                                address: addressData.address || '',
                                city: addressData.city || '',
                                state: addressData.state || '',
                                district: addressData.district || '',
                                postcode: $postcode.val(),
                                context: type,
                                nonce: (typeof wc_better_checkout_vars_shortcode !== 'undefined' ? wc_better_checkout_vars_shortcode.nonce : '')
                            };
                            let ajaxCompleted = false;
                            const ajaxPromise = new Promise((resolve, reject) => {
                                $.ajax({
                                    url: (typeof wc_better_checkout_vars_shortcode !== 'undefined' && wc_better_checkout_vars_shortcode.ajax_url) ? wc_better_checkout_vars_shortcode.ajax_url : '/wp-admin/admin-ajax.php',
                                    method: 'POST',
                                    data: data,
                                    success: function (response) {
                                        ajaxCompleted = true;
                                        resolve(response);
                                    },
                                    error: function () {
                                        ajaxCompleted = true;
                                        reject();
                                    }
                                });
                            });
                            Promise.race([
                                ajaxPromise,
                                new Promise(resolve => setTimeout(resolve, 2000))
                            ]).then(async function () {
                                if (!ajaxCompleted) {
                                    await ajaxPromise;
                                }
                                // Mensagem de sucesso com endereço completo
                                if ($fadeSpan.length && addressData) {
                                    let parts = [];
                                    if (addressData.address) parts.push(addressData.address);
                                    if (addressData.city) parts.push(addressData.city);
                                    if (addressData.district) parts.push(addressData.district);
                                    if (addressData.state) parts.push(addressData.state);
                                    const labelText = 'Endereço inserido: ' + parts.join(' - ');
                                    $fadeSpan.stop(true, true).css('opacity', 1).text(labelText).show();
                                    // Atualiza também a label principal para garantir que não fique com 'Usar o endereço'
                                    updateCheckboxLabel(type, 'success', '', addressData);
                                    fillFields(type, {
                                        address: addressData.address,
                                        city: addressData.city,
                                        state: addressData.state,
                                        neighborhood: addressData.district || addressData.neighborhood || '',
                                        postcode: $postcode.val()
                                    });
                                }
                                // Após inserir, bloqueia o checkbox
                                blockCheckbox();
                                lastInsertedAddress = JSON.parse(JSON.stringify(addressData));
                            }).catch(function () {
                                if ($fadeSpan.length) {
                                    $fadeSpan.stop(true, true).css('opacity', 1).text('Erro ao inserir endereço.').show();
                                }
                            });
                        } else {
                            blockCheckbox();
                        }
                    }
                } else {
                    updateCheckboxLabel(type, 'notfound');
                    setCheckboxDisabled(true);
                    addressData = null;
                    $checkbox.prop('checked', false);
                    checkboxBlocked = false;
                }
            });
            // Evento de change para disparar AJAX ao marcar o checkbox
            $checkbox.on('change', function (e) {
                if (!enableCheckbox) return;
                if (!e.target.checked) return;
                if (!addressData) return;
                if (checkboxBlocked) return; // Não permite desmarcar se bloqueado
                // Animação de inserção
                var $label = $checkbox.closest('label');
                var $fadeSpan = $label.find('span.wc-better-label-fade');
                if ($fadeSpan.length) {
                    $fadeSpan.stop(true, true).css('opacity', 1).text('Inserindo Endereço...').show();
                }
                // Dados para enviar
                var data = {
                    action: 'wc_better_insert_address',
                    address: addressData.address || '',
                    city: addressData.city || '',
                    state: addressData.state || '',
                    district: addressData.district || '',
                    postcode: $postcode.val(),
                    context: type,
                    nonce: (typeof wc_better_checkout_vars_shortcode !== 'undefined' ? wc_better_checkout_vars_shortcode.nonce : '')
                };
                let ajaxCompleted = false;
                // Promise para requisição AJAX
                const ajaxPromise = new Promise((resolve, reject) => {
                    $.ajax({
                        url: (typeof wc_better_checkout_vars_shortcode !== 'undefined' && wc_better_checkout_vars_shortcode.ajax_url) ? wc_better_checkout_vars_shortcode.ajax_url : '/wp-admin/admin-ajax.php',
                        method: 'POST',
                        data: data,
                        success: function (response) {
                            ajaxCompleted = true;
                            resolve(response);
                        },
                        error: function () {
                            ajaxCompleted = true;
                            reject();
                        }
                    });
                });
                // Aguarda mínimo de 2s e AJAX
                Promise.race([
                    ajaxPromise,
                    new Promise(resolve => setTimeout(resolve, 2000))
                ]).then(async function () {
                    if (!ajaxCompleted) {
                        await ajaxPromise;
                    }
                    // Mensagem de sucesso com endereço completo
                    if ($fadeSpan.length && addressData) {
                        let parts = [];
                        if (addressData.address) parts.push(addressData.address);
                        if (addressData.city) parts.push(addressData.city);
                        if (addressData.district) parts.push(addressData.district);
                        if (addressData.state) parts.push(addressData.state);
                        const labelText = 'Endereço inserido: ' + parts.join(' - ');
                        $fadeSpan.stop(true, true).css('opacity', 1).text(labelText).show();
                    }
                    // Preenche os campos do checkout clássico (shortcode) igual ao modelo dos Correios
                    if (addressData && type) {
                        fillFields(type, {
                            address: addressData.address,
                            city: addressData.city,
                            state: addressData.state,
                            neighborhood: addressData.district || addressData.neighborhood || '',
                            postcode: $postcode.val()
                        });
                    }
                    // Após inserir, bloqueia o checkbox
                    blockCheckbox();
                }).catch(function () {
                    if ($fadeSpan.length) {
                        $fadeSpan.stop(true, true).css('opacity', 1).text('Erro ao inserir endereço.').show();
                    }
                });
            });
            // Estado inicial ao carregar
            const initialCep = $postcode.val().replace(/\D/g, '');
            setCheckboxDisabled(initialCep.length !== 8);
            $postcode.data('hasInputListener', true);
        }
    });
});