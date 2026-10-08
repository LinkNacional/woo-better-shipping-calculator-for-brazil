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
     * Label do campo de telefone conforme o "Comportamento do Campo de Telefone"
     * (woo_better_calc_phone_mode). Mantém a mesma nomenclatura usada no PHP do
     * Includes (get_phone_field_label).
     *
     * @return string
     */
    private function phone_field_label()
    {
        switch ($this->phone_mode()) {
            case 'landline_only':
                return __('Telefone', 'woo-better-shipping-calculator-for-brazil');
            case 'cellphone_only':
                return __('Celular', 'woo-better-shipping-calculator-for-brazil');
            default:
                // "Celular e Fixo": o campo principal aceita os dois tipos.
                return __('Celular/Telefone', 'woo-better-shipping-calculator-for-brazil');
        }
    }

    /**
     * Modo do "Comportamento do Campo de Telefone" (woo_better_calc_phone_mode).
     *
     * @return string
     */
    private function phone_mode()
    {
        return get_option('woo_better_calc_phone_mode', 'phone_and_cellphone');
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
     * Enfileira o sanitizador universal de campos de telefone.
     *
     * Remove imediatamente caracteres inválidos (ex.: letras) nos campos de
     * telefone, tanto no campo próprio do plugin quanto no nativo do WooCommerce,
     * em todos os cenários (blocos, clássico/shortcode e edição de endereço).
     *
     * @since    5.0.0
     */
    private function enqueue_phone_sanitizer()
    {
        wp_enqueue_script(
            $this->plugin_name . '-phone-sanitizer',
            plugin_dir_url(__FILE__) . 'jsCompiled/WcBetterShippingCalculatorForBrazilPublicPhoneSanitizer.COMPILED.js',
            array(),
            $this->version,
            false
        );
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
        
        $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
        $fill_checkout_address = get_option('woo_better_calc_enable_auto_address_fill', 'no');
        $phone_mask_enabled = get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no'));
        $phone_highlight = get_option('woo_better_calc_contact_field_position', 'no');

        if (has_block('woocommerce/checkout')) {
            $number_field = get_option('woo_better_calc_number_required', 'no');

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
                        'billing_ie' => sanitize_text_field($billing_ie),
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

            // Campos de telefone/celular no checkout em BLOCOS. O campo nativo do
            // WooCommerce fica sempre oculto (o plugin assume o controle do telefone) e
            // os campos são gerados via JS — um script por campo — conforme o
            // "Comportamento do Campo de Telefone". No clássico/shortcode a criação é
            // via hook (woocommerce_billing_fields).
            if ( 'disabled' !== $this->phone_mode() ) {
                $billing_phone      = '';
                $shipping_phone     = '';
                $billing_cellphone  = '';
                $shipping_cellphone = '';

                if (function_exists('WC') && WC()->session) {
                    if (is_user_logged_in()) {
                        $user_id            = get_current_user_id();
                        $billing_phone      = get_user_meta($user_id, 'billing_phone', true);
                        $shipping_phone     = get_user_meta($user_id, 'shipping_phone', true);
                        $billing_cellphone  = get_user_meta($user_id, 'billing_cellphone', true);
                        $shipping_cellphone = get_user_meta($user_id, 'shipping_cellphone', true);
                    }
                    if (empty($billing_phone)) { $billing_phone = WC()->session->get('billing_phone', ''); }
                    if (empty($shipping_phone)) { $shipping_phone = WC()->session->get('shipping_phone', ''); }
                    if (empty($billing_cellphone)) { $billing_cellphone = WC()->session->get('billing_cellphone', ''); }
                    if (empty($shipping_cellphone)) { $shipping_cellphone = WC()->session->get('shipping_cellphone', ''); }
                }

                $phone_fields_config = array(
                    'mode'              => $this->phone_mode(),
                    'namespace'         => \Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE,
                    'phoneNamespace'    => \Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil::PHONE_EXTENSION_NAMESPACE,
                    'cellphoneNamespace' => \Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil::CELLPHONE_EXTENSION_NAMESPACE,
                    'phoneLabel'        => $this->phone_field_label(),
                    'cellphoneLabel'    => __('Celular', 'woo-better-shipping-calculator-for-brazil'),
                    'maskEnabled'       => $phone_mask_enabled === 'yes' ? 'true' : 'false',
                    'showCountryCode'   => get_option('woo_better_calc_show_phone_country_code', 'no') === 'yes' ? 'true' : 'false',
                    'validateDdd'       => get_option('woo_better_calc_validate_ddd', 'yes') === 'yes' ? 'true' : 'false',
                    'required'          => get_option('woo_better_calc_contact_required', 'no') === 'yes' ? 'true' : 'false',
                    'cellphoneRequired' => get_option('woo_better_calc_cellphone_required', 'no') === 'yes' ? 'true' : 'false',
                    'enableCellphone'   => get_option('woo_better_calc_enable_cellphone_field', 'no') === 'yes' ? 'true' : 'false',
                    'highlight'         => $phone_highlight === 'yes' ? 'true' : 'false',
                    'billing_phone'     => $billing_phone,
                    'shipping_phone'    => $shipping_phone,
                    'billing_cellphone' => $billing_cellphone,
                    'shipping_cellphone' => $shipping_cellphone
                );

                // Um script por campo, conforme o modo.
                $phone_field_scripts = array();
                if ('landline_only' === $this->phone_mode()) {
                    $phone_field_scripts[] = 'WcBetterShippingCalculatorForBrazilPublicGutenbergPhoneFieldLandline';
                } elseif ('cellphone_only' === $this->phone_mode()) {
                    $phone_field_scripts[] = 'WcBetterShippingCalculatorForBrazilPublicGutenbergCellphoneFieldOnly';
                } elseif ('phone_and_cellphone' === $this->phone_mode()) {
                    $phone_field_scripts[] = 'WcBetterShippingCalculatorForBrazilPublicGutenbergPhoneFieldBoth';
                    if ('yes' === get_option('woo_better_calc_enable_cellphone_field', 'no')) {
                        $phone_field_scripts[] = 'WcBetterShippingCalculatorForBrazilPublicGutenbergCellphoneFieldBoth';
                    }
                }

                $config_localized = false;
                foreach ($phone_field_scripts as $script_name) {
                    $handle = $this->plugin_name . '-field-' . strtolower(preg_replace('/^.*Gutenberg/', '', $script_name));

                    wp_enqueue_style(
                        $handle,
                        plugin_dir_url(__FILE__) . 'cssCompiled/' . $script_name . '.COMPILED.css',
                        array(),
                        $this->version,
                        'all'
                    );

                    wp_enqueue_script(
                        $handle,
                        plugin_dir_url(__FILE__) . 'jsCompiled/' . $script_name . '.COMPILED.js',
                        array(),
                        $this->version,
                        false
                    );

                    // O config é o mesmo p/ todos os scripts; localiza uma vez.
                    if (!$config_localized) {
                        wp_localize_script($handle, 'WooBetterPhoneFieldsData', $phone_fields_config);
                        $config_localized = true;
                    }
                }
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
                        'billing_birthdate' => $billing_birthdate,
                        'birthdate_required' => get_option('woo_better_calc_birthdate_required', 'yes') === 'yes'
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
                        'billing_ie' => sanitize_text_field($billing_ie)
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
                        'billing_birthdate' => $billing_birthdate,
                        'birthdate_required' => get_option('woo_better_calc_birthdate_required', 'yes') === 'yes'
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
        }


        if ($is_checkout_page) {
            // Sanitizador universal de telefone (campo próprio + nativo, todos os cenários).
            $this->enqueue_phone_sanitizer();

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

            // Máscara de telefone no checkout clássico/shortcode.
            if ($phone_mask_enabled === 'yes' && $is_checkout_classic) {
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
                
                // DDI salvo em sessão (mesma fonte usada no checkout em blocos).
                // O checkout clássico/shortcode precisa disso para restaurar a
                // bandeira correta quando o número não traz o DDI explícito.
                $shortcode_billing_country = '+55';
                $shortcode_shipping_country = '+55';
                if (function_exists('WC') && WC()->session) {
                    $shortcode_billing_country = WC()->session->get('billing_phone_country_code', '');
                    $shortcode_shipping_country = WC()->session->get('shipping_phone_country_code', '');
                }
                $shortcode_billing_country = $shortcode_billing_country ? $shortcode_billing_country : '+55';
                $shortcode_shipping_country = $shortcode_shipping_country ? $shortcode_shipping_country : '+55';

                wp_localize_script(
                    $this->plugin_name . '-checkout-phone-mask-shortcode',
                    'wc_better_checkout_phone_mask_vars',
                    array(
                        'highlightPhone' => $phone_highlight === 'yes' ? 'true' : 'false',
                        'phoneMaskEnabled' => $phone_mask_enabled === 'yes' ? 'true' : 'false',
                        'phoneRequired' => get_option('woo_better_calc_contact_required', 'no') === 'yes' ? 'true' : 'false',
                        'showCountryCode' => get_option('woo_better_calc_show_phone_country_code', 'no') === 'yes' ? 'true' : 'false',
                        'validateDdd' => get_option('woo_better_calc_validate_ddd', 'yes') === 'yes' ? 'true' : 'false',
                        'billingCountry' => $shortcode_billing_country,
                        'shippingCountry' => $shortcode_shipping_country,
                        'phoneMode' => get_option('woo_better_calc_phone_mode', 'phone_and_cellphone')
                    )
                );
            }

            if ($number_field === 'yes' && $is_checkout_classic) {
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

        }

        // Scripts para página de edição de endereços da conta
        $is_edit_address = false;
        if (function_exists('is_wc_endpoint_url')) {
            $is_edit_address = is_wc_endpoint_url('edit-address');
        } else if (isset($_GET['edit-address'])) {
            $is_edit_address = true;
        }

        if ($is_edit_address) {
            // Sanitizador universal de telefone (edição de endereço da conta).
            $this->enqueue_phone_sanitizer();

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
                        'billing_ie' => sanitize_text_field($billing_ie)
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

                wp_localize_script(
                    $this->plugin_name . '-edit-address-phone-mask',
                    'wc_better_checkout_phone_mask_vars',
                    array(
                        'phoneMaskEnabled' => 'true',
                        'showCountryCode' => get_option('woo_better_calc_show_phone_country_code', 'no') === 'yes' ? 'true' : 'false',
                        'validateDdd' => get_option('woo_better_calc_validate_ddd', 'yes') === 'yes' ? 'true' : 'false'
                    )
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
                        'billing_birthdate' => $billing_birthdate,
                        'birthdate_required' => get_option('woo_better_calc_birthdate_required', 'yes') === 'yes'
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

    }
}
