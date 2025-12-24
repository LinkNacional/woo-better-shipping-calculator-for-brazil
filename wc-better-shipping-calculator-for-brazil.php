<?php

/**
 * The plugin bootstrap file
 *
 * This file is read by WordPress to generate the plugin information in the plugin
 * admin area. This file also includes all of the dependencies used by the plugin,
 * registers the activation and deactivation functions, and defines a function
 * that starts the plugin.
 *
 * @link              https://linknacional.com.br
 * @since             1.0.0
 * @package           WcBetterShippingCalculatorForBrazil
 *
 * @wordpress-plugin
 * Plugin Name:       Calculadora de Frete e Campos Checkout para o Brasil
 * Plugin URI:        https://www.linknacional.com.br/wordpress
 * Description:       Calculadora automática de Frete com CEP para Woocommerce. Sem necessidade de informar o Pais e estado. Compatível com Gutenberg e shortcodes. Ideal para Lojas Brasileiras.
 * Version:           4.7.0-rc.2
 * Author:            Link Nacional
 * Author URI:        https://linknacional.com.br/
 * Requires PHP:      7.3
 * Requires at least: 4.6
 * License:           GPLv2 or later
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       woo-better-shipping-calculator-for-brazil
 * Domain Path:       /languages
 * Requires Plugins: woocommerce
 */

use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazilActivator;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazilDeactivator;

require_once __DIR__ . '/vendor/autoload.php';

// If this file is called directly, abort.
if (! defined('WPINC')) {
    die;
}

/**
 * Currently plugin version.
 * Start at version 1.0.0 and use SemVer - https://semver.org
 * Rename this for your plugin and update it as you release new versions.
 */
// Consts
if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')) {
    define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION', '4.7.0');
}

if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_MIN_GIVE_VERSION')) {
    define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_MIN_GIVE_VERSION', '1.0.0');
}

if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_FILE')) {
    define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_FILE', __DIR__ . '/wc-better-shipping-calculator-for-brazil.php');
}

if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR')) {
    define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR', plugin_dir_path(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_FILE));
}

if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL')) {
    define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL', plugin_dir_url(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_FILE));
}

if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME')) {
    define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME', plugin_basename(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_FILE));
}

if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_FILE')) {
    define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_FILE', __FILE__);
}

if (! defined('WC_BETTER_SHIPPING_PRODUCT_QUANTITY')) {
    define('WC_BETTER_SHIPPING_PRODUCT_QUANTITY', 1);
}

/**
 * The code that runs during plugin activation.
 * This action is documented in includes/class-wc-better-shipping-calculator-for-brazil-activator.php
 */
function activateWcBetterShippingCalculatorForBrazil()
{
    WcBetterShippingCalculatorForBrazilActivator::activate();
}

/**
 * The code that runs during plugin deactivation.
 * This action is documented in includes/class-wc-better-shipping-calculator-for-brazil-deactivator.php
 */
function deactivateWcBetterShippingCalculatorForBrazil()
{
    WcBetterShippingCalculatorForBrazilDeactivator::deactivate();
}

register_activation_hook(__FILE__, 'activateWcBetterShippingCalculatorForBrazil');
register_deactivation_hook(__FILE__, 'deactivateWcBetterShippingCalculatorForBrazil');


/**
 * Begins execution of the plugin.
 *
 * Since everything within the plugin is registered via hooks,
 * then kicking off the plugin from this point in the file does
 * not affect the page life cycle.
 *
 * @since    1.0.0
 */
function runWcBetterShippingCalculatorForBrazil()
{

    $plugin = new WcBetterShippingCalculatorForBrazil();
    $plugin->run();

}
runWcBetterShippingCalculatorForBrazil();
