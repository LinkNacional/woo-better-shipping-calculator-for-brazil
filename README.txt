=== Campos Checkout Brasileiro para WooCommerce ===
Contributors: LinkNacional, luizbills
Donate link:
Tags: woocommerce, checkout, CPF, CNPJ, CEP
Requires at least: 5.0
Tested up to: 7.1
Requires PHP: 8.2
Stable tag: 5.0.0
License: GPLv2 or later
License URI: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)

Brazilian checkout fields (CPF/CNPJ, address number, neighborhood and phone) with automatic CEP address pre-filling for WooCommerce.

== Description ==

Complete Brazilian checkout fields designed specifically for **WooCommerce stores in Brazil**, making it easier and significantly improving the data entry flow on the checkout pages.

This version includes **full compatibility with Shortcodes and Gutenberg themes**, allowing you to use the Brazilian checkout fields anywhere on your site with maximum flexibility.

This [WordPress](https://www.linknacional.com.br/wordpress/) plugin ensures faster address verification and cleaner form management, leading to a better user experience and fewer abandoned carts.

> **Note:** The shipping calculator features have moved to the [Shipping Simulator for WooCommerce](https://wordpress.org/plugins/shipping-simulator-for-woocommerce/) plugin.

## 🚀 New Features: Complete Brazilian Checkout

We have expanded the plugin capabilities to offer a full checkout solution for the Brazilian market, managing **Custom Checkout Fields** essential for Brazilian logistics and invoicing.

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

#### **On the Checkout Page:**

* **✨ NEW: Automatic Address Lookup:** Automatically pre-fills the street, neighborhood, city, and state fields after the customer enters a valid CEP.
* **✨ NEW: Checkout Custom Fields:** Adds support for CPF, CNPJ, Number, Neighborhood, and Birthdate.
* **✨ NEW: Input Validation:** Validates CPF/CNPJ algorithms and applies input masks to prevent typing errors.
* **✨ NEW: Person Type Selector:** Allows customers to switch between "Person" (Pessoa Física) and "Company" (Pessoa Jurídica) during checkout.
* **Required Phone Field with DDI:** The phone field is now mandatory and includes a resource to capture the Country Code (DDI), ensuring complete contact information.
* **Number Field Addition:** Adds the mandatory "Number" field, often missing in standard WooCommerce forms. Includes a `checkbox` option for addresses that are "Sem Número" (No Number).
* Dynamic Field Hiding: Option to hide address fields when not needed.

#### **Additional Features:**

* Fully customizable through the dedicated plugin settings page.
* The plugin is fully customizable via action and filter hooks for advanced users.

More details can be found in the [Frequently Asked Questions (FAQ)](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).

= Help and Support =

When you need help, please create a topic in the [Plugin Support Forum](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/).


** Recommended Plugins **
* [Shipping Simulator for WooCommerce](https://wordpress.org/plugins/shipping-simulator-for-woocommerce/) - Shipping calculator for the product and cart pages, free shipping rules and more.
* [Link Invoice Payment for WooCommerce](https://wordpress.org/plugins/invoice-payment-for-woocommerce/) - Integrate custom payment methods and offer invoice-based payments in your WooCommerce store.
* [Pix For WooCommerce](https://br.wordpress.org/plugins/payment-gateway-pix-for-woocommerce/) - Integrate Pix, Brazil’s revolutionary instant payment system, into your WooCommerce store 

== Installation ==

1.  Access your WordPress admin and go to **Plugins > Add New**.
2.  Search for "Brazilian Checkout Fields for WooCommerce".
3.  Find the plugin, click "Install Now" and then "Activate".
4.  Done! No additional configuration is needed, but we recommend visiting the plugin settings.

== Screenshots ==

1. CPF/CNPJ field in the Gutenberg block editor.
2. CPF/CNPJ and Company Name and IE fields in the Gutenberg block editor.
3. Number field using the Gutenberg block editor.
4. Number field using the WooCommerce shortcode.
5. Mandatory Phone Field with DDI.
6. Automatic Address Pre-filling in Checkout.
7. Birthdate and Gender fields in the Gutenberg block editor.

== Frequently Asked Questions ==

= Does this plugin replace "Brazilian Market on WooCommerce"? =

Yes, this plugin acts as an updated solution for *Brazilian Market on WooCommerce*. It maintains full compatibility with existing data but offers improved features. **Note:** To use it, you must disable the *Brazilian Market on WooCommerce* plugin (by Claudio Sanches) to avoid field conflicts.

= Why is the Phone field now mandatory and asking for a Country Code (DDI)? =

This feature was added to ensure all essential customer contact data is complete and correctly formatted. The DDI (Dialing Code International) ensures the phone number is standardized for both national and international calls, which is crucial for logistics and customer service. You can disable this feature in the plugin settings under the Checkout tab.

= How does the automatic address lookup by CEP work? =

When the customer enters a valid 8-digit CEP (Brazilian postcode) on the checkout page, the plugin uses public APIs (like VIACEP and Brasil API) to automatically retrieve and fill in the Street, City, State, and Neighborhood fields, speeding up the checkout process.


= Contributions =

If you find any errors or have suggestions, please open an issue in our [GitHub repository](https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil).

* [Brasil API](https://brasilapi.com.br) - ZIP code lookup and CNPJ validation.
* [ReceitaWS](https://receitaws.com.br) - CNPJ validation (fallback).
* [VIACEP](https://viacep.com.br) - ZIP code field.
* [International Telephone Input](https://intl-tel-input.com/) - Phone number field with country code.

== Changelog ==

# 5.0.0 - 2026-08-27
* Major: Migrated the shipping calculator resources to shipping-simulation.

# 4.17.1 - 2026-08-21
* Fix: CNPJ now validated for active registration status (situação cadastral ATIVA) against the Federal Revenue (BrasilAPI and ReceitaWS).
* Fix: Alphanumeric CNPJ (IN RFB 2.229/2024) now goes through the API (fail-closed) instead of being accepted by check digit only.
* Dev: Updated the CNPJ API validation field description in the settings.

# 4.17.0 - 2026-08-19
* New: CNPJ validation against the Brazilian Federal Revenue (BrasilAPI with ReceitaWS fallback).
* Fix: IE field no longer wrongly highlighted after a CNPJ validation error.
* Docs: Added BrasilAPI and ReceitaWS to the third-party credits.

# 4.16.12 - 2026-08-14
* Fix: Sanitization and character validation of the IE (Inscrição Estadual) field.
* Security: Defense-in-depth IE field sanitization on the PHP-to-JS bridge.

# 4.16.11 - 2026-08-05
* Fix: Shipping calculation when using order total as calculation base.
* Dev: Improved release preparation skill.
* Adjustment: Improved the validation flow for invalid ZIP codes during search.

# 4.16.10 - 2026-07-30
* Adjustment: Standardization of Funnelkit fields with the Brazilian plugin.

# 4.16.9 - 2026-07-29
* Tweak: Funilkit plugin verification system with the Brazilian plugin.

# 4.16.8 - 2026-07-28
* Adjustment: Mandatory field validation for birth date and gender.
* New: Mandatory birth date field system.

# 4.16.7 - 2026-07-17
* Adjustment: Added best V2 submission metadata to the label.

# 4.16.6 - 2026-07-17
* Tweak: Address field description name.

# 4.16.5 - 2026-07-14
* Tweak: Placeholder name in the classic checkout address field.

# 4.16.4 - 2026-07-06
* Adjust: Fallback for the plugin's calculator label when shipping business days are not detected.

# 4.16.3 - 2026-07-03
* Fix: Correction in class loading.

# 4.16.2 - 2026-07-02
* New: Shipping calculation option via coupon/fees.

# 4.16.1 - 2026-07-01
* Compatibility with the FunnelKit plugin.
* CPF validation in the shortcode version.
* Improved detection of available shipping labels in the custom calculator.

# 4.16.0 - 2026-06-11
* New: Product-based shipping system.
* New: Label system to define delivery business days for free shipping methods.
* New: Behavior system triggered upon detecting free shipping.
* Fix: Free shipping bar detection when running the plugin's calculator component.
* Fix: Address number checkbox field in Gutenberg.

# 4.15.2 - 2026-06-09
* Fixed: CEP format sent to the API.

# 4.15.1 - 2026-06-08
* Fixed: Click event to dismiss the update notice.

# 4.15.0 - 2026-06-01
* New: Alphanumeric CNPJ format support (IN RFB 2.229/2024).
* Fixed: Address number field auto-fill on first automatic lookup.
* Fixed: has-error class on the Gutenberg number field when the field is empty.
* Fixed: CEP autofill on autocomplete.
* Fixed: Nonce for the contact number field.
* Fixed: Address auto-fill on the order edit page.

# 4.14.0 - 2026-05-27
* New: CEP address auto-fill feature.
* Fixed: Checkbox behavior when filling the address.
* Fixed: Field positioning in order data + removal of country code.
* New: Icons, banners and screenshots.
* Fixed: highlighted field position in classic checkout.

# 4.13.0 - 2026-05-25
* Fixed: Optional/required CPF field.
* New: State Registration (IE) field.

# 4.12.5 - 2026-04-29
* Fixed: CEP auto-fill system for cache.
* Fixed: Address synchronization when filling the form.

# 4.12.4 - 2026-04-22
* Fixed: CPF field filling.
* Fixed: Country field changes.
* Fixed: Field population when detecting empty country.

# 4.12.3 - 2026-04-13
* Fixed: Address number field.

# 4.12.2 - 2026-04-06
* Fixed: Fix Birthdate validation

# 4.12.1 - 2026-04-02
* Fixed: CEP field highlighting configuration.

# 4.12.0 - 2026-04-02
* Added: New birth date and gender fields.
* Enhancement: New option for free shipping detection.
* Added: New option for free shipping detection.

# 4.11.0 - 2026-04-01
* Enhancement: New free shipping detection system through shipping zones.
* Enhancement: New option for checkout block (Campos Brasileiros)
* Enhancement: New quantity detection system on product page.

= 4.10.1 - 2026-03-30
* Fixed cart change detection (adding/removing products).
* Fixed component expansion when the block was minimized.

= 4.10.0 - 2026-03-11
* Fixed script loading between Classic and Block versions.
* Fixed error_log in cache function.
* New option to hide the custom shipping calculator component when only digital products are detected.

= 4.9.2 - 2026-03-06
* Adjustment: Changed the phone field position on the edit address page.

= 4.9.1 - 2026-03-06
* Adjustment: Highlight on the ZIP code field via shortcode.
* Adjustment: Shipping configuration fields.

= 4.9.0 - 2026-03-04
* Added: New options to highlight the contact and email fields.
* Added: New option to prevent duplicate free shipping.

= 4.8.0 - 2026-02-09
* Addition: Option to hide shipping methods when free shipping is acquired.
* Adjustment: stopPropagation on the checkbox button to prevent the form from being updated improperly.
* Adjustment: Improved cache description message, providing tips about possible issues with cache plugins.
* Addition: Hook for displaying custom address variables.
* Adjustments to ajax and rest_api routes to prevent caching.

= 4.7.4 - 2026-01-21
* Fix: variable products shipping calculation on product page.

= 4.7.3 - 2026-01-13
* Fix: phone number field regarding digits.
* Fix: phone number field with more configuration options.
* Fix: postal code field display configuration in shortcode.

= 4.7.2 - 2026-01-07
* Fix: number field verification + Brazilian plugin compatibility.

= 4.7.1 - 2026-01-06
* Fix: dynamic CPF/CNPJ field in block editor.

= 4.7.0 - 2025-12-23
* NEW: CPF/CNPJ field
* NEW: Neighborhood field.
* Adjustment: free shipping bar.

= 4.6.0 - 2025-12-15 =
* NEW: Dynamic progress bar for free shipping with customizable messages.
* NEW: Automatic capture and formatting of country codes in phone numbers.
* NEW: Complete feature parity between block editor and shortcode.

= 4.5.0 - 2025-10-24 =
* NEW: Text font configuration system in the product and cart components.
* NEW: Automatic address filling on the Checkout page.
* NEW: Highlight for the ZIP code field in the Checkout page form.

= 4.4.0 - 2025-09-10 =
* New: cache system for postal code queries.
* New: plugin display card.
* New: Psalm and CodeQL libraries for code

= 4.3.3 - 2025-08-15 =
* Fix: Button styles.
* Fix: Nonce.
* Fix: Currency type and decimal places.

= 4.3.2 - 2025-08-08 =
* Fix: Component display issue.
* Adjustment: Message in Gutenberg fields.
* Addition: Link configuration field.

= 4.3.1 - 2025-08-05 =
* Adjustment: Option that defines the component position is now at a higher level, for both product page and cart.
* Fix: When defining the CEP component position on a product page in custom mode, it did not display as expected.
* Fix: Default icon color value.
* Addition: Link that leads to configuration page is now available on the product page when the user is a page administrator.

= 4.3.0 - 2025-07-29 =
* Addition: New custom ZIP code verification components.
* Addition: ZIP code component for the product page.
* Addition: ZIP code component for the Woo cart page

= 4.2.1 - 2025-06-09 =
* Fix: Decimal separator.
* Fix: Dynamic URL.
* Fix: Progress bar on the legacy cart page.

= 4.2.0 - 2025-06-06 =
* Addition: Option to set a minimum cart value for free shipping.

= 4.1.6 - 2025-06-02 =
* Adjustment: fix in the address auto-fill field.

= 4.1.5 - 2025-05-22 =
* Adjustment: address hiding field.
* Addition: plugin contributors.
* Addition: link to the plugin settings page on the cart page only when the user is an administrator.

= 4.1.4 - 2025-05-20 =
* Adjustment: neighborhood field is outside the established parameters.
* Adjustment: README.txt file tags.

= 4.1.3 - 2025-05-15 =
* Adjustment: more dynamic blueprint at the time of playground configuration.

= 4.1.2 - 2025-05-07 =
* Fix: Adjustments in the identification of physical and digital products.
* Adjustment: Improvement in the githubworkflow flow for plugin release in the repository and WordPress.

= 4.1.1 - 2025-04-29 =
* Fix: Improved README.txt description for Portuguese - BR.
* Fix: Improved Gutenberg field for ZIP code field, now it is possible to enable or disable address hiding in ZIP code fields.

= 4.0.1 - 2025-04-23 =
* Fix: New Readme.txt and image list.

= 4.0.0 - 2025-03-26 =
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
