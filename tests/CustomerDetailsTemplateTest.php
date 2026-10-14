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

    public function test_additional_info_renders_cellphone_and_configured_fields(): void {
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
        // Celular (exclusivo do plugin) + campos brasileiros.
        $this->assertStringContainsString( '+5583988888885', $html );
        $this->assertStringContainsString( '493.147.600-73', $html );
        // E-mail e telefone NÃO entram — o WooCommerce já os exibe (resumo/endereço).
        $this->assertStringNotContainsString( 'dev@example.local', $html );
        $this->assertStringNotContainsString( '+5583988888882', $html );
        // Sem bullets (<li>).
        $this->assertStringNotContainsString( '<li', $html );
    }

    public function test_additional_info_birthdate_is_last(): void {
        // A "Data de Nascimento" deve ficar por ÚLTIMO no bloco (após gênero e os
        // demais campos brasileiros).
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_persontype', '1' );
        $order->update_meta_data( '_billing_cpf', '493.147.600-73' );
        $order->update_meta_data( '_billing_birthdate', '1999-03-14' );

        $html = $this->renderAdditionalInfo( $order );

        $pos_cpf  = strpos( $html, 'CPF:' );
        $pos_birth = strpos( $html, 'Data de Nascimento:' );

        $this->assertNotFalse( $pos_cpf );
        $this->assertNotFalse( $pos_birth );
        $this->assertGreaterThan( $pos_cpf, $pos_birth, 'A Data de Nascimento deve vir depois do CPF (no fim).' );

        // É a ÚLTIMA linha (nenhuma outra linha antes do fechamento do bloco).
        $last_label_pos = strrpos( $html, '<strong>' );
        $this->assertStringContainsString( 'Data de Nascimento:', substr( $html, $last_label_pos, 60 ) );
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
        // Com o campo de Celular ligado, se o celular for o MESMO número do telefone
        // (que o WooCommerce já exibe), não repete no bloco.
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888885' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringNotContainsString( '+5583988888885', $html );
    }

    public function test_additional_info_does_not_render_phone_or_email(): void {
        // O WooCommerce já exibe e-mail (resumo) e telefone (endereço); nosso bloco
        // não deve repeti-los.
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $order = new \WC_Order();
        $order->set_billing_email( 'dev@example.local' );
        $order->set_billing_phone( '+5583988888882' );

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    public function test_additional_info_hides_cellphone_equal_to_phone_in_shim(): void {
        // "Celular e Fixo" + "Campo de Celular" DESLIGADO (shim): o `_billing_cellphone`
        // é o ESPELHO do telefone (mesmo número). O WC já mostra o telefone no bloco de
        // endereço, então não repetimos o número no nosso bloco.
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' ); // espelho

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    public function test_additional_info_cellphone_only_dedupes_old_both_order(): void {
        // "Somente Celular" com pedido antigo (telefone == celular): o WC já exibe o
        // telefone no endereço, então o nosso bloco NÃO repete o número.
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' );

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    public function test_additional_info_cellphone_only_shows_celular(): void {
        // "Somente Celular" com o telefone vazio (pedido novo): o bloco mostra o
        // celular rotulado "Celular".
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'Celular:', $html );
        $this->assertStringContainsString( '+5583988888882', $html );
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
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_id( 777001 ); // id fictício só para o guard de idempotência
        $order->update_meta_data( '_billing_persontype', '1' );
        $order->update_meta_data( '_billing_cpf', '493.147.600-73' );

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
