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
                'title'    => __('Opções de Frete e Entrega', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_disabled_shipping',
                'default'  => 'default',
                'desc_tip' => false,
                'type'     => 'select',
                'options'  => array(
                    'all'     => __('Desabilitar Frete e Endereço para Todos', 'woo-better-shipping-calculator-for-brazil'),
                    'digital' => __('Desabilitar Frete e Endereço Apenas para Produtos Digitais', 'woo-better-shipping-calculator-for-brazil'),
                    'default' => __('Manter Padrão do WooCommerce', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-desc-tip' => __('Configure como o endereço de entrega e os métodos de frete serão apresentados no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Entrega dinâmica será mantida conforme o padrão do Woocommerce.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Gerencie as opções de endereço e cálculo de frete.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'enable_min_free_shipping' => array(
                'title'    => __('Opções de Frete Grátis', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_enable_min_free_shipping',
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Habilitar Mínimo para Frete Grátis', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Permite definir um valor mínimo para ativar o frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite esta opção para configurar um valor mínimo para frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Configure aqui as regras para o frete grátis.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'min_free_shipping_value' => array(
                'title'    => __('Valor Mínimo', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_min_free_shipping_value',
                'desc_tip' => false,
                'default'  => '',
                'type'     => 'number',
                'custom_attributes' => array(
                    'min' => 0,
                    'step' => '0.01',
                    'data-desc-tip' => __('Defina o valor mínimo necessário para ativar o frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Insira o valor mínimo do carrinho para que o frete grátis seja ativado.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Ex: 200,00', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'min_free_shipping_message' => array(
                'title'    => __('Mensagens para o Frete Grátis', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_min_free_shipping_message',
                'desc_tip' => false,
                'default'  => 'Falta(m) apenas mais {value} para obter FRETE GRÁTIS',
                'type'     => 'text',
                'custom_attributes' => array(
                    'data-subtitle' => __('Mensagem de Frete Mínimo', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Defina as mensagens de feedback na barra de progresso.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Use {value} como marcador para o valor restante. Ex: "Falta(m) apenas mais {value} para obter FRETE GRÁTIS"', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Mensagem exibida quando o valor do carrinho ainda não atingiu o mínimo para frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'pattern' => '.*\{value\}.*'
                )
            ),
            'min_free_shipping_success_message' => array(
                'title'    => __('Mensagem de Frete Grátis Ativado', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_min_free_shipping_success_message',
                'desc_tip' => false,
                'default'  => 'Parabéns! Você tem frete grátis!',
                'type'     => 'text',
                'custom_attributes' => array(
                    'data-desc-tip' => __('Mensagem exibida quando o valor do carrinho atingiu o mínimo para frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Mensagem de parabéns exibida quando o cliente se qualifica para frete grátis.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Esta mensagem será exibida quando o frete grátis estiver ativo.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'font_source' => array(
                'title'    => __('Fonte para Busca de CEP', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_font_source',
                'default'  => 'yes',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Fonte Poppins (recomendada)', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Fonte do Site', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Fonte Padrão', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Selecione a fonte a ser aplicada no campo de busca do CEP (Código de Endereçamento Postal).', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Escolha a fonte que melhor se adapta ao design da sua página.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Configura a fonte para o componente de busca de CEP.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'enable_settings_link' => array(
                'title'    => __('Link Rápido de Configuração', 'woo-better-shipping-calculator-for-brazil'),
                'desc_tip' => false,
                'id'       => 'woo_better_calc_enable_settings_link',
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Exibir Link de Configuração', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Exibe um atalho para as configurações do plugin nas páginas de Carrinho e de Produto quando o utilizador for um administrador.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite esta opção para exibir o link de configuração nas páginas frontend (visíveis ao público) para os utilizadores administradores.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Exibir o link de configuração somente para utilizadores administradores.', 'woo-better-shipping-calculator-for-brazil')
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
                'desc'  => __('<p><strong>Carrinho:</strong><br><code class="woo-better-shortcode">[woocommerce_cart]</code></p>
                    <p style="padding: 10px 0;"> </p>
                    <p><strong>Finalização de compra:</strong><br><code class="woo-better-shortcode">[woocommerce_checkout]</code></p>
                    <p style="padding: 10px 0;"> </p>
                    <p><strong>Uso e Integração com Temas Clássicos</strong><br>Esta opção é recomendada para temas que não utilizam o editor de blocos (Gutenberg). Se o seu tema for baseado em blocos, utilize as configurações nativas do plugin para uma melhor experiência.</p>
                    <p style="padding: 10px 0;"> </p>
                    <p><span><strong>Atenção:</strong> Ao usar shortcodes, apenas as configurações da aba Geral e Checkout serão aplicadas.</span></p>', 
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
                'title'    => __('Cálculo de Frete na Página do Produto', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_enable_product_page',
                'default'  => 'yes',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Exibir Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Habilite esta opção para exibir o campo da calculadora de frete diretamente na página do produto.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Exibe o campo de cálculo de frete (CEP) na página de produto.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Ativa o campo de cálculo de frete na página individual do produto.', 'woo-better-shipping-calculator-for-brazil')
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
                'title'    => __('Cálculo de Frete na Página de Carrinho', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_enable_cart_page',
                'default'  => 'yes',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Exibir Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Habilite esta opção para exibir o campo da calculadora de frete na página do carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Exibe o campo de cálculo de frete (CEP) na página do carrinho.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Ativa a exibição da calculadora de frete na página do carrinho.', 'woo-better-shipping-calculator-for-brazil')
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
                'title'    => __('Configurações do Campo CEP', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_cep_field_position',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Destaque do Campo CEP', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Defina as configurações de exibição e funcionalidade para o campo de CEP (Checkout).', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Ao habilitar, o campo CEP será exibido no topo do formulário de checkout, posicionado imediatamente após o campo de País.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Escolha se o campo de CEP deve ser destacado no checkout.', 'woo-better-shipping-calculator-for-brazil')
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
                    'data-description' => __('Com esta opção ativada, uma sugestão de endereço aparecerá, e o utilizador poderá optar por usá-la para preencher os campos do checkout automaticamente.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Habilite o preenchimento automático do endereço via CEP no checkout.', 'woo-better-shipping-calculator-for-brazil')
                )
            ),

            'number_required' => array(
                'title'    => __('Campo de Número do Endereço', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_number_required',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Adicionar Campo de Número (Obrigatório)', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Adiciona um campo de Número de preenchimento obrigatório ao formulário de endereço no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Habilite para adicionar um campo de "Número" ao endereço. Inclui checkbox para endereços "Sem Número" e torna o campo obrigatório no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('Adiciona o campo de Número, posicionado logo após o campo principal do endereço (Rua).', 'woo-better-shipping-calculator-for-brazil')
                )
            ),
            'contact_required' => array(
                'title'    => __('Telefone (Contato) Obrigatório com DDI', 'woo-better-shipping-calculator-for-brazil'),
                'id'       => 'woo_better_calc_contact_required',
                'desc_tip' => false,
                'default'  => 'no',
                'type'     => 'radio',
                'options'  => array(
                    'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                    'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                ),
                'custom_attributes' => array(
                    'data-subtitle' => __('Tornar Telefone Obrigatório + Captura de DDI', 'woo-better-shipping-calculator-for-brazil'),
                    'data-desc-tip' => __('Define a obrigatoriedade do campo de Telefone, adicionando também o recurso de captura do Código de País (DDI).', 'woo-better-shipping-calculator-for-brazil'),
                    'data-description' => __('Se habilitado, o campo de telefone será de preenchimento obrigatório para que o cliente possa finalizar o pedido.', 'woo-better-shipping-calculator-for-brazil'),
                    'data-title-description' => __('No checkout, o campo de telefone torna-se obrigatório e passa a incluir o código de país (DDI).', 'woo-better-shipping-calculator-for-brazil')
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



        $settings = array_merge($settings, $generalSettings, $shortcodeSettings, $productSettings, $cartSettings, $checkoutSetting, $cacheSettings);

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

        if ($disable_shipping === 'all') {
            $_POST['woo_better_calc_number_required'] = 'no';
        } elseif ($disable_shipping === 'digital') {
            $_POST['woo_better_calc_disabled_shipping'] = 'digital';
        } else {
            $_POST['woo_better_calc_disabled_shipping'] = 'default';
        }

        \WC_Admin_Settings::save_fields($settings);
    }
}
