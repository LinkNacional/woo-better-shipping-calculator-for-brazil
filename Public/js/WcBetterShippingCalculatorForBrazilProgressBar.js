(function ($) {
	'use strict';

	let minValue = typeof wc_better_shipping_progress !== 'undefined'
		? parseFloat(wc_better_shipping_progress.min_free_shipping_value)
		: 0;

	function getCartTotal() {
		let el = document.querySelector('.wc-block-formatted-money-amount.wc-block-components-totals-item__value');
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
			let html =
				'<div class="wc-better-shipping-progress-bar" style="margin:15px 0px;padding:0px 16px">' +
				'<div style="background:#eee; border-radius:4px; overflow:hidden; height:20px;">' +
				'<div class="wc-better-shipping-progress" style="background:#4caf50; width:' + percent + '%; height:100%; transition:width 0.5s;"></div>' +
				'</div>' +
				'<div class="wc-better-shipping-progress-text" style="margin-top:5px; font-size:14px;">' +
				message +
				'</div>' +
				'</div>';

			let targets = document.querySelectorAll('.wp-block-woocommerce-cart-order-summary-subtotal-block.wc-block-components-totals-wrapper');
			if (targets.length > 0) {
				targets.forEach(function (target) {
					target.parentNode.insertBefore($(html)[0], target);
				});
			}
			targets = document.querySelectorAll('.wp-block-woocommerce-checkout-order-summary-subtotal-block.wc-block-components-totals-wrapper');
			if (targets.length > 0) {
				targets.forEach(function (target) {
					target.parentNode.insertBefore($(html)[0], target);
				});
			}
		} else {
			let bar = progressBar.querySelector('.wc-better-shipping-progress');
			if (bar) bar.style.width = percent + '%';
			let text = progressBar.querySelector('.wc-better-shipping-progress-text');
			if (text) {
				text.textContent = message;
			}
		}
	}

	function waitForCartTotalAndInit() {
		let target = document.querySelector('.wc-block-formatted-money-amount.wc-block-components-totals-item__value');
		if (!target) {
			setTimeout(waitForCartTotalAndInit, 200);
			return;
		}

		insertOrUpdateProgressBar();

		let observer = new MutationObserver(function () {
			insertOrUpdateProgressBar();
		});
		observer.observe(target, { childList: true, characterData: true, subtree: true });
	}

	$(waitForCartTotalAndInit);

})(jQuery);