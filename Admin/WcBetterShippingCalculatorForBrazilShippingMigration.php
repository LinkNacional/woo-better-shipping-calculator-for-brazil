<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Tela de aviso sobre a migração dos recursos da "Calculadora de Frete"
 * para o plugin "Shipping Simulator for WooCommerce".
 *
 * Exibida uma única vez quando o plugin é atualizado para uma versão
 * superior a 4.17.1. Nesta etapa NÃO há migração de dados — apenas
 * informa a mudança e solicita a instalação do novo plugin.
 *
 * @since    4.18.0
 * @package  WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/Admin
 */
class WcBetterShippingCalculatorForBrazilShippingMigration
{
    /**
     * Slug da página de aviso (página oculta do menu admin).
     *
     * @var string
     */
    private const SCREEN_SLUG = 'woo-better-shipping-migration';

    /**
     * Opção que controla se o aviso já foi exibido.
     *
     * Começa como 'no' (false) e passa a 'yes' (true) quando a página
     * de aviso carrega, para que não seja exibida novamente.
     *
     * @var string
     */
    private const OPTION_SHOWN = 'woo_better_calc_shipping_migration_notice_shown';

    /**
     * Versão a partir da qual o aviso passa a ser exibido.
     *
     * @var string
     */
    private const VERSION_THRESHOLD = '4.17.1';

    /**
     * Slug do plugin de destino no WordPress.org.
     *
     * @var string
     */
    private const SHIPPING_PLUGIN_SLUG = 'shipping-simulator-for-woocommerce';

    /**
     * Caminho relativo do arquivo principal do plugin de destino.
     *
     * @var string
     */
    private const SHIPPING_PLUGIN_FILE = 'shipping-simulator-for-woocommerce/main.php';

    /**
     * Registra a página de aviso como uma página admin oculta.
     *
     * @since 4.18.0
     */
    public function register_admin_page(): void
    {
        add_submenu_page(
            null,
            __('Migração da Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil'),
            __('Migração da Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil'),
            'manage_options',
            self::SCREEN_SLUG,
            array($this, 'render_screen')
        );
    }

    /**
     * Redireciona para a tela de aviso uma única vez após a atualização.
     *
     * @since 4.18.0
     */
    public function maybe_redirect(): void
    {
        if ( ! is_admin() || wp_doing_ajax() ) {
            return;
        }

        if ( ! current_user_can('manage_options') ) {
            return;
        }

        // Só exibe a partir de uma versão superior a 4.17.1.
        if ( ! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            || ! version_compare(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, self::VERSION_THRESHOLD, '>') ) {
            return;
        }

        // Já exibido anteriormente.
        if ( 'yes' === get_option(self::OPTION_SHOWN, 'no') ) {
            return;
        }

        // Se o plugin de destino já está ativo, não há ação necessária.
        if ( $this->is_shipping_plugin_active() ) {
            return;
        }

        // Já está na própria tela: não redireciona (a opção vira 'yes' no render).
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';

        if ( self::SCREEN_SLUG === $page ) {
            return;
        }

        wp_safe_redirect(admin_url('admin.php?page=' . self::SCREEN_SLUG));
        exit;
    }

