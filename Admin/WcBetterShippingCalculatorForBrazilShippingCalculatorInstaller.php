<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

// Prevent direct access
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Instala/atualiza/ativa o plugin Shipping Simulator for WooCommerce via AJAX
 * a partir do card "Calculadora de Frete" do woo-better.
 *
 * Após concluir, retorna a URL de redirecionamento já validada pela versão
 * instalada: se for >= 3.0.0, envia para a aba "Calculadora de Frete" do
 * shipping-simulator; caso contrário, para a página de plugins.
 *
 * @since 5.0.0
 */
class WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller
{
    public const AJAX_ACTION = 'woo_better_calc_install_shipping';

    public const NONCE_ACTION = 'woo_better_calc_install_shipping_nonce';

    private const SHIPPING_PLUGIN_SLUG = 'shipping-simulator-for-woocommerce';

    private const SHIPPING_PLUGIN_FILE = 'shipping-simulator-for-woocommerce/main.php';

    private const SHIPPING_REDIRECT_THRESHOLD = '3.0.0';

    private const SHIPPING_SETTINGS_TAB = 'wc-shipping-simulator-calculadora';

    /** Transient de erro exibido pelo woo-better após o refresh. */
    public const ERROR_TRANSIENT = 'woo_better_calc_shipping_update_error';

    public function handle(): void
    {
        check_ajax_referer(self::NONCE_ACTION, 'nonce');

        if (! current_user_can('install_plugins')) {
            set_transient(self::ERROR_TRANSIENT, 'Unauthorized', 5 * MINUTE_IN_SECONDS);
            wp_send_json_error(array('message' => 'Unauthorized'), 403);
        }

        $action = isset($_POST['install_action']) ? sanitize_key(wp_unslash($_POST['install_action'])) : '';

        $result = $this->run_action($action);

        if (is_wp_error($result)) {
            set_transient(self::ERROR_TRANSIENT, $result->get_error_message(), 5 * MINUTE_IN_SECONDS);
            wp_send_json_error(array('message' => $result->get_error_message()), 400);
        }

        // Garante que o plugin fique ativo após instalar/atualizar.
        if (! is_plugin_active(self::SHIPPING_PLUGIN_FILE)) {
            $activation = activate_plugin(self::SHIPPING_PLUGIN_FILE);
            if (is_wp_error($activation)) {
                set_transient(self::ERROR_TRANSIENT, $activation->get_error_message(), 5 * MINUTE_IN_SECONDS);
                wp_send_json_error(array('message' => $activation->get_error_message()), 400);
            }
        }

        $version = $this->get_shipping_version();

        // O shipping-simulator lê este transient após o redirect para exibir
        // o cartão de sucesso uma única vez (some no F5).
        set_transient('wc_shipping_simulator_success', $action, 5 * MINUTE_IN_SECONDS);

        wp_send_json_success(array(
            'version'      => $version,
            'redirect_url' => $this->get_redirect_url($version),
        ));
    }

    /**
     * Enfileira CSS/JS do card "Calculadora de Frete" apenas na aba do card.
     *
     * @return void
     */
    public function enqueue_assets(): void
    {
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';
        $tab  = isset($_GET['tab']) ? sanitize_text_field(wp_unslash($_GET['tab'])) : '';

        if ('wc-settings' !== $page || 'wc-better-calc-shipping-calculator' !== $tab) {
            return;
        }

        wp_enqueue_style(
            'woo-better-shipping-notices',
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilNotices.COMPILED.css',
            array(),
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
            'all'
        );

        wp_enqueue_script(
            'woo-better-shipping-install',
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilShippingInstall.COMPILED.js',
            array(),
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
            true
        );

        wp_localize_script('woo-better-shipping-install', 'WooBetterShippingInstall', array(
            'ajaxurl'      => admin_url('admin-ajax.php'),
            'action'       => self::AJAX_ACTION,
            'nonce'        => wp_create_nonce(self::NONCE_ACTION),
            'fallback_url' => admin_url('plugins.php'),
            'show_on_load' => '',
            'success'      => array(
                'title' => '',
                'badge' => '',
                'close' => '',
            ),
        ));
    }

    private function run_action(string $action)
    {
        if (! function_exists('request_filesystem_credentials')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader-skins.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';

        $skin     = new \Automatic_Upgrader_Skin();
        $upgrader = new \Plugin_Upgrader($skin);

        if ('activate' === $action) {
            return $this->is_shipping_plugin_installed()
                ? null
                : new \WP_Error('not_installed', 'Plugin não instalado.');
        }

        if ('upgrade' === $action) {
            return $upgrader->upgrade(self::SHIPPING_PLUGIN_FILE);
        }

        // Default: install.
        return $upgrader->install('https://downloads.wordpress.org/plugin/' . self::SHIPPING_PLUGIN_SLUG . '.zip');
    }

    private function get_shipping_version(): string
    {
        $file = WP_PLUGIN_DIR . '/' . self::SHIPPING_PLUGIN_FILE;

        if (! file_exists($file)) {
            return '';
        }

        if (! function_exists('get_plugin_data')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $data = get_plugin_data($file, false, false);

        return isset($data['Version']) ? $data['Version'] : '';
    }

    private function get_redirect_url(string $version): string
    {
        if ('' !== $version && version_compare($version, self::SHIPPING_REDIRECT_THRESHOLD, '>=')) {
            return admin_url('admin.php?page=wc-settings&tab=' . self::SHIPPING_SETTINGS_TAB);
        }

        return admin_url('plugins.php');
    }

    private function is_shipping_plugin_installed(): bool
    {
        return file_exists(WP_PLUGIN_DIR . '/' . self::SHIPPING_PLUGIN_FILE);
    }
}
