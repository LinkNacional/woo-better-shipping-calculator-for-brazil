<?php
/**
 * Regressão: campo de Inscrição Municipal (IM) — espelha o comportamento do IE.
 *
 * Cobre:
 *   - gate de exibição (Tipo de Cliente + toggle woo_better_calc_enable_im_field);
 *   - validação clássica (IM obrigatória/preenchida para CNPJ; nada para CPF);
 *   - remoção do required fora do Brasil / quando CPF (lkn_disabled_require_field);
 *   - handler do checkout em blocos (handle_im_update → sessão/user meta).
 *
 * NÃO é validado por cálculo: a IM não tem padrão nacional (regra municipal).
 * Diferente do IE, a IM NÃO tem opção "Isento" — é sempre obrigatória (valor
 * preenchido) quando exibida para Pessoa Jurídica.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class InscricaoMunicipalFieldTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    /**
     * Garante sessão do WC + `woocommerce_init` disparado, pré-requisitos de
     * `wc_add_notice()` (sem eles a chamada vira no-op e emite doing_it_wrong).
     */
    private function ensure_wc_ready() {
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        if ( ! did_action( 'woocommerce_init' ) ) {
            do_action( 'woocommerce_init' );
        }

        if ( ! WC()->session ) {
            $this->markTestSkipped( 'Sessão do WooCommerce indisponível no ambiente de testes.' );
        }

        return WC()->session;
    }

    private function apply_checkout_fields(): array {
        return $this->plugin()->wc_better_calc_checkout_fields(
            array( 'billing' => array(), 'shipping' => array() )
        );
    }

    private function error_notices(): array {
        $notices = WC()->session ? WC()->session->get( 'wc_notices', array() ) : array();

        return isset( $notices['error'] ) ? $notices['error'] : array();
    }

    // --- Gate de exibição ---------------------------------------------------

    public function test_field_added_when_enabled_and_legal_person(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayHasKey( 'billing_im', $fields['billing'] );
        $this->assertSame( 'Inscrição Municipal (IM)', $fields['billing']['billing_im']['label'] );
        $this->assertTrue( (bool) $fields['billing']['billing_im']['required'] );
        $this->assertSame( '15', (string) $fields['billing']['billing_im']['custom_attributes']['maxlength'] );
    }

    public function test_field_added_for_both_person_types(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayHasKey( 'billing_im', $fields['billing'] );
    }

    public function test_field_absent_when_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_im_field', 'no' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayNotHasKey( 'billing_im', $fields['billing'] );
    }

    public function test_field_absent_for_physical_person(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayNotHasKey( 'billing_im', $fields['billing'] );
    }

    public function test_field_absent_when_person_type_none(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayNotHasKey( 'billing_im', $fields['billing'] );
    }

    // --- Validação clássica -------------------------------------------------

    private function validate_with(array $post): void {
        $this->ensure_wc_ready();
        WC()->session->set( 'wc_notices', array() );

        $backup = $_POST;
        $_POST = $post;

        $this->plugin()->validate_im_field_value_classic();

        $_POST = $backup;
    }

    public function test_validation_adds_notice_for_cnpj_without_im(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '11.222.333/0001-81', // CNPJ
            'billing_im'       => '',
        ) );

        $this->assertNotEmpty(
            $this->error_notices(),
            'Para CNPJ com IM vazia o checkout deve acusar erro (IM é obrigatória).'
        );
    }

    public function test_validation_passes_when_im_is_filled(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '11.222.333/0001-81',
            'billing_im'       => '1.234.567-8',
        ) );

        $this->assertEmpty( $this->error_notices(), 'Uma IM preenchida deve satisfazer a obrigatoriedade.' );
    }

    public function test_validation_passes_for_cpf(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '123.456.789-09', // CPF (11 dígitos)
            'billing_im'       => '',
        ) );

        $this->assertEmpty( $this->error_notices(), 'CPF não exige IM.' );
    }

    public function test_validation_does_nothing_when_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_im_field', 'no' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '11.222.333/0001-81',
            'billing_im'       => '',
        ) );

        $this->assertEmpty( $this->error_notices(), 'Com o recurso desligado o woo-better não valida IM.' );
    }

    // --- Remoção do required (lkn_disabled_require_field) -------------------

    private function errors_with_im(): \WP_Error {
        $errors = new \WP_Error();
        $errors->add( 'billing_im_required', 'Inscrição Municipal (IM) é um campo obrigatório.' );

        return $errors;
    }

    public function test_required_removed_for_cpf(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $errors = $this->errors_with_im();
        $this->plugin()->lkn_disabled_require_field(
            array( 'billing_country' => 'BR', 'billing_document' => '123.456.789-09' ),
            $errors
        );

        $this->assertEmpty(
            $errors->get_error_message( 'billing_im_required' ),
            'Para CPF a IM não deve ser exigida.'
        );
    }

    public function test_required_removed_outside_brazil(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $errors = $this->errors_with_im();
        $this->plugin()->lkn_disabled_require_field(
            array( 'billing_country' => 'US', 'billing_document' => '11222333000181' ),
            $errors
        );

        $this->assertEmpty(
            $errors->get_error_message( 'billing_im_required' ),
            'Fora do Brasil a IM não deve ser exigida.'
        );
    }

    public function test_required_kept_for_cnpj_in_brazil(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $errors = $this->errors_with_im();
        $this->plugin()->lkn_disabled_require_field(
            array( 'billing_country' => 'BR', 'billing_document' => '11222333000181' ),
            $errors
        );

        $this->assertNotEmpty(
            $errors->get_error_message( 'billing_im_required' ),
            'CNPJ no Brasil deve manter a IM obrigatória.'
        );
    }

    // --- Handler do checkout em blocos --------------------------------------

    public function test_handle_update_stores_im_in_session(): void {
        $session = $this->ensure_wc_ready();

        $this->plugin()->handle_im_update( array( 'billing_im' => '1.234.567-8' ) );

        $this->assertSame( '1.234.567-8', $session->get( 'billing_im' ) );
    }
}
