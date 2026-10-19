<?php
/**
 * Card lateral de marca/suporte das configurações.
 *
 * Portado do card da versão PRO.
 *
 * @package Woo_Better_Shipping_Calculator_For_Brazil
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$wb_card_backgrounds = isset( $backgrounds ) && is_array( $backgrounds ) ? $backgrounds : array(
	'right' => '',
	'left'  => '',
);
$wb_card_logo     = isset( $logo ) ? $logo : '';
$wb_card_whatsapp = isset( $whatsapp ) ? $whatsapp : '';
$wb_card_telegram = isset( $telegram ) ? $telegram : '';
$wb_card_versions = isset( $versions ) ? $versions : '';
?>
<div class="linkn-link-settings-card" style="background-image: url('<?php echo esc_url( $wb_card_backgrounds['right'] ); ?>'), url('<?php echo esc_url( $wb_card_backgrounds['left'] ); ?>');">
	<div class="linkn-link-logo" id="lkn-woo-better-div-logo">
		<div>
			<?php if ( '' !== $wb_card_logo ) : ?>
				<img src="<?php echo esc_url( $wb_card_logo ); ?>" alt="Logo">
			<?php endif; ?>
		</div>
		<p><?php echo esc_html( $wb_card_versions ); ?></p>
	</div>
	<div class="linkn-link-content">
		<div class="linkn-link-links">
			<div>
				<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( 'https://www.linknacional.com.br/wordpress/plugins/' ); ?>">
					<b>&bull;</b><?php esc_html_e( 'WP Plugins', 'woo-better-shipping-calculator-for-brazil' ); ?>
				</a>
				<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( 'https://www.linknacional.com.br/wordpress/hospedagem/' ); ?>">
					<b>&bull;</b><?php esc_html_e( 'Hospedagem', 'woo-better-shipping-calculator-for-brazil' ); ?>
				</a>
			</div>
			<div>
				<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( 'https://www.linknacional.com.br/wordpress/suporte/' ); ?>">
					<b>&bull;</b><?php esc_html_e( 'Suporte WP', 'woo-better-shipping-calculator-for-brazil' ); ?>
				</a>
				<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( 'https://www.linknacional.com.br/wordpress/' ); ?>">
					<b>&bull;</b><?php esc_html_e( 'Soluções WP', 'woo-better-shipping-calculator-for-brazil' ); ?>
				</a>
			</div>
		</div>
		<div class="linkn-support-links">
			<div class="linkn-stars-div">
				<a target="_blank" rel="noopener noreferrer" href="<?php echo esc_url( 'https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews' ); ?>">
					<p><?php esc_html_e( 'Avaliar o plugin', 'woo-better-shipping-calculator-for-brazil' ); ?></p>
					<div class="linkn-stars">
						<span class="dashicons dashicons-star-filled linkn-stars-icon"></span>
						<span class="dashicons dashicons-star-filled linkn-stars-icon"></span>
						<span class="dashicons dashicons-star-filled linkn-stars-icon"></span>
						<span class="dashicons dashicons-star-filled linkn-stars-icon"></span>
						<span class="dashicons dashicons-star-filled linkn-stars-icon"></span>
					</div>
				</a>
			</div>
			<div class="linkn-contact-links">
				<?php if ( '' !== $wb_card_whatsapp ) : ?>
					<a href="<?php echo esc_url( 'https://chat.whatsapp.com/C6S3my9Adr818hbeJphPBm' ); ?>" target="_blank" rel="noopener noreferrer">
						<img src="<?php echo esc_url( $wb_card_whatsapp ); ?>" alt="Whatsapp Icon" class="linkn-contact-icon">
					</a>
				<?php endif; ?>
				<?php if ( '' !== $wb_card_telegram ) : ?>
					<a href="<?php echo esc_url( 'https://t.me/wpprobr' ); ?>" target="_blank" rel="noopener noreferrer">
						<img src="<?php echo esc_url( $wb_card_telegram ); ?>" alt="Telegram Icon" class="linkn-contact-icon">
					</a>
				<?php endif; ?>
			</div>
		</div>
	</div>
</div>
