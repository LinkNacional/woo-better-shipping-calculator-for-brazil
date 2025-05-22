=== Calculadora de Frete para o Brasil ===
Contributors: LinkNacional, luizbills
Donate link:
Tags: woocommerce, brasil, calculadora de frete, CEP, entrega
Requires at least: 4.6
Tested up to: 6.8
Requires PHP: 7.3
Stable tag: 4.1.5
License: GPLv2 or later
License URI: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)

Calculadora de frete com CEP automático para WooCommerce. Compatível com Gutenberg e ideal para lojas brasileiras.

== Description ==

Calculadora de frete melhorada para lojas brasileiras, facilitando e melhorando o fluxo de preenchimendo dos dados nas páginas de carrinho e checkout:

> Na página de Carrinho:

- Validação de CEP.
- Controle no botão de envio, permitindo apenas seguir após inserir um CEP válido.
- Ocultação de campos de endereço.
- Compatibilidade com o modo Legacy e Blocos (Gutenberg).

> Na página de Checkout:

- Campo de número(complementando o endereço via `checkbox` ou `text-input`).
- Ocultação de campos de endereço.
- Compatibilidade com o modo Legacy e Blocos (Gutenberg).

Algumas dessas funcionalidades podem ser modificadas ou desativadas usando hooks. Mais detalhes na seção [Perguntas Frequentes (FAQ)](#faq).

= Help and Support =

Quando precisar de ajuda, crie um tópico no [Fórum de Suporte do Plugin](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).

= Contributions =

Se encontrar algum erro ou tiver sugestões, abra um problema no nosso [repositório no GitHub](https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil).

[Brasil API](https://brasilapi.com.br) - Campo de CEP.
[VIACEP](https://viacep.com.br) - Campo de CEP.

== Installation ==

1. Acesse o admin do seu WordPress e vá para **Plugins > Adicionar Novo**.
2. Busque por "Calculadora de Frete Melhorada para Lojas Brasileiras".
3. Encontre o plugin, clique em "Instalar Agora" e depois em "Ativar".
4. Pronto! Nenhuma configuração adicional necessária.

== Screenshots ==

1. Nova página de configuração do plugin.
2. Tela antiga do carrinho através do editor de blocos do Gutenberg.
3. Tela nova do carrinho através do editor de blocos do Gutenberg.
4. Tela antiga do carrinho através do shortcode do WooCommerce.
4. Tela nova do carrinho através do shortcode do WooCommerce.
6. Campo de número através do editor de blocos do Gutenberg.
7. Campo de número através do shortcode do WooCommerce.

== Frequently Asked Questions ==

= Como posso ALTERAR o texto "Calcular frete"? =

Use o seguinte código:

add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    function () {
        return 'seu novo texto';
    }
);

= Como posso REMOVER o texto "Calcular frete"? =

Use o seguinte código:

add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    '__return_null'
);

== Changelog ==

= 4.1.5 - 22/05/2025 =
* Ajuste: campo de ocultação de endereço.
* Inserção: dos contribuidores do plugin.
* Inserção: de link que leva para página de configurações do plugin na página do carrinho apenas quando o usuário for administrador.

= 4.1.4 - 20/05/2025 =
* Ajuste: campo de bairro está fora dos parâmetros estabelecidos.
* Ajuste: tags do arquivo README.txt.

= 4.1.3 - 15/05/2025 =
* Ajuste: blueprint mais dinâmico no momento da configuração do playground.

= 4.1.2 - 07/05/2025 =
* Correção: Ajustes na identificação de produtos físicos e digitais.
* Ajuste : Melhoria no fluxo do githubworkflow para lançamento do plugin no repositorio e Wordpress.

= 4.1.1 - 29/04/2025 =
* Correção: Melhoria na descrição do README.txt para o Português - BR.
* Correção: Melhoria no campo do Gutenberg para campo de CEP, agora é possível habilitar ou desabilitar a ocultação do endereço nos campos de CEP.

= 4.0.1 - 23/04/2025 =
* Correção: Novo Readme.txt e lista de imagens.

= 4.0.0 - 26/03/2025 =
* Ajuste: Alteração do plugin para o modelo de Orientação a Objetos (OO).
* Novo tab de configuração para o plugin.
* Compatibilidade com o Gutenberg.
* Novo campo de número no checkout do Woocommerce(shortcode e gutenberg)

= 3.2.2 =
* Testado até o WordPress 6.6

= 3.2.1 =
* Testado até o WordPress 6.4

= 3.2.0 =
* Ajuste: Força as configurações do WooCommerce para ativar o cálculo de frete.

= 3.1.2 =
* Correção: Incompatibilidade com o plugin Fluid Checkout.

= 3.1.1 =
* Correção: Às vezes, a máscara do campo de CEP não estava funcionando em novos cálculos de frete.

= 3.1.0 =
* Recurso: Agora o campo de CEP possui o tipo 'tel' (para mostrar o teclado numérico no celular).

= 3.0.2 =
* Correção: O aviso de doação não estava fechando.

= 3.0.1 =
* Correção: O JavaScript do plugin deve ser executado apenas na página do carrinho.

= 3.0.0 =
* Ajuste: Código refatorado para melhor compatibilidade.
* Ruptura: Vários hooks foram removidos.

= 2.2.0 =
* Ajuste: Limpa o campo de cidade para evitar resultados inesperados.
* Corrigido o hook de filtro `wc_better_shipping_calculator_for_brazil_hide_country`.

= 2.1.2 =
* Correções menores.

= 2.1.1 =
* Correção em JavaScript.

= 2.1.0 =
* Nome do plugin alterado para "Calculadora de frete melhorada para lojas brasileiras".
* Agora o campo de CEP está sempre visível.
* Novo filtro de hook: `wc_better_shipping_calculator_for_brazil_add_postcode_mask` (padrão: `true`)
* Novo filtro de hook: `wc_better_shipping_calculator_for_brazil_postcode_label` (padrão: `"Calcule o frete:"`)
* Correção no `register_activation_hook`.

= 2.0.4 =
* Correção na tradução pt_BR.
* Testado com WordPress 6.0 e WooCommerce 6.5.

= 2.0.3 =
* Correção de um erro de sintaxe com versões antigas do PHP.

= 2.0.2 =
* Correções em JavaScript.
* Adicionada tradução para PT-BR.

= 2.0.1 =
* Correções internas.

= 2.0.0 =
* Lançamento inicial.

== Upgrade Notice ==

= 2.0.0 =
* Lançamento inicial.


