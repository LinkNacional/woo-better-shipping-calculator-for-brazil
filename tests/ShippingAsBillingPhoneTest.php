<?php
/**
 * Regressão: "usar o mesmo endereço para cobrança" no checkout em BLOCOS deve
 * espelhar TELEFONE e CELULAR entre cobrança e entrega.
 *
 * Bug: `process_shipping_as_billing_from_request` copiava o ENDEREÇO (shipping →
 * billing) e os metadados de número/bairro, mas NÃO o telefone/celular — então,
 * com o checkbox marcado, os dois números ficavam diferentes no pedido.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class ShippingAsBillingPhoneTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function apply_shipping_as_billing( \WC_Order $order ): void {
        $request = new \WP_REST_Request();
        $request->set_param( 'extensions', array(
            'woo_better_shipping_as_billing' => array(
                'use_shipping_as_billing' => 'true',
            ),
        ) );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'process_shipping_as_billing_from_request' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order, $request );
    }

    public function test_mirrors_shipping_phone_into_billing(): void {
        $order = new \WC_Order();
        $order->set_billing_phone( '' );
        $order->set_shipping_phone( '+5583988888885' );

        $this->apply_shipping_as_billing( $order );

        $this->assertSame( '+5583988888885', $order->get_billing_phone() );
        $this->assertSame( '+5583988888885', $order->get_shipping_phone() );
    }

    public function test_falls_back_to_billing_when_shipping_empty(): void {
        // Se o shipping estiver vazio, não pode zerar: espelha o billing p/ shipping.
        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888886' );
        $order->set_shipping_phone( '' );

        $this->apply_shipping_as_billing( $order );

        $this->assertSame( '+5583988888886', $order->get_shipping_phone() );
        $this->assertSame( '+5583988888886', $order->get_billing_phone() );
    }

    public function test_mirrors_cellphone_metas(): void {
        $order = new \WC_Order();
        $order->update_meta_data( '_shipping_cellphone', '+5583988888885' );
        $order->update_meta_data( '_billing_cellphone', '' );

        $this->apply_shipping_as_billing( $order );

        $this->assertSame( '+5583988888885', $order->get_meta( '_billing_cellphone' ) );
        $this->assertSame( '+5583988888885', $order->get_meta( '_shipping_cellphone' ) );
    }

    public function test_does_nothing_when_both_empty(): void {
        $order = new \WC_Order();
        $order->set_billing_phone( '' );
        $order->set_shipping_phone( '' );

        $this->apply_shipping_as_billing( $order );

        $this->assertSame( '', $order->get_billing_phone() );
        $this->assertSame( '', $order->get_shipping_phone() );
    }

    public function test_does_nothing_when_checkbox_not_checked(): void {
        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888886' );
        $order->set_shipping_phone( '+5583988888885' );

        $request = new \WP_REST_Request();
        $request->set_param( 'extensions', array(
            'woo_better_shipping_as_billing' => array(
                'use_shipping_as_billing' => 'false',
            ),
        ) );

        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, 'process_shipping_as_billing_from_request' );
        $ref->setAccessible( true );
        $ref->invoke( $this->plugin(), $order, $request );

        $this->assertSame( '+5583988888886', $order->get_billing_phone() );
        $this->assertSame( '+5583988888885', $order->get_shipping_phone() );
    }
}
