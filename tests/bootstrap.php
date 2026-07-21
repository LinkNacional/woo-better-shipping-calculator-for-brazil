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
// 4. Hook muplugins_loaded: carrega WooCommerce sibling
// ---------------------------------------------------------------------------
tests_add_filter(
    'muplugins_loaded',
    function () {
        $wc_main_file = dirname( __DIR__, 2 ) . '/woocommerce/woocommerce.php';

        if ( ! file_exists( $wc_main_file ) ) {
            fwrite(
                STDERR,
                sprintf(
                    '[Tests Bootstrap] ERRO: WooCommerce não encontrado em: %s' . PHP_EOL .
                    'Certifique-se de que o WooCommerce está instalado como vizinho do plugin no Local WP.' . PHP_EOL .
                    'Estrutura esperada: wp-content/plugins/woocommerce/woocommerce.php' . PHP_EOL,
                    $wc_main_file
                )
            );
            return;
        }

        require_once $wc_main_file;
    },
    5 // Prioridade menor = carrega ANTES
);

// ---------------------------------------------------------------------------
// 5. Hook muplugins_loaded: carrega nosso plugin
// ---------------------------------------------------------------------------
tests_add_filter(
    'muplugins_loaded',
    function () {
        $plugin_main_file = dirname( __DIR__ ) . '/wc-better-shipping-calculator-for-brazil.php';

        require_once $plugin_main_file;
    },
    10 // Prioridade maior = carrega DEPOIS do WooCommerce
);
