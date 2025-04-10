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

        if (has_block('woocommerce/cart')) {
            wp_enqueue_script(
                $this->plugin_name . '-gutenberg-cep-field',
                plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergCEPField.js',
                array(),
                $this->version,
                false
            );

            // Passar os dados para o JS
            wp_localize_script(
                $this->plugin_name . '-gutenberg-cep-field',
                'wcBetterShippingCalculatorParams',
                array(
                    'cep_required' => get_option('woo_better_calc_cep_required', 'no') // 'no' como fallback
                )
            );
        }

        if (has_block('woocommerce/checkout')) {
            $number_field = get_option('woo_better_calc_number_required', 'no');
            if ($number_field === 'yes') {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-number-field',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergNumberField.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

        if (is_checkout()) {
            $number_field = get_option('woo_better_calc_number_required', 'no');
            if ($number_field === 'yes') {
                wp_enqueue_script(
                    $this->plugin_name . '-short-number-field',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicShortNumberField.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

    }

    public function add_extra_js()
    {
        if (! is_cart()) {
            return;
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
