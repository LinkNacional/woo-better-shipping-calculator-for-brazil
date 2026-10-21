'use strict';

/**
 * Regressão: esconder um campo NÃO pode apagar o que o cliente já digitou.
 *
 * Bug (checkout CLÁSSICO/shortcode): ao corrigir o documento o cliente apagava e
 * redigitava o CNPJ/CPF. A cada alteração o documento fica "incompleto"
 * (≠ 14 dígitos para CNPJ / ≠ 11 para CPF), o campo é escondido — e o `hide` era
 * chamado com `clearValue = true`, apagando IE, IM, RG e Empresa. Ao redigitar o
 * documento, os campos voltavam VAZIOS.
 *
 * O checkout em BLOCOS nunca fez isso (`hideIEField()`/`hideIMField()` sem
 * limpeza, e em `...GutenbergPersonType.js` o comentário é explícito: "Não limpar
 * o campo, apenas esconder para manter flexibilidade"). O clássico passa a
 * espelhar esse comportamento — esconder é só visual.
 *
 * A limpeza correta continua acontecendo no SERVIDOR, na meta do PEDIDO, quando o
 * documento não bate (`process_ie_from_data`, `process_im_from_data`,
 * `process_rg_from_data`), então nada vaza para o pedido.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const SHORTCODE = {
    ie: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicShortcodeIEField.js'),
    im: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicShortcodeIMField.js'),
    rg: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicShortcodeRGField.js'),
    personType: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.js'),
};

const COMPILED = {
    ie: path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeIEField.COMPILED.js'),
    im: path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeIMField.COMPILED.js'),
    rg: path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeRGField.COMPILED.js'),
    personType: path.join(ROOT, 'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.COMPILED.js'),
};

const GUTENBERG = {
    ie: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergIEField.js'),
    im: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergIMField.js'),
    rg: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergRGField.js'),
    personType: path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergPersonType.js'),
};

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

/**
 * Extrai o corpo de uma função contando chaves (não depende de formatação).
 * Retorna null se a função não existir.
 */
function functionBody(source, name) {
    const start = source.indexOf(`function ${name}(`);
    if (start === -1) {
        return null;
    }

    const startBrace = source.indexOf('{', start);
    if (startBrace === -1) {
        return null;
    }

    let depth = 0;
    for (let i = startBrace; i < source.length; i++) {
        if (source[i] === '{') {
            depth++;
        } else if (source[i] === '}') {
            depth--;
            if (depth === 0) {
                return source.slice(startBrace, i + 1);
            }
        }
    }

    return null;
}

// ── Fonte: os hides do clássico NÃO limpam ───────────────────────────────────

const CASES = [
    { field: 'IE', file: 'ie', hide: 'hideIEField', input: 'ieInput' },
    { field: 'IM', file: 'im', hide: 'hideIMField', input: 'imInput' },
    { field: 'RG', file: 'rg', hide: 'hideRGField', input: 'rgInput' },
];

for (const testCase of CASES) {
    test(`[${testCase.field}/shortcode] hide não apaga o valor digitado`, () => {
        const source = read(SHORTCODE[testCase.file]);
        const body = functionBody(source, testCase.hide);

        assert.ok(body, `${testCase.hide} não encontrada em ${path.basename(SHORTCODE[testCase.file])}.`);
        assert.ok(
            !new RegExp(`${testCase.input}\\.value\\s*=\\s*''`).test(body),
            `${testCase.hide} NÃO pode limpar ${testCase.input} — esconder é só visual (o cliente perde o que digitou ao corrigir o documento).`
        );
        assert.ok(
            !/clearValue/.test(body),
            `${testCase.hide} não deve ter o parâmetro clearValue: a limpeza no hide foi o bug.`
        );
    });

    test(`[${testCase.field}/shortcode] chamadas de ${testCase.hide} não pedem limpeza`, () => {
        const source = read(SHORTCODE[testCase.file]);

        assert.ok(
            !new RegExp(`${testCase.hide}\\(\\s*true\\s*\\)`).test(source),
            `${testCase.hide}(true) não pode mais ser chamado (era o que apagava o valor).`
        );
    });
}

test('[Empresa/shortcode] hide não apaga a Empresa digitada', () => {
    const source = read(SHORTCODE.personType);

    for (const name of ['hideCompanyField', 'hideCompanyFieldOld']) {
        const body = functionBody(source, name);

        assert.ok(body, `${name} não encontrada.`);
        assert.ok(
            !/companyInput\.value\s*=\s*''/.test(body),
            `${name} NÃO pode limpar billing_company — espelha o bloco, que esconde mantendo o valor.`
        );
    }
});

// ── Paridade com o checkout em BLOCOS ────────────────────────────────────────

test('[paridade] os hides do Gutenberg continuam sem limpar (referência do comportamento)', () => {
    for (const testCase of CASES) {
        const body = functionBody(read(GUTENBERG[testCase.file]), testCase.hide);

        assert.ok(body, `${testCase.hide} não encontrada no fonte do Gutenberg.`);
        assert.ok(
            !new RegExp(`${testCase.input}\\.value\\s*=\\s*''`).test(body),
            `O bloco é a REFERÊNCIA: ${testCase.hide} não deve limpar o input.`
        );
    }

    const personTypeSource = read(GUTENBERG.personType);
    assert.ok(
        personTypeSource.includes('Não limpar o campo, apenas esconder para manter flexibilidade'),
        'O comentário do bloco documenta a intenção: esconder sem limpar.'
    );
});


