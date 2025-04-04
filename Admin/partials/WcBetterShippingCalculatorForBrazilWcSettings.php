<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials;

if (!defined('ABSPATH')) {
    exit;
}

class WcBetterShippingCalculatorForBrazilWcSettings extends \WC_Settings_Page
{
    public function __construct()
    {
        $this->id    = 'woo-better-calc';
        $this->label = __('Woo-better-calc', 'woocommerce');
        parent::__construct();
    }

    public function get_settings()
    {
        $settings = array(

            array(
                'title' => __('Configurações', 'woocommerce'),
                'desc'  => __('Personalize o plugin através das seguintes opções:', 'woocommerce'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_options'
            ),

            array(
                'title'    => __('CEP obrigatório no carrinho', 'woocommerce'),
                'desc_tip' => __('Torna o campo de CEP obrigatório na página do carrinho.', 'woocommerce'),
                'id'       => 'woo_better_calc_cep_required',
                'default'  => 'no',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'woocommerce'),
                    'no'  => __('Não', 'woocommerce')
                )
            ),

            array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_options'
            ),

            array(
                'title' => '',
                'desc'  => __(
                    'Avalie nosso plugin <a href="https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews" target="_blank">★★★★★</a> . ' .
                    'Quer conhecer mais sobre nossos plugins ou deseja tirar alguma dúvida? Acesse: <a href="https://www.linknacional.com.br" target="_blank">Link Nacional</a>',
                    'woocommerce'
                ),
                'type'  => 'title',
                'id'    => 'woo_better_calc_footer',
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
