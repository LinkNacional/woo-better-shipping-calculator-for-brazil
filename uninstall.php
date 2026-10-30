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
delete_option('woo_better_calc_migration_email_sent');

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

/*
 * Licença do PRO e o boolean da página de boas-vindas.
 *
 * Estas options são escritas pelo PRO (e pela rota de ativação deste plugin),
 * mas moram no banco DESTE site. Deixá-las para trás faz a próxima instalação
 * nascer "suja": com a chave de uma compra anterior e com `onboarding_done`
 * já gravado, a página de boas-vindas do PRO nunca mais aparece (ela só
 * aparece quando esses booleanos estão vazios).
 *
 * A lista está duplicada em `tests/ProPurchaseCardTest.php` (o teste não pode
 * depender deste arquivo para saber o que esperar, e este arquivo não pode
 * depender das classes do plugin). `test_uninstall_lista_de_licenca_esta_completa`
 * compara as duas: tirar uma option daqui quebra o teste.
 */
$lkn_billing_license_options = array(
    'woo_better_pro_license_key',
    'woo_better_pro_license_token',
    'woo_better_pro_license_license_id',
    'woo_better_pro_license_domain',
    'woo_better_pro_license_cert',
    'woo_better_pro_license_policy',
    'woo_better_pro_license_result',
    'woo_better_pro_license_last_check',
    'woo_better_pro_license_last_error',
    'woo_better_pro_license_expires_at',
    'woo_better_pro_license_installed',
    // Os três booleanos da boas-vindas: `done`/`shown` gravados, `pending` é o
    // armamento. Apagados, a primeira instalação volta a mostrar a página.
    'woo_better_pro_license_onboarding_pending',
    'woo_better_pro_license_onboarding_done',
    'woo_better_pro_license_onboarding_shown',
);

foreach ($lkn_billing_license_options as $lkn_billing_option) {
    delete_option($lkn_billing_option);
}

// Transientes de guarda da boas-vindas (`lkn_pro_ob_{user_id}_{slug}`): sem
// isso, quem reinstalar o PRO fica até o TTL sem ver a página.
global $wpdb;
// O `LIKE` cobre os dois registros de cada transiente (`_transient_x` e
// `_transient_timeout_x`): sobrando o timeout, o nome fica no banco.
//
// Dois sufixos porque o slug do produto mudou: o PRO passou a usar o nome da
// PASTA do plugin (`woo-better-shipping-calculator-for-brazil-pro`) e o apelido
// curto (`woo-better-pro`) só sobrevive em guardas criadas por versões
// anteriores. Limpar os dois é o que faz a próxima instalação nascer limpa em
// qualquer um dos casos.
$lkn_billing_guard_slugs = array(
    '_woo-better-shipping-calculator-for-brazil-pro',
    '_woo-better-pro',
);

foreach ($lkn_billing_guard_slugs as $lkn_billing_guard_slug) {
    $lkn_billing_guard = $wpdb->esc_like('_transient_') . '%' . $wpdb->esc_like('lkn_pro_ob_') . '%'
        . $wpdb->esc_like($lkn_billing_guard_slug);

    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            $lkn_billing_guard
        )
    );
}
