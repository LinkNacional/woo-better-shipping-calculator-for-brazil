<?php
/**
 * Regressão: campos do woo-better na página de PERFIL (wp-admin/profile.php /
 * user-edit.php), com precedência sobre o plugin "Brazilian Market on WooCommerce".
 *
 * Contexto do bug:
 *   O woo-better saía fora do filtro woocommerce_customer_meta_fields quando o
 *   Brazilian estava ativo, então o Brazilian controlava o perfil — e:
 *     1. não havia o documento unificado (CPF/CNPJ) nem a Inscrição Municipal (IM);
 *     2. o bloco de ENTREGA ficava SEM telefone/celular (o Brazilian remove
 *        shipping_phone do array);
 *     3. o telefone era gravado com máscara (o perfil salva o valor como está).
 *
 * Correção:
 *   - add_customer_meta_fields roda em prioridade 99 (após o Brazilian) e monta o
 *     conjunto do woo-better (documento unificado, IE/IM, número, bairro, nascimento,
 *     gênero, Telefone/Celular em cobrança E entrega);
 *   - save_customer_meta_fields_extra (personal_options_update / edit_user_profile_update,
 *     prioridade 20) divide o documento em CPF/CNPJ/persontype e grava os telefones em E.164.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class ProfileFieldsTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    /**
     * Array de campos como o Brazilian/nativo deixam (billing e shipping).
     */
    private function base_fields(): array {
        return array(
            'billing'  => array(
                'title'  => 'Cobrança',
                'fields' => array(
                    'billing_first_name' => array( 'label' => 'Nome' ),
                    'billing_last_name'  => array( 'label' => 'Sobrenome' ),
                    'billing_cpf'        => array( 'label' => 'CPF' ),
                    'billing_company'    => array( 'label' => 'Empresa' ),
                    'billing_cnpj'       => array( 'label' => 'CNPJ' ),
                    'billing_ie'         => array( 'label' => 'State Registration' ),
                    'billing_address_1'  => array( 'label' => 'Endereço' ),
                    'billing_address_2'  => array( 'label' => 'Compl.' ),
                    'billing_city'       => array( 'label' => 'Cidade' ),
                    'billing_postcode'   => array( 'label' => 'CEP' ),
                    'billing_country'    => array( 'label' => 'País', 'type' => 'select' ),
                    'billing_state'      => array( 'label' => 'Estado', 'type' => 'select' ),
                    'billing_phone'      => array( 'label' => 'Telefone' ),
                    'billing_cellphone'  => array( 'label' => 'Cell Phone' ),
                    'billing_email'      => array( 'label' => 'E-mail' ),
                ),
            ),
            'shipping' => array(
                'title'  => 'Entrega',
                'fields' => array(
                    'shipping_first_name' => array( 'label' => 'Nome' ),
                    'shipping_last_name'  => array( 'label' => 'Sobrenome' ),
                    'shipping_company'    => array( 'label' => 'Empresa' ),
                    'shipping_address_1'  => array( 'label' => 'Endereço' ),
                    'shipping_address_2'  => array( 'label' => 'Compl.' ),
                    'shipping_city'       => array( 'label' => 'Cidade' ),
                    'shipping_postcode'   => array( 'label' => 'CEP' ),
                    'shipping_country'    => array( 'label' => 'País', 'type' => 'select' ),
                    'shipping_state'      => array( 'label' => 'Estado', 'type' => 'select' ),
                ),
            ),
        );
    }

    private function apply(): array {
        return $this->plugin()->add_customer_meta_fields( $this->base_fields() );
    }

    // --- Estrutura / precedência -------------------------------------------

    public function test_unified_document_replaces_separate_cpf_cnpj(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );

        $fields = $this->apply();
        $billing = $fields['billing']['fields'];

        $this->assertArrayHasKey( 'billing_document', $billing, 'Documento unificado do woo-better deve estar presente.' );
        $this->assertArrayNotHasKey( 'billing_cpf', $billing, 'billing_cpf separado (Brazilian) deve sumir.' );
        $this->assertArrayNotHasKey( 'billing_cnpj', $billing, 'billing_cnpj separado (Brazilian) deve sumir.' );
    }

    public function test_ie_and_im_present_for_legal_person(): void {
        update_option( 'woo_better_calc_person_type_select', 'legal' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $billing = $this->apply()['billing']['fields'];

        $this->assertSame( 'Inscrição Estadual (IE)', $billing['billing_ie']['label'] );
        $this->assertSame( 'Inscrição Municipal (IM)', $billing['billing_im']['label'] );
    }

    public function test_shipping_gets_phone_and_cellphone(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $shipping = $this->apply()['shipping']['fields'];

        $this->assertArrayHasKey( 'shipping_phone', $shipping, 'Entrega deve ter telefone (Brazilian não adiciona).' );
        $this->assertArrayHasKey( 'shipping_cellphone', $shipping, 'Entrega deve ter celular.' );
        $this->assertSame( 'Celular/Telefone', $shipping['shipping_phone']['label'] );
        $this->assertSame( 'Celular (secundário)', $shipping['shipping_cellphone']['label'] );
    }

    public function test_cellphone_present_in_shim_mode(): void {
        // "Celular e Fixo" + "Campo de Celular" DESLIGADO (shim): o plugin ARMAZENA a
        // meta `*_cellphone`, então o campo secundário deve aparecer no perfil (igual
        // ao admin do pedido) — antes sumia.
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        foreach ( array( 'billing', 'shipping' ) as $type ) {
            $fields = $this->apply()[ $type ]['fields'];
            $this->assertArrayHasKey( "{$type}_phone", $fields );
            $this->assertArrayHasKey( "{$type}_cellphone", $fields, "No shim o celular ($type) deve aparecer no perfil." );
            $this->assertSame( 'Celular (secundário)', $fields["{$type}_cellphone"]['label'] );
        }
    }

    public function test_phone_label_follows_mode(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $billing = $this->apply()['billing']['fields'];

        // "Somente Celular": telefone nativo não aparece; celular é o principal.
        $this->assertArrayNotHasKey( 'billing_phone', $billing );
        $this->assertArrayHasKey( 'billing_cellphone', $billing );
        $this->assertSame( 'Celular', $billing['billing_cellphone']['label'] );
    }

    public function test_disabled_phone_keeps_native_phone_and_removes_cellphone(): void {
        // Modo "Desabilitar": o woo-better não gerencia o telefone — o campo nativo
        // do perfil é PRESERVADO; nenhum celular do plugin é adicionado.
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $billing = $this->apply()['billing']['fields'];

        $this->assertArrayHasKey( 'billing_phone', $billing, 'No modo Desabilitar o telefone nativo deve permanecer.' );
        $this->assertSame( 'Telefone', $billing['billing_phone']['label'], 'O label nativo deve ser preservado.' );
        $this->assertArrayNotHasKey( 'billing_cellphone', $billing );
    }

    public function test_no_features_leaves_fields_untouched(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_number_required', 'no' );
        update_option( 'woo_better_calc_enable_neighborhood_field', 'no' );
        update_option( 'woo_better_calc_enable_ie_field', 'no' );
        update_option( 'woo_better_calc_enable_im_field', 'no' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'no' );
        update_option( 'woo_better_calc_enable_gender_field', 'no' );

        $fields = $this->apply();

        // Sem recurso ativo, o woo-better não assume: Brazilian/nativo manda.
        $this->assertArrayHasKey( 'billing_cpf', $fields['billing']['fields'] );
        $this->assertArrayNotHasKey( 'billing_document', $fields['billing']['fields'] );
    }

    // --- Save / normalização ------------------------------------------------

    private function ensure_wc_ready() {
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }
        return WC()->session;
    }

    public function test_save_normalizes_phone_to_e164_and_splits_document(): void {
        $this->ensure_wc_ready();
        update_option( 'woo_better_calc_person_type_select', 'both' );
        // O campo "Celular" precisa estar ATIVO (é o que faz a tela do perfil exibir
        // e salvar o `billing_cellphone`).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        $user_id = self::factory()->user->create();

        $backup = $_POST;
        $_POST = array(
            'billing_document'  => '493.147.600-73', // CPF
            'billing_phone'     => '+55 83 98888-8882',
            'billing_cellphone' => '83988888885',
            'shipping_phone'    => '83 98888-8882',
            'billing_ie'        => 'abc123',
        );

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        $this->assertSame( '+5583988888882', get_user_meta( $user_id, 'billing_phone', true ), 'Telefone deve ser E.164 (+55 + dígitos), sem máscara.' );
        $this->assertSame( '+5583988888885', get_user_meta( $user_id, 'billing_cellphone', true ) );
        $this->assertSame( '+5583988888882', get_user_meta( $user_id, 'shipping_phone', true ) );
        $this->assertSame( '1', get_user_meta( $user_id, 'billing_persontype', true ), 'CPF deve definir persontype=1.' );
        $this->assertSame( '493.147.600-73', get_user_meta( $user_id, 'billing_cpf', true ) );
        $this->assertSame( '', get_user_meta( $user_id, 'billing_cnpj', true ) );
        $this->assertSame( 'ABC123', get_user_meta( $user_id, 'billing_ie', true ), 'IE deve ficar em maiúsculas.' );
    }

    public function test_save_with_cnpj_sets_persontype_2(): void {
        $this->ensure_wc_ready();
        update_option( 'woo_better_calc_person_type_select', 'both' );
        $user_id = self::factory()->user->create();

        $backup = $_POST;
        $_POST = array( 'billing_document' => '11.222.333/0001-81' );

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        $this->assertSame( '2', get_user_meta( $user_id, 'billing_persontype', true ) );
        $this->assertSame( '11.222.333/0001-81', get_user_meta( $user_id, 'billing_cnpj', true ) );
        $this->assertSame( '', get_user_meta( $user_id, 'billing_cpf', true ) );
    }

    public function test_save_invalid_document_does_not_wipe_existing(): void {
        $this->ensure_wc_ready();
        update_option( 'woo_better_calc_person_type_select', 'both' );
        $user_id = self::factory()->user->create();

        // Estado válido anterior (CNPJ).
        update_user_meta( $user_id, 'billing_persontype', '2' );
        update_user_meta( $user_id, 'billing_cnpj', '11.222.333/0001-81' );

        $backup = $_POST;
        $_POST = array( 'billing_document' => '123' ); // inválido (nem 11 nem 14)

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        $this->assertSame( '2', get_user_meta( $user_id, 'billing_persontype', true ), 'Valor inválido não deve apagar o persontype existente.' );
        $this->assertSame( '11.222.333/0001-81', get_user_meta( $user_id, 'billing_cnpj', true ), 'Valor inválido não deve apagar o CNPJ existente.' );
    }

    public function test_save_does_nothing_when_no_feature_active(): void {
        $this->ensure_wc_ready();
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_number_required', 'no' );
        update_option( 'woo_better_calc_enable_neighborhood_field', 'no' );
        update_option( 'woo_better_calc_enable_ie_field', 'no' );
        update_option( 'woo_better_calc_enable_im_field', 'no' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'no' );
        update_option( 'woo_better_calc_enable_gender_field', 'no' );

        $user_id = self::factory()->user->create();
        update_user_meta( $user_id, 'billing_phone', '+55 83 98888-8882' ); // mascarado, pré-existente

        $backup = $_POST;
        $_POST = array( 'billing_phone' => '83988888882' );

        $this->plugin()->save_customer_meta_fields_extra( $user_id );

        $_POST = $backup;

        // Sem recurso ativo, o woo-better não gerencia o perfil: não mexe no meta.
        $this->assertSame(
            '+55 83 98888-8882',
            get_user_meta( $user_id, 'billing_phone', true ),
            'Sem recurso ativo o woo-better não deve reescrever o telefone do perfil.'
        );
    }
}
