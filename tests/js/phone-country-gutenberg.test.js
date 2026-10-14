'use strict';

/**
 * Regressão: o DDI do telefone no checkout em BLOCOS.
 *
 * O input do intl-tel-input com `separateDialCode` (opção "Exibir Código do País")
 * mostra apenas o número NACIONAL — o DDI fica num elemento à parte e NÃO entra no
 * `input.value`. Sem enviá-lo por fora, o pedido grava o telefone SEM o `+55`
 * (ex.: "83988888882" em vez de "+5583988888882").
 *
 * O backend já lê o namespace `woo_better_phone_country`
 * (`process_checkout_data_from_request` + `handle_phone_country_update`); este teste
 * garante que `core/PhoneField.js` (blocos) SIGA enviando esse DDI — o fluxo antigo
 * fazia (`sendCountry`), mas o novo núcleo o havia perdido.
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

test('[phone-country] PhoneField.js envia o DDI via woo_better_phone_country', () => {
    const src = read(SOURCE);

    assert.ok(
        src.includes("'woo_better_phone_country'"),
        'PhoneField.js deve enviar o namespace `woo_better_phone_country`.'
    );
    assert.ok(
        src.includes('billing_phone_country_code') && src.includes('shipping_phone_country_code'),
        'O payload do DDI deve conter `billing_phone_country_code` e `shipping_phone_country_code`.'
    );
    // O DDI precisa ser lido da bandeira selecionada do intl-tel-input.
    assert.ok(
        src.includes('getSelectedCountryData'),
        'O DDI deve ser lido de `iti.getSelectedCountryData()`.'
    );
    // Reenvia ao trocar de país.
    assert.ok(
        /addEventListener\('countrychange'[\s\S]*?syncPhoneCountry\(/.test(src),
        'A troca de bandeira (`countrychange`) deve disparar `syncPhoneCountry`.'
    );
});

test('[phone-country] COMPILADO contém o envio do DDI (build atualizado)', () => {
    for (const rel of COMPILED_BUNDLES) {
        const compiled = read(path.join(ROOT, rel));
        assert.ok(
            compiled.includes('woo_better_phone_country') && compiled.includes('shipping_phone_country_code'),
            `${rel} deve conter o envio do DDI — rode \`npm run build:public\`.`
        );
    }
});
