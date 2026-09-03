<?php

/**
 * Fired when the plugin is uninstalled.
 *
 * When populating this file, consider the following flow
 * of control:
 *
 * - This method should be static
 * - Check if the $_REQUEST content actually is the plugin name
 * - Run an admin referrer check to make sure it goes through authentication
 * - Verify the output of $_GET makes sense
 * - Repeat with other user roles. Best directly by using the links/query string parameters.
 * - Repeat things for multisite. Once for a single site in the network, once sitewide.
 *
 * This file may be updated more in future version of the Boilerplate; however, this is the
 * general skeleton and outline for how the file should work.
 *
 * For more information, see the following discussion:
 * https://github.com/tommcfarlin/WordPress-Plugin-Boilerplate/pull/123#issuecomment-28541913
 *
 * @link       https://linknacional.com.br
 * @since      1.0.0
 *
 * @package    WcBetterShippingCalculatorForBrazil
 */

// If uninstall not called from WordPress, then exit.
if (! defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

delete_option('woo_better_calc_number_required');
delete_option('woo_better_calc_shipping_migration_notice_shown');
delete_option('woo_better_calc_shipping_migration_dismissed');
delete_option('woo_better_calc_install_suggestion_dismissed');
delete_option('woo_better_calc_shipping_update_dismissed');

// Opções do fluxo beta/rollback (4.17.x <-> 5.0.0). Removê-las na
// desinstalação permite que uma reinstalação seja tratada como um fluxo limpo,
// sem herdar a flag de "já dispensado" nem o estado de beta-tester.
delete_option('woo_better_calc_beta_notice_dismissed');
delete_option('woo_better_calc_updated_via_beta');
delete_option('woo_better_calc_is_beta_tester');
delete_option('woo_better_calc_rollback_result');

// Opções legadas da "Calculadora de Frete" (migradas para o
// shipping-simulator-for-woocommerce). Removê-las na desinstalação garante
// que uma reinstalação seja tratada como "usuário novo" (sugestão) em vez de
// "migração", já que o ativador atual não as cria mais.
$legacy_calculator_options = array(
    'woo_better_calc_disabled_shipping',
    'woo_better_calc_hide_calculator_digital',
    'woo_better_calc_font_source',
    'woo_better_calc_enable_settings_link',
    'woo_better_enable_min_free_shipping',
    'woo_better_min_free_shipping_value',
    'woo_better_free_shipping_calc_base',
    'woo_better_only_free_shipping',
    'woo_better_avoid_free_shipping_duplication',
    'woo_better_min_free_shipping_delivery_time',
    'woo_better_min_free_shipping_message',
    'woo_better_min_free_shipping_success_message',
    'woo_better_enable_progress_bar_value',
    'woo_better_enable_free_shipping_by_product',
    'woo_better_free_shipping_by_product_delivery_time',
    'woo_better_enable_free_shipping_detection',
    'woo_better_keep_other_methods_with_free_shipping',
    'woo_better_calc_enable_product_page',
    'woo_better_calc_enable_cart_page',
    'woo_better_calc_enable_auto_postcode_search',
    'woo_better_calc_cache_expiration_time',
    'woo_better_calc_enable_auto_cache_reset',
);

foreach ($legacy_calculator_options as $option_name) {
    delete_option($option_name);
}
