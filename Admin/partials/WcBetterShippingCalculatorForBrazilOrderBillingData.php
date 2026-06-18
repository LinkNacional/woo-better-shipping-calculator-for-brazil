<?php
/**
 * Billing data view.
 *
 * @package WooBetterShippingCalculatorForBrazil/Admin/View
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}
?>

<?php if ( ! empty( $display_data ) ) : ?>
<div class="clear"></div>

<h3><?php esc_html_e( 'Dados do Cliente', 'woo-better-shipping-calculator-for-brazil' ); ?></h3>
<div class="woo-better-calc-address">
	<p>
		<?php foreach ( $display_data as $key => $data ) : ?>
			<strong><?php echo esc_html( $data['label'] ); ?>: </strong>
			<?php if ( isset( $data['is_link'] ) && $data['is_link'] ) : ?>
				<a href="tel:<?php echo esc_attr( $data['value'] ); ?>"><?php echo esc_html( $data['value'] ); ?></a>
			<?php elseif ( isset( $data['is_clickable'] ) && $data['is_clickable'] ) : ?>
				<?php echo wp_kses_post( make_clickable( $data['value'] ) ); ?>
			<?php else : ?>
				<?php echo esc_html( $data['value'] ); ?>
			<?php endif; ?>
			<br />
		<?php endforeach; ?>
	</p>
</div>
<?php endif; ?>

<?php if ( ! empty( $delivery_data ) && ! empty( $delivery_data['formatted'] ) ) : ?>
<h3><?php esc_html_e( 'Prazo de Entrega', 'woo-better-shipping-calculator-for-brazil' ); ?></h3>
<div class="woo-better-calc-address">
	<p>
		<strong><?php esc_html_e( 'Data de Entrega', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong>
		<?php echo esc_html( $delivery_data['formatted'] ); ?>
		<?php if ( ! empty( $delivery_data['remaining'] ) ) : ?>
			(<?php echo esc_html( $delivery_data['remaining'] ); ?>)
		<?php endif; ?>
	</p>
</div>
<?php endif; ?>
