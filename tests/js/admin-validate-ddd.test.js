'use strict';

/**
 * Regressão: "Validar Número de Telefone" é ESCOLHA do lojista (não é travada pelo
 * "Telefone (Contato) Obrigatório").
 *
 * A validação em si só age em campo OBRIGATÓRIO (`validate_phone_ddd_classic` no
 * clássico e `bindValidation` no checkout em blocos) — o texto do card diz isso —,
 * mas travar a opção e forçar "Desabilitar" a cada toggle do contato desfazia a
 * escolha do lojista (bug relatado: com o contato em "Desabilitar" a opção de baixo
 * aparecia marcada em "Desabilitar" e com o fake disabled).
 *
 * Contrato coberto aqui:
 *   1. alternar o contato obrigatório NÃO marca/desmarca nem trava "Validar";
 *   2. a opção fica travada APENAS nos modos em que o plugin não gerencia o
 *      telefone (`disabled`/`disabled_native`), onde não existe campo algum;
 *   3. o atributo `disabled` NUNCA é usado — input `disabled` não vai no POST e a
 *      option guardaria um "yes" fantasma (AGENTS.md § 7).
 *
 * Diferente dos outros testes do admin (que leem o fonte), este EXECUTA o
 * AdminLayoutBehaviors.js contra um DOM mínimo, então pega também erro de
 * ligação (listener não registrado, função renomeada, etc.).
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const BEHAVIORS = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayoutBehaviors.js');

/**
 * Elemento falso com o mínimo que o script usa (radios do layout de cards).
 *
 * @param {string}  name
 * @param {string}  value
 * @param {boolean} checked
 * @returns {object}
 */
function fakeRadio(name, value, checked) {
    const handlers = {};

    return {
        name,
        value,
        checked,
        style: {},
        disabled: false,
        classList: {
            add() {},
            remove() {},
            contains() {
                return false;
            },
            toggle() {},
        },
        closest() {
            return null;
        },
        removeAttribute() {},
        setAttribute() {},
        addEventListener(type, fn) {
            handlers[type] = handlers[type] || [];
            handlers[type].push(fn);
        },
        fire(type) {
            (handlers[type] || []).forEach((fn) => fn.call(this));
        },
    };
}

/**
 * Monta um DOM mínimo, executa o script do admin e devolve as estruturas de teste.
 *
 * @returns {{groups: object, fakeDisabledCalls: Array, setContact: Function}}
 */
function boot() {
    const groups = {
        woo_better_calc_contact_required: [fakeRadio('woo_better_calc_contact_required', 'yes', true), fakeRadio('woo_better_calc_contact_required', 'no', false)],
        woo_better_calc_validate_ddd: [fakeRadio('woo_better_calc_validate_ddd', 'yes', true), fakeRadio('woo_better_calc_validate_ddd', 'no', false)],
        woo_better_calc_apply_phone_mask: [fakeRadio('x', 'no', true), fakeRadio('x', 'yes', false)],
        woo_better_calc_show_phone_country_code: [fakeRadio('x', 'yes', false), fakeRadio('x', 'no', true)],
        woo_better_calc_contact_field_position: [fakeRadio('x', 'no', true), fakeRadio('x', 'yes', false)],
        woo_better_calc_enable_cellphone_field: [fakeRadio('x', 'yes', true), fakeRadio('x', 'no', false)],
        woo_better_calc_cellphone_required: [fakeRadio('x', 'no', true), fakeRadio('x', 'yes', false)],
        woo_better_calc_enable_cellphone_shim: [fakeRadio('x', 'no', true), fakeRadio('x', 'yes', false)],
        woo_better_calc_cep_field_position: [],
        woo_better_calc_enable_auto_address_fill: [],
        woo_better_calc_enable_silent_address_fill: [],
        woo_better_calc_enable_rg_field: [],
        woo_better_calc_rg_required: [],
    };

    const fakeDisabledCalls = [];
    const previousWindow = global.window;
    const previousDocument = global.document;

    global.window = {
        confirm: () => true,
        wcBetterFakeDisabled(targets, isDisabled) {
            const list = Array.isArray(targets) ? targets : [targets];
            list.forEach((target) => fakeDisabledCalls.push({ target, isDisabled }));
        },
    };

    // Select do modo de telefone — objeto ÚNICO e mutável (o teste troca o modo e
    // dispara `change` nele, como o navegador faria).
    const phoneModeSelect = fakeRadio('select', 'phone_and_cellphone', false);
    phoneModeSelect.value = 'phone_and_cellphone';

    global.document = {
        readyState: 'complete',
        body: fakeRadio('body', '', false),
        querySelector(selector) {
            if (selector === '.admin-layout-page-wrapper') {
                return fakeRadio('div', '', false);
            }

            // Só o select do modo de telefone é consultado por `querySelector`.
            if (selector.indexOf('woo_better_calc_phone_mode') !== -1) {
                return phoneModeSelect;
            }

            return null;
        },
        querySelectorAll(selector) {
            const match = selector.match(/name="([^"]+)"/);

            return match && groups[match[1]] ? groups[match[1]] : [];
        },
        addEventListener() {},
    };

    // Executa o IIFE do admin (não é módulo: roda direto).
    // eslint-disable-next-line no-new-func
    new Function(fs.readFileSync(BEHAVIORS, 'utf8'))();

    // Restaura os globais: o teste não deve vazar DOM falso para outros testes.
    const restore = () => {
        global.window = previousWindow;
        global.document = previousDocument;
    };

    const setContact = (value) => {
        const radios = groups.woo_better_calc_contact_required;
        const target = radios.find((radio) => radio.value === value);

        radios.forEach((radio) => {
            radio.checked = radio === target;
        });
        target.fire('change');
    };

    // Troca o "Comportamento do Campo de Telefone" (select único) e dispara `change`.
    const setPhoneMode = (value) => {
        phoneModeSelect.value = value;
        phoneModeSelect.fire('change');
    };

    return { groups, fakeDisabledCalls, restore, setContact, setPhoneMode };
}

