(function () {
    'use strict';

    function closeCard(card) {
        if (!card || card.classList.contains('is-closing')) {
            return;
        }
        card.classList.add('is-closing');
        card.style.opacity = '0';
        setTimeout(function () {
            card.remove();
        }, 300);
    }

    function mountCard(card) {
        var host = document.querySelector('.wp-header-end') || document.querySelector('#wpbody-content');
        if (!host) {
            return;
        }
        host.insertAdjacentElement('afterend', card);

        // Fecha sozinho após alguns segundos.
        setTimeout(function () {
            closeCard(card);
        }, 3600);
    }

    function showSuccessCard(key) {
        var cfg = (window.WooBetterShippingInstall && WooBetterShippingInstall.success) || {};

        var existing = document.querySelector('.woo-better-shipping-success-card, .woo-better-shipping-error-card');
        if (existing) {
            existing.remove();
        }

        var card = document.createElement('div');
        card.className = 'notice woo-better-notice woo-better-notice--success woo-better-shipping-success-card';

        var content = document.createElement('div');
        content.className = 'woo-better-notice__content';

        var title = document.createElement('p');
        title.className = 'woo-better-notice__title';
        var strong = document.createElement('strong');
        strong.textContent = cfg.title || '';
        var badge = document.createElement('span');
        badge.className = 'woo-better-notice__badge';
        badge.textContent = cfg.badge || '';
        title.appendChild(strong);
        title.appendChild(badge);

        var body = document.createElement('p');
        body.textContent = cfg[key] || '';

        content.appendChild(title);
        content.appendChild(body);
        card.appendChild(content);

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'notice-dismiss woo-better-shipping-success-card__close';
        var sr = document.createElement('span');
        sr.className = 'screen-reader-text';
        sr.textContent = cfg.close || 'Fechar';
        close.appendChild(sr);
        card.appendChild(close);

        mountCard(card);
    }

    function showErrorCard(message) {
        var cfg = (window.WooBetterShippingInstall && WooBetterShippingInstall.error) || {};

        var existing = document.querySelector('.woo-better-shipping-success-card, .woo-better-shipping-error-card');
        if (existing) {
            existing.remove();
        }

        var card = document.createElement('div');
        card.className = 'notice woo-better-notice woo-better-notice--error woo-better-shipping-error-card';

        var content = document.createElement('div');
        content.className = 'woo-better-notice__content';

        var title = document.createElement('p');
        title.className = 'woo-better-notice__title';
        var strong = document.createElement('strong');
        strong.textContent = cfg.title || '';
        var badge = document.createElement('span');
        badge.className = 'woo-better-notice__badge';
        badge.textContent = cfg.badge || '';
        title.appendChild(strong);
        title.appendChild(badge);

        var body = document.createElement('p');
        body.textContent = message || 'Erro. Tente novamente.';

        content.appendChild(title);
        content.appendChild(body);
        card.appendChild(content);

        var close = document.createElement('button');
        close.type = 'button';
        close.className = 'notice-dismiss woo-better-shipping-error-card__close';
        var sr = document.createElement('span');
        sr.className = 'screen-reader-text';
        sr.textContent = cfg.close || 'Fechar';
        close.appendChild(sr);
        card.appendChild(close);

        mountCard(card);
    }

    function start(btn) {
        if (btn.getAttribute('data-installing') === '1') {
            return;
        }
        btn.setAttribute('data-installing', '1');
        btn.classList.add('is-loading');

        // Trava a largura atual para o texto não alterar o tamanho do botão
        // quando virar "Sucesso!" (mais curto) ou mensagem de erro (mais longa).
        if (!btn.style.minWidth) {
            btn.style.minWidth = btn.offsetWidth + 'px';
        }

        var bar = btn.querySelector('.woo-better-shipping-install-button__bar');
        var text = btn.querySelector('.woo-better-shipping-install-button__text');

        if (bar) {
            bar.style.transition = 'width 6s linear';
            bar.style.width = '90%';
        }

        var formData = new FormData();
        formData.append('action', WooBetterShippingInstall.action);
        formData.append('nonce', WooBetterShippingInstall.nonce);
        formData.append('install_action', btn.getAttribute('data-install-action'));

        fetch(WooBetterShippingInstall.ajaxurl || '/wp-admin/admin-ajax.php', {
            method: 'POST',
            credentials: 'same-origin',
            body: formData
        }).then(function (response) {
            return response.json();
        }).then(function (data) {
            if (!data || !data.success) {
                throw new Error(data && data.data && data.data.message ? data.data.message : 'Erro ao concluir a operação.');
            }

            if (bar) {
                bar.style.transition = 'width 0.4s ease';
                bar.style.width = '100%';
            }
            btn.classList.remove('is-loading');
            btn.classList.add('is-success');
            if (text) {
                text.textContent = 'Sucesso!';
            }

            // O cartão de sucesso é exibido pelo shipping-simulator após o redirect.
            var redirect = data.data && data.data.redirect_url
                ? data.data.redirect_url
                : WooBetterShippingInstall.fallback_url;

            setTimeout(function () {
                window.location.href = redirect;
            }, 1500);
        }).catch(function () {
            // O erro é exibido como cartão após o refresh (via transient).
            window.location.reload();
        });
    }

    document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
            return;
        }

        var close = target.closest('.woo-better-shipping-success-card__close, .woo-better-shipping-error-card__close');
        if (close) {
            closeCard(close.closest('.woo-better-shipping-success-card, .woo-better-shipping-error-card'));
            return;
        }

        var btn = target.closest('.woo-better-shipping-install-button');
        if (btn) {
            event.preventDefault();
            start(btn);
        }
    });

    // Exibe o cartão (sucesso ou erro) ao carregar a página.
    if (window.WooBetterShippingInstall && WooBetterShippingInstall.show_on_load) {
        if ('error' === WooBetterShippingInstall.show_on_load) {
            showErrorCard(WooBetterShippingInstall.error_message);
        } else {
            showSuccessCard(WooBetterShippingInstall.show_on_load);
        }
    }
})();
