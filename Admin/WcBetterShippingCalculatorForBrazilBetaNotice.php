<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

// Prevent direct access
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Aviso de lançamento da próxima versão (beta).
 *
 * Exibe uma notificação para os administradores informando que em 01/09/2026
 * será lançada uma nova versão em que os recursos da Calculadora de Frete
 * migrarão para o plugin "Simulador de Frete para WooCommerce". Oferece um
 * botão "Testar a nova versão" que baixa e instala a versão v5.0.0
 * diretamente do GitHub (release asset), com barra de progresso, ativação e
 * redirecionamento automáticos.
 *
 * @since 4.17.1
 */
final class WcBetterShippingCalculatorForBrazilBetaNotice
{
    /** Ação AJAX para dispensar o aviso permanentemente. */
    private const AJAX_DISMISS = 'woo_better_calc_dismiss_beta_notice';

    /** Ação AJAX para instalar a versão beta. */
    private const AJAX_INSTALL = 'woo_better_calc_install_beta';

    /** Nonce do dismiss. */
    private const NONCE_DISMISS = 'woo_better_calc_beta_dismiss_nonce';

    /** Nonce da instalação. */
    private const NONCE_INSTALL = 'woo_better_calc_beta_install_nonce';

    /** Opção que marca o aviso como dispensado permanentemente. */
    private const OPTION_DISMISSED = 'woo_better_calc_beta_notice_dismissed';

    /**
     * Flag que a versão 5.0.0 lê para exibir a notificação de atualização
     * (pós-instalação do beta). O lado 5.0.0 deve consumi-la e reverter para
     * 'no' após exibir.
     */
    private const OPTION_UPDATE_FLAG = 'woo_better_calc_updated_via_beta';

    /** Transient de sucesso (exibido após o redirect). */
    private const SUCCESS_TRANSIENT = 'woo_better_calc_beta_success';

    /** Transient de erro (exibido após o reload). */
    private const ERROR_TRANSIENT = 'woo_better_calc_beta_error';

    /** URL do zip da versão beta no GitHub. */
    private const ZIP_URL = 'https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/releases/download/v5.0.0/woo-better-shipping-calculator-for-brazil.zip';

    /** URL do fórum WordPress.org do plugin. */
    private const FORUM_URL = 'https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/';

    /**
     * Enfileira os assets (CSS/JS) apenas quando o aviso ou o card de
     * sucesso/erro serão exibidos.
     *
     * @return void
     */
    public function enqueue_assets(): void
    {
        $success = get_transient(self::SUCCESS_TRANSIENT);
        $error   = get_transient(self::ERROR_TRANSIENT);

        if (! $this->should_show() && false === $success && false === $error) {
            return;
        }

        $version = defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            ? WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION
            : '4.17.2';

        wp_enqueue_style(
            'woo-better-calc-beta-notice',
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/css/WcBetterShippingCalculatorForBrazilBetaNotice.css',
            array(),
            $version
        );

        wp_enqueue_script(
            'woo-better-calc-beta-notice',
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/js/WcBetterShippingCalculatorForBrazilBetaNotice.js',
            array(),
            $version,
            true
        );

        // Consome os transients imediatamente: o card aparece uma única vez
        // e some ao recarregar (F5).
        $show_on_load  = '';
        $error_message = '';
        if (false !== $error) {
            $show_on_load  = 'error';
            $error_message = (string) $error;
            delete_transient(self::ERROR_TRANSIENT);
        } elseif (false !== $success) {
            $show_on_load = 'success';
            delete_transient(self::SUCCESS_TRANSIENT);
        }

        wp_localize_script('woo-better-calc-beta-notice', 'WooBetterBetaNotice', array(
            'ajaxurl'        => admin_url('admin-ajax.php'),
            'dismiss_action' => self::AJAX_DISMISS,
            'dismiss_nonce'  => wp_create_nonce(self::NONCE_DISMISS),
            'install_action' => self::AJAX_INSTALL,
            'install_nonce'  => wp_create_nonce(self::NONCE_INSTALL),
            'fallback_url'   => admin_url('plugins.php'),
            'show_on_load'   => $show_on_load,
            'error_message'  => $error_message,
            'icon_url'       => WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Includes/assets/images/icon-256x256.png',
            'success'        => array(
                'title' => __('Calculadora de Frete e Campos Checkout para o Brasil', 'woo-better-shipping-calculator-for-brazil'),
                'badge' => __('Sucesso', 'woo-better-shipping-calculator-for-brazil'),
                'close' => __('Fechar', 'woo-better-shipping-calculator-for-brazil'),
                'text'  => __('A nova versão foi instalada e ativada com sucesso.', 'woo-better-shipping-calculator-for-brazil'),
            ),
            'error' => array(
                'title' => __('Calculadora de Frete e Campos Checkout para o Brasil', 'woo-better-shipping-calculator-for-brazil'),
                'badge' => __('Erro', 'woo-better-shipping-calculator-for-brazil'),
                'close' => __('Fechar', 'woo-better-shipping-calculator-for-brazil'),
            ),
        ));
    }

