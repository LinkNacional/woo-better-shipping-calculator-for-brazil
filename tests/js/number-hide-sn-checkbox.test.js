'use strict';

/**
 * Regressão: opção "Ocultar Checkbox S/N" (`woo_better_calc_number_hide_sn_checkbox`).
 *
 * É FILHA (join) do "Campo de Número do Endereço" (`woo_better_calc_number_required`)
 * e, quando ligada, o atalho "S/N" não é criado em NENHUMA das três superfícies:
 *   1. checkout em BLOCOS (`...PublicGutenbergNumberField.js`);
 *   2. checkout CLÁSSICO / shortcode (`...PublicShortNumberField.js`);
 *   3. edição de endereço da conta (mesmo script do clássico).
 *
 * O GOTCHA coberto aqui: o plugin MARCA o checkbox e TRAVA o campo (readOnly) quando
 * o valor salvo é "S/N". Sem o checkbox o cliente não teria como destravar o campo —
 * então, com a opção ligada, o travamento automático também precisa sair.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const BLOCKS = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicGutenbergNumberField.js');
const BLOCKS_COMPILED = path.join(
    ROOT,
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergNumberField.COMPILED.js'
);
const SHORTCODE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilPublicShortNumberField.js');
const SHORTCODE_COMPILED = path.join(
    ROOT,
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortNumberField.COMPILED.js'
);
const PUBLIC_PHP = path.join(ROOT, 'Public/WcBetterShippingCalculatorForBrazilPublic.php');
const SETTINGS = path.join(ROOT, 'Admin/partials/WcBetterShippingCalculatorForBrazilCheckoutSettings.php');

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[number-sn] a opção existe como FILHO do campo de número', () => {
    const settings = read(SETTINGS);

    const trecho = settings.slice(
        settings.indexOf("'hide_number_sn_checkbox'"),
        settings.indexOf("'hide_number_sn_checkbox'") + 900
    );

    assert.ok(trecho.length > 0, 'O campo hide_number_sn_checkbox deve existir nas configurações.');
    assert.ok(
        /'id'\s*=>\s*'woo_better_calc_number_hide_sn_checkbox'/.test(trecho),
        'O id deve ser woo_better_calc_number_hide_sn_checkbox.'
    );
    // Padrão DESLIGADO: o checkbox S/N continua aparecendo (comportamento atual).
    assert.ok(/'default'\s*=>\s*'no'/.test(trecho), 'A opção deve vir desabilitada por padrão.');
});

test('[number-sn] o PHP entrega a opção nas 3 superfícies (blocos, shortcode, edit-address)', () => {
    const php = read(PUBLIC_PHP);

    // Helper único no PHP (`number_hide_sn_checkbox()`) + os 3 pontos que o usam:
    // blocos (WooBetterNumberData), shortcode e edição de endereço.
    const usos = (php.match(/self::number_hide_sn_checkbox\(\)/g) || []).length;

    assert.ok(usos >= 3, `Os 3 enfileiramentos devem usar o helper (achei ${usos}).`);
    assert.ok(/number_hide_sn_checkbox\(\)/.test(php), 'WooBetterNumberData deve expor hideSnCheckbox (blocos).');
    assert.ok(/hideSnCheckbox/.test(php), 'O script do clássico/edit-address usa hideSnCheckbox.');
});

test('[number-sn] blocos: sem o atalho no DOM e sem travar o campo em "S/N"', () => {
    const src = read(BLOCKS);

    assert.ok(
        /const hideSnCheckbox = numberConfig\.hideSnCheckbox === true \|\| numberConfig\.hideSnCheckbox === 'true';/.test(src),
        'O JS dos blocos deve ler hideSnCheckbox do WooBetterNumberData.'
    );
    // O overlay é criado mas só entra no DOM quando o atalho está liberado.
    assert.ok(
        /if \(!hideSnCheckbox\) \{\s*fieldMainWrapper\.appendChild\(snOverlay\);/.test(src),
        'O overlay S/N não pode ser inserido no DOM com a opção ligada.'
    );
    // O travamento automático do "S/N" salvo fica condicionado ao checkbox existir.
    const travas = src.match(/if \(!hideSnCheckbox && initialValue === 'S\/N'\)/g) || [];
    assert.strictEqual(travas.length, 2, 'Billing E shipping: o travamento do "S/N" deve ser pulado (2 ocorrências).');
});

test('[number-sn] shortcode/edit-address: não injeta o checkbox e não trava o campo', () => {
    const src = read(SHORTCODE);

    assert.ok(
        /var hideSnCheckbox = config\.hideSnCheckbox === true \|\| config\.hideSnCheckbox === 'true';/.test(src),
        'O script do clássico deve ler hideSnCheckbox.'
    );

    const inits = src.match(/if \(!hideSnCheckbox\) \{\s*\w+SnCheckbox = injectSnCheckbox\(/g) || [];
    assert.strictEqual(inits.length, 2, 'Billing e shipping não podem chamar injectSnCheckbox com a opção ligada.');

    // O padding que abre espaço para o atalho só vale quando ele existe.
    const paddings = src.match(/if \(!hideSnCheckbox\) \{\s*inputEl\.style\.paddingRight = '72px';/g) || [];
    assert.strictEqual(paddings.length, 1, 'O padding-right do atalho deve ser condicional.');

    // O travamento continua GUARDADO pela existência do checkbox (billingSnCheckbox).
    assert.ok(
        /&& billingSnCheckbox\) \{/.test(src) && /&& shippingSnCheckbox\) \{/.test(src),
        'O travamento do "S/N" salvo precisa continuar exigindo o checkbox.'
    );
});

test('[number-sn] clássico: o atalho é ancorado num containing block de BLOCO (Safari)', () => {
    const src = read(SHORTCODE);

    // O `.woocommerce-input-wrapper` é um <span> INLINE: com position:relative o
    // containing block vira a caixa de linha e o Safari posiciona o checkbox fora do
    // campo. Forçar display:block normaliza o cálculo em todos os motores.
    assert.ok(
        /if \(computedDisplay === 'inline'\) \{\s*positionParent\.style\.display = 'block';/.test(src),
        'O contexto de posicionamento precisa virar block quando o wrapper for inline.'
    );
    assert.ok(
        /'top: 0 !important; ' \+\s*'bottom: 0 !important; ' \+/.test(src),
        'O atalho deve esticar na altura do campo (top/bottom 0) em vez de top:50% + translateY.'
    );
    assert.ok(
        !/transform: translateY\(-50%\) !important/.test(src),
        'O translateY(-50%) (que divergia no Safari) não deve voltar.'
    );
});

test('[number-sn] compilados refletem o build', () => {
    assert.ok(read(BLOCKS_COMPILED).indexOf('hideSnCheckbox') !== -1, 'Rode `npm run build:public` (blocos).');
    assert.ok(read(SHORTCODE_COMPILED).indexOf('hideSnCheckbox') !== -1, 'Rode `npm run build:public` (clássico).');
});
