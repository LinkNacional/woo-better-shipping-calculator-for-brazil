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
        $has_checkout_block = false;
        $is_checkout_classic = false;
        
        // Verifica se existe função is_checkout() do WooCommerce
        if (function_exists('is_checkout')) {
            $is_checkout_page = is_checkout();
        }
        
        if (isset($post) && is_a($post, 'WP_Post')) {
            $has_checkout_block = function_exists('has_block') && has_block('woocommerce/checkout', $post);
            // Se estamos na página de checkout mas não é blocos, trata como clássico/shortcode
            $is_checkout_classic = $is_checkout_page && !$has_checkout_block;
        }
        
        // Página de checkout (blocos ou clássico/shortcode)
        $is_checkout_page = $is_checkout_page || $has_checkout_block;
        
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

            // CSS para máscara de telefone na página de edição de endereços
            $phone_mask_enabled = get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no'));
            
            if ($phone_mask_enabled === 'yes') {
                wp_enqueue_style(
                    $this->plugin_name . '-edit-address-phone-mask',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMask.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );
            }

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
        $has_checkout_block = false;
        $is_checkout_classic = false;
        
        // Verifica se existe função is_checkout() do WooCommerce
        if (function_exists('is_checkout')) {
            $is_checkout_page = is_checkout();
        }
        
        if (isset($post) && is_a($post, 'WP_Post')) {
            $has_checkout_block = function_exists('has_block') && has_block('woocommerce/checkout', $post);
            // Se estamos na página de checkout mas não é blocos, trata como clássico/shortcode
            $is_checkout_classic = $is_checkout_page && !$has_checkout_block;
        }
        
        // Página de checkout (blocos ou clássico/shortcode)
        $is_checkout_page = $is_checkout_page || $has_checkout_block;
        
        // Detecta se estamos na página de agendamento de entrega da Minha Conta
        global $wp;
        $is_delivery_schedule_page = isset($wp->query_vars['delivery-schedule']);

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
        $phone_mask_enabled = get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no'));
        $phone_highlight = get_option('woo_better_calc_contact_field_position', 'no');

        if($font_source === 'no'){
            $font_class = 'woo-better-inherit-family';
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

            // Verifica se todos os produtos são digitais (virtuais ou downloadables)
            $only_digital_products = false;
            if (function_exists('WC') && WC()->cart) {
                $has_digital_only = true;
                $has_products = false;
                foreach (WC()->cart->get_cart() as $cart_item) {
                    $has_products = true;
                    $product = $cart_item['data'];
                    if (!$product->is_virtual() && !$product->is_downloadable()) {
                        $has_digital_only = false;
                        break;
                    }
                }
                $only_digital_products = $has_products && $has_digital_only;
            }

            wp_localize_script(
                $this->plugin_name . '-progress-bar',
                'wc_better_shipping_progress',
                array(
                    'min_free_shipping_value' => get_option('woo_better_min_free_shipping_value', 0),
                    'currency_symbol' => get_woocommerce_currency_symbol(),
                    'min_free_shipping_message' => get_option('woo_better_min_free_shipping_message', ''),
                    'min_free_shipping_success_message' => get_option('woo_better_min_free_shipping_success_message', ''),
                    'enable_progress_bar_value' => get_option('woo_better_enable_progress_bar_value', 'no'),
                    'enable_free_shipping_detection' => get_option('woo_better_enable_free_shipping_detection', 'yes'),
                    'has_cart_block' => has_block('woocommerce/cart'),
                    'only_digital_products' => $only_digital_products,
                    'ajax_url' => admin_url('admin-ajax.php'),
                    'free_shipping_by_product_enabled' => get_option('woo_better_enable_free_shipping_by_product', 'no') === 'yes',
                    'free_shipping_by_product_message' => __('Frete grátis disponível por produto.', 'woo-better-shipping-calculator-for-brazil'),
                    'min_free_shipping_delivery_time' => get_option('woo_better_min_free_shipping_delivery_time', ''),
                    'free_shipping_by_product_delivery_time' => get_option('woo_better_free_shipping_by_product_delivery_time', ''),
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
                        'billing_document' => $billing_document,
                    )
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-person-type',
                    'WooBetterPersonTypeConfig',
                    array(
                        'person_type' => $person_type,
                        'show_select' => ($person_type === 'both'), // Só mostrar select quando for 'both'
                        'company_field_behavior' => get_option('woo_better_calc_company_field_behavior', 'dynamic')
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

            // Registrar script para campo de Inscrição Estadual (IE) no checkout de blocos
            $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
            if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
                $billing_ie = '';

                if (function_exists('WC') && WC()->session) {
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_ie = get_user_meta($user_id, 'billing_ie', true);
                    }

                    if (empty($billing_ie)) {
                        $billing_ie = WC()->session->get('billing_ie', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-ie-field',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergIEField.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-ie-field',
                    'WooBetterIEData',
                    array(
                        'billing_ie' => $billing_ie,
                    )
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-ie-field',
                    'WooBetterIEConfig',
                    array(
                        'person_type' => $person_type,
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
            
            // Registrar script para campo de data de nascimento no checkout de blocos
            $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
            
            if ($birthdate_enabled === 'yes') {
                // Obter dados de sessão para campo de data de nascimento
                $billing_birthdate = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_birthdate = get_user_meta($user_id, 'billing_birthdate', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_birthdate)) {
                        $billing_birthdate = WC()->session->get('billing_birthdate', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-birthdate',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergBirthdate.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-birthdate',
                    'WooBetterBirthdateData',
                    array(
                        'billing_birthdate' => $billing_birthdate
                    )
                );
            }
            
            // Registrar script para campo de gênero no checkout de blocos
            $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
            
            if ($gender_enabled === 'yes') {
                // Obter dados de sessão para campo de gênero
                $billing_gender = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_gender = get_user_meta($user_id, 'billing_gender', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_gender)) {
                        $billing_gender = WC()->session->get('billing_gender', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-gender',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergGender.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-gender',
                    'WooBetterGenderData',
                    array(
                        'billing_gender' => $billing_gender
                    )
                );
            }

            // Registrar script para detecção de checkbox "Usar mesmo endereço para faturamento"
            wp_enqueue_script(
                $this->plugin_name . '-gutenberg-shipping-as-billing',
                plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergShippingAsBilling.COMPILED.js',
                array('wp-data'),
                $this->version,
                true
            );

            if ($disabled_shipping === 'all' || ($only_virtual && $disabled_shipping === 'digital')) {
                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-disabled-shipping',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicDiabledFields.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );
            }

            // Registrar script para campo de data/hora de entrega no checkout de blocos
            $delivery_schedule_enabled = get_option('woo_better_enable_delivery_schedule', 'no');

            if ($delivery_schedule_enabled === 'yes') {
                $billing_delivery_datetime = '';
                $billing_delivery_date = '';
                $billing_delivery_time_slot = '';

                if (function_exists('WC') && WC()->session) {
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_delivery_datetime = get_user_meta($user_id, 'billing_delivery_datetime', true);
                        $billing_delivery_date = get_user_meta($user_id, 'billing_delivery_date', true);
                        $billing_delivery_time_slot = get_user_meta($user_id, 'billing_delivery_time_slot', true);
                    }
                    if (empty($billing_delivery_datetime)) {
                        $billing_delivery_datetime = WC()->session->get('billing_delivery_datetime', '');
                    }
                    if (empty($billing_delivery_date)) {
                        $billing_delivery_date = WC()->session->get('billing_delivery_date', '');
                    }
                    if (empty($billing_delivery_time_slot)) {
                        $billing_delivery_time_slot = WC()->session->get('billing_delivery_time_slot', '');
                    }
                }

                $schedule_json = get_option('woo_better_delivery_schedule', '{}');
                $schedule = json_decode($schedule_json, true);
                if (!is_array($schedule)) { $schedule = array(); }

                $holidays_path = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR . 'Includes/assets/data/holidays.json';
                $holidays = array();
                if (file_exists($holidays_path)) {
                    $holidays_json = file_get_contents($holidays_path);
                    $holidays = json_decode($holidays_json, true);
                    if (!is_array($holidays)) { $holidays = array(); }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-gutenberg-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergDeliveryDatetime.COMPILED.js',
                    array(),
                    $this->version,
                    true
                );

                wp_enqueue_style(
                    $this->plugin_name . '-gutenberg-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPublicGutenbergDeliveryDatetime.COMPILED.css',
                    array(),
                    $this->version
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-delivery-datetime',
                    'WooBetterDeliverySchedule',
                    $schedule
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-delivery-datetime',
                    'WooBetterDeliveryHolidays',
                    $holidays
                );

                wp_localize_script(
                    $this->plugin_name . '-gutenberg-delivery-datetime',
                    'WooBetterDeliveryData',
                    array(
                        'billing_delivery_datetime' => $billing_delivery_datetime,
                        'billing_delivery_date'     => $billing_delivery_date,
                        'billing_delivery_time_slot' => $billing_delivery_time_slot,
                    )
                );

                // Slots de entrega
                $slots_json = get_option('woo_better_delivery_slots', '[]');
                $slots = json_decode($slots_json, true);
                if (!is_array($slots)) { $slots = array(); }
                wp_localize_script(
                    $this->plugin_name . '-gutenberg-delivery-datetime',
                    'WooBetterDeliverySlots',
                    $slots
                );

                // Tempo mínimo de preparo
                wp_localize_script(
                    $this->plugin_name . '-gutenberg-delivery-datetime',
                    'WooBetterMinPrepHours',
                    (int) get_option('woo_better_min_preparation_hours', 0)
                );
            }
        }

        // Registrar scripts para checkout shortcode (tradicional)
        if ($is_checkout_classic) {
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
                        'show_select' => ($person_type === 'both'), // Só mostrar select quando for 'both'
                        'company_field_behavior' => get_option('woo_better_calc_company_field_behavior', 'dynamic')
                    )
                );
            }

            // Registrar script para campo de Inscrição Estadual (IE) no checkout shortcode (tradicional)
            $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
            $person_type_for_ie = get_option('woo_better_calc_person_type_select', 'none');

            if ($ie_field_enabled === 'yes' && ($person_type_for_ie === 'legal' || $person_type_for_ie === 'both')) {
                $billing_ie = '';

                if (function_exists('WC') && WC()->session) {
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_ie = get_user_meta($user_id, 'billing_ie', true);
                    }

                    if (empty($billing_ie)) {
                        $billing_ie = WC()->session->get('billing_ie', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-shortcode-ie-field',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeIEField.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-shortcode-ie-field',
                    'WooBetterIEData',
                    array(
                        'billing_ie' => $billing_ie
                    )
                );

                wp_localize_script(
                    $this->plugin_name . '-shortcode-ie-field',
                    'WooBetterIEConfig',
                    array(
                        'person_type' => $person_type_for_ie
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
            
            // Registrar script para campo de data de nascimento no checkout shortcode (tradicional)
            $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
            
            if ($birthdate_enabled === 'yes') {
                // Obter dados de sessão para campo de data de nascimento
                $billing_birthdate = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_birthdate = get_user_meta($user_id, 'billing_birthdate', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_birthdate)) {
                        $billing_birthdate = WC()->session->get('billing_birthdate', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-shortcode-birthdate',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeBirthdate.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-shortcode-birthdate',
                    'wc_better_checkout_shortcode_birthdate_vars',
                    array(
                        'billing_birthdate' => $billing_birthdate
                    )
                );
            }
            
            // Registrar script para campo de gênero no checkout clássico
            $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
            
            if ($gender_enabled === 'yes') {
                // Obter dados de sessão para campo de gênero
                $billing_gender = '';
                
                if (function_exists('WC') && WC()->session) {
                    // Se usuário está logado, pega dados dos meta do usuário
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_gender = get_user_meta($user_id, 'billing_gender', true);
                    }
                    
                    // Fallback para sessão se não há dados do usuário
                    if (empty($billing_gender)) {
                        $billing_gender = WC()->session->get('billing_gender', '');
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-shortcode-gender',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeGender.COMPILED.js',
                    array(),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-shortcode-gender',
                    'wc_better_checkout_shortcode_gender_vars',
                    array(
                        'billing_gender' => $billing_gender
                    )
                );
            }

            // Registrar script para campo de data/hora de entrega no checkout clássico
            $delivery_schedule_enabled = get_option('woo_better_enable_delivery_schedule', 'no');

            if ($delivery_schedule_enabled === 'yes') {
                // Obter dados da sessão para o campo
                $billing_delivery_datetime = '';

                if (function_exists('WC') && WC()->session) {
                    if (is_user_logged_in()) {
                        $user_id = get_current_user_id();
                        $billing_delivery_datetime = get_user_meta($user_id, 'billing_delivery_datetime', true);
                    }

                    if (empty($billing_delivery_datetime)) {
                        $billing_delivery_datetime = WC()->session->get('billing_delivery_datetime', '');
                    }
                }

                // Dados do schedule
                $schedule_json = get_option('woo_better_delivery_schedule', '{}');
                $schedule = json_decode($schedule_json, true);
                if (!is_array($schedule)) {
                    $schedule = array();
                }

                // Dados dos feriados
                $holidays_path = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR . 'Includes/assets/data/holidays.json';
                $holidays = array();
                if (file_exists($holidays_path)) {
                    $holidays_json = file_get_contents($holidays_path);
                    $holidays = json_decode($holidays_json, true);
                    if (!is_array($holidays)) {
                        $holidays = array();
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeDeliveryDatetime.COMPILED.js',
                    array(),
                    $this->version,
                    true
                );

                wp_enqueue_style(
                    $this->plugin_name . '-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeDeliveryDatetime.COMPILED.css',
                    array(),
                    $this->version
                );

                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterDeliverySchedule',
                    $schedule
                );

                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterDeliveryHolidays',
                    $holidays
                );

                // Slots de entrega
                $slots_json = get_option('woo_better_delivery_slots', '[]');
                $slots = json_decode($slots_json, true);
                if (!is_array($slots)) { $slots = array(); }
                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterDeliverySlots',
                    $slots
                );

                // Tempo mínimo de preparo
                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterMinPrepHours',
                    (int) get_option('woo_better_min_preparation_hours', 0)
                );
            }
        }

        // Enfileira script de delivery datetime na página de agendamento da Minha Conta
        if ($is_delivery_schedule_page) {
            $delivery_schedule_enabled = get_option('woo_better_enable_delivery_schedule', 'no');

            if ($delivery_schedule_enabled === 'yes') {
                $schedule_json = get_option('woo_better_delivery_schedule', '{}');
                $schedule = json_decode($schedule_json, true);
                if (!is_array($schedule)) { $schedule = array(); }

                $holidays_path = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR . 'Includes/assets/data/holidays.json';
                $holidays = array();
                if (file_exists($holidays_path)) {
                    $holidays_json = file_get_contents($holidays_path);
                    $holidays = json_decode($holidays_json, true);
                    if (!is_array($holidays)) { $holidays = array(); }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeDeliveryDatetime.COMPILED.js',
                    array(),
                    $this->version,
                    true
                );

                wp_enqueue_style(
                    $this->plugin_name . '-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeDeliveryDatetime.COMPILED.css',
                    array(),
                    $this->version
                );

                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterDeliverySchedule',
                    $schedule
                );

                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterDeliveryHolidays',
                    $holidays
                );

                $slots_json = get_option('woo_better_delivery_slots', '[]');
                $slots = json_decode($slots_json, true);
                if (!is_array($slots)) { $slots = array(); }
                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterDeliverySlots',
                    $slots
                );

                wp_localize_script(
                    $this->plugin_name . '-delivery-datetime',
                    'WooBetterMinPrepHours',
                    (int) get_option('woo_better_min_preparation_hours', 0)
                );
            }
        }

        // Verifica se deve esconder calculador para produtos digitais
        $hide_calculator_digital = get_option('woo_better_calc_hide_calculator_digital', 'no');
        $should_hide_for_digital = false;
        
        if ($hide_calculator_digital === 'yes' && function_exists('WC') && WC()->cart) {
            $only_virtual = true;
            foreach (WC()->cart->get_cart() as $cart_item) {
                $product = $cart_item['data'];
                if (!$product->is_virtual() && !$product->is_downloadable()) {
                    $only_virtual = false;
                    break;
                }
            }
            
            // Se há apenas produtos digitais/virtuais, deve esconder
            if ($only_virtual && !WC()->cart->is_empty()) {
                $should_hide_for_digital = true;
            }
        }

        if (
            (has_block('woocommerce/cart') || (function_exists('is_cart') && is_cart())) &&
            $cart_custom_postcode === 'yes' &&
            defined('WC_VERSION') && version_compare(WC_VERSION, '10.0.0', '>=') &&
            !$should_hide_for_digital
        ) {
            wp_enqueue_script(
                'woo-better-cart-custom-postcode',
                plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCustomCartPostcode.COMPILED.js',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                true 
            );

            // Detecta se é editor de blocos ou clássico/shortcode
            global $post;
            $has_cart_blocks = false;
            $is_cart_classic = false;
            
            if (isset($post) && is_a($post, 'WP_Post')) {
                $has_cart_blocks = function_exists('has_block') && has_block('woocommerce/cart', $post);
                // Se estamos na página de carrinho mas não é blocos, trata como clássico/shortcode
                $is_cart_page = function_exists('is_cart') && is_cart();
                $is_cart_classic = $is_cart_page && !$has_cart_blocks;
            }
            
            $is_blocks_cart = $has_cart_blocks;

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
                'get_postcode_nonce' => wp_create_nonce('wc_better_get_user_postcode')
            ));

            wp_enqueue_style(
                'woo-better-cart-custom-postcode', 
                plugin_dir_url(dirname(__FILE__)) . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminCustomPostcode.COMPILED.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, 
                'all'
            );
        }

        // Verifica se deve esconder calculador na página de produto para produtos digitais
        $product_is_digital = false;
        if ($hide_calculator_digital === 'yes' && function_exists('is_product') && is_product()) {
            $product_id = get_the_ID();
            
            if ($product_id && function_exists('wc_get_product')) {
                $wc_product = wc_get_product($product_id);
                
                if ($wc_product && is_object($wc_product)) {
                    if ($wc_product->is_virtual() || $wc_product->is_downloadable()) {
                        $product_is_digital = true;
                    }
                }
            }
        }

        if (
            (has_block('woocommerce/product') || (function_exists('is_product') && is_product())) &&
            $product_custom_postcode === 'yes' &&
            !$product_is_digital
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
                'get_postcode_nonce' => wp_create_nonce('wc_better_get_user_postcode')
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
            if($cep_position === 'yes' && !$is_checkout_classic)
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
                        'ajax_url'             => $this->get_admin_ajax_url(),
                        'fill_checkout_address' => $fill_checkout_address,
                        'silent_address_fill'  => get_option('woo_better_calc_enable_silent_address_fill', 'no'),
                        'billing_number'       => $billing_number,
                        'shipping_number'      => $shipping_number,
                        'nonce'                => wp_create_nonce('wc_better_insert_address')
                    )
                );
            }

            if($cep_position === 'yes' && $is_checkout_classic)
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
                        'ajax_url'             => $this->get_admin_ajax_url(),
                        'fill_checkout_address' => $fill_checkout_address,
                        'silent_address_fill'   => get_option('woo_better_calc_enable_silent_address_fill', 'no'),
                        'billing_number'       => $billing_number,
                        'shipping_number'      => $shipping_number,
                        'nonce'                => wp_create_nonce('wc_better_insert_address')
                    )
                );
            }

            // Scripts para máscara de telefone (DDI + formatação)
            if(($phone_mask_enabled === 'yes' || $phone_highlight === 'yes') && !$is_checkout_classic) {
                wp_enqueue_style(
                    $this->plugin_name . '-checkout-phone-mask',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMask.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );

                wp_enqueue_script(
                    $this->plugin_name . '-checkout-phone-mask',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMask.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );
                
                // Obter dados de sessão para campo custom phone
                $custom_phone = '';
                if (function_exists('WC') && WC()->session) {
                    $custom_phone = WC()->session->get('custom_phone', '');
                }

                if(!isset($custom_phone) || empty($custom_phone)) {
                    // Fallback: tentar pegar do telefone de shipping primeiro
                    if (function_exists('WC') && WC()->customer) {
                        $custom_phone = WC()->customer->get_shipping_phone();
                        
                        // Se ainda estiver vazio, pegar do telefone de billing
                        if (empty($custom_phone)) {
                            $custom_phone = WC()->customer->get_billing_phone();
                        }
                    }
                }

                $custom_country = '+55';
                if (function_exists('WC') && WC()->session) {
                    $custom_country = WC()->session->get('billing_phone_country_code', '');
                }
                
                wp_localize_script(
                    $this->plugin_name . '-checkout-phone-mask',
                    'wc_better_checkout_phone_mask_vars',
                    array(
                        'highlightPhone' => $phone_highlight === 'yes' ? 'true' : 'false',
                        'phoneMaskEnabled' => $phone_mask_enabled === 'yes' ? 'true' : 'false',
                        'phoneRequired' => get_option('woo_better_calc_contact_required', 'no') === 'yes' ? 'true' : 'false',
                        'customPhone' => $custom_phone,
                        'customCountry' => $custom_country
                    )
                );
            }

            if($phone_mask_enabled === 'yes' && $is_checkout_classic) {
                wp_enqueue_style(
                    $this->plugin_name . '-checkout-phone-mask-shortcode',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskShortcode.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
                );

                wp_enqueue_script(
                    $this->plugin_name . '-checkout-phone-mask-shortcode',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskShortcode.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );
                
                wp_localize_script(
                    $this->plugin_name . '-checkout-phone-mask-shortcode',
                    'wc_better_checkout_phone_mask_vars',
                    array(
                        'highlightPhone' => $phone_highlight === 'yes' ? 'true' : 'false',
                        'phoneMaskEnabled' => $phone_mask_enabled === 'yes' ? 'true' : 'false',
                        'phoneRequired' => get_option('woo_better_calc_contact_required', 'no') === 'yes' ? 'true' : 'false'
                    )
                );
            }

            if ($number_field === 'yes' && $is_checkout_classic && ($disabled_shipping === 'default' || (!$only_virtual && $disabled_shipping === 'digital'))) {
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
                        'show_select' => ($person_type === 'both'),
                        'company_field_behavior' => get_option('woo_better_calc_company_field_behavior', 'dynamic')
                    )
                );
            }

            // Script para campo de Inscrição Estadual (IE) na edição de endereço de cobrança
            $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
            $person_type_for_ie = get_option('woo_better_calc_person_type_select', 'none');

            if (
                $ie_field_enabled === 'yes' &&
                ($person_type_for_ie === 'legal' || $person_type_for_ie === 'both')
            ) {
                $billing_ie = '';

                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_ie = get_user_meta($user_id, 'billing_ie', true);
                }

                if (empty($billing_ie) && function_exists('WC') && WC()->session) {
                    $billing_ie = WC()->session->get('billing_ie', '');
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-ie-field',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeIEField.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-ie-field',
                    'WooBetterIEData',
                    array(
                        'billing_ie' => $billing_ie
                    )
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-ie-field',
                    'WooBetterIEConfig',
                    array(
                        'person_type' => $person_type_for_ie
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

            // Scripts para máscara de telefone (DDI + formatação)
            $phone_mask_enabled = get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no'));
            
            if ($phone_mask_enabled === 'yes') {
                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-phone-mask',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskShortcode.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );
                
                wp_enqueue_style(
                    $this->plugin_name . '-edit-address-phone-mask-style',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskShortcode.COMPILED.css',
                    array(),
                    $this->version,
                    'all'
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

            // Scripts para campo de data de nascimento
            $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
            
            if ($birthdate_enabled === 'yes') {
                // Obter dados do usuário para data de nascimento
                $billing_birthdate = '';
                
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_birthdate = get_user_meta($user_id, 'billing_birthdate', true);
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-birthdate',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeBirthdate.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-birthdate',
                    'WooBetterBirthdateData',
                    array(
                        'billing_birthdate' => $billing_birthdate
                    )
                );
            }

            // Scripts para campo de gênero
            $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
            
            if ($gender_enabled === 'yes') {
                // Obter dados do usuário para gênero
                $billing_gender = '';
                
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_gender = get_user_meta($user_id, 'billing_gender', true);
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-gender',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeGender.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    false
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-gender',
                    'WooBetterGenderData',
                    array(
                        'billing_gender' => $billing_gender
                    )
                );
            }

            // Scripts para campo de data/hora de entrega
            $delivery_schedule_enabled = get_option('woo_better_enable_delivery_schedule', 'no');

            if ($delivery_schedule_enabled === 'yes') {
                // Obter dados do usuário
                $billing_delivery_datetime = '';

                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    $billing_delivery_datetime = get_user_meta($user_id, 'billing_delivery_datetime', true);
                }

                // Dados do schedule
                $schedule_json = get_option('woo_better_delivery_schedule', '{}');
                $schedule = json_decode($schedule_json, true);
                if (!is_array($schedule)) {
                    $schedule = array();
                }

                // Dados dos feriados
                $holidays_path = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR . 'Includes/assets/data/holidays.json';
                $holidays = array();
                if (file_exists($holidays_path)) {
                    $holidays_json = file_get_contents($holidays_path);
                    $holidays = json_decode($holidays_json, true);
                    if (!is_array($holidays)) {
                        $holidays = array();
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-edit-address-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeDeliveryDatetime.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    true
                );

                wp_enqueue_style(
                    $this->plugin_name . '-edit-address-delivery-datetime',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodeDeliveryDatetime.COMPILED.css',
                    array(),
                    $this->version
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-delivery-datetime',
                    'WooBetterDeliverySchedule',
                    $schedule
                );

                wp_localize_script(
                    $this->plugin_name . '-edit-address-delivery-datetime',
                    'WooBetterDeliveryHolidays',
                    $holidays
                );

                // Slots de entrega
                $slots_json = get_option('woo_better_delivery_slots', '[]');
                $slots = json_decode($slots_json, true);
                if (!is_array($slots)) { $slots = array(); }
                wp_localize_script(
                    $this->plugin_name . '-edit-address-delivery-datetime',
                    'WooBetterDeliverySlots',
                    $slots
                );

                // Tempo mínimo de preparo
                wp_localize_script(
                    $this->plugin_name . '-edit-address-delivery-datetime',
                    'WooBetterMinPrepHours',
                    (int) get_option('woo_better_min_preparation_hours', 0)
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
                        'ajax_url'             => $this->get_admin_ajax_url(),
                        'fill_checkout_address' => 'yes', // Always enable for edit-address pages
                        'silent_address_fill'   => get_option('woo_better_calc_enable_silent_address_fill', 'no'),
                        'billing_number'       => $billing_number,
                        'shipping_number'      => $shipping_number,
                        'nonce'                => wp_create_nonce('wc_better_insert_address')
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

        // Pop-up de validação de CEP — carregado em todas as páginas públicas,
        // mas NÃO exibe se o usuário já tem CEP preenchido (sessão ou user_meta).
        $cep_popup_enabled = get_option('woo_better_calc_enable_cep_popup', 'no');
        if ($cep_popup_enabled === 'yes') {
            $has_postcode = false;

            if (function_exists('WC') && WC()->session) {
                $shipping_postcode = WC()->session->get('shipping_postcode');
                $billing_postcode  = WC()->session->get('billing_postcode');
                if (!empty($shipping_postcode) || !empty($billing_postcode)) {
                    $has_postcode = true;
                }
            }

            if (!$has_postcode && is_user_logged_in()) {
                $user_id = get_current_user_id();
                $shipping_postcode = get_user_meta($user_id, 'shipping_postcode', true);
                $billing_postcode  = get_user_meta($user_id, 'billing_postcode', true);
                if (!empty($shipping_postcode) || !empty($billing_postcode)) {
                    $has_postcode = true;
                }
            }

            if (!$has_postcode) {
                // Detecta se há método de Retirada no Local disponível
                $local_pickup_available = false;
                $local_pickup_label = __('Retirada no Local', 'woo-better-shipping-calculator-for-brazil');

                // 1) Checkout clássico (shortcode) — busca nas zonas de entrega
                if (function_exists('WC') && class_exists('WC_Shipping_Zones')) {
                    $shipping_zones = \WC_Shipping_Zones::get_zones();
                    foreach ($shipping_zones as $zone) {
                        if (!empty($zone['shipping_methods'])) {
                            foreach ($zone['shipping_methods'] as $method) {
                                if (is_object($method) && $method->id === 'local_pickup' && $method->is_enabled()) {
                                    $local_pickup_available = true;
                                    $local_pickup_label = $method->get_title();
                                    break 2;
                                }
                            }
                        }
                    }
                    // Zona 0 ("Locations not covered by your other zones")
                    if (!$local_pickup_available) {
                        $zone_0 = new \WC_Shipping_Zone(0);
                        foreach ($zone_0->get_shipping_methods() as $method) {
                            if (is_object($method) && $method->id === 'local_pickup' && $method->is_enabled()) {
                                $local_pickup_available = true;
                                $local_pickup_label = $method->get_title();
                                break;
                            }
                        }
                    }
                }

                // 2) Checkout em blocos (Gutenberg) — configuração está em option do WC
                $pickup_address = '';
                if (!$local_pickup_available) {
                    $pickup_settings = get_option('woocommerce_pickup_location_settings', array());
                    if (!empty($pickup_settings) && isset($pickup_settings['enabled']) && $pickup_settings['enabled'] === 'yes') {
                        $local_pickup_available = true;
                        if (!empty($pickup_settings['title'])) {
                            $local_pickup_label = $pickup_settings['title'];
                        }
                        // Monta endereço da primeira localização ativa
                        if (!empty($pickup_settings['pickup_locations']) && is_array($pickup_settings['pickup_locations'])) {
                            foreach ($pickup_settings['pickup_locations'] as $loc) {
                                if (!empty($loc['enabled']) && !empty($loc['address'])) {
                                    $addr = $loc['address'];
                                    $parts = array();
                                    if (!empty($addr['address_1'])) $parts[] = $addr['address_1'];
                                    if (!empty($addr['city'])) $parts[] = $addr['city'];
                                    if (!empty($addr['state'])) {
                                        $parts[count($parts)-1] = ($parts[count($parts)-1] ?? '') . '/' . $addr['state'];
                                    }
                                    if (!empty($addr['postcode'])) $parts[] = $addr['postcode'];
                                    $pickup_address = implode(', ', $parts);
                                    break;
                                }
                            }
                        }
                    }
                }

                wp_enqueue_script(
                    $this->plugin_name . '-cep-popup',
                    plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicCepPopup.COMPILED.js',
                    array('jquery'),
                    $this->version,
                    true
                );

                wp_enqueue_style(
                    $this->plugin_name . '-cep-popup',
                    plugin_dir_url(__FILE__) . 'cssCompiled/WcBetterShippingCalculatorForBrazilCepPopup.COMPILED.css',
                    array(),
                    $this->version
                );

                wp_localize_script(
                    $this->plugin_name . '-cep-popup',
                    'WooBetterCepPopup',
                    array(
                        'enabled'    => true,
                        'ajaxurl'    => $this->get_admin_ajax_url(),
                        'nonce'      => wp_create_nonce('wc_better_cep_popup'),
                        'title'      => __('Disponibilidade de Compra?', 'woo-better-shipping-calculator-for-brazil'),
                        'subtitle'   => __('Verifique se há entregas disponíveis para sua região.', 'woo-better-shipping-calculator-for-brazil'),
                        'successMsg' => __('Você já pode continuar suas compras!', 'woo-better-shipping-calculator-for-brazil'),
                        'delivery_label' => __('Ou informe seu CEP', 'woo-better-shipping-calculator-for-brazil'),
                        'delivery_btn'    => __('Entrega para Endereço', 'woo-better-shipping-calculator-for-brazil'),
                        'local_pickup_available' => $local_pickup_available,
                        'local_pickup_label'     => $local_pickup_label,
                        'pickup_address'         => $pickup_address,
                        'whatsapp_number'        => get_option('woo_better_whatsapp_number', ''),
                        'fail_message'           => get_option('woo_better_cep_popup_fail_message', __('Entre em contato conosco para organizar sua entrega.', 'woo-better-shipping-calculator-for-brazil')),
                    )
                );
            }
        }

    }
}
