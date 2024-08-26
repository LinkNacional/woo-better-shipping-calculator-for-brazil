<?php
/*
Plugin Name: Calculadora de frete melhorada para lojas brasileiras
Plugin URI: https://github.com/luizbills/woo-better-shipping-calculator-for-brazil
Description: Calculadora de frete do WooCommerce otimizada para lojas brasileiras: remove dos campos de país, estado e cidade. E alguns outros ajustes.
Version: 3.2.2
Author: Luiz Bills
Author URI: https://luizpb.com
Requires PHP: 7.3
Requires at least: 4.6
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
Text Domain: wc-better-shipping-calculator-for-brazil
Domain Path: /languages
Requires Plugins: woocommerce
*/

// prevents your PHP files from being executed via direct browser access
defined( 'WPINC' ) || exit( 1 );

load_plugin_textdomain( 'wc-better-shipping-calculator-for-brazil', false, dirname( plugin_basename( __FILE__ ) ) . '/languages/' );

try {
	// check composer autoload
	$composer_autoload = __DIR__ . '/vendor/autoload.php';
	if ( ! file_exists( $composer_autoload ) ) {
		throw new \Error( $composer_autoload . ' does not exist' );
	}
	include_once $composer_autoload;
} catch ( Throwable $e ) {
	return add_action( 'admin_notices', function () use ( $e ) {
		if ( ! current_user_can( 'install_plugins' ) ) return;
		list( $plugin_name ) = get_file_data( __FILE__, [ 'plugin name' ] );
		$message = sprintf(
			/* translators: %1$s is replaced with plugin name and %2$s with an error message */
			esc_html__( 'Error on %1$s plugin activation: %2$s', 'wc-better-shipping-calculator-for-brazil' ),
			'<strong>' . esc_html( $plugin_name ) . '</strong>',
			'<br><code>' . esc_html( $e->getMessage() ) . '</code>'
		);
		echo "<div class='notice notice-error'><p>$message</p></div>";
	} );
}

// run the plugin
\WC_Better_Shipping_Calculator_for_Brazil\Core\Main::start_plugin( __FILE__ );
