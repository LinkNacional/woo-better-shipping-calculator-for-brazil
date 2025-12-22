<?php
/**
 * Shipping data view.
 *
 * @package WooBetterShippingCalculatorForBrazil/Admin/View
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<?php if ( $phone_required === 'yes' && ! empty( $shipping_phone_country_code ) ) : ?>
<div class="clear"></div>
<h3><?php esc_html_e( 'Dados do Cliente', 'woo-better-shipping-calculator-for-brazil' ); ?></h3>
<div class="woo-better-calc-address">
	<p>
		<?php if ( ! empty( $order->get_shipping_phone() ) ) : ?>
			<strong><?php echo esc_html( $phone_label ); ?>: </strong>
			<?php 
			$phone = $order->get_shipping_phone();
			echo '<a href="tel:' . esc_attr( $phone ) . '">' . esc_html( $phone ) . '</a>';
			?><br />
			<?php if ( ! empty( $shipping_phone_country_code ) ) : ?>
				<?php 
				$clean_country_code = trim($shipping_phone_country_code);
				if (!str_starts_with($clean_country_code, '+')) {
					$clean_country_code = '+' . $clean_country_code;
				}
				?>
				<strong><?php esc_html_e( 'Código do país', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong><?php echo esc_html( $clean_country_code ); ?><br />
			<?php endif; ?>
		<?php endif; ?>
	</p>
</div>
<?php endif; ?>