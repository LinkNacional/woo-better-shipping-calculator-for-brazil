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
            // TAB 1: Geral
            'geral_section' => array(
                'title' => __('Geral', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __('Personalize o plugin através das seguintes opções:', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_geral'
            ),
            'disabled_shipping' => array(
                'title'    => __('Entrega de produto', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_disabled_shipping',
                'default'  => 'default',
                'type'     => 'select',
                'options'  => array(
                    'all'     => __('Desabilitar entrega/endereço para todos os produtos', 'woo-better-shipping-calculator-for-brazil'),
                    'digital' => __('Desabilitar entrega/endereço para apenas produtos digitais', 'woo-better-shipping-calculator-for-brazil'),
                    'default' => __('Manter entrega padrão', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'number_required' => array(
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
            'geral_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_geral'
            ),

            // TAB 2: Configurações Gutenberg
            'gutenberg_section' => array(
                'title' => __('Gutenberg', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_gutenberg'
            ),
            'cep_required' => array(
                'title'    => __('CEP obrigatório no carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Ao tornar o CEP obrigatório, o usuário precisa validar um CEP no carrinho antes de prosseguir para o checkout.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cep_required',
                'default'  => 'yes',
                'type'     => 'select',
                'options'  => array(
                    'yes' => __('Sim', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Não', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'hidden_cart_address' => array(
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
            'enable_min_free_shipping' => array(
                'title'    => __('Enable minimum value for free shipping', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Enable this option to set a minimum cart value for free shipping.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_enable_min_free_shipping',
                'default'  => 'no',
                'type'     => 'checkbox',
            ),
            'min_free_shipping_value' => array(
                'title'    => __('Minimum value for free shipping', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => __('Set the minimum cart value required to activate free shipping.', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_min_free_shipping_value',
                'default'  => '',
                'type'     => 'number',
                'custom_attributes' => array(
                    'min' => 0
                ),
            ),
            'gutenberg_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_gutenberg'
            ),

            // TAB 3: Shortcodes
            'shortcodes_section' => array(
                'title' => __('Shortcodes', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __(
                    'O uso de shortcodes abaixo é aplicável principalmente em temas clássicos. Em temas baseados em blocos, como o Gutenberg, não há necessidade de utilizar shortcodes, pois o editor de blocos oferece funcionalidades nativas que substituem essa necessidade.<br><br><strong>Carrinho:</strong> <code>[woocommerce_cart]</code><br><br><strong>Finalização de compra:</strong> <code>[woocommerce_checkout]</code><br><br><strong>Próximas funcionalidades:</strong> Gerador de etiqueta, Shortcode cálculo de CEP, Autopreenchimento de cep, frete gratuito e muitos mais. <a href="https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/issues/new" target="_blank">Participe envie sua sugestão.</a>',
                    'woo-better-shipping-calculator-for-brazil'
                ),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_shortcodes',
            ),
            'shortcodes_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_shortcodes'
            ),
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

        $cep_required  = isset($_POST['woo_better_calc_cep_required']) ? sanitize_text_field(wp_unslash($_POST['woo_better_calc_cep_required'])) : '';

        if ($disable_shipping === 'all') {
            $_POST['woo_better_calc_number_required'] = 'no';
            $_POST['woo_better_hidden_cart_address'] = 'no';
            $_POST['woo_better_calc_cep_required'] = 'no';
        } elseif ($disable_shipping === 'digital') {
            $_POST['woo_better_calc_disabled_shipping'] = 'digital';
        } else {
            $_POST['woo_better_calc_disabled_shipping'] = 'default';
        }

        if (isset($cep_required) && $cep_required === 'no') {
            $_POST['woo_better_hidden_cart_address'] = 'no';
        }

        \WC_Admin_Settings::save_fields($settings);
    }
}
