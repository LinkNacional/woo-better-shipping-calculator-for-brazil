'use strict';

/**
 * Regressão: "Ocultar Checkbox S/N" (`woo_better_calc_number_hide_sn_checkbox`) é
 * FILHO do "Campo de Número do Endereço" (`woo_better_calc_number_required`) na
 * tela de configurações do checkout em abas/cards (5.3.0).
 *
 * Contrato coberto (o mesmo em todas as telas do plugin):
 *   1. pai em "Habilitar"  → filho editável, escolha do lojista preservada;
 *   2. pai em "Desabilitar" → filho VOLTA AO DEFAULT ("Desabilitar") e recebe o
 *      fake disabled — não sobra um `yes` guardado que só voltaria a valer quando o
 *      campo de Número fosse religado;
 *   3. o atributo `disabled` NUNCA é usado: o radio continua indo no POST com o
 *      valor coerente (AGENTS.md § 7). O servidor reforça em
 *      `enforce_number_hide_sn_option()`.
 *
 * Diferente dos testes que só leem o fonte, este EXECUTA o AdminLayoutBehaviors.js
 * contra um DOM mínimo — pega erro de ligação (listener não registrado, função
 * renomeada) além da regra em si.
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
 * @param {object} state Estado inicial: `number` ('yes'/'no') e `hideSn` ('yes'/'no').
 * @returns {{groups: object, fakeDisabledCalls: Array, setNumber: Function, restore: Function}}
 */
function boot(state) {
    const numberName = 'woo_better_calc_number_required';
    const hideSnName = 'woo_better_calc_number_hide_sn_checkbox';

    const groups = {
        [numberName]: [
            fakeRadio(numberName, 'yes', state.number === 'yes'),
            fakeRadio(numberName, 'no', state.number !== 'yes'),
        ],
        [hideSnName]: [
            fakeRadio(hideSnName, 'yes', state.hideSn === 'yes'),
            fakeRadio(hideSnName, 'no', state.hideSn !== 'yes'),
        ],
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

            return null;
        },
        querySelectorAll(selector) {
            const match = selector.match(/name="([^"]+)"/);

            return match && groups[match[1]] ? groups[match[1]] : [];
        },
        addEventListener() {},
    };

    // eslint-disable-next-line no-new-func
    new Function(fs.readFileSync(BEHAVIORS, 'utf8'))();

    const restore = () => {
        global.window = previousWindow;
        global.document = previousDocument;
    };

    const setNumber = (value) => {
        const radios = groups[numberName];
        const target = radios.find((radio) => radio.value === value);

        radios.forEach((radio) => {
            radio.checked = radio === target;
        });
        target.fire('change');
    };

    return { groups, fakeDisabledCalls, setNumber, restore, hideSnName };
}

/**
 * Estado dos radios como `{yes, no}`.
 *
 * @param {Array} radios
 * @returns {{yes: boolean, no: boolean}}
 */
function radioState(radios) {
    return {
        yes: radios.find((radio) => radio.value === 'yes').checked,
        no: radios.find((radio) => radio.value === 'no').checked,
    };
}

test('[number-sn/admin] pai em "Desabilitar" devolve o filho ao DEFAULT', () => {
    // Cenário do relato: lojista ligou "Ocultar Checkbox S/N" e depois desligou o
    // campo de Número — a opção não pode continuar marcada em "Habilitar".
    const ctx = boot({ number: 'no', hideSn: 'yes' });

    try {
        const radios = ctx.groups[ctx.hideSnName];

        assert.deepStrictEqual(
            radioState(radios),
            { yes: false, no: true },
            'Com o campo de Número desligado a opção deve voltar ao default ("Desabilitar").'
        );
    } finally {
        ctx.restore();
    }
});

test('[number-sn/admin] pai em "Desabilitar" aplica o fake disabled (nunca `disabled`)', () => {
    const ctx = boot({ number: 'no', hideSn: 'yes' });

    try {
        const radios = ctx.groups[ctx.hideSnName];
        const calls = ctx.fakeDisabledCalls.filter((call) => radios.indexOf(call.target) !== -1);

        assert.ok(calls.length >= radios.length, 'O fake disabled deve ser aplicado nos radios do filho.');
        assert.ok(calls.every((call) => true === call.isDisabled), 'Os radios devem ficar travados (aparência).');
        assert.ok(
            radios.every((radio) => false === radio.disabled),
            'O atributo `disabled` não pode ser usado: o valor precisa ir no POST.'
        );
    } finally {
        ctx.restore();
    }
});

test('[number-sn/admin] alternar o pai para "Desabilitar" reseta o filho', () => {
    const ctx = boot({ number: 'yes', hideSn: 'yes' });

    try {
        const radios = ctx.groups[ctx.hideSnName];

        // Começa editável e com a escolha do lojista.
        assert.deepStrictEqual(radioState(radios), { yes: true, no: false });
        ctx.fakeDisabledCalls.length = 0;

        assert.ok(
            ctx.fakeDisabledCalls.filter((call) => radios.indexOf(call.target) !== -1 && call.isDisabled).length === 0,
            'Com o pai ligado o filho NÃO fica travado.'
        );

        ctx.setNumber('no');

        assert.deepStrictEqual(radioState(radios), { yes: false, no: true }, 'Ao desligar o pai o filho volta ao default.');
    } finally {
        ctx.restore();
    }
});

test('[number-sn/admin] religar o pai não reativa a escolha antiga', () => {
    const ctx = boot({ number: 'yes', hideSn: 'yes' });

    try {
        const radios = ctx.groups[ctx.hideSnName];

        ctx.setNumber('no');
        ctx.fakeDisabledCalls.length = 0;
        ctx.setNumber('yes');

        assert.deepStrictEqual(
            radioState(radios),
            { yes: false, no: true },
            'O default fica marcado até o lojista escolher de novo.'
        );
        assert.ok(
            ctx.fakeDisabledCalls.filter((call) => radios.indexOf(call.target) !== -1).every((call) => false === call.isDisabled),
            'Religar o pai destrava o filho.'
        );
    } finally {
        ctx.restore();
    }
});
