'use strict';

/**
 * Regressão: MÁSCARA BRASILEIRA sem a lib/DDI (opção "Telefone com Máscara e DDI"
 * desligada, plugin ainda gerenciando o telefone).
 *
 * O chamado da cliente: mesmo sem a lib de DDI, o campo de telefone deve continuar
 * formatado no padrão brasileiro, com autodetecção entre fixo e celular:
 *   - Celular: (DD) NNNNN-NNNN
 *   - Fixo:    (DD) NNNN-NNNN
 * Sem bandeira e sem código de país (o `+55` é concatenado pelo backend).
 *
 * Estratégia: carrega `Public/js/core/BrazilPhoneMask.js` num sandbox (vm) — com os
 * `export` removidos — e testa a formatação/validação REAIS. Também confere que os
 * dois consumidores (blocos e clássico/shortcode) ligam a máscara quando a lib está
 * desligada.
 *
 * Execução: npm run test:js
 */

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..', '..');

const SOURCE = path.join(ROOT, 'Public/js/core/BrazilPhoneMask.js');
const BLOCKS_CORE = path.join(ROOT, 'Public/js/core/PhoneField.js');
const SHORTCODE = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskShortcode.js');
const BRAZIL_ENTRY = path.join(ROOT, 'Public/js/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskBrazil.js');
const COMPILED_BRAZIL = path.join(
    ROOT,
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskBrazil.COMPILED.js'
);
const COMPILED_SHORTCODE = path.join(
    ROOT,
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskShortcode.COMPILED.js'
);
const COMPILED_BLOCKS = path.join(
    ROOT,
    'Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergPhoneFieldBoth.COMPILED.js'
);
const ADMIN_BEHAVIORS = path.join(ROOT, 'Admin/js/WcBetterShippingCalculatorForBrazilAdminLayoutBehaviors.js');
const COMPILED_ADMIN = path.join(
    ROOT,
    'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminLayoutBehaviors.COMPILED.js'
);

/**
 * Carrega o módulo (ESM) num sandbox, removendo os `export`.
 *
 * @returns {object} Funções do módulo.
 */
function loadModule() {
    assert.ok(fs.existsSync(SOURCE), `Arquivo não encontrado: ${SOURCE}`);

    const code = fs.readFileSync(SOURCE, 'utf8').replace(/^export /gm, '');
    const sandbox = { console };

    vm.createContext(sandbox);
    vm.runInContext(code, sandbox, { filename: SOURCE });

    return sandbox;
}

const mask = loadModule();

test('[brazil-mask] formata celular (11 dígitos) como (DD) NNNNN-NNNN', () => {
    assert.strictEqual(mask.formatBrazilPhone('85988888888', 'auto'), '(85) 98888-8888');
    assert.strictEqual(mask.formatBrazilPhone('85988888888', 'mobile'), '(85) 98888-8888');
});

test('[brazil-mask] formata fixo (10 dígitos) como (DD) NNNN-NNNN', () => {
    assert.strictEqual(mask.formatBrazilPhone('8532323232', 'auto'), '(85) 3232-3232');
    assert.strictEqual(mask.formatBrazilPhone('8532323232', 'landline'), '(85) 3232-3232');
});

test('[brazil-mask] no modo "auto" a máscara troca sozinha ao chegar o 11º dígito', () => {
    // Autodetecção: até 10 dígitos parece fixo; com o 11º vira celular.
    assert.strictEqual(mask.formatBrazilPhone('8598888888', 'auto'), '(85) 9888-8888');
    assert.strictEqual(mask.formatBrazilPhone('85988888888', 'auto'), '(85) 98888-8888');
});

test('[brazil-mask] digitação parcial mantém a formatação progressiva', () => {
    assert.strictEqual(mask.formatBrazilPhone('', 'auto'), '');
    assert.strictEqual(mask.formatBrazilPhone('8', 'auto'), '(8');
    assert.strictEqual(mask.formatBrazilPhone('85', 'auto'), '(85');
    assert.strictEqual(mask.formatBrazilPhone('859', 'auto'), '(85) 9');
    assert.strictEqual(mask.formatBrazilPhone('8598888', 'auto'), '(85) 9888-8');
});

test('[brazil-mask] número fora do padrão brasileiro não é formatado', () => {
    // "Se o usuário digitar outro tipo de número, não pega formatação."
    assert.strictEqual(mask.formatBrazilPhone('123456789012', 'auto'), '123456789012');
    assert.strictEqual(mask.formatBrazilPhone('12345678901', 'landline'), '12345678901');
});

test('[brazil-mask] valor já salvo em E.164 (+55) é reformatado como nacional', () => {
    // O perfil/pedido guarda +5585988888888; o campo deve mostrar (85) 98888-8888.
    assert.strictEqual(mask.formatBrazilPhone('+5585988888888', 'auto'), '(85) 98888-8888');
    assert.strictEqual(mask.formatBrazilPhone('+558532323232', 'auto'), '(85) 3232-3232');
    // DDD 55 (RS) com 11 dígitos NÃO é DDI: não pode perder o DDD.
    assert.strictEqual(mask.formatBrazilPhone('55988888888', 'auto'), '(55) 98888-8888');
});

test('[brazil-mask] número internacional explícito (+) não é reformatado nem bloqueado', () => {
    // O sanitizador permite um "+" inicial; a máscara é só do padrão brasileiro.
    assert.strictEqual(mask.formatBrazilPhone('+15551234567', 'auto'), '+15551234567');
    assert.strictEqual(mask.formatBrazilPhone('+351912345678', 'auto'), '+351912345678');
    assert.strictEqual(mask.brazilPhoneInvalid('+15551234567', 'auto'), false);
    // O "+55" digitado é o DDI do Brasil: descartado (o backend concatena de novo).
    assert.strictEqual(mask.formatBrazilPhone('+55', 'auto'), '');
    assert.strictEqual(mask.formatBrazilPhone('+5585988888888', 'auto'), '(85) 98888-8888');
});

test('[brazil-mask] validação BR: aceita fixo e celular válidos', () => {
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 98888-8888', 'auto'), false);
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 3232-3232', 'auto'), false);
    assert.strictEqual(mask.brazilPhoneInvalid('+5585988888888', 'auto'), false);
    assert.strictEqual(mask.brazilPhoneInvalid('', 'auto'), false);
});

test('[brazil-mask] validação BR: rejeita números inválidos', () => {
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 9888-88', 'auto'), true, 'Curto demais.');
    assert.strictEqual(mask.brazilPhoneInvalid('(10) 3232-3232', 'auto'), true, 'DDD inválido (10).');
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 1234-5678', 'auto'), true, 'Fixo não começa em 2–5.');
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 8232-3232', 'auto'), true, 'Fixo não começa em 2–5.');
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 8888-8888', 'auto'), true, 'Celular de 10 dígitos não é válido como celular.');
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 3232-3232', 'mobile'), true, 'Campo Celular exige 11 dígitos.');
    assert.strictEqual(mask.brazilPhoneInvalid('(85) 98888-8888', 'landline'), true, 'Campo Fixo exige 10 dígitos.');
});

test('[brazil-mask] tipo da máscara segue o modo do telefone', () => {
    assert.strictEqual(mask.brazilMaskType('phone', 'landline_only'), 'landline');
    assert.strictEqual(mask.brazilMaskType('phone', 'phone_and_cellphone'), 'auto');
    assert.strictEqual(mask.brazilMaskType('phone', 'cellphone_only'), 'auto');
    assert.strictEqual(mask.brazilMaskType('cellphone', 'phone_and_cellphone'), 'mobile');
});

