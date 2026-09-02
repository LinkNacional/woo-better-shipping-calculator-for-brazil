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

    function showSuccessCard(action) {
        var cfg = WooBetterShippingInstall.success || {};

        // Evita duplicar o cartão caso o sucesso dispare mais de uma vez.
        var existing = document.querySelector('.woo-better-shipping-success-card');
        if (existing) {
            existing.remove();
        }

        var desc = cfg[action] || '';
        var html =
            '<div class="notice woo-better-notice woo-better-notice--success woo-better-shipping-success-card">' +
                '<div class="woo-better-notice__content">' +
                    '<p class="woo-better-notice__title">' +
                        '<strong>' + (cfg.title || '') + '</strong>' +
                        '<span class="woo-better-notice__badge">' + (cfg.badge || '') + '</span>' +
                    '</p>' +
                    '<p>' + desc + '</p>' +
                '</div>' +
                '<button type="button" class="notice-dismiss woo-better-shipping-success-card__close"><span class="screen-reader-text">' + (cfg.close || 'Fechar') + '</span></button>' +
            '</div>';

        var host = document.querySelector('.wp-header-end') || document.querySelector('#wpbody-content');
        if (!host) {
            return;
        }

        var temp = document.createElement('div');
        temp.innerHTML = html;
        var card = temp.firstElementChild;

        host.insertAdjacentElement('afterend', card);

        // Fecha sozinho um pouco antes do redirect.
        setTimeout(function () {
            closeCard(card);
        }, 3600);
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
        var action = btn.getAttribute('data-install-action');

        if (bar) {
            bar.style.transition = 'width 6s linear';
            bar.style.width = '90%';
        }

        var formData = new FormData();
        formData.append('action', WooBetterShippingInstall.action);
        formData.append('nonce', WooBetterShippingInstall.nonce);
        formData.append('install_action', action);

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

            showSuccessCard(action);

            var redirect = data.data && data.data.redirect_url
                ? data.data.redirect_url
                : WooBetterShippingInstall.fallback_url;

            setTimeout(function () {
                window.location.href = redirect;
            }, 4000);
        }).catch(function (err) {
            btn.classList.remove('is-loading');
            btn.classList.add('is-error');
            btn.removeAttribute('data-installing');
            if (text) {
                text.textContent = (err && err.message) ? err.message : 'Erro. Tente novamente.';
            }
        });
    }

    document.addEventListener('click', function (event) {
        var target = event.target;
        if (!target || typeof target.closest !== 'function') {
            return;
        }

        var close = target.closest('.woo-better-shipping-success-card__close');
        if (close) {
            closeCard(close.closest('.woo-better-shipping-success-card'));
            return;
        }

        var btn = target.closest('.woo-better-shipping-install-button');
        if (btn) {
            event.preventDefault();
            start(btn);
        }
    });
})();
