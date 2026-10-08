<?php
/**
 * Regressão: validação do campo Empresa no checkout CLÁSSICO/shortcode
 * (woocommerce_after_checkout_validation -> lkn_disabled_require_field).
 *
 * Cenários cobertos:
 *   - Dinâmico + CPF + Empresa vazia  → o erro 'billing_company_required' é removido
 *     (o pedido passa; Empresa só é exigida quando há CNPJ).
 *   - Dinâmico + CNPJ                 → o erro de Empresa permanece (empresa é exigida).
 *   - Dinâmico + país fora do Brasil  → o erro de Empresa é removido.
 *   - Opcional/Obrigatório            → o woo-better NÃO mexe nos erros (decisão do WC).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_Error;
use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CompanyFieldCheckoutValidationTest extends WP_UnitTestCase {

    /**
     * Simula o WP_Error que o WooCommerce preenche com os campos obrigatórios
     * ausentes antes do filtro de validação.
     */
    private function errors_with_company(): WP_Error {
        $errors = new WP_Error();
        $errors->add( 'billing_company_required', '<strong>Company</strong> is a required field.' );

        return $errors;
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    public function test_dynamic_with_cpf_and_empty_company_passes(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_company_field_behavior', 'dynamic' );

        $data = array(
            'billing_country'  => 'BR',
            'billing_persontype' => '1',
            'billing_document' => '123.456.789-09', // CPF (11 dígitos)
            'billing_cpf'      => '12345678909',
            'billing_company'  => '', // Empresa vazia
        );
        $errors = $this->errors_with_company();

        $this->plugin()->lkn_disabled_require_field( $data, $errors );

        $this->assertEmpty(
            $errors->get_error_message( 'billing_company_required' ),
            'No modo Dinâmico, CPF com Empresa vazia deve passar (Empresa só é exigida com CNPJ).'
        );
    }

    public function test_dynamic_with_cnpj_keeps_company_required(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_company_field_behavior', 'dynamic' );

        $data = array(
            'billing_country'  => 'BR',
            'billing_persontype' => '2',
            'billing_document' => '11.222.333/0001-81', // CNPJ (14 caracteres)
            'billing_cnpj'     => '11222333000181',
            'billing_company'  => '',
        );
        $errors = $this->errors_with_company();

        $this->plugin()->lkn_disabled_require_field( $data, $errors );

        $this->assertNotEmpty(
            $errors->get_error_message( 'billing_company_required' ),
            'No modo Dinâmico, CNPJ sem Empresa deve continuar exigindo o campo.'
        );
    }

    public function test_dynamic_outside_brazil_drops_company_required(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_company_field_behavior', 'dynamic' );

        $data = array(
            'billing_country'  => 'US',
            'billing_document' => '11222333000181', // CNPJ
            'billing_company'  => '',
        );
        $errors = $this->errors_with_company();

        $this->plugin()->lkn_disabled_require_field( $data, $errors );

        $this->assertEmpty(
            $errors->get_error_message( 'billing_company_required' ),
            'Fora do Brasil, em modo Dinâmico, a Empresa não deve ser exigida.'
        );
    }

    public function test_optional_mode_does_not_touch_company_error(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_company_field_behavior', 'optional' );

        $data = array(
            'billing_country'  => 'BR',
            'billing_document' => '123.456.789-09', // CPF
            'billing_company'  => '',
        );
        $errors = $this->errors_with_company();

        $this->plugin()->lkn_disabled_require_field( $data, $errors );

        $this->assertNotEmpty(
            $errors->get_error_message( 'billing_company_required' ),
            'Nos modos Opcional/Obrigatório a obrigatoriedade é do WooCommerce; o woo-better não remove o erro.'
        );
    }

    public function test_required_mode_does_not_touch_company_error(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_company_field_behavior', 'required' );

        $data = array(
            'billing_country'  => 'BR',
            'billing_document' => '123.456.789-09', // CPF
            'billing_company'  => '',
        );
        $errors = $this->errors_with_company();

        $this->plugin()->lkn_disabled_require_field( $data, $errors );

        $this->assertNotEmpty(
            $errors->get_error_message( 'billing_company_required' ),
            'No modo Obrigatório o WooCommerce deve continuar exigindo a Empresa.'
        );
    }
}