    /**
     * Exibe o aviso de lançamento da versão beta.
     *
     * @return void
     */
    public function maybe_render_notice(): void
    {
        if (! $this->should_show()) {
            return;
        }

        $nonce       = wp_create_nonce(self::NONCE_DISMISS);
        $plugin_name = __('Calculadora de Frete e Campos Checkout para o Brasil', 'woo-better-shipping-calculator-for-brazil');
        $icon_url    = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Includes/assets/images/icon-256x256.png';
        ?>
        <div class="notice notice-info is-dismissible woo-better-beta-notice woo-better-beta-notice--brand" data-dismissible="woo-better-beta-notice" data-action="<?php echo esc_attr(self::AJAX_DISMISS); ?>" data-nonce="<?php echo esc_attr($nonce); ?>">
            <div class="woo-better-beta-notice__icon">
                <img src="<?php echo esc_url($icon_url); ?>" alt="<?php echo esc_attr($plugin_name); ?>">
            </div>
            <div class="woo-better-beta-notice__content">
                <p class="woo-better-beta-notice__title">
                    <strong><?php echo esc_html($plugin_name); ?></strong>
                    <span class="woo-better-beta-notice__badge"><?php esc_html_e('Beta', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                </p>
                <p>
                    <?php esc_html_e('A partir de', 'woo-better-shipping-calculator-for-brazil'); ?> <strong><?php esc_html_e('01/09/2026', 'woo-better-shipping-calculator-for-brazil'); ?></strong>, <?php esc_html_e('os recursos da Calculadora de Frete serão transferidos para o plugin Simulador de Frete para WooCommerce. O processo de migração será realizado de forma automática, sem necessidade de ação manual.', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>
                <p>
                    <?php esc_html_e('Recursos que serão migrados:', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>
                <ul class="woo-better-beta-notice__features">
                    <li><?php esc_html_e('Frete grátis por valor mínimo e por produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                    <li><?php esc_html_e('Esconder campos de endereço conforme o tipo de produto (digital/virtual)', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                    <li><?php esc_html_e('Calculadora de frete na página do produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                    <li><?php esc_html_e('Calculadora de frete na página do carrinho', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                </ul>
                <p>
                    <button type="button" class="button button-primary woo-better-beta-install-button">
                        <span class="woo-better-beta-install-button__bar" aria-hidden="true"></span>
                        <span class="woo-better-beta-install-button__text"><?php esc_html_e('Testar a nova versão', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                    </button>
                </p>
                <p class="woo-better-beta-notice__beta-note">
                    <?php esc_html_e('Esta é uma versão beta. Caso encontre algum problema,', 'woo-better-shipping-calculator-for-brazil'); ?>
                    <a href="<?php echo esc_url(self::FORUM_URL); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e('abra um chamado no fórum do plugin', 'woo-better-shipping-calculator-for-brazil'); ?></a>.
                </p>
            </div>
            <button type="button" class="notice-dismiss"><span class="screen-reader-text"><?php esc_html_e('Dispensar este aviso.', 'woo-better-shipping-calculator-for-brazil'); ?></span></button>
        </div>
        <?php
    }

    /**
     * Dispensa o aviso permanentemente.
     *
     * @return void
     */
    public function dismiss_notice(): void
    {
        check_ajax_referer(self::NONCE_DISMISS, 'nonce');

        if (! current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'Unauthorized'), 403);
        }

        update_option(self::OPTION_DISMISSED, 'yes');

        wp_send_json_success();
    }

    /**
     * Baixa e instala a versão beta a partir do GitHub, ativa e devolve a URL
     * de redirecionamento.
     *
     * @return void
     */
    public function install_beta(): void
    {
        check_ajax_referer(self::NONCE_INSTALL, 'nonce');

        if (! current_user_can('install_plugins')) {
            wp_send_json_error(array('message' => 'Unauthorized'), 403);
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader-skins.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';

        $skin     = new \Automatic_Upgrader_Skin();
        $upgrader = new \Plugin_Upgrader($skin);

        $result = $upgrader->install(self::ZIP_URL, array('overwrite_package' => true));

        if (is_wp_error($result) || false === $result) {
            $message = is_wp_error($result)
                ? $result->get_error_message()
                : __('Falha ao baixar ou instalar a versão beta.', 'woo-better-shipping-calculator-for-brazil');

            set_transient(self::ERROR_TRANSIENT, $message, 5 * MINUTE_IN_SECONDS);

            wp_send_json_error(array('message' => $message), 400);
        }

        $basename = defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME')
            ? WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME
            : 'woo-better-shipping-calculator-for-brazil/wc-better-shipping-calculator-for-brazil.php';

        $activation = activate_plugin($basename);

        if (is_wp_error($activation)) {
            set_transient(self::ERROR_TRANSIENT, $activation->get_error_message(), 5 * MINUTE_IN_SECONDS);
            wp_send_json_error(array('message' => $activation->get_error_message()), 400);
        }

        // Sinaliza para a 5.0.0 que a atualização veio do beta, para que ela
        // exiba a notificação de atualização (e reverta esta flag para 'no').
        update_option(self::OPTION_UPDATE_FLAG, 'yes');

        set_transient(self::SUCCESS_TRANSIENT, 'success', 5 * MINUTE_IN_SECONDS);

        wp_send_json_success(array(
            'redirect_url' => admin_url('plugins.php'),
        ));
    }

    /**
     * Verifica se o aviso deve ser exibido.
     *
     * @return bool
     */
    private function should_show(): bool
    {
        if (! is_admin() || wp_doing_ajax()) {
            return false;
        }

        if ($this->is_plugin_update_page()) {
            return false;
        }

        if (! current_user_can('manage_options')) {
            return false;
        }

        if ('yes' === get_option(self::OPTION_DISMISSED, 'no')) {
            return false;
        }

        // Só faz sentido na versão legada (anterior à 5.0.0). Após instalar o
        // beta, esta classe é substituída junto com o restante do plugin.
        if (defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            && version_compare(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, '5.0.0', '>=')) {
            return false;
        }

        return true;
    }

    /**
     * Verifica se a página admin atual é de atualização/instalação de plugins.
     *
     * @return bool
     */
    private function is_plugin_update_page(): bool
    {
        $pagenow = isset($GLOBALS['pagenow']) ? $GLOBALS['pagenow'] : '';
        return in_array($pagenow, array('update.php', 'update-core.php', 'update-core-network.php'), true);
    }
}
