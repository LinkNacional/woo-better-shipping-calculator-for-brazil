# Campos Checkout Brasileiro para WooCommerce

* Contribuidores: LinkNacional, luizbills
* Link para doações: [LinkNacional](https://www.linknacional.com.br/)
* Tags: cep, checkout, CPF, CNPJ, Brasil
* Testado até: ${TESTED_UP}
* Requer PHP: ${REQUIRES_PHP}
* Tag estável: ${STABLE_TAG}
* Licença: GPLv2 ou posterior
* URI da licença: https://www.gnu.org/licenses/gpl-2.0.html
* Traduções: Português(Brasil)

## Descrição

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

## 📥 Como instalar?

1. Acesse o painel de administração do WordPress e vá para **Plugins > Adicionar Novo**.
2. Pesquise por "Campos Checkout Brasileiro para WooCommerce".
3. Encontre o plugin, clique em **Instalar Agora** e depois em **Ativar**.
4. **Pronto!** O plugin funciona automaticamente.

## 🔄 Fluxo de Desenvolvimento

Este plugin utiliza um fluxo de desenvolvimento automatizado com:
- **Análise de segurança** via CodeQL
- **Verificação de qualidade** WordPress Plugin Check
- **Releases automatizados** com versionamento semântico
- **Testes de compatibilidade** em múltiplas versões do PHP

## 📋 Resumo da Versão ${STABLE_TAG}

${VERSION_SUMMARY}
