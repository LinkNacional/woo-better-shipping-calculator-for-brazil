<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazilHelpers as h;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazilStates;

/**
 * The admin-specific functionality of the plugin.
 *
 * @link       https://linknacional.com.br
 * @since      1.0.0
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/admin
 */

/**
 * The admin-specific functionality of the plugin.
 *
 * Defines the plugin name, version, and two examples hooks for how to
 * enqueue the admin-specific stylesheet and JavaScript.
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/admin
 * @author     Link Nacional <contato@linknacional.com>
 */
class WcBetterShippingCalculatorForBrazilAdmin
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
     * @param      string    $plugin_name       The name of this plugin.
     * @param      string    $version    The version of this plugin.
     */
    public function __construct($plugin_name, $version)
    {

        $this->plugin_name = $plugin_name;
        $this->version = $version;

    }

    /**
     * Register the stylesheets for the admin area.
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

        wp_enqueue_style($this->plugin_name, plugin_dir_url(__FILE__) . 'css/WcBetterShippingCalculatorForBrazilAdmin.css', array(), $this->version, 'all');

    }

    /**
     * Register the JavaScript for the admin area.
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

        wp_enqueue_script($this->plugin_name, plugin_dir_url(__FILE__) . 'js/WcBetterShippingCalculatorForBrazilAdmin.js', array( 'jquery' ), $this->version, false);

    }

    public function plugin_meta($plugin_meta, $plugin_file)
    {
        if (plugin_basename(h::config_get('FILE')) === $plugin_file) {
            $donation_url = esc_url(h::config_get('DONATION_URL'));
            $forum_url = h::config_get('PLUGIN_FORUM');

            $plugin_meta[] = "<a href=\"$forum_url\" target='blank' rel='noopener'>" . esc_html__('Community support', 'wc-better-shipping-calculator-for-brazil') .  "</a>";

            $plugin_meta[] = "<a href=\"$donation_url\" target='blank' rel='noopener' style='color:#087f5b;font-weight:700;'>" . esc_html__('Donate', 'wc-better-shipping-calculator-for-brazil') .  "</a>";
        }
        return $plugin_meta;
    }


    public function add_extra_css()
    {
        // translate to "Calcule o frete:"
        $postcode_label = apply_filters(
            h::prefix('postcode_label'),
            __('Calculate shipping:', 'wc-better-shipping-calculator-for-brazil')
        );
        ?>
<style>
    <?php if ($postcode_label) : ?>
    #calc_shipping_postcode_field::before {
        display: block;
        content: "<?php echo esc_html($postcode_label); ?>";
    }

    <?php endif; ?>

    .shipping-calculator-button {
        display: none !important;
        visibility: hidden !important;
    }

    .shipping-calculator-form {
        display: block !important;
        height: auto !important;
    }
</style>
<?php
    }

    public function prepare_address($address)
    {
        $country = h::get($address['country'], 'BR');
        if (! $country || 'BR' === $country) {
            $postcode = \wc_clean(\wp_unslash($address['postcode'] ?? ''));
            $state = WcBetterShippingCalculatorForBrazilStates::get_state_from_postcode($postcode);
            if ($state) {
                $address['country'] = 'BR';
                $_POST['calc_shipping_country'] = 'BR';
                $address['state'] = $state;
                $_POST['calc_shipping_state'] = $state;
                $address['postcode'] = $postcode;
                $_POST['calc_shipping_postcode'] = $postcode;
            }
        }
        return $address;
    }
}
