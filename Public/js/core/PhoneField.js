import 'intl-tel-input/build/css/intlTelInput.css';
import '../../css/WcBetterShippingCalculatorForBrazilIntlTelInputOverrides.css';
import intlTelInput from 'intl-tel-input';
import intlTelInputUtils from 'intl-tel-input/build/js/utils.js';
import { pt } from 'intl-tel-input/i18n';
import {
    attachBrazilPhoneMask,
    brazilMaskType,
    brazilPhoneIsEmpty,
    brazilPhoneInvalid,
    phoneValueForStorage,
    phoneValueVerbatim
} from './BrazilPhoneMask.js';

/**
 * Núcleo do campo de telefone/celular no checkout em BLOCOS do WooCommerce.
 *
 * O campo NATIVO fica sempre oculto (o plugin assume o controle do telefone). Cada
 * "script de campo" (um por campo) chama `bootPhoneField()` com o seu tipo; este
 * núcleo monta o input do zero seguindo as opções (Máscara + DDI, Exibir DDI,
 * Validar, Obrigatório e Destaque), como o campo de destaque do plugin.
 *
 * Sem a opção "Telefone com Máscara e DDI" não há lib/DDI: o campo recebe apenas a
 * MÁSCARA BRASILEIRA (fixo/celular, ver `core/BrazilPhoneMask.js`) e a validação
 * passa a ser a do Brasil.
 *
 * Como são 4 bundles separados (um por campo), o estado é COMPARTILHADO via
 * `window.__wcBetterPhoneFields` para que o `setExtensionData` envie sempre os 4
 * valores corretos (billing/shipping × phone/cellphone) sem um sobrescrever o outro.
 *
 * Posicionamento: com o Destaque ligado, o campo "Telefone" fica logo ABAIXO do
 * e-mail (único, vale para billing/shipping). Sem destaque, os campos ficam em
 * billing e shipping, ABAIXO do bloco do estado, e são recriados em cada re-render
 * do React (ex.: alternar "usar mesmo endereço para cobrança").
 *
 * O valor é enviado via `setExtensionData` (namespace do plugin) e sincronizado com a
 * sessão/perfil do usuário via `extensionCartUpdate` (debounced) — como o campo
 * customizado antigo. O travamento (obrigatório vazio/inválido) ocorre no clique de
 * Finalizar.
 */

var CONTEXTS = ['billing', 'shipping'];
var VALUE_KEYS = ['billing_phone', 'shipping_phone', 'billing_cellphone', 'shipping_cellphone'];

/** Estado compartilhado entre os 4 bundles (um por campo). */
var S = window.__wcBetterPhoneFields;
if (!S) {
    S = window.__wcBetterPhoneFields = {
        inited: false,
        boots: [],
        values: {
            billing_phone: '',
            shipping_phone: '',
            billing_cellphone: '',
            shipping_cellphone: ''
        },
        // DDI (`+55`) por contexto — enviado ao Store API (namespace
        // `woo_better_phone_country`) para o pedido gravar o telefone em E.164.
        countries: {
            billing: '+55',
            shipping: '+55'
        },
        boundButton: null,
        serverTimer: null,
        pendingKinds: {}
    };
}

function truthy(value) {
    return value === 'true' || value === true;
}

function config() {
    return (typeof WooBetterPhoneFieldsData !== 'undefined') ? WooBetterPhoneFieldsData : {};
}

// Lido no carregamento do bundle (a localização é impressa antes do script). Fica no
// escopo do módulo, mas cada bundle lê o mesmo objeto global.
var cfg = config();

function cfgValue(key) {
    return cfg ? cfg[key] : '';
}

/** Namespace do campo "Telefone" (fallback quando não localizado pelo PHP). */
function phoneNamespace() {
    return cfgValue('phoneNamespace') || 'woo_better_phone';
}

/** Namespace do campo "Celular" (fallback quando não localizado pelo PHP). */
function cellphoneNamespace() {
    return cfgValue('cellphoneNamespace') || 'woo_better_cellphone';
}

/**
 * Sufixo "(opcional)" das labels de campo NÃO obrigatório.
 *
 * O WooCommerce blocks monta a label como `sprintf('%s (optional)')` e o clássico
 * (`address-i18n.js`) anexa `<span class="optional">(opcional)</span>`. Como o
 * plugin cria a própria label, ele precisa fazer o mesmo — senão só os campos
 * nativos mostram "(opcional)". O texto vem traduzido do PHP (domínio do
 * WooCommerce, que já tem "opcional" no pt_BR).
 *
 * @returns {string}
 */
function optionalSuffix() {
    var suffix = cfgValue('optionalLabel');

    return (typeof suffix === 'string' && suffix !== '') ? suffix : ' (opcional)';
}

