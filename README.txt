=== Calculadora de Frete para o Brasil ===
Contributors: LinkNacional
Donate link: https://www.linknacional.com.br
Tags: woocommerce, brasil, calculadora de frete, CEP
Requires at least: 4.6
Tested up to: 6.8
Requires PHP: 7.3
Stable tag: 4.1.2
License: GPLv2 or later
License URI: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)

Calculadora de frete com CEP automático para WooCommerce. Compatível com Gutenberg e ideal para lojas brasileiras.

== Description ==

Calculadora de frete WooCommerce otimizada para lojas brasileiras:

* Remove os campos de país, estado e cidade.
* Mantém o campo de CEP sempre visível.
* Permite apenas números no campo de CEP.
* Exibe um teclado numérico em dispositivos móveis.
* Habilita o campo de número para complementar o endereço.
* Habilita o validador de CEP(Editor de blocos do Gutenberg).
* Desabilita o frete no produto.
* Compatibilidade com o editor de blocos do Gutenberg e shortcode(modo clássico).

Algumas dessas funcionalidades podem ser modificadas ou desativadas usando hooks. Mais detalhes na seção [Perguntas Frequentes (FAQ)](#faq).

= Help and Support =

Quando precisar de ajuda, crie um tópico no [Fórum de Suporte do Plugin](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).

= Contributions =

Se encontrar algum erro ou tiver sugestões, abra um problema no nosso [repositório no GitHub](https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil).

[Brasil API](https://brasilapi.com.br) - Campo de CEP.

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

= 4.1.2 - 2025/05/07 =
* Fix: Adjustments in the identification of physical and digital products.
* Improvement: Enhanced GitHub workflow for plugin deployment to the repository and WordPress.

= 4.1.1 - 2025/04/29 =
* Fix: Improved README.txt description for Brazilian Portuguese.
* Fix: Improved Gutenberg field for ZIP code — it's now possible to enable or disable address field hiding based on ZIP input.

= 4.0.1 - 2025/04/23 =
* Fix: New Readme.txt and image list.

= 4.0.0 - 2025/03/26 =
* Adjustment: Refactored the plugin to follow the Object-Oriented (OO) model.
* New settings tab for the plugin.
* Compatibility with Gutenberg.
* New number field in the WooCommerce checkout (shortcode and Gutenberg block).

= 3.2.2 =
* Tested up to WordPress 6.6

= 3.2.1 =
* Tested up to WordPress 6.4

= 3.2.0 =
* Tweak: Force WooCommerce settings to enable shipping calculation.

= 3.1.2 =
* Fix: Incompatibility with Fluid Checkout plugin.

= 3.1.1 =
* Fix: Sometimes the postcode field mask was not working on new shipping calculations.

= 3.1.0 =
* Feature: Now the postcode field has 'tel' type (to show mobile numeric keyboard).

= 3.0.2 =
* Fix: donation notice was not closing

= 3.0.1 =
* Fix: plugin javascript must to run only in cart page

= 3.0.0 =
* Tweak: Code refactored for better compatibility.
* Break: Removed several hooks.

= 2.2.0 =
* Tweak: clear city input field to prevent unexpected results.
* Fixed the filter hook `wc_better_shipping_calculator_for_brazil_hide_country`.

= 2.1.2 =
* Minor fixes.

= 2.1.1 =
* Fix JavaScript

= 2.1.0 =
* Plugin name changed to "Calculadora de frete melhorada para lojas brasileiras"
* Now the postcode field is always visible
* New hook filter: `wc_better_shipping_calculator_for_brazil_add_postcode_mask` (default: `true`
* New hook filter: `wc_better_shipping_calculator_for_brazil_postcode_label` (default: `"Calcule o frete:"`)
* Fix register_activation_hook

= 2.0.4 =
* Fix pt_BR translation
* Tested with WordPress 6.0 and WooCommerce 6.5

= 2.0.3 =
* Fix an syntax error with older versions of PHP

= 2.0.2 =
* JavaScript fixes
* Added PT-BR translation

= 2.0.1 =
* Internal fixes

= 2.0.0 =
* Initial release.

== Upgrade Notice ==

= 2.0.0 =
* Initial release


