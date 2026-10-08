<?php
/**
 * Order Customer Details (override do woo-better).
 *
 * Base do template do WooCommerce `order/order-details-customer.php`
 * (@version 8.7.0), com o endereço exibido no formato "Chave: valor" (Nome, Endereço,
 * Bairro, Cidade, Estado, CEP…), sem `<address>` formatado e sem bullets. O e-mail e
 * os números (telefone/celular) ficam no bloco "Informações adicionais", renderizado
 * logo abaixo pelo plugin.
 *
 * Só é usado quando o TEMA não sobrescreve este template (ver
 * WcBetterShippingCalculatorForBrazil::locate_order_details_customer_template()).
 *
 * @package WooCommerce\Templates
 */

defined( 'ABSPATH' ) || exit;

$show_shipping = ! wc_ship_to_billing_address_only() && $order->needs_shipping_address();
$rows_callback = array( '\Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil', 'address_display_rows' );
?>
<section class="woocommerce-customer-details">

	<style>
		/* Aproxima as linhas "Chave: valor" (o tema dá margens grandes aos <p>). */
		.woocommerce-customer-details .woo-better-address,
		.woocommerce-customer-details .woo-better-additional-info__list {
			margin: 0;
		}
		.woocommerce-customer-details .woo-better-address__row,
		.woocommerce-customer-details .woo-better-additional-info__item {
			margin: 0 0 2px;
			line-height: 1.4;
		}
		.woocommerce-customer-details .woo-better-address__row:last-child,
		.woocommerce-customer-details .woo-better-additional-info__item:last-child {
			margin-bottom: 0;
		}
		.woocommerce-customer-details .woocommerce-column__title {
			margin-bottom: .4em;
		}
		.woocommerce-customer-details .woo-better-additional-info {
			margin-top: 1em;
		}
	</style>

	<?php if ( $show_shipping ) : ?>

	<section class="woocommerce-columns woocommerce-columns--2 woocommerce-columns--addresses col2-set addresses">
		<div class="woocommerce-column woocommerce-column--1 woocommerce-column--billing-address col-1">

	<?php endif; ?>

	<h2 class="woocommerce-column__title"><?php esc_html_e( 'Billing address', 'woocommerce' ); ?></h2>

	<div class="woo-better-address">
		<?php foreach ( call_user_func( $rows_callback, $order, 'billing' ) as $label => $value ) : ?>
			<p class="woo-better-address__row"><strong><?php echo esc_html( $label ); ?>:</strong> <?php echo esc_html( $value ); ?></p>
		<?php endforeach; ?>
		<?php
			/**
			 * Action hook fired after an address in the order customer details.
			 *
			 * @since 8.7.0
			 * @param string $address_type Type of address (billing or shipping).
			 * @param WC_Order $order Order object.
			 */
			do_action( 'woocommerce_order_details_after_customer_address', 'billing', $order );
		?>
	</div>

	<?php if ( $show_shipping ) : ?>

		</div><!-- /.col-1 -->

		<div class="woocommerce-column woocommerce-column--2 woocommerce-column--shipping-address col-2">
			<h2 class="woocommerce-column__title"><?php esc_html_e( 'Shipping address', 'woocommerce' ); ?></h2>
			<div class="woo-better-address">
				<?php foreach ( call_user_func( $rows_callback, $order, 'shipping' ) as $label => $value ) : ?>
					<p class="woo-better-address__row"><strong><?php echo esc_html( $label ); ?>:</strong> <?php echo esc_html( $value ); ?></p>
				<?php endforeach; ?>
				<?php
					/**
					 * Action hook fired after an address in the order customer details.
					 *
					 * @since 8.7.0
					 * @param string $address_type Type of address (billing or shipping).
					 * @param WC_Order $order Order object.
					 */
					do_action( 'woocommerce_order_details_after_customer_address', 'shipping', $order );
				?>
			</div>
		</div><!-- /.col-2 -->

	</section><!-- /.col2-set -->

	<?php endif; ?>

	<?php do_action( 'woocommerce_order_details_after_customer_details', $order ); ?>

</section>
