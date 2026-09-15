import intlTelInput from 'intl-tel-input';
import 'intl-tel-input/build/css/intlTelInput.css';
import '../css/WcBetterShippingCalculatorForBrazilIntlTelInputOverrides.css';
import intlTelInputUtils from 'intl-tel-input/build/js/utils.js';
import { pt } from 'intl-tel-input/i18n';

/**
 * Máscara de telefone no checkout em BLOCOS do WooCommerce.
 *
 * Cobre dois cenários do modo "Padrão WooCommerce" (campo nativo) e do modo
 * "Destaque do Campo Telefone" (campo próprio do plugin, no topo, após o email):
 *
 *  - Destaque ligado: cria um campo único no topo e esconde os nativos.
 *  - Destaque desligado: aplica a máscara diretamente nos campos nativos do
 *    WooCommerce (#billing-phone/#shipping-phone).
 *
 * Refatorado para usar a formatação NATIVA do intl-tel-input (formatAsYouType +
 * loadUtils, API v25) — o antigo motor de formatação caseiro foi removido.
 * A restrição de digitação (apenas dígitos, com um único "+" inicial) é
 * responsabilidade do sanitizador universal (PublicPhoneSanitizer).
 *
 * O DDI (bandeira + código do país) só é exibido quando as opções
 * "Telefone com Máscara e DDI" E "Exibir Código do País (DDI)" estão ligadas.
 */
