(function () {
	'use strict';

	function insertAfterHeader(el) {
		var anchor = document.querySelector('.wp-header-end') || document.querySelector('#wpbody-content');
		if (anchor) {
			anchor.insertAdjacentElement('afterend', el);
		}
	}

	function buildCard(kind, title, badge, text, closeLabel) {
		var card = document.createElement('div');
		card.className = 'notice is-dismissible woo-better-beta-notice woo-better-beta-card--' + kind + ' woo-better-beta-' + kind + '-card';

		var icon = document.createElement('div');
		icon.className = 'woo-better-beta-notice__icon';
		var img = document.createElement('img');
		img.src = window.WooBetterBetaNotice.icon_url || '';
		img.alt = title || '';
		icon.appendChild(img);

		var content = document.createElement('div');
		content.className = 'woo-better-beta-notice__content';

		var titleEl = document.createElement('p');
		titleEl.className = 'woo-better-beta-notice__title';
		var strong = document.createElement('strong');
		strong.textContent = title || '';
		var badgeEl = document.createElement('span');
		badgeEl.className = 'woo-better-beta-notice__badge';
		badgeEl.textContent = badge || '';
		titleEl.appendChild(strong);
		titleEl.appendChild(badgeEl);

		var msg = document.createElement('p');
		msg.textContent = text || '';

		content.appendChild(titleEl);
		content.appendChild(msg);

		var close = document.createElement('button');
		close.type = 'button';
		close.className = 'notice-dismiss woo-better-beta-' + kind + '-card__close';
		var sr = document.createElement('span');
		sr.className = 'screen-reader-text';
		sr.textContent = closeLabel || 'Fechar';
		close.appendChild(sr);

		card.appendChild(icon);
		card.appendChild(content);
		card.appendChild(close);

		return card;
	}

	function removeExistingCards() {
		var existing = document.querySelector('.woo-better-beta-success-card, .woo-better-beta-error-card');
		if (existing) {
			existing.remove();
		}
	}

	// Dispensa o aviso permanentemente.
	document.addEventListener('click', function (e) {
		var target = e.target;
		if (!target || typeof target.closest !== 'function') {
			return;
		}

		var dismiss = target.closest('.notice-dismiss');
		if (dismiss) {
			var wrapper = dismiss.closest('[data-dismissible="woo-better-beta-notice"]');
			if (wrapper) {
				e.preventDefault();
				var data = new FormData();
				data.append('action', window.WooBetterBetaNotice.dismiss_action);
				data.append('nonce', window.WooBetterBetaNotice.dismiss_nonce);
				fetch(window.WooBetterBetaNotice.ajaxurl, { method: 'POST', credentials: 'same-origin', body: data })
					.then(function () { wrapper.remove(); })
					.catch(function () { wrapper.remove(); });
			}
			return;
		}

		// Fecha os cards de sucesso/erro.
		var cardClose = target.closest('.woo-better-beta-success-card__close, .woo-better-beta-error-card__close');
		if (cardClose) {
			var card = cardClose.closest('.woo-better-beta-success-card, .woo-better-beta-error-card');
			if (card && !card.classList.contains('is-closing')) {
				card.classList.add('is-closing');
				card.style.opacity = '0';
				setTimeout(function () { card.remove(); }, 300);
			}
		}
	});

	// Instala a versão beta com barra de progresso.
	document.addEventListener('click', function (e) {
		var target = e.target;
		if (!target || typeof target.closest !== 'function') {
			return;
		}

		var button = target.closest('.woo-better-beta-install-button');
		if (!button) {
			return;
		}

		e.preventDefault();

		if (button.getAttribute('data-installing') === '1') {
			return;
		}
		button.setAttribute('data-installing', '1');
		button.classList.add('is-loading');

		if (!button.style.minWidth) {
			button.style.minWidth = button.offsetWidth + 'px';
		}

		var bar = button.querySelector('.woo-better-beta-install-button__bar');
		var text = button.querySelector('.woo-better-beta-install-button__text');

		if (bar) {
			bar.style.transition = 'width 6s linear';
			bar.style.width = '90%';
		}

		var data = new FormData();
		data.append('action', window.WooBetterBetaNotice.install_action);
		data.append('nonce', window.WooBetterBetaNotice.install_nonce);

		fetch(window.WooBetterBetaNotice.ajaxurl, { method: 'POST', credentials: 'same-origin', body: data })
			.then(function (r) { return r.json(); })
			.then(function (res) {
				if (!res || !res.success) {
					throw new Error((res && res.data && res.data.message) ? res.data.message : 'Erro ao instalar a versão beta.');
				}

				if (bar) {
					bar.style.transition = 'width 0.4s ease';
					bar.style.width = '100%';
				}
				button.classList.remove('is-loading');
				button.classList.add('is-success');
				if (text) {
					text.textContent = 'Sucesso!';
				}

				var redirect = (res.data && res.data.redirect_url) ? res.data.redirect_url : window.WooBetterBetaNotice.fallback_url;
				setTimeout(function () { window.location.href = redirect; }, 1500);
			})
			.catch(function () {
				window.location.reload();
			});
	});

	// Renderiza o card de sucesso/erro após o redirect/reload.
	if (window.WooBetterBetaNotice && window.WooBetterBetaNotice.show_on_load) {
		removeExistingCards();

		if (window.WooBetterBetaNotice.show_on_load === 'error') {
			var err = window.WooBetterBetaNotice.error || {};
			var errCard = buildCard('error', err.title, err.badge, window.WooBetterBetaNotice.error_message || 'Erro. Tente novamente.', err.close);
			insertAfterHeader(errCard);
		} else {
			var ok = window.WooBetterBetaNotice.success || {};
			var okCard = buildCard('success', ok.title, ok.badge, ok.text, ok.close);
			insertAfterHeader(okCard);
		}
	}
})();
