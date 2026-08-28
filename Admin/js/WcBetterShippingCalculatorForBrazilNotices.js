(function () {
	'use strict';

	// Dispensa qualquer aviso que exponha data-action/data-nonce via fetch,
	// sem depender de jQuery nem de script inline no PHP.
	document.addEventListener('click', function (event) {
		var target = event.target;
		if (!target || typeof target.closest !== 'function') {
			return;
		}

		var dismiss = target.closest('.notice-dismiss');
		if (!dismiss) {
			return;
		}

		var notice = dismiss.closest('[data-dismissible]');
		if (!notice) {
			return;
		}

		var action = notice.getAttribute('data-action');
		if (!action) {
			return;
		}

		event.preventDefault();

		var formData = new FormData();
		formData.append('action', action);
		formData.append('nonce', notice.getAttribute('data-nonce'));

		fetch(window.ajaxurl || '/wp-admin/admin-ajax.php', {
			method: 'POST',
			credentials: 'same-origin',
			body: formData
		}).then(function () {
			notice.remove();
		}).catch(function () {
			notice.remove();
		});
	});
})();
