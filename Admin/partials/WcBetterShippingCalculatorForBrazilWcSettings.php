<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials;

if (!defined('ABSPATH')) {
    exit;
}

class WcBetterShippingCalculatorForBrazilWcSettings extends \WC_Settings_Page
{
    public function __construct()
    {
        $this->id    = 'wc-better-calc';
        $this->label = __('Calculadora de frete', 'woo-better-shipping-calculator-for-brazil');
        parent::__construct();
    }

    public function get_settings()
    {
        $settings = array(

            array(
                'title' => __('Configurações', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __('Personalize o plugin através das seguintes opções:', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_options'
            ),

            array(
                'title'    => __('Entrega de produto', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_disabled_shipping',
                'default'  => 'default',
                'type'     => 'select',
                'options'  => array(
                    'all' => __('Desabilitar entrega/endereço para todos os produtos', 'woo-better-shipping-calculator-for-brazil'),
                    'digital'  => __('Desabilitar entrega/endereço para apenas produtos digitais', 'woo-better-shipping-calculator-for-brazil'),
                    'default'  => __('Manter entrega padrão', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            array(
                'title'    => __('Adicionar campo de número(Checkout)', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Ao habilitar este campo, será adicionado um componente de número para dar complemento adicional ao campo de endereço.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_number_required',
                'default'  => 'no',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Não', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_gutenberg_fields'
            ),

            array(
                'title' => __('Gutenberg configurações:', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_gutenberg_fields'
            ),

            array(
                'title'    => __('Ocultar campos de endereço na página de carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Ao habilitar este campo, será desabilitado os campos de endereços na página de carrinho do Gutenberg.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_hidden_cart_address',
                'default'  => 'yes',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Não', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            array(
                'title'    => __('CEP obrigatório no carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Ao tornar o CEP obrigatório, o usuário precisa validar um CEP no carrinho antes de prosseguir para o checkout.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cep_required',
                'default'  => 'no',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Não', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_options'
            ),

            // Shortcodes info
            array(
                'title' => __('Shortcodes', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __(
                    'O uso de shortcodes abaixo é aplicável principalmente em temas clássicos. Em temas baseados em blocos, como o Gutenberg, não há necessidade de utilizar shortcodes, pois o editor de blocos oferece funcionalidades nativas que substituem essa necessidade.<br><br><strong>Carrinho:</strong> <code>[woocommerce_cart]</code><br><br><strong>Finalização de compra:</strong> <code>[woocommerce_checkout]</code>',
                    'woo-better-shipping-calculator-for-brazil'
                ),
                'type'  => 'title',
                'id'    => 'woo_better_calc_shortcodes',
            ),

            // Proximas funcionalidades
            array(
                'title' => __('Próximas funcionalidades', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __(
                    'Gerador de etiqueta, Shortcode calculo de CEP, Autopreenchimento de cep, frete gratuito e muitos mais. <a href="https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/issues/new" target="_blank">Participe envie sua sugestão.</a>',
                    'woo-better-shipping-calculator-for-brazil'
                ),
                'type'  => 'title',
                'id'    => 'woo_better_calc_functions',
            )
        );

        return apply_filters('woocommerce_get_settings_' . $this->id, $settings);
    }


    public function output()
    {
        \WC_Admin_Settings::output_fields($this->get_settings());
    }

    public function save()
    {
        $settings = $this->get_settings();

        $disable_shipping = isset($_POST['woo_better_calc_disabled_shipping']) && (sanitize_text_field(wp_unslash($_POST['woo_better_calc_disabled_shipping'])) === 'all' || sanitize_text_field(wp_unslash($_POST['woo_better_calc_disabled_shipping'])) === 'digital') ? sanitize_text_field(wp_unslash($_POST['woo_better_calc_disabled_shipping'])) : 'default';

        if ($disable_shipping === 'all' || $disable_shipping === 'digital') {
            $_POST['woo_better_calc_number_required'] = 'no';
            $_POST['woo_better_hidden_cart_address'] = 'no';
            $_POST['woo_better_calc_cep_required'] = 'no';
        } else {
            $_POST['woo_better_calc_disabled_shipping'] = 'default';
        }

        \WC_Admin_Settings::save_fields($settings);
    }
}
