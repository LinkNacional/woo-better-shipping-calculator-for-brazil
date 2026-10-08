<?php
/**
 * Regressão: o JS de front-end do plugin "Brazilian Market on WooCommerce" deve ser
 * desenfileirado no checkout clássico/shortcode quando o woo-better gerencia os
 * campos de pessoa.
 *
 * O JS do Brazilian (assets/js/frontend/frontend.js) esconde os campos
 * .person-type-field (incluindo o campo Empresa) quando o tipo de pessoa é CPF e
 * re-adiciona 'validate-required' ao campo Empresa para CNPJ — o que sumia com o
 * campo Empresa nos modos Opcional/Obrigatório (e bloqueava envio em Opcional+CNPJ
 * vazio). Como o woo-better substitui os recursos do Brazilian, desenfileiramos o
 * script dele.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class BrazilianScriptDequeueTest extends WP_UnitTestCase {

    private const HANDLE = 'woocommerce-extra-checkout-fields-for-brazil-front';

    private function enqueue_brazilian_script(): void {
        wp_register_script( self::HANDLE, 'https://example.com/frontend.js', array( 'jquery' ), '1.0.0', true );
        wp_enqueue_script( self::HANDLE );
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    public function test_dequeues_brazilian_front_script_when_person_type_enabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        $this->enqueue_brazilian_script();

        $this->plugin()->dequeue_brazilian_checkout_scripts();

        $this->assertFalse(
            wp_script_is( self::HANDLE, 'enqueued' ),
            'O JS do Brazilian deve ser desenfileirado no checkout quando o woo-better gerencia os campos de pessoa.'
        );
    }

    public function test_keeps_brazilian_front_script_when_person_type_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        $this->enqueue_brazilian_script();

        $this->plugin()->dequeue_brazilian_checkout_scripts();

        $this->assertTrue(
            wp_script_is( self::HANDLE, 'enqueued' ),
            'Sem o recurso de Tipo de Cliente o woo-better não gerencia a Empresa; o JS do Brazilian deve permanecer.'
        );
    }

    public function test_callback_is_registered_on_woocommerce_after_checkout_form(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        $this->enqueue_brazilian_script();

        // Dispara o hook real: valida que o callback está registrado nele (o plugin
        // registra os hooks no carregamento via loader->run()).
        do_action( 'woocommerce_after_checkout_form' );

        $this->assertFalse(
            wp_script_is( self::HANDLE, 'enqueued' ),
            'O callback de dequeue deve estar registrado no hook woocommerce_after_checkout_form.'
        );
    }
}
