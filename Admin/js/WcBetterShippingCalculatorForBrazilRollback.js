(function () {
	'use strict';

	document.addEventListener('click', function (event) {
		var target = event.target;
		if (!target || typeof target.closest !== 'function') {
			return;
		}

		var link = target.closest('.woo-better-rollback-link');
		if (!link) {
			return;
		}

		event.preventDefault();

		// Já está em andamento: não permite novo clique.
		if (link.getAttribute('data-loading') === '1') {
			return;
		}

		var cfg = window.WooBetterRollback || {};
		var confirmMessage = cfg.confirm || 'Tem certeza que deseja retornar à versão anterior?';

		if (!window.confirm(confirmMessage)) {
			return;
		}

		// Trava o clique e muda para "Carregando..." em cinza.
		link.setAttribute('data-loading', '1');
		link.style.color = '#888';
		link.style.cursor = 'default';
		link.style.pointerEvents = 'none';
		link.textContent = cfg.loading || 'Carregando...';

		var data = new FormData();
		data.append('action', cfg.action);
		data.append('nonce', cfg.nonce);

		fetch(cfg.ajaxurl || '/wp-admin/admin-ajax.php', {
			method: 'POST',
			credentials: 'same-origin',
			body: data
		}).then(function (response) {
			return response.json();
		}).then(function (res) {
			if (!res || !res.success) {
				throw new Error((res && res.data && res.data.message) ? res.data.message : 'Erro ao retornar à versão anterior.');
			}

			var redirect = (res.data && res.data.redirect_url)
				? res.data.redirect_url
				: (cfg.redirect_url || '/wp-admin/plugins.php');

			window.location.href = redirect;
		}).catch(function () {
			// O cartão de erro é exibido após o reload (via option de resultado).
			window.location.reload();
		});
	});
})();
