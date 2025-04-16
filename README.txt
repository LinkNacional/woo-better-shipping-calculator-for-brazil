=== Improved Shipping Calculator for Brazilian Stores ===  
Contributors: LinkNacional
Donate link: https://www.linknacional.com.br
Tags: woocommerce, brazil, shipping calculator, postcode  
Requires at least: 4.6  
Tested up to: 6.8
Requires PHP: 7.3  
Stable tag: 4.0.0
License: GPLv2 or later  
License URI: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)  

WooCommerce shipping calculator without Country and State fields. Keeping only the Postcode field always visible.  

== Description ==  

WooCommerce shipping calculator optimized for Brazilian stores:  

* Removes country, state, and city fields.  
* Keeps the postcode field always visible.  
* Allows only numbers to be entered in the postcode field.  
* Displays a numeric keyboard on mobile devices.  
* Enables address number field.
* Enables ZIP code validator.
* Disables shipping on the product.

Some of these features can be modified or disabled using hooks. More details in the [Frequently Asked Questions (FAQ)](#faq) section.  

= Help and Support =  

When you need help, create a topic in the [Plugin Forum](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).  

= Contributions =  

If you find any bugs or have suggestions, open an issue in our [GitHub repository](https://github.com/luizbills/wc-better-shipping-calculator-for-brazil).

[Brasil API](https://brasilapi.com.br) - CEP Field.

== Installation ==  

1. Access your WordPress admin and go to **Plugins > Add New**.  
2. Search for "Improved Shipping Calculator for Brazilian Stores".
3. Find the plugin, click "Install Now", and then "Activate".
4. Done! No further configuration needed.

== Screenshots ==  

1. Comparison before and after installing the plugin.  
2. Final result.

== Frequently Asked Questions ==  

= How can I CHANGE the text "Calculate shipping"? =  

Use the following code:  

```php
add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    function () {
        return 'your new text';
    }
);
```

= How can I REMOVE the text "Calculate shipping"? =

Use the following code:

```php
add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    '__return_null'
);
```

== Changelog ==

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


