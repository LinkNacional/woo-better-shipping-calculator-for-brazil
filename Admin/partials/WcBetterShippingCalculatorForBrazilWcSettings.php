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
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_geral'
            ),
            'disabled_shipping' => array(
                'title'    => __('Entrega de produto', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_disabled_shipping',
                'default'  => 'default',
                'desc_tip' => false,
                'type'     => 'select',
                'options'  => array(
                    'all'     => __('Desabilitar entrega/endereço para todos os produtos', 'woo-better-shipping-calculator-for-brazil'),
                    'digital' => __('Desabilitar entrega/endereço para apenas produtos digitais', 'woo-better-shipping-calculator-for-brazil'),
                    'default' => __('Manter entrega padrão', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Escolha como deseja configurar a entrega dos produtos.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Salve esta configuração para aplicar as regras de entrega selecionadas.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Configuração de entrega de produtos.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'number_required' => array(
                'title'    => __('Adicionar campo de número (Checkout)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_number_required',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Adiciona um campo para complementar o endereço no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite esta configuração para adicionar um campo de número no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Campo de número no checkout.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'enable_min_free_shipping' => array(
                'title'    => __('Ativar valor mínimo para frete grátis', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_enable_min_free_shipping',
                'default'  => 'no',
                'type'     => 'checkbox',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Permite definir um valor mínimo para ativar o frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite esta opção para configurar um valor mínimo para frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Configuração de frete grátis.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'min_free_shipping_value' => array(
                'title'    => __('Valor mínimo para frete grátis', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_min_free_shipping_value',
                'desc_tip' => false,
                'default'  => '',
                'type'     => 'number',
                'custom_attributes' => array(
                    'min' => 0,
                    'data-desc-tip' => __('Defina o valor mínimo necessário para ativar o frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o valor mínimo do carrinho para ativar o frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Valor mínimo para frete grátis.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'geral_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_geral'
            ),

            // TAB 2: Configurações Gutenberg
            'gutenberg_section' => array(
                'title' => __('Configurações Gutenberg', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_gutenberg'
            ),
            'cep_required' => array(
                'title'    => __('CEP obrigatório no carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_cep_required',
                'default'  => 'yes',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Exige que o cliente insira um CEP válido no carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite esta configuração para tornar o CEP obrigatório no carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('CEP obrigatório no carrinho.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'hidden_cart_address' => array(
                'title'    => __('Ocultar campos de endereço na página de carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_hidden_cart_address',
                'default'  => 'yes',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Oculta os campos de endereço na página de carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite esta configuração para ocultar os campos de endereço no carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Ocultar campos de endereço.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'gutenberg_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_gutenberg'
            ),

            // TAB 3: Shortcodes
            'shortcodes_section' => array(
                'title' => __('Shortcodes', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __(
                    'O uso de shortcodes abaixo é aplicável principalmente em temas clássicos. Em temas baseados em blocos, como o Gutenberg, não há necessidade de utilizar shortcodes, pois o editor de blocos oferece funcionalidades nativas que substituem essa necessidade.<br><br><strong>Carrinho:</strong> <code>[woocommerce_cart]</code><br><br><strong>Finalização de compra:</strong> <code>[woocommerce_checkout]</code><br><br><strong>Próximas funcionalidades:</strong> Gerador de etiqueta, Shortcode cálculo de CEP, Autopreenchimento de cep e muitos mais. <a href="https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/issues/new" target="_blank">Participe envie sua sugestão.</a>',
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
