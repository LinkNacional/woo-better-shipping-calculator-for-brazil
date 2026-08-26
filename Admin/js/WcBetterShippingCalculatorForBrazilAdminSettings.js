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

    // ── Dependência: Data de Nascimento → Obrigatoriedade ──────────────────
    const birthdateFieldRadios = document.querySelectorAll('input[name="woo_better_calc_enable_birthdate_field"]');
    const birthdateRequiredRadios = document.querySelectorAll('input[name="woo_better_calc_birthdate_required"]');

    function lockClickHandler(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    function updateBirthdateRequiredState() {
        if (!birthdateRequiredRadios.length) return;
        const selectedValue = Array.from(birthdateFieldRadios).find(r => r.checked)?.value;
        const isLocked = (selectedValue === 'no');

        birthdateRequiredRadios.forEach(radio => {
            // Visual: parece desabilitado mas sem usar o atributo disabled (que exclui do POST)
            radio.style.opacity = isLocked ? '0.6' : '';
            radio.style.pointerEvents = isLocked ? 'none' : '';
            radio.style.cursor = isLocked ? 'not-allowed' : '';

            // Bloqueia clique e força valor 'no' quando está lockado
            if (isLocked) {
                radio.checked = (radio.value === 'no');
                radio.addEventListener('click', lockClickHandler, true);
            } else {
                radio.removeEventListener('click', lockClickHandler, true);
            }
        });
    }

    if (birthdateFieldRadios.length && birthdateRequiredRadios.length) {
        birthdateFieldRadios.forEach(radio => {
            radio.addEventListener('change', updateBirthdateRequiredState);
        });
        updateBirthdateRequiredState(); // estado inicial
    }
});
