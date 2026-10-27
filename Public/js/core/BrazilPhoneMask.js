/**
 * Máscara de telefone APENAS do Brasil — sem intl-tel-input e sem DDI.
 *
 * Entra em cena quando a opção "Telefone com Máscara e DDI" está DESLIGADA mas o
 * plugin ainda gerencia o telefone (`woo_better_calc_phone_mode` diferente de
 * "Desabilitar"). Nesse cenário não há lib, bandeira nem código de país: o campo
 * recebe só a formatação brasileira enquanto o cliente digita.
 *
 * Regras (espelham a autodetecção do intl-tel-input para o Brasil):
 *  - fixo   → (DD) NNNN-NNNN   (10 dígitos)
 *  - celular→ (DD) NNNNN-NNNN  (11 dígitos, o 3º dígito é 9)
 *  - "auto" (campo Telefone do modo "Celular e Fixo") usa as DUAS máscaras:
 *    formata como fixo até o 10º dígito e troca para celular quando o 11º chega.
 *  - Fora desses tamanhos (ex.: número estrangeiro) NÃO formata — o valor fica só
 *    com os dígitos, como era antes da máscara.
 *
 * O valor continua sendo salvo/apresentado sem DDI no cliente (o +55 é
 * concatenado pelo backend, ver `format_complete_phone`).
 */

/** Tamanho máximo de dígitos que a máscara formata (celular). */
var BR_MAX_DIGITS = 11;

/** Tamanho de um telefone fixo brasileiro. */
var BR_LANDLINE_DIGITS = 10;

/**
 * Remove tudo que não for dígito.
 *
 * @param {*} value Valor cru.
 * @returns {string}
 */
export function onlyDigits(value) {
    return String(value == null ? '' : value).replace(/\D/g, '');
}

/**
 * O valor traz o DDI do Brasil (número em E.164 ou "+55" digitado)?
 *
 * - "+55..."  → sim (o cliente digitou o DDI explicitamente, mesmo incompleto).
 * - "55..."   → sim quando o tamanho já é o de um E.164 (12/13 dígitos): evita
 *   confundir com um DDD 55 (RS) de 10/11 dígitos.
 *
 * @param {*}      value  Valor cru.
 * @param {string} digits Só os dígitos do valor.
 * @returns {boolean}
 */
function hasBrazilDdi(value, digits) {
    if (digits.indexOf('55') !== 0) {
        return false;
    }

    if (String(value == null ? '' : value).trim().charAt(0) === '+') {
        return true;
    }

    return digits.length >= 12;
}

/**
 * Descarta o DDI brasileiro de um número já salvo em E.164 (`+5585988888888`).
 *
 * Sem isso um valor pré-preenchido pelo perfil/autofill (`+55...`) estouraria o
 * limite da máscara e o campo ficaria sem formatação.
 *
 * @param {*} value Valor cru (com ou sem +55).
 * @returns {string} Dígitos do número NACIONAL.
 */
export function nationalBrazilDigits(value) {
    var digits = onlyDigits(value);

    if (hasBrazilDdi(value, digits)) {
        var rest = digits.slice(2);

        if (rest.length <= BR_MAX_DIGITS) {
            return rest;
        }
    }

    return digits;
}

/**
 * O campo está VAZIO para efeito de obrigatoriedade?
 *
 * Um valor com apenas o DDI (`+55`) não é um telefone preenchido — sem esta regra
 * o "só +55" passaria na validação de campo obrigatório.
 *
 * @param {*} value Valor cru do campo.
 * @returns {boolean}
 */
export function brazilPhoneIsEmpty(value) {
    return nationalBrazilDigits(value) === '';
}

/**
 * Valor a ENVIAR/gravar para um campo com a máscara BR.
 *
 * - Número brasileiro (com ou sem o `+55` exibido) → só os DÍGITOS nacionais (o
 *   backend concatena o `+55`).
 * - Número de OUTRO país (`+1...`) → devolve o valor como está, para o backend
 *   não prefixar o `+55` em cima de um DDI estrangeiro.
 *
 * @param {*} value Valor cru do campo.
 * @returns {string}
 */
export function phoneValueForStorage(value) {
    var raw = String(value == null ? '' : value).trim();
    var digits = onlyDigits(raw);

    if (raw.charAt(0) === '+' && !hasBrazilDdi(raw, digits)) {
        return raw;
    }

    return nationalBrazilDigits(raw);
}