/**
 * Label exibida de um campo: nome + "(opcional)" quando não é obrigatório.
 *
 * @param {object} spec { label, required }
 * @returns {string}
 */
function displayLabel(spec) {
    return spec.required ? spec.label : (spec.label + optionalSuffix());
}

/** Valor atual de uma chave (sempre string). */
function strVal(key) {
    return typeof S.values[key] === 'string' ? S.values[key] : '';
}

/** Payload do namespace do TELEFONE (`billing_phone`/`shipping_phone`). */
function phonePayload() {
    return {
        billing_phone: strVal('billing_phone'),
        shipping_phone: strVal('shipping_phone')
    };
}

/**
 * Payload do namespace do CELULAR (`billing_cellphone`/`shipping_cellphone`).
 *
 * No "Celular e Fixo" SEM o 2º campo (shim), o celular espelha o telefone — mantém
 * a herança do Brazilian/NFe (`_billing_cellphone`). Com o 2º campo, usa o valor
 * digitado nele.
 *
 * @returns {object}
 */
function cellphonePayload() {
    var mode = cfg.mode || 'phone_and_cellphone';
    if (mode === 'phone_and_cellphone' && !truthy(cfgValue('enableCellphone')) && truthy(cfgValue('enableCellphoneShim'))) {
        return {
            billing_cellphone: strVal('billing_phone'),
            shipping_cellphone: strVal('shipping_phone')
        };
    }
    return {
        billing_cellphone: strVal('billing_cellphone'),
        shipping_cellphone: strVal('shipping_cellphone')
    };
}

/**
 * Extensões que um TIPO de campo grava (o que ele deve enviar ao store):
 *  - `phone` → `woo_better_phone`; no "Celular e Fixo" SEM o 2º campo E com o
 *    "Celular Oculto" ligado, também espelha no celular (`woo_better_cellphone`),
 *    p/ NFe/Brazilian. Desligado (padrão), NADA é enviado ao celular.
 *  - `cellphone` → `woo_better_cellphone` (no "Celular e Fixo" com o 2º campo ou
 *    no "Somente Celular").
 *
 * @param {string} kind 'phone' | 'cellphone'
 * @returns {Array<{namespace: string, data: object}>}
 */
function payloadsForKind(kind) {
    var mode = cfg.mode || 'phone_and_cellphone';

    if (kind === 'phone') {
        var out = [];
        if (mode === 'phone_and_cellphone' || mode === 'landline_only') {
            out.push({ namespace: phoneNamespace(), data: phonePayload() });
        }
        if (mode === 'phone_and_cellphone' && !truthy(cfgValue('enableCellphone')) && truthy(cfgValue('enableCellphoneShim'))) {
            out.push({ namespace: cellphoneNamespace(), data: cellphonePayload() });
        }
        return out;
    }

    if (mode === 'cellphone_only' || (mode === 'phone_and_cellphone' && truthy(cfgValue('enableCellphone')))) {
        return [{ namespace: cellphoneNamespace(), data: cellphonePayload() }];
    }

    return [];
}

/**
 * Todas as extensões ativas (seed/init) — união por namespace.
 *
 * @returns {Array<{namespace: string, data: object}>}
 */
function activePayloads() {
    var seen = {};
    return payloadsForKind('phone').concat(payloadsForKind('cellphone')).filter(function (entry) {
        if (seen[entry.namespace]) {
            return false;
        }
        seen[entry.namespace] = true;
        return true;
    });
}

/** Namespace do DDI dos telefones no Store API (lido no backend ao criar o pedido). */
function phoneCountryNamespace() {
    return 'woo_better_phone_country';
}

/** DDI (`+55`) de um contexto, com fallback para o Brasil. */
function countryVal(context) {
    var c = S.countries || {};
    var dial = (context === 'shipping') ? c.shipping : c.billing;
    return dial || '+55';
}

/**
 * Envia os DDIs atuais ao store do checkout (namespace `woo_better_phone_country`).
 *
 * O input do intl-tel-input com `separateDialCode` (opção "Exibir Código do País")
 * mostra apenas o número NACIONAL — o DDI fica num elemento à parte e NÃO entra no
 * `input.value`. Sem enviá-lo por fora, o pedido grava o telefone sem o `+55` (o
 * backend não consegue remontar o E.164). Só age com a máscara ligada.
 */
