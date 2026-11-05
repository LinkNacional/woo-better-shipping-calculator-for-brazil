<?php
/**
 * Regressão: o telefone/celular do pedido é GRAVADO SEM O DDI.
 *
 * Cenário do chamado: o pedido guardava `+5583988888881` (DDI + número) e o Bling
 * reprova esse formato. A regra passou a ser:
 *
 *   - GRAVAÇÃO (pedido, cadastro, sessão, metadados): só os dígitos. O DDI que o
 *     cliente tenha digitado (`+55…` ou `55…`) é removido do INÍCIO — e só quando o
 *     que sobra ainda é um número plausível, para não comer o DDD 55 (RS);
 *   - EXIBIÇÃO (recibo, "Meus pedidos", bloco "Dados do Cliente" do admin): o DDI
 *     volta, recomposto de `_<tipo>_phone_country_code`;
 *   - ADMIN do pedido: o número aparece SEM o DDI e o DDI ganha um campo próprio,
 *     logo ACIMA do telefone/celular, com a label do campo que ele acompanha.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class PhoneDdiStorageTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function invoke_private( string $method, array $args ) {
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, $method );
        $ref->setAccessible( true );

        return $ref->invokeArgs( $this->plugin(), $args );
    }

    /** Máscara BR (sem a lib): o DDI é sempre o do Brasil. */
    private function use_brazil_mask(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );
    }

    // --- `strip_phone_ddi()` ------------------------------------------------

    /**
     * @dataProvider ddi_cases
     */
    public function test_strip_phone_ddi( string $input, string $ddi, string $expected, string $message ): void {
        $this->assertSame( $expected, $this->invoke_private( 'strip_phone_ddi', array( $input, $ddi ) ), $message );
    }

    public function ddi_cases(): array {
        return array(
            'DDI digitado com "+"'            => array( '+5583988888881', '+55', '83988888881', 'O +55 do início sai.' ),
            'DDI digitado sem "+"'            => array( '5583988888881', '+55', '83988888881', 'O 55 do início também sai.' ),
            'número nacional'                 => array( '83988888881', '+55', '83988888881', 'Sem DDI, nada muda.' ),
            'com máscara'                     => array( '(83) 98888-8881', '+55', '83988888881', 'A máscara cai junto.' ),
            'DDD 55 (RS) não é DDI'           => array( '55988888888', '+55', '55988888888', '11 dígitos = DDD 55 + número, então o 55 fica.' ),
            'fixo com DDD 55 (RS)'            => array( '5532323232', '+55', '5532323232', '10 dígitos também é nacional.' ),
            'DDI estrangeiro'                 => array( '+351912345678', '+351', '912345678', 'O DDI do pedido é o que sai.' ),
            'DDI estrangeiro com DDI do BR'   => array( '+351912345678', '+55', '351912345678', 'Não casa o DDI: só os dígitos, intactos.' ),
            'DDI estrangeiro sem "+"'         => array( '351912345678', '+351', '351912345678', 'Sem o "+" não há como distinguir o DDI do DDD: não corta.' ),
            'vazio'                           => array( '', '+55', '', 'Vazio continua vazio.' ),
            'só o DDI'                        => array( '+55', '+55', '55', 'Sem número nacional não há o que cortar.' ),
        );
    }

    public function test_strip_phone_ddi_defaults_to_brazil_without_a_country_code(): void {
        $this->assertSame( '83988888881', $this->invoke_private( 'strip_phone_ddi', array( '+5583988888881', '' ) ) );
    }

    // --- Gravação no pedido -------------------------------------------------

    public function test_order_phone_and_cellphone_are_stored_without_the_ddi(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->set_billing_phone( '(83) 98888-8881' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' );

        $this->invoke_private( 'normalize_order_phone', array( $order, 'billing', '+55' ) );

        $this->assertSame( '83988888881', $order->get_billing_phone() );
        $this->assertSame( '83988888882', $order->get_meta( '_billing_cellphone' ) );
    }

    /**
     * O admin do pedido grava o telefone NATIVO cru: se o lojista digitar o DDI ali,
     * o save do pedido tem de limpar de novo (senão o Bling volta a reprovar).
     */
    public function test_order_save_strips_a_ddi_typed_in_the_admin(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->set_billing_phone( '+55 83 98888-8881' );
        $order->update_meta_data( '_billing_cellphone', '+55 83 98888-8882' );
        $order->update_meta_data( '_billing_phone_country_code', '+55' );

        $this->plugin()->normalize_order_phone_on_save( $order );

        $this->assertSame( '83988888881', $order->get_billing_phone( 'edit' ) );
        $this->assertSame( '83988888882', $order->get_meta( '_billing_cellphone' ) );
    }

    public function test_order_save_does_not_touch_unmanaged_phone(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+55 83 98888-8881' );

        $this->plugin()->normalize_order_phone_on_save( $order );

        $this->assertSame( '+55 83 98888-8881', $order->get_billing_phone( 'edit' ) );
    }

    // --- Exibição -----------------------------------------------------------

    public function test_order_phone_getter_is_national_outside_the_customer_view(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888881' );
        $order->update_meta_data( '_billing_phone_country_code', '+55' );

        $this->assertSame(
            '83988888881',
            $this->plugin()->format_order_billing_phone( $order->get_billing_phone( 'edit' ), $order ),
            'Fora da tela do cliente (API/REST/admin/exportação) o número sai puro.'
        );
    }

    public function test_order_phone_getter_has_the_ddi_on_the_receipt(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888881' );
        $order->update_meta_data( '_billing_phone_country_code', '+55' );
        $order->update_meta_data( '_shipping_phone_country_code', '+55' );

        add_filter( 'woocommerce_is_order_received_page', '__return_true' );

        $phone    = $this->plugin()->format_order_billing_phone( '83988888881', $order );
        $shipping = $this->plugin()->format_order_shipping_phone( '83988888881', $order );

        remove_filter( 'woocommerce_is_order_received_page', '__return_true' );

        $this->assertSame( '+5583988888881', $phone, 'No recibo o cliente vê o DDI.' );
        $this->assertSame( '+5583988888881', $shipping );
    }

    public function test_legacy_e164_value_is_not_doubled_on_the_receipt(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_phone_country_code', '+55' );

        add_filter( 'woocommerce_is_order_received_page', '__return_true' );
        $phone = $this->plugin()->format_order_billing_phone( '+5583988888881', $order );
        remove_filter( 'woocommerce_is_order_received_page', '__return_true' );

        $this->assertSame( '+5583988888881', $phone );
    }

    // --- DDI do celular -----------------------------------------------------

    public function test_cellphone_ddi_falls_back_to_the_phone_ddi(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_phone_country_code', '+55' );

        $this->assertSame( '+55', $this->invoke_private( 'order_ddi', array( $order, 'billing', 'phone' ) ) );
        $this->assertSame( '+55', $this->invoke_private( 'order_ddi', array( $order, 'billing', 'cellphone' ) ) );
    }

    public function test_cellphone_has_its_own_ddi_field(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_phone_country_code', '+55' );
        $order->update_meta_data( '_billing_cellphone_country_code', '+351' );

        $this->assertSame( '+351', $this->invoke_private( 'order_ddi', array( $order, 'billing', 'cellphone' ) ) );
        $this->assertSame( '+55', $this->invoke_private( 'order_ddi', array( $order, 'billing', 'phone' ) ) );
    }

    // --- Admin do pedido: campos de DDI ------------------------------------

    public function test_admin_has_a_ddi_field_above_each_phone(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888881' );
        $order->update_meta_data( '_billing_cellphone', '83988888882' );
        $order->update_meta_data( '_billing_phone_country_code', '+55' );

        $fields = $this->plugin()->ensure_admin_phone_fields_billing( array(), $order );

        $keys = array_keys( $fields );

        $this->assertSame(
            array( 'phone_country_code', 'phone', 'cellphone_country_code', 'cellphone' ),
            $keys,
            'Cada DDI fica LOGO ACIMA do seu campo.'
        );

        $this->assertSame( 'DDI (Celular/Telefone)', $fields['phone_country_code']['label'] );
        $this->assertSame( 'DDI (Celular (secundário))', $fields['cellphone_country_code']['label'] );

        // Só o número nos campos de telefone; o DDI no campo dele.
        $this->assertSame( '83988888881', $fields['phone']['value'] );
        $this->assertSame( '83988888882', $fields['cellphone']['value'] );
        $this->assertSame( '+55', $fields['phone_country_code']['value'] );
        $this->assertSame( '+55', $fields['cellphone_country_code']['value'], 'Sem DDI próprio, o celular herda o do telefone.' );
    }

    public function test_admin_ddi_label_follows_the_phone_mode(): void {
        $this->use_brazil_mask();
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = $this->plugin()->ensure_admin_phone_fields_shipping( array(), new \WC_Order() );

        $this->assertSame( 'DDI (Telefone)', $fields['phone_country_code']['label'] );
        $this->assertArrayNotHasKey( 'cellphone_country_code', $fields, 'Sem campo de celular, sem DDI de celular.' );
        $this->assertArrayNotHasKey( 'cellphone', $fields );
    }

    public function test_admin_cellphone_ddi_needs_the_cellphone_field(): void {
        // "Celular e Fixo" com o "Campo de Celular" desligado e SEM o "Celular
        // Oculto": o plugin nem grava `*_cellphone` → não há DDI para ele.
        $this->use_brazil_mask();
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );

        $fields = $this->plugin()->ensure_admin_phone_fields_billing( array(), new \WC_Order() );

        $this->assertArrayHasKey( 'phone_country_code', $fields );
        $this->assertArrayNotHasKey( 'cellphone_country_code', $fields );
        $this->assertArrayNotHasKey( 'cellphone', $fields );
    }

    public function test_admin_hidden_shim_cellphone_has_no_ddi_field(): void {
        // No shim o Celular é o ESPELHO do telefone: o DDI é o do telefone (o save do
        // pedido sincroniza a meta), então ele não ganha um campo de DDI próprio.
        $this->use_brazil_mask();
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $fields = $this->plugin()->ensure_admin_phone_fields_billing( array(), new \WC_Order() );

        $this->assertSame( array( 'phone_country_code', 'phone', 'cellphone' ), array_keys( $fields ) );
    }

    /**
     * O save do PEDIDO é o ponto comum de todos os caminhos (checkout clássico,
     * blocos, admin, API/HPOS): no shim, o DDI do celular acompanha o do telefone.
     * Sem isso a meta dele guardaria um DDI antigo — `order_ddi` só cai no telefone
     * quando ela está VAZIA.
     */
    public function test_order_save_syncs_the_hidden_cellphone_ddi(): void {
        $this->use_brazil_mask();
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888881' );
        $order->update_meta_data( '_billing_phone_country_code', '+351' );
        $order->update_meta_data( '_billing_cellphone', '83988888881' );
        $order->update_meta_data( '_billing_cellphone_country_code', '+55' );

        $this->plugin()->normalize_order_phone_on_save( $order );

        $this->assertSame( '+351', $order->get_meta( '_billing_cellphone_country_code' ), 'O DDI do espelho segue o do telefone.' );
    }

    public function test_order_save_keeps_the_visible_cellphone_ddi(): void {
        // Com o "Campo de Celular" LIGADO o celular é um campo próprio: o DDI dele é
        // dele (não é sobrescrito pelo do telefone).
        $this->use_brazil_mask();
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );

        $order = new \WC_Order();
        $order->set_billing_phone( '8332323232' );
        $order->update_meta_data( '_billing_phone_country_code', '+55' );
        $order->update_meta_data( '_billing_cellphone', '83988888881' );
        $order->update_meta_data( '_billing_cellphone_country_code', '+351' );

        $this->plugin()->normalize_order_phone_on_save( $order );

        $this->assertSame( '+351', $order->get_meta( '_billing_cellphone_country_code' ) );
    }

    public function test_admin_shows_legacy_e164_without_duplicating_the_ddi(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888881' );            // pedido antigo
        $order->update_meta_data( '_billing_phone_country_code', '+55' );

        $fields = $this->plugin()->ensure_admin_phone_fields_billing( array(), $order );

        $this->assertSame( '83988888881', $fields['phone']['value'] );
        $this->assertSame( '+55', $fields['phone_country_code']['value'] );
    }

    public function test_admin_ddi_field_is_normalized_on_save(): void {
        $this->use_brazil_mask();

        $order = new \WC_Order();
        $this->plugin()->save_admin_ddi_field( '_billing_phone_country_code', ' 55 ', $order );
        $this->plugin()->save_admin_ddi_field( '_shipping_phone_country_code', '', $order );

        $this->assertSame( '+55', $order->get_meta( '_billing_phone_country_code' ) );
        $this->assertSame( '', $order->get_meta( '_shipping_phone_country_code' ) );
    }

    public function test_admin_fields_do_not_break_without_an_order(): void {
        // O WooCommerce chama o filtro sem pedido (ex.: montagem estática da tela).
        $this->use_brazil_mask();

        $fields = $this->plugin()->ensure_admin_phone_fields_billing( array(), false );

        $this->assertArrayHasKey( 'phone_country_code', $fields );
        $this->assertArrayNotHasKey( 'value', $fields['phone'], 'Sem pedido, o WC resolve o valor.' );
    }
}
