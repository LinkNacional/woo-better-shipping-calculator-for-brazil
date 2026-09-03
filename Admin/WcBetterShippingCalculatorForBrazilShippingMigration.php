<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Tela de aviso sobre a migração dos recursos da "Calculadora de Frete"
 * para o plugin "Simulador de Frete para WooCommerce".
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
     * Opção que marca a sugestão de instalação como dispensada.
     *
     * @var string
     */
    private const OPTION_SUGGESTION_DISMISSED = 'woo_better_calc_install_suggestion_dismissed';

    /**
     * Ação AJAX para dispensar a sugestão de instalação.
     *
     * @var string
     */
    private const AJAX_SUGGESTION_ACTION = 'woo_better_calc_dismiss_install_suggestion';

    /**
     * Ação do nonce para dispensar a sugestão de instalação.
     *
     * @var string
     */
    private const NONCE_SUGGESTION_ACTION = 'woo_better_calc_dismiss_install_suggestion_nonce';

    /**
     * Options legadas da "Calculadora de frete" que foram migradas para o
     * plugin shipping-simulator-for-woocommerce.
     *
     * A presença de qualquer uma delas indica um usuário antigo (que já usava
     * a calculadora) — e, portanto, um caso de migração. Um usuário novo não
     * possui nenhuma dessas options salvas (o ativador atual não as cria mais).
     *
     * @var string[]
     */
    private const LEGACY_CALCULATOR_OPTIONS = [
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
    ];

    /**
     * Versão a partir da qual o aviso passa a ser exibido.
     *
     * @var string
     */
    private const VERSION_THRESHOLD = '4.17.1';

    /**
     * Caminho relativo do arquivo principal do plugin de destino.
     *
     * @var string
     */
    private const SHIPPING_PLUGIN_FILE = 'shipping-simulator-for-woocommerce/main.php';

    /**
     * Versão do shipping-simulator a partir da qual os novos recursos da
     * calculadora de frete estão disponíveis. Abaixo dela, o plugin está
     * desatualizado.
     *
     * @var string
     */
    private const SHIPPING_PLUGIN_UPDATE_THRESHOLD = '3.0.0';

    /**
     * Opção que marca o aviso de atualização do shipping-simulator como
     * dispensado.
     *
     * @var string
     */
    private const OPTION_SHIPPING_UPDATE_DISMISSED = 'woo_better_calc_shipping_update_dismissed';

    /**
     * Ação AJAX para dispensar o aviso de atualização do shipping-simulator.
     *
     * @var string
     */
    private const AJAX_SHIPPING_UPDATE_ACTION = 'woo_better_calc_dismiss_shipping_update';

    /**
     * Ação do nonce para dispensar o aviso de atualização.
     *
     * @var string
     */
    private const NONCE_SHIPPING_UPDATE_ACTION = 'woo_better_calc_dismiss_shipping_update_nonce';

    /**
     * Opção setada pela versão 4.17.x (fluxo beta) antes de instalar a 5.0.0.
     *
     * Quando 'yes', exibe o cartão de sucesso de atualização uma única vez e
     * reverte para 'no' imediatamente, para não ser exibida novamente.
     *
     * @var string
     */
    private const OPTION_BETA_UPDATED = 'woo_better_calc_updated_via_beta';

    /**
     * Opção persistente que marca o usuário como beta-tester (veio da 4.17.x
     * via fluxo beta). Enquanto 'yes', exibe o link "Retornar a versão anterior"
     * na linha de ações do plugin.
     *
     * @var string
     */
    private const OPTION_BETA_TESTER = 'woo_better_calc_is_beta_tester';

    /**
     * Ação AJAX para retornar à versão anterior (downgrade para a última
     * versão estável do WordPress.org).
     *
     * @var string
     */
    private const AJAX_ROLLBACK = 'woo_better_calc_rollback';

    /**
     * Ação do nonce para o rollback.
     *
     * @var string
     */
    private const NONCE_ROLLBACK = 'woo_better_calc_rollback_nonce';

    /**
     * Opção que sinaliza o resultado do rollback para exibição do cartão de
     * sucesso/erro após o redirect. Valores: 'success' ou 'error:<mensagem>'.
     *
     * @var string
     */
    private const OPTION_ROLLBACK_RESULT = 'woo_better_calc_rollback_result';

    /**
     * URL do zip da última versão estável (linha v4) no WordPress.org.
     *
     * @var string
     */
    private const ROLLBACK_PACKAGE_URL = 'https://downloads.wordpress.org/plugin/woo-better-shipping-calculator-for-brazil.zip';

    /**
     * Basename do próprio plugin (usado para reativar após o downgrade).
     *
     * @var string
     */
    private const PLUGIN_BASENAME = 'woo-better-shipping-calculator-for-brazil/wc-better-shipping-calculator-for-brazil.php';

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

        // Não redireciona durante atualização/instalação de plugins.
        if ( $this->is_plugin_update_page() ) {
            return;
        }

        if ( ! current_user_can('manage_options') ) {
            return;
        }

        // Não redireciona na aba "Calculadora de Frete" — o card já cobre a migração.
        if ( $this->is_shipping_calculator_settings_tab() ) {
            return;
        }

        // Só exibe a partir de uma versão superior a 4.17.1.
        if ( ! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            || ! version_compare(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, self::VERSION_THRESHOLD, '>') ) {
            return;
        }

        // Usuário novo (sem configuração antiga da calculadora): não é
        // migração. A sugestão de instalação cuida desse caso.
        if ( ! $this->has_legacy_calculator_config() ) {
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

        ?>
        <div class="wrap woo-better-shipping-migration">
            <div class="woo-better-shipping-migration__card">
                <a href="<?php echo esc_url($close_url); ?>" class="woo-better-shipping-migration__close" aria-label="<?php esc_attr_e('Fechar e não mostrar novamente', 'woo-better-shipping-calculator-for-brazil'); ?>">
                    <span aria-hidden="true">&times;</span>
                </a>

                <div class="woo-better-shipping-migration__badge" aria-hidden="true">🚚</div>

                <h1 class="woo-better-shipping-migration__title">
                    <?php esc_html_e('Agora a Calculadora de Frete se chama Simulador de Frete', 'woo-better-shipping-calculator-for-brazil'); ?>
                </h1>

                <p class="woo-better-shipping-migration__lead">
                    <?php esc_html_e('Essa nova versão do seu plugin faz uma divisão importante entre campos brasileiros e o cálculo de frete. O plugin atual será exclusivo para os Campos de Checkout Brasileiros', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>

                <div class="woo-better-shipping-migration__body">
                    <p>
                        <?php if ( $shipping_plugin_active ) : ?>
                            <?php esc_html_e('O novo plugin já está ativo. Seus dados não foram alterados.', 'woo-better-shipping-calculator-for-brazil'); ?>
                        <?php elseif ( $shipping_plugin_installed ) : ?>
                            <?php esc_html_e('O novo plugin já está instalado. Ative-o para continuar usando estes recursos. Seus dados não serão alterados.', 'woo-better-shipping-calculator-for-brazil'); ?>
                        <?php else : ?>
                            <?php esc_html_e('Para continuar usando os recursos abaixo, clique no botão "Continuar utilizando os recursos da Calculadora de Frete".', 'woo-better-shipping-calculator-for-brazil'); ?>
                        <?php endif; ?>
                    </p>

                    <ul class="woo-better-shipping-migration__features">
                        <li>🚚 <?php esc_html_e('Frete grátis por valor mínimo e por produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                        <li>🙈 <?php esc_html_e('Esconder campos de endereço conforme o tipo de produto (digital/virtual)', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                        <li>📦 <?php esc_html_e('Calculadora de frete na página do produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                        <li>🛒 <?php esc_html_e('Calculadora de frete na página do carrinho', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                    </ul>
                </div>

                <div class="woo-better-shipping-migration__actions">
                    <a href="<?php echo esc_url($close_url); ?>" class="button button-secondary button-hero"><?php esc_html_e('Agora não', 'woo-better-shipping-calculator-for-brazil'); ?></a>

                    <?php if ( $shipping_plugin_active ) : ?>
                        <p class="woo-better-shipping-migration__installed">✅ <?php esc_html_e('Simulador de Frete para WooCommerce já está ativo. Tudo pronto!', 'woo-better-shipping-calculator-for-brazil'); ?></p>
                    <?php else : ?>
                        <button type="button" class="button button-primary button-hero woo-better-shipping-install-button" data-install-action="<?php echo $shipping_plugin_installed ? 'activate' : 'install'; ?>">
                            <span class="woo-better-shipping-install-button__bar" aria-hidden="true"></span>
                            <span class="woo-better-shipping-install-button__text"><?php esc_html_e('Continuar utilizando Recursos do Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                        </button>
                    <?php endif; ?>
                </div>

            </div>
        </div>
        <?php
    }

    /**
     * Remove os notices de outros plugins na tela de migração.
     *
     * A tela é uma página admin comum, então o WordPress imprime todos os
     * `admin_notices`/`all_admin_notices` registrados por terceiros (e pelo
     * próprio woo-better) no topo. Aqui limpamos esses hooks antes de serem
     * disparados para manter a tela limpa.
     *
     * @since 4.18.0
     */
    public function remove_admin_notices(): void
    {
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';

        if ( self::SCREEN_SLUG !== $page ) {
            return;
        }

        remove_all_actions('admin_notices');
        remove_all_actions('all_admin_notices');
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
        if ( ! $this->should_show_final_notice() ) {
            return;
        }

        $is_installed = $this->is_shipping_plugin_installed();

        $action_label = $is_installed
            ? __('Continuar utilizando Recursos do Simulador de Frete', 'woo-better-shipping-calculator-for-brazil')
            : __('Continuar utilizando Recursos do Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil');

        $badge = $is_installed
            ? __('Sugestão', 'woo-better-shipping-calculator-for-brazil')
            : __('Migração', 'woo-better-shipping-calculator-for-brazil');

        $nonce    = wp_create_nonce(self::NONCE_ACTION);
        $icon_url = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Includes/assets/images/icon-256x256.gif';
        ?>
        <div class="notice notice-info is-dismissible woo-better-notice woo-better-notice--brand" data-dismissible="woo-better-shipping-migration-notice" data-action="<?php echo esc_attr(self::AJAX_ACTION); ?>" data-nonce="<?php echo esc_attr($nonce); ?>">
            <div class="woo-better-notice__icon">
                <img src="<?php echo esc_url($icon_url); ?>" alt="<?php esc_attr_e('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?>">
            </div>
            <div class="woo-better-notice__content">
                <p class="woo-better-notice__title">
                    <strong><?php esc_html_e('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></strong>
                    <span class="woo-better-notice__badge"><?php echo esc_html($badge); ?></span>
                </p>
                <p>
                    <?php if ( $is_installed ) : ?>
                        <?php esc_html_e('Ative o novo plugin para continuar usando frete grátis, a calculadora de frete no produto/carrinho e as opções de endereço.', 'woo-better-shipping-calculator-for-brazil'); ?>
                    <?php else : ?>
                        <?php esc_html_e('Instale o novo plugin para continuar usando frete grátis, a calculadora de frete no produto/carrinho e as opções de endereço.', 'woo-better-shipping-calculator-for-brazil'); ?>
                    <?php endif; ?>
                </p>
                <button type="button" class="button button-primary woo-better-shipping-install-button" data-install-action="<?php echo $is_installed ? 'activate' : 'install'; ?>">
                    <span class="woo-better-shipping-install-button__bar" aria-hidden="true"></span>
                    <span class="woo-better-shipping-install-button__text"><?php echo esc_html($action_label); ?></span>
                </button>
            </div>
            <button type="button" class="notice-dismiss"><span class="screen-reader-text"><?php esc_html_e('Dispensar este aviso.', 'woo-better-shipping-calculator-for-brazil'); ?></span></button>
        </div>
        <?php
    }

    /**
     * Decide se a camada final (notice) de migração deve ser exibida.
     *
     * @since 4.18.0
     * @return bool
     */
    private function should_show_final_notice(): bool
    {
        if ( ! is_admin() || wp_doing_ajax() ) {
            return false;
        }

        if ( $this->is_plugin_update_page() ) {
            return false;
        }

        if ( $this->is_shipping_calculator_settings_tab() ) {
            return false;
        }

        if ( ! current_user_can('manage_options') ) {
            return false;
        }

        // Só a partir de uma versão superior a 4.17.1.
        if ( ! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            || ! version_compare(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, self::VERSION_THRESHOLD, '>') ) {
            return false;
        }

        // Usuário novo: a sugestão de instalação cuida desse caso.
        if ( ! $this->has_legacy_calculator_config() ) {
            return false;
        }

        // A tela de migração ainda não foi exibida: o redirect cuida disso.
        if ( 'yes' !== get_option(self::OPTION_SHOWN, 'no') ) {
            return false;
        }

        // Usuário já dispensou a camada final: não insiste.
        if ( 'yes' === get_option(self::OPTION_DISMISSED, 'no') ) {
            return false;
        }

        // Plugin já ativo: não há o que avisar.
        if ( $this->is_shipping_plugin_active() ) {
            return false;
        }

        // Não sobrepor a própria tela de migração.
        return ! $this->is_migration_screen();
    }

    /**
     * Verifica se a página atual é a tela de migração.
     *
     * @since 5.0.0
     * @return bool
     */
    private function is_migration_screen(): bool
    {
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';
        return self::SCREEN_SLUG === $page;
    }

    /**
     * Verifica se a página atual é a aba "Calculadora de Frete" (o card
     * fake). Nela as notificações de instalar/atualizar não devem aparecer,
     * pois o próprio card já cobre esses fluxos.
     *
     * @since 5.0.0
     * @return bool
     */
    private function is_shipping_calculator_settings_tab(): bool
    {
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';
        $tab  = isset($_GET['tab']) ? sanitize_text_field(wp_unslash($_GET['tab'])) : '';

        return 'wc-settings' === $page && 'wc-better-calc-shipping-calculator' === $tab;
    }

    /**
     * Verifica se a página admin atual é de atualização/instalação de plugins.
     *
     * @since 5.0.0
     * @return bool
     */
    private function is_plugin_update_page(): bool
    {
        $pagenow = isset($GLOBALS['pagenow']) ? $GLOBALS['pagenow'] : '';
        return in_array($pagenow, array('update.php', 'update-core.php', 'update-core-network.php'), true);
    }

    /**
     * Enfileira os assets (CSS/JS) dos avisos e da tela de migração.
     *
     * @since 5.0.0
     * @return void
     */
    public function enqueue_assets(): void
    {
        $version = defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            ? WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION
            : '';

        $on_migration_screen = $this->is_migration_screen();

        $success = get_transient(WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller::SUCCESS_TRANSIENT);
        $error   = get_transient(WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller::ERROR_TRANSIENT);

        // Flag gravada pela 4.17.x ao instalar a versão beta (5.0.0): deve
        // exibir o cartão de sucesso de atualização uma única vez.
        $beta_updated = 'yes' === get_option(self::OPTION_BETA_UPDATED, 'no');

        // Resultado de um rollback concluído na requisição anterior.
        $rollback_result = get_option(self::OPTION_ROLLBACK_RESULT, '');

        $show_notice = $on_migration_screen
            || $this->should_show_final_notice()
            || $this->should_show_suggestion()
            || $this->should_show_shipping_update_notice()
            || false !== $success
            || false !== $error
            || $beta_updated
            || '' !== $rollback_result;

        if ( ! $show_notice ) {
            return;
        }

        wp_enqueue_style(
            'woo-better-shipping-notices',
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilNotices.COMPILED.css',
            [],
            $version
        );

        // JS do botão de instalar/atualizar/ativar (mesmo do card "Calculadora de Frete").
        wp_enqueue_script(
            'woo-better-shipping-install',
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilShippingInstall.COMPILED.js',
            [],
            $version,
            true
        );

        // Consome os transients e a flag do beta imediatamente: a mensagem
        // aparece uma única vez e some ao recarregar (F5).
        $show_on_load  = '';
        $error_message = '';
        if (false !== $error) {
            $show_on_load  = 'error';
            $error_message = (string) $error;
            delete_transient(WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller::ERROR_TRANSIENT);
        } elseif ($beta_updated) {
            $show_on_load = 'beta';
            update_option(self::OPTION_BETA_UPDATED, 'no');
            // Marca o usuário como beta-tester para exibir o link de rollback.
            update_option(self::OPTION_BETA_TESTER, 'yes');
        } elseif ('' !== $rollback_result) {
            if (0 === strpos($rollback_result, 'error:')) {
                $show_on_load  = 'error';
                $error_message = substr($rollback_result, 6);
            } else {
                $show_on_load = 'rollback';
            }
            delete_option(self::OPTION_ROLLBACK_RESULT);
        } elseif (false !== $success) {
            $show_on_load = (string) $success;
            delete_transient(WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller::SUCCESS_TRANSIENT);
        }

        wp_localize_script('woo-better-shipping-install', 'WooBetterShippingInstall', array(
            'ajaxurl'      => admin_url('admin-ajax.php'),
            'action'       => WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller::AJAX_ACTION,
            'nonce'        => wp_create_nonce(WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller::NONCE_ACTION),
            'fallback_url' => admin_url('plugins.php'),
            'icon_url'     => WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Includes/assets/images/icon-256x256.gif',
            'show_on_load' => $show_on_load,
            'error_message' => $error_message,
            'success'      => array(
                'title'    => __('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'),
                'badge'    => __('Sucesso', 'woo-better-shipping-calculator-for-brazil'),
                'close'    => __('Fechar', 'woo-better-shipping-calculator-for-brazil'),
                'install'  => __('O plugin Simulador de Frete para WooCommerce foi instalado e ativado com sucesso.', 'woo-better-shipping-calculator-for-brazil'),
                'upgrade'  => __('O plugin Simulador de Frete para WooCommerce foi atualizado com sucesso.', 'woo-better-shipping-calculator-for-brazil'),
                'activate' => __('O plugin Simulador de Frete para WooCommerce foi ativado com sucesso.', 'woo-better-shipping-calculator-for-brazil'),
                'beta'     => __('O plugin Campos Checkout Brasileiro para WooCommerce foi atualizado para a nova versão com sucesso.', 'woo-better-shipping-calculator-for-brazil'),
                'rollback' => __('O plugin Campos Checkout Brasileiro para WooCommerce retornou para a versão anterior com sucesso.', 'woo-better-shipping-calculator-for-brazil'),
            ),
            'error'        => array(
                'title' => __('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'),
                'badge' => __('Erro', 'woo-better-shipping-calculator-for-brazil'),
                'close' => __('Fechar', 'woo-better-shipping-calculator-for-brazil'),
            ),
        ));

        // A tela de migração não tem aviso dispensável.
        if ( ! $on_migration_screen ) {
            wp_enqueue_script(
                'woo-better-shipping-notices',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilNotices.COMPILED.js',
                [],
                $version,
                true
            );
        }
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

    /**
     * Verifica se existe alguma configuração legada da calculadora de frete.
     *
     * Usada para distinguir "migração" (usuário antigo) de "sugestão"
     * (usuário novo). O ativador da versão atual não cria mais as options da
     * calculadora, então a presença de qualquer uma delas só ocorre em
     * instalações antigas.
     *
     * @since 5.0.0
     * @return bool
     */
    private function has_legacy_calculator_config(): bool
    {
        foreach ( self::LEGACY_CALCULATOR_OPTIONS as $option ) {
            if ( false !== get_option($option, false) ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Exibe a sugestão de instalação do Shipping Simulator quando o usuário é
     * novo (sem configuração antiga da calculadora) e o plugin de destino não
     * está ativo.
     *
     * @since 5.0.0
     */
    public function maybe_show_install_suggestion(): void
    {
        if ( ! $this->should_show_suggestion() ) {
            return;
        }

        $is_installed = $this->is_shipping_plugin_installed();

        $action_label = $is_installed
            ? __('Ativar Simulador de Frete para WooCommerce', 'woo-better-shipping-calculator-for-brazil')
            : __('Instalar Simulador de Frete para WooCommerce', 'woo-better-shipping-calculator-for-brazil');

        $nonce    = wp_create_nonce(self::NONCE_SUGGESTION_ACTION);
        $icon_url = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Includes/assets/images/icon-256x256.gif';
        ?>
        <div class="notice notice-info is-dismissible woo-better-notice woo-better-notice--brand" data-dismissible="woo-better-install-suggestion" data-action="<?php echo esc_attr(self::AJAX_SUGGESTION_ACTION); ?>" data-nonce="<?php echo esc_attr($nonce); ?>">
            <div class="woo-better-notice__icon">
                <img src="<?php echo esc_url($icon_url); ?>" alt="<?php esc_attr_e('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?>">
            </div>
            <div class="woo-better-notice__content">
                <p class="woo-better-notice__title">
                    <strong><?php esc_html_e('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></strong>
                    <span class="woo-better-notice__badge"><?php esc_html_e('Sugestão', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                </p>
                <p>
                    <?php if ( $is_installed ) : ?>
                        <?php esc_html_e('Os recursos da Calculadora de Frete agora fazem parte do plugin Simulador de Frete para WooCommerce. Ative-o para usar a calculadora de frete nas páginas de produto e carrinho, frete grátis e demais recursos.', 'woo-better-shipping-calculator-for-brazil'); ?>
                    <?php else : ?>
                        <?php esc_html_e('Os recursos da Calculadora de Frete agora fazem parte do plugin Simulador de Frete para WooCommerce. Instale-o para usar a calculadora de frete nas páginas de produto e carrinho, frete grátis e demais recursos.', 'woo-better-shipping-calculator-for-brazil'); ?>
                    <?php endif; ?>
                </p>
                <button type="button" class="button button-primary woo-better-shipping-install-button" data-install-action="<?php echo $is_installed ? 'activate' : 'install'; ?>">
                    <span class="woo-better-shipping-install-button__bar" aria-hidden="true"></span>
                    <span class="woo-better-shipping-install-button__text"><?php echo esc_html($action_label); ?></span>
                </button>
            </div>
            <button type="button" class="notice-dismiss"><span class="screen-reader-text"><?php esc_html_e('Dispensar este aviso.', 'woo-better-shipping-calculator-for-brazil'); ?></span></button>
        </div>
        <?php
    }

    /**
     * Dispensa definitivamente a sugestão de instalação.
     *
     * @since 5.0.0
     */
    public function dismiss_install_suggestion(): void
    {
        check_ajax_referer(self::NONCE_SUGGESTION_ACTION, 'nonce');

        if ( ! current_user_can('manage_options') ) {
            wp_send_json_error(array( 'message' => 'Unauthorized' ), 403);
        }

        update_option(self::OPTION_SUGGESTION_DISMISSED, 'yes');

        wp_send_json_success();
    }

    /**
     * Decide se a sugestão de instalação deve ser exibida.
     *
     * @since 5.0.0
     * @return bool
     */
    private function should_show_suggestion(): bool
    {
        if ( ! is_admin() || wp_doing_ajax() ) {
            return false;
        }

        if ( $this->is_plugin_update_page() ) {
            return false;
        }

        if ( $this->is_shipping_calculator_settings_tab() ) {
            return false;
        }

        if ( ! current_user_can('manage_options') ) {
            return false;
        }

        // Plugin de destino já ativo: nada a sugerir.
        if ( $this->is_shipping_plugin_active() ) {
            return false;
        }

        // Usuário antigo: o fluxo de migração cuida desse caso.
        if ( $this->has_legacy_calculator_config() ) {
            return false;
        }

        // Já dispensado permanentemente.
        if ( 'yes' === get_option(self::OPTION_SUGGESTION_DISMISSED, 'no') ) {
            return false;
        }

        // Não sobrepor a própria tela de migração.
        $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';
        if ( self::SCREEN_SLUG === $page ) {
            return false;
        }

        return true;
    }

    /**
     * Exibe o aviso de atualização quando o shipping-simulator está instalado,
     * ativo e desatualizado (abaixo da versão com os novos recursos).
     *
     * @since 5.0.0
     */
    public function maybe_show_shipping_update_notice(): void
    {
        if ( ! $this->should_show_shipping_update_notice() ) {
            return;
        }

        $nonce      = wp_create_nonce(self::NONCE_SHIPPING_UPDATE_ACTION);
        $icon_url   = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Includes/assets/images/icon-256x256.gif';
        ?>
        <div class="notice notice-warning is-dismissible woo-better-notice woo-better-notice--update" data-dismissible="woo-better-shipping-update" data-action="<?php echo esc_attr(self::AJAX_SHIPPING_UPDATE_ACTION); ?>" data-nonce="<?php echo esc_attr($nonce); ?>">
            <div class="woo-better-notice__icon">
                <img src="<?php echo esc_url($icon_url); ?>" alt="<?php esc_attr_e('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?>">
            </div>
            <div class="woo-better-notice__content">
                <p class="woo-better-notice__title">
                    <strong><?php esc_html_e('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></strong>
                    <span class="woo-better-notice__badge"><?php esc_html_e('Atualização', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                </p>
                <p>
                    <?php esc_html_e('O plugin Simulador de Frete para WooCommerce está desatualizado. Atualize-o para ter acesso aos novos recursos da calculadora de frete.', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>
                <button type="button" class="button button-primary woo-better-shipping-install-button" data-install-action="upgrade">
                    <span class="woo-better-shipping-install-button__bar" aria-hidden="true"></span>
                    <span class="woo-better-shipping-install-button__text"><?php esc_html_e('Atualizar Simulador de Frete para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                </button>
            </div>
            <button type="button" class="notice-dismiss"><span class="screen-reader-text"><?php esc_html_e('Dispensar este aviso.', 'woo-better-shipping-calculator-for-brazil'); ?></span></button>
        </div>
        <?php
    }

    /**
     * Dispensa definitivamente o aviso de atualização do shipping-simulator.
     *
     * @since 5.0.0
     */
    public function dismiss_shipping_update_notice(): void
    {
        check_ajax_referer(self::NONCE_SHIPPING_UPDATE_ACTION, 'nonce');

        if ( ! current_user_can('manage_options') ) {
            wp_send_json_error(array( 'message' => 'Unauthorized' ), 403);
        }

        update_option(self::OPTION_SHIPPING_UPDATE_DISMISSED, 'yes');

        wp_send_json_success();
    }

    /**
     * Decide se o aviso de atualização do shipping-simulator deve ser exibido.
     *
     * @since 5.0.0
     * @return bool
     */
    private function should_show_shipping_update_notice(): bool
    {
        if ( ! is_admin() || wp_doing_ajax() ) {
            return false;
        }

        if ( $this->is_plugin_update_page() ) {
            return false;
        }

        if ( $this->is_shipping_calculator_settings_tab() ) {
            return false;
        }

        if ( ! current_user_can('manage_options') ) {
            return false;
        }

        // Só exibe quando o woo-better já está na versão nova (5.0.0+).
        if ( ! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            || version_compare(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, self::VERSION_THRESHOLD, '<=') ) {
            return false;
        }

        // Shipping-simulator precisa estar ativo.
        if ( ! $this->is_shipping_plugin_active() ) {
            return false;
        }

        // E desatualizado.
        if ( ! $this->shipping_plugin_is_outdated() ) {
            return false;
        }

        // Já dispensado permanentemente.
        if ( 'yes' === get_option(self::OPTION_SHIPPING_UPDATE_DISMISSED, 'no') ) {
            return false;
        }

        return true;
    }

    /**
     * Lê a versão do shipping-simulator instalado.
     *
     * @since 5.0.0
     * @return string Versão (ex.: '2.4.4') ou '' se não instalado.
     */
    private function shipping_plugin_version(): string
    {
        $file = WP_PLUGIN_DIR . '/' . self::SHIPPING_PLUGIN_FILE;

        if ( ! file_exists($file) ) {
            return '';
        }

        if ( ! function_exists('get_plugin_data') ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $data = get_plugin_data($file, false, false);

        return isset($data['Version']) ? $data['Version'] : '';
    }

    /**
     * Verifica se o shipping-simulator está desatualizado.
     *
     * @since 5.0.0
     * @return bool
     */
    private function shipping_plugin_is_outdated(): bool
    {
        $version = $this->shipping_plugin_version();

        if ( '' === $version ) {
            return false;
        }

        return version_compare($version, self::SHIPPING_PLUGIN_UPDATE_THRESHOLD, '<');
    }

    /**
     * Verifica se o usuário é um beta-tester (veio do fluxo beta da 4.17.x).
     *
     * @since 5.0.0
     * @return bool
     */
    private function is_beta_tester(): bool
    {
        return 'yes' === get_option(self::OPTION_BETA_TESTER, 'no');
    }

    /**
     * Adiciona o link "Retornar a versão anterior" à linha de ações do plugin,
     * apenas para usuários beta-testers.
     *
     * @since 5.0.0
     * @param array $links Links de ação atuais.
     * @return array
     */
    public function add_rollback_action_link($links)
    {
        if ( ! $this->is_beta_tester() ) {
            return $links;
        }

        $links[] = sprintf(
            '<a href="#" class="woo-better-rollback-link">%s</a>',
            esc_html__('Retornar a versão anterior', 'woo-better-shipping-calculator-for-brazil')
        );

        return $links;
    }

    /**
     * Enfileira o JS do link de rollback apenas para beta-testers.
     *
     * @since 5.0.0
     * @return void
     */
    public function enqueue_rollback_assets(): void
    {
        if ( ! is_admin() || ! $this->is_beta_tester() ) {
            return;
        }

        $version = defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            ? WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION
            : '';

        wp_enqueue_script(
            'woo-better-rollback',
            WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/js/WcBetterShippingCalculatorForBrazilRollback.js',
            array(),
            $version,
            true
        );

        wp_localize_script('woo-better-rollback', 'WooBetterRollback', array(
            'ajaxurl'      => admin_url('admin-ajax.php'),
            'action'       => self::AJAX_ROLLBACK,
            'nonce'        => wp_create_nonce(self::NONCE_ROLLBACK),
            'redirect_url' => admin_url('plugins.php'),
            'confirm'      => __('Tem certeza que deseja retornar à versão anterior?', 'woo-better-shipping-calculator-for-brazil'),
            'loading'      => __('Carregando...', 'woo-better-shipping-calculator-for-brazil'),
        ));
    }

    /**
     * Retorna à versão anterior (downgrade para a última versão estável do
     * WordPress.org) e devolve a URL de redirecionamento.
     *
     * @since 5.0.0
     * @return void
     */
    public function rollback(): void
    {
        check_ajax_referer(self::NONCE_ROLLBACK, 'nonce');

        if ( ! current_user_can('install_plugins') ) {
            wp_send_json_error(array('message' => 'Unauthorized'), 403);
        }

        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader-skins.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';

        $skin     = new \Automatic_Upgrader_Skin();
        $upgrader = new \Plugin_Upgrader($skin);

        $result = $upgrader->install(self::ROLLBACK_PACKAGE_URL, array('overwrite_package' => true));

        if (is_wp_error($result) || false === $result) {
            $message = is_wp_error($result)
                ? $result->get_error_message()
                : __('Falha ao retornar à versão anterior.', 'woo-better-shipping-calculator-for-brazil');

            update_option(self::OPTION_ROLLBACK_RESULT, 'error:' . $message);

            wp_send_json_error(array('message' => $message), 400);
        }

        if ( ! is_plugin_active(self::PLUGIN_BASENAME) ) {
            $activation = activate_plugin(self::PLUGIN_BASENAME);
            if (is_wp_error($activation)) {
                update_option(self::OPTION_ROLLBACK_RESULT, 'error:' . $activation->get_error_message());
                wp_send_json_error(array('message' => $activation->get_error_message()), 400);
            }
        }

        update_option(self::OPTION_ROLLBACK_RESULT, 'success');

        wp_send_json_success(array(
            'redirect_url' => admin_url('plugins.php'),
        ));
    }
}
