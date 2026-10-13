<?php
/**
 * Regressão: campo "Celular" (shim) na EDIÇÃO DE ENDEREÇO da conta.
 *
 * No modo "Permitir Telefone Celular e Fixo" com o bloco "Campo de Celular"
 * DESLIGADO, o plugin gera `billing_cellphone`/`shipping_cellphone` ESCONDIDO
 * (compatibilidade PagBank/Asaas/NFe). Originalmente esse campo NÃO era criado na
 * tela "Minha conta > editar endereço" (guard em maybe_add_cellphone_field), o que
 * fazia a meta `*_cellphone` do usuário divergir do telefone quando o cliente
 * editava o telefone ali.
 *
 * Correção:
 * - o campo hidden passa a ser criado no edit-address (só no modo shim);
 * - `save_edit_address_custom_fields` espelha telefone → `*_cellphone` (a prova de
 *   JS desligado), no mesmo formato `+DDInúmero` usado no checkout/perfil.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class EditAddressCellphoneShimTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    protected function tearDown(): void {
        global $wp;
        unset( $wp->query_vars['edit-address'] );
        unset( $_POST['billing_phone'], $_POST['billing_phone_country'], $_POST['shipping_phone'], $_POST['shipping_phone_country'] );
        parent::tearDown();
    }

    private function set_edit_address_endpoint(): void {
        global $wp;
        $wp->query_vars['edit-address'] = 'cobranca';
    }

    private function create_br_customer( string $phone, string $cellphone ): int {
        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_country', 'BR' );
        update_user_meta( $user_id, 'billing_phone', $phone );
        update_user_meta( $user_id, 'billing_cellphone', $cellphone );
        return $user_id;
    }

    // --- Criação do campo hidden no edit-address -----------------------------

    public function test_edit_address_adds_hidden_shim_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $this->set_edit_address_endpoint();

        $fields = $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );

        $this->assertArrayHasKey( 'billing_cellphone', $fields, 'No modo shim o campo hidden deve existir no edit-address.' );
        $this->assertSame( 'hidden', $fields['billing_cellphone']['type'] );
    }

    public function test_edit_address_shipping_also_gets_hidden_shim_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $this->set_edit_address_endpoint();

        $fields = $this->plugin()->add_cellphone_shipping_fields( array( 'shipping_phone' => array( 'type' => 'tel' ) ) );

        $this->assertArrayHasKey( 'shipping_cellphone', $fields );
        $this->assertSame( 'hidden', $fields['shipping_cellphone']['type'] );
    }

    public function test_edit_address_visible_mode_does_not_add_cellphone(): void {
        // Com o "Campo de Celular" LIGADO (campo visível) NÃO criamos campo no
        // edit-address (não introduzir um campo editável novo na conta).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $this->set_edit_address_endpoint();

        $fields = $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );

        $this->assertArrayNotHasKey( 'billing_cellphone', $fields );
    }

    public function test_checkout_still_adds_shim_cellphone(): void {
        // Fora do edit-address o comportamento do checkout não muda.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        global $wp;
        unset( $wp->query_vars['edit-address'] );

        $fields = $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );

        $this->assertArrayHasKey( 'billing_cellphone', $fields );
        $this->assertSame( 'hidden', $fields['billing_cellphone']['type'] );
    }

    // --- Espelho no salvamento ----------------------------------------------

    public function test_save_mirrors_billing_phone_into_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = $this->create_br_customer( '11999990000', '11988880000' );

        $_POST['billing_phone']         = '11912345678';
        $_POST['billing_phone_country'] = '+55';

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'billing' );

        $this->assertSame( '+5511912345678', get_user_meta( $user_id, 'billing_cellphone', true ) );
    }

    public function test_save_mirrors_shipping_phone_into_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'shipping_country', 'BR' );

        $_POST['shipping_phone']         = '21988887777';
        $_POST['shipping_phone_country'] = '+55';

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'shipping' );

        $this->assertSame( '+5521988887777', get_user_meta( $user_id, 'shipping_cellphone', true ) );
    }

    public function test_save_does_not_mirror_when_not_shim(): void {
        // "Somente Fixo": não há celular — a meta não deve ser criada/alterada.
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $user_id = $this->create_br_customer( '1133334444', '' );

        $_POST['billing_phone'] = '1133335555';

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'billing' );

        $this->assertSame( '', get_user_meta( $user_id, 'billing_cellphone', true ) );
    }
}
