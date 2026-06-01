jQuery(function ($) {
    // Objeto global para rastrear instâncias ativas do CepAddressFetcher
    var activeCepFetchers = {};
    // Valor de CEP pendente de reInjeção após autocomplete do navegador
    var activeCepPendingAutocomplete = {};
    // Flag global para controlar processamento do observer
    var isProcessingAddressUpdate = false;

    // Função para desabilitar checkbox e label
    function disableCheckboxAndLabel(type) {
        var checkboxId = 'wc-better-checkbox-' + type;
        var $checkboxInput = $('#' + checkboxId);
        var $checkboxLabel = $checkboxInput.closest('label');
        $checkboxInput.prop('disabled', true).addClass('wc-better-readonly-disabled').prop('checked', false);
        $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
    }

    // Se a variável global não permitir, não executa NENHUMA lógica do checkbox
    var enableCheckbox = true;
    if (typeof wc_better_checkout_vars !== 'undefined' && wc_better_checkout_vars.fill_checkout_address === 'no') {
        enableCheckbox = false;
    }

    var silentMode = typeof wc_better_checkout_vars !== 'undefined' && wc_better_checkout_vars.silent_address_fill === 'yes';

    function injectSpinnerCss() {
        // SVG stroke-dashoffset approach: no global CSS needed
        if (document.getElementById('wc-better-spinner-css')) return;
        var style = document.createElement('style');
        style.id = 'wc-better-spinner-css';
        style.textContent = '';
        document.head.appendChild(style);
    }

    function insertCustomCheckboxBelowPostcode(type) {
        if (silentMode) {
            // Modo silencioso: cria apenas o fetcher, sem UI de checkbox
            if (!activeCepFetchers[type]) {
                activeCepFetchers[type] = new CepAddressFetcher('#' + type + '-postcode', '', type);
            }
            return;
        }
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
            class: 'wc-block-components-checkbox__input wc-better-readonly-disabled',
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
            { id: `${type}-state`, key: 'state' },
            { id: `${type}-neighborhood`, key: 'district' }  // Adiciona campo de bairro
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
                // Para o campo endereço principal, verifica se existe campo de bairro
                const neighborhoodField = document.getElementById(`${type}-neighborhood`);
                const hasNeighborhoodField = neighborhoodField !== null;
                
                if (value && value.trim() !== '') {
                    let finalAddressValue = value;
                    
                    // Se NÃO tem campo de bairro E tem bairro na API, concatena como fallback
                    if (!hasNeighborhoodField && apiData.district && apiData.district.trim() !== '') {
                        finalAddressValue = `${value} - ${apiData.district}`;
                    }
                    
                    const currentValue = input.value;
                    if (currentValue !== finalAddressValue) {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(input, finalAddressValue);
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
            } else if (field.key === 'district') {
                // Para bairro, tenta preencher no campo específico apenas se ele existir
                const hasNeighborhoodField = input !== null;
                
                // Só preenche o campo de bairro se ele realmente existir
                if (hasNeighborhoodField && value && value.trim() !== '') {
                    const currentValue = input.value;
                    if (currentValue !== value) {
                        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(input, value);
                        if (skipCheck || updateCount <= 1) {
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                        }
                        
                        // Adiciona classe is-active se o campo tiver valor
                        const fieldContainer = input.closest('.wc-block-components-text-input');
                        if (fieldContainer) {
                            fieldContainer.classList.add('is-active');
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
            this._isSilentMode = (typeof wc_better_checkout_vars !== 'undefined' && wc_better_checkout_vars.silent_address_fill === 'yes');
            this._isUserInitiated = false;
            this._spinnerEl = null;
            this._spinnerContainer = null;
            this._spinnerRestoredStatic = false;
            this._spinnerRestoredOverflow = false;
            // Flag de carregamento inicial: impede handleCheckboxChange no remount do componente
            this._isInitialLoad = true;
            // CEP que estava no campo ao criar o fetcher: usado para distinguir init de nova digitação
            this._initialCep = this.sanitizeCep(this.input.val());
            // Flag para detectar sequência de autocomplete: deleteContentBackward seguido de jQuery trigger
            this._prevInputTypeWasDelete = false;
            // Contador de geração: garante que apenas o _silentFillAddress mais recente
            // preenche os campos (aborta fills concorrentes desatualizados)
            this._silentFillGeneration = 0;
            // Timer e handler para interceptação de autocomplete no capture phase
            this._autofillTimer = null;
            this._captureAutofill = null;
            // Flag: indica que insertFromAutofill foi detectado e aguardamos o sintético
            this._autofillInProgress = false;
            // Flag: indica que _silentFillAddress está atualizando o campo CEP para sincronizar
            // o React state — ignora o evento de input gerado para evitar loop de lookup
            this._isFillingPostcode = false;
            
            // Registra esta instância
            activeCepFetchers[context] = this;

            this.init();
        }
        init() {
            if (!this.input.length) return;
            this.input.on('input.wcBetterCep', this.handleInput.bind(this));

            // Intercepta insertFromAutofill/insertReplacementText no capture phase, antes do jQuery.
            // Bloqueia os eventos intermediários do autocomplete do browser (o delete + o fill)
            // e emite um único evento sintético limpo quando o autocomplete termina.
            this._captureAutofill = (evt) => {
                if (evt._wcBetterOwn) return; // próprio evento sintético: deixa passar
                const type = evt.inputType;
                if (type === 'insertFromAutofill' || type === 'insertReplacementText') {
                    // Não bloqueia a propagação: deixa o React ver o evento e atualizar
                    // o estado controlado com o novo CEP. Se bloquearmos aqui, o React
                    // não atualiza seu estado e no próximo render restaura o CEP antigo
                    // no DOM — e nosso sintético capturaria o valor errado.
                    // Usamos a flag para suprimir apenas nosso handler jQuery.
                    this._autofillInProgress = true;
                    clearTimeout(this._autofillTimer);
                    this._isInitialLoad = false; // autocomplete = interação do usuário
                    this._autofillTimer = setTimeout(() => {
                        if (!this.input || !this.input[0]) return;
                        this._autofillInProgress = false;
                        const synth = new Event('input', { bubbles: true });
                        synth._wcBetterOwn = true;
                        this.input[0].dispatchEvent(synth);
                    }, 0);
                }
            };
            this.input[0].addEventListener('input', this._captureAutofill, true);

            // Armazena referência ao checkbox
            this.checkboxInput = this.checkboxLabel.find('input[type="checkbox"]');
            // Adiciona evento de change para disparar AJAX
            this.checkboxInput.on('change.wcBetterCep', this.handleCheckboxChange.bind(this));
            
            // Modo não-silencioso: consulta o CEP para exibir sugestão no checkbox.
            // O checkbox começa desabilitado — o preenchimento só ocorre quando o usuário confirmá-lo.
            // Modo silencioso: aguarda o usuário digitar (sem UI de checkbox).
            if (!this._isSilentMode) {
                const initialCep = this.sanitizeCep(this.input.val());
                if (this.isValidCep(initialCep)) {
                    this.handleInput({ target: { value: initialCep } });
                }
            }
        }

        destroy() {
            this._hideBorderSpinner();
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
            
            // Cancela timer de autocomplete e remove capture listener
            if (this._autofillTimer) {
                clearTimeout(this._autofillTimer);
                this._autofillTimer = null;
            }
            if (this._captureAutofill && this.input && this.input[0]) {
                this.input[0].removeEventListener('input', this._captureAutofill, true);
                this._captureAutofill = null;
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
                $checkboxInput.prop('disabled', true).addClass('wc-better-readonly-disabled');
                $checkboxInput.closest('label').addClass('wc-better-checkbox-disabled-label');
            }
            // Se marcou o checkbox e tem endereço
            // Limpa o campo de número customizado e ajusta checkbox
            var numberFieldId = this.context + '-number';
            var $numberInput = $('#' + numberFieldId);
            if ($numberInput.length) {
                $numberInput.val('').prop('readonly', false).removeAttr('style').trigger('change');
                $numberInput.closest('.wc-block-components-text-input').removeClass('is-active');
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

                                // Limpa campo de número após o re-render do WooCommerce Blocks
                                var $numInput = $('#' + this.context + '-number');
                                if ($numInput.length) {
                                    var numEl = $numInput[0];
                                    var nativeNumSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                                    nativeNumSetter.call(numEl, '');
                                    numEl.dispatchEvent(new Event('input', { bubbles: true }));
                                    numEl.dispatchEvent(new Event('change', { bubbles: true }));
                                    $numInput.prop('readonly', false).removeAttr('style');
                                    $numInput.closest('.wc-block-components-text-input').removeClass('is-active');
                                }

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
            // Monta label dinâmica sem o bairro (que agora vai para campo próprio)
            let parts = [];
            if (address.address) parts.push(address.address);
            if (address.city) parts.push(address.city);
            if (address.state) parts.push(address.state);
            const labelText = `Endereço inserido: ${parts.join(' - ')}`;
            
            $labelSpan.stop(true, true).css('opacity', 1).text(labelText).show();
        }
        async handleInput(event) {
            // Evento disparado por _silentFillAddress para sincronizar o React state com o
            // CEP correto: ignora para não iniciar um novo ciclo de lookup
            if (this._isFillingPostcode) {
                this._isFillingPostcode = false;
                return;
            }

            const nativeEvt = event.originalEvent || event;

            // insertFromAutofill foi interceptado no capture phase: aguarda o sintético
            // que dispara após o React atualizar o estado com o novo valor.
            // Limpa o debounce de qualquer lookup anterior (ex: CEP antigo ainda no timer).
            if (this._autofillInProgress && !nativeEvt._wcBetterOwn) {
                if (this._debounceTimer) {
                    clearTimeout(this._debounceTimer);
                    this._debounceTimer = null;
                }
                return;
            }

            // Lê e atualiza a flag de 'delete anterior' para detectar sequência de autocomplete.
            // Deve ser feito ANTES de qualquer return para manter o estado consistente.
            const _prevWasDelete = this._prevInputTypeWasDelete;
            this._prevInputTypeWasDelete = (nativeEvt.inputType === 'deleteContentBackward');

            this._isUserInitiated = true;
            // Evento real do usuário (isTrusted): marca fim do carregamento inicial
            if (event.isTrusted) {
                this._isInitialLoad = false;
                // Digitação manual real: descarta qualquer valor de autocomplete pendente
                delete activeCepPendingAutocomplete[this.context];
            }
            // Evento sintético do WooCommerce Blocks (isTrusted === false): ignora durante carregamento inicial.
            // Nota: eventos do init() têm isTrusted === undefined, portanto não são bloqueados aqui.
            if (event.isTrusted === false && this._isInitialLoad) {
                return;
            }

            // Nota: insertFromAutofill/insertReplacementText são interceptados no capture phase
            // pelo _captureAutofill antes de chegar aqui — ver init().
            // O path abaixo cobre browsers que disparam deleteContentBackward + evento
            // com inputType indefinido (sem insertFromAutofill).
            if (event.isTrusted === undefined && nativeEvt.inputType === undefined && _prevWasDelete) {
                const cepCandidate = this.sanitizeCep(event.target.value);
                if (this.isValidCep(cepCandidate)) {
                    const savedValue = event.target.value;
                    const context = this.context;
                    activeCepPendingAutocomplete[context] = savedValue;
                    this._isInitialLoad = false;
                    setTimeout(() => {
                        const pending = activeCepPendingAutocomplete[context];
                        if (!pending) return; // cancelado por digitação manual
                        delete activeCepPendingAutocomplete[context];
                        const fetcher = activeCepFetchers[context];
                        if (!fetcher || !fetcher.input || !fetcher.input[0]) return;
                        fetcher._isInitialLoad = false;
                        // Usa o setter nativo do prototype (bypassa tanto nossa interceptação
                        // quanto o tracker interno do React) e dispara evento 'input' nativo
                        // para que o React processe o onChange e atualize seu state.
                        const origSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                        origSetter.call(fetcher.input[0], pending);
                        fetcher.input[0].dispatchEvent(new Event('input', { bubbles: true }));
                    }, 0);
                    return;
                }
            }

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
                if (this._isSilentMode) {
                    // Modo silencioso: desabilita o input do CEP durante a consulta
                    this.input.prop('disabled', true);
                } else {
                    // Desabilita o checkbox imediatamente
                    $checkboxInput.prop('disabled', true);
                    $checkboxInput.addClass('wc-better-readonly-disabled');
                    $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
                }
                
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
                this._isInitialLoad = false;
                return;
            }

            if (address) {
                const previousAddress = this.addressData;
                const previousCep = previousAddress && previousAddress._rawCep ? previousAddress._rawCep : null;
                const currentRawCep = this.input.val();
                
                this.addressData = { ...address, _rawCep: currentRawCep };

                // Limpa o campo de número ao preencher um novo endereço.
                // No modo de sugestão: NÃO limpa aqui — só limpa quando o usuário confirmar o checkbox.
                var $numberInput = $('#' + this.context + '-number');
                if ($numberInput.length && !this._isInitialLoad && this._isSilentMode) {
                    var numberEl = $numberInput[0];
                    var nativeNumberSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    nativeNumberSetter.call(numberEl, '');
                    numberEl.dispatchEvent(new Event('input', { bubbles: true }));
                    numberEl.dispatchEvent(new Event('change', { bubbles: true }));
                    $numberInput.prop('readonly', false).removeAttr('style');
                    $numberInput.closest('.wc-block-components-text-input').removeClass('is-active');
                    var $betterCheckbox = $('#wc-' + this.context + '-better-checkbox');
                    if ($betterCheckbox.length) {
                        $betterCheckbox.prop('checked', false).trigger('change');
                    }
                }

                if (this._isSilentMode) {
                    // Bloqueia o fill automático SOMENTE se o CEP não mudou desde a criação do fetcher.
                    if (this._isInitialLoad && cep === this._initialCep) {
                        this._hideBorderSpinner();
                        if (this.input && this.input.length) {
                            this.input.prop('disabled', false);
                        }
                        this._isInitialLoad = false;
                        return;
                    }
                    // CEP diferente do inicial (ou _isInitialLoad já false) → preenche normalmente
                    this._isInitialLoad = false;
                    // Modo silencioso: mantém o input desabilitado durante o AJAX
                    // _silentFillAddress irá reabilitá-lo após o servidor confirmar
                    this._hideBorderSpinner();
                    this._silentFillAddress(address, cep);
                } else {
                    this.updateCheckboxLabel(address);
                    
                    $checkboxInput.prop('disabled', false);
                    $checkboxInput.removeClass('wc-better-readonly-disabled');
                    $checkboxLabel.removeClass('wc-better-checkbox-disabled-label');
                    
                    // Garante que a inserção automática ocorra se o endereço mudou OU o CEP digitado mudou
                    const shouldAutoInsert = (
                        !previousAddress ||
                        JSON.stringify(previousAddress) !== JSON.stringify(address) ||
                        previousCep !== currentRawCep
                    );
                    
                    // Não dispara auto-insert no carregamento inicial (remount do Blocks)
                    // para evitar que edições manuais do usuário sejam revertidas
                    if (shouldAutoInsert && $checkboxInput.prop('checked') && !this._isInitialLoad) {
                        this.handleCheckboxChange({ target: $checkboxInput[0] });
                    }
                    this._isInitialLoad = false;
                }
            } else {
                this._isInitialLoad = false;
                this._handleAddressNotFound(cep, $checkboxInput, $checkboxLabel);
            }
        }
        
        _handleInvalidCep($checkboxInput, $checkboxLabel) {
            if (this._isSilentMode) {
                this._hideBorderSpinner();
                this.input.prop('disabled', false);
                return;
            }
            $checkboxInput.prop('disabled', true);
            $checkboxInput.addClass('wc-better-readonly-disabled');
            $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
            $checkboxInput.prop('checked', false);
            if (this.checkboxLabel.length) {
                const $labelSpan = this.checkboxLabel.find('.wc-block-components-checkbox__label');
                $labelSpan.text('Informe acima o código Postal (CEP).');
            }
        }
        
        _handleAddressNotFound(cep, $checkboxInput, $checkboxLabel) {
            this.addressData = null;
            if (this._isSilentMode) {
                this._hideBorderSpinner();
                this.input.prop('disabled', false);
            } else {
                this.showNotFoundLabel();
                $checkboxInput.prop('disabled', true);
                $checkboxInput.addClass('wc-better-readonly-disabled');
                $checkboxLabel.addClass('wc-better-checkbox-disabled-label');
                $checkboxInput.prop('checked', false);
            }
            
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
        _showBorderSpinner() {
            injectSpinnerCss();
            const inputEl = this.input && this.input[0];
            if (!inputEl) return;
            const container = inputEl.closest('.wc-block-components-text-input');
            if (!container || container.querySelector('.wc-better-cep-spinner-svg')) return;
            const computedStyle = window.getComputedStyle(container);
            if (computedStyle.position === 'static') {
                container.style.position = 'relative';
                this._spinnerRestoredStatic = true;
            }
            if (computedStyle.overflow === 'hidden') {
                container.style.overflow = 'visible';
                this._spinnerRestoredOverflow = true;
            }
            this._spinnerContainer = container;

            const bw = parseFloat(computedStyle.borderTopWidth) || 1;
            // Raio da linha central do traço SVG: metade da borda para dentro do raio externo
            const outerRadius = parseFloat(computedStyle.borderTopLeftRadius) || 4;
            const rx = Math.max(0, outerRadius - bw / 2);
            const ow = container.offsetWidth;
            const oh = container.offsetHeight;

            // Perímetro do retângulo arredondado (linha central do traço)
            const straightW = Math.max(0, ow - bw - 2 * rx);
            const straightH = Math.max(0, oh - bw - 2 * rx);
            const perimeter = 2 * (straightW + straightH) + 2 * Math.PI * rx;
            const trailLength = perimeter * 0.25; // 25% = comprimento da cobrinha

            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('width', ow);
            svg.setAttribute('height', oh);
            svg.setAttribute('class', 'wc-better-cep-spinner-svg');
            svg.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:5;overflow:visible;';

            const rectEl = document.createElementNS(ns, 'rect');
            rectEl.setAttribute('x', bw / 2);
            rectEl.setAttribute('y', bw / 2);
            rectEl.setAttribute('width', ow - bw);
            rectEl.setAttribute('height', oh - bw);
            rectEl.setAttribute('rx', rx);
            rectEl.setAttribute('ry', rx);
            rectEl.setAttribute('fill', 'none');
            rectEl.setAttribute('stroke', '#555');
            rectEl.setAttribute('stroke-width', bw + 1); // +1px para ficar visível sobre a borda
            rectEl.setAttribute('stroke-dasharray', `${trailLength} ${perimeter - trailLength}`);
            rectEl.setAttribute('stroke-linecap', 'round');

            svg.appendChild(rectEl);
            container.appendChild(svg);
            this._spinnerEl = svg;

            // Anima o traço percorrendo a borda: stroke-dashoffset 0 → -perimeter = 1 volta completa
            rectEl.animate(
                [{ strokeDashoffset: '0' }, { strokeDashoffset: `${-perimeter}` }],
                { duration: 1200, iterations: Infinity, easing: 'linear' }
            );
        }

        _hideBorderSpinner() {
            if (this._spinnerEl) {
                this._spinnerEl.remove();
                this._spinnerEl = null;
            }
            if (this._spinnerRestoredStatic && this._spinnerContainer) {
                this._spinnerContainer.style.position = '';
                this._spinnerRestoredStatic = false;
            }
            if (this._spinnerRestoredOverflow && this._spinnerContainer) {
                this._spinnerContainer.style.overflow = '';
                this._spinnerRestoredOverflow = false;
            }
            this._spinnerContainer = null;
        }

        async _silentFillAddress(address, rawCep = null) {
            const generation = ++this._silentFillGeneration;
            const context = this.context;
            // Usa o cep capturado no momento do lookup, não o valor atual do input
            // (o WC Blocks pode ter re-renderizado e restaurado um valor antigo no campo)
            const postcode = rawCep ? this.formatCep(rawCep) : this.formatCep(this.input.val());

            // Atualiza o campo CEP imediatamente com o valor correto antes de aguardar o AJAX.
            // Isso evita que o campo mostre apenas os dígitos parciais digitados pelo usuário
            // enquanto a requisição está em andamento (o React tende a restaurar seu state anterior).
            const postcodeInputEl = document.getElementById(context + '-postcode');
            if (postcodeInputEl && postcodeInputEl.value !== postcode) {
                this._isFillingPostcode = true;
                const postcodeNativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                postcodeNativeSetter.call(postcodeInputEl, postcode);
                postcodeInputEl.dispatchEvent(new Event('input', { bubbles: true }));
            }

            const data = {
                action: 'wc_better_insert_address',
                address: address.address,
                city: address.city,
                state: address.state,
                district: address.district,
                postcode: postcode,
                context: context,
                nonce: (typeof wc_better_checkout_vars !== 'undefined' ? wc_better_checkout_vars.nonce : '')
            };

            // Salva o endereço na sessão PHP antes de preencher os campos.
            let ajaxCompleted = false;
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

            await Promise.race([
                ajaxPromise,
                new Promise(resolve => setTimeout(resolve, 5000))
            ]);
            if (!ajaxCompleted) {
                await ajaxPromise.catch(() => {});
            }

            // Reabilita o input do CEP
            if (this.input && this.input.length) {
                this.input.prop('disabled', false);
            }

            // Aborta se um fill mais recente já iniciou (usuário selecionou outro autocomplete
            // enquanto este AJAX estava em andamento)
            if (generation !== this._silentFillGeneration) {
                return;
            }

            // Preenche os campos de endereço diretamente via setter nativo do React.
            // Não usa invalidateResolutionForStore para evitar que o WC Blocks re-busque
            // do servidor e restaure o CEP antigo no input, causando um ciclo de lookups.
            // O WC Blocks detecta as mudanças de estado via eventos 'input' que
            // updateAddressFields dispara e recalcula o frete automaticamente.
            updateAddressFields(context, { ...data, skipProcessingCheck: true });

            // Limpa campo de número após o preenchimento
            var $numInput = $('#' + context + '-number');
            if ($numInput.length) {
                var numEl = $numInput[0];
                var nativeNumSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                nativeNumSetter.call(numEl, '');
                numEl.dispatchEvent(new Event('input', { bubbles: true }));
                numEl.dispatchEvent(new Event('change', { bubbles: true }));
                $numInput.prop('readonly', false).removeAttr('style');
                $numInput.closest('.wc-block-components-text-input').removeClass('is-active');
            }
        }

        showLoadingLabel() {
            if (this._isSilentMode) {
                this._showBorderSpinner();
                return;
            }
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
                    const addressData = {
                        city: data.city,
                        state: data.state,
                        address: data.street,
                        district: data.neighborhood || '',
                    };
                    
                    return addressData;
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
                    const addressData = {
                        city: data.localidade,
                        state: data.uf,
                        address: data.logradouro,
                        district: data.bairro || '',
                    };
                    
                    return addressData;
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
            // Monta label dinâmica sem o bairro (que agora vai para campo próprio)
            let parts = [];
            if (address.address) parts.push(address.address);
            if (address.city) parts.push(address.city);
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
            
            // Só remove o número se ele existir nos dados e ainda não foi processado
            if (numero && $addressInput.length && !$addressInput.data('number-processed')) {
                var currentValue = $addressInput.val();
                if (currentValue && currentValue.includes(numero)) {
                    // Remove apenas o número do final, preservando o bairro
                    var regex = new RegExp('\\s*[–-]\\s*' + numero.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
                    var newValue = currentValue.replace(regex, '').trim();
                    if (newValue !== currentValue) {
                        var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call($addressInput[0], newValue);
                        $addressInput[0].dispatchEvent(new Event('input', { bubbles: true }));
                        // Marca como processado para evitar múltiplas remoções
                        $addressInput.data('number-processed', true);
                    }
                }
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
    
    // Verificação forçada para garantir que billing e shipping sejam processados
    setTimeout(function() {
        ['billing', 'shipping'].forEach(function(baseId) {
            var $addressInput = $('#' + baseId + '-address_1');
            
            // Tenta múltiplos seletores para o div do postcode
            var $divComponent = $('.wc-block-components-address-form__postcode input[id="' + baseId + '-postcode"]').parent();
            
            // Se não encontrou, tenta outros seletores
            if ($divComponent.length === 0) {
                $divComponent = $('#' + baseId + '-postcode').parent();
            }
            
            if ($divComponent.length === 0) {
                $divComponent = $('input[id="' + baseId + '-postcode"]').closest('.wc-block-components-address-form__postcode');
            }
            
            var priorityClass = 'woo-better-priority-' + baseId;
            
            // Processa independentemente se encontrou o div ou não
            if ($addressInput.length > 0) {
                if ($divComponent.length > 0) {
                    $divComponent.addClass(priorityClass);
                }
                
                var billingNumber = (window.wc_better_checkout_vars && window.wc_better_checkout_vars.billing_number) || '';
                var shippingNumber = (window.wc_better_checkout_vars && window.wc_better_checkout_vars.shipping_number) || '';
                var numero = (baseId === 'billing' ? billingNumber : shippingNumber);
                
                if (numero && !$addressInput.data('number-processed')) {
                    var currentValue = $addressInput.val();
                    if (currentValue && currentValue.includes(numero)) {
                        var regex = new RegExp('\\s*[–-]\\s*' + numero.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'i');
                        var newValue = currentValue.replace(regex, '').trim();
                        if (newValue !== currentValue) {
                            var nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                            nativeSetter.call($addressInput[0], newValue);
                            $addressInput[0].dispatchEvent(new Event('input', { bubbles: true }));
                            $addressInput.data('number-processed', true);
                        }
                    }
                }
            }
        });
    }, 1000); // Executa após 1 segundo
});