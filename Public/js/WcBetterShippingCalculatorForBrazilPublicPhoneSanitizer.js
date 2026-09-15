/**
 * Sanitizador universal de campos de telefone.
 *
 * Cobre TODOS os cenários: campo próprio do plugin (checkout em blocos) e campo
 * nativo do WooCommerce (checkout em blocos, clássico/shortcode e edição de
 * endereço da conta).
 *
 * Regra (rígida): o USUÁRIO só pode digitar dígitos (0-9), com uma única exceção
 * — o "+" como PRIMEIRO caractere (para números internacionais); repetir o "+"
 * é bloqueado. Qualquer outro caractere especial (espaço, "-", "(", ")", ".",
 * "/") é inserido EXCLUSIVAMENTE pela biblioteca de formatação — nunca pelo
 * usuário. Também forçamos o teclado numérico em dispositivos móveis via
 * inputmode="numeric".
 *
 * Como funciona:
 * - "beforeinput": cancela qualquer inserção de texto pelo usuário que não seja
 *   composta apenas por dígitos, exceto um "+" inicial. Os caracteres
 *   programáticos (a própria lib ao formatar) não emitem "beforeinput", então
 *   nunca são bloqueados.
 * - "paste": intercepta e insere apenas os dígitos (preservando um "+" inicial).
 * - "input": rede de segurança que remove caracteres fora do conjunto que a lib
 *   pode produzir (dígitos + pontuação de telefone), sem tocar na formatação.
 *
 * OBS: este arquivo é compilado pelo webpack para
 * jsCompiled/WcBetterShippingCalculatorForBrazilPublicPhoneSanitizer.COMPILED.js
 */
(function () {
    'use strict';

    // Um dígito.
    var DIGITS_ONLY = /^[0-9]+$/;
    var HAS_NON_DIGIT = /[^0-9]/;

    // Conjunto que a biblioteca pode produzir ao formatar (dígitos, espaço, +,
    // "-", "(", ")", ".", "/"). Só ele sobrevive à rede de segurança do input.
    var DISALLOWED = /[^0-9+\-()./\s]/g;

    // Campos de telefone do plugin e do WooCommerce (clássico e blocos).
    var SELECTOR = [
        '#billing_phone',
        '#shipping_phone',
        '#billing-phone',
        '#shipping-phone',
        '#custom-phone',
        '#wc-better-custom-phone',
        '#wc-better-phone-billing',
        '#wc-better-phone-shipping',
        '#wc-better-phone-highlight',
        'input[type="tel"]'
    ].join(',');

    var FLAG = 'wcBetterPhoneSanitized';

    /**
     * Substitui a seleção do campo por um texto, disparando "input" para a lib
     * reformatar.
     *
     * @param {HTMLInputElement} field
     * @param {string}           text
     */
    function insertText(field, text) {
        var start = typeof field.selectionStart === 'number' ? field.selectionStart : field.value.length;
        var end = typeof field.selectionEnd === 'number' ? field.selectionEnd : field.value.length;
        var before = field.value.slice(0, start);
        var after = field.value.slice(end);
        var newValue = before + text + after;

        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(field, newValue);

        var caret = before.length + text.length;
        try {
            field.setSelectionRange(caret, caret);
        } catch (error) {
            // Alguns tipos de input não suportam seleção; ignora.
        }

        field.dispatchEvent(new Event('input', { bubbles: true }));
    }

    /**
     * Rede de segurança: remove caracteres fora do conjunto permitido, mantendo
     * a formatação produzida pela lib. Também normaliza valores salvos antigos.
     *
     * @param {HTMLInputElement} field
     */
    function normalizeValue(field) {
        var raw = field.value;
        var cleaned = raw.replace(DISALLOWED, '');
        if (cleaned !== raw) {
            field.value = cleaned;
        }
    }

    /**
     * Informa se o "+" pode ser inserido como PRIMEIRO caractere.
     *
     * @param {HTMLInputElement} field
     * @returns {boolean}
     */
    function canInsertLeadingPlus(field) {
        var start = typeof field.selectionStart === 'number' ? field.selectionStart : field.value.length;
        var end = typeof field.selectionEnd === 'number' ? field.selectionEnd : field.value.length;
        // Cursor no início, nada selecionado e o campo ainda sem "+".
        return start === 0 && end === 0 && field.value.indexOf('+') === -1;
    }

    /**
     * Associa os handlers a um campo de telefone.
     *
     * @param {HTMLInputElement} field
     */
    function attach(field) {
        if (!field || field.dataset[FLAG] === 'true') {
            return;
        }

        field.dataset[FLAG] = 'true';

        // Força o teclado numérico em dispositivos móveis.
        field.setAttribute('inputmode', 'numeric');

        // Bloqueia digitação de qualquer caractere que não seja dígito, exceto um
        // único "+" no início (números internacionais). Repetir o "+" é bloqueado.
        field.addEventListener('beforeinput', function (event) {
            if (event.data == null || event.data === '') {
                return;
            }
            if (!HAS_NON_DIGIT.test(event.data)) {
                return; // apenas dígitos
            }
            if (event.data !== '+' || !canInsertLeadingPlus(field)) {
                event.preventDefault();
            }
        });

        // Colagem: insere apenas os dígitos, preservando um "+" inicial.
        field.addEventListener('paste', function (event) {
            var clipboard = event.clipboardData || window.clipboardData;
            var text = clipboard ? clipboard.getData('text') : '';
            if (!text) {
                return;
            }
            if (DIGITS_ONLY.test(text)) {
                return; // só dígitos: o navegador insere normalmente
            }
            event.preventDefault();
            var digits = text.replace(/[^0-9]/g, '');
            var hasLeadingPlus = text.trim().charAt(0) === '+';
            var insert = (hasLeadingPlus && canInsertLeadingPlus(field)) ? '+' + digits : digits;
            if (insert) {
                insertText(field, insert);
            }
        });

        // Rede de segurança (autofill/valores antigos).
        field.addEventListener('input', function () {
            normalizeValue(field);
        });

        // Normaliza o valor já presente.
        normalizeValue(field);
    }

    /**
     * Aplica o handler aos campos encontrados dentro de um nó.
     *
     * @param {Node} root
     */
    function scan(root) {
        if (!root || root.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        if (root.matches && root.matches(SELECTOR)) {
            attach(root);
        }

        if (root.querySelectorAll) {
            Array.prototype.forEach.call(root.querySelectorAll(SELECTOR), attach);
        }
    }

    function init() {
        scan(document.body);

        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                Array.prototype.forEach.call(mutation.addedNodes, function (node) {
                    scan(node);
                });
            });
        });

        observer.observe(document.body, { childList: true, subtree: true });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
