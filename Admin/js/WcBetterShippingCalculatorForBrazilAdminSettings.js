document.addEventListener('DOMContentLoaded', function () {
    // Mensagem no footer
    const saveButton = document.querySelector('p.submit');
    if (saveButton) {
        const div = document.createElement('div');
        div.innerHTML = `
            <p>
                <strong>Próximas funcionalidades:</strong> Gerador de etiqueta, Shortcode cálculo de CEP, Ratreio de pedido e muitos mais. <a href="https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/issues/new">Participe envie sua sugestão</a>.<br>
                Quer conhecer mais sobre nossos plugins? Suporte WordPress 24h:
                <a href="https://www.linknacional.com.br/wordpress" target="_blank">Link Nacional</a>
                | Avalie nosso plugin
                <a href="https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews" target="_blank">★★★★★</a>.
            </p>
        `;
        // Inserir abaixo do <p class="submit">
        saveButton.insertAdjacentElement('afterend', div);
    }

    // Função para processar links em campos específicos
    function processShippingLinks() {
        // Procura especificamente pelo campo person_type_select
        const personTypeField = document.getElementById('woo_better_calc_person_type_select');

        if (personTypeField) {
            const container = personTypeField.closest('.forminp');
            const descSpan = container?.querySelector('.woo-forminp-header span');

            if (descSpan) {
                const linkText = 'Configurações de Entrega do WooCommerce';
                const currentText = descSpan.textContent || '';

                if (currentText.includes(linkText) && !descSpan.querySelector('a')) {
                    // Cria a URL dinamicamente
                    const shippingUrl = window.location.origin + '/wp-admin/admin.php?page=wc-settings&tab=shipping&section=options';

                    const beforeLink = currentText.split(linkText)[0];
                    const afterLink = currentText.split(linkText)[1] || '';

                    descSpan.innerHTML = `${beforeLink}<a href="${shippingUrl}" target="_blank" style="color: #0073aa; text-decoration: none;">${linkText}</a>${afterLink}`;
                }
            }
        }
    }

    // Processa os links quando o DOM está carregado
    processShippingLinks();

    // Também processa após mudanças no DOM (caso o campo seja carregado dinamicamente)
    const linkObserver = new MutationObserver(function() {
        processShippingLinks();
    });

    linkObserver.observe(document.body, { childList: true, subtree: true });

    // "Desabilitado" apenas VISUAL (AGENTS.md § 7): o atributo `disabled` exclui
    // o campo do POST e a option mantém o valor antigo salvo.
    function setFakeDisabled(elements, isDisabled) {
        Array.prototype.forEach.call(elements, function (element) {
            if (window.wcBetterFakeDisabled) {
                window.wcBetterFakeDisabled(element, isDisabled);
                return;
            }

            element.removeAttribute('disabled');
            element.disabled = false;
            element.style.opacity = isDisabled ? '0.6' : '';
            element.style.cursor = isDisabled ? 'not-allowed' : '';
        });
    }

    // ── Dependência: Data de Nascimento → Obrigatoriedade ──────────────────
    const birthdateFieldRadios = document.querySelectorAll('input[name="woo_better_calc_enable_birthdate_field"]');
    const birthdateRequiredRadios = document.querySelectorAll('input[name="woo_better_calc_birthdate_required"]');

    function updateBirthdateRequiredState() {
        if (!birthdateRequiredRadios.length) return;
        const selectedValue = Array.from(birthdateFieldRadios).find(r => r.checked)?.value;
        const isLocked = (selectedValue === 'no');

        setFakeDisabled(birthdateRequiredRadios, isLocked);

        // Com o campo travado, o valor coerente ("Não") fica marcado — e agora
        // ele VAI no POST, então a tela e o banco não divergem mais.
        if (isLocked) {
            birthdateRequiredRadios.forEach(radio => {
                radio.checked = (radio.value === 'no');
            });
        }
    }

    if (birthdateFieldRadios.length && birthdateRequiredRadios.length) {
        birthdateFieldRadios.forEach(radio => {
            radio.addEventListener('change', updateBirthdateRequiredState);
        });
        updateBirthdateRequiredState(); // estado inicial
    }

    // ── Dependências pai → filho ("join"): parte COMPORTAMENTO ────────────
    // O "join" tem duas partes:
    //   1. JUNÇÃO visual (ninhar o campo filho dentro do card do pai) —
    //      `targetComponentCartNames` em ...AdminLayout.js;
    //   2. COMPORTAMENTO (travar o filho quando o pai está em "Desabilitar") —
    //      a lista `joinPairs` abaixo. Mantenha as duas em sincronia.
    // O travamento do filho é só VISUAL (`setFakeDisabled` → `wcBetterFakeDisabled`).
    // NUNCA usar o atributo `disabled`: input `disabled` não vai no POST, o
    // WooCommerce mantém o valor antigo da option e a tela passa a divergir do banco
    // (ver AGENTS.md § 7). O `checked` continua sem ser reescrito — a opção é
    // preservada e volta como estava quando o pai é reabilitado.
    const joinPairs = [
        { parent: 'woo_better_calc_enable_rg_field', child: 'woo_better_calc_rg_required' }
    ];

    function applyJoinDependency(pair) {
        const parentRadios = document.querySelectorAll('input[name="' + pair.parent + '"]');
        const childRadios = document.querySelectorAll('input[name="' + pair.child + '"]');

        if (!parentRadios.length || !childRadios.length) return;

        function syncChildState() {
            const enabled = Array.prototype.some.call(parentRadios, function (radio) {
                return radio.checked && radio.value === 'yes';
            });

            childRadios.forEach(function (radio) {
                setFakeDisabled([radio], !enabled);
            });
        }

        parentRadios.forEach(function (radio) {
            radio.addEventListener('change', syncChildState);
        });
        syncChildState(); // estado inicial
    }

    joinPairs.forEach(applyJoinDependency);
});
