'use strict';

/**
 * Regressão: o "Celular Oculto" (shim) no checkout em BLOCOS é feito via JS
 * (`core/PhoneField.js`): o namespace `woo_better_cellphone` só recebe o ESPELHO do
 * telefone quando a opção `woo_better_calc_enable_cellphone_shim` está ligada.
 *
 * Antes, o espelho acontecia sempre que o modo era "Celular e Fixo" com o "Campo de
 * Celular" desligado — mesmo com o "Celular Oculto" DESLIGADO (padrão). Agora os
 * dois espelhos (`cellphonePayload` e `payloadsForKind('phone')`) exigem
 * `enableCellphoneShim` (que o PHP localiza em `WooBetterPhoneFieldsData`).
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const SOURCE = path.join(ROOT, 'Public/js/core/PhoneField.js');
const COMPILED_BUNDLES = [
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergPhoneFieldBoth.COMPILED.js',
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergCellphoneFieldBoth.COMPILED.js',
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergPhoneFieldLandline.COMPILED.js',
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergCellphoneFieldOnly.COMPILED.js',
];

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[shim-gutenberg] o espelho do telefone exige o "Celular Oculto" (enableCellphoneShim)', () => {
    const src = read(SOURCE);

    const matches = src.match(/truthy\(cfgValue\('enableCellphoneShim'\)\)/g) || [];
    assert.ok(
        matches.length >= 2,
        'O espelho deve exigir `enableCellphoneShim` nos DOIS pontos (cellphonePayload e payloadsForKind).'
    );

    // A condição combinada (espelho só com o "Celular Oculto" ligado) deve aparecer
    // nos DOIS pontos: cellphonePayload() e payloadsForKind('phone').
    const fullCondition = /mode === 'phone_and_cellphone' && !truthy\(cfgValue\('enableCellphone'\)\) && truthy\(cfgValue\('enableCellphoneShim'\)\)/g;
    const combined = src.match(fullCondition) || [];
    assert.ok(
        combined.length >= 2,
        'A condição de espelho deve incluir `&& truthy(cfgValue(\'enableCellphoneShim\'))` (nos 2 pontos).'
    );
});

test('[shim-gutenberg] COMPILADO contém o gate (build atualizado)', () => {
    for (const rel of COMPILED_BUNDLES) {
        const compiled = read(path.join(ROOT, rel));
        assert.ok(
            compiled.includes('enableCellphoneShim'),
            `${rel} deve conter o gate "enableCellphoneShim" — rode \`npm run build:public\`.`
        );
    }
});
