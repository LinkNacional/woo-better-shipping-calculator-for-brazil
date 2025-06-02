=== Shipping Calculator for Brazil ===
Contributors: LinkNacional, luizbills
Donate link:
Tags: woocommerce, brazil, shipping calculator, ZIP code, delivery
Requires at least: 4.6
Tested up to: 6.8
Requires PHP: 7.3
Stable tag: 4.1.5
License: GPLv2 or later
License URI: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)

Shipping calculator with automatic ZIP code for WooCommerce. Compatible with Gutenberg and ideal for Brazilian stores.

== Description ==

Improved shipping calculator for Brazilian stores, making it easier and improving the data entry flow on the cart and checkout pages:

> On the Cart page:

- ZIP code validation.
- Control on the submit button, allowing you to proceed only after entering a valid ZIP code.
- Hiding address fields.
- Compatibility with Legacy and Blocks (Gutenberg) mode.

> On the Checkout page:

- Number field (complementing the address via `checkbox` or `text-input`).
- Hiding address fields.
- Compatibility with Legacy and Blocks (Gutenberg) mode.

Some of these features can be modified or disabled using hooks. More details in the [Frequently Asked Questions (FAQ)](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).

= Help and Support =

When you need help, create a topic in the [Plugin Support Forum](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).

= Contributions =

If you find any errors or have suggestions, open an issue in our [GitHub repository](https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil).

[Brasil API](https://brasilapi.com.br) - ZIP code field.
[VIACEP](https://viacep.com.br) - ZIP code field.

== Installation ==

1. Access your WordPress admin and go to **Plugins > Add New**.
2. Search for "Improved Shipping Calculator for Brazilian Stores".
3. Find the plugin, click "Install Now" and then "Activate".
4. Done! No additional configuration needed.

== Screenshots ==

1. New plugin settings page.
2. Old cart screen using the Gutenberg block editor.
3. New cart screen using the Gutenberg block editor.
4. Old cart screen using the WooCommerce shortcode.
4. New cart screen using the WooCommerce shortcode.
6. Number field using the Gutenberg block editor.
7. Number field using the WooCommerce shortcode.

== Frequently Asked Questions ==

= How can I CHANGE the text "Calculate shipping"? =

Use the following code:

add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    function () {
        return 'your new text';
    }
);

= How can I REMOVE the text "Calculate shipping"? =

Use the following code:

add_filter(
    'wc_better_shipping_calculator_for_brazil_postcode_label',
    '__return_null'
);

== Changelog ==

= 4.1.6 - 02/06/2025 =
* Adjustment: fix in the address auto-fill field.

= 4.1.5 - 22/05/2025 =
* Adjustment: address hiding field.
* Addition: plugin contributors.
* Addition: link to the plugin settings page on the cart page only when the user is an administrator.

= 4.1.4 - 20/05/2025 =
* Adjustment: neighborhood field is outside the established parameters.
* Adjustment: README.txt file tags.

= 4.1.3 - 15/05/2025 =
* Adjustment: more dynamic blueprint at the time of playground configuration.

= 4.1.2 - 07/05/2025 =
* Fix: Adjustments in the identification of physical and digital products.
* Adjustment: Improvement in the githubworkflow flow for plugin release in the repository and WordPress.

= 4.1.1 - 29/04/2025 =
* Fix: Improved README.txt description for Portuguese - BR.
* Fix: Improved Gutenberg field for ZIP code field, now it is possible to enable or disable address hiding in ZIP code fields.

= 4.0.1 - 23/04/2025 =
* Fix: New Readme.txt and image list.

= 4.0.0 - 26/03/2025 =
* Adjustment: Plugin changed to Object Oriented (OO) model.
* New settings tab for the plugin.
* Compatibility with Gutenberg.
* New number field in Woocommerce checkout (shortcode and gutenberg)

= 3.2.2 =
* Tested up to WordPress 6.6

= 3.2.1 =
* Tested up to WordPress 6.4

= 3.2.0 =
* Adjustment: Forces WooCommerce settings to enable shipping calculation.

= 3.1.2 =
* Fix: Incompatibility with the Fluid Checkout plugin.

= 3.1.1 =
* Fix: Sometimes the ZIP code field mask was not working in new shipping calculations.

= 3.1.0 =
* Feature: Now the ZIP code field has the 'tel' type (to show the numeric keyboard on mobile).

= 3.0.2 =
* Fix: The donation notice was not closing.

= 3.0.1 =
* Fix: The plugin's JavaScript should only run on the cart page.

= 3.0.0 =
* Adjustment: Refactored code for better compatibility.
* Breaking: Several hooks have been removed.

= 2.2.0 =
* Adjustment: Clears the city field to avoid unexpected results.
* Fixed the `wc_better_shipping_calculator_for_brazil_hide_country` filter hook.

= 2.1.2 =
* Minor fixes.

= 2.1.1 =
* JavaScript fix.

= 2.1.0 =
* Plugin name changed to "Improved shipping calculator for Brazilian stores".
* Now the ZIP code field is always visible.
* New hook filter: `wc_better_shipping_calculator_for_brazil_add_postcode_mask` (default: `true`)
* New hook filter: `wc_better_shipping_calculator_for_brazil_postcode_label` (default: `"Calculate shipping:"`)
* Fix in `register_activation_hook`.

= 2.0.4 =
* Fix in pt_BR translation.
* Tested with WordPress 6.0 and WooCommerce 6.5.

= 2.0.3 =
* Fix for a syntax error with older PHP versions.

= 2.0.2 =
* JavaScript fixes.
* Added translation for PT-BR.

= 2.0.1 =
* Internal fixes.

= 2.0.0 =
* Initial release.

== Upgrade Notice ==

= 2.0.0 =
* Initial release.