'use strict';

/**
 * Regressão: dependência pai → filho ("join") do campo de RG na tela de
 * configurações de campos brasileiros.
 *
 * O "join" precisa de DUAS partes, e cada tela as implementa de um jeito:
 *
 *   A) JUNÇÃO visual (ninhar o campo filho dentro do card do pai)
 *      - tela ANTIGA (release 5.2.0): `targetComponentCartNames` em
 *        Admin/js/...AdminLayout.js move o `.forminp` e remove a `<tr>`;
 *      - tela NOVA (abas/cards): o template
 *        Admin/templates/...AdminSettingsLayout.php renderiza o filho dentro
 *        do bloco do pai lendo a chave `join` do array de campos.
 *
 *   B) COMPORTAMENTO (travar o filho quando o pai está em "Desabilitar")
 *      - tela ANTIGA: `joinPairs` em Admin/js/...AdminSettings.js;
 *      - tela NOVA: `initRgFieldState()` em
 *        Admin/js/...AdminLayoutBehaviors.js.
 *
 * O travamento é sempre VISUAL (`setDisabledState` → `window.wcBetterFakeDisabled`):
 * o atributo `disabled` não pode ser usado, porque input `disabled` não vai no POST e
 * a option mantém o valor antigo salvo (AGENTS.md § 7).
 *
 * O teste aceita qualquer das duas implementações, então vale nas duas
 * branches — o que ele NÃO aceita é o join desaparecer.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const PARTIAL = path.join(ROOT, 'Admin/partials/WcBetterShippingCalculatorForBrazilCheckoutSettings.php');

// Tela ANTIGA (release 5.2.0)
const SETTINGS_SOURCE = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminSettings.js');
const SETTINGS_COMPILED = path.join(ROOT, 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.js');
const LAYOUT_SOURCE = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayout.js');
const LAYOUT_COMPILED = path.join(ROOT, 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminLayout.COMPILED.js');

// Tela NOVA (abas/cards)
const BEHAVIORS_SOURCE = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayoutBehaviors.js');
const LAYOUT_TEMPLATE = path.join(ROOT, 'Admin/templates/WcBetterShippingCalculatorForBrazilAdminSettingsLayout.php');

const PARENT = 'woo_better_calc_enable_rg_field';
const CHILD = 'woo_better_calc_rg_required';

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

function exists(file) {
    return fs.existsSync(file);
}

test('[join] o PHP declara `join` no filho (fonte única das duas telas)', () => {
    const php = read(PARTIAL);

    assert.ok(php.includes("'rg_required' => array("), 'O campo rg_required deve existir na tela.');
    assert.ok(
        new RegExp(`'rg_required' => array\\([\\s\\S]{0,400}?'join'\\s*=>\\s*'${PARENT}'`).test(php),
        "`rg_required` deve trazer 'join' => 'woo_better_calc_enable_rg_field'."
    );
});

test('[join] a JUNÇÃO visual existe (tela antiga OU template novo)', () => {
    // Tela antiga: mapa que move o .forminp do filho para o card do pai.
    const telaAntiga = exists(LAYOUT_SOURCE)
        && new RegExp(`'${CHILD}'\\s*:\\s*'${PARENT}'`).test(read(LAYOUT_SOURCE));

    // Tela nova: o template renderiza o filho dentro do bloco do pai via `join`.
    const telaNova = exists(LAYOUT_TEMPLATE)
        && /\[\s*'join'\s*\]/.test(read(LAYOUT_TEMPLATE))
        && /children/i.test(read(LAYOUT_TEMPLATE));

    assert.ok(
        telaAntiga || telaNova,
        'O join precisa de uma junção visual: targetComponentCartNames (tela antiga) ou o template de cards (tela nova).'
    );
});

test('[join] o COMPORTAMENTO de travar o filho existe (tela antiga OU behaviors)', () => {
    // Tela antiga: lista `joinPairs` em AdminSettings.js.
    const antigoSource = read(SETTINGS_SOURCE);
    const telaAntiga = antigoSource.includes('joinPairs')
        && antigoSource.includes(`parent: '${PARENT}'`)
        && antigoSource.includes(`child: '${CHILD}'`);

    // Tela nova: initRgFieldState() em AdminLayoutBehaviors.js.
    const telaNova = exists(BEHAVIORS_SOURCE) && (() => {
        const src = read(BEHAVIORS_SOURCE);
        return src.includes('initRgFieldState')
            && src.includes(PARENT)
            && src.includes(CHILD)
            && src.includes('setDisabledState(');
    })();

    assert.ok(
        telaAntiga || telaNova,
        'O join precisa ser aplicado: `joinPairs` (tela antiga) ou `initRgFieldState` (tela nova).'
    );
});

test('[join] "Validar Número de Telefone" NÃO é travada pelo contato obrigatório', () => {
    // A validação só age em campo OBRIGATÓRIO (validate_phone_ddd_classic no clássico e
    // bindValidation no checkout em blocos), mas quem DECIDE ligá-la é o lojista: travar
    // e forçar "Desabilitar" a cada toggle do contato desfazia a escolha dele (o texto
    // do card já explica que a validação só age em campo obrigatório).
    const src = read(BEHAVIORS_SOURCE);

    const trecho = src.slice(
        src.indexOf('function updateValidateDddState()'),
        src.indexOf('function updateCellphoneRequiredState()')
    );

    assert.ok(trecho.length > 0, 'updateValidateDddState() deve existir em AdminLayoutBehaviors.js.');
    assert.ok(
        !/contactRequiredRadios/.test(trecho),
        'O estado de "Validar Número de Telefone" NÃO pode depender de `contact_required`.'
    );
    assert.ok(
        /var on = !isUnmanagedMode\(\);/.test(trecho),
        'Só o modo sem telefone gerenciado trava a opção.'
    );
    assert.ok(
        /setDisabledState\(validateDddRadios/.test(trecho),
        'O travamento precisa ser VISUAL (setDisabledState → fake disabled).'
    );

    // Nada de reescrever o `checked`: o valor escolhido pelo lojista é preservado.
    assert.ok(
        !/radio\.checked\s*=/.test(trecho),
        'A escolha do lojista não pode ser sobrescrita (nada de forçar "Desabilitar").'
    );

    // NUNCA o atributo `disabled` (AGENTS.md § 7): ele não vai no POST e a option
    // guardaria um "yes" fantasma.
    assert.ok(
        !/setAttribute\(\s*'disabled'/.test(trecho) && !/\.disabled\s*=/.test(trecho),
        'O travamento não pode usar o atributo `disabled` (só aparência).'
    );
});

test('[join] travar o filho NÃO reescreve o valor salvo (só aparência)', () => {
    // A opção é preservada porque o `checked` não é reescrito — e o valor que está
    // marcado VAI no POST (o travamento é visual, nunca o atributo `disabled`).
    // Ver AGENTS.md § 7 e tests/js/admin-fake-disabled.test.js.
    const alvos = [SETTINGS_SOURCE, BEHAVIORS_SOURCE].filter(exists);

    let verificados = 0;
    for (const arquivo of alvos) {
        const src = read(arquivo);
        const marcador = src.indexOf(arquivo === SETTINGS_SOURCE ? 'function applyJoinDependency' : 'function initRgFieldState');
        if (marcador < 0) continue;

        // Recorta só a função que trava o filho.
        const corpo = src.slice(marcador, marcador + 2000);
        assert.ok(
            !/\.checked\s*=/.test(corpo),
            `${path.basename(arquivo)}: o join não pode reescrever \`checked\` — a opção salva é preservada.`
        );
        verificados++;
    }

    assert.ok(verificados > 0, 'Nenhuma implementação de join encontrada para verificar.');
});

test('[join] os COMPILADOS acompanham o mecanismo usado nesta tela', () => {
    // Tela antiga: o bundle de settings e o de layout precisam ter o par.
    if (read(SETTINGS_SOURCE).includes('joinPairs')) {
        const compilado = read(SETTINGS_COMPILED);
        assert.ok(
            compilado.includes(PARENT) && compilado.includes(CHILD),
            'O bundle de settings precisa conter o par — rode `npm run build:admin`.'
        );

        if (exists(LAYOUT_COMPILED) && read(LAYOUT_SOURCE).includes('targetComponentCartNames')) {
            const layoutCompilado = read(LAYOUT_COMPILED);
            assert.ok(
                layoutCompilado.includes(PARENT) && layoutCompilado.includes(CHILD),
                'O bundle de layout precisa conter o par — rode `npm run build:admin`.'
            );
        }
        return;
    }

    // Tela nova: a dependência vive no bundle de behaviors.
    const behaviorsCompilado = path.join(ROOT, 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminLayoutBehaviors.COMPILED.js');
    assert.ok(exists(behaviorsCompilado), 'O bundle de behaviors deve existir nesta tela.');
    const compilado = read(behaviorsCompilado);
    assert.ok(
        compilado.includes(PARENT) && compilado.includes(CHILD),
        'O bundle de behaviors precisa conter o par — rode `npm run build:admin`.'
    );
});
