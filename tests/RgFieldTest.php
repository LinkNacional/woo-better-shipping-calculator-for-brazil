<?php
/**
 * Regressão: campo de RG (documento de PESSOA FÍSICA, vinculado ao CPF).
 *
 * Regras cobertas:
 *   - gate de exibição: `woo_better_calc_enable_rg_field` = yes E Tipo de Cliente
 *     permitindo pessoa física (`physical`/`both`). É o INVERSO do IE/IM (que só
 *     existem para pessoa jurídica);
 *   - obrigatoriedade opcional (`woo_better_calc_rg_required`, padrão: opcional);
 *   - validação clássica: só exige o RG quando o documento é um CPF (11 dígitos);
 *     com CNPJ nada é exigido (o campo fica oculto no front);
 *   - meta IDENTICA à do plugin "Brazilian Market on WooCommerce": user meta
 *     `billing_rg` e order meta `_billing_rg` (id universal aceito pelos
 *     aplicativos de NF-e), com o woo-better tendo precedência;
 *   - normalize do valor (maiúsculas, sem símbolos estranhos, máx. 20 chars);
 *   - presença do campo no PERFIL (wp-admin) e no EDIT-ADDRESS.
 *
 * Não há validação de dígito verificador: o RG não tem padrão nacional (o
 * cálculo varia por UF).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class RgFieldTest extends WP_UnitTestCase {

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

    public function test_field_added_when_enabled_and_physical_person(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'no' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayHasKey( 'billing_rg', $fields['billing'] );
        $this->assertSame( 'RG', $fields['billing']['billing_rg']['label'] );
        $this->assertSame( '20', (string) $fields['billing']['billing_rg']['custom_attributes']['maxlength'] );
        $this->assertTrue( in_array( 'woo-better-rg-field', $fields['billing']['billing_rg']['class'], true ) );
    }

    public function test_field_added_for_both_person_types(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayHasKey( 'billing_rg', $fields['billing'] );
    }

    public function test_field_absent_for_legal_person(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayNotHasKey(
            'billing_rg',
            $fields['billing'],
            'RG é documento de pessoa física: nunca deve existir no modo exclusivamente jurídico.'
        );
    }

    public function test_field_absent_when_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'no' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayNotHasKey( 'billing_rg', $fields['billing'] );
    }

    public function test_field_absent_when_person_type_none(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertArrayNotHasKey( 'billing_rg', $fields['billing'] );
    }

    // --- Obrigatoriedade opcional -------------------------------------------

    public function test_field_is_optional_by_default(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        delete_option( 'woo_better_calc_rg_required' );

        $fields = $this->apply_checkout_fields();

        $this->assertFalse(
            (bool) $fields['billing']['billing_rg']['required'],
            'O RG é OPCIONAL por padrão (o lojista liga a obrigatoriedade).'
        );
    }

    public function test_field_required_when_option_enabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'yes' );

        $fields = $this->apply_checkout_fields();

        $this->assertTrue( (bool) $fields['billing']['billing_rg']['required'] );
    }

    // --- Posição no formulário (prioridade) ---------------------------------

    /**
     * Campos VISÍVEIS agrupados por prioridade (ignora `type=hidden`, que ocupa o
     * slot mas não tem altura — empatar com eles é inofensivo).
     */
    private function visible_priorities( array $fields ): array {
        $by_priority = array();

        foreach ( $fields as $key => $field ) {
            if ( ! is_array( $field ) || ! isset( $field['priority'] ) ) {
                continue;
            }
            if ( isset( $field['type'] ) && 'hidden' === $field['type'] ) {
                continue;
            }
            $by_priority[ (int) $field['priority'] ][] = $key;
        }

        return $by_priority;
    }

    private function assert_no_visible_tie( array $fields, string $context ): void {
        foreach ( $this->visible_priorities( $fields ) as $priority => $keys ) {
            $this->assertCount(
                1,
                $keys,
                sprintf( '[%s] prioridade %d empatada entre campos visíveis: %s', $context, $priority, implode( ', ', $keys ) )
            );
        }
    }

    private function enable_all_person_fields(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );
        update_option( 'woo_better_calc_cep_field_position', 'yes' );
        update_option( 'woo_better_calc_enable_auto_address_fill', 'yes' );
        update_option( 'woo_better_calc_company_field_behavior', 'dynamic' );
    }

    public function test_rg_priority_is_right_after_the_document(): void {
        $this->enable_all_person_fields();

        $fields = $this->plugin()->wc_better_calc_checkout_fields( array(
            'billing'  => array( 'billing_postcode' => array( 'type' => 'text', 'priority' => 65 ) ),
            'shipping' => array(),
        ) );

        $rg_priority = (int) $fields['billing']['billing_rg']['priority'];

        $this->assertSame(
            (int) $fields['billing']['billing_document']['priority'] + 1,
            $rg_priority,
            'O RG deve ficar imediatamente após o CPF/CNPJ (documento é o campo pai).'
        );

        $this->assertLessThan(
            (int) $fields['billing']['billing_postcode']['priority'],
            $rg_priority,
            'O CEP não pode ficar acima do RG (bug: RG em 34 empatava com o CEP em 34 e caía depois do checkbox).'
        );

        $this->assertLessThan(
            (int) $fields['billing']['wc_better_calc_checkbox_billing']['priority'],
            $rg_priority,
            'O checkbox do CEP (35) não pode ficar acima do RG.'
        );

        $this->assert_no_visible_tie( $fields['billing'], 'checkout clássico' );
    }

    public function test_rg_priority_never_ties_a_visible_field_in_any_combination(): void {
        $combinations = array(
            'company dynamic'  => array( 'woo_better_calc_company_field_behavior' => 'dynamic' ),
            'company disabled' => array( 'woo_better_calc_company_field_behavior' => 'disabled' ),
            'company required' => array( 'woo_better_calc_company_field_behavior' => 'required' ),
            'sem IE/IM'        => array(
                'woo_better_calc_enable_ie_field' => 'no',
                'woo_better_calc_enable_im_field' => 'no',
            ),
            'com número e nascimento' => array(
                'woo_better_calc_number_required'         => 'yes',
                'woo_better_calc_enable_birthdate_field' => 'yes',
                'woo_better_calc_enable_gender_field'    => 'yes',
            ),
        );

        foreach ( $combinations as $label => $options ) {
            $this->enable_all_person_fields();
            foreach ( $options as $option => $value ) {
                update_option( $option, $value );
            }

            $fields = $this->plugin()->wc_better_calc_checkout_fields( array(
                'billing'  => array( 'billing_postcode' => array( 'type' => 'text', 'priority' => 65 ) ),
                'shipping' => array(),
            ) );

            $this->assertArrayHasKey( 'billing_rg', $fields['billing'], 'combinação: ' . $label );
            $this->assert_no_visible_tie( $fields['billing'], 'checkout clássico / ' . $label );
        }
    }

    public function test_edit_address_rg_priority_skips_the_visible_company_slot(): void {
        $this->enable_all_person_fields();

        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );

        $fields = $this->plugin()->add_edit_address_billing_fields(
            array( 'billing_country' => array( 'value' => 'BR' ) )
        );

        // No edit-address a Empresa ocupa 28 (visível) — o RG NÃO pode empatar.
        $this->assertSame( 28, (int) $fields['billing_company']['priority'], 'pré-requisito do cenário' );
        $this->assertSame(
            29,
            (int) $fields['billing_rg']['priority'],
            'No edit-address o RG deve pular o slot ocupado pela Empresa.'
        );

        $this->assert_no_visible_tie( $fields, 'edit-address' );
    }

    public function test_rg_priority_ignores_hidden_fields_when_choosing_the_slot(): void {
        $this->enable_all_person_fields();

        $fields = $this->plugin()->wc_better_calc_checkout_fields( array(
            'billing'  => array( 'billing_postcode' => array( 'type' => 'text', 'priority' => 65 ) ),
            'shipping' => array(),
        ) );

        // `billing_persontype` (hidden) também está em 28: empatar com um campo
        // invisível é aceitável (não tem altura), e é o que permite o RG ficar
        // colado no documento.
        $this->assertSame( 'hidden', $fields['billing']['billing_persontype']['type'] );
        $this->assertSame( 28, (int) $fields['billing']['billing_persontype']['priority'] );
        $this->assertSame( 28, (int) $fields['billing']['billing_rg']['priority'] );
    }

    // --- Validação clássica -------------------------------------------------

    private function validate_with( array $post ): void {
        $this->ensure_wc_ready();
        WC()->session->set( 'wc_notices', array() );

        $backup = $_POST;
        $_POST = $post;

        $this->plugin()->validate_rg_field_value_classic();

        $_POST = $backup;
    }

    public function test_validation_adds_notice_for_cpf_without_rg_when_required(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'yes' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '123.456.789-09', // CPF
            'billing_rg'       => '',
        ) );

        $this->assertNotEmpty( $this->error_notices(), 'Com CPF + RG obrigatório, o RG vazio deve bloquear o checkout.' );
    }

    public function test_validation_passes_when_rg_is_filled(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'yes' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '123.456.789-09',
            'billing_rg'       => '12.345.678-9',
        ) );

        $this->assertEmpty( $this->error_notices(), 'Um RG preenchido deve satisfazer a obrigatoriedade.' );
    }

    public function test_validation_does_nothing_for_cnpj(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'yes' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '11.222.333/0001-81', // CNPJ
            'billing_rg'       => '',
        ) );

        $this->assertEmpty( $this->error_notices(), 'Para CNPJ o RG fica oculto, então não pode ser exigido.' );
    }

    public function test_validation_does_nothing_when_optional(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'no' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '123.456.789-09',
            'billing_rg'       => '',
        ) );

        $this->assertEmpty( $this->error_notices(), 'Com a opção "opcional" o RG nunca é exigido.' );
    }

    public function test_validation_does_nothing_when_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'no' );
        update_option( 'woo_better_calc_rg_required', 'yes' );

        $this->validate_with( array(
            'billing_country'  => 'BR',
            'billing_document' => '123.456.789-09',
            'billing_rg'       => '',
        ) );

        $this->assertEmpty( $this->error_notices(), 'Com o recurso desligado o woo-better não valida RG.' );
    }

    // --- Handler do checkout em blocos + normalize --------------------------

    public function test_handle_update_stores_normalized_rg_in_session(): void {
        $session = $this->ensure_wc_ready();

        $this->plugin()->handle_rg_update( array( 'billing_rg' => '12.345.678-x ' ) );

        $this->assertSame( '12.345.678-X', $session->get( 'billing_rg' ) );
    }

    public function test_handle_update_strips_invalid_characters(): void {
        $session = $this->ensure_wc_ready();

        $this->plugin()->handle_rg_update( array( 'billing_rg' => '12@345#678-9<script>' ) );

        // sanitize_text_field remove as tags e o preg_replace derruba @ e #;
        // dígitos, ponto e hífen são preservados (formato do Brazilian).
        $this->assertSame( '12345678-9', $session->get( 'billing_rg' ) );
    }

    public function test_handle_update_limits_length(): void {
        $session = $this->ensure_wc_ready();

        $this->plugin()->handle_rg_update( array( 'billing_rg' => '123456789012345678901234567890' ) );

        $this->assertSame( 20, strlen( $session->get( 'billing_rg' ) ) );
    }

    // --- Perfil (wp-admin/profile.php) --------------------------------------

    private function base_profile_fields(): array {
        return array(
            'billing'  => array(
                'title'  => 'Cobrança',
                'fields' => array(
                    'billing_first_name' => array( 'label' => 'Nome' ),
                    'billing_last_name'  => array( 'label' => 'Sobrenome' ),
                    'billing_rg'         => array( 'label' => 'RG do Brazilian' ),
                    'billing_address_1'  => array( 'label' => 'Endereço' ),
                    'billing_city'       => array( 'label' => 'Cidade' ),
                    'billing_postcode'   => array( 'label' => 'CEP' ),
                    'billing_country'    => array( 'label' => 'País', 'type' => 'select' ),
                    'billing_state'      => array( 'label' => 'Estado', 'type' => 'select' ),
                    'billing_phone'      => array( 'label' => 'Telefone' ),
                    'billing_email'      => array( 'label' => 'E-mail' ),
                ),
            ),
            'shipping' => array(
                'title'  => 'Entrega',
                'fields' => array(
                    'shipping_first_name' => array( 'label' => 'Nome' ),
                    'shipping_last_name'  => array( 'label' => 'Sobrenome' ),
                    'shipping_address_1'  => array( 'label' => 'Endereço' ),
                    'shipping_city'       => array( 'label' => 'Cidade' ),
                    'shipping_country'    => array( 'label' => 'País', 'type' => 'select' ),
                ),
            ),
        );
    }

    public function test_profile_shows_rg_field_when_enabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $fields = $this->plugin()->add_customer_meta_fields( $this->base_profile_fields() );

        $this->assertArrayHasKey( 'billing_rg', $fields['billing']['fields'] );
        $this->assertSame( 'RG', $fields['billing']['fields']['billing_rg']['label'] );
    }

    public function test_profile_keeps_brazilian_rg_when_our_field_is_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'no' );

        $fields = $this->plugin()->add_customer_meta_fields( $this->base_profile_fields() );

        $this->assertArrayHasKey( 'billing_rg', $fields['billing']['fields'] );
        $this->assertSame( 'RG do Brazilian', $fields['billing']['fields']['billing_rg']['label'] );
    }

    // --- Gravação da meta no pedido (clássico) ------------------------------

    /**
     * Chama o método privado de gravação do RG no pedido (clássico).
     */
    private function process_rg_from_data( \WC_Order $order, array $data ): void {
        $method = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'process_rg_from_data' );
        $method->setAccessible( true );
        $method->invoke( $this->plugin(), $order, $data );
    }

    public function test_order_meta_is_saved_for_cpf(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $order = new \WC_Order();
        $this->process_rg_from_data( $order, array(
            'billing_document' => '123.456.789-09',
            'billing_rg'       => '12.345.678-x',
        ) );

        $this->assertSame(
            '12.345.678-X',
            $order->get_meta( '_billing_rg' ),
            'O RG deve ser gravado no meta `_billing_rg` (mesmo id do plugin Brazilian), em maiúsculas.'
        );
    }

    public function test_order_meta_is_cleared_for_cnpj(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_rg', '12.345.678-9' );

        $this->process_rg_from_data( $order, array(
            'billing_document' => '11.222.333/0001-81',
            'billing_rg'       => '12.345.678-9',
        ) );

        $this->assertSame( '', $order->get_meta( '_billing_rg' ), 'Pedido de pessoa jurídica não deve carregar RG.' );
    }

    public function test_order_meta_is_untouched_when_feature_is_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'no' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_rg', '99.999.999-9' );

        $this->process_rg_from_data( $order, array(
            'billing_document' => '11.222.333/0001-81',
            'billing_rg'       => '',
        ) );

        $this->assertSame(
            '99.999.999-9',
            $order->get_meta( '_billing_rg' ),
            'Com o recurso desligado o woo-better não mexe no RG (Brazilian/outro plugin manda).'
        );
    }

    // --- Exibição no pedido (recibo / admin "Dados do Cliente") -------------

    private function prepare_display_data( \WC_Order $order, string $billing_persontype ): array {
        $method = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'prepare_billing_display_data' );
        $method->setAccessible( true );

        return $method->invoke(
            $this->plugin(),
            $order,
            'both',
            'no',
            $billing_persontype,
            $order->get_meta( '_billing_cpf' ),
            $order->get_meta( '_billing_cnpj' ),
            '+55'
        );
    }

    public function test_display_rows_include_rg_for_physical_person(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_cpf', '123.456.789-09' );
        $order->update_meta_data( '_billing_rg', '12.345.678-9' );

        $rows = $this->prepare_display_data( $order, '1' );

        $this->assertArrayHasKey( 'rg', $rows );
        $this->assertSame( 'RG', $rows['rg']['label'] );
        $this->assertSame( '12.345.678-9', $rows['rg']['value'] );
    }

    public function test_display_rows_hide_rg_for_legal_person(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_cnpj', '11.222.333/0001-81' );
        $order->update_meta_data( '_billing_rg', '12.345.678-9' );

        $rows = $this->prepare_display_data( $order, '2' );

        $this->assertArrayNotHasKey( 'rg', $rows, 'O RG não deve aparecer nos dados do cliente de pessoa jurídica.' );
    }

    // --- Edit-address (minha conta) -----------------------------------------

    public function test_edit_address_shows_rg_field_with_saved_value(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'no' );

        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );
        update_user_meta( $user_id, 'billing_rg', '12.345.678-9' );

        $fields = $this->plugin()->add_edit_address_billing_fields(
            array( 'billing_country' => array( 'value' => 'BR' ) )
        );

        $this->assertArrayHasKey( 'billing_rg', $fields );
        $this->assertSame( '12.345.678-9', $fields['billing_rg']['value'] );
        $this->assertFalse( (bool) $fields['billing_rg']['required'] );
    }
}
