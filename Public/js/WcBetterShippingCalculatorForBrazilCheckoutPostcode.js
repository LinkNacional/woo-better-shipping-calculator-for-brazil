jQuery(function ($) {

    // Classe para buscar endereço via CEP e atualizar label do checkbox
    class CepAddressFetcher {
        constructor(inputSelector, checkboxLabelSelector, context = 'shipping') {
            this.input = $(inputSelector);
            this.checkboxLabel = $(checkboxLabelSelector);
            this.context = context;
            this.addressData = null;
            this.checkboxInput = null;
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
            // Se desmarcou o checkbox
            if (!event.target.checked) {
                // Animação de carregando
                this.showLoadingLabel();
                // Aguarda mínimo de 2s
                await new Promise(resolve => setTimeout(resolve, 2000));
                // Se tem endereço, restaura label do endereço
                if (this.addressData) {
                    this.updateCheckboxLabel(this.addressData);
                } else {
                    // Se não tem endereço, mantém label padrão
                    this.showNotFoundLabel();
                }
                return;
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
                postcode: this.sanitizeCep(this.input.val()),
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
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            $labelSpan.stop(true, true).text('Inserindo Endereço...').show();
            this._loadingPulse = setInterval(() => {
                $labelSpan.fadeOut(350, function () {
                    $labelSpan.fadeIn(350);
                });
            }, 350);
        }
        showInsertedLabel(address) {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) clearInterval(this._loadingPulse);
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            const labelText = `Endereço inserido: ${address.address}, ${address.city} - ${address.district} - ${address.state}`;
            $labelSpan.stop(true, true).text(labelText).show();
        }
        async handleInput(event) {
            const cep = this.sanitizeCep(event.target.value);
            const $checkboxInput = this.checkboxLabel.find('input[type="checkbox"]');
            if (this.isValidCep(cep)) {
                // Sempre desabilita o checkbox durante consulta
                $checkboxInput.prop('disabled', true);
                $checkboxInput.addClass('wc-better-checkbox-disabled');
                // Mostra animação de carregando
                this.showLoadingLabel();
                let address;
                // Aguarda resposta ou tempo mínimo de 2s
                await Promise.race([
                    (async () => {
                        address = await this.fetchAddress(cep);
                    })(),
                    new Promise(resolve => setTimeout(resolve, 2000))
                ]);
                // Se ainda não obteve resposta, aguarda até obter
                if (address === undefined) {
                    address = await this.fetchAddress(cep);
                }
                if (address) {
                    // Só dispara inserção automática se o endereço mudou
                    const previousAddress = this.addressData;
                    this.addressData = address;
                    this.updateCheckboxLabel(address);
                    $checkboxInput.prop('disabled', false);
                    $checkboxInput.removeClass('wc-better-checkbox-disabled');
                    if ($checkboxInput.prop('checked')) {
                        // Só dispara se o endereço mudou
                        if (!previousAddress || JSON.stringify(previousAddress) !== JSON.stringify(address)) {
                            this.handleCheckboxChange({ target: $checkboxInput[0] });
                        }
                    }
                } else {
                    this.addressData = null;
                    this.showNotFoundLabel();
                    $checkboxInput.prop('disabled', true);
                    $checkboxInput.addClass('wc-better-checkbox-disabled');
                    $checkboxInput.prop('checked', false);
                    // Apenas limpa o backend, não insere endereço
                    const data = {
                        action: 'wc_better_insert_address',
                        address: '',
                        city: '',
                        state: '',
                        district: '',
                        postcode: this.sanitizeCep(this.input.val()),
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
                $checkboxInput.prop('checked', false); // Garante unchecked se CEP inválido
                if (this.checkboxLabel.length) {
                    const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                    $labelSpan.text('Informe acima o código Postal (CEP).');
                }
            }
        }
        showLoadingLabel() {
            if (!this.checkboxLabel.length) return;
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            $labelSpan.stop(true, true).text('Carregando Endereço...').show();
            this._loadingPulse = setInterval(() => {
                $labelSpan.fadeOut(350, function () {
                    $labelSpan.fadeIn(350);
                });
            }, 350);
        }

        showNotFoundLabel() {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) clearInterval(this._loadingPulse);
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            $labelSpan.stop(true, true).fadeOut(150, function () {
                $labelSpan.text('Não encontramos o endereço, preencha os dados abaixo.').fadeIn(150);
            });
        }
        sanitizeCep(cep) {
            return cep.replace(/\D/g, '');
        }
        isValidCep(cep) {
            return /^\d{8}$/.test(cep);
        }
        async fetchAddress(cep) {
            let address = await this.fetchFromBrasilApi(cep);
            if (!address) {
                address = await this.fetchFromViaCep(cep);
            }
            return address;
        }
        async fetchFromBrasilApi(cep) {
            try {
                const response = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
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
                return null;
            }
            return null;
        }
        async fetchFromViaCep(cep) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
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
                return null;
            }
            return null;
        }
        updateCheckboxLabel(address) {
            if (!this.checkboxLabel.length) return;
            if (this._loadingPulse) clearInterval(this._loadingPulse);
            const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
            const labelText = `Usar o endereço: ${address.address}, ${address.city} - ${address.district} - ${address.state}`;
            $labelSpan.stop(true, true).text(labelText).show();
        }
    }

    function insertCustomCheckboxBelowPostcode(type) {
        var $postcodeInput = $('#' + type + '-postcode');
        if ($postcodeInput.length === 0) return;
        var $parentDiv = $postcodeInput.parent();
        var checkboxId = 'wc-better-checkbox-' + type;
        if ($parentDiv.parent().find('#' + checkboxId).length) return;
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
        if ($parentDiv.next().length) {
            $clonedCheckbox.insertAfter($parentDiv);
        } else {
            $parentDiv.parent().append($clonedCheckbox);
        }
        // Instancia o monitoramento do CEP para atualizar label
        new CepAddressFetcher('#' + type + '-postcode', 'label[for="' + checkboxId + '"]', type);
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
            var $countrySelect = $('#' + baseId + '-country');
            if ($countrySelect.length) {
                var $countryParentDiv = $countrySelect.parent();
                if ($countryParentDiv.next().length) {
                    $divComponent.insertAfter($countryParentDiv);
                } else {
                    $countryParentDiv.parent().append($divComponent);
                }
                insertCustomCheckboxBelowPostcode(baseId);
                $divComponent.css('margin-bottom', '20px');
            }
        });
    });
    observer.observe(document.body, { childList: true, subtree: true });
});
