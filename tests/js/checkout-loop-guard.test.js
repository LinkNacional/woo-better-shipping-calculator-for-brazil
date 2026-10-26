'use strict';

/**
 * Regressão: LOOP INFINITO no checkout em blocos ao alternar o checkbox
 * "usar o mesmo endereço para cobrança" (`use-address-for-billing`).
 *
 * Bug: aquele checkbox é observado por 7 scripts ao mesmo tempo
 * (ShippingAsBilling + PersonType/Birthdate/Gender/IE/IM/RG). Os campos
 * injetados chamavam `wc.blocksCheckout.extensionCartUpdate()` em caminhos
 * ESTRUTURAIS (remoção/recriação do campo e reaplicação do valor via
 * `setInputValue`, que dispara `input` sintético). Cada chamada faz um POST no
 * Store API e RESETA o checkout em blocos; o reset apagava e recriava os
 * campos injetados, que reenviavam dados — fechando um loop de requisições que
 * travava a página e consumia toda a memória.
 *
 * Contrato travado aqui:
 *   1. `saveShippingAsBillingToExtensionData()` NÃO usa `extensionCartUpdate`
 *      (o valor vai no POST do checkout via `setExtensionData`); os demais
 *      módulos só chamam `extensionCartUpdate` quando o payload MUDOU.
 *   2. Os caminhos de limpeza/remoção (`clear*DataFromStore`) não empurram nada
 *      ao carrinho.
 *   3. `executeDataUpdate()` do PersonType não envia payload vazio quando os
 *      campos estão ausentes (meio do reset).
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const JS = path.join(ROOT, 'Public/js');
const COMPILED = path.join(ROOT, 'Public/jsCompiled');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

function source(name) {
    return read(path.join(JS, `WcBetterShippingCalculatorForBrazilPublicGutenberg${name}.js`));
}

function compiled(name) {
    return read(path.join(COMPILED, `WcBetterShippingCalculatorForBrazilPublicGutenberg${name}.COMPILED.js`));
}

/**
 * Extrai o corpo de uma função pelo início (ex.: `function foo(`) contando
 * chaves. Simples e suficiente para arquivos deste plugin (sem template
 * strings com chaves desbalanceadas nos trechos testados).
 */
function functionBody(src, signature) {
    const start = src.indexOf(signature);
    assert.ok(start !== -1, `Função não encontrada no fonte: ${signature}`);

    const open = src.indexOf('{', start);
    assert.ok(open !== -1, `Corpo não encontrado para: ${signature}`);

    let depth = 0;
    for (let i = open; i < src.length; i += 1) {
        const char = src[i];
        if (char === '{') depth += 1;
        if (char === '}') {
            depth -= 1;
            if (depth === 0) return src.slice(open, i + 1);
        }
    }

    throw new Error(`Chaves desbalanceadas ao ler: ${signature}`);
}

// ---------------------------------------------------------------------------
// 1. shipping-as-billing: nada de extensionCartUpdate (era o gatilho do clique)
// ---------------------------------------------------------------------------

/**
 * Remove comentários (`// ...` de linha inteira e blocos `/* ... *\/) — os
 * próprios comentários de REASON citam o código antigo (`extensionCartUpdate`,
 * `previousElementSibling !==`, `id^="checkbox-control"`), então as asserções de
 * "não usa mais" precisam olhar só o código.
 */
