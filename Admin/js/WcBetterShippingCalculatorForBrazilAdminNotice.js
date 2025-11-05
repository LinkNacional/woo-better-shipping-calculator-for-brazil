(function ($) {
	'use strict';

	jQuery(document).ready(function ($) {

		$('[data-dismissible="woo-better-calc-notice"] .notice-dismiss').on('click', function (e) {
			e.preventDefault();

			$.ajax({
				url: ajaxurl,
				type: 'POST',
				data: {
					action: 'woo_better_calc_dismiss_notice',
					nonce: wooBetterNotice.nonce
				},
				success: function (response) {
					$('[data-dismissible="woo-better-calc-notice"]').fadeOut();
				},
				error: function () {
					console.error('Erro ao dispensar o notice');
				}
			});
		});
	});


})(jQuery);
