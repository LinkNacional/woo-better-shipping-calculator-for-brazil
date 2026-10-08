<?php
/**
 * Regressão: template "Detalhes do cliente" (order-received / ver pedido).
 *
 * O woo-better sobrescreve `order/order-details-customer.php` (respeitando override
 * do tema): o endereço vira "Chave: valor" (sem `<address>` e sem bullets) e o
 * contato (e-mail/telefone/celular) + campos brasileiros vão para o bloco
 * "Informações adicionais".
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CustomerDetailsTemplateTest extends WP_UnitTestCase {

    public function test_locates_plugin_template_for_customer_details(): void {
        $result = (new WcBetterShippingCalculatorForBrazil())
            ->locate_order_details_customer_template( 'wc-core', 'order/order-details-customer.php', 'woocommerce/' );

        $this->assertStringContainsString( 'templates/order/order-details-customer.php', $result );
    }

    public function test_passes_through_other_templates(): void {
        $result = (new WcBetterShippingCalculatorForBrazil())
            ->locate_order_details_customer_template( 'wc-core', 'order/order-details.php', 'woocommerce/' );

        $this->assertSame( 'wc-core', $result );
    }

    private function renderTemplate( \WC_Order $order ): string {
        if ( ! WC()->countries ) {
            WC()->countries = new \WC_Countries();
        }
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        $template = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR . 'templates/order/order-details-customer.php';
        $this->assertFileExists( $template );

        ob_start();
        include $template;
        return ob_get_clean();
    }

    public function test_template_renders_address_as_key_value(): void {
        $order = new \WC_Order();
        $order->set_billing_first_name( 'João' );
        $order->set_billing_last_name( 'Silva' );
        $order->set_billing_address_1( 'Rua H' );
        $order->set_billing_city( 'Feira de Santana' );
        $order->set_billing_postcode( '44053-762' );
        $order->update_meta_data( '_billing_number', '123' );

        $html = $this->renderTemplate( $order );

        // Sem <address> formatado e sem o antigo bloco "Contato" no topo.
        $this->assertStringNotContainsString( '<address>', $html );
        $this->assertStringNotContainsString( 'woo-better-customer-details__contact', $html );
        // Endereço em "Chave: valor".
        $this->assertStringContainsString( '<strong>Endereço:</strong> Rua H', $html );
        $this->assertStringContainsString( '<strong>Número:</strong> 123', $html );
        $this->assertStringContainsString( '<strong>CEP:</strong> 44053-762', $html );
        $this->assertStringContainsString( 'woo-better-address__row', $html );
    }

    // --- Bloco "Informações adicionais" --------------------------------------

    private function renderAdditionalInfo( \WC_Order $order ): string {
        ob_start();
        $this->plugin_instance()->render_customer_additional_info( $order );
        return trim( ob_get_clean() );
    }

    private function plugin_instance(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    public function test_additional_info_renders_contact_and_configured_fields(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_email( 'dev@example.local' );
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );
        $order->update_meta_data( '_billing_persontype', '1' );
        $order->update_meta_data( '_billing_cpf', '493.147.600-73' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'Informações adicionais', $html );
        // Contato (e-mail/telefone/celular) OU campos brasileiros — todos aqui.
        $this->assertStringContainsString( 'dev@example.local', $html );
        $this->assertStringContainsString( '+5583988888882', $html );
        $this->assertStringContainsString( '+5583988888885', $html );
        $this->assertStringContainsString( '493.147.600-73', $html );
        // Sem bullets (<li>).
        $this->assertStringNotContainsString( '<li', $html );
    }

    public function test_additional_info_is_empty_when_nothing_to_show(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'no' );
        update_option( 'woo_better_calc_enable_gender_field', 'no' );

        // Sem e-mail, telefone e sem campos brasileiros.
        $order = new \WC_Order();

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    public function test_additional_info_dedupes_cellphone_equal_to_phone(): void {
        // "Somente Celular"/espelho: celular == telefone — não repete a linha.
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $order = new \WC_Order();
        $order->set_billing_email( 'dev@example.local' );
        $order->set_billing_phone( '+5583988888885' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( '+5583988888885', $html );
        // Aparece uma única vez (Telefone), sem a linha duplicada de Celular.
        $this->assertSame( 1, substr_count( $html, '+5583988888885' ) );
    }

    public function test_additional_info_phone_label_follows_mode(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $this->assertStringContainsString( 'Celular/Telefone:', $this->renderAdditionalInfo( $order ) );

        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $this->assertStringContainsString( 'Telefone:', $this->renderAdditionalInfo( $order ) );
    }
}
