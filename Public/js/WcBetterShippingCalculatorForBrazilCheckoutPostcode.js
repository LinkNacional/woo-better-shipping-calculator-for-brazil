jQuery(function ($) {

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
        // Instancia o monitoramento do CEP para atualizar label
        new CepAddressFetcher('#' + type + '-postcode', 'label[for="' + checkboxId + '"]', type);
    }

    function updateAddressFields(type, apiData) {
        // Mapeia os campos relevantes
        const fieldMap = [
            { id: `${type}-address_1`, key: 'address' },
            { id: `${type}-address_2`, key: 'address_2' },
            { id: `${type}-city`, key: 'city' },
            { id: `${type}-state`, key: 'state' }
        ];

        fieldMap.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input) return;
            const value = apiData[field.key];

            if (field.key === 'state') {
                // Sempre marca SP no select de estado
                input.value = 'SP';
                input.dispatchEvent(new Event('change', { bubbles: true }));
            } else {
                // Limpa o campo se vier vazio ou null
                if (value === '' || value === null || value === undefined) {
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(input, '');
                    input.dispatchEvent(new Event('input', { bubbles: true }));
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
                    $betterCheckbox.prop('checked', false).prop('disabled', true).trigger('change');
                }
            }
            // Se marcou o checkbox e tem endereço
            if (!this.addressData) return;
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
                context: this.context
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

            // Atualiza o endereço do carrinho no Woo Blocks
            if (window.wp && window.wp.data && typeof window.wp.data.dispatch === 'function') {
                try {
                    window.wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress')
                    let observerTimeout;

                    const observer = new MutationObserver((mutations, obs) => {
                        // Verifica se o campo foi atualizado (exemplo: shipping-address_1 existe e está visível)
                        const input = document.getElementById(`${this.context}-address_1`);
                        if (input) {
                            updateAddressFields(this.context, data);
                            clearTimeout(observerTimeout);
                            observerTimeout = setTimeout(() => {
                                obs.disconnect();
                            }, 3000);
                        }
                    });
                    observer.observe(document.body, { childList: true, subtree: true });

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
            if (address.district) parts.push(address.district);
            if (address.state) parts.push(address.state);
            const labelText = `Endereço inserido: ${parts.join(' - ')}`;
            $labelSpan.stop(true, true).css('opacity', 1).text(labelText).show();
        }
        async handleInput(event) {
            const cep = this.sanitizeCep(event.target.value);
            const $checkboxInput = this.checkboxLabel.find('input[type="checkbox"]');

            // Cancela requisição anterior se houver
            if (this._abortController) {
                this._abortController.abort();
            }
            this._abortController = null;
            this._lastCep = cep;
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
                        postcode: this.formatCep(this.input.val()),
                        context: this.context,
                        not_found: true
                    };
                    $.ajax({
                        url: (typeof wc_better_checkout_vars !== 'undefined' && wc_better_checkout_vars.ajax_url) ? wc_better_checkout_vars.ajax_url : '/wp-admin/admin-ajax.php',
                        method: 'POST',
                        data: data
                    });
                    if (window.wp && window.wp.data && typeof window.wp.data.dispatch === 'function') {
                        try {
                            window.wp.data.dispatch('wc/store/cart').invalidateResolutionForStore('shippingAddress');
                        } catch (e) {
                            if (this.checkboxLabel.length) {
                                const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                                $labelSpan.stop(true, true).fadeOut(150, function () {
                                    $labelSpan.text('Não foi possivel atualizar o endereço, tente novamente.').fadeIn(150);
                                });
                            }
                        }
                    }
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
            var $input = $divComponent.find('input');
            if ($input.length === 0) return;
            var baseId = $input.attr('id').replace('-postcode', '');
            var priorityClass = 'woo-better-priority-' + baseId;
            if ($divComponent.hasClass(priorityClass)) return;
            $divComponent.addClass(priorityClass);

            // Movimenta o componente de CEP para antes do address_1
            var $addressInput = $('#' + baseId + '-address_1');
            if ($addressInput.length) {
                var $addressParentDiv = $addressInput.parent();
                $divComponent.insertBefore($addressParentDiv);
            }

            insertCustomCheckboxBelowPostcode(baseId);

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
