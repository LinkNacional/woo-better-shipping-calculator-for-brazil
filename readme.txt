=== Calculadora de frete melhorada para lojas brasileiras ===
Contributors: luizbills
Donate link: https://luizpb.com/donate
Tags: woocommerce, brazil, calculadora de frete, cep
Requires at least: 4.6
Tested up to: 6.6
Requires PHP: 7.3
Stable tag: 3.2.2
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Calculadora de frete do WooCommerce sem os campos de País e Estado. Deixando somente o campo de CEP sempre vísivel.

== Description ==

Calculadora de frete do WooCommerce otimizada para lojas brasileiras:

* Remove os campos de país, estado e cidade.
* Deixa o campo de CEP sempre vísivel.
* Permite que apenas números sejam digitados no campo de CEP.
* Mostra teclado númerico em aparelhos móveis.

Algumas dessas funcionalidades podem ser modificadas ou desativadas por hooks. Mais detalhes na [seção de perguntas frequentes (FAQ)](#faq).

= Ajuda e Suporte =

Quando precisar de ajuda, crie um tópico no [Fórum do Plugin](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).

= Contribuições =

Se descobrir algum bug ou tiver sugestões, abra uma issue no nosso [repositório do Github](https://github.com/luizbills/wc-better-shipping-calculator-for-brazil).

= Doações =

Me ajude a manter este plugin sempre atualizado, doando em [https://luizpb.com/donate/](https://luizpb.com/donate/).

== Installation ==

1. Acesse o seu WordPress e vá no menu **Plugins > Adicionar novo**.
1. Pesquise por "Calculadora de frete melhorada para lojas brasileiras".
1. Localize o plugin, em "Instalar agora" e depois em "Ativar".
1. Pronto! Não precisa fazer mais nada.

== Screenshots ==

1. Comparando antes e depois de instalar o plugin.
1. Resultado final.

== Frequently Asked Questions ==

= Como posso MUDAR o texto "Calcule o frete"? =

Use o seguinte código:

`add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    function () {
        return 'seu novo texto';
    }
);`

= Como posso REMOVER o texto "Calcule o frete"? =

Use o seguinte código:

`add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    '__return_null'
);`

== Changelog ==

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
