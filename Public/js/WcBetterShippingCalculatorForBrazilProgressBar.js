(function ($) {
	'use strict';

	console.log('chamadoooo')

	var minValue = typeof wc_better_shipping_progress !== 'undefined'
		? parseFloat(wc_better_shipping_progress.min_free_shipping_value)
		: 0;

	if (minValue <= 0) return;

	function getCartTotal() {
		var el = document.querySelector('.wc-block-formatted-money-amount.wc-block-components-totals-item__value');
		if (!el) return 0;
		var value = el.textContent.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.');
		return parseFloat(value) || 0;
	}

	function insertOrUpdateProgressBar() {
		var cartTotal = getCartTotal();
		var percent = Math.min((cartTotal / minValue) * 100, 100);

		var progressBar = document.querySelector('.wc-better-shipping-progress-bar');
		if (!progressBar) {
			var html =
				'<div class="wc-better-shipping-progress-bar" style="margin:15px 0;">' +
				'<div style="background:#eee; border-radius:4px; overflow:hidden; height:20px;">' +
				'<div class="wc-better-shipping-progress" style="background:#4caf50; width:' + percent + '%; height:100%; transition:width 0.5s;"></div>' +
				'</div>' +
				'<div class="wc-better-shipping-progress-text" style="margin-top:5px; font-size:14px;">' +
				(cartTotal >= minValue
					? 'Congratulations! You have free shipping!'
					: 'Add R$ ' + (minValue - cartTotal).toFixed(2) + ' more for free shipping!') +
				'</div>' +
				'</div>';

			var target = document.querySelector('.cart_totals, .woocommerce-cart-form');
			if (target) {
				target.parentNode.insertBefore($(html)[0], target);
			}
		} else {
			var bar = progressBar.querySelector('.wc-better-shipping-progress');
			if (bar) bar.style.width = percent + '%';
			var text = progressBar.querySelector('.wc-better-shipping-progress-text');
			if (text) {
				text.textContent = cartTotal >= minValue
					? 'Congratulations! You have free shipping!'
					: 'Add R$ ' + (minValue - cartTotal).toFixed(2) + ' more for free shipping!';
			}
		}
	}

	function waitForCartTotalAndInit() {
		var target = document.querySelector('.wc-block-formatted-money-amount.wc-block-components-totals-item__value');
		if (!target) {
			setTimeout(waitForCartTotalAndInit, 200);
			return;
		}

		insertOrUpdateProgressBar();

		var observer = new MutationObserver(function () {
			insertOrUpdateProgressBar();
		});
		observer.observe(target, { childList: true, characterData: true, subtree: true });
	}

	$(waitForCartTotalAndInit);

})(jQuery);