test('[brazil-mask] a máscara só formata o que o cliente VÊ (input.value)', () => {
    const listeners = {};
    const input = {
        value: '',
        dataset: {},
        setAttribute() {},
        addEventListener(type, cb) { (listeners[type] = listeners[type] || []).push(cb); },
        setSelectionRange() {},
    };

    mask.attachBrazilPhoneMask(input, 'auto');
    assert.strictEqual(input.dataset.wcBetterBrazilMask, 'true');

    input.value = '85988888888';
    (listeners.input || []).forEach((cb) => cb());
    assert.strictEqual(input.value, '(85) 98888-8888');

    // Mesma instância não re-registra (idempotente).
    mask.attachBrazilPhoneMask(input, 'auto');
    assert.strictEqual((listeners.input || []).length, 1);
});

test('[brazil-mask] blocos: sem a lib, o campo recebe a máscara BR (e a validação BR)', () => {
    assert.ok(fs.existsSync(BLOCKS_CORE), `Arquivo não encontrado: ${BLOCKS_CORE}`);
    const src = fs.readFileSync(BLOCKS_CORE, 'utf8');

    assert.ok(
        /import \{[\s\S]*?attachBrazilPhoneMask[\s\S]*?\} from '\.\/BrazilPhoneMask\.js';/.test(src),
        'PhoneField.js deve importar o módulo da máscara BR.'
    );
    assert.ok(
        /if \(!truthy\(cfgValue\('maskEnabled'\)\)\) \{[\s\S]*?attachBrazilPhoneMask\(input, brazilMaskType\(kind, cfgValue\('mode'\)\)\);/.test(src),
        'Sem a máscara/DDI, o campo deve receber a máscara BR (fixo/celular).'
    );
    assert.ok(
        /brazilPhoneInvalid\(field\.value, field\.dataset\.wcBetterBrazilMaskType\)/.test(src),
        'A validação no envio deve usar a regra brasileira quando não há lib.'
    );
    // O campo "Celular" secundário também recebe a máscara BR sem a lib.
    assert.ok(
        /if \(!spec\.secondary \|\| !truthy\(cfgValue\('maskEnabled'\)\)\)/.test(src),
        'O "Celular" secundário deve receber a máscara BR quando a lib está desligada.'
    );
});

test('[brazil-mask] bundle com lib: validação sem exigir a máscara e só em campos obrigatórios', () => {
    assert.ok(fs.existsSync(SHORTCODE), `Arquivo não encontrado: ${SHORTCODE}`);
    const src = fs.readFileSync(SHORTCODE, 'utf8');

    // "Validar Número de Telefone" não depende mais da máscara/DDI.
    assert.ok(
        /function bindDddValidation\(\) \{\s*if \(!validateDdd\) \{/.test(src),
        'A validação da edição de endereço não deve exigir a máscara/DDI.'
    );
    // Só valida campos OBRIGATÓRIOS (mesma regra do backend).
    assert.ok(
        /!isRequiredPhoneField\(f\)/.test(src),
        'A validação no submit deve ignorar campos opcionais.'
    );
    // Erro inline compartilhado com o bundle sem lib (core/BrazilPhoneMask.js).
    assert.ok(
        /import \{ isRequiredPhoneField, showBrazilPhoneError \} from '\.\/core\/BrazilPhoneMask\.js';/.test(src)
        && /showBrazilPhoneError\(invalidField\)/.test(src),
        'O bundle com lib deve reaproveitar os helpers do núcleo da máscara BR.'
    );
});

test('[brazil-mask] bundle LEVE (sem lib) para o modo "máscara BR apenas"', () => {
    assert.ok(fs.existsSync(BRAZIL_ENTRY), `Arquivo não encontrado: ${BRAZIL_ENTRY}`);
    const src = fs.readFileSync(BRAZIL_ENTRY, 'utf8');

    assert.ok(
        !/from '(intl-tel-input|intl-tel-input\/)/.test(src),
        'O bundle sem lib não pode importar o intl-tel-input (peso desnecessário).'
    );
    assert.ok(
        /if \(maskEnabled\) \{\s*return;/.test(src),
        'O bundle sem lib só age quando a lib está desligada.'
    );
    assert.ok(
        /attachBrazilPhoneMask\(field, brazilTypeFor\(/.test(src) && /brazilPhoneInvalid\(/.test(src),
        'O bundle sem lib deve aplicar a máscara e a validação brasileiras.'
    );
    assert.ok(
        /!isRequiredPhoneField\(candidate\)/.test(src) && /showBrazilPhoneError\(invalidField\)/.test(src),
        'O bundle sem lib deve validar só campos obrigatórios e usar o erro inline compartilhado.'
    );
    // Script no <head>: precisa esperar o DOM (senão `document.body` é null).
    assert.ok(
        /document\.readyState === 'loading'/.test(src) && /addEventListener\('DOMContentLoaded', init\)/.test(src),
        'O bundle sem lib deve aguardar o DOM (é enfileirado no <head>).'
    );

    assert.ok(fs.existsSync(COMPILED_BRAZIL), `Arquivo não encontrado: ${COMPILED_BRAZIL}`);
    const compiled = fs.readFileSync(COMPILED_BRAZIL, 'utf8');

    assert.ok(
        compiled.indexOf('wcBetterBrazilMask') !== -1,
        'Compilado do bundle sem lib desatualizado: rode npm run build:public.'
    );
    assert.ok(
        compiled.length < 40000,
        'O bundle sem lib deve continuar leve (sem o intl-tel-input).'
    );
});

test('[brazil-mask] bundles COMPILADOS atualizados (rode `npm run build:public`)', () => {
    // O bundle com lib precisa ter sido recompilado com os helpers compartilhados.
    assert.ok(fs.existsSync(COMPILED_SHORTCODE), `Arquivo não encontrado: ${COMPILED_SHORTCODE}`);
    assert.ok(
        fs.readFileSync(COMPILED_SHORTCODE, 'utf8').indexOf('wc-better-ddd-error') !== -1,
        'Compilado do bundle com lib desatualizado: rode npm run build:public.'
    );

    // O bundle dos BLOCOS embute a máscara BR (dataset `wcBetterBrazilMask`).
    assert.ok(fs.existsSync(COMPILED_BLOCKS), `Arquivo não encontrado: ${COMPILED_BLOCKS}`);
    assert.ok(
        fs.readFileSync(COMPILED_BLOCKS, 'utf8').indexOf('wcBetterBrazilMask') !== -1,
        'Compilado dos blocos desatualizado: rode npm run build:public.'
    );
});
test('[brazil-mask] admin: "Validar Número de Telefone" funciona sem a lib (escopo Brasil)', () => {
    assert.ok(fs.existsSync(ADMIN_BEHAVIORS), `Arquivo não encontrado: ${ADMIN_BEHAVIORS}`);
    const src = fs.readFileSync(ADMIN_BEHAVIORS, 'utf8');

    // O card é ESCOLHA do lojista: não depende da máscara/DDI nem da obrigatoriedade
    // do contato — só dos modos em que o plugin não gerencia o telefone.
    assert.ok(
        /function updateValidateDddState\(\) \{\s*var on = !isUnmanagedMode\(\);/.test(src),
        'A validação deve ficar livre (sem exigir máscara/DDI nem telefone obrigatório).'
    );
    assert.ok(
        /A validação é aplicada quando o telefone\/celular é obrigatório e preenchido\./.test(src),
        'O texto deve explicar que a validação só age em campo obrigatório.'
    );
    assert.ok(
        /VALIDATE_DDD_TEXTS[\s\S]*?todos os países[\s\S]*?Brasil/.test(src),
        'Os textos do card devem mudar conforme o escopo (todos os países × Brasil).'
    );

    // O compilado acompanha o fonte (build:admin).
    assert.ok(fs.existsSync(COMPILED_ADMIN), `Arquivo não encontrado: ${COMPILED_ADMIN}`);
    const compiled = fs.readFileSync(COMPILED_ADMIN, 'utf8');

    assert.ok(
        compiled.indexOf('Validar o número de telefone no checkout (Brasil)') !== -1,
        'Compilado do admin desatualizado: rode npm run build:admin.'
    );
});
