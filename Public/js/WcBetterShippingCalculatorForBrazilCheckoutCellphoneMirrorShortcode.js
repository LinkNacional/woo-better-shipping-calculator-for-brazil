/**
 * Espelho Telefone → Celular (shim) no checkout CLÁSSICO/shortcode.
 *
 * No modo "Permitir Telefone Celular e Fixo" com o bloco "Campo de Celular"
 * DESLIGADO, o plugin registra `billing_cellphone`/`shipping_cellphone` como um
 * campo ESCONDIDO (`type=hidden`) para compatibilidade com plugins que esperam
 * `billing_cellphone` (PagBank, Asaas, NFe...). Este script COPIA o valor do
 * telefone (#billing_phone/#shipping_phone) para o campo escondido
 * (#billing_cellphone/#shipping_cellphone) enquanto o cliente digita, para que o
 * valor também chegue no `$_POST` — além do espelho que já é feito no servidor
 * (`handle_cellphone_posted_data`).
 *
 * A normalização final (para `+DDInúmero`) continua no servidor.
 */
(function () {
    'use strict';

    var config = (typeof wc_better_cellphone_mirror_vars !== 'undefined') ? wc_better_cellphone_mirror_vars : {};
    var enabled = config.enabled === true || config.enabled === 'true' || config.enabled === 1 || config.enabled === '1';

    // Só roda no modo shim (o PHP só enfileira nesse cenário). O guarda evita
    // espelhar caso a config chegue sem o flag.
    if (!enabled) {
        return;
    }

    var TYPES = ['billing', 'shipping'];

    /**
     * Campo de telefone nativo (`#billing_phone` / `#shipping_phone`).
     *
     * A máscara (intl-tel-input) mantém o valor ATUALIZADO nesse mesmo input, então
     * ler de lá após os eventos já pega o número formatado.
     *
     * @param {string} type 'billing' | 'shipping'
     * @returns {HTMLInputElement|null}
     */
    function phoneInput(type) {
        return document.querySelector('#' + type + '_phone') ||
            document.querySelector('#' + type + '-phone') ||
            document.querySelector('input[name="' + type + '_phone"]');
    }

    /**
     * Campo escondido de celular (`billing_cellphone`/`shipping_cellphone`).
     *
     * @param {string} type 'billing' | 'shipping'
     * @returns {HTMLInputElement|null}
     */
    function cellphoneInput(type) {
        return document.querySelector('input[name="' + type + '_cellphone"]') ||
            document.querySelector('#' + type + '_cellphone');
    }

    /**
     * Espelha o valor do telefone no campo escondido de celular.
     *
     * @param {string} type 'billing' | 'shipping'
     */
    function sync(type) {
        var phone = phoneInput(type);
        var cell = cellphoneInput(type);
        if (!phone || !cell) {
            return;
        }
        if (cell.value !== phone.value) {
            cell.value = phone.value;
        }
    }

    /**
     * Liga os listeners de um tipo (idempotente).
     *
     * @param {string} type 'billing' | 'shipping'
     */
    function bind(type) {
        var phone = phoneInput(type);
        if (!phone || phone.dataset.wcBetterCellphoneMirrorBound === 'true') {
            return;
        }
        phone.dataset.wcBetterCellphoneMirrorBound = 'true';

        ['input', 'change', 'keyup', 'blur'].forEach(function (eventName) {
            phone.addEventListener(eventName, function () {
                sync(type);
            });
        });

        // Estado inicial (ex.: valor pré-preenchido da sessão/perfil).
        sync(type);
    }

    /** Liga e sincroniza os dois endereços. */
    function syncAll() {
        TYPES.forEach(function (type) {
            bind(type);
            sync(type);
        });
    }

    /**
     * Inicializa o espelho. Só pode rodar quando o `<body>` existe (o script é
     * enfileirado no `<head>`, sem `in_footer`), senão o `MutationObserver.observe`
     * lança "parameter 1 is not of type 'Node'".
     */
    function start() {
        if (!document.body) {
            return;
        }

        syncAll();

        // Garante o valor no envio do formulário, mesmo que nenhum evento de input
        // tenha disparado (ex.: autofill que só seta o valor final).
        document.addEventListener('submit', function () {
            syncAll();
        }, true);

        // Reexecuta quando o checkout redesenha (ex.: "enviar para outro endereço").
        new MutationObserver(function () {
            syncAll();
        }).observe(document.body, {
            childList: true,
            subtree: true
        });

        if (window.jQuery) {
            window.jQuery(document.body).on('updated_checkout updated_shipping_method updated_wc_div', function () {
                syncAll();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start);
    } else {
        start();
    }
})();
