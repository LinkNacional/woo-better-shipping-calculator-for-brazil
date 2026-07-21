<?php
/**
 * Bootstrap de testes integrados.
 *
 * Fluxo de carga:
 *   1. wp-tests-config.php  → constantes de DB + ABSPATH
 *   2. wp-phpunit bootstrap  → carrega WordPress (wp-settings.php)
 *   3. hook muplugins_loaded → WooCommerce sibling (../../woocommerce/woocommerce.php)
 *   4. hook muplugins_loaded → nosso plugin (../wc-better-shipping-calculator-for-brazil.php)
 *
 * REGRA DE OURO: O WooCommerce DEVE ser carregado ANTES do nosso plugin.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

// ---------------------------------------------------------------------------
// 1. Caminho para o arquivo de configuração dos testes
// ---------------------------------------------------------------------------
if ( ! defined( 'WP_TESTS_CONFIG_FILE_PATH' ) ) {
    define( 'WP_TESTS_CONFIG_FILE_PATH', dirname( __DIR__ ) . '/wp-tests-config.php' );
}

// ---------------------------------------------------------------------------
// 2. Caminho para os PHPUnit Polyfills (Yoast)
// ---------------------------------------------------------------------------
if ( ! defined( 'WP_TESTS_PHPUNIT_POLYFILLS_PATH' ) ) {
    define(
        'WP_TESTS_PHPUNIT_POLYFILLS_PATH',
        dirname( __DIR__ ) . '/vendor/yoast/phpunit-polyfills/phpunitpolyfills-autoload.php'
    );
}

// ---------------------------------------------------------------------------
// 3. Carrega o bootstrap do wp-phpunit (define WordPress, hooks, etc.)
// ---------------------------------------------------------------------------
require_once dirname( __DIR__ ) . '/vendor/wp-phpunit/wp-phpunit/includes/bootstrap.php';

// ---------------------------------------------------------------------------
// 4. Carrega WooCommerce sibling + nosso plugin ANTES do wp-settings.php
// ---------------------------------------------------------------------------
$wc_main_file = dirname( __DIR__, 2 ) . '/woocommerce/woocommerce.php';
$plugin_main_file = dirname( __DIR__ ) . '/wc-better-shipping-calculator-for-brazil.php';

if ( ! file_exists( $wc_main_file ) ) {
    fwrite(
        STDERR,
        sprintf(
            '[Tests Bootstrap] ERRO: WooCommerce não encontrado em: %s' . PHP_EOL,
            $wc_main_file
        )
    );
} else {
    require_once $wc_main_file;
}

// Nosso plugin: require_once antes do WP carregar.
// As funções add_action/add_filter ainda não existem, mas o plugin
// só as chama na construção do objeto (adiada pelo autoloader).
// Constantes e autoloader são definidos imediatamente.
require_once $plugin_main_file;
