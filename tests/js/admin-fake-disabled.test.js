'use strict';

/**
 * Regressão: as telas de configuração NÃO podem fingir "desabilitado" com o
 * atributo `disabled`.
 *
 * Bug corrigido (5.2.0 → 5.2.1/5.3.0): com o modo de telefone em "somente
 * Celular" (ou com o "Celular Oculto" ligado), o bloco "Campo de Celular"
 * recebia `radio.disabled = true`. Input `disabled` não vai no POST, então o
 * `WC_Admin_Settings::save_fields()` mantinha o valor ANTIGO da option: a tela
 * mostrava "Não"/desabilitado e o checkout continuava gerando o campo "Celular".
 *
 * Regra (AGENTS.md § 7): o "desabilitado" é apenas visual — classe
 * `.woo-better-fake-disabled` + bloqueio de clique/teclado em captura — e o
 * input segue habilitado para o valor ir no POST.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');

const HELPER = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminFakeDisabled.js');
const CSS = path.join(ROOT, 'Admin/css/WcBetterShippingCalculatorForBrazilAdminSettings.css');
const PHP = path.join(ROOT, 'Includes/WcBetterShippingCalculatorForBrazil.php');
const AGENTS = path.join(ROOT, 'AGENTS.md');

// Telas de settings: TODAS as fontes de admin que mexem em estado de dependência.
const ADMIN_SOURCES = [
    'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayout.js',
    'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayoutBehaviors.js',
    'Admin/js/WcBetterShippingCalculatorForBrazilAdminSettings.js',
    'Admin/js/WcBetterShippingCalculatorForBrazilAdminDeliveryFields.js'
].map((rel) => path.join(ROOT, rel)).filter((file) => fs.existsSync(file));

function read(file) {
    assert.ok(fs.existsSync(file), `Arquivo não encontrado: ${file}`);
    return fs.readFileSync(file, 'utf8');
}

test('[fake-disabled] o helper existe e bloqueia interação sem o atributo `disabled`', () => {
    const src = read(HELPER);

    assert.ok(
        src.includes('window.wcBetterFakeDisabled'),
        'O helper precisa expor `window.wcBetterFakeDisabled`.'
    );
    assert.ok(
        /addEventListener\(\s*'click'[\s\S]{0,40}true\s*\)/.test(src),
        'O bloqueio de clique precisa ser em fase de CAPTURA (terceiro argumento `true`): ' +
        '`preventDefault` no `<label>` também impede a ativação do radio.'
    );
    assert.ok(
        src.includes('keydown'),
        'Teclado (setas/espaço) também precisa ser bloqueado — senão o valor muda via teclado.'
    );
    assert.ok(
        src.includes('removeAttribute(\'disabled\')'),
        'O helper deve REMOVER um `disabled` residual, nunca aplicar.'
    );
    assert.ok(
        src.includes('aria-disabled'),
        'O estado precisa ser exposto via `aria-disabled` (acessibilidade).'
    );
});

test('[fake-disabled] a classe usada pelo helper tem estilo no CSS do admin', () => {
    const css = read(CSS);

    assert.ok(
        /\.woo-better-fake-disabled\s*\{/.test(css),
        'O `AdminSettings.css` precisa estilizar `.woo-better-fake-disabled` (opacidade + cursor).'
    );
    assert.ok(/cursor:\s*not-allowed/.test(css), 'A classe precisa de `cursor: not-allowed`.');
});

test('[fake-disabled] o helper é enfileirado antes das telas de settings', () => {
    const php = read(PHP);

    const inicio = php.indexOf('function lkn_woo_better_footer_page');
    assert.notStrictEqual(inicio, -1, 'A função que enfileira os assets da aba deve existir.');

    const bloco = php.slice(inicio, php.indexOf('function lkn_add_settings_link', inicio));

    assert.ok(
        bloco.includes('WcBetterShippingCalculatorForBrazilAdminFakeDisabled.COMPILED.js'),
        'O bundle do helper precisa ser enfileirado na aba de configurações.'
    );
    assert.ok(
        bloco.includes("'wc-better-calc-settings-fake-disabled'"),
        'O handle do helper precisa existir para ser usado como dependência.'
    );

    // Todo script de settings que usa o helper precisa depender dele.
    ['AdminLayout', 'AdminLayoutBehaviors', 'AdminSettings', 'AdminDeliveryFields'].forEach((nome) => {
        if (!bloco.includes(`WcBetterShippingCalculatorForBrazil${nome}.COMPILED.js`)) {
            return;
        }

        const posicao = bloco.indexOf(`WcBetterShippingCalculatorForBrazil${nome}.COMPILED.js`);
        const trecho = bloco.slice(posicao, posicao + 400);

        assert.ok(
            trecho.includes("'wc-better-calc-settings-fake-disabled'"),
            `${nome}: o script precisa declarar 'wc-better-calc-settings-fake-disabled' nas dependências.`
        );
    });
});

test('[fake-disabled] nenhuma tela de settings aplica `disabled` em campo de opção', () => {
    // Permitido: `element.disabled = false` (limpeza) e os campos SEM `name` do
    // widget de prazo de entrega (checkbox do dia / horários), cujo valor é lido
    // pelo próprio JS via hidden JSON.
    const permitidos = [
        /element\.disabled\s*=\s*false/,
        /radio\.disabled\s*=\s*false/,
        /cb\.disabled\s*=\s*!isEnabled/,
        /input\.disabled\s*=\s*true/,
        /time(Start|End)\.disabled\s*=\s*!isChecked/
    ];

    ADMIN_SOURCES.forEach((arquivo) => {
        const linhas = read(arquivo).split('\n');

        linhas.forEach((linha, indice) => {
            if (!/(\.disabled\s*=\s*(true|!))/i.test(linha)) {
                return;
            }

            const permitido = permitidos.some((regex) => regex.test(linha));

            assert.ok(
                permitido,
                `${path.relative(ROOT, arquivo)}:${indice + 1} usa o atributo \`disabled\` num campo ` +
                'de configuração — use `window.wcBetterFakeDisabled(...)` (AGENTS.md § 7). ' +
                'Campo `disabled` não vai no POST e a option mantém o valor antigo salvo.'
            );
        });
    });
});

test('[fake-disabled] as telas travaram a dependência do Celular pelo helper', () => {
    const comportamentos = [
        'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayoutBehaviors.js',
        'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayout.js'
    ].map((rel) => path.join(ROOT, rel)).filter((file) => fs.existsSync(file));

    assert.ok(comportamentos.length > 0, 'Nenhuma tela de dependências encontrada.');

    comportamentos.forEach((arquivo) => {
        const src = read(arquivo);

        assert.ok(
            src.includes('enableCellphoneRadios'),
            `${path.basename(arquivo)}: o bloco "Campo de Celular" deve continuar existindo.`
        );
        const posicao = src.indexOf('cellphoneModeBlocked =');
        assert.notStrictEqual(posicao, -1, `${path.basename(arquivo)}: o bloqueio do "Campo de Celular" deve continuar existindo.`);

        const trecho = src.slice(posicao, posicao + 400);

        assert.ok(
            trecho.includes('setDisabledState('),
            `${path.basename(arquivo)}: o bloqueio do "Campo de Celular" precisa passar pelo ` +
            '`setDisabledState(...)` (fake disabled), nunca pelo atributo `disabled`.'
        );
    });
});

test('[fake-disabled] a regra está documentada no AGENTS.md', () => {
    const src = read(AGENTS);

    assert.ok(
        src.includes('wcBetterFakeDisabled'),
        'O AGENTS.md precisa apontar o helper como caminho obrigatório.'
    );
    assert.ok(
        /nunca[\s\S]{0,80}disabled/i.test(src),
        'O AGENTS.md precisa proibir o uso do atributo `disabled` para fingir desabilitado.'
    );
});
