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

    /**
     * Garante sessão de cliente do WooCommerce (os campos de telefone dos blocos
     * gravam nela) e devolve o `WC_Customer` do usuário atual.
     *
     * @param int $user_id
     * @return \WC_Customer
     */
    private function boot_customer( $user_id ): \WC_Customer {
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        wp_set_current_user( $user_id );
        WC()->customer = new \WC_Customer( $user_id );

        return WC()->customer;
    }

    private function billing_fields_with_cellphone(): array {
        return $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );
    }

    public function test_disabled_native_mode_is_accepted(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled_native' );
        $this->assertSame( 'disabled_native', $this->plugin()->get_phone_mode() );
    }

    public function test_disabled_native_does_not_reinject_own_phone_field(): void {
        // "Desabilitar o campo de telefone": o plugin não injeta o campo próprio
        // (o nativo fica hidden) — senão o telefone "desabilitado" reapareceria.
        update_option( 'woo_better_calc_phone_mode', 'disabled_native' );

        $result = $this->plugin()->wc_better_calc_checkout_fields( array( 'billing' => array(), 'shipping' => array() ) );

        $this->assertArrayNotHasKey( 'billing_phone', $result['billing'] );
        $this->assertArrayNotHasKey( 'billing_phone_country', $result['billing'] );
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

    // --- Resíduo inválido no perfil/sessão (DDI repetido) --------------------

    /**
     * Um valor com o DDI colado várias vezes (`83988888885555555…`, resíduo de um
     * build antigo) NÃO pode voltar para o campo: o E.164 limita o número a 15
     * dígitos. Era isso que fazia o telefone "aparecer do nada" no checkout.
     */
    public function test_sanitize_stored_phone_discards_repeated_ddi(): void {
        $public_class = \Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic::class;

        $this->assertSame( '', $public_class::sanitize_stored_phone( '839888888855555555555555555555555555555555555' ) );
        $this->assertSame( '', $public_class::sanitize_stored_phone( str_repeat( '9', 16 ) ) );
        // Telefone de verdade (com e sem formatação) passa intacto.
        $this->assertSame( '83988888885', $public_class::sanitize_stored_phone( '83988888885' ) );
        $this->assertSame( '+55 (83) 98888-8885', $public_class::sanitize_stored_phone( '+55 (83) 98888-8885' ) );
        $this->assertSame( '', $public_class::sanitize_stored_phone( '' ) );
        $this->assertSame( '', $public_class::sanitize_stored_phone( 'sem numero' ) );
    }

    public function test_saved_phone_values_skips_invalid_profile_value(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create( array( 'role' => 'customer' ) );
        $this->boot_customer( $user_id );

        update_user_meta( $user_id, 'billing_phone', '839888888855555555555555555555555555555555555' );
        update_user_meta( $user_id, 'shipping_phone', '+5583988888885' );

        $public  = new \Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic( 'x', '5.3.0' );
        $values  = $public->saved_phone_values();

        $this->assertSame( '', $values['billing_phone'], 'Valor inválido do perfil não é semeado no campo.' );
        $this->assertSame( '+5583988888885', $values['shipping_phone'] );
    }

    /**
     * Logado, o PERFIL é a fonte da verdade: a sessão não pode ressuscitar um valor
     * que foi apagado do perfil (era o "apago e ele volta sozinho").
     */
    public function test_saved_phone_values_does_not_fall_back_to_the_session_when_logged_in(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create( array( 'role' => 'customer' ) );
        $this->boot_customer( $user_id );

        update_user_meta( $user_id, 'billing_phone', '' );
        WC()->session->set( 'billing_phone', '83988888885' );

        $public = new \Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic( 'x', '5.3.0' );

        $this->assertSame( '', $public->saved_phone_values()['billing_phone'] );
    }

    /** Visitante (sem perfil): a sessão continua sendo a fonte. */
    public function test_saved_phone_values_uses_the_session_for_guests(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        wp_set_current_user( 0 );
        WC()->session->set( 'billing_phone', '83988888885' );

        $public = new \Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic( 'x', '5.3.0' );

        $this->assertSame( '83988888885', $public->saved_phone_values()['billing_phone'] );

        WC()->session->set( 'billing_phone', '' );
    }

    /**
     * Apagar o telefone precisa refletir no `WC()->customer`.
     *
     * Sem isso o core reescrevia o valor ANTIGO no user meta no próximo save do
     * customer (checkout/carrinho) — o telefone apagado "voltava do cache".
     */
    public function test_persist_phone_values_clears_and_syncs_the_customer(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create( array( 'role' => 'customer' ) );
        $this->boot_customer( $user_id );

        WC()->customer->set_billing_phone( '+5583988888885' );
        WC()->customer->set_shipping_phone( '+5583988888885' );
        WC()->customer->save();

        $this->plugin()->handle_phone_update(
            array(
                'billing_phone'  => '',
                'shipping_phone' => '',
            )
        );

        $this->assertSame( '', WC()->customer->get_billing_phone() );
        $this->assertSame( '', WC()->customer->get_shipping_phone() );
        $this->assertSame( '', WC()->session->get( 'billing_phone' ) );
        $this->assertSame( '', WC()->session->get( 'shipping_phone' ) );
        $this->assertSame( '', get_user_meta( $user_id, 'billing_phone', true ) );
        $this->assertSame( '', get_user_meta( $user_id, 'shipping_phone', true ) );
    }

    /**
     * No checkout CLÁSSICO o valor inicial vem do cadastro do cliente: um resíduo
     * inválido não pode ser semeado no campo (e os demais campos ficam em paz).
     */
    public function test_classic_checkout_phone_default_value_discards_invalid_value(): void {
        $user_id = self::factory()->user->create( array( 'role' => 'customer' ) );
        $customer = $this->boot_customer( $user_id );

        $customer->set_shipping_phone( '839888888855555555555555555555555555555555555' );
        $customer->set_billing_phone( '+5583988888885' );

        $this->assertSame( '', $this->plugin()->sanitize_checkout_phone_default_value( null, 'shipping_phone' ) );

        // Resíduo no CADASTRO com o customer "limpo" (o core lê o cadastro).
        $customer->set_shipping_phone( '' );
        update_user_meta( $user_id, 'shipping_phone', '839888888855555555555555555555555555555555555' );
        $this->assertSame( '', $this->plugin()->sanitize_checkout_phone_default_value( null, 'shipping_phone' ) );
        $this->assertNull( $this->plugin()->sanitize_checkout_phone_default_value( null, 'billing_phone' ) );
        // Outros campos e valores já resolvidos por terceiros seguem intactos.
        $this->assertNull( $this->plugin()->sanitize_checkout_phone_default_value( null, 'billing_postcode' ) );
        $this->assertSame( 'via-third-party', $this->plugin()->sanitize_checkout_phone_default_value( 'via-third-party', 'shipping_phone' ) );
    }

    /**
     * Valor que não pode ser telefone é IGNORADO — nunca apaga o que está salvo.
     *
     * Regressão: um número digitado com dígitos a mais (ex.: "+55 838999988999999")
     * gravava vazio na sessão/perfil, então ao recarregar o checkout o campo aparecia
     * vazio e o telefone bom que estava salvo tinha sido perdido. A validação do
     * número acontece no ENVIO do formulário; aqui a regra é só "não gravar lixo".
     */
    public function test_persist_phone_values_ignores_invalid_value_without_erasing(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create( array( 'role' => 'customer' ) );
        $this->boot_customer( $user_id );

        // Telefone BOM já salvo (perfil + sessão + customer).
        WC()->customer->set_billing_phone( '+5583988888885' );
        WC()->customer->save();
        WC()->session->set( 'billing_phone', '+5583988888885' );

        $this->plugin()->handle_phone_update(
            array(
                'billing_phone'  => '+55 838999988999999',   // inválido (DDI + 15 díg.)
                'shipping_phone' => '83988888885',           // válido
            )
        );

        $this->assertSame( '+5583988888885', get_user_meta( $user_id, 'billing_phone', true ), 'O telefone salvo não pode ser apagado.' );
        $this->assertSame( '+5583988888885', WC()->session->get( 'billing_phone' ) );
        $this->assertSame( '+5583988888885', WC()->customer->get_billing_phone() );
        $this->assertSame( '83988888885', WC()->session->get( 'shipping_phone' ) );
    }

    /** O campo apagado pelo cliente continua sendo gravado como vazio. */
    public function test_persist_phone_values_still_accepts_an_explicit_clear(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create( array( 'role' => 'customer' ) );
        $this->boot_customer( $user_id );

        WC()->customer->set_billing_phone( '+5583988888885' );
        WC()->customer->save();

        $this->plugin()->handle_phone_update( array( 'billing_phone' => '' ) );

        $this->assertSame( '', WC()->session->get( 'billing_phone' ) );
        $this->assertSame( '', WC()->customer->get_billing_phone() );
        $this->assertSame( '', get_user_meta( $user_id, 'billing_phone', true ) );
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

        // Com a lib/DDI ligada o DDI é o seletor de país → placeholder só do número.
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertSame( '(00) 00000-0000', $fields['billing_cellphone']['placeholder'] );
    }

    public function test_cellphone_placeholder_has_no_ddi_without_the_lib(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        // Máscara BR (sem lib): o DDI entra sozinho no backend, então o placeholder
        // descreve só o que o cliente digita.
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertSame( '(00) 00000-0000', $fields['billing_cellphone']['placeholder'] );
    }

    public function test_existing_cellphone_is_overridden_by_woo_better(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        $existing = array( 'billing_cellphone' => array( 'type' => 'tel', 'label' => 'Do Brazilian' ) );

        $fields = $this->plugin()->add_cellphone_billing_fields( $existing );

        // Precedência: quando o woo-better gera o campo de celular, a definição dele
        // SOBREPÕE um `*_cellphone` já existente (ex.: o do "Brazilian Market on
        // WooCommerce", registrado em prioridade anterior).
        $this->assertSame( 'Celular', $fields['billing_cellphone']['label'] );
        $this->assertArrayHasKey(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_FIELD_ATTR,
            $fields['billing_cellphone']['custom_attributes']
        );
    }

    // --- Shim escondido (Celular e Fixo com o campo de celular desligado) -----

    public function test_no_shim_by_default(): void {
        // "Celular Oculto" DESLIGADO (padrão): NENHUM campo de celular é gerado —
        // evita conflito. (Celular e Fixo + Campo de Celular desligado.)
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );

        $this->assertArrayNotHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
        $this->assertArrayNotHasKey( 'shipping_cellphone', $this->plugin()->add_cellphone_shipping_fields( array( 'shipping_phone' => array( 'type' => 'tel' ) ) ) );
    }

    public function test_no_shim_mirror_by_default(): void {
        // Sem o "Celular Oculto", não espelha o telefone no `*_cellphone`.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );

        $data = array(
            'billing_phone'         => '(11) 99999-8888',
            'billing_phone_country' => '+55',
            'billing_cellphone'     => '',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '', (string) ( $result['billing_cellphone'] ?? '' ) );
    }

    public function test_hidden_shim_when_cellphone_field_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $fields = $this->billing_fields_with_cellphone();

        $this->assertArrayHasKey( 'billing_cellphone', $fields );
        $this->assertSame( 'hidden', $fields['billing_cellphone']['type'] );
        $this->assertFalse( (bool) $fields['billing_cellphone']['required'] );
    }

    public function test_hidden_shim_shipping_when_cellphone_field_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

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
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

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
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $data = array(
            'billing_phone'     => '(11) 99999-8888',
            'billing_cellphone' => '(21) 98888-7777',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '(21) 98888-7777', $result['billing_cellphone'] );
    }

    public function test_shim_renormalizes_cellphone_mirrored_by_the_classic_script(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        // O script do checkout clássico copia o telefone (mesmo número) para o campo
        // escondido de celular. O servidor deve re-normalizar para o padrão (+DDInúmero)
        // em vez de gravar o valor cru copiado pelo JS.
        $data = array(
            'billing_phone'         => '(11) 99999-8888',
            'billing_phone_country' => '+55',
            'billing_cellphone'     => '(11) 99999-8888',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '+5511999998888', $result['billing_cellphone'] );
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

    public function test_native_phone_kept_in_disabled_mode(): void {
        // Modo "Desabilitar": o woo-better NÃO gerencia o telefone — o campo nativo
        // fica intacto (comportamento original). Antes ele era REMOVIDO no clássico;
        // agora o plugin é inerte no modo desabilitado.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( $this->base_fields() );

        $this->assertArrayHasKey( 'billing_phone', $fields['billing'] );
        $this->assertArrayHasKey( 'shipping_phone', $fields['shipping'] );
    }

    public function test_disabled_with_cellphone_keeps_native_phone_in_classic(): void {
        // "Desabilitar" + "Campo de Celular": o telefone nativo é MANTIDO e o
        // "Celular" é um campo SEPARADO (aditivo) no fim do formulário.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->base_fields();
        $fields['billing']['billing_cellphone'] = array( 'type' => 'tel', 'priority' => 93 );

        $result = $this->plugin()->wc_better_calc_checkout_fields( $fields );

        $this->assertArrayHasKey( 'billing_phone', $result['billing'], 'O telefone nativo deve permanecer.' );
        $this->assertArrayHasKey( 'billing_cellphone', $result['billing'], 'O celular separado deve existir.' );
        $this->assertSame( 200, $result['billing']['billing_cellphone']['priority'], 'O celular deve ficar no fim do formulário.' );
    }

    public function test_disabled_mode_normalize_order_phone_is_inert(): void {
        // Modo "Desabilitar": mesmo com a máscara/DDI gravada como ligada (stale),
        // o plugin NÃO normaliza o telefone do pedido.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888882' );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'normalize_order_phone' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order, 'billing', '+55' );

        $this->assertSame( '83988888882', $order->get_billing_phone(), 'No modo Desabilitar o telefone do pedido fica intacto.' );
    }

    public function test_disabled_mode_format_order_phone_is_inert(): void {
        // Mesmo com a máscara ligada (stale), o filtro de exibição não reformata o
        // telefone do pedido no modo "Desabilitar".
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $order = new \WC_Order();
        $out = $this->plugin()->format_order_billing_phone( '83988888882', $order );

        $this->assertSame( '83988888882', $out, 'No modo Desabilitar o telefone é exibido como está.' );
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

    public function test_disabled_mode_locale_does_not_touch_native_phone(): void {
        // Regressão: no modo "Desabilitar" o woo-better NÃO mexe no telefone nativo —
        // nem label, nem hidden, nem required — mesmo com o "Destaque do Campo
        // Telefone" ligado. Antes o destaque ocultava o nativo (o telefone sumia).
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_contact_field_position', 'yes' );
        update_option( 'woo_better_calc_contact_required', 'yes' );

        $locale = $this->plugin()->wc_better_calc_phone_number( array( 'BR' => array( 'phone' => array( 'label' => 'Phone' ) ) ) );

        $this->assertArrayNotHasKey( 'hidden', $locale['BR']['phone'], 'O telefone nativo NÃO deve ficar oculto no modo Desabilitar.' );
        $this->assertArrayNotHasKey( 'required', $locale['BR']['phone'], 'O plugin NÃO deve mexer no required do nativo no modo Desabilitar.' );
        $this->assertSame( 'Phone', $locale['BR']['phone']['label'], 'O label nativo deve permanecer o do WooCommerce.' );
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

    public function test_cellphone_not_created_in_disabled_mode_even_with_enable(): void {
        // REGRESSÃO: com o telefone desabilitado o plugin NÃO pode gerar o "Celular".
        // Antes, uma option residual `enable_cellphone_field = yes` fazia o campo
        // aparecer no checkout mesmo com o telefone desligado.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $this->assertArrayNotHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    public function test_cellphone_not_created_in_disabled_native_mode(): void {
        // "Desabilitar o campo de telefone" também não gera celular.
        update_option( 'woo_better_calc_phone_mode', 'disabled_native' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $this->assertArrayNotHasKey( 'billing_cellphone', $this->billing_fields_with_cellphone() );
    }

    public function test_disabled_native_hides_native_phone_option(): void {
        // A opção "Desabilitar o campo de telefone" desliga o telefone NATIVO do
        // WooCommerce; a opção "Deixar a configuração nativa" não mexe nele.
        update_option( 'woo_better_calc_phone_mode', 'disabled_native' );
        delete_option( 'woo_better_calc_phone_field_previous' );
        update_option( 'woocommerce_checkout_phone_field', 'required' );

        $this->plugin()->sync_phone_field();

        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ) );
    }

    public function test_disabled_with_enable_keeps_phone_and_adds_cellphone(): void {
        // No modo "Desabilitar" com o campo de celular ligado, o telefone é ADITIVO:
        // o telefone nativo é MANTIDO e o "Celular" é um campo separado.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $data = array(
            'billing_phone'     => '(11) 3333-4444',
            'billing_cellphone' => '(11) 99999-8888',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '(11) 3333-4444', $result['billing_phone'], 'O telefone deve ser mantido.' );
        $this->assertSame( '(11) 99999-8888', $result['billing_cellphone'], 'O celular separado deve ser mantido.' );
    }

    public function test_shim_mirrors_shipping_phone_into_shipping_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $data = array(
            'shipping_phone'         => '(21) 98888-7777',
            'shipping_phone_country' => '+55',
            'shipping_cellphone'     => '',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '+5521988887777', $result['shipping_cellphone'] );
    }

    // --- Shim: só espelha o telefone no celular quando for CELULAR -----------

    public function test_shim_classic_clears_cellphone_for_landline(): void {
        // O campo de telefone aceita fixo E celular. No shim, o celular é o
        // espelho do telefone; se o telefone for FIXO, o celular não pode ser
        // preenchido — o campo é LIMPO (só número de celular é permitido).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $data = array(
            'billing_phone'         => '(11) 3333-4444', // fixo
            'billing_phone_country' => '+55',
            'billing_cellphone'     => '(11) 3333-4444', // espelho do JS
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '', $result['billing_cellphone'], 'Um telefone fixo não pode preencher o celular; o campo deve ficar limpo.' );
    }

    public function test_shim_classic_keeps_cellphone_for_mobile(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $data = array(
            'billing_phone'         => '(83) 98888-8882', // celular
            'billing_phone_country' => '+55',
            'billing_cellphone'     => '(83) 98888-8882',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '+5583988888882', $result['billing_cellphone'] );
    }

    public function test_shim_blocks_clears_cellphone_for_landline(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $order = new \WC_Order();
        // Valor antigo/espúrio na meta: deve ser LIMPO quando o telefone é fixo.
        $order->update_meta_data( '_billing_cellphone', '1133334444' );

        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::PHONE_EXTENSION_NAMESPACE => array(
                'billing_phone' => '1133334444', // fixo
            ),
            WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE => array(
                'billing_cellphone' => '1133334444', // espelho do JS
            ),
        ) );

        $this->assertSame( '1133334444', preg_replace( '/\D/', '', $order->get_billing_phone() ) );
        $this->assertSame( '', $order->get_meta( '_billing_cellphone' ), 'Fixo não deve preencher o celular (e limpa um valor antigo).' );
    }

    public function test_shim_blocks_keeps_cellphone_for_mobile(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $order = new \WC_Order();
        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::PHONE_EXTENSION_NAMESPACE => array(
                'billing_phone' => '83988888882', // celular
            ),
            WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE => array(
                'billing_cellphone' => '83988888882',
            ),
        ) );

        $this->assertSame( '83988888882', preg_replace( '/\D/', '', $order->get_meta( '_billing_cellphone' ) ) );
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

    public function test_blocks_disabled_with_cellphone_saves_cellphone_and_keeps_phone(): void {
        // "Desabilitar" + "Campo de Celular": o telefone é o NATIVO (não mexemos
        // nele) e o celular (campo separado) é gravado nas metas.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' ); // telefone nativo do WC
        $this->callProcessCellphone( $order, array(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE => array(
                'billing_cellphone' => '(11) 99999-8888',
            ),
        ) );

        $this->assertSame( '+5583988888882', $order->get_billing_phone(), 'O telefone nativo deve permanecer intacto.' );
        $this->assertSame( '11999998888', $order->get_meta( '_billing_cellphone' ) );
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

    public function test_admin_fields_cellphone_present_in_shim_mode(): void {
        // "Celular e Fixo" com o "Campo de Celular" DESLIGADO (shim): o plugin GERA a
        // meta `*_cellphone` (espelho do telefone p/ PagBank/Asaas/NFe), então o
        // campo "Celular" deve aparecer no admin em COBRANÇA e ENTREGA (consistência).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $plugin = $this->plugin();
        $billing  = $plugin->ensure_admin_phone_fields_billing( array() );
        $shipping = $plugin->ensure_admin_phone_fields_shipping( array() );

        $this->assertArrayHasKey( 'phone', $billing );
        $this->assertArrayHasKey( 'cellphone', $billing );
        $this->assertArrayHasKey( 'phone', $shipping );
        $this->assertArrayHasKey( 'cellphone', $shipping );
    }

    public function test_admin_fields_no_cellphone_in_landline_only(): void {
        // "Somente Fixo": só o telefone, sem celular em nenhum endereço.
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $plugin = $this->plugin();
        $this->assertArrayNotHasKey( 'cellphone', $plugin->ensure_admin_phone_fields_billing( array() ) );
        $this->assertArrayNotHasKey( 'cellphone', $plugin->ensure_admin_phone_fields_shipping( array() ) );
    }

    public function test_admin_fields_drop_leftover_cellphone_when_not_storing(): void {
        // Regressão: "Celular e Fixo" com "Campo de Celular" e "Celular Oculto"
        // DESLIGADOS — o woo-better gerencia o telefone mas NÃO cria campo de
        // celular. Um `cellphone` vindo de outro plugin (ex.: o "Brazilian Market
        // on WooCommerce", que o adiciona SÓ na cobrança) deve ser DESCARTADO do
        // admin, para cobrança e entrega ficarem consistentes (nenhuma com celular).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );

        $plugin = $this->plugin();

        $incoming_billing = array(
            'phone'     => array( 'label' => 'Phone' ),
            'cellphone' => array( 'label' => 'Celular', 'show' => false ),
        );

        $billing = $plugin->ensure_admin_phone_fields_billing( $incoming_billing );
        $this->assertArrayHasKey( 'phone', $billing );
        $this->assertArrayNotHasKey( 'cellphone', $billing, 'O celular residual (de outro plugin) deve ser removido.' );

        $shipping = $plugin->ensure_admin_phone_fields_shipping( array( 'phone' => array( 'label' => 'Phone' ) ) );
        $this->assertArrayHasKey( 'phone', $shipping );
        $this->assertArrayNotHasKey( 'cellphone', $shipping );
    }

    public function test_admin_fields_keep_cellphone_when_shim_enabled(): void {
        // Com o "Celular Oculto" LIGADO o woo-better GERA a meta de celular, então
        // mantém (e relabela para "Celular (secundário)") o campo de celular.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $billing = $this->plugin()->ensure_admin_phone_fields_billing( array(
            'cellphone' => array( 'label' => 'Celular', 'show' => false ),
        ) );

        $this->assertArrayHasKey( 'cellphone', $billing );
        $this->assertSame( 'Celular (secundário)', $billing['cellphone']['label'] );
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
    }

    public function test_admin_cellphone_only_shows_single_celular_field(): void {
        // Modo "Somente Celular": só existe o campo Celular (o telefone fica vazio por
        // design). O admin deve mostrar UM campo "Celular" (com o valor) e NÃO o
        // `_billing_phone` vazio rotulado "Celular".
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $plugin = $this->plugin();

        foreach ( array( 'billing', 'shipping' ) as $type ) {
            $fields = ( 'billing' === $type )
                ? $plugin->ensure_admin_phone_fields_billing( array( 'first_name' => array( 'label' => 'Nome' ) ) )
                : $plugin->ensure_admin_phone_fields_shipping( array( 'first_name' => array( 'label' => 'Nome' ) ) );

            $this->assertArrayNotHasKey( 'phone', $fields, "No modo Somente Celular não deve haver campo de telefone ($type)." );
            $this->assertArrayHasKey( 'cellphone', $fields );
            $this->assertSame( 'Celular', $fields['cellphone']['label'], "O campo deve ser rotulado 'Celular' ($type)." );
        }
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

    public function test_customer_details_ajax_includes_cellphone_in_shim_mode(): void {
        // No modo shim ("Celular e Fixo" + "Campo de Celular" desligado) o campo
        // "Celular" do admin deve ser preenchido no "Carregar endereço".
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

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

    public function test_customer_details_ajax_no_cellphone_in_landline_only(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

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

    // --- Detalhes do pedido: linhas de endereço (Chave: valor) ---------------

    public function test_address_display_rows_billing(): void {
        $order = new \WC_Order();
        $order->set_billing_first_name( 'João' );
        $order->set_billing_last_name( 'Silva' );
        $order->set_billing_address_1( 'Rua H' );
        $order->set_billing_city( 'Feira de Santana' );
        $order->set_billing_state( 'BA' );
        $order->set_billing_postcode( '44053-762' );
        $order->set_billing_country( 'BR' );
        $order->update_meta_data( '_billing_number', '123' );
        $order->update_meta_data( '_billing_neighborhood', 'Centro' );

        $rows = WcBetterShippingCalculatorForBrazil::address_display_rows( $order, 'billing' );

        $this->assertSame( 'João Silva', $rows['Nome'] );
        $this->assertSame( 'Rua H', $rows['Endereço'] );
        $this->assertSame( '123', $rows['Número'] );
        $this->assertSame( 'Centro', $rows['Bairro'] );
        $this->assertSame( 'Feira de Santana', $rows['Cidade'] );
        $this->assertSame( '44053-762', $rows['CEP'] );
    }

    public function test_address_display_rows_skips_empty_fields(): void {
        $order = new \WC_Order();
        $order->set_billing_address_1( 'Rua H' );

        $rows = WcBetterShippingCalculatorForBrazil::address_display_rows( $order, 'billing' );

        $this->assertArrayHasKey( 'Endereço', $rows );
        $this->assertArrayNotHasKey( 'Número', $rows );
        $this->assertArrayNotHasKey( 'Bairro', $rows );
    }

    public function test_address_display_rows_neighborhood_falls_back_to_profile(): void {
        // O pedido só tem `_<type>_neighborhood` quando o "Campo de Bairro" estava
        // ligado no checkout; quando vazio, usamos o bairro do perfil do cliente.
        $uid = $this->factory()->user->create();
        update_user_meta( $uid, 'billing_neighborhood', 'Centro' );

        $order = new \WC_Order();
        $order->set_customer_id( $uid );
        $order->set_billing_address_1( 'Rua H' );

        $rows = WcBetterShippingCalculatorForBrazil::address_display_rows( $order, 'billing' );

        $this->assertSame( 'Centro', $rows['Bairro'] );
    }

    public function test_address_display_rows_neighborhood_prefers_order_meta(): void {
        // Se o pedido tem o bairro, ele vence (não usa o do perfil).
        $uid = $this->factory()->user->create();
        update_user_meta( $uid, 'billing_neighborhood', 'Perfil' );

        $order = new \WC_Order();
        $order->set_customer_id( $uid );
        $order->update_meta_data( '_billing_neighborhood', 'Do Pedido' );

        $rows = WcBetterShippingCalculatorForBrazil::address_display_rows( $order, 'billing' );

        $this->assertSame( 'Do Pedido', $rows['Bairro'] );
    }

    public function test_address_display_rows_invalid_type_is_empty(): void {
        $this->assertSame(
            array(),
            WcBetterShippingCalculatorForBrazil::address_display_rows( new \WC_Order(), 'nope' )
        );
    }

    public function test_admin_fields_empty_in_disabled_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $fields = $this->plugin()->ensure_admin_phone_fields_shipping( array() );

        $this->assertArrayNotHasKey( 'phone', $fields );
        $this->assertArrayNotHasKey( 'cellphone', $fields );
    }

    // --- Bloco "Dados do Cliente" vs. plugin Brazilian -----------------------

    public function test_customer_block_includes_cellphone(): void {
        // O bloco do woo-better deve exibir Telefone/Celular (principal) E Celular
        // (secundário) quando AMBOS foram preenchidos, com labels derivadas dos metadados.
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
        $this->assertSame( 'Celular/Telefone', $data['phone']['label'] );
        $this->assertSame( 'Celular', $data['cellphone']['label'] );
    }

    public function test_customer_block_landline_only_labels_telefone(): void {
        // Só telefone (ex.: modo "Somente Fixo"): label "Telefone".
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $order = new \WC_Order();
        $order->set_billing_phone( '1133334444' );

        $plugin = $this->plugin();
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'prepare_billing_display_data' );
        $ref->setAccessible( true );
        $data = $ref->invoke( $plugin, $order, 'none', 'yes', '', '', '', '' );

        $this->assertArrayHasKey( 'phone', $data );
        $this->assertSame( 'Telefone', $data['phone']['label'] );
        $this->assertArrayNotHasKey( 'cellphone', $data );
    }

    public function test_customer_block_only_cellphone_label_derives_from_meta(): void {
        // Pedido feito SÓ com celular (phone vazio, `_billing_cellphone` preenchido) e
        // depois a config virou "Celular e Fixo". A label deve sair dos METADADOS: só
        // "Celular" (não "Telefone"/"Celular/Telefone").
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $order = new \WC_Order();
        // phone fica vazio (o pedido foi só-celular).
        $order->update_meta_data( '_billing_cellphone', '83988888885' );

        $plugin = $this->plugin();
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'prepare_billing_display_data' );
        $ref->setAccessible( true );
        $data = $ref->invoke( $plugin, $order, 'none', 'yes', '', '', '', '' );

        $this->assertArrayNotHasKey( 'phone', $data, 'Sem telefone no pedido, não deve haver linha Telefone.' );
        $this->assertArrayHasKey( 'cellphone', $data );
        $this->assertSame( 'Celular', $data['cellphone']['label'] );
        $this->assertSame( '83988888885', $data['cellphone']['value'] );
    }

    public function test_customer_block_mirrored_cellphone_shows_single_combined_row(): void {
        // "Celular e Fixo" com o "Campo de Celular" DESLIGADO (shim): o cellphone é o
        // espelho do telefone — uma única linha "Celular/Telefone" (sem o secundário).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888882' );
        $order->update_meta_data( '_billing_cellphone', '83988888882' );

        $plugin = $this->plugin();
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'prepare_billing_display_data' );
        $ref->setAccessible( true );
        $data = $ref->invoke( $plugin, $order, 'none', 'yes', '', '', '', '' );

        $this->assertArrayHasKey( 'phone', $data );
        $this->assertSame( 'Celular/Telefone', $data['phone']['label'] );
        $this->assertArrayNotHasKey( 'cellphone', $data );
    }

    // --- Bloco "Dados do Cliente": modo ATUAL define a label do número --------

    private function billingPhoneLabels( \WC_Order $order ): array {
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'prepare_billing_display_data' );
        $ref->setAccessible( true );
        $data = $ref->invoke( $this->plugin(), $order, 'none', 'yes', '', '', '', '' );

        $rows = array();
        foreach ( $data as $key => $row ) {
            if ( 'phone' === $key || 'cellphone' === $key ) {
                $rows[ $row['label'] ] = $row['value'];
            }
        }
        return $rows;
    }

    public function test_display_cellphone_ddi_only_when_principal_or_shim(): void {
        // O "Campo de Celular" VISÍVEL (separado) NÃO tem DDI → a exibição (admin/
        // recibo) mostra só os dígitos. Já o espelho OCULTO (shim) e o modo "Somente
        // Celular" exibem o celular em E.164 (+55).
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        // Visível: sem DDI.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888884' );
        $order->update_meta_data( '_billing_cellphone', '83988888881' );
        $order->update_meta_data( '_billing_phone_country_code', '+55' );

        $this->assertSame( '83988888881', $this->billingPhoneLabels( $order )['Celular'] );

        // Shim: com DDI.
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888881' );

        $this->assertSame( '+5583988888881', $this->billingPhoneLabels( $order )['Celular'] );
    }

    public function test_customer_block_cellphone_only_shows_celular_for_old_both_order(): void {
        // Regressão: pedido feito em "Celular e Fixo" (gravou telefone E celular, mesmo
        // número); a config agora é "Somente Celular". A label deve seguir o MODO →
        // "Celular" (não "Celular/Telefone").
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' );

        $labels = $this->billingPhoneLabels( $order );

        $this->assertArrayHasKey( 'Celular', $labels );
        $this->assertArrayNotHasKey( 'Celular/Telefone', $labels );
        $this->assertSame( '+5583988888882', $labels['Celular'] );
    }

    public function test_customer_block_cellphone_only_prefers_cellphone_over_distinct_phone(): void {
        // "Somente Celular" com telefone (fixo) e celular DIFERENTES: mostra só o
        // celular, rotulado "Celular".
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+551133334444' ); // fixo
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' );

        $labels = $this->billingPhoneLabels( $order );

        $this->assertArrayHasKey( 'Celular', $labels );
        $this->assertArrayNotHasKey( 'Telefone', $labels );
        $this->assertSame( '+5583988888882', $labels['Celular'] );
    }

    public function test_customer_block_cellphone_only_falls_back_to_phone(): void {
        // "Somente Celular" sem celular disponível (ex.: pedido antigo do modo "Fixo"):
        // cai no telefone, rotulado "Telefone".
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+551133334444' );

        $labels = $this->billingPhoneLabels( $order );

        $this->assertArrayHasKey( 'Telefone', $labels );
        $this->assertArrayNotHasKey( 'Celular', $labels );
        $this->assertSame( '+551133334444', $labels['Telefone'] );
    }

    public function test_customer_block_landline_only_shows_telefone_for_old_both_order(): void {
        // "Somente Fixo" com pedido antigo que tem telefone E celular: label segue o
        // MODO → "Telefone" (não "Celular/Telefone").
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+551133334444' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' );

        $labels = $this->billingPhoneLabels( $order );

        $this->assertArrayHasKey( 'Telefone', $labels );
        $this->assertArrayNotHasKey( 'Celular/Telefone', $labels );
        $this->assertSame( '+551133334444', $labels['Telefone'] );
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

    // --- DDI (E.164) no pedido do checkout em blocos -------------------------

    public function test_normalize_order_phone_prepends_ddi_to_phone_but_not_visible_cellphone(): void {
        // O TELEFONE do pedido fica em E.164 (+DDInúmero). O "Campo de Celular"
        // VISÍVEL (separado) é um campo simples, SEM DDI → o `_*_cellphone` fica só
        // com os dígitos.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888882' );
        $order->update_meta_data( '_billing_cellphone', '83988888882' );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'normalize_order_phone' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order, 'billing', '+55' );

        $this->assertSame( '+5583988888882', $order->get_billing_phone() );
        $this->assertSame( '83988888882', $order->get_meta( '_billing_cellphone' ), 'O celular VISÍVEL não recebe o DDI.' );
    }

    public function test_normalize_order_phone_prepends_ddi_to_shim_cellphone(): void {
        // No SHIM (espelho oculto) o celular herda o DDI do bloco principal.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '83988888882' );
        $order->update_meta_data( '_billing_cellphone', '83988888882' );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'normalize_order_phone' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order, 'billing', '+55' );

        $this->assertSame( '+5583988888882', $order->get_meta( '_billing_cellphone' ) );
    }

    public function test_blocks_phone_country_extension_prepends_ddi(): void {
        // O JS (blocos) envia o DDI no namespace `woo_better_phone_country`; o
        // pedido deve sair com o telefone em E.164 (com o +55), como no clássico.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );

        $order = new \WC_Order();
        $request = new \WP_REST_Request();
        $request->set_param( 'extensions', array(
            WcBetterShippingCalculatorForBrazil::PHONE_EXTENSION_NAMESPACE => array(
                'billing_phone'  => '83988888882',
                'shipping_phone' => '83988888882',
            ),
            'woo_better_phone_country' => array(
                'billing_phone_country_code'  => '+55',
                'shipping_phone_country_code' => '+55',
            ),
        ) );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'process_checkout_data_blocks' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order, $request );

        $this->assertSame( '+5583988888882', $order->get_billing_phone() );
        $this->assertSame( '+5583988888882', $order->get_shipping_phone() );
    }

    // --- Shim: editar endereço (minha conta) e perfil -------------------------

    public function test_shim_edit_address_clears_cellphone_for_landline(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_country', 'BR' );

        $backup = $_POST;
        $_POST = array(
            'billing_phone'         => '(11) 3333-4444', // fixo
            'billing_phone_country' => '+55',
        );

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'billing' );

        $_POST = $backup;

        $this->assertSame( '', get_user_meta( $user_id, 'billing_cellphone', true ), 'Fixo não deve preencher o celular no editar-endereço.' );
    }

    public function test_shim_edit_address_keeps_cellphone_for_mobile(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_country', 'BR' );

        $backup = $_POST;
        $_POST = array(
            'billing_phone'         => '(83) 98888-8882', // celular
            'billing_phone_country' => '+55',
        );

        $this->plugin()->save_edit_address_custom_fields( $user_id, 'billing' );

        $_POST = $backup;

        $this->assertSame( '+5583988888882', get_user_meta( $user_id, 'billing_cellphone', true ) );
    }

    public function test_shim_profile_clears_cellphone_for_landline(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = self::factory()->user->create();

        $backup = $_POST;
        $_POST = array(
            'billing_phone'     => '(11) 3333-4444', // fixo
            'billing_cellphone' => '(11) 3333-4444', // espelho
        );

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        $this->assertSame( '', get_user_meta( $user_id, 'billing_cellphone', true ), 'No perfil, um fixo não deve preencher o celular.' );
    }

    public function test_shim_profile_keeps_cellphone_for_mobile(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $user_id = self::factory()->user->create();

        $backup = $_POST;
        $_POST = array(
            'billing_phone'     => '(83) 98888-8882', // celular
            'billing_cellphone' => '',
        );

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        // O celular do perfil passa a espelhar o telefone (celular) no shim.
        $this->assertSame( '+5583988888882', get_user_meta( $user_id, 'billing_cellphone', true ) );
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
