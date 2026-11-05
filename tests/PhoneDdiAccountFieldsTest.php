<?php
/**
 * Campos de DDI no CADASTRO do cliente: perfil do wp-admin e edição de endereço da
 * conta.
 *
 * O cadastro guarda o telefone/celular SÓ COM O NÚMERO (o Bling reprova o `+55`
 * grudado), então o DDI — que existe para a exibição — ganha um campo próprio ACIMA
 * do telefone e do celular, em:
 *
 *   - `wp-admin/profile.php` / `user-edit.php` (`woocommerce_customer_meta_fields`);
 *   - `minha-conta/edit-address/cobranca/` e `/entrega/` (`woocommerce_*_fields` +
 *     `woocommerce_my_account_edit_address_field_value`).
 *
 * A meta canônica é `{tipo}_{telefone|celular}_country_code`; o celular cai no DDI do
 * telefone quando a dele está vazia (`user_ddi`).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class PhoneDdiAccountFieldsTest extends WP_UnitTestCase {

    public function set_up(): void {
        parent::set_up();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_cellphone_required', 'no' );
        // O perfil só é remontado quando ALGUM recurso de campo está ativo
        // (`profile_manages_fields`); o Número é o mais neutro para estes testes.
        update_option( 'woo_better_calc_number_required', 'yes' );
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function invoke_private( string $method, array $args = array() ) {
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, $method );
        $ref->setAccessible( true );

        return $ref->invokeArgs( $this->plugin(), $args );
    }

    private function profile_fields(): array {
        return $this->plugin()->add_customer_meta_fields(
            array(
                'billing'  => array( 'title' => 'Cobrança', 'fields' => array() ),
                'shipping' => array( 'title' => 'Entrega', 'fields' => array() ),
            )
        );
    }

    // --- Meta canônica do DDI ----------------------------------------------

    public function test_normalize_ddi_value(): void {
        $this->assertSame( '+55', WcBetterShippingCalculatorForBrazil::normalize_ddi_value( '55' ) );
        $this->assertSame( '+55', WcBetterShippingCalculatorForBrazil::normalize_ddi_value( '+55' ) );
        $this->assertSame( '+351', WcBetterShippingCalculatorForBrazil::normalize_ddi_value( ' +351 ' ) );
        $this->assertSame( '', WcBetterShippingCalculatorForBrazil::normalize_ddi_value( '' ) );
        $this->assertSame( '', WcBetterShippingCalculatorForBrazil::normalize_ddi_value( 'abc' ) );
    }

    public function test_user_ddi_defaults_to_brazil(): void {
        $user_id = self::factory()->user->create();

        $this->assertSame( '+55', WcBetterShippingCalculatorForBrazil::user_ddi( $user_id, 'billing' ) );
        $this->assertSame( '+55', WcBetterShippingCalculatorForBrazil::user_ddi( $user_id, 'billing', 'cellphone' ) );
    }

    public function test_cellphone_ddi_falls_back_to_the_phone_ddi(): void {
        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_phone_country_code', '+351' );

        $this->assertSame( '+351', WcBetterShippingCalculatorForBrazil::user_ddi( $user_id, 'billing', 'phone' ) );
        $this->assertSame( '+351', WcBetterShippingCalculatorForBrazil::user_ddi( $user_id, 'billing', 'cellphone' ) );

        update_user_meta( $user_id, 'billing_cellphone_country_code', '+1' );

        $this->assertSame( '+1', WcBetterShippingCalculatorForBrazil::user_ddi( $user_id, 'billing', 'cellphone' ) );
        $this->assertSame( '+351', WcBetterShippingCalculatorForBrazil::user_ddi( $user_id, 'billing', 'phone' ) );
    }

    public function test_save_user_ddi_normalizes_and_keeps_the_phone_default(): void {
        $user_id = self::factory()->user->create();

        $this->invoke_private( 'save_user_ddi', array( $user_id, 'billing', 'phone', ' 55 ' ) );
        $this->invoke_private( 'save_user_ddi', array( $user_id, 'shipping', 'phone', '' ) );
        $this->invoke_private( 'save_user_ddi', array( $user_id, 'billing', 'cellphone', '' ) );

        $this->assertSame( '+55', get_user_meta( $user_id, 'billing_phone_country_code', true ) );
        $this->assertSame( '+55', get_user_meta( $user_id, 'shipping_phone_country_code', true ), 'Telefone vazio recebe o default do Brasil.' );
        $this->assertSame( '', get_user_meta( $user_id, 'billing_cellphone_country_code', true ), 'Celular vazio fica vazio (herda o do telefone).' );
    }

    // --- Perfil (wp-admin) --------------------------------------------------

    public function test_profile_has_a_ddi_field_above_each_phone(): void {
        $fields = $this->profile_fields();
        $keys   = array_keys( $fields['billing']['fields'] );

        $phone_keys = array_values(
            array_filter(
                $keys,
                function ( $key ) {
                    return false !== strpos( $key, 'phone' );
                }
            )
        );

        $this->assertSame(
            array(
                'billing_phone_country_code',
                'billing_phone',
                'billing_cellphone_country_code',
                'billing_cellphone',
            ),
            $phone_keys,
            'Cada DDI fica LOGO ACIMA do seu telefone/celular.'
        );

        $this->assertSame( 'DDI (Celular/Telefone)', $fields['billing']['fields']['billing_phone_country_code']['label'] );
        $this->assertSame( 'DDI (Celular (secundário))', $fields['billing']['fields']['billing_cellphone_country_code']['label'] );

        // Entrega também (mesma ordem).
        $this->assertSame( 'DDI (Celular/Telefone)', $fields['shipping']['fields']['shipping_phone_country_code']['label'] );
        $this->assertArrayHasKey( 'shipping_cellphone_country_code', $fields['shipping']['fields'] );
    }

    public function test_profile_ddi_label_follows_the_phone_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = $this->profile_fields();

        $this->assertSame( 'DDI (Telefone)', $fields['billing']['fields']['billing_phone_country_code']['label'] );
        $this->assertArrayNotHasKey( 'billing_cellphone_country_code', $fields['billing']['fields'] );
        $this->assertArrayNotHasKey( 'billing_cellphone', $fields['billing']['fields'] );
    }

    public function test_profile_cellphone_only_uses_the_main_ddi_key(): void {
        // "Somente Celular": o celular é o principal → o DDI dele é o do bloco
        // principal (mesma chave do checkout/pedido).
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $fields = $this->profile_fields();
        $keys   = array_keys( $fields['billing']['fields'] );

        $this->assertArrayHasKey( 'billing_phone_country_code', $fields['billing']['fields'] );
        $this->assertSame( 'DDI (Celular)', $fields['billing']['fields']['billing_phone_country_code']['label'] );
        $this->assertArrayNotHasKey( 'billing_phone', $fields['billing']['fields'] );
        $this->assertLessThan(
            array_search( 'billing_cellphone', $keys, true ),
            array_search( 'billing_phone_country_code', $keys, true ),
            'No "Somente Celular" o DDI fica acima do celular.'
        );
    }

    public function test_profile_ddi_fields_are_not_created_when_phone_is_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled_native' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = $this->profile_fields();

        $this->assertArrayNotHasKey( 'billing_phone_country_code', $fields['billing']['fields'] );
        $this->assertArrayNotHasKey( 'billing_cellphone_country_code', $fields['billing']['fields'] );
    }

    public function test_profile_save_stores_the_ddi(): void {
        $user_id = self::factory()->user->create();

        $backup = $_POST;
        $_POST  = array(
            'billing_phone_country_code'     => '55',
            'billing_cellphone_country_code' => '',
        );

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        $this->assertSame( '+55', get_user_meta( $user_id, 'billing_phone_country_code', true ) );
        $this->assertSame( '', get_user_meta( $user_id, 'billing_cellphone_country_code', true ) );
    }

    public function test_profile_default_script_only_runs_on_the_profile_screens(): void {
        wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

        set_current_screen( 'dashboard' );
        ob_start();
        $this->plugin()->profile_ddi_default_script();
        $dashboard = (string) ob_get_clean();

        set_current_screen( 'profile' );
        ob_start();
        $this->plugin()->profile_ddi_default_script();
        $profile = (string) ob_get_clean();

        $this->assertSame( '', $dashboard, 'Fora do perfil o script não é impresso.' );
        $this->assertStringContainsString( 'billing_phone_country_code', $profile );
        $this->assertStringContainsString( '+55', $profile );
    }

    // --- Edição de endereço da conta (minha-conta) --------------------------

    public function test_edit_address_ddi_value_comes_from_the_account(): void {
        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );
        update_user_meta( $user_id, 'billing_phone_country_code', '+351' );

        $this->assertSame(
            '+351',
            $this->plugin()->edit_address_field_value( '', 'billing_phone_country', 'billing' )
        );
        // Sem DDI próprio, o celular herda o do telefone.
        $this->assertSame(
            '+351',
            $this->plugin()->edit_address_field_value( '', 'billing_cellphone_country', 'billing' )
        );
    }

    public function test_edit_address_phone_value_is_seeded_without_the_ddi(): void {
        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );

        $this->assertSame(
            '83988888881',
            $this->plugin()->edit_address_field_value( '+55 (83) 98888-8881', 'billing_phone', 'billing' ),
            'O campo reabre só com o número, como o cadastro guarda.'
        );
        $this->assertSame(
            '83988888881',
            $this->plugin()->edit_address_field_value( '+55 (83) 98888-8881', 'billing_cellphone', 'billing' )
        );
    }

    public function test_edit_address_value_filter_ignores_other_fields(): void {
        $this->assertSame(
            'Rua H',
            $this->plugin()->edit_address_field_value( 'Rua H', 'billing_address_1', 'billing' )
        );
        $this->assertNull( $this->plugin()->edit_address_field_value( null, 'billing_postcode', 'billing' ) );
    }

    public function test_edit_address_save_stores_the_ddi(): void {
        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_country', 'BR' );

        $backup = $_POST;
        $_POST  = array(
            'billing_phone'              => '(83) 98888-8881',
            'billing_phone_country'      => '55',
            'billing_cellphone_country'  => '+351',
        );

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'billing' );

        $_POST = $backup;

        $this->assertSame( '+55', get_user_meta( $user_id, 'billing_phone_country_code', true ) );
        $this->assertSame( '+351', get_user_meta( $user_id, 'billing_cellphone_country_code', true ) );
    }

    public function test_edit_address_ddi_is_not_saved_in_unmanaged_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_country', 'BR' );

        $backup = $_POST;
        $_POST  = array( 'billing_phone_country' => '351' );

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'billing' );

        $_POST = $backup;

        $this->assertSame( '', get_user_meta( $user_id, 'billing_phone_country_code', true ), 'No modo Desabilitar o telefone não é do plugin.' );
    }
}
