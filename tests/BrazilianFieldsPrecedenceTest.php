<?php
/**
 * Regressão: precedência dos campos do woo-better sobre o plugin "Brazilian Market
 * on WooCommerce" (woocommerce-extra-checkout-fields-for-brazil) no checkout
 * CLÁSSICO/shortcode.
 *
 * O Brazilian registra os campos dele em `woocommerce_billing_fields` /
 * `woocommerce_shipping_fields` (prioridade 10), ANTES do woo-better. Regra do
 * woo-better:
 *
 *   - quando o RECURSO do woo-better está ligado, a definição dele vence —
 *     sobrepõe o campo equivalente do Brazilian (que está sem manutenção);
 *   - quando o RECURSO do woo-better está desligado, o campo do Brazilian
 *     permanece — ou seja, o Brazilian manda.
 *
 * Recursos cobertos: Tipo de Cliente/CPF-CNPJ, Empresa, IE, Bairro, Número,
 * Nascimento, Gênero e Celular. O RG é exclusivo do Brazilian (o woo-better não
 * tem esse recurso) e é deixado intacto.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class BrazilianFieldsPrecedenceTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    /**
     * Campos como o Brazilian os deixa no array `woocommerce_checkout_fields`
     * (ele os registra em woocommerce_billing_fields/shipping_fields, prioridade 10).
     */
    private function brazilian_incoming(): array {
        return array(
            'billing'  => array(
                'billing_persontype'   => array( 'type' => 'select', 'label' => 'Person type', 'priority' => 22 ),
                'billing_cpf'          => array( 'type' => 'tel', 'label' => 'CPF', 'priority' => 23 ),
                'billing_rg'           => array( 'label' => 'RG', 'priority' => 24 ),
                'billing_cnpj'         => array( 'type' => 'tel', 'label' => 'CNPJ', 'priority' => 26 ),
                'billing_ie'           => array( 'label' => 'State Registration', 'priority' => 27 ),
                'billing_birthdate'    => array( 'label' => 'Birthdate', 'priority' => 31 ),
                'billing_gender'       => array( 'type' => 'select', 'label' => 'Gender', 'priority' => 32 ),
                'billing_number'       => array( 'label' => 'Number', 'priority' => 55 ),
                'billing_neighborhood' => array( 'label' => 'Neighborhood', 'priority' => 65 ),
                'billing_company'      => array( 'label' => 'Company name', 'required' => true, 'priority' => 25, 'class' => array( 'form-row-wide', 'person-type-field' ) ),
            ),
            'shipping' => array(
                'shipping_number'       => array( 'label' => 'Number', 'priority' => 55 ),
                'shipping_neighborhood' => array( 'label' => 'Neighborhood', 'priority' => 65 ),
            ),
        );
    }

    /**
     * Reproduz a cadeia dos dois filtros do woo-better sobre
     * `woocommerce_checkout_fields`: lkn_add_custom_checkout_field (prioridade 100)
     * e wc_better_calc_checkout_fields (prioridade 999, a última palavra).
     */
    private function run_full_chain( array $fields ): array {
        $plugin = $this->plugin();
        $fields = $plugin->lkn_add_custom_checkout_field( $fields );

        return $plugin->wc_better_calc_checkout_fields( $fields );
    }

    // --- Tipo de Cliente / CPF-CNPJ -----------------------------------------

    public function test_person_type_disabled_keeps_brazilian_fields(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'select', $fields['billing']['billing_persontype']['type'] );
        $this->assertSame( 'tel', $fields['billing']['billing_cpf']['type'] );
        $this->assertArrayNotHasKey( 'billing_document', $fields['billing'] );
    }

    public function test_person_type_enabled_hides_brazilian_cpf_and_adds_document(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertArrayHasKey( 'billing_document', $fields['billing'], 'Com o Tipo de Cliente ligado o woo-better gera o campo unificado.' );
        $this->assertSame( 'hidden', $fields['billing']['billing_cpf']['type'] );
        $this->assertSame( 'hidden', $fields['billing']['billing_cnpj']['type'] );
        $this->assertSame( 'hidden', $fields['billing']['billing_persontype']['type'] );
    }

    // --- IE ----------------------------------------------------------------

    public function test_ie_disabled_keeps_brazilian_field(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_ie_field', 'no' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'State Registration', $fields['billing']['billing_ie']['label'] );
    }

    public function test_ie_enabled_overrides_brazilian_field(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Inscrição Estadual (IE)', $fields['billing']['billing_ie']['label'] );
    }

    // --- Bairro ------------------------------------------------------------

    public function test_neighborhood_disabled_keeps_brazilian_fields(): void {
        update_option( 'woo_better_calc_enable_neighborhood_field', 'no' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Neighborhood', $fields['billing']['billing_neighborhood']['label'] );
        $this->assertSame( 'Neighborhood', $fields['shipping']['shipping_neighborhood']['label'] );
    }

    public function test_neighborhood_enabled_overrides_brazilian_fields(): void {
        update_option( 'woo_better_calc_enable_neighborhood_field', 'yes' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Bairro', $fields['billing']['billing_neighborhood']['label'] );
        $this->assertSame( 'Bairro', $fields['shipping']['shipping_neighborhood']['label'] );
    }

    // --- Número ------------------------------------------------------------

    public function test_number_disabled_keeps_brazilian_fields(): void {
        update_option( 'woo_better_calc_number_required', 'no' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Number', $fields['billing']['billing_number']['label'] );
    }

    public function test_number_enabled_overrides_brazilian_fields(): void {
        update_option( 'woo_better_calc_number_required', 'yes' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Número', $fields['billing']['billing_number']['label'] );
        $this->assertSame( 'Número', $fields['shipping']['shipping_number']['label'] );
    }

    // --- Nascimento --------------------------------------------------------

    public function test_birthdate_disabled_keeps_brazilian_field(): void {
        update_option( 'woo_better_calc_enable_birthdate_field', 'no' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Birthdate', $fields['billing']['billing_birthdate']['label'] );
    }

    public function test_birthdate_enabled_overrides_brazilian_field(): void {
        update_option( 'woo_better_calc_enable_birthdate_field', 'yes' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Data de Nascimento', $fields['billing']['billing_birthdate']['label'] );
    }

    // --- Gênero ------------------------------------------------------------

    public function test_gender_disabled_keeps_brazilian_field(): void {
        update_option( 'woo_better_calc_enable_gender_field', 'no' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Gender', $fields['billing']['billing_gender']['label'] );
    }

    public function test_gender_enabled_overrides_brazilian_field(): void {
        update_option( 'woo_better_calc_enable_gender_field', 'yes' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame( 'Gênero', $fields['billing']['billing_gender']['label'] );
    }

    // --- RG (exclusivo do Brazilian) ---------------------------------------

    public function test_rg_field_from_brazilian_is_left_untouched(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );

        $fields = $this->run_full_chain( $this->brazilian_incoming() );

        $this->assertSame(
            'RG',
            $fields['billing']['billing_rg']['label'],
            'O woo-better não tem recurso de RG; o campo do Brazilian deve permanecer.'
        );
    }

    // --- Celular (filtro woocommerce_billing_fields, prioridade 99) ---------

    /**
     * Campo de celular como o Brazilian o deixa (`tel`, obrigatório, prioridade 105).
     */
    private function brazilian_cellphone_field(): array {
        return array(
            'label'    => 'Cell Phone',
            'type'     => 'tel',
            'class'    => array( 'form-row-last' ),
            'clear'    => true,
            'validate' => array( 'phone' ),
            'required' => true,
            'priority' => 105,
        );
    }

    public function test_cellphone_enabled_overrides_brazilian(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = array( 'billing_cellphone' => $this->brazilian_cellphone_field() );

        $result = $this->plugin()->add_cellphone_billing_fields( $fields );

        $this->assertSame( 'Celular', $result['billing_cellphone']['label'] );
        $this->assertArrayHasKey(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_FIELD_ATTR,
            $result['billing_cellphone']['custom_attributes'],
            'Quando o woo-better gera um campo de celular VISÍVEL, ele vence o Brazilian.'
        );
    }

    public function test_cellphone_shim_overrides_brazilian(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $fields = array( 'billing_cellphone' => $this->brazilian_cellphone_field() );

        $result = $this->plugin()->add_cellphone_billing_fields( $fields );

        $this->assertSame(
            'hidden',
            $result['billing_cellphone']['type'],
            'No modo shim (Celular e Fixo + Campo de Celular desligado) o woo-better ainda vence o Brazilian.'
        );
        $this->assertArrayHasKey(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_FIELD_ATTR,
            $result['billing_cellphone']['custom_attributes']
        );
    }

    public function test_cellphone_kept_when_woo_better_does_not_generate(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        $brazilian = $this->brazilian_cellphone_field();
        $fields    = array( 'billing_cellphone' => $brazilian );

        $result = $this->plugin()->add_cellphone_billing_fields( $fields );

        $this->assertSame(
            $brazilian,
            $result['billing_cellphone'],
            'No modo "Somente Fixo" o woo-better não gera celular: o campo do Brazilian permanece.'
        );
    }

    public function test_woo_better_adds_shipping_cellphone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        // O Brazilian só registra o celular em billing; o shipping é do woo-better.
        $result = $this->plugin()->add_cellphone_shipping_fields( array() );

        $this->assertArrayHasKey( 'shipping_cellphone', $result );
        $this->assertArrayHasKey(
            WcBetterShippingCalculatorForBrazil::CELLPHONE_FIELD_ATTR,
            $result['shipping_cellphone']['custom_attributes']
        );
    }
}
