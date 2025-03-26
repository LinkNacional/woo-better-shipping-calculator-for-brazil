<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes;

use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdmin;
use Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic;

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://linknacional.com.br
 * @since      1.0.0
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 * @author     Link Nacional <contato@linknacional.com>
 */
class WcBetterShippingCalculatorForBrazil
{
    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      WcBetterShippingCalculatorForBrazilLoader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * Define the core functionality of the plugin.
     *
     * Set the plugin name and the plugin version that can be used throughout the plugin.
     * Load the dependencies, define the locale, and set the hooks for the admin area and
     * the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function __construct()
    {
        if (defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')) {
            $this->version = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION;
        } else {
            $this->version = '4.0.0';
        }
        $this->plugin_name = 'wc-better-shipping-calculator-for-brazil';

        $this->load_dependencies();
        $this->set_locale();
        $this->define_admin_hooks();
        $this->define_public_hooks();

    }

    /**
     * Load the required dependencies for this plugin.
     *
     * Include the following files that make up the plugin:
     *
     * - WcBetterShippingCalculatorForBrazilLoader. Orchestrates the hooks of the plugin.
     * - WcBetterShippingCalculatorForBrazilI18n. Defines internationalization functionality.
     * - WcBetterShippingCalculatorForBrazilAdmin. Defines all hooks for the admin area.
     * - WcBetterShippingCalculatorForBrazilPublic. Defines all hooks for the public side of the site.
     *
     * Create an instance of the loader which will be used to register the hooks
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function load_dependencies()
    {
        $this->loader = new WcBetterShippingCalculatorForBrazilLoader();
    }

    /**
     * Define the locale for this plugin for internationalization.
     *
     * Uses the WcBetterShippingCalculatorForBrazilI18n class in order to set the domain and to register the hook
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function set_locale()
    {

        $plugin_i18n = new WcBetterShippingCalculatorForBrazilI18n();

        $this->loader->add_action('plugins_loaded', $plugin_i18n, 'load_plugin_textdomain');

    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_admin_hooks()
    {

        $plugin_admin = new WcBetterShippingCalculatorForBrazilAdmin($this->get_plugin_name(), $this->get_version());

        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_styles');
        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts');

        // Notice
        $this->loader->add_filter('plugin_row_meta', $plugin_admin, 'plugin_meta', 10, 2);

        // force shipping cart settings
        $this->loader->add_filter('option_woocommerce_enable_shipping_calc', $this, 'activate_fields', 20);
        $this->loader->add_filter('option_woocommerce_shipping_cost_requires_address', $this, 'activate_fields', 20);

        // hide shipping calculator country, state and city fields
        $this->loader->add_filter('woocommerce_shipping_calculator_enable_country', $this, 'woo_fields', 20);
        $this->loader->add_filter('woocommerce_shipping_calculator_enable_state', $this, 'woo_fields', 20);
        $this->loader->add_filter('woocommerce_shipping_calculator_enable_city', $this, 'woo_fields', 20);

        // detect state from postcode
        $this->loader->add_action('woocommerce_before_shipping_calculator', $plugin_admin, 'add_extra_css');
        $this->loader->add_filter('woocommerce_cart_calculate_shipping_address', $plugin_admin, 'prepare_address', 5);
    }

    public function woo_fields()
    {
        return false;
    }

    public function activate_fields()
    {
        return 'yes';
    }

    /**
     * Register all of the hooks related to the public-facing functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_public_hooks()
    {

        $plugin_public = new WcBetterShippingCalculatorForBrazilPublic($this->get_plugin_name(), $this->get_version());

        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_styles');
        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts');

        // frontend scripts
        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'add_extra_js');

    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run()
    {
        $this->loader->run();
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name()
    {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    WcBetterShippingCalculatorForBrazilLoader    Orchestrates the hooks of the plugin.
     */
    public function get_loader()
    {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version()
    {
        return $this->version;
    }
}
