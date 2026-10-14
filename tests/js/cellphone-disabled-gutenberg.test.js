'use strict';

/**
 * Regressão: o campo "Celular" SEPARADO no modo "Desabilitar o campo de telefone"
 * com o "Campo de Celular" ligado (`woo_better_calc_enable_cellphone_field=yes`).
 *
 * Nesse modo o TELEFONE é o NATIVO do WooCommerce (o plugin não injeta campo de
 * telefone) e o "Celular" é um campo ADITIVO (separado), então o boot usa
 * `{ kind: 'cellphone', modes: ['disabled'], secondary: true }`.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergCellphoneFieldDisabled.js');
const COMPILED = path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergCellphoneFieldDisabled.COMPILED.js');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[cellphone-disabled] o source registra o boot secundário no modo disabled', () => {
    const src = read(SOURCE);
    assert.ok(src.includes("modes: ['disabled']"), 'Deve registrar o modo "disabled".');
    assert.ok(src.includes('secondary: true'), 'O campo "Celular" deve ser secundário (aditivo).');
});

test('[cellphone-disabled] COMPILADO contém o boot (build atualizado)', () => {
    const compiled = read(COMPILED);
    assert.ok(
        compiled.includes('"disabled"') && compiled.includes('secondary:!0'),
        'O bundle compilado deve conter o boot — rode `npm run build:public`.'
    );
});
