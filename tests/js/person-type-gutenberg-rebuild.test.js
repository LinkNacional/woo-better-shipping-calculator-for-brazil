'use strict';

/**
 * Regressão: recriação dos campos de Tipo de Pessoa (CPF/CNPJ) no checkout em BLOCOS.
 *
 * Bug corrigido: ao trocar um CPF preenchido por um CNPJ e depois marcar o checkbox
 * "usar o mesmo endereço para cobrança", os campos eram REMOVIDOS e RECRIADOS. Na
 * recriação, o `addPersonTypeFields` reaplicava o documento ESTÁTICO vindo do PHP
 * (`WooBetterPersonTypeData.billing_document` — em geral o CPF antigo do perfil) em
 * vez do documento atual salvo em memória (`savedPersonTypeData.billing_document`).
 * O evento `input` disparado logo após a recriação então revertia o CNPJ recém-
 * digitado para aquele CPF no backend (Store API `woo_better_person_type`).
 *
 * Correção: no branch "dados salvos" do `addPersonTypeFields`, reatribuir também
 * `initialDocument = savedPersonTypeData.billing_document`.
 *
 * Este teste trava o contrato no FONTE e garante que o COMPILADO está atualizado.
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergPersonType.js');
const COMPILED = path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergPersonType.COMPILED.js');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[person-type] o branch de dados salvos reatribui o documento atual', () => {
    const src = read(SOURCE);

    assert.ok(
        /initialDocument\s*=\s*savedPersonTypeData\.billing_document;/.test(src),
        'O branch "dados salvos" deve reatribuir initialDocument = savedPersonTypeData.billing_document, senão a recriação reaplica o documento estático do PHP.'
    );

    // Garante que a reatribuição está DENTRO do bloco de dados salvos (antes do
    // `else`), junto das demais reatribuições.
    const start = src.indexOf('if (savedPersonTypeData.billing_document) {');
    const end = src.indexOf('} else {', start);
    const savedBlock = src.slice(start, end > start ? end : start + 2000);
    assert.ok(
        /initialCompany = savedPersonTypeData\.billing_company;/.test(savedBlock) &&
            /initialDocument = savedPersonTypeData\.billing_document;/.test(savedBlock),
        'A reatribuição de initialDocument deve ficar junto das demais (persontype/cpf/cnpj/company) no bloco de dados salvos.'
    );
});

test('[person-type] COMPILADO contém a reatribuição (build atualizado)', () => {
    const compiled = read(COMPILED);

    // Padrão tolerante à minificação: <var>=<var>.billing_company,<var>=<var>.billing_document)
    assert.ok(
        /billing_company\s*,\s*[A-Za-z_$][\w$]*\s*=\s*[A-Za-z_$][\w$]*\.billing_document\s*\)/.test(compiled),
        'O bundle compilado deve conter a reatribuição do documento no branch de dados salvos — rode `npm run build:public`.'
    );
});
