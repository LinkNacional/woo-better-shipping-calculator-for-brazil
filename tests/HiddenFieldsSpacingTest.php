<?php
/**
 * Regressão: espaço vazio dos campos OCULTOS no checkout clássico/shortcode e na
 * edição de endereço (minha conta).
 *
 * Bug: o WooCommerce envolve TODO campo num `<p class="form-row">` — inclusive os
 * `type="hidden"` —, e esse wrapper herda `padding`/`margin` do formulário mesmo
 * sem conteúdo visível, deixando um vão no meio dos campos:
 *
 *   <p class="form-row " id="billing_phone_country_field" data-priority="">
 *     <span class="woocommerce-input-wrapper">
 *       <input type="hidden" name="billing_phone_country" value="+55">
 *     </span>
 *   </p>
 *
 * Correção: as definições dos campos ocultos do plugin passam a marcar o wrapper
 * com a classe `woo-better-hidden-field` e o CSS
 * `WcBetterShippingCalculatorForBrazilHiddenFields` zera o espaçamento.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class HiddenFieldsSpacingTest extends WP_UnitTestCase {

    private const HIDDEN_CLASS = 'woo-better-hidden-field';

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    /**
     * Garante sessão do WC (o checkout clássico consulta `WC()->session`).
     */
    private function ensure_wc_ready(): void {
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }
    }

    // --- O wrapper recebe a classe (checkout clássico) ----------------------

    public function test_checkout_hidden_ddi_wrapper_carries_the_class(): void {
        $this->ensure_wc_ready();
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $fields = $this->plugin()->wc_better_calc_checkout_fields(
            array( 'billing' => array(), 'shipping' => array() )
        );

        foreach ( array( 'billing_phone_country', 'shipping_phone_country' ) as $fieldset_key ) {
            $fieldset = 0 === strpos( $fieldset_key, 'billing' ) ? 'billing' : 'shipping';

            $this->assertArrayHasKey( $fieldset_key, $fields[ $fieldset ], $fieldset_key . ' deveria existir no checkout clássico.' );
            $this->assertSame( 'hidden', $fields[ $fieldset ][ $fieldset_key ]['type'] );
            $this->assertContains(
                self::HIDDEN_CLASS,
                $fields[ $fieldset ][ $fieldset_key ]['class'],
                'O wrapper do DDI oculto precisa da classe que zera padding/margin (' . $fieldset_key . ').'
            );
        }
    }

    public function test_checkout_keeps_the_hidden_input_submittable(): void {
        $this->ensure_wc_ready();
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $fields = $this->plugin()->wc_better_calc_checkout_fields(
            array( 'billing' => array(), 'shipping' => array() )
        );

        // Zerar o espaçamento NÃO pode virar `display: none` no input nem mudar o
        // tipo: o backend lê o DDI de `$_POST['billing_phone_country']`.
        $this->assertSame( 'hidden', $fields['billing']['billing_phone_country']['type'] );
        $this->assertSame( '+55', (string) $fields['billing']['billing_phone_country']['default'] );
        $this->assertFalse( (bool) $fields['billing']['billing_phone_country']['required'] );

        // O plugin NÃO usa `input_class` aqui: se usasse, a classe cairia no input,
        // não no <p>, e o espaçamento continuaria.
        $this->assertArrayNotHasKey( 'input_class', $fields['billing']['billing_phone_country'] );
    }

    // --- O wrapper recebe a classe (edição de endereço) ---------------------

    public function test_edit_address_hidden_ddi_wrapper_carries_the_class(): void {
        $this->ensure_wc_ready();
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );

        $billing = $this->plugin()->add_edit_address_billing_fields(
            array( 'billing_country' => array( 'value' => 'BR' ) )
        );

        $this->assertArrayHasKey( 'billing_phone_country', $billing );
        $this->assertContains( self::HIDDEN_CLASS, $billing['billing_phone_country']['class'] );

        $shipping = $this->plugin()->add_edit_address_shipping_fields(
            array( 'shipping_country' => array( 'value' => 'BR' ) )
        );

        $this->assertArrayHasKey( 'shipping_phone_country', $shipping );
        $this->assertContains( self::HIDDEN_CLASS, $shipping['shipping_phone_country']['class'] );
    }

    // --- Contrato do WooCommerce: `class` vira a classe do <p> --------------

    public function test_woocommerce_puts_the_class_on_the_wrapper_not_the_input(): void {
        $this->ensure_wc_ready();

        if ( ! function_exists( 'woocommerce_form_field' ) ) {
            require_once WC_ABSPATH . 'includes/wc-template-functions.php';
        }

        $html = \woocommerce_form_field(
            'billing_phone_country',
            array(
                'type'     => 'hidden',
                'class'    => array( self::HIDDEN_CLASS ),
                'default'  => '+55',
                'required' => false,
                'return'   => true, // sem isso o WooCommerce faz echo do HTML
            ),
            '+55'
        );

        $this->assertStringContainsString(
            'class="form-row ' . self::HIDDEN_CLASS . '"',
            $html,
            'A chave `class` do campo é a classe do CONTAINER (<p>), que é o elemento com o espaçamento.'
        );
        $this->assertStringContainsString( 'type="hidden"', $html );
    }

    // --- O CSS que zera o espaçamento ---------------------------------------

    public function test_stylesheet_zeroes_the_wrapper_spacing(): void {
        $plugin_root = dirname( __DIR__ );

        foreach ( array(
            'Public/css/WcBetterShippingCalculatorForBrazilHiddenFields.css',
            'Public/cssCompiled/WcBetterShippingCalculatorForBrazilHiddenFields.COMPILED.css',
        ) as $relative ) {
            $file = $plugin_root . '/' . $relative;
            $this->assertFileExists( $file, $relative . ' deveria existir (rode `npm run build:css`).' );

            $css = file_get_contents( $file );

            $this->assertStringContainsString( '.form-row.woo-better-hidden-field', $css, $relative . ' sem o seletor do wrapper.' );
            $this->assertMatchesRegularExpression( '/margin:\s*0\s*!important/', $css, $relative . ' sem `margin: 0`.' );
            $this->assertMatchesRegularExpression( '/padding:\s*0\s*!important/', $css, $relative . ' sem `padding: 0`.' );
        }
    }

    /**
     * O CSS é enfileirado nos DOIS pontos onde o wrapper oculto aparece.
     */
    public function test_stylesheet_is_enqueued_on_checkout_and_edit_address(): void {
        $plugin_root = dirname( __DIR__ );
        $source      = file_get_contents( $plugin_root . '/Public/WcBetterShippingCalculatorForBrazilPublic.php' );

        $this->assertSame(
            2,
            substr_count( $source, 'WcBetterShippingCalculatorForBrazilHiddenFields.COMPILED.css' ),
            'O CSS dos campos ocultos deve ser enfileirado no checkout clássico E na edição de endereço.'
        );

        $this->assertStringContainsString(
            "if (\$is_checkout_classic && 'disabled' !== \$this->phone_mode())",
            $source,
            'No checkout o enfileiramento deve ser exclusivo do clássico/shortcode (blocos não têm esse wrapper).'
        );
    }
}
