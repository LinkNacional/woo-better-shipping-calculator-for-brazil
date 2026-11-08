<?php
/**
 * Regressão: CPF/CNPJ de clientes cadastrados pelo plugin "Brazilian Market on
 * WooCommerce" (ou por versões antigas do woo-better) não era reconhecido.
 *
 * Sintoma: o CPF aparece no campo, mas ao finalizar a compra o pedido é barrado
 * ("informe o CPF" — e, no caso relatado, "Tipo de pessoa é obrigatório"). Como
 * paliativo, o cliente apagava o último dígito e digitava de novo — o que dispara
 * o JS que preenche os campos de verdade.
 *
 * Causa: o Brazilian gravava o documento em `billing_persontype` + `billing_cpf` /
 * `billing_cnpj`; o woo-better lê o campo unificado `billing_document`. Para quem
 * nunca teve o documento migrado:
 *   - checkout clássico (shortcode): campo obrigatório abria VAZIO;
 *   - checkout em blocos: o campo exibe (o JS semeia das metas antigas) mas o
 *     request do Store API não leva o documento;
 *   - edição de endereço da conta e perfil do wp-admin: campo VAZIO (imprimem a
 *     meta `billing_document` direto).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class LegacyDocumentMigrationTest extends WP_UnitTestCase {

    private $user_id = 0;

    public function set_up(): void {
        parent::set_up();

        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $this->user_id = (int) wp_create_user(
            'legado_' . wp_rand( 1000, 999999 ),
            'senha123',
            'legado_' . wp_rand( 1000, 999999 ) . '@example.com'
        );

        // Cadastro feito pelo Brazilian: só as metas antigas, sem o documento unificado.
        update_user_meta( $this->user_id, 'billing_persontype', '1' );
        update_user_meta( $this->user_id, 'billing_cpf', '123.456.789-09' );
        update_user_meta( $this->user_id, 'billing_cnpj', '' );
        delete_user_meta( $this->user_id, 'billing_document' );

        wp_set_current_user( $this->user_id );
    }

    public function tear_down(): void {
        unset( $GLOBALS['pagenow'] );
        wp_set_current_user( 0 );
        parent::tear_down();
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    /**
     * CHECKOUT CLÁSSICO/shortcode: o campo obrigatório precisa abrir preenchido com
     * o CPF herdado (o core resolve o valor por `woocommerce_checkout_get_value`).
     */
    public function test_classic_checkout_seeds_the_document_from_legacy_meta(): void {
        $this->assertSame( '', (string) get_user_meta( $this->user_id, 'billing_document', true ), 'Pré-condição: sem documento unificado.' );

        $this->assertSame(
            '123.456.789-09',
            $this->plugin()->seed_billing_document_from_legacy( null, 'billing_document' ),
            'O campo do checkout clássico precisa abrir com o CPF do cadastro antigo.'
        );

        $this->assertSame( '123.456.789-09', get_user_meta( $this->user_id, 'billing_document', true ), 'A meta unificada fica migrada (uma vez só).' );
    }

    /**
     * A migração é idempotente e não sobrescreve um documento já existente.
     */
    public function test_migration_does_not_overwrite_an_existing_document(): void {
        update_user_meta( $this->user_id, 'billing_document', '11.222.333/0001-81' );

        $this->plugin()->seed_billing_document_from_legacy( null, 'billing_document' );

        $this->assertSame( '11.222.333/0001-81', get_user_meta( $this->user_id, 'billing_document', true ) );
    }

    /**
     * Só o campo do documento é semeado; outros campos seguem o core (null).
     */
    public function test_seed_ignores_other_fields(): void {
        $this->assertNull( $this->plugin()->seed_billing_document_from_legacy( null, 'billing_first_name' ) );
        $this->assertSame( 'algo', $this->plugin()->seed_billing_document_from_legacy( 'algo', 'billing_document' ), 'Valor já resolvido por terceiros é respeitado.' );
    }

    /**
     * Visitante (sem cadastro) não tem de onde semear.
     */
    public function test_seed_is_skipped_for_guests(): void {
        wp_set_current_user( 0 );

        $this->assertNull( $this->plugin()->seed_billing_document_from_legacy( null, 'billing_document' ) );
    }

    /**
     * CNPJ herdado (persontype = 2) também é reconhecido.
     */
    public function test_legacy_cnpj_is_recognised(): void {
        update_user_meta( $this->user_id, 'billing_persontype', '2' );
        update_user_meta( $this->user_id, 'billing_cnpj', '11.222.333/0001-81' );
        update_user_meta( $this->user_id, 'billing_cpf', '' );

        $this->assertSame( '11.222.333/0001-81', $this->plugin()->seed_billing_document_from_legacy( null, 'billing_document' ) );
        $this->assertSame( '2', get_user_meta( $this->user_id, 'billing_persontype', true ) );
    }

    /**
     * Sem `billing_persontype` o tipo é deduzido pelo tamanho do documento (é o que
     * o Brazilian fazia quando o cliente não escolhia).
     */
    public function test_person_type_is_deduced_from_the_document_size(): void {
        update_user_meta( $this->user_id, 'billing_persontype', '' );
        delete_user_meta( $this->user_id, 'billing_document' );

        $this->plugin()->seed_billing_document_from_legacy( null, 'billing_document' );

        $this->assertSame( '123.456.789-09', get_user_meta( $this->user_id, 'billing_document', true ) );
        $this->assertSame( '1', get_user_meta( $this->user_id, 'billing_persontype', true ), 'O tipo também é preenchido, para os espelhos do checkout.' );
    }

    /**
     * PERFIL do wp-admin: a tela imprime `billing_document` direto do user meta, então
     * a migração tem de acontecer antes de renderizar (admin_init).
     */
    public function test_admin_profile_screen_migrates_before_rendering(): void {
        $GLOBALS['pagenow'] = 'profile.php';

        $this->plugin()->migrate_legacy_document_on_admin_profile();

        $this->assertSame( '123.456.789-09', get_user_meta( $this->user_id, 'billing_document', true ), 'Sem isso o perfil abria com o CPF vazio.' );
    }

    /**
     * Em outras telas do admin nada é migrado (não escreve meta à toa).
     */
    public function test_admin_migration_only_runs_on_profile_screens(): void {
        $GLOBALS['pagenow'] = 'edit.php';

        $this->plugin()->migrate_legacy_document_on_admin_profile();

        $this->assertSame( '', (string) get_user_meta( $this->user_id, 'billing_document', true ) );
    }

    /**
     * EDIÇÃO DE ENDEREÇO da conta: o valor sai de `get_user_meta`, então basta a
     * migração do frontend. Aqui cobrimos o efeito (a meta passa a existir) sem
     * depender do roteamento de páginas do WordPress.
     */
    public function test_edit_address_reads_the_migrated_document(): void {
        $this->plugin()->seed_billing_document_from_legacy( null, 'billing_document' );

        // É exatamente o que o template myaccount/form-edit-address.php usa.
        $this->assertSame( '123.456.789-09', get_user_meta( get_current_user_id(), 'billing_document', true ) );
    }

    /**
     * `profile_update` (disparado também pelo `WC_Customer::save()`) mantém o
     * documento unificado em sincronia com os espelhos.
     */
    public function test_profile_update_rebuilds_the_document_from_the_mirrors(): void {
        delete_user_meta( $this->user_id, 'billing_document' );

        $this->plugin()->update_billing_document_on_profile_update( $this->user_id );

        $this->assertSame( '123.456.789-09', get_user_meta( $this->user_id, 'billing_document', true ) );
    }

    /**
     * CHECKOUT EM BLOCOS: o campo do documento é injetado no DOM pelo JS (não é campo
     * registrado do Store API), então o request chega sem documento. O pedido precisa
     * levar o CPF/CNPJ do cadastro (inclusive o herdado do Brazilian).
     */
    public function test_blocks_order_receives_the_document_from_the_account(): void {
        $order = new \WC_Order();
        $order->set_customer_id( $this->user_id );
        $order->set_billing_country( 'BR' );

        $request = new \WP_REST_Request( 'POST', '/wc/store/v1/checkout' );
        $request->set_param( 'extensions', array() );

        $plugin = $this->plugin();
        $method = new \ReflectionMethod( $plugin, 'process_person_type_from_request' );
        $method->setAccessible( true );
        $method->invoke( $plugin, $order, $request );

        $this->assertSame( '123.456.789-09', $order->get_meta( '_billing_cpf' ), 'O pedido do bloco não pode sair sem o CPF.' );
        $this->assertSame( 1, (int) $order->get_meta( '_billing_persontype' ) );
    }

    /**
     * Fora do Brasil o documento não é preenchido às cegas (o campo é escondido e
     * limpo de propósito).
     */
    public function test_blocks_fallback_is_skipped_outside_brazil(): void {
        $order = new \WC_Order();
        $order->set_customer_id( $this->user_id );
        $order->set_billing_country( 'US' );

        $request = new \WP_REST_Request( 'POST', '/wc/store/v1/checkout' );
        $request->set_param( 'extensions', array() );

        $plugin = $this->plugin();
        $method = new \ReflectionMethod( $plugin, 'process_person_type_from_request' );
        $method->setAccessible( true );
        $method->invoke( $plugin, $order, $request );

        $this->assertSame( '', (string) $order->get_meta( '_billing_cpf' ) );
    }

    /**
     * Quem NÃO pode editar o usuário não escreve meta nenhuma na tela de
     * `user-edit.php` (o `admin_init` roda antes da checagem de permissão do core).
     */
    public function test_admin_migration_requires_permission_to_edit_the_user(): void {
        $subscriber = (int) wp_create_user(
            'assinante_' . wp_rand( 1000, 999999 ),
            'senha123',
            'assinante_' . wp_rand( 1000, 999999 ) . '@example.com'
        );

        wp_set_current_user( $subscriber );

        $GLOBALS['pagenow']     = 'user-edit.php';
        $_GET['user_id']        = $this->user_id;

        $this->plugin()->migrate_legacy_document_on_admin_profile();

        $this->assertSame( '', (string) get_user_meta( $this->user_id, 'billing_document', true ), 'Sem permissão, nada é migrado.' );

        unset( $_GET['user_id'] );
    }

    /**
     * Limpar o documento na edição de endereço apaga os espelhos junto — senão a
     * migração do cadastro antigo traria o CPF de volta no request seguinte.
     */
    public function test_clearing_the_document_on_edit_address_clears_the_mirrors(): void {
        update_user_meta( $this->user_id, 'billing_country', 'BR' );
        update_user_meta( $this->user_id, 'billing_document', '123.456.789-09' );

        $_POST['billing_document'] = '';

        $this->plugin()->save_edit_address_custom_fields( $this->user_id, 'billing' );

        $this->assertSame( '', (string) get_user_meta( $this->user_id, 'billing_document', true ) );
        $this->assertSame( '', (string) get_user_meta( $this->user_id, 'billing_cpf', true ), 'O espelho antigo não pode ressuscitar o documento.' );
        $this->assertSame( '', (string) get_user_meta( $this->user_id, 'billing_persontype', true ) );

        unset( $_POST['billing_document'] );
    }
}
