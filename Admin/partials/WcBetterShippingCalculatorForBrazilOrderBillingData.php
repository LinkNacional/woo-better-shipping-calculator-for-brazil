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

<div class="clear"></div>

<h3><?php esc_html_e( 'Dados do Cliente', 'woo-better-shipping-calculator-for-brazil' ); ?></h3>
<div class="woo-better-calc-address">
	<p>
		<?php if ( $person_type !== 'none' ) : ?>
			<?php if ( ( 'physical' === $billing_persontype && ( $person_type === 'both' || $person_type === 'physical' ) ) || $person_type === 'physical' ) : ?>
				<?php if ( ! empty( $billing_cpf ) ) : ?>
					<strong><?php esc_html_e( 'CPF', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong><?php echo esc_html( $billing_cpf ); ?><br />
				<?php endif; ?>
			<?php endif; ?>

			<?php if ( ( 'legal' === $billing_persontype && ( $person_type === 'both' || $person_type === 'legal' ) ) || $person_type === 'legal' ) : ?>
				<?php if ( ! empty( $order->get_billing_company() ) ) : ?>
					<strong><?php esc_html_e( 'Empresa', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong><?php echo esc_html( $order->get_billing_company() ); ?><br />
				<?php endif; ?>
				<?php if ( ! empty( $billing_cnpj ) ) : ?>
					<strong><?php esc_html_e( 'CNPJ', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong><?php echo esc_html( $billing_cnpj ); ?><br />
				<?php endif; ?>
			<?php endif; ?>

			<?php if ( $person_type === 'both' && ! empty( $billing_persontype ) ) : ?>
				<strong><?php esc_html_e( 'Tipo de Pessoa', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong>
				<?php 
				if ( 'physical' === $billing_persontype ) {
					esc_html_e( 'Pessoa Física', 'woo-better-shipping-calculator-for-brazil' );
				} elseif ( 'legal' === $billing_persontype ) {
					esc_html_e( 'Pessoa Jurídica', 'woo-better-shipping-calculator-for-brazil' );
				}
				?><br />
			<?php endif; ?>
		<?php else : ?>
			<?php if ( ! empty( $order->get_billing_company() ) ) : ?>
				<strong><?php esc_html_e( 'Empresa', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong><?php echo esc_html( $order->get_billing_company() ); ?><br />
			<?php endif; ?>
		<?php endif; ?>

		<?php if ( $phone_required === 'yes' && ! empty( $order->get_billing_phone() ) ) : ?>
			<strong><?php echo esc_html( $phone_label ); ?>: </strong>
			<?php 
			$phone = $order->get_billing_phone();
			echo '<a href="tel:' . esc_attr( $phone ) . '">' . esc_html( $phone ) . '</a>';
			?><br />
			<?php 
			$billing_phone_country_code = $order->get_meta('_billing_phone_country_code');
			// Só mostra código do país se o telefone começar com + e o meta existir
			if ( str_starts_with($phone, '+') && ! empty( $billing_phone_country_code ) ) : ?>
				<?php 
				$clean_country_code = trim($billing_phone_country_code);
				if (!str_starts_with($clean_country_code, '+')) {
					$clean_country_code = '+' . $clean_country_code;
				}
				?>
				<strong><?php esc_html_e( 'Código do país', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong><?php echo esc_html( $clean_country_code ); ?><br />
			<?php endif; ?>
		<?php endif; ?>

		<?php if ( ! empty( $order->get_billing_email() ) ) : ?>
			<strong><?php esc_html_e( 'Email', 'woo-better-shipping-calculator-for-brazil' ); ?>: </strong><?php echo wp_kses_post( make_clickable( $order->get_billing_email() ) ); ?><br />
		<?php endif; ?>
	</p>
</div>
<?php