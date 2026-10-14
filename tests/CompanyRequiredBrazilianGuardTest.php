<?php
/**
 * Regressão: campo Empresa obrigatório no checkout CLÁSSICO/shortcode quando o
 * plugin "Brazilian Market on WooCommerce" está ativo junto do woo-better.
 *
 * Contexto do bug:
 *   Com "Tipo de Cliente" ativo e "Comportamento do Campo Empresa" = Opcional,
 *   o cliente que informa um CNPJ tinha o envio bloqueado mesmo assim: o plugin
 *   Brazilian (woocommerce-extra-checkout-fields-for-brazil) força
 *   "Company is a required field" em valid_checkout_fields() (hook
 *   woocommerce_checkout_process) via wc_add_notice(). Esse aviso não passa pelo
 *   objeto $errors tratado em lkn_disabled_require_field(), então é preciso
 *   removê-lo do session (prioridade 11 do hook) para dar prioridade ao woo-better.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CompanyRequiredBrazilianGuardTest extends WP_UnitTestCase {

    /**
     * Aviso exato gerado pelo plugin Brazilian para o campo Empresa (sem tradução,
     * como fica com o text domain não carregado). Hardcoded de propósito: se a
     * string do Brazilian mudar, o teste quebra e o guard é revisado.
     */
    private const BRAZILIAN_COMPANY_MESSAGE = '<strong>Company</strong> is a required field.';

    private function ensure_session() {
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        if ( ! WC()->session ) {
            $this->markTestSkipped( 'Sessão do WooCommerce indisponível no ambiente de testes.' );
        }

        return WC()->session;
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function seed_error_notices( array $messages ): void {
        $error = array();
        foreach ( $messages as $message ) {
            $error[] = array( 'notice' => $message, 'data' => array() );
        }

        $this->ensure_session()->set( 'wc_notices', array( 'error' => $error ) );
    }

    private function error_notices(): array {
        $notices = $this->ensure_session()->get( 'wc_notices', array() );

        return isset( $notices['error'] ) ? $notices['error'] : array();
    }

    public function test_drops_company_notice_when_company_is_optional(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_company_field_behavior', 'optional' );
        $this->seed_error_notices( array( self::BRAZILIAN_COMPANY_MESSAGE, '<strong>CNPJ</strong> is a required field.' ) );

        $this->plugin()->guard_brazilian_company_required();

        $notices = $this->error_notices();
        $this->assertCount( 1, $notices, 'Apenas o aviso de Empresa do Brazilian deveria ser removido.' );
        $this->assertSame( '<strong>CNPJ</strong> is a required field.', $notices[0]['notice'] );
    }

    public function test_drops_company_notice_in_dynamic_mode(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_company_field_behavior', 'dynamic' );
        $this->seed_error_notices( array( self::BRAZILIAN_COMPANY_MESSAGE ) );

        $this->plugin()->guard_brazilian_company_required();

        $this->assertCount( 0, $this->error_notices(), 'No modo Dinâmico o aviso do Brazilian deve ser descartado.' );
    }

    public function test_keeps_company_notice_when_company_is_required(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_company_field_behavior', 'required' );
        $this->seed_error_notices( array( self::BRAZILIAN_COMPANY_MESSAGE ) );

        $this->plugin()->guard_brazilian_company_required();

        $this->assertCount( 1, $this->error_notices(), 'No modo Obrigatório o aviso do Brazilian deve ser mantido.' );
    }

    public function test_keeps_company_notice_when_person_type_is_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_company_field_behavior', 'optional' );
        $this->seed_error_notices( array( self::BRAZILIAN_COMPANY_MESSAGE ) );

        $this->plugin()->guard_brazilian_company_required();

        $this->assertCount( 1, $this->error_notices(), 'Sem o recurso de Tipo de Cliente o woo-better não gerencia a Empresa.' );
    }

    public function test_keeps_native_woocommerce_company_notice(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_company_field_behavior', 'optional' );

        // Aviso nativo do WooCommerce usa outro rótulo ("Company name") e outro text
        // domain — não pode ser confundido com o aviso do Brazilian.
        $native = '<strong>Company name</strong> is a required field.';
        $this->seed_error_notices( array( self::BRAZILIAN_COMPANY_MESSAGE, $native ) );

        $this->plugin()->guard_brazilian_company_required();

        $notices = $this->error_notices();
        $this->assertCount( 1, $notices, 'Somente o aviso do Brazilian deve ser removido.' );
        $this->assertSame( $native, $notices[0]['notice'], 'O aviso nativo do WooCommerce deve ser preservado.' );
    }
}
