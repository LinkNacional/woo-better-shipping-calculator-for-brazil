<?php
/**
 * Regressão: bloco "Informações adicionais" (order-received / ver pedido).
 *
 * Renderizado via hooks do WooCommerce (NÃO por override de template) para funcionar
 * em QUALQUER tema — inclusive checkout em blocos, cujo order-confirmation dispara
 * `woocommerce_thankyou` (bloco "additional information") e NÃO
 * `woocommerce_order_details_after_customer_details`.
 *   - `woocommerce_thankyou` → cobre o checkout em BLOCOS e o clássico;
 *   - `woocommerce_order_details_after_customer_details` → cobre o clássico;
 *   - idempotente (1x por pedido);
 *   - filtro `woo_better_customer_details_rows` para estender as linhas.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CustomerDetailsTemplateTest extends WP_UnitTestCase {

    private function plugin_instance(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    protected function tearDown(): void {
        remove_all_filters( 'woo_better_customer_details_rows' );
        parent::tearDown();
    }

    // --- Bloco "Informações adicionais" --------------------------------------

    private function renderAdditionalInfo( $orderOrId ): string {
        ob_start();
        $this->plugin_instance()->render_customer_additional_info( $orderOrId );
        return trim( ob_get_clean() );
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

    public function test_additional_info_hides_shim_cellphone_even_when_value_differs(): void {
        // "Celular e Fixo" + "Campo de Celular" DESLIGADO: o `_billing_cellphone` é só
        // o SHIM escondido (para pagbank/asaas). Não pode aparecer a linha "Celular"
        // no recibo, mesmo que o valor seja diferente do telefone.
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' ); // diferente

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'Celular/Telefone:', $html );
        $this->assertStringNotContainsString( 'Celular:', $html, 'No modo shim o celular oculto não deve aparecer no recibo.' );
        $this->assertStringNotContainsString( '+5583988888885', $html );
    }

    public function test_additional_info_shows_cellphone_when_field_enabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'Celular:', $html );
        $this->assertStringContainsString( '+5583988888885', $html );
    }

    // --- Novos contratos: hook do checkout em blocos, idempotência, filtro ----

    public function test_is_idempotent_per_order(): void {
        // Ambos os hooks podem disparar para o mesmo pedido — deve renderizar 1x.
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_id( 777001 ); // id fictício só para o guard de idempotência
        $order->set_billing_phone( '+5583988888882' );

        $first  = $this->renderAdditionalInfo( $order );
        $second = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'Informações adicionais', $first );
        $this->assertSame( '', $second, 'A segunda renderização do MESMO pedido deve ser suprimida (idempotência).' );
    }

    public function test_rows_can_be_extended_via_filter(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        add_filter( 'woo_better_customer_details_rows', function ( $rows ) {
            $rows[] = array( 'label' => 'RG', 'value' => '12.345.678-9' );
            return $rows;
        } );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'RG:', $html );
        $this->assertStringContainsString( '12.345.678-9', $html );
    }

    public function test_filter_can_remove_all_rows_and_hide_block(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        add_filter( 'woo_better_customer_details_rows', '__return_empty_array' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    public function test_nothing_rendered_when_order_details_disabled(): void {
        update_option( 'woo_better_calc_enable_order_details', 'no' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    /**
     * Verifica se um método desse plugin está registrado num hook (via wp_filter),
     * sem depender de `wc_get_order` (que não resolve no ambiente de testes).
     */
    private function hook_has_plugin_method( string $hook, string $method ): bool {
        if ( empty( $GLOBALS['wp_filter'][ $hook ] ) ) {
            return false;
        }

        foreach ( $GLOBALS['wp_filter'][ $hook ]->callbacks as $callbacks ) {
            foreach ( $callbacks as $cb ) {
                $fn = $cb['function'] ?? null;
                if ( is_array( $fn ) && isset( $fn[1] ) && $fn[1] === $method ) {
                    return true;
                }
            }
        }

        return false;
    }

    public function test_registered_on_block_and_classic_order_hooks(): void {
        // Regressão do bug "nada aconteceu": o checkout em BLOCOS dispara
        // `woocommerce_thankyou` (bloco order-confirmation-additional-information) e
        // NÃO `woocommerce_order_details_after_customer_details`. O bloco precisa
        // estar nos DOIS hooks para aparecer em qualquer tema.
        $this->assertTrue(
            $this->hook_has_plugin_method( 'woocommerce_thankyou', 'render_customer_additional_info' ),
            'O bloco deve estar em woocommerce_thankyou (checkout em blocos).'
        );
        $this->assertTrue(
            $this->hook_has_plugin_method( 'woocommerce_order_details_after_customer_details', 'render_customer_additional_info' ),
            'O bloco deve estar em woocommerce_order_details_after_customer_details (clássico).'
        );
    }
}
