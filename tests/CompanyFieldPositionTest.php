<?php
/**
 * Regressão: posição e obrigatoriedade do campo Empresa no checkout
 * CLÁSSICO/shortcode quando o plugin "Brazilian Market on WooCommerce" está ativo.
 *
 * Contexto dos bugs:
 *   1. Posição: o Brazilian redefine a prioridade do campo Empresa no filtro
 *      woocommerce_billing_fields (billing_company = 25), o que o coloca ACIMA do
 *      campo unificado de CPF/CNPJ (billing_document = 27). Nos modos Opcional e
 *      Obrigatório o woo-better não reafirmava a posição, então a escolha do
 *      Brazilian vencia.
 *   2. Obrigatoriedade: nos modos Opcional/Obrigatório o woo-better não definia o
 *      'required' do campo, herdando o valor deixado pelo Brazilian/option nativa —
 *      assim o campo aparecia como obrigatório mesmo com a configuração "Opcional".
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CompanyFieldPositionTest extends WP_UnitTestCase {

    /**
     * Campos como chegam ao filtro woocommerce_checkout_fields depois do Brazilian:
     * Empresa em 25 (acima) e com required=true herdado, e CPF/CNPJ unificado em 27.
     */
    private function incoming_fields(): array {
        return array(
            'billing'  => array(
                'billing_company'  => array(
                    'label'    => 'Company name',
                    'required' => true,
                    'priority' => 25,
                    'class'    => array( 'form-row-wide', 'person-type-field' ),
                ),
                'billing_document' => array(
                    'label'    => 'CPF/CNPJ',
                    'required' => true,
                    'priority' => 27,
                ),
            ),
            'shipping' => array(),
        );
    }

    private function apply( string $behavior ): array {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_company_field_behavior', $behavior );

        return ( new WcBetterShippingCalculatorForBrazil() )->wc_better_calc_checkout_fields( $this->incoming_fields() );
    }

    public function test_company_stays_below_document_in_optional_mode(): void {
        $fields = $this->apply( 'optional' );

        $this->assertArrayHasKey( 'billing_company', $fields['billing'] );
        $this->assertGreaterThan(
            $fields['billing']['billing_document']['priority'],
            $fields['billing']['billing_company']['priority'],
            'No modo Opcional o campo Empresa deve ficar abaixo do CPF/CNPJ, sobrepondo o Brazilian.'
        );
        $this->assertSame( 31, $fields['billing']['billing_company']['priority'] );
    }

    public function test_company_stays_below_document_in_required_mode(): void {
        $fields = $this->apply( 'required' );

        $this->assertGreaterThan(
            $fields['billing']['billing_document']['priority'],
            $fields['billing']['billing_company']['priority'],
            'No modo Obrigatório o campo Empresa deve ficar abaixo do CPF/CNPJ.'
        );
        $this->assertSame( 31, $fields['billing']['billing_company']['priority'] );
    }

    public function test_company_stays_below_document_in_dynamic_mode(): void {
        $fields = $this->apply( 'dynamic' );

        $this->assertGreaterThan(
            $fields['billing']['billing_document']['priority'],
            $fields['billing']['billing_company']['priority'],
            'No modo Dinâmico o campo Empresa deve continuar abaixo do CPF/CNPJ.'
        );
        $this->assertSame( 31, $fields['billing']['billing_company']['priority'] );
    }

    public function test_company_is_optional_in_optional_mode(): void {
        $fields = $this->apply( 'optional' );

        $this->assertFalse(
            (bool) $fields['billing']['billing_company']['required'],
            'No modo Opcional o campo Empresa NÃO deve ser obrigatório, mesmo que o Brazilian/option nativa o marque como required.'
        );
    }

    public function test_company_is_required_in_required_mode(): void {
        $fields = $this->apply( 'required' );

        $this->assertTrue(
            (bool) $fields['billing']['billing_company']['required'],
            'No modo Obrigatório o campo Empresa deve ser exigido.'
        );
    }

    public function test_company_is_required_in_dynamic_mode(): void {
        $fields = $this->apply( 'dynamic' );

        $this->assertTrue(
            (bool) $fields['billing']['billing_company']['required'],
            'No modo Dinâmico o campo Empresa começa exigido (ajustado por CPF/CNPJ no JS).'
        );
    }

    public function test_company_keeps_person_type_field_class_in_optional_mode(): void {
        $fields = $this->apply( 'optional' );

        $this->assertContains(
            'person-type-field',
            (array) $fields['billing']['billing_company']['class'],
            'A classe person-type-field deve ser preservada (outros consumidores podem usá-la); o woo-better controla a visibilidade desenfileirando o JS do Brazilian.'
        );
    }

    public function test_company_keeps_person_type_field_class_in_required_mode(): void {
        $fields = $this->apply( 'required' );

        $this->assertContains(
            'person-type-field',
            (array) $fields['billing']['billing_company']['class'],
            'A classe person-type-field deve ser preservada (outros consumidores podem usá-la).'
        );
    }

    public function test_company_keeps_person_type_field_class_in_dynamic_mode(): void {
        $fields = $this->apply( 'dynamic' );

        $this->assertContains(
            'person-type-field',
            (array) $fields['billing']['billing_company']['class'],
            'No modo Dinâmico a classe person-type-field também deve ser preservada (só garantimos o form-row-wide).'
        );
    }

    public function test_absent_company_field_is_not_created_in_optional_or_required_mode(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );

        foreach ( array( 'optional', 'required' ) as $behavior ) {
            update_option( 'woo_better_calc_company_field_behavior', $behavior );

            // Loja com o campo Empresa oculto: WC remove billing_company antes do filtro.
            $incoming = $this->incoming_fields();
            unset( $incoming['billing']['billing_company'] );

            $fields = ( new WcBetterShippingCalculatorForBrazil() )->wc_better_calc_checkout_fields( $incoming );

            $this->assertArrayNotHasKey(
                'billing_company',
                $fields['billing'],
                "Nos modos Opcional/Obrigatório o woo-better não deve recriar um campo Empresa oculto ({$behavior})."
            );
        }
    }
}
