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

        if (has_block('woocommerce/cart')) {
            $cep_required = get_option('woo_better_calc_cep_required', 'yes');

            if ($cep_required === 'yes') {
                wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/WcBetterShippingCalculatorForBrazilPublic.css', array(), $this->version, 'all');
            }
        }
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
        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');
        $hidden_address = get_option('woo_better_hidden_cart_address', 'yes');
        $cep_required = get_option('woo_better_calc_cep_required', 'yes');
        $enable_min = get_option('woo_better_enable_min_free_shipping', 'no');
        $cart_custom_postcode = get_option('woo_better_calc_enable_cart_page', 'yes');
        $cart_custom_icon = get_option('woo_better_calc_cart_input_icon', 'transit');
        $product_custom_postcode = get_option('woo_better_calc_enable_product_page', 'yes');
        $product_custom_icon = get_option('woo_better_calc_product_input_icon', 'transit');

        if (has_block('woocommerce/cart')) {

            if (current_user_can('manage_options')) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-cep-settings-link',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergSettingsLink.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script($this->plugin_name . '-gutenberg-cep-settings-link', 'lknCartData', array(
                    'settingsUrl' => admin_url('admin.php?page=wc-settings&tab=wc-better-calc'),
                ));
            }

            if ($cep_required === 'yes' && defined('WC_VERSION') && version_compare(WC_VERSION, '10.0.0', '<')) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-cep-field',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergCEPField.js',
                    array(),
                    $this->version,
                    false
                );

                if (defined('WC_VERSION')) {
                    $woo_version_type = version_compare(WC_VERSION, '9.6.0', '>=') ? 'woo-block' : 'woo-class';

                    wp_localize_script($this->plugin_name . '-gutenberg-cep-field', 'WooBetterData', [
                        'wooVersion' => $woo_version_type,
                        'wooHiddenAddress' => $hidden_address,
                        'wooUrl' => home_url()
                    ]);
                }
            }

            if ($cep_required === 'yes' && $hidden_address === 'yes') {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-hidden-address',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicGutenbergHiddenAddress.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script($this->plugin_name . '-gutenberg-hidden-address', 'WooBetterAddress', [
                    'hiddenAddress' => $hidden_address,
                ]);
            }
        }

        if ((has_block('woocommerce/checkout') || has_block('woocommerce/cart') || (function_exists('is_cart') && is_cart()) ||  (function_exists('is_checkout') && is_checkout())) && $enable_min === 'yes') {
            wp_enqueue_script(
                $this->plugin_name . '-progress-bar',
                plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilProgressBar.js',
                array(),
                $this->version,
                false
            );

            wp_localize_script(
                $this->plugin_name . '-progress-bar',
                'wc_better_shipping_progress',
                array(
                    'min_free_shipping_value' => get_option('woo_better_min_free_shipping_value', 0),
                )
            );
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
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicDiabledFields.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

        if (
            has_block('woocommerce/cart') &&
            $cart_custom_postcode === 'yes' &&
             defined('WC_VERSION') && version_compare(WC_VERSION, '10.0.0', '>=')
        ) {
            wp_enqueue_script(
                'woo-better-cart-custom-postcode',
                plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilCustomCartPostcode.js',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true 
            );

            wp_localize_script('woo-better-cart-custom-postcode', 'WooBetterData', array(
                'placeholder' => get_option('woo_better_calc_cart_input_placeholder', 'Insira seu CEP'),
                'position' => get_option('woo_better_calc_cart_input_position', 'top'),
                'custom_position' => get_option('woo_better_calc_cart_custom_position', 'h2[class*="order"]'),
                'custom_class' => array(
                    'quantity' => get_option('woo_better_calc_cart_custom_quantity', ''),
                    'remove' => get_option('woo_better_calc_cart_custom_remove', ''),
                ),
                'inputStyles' => array(
                    'backgroundColor' => get_option('woo_better_calc_cart_input_background_color_field', '#ffffff'),
                    'color' => get_option('woo_better_calc_cart_input_color_field', '#000000'),
                    'borderWidth' => get_option('woo_better_calc_cart_input_border_width', '1px'),
                    'borderStyle' => get_option('woo_better_calc_cart_input_border_style', 'solid'),
                    'borderColor' => get_option('woo_better_calc_cart_input_border_color_field', '#cccccc'),
                    'borderRadius' => get_option('woo_better_calc_cart_input_border_radius', '4px'),
                ),
                'buttonStyles' => array(
                    'backgroundColor' => get_option('woo_better_calc_cart_button_background_color_field', '#0073aa'),
                    'color' => get_option('woo_better_calc_cart_button_color_field', '#ffffff'),
                    'borderWidth' => get_option('woo_better_calc_cart_button_border_width', '1px'),
                    'borderStyle' => get_option('woo_better_calc_cart_button_border_style', 'none'),
                    'borderColor' => get_option('woo_better_calc_cart_button_border_color_field', '#0073aa'),
                    'borderRadius' => get_option('woo_better_calc_cart_button_border_radius', '4px'),
                ),
                'icon' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/postcodeOptions/' . $cart_custom_icon . '.svg',
                'iconColor' => get_option('woo_better_calc_cart_input_icon_color', '#000000'),
                'details_icon' => array(
                    'cart' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/product.svg',
                    'quantity' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/quantity.svg',
                ),
                'display_icon' => array(
                    'up' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/upButton.svg',
                    'down' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/downButton.svg',
                ),
                'wooUrl' => home_url(),
                'nonce'   => wp_create_nonce('woo_better_register_cart_address'),
                'ajaxurl' => admin_url('admin-ajax.php'),
                'product_id' => get_the_ID(),
                'quantity' => WC_BETTER_SHIPPING_PRODUCT_QUANTITY,
            ));

            wp_enqueue_style(
                'woo-better-cart-custom-postcode', 
                plugin_dir_url(dirname(__FILE__)) . 'Admin/css/WcBetterShippingCalculatorForBrazilAdminCustomPostcode.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, 
                'all'
            );
        }

        if (
            (has_block('woocommerce/product') || (function_exists('is_product') && is_product())) &&
            $product_custom_postcode === 'yes' 
        ) {
            wp_enqueue_script(
                'woo-better-product-custom-postcode',
                plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilCustomProductPostcode.js',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true 
            );

            wp_localize_script('woo-better-product-custom-postcode', 'WooBetterData', array(
                'placeholder' => get_option('woo_better_calc_product_input_placeholder', 'Insira seu CEP'),
                'position' => get_option('woo_better_calc_product_input_position', 'top'),
                'custom_position' => get_option('woo_better_calc_product_custom_position', 'h1[class*="title"]'),
                'inputStyles' => array(
                    'backgroundColor' => get_option('woo_better_calc_product_input_background_color_field', '#ffffff'),
                    'color' => get_option('woo_better_calc_product_input_color_field', '#000000'),
                    'borderWidth' => get_option('woo_better_calc_product_input_border_width', '1px'),
                    'borderStyle' => get_option('woo_better_calc_product_input_border_style', 'solid'),
                    'borderColor' => get_option('woo_better_calc_product_input_border_color_field', '#cccccc'),
                    'borderRadius' => get_option('woo_better_calc_product_input_border_radius', '4px'),
                ),
                'buttonStyles' => array(
                    'backgroundColor' => get_option('woo_better_calc_product_button_background_color_field', '#0073aa'),
                    'color' => get_option('woo_better_calc_product_button_color_field', '#ffffff'),
                    'borderWidth' => get_option('woo_better_calc_product_button_border_width', '1px'),
                    'borderStyle' => get_option('woo_better_calc_product_button_border_style', 'none'),
                    'borderColor' => get_option('woo_better_calc_product_button_border_color_field', '#0073aa'),
                    'borderRadius' => get_option('woo_better_calc_product_button_border_radius', '4px'),
                ),
                'icon' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/postcodeOptions/' . $product_custom_icon . '.svg',
                'iconColor' => get_option('woo_better_calc_product_input_icon_color', 'black-icon'),
                'details_icon' => array(
                    'product' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/product.svg',
                    'quantity' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/quantity.svg',
                ),
                'display_icon' => array(
                    'up' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/upButton.svg',
                    'down' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/downButton.svg',
                ),
                'wooUrl' => home_url(),
                'nonce'   => wp_create_nonce('woo_better_register_product_address'),
                'ajaxurl' => admin_url('admin-ajax.php'),
                'product_id' => get_the_ID(),
                'quantity' => WC_BETTER_SHIPPING_PRODUCT_QUANTITY,
            ));

            wp_enqueue_style(
                'woo-better-product-custom-postcode', 
                plugin_dir_url(dirname(__FILE__)) . 'Admin/css/WcBetterShippingCalculatorForBrazilAdminCustomPostcode.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, 
                'all'
            );
        }

        if (function_exists('is_checkout') && is_checkout()) {
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
                    $this->plugin_name . '-short-number-field',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicShortNumberField.js',
                    array(),
                    $this->version,
                    false
                );
            }

            if ($disabled_shipping === 'all' || ($only_virtual && $disabled_shipping === 'digital')) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-disabled-shipping',
                    plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilPublicDiabledFields.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

        if (function_exists('is_cart') && is_cart()) {

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
