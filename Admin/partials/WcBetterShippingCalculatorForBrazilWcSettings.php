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
                'title'    => __('Desabilitar frete', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Ao habilitar este campo, será desabilitado o frete nos produtos, juntamente com os campos de endereços no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_disabled_shipping',
                'default'  => 'no',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Não', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            array(
                'title'    => __('CEP obrigatório no carrinho(Gutenberg apenas)', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Ao tornar o CEP obrigatório, o usuário precisa informar obrigatoriamente um CEP no carrinho antes de prosseguir para o checkout.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cep_required',
                'default'  => 'no',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Não', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            array(
                'title'    => __('Campo número(Checkout)', 'woo-better-shipping-calculator-for-brazil'),
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
        \WC_Admin_Settings::save_fields($this->get_settings());
    }
}
