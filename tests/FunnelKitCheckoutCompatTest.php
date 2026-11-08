<?php
/**
 * Regressão: integração com o FunnelKit Aero Checkout.
 *
 * O Aero Checkout (FunnelKit) desenha o formulário a partir do layout do funil e
 * NÃO do `woocommerce_checkout_fields`. Dois reflexos no nosso plugin:
 *
 * 1. Telado — no modo "Somente Celular" o plugin remove o telefone nativo dos campos
 *    e cria o `billing_cellphone`; se o checkout não renderiza o `billing_cellphone`
 *    (é o caso do Aero, que ainda remove esse campo do slot de terceiros), o número
 *    digitado no telefone nativo era descartado e o pedido ficava sem telefone.
 * 2. Paleta — o "Celular" e o RG não existiam no editor do funil (a compatibilidade
 *    oficial registra só CPF/CNPJ, Número e Bairro), então não havia como
 *    configurá-los.
 *
 * O FunnelKit não é dependência: sem `WFACP_Add_Address_Field` nada é registrado.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class FunnelKitCheckoutCompatTest extends WP_UnitTestCase {

    public function tear_down(): void {
        unset( $_POST['billing_phone'], $_POST['shipping_phone'], $_POST['billing_phone_country'], $_POST['shipping_phone_country'] );
        parent::tear_down();
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function cellphone_only(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );
    }

    /**
     * Checkout que NÃO renderiza o campo "Celular" (FunnelKit Aero): o número vem no
     * telefone nativo e precisa sobreviver — indo também para a meta `*_cellphone`,
     * que é onde o modo "Somente Celular" guarda o número.
     */
    public function test_cellphone_only_keeps_the_posted_phone_when_cellphone_is_not_rendered(): void {
        $this->cellphone_only();

        $_POST['billing_phone'] = '+55 (83) 99999-8888';

        $data = array(
            'billing_first_name' => 'Fulano',
            'billing_phone'      => '',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '+55 (83) 99999-8888', $result['billing_phone'], 'O telefone postado não pode ser descartado quando nenhum campo de celular foi renderizado.' );
        $this->assertSame( '83999998888', $result['billing_cellphone'], 'O telefone precisa ser espelhado no celular (é onde o modo guarda o número).' );
    }

    /**
     * O formulário do próprio plugin manda o `*_cellphone`: o comportamento original
     * continua — o telefone do pedido fica VAZIO.
     */
    public function test_cellphone_only_empties_the_phone_when_the_cellphone_field_was_rendered(): void {
        $this->cellphone_only();

        $_POST['billing_phone'] = '(83) 3333-4444';

        $data = array(
            'billing_phone'     => '(83) 3333-4444',
            'billing_cellphone' => '(83) 99999-8888',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_phone', $result );
        $this->assertSame( '(83) 99999-8888', $result['billing_cellphone'] );
    }

    /**
     * Nada preenchido: segue sem telefone (não inventa valor no fallback).
     */
    public function test_cellphone_only_empties_the_phone_when_nothing_was_posted(): void {
        $this->cellphone_only();

        $data = array( 'billing_phone' => '' );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_phone', $result );
        $this->assertArrayNotHasKey( 'billing_cellphone', $result );
    }

    /**
     * Sem FunnelKit ativo (classe inexistente) o registro não pode fazer nada nem
     * fatal error — é o caminho de quem não tem o plugin instalado.
     */
    public function test_aero_registration_is_a_noop_without_funnelkit(): void {
        if ( class_exists( 'WFACP_Add_Address_Field' ) ) {
            $this->markTestSkipped( 'Ambiente com o FunnelKit ativo.' );
        }

        $this->cellphone_only();
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $before = has_filter( 'wfacp_default_billing_address_fields' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $this->assertSame( $before, has_filter( 'wfacp_default_billing_address_fields' ), 'Sem o FunnelKit nenhum filtro dele pode ser registrado.' );
    }

    /**
     * Com o FunnelKit presente, o "Celular" e o RG entram na lista de campos de
     * endereço do Aero (é o que faz os campos existirem no editor do funil).
     */
    public function test_aero_registration_adds_cellphone_and_rg_fields(): void {
        if ( ! class_exists( 'WFACP_Add_Address_Field' ) ) {
            if ( ! class_exists( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub' ) ) {
                require_once __DIR__ . '/fixtures/wfacp-add-address-field-stub.php';
            }

            if ( ! class_exists( 'WFACP_Add_Address_Field' ) ) {
                // O stub vive no namespace do teste; o plugin procura a classe global.
                class_alias( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub', 'WFACP_Add_Address_Field' );
            }
        }

        $this->cellphone_only();
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $billing = apply_filters( 'wfacp_default_billing_address_fields', array(), 'BR' );

        $this->assertArrayHasKey( 'cellphone', $billing, 'O campo Celular precisa existir na paleta do Aero.' );
        $this->assertSame( 'tel', $billing['cellphone']['type'] );
        $this->assertArrayHasKey( 'rg', $billing, 'O campo RG precisa existir na paleta do Aero.' );
    }

    /**
     * O DDI do seletor de país é respeitado ao espelhar (não assume sempre +55).
     */
    public function test_cellphone_fallback_respects_the_posted_country_code(): void {
        $this->cellphone_only();

        $_POST['billing_phone']         = '+1 555 123 4567';
        $_POST['billing_phone_country'] = '+1';

        $result = $this->plugin()->handle_cellphone_posted_data( array( 'billing_phone' => '' ) );

        $this->assertSame( '+1 555 123 4567', $result['billing_phone'] );
        $this->assertSame( '5551234567', $result['billing_cellphone'], 'O DDI postado precisa sair do número espelhado.' );

        unset( $_POST['billing_phone_country'] );
    }

    /**
     * Vale para a entrega também (o `$data` pode nem trazer o shipping quando o
     * checkout usa o mesmo endereço para cobrança).
     */
    public function test_cellphone_fallback_covers_the_shipping_phone(): void {
        $this->cellphone_only();

        $_POST['shipping_phone']         = '(83) 98888-7777';
        $_POST['shipping_phone_country'] = '+55';

        $result = $this->plugin()->handle_cellphone_posted_data( array( 'billing_cellphone' => '(83) 99999-8888' ) );

        $this->assertSame( '(83) 98888-7777', $result['shipping_phone'] );
        $this->assertSame( '83988887777', $result['shipping_cellphone'] );

        unset( $_POST['shipping_phone_country'] );
    }
}