function pushPhoneCountryToStore() {
    if (!truthy(cfgValue('maskEnabled'))) {
        return;
    }
    if (typeof wp === 'undefined' || !wp.data || !wp.data.dispatch) {
        return;
    }
    try {
        var checkoutDispatch = wp.data.dispatch('wc/store/checkout');
        if (checkoutDispatch && checkoutDispatch.setExtensionData) {
            checkoutDispatch.setExtensionData(phoneCountryNamespace(), {
                billing_phone_country_code: countryVal('billing'),
                shipping_phone_country_code: countryVal('shipping')
            });
        }
    } catch (error) {
        // Silencioso.
    }
}

/**
 * Lê o DDI selecionado no campo e o sincroniza no Store API.
 *
 * No modo destaque o campo é ÚNICO (vale para cobrança e entrega); nos demais, o
 * DDI é gravado por contexto e espelhado no outro lado quando este NÃO tem campo
 * próprio (ex.: "enviar só para o endereço de cobrança").
 *
 * @param {string}           kind    'phone' | 'cellphone'
 * @param {string}           context 'billing' | 'shipping' | 'single'
 * @param {HTMLInputElement} input
 */
function syncPhoneCountry(kind, context, input) {
    if (!truthy(cfgValue('maskEnabled')) || !truthy(cfgValue('showCountryCode'))) {
        return;
    }

    var dial = '+55';
    var iti = input ? input.wcBetterIti : null;
    if (iti && typeof iti.getSelectedCountryData === 'function') {
        var data = iti.getSelectedCountryData();
        if (data && data.dialCode) {
            dial = '+' + String(data.dialCode).replace(/[^0-9]/g, '');
        }
    }

    if (!S.countries) {
        S.countries = { billing: '+55', shipping: '+55' };
    }

    if (context === 'single') {
        S.countries.billing = dial;
        S.countries.shipping = dial;
    } else {
        S.countries[context] = dial;

        var other = (context === 'billing') ? 'shipping' : 'billing';
        if (!document.getElementById(domIdFor(kind, other))) {
            S.countries[other] = dial;
        }
    }

    pushPhoneCountryToStore();
}

/** Envia TODOS os valores atuais ao store do checkout (seed — 1x). */
function pushToStore() {
    if (typeof wp === 'undefined' || !wp.data || !wp.data.dispatch) {
        return;
    }
    try {
        var checkoutDispatch = wp.data.dispatch('wc/store/checkout');
        if (checkoutDispatch && checkoutDispatch.setExtensionData) {
            activePayloads().forEach(function (entry) {
                checkoutDispatch.setExtensionData(entry.namespace, entry.data);
            });
        }
    } catch (error) {
        // Silencioso.
    }
    pushPhoneCountryToStore();
}

/**
 * Sincroniza com o servidor (sessão + metadados do usuário) APENAS o(s) campo(s)
 * editado(s), via `extensionCartUpdate`. É DEBOUNCED e ACUMULA os tipos editados
 * na janela — cada tipo é enviado UMA vez por rajada (editar o celular não
 * dispara requisição do telefone, e vice-versa).
 *
 * @param {string} [kind] 'phone' | 'cellphone'. Sem argumento, envia todos.
 */
