<?php
/**
 * Regressão: select "Campos de Telefone" (woo_better_calc_phone_mode, 4 modos) e o
 * bloco "Campo de Celular" (woo_better_calc_enable_cellphone_field + _cellphone_required).
 *
 * Modos:
 * - disabled            → nenhum campo de telefone.
 * - phone_and_cellphone → telefone nativo (fixo) + celular opcional (PADRÃO).
 * - cellphone_only      → só um campo "Celular" (nativo oculto no clássico).
 * - landline_only       → só o telefone nativo (fixo).
 *
 * O campo "Celular" é criado no modo "Somente Celular" (é o principal) OU quando
 * a opção "Campo de Celular" está habilitada (nos demais modos).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class PhoneModeTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function billing_fields_with_cellphone(): array {
        return $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );
    }

    // --- Modo padrão ---------------------------------------------------------

    public function test_default_mode_is_phone_and_cellphone(): void {
        delete_option( 'woo_better_calc_phone_mode' );
        $this->assertSame( 'phone_and_cellphone', $this->plugin()->get_phone_mode() );
    }

    public function test_invalid_mode_falls_back_to_default(): void {
        update_option( 'woo_better_calc_phone_mode', 'banana' );
        $this->assertSame( 'phone_and_cellphone', $this->plugin()->get_phone_mode() );
    }

    // --- Campo de celular ----------------------------------------------------

    public function test_creates_cellphone_when_enable_option_on(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertArrayHasKey( 'billing_cellphone', $fields );
        $this->assertSame( 'tel', $fields['billing_cellphone']['type'] );
    }

    public function test_cellphone_always_created_in_cellphone_only_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertArrayHasKey( 'billing_cellphone', $fields );
        $this->assertSame( 'tel', $fields['billing_cellphone']['type'] );
    }

    public function test_no_cellphone_in_landline_only_without_enable(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $this->assertArrayNotHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    public function test_cellphone_created_in_landline_only_with_enable(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $this->assertArrayHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    public function test_no_cellphone_in_disabled_without_enable(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $this->assertArrayNotHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    // --- Label conforme o modo ----------------------------------------------

    public function test_phone_field_label_follows_mode(): void {
        $plugin = $this->plugin();

        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $this->assertSame( 'Telefone', $plugin->get_phone_field_label() );

        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $this->assertSame( 'Celular', $plugin->get_phone_field_label() );

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $this->assertSame( 'Celular/Telefone', $plugin->get_phone_field_label() );

        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        $this->assertSame( 'Celular/Telefone', $plugin->get_phone_field_label() );
    }

    // --- Placeholder do campo de celular ------------------------------------

    public function test_cellphone_field_uses_brazilian_placeholder(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertSame( '(00) 00000-0000', $fields['billing_cellphone']['placeholder'] );
    }

    public function test_existing_cellphone_kept(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        $existing = array( 'billing_cellphone' => array( 'type' => 'tel', 'label' => 'Do Brazilian' ) );

        $fields = $this->plugin()->add_cellphone_billing_fields( $existing );

        $this->assertSame( $existing['billing_cellphone'], $fields['billing_cellphone'] );
    }

    // --- Shim escondido (Celular e Fixo com o campo de celular desligado) -----

    public function test_hidden_shim_when_cellphone_field_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertArrayHasKey( 'billing_cellphone', $fields );
        $this->assertSame( 'hidden', $fields['billing_cellphone']['type'] );
        $this->assertFalse( (bool) $fields['billing_cellphone']['required'] );
    }

    public function test_hidden_shim_shipping_when_cellphone_field_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = $this->plugin()->add_cellphone_shipping_fields( array( 'shipping_phone' => array( 'type' => 'tel' ) ) );

        $this->assertSame( 'hidden', $fields['shipping_cellphone']['type'] );
    }

    public function test_no_shim_in_landline_only_without_enable(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $this->assertArrayNotHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    public function test_no_shim_in_disabled_without_enable(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $this->assertArrayNotHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    public function test_visible_cellphone_takes_precedence_over_shim(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        // Com o campo ligado, é visível (tel), não o shim escondido.
        $fields = $this->billing_fields_with_cellphone();

        $this->assertSame( 'tel', $fields['billing_cellphone']['type'] );
    }

    public function test_shim_mirrors_phone_into_cellphone_meta_data(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $data = array(
            'billing_phone'         => '(11) 99999-8888',
            'billing_phone_country' => '+55',
            'billing_cellphone'     => '',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '+5511999998888', $result['billing_cellphone'] );
    }

    public function test_shim_respects_existing_cellphone_value(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $data = array(
            'billing_phone'     => '(11) 99999-8888',
            'billing_cellphone' => '(21) 98888-7777',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '(21) 98888-7777', $result['billing_cellphone'] );
    }

    public function test_no_mirror_when_cellphone_field_enabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $data = array(
            'billing_phone'         => '(11) 99999-8888',
            'billing_phone_country' => '+55',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_cellphone', $result );
    }

    public function test_shipping_cellphone_created_when_enabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->plugin()->add_cellphone_shipping_fields( array( 'shipping_phone' => array( 'type' => 'tel' ) ) );

        $this->assertArrayHasKey( 'shipping_cellphone', $fields );
    }

    // --- Obrigatoriedade do celular -----------------------------------------

    public function test_cellphone_required_option_is_honored(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_cellphone_required', 'yes' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertTrue( (bool) $fields['billing_cellphone']['required'] );
    }

    public function test_cellphone_required_option_defaults_to_optional(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_cellphone_required', 'no' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertFalse( (bool) $fields['billing_cellphone']['required'] );
    }

    public function test_cellphone_inherits_phone_required_in_cellphone_only_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        // Opção dedicada desligada: deve ser ignorada no modo somente-celular.
        update_option( 'woo_better_calc_cellphone_required', 'no' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertTrue( (bool) $fields['billing_cellphone']['required'] );
    }

    // --- Ocultação do nativo no clássico ------------------------------------

    private function base_fields(): array {
        return array(
            'billing'  => array(
                'billing_phone'         => array( 'type' => 'tel' ),
                'billing_phone_country' => array( 'type' => 'hidden' ),
            ),
            'shipping' => array(
                'shipping_phone'         => array( 'type' => 'tel' ),
                'shipping_phone_country' => array( 'type' => 'hidden' ),
            ),
        );
    }

    public function test_native_phone_removed_in_cellphone_only_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( $this->base_fields() );

        $this->assertArrayNotHasKey( 'billing_phone', $fields['billing'] );
        $this->assertArrayNotHasKey( 'shipping_phone', $fields['shipping'] );
    }

    public function test_native_phone_removed_in_disabled_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( $this->base_fields() );

        $this->assertArrayNotHasKey( 'billing_phone', $fields['billing'] );
    }

    public function test_cellphone_only_keeps_phone_country_for_ddi(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( $this->base_fields() );

        $this->assertArrayNotHasKey( 'billing_phone', $fields['billing'] );
        $this->assertArrayHasKey( 'billing_phone_country', $fields['billing'], 'O hidden de DDI deve permanecer no modo "apenas celular".' );
    }

    public function test_disabled_removes_phone_country(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( $this->base_fields() );

        $this->assertArrayNotHasKey( 'billing_phone_country', $fields['billing'] );
    }

    public function test_native_phone_kept_in_landline_only_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( $this->base_fields() );

        $this->assertArrayHasKey( 'billing_phone', $fields['billing'] );
    }

    public function test_native_phone_kept_in_phone_and_cellphone_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( $this->base_fields() );

        $this->assertArrayHasKey( 'billing_phone', $fields['billing'] );
    }

    // --- posted_data ---------------------------------------------------------

    public function test_cellphone_only_empties_phone(): void {
        // "Somente Celular": o telefone fica VAZIO — o número é o celular.
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $data = array( 'billing_cellphone' => '(11) 99999-8888' );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_phone', $result );
        $this->assertSame( '(11) 99999-8888', $result['billing_cellphone'] );
    }

    public function test_cellphone_only_empties_shipping_phone(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $data = array( 'shipping_cellphone' => '(21) 98888-7777' );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'shipping_phone', $result );
        $this->assertSame( '(21) 98888-7777', $result['shipping_cellphone'] );
    }

    public function test_cellphone_only_empties_phone_even_with_ddi(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $data = array(
            'billing_cellphone'     => '(11) 99999-8888',
            'billing_phone_country' => '+55',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_phone', $result );
        $this->assertSame( '(11) 99999-8888', $result['billing_cellphone'] );
    }

    // --- Validação por tipo (fixo x celular) --------------------------------

    private function phoneError( string $phone, string $country, string $kind ) {
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'phone_validation_error' );
        $ref->setAccessible( true );
        return $ref->invoke( $this->plugin(), $phone, $country, $kind );
    }

    public function test_phone_field_accepts_mobile_in_phone_and_cellphone_mode(): void {
        // Regressão: o campo principal "Celular/Telefone" aceita fixo E celular.
        // Um celular (+55 83 98888-8888 = MOBILE) não pode ser reprovado.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $this->assertNull( $this->phoneError( '+5583988888888', '+55', 'phone' ) );
    }

    public function test_phone_field_accepts_landline_in_phone_and_cellphone_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $this->assertNull( $this->phoneError( '+551133334444', '+55', 'phone' ) );
    }

    public function test_phone_field_rejects_mobile_in_landline_only_mode(): void {
        // "Somente Fixo": um celular digitado no campo Telefone é reprovado.
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $this->assertSame( 'invalid', $this->phoneError( '+5583988888888', '+55', 'phone' ) );
    }

    public function test_phone_field_accepts_landline_in_landline_only_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $this->assertNull( $this->phoneError( '+551133334444', '+55', 'phone' ) );
    }

    public function test_cellphone_field_accepts_mobile_and_rejects_landline(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $this->assertNull( $this->phoneError( '+5583988888888', '+55', 'cellphone' ) );
        $this->assertSame( 'invalid', $this->phoneError( '+551133334444', '+55', 'cellphone' ) );
    }

    public function test_cellphone_field_uses_ddi_when_provided(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        // Número nacional (sem DDI) + código do país informado → tratado como BR.
        $this->assertNull( $this->phoneError( '83988888888', '+55', 'cellphone' ) );
    }

    // --- Label no locale (blocos + clássico) --------------------------------

    public function test_locale_phone_label_follows_mode(): void {
        $plugin = $this->plugin();

        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $this->assertSame( 'Telefone', $plugin->wc_better_calc_phone_number( array() )['BR']['phone']['label'] );

        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $this->assertSame( 'Celular', $plugin->wc_better_calc_phone_number( array() )['BR']['phone']['label'] );

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $this->assertSame( 'Celular/Telefone', $plugin->wc_better_calc_phone_number( array() )['BR']['phone']['label'] );
    }

    public function test_phone_field_required_in_classic_locale(): void {
        // O address-i18n.js aplica o 'required' do LOCALE no cliente. Com "Telefone
        // (Contato) Obrigatório" ligado o locale precisa dizer required=true no BR.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_contact_required', 'yes' );

        $locale = $this->plugin()->wc_better_calc_phone_number( array() );

        $this->assertTrue( $locale['BR']['phone']['required'] );
    }

    public function test_locale_phone_survives_brazilian_locale_wipe(): void {
        // Regressão: o plugin "Brazilian Market on WooCommerce" registra
        // `address_fields_priority` em woocommerce_get_country_locale (prio 10) e faz
        // `$locale['BR'] = array( 'postcode' => ... )`, substituindo o array BR inteiro
        // e apagando o nosso `phone`. Nosso filtro roda depois (prio 20) e reafirma.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_contact_required', 'yes' );

        $brazilian = function ( $locale ) {
            $locale['BR'] = array( 'postcode' => array( 'priority' => 45 ) );
            return $locale;
        };
        add_filter( 'woocommerce_get_country_locale', $brazilian, 10 );

        $locale = apply_filters( 'woocommerce_get_country_locale', array() );

        remove_filter( 'woocommerce_get_country_locale', $brazilian, 10 );

        $this->assertArrayHasKey( 'phone', $locale['BR'] );
        $this->assertTrue( $locale['BR']['phone']['required'] );
        $this->assertSame( 'Celular/Telefone', $locale['BR']['phone']['label'] );
    }

    public function test_phone_and_cellphone_does_not_touch_posted_data(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        $data = array(
            'billing_phone'     => '(11) 99999-8888',
            'billing_cellphone' => '(21) 98888-7777',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '(11) 99999-8888', $result['billing_phone'] );
        $this->assertSame( '(21) 98888-7777', $result['billing_cellphone'] );
    }

    public function test_landline_only_does_not_touch_posted_data(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $data = array( 'billing_phone' => '(11) 99999-8888' );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '(11) 99999-8888', $result['billing_phone'] );
        $this->assertArrayNotHasKey( 'billing_cellphone', $result );
    }

    public function test_disabled_does_not_touch_posted_data(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        $data = array(
            'billing_phone'     => '(11) 99999-8888',
            'billing_cellphone' => '(21) 98888-7777',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '(11) 99999-8888', $result['billing_phone'] );
        $this->assertSame( '(21) 98888-7777', $result['billing_cellphone'] );
    }

    // --- Posição do campo de celular ----------------------------------------

    public function test_cellphone_goes_to_the_end_of_the_form(): void {
        // O campo "Celular" SECUNDÁRIO fica no FIM do formulário de endereço
        // (prioridade alta), e não colado ao telefone.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->base_fields();
        $fields['billing']['billing_phone']['priority'] = 100;
        $fields['billing']['billing_cellphone']         = array( 'type' => 'tel', 'priority' => 93 );

        $result = $this->plugin()->wc_better_calc_checkout_fields( $fields );

        $this->assertGreaterThan(
            $result['billing']['billing_phone']['priority'],
            $result['billing']['billing_cellphone']['priority'],
            'O campo Celular deve ficar depois do telefone (no fim do formulário).'
        );
        $this->assertSame( 200, $result['billing']['billing_cellphone']['priority'] );
    }

    public function test_cellphone_stays_at_the_end_with_highlighted_phone(): void {
        // Mesmo com o telefone em destaque (priority 2), o celular continua no fim.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->base_fields();
        $fields['billing']['billing_phone']['priority'] = 2;
        $fields['billing']['billing_cellphone']         = array( 'type' => 'tel', 'priority' => 93 );

        $result = $this->plugin()->wc_better_calc_checkout_fields( $fields );

        $this->assertSame( 200, $result['billing']['billing_cellphone']['priority'] );
    }

    public function test_cellphone_only_keeps_cellphone_position(): void {
        // No modo "Somente Celular" o telefone é removido e o celular é o campo
        // principal: ele NÃO vai para o fim (mantém a prioridade original).
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $fields = $this->base_fields();
        $fields['billing']['billing_cellphone'] = array( 'type' => 'tel', 'priority' => 93 );

        $result = $this->plugin()->wc_better_calc_checkout_fields( $fields );

        $this->assertArrayNotHasKey( 'billing_phone', $result['billing'] );
        $this->assertSame( 93, $result['billing']['billing_cellphone']['priority'] );
    }

    public function test_cellphone_created_in_disabled_mode_with_enable(): void {
        // Comportamento esperado: o bloco "Campo de Celular" só é bloqueado no modo
        // "somente Celular"; em "Desabilitar" ainda pode adicionar o celular.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $this->assertArrayHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    public function test_disabled_with_enable_empties_phone(): void {
        // No modo "Desabilitar" com o celular ligado, o telefone nativo não existe:
        // o número fica no celular e o telefone do pedido fica VAZIO.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $data = array( 'billing_cellphone' => '(11) 99999-8888' );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_phone', $result );
        $this->assertSame( '(11) 99999-8888', $result['billing_cellphone'] );
    }

    public function test_shim_mirrors_shipping_phone_into_shipping_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $data = array(
            'shipping_phone'         => '(21) 98888-7777',
            'shipping_phone_country' => '+55',
            'shipping_cellphone'     => '',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '+5521988887777', $result['shipping_cellphone'] );
    }

    // --- Blocks: campo "Celular" injetado via JS (modo Somente Celular) ------

    // --- Blocks: telefone/celular gerados via JS (por modo) ------------------

    private function callProcessCellphone( \WC_Order $order, array $extensions ): void {
        $request = new \WP_REST_Request();
        $request->set_param( 'extensions', $extensions );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'process_cellphone_from_request' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order, $request );
    }

    public function test_blocks_cellphone_only_saves_only_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE => array(
                'billing_cellphone' => '(11) 99999-8888',
            ),
        ) );

        // Em "Somente Celular" só o celular é salvo; o telefone fica VAZIO.
        $this->assertSame( '', $order->get_billing_phone() );
        $this->assertSame( '11999998888', $order->get_meta( '_billing_cellphone' ) );
        // Espelha no shipping quando só o billing foi informado.
        $this->assertSame( '', $order->get_shipping_phone() );
        $this->assertSame( '11999998888', $order->get_meta( '_shipping_cellphone' ) );
    }

    public function test_blocks_landline_only_maps_phone(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $order = new \WC_Order();
        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::PHONE_EXTENSION_NAMESPACE => array(
                'billing_phone' => '(11) 3333-4444',
            ),
        ) );

        $this->assertSame( '1133334444', $order->get_billing_phone() );
        $this->assertSame( '', $order->get_meta( '_billing_cellphone' ) );
    }

    public function test_blocks_phone_and_cellphone_maps_both(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $order = new \WC_Order();
        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::PHONE_EXTENSION_NAMESPACE => array(
                'billing_phone'      => '(11) 3333-4444',
                'shipping_phone'     => '',
                'billing_cellphone'  => '(11) 99999-8888',
                'shipping_cellphone' => '',
            ),
        ) );

        $this->assertSame( '1133334444', $order->get_billing_phone() );
        $this->assertSame( '11999998888', $order->get_meta( '_billing_cellphone' ) );
    }

    public function test_blocks_ignored_in_disabled_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $order = new \WC_Order();
        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE => array(
                'billing_cellphone' => '(11) 99999-8888',
            ),
        ) );

        $this->assertSame( '', $order->get_billing_phone() );
        $this->assertSame( '', $order->get_meta( '_billing_cellphone' ) );
    }

    public function test_blocks_maps_shipping(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE => array(
                'shipping_cellphone' => '(21) 98888-7777',
            ),
        ) );

        $this->assertSame( '', $order->get_shipping_phone() );
        $this->assertSame( '21988887777', $order->get_meta( '_shipping_cellphone' ) );
        // Espelha no billing quando só o shipping foi informado.
        $this->assertSame( '21988887777', $order->get_meta( '_billing_cellphone' ) );
    }

    public function test_blocks_falls_back_to_session(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }
        WC()->session->set( 'billing_cellphone', '(11) 99999-8888' );

        $order = new \WC_Order();
        $this->callProcessCellphone( $order, array() );

        WC()->session->set( 'billing_cellphone', '' );

        // O telefone fica vazio; o número é o celular.
        $this->assertSame( '', $order->get_billing_phone() );
        $this->assertSame( '11999998888', $order->get_meta( '_billing_cellphone' ) );
    }

    // --- Campos do admin do pedido (phone/cellphone) -------------------------

    public function test_admin_billing_and_shipping_get_phone_and_cellphone(): void {
        // Modo padrão + "Campo de Celular" ligado: os 4 campos devem existir nos
        // forms do admin do pedido (billing e shipping).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $plugin = $this->plugin();

        $billing  = $plugin->ensure_admin_phone_fields_billing( array() );
        $shipping = $plugin->ensure_admin_phone_fields_shipping( array() );

        $this->assertArrayHasKey( 'phone', $billing );
        $this->assertArrayHasKey( 'cellphone', $billing );
        $this->assertArrayHasKey( 'phone', $shipping );
        $this->assertArrayHasKey( 'cellphone', $shipping );
    }

    public function test_admin_fields_no_cellphone_when_disabled(): void {
        // "Celular e Fixo" com o "Campo de Celular" DESLIGADO: só o telefone.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = $this->plugin()->ensure_admin_phone_fields_billing( array() );

        $this->assertArrayHasKey( 'phone', $fields );
        $this->assertArrayNotHasKey( 'cellphone', $fields );
    }

    public function test_admin_fields_are_additive(): void {
        // Deve apenas ADICIONAR/ajustar o Telefone/Celular — nunca remover/reordenar
        // os demais campos que já vieram (convive com o Brazilian).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $incoming = array(
            'first_name' => array( 'label' => 'Nome' ),
            'phone'      => array( 'label' => 'Phone', 'class' => 'short' ),
        );

        $result = $this->plugin()->ensure_admin_phone_fields_billing( $incoming );

        $this->assertSame( 'Nome', $result['first_name']['label'] );
        // A label do telefone passa a SEGUIR o "Comportamento do Campo de Telefone"…
        $this->assertSame( 'Celular/Telefone', $result['phone']['label'] );
        // …sem perder outras propriedades do campo original.
        $this->assertSame( 'short', $result['phone']['class'] );
        $this->assertArrayHasKey( 'cellphone', $result );
        // A label do celular no admin identifica o campo como o secundário.
        $this->assertSame( 'Celular (secundário)', $result['cellphone']['label'] );
    }

    public function test_admin_phone_label_follows_mode(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $this->assertSame( 'Celular/Telefone', $this->plugin()->ensure_admin_phone_fields_billing( array() )['phone']['label'] );

        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $this->assertSame( 'Telefone', $this->plugin()->ensure_admin_phone_fields_billing( array() )['phone']['label'] );

        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $this->assertSame( 'Celular', $this->plugin()->ensure_admin_phone_fields_billing( array() )['phone']['label'] );
    }

    public function test_customer_details_ajax_includes_cellphone(): void {
        // "Carregar endereço" no admin do pedido deve trazer o Celular (billing e
        // shipping).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $customer = new \WC_Customer();
        $customer->update_meta_data( 'billing_cellphone', '83988888885' );
        $customer->update_meta_data( 'shipping_cellphone', '83988888880' );

        $data = array(
            'billing'  => array( 'phone' => '83988888882' ),
            'shipping' => array( 'phone' => '83988888882' ),
        );

        $out = $this->plugin()->add_cellphone_to_customer_details( $data, $customer, 0 );

        $this->assertSame( '83988888885', $out['billing']['cellphone'] );
        $this->assertSame( '83988888880', $out['shipping']['cellphone'] );
    }

    public function test_customer_details_ajax_no_cellphone_when_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $customer = new \WC_Customer();
        $customer->update_meta_data( 'billing_cellphone', '83988888885' );

        $out = $this->plugin()->add_cellphone_to_customer_details( array( 'billing' => array() ), $customer, 0 );

        $this->assertArrayNotHasKey( 'cellphone', $out['billing'] );
    }

    public function test_customer_details_ajax_normalizes_cellphone(): void {
        // Resíduo formatado no perfil deve sair normalizado (+DDInúmero, sem máscara).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $customer = new \WC_Customer();
        $customer->update_meta_data( 'billing_cellphone', '+55 83 98888-8885' );
        $customer->update_meta_data( 'shipping_cellphone', '+55 83 98888-8883' );

        $out = $this->plugin()->add_cellphone_to_customer_details( array( 'billing' => array(), 'shipping' => array() ), $customer, 0 );

        $this->assertSame( '+5583988888885', $out['billing']['cellphone'] );
        $this->assertSame( '+5583988888883', $out['shipping']['cellphone'] );
    }

    public function test_persist_phone_values_normalizes(): void {
        // O Store API deve gravar o valor no MESMO formato dos demais campos
        // (+DDInúmero, sem máscara), mesmo que chegue formatado do input.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        $plugin = $this->plugin();
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'persist_phone_values' );
        $ref->setAccessible( true );
        $ref->invoke( $plugin, array(
            'billing_cellphone'  => '+55 83 98888-8885',
            'shipping_cellphone' => '83 98888-8883',
        ) );

        $this->assertSame( '+5583988888885', WC()->session->get( 'billing_cellphone' ) );
        // Sem "+" no valor de entrada, o format mantém só os dígitos.
        $this->assertSame( '83988888883', WC()->session->get( 'shipping_cellphone' ) );
    }

    public function test_admin_fields_empty_in_disabled_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $fields = $this->plugin()->ensure_admin_phone_fields_shipping( array() );

        $this->assertArrayNotHasKey( 'phone', $fields );
        $this->assertArrayNotHasKey( 'cellphone', $fields );
    }

    // --- Bloco "Dados do Cliente" vs. plugin Brazilian -----------------------

    public function test_customer_block_includes_cellphone(): void {
        // O bloco do woo-better deve exibir Telefone E Celular (o Brazilian exibia).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888882' );
        $order->set_billing_email( 'dev@example.local' );
        $order->update_meta_data( '_billing_cellphone', '83988888885' );

        $plugin = $this->plugin();
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'prepare_billing_display_data' );
        $ref->setAccessible( true );
        $data = $ref->invoke( $plugin, $order, 'none', 'yes', '', '', '', '' );

        $this->assertArrayHasKey( 'phone', $data );
        $this->assertArrayHasKey( 'cellphone', $data );
        $this->assertSame( 'Celular', $data['cellphone']['label'] );
    }

    public function test_suppress_brazilian_customer_block_removes_callback(): void {
        // O woo-better desativa o bloco do Brazilian (instância sem referência
        // global), mantendo apenas o seu próprio bloco.
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $hook = 'woocommerce_admin_order_data_after_billing_address';
        $brazilian = new \Extra_Checkout_Fields_For_Brazil_Order();
        $callback = array( $brazilian, 'order_data_after_billing_address' );

        add_action( $hook, $callback, 10 );
        $this->assertNotFalse( has_action( $hook, $callback ) );

        $this->plugin()->suppress_brazilian_customer_block();

        $this->assertFalse( has_action( $hook, $callback ) );
    }
}

// Stub do plugin "Brazilian Market on WooCommerce" (o plugin real não é carregado
// no ambiente de testes). Serve só para o teste de supressão do bloco dele.
if ( ! class_exists( 'Extra_Checkout_Fields_For_Brazil_Order' ) ) {
    class_alias( \Lkn\WcBetterShippingCalculatorForBrazil\Tests\BrazilianOrderStub::class, 'Extra_Checkout_Fields_For_Brazil_Order' );
}

class BrazilianOrderStub {
    public function order_data_after_billing_address( $order ) {
    }
}