document.addEventListener('DOMContentLoaded', function () {
    const config = (typeof wc_better_checkout_phone_mask_vars !== 'undefined') ? wc_better_checkout_phone_mask_vars : {};

    const truthy = function (value) {
        return value === 'true' || value === true;
    };

    const phoneMaskEnabled = truthy(config.phoneMaskEnabled);
    const phoneHighlight = truthy(config.highlightPhone);
    const phoneRequired = truthy(config.phoneRequired);
    const showCountryCode = truthy(config.showCountryCode);
    const validateDdd = truthy(config.validateDdd);
    // DDI exibido apenas com máscara + "Exibir Código do País (DDI)".
    const dialCodeShown = phoneMaskEnabled && showCountryCode;

    const NATIVE_SELECTORS = ['#billing-phone', '#shipping-phone', '#billing_phone', '#shipping_phone'];

    // Códigos de discagem (DDI) → ISO do país. Necessário para reabrir o campo
    // já no país salvo (senão o F5 sempre volta ao Brasil). Cobre os países mais
    // usados; para os demais, o país é resolvido pela base da própria lib.
    const DIAL_TO_ISO = {
        '+55': 'br', '+1': 'us', '+44': 'gb', '+33': 'fr', '+49': 'de', '+34': 'es',
        '+39': 'it', '+351': 'pt', '+54': 'ar', '+56': 'cl', '+57': 'co', '+51': 'pe',
        '+52': 'mx', '+93': 'af', '+91': 'in', '+86': 'cn', '+81': 'jp', '+82': 'kr',
        '+61': 'au', '+27': 'za', '+7': 'ru', '+380': 'ua', '+48': 'pl', '+31': 'nl',
        '+32': 'be', '+41': 'ch', '+43': 'at', '+45': 'dk', '+46': 'se', '+47': 'no',
        '+358': 'fi', '+353': 'ie', '+30': 'gr', '+90': 'tr', '+972': 'il', '+966': 'sa',
        '+971': 'ae', '+20': 'eg', '+234': 'ng', '+212': 'ma', '+58': 've', '+593': 'ec',
        '+591': 'bo', '+595': 'py', '+598': 'uy', '+507': 'pa', '+506': 'cr', '+502': 'gt',
        '+503': 'sv', '+504': 'hn', '+505': 'ni', '+1809': 'do', '+1787': 'pr'
    };

    /**
     * DDI salvo para o campo, conforme o endpoint já persistiu em sessão.
     *
     * @param {string} kind 'billing' | 'shipping' | 'custom'
     * @returns {string} Ex.: '+55'
     */
    function savedDialFor(kind) {
        let dial = '';
        if (kind === 'billing') {
            dial = config.billingCountry || '';
        } else if (kind === 'shipping') {
            dial = config.shippingCountry || '';
        } else {
            dial = config.customCountry || '';
        }
        dial = String(dial).replace(/[^\d+]/g, '');
        return dial || '+55';
    }

    /**
     * Resolve o ISO do país a partir do DDI usando a base da lib (fallback para
     * DDI fora do mapa estático).
     *
     * @param {object} iti
     * @param {string} dial Ex.: '+55'
     * @returns {string} Ex.: 'br' (ou '')
     */
    function dialToIso(iti, dial) {
        const clean = String(dial || '').replace(/[^\d]/g, '');
        if (!clean || !iti || typeof iti.getCountryData !== 'function') {
            return '';
        }
        try {
            const data = iti.getCountryData();
            const found = data && data.find(function (country) {
                return String(country.dialCode) === clean;
            });
            if (found && found.iso2) {
                return found.iso2;
            }
        } catch (error) {
            // Silencioso.
        }
        return '';
    }

    // -------------------------- Store API (Blocks) -----------------------------

    const countryState = { billing: '+55', shipping: '+55' };
    const formatterState = { billing: '', shipping: '' };

    function setExtension(namespace, data) {
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const checkoutDispatch = wp.data.dispatch('wc/store/checkout');
                if (checkoutDispatch && checkoutDispatch.setExtensionData) {
                    checkoutDispatch.setExtensionData(namespace, data);
                }
            } catch (error) {
                // Silencioso.
            }
        }

        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            // overwriteDirtyCustomerData: false → o retorno NÃO repõe o endereço
            // que o shopper está editando (o valor já foi gravado no store).
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: namespace,
                data: data,
                overwriteDirtyCustomerData: false
            });
        }
    }

    function sendCountry(kind, dialCode) {
        if (!phoneMaskEnabled) {
            return;
        }

        if (phoneHighlight) {
            // Campo único no topo vale para billing e shipping.
            countryState.billing = dialCode;
            countryState.shipping = dialCode;
        } else {
            countryState[kind] = dialCode;

            // Espelha o DDI no outro lado quando ele NÃO é editável de forma
            // independente — ausente ou oculto (ex.: endereço forçado/padrão, em
            // que o input irmão continua no DOM mas escondido). Checar só a
            // existência não bastava: o irmão oculto mantinha o DDI padrão (+55)
            // e os telefones do pedido não batiam.
            const otherSelector = kind === 'billing'
                ? '#shipping-phone, #shipping_phone'
                : '#billing-phone, #billing_phone';
            const other = document.querySelector(otherSelector);
            const otherEditable = !!other && other.offsetParent !== null;
            if (!otherEditable) {
                countryState.billing = dialCode;
                countryState.shipping = dialCode;
            }
        }

        setExtension('woo_better_phone_country', {
            billing_phone_country_code: countryState.billing,
            shipping_phone_country_code: countryState.shipping
        });
    }

    function sendFormatter(kind, value) {
        const clean = value || '';

        if (phoneHighlight) {
            setExtension('woo_better_phone_formatter', {
                billing_phone_formatted: clean,
                shipping_phone_formatted: clean,
                custom_phone_formatted: clean
            });
            return;
        }

        formatterState[kind] = clean;

        // Envia SEMPRE as três chaves (todas strings). O schema do Store API
        // declara `custom_phone_formatted` como string e valida o objeto no
        // checkout; se a chave for omitida, chega como null e o pedido é
        // rejeitado ("custom_phone_formatted is not of type string"). No modo
        // per-bloco o backend ignora o valor (só usa custom em destaque).
        setExtension('woo_better_phone_formatter', {
            billing_phone_formatted: formatterState.billing || '',
            shipping_phone_formatted: formatterState.shipping || '',
            custom_phone_formatted: ''
        });
    }

    // --------------------- Sincronização com o store do React ------------------

    // Chave de localStorage usada pela própria WooCommerce para marcar que os
    // dados do cliente foram alterados e não devem ser sobrescritos pelo retorno
    // de /cart/extensions (packages/public-api/block-data/cart/utils.ts).
    const DIRTY_FLAG = 'WOOCOMMERCE_CHECKOUT_IS_CUSTOMER_DATA_DIRTY';
    const CART_STORE = 'wc/store/cart';

    function markCustomerDataDirty() {
        try {
            window.localStorage.setItem(DIRTY_FLAG, 'true');
        } catch (error) {
            // localStorage indisponível: ignora.
        }
    }

    /**
     * Escreve o telefone no endereço do carrinho (wc/store/cart).
     *
     * No checkout em blocos o input nativo é CONTROLADO pelo React e renderiza
     * `billingAddress.phone` / `shippingAddress.phone`. Formatar apenas o DOM
     * não basta: no próximo render o React repõe o valor do store e a máscara se
     * perde (o valor "volta" e o cursor pula). Gravando o valor exibido no store,
     * o que o React renderiza casa com o que a lib exibe.
     *
     * @param {string} kind  'billing' | 'shipping'
     * @param {string} value Valor exibido no campo (como a lib formata)
     */
    function commitAddress(kind, value) {
        if (kind !== 'billing' && kind !== 'shipping') {
            return;
        }
        if (typeof wp === 'undefined' || !wp.data || !wp.data.dispatch || !wp.data.select) {
            return;
        }

        let dispatch = null;
        let select = null;
        try {
            dispatch = wp.data.dispatch(CART_STORE);
            select = wp.data.select(CART_STORE);
        } catch (error) {
            return;
        }
        if (!dispatch || !select || typeof select.getCartData !== 'function') {
            return;
        }

        const cart = select.getCartData();
        if (!cart) {
            return;
        }

        const current = (kind === 'billing' ? cart.billingAddress : cart.shippingAddress) || {};
        if (current.phone === value) {
            return; // nada mudou: evita re-render e requisições desnecessárias.
        }

        const address = Object.assign({}, current, { phone: value });
        if (kind === 'billing' && typeof dispatch.setBillingAddress === 'function') {
            dispatch.setBillingAddress(address);
        } else if (kind === 'shipping' && typeof dispatch.setShippingAddress === 'function') {
            dispatch.setShippingAddress(address);
        } else {
            return;
        }

        // Garante que o retorno do extensionCartUpdate não reponha o endereço
        // antigo sobre o valor que acabamos de gravar.
        markCustomerDataDirty();
    }

    /**
     * Lê o telefone atualmente no endereço do carrinho (store do React).
     *
     * @param {string} kind 'billing' | 'shipping'
     * @returns {string}
     */
    function storePhone(kind) {
        if (typeof wp === 'undefined' || !wp.data || !wp.data.select) {
            return '';
        }
        try {
            const select = wp.data.select(CART_STORE);
            if (!select || typeof select.getCartData !== 'function') {
                return '';
            }
            const cart = select.getCartData();
            if (!cart) {
                return '';
            }
            const address = (kind === 'billing' ? cart.billingAddress : cart.shippingAddress) || {};
            return String(address.phone || '');
        } catch (error) {
            return '';
        }
    }

    /**
     * Normaliza o valor do campo para a formatação exibida pela lib e grava no
     * store do React.
     *
     * O valor salvo pode chegar em vários formatos (internacional "+DDI...",
     * nacional só dígitos, ou já formatado). A lib é a autoridade da formatação:
     * combinamos o número no formato internacional e deixamos o `setNumber`
     * (com `formatOnDisplay`) aplicar exatamente o mesmo layout que o campo usa
     * ao digitar — assim o store casa com o que o React renderiza e o campo não
     * "volta" nem ganha prefixos indevidos.
     *
     * `setNumber` só formata quando as utils estão carregadas; por isso usamos
     * `iti.promise` (API pública da lib) e formatamos quando ela está pronta.
     * Só roda quando o campo NÃO está em foco.
     *
     * @param {HTMLInputElement} input
     * @param {object}           iti
     * @param {string}           kind
     */
    function reconcileInitial(input, iti, kind) {
        if (kind === 'custom' || !iti || !input) {
            return;
        }
        // Só faz sentido quando o DDI é exibido em separado: é o único cenário em
        // que o store não deve conter o "+DDI" (o código fica na bandeira).
        if (!dialCodeShown) {
            return;
        }
        // Nunca mexe enquanto o campo está em foco (evita pular o cursor).
        if (document.activeElement === input) {
            return;
        }

        const raw = (storePhone(kind) || String(input.value || '')).trim();
        const digits = raw.replace(/\D/g, '');
        if (!digits) {
            return;
        }
        // Já está formatado (tem separadores além do eventual "+"): nada a fazer.
        if (/[^\d+]/.test(raw)) {
            return;
        }

        // Monta o número internacional: mantém o "+DDI" existente ou prefixa o do
        // país selecionado.
        const dial = dialCodeOf(iti);
        const international = (raw.charAt(0) === '+') ? ('+' + digits) : (dial + digits);

        const apply = function () {
            if (document.activeElement === input) {
                return;
            }
            // Evita que o "countrychange" disparado pelo setNumber envie as
            // extensões no meio da formatação.
            input.dataset.wcBetterSettling = 'true';
            try {
                iti.setNumber(international);
            } catch (error) {
                input.dataset.wcBetterSettling = 'false';
                return;
            }
            input.dataset.wcBetterSettling = 'false';

            // Alinha o store do React e o backend/ordem com o valor exibido.
            commitAddress(kind, input.value);
            sendFormatter(kind, input.value);
        };

        if (iti.promise && typeof iti.promise.then === 'function') {
            iti.promise.then(apply).catch(function () {
                // Silencioso.
            });
        } else {
            apply();
        }
    }

    // ------------------------------- Utilidades --------------------------------

    function applyPadding(input) {
        if (!input || input.tagName !== 'INPUT') {
            return;
        }

        // Com DDI visível a bandeira + código ocupam mais espaço (~78px).
        const fallbackPadding = dialCodeShown ? 78 : 52;
        let inputPadding = fallbackPadding;
        const pl = input.style.paddingLeft || window.getComputedStyle(input).paddingLeft;
        if (pl && pl.endsWith('px')) {
            inputPadding = parseInt(pl.replace('px', ''), 10) || fallbackPadding;
        }
        input.style.setProperty('padding-left', inputPadding + 'px', 'important');

        const labelPad = (inputPadding + 2) + 'px';
        const container = input.closest('.wc-block-components-text-input, .form-row');
        if (!container) {
            return;
        }

        // Label do campo (temas clássicos e campo nativo em blocos).
        const label = container.querySelector('label');
        if (label) {
            label.style.setProperty('padding-left', labelPad, 'important');
            label.style.transition = 'all 0.3s ease';

            // Labels "flutuantes"/acessíveis usam left, não padding.
            if (label.classList.contains('screen-reader-text') || window.getComputedStyle(label).position === 'absolute') {
                label.style.setProperty('left', labelPad, 'important');
                label.style.setProperty('padding-left', '0px', 'important');
            }
        }

        // Label flutuante do checkout em blocos.
        const blockLabel = container.querySelector('.wc-block-components-text-input__label');
        if (blockLabel) {
            blockLabel.style.setProperty('padding-left', labelPad, 'important');
            blockLabel.style.transition = 'all 0.3s ease';
        }
    }

    function dialCodeOf(iti) {
        if (iti) {
            try {
                const data = iti.getSelectedCountryData();
                if (data && data.dialCode) {
                    return '+' + data.dialCode;
                }
            } catch (error) {
                // Silencioso.
            }
        }
        return '+55';
    }

    // -------------------------- Inicialização de campo -------------------------

    /**
     * Normaliza o valor que o autofill/autocomplete injeta no campo.
     *
     * Mesma regra do checkout clássico:
     *  - "+55..."            → remove o DDI (a bandeira já o representa) e remonta.
     *  - "55..." (>=12 díg.) → DDI embutido sem "+": remove para não duplicar.
     *  - sem "+" e sem "55"  → insere direto, sem tratativa (não prefixa DDI).
     *  - "+<outro DDI>"      → estrangeiro: não mexemos (a lib troca a bandeira).
     *
     * @param {HTMLInputElement} field
     * @param {object}           iti
     * @param {string}           kind
     */
    function normalizeAutofill(field, iti, kind, force) {
        const raw = String(field.value || '').trim();
        if (!raw) {
            return;
        }

        const digits = raw.replace(/\D/g, '');
        if (!digits) {
            return;
        }

        // DDI brasileiro embutido no número (com ou sem "+"). Detecta pelo
        // CONTEÚDO ("55" no início + tamanho internacional), independente da
        // bandeira selecionada — o próprio número informa o país.
        const brazilianDial = digits.indexOf('55') === 0 && digits.length >= 12;

        let national = null;

        if (raw.charAt(0) === '+') {
            if (brazilianDial) {
                national = digits.slice(2);
            } else {
                // DDI estrangeiro explícito: deixa a lib trocar a bandeira.
                return;
            }
        } else if (brazilianDial) {
            // DDI brasileiro sem "+" (ex.: "5585988888888"): remove para não duplicar.
            national = digits.slice(2);
        } else {
            // Sem "+" e sem o DDI "55" embutido: insere direto, sem tratativa.
            // Não prefixa DDI — a bandeira selecionada resolve o DDI no envio.
            return;
        }

        if (!national || national.length < 10) {
            return;
        }

        const international = '+55' + national;
        const apply = function () {
            // "force" (evento input/autocomplete) aplica mesmo com o campo em
            // foco, para a correção ser imediata; nos demais casos preserva o
            // foco para não pular o cursor durante a digitação.
            if (!force && document.activeElement === field) {
                return;
            }
            field.dataset.wcBetterNormalizing = 'true';
            try {
                iti.setNumber(international);
            } catch (error) {
                field.dataset.wcBetterNormalizing = 'false';
                return;
            }
            field.dataset.wcBetterNormalizing = 'false';

            if (kind !== 'custom') {
                commitAddress(kind, field.value);
            }
            sendFormatter(kind, field.value);
        };

        if (iti.promise && typeof iti.promise.then === 'function') {
            iti.promise.then(apply).catch(function () {
                field.dataset.wcBetterNormalizing = 'false';
            });
        } else {
            apply();
        }
    }

    function initField(input, kind) {
        if (!input || input.dataset.wcBetterPhoneInit === 'true') {
            return;
        }
        input.dataset.wcBetterPhoneInit = 'true';

        input.setAttribute('inputmode', 'numeric');
        // Número nacional (sem código do país): reduz a chance do navegador
        // autocompletar com "+55" embutido no campo.
        input.setAttribute('autocomplete', 'tel-national');

        let iti = null;
        if (phoneMaskEnabled) {
            const savedDial = savedDialFor(kind);
            const knownIso = DIAL_TO_ISO[savedDial] || '';

            iti = intlTelInput(input, {
                initialCountry: knownIso || 'br',
                preferredCountries: ['br'],
                // Exibe a bandeira + o código do país (DDI) quando habilitado.
                separateDialCode: dialCodeShown,
                nationalMode: false,
                formatOnDisplay: true,
                // Na v25 a opção "utilsScript" foi removida; sem loadUtils a lib
                // fica sem utils e a formatação enquanto digita não acontece.
                loadUtils: function () {
                    return Promise.resolve({ default: intlTelInputUtils });
                },
                autoHideDialCode: false,
                placeholderNumberType: 'MOBILE',
                showSelectedDialCode: false,
                allowDropdown: true,
                autoPlaceholder: 'off',
                strictMode: false,
                validation: false,
                // Valida o número usando a metadata do libphonenumber (~300 países).
                // Fixo + celular: sem esta opção o default ['MOBILE'] rejeitaria fixo.
                validationNumberTypes: ['FIXED_LINE', 'MOBILE'],
                i18n: pt
            });
            input.dataset.intlTelInputInitialized = 'true';

            // DDI salvo fora do mapa: resolve pela base da lib. Roda ANTES de
            // ligar os listeners para não disparar flush/commit durante o init.
            if (savedDial && !knownIso) {
                const iso = dialToIso(iti, savedDial);
                if (iso && iso !== 'br') {
                    try {
                        iti.setCountry(iso);
                    } catch (error) {
                        // Silencioso.
                    }
                }
            }
        }

        // Instância reutilizável (reconciliação do valor salvo com o store).
        input.wcBetterIti = iti;

        const isCustom = (kind === 'custom');

        applyPadding(input);

        // Normaliza o valor já presente (autofill que veio antes do JS rodar).
        if (iti) {
            normalizeAutofill(input, iti, kind);
        }

        let timer = null;
        let lastCountry = null;

        // Envia o DDI só quando ele muda (evita 1 requisição por tecla).
        function maybeSendCountry(dialCode) {
            if (lastCountry === dialCode) {
                return;
            }
            lastCountry = dialCode;
            sendCountry(kind, dialCode);
        }

        // Sincroniza as extensões do backend e o store (React) com o valor atual.
        function flush() {
            if (!isCustom) {
                // Input nativo é controlado pelo React: gravar o valor exibido no
                // store mantém React e lib de acordo (sem reversão/pulos).
                commitAddress(kind, input.value);
            }
            maybeSendCountry(dialCodeOf(iti));
            // Envia o valor EXIBIDO (sem o DDI quando ele aparece na bandeira).
            // O pedido remonta o internacional via `_*_phone_country_code`
            // (format_order_billing_phone → format_complete_phone). Mandar o
            // internacional aqui fazia o backend devolver "+DDI..." para o campo.
            sendFormatter(kind, input.value);
        }

        function scheduleFlush() {
            if (timer) {
                clearTimeout(timer);
            }
            timer = setTimeout(function () {
                timer = null;
                flush();
            }, 250);
        }

        // Campo de destaque é nosso (não React): mantém a classe "is-active" da
        // label flutuante manualmente.
        function refreshActive() {
            if (!isCustom) {
                return;
            }
            const container = input.closest('.wc-block-components-text-input');
            if (container) {
                container.classList.toggle('is-active', input.value.trim() !== '');
            }
        }

        input.addEventListener('countrychange', function () {
            applyPadding(input);
            clearPhoneError(input);
            // Mudança de país programática (reconciliação do valor salvo): não
            // envia extensões — o valor ainda está sendo normalizado.
            if (input.dataset.wcBetterSettling === 'true') {
                return;
            }
            flush();
        });

        input.addEventListener('focus', function () {
            if (!isCustom) {
                return;
            }
            const container = input.closest('.wc-block-components-text-input');
            if (container) {
                container.classList.add('is-active');
            }
        });

        input.addEventListener('input', function () {
            // Assim que o shopper corrige o valor, remove o estado de erro para
            // o campo não ficar "vermelho travado" parecendo sem solução.
            clearPhoneError(input);
            refreshActive();

            // Autofill/autocomplete injeta o valor e dispara "input": normaliza
            // já (remove o DDI embutido) sem esperar o blur.
            if (iti) {
                normalizeAutofill(input, iti, kind, true);
            }

            // Grava já no store (no próximo tick, depois de o React processar o
            // evento) para o valor renderizado casar com o exibido pela lib.
            if (!isCustom) {
                setTimeout(function () {
                    commitAddress(kind, input.value);
                }, 0);
            }

            scheduleFlush();
        });

        input.addEventListener('blur', function () {
            flush();
            refreshActive();
        });

        // Autofill/autocomplete dispara "change": normaliza o formato injetado.
        input.addEventListener('change', function () {
            if (input.dataset.wcBetterNormalizing === 'true') {
                return;
            }
            clearPhoneError(input);
            if (iti) {
                normalizeAutofill(input, iti, kind);
            }
        });

        // Sincroniza o DDI já no load (mesmo sem interação do usuário). Envia
        // SOMENTE o país — nunca o formatter aqui — para o pedido registrar o
        // `_*_phone_country_code` mesmo quando o telefone já vem preenchido e o
        // shopper não redigita.
        maybeSendCountry(dialCodeOf(iti));
    }

    // ------------------------- Campo de destaque (topo) ------------------------

    function emailWrapper() {
        const emailField = document.querySelector('#email, input[name="contact_email"], input[name="billing_email"]');
        return emailField ? emailField.closest('.wc-block-components-text-input, .form-row') : null;
    }

    function buildHighlightContainer() {
        const container = document.createElement('div');
        container.className = 'wc-block-components-text-input wc-block-components-address-form__phone wc-better-phone';
        container.id = 'wc-custom-phone-field';

        const labelText = phoneRequired ? 'Telefone' : 'Telefone (opcional)';

        const input = document.createElement('input');
        input.type = 'tel';
        input.id = 'custom-phone';
        input.name = 'custom_phone';
        input.autocomplete = 'tel-national';
        input.setAttribute('aria-label', labelText);

        const label = document.createElement('label');
        label.setAttribute('for', 'custom-phone');
        label.textContent = labelText;

        const value = config.customPhone || '';
        if (value) {
            input.value = value;
            container.classList.add('is-active');
        }

        container.appendChild(input);
        container.appendChild(label);

        return container;
    }

    function placeHighlight() {
        const existing = document.getElementById('custom-phone');
        if (existing) {
            initField(existing, 'custom');
            applyPadding(existing);
            return;
        }

        const reference = emailWrapper();
        if (!reference) {
            return;
        }

        const container = buildHighlightContainer();
        reference.insertAdjacentElement('afterend', container);
        const input = container.querySelector('#custom-phone');
        initField(input, 'custom');
        applyPadding(input);
    }

    function hideNativeFields() {
        NATIVE_SELECTORS.forEach(function (selector) {
            const field = document.querySelector(selector);
            if (!field) {
                return;
            }
            const wrapper = field.closest('.wc-block-components-text-input, .form-row');
            if (wrapper && wrapper.id !== 'wc-custom-phone-field') {
                wrapper.style.display = 'none';
            }
        });
    }

    // ------------------------------- Orquestração ------------------------------

    function kindOf(input) {
        if (input.id && input.id.indexOf('billing') !== -1) {
            return 'billing';
        }
        if (input.id && input.id.indexOf('shipping') !== -1) {
            return 'shipping';
        }
        return null;
    }

    function syncFields() {
        if (phoneHighlight) {
            hideNativeFields();
            placeHighlight();
            return;
        }

        NATIVE_SELECTORS.forEach(function (selector) {
            const field = document.querySelector(selector);
            const kind = field ? kindOf(field) : null;
            if (field && kind) {
                initField(field, kind);
                // Reaplica o deslocamento a cada render: o React restaura o
                // padding padrão do input/label ao re-renderizar o checkout,
                // o que volta a desalinhar a label (mesmo motivo pelo qual o
                // campo próprio reaplica em todo refresh).
                applyPadding(field);
                // Alinha o valor salvo (internacional) com o store do React.
                reconcileInitial(field, field.wcBetterIti, kind);
            }
        });
    }

    // Bloqueia o envio quando o telefone é obrigatório e vazio, ou quando a
    // validação está ativa e o número é inválido para o país selecionado.
    //
    // A validação usa a metadata do libphonenumber (via intl-tel-input), que
    // cobre ~300 países e valida comprimento + padrão + código de área (DDD).
    let placeOrderBound = false;

    /**
     * Verifica se o telefone é inválido, usando a biblioteca (libphonenumber).
     *
     * @param {HTMLInputElement} field
     * @returns {boolean}
     */
    function phoneErrorCode(field) {
        const iti = field.wcBetterIti;
        if (!iti || typeof iti.isValidNumberPrecise !== 'function') {
            return false;
        }
        // null = utils ainda não carregadas: não bloqueia.
        return iti.isValidNumberPrecise() === false;
    }

    /**
     * Resolve o container visual do campo (o mesmo usado pelos campos nativos
     * do WooCommerce em blocos).
     *
     * @param {HTMLInputElement} field
     * @returns {Element|null}
     */
    function phoneContainer(field) {
        return field ? field.closest('.wc-block-components-text-input, .form-row') : null;
    }

    /**
     * Remove o estado de erro do campo (classe + aria-invalid).
     *
     * @param {HTMLInputElement} field
     */
    function clearPhoneError(field) {
        if (!field) {
            return;
        }
        const container = phoneContainer(field);
        if (container) {
            container.classList.remove('has-error');
        }
        field.setAttribute('aria-invalid', 'false');
    }

    function showPhoneError(field, message) {
        if (!field) {
            return;
        }
        if (message) {
            try {
                if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
                    const notices = wp.data.dispatch('core/notices');
                    if (notices && typeof notices.createErrorNotice === 'function') {
                        notices.createErrorNotice(message, { context: 'wc/checkout' });
                    }
                }
            } catch (error) {
                // Silencioso.
            }
        }
        // Mesmo efeito visual dos campos nativos do WooCommerce em blocos:
        // a borda/box-shadow vermelha vem da classe "has-error" no container
        // .wc-block-components-text-input combinada com aria-invalid no input.
        const container = phoneContainer(field);
        if (container) {
            container.classList.add('has-error');
        }
        field.setAttribute('aria-invalid', 'true');
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(function () {
            field.focus();
        }, 250);
    }

    function bindValidation() {
        if ((!phoneRequired && !(validateDdd && phoneMaskEnabled)) || placeOrderBound) {
            return;
        }

        const button = document.querySelector('.wc-block-components-checkout-place-order-button') ||
            document.querySelector('.wc-block-checkout__actions_row button');
        if (!button) {
            return;
        }

        button.addEventListener('click', function (event) {
            const fields = (phoneHighlight
                ? [document.getElementById('custom-phone')]
                : NATIVE_SELECTORS.map(function (selector) { return document.querySelector(selector); })
            ).filter(Boolean);

            // Telefone obrigatório vazio.
            if (phoneRequired) {
                const empty = fields.find(function (field) {
                    return !field.value.trim();
                });
                if (empty) {
                    event.stopPropagation();
                    event.preventDefault();
                    showPhoneError(empty);
                    return;
                }
            }

            // Validação do telefone (comprimento + padrão, via libphonenumber).
            if (validateDdd && phoneMaskEnabled) {
                let invalidField = null;
                fields.some(function (field) {
                    if (!field.value.trim()) {
                        return false;
                    }
                    if (phoneErrorCode(field)) {
                        invalidField = field;
                        return true;
                    }
                    return false;
                });
                if (invalidField) {
                    event.stopPropagation();
                    event.preventDefault();
                    showPhoneError(invalidField, 'Número de telefone inválido.');
                }
            }
        });

        placeOrderBound = true;
    }

    /**
     * Reaplica a normalização de autofill em todos os campos relevantes.
     *
     * O autofill nem sempre dispara "change"; sem isso o valor injetado
     * (ex.: "+55 88 91234-5679") fica sem tratamento até o usuário digitar.
     * A função é idempotente e ignora o campo em foco.
     */
    function normalizeAllFields() {
        if (phoneHighlight) {
            const field = document.getElementById('custom-phone');
            if (field && field.wcBetterIti) {
                normalizeAutofill(field, field.wcBetterIti, 'custom');
            }
            return;
        }

        NATIVE_SELECTORS.forEach(function (selector) {
            const field = document.querySelector(selector);
            const kind = field ? kindOf(field) : null;
            if (field && kind && field.wcBetterIti) {
                normalizeAutofill(field, field.wcBetterIti, kind);
            }
        });
    }

    function refresh() {
        syncFields();
        normalizeAllFields();
        bindValidation();
    }

    const observer = new MutationObserver(refresh);
    observer.observe(document.body, { childList: true, subtree: true });

    refresh();

    // O React pode popular/atualizar o valor do telefone (respostas assíncronas
    // de /cart/extensions e /cart/update-customer) sem mutação de DOM observável.
    // Reforçamos a reconciliação logo após o load e periodicamente, para o campo
    // se auto-corrigir (ex.: valor internacional voltando após o usuário sair do
    // campo). refresh() e reconcileInitial() são idempotentes e ignoram o campo
    // quando ele está em foco.
    [200, 600, 1200, 2000].forEach(function (delay) {
        setTimeout(refresh, delay);
    });
    setInterval(refresh, 1000);
});
