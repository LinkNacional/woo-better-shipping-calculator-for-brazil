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
        $settings = array();
        $generalSettings = array(
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
            'font_source' => array(
                'title'    => __('Fonte Utilizada', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_font_source',
                'default'  => 'yes',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Fonte Poppins (recomendada)', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Fonte do Site', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Exibe um link para as configurações nas páginas de carrinho e produto quando o usuário for administrador.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a fonte que se adeque melhor à sua página.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Fonte padrão no componente de CEP', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'enable_settings_link' => array(
                'title'    => __('Link de configuração', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_enable_settings_link',
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Exibe um link para as configurações nas páginas de carrinho e produto quando o usuário for administrador.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite esta opção para mostrar um link de configuração nas páginas frontend para usuários administradores.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Link de configuração para administradores.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'geral_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_geral'
            )
        );

        $shortcodeSettings = array(
            // TAB 2: Shortcodes
            'shortcodes_section' => array(
                'title' => __('Shortcodes', 'woo-better-shipping-calculator-for-brazil'),
                'desc'  => __(
                    '<p><strong>Carrinho:</strong><br><code class="woo-better-shortcode">[woocommerce_cart]</code></p>' .
                    '<p><strong>Finalização de compra:</strong><br><code class="woo-better-shortcode">[woocommerce_checkout]</code></p>' .
                    '<p>&nbsp;</p>' . // Espaço extra
                    '<p><strong>Integração com Temas Clássicos via Shortcode</strong><br>Esta opção é recomendada para temas que não utilizam o editor de blocos (Gutenberg). Se você usa um tema de blocos, opte pelas configurações nativas para uma melhor experiência.</p>' .
                    '<p>&nbsp;</p>' . // Espaço extra
                    '<p><span><strong>Atenção:</strong> Ao usar shortcodes, apenas as configurações da aba Geral e Checkout serão aplicadas.</span></p>',
                    'woo-better-shipping-calculator-for-brazil'
                ),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_shortcodes',
            ),
            'shortcodes_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_shortcodes'
            )
        );

        $productSettings = array(
            // TAB 3: Configurações do Produto
            'product_page_settings' => array(
                'title' => __('Produto', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_product_page_settings'
            ),
            'enable_product_page' => array(
                'title'    => __('Habilitar na página de produto', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_enable_product_page',
                'default'  => 'yes',
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

            'product_page_settings_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_product_page_settings'
            ),
        );

        $cartSettings = array(
            // TAB 4: Configurações do Carrinho
            'cart_page_settings' => array(
                'title' => __('Carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_cart_page_settings'
            ),

            'enable_cart_page' => array(
                'title'    => __('Habilitar na página de carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_enable_cart_page',
                'default'  => 'yes',
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
            )
        );

        $checkoutSetting = array(
            // TAB 5: Checkout
            'checkout_section' => array(
                'title' => __('Checkout', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_checkout'
            ),
            'cep_field_position' => array(
                'title'    => __('Campo CEP', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cep_field_position',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Posição do campo CEP', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Defina os ajustes para configurar o seu campo de CEP.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Com esta opção habilitada, o campo CEP será exibido no topo do formulário de checkout, facilitando o preenchimento.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Destaque do campo CEP no checkout.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'enable_auto_address_fill' => array(
                'title'    => __('Preenchimento automatico por CEP', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_enable_auto_address_fill',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Permitir que o usuário preencha o endereço automaticamente ao digitar o CEP no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Com esta opção habilitada, o endereço será preenchido automaticamente após o usuário inserir o CEP no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Preenchimento de endereço automático por CEP no checkout.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'number_required' => array(
                'title'    => __('Campo de número adicional', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_number_required',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Adicionar no checkout um campo adicional para o número do endereço.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Implementar a adição de um campo para o "Número" do endereço, posicionado imediatamente após o campo principal do endereço na página de checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('No checkout adicione uma campo após o endereço denominado número', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'contact_required' => array(
                'title'    => __('Campo de contato obrigatório', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_contact_required',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Defina se o campo de contato será obrigatório.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Se habilitado, o campo de contato será obrigatório para finalizar o pedido.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('No checkout, o campo de contato será obrigatório, permitindo adição de novas informações de contato.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'checkout_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_checkout'
            )
        );

        $cacheSettings = array(
            // TAB 6: Cache
            'cache_section' => array(
                'title' => __('Cache', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_cache'
            ),
            'enable_auto_postcode_search' => array(
                'title'    => __('Consulta automática de CEP', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_enable_auto_postcode_search',
                'default'  => 'yes',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Calcula fretes automaticamente sem necessidade de clicar em "Calcular", melhorando a experiência do usuário.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite para realizar consultas de frete automaticamente nas páginas de produto e carrinho, assim que um CEP válido for detectado ou informado.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Disponível apenas no WooCommerce 10.0 ou superior. Essa funcionalidade requer uma versão compatível do WooCommerce para funcionar corretamente.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cache_expiration_time' => array(
                'title'    => __('Tempo de expiração do cache', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_cache_expiration_time',
                'default'  => '0',
                'type'     => 'select',
                'options'  => array(
                    '0'       => __('Não Expirar', 'woo-better-shipping-calculator-for-brazil'),
                    '10'      => __('10 minutos', 'woo-better-shipping-calculator-for-brazil'),
                    '30'      => __('30 minutos', 'woo-better-shipping-calculator-for-brazil'),
                    '60'      => __('1 hora', 'woo-better-shipping-calculator-for-brazil'),
                    '120'     => __('2 horas', 'woo-better-shipping-calculator-for-brazil'),
                    '300'     => __('5 horas', 'woo-better-shipping-calculator-for-brazil'),
                    '720'     => __('12 horas', 'woo-better-shipping-calculator-for-brazil'),
                    '1440'    => __('1 dia', 'woo-better-shipping-calculator-for-brazil'),
                    '2880'    => __('2 dias', 'woo-better-shipping-calculator-for-brazil'),
                    '10080'   => __('1 semana', 'woo-better-shipping-calculator-for-brazil'),
                    '20160'   => __('2 semanas', 'woo-better-shipping-calculator-for-brazil'),
                    '43200'   => __('1 mês', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Define o tempo de armazenamento do cache de CEP. Cache mais longo melhora performance, mas pode exibir dados desatualizados.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha o período de validade do cache de consultas de CEP. O padrão é não expirar.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Tempo de expiração do cache de consultas de CEP.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'enable_auto_cache_reset' => array(
                'title'    => __('Reset automático de cache', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_enable_auto_cache_reset',
                'default'  => 'WCBCB_9X2K4M7P5R8T3N6Y1Q',
                'type'     => 'text',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Token de segurança para limpeza do cache. Use o botão "Limpar Cache" para remover todas as consultas armazenadas e forçar o recálculo de frete.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Ao clicar em "Limpar Cache", todas as consultas armazenadas serão removidas. Como consequência, os visitantes precisarão recalcular o frete ao acessar as páginas de produtos. Recomenda-se usar essa função após ajustes importantes nas configurações de entrega.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Ao atualizar as regras ou valores de frete, o cache antigo pode continuar exibindo informações desatualizadas. Limpar o cache garante que todos os visitantes recebam os novos cálculos corretos.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'cache_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_cache'
            )
        );

        // TAB 7: Configurações Carrinho(versão antiga)
        $oldCartSettings = array(
            'oldCart_section' => array(
                'title' => __('Carrinho (Versão legada | Woo 10-)', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'title',
                'id'    => 'woo_better_calc_title_old_cart'
            ),
            'cep_required' => array(
                'title'    => __('CEP obrigatório no carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_cep_required',
                'default'  => 'no',
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
                'default'  => 'no',
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
            'oldCart_section_end' => array(
                'type' => 'sectionend',
                'id'   => 'woo_better_calc_old_cart'
            )
        );

        $settings = array_merge($settings, $generalSettings, $shortcodeSettings, $productSettings, $cartSettings, $checkoutSetting, $cacheSettings, $oldCartSettings);

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
