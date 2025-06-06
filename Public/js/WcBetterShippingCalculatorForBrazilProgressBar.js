(function ($) {
	'use strict';

	let previousPorcent = null

	let minValue = typeof wc_better_shipping_progress !== 'undefined'
		? parseFloat(wc_better_shipping_progress.min_free_shipping_value)
		: 0;

	function getCartTotal() {
		let el = document.querySelector('.wc-block-formatted-money-amount.wc-block-components-totals-item__value');
		if (!el) {
			el = document.querySelector('td[data-title="Subtotal"] .woocommerce-Price-amount.amount bdi');
		}
		if (!el) {
			el = document.querySelector('.cart-subtotal .woocommerce-Price-amount.amount bdi');
		}
		if (!el) return 0;
		let value = el.textContent.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
		return parseFloat(value) || 0;
	}

	function insertOrUpdateProgressBar() {
		let cartTotal = getCartTotal();
		let percent = 0;
		let message = '';

		if (minValue <= 0) {
			percent = 100;
			message = 'Congratulations! You have free shipping!';
		} else {
			percent = Math.min((cartTotal / minValue) * 100, 100);
			message = cartTotal >= minValue
				? 'Congratulations! You have free shipping!'
				: 'Add R$ ' + (minValue - cartTotal).toFixed(2) + ' more for free shipping!';
		}

		let progressBar = document.querySelector('.wc-better-shipping-progress-bar');
		if (!progressBar) {
			let progressBarContainer = document.createElement('div');
			progressBarContainer.className = 'wc-better-shipping-progress-bar';
			progressBarContainer.style.margin = '15px 0px';
			progressBarContainer.style.padding = '0px 16px';

			// Cria o contêiner da barra de progresso
			let progressBarWrapper = document.createElement('div');
			progressBarWrapper.style.background = '#eee';
			progressBarWrapper.style.borderRadius = '4px';
			progressBarWrapper.style.overflow = 'hidden';
			progressBarWrapper.style.height = '20px';

			// Cria a barra de progresso
			let progressBar = document.createElement('div');
			progressBar.className = 'wc-better-shipping-progress';
			progressBar.style.background = '#4caf50';
			progressBar.style.width = percent + '%';
			progressBar.style.height = '100%';
			progressBar.style.transition = 'width 0.5s';

			// Adiciona a barra de progresso ao contêiner
			progressBarWrapper.appendChild(progressBar);

			// Cria o texto da barra de progresso
			let progressBarText = document.createElement('div');
			progressBarText.className = 'wc-better-shipping-progress-text';
			progressBarText.style.marginTop = '5px';
			progressBarText.style.fontSize = '14px';
			progressBarText.textContent = message;

			// Adiciona o contêiner da barra e o texto ao contêiner principal
			progressBarContainer.appendChild(progressBarWrapper);
			progressBarContainer.appendChild(progressBarText);

			let targets = document.querySelectorAll('.cart_totals.calculated_shipping h2');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}

			targets = document.querySelectorAll('.woocommerce-checkout-review-order');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}

			targets = document.querySelectorAll('.wp-block-woocommerce-cart-order-summary-heading-block');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}
			targets = document.querySelectorAll('.wc-block-components-checkout-order-summary__title');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px 10px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}
		} else {
			if (previousPorcent !== percent) {
				let bar = progressBar.querySelector('.wc-better-shipping-progress');
				if (bar) bar.style.width = percent + '%';
				let text = progressBar.querySelector('.wc-better-shipping-progress-text');
				if (text) {
					text.textContent = message;
				}
				previousPorcent = percent;
			}
		}
	}

	function waitForCartTotalAndInit() {
		let attempts = 0; // Contador de tentativas

		function tryInit() {
			let target = document.querySelector('.wc-block-formatted-money-amount.wc-block-components-totals-item__value');
			if (!target) {
				target = document.querySelector('.cart-collaterals');
			}
			if (!target) {
				target = document.querySelector('#order_review');
			}

			if (!target) {
				attempts++;
				if (attempts >= 20) {
					return;
				}
				setTimeout(tryInit, 200); // Tenta novamente após 200ms
				return;
			}

			insertOrUpdateProgressBar();

			let observer = new MutationObserver(function () {
				insertOrUpdateProgressBar();
			});
			observer.observe(target, { childList: true, characterData: true, subtree: true });
		}

		tryInit(); // Inicia a primeira tentativa
	}

	$(waitForCartTotalAndInit);

})(jQuery);