function codeOnly(body) {
    return body
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter((line) => !/^\s*\/\//.test(line))
        .join('\n');
}

test('[shipping-as-billing] não usa extensionCartUpdate (não reseta o checkout)', () => {
    const body = codeOnly(functionBody(source('ShippingAsBilling'), 'function saveShippingAsBillingToExtensionData('));

    assert.ok(
        !body.includes('extensionCartUpdate'),
        'O envio do "usar o mesmo endereço" não pode chamar extensionCartUpdate: ele faz POST e reseta o checkout (loop com os campos injetados). O valor vai no POST do checkout via setExtensionData.'
    );

    assert.ok(
        body.includes('setExtensionData'),
        'O valor DEVE continuar indo por setExtensionData (é o que o PHP lê em process_shipping_as_billing_from_request via extensions).'
    );
});

test('[shipping-as-billing] só reenvia quando o valor mudou', () => {
    const body = functionBody(source('ShippingAsBilling'), 'function saveShippingAsBillingToExtensionData(');

    assert.ok(
        /lastSentShippingAsBilling\s*===\s*data\.use_shipping_as_billing/.test(body) &&
            /lastSentShippingAsBilling\s*=\s*data\.use_shipping_as_billing/.test(body),
        'Deve existir a guarda `lastSentShippingAsBilling` antes de enviar, para não repetir o mesmo estado.'
    );
});

// ---------------------------------------------------------------------------
// 2. Caminhos de limpeza/remoção não empurram dados ao carrinho
// ---------------------------------------------------------------------------

test('[limpeza] clear*DataFromStore não chama extensionCartUpdate', () => {
    const cases = [
        ['PersonType', 'function clearPersonTypeDataFromStore('],
        ['Birthdate', 'function clearBirthdateDataFromStore('],
        ['Gender', 'function clearGenderDataFromStore('],
    ];

    cases.forEach(([file, signature]) => {
        const body = codeOnly(functionBody(source(file), signature));
        assert.ok(
            !body.includes('extensionCartUpdate'),
            `${file}: o caminho de remoção do campo não pode chamar extensionCartUpdate — é evento estrutural (reset do checkout), não mudança de valor.`
        );
        assert.ok(
            body.includes('setExtensionData'),
            `${file}: o setExtensionData deve permanecer (limpa o dado local sem POST).`
        );
    });
});

// ---------------------------------------------------------------------------
// 3. PersonType: sem payload vazio durante o reset + guarda de payload igual
// ---------------------------------------------------------------------------

test('[person-type] executeDataUpdate ignora o reset (campos ausentes) e só envia o que mudou', () => {
    const body = functionBody(source('PersonType'), 'function executeDataUpdate(');

    assert.ok(
        /if\s*\(\s*!personTypeInput\s*&&\s*!cpfInput\s*&&\s*!cnpjInput\s*&&\s*!companyInput\s*\)\s*\{\s*return;/.test(
            body
        ),
        'Sem nenhum campo no DOM (meio do reset do checkout) o update deve abortar, senão envia payload vazio e realimenta o reset.'
    );

    assert.ok(
        /lastSentPersonTypeData\s*===\s*serializedPersonTypeData/.test(body),
        'Deve comparar o payload serializado com o último enviado antes do extensionCartUpdate.'
    );
});

// ---------------------------------------------------------------------------
// 4. Birthdate/Gender: guarda de valor antes do extensionCartUpdate
// ---------------------------------------------------------------------------

test('[birthdate/gender] só enviam ao carrinho quando o valor mudou', () => {
    const birthdate = functionBody(source('Birthdate'), 'function saveBirthdateToExtensionData(');
    assert.ok(
        /lastSentBirthdateData\s*===\s*data\.billing_birthdate/.test(birthdate),
        'Birthdate: faltou a guarda por valor antes do extensionCartUpdate.'
    );

    const gender = functionBody(source('Gender'), 'function saveGenderToExtensionData(');
    assert.ok(
        /lastSentGenderData\s*===\s*data\.billing_gender/.test(gender),
        'Gender: faltou a guarda por valor antes do extensionCartUpdate.'
    );
});

// ---------------------------------------------------------------------------
// 5. IE/IM/RG: `setInputValue` dispara `input` sintético na recriação do campo
//    → o handler reenviava o MESMO valor e resetava o checkout de novo.
// ---------------------------------------------------------------------------

test('[ie/im/rg] update*StoreData ignora valor repetido', () => {
    const cases = [
        ['IEField', 'function updateIEStoreData(', /lastSentIEValue\s*===\s*payload\.billing_ie/],
        ['IMField', 'function updateIMStoreData(', /lastSentIMValue\s*===\s*payload\.billing_im/],
        ['RGField', 'function updateRGStoreData(', /lastSentRGValue\s*===\s*payload\.billing_rg/],
    ];

    cases.forEach(([file, signature, guard]) => {
        const body = functionBody(source(file), signature);
        assert.ok(
            guard.test(body),
            `${file}: a recriação do campo reaplica o valor via setInputValue (dispara 'input'), então o envio precisa ser ignorado quando o valor é o mesmo.`
        );
    });
});

// ---------------------------------------------------------------------------
// 6. Bundles compilados atualizados (senão o front continua com o loop)
// ---------------------------------------------------------------------------

test('[compilado] shipping-as-billing sem chamada de extensionCartUpdate', () => {
    const bundle = compiled('ShippingAsBilling');

    assert.ok(
        !bundle.includes('extensionCartUpdate'),
        'O bundle compilado ainda chama extensionCartUpdate — rode `npm run build:public`.'
    );
    assert.ok(
        bundle.includes('setExtensionData'),
        'O bundle compilado deve continuar enviando por setExtensionData.'
    );
});

test('[compilado] cada namespace é enviado uma única vez (sem o caminho de limpeza)', () => {
    const expected = {
        PersonType: 'woo_better_person_type',
        Birthdate: 'woo_better_birthdate',
        Gender: 'woo_better_gender',
        IEField: 'woo_better_ie_field',
        IMField: 'woo_better_im_field',
        RGField: 'woo_better_rg_field',
    };

    Object.entries(expected).forEach(([file, namespace]) => {
        const bundle = compiled(file);
        const occurrences = bundle.split(`namespace:"${namespace}"`).length - 1;

        assert.strictEqual(
            occurrences,
            1,
            `${file}: esperado exatamente 1 envio ao carrinho para "${namespace}" (encontrado ${occurrences}). Se subiu, algum caminho estrutural voltou a empurrar dados — rode \`npm run build:public\` depois de corrigir.`
        );
    });
});

test('[compilado] guarda de payload presente antes do extensionCartUpdate', () => {
    const cases = [
        ['PersonType', /JSON\.stringify\([^)]*\);[A-Za-z_$][\w$]*!==[A-Za-z_$][\w$]*&&/],
        ['Birthdate', /!==[A-Za-z_$][\w$]*\.billing_birthdate&&/],
        ['Gender', /!==[A-Za-z_$][\w$]*\.billing_gender&&/],
        ['IEField', /!==[A-Za-z_$][\w$]*\.billing_ie&&/],
        ['IMField', /!==[A-Za-z_$][\w$]*\.billing_im&&/],
        ['RGField', /!==[A-Za-z_$][\w$]*\.billing_rg&&/],
    ];

    cases.forEach(([file, guard]) => {
        const bundle = compiled(file);
        assert.ok(
            guard.test(bundle),
            `${file}: o bundle compilado perdeu a guarda de payload — rode \`npm run build:public\`.`
        );
    });
});

// ---------------------------------------------------------------------------
// 7. Reposicionamento dos campos injetados: cadeia canônica (o loop de verdade)
//
// Bug real (reproduzido em Chrome headless): ao desmarcar "usar o mesmo endereço
// para cobrança", RG e IE resolviam a MESMA âncora (`#billing_document`) quando a
// Empresa está desabilitada e o RG ainda não existe. Cada script se reposicionava
// com `previousElementSibling !== referencia`, então um empurrava o outro para
// fora da posição e o observer do outro movia de volta — ping-pong SÍNCRONO:
// ~700 reposicionamentos em 2,5s, main thread travada, aba sem responder.
//
// Correção: `core/CheckoutFieldOrder.js` define a cadeia
// documento → empresa → RG → IE → IM e a posição é "o primeiro campo NOSSO depois
// do antecessor sou eu?" (ignora inputs hidden e campos nativos). Cada campo tem
// antecessor único e o conjunto converge.
// ---------------------------------------------------------------------------

const ORDER_CORE = path.join(ROOT, 'Public/js/core/CheckoutFieldOrder.js');
const SAME_ADDRESS_CORE = path.join(ROOT, 'Public/js/core/CheckoutSameAddress.js');

test('[ordem] o módulo da cadeia define a ordem canônica e não usa previousElementSibling', () => {
    const src = codeOnly(read(ORDER_CORE));

    assert.ok(
        /FIELD_CHAIN\s*=\s*\['document',\s*'company',\s*'rg',\s*'ie',\s*'im'\]/.test(src),
        'A cadeia canônica deve ser documento → empresa → RG → IE → IM.'
    );

    assert.ok(
        !src.includes('previousElementSibling !=='),
        'A checagem "previousElementSibling !== âncora" é o que gera o ping-pong quando dois campos compartilham o antecessor.'
    );

    assert.ok(
        src.includes('insertAdjacentElement') && src.includes('isChainFieldPlaced'),
        'O módulo deve reposicionar apenas quando o campo não está na posição canônica.'
    );

    assert.ok(
        src.includes('node.parentElement !== container'),
        'O módulo não pode arrastar o campo para outro formulário (cobrança ↔ entrega) — quem troca de container é o próprio script do campo.'
    );
});

test('[ordem] RG/IE/IM usam a cadeia canônica em vez de previousElementSibling', () => {
    [['RGField', 'rg'], ['IEField', 'ie'], ['IMField', 'im']].forEach(([file, key]) => {
        const src = source(file);

        assert.ok(
            src.includes("from './core/CheckoutFieldOrder.js'"),
            `${file}: deve importar o módulo da cadeia canônica.`
        );

        assert.ok(
            new RegExp(`placeChainField\\(context\\.container, '${key}',`).test(src),
            `${file}: deve reposicionar o campo via placeChainField(context.container, '${key}', ...).`
        );

        assert.ok(
            !/previousElementSibling !== referenceElement/.test(src),
            `${file}: a checagem antiga (previousElementSibling !== referência) causa o loop com outro campo que use a mesma âncora.`
        );

        assert.ok(
            new RegExp(`currentContainer\\.parentElement !== context\\.container`).test(src),
            `${file}: a troca de container (cobrança/entrega) deve olhar o PAI REAL no DOM — a flag fieldContainerType podia dizer "cobrança" com o campo na entrega.`
        );
    });
});

test('[ordem] âncoras globais só valem dentro do próprio formulário', () => {
    [['RGField'], ['IEField'], ['IMField']].forEach(([file]) => {
        const src = source(file);
        const refStart = src.indexOf('function getReferenceElement(');

        assert.notStrictEqual(refStart, -1, `${file}: precisa de getReferenceElement.`);
        const refBody = src.slice(refStart, src.indexOf('function ensure', refStart));

        assert.ok(
            /container\.contains\(documentInput\)/.test(refBody),
            `${file}: '#billing_document' é global (pode estar dentro do formulário de entrega); usar sem \`container.contains\` ancora o campo no formulário errado e a recriação entra em loop.`
        );
    });
});

test('[mesmo endereço] um único seletor do checkbox para todos os scripts', () => {
    const core = read(SAME_ADDRESS_CORE);

    assert.ok(
        core.includes('.wc-block-checkout__use-address-for-billing input[type="checkbox"]'),
        'O seletor estável é a classe do próprio WooCommerce.'
    );

    assert.ok(
        !core.includes("id^=\\\"checkbox-control\\\"") && !core.includes("id^='checkbox-control'"),
        'O seletor por id "checkbox-control" pega o PRIMEIRO checkbox da página (ids sequenciais), não o do mesmo endereço.'
    );

    ['PersonType', 'Birthdate', 'Gender'].forEach((file) => {
        const src = source(file);
        const code = codeOnly(src);

        assert.ok(
            src.includes("from './core/CheckoutSameAddress.js'"),
            `${file}: deve usar o helper de mesmo endereço.`
        );

        assert.ok(
            src.includes('return isUsingSameAddress();'),
            `${file}: a decisão cobrança/entrega deve vir do helper.`
        );

        assert.ok(
            !code.includes('id^="checkbox-control"'),
            `${file}: o seletor antigo (primeiro checkbox da página) fazia o script concluir "entrega" enquanto IE/IM/RG concluíam "cobrança" — os campos iam e voltavam entre os formulários.`
        );
    });
});
