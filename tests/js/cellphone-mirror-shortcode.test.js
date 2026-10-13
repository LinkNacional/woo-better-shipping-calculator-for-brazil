'use strict';

/**
 * Regressão: espelho Telefone → Celular (shim) no checkout CLÁSSICO/shortcode.
 *
 * No modo "Permitir Telefone Celular e Fixo" com o bloco "Campo de Celular"
 * DESLIGADO, o plugin registra `billing_cellphone`/`shipping_cellphone` como campo
 * ESCONDIDO (compatibilidade PagBank/Asaas/NFe). O script
 * `...CheckoutCellphoneMirrorShortcode.js` copia o valor do telefone nativo
 * (#billing_phone/#shipping_phone) para o campo escondido enquanto o cliente digita,
 * para o valor também chegar no `$_POST` (além do espelho no servidor).
 *
 * Este teste trava o contrato no FONTE e garante que o COMPILADO está atualizado.
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const MIRROR_SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilCheckoutCellphoneMirrorShortcode.js');
const MIRROR_COMPILED = path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutCellphoneMirrorShortcode.COMPILED.js');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[mirror] espelha o telefone no campo escondido de celular', () => {
    const src = read(MIRROR_SOURCE);

    assert.ok(src.includes('_phone'), 'Deve localizar o input de telefone (*_phone).');
    assert.ok(src.includes('_cellphone'), 'Deve localizar o input escondido de celular (*_cellphone).');
    assert.ok(
        /cell\.value\s*=\s*phone\.value/.test(src),
        'O valor do telefone deve ser copiado para o campo de celular (cell.value = phone.value).'
    );
});

test('[mirror] cobre billing e shipping + envio do formulário', () => {
    const src = read(MIRROR_SOURCE);

    assert.ok(src.includes("['billing', 'shipping']"), 'Deve tratar billing E shipping.');
    assert.ok(
        src.includes("'input'") && src.includes("'change'"),
        'Deve mirar os eventos de digitação (input/change).'
    );
    assert.ok(
        /addEventListener\(\s*'submit'/.test(src),
        'Deve re-sincronizar no submit do formulário (garante o valor no $_POST).'
    );
});

test('[mirror] só roda quando habilitado pelo PHP (shim)', () => {
    const src = read(MIRROR_SOURCE);
    assert.ok(
        src.includes('wc_better_cellphone_mirror_vars'),
        'Deve checar a flag localizada pelo PHP (wc_better_cellphone_mirror_vars).'
    );
});

test('[mirror] espera o DOM (não chama observe com body nulo)', () => {
    const src = read(MIRROR_SOURCE);
    assert.ok(
        src.includes("readyState === 'loading'") && src.includes("'DOMContentLoaded'"),
        'O script é enfileirado no <head> (sem in_footer); precisa esperar o DOM antes de MutationObserver.observe(document.body) — senão lança "parameter 1 is not of type Node".'
    );
    assert.ok(
        /if\s*\(\s*!document\.body\s*\)/.test(src),
        'O start() deve abortar se document.body ainda não existe (guarda contra body nulo).'
    );
});

test('[mirror] COMPILADO contém o contrato (build atualizado)', () => {
    const compiled = read(MIRROR_COMPILED);
    assert.ok(
        compiled.includes('wc_better_cellphone_mirror_vars'),
        'O bundle compilado deve conter a flag "wc_better_cellphone_mirror_vars" — rode `npm run build:public`.'
    );
    assert.ok(
        compiled.includes('_cellphone'),
        'O bundle compilado deve referenciar o campo "*_cellphone".'
    );
});
