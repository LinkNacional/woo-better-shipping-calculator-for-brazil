'use strict';

/**
 * Regressão: campo de RG no checkout (blocos e clássico/shortcode).
 *
 * Contrato travado:
 *  1. O RG é VINCULADO ao CPF: a visibilidade exige documento com 11 dígitos
 *     (CPF) e o campo NUNCA aparece em contexto de CNPJ (14 dígitos);
 *  2. No checkout em BLOCOS o RG ancora no container do CPF/CNPJ
 *     (`#billing_document`) — âncora exclusivo dele. Para não repetir o bug de
 *     LOOP do IE/IM (dois observers disputando o mesmo âncora), o IE passa a
 *     preferir `.wc-better-billing-rg` antes de cair no container do documento;
 *  3. O valor trafega no namespace `woo_better_rg_field` (Store API), igual ao
 *     IE/IM, e o meta é o do plugin Brazilian (`billing_rg` / `_billing_rg`);
 *  4. Os COMPILADOS estão atualizados em relação aos fontes.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const RG_GUTENBERG_SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergRGField.js');
const RG_GUTENBERG_COMPILED = path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergRGField.COMPILED.js');
const RG_SHORTCODE_SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicShortcodeRGField.js');
const RG_SHORTCODE_COMPILED = path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeRGField.COMPILED.js');
const IE_SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergIEField.js');
const IE_COMPILED = path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergIEField.COMPILED.js');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[RG/Gutenberg] só exibe para CPF (11 dígitos), nunca para CNPJ', () => {
    const src = read(RG_GUTENBERG_SOURCE);

    assert.ok(
        src.includes('cleanDocument.length === 11') || src.includes('hasCompleteCpf'),
        'A visibilidade do RG deve depender de um CPF completo (11 dígitos).'
    );

    assert.ok(
        !src.includes('cleanDocument.length === 14'),
        'O RG não pode usar a regra de CNPJ (14 dígitos) do IE/IM — é documento de pessoa física.'
    );
});

test('[RG/Shortcode] só exibe para CPF e respeita o "Tipo de Cliente"', () => {
    const src = read(RG_SHORTCODE_SOURCE);

    assert.ok(src.includes('cleanValue.length === 11'), 'A visibilidade do RG (clássico) deve exigir CPF (11 dígitos).');
    assert.ok(src.includes("currentPersonType === '1'"), 'No modo "Pessoa Física e Jurídica" o RG depende do tipo escolhido.');
    assert.ok(src.includes("personTypeConfig === 'physical'"), 'No modo exclusivamente físico o RG aparece para o CPF.');
});

test('[RG/Gutenberg] envia o valor no namespace woo_better_rg_field', () => {
    const src = read(RG_GUTENBERG_SOURCE);

    assert.ok(
        src.includes("setExtensionData('woo_better_rg_field'") &&
        src.includes("namespace: 'woo_better_rg_field'"),
        'O RG deve usar o namespace woo_better_rg_field no Store API (setExtensionData + extensionCartUpdate).'
    );
});

test('[RG/Gutenberg] ancora no container do CPF/CNPJ (âncora exclusivo do RG)', () => {
    const src = read(RG_GUTENBERG_SOURCE);
    const refStart = src.indexOf('function getReferenceElement(');
    assert.notStrictEqual(refStart, -1, 'O RG precisa de um getReferenceElement.');

    const refBody = src.slice(refStart, src.indexOf('function ensureAddressEditorOpen'));

    assert.ok(refBody.includes("getElementById('billing_document')"), 'O RG deve ancorar no campo CPF/CNPJ (#billing_document).');
    assert.ok(
        !refBody.includes('wc-better-billing-ie') && !refBody.includes('wc-better-billing-im'),
        'O RG não pode ancorar no IE/IM — âncoras repetidos causam loop de reposicionamento no checkout em blocos.'
    );
});

test('[IE] prefere o campo RG antes do container do documento (anti-loop)', () => {
    const src = read(IE_SOURCE);
    const refStart = src.indexOf('function getReferenceElement(');
    assert.notStrictEqual(refStart, -1, 'O IE precisa de um getReferenceElement.');

    // Só o corpo do getReferenceElement importa: o arquivo usa
    // getElementById('billing_document') em outros pontos (ex.: isCnpjContext).
    const refBody = src.slice(refStart, src.indexOf('function ensureAddressEditorOpen', refStart));

    const companyAnchor = refBody.indexOf("querySelector('.wc-better-billing-company')");
    const rgAnchor = refBody.indexOf("querySelector('.wc-better-billing-rg')");
    const documentAnchor = refBody.indexOf("getElementById('billing_document')");

    assert.notStrictEqual(rgAnchor, -1, 'O IE deve conhecer o campo RG (.wc-better-billing-rg) como âncora.');
    assert.ok(
        companyAnchor < rgAnchor && rgAnchor < documentAnchor,
        'O IE deve preferir a Empresa, depois o RG e só então o container do documento — senão RG e IE disputam o mesmo âncora.'
    );
});

test('[RG/Gutenberg] envio ao Store API tem debounce de 500ms (não dispara por tecla)', () => {
    const src = read(RG_GUTENBERG_SOURCE);
    const compiled = read(RG_GUTENBERG_COMPILED);

    assert.ok(
        /const UPDATE_DATA_DELAY = 500/.test(src),
        'O RG deve agrupar a digitação num debounce de 500ms antes de chamar o Store API.'
    );

    // O envio (setExtensionData/extensionCartUpdate) precisa estar DENTRO do timeout.
    const bindStart = src.indexOf("rgInput.addEventListener('input'");
    assert.notStrictEqual(bindStart, -1, 'O RG precisa do listener de input.');
    const bindBody = src.slice(bindStart, src.indexOf("rgInput.addEventListener('blur'"));

    assert.ok(
        bindBody.includes('setTimeout(') && bindBody.includes('UPDATE_DATA_DELAY'),
        'O listener de input deve apenas agendar o envio (setTimeout + UPDATE_DATA_DELAY), nunca chamar o Store API direto.'
    );

    assert.ok(
        compiled.includes('},500)'),
        'O bundle compilado deve conter o debounce de 500ms — rode `npm run build:public`.'
    );
});

test('[RG] COMPILADOS atualizados (rode `npm run build:public`)', () => {
    const gutenberg = read(RG_GUTENBERG_COMPILED);
    const shortcode = read(RG_SHORTCODE_COMPILED);
    const ie = read(IE_COMPILED);

    assert.ok(gutenberg.includes('woo_better_rg_field'), 'O bundle do RG (blocos) deve conter o namespace woo_better_rg_field.');
    assert.ok(gutenberg.includes('wc-better-billing-rg'), 'O bundle do RG (blocos) deve conter a classe .wc-better-billing-rg.');
    assert.ok(shortcode.includes('billing_rg'), 'O bundle do RG (clássico/edit-address) deve conter billing_rg.');
    assert.ok(ie.includes('wc-better-billing-rg'), 'O bundle do IE deve conter a âncora do RG (build atualizado).');
});
