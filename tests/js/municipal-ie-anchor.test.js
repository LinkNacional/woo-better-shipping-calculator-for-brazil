'use strict';

/**
 * Regressão: precedência dos campos IE e IM no checkout em BLOCOS.
 *
 * Bug corrigido: com os recursos "Inscrição Estadual (IE)" e "Inscrição Municipal
 * (IM)" ligados ao mesmo tempo, o checkout em blocos entrava em LOOP infinito (a
 * página "só ficava carregando").
 *
 * Causa: cada script tem um MutationObserver em `document.body` que reposiciona o
 * seu campo quando o elemento anterior NÃO é o `getReferenceElement()` calculado.
 * IE e IM resolviam para o MESMO âncora (Empresa/documento), então cada observer
 * movia o seu campo para a frente do outro para sempre — um loop de mutações no DOM.
 *
 * Correção: o IM ancora logo APÓS o campo IE (`.wc-better-billing-ie`) quando ele
 * existe; só cai no âncora genérico (Empresa/documento) quando o IE está desligado.
 * O IE permanece o primeiro (não conhece o IM).
 *
 * Este teste trava o contrato no FONTE e garante que o COMPILADO está atualizado.
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const IM_SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergIMField.js');
const IM_COMPILED = path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergIMField.COMPILED.js');
const IE_SOURCE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergIEField.js');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[IM] ancora logo após o campo IE (evita o loop de reposicionamento)', () => {
    const src = read(IM_SOURCE);

    const ieAnchor = src.indexOf("querySelector('.wc-better-billing-ie')");
    const companyAnchor = src.indexOf("querySelector('.wc-better-billing-company')");

    assert.notStrictEqual(ieAnchor, -1, 'O IM deve ancorar no container do IE (.wc-better-billing-ie).');
    assert.notStrictEqual(companyAnchor, -1, 'O IM deve manter o fallback para o container da Empresa.');

    assert.ok(
        ieAnchor < companyAnchor,
        'O âncora do IE precisa ser avaliado ANTES do âncora genérico (Empresa), senão IE e IM disputam o mesmo elemento e entram em loop.'
    );
});

test('[IM] COMPILADO contém o âncora do IE (build atualizado)', () => {
    const compiled = read(IM_COMPILED);

    assert.ok(
        compiled.includes('wc-better-billing-ie'),
        'O bundle compilado do IM deve conter a âncora ".wc-better-billing-ie" — rode `npm run build:public` após alterar o fonte.'
    );
    assert.ok(
        compiled.includes('wc-better-billing-im'),
        'O bundle compilado do IM deve conter a classe do próprio campo ".wc-better-billing-im".'
    );
});

test('[IE] permanece o primeiro (não ancora no IM)', () => {
    const src = read(IE_SOURCE);

    assert.ok(
        !src.includes('.wc-better-billing-im'),
        'O IE não deve ancorar no IM: a ordem canônica é IE antes de IM. Inverter reintroduz o loop.'
    );
});

test('[IM] label é filho DIRETO do container (alinhamento de tema)', () => {
    // Temas (ex.: Woodmart) reposicionam a label flutuante com combinador de FILHO
    // DIRETO: `… .wc-block-components-text-input>label{top:21px;line-height:1}`.
    // Os campos nativos e o CPF/CNPJ têm a label como filho direto do container; se
    // o label ficar DENTRO do wrapper, não recebe a regra e fica ~4px desalinhado no
    // repouso (o float no foco/digitação continua igual, por isso só "volta" torto).
    for (const file of [IM_SOURCE, IE_SOURCE]) {
        const src = read(file);
        const name = path.basename(file);

        assert.ok(
            /container\.appendChild\(label\)/.test(src),
            `${name}: a label deve ser anexada direto no container (container.appendChild(label)).`
        );
        assert.ok(
            !/fieldMainWrapper\.appendChild\(label\)/.test(src),
            `${name}: a label NÃO pode ficar dentro do wrapper (senão ignora a regra de tema '> label').`
        );
    }
});

test('[IM] não reutiliza os flags de dataset do IE (evita o delay de visibilidade)', () => {
    const src = read(IM_SOURCE);

    // IE e IM são scripts separados que rodam sobre os MESMOS elementos (#billing_document,
    // #billing-persontype, #billing-country). Se compartilharem o flag `dataset.ieVisibilityListener`,
    // o IE (enfileirado antes) marca o flag e o IM nunca registra os próprios listeners de
    // input/change — a visibilidade do IM passaria a depender só do MutationObserver, com
    // atraso para aparecer/sumir.
    assert.ok(
        !src.includes('dataset.ieVisibilityListener'),
        'O IM deve usar um flag próprio (dataset.imVisibilityListener), não o do IE.'
    );
    assert.ok(
        !src.includes('dataset.ieContainerListener'),
        'O IM deve usar um flag próprio (dataset.imContainerListener), não o do IE.'
    );
    assert.ok(
        src.includes('dataset.imVisibilityListener'),
        'O IM precisa marcar/checar o próprio flag (dataset.imVisibilityListener).'
    );

    const compiled = read(IM_COMPILED);
    assert.ok(
        !compiled.includes('ieVisibilityListener'),
        'O bundle compilado do IM não pode conter o flag do IE — rode `npm run build:public`.'
    );
});
