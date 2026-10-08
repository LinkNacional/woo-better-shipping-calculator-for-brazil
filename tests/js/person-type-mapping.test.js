'use strict';

/**
 * Teste do mapeamento documento -> tipo de pessoa no checkout clássico/shortcode.
 *
 * Verifica o mesmo contrato do plugin "Brazilian Market on WooCommerce":
 *   - CPF  (11 dígitos)      -> #billing_persontype = '1' (Pessoa Física) e preenche #billing_cpf
 *   - CNPJ (14 caracteres)   -> #billing_persontype = '2' (Pessoa Jurídica) e preenche #billing_cnpj
 *
 * Estratégia: carrega o arquivo JS REAL num sandbox (vm) com um DOM mínimo,
 * dispara DOMContentLoaded, simula uma digitação no #billing_document e confere
 * os campos hidden. Roda tanto contra o FONTE quanto contra o COMPILADO, para
 * detectar divergência entre eles.
 *
 * Execução: npm run test:js   (ou: node --test tests/js)
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

const TARGETS = {
    source: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.js'),
    compiled: path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.COMPILED.js'),
};

const ELEMENT_IDS = [
    'billing_document',
    'billing_persontype',
    'billing_cpf',
    'billing_cnpj',
    'billing_document_field',
    'billing_company',
    'billing_company_field',
    'billing_country',
    'shipping_country',
    'place_order',
];

/**
 * Elemento DOM mínimo, suficiente para o script de person-type.
 */
function makeElement(id) {
    const listeners = {};
    const attrs = {};

    return {
        id,
        value: '',
        dataset: {},
        style: {},
        classList: {
            _set: new Set(),
            add(...c) { c.forEach((x) => this._set.add(x)); },
            remove(...c) { c.forEach((x) => this._set.delete(x)); },
            contains(c) { return this._set.has(c); },
            toggle(c) { this._set.has(c) ? this._set.delete(c) : this._set.add(c); },
        },
        _listeners: listeners,
        addEventListener(type, cb) {
            (listeners[type] = listeners[type] || []).push(cb);
        },
        dispatchEvent(evt) {
            (listeners[evt.type] || []).forEach((cb) => cb.call(this, evt));
            return true;
        },
        setAttribute(k, v) { attrs[k] = String(v); },
        getAttribute(k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
        removeAttribute(k) { delete attrs[k]; },
        querySelectorAll() { return []; },
        querySelector() { return null; },
        scrollIntoView() {},
    };
}

/**
 * Carrega o arquivo num sandbox e devolve os elementos + documentos.
 */
function loadModule(file, overrides = {}) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);

    const elements = {};
    ELEMENT_IDS.forEach((id) => { elements[id] = makeElement(id); });
    // Loja brasileira: o campo de país já vem em BR (evita o reset inicial).
    elements.billing_country.value = 'BR';

    const docListeners = {};
    const documentStub = {
        getElementById: (id) => (Object.prototype.hasOwnProperty.call(elements, id) ? elements[id] : null),
        addEventListener(type, cb) { (docListeners[type] = docListeners[type] || []).push(cb); },
        body: makeElement('body'),
        querySelectorAll: () => [],
    };

    const sandbox = {
        document: documentStub,
        console,
        setTimeout: () => 0,
        clearTimeout: () => {},
        MutationObserver: class { observe() {} disconnect() {} },
        Node: { ELEMENT_NODE: 1 },
        Event: class { constructor(type) { this.type = type; } },
        WooBetterPersonTypeConfig: Object.assign({
            person_type: 'both',
            show_select: true,
            company_field_behavior: 'dynamic',
        }, overrides),
    };
    sandbox.window = sandbox;

    vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });

    // Dispara o DOMContentLoaded registrado pelo script.
    (docListeners.DOMContentLoaded || []).forEach((cb) => cb());
    assert.ok(docListeners.DOMContentLoaded, 'O script deve registrar um handler de DOMContentLoaded.');

    return { elements };
}

/**
 * Simula a digitação no #billing_document disparando o handler de 'input'.
 */
function typeDocument(elements, raw) {
    const input = elements.billing_document;
    const handler = (input._listeners.input || [])[0];
    assert.ok(handler, 'O handler de input deve estar registrado em #billing_document.');
    input.value = raw;
    handler.call(input, { type: 'input' });
}

for (const [kind, file] of Object.entries(TARGETS)) {
    test(`[${kind}] CPF preenche billing_persontype=1 e billing_cpf`, () => {
        const { elements } = loadModule(file);

        typeDocument(elements, '123.456.789-09');

        assert.strictEqual(elements.billing_persontype.value, '1', 'CPF deve definir persontype = 1');
        assert.strictEqual(elements.billing_cpf.value, '123.456.789-09', 'CPF deve ir para billing_cpf');
        assert.strictEqual(elements.billing_cnpj.value, '', 'billing_cnpj deve ficar vazio com CPF');
    });

    test(`[${kind}] CNPJ preenche billing_persontype=2 e billing_cnpj`, () => {
        const { elements } = loadModule(file);

        typeDocument(elements, '11.222.333/0001-81');

        assert.strictEqual(elements.billing_persontype.value, '2', 'CNPJ deve definir persontype = 2');
        assert.strictEqual(elements.billing_cnpj.value, '11.222.333/0001-81', 'CNPJ deve ir para billing_cnpj');
        assert.strictEqual(elements.billing_cpf.value, '', 'billing_cpf deve ficar vazio com CNPJ');
    });

    test(`[${kind}] documento parcial não define tipo`, () => {
        const { elements } = loadModule(file);

        typeDocument(elements, '123.456');

        assert.notStrictEqual(elements.billing_persontype.value, '1', 'Documento incompleto não deve confirmar CPF');
        assert.notStrictEqual(elements.billing_persontype.value, '2', 'Documento incompleto não deve confirmar CNPJ');
    });

    test(`[${kind}] letras são tratadas como CNPJ (alfanumérico)`, () => {
        const { elements } = loadModule(file);

        typeDocument(elements, '12.ABC.345/01DE-35');

        assert.strictEqual(elements.billing_persontype.value, '2', 'Documento com letras deve ser tratado como CNPJ');
        assert.notStrictEqual(elements.billing_cnpj.value, '', 'CNPJ alfanumérico deve ir para billing_cnpj');
    });
}
