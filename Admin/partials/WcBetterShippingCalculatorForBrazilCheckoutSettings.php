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
                    'title'    => __('Sugestão de Endereço por CEP', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_auto_address_fill',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Exibe uma sugestão de endereço ao digitar o CEP. O cliente precisa confirmar clicando no checkbox para que os campos sejam preenchidos.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Com esta opção ativada, ao digitar o CEP no checkout, um checkbox de sugestão aparecerá com o endereço encontrado. O cliente deverá marcar o checkbox para confirmar e preencher os campos automaticamente. Ideal para quem quer dar controle ao cliente antes de sobrescrever os dados já digitados.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Exibe uma sugestão de endereço via CEP que o cliente precisa confirmar clicando em um checkbox.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_silent_address_fill' => array(
                    'title'    => __('Preenchimento Automático Silencioso por CEP', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_silent_address_fill',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Preenche os campos de endereço automaticamente ao digitar o CEP, sem nenhuma confirmação do cliente.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Com esta opção ativada, assim que o CEP for digitado e validado, os campos de endereço (Rua, Bairro, Cidade, Estado) serão preenchidos automaticamente, sem que o cliente precise confirmar nada. Atenção: dados já digitados pelo cliente serão sobrescritos. Não pode ser usado ao mesmo tempo que a opção "Sugestão de Endereço por CEP".', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Preenche o endereço automaticamente ao digitar o CEP, sem confirmação do cliente.', 'woo-better-shipping-calculator-for-brazil')
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
                        'required'  => __('Obrigatório', 'woo-better-shipping-calculator-for-brazil'),
                        'disabled'  => __('Desabilitado', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define como o campo Empresa será tratado no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Dinâmico: O campo Empresa será exibido apenas quando o usuário digitar um CNPJ válido e o "Tipo de Cliente" estiver configurado como "Pessoa Física e Pessoa Jurídica" ou "Pessoa Jurídica apenas". Desabilitado: o campo Empresa deixa de ser gerado no checkout (clássico e blocos) — se outro plugin o reintroduzir, ele fica sempre opcional, nunca obrigatório.', 'woo-better-shipping-calculator-for-brazil'),
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
                'enable_cnpj_api_validation' => array(
                    'title'    => __('Validação de CNPJ na Receita Federal', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_cnpj_api_validation',
                    'desc_tip' => false,
                    'default'  => 'yes',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Após validar o dígito verificador, consulta a Receita Federal (BrasilAPI, com fallback para ReceitaWS) para confirmar que o CNPJ existe e que a situação cadastral está ativa.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Adiciona uma camada extra de validação: além do cálculo do dígito verificador, o plugin consulta a base da Receita Federal para garantir que o CNPJ é real e que a situação cadastral está ativa. Aplica-se a CNPJs numéricos e alfanuméricos.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Confirma na Receita Federal se o CNPJ informado realmente existe e está com situação cadastral ativa.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_ie_field' => array(
                    'title'    => __('Campo de Inscrição Estadual (IE)', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_ie_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Adiciona o campo de Inscrição Estadual (IE) no checkout para Pessoa Jurídica.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para exibir o campo "Inscrição Estadual (IE)" no endereço de cobrança do checkout, visível somente quando o cliente selecionar Pessoa Jurídica (CNPJ). Inclui opção "Isento". Requer que o campo "Tipo de Cliente" esteja configurado como "Pessoa Jurídica" ou "Pessoa Física e Pessoa Jurídica".', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Adiciona o campo de IE (Inscrição Estadual) ao checkout, exclusivo para Pessoas Jurídicas. Fundamental para emissão de Nota Fiscal eletrônica (NF-e).', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_im_field' => array(
                    'title'    => __('Campo de Inscrição Municipal (IM)', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_im_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Adiciona o campo de Inscrição Municipal (IM) no checkout para Pessoa Jurídica.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para exibir o campo "Inscrição Municipal (IM)" no endereço de cobrança do checkout, visível somente quando o cliente selecionar Pessoa Jurídica (CNPJ). Campo obrigatório para Pessoa Jurídica. Requer que o campo "Tipo de Cliente" esteja configurado como "Pessoa Jurídica" ou "Pessoa Física e Pessoa Jurídica".', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Adiciona o campo de Inscrição Municipal (IM) ao checkout, exclusivo para Pessoas Jurídicas. Complementa o IE para emissão de NF-e/NFS-e. A IM não possui padrão nacional de validação (regra municipal).', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_rg_field' => array(
                    'title'    => __('Campo de RG', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_rg_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Adiciona o campo de RG no checkout para Pessoa Física.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Habilite para exibir o campo "RG" no endereço de cobrança do checkout. Ele aparece junto com o CPF, quando o cliente é Pessoa Física, e fica oculto para CNPJ (Pessoa Jurídica). Quem usa aplicativo de Nota Fiscal encontra o RG já preenchido. Requer que o campo "Tipo de Cliente" esteja configurado como "Pessoa Física" ou "Pessoa Física e Pessoa Jurídica".', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Adiciona o campo de RG (Registro Geral) ao checkout, exclusivo para Pessoas Físicas. Ajuda a conferir a identidade do cliente e a emitir nota fiscal.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                // Campo FILHO do "Campo de RG": a chave `join` guarda o id do PAI.
                // Nesta tela (layout antigo, sem o template de abas/cards) quem
                // aplica a dependência é a lista `joinPairs` em
                // Admin/js/WcBetterShippingCalculatorForBrazilAdminSettings.js.
                'rg_required' => array(
                    'title'    => __('Obrigatoriedade do Campo de RG', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_rg_required',
                    'join'     => 'woo_better_calc_enable_rg_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define se o campo de RG é obrigatório ou opcional quando visível.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Escolha "Habilitar" para exigir o preenchimento do RG sempre que o campo estiver visível (Pessoa Física com CPF) ou "Desabilitar" para deixar a critério do cliente.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Controla a obrigatoriedade do campo de RG quando ele está habilitado. Cada estado tem uma regra própria de RG, por isso o campo não é validado.', 'woo-better-shipping-calculator-for-brazil')
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
                // FILHO do "Campo de Número do Endereço" (join visual em
                // `targetComponentCartNames` e de comportamento em `joinPairs`, em
                // Admin/js): sem o campo de número não há checkbox para ocultar.
                'hide_number_sn_checkbox' => array(
                    'title'    => __('Ocultar Checkbox "S/N"', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_number_hide_sn_checkbox',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-subtitle' => __('Remover o checkbox "S/N" do campo de Número', 'woo-better-shipping-calculator-for-brazil'),
                        'data-desc-tip' => __('Remove o atalho "S/N" (Sem Número) que fica dentro do campo de Número.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Quando habilitada, o checkbox "S/N" NÃO é exibido no campo de Número — nem no checkout em blocos, nem no checkout clássico/shortcode, nem na edição de endereço da conta. O cliente continua podendo digitar "S/N" no próprio campo (o campo não fica travado); sem o checkbox, o endereço sem número passa a ser digitado à mão.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Remove o checkbox "S/N" de dentro do campo de Número.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'phone_mode' => array(
                    'title'    => __('Comportamento do Campo de Telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_phone_mode',
                    'desc_tip' => false,
                    'default'  => 'phone_and_cellphone',
                    'type'     => 'select',
                    'options'  => array(
                        'disabled_native'     => __('Desabilitar o campo de telefone', 'woo-better-shipping-calculator-for-brazil'),
                        'disabled'            => __('Deixar a configuração nativa do WooCommerce', 'woo-better-shipping-calculator-for-brazil'),
                        'phone_and_cellphone' => __('Permitir Telefone Celular e Fixo (Recomendado)', 'woo-better-shipping-calculator-for-brazil'),
                        'cellphone_only'      => __('Permitir somente Telefone Celular', 'woo-better-shipping-calculator-for-brazil'),
                        'landline_only'       => __('Permitir somente Telefone Fixo', 'woo-better-shipping-calculator-for-brazil'),
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define como o campo de telefone se comporta no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Define o comportamento do campo de telefone no checkout: "Permitir Telefone Celular e Fixo" exibe o telefone e permite adicionar o campo de Celular; "Permitir somente Telefone Celular" usa apenas o celular; "Permitir somente Telefone Fixo" usa apenas o telefone. As duas opções de desabilitar fazem coisas diferentes: "Desabilitar o campo de telefone" desliga o telefone NATIVO do WooCommerce e nenhum campo de telefone ou celular é exibido; "Deixar a configuração nativa do WooCommerce" não gera campo nenhum e deixa valer o que você configurou no próprio WooCommerce (toggle "Telefone" do editor de blocos).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Controla o comportamento do campo de telefone no checkout.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'enable_cellphone_shim' => array(
                    'title'    => __('Celular Oculto', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_cellphone_shim',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-subtitle' => __('Gerar o campo de Celular oculto', 'woo-better-shipping-calculator-for-brazil'),
                        'data-desc-tip' => __('Gera o campo de celular OCULTO (billing_cellphone/shipping_cellphone) para compatibilidade com gateways (PagBank, Asaas, NFe).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Ao habilitar, o plugin gera um campo de celular OCULTO espelhando o telefone, para plugins que esperam "billing_cellphone"/"shipping_cellphone". Ao desabilitar (padrão), NENHUM campo de celular é gerado — evitando conflitos. Aplica-se apenas ao modo "Permitir Telefone Celular e Fixo" com o "Campo de Celular" desligado.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Gera o campo de celular oculto (compatibilidade com gateways).', 'woo-better-shipping-calculator-for-brazil')
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
                        'data-description' => __('Habilite para aplicar máscara de formatação no campo de telefone e incluir o código de país (DDI). Ao desabilitar, o campo continua com a máscara brasileira (fixo e celular, sem bandeira e sem DDI) e o número é salvo com o código do Brasil (+55).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('No checkout, o campo de telefone receberá formatação e passará a incluir o código de país (DDI).', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'show_phone_country_code' => array(
                    'title'    => __('Exibir Código do País (DDI)', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_show_phone_country_code',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-subtitle' => __('Exibir Código do País (DDI) no Telefone', 'woo-better-shipping-calculator-for-brazil'),
                        'data-desc-tip' => __('Mostra o código do país (DDI) ao lado da bandeira no campo de telefone.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Requer que a opção "Telefone com Máscara e DDI" esteja habilitada. Quando ativada, o campo exibe a bandeira e o código do país (DDI) do país selecionado.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Exibe o código do país (DDI) junto à bandeira no campo de telefone.', 'woo-better-shipping-calculator-for-brazil')
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
                'validate_ddd' => array(
                    'title'    => __('Validar Número de Telefone', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_validate_ddd',
                    'desc_tip' => false,
                    'default'  => 'yes',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-subtitle' => __('Validar o número de telefone no checkout', 'woo-better-shipping-calculator-for-brazil'),
                        'data-desc-tip' => __('Valida se o número de telefone informado é válido (todos os países com a máscara/DDI; apenas Brasil sem ela).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('A validação é aplicada quando o telefone/celular é obrigatório e preenchido. Com a opção "Telefone com Máscara e DDI" habilitada, a validação usa a base internacional de telefonia (vale para todos os países); sem ela, o campo usa a máscara brasileira (fixo/celular) e a validação vale apenas para números do Brasil (DDD válido + 8 dígitos para fixo ou 9 para celular). Quando ativada, o checkout impede o envio caso o número de telefone seja inválido.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Valida o número de telefone no checkout.', 'woo-better-shipping-calculator-for-brazil')
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
                'enable_cellphone_field' => array(
                    'title'    => __('Campo de Celular', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_enable_cellphone_field',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Adiciona um campo de Celular separado no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Adiciona o campo "Celular" logo abaixo do campo de telefone. Requer que o "Comportamento do Campo de Telefone" permita celular. No modo "Permitir somente Telefone Celular" esta opção fica desabilitada (o campo de celular já é o principal).', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Adiciona o campo de Celular (separado do telefone) no checkout.', 'woo-better-shipping-calculator-for-brazil')
                    )
                ),
                'cellphone_required' => array(
                    'title'    => __('Celular Obrigatório', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_cellphone_required',
                    'desc_tip' => false,
                    'default'  => 'no',
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define a obrigatoriedade do campo de Celular no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Quando habilitado, o campo de Celular passa a ser de preenchimento obrigatório.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Torna o campo de Celular obrigatório no checkout.', 'woo-better-shipping-calculator-for-brazil')
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
                'birthdate_required' => array(
                    'title'    => __('Obrigatoriedade da Data de Nascimento', 'woo-better-shipping-calculator-for-brazil'),
                    'id'       => 'woo_better_calc_birthdate_required',
                    'desc_tip' => false,
                    'default'  => get_option('woo_better_calc_enable_birthdate_field', 'no'),
                    'type'     => 'radio',
                    'options'  => array(
                        'yes' => __('Habilitar', 'woo-better-shipping-calculator-for-brazil'),
                        'no'  => __('Desabilitar', 'woo-better-shipping-calculator-for-brazil')
                    ),
                    'custom_attributes' => array(
                        'data-desc-tip' => __('Define se o campo de Data de Nascimento é obrigatório ou opcional no checkout.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-description' => __('Escolha "Habilitar" para exigir o preenchimento ou "Desabilitar" para deixar a critério do cliente.', 'woo-better-shipping-calculator-for-brazil'),
                        'data-title-description' => __('Controla a obrigatoriedade do campo de Data de Nascimento quando ele está habilitado.', 'woo-better-shipping-calculator-for-brazil')
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

            // REASON: o campo "Comportamento do Campo Empresa" é editado NESTA aba
            // (wc-better-calc-checkout), mas a sincronização com a option nativa do
            // WooCommerce só existia em WcSettings::save() (aba "Calculadora de frete").
            // Como apenas o save() da aba ativa é executado, salvar "Dinâmico" aqui nunca
            // atualizava woocommerce_checkout_company_field (o toggle "Empresa" do editor
            // de blocos continuava ativo/opcional). Agora mantemos os dois em sincronia.
            $this->update_woocommerce_company_field_setting();

            // No modo "Permitir somente Telefone Celular" os radios do bloco "Campo de
            // Celular" ficam `disabled` no admin (efeito visual) — e inputs `disabled`
            // NÃO são enviados no submit, deixando o valor antigo salvo. Reforçamos no
            // servidor para a lógica nunca depender do envio desses campos.
            self::enforce_cellphone_options_for_mode(get_option('woo_better_calc_phone_mode', 'phone_and_cellphone'));

            // "Ocultar Checkbox S/N" é FILHO do "Campo de Número do Endereço": sem o
            // campo de número a opção não faz sentido, então volta ao DEFAULT
            // ("Desabilitar") — mesma regra que o admin aplica no JS.
            self::enforce_number_hide_sn_option();
        }

        /**
         * Devolve "Ocultar Checkbox S/N" ao DEFAULT quando o campo de Número está off.
         *
         * É o reforço no SERVIDOR da dependência pai → filho (a mesma que o
         * `initNumberSnState()` aplica no admin): o filho marca "Desabilitar" e recebe o
         * fake disabled — que NÃO bloqueia o envio (o valor coerente vai no POST). Aqui
         * cobrimos quem salva com JS bloqueado/residual: sem o campo de Número não há
         * checkbox para ocultar, então manter `yes` guardado só criaria estado
         * inconsistente para a próxima vez que o campo de Número fosse ligado.
         *
         * @return void
         */
        public static function enforce_number_hide_sn_option()
        {
            if ('yes' !== get_option('woo_better_calc_number_required', 'no')) {
                update_option('woo_better_calc_number_hide_sn_checkbox', 'no');
            }
        }

        /**
         * Força o bloco "Campo de Celular" em "Desabilitar" no modo "Somente Celular".
         *
         * No modo "Permitir somente Telefone Celular" o campo "Celular" é o principal,
         * então as opções `enable_cellphone_field`/`cellphone_required` não se aplicam.
         * Como no admin esses radios ficam `disabled` (e portanto não são enviados no
         * submit), normalizamos aqui para manter a lógica consistente.
         *
         * @param string $mode Modo atual do campo de telefone (woo_better_calc_phone_mode).
         * @return void
         */
        public static function enforce_cellphone_options_for_mode($mode)
        {
            if ('cellphone_only' === $mode) {
                update_option('woo_better_calc_enable_cellphone_field', 'no');
                update_option('woo_better_calc_cellphone_required', 'no');
            }

            // Modos em que o plugin NÃO gerencia o telefone ("Desabilitar o campo de
            // telefone" e "Deixar a configuração nativa do WooCommerce"): zera as
            // opções do bloco "Campo de Celular" e solta a obrigatoriedade.
            //
            // REASON: sem isso, uma option residual `enable_cellphone_field = yes` de
            // uma configuração anterior continuava criando o campo "Celular" no
            // checkout mesmo com o telefone desabilitado. E manter o telefone como
            // obrigatório num formulário onde ele não é mais exibido gerava erro de
            // validação ("é um campo obrigatório") no checkout clássico.
            if (in_array($mode, array('disabled', 'disabled_native'), true)) {
                update_option('woo_better_calc_enable_cellphone_field', 'no');
                update_option('woo_better_calc_cellphone_required', 'no');
                update_option('woo_better_calc_contact_required', 'no');
            }

            // "Celular Oculto" só se aplica ao modo "Permitir Telefone Celular e Fixo".
            // Nos demais modos o campo é forçado a "Desabilitar" (no admin ele fica
            // escondido; como `hidden` ainda seria enviado, reforçamos no servidor).
            if ('phone_and_cellphone' !== $mode) {
                update_option('woo_better_calc_enable_cellphone_shim', 'no');
            }

            // O "Celular Oculto" (shim) ESPELHA o telefone — não combina com o "Campo
            // de Celular" (visível, separado): no admin os radios deste ficam
            // `disabled` quando o shim está ligado (e inputs `disabled` não são
            // enviados no submit). Precedência: o shim vence → forçamos o "Campo de
            // Celular" e o "Celular Obrigatório" em "Desabilitar".
            if ('yes' === get_option('woo_better_calc_enable_cellphone_shim', 'no')) {
                update_option('woo_better_calc_enable_cellphone_field', 'no');
                update_option('woo_better_calc_cellphone_required', 'no');
            }
        }

        /**
         * Atualiza a option nativa do WooCommerce conforme o comportamento escolhido.
         *
         * dynamic → hidden | optional → optional | required → required | disabled → hidden
         *
         * No modo "disabled" o `hidden` é o que faz o WooCommerce (clássico E blocos)
         * parar de gerar o campo Empresa — ver `WC_Countries::get_default_address_fields()`,
         * que remove `company` do endereço quando a option está em `hidden`.
         */
        private function update_woocommerce_company_field_setting()
        {
            $company_behavior = get_option('woo_better_calc_company_field_behavior', 'dynamic');

            switch ($company_behavior) {
                case 'dynamic':
                    update_option('woocommerce_checkout_company_field', 'hidden');
                    break;
                case 'optional':
                    update_option('woocommerce_checkout_company_field', 'optional');
                    break;
                case 'required':
                    update_option('woocommerce_checkout_company_field', 'required');
                    break;
                case 'disabled':
                    // Nunca deixa a option nativa em "required": um campo obrigatório
                    // que a loja não quer é o que trava o checkout.
                    update_option('woocommerce_checkout_company_field', 'hidden');
                    break;
            }
        }

        protected function get_default_company_field_behavior()
        {
            return 'dynamic';
        }
    }