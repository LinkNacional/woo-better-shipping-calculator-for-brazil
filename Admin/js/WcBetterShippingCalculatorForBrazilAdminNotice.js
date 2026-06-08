(function ($) {
	'use strict';

	jQuery(document).ready(function ($) {
		$(document).on('click.wooBetterCalcNotice', '[data-dismissible="woo-better-calc-notice"] .notice-dismiss', function (e) {
			e.preventDefault();
			e.stopImmediatePropagation();

			var $notice = $(this).closest('[data-dismissible="woo-better-calc-notice"]');

			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: {
					action: 'woo_better_calc_dismiss_notice',
					nonce: wooBetterNotice.nonce
				},
				success: function (response) {
					$notice.fadeOut();
				},
				error: function () {
					$notice.fadeOut();
					console.error('Erro ao dispensar o notice');
				}
			});
		});
	});


})(jQuery);
