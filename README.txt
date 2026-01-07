=== Calculadora de Frete e Campos Checkout para o Brasil ===
Contributors: LinkNacional, luizbills
Donate link:
Tags: woocommerce, brasil, calculadora de frete, CEP, entrega
Requires at least: 4.6
Tested up to: 6.9
Requires PHP: 7.3
Stable tag: 4.7.2
License: GPLv2 or later
License URI: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)

Shipping calculator for Brazilian WooCommerce stores with automatic Postal Code address pre-filling and Brazilian Market on WooCommerce.

== Description ==

Improved shipping calculator designed specifically for **Brazilian e-commerce stores using [WooCommerce](https://www.linknacional.com.br/wordpress/woocommerce/)**, making it easier and significantly improving the data entry flow on the cart and checkout pages.

This version includes **full compatibility with Shortcodes and Gutenberg themes**, allowing you to place the shipping calculator anywhere on your site with maximum flexibility.

This [WordPress](https://www.linknacional.com.br/wordpress/) plugin ensures faster address verification and cleaner form management, leading to a better user experience and fewer abandoned carts.

## 🚀 New Features: Complete Brazilian Checkout

We have expanded the plugin capabilities to offer a full checkout solution for the Brazilian market. Now, in addition to the shipping calculator, the plugin manages **Custom Checkout Fields** essential for Brazilian logistics and invoicing.

**New Field Features:**
* **CPF & CNPJ:** Adds fields for Individual (CPF) and Company (CNPJ) Tax IDs with automatic validation.
* **Address Fields:** Adds and manages specific fields for **Neighborhood (Bairro)**, **Number**, and **Complement**.
* **Phone Masks:** Intelligent input masking for Brazilian landlines and mobile phones.

### ✅ ERP & "Brazilian Market" Compatibility

This is a major update for store owners who need to issue invoices (Nota Fiscal). The plugin is now fully compatible with the data standards used by the **Brazilian Market on WooCommerce** plugin (by Claudio Sanches).

**Why is this important?**
1.  **Bling & ERP Integration:** Because we follow the standard meta-keys structure, this plugin is **fully compatible with Bling, Tiny**, and other ERPs that integrate with WooCommerce. You can issue invoices (NFe) seamlessly without data errors.
2.  **Standardized Data:** Ensures that CPF, CNPJ, and address data are saved exactly how external integration tools expect them.

### Watch the Plugin Demo:

[youtube https://www.youtube.com/watch?v=oHnUt0zYLv0]

### Key Features & Improvements:

#### **On the Cart Page:**

* **ZIP Code Validation:** Real-time validation of the CEP (ZIP code) format.
* **Submission Control:** The checkout/proceed button is only enabled after the customer enters a valid CEP.
* **Dynamic Field Hiding:** Option to hide unnecessary address fields on the Cart page for a cleaner interface.
* Compatibility with both **Legacy** and **Blocks (Gutenberg)** WooCommerce modes.

#### **On the Checkout Page:**

* **✨ NEW: Automatic Address Lookup:** Automatically pre-fills the street, neighborhood, city, and state fields after the customer enters a valid CEP.
* **✨ NEW: Checkout Custom Fields:** Adds support for CPF, CNPJ, Number, Neighborhood, and Birthdate.
* **✨ NEW: Input Validation:** Validates CPF/CNPJ algorithms and applies input masks to prevent typing errors.
* **✨ NEW: Person Type Selector:** Allows customers to switch between "Person" (Pessoa Física) and "Company" (Pessoa Jurídica) during checkout.
* ** Automatic Address Lookup:** Automatically pre-fills the street, neighborhood, city, and state fields after the customer enters a valid CEP.
* ** Required Phone Field with DDI:** The phone field is now mandatory and includes a resource to capture the Country Code (DDI), ensuring complete contact information.
* **Number Field Addition:** Adds the mandatory "Number" field, often missing in standard WooCommerce forms. Includes a `checkbox` option for addresses that are "Sem Número" (No Number).
* Dynamic Field Hiding: Option to hide address fields when not needed.

#### **Additional Features:**

* **Free Shipping Minimum:** Option to set a minimum cart value required to activate the free shipping method.
* Fully customizable through the dedicated plugin settings page.
* The plugin is fully customizable via action and filter hooks for advanced users.

More details can be found in the [Frequently Asked Questions (FAQ)](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).

= Help and Support =

When you need help, please create a topic in the [Plugin Support Forum](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).


** Recommended Plugins **
* [Link Invoice Payment for WooCommerce](https://wordpress.org/plugins/invoice-payment-for-woocommerce/) - Integrate custom payment methods and offer invoice-based payments in your WooCommerce store.
* [Pix For WooCommerce](https://br.wordpress.org/plugins/payment-gateway-pix-for-woocommerce/) - Integrate Pix, Brazil’s revolutionary instant payment system, into your WooCommerce store 

== Installation ==

1.  Access your WordPress admin and go to **Plugins > Add New**.
2.  Search for "Improved Shipping Calculator for Brazilian Stores".
3.  Find the plugin, click "Install Now" and then "Activate".
4.  Done! No additional configuration is needed, but we recommend visiting the plugin settings.

== Screenshots ==

1. New plugin settings page.
2. Old cart screen using the Gutenberg block editor.
3. New cart screen using the Gutenberg block editor.
4. Old cart screen using the WooCommerce shortcode.
5. New cart screen using the WooCommerce shortcode.
6. Number field using the Gutenberg block editor.
7. Number field using the WooCommerce shortcode.
8. Progress bar in Gutenberg cart.
9. Progress bar in Gutenberg checkout.
10. Progress bar in Legacy cart.
11. Progress bar in Legacy checkout.
12. New postcode component.
13. New layout for postcode component.
14. Automatic Address Pre-filling in Checkout. (New)
15. Mandatory Phone Field with DDI. (New)

== Frequently Asked Questions ==

= Does this plugin replace "Brazilian Market on WooCommerce"? =

Yes, this plugin acts as an updated solution for *Brazilian Market on WooCommerce*. It maintains full compatibility with existing data but offers improved features. **Note:** To use it, you must disable the *Brazilian Market on WooCommerce* plugin (by Claudio Sanches) to avoid field conflicts.

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

= Why is the Phone field now mandatory and asking for a Country Code (DDI)? =

This feature was added to ensure all essential customer contact data is complete and correctly formatted. The DDI (Dialing Code International) ensures the phone number is standardized for both national and international calls, which is crucial for logistics and customer service. You can disable this feature in the plugin settings under the Checkout tab.

= How does the automatic address lookup by CEP work? =

When the customer enters a valid 8-digit CEP (Brazilian postcode) on the checkout page, the plugin uses public APIs (like VIACEP and Brasil API) to automatically retrieve and fill in the Street, City, State, and Neighborhood fields, speeding up the checkout process.


= Contributions =

If you find any errors or have suggestions, please open an issue in our [GitHub repository](https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil).

* [Brasil API](https://brasilapi.com.br) - ZIP code field.
* [VIACEP](https://viacep.com.br) - ZIP code field.
* [International Telephone Input](https://intl-tel-input.com/) - Phone number field with country code.

== Changelog ==

= 4.7.1 - 06/01/2026
* Fix: dynamic CPF/CNPJ field in block editor.

= 4.7.0 - 23/12/2025
* NEW: CPF/CNPJ field
* NEW: Neighborhood field.
* Adjustment: free shipping bar.

= 4.6.0 - 15/12/2025 =
* NEW: Dynamic progress bar for free shipping with customizable messages.
* NEW: Automatic capture and formatting of country codes in phone numbers.
* NEW: Complete feature parity between block editor and shortcode.

= 4.5.0 - 24/10/2025 =
* NEW: Text font configuration system in the product and cart components.
* NEW: Automatic address filling on the Checkout page.
* NEW: Highlight for the ZIP code field in the Checkout page form.

= 4.4.0 - 10/09/2025 =
* New: cache system for postal code queries.
* New: plugin display card.
* New: Psalm and CodeQL libraries for code

= 4.3.3 - 15/08/2025 =
* Fix: Button styles.
* Fix: Nonce.
* Fix: Currency type and decimal places.

= 4.3.2 - 08/08/2025 =
* Fix: Component display issue.
* Adjustment: Message in Gutenberg fields.
* Addition: Link configuration field.

= 4.3.1 - 05/08/2025 =
* Adjustment: Option that defines the component position is now at a higher level, for both product page and cart.
* Fix: When defining the CEP component position on a product page in custom mode, it did not display as expected.
* Fix: Default icon color value.
* Addition: Link that leads to configuration page is now available on the product page when the user is a page administrator.

= 4.3.0 - 29/07/2025 =
* Addition: New custom ZIP code verification components.
* Addition: ZIP code component for the product page.
* Addition: ZIP code component for the Woo cart page

= 4.2.1 - 09/06/2025 =
* Fix: Decimal separator.
* Fix: Dynamic URL.
* Fix: Progress bar on the legacy cart page.

= 4.2.0 - 06/06/2025 =
* Addition: Option to set a minimum cart value for free shipping.

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