test('[Empresa] required segue a visibilidade (CPF esconde e libera, CNPJ exige)', () => {
    const source = read(SHORTCODE.personType);

    const hideBody = functionBody(source, 'hideCompanyField');
    const showBody = functionBody(source, 'showCompanyField');

    assert.ok(hideBody && showBody, 'hideCompanyField/showCompanyField devem existir.');

    assert.ok(
        /setCompanyRequired\(\s*false\s*\)/.test(hideBody),
        'Ao esconder (CPF) a Empresa precisa deixar de ser obrigatória — senão um campo invisível bloqueia o envio.'
    );
    assert.ok(
        /setCompanyRequired\(\s*true\s*\)/.test(showBody),
        'Ao reexibir (CNPJ) a Empresa precisa voltar obrigatória.'
    );

    // `required` é atributo do INPUT; a classe vai no wrapper (contrato do WC).
    const setRequiredBody = functionBody(source, 'setCompanyRequired');
    assert.ok(setRequiredBody, 'setCompanyRequired deve existir.');
    assert.ok(
        /companyInput\.setAttribute\(\s*'required'/.test(setRequiredBody),
        'O required deve ser aplicado no INPUT (billing_company).'
    );
    assert.ok(
        /companyInput\.removeAttribute\(\s*'required'\s*\)/.test(setRequiredBody),
        'O required deve ser REMOVIDO do input quando o campo fica opcional.'
    );
});

test('[Empresa] o caminho CNPJ→CPF→CNPJ preserva o valor digitado', () => {
    const source = read(SHORTCODE.personType);

    // hideCompanyField/hideCompanyFieldOld não podem zerar o input.
    for (const name of ['hideCompanyField', 'hideCompanyFieldOld']) {
        const body = functionBody(source, name);
        assert.ok(body, `${name} não encontrada.`);
        assert.ok(
            !/companyInput\.value\s*=\s*''/.test(body),
            `${name} não pode limpar a Empresa (o cliente perde o valor ao corrigir o documento).`
        );
    }

    // ...e o show não pode recriar/zerar o input (só exibir).
    const showBody = functionBody(source, 'showCompanyField');
    assert.ok(
        !/companyInput\.value\s*=\s*''/.test(showBody),
        'showCompanyField não deve limpar a Empresa ao reexibir.'
    );
});

test('[Empresa] o servidor limpa a empresa do PEDIDO quando é CPF (não vaza)', () => {
    const php = read(path.join(ROOT, 'Includes/WcBetterShippingCalculatorForBrazil.php'));

    assert.ok(
        php.includes('// Salva a empresa apenas para CNPJ, limpa para CPF'),
        'O PHP deve manter a limpeza da empresa no PEDIDO quando o tipo é CPF.'
    );
    assert.ok(
        /set_billing_company\(''\)/.test(php),
        'O pedido de pessoa física não deve carregar billing_company.'
    );
});

// ── Compilados atualizados (o que roda de fato no site) ──────────────────────

test('[compilados] bundles do clássico refletem a correção', () => {
    // Cada bundle de Inscrição/RG deve conter a sincronização do "Isento"/required
    // no hide e NENHUMA atribuição de string vazia ao input do campo.
    const ieCompiled = read(COMPILED.ie);
    assert.ok(
        ieCompiled.includes('ISENTO'),
        'O bundle do IE deve manter a sincronização do checkbox "Isento" no hide.'
    );
    assert.ok(
        ieCompiled.includes('woo-better-ie-field') || ieCompiled.includes('billing_ie'),
        'O bundle do IE deve continuar controlando o campo billing_ie.'
    );

    // Assinatura do bug no bundle antigo: `t.value=""` dentro do hide do campo.
    assert.ok(
        !/hideIE[^(]*\(!0\)/.test(ieCompiled),
        'O bundle do IE não pode mais chamar o hide com "limpar" (true).'
    );

    const imCompiled = read(COMPILED.im);
    assert.ok(imCompiled.includes('billing_im'), 'O bundle da IM deve continuar controlando billing_im.');
    assert.ok(!/hideIM[^(]*\(!0\)/.test(imCompiled), 'O bundle da IM não pode mais chamar o hide com "limpar" (true).');

    const rgCompiled = read(COMPILED.rg);
    assert.ok(rgCompiled.includes('billing_rg'), 'O bundle do RG deve continuar controlando billing_rg.');
    assert.ok(!/hideRG[^(]*\(!0\)/.test(rgCompiled), 'O bundle do RG não pode mais chamar o hide com "limpar" (true).');

    const personTypeCompiled = read(COMPILED.personType);
    assert.ok(
        !personTypeCompiled.includes('billing_company")&&(') ||
            personTypeCompiled.includes('billing_company'),
        'O bundle de pessoa deve continuar controlando billing_company.'
    );
});