/**
 * Valor a ENVIAR/gravar de um campo cujo número NÃO recebe DDI do backend.
 *
 * É o caso do campo "Celular" SECUNDÁRIO (o separado do telefone): a meta dele é
 * gravada como o cliente digitou, só SEM os caracteres especiais — nada de DDI
 * inferido e nada de DDI digitado removido. Ou seja:
 *
 *  - "+55 (83) 98888-8885" → "+5583988888885" (o DDI digitado é PRESERVADO);
 *  - "(83) 98888-8885"     → "83988888885"   (sem DDI digitado, nada é somado).
 *
 * Não confundir com `phoneValueForStorage`, que devolve só os DÍGITOS nacionais
 * porque o telefone/celular principal recebe o `+55` no backend.
 *
 * @param {*} value Valor cru do campo.
 * @returns {string}
 */
export function phoneValueVerbatim(value) {
    var raw = String(value == null ? '' : value).trim();
    var digits = onlyDigits(raw);

    return (raw.charAt(0) === '+') ? ('+' + digits) : digits;
}

/**
 * Tipo de máscara de um campo.
 *
 * @param {string} kind 'phone' | 'cellphone'
 * @param {string} mode Comportamento do Campo de Telefone.
 * @returns {string} 'auto' | 'mobile' | 'landline'
 */
export function brazilMaskType(kind, mode) {
    if (kind === 'cellphone') {
        return 'mobile';
    }

    if (mode === 'landline_only') {
        return 'landline';
    }

    return 'auto';
}

/** Prefixo do DDI brasileiro exibido no campo (sem a bandeira/seletor de país). */
var BR_DDI_PREFIX = '+55 ';

/**
 * Aplica a máscara brasileira nos dígitos NACIONAIS (sem DDI).
 *
 * @param {string} digits Dígitos do número nacional.
 * @param {string} type   'auto' | 'mobile' | 'landline'
 * @returns {string}
 */
function formatNationalBrazilDigits(digits, type) {
    var max = (type === 'landline') ? BR_LANDLINE_DIGITS : BR_MAX_DIGITS;

    if (digits.length === 0) {
        return '';
    }

    // Fora do padrão brasileiro: não formata (mantém só os dígitos).
    if (digits.length > max) {
        return digits;
    }

    if (digits.length <= 2) {
        return '(' + digits;
    }

    var ddd = digits.slice(0, 2);
    var body = digits.slice(2);

    if (body.length === 0) {
        return '(' + ddd + ') ';
    }

    // Celular (11 dígitos) quebra em 5+4; fixo em 4+4.
    var hyphenAt = (digits.length >= BR_MAX_DIGITS) ? 5 : 4;
    if (body.length > hyphenAt) {
        return '(' + ddd + ') ' + body.slice(0, hyphenAt) + '-' + body.slice(hyphenAt);
    }

    return '(' + ddd + ') ' + body;
}

/**
 * Formata os dígitos de um telefone brasileiro.
 *
 * Quando o valor traz o DDI do Brasil (o cliente digitou `+55` ou o número já está
 * salvo em E.164), o campo MOSTRA esse `+55` antes do número — nesse modo não há
 * bandeira nem seletor de país indicando o DDI, então o prefixo é a única pista.
 * O prefixo é só de exibição: o valor enviado/gravado continua sendo os dígitos (o
 * backend concatena o `+55`).
 *
 * @param {*}      value Valor cru (formatado ou não).
 * @param {string} type  'auto' | 'mobile' | 'landline'
 * @returns {string}
 */
export function formatBrazilPhone(value, type) {
    var raw = String(value == null ? '' : value);
    var digits = onlyDigits(raw);

    // Número internacional EXPLÍCITO de OUTRO país (o sanitizador permite um "+"
    // inicial): não mexe — a máscara é só do padrão brasileiro.
    if (raw.trim().charAt(0) === '+' && !hasBrazilDdi(raw, digits)) {
        return raw;
    }

    // DDI do Brasil presente: preserva o "+55" na frente do número formatado.
    if (hasBrazilDdi(raw, digits)) {
        var national = formatNationalBrazilDigits(digits.slice(2), type);

        return (national === '') ? BR_DDI_PREFIX.trim() : (BR_DDI_PREFIX + national);
    }

    return formatNationalBrazilDigits(digits, type);
}

/**
 * Informa se um telefone é INVÁLIDO pela regra brasileira.
 *
 * Mesma regra do backend (`phone_validation_error` com o DDI +55): DDD válido
 * (11–99) + 10 dígitos (fixo, começando em 2–5) ou 11 (celular, começando em 9).
 *
 * @param {*}      value Valor cru.
 * @param {string} type  'auto' | 'mobile' | 'landline'
 * @returns {boolean} true quando o número está preenchido e é inválido.
 */
