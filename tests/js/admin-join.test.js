'use strict';

/**
 * Regressão: dependência pai → filho ("join") na tela de configurações ANTIGA.
 *
 * A branch de release (5.2.0) não tem o template de abas/cards, então a chave
 * `join` do array de campos não é consumida por template nenhum. O "join" aqui
 * tem duas partes, em dois bundles:
 *
 *   A) JUNÇÃO visual — `targetComponentCartNames` em ...AdminLayout.js move o
 *      `.forminp` do filho para dentro do card do pai e remove a `<tr>` órfã;
 *   B) COMPORTAMENTO — a lista `joinPairs` em ...AdminSettings.js trava o filho
 *      quando o pai está em "Desabilitar".
 *
 * Contrato travado:
 *  1. "Obrigatoriedade do Campo de RG" é FILHO de "Campo de RG": declarado com
 *     `join` apontando para o id do pai (paridade com o layout novo);
 *  2. O filho fica travado quando o pai está em "Desabilitar";
 *  3. O valor salvo do filho NÃO é reescrito — rádio `disabled` fica fora do
 *     POST e o WooCommerce preserva a opção (`is_null( $value )` → continue);
 *  4. Os COMPILADOS estão atualizados em relação aos fontes.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const SETTINGS_SOURCE = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminSettings.js');
const LAYOUT_SOURCE = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayout.js');
const LAYOUT_COMPILED = path.join(ROOT, 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminLayout.COMPILED.js');
const SETTINGS_COMPILED = path.join(ROOT, 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.js');
const PARTIAL = path.join(ROOT, 'Admin/partials/WcBetterShippingCalculatorForBrazilCheckoutSettings.php');

const PARENT = 'woo_better_calc_enable_rg_field';
const CHILD = 'woo_better_calc_rg_required';

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[join] o par RG → Obrigatoriedade está declarado no script da tela antiga', () => {
    const src = read(SETTINGS_SOURCE);

    assert.ok(src.includes('joinPairs'), 'A lista `joinPairs` deve existir (mecanismo de join da tela antiga).');
    assert.ok(
        src.includes(`parent: '${PARENT}'`) && src.includes(`child: '${CHILD}'`),
        'O par precisa ser { parent: enable_rg_field, child: rg_required }.'
    );
});

test('[join] o filho é travado quando o pai está em "Desabilitar"', () => {
    const src = read(SETTINGS_SOURCE);

    // Ligado apenas quando o pai tem um rádio 'yes' marcado.
    assert.ok(
        /radio\.checked && radio\.value === 'yes'/.test(src),
        'O estado do filho deve seguir o rádio "yes" do pai.'
    );

    assert.ok(
        /radio\.disabled = !enabled/.test(src),
        'O filho deve ser desabilitado quando o pai não está habilitado.'
    );

    assert.ok(
        /radio\.addEventListener\('change', syncChildState\)/.test(src),
        'Mudar o pai precisa reavaliar o filho (estado inicial também é aplicado).'
    );
});

test('[join] o valor salvo do filho é PRESERVADO (não força "no")', () => {
    const src = read(SETTINGS_SOURCE);

    // Recorta SÓ o mecanismo de join: o bloco de "Data de Nascimento" (que já
    // existia) reescreve `checked` de propósito, então não pode entrar aqui.
    const inicio = src.indexOf('function applyJoinDependency');
    assert.ok(inicio > -1, 'applyJoinDependency deve existir.');

    const joinBody = src.slice(inicio);

    assert.ok(
        !/\.checked\s*=/.test(joinBody),
        'O join NÃO pode reescrever `checked`: desabilitar é só visual e a opção salva é mantida.'
    );
});

test('[join] o PHP declara `join` no filho (paridade com o layout novo)', () => {
    const php = read(PARTIAL);

    assert.ok(php.includes("'rg_required' => array("), 'O campo rg_required deve existir na tela.');
    assert.ok(
        new RegExp(`'rg_required' => array\\([\\s\\S]{0,400}?'join'\\s*=>\\s*'${PARENT}'`).test(php),
        "`rg_required` deve trazer 'join' => 'woo_better_calc_enable_rg_field'."
    );
});

test('[join] a JUNÇÃO visual declara o par (targetComponentCartNames)', () => {
    const src = read(LAYOUT_SOURCE);

    assert.ok(
        src.includes('targetComponentCartNames'),
        'A tela antiga junta os campos por `targetComponentCartNames`.'
    );
    assert.ok(
        new RegExp(`'${CHILD}'\\s*:\\s*'${PARENT}'`).test(src),
        "O mapa precisa de 'woo_better_calc_rg_required': 'woo_better_calc_enable_rg_field' — sem isso o campo fica numa linha solta."
    );
});

test('[join] os COMPILADOS estão atualizados', () => {
    const src = read(SETTINGS_SOURCE);
    const compiled = read(SETTINGS_COMPILED);

    assert.ok(src.includes('applyJoinDependency'), 'A função deve existir no fonte.');

    // O bundle é MINIFICADO (webpack production + babel), então os nomes
    // somem: a checagem é pelos ids e pela lógica de travar o filho.
    assert.ok(
        compiled.includes(PARENT) && compiled.includes(CHILD),
        'O bundle compilado precisa conter o par de ids — senão a tela antiga não recebe o ajuste.'
    );
    assert.ok(
        compiled.includes('disabled=') || compiled.includes('disabled = '),
        'O bundle precisa conter a lógica que desabilita o filho. Rode `npm run build:admin`.'
    );

    // A junção visual vive no OUTRO bundle: precisa ter sido recompilada também.
    const layoutCompiled = read(LAYOUT_COMPILED);
    assert.ok(
        layoutCompiled.includes(PARENT) && layoutCompiled.includes(CHILD),
        'O bundle de layout precisa conter o par — rode `npm run build:admin` depois de editar o AdminLayout.js.'
    );
});
