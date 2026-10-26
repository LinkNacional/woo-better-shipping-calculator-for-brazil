'use strict';

/**
 * Regressão: o campo "Celular" SECUNDÁRIO (modo "Celular e Fixo" + "Campo de
 * Celular") deve seguir o MESMO modelo de endereço que o telefone.
 *
 * Com o "Destaque do Campo Telefone" LIGADO, o telefone é ÚNICO (vale para
 * cobrança e entrega). O "Celular" também deve ser ÚNICO — um valor só para o
 * checkout. Antes era renderizado por endereço (billing + shipping) com valores
 * INDEPENDENTES, e o `extensionCartUpdate` enviava os dois com valores divergentes
 * (o cliente editava um e o request mandava o outro). Sem destaque, permanece um
 * "Celular" por endereço.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SOURCE = path.join(ROOT, 'Public/js/core/PhoneField.js');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[cellphone-secondary] com Destaque ligado, o Celular secundário é único e no rodapé', () => {
    const src = read(SOURCE);

    // O bloco `spec.secondary` deve tratar o destaque (campo único) e ancorar no
    // FIM do formulário (secondaryBottomAnchor) — NÃO abaixo do telefone.
    assert.ok(
        /spec\.secondary[\s\S]*?truthy\(cfgValue\('highlight'\)\)[\s\S]*?secondaryBottomAnchor\(\)/.test(src),
        'O campo secundário (único, com Destaque) deve usar secondaryBottomAnchor (rodapé).'
    );
    assert.ok(
        /function secondaryBottomAnchor\(\)[\s\S]*?addressInsertAfterEnd\('billing'\)[\s\S]*?addressInsertAfterEnd\('shipping'\)/.test(src),
        'secondaryBottomAnchor deve considerar billing e shipping.'
    );
    // E continuar renderizando por contexto quando NÃO há destaque.
    assert.ok(
        /CONTEXTS\.forEach\(function \(context\) \{[\s\S]*?addressInsertAfterEnd\(context\)/.test(src),
        'Sem destaque o Celular secundário permanece por endereço (addressInsertAfterEnd).'
    );
    // O "Destaque" é SÓ do telefone: o secundário NÃO usa o emailWrapper (âncora do destaque).
    const secondaryBlock = src.slice(src.indexOf('if (spec.secondary)'), src.indexOf('// Destaque ligado: um único campo abaixo do e-mail'));
    assert.ok(!secondaryBlock.includes('emailWrapper'), 'O secundário NÃO deve usar a âncora do destaque (emailWrapper).');
});

test('[cellphone-secondary] COMPILADO do CellphoneFieldBoth reflete o build', () => {
    const compiled = read(path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergCellphoneFieldBoth.COMPILED.js'));
    assert.ok(
        compiled.includes('billing_shipping_cellphone') || /billing_shipping_/.test(compiled),
        'O bundle compilado deve conter o id do campo único (build atualizado).'
    );
});

test('[cellphone-secondary] grava o valor DIGITADO (sem DDI inferido)', () => {
    const src = read(SOURCE);

    // O secundário é o único campo cuja meta NÃO recebe `+55` do backend: o store
    // tem que receber o valor digitado, só sem caracteres especiais — com o `+55`
    // preservado quando o cliente digitou e sem somar DDI quando não digitou.
    assert.ok(
        /var verbatimValue = \(spec\.kind === 'cellphone' && spec\.secondary === true\)/.test(src),
        'O campo "Celular" secundário deve usar o valor VERBATIM.'
    );
    assert.ok(
        /val = verbatimValue \? phoneValueVerbatim\(val\) : phoneValueForStorage\(val\)/.test(src),
        'No handler de digitação o secundário usa phoneValueVerbatim (não o de storage).'
    );
    assert.ok(
        /phoneValueForStorage,\s*\n\s*phoneValueVerbatim\s*\n\} from '\.\/BrazilPhoneMask\.js'/.test(src),
        'PhoneField.js deve importar phoneValueVerbatim.'
    );
});
