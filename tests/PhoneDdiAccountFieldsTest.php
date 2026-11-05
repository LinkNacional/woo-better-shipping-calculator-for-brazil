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

    /**
     * Shim ("Celular Oculto"): o celular só espelha o telefone, então ele não ganha
     * DDI próprio no perfil — ele herda o do telefone (`user_ddi`).
     */
    public function test_profile_hidden_cellphone_has_no_ddi_field(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $fields = $this->profile_fields();

        $this->assertArrayHasKey( 'billing_cellphone', $fields['billing']['fields'], 'O campo espelhado continua na tela.' );
        $this->assertArrayNotHasKey( 'billing_cellphone_country_code', $fields['billing']['fields'] );
        $this->assertArrayNotHasKey( 'shipping_cellphone_country_code', $fields['shipping']['fields'] );
        $this->assertArrayHasKey( 'billing_phone_country_code', $fields['billing']['fields'] );
    }

    public function test_profile_hidden_cellphone_ddi_follows_the_phone(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_cellphone_country_code', '+351' );

        $backup = $_POST;
        $_POST  = array(
            'billing_phone'              => '(83) 98888-8881',
            'billing_phone_country_code' => '+55',
        );

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        $this->assertSame( '+55', get_user_meta( $user_id, 'billing_cellphone_country_code', true ) );
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

    // --- "Carregar endereço" no admin do pedido (AJAX) ---------------------

    /**
     * O `meta-boxes-order.js` preenche `#_<tipo>_<chave>` para CADA chave devolvida
     * em `billing`/`shipping`. Sem `phone_country_code`/`cellphone_country_code` o
     * botão "Carregar endereço" trazia o endereço todo e deixava o DDI de fora.
     */
    public function test_ajax_customer_details_includes_the_ddi_fields(): void {
        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_phone_country_code', '+55' );
        update_user_meta( $user_id, 'billing_cellphone_country_code', '+351' );

        $customer = new \WC_Customer( $user_id );
        $customer->set_billing_phone( '83988888881' );
        $customer->update_meta_data( 'billing_cellphone', '83988888882' );

        $data = array(
            'billing'  => array( 'phone' => '83988888881' ),
            'shipping' => array( 'phone' => '83988888881' ),
        );

        $out = $this->plugin()->add_phone_fields_to_customer_details( $data, $customer, $user_id );

        $this->assertSame( '+55', $out['billing']['phone_country_code'] );
        $this->assertSame( '+351', $out['billing']['cellphone_country_code'] );
        $this->assertSame( '83988888882', $out['billing']['cellphone'] );
        // O entrega acompanha (o JS usa `data.shipping`).
        $this->assertArrayHasKey( 'phone_country_code', $out['shipping'] );
        $this->assertArrayHasKey( 'cellphone_country_code', $out['shipping'] );
    }

    public function test_ajax_customer_details_defaults_the_ddi_to_brazil(): void {
        $user_id = self::factory()->user->create();
        $customer = new \WC_Customer( $user_id );

        $out = $this->plugin()->add_phone_fields_to_customer_details( array(), $customer, $user_id );

        $this->assertSame( '+55', $out['billing']['phone_country_code'], 'Sem DDI salvo, o campo do admin abre com +55.' );
        $this->assertSame( '+55', $out['billing']['cellphone_country_code'] );
        $this->assertSame( '+55', $out['shipping']['phone_country_code'] );
    }

    public function test_ajax_customer_details_sends_national_numbers_only(): void {
        $user_id = self::factory()->user->create();
        $customer = new \WC_Customer( $user_id );
        $customer->update_meta_data( 'billing_cellphone', '+55 (83) 98888-8882' );

        $data = array(
            'billing'  => array( 'phone' => '+55 (83) 98888-8881' ),
            'shipping' => array( 'phone' => '5583988888883' ),
        );

        $out = $this->plugin()->add_phone_fields_to_customer_details( $data, $customer, $user_id );

        // O campo do admin exibe só o número (o DDI tem campo próprio).
        $this->assertSame( '83988888881', $out['billing']['phone'] );
        $this->assertSame( '83988888883', $out['shipping']['phone'] );
        $this->assertSame( '83988888882', $out['billing']['cellphone'] );
    }

    public function test_ajax_customer_details_without_cellphone_field(): void {
        // "Somente Fixo" sem o "Campo de Celular": não há celular para preencher,
        // mas o DDI do telefone continua indo.
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $user_id = self::factory()->user->create();
        $customer = new \WC_Customer( $user_id );

        $out = $this->plugin()->add_phone_fields_to_customer_details(
            array( 'billing' => array( 'phone' => '8332323232' ) ),
            $customer,
            $user_id
        );

        $this->assertSame( '+55', $out['billing']['phone_country_code'], 'O DDI do telefone continua indo.' );
        $this->assertArrayNotHasKey( 'cellphone', $out['billing'] );
        $this->assertArrayNotHasKey( 'cellphone_country_code', $out['billing'] );
    }

    public function test_ajax_customer_details_does_nothing_in_unmanaged_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $user_id = self::factory()->user->create();
        $customer = new \WC_Customer( $user_id );

        $out = $this->plugin()->add_phone_fields_to_customer_details(
            array( 'billing' => array( 'phone' => '+55 83 98888-8881' ) ),
            $customer,
            $user_id
        );

        $this->assertSame( '+55 83 98888-8881', $out['billing']['phone'], 'No modo Desabilitar o valor do WooCommerce fica intacto.' );
        $this->assertArrayNotHasKey( 'phone_country_code', $out['billing'] );
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

    private function edit_address_billing_fields(): array {
        return $this->plugin()->add_edit_address_billing_fields(
            array( 'billing_country' => array( 'value' => 'BR' ) )
        );
    }

    /**
     * Com a lib (máscara + DDI) a bandeira e o código do país ficam DENTRO do campo de
     * telefone: o campo de DDI próprio fica `hidden` (a lib grava o valor no input de
     * mesmo nome), para não pedir o mesmo dado duas vezes.
     */
    public function test_edit_address_phone_ddi_is_hidden_with_the_lib(): void {
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->edit_address_billing_fields();

        $this->assertSame( 'hidden', $fields['billing_phone_country']['type'] );
        $this->assertContains(
            WcBetterShippingCalculatorForBrazil::HIDDEN_FIELD_CLASS,
            (array) $fields['billing_phone_country']['class'],
            'O wrapper do campo oculto precisa perder o espaçamento.'
        );
        $this->assertFalse(
            (bool) $fields['billing_phone_country']['required'],
            'Campo oculto não pode ser obrigatório: o cliente não teria como corrigi-lo.'
        );
        $this->assertSame(
            '',
            $fields['billing_phone_country']['label'],
            'O `woocommerce_form_field` imprime o <label> até em type=hidden: sem label, nada aparece.'
        );
        // O valor continua sendo o do cadastro (o JS da lib sobrescreve ao trocar o país).
        $this->assertSame( '+55', $fields['billing_phone_country']['value'] );
    }

    /**
     * O celular SECUNDÁRIO é um campo "limpo" (sem lib), então o DDI dele continua
     * visível e obrigatório mesmo com a lib ativa no telefone.
     */
    public function test_edit_address_cellphone_ddi_stays_visible_with_the_lib(): void {
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->edit_address_billing_fields();

        $this->assertSame( 'text', $fields['billing_cellphone_country']['type'] );
        $this->assertTrue( (bool) $fields['billing_cellphone_country']['required'] );
        $this->assertArrayNotHasKey( 'input_class', $fields['billing_cellphone_country'] );
    }

    public function test_edit_address_phone_ddi_is_visible_without_the_lib(): void {
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->edit_address_billing_fields();

        $this->assertSame( 'text', $fields['billing_phone_country']['type'] );
        $this->assertTrue( (bool) $fields['billing_phone_country']['required'] );
    }

    /**
     * "Somente Celular": o celular É o campo principal e é ele que recebe a lib, então
     * o DDI dele usa (e oculta) a chave do bloco principal (`*_phone_country`).
     */
    public function test_edit_address_cellphone_only_hides_the_main_ddi_with_the_lib(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $fields = $this->edit_address_billing_fields();

        $this->assertArrayNotHasKey( 'billing_phone', $fields );
        $this->assertArrayHasKey( 'billing_cellphone', $fields );
        $this->assertSame( 'hidden', $fields['billing_phone_country']['type'], 'O DDI do bloco principal segue a lib.' );
        $this->assertArrayNotHasKey( 'billing_cellphone_country', $fields, 'Não existe um segundo DDI no "Somente Celular".' );
    }

    /**
     * Shim ("Celular e Fixo" + "Campo de Celular" desligado): o celular é OCULTO e
     * espelha o telefone, então ele não ganha campo (nem DDI) próprio — o DDI dele
     * acompanha o do telefone no save.
     */
    public function test_edit_address_hidden_cellphone_has_no_ddi_field(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $fields = $this->edit_address_billing_fields();

        $this->assertArrayNotHasKey( 'billing_cellphone', $fields );
        $this->assertArrayNotHasKey( 'billing_cellphone_country', $fields );
        $this->assertArrayHasKey( 'billing_phone_country', $fields, 'O DDI do telefone continua.' );
    }

    public function test_edit_address_hidden_cellphone_ddi_follows_the_phone(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_country', 'BR' );
        // DDI antigo gravado no celular (de uma configuração anterior): precisa ser
        // sobrescrito pelo do telefone, para não divergir do número espelhado.
        update_user_meta( $user_id, 'billing_cellphone_country_code', '+351' );

        $backup = $_POST;
        $_POST  = array(
            'billing_phone'         => '(83) 98888-8881',
            'billing_phone_country' => '+55',
        );

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'billing' );

        $_POST = $backup;

        $this->assertSame( '83988888881', get_user_meta( $user_id, 'billing_cellphone', true ), 'O celular espelha o telefone.' );
        $this->assertSame( '+55', get_user_meta( $user_id, 'billing_cellphone_country_code', true ), 'E o DDI dele acompanha o do telefone.' );
    }

    public function test_edit_address_has_no_ddi_fields_when_phone_is_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled_native' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->edit_address_billing_fields();

        $this->assertArrayNotHasKey( 'billing_phone_country', $fields );
        $this->assertArrayNotHasKey( 'billing_cellphone_country', $fields );
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
