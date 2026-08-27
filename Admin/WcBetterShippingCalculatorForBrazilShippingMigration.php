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
     * Opção que registra que o aviso final (notice) foi dispensado.
     *
     * Quando 'yes', a camada de aviso final não é mais exibida — o usuário
     * optou por não instalar o novo plugin.
     *
     * @var string
     */
    private const OPTION_DISMISSED = 'woo_better_calc_shipping_migration_dismissed';

    /**
     * Ação AJAX usada para dispensar definitivamente o aviso final.
     *
     * @var string
     */
    private const AJAX_ACTION = 'woo_better_calc_dismiss_shipping_migration';

    /**
     * Ação do nonce usada para dispensar o aviso final.
     *
     * @var string
     */
    private const NONCE_ACTION = 'woo_better_calc_dismiss_shipping_migration_nonce';

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
            .woo-better-shipping-migration__features { list-style: none; margin: 12px 0 0; padding: 0; }
            .woo-better-shipping-migration__features li { padding: 5px 0; }
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
                        <?php esc_html_e('Para continuar usando estes recursos, instale o plugin abaixo. Seus dados não foram alterados.', 'woo-better-shipping-calculator-for-brazil'); ?>
                    </p>

                    <ul class="woo-better-shipping-migration__features">
                        <li>🚚 <?php esc_html_e('Frete grátis por valor mínimo e por produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                        <li>🙈 <?php esc_html_e('Esconder campos de endereço conforme o tipo de produto (digital/virtual)', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                        <li>📦 <?php esc_html_e('Calculadora de frete na página do produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                        <li>🛒 <?php esc_html_e('Calculadora de frete na página do carrinho', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                    </ul>
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
     * Camada de aviso final: notice admin exibido quando o usuário fecha a
     * tela de migração sem instalar/ativar o novo plugin.
     *
     * Mensagem curta, com botão de instalação/ativação e botão de dispensar.
     * Uma vez dispensado, o aviso não aparece mais.
     *
     * @since 4.18.0
     */
    public function maybe_show_notice(): void
    {
        if ( ! is_admin() || wp_doing_ajax() ) {
            return;
        }

        if ( ! current_user_can('manage_options') ) {
            return;
        }

        // Só a partir de uma versão superior a 4.17.1.
        if ( ! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            || ! version_compare(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, self::VERSION_THRESHOLD, '>') ) {
            return;
        }

        // A tela de migração ainda não foi exibida: o redirect cuida disso.
        if ( 'yes' !== get_option(self::OPTION_SHOWN, 'no') ) {
            return;
        }

        // Usuário já dispensou a camada final: não insiste.
        if ( 'yes' === get_option(self::OPTION_DISMISSED, 'no') ) {
            return;
        }

        // Plugin já ativo: não há o que avisar.
        if ( $this->is_shipping_plugin_active() ) {
            return;
        }

        // Não sobrepor a própria tela de migração.
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';
        if ( self::SCREEN_SLUG === $page ) {
            return;
        }

        $is_installed = $this->is_shipping_plugin_installed();

        $action_url = $is_installed
            ? wp_nonce_url(
                self_admin_url('plugins.php?action=activate&plugin=' . self::SHIPPING_PLUGIN_FILE),
                'activate-plugin_' . self::SHIPPING_PLUGIN_FILE
            )
            : wp_nonce_url(
                self_admin_url('update.php?action=install-plugin&plugin=' . self::SHIPPING_PLUGIN_SLUG),
                'install-plugin_' . self::SHIPPING_PLUGIN_SLUG
            );

        $action_label = $is_installed
            ? __('Ativar Shipping Simulator', 'woo-better-shipping-calculator-for-brazil')
            : __('Instalar Shipping Simulator', 'woo-better-shipping-calculator-for-brazil');

        $nonce     = wp_create_nonce(self::NONCE_ACTION);
        $ajax_url  = admin_url('admin-ajax.php');
        ?>
        <div class="notice notice-warning is-dismissible" data-dismissible="woo-better-shipping-migration-notice" data-nonce="<?php echo esc_attr($nonce); ?>">
            <p>
                <strong><?php esc_html_e('A Calculadora de Frete migrou para o Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></strong><br>
                <?php esc_html_e('Instale o novo plugin para continuar usando frete grátis, a calculadora de frete no produto/carrinho e as opções de endereço.', 'woo-better-shipping-calculator-for-brazil'); ?>
            </p>
            <p>
                <a href="<?php echo esc_url($action_url); ?>" class="button button-primary"><?php echo esc_html($action_label); ?></a>
            </p>
            <button type="button" class="notice-dismiss"><span class="screen-reader-text"><?php esc_html_e('Dispensar este aviso.', 'woo-better-shipping-calculator-for-brazil'); ?></span></button>
        </div>
        <script>
        (function () {
            var notice = document.querySelector('[data-dismissible="woo-better-shipping-migration-notice"]');
            if (!notice) return;
            var dismiss = notice.querySelector('.notice-dismiss');
            if (!dismiss) return;
            dismiss.addEventListener('click', function () {
                var formData = new FormData();
                formData.append('action', <?php echo wp_json_encode(self::AJAX_ACTION); ?>);
                formData.append('nonce', notice.getAttribute('data-nonce'));
                fetch(<?php echo wp_json_encode($ajax_url); ?>, { method: 'POST', credentials: 'same-origin', body: formData })
                    .then(function () { notice.remove(); })
                    .catch(function () { notice.remove(); });
            });
        })();
        </script>
        <?php
    }

    /**
     * Retorna a ação AJAX usada para dispensar o aviso final.
     *
     * @since 4.18.0
     * @return string
     */
    public static function get_ajax_action(): string
    {
        return self::AJAX_ACTION;
    }

    /**
     * Dispensa definitivamente a camada de aviso final.
     *
     * @since 4.18.0
     */
    public function dismiss_notice(): void
    {
        check_ajax_referer(self::NONCE_ACTION, 'nonce');

        if ( ! current_user_can('manage_options') ) {
            wp_send_json_error(array( 'message' => 'Unauthorized' ), 403);
        }

        update_option(self::OPTION_DISMISSED, 'yes');

        wp_send_json_success();
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
