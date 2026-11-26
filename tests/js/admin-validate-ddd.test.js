'use strict';

/**
 * Regressão: "Validar Número de Telefone" é CAMADA do "Telefone (Contato)
 * Obrigatório" na tela de configurações do checkout.
 *
 * O recurso de validação só age em campo OBRIGATÓRIO (`validate_phone_ddd_classic`
 * no checkout clássico e `bindValidation` no checkout em blocos). Se a tela
 * deixasse "Validar" marcado em "Habilitar" com o contato opcional, o lojista
 * ligaria a opção, veria ativo e nada seria validado no checkout — foi o bug
 * relatado ("o número inválido passou").
 *
 * O comportamento esperado, ao escolher "Desabilitar" no contato obrigatório:
 *   1. o radio "Desabilitar" de "Validar" fica MARCADO (a tela reflete o checkout);
 *   2. os radios ficam com o fake disabled (aparência de desabilitado);
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

    global.document = {
        readyState: 'complete',
        body: fakeRadio('body', '', false),
        querySelector(selector) {
            if (selector === '.admin-layout-page-wrapper') {
                return fakeRadio('div', '', false);
            }

            // Só o select do modo de telefone é consultado por `querySelector`.
            if (selector.indexOf('woo_better_calc_phone_mode') !== -1) {
                return { ...fakeRadio('select', 'phone_and_cellphone', false), value: 'phone_and_cellphone' };
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

    return { groups, fakeDisabledCalls, restore, setContact };
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

test('[validate-ddd] contato obrigatório em "Desabilitar" marca "Desabilitar" na validação', () => {
    const ctx = boot();

    try {
        const radios = ctx.groups.woo_better_calc_validate_ddd;

        // Começa com a validação ligada (é o cenário do bug relatado).
        assert.deepStrictEqual(validateState(radios), { yes: true, no: false });

        ctx.setContact('no');

        assert.deepStrictEqual(
            validateState(radios),
            { yes: false, no: true },
            'Sem o telefone obrigatório a validação não age: a tela deve mostrar "Desabilitar".'
        );
    } finally {
        ctx.restore();
    }
});

test('[validate-ddd] trava os radios com o fake disabled (nunca o atributo `disabled`)', () => {
    const ctx = boot();

    try {
        const radios = ctx.groups.woo_better_calc_validate_ddd;
        ctx.fakeDisabledCalls.length = 0;

        ctx.setContact('no');

        const calls = ctx.fakeDisabledCalls.filter((call) => radios.indexOf(call.target) !== -1);

        assert.ok(calls.length >= radios.length, 'O fake disabled deve ser aplicado nos radios de "Validar".');
        assert.ok(
            calls.every((call) => true === call.isDisabled),
            'Os radios devem ficar com o fake disabled ligado.'
        );

        // `disabled` de verdade não pode aparecer: o valor não iria no POST.
        assert.ok(
            radios.every((radio) => false === radio.disabled),
            'O atributo `disabled` não pode ser usado (a option guardaria um "yes" fantasma).'
        );
    } finally {
        ctx.restore();
    }
});

test('[validate-ddd] religar o contato obrigatório destrava a opção', () => {
    const ctx = boot();

    try {
        const radios = ctx.groups.woo_better_calc_validate_ddd;

        ctx.setContact('no');
        ctx.fakeDisabledCalls.length = 0;
        ctx.setContact('yes');

        const calls = ctx.fakeDisabledCalls.filter((call) => radios.indexOf(call.target) !== -1);

        assert.ok(calls.length >= radios.length, 'O fake disabled deve ser reaplicado ao destravar.');
        assert.ok(
            calls.every((call) => false === call.isDisabled),
            'Com o contato obrigatório ligado, a opção fica editável de novo.'
        );
    } finally {
        ctx.restore();
    }
});
