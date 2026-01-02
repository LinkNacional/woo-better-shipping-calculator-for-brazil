<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\PublicView;

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
     * Verifica se o usuário tem permissão para gerenciar opções em multisite
     * 
     * @return bool
     * @since 4.7.0
     */
    private function user_can_manage_multisite_options()
    {
        if (is_multisite()) {
            // Para multisite, verifica se é super admin ou se tem permissão no site atual
            return is_super_admin() || current_user_can('manage_options');
        }
        
        return current_user_can('manage_options');
    }

    /**
     * Obtém URL do site considerando contexto multisite
     * 
     * @return string
     * @since 4.7.0
     */
    private function get_site_url()
    {
        if (is_multisite()) {
            // Para multisite, garante que obtemos a URL do site atual
            return get_home_url(get_current_blog_id());
        }
        
        return home_url();
    }

    /**
     * Obtém URL do admin-ajax.php correta para multisite
     * 
     * @return string URL do admin-ajax.php
     * @since 4.7.0
     */
    private function get_admin_ajax_url()
    {
        if (is_multisite()) {
            // Em multisite, sempre usar URL específica do site atual
            return get_admin_url(get_current_blog_id(), 'admin-ajax.php');
        }
        
        return admin_url('admin-ajax.php');
    }

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
            // Bloco de cart removido - funcionalidade legacy removida
        }

        // Detecta se estamos na página de checkout (compatível com novas versões do WooCommerce)
        global $post;
        $is_checkout_page = false;
        $has_checkout_shortcode = false;
        $has_checkout_block = false;
        
        if (isset($post) && is_a($post, 'WP_Post')) {
            $has_checkout_shortcode = has_shortcode($post->post_content, 'woocommerce_checkout');
            $has_checkout_block = has_block('woocommerce/checkout', $post);
        }
        
        // Fallback para função is_checkout() se disponível
        if (function_exists('is_checkout')) {
            $is_checkout_page = is_checkout() || $has_checkout_shortcode || $has_checkout_block;
        } else {
            $is_checkout_page = $has_checkout_shortcode || $has_checkout_block;
        }
        
        if ($is_checkout_page) {

            $person_type = get_option('woo_better_calc_person_type_select', 'none');
                
            if ($person_type !== 'none') {
                wp_enqueue_style(
                    $this->plugin_name . '-person-type',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPersonType.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );
            }

            $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
                
            if ($neighborhood_enabled === 'yes') {
                wp_enqueue_style(
                    $this->plugin_name . '-neighborhood',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilNeighborhood.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );
            }

            $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
            if($cep_position === 'yes')
            {
                wp_enqueue_style(
                    $this->plugin_name . '-checkout-postcode',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPostcode.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );
            }
            wp_enqueue_style($this->plugin_name . '-phone-require', plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPhoneRequire.COMPILED.css', array(), $this->version, 'all');
        }

        // CSS para página de edição de endereços da conta
        $is_edit_address = false;
        if (function_exists('is_wc_endpoint_url')) {
            $is_edit_address = is_wc_endpoint_url('edit-address');
        } else if (isset($_GET['edit-address'])) {
            $is_edit_address = true;
        }

        if ($is_edit_address) {
            // CSS obrigatório para intl-tel-input na página de edição de endereços
            wp_enqueue_style(
                $this->plugin_name . '-edit-address-phone-require',
                plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPhoneRequire.COMPILED.css',
                array(),
                $this->version,
                'all'
            );

            // CSS adicional para intl-tel-input funcionalidade completa
            wp_enqueue_style(
                $this->plugin_name . '-edit-address-checkout-phone-required',
                plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneRequired.COMPILED.css',
                array(),
                $this->version,
                'all'
            );

            $person_type = get_option('woo_better_calc_person_type_select', 'none');
            if ($person_type !== 'none') {
                wp_enqueue_style(
                    $this->plugin_name . '-edit-address-person-type',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPersonType.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );
            }

            $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
            if ($neighborhood_enabled === 'yes') {
                wp_enqueue_style(
                    $this->plugin_name . '-edit-address-neighborhood',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilNeighborhood.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );
            }

            $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
            if ($cep_position === 'yes') {
                wp_enqueue_style(
                    $this->plugin_name . '-edit-address-postcode',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPostcode.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );
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
        
        // Detecta se estamos na página de checkout (compatível com novas versões do WooCommerce)
        global $post;
        $is_checkout_page = false;
        $has_checkout_shortcode = false;
        $has_checkout_block = false;
        
        if (isset($post) && is_a($post, 'WP_Post')) {
            $has_checkout_shortcode = has_shortcode($post->post_content, 'woocommerce_checkout');
            $has_checkout_block = has_block('woocommerce/checkout', $post);
        }
        
        // Fallback para função is_checkout() se disponível
        if (function_exists('is_checkout')) {
            $is_checkout_page = is_checkout() || $has_checkout_shortcode || $has_checkout_block;
        } else {
            $is_checkout_page = $has_checkout_shortcode || $has_checkout_block;
        }
        
        $disabled_shipping = get_option('woo_better_calc_disabled_shipping', 'default');
        $enable_min = get_option('woo_better_enable_min_free_shipping', 'no');
        $cart_custom_postcode = get_option('woo_better_calc_enable_cart_page', 'yes');
        $cart_custom_icon = get_option('woo_better_calc_cart_input_icon', 'transit');
        $product_custom_postcode = get_option('woo_better_calc_enable_product_page', 'yes');
        $product_custom_icon = get_option('woo_better_calc_product_input_icon', 'transit');
        $link_config = get_option('woo_better_calc_enable_settings_link', 'no');
        $enable_postcode_search = get_option('woo_better_calc_enable_auto_postcode_search', 'yes');
        $cache_time = get_option('woo_better_calc_cache_expiration_time', '0');
        $cache_token = get_option('woo_better_calc_enable_auto_cache_reset', 'WCBCB_9X2K4M7P5R8T3N6Y1Q');
        $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
        $fill_checkout_address = get_option('woo_better_calc_enable_auto_address_fill', 'no');
        $font_source = get_option('woo_better_calc_font_source', 'yes');
        $font_class = 'woo-better-poppins-family';
        $phone_required = get_option('woo_better_calc_contact_required', 'no');

        if($font_source === 'no'){
            $font_class = 'woo-better-inherit-family';
        } 

        $cart_cep = '';
        if (function_exists('WC') && WC()->customer) {
            $cart_cep = WC()->customer->get_shipping_postcode();
            if (empty($cart_cep)) {
                $cart_cep = WC()->customer->get_billing_postcode();
            }
        }

        if((has_block('woocommerce/product') || 
        (function_exists('is_product') && is_product())) || 
        has_block('woocommerce/cart')) {
            if ($this->user_can_manage_multisite_options() && $link_config === 'yes') {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-cep-settings-link',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergSettingsLink.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );
    
                wp_localize_script($this->plugin_name . '-gutenberg-cep-settings-link', 'lknCartData', array(
                    'settingsUrl' => get_admin_url(get_current_blog_id(), 'admin.php?page=wc-settings&tab=wc-better-calc'),
                ));
            }
        }



        if ((has_block('woocommerce/checkout') || has_block('woocommerce/cart') || (function_exists('is_cart') && is_cart()) || $is_checkout_page) && $enable_min === 'yes') {
            wp_enqueue_script(
                $this->plugin_name . '-progress-bar',
                plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilProgressBar.COMPILED.js',
                array(),
                $this->version,
                false
            );

            // Obtém o total dos itens do carrinho
            $cart_total = 0;
            if (function_exists('WC') && WC()->cart) {
                $cart_total = floatval(WC()->cart->get_subtotal());
            }

            wp_localize_script(
                $this->plugin_name . '-progress-bar',
                'wc_better_shipping_progress',
                array(
                    'min_free_shipping_value' => get_option('woo_better_min_free_shipping_value', 0),
                    'currency_symbol' => get_woocommerce_currency_symbol(),
                    'min_free_shipping_message' => get_option('woo_better_min_free_shipping_message', 'Falta(m) apenas mais {value} para obter FRETE GRÁTIS'),
                    'min_free_shipping_success_message' => get_option('woo_better_min_free_shipping_success_message', 'Parabéns! Você tem frete grátis!'),
                    'has_cart_block' => has_block('woocommerce/cart'),
                    'current_url' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? 'https' : 'http') . '://' . 
                        (isset($_SERVER['HTTP_HOST']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST'])) : '') . 
                        (isset($_SERVER['REQUEST_URI']) ? sanitize_text_field(wp_unslash($_SERVER['REQUEST_URI'])) : ''),
                    'initial_cart_total' => $cart_total,
                    'cart_api_url' => rest_url('wc/store/v1/cart')
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

            // Registrar script para campos de pessoa física/jurídica no checkout de blocos
            $person_type = get_option('woo_better_calc_person_type_select', 'none');
            
            if ($person_type !== 'none') {
                // Obter dados de sessão para pessoa física/jurídica
                $billing_persontype = '';
                $billing_cpf = '';
                $billing_cnpj = '';
                $billing_company = '';
                $billing_document = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_persontype = get_user_meta($user_id, 'billing_persontype', true);
                        $billing_cpf = get_user_meta($user_id, 'billing_cpf', true);
                        $billing_cnpj = get_user_meta($user_id, 'billing_cnpj', true);
                        $billing_company = get_user_meta($user_id, 'billing_company', true);
                        $billing_document = get_user_meta($user_id, 'billing_document', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_persontype)) {
                        $billing_persontype = WC()->session->get('billing_persontype', '');
                    }
                    if (empty($billing_cpf)) {
                        $billing_cpf = WC()->session->get('billing_cpf', '');
                    }
                    if (empty($billing_cnpj)) {
                        $billing_cnpj = WC()->session->get('billing_cnpj', '');
                    }
                    if (empty($billing_company)) {
                        $billing_company = WC()->session->get('billing_company', '');
                    }
                    if (empty($billing_document)) {
                        $billing_document = WC()->session->get('billing_document', '');
                    }
                }

                // Construir campo documento unificado baseado no tipo de pessoa (sempre reconstruir)
                if ($billing_persontype === '1' && !empty($billing_cpf)) {
                    // Pessoa física - usar CPF
                    $billing_document = $billing_cpf;
                } elseif ($billing_persontype === '2' && !empty($billing_cnpj)) {
                    // Pessoa jurídica - usar CNPJ
                    $billing_document = $billing_cnpj;
                } elseif (empty($billing_persontype)) {
                    // Fallback quando não há tipo definido - usar documento salvo ou qualquer disponível
                    if (empty($billing_document)) {
                        if (!empty($billing_cpf)) {
                            $billing_document = $billing_cpf;
                        } elseif (!empty($billing_cnpj)) {
                            $billing_document = $billing_cnpj;
                        }
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-person-type',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergPersonType.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-person-type',
                    'WooBetterPersonTypeData',
                    array(
                        'billing_persontype' => $billing_persontype,
                        'billing_cpf' => $billing_cpf,
                        'billing_cnpj' => $billing_cnpj,
                        'billing_company' => $billing_company,
                        'billing_document' => $billing_document
                    )
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-person-type',
                    'WooBetterPersonTypeConfig',
                    array(
                        'person_type' => $person_type,
                        'show_select' => ($person_type === 'both') // Só mostrar select quando for 'both'
                    )
                );
            }

            if ($number_field === 'yes') {

                $billing_number = '';
                $shipping_number = '';
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_number = get_user_meta($user_id, 'billing_number', true);
                        $shipping_number = get_user_meta($user_id, 'shipping_number', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_number)) {
                        $billing_number = WC()->session->get('billing_number');
                    }
                    if (empty($shipping_number)) {
                        $shipping_number = WC()->session->get('shipping_number');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-number-field',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergNumberField.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-number-field',
                    'WooBetterNumberData',
                    array(
                        'billing_number' => $billing_number,
                        'shipping_number' => $shipping_number
                    )
                );
            }

            // Registrar script para campos de bairro no checkout de blocos
            $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
            
            if ($neighborhood_enabled === 'yes') {
                // Obter dados de sessão para campos de bairro
                $billing_neighborhood = '';
                $shipping_neighborhood = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_neighborhood = get_user_meta($user_id, 'billing_neighborhood', true);
                        $shipping_neighborhood = get_user_meta($user_id, 'shipping_neighborhood', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_neighborhood)) {
                        $billing_neighborhood = WC()->session->get('billing_neighborhood', '');
                    }
                    if (empty($shipping_neighborhood)) {
                        $shipping_neighborhood = WC()->session->get('shipping_neighborhood', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-neighborhood',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergNeighborhood.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-neighborhood',
                    'WooBetterNeighborhoodData',
                    array(
                        'billing_neighborhood' => $billing_neighborhood,
                        'shipping_neighborhood' => $shipping_neighborhood
                    )
                );
            }

            if ($disabled_shipping === 'all' || ($only_virtual && $disabled_shipping === 'digital')) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-disabled-shipping',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicDiabledFields.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

        // Registrar scripts para checkout shortcode (tradicional)
        if ($has_checkout_shortcode) {
            $person_type = get_option('woo_better_calc_person_type_select', 'none');
            
            if ($person_type !== 'none') {
                // Obter dados de sessão para pessoa física/jurídica
                $billing_persontype = '';
                $billing_cpf = '';
                $billing_cnpj = '';
                $billing_document = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_persontype = get_user_meta($user_id, 'billing_persontype', true);
                        $billing_cpf = get_user_meta($user_id, 'billing_cpf', true);
                        $billing_cnpj = get_user_meta($user_id, 'billing_cnpj', true);
                        $billing_document = get_user_meta($user_id, 'billing_document', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_persontype)) {
                        $billing_persontype = WC()->session->get('billing_persontype', '');
                    }
                    if (empty($billing_cpf)) {
                        $billing_cpf = WC()->session->get('billing_cpf', '');
                    }
                    if (empty($billing_cnpj)) {
                        $billing_cnpj = WC()->session->get('billing_cnpj', '');
                    }
                    if (empty($billing_document)) {
                        $billing_document = WC()->session->get('billing_document', '');
                    }
                }

                // Construir campo documento unificado baseado no tipo de pessoa (sempre reconstruir)
                if ($billing_persontype === '1' && !empty($billing_cpf)) {
                    // Pessoa física - usar CPF
                    $billing_document = $billing_cpf;
                } elseif ($billing_persontype === '2' && !empty($billing_cnpj)) {
                    // Pessoa jurídica - usar CNPJ
                    $billing_document = $billing_cnpj;
                } elseif (empty($billing_persontype)) {
                    // Fallback quando não há tipo definido - usar documento salvo ou qualquer disponível
                    if (empty($billing_document)) {
                        if (!empty($billing_cpf)) {
                            $billing_document = $billing_cpf;
                        } elseif (!empty($billing_cnpj)) {
                            $billing_document = $billing_cnpj;
                        }
                    }
                }    

                wp_enqueue_script(
                    $this->plugin_name . '-shortcode-person-type',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-shortcode-person-type',
                    'WooBetterPersonTypeData',
                    array(
                        'billing_persontype' => $billing_persontype,
                        'billing_cpf' => $billing_cpf,
                        'billing_cnpj' => $billing_cnpj,
                        'billing_document' => $billing_document
                    )
                );

                wp_localize_script(
                    $this->plugin_name . '-shortcode-person-type',
                    'WooBetterPersonTypeConfig',
                    array(
                        'person_type' => $person_type,
                        'show_select' => ($person_type === 'both') // Só mostrar select quando for 'both'
                    )
                );
            }
            
            // Registrar script para campos de bairro no checkout shortcode (tradicional)
            $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
            
            if ($neighborhood_enabled === 'yes') {
                // Obter dados de sessão para campos de bairro
                $billing_neighborhood = '';
                $shipping_neighborhood = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_neighborhood = get_user_meta($user_id, 'billing_neighborhood', true);
                        $shipping_neighborhood = get_user_meta($user_id, 'shipping_neighborhood', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_neighborhood)) {
                        $billing_neighborhood = WC()->session->get('billing_neighborhood', '');
                    }
                    if (empty($shipping_neighborhood)) {
                        $shipping_neighborhood = WC()->session->get('shipping_neighborhood', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-shortcode-neighborhood',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeNeighborhood.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-shortcode-neighborhood',
                    'WooBetterNeighborhoodData',
                    array(
                        'billing_neighborhood' => $billing_neighborhood,
                        'shipping_neighborhood' => $shipping_neighborhood
                    )
                );
            }
        }

        if (
            (has_block('woocommerce/cart') || (function_exists('is_cart') && is_cart())) &&
            $cart_custom_postcode === 'yes' &&
             defined('WC_VERSION') && version_compare(WC_VERSION, '10.0.0', '>=')
        ) {
            wp_enqueue_script(
                'woo-better-cart-custom-postcode',
                plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCustomCartPostcode.COMPILED.js',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true 
            );

            // Detecta se é editor de blocos ou shortcode
            global $post;
            $has_cart_shortcode = isset($post) && is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'woocommerce_cart');
            $is_blocks_cart = has_block('woocommerce/cart') && !$has_cart_shortcode;

            wp_localize_script('woo-better-cart-custom-postcode', 'WooBetterData', array(
                'placeholder' => get_option('woo_better_calc_cart_input_placeholder', 'Insira seu CEP'),
                'position' => get_option('woo_better_calc_cart_input_position', 'top'),
                'custom_position' => get_option('woo_better_calc_cart_custom_position', 'h2[class*="order"]'),
                'is_blocks_cart' => $is_blocks_cart,
                'inputStyles' => array(
                    'backgroundColor' => get_option('woo_better_calc_cart_input_background_color_field', '#ffffff'),
                    'color' => get_option('woo_better_calc_cart_input_color_field', '#000000'),
                    'borderWidth' => get_option('woo_better_calc_cart_input_border_width', '1px'),
                    'borderStyle' => get_option('woo_better_calc_cart_input_border_style', 'solid'),
                    'borderColor' => get_option('woo_better_calc_cart_input_border_color_field', '#cccccc'),
                    'borderRadius' => get_option('woo_better_calc_cart_input_border_radius', '4px'),
                    'fontClass' => $font_class
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
                'iconColor' => get_option('woo_better_calc_cart_input_icon_color', 'blue-icon'),
                'details_icon' => array(
                    'cart' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/product.svg',
                    'quantity' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/quantity.svg',
                ),
                'display_icon' => array(
                    'up' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/upButton.svg',
                    'down' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/downButton.svg',
                ),
                'update_icon' => array(
                    'updates' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/updates.svg',
                ),
                'wooUrl' => $this->get_site_url(),
                'ajaxurl' => $this->get_admin_ajax_url(),
                'product_id' => get_the_ID(),
                'quantity' => WC_BETTER_SHIPPING_PRODUCT_QUANTITY,
                'enable_search' => $enable_postcode_search,
                'cache_time' => $cache_time,
                'cache_token' => $cache_token,
                'cart_cep' => $cart_cep
            ));

            wp_enqueue_style(
                'woo-better-cart-custom-postcode', 
                plugin_dir_url(dirname(__FILE__)) . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminCustomPostcode.COMPILED.css',
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
                plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCustomProductPostcode.COMPILED.js',
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
                    'fontClass' => $font_class
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
                'iconColor' => get_option('woo_better_calc_product_input_icon_color', 'blue-icon'),
                'details_icon' => array(
                    'product' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/product.svg',
                    'quantity' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/quantity.svg',
                ),
                'display_icon' => array(
                    'up' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/upButton.svg',
                    'down' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/downButton.svg',
                ),
                'update_icon' => array(
                    'updates' => plugin_dir_url(dirname(__FILE__)) . 'Includes/assets/icons/updates.svg',
                ),
                'wooUrl' => $this->get_site_url(),
                'ajaxurl' => $this->get_admin_ajax_url(),
                'product_id' => get_the_ID(),
                'quantity' => WC_BETTER_SHIPPING_PRODUCT_QUANTITY,
                'enable_search' => $enable_postcode_search,
                'cache_time' => $cache_time,
                'cache_token' => $cache_token,
                'cart_cep' => $cart_cep
            ));

            wp_enqueue_style(
                'woo-better-product-custom-postcode', 
                plugin_dir_url(dirname(__FILE__)) . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminCustomPostcode.COMPILED.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, 
                'all'
            );
        }

        if ($is_checkout_page) {
            $number_field = get_option('woo_better_calc_number_required', 'no');
            $billing_number = '';
            $shipping_number = '';
            if (function_exists('WC') && WC()->session) {
                // Se usuário está logado, pega dados dos meta do usuário
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_number = get_user_meta($user_id, 'billing_number', true);
                    $shipping_number = get_user_meta($user_id, 'shipping_number', true);
                }
                
                // Fallback para sessão se não há dados do usuário
                if (empty($billing_number)) {
                    $billing_number = WC()->session->get('billing_number');
                }
                if (empty($shipping_number)) {
                    $shipping_number = WC()->session->get('shipping_number');
                }
            }

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

            // Usando variável já definida no topo da função
            if($cep_position === 'yes' && !$has_checkout_shortcode)
            {
                wp_enqueue_script(
                    $this->plugin_name . '-checkout-postcode',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPostcode.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-checkout-postcode',
                    'wc_better_checkout_vars',
                    array(
                        'ajax_url' => $this->get_admin_ajax_url(),
                        'fill_checkout_address' => $fill_checkout_address,
                        'billing_number' => $billing_number,
                        'shipping_number' => $shipping_number,
                        'nonce' => wp_create_nonce('wc_better_insert_address')
                    )
                );
            }

            if($cep_position === 'yes' && $has_checkout_shortcode)
            {
                wp_enqueue_script(
                    $this->plugin_name . '-checkout-postcode-shortcode',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPostcodeShortcode.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-checkout-postcode-shortcode',
                    'wc_better_checkout_vars_shortcode',
                    array(
                        'ajax_url' => $this->get_admin_ajax_url(),
                        'fill_checkout_address' => $fill_checkout_address,
                        'billing_number' => $billing_number,
                        'shipping_number' => $shipping_number,
                        'nonce' => wp_create_nonce('wc_better_insert_address')
                    )
                );
            }

            if($phone_required === 'yes' && !$has_checkout_shortcode) {
                wp_enqueue_style(
                    $this->plugin_name . '-checkout-phone-required',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneRequired.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );

                wp_enqueue_script(
                    $this->plugin_name . '-checkout-phone-required',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneRequired.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );
            }

            if($phone_required === 'yes' && $has_checkout_shortcode) {
                wp_enqueue_style(
                    $this->plugin_name . '-checkout-phone-required-shortcode',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneRequired.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );

                wp_enqueue_script(
                    $this->plugin_name . '-checkout-phone-required-shortcode',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneRequiredShortcode.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );
            }

            if ($number_field === 'yes' && $has_checkout_shortcode && ($disabled_shipping === 'default' || (!$only_virtual && $disabled_shipping === 'digital'))) {
                wp_enqueue_script(
                    $this->plugin_name . '-short-number-field',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortNumberField.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                 wp_localize_script(
                    $this->plugin_name . '-short-number-field',
                    'wc_better_checkout_shortcode_number_vars',
                    array(
                        'billing_number' => $billing_number,
                        'shipping_number' => $shipping_number
                    )
                );
            }

            if ($disabled_shipping === 'all' || ($only_virtual && $disabled_shipping === 'digital')) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-disabled-shipping',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicDiabledFields.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );
            }
        }

        // Scripts para página de edição de endereços da conta
        $is_edit_address = false;
        if (function_exists('is_wc_endpoint_url')) {
            $is_edit_address = is_wc_endpoint_url('edit-address');
        } else if (isset($_GET['edit-address'])) {
            $is_edit_address = true;
        }

        if ($is_edit_address) {
            // Scripts de pessoa física/jurídica
            $person_type = get_option('woo_better_calc_person_type_select', 'none');
            
            if ($person_type !== 'none') {
                // Obter dados do usuário para pessoa física/jurídica
                $billing_persontype = '';
                $billing_cpf = '';
                $billing_cnpj = '';
                $billing_document = '';
                
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_persontype = get_user_meta($user_id, 'billing_persontype', true);
                    $billing_cpf = get_user_meta($user_id, 'billing_cpf', true);
                    $billing_cnpj = get_user_meta($user_id, 'billing_cnpj', true);
                    $billing_document = get_user_meta($user_id, 'billing_document', true);
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-person-type',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-person-type',
                    'WooBetterPersonTypeData',
                    array(
                        'billing_persontype' => $billing_persontype,
                        'billing_cpf' => $billing_cpf,
                        'billing_cnpj' => $billing_cnpj,
                        'billing_document' => $billing_document
                    )
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-person-type',
                    'WooBetterPersonTypeConfig',
                    array(
                        'person_type' => $person_type,
                        'show_select' => ($person_type === 'both')
                    )
                );
            }

            // Scripts para campo de bairro
            $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
            
            if ($neighborhood_enabled === 'yes') {
                // Obter dados do usuário para campos de bairro
                $billing_neighborhood = '';
                $shipping_neighborhood = '';
                
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_neighborhood = get_user_meta($user_id, 'billing_neighborhood', true);
                    $shipping_neighborhood = get_user_meta($user_id, 'shipping_neighborhood', true);
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-neighborhood',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeNeighborhood.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-neighborhood',
                    'WooBetterNeighborhoodData',
                    array(
                        'billing_neighborhood' => $billing_neighborhood,
                        'shipping_neighborhood' => $shipping_neighborhood
                    )
                );
            }

            // Scripts para campo de telefone obrigatório
            $phone_required = get_option('woo_better_calc_contact_required', 'no');
            
            if ($phone_required === 'yes') {
                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-phone-required',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneRequiredShortcode.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );
            }

            // Scripts para campo de número
            $number_field = get_option('woo_better_calc_number_required', 'no');
            
            if ($number_field === 'yes') {
                // Obter dados do usuário para número
                $billing_number = '';
                $shipping_number = '';
                
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_number = get_user_meta($user_id, 'billing_number', true);
                    $shipping_number = get_user_meta($user_id, 'shipping_number', true);
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-number',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortNumberField.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-number',
                    'wc_better_checkout_shortcode_number_vars',
                    array(
                        'billing_number' => $billing_number,
                        'shipping_number' => $shipping_number
                    )
                );
            }

            // Scripts para auto-preenchimento de CEP
            $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
            
            if ($cep_position === 'yes') {
                // Obter dados do usuário
                $billing_number = '';
                $shipping_number = '';
                
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_number = get_user_meta($user_id, 'billing_number', true);
                    $shipping_number = get_user_meta($user_id, 'shipping_number', true);
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-postcode',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPostcodeShortcode.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-postcode',
                    'wc_better_checkout_vars_shortcode',
                    array(
                        'ajax_url' => $this->get_admin_ajax_url(),
                        'fill_checkout_address' => 'yes', // Always enable for edit-address pages
                        'billing_number' => $billing_number,
                        'shipping_number' => $shipping_number,
                        'nonce' => wp_create_nonce('wc_better_insert_address')
                    )
                );
            }
        }

        if (function_exists('is_cart') && is_cart()) {

            wp_enqueue_script(
                $this->plugin_name . '-frontend',
                plugin_dir_url(__FILE__) . "jsCompiled/WcBetterShippingCalculatorForBrazilPublicCEPField.COMPILED.js",
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
