<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\PublicView;

use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazilHelpers as h;

/**
 * The public-facing functionality of the plugin.
 *
 * @link       https://linknacional.com.br
 * @since      1.0.0
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/public
 */

/**
 * The public-facing functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the public-facing stylesheet and JavaScript.
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/public
 * @author     Link Nacional <contato@linknacional.com>
 */
class WcBetterShippingCalculatorForBrazilPublic
{
    /**
     * The ID of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $plugin_name    The ID of this plugin.
     */
    private $plugin_name;

    /**
     * The version of this plugin.
     *
     * @since    1.0.0
     * @access   private
     * @var      string    $version    The current version of this plugin.
     */
    private $version;

    /**
     * Initialize the class and set its properties.
     *
     * @since    1.0.0
     * @param      string    $plugin_name       The name of the plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct($plugin_name, $version)
    {

        $this->plugin_name = $plugin_name;
        $this->version = $version;

    }

    /**
     * Register the stylesheets for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_styles()
    {

        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in WcBetterShippingCalculatorForBrazilLoader as all of the hooks are defined
         * in that particular class.
         *
         * The WcBetterShippingCalculatorForBrazilLoader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */

        wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/WcBetterShippingCalculatorForBrazilPublic.css', array(), $this->version, 'all');

    }

    /**
     * Register the JavaScript for the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function enqueue_scripts()
    {

        /**
         * This function is provided for demonstration purposes only.
         *
         * An instance of this class should be passed to the run() function
         * defined in WcBetterShippingCalculatorForBrazilLoader as all of the hooks are defined
         * in that particular class.
         *
         * The WcBetterShippingCalculatorForBrazilLoader will then create the relationship
         * between the defined hooks and the functions defined in this
         * class.
         */

        wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublic.js', array( 'jquery' ), $this->version, false);

        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');
        $hidden_address = get_option('woo_better_hidden_cart_address', 'yes');
        $cep_required = get_option('woo_better_calc_cep_required', 'no');

        if (has_block('woocommerce/cart') && $cep_required === 'yes') {
            wp_enqueue_script(
                $this->plugin_name . '-gutenberg-cep-field',
                plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergCEPField.js',
                array(),
                $this->version,
                false
            );

            if (defined('WC_VERSION')) {
                $woo_version_type = version_compare(WC_VERSION, '9.5.0', '>') ? 'woo-block' : 'woo-class';

                wp_localize_script($this->plugin_name . '-gutenberg-cep-field', 'WooBetterData', [
                    'wooVersion' => $woo_version_type,
                ]);
            }
        }

        if (has_block('woocommerce/checkout')) {
            $number_field = get_option('woo_better_calc_number_required', 'no');


            $only_virtual = false;
            if (function_exists('WC')) {
                if (isset(WC()->cart)) {
                    foreach (WC()->cart->get_cart() as $cart_item) {
                        $product = $cart_item['data'];
                        if ($product->is_virtual() || $product->is_downloadable()) {
                            $only_virtual = true;
                        } else {
                            $only_virtual = false;
                            break;
                        }
                    }
                }
            }

            if ($number_field === 'yes' && ($disabled_shipping === 'default' || (!$only_virtual && $disabled_shipping === 'digital'))) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-number-field',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergNumberField.js',
                    array(),
                    $this->version,
                    false
                );
            }

            if ($disabled_shipping === 'all' || ($only_virtual && $disabled_shipping === 'digital')) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-disabled-shipping',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergDiabledFields.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

        if (function_exists('is_checkout') && is_checkout()) {
            $number_field = get_option('woo_better_calc_number_required', 'no');
            if ($number_field === 'yes' && ($disabled_shipping === 'default' || (!$only_virtual && $disabled_shipping === 'digital'))) {
                wp_enqueue_script(
                    $this->plugin_name . '-short-number-field',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicShortNumberField.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

        if (function_exists('is_cart') && is_cart()) {
            if ($hidden_address === 'yes') {
                if (wp_script_is('wc-cart-checkout-base', 'registered')) {
                    wp_deregister_script('wc-cart-checkout-base-js');

                    if (defined('WC_VERSION')) {
                        $version_parts = explode('.', WC_VERSION);
                        $version_slug = $version_parts[0] . '-' . $version_parts[1] . '-0';

                        // Define caminho base
                        $base_filename = 'wc-cart-checkout-base-frontend-';
                        $base_dir = plugin_dir_path(__FILE__) . 'js/wooCartBlocks/';
                        $base_url = plugin_dir_url(__FILE__) . 'js/wooCartBlocks/';

                        // Verifica se o arquivo da versão existe
                        $script_path = $base_dir . $base_filename . $version_slug . '.js';

                        if (!file_exists($script_path)) {
                            // Usa a constante como fallback
                            $version_slug = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_LAST_WOO_VERSION;
                        }

                        // Enfileira o script
                        wp_enqueue_script(
                            'wc-cart-checkout-base-js',
                            $base_url . $base_filename . $version_slug . '.js',
                            array(),
                            '1.0.0',
                            false
                        );
                    }
                }
            }

            wp_enqueue_script(
                $this->plugin_name . '-frontend',
                plugin_dir_url(__FILE__) . "js/WcBetterShippingCalculatorForBrazilPublicCEPField.js",
                [ 'jquery', 'wc-cart' ],
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true
            );

            wp_localize_script(
                $this->plugin_name . '-frontend',
                'wc_better_shipping_calculator_for_brazil_params',
                [
                    'postcode_placeholder' => esc_attr__('Type your postcode', 'woo-better-shipping-calculator-for-brazil'),
                    'postcode_input_type' => 'tel',
                    'selectors' => [
                        'postcode' => '#calc_shipping_postcode',
                    ],
                ]
            );
        }

    }
}