/**
 * Estado dos radios de "Validar" como `{yes, no}`.
 *
 * @param {Array} radios
 * @returns {{yes: boolean, no: boolean}}
 */
function validateState(radios) {
    return {
        yes: radios.find((radio) => radio.value === 'yes').checked,
        no: radios.find((radio) => radio.value === 'no').checked,
    };
}

test('[validate-ddd] contato obrigatório NÃO mexe na escolha da validação', () => {
    const ctx = boot();

    try {
        const radios = ctx.groups.woo_better_calc_validate_ddd;

        // Começa com a validação ligada.
        assert.deepStrictEqual(validateState(radios), { yes: true, no: false });

        ctx.setContact('no');

        assert.deepStrictEqual(
            validateState(radios),
            { yes: true, no: false },
            'Desligar o telefone obrigatório não pode forçar "Desabilitar" na validação.'
        );

        // E também não trava (nem apaga) a opção.
        const calls = ctx.fakeDisabledCalls.filter((call) => radios.indexOf(call.target) !== -1);

        assert.ok(calls.every((call) => false === call.isDisabled), 'Os radios devem continuar editáveis.');
    } finally {
        ctx.restore();
    }
});

test('[validate-ddd] a escolha "Desabilitar" do lojista é preservada', () => {
    const ctx = boot();

    try {
        const radios = ctx.groups.woo_better_calc_validate_ddd;

        // Lojista desliga a validação de propósito...
        radios.forEach((radio) => {
            radio.checked = radio.value === 'no';
        });

        // ...e o toggle do contato não reverte a escolha dele.
        ctx.setContact('yes');
        ctx.setContact('no');

        assert.deepStrictEqual(validateState(radios), { yes: false, no: true });
    } finally {
        ctx.restore();
    }
});

test('[validate-ddd] nunca usa o atributo `disabled` nos radios', () => {
    const ctx = boot();

    try {
        const radios = ctx.groups.woo_better_calc_validate_ddd;

        // Modo "Desabilitar o campo de telefone": é o único caso de travamento.
        ctx.setPhoneMode('disabled_native');

        assert.ok(
            radios.every((radio) => false === radio.disabled),
            'O atributo `disabled` não pode ser usado (a option guardaria um "yes" fantasma).'
        );
    } finally {
        ctx.restore();
    }
});

test('[validate-ddd] fica travada só nos modos sem telefone gerenciado', () => {
    const ctx = boot();

    try {
        const radios = ctx.groups.woo_better_calc_validate_ddd;
        const callsFor = () => ctx.fakeDisabledCalls.filter((call) => radios.indexOf(call.target) !== -1);

        // Modo "Desabilitar o campo de telefone": não existe campo, não há o que validar.
        ctx.fakeDisabledCalls.length = 0;
        ctx.setPhoneMode('disabled_native');

        assert.ok(callsFor().length >= radios.length, 'O fake disabled deve ser aplicado no modo sem telefone.');
        assert.ok(callsFor().every((call) => true === call.isDisabled), 'Travada nos modos não gerenciados.');

        // Voltando para um modo gerenciado, destrava.
        ctx.fakeDisabledCalls.length = 0;
        ctx.setPhoneMode('phone_and_cellphone');

        assert.ok(callsFor().length >= radios.length, 'O fake disabled deve ser reaplicado ao destravar.');
        assert.ok(callsFor().every((call) => false === call.isDisabled), 'Destravada nos modos gerenciados.');
    } finally {
        ctx.restore();
    }
});
