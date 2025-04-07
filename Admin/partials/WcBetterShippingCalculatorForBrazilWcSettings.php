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
        $this->label = __('Wc-better-calc', 'woo-better-shipping-calculator-for-brazil');
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
                'title'    => __('CEP obrigatório no carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Torna o campo de CEP obrigatório na página do carrinho.', 'woo-better-shipping-calculator-for-brazil'),
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
                    'Caso deseje, também é possível utilizar os shortcodes abaixo para configurar o fluxo de pagamento no seu site.<br><br><strong>Carrinho:</strong> <code>[woocommerce_cart]</code><br><br><strong>Finalização de compra:</strong> <code>[woocommerce_checkout]</code>',
                    'woo-better-shipping-calculator-for-brazil'
                ),
                'type'  => 'title',
                'id'    => 'woo_better_calc_shortcodes',
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
