<?php
/**
 * Regressão: gestão da option NATIVA do telefone do WooCommerce
 * (`woocommerce_checkout_phone_field`) pelo woo-better.
 *
 * O woo-better é a ÚNICA fonte de verdade do telefone:
 *   - enquanto o recurso está ativo, o campo nativo é desabilitado (hidden) — e é
 *     RE-desabilitado se algo (ex.: o toggle do editor de blocos) tentar reativá-lo;
 *   - a opção própria "Telefone (Contato) Obrigatório"
 *     (`woo_better_calc_contact_required`) é EXCLUSIVA — NÃO é sincronizada a partir
 *     do nativo;
 *   - ao desabilitar o recurso, o nativo volta ao estado ORIGINAL guardado.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class NativePhoneFieldSyncTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    public function test_enforce_hook_registered(): void {
        $found = false;
        if ( ! empty( $GLOBALS['wp_filter']['update_option_woocommerce_checkout_phone_field'] ) ) {
            foreach ( $GLOBALS['wp_filter']['update_option_woocommerce_checkout_phone_field']->callbacks as $callbacks ) {
                foreach ( $callbacks as $cb ) {
                    if ( isset( $cb['function'][1] ) && 'enforce_native_phone_hidden' === $cb['function'][1] ) {
                        $found = true;
                    }
                }
            }
        }
        $this->assertTrue( $found, 'O método deve estar em update_option_woocommerce_checkout_phone_field.' );
    }

    public function test_activating_resource_hides_native_and_stores_original(): void {
        // Estado original do lojista (recurso desligado, campo visível/obrigatório).
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        delete_option( 'woo_better_calc_phone_field_previous' );
        update_option( 'woocommerce_checkout_phone_field', 'required' );

        // Ativa o recurso (passa a gerenciar o telefone).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $this->plugin()->sync_phone_field();

        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ), 'O nativo deve ficar oculto.' );
        $this->assertSame( 'required', get_option( 'woo_better_calc_phone_field_previous' ), 'O estado original deve ser guardado.' );
    }

    public function test_enforce_rehides_when_managed_and_keeps_contact_required(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_contact_field_position', 'no' );
        update_option( 'woocommerce_checkout_phone_field', 'hidden' );
        update_option( 'woo_better_calc_contact_required', 'yes' );

        // Simula o toggle do editor de blocos reativando o nativo.
        $this->plugin()->enforce_native_phone_hidden( 'hidden', 'optional', 'woocommerce_checkout_phone_field' );

        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ), 'Deve reaplicar o hidden.' );
        $this->assertSame( 'yes', get_option( 'woo_better_calc_contact_required' ), 'NÃO deve mexer em contact_required.' );
    }

    public function test_enforce_does_nothing_when_resource_disabled(): void {
        // Regressão: modo "Desabilitar" + "Destaque do Campo Telefone" LIGADO (o
        // destaque fica stale ao desabilitar) — NÃO deve re-ocultar o nativo.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_contact_field_position', 'yes' );
        update_option( 'woocommerce_checkout_phone_field', 'optional' );

        $this->plugin()->enforce_native_phone_hidden( 'hidden', 'optional', 'woocommerce_checkout_phone_field' );

        $this->assertSame( 'optional', get_option( 'woocommerce_checkout_phone_field' ), 'Com o recurso desligado, não deve mexer no nativo (mesmo com o Destaque ligado).' );
    }

    public function test_disabled_mode_restores_native_even_with_highlight_on(): void {
        // Regressão: o "Destaque do Campo Telefone" (contact_field_position) NÃO deve
        // ocultar o nativo por conta própria. Ao desabilitar o modo, o nativo volta ao
        // original mesmo com o destaque ligado (senão o telefone sumiria — o plugin
        // não injeta campo nenhum no modo "Desabilitar").
        //
        // Ordem importa: cada update_option dispara o hook de sync.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_contact_field_position', 'yes' );
        delete_option( 'woo_better_calc_phone_field_previous' );
        update_option( 'woocommerce_checkout_phone_field', 'required' );

        // Ativa o recurso → oculta o nativo e guarda o original.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ) );
        $this->assertSame( 'required', get_option( 'woo_better_calc_phone_field_previous' ) );

        // Desabilita o modo (o Destaque continua 'yes') → nativo volta ao original.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $this->assertSame( 'required', get_option( 'woocommerce_checkout_phone_field' ), 'No modo Desabilitar o nativo deve voltar ao original.' );
        $this->assertFalse( get_option( 'woo_better_calc_phone_field_previous', false ), 'O guard deve ser limpo.' );
    }

    public function test_disabling_resource_restores_original(): void {
        // Recurso ativo, nativo oculto, original guardado.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woocommerce_checkout_phone_field', 'hidden' );
        update_option( 'woo_better_calc_phone_field_previous', 'required' );
        update_option( 'woo_better_calc_contact_field_position', 'no' );

        // Desabilita o recurso.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        $this->plugin()->sync_phone_field();

        $this->assertSame( 'required', get_option( 'woocommerce_checkout_phone_field' ), 'Deve voltar ao estado original.' );
        $this->assertFalse( get_option( 'woo_better_calc_phone_field_previous', false ), 'O guard deve ser limpo.' );
    }

    public function test_contact_required_option_does_not_write_native(): void {
        // Futuro/regressão: mudar contact_required NÃO deve tocar no nativo.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woocommerce_checkout_phone_field', 'hidden' );

        update_option( 'woo_better_calc_contact_required', 'no' );

        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ) );
    }

    public function test_reassert_on_every_request_hides_reset_option(): void {
        // Original: recurso desligado, nativo visível.
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_contact_field_position', 'no' );
        delete_option( 'woo_better_calc_phone_field_previous' );
        update_option( 'woocommerce_checkout_phone_field', 'required' );

        // Ativa o recurso (oculta + guarda o original).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ) );

        // Simula um reset EXTERNO da option (fora dos hooks).
        remove_all_actions( 'update_option_woocommerce_checkout_phone_field' );
        update_option( 'woocommerce_checkout_phone_field', 'optional' );
        $this->assertSame( 'optional', get_option( 'woocommerce_checkout_phone_field' ) );

        // A próxima requisição (init) reafirma o estado.
        $this->plugin()->ensure_phone_field_option();

        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ), 'O re-assert deve re-ocultar o nativo.' );
        $this->assertSame( 'required', get_option( 'woo_better_calc_phone_field_previous' ), 'O original guardado NÃO deve ser sobrescrito.' );
    }

    public function test_reassert_is_idempotent(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_contact_field_position', 'no' );
        delete_option( 'woo_better_calc_phone_field_previous' );
        update_option( 'woocommerce_checkout_phone_field', 'required' );

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $plugin = $this->plugin();
        $plugin->ensure_phone_field_option();
        $plugin->ensure_phone_field_option();
        $plugin->ensure_phone_field_option();

        $this->assertSame( 'hidden', get_option( 'woocommerce_checkout_phone_field' ) );
        $this->assertSame( 'required', get_option( 'woo_better_calc_phone_field_previous' ) );
    }

    public function test_sync_customer_phone_from_order_uses_normalized_phone(): void {
        // Regressão: no checkout o WC core salva o customer a partir do campo NATIVO
        // (valor cru/mascarado, ex.: "83 98888-8884"). O plugin reafirma o E.164 do
        // pedido na meta do usuário (perfil).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );
        // O WC()->customer pode ser um "guest" no checkout clássico (id 0); o sync
        // deve usar o customer_id do PEDIDO e mesmo assim gravar no user meta.
        WC()->customer = new \WC_Customer( 0 );

        // Valor cru que o WC core salvou.
        update_user_meta( $user_id, 'billing_phone', '83 98888-8884' );
        update_user_meta( $user_id, 'shipping_phone', '83 98888-8884' );

        $order = new \WC_Order();
        $order->set_customer_id( $user_id );
        $order->set_billing_phone( '+5583988888884' );
        $order->set_shipping_phone( '+5583988888884' );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'sync_customer_phone_from_order' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order );

        $this->assertSame( '+5583988888884', get_user_meta( $user_id, 'billing_phone', true ) );
        $this->assertSame( '+5583988888884', get_user_meta( $user_id, 'shipping_phone', true ) );
    }

    /**
     * Telefone INVÁLIDO no pedido (mais dígitos do que o E.164 permite) não pode ser
     * copiado para o perfil — era assim que o resíduo voltava para o checkout.
     */
    public function test_sync_customer_phone_from_order_skips_invalid_phone(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );
        WC()->customer = new \WC_Customer( 0 );

        update_user_meta( $user_id, 'billing_phone', '83 98888-8885' );

        $order = new \WC_Order();
        $order->set_customer_id( $user_id );
        $order->set_billing_phone( '+5583899998899555555' );   // lixo (19 dígitos)
        $order->set_shipping_phone( '+5583988888885' );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'sync_customer_phone_from_order' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order );

        $this->assertSame( '83 98888-8885', get_user_meta( $user_id, 'billing_phone', true ), 'Lixo não pode sobrescrever o telefone do perfil.' );
        $this->assertSame( '+5583988888885', get_user_meta( $user_id, 'shipping_phone', true ) );
    }

    public function test_sync_customer_phone_does_nothing_in_disabled_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );
        WC()->customer = new \WC_Customer( $user_id );
        update_user_meta( $user_id, 'billing_phone', '83 98888-8884' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888884' );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'sync_customer_phone_from_order' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order );

        $this->assertSame( '83 98888-8884', get_user_meta( $user_id, 'billing_phone', true ), 'No modo Desabilitar não mexe no telefone do perfil.' );
    }

    public function test_sync_customer_phone_reflects_on_wc_customer_object(): void {
        // Além do user meta, o objeto WC()->customer (mesmo usuário) deve refletir o
        // valor normalizado — para a tela não ficar com o valor antigo logo após o checkout.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $user_id = self::factory()->user->create();
        wp_set_current_user( $user_id );
        WC()->customer = new \WC_Customer( $user_id );

        $order = new \WC_Order();
        $order->set_customer_id( $user_id );
        $order->set_billing_phone( '+5583988888884' );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'sync_customer_phone_from_order' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order );

        $this->assertSame( '+5583988888884', WC()->customer->get_billing_phone() );
    }

    public function test_classic_checkout_customer_phone_is_normalized(): void {
        // No clássico, o hook `woocommerce_checkout_update_customer` roda antes do
        // save do core: o phone deve sair normalizado (E.164) já no objeto do customer.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $user_id = self::factory()->user->create();
        $customer = new \WC_Customer( $user_id );

        $this->plugin()->sync_customer_phone_on_classic_checkout( $customer, array(
            'billing_phone'         => '83 98888-8884',
            'billing_phone_country' => '+55',
            'shipping_phone'        => '83 98888-8884',
            'shipping_phone_country' => '+55',
        ) );

        $this->assertSame( '+5583988888884', $customer->get_billing_phone() );
        $this->assertSame( '+5583988888884', $customer->get_shipping_phone() );
    }

    public function test_classic_checkout_customer_phone_untouched_in_disabled(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );

        $user_id = self::factory()->user->create();
        $customer = new \WC_Customer( $user_id );
        $customer->set_billing_phone( '83 98888-8884' );

        $this->plugin()->sync_customer_phone_on_classic_checkout( $customer, array(
            'billing_phone'         => '83 98888-8884',
            'billing_phone_country' => '+55',
        ) );

        $this->assertSame( '83 98888-8884', $customer->get_billing_phone() );
    }
}
