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
            && /\.disabled\s*=/.test(src);
    })();

    assert.ok(
        telaAntiga || telaNova,
        'O join precisa ser aplicado: `joinPairs` (tela antiga) ou `initRgFieldState` (tela nova).'
    );
});

test('[join] travar o filho NÃO reescreve o valor salvo (só `disabled`)', () => {
    // A opção é preservada: rádio `disabled` não vai no POST e o WooCommerce
    // mantém o valor (`is_null( $value )` → continue em save_fields).
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
