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
            $this->version = '4.7.0';
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

        $this->loader->add_filter('woocommerce_get_settings_pages', $this, 'lkn_add_woo_better_settings_page');

        $this->loader->add_action('admin_footer', $this, 'lkn_woo_better_footer_page');

        $this->loader->add_filter('plugin_action_links_' . WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME, $this, 'lkn_add_settings_link', 10, 2);

        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');

        $this->loader->add_action('template_redirect', $this, 'lkn_set_country_brasil', 999);

        if ($disabled_shipping === 'all' || $disabled_shipping === 'digital') {
            $this->loader->add_action('woocommerce_get_country_locale', $this, 'lkn_woo_better_shipping_calculator_locale', 10, 1);
        }

        $this->loader->add_filter('woocommerce_get_country_locale', $this, 'lkn_disable_company_required_based_on_person_type', 20, 1);

        $this->loader->add_filter('woocommerce_cart_needs_shipping', $this, 'lkn_custom_disable_shipping', 10, 1);
        $this->loader->add_filter('woocommerce_cart_needs_shipping_address', $this, 'lkn_custom_disable_shipping', 10, 1);

        $this->loader->add_filter('woocommerce_package_rates', $this, 'lkn_simular_frete_playground', 10, 2);

        $this->loader->add_action('admin_notices', $this, 'lkn_show_admin_notice');
        $this->loader->add_action('wp_ajax_woo_better_calc_dismiss_notice', $this, 'lkn_dismiss_admin_notice');
        $this->loader->add_action('wp_ajax_woo_better_calc_update_cache_token', $this, 'lkn_update_cache_token');
        
        // Hook para desabilitar validações de campos específicos
        $this->loader->add_filter('woocommerce_checkout_fields', $this, 'lkn_set_checkout_fields_optional', 99998);
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
                <strong style="font-size: 18px;">🚀 Calculadora de Frete e Campos Checkout para o Brasil</strong>
                <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
                    <p>Veja as novas funcionalidades de <strong>CHECKOUT</strong>, como preenchimento automático de endereço, campo de CEP em destaque, telefone com código do país e muito mais!</p>
                    <a href="<?php echo esc_url($settings_url); ?>" class="button button-primary" style="white-space: normal; word-break: break-word; text-align: center; line-height: normal; display: flex; align-items: center; justify-content: center; width: 100%; max-width: 350px;">
                        Configure o plugin de acordo com sua necessidade
                    </a>
                </div>
                
                <div style="margin-top: 15px;">
                    <p style="margin: 0; font-weight: 500;">
                        ✨ <strong>ATUALIZADO:</strong> Todas as funcionalidades disponíveis no editor de blocos agora estão disponíveis no shortcode.
                    </p>
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

    public function lkn_disable_company_required_based_on_person_type($locale)
    {
        // Verifica a configuração de tipo de pessoa
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        
        // Só desabilita required do company se for 'both' ou 'legal' (CNPJ)
        if ($person_type === 'both' || $person_type === 'legal') {
            // Sempre deixa os campos company como opcionais no Brasil
            if (!isset($locale['BR'])) {
                $locale['BR'] = array();
            }
            if (!isset($locale['BR']['company'])) {
                $locale['BR']['company'] = array();
            }
            $locale['BR']['company']['required'] = false;
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

        $this->loader->add_filter('woocommerce_checkout_fields', $this, 'wc_better_calc_checkout_fields', 999);
        
        $this->loader->add_action('wp_ajax_wc_better_insert_address', $this, 'wc_better_insert_address');
        $this->loader->add_action('wp_ajax_nopriv_wc_better_insert_address', $this, 'wc_better_insert_address');

        $this->loader->add_action('woocommerce_get_country_locale', $this, 'wc_better_calc_phone_number', 10, 1);

        $this->loader->add_action('woocommerce_init', $this, 'init_woocommerce');

        $this->loader->add_action('woocommerce_checkout_order_processed', $this, 'process_checkout_data_classic', 10, 2);
        $this->loader->add_action('woocommerce_store_api_checkout_update_order_from_request', $this, 'process_checkout_data_blocks', 10, 2);

        $this->loader->add_action('woocommerce_admin_order_data_after_billing_address', $this, 'woo_better_billing_customer_data');
        $this->loader->add_action('woocommerce_admin_order_data_after_shipping_address', $this, 'woo_better_shipping_customer_data');
        
        // Hooks para customizar campos do admin
        $this->loader->add_filter('woocommerce_admin_billing_fields', $this, 'customize_admin_billing_fields');
        $this->loader->add_filter('woocommerce_admin_shipping_fields', $this, 'customize_admin_shipping_fields');
        
        // Hooks para integrar bairro no endereço formatado dentro do bloco
        $this->loader->add_filter('woocommerce_formatted_address_replacements', $this, 'add_neighborhood_replacement', 10, 2);
        $this->loader->add_filter('woocommerce_localisation_address_formats', $this, 'add_neighborhood_to_address_format', 10, 1);
        $this->loader->add_filter('woocommerce_order_formatted_billing_address', $this, 'add_neighborhood_to_billing_address', 10, 2);
        $this->loader->add_filter('woocommerce_order_formatted_shipping_address', $this, 'add_neighborhood_to_shipping_address', 10, 2);
        
        // NOVO: Hook para restaurar endereço quando carrinho for modificado
        $this->loader->add_action('woocommerce_cart_updated', $this, 'restore_address_after_cart_change');
        $this->loader->add_action('woocommerce_add_to_cart', $this, 'restore_address_after_cart_change');
        
        // Hooks para formatação de telefone no pedido final
        $this->loader->add_filter('woocommerce_order_get_billing_phone', $this, 'format_order_billing_phone', 10, 2);
        $this->loader->add_filter('woocommerce_order_get_shipping_phone', $this, 'format_order_shipping_phone', 10, 2);
        
        // Hook para validação de CPF/CNPJ no checkout
        $this->loader->add_action('woocommerce_checkout_process', $this, 'validate_person_type_documents');
    }

    /**
     * Customiza campos de faturação no admin do pedido
     *
     * @param array $fields
     * @return array
     */
    public function customize_admin_billing_fields($fields)
    {
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não remove os campos
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $fields;
        }
        
        // Remove campos que estão sendo exibidos na template customizada
        unset($fields['phone']); // Remove telefone padrão
        unset($fields['email']); // Remove email padrão
        
        return $fields;
    }

    /**
     * Customiza campos de entrega no admin do pedido
     *
     * @param array $fields
     * @return array
     */
    public function customize_admin_shipping_fields($fields)
    {
        // Remove campos que estão sendo exibidos na template customizada
        unset($fields['phone']); // Remove telefone padrão
        
        return $fields;
    }

    /**
     * Adiciona substituição de bairro no endereço formatado
     *
     * @param array $replacements
     * @param array $address
     * @return array
     */
    public function add_neighborhood_replacement($replacements, $address)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        if ($neighborhood_enabled === 'yes' && isset($address['neighborhood'])) {
            $replacements['{neighborhood}'] = $address['neighborhood'];
        } else {
            $replacements['{neighborhood}'] = '';
        }
        
        // Adiciona substituição para número do endereço
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($number_enabled === 'yes' && isset($address['number'])) {
            $replacements['{number}'] = ' - ' . $address['number'];
        } else {
            $replacements['{number}'] = '';
        }
        
        return $replacements;
    }

    /**
     * Modifica formato de endereço para incluir bairro
     *
     * @param array $formats
     * @return array
     */
    public function add_neighborhood_to_address_format($formats)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($neighborhood_enabled === 'yes' && $number_enabled === 'yes') {
            // Modifica o formato do Brasil para incluir bairro e número
            $formats['BR'] = "{name}\n{company}\n{address_1}{number}\n{neighborhood}\n{address_2}\n{city}\n{state}\n{postcode}\n{country}";
        } elseif ($neighborhood_enabled === 'yes') {
            // Só bairro
            $formats['BR'] = "{name}\n{company}\n{address_1}\n{neighborhood}\n{address_2}\n{city}\n{state}\n{postcode}\n{country}";
        } elseif ($number_enabled === 'yes') {
            // Só número
            $formats['BR'] = "{name}\n{company}\n{address_1}{number}\n{address_2}\n{city}\n{state}\n{postcode}\n{country}";
        }
        
        return $formats;
    }

    /**
     * Adiciona bairro ao endereço de cobrança formatado
     *
     * @param array $address
     * @param WC_Order $order
     * @return array
     */
    public function add_neighborhood_to_billing_address($address, $order)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            $billing_neighborhood = $order->get_meta('_billing_neighborhood');
            if (!empty($billing_neighborhood)) {
                $address['neighborhood'] = $billing_neighborhood;
            }
        }
        
        if ($number_enabled === 'yes') {
            $billing_number = $order->get_meta('_billing_number');
            if (!empty($billing_number)) {
                $address['number'] = $billing_number;
            }
        }
        
        return $address;
    }

    /**
     * Adiciona bairro ao endereço de entrega formatado
     *
     * @param array $address
     * @param WC_Order $order
     * @return array
     */
    public function add_neighborhood_to_shipping_address($address, $order)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            $shipping_neighborhood = $order->get_meta('_shipping_neighborhood');
            if (!empty($shipping_neighborhood)) {
                $address['neighborhood'] = $shipping_neighborhood;
            }
        }
        
        if ($number_enabled === 'yes') {
            $shipping_number = $order->get_meta('_shipping_number');
            if (!empty($shipping_number)) {
                $address['number'] = $shipping_number;
            }
        }
        
        return $address;
    }

    /**
     * Custom shipping admin fields.
     *
     * @param WC_Order $order Order data.
     */
    public function woo_better_shipping_customer_data($order)
    {
        // Get plugin settings
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        
        // Get order meta data
        $shipping_phone_country_code = $order->get_meta('_shipping_phone_country_code');
        
        // Prepare display data
        $display_data = $this->prepare_shipping_display_data($order, $phone_required, $shipping_phone_country_code);
        
        // Only show section if there's data to display
        if (!empty($display_data)) {
            // Include the shipping data view
            include dirname(__FILE__) . '/../Admin/partials/WcBetterShippingCalculatorForBrazilOrderShippingData.php';
        }
    }
    
    /**
     * Prepare shipping display data
     * 
     * @param WC_Order $order
     * @param string $phone_required
     * @param string $shipping_phone_country_code
     * @return array
     */
    private function prepare_shipping_display_data($order, $phone_required, $shipping_phone_country_code)
    {
        $display_data = [];
        
        // Phone data
        if ($phone_required === 'yes') {
            $phone = $order->get_shipping_phone();
            if (!empty($phone)) {
                // Formatar telefone completo
                $formatted_phone = $this->format_complete_phone($phone, $shipping_phone_country_code);
                
                $display_data['phone'] = [
                    'label' => __('Telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'value' => $formatted_phone, // Usar telefone formatado
                    'is_link' => true
                ];
                
                // Country code (opcional, já que está incluído no telefone formatado)
                if (str_starts_with($phone, '+') && !empty($shipping_phone_country_code)) {
                    $clean_country_code = trim($shipping_phone_country_code);
                    if (!str_starts_with($clean_country_code, '+')) {
                        $clean_country_code = '+' . $clean_country_code;
                    }
                    
                    $display_data['phone_country'] = [
                        'label' => __('Código do país', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $clean_country_code
                    ];
                }
            }
        }
        
        return $display_data;
    }

    /**
     * Restaura endereço após mudanças no carrinho
     *
     * @return void
     */
    public function restore_address_after_cart_change() {
        $this->restore_address_from_cookies();
    }

    /**
     * Custom billing admin fields.
     *
     * @param WC_Order $order Order data.
     */
    public function woo_better_billing_customer_data($order)
    {   
        // Get plugin settings
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        
        // Get order meta data
        $billing_persontype = $order->get_meta('_billing_persontype');
        $billing_cpf = $order->get_meta('_billing_cpf');
        $billing_cnpj = $order->get_meta('_billing_cnpj');
        $billing_phone_country_code = $order->get_meta('_billing_phone_country_code');
        
        // Prepare display data
        $display_data = $this->prepare_billing_display_data($order, $person_type, $phone_required, $billing_persontype, $billing_cpf, $billing_cnpj, $billing_phone_country_code);
        
        // Only show section if there's data to display
        if (!empty($display_data)) {
            // Include the billing data view
            include dirname(__FILE__) . '/../Admin/partials/WcBetterShippingCalculatorForBrazilOrderBillingData.php';
        }
    }
    
    /**
     * Prepare billing display data
     * 
     * @param WC_Order $order
     * @param string $person_type
     * @param string $phone_required
     * @param string $billing_persontype
     * @param string $billing_cpf
     * @param string $billing_cnpj
     * @param string $billing_phone_country_code
     * @return array
     */
    private function prepare_billing_display_data($order, $person_type, $phone_required, $billing_persontype, $billing_cpf, $billing_cnpj, $billing_phone_country_code)
    {
        $display_data = [];
        
        // Convert numeric persontype to string (1 = physical, 2 = legal)
        if (is_numeric($billing_persontype)) {
            $billing_persontype = ($billing_persontype == '1') ? 'physical' : 'legal';
        }
        
        // Process person type data
        if ($person_type !== 'none') {
            // Physical person data (CPF)
            if ($this->should_show_physical_data($person_type, $billing_persontype)) {
                if (!empty($billing_cpf)) {
                    $display_data['cpf'] = [
                        'label' => __('CPF', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $billing_cpf
                    ];
                }
            }
            
            // Legal person data (Company and CNPJ)
            if ($this->should_show_legal_data($person_type, $billing_persontype)) {
                $company = $order->get_billing_company();
                if (!empty($company)) {
                    $display_data['company'] = [
                        'label' => __('Empresa', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $company
                    ];
                }
                if (!empty($billing_cnpj)) {
                    $display_data['cnpj'] = [
                        'label' => __('CNPJ', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $billing_cnpj
                    ];
                }
            }
            
            // Person type label (only for 'both' setting)
            if ($person_type === 'both' && !empty($billing_persontype)) {
                $person_type_label = '';
                if ($billing_persontype === 'physical') {
                    $person_type_label = __('Pessoa Física', 'woo-better-shipping-calculator-for-brazil');
                } elseif ($billing_persontype === 'legal') {
                    $person_type_label = __('Pessoa Jurídica', 'woo-better-shipping-calculator-for-brazil');
                }
                
                if (!empty($person_type_label)) {
                    $display_data['person_type'] = [
                        'label' => __('Tipo de Pessoa', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $person_type_label
                    ];
                }
            }
        } else {
            // When person type is 'none', only show company if available
            $company = $order->get_billing_company();
            if (!empty($company)) {
                $display_data['company'] = [
                    'label' => __('Empresa', 'woo-better-shipping-calculator-for-brazil'),
                    'value' => $company
                ];
            }
        }
        
        // Phone data
        if ($phone_required === 'yes') {
            $phone = $order->get_billing_phone();
            if (!empty($phone)) {
                // Formatar telefone completo
                $formatted_phone = $this->format_complete_phone($phone, $billing_phone_country_code);
                
                $display_data['phone'] = [
                    'label' => __('Telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'value' => $formatted_phone, // Usar telefone formatado
                    'is_link' => true
                ];
                
                // Country code (opcional, já que está incluído no telefone formatado)
                if (str_starts_with($phone, '+') && !empty($billing_phone_country_code)) {
                    $clean_country_code = trim($billing_phone_country_code);
                    if (!str_starts_with($clean_country_code, '+')) {
                        $clean_country_code = '+' . $clean_country_code;
                    }
                    
                    $display_data['phone_country'] = [
                        'label' => __('Código do país', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $clean_country_code
                    ];
                }
            }
        }
        
        // Email data
        $email = $order->get_billing_email();
        if (!empty($email)) {
            $display_data['email'] = [
                'label' => __('Email', 'woo-better-shipping-calculator-for-brazil'),
                'value' => $email,
                'is_clickable' => true
            ];
        }
        
        return $display_data;
    }
    
    /**
     * Check if should show physical person data
     */
    private function should_show_physical_data($person_type, $billing_persontype)
    {
        return ($billing_persontype === 'physical' && ($person_type === 'both' || $person_type === 'physical')) || $person_type === 'physical';
    }
    
    /**
     * Check if should show legal person data
     */
    private function should_show_legal_data($person_type, $billing_persontype)
    {
        return ($billing_persontype === 'legal' && ($person_type === 'both' || $person_type === 'legal')) || $person_type === 'legal';
    }
    
    /**
     * Formata telefone completo removendo caracteres especiais
     * 
     * @param string $phone Número de telefone
     * @param string $country_code Código do país
     * @return string Telefone formatado como +5599999999999
     */
    private function format_complete_phone($phone, $country_code = '')
    {
        if (empty($phone)) {
            return '';
        }
        
        // Remove todos os caracteres especiais, deixa apenas números e +
        $clean_phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // Se já começa com +, usa como está
        if (strpos($clean_phone, '+') === 0) {
            return $clean_phone;
        }
        
        // Tenta usar o código do país se fornecido
        if (!empty($country_code)) {
            $clean_country_code = preg_replace('/[^0-9+]/', '', $country_code);
            
            // Garante que o código do país começa com +
            if (strpos($clean_country_code, '+') !== 0) {
                $clean_country_code = '+' . $clean_country_code;
            }
            
            // Remove o código do país do telefone se já estiver lá
            $country_digits = substr($clean_country_code, 1); // Remove o +
            if (strpos($clean_phone, $country_digits) === 0) {
                $clean_phone = substr($clean_phone, strlen($country_digits));
            }
            
            return $clean_country_code . $clean_phone;
        }
        
        // Se não tem código do país, assume Brasil (+55) se não começar com código internacional
        if (strlen($clean_phone) <= 11) {
            return '+55' . $clean_phone;
        }
        
        // Se tem mais de 11 dígitos, adiciona + no início
        return '+' . $clean_phone;
    }
    
    /**
     * Formatar telefone de cobrança no pedido final
     *
     * @param string $phone
     * @param WC_Order $order
     * @return string
     */
    public function format_order_billing_phone($phone, $order)
    {
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        
        if ($phone_required === 'yes' && !empty($phone)) {
            $country_code = $order->get_meta('_billing_phone_country_code');
            return $this->format_complete_phone($phone, $country_code);
        }
        
        return $phone;
    }
    
    /**
     * Formatar telefone de entrega no pedido final
     *
     * @param string $phone
     * @param WC_Order $order
     * @return string
     */
    public function format_order_shipping_phone($phone, $order)
    {
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        
        if ($phone_required === 'yes' && !empty($phone)) {
            $country_code = $order->get_meta('_shipping_phone_country_code');
            return $this->format_complete_phone($phone, $country_code);
        }
        
        return $phone;
    }
    
    /**
     * Valida CPF usando algoritmo matemático
     * @param string $cpf - CPF apenas com números
     * @return boolean
     */
    private function validate_cpf($cpf) {
        // Remove caracteres não numéricos
        $cpf = preg_replace('/[^0-9]/', '', $cpf);
        
        // Verifica se tem 11 dígitos
        if (strlen($cpf) !== 11) {
            return false;
        }
        
        // Verifica sequências inválidas (111.111.111-11, 222.222.222-22, etc.)
        if (preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }
        
        // Calcula primeiro dígito verificador
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $sum += intval($cpf[$i]) * (10 - $i);
        }
        $first_digit = 11 - ($sum % 11);
        if ($first_digit >= 10) {
            $first_digit = 0;
        }
        
        // Verifica primeiro dígito
        if (intval($cpf[9]) !== $first_digit) {
            return false;
        }
        
        // Calcula segundo dígito verificador
        $sum = 0;
        for ($i = 0; $i < 10; $i++) {
            $sum += intval($cpf[$i]) * (11 - $i);
        }
        $second_digit = 11 - ($sum % 11);
        if ($second_digit >= 10) {
            $second_digit = 0;
        }
        
        // Verifica segundo dígito
        return intval($cpf[10]) === $second_digit;
    }
    
    /**
     * Valida CNPJ usando algoritmo matemático
     * @param string $cnpj - CNPJ apenas com números
     * @return boolean
     */
    private function validate_cnpj($cnpj) {
        // Remove caracteres não numéricos
        $cnpj = preg_replace('/[^0-9]/', '', $cnpj);
        
        // Verifica se tem 14 dígitos
        if (strlen($cnpj) !== 14) {
            return false;
        }
        
        // Verifica sequências inválidas
        if (preg_match('/^(\d)\1{13}$/', $cnpj)) {
            return false;
        }
        
        // Pesos para o cálculo dos dígitos verificadores
        $weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        
        // Calcula primeiro dígito verificador
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += intval($cnpj[$i]) * $weights1[$i];
        }
        $first_digit = $sum % 11;
        $first_digit = $first_digit < 2 ? 0 : 11 - $first_digit;
        
        // Verifica primeiro dígito
        if (intval($cnpj[12]) !== $first_digit) {
            return false;
        }
        
        // Calcula segundo dígito verificador
        $sum = 0;
        for ($i = 0; $i < 13; $i++) {
            $sum += intval($cnpj[$i]) * $weights2[$i];
        }
        $second_digit = $sum % 11;
        $second_digit = $second_digit < 2 ? 0 : 11 - $second_digit;
        
        // Verifica segundo dígito
        return intval($cnpj[13]) === $second_digit;
    }
    
    /**
     * Valida documento (CPF ou CNPJ) baseado no tamanho
     * @param string $document - Documento com ou sem formatação
     * @return array - ['is_valid' => boolean, 'type' => 'cpf'|'cnpj'|null, 'message' => string]
     */
    private function validate_document($document) {
        $clean_doc = preg_replace('/[^0-9]/', '', $document);
        
        if (strlen($clean_doc) === 11) {
            $is_valid_cpf = $this->validate_cpf($clean_doc);
            return [
                'is_valid' => $is_valid_cpf,
                'type' => 'cpf',
                'message' => $is_valid_cpf ? '' : 'CPF inválido. Verifique os números informados.'
            ];
        } elseif (strlen($clean_doc) === 14) {
            $is_valid_cnpj = $this->validate_cnpj($clean_doc);
            return [
                'is_valid' => $is_valid_cnpj,
                'type' => 'cnpj',
                'message' => $is_valid_cnpj ? '' : 'CNPJ inválido. Verifique os números informados.'
            ];
        } else {
            return [
                'is_valid' => false,
                'type' => null,
                'message' => 'Documento deve ter 11 dígitos (CPF) ou 14 dígitos (CNPJ).'
            ];
        }
    }
    
    /**
     * Valida documentos de tipo de pessoa no checkout tradicional
     */
    public function validate_person_type_documents() {
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        
        // Só valida se o recurso estiver habilitado
        if ($person_type === 'none') {
            return;
        }
        
        // Verifica se é Brasil
        if (!$this->is_brazil_checkout()) {
            return;
        }
        
        // Captura dados do formulário
        $billing_cpf = isset($_POST['billing_cpf']) ? sanitize_text_field(wp_unslash($_POST['billing_cpf'])) : '';
        $billing_cnpj = isset($_POST['billing_cnpj']) ? sanitize_text_field(wp_unslash($_POST['billing_cnpj'])) : '';
        $billing_document = isset($_POST['billing_document']) ? sanitize_text_field(wp_unslash($_POST['billing_document'])) : '';
        
        $document_to_validate = '';
        $expected_type = null;
        
        // Determina qual documento validar
        if (!empty($billing_document)) {
            $document_to_validate = $billing_document;
        } elseif (!empty($billing_cpf)) {
            $document_to_validate = $billing_cpf;
            $expected_type = 'cpf';
        } elseif (!empty($billing_cnpj)) {
            $document_to_validate = $billing_cnpj;
            $expected_type = 'cnpj';
        }
        
        // Se não há documento para validar, verifica se é obrigatório
        if (empty($document_to_validate)) {
            $error_message = $this->get_document_required_message($person_type);
            if (!empty($error_message)) {
                wc_add_notice($error_message, 'error');
            }
            return;
        }
        
        // Valida o documento primeiro para determinar o tipo
        $validation = $this->validate_document($document_to_validate);
        
        // Se for CPF, desativa a validação (retorna early)
        if ($validation['type'] === 'cpf') {
            return;
        }
        
        // Verifica se é válido
        if (!$validation['is_valid']) {
            wc_add_notice($validation['message'], 'error');
            return;
        }
        
        // Verifica se o tipo está correto com a configuração
        if (!$this->is_document_type_allowed($validation['type'], $person_type)) {
            $error_message = $this->get_document_type_error_message($validation['type'], $person_type);
            wc_add_notice($error_message, 'error');
        }
    }
    
    /**
     * Verifica se é checkout do Brasil
     */
    private function is_brazil_checkout() {
        if (function_exists('WC') && WC()->customer) {
            $billing_country = WC()->customer->get_billing_country();
            $shipping_country = WC()->customer->get_shipping_country();
            return $billing_country === 'BR' || $shipping_country === 'BR';
        }
        return true; // Assume Brasil por padrão
    }
    
    /**
     * Verifica se o tipo de documento é permitido na configuração
     */
    private function is_document_type_allowed($document_type, $person_type_config) {
        if ($person_type_config === 'both') {
            return true; // Qualquer tipo é permitido
        }
        if ($person_type_config === 'physical') {
            return $document_type === 'cpf';
        }
        if ($person_type_config === 'legal') {
            return $document_type === 'cnpj';
        }
        return false;
    }
    
    /**
     * Retorna mensagem de erro para documento obrigatório
     */
    private function get_document_required_message($person_type) {
        if ($person_type === 'physical') {
            return 'Por favor, insira seu CPF.';
        } elseif ($person_type === 'legal') {
            return 'Por favor, insira seu CNPJ.';
        } elseif ($person_type === 'both') {
            return 'Por favor, insira seu CPF ou CNPJ.';
        }
        return '';
    }
    
    /**
     * Retorna mensagem de erro para tipo de documento incorreto
     */
    private function get_document_type_error_message($document_type, $person_type_config) {
        if ($person_type_config === 'physical' && $document_type === 'cnpj') {
            return 'CNPJ não é permitido. Por favor, insira seu CPF.';
        } elseif ($person_type_config === 'legal' && $document_type === 'cpf') {
            return 'CPF não é permitido. Por favor, insira seu CNPJ.';
        }
        return 'Tipo de documento não permitido.';
    }

    public function process_checkout_data_classic($order_id, $data)
    {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        // LOG: Captura números de telefone do pedido para debug
        $billing_phone = $order->get_billing_phone();
        $shipping_phone = $order->get_shipping_phone();

        // Processa números de endereço primeiro
        $this->process_address_numbers_from_data($order, $data);
        
        // Processa dados de tipo de pessoa
        $this->process_person_type_from_data($order, $data);
        
        // Processa dados de bairro
        $this->process_neighborhood_from_data($order, $data);
        
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

        // Salvar código do país do telefone de faturação
        if (!empty($billing_country_code)) {
            $order->update_meta_data('_billing_phone_country_code', $billing_country_code);
        }
        
        // Salvar código do país do telefone de entrega
        if (!empty($shipping_country_code)) {
            $order->update_meta_data('_shipping_phone_country_code', $shipping_country_code);
        }

        if (!empty($billing_country_code) || !empty($shipping_country_code)) {
            $order->save();
        }
    }

    // Função específica para WooCommerce Block Checkout
    public function process_checkout_data_blocks($order, $request)
    {
        if (!$order) {
            return;
        }

        // LOG: Captura números de telefone do pedido para debug
        $billing_phone = $order->get_billing_phone();
        $shipping_phone = $order->get_shipping_phone();

        // Processa números de endereço primeiro
        $this->process_address_numbers_from_request($order, $request);
        
        // Processa dados de tipo de pessoa
        $this->process_person_type_from_request($order, $request);
        
        // Processa dados de bairro
        $this->process_neighborhood_from_request($order, $request);
        
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
            $billing_country_code = sanitize_text_field(wp_unslash($_POST['billing_phone_country_code']));
        }
        
        if (empty($shipping_country_code) && isset($_POST['shipping_phone_country_code'])) {
            $shipping_country_code = sanitize_text_field(wp_unslash($_POST['shipping_phone_country_code']));
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
        
        // Salvar código do país do telefone de faturação
        if (!empty($billing_country_code)) {
            $order->update_meta_data('_billing_phone_country_code', $billing_country_code);
        }
        
        // Salvar código do país do telefone de entrega
        if (!empty($shipping_country_code)) {
            $order->update_meta_data('_shipping_phone_country_code', $shipping_country_code);
        }
        
        if (!empty($billing_country_code) || !empty($shipping_country_code)) {
            $order->save();
        }
    }

    /**
     * Processa os números dos endereços no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_address_numbers_from_data($order, $data)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');

        if ($number_field === 'yes') {
            $shipping_number = '';
            $billing_number = '';

            // Captura dos dados do checkout tradicional
            if (isset($_POST['lkn_billing_number'])) {
                $billing_number = sanitize_text_field(wp_unslash($_POST['lkn_billing_number']));
            }

            if (isset($_POST['lkn_shipping_number'])) {
                $shipping_number = sanitize_text_field(wp_unslash($_POST['lkn_shipping_number']));
            }

            if (empty($shipping_number) && !empty($billing_number)) {
                $shipping_number = $billing_number;
            }

            if (empty($billing_number) && !empty($shipping_number)) {
                $billing_number = $shipping_number;
            }

            if (empty($shipping_number) && empty($billing_number)) {
                $shipping_number = "S/N";
                $billing_number = "S/N";
            }
            
            // Salva os números como meta dados separados (sem concatenar no endereço)
            if (!empty($billing_number)) {
                $order->update_meta_data('_billing_number', $billing_number);
                WC()->session->set('woo_better_billing_number', $billing_number);
            }
            
            if (!empty($shipping_number)) {
                $order->update_meta_data('_shipping_number', $shipping_number);
                WC()->session->set('woo_better_shipping_number', $shipping_number);
            }
        }
    }

    /**
     * Processa os números dos endereços no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_address_numbers_from_request($order, $request)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');

        if ($number_field === 'yes') {
            $shipping_number = '';
            $billing_number = '';

            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];

            // Verifica o namespace dos números de endereço
            if (isset($extensions['woo_better_number_validation'])) {
                $number_data = $extensions['woo_better_number_validation'];
                
                if (isset($number_data['woo_better_billing_number'])) {
                    $billing_number = sanitize_text_field($number_data['woo_better_billing_number']);
                }
                
                if (isset($number_data['woo_better_shipping_number'])) {
                    $shipping_number = sanitize_text_field($number_data['woo_better_shipping_number']);
                }
            }

            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_number) && isset($_POST['lkn_billing_number'])) {
                $billing_number = sanitize_text_field(wp_unslash($_POST['lkn_billing_number']));
            }

            if (empty($shipping_number) && isset($_POST['lkn_shipping_number'])) {
                $shipping_number = sanitize_text_field(wp_unslash($_POST['lkn_shipping_number']));
            }

            if (empty($shipping_number) && !empty($billing_number)) {
                $shipping_number = $billing_number;
            }

            if (empty($billing_number) && !empty($shipping_number)) {
                $billing_number = $shipping_number;
            }

            if (empty($shipping_number) && empty($billing_number)) {
                $shipping_number = "S/N";
                $billing_number = "S/N";
            }
            
            // Salva os números como meta dados separados (sem concatenar no endereço)
            if (!empty($billing_number)) {
                $order->update_meta_data('_billing_number', $billing_number);
                WC()->session->set('woo_better_billing_number', $billing_number);
            }
            
            if (!empty($shipping_number)) {
                $order->update_meta_data('_shipping_number', $shipping_number);
                WC()->session->set('woo_better_shipping_number', $shipping_number);
            }
        }
    }

    /**
     * Processa os dados de tipo de pessoa no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_person_type_from_data($order, $data)
    {
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($person_type !== 'none') {
            // Captura dos dados do checkout tradicional
            $billing_persontype = isset($_POST['billing_persontype']) ? sanitize_text_field(wp_unslash($_POST['billing_persontype'])) : '';
            $billing_cpf = isset($_POST['billing_cpf']) ? sanitize_text_field(wp_unslash($_POST['billing_cpf'])) : '';
            $billing_cnpj = isset($_POST['billing_cnpj']) ? sanitize_text_field(wp_unslash($_POST['billing_cnpj'])) : '';
            $billing_company = isset($_POST['billing_company']) ? sanitize_text_field(wp_unslash($_POST['billing_company'])) : '';
            
            // Captura do campo unificado
            $billing_document = isset($_POST['billing_document']) ? sanitize_text_field(wp_unslash($_POST['billing_document'])) : '';
            
            // Se há documento unificado mas não há dados específicos, processar
            if (!empty($billing_document) && empty($billing_cpf) && empty($billing_cnpj)) {
                $clean_value = preg_replace('/\D/', '', $billing_document);
                
                if (strlen($clean_value) === 11) {
                    // É CPF
                    $billing_cpf = $billing_document;
                    $billing_persontype = 'physical';
                } elseif (strlen($clean_value) === 14) {
                    // É CNPJ
                    $billing_cnpj = $billing_document;
                    $billing_persontype = 'legal';
                }
            }

            // Salva os tipos de pessoa
            if (!empty($billing_persontype)) {
                $order->update_meta_data('_billing_persontype', $billing_persontype);
            }

            // Salva os documentos
            if (!empty($billing_cpf)) {
                $order->update_meta_data('_billing_cpf', $billing_cpf);
            }
            if (!empty($billing_cnpj)) {
                $order->update_meta_data('_billing_cnpj', $billing_cnpj);
            }

            // Salva a empresa apenas para CNPJ, limpa para CPF
            if ($billing_persontype === 'legal' && !empty($billing_company)) {
                $order->set_billing_company($billing_company);
                $order->set_shipping_company('');
            } elseif ($billing_persontype === 'physical') {
                // Para CPF, assegura que campos de empresa ficam vazios
                $order->set_billing_company('');
                $order->set_shipping_company('');
            }
        }
    }

    /**
     * Processa os dados de tipo de pessoa no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_person_type_from_request($order, $request)
    {
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($person_type !== 'none') {
            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];

            $billing_persontype = '';
            $billing_cpf = '';
            $billing_cnpj = '';
            $billing_company = '';

            // Verifica o namespace dos dados de pessoa
            if (isset($extensions['woo_better_person_type'])) {
                $person_data = $extensions['woo_better_person_type'];
                
                if (isset($person_data['billing_persontype'])) {
                    $billing_persontype = sanitize_text_field($person_data['billing_persontype']);
                }
                if (isset($person_data['billing_cpf'])) {
                    $billing_cpf = sanitize_text_field($person_data['billing_cpf']);
                }
                if (isset($person_data['billing_cnpj'])) {
                    $billing_cnpj = sanitize_text_field($person_data['billing_cnpj']);
                }
                if (isset($person_data['billing_company'])) {
                    $billing_company = sanitize_text_field($person_data['billing_company']);
                }
            }

            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_persontype) && isset($_POST['billing_persontype'])) {
                $billing_persontype = sanitize_text_field(wp_unslash($_POST['billing_persontype']));
            }
            if (empty($billing_cpf) && isset($_POST['billing_cpf'])) {
                $billing_cpf = sanitize_text_field(wp_unslash($_POST['billing_cpf']));
            }
            if (empty($billing_cnpj) && isset($_POST['billing_cnpj'])) {
                $billing_cnpj = sanitize_text_field(wp_unslash($_POST['billing_cnpj']));
            }
            if (empty($billing_company) && isset($_POST['billing_company'])) {
                $billing_company = sanitize_text_field(wp_unslash($_POST['billing_company']));
            }
            
            // Captura do campo unificado para shortcode se os específicos estão vazios
            $billing_document = '';
            if (isset($_POST['billing_document'])) {
                $billing_document = sanitize_text_field(wp_unslash($_POST['billing_document']));
            }
            
            // Se há documento unificado mas não há dados específicos, processar
            if (!empty($billing_document) && empty($billing_cpf) && empty($billing_cnpj)) {
                $clean_value = preg_replace('/\D/', '', $billing_document);
                
                if (strlen($clean_value) === 11) {
                    // É CPF
                    $billing_cpf = $billing_document;
                    $billing_persontype = 'physical';
                } elseif (strlen($clean_value) === 14) {
                    // É CNPJ
                    $billing_cnpj = $billing_document;
                    $billing_persontype = 'legal';
                }
            }

            // Salva os tipos de pessoa
            if (!empty($billing_persontype)) {
                $order->update_meta_data('_billing_persontype', $billing_persontype);
            }

            // Salva os documentos
            if (!empty($billing_cpf)) {
                $order->update_meta_data('_billing_cpf', $billing_cpf);
            }
            if (!empty($billing_cnpj)) {
                $order->update_meta_data('_billing_cnpj', $billing_cnpj);
            }

            // Salva a empresa apenas para CNPJ, limpa para CPF
            if ($billing_persontype === 'legal' && !empty($billing_company)) {
                $order->set_billing_company($billing_company);
                $order->set_shipping_company(''); // Garantir que shipping company fique vazio
            } elseif ($billing_persontype === 'physical') {
                // Para CPF, assegura que campos de empresa ficam vazios
                $order->set_billing_company('');
                $order->set_shipping_company('');
            }
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
     * Salva dados de endereço em cookies para persistir durante operações do carrinho
     *
     * @param array $shipping_data Dados de endereço para salvar
     * @return void
     */
    private function save_address_to_cookies($shipping_data) {
        $cookie_expire = time() + (60 * 60 * 2); // 2 horas
        
        // Remove valores vazios e adiciona timestamp para validação
        $clean_data = array_filter($shipping_data, function($value) {
            return !empty($value);
        });
        
        if (empty($clean_data)) {
            return;
        }
        
        // Adiciona timestamp para validação de expiração
        $clean_data['timestamp'] = time();
        
        // Serializa e codifica em base64 para segurança
        $encoded_data = base64_encode(wp_json_encode($clean_data));
        
        // Salva um único cookie com todos os dados
        setcookie('woo_better_address_data', $encoded_data, $cookie_expire, '/');
    }

    /**
     * Restaura dados dos cookies se a sessão foi resetada
     *
     * @return void
     */
    private function restore_address_from_cookies() {
        if (!WC()->customer) return;
        
        // Verifica se o cookie existe
        if (empty($_COOKIE['woo_better_address_data'])) {
            return;
        }
        
        // Verifica se precisa restaurar (se postcode está vazio)
        if (!empty(WC()->customer->get_shipping_postcode())) {
            return;
        }
        
        try {
            // Decodifica e desserializa os dados
            $encoded_data = sanitize_text_field(wp_unslash($_COOKIE['woo_better_address_data']));
            $decoded_json = base64_decode($encoded_data, true);
            
            if ($decoded_json === false) {
                return; // Falha na decodificação base64
            }
            
            $address_data = json_decode($decoded_json, true);
            
            if (!is_array($address_data)) {
                return; // Dados inválidos
            }
            
            // Valida timestamp (verifica se não expirou)
            $timestamp = $address_data['timestamp'] ?? 0;
            if ((time() - $timestamp) > (60 * 60 * 2)) { // 2 horas
                // Remove cookie expirado
                setcookie('woo_better_address_data', '', time() - 3600, '/');
                return;
            }
            
            // Remove timestamp dos dados antes de aplicar
            unset($address_data['timestamp']);
            
            // Aplica os dados ao customer
            $updated = false;
            $valid_fields = ['first_name', 'last_name', 'address_1', 'city', 'state', 'postcode', 'country', 'phone'];
            
            foreach ($valid_fields as $field) {
                if (isset($address_data[$field]) && !empty($address_data[$field])) {
                    $sanitized_value = sanitize_text_field($address_data[$field]);
                    
                    // Aplica para shipping e billing
                    WC()->customer->{"set_shipping_{$field}"}($sanitized_value);
                    WC()->customer->{"set_billing_{$field}"}($sanitized_value);
                    $updated = true;
                }
            }
            
            if ($updated) {
                WC()->customer->save();
            }
            
        } catch (Exception $e) {
            // Em caso de erro, remove o cookie
            setcookie('woo_better_address_data', '', time() - 3600, '/');
        }
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
            
            // Registra campos para tipos de pessoa e documentos
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_person_type',
                'schema_callback' => function() {
                    return [
                        'billing_persontype' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'billing_cpf' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'billing_cnpj' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'billing_company' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_persontype'  => '', 
                        'billing_cpf' => '',
                        'billing_cnpj' => '',
                        'billing_company' => '',
                    ];
                },
            ]);
            
            // Registra campos para bairro
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_neighborhood',
                'schema_callback' => function() {
                    return [
                        'billing_neighborhood' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'shipping_neighborhood' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_neighborhood'  => '', 
                        'shipping_neighborhood' => '', 
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
            
            // Callback para tipos de pessoa e documentos
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_person_type',
                'callback'  => [ $this, 'handle_person_type_update' ],
            ]);
            
            // Callback para campos de bairro
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_neighborhood',
                'callback'  => [ $this, 'handle_neighborhood_update' ],
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

    public function handle_person_type_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        // Guarda os dados de tipo de pessoa na sessão
        if ( isset( $data['billing_persontype'] ) ) {
            $person_type = sanitize_text_field( (string) $data['billing_persontype'] );
            WC()->session->set( 'billing_persontype', $person_type );
        }

        // Guarda os documentos na sessão
        if ( isset( $data['billing_cpf'] ) ) {
            $cpf = sanitize_text_field( (string) $data['billing_cpf'] );
            WC()->session->set( 'billing_cpf', $cpf );
        }

        if ( isset( $data['billing_cnpj'] ) ) {
            $cnpj = sanitize_text_field( (string) $data['billing_cnpj'] );
            WC()->session->set( 'billing_cnpj', $cnpj );
        }

        // Guarda a empresa na sessão
        if ( isset( $data['billing_company'] ) ) {
            $company = sanitize_text_field( (string) $data['billing_company'] );
            WC()->session->set( 'billing_company', $company );
        }
    }

    public function handle_neighborhood_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        $billing_neighborhood = '';
        $shipping_neighborhood = '';

        // Captura os dados de bairro
        if ( isset( $data['billing_neighborhood'] ) ) {
            $billing_neighborhood = sanitize_text_field( (string) $data['billing_neighborhood'] );
        }

        if ( isset( $data['shipping_neighborhood'] ) ) {
            $shipping_neighborhood = sanitize_text_field( (string) $data['shipping_neighborhood'] );
        }

        // Detecta se está usando o mesmo endereço para cobrança
        $use_same_address = false;
        if (WC()->customer) {
            // Verifica se os endereços de entrega e cobrança são iguais
            $billing_address = WC()->customer->get_billing_address_1();
            $shipping_address = WC()->customer->get_shipping_address_1();
            $billing_city = WC()->customer->get_billing_city();
            $shipping_city = WC()->customer->get_shipping_city();
            $billing_postcode = WC()->customer->get_billing_postcode();
            $shipping_postcode = WC()->customer->get_shipping_postcode();
            
            if (!empty($billing_address) && !empty($shipping_address) && 
                $billing_address === $shipping_address && 
                $billing_city === $shipping_city && 
                $billing_postcode === $shipping_postcode) {
                $use_same_address = true;
            }
        }
        
        // Lógica de sincronização considerando o checkbox de mesmo endereço
        if ($use_same_address) {
            // Se usar mesmo endereço, prioriza o bairro de entrega (shipping)
            if (!empty($shipping_neighborhood)) {
                $billing_neighborhood = $shipping_neighborhood;
            } elseif (!empty($billing_neighborhood)) {
                $shipping_neighborhood = $billing_neighborhood;
            }
        } else {
            // Lógica original quando não usa mesmo endereço
            if (!empty($billing_neighborhood) && empty($shipping_neighborhood)) {
                $shipping_neighborhood = $billing_neighborhood;
            } elseif (!empty($shipping_neighborhood) && empty($billing_neighborhood)) {
                $billing_neighborhood = $shipping_neighborhood;
            }
        }

        // Guarda os dados de bairro na sessão
        if (!empty($billing_neighborhood)) {
            WC()->session->set( 'billing_neighborhood', $billing_neighborhood );
        }

        if (!empty($shipping_neighborhood)) {
            WC()->session->set( 'shipping_neighborhood', $shipping_neighborhood );
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
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        // Forçar limpeza do cache se necessário  
        if (false === $person_type || empty($person_type)) {
            wp_cache_delete('woo_better_calc_person_type_select', 'options');
            $person_type = get_option('woo_better_calc_person_type_select', 'none');
        }

        // Campos de pessoa física e jurídica - PRIMEIRO para evitar conflitos
        if ($person_type !== 'none') {
            // Campo unificado CPF/CNPJ (billing)
            $label_text = __('CPF/CNPJ', 'woo-better-shipping-calculator-for-brazil');
            $placeholder_text = __('Digite seu CPF ou CNPJ', 'woo-better-shipping-calculator-for-brazil');
            
            if ($person_type === 'physical') {
                $label_text = __('CPF', 'woo-better-shipping-calculator-for-brazil');
                $placeholder_text = __('000.000.000-00', 'woo-better-shipping-calculator-for-brazil');
            } elseif ($person_type === 'legal') {
                $label_text = __('CNPJ', 'woo-better-shipping-calculator-for-brazil');
                $placeholder_text = __('00.000.000/0000-00', 'woo-better-shipping-calculator-for-brazil');
            }
            
            $fields['billing']['billing_document'] = array(
                'label'       => $label_text,
                'placeholder' => $placeholder_text,
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 26,
                'type'        => 'text',
                'autocomplete' => 'off',
                'custom_attributes' => array(
                    'data-person-type' => $person_type
                )
            );

            // Campos hidden para compatibilidade com o backend
            $fields['billing']['billing_persontype'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 27
            );

            $fields['billing']['billing_cpf'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 28
            );

            $fields['billing']['billing_cnpj'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 29
            );

            // Campo de empresa para pessoa jurídica
            if ($person_type !== 'none') {
                // Verificar se o campo company nativo já existe
                if (isset($fields['billing']['billing_company'])) {
                    // Se existir, tornar obrigatório e customizar
                    $fields['billing']['billing_company']['required'] = true;
                    $fields['billing']['billing_company']['label'] = __('Nome da Empresa', 'woo-better-shipping-calculator-for-brazil');
                    $fields['billing']['billing_company']['placeholder'] = __('Digite o nome da empresa', 'woo-better-shipping-calculator-for-brazil');
                    $fields['billing']['billing_company']['priority'] = 25;
                    $fields['billing']['billing_company']['class'] = array('form-row-wide');
                } else {
                    // Se não existir, criar o campo
                    $fields['billing']['billing_company'] = array(
                        'label'       => __('Nome da Empresa', 'woo-better-shipping-calculator-for-brazil'),
                        'placeholder' => __('Digite o nome da empresa', 'woo-better-shipping-calculator-for-brazil'),
                        'required'    => true,
                        'class'       => array('form-row-wide'),
                        'priority'    => 25,
                        'type'        => 'text'
                    );
                }
                
                // Remover ou limpar o campo shipping_company para evitar duplicação
                if (isset($fields['shipping']['shipping_company'])) {
                    unset($fields['shipping']['shipping_company']);
                }
            }
        }

        // Campos de bairro
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        if ($neighborhood_enabled === 'yes') {
            $fields['billing']['billing_neighborhood'] = array(
                'label'       => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite o nome do bairro', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 50,
                'type'        => 'text'
            );
            
            $fields['shipping']['shipping_neighborhood'] = array(
                'label'       => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite o nome do bairro', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 50,
                'type'        => 'text'
            );
        }

        if ($phone_required === 'yes') {
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
                // Não concatena mais endereço e bairro - cada campo vai para seu lugar próprio
                if ($address !== '') {
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
                // Define o bairro no campo personalizado se houver
                if ($district !== '' && method_exists(WC()->customer, 'update_meta')) {
                    WC()->customer->update_meta('shipping_neighborhood', $district);
                    $updated = true;
                }
            } else {
                // Não concatena mais endereço e bairro - cada campo vai para seu lugar próprio
                if ($address !== '') {
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
                // Define o bairro no campo personalizado se houver
                if ($district !== '' && method_exists(WC()->customer, 'update_meta')) {
                    WC()->customer->update_meta('billing_neighborhood', $district);
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
        
        // NOVO: Salva também em cookies para persistir durante mudanças no carrinho
        $this->save_address_to_cookies($shipping_data);

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

    /**
     * Processa os dados de bairro no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_neighborhood_from_data($order, $data)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            // Captura dos dados do checkout tradicional
            $billing_neighborhood = isset($_POST['billing_neighborhood']) ? sanitize_text_field(wp_unslash($_POST['billing_neighborhood'])) : '';
            $shipping_neighborhood = isset($_POST['shipping_neighborhood']) ? sanitize_text_field(wp_unslash($_POST['shipping_neighborhood'])) : '';

            // Salva os bairros
            if (!empty($billing_neighborhood)) {
                $order->update_meta_data('_billing_neighborhood', $billing_neighborhood);
            }
            if (!empty($shipping_neighborhood)) {
                $order->update_meta_data('_shipping_neighborhood', $shipping_neighborhood);
            }
        }
    }

    /**
     * Processa os dados de bairro no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_neighborhood_from_request($order, $request)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];
            
            $billing_neighborhood = '';
            $shipping_neighborhood = '';
            
            // Verifica o namespace dos dados de bairro
            if (isset($extensions['woo_better_neighborhood'])) {
                $neighborhood_data = $extensions['woo_better_neighborhood'];
                
                if (isset($neighborhood_data['billing_neighborhood'])) {
                    $billing_neighborhood = sanitize_text_field($neighborhood_data['billing_neighborhood']);
                }
                if (isset($neighborhood_data['shipping_neighborhood'])) {
                    $shipping_neighborhood = sanitize_text_field($neighborhood_data['shipping_neighborhood']);
                }
            }
            
            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_neighborhood) && isset($_POST['billing_neighborhood'])) {
                $billing_neighborhood = sanitize_text_field(wp_unslash($_POST['billing_neighborhood']));
            }
            if (empty($shipping_neighborhood) && isset($_POST['shipping_neighborhood'])) {
                $shipping_neighborhood = sanitize_text_field(wp_unslash($_POST['shipping_neighborhood']));
            }

            // Detecta se está usando o mesmo endereço
            $use_same_address = $this->detect_same_address_usage_from_request($order, $request);
            
            // Lógica de sincronização considerando o checkbox de mesmo endereço
            if ($use_same_address) {
                // Se usar mesmo endereço, prioriza o bairro de entrega (shipping)
                if (!empty($shipping_neighborhood)) {
                    $billing_neighborhood = $shipping_neighborhood;
                } elseif (!empty($billing_neighborhood)) {
                    $shipping_neighborhood = $billing_neighborhood;
                }
            } else {
                // Lógica original quando não usa mesmo endereço
                if (!empty($billing_neighborhood) && empty($shipping_neighborhood)) {
                    $shipping_neighborhood = $billing_neighborhood;
                } elseif (!empty($shipping_neighborhood) && empty($billing_neighborhood)) {
                    $billing_neighborhood = $shipping_neighborhood;
                }
            }

            // Salva os bairros
            if (!empty($billing_neighborhood)) {
                $order->update_meta_data('_billing_neighborhood', $billing_neighborhood);
            }
            if (!empty($shipping_neighborhood)) {
                $order->update_meta_data('_shipping_neighborhood', $shipping_neighborhood);
            }
        }
    }
    /**
     * Função para tornar campos específicos do checkout opcionais
     * Inclui CPF/CNPJ, bairro e outros campos customizados
     *
     * @param array $fields
     * @return array
     */
    public function lkn_set_checkout_fields_optional($fields)
    {
        $should_disable = false;
        
        // Se WooCommerce estiver carregado, verifica o país
        if (function_exists('WC') && WC()->customer) {
            $billing_country = WC()->customer->get_billing_country();
            $shipping_country = WC()->customer->get_shipping_country();
            
            // Se qualquer um dos países não for BR, desabilita validação
            if ($billing_country !== 'BR' || $shipping_country !== 'BR') {
                $should_disable = true;
            }
        }
        
        // Também verifica os campos de país nos próprios fields (para casos onde ainda não foi salvo no customer)
        if (isset($fields['billing']['billing_country']['default']) && $fields['billing']['billing_country']['default'] !== 'BR') {
            $should_disable = true;
        }
        if (isset($fields['shipping']['shipping_country']['default']) && $fields['shipping']['shipping_country']['default'] !== 'BR') {
            $should_disable = true;
        }
        
        if ($should_disable) {
            // Campos CPF/CNPJ
            if (isset($fields['billing']['billing_document'])) {
                $fields['billing']['billing_document']['required'] = false;
                $fields['billing']['billing_document']['validate'] = array();
            }
            if (isset($fields['billing']['billing_cpf'])) {
                $fields['billing']['billing_cpf']['required'] = false;
                $fields['billing']['billing_cpf']['validate'] = array();
            }
            if (isset($fields['billing']['billing_cnpj'])) {
                $fields['billing']['billing_cnpj']['required'] = false;
                $fields['billing']['billing_cnpj']['validate'] = array();
            }

            // Campos de bairro
            if (isset($fields['billing']['billing_neighborhood'])) {
                $fields['billing']['billing_neighborhood']['required'] = false;
            }
            if (isset($fields['shipping']['shipping_neighborhood'])) {
                $fields['shipping']['shipping_neighborhood']['required'] = false;
            }
        }
        
        return $fields;
    }
}
