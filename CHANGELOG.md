# 4.7.2 - 07/01/26
* Ajuste: na verificação do campo número + plugin do brazilian.

# 4.7.1 - 06/01/26
* Ajuste: campo de CPFJ/CNPJ dinamico no editor de blocos.

# 4.7.0 - 23/12/25
* NOVO: Campo de CPF/CNPJ
* NOVO: Campo de Bairro.
* Ajuste: barra de frete grátis.

# 4.6.0 - 15/12/25
* NOVO: Atualização na logica de frete grátis.
* NOVO: Atualização do campo de número de telefone.
* NOVO: Todas as funcionalidades do editor de blocos estão disponíveis no shortcode.

# 4.5.0 - 24/10/25
* NOVO: Sistema de configuração da fonte do texto nos componente de produto + carrinho.
* NOVO: Preenchimento automático de endereço na página de Checkout.
* NOVO: Destaque no campo de CEP no formulário da página de Checkout.

# 4.4.0 - 10/09/25
* Novo: sistema de cache para consulta dos CEPs.
* Novo: cartão de exibição de plugins.
* Novo: biliotecas Psalm e CodeQL para melhoria do código.

# 4.3.3 - 15/08/25
* Correção: Estilos do botão.
* Correção: Nonce.
* Correção: Tipo da moeda e número de casa decimais.

# 4.3.2 - 08/08/25
* Correção: na exibição dos componentes.
* Ajuste: Mensagem nos campos Gutenberg.
* Adição: Campo de configuração de link.

# 4.3.1 - 05/08/25
* Ajuste: Opção que define a posição do componente fica num nível mais elevado, tanto pra página de produto, quanto carrinho.
* Correção: Ao definir a posição do componente de CEP em uma página de produto de modo personalizado, ele não exibia conforme o esperado.
* Correção: Valor padrão da cor do ícone.
* Adição: Link que leva para página de configuração agora se encontra disponível na página de produto quando o usuário for administrador da página.

# 4.3.0 - 29/07/25
* Adição: Novos componentes de verificação de CEP personalizados.
* Adição: Componente de CEP para página de produto.
* Adição: Componente de CEP para página de carrinho Woo 10+

# 4.2.1 - 09/06/25
* Correção: Separador de decimal.
* Correção: URL dinâmica.
* Correção: Barra de progresso na página legacy do carrinho.

# 4.2.0 - 06/06/25
* Adição: Opção para definir um valor mínimo para frete gratuito.

# 4.1.6 - 02/06/25
* Ajuste: correção no campo de autopreenchimento de endereço.

# 4.1.5 - 22/05/25
* Ajuste: campo de ocultação de endereço.
* Inserção: dos contribuidores do plugin.
* Inserção: de link que leva para página de configurações do plugin na página do carrinho apenas quando o usuário for administrador.

# 4.1.4 - 20/05/25
* Ajuste: campo de bairro está fora dos parâmetros estabelecidos.
* Ajuste: tags do arquivo README.txt.

# 4.1.3 - 15/05/25
* Ajuste: blueprint mais dinâmico no momento da configuração do playground.

# 4.1.2 - 07/05/25
* Correção: Ajustes na identificação de produtos físicos e digitais.
* Ajuste : Melhoria no fluxo do githubworkflow para lançamento do plugin no repositorio e Wordpress.

# 4.1.1 - 29/04/25
* Correção: Melhoria na descrição do README.txt para o Português - BR.
* Correção: Melhoria no campo do Gutenberg para campo de CEP, agora é possível habilitar ou desabilitar a ocultação do endereço nos campos de CEP.

# 4.0.1 - 23/04/25
* Correção: Novo Readme.txt e lista de imagens.

# 4.0.0 - 26/03/25
* Ajuste: Alteração do plugin para o modelo de Orientação a Objetos (OO).
* Novo tab de configuração para o plugin.
* Compatibilidade com o Gutenberg.
* Novo campo de número no checkout do Woocommerce(shortcode e gutenberg)

# 3.2.2  
* Testado até o WordPress 6.6  

# 3.2.1 
* Testado até o WordPress 6.4  

# 3.2.0 
* Ajuste: Força as configurações do WooCommerce para ativar o cálculo de frete.  

# 3.1.2
* Correção: Incompatibilidade com o plugin Fluid Checkout.  

# 3.1.1
* Correção: Às vezes, a máscara do campo de CEP não estava funcionando em novos cálculos de frete.  

# 3.1.0
* Recurso: Agora o campo de CEP possui o tipo 'tel' (para mostrar o teclado numérico no celular).  

# 3.0.2 
* Correção: O aviso de doação não estava fechando.  

# 3.0.1  
* Correção: O JavaScript do plugin deve ser executado apenas na página do carrinho.  

# 3.0.0 
* Ajuste: Código refatorado para melhor compatibilidade.  
* Ruptura: Vários hooks foram removidos.  

# 2.2.0  
* Ajuste: Limpa o campo de cidade para evitar resultados inesperados.  
* Corrigido o hook de filtro `wc_better_shipping_calculator_for_brazil_hide_country`.  

# 2.1.2  
* Correções menores.  

# 2.1.1  
* Correção em JavaScript.  

# 2.1.0  
* Nome do plugin alterado para "Calculadora de frete melhorada para lojas brasileiras".  
* Agora o campo de CEP está sempre visível.  
* Novo filtro de hook: `wc_better_shipping_calculator_for_brazil_add_postcode_mask` (padrão: `true`)  
* Novo filtro de hook: `wc_better_shipping_calculator_for_brazil_postcode_label` (padrão: `"Calcule o frete:"`)  
* Correção no `register_activation_hook`.  

# 2.0.4  
* Correção na tradução pt_BR.  
* Testado com WordPress 6.0 e WooCommerce 6.5.  

# 2.0.3  
* Correção de um erro de sintaxe com versões antigas do PHP.  

# 2.0.2  
* Correções em JavaScript.  
* Adicionada tradução para PT-BR.  

# 2.0.1  
* Correções internas.  

# 2.0.0  
* Lançamento inicial.  
