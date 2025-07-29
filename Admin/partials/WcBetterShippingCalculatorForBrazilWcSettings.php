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
                'title'    => __('Frete grátis', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_enable_min_free_shipping',
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Habilitar valor mínimo para frete grátis', 'woo-better-shipping-calculator-for-brazil'),
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

            // TAB 2: Shortcodes
            'shortcodes_section' => array(
                'title' => __('Shortcodes', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __(
                    'O uso de shortcodes abaixo é aplicável principalmente em temas clássicos. Em temas baseados em blocos, como o Gutenberg, não há necessidade de utilizar shortcodes, pois o editor de blocos oferece funcionalidades nativas que substituem essa necessidade.<br><br><strong>Carrinho:</strong> <code>[woocommerce_cart]</code><br><br><strong>Finalização de compra:</strong> <code>[woocommerce_checkout]</code>',
                    'woo-better-shipping-calculator-for-brazil'
                ),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_shortcodes',
            ),
            'shortcodes_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_shortcodes'
            ),

            // TAB 3: Configurações Gutenberg
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

            // TAB 4: Configurações do Carrinho
            'cart_page_settings' => array(
                'title' => __('Carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_cart_page_settings'
            ),

            'enable_cart_page' => array(
                'title'    => __('Habilitar na página de carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_enable_cart_page',
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Habilite esta opção para exibir o campo na página de carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Exibe o campo de personalização na página de carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Habilitar na página de carrinho.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'cart_postcode_current_style' => array(
                'title'    => __('Estilo Atual (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'type'     => 'text',
                'id'       => 'woo_better_calc_cart_postcode_current_style',
                'default'  => '',
                'custom_attributes' => array(
                    'readonly' => 'readonly',
                    'data-desc-tip' => __('Exibe o estilo atual aplicado ao campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Este campo é apenas informativo e exibe o estilo atual.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Estilo Atual (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            // Input style block
            'cart_input_background_color_field' => array(
                'title'    => __('Personalizar Campo de Entrada', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_background_color_field',
                'type'     => 'text',
                'default'  => '#ffffff',
                'custom_attributes' => array(
                    'data-subtitle' => __('Cor de fundo (Input)', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Adicione sua identidade visual aos campos.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor de fundo para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor de Fundo (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'cart_input_color_field' => array(
                'title'    => __('Cor do texto (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_color_field',
                'type'     => 'text',
                'default'  => '#2C3338',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor de texto do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor do texto para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('A cor do texto é aplicada apenas no momento em que o input é digitado, onde a cor não se aplica ao placeholder do componente.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'cart_input_border_width' => array(
                'title'    => __('Largura da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_border_width',
                'type'     => 'text',
                'default'  => '1px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a largura da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a largura da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Largura da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_border_style' => array(
                'title'    => __('Estilo da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_border_style',
                'type'     => 'select',
                'default'  => 'solid',
                'options'  => array(
                    'none'   => __('Nenhuma', 'woo-better-shipping-calculator-for-brazil'),
                    'solid'  => __('Sólida', 'woo-better-shipping-calculator-for-brazil'),
                    'dashed' => __('Tracejada', 'woo-better-shipping-calculator-for-brazil'),
                    'dotted' => __('Pontilhada', 'woo-better-shipping-calculator-for-brazil'),
                    'double' => __('Dupla', 'woo-better-shipping-calculator-for-brazil'),
                    'groove' => __('Sulcada', 'woo-better-shipping-calculator-for-brazil'),
                    'ridge'  => __('Crestada', 'woo-better-shipping-calculator-for-brazil'),
                    'inset'  => __('Inserida', 'woo-better-shipping-calculator-for-brazil'),
                    'outset' => __('Sobressalente', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o estilo da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha o estilo da borda (ex: sólida, tracejada, etc.).', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Estilo da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_border_color_field' => array(
                'title'    => __('Cor da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_border_color_field',
                'type'     => 'text',
                'default'  => '#ccc',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor da borda para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_border_radius' => array(
                'title'    => __('Raio da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_border_radius',
                'type'     => 'text',
                'default'  => '4px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o raio da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o raio da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Raio da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            // Button style block
            'cart_button_background_color_field' => array(
                'title'    => __('Personalizar Botão Consultar', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_button_background_color_field',
                'type'     => 'text',
                'default'  => '#0073aa',
                'custom_attributes' => array(
                    'data-subtitle' => __('Cor de fundo (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Adicione sua identidade visual aos campos.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor de fundo para o botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor de Fundo (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_button_color_field' => array(
                'title'    => __('Cor do texto (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_button_color_field',
                'type'     => 'text',
                'default'  => '#ffffff',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor de texto do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor do texto para o botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor de Texto (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_button_border_width' => array(
                'title'    => __('Largura da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_button_border_width',
                'type'     => 'text',
                'default'  => '1px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a largura da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a largura da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Largura da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_button_border_style' => array(
                'title'    => __('Estilo da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_button_border_style',
                'type'     => 'select',
                'default'  => 'none',
                'options'  => array(
                    'none'   => __('Nenhuma', 'woo-better-shipping-calculator-for-brazil'),
                    'solid'  => __('Sólida', 'woo-better-shipping-calculator-for-brazil'),
                    'dashed' => __('Tracejada', 'woo-better-shipping-calculator-for-brazil'),
                    'dotted' => __('Pontilhada', 'woo-better-shipping-calculator-for-brazil'),
                    'double' => __('Dupla', 'woo-better-shipping-calculator-for-brazil'),
                    'groove' => __('Sulcada', 'woo-better-shipping-calculator-for-brazil'),
                    'ridge'  => __('Crestada', 'woo-better-shipping-calculator-for-brazil'),
                    'inset'  => __('Inserida', 'woo-better-shipping-calculator-for-brazil'),
                    'outset' => __('Sobressalente', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o estilo da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o estilo da borda (ex: sólido, tracejado, etc.).', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Estilo da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_button_border_color_field' => array(
                'title'    => __('Cor da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_button_border_color_field',
                'type'     => 'text',
                'default'  => '#0073aa',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor da borda para o botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_button_border_radius' => array(
                'title'    => __('Raio da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_button_border_radius',
                'type'     => 'text',
                'default'  => '4px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o raio da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o raio da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Raio da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            // Extra style block
            'cart_input_placeholder' => array(
                'title'    => __('Configurações Extras', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_placeholder',
                'type'     => 'text',
                'default'  => 'Insira seu CEP',
                'custom_attributes' => array(
                    'data-subtitle' => __('Placeholder', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Adicione sua identidade visual aos campos.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o texto que será exibido como placeholder.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Placeholder.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_icon' => array(
                'title'    => __('Definir Ícone', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_icon',
                'type'     => 'radio',
                'options'  => array(
                    'transit'  => __('Ícone de Entrega', 'woo-better-shipping-calculator-for-brazil'),
                    'bill'     => __('Ícone de Conta', 'woo-better-shipping-calculator-for-brazil'),
                    'truck'    => __('Ícone de Caminhão', 'woo-better-shipping-calculator-for-brazil'),
                    'postcode' => __('Ícone de Postcode', 'woo-better-shipping-calculator-for-brazil'),
                    'zipcode'  => __('Ícone de Zipcode', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'default'  => 'transit',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Escolha um ícone para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Selecione um ícone para exibir no campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Ícone do input de CEP.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_icon_color' => array(
                'title'    => __('Cor do Ícone', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_icon_color',
                'type'     => 'select',
                'options'  => array(
                    'black-icon'    => __('Preto', 'woo-better-shipping-calculator-for-brazil'),
                    'gray-icon' => __('Cinza', 'woo-better-shipping-calculator-for-brazil'),
                    'red-icon' => __('Vermelho', 'woo-better-shipping-calculator-for-brazil'),
                    'pink-icon' => __('Rosa', 'woo-better-shipping-calculator-for-brazil'),
                    'green-icon' => __('Verde', 'woo-better-shipping-calculator-for-brazil'),
                    'blue-icon' => __('Azul', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'default'  => 'blue-icon',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor do ícone.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor para o ícone.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Escolha a cor no qual será utilizada para definir a cor do icone do input.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_position' => array(
                'title'    => __('Posição do Campo', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_input_position',
                'type'     => 'select',
                'options'  => array(
                    'top'    => __('Topo', 'woo-better-shipping-calculator-for-brazil'),
                    'middle' => __('Meio', 'woo-better-shipping-calculator-for-brazil'),
                    'bottom' => __('Base', 'woo-better-shipping-calculator-for-brazil'),
                    'custom' => __('Personalizado', 'woo-better-shipping-calculator-for-brazil')
                ),
                'default'  => 'top',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a posição do campo na página.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha se o campo será exibido no topo, meio ou na base do componente.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Posição do Campo.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_custom_position' => array(
                'title'    => __('Posição personalizada', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_custom_position',
                'type'     => 'text',
                'default'  => '',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Personalize a posição de exibição do CEP.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a classe(.class) ou id(#id) do componente para inseri-lo em um local personalizado.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Definia um local personalizado de sua escolha.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_custom_quantity' => array(
                'title'    => __('Classes de controle do carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_custom_quantity',
                'type'     => 'text',
                'default'  => '',
                'custom_attributes' => array(
                    'data-subtitle' => __('Classe de input de quantidade personalizada', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Defina uma classe ou deixe o campo vazio caso queira a classe padrão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a classe(.class) ou id(#id) do componente para localizar o input de quantidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Caso o input de quantidade do carrinho não esteja sendo atualizado de forma dinâmica, insira uma classe personalizada.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_input_custom_remove' => array(
                'title'    => __('Classe do botão de remoção de produto personalizada', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cart_custom_remove',
                'type'     => 'text',
                'default'  => '',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina uma classe ou deixe o campo vazio caso queira a classe padrão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a classe(.class) ou id(#id) do componente para localizar o botão de remoção.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Caso o botão de remoção de produto do carrinho não esteja sendo atualizado de forma dinâmica, insira uma classe personalizada.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cart_page_settings_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_cart_page_settings'
            ),

            // TAB 5: Configurações do Produto
            'product_page_settings' => array(
                'title' => __('Produto', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_product_page_settings'
            ),
            'enable_product_page' => array(
                'title'    => __('Habilitar na página de produto', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_enable_product_page',
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Habilite esta opção para exibir o campo na página de produto.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Exibe o campo de personalização na página de produto.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Habilitar na página de produto.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            // Configuração para exibir o estilo atual do input na página de produto
            'product_postcode_current_style' => array(
                'title'    => __('Estilo Atual (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'type'     => 'text',
                'id'       => 'woo_better_calc_product_postcode_current_style',
                'default'  => '',
                'custom_attributes' => array(
                    'readonly' => 'readonly',
                    'data-desc-tip' => __('Exibe o estilo atual aplicado ao campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Este campo é apenas informativo e exibe o estilo atual.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Estilo Atual (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            // Input style block
            'product_input_background_color_field' => array(
                'title'    => __('Personalizar Campo de Entrada', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_background_color_field',
                'type'     => 'text',
                'default'  => '#ffffff',
                'custom_attributes' => array(
                    'data-subtitle' => __('Cor de fundo (Input)', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Adicione sua identidade visual aos campos.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor de fundo para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor de Fundo (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_color_field' => array(
                'title'    => __('Cor do texto (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_color_field',
                'type'     => 'text',
                'default'  => '#2C3338',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor de texto do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor do texto para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('A cor do texto é aplicada apenas no momento em que o input é digitado, onde a cor não se aplica ao placeholder do componente.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_border_width' => array(
                'title'    => __('Largura da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_border_width',
                'type'     => 'text',
                'default'  => '1px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a largura da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a largura da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Largura da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_border_style' => array(
                'title'    => __('Estilo da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_border_style',
                'type'     => 'select',
                'default'  => 'solid',
                'options'  => array(
                    'none'   => __('Nenhuma', 'woo-better-shipping-calculator-for-brazil'),
                    'solid'  => __('Sólida', 'woo-better-shipping-calculator-for-brazil'),
                    'dashed' => __('Tracejada', 'woo-better-shipping-calculator-for-brazil'),
                    'dotted' => __('Pontilhada', 'woo-better-shipping-calculator-for-brazil'),
                    'double' => __('Dupla', 'woo-better-shipping-calculator-for-brazil'),
                    'groove' => __('Sulcada', 'woo-better-shipping-calculator-for-brazil'),
                    'ridge'  => __('Crestada', 'woo-better-shipping-calculator-for-brazil'),
                    'inset'  => __('Inserida', 'woo-better-shipping-calculator-for-brazil'),
                    'outset' => __('Sobressalente', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o estilo da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha o estilo da borda (ex: sólida, tracejada, etc.).', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Estilo da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_border_color_field' => array(
                'title'    => __('Cor da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_border_color_field',
                'type'     => 'color',
                'default'  => '#ccc',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor da borda para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_border_radius' => array(
                'title'    => __('Raio da Borda (Input)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_border_radius',
                'type'     => 'text',
                'default'  => '4px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o raio da borda do campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o raio da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Raio da Borda (Input).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            // Button style block
            'product_button_background_color_field' => array(
                'title'    => __('Personalizar Botão Consultar', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_button_background_color_field',
                'type'     => 'color',
                'default'  => '#0073aa',
                'custom_attributes' => array(
                    'data-subtitle' => __('Cor de fundo (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Adicione sua identidade visual aos campos.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor de fundo para o botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor de Fundo (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_button_color_field' => array(
                'title'    => __('Cor do texto (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_button_color_field',
                'type'     => 'color',
                'default'  => '#ffffff',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor de texto do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor do texto para o botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor de Texto (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_button_border_width' => array(
                'title'    => __('Largura da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_button_border_width',
                'type'     => 'text',
                'default'  => '1px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a largura da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a largura da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Largura da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_button_border_style' => array(
                'title'    => __('Estilo da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_button_border_style',
                'type'     => 'select',
                'default'  => 'none',
                'options'  => array(
                    'none'   => __('Nenhuma', 'woo-better-shipping-calculator-for-brazil'),
                    'solid'  => __('Sólida', 'woo-better-shipping-calculator-for-brazil'),
                    'dashed' => __('Tracejada', 'woo-better-shipping-calculator-for-brazil'),
                    'dotted' => __('Pontilhada', 'woo-better-shipping-calculator-for-brazil'),
                    'double' => __('Dupla', 'woo-better-shipping-calculator-for-brazil'),
                    'groove' => __('Sulcada', 'woo-better-shipping-calculator-for-brazil'),
                    'ridge'  => __('Crestada', 'woo-better-shipping-calculator-for-brazil'),
                    'inset'  => __('Inserida', 'woo-better-shipping-calculator-for-brazil'),
                    'outset' => __('Sobressalente', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o estilo da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o estilo da borda (ex: sólido, tracejado, etc.).', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Estilo da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_button_border_color_field' => array(
                'title'    => __('Cor da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_button_border_color_field',
                'type'     => 'color',
                'default'  => '#0073aa',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor da borda para o botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Cor da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_button_border_radius' => array(
                'title'    => __('Raio da Borda (Botão)', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_button_border_radius',
                'type'     => 'text',
                'default'  => '4px',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina o raio da borda do botão.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o raio da borda em pixels(recomendado) ou outra unidade.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Raio da Borda (Botão).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            // Extra style block para Produto
            'product_input_placeholder' => array(
                'title'    => __('Configurações Extras', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_placeholder',
                'type'     => 'text',
                'default'  => 'Insira seu CEP',
                'custom_attributes' => array(
                    'data-subtitle' => __('Placeholder', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Adicione sua identidade visual aos campos.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o texto que será exibido como placeholder.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Placeholder.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_icon' => array(
                'title'    => __('Definir Ícone', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_icon',
                'type'     => 'radio',
                'options'  => array(
                    'transit'  => __('Ícone de Entrega', 'woo-better-shipping-calculator-for-brazil'),
                    'bill'     => __('Ícone de Conta', 'woo-better-shipping-calculator-for-brazil'),
                    'truck'    => __('Ícone de Caminhão', 'woo-better-shipping-calculator-for-brazil'),
                    'postcode' => __('Ícone de Postcode', 'woo-better-shipping-calculator-for-brazil'),
                    'zipcode'  => __('Ícone de Zipcode', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'default'  => 'transit',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Escolha um ícone para o campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Selecione um ícone para exibir no campo de entrada.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Ícone do input de CEP.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_icon_color' => array(
                'title'    => __('Cor do Ícone', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_icon_color',
                'type'     => 'select',
                'options'  => array(
                    'black-icon' => __('Preto', 'woo-better-shipping-calculator-for-brazil'),
                    'gray-icon'  => __('Cinza', 'woo-better-shipping-calculator-for-brazil'),
                    'red-icon'   => __('Vermelho', 'woo-better-shipping-calculator-for-brazil'),
                    'pink-icon'  => __('Rosa', 'woo-better-shipping-calculator-for-brazil'),
                    'green-icon' => __('Verde', 'woo-better-shipping-calculator-for-brazil'),
                    'blue-icon'  => __('Azul', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'default'  => 'blue-icon',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a cor do ícone.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a cor para o ícone.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Escolha a cor no qual será utilizada para definir a cor do ícone do input.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_input_position' => array(
                'title'    => __('Posição do Campo', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_input_position',
                'type'     => 'select',
                'options'  => array(
                    'top'    => __('Topo', 'woo-better-shipping-calculator-for-brazil'),
                    'middle' => __('Meio', 'woo-better-shipping-calculator-for-brazil'),
                    'bottom' => __('Base', 'woo-better-shipping-calculator-for-brazil'),
                    'custom' => __('Personalizado', 'woo-better-shipping-calculator-for-brazil')
                ),
                'default'  => 'top',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina a posição do campo na página.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha se o campo será exibido no topo, meio ou na base do componente.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Posição do Campo.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            
            'product_input_custom_position' => array(
                'title'    => __('Posição personalizada', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_product_custom_position',
                'type'     => 'text',
                'default'  => '',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Personalize a posição de exibição do CEP.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira a classe(.class) ou id(#id) do componente para inseri-lo em um local personalizado.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Definia um local personalizado de sua escolha.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'product_page_settings_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_product_page_settings'
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
