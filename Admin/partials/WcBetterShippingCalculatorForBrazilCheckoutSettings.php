<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials;

if (!defined('ABSPATH')) {
    exit;
}

class WcBetterShippingCalculatorForBrazilCheckoutSettings extends \WC_Settings_Page
{

    public function __construct()
    {
        $this->id    = 'wc-better-calc-checkout';
        $this->label = __('Campos Brasileiros', 'woo-better-shipping-calculator-for-brazil');
        parent::__construct();
    }

    public function get_settings()
    {
            $checkoutSettings = array(
                // TAB 5: Configurações de Checkout
                'checkout_settings' => array(
                    'title' => __('Checkout', 'woo-better-shipping-calculator-for-brazil'),
                    'type'  => 'title',
                    'id'    => 'woo_better_calc_title_checkout'
                ),
                'cep_field_position' => array(
                    'title'    => __('Destaque do Campo CEP', 'woo-better-shipping-calculator-for-brazil'),
                    'desc_tip' => false,
                    'id'       => 'woo_better_calc_cep_field_position',
                    'default'  => 'yes',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Defina as configurações de exibição e funcionalidade para o campo de CEP (Checkout).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Ao habilitar, o campo CEP será exibido no topo do formulário de checkout, posicionado imediatamente após o campo de País.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Escolha se o campo de CEP deve ser destacado no checkout.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_auto_address_fill' => array(
                    'title'    => __('Preenchimento automático por CEP', 'woo-better-shipping-calculator-for-brazil'),
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
                'person_type_select' => array(
                    'title'    => __('Tipo de Cliente', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_person_type_select',
                    'desc_tip' => false,
                    'default'  => 'none',
                    'type'     => 'select',
                    'options'  => array(
                        'none'     => __('Nenhum', 'woo-better-shipping-calculator-for-brazil'),
                        'both'     => __('Pessoa Física e Pessoa Jurídica', 'woo-better-shipping-calculator-for-brazil'),
                        'physical' => __('Pessoa Física apenas', 'woo-better-shipping-calculator-for-brazil'),
                        'legal'    => __('Pessoa Jurídica apenas', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Configure a validação de tipo de cliente no checkout. A opção "Nenhum" desativa a validação.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Selecione "Nenhum" para desativar a validação, ou escolha entre Pessoa Física (CPF), Pessoa Jurídica (CNPJ) ou ambos. Os campos CPF/CNPJ aparecem exclusivamente no endereço de cobrança.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Configure a validação de documentos no checkout. Importante: se o formulário não estiver priorizando o endereço de cobrança, ative "Forçar entrega para o endereço de cobrança" nas Configurações de Entrega do WooCommerce.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'company_field_behavior' => array(
                    'title'    => __('Comportamento do Campo Empresa', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_company_field_behavior',
                    'desc_tip' => false,
                    'default'  => $this->get_default_company_field_behavior(),
                    'type'     => 'select',
                    'options'  => array(
                        'dynamic'   => __('Dinâmico (Recomendado)', 'woo-better-shipping-calculator-for-brazil'),
                        'optional'  => __('Opcional', 'woo-better-shipping-calculator-for-brazil'),
                        'required'  => __('Obrigatório', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define como o campo Empresa será tratado no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Dinâmico: O campo Empresa será exibido apenas quando o usuário digitar um CNPJ válido e o "Tipo de Cliente" estiver configurado como "Pessoa Física e Pessoa Jurídica" ou "Pessoa Jurídica apenas".', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Controla a exibição e obrigatoriedade do campo Empresa no checkout.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'apply_cpf_mask' => array(
                    'title'    => __('Aplicar Máscara no CPF', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_apply_cpf_mask',
                    'desc_tip' => false,
                    'default'  => 'yes',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define se o CPF será salvo com máscara (###.###.###-##) ou apenas números.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para salvar o CPF com formatação (pontos e hífen) ou desabilite para salvar apenas os números.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Controla a formatação do CPF ao salvar os dados do cliente.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'apply_cnpj_mask' => array(
                    'title'    => __('Aplicar Máscara no CNPJ', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_apply_cnpj_mask',
                    'desc_tip' => false,
                    'default'  => 'yes',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define se o CNPJ será salvo com máscara (##.###.###/####-##) ou apenas números.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para salvar o CNPJ com formatação (pontos, barra e hífen) ou desabilite para salvar apenas os números.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Controla a formatação do CNPJ ao salvar os dados do cliente.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_neighborhood_field' => array(
                    'title'    => __('Campo de Bairro', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_neighborhood_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Adiciona um campo obrigatório de Bairro no formulário de endereço do checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para adicionar o campo "Bairro" tanto nos endereços de cobrança quanto de entrega.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Adiciona o campo de Bairro, posicionado após o endereço principal.', 'woo-better-shipping-calculator-for-brazil')
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
                'apply_phone_mask' => array(
                    'title'    => __('Telefone com Máscara e DDI', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_apply_phone_mask',
                    'desc_tip' => false,
                    'default'  => get_option('woo_better_calc_contact_required', 'no'),
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-subtitle' => __('Aplicar Máscara + Captura de DDI', 'woo-better-shipping-calculator-for-brazil'),
                        'data-desc-tip' => __('Ativa a formatação do telefone e adiciona o recurso de captura do Código de País (DDI).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para aplicar máscara de formatação no campo de telefone e incluir o código de país (DDI) ou desabilite para manter o comportamento padrão.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('No checkout, o campo de telefone receberá formatação e passará a incluir o código de país (DDI).', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'contact_required' => array(
                    'title'    => __('Telefone (Contato) Obrigatório', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_contact_required',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define a obrigatoriedade do campo de Telefone no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Se habilitado, o campo de telefone será de preenchimento obrigatório para que o cliente possa finalizar o pedido.', 'woo-better-shipping-calculator-for-brazil'),  
                        'data-title-description' => __('No checkout, o campo de telefone torna-se obrigatório.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'contact_field_position' => array(
                    'title'    => __('Destaque do Campo Telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_contact_field_position',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Defina as configurações de exibição e funcionalidade para o campo de Telefone (Checkout).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Ao habilitar, o campo Telefone será exibido no topo do formulário de checkout, posicionado imediatamente após o campo de País.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Escolha se o campo de Telefone deve ser destacado no checkout.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_birthdate_field' => array(
                    'title'    => __('Campo de Data de Nascimento', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_birthdate_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Adiciona um campo de Data de Nascimento no formulário de checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para adicionar o campo "Data de Nascimento" no endereço de cobrança do checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Adiciona o campo de Data de Nascimento para coleta de informações adicionais do cliente.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_gender_field' => array(
                    'title'    => __('Campo de Gênero', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_gender_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Adiciona um campo de Gênero no formulário de checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para adicionar o campo "Gênero" (opcional) no endereço de cobrança do checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Adiciona o campo de Gênero para coleta de informações demográficas do cliente.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'checkout_settings_end' => array(
                    'type' => 'sectionend',
                    'id'   => 'woo_better_calc_checkout_settings'
                )
            );

            return apply_filters('woocommerce_get_settings_' . $this->id, $checkoutSettings);
        }

        public function output()
        {
            \WC_Admin_Settings::output_fields($this->get_settings());
        }

        public function save()
        {
            $settings = $this->get_settings();
            \WC_Admin_Settings::save_fields($settings);
        }

        protected function get_default_company_field_behavior()
        {
            return 'dynamic';
        }
    }