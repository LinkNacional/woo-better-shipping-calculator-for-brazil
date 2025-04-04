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
        $this->label = __('Wc-better-calc', 'wc-better-shipping-calculator-for-brazil');
        parent::__construct();
    }

    public function get_settings()
    {
        $settings = array(

            array(
                'title' => __('Configurações', 'wc-better-shipping-calculator-for-brazil'),
                'desc'  => __('Personalize o plugin através das seguintes opções:', 'wc-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_options'
            ),

            array(
                'title'    => __('CEP obrigatório no carrinho', 'wc-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Torna o campo de CEP obrigatório na página do carrinho.', 'wc-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cep_required',
                'default'  => 'no',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'wc-better-shipping-calculator-for-brazil'),
                    'no'  => __('Não', 'wc-better-shipping-calculator-for-brazil')
                )
            ),

            array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_options'
            ),

            array(
                'title' => '',
                'desc'  => __(
                    'Avalie nosso plugin <a href="https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews" target="_blank">★★★★★</a>. Quer conhecer mais sobre nossos plugins ou deseja tirar alguma dúvida? Acesse: <a href="https://www.linknacional.com.br" target="_blank">Link Nacional</a>',
                    'wc-better-shipping-calculator-for-brazil'
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
