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
            $this->version = '4.5.0';
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

        // detect state from postcode
        $this->loader->add_filter('woocommerce_checkout_fields', $this, 'lkn_add_custom_checkout_field', 100, 1);

        $this->loader->add_action('rest_api_init', $this, 'lkn_register_custom_cep_route');
        $this->loader->add_action('woocommerce_checkout_create_order', $this, 'lkn_merge_address_checkout', 999, 2);

        $this->loader->add_filter('woocommerce_get_settings_pages', $this, 'lkn_add_woo_better_settings_page');

        $this->loader->add_action('admin_footer', $this, 'lkn_woo_better_footer_page');

        $this->loader->add_filter('plugin_action_links_' . WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME, $this, 'lkn_add_settings_link', 10, 2);

        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');

        $this->loader->add_action('template_redirect', $this, 'lkn_set_country_brasil', 999);

        if ($disabled_shipping === 'all' || $disabled_shipping === 'digital') {
            $this->loader->add_action('woocommerce_get_country_locale', $this, 'lkn_woo_better_shipping_calculator_locale', 10, 1);
        }

        $this->loader->add_filter('woocommerce_cart_needs_shipping', $this, 'lkn_custom_disable_shipping', 10, 1);
        $this->loader->add_filter('woocommerce_cart_needs_shipping_address', $this, 'lkn_custom_disable_shipping', 10, 1);

        $this->loader->add_filter('woocommerce_package_rates', $this, 'lkn_simular_frete_playground', 10, 2);

        $this->loader->add_action('admin_notices', $this, 'lkn_show_admin_notice');
        $this->loader->add_action('wp_ajax_woo_better_calc_dismiss_notice', $this, 'lkn_dismiss_admin_notice');
        $this->loader->add_action('wp_ajax_woo_better_calc_update_cache_token', $this, 'lkn_update_cache_token');
    }

    public function lkn_show_admin_notice()
    {
        // Verifica se é a área admin
        if (!is_admin()) {
            return;
        }

        // Verifica se o usuário pode gerenciar opções
        if (!current_user_can('manage_options')) {
            return;
        }

        // Chave única para o notice da versão
        $version = $this->version;
        $notice_key = 'woo_better_calc_notice_dismissed_' . $version;
        $notice_dismissed = get_user_meta(get_current_user_id(), $notice_key, true);

        if ($notice_dismissed || (isset($_GET['tab']) && 'wc-better-calc' === sanitize_text_field(wp_unslash($_GET['tab'])))) {
            return;
        }

        // URL dinâmica para configurações
        $settings_url = admin_url('admin.php?page=wc-settings&tab=wc-better-calc');
        
        ?>
        <div class="notice notice-info is-dismissible" data-dismissible="woo-better-calc-notice">
            <div style="height: 100%; padding: 10px;">
                <strong style="font-size: 18px;">🚀 Calculadora de Frete para o Brasil</strong>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <p>Veja as novas funcionalidades de <strong>CHECKOUT</strong>, como preenchimento automático de endereço, campo de CEP em destaque e muito mais!</p>
                    <a href="<?php echo esc_url($settings_url); ?>" class="button button-primary" style="overflow-wrap: break-word;">
                        Configure o plugin de acordo com sua necessidade
                    </a>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * AJAX handler para dispensar o notice permanentemente
     */
    public function lkn_dismiss_admin_notice()
    {
        if (isset($_POST['nonce']) && !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'woo_better_calc_dismiss_notice')) {
            wp_die('Unauthorized');
        }

        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }

        // Chave única para o notice da versão
        $version = isset($this->version) ? $this->version : 'unknown';
        $notice_key = 'woo_better_calc_notice_dismissed_' . $version;
        update_user_meta(get_current_user_id(), $notice_key, true);
        // Também salva o meta antigo para evitar duplicidade
        update_user_meta(get_current_user_id(), 'woo_better_calc_notice_dismissed', true);
        wp_send_json_success();
    }

    /**
     * AJAX handler para atualizar o token de cache
     */
    public function lkn_update_cache_token()
    {
        // Verifica permissões
        if (!current_user_can('manage_options')) {
            wp_send_json_error('Unauthorized', 403);
        }

        // Verifica nonce se fornecido
        if (isset($_POST['nonce']) && !empty($_POST['nonce'])) {
            $nonce = sanitize_text_field(wp_unslash($_POST['nonce']));
            if (!wp_verify_nonce($nonce, 'woo_better_calc_update_cache_token')) {
                wp_send_json_error('Nonce inválido', 403);
            }
        }

        // Verifica se o token foi enviado
        if (!isset($_POST['token']) || empty($_POST['token'])) {
            wp_send_json_error('Token é obrigatório', 400);
        }

        $new_token = sanitize_text_field(wp_unslash($_POST['token']));

        // Valida o formato do token (WCBCB_ + 19 caracteres alfanuméricos)
        if (!preg_match('/^WCBCB_[A-Z0-9]{19}$/', $new_token)) {
            wp_send_json_error('Token inválido. Formato esperado: WCBCB_XXXXXXXXXXXXXXXXXXX', 400);
        }

        // Atualiza a opção no banco de dados
        $updated = update_option('woo_better_calc_enable_auto_cache_reset', $new_token);

        if ($updated) {
            wp_send_json_success(array(
                'message' => 'Token de cache atualizado com sucesso',
                'token' => $new_token
            ));
        } else {
            wp_send_json_error('Erro ao atualizar o token no banco de dados', 500);
        }
    }

    public function lkn_simular_frete_playground($rates, $package)
    {
        $enable_min = get_option('woo_better_enable_min_free_shipping', 'no');
        $min_value = floatval(get_option('woo_better_min_free_shipping_value', 0));


        if (strpos(home_url(), 'playground.wordpress.net') !== false) {
            $rates = [];

            $rate = new \WC_Shipping_Rate(
                'simulado_playground',
                'Frete Simulado (Playground)',
                12.34,
                [],
                'simulado_playground'
            );

            $rates['simulado_playground'] = $rate;
        }

        // Só aplica se estiver habilitado e valor for maior que zero
        if ($enable_min === 'yes') {
            $cart_total = WC()->cart->get_displayed_subtotal();

            if ($cart_total >= $min_value) {
                // Remove todas as opções de frete e adiciona frete grátis
                $rates = array();

                $rates['free_shipping_min'] = new \WC_Shipping_Rate(
                    'free_shipping_min',
                    __('Frete Gratuito', 'woo-better-shipping-calculator-for-brazil'),
                    0,
                    array(),
                    'free_shipping'
                );
            }
        }

        return $rates;
    }

    public function lkn_custom_disable_shipping()
    {
        $disable_shipping_option = get_option('woo_better_calc_disabled_shipping', 'default');

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

        if ($disable_shipping_option === 'all' || ($only_virtual && $disable_shipping_option === 'digital')) {
            return false;
        } else {
            // Se todos forem virtuais, não precisa de frete
            return $only_virtual ? false : true;
        }
    }

    public function lkn_set_country_brasil()
    {
        if (!function_exists('WC')) {
            return;
        }

        $customer = WC()->customer;

        // Verificar se o cliente está definido
        if (is_a($customer, 'WC_Customer')) {
            // Funcionalidade legacy de campos ocultos removida
            // Funcionalidade legacy de campos ocultos removida
        }
    }

    public function lkn_woo_better_shipping_calculator_locale($locale)
    {
        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');
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

        if ($disabled_shipping === 'all' ||  ($only_virtual && $disabled_shipping === 'digital')) {
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
        }

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
                'wc-better-calc-settings-layout',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminLayout.COMPILED.js',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true
            );

            $plugin_path = 'invoice-payment-for-woocommerce/wc-invoice-payment.php';
            $invoice_plugin_installed = file_exists(WP_PLUGIN_DIR . '/' . $plugin_path);
            $font_source = get_option('woo_better_calc_font_source', 'yes');
            $font_class = 'woo-better-poppins-family';

            if($font_source === 'no'){
                $font_class = 'woo-better-inherit-family';
            } 

            // Adiciona ajaxurl para requisições AJAX
            wp_localize_script('wc-better-calc-settings-layout', 'wcBetterCalcAjax', array(
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('woo_better_calc_admin_nonce'),
                'install_nonce' => wp_create_nonce('install-plugin_invoice-payment-for-woocommerce'),
                'plugin_slug' => 'invoice-payment-for-woocommerce',
                'invoice_plugin_installed' => $invoice_plugin_installed,
                'font_class' => $font_class
            ));

            $icons = array(
                'bill' => plugin_dir_url(__FILE__) . 'assets/icons/postcodeOptions/bill.svg',
                'postcode' => plugin_dir_url(__FILE__) . 'assets/icons/postcodeOptions/postcode.svg',
                'transit' => plugin_dir_url(__FILE__) . 'assets/icons/postcodeOptions/transit.svg',
                'zipcode' => plugin_dir_url(__FILE__) . 'assets/icons/postcodeOptions/zipcode.svg',
                'truck' => plugin_dir_url(__FILE__) . 'assets/icons/postcodeOptions/truck.svg',
                'consult' => plugin_dir_url(__FILE__) . 'assets/icons/postcodeOptions/textFieldConsult.svg',
            );

            // Passa os dados para o JavaScript
            wp_localize_script('wc-better-calc-settings-layout', 'WCBetterCalcIcons', $icons);

            // Verifica a versão do WooCommerce
            $woo_version_valid = version_compare(WC_VERSION, '10.0.0', '>=') ? 'valid' : 'invalid';

            // Passa os dados para o JavaScript
            wp_localize_script('wc-better-calc-settings-layout', 'WCBetterCalcWooVersion', array(
                'status' => $woo_version_valid,
            ));

            wp_enqueue_script(
                'wc-better-calc-footer-message',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.js',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true
            );

            wp_enqueue_style(
                'wc-better-calc-style-settings',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                'all'
            );

            wp_enqueue_style(
                'wc-better-calc-style-postcode',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminCustomPostcode.COMPILED.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                'all'
            );

            wp_enqueue_style(
                'wc-better-calc-style-admin-card-settings',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminCard.COMPILED.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                'all'
            );

            $versions = 'Woo Better v' . $this->version . ' | WooCommerce v' . WC()->version;
            ;

            wc_get_template(
                'WcBetterShippingCalculatorForBrazilAdminSettingsCard.php',
                array(
                        'backgrounds' => array(
                            'right' => plugin_dir_url(__FILE__) . 'assets/icons/backgroundCardRight.svg',
                            'left' => plugin_dir_url(__FILE__) . 'assets/icons/backgroundCardLeft.svg'
                        ),
                        'logo' => plugin_dir_url(__FILE__) . 'assets/icons/linkNacionalLogo.webp',
                        'whatsapp' => plugin_dir_url(__FILE__) . 'assets/icons/whatsapp.svg',
                        'telegram' => plugin_dir_url(__FILE__) . 'assets/icons/telegram.svg',
                        'stars' => plugin_dir_url(__FILE__) . 'assets/icons/stars.svg',
                        'versions' => $versions

                    ),
                'woocommerce/WcBetterShippingCalculatorForBrazilAdminSettingsCard/',
                plugin_dir_path(__FILE__) . 'assets/templates/'
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
        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');

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

        if ($number_field === 'yes' && ($disabled_shipping === 'default' || !$only_virtual && $disabled_shipping === 'digital')) {
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

        if ($disabled_shipping === 'all' || ($only_virtual && $disabled_shipping === 'digital')) {

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

            unset($fields['shipping']['shipping_postcode']);
            unset($fields['shipping']['shipping_address_1']);
            unset($fields['shipping']['shipping_address_2']);
            unset($fields['shipping']['shipping_city']);
        }

        return $fields;
    }

    public function lkn_merge_address_checkout($order, $data)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');
        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');

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

        if ($number_field === 'yes' && ($disabled_shipping === 'default' || !$only_virtual && $disabled_shipping === 'digital')) {
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

            if (!empty($billing_address) && !$only_virtual) {
                $new_billing = $billing_address . ' - ' . $billing_number;
                $order->set_billing_address_1($new_billing);
                WC()->session->set('woo_better_shipping_number', $billing_number);
            }

            if (!empty($shipping_address) && !$only_virtual) {
                if($billing_address == $shipping_address){
                    $shipping_number = $billing_number;
                }
                $new_shipping = $shipping_address . ' - ' . $shipping_number;
                $order->set_shipping_address_1($new_shipping);
                WC()->session->set('woo_better_billing_number', $shipping_number);
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

    /**
     * Endpoint para receber o CEP via API personalizada.
     *
     * @param \WP_REST_Request $request Objeto da requisição REST contendo o parâmetro `postcode`.
     * 
     * @return \WP_REST_Response Retorna uma resposta com o status e o CEP recebido.
     */
    public function lkn_get_cep_info(\WP_REST_Request $request)
    {
        // Pega o parâmetro cep da requisição
        $cep = $request->get_param('postcode');

        if (strpos(home_url(), 'playground.wordpress.net') !== false) {
            return new \WP_REST_Response(
                array(
                    'status' => true,
                    'city' => 'Cidade',
                    'state_sigla' => 'SP',
                    'state' => 'Sao Paulo',
                    'address' => 'Endereço'
                ),
                200
            );
        }

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
        $data = [];

        // Verifica se houve erro na requisição
        if (is_wp_error($response)) {
            $ws_response = wp_remote_get("https://viacep.com.br/ws/{$cep}/json/");

            $ws_response_body = wp_remote_retrieve_body($ws_response);
            $ws_response_data = json_decode($ws_response_body, true);

            if (isset($ws_response_data['cep'])) {
                $data = [
                    'status' => true,
                    'cep' => $ws_response_data['cep'],
                    'city' => $ws_response_data['localidade'],
                    'state_sigla' => $ws_response_data['uf'],
                    'state' => $ws_response_data['estado'],
                    'street' => $ws_response_data['logradouro']
                ];
            } else {
                return new \WP_REST_Response(
                    array(
                        'status' => false,
                        'message' => 'CEP inválido.',
                    ),
                    400
                );
            }
        } else {
            // Pega o corpo da resposta e converte em um array
            $body = wp_remote_retrieve_body($response);
            $data = json_decode($body, true);
        }


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
        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts', 900);

        $this->loader->add_action('wp_ajax_register_product_address', $this, 'lkn_register_product_address');
        $this->loader->add_action('wp_ajax_nopriv_register_product_address', $this, 'lkn_register_product_address');

        $this->loader->add_action('wp_ajax_register_cart_address', $this, 'lkn_register_cart_address');
        $this->loader->add_action('wp_ajax_nopriv_register_cart_address', $this, 'lkn_register_cart_address');

        $this->loader->add_action('wp_ajax_wc_better_calc_get_nonce', $this, 'wc_better_calc_get_nonce');
        $this->loader->add_action('wp_ajax_nopriv_wc_better_calc_get_nonce', $this, 'wc_better_calc_get_nonce');

        $this->loader->add_filter('woocommerce_checkout_fields', $this, 'wc_better_calc_checkout_fields');

        $this->loader->add_action('wp_ajax_wc_better_insert_address', $this, 'wc_better_insert_address');
        $this->loader->add_action('wp_ajax_nopriv_wc_better_insert_address', $this, 'wc_better_insert_address');

        $this->loader->add_action('woocommerce_get_country_locale', $this, 'wc_better_calc_phone_number', 10, 1);

        $this->loader->add_action('woocommerce_init', $this, 'init_woocommerce');

        $this->loader->add_action('woocommerce_checkout_order_processed', $this, 'save_phone_country_codes', 10, 2);
        $this->loader->add_action('woocommerce_store_api_checkout_update_order_from_request', $this, 'save_phone_country_codes_from_request', 10, 2);

        $this->loader->add_action('woocommerce_admin_order_data_after_billing_address', $this, 'woo_better_billing_country_code');
        $this->loader->add_action('woocommerce_admin_order_data_after_shipping_address', $this, 'woo_better_shipping_country_code');
    }

    public function woo_better_shipping_country_code($order)
    {
        $code = $order->get_meta('_shipping_phone_country_code');
        if ($code) {
            echo '<p><strong>Código do país do telefone:</strong> ' . esc_html($code) . '</p>';
        }
    }

    public function woo_better_billing_country_code($order)
    {   
        $code = $order->get_meta('_billing_phone_country_code');
        if ($code) {
            echo '<p><strong>Código do país do telefone:</strong> ' . esc_html($code) . '</p>';
        }
    }

    public function save_phone_country_codes($order_id, $data)
    {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        
        $billing_country_code = '';
        $shipping_country_code = '';
        
        // Detecta se está usando o mesmo endereço para cobrança
        $use_same_address = $this->detect_same_address_usage($order, $data);
        
        // Salvar código do país do telefone de faturação (campos tradicionais)
        if (isset($data['billing_phone_country']) && !empty($data['billing_phone_country'])) {
            $billing_country_code = sanitize_text_field($data['billing_phone_country']);
        }
        
        // Salvar código do país do telefone de entrega (campos tradicionais)
        if (isset($data['shipping_phone_country']) && !empty($data['shipping_phone_country'])) {
            $shipping_country_code = sanitize_text_field($data['shipping_phone_country']);
        }

        // Lógica aprimorada considerando o checkbox de mesmo endereço
        if ($use_same_address) {
            // Se usar mesmo endereço, prioriza o código de entrega (shipping)
            if (!empty($shipping_country_code)) {
                $billing_country_code = $shipping_country_code;
            } elseif (!empty($billing_country_code)) {
                $shipping_country_code = $billing_country_code;
            }
        } else {
            // Lógica original quando não usa mesmo endereço
            if (!empty($billing_country_code) && empty($shipping_country_code)) {
                $shipping_country_code = $billing_country_code;
            } elseif (!empty($shipping_country_code) && empty($billing_country_code)) {
                $billing_country_code = $shipping_country_code;
            }
        }

        // Processar telefone de faturação
        if (!empty($billing_country_code)) {
            $billing_phone = $order->get_billing_phone();
            if (!empty($billing_phone)) {
                $clean_phone = $this->clean_and_format_phone($billing_country_code, $billing_phone);
                $order->set_billing_phone($clean_phone);
            }
            $order->update_meta_data('_billing_phone_country_code', $billing_country_code);
        }
        
        // Processar telefone de entrega
        if (!empty($shipping_country_code)) {
            $shipping_phone = $order->get_shipping_phone();
            if (!empty($shipping_phone)) {
                $clean_phone = $this->clean_and_format_phone($shipping_country_code, $shipping_phone);
                $order->set_shipping_phone($clean_phone);
            }
            $order->update_meta_data('_shipping_phone_country_code', $shipping_country_code);
        }

        if (!empty($billing_country_code) || !empty($shipping_country_code)) {
            $order->save();
        }
    }

    // Função específica para WooCommerce Block Checkout
    public function save_phone_country_codes_from_request($order, $request)
    {
        if (!$order) {
            return;
        }
        
        $billing_country_code = '';
        $shipping_country_code = '';
        
        // Detecta se está usando o mesmo endereço para cobrança nos blocks
        $use_same_address = $this->detect_same_address_usage_from_request($order, $request);
        
        // Captura dos dados do request do Block Checkout
        $extensions = $request->get_param('extensions') ?? [];
        
        // Verifica o namespace dos códigos de país
        if (isset($extensions['woo_better_phone_country'])) {
            $phone_data = $extensions['woo_better_phone_country'];
            
            if (isset($phone_data['billing_phone_country_code'])) {
                $billing_country_code = sanitize_text_field( (string) $phone_data['billing_phone_country_code'] );
            }
            
            if (isset($phone_data['shipping_phone_country_code'])) {
                $shipping_country_code = sanitize_text_field( (string) $phone_data['shipping_phone_country_code'] );
            }
        }
        
        // Fallback para $_POST se não encontrar nos extensions
        if (empty($billing_country_code) && isset($_POST['billing_phone_country_code'])) {
            $billing_country_code = sanitize_text_field($_POST['billing_phone_country_code']);
        }
        
        if (empty($shipping_country_code) && isset($_POST['shipping_phone_country_code'])) {
            $shipping_country_code = sanitize_text_field($_POST['shipping_phone_country_code']);
        }
        
        // Lógica aprimorada considerando o checkbox de mesmo endereço
        if ($use_same_address) {
            // Se usar mesmo endereço, prioriza o código de entrega (shipping)
            if (!empty($shipping_country_code)) {
                $billing_country_code = $shipping_country_code;
            } elseif (!empty($billing_country_code)) {
                $shipping_country_code = $billing_country_code;
            }
        } else {
            // Lógica original quando não usa mesmo endereço
            if (!empty($billing_country_code) && empty($shipping_country_code)) {
                $shipping_country_code = $billing_country_code;
            } elseif (!empty($shipping_country_code) && empty($billing_country_code)) {
                $billing_country_code = $shipping_country_code;
            }
        }
        
        // Processar telefone de faturação
        if (!empty($billing_country_code)) {
            $billing_phone = $order->get_billing_phone();
            if (!empty($billing_phone)) {
                $clean_phone = $this->clean_and_format_phone($billing_country_code, $billing_phone);
                $order->set_billing_phone($clean_phone);
            }
            $order->update_meta_data('_billing_phone_country_code', $billing_country_code);
        }
        
        // Processar telefone de entrega
        if (!empty($shipping_country_code)) {
            $shipping_phone = $order->get_shipping_phone();
            if (!empty($shipping_phone)) {
                $clean_phone = $this->clean_and_format_phone($shipping_country_code, $shipping_phone);
                $order->set_shipping_phone($clean_phone);
            }
            $order->update_meta_data('_shipping_phone_country_code', $shipping_country_code);
        }
        
        if (!empty($billing_country_code) || !empty($shipping_country_code)) {
            $order->save();
        }
    }

    /**
     * Detecta se o checkbox "usar mesmo endereço para cobrança" está marcado
     *
     * @param WC_Order $order
     * @param array $data
     * @return bool
     */
    private function detect_same_address_usage($order, $data)
    {
        // Verifica se os endereços são idênticos (indica uso do mesmo endereço)
        $billing_address_1 = $order->get_billing_address_1();
        $shipping_address_1 = $order->get_shipping_address_1();
        
        $billing_city = $order->get_billing_city();
        $shipping_city = $order->get_shipping_city();
        
        $billing_postcode = $order->get_billing_postcode();
        $shipping_postcode = $order->get_shipping_postcode();
        
        // Se endereços são idênticos, assume que checkbox estava marcado
        if ($billing_address_1 === $shipping_address_1 &&
            $billing_city === $shipping_city &&
            $billing_postcode === $shipping_postcode &&
            !empty($billing_address_1)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Detecta se o checkbox "usar mesmo endereço" está marcado no WooCommerce Blocks
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return bool
     */
    private function detect_same_address_usage_from_request($order, $request)
    {
        // Tenta detectar via request params primeiro
        $use_shipping_as_billing = $request->get_param('use_shipping_as_billing');
        if ($use_shipping_as_billing === true || $use_shipping_as_billing === 'true') {
            return true;
        }
        
        // Fallback: verifica endereços idênticos
        return $this->detect_same_address_usage($order, []);
    }

    /**
     * Limpa e formata o telefone concatenando código do país + número limpo
     *
     * @param string $country_code Código do país (ex: +55)
     * @param string $phone Número de telefone original
     * @return string Telefone formatado limpo (ex: +5589999999835)
     */
    private function clean_and_format_phone($country_code, $phone)
    {
        if (empty($phone)) {
            return $phone;
        }
        
        // Se o telefone já tem código do país, apenas limpa os caracteres especiais
        if (strpos($phone, '+') === 0) {
            // Remove caracteres especiais do telefone: (, ), -, espaços
            $clean_phone = preg_replace('/[()\\s-]/', '', $phone);
            return $clean_phone;
        }
        
        // Limpa o código do país (garante que tenha o +)
        $clean_country_code = trim($country_code);
        if (!str_starts_with($clean_country_code, '+')) {
            $clean_country_code = '+' . $clean_country_code;
        }
        
        // Remove caracteres especiais do telefone: (, ), -, espaços
        $clean_phone = preg_replace('/[()\\s-]/', '', $phone);
        
        // Concatena código do país + número limpo
        $full_phone = $clean_country_code . $clean_phone;
        
        return $full_phone;
    }

    public function init_woocommerce()
    {
        if ( function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
            // Registra campos para números de endereço
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_number_validation',
                'schema_callback' => function() {
                    return [
                        'woo_better_shipping_number' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'woo_better_billing_number' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'woo_better_shipping_number'  => '', 
                        'woo_better_billing_number' => '', 
                    ];
                },
            ]);
            
            // Registra campos para códigos de país do telefone
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_phone_country',
                'schema_callback' => function() {
                    return [
                        'billing_phone_country_code' => [
                            'type'     => 'string',
                            'readonly' => false,
                        ],
                        'shipping_phone_country_code' => [
                            'type'     => 'string',
                            'readonly' => false,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_phone_country_code'  => '', 
                        'shipping_phone_country_code' => '', 
                    ];
                },
            ]);
        }

        if ( function_exists( 'woocommerce_store_api_register_update_callback' ) ) {
            // Callback para números de endereço
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_number_validation',
                'callback'  => [ $this, 'handle_number_update' ],
            ]);
            
            // Callback para códigos de país do telefone
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_phone_country',
                'callback'  => [ $this, 'handle_phone_country_update' ],
            ]);
        }
    }

    public function handle_number_update($data)
    {
        if (! function_exists('WC') ||! WC()->session ) {
            return;
        }

        // Guarda o número de faturação na sessão
        if ( isset( $data['woo_better_billing_number'] ) ) {
            $billing_number = sanitize_text_field( $data['woo_better_billing_number'] );
            WC()->session->set( 'woo_better_billing_number', $billing_number );
        }

        // Guarda o número de envio na sessão
        if ( isset( $data['woo_better_shipping_number'] ) ) {
            $shipping_number = sanitize_text_field( $data['woo_better_shipping_number'] );
            WC()->session->set( 'woo_better_shipping_number', $shipping_number );
        }
    }

    public function handle_phone_country_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        // Guarda o código do país de faturação na sessão
        if ( isset( $data['billing_phone_country_code'] ) ) {
            $country_code = sanitize_text_field( (string) $data['billing_phone_country_code'] );
            WC()->session->set( 'billing_phone_country_code', $country_code );
        }

        // Guarda o código do país de envio na sessão
        if ( isset( $data['shipping_phone_country_code'] ) ) {
            $country_code = sanitize_text_field( (string) $data['shipping_phone_country_code'] );
            WC()->session->set( 'shipping_phone_country_code', $country_code );
        }
    }

    public function wc_better_calc_phone_number($locale)
    {
        // Torna o campo phone do shipping obrigatório no Brasil se a opção estiver ativada
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        if ($phone_required === 'yes') {
            $locale['BR']['phone']['required'] = true;
        }
        return $locale;
    }

    public function wc_better_calc_checkout_fields($fields)
    {
        
        $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
        $fill_checkout_address = get_option('woo_better_calc_enable_auto_address_fill', 'no');
        $phone_required = get_option('woo_better_calc_contact_required', 'no');

        if ($phone_required === 'yes') {
            // Adiciona campo select de país do telefone para billing e shipping
            $countries = array(
                array('code' => '+1', 'name' => 'Estados Unidos', 'flag' => '🇺🇸'),
                array('code' => '+7', 'name' => 'Rússia', 'flag' => '🇷🇺'),
                array('code' => '+20', 'name' => 'Egito', 'flag' => '🇪🇬'),
                array('code' => '+27', 'name' => 'África do Sul', 'flag' => '🇿🇦'),
                array('code' => '+30', 'name' => 'Grécia', 'flag' => '🇬🇷'),
                array('code' => '+31', 'name' => 'Holanda', 'flag' => '🇳🇱'),
                array('code' => '+32', 'name' => 'Bélgica', 'flag' => '🇧🇪'),
                array('code' => '+33', 'name' => 'França', 'flag' => '🇫🇷'),
                array('code' => '+34', 'name' => 'Espanha', 'flag' => '🇪🇸'),
                array('code' => '+36', 'name' => 'Hungria', 'flag' => '🇭🇺'),
                array('code' => '+39', 'name' => 'Itália', 'flag' => '🇮🇹'),
                array('code' => '+40', 'name' => 'Romênia', 'flag' => '🇷🇴'),
                array('code' => '+41', 'name' => 'Suíça', 'flag' => '🇨🇭'),
                array('code' => '+43', 'name' => 'Áustria', 'flag' => '🇦🇹'),
                array('code' => '+44', 'name' => 'Reino Unido', 'flag' => '🇬🇧'),
                array('code' => '+45', 'name' => 'Dinamarca', 'flag' => '🇩🇰'),
                array('code' => '+46', 'name' => 'Suécia', 'flag' => '🇸🇪'),
                array('code' => '+47', 'name' => 'Noruega', 'flag' => '🇳🇴'),
                array('code' => '+48', 'name' => 'Polônia', 'flag' => '🇵🇱'),
                array('code' => '+49', 'name' => 'Alemanha', 'flag' => '🇩🇪'),
                array('code' => '+51', 'name' => 'Peru', 'flag' => '🇵🇪'),
                array('code' => '+52', 'name' => 'México', 'flag' => '🇲🇽'),
                array('code' => '+53', 'name' => 'Cuba', 'flag' => '🇨🇺'),
                array('code' => '+54', 'name' => 'Argentina', 'flag' => '🇦🇷'),
                array('code' => '+55', 'name' => 'Brasil', 'flag' => '🇧🇷'),
                array('code' => '+56', 'name' => 'Chile', 'flag' => '🇨🇱'),
                array('code' => '+57', 'name' => 'Colômbia', 'flag' => '🇨🇴'),
                array('code' => '+58', 'name' => 'Venezuela', 'flag' => '🇻🇪'),
                array('code' => '+60', 'name' => 'Malásia', 'flag' => '🇲🇾'),
                array('code' => '+61', 'name' => 'Austrália', 'flag' => '🇦🇺'),
                array('code' => '+62', 'name' => 'Indonésia', 'flag' => '🇮🇩'),
                array('code' => '+63', 'name' => 'Filipinas', 'flag' => '🇵🇭'),
                array('code' => '+64', 'name' => 'Nova Zelândia', 'flag' => '🇳🇿'),
                array('code' => '+65', 'name' => 'Singapura', 'flag' => '🇸🇬'),
                array('code' => '+66', 'name' => 'Tailândia', 'flag' => '🇹🇭'),
                array('code' => '+81', 'name' => 'Japão', 'flag' => '🇯🇵'),
                array('code' => '+82', 'name' => 'Coreia do Sul', 'flag' => '🇰🇷'),
                array('code' => '+84', 'name' => 'Vietnã', 'flag' => '🇻🇳'),
                array('code' => '+86', 'name' => 'China', 'flag' => '🇨🇳'),
                array('code' => '+90', 'name' => 'Turquia', 'flag' => '🇹🇷'),
                array('code' => '+91', 'name' => 'Índia', 'flag' => '🇮🇳'),
                array('code' => '+92', 'name' => 'Paquistão', 'flag' => '🇵🇰'),
                array('code' => '+93', 'name' => 'Afeganistão', 'flag' => '🇦🇫'),
                array('code' => '+94', 'name' => 'Sri Lanka', 'flag' => '🇱🇰'),
                array('code' => '+98', 'name' => 'Irã', 'flag' => '🇮🇷'),
                array('code' => '+212', 'name' => 'Marrocos', 'flag' => '🇲🇦'),
                array('code' => '+213', 'name' => 'Argélia', 'flag' => '🇩🇿'),
                array('code' => '+216', 'name' => 'Tunísia', 'flag' => '🇹🇳'),
                array('code' => '+218', 'name' => 'Líbia', 'flag' => '🇱🇾'),
                array('code' => '+220', 'name' => 'Gâmbia', 'flag' => '🇬🇲'),
                array('code' => '+221', 'name' => 'Senegal', 'flag' => '🇸🇳'),
                array('code' => '+222', 'name' => 'Mauritânia', 'flag' => '🇲🇷'),
                array('code' => '+223', 'name' => 'Mali', 'flag' => '🇲🇱'),
                array('code' => '+224', 'name' => 'Guiné', 'flag' => '🇬🇳'),
                array('code' => '+225', 'name' => 'Costa do Marfim', 'flag' => '🇨🇮'),
                array('code' => '+226', 'name' => 'Burkina Faso', 'flag' => '🇧🇫'),
                array('code' => '+227', 'name' => 'Níger', 'flag' => '🇳🇪'),
                array('code' => '+228', 'name' => 'Togo', 'flag' => '🇹🇬'),
                array('code' => '+229', 'name' => 'Benin', 'flag' => '🇧🇯'),
                array('code' => '+230', 'name' => 'Maurício', 'flag' => '🇲🇺'),
                array('code' => '+231', 'name' => 'Libéria', 'flag' => '🇱🇷'),
                array('code' => '+232', 'name' => 'Serra Leoa', 'flag' => '🇸🇱'),
                array('code' => '+233', 'name' => 'Gana', 'flag' => '🇬🇭'),
                array('code' => '+234', 'name' => 'Nigéria', 'flag' => '🇳🇬'),
                array('code' => '+351', 'name' => 'Portugal', 'flag' => '🇵🇹'),
            );

            // Se não existir o campo phone, cria o campo select e o campo phone
            $billing_select_options = array();
            foreach ($countries as $country) {
                $billing_select_options[$country['code']] = $country['flag'] . ' ' . $country['code'];
            }
            if (!isset($fields['billing']['billing_phone'])) {
                $fields['billing']['billing_phone_country'] = array(
                    'type'        => 'hidden',
                    'default'     => '+55',
                    'required'    => false,
                );
                $fields['billing']['billing_phone'] = array(
                    'type'        => 'tel',
                    'label'       => __('Telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'placeholder' => __('Digite o telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'required'    => true,
                    'class'       => array('form-row-wide'),
                    'priority'    => 92,
                );
            } else {
                $fields['billing']['billing_phone_country'] = array(
                    'type'        => 'hidden',
                    'default'     => '+55',
                    'required'    => false,
                );
            }

            $shipping_select_options = array();
            foreach ($countries as $country) {
                $shipping_select_options[$country['code']] = $country['code'] . ' ' . $country['flag'];
            }
            if (!isset($fields['shipping']['shipping_phone'])) {
                $fields['shipping']['shipping_phone_country'] = array(
                    'type'        => 'hidden',
                    'default'     => '+55',
                    'required'    => false,
                );
                $fields['shipping']['shipping_phone'] = array(
                    'type'        => 'tel',
                    'label'       => __('Telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'placeholder' => __('Digite o telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'required'    => true,
                    'class'       => array('form-row-wide'),
                    'priority'    => 92,
                );
            } else {
                $fields['shipping']['shipping_phone_country'] = array(
                    'type'        => 'hidden',
                    'default'     => '+55',
                    'required'    => false,
                );
            }


            if (isset($fields['billing']['billing_phone'])) {
                $fields['billing']['billing_phone']['required'] = true;
            }
            if (isset($fields['shipping']['shipping_phone'])) {
                $fields['shipping']['shipping_phone']['required'] = true;
            }
        }

        if ($fill_checkout_address === 'no' || $cep_position === 'no') {
            return $fields;
        }

        // Adiciona o campo de checkbox em billing e shipping, com IDs únicos
        $billing_checkbox_key = 'wc_better_calc_checkbox_billing';
        $shipping_checkbox_key = 'wc_better_calc_checkbox_shipping';

        $billing_checkbox_field = array(
            'type'        => 'checkbox',
            'label'       => __('Informe acima o código postal (CEP).', 'woo-better-shipping-calculator-for-brazil'),
            'required'    => false,
            'class'       => array('form-row-wide'),
            'priority'    => 90,
            'id'          => 'wc_better_calc_checkbox_billing',
        );
        $shipping_checkbox_field = array(
            'type'        => 'checkbox',
            'label'       => __('Informe acima o código postal (CEP).', 'woo-better-shipping-calculator-for-brazil'),
            'required'    => false,
            'class'       => array('form-row-wide'),
            'priority'    => 90,
            'id'          => 'wc_better_calc_checkbox_shipping',
        );

        $fields['billing'][$billing_checkbox_key] = $billing_checkbox_field;
        $fields['shipping'][$shipping_checkbox_key] = $shipping_checkbox_field;

        return $fields;
    }

    public function wc_better_insert_address() {
        // Verifica nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'wc_better_insert_address')) {
            wp_send_json_error(['message' => 'Falha na verificação de segurança (nonce).'], 403);
        }
        // Recebe e sanitiza os dados
        $address    = isset($_POST['address']) ? sanitize_text_field(wp_unslash($_POST['address'])) : '';
        $city       = isset($_POST['city']) ? sanitize_text_field(wp_unslash($_POST['city'])) : '';
        $state      = isset($_POST['state']) ? sanitize_text_field(wp_unslash($_POST['state'])) : '';
        $district   = isset($_POST['district']) ? sanitize_text_field(wp_unslash($_POST['district'])) : '';
        $postcode   = isset($_POST['postcode']) ? sanitize_text_field(wp_unslash($_POST['postcode'])) : '';
        $context    = isset($_POST['context']) ? sanitize_text_field(wp_unslash($_POST['context'])) : 'shipping';

        $updated = false;
        if (function_exists('WC') && WC()->customer) {
            if ($context === 'shipping') {
                if ($address !== '' && $district !== '') {
                    WC()->customer->set_shipping_address_1($address . ' - ' . $district);
                    $updated = true;
                } else if ($address !== '') {
                    WC()->customer->set_shipping_address_1($address);
                    $updated = true;
                }
                if ($city !== '') {
                    WC()->customer->set_shipping_city($city);
                    $updated = true;
                }
                if ($state !== '') {
                    WC()->customer->set_shipping_state($state);
                    $updated = true;
                }
                if ($postcode !== '') {
                    WC()->customer->set_shipping_postcode($postcode);
                    $updated = true;
                }
            } else {
                if( $address !== '' && $district !== '') {
                    WC()->customer->set_billing_address_1($address . ' - ' . $district);
                    $updated = true;
                } else if ($address !== '') {
                    WC()->customer->set_billing_address_1($address);
                    $updated = true;
                }
                if ($city !== '') {
                    WC()->customer->set_billing_city($city);
                    $updated = true;
                }
                if ($state !== '') {
                    WC()->customer->set_billing_state($state);
                    $updated = true;
                }
                if ($postcode !== '') {
                    WC()->customer->set_billing_postcode($postcode);
                    $updated = true;
                }
            }
            if ($updated) {
                WC()->customer->save();
            }
        }
        if ($updated) {
            wp_send_json_success([
                'message' => "Endereço inserido: {$address}, {$city} - {$district} - {$state}"
            ]);
        } else {
            wp_send_json_success([
                'message' => 'Nenhum endereço inserido, dados em branco.'
            ]);
        }
    }

    /**
     * AJAX endpoint para retornar um nonce atualizado.
     *
     * @since 1.0.0
     * @access public
     * @param string $action (opcional) Nome da ação para o nonce. Default: 'woo_better_register_cart_address'.
     * @return void JSON com o nonce gerado.
     */
    public function wc_better_calc_get_nonce() {
        // Recebe o parâmetro 'action_nonce' via POST ou GET
        if (!isset($_REQUEST['action_nonce']) || empty($_REQUEST['action_nonce'])) {
            wp_send_json_error([
                'error' => true,
                'message' => 'Parâmetro action_nonce obrigatório.'
            ], 400);
        }

        $action = sanitize_text_field(wp_unslash($_REQUEST['action_nonce']));
        $nonce = wp_create_nonce($action);
        wp_send_json_success(['nonce' => $nonce]);
    }

    /**
     * Registers the shipping address and calculates shipping rates for a product.
     *
     * @since 1.0.0
     * @access public
     *
     * @param intern Address and Nonce.
     *
     * @return void Outputs a JSON response with:
     * - message (string): Success or error message.
     * - product (array): Product information (name, quantity, currency, etc.).
     * - shipping_rates (array): Calculated shipping rates.
     */
    public function lkn_register_product_address(): void
    {
        // Captura e sanitiza o nonce do cabeçalho
        $nonce = isset($_SERVER['HTTP_NONCE']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_NONCE'])) : '';

        // Valida o nonce
        if (!wp_verify_nonce($nonce, 'woo_better_register_product_address')) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'Requisição não autorizada.',
            ), 403);
        }

        // Verifica se WooCommerce está carregado
        if (!function_exists('WC')) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'WooCommerce não está carregado.',
            ), 500);
        }

        // Obtém os dados de envio enviados pela requisição
        $shipping = isset($_POST['shipping']) && is_array($_POST['shipping']) 
            ? array_map('sanitize_text_field', wp_unslash($_POST['shipping'])) 
            : array();

        // Sanitiza os dados do array de envio
        if (is_array($shipping)) {
            $shipping = array_map('sanitize_text_field', $shipping);
        }

        // Verifica se os dados de envio estão presentes e são válidos
        if (empty($shipping) || !is_array($shipping)) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'O parâmetro "shipping" é obrigatório e deve ser um array.',
            ), 400);
        }

        // Sanitiza os dados de envio
        $shipping_data = array(
            'first_name'  => isset($shipping['first_name']) ? sanitize_text_field($shipping['first_name']) : null,
            'last_name'   => isset($shipping['last_name']) ? sanitize_text_field($shipping['last_name']) : null,
            'company'     => isset($shipping['company']) ? sanitize_text_field($shipping['company']) : null,
            'address_1'   => isset($shipping['address_1']) ? sanitize_text_field($shipping['address_1']) : null,
            'address_2'   => isset($shipping['address_2']) ? sanitize_text_field($shipping['address_2']) : null,
            'city'        => isset($shipping['city']) ? sanitize_text_field($shipping['city']) : null,
            'state'       => isset($shipping['state']) ? sanitize_text_field($shipping['state']) : null,
            'postcode'    => isset($shipping['postcode']) ? sanitize_text_field($shipping['postcode']) : null,
            'country'     => isset($shipping['country']) ? sanitize_text_field($shipping['country']) : 'BR',
            'phone'       => isset($shipping['phone']) ? sanitize_text_field($shipping['phone']) : null,
        );

        // Define as propriedades do cliente com os dados de envio e replica para cobrança
        WC()->customer->set_props(
            array(
                'shipping_first_name' => $shipping_data['first_name'],
                'shipping_last_name'  => $shipping_data['last_name'],
                'shipping_company'    => $shipping_data['company'],
                'shipping_address_1'  => $shipping_data['address_1'],
                'shipping_address_2'  => $shipping_data['address_2'],
                'shipping_city'       => $shipping_data['city'],
                'shipping_state'      => $shipping_data['state'],
                'shipping_postcode'   => $shipping_data['postcode'],
                'shipping_country'    => $shipping_data['country'],
                'shipping_phone'      => $shipping_data['phone'],
                'billing_first_name'  => $shipping_data['first_name'],
                'billing_last_name'   => $shipping_data['last_name'],
                'billing_company'     => $shipping_data['company'],
                'billing_address_1'   => $shipping_data['address_1'],
                'billing_address_2'   => $shipping_data['address_2'],
                'billing_city'        => $shipping_data['city'],
                'billing_state'       => $shipping_data['state'],
                'billing_postcode'    => $shipping_data['postcode'],
                'billing_country'     => $shipping_data['country'],
                'billing_phone'       => $shipping_data['phone'],
            )
        );

        // Salva os dados do cliente
        WC()->customer->save();

        // Obtém o ID do produto da página atual
        $product_id = isset($_POST['product_id']) ? absint($_POST['product_id']) : 0;

        if (!$product_id || !get_post($product_id)) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'Produto inválido ou não encontrado.',
            ), 400);
        }

        // Obtém o produto
        $product = wc_get_product($product_id);

        if (!$product) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'Produto não encontrado.',
            ), 400);
        }

        // Verifica se o produto é digital (virtual ou para download)
        if ($product->is_virtual() || $product->is_downloadable()) {
            wp_send_json_success(array(
                'status' => true,
                'digital' => true,
                'product_name' => $product->get_name(),
                'message' => 'O produto é digital ou baixável e não requer cálculo de frete.',
            ), 200);
        }

        // Converte o preço para float para garantir que seja numérico
        $product_price = floatval($product->get_price());
        $quantity = WC_BETTER_SHIPPING_PRODUCT_QUANTITY;
        $line_total = $product_price * $quantity;

        // Cria um pacote de envio personalizado
        $package = array(
            'contents' => array(
                $product_id => array(
                    'product_id' => $product_id,
                    'variation_id' => 0,
                    'quantity'   => $quantity,
                    'data'       => $product,
                    'line_total' => $line_total,
                    'line_subtotal' => $line_total,
                    'line_tax' => 0,
                    'line_subtotal_tax' => 0,
                ),
            ),
            'contents_cost' => $line_total,
            'applied_coupons' => array(),
            'user' => array(
                'ID' => get_current_user_id(),
            ),
            'destination' => array(
                'country'   => $shipping_data['country'],
                'state'     => $shipping_data['state'],
                'postcode'  => $shipping_data['postcode'],
                'city'      => $shipping_data['city'],
                'address'   => $shipping_data['address_1'],
                'address_2' => $shipping_data['address_2'],
            ),
        );

        // Calcula o frete para o pacote
        $shipping_instance = new \WC_Shipping();
        $shipping_methods = $shipping_instance->load_shipping_methods($package);

        $shipping_rates = array();
        $currency_symbol = get_woocommerce_currency_symbol();
        $currency_minor_unit = wc_get_price_decimals();

        $product_info = array(
            'name'     => $product->get_name(),
            'quantity' => $quantity, 
            'currency_symbol' => $currency_symbol,
            'currency_minor_unit' => $currency_minor_unit,
        );

        // Itera pelos métodos de envio e calcula as taxas
        foreach ($shipping_methods as $method) {
            if ($method->supports('shipping-zones')) {
                $rates = $method->get_rates_for_package($package);

                foreach ($rates as $rate) {
                    $shipping_rates[] = array(
                        'id'    => $rate->get_id(),
                        'label' => $rate->get_label(),
                        'cost'  => $rate->get_cost(),
                    );
                }
            }
        }

        // Retorna os valores calculados
        wp_send_json_success(array(
            'message' => 'Endereço de envio registrado com sucesso e frete calculado.',
            'product' => $product_info, // Informações do produto
            'shipping_rates' => $shipping_rates, // Taxas de envio
        ));
    }

    /**
     * Processes the cart and calculates shipping rates for the items in the cart.
     *
     * @since 1.0.0
     * @access public
     *
     * @param intern Address and Nonce.
     *
     * @return void Outputs a JSON response with:
     * - message (string): Success or error message.
     * - cart (array): Cart details including products, quantities, and totals.
     * - shipping_rates (array): Calculated shipping rates for the cart.
     */
    public function lkn_register_cart_address(): void
    {
        // Captura e sanitiza o nonce do cabeçalho
        $nonce = isset($_SERVER['HTTP_NONCE']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_NONCE'])) : '';

        // Valida o nonce
        if (!wp_verify_nonce($nonce, 'woo_better_register_cart_address')) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'Requisição não autorizada.',
            ), 403);
        }

        // Verifica se WooCommerce está carregado
        if (!function_exists('WC')) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'WooCommerce não está carregado.',
            ), 500);
        }

        // Obtém os dados de envio enviados pela requisição
        $shipping = isset($_POST['shipping']) && is_array($_POST['shipping']) 
            ? array_map('sanitize_text_field', wp_unslash($_POST['shipping'])) 
            : array();

        // Verifica se os dados de envio estão presentes e são válidos
        if (empty($shipping) || !is_array($shipping)) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'O parâmetro "shipping" é obrigatório e deve ser um array.',
            ), 400);
        }

        // Sanitiza os dados de envio
        $shipping_data = array(
            'first_name'  => isset($shipping['first_name']) ? sanitize_text_field($shipping['first_name']) : null,
            'last_name'   => isset($shipping['last_name']) ? sanitize_text_field($shipping['last_name']) : null,
            'company'     => isset($shipping['company']) ? sanitize_text_field($shipping['company']) : null,
            'address_1'   => isset($shipping['address_1']) ? sanitize_text_field($shipping['address_1']) : null,
            'address_2'   => isset($shipping['address_2']) ? sanitize_text_field($shipping['address_2']) : null,
            'city'        => isset($shipping['city']) ? sanitize_text_field($shipping['city']) : null,
            'state'       => isset($shipping['state']) ? sanitize_text_field($shipping['state']) : null,
            'postcode'    => isset($shipping['postcode']) ? sanitize_text_field($shipping['postcode']) : null,
            'country'     => isset($shipping['country']) ? sanitize_text_field($shipping['country']) : 'BR',
            'phone'       => isset($shipping['phone']) ? sanitize_text_field($shipping['phone']) : null,
        );

        // Define as propriedades do cliente com os dados de envio e replica para cobrança
        WC()->customer->set_props(
            array(
                'shipping_first_name' => $shipping_data['first_name'],
                'shipping_last_name'  => $shipping_data['last_name'],
                'shipping_company'    => $shipping_data['company'],
                'shipping_address_1'  => $shipping_data['address_1'],
                'shipping_address_2'  => $shipping_data['address_2'],
                'shipping_city'       => $shipping_data['city'],
                'shipping_state'      => $shipping_data['state'],
                'shipping_postcode'   => $shipping_data['postcode'],
                'shipping_country'    => $shipping_data['country'],
                'shipping_phone'      => $shipping_data['phone'],
                'billing_first_name'  => $shipping_data['first_name'],
                'billing_last_name'   => $shipping_data['last_name'],
                'billing_company'     => $shipping_data['company'],
                'billing_address_1'   => $shipping_data['address_1'],
                'billing_address_2'   => $shipping_data['address_2'],
                'billing_city'        => $shipping_data['city'],
                'billing_state'       => $shipping_data['state'],
                'billing_postcode'    => $shipping_data['postcode'],
                'billing_country'     => $shipping_data['country'],
                'billing_phone'       => $shipping_data['phone'],
            )
        );

        // Salva os dados do cliente
        WC()->customer->save();

        // Obtém os itens do carrinho
        $cart_items = WC()->cart->get_cart();

        if (empty($cart_items)) {
            wp_send_json_error(array(
                'status' => false,
                'message' => 'O carrinho está vazio.',
            ), 400);
        }

        $only_digital = true;
        foreach ($cart_items as $cart_item) {
            $product = $cart_item['data'];
            if (!$product->is_virtual() && !$product->is_downloadable()) {
                $only_digital = false;
                break;
            }
        }

        if ($only_digital) {
            $cart_count = WC()->cart->get_cart_contents_count();

            // Define a mensagem com base na quantidade de produtos
            $message = $cart_count === 1
                ? 'O produto no carrinho é digital ou baixável e não requer cálculo de frete.'
                : 'Todos os produtos no carrinho são digitais ou baixáveis e não requerem cálculo de frete.';

            wp_send_json_success(array(
                'status' => true,
                'digital' => true,
                'cart_count' => $cart_count,
                'message' => $message,
            ), 200);
        }

        // Calcula o total do carrinho
        $contents_cost = 0;
        foreach ($cart_items as $cart_item) {
            $contents_cost += floatval($cart_item['line_total']);
        }

        // Cria um pacote de envio personalizado com os itens do carrinho
        $package = array(
            'contents' => $cart_items,
            'contents_cost' => $contents_cost,
            'applied_coupons' => WC()->cart->get_applied_coupons(),
            'user' => array(
                'ID' => get_current_user_id(),
            ),
            'destination' => array(
                'country'   => $shipping_data['country'],
                'state'     => $shipping_data['state'],
                'postcode'  => $shipping_data['postcode'],
                'city'      => $shipping_data['city'],
                'address'   => $shipping_data['address_1'],
                'address_2' => $shipping_data['address_2'],
            ),
        );

        // Calcula o frete para o pacote
        $shipping_instance = new \WC_Shipping();
        $shipping_methods = $shipping_instance->load_shipping_methods($package);

        $shipping_rates = array();
        $currency_symbol = get_woocommerce_currency_symbol();
        $currency_minor_unit = wc_get_price_decimals();

        // Itera pelos métodos de envio e calcula as taxas
        foreach ($shipping_methods as $method) {
            if ($method->supports('shipping-zones')) {
                $rates = $method->get_rates_for_package($package);

                foreach ($rates as $rate) {
                    $shipping_rates[] = array(
                        'id'    => $rate->get_id(),
                        'label' => $rate->get_label(),
                        'cost'  => $rate->get_cost(),
                    );
                }
            }
        }

        $total_quantity = 0;

        foreach (WC()->cart->get_cart() as $cart_item) {
            $total_quantity += $cart_item['quantity'];
        }

        // Retorna os valores calculados
        wp_send_json_success(array(
            'message' => 'Endereço de envio registrado com sucesso e frete calculado.',
            'cart' => array(
                'currency_symbol' => $currency_symbol,
                'currency_minor_unit' => $currency_minor_unit,
                'quantity' => $total_quantity
            ),
            'shipping_rates' => $shipping_rates, // Taxas de envio
        ));
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