    /**
     * Renderiza a tela de aviso de migração.
     *
     * @since 4.18.0
     */
    public function render_screen(): void
    {
        if ( ! current_user_can('manage_options') ) {
            wp_die(esc_html__('Você não tem permissão para acessar esta página.', 'woo-better-shipping-calculator-for-brazil'));
        }

        // A página carregou: marca como exibida para não abrir novamente.
        update_option(self::OPTION_SHOWN, 'yes');

        $shipping_plugin_active    = $this->is_shipping_plugin_active();
        $shipping_plugin_installed = $this->is_shipping_plugin_installed();

        $close_url = admin_url();

        $install_url = wp_nonce_url(
            self_admin_url('update.php?action=install-plugin&plugin=' . self::SHIPPING_PLUGIN_SLUG),
            'install-plugin_' . self::SHIPPING_PLUGIN_SLUG
        );

        $activate_url = wp_nonce_url(
            self_admin_url('plugins.php?action=activate&plugin=' . self::SHIPPING_PLUGIN_FILE),
            'activate-plugin_' . self::SHIPPING_PLUGIN_FILE
        );

        ?>
        <style>
            .woo-better-shipping-migration { max-width: 760px; margin: 40px auto; }
            .woo-better-shipping-migration__card { position: relative; background: #fff; border: 1px solid #c3c4c7; border-radius: 8px; padding: 48px 40px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); text-align: center; }
            .woo-better-shipping-migration__close { position: absolute; top: 16px; right: 16px; width: 34px; height: 34px; line-height: 32px; font-size: 26px; color: #787c82; text-decoration: none; border: 1px solid transparent; border-radius: 4px; }
            .woo-better-shipping-migration__close:hover { color: #d63638; border-color: #c3c4c7; }
            .woo-better-shipping-migration__badge { font-size: 52px; line-height: 1; margin-bottom: 16px; }
            .woo-better-shipping-migration__title { font-size: 24px; line-height: 1.3; margin: 0 0 12px; }
            .woo-better-shipping-migration__lead { font-size: 15px; color: #50575e; margin: 0 0 24px; }
            .woo-better-shipping-migration__body { text-align: left; background: #f6f7f7; border: 1px solid #dcdcde; border-radius: 6px; padding: 16px 20px; margin: 0 0 24px; color: #3c434a; }
            .woo-better-shipping-migration__actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
            .woo-better-shipping-migration__installed { font-size: 15px; color: #007017; }
            .woo-better-shipping-migration__hint { margin-top: 20px; color: #787c82; font-size: 12px; }
        </style>

        <div class="wrap woo-better-shipping-migration">
            <div class="woo-better-shipping-migration__card">
                <a href="<?php echo esc_url($close_url); ?>" class="woo-better-shipping-migration__close" aria-label="<?php esc_attr_e('Fechar e não mostrar novamente', 'woo-better-shipping-calculator-for-brazil'); ?>">
                    <span aria-hidden="true">&times;</span>
                </a>

                <div class="woo-better-shipping-migration__badge" aria-hidden="true">🚚</div>

                <h1 class="woo-better-shipping-migration__title">
                    <?php esc_html_e('Os recursos da Calculadora de Frete migraram para um novo plugin', 'woo-better-shipping-calculator-for-brazil'); ?>
                </h1>

                <p class="woo-better-shipping-migration__lead">
                    <?php esc_html_e('A partir desta versão, os recursos da Calculadora de Frete passam a fazer parte do plugin Shipping Simulator for WooCommerce.', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>

                <div class="woo-better-shipping-migration__body">
                    <p>
                        <?php esc_html_e('Para continuar utilizando a calculadora de frete, instale o plugin abaixo. Seus dados não foram alterados — nesta versão o aviso é apenas informativo.', 'woo-better-shipping-calculator-for-brazil'); ?>
                    </p>
                </div>

                <div class="woo-better-shipping-migration__actions">
                    <?php if ( $shipping_plugin_active ) : ?>
                        <p class="woo-better-shipping-migration__installed">✅ <?php esc_html_e('Shipping Simulator for WooCommerce já está ativo. Tudo pronto!', 'woo-better-shipping-calculator-for-brazil'); ?></p>
                    <?php elseif ( $shipping_plugin_installed ) : ?>
                        <a href="<?php echo esc_url($activate_url); ?>" class="button button-primary button-hero"><?php esc_html_e('Ativar Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></a>
                    <?php else : ?>
                        <a href="<?php echo esc_url($install_url); ?>" class="button button-primary button-hero"><?php esc_html_e('Instalar Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></a>
                    <?php endif; ?>

                    <a href="<?php echo esc_url($close_url); ?>" class="button button-secondary button-hero"><?php esc_html_e('Agora não', 'woo-better-shipping-calculator-for-brazil'); ?></a>
                </div>

                <p class="woo-better-shipping-migration__hint">
                    <?php esc_html_e('Esta tela não será exibida novamente.', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>
            </div>
        </div>
        <?php
    }

    /**
     * Verifica se o plugin de destino está ativo.
     *
     * @since 4.18.0
     * @return bool
     */
    private function is_shipping_plugin_active(): bool
    {
        if ( ! function_exists('is_plugin_active') ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        return is_plugin_active(self::SHIPPING_PLUGIN_FILE);
    }

    /**
     * Verifica se o plugin de destino está instalado (ativo ou inativo).
     *
     * @since 4.18.0
     * @return bool
     */
    private function is_shipping_plugin_installed(): bool
    {
        if ( $this->is_shipping_plugin_active() ) {
            return true;
        }

        return file_exists(WP_PLUGIN_DIR . '/' . self::SHIPPING_PLUGIN_FILE);
    }
}