export function brazilPhoneInvalid(value, type) {
    var raw = String(value == null ? '' : value);

    // DDI de OUTRO país (`+1...`): a validação da máscara BR é só brasileira, então
    // reprova no envio (o cliente pode digitar, mas o checkout não aceita).
    if (raw.trim().charAt(0) === '+' && !hasBrazilDdi(raw, onlyDigits(raw))) {
        return true;
    }

    var digits = nationalBrazilDigits(raw);

    if (digits === '') {
        return false;
    }

    if (digits.length !== BR_LANDLINE_DIGITS && digits.length !== BR_MAX_DIGITS) {
        return true;
    }

    var ddd = parseInt(digits.slice(0, 2), 10);
    if (!(ddd >= 11 && ddd <= 99)) {
        return true;
    }

    var first = digits.charAt(2);
    if (digits.length === BR_MAX_DIGITS && first !== '9') {
        return true;
    }
    if (digits.length === BR_LANDLINE_DIGITS && (first < '2' || first > '5')) {
        return true;
    }

    if (type === 'mobile' && digits.length !== BR_MAX_DIGITS) {
        return true;
    }
    if (type === 'landline' && digits.length !== BR_LANDLINE_DIGITS) {
        return true;
    }

    return false;
}

/**
 * Posição do cursor contando DÍGITOS (a formatação insere parênteses/hífen).
 *
 * @param {string} raw       Valor anterior.
 * @param {string} formatted Valor formatado.
 * @param {number} position  Cursor no valor anterior.
 * @returns {number}
 */
function caretAfterDigits(raw, formatted, position) {
    var limit = (typeof position === 'number' && position >= 0) ? position : raw.length;
    var digitsBefore = onlyDigits(raw.slice(0, limit)).length;

    if (digitsBefore === 0) {
        return 0;
    }

    var seen = 0;
    for (var i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted.charAt(i))) {
            seen++;
            if (seen === digitsBefore) {
                return i + 1;
            }
        }
    }

    return formatted.length;
}

/**
 * Liga a máscara brasileira em um input (idempotente).
 *
 * Só formata o que o cliente vê: quem envia o valor ao servidor deve usar
 * `onlyDigits()`/`nationalBrazilDigits()` para não gravar a pontuação.
 *
 * @param {HTMLInputElement} input Campo de telefone.
 * @param {string}           type  'auto' | 'mobile' | 'landline'
 * @returns {void}
 */
export function attachBrazilPhoneMask(input, type) {
    if (!input || input.dataset.wcBetterBrazilMask === 'true') {
        return;
    }

    input.dataset.wcBetterBrazilMask = 'true';
    input.dataset.wcBetterBrazilMaskType = type || 'auto';
    input.setAttribute('inputmode', 'tel');

    var apply = function () {
        var raw = input.value;
        var formatted = formatBrazilPhone(raw, input.dataset.wcBetterBrazilMaskType);

        if (formatted === raw) {
            return;
        }

        var caret = caretAfterDigits(raw, formatted, input.selectionStart);
        input.value = formatted;

        if (typeof input.setSelectionRange === 'function') {
            try {
                input.setSelectionRange(caret, caret);
            } catch (error) {
                // Inputs sem suporte a seleção: ignora.
            }
        }
    };

    input.addEventListener('input', apply);
    apply();
}

/**
 * O campo é OBRIGATÓRIO? A validação do telefone só vale para campos obrigatórios
 * — mesma regra do backend (`validate_phone_ddd_classic`).
 *
 * @param {HTMLInputElement} field
 * @returns {boolean}
 */
export function isRequiredPhoneField(field) {
    if (!field) {
        return false;
    }

    if (field.getAttribute && field.getAttribute('required') !== null) {
        return true;
    }

    var row = field.closest ? field.closest('.form-row') : null;

    return !!(row && row.classList.contains('validate-required'));
}

/**
 * Marca o campo como inválido no checkout CLÁSSICO/edit-address: rola até ele,
 * foca e injeta a mensagem inline (sem recarregar a página).
 *
 * @param {HTMLInputElement} field
 * @returns {void}
 */
export function showBrazilPhoneError(field) {
    if (!field) {
        return;
    }

    if (typeof field.scrollIntoView === 'function') {
        field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (typeof setTimeout === 'function') {
        setTimeout(function () {
            if (typeof field.focus === 'function') {
                field.focus();
            }
        }, 250);
    }

    var row = field.closest ? field.closest('.form-row') : null;
    if (!row) {
        return;
    }

    row.classList.add('woocommerce-invalid');

    var existing = row.querySelector('.wc-better-ddd-error');
    if (existing) {
        existing.remove();
    }

    var note = document.createElement('p');
    note.className = 'wc-better-ddd-error';
    note.style.color = '#b00020';
    note.style.margin = '4px 0 0';
    note.textContent = 'Número de telefone inválido.';
    row.appendChild(note);
}
