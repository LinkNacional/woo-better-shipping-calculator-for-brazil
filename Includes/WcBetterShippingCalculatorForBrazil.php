<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes;

use Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials\WcBetterShippingCalculatorForBrazilWcSettings;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdmin;
use Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic;
use Automattic\WooCommerce\StoreApi\Schemas\V1\CartItemSchema;
use Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema;

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
            $this->version = '4.1.1';
        }
        $this->plugin_name = 'wc-better-shipping-calculator-for-brazil';

        $this->load_dependencies();
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
        $this->loader->add_filter('woocommerce_checkout_fields', $this, 'lkn_add_custom_checkout_field');

        $this->loader->add_action('rest_api_init', $this, 'lkn_register_custom_cep_route');
        $this->loader->add_action('woocommerce_checkout_create_order', $this, 'lkn_merge_address_checkout', 999, 2);

        $this->loader->add_filter('woocommerce_get_settings_pages', $this, 'lkn_add_woo_better_settings_page');

        $this->loader->add_action('admin_footer', $this, 'lkn_woo_better_footer_page');

        $this->loader->add_filter('plugin_action_links_' . WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME, $this, 'lkn_add_settings_link', 10, 2);

        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'no');

        $this->loader->add_action('woocommerce_init', $this, 'lkn_set_country_brasil', 999);

        if ($disabled_shipping === 'yes') {
            $this->loader->add_action('woocommerce_get_country_locale', $this, 'lkn_woo_better_shipping_calculator_locale', 10, 1);
        }

        $this->loader->add_filter('woocommerce_cart_needs_shipping', $this, 'lkn_custom_disable_shipping', 10, 1);
        $this->loader->add_filter('woocommerce_cart_needs_shipping_address', $this, 'lkn_custom_disable_shipping', 10, 1);

    }

    public function lkn_custom_disable_shipping()
    {
        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'no');

        if ($disabled_shipping === 'yes') {
            $disabled_shipping = false;
        } else {
            $disabled_shipping = true;
        }

        return $disabled_shipping;
    }

    public function lkn_set_country_brasil()
    {
        $customer = WC()->customer;

        // Verificar se o cliente está definido
        if (is_a($customer, 'WC_Customer')) {
            if ($customer->get_shipping_city() === '') {
                $customer->set_shipping_country('BR');
                $customer->set_shipping_state('SP');
                $customer->set_shipping_city('Exemplo');
                $customer->set_shipping_address('Exemplo');

                $customer->save();
            }
        }
    }

    public function lkn_woo_better_shipping_calculator_locale($locale)
    {
        $locale['BR']['postcode']['required'] = false;
        $locale['BR']['postcode']['hidden'] = true;

        $locale['BR']['city']['required'] = false;
        $locale['BR']['city']['hidden'] = true;

        $locale['BR']['state']['required'] = false;
        $locale['BR']['state']['hidden'] = true;

        $locale['BR']['address_1']['required'] = false;
        $locale['BR']['address_1']['hidden'] = true;

        $locale['BR']['address_2']['required'] = false;
        $locale['BR']['address_2']['hidden'] = true;

        return $locale;
    }

    public function lkn_woo_better_footer_page()
    {
        // Verifica se estamos na página e na aba correta
        if (
            isset($_GET['page'], $_GET['tab']) &&
            sanitize_text_field(wp_unslash($_GET['page'])) === 'wc-settings' &&
            sanitize_text_field(wp_unslash($_GET['tab'])) === 'wc-better-calc'
        ) {
            wp_enqueue_script(
                'wc-better-calc-footer-message',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/js/WcBetterShippingCalculatorForBrazilAdminSettings.js',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true
            );

            wp_enqueue_style(
                'wc-better-calc-style-settings',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/css/WcBetterShippingCalculatorForBrazilAdminSettings.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                'all'
            );
        }
    }

    public function lkn_add_settings_link($links)
    {
        $url = esc_url(admin_url('admin.php?page=wc-settings&tab=wc-better-calc'));

        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            $url,
            esc_html__('Configurações', 'woo-better-shipping-calculator-for-brazil')
        );

        $links[] = $settings_link;
        return $links;
    }


    public function lkn_add_woo_better_settings_page($settings)
    {
        $settings[] = new WcBetterShippingCalculatorForBrazilWcSettings();
        return $settings;
    }

    public function lkn_add_custom_checkout_field($fields)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');
        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'no');

        if ($number_field === 'yes' && $disabled_shipping === 'no') {
            // Adiciona um novo campo dentro do endereço de cobrança
            $fields['billing']['lkn_billing_number'] = array(
                'label'       => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Ex: 123a', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 52,
            );

            // Checkbox
            $fields['billing']['lkn_billing_checkbox'] = array(
                'type'        => 'checkbox',
                'label'       => __('Sem número (S/N)', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => false,
                'class'       => array('form-row-wide'),
                'priority'    => 55,
            );

            $fields['shipping']['lkn_shipping_number'] = array(
                'label'       => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Ex: 123a', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 52,
            );

            // Checkbox
            $fields['shipping']['lkn_shipping_checkbox'] = array(
                'type'        => 'checkbox',
                'label'       => __('Sem número (S/N)', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => false,
                'class'       => array('form-row-wide'),
                'priority'    => 55,
            );
        }

        if ($disabled_shipping === 'yes') {
            unset($fields['billing']['billing_state']);
            unset($fields['shipping']['shipping_state']);

            // Desabilita validação de CEP e torna não obrigatório
            $fields['billing']['billing_postcode']['validate'] = array();
            $fields['billing']['billing_postcode']['required'] = false;

            $fields['shipping']['shipping_postcode']['validate'] = array();
            $fields['shipping']['shipping_postcode']['required'] = false;

            $fields['billing']['billing_country'] = [
                'type'     => 'hidden',
                'default'  => 'BR'
            ];
            $fields['shipping']['shipping_country'] = [
                'type'     => 'hidden',
                'default'  => 'BR'
            ];

            // Remove os outros campos visuais
            unset($fields['billing']['billing_postcode']);
            unset($fields['billing']['billing_address_1']);
            unset($fields['billing']['billing_address_2']);
            unset($fields['billing']['billing_city']);
            unset($fields['billing']['billing_state']);

            unset($fields['shipping']['shipping_postcode']);
            unset($fields['shipping']['shipping_address_1']);
            unset($fields['shipping']['shipping_address_2']);
            unset($fields['shipping']['shipping_city']);
            unset($fields['shipping']['shipping_state']);
        }

        return $fields;
    }

    public function lkn_merge_address_checkout($order, $data)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');

        if ($number_field === 'yes') {
            $shipping_number = '';
            $billing_number = '';

            if (isset($_POST['lkn_billing_number'])) {
                $billing_number = sanitize_text_field(wp_unslash($_POST['lkn_billing_number']));
            }

            if (isset($_POST['lkn_shipping_number'])) {
                $shipping_number = sanitize_text_field(wp_unslash($_POST['lkn_shipping_number']));
            }

            if (empty($shipping_number) && isset($billing_number)) {
                $shipping_number = $billing_number;
            }

            if (empty($billing_number) && isset($shipping_number)) {
                $billing_number = $shipping_number;
            }

            if (empty($shipping_number) && empty($billing_number)) {
                $shipping_number = "S/N";
                $billing_number = "S/N";
            }

            // Obtém os valores dos campos preenchidos pelo usuário
            $billing_address = $data['billing_address_1'] ?? '';

            $shipping_address = $data['shipping_address_1'] ?? '';

            if (!empty($billing_address)) {
                $new_billing = $billing_address . ' - ' . $billing_number;
                $order->set_billing_address_1($new_billing);
            }

            if (!empty($shipping_address)) {
                $new_shipping = $shipping_address . ' - ' . $shipping_number;
                $order->set_shipping_address_1($new_shipping);
            }
        }
    }

    public function lkn_register_custom_cep_route()
    {
        register_rest_route('lknwcbettershipping/v1', '/cep/', array(
            'methods' => 'GET',
            'callback' => array($this, 'lkn_get_cep_info'),
            'args' => array(
                'postcode' => array(
                    'required' => true,
                )
            ),
        ));
    }

    public function lkn_get_cep_info(\WP_REST_Request $request)
    {
        // Pega o parâmetro cep da requisição
        $cep = $request->get_param('postcode');

        $country = 'BR';

        if (function_exists('WC') && WC()->customer && method_exists(WC()->customer, 'get_shipping_country')) {
            $country = WC()->customer->get_shipping_country();
        }

        // Verifica se o país é o Brasil (BR)
        if (isset($country) && strtolower($country) !== 'br') {
            return new \WP_REST_Response(
                array(
                    'status' => false,
                    'message' => 'Somente CEPs do Brasil são aceitos.',
                ),
                400 // Erro de solicitação inválida
            );
        }

        // Verifica se o CEP tem exatamente 8 dígitos numéricos, com ou sem hífen
        if (!preg_match('/^\d{8}$/', $cep) && !preg_match('/^\d{5}-\d{3}$/', $cep)) {
            return new \WP_REST_Response(
                array(
                    'status' => false,
                    'message' => 'CEP inválido. O formato correto é XXXXX-XXX ou XXXXXXXX.',
                ),
                400 // Erro de solicitação inválida
            );
        }

        // Se o formato for XXXXXXXX (sem o hífen), adiciona o hífen no formato XXXXX-XXX
        if (preg_match('/^\d{8}$/', $cep)) {
            $cep = substr($cep, 0, 5) . '-' . substr($cep, 5);
        }

        // Realiza a requisição à BrasilAPI
        $response = wp_remote_get("https://brasilapi.com.br/api/cep/v2/{$cep}");

        // Verifica se houve erro na requisição
        if (is_wp_error($response)) {
            return new \WP_REST_Response(
                array(
                    'status' => false,
                    'message' => 'CEP inválido.',
                ),
                400
            );
        }

        // Pega o corpo da resposta e converte em um array
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Verifica se o CEP foi encontrado na resposta
        if (isset($data['cep'])) {
            $state = $this->lkn_get_state_name_from_sigla($data['state']);

            return new \WP_REST_Response(
                array(
                    'status' => true,
                    'city' => $data['city'],
                    'state_sigla' => $data['state'],
                    'state' => $state,
                    'address' => $data['street']
                ),
                200
            );
        }

        // Caso a resposta seja um erro, como no caso de CEP inválido
        if (isset($data['errors']) && !empty($data['errors'])) {
            return new \WP_REST_Response(
                array(
                    'status' => false,
                    'message' => 'Cep não encontrado ou inválido.',
                ),
                404 // Erro de validação de CEP
            );
        }

        // Caso o CEP não seja encontrado
        return new \WP_REST_Response(
            array(
                'status' => false,
                'message' => 'CEP não encontrado.',
            ),
            404 // Erro de não encontrado
        );
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
        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts', 100);
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

    public function lkn_get_state_name_from_sigla($sigla)
    {
        $estados = array(
            'AC' => 'Acre',
            'AL' => 'Alagoas',
            'AP' => 'Amapá',
            'AM' => 'Amazonas',
            'BA' => 'Bahia',
            'CE' => 'Ceará',
            'DF' => 'Distrito Federal',
            'ES' => 'Espírito Santo',
            'GO' => 'Goiás',
            'MA' => 'Maranhão',
            'MT' => 'Mato Grosso',
            'MS' => 'Mato Grosso do Sul',
            'MG' => 'Minas Gerais',
            'PA' => 'Pará',
            'PB' => 'Paraíba',
            'PR' => 'Paraná',
            'PE' => 'Pernambuco',
            'PI' => 'Piauí',
            'RJ' => 'Rio de Janeiro',
            'RN' => 'Rio Grande do Norte',
            'RS' => 'Rio Grande do Sul',
            'RO' => 'Rondônia',
            'RR' => 'Roraima',
            'SC' => 'Santa Catarina',
            'SP' => 'São Paulo',
            'SE' => 'Sergipe',
            'TO' => 'Tocantins',
        );

        // Verifica se a sigla existe no array
        if (array_key_exists($sigla, $estados)) {
            return $estados[$sigla];
        } else {
            return $sigla;
        }
    }
}