function syncToServer(kind) {
    if (!S.pendingKinds) {
        S.pendingKinds = {};
    }
    if (kind === 'phone' || kind === 'cellphone') {
        S.pendingKinds[kind] = true;
    } else {
        S.pendingKinds.phone = true;
        S.pendingKinds.cellphone = true;
    }

    if (S.serverTimer) {
        clearTimeout(S.serverTimer);
    }
    S.serverTimer = setTimeout(function () {
        S.serverTimer = null;
        var kinds = S.pendingKinds;
        S.pendingKinds = {};

        if (!(window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function')) {
            return;
        }

        ['phone', 'cellphone'].forEach(function (k) {
            if (!kinds[k]) {
                return;
            }
            payloadsForKind(k).forEach(function (entry) {
                try {
                    window.wc.blocksCheckout.extensionCartUpdate({
                        namespace: entry.namespace,
                        data: entry.data
                    });
                } catch (error) {
                    // Silencioso.
                }
            });
        });
    }, 500);
}

/**
 * Ajusta o padding do input e da label para o DDI/bandeira não cobrirem o texto.
 *
 * @param {HTMLInputElement} input
 */
function applyPadding(input) {
    if (!input || input.tagName !== 'INPUT') {
        return;
    }

    var dialCodeShown = truthy(cfgValue('maskEnabled')) && truthy(cfgValue('showCountryCode'));
    var fallbackPadding = dialCodeShown ? 78 : 52;
    var inputPadding = fallbackPadding;
    var pl = input.style.paddingLeft || window.getComputedStyle(input).paddingLeft;
    if (pl && pl.endsWith('px')) {
        inputPadding = parseInt(pl.replace('px', ''), 10) || fallbackPadding;
    }
    input.style.setProperty('padding-left', inputPadding + 'px', 'important');

    var labelPad = (inputPadding + 2) + 'px';
    var container = input.closest('.wc-block-components-text-input, .form-row');
    if (!container) {
        return;
    }

    var label = container.querySelector('label');
    if (label) {
        label.style.setProperty('padding-left', labelPad, 'important');
        label.style.transition = 'all 0.3s ease';
        if (label.classList.contains('screen-reader-text') || window.getComputedStyle(label).position === 'absolute') {
            label.style.setProperty('left', labelPad, 'important');
            label.style.setProperty('padding-left', '0px', 'important');
        }
    }

    var blockLabel = container.querySelector('.wc-block-components-text-input__label');
    if (blockLabel) {
        blockLabel.style.setProperty('padding-left', labelPad, 'important');
        blockLabel.style.transition = 'all 0.3s ease';
    }

    // Acompanha o raio da borda do input no botão do país (varia por tema).
    applyCountryRadius(input);
}

/**
 * Aplica o raio de borda do input (lado esquerdo) no botão do país do
 * intl-tel-input, para o campo se adaptar ao tema (às vezes circular, às vezes
 * reto). Alguns temas arredondam o input, outros não; copiamos o valor real.
 *
 * @param {HTMLInputElement} input
 */
function applyCountryRadius(input) {
    if (!input) {
        return;
    }
    var container = input.closest('.wc-block-components-text-input, .form-row');
    if (!container) {
        return;
    }
    var button = container.querySelector('.iti__selected-country');
    if (!button) {
        return;
    }
    var style = window.getComputedStyle(input);
    var topLeft = style.borderTopLeftRadius || '0';
    var bottomLeft = style.borderBottomLeftRadius || '0';
    button.style.setProperty('border-top-left-radius', topLeft, 'important');
    button.style.setProperty('border-bottom-left-radius', bottomLeft, 'important');
}

/**
 * O plugin GERENCIA o telefone? (nos modos "Desabilitar" o campo é do WooCommerce)
 *
 * @returns {boolean}
 */
function managesPhone() {
    var flag = cfgValue('managesPhone');

    // A flag vem do PHP (`phone_mode_hides_native_option()`), para os dois lados não
    // divergirem se um modo novo aparecer. Fallback: lista conhecida.
    if (flag !== '' && typeof flag !== 'undefined') {
        return truthy(flag);
    }

    var mode = cfgValue('mode') || 'phone_and_cellphone';
    return mode !== 'disabled' && mode !== 'disabled_native';
}

/**
 * Aplica a máscara/DDI (intl-tel-input) no input, quando a opção está ligada.
 *
 * Sem a opção ("Telefone com Máscara e DDI" desligada) o campo NÃO fica cru: ele
 * recebe a máscara BRASILEIRA (fixo/celular, sem bandeira e sem DDI), exceto nos
 * modos em que o plugin não gerencia o telefone.
 *
 * @param {HTMLInputElement} input
 * @param {string}           kind    'phone' | 'cellphone'
 * @param {string}           context 'billing' | 'shipping' | 'single'
 */
function applyMask(input, kind, context) {
    if (!input || input.dataset.wcBetterFieldMask === 'true') {
        return;
    }
    input.dataset.wcBetterFieldMask = 'true';
    input.setAttribute('inputmode', 'numeric');

    if (!truthy(cfgValue('maskEnabled'))) {
        if (!managesPhone()) {
            return;
        }
        // Máscara BR pura: o "Telefone" do modo "Celular e Fixo" aceita as DUAS
        // máscaras (autodetecção pelo tamanho); "Somente Fixo" e o campo "Celular"
        // têm máscara própria.
        attachBrazilPhoneMask(input, brazilMaskType(kind, cfgValue('mode')));
        return;
    }

    // A lib distingue fixo de celular. O campo "Celular" só aceita MOBILE. O campo
    // "Telefone" (kind 'phone') só restringe a FIXED_LINE no modo "Somente Fixo";
    // no "Celular e Fixo" ele é "Celular/Telefone" e aceita os dois tipos. Assim um
    // fixo digitado no campo de celular (ou vice-versa) é reprovado, mas o campo
    // principal aceita tanto fixo quanto celular.
    var isCellphone = (kind === 'cellphone');
    var phoneAcceptsBoth = !isCellphone && (cfg.mode !== 'landline_only');
    var numberTypes = isCellphone
        ? ['MOBILE']
        : (phoneAcceptsBoth ? ['FIXED_LINE', 'MOBILE'] : ['FIXED_LINE']);

    var dialCodeShown = truthy(cfgValue('showCountryCode'));
    var iti = null;
    try {
        iti = intlTelInput(input, {
            initialCountry: 'br',
            preferredCountries: ['br'],
            separateDialCode: dialCodeShown,
            nationalMode: false,
            formatOnDisplay: true,
            loadUtils: function () {
                return Promise.resolve({ default: intlTelInputUtils });
            },
            autoHideDialCode: false,
            placeholderNumberType: isCellphone ? 'MOBILE' : (phoneAcceptsBoth ? 'FIXED_LINE_OR_MOBILE' : 'FIXED_LINE'),
            showSelectedDialCode: false,
            allowDropdown: true,
            autoPlaceholder: 'off',
            strictMode: false,
            validation: false,
            validationNumberTypes: numberTypes,
            i18n: pt
        });
    } catch (error) {
        iti = null;
    }

    input.wcBetterIti = iti;

    input.addEventListener('countrychange', function () {
        applyPadding(input);
        // O DDI mudou (troca de bandeira): reenvia ao Store API.
        syncPhoneCountry(kind, context, input);
    });

    if (iti && iti.promise && typeof iti.promise.then === 'function') {
        iti.promise.then(function () { applyPadding(input); }).catch(function () {});
    }
    applyPadding(input);
    setTimeout(function () { applyPadding(input); }, 150);
    setTimeout(function () { applyPadding(input); }, 600);

    // Envia o DDI inicial (Brasil) sem depender de interação.
    syncPhoneCountry(kind, context, input);
}

/**
 * Chaves de valor que um campo grava no store. O telefone alimenta `*_phone`; o
 * celular, `*_cellphone`. O espelho do campo único é aplicado em `cellphonePayload()`.
 *
 * @param {string} kind    'phone' | 'cellphone'
 * @param {string} context 'billing' | 'shipping' | 'single'
 * @returns {string[]}
 */
function fieldKeys(kind, context) {
    var contexts = (context === 'single') ? ['billing', 'shipping'] : [context];
    return contexts.map(function (c) { return c + '_' + kind; });
}

/**
 * Id do INPUT no DOM.
 *
 * No destaque o campo é ÚNICO (vale para billing E shipping), então usa um id
 * combinado `billing_shipping_<kind>` — evita colidir com os campos nativos do
 * WooCommerce e com o campo "Celular" secundário. Nos demais casos (billing /
 * shipping) o id é o do próprio contexto.
 *
 * As chaves de VALOR enviadas ao store continuam separadas (billing_ e shipping_)
 * conforme fieldKeys() — o id combinado é apenas o do elemento no DOM.
 *
 * @param {string} kind    'phone' | 'cellphone'
 * @param {string} context 'billing' | 'shipping' | 'single'
 * @returns {string}
 */
function domIdFor(kind, context) {
    return context === 'single' ? ('billing_shipping_' + kind) : (context + '_' + kind);
}

/**
 * Cria o input de um campo.
 *
 * @param {object}  spec       { kind, label, required }
 * @param {string}  context    'billing' | 'shipping' | 'single'
 * @param {Element} insertAfter
 */
function buildField(spec, context, insertAfter) {
    var valueKeys = fieldKeys(spec.kind, context);
    var id = domIdFor(spec.kind, context);

    var container = document.createElement('div');
    container.className = 'wc-block-components-text-input wc-block-components-address-form__' + spec.kind + ' wc-better-' + spec.kind + '-field';

    var input = document.createElement('input');
    input.type = 'tel';
    input.className = 'wc-better-tel-input';
    input.id = id;
    input.name = id;
    input.setAttribute('autocomplete', 'tel-national');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('inputmode', 'numeric');
    input.setAttribute('aria-label', spec.label);
    input.setAttribute('aria-invalid', 'false');
    if (spec.required) {
        input.setAttribute('required', 'required');
    }
    input.value = S.values[valueKeys[0]] || '';
    input.dataset.wcBetterRequired = spec.required ? 'true' : 'false';

    var label = document.createElement('label');
    label.setAttribute('for', id);
    label.textContent = displayLabel(spec);

    container.appendChild(input);
    container.appendChild(label);

    // Mensagem de erro (mesmo padrão/estrutura do campo de número do bloco).
    var errorDiv = document.createElement('div');
    errorDiv.className = 'wc-block-components-validation-error wc-better-' + spec.kind + '-error';
    errorDiv.setAttribute('role', 'alert');
    errorDiv.style.display = 'none';

    var errorParagraph = document.createElement('p');
    errorParagraph.id = 'validate-error-' + id;

    var errorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    errorSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    errorSvg.setAttribute('viewBox', '-2 -2 24 24');
    errorSvg.setAttribute('width', '24');
    errorSvg.setAttribute('height', '24');
    errorSvg.setAttribute('aria-hidden', 'true');
    errorSvg.setAttribute('focusable', 'false');

    var errorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    errorPath.setAttribute('d', 'M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z');

    errorSvg.appendChild(errorPath);
    var errorMessage = document.createElement('span');
    errorMessage.textContent = spec.errorMessage || 'Por favor, insira um número válido.';

    errorParagraph.appendChild(errorSvg);
    errorParagraph.appendChild(errorMessage);
    errorDiv.appendChild(errorParagraph);
    container.appendChild(errorDiv);

    input.wcBetterErrorDiv = errorDiv;

    var refreshActive = function () {
        container.classList.toggle('is-active', document.activeElement === input || input.value.trim() !== '');
    };

    // O "Celular" SECUNDÁRIO não recebe DDI no backend: o valor gravado tem que ser
    // o digitado, só sem os caracteres especiais (o `+55` digitado é MANTIDO; sem
    // `+55` digitado, nada é somado). O telefone/celular PRINCIPAL continua mandando
    // só os dígitos, porque o backend concatena o DDI.
    var verbatimValue = (spec.kind === 'cellphone' && spec.secondary === true);

    var onInput = function () {
        var val = input.value.trim();
        // Máscara BR (sem lib/DDI): o campo é exibido formatado, mas o valor que vai
        // ao store/servidor são só os DÍGITOS (o +55 é concatenado no backend).
        if (input.dataset.wcBetterBrazilMask === 'true') {
            // Máscara BR: o valor do store são os dígitos (um campo só com o `+55`
            // conta como vazio). Um número de OUTRO país é enviado como está, para o
            // backend não prefixar o `+55` por cima. O celular secundário é a exceção:
            // vai como o cliente digitou, só sem pontuação (`phoneValueVerbatim`).
            val = verbatimValue ? phoneValueVerbatim(val) : phoneValueForStorage(val);
        }
        valueKeys.forEach(function (key) { S.values[key] = val; });
        refreshActive();

        // Validação ao vivo (igual ao campo de número): se for obrigatório e ficar
        // vazio, já surge a notificação; ao digitar, some. Não rola nem foca.
        if (val.length > 0) {
            clearFieldError(input);
        } else if (input.dataset.wcBetterRequired === 'true') {
            setFieldError(input, true);
        }

        pushToStore();
        syncToServer(spec.kind);
    };

    input.addEventListener('focus', refreshActive);
    input.addEventListener('blur', refreshActive);
    input.addEventListener('input', onInput);
    input.addEventListener('change', onInput);

    insertAfter.insertAdjacentElement('afterend', container);

    // Campo SECUNDÁRIO NÃO recebe a lib (intl-tel-input): é um campo simples. Sem a
    // lib, porém, ele recebe a máscara BR do celular (mesma apresentação do telefone).
    if (!spec.secondary || !truthy(cfgValue('maskEnabled'))) {
        applyMask(input, spec.kind, context);
    }
    refreshActive();
}

/** Último campo gerado (para inserir o próximo logo depois dele). */
function lastGeneratedIn(scope) {
    var fields = scope.querySelectorAll('.wc-better-phone-field, .wc-better-cellphone-field');
    return fields.length ? fields[fields.length - 1] : null;
}

/** Bloco de referência logo após o e-mail (destaque). */
function emailWrapper() {
    var emailField = document.querySelector('#email, input[name="contact_email"], input[name="billing_email"]');
    return emailField ? emailField.closest('.wc-block-components-text-input, .form-row') : null;
}

/**
 * Bloco de referência na seção de endereço (abaixo do estado ou do último campo
 * gerado, para manter Telefone→Celular).
 *
 * @param {string} context
 * @returns {Element|null}
 */
function addressInsertAfter(context) {
    var block = document.getElementById(context);
    if (!block) {
        return null;
    }
    var existing = lastGeneratedIn(block);
    if (existing) {
        return existing;
    }
    var reference = block.querySelector('#' + context + '-state')
        || block.querySelector('#' + context + '-postcode')
        || block.querySelector('#' + context + '-city');
    if (!reference || reference.offsetParent === null) {
        return null;
    }
    return reference.closest('[class*="wc-block-components-address-form__"]') || reference;
}

/**
 * Bloco de referência no FIM da seção de endereço (após o último campo NATIVO,
 * ignorando os campos do próprio plugin). Usado pelo campo "secundário".
 *
 * @param {string} context
 * @returns {Element|null}
 */
function addressInsertAfterEnd(context) {
    var block = document.getElementById(context);
    if (!block) {
        return null;
    }
    var fields = block.querySelectorAll('[class*="wc-block-components-address-form__"]');
    for (var i = fields.length - 1; i >= 0; i--) {
        var el = fields[i];
        if (el.classList.contains('wc-better-phone-field') || el.classList.contains('wc-better-cellphone-field')) {
            continue;
        }
        if (el.offsetParent !== null) {
            return el;
        }
    }
    return null;
}

/**
 * Âncora no FIM do formulário de endereço (o último campo entre as seções de
 * cobrança e entrega). Usada pelo campo "Celular" secundário (único) quando o
 * "Destaque" está ligado — ele fica no rodapé, NÃO junto do telefone destacado.
 *
 * @returns {Element|null}
 */
function secondaryBottomAnchor() {
    var billing = addressInsertAfterEnd('billing');
    var shipping = addressInsertAfterEnd('shipping');

    if (billing && shipping) {
        // Prefere a seção que aparece por ÚLTIMO no DOM (o verdadeiro rodapé).
        // DOCUMENT_POSITION_FOLLOWING (4): shipping vem depois de billing.
        return (billing.compareDocumentPosition(shipping) & 4) ? shipping : billing;
    }

    return shipping || billing;
}

/**
 * Monta o campo (destaque = único abaixo do e-mail; senão billing + shipping).
 *
 * @param {object} spec { kind, label, required }
 */
function mountField(spec) {
    // Campo SECUNDÁRIO (ex.: "Celular" separado do bloco principal).
    if (spec.secondary) {
        // Com o "Destaque do Campo Telefone" LIGADO o telefone é ÚNICO (vale para
        // cobrança E entrega). O "Celular" secundário também é ÚNICO (um só valor,
        // evita campos independentes que divergiam no request), mas NÃO usa o
        // destaque — o "Destaque" é só do telefone principal. Ele fica no FIM do
        // formulário de endereço (rodapé), como um campo simples.
        if (truthy(cfgValue('highlight'))) {
            var singleId = domIdFor(spec.kind, 'single');
            if (!document.getElementById(singleId)) {
                var anchor = secondaryBottomAnchor();
                if (anchor) {
                    buildField(spec, 'single', anchor);
                }
            }
            return;
        }

        // Sem destaque: um "Celular" por endereço (billing + shipping), no FIM do
        // formulário de endereço, SEM lib (campo simples).
        CONTEXTS.forEach(function (context) {
            var id = context + '_' + spec.kind;
            if (document.getElementById(id)) {
                return;
            }
            var insertAfter = addressInsertAfterEnd(context);
            if (!insertAfter) {
                return;
            }
            buildField(spec, context, insertAfter);
        });
        return;
    }

    // Destaque ligado: um único campo abaixo do e-mail (vale para billing/shipping).
    if (truthy(cfgValue('highlight'))) {
        var singleId = domIdFor(spec.kind, 'single');
        if (!document.getElementById(singleId)) {
            var anchor = lastGeneratedIn(document.body) || emailWrapper();
            if (anchor) {
                buildField(spec, 'single', anchor);
            }
        }
        return;
    }

    CONTEXTS.forEach(function (context) {
        var id = context + '_' + spec.kind;
        if (document.getElementById(id)) {
            return;
        }
        var insertAfter = addressInsertAfter(context);
        if (!insertAfter) {
            return;
        }
        buildField(spec, context, insertAfter);
    });
}

// ------------------------------ Travar no envio ----------------------------

function fieldInvalid(field) {
    var iti = field.wcBetterIti;
    if (iti && typeof iti.isValidNumberPrecise === 'function') {
        return iti.isValidNumberPrecise() === false;
    }

    // Sem a lib (máscara BR): valida só números do Brasil.
    if (field.dataset.wcBetterBrazilMask === 'true') {
        return brazilPhoneInvalid(field.value, field.dataset.wcBetterBrazilMaskType);
    }

    return false;
}

/**
 * Resolve a div de erro do campo (referência guardada, com fallback p/ o DOM).
 *
 * @param {HTMLInputElement} field
 * @returns {Element|null}
 */
function fieldErrorDiv(field) {
    if (field.wcBetterErrorDiv && field.wcBetterErrorDiv.isConnected) {
        return field.wcBetterErrorDiv;
    }
    var container = field.closest('.wc-block-components-text-input');
    return container ? container.querySelector('.wc-block-components-validation-error') : null;
}

/**
 * Liga/desliga o estado de erro (borda + mensagem + aria) do campo.
 *
 * @param {HTMLInputElement} field
 * @param {boolean}          on
 */
function setFieldError(field, on) {
    var container = field.closest('.wc-block-components-text-input');
    if (container) {
        container.classList.toggle('has-error', on);
        if (on) {
            container.classList.add('is-active');
        }
    }
    var errorDiv = fieldErrorDiv(field);
    if (errorDiv) {
        errorDiv.style.display = on ? '' : 'none';
    }
    field.setAttribute('aria-invalid', on ? 'true' : 'false');
}

function showError(field) {
    setFieldError(field, true);
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Foca sem rolar (focus com scroll instantâneo cancelaria o smooth acima).
    setTimeout(function () {
        try {
            field.focus({ preventScroll: true });
        } catch (error) {
            field.focus();
        }
    }, 300);
}

/**
 * Esconde a mensagem de erro do campo (ao corrigir o valor).
 *
 * @param {HTMLInputElement} field
 */
function clearFieldError(field) {
    setFieldError(field, false);
}

function bindValidation() {
    var button = document.querySelector('.wc-block-components-checkout-place-order-button')
        || document.querySelector('.wc-block-checkout__actions_row button');
    if (!button || button === S.boundButton) {
        return;
    }
    S.boundButton = button;

    button.addEventListener('click', function (event) {
        var fields = Array.prototype.slice.call(
            document.querySelectorAll('.wc-better-tel-input')
        );
        var validateDdd = truthy(cfgValue('validateDdd'));
        var invalid = fields.find(function (field) {
            var required = field.dataset.wcBetterRequired === 'true';
            // Na máscara BR o campo pode ter só o `+55`: não é um telefone preenchido.
            var empty = (field.dataset.wcBetterBrazilMask === 'true')
                ? brazilPhoneIsEmpty(field.value)
                : !field.value.trim();
            if (required && empty) {
                return true;
            }
            // Só valida o tipo/DDD quando o campo é OBRIGATÓRIO (campo opcional não
            // é validado, mesmo preenchido). Sem a lib/DDI, `fieldInvalid` aplica a
            // regra brasileira (DDD + 8 ou 9 dígitos).
            return required && validateDdd && field.value.trim() && fieldInvalid(field);
        });
        if (invalid) {
            event.stopPropagation();
            event.preventDefault();
            showError(invalid);
        }
    });
}

/**
 * Redesenha a label do campo (inclui/remove o "(opcional)").
 *
 * O campo é criado uma vez e reaproveitado nos re-renders do React, mas a
 * obrigatoriedade pode mudar (ex.: "Campo de Celular" obrigatório).
 *
 * @param {HTMLInputElement} input
 * @param {object}           spec { label, required }
 */
function refreshFieldLabel(input, spec) {
    var container = input.closest('.wc-block-components-text-input');
    var label = container ? container.querySelector('label') : null;
    var text = displayLabel(spec);

    if (label && label.textContent !== text) {
        label.textContent = text;
    }
}

/**
 * Executa todos os boots registrados (idempotente; recria o que faltar).
 */
function runAll() {
    S.boots.forEach(function (opts) {
        if (opts.modes.indexOf(cfg.mode) === -1) {
            return;
        }
        if (opts.kind === 'cellphone' && cfg.mode === 'phone_and_cellphone' && !truthy(cfgValue('enableCellphone'))) {
            return;
        }

        var required = opts.kind === 'phone'
            ? truthy(cfgValue('required'))
            : (cfg.mode === 'cellphone_only' ? truthy(cfgValue('required')) : truthy(cfgValue('cellphoneRequired')));

        var spec = {
            kind: opts.kind,
            required: required,
            secondary: !!opts.secondary,
            label: opts.kind === 'phone' ? (cfg.phoneLabel || 'Telefone') : (cfg.cellphoneLabel || 'Celular')
        };

        mountField(spec);

        var sel = '.wc-better-' + spec.kind + '-field .wc-better-tel-input';
        Array.prototype.forEach.call(document.querySelectorAll(sel), function (input) {
            input.dataset.wcBetterRequired = spec.required ? 'true' : 'false';
            refreshFieldLabel(input, spec);
        });
    });

    bindValidation();
    // Semeia o store com os valores atuais (inclusive já salvos) UMA vez — sem isso, um
    // valor pré-preenchido que o cliente não editar não iria no pedido.
    if (!S.seeded) {
        S.seeded = true;
        pushToStore();
    }
}

function ensureInit() {
    if (S.inited) {
        return;
    }
    S.inited = true;

    VALUE_KEYS.forEach(function (key) {
        S.values[key] = cfg[key] || '';
    });

    var observer = new MutationObserver(runAll);
    observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Ponto de entrada usado por cada "script de campo".
 *
 * @param {object} opts { kind: 'phone'|'cellphone', modes: string[] }
 */
export function bootPhoneField(opts) {
    S.boots.push(opts);
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            ensureInit();
            runAll();
        });
    } else {
        ensureInit();
        runAll();
    }
}
