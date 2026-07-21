<?php
/**
 * Teste de fumaça — verifica que o ambiente de testes está funcional.
 *
 * Confirma que:
 *   - WordPress está carregado
 *   - WooCommerce está carregado (sibling do Local WP)
 *   - Nosso plugin está ativo
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;

class ExampleTest extends WP_UnitTestCase {

    /**
     * WordPress deve estar carregado.
     */
    public function test_wordpress_is_loaded(): void {
        $this->assertTrue( function_exists( 'wp' ) );
        $this->assertTrue( function_exists( 'add_filter' ) );
        $this->assertTrue( defined( 'ABSPATH' ) );
    }

    /**
     * WooCommerce deve estar disponível (carregado do sibling no Local WP).
     */
    public function test_woocommerce_is_loaded(): void {
        $this->assertTrue( class_exists( 'WooCommerce' ), 'WooCommerce não está carregado. Verifique o caminho sibling em tests/bootstrap.php.' );
        $this->assertNotNull( WC(), 'WC() retornou null. WooCommerce pode não ter sido inicializado corretamente.' );
    }

    /**
     * O plugin Woo Better Shipping Calculator for Brazil deve estar ativo.
     */
    public function test_plugin_is_active(): void {
        $this->assertTrue( class_exists( 'Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil' ) );
    }

    /**
     * Constantes do plugin devem estar definidas.
     */
    public function test_plugin_constants_are_defined(): void {
        $this->assertTrue( defined( 'WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION' ) );
        $this->assertTrue( defined( 'WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL' ) );
        $this->assertTrue( defined( 'WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME' ) );
    }
}
