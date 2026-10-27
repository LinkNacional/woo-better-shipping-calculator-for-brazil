<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes;
// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}


use Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials\WcBetterShippingCalculatorForBrazilCheckoutSettings;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials\WcBetterShippingCalculatorForBrazilShippingCalculatorSettings;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdmin;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilShippingMigration;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilMigrationEmail;
use Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic;
use Automattic\WooCommerce\StoreApi\Schemas\V1\CartItemSchema;
use Automattic\WooCommerce\StoreApi\Schemas\V1\CartSchema;

/**
 * The file that defines the core plugin class
 *
 * A class definition that includes attributes and functions used across both the
 * public-facing side of the site and the admin area.
 *
 * @link       https://linknacional.com.br
 * @since      1.0.0
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 */

/**
 * The core plugin class.
 *
 * This is used to define internationalization, admin-specific hooks, and
 * public-facing site hooks.
 *
 * Also maintains the unique identifier of this plugin as well as the current
 * version of the plugin.
 *
 * @since      1.0.0
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 * @author     Link Nacional <contato@linknacional.com>
 */
class WcBetterShippingCalculatorForBrazil
{
    /**
     * The loader that's responsible for maintaining and registering all hooks that power
     * the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      WcBetterShippingCalculatorForBrazilLoader    $loader    Maintains and registers all hooks for the plugin.
     */
    protected $loader;

    /**
     * The unique identifier of this plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $plugin_name    The string used to uniquely identify this plugin.
     */
    protected $plugin_name;

    /**
     * The current version of the plugin.
     *
     * @since    1.0.0
     * @access   protected
     * @var      string    $version    The current version of the plugin.
     */
    protected $version;

    /**
     * Guarda de reentrância para os sync do campo de telefone. update_option() de
     * uma das opções re-dispara os próprios hooks (ex.: update_option_woocommerce_
     * checkout_phone_field), então a flag evita chamadas aninhadas que poderiam
     * corromper o estado.
     *
     * @var bool
     */
    protected static $phone_field_syncing = false;

    /**
     * Marca (atributo data-*) gravada no campo "Celular" (`<billing|shipping>_cellphone`)
     * criado por este plugin. Serve como identificador do campo para terceiros (e para
     * depuração), deixando claro que ele foi criado pelo woo-better e não por outro
     * plugin (ex.: "Brazilian Market on WooCommerce").
     *
     * @var string
     */
    public const CELLPHONE_FIELD_ATTR = 'data-wc-better-cellphone-field';

    /**
     * Namespace das extensões do Store API usadas pelo campo "Celular" do checkout
     * em blocos no modo "Somente Celular". O campo é injetado via JS (como os demais
     * campos customizados do plugin) e o valor é enviado por `setExtensionData`.
     *
     * @var string
     */
    public const CELLPHONE_EXTENSION_NAMESPACE = 'woo_better_cellphone';

    /**
     * Namespace das extensões do Store API usadas pelo campo "Telefone" do checkout
     * em blocos (modos "Celular e Fixo" e "Somente Fixo"). O campo é injetado via JS
     * (como os demais campos customizados do plugin) e o valor é enviado por
     * `setExtensionData`. O namespace é POR TIPO de campo: telefone → este; celular →
     * `CELLPHONE_EXTENSION_NAMESPACE`.
     *
     * @var string
     */
    public const PHONE_EXTENSION_NAMESPACE = 'woo_better_phone';

    /**
     * Define the core functionality of the plugin.
     *
     * Set the plugin name and the plugin version that can be used throughout the plugin.
     * Load the dependencies, define the locale, and set the hooks for the admin area and
     * the public-facing side of the site.
     *
     * @since    1.0.0
     */
    public function __construct()
    {
        if (defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')) {
            $this->version = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION;
        } else {
            $this->version = '5.2.3';
        }
        $this->plugin_name = 'wc-better-shipping-calculator-for-brazil';

        $this->load_dependencies();
        $this->define_admin_hooks();
        $this->define_public_hooks();
    }

    /**
     * Load the required dependencies for this plugin.
     *
     * Include the following files that make up the plugin:
     *
     * - WcBetterShippingCalculatorForBrazilLoader. Orchestrates the hooks of the plugin.
     * - WcBetterShippingCalculatorForBrazilI18n. Defines internationalization functionality.
     * - WcBetterShippingCalculatorForBrazilAdmin. Defines all hooks for the admin area.
     * - WcBetterShippingCalculatorForBrazilPublic. Defines all hooks for the public side of the site.
     *
     * Create an instance of the loader which will be used to register the hooks
     * with WordPress.
     *
     * @since    1.0.0
     * @access   private
     */
    private function load_dependencies()
    {
        $this->loader = new WcBetterShippingCalculatorForBrazilLoader();
    }

    /**
     * Register all of the hooks related to the admin area functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_admin_hooks()
    {

        $plugin_admin = new WcBetterShippingCalculatorForBrazilAdmin($this->get_plugin_name(), $this->get_version());

        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_styles');
        $this->loader->add_action('admin_enqueue_scripts', $plugin_admin, 'enqueue_scripts');

        // Aviso de migração dos recursos da "Calculadora de Frete" para o
        // plugin "Shipping Simulator for WooCommerce" (exibido após a 4.17.1).
        $shipping_migration = new WcBetterShippingCalculatorForBrazilShippingMigration();

        $this->loader->add_action('admin_menu', $shipping_migration, 'register_admin_page');
        // Compartilha o slug da tela de onboarding com os demais plugins LKN,
        // para que nenhum redirecione a partir de uma tela de onboarding.
        $this->loader->add_filter('lkn_admin_onboarding_screens', $shipping_migration, 'register_onboarding_screen');
        // Trata o ✕ da tela de migração (dismiss permanente) — precisa rodar no
        // admin_init, antes do admin-header já enviado pelo callback da página.
        $this->loader->add_action('admin_init', $shipping_migration, 'maybe_handle_dismiss');
        $this->loader->add_action('admin_init', $shipping_migration, 'maybe_redirect');
        $this->loader->add_action('admin_head', $shipping_migration, 'remove_admin_notices', 0);
        $this->loader->add_action('admin_enqueue_scripts', $shipping_migration, 'enqueue_assets');
        $this->loader->add_action('admin_notices', $shipping_migration, 'maybe_show_notice');
        $this->loader->add_action('wp_ajax_' . WcBetterShippingCalculatorForBrazilShippingMigration::get_ajax_action(), $shipping_migration, 'dismiss_notice');

        // Sugestão de instalação do Shipping Simulator para usuários novos
        // (sem configuração antiga da calculadora de frete).
        $this->loader->add_action('admin_notices', $shipping_migration, 'maybe_show_install_suggestion');
        $this->loader->add_action('wp_ajax_woo_better_calc_dismiss_install_suggestion', $shipping_migration, 'dismiss_install_suggestion');

        // Aviso de atualização do Shipping Simulator quando o woo-better já
        // está atualizado e o shipping-simulator está desatualizado.
        $this->loader->add_action('admin_notices', $shipping_migration, 'maybe_show_shipping_update_notice');
        $this->loader->add_action('wp_ajax_woo_better_calc_dismiss_shipping_update', $shipping_migration, 'dismiss_shipping_update_notice');

        // Rollback para a versão anterior (apenas beta-testers).
        $this->loader->add_filter('plugin_action_links_' . WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME, $shipping_migration, 'add_rollback_action_link', 11, 1);
        $this->loader->add_action('admin_enqueue_scripts', $shipping_migration, 'enqueue_rollback_assets');
        $this->loader->add_action('wp_ajax_woo_better_calc_rollback', $shipping_migration, 'rollback');

        // Instala/atualiza/ativa o Shipping Simulator via AJAX (card "Calculadora de Frete").
        $shipping_installer = new WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller();
        $this->loader->add_action('admin_enqueue_scripts', $shipping_installer, 'enqueue_assets');
        $this->loader->add_action('wp_ajax_' . WcBetterShippingCalculatorForBrazilShippingCalculatorInstaller::AJAX_ACTION, $shipping_installer, 'handle');

        // E-mail de aviso de migração (disparado via cron após detecção no init).
        $migration_email = new WcBetterShippingCalculatorForBrazilMigrationEmail();
        $this->loader->add_action('init', $migration_email, 'maybe_schedule_email');
        $this->loader->add_action(WcBetterShippingCalculatorForBrazilMigrationEmail::CRON_HOOK, $migration_email, 'send_migration_email');

        // detect state from postcode
        $this->loader->add_filter('woocommerce_checkout_fields', $this, 'lkn_add_custom_checkout_field', 100, 1);

        // Garante que o placeholder do address_1 seja ajustado no momento da renderização,
        // após todos os outros filtros terem sido aplicados
        $this->loader->add_filter('woocommerce_form_field_args', $this, 'lkn_adjust_address_placeholder', 999, 3);

        $this->loader->add_filter('woocommerce_get_settings_pages', $this, 'lkn_add_woo_better_checkout_settings_page');

        $this->loader->add_action('admin_footer', $this, 'lkn_woo_better_footer_page');

        $this->loader->add_filter('plugin_action_links_' . WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME, $this, 'lkn_add_settings_link', 10, 2);

        // O ajuste de placeholder do address_1 via locale deve sempre estar ativo,
        // pois o JS address-i18n.js sobrescreve o placeholder no cliente.
        $this->loader->add_action('woocommerce_get_country_locale', $this, 'lkn_woo_better_shipping_calculator_locale', 10, 1);

        $this->loader->add_filter('woocommerce_get_country_locale', $this, 'lkn_disable_company_required_based_on_person_type', 20, 1);

        $this->loader->add_action('admin_notices', $this, 'lkn_show_admin_notice');
        $this->loader->add_action('wp_ajax_woo_better_calc_dismiss_notice', $this, 'lkn_dismiss_admin_notice');

        // Remover erros de validação de CPF/CNPJ quando país não é BR
        $this->loader->add_action('woocommerce_after_checkout_validation', $this, 'lkn_disabled_require_field', 10, 2);

        // Hook para atualizar billing_document quando dados do usuário são salvos
        
        // Hook para atualizar billing_document quando perfil do usuário é atualizado
        $this->loader->add_action('profile_update', $this, 'update_billing_document_on_profile_update', 10, 1);
        
        // REASON: o campo Empresa nativo do WooCommerce é uma OPTION
        // (woocommerce_checkout_company_field), não post meta. O hook correto para
        // detectar mudanças feitas no editor de blocos é 'updated_option'. O hook antigo
        // ('updated_post_meta', sem filtro) disparava em qualquer edição de meta no admin
        // — inclusive ao salvar a página de checkout — e sobrescrevia a escolha do lojista
        // (ex.: "Dinâmico" voltava para "Opcional").
        $this->loader->add_action('updated_option', $this, 'sync_company_field_on_option_update', 10, 3);

        // Sincronização do campo de telefone (Celular/Telefone) com o nativo.
        // ATENÇÃO ao nome dos hooks dinâmicos do WP: são "add_option_{$option}" e
        // "update_option_{$option}" (sem o "d" de "updated_option").
        //
        // O woo-better é a ÚNICA fonte de verdade do telefone: enquanto o recurso
        // está ativo, o campo nativo do WooCommerce
        // (`woocommerce_checkout_phone_field`) é DESABILITADO (hidden), e a opção
        // própria "Telefone (Contato) Obrigatório"
        // (`woo_better_calc_contact_required`) é EXCLUSIVA — NÃO é sincronizada a
        // partir do nativo (evita conflito/bug quando o toggle do editor de blocos
        // muda). Ao DESABILITAR o recurso (modo "Desabilitar"), o campo nativo volta
        // ao estado ORIGINAL guardado.
        //
        // Reavalia a visibilidade do nativo quando o modo de telefone (ou o
        // "Destaque"/obrigatoriedade) muda.
        $this->loader->add_action('add_option_woo_better_calc_contact_field_position', $this, 'sync_phone_field', 10, 0);
        $this->loader->add_action('update_option_woo_better_calc_contact_field_position', $this, 'sync_phone_field', 10, 0);
        $this->loader->add_action('add_option_woo_better_calc_phone_mode', $this, 'sync_phone_field', 10, 0);
        $this->loader->add_action('update_option_woo_better_calc_phone_mode', $this, 'sync_phone_field', 10, 0);
        // Mantém o nativo SEMPRE desabilitado enquanto o recurso está ativo: se o
        // toggle "Telefone" do editor de blocos tentar reativá-lo (muda a option),
        // reaplicamos o `hidden`. NÃO sincroniza "Telefone (Contato) Obrigatório" —
        // essa opção é EXCLUSIVA do plugin (desacoplada do nativo).
        $this->loader->add_action('update_option_woocommerce_checkout_phone_field', $this, 'enforce_native_phone_hidden', 10, 3);
        // Reafirma o estado do telefone nativo a cada requisição (hook init — vale
        // para público E admin).
        $this->loader->add_action('init', $this, 'ensure_phone_field_option', 10, 0);

        // Hook para adicionar campos customizados na resposta AJAX de detalhes do cliente (admin)
        $this->loader->add_filter('woocommerce_ajax_get_customer_details', $this, 'add_custom_fields_to_customer_details', 10, 3);

        /**
         * Integração com FunnelKit Checkout: classe stub para compatibilidade
         * com campos brasileiros no editor drag-and-drop.
         *
         * Registrada no wp_loaded com prioridade PHP_INT_MAX (executa por
         * último) para garantir que, se o plugin "woocommerce-extra-checkout-
         * fields-for-brazil" estiver ativo, a classe real já tenha sido
         * declarada antes — evitando "Cannot redeclare class".
         */
        $this->loader->add_action('wp_loaded', $this, 'register_funnelkit_stub_class', PHP_INT_MAX);
    }

    /**
     * Verifica se a página admin atual é de atualização/instalação de plugins.
     *
     * @return bool
     */
    private function is_plugin_update_page()
    {
        $pagenow = isset($GLOBALS['pagenow']) ? $GLOBALS['pagenow'] : '';
        return in_array($pagenow, array('update.php', 'update-core.php', 'update-core-network.php'), true);
    }

    public function lkn_show_admin_notice()
    {
        // Verifica se é a área admin
        if (!is_admin()) {
            return;
        }

        // Não exibe notificações na página de atualização/instalação de plugins.
        if ($this->is_plugin_update_page()) {
            return;
        }

        // Verifica se o usuário pode gerenciar opções (compatível com multisite)
        if (!$this->user_can_manage_multisite_options()) {
            return;
        }

        // Verifica se estamos em um contexto válido do WooCommerce
        if (!$this->is_valid_woocommerce_context()) {
            return;
        }

        // Chave única para o notice da versão atual
        $version     = $this->version;
        $notice_key  = 'woo_better_calc_notice_dismissed_' . $version;
        $notice_dismissed = get_user_meta(get_current_user_id(), $notice_key, true);

        if ($notice_dismissed || (isset($_GET['tab']) && 
            'wc-better-calc-checkout' === sanitize_text_field(wp_unslash($_GET['tab'])))) {
            return;
        }

        // Verifica se o usuário é veterano
        // Prioridade 1: flag persistente salva ao dispensar qualquer notice anterior
        $is_veteran = get_user_meta( get_current_user_id(), 'woo_better_calc_is_veteran', true );

        if ( $is_veteran ) {
            $is_new_install = false;
        } else {
            // Prioridade 2: verifica se dispensou notice de alguma das últimas versões
            $old_versions   = array( '5.2.2', '5.2.1', '5.1.1', '5.1.0', '5.0.4', '5.0.3', '5.0.2', '5.0.1', '5.0.0', '4.17.4', '4.17.3', '4.17.2', '4.17.1', '4.17.0' );
            $is_new_install = true;
            foreach ( $old_versions as $old_version ) {
                if ( get_user_meta( get_current_user_id(), 'woo_better_calc_notice_dismissed_' . $old_version, true ) ) {
                    $is_new_install = false;
                    break;
                }
            }
        }

        if ($is_new_install) {
            // ── Card de Boas-vindas (nova instalação) ──────────────────────────────
            ?>
            <div class="notice notice-info is-dismissible" data-dismissible="woo-better-calc-notice">
                <div style="height: 100%; padding: 10px;">
                    <strong style="font-size: 18px;">🚀 <?php esc_html_e('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil'); ?></strong>
                    
                    <p style="font-size: 14px; margin-top: 10px;">
                        <strong>Agora é oficial:</strong> somos a melhor alternativa ao "Brazilian Fields"! Nossos campos de checkout agora são compatíveis com shortcodes e temas em blocos, com integração total ao Melhor Envio, Correios, entre outros.
                    </p>
                    
                    <p style="font-size: 14px;">
                        Aproveite também o novo recurso de frete grátis por valor, agora integrado aos métodos de entrega do WooCommerce. Precisa de Suporte WordPress? Entre no Grupo do <a href="https://www.linknacional.com.br/assets/whatsapp-grupo-wordpress" target="_blank" rel="noopener noreferrer">WhatsApp</a> ou <a href="https://t.me/wpprobr" target="_blank" rel="noopener noreferrer">Telegram</a>.
                    </p>

                    <div style="display: flex; gap: 12px; margin-top: 15px; flex-wrap: wrap;">
                        <a href="admin.php?page=wc-settings&tab=wc-better-calc-checkout" class="button button-primary" style="display: flex; align-items: center; justify-content: center;">
                            Configurar campos do Brasil
                        </a>
                    </div>
                </div>
                <button type="button" class="notice-dismiss"><span class="screen-reader-text">Dispensar este aviso.</span></button>
            </div>
            <?php
        } else {
            // ── Card de Atualização / Changelog (usuário veterano) ────────
            // Só exibe se a versão contém novas funcionalidades
            if (! defined('WC_BETTER_SHIPPING_NEW_FEATURES') || ! WC_BETTER_SHIPPING_NEW_FEATURES) {
                return;
            }
            ?>
            <div class="notice notice-info is-dismissible" data-dismissible="woo-better-calc-notice">
                <div style="height: 100%; padding: 10px;">
                    <strong style="font-size: 18px;">🚀 <?php echo esc_html( sprintf(
                        /* translators: %s: versão do plugin */
                        __( 'Campos Checkout Brasileiro para WooCommerce — Atualização v%s', 'woo-better-shipping-calculator-for-brazil' ),
                        $version
                    ) ); ?></strong>

                    <div style="margin-top: 10px;">
                        <p style="font-size: 14px; margin-top: 8px;">
                            ✨ <strong>Novo:</strong> <?php esc_html_e( 'Campo de RG (Registro Geral) no checkout. Ele aparece para Pessoa Física, junto com o CPF, e o preenchimento é opcional.', 'woo-better-shipping-calculator-for-brazil' ); ?>
                        </p>
                    </div>


                    <div style="display: flex; gap: 12px; margin-top: 15px; flex-wrap: wrap;">
                        <a href="admin.php?page=wc-settings&tab=wc-better-calc-checkout" class="button button-primary" style="display: flex; align-items: center; justify-content: center;">
                            Configurar campos do Brasil
                        </a>
                    </div>
                </div>
                <button type="button" class="notice-dismiss"><span class="screen-reader-text">Dispensar este aviso.</span></button>
            </div>
            <?php
        }
    }

    /**
     * AJAX handler para dispensar o notice permanentemente
     */
    public function lkn_dismiss_admin_notice()
    {
        if (isset($_POST['nonce']) && !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'woo_better_calc_dismiss_notice')) {
            wp_die('Unauthorized');
        }

        if (!$this->user_can_manage_multisite_options()) {
            wp_die('Unauthorized');
        }

        // Salva o dismiss da versão atual
        $version    = isset($this->version) ? $this->version : 'unknown';
        $notice_key = 'woo_better_calc_notice_dismissed_' . $version;
        update_user_meta(get_current_user_id(), $notice_key, true);
        // Marca o usuário como veterano — nas próximas versões não precisará checar o array
        update_user_meta(get_current_user_id(), 'woo_better_calc_is_veteran', 'yes');
        wp_send_json_success();
    }

    public function lkn_woo_better_shipping_calculator_locale($locale)
    {
        // Quando o campo de número está habilitado, ajusta o placeholder do address_1
        // diretamente no locale. Isso é necessário porque o JS address-i18n.js do
        // WooCommerce sobrescreve o placeholder no cliente usando os dados de locale.
        $number_field = get_option('woo_better_calc_number_required', 'no');
        if ($number_field === 'yes') {
            if (! isset($locale['BR'])) {
                $locale['BR'] = array();
            }
            if (! isset($locale['BR']['address_1'])) {
                $locale['BR']['address_1'] = array();
            }
            $locale['BR']['address_1']['placeholder'] = __('Nome da rua', 'woo-better-shipping-calculator-for-brazil');
        }

        return $locale;
    }

    public function lkn_disable_company_required_based_on_person_type($locale)
    {
        // Ajustar required via locale só tem efeito no checkout em blocos (Gutenberg).
        // No checkout clássico/shortcode a validação é controlada por outros meios.
        $is_blocks_checkout = false;
        if ( function_exists( 'has_block' ) ) {
            global $post;
            if ( isset( $post ) && is_a( $post, 'WP_Post' ) ) {
                $is_blocks_checkout = has_block( 'woocommerce/checkout', $post );
            }
        }
        if ( ! $is_blocks_checkout ) {
            return $locale;
        }

        $company_behavior = get_option('woo_better_calc_company_field_behavior', 'dynamic');

        // Modo "Desabilitado": o campo Empresa não deve existir. Se algum outro
        // filtro/plugin o reintroduzir no checkout em blocos, ele fica sem
        // obrigatoriedade (nunca "required"), para não travar o pedido.
        if ('disabled' === $company_behavior) {
            if (!isset($locale['BR'])) {
                $locale['BR'] = array();
            }
            if (!isset($locale['BR']['company'])) {
                $locale['BR']['company'] = array();
            }
            $locale['BR']['company']['required'] = false;

            return $locale;
        }

        // Só aplica a lógica se for dinâmico
        if ($company_behavior === 'dynamic') {
            $person_type = get_option('woo_better_calc_person_type_select', 'none');
            
            if ($person_type === 'both' || $person_type === 'legal') {
                if (!isset($locale['BR'])) {
                    $locale['BR'] = array();
                }
                if (!isset($locale['BR']['company'])) {
                    $locale['BR']['company'] = array();
                }
                $locale['BR']['company']['required'] = false;
            }
        }
        
        return $locale;
    }

    public function lkn_woo_better_footer_page()
    {
        // Verifica se estamos na página da aba de checkout
        if (
            isset($_GET['page'], $_GET['tab']) &&
            sanitize_text_field(wp_unslash($_GET['page'])) === 'wc-settings' &&
            sanitize_text_field(wp_unslash($_GET['tab'])) === 'wc-better-calc-checkout'
        ) {
            // Cache-busting por mtime: os bundles de admin são recompilados sem
            // que a versão do plugin mude (iterações dentro da mesma release), e
            // usar a constante deixava o navegador rodando o arquivo antigo mesmo
            // depois de um refresh — o ajuste só aparecia com hard refresh.
            $asset_version = function ($relative_path) {
                $absolute_path = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR . $relative_path;

                return file_exists($absolute_path)
                    ? (string) filemtime($absolute_path)
                    : WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION;
            };

            // "Desabilitado" apenas VISUAL (`window.wcBetterFakeDisabled`). REASON:
            // um input com o atributo `disabled` NÃO vai no POST, então a option
            // mantinha o valor antigo salvo e o recurso seguia ativo no checkout
            // (tela mostrava "Não" + campo fantasma). Ver AGENTS.md § 7.
            wp_enqueue_script(
                'wc-better-calc-settings-fake-disabled',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminFakeDisabled.COMPILED.js',
                array(),
                $asset_version('Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminFakeDisabled.COMPILED.js'),
                true
            );

            wp_enqueue_script(
                'wc-better-calc-settings-layout',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminLayout.COMPILED.js',
                array('wc-better-calc-settings-fake-disabled'),
                $asset_version('Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminLayout.COMPILED.js'),
                true
            );

            $plugin_path = 'invoice-payment-for-woocommerce/wc-invoice-payment.php';
            $invoice_plugin_installed = file_exists(WP_PLUGIN_DIR . '/' . $plugin_path);

            wp_localize_script('wc-better-calc-settings-layout', 'wcBetterCalcAjax', array(
                'install_nonce' => wp_create_nonce('install-plugin_invoice-payment-for-woocommerce'),
                'plugin_slug' => 'invoice-payment-for-woocommerce',
                'invoice_plugin_installed' => $invoice_plugin_installed,
            ));

            wp_enqueue_script(
                'wc-better-calc-footer-message',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.js',
                array('wc-better-calc-settings-fake-disabled'),
                $asset_version('Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.js'),
                true
            );

            wp_enqueue_style(
                'wc-better-calc-style-settings',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.css',
                array(),
                // mtime: a classe `.woo-better-fake-disabled` (ver AGENTS.md § 7) foi
                // adicionada dentro da MESMA versão — com a constante o navegador
                // seguiria com o CSS antigo e o "desabilitado" ficaria sem estilo.
                $asset_version('Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.css'),
                'all'
            );

            wp_enqueue_style(
                'wc-better-calc-style-admin-card-settings',
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminCard.COMPILED.css',
                array(),
                WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION,
                'all'
            );

            $versions = 'Woo Better v' . $this->version . ' | WooCommerce v' . WC()->version;
            ;

            wc_get_template(
                'WcBetterShippingCalculatorForBrazilAdminSettingsCard.php',
                array(
                        'backgrounds' => array(
                            'right' => plugin_dir_url(__FILE__) . 'assets/icons/backgroundCardRight.svg',
                            'left' => plugin_dir_url(__FILE__) . 'assets/icons/backgroundCardLeft.svg'
                        ),
                        'logo' => plugin_dir_url(__FILE__) . 'assets/icons/linkNacionalLogo.webp',
                        'whatsapp' => plugin_dir_url(__FILE__) . 'assets/icons/whatsapp.svg',
                        'telegram' => plugin_dir_url(__FILE__) . 'assets/icons/telegram.svg',
                        'stars' => plugin_dir_url(__FILE__) . 'assets/icons/stars.svg',
                        'versions' => $versions

                    ),
                'woocommerce/WcBetterShippingCalculatorForBrazilAdminSettingsCard/',
                plugin_dir_path(__FILE__) . 'assets/templates/'
            );
        }
    }

    public function lkn_add_settings_link($links)
    {
        $url = esc_url(admin_url('admin.php?page=wc-settings&tab=wc-better-calc-checkout'));

        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            $url,
            esc_html__('Configurações', 'woo-better-shipping-calculator-for-brazil')
        );

        $links[] = $settings_link;
        return $links;
    }


    public function lkn_add_woo_better_checkout_settings_page($settings)
    {
        // Aba "Calculadora de Frete" deve vir antes de "Campos Brasileiros".
        $settings[] = new WcBetterShippingCalculatorForBrazilShippingCalculatorSettings();
        $settings[] = new WcBetterShippingCalculatorForBrazilCheckoutSettings();
        return $settings;
    }

    public function lkn_add_custom_checkout_field($fields)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');

        if ($number_field === 'yes') {
            // Adiciona um novo campo dentro do endereço de cobrança
            $fields['billing']['billing_number'] = array(
                'label'       => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Ex: 123a', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 55,
            );

            $fields['shipping']['shipping_number'] = array(
                'label'       => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Ex: 123a', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 55,
            );

        }

        // Adiciona campo de data de nascimento
        $birthdate_field = get_option('woo_better_calc_enable_birthdate_field', 'no');
        if ($birthdate_field === 'yes') {
            $fields['billing']['billing_birthdate'] = array(
                'label'       => __('Data de Nascimento', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('dd/mm/aaaa', 'woo-better-shipping-calculator-for-brazil'),
                'type'        => 'date',
                'required'    => get_option('woo_better_calc_birthdate_required', 'yes') === 'yes',
                'class'       => array('form-row-wide'),
                'priority'    => 25,
            );
        }

        // Adiciona campo de gênero
        $gender_field = get_option('woo_better_calc_enable_gender_field', 'no');
        if ($gender_field === 'yes') {
            $fields['billing']['billing_gender'] = array(
                'label'       => __('Gênero', 'woo-better-shipping-calculator-for-brazil'),
                'type'        => 'select',
                'options'     => array(
                    ''                                                    => __('Selecione...', 'woo-better-shipping-calculator-for-brazil'),
                    __('Masculino', 'woo-better-shipping-calculator-for-brazil')      => __('Masculino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Feminino', 'woo-better-shipping-calculator-for-brazil')       => __('Feminino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Não-binário', 'woo-better-shipping-calculator-for-brazil')    => __('Não-binário', 'woo-better-shipping-calculator-for-brazil'),
                    __('Outro', 'woo-better-shipping-calculator-for-brazil')          => __('Outro', 'woo-better-shipping-calculator-for-brazil'),
                    __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil') => __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'required'    => false,
                'class'       => array('form-row-wide'),
                'priority'    => 26,
            );
        }

        return $fields;
    }

    /**
     * Ajusta o placeholder do campo address_1 no momento da renderização (woocommerce_form_field_args).
     * Esta é a última oportunidade de modificar o placeholder, após todos os filtros de campos.
     *
     * @param array  $args  Argumentos do campo (inclui 'placeholder').
     * @param string $key   Chave do campo (ex: 'billing_address_1').
     * @param mixed  $value Valor atual do campo.
     * @return array
     */
    public function lkn_adjust_address_placeholder($args, $key, $value)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');
        if ($number_field !== 'yes') {
            return $args;
        }

        // Apenas para os campos de endereço (billing e shipping)
        if ($key === 'billing_address_1' || $key === 'shipping_address_1') {
            $args['placeholder'] = __('Nome da rua', 'woo-better-shipping-calculator-for-brazil');

            // Remove data-placeholder de custom_attributes caso exista (adicionado por terceiros)
            if (isset($args['custom_attributes']['data-placeholder'])) {
                unset($args['custom_attributes']['data-placeholder']);
            }
        }

        // Se description já foi definido por terceiros, substitui por "Nome da rua";
        // se não existia, mantém vazio para não criar o <span> desnecessariamente.
        if ($key === 'billing_address_1' || $key === 'shipping_address_1' || $key === 'billing_address_2' || $key === 'shipping_address_2') {
            if (! empty($args['description'])) {
                $args['description'] = __('Nome da rua', 'woo-better-shipping-calculator-for-brazil');
            }
        }

        return $args;
    }

    /**
     * Register all of the hooks related to the public-facing functionality
     * of the plugin.
     *
     * @since    1.0.0
     * @access   private
     */
    private function define_public_hooks()
    {
        $plugin_public = new WcBetterShippingCalculatorForBrazilPublic($this->get_plugin_name(), $this->get_version());

        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_styles');
        $this->loader->add_action('wp_enqueue_scripts', $plugin_public, 'enqueue_scripts', 900);

        $this->loader->add_filter('woocommerce_checkout_fields', $this, 'wc_better_calc_checkout_fields', 999);
        $this->loader->add_filter( 'wc_address_i18n_params', $this, 'postcode_param_priority', 999);
        
        $this->loader->add_action('wp_ajax_wc_better_insert_address', $this, 'wc_better_insert_address');
        $this->loader->add_action('wp_ajax_nopriv_wc_better_insert_address', $this, 'wc_better_insert_address');

        // O filtro do locale do telefone PRECISA rodar DEPOIS do
        // `address_fields_priority` do plugin "Brazilian Market on WooCommerce"
        // (woocommerce-extra-checkout-fields-for-brazil), que em `woocommerce_get_country_locale`
        // (prioridade 10) faz `$locales['BR'] = array( 'postcode' => ... )` — substituindo
        // o array BR INTEIRO e apagando o nosso `phone` (required/label). Como o
        // address-i18n.js aplica o `required` do locale no cliente, sem a nossa entrada
        // o telefone vira "(opcional)" no checkout clássico. Rodamos em prioridade 20
        // (após os filtros 10/11) para reafirmar a configuração do woo-better.
        $this->loader->add_action('woocommerce_get_country_locale', $this, 'wc_better_calc_phone_number', 20, 1);
        $this->loader->add_filter('woocommerce_get_country_locale', $this, 'lkn_checkout_fields_locale_priority', 11, 1);

        $this->loader->add_action('woocommerce_init', $this, 'init_woocommerce');

        $this->loader->add_action('woocommerce_checkout_order_processed', $this, 'process_checkout_data_classic', 10, 2);
        $this->loader->add_action('woocommerce_store_api_checkout_update_order_from_request', $this, 'process_checkout_data_blocks', 10, 2);

        // No checkout CLÁSSICO o core salva o customer a partir do campo NATIVO (valor
        // cru). Este hook roda logo ANTES desse save — ajustamos o telefone para o
        // E.164 normalizado, de modo que a própria gravação do core já use o valor certo.
        $this->loader->add_action('woocommerce_checkout_update_customer', $this, 'sync_customer_phone_on_classic_checkout', 10, 2);

        $this->loader->add_action('woocommerce_admin_order_data_after_billing_address', $this, 'woo_better_billing_customer_data');
        $this->loader->add_action('woocommerce_admin_order_data_after_shipping_address', $this, 'woo_better_shipping_customer_data');

        // O woo-better assume o bloco "Dados do Cliente" no admin do pedido; desativa
        // o bloco equivalente do plugin "Brazilian Market on WooCommerce" (o nosso é
        // mais completo). Roda no `init` (depois de todos os plugins carregarem).
        $this->loader->add_action('init', $this, 'suppress_brazilian_customer_block', 99);
        
        // Hooks para customizar campos do admin
        $this->loader->add_filter('woocommerce_admin_billing_fields', $this, 'customize_admin_billing_fields');
        $this->loader->add_filter('woocommerce_admin_shipping_fields', $this, 'customize_admin_shipping_fields');

        // Garante Telefone + Celular nos campos EDITÁVEIS do admin do pedido
        // (billing e shipping). Roda em prioridade alta (99) e apenas ADICIONA os
        // campos que faltarem — sem reconstruir o array —, então convive com o
        // plugin "Brazilian Market on WooCommerce" (que preenche o billing mas
        // remove o telefone do shipping) e com o nosso próprio customize_admin_*.
        $this->loader->add_filter('woocommerce_admin_billing_fields', $this, 'ensure_admin_phone_fields_billing', 99, 1);
        $this->loader->add_filter('woocommerce_admin_shipping_fields', $this, 'ensure_admin_phone_fields_shipping', 99, 1);

        // Garante o campo RG nos campos EDITÁVEIS de cobrança do admin do pedido.
        // Aditivo e em prioridade 99 (mesma estratégia do Telefone/Celular) para
        // valer também com o plugin "Brazilian Market on WooCommerce" ativo —
        // recurso ligado no woo-better vence a disputa pelo mesmo campo.
        $this->loader->add_filter('woocommerce_admin_billing_fields', $this, 'ensure_admin_rg_field_billing', 99, 1);

        // Preenche o "Celular" ao usar "Carregar endereço de cobrança/entrega" no
        // admin do pedido (o WooCommerce só traz os campos nativos; o celular é o
        // nosso campo extra). O JS do WC faz `#_<tipo>_<chave>` para cada chave
        // devolvida, então basta acrescentar `cellphone` às duas.
        $this->loader->add_filter('woocommerce_ajax_get_customer_details', $this, 'add_cellphone_to_customer_details', 10, 3);
        
        // Hook para salvar campos brasileiros
        $this->loader->add_action('woocommerce_process_shop_order_meta', $this, 'save_brazilian_fields');
        
        // Hooks para integrar bairro no endereço formatado dentro do bloco
        $this->loader->add_filter('woocommerce_formatted_address_replacements', $this, 'add_neighborhood_replacement', 10, 2);
        $this->loader->add_filter('woocommerce_localisation_address_formats', $this, 'add_neighborhood_to_address_format', 10, 1);
        $this->loader->add_filter('woocommerce_order_formatted_billing_address', $this, 'add_neighborhood_to_billing_address', 10, 2);
        $this->loader->add_filter('woocommerce_order_formatted_shipping_address', $this, 'add_neighborhood_to_shipping_address', 10, 2);
        
        // Hooks para formatação de telefone no pedido final
        $this->loader->add_filter('woocommerce_order_get_billing_phone', $this, 'format_order_billing_phone', 10, 2);
        $this->loader->add_filter('woocommerce_order_get_shipping_phone', $this, 'format_order_shipping_phone', 10, 2);

        // O "Celular" aparece DENTRO do endereço de cobrança e de entrega, logo
        // ABAIXO do telefone que o WooCommerce já imprime — NÃO no bloco "Informações
        // adicionais" (lá ficam só os campos brasileiros que o WC não conhece).
        // Dois caminhos, um por tipo de tema:
        //  - `woocommerce_order_details_after_customer_address` (WC >= 8.7): hook
        //    nativo disparado DENTRO do `<address>` do template
        //    `order/order-details-customer.php`, exatamente depois do telefone.
        //    Cobre order-received e "ver pedido" da conta no tema CLÁSSICO;
        //  - `render_block`: tema de BLOCO renderiza o order-confirmation pelo bloco
        //    `woocommerce/order-confirmation-{billing,shipping}-address`, que NÃO
        //    dispara aquele hook — o celular é anexado ao fim do bloco (o telefone é
        //    o último elemento do conteúdo nativo dele).
        $this->loader->add_action('woocommerce_order_details_after_customer_address', $this, 'render_address_cellphone', 10, 2);
        $this->loader->add_filter('render_block', $this, 'render_block_address_cellphone', 10, 2);

        // No tema CLÁSSICO o template imprime, nesta ordem: endereço formatado →
        // telefone → E-MAIL → `woocommerce_order_details_after_customer_address`.
        // Como o e-mail vem ANTES do hook, o celular caía ABAIXO dele. Para ele ficar
        // ACIMA do e-mail (logo depois do telefone), o trecho do template é capturado
        // num buffer curto e as duas linhas são trocadas de lugar:
        //   · `woocommerce_after_order_details` (dispara IMEDIATAMENTE antes do
        //     `wc_get_template('order/order-details-customer.php')`) abre o buffer;
        //   · `woocommerce_order_details_after_customer_details` (dispara dentro do
        //     template, depois dos endereços) fecha e reordena — prioridade 1 para
        //     acontecer antes do bloco "Informações adicionais" (prioridade 10).
        // O buffer só é aberto quando existe MESMO celular próprio na cobrança; e há
        // redes de segurança (`woocommerce_thankyou`/`wp_footer`) para o caso de um
        // tema que não dispare o hook interno, para o buffer nunca ficar aberto.
        $this->loader->add_action('woocommerce_after_order_details', $this, 'start_customer_details_buffer', 1, 1);
        $this->loader->add_action('woocommerce_order_details_after_customer_details', $this, 'flush_customer_details_buffer', 1, 1);
        $this->loader->add_action('woocommerce_thankyou', $this, 'flush_customer_details_buffer', 98, 1);
        $this->loader->add_action('wp_footer', $this, 'flush_customer_details_buffer', 1, 1);
        // Bloco "Informações adicionais" (contato + campos brasileiros) na tela de
        // detalhes do cliente. Renderizado via DOIS hooks para cobrir TODOS os temas:
        //  - `woocommerce_thankyou`: disparado pelo checkout em BLOCOS (pelo bloco
        //    "order-confirmation-additional-information") e pelo clássico;
        //  - `woocommerce_order_details_after_customer_details`: disparado pelo
        //    template CLÁSSICO (order-received e "ver pedido" da conta).
        // O método é IDEMPOTENTE (renderiza uma vez por pedido), então não duplica
        // quando os dois hooks disparam para o mesmo pedido. Só existe na tela de
        // detalhes do pedido — NÃO é enviado em e-mails nem vai para o endereço de
        // entrega. As linhas passam pelo filtro `woo_better_customer_details_rows`
        // (padrão: só os campos do woo-better) para permitir extensão.
        //
        // PRIORIDADE do `woocommerce_thankyou`: 99 (fallback, por ÚLTIMO).
        // O core registra `woocommerce_order_details_table` nesse mesmo hook com
        // prioridade 10, e é ele quem imprime a tabela do pedido E os endereços
        // (de onde sai o `..._after_customer_details`). Como este plugin é carregado
        // ANTES do WooCommerce (ordem alfabética das pastas: `woo-better-…` <
        // `woocommerce`), o nosso callback ficava registrado primeiro e — por causa
        // do "renderiza uma vez" — o bloco aparecia no TOPO da página de pedido
        // recebido, antes do resumo e dos endereços. Com 99 o hook natural
        // (depois dos endereços) sempre vence, e este fica só como rede de
        // segurança para temas que não renderizam os endereços.
        $this->loader->add_action('woocommerce_thankyou', $this, 'render_customer_additional_info', 99, 1);
        $this->loader->add_action('woocommerce_order_details_after_customer_details', $this, 'render_customer_additional_info', 10, 1);
        // Hook para validação de CPF/CNPJ no checkout
        $this->loader->add_action('woocommerce_checkout_process', $this, 'validate_person_type_documents');
        
        // Hook para validação de data de nascimento no checkout
        $this->loader->add_action('woocommerce_checkout_process', $this, 'validate_birthdate_value');

        // Hook para validação de Inscrição Estadual (IE) no checkout clássico
        $this->loader->add_action('woocommerce_checkout_process', $this, 'validate_ie_field_value_classic');

        // Hook para validação de Inscrição Municipal (IM) no checkout clássico
        $this->loader->add_action('woocommerce_checkout_process', $this, 'validate_im_field_value_classic');

        // Hook para validação do RG no checkout clássico (obrigatório opcional)
        $this->loader->add_action('woocommerce_checkout_process', $this, 'validate_rg_field_value_classic');

        // Hook para validação de DDD do telefone no checkout clássico
        $this->loader->add_action('woocommerce_checkout_process', $this, 'validate_phone_ddd_classic');
        
        // Detecta o plugin oficial "Brazilian Market on WooCommerce" uma única vez.
        $brazilian_plugin_active = $this->is_brazilian_plugin_active();

        // Hooks para compatibilidade com APIs REST (conversão F/J) - apenas se plugin oficial não estiver ativo
        if (!$brazilian_plugin_active) {
            // Legacy REST API
            $this->loader->add_filter('woocommerce_api_order_response', $this, 'legacy_orders_response', 90, 4);
            $this->loader->add_filter('woocommerce_api_customer_response', $this, 'legacy_customers_response', 90, 4);
            
            // WP REST API
            $this->loader->add_filter('woocommerce_rest_prepare_customer', $this, 'customers_response', 90, 2);
            $this->loader->add_filter('woocommerce_rest_prepare_shop_order', $this, 'orders_v1_response', 90, 2);
            $this->loader->add_filter('woocommerce_rest_prepare_shop_order_object', $this, 'orders_response', 90, 2);
        }

        // REASON: quando o woo-better gerencia os campos de pessoa física/jurídica,
        // o campo Empresa é decidido pelo próprio plugin (modo Dinâmico) ou pelo
        // WooCommerce (modos Opcional/Obrigatório). O plugin "Brazilian Market on
        // WooCommerce" (woocommerce-extra-checkout-fields-for-brazil), porém, força
        // "Company is a required field" no checkout clássico/shortcode via
        // wc_add_notice() no hook woocommerce_checkout_process sempre que o documento
        // for CNPJ — fora do objeto $errors tratado em lkn_disabled_require_field(),
        // o que bloqueava o envio mesmo com o campo Empresa configurado como Opcional.
        // Removemos esse aviso do session na prioridade 11 (depois do Brazilian, 10)
        // para dar prioridade à configuração do woo-better (o Brazilian está sem
        // manutenção há anos). Só age quando o recurso de tipo de pessoa está ativo;
        // do contrário o Brazilian segue no comando.
        if ($brazilian_plugin_active) {
            $this->loader->add_action('woocommerce_checkout_process', $this, 'guard_brazilian_company_required', 11, 1);

            // RG: o Brazilian exige o RG sempre que a opção DELE (`wcbcf_settings['rg']`)
            // está ligada — ignorando a nossa ("RG obrigatório" começa DESLIGADO) e o
            // fato de o campo só existir para CPF. Com o nosso recurso ligado, a
            // configuração do woo-better vence (mesma lógica do campo Empresa).
            $this->loader->add_action('woocommerce_checkout_process', $this, 'guard_brazilian_rg_required', 11, 1);
        }

        // Campos de telefone conforme o "Comportamento do Campo de Telefone" (woo_better_calc_phone_mode).
        // Nos modos "Celular e Fixo" e "Somente Celular" registramos um campo "Celular"
        // (`*_cellphone`) logo abaixo do bloco de telefone. A prioridade 99 roda ANTES de
        // outros plugins (ex.: PagBank, que usa 100) e que só inserem o `billing_cellphone`
        // deles quando `!isset` — como o nosso já existe, evita telefone duplicado.
        // Em "Somente Celular" o telefone nativo fica oculto e o TELEFONE do pedido fica
        // VAZIO (o número é guardado em `*_cellphone`); o recibo exibe o celular no lugar
        // do telefone.
        $this->loader->add_filter('woocommerce_billing_fields', $this, 'add_cellphone_billing_fields', 99, 1);
        $this->loader->add_filter('woocommerce_shipping_fields', $this, 'add_cellphone_shipping_fields', 99, 1);
        $this->loader->add_filter('woocommerce_checkout_posted_data', $this, 'handle_cellphone_posted_data', 10, 1);

        // REASON: o JS de front-end do plugin "Brazilian Market on WooCommerce"
        // (assets/js/frontend/frontend.js) esconde TODOS os elementos .person-type-field
        // quando o tipo de pessoa é CPF e, para CNPJ, re-adiciona 'validate-required' ao
        // campo Empresa — fazendo o campo sumir nos modos Opcional/Obrigatório e bloquear
        // o envio em "Opcional + CNPJ vazio". Como o woo-better substitui os recursos do
        // Brazilian no checkout (máscaras, tipo de pessoa, IE, bairro), desenfileiramos o
        // script dele no checkout clássico/shortcode para que a configuração do woo-better
        // prevaleça. A classe 'person-type-field' é PRESERVADA no HTML (não removemos a
        // classe) para não quebrar outros consumidores. O callback só age quando o
        // woo-better gerencia os campos de pessoa.
        $this->loader->add_action('woocommerce_after_checkout_form', $this, 'dequeue_brazilian_checkout_scripts', 20, 0);
        
        // Campos personalizados na página de perfil (wp-admin/profile.php) e de
        // edição de usuário (user-edit.php). REASON: o plugin "Brazilian Market on
        // WooCommerce" registra o callback dele em woocommerce_customer_meta_fields
        // na prioridade 10 e REConstrói o array do zero, apagando os campos do
        // woo-better (documento unificado, IM) e derrubando o telefone no bloco de
        // entrega. Como o Brazilian carrega DEPOIS do woo-better, no empate ele
        // venceria; por isso rodamos em prioridade 99 (após o Brazilian) para o
        // woo-better prevalecer também no perfil.
        $this->loader->add_filter('woocommerce_customer_meta_fields', $this, 'add_customer_meta_fields', 99);

        // Salva (e normaliza) os campos do woo-better no perfil. O WooCommerce salva
        // os campos nativos em personal_options_update/edit_user_profile_update
        // (prioridade 10); rodamos depois (20) para dividir o documento unificado em
        // CPF/CNPJ/persontype e gravar os telefones no formato E.164 (+55 + dígitos).
        $this->loader->add_action('personal_options_update', $this, 'save_customer_meta_fields_extra', 20, 1);
        $this->loader->add_action('edit_user_profile_update', $this, 'save_customer_meta_fields_extra', 20, 1);

        
        // Hooks para adicionar campos personalizados na página de edição de endereço da conta.
        // REASON: o plugin "Brazilian Market on WooCommerce" registra os campos dele em
        // woocommerce_billing_fields/woocommerce_shipping_fields na prioridade 10 e REConstrói
        // o array do zero. Como o Brazilian carrega DEPOIS do woo-better, no empate de
        // prioridade ele vence e o woo-better some da tela "Minha conta > editar endereço".
        // No checkout clássico isso não ocorre porque reafirmamos em woocommerce_checkout_fields
        // (prio 999), hook que o edit-address NÃO dispara. Rodamos aqui em prioridade 99
        // (após o Brazilian) para o woo-better prevalecer também no edit-address.
        $this->loader->add_filter('woocommerce_billing_fields', $this, 'add_edit_address_billing_fields', 99);
        $this->loader->add_filter('woocommerce_shipping_fields', $this, 'add_edit_address_shipping_fields', 99);
        $this->loader->add_action('woocommerce_customer_save_address', $this, 'save_edit_address_custom_fields', 10, 2);

        // Remove a obrigatoriedade da IE no envio da página "minha conta > editar
        // endereço" quando o documento informado for CPF. O campo é gerado como
        // required=true (acima) e o JS só cuida do visual; esta é a remoção real
        // da validação no servidor (WC_Form_Handler::save_address).
        $this->loader->add_filter('woocommerce_billing_fields', $this, 'disable_ie_required_on_edit_address_submit', 100, 1);
        
        // Hook para formatação de endereço na página Minha Conta
        $this->loader->add_filter('woocommerce_my_account_my_address_formatted_address', $this, 'my_account_formatted_address', 10, 3);

        // O campo de telefone do checkout CLÁSSICO é preenchido pelo core a partir do
        // CADASTRO do cliente — sem este filtro, um resíduo inválido salvo no perfil
        // (ex.: DDI repetido por um build antigo) era exibido no campo.
        $this->loader->add_filter('woocommerce_checkout_get_value', $this, 'sanitize_checkout_phone_default_value', 10, 2);

        // Integração com FunnelKit Checkout: habilita blocos brasileiros no drag-and-drop
        $this->loader->add_filter('pre_option_wcbcf_settings', $this, 'funnelkit_get_wcbcf_settings', 10, 1);
    }

    public function postcode_param_priority( $params ) {
        // Verifica se o reposicionamento do CEP está ativo
        $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $postcode_priority = 32;

        if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $postcode_priority = 34;
        }
        
        // Só aplica a prioridade se a opção estiver ativa
        if ($cep_position === 'yes') {
            $locales = json_decode( $params['locale'], true );
            foreach ( $locales as &$locale ) {
                if ( isset( $locale['postcode'] ) ) {
                    $locale['postcode']['priority'] = $postcode_priority;
                }
            }
            $params['locale'] = wp_json_encode( $locales );
        }
        
        return $params;
    }

    /**
     * Customiza campos de faturação no admin do pedido
     *
     * @param array $fields
     * @return array
     */
    public function customize_admin_billing_fields($fields)
    {
        // Verifica se a exibição de detalhes está habilitada
        $enable_order_details = get_option('woo_better_calc_enable_order_details', 'yes');
        if ($enable_order_details !== 'yes') {
            return $fields;
        }
        
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não modifica os campos
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $fields;
        }
        
        // Adicionar campos brasileiros
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $number_field = get_option('woo_better_calc_number_required', 'no');
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        // Reorganizar campos para posicionar bairro após address_1
        $original_fields = $fields;
        $fields = array();
        
        // Adicionar campos na ordem desejada
        // 1. Nome e sobrenome primeiro
        if (isset($original_fields['first_name'])) {
            $fields['first_name'] = $original_fields['first_name'];
            unset($original_fields['first_name']);
        }
        if (isset($original_fields['last_name'])) {
            $fields['last_name'] = $original_fields['last_name'];
            unset($original_fields['last_name']);
        }
        
        // 2. Campos brasileiros no topo (após sobrenome)
        if ($person_type === 'both') {
            $fields['persontype'] = array(
                'label' => __('Tipo de Pessoa', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'select',
                'options' => array(
                    '' => __('Selecione', 'woo-better-shipping-calculator-for-brazil'),
                    '0' => __('Nenhum', 'woo-better-shipping-calculator-for-brazil'),
                    '1' => __('Pessoa Física', 'woo-better-shipping-calculator-for-brazil'),
                    '2' => __('Pessoa Jurídica', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'show'  => false
            );
        }
        
        if ($person_type === 'physical' || $person_type === 'both') {
            $fields['cpf'] = array(
                'label' => __('CPF', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );

            // RG: documento de pessoa física, logo abaixo do CPF (mesmo meta
            // `_billing_rg` usado pelos aplicativos de NF-e).
            if ($this->rg_field_enabled()) {
                $fields['rg'] = array(
                    'label' => __('RG', 'woo-better-shipping-calculator-for-brazil'),
                    'type'  => 'text',
                    'show'  => false
                );
            }
        }
        
        if ($person_type === 'legal' || $person_type === 'both') {
            $fields['cnpj'] = array(
                'label' => __('CNPJ', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );
        }  
        // 3. Campo empresa (se for pessoa jurídica)
        if ($person_type === 'legal' || $person_type === 'both') {
            if (isset($original_fields['company'])) {
                $fields['company'] = $original_fields['company'];
                unset($original_fields['company']);
            } else {
                // Criar campo company se não existir
                $fields['company'] = array(
                    'label' => __('Empresa', 'woo-better-shipping-calculator-for-brazil'),
                    'show'  => false
                );
            }
        } else if (isset($original_fields['company'])) {
            // Se não é pessoa jurídica mas campo existe, manter na posição original
            $fields['company'] = $original_fields['company'];
            unset($original_fields['company']);
        }

        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $fields['ie'] = array(
                'label' => __('Inscrição Estadual', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );
        }

        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
        if ($im_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $fields['im'] = array(
                'label' => __('Inscrição Municipal', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );
        }

        // 4. Endereço linha 1
        if (isset($original_fields['address_1'])) {
            $fields['address_1'] = $original_fields['address_1'];
            unset($original_fields['address_1']);
        }
        
        // 5. Número logo após address_1 (no lugar do bairro)
        if ($number_field === 'yes') {
            $fields['number'] = array(
                'label' => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );
        }
        
        // 6. Endereço linha 2
        if (isset($original_fields['address_2'])) {
            $fields['address_2'] = $original_fields['address_2'];
            unset($original_fields['address_2']);
        }
        
        // 7. Bairro antes da cidade
        if ($neighborhood_enabled === 'yes') {
            $fields['neighborhood'] = array(
                'label' => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );
        }
        
        // 8. Continuar com cidade e demais campos
        $remaining_standard = ['city', 'postcode', 'country', 'state'];
        foreach ($remaining_standard as $key) {
            if (isset($original_fields[$key])) {
                $fields[$key] = $original_fields[$key];
                unset($original_fields[$key]);
            }
        }
        
        // Email e telefone
        $fields['email'] = array(
            'label' => __('Endereço de e-mail', 'woo-better-shipping-calculator-for-brazil'),
            'type'  => 'email',
            'show'  => false
        );
        
        $fields['phone'] = array(
            'label' => __('Telefone', 'woo-better-shipping-calculator-for-brazil'),
            'type'  => 'tel',
            'show'  => false
        );
        
        // Campo de data de nascimento
        $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
        if ($birthdate_enabled === 'yes') {
            $fields['birthdate'] = array(
                'label' => __('Data de Nascimento', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'date',
                'show'  => false
            );
        }
        
        // Campo de gênero
        $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
        if ($gender_enabled === 'yes') {
            $fields['gender'] = array(
                'label' => __('Gênero', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'select',
                'options' => array(
                    '' => __('Selecione...', 'woo-better-shipping-calculator-for-brazil'),
                    __('Masculino', 'woo-better-shipping-calculator-for-brazil') => __('Masculino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Feminino', 'woo-better-shipping-calculator-for-brazil') => __('Feminino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Não-binário', 'woo-better-shipping-calculator-for-brazil') => __('Não-binário', 'woo-better-shipping-calculator-for-brazil'),
                    __('Outro', 'woo-better-shipping-calculator-for-brazil') => __('Outro', 'woo-better-shipping-calculator-for-brazil'),
                    __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil') => __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'show'  => false
            );
        }
        
        // Adicionar qualquer campo restante não processado
        foreach ($original_fields as $key => $field) {
            if (!isset($fields[$key])) {
                $fields[$key] = $field;
            }
        }
        
        
        return $fields;
    }

    /**
     * Customiza campos de entrega no admin do pedido
     *
     * @param array $fields
     * @return array
     */
    public function customize_admin_shipping_fields($fields)
    {
        // Verifica se a exibição de detalhes está habilitada
        $enable_order_details = get_option('woo_better_calc_enable_order_details', 'yes');
        if ($enable_order_details !== 'yes') {
            return $fields;
        }
        
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não modifica os campos
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $fields;
        }
        
        // Configurações dos campos
        $number_field = get_option('woo_better_calc_number_required', 'no');
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        // Salvamos os campos originais
        $original_fields = $fields;
        
        // Iniciamos um novo array reorganizado
        $fields = array();
        
        // Nomes primeiro
        if (isset($original_fields['first_name'])) {
            $fields['first_name'] = $original_fields['first_name'];
            $fields['first_name']['show'] = false;
        }
        
        if (isset($original_fields['last_name'])) {
            $fields['last_name'] = $original_fields['last_name'];
            $fields['last_name']['show'] = false;
        }
        
        // Company
        if (isset($original_fields['company'])) {
            $fields['company'] = $original_fields['company'];
            $fields['company']['show'] = false;
        }
        
        // Endereço
        if (isset($original_fields['address_1'])) {
            $fields['address_1'] = $original_fields['address_1'];
            $fields['address_1']['show'] = false;
        }
        
        // Número (após address_1, no lugar do bairro)
        if ($number_field === 'yes') {
            $fields['number'] = array(
                'label' => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );
        }
        
        // Complemento
        if (isset($original_fields['address_2'])) {
            $fields['address_2'] = $original_fields['address_2'];
            $fields['address_2']['show'] = false;
        }
        
        // Bairro (antes da cidade)
        if ($neighborhood_enabled === 'yes') {
            $fields['neighborhood'] = array(
                'label' => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'text',
                'show'  => false
            );
        }
        
        // Cidade
        if (isset($original_fields['city'])) {
            $fields['city'] = $original_fields['city'];
            $fields['city']['show'] = false;
        }
        
        // CEP
        $fields['postcode'] = array(
            'label' => __('CEP', 'woo-better-shipping-calculator-for-brazil'),
            'type'  => 'text',
            'show'  => false
        );
        
        // País
        if (isset($original_fields['country'])) {
            $fields['country'] = $original_fields['country'];
            $fields['country']['show'] = false;
        }
        
        // Estado
        if (isset($original_fields['state'])) {
            $fields['state'] = $original_fields['state'];
            $fields['state']['show'] = false;
        }
        
        // Campo Telefone
        $fields['phone'] = array(
            'label' => __('Telefone', 'woo-better-shipping-calculator-for-brazil'),
            'type'  => 'tel',
            'show'  => false
        );
        
        // Adicionar qualquer campo restante não processado
        foreach ($original_fields as $key => $field) {
            if (!isset($fields[$key])) {
                $fields[$key] = $field;
            }
        }
        
        
        return $fields;
    }

    /**
     * Garante o campo "Telefone" (e "Celular") nos campos de COBRANÇA editáveis do
     * admin do pedido.
     *
     * @param array $fields
     * @return array
     */
    public function ensure_admin_phone_fields_billing($fields)
    {
        return $this->ensure_admin_phone_fields($fields);
    }

    /**
     * Garante o campo "Telefone" (e "Celular") nos campos de ENTREGA editáveis do
     * admin do pedido.
     *
     * @param array $fields
     * @return array
     */
    public function ensure_admin_phone_fields_shipping($fields)
    {
        return $this->ensure_admin_phone_fields($fields);
    }

    /**
     * Garante o campo RG nos campos de cobrança editáveis do admin do pedido.
     *
     * Roda em prioridade 99 e é puramente ADITIVO — não reconstrói nem reordena o
     * array recebido —, para valer também quando o plugin "Brazilian Market on
     * WooCommerce" (que também registra `_billing_rg`) estiver ativo: recurso
     * ligado no woo-better vence a disputa pelo mesmo campo.
     *
     * @param array $fields
     * @return array
     */
    public function ensure_admin_rg_field_billing($fields)
    {
        if (! is_array($fields) || ! $this->rg_field_enabled()) {
            return $fields;
        }

        // Espelha o gate dos campos de Telefone/Celular ("Exibir detalhes do pedido").
        if (get_option('woo_better_calc_enable_order_details', 'yes') !== 'yes') {
            return $fields;
        }

        $rg = array(
            'label' => __('RG', 'woo-better-shipping-calculator-for-brazil'),
            'type'  => 'text',
            'show'  => false,
        );

        if (isset($fields['rg']) && is_array($fields['rg'])) {
            $fields['rg'] = array_merge($fields['rg'], $rg);
        } else {
            $fields['rg'] = $rg;
        }

        return $fields;
    }

    /**
     * Adiciona "Telefone"/"Celular" aos campos do pedido (admin) SE faltarem.
     *
     * Roda em prioridade alta (99) e é puramente ADITIVO — nunca reconstrói nem
     * reordena o array recebido —, para conviver com o plugin "Brazilian Market on
     * WooCommerce" (que remove o telefone do bloco de entrega) e com o nosso próprio
     * `customize_admin_*_fields`. Só age quando o plugin gerencia o telefone.
     *
     * @param array $fields
     * @return array
     */
    private function ensure_admin_phone_fields($fields)
    {
        if (! is_array($fields)) {
            return $fields;
        }

        // Respeita "Exibir detalhes do pedido" e o modo "Desabilitar".
        if (get_option('woo_better_calc_enable_order_details', 'yes') !== 'yes') {
            return $fields;
        }

        $mode = $this->get_phone_mode();
        if ('disabled' === $mode) {
            return $fields;
        }

        // Modo "Somente Celular": existe APENAS o campo Celular (o telefone fica vazio
        // por design — o número vai para `_billing_cellphone`). Mostramos só o celular
        // (com o valor) rotulado "Celular" e REMOVEMOS o `_billing_phone` vazio, que só
        // confundiria. Aqui o "Campo de Celular" secundário é forçado a desligar, então
        // o celular É o campo principal.
        if ('cellphone_only' === $mode) {
            unset($fields['phone']);

            $cellphone = array(
                'label' => __('Celular', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'tel',
                'show'  => false,
            );
            if (isset($fields['cellphone']) && is_array($fields['cellphone'])) {
                $fields['cellphone'] = array_merge($fields['cellphone'], $cellphone);
            } else {
                $fields['cellphone'] = $cellphone;
            }

            return $fields;
        }

        // A label do telefone SEGUE o "Comportamento do Campo de Telefone" (ex.:
        // "Celular/Telefone"), mesmo quando o campo já veio de outro plugin (ex.:
        // Brazilian) ou do padrão do WooCommerce.
        $phone = array(
            'label' => $this->get_phone_field_label(),
            'type'  => 'tel',
            'show'  => false,
        );
        if (isset($fields['phone']) && is_array($fields['phone'])) {
            $fields['phone'] = array_merge($fields['phone'], $phone);
        } else {
            $fields['phone'] = $phone;
        }

        // Celular quando o modo GERA a meta de celular (campo visível OU shim
        // escondido), para cobrança e entrega ficarem consistentes. Nos modos
        // "Somente Fixo"/"Desabilitar" não há celular a exibir.
        if ($this->phone_mode_stores_cellphone()) {
            $cellphone = array(
                'label' => __('Celular (secundário)', 'woo-better-shipping-calculator-for-brazil'),
                'type'  => 'tel',
                'show'  => false,
            );
            if (isset($fields['cellphone']) && is_array($fields['cellphone'])) {
                $fields['cellphone'] = array_merge($fields['cellphone'], $cellphone);
            } else {
                $fields['cellphone'] = $cellphone;
            }
        } else {
            // O woo-better gerencia o telefone mas NÃO cria campo de celular:
            // remove qualquer `cellphone` que tenha vindo de outro plugin. O
            // "Brazilian Market on WooCommerce", por exemplo, adiciona o
            // `_billing_cellphone` SÓ na cobrança — sobrava um campo órfão "Celular"
            // apenas ali, inconsistente com a entrega e sem relação com a config
            // atual do woo-better (o telefone principal já cobre fixo/celular).
            unset($fields['cellphone']);
        }

        return $fields;
    }

    /**
     * Acrescenta o "Celular" ao retorno do AJAX "Carregar endereço" do admin do
     * pedido, para os campos de cobrança e entrega.
     *
     * O JS do WooCommerce (`meta-boxes-order.js`) preenche `#_<tipo>_<chave>` para
     * cada chave devolvida em `billing`/`shipping`. Como o celular é um campo extra
     * do plugin (não nativo), precisamos devolvê-lo aqui.
     *
     * @param array       $data     Dados do cliente (billing/shipping + extras).
     * @param \WC_Customer $customer Cliente.
     * @param int         $user_id
     * @return array
     */
    public function add_cellphone_to_customer_details($data, $customer, $user_id = 0)
    {
        if (! is_array($data) || ! $customer instanceof \WC_Customer) {
            return $data;
        }

        if (! $this->phone_mode_stores_cellphone()) {
            return $data;
        }

        if (! isset($data['billing']) || ! is_array($data['billing'])) {
            $data['billing'] = array();
        }
        if (! isset($data['shipping']) || ! is_array($data['shipping'])) {
            $data['shipping'] = array();
        }

        $data['billing']['cellphone']  = $this->format_complete_phone( (string) $customer->get_meta('billing_cellphone') );
        $data['shipping']['cellphone'] = $this->format_complete_phone( (string) $customer->get_meta('shipping_cellphone') );

        return $data;
    }

    /**
     * Salva os campos brasileiros quando o pedido é editado
     * 
     * @param int $order_id
     */
    public function save_brazilian_fields($order_id)
    {
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }

        // RG: salvo ANTES do bail do plugin Brazilian, porque o nosso recurso tem
        // precedência sobre o dele (mesmo meta `_billing_rg`). Com o nosso recurso
        // desligado NADA é gravado aqui — aí quem manda é o Brazilian.
        if ($this->rg_field_enabled()) {
            $rg_order = wc_get_order($order_id);
            if ($rg_order && isset($_POST['_billing_rg'])) {
                $rg_order->update_meta_data('_billing_rg', $this->sanitize_rg_value(wp_unslash($_POST['_billing_rg'])));
                $rg_order->save();
            }
        }

        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return;
        }
        
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        
        // Salvar campos de faturação
        if (isset($_POST['_billing_persontype'])) {
            $order->update_meta_data('_billing_persontype', sanitize_text_field(wp_unslash($_POST['_billing_persontype'])));
        }
        
        if (isset($_POST['_billing_cpf'])) {
            $order->update_meta_data('_billing_cpf', sanitize_text_field(wp_unslash($_POST['_billing_cpf'])));
        }
        
        if (isset($_POST['_billing_cnpj'])) {
            $order->update_meta_data('_billing_cnpj', sanitize_text_field(wp_unslash($_POST['_billing_cnpj'])));
        }
        
        if (isset($_POST['_billing_ie'])) {
            $ie_value = strtoupper(sanitize_text_field(wp_unslash($_POST['_billing_ie'])));
            $order->update_meta_data('_billing_ie', $ie_value);
        }

        if (isset($_POST['_billing_im'])) {
            $im_value = strtoupper(sanitize_text_field(wp_unslash($_POST['_billing_im'])));
            $order->update_meta_data('_billing_im', $im_value);
        }
        
        if (isset($_POST['_billing_number'])) {
            $order->update_meta_data('_billing_number', sanitize_text_field(wp_unslash($_POST['_billing_number'])));
        }
        
        if (isset($_POST['_billing_neighborhood'])) {
            $order->update_meta_data('_billing_neighborhood', sanitize_text_field(wp_unslash($_POST['_billing_neighborhood'])));
        }
        
        if (isset($_POST['_billing_birthdate'])) {
            $billing_birthdate = $this->normalize_birthdate_value(sanitize_text_field(wp_unslash($_POST['_billing_birthdate'])));
            if (!empty($billing_birthdate)) {
                $order->update_meta_data('_billing_birthdate', $billing_birthdate);
            }
        }

        if (isset($_POST['_billing_gender'])) {
            $order->update_meta_data('_billing_gender', sanitize_text_field(wp_unslash($_POST['_billing_gender'])));
        }
        
        // Salvar campos de entrega
        if (isset($_POST['_shipping_number'])) {
            $order->update_meta_data('_shipping_number', sanitize_text_field(wp_unslash($_POST['_shipping_number'])));
        }
        
        if (isset($_POST['_shipping_neighborhood'])) {
            $order->update_meta_data('_shipping_neighborhood', sanitize_text_field(wp_unslash($_POST['_shipping_neighborhood'])));
        }
        
        $order->save();
    }

    /**
     * Adiciona substituição de bairro no endereço formatado
     *
     * @param array $replacements
     * @param array $address
     * @return array
     */
    public function add_neighborhood_replacement($replacements, $address)
    {
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não aplica as modificações
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $replacements;
        }
        
        // Verifica se estamos em contexto de carrinho clássico/shortcode (não blocos)
        global $post;
        $is_cart_classic = false;
        if (isset($post) && is_a($post, 'WP_Post')) {
            // Se não tem blocos de carrinho, trata como clássico/shortcode
            $has_cart_blocks = function_exists('has_block') && has_block('woocommerce/cart', $post);
            $is_cart_page = function_exists('is_cart') && is_cart();
            $is_cart_classic = $is_cart_page && !$has_cart_blocks;
        }
        
        // Se for carrinho clássico/shortcode, não adiciona placeholders de número e bairro
        if ($is_cart_classic) {
            return $replacements;
        }
        
        $address = wp_parse_args(
            $address,
            array(
                'number'       => '',
                'neighborhood' => '',
            )
        );
        
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            $replacements['{neighborhood}'] = $address['neighborhood'];
        }
        
        // Adiciona substituição para número do endereço
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($number_enabled === 'yes') {
            $replacements['{number}'] = !empty($address['number']) ? ' - ' . $address['number'] : '';
        }
        
        return $replacements;
    }

    /**
     * Modifica formato de endereço para incluir bairro
     *
     * @param array $formats
     * @return array
     */
    public function add_neighborhood_to_address_format($formats)
    {
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não aplica as modificações
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $formats;
        }
        
        // Verifica se estamos em contexto de carrinho clássico/shortcode (não blocos)
        global $post;
        $is_cart_classic = false;
        if (isset($post) && is_a($post, 'WP_Post')) {
            // Se não tem blocos de carrinho, trata como clássico/shortcode
            $has_cart_blocks = function_exists('has_block') && has_block('woocommerce/cart', $post);
            $is_cart_page = function_exists('is_cart') && is_cart();
            $is_cart_classic = $is_cart_page && !$has_cart_blocks;
        }
        
        // Se for carrinho clássico/shortcode, não modifica o formato do endereço
        if ($is_cart_classic) {
            return $formats;
        }
        
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($neighborhood_enabled === 'yes' && $number_enabled === 'yes') {
            // Modifica o formato do Brasil para incluir bairro e número
            $formats['BR'] = "{name}\n{company}\n{address_1}{number}\n{neighborhood}\n{address_2}\n{city}\n{state}\n{postcode}\n{country}";
        } elseif ($neighborhood_enabled === 'yes') {
            // Só bairro
            $formats['BR'] = "{name}\n{company}\n{address_1}\n{neighborhood}\n{address_2}\n{city}\n{state}\n{postcode}\n{country}";
        } elseif ($number_enabled === 'yes') {
            // Só número
            $formats['BR'] = "{name}\n{company}\n{address_1}{number}\n{address_2}\n{city}\n{state}\n{postcode}\n{country}";
        }
        
        return $formats;
    }

    /**
     * Adiciona bairro ao endereço de cobrança formatado
     *
     * @param array $address
     * @param WC_Order $order
     * @return array
     */
    public function add_neighborhood_to_billing_address($address, $order)
    {
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não aplica as modificações
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $address;
        }
        
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            $billing_neighborhood = $order->get_meta('_billing_neighborhood');
            if (!empty($billing_neighborhood)) {
                $address['neighborhood'] = $billing_neighborhood;
            }
        }
        
        if ($number_enabled === 'yes') {
            $billing_number = $order->get_meta('_billing_number');
            if (!empty($billing_number)) {
                $address['number'] = $billing_number;
            }
        }
        
        return $address;
    }

    /**
     * Adiciona bairro ao endereço de entrega formatado
     *
     * @param array $address
     * @param WC_Order $order
     * @return array
     */
    public function add_neighborhood_to_shipping_address($address, $order)
    {
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não aplica as modificações
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $address;
        }
        
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            $shipping_neighborhood = $order->get_meta('_shipping_neighborhood');
            if (!empty($shipping_neighborhood)) {
                $address['neighborhood'] = $shipping_neighborhood;
            }
        }
        
        if ($number_enabled === 'yes') {
            $shipping_number = $order->get_meta('_shipping_number');
            if (!empty($shipping_number)) {
                $address['number'] = $shipping_number;
            }
        }
        
        return $address;
    }

    /**
     * Custom shipping admin fields.
     *
     * @param WC_Order $order Order data.
     */
    public function woo_better_shipping_customer_data($order)
    {
        // Verifica se a exibição de detalhes está habilitada
        $enable_order_details = get_option('woo_better_calc_enable_order_details', 'yes');
        if ($enable_order_details !== 'yes') {
            return;
        }

        // O woo-better exibe o SEU bloco de dados do cliente mesmo com o plugin
        // "Brazilian Market on WooCommerce" ativo (o nosso é mais completo). O bloco
        // do Brazilian é desativado em `suppress_brazilian_customer_block()`.
        
        // Get plugin settings
        $phone_mask_enabled = get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no'));
        
        // Get order meta data
        $shipping_phone_country_code = $order->get_meta('_shipping_phone_country_code');
        
        // Prepare display data
        $display_data = $this->prepare_shipping_display_data($order, $phone_mask_enabled, $shipping_phone_country_code);
        
        // Only show section if there's data to display
        if (!empty($display_data)) {
            // Include the shipping data view
            include dirname(__FILE__) . '/../Admin/partials/WcBetterShippingCalculatorForBrazilOrderShippingData.php';
        }
    }
    
    /**
     * Monta as linhas de TELEFONE/CELULAR de um endereço do pedido.
     *
     * O MODO ATUAL ("Comportamento do Campo de Telefone") define o número PRINCIPAL
     * e a sua label — respeitando a config mesmo quando ela mudou DEPOIS do pedido.
     * Os METADADOS dizem o que está SALVO/disponível (fallback quando falta o principal):
     *  - "Somente Celular" → "Celular" (celular; se não houver, cai no telefone = "Telefone");
     *  - "Somente Fixo"    → "Telefone" (telefone; se não houver, cai no celular = "Celular");
     *  - "Celular e Fixo" / "Desabilitar" → a label segue o que foi salvo:
     *      · só celular → "Celular";
     *      · só telefone → "Telefone";
     *      · celular == telefone → "Celular/Telefone";
     *      · ambos, DIFERENTES → "Celular/Telefone" (principal) + "Celular" (secundário).
     *
     * @param WC_Order $order
     * @param string   $type 'billing' | 'shipping'
     * @return array   Rows no formato dos displays do admin (key => [label,value,is_link]).
     */
    private function phone_display_rows($order, $type)
    {
        $rows = array();

        if (! $order instanceof \WC_Order || ! in_array($type, array('billing', 'shipping'), true)) {
            return $rows;
        }

        $country_code = $order->get_meta("_{$type}_phone_country_code");
        // O CELULAR só recebe o DDI na EXIBIÇÃO quando é o campo PRINCIPAL ("Somente
        // Celular") ou o espelho OCULTO (shim). O "Campo de Celular" VISÍVEL é um
        // campo básico — aparece só com os dígitos (sem `+55`). Espelha a regra de
        // `normalize_order_phone`.
        $cell_country_code = $this->cellphone_meta_uses_ddi() ? $country_code : '';
        // Usa os getters (não `get_meta('_*_phone')`, que é internal meta). No
        // order-received o getter pode já refletir o celular no lugar do telefone
        // (fallback de exibição) — o que é o MESMO valor que o WC exibe no endereço.
        $phone        = trim((string) $order->{"get_{$type}_phone"}());
        $cellphone    = trim((string) $order->get_meta("_{$type}_cellphone"));

        $phone_digits = preg_replace('/\D/', '', $phone);
        $cell_digits  = preg_replace('/\D/', '', $cellphone);

        if ('' === $phone_digits && '' === $cell_digits) {
            return $rows;
        }

        $label_both  = __('Celular/Telefone', 'woo-better-shipping-calculator-for-brazil');
        $label_cell  = __('Celular', 'woo-better-shipping-calculator-for-brazil');
        $label_phone = __('Telefone', 'woo-better-shipping-calculator-for-brazil');

        $mode = $this->get_phone_mode();

        // "Somente Celular": o número PRINCIPAL é o CELULAR e a label segue o MODO
        // atual — mesmo que a config tenha mudado depois do pedido (ex.: pedido feito
        // em "Celular e Fixo", que gravou telefone E celular; agora em "Somente
        // Celular" → sai só "Celular"). O telefone só entra como FALLBACK se não
        // houver celular disponível.
        if ('cellphone_only' === $mode) {
            if ('' !== $cell_digits) {
                // Celular == telefone: o WC já exibe o telefone no endereço do pedido,
                // então rotulamos a linha como "Celular" mas mantemos a chave `phone` —
                // o bloco de recibo só lê `cellphone`, então deduplica sozinho.
                $key = ('' !== $phone_digits && $cell_digits === $phone_digits) ? 'phone' : 'cellphone';
                $rows[$key] = array(
                    'label'   => $label_cell,
                    'value'   => $this->format_complete_phone($cellphone, $cell_country_code),
                    'is_link' => true,
                );
            } elseif ('' !== $phone_digits) {
                $rows['phone'] = array(
                    'label'   => $label_phone,
                    'value'   => $this->format_complete_phone($phone, $country_code),
                    'is_link' => true,
                );
            }
            return $rows;
        }

        // "Somente Fixo": o número PRINCIPAL é o TELEFONE (mesma regra do modo acima).
        if ('landline_only' === $mode) {
            if ('' !== $phone_digits) {
                $rows['phone'] = array(
                    'label'   => $label_phone,
                    'value'   => $this->format_complete_phone($phone, $country_code),
                    'is_link' => true,
                );
            } elseif ('' !== $cell_digits) {
                $rows['cellphone'] = array(
                    'label'   => $label_cell,
                    'value'   => $this->format_complete_phone($cellphone, $cell_country_code),
                    'is_link' => true,
                );
            }
            return $rows;
        }

        // "Celular e Fixo" (e "Desabilitar"): a label segue o que foi SALVO nos
        // metadados (o campo principal aceita fixo E celular).

        // Só celular: o celular é o campo principal (a meta `*_phone` fica vazia).
        if ('' === $phone_digits) {
            $rows['cellphone'] = array(
                'label'   => $label_cell,
                'value'   => $this->format_complete_phone($cellphone, $cell_country_code),
                'is_link' => true,
            );
            return $rows;
        }

        // Só telefone.
        if ('' === $cell_digits) {
            $rows['phone'] = array(
                'label'   => $label_phone,
                'value'   => $this->format_complete_phone($phone, $country_code),
                'is_link' => true,
            );
            return $rows;
        }

        // Celular == telefone: campo único (aceita fixo e celular).
        if ($cell_digits === $phone_digits) {
            $rows['phone'] = array(
                'label'   => $label_both,
                'value'   => $this->format_complete_phone($phone, $country_code),
                'is_link' => true,
            );
            return $rows;
        }

        // Ambos preenchidos e DIFERENTES: principal (fixo/celular) + secundário (celular).
        $rows['phone'] = array(
            'label'   => $label_both,
            'value'   => $this->format_complete_phone($phone, $country_code),
            'is_link' => true,
        );
        $rows['cellphone'] = array(
            'label'   => $label_cell,
            'value'   => $this->format_complete_phone($cellphone, $cell_country_code),
            'is_link' => true,
        );

        return $rows;
    }

    /**
     * Linha do "Celular" de um ENDEREÇO do pedido (a que vai abaixo do telefone).
     *
     * Reusa o MESMO `phone_display_rows` dos blocos de dados do cliente: a linha só
     * existe quando o celular é um número PRÓPRIO — quando ele é o próprio telefone
     * exibido pelo WooCommerce (campo único/espelho/"Somente Celular" com o celular
     * preenchendo o telefone) não há linha, então nada é duplicado no endereço.
     *
     * @param WC_Order $order
     * @param string   $type 'billing' | 'shipping'
     * @return array|null array('label' => ..., 'value' => ..., 'is_link' => true)
     */
    private function address_cellphone_row($order, $type)
    {
        if (! $order instanceof \WC_Order || ! in_array($type, array('billing', 'shipping'), true)) {
            return null;
        }

        $rows = $this->phone_display_rows($order, $type);

        return isset($rows['cellphone']) ? $rows['cellphone'] : null;
    }

    /**
     * Markup do "Celular" anexado ao endereço de cobrança/entrega do pedido.
     *
     * Gate: `woo_better_calc_enable_order_details` (a mesma opção que liga o bloco
     * "Informações adicionais"). O markup usa a classe do telefone do WooCommerce
     * (`woocommerce-customer-details--phone`) para o tema aplicar o MESMO ícone e o
     * mesmo espaçamento da linha de telefone; o nome do campo vai escondido (a11y).
     *
     * @param WC_Order|int $order Pedido ou ID.
     * @param string       $type  'billing' | 'shipping'
     * @return string HTML já escapado ('' quando não há o que mostrar).
     */
    private function address_cellphone_markup($order, $type)
    {
        if (get_option('woo_better_calc_enable_order_details', 'yes') !== 'yes') {
            return '';
        }

        if (is_numeric($order)) {
            $order = wc_get_order((int) $order);
        }

        $row = $this->address_cellphone_row($order, $type);

        if (null === $row) {
            return '';
        }

        return sprintf(
            // Classes do PRÓPRIO WooCommerce: é a linha do telefone (`--phone`) que o
            // tema decora — Astra põe o ícone (fonte WooCommerce) e o `padding-left`,
            // temas de bloco põem o emoji —, então o celular herda o MESMO ícone no
            // lugar do nome. A última classe é só um gancho nosso.
            '<p class="woocommerce-customer-details--phone woo-better-customer-details--cellphone">'
            // O nome do campo ("Celular") não é exibido: só o ícone, como no telefone.
            // Vai num `screen-reader-text` para o leitor de tela continuar dizendo o que
            // é o número (o `woo-better-sr-only` é a nossa rede de segurança, para tema
            // que não define `screen-reader-text`).
            . '<span class="screen-reader-text woo-better-sr-only">%1$s: </span>%2$s</p>',
            esc_html($row['label']),
            esc_html($row['value'])
        );
    }

    /**
     * Imprime o "Celular" DENTRO do endereço (tema CLÁSSICO).
     *
     * Hook `woocommerce_order_details_after_customer_address` (WooCommerce >= 8.7),
     * disparado pelo template `order/order-details-customer.php` logo após o telefone
     * — então o celular fica ABAIXO dele, na cobrança E na entrega.
     *
     * @param string       $type  'billing' | 'shipping'
     * @param WC_Order|int $order Pedido.
     * @return void
     */
    public function render_address_cellphone($type, $order)
    {
        echo $this->address_cellphone_markup($order, $type); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- markup escapado no helper.
    }

    /**
     * O buffer do bloco de endereços está aberto? (impede abrir/fechar duas vezes)
     *
     * @var bool
     */
    private static $customer_details_buffer_open = false;

    /**
     * Abre o buffer do trecho de ENDEREÇOS do template clássico (só quando há celular).
     *
     * Hook `woocommerce_after_order_details`: dispara imediatamente antes do
     * `wc_get_template('order/order-details-customer.php')`, então o buffer cobre
     * exatamente os endereços (e o nosso celular, impresso pelo hook de endereço).
     *
     * NÃO abre nada quando não há o que reordenar (opção de detalhes desligada ou
     * celular ausente/igual ao telefone) — o caminho comum não paga por um buffer.
     *
     * @param WC_Order|int $order Pedido.
     * @return void
     */
    public function start_customer_details_buffer($order = null)
    {
        if (self::$customer_details_buffer_open) {
            return;
        }

        if (get_option('woo_better_calc_enable_order_details', 'yes') !== 'yes') {
            return;
        }

        if (is_numeric($order)) {
            $order = wc_get_order((int) $order);
        }

        if (null === $this->address_cellphone_row($order, 'billing')) {
            return;
        }

        self::$customer_details_buffer_open = true;
        ob_start();
    }

    /**
     * Fecha o buffer dos endereços e sobe o CELULAR da cobrança para ACIMA do e-mail.
     *
     * O template clássico imprime telefone → e-mail → hook do endereço, e o celular
     * sai no hook (abaixo do e-mail). Aqui as duas linhas são trocadas de lugar, então
     * a ordem fica endereço → telefone → CELULAR → e-mail. Também é registrado como
     * rede de segurança em `woocommerce_thankyou` e `wp_footer`: se um tema não
     * disparar o hook interno, o conteúdo é despejado intacto (o buffer nunca fica
     * aberto nem engole a página).
     *
     * @param WC_Order|int $order Pedido (não usado; o buffer já tem o conteúdo).
     * @return void
     */
    public function flush_customer_details_buffer($order = null)
    {
        if (! self::$customer_details_buffer_open) {
            return;
        }

        self::$customer_details_buffer_open = false;
        $html = ob_get_clean();

        if (! is_string($html) || '' === $html) {
            return;
        }

        echo $this->move_billing_cellphone_before_email($html); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- conteúdo já renderizado pelo template/WooCommerce.
    }

    /**
     * Sobe o parágrafo do CELULAR da cobrança para ANTES do parágrafo do e-mail.
     *
     * Método PURO (só string → string) para ser testável sem template. Casa SÓ o par
     * "e-mail do WooCommerce seguido do NOSSO celular" — o e-mail só existe no
     * endereço de cobrança, então a entrega (sem e-mail) e qualquer outra linha
     * ficam intactas. A marca do nosso parágrafo é
     * `woo-better-customer-details--cellphone`.
     *
     * @param string $html HTML do bloco de endereços.
     * @return string
     */
    private function move_billing_cellphone_before_email($html)
    {
        $pattern = '#(<p class="[^"]*woocommerce-customer-details--email[^"]*">.*?</p>)(\s*)'
            . '(<p class="[^"]*woo-better-customer-details--cellphone[^"]*">.*?</p>)#s';

        $reordered = preg_replace($pattern, '$3$2$1', $html, 1);

        return is_string($reordered) ? $reordered : $html;
    }

    /**
     * Anexa o "Celular" ao endereço renderizado pelo bloco de order-confirmation
     * (tema de BLOCO), onde o hook `..._after_customer_address` não dispara.
     *
     * O pedido vem do mesmo query var usado pelo bloco
     * (`AbstractOrderConfirmationBlock::get_order()`); bloco vazio (sem permissão de
     * visualização) não recebe nada.
     *
     * @param string $block_content HTML do bloco.
     * @param array  $block         Dados do bloco.
     * @return string
     */
    public function render_block_address_cellphone($block_content, $block)
    {
        if (! is_string($block_content) || '' === trim($block_content)) {
            return $block_content;
        }

        $block_name = isset($block['blockName']) ? (string) $block['blockName'] : '';
        $types      = array(
            'woocommerce/order-confirmation-billing-address'  => 'billing',
            'woocommerce/order-confirmation-shipping-address' => 'shipping',
        );

        if (! isset($types[$block_name])) {
            return $block_content;
        }

        $order_id = absint(get_query_var('order-received'));

        if (! $order_id) {
            return $block_content;
        }

        $markup = $this->address_cellphone_markup($order_id, $types[$block_name]);

        return ('' === $markup) ? $block_content : $block_content . $markup;
    }

    /**
     * Prepare shipping display data
     * 
     * @param WC_Order $order
     * @param string $phone_mask_enabled
     * @param string $shipping_phone_country_code
     * @return array
     */
    private function prepare_shipping_display_data($order, $phone_mask_enabled, $shipping_phone_country_code)
    {
        // Telefone/celular derivados dos METADADOS (label segue o que foi salvo, não a
        // config atual — que pode ter mudado depois do pedido).
        return $this->phone_display_rows($order, 'shipping');
    }

    /**
     * Custom billing admin fields.
     *
     * @param WC_Order $order Order data.
     */
    public function woo_better_billing_customer_data($order)
    {   
        // Verifica se a exibição de detalhes está habilitada
        $enable_order_details = get_option('woo_better_calc_enable_order_details', 'yes');
        if ($enable_order_details !== 'yes') {
            return;
        }

        // O woo-better exibe o SEU bloco de dados do cliente mesmo com o plugin
        // "Brazilian Market on WooCommerce" ativo (o nosso é mais completo). O bloco
        // do Brazilian é desativado em `suppress_brazilian_customer_block()`.
        
        // Get plugin settings
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $phone_mask_enabled = get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no'));
        
        // Get order meta data
        $billing_persontype = $order->get_meta('_billing_persontype');
        $billing_cpf = $order->get_meta('_billing_cpf');
        $billing_cnpj = $order->get_meta('_billing_cnpj');
        $billing_phone_country_code = $order->get_meta('_billing_phone_country_code');
        
        // Prepare display data
        $display_data = $this->prepare_billing_display_data($order, $person_type, $phone_mask_enabled, $billing_persontype, $billing_cpf, $billing_cnpj, $billing_phone_country_code);
        
        // Only show section if there's data to display
        if (!empty($display_data)) {
            // Include the billing data view
            include dirname(__FILE__) . '/../Admin/partials/WcBetterShippingCalculatorForBrazilOrderBillingData.php';
        }
    }
    
    /**
     * Prepare billing display data
     * 
     * @param WC_Order $order
     * @param string $person_type
     * @param string $phone_mask_enabled
     * @param string $billing_persontype
     * @param string $billing_cpf
     * @param string $billing_cnpj
     * @param string $billing_phone_country_code
     * @return array
     */
    private function prepare_billing_display_data($order, $person_type, $phone_mask_enabled, $billing_persontype, $billing_cpf, $billing_cnpj, $billing_phone_country_code)
    {
        $display_data = [];
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');

        // Convert numeric persontype to string (1 = physical, 2 = legal)
        if (is_numeric($billing_persontype)) {
            $billing_persontype = ($billing_persontype == '1') ? 'physical' : 'legal';
        }

        // 1. Data de Nascimento
        $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
        if ($birthdate_enabled === 'yes') {
            $billing_birthdate = $order->get_meta('_billing_birthdate');
            if (!empty($billing_birthdate)) {
                $birthdate_obj = \DateTime::createFromFormat('Y-m-d', $billing_birthdate);
                if ($birthdate_obj) {
                    $today = new \DateTime();
                    $age = $today->diff($birthdate_obj)->y;
                    $formatted_birthdate = $birthdate_obj->format('d/m/Y') . ' (' . $age . ' anos)';
                } else {
                    $formatted_birthdate = $billing_birthdate;
                }
                $display_data['birthdate'] = [
                    'label' => __('Data de Nascimento', 'woo-better-shipping-calculator-for-brazil'),
                    'value' => $formatted_birthdate
                ];
            }
        }

        // 2-5. Tipo de Pessoa / CPF ou CNPJ / Empresa / IE
        if ($person_type !== 'none') {
            // 2. Tipo de Pessoa (apenas quando 'both')
            if ($person_type === 'both' && !empty($billing_persontype)) {
                $person_type_label = '';
                if ($billing_persontype === '1' || $billing_persontype === 1 || $billing_persontype === 'physical') {
                    $person_type_label = __('Pessoa Física', 'woo-better-shipping-calculator-for-brazil');
                } elseif ($billing_persontype === '2' || $billing_persontype === 2 || $billing_persontype === 'legal') {
                    $person_type_label = __('Pessoa Jurídica', 'woo-better-shipping-calculator-for-brazil');
                }
                if (!empty($person_type_label)) {
                    $display_data['person_type'] = [
                        'label' => __('Tipo de Pessoa', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $person_type_label
                    ];
                }
            }

            // 3. CPF
            if ($this->should_show_physical_data($person_type, $billing_persontype)) {
                if (!empty($billing_cpf)) {
                    $display_data['cpf'] = [
                        'label' => __('CPF', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $billing_cpf
                    ];
                }

                // RG: documento de pessoa física (vem logo abaixo do CPF).
                if ($this->rg_field_enabled()) {
                    $billing_rg = $order->get_meta('_billing_rg');
                    if (!empty($billing_rg)) {
                        $display_data['rg'] = [
                            'label' => __('RG', 'woo-better-shipping-calculator-for-brazil'),
                            'value' => $billing_rg
                        ];
                    }
                }
            }

            // 3. CNPJ / 4. Empresa / 5. IE
            if ($this->should_show_legal_data($person_type, $billing_persontype)) {
                if (!empty($billing_cnpj)) {
                    $display_data['cnpj'] = [
                        'label' => __('CNPJ', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $billing_cnpj
                    ];
                }
                $company = $order->get_billing_company();
                if (!empty($company)) {
                    $display_data['company'] = [
                        'label' => __('Empresa', 'woo-better-shipping-calculator-for-brazil'),
                        'value' => $company
                    ];
                }
                if ($ie_field_enabled === 'yes') {
                    $billing_ie = $order->get_meta('_billing_ie');
                    if (!empty($billing_ie)) {
                        $display_data['ie'] = [
                            'label' => __('Inscrição Estadual (IE)', 'woo-better-shipping-calculator-for-brazil'),
                            'value' => $billing_ie
                        ];
                    }
                }
                if ($im_field_enabled === 'yes') {
                    $billing_im = $order->get_meta('_billing_im');
                    if (!empty($billing_im)) {
                        $display_data['im'] = [
                            'label' => __('Inscrição Municipal (IM)', 'woo-better-shipping-calculator-for-brazil'),
                            'value' => $billing_im
                        ];
                    }
                }
            }
        } else {
            // When person type is 'none', only show company if available
            $company = $order->get_billing_company();
            if (!empty($company)) {
                $display_data['company'] = [
                    'label' => __('Empresa', 'woo-better-shipping-calculator-for-brazil'),
                    'value' => $company
                ];
            }
        }

        // 6. Gênero
        $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
        if ($gender_enabled === 'yes') {
            $billing_gender = $order->get_meta('_billing_gender');
            if (!empty($billing_gender)) {
                // Convert to readable labels (valores são textos traduzidos)
                $gender_labels = [
                    __('Masculino', 'woo-better-shipping-calculator-for-brazil') => __('Masculino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Feminino', 'woo-better-shipping-calculator-for-brazil') => __('Feminino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Não-binário', 'woo-better-shipping-calculator-for-brazil') => __('Não-binário', 'woo-better-shipping-calculator-for-brazil'),
                    __('Outro', 'woo-better-shipping-calculator-for-brazil') => __('Outro', 'woo-better-shipping-calculator-for-brazil'),
                    __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil') => __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil'),
                ];
                $gender_label = isset($gender_labels[$billing_gender]) ? $gender_labels[$billing_gender] : $billing_gender;
                $display_data['gender'] = [
                    'label' => __('Gênero', 'woo-better-shipping-calculator-for-brazil'),
                    'value' => $gender_label
                ];
            }
        }

        // 7. Telefone
        // 7. Telefone / Celular — derivados dos METADADOS (label segue o que foi salvo
        // no pedido, não a config atual, que pode ter mudado depois). Contempla:
        // só celular → "Celular"; só telefone → "Telefone"; campo único → "Celular/
        // Telefone"; ambos distintos → "Celular/Telefone" + "Celular".
        $display_data = array_merge($display_data, $this->phone_display_rows($order, 'billing'));

        // 8. Email
        $email = $order->get_billing_email();
        if (!empty($email)) {
            $display_data['email'] = [
                'label' => __('Email', 'woo-better-shipping-calculator-for-brazil'),
                'value' => $email,
                'is_clickable' => true
            ];
        }
        
        return $display_data;
    }
    
    /**
     * Desativa o bloco "Informações do cliente" do plugin "Brazilian Market on
     * WooCommerce" para que o woo-better assuma a exibição (o nosso bloco é mais
     * completo). Só age quando a exibição de detalhes do pedido está habilitada.
     *
     * O bloco do Brazilian é registrado em
     * `woocommerce_admin_order_data_after_billing_address` pela classe
     * `Extra_Checkout_Fields_For_Brazil_Order` (instanciada sem referência global),
     * então localizamos o callback pelo objeto e o removemos.
     *
     * @return void
     */
    public function suppress_brazilian_customer_block()
    {
        if (get_option('woo_better_calc_enable_order_details', 'yes') !== 'yes') {
            return;
        }

        if (! class_exists('Extra_Checkout_Fields_For_Brazil_Order')) {
            return;
        }

        global $wp_filter;

        $hook = 'woocommerce_admin_order_data_after_billing_address';
        if (! isset($wp_filter[$hook]) || ! is_object($wp_filter[$hook]) || empty($wp_filter[$hook]->callbacks)) {
            return;
        }

        foreach ($wp_filter[$hook]->callbacks as $priority => $callbacks) {
            foreach ($callbacks as $callback) {
                $fn = isset($callback['function']) ? $callback['function'] : null;

                if (
                    is_array($fn)
                    && isset($fn[0])
                    && is_object($fn[0])
                    && $fn[0] instanceof \Extra_Checkout_Fields_For_Brazil_Order
                ) {
                    remove_action($hook, $fn, $priority);
                }
            }
        }
    }

    /**
     * Check if should show physical person data
     */
    private function should_show_physical_data($person_type, $billing_persontype)
    {
        // Se person_type é physical, sempre mostra
        if ($person_type === 'physical') {
            return true;
        }
        
        // Se person_type é both, mostra se billing_persontype é 1 (número) ou 'physical' (string)
        if ($person_type === 'both') {
            return ($billing_persontype === '1' || $billing_persontype === 1 || $billing_persontype === 'physical');
        }
        
        return false;
    }
    
    /**
     * Check if should show legal person data
     */
    private function should_show_legal_data($person_type, $billing_persontype)
    {
        // Se person_type é legal, sempre mostra
        if ($person_type === 'legal') {
            return true;
        }
        
        // Se person_type é both, mostra se billing_persontype é 2 (número) ou 'legal' (string)
        if ($person_type === 'both') {
            return ($billing_persontype === '2' || $billing_persontype === 2 || $billing_persontype === 'legal');
        }
        
        return false;
    }
    
    /**
     * Formata telefone completo removendo caracteres especiais
     * 
     * @param string $phone Número de telefone
     * @param string $country_code Código do país
     * @return string Telefone formatado
     */
    private function format_complete_phone($phone, $country_code = '')
    {
        if (empty($phone)) {
            return '';
        }
        
        // Remove todos os caracteres especiais, deixa apenas números e +
        $clean_phone = preg_replace('/[^0-9+]/', '', $phone);
        
        // Se já começa com +, usa como está
        if (strpos($clean_phone, '+') === 0) {
            return $clean_phone;
        }
        
        // Se não começa com + e tem código do país, adiciona no início
        if (!empty($country_code)) {
            $clean_country_code = preg_replace('/[^0-9+]/', '', $country_code);
            
            // Garante que o código do país começa com +
            if (strpos($clean_country_code, '+') !== 0) {
                $clean_country_code = '+' . $clean_country_code;
            }
            
            // Autofill pode trazer o DDI embutido sem "+" (ex.: "5585988888888").
            // Nesse caso só prefixa o "+", para não duplicar o DDI no número final
            // ("+555585988888888"). A checagem de >= 12 dígitos evita confundir com
            // um DDD nacional que coincida com o DDI (ex.: DDD 55 do RS = 11 dígitos).
            $cc_digits = preg_replace('/[^0-9]/', '', $clean_country_code);
            if ($cc_digits !== '' && strpos($clean_phone, $cc_digits) === 0 && strlen($clean_phone) >= 12) {
                return '+' . $clean_phone;
            }
            
            return $clean_country_code . $clean_phone;
        }
        
        // Se não tem código do país, deixa como está
        return $clean_phone;
    }

    /**
     * Normaliza o telefone e o celular do pedido para o formato internacional limpo.
     *
     * Mantém apenas dígitos e um "+" inicial, prefixando o DDI quando houver.
     * O número fica "tudo junto" (+DDInúmero), sem espaços, parênteses, hífens ou
     * outros caracteres especiais. Atua no campo nativo `billing_phone`/
     * `shipping_phone` e na meta `_<type>_cellphone`. Roda com a máscara/DDI ativa e
     * também com a MÁSCARA BRASILEIRA sem lib (nesse caso o DDI é sempre `+55`).
     *
     * @param WC_Order $order
     * @param string   $type         'billing' | 'shipping'
     * @param string   $country_code Ex.: '+55'
     * @return void
     */
    private function normalize_order_phone($order, $type, $country_code)
    {
        $mask_active       = $this->is_phone_mask_active();
        $brazil_mask       = $this->is_phone_brazil_mask_active();
        $stores_cellphone  = $this->phone_mode_stores_cellphone();

        if (! $mask_active && ! $brazil_mask && ! $stores_cellphone) {
            return;
        }

        // Máscara BR (sem DDI): o campo não tem seletor de país, então o DDI é
        // sempre o do Brasil — concatena o `+55` mesmo quando nada foi postado.
        if ($brazil_mask && '' === trim((string) $country_code)) {
            $country_code = '+55';
        }

        // Telefone NATIVO -> E.164 — quando o plugin GERENCIA o telefone
        // (máscara/DDI ativa E também na máscara BR sem lib; no modo "Desabilitar"
        // não tocamos no nativo).
        if ($mask_active || $brazil_mask) {
            $phone = ($type === 'shipping') ? $order->get_shipping_phone() : $order->get_billing_phone();
            if (! empty($phone)) {
                $normalized = $this->format_complete_phone($phone, $country_code);

                if ($type === 'shipping') {
                    $order->set_shipping_phone($normalized);
                } else {
                    $order->set_billing_phone($normalized);
                }
            }
        }

        // Celular (meta `_<type>_cellphone`) — é campo do PRÓPRIO plugin, então é
        // normalizado sempre que o plugin manipula o telefone/celular (máscara ativa
        // OU armazena a meta — inclusive no modo "Desabilitar" + "Campo de Celular"),
        // para o valor bater entre clássico e blocos (NFe/Brazilian leem essa meta).
        // O DDI só entra quando o celular é o campo PRINCIPAL (Somente Celular) ou o
        // espelho OCULTO (shim); no "Campo de Celular" VISÍVEL ele fica SEM o `+55`.
        $cellphone = (string) $order->get_meta("_{$type}_cellphone");
        if ('' !== trim($cellphone)) {
            $cellphone_cc = $this->cellphone_meta_uses_ddi() ? $country_code : '';
            $normalized_cellphone = $this->format_complete_phone($cellphone, $cellphone_cc);
            if ('' !== $normalized_cellphone) {
                $order->update_meta_data("_{$type}_cellphone", $normalized_cellphone);
            }
        }
    }

    /**
     * Reafirma a meta de telefone do USUÁRIO (perfil) com o telefone NORMALIZADO do
     * pedido (E.164).
     *
     * No checkout o WooCommerce core salva o customer a partir do campo NATIVO de
     * telefone — que o plugin mantém OCULTO e cujo valor chega cru/mascarado (ex.:
     * "83 98888-8884"), sobrescrevendo o valor normalizado que o plugin havia gravado.
     * Rodando DEPOIS daquela gravação (nos hooks de pedido do plugin), restauramos o
     * E.164 (`+DDInúmero`) para o perfil refletir o MESMO valor do pedido. Atua só
     * quando o plugin gerencia o telefone.
     *
     * Usa o `customer_id` do PEDIDO (não `WC()->customer`, que no checkout clássico
     * pode ser um customer "guest" — `save()` nele iria para a sessão, não para o
     * user meta). Também reflete no `WC()->customer`/sessão atuais quando é o mesmo
     * usuário, para a tela não ficar com o valor antigo.
     *
     * @param WC_Order $order
     * @return void
     */
    private function sync_customer_phone_from_order($order)
    {
        if (! $this->phone_mode_hides_native_option()) {
            return;
        }

        $user_id = (int) $order->get_customer_id();
        if (! $user_id && is_user_logged_in()) {
            $user_id = get_current_user_id();
        }
        if (! $user_id) {
            return;
        }

        $billing  = trim((string) $order->get_billing_phone());
        $shipping = trim((string) $order->get_shipping_phone());

        // Valor que não pode ser um telefone NÃO vai para o perfil — e o telefone que
        // já estava lá é PRESERVADO (não sobrescrevemos com vazio).
        if (! $this->is_plausible_phone_value($billing)) {
            $billing = '';
        }
        if (! $this->is_plausible_phone_value($shipping)) {
            $shipping = '';
        }

        if ('' === $billing && '' === $shipping) {
            return;
        }

        // Grava no user meta do dono do pedido (independente do objeto atual).
        $customer = new \WC_Customer($user_id);
        if ('' !== $billing) {
            $customer->set_billing_phone($billing);
        }
        if ('' !== $shipping) {
            $customer->set_shipping_phone($shipping);
        }
        $customer->save();

        // Reflete no objeto/sessão atuais (se for o mesmo usuário) — evita a tela
        // mostrar o valor antigo logo após o checkout.
        if (function_exists('WC') && WC()->customer && (int) WC()->customer->get_id() === $user_id) {
            if ('' !== $billing) {
                WC()->customer->set_billing_phone($billing);
            }
            if ('' !== $shipping) {
                WC()->customer->set_shipping_phone($shipping);
            }
        }
    }

    /**
     * Ajusta o telefone no CUSTOMER do checkout CLÁSSICO antes do core salvá-lo.
     *
     * Hook `woocommerce_checkout_update_customer` (dispara imediatamente antes de
     * `$customer->save()`). Sem isso, o core grava o valor CRU do campo nativo (ex.:
     * "83 98888-8884") no user meta. Aqui normalizamos para E.164 (+DDInúmero) usando
     * o DDI postado, de modo que a própria gravação do core já use o valor correto.
     *
     * @param \WC_Customer $customer
     * @param array        $data Dados postados do checkout.
     * @return void
     */
    public function sync_customer_phone_on_classic_checkout($customer, $data)
    {
        // Só normaliza quando o plugin GERENCIA e NORMALIZA o telefone nativo — a MESMA
        // regra de `normalize_order_phone` (evita divergir do valor gravado no pedido:
        // máscara/DDI ativa OU máscara BR sem lib).
        $brazil_mask = $this->is_phone_brazil_mask_active();

        if ((! $this->is_phone_mask_active() && ! $brazil_mask) || ! $customer instanceof \WC_Customer) {
            return;
        }
        if (! is_array($data)) {
            return;
        }

        foreach (array('billing', 'shipping') as $type) {
            $phone = isset($data["{$type}_phone"]) ? trim((string) $data["{$type}_phone"]) : '';
            if ('' === $phone) {
                continue;
            }
            $cc = isset($data["{$type}_phone_country"]) ? (string) $data["{$type}_phone_country"] : '';
            // Máscara BR (sem DDI): o país é sempre o Brasil.
            if ('' === $cc && $brazil_mask) {
                $cc = '+55';
            }
            $formatted = $this->format_complete_phone($phone, $cc);

            // Valor que não pode ser um telefone é IGNORADO: o core salva o que já
            // estava no cadastro (não sobrescreve com vazio — o cliente pode ter
            // errado um dígito). A validação do envio é quem barra o número.
            if (! $this->is_plausible_phone_value($formatted)) {
                continue;
            }

            $customer->{"set_{$type}_phone"}($formatted);
        }
    }
    
    /**
     * Indica se estamos exibindo o pedido para o CLIENTE na página de recibo
     * ("Order received"/obrigado). Usado para o celular substituir o telefone no
     * recibo sem afetar o admin — onde o telefone deve aparecer VAZIO e o celular
     * preenchido (modo "Somente Celular").
     *
     * @return bool
     */
    private function is_order_receipt_context()
    {
        return function_exists('is_order_received_page') && is_order_received_page();
    }

    /**
     * Formatar telefone de cobrança no pedido final
     *
     * @param string $phone
     * @param WC_Order $order
     * @return string
     */
    public function format_order_billing_phone($phone, $order)
    {
        // No modo "Desabilitar" o plugin não mexe no telefone do pedido.
        if (! $this->phone_mode_hides_native_option()) {
            return $phone;
        }

        // "Somente Celular": o telefone do pedido fica VAZIO (o número é o celular).
        // No recibo o celular aparece no lugar do telefone — ele "substitui" o telefone.
        if (empty($phone) && 'cellphone_only' === $this->get_phone_mode() && $this->is_order_receipt_context()) {
            $phone = $order->get_meta('_billing_cellphone');
        }

        if ($this->is_phone_mask_active() && !empty($phone)) {
            $country_code = $order->get_meta('_billing_phone_country_code');
            return $this->format_complete_phone($phone, $country_code);
        }

        return $phone;
    }
    
    /**
     * Formatar telefone de entrega no pedido final
     *
     * @param string $phone
     * @param WC_Order $order
     * @return string
     */
    public function format_order_shipping_phone($phone, $order)
    {
        // No modo "Desabilitar" o plugin não mexe no telefone do pedido.
        if (! $this->phone_mode_hides_native_option()) {
            return $phone;
        }

        // "Somente Celular": idem billing — no recibo o celular substitui o telefone.
        if (empty($phone) && 'cellphone_only' === $this->get_phone_mode() && $this->is_order_receipt_context()) {
            $phone = $order->get_meta('_shipping_cellphone');
        }

        if ($this->is_phone_mask_active() && !empty($phone)) {
            $country_code = $order->get_meta('_shipping_phone_country_code');
            return $this->format_complete_phone($phone, $country_code);
        }

        return $phone;
    }

    /**
     * Monta as linhas "Chave: valor" de um endereço (cobrança ou entrega) para a tela
     * de detalhes do cliente. Só inclui os campos preenchidos.
     *
     * @param WC_Order $order
     * @param string   $type 'billing' | 'shipping'
     * @return array<string,string> label => valor
     */
    public static function address_display_rows($order, $type)
    {
        if (! $order instanceof \WC_Order || ! in_array($type, array('billing', 'shipping'), true)) {
            return array();
        }

        $get = function ($prop) use ($order, $type) {
            $method = "get_{$type}_{$prop}";

            return is_callable(array($order, $method)) ? trim((string) $order->$method()) : '';
        };

        $country      = $get('country');
        $state_raw    = $get('state');
        $state        = $state_raw;
        $country_name = $country;

        if (function_exists('WC') && WC()->countries) {
            $base = $country !== '' ? $country : WC()->countries->get_base_country();

            if ($state_raw !== '') {
                $states = WC()->countries->get_states($base);
                if (is_array($states) && isset($states[$state_raw])) {
                    $state = $states[$state_raw];
                }
            }

            $countries = WC()->countries->get_countries();
            if ($country !== '' && isset($countries[$country])) {
                $country_name = $countries[$country];
            }
        }

        $values = array(
            __('Nome', 'woo-better-shipping-calculator-for-brazil')         => trim($get('first_name') . ' ' . $get('last_name')),
            __('Empresa', 'woo-better-shipping-calculator-for-brazil')      => $get('company'),
            __('Endereço', 'woo-better-shipping-calculator-for-brazil')     => $get('address_1'),
            __('Número', 'woo-better-shipping-calculator-for-brazil')       => (string) $order->get_meta("_{$type}_number"),
            __('Complemento', 'woo-better-shipping-calculator-for-brazil')  => $get('address_2'),
            __('Bairro', 'woo-better-shipping-calculator-for-brazil')       => self::order_neighborhood($order, $type),
            __('Cidade', 'woo-better-shipping-calculator-for-brazil')       => $get('city'),
            __('Estado', 'woo-better-shipping-calculator-for-brazil')       => $state,
            __('CEP', 'woo-better-shipping-calculator-for-brazil')          => $get('postcode'),
            __('País', 'woo-better-shipping-calculator-for-brazil')         => $country_name,
        );

        $rows = array();
        foreach ($values as $label => $value) {
            $value = trim((string) $value);
            if ('' !== $value) {
                $rows[$label] = $value;
            }
        }

        return $rows;
    }

    /**
     * Bairro de um endereço do pedido para exibição, com fallback ao perfil do
     * cliente. O pedido só tem `_<type>_neighborhood` quando o "Campo de Bairro"
     * estava ligado no checkout; quando vazio, usamos o bairro do cadastro do cliente
     * (`<type>_neighborhood` no user meta / meta do cliente) — para não exibir vazio.
     *
     * @param WC_Order $order
     * @param string   $type 'billing' | 'shipping'
     * @return string
     */
    public static function order_neighborhood($order, $type)
    {
        if (! $order instanceof \WC_Order || ! in_array($type, array('billing', 'shipping'), true)) {
            return '';
        }

        $neighborhood = trim((string) $order->get_meta("_{$type}_neighborhood"));
        if ('' !== $neighborhood) {
            return $neighborhood;
        }

        $customer_id = (int) $order->get_customer_id();
        if ($customer_id > 0) {
            $neighborhood = trim((string) get_user_meta($customer_id, "{$type}_neighborhood", true));
        }

        if ('' === $neighborhood && function_exists('WC') && WC()->customer) {
            $neighborhood = trim((string) WC()->customer->get_meta("{$type}_neighborhood"));
        }

        return $neighborhood;
    }

    /**
     * Controla a renderização única por pedido (o bloco dispara por DOIS hooks —
     * `woocommerce_thankyou` e `woocommerce_order_details_after_customer_details`).
     *
     * @var array<int,bool>
     */
    private static $customer_details_rendered = array();

    /**
     * Bloco "Informações adicionais" na tela de detalhes do cliente (order-received /
     * ver pedido): exibe, no formato "Chave: valor", os campos brasileiros
     * CONFIGURADOS e preenchidos (tipo de pessoa, CPF/CNPJ, empresa, Inscrição
     * Estadual/Municipal, data de nascimento e gênero), para o próprio cliente conferir
     * após o pedido.
     *
     * NÃO inclui e-mail, telefone NEM CELULAR: o WooCommerce já exibe o e-mail (resumo
     * do pedido) e o telefone no bloco de endereço — e o celular é impresso DENTRO do
     * endereço de cobrança e de entrega, logo abaixo do telefone (ver
     * `render_address_cellphone` / `render_block_address_cellphone`).
     *
     * Lê os metadados `_billing_*` do pedido (mesma fonte da NFe) — é só exibição:
     * não grava, não move dados para o endereço de entrega e não é enviado em e-mails.
     *
     * Renderizada por dois hooks (ver o registro em `define_public_hooks`), é
     * IDEMPOTENTE: renderiza uma vez por pedido, para não duplicar quando ambos
     * disparam. As linhas passam pelo filtro `woo_better_customer_details_rows`
     * (padrão: só os campos do woo-better) — cada item é `array('label' => ..., 'value' => ...)`.
     *
     * Aceita o `WC_Order` OU o ID do pedido (o hook `woocommerce_thankyou` passa o ID).
     *
     * @param WC_Order|int $order Pedido ou ID do pedido.
     * @return void
     */
    public function render_customer_additional_info($order)
    {
        if (is_numeric($order)) {
            $order = wc_get_order((int) $order);
        }

        if (! $order instanceof \WC_Order) {
            return;
        }

        if (get_option('woo_better_calc_enable_order_details', 'yes') !== 'yes') {
            return;
        }

        // Renderiza uma vez por pedido (o bloco dispara por dois hooks no mesmo pedido).
        $order_id = $order->get_id();
        if ($order_id && isset(self::$customer_details_rendered[$order_id])) {
            return;
        }
        if ($order_id) {
            self::$customer_details_rendered[$order_id] = true;
        }

        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $phone_mask  = get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no'));

        $rows = $this->prepare_billing_display_data(
            $order,
            $person_type,
            $phone_mask,
            $order->get_meta('_billing_persontype'),
            $order->get_meta('_billing_cpf'),
            $order->get_meta('_billing_cnpj'),
            $order->get_meta('_billing_phone_country_code')
        );

        // Remove do array os campos que não entram no bloco (contato/bairro/etc. são
        // tratados adiante).
        unset($rows['phone'], $rows['email'], $rows['cellphone']);

        $display = array();

        // E-mail, Telefone e CELULAR NÃO entram aqui: o WooCommerce já exibe o e-mail
        // (resumo do pedido) e o telefone no bloco de endereço — e o celular passou a
        // ser impresso DENTRO do endereço de cobrança e de entrega, logo abaixo do
        // telefone (`render_address_cellphone`/`render_block_address_cellphone`).
        // Aqui ficam só os campos brasileiros que o WC não conhece.

        // Campos brasileiros (tipo de pessoa, CPF/CNPJ, empresa, IE, IM, gênero) e, por
        // ÚLTIMO, a Data de Nascimento.
        $birthdate_row = isset($rows['birthdate']) ? $rows['birthdate'] : null;
        unset($rows['birthdate']);

        foreach ($rows as $row) {
            $display[] = $row;
        }

        if (null !== $birthdate_row) {
            $display[] = $birthdate_row;
        }

        /**
         * Filtra as linhas do bloco "Informações adicionais" da tela de detalhes do
         * pedido. Por padrão contém SÓ os campos do woo-better; use este filtro para
         * acrescentar/remover linhas (ex.: dados de outro plugin). Cada item é
         * `array('label' => string, 'value' => string)`.
         *
         * @param array    $display Linhas já formatadas (label/value).
         * @param WC_Order $order   Pedido exibido.
         */
        $display = apply_filters('woo_better_customer_details_rows', $display, $order);

        // Só exibe se houver algo preenchido.
        if (empty($display)) {
            return;
        }
        ?>
        <?php
        /*
         * As classes do WooCommerce aqui NÃO são decorativas: são o contrato de estilo
         * do core e de TODOS os temas. Os blocos nativos da tela ("Detalhes do pedido",
         * "Endereço de cobrança/entrega") são templates PHP que imprimem essas classes,
         * e é por elas que o visual é aplicado:
         *
         *  - `woocommerce-order-details` + `woocommerce-order-details__title` → a barra
         *    do título e a margem inferior (Astra: `.woocommerce-order h2
         *    .woocommerce-order-details__title`);
         *  - `woocommerce-table` + `shop_table` → a caixa (borda + raio do core);
         *  - `tbody th[scope=row]` + `td` → a MESMA linha "Chave: valor" que o
         *    "Detalhes do pedido" usa no `tfoot` (peso do label + borda de separação;
         *    a primeira linha não tem borda superior).
         *
         * Sem essas classes o bloco fica "solto" em qualquer tema.
         */
        ?>
        <section class="woocommerce-order-details woo-better-additional-info">
            <h2 class="woocommerce-order-details__title"><?php esc_html_e('Informações adicionais', 'woo-better-shipping-calculator-for-brazil'); ?></h2>
            <table class="woocommerce-table woocommerce-table--order-details shop_table order_details woo-better-additional-info__table">
                <tbody>
                    <?php foreach ($display as $row) : ?>
                        <tr>
                            <th scope="row"><?php echo esc_html($row['label']); ?>:</th>
                            <td><?php echo esc_html($row['value']); ?></td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>
        <?php
    }

    /**
     * Valida CPF usando algoritmo matemático
     * @param string $cpf - CPF apenas com números
     * @return boolean
     */
    private function validate_cpf($cpf) {
        // Remove caracteres não numéricos
        $cpf = preg_replace('/[^0-9]/', '', $cpf);
        
        // Verifica se tem 11 dígitos
        if (strlen($cpf) !== 11) {
            return false;
        }
        
        // Verifica sequências inválidas (111.111.111-11, 222.222.222-22, etc.)
        if (preg_match('/^(\d)\1{10}$/', $cpf)) {
            return false;
        }
        
        // Calcula primeiro dígito verificador
        $sum = 0;
        for ($i = 0; $i < 9; $i++) {
            $sum += intval($cpf[$i]) * (10 - $i);
        }
        $first_digit = 11 - ($sum % 11);
        if ($first_digit >= 10) {
            $first_digit = 0;
        }
        
        // Verifica primeiro dígito
        if (intval($cpf[9]) !== $first_digit) {
            return false;
        }
        
        // Calcula segundo dígito verificador
        $sum = 0;
        for ($i = 0; $i < 10; $i++) {
            $sum += intval($cpf[$i]) * (11 - $i);
        }
        $second_digit = 11 - ($sum % 11);
        if ($second_digit >= 10) {
            $second_digit = 0;
        }
        
        // Verifica segundo dígito
        return intval($cpf[10]) === $second_digit;
    }
    
    /**
     * Valida CNPJ usando algoritmo matemático
     * Suporta o novo CNPJ alfanumérico (IN RFB 2.229/2024), ativo a partir de julho/2026.
     * CNPJs puramente numéricos (legados) continuam validando normalmente.
     * @param string $cnpj - CNPJ com ou sem formatação (numérico ou alfanumérico)
     * @return boolean
     */
    private function validate_cnpj($cnpj) {
        // Normaliza: mantém apenas alfanumérico maiúsculo (dígitos 0-9 e letras A-Z)
        $cnpj = preg_replace('/[^0-9A-Z]/', '', strtoupper($cnpj));
        
        // Verifica se tem 14 caracteres
        if (strlen($cnpj) !== 14) {
            return false;
        }
        
        // Verifica sequências inválidas (ex: 00000000000000 ou AAAAAAAAAAAAAA)
        if (preg_match('/^(.)\1{13}$/', $cnpj)) {
            return false;
        }
        
        // Os dígitos verificadores (posições 13 e 14) devem ser sempre numéricos
        if (!ctype_digit(substr($cnpj, 12, 2))) {
            return false;
        }
        
        // Pesos para o cálculo dos dígitos verificadores
        $weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        $weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        
        // Calcula primeiro dígito verificador
        // Valor de cada caractere: ord(char) - 48
        // Dígitos: '0'=0 ... '9'=9 | Letras: 'A'=17 ... 'Z'=42
        $sum = 0;
        for ($i = 0; $i < 12; $i++) {
            $sum += (ord($cnpj[$i]) - 48) * $weights1[$i];
        }
        $first_digit = $sum % 11;
        $first_digit = $first_digit < 2 ? 0 : 11 - $first_digit;
        
        // Verifica primeiro dígito
        if (intval($cnpj[12]) !== $first_digit) {
            return false;
        }
        
        // Calcula segundo dígito verificador
        $sum = 0;
        for ($i = 0; $i < 13; $i++) {
            $sum += (ord($cnpj[$i]) - 48) * $weights2[$i];
        }
        $second_digit = $sum % 11;
        $second_digit = $second_digit < 2 ? 0 : 11 - $second_digit;
        
        // Verifica segundo dígito
        return intval($cnpj[13]) === $second_digit;
    }
    
    /**
     * Valida documento (CPF ou CNPJ) baseado no tamanho
     * @param string $document - Documento com ou sem formatação
     * @return array - ['is_valid' => boolean, 'type' => 'cpf'|'cnpj'|null, 'message' => string]
     */
    private function validate_document($document) {
        // Normaliza: mantém apenas alfanumérico maiúsculo para suportar CNPJ alfanumérico (IN RFB 2.229/2024)
        $clean_doc = preg_replace('/[^0-9A-Z]/', '', strtoupper($document));
        
        if (strlen($clean_doc) === 11) {
            $is_valid_cpf = $this->validate_cpf($clean_doc);
            return [
                'is_valid' => $is_valid_cpf,
                'type' => 'cpf',
                'message' => $is_valid_cpf ? '' : 'CPF inválido. Verifique os números informados.'
            ];
        } elseif (strlen($clean_doc) === 14) {
            $is_valid_cnpj = $this->validate_cnpj($clean_doc);
            return [
                'is_valid' => $is_valid_cnpj,
                'type' => 'cnpj',
                'message' => $is_valid_cnpj ? '' : 'CNPJ inválido. Verifique os números informados.'
            ];
        } else {
            return [
                'is_valid' => false,
                'type' => null,
                'message' => 'Documento deve ter 11 dígitos (CPF) ou 14 caracteres (CNPJ).'
            ];
        }
    }
    
    /**
     * Valida a existência do CNPJ na Receita Federal (camada adicional ao cálculo).
     *
     * Consulta a BrasilAPI e, em caso de indisponibilidade, usa a ReceitaWS como
     * fallback. Comportamento fail-closed: se nenhuma API responder, rejeita o CNPJ.
     *
     * @param string $document Documento CNPJ (com ou sem formatação).
     * @return string Mensagem de erro ou string vazia se válido.
     */
    private function validate_cnpj_existence($document) {
        if (get_option('woo_better_calc_enable_cnpj_api_validation', 'yes') !== 'yes') {
            return '';
        }

        $cnpj = preg_replace('/[^0-9A-Z]/', '', strtoupper($document));

        if (strlen($cnpj) !== 14) {
            return '';
        }

        // CNPJ alfanumérico (IN RFB 2.229/2024) também passa pela API. As APIs
        // ainda não suportam o novo formato (respondem 400), o que falha fechado
        // abaixo em vez de aceitar um CNPJ inexistente só pelo dígito verificador.
        $status = $this->cnpj_exists_via_api($cnpj);

        if ('found' === $status) {
            return '';
        }

        if ('not_found' === $status) {
            return __('CNPJ não encontrado na Receita Federal. Verifique o número informado.', 'woo-better-shipping-calculator-for-brazil');
        }

        if ('inactive' === $status) {
            return __('CNPJ com situação cadastral inativa na Receita Federal.', 'woo-better-shipping-calculator-for-brazil');
        }

        // 'unavailable' — fail-closed.
        return __('Não foi possível validar o CNPJ no momento. Tente novamente em instantes.', 'woo-better-shipping-calculator-for-brazil');
    }

    /**
     * Verifica a existência de um CNPJ via BrasilAPI (fallback ReceitaWS).
     *
     * @param string $cnpj CNPJ limpo (sem formatação, 14 caracteres).
     * @return string 'found' | 'not_found' | 'inactive' | 'unavailable'
     */
    private function cnpj_exists_via_api($cnpj) {
        $cache_key = 'woo_better_shipping_cnpj_' . $cnpj;
        $cached = get_transient($cache_key);

        if (false !== $cached) {
            return $cached;
        }

        $status = $this->cnpj_lookup_brasilapi($cnpj);

        if ('unavailable' === $status) {
            $status = $this->cnpj_lookup_receitaws($cnpj);
        }

        // Cacheia apenas resultados definitivos para reduzir chamadas e evitar rate limit.
        if ('found' === $status) {
            set_transient($cache_key, 'found', WEEK_IN_SECONDS);
        } elseif (in_array($status, array('not_found', 'inactive'), true)) {
            set_transient($cache_key, $status, DAY_IN_SECONDS);
        }

        return apply_filters('wc_better_shipping_calculator_cnpj_api_status', $status, $cnpj);
    }

    /**
     * Consulta a BrasilAPI para verificar a existência e a situação cadastral do CNPJ.
     *
     * @param string $cnpj CNPJ limpo (sem formatação).
     * @return string 'found' | 'not_found' | 'inactive' | 'unavailable'
     */
    private function cnpj_lookup_brasilapi($cnpj) {
        $url = 'https://brasilapi.com.br/api/cnpj/v1/' . rawurlencode($cnpj);

        $response = wp_remote_get($url, array(
            'timeout' => 5,
            'headers' => array('Accept' => 'application/json'),
        ));

        if (is_wp_error($response)) {
            return 'unavailable';
        }

        $http_code = (int) wp_remote_retrieve_response_code($response);

        if (200 === $http_code) {
            $body = json_decode(wp_remote_retrieve_body($response), true);
            $found_cnpj = isset($body['cnpj']) ? preg_replace('/[^0-9]/', '', (string) $body['cnpj']) : '';
            if ($found_cnpj !== $cnpj) {
                return 'unavailable';
            }

            $situacao = '';
            if (isset($body['descricao_situacao_cadastral'])) {
                $situacao = strtoupper(trim((string) $body['descricao_situacao_cadastral']));
            } elseif (isset($body['situacao_cadastral'])) {
                // 2 = ATIVA na tabela de situação cadastral da Receita Federal.
                $situacao = (2 === (int) $body['situacao_cadastral']) ? 'ATIVA' : 'INATIVA';
            }

            if ('' === $situacao) {
                return 'unavailable';
            }

            return ('ATIVA' === $situacao) ? 'found' : 'inactive';
        }

        if (404 === $http_code) {
            return 'not_found';
        }

        // 400 (CNPJ alfanumérico/novo formato), 429 (rate limit), 5xx e status inesperados.
        return 'unavailable';
    }

    /**
     * Consulta a ReceitaWS (fallback) para verificar a existência e a situação cadastral do CNPJ.
     *
     * @param string $cnpj CNPJ limpo (sem formatação).
     * @return string 'found' | 'inactive' | 'unavailable'
     */
    private function cnpj_lookup_receitaws($cnpj) {
        $url = 'https://receitaws.com.br/v1/cnpj/' . rawurlencode($cnpj);

        $response = wp_remote_get($url, array(
            'timeout' => 5,
            'headers' => array('Accept' => 'application/json'),
        ));

        if (is_wp_error($response)) {
            return 'unavailable';
        }

        $http_code = (int) wp_remote_retrieve_response_code($response);

        if (200 === $http_code) {
            $body = json_decode(wp_remote_retrieve_body($response), true);
            $is_ok = isset($body['status']) && 'OK' === strtoupper((string) $body['status']);
            $found_cnpj = isset($body['cnpj']) ? preg_replace('/[^0-9]/', '', (string) $body['cnpj']) : '';
            if (!$is_ok || $found_cnpj !== $cnpj) {
                return 'unavailable';
            }

            $situacao = isset($body['situacao']) ? strtoupper(trim((string) $body['situacao'])) : '';
            if ('' === $situacao) {
                return 'unavailable';
            }

            return ('ATIVA' === $situacao) ? 'found' : 'inactive';
        }

        // 404 ("not in cache"/"CNPJ inválido"), 429 e 5xx — trata como indisponível,
        // pois o 404 da ReceitaWS é ambíguo (pode significar apenas "ainda não cacheado").
        return 'unavailable';
    }

    /**
     * Valida o CNPJ no checkout em blocos (Gutenberg/Store API).
     *
     * Repete o mesmo fluxo do checkout clássico (cálculo + existência na Receita),
     * mas bloqueia o pedido lançando RouteException, que a Store API converte em
     * erro de checkout e impede a finalização.
     *
     * @param WC_Order      $order   Pedido em construção.
     * @param WP_REST_Request $request Requisição do checkout.
     * @return void
     */
    private function validate_cnpj_blocks($order, $request)
    {
        if (get_option('woo_better_calc_person_type_select', 'none') === 'none') {
            return;
        }

        // Fora do Brasil não há CPF/CNPJ obrigatório.
        $billing_country = $order->get_billing_country();
        if (!empty($billing_country) && 'BR' !== $billing_country) {
            return;
        }

        $extensions = $request->get_param('extensions') ?? [];
        $billing_cnpj = '';
        $billing_document = '';

        if (isset($extensions['woo_better_person_type']['billing_cnpj'])) {
            $billing_cnpj = sanitize_text_field($extensions['woo_better_person_type']['billing_cnpj']);
        }
        if (empty($billing_cnpj) && isset($_POST['billing_cnpj'])) {
            $billing_cnpj = sanitize_text_field(wp_unslash($_POST['billing_cnpj']));
        }
        if (isset($_POST['billing_document'])) {
            $billing_document = sanitize_text_field(wp_unslash($_POST['billing_document']));
        }

        $document = !empty($billing_cnpj) ? $billing_cnpj : $billing_document;
        $clean = preg_replace('/[^0-9A-Z]/', '', strtoupper($document));

        // Não é CNPJ (ou está incompleto): nada a validar nesta camada.
        if (strlen($clean) !== 14) {
            return;
        }

        // Camada 1: cálculo do dígito verificador (idêntica ao JS e ao clássico).
        if (!$this->validate_cnpj($clean)) {
            throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException(
                'woo_better_calc_cnpj_invalid',
                esc_html__('CNPJ inválido. Verifique os números informados.', 'woo-better-shipping-calculator-for-brazil'),
                400
            );
        }

        // Camada 2: existência na Receita Federal (BrasilAPI + fallback ReceitaWS).
        $api_error = $this->validate_cnpj_existence($clean);
        if (!empty($api_error)) {
            throw new \Automattic\WooCommerce\StoreApi\Exceptions\RouteException(
                'woo_better_calc_cnpj_invalid',
                esc_html($api_error),
                400
            );
        }
    }

    /**
     * Valida documentos de tipo de pessoa no checkout tradicional
     */
    public function validate_person_type_documents() {
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        
        // Só valida se o recurso estiver habilitado
        if ($person_type === 'none') {
            return;
        }
        
        // Verifica se é Brasil
        if (!$this->is_brazil_checkout()) {
            return;
        }
        
        // Captura dados do formulário
        $billing_cpf = isset($_POST['billing_cpf']) ? sanitize_text_field(wp_unslash($_POST['billing_cpf'])) : '';
        $billing_cnpj = isset($_POST['billing_cnpj']) ? sanitize_text_field(wp_unslash($_POST['billing_cnpj'])) : '';
        $billing_document = isset($_POST['billing_document']) ? sanitize_text_field(wp_unslash($_POST['billing_document'])) : '';
        
        $document_to_validate = '';
        $expected_type = null;
        
        // Determina qual documento validar
        if (!empty($billing_document)) {
            $document_to_validate = $billing_document;
        } elseif (!empty($billing_cpf)) {
            $document_to_validate = $billing_cpf;
            $expected_type = 'cpf';
        } elseif (!empty($billing_cnpj)) {
            $document_to_validate = $billing_cnpj;
            $expected_type = 'cnpj';
        }
        
        // Se não há documento para validar, verifica se é obrigatório
        if (empty($document_to_validate)) {
            $error_message = $this->get_document_required_message($person_type);
            if (!empty($error_message)) {
                wc_add_notice($error_message, 'error');
            }
            return;
        }
        
        // Valida o documento primeiro para determinar o tipo
        $validation = $this->validate_document($document_to_validate);
        
        // Verifica se é válido
        if (!$validation['is_valid']) {
            wc_add_notice($validation['message'], 'error');
            return;
        }
        
        // Verifica se o tipo está correto com a configuração
        $type_allowed = $this->is_document_type_allowed($validation['type'], $person_type);
        if (!$type_allowed) {
            $error_message = $this->get_document_type_error_message($validation['type'], $person_type);
            wc_add_notice($error_message, 'error');
        }

        // Camada adicional: confirma existência do CNPJ na Receita Federal
        // (somente se o tipo de documento for permitido pela configuração).
        if ($type_allowed && 'cnpj' === $validation['type']) {
            $api_error = $this->validate_cnpj_existence($document_to_validate);
            if (!empty($api_error)) {
                wc_add_notice($api_error, 'error');
            }
        }
    }
    
    /**
     * Verifica se é checkout do Brasil
     */
    private function is_brazil_checkout() {
        if (function_exists('WC') && WC()->customer) {
            $billing_country = WC()->customer->get_billing_country();
            $shipping_country = WC()->customer->get_shipping_country();
            return $billing_country === 'BR' || $shipping_country === 'BR';
        }
        return true; // Assume Brasil por padrão
    }
    
    /**
     * Valida campo de data de nascimento no checkout
     */
    public function validate_birthdate_value() {
        // Verifica se o campo está habilitado
        if (get_option('woo_better_calc_enable_birthdate_field', 'no') !== 'yes') {
            return;
        }

        // Verifica se é Brasil
        if (!$this->is_brazil_checkout()) {
            return;
        }
        
        // Captura dados do formulário
        $billing_birthdate = isset($_POST['billing_birthdate']) ? sanitize_text_field(wp_unslash($_POST['billing_birthdate'])) : '';

        // Validação de data de nascimento
        if (!empty($billing_birthdate)) {
            $raw_birthdate = $billing_birthdate;
            $billing_birthdate = $this->normalize_birthdate_value($billing_birthdate);

            if ($billing_birthdate === '') {
                wc_add_notice('Formato de data de nascimento inválido.', 'error');
                return;
            }

            $birthdate_validation = $this->validate_birthdate($billing_birthdate);
            if (!$birthdate_validation['is_valid']) {
                wc_add_notice($birthdate_validation['message'], 'error');
                return;
            }
        }

        // Gênero é opcional - não há validação obrigatória
    }

    /**
     * Valida campo de Inscrição Estadual (IE) no checkout clássico.
     *
     * Quando o recurso está habilitado, exige o preenchimento da IE em todos os
     * cenários do checkout clássico.
     *
     * @return void
     */
    public function validate_ie_field_value_classic() {
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($ie_field_enabled !== 'yes' || ($person_type !== 'legal' && $person_type !== 'both')) {
            return;
        }

        $billing_document = isset($_POST['billing_document']) ? sanitize_text_field(wp_unslash($_POST['billing_document'])) : '';
        $billing_cpf = isset($_POST['billing_cpf']) ? sanitize_text_field(wp_unslash($_POST['billing_cpf'])) : '';
        $billing_cnpj = isset($_POST['billing_cnpj']) ? sanitize_text_field(wp_unslash($_POST['billing_cnpj'])) : '';

        if (empty($billing_document)) {
            if (!empty($billing_cpf)) {
                $billing_document = $billing_cpf;
            } elseif (!empty($billing_cnpj)) {
                $billing_document = $billing_cnpj;
            }
        }

        $clean_document = preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_document));
        $is_cpf_document = strlen($clean_document) === 11;
        $is_cnpj_document = strlen($clean_document) === 14;

        // IE só é obrigatória quando for CNPJ (ou quando configuração for exclusivamente jurídica).
        $should_require_ie = ($person_type === 'legal') || $is_cnpj_document;

        if ($is_cpf_document || !$should_require_ie) {
            return;
        }

        $billing_ie = isset($_POST['billing_ie']) ? strtoupper(sanitize_text_field(wp_unslash($_POST['billing_ie']))) : '';

        if ('' === trim($billing_ie)) {
            wc_add_notice(__('Por favor, preencha a Inscrição Estadual (IE) ou marque como ISENTO.', 'woo-better-shipping-calculator-for-brazil'), 'error');
        }
    }

    /**
     * Valida o preenchimento da Inscrição Municipal (IM) no checkout clássico (shortcode).
     *
     * Espelha `validate_ie_field_value_classic`, porém a IM é SEMPRE obrigatória
     * (não há opção "Isento" como no IE): exige um valor preenchido quando o
     * documento é CNPJ (ou o Tipo de Cliente é exclusivamente jurídico). Não aplica
     * cálculo de dígito verificador — a IM não tem padrão nacional (regra municipal).
     *
     * @return void
     */
    public function validate_im_field_value_classic() {
        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($im_field_enabled !== 'yes' || ($person_type !== 'legal' && $person_type !== 'both')) {
            return;
        }

        $billing_document = isset($_POST['billing_document']) ? sanitize_text_field(wp_unslash($_POST['billing_document'])) : '';
        $billing_cpf = isset($_POST['billing_cpf']) ? sanitize_text_field(wp_unslash($_POST['billing_cpf'])) : '';
        $billing_cnpj = isset($_POST['billing_cnpj']) ? sanitize_text_field(wp_unslash($_POST['billing_cnpj'])) : '';

        if (empty($billing_document)) {
            if (!empty($billing_cpf)) {
                $billing_document = $billing_cpf;
            } elseif (!empty($billing_cnpj)) {
                $billing_document = $billing_cnpj;
            }
        }

        $clean_document = preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_document));
        $is_cpf_document = strlen($clean_document) === 11;
        $is_cnpj_document = strlen($clean_document) === 14;

        // IM só é obrigatória quando for CNPJ (ou quando a configuração for jurídica).
        $should_require_im = ($person_type === 'legal') || $is_cnpj_document;

        if ($is_cpf_document || !$should_require_im) {
            return;
        }

        $billing_im = isset($_POST['billing_im']) ? strtoupper(sanitize_text_field(wp_unslash($_POST['billing_im']))) : '';

        if ('' === trim($billing_im)) {
            wc_add_notice(__('Por favor, preencha a Inscrição Municipal (IM).', 'woo-better-shipping-calculator-for-brazil'), 'error');
        }
    }

    /**
     * Verifica se o recurso "Campo RG" está ativo.
     *
     * O RG é um documento de PESSOA FÍSICA, então depende do "Tipo de Cliente"
     * permitir pessoa física (`physical` ou `both`).
     *
     * @return bool
     */
    private function rg_field_enabled()
    {
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        return 'yes' === get_option('woo_better_calc_enable_rg_field', 'no')
            && in_array($person_type, array('physical', 'both'), true);
    }

    /**
     * Calcula a prioridade do campo RG: o primeiro número livre DEPOIS do campo
     * de documento (CPF/CNPJ), para o RG aparecer logo abaixo do campo pai.
     *
     * Por que não usar um número fixo: o checkout clássico já ocupa 27 (documento),
     * 28-30 (persontype/CPF/CNPJ, `type=hidden`), 31 (Empresa), 32 (IE), 33 (IM) e
     * 34 (CEP, quando "Posição do CEP" está ligada) — um valor fixo em 34 empatava
     * com o **CEP**, e o RG caía depois do checkbox do CEP. No EDIT-ADDRESS o mapa
     * é outro (Empresa em 28), então o slot livre muda de tela para tela.
     *
     * Campos `type=hidden` são IGNORADOS: o WooCommerce até imprime um `<p>` para
     * eles, mas sem altura (não ocupam espaço visual), então empatar com eles é
     * inofensivo — o que não pode é empatar com campo visível (a ordem entre
     * prioridades iguais fica indefinida).
     *
     * @param array $fields    Campos do endereço (billing ou o array plano do edit-address).
     * @param int   $document_priority Prioridade do campo de documento.
     * @return int
     */
    private function rg_field_priority($fields, $document_priority = 27)
    {
        $used = array();

        if (is_array($fields)) {
            foreach ($fields as $field) {
                if (! is_array($field)) {
                    continue;
                }
                if (isset($field['type']) && 'hidden' === $field['type']) {
                    continue;
                }
                if (isset($field['priority'])) {
                    $used[(int) $field['priority']] = true;
                }
            }
        }

        $priority = (int) $document_priority + 1;
        while (isset($used[$priority])) {
            $priority++;
        }

        return $priority;
    }

    /**
     * Verifica se o RG é obrigatório quando visível (padrão: opcional).
     *
     * @return bool
     */
    private function rg_field_required()
    {
        return 'yes' === get_option('woo_better_calc_rg_required', 'no');
    }

    /**
     * Normaliza o valor do RG.
     *
     * Mantém o MESMO formato aceito pelo plugin "Brazilian Market on WooCommerce"
     * (que usa o meta `billing_rg`/`_billing_rg` — id universal aceito pelos
     * aplicativos de NF-e): dígitos, letras (inclusive o "X" do dígito de São
     * Paulo), ponto, barra e hífen, em MAIÚSCULAS e com no máximo 20 caracteres.
     *
     * @param string $value Valor cru (POST/meta/API).
     * @return string
     */
    private function sanitize_rg_value($value)
    {
        $value = strtoupper(sanitize_text_field((string) $value));
        $value = preg_replace('/[^0-9A-Z\.\-\/ ]/', '', $value);

        return substr(trim((string) $value), 0, 20);
    }

    /**
     * Remove a formatação do documento (CPF/CNPJ) para contagem de caracteres.
     *
     * @param string $document
     * @return string
     */
    private function document_clean_value($document)
    {
        return preg_replace('/[^0-9A-Z]/', '', strtoupper((string) $document));
    }

    /**
     * Valida o preenchimento do RG no checkout clássico (shortcode).
     *
     * O RG fica VINCULADO ao CPF: só é exibido — e só é exigido — quando o
     * documento informado é um CPF (11 dígitos). Com CNPJ o campo não aparece,
     * então nada é exigido. A obrigatoriedade só vale com a opção "RG
     * obrigatório" ligada (padrão: opcional). Não há cálculo de dígito
     * verificador: o RG não tem padrão nacional (a regra varia por UF).
     *
     * @return void
     */
    public function validate_rg_field_value_classic()
    {
        if (! $this->rg_field_enabled() || ! $this->rg_field_required()) {
            return;
        }

        $billing_document = isset($_POST['billing_document']) ? sanitize_text_field(wp_unslash($_POST['billing_document'])) : '';
        $billing_cpf = isset($_POST['billing_cpf']) ? sanitize_text_field(wp_unslash($_POST['billing_cpf'])) : '';

        if ('' === $billing_document) {
            $billing_document = $billing_cpf;
        }

        // RG só existe para pessoa física (documento CPF).
        if (11 !== strlen($this->document_clean_value($billing_document))) {
            return;
        }

        $billing_rg = isset($_POST['billing_rg']) ? $this->sanitize_rg_value(wp_unslash($_POST['billing_rg'])) : '';

        if ('' === $billing_rg) {
            wc_add_notice(__('Por favor, preencha o RG.', 'woo-better-shipping-calculator-for-brazil'), 'error');
        }
    }

    /**
     * Retorna o tipo de erro do telefone, usando o libphonenumber (~300 países).
     *
     * - null     : válido
     * - 'ddd'    : número não casa o padrão/código de área (DDD) do país
     * - 'invalid': comprimento errado (muito curto ou muito longo) ou tipo não aceito
     *
     * @param string $phone        Telefone (pode vir com ou sem DDI/formatação)
     * @param string $country_code Ex.: '+55' (vazio = assume Brasil)
     * @param string $kind         'phone' (fixo) | 'cellphone' (celular)
     * @return string|null
     */
    private function phone_validation_error($phone, $country_code = '', $kind = 'phone') {
        // Normaliza para E.164 (+DDInúmero) usando a rotina existente do plugin.
        $normalized = $this->format_complete_phone($phone, $country_code);
        if ('' === $normalized) {
            return null;
        }

        if (! class_exists('\\libphonenumber\\PhoneNumberUtil')) {
            // Lib não instalada (composer install pendente): não bloqueia o checkout.
            return null;
        }

        // Máscara BR (sem lib/DDI): o campo é do Brasil. Um DDI de OUTRO país
        // explícito (`+1...`) reprova — a validação é só brasileira.
        if ($this->is_phone_brazil_mask_active() && strpos($normalized, '+') === 0 && strpos($normalized, '+55') !== 0) {
            return 'invalid';
        }

        $phone_util = \libphonenumber\PhoneNumberUtil::getInstance();

        try {
            // 'BR' é o fallback quando o número chega sem DDI (nacional).
            $number = $phone_util->parse($normalized, 'BR');
        } catch (\libphonenumber\NumberParseException $e) {
            return 'invalid';
        }

        // Comprimento inválido → erro genérico de número.
        if (! $phone_util->isPossibleNumber($number)) {
            return 'invalid';
        }

        // Comprimento ok, mas o padrão/DDD do país não casa → DDD inválido.
        if (! $phone_util->isValidNumber($number)) {
            return 'ddd';
        }

        // Aceita o tipo certo: o campo "Celular" aceita MOBILE. O campo "Telefone"
        // só restringe a FIXED_LINE no modo "Somente Fixo"; no "Celular e Fixo" ele é
        // "Celular/Telefone" e aceita tanto fixo quanto celular (MOBILE). Em todos,
        // FIXED_LINE_OR_MOBILE entra porque o intl-tel-input (cliente) também o
        // considera válido (números ambíguos, comuns fora do BR). Rejeita
        // toll-free/premium/etc.
        $type = $phone_util->getNumberType($number);
        if ('cellphone' === $kind) {
            $allowed = array( \libphonenumber\PhoneNumberType::MOBILE, \libphonenumber\PhoneNumberType::FIXED_LINE_OR_MOBILE );
        } elseif ('landline_only' === $this->get_phone_mode()) {
            $allowed = array( \libphonenumber\PhoneNumberType::FIXED_LINE, \libphonenumber\PhoneNumberType::FIXED_LINE_OR_MOBILE );
        } else {
            $allowed = array(
                \libphonenumber\PhoneNumberType::FIXED_LINE,
                \libphonenumber\PhoneNumberType::MOBILE,
                \libphonenumber\PhoneNumberType::FIXED_LINE_OR_MOBILE
            );
        }
        if (! in_array($type, $allowed, true)) {
            return 'invalid';
        }

        return null;
    }

    /**
     * Indica se o telefone informado é um CELULAR (MOBILE).
     *
     * Usa o `phone_validation_error` (libphonenumber) com o tipo 'cellphone': só
     * MOBILE/FIXED_LINE_OR_MOBILE passam. Um FIXO (ou número inválido) retorna
     * false. Sem a lib instalada, `phone_validation_error` devolve null (não
     * bloqueia) → considerado celular, o que mantém o comportamento tolerante.
     *
     * @param string $phone        Telefone (pode vir com/sem DDI/formatação).
     * @param string $country_code Ex.: '+55'.
     * @return bool
     */
    private function is_cellphone_number($phone, $country_code = '')
    {
        return null === $this->phone_validation_error($phone, $country_code, 'cellphone');
    }

    /**
     * Espelha o TELEFONE na meta `*_cellphone` (shim "Celular Oculto").
     *
     * O modo "Celular e Fixo" com o "Campo de Celular" DESLIGADO gera um
     * `*_cellphone` ESCONDIDO que ESPELHA o telefone (compatibilidade PagBank/
     * Asaas/NFe). Como o campo de telefone aceita fixo E celular, é preciso uma
     * verificação extra no envio: só espelha quando o número é de fato um CELULAR
     * (MOBILE). Um FIXO não pode preencher o campo de celular — retorna '' para
     * LIMPÁ-LO, permitindo apenas números de celular na meta.
     *
     * @param string $phone        Telefone de origem (pode vir com/sem DDI/formatação).
     * @param string $country_code Ex.: '+55'.
     * @return string E.164 (+DDInúmero) quando for celular; '' caso contrário.
     */
    private function mirror_phone_to_cellphone($phone, $country_code = '')
    {
        $phone = trim((string) $phone);
        if ('' === $phone) {
            return '';
        }

        $normalized = $this->format_complete_phone($phone, $country_code);
        if ('' === $normalized || ! $this->is_cellphone_number($normalized, $country_code)) {
            return '';
        }

        return $normalized;
    }

    /**
     * Valida o número de telefone no checkout clássico (shortcode).
     *
     * Aplica somente quando a opção "Validar Número de Telefone" está habilitada.
     * Com a máscara/DDI a validação usa o DDI informado (todos os países); sem ela
     * (máscara BR), o número é sempre nacional — valida apenas o Brasil. No checkout
     * em blocos a validação é feita no cliente.
     *
     * @return void
     */
    public function validate_phone_ddd_classic() {
        // No modo "Desabilitar" o woo-better não gerencia o telefone: não valida o
        // campo nativo (nem bloqueia o checkout).
        if (! $this->phone_mode_hides_native_option()) {
            return;
        }

        $validate_enabled = get_option('woo_better_calc_validate_ddd', 'yes');

        // A validação vale com a lib/DDI E também sem ela (máscara BR): nesse caso o
        // número é sempre nacional, então a validação é a do Brasil (DDI +55).
        if ($validate_enabled !== 'yes') {
            return;
        }

        $default_country = $this->is_phone_brazil_mask_active() ? '+55' : '';

        $billing_phone = isset($_POST['billing_phone']) ? sanitize_text_field(wp_unslash($_POST['billing_phone'])) : '';
        $billing_country = ! empty($_POST['billing_phone_country']) ? sanitize_text_field(wp_unslash($_POST['billing_phone_country'])) : $default_country;

        // Só valida (tipo/DDD) quando o campo é OBRIGATÓRIO. Campo opcional não é
        // validado, mesmo preenchido.
        $phone_required     = get_option('woo_better_calc_contact_required', 'no') === 'yes';
        $cellphone_required = get_option('woo_better_calc_cellphone_required', 'no') === 'yes';

        // No modo "Somente Celular" o campo billing_phone carrega o celular; nos
        // demais, é o telefone fixo.
        $billing_kind = ('cellphone_only' === $this->get_phone_mode()) ? 'cellphone' : 'phone';

        if ($phone_required && '' !== trim($billing_phone) && null !== $this->phone_validation_error($billing_phone, $billing_country, $billing_kind)) {
            wc_add_notice(__('Número de telefone inválido.', 'woo-better-shipping-calculator-for-brazil'), 'error');
            return;
        }

        // Campo "Celular" separado (modo "Celular e Fixo"): valida como MOBILE.
        if ($cellphone_required && isset($_POST['billing_cellphone'])) {
            $billing_cellphone = sanitize_text_field(wp_unslash($_POST['billing_cellphone']));
            if ('' !== trim($billing_cellphone) && null !== $this->phone_validation_error($billing_cellphone, $billing_country, 'cellphone')) {
                wc_add_notice(__('Número de celular inválido.', 'woo-better-shipping-calculator-for-brazil'), 'error');
                return;
            }
        }

        $ship_to_different = isset($_POST['ship_to_different_address']) ? sanitize_text_field(wp_unslash($_POST['ship_to_different_address'])) : '';
        if ($ship_to_different) {
            $shipping_phone = isset($_POST['shipping_phone']) ? sanitize_text_field(wp_unslash($_POST['shipping_phone'])) : '';
            $shipping_country = ! empty($_POST['shipping_phone_country']) ? sanitize_text_field(wp_unslash($_POST['shipping_phone_country'])) : $default_country;

            if ($phone_required && '' !== trim($shipping_phone) && null !== $this->phone_validation_error($shipping_phone, $shipping_country, $billing_kind)) {
                wc_add_notice(__('Número de telefone de entrega inválido.', 'woo-better-shipping-calculator-for-brazil'), 'error');
            }

            if ($cellphone_required && isset($_POST['shipping_cellphone'])) {
                $shipping_cellphone = sanitize_text_field(wp_unslash($_POST['shipping_cellphone']));
                if ('' !== trim($shipping_cellphone) && null !== $this->phone_validation_error($shipping_cellphone, $shipping_country, 'cellphone')) {
                    wc_add_notice(__('Número de celular de entrega inválido.', 'woo-better-shipping-calculator-for-brazil'), 'error');
                }
            }
        }
    }
    
    /**
     * Valida data de nascimento
     * @param string $birthdate Data no formato YYYY-MM-DD
     * @return array ['is_valid' => bool, 'message' => string]
     */
    private function validate_birthdate($birthdate) {
        // Verifica se a data é válida
        $date_obj = \DateTime::createFromFormat('Y-m-d', $birthdate);
        if (!$date_obj || $date_obj->format('Y-m-d') !== $birthdate) {
            return [
                'is_valid' => false,
                'message' => 'Formato de data de nascimento inválido.'
            ];
        }
        
        $now = new \DateTime();
        
        // Verifica se a data não é futura
        if ($date_obj > $now) {
            return [
                'is_valid' => false,
                'message' => 'A data de nascimento não pode ser no futuro.'
            ];
        }
        
        // Calcula idade
        $age = $now->diff($date_obj)->y;
        

        
        // Verifica idade máxima razoável (120 anos)
        if ($age > 120) {
            return [
                'is_valid' => false,
                'message' => 'Por favor, verifique a data de nascimento. A idade não pode ser superior a 120 anos.'
            ];
        }
        
        return [
            'is_valid' => true,
            'message' => ''
        ];
    }

    /**
     * Normaliza data de nascimento para o formato Y-m-d
     * Aceita Y-m-d (primário) e d/m/Y (fallback para contexto brasileiro)
     * Rejeita qualquer outro formato retornando string vazia
     *
     * @param string $birthdate Data em qualquer formato
     * @return string Data no formato Y-m-d ou string vazia se formato inválido
     */
    private function normalize_birthdate_value($birthdate) {
        $birthdate = trim((string) $birthdate);
        if ($birthdate === '') {
            return '';
        }

        foreach (['Y-m-d', 'd/m/Y'] as $format) {
            $date = \DateTime::createFromFormat('!' . $format, $birthdate);
            $errors = \DateTime::getLastErrors();
            if ($date instanceof \DateTime &&
                ($errors === false || ($errors['warning_count'] === 0 && $errors['error_count'] === 0)) &&
                $date->format($format) === $birthdate) {
                return $date->format('Y-m-d');
            }
        }

        return '';
    }

    /**
     * Formata CPF baseado na configuração de máscara
     * @param string $cpf - CPF com ou sem formatação
     * @return string CPF formatado ou apenas números
     */
    private function cpf_number_format($cpf) {
        $apply_mask = get_option('woo_better_calc_apply_cpf_mask', 'yes');
        
        // Remove todos os caracteres não numéricos
        $clean_cpf = preg_replace('/[^0-9]/', '', $cpf);
        
        // Se deve aplicar máscara, formata; senão retorna apenas números
        if ($apply_mask === 'yes') {
            // Aplica máscara ###.###.###-##
            if (strlen($clean_cpf) === 11) {
                return substr($clean_cpf, 0, 3) . '.' . 
                       substr($clean_cpf, 3, 3) . '.' . 
                       substr($clean_cpf, 6, 3) . '-' . 
                       substr($clean_cpf, 9, 2);
            }
            return $cpf; // Retorna original se não tem 11 dígitos
        }
        
        return $clean_cpf; // Retorna apenas números
    }
    
    /**
     * Formata CNPJ baseado na configuração de máscara
     * @param string $cnpj - CNPJ com ou sem formatação
     * @return string CNPJ formatado ou apenas números
     */
    private function cnpj_number_format($cnpj) {
        $apply_mask = get_option('woo_better_calc_apply_cnpj_mask', 'yes');
        
        // Mantém apenas alfanumérico maiúsculo (suporte ao CNPJ alfanumérico — IN RFB 2.229/2024)
        $clean_cnpj = preg_replace('/[^0-9A-Z]/', '', strtoupper($cnpj));
        
        // Se deve aplicar máscara, formata; senão retorna sem separadores
        if ($apply_mask === 'yes') {
            // Aplica máscara AA.AAA.AAA/AAAA-DV
            if (strlen($clean_cnpj) === 14) {
                return substr($clean_cnpj, 0, 2) . '.' . 
                       substr($clean_cnpj, 2, 3) . '.' . 
                       substr($clean_cnpj, 5, 3) . '/' . 
                       substr($clean_cnpj, 8, 4) . '-' . 
                       substr($clean_cnpj, 12, 2);
            }
            return $cnpj; // Retorna original se não tem 14 caracteres
        }
        
        return $clean_cnpj; // Retorna apenas alfanumérico sem separadores
    }
    
    /**
     * Verifica se o tipo de documento é permitido na configuração
     */
    private function is_document_type_allowed($document_type, $person_type_config) {
        if ($person_type_config === 'both') {
            return true; // Qualquer tipo é permitido
        }
        if ($person_type_config === 'physical') {
            return $document_type === 'cpf';
        }
        if ($person_type_config === 'legal') {
            return $document_type === 'cnpj';
        }
        return false;
    }
    
    /**
     * Retorna mensagem de erro para documento obrigatório
     */
    private function get_document_required_message($person_type) {
        if ($person_type === 'physical') {
            return 'Por favor, insira seu CPF.';
        } elseif ($person_type === 'legal') {
            return 'Por favor, insira seu CNPJ.';
        } elseif ($person_type === 'both') {
            return 'Por favor, insira seu CPF ou CNPJ.';
        }
        return '';
    }
    
    /**
     * Retorna mensagem de erro para tipo de documento incorreto
     */
    private function get_document_type_error_message($document_type, $person_type_config) {
        if ($person_type_config === 'physical' && $document_type === 'cnpj') {
            return 'CNPJ não é permitido. Por favor, insira seu CPF.';
        } elseif ($person_type_config === 'legal' && $document_type === 'cpf') {
            return 'CPF não é permitido. Por favor, insira seu CNPJ.';
        }
        return 'Tipo de documento não permitido.';
    }

    public function process_checkout_data_classic($order_id, $data)
    {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }
        
        // LOG: Captura números de telefone do pedido para debug
        $billing_phone = $order->get_billing_phone();
        $shipping_phone = $order->get_shipping_phone();

        // Detecta se está usando o mesmo endereço para aplicar nos telefones
        $use_same_address = $this->detect_same_address_usage($order, $data);
        
        // Lógica de sincronização de telefones considerando o checkbox de mesmo endereço.
        // Só quando o woo-better gerencia o telefone (no modo "Desabilitar" não mexe).
        if ($use_same_address && $this->phone_mode_hides_native_option()) {
            // Se usar mesmo endereço, prioriza o telefone de cobrança (billing)
            if (!empty($billing_phone)) {
                $order->set_shipping_phone($billing_phone);
            } elseif (!empty($shipping_phone)) {
                $order->set_billing_phone($shipping_phone);
            }
        }

        // Processa números de endereço primeiro
        $this->process_address_numbers_from_data($order, $data);
        
        // Processa dados de tipo de pessoa
        $this->process_person_type_from_data($order, $data);
        
        // Processa dados de bairro
        $this->process_neighborhood_from_data($order, $data);
        
        // Processa dados de data de nascimento
        $this->process_birthdate_from_data($order, $data);
        
        // Processa dados de gênero
        $this->process_gender_from_data($order, $data);

        // Processa dados de Inscrição Estadual (IE)
        $this->process_ie_from_data($order, $data);

        // Processa dados de Inscrição Municipal (IM)
        $this->process_im_from_data($order, $data);

        // Processa dados de RG (vinculado ao CPF)
        $this->process_rg_from_data($order, $data);

        $billing_country_code = '';
        $shipping_country_code = '';
        
        // Salvar código do país do telefone de faturação (campos tradicionais)
        if (isset($data['billing_phone_country']) && !empty($data['billing_phone_country'])) {
            $billing_country_code = sanitize_text_field($data['billing_phone_country']);
        }
        
        // Salvar código do país do telefone de entrega (campos tradicionais)
        if (isset($data['shipping_phone_country']) && !empty($data['shipping_phone_country'])) {
            $shipping_country_code = sanitize_text_field($data['shipping_phone_country']);
        }

        // Lógica aprimorada considerando o checkbox de mesmo endereço
        if ($use_same_address) {
            // Se usar mesmo endereço, prioriza o código de cobrança (billing)
            if (!empty($billing_country_code)) {
                $shipping_country_code = $billing_country_code;
            } elseif (!empty($shipping_country_code)) {
                $billing_country_code = $shipping_country_code;
            }
        } else {
            // Lógica original quando não usa mesmo endereço
            if (!empty($billing_country_code) && empty($shipping_country_code)) {
                $shipping_country_code = $billing_country_code;
            } elseif (!empty($shipping_country_code) && empty($billing_country_code)) {
                $billing_country_code = $shipping_country_code;
            }
        }

        // Normaliza os telefones do pedido para o formato limpo (+DDInúmero,
        // sem caracteres especiais), concatenando o DDI ao número.
        $this->normalize_order_phone($order, 'billing', $billing_country_code);
        $this->normalize_order_phone($order, 'shipping', $shipping_country_code);

        // Máscara BR (sem DDI): o país do telefone é sempre o Brasil — registra o
        // `+55` no pedido para a exibição (recibo/admin) continuar montando o E.164.
        if ($this->is_phone_brazil_mask_active()) {
            $billing_country_code  = $billing_country_code ? $billing_country_code : '+55';
            $shipping_country_code = $shipping_country_code ? $shipping_country_code : '+55';
        }

        // Reafirma o telefone do PERFIL do usuário com o valor normalizado do pedido
        // (o WC core, no checkout, salva o customer a partir do campo nativo cru).
        $this->sync_customer_phone_from_order($order);

        // Salvar código do país do telefone de faturação
        if (!empty($billing_country_code)) {
            $order->update_meta_data('_billing_phone_country_code', $billing_country_code);
        }
        
        // Salvar código do país do telefone de entrega
        if (!empty($shipping_country_code)) {
            $order->update_meta_data('_shipping_phone_country_code', $shipping_country_code);
        }

        $order->save();
    }

    /**
     * Atualizar billing_document quando o perfil do usuário é atualizado
     *
     * @param int $user_id
     * @since 4.7.0
     */
    public function update_billing_document_on_profile_update($user_id)
    {
        // Obter dados salvos no user meta
        $billing_persontype = get_user_meta($user_id, 'billing_persontype', true);
        $billing_cpf = get_user_meta($user_id, 'billing_cpf', true);
        $billing_cnpj = get_user_meta($user_id, 'billing_cnpj', true);
        
        // Construir billing_document baseado no billing_persontype
        $billing_document = '';
        if ($billing_persontype === '1' && !empty($billing_cpf)) {
            // Pessoa física - usar CPF
            $billing_document = $billing_cpf;
        } elseif ($billing_persontype === '2' && !empty($billing_cnpj)) {
            // Pessoa jurídica - usar CNPJ
            $billing_document = $billing_cnpj;
        } elseif (empty($billing_persontype)) {
            // Fallback quando não há tipo definido - usar qualquer documento disponível
            if (!empty($billing_cpf)) {
                $billing_document = $billing_cpf;
            } elseif (!empty($billing_cnpj)) {
                $billing_document = $billing_cnpj;
            }
        }
        
        // Atualizar billing_document no user meta se há documento para salvar
        if (!empty($billing_document)) {
            update_user_meta($user_id, 'billing_document', $billing_document);
        }
    }

    /**
     * Sincroniza o comportamento do campo Empresa quando a option nativa do
     * WooCommerce muda (ex.: toggle "Empresa" no editor de blocos do checkout).
     *
     * @param string $option    Nome da option alterada.
     * @param mixed  $old_value Valor anterior.
     * @param mixed  $value     Novo valor.
     */
    public function sync_company_field_on_option_update($option, $old_value, $value) {
        // Só reage à option do campo Empresa do WooCommerce.
        if ('woocommerce_checkout_company_field' !== $option) {
            return;
        }

        // Ignora disparos sem mudança real de valor.
        if ($old_value === $value) {
            return;
        }
        
        $this->execute_company_field_sync();
    }

    /**
     * Executa a sincronização do campo empresa
     */
    private function execute_company_field_sync() {
        $company_company_field = get_option('woocommerce_checkout_company_field', 'hidden');
        $company_behavior = get_option('woo_better_calc_company_field_behavior', 'dynamic');

        // Mapeamento biunívoco entre a option do WooCommerce e o comportamento do plugin.
        // Valores desconhecidos/vazios não sobrescrevem a escolha do lojista.
        switch ($company_company_field) {
            case 'hidden':
                // REASON: "Dinâmico" e "Desabilitado" usam `hidden` no nativo, então o
                // sync reverso NÃO pode converter `hidden` em `dynamic` quando a escolha
                // atual é "Desabilitado" — senão salvar em "Desabilitado" (que grava
                // `hidden`) reativaria o modo dinâmico na mesma requisição.
                if ('disabled' !== $company_behavior) {
                    update_option('woo_better_calc_company_field_behavior', 'dynamic');
                }
                break;
            case 'optional':
                update_option('woo_better_calc_company_field_behavior', 'optional');
                break;
            case 'required':
                update_option('woo_better_calc_company_field_behavior', 'required');
                break;
        }
    }

    /**
     * Garante a sincronização da visibilidade do telefone nativo com o woo-better.
     *
     * Executa no init — em TODA requisição (público E admin, inclusive REST/cron de
     * atualização). Roda o `sync_phone_field()` a cada requisição para REAFIRMAR o
     * estado: enquanto o recurso está ativo, o nativo fica desabilitado; ao desabilitar,
     * volta ao original. É idempotente (no-op quando já correto), então reafirmar toda
     * hora é barato e cobre resets externos da option — garantindo que um visitante
     * que só abre o checkout (sem nunca passar pelo admin) sempre veja o estado certo.
     */
    public function ensure_phone_field_option() {
        // Migração: remove flag obsoleta de versões anteriores da feature.
        // Agora a evidência de ocultação pelo plugin é a própria opção
        // woo_better_calc_phone_field_previous.
        if (get_option('woo_better_calc_phone_field_managed') !== false) {
            delete_option('woo_better_calc_phone_field_managed');
        }

        // Reafirma o estado a cada requisição (idempotente). Cobre: ativação/atualização
        // do plugin, mudança de configuração e resets externos da option nativa.
        $this->sync_phone_field();

        // Marca a versão sincronizada (informativo/migração).
        if (get_option('woo_better_calc_phone_field_synced_version', '') !== $this->version) {
            update_option('woo_better_calc_phone_field_synced_version', $this->version);
        }
    }

    /**
     * Verifica se a opção "Telefone (Contato) Obrigatório" está ativa.
     *
     * @return bool
     */
    private function is_phone_required() {
        return get_option('woo_better_calc_contact_required', 'no') === 'yes';
    }

    /**
     * Verifica se o "Destaque do Campo Telefone" está ativo E se aplica.
     *
     * O destaque só faz sentido quando o woo-better GERENCIA o telefone (cria o
     * próprio campo) — ou seja, em qualquer modo exceto "Desabilitar". No modo
     * "Desabilitar" não há campo próprio do plugin, então o destaque é IGNORADO
     * (senão o plugin mexeria no campo nativo — reposicionando/ocultando — mesmo
     * com o recurso desligado).
     *
     * @return bool
     */
    private function is_phone_highlight() {
        return $this->phone_mode_hides_native_option()
            && get_option('woo_better_calc_contact_field_position', 'no') === 'yes';
    }

    /**
     * Indica se a máscara/DDI do telefone está ativa E faz sentido no modo atual.
     *
     * A opção "Aplicar Máscara + Captura de DDI" é dependente do "Comportamento do
     * Campo de Telefone" (o admin a desabilita no modo "Desabilitar"). Como o valor
     * gravado não é resetado ao desabilitar, o backend precisa ignorá-la nesse modo —
     * senão o plugin continuaria formatando/exigindo o telefone nativo (checkout
     * clássico, edit-address e normalização/format do pedido).
     *
     * @return bool
     */
    private function is_phone_mask_active() {
        return $this->phone_mode_hides_native_option()
            && get_option('woo_better_calc_apply_phone_mask', get_option('woo_better_calc_contact_required', 'no')) === 'yes';
    }

    /**
     * Indica se o telefone usa a MÁSCARA BRASILEIRA sem a lib/DDI.
     *
     * É o cenário da opção "Telefone com Máscara e DDI" DESLIGADA com o plugin
     * ainda GERENCIANDO o telefone (qualquer modo exceto os dois "Desabilitar"): o
     * front formata apenas o padrão brasileiro (fixo/celular, com autodetecção) e
     * NÃO há seletor de país — o DDI é sempre o do Brasil (+55).
     *
     * Como o número é sempre nacional, o backend continua concatenando o `+55` e
     * normalizando o telefone do pedido em E.164 (`normalize_order_phone`).
     *
     * @return bool
     */
    private function is_phone_brazil_mask_active()
    {
        return $this->phone_mode_hides_native_option() && ! $this->is_phone_mask_active();
    }

    /**
     * Placeholder dos campos de telefone/celular.
     *
     * Na máscara BR (sem lib/DDI) o texto descreve o que o cliente DIGITA, não o que
     * o campo exibe: o `+55` é concatenado no backend (`normalize_order_phone`) e o
     * cliente nunca digita o DDI — por isso ele fica FORA do placeholder. O texto
     * segue o "Comportamento do Campo de Telefone" (mesma fonte da label, ver
     * `get_phone_field_label()`), que é a única peça que o cliente NÃO descobre
     * sozinho: sem o DDD a máscara formata um número de 9 dígitos e o checkout
     * reprova com a mensagem genérica.
     *
     * @param string|null $fallback Texto já traduzido a usar quando a máscara BR NÃO
     *                              está ativa (null = padrão `(00) 00000-0000`).
     * @param string      $kind     'phone' (telefone, aceita fixo/celular conforme o
     *                              modo) ou 'cellphone' (campo "Celular").
     * @return string
     */
    private function phone_field_placeholder($fallback = null, $kind = 'phone')
    {
        if ($this->is_phone_brazil_mask_active()) {
            return $this->brazil_phone_field_placeholder($kind);
        }

        if (null !== $fallback) {
            return $fallback;
        }

        return __('(00) 00000-0000', 'woo-better-shipping-calculator-for-brazil');
    }

    /**
     * Placeholder da máscara BR (sem lib/DDI) conforme o campo e o modo.
     *
     * - "Somente Fixo"        → `(00) 0000-0000` (o modo só aceita fixo).
     * - "Celular e Fixo"      → `(DDD) número`: aceita as DUAS máscaras (autodetecção
     *                           pelo tamanho), então nenhum formato fixo é verdadeiro.
     * - "Somente Celular" e o campo "Celular" → `(00) 00000-0000`.
     *
     * @param string $kind 'phone' | 'cellphone'
     * @return string
     */
    private function brazil_phone_field_placeholder($kind = 'phone')
    {
        $mode = $this->get_phone_mode();

        if ('cellphone' === $kind || 'cellphone_only' === $mode) {
            $placeholder = __('(00) 00000-0000', 'woo-better-shipping-calculator-for-brazil');
        } elseif ('landline_only' === $mode) {
            $placeholder = __('(00) 0000-0000', 'woo-better-shipping-calculator-for-brazil');
        } else {
            /* translators: placeholder do telefone que aceita fixo e celular; "DDD" é o código de área brasileiro. */
            $placeholder = __('(DDD) número', 'woo-better-shipping-calculator-for-brazil');
        }

        /**
         * Filtra o placeholder do telefone na máscara BR (sem lib/DDI).
         *
         * @param string $placeholder Texto já traduzido.
         * @param string $kind        'phone' | 'cellphone'.
         * @param string $mode        Comportamento do Campo de Telefone.
         */
        return apply_filters('wc_better_shipping_calculator_phone_placeholder', $placeholder, $kind, $mode);
    }

    /**
     * Indica se o valor do CELULAR (meta `_*_cellphone`) deve receber o DDI (E.164).
     *
     * Só quando o celular É o campo PRINCIPAL ("Somente Celular") ou é o ESPELHO
     * OCULTO do telefone (shim) — que herda o DDI do bloco principal. O "Campo de
     * Celular" VISÍVEL (separado, `enable_cellphone_field`) é um campo SIMPLES, sem
     * máscara/DDI: o valor fica só com os dígitos, sem o `+55`.
     *
     * @return bool
     */
    private function cellphone_meta_uses_ddi() {
        return 'cellphone_only' === $this->get_phone_mode() || $this->phone_mode_adds_cellphone_shim();
    }

    /**
     * Verifica se a opção "Celular Obrigatório" está ativa.
     *
     * @return bool
     */
    private function is_cellphone_required() {
        return get_option('woo_better_calc_cellphone_required', 'no') === 'yes';
    }

    /**
     * Verifica se a opção "Campo de Celular" (habilitar o campo separado) está ativa.
     *
     * @return bool
     */
    private function is_cellphone_field_enabled() {
        return get_option('woo_better_calc_enable_cellphone_field', 'no') === 'yes';
    }

    /**
     * Retorna a label do campo de telefone conforme o "Comportamento do Campo de Telefone".
     *
     * Usada no telefone nativo (locale → checkout em blocos e clássico) e no campo de
     * destaque, mantendo o nome consistente entre os checkouts.
     *
     * @return string
     */
    public function get_phone_field_label() {
        switch ($this->get_phone_mode()) {
            case 'landline_only':
                return __('Telefone', 'woo-better-shipping-calculator-for-brazil');
            case 'cellphone_only':
                return __('Celular', 'woo-better-shipping-calculator-for-brazil');
            default:
                // "Celular e Fixo": o campo principal aceita os dois tipos.
                return __('Celular/Telefone', 'woo-better-shipping-calculator-for-brazil');
        }
    }

    /**
     * Retorna o modo de campos de telefone configurado.
     *
     * Valores possíveis:
     * - 'disabled'            → nenhum campo de telefone.
     * - 'phone_and_cellphone' → telefone nativo (fixo) + campo "Celular" (padrão).
     * - 'cellphone_only'      → só um campo "Celular" (nativo oculto no clássico).
     * - 'landline_only'       → só o telefone nativo (fixo).
     *
     * @return string
     */
    public function get_phone_mode() {
        $mode    = get_option('woo_better_calc_phone_mode', 'phone_and_cellphone');
        $allowed = array('disabled', 'disabled_native', 'phone_and_cellphone', 'cellphone_only', 'landline_only');

        return in_array($mode, $allowed, true) ? $mode : 'phone_and_cellphone';
    }

    /**
     * Indica se o modo escolhido DESABILITA o telefone de verdade no checkout.
     *
     * Existem DOIS "desabilitar" distintos:
     *
     * - `disabled_native` — "Desabilitar o campo de telefone": o plugin DESABILITA
     *   o telefone NATIVO do WooCommerce (`woocommerce_checkout_phone_field = hidden`)
     *   e não gera campo próprio. É esta opção que realmente remove o telefone da
     *   tela (clássico E blocos).
     * - `disabled` — "Deixar a configuração nativa do WooCommerce": o plugin NÃO
     *   gerencia o telefone; o que o lojista configurou no WooCommerce (toggle do
     *   editor de blocos / Personalizar) é o que vale. Nenhum campo é gerado.
     *
     * @return bool
     */
    private function phone_mode_disables_native() {
        return 'disabled_native' === $this->get_phone_mode();
    }

    /**
     * Indica se o modo NÃO gerencia o telefone (nem campo próprio, nem celular).
     *
     * @return bool
     */
    private function phone_mode_is_unmanaged() {
        return in_array($this->get_phone_mode(), array('disabled', 'disabled_native'), true);
    }

    /**
     * Indica se o modo atual oculta o telefone nativo no ÂMBITO DA OPÇÃO nativa
     * (woocommerce_checkout_phone_field = hidden), afetando clássico E blocos.
     *
     * Só os modos GERENCIADOS (tudo exceto "Desabilitar") ocultam o nativo — o
     * plugin assume o telefone com o campo próprio. No modo "Desabilitar" NÃO
     * mexemos: o sync restaura o estado original guardado em
     * woo_better_calc_phone_field_previous.
     *
     * @return bool
     */
    private function phone_mode_hides_native_option() {
        return ! $this->phone_mode_is_unmanaged();
    }

    /**
     * Indica se o modo atual SUBSTITUI o campo nativo de telefone pelo campo de
     * celular do plugin (o nativo é removido e o telefone do pedido fica VAZIO).
     *
     * Só o modo "Somente Celular" faz isso (o celular é o campo principal).
     * Nos demais — inclusive "Desabilitar" com o "Campo de Celular" ligado — o
     * telefone nativo é MANTIDO e o celular é um campo SEPARADO (aditivo).
     *
     * @return bool
     */
    private function phone_mode_hides_native_field() {
        return 'cellphone_only' === $this->get_phone_mode();
    }

    /**
     * Indica se o modo/opções atuais devem adicionar o campo "Celular" (billing + shipping).
     *
     * No modo "Somente Celular" o campo é o principal (sempre existe). Nos demais
     * modos depende da opção "Campo de Celular" (enable_cellphone_field).
     *
     * @return bool
     */
    private function phone_mode_adds_cellphone_field() {
        // Nos modos "deixar o nativo" e "desabilitar o telefone" o plugin não gera
        // campo de celular nenhum — nem visível, nem oculto. Sem este curto-circuito
        // uma option residual `enable_cellphone_field = yes` (de uma configuração
        // anterior) continuava criando o "Celular" mesmo com o telefone desabilitado.
        if ( $this->phone_mode_is_unmanaged() ) {
            return false;
        }

        if ( 'cellphone_only' === $this->get_phone_mode() ) {
            return true;
        }

        return $this->is_cellphone_field_enabled();
    }

    /**
     * Indica se o campo `*_cellphone` ESCONDIDO (shim) está habilitado pela opção
     * "Celular Oculto" (woo_better_calc_enable_cellphone_shim). Default DESLIGADO —
     * só gera o `billing_cellphone`/`shipping_cellphone` oculto se o lojista ligar.
     *
     * @return bool
     */
    private function is_cellphone_shim_enabled() {
        return get_option('woo_better_calc_enable_cellphone_shim', 'no') === 'yes';
    }

    /**
     * Indica se o modo/opções atuais devem adicionar o campo `*_cellphone` ESCONDIDO
     * (shim) para compatibilidade com plugins que esperam `billing_cellphone`
     * (PagBank, NFe, Asaas...).
     *
     * Só no modo "Celular e Fixo", quando o "Campo de Celular" está DESLIGADO (não há
     * campo visível próprio) E o lojista habilitou "Celular Oculto"
     * (`woo_better_calc_enable_cellphone_shim`). Desabilitado (padrão), NENHUM campo
     * `*_cellphone` é gerado — evita conflito com outros plugins.
     *
     * @return bool
     */
    private function phone_mode_adds_cellphone_shim() {
        return 'phone_and_cellphone' === $this->get_phone_mode()
            && ! $this->is_cellphone_field_enabled()
            && $this->is_cellphone_shim_enabled();
    }

    /**
     * Indica se o modo atual GERA a meta de celular (`*_cellphone`) no pedido.
     *
     * Diferente de `phone_mode_adds_cellphone_field()` (campo VISÍVEL no checkout),
     * aqui é qualquer modo em que o plugin grava `_billing_cellphone`/
     * `_shipping_cellphone` — seja pelo campo VISÍVEL ("Somente Celular" ou "Campo
     * de Celular" ligado) seja pelo SHIM ESCONDIDO ("Celular e Fixo" com o "Campo de
     * Celular" desligado, espelho do telefone p/ PagBank/Asaas/NFe).
     *
     * Usado nos campos EDITÁVEIS do ADMIN do pedido, para exibir o "Celular" em
     * COBRANÇA **e** EM ENTREGA sempre que houver uma meta para ver/editar. Sem isso,
     * o plugin "Brazilian Market on WooCommerce" injeta um "Celular" só na cobrança
     * (o builder de entrega dele não inclui o campo), deixando cobrança e entrega
     * inconsistentes.
     *
     * @return bool
     */
    private function phone_mode_stores_cellphone() {
        return $this->phone_mode_adds_cellphone_field() || $this->phone_mode_adds_cellphone_shim();
    }

    /**
     * Sincroniza a VISIBILIDADE do campo de telefone nativo com o woo-better.
     *
     * O nativo é a MESMA opção (woocommerce_checkout_phone_field) usada pelo toggle
     * "Telefone" do editor de checkout em blocos. Enquanto o woo-better gerencia o
     * telefone (qualquer modo exceto "Desabilitar"), o nativo fica DESABILITADO
     * (hidden): o plugin assume o telefone com o campo próprio (o "Destaque do Campo
     * Telefone" só REPOSICIONA esse campo, não decide a visibilidade do nativo).
     *
     * Ao DESABILITAR o recurso, o nativo volta ao estado ORIGINAL guardado em
     * woo_better_calc_phone_field_previous. Se o lojista ocultou o nativo por conta
     * própria e o plugin nunca o ocultou, não mexemos.
     */
    public function sync_phone_field() {
        // Evita reentrância: update_option() do nativo re-dispara os hooks.
        if (self::$phone_field_syncing) {
            return;
        }
        self::$phone_field_syncing = true;

        try {
            $native_phone = get_option('woocommerce_checkout_phone_field', 'optional');
            $previous = get_option('woo_better_calc_phone_field_previous', false);
            $owns_hidden = ($previous !== false);

            // O woo-better oculta o nativo quando ELE injeta o campo próprio do
            // telefone (modos gerenciados) OU quando o modo escolhido é "Desabilitar
            // o campo de telefone" (disabled_native), que existe justamente para
            // desligar o nativo. No modo "Deixar a configuração nativa do WooCommerce"
            // (disabled) o sync não mexe: vale o que o lojista configurou no WC.
            $should_hide = $this->phone_mode_hides_native_option() || $this->phone_mode_disables_native();

            if ($should_hide) {
                if ($native_phone !== 'hidden') {
                    // Guarda o estado visível ATUAL como "original" só na PRIMEIRA
                    // vez (evita um re-assert posterior sobrescrever o original).
                    if (false === $previous) {
                        update_option('woo_better_calc_phone_field_previous', $native_phone);
                    }
                    update_option('woocommerce_checkout_phone_field', 'hidden');
                }
            } elseif ($owns_hidden) {
                // Recurso desabilitado: restaura o estado ORIGINAL do nativo (o valor
                // guardado), sem recomputar de outras opções — o woo-better NÃO dita
                // a visibilidade/obrigatoriedade do nativo quando está desligado.
                if ($previous !== $native_phone) {
                    update_option('woocommerce_checkout_phone_field', $previous);
                }
                delete_option('woo_better_calc_phone_field_previous');
            }
            // Se o nativo foi ocultado pelo PRÓPRIO lojista (não temos o valor
            // guardado), não mexemos — nem para mostrar nem para ocultar.
        } finally {
            self::$phone_field_syncing = false;
        }
    }

    /**
     * Mantém o campo de telefone NATIVO desabilitado (hidden) enquanto o woo-better
     * gerencia o telefone.
     *
     * O toggle "Telefone" do editor do checkout em blocos escreve a option
     * `woocommerce_checkout_phone_field`. Como o woo-better é a ÚNICA fonte de
     * verdade do telefone (campo próprio), reaplicamos o `hidden` sempre que essa
     * option muda para um valor visível — assim o nativo nunca fica ativo/obrigatório
     * e não conflita com o campo próprio.
     *
     * NÃO sincroniza a opção "Telefone (Contato) Obrigatório"
     * (`woo_better_calc_contact_required`): ela é EXCLUSIVA do plugin e desacoplada
     * do nativo. Quando o recurso está desabilitado, não mexemos no nativo (ele volta
     * ao estado original via `sync_phone_field`).
     *
     * Assinatura do hook dinâmico update_option_{$option}: ($old_value, $value, $option).
     *
     * @param mixed  $old_value Valor anterior.
     * @param mixed  $new_value Valor novo.
     * @param string $option    Nome da opção.
     * @return void
     */
    public function enforce_native_phone_hidden($old_value = null, $new_value = null, $option = '')
    {
        if (self::$phone_field_syncing) {
            return;
        }

        // Recurso desabilitado → não mexe no nativo (é restaurado ao original).
        // Exceção: "Desabilitar o campo de telefone" (disabled_native) também dita o
        // `hidden` — senão o toggle do editor de blocos reativaria o telefone.
        if (! $this->phone_mode_hides_native_option() && ! $this->phone_mode_disables_native()) {
            return;
        }

        if ('hidden' === $new_value) {
            return;
        }

        self::$phone_field_syncing = true;
        try {
            update_option('woocommerce_checkout_phone_field', 'hidden');
        } finally {
            self::$phone_field_syncing = false;
        }
    }

    // Função específica para WooCommerce Block Checkout
    public function process_checkout_data_blocks($order, $request)
    {
        if (!$order) {
            return;
        }

        // Validação de CNPJ (cálculo + Receita) para o checkout em blocos.
        // Lança RouteException para impedir a finalização quando inválido.
        $this->validate_cnpj_blocks($order, $request);

        // Processa números de endereço primeiro
        $this->process_address_numbers_from_request($order, $request);
        
        // Processa dados de tipo de pessoa
        $this->process_person_type_from_request($order, $request);
        
        // Processa dados de bairro
        $this->process_neighborhood_from_request($order, $request);
        
        // Processa dados de data de nascimento
        $this->process_birthdate_from_request($order, $request);
        
        // Processa dados de gênero
        $this->process_gender_from_request($order, $request);
        
        // Processa dados de Inscrição Estadual (IE)
        $this->process_ie_from_request($order, $request);
        
        // Processa dados de Inscrição Municipal (IM)
        $this->process_im_from_request($order, $request);

        // Processa dados de RG (vinculado ao CPF)
        $this->process_rg_from_request($order, $request);
        
        // Processa dados de telefone formatado
        $this->process_phone_formatter_from_request($order, $request);

        // Modo "Somente Celular": mapeia o campo "Celular" (additional checkout field
        // do bloco) para billing_phone/_billing_cellphone e shipping.
        $this->process_cellphone_from_request($order, $request);
        
        // Processa dados de "usar mesmo endereço para faturamento"
        $this->process_shipping_as_billing_from_request($order, $request);
        
        $billing_country_code = '';
        $shipping_country_code = '';
        
        // Detecta se está usando o mesmo endereço para cobrança nos blocks
        $use_same_address = $this->detect_same_address_usage_from_request($order, $request);
        
        // Captura dos dados do request do Block Checkout
        $extensions = $request->get_param('extensions') ?? [];
        
        // Verifica o namespace dos códigos de país
        if (isset($extensions['woo_better_phone_country'])) {
            $phone_data = $extensions['woo_better_phone_country'];
            
            if (isset($phone_data['billing_phone_country_code'])) {
                $billing_country_code = sanitize_text_field( (string) $phone_data['billing_phone_country_code'] );
            }
            
            if (isset($phone_data['shipping_phone_country_code'])) {
                $shipping_country_code = sanitize_text_field( (string) $phone_data['shipping_phone_country_code'] );
            }
        }
        
        // Fallback para $_POST se não encontrar nos extensions
        if (empty($billing_country_code) && isset($_POST['billing_phone_country_code'])) {
            $billing_country_code = sanitize_text_field(wp_unslash($_POST['billing_phone_country_code']));
        }
        
        if (empty($shipping_country_code) && isset($_POST['shipping_phone_country_code'])) {
            $shipping_country_code = sanitize_text_field(wp_unslash($_POST['shipping_phone_country_code']));
        }
        
        // Lógica aprimorada considerando o checkbox de mesmo endereço
        if ($use_same_address) {
            // Se usar mesmo endereço, prioriza o código de entrega (shipping)
            if (!empty($shipping_country_code)) {
                $billing_country_code = $shipping_country_code;
            } elseif (!empty($billing_country_code)) {
                $shipping_country_code = $billing_country_code;
            }
        } else {
            // Lógica original quando não usa mesmo endereço
            if (!empty($billing_country_code) && empty($shipping_country_code)) {
                $shipping_country_code = $billing_country_code;
            } elseif (!empty($shipping_country_code) && empty($billing_country_code)) {
                $billing_country_code = $shipping_country_code;
            }
        }

        // Normaliza os telefones do pedido para o formato limpo (+DDInúmero,
        // sem caracteres especiais), concatenando o DDI ao número.
        $this->normalize_order_phone($order, 'billing', $billing_country_code);
        $this->normalize_order_phone($order, 'shipping', $shipping_country_code);

        // Máscara BR (sem DDI): o país do telefone é sempre o Brasil — registra o
        // `+55` no pedido para a exibição (recibo/admin) continuar montando o E.164.
        if ($this->is_phone_brazil_mask_active()) {
            $billing_country_code  = $billing_country_code ? $billing_country_code : '+55';
            $shipping_country_code = $shipping_country_code ? $shipping_country_code : '+55';
        }

        // Reafirma o telefone do PERFIL do usuário com o valor normalizado do pedido
        // (o WC core, no Store API, salva o customer a partir do campo nativo cru).
        $this->sync_customer_phone_from_order($order);
        
        // Salvar código do país do telefone de faturação
        if (!empty($billing_country_code)) {
            $order->update_meta_data('_billing_phone_country_code', $billing_country_code);
        }
        
        // Salvar código do país do telefone de entrega
        if (!empty($shipping_country_code)) {
            $order->update_meta_data('_shipping_phone_country_code', $shipping_country_code);
        }

        $order->save();
    }

    /**
     * Processa os números dos endereços no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_address_numbers_from_data($order, $data)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');

        if ($number_field === 'yes') {
            $shipping_number = '';
            $billing_number = '';

            // Captura dos dados do checkout tradicional (via $data, já filtrado por woocommerce_checkout_posted_data)
            $billing_number = isset($data['billing_number']) ? sanitize_text_field(wp_unslash($data['billing_number'])) : '';
            $shipping_number = isset($data['shipping_number']) ? sanitize_text_field(wp_unslash($data['shipping_number'])) : '';

            // Detecta se está usando o mesmo endereço
            $use_same_address = $this->detect_same_address_usage($order, $data);
            
            // Lógica de sincronização considerando o checkbox de mesmo endereço
            if ($use_same_address) {
                // Se usar mesmo endereço, prioriza o número de cobrança (billing)
                if (!empty($billing_number)) {
                    $shipping_number = $billing_number;
                } elseif (!empty($shipping_number)) {
                    $billing_number = $shipping_number;
                }
            } else {
                // Lógica original quando não usa mesmo endereço
                if (empty($shipping_number) && !empty($billing_number)) {
                    $shipping_number = $billing_number;
                }

                if (empty($billing_number) && !empty($shipping_number)) {
                    $billing_number = $shipping_number;
                }
            }
            
            // Salva os números como meta dados separados (sem concatenar no endereço)
            if (!empty($billing_number)) {
                $order->update_meta_data('_billing_number', $billing_number);
                WC()->session->set('billing_number', $billing_number);
                if (is_user_logged_in()) {
                    update_user_meta( get_current_user_id(), 'billing_number', $billing_number );
                }
            }
            
            if (!empty($shipping_number)) {
                $order->update_meta_data('_shipping_number', $shipping_number);
                WC()->session->set('shipping_number', $shipping_number);
                if (is_user_logged_in()) {
                    update_user_meta( get_current_user_id(), 'shipping_number', $shipping_number );
                }
            }
        }
    }

    /**
     * Processa os números dos endereços no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_address_numbers_from_request($order, $request)
    {
        $number_field = get_option('woo_better_calc_number_required', 'no');

        if ($number_field === 'yes') {
            $shipping_number = '';
            $billing_number = '';

            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];

            // Verifica o namespace dos números de endereço
            if (isset($extensions['woo_better_number_validation'])) {
                $number_data = $extensions['woo_better_number_validation'];
                
                if (isset($number_data['billing_number'])) {
                    $billing_number = sanitize_text_field($number_data['billing_number']);
                }
                
                if (isset($number_data['shipping_number'])) {
                    $shipping_number = sanitize_text_field($number_data['shipping_number']);
                }
            }

            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_number) && isset($_POST['billing_number'])) {
                $billing_number = sanitize_text_field(wp_unslash($_POST['billing_number']));
            }

            if (empty($shipping_number) && isset($_POST['shipping_number'])) {
                $shipping_number = sanitize_text_field(wp_unslash($_POST['shipping_number']));
            }

            if (empty($shipping_number) && !empty($billing_number)) {
                $shipping_number = $billing_number;
            }

            if (empty($billing_number) && !empty($shipping_number)) {
                $billing_number = $shipping_number;
            }
            
            // Salva os números como meta dados separados (sem concatenar no endereço)
            if (!empty($billing_number)) {
                $order->update_meta_data('_billing_number', $billing_number);
                WC()->session->set('billing_number', $billing_number);
                if (is_user_logged_in()) {
                    update_user_meta( get_current_user_id(), 'billing_number', $billing_number );
                }
            }
            
            if (!empty($shipping_number)) {
                $order->update_meta_data('_shipping_number', $shipping_number);
                WC()->session->set('shipping_number', $shipping_number);
                if (is_user_logged_in()) {
                    update_user_meta( get_current_user_id(), 'shipping_number', $shipping_number );
                }
            }
        }
    }

    /**
     * Processa os dados de tipo de pessoa no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_person_type_from_data($order, $data)
    {
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($person_type !== 'none') {
            // Captura dos dados do checkout tradicional (via $data, já filtrado por woocommerce_checkout_posted_data)
            $billing_persontype = isset($data['billing_persontype']) ? sanitize_text_field(wp_unslash($data['billing_persontype'])) : '';
            $billing_cpf = isset($data['billing_cpf']) ? sanitize_text_field(wp_unslash($data['billing_cpf'])) : '';
            $billing_cnpj = isset($data['billing_cnpj']) ? sanitize_text_field(wp_unslash($data['billing_cnpj'])) : '';
            $billing_company = isset($data['billing_company']) ? sanitize_text_field(wp_unslash($data['billing_company'])) : '';
            
            // Captura do campo unificado
            $billing_document = isset($data['billing_document']) ? sanitize_text_field(wp_unslash($data['billing_document'])) : '';
            
            // Se há documento unificado mas não há dados específicos, processar
            if (!empty($billing_document) && empty($billing_cpf) && empty($billing_cnpj)) {
                $clean_value = preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_document));
                
                if (strlen($clean_value) === 11) {
                    // É CPF
                    $billing_cpf = $billing_document;
                    $billing_persontype = '1'; // Usar valor numérico
                } elseif (strlen($clean_value) === 14) {
                    // É CNPJ
                    $billing_cnpj = $billing_document;
                    $billing_persontype = '2'; // Usar valor numérico
                }
            }

            // Salva os tipos de pessoa
            if (!empty($billing_persontype)) {
                // Se vier como string antiga, converte para número
                if ($billing_persontype === 'physical') {
                    $persontype_number = 1;
                } elseif ($billing_persontype === 'legal') {
                    $persontype_number = 2;
                } else {
                    // Já é numérico, usa diretamente
                    $persontype_number = (int) $billing_persontype;
                }
                $order->update_meta_data('_billing_persontype', $persontype_number);
            }

            // Salva os documentos aplicando formatação conforme configuração
            if (!empty($billing_cpf)) {
                $formatted_cpf = $this->cpf_number_format($billing_cpf);
                $order->update_meta_data('_billing_cpf', $formatted_cpf);
            }
            if (!empty($billing_cnpj)) {
                $formatted_cnpj = $this->cnpj_number_format($billing_cnpj);
                $order->update_meta_data('_billing_cnpj', $formatted_cnpj);
            }

            // Salva a empresa apenas para CNPJ, limpa para CPF
            if (($billing_persontype === 'legal' || $billing_persontype === '2' || $billing_persontype === 2) && !empty($billing_company)) {
                $order->set_billing_company($billing_company);
                $order->set_shipping_company('');

                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), 'billing_company', $billing_company);
                    update_user_meta(get_current_user_id(), 'shipping_company', '');
                }
            } elseif ($billing_persontype === 'physical' || $billing_persontype === '1' || $billing_persontype === 1) {
                // Para CPF, assegura que campos de empresa ficam vazios
                $order->set_billing_company('');
                $order->set_shipping_company('');
                
                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), 'billing_company', '');
                    update_user_meta(get_current_user_id(), 'shipping_company', '');
                }

                // REASON: limpa também a sessão, senão o valor antigo de empresa
                // "ressuscita" ao voltar ao checkout (o preenchimento lê user_meta
                // e, quando vazio, cai no fallback da sessão).
                if (function_exists('WC') && WC()->session) {
                    WC()->session->set('billing_company', '');
                    WC()->session->set('shipping_company', '');
                }
                if (function_exists('WC') && WC()->customer) {
                    WC()->customer->set_billing_company('');
                    WC()->customer->set_shipping_company('');
                }
            }
        }
    }

    /**
     * Processa os dados de tipo de pessoa no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_person_type_from_request($order, $request)
    {
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($person_type !== 'none') {
            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];

            $billing_persontype = '';
            $billing_cpf = '';
            $billing_cnpj = '';
            $billing_company = '';

            // Verifica o namespace dos dados de pessoa
            if (isset($extensions['woo_better_person_type'])) {
                $person_data = $extensions['woo_better_person_type'];
                
                if (isset($person_data['billing_persontype'])) {
                    $billing_persontype = sanitize_text_field($person_data['billing_persontype']);
                }
                if (isset($person_data['billing_cpf'])) {
                    $billing_cpf = sanitize_text_field($person_data['billing_cpf']);
                }
                if (isset($person_data['billing_cnpj'])) {
                    $billing_cnpj = sanitize_text_field($person_data['billing_cnpj']);
                }
                if (isset($person_data['billing_company'])) {
                    $billing_company = sanitize_text_field($person_data['billing_company']);
                }
            }

            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_persontype) && isset($_POST['billing_persontype'])) {
                $billing_persontype = sanitize_text_field(wp_unslash($_POST['billing_persontype']));
            }
            if (empty($billing_cpf) && isset($_POST['billing_cpf'])) {
                $billing_cpf = sanitize_text_field(wp_unslash($_POST['billing_cpf']));
            }
            if (empty($billing_cnpj) && isset($_POST['billing_cnpj'])) {
                $billing_cnpj = sanitize_text_field(wp_unslash($_POST['billing_cnpj']));
            }
            if (empty($billing_company) && isset($_POST['billing_company'])) {
                $billing_company = sanitize_text_field(wp_unslash($_POST['billing_company']));
            }
            
            // Captura do campo unificado para shortcode se os específicos estão vazios
            $billing_document = '';
            if (isset($_POST['billing_document'])) {
                $billing_document = sanitize_text_field(wp_unslash($_POST['billing_document']));
            }
            
            // Se há documento unificado mas não há dados específicos, processar
            if (!empty($billing_document) && empty($billing_cpf) && empty($billing_cnpj)) {
                $clean_value = preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_document));
                
                if (strlen($clean_value) === 11) {
                    // É CPF
                    $billing_cpf = $billing_document;
                    $billing_persontype = '1'; // Usar valor numérico
                } elseif (strlen($clean_value) === 14) {
                    // É CNPJ
                    $billing_cnpj = $billing_document;
                    $billing_persontype = '2'; // Usar valor numérico
                }
            }

            // Salva os tipos de pessoa
            if (!empty($billing_persontype)) {
                // Se vier como string antiga, converte para número
                if ($billing_persontype === 'physical') {
                    $persontype_number = 1;
                } elseif ($billing_persontype === 'legal') {
                    $persontype_number = 2;
                } else {
                    // Já é numérico, usa diretamente
                    $persontype_number = (int) $billing_persontype;
                }
                $order->update_meta_data('_billing_persontype', $persontype_number);
            }

            // Salva os documentos aplicando formatação conforme configuração
            if (!empty($billing_cpf)) {
                $formatted_cpf = $this->cpf_number_format($billing_cpf);
                $order->update_meta_data('_billing_cpf', $formatted_cpf);
            }
            if (!empty($billing_cnpj)) {
                $formatted_cnpj = $this->cnpj_number_format($billing_cnpj);
                $order->update_meta_data('_billing_cnpj', $formatted_cnpj);
            }

            // Salva a empresa apenas para CNPJ, limpa para CPF
            if (($billing_persontype === 'legal' || $billing_persontype === '2' || $billing_persontype === 2) && !empty($billing_company)) {
                $order->set_billing_company($billing_company);
                $order->set_shipping_company(''); // Garantir que shipping company fique vazio

                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), 'billing_company', $billing_company);
                    update_user_meta(get_current_user_id(), 'shipping_company', '');
                }
            } elseif ($billing_persontype === 'physical' || $billing_persontype === '1' || $billing_persontype === 1) {
                // Para CPF, assegura que campos de empresa ficam vazios
                $order->set_billing_company('');
                $order->set_shipping_company('');
                
                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), 'billing_company', '');
                    update_user_meta(get_current_user_id(), 'shipping_company', '');
                }

                // REASON: limpa também a sessão, senão o valor antigo de empresa
                // "ressuscita" ao voltar ao checkout (o preenchimento lê user_meta
                // e, quando vazio, cai no fallback da sessão).
                if (function_exists('WC') && WC()->session) {
                    WC()->session->set('billing_company', '');
                    WC()->session->set('shipping_company', '');
                }
                if (function_exists('WC') && WC()->customer) {
                    WC()->customer->set_billing_company('');
                    WC()->customer->set_shipping_company('');
                }
            }
        }
    }

    /**
     * Detecta se o checkbox "usar mesmo endereço para cobrança" está marcado
     *
     * @param WC_Order $order
     * @param array $data
     * @return bool
     */
    private function detect_same_address_usage($order, $data)
    {
        // "Forçar entrega para o endereço de cobrança" → existe um só endereço
        // (billing), então é o mesmo endereço por definição.
        if ('billing_only' === get_option('woocommerce_ship_to_destination', 'shipping')) {
            return true;
        }

        // PRIORIDADE: Verifica primeiro o campo ship_to_different_address do checkout
        if (isset($data['ship_to_different_address'])) {
            // false = usar mesmo endereço, true = endereços diferentes
            return $data['ship_to_different_address'] === false || $data['ship_to_different_address'] === 'false';
        }

        return false;
        

    }
    
    /**
     * Detecta se o checkbox "usar mesmo endereço" está marcado no WooCommerce Blocks
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return bool
     */
    private function detect_same_address_usage_from_request($order, $request)
    {
        // Tenta detectar via request params primeiro
        $use_shipping_as_billing = $request->get_param('use_shipping_as_billing');
        if ($use_shipping_as_billing === true || $use_shipping_as_billing === 'true') {
            return true;
        }
        
        // Fallback: verifica endereços idênticos
        return $this->detect_same_address_usage($order, []);
    }

    public function init_woocommerce()
    {
        if ( function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
            // Registra campos para números de endereço
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_number_validation',
                'schema_callback' => function() {
                    return [
                        'shipping_number' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'billing_number' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'shipping_number'  => '', 
                        'billing_number' => '', 
                    ];
                },
            ]);
            
            // Registra campos para códigos de país do telefone
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_phone_country',
                'schema_callback' => function() {
                    return [
                        'billing_phone_country_code' => [
                            'type'     => 'string',
                            'readonly' => false,
                        ],
                        'shipping_phone_country_code' => [
                            'type'     => 'string',
                            'readonly' => false,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_phone_country_code'  => '', 
                        'shipping_phone_country_code' => '', 
                    ];
                },
            ]);
            
            // Registra campos para tipos de pessoa e documentos
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_person_type',
                'schema_callback' => function() {
                    return [
                        'billing_persontype' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'billing_cpf' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'billing_cnpj' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'billing_company' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_persontype'  => '', 
                        'billing_cpf' => '',
                        'billing_cnpj' => '',
                        'billing_company' => '',
                    ];
                },
            ]);
            
            // Registra campos para bairro
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_neighborhood',
                'schema_callback' => function() {
                    return [
                        'billing_neighborhood' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'shipping_neighborhood' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_neighborhood'  => '', 
                        'shipping_neighborhood' => '', 
                    ];
                },
            ]);

            // Registra os campos de telefone/celular (injetados via JS no bloco).
            // São DUAS namespaces, uma por TIPO de campo, e CADA UMA declara apenas
            // as SUAS chaves. Isso é essencial: o `setExtensionData` do checkout faz
            // MERGE por namespace, então um `data_callback`/schema com as 4 chaves
            // (compartilhado) faria o `woo_better_cellphone` vazar para dentro de
            // `woo_better_phone` (e vice-versa), quebrando a validação do Store API.
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => self::PHONE_EXTENSION_NAMESPACE,
                'schema_callback' => function() {
                    return [
                        'billing_phone'  => [ 'type' => 'string', 'readonly' => true ],
                        'shipping_phone' => [ 'type' => 'string', 'readonly' => true ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_phone'  => '',
                        'shipping_phone' => '',
                    ];
                },
            ] );

            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => self::CELLPHONE_EXTENSION_NAMESPACE,
                'schema_callback' => function() {
                    return [
                        'billing_cellphone'  => [ 'type' => 'string', 'readonly' => true ],
                        'shipping_cellphone' => [ 'type' => 'string', 'readonly' => true ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_cellphone'  => '',
                        'shipping_cellphone' => '',
                    ];
                },
            ] );
            
            // Registra campos para data de nascimento
            if (get_option('woo_better_calc_enable_birthdate_field', 'no') === 'yes') {
                woocommerce_store_api_register_endpoint_data( [
                    'endpoint'        => 'checkout',
                    'namespace'       => 'woo_better_birthdate',
                    'schema_callback' => function() {
                        return [
                            'billing_birthdate' => [
                                'type'     => 'string',
                                'readonly' => true,
                            ],
                        ];
                    },
                    'data_callback' => function() {
                        return [
                            'billing_birthdate'  => '', 
                        ];
                    },
                ]);
            }

            // Registra campos para gênero
            if (get_option('woo_better_calc_enable_gender_field', 'no') === 'yes') {
                woocommerce_store_api_register_endpoint_data( [
                    'endpoint'        => 'checkout',
                    'namespace'       => 'woo_better_gender',
                    'schema_callback' => function() {
                        return [
                            'billing_gender' => [
                                'type'     => 'string',
                                'readonly' => true,
                            ],
                        ];
                    },
                    'data_callback' => function() {
                        return [
                            'billing_gender'  => '', 
                        ];
                    },
                ]);
            }

            // Registra campos para Inscrição Estadual (IE)
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_ie_field',
                'schema_callback' => function() {
                    return [
                        'billing_ie' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_ie'  => '',
                    ];
                },
            ]);

            // Registra campos para Inscrição Municipal (IM)
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_im_field',
                'schema_callback' => function() {
                    return [
                        'billing_im' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_im'  => '',
                    ];
                },
            ]);

            // Registra campos para RG (documento de pessoa física, vinculado ao CPF)
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_rg_field',
                'schema_callback' => function() {
                    return [
                        'billing_rg' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_rg'  => '',
                    ];
                },
            ]);

            // Registra campos para telefone formatado
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_phone_formatter',
                'schema_callback' => function() {
                    return [
                        'billing_phone_formatted' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'shipping_phone_formatted' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                        'custom_phone_formatted' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ]
                    ];
                },
                'data_callback' => function() {
                    return [
                        'billing_phone_formatted'  => '', 
                        'shipping_phone_formatted' => '', 
                        'custom_phone_formatted'   => '',
                    ];
                },
            ]);

            // Registra campos para detectar checkbox "usar mesmo endereço para cobrança"
            woocommerce_store_api_register_endpoint_data( [
                'endpoint'        => 'checkout',
                'namespace'       => 'woo_better_shipping_as_billing',
                'schema_callback' => function() {
                    return [
                        'use_shipping_as_billing' => [
                            'type'     => 'string',
                            'readonly' => true,
                        ],
                    ];
                },
                'data_callback' => function() {
                    return [
                        'use_shipping_as_billing'  => '', 
                    ];
                },
            ]);
        }

        if ( function_exists( 'woocommerce_store_api_register_update_callback' ) ) {
            // Callback para números de endereço
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_number_validation',
                'callback'  => [ $this, 'handle_number_update' ],
            ]);
            
            // Callback para códigos de país do telefone
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_phone_country',
                'callback'  => [ $this, 'handle_phone_country_update' ],
            ]);
            
            // Callback para tipos de pessoa e documentos
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_person_type',
                'callback'  => [ $this, 'handle_person_type_update' ],
            ]);
            
            // Callback para campos de bairro
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_neighborhood',
                'callback'  => [ $this, 'handle_neighborhood_update' ],
            ]);

            // Callback para o "Telefone" (campos injetados via JS no bloco)
            woocommerce_store_api_register_update_callback([
                'namespace' => self::PHONE_EXTENSION_NAMESPACE,
                'callback'  => [ $this, 'handle_phone_update' ],
            ]);

            // Callback para o "Celular" (campos injetados via JS no bloco)
            woocommerce_store_api_register_update_callback([
                'namespace' => self::CELLPHONE_EXTENSION_NAMESPACE,
                'callback'  => [ $this, 'handle_cellphone_update' ],
            ]);
            
            // Callback para data de nascimento
            if (get_option('woo_better_calc_enable_birthdate_field', 'no') === 'yes') {
                woocommerce_store_api_register_update_callback([
                    'namespace' => 'woo_better_birthdate',
                    'callback'  => [ $this, 'handle_birthdate_update' ],
                ]);
            }
            
            // Callback para gênero
            if (get_option('woo_better_calc_enable_gender_field', 'no') === 'yes') {
                woocommerce_store_api_register_update_callback([
                    'namespace' => 'woo_better_gender',
                    'callback'  => [ $this, 'handle_gender_update' ],
                ]);
            }

            // Callback para Inscrição Estadual (IE)
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_ie_field',
                'callback'  => [ $this, 'handle_ie_update' ],
            ]);

            // Callback para Inscrição Municipal (IM)
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_im_field',
                'callback'  => [ $this, 'handle_im_update' ],
            ]);

            // Callback para RG (campo injetado via JS no bloco)
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_rg_field',
                'callback'  => [ $this, 'handle_rg_update' ],
            ]);

            // Callback para telefone formatado
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_phone_formatter',
                'callback'  => [ $this, 'handle_phone_formatter_update' ],
            ]);
            
            // Callback para checkbox "usar mesmo endereço para cobrança"
            woocommerce_store_api_register_update_callback([
                'namespace' => 'woo_better_shipping_as_billing',
                'callback'  => [ $this, 'handle_shipping_as_billing_update' ],
            ]);
        }
    }

    public function handle_number_update($data)
    {
        if (! function_exists('WC') ||! WC()->session ) {
            return;
        }

        // Guarda o número de faturação na sessão
        if ( isset( $data['billing_number'] ) ) {
            $billing_number = sanitize_text_field( $data['billing_number'] );
            WC()->session->set( 'billing_number', $billing_number );
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_number', $billing_number);
            }
        }

        // Guarda o número de envio na sessão
        if ( isset( $data['shipping_number'] ) ) {
            $shipping_number = sanitize_text_field( $data['shipping_number'] );
            WC()->session->set( 'shipping_number', $shipping_number );
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'shipping_number', $shipping_number);
            }
        }
    }

    public function handle_phone_country_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        // Guarda o código do país de faturação na sessão
        if ( isset( $data['billing_phone_country_code'] ) ) {
            $country_code = sanitize_text_field( (string) $data['billing_phone_country_code'] );
            WC()->session->set( 'billing_phone_country_code', $country_code );
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_phone_country_code', $country_code);
            }
        }

        // Guarda o código do país de envio na sessão
        if ( isset( $data['shipping_phone_country_code'] ) ) {
            $country_code = sanitize_text_field( (string) $data['shipping_phone_country_code'] );
            WC()->session->set( 'shipping_phone_country_code', $country_code );
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'shipping_phone_country_code', $country_code);
            }
        }
    }

    public function handle_person_type_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        // Guarda os dados de tipo de pessoa na sessão
        if ( isset( $data['billing_persontype'] ) ) {
            $person_type = sanitize_text_field( (string) $data['billing_persontype'] );
            WC()->session->set( 'billing_persontype', $person_type );
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_persontype', $person_type);
            }
        }

        // Guarda os documentos na sessão
        if ( isset( $data['billing_cpf'] ) ) {
            $cpf = sanitize_text_field( (string) $data['billing_cpf'] );
            WC()->session->set( 'billing_cpf', $cpf );
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_cpf', $cpf);
            }
        }

        if ( isset( $data['billing_cnpj'] ) ) {
            $cnpj = sanitize_text_field( (string) $data['billing_cnpj'] );
            WC()->session->set( 'billing_cnpj', $cnpj );
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_cnpj', $cnpj);
            }
        }

        // Guarda a empresa na sessão
        if ( isset( $data['billing_company'] ) ) {
            $company = sanitize_text_field( (string) $data['billing_company'] );
            WC()->session->set( 'billing_company', $company );

            // Seta a empresa no customer do WooCommerce
            if (WC()->customer) {
                WC()->customer->set_billing_company($company);
                WC()->customer->save();
            }
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_company', $company);
            }
        }

        // Construir e salvar o documento unificado baseado no billing_persontype
        $billing_document = '';
        $person_type = WC()->session->get('billing_persontype', '');
        $cpf = WC()->session->get('billing_cpf', '');
        $cnpj = WC()->session->get('billing_cnpj', '');
        
        if ($person_type === '1' && !empty($cpf)) {
            // Pessoa física - usar CPF
            $billing_document = $cpf;
        } elseif ($person_type === '2' && !empty($cnpj)) {
            // Pessoa jurídica - usar CNPJ
            $billing_document = $cnpj;
        } elseif (empty($person_type)) {
            // Fallback quando não há tipo definido - usar qualquer documento disponível
            if (!empty($cpf)) {
                $billing_document = $cpf;
            } elseif (!empty($cnpj)) {
                $billing_document = $cnpj;
            }
        }
        
        if (!empty($billing_document)) {
            WC()->session->set('billing_document', $billing_document);
            
            // Sincroniza com user_meta se usuário estiver logado
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_document', $billing_document);
            }
        }
    }

    public function handle_neighborhood_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        $billing_neighborhood = '';
        $shipping_neighborhood = '';

        // Captura os dados de bairro
        if ( isset( $data['billing_neighborhood'] ) ) {
            $billing_neighborhood = sanitize_text_field( (string) $data['billing_neighborhood'] );
        }

        if ( isset( $data['shipping_neighborhood'] ) ) {
            $shipping_neighborhood = sanitize_text_field( (string) $data['shipping_neighborhood'] );
        }

        // Detecta se está usando o mesmo endereço para cobrança
        $use_same_address = false;
        if (WC()->customer) {
            // Verifica se os endereços de entrega e cobrança são iguais
            $billing_address = WC()->customer->get_billing_address_1();
            $shipping_address = WC()->customer->get_shipping_address_1();
            $billing_city = WC()->customer->get_billing_city();
            $shipping_city = WC()->customer->get_shipping_city();
            $billing_postcode = WC()->customer->get_billing_postcode();
            $shipping_postcode = WC()->customer->get_shipping_postcode();
            
            if (!empty($billing_address) && !empty($shipping_address) && 
                $billing_address === $shipping_address && 
                $billing_city === $shipping_city && 
                $billing_postcode === $shipping_postcode) {
                $use_same_address = true;
            }
        }
        
        // Lógica de sincronização considerando o checkbox de mesmo endereço
        if ($use_same_address) {
            // Se usar mesmo endereço, prioriza o bairro de entrega (shipping)
            if (!empty($shipping_neighborhood)) {
                $billing_neighborhood = $shipping_neighborhood;
            } elseif (!empty($billing_neighborhood)) {
                $shipping_neighborhood = $billing_neighborhood;
            }
        } else {
            // Lógica original quando não usa mesmo endereço
            if (!empty($billing_neighborhood) && empty($shipping_neighborhood)) {
                $shipping_neighborhood = $billing_neighborhood;
            } elseif (!empty($shipping_neighborhood) && empty($billing_neighborhood)) {
                $billing_neighborhood = $shipping_neighborhood;
            }
        }

        // Guarda os dados de bairro na sessão e no perfil do usuário
        if (!empty($billing_neighborhood)) {
            WC()->session->set( 'billing_neighborhood', $billing_neighborhood );
            if (is_user_logged_in()) {
                update_user_meta( get_current_user_id(), 'billing_neighborhood', $billing_neighborhood );
            }
        }

        if (!empty($shipping_neighborhood)) {
            WC()->session->set( 'shipping_neighborhood', $shipping_neighborhood );
            if (is_user_logged_in()) {
                update_user_meta( get_current_user_id(), 'shipping_neighborhood', $shipping_neighborhood );
            }
        }
    }

    public function handle_birthdate_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        $billing_birthdate = '';

        // Captura os dados de data de nascimento
        if ( isset( $data['billing_birthdate'] ) ) {
            $billing_birthdate = sanitize_text_field( (string) $data['billing_birthdate'] );
        }

        // Normaliza para Y-m-d antes de armazenar na sessão e user_meta
        $billing_birthdate = $this->normalize_birthdate_value($billing_birthdate);

        // Guarda os dados de data de nascimento na sessão e no perfil do usuário
        // CORREÇÃO: Sempre salva quando habilitado para sobrescrever valores antigos
        WC()->session->set( 'billing_birthdate', $billing_birthdate );
        if (is_user_logged_in()) {
            update_user_meta( get_current_user_id(), 'billing_birthdate', $billing_birthdate );
        }
    }

    public function handle_gender_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        $billing_gender = '';

        // Captura os dados de gênero
        if ( isset( $data['billing_gender'] ) ) {
            $billing_gender = sanitize_text_field( (string) $data['billing_gender'] );
        }

        // Guarda os dados de gênero na sessão e no perfil do usuário
        // CORREÇÃO: Sempre salva quando habilitado para sobrescrever valores antigos "Masculino"
        WC()->session->set( 'billing_gender', $billing_gender );
        if (is_user_logged_in()) {
            update_user_meta( get_current_user_id(), 'billing_gender', $billing_gender );
        }
    }

    public function handle_ie_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        if ( isset( $data['billing_ie'] ) ) {
            $billing_ie = strtoupper(sanitize_text_field( (string) $data['billing_ie'] ));
            WC()->session->set( 'billing_ie', $billing_ie );

            if (is_user_logged_in()) {
                update_user_meta( get_current_user_id(), 'billing_ie', $billing_ie );
            }
        }
    }

    public function handle_im_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        if ( isset( $data['billing_im'] ) ) {
            $billing_im = strtoupper(sanitize_text_field( (string) $data['billing_im'] ));
            WC()->session->set( 'billing_im', $billing_im );

            if (is_user_logged_in()) {
                update_user_meta( get_current_user_id(), 'billing_im', $billing_im );
            }
        }
    }

    /**
     * Guarda o RG digitado no checkout em blocos (sessão + perfil).
     *
     * Espelha `handle_im_update`: o JS do bloco envia o valor via
     * `extensionCartUpdate` a cada digitação (debounce).
     *
     * @param array $data Dados do namespace `woo_better_rg_field`.
     * @return void
     */
    public function handle_rg_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        if ( isset( $data['billing_rg'] ) ) {
            $billing_rg = $this->sanitize_rg_value( $data['billing_rg'] );
            WC()->session->set( 'billing_rg', $billing_rg );

            if (is_user_logged_in()) {
                update_user_meta( get_current_user_id(), 'billing_rg', $billing_rg );
            }
        }
    }

    public function handle_phone_formatter_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        // Captura os dados de telefone formatado
        $billing_phone_formatted = '';
        $shipping_phone_formatted = '';
        $custom_phone_formatted = '';

        if ( isset( $data['billing_phone_formatted'] ) ) {
            $billing_phone_formatted = sanitize_text_field( (string) $data['billing_phone_formatted'] );
        }

        if ( isset( $data['shipping_phone_formatted'] ) ) {
            $shipping_phone_formatted = sanitize_text_field( (string) $data['shipping_phone_formatted'] );
        }

        if ( isset( $data['custom_phone_formatted'] ) ) {
            $custom_phone_formatted = sanitize_text_field( (string) $data['custom_phone_formatted'] );
        }

        // Guarda os dados de telefone formatado na sessão para manter durante o checkout
        WC()->session->set( 'billing_phone', $billing_phone_formatted );
        WC()->session->set( 'billing_phone_formatted', $billing_phone_formatted );
        if (is_user_logged_in()) {
            update_user_meta( get_current_user_id(), 'billing_phone', $billing_phone_formatted );
            update_user_meta( get_current_user_id(), 'billing_phone_formatted', $billing_phone_formatted );
        }

        WC()->session->set( 'shipping_phone', $shipping_phone_formatted );
        WC()->session->set( 'shipping_phone_formatted', $shipping_phone_formatted );
        if (is_user_logged_in()) {
            update_user_meta( get_current_user_id(), 'shipping_phone', $shipping_phone_formatted );
            update_user_meta( get_current_user_id(), 'shipping_phone_formatted', $shipping_phone_formatted );
        }

        WC()->session->set( 'custom_phone', $custom_phone_formatted );
        WC()->session->set( 'custom_phone_formatted', $custom_phone_formatted );
        if (is_user_logged_in()) {
            update_user_meta( get_current_user_id(), 'custom_phone', $custom_phone_formatted );
            update_user_meta( get_current_user_id(), 'custom_phone_formatted', $custom_phone_formatted );
        }

        // Sincroniza o objeto do cliente WooCommerce.
        //
        // O checkout clássico/shortcode renderiza #billing_phone / #shipping_phone
        // a partir de WC()->customer (get_billing_phone / get_shipping_phone), e NÃO
        // das chaves de sessão acima. Sem sincronizar aqui, o valor exibido no
        // clássico fica desatualizado (sem o "+DDI" ou com dígito faltando), pois a
        // lib não consegue formatar um número inválido.
        if ( function_exists('WC') && WC()->customer ) {
            $phone_highlight = $this->is_phone_highlight() ? 'yes' : 'no';

            $customer_billing  = $billing_phone_formatted;
            $customer_shipping = $shipping_phone_formatted;

            // Modo destaque: o campo único vale para billing e shipping.
            if ( $phone_highlight === 'yes' && ! empty( $custom_phone_formatted ) ) {
                $customer_billing  = $custom_phone_formatted;
                $customer_shipping = $custom_phone_formatted;
            }

            WC()->customer->set_billing_phone( $customer_billing );
            WC()->customer->set_shipping_phone( $customer_shipping );
            WC()->customer->save();
        }
    }

    public function handle_shipping_as_billing_update( $data ) {
        if (! function_exists('WC') || ! WC()->session ) {
            return;
        }

        // Captura o estado do checkbox "usar mesmo endereço para cobrança"
        if ( isset( $data['use_shipping_as_billing'] ) ) {
            $use_shipping_as_billing = sanitize_text_field(wp_unslash($data['use_shipping_as_billing']));
            
            // Converte string para boolean para uso interno
            $is_using_same_address = ($use_shipping_as_billing === 'true');
            
            // Salva na sessão para uso durante o checkout
            WC()->session->set( 'use_shipping_as_billing', $use_shipping_as_billing );
        }
    }

    public function lkn_checkout_fields_locale_priority( $locale ) {
        $email_highlight    = get_option( 'woo_better_calc_email_field_position_shortcode', 'no' );
        $phone_highlight    = $this->is_phone_highlight() ? 'yes' : 'no';
        $person_type        = get_option( 'woo_better_calc_person_type_select', 'none' );

        // Nenhuma das opções ativa, sem alterações
        if ( $email_highlight !== 'yes' && $phone_highlight !== 'yes' && $person_type === 'none' ) {
            return $locale;
        }

        $country_codes = include plugin_dir_path( __FILE__ ) . 'country-codes.php';
        foreach ( $country_codes as $country_code ) {
            // email → priority 1
            if ( $email_highlight === 'yes' ) {
                if ( ! isset( $locale[ $country_code ]['email'] ) ) {
                    $locale[ $country_code ]['email'] = [];
                }
                $locale[ $country_code ]['email']['priority'] = 1;
            }

            // phone → priority 2
            if ( $phone_highlight === 'yes' ) {
                if ( ! isset( $locale[ $country_code ]['phone'] ) ) {
                    $locale[ $country_code ]['phone'] = [];
                }
                $locale[ $country_code ]['phone']['priority'] = 2;
            }

            // country → priority 3 quando person_type estiver ativo
            if ( $person_type !== 'none' ) {
                if ( ! isset( $locale[ $country_code ]['country'] ) ) {
                    $locale[ $country_code ]['country'] = [];
                }
                $locale[ $country_code ]['country']['priority'] = 3;
            }
        }

        return $locale;
    }

    public function wc_better_calc_phone_number($locale)
    {
        // No modo "Desabilitar" o woo-better NÃO gerencia o telefone: não mexemos no
        // campo nativo (nem label, nem visibilidade/obrigatoriedade). Deixamos o
        // WooCommerce (e outros plugins, ex.: Brazilian) no controle — assim o
        // telefone nativo volta ao comportamento original.
        if ('disabled' === $this->get_phone_mode()) {
            return $locale;
        }

        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        $phone_highlight = $this->is_phone_highlight() ? 'yes' : 'no';

        // REASON: Ocultar o campo nativo de telefone no locale só faz sentido no
        // checkout em blocos (Gutenberg). No clássico/shortcode o reposicionamento
        // é feito via wc_better_calc_checkout_fields usando priority, e aplicar
        // hidden=true no locale também no clássico faz o campo sumir a partir do
        // WooCommerce 10.8.1+.
        $is_blocks_checkout = false;
        if ( function_exists( 'has_block' ) ) {
            global $post;
            if ( isset( $post ) && is_a( $post, 'WP_Post' ) ) {
                $is_blocks_checkout = has_block( 'woocommerce/checkout', $post );
            }
        }

        // REASON: A visibilidade REAL do campo nativo é a fonte de verdade — este
        // plugin a mantém sincronizada com o "Destaque do Campo Telefone"
        // (woocommerce_checkout_phone_field = hidden). Não dá para decidir a
        // obrigatoriedade só por $is_blocks_checkout: em requisições REST
        // (validação do Store API) não existe $post e has_block() retorna false,
        // fazendo o plugin marcar 'phone' como obrigatório mesmo com o nativo
        // oculto. Como o WooCommerce remove 'phone' de get_default_address_fields()
        // quando ele está oculto, o locale 'default' NÃO contém 'phone' com
        // 'label'; a entrada então criada pelo plugin ficava sem 'label' e o
        // OrderController (Store API) emitia "Undefined array key label" (linha
        // 501) + erro espúrio "<vazio> is required" que bloqueava o pedido.
        $native_phone_hidden = get_option('woocommerce_checkout_phone_field', 'optional') === 'hidden';
        // No modo "Somente Celular" o checkout em blocos exibe o campo "Celular"
        // (additional checkout field) e oculta o telefone nativo do WooCommerce.
        $cellphone_only_blocks = ('cellphone_only' === $this->get_phone_mode()) && $is_blocks_checkout;
        $hides_native_phone  = ($phone_highlight === 'yes' && $is_blocks_checkout) || $native_phone_hidden || $cellphone_only_blocks;

        // REASON: O locale 'phone' serve dois consumidores com necessidades
        // opostas. No checkout em blocos / Store API (REST) o nativo oculto perde
        // o 'label' (o WooCommerce o remove de get_default_address_fields()), então
        // exigir 'phone' gera "Undefined array key label" no OrderController
        // (linha 501). Já no clássico/shortcode o address-i18n.js aplica o
        // 'required' do locale ao campo VISÍVEL no cliente, DEPOIS do render do
        // servidor: se o locale disser required=false o campo vira "(opcional)" na
        // tela, mesmo com wc_better_calc_checkout_fields marcando-o obrigatório.
        // Por isso só zeramos 'required' quando o campo é tratado fora do locale
        // (blocos/REST). O filtro permite simular o contexto do Store API em testes.
        $phone_handled_outside_locale = $is_blocks_checkout || (bool) apply_filters(
            'wc_better_calc_is_store_api_request',
            defined( 'REST_REQUEST' ) && REST_REQUEST
        );

        // Carrega a lista de códigos de países
        $country_codes = include plugin_dir_path(__FILE__) . 'country-codes.php';

        // Aplica as configurações para todos os países da lista
        foreach ($country_codes as $country_code) {
            // Garante que a chave 'phone' exista no array do país para evitar warnings do PHP
            if (!isset($locale[$country_code]['phone'])) {
                $locale[$country_code]['phone'] = [];
            }

            if ($hides_native_phone && $phone_handled_outside_locale) {
                // Campo nativo oculto E tratado fora do locale (blocos/Store API):
                // nunca exigir no locale. Evita requerimento sem 'label' no
                // OrderController. A obrigatoriedade é cobrada pelo campo próprio
                // (destaque) e/ou pelo JS.
                $locale[$country_code]['phone']['required'] = false;

                // Marca hidden no locale apenas no checkout em blocos.
                if ($is_blocks_checkout) {
                    $locale[$country_code]['phone']['hidden'] = true;
                }
            } elseif ($phone_required === 'yes') {
                // Sem destaque OU checkout clássico/shortcode: o campo visível é
                // obrigatório conforme a opção de contato. O address-i18n.js usa
                // este 'required' para manter o campo obrigatório na tela.
                $locale[$country_code]['phone']['required'] = true;
            }

            // Label do telefone nativo conforme o "Comportamento do Campo de Telefone".
            // Vale para o checkout em blocos (countryData → defaultFields) e para o
            // clássico (address-i18n.js aplica o label do locale ao trocar de país).
            $locale[$country_code]['phone']['label'] = $this->get_phone_field_label();
        }

        return $locale;
    }


    public function wc_better_calc_checkout_fields($fields)
    {
        
        $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
        $fill_checkout_address = get_option('woo_better_calc_enable_auto_address_fill', 'no');
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        $email_highlight_shortcode = get_option('woo_better_calc_email_field_position_shortcode', 'no');
        $phone_highlight = $this->is_phone_highlight() ? 'yes' : 'no';
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        // Forçar limpeza do cache se necessário  
        if (false === $person_type || empty($person_type)) {
            wp_cache_delete('woo_better_calc_person_type_select', 'options');
            $person_type = get_option('woo_better_calc_person_type_select', 'none');
        }

        if($email_highlight_shortcode === 'yes') {
            if (isset($fields['billing']['billing_email'])) {
                $fields['billing']['billing_email']['priority'] = 1;
            }
            if (isset($fields['shipping']['shipping_email'])) {
                $fields['shipping']['shipping_email']['priority'] = 1;
            }
        }

        if ($phone_highlight === 'yes') {
            if (isset($fields['billing']['billing_phone'])) {
                $fields['billing']['billing_phone']['priority'] = 2;
            }
            if (isset($fields['shipping']['shipping_phone'])) {
                $fields['shipping']['shipping_phone']['priority'] = 2;
            }
        } 

        // Campos de pessoa física e jurídica - PRIMEIRO para evitar conflitos
        if ($person_type !== 'none') {
            // Dar prioridade máxima ao campo de país quando person_type está habilitado
            if (isset($fields['billing']['billing_country'])) {
                $fields['billing']['billing_country']['priority'] = 3;
            }
            if (isset($fields['shipping']['shipping_country'])) {
                $fields['shipping']['shipping_country']['priority'] = 3;
            }
            
            // Campo unificado CPF/CNPJ (billing)
            $label_text = __('CPF/CNPJ', 'woo-better-shipping-calculator-for-brazil');
            $placeholder_text = __('Digite seu CPF ou CNPJ', 'woo-better-shipping-calculator-for-brazil');
            
            if ($person_type === 'physical') {
                $label_text = __('CPF', 'woo-better-shipping-calculator-for-brazil');
                $placeholder_text = __('000.000.000-00', 'woo-better-shipping-calculator-for-brazil');
            } elseif ($person_type === 'legal') {
                $label_text = __('CNPJ', 'woo-better-shipping-calculator-for-brazil');
                $placeholder_text = __('00.000.000/0000-00', 'woo-better-shipping-calculator-for-brazil');
            }
            
            $fields['billing']['billing_document'] = array(
                'label'       => $label_text,
                'placeholder' => $placeholder_text,
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 27,
                'type'        => 'text',
                'autocomplete' => 'off',
                'custom_attributes' => array(
                    'data-person-type' => $person_type
                )
            );

            // Campos hidden para compatibilidade com o backend
            $fields['billing']['billing_persontype'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 28
            );

            $fields['billing']['billing_cpf'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 29
            );

            $fields['billing']['billing_cnpj'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 30
            );

            // Campo de empresa para pessoa jurídica
            if ($person_type !== 'none') {
                // Obter configuração do comportamento do campo empresa
                $company_field_behavior = get_option('woo_better_calc_company_field_behavior', 'dynamic');
                
                // Só criar/modificar o campo company se for dinâmico
                if ($company_field_behavior === 'dynamic') {
                    // Verificar se o campo company nativo já existe
                    if (isset($fields['billing']['billing_company'])) {
                        // Se existir, tornar obrigatório e customizar
                        $fields['billing']['billing_company']['required'] = true;
                        $fields['billing']['billing_company']['label'] = __('Nome da Empresa', 'woo-better-shipping-calculator-for-brazil');
                        $fields['billing']['billing_company']['placeholder'] = __('Digite o nome da empresa', 'woo-better-shipping-calculator-for-brazil');

                        // Preserva as classes existentes (ex.: 'person-type-field', que
                        // outros consumidores podem usar) e apenas garante o
                        // 'form-row-wide' — sem remover nenhuma classe.
                        $company_classes = isset($fields['billing']['billing_company']['class'])
                            ? (array) $fields['billing']['billing_company']['class']
                            : array();
                        if (!in_array('form-row-wide', $company_classes, true)) {
                            $company_classes[] = 'form-row-wide';
                        }
                        $fields['billing']['billing_company']['class'] = array_values($company_classes);
                    } else {
                        // Se não existir, criar o campo
                        $fields['billing']['billing_company'] = array(
                            'label'       => __('Nome da Empresa', 'woo-better-shipping-calculator-for-brazil'),
                            'placeholder' => __('Digite o nome da empresa', 'woo-better-shipping-calculator-for-brazil'),
                            'required'    => true,
                            'class'       => array('form-row-wide'),
                            'priority'    => 31,
                            'type'        => 'text'
                        );
                    }
                    
                    // Remover ou limpar o campo shipping_company para evitar duplicação (só se for dinâmico)
                    if (isset($fields['shipping']['shipping_company'])) {
                        unset($fields['shipping']['shipping_company']);
                    }
                } else if ('disabled' === $company_field_behavior) {
                    // REASON: modo "Desabilitado" — o woo-better NÃO gera o campo Empresa
                    // (a option nativa fica em `hidden`, então o WooCommerce também não o
                    // cria). Se outro plugin o reintroduzir (ex.: Brazilian Market), ele
                    // fica sempre OPCIONAL: obrigatório num campo que a loja desligou é o
                    // que trava o checkout com "Empresa é um campo obrigatório".
                    if (isset($fields['billing']['billing_company'])) {
                        $fields['billing']['billing_company']['required'] = false;
                    }
                    if (isset($fields['shipping']['shipping_company'])) {
                        $fields['shipping']['shipping_company']['required'] = false;
                    }
                } else if (isset($fields['billing']['billing_company'])) {
                    // REASON: nos modos Opcional/Obrigatório o required do campo Empresa
                    // deve seguir a escolha do lojista no woo-better — e não a option
                    // nativa (woocommerce_checkout_company_field) nem o plugin "Brazilian
                    // Market on WooCommerce", que não raro deixam o campo como
                    // obrigatório. Sem isso, o campo aparecia como requerido mesmo com a
                    // configuração em "Opcional". Como este filtro roda por último
                    // (prioridade 999), nossa decisão prevalece.
                    $fields['billing']['billing_company']['required'] = ('required' === $company_field_behavior);
                }

                // REASON: o plugin "Brazilian Market on WooCommerce" redefine a
                // prioridade do campo Empresa no filtro woocommerce_billing_fields
                // (billing_company = 25), colocando-o ACIMA do campo unificado de
                // CPF/CNPJ (billing_document = 27) no checkout clássico/shortcode.
                // Como este filtro (woocommerce_checkout_fields, prioridade 999) roda
                // DEPOIS do Brazilian, reafirmamos aqui a posição do campo Empresa
                // logo abaixo do CPF/CNPJ em TODOS os modos — não só no "Dinâmico" —
                // para dar prioridade à configuração do woo-better.
                if (isset($fields['billing']['billing_company'])) {
                    $fields['billing']['billing_company']['priority'] = 31;
                }
            }
        }

        // Campo de Inscrição Estadual (IE) - somente para Pessoa Jurídica
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $fields['billing']['billing_ie'] = array(
                'label'       => __('Inscrição Estadual (IE)', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite a IE ou marque Isento', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide', 'woo-better-ie-field'),
                'priority'    => 32,
                'type'        => 'text',
                'autocomplete' => 'off',
                'custom_attributes' => array(
                    'maxlength' => '14',
                    'data-ie-field' => '1'
                )
            );
        }

        // Campo de Inscrição Municipal (IM) - somente para Pessoa Jurídica.
        // Espelha o IE (mesmo gate/obrigatoriedade). O limite de 15 caracteres
        // segue o schema da NF-e (dest/IM: TString, maxLength 15).
        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
        if ($im_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $fields['billing']['billing_im'] = array(
                'label'       => __('Inscrição Municipal (IM)', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite a Inscrição Municipal (IM)', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide', 'woo-better-im-field'),
                'priority'    => 33,
                'type'        => 'text',
                'autocomplete' => 'off',
                'custom_attributes' => array(
                    'maxlength' => '15',
                    'data-im-field' => '1'
                )
            );
        }

        // Campo de RG - somente para Pessoa Física e VINCULADO ao CPF: o JS
        // só exibe o campo quando o documento informado é um CPF completo
        // (11 dígitos). A prioridade é CALCULADA para cair logo abaixo do
        // CPF/CNPJ (27), sem empatar com campo visível — um valor fixo em 34
        // empatava com o CEP e jogava o RG para depois do checkbox do CEP.
        if ($this->rg_field_enabled()) {
            $fields['billing']['billing_rg'] = array(
                'label'       => __('RG', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite o RG', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => $this->rg_field_required(),
                'class'       => array('form-row-wide', 'woo-better-rg-field'),
                'priority'    => $this->rg_field_priority($fields['billing']),
                'type'        => 'text',
                'autocomplete' => 'off',
                'custom_attributes' => array(
                    'maxlength' => '20',
                    'data-rg-field' => '1'
                )
            );
        }

        // Campos de bairro
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        if ($neighborhood_enabled === 'yes') {
            $fields['billing']['billing_neighborhood'] = array(
                'label'       => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite o nome do bairro', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 69,
                'type'        => 'text'
            );
            
            $fields['shipping']['shipping_neighborhood'] = array(
                'label'       => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite o nome do bairro', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 69,
                'type'        => 'text'
            );
        }

        // Re-adiciona o campo de telefone no checkout clássico/shortcode para que
        // o telefone continue disponível (a máscara é aplicada pelo script legado).
        // Só quando o plugin GERENCIA o telefone (qualquer modo exceto "Desabilitar");
        // no modo "Desabilitar" o campo nativo fica intacto (não adicionamos DDI nem
        // relabel/required do plugin).
        if ($this->phone_mode_hides_native_option()) {
            if (!isset($fields['billing']['billing_phone'])) {
                $fields['billing']['billing_phone_country'] = array(
                    'type'        => 'hidden',
                    'class'       => array('woo-better-hidden-field'),
                    'default'     => '+55',
                    'required'    => false,
                );
                $fields['billing']['billing_phone'] = array(
                    'type'        => 'tel',
                    'label'       => $this->get_phone_field_label(),
                    'placeholder' => $this->phone_field_placeholder(__('Digite o telefone', 'woo-better-shipping-calculator-for-brazil')),
                    'required'    => ($phone_required === 'yes'),
                    'class'       => array('form-row-wide'),
                    'priority'    => 92,
                );
            } else {
                $fields['billing']['billing_phone_country'] = array(
                    'type'        => 'hidden',
                    'class'       => array('woo-better-hidden-field'),
                    'default'     => '+55',
                    'required'    => false,
                );
                if ($this->is_phone_brazil_mask_active()) {
                    $fields['billing']['billing_phone']['placeholder'] = $this->phone_field_placeholder();
                }
            }

            if (!isset($fields['shipping']['shipping_phone'])) {
                $fields['shipping']['shipping_phone_country'] = array(
                    'type'        => 'hidden',
                    'class'       => array('woo-better-hidden-field'),
                    'default'     => '+55',
                    'required'    => false,
                );
                $fields['shipping']['shipping_phone'] = array(
                    'type'        => 'tel',
                    'label'       => $this->get_phone_field_label(),
                    'placeholder' => $this->phone_field_placeholder(__('Digite o telefone', 'woo-better-shipping-calculator-for-brazil')),
                    'required'    => ($phone_required === 'yes'),
                    'class'       => array('form-row-wide'),
                    'priority'    => 92,
                );
            } else {
                $fields['shipping']['shipping_phone_country'] = array(
                    'type'        => 'hidden',
                    'class'       => array('woo-better-hidden-field'),
                    'default'     => '+55',
                    'required'    => false,
                );
                if ($this->is_phone_brazil_mask_active()) {
                    $fields['shipping']['shipping_phone']['placeholder'] = $this->phone_field_placeholder();
                }
            }


            if (isset($fields['billing']['billing_phone'])) {
                $fields['billing']['billing_phone']['label'] = $this->get_phone_field_label();
                $fields['billing']['billing_phone']['required'] = ($phone_required === 'yes');
            }
            if (isset($fields['shipping']['shipping_phone'])) {
                $fields['shipping']['shipping_phone']['label'] = $this->get_phone_field_label();
                $fields['shipping']['shipping_phone']['required'] = ($phone_required === 'yes');
            }
        }

        // Modos de telefone (select "Comportamento do Campo de Telefone").
        // O nativo só é REMOVIDO quando o plugin fornece um substituto (o campo de
        // celular): "Somente Celular" ou "Desabilitar" + "Campo de Celular" ligado.
        // Nos demais (inclui "Desabilitar" SEM o campo de celular) o nativo é mantido.
        if ($this->phone_mode_hides_native_field() && $this->phone_mode_adds_cellphone_field()) {
            // Remove apenas o input visível do telefone. No modo "Somente Celular"
            // mantemos o hidden `*_phone_country` (DDI): o campo "Celular" assume o
            // papel de telefone e usa esse hidden para capturar o código do país.
            unset(
                $fields['billing']['billing_phone'],
                $fields['shipping']['shipping_phone']
            );
        }
        if ('disabled' === $this->get_phone_mode()) {
            // Modo "Desabilitar": remove o hidden de DDI do próprio plugin.
            unset(
                $fields['billing']['billing_phone_country'],
                $fields['shipping']['shipping_phone_country']
            );
        }

        // O campo "Celular" SECUNDÁRIO (modo "Celular e Fixo" com o "Campo de
        // Celular" ligado) fica no FIM do formulário de endereço, e não colado ao
        // telefone. Só há reposicionamento quando existem os DOIS campos: no modo
        // "Somente Celular" o telefone é removido e o celular assume a posição do
        // telefone (não entra aqui).
        foreach (array('billing', 'shipping') as $fieldset) {
            $phone_key = $fieldset . '_phone';
            $cell_key  = $fieldset . '_cellphone';
            if (!isset($fields[$fieldset])) {
                continue;
            }
            if (isset($fields[$fieldset][$cell_key]) && isset($fields[$fieldset][$phone_key])) {
                $fields[$fieldset][$cell_key]['priority'] = 200;
            }
        }

        // Reposicionamento do CEP quando cep_position estiver ativo
        if ($cep_position === 'yes') {
            // Move o campo CEP (postcode) para depois do campo IE
            if (isset($fields['billing']['billing_postcode'])) {
                $fields['billing']['billing_postcode']['priority'] = 34;
            }
            if (isset($fields['shipping']['shipping_postcode'])) {
                $fields['shipping']['shipping_postcode']['priority'] = 34;
            }
        }

        // Adiciona o checkbox apenas se ambas as condições permitirem
        // Só adiciona o checkbox quando as DUAS opções estão explicitamente ligadas.
        // REASON: a comparação negativa (`=== 'no'`) deixava qualquer valor fora do
        // par yes/no — option vazia de um salvamento antigo, por exemplo — cair no
        // ramo do "adiciona", e o checkbox aparecia no checkout com a opção desligada.
        if ($fill_checkout_address !== 'yes' || $cep_position !== 'yes') {
            return $fields;
        }

        // Adiciona o campo de checkbox em billing e shipping, com IDs únicos
        $billing_checkbox_key = 'wc_better_calc_checkbox_billing';
        $shipping_checkbox_key = 'wc_better_calc_checkbox_shipping';

        $billing_checkbox_field = array(
            'type'        => 'checkbox',
            'label'       => __('Informe acima o código postal (CEP).', 'woo-better-shipping-calculator-for-brazil'),
            'required'    => false,
            'class'       => array('form-row-wide'),
            'priority'    => 35,
            'id'          => 'wc_better_calc_checkbox_billing',
        );
        $shipping_checkbox_field = array(
            'type'        => 'checkbox',
            'label'       => __('Informe acima o código postal (CEP).', 'woo-better-shipping-calculator-for-brazil'),
            'required'    => false,
            'class'       => array('form-row-wide'),
            'priority'    => 35,
            'id'          => 'wc_better_calc_checkbox_shipping',
        );

        $fields['billing'][$billing_checkbox_key] = $billing_checkbox_field;
        $fields['shipping'][$shipping_checkbox_key] = $shipping_checkbox_field;
        
        // Corrige a exibição da label do address_2 (remove screen-reader-text)
        if (isset($fields['billing']['billing_address_2'])) {
            $fields['billing']['billing_address_2']['label_class'] = '';
        }
        if (isset($fields['shipping']['shipping_address_2'])) {
            $fields['shipping']['shipping_address_2']['label_class'] = '';
        }

        return $fields;
    }

    public function wc_better_insert_address() {
        // Verifica nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nonce'])), 'wc_better_insert_address')) {
            wp_send_json_error(['message' => 'Falha na verificação de segurança (nonce).'], 403);
        }
        
        // Inicializa a sessão do WooCommerce se necessário
        if (!WC()->session->has_session()) {
            WC()->session->set_customer_session_cookie(true);
        }
        
        // Recebe e sanitiza os dados
        $address    = isset($_POST['address']) ? sanitize_text_field(wp_unslash($_POST['address'])) : '';
        $city       = isset($_POST['city']) ? sanitize_text_field(wp_unslash($_POST['city'])) : '';
        $state      = isset($_POST['state']) ? sanitize_text_field(wp_unslash($_POST['state'])) : '';
        $district   = isset($_POST['district']) ? sanitize_text_field(wp_unslash($_POST['district'])) : '';
        $postcode   = isset($_POST['postcode']) ? sanitize_text_field(wp_unslash($_POST['postcode'])) : '';
        $context    = isset($_POST['context']) ? sanitize_text_field(wp_unslash($_POST['context'])) : 'shipping';

        $updated = false;
        $replicated_to_billing = false;
        $replicated_to_shipping = false;
        $should_replicate_to_billing = false;
        $should_replicate_to_shipping = false;
        
        if (function_exists('WC') && WC()->customer) {
            // Verifica se precisa replicar ANTES de fazer as alterações
            if ($context === 'shipping') {
                $billing_address_empty = $this->is_address_empty('billing', WC()->customer);
                $should_replicate_to_billing = $billing_address_empty && ($address !== '' || $city !== '' || $state !== '');
            } else {
                $shipping_address_empty = $this->is_address_empty('shipping', WC()->customer);
                $should_replicate_to_shipping = $shipping_address_empty && ($address !== '' || $city !== '' || $state !== '');
            }
            
            if ($context === 'shipping') {
                // Verifica se o país é diferente de BR ou não existe
                $current_shipping_country = WC()->customer->get_shipping_country();
                if (empty($current_shipping_country) || strtoupper($current_shipping_country) !== 'BR') {
                    WC()->customer->set_shipping_country('BR');
                    $updated = true;
                }
                
                // Não concatena mais endereço e bairro - cada campo vai para seu lugar próprio
                if ($address !== '') {
                    WC()->customer->set_shipping_address_1($address);
                    $updated = true;
                }
                if ($city !== '') {
                    WC()->customer->set_shipping_city($city);
                    $updated = true;
                }
                if ($state !== '') {
                    WC()->customer->set_shipping_state($state);
                    $updated = true;
                }
                if ($postcode !== '') {
                    WC()->customer->set_shipping_postcode($postcode);
                    $updated = true;
                }
                // Define o bairro no campo personalizado se houver
                if ($district !== '' && method_exists(WC()->customer, 'update_meta')) {
                    WC()->customer->update_meta('shipping_neighborhood', $district);
                    $updated = true;
                }
                
                // Replica para cobrança se necessário
                if ($should_replicate_to_billing) {
                    WC()->customer->set_billing_country('BR');
                    if ($address !== '') WC()->customer->set_billing_address_1($address);
                    if ($city !== '') WC()->customer->set_billing_city($city);
                    if ($state !== '') WC()->customer->set_billing_state($state);
                    if ($postcode !== '') WC()->customer->set_billing_postcode($postcode);
                    if ($district !== '' && method_exists(WC()->customer, 'update_meta')) {
                        WC()->customer->update_meta('billing_neighborhood', $district);
                    }
                    $replicated_to_billing = true;
                    $updated = true;
                }
                
            } else {
                // Verifica se o país é diferente de BR ou não existe
                $current_billing_country = WC()->customer->get_billing_country();
                if (empty($current_billing_country) || strtoupper($current_billing_country) !== 'BR') {
                    WC()->customer->set_billing_country('BR');
                    $updated = true;
                }
                
                // Não concatena mais endereço e bairro - cada campo vai para seu lugar próprio
                if ($address !== '') {
                    WC()->customer->set_billing_address_1($address);
                    $updated = true;
                }
                if ($city !== '') {
                    WC()->customer->set_billing_city($city);
                    $updated = true;
                }
                if ($state !== '') {
                    WC()->customer->set_billing_state($state);
                    $updated = true;
                }
                if ($postcode !== '') {
                    WC()->customer->set_billing_postcode($postcode);
                    $updated = true;
                }
                // Define o bairro no campo personalizado se houver
                if ($district !== '' && method_exists(WC()->customer, 'update_meta')) {
                    WC()->customer->update_meta('billing_neighborhood', $district);
                    $updated = true;
                }
                
                // Replica para entrega se necessário
                if ($should_replicate_to_shipping) {
                    WC()->customer->set_shipping_country('BR');
                    if ($address !== '') WC()->customer->set_shipping_address_1($address);
                    if ($city !== '') WC()->customer->set_shipping_city($city);
                    if ($state !== '') WC()->customer->set_shipping_state($state);
                    if ($postcode !== '') WC()->customer->set_shipping_postcode($postcode);
                    if ($district !== '' && method_exists(WC()->customer, 'update_meta')) {
                        WC()->customer->update_meta('shipping_neighborhood', $district);
                    }
                    $replicated_to_shipping = true;
                    $updated = true;
                }
            }
            if ($updated) {                
                // Salva explicitamente na sessão para garantir persistencia em requisições subsequentes
                if ($context === 'shipping') {
                    if ($address !== '') WC()->session->set('shipping_address_1', $address);
                    if ($city !== '') WC()->session->set('shipping_city', $city);
                    if ($state !== '') WC()->session->set('shipping_state', $state);
                    if ($postcode !== '') WC()->session->set('shipping_postcode', $postcode);
                    if ($district !== '') WC()->session->set('shipping_neighborhood', $district);
                    WC()->session->set('shipping_country', 'BR');
                    
                    // Se replicou para cobrança, salva também na sessão
                    if ($should_replicate_to_billing) {
                        if ($address !== '') WC()->session->set('billing_address_1', $address);
                        if ($city !== '') WC()->session->set('billing_city', $city);
                        if ($state !== '') WC()->session->set('billing_state', $state);
                        if ($postcode !== '') WC()->session->set('billing_postcode', $postcode);
                        if ($district !== '') WC()->session->set('billing_neighborhood', $district);
                        WC()->session->set('billing_country', 'BR');
                    }
                } else {
                    if ($address !== '') WC()->session->set('billing_address_1', $address);
                    if ($city !== '') WC()->session->set('billing_city', $city);
                    if ($state !== '') WC()->session->set('billing_state', $state);
                    if ($postcode !== '') WC()->session->set('billing_postcode', $postcode);
                    if ($district !== '') WC()->session->set('billing_neighborhood', $district);
                    WC()->session->set('billing_country', 'BR');
                    
                    // Se replicou para entrega, salva também na sessão
                    if ($should_replicate_to_shipping) {
                        if ($address !== '') WC()->session->set('shipping_address_1', $address);
                        if ($city !== '') WC()->session->set('shipping_city', $city);
                        if ($state !== '') WC()->session->set('shipping_state', $state);
                        if ($postcode !== '') WC()->session->set('shipping_postcode', $postcode);
                        if ($district !== '') WC()->session->set('shipping_neighborhood', $district);
                        WC()->session->set('shipping_country', 'BR');
                    }
                }

                // Salva também nos dados do usuário logado se aplicável
                if (is_user_logged_in()) {
                    $user_id = get_current_user_id();
                    
                    if ($context === 'shipping') {
                        // Salva dados de shipping no user meta
                        if ($address !== '') update_user_meta($user_id, 'shipping_address_1', $address);
                        if ($city !== '') update_user_meta($user_id, 'shipping_city', $city);
                        if ($state !== '') update_user_meta($user_id, 'shipping_state', $state);
                        if ($postcode !== '') update_user_meta($user_id, 'shipping_postcode', $postcode);
                        if ($district !== '') update_user_meta($user_id, 'shipping_neighborhood', $district);
                        update_user_meta($user_id, 'shipping_country', 'BR');
                        
                        // Se replicou para cobrança, salva também no user meta
                        if ($should_replicate_to_billing) {
                            if ($address !== '') update_user_meta($user_id, 'billing_address_1', $address);
                            if ($city !== '') update_user_meta($user_id, 'billing_city', $city);
                            if ($state !== '') update_user_meta($user_id, 'billing_state', $state);
                            if ($postcode !== '') update_user_meta($user_id, 'billing_postcode', $postcode);
                            if ($district !== '') update_user_meta($user_id, 'billing_neighborhood', $district);
                            update_user_meta($user_id, 'billing_country', 'BR');
                        }
                    } else {
                        // Salva dados de billing no user meta
                        if ($address !== '') update_user_meta($user_id, 'billing_address_1', $address);
                        if ($city !== '') update_user_meta($user_id, 'billing_city', $city);
                        if ($state !== '') update_user_meta($user_id, 'billing_state', $state);
                        if ($postcode !== '') update_user_meta($user_id, 'billing_postcode', $postcode);
                        if ($district !== '') update_user_meta($user_id, 'billing_neighborhood', $district);
                        update_user_meta($user_id, 'billing_country', 'BR');
                        
                        // Se replicou para entrega, salva também no user meta
                        if ($should_replicate_to_shipping) {
                            if ($address !== '') update_user_meta($user_id, 'shipping_address_1', $address);
                            if ($city !== '') update_user_meta($user_id, 'shipping_city', $city);
                            if ($state !== '') update_user_meta($user_id, 'shipping_state', $state);
                            if ($postcode !== '') update_user_meta($user_id, 'shipping_postcode', $postcode);
                            if ($district !== '') update_user_meta($user_id, 'shipping_neighborhood', $district);
                            update_user_meta($user_id, 'shipping_country', 'BR');
                        }
                    }
                }

                WC()->customer->save();
            }
        }
        
        if ($updated) {
            // Monta mensagem indicando onde o endereço foi inserido
            $message_parts = [];
            $address_text = "{$address}, {$city}";
            if (!empty($district)) $address_text .= " - {$district}";
            $address_text .= " - {$state}";
            
            // Mensagem principal
            if ($context === 'shipping') {
                $message_parts[] = "Endereço de entrega inserido: {$address_text}";
            } else {
                $message_parts[] = "Endereço de cobrança inserido: {$address_text}";
            }
            
            // Indica se houve replicação
            if ($replicated_to_billing) {
                $message_parts[] = "Mesmo endereço aplicado para cobrança";
            } elseif ($replicated_to_shipping) {
                $message_parts[] = "Mesmo endereço aplicado para entrega";
            }
            
            wp_send_json_success([
                'message' => "Endereço inserido: {$address}, {$city} - {$district} - {$state}"
            ]);
        } else {
            wp_send_json_success([
                'message' => 'Nenhum endereço inserido, dados em branco.'
            ]);
        }
    }

    /**
     * Verifica se um endereço (billing ou shipping) está vazio
     *
     * @param string $type Tipo do endereço: 'billing' ou 'shipping'
     * @param WC_Customer $customer Instância do customer do WooCommerce
     * @return bool True se o endereço estiver vazio, false caso contrário
     */
    private function is_address_empty($type, $customer) {
        if ($type === 'billing') {
            $address_1 = $customer->get_billing_address_1();
            $city = $customer->get_billing_city();
            $state = $customer->get_billing_state();
            $postcode = $customer->get_billing_postcode();
        } else {
            $address_1 = $customer->get_shipping_address_1();
            $city = $customer->get_shipping_city();
            $state = $customer->get_shipping_state();
            $postcode = $customer->get_shipping_postcode();
        }

        // Considera vazio se todos os campos principais estão em branco
        return (empty($address_1) && empty($city) && empty($state) && empty($postcode));
    }

    /**
     * Run the loader to execute all of the hooks with WordPress.
     *
     * @since    1.0.0
     */
    public function run()
    {
        $this->loader->run();
    }

    /**
     * The name of the plugin used to uniquely identify it within the context of
     * WordPress and to define internationalization functionality.
     *
     * @since     1.0.0
     * @return    string    The name of the plugin.
     */
    public function get_plugin_name()
    {
        return $this->plugin_name;
    }

    /**
     * The reference to the class that orchestrates the hooks with the plugin.
     *
     * @since     1.0.0
     * @return    WcBetterShippingCalculatorForBrazilLoader    Orchestrates the hooks of the plugin.
     */
    public function get_loader()
    {
        return $this->loader;
    }

    /**
     * Retrieve the version number of the plugin.
     *
     * @since     1.0.0
     * @return    string    The version number of the plugin.
     */
    public function get_version()
    {
        return $this->version;
    }

    /**
     * Processa os dados de bairro no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_neighborhood_from_data($order, $data)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            // Captura dos dados do checkout tradicional (via $data, já filtrado por woocommerce_checkout_posted_data)
            $billing_neighborhood = isset($data['billing_neighborhood']) ? sanitize_text_field(wp_unslash($data['billing_neighborhood'])) : '';
            $shipping_neighborhood = isset($data['shipping_neighborhood']) ? sanitize_text_field(wp_unslash($data['shipping_neighborhood'])) : '';

            // Detecta se está usando o mesmo endereço
            $use_same_address = $this->detect_same_address_usage($order, $data);
            
            // Lógica de sincronização considerando o checkbox de mesmo endereço
            if ($use_same_address) {
                // Se usar mesmo endereço, prioriza o bairro de cobrança (billing)
                if (!empty($billing_neighborhood)) {
                    $shipping_neighborhood = $billing_neighborhood;
                } elseif (!empty($shipping_neighborhood)) {
                    $billing_neighborhood = $shipping_neighborhood;
                }
            } else {
                // Lógica original quando não usa mesmo endereço
                if (!empty($billing_neighborhood) && empty($shipping_neighborhood)) {
                    $shipping_neighborhood = $billing_neighborhood;
                } elseif (!empty($shipping_neighborhood) && empty($billing_neighborhood)) {
                    $billing_neighborhood = $shipping_neighborhood;
                }
            }

            // Salva os bairros
            if (!empty($billing_neighborhood)) {
                $order->update_meta_data('_billing_neighborhood', $billing_neighborhood);
            }
            if (!empty($shipping_neighborhood)) {
                $order->update_meta_data('_shipping_neighborhood', $shipping_neighborhood);
            }
        }
    }

    /**
     * Processa os dados de bairro no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_neighborhood_from_request($order, $request)
    {
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        
        if ($neighborhood_enabled === 'yes') {
            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];
            
            $billing_neighborhood = '';
            $shipping_neighborhood = '';
            
            // Verifica o namespace dos dados de bairro
            if (isset($extensions['woo_better_neighborhood'])) {
                $neighborhood_data = $extensions['woo_better_neighborhood'];
                
                if (isset($neighborhood_data['billing_neighborhood'])) {
                    $billing_neighborhood = sanitize_text_field($neighborhood_data['billing_neighborhood']);
                }
                if (isset($neighborhood_data['shipping_neighborhood'])) {
                    $shipping_neighborhood = sanitize_text_field($neighborhood_data['shipping_neighborhood']);
                }
            }
            
            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_neighborhood) && isset($_POST['billing_neighborhood'])) {
                $billing_neighborhood = sanitize_text_field(wp_unslash($_POST['billing_neighborhood']));
            }
            if (empty($shipping_neighborhood) && isset($_POST['shipping_neighborhood'])) {
                $shipping_neighborhood = sanitize_text_field(wp_unslash($_POST['shipping_neighborhood']));
            }

            // Detecta se está usando o mesmo endereço
            $use_same_address = $this->detect_same_address_usage_from_request($order, $request);
            
            // Lógica de sincronização considerando o checkbox de mesmo endereço
            if ($use_same_address) {
                // Se usar mesmo endereço, prioriza o bairro de entrega (shipping)
                if (!empty($shipping_neighborhood)) {
                    $billing_neighborhood = $shipping_neighborhood;
                } elseif (!empty($billing_neighborhood)) {
                    $shipping_neighborhood = $billing_neighborhood;
                }
            } else {
                // Lógica original quando não usa mesmo endereço
                if (!empty($billing_neighborhood) && empty($shipping_neighborhood)) {
                    $shipping_neighborhood = $billing_neighborhood;
                } elseif (!empty($shipping_neighborhood) && empty($billing_neighborhood)) {
                    $billing_neighborhood = $shipping_neighborhood;
                }
            }

            // Salva os bairros
            if (!empty($billing_neighborhood)) {
                $order->update_meta_data('_billing_neighborhood', $billing_neighborhood);
            }
            if (!empty($shipping_neighborhood)) {
                $order->update_meta_data('_shipping_neighborhood', $shipping_neighborhood);
            }
        }
    }

    /**
     * Processa os dados de data de nascimento no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_birthdate_from_data($order, $data)
    {
        $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
        
        if ($birthdate_enabled === 'yes') {
            // Captura dos dados do checkout tradicional (via $data, já filtrado por woocommerce_checkout_posted_data)
            $billing_birthdate = isset($data['billing_birthdate']) ? sanitize_text_field(wp_unslash($data['billing_birthdate'])) : '';

            // Normaliza para Y-m-d antes de salvar
            $billing_birthdate = $this->normalize_birthdate_value($billing_birthdate);

            // Salva a data de nascimento
            // CORREÇÃO: Sempre salva quando habilitado para sobrescrever valores antigos
            $order->update_meta_data('_billing_birthdate', $billing_birthdate);
        }
    }

    /**
     * Processa os dados de data de nascimento no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_birthdate_from_request($order, $request)
    {
        $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
        
        if ($birthdate_enabled === 'yes') {
            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];

            $billing_birthdate = '';
            
            // Verifica o namespace dos dados de data de nascimento
            if (isset($extensions['woo_better_birthdate'])) {
                $birthdate_data = $extensions['woo_better_birthdate'];
                
                if (isset($birthdate_data['billing_birthdate'])) {
                    $billing_birthdate = sanitize_text_field($birthdate_data['billing_birthdate']);
                }
            }
            
            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_birthdate) && isset($_POST['billing_birthdate'])) {
                $billing_birthdate = sanitize_text_field(wp_unslash($_POST['billing_birthdate']));
            }

            // Normaliza para Y-m-d; rejeita formatos inválidos com erro 400
            if (!empty($billing_birthdate)) {
                $raw_birthdate = $billing_birthdate;
                $billing_birthdate = $this->normalize_birthdate_value($billing_birthdate);

                if ($billing_birthdate === '') {
                    throw new \WC_REST_Exception(
                        'wc_order_birthdate_invalid',
                        'Formato de data de nascimento inválido.',
                        400
                    );
                }
            }

            // CORREÇÃO: Sempre salva quando habilitado para sobrescrever valores antigos
            $order->update_meta_data('_billing_birthdate', $billing_birthdate);
        }
    }

    /**
     * Processa os dados de gênero no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_gender_from_request($order, $request)
    {
        $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
        
        if ($gender_enabled === 'yes') {
            // Captura dos dados do request do Block Checkout
            $extensions = $request->get_param('extensions') ?? [];
            
            $billing_gender = '';
            
            // Verifica o namespace dos dados de gênero
            if (isset($extensions['woo_better_gender'])) {
                $gender_data = $extensions['woo_better_gender'];
                
                if (isset($gender_data['billing_gender'])) {
                    $billing_gender = sanitize_text_field($gender_data['billing_gender']);
                }
            }

            // Fallback para $_POST se não encontrar nos extensions
            if (empty($billing_gender) && isset($_POST['billing_gender'])) {
                $billing_gender = sanitize_text_field(wp_unslash($_POST['billing_gender']));
            }

            // CORREÇÃO: Sempre salva gênero quando habilitado para evitar dados antigos "Masculino"
            $order->update_meta_data('_billing_gender', $billing_gender);
        }
    }

    /**
     * Processa os dados de gênero no checkout tradicional
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_gender_from_data($order, $data)
    {
        $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
        
        if ($gender_enabled === 'yes') {
            // Captura dos dados do checkout tradicional (via $data, já filtrado por woocommerce_checkout_posted_data)
            $billing_gender = isset($data['billing_gender']) ? sanitize_text_field(wp_unslash($data['billing_gender'])) : '';

            // CORREÇÃO: Sempre salva gênero quando habilitado para evitar dados antigos "Masculino"
            $order->update_meta_data('_billing_gender', $billing_gender);
        }
    }

    /**
     * Processa os dados de Inscrição Estadual (IE) no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_ie_from_request($order, $request)
    {
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($ie_field_enabled !== 'yes' || ($person_type !== 'legal' && $person_type !== 'both')) {
            return;
        }

        $extensions = $request->get_param('extensions') ?? [];

        // Determina se o documento submetido é um CNPJ (14 dígitos)
        $billing_cnpj = '';
        if (isset($extensions['woo_better_person_type']['billing_cnpj'])) {
            $billing_cnpj = sanitize_text_field($extensions['woo_better_person_type']['billing_cnpj']);
        }
        if (empty($billing_cnpj) && isset($_POST['billing_cnpj'])) {
            $billing_cnpj = sanitize_text_field(wp_unslash($_POST['billing_cnpj']));
        }
        if (empty($billing_cnpj) && isset($_POST['billing_document'])) {
            $billing_cnpj = sanitize_text_field(wp_unslash($_POST['billing_document']));
        }
        $is_cnpj = strlen(preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_cnpj))) === 14;

        if (!$is_cnpj) {
            $order->update_meta_data('_billing_ie', '');
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_ie', '');
            }

            // REASON: limpa também a sessão, senão o valor antigo de IE volta
            // ao checkout (o preenchimento lê user_meta e, vazio, usa a sessão).
            if (function_exists('WC') && WC()->session) {
                WC()->session->set('billing_ie', '');
            }
            return;
        }

        if (isset($extensions['woo_better_ie_field'])) {
            $ie_data = $extensions['woo_better_ie_field'];
            if (isset($ie_data['billing_ie'])) {
                $billing_ie = strtoupper(sanitize_text_field($ie_data['billing_ie']));
                $order->update_meta_data('_billing_ie', $billing_ie);

                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), 'billing_ie', $billing_ie);
                }
            }
        }
    }

    /**
     * Processa os dados de Inscrição Estadual (IE) no checkout clássico
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_ie_from_data($order, $data)
    {
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($ie_field_enabled !== 'yes' || ($person_type !== 'legal' && $person_type !== 'both')) {
            return;
        }

        // Determina se o documento submetido é um CNPJ (14 dígitos)
        $billing_document = '';
        if (!empty($data['billing_cnpj'])) {
            $billing_document = sanitize_text_field(wp_unslash($data['billing_cnpj']));
        } elseif (!empty($data['billing_document'])) {
            $billing_document = sanitize_text_field(wp_unslash($data['billing_document']));
        }
        $is_cnpj = strlen(preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_document))) === 14;

        if (!$is_cnpj) {
            $order->update_meta_data('_billing_ie', '');
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_ie', '');
            }

            // REASON: limpa também a sessão, senão o valor antigo de IE volta
            // ao checkout (o preenchimento lê user_meta e, vazio, usa a sessão).
            if (function_exists('WC') && WC()->session) {
                WC()->session->set('billing_ie', '');
            }
            return;
        }

        $billing_ie = isset($data['billing_ie']) ? strtoupper(sanitize_text_field(wp_unslash($data['billing_ie']))) : '';

        $order->update_meta_data('_billing_ie', $billing_ie);

        if (is_user_logged_in()) {
            update_user_meta(get_current_user_id(), 'billing_ie', $billing_ie);
        }
    }

    /**
     * Processa os dados de Inscrição Municipal (IM) no checkout de BLOCOS.
     *
     * Espelha `process_ie_from_request`: só age quando o campo está habilitado e o
     * documento é CNPJ; caso contrário limpa a meta/sessão/user_meta.
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_im_from_request($order, $request)
    {
        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($im_field_enabled !== 'yes' || ($person_type !== 'legal' && $person_type !== 'both')) {
            return;
        }

        $extensions = $request->get_param('extensions') ?? [];

        // Determina se o documento submetido é um CNPJ (14 dígitos)
        $billing_cnpj = '';
        if (isset($extensions['woo_better_person_type']['billing_cnpj'])) {
            $billing_cnpj = sanitize_text_field($extensions['woo_better_person_type']['billing_cnpj']);
        }
        if (empty($billing_cnpj) && isset($_POST['billing_cnpj'])) {
            $billing_cnpj = sanitize_text_field(wp_unslash($_POST['billing_cnpj']));
        }
        if (empty($billing_cnpj) && isset($_POST['billing_document'])) {
            $billing_cnpj = sanitize_text_field(wp_unslash($_POST['billing_document']));
        }
        $is_cnpj = strlen(preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_cnpj))) === 14;

        if (!$is_cnpj) {
            $order->update_meta_data('_billing_im', '');
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_im', '');
            }

            // Limpa também a sessão, senão o valor antigo de IM volta ao checkout.
            if (function_exists('WC') && WC()->session) {
                WC()->session->set('billing_im', '');
            }
            return;
        }

        if (isset($extensions['woo_better_im_field'])) {
            $im_data = $extensions['woo_better_im_field'];
            if (isset($im_data['billing_im'])) {
                $billing_im = strtoupper(sanitize_text_field($im_data['billing_im']));
                $order->update_meta_data('_billing_im', $billing_im);

                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), 'billing_im', $billing_im);
                }
            }
        }
    }

    /**
     * Processa os dados de Inscrição Municipal (IM) no checkout clássico.
     *
     * Espelha `process_ie_from_data`.
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_im_from_data($order, $data)
    {
        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');

        if ($im_field_enabled !== 'yes' || ($person_type !== 'legal' && $person_type !== 'both')) {
            return;
        }

        // Determina se o documento submetido é um CNPJ (14 dígitos)
        $billing_document = '';
        if (!empty($data['billing_cnpj'])) {
            $billing_document = sanitize_text_field(wp_unslash($data['billing_cnpj']));
        } elseif (!empty($data['billing_document'])) {
            $billing_document = sanitize_text_field(wp_unslash($data['billing_document']));
        }
        $is_cnpj = strlen(preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_document))) === 14;

        if (!$is_cnpj) {
            $order->update_meta_data('_billing_im', '');
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_im', '');
            }

            // Limpa também a sessão, senão o valor antigo de IM volta ao checkout.
            if (function_exists('WC') && WC()->session) {
                WC()->session->set('billing_im', '');
            }
            return;
        }

        $billing_im = isset($data['billing_im']) ? strtoupper(sanitize_text_field(wp_unslash($data['billing_im']))) : '';

        $order->update_meta_data('_billing_im', $billing_im);

        if (is_user_logged_in()) {
            update_user_meta(get_current_user_id(), 'billing_im', $billing_im);
        }
    }

    /**
     * Processa os dados de RG no checkout de BLOCOS.
     *
     * Espelha `process_im_from_request`, porém INVERTIDO: o RG é exclusivo de
     * pessoa FÍSICA, então só é gravado quando o documento é um CPF (11 dígitos).
     * Com CNPJ (ou documento ausente) a meta é LIMPA — o RG não pertence ao
     * pedido de pessoa jurídica.
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_rg_from_request($order, $request)
    {
        if (! $this->rg_field_enabled()) {
            return;
        }

        $extensions = $request->get_param('extensions') ?? [];

        // Determina se o documento submetido é um CPF (11 dígitos).
        $billing_document = '';
        if (!empty($extensions['woo_better_person_type']['billing_cpf'])) {
            $billing_document = sanitize_text_field($extensions['woo_better_person_type']['billing_cpf']);
        }
        if (empty($billing_document) && !empty($extensions['woo_better_person_type']['billing_document'])) {
            $billing_document = sanitize_text_field($extensions['woo_better_person_type']['billing_document']);
        }
        if (empty($billing_document) && isset($_POST['billing_cpf'])) {
            $billing_document = sanitize_text_field(wp_unslash($_POST['billing_cpf']));
        }
        if (empty($billing_document) && isset($_POST['billing_document'])) {
            $billing_document = sanitize_text_field(wp_unslash($_POST['billing_document']));
        }

        $is_cpf = 11 === strlen($this->document_clean_value($billing_document));

        if (!$is_cpf) {
            $order->update_meta_data('_billing_rg', '');
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_rg', '');
            }

            // Limpa também a sessão, senão o valor antigo de RG volta ao checkout.
            if (function_exists('WC') && WC()->session) {
                WC()->session->set('billing_rg', '');
            }
            return;
        }

        if (isset($extensions['woo_better_rg_field'])) {
            $rg_data = $extensions['woo_better_rg_field'];
            if (isset($rg_data['billing_rg'])) {
                $billing_rg = $this->sanitize_rg_value($rg_data['billing_rg']);
                $order->update_meta_data('_billing_rg', $billing_rg);

                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), 'billing_rg', $billing_rg);
                }
            }
        }
    }

    /**
     * Processa os dados de RG no checkout clássico.
     *
     * Espelha `process_rg_from_request` (só grava para CPF; limpa para CNPJ).
     *
     * @param WC_Order $order
     * @param array $data
     * @return void
     */
    private function process_rg_from_data($order, $data)
    {
        if (! $this->rg_field_enabled()) {
            return;
        }

        $billing_document = '';
        if (!empty($data['billing_cpf'])) {
            $billing_document = sanitize_text_field(wp_unslash($data['billing_cpf']));
        } elseif (!empty($data['billing_document'])) {
            $billing_document = sanitize_text_field(wp_unslash($data['billing_document']));
        }
        $is_cpf = 11 === strlen($this->document_clean_value($billing_document));

        if (!$is_cpf) {
            $order->update_meta_data('_billing_rg', '');
            if (is_user_logged_in()) {
                update_user_meta(get_current_user_id(), 'billing_rg', '');
            }

            // Limpa também a sessão, senão o valor antigo de RG volta ao checkout.
            if (function_exists('WC') && WC()->session) {
                WC()->session->set('billing_rg', '');
            }
            return;
        }

        $billing_rg = isset($data['billing_rg']) ? $this->sanitize_rg_value(wp_unslash($data['billing_rg'])) : '';

        $order->update_meta_data('_billing_rg', $billing_rg);

        if (is_user_logged_in()) {
            update_user_meta(get_current_user_id(), 'billing_rg', $billing_rg);
        }
    }

    /**
     * Processa os dados de telefone formatado no checkout de blocos
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_phone_formatter_from_request($order, $request)
    {
        // Captura dos dados do request do Block Checkout
        $extensions = $request->get_param('extensions') ?? [];

        // Verifica o namespace dos dados de telefone formatado
        if (isset($extensions['woo_better_phone_formatter'])) {
            $phone_data = $extensions['woo_better_phone_formatter'];

            // Processa telefone billing formatado
            if (isset($phone_data['billing_phone_formatted'])) {
                $billing_phone_formatted = sanitize_text_field($phone_data['billing_phone_formatted']);
                if (!empty($billing_phone_formatted)) {
                    $order->set_billing_phone($billing_phone_formatted);
                }
            }

            // Processa telefone shipping formatado  
            if (isset($phone_data['shipping_phone_formatted'])) {
                $shipping_phone_formatted = sanitize_text_field($phone_data['shipping_phone_formatted']);
                if (!empty($shipping_phone_formatted)) {
                    $order->set_shipping_phone($shipping_phone_formatted);
                }
            }

            // Campo unificado "custom" só existe no modo destaque (Destaque do
            // Campo Telefone). No modo por-bloco os valores vêm de
            // billing_phone_formatted/shipping_phone_formatted acima. Exigir o
            // destaque evita que um custom_phone_formatted vazio (enviado só
            // para satisfazer o schema) zere os dois telefones.
            $phone_highlight = $this->is_phone_highlight() ? 'yes' : 'no';
            if ($phone_highlight === 'yes' && isset($phone_data['custom_phone_formatted'])) {
                $custom_phone_formatted = sanitize_text_field($phone_data['custom_phone_formatted']);

                if(empty($custom_phone_formatted)) {
                    $custom_phone_formatted = WC()->session->get('custom_phone');
                }
                
                if (!empty($custom_phone_formatted)) {
                    // Aplica o telefone formatado usando apenas os setters do WooCommerce
                    $order->set_billing_phone($custom_phone_formatted);
                    $order->set_shipping_phone($custom_phone_formatted);
                } else {
                    $order->set_billing_phone('');
                    $order->set_shipping_phone(''); 
                }
            }
        }
    }

    /**
     * Processa o telefone/celular do checkout em BLOCOS (campos gerados via JS).
     *
     * O campo nativo do WooCommerce fica oculto; os valores chegam no namespace
     * `woo_better_cellphone` do request. O que é salvo depende do modo:
     *  - `phone_and_cellphone`: telefone → `billing_phone`/`shipping_phone` e
     *    celular → metas `_billing_cellphone`/`_shipping_cellphone`;
     *  - `cellphone_only`: só o celular (metas); o TELEFONE fica VAZIO;
     *  - `landline_only`: só o telefone; o celular fica vazio;
     *  - `disabled`: o TELEFONE é o NATIVO (não mexemos); só o celular (campo
     *    separado) é gravado nas metas.
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_cellphone_from_request($order, $request)
    {
        $mode = $this->get_phone_mode();
        if ( ! in_array($mode, array('phone_and_cellphone', 'cellphone_only', 'landline_only', 'disabled'), true)) {
            return;
        }

        $extensions = $request->get_param('extensions') ?? [];
        $phone_data     = isset($extensions[self::PHONE_EXTENSION_NAMESPACE]) ? $extensions[self::PHONE_EXTENSION_NAMESPACE] : [];
        $cellphone_data = isset($extensions[self::CELLPHONE_EXTENSION_NAMESPACE]) ? $extensions[self::CELLPHONE_EXTENSION_NAMESPACE] : [];

        // Cada TIPO de campo envia a sua extensão: telefone → `woo_better_phone`,
        // celular → `woo_better_cellphone`. Mesclamos as duas (o telefone tem
        // prioridade) para ler as 4 chaves de forma uniforme.
        $data = array_merge((array) $cellphone_data, (array) $phone_data);

        $values = array(
            'billing_phone'      => isset($data['billing_phone']) ? sanitize_text_field($data['billing_phone']) : '',
            'shipping_phone'     => isset($data['shipping_phone']) ? sanitize_text_field($data['shipping_phone']) : '',
            'billing_cellphone'  => isset($data['billing_cellphone']) ? sanitize_text_field($data['billing_cellphone']) : '',
            'shipping_cellphone' => isset($data['shipping_cellphone']) ? sanitize_text_field($data['shipping_cellphone']) : '',
        );

        // Fallback: sessão (valor salvo pelo callback do Store API) — apenas para as
        // chaves do FLUXO atual, para não vazar um valor do outro tipo (ex.: um
        // celular antigo guardado na sessão entrando no fluxo de telefone).
        $flow_keys = array('billing_phone', 'shipping_phone');
        if ('cellphone_only' === $mode || 'disabled' === $mode) {
            $flow_keys = array('billing_cellphone', 'shipping_cellphone');
        }
        if ('phone_and_cellphone' === $mode && $this->is_cellphone_field_enabled()) {
            $flow_keys = array('billing_phone', 'shipping_phone', 'billing_cellphone', 'shipping_cellphone');
        }
        if (function_exists('WC') && WC()->session) {
            foreach ($flow_keys as $key) {
                if (empty($values[$key])) {
                    $values[$key] = (string) WC()->session->get($key, '');
                }
            }
        }

        // "Desabilitar" + "Campo de Celular": o TELEFONE é o NATIVO do WooCommerce
        // (não mexemos nele aqui). O plugin só grava o CELULAR (campo separado).
        if ('disabled' === $mode) {
            $force_billing = ('billing_only' === get_option('woocommerce_ship_to_destination', 'shipping'));
            if ($force_billing) {
                $values['shipping_cellphone'] = $values['billing_cellphone'];
            } elseif (empty($values['billing_cellphone']) && ! empty($values['shipping_cellphone'])) {
                $values['billing_cellphone'] = $values['shipping_cellphone'];
            } elseif (empty($values['shipping_cellphone']) && ! empty($values['billing_cellphone'])) {
                $values['shipping_cellphone'] = $values['billing_cellphone'];
            }

            if (! empty($values['billing_cellphone'])) {
                $order->update_meta_data('_billing_cellphone', $this->format_complete_phone($values['billing_cellphone']));
            }
            if (! empty($values['shipping_cellphone'])) {
                $order->update_meta_data('_shipping_cellphone', $this->format_complete_phone($values['shipping_cellphone']));
            }

            return;
        }

        // Respeita a opção de endereço do WooCommerce: em "billing_only" só o billing
        // vale (espelha nos dois); nos demais, mantém o que veio de cada endereço e
        // preenche o lado vazio pelo outro (mesmo endereço para cobrança/entrega).
        $force_billing = ('billing_only' === get_option('woocommerce_ship_to_destination', 'shipping'));
        foreach (array('phone', 'cellphone') as $kind) {
            $b = 'billing_' . $kind;
            $s = 'shipping_' . $kind;
            if ($force_billing) {
                $values[$s] = $values[$b];
            } elseif (empty($values[$b]) && ! empty($values[$s])) {
                $values[$b] = $values[$s];
            } elseif (empty($values[$s]) && ! empty($values[$b])) {
                $values[$s] = $values[$b];
            }
        }

        // No shim ("Celular Oculto") o `*_cellphone` é o ESPELHO do telefone, mas o
        // campo de telefone aceita fixo E celular: só grava o celular quando o
        // número é de fato um CELULAR (MOBILE). Um fixo LIMPA o campo, permitindo
        // apenas números de celular na meta (ver mirror_phone_to_cellphone).
        if ('phone_and_cellphone' === $mode && $this->phone_mode_adds_cellphone_shim()) {
            $values['billing_cellphone']  = $this->mirror_phone_to_cellphone($values['billing_phone']);
            $values['shipping_cellphone'] = $this->mirror_phone_to_cellphone($values['shipping_phone']);
            // Grava/limpa a meta JÁ aqui (o valor pode ser vazio quando o telefone
            // é fixo). Sem isso, um valor antigo na meta não seria removido.
            $order->update_meta_data('_billing_cellphone', $values['billing_cellphone']);
            $order->update_meta_data('_shipping_cellphone', $values['shipping_cellphone']);
        }

        // "Somente Celular": só o celular é salvo — o telefone do pedido fica VAZIO
        // (o recibo exibe o celular no lugar do telefone via format_order_*_phone).
        if ('cellphone_only' === $mode) {
            $order->set_billing_phone('');
            $order->set_shipping_phone('');

            if (! empty($values['billing_cellphone'])) {
                $order->update_meta_data('_billing_cellphone', $this->format_complete_phone($values['billing_cellphone']));
            }
            if (! empty($values['shipping_cellphone'])) {
                $order->update_meta_data('_shipping_cellphone', $this->format_complete_phone($values['shipping_cellphone']));
            }

            return;
        }

        // Telefone → billing_phone/shipping_phone.
        if (! empty($values['billing_phone'])) {
            $order->set_billing_phone($this->format_complete_phone($values['billing_phone']));
        }
        if (! empty($values['shipping_phone'])) {
            $order->set_shipping_phone($this->format_complete_phone($values['shipping_phone']));
        }

        // "Fixo": o celular fica vazio (nenhuma meta é gravada).
        if ('landline_only' === $mode) {
            return;
        }

        // "Celular e Fixo": celular → metas _billing_cellphone/_shipping_cellphone.
        if (! empty($values['billing_cellphone'])) {
            $order->update_meta_data('_billing_cellphone', $this->format_complete_phone($values['billing_cellphone']));
        }
        if (! empty($values['shipping_cellphone'])) {
            $order->update_meta_data('_shipping_cellphone', $this->format_complete_phone($values['shipping_cellphone']));
        }
    }

    /**
     * Callback do Store API para o campo "Telefone" do bloco.
     *
     * O telefone chega no namespace `woo_better_phone`. O mapeamento para o pedido
     * acontece em `process_cellphone_from_request`.
     *
     * @param array $data
     * @return void
     */
    public function handle_phone_update($data)
    {
        $this->persist_phone_values($data);
    }

    /**
     * Callback do Store API para o campo "Celular" do bloco.
     *
     * @param array $data
     * @return void
     */
    public function handle_cellphone_update($data)
    {
        $this->persist_phone_values($data);
    }

    /**
     * O valor PODE ser um telefone? (descarta LIXO salvo)
     *
     * O E.164 limita o número a 15 dígitos; acima disso não é telefone de ninguém
     * (ex.: `83988888885555555…`, o DDI colado várias vezes por um build antigo).
     * Serve só para NÃO GRAVAR/SEMEAR lixo — nunca para apagar o que já estava
     * salvo: um valor recusado aqui é IGNORADO pelos pontos de persistência (o
     * telefone anterior continua no perfil/sessão) e quem barra o número inválido
     * é a validação no ENVIO do formulário. Valores PARCIAIS contam como possíveis
     * (o sync é debounced durante a digitação).
     *
     * @param string $value Telefone (com ou sem formatação).
     * @return bool
     */
    private function is_plausible_phone_value($value)
    {
        $digits = preg_replace('/[^0-9]/', '', (string) $value);

        return '' === $digits || strlen($digits) <= 15;
    }

    /**
     * Valor inicial dos campos de telefone no checkout CLÁSSICO.
     *
     * O core monta esse valor a partir do CADASTRO do cliente
     * (`woocommerce_checkout_get_value`). Um resíduo inválido salvo no perfil
     * (ex.: `83988888885555555…`) era semeado no campo; aqui ele vira vazio. Qualquer
     * outro campo/valor segue intocado (devolve `null`, e o core resolve).
     *
     * @param mixed  $value Valor já resolvido por terceiros (null = seguir o core).
     * @param string $input Nome do campo (ex.: `billing_phone`).
     * @return mixed
     */
    public function sanitize_checkout_phone_default_value($value, $input)
    {
        if (null !== $value) {
            return $value;
        }

        if (! in_array($input, array('billing_phone', 'shipping_phone', 'billing_cellphone', 'shipping_cellphone'), true)) {
            return $value;
        }

        if (! function_exists('WC') || ! WC()->customer) {
            return $value;
        }

        $method = 'get_' . $input;
        if (! method_exists(WC()->customer, $method)) {
            return $value;
        }

        // O core lê do CADASTRO quando o cliente está logado e do customer/sessão
        // quando é visitante — checa as duas fontes, para o resíduo não escapar por
        // `WC()->customer` estar num estado (ex.: guest) diferente do cadastro.
        $sources = array();
        if (is_user_logged_in()) {
            $sources[] = get_user_meta(get_current_user_id(), $input, true);
        }
        $sources[] = WC()->customer->{$method}();

        foreach ($sources as $stored) {
            if (! $this->is_plausible_phone_value($stored)) {
                return '';
            }
        }

        return $value;
    }

    /**
     * Grava os valores de telefone/celular na sessão e no perfil do usuário.
     *
     * Grava na sessão/perfil as chaves de telefone/celular presentes no payload do
     * namespace (cada tipo envia as suas 2 chaves).
     *
     * @param array $data Dados vindos do namespace do Store API.
     * @return void
     */
    private function persist_phone_values($data)
    {
        if (! function_exists('WC') || ! WC()->session) {
            return;
        }

        $synced_customer = false;

        foreach (array('billing_phone', 'shipping_phone', 'billing_cellphone', 'shipping_cellphone') as $key) {
            if (isset($data[$key])) {
                // Normaliza no MESMO padrão dos demais campos (+DDInúmero, sem
                // máscara). O valor pode chegar formatado do input (ex.: resíduo
                // antigo ou o intl-tel-input do campo principal), o que deixaria o
                // perfil/sessão divergente do pedido.
                $value = $this->format_complete_phone(sanitize_text_field($data[$key]));

                // No shim ("Celular Oculto") o `*_cellphone` é o ESPELHO do
                // telefone: só faz sentido persistir quando o número é um CELULAR
                // (o telefone pode ser fixo). Um fixo/lixo vira vazio, para a
                // sessão/perfil não guardarem um "celular" que não é celular.
                if ('cellphone' === substr($key, -9) && $this->phone_mode_adds_cellphone_shim() && ! $this->is_cellphone_number($value)) {
                    $value = '';
                }

                // Valor que não pode ser um telefone (ex.: mais dígitos do que o
                // E.164 permite, como "+55 838999988999999" digitado com o DDI junto)
                // é IGNORADO: o que estava salvo fica como está. Aqui NÃO se grava
                // vazio — isso apagava o telefone bom do perfil/sessão quando o
                // cliente errava um dígito e a página era recarregada. Quem barra o
                // número inválido é a validação no ENVIO (clássico e blocos).
                if (! $this->is_plausible_phone_value($value)) {
                    continue;
                }

                WC()->session->set($key, $value);
                // Sincroniza com o perfil do usuário (como os demais campos customizados).
                if (is_user_logged_in()) {
                    update_user_meta(get_current_user_id(), $key, $value);
                }

                if ('cellphone' === substr($key, -9)) {
                    continue;
                }

                // Sincroniza o OBJETO do cliente WooCommerce (o "cache" do `WC()`).
                //
                // A sessão acima só guarda as chaves do plugin; `WC()->customer`
                // continua com o valor ANTERIOR até um `save()`. Como o core salva o
                // customer em toda atualização de carrinho/checkout, ele reescrevia o
                // valor velho no user meta — era isso que fazia um telefone APAGADO
                // reaparecer sozinho (nativo, pedido e perfil). Só os telefones: o
                // celular é meta do plugin, não propriedade do cliente.
                if (function_exists('WC') && WC()->customer) {
                    if ('billing_phone' === $key) {
                        WC()->customer->set_billing_phone($value);
                    } else {
                        WC()->customer->set_shipping_phone($value);
                    }

                    $synced_customer = true;
                }
            }
        }

        if ($synced_customer && function_exists('WC') && WC()->customer) {
            // Persiste o objeto (sessão + user meta) para o próximo request não
            // voltar ao valor antigo.
            WC()->customer->save();
        }
    }

    /**
     * Processa o extension data de "usar mesmo endereço para faturamento"
     * e copia dados do shipping para billing quando ativo
     *
     * @param WC_Order $order
     * @param WP_REST_Request $request
     * @return void
     */
    private function process_shipping_as_billing_from_request($order, $request)
    {
        // Captura dos dados do request do Block Checkout
        $extensions = $request->get_param('extensions') ?? [];
        
        // Verifica o namespace dos dados de shipping as billing
        if (isset($extensions['woo_better_shipping_as_billing'])) {
            $billing_data = $extensions['woo_better_shipping_as_billing'];
            
            // Verifica se checkbox está marcado
            if (isset($billing_data['use_shipping_as_billing']) && 
                ($billing_data['use_shipping_as_billing'] === 'true' || $billing_data['use_shipping_as_billing'] === true)) {
                
                // Copia todos os campos do shipping para billing
                $shipping_fields = [
                    'first_name' => $order->get_shipping_first_name(),
                    'last_name' => $order->get_shipping_last_name(), 
                    'company' => $order->get_shipping_company(),
                    'address_1' => $order->get_shipping_address_1(),
                    'address_2' => $order->get_shipping_address_2(),
                    'city' => $order->get_shipping_city(),
                    'state' => $order->get_shipping_state(),
                    'postcode' => $order->get_shipping_postcode(),
                    'country' => $order->get_shipping_country()
                ];
                
                // Aplica os campos de shipping no billing
                foreach ($shipping_fields as $field => $value) {
                    if (!empty($value)) {
                        $setter_method = "set_billing_{$field}";
                        if (method_exists($order, $setter_method)) {
                            $order->$setter_method($value);
                        }
                    }
                }
                
                // Copia metadados customizados do plugin se existirem
                $custom_shipping_fields = [
                    '_shipping_number' => '_billing_number',
                    '_shipping_neighborhood' => '_billing_neighborhood'  
                ];
                
                foreach ($custom_shipping_fields as $shipping_meta => $billing_meta) {
                    $shipping_value = $order->get_meta($shipping_meta);
                    if (!empty($shipping_value)) {
                        $order->update_meta_data($billing_meta, $shipping_value);
                    }
                }

                // Espelha TELEFONE e CELULAR entre cobrança e entrega. O endereço já é
                // copiado acima, mas o telefone/celular ficavam de fora — com "usar o
                // mesmo endereço para cobrança" os dois números devem ser o MESMO.
                // Prefere o shipping (é o endereço exibido quando "shipping as
                // billing"); se ele estiver vazio, cai no billing — para nunca zerar.
                // Só quando o woo-better gerencia o telefone (no modo "Desabilitar" não mexe).
                if ($this->phone_mode_hides_native_option()) {
                    $this->mirror_same_address_phone(
                        $order,
                        array($order, 'set_billing_phone'),
                        array($order, 'set_shipping_phone'),
                        array($order, 'get_billing_phone'),
                        array($order, 'get_shipping_phone')
                    );
                    $this->mirror_same_address_phone(
                        $order,
                        function ($v) use ($order) { $order->update_meta_data('_billing_cellphone', $v); },
                        function ($v) use ($order) { $order->update_meta_data('_shipping_cellphone', $v); },
                        function () use ($order) { return (string) $order->get_meta('_billing_cellphone'); },
                        function () use ($order) { return (string) $order->get_meta('_shipping_cellphone'); }
                    );
                }

            }
        }
    }

    /**
     * Espelha um valor de telefone/celular entre cobrança e entrega quando o
     * cliente marca "usar o mesmo endereço para cobrança" (checkout em BLOCOS).
     *
     * Prefere o valor de SHIPPING (o endereço exibido no modo "shipping as
     * billing"); se estiver vazio, usa o de billing — para nunca zerar. Se ambos
     * estiverem vazios, não faz nada.
     *
     * @param \WC_Order $order
     * @param callable  $set_billing  Recebe o valor e grava no billing.
     * @param callable  $set_shipping Recebe o valor e grava no shipping.
     * @param callable  $get_billing  Retorna o valor do billing.
     * @param callable  $get_shipping Retorna o valor do shipping.
     * @return void
     */
    private function mirror_same_address_phone($order, $set_billing, $set_shipping, $get_billing, $get_shipping)
    {
        $shipping = trim((string) call_user_func($get_shipping));
        $billing  = trim((string) call_user_func($get_billing));

        if ('' !== $shipping) {
            call_user_func($set_billing, $shipping);
        } elseif ('' !== $billing) {
            call_user_func($set_shipping, $billing);
        }
    }

    /**
     * Desabilita erros de required para campos que não se aplicam ao contexto atual.
     *
     * Regras:
     * - Fora do Brasil, remove required de documento, bairro, IE e empresa.
     * - No Brasil, se o documento identificado for CPF, remove required de IE.
     * - No Brasil, se for CNPJ, mantém IE obrigatório.
     *
     * @param array     $data   Dados submetidos no checkout.
     * @param \WP_Error $errors Objeto de erros acumulados pelo WooCommerce.
     * @return void
     */
    public function lkn_disabled_require_field( $data, $errors ) {
        $billing_country = isset( $data['billing_country'] ) ? sanitize_text_field( (string) $data['billing_country'] ) : '';
        $billing_document = isset( $data['billing_document'] ) ? sanitize_text_field( (string) $data['billing_document'] ) : '';

        if ( empty( $billing_document ) ) {
            if ( ! empty( $data['billing_cpf'] ) ) {
                $billing_document = sanitize_text_field( (string) $data['billing_cpf'] );
            } elseif ( ! empty( $data['billing_cnpj'] ) ) {
                $billing_document = sanitize_text_field( (string) $data['billing_cnpj'] );
            }
        }

        $clean_document = preg_replace( '/[^0-9A-Z]/', '', strtoupper( $billing_document ) );
        $is_cpf = strlen( $clean_document ) === 11;

        // REASON: o campo "Empresa" só é controlado pelo plugin nos modos "dynamic"
        // (visível só com CNPJ) e "disabled" (não deve existir). Nos modos
        // "required"/"optional" a obrigatoriedade é do WooCommerce e não deve ser
        // desfeita por CPF/CNPJ nem por país.
        $company_behavior = get_option( 'woo_better_calc_company_field_behavior', 'dynamic' );
        $controls_company = in_array( $company_behavior, array( 'dynamic', 'disabled' ), true );

        // Modo "Desabilitado": o campo Empresa não deve existir, então nunca pode ser
        // exigido — independente do documento (CPF/CNPJ) e do país. Remove aqui para
        // cobrir o CNPJ, que não passa pelos ramos abaixo.
        if ( 'disabled' === $company_behavior ) {
            $errors->remove( 'billing_company_required' );
        }

        if ( 'BR' !== $billing_country ) {
            // Remover erros de campos obrigatórios que não se aplicam fora do Brasil.
            $errors->remove( 'billing_document_required' );
            $errors->remove( 'billing_cpf_required' );
            $errors->remove( 'billing_cnpj_required' );
            $errors->remove( 'billing_neighborhood_required' );
            $errors->remove( 'billing_ie_required' );
            $errors->remove( 'billing_im_required' );
            $errors->remove( 'billing_rg_required' );
            // Em modo "dynamic" o campo "Empresa" só existe no Brasil (depende do CNPJ),
            // então não deve ser exigido de clientes de outros países.
            if ( $controls_company ) {
                $errors->remove( 'billing_company_required' );
            }
            return;
        }

        // Se for CPF, IE e empresa não são obrigatórios.
        if ( $is_cpf ) {
            $errors->remove( 'billing_ie_required' );
            $errors->remove( 'billing_im_required' );
            if ( $controls_company ) {
                $errors->remove( 'billing_company_required' );
            }
        }

        // RG: é documento de pessoa FÍSICA — com CNPJ (ou documento incompleto) o
        // campo fica OCULTO no checkout, então o `required` do array de campos não
        // pode bloquear o pedido. Só age quando o recurso está ligado no woo-better
        // (com ele desligado, Brazilian/outro plugin segue no comando).
        if ( ! $is_cpf && $this->rg_field_enabled() ) {
            $errors->remove( 'billing_rg_required' );
        }
    }

    /**
     * Remove o aviso "Company is a required field" que o plugin
     * "Brazilian Market on WooCommerce" (woocommerce-extra-checkout-fields-for-brazil)
     * adiciona no checkout clássico/shortcode.
     *
     * O Brazilian força esse erro em valid_checkout_fields() (hook
     * woocommerce_checkout_process, prioridade 10) sempre que o documento identificado
     * for CNPJ, ignorando a configuração do woo-better. Como ele usa wc_add_notice()
     * diretamente, o aviso não passa pelo objeto $errors e não pode ser removido em
     * lkn_disabled_require_field().
     *
     * Este callback roda na prioridade 11 — depois do Brazilian (10) e ANTES de o
     * WooCommerce despejar os erros nativos do seu próprio $errors no session
     * (process_checkout) — removendo apenas o aviso exato do campo Empresa, sem tocar
     * em nenhum erro nativo do WooCommerce.
     *
     * Só age quando o woo-better gerencia os campos de pessoa
     * (woo_better_calc_person_type_select !== 'none') e o comportamento do campo
     * Empresa NÃO é "required" — ou seja, quando o próprio woo-better (modo Dinâmico)
     * ou o WooCommerce (modo Opcional) decide a obrigatoriedade. No modo "required" o
     * WooCommerce já exige o campo, então deixamos o aviso original passar.
     *
     * @return void
     */
    public function guard_brazilian_company_required() {
        if ( 'none' === get_option( 'woo_better_calc_person_type_select', 'none' ) ) {
            return;
        }

        if ( 'required' === get_option( 'woo_better_calc_company_field_behavior', 'dynamic' ) ) {
            return;
        }

        $this->remove_brazilian_required_notice( __( 'Company', 'woocommerce-extra-checkout-fields-for-brazil' ) );
    }

    /**
     * Remove da sessão o aviso "<campo> is a required field" gerado pelo plugin
     * "Brazilian Market on WooCommerce" (ele usa `wc_add_notice()`, então não pode
     * ser removido pelo objeto `$errors` de `lkn_disabled_require_field()`).
     *
     * O match é feito na mensagem EXATA do Brazilian (mesmo text domain), o que
     * funciona inclusive com o pt_BR traduzido.
     *
     * @param string $label Texto do campo exatamente como o Brazilian usa (ex.: 'RG').
     * @return void
     */
    private function remove_brazilian_required_notice( $label ) {
        if ( ! function_exists( 'WC' ) || ! WC()->session ) {
            return;
        }

        $notices = WC()->session->get( 'wc_notices', array() );
        if ( empty( $notices['error'] ) || ! is_array( $notices['error'] ) ) {
            return;
        }

        $required_notice = sprintf(
            '<strong>%s</strong> %s.',
            $label,
            __( 'is a required field', 'woocommerce-extra-checkout-fields-for-brazil' )
        );

        $changed = false;
        foreach ( $notices['error'] as $index => $notice ) {
            if ( isset( $notice['notice'] ) && trim( (string) $notice['notice'] ) === $required_notice ) {
                unset( $notices['error'][ $index ] );
                $changed = true;
            }
        }

        if ( $changed ) {
            $notices['error'] = array_values( $notices['error'] );
            WC()->session->set( 'wc_notices', $notices );
        }
    }

    /**
     * Remove a exigência de RG feita pelo plugin "Brazilian Market on WooCommerce"
     * quando a configuração do woo-better deve prevalecer.
     *
     * O Brazilian exige o RG (`wcbcf_settings['rg']`) sempre que o documento é CPF,
     * sem consultar a nossa opção "RG obrigatório". Como o woo-better tem precedência
     * quando o recurso está ligado, mantemos o aviso APENAS quando o RG é obrigatório
     * aqui E o documento é CPF (o único cenário em que o campo está visível).
     *
     * @return void
     */
    public function guard_brazilian_rg_required() {
        if ( ! $this->rg_field_enabled() ) {
            return;
        }

        if ( $this->rg_field_required() ) {
            $document = isset( $_POST['billing_document'] ) ? sanitize_text_field( wp_unslash( $_POST['billing_document'] ) ) : '';
            if ( '' === $document && ! empty( $_POST['billing_cpf'] ) ) {
                $document = sanitize_text_field( wp_unslash( $_POST['billing_cpf'] ) );
            }

            if ( 11 === strlen( $this->document_clean_value( $document ) ) ) {
                return;
            }
        }

        $this->remove_brazilian_required_notice( __( 'RG', 'woocommerce-extra-checkout-fields-for-brazil' ) );
    }

    /**
     * Desenfileira o script de front-end do plugin "Brazilian Market on WooCommerce"
     * no checkout clássico/shortcode.
     *
     * O JS desse plugin (assets/js/frontend/frontend.js) executa, no checkout, um
     * handleFields() que esconde TODOS os elementos .person-type-field sempre que o
     * tipo de pessoa é CPF — escondendo o campo Empresa nos modos Opcional e
     * Obrigatório — e, quando o tipo é CNPJ, re-adiciona 'validate-required' ao campo
     * Empresa (bloqueando o envio com Empresa vazia mesmo em modo Opcional). Como o
     * woo-better substitui os recursos do Brazilian no checkout, desenfileiramos o
     * script para que a visibilidade/obrigatoriedade sigam a configuração do
     * woo-better. A classe 'person-type-field' permanece no HTML para não afetar
     * outros consumidores.
     *
     * No checkout em blocos o Brazilian não enfileira esse script, então já é
     * controlado normalmente pelo woo-better.
     *
     * @return void
     */
    public function dequeue_brazilian_checkout_scripts() {
        // Só age quando o woo-better gerencia os campos de pessoa.
        if ( 'none' === get_option( 'woo_better_calc_person_type_select', 'none' ) ) {
            return;
        }

        // Desenfileira o script de front-end do Brazilian (se enfileirado).
        // Dequeue apenas do SCRIPT: o estilo (-front CSS) pode permanecer, pois só
        // oculta o texto "(opcional)" de alguns campos do próprio Brazilian — não do
        // campo Empresa.
        wp_dequeue_script( 'woocommerce-extra-checkout-fields-for-brazil-front' );
    }

    /**
     * Adiciona o campo "Celular" (billing) conforme o modo de telefone configurado.
     *
     * Presente apenas nos modos "Celular e Fixo" e "Somente Celular". O campo é um
     * `tel` simples, logo abaixo do bloco de telefone, e só recebe a obrigatoriedade
     * (sem máscara/DDI/validação). Não sobrescreve um campo já existente (ex.: o
     * "Brazilian Market on WooCommerce" com celular separado).
     *
     * @param  array $fields Campos de cobrança.
     * @return array         Campos de cobrança (com o campo de celular, se aplicável).
     */
    public function add_cellphone_billing_fields( $fields ) {
        return $this->maybe_add_cellphone_field( $fields, 'billing' );
    }

    /**
     * Idem ao billing, para o campo `shipping_cellphone`.
     *
     * @param  array $fields Campos de entrega.
     * @return array         Campos de entrega (com o campo de celular, se aplicável).
     */
    public function add_cellphone_shipping_fields( $fields ) {
        return $this->maybe_add_cellphone_field( $fields, 'shipping' );
    }

    /**
     * Adiciona o campo "Celular" (`*_cellphone`).
     *
     * - modo "Somente Celular": campo VISÍVEL (é o principal);
     * - modo "Celular e Fixo" com o "Campo de Celular" ligado: campo VISÍVEL;
     * - modo "Celular e Fixo" com o "Campo de Celular" desligado: campo ESCONDIDO
     *   (shim) para compatibilidade com plugins que esperam `billing_cellphone`.
     *
     * O campo é um `tel` simples (sem máscara/DDI/validação). A definição do
     * woo-better SOBREPÕE um `*_cellphone` já existente — inclusive o do plugin
     * "Brazilian Market on WooCommerce" (ver comentário no corpo). Assim, quando os
     * dois plugins competem pelo campo de celular, o woo-better vence. Não atua na
     * edição de endereço da conta.
     *
     * @param  array  $fields Campos.
     * @param  string $type   'billing' ou 'shipping'.
     * @return array          Campos.
     */
    private function maybe_add_cellphone_field( $fields, $type ) {
        $adds_visible = $this->phone_mode_adds_cellphone_field();
        $adds_shim    = $this->phone_mode_adds_cellphone_shim();

        if ( ! is_array( $fields ) || ( ! $adds_visible && ! $adds_shim ) ) {
            return $fields;
        }

        // Na edição de endereço da conta (minha-conta) só o SHIM ESCONDIDO é criado:
        // ali o `*_cellphone` é salvo como user meta e precisa acompanhar o telefone
        // (o espelho do servidor vive em save_edit_address_custom_fields e o JS de
        // espelho também roda nesta tela). O campo VISÍVEL não é criado aqui — não
        // queremos introduzir um campo editável novo na conta.
        if (
            function_exists( 'is_wc_endpoint_url' )
            && is_wc_endpoint_url( 'edit-address' )
            && ! $adds_shim
        ) {
            return $fields;
        }

        $key = $type . '_cellphone';

        // Precedência sobre o "Brazilian Market on WooCommerce": quando o woo-better
        // gera o campo de celular (VISÍVEL ou shim escondido), a SUA definição
        // prevalece mesmo que já exista um `*_cellphone`. O Brazilian registra o
        // campo dele em `woocommerce_billing_fields` (prioridade 10, ANTES da gente),
        // então sem esta sobreposição ele venceria no checkout clássico — o que não
        // queremos, já que ele está sem manutenção. Quando o woo-better NÃO gera
        // celular (modos "Somente Fixo"/"Desabilitar"), o retorno acima acontece e o
        // campo do Brazilian permanece: com o recurso desligado no woo-better, o
        // Brazilian manda. É o mesmo critério de precedência já aplicado a CPF/CNPJ,
        // Empresa, IE, Bairro e Número neste plugin.

        // Shim escondido (compatibilidade): campo oculto, sem obrigatoriedade.
        if ( $adds_shim ) {
            $fields[ $key ] = array(
                'type'              => 'hidden',
                'required'          => false,
                'custom_attributes' => array( self::CELLPHONE_FIELD_ATTR => '1' ),
            );

            return $fields;
        }

        // Campo visível. No modo "Somente Celular" o celular substitui o telefone,
        // então herda a obrigatoriedade do "Telefone (Contato) Obrigatório"; nos
        // demais vale a opção dedicada "Celular Obrigatório".
        $required = ( 'cellphone_only' === $this->get_phone_mode() )
            ? $this->is_phone_required()
            : $this->is_cellphone_required();

        $fields[ $key ] = array(
            'type'              => 'tel',
            'label'             => __( 'Celular', 'woo-better-shipping-calculator-for-brazil' ),
            'placeholder'       => $this->phone_field_placeholder(null, 'cellphone'),
            'required'          => $required,
            'class'             => array( 'form-row-wide' ),
            'priority'          => 93,
            'custom_attributes' => array( self::CELLPHONE_FIELD_ATTR => '1' ),
        );

        return $fields;
    }

    /**
     * Ajusta os dados postados do checkout conforme o modo de telefone.
     *
     * - "Somente Celular" (ou "Desabilitar" com o campo de celular ligado): o telefone
     *   nativo está oculto e o celular é o campo principal. O TELEFONE é deixado VAZIO
     *   (o número fica em `*_cellphone`); o recibo exibe o celular no lugar do telefone.
     * - "Celular e Fixo" com o "Campo de Celular" desligado (shim escondido): espelha
     *   o telefone unificado → `*_cellphone` (herança do Brazilian p/ NFe/PagBank).
     * - Demais modos: nada é alterado.
     *
     * @param  array $data Dados postados do checkout.
     * @return array       Dados postados.
     */
    public function handle_cellphone_posted_data( $data ) {
        if ( ! is_array( $data ) ) {
            return $data;
        }

        // "Somente Celular" (ou "Desabilitar" com o Campo de Celular ligado): o
        // telefone nativo não existe e o celular é o campo principal. O TELEFONE
        // fica VAZIO — o número é guardado na meta `*_cellphone` e o recibo exibe o
        // celular no lugar do telefone (format_order_*_phone). Não promovemos o
        // celular para `*_phone`.
        if ( $this->phone_mode_hides_native_field() && $this->phone_mode_adds_cellphone_field() ) {
            unset( $data['billing_phone'], $data['shipping_phone'] );

            return $data;
        }

        // "Celular e Fixo" com o campo de celular DESLIGADO (shim escondido): espelha o
        // telefone unificado → `*_cellphone` (herança do Brazilian p/ NFe/PagBank).
        if ( $this->phone_mode_adds_cellphone_shim() ) {
            $data = $this->mirror_one_cellphone( $data, 'billing' );
            $data = $this->mirror_one_cellphone( $data, 'shipping' );
        }

        return $data;
    }

    /**
     * Espelha o telefone unificado (`*_phone`) no campo de celular (`*_cellphone`),
     * normalizado. Usado no modo "Celular e Fixo" com o campo de celular escondido.
     *
     * Quando o checkout clássico tem o script de espelho (`...CellphoneMirrorShortcode`),
     * o `*_cellphone` já chega preenchido com o PRÓPRIO telefone (mesmo número, sem
     * normalizar) — nesse caso re-normalizamos. Um valor PRÓPRIO de outro plugin
     * (número diferente do telefone) é respeitado.
     *
     * @param  array  $data Dados postados.
     * @param  string $type 'billing' ou 'shipping'.
     * @return array       Dados postados.
     */
    private function mirror_one_cellphone( $data, $type ) {
        $phone_key = $type . '_phone';
        $cell_key  = $type . '_cellphone';

        if ( empty( $data[ $phone_key ] ) ) {
            return $data;
        }

        $country_code = isset( $data[ $type . '_phone_country' ] ) ? $data[ $type . '_phone_country' ] : '';

        // Só espelha quando o telefone é de fato um CELULAR (MOBILE). Um FIXO não
        // pode preencher o campo de celular — `mirror_phone_to_cellphone` devolve
        // '' para LIMPÁ-LO (o campo aceita fixo E celular, então a verificação
        // extra no envio é necessária).
        $mirrored = $this->mirror_phone_to_cellphone(
            sanitize_text_field( wp_unslash( $data[ $phone_key ] ) ),
            sanitize_text_field( wp_unslash( (string) $country_code ) )
        );

        // Se outro plugin já preencheu um celular PRÓPRIO (número diferente do
        // telefone), respeita. Se o valor presente é só o espelho do próprio
        // telefone (ex.: o script do checkout clássico copiou o telefone), segue
        // para gravá-lo na forma normalizada (ou limpar, se não for celular).
        if ( ! empty( $data[ $cell_key ] ) ) {
            $existing_digits = preg_replace( '/\D/', '', (string) $data[ $cell_key ] );
            $phone_digits    = preg_replace( '/\D/', '', (string) $data[ $phone_key ] );

            if ( $existing_digits !== $phone_digits ) {
                return $data;
            }
        }

        $data[ $cell_key ] = $mirrored;

        return $data;
    }

    /**
     * Verifica se o plugin oficial "Extra Checkout Fields For Brazil" está ativo
     * Compatível com multisite
     * 
     * @return bool
     */
    private function is_brazilian_plugin_active()
    {
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        $plugin_path = 'woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php';
        
        // Para multisite, verifica se está ativo na rede ou no site atual
        if (is_multisite()) {
            return is_plugin_active_for_network($plugin_path) || is_plugin_active($plugin_path);
        }
        
        return is_plugin_active($plugin_path);
    }

    /**
     * Converte tipo de pessoa numérico para letra (F/J)
     * 
     * @param int|string $type Tipo de pessoa (1 = physical/CPF, 2 = legal/CNPJ)
     * @return string F para física, J para jurídica, vazio se inválido
     */
    private function get_person_type_letter($type)
    {
        $person_type_config = get_option('woo_better_calc_person_type_select', 'none');
        
        // Se tipo de pessoa está desabilitado, retorna vazio
        if ($person_type_config === 'none') {
            return '';
        }
        
        $type_int = intval($type);
        
        switch ($person_type_config) {
            case 'both':
                // Para 'both', usar a lógica: 1 = F, 2 = J
                return $type_int === 2 ? 'J' : ($type_int === 1 ? 'F' : '');
            case 'physical':
                // Se configuração é só CPF, sempre F
                return 'F';
            case 'legal':
                // Se configuração é só CNPJ, sempre J
                return 'J';
            default:
                return '';
        }
    }

    /**
     * Remove formatação de números (CPF/CNPJ)
     * 
     * @param string $string Número formatado
     * @return string Número apenas com dígitos
     */
    private function format_number($string)
    {
        return str_replace(array('.', '-', '/'), '', $string);
    }

    /**
     * Adiciona campos extras na resposta da Legacy REST API para pedidos
     * 
     * @param array $order_data Dados do pedido
     * @param WC_Order $order Objeto do pedido
     * @param array $fields Filtros de campos
     * @param WC_API_Server $server Instância do servidor
     * @return array
     */
    public function legacy_orders_response($order_data, $order, $fields, $server)
    {
        // Billing fields
        $order_data['billing_address']['persontype']   = $this->get_person_type_letter($order->get_meta('_billing_persontype'));
        $order_data['billing_address']['cpf']          = $this->format_number($order->get_meta('_billing_cpf'));
        $order_data['billing_address']['cnpj']         = $this->format_number($order->get_meta('_billing_cnpj'));
        $order_data['billing_address']['ie']           = $order->get_meta('_billing_ie');
        $order_data['billing_address']['rg']           = $order->get_meta('_billing_rg');
        $order_data['billing_address']['number']       = $order->get_meta('_billing_number');
        $order_data['billing_address']['neighborhood'] = $order->get_meta('_billing_neighborhood');
        $order_data['billing_address']['birthdate']    = $order->get_meta('_billing_birthdate');
        $order_data['billing_address']['gender']       = $order->get_meta('_billing_gender');

        // Shipping fields
        $order_data['shipping_address']['number']       = $order->get_meta('_shipping_number');
        $order_data['shipping_address']['neighborhood'] = $order->get_meta('_shipping_neighborhood');

        // Customer fields (para pedidos de convidados)
        if (0 === intval($order->get_customer_id()) && isset($order_data['customer'])) {
            $order_data['customer']['billing_address']['persontype']   = $this->get_person_type_letter($order->get_meta('_billing_persontype'));
            $order_data['customer']['billing_address']['cpf']          = $this->format_number($order->get_meta('_billing_cpf'));
            $order_data['customer']['billing_address']['cnpj']         = $this->format_number($order->get_meta('_billing_cnpj'));
            $order_data['customer']['billing_address']['ie']           = $order->get_meta('_billing_ie');
            $order_data['customer']['billing_address']['rg']           = $order->get_meta('_billing_rg');
            $order_data['customer']['billing_address']['number']       = $order->get_meta('_billing_number');
            $order_data['customer']['billing_address']['neighborhood'] = $order->get_meta('_billing_neighborhood');
            $order_data['customer']['billing_address']['birthdate']    = $order->get_meta('_billing_birthdate');
            $order_data['customer']['billing_address']['gender']       = $order->get_meta('_billing_gender');

            $order_data['customer']['shipping_address']['number']       = $order->get_meta('_shipping_number');
            $order_data['customer']['shipping_address']['neighborhood'] = $order->get_meta('_shipping_neighborhood');
        }

        return $order_data;
    }

    /**
     * Adiciona campos extras na resposta da Legacy REST API para clientes
     * 
     * @param array $customer_data Dados do cliente
     * @param WC_Customer $customer Objeto do cliente
     * @param array $fields Filtros de campos
     * @param WC_API_Server $server Instância do servidor
     * @return array
     */
    public function legacy_customers_response($customer_data, $customer, $fields, $server)
    {
        // Billing fields
        $customer_data['billing_address']['persontype']   = $this->get_person_type_letter($customer->get_meta('billing_persontype'));
        $customer_data['billing_address']['cpf']          = $this->format_number($customer->get_meta('billing_cpf'));
        $customer_data['billing_address']['cnpj']         = $this->format_number($customer->get_meta('billing_cnpj'));
        $customer_data['billing_address']['ie']           = $customer->get_meta('billing_ie');
        $customer_data['billing_address']['rg']           = $customer->get_meta('billing_rg');
        $customer_data['billing_address']['number']       = $customer->get_meta('billing_number');
        $customer_data['billing_address']['neighborhood'] = $customer->get_meta('billing_neighborhood');
        $customer_data['billing_address']['birthdate']    = $customer->get_meta('billing_birthdate');
        $customer_data['billing_address']['gender']       = $customer->get_meta('billing_gender');

        // Shipping fields
        $customer_data['shipping_address']['number']       = $customer->get_meta('shipping_number');
        $customer_data['shipping_address']['neighborhood'] = $customer->get_meta('shipping_neighborhood');

        return $customer_data;
    }

    /**
     * Adiciona campos extras na resposta da REST API para clientes
     * 
     * @param WP_REST_Response $response Objeto da resposta
     * @param WP_User $user Objeto do usuário
     * @return WP_REST_Response
     */
    public function customers_response($response, $user)
    {
        $customer = new \WC_Customer($user->ID);

        // Billing fields
        $response->data['billing']['persontype']   = $this->get_person_type_letter($customer->get_meta('billing_persontype'));
        $response->data['billing']['cpf']          = $this->format_number($customer->get_meta('billing_cpf'));
        $response->data['billing']['cnpj']         = $this->format_number($customer->get_meta('billing_cnpj'));
        $response->data['billing']['ie']           = $customer->get_meta('billing_ie');
        $response->data['billing']['rg']           = $customer->get_meta('billing_rg');
        $response->data['billing']['number']       = $customer->get_meta('billing_number');
        $response->data['billing']['neighborhood'] = $customer->get_meta('billing_neighborhood');

        // Shipping fields
        $response->data['shipping']['number']       = $customer->get_meta('shipping_number');
        $response->data['shipping']['neighborhood'] = $customer->get_meta('shipping_neighborhood');

        return $response;
    }

    /**
     * Adiciona campos extras na resposta da REST API v1 para pedidos
     * 
     * @param WP_REST_Response $response Objeto da resposta
     * @param WP_Post $post Objeto do post
     * @return WP_REST_Response
     */
    public function orders_v1_response($response, $post)
    {
        $order = wc_get_order($post->ID);
        return $this->orders_response($response, $order);
    }

    /**
     * Adiciona campos extras na resposta da REST API para pedidos
     * 
     * Inclui também o campo 'cpf' do plugin Pagar.me caso disponível.
     * O plugin da Pagar.me com checkout de blocos salva o CPF no meta '_wc_billing/address/document'.
     * @author Hugo da Pequenaweb
     * @since 2025-12-29 (Adicionado suporte ao CPF do Pagar.me)
     * 
     * @param WP_REST_Response $response Objeto da resposta
     * @param WC_Order $order Objeto do pedido
     * @return WP_REST_Response
     */
    public function orders_response($response, $order)
    {
        // Billing fields
        $response->data['billing']['persontype']   = $this->get_person_type_letter($order->get_meta('_billing_persontype'));
        $response->data['billing']['cpf']          = $this->format_number($order->get_meta('_billing_cpf'));
        $response->data['billing']['cnpj']         = $this->format_number($order->get_meta('_billing_cnpj'));
        $response->data['billing']['ie']           = $order->get_meta('_billing_ie');
        $response->data['billing']['rg']           = $order->get_meta('_billing_rg');
        $response->data['billing']['number']       = $order->get_meta('_billing_number');
        $response->data['billing']['neighborhood'] = $order->get_meta('_billing_neighborhood');
        $response->data['billing']['birthdate']    = $order->get_meta('_billing_birthdate');
        $response->data['billing']['gender']       = $order->get_meta('_billing_gender');

        // Recupera o CPF armazenado pelo plugin Pagar.me no meta '_wc_billing/address/document'
        $cpf_pagarme = $order->get_meta('_wc_billing/address/document', true);
        
        // Se o CPF do Pagar.me existir e não houver CPF padrão, usa o CPF do Pagar.me
        if (!empty($cpf_pagarme) && empty($response->data['billing']['cpf'])) {
            // Formata o CPF para ficar apenas com números
            $cpf_numerico = preg_replace('/\D/', '', $cpf_pagarme);
            $response->data['billing']['cpf'] = $cpf_numerico;
        }

        // Shipping fields
        $response->data['shipping']['number']       = $order->get_meta('_shipping_number');
        $response->data['shipping']['neighborhood'] = $order->get_meta('_shipping_neighborhood');

        return $response;
    }

    /**
     * Verifica se o usuário tem permissão para gerenciar opções em multisite
     * 
     * @return bool
     * @since 4.7.0
     */
    private function user_can_manage_multisite_options()
    {
        if (is_multisite()) {
            // Para multisite, verifica se é super admin ou se tem permissão no site atual
            return is_super_admin() || current_user_can('manage_options');
        }
        
        return current_user_can('manage_options');
    }

    /**
     * Verifica se o WooCommerce está ativo no site atual (compatível com multisite)
     * 
     * @return bool
     * @since 4.7.0
     */
    private function is_woocommerce_active()
    {
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        $wc_path = 'woocommerce/woocommerce.php';
        
        if (is_multisite()) {
            // Para multisite, verifica se está ativo na rede ou no site atual
            return is_plugin_active_for_network($wc_path) || is_plugin_active($wc_path);
        }
        
        return is_plugin_active($wc_path);
    }

    /**
     * Obtém opção considerando configurações de rede em multisite
     * 
     * @param string $option_name Nome da opção
     * @param mixed $default Valor padrão
     * @param bool $network_option Se deve buscar como opção de rede
     * @return mixed
     * @since 4.7.0
     */
    private function get_multisite_option($option_name, $default = false, $network_option = false)
    {
        if (is_multisite() && $network_option) {
            return get_site_option($option_name, $default);
        }
        
        return get_option($option_name, $default);
    }

    /**
     * Atualiza opção considerando configurações de rede em multisite
     * 
     * @param string $option_name Nome da opção
     * @param mixed $value Valor da opção
     * @param bool $network_option Se deve salvar como opção de rede
     * @return bool
     * @since 4.7.0
     */
    private function update_multisite_option($option_name, $value, $network_option = false)
    {
        if (is_multisite() && $network_option) {
            return update_site_option($option_name, $value);
        }
        
        return update_option($option_name, $value);
    }

    /**
     * Remove opção considerando configurações de rede em multisite
     * 
     * @param string $option_name Nome da opção
     * @param bool $network_option Se deve remover como opção de rede
     * @return bool
     * @since 4.7.0
     */
    private function delete_multisite_option($option_name, $network_option = false)
    {
        if (is_multisite() && $network_option) {
            return delete_site_option($option_name);
        }
        
        return delete_option($option_name);
    }

    /**
     * Verifica se estamos no contexto correto para executar funcionalidades do WooCommerce
     * 
     * @return bool
     * @since 4.7.0
     */
    private function is_valid_woocommerce_context()
    {
        // Verifica se o WooCommerce está ativo
        if (!$this->is_woocommerce_active()) {
            return false;
        }

        // Verifica se a função WC() está disponível
        if (!function_exists('WC')) {
            return false;
        }

        // Se estiver em multisite, verifica se estamos em um blog válido
        if (is_multisite()) {
            global $blog_id;
            return !empty($blog_id) && $blog_id > 0;
        }

        return true;
    }

    /**
     * Indica se o woo-better gerencia a tela de perfil do usuário (ao menos um
     * recurso de campo ativo). Usado tanto para montar (add_customer_meta_fields)
     * quanto para salvar (save_customer_meta_fields_extra).
     *
     * @return bool
     */
    private function profile_manages_fields()
    {
        return (get_option('woo_better_calc_person_type_select', 'none') !== 'none')
            || (get_option('woo_better_calc_number_required', 'no') === 'yes')
            || (get_option('woo_better_calc_enable_neighborhood_field', 'no') === 'yes')
            || (get_option('woo_better_calc_enable_ie_field', 'no') === 'yes')
            || (get_option('woo_better_calc_enable_im_field', 'no') === 'yes')
            || (get_option('woo_better_calc_enable_rg_field', 'no') === 'yes')
            || (get_option('woo_better_calc_enable_birthdate_field', 'no') === 'yes')
            || (get_option('woo_better_calc_enable_gender_field', 'no') === 'yes');
    }

    /**
     * Campos personalizados nas seções de endereço de cobrança e entrega da página
     * de perfil do usuário (wp-admin/profile.php / user-edit.php).
     *
     * O woo-better ASSUME esta tela (roda na prioridade 99, após o plugin "Brazilian
     * Market on WooCommerce"): monta o documento unificado (CPF/CNPJ), IE/IM, número,
     * bairro, nascimento e gênero, além do Telefone/Celular em COBRANÇA E ENTREGA —
     * substituindo o array do Brazilian (que some com o telefone no bloco de entrega).
     * O RG (exclusivo do Brazilian) é preservado quando existe.
     *
     * Quando NENHUM recurso de campo do woo-better está ativo, não reestrutura a tela:
     * devolve os campos como estão (o Brazilian/nativo assume), respeitando a regra de
     * precedência "recurso desligado no woo-better → Brazilian manda".
     *
     * Exceção: com "Comportamento do Campo Empresa" = Desabilitado o campo Empresa é
     * removido da tela (cobrança e entrega) mesmo nesse caso — a lista do perfil é
     * hardcoded no WooCommerce e não consulta a option nativa, então é o plugin que
     * precisa garantir a coerência com o checkout. O dado existente no user meta é
     * preservado (nada é gravado quando o campo não é enviado).
     *
     * @param array $fields Array de campos do WooCommerce.
     * @return array
     */
    public function add_customer_meta_fields($fields)
    {
        if (!class_exists('\WC_Customer') || !is_array($fields)
            || !isset($fields['billing']['fields']) || !isset($fields['shipping']['fields'])) {
            return $fields;
        }

        // "Comportamento do Campo Empresa" = Desabilitado: o campo não deve existir.
        // No checkout isso é resolvido pela option nativa (fica em `hidden`, que faz o
        // WooCommerce parar de gerar o campo — clássico, blocos e edit-address). A lista
        // da tela de PERFIL, porém, é hardcoded em WC_Admin_Profile::get_customer_meta_fields()
        // e NÃO consulta essa option, então removemos aqui.
        //
        // Remover não apaga o dado: WC_Admin_Profile::save_customer_meta_fields() só grava
        // as chaves presentes no POST, e save_customer_meta_fields_extra() não mexe em company.
        $company_disabled = ('disabled' === get_option('woo_better_calc_company_field_behavior', 'dynamic'));

        if ($company_disabled) {
            unset($fields['billing']['fields']['billing_company']);
            unset($fields['shipping']['fields']['shipping_company']);
        }

        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $number_field = get_option('woo_better_calc_number_required', 'no');
        $neighborhood_field = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
        $birthdate_field = get_option('woo_better_calc_enable_birthdate_field', 'no');
        $gender_field = get_option('woo_better_calc_enable_gender_field', 'no');

        // Sem nenhum recurso de campo ativo, deixa a tela como está (Brazilian/nativo).
        if (!$this->profile_manages_fields()) {
            return $fields;
        }

        // Telefone/Celular seguem o "Comportamento do Campo de Telefone", espelhando o
        // admin do pedido (`ensure_admin_phone_fields`):
        //  - "Somente Celular": só o campo Celular (label "Celular");
        //  - "Celular e Fixo": telefone (principal) + Celular (secundário) — aparece
        //    SEMPRE que o plugin ARMAZENA a meta (inclui o modo shim, `enable_cellphone
        //    _field=no`), não só quando o campo é visível no checkout;
        //  - "Somente Fixo": só telefone;  "Desabilitar": nenhum.
        $phone_mode = $this->get_phone_mode();
        $shows_phone = ! in_array($phone_mode, array('cellphone_only', 'disabled'), true);
        $shows_cellphone = $this->phone_mode_stores_cellphone();
        $cellphone_label = ('cellphone_only' === $phone_mode)
            ? __('Celular', 'woo-better-shipping-calculator-for-brazil')
            : __('Celular (secundário)', 'woo-better-shipping-calculator-for-brazil');

        // Documento unificado (CPF/CNPJ) conforme "Tipo de Cliente".
        $document_label = __('CPF/CNPJ', 'woo-better-shipping-calculator-for-brazil');
        if ($person_type === 'physical') {
            $document_label = __('CPF', 'woo-better-shipping-calculator-for-brazil');
        } elseif ($person_type === 'legal') {
            $document_label = __('CNPJ', 'woo-better-shipping-calculator-for-brazil');
        }

        $incoming_billing = $fields['billing']['fields'];
        $incoming_shipping = $fields['shipping']['fields'];

        // Reaproveita o campo recebido (nativo/Brazilian) — preserva type/options, no
        // caso de País/Estado (select). Se não existir, cria um campo de texto padrão.
        $take = function ($source, $key, $label) {
            if (isset($source[$key])) {
                return $source[$key];
            }
            return array('label' => $label, 'description' => '');
        };

        // ── Cobrança ─────────────────────────────────────────────────────────
        $billing = array();
        $billing['billing_first_name'] = $take($incoming_billing, 'billing_first_name', __('Nome', 'woo-better-shipping-calculator-for-brazil'));
        $billing['billing_last_name']  = $take($incoming_billing, 'billing_last_name', __('Sobrenome', 'woo-better-shipping-calculator-for-brazil'));

        if ($person_type !== 'none') {
            $billing['billing_document'] = array('label' => $document_label, 'description' => '');
        }

        if ($this->rg_field_enabled()) {
            $billing['billing_rg'] = array('label' => __('RG', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }

        if (!$company_disabled && ($person_type === 'legal' || $person_type === 'both' || isset($incoming_billing['billing_company']))) {
            $billing['billing_company'] = $take($incoming_billing, 'billing_company', __('Empresa', 'woo-better-shipping-calculator-for-brazil'));
        }

        if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $billing['billing_ie'] = array('label' => __('Inscrição Estadual (IE)', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }

        if ($im_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $billing['billing_im'] = array('label' => __('Inscrição Municipal (IM)', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }

        // RG: com o recurso desligado no woo-better, preserva o campo do Brazilian
        // (mesmo meta `billing_rg`) para não perder o dado na tela de perfil.
        if (!$this->rg_field_enabled() && isset($incoming_billing['billing_rg'])) {
            $billing['billing_rg'] = $incoming_billing['billing_rg'];
        }

        if ($birthdate_field === 'yes') {
            $billing['billing_birthdate'] = array('label' => __('Data de Nascimento', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }

        if ($gender_field === 'yes') {
            $billing['billing_gender'] = array(
                'label'       => __('Gênero', 'woo-better-shipping-calculator-for-brazil'),
                'type'        => 'select',
                'options'     => array(
                    '' => __('Selecione...', 'woo-better-shipping-calculator-for-brazil'),
                    __('Masculino', 'woo-better-shipping-calculator-for-brazil')      => __('Masculino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Feminino', 'woo-better-shipping-calculator-for-brazil')       => __('Feminino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Não-binário', 'woo-better-shipping-calculator-for-brazil')    => __('Não-binário', 'woo-better-shipping-calculator-for-brazil'),
                    __('Outro', 'woo-better-shipping-calculator-for-brazil')          => __('Outro', 'woo-better-shipping-calculator-for-brazil'),
                    __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil') => __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil'),
                ),
                'description' => '',
            );
        }

        $billing['billing_address_1'] = $take($incoming_billing, 'billing_address_1', __('Endereço', 'woo-better-shipping-calculator-for-brazil'));
        if ($number_field === 'yes') {
            $billing['billing_number'] = array('label' => __('Número', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }
        $billing['billing_address_2'] = $take($incoming_billing, 'billing_address_2', __('Complemento', 'woo-better-shipping-calculator-for-brazil'));
        if ($neighborhood_field === 'yes') {
            $billing['billing_neighborhood'] = array('label' => __('Bairro', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }
        $billing['billing_city']     = $take($incoming_billing, 'billing_city', __('Cidade', 'woo-better-shipping-calculator-for-brazil'));
        $billing['billing_postcode'] = $take($incoming_billing, 'billing_postcode', __('CEP', 'woo-better-shipping-calculator-for-brazil'));
        $billing['billing_country']  = $take($incoming_billing, 'billing_country', __('País', 'woo-better-shipping-calculator-for-brazil'));
        $billing['billing_state']    = $take($incoming_billing, 'billing_state', __('Estado', 'woo-better-shipping-calculator-for-brazil'));
        $billing['billing_email']    = $take($incoming_billing, 'billing_email', __('Endereço de e-mail', 'woo-better-shipping-calculator-for-brazil'));
        if ($shows_phone) {
            $billing['billing_phone'] = array('label' => $this->get_phone_field_label(), 'description' => '');
        } elseif ('disabled' === $phone_mode && isset($incoming_billing['billing_phone'])) {
            // Modo "Desabilitar": preserva o campo nativo do telefone intacto.
            $billing['billing_phone'] = $incoming_billing['billing_phone'];
        }
        if ($shows_cellphone) {
            $billing['billing_cellphone'] = array('label' => $cellphone_label, 'description' => '');
        }

        $fields['billing']['fields'] = $billing;

        // ── Entrega ──────────────────────────────────────────────────────────
        $shipping = array();
        // Botão nativo "Copiar do endereço de cobrança" (quando presente).
        if (isset($incoming_shipping['copy_billing'])) {
            $shipping['copy_billing'] = $incoming_shipping['copy_billing'];
        }
        $shipping['shipping_first_name'] = $take($incoming_shipping, 'shipping_first_name', __('Nome', 'woo-better-shipping-calculator-for-brazil'));
        $shipping['shipping_last_name']  = $take($incoming_shipping, 'shipping_last_name', __('Sobrenome', 'woo-better-shipping-calculator-for-brazil'));
        if (!$company_disabled) {
            $shipping['shipping_company'] = $take($incoming_shipping, 'shipping_company', __('Empresa', 'woo-better-shipping-calculator-for-brazil'));
        }
        $shipping['shipping_address_1']  = $take($incoming_shipping, 'shipping_address_1', __('Endereço', 'woo-better-shipping-calculator-for-brazil'));
        if ($number_field === 'yes') {
            $shipping['shipping_number'] = array('label' => __('Número', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }
        $shipping['shipping_address_2'] = $take($incoming_shipping, 'shipping_address_2', __('Complemento', 'woo-better-shipping-calculator-for-brazil'));
        if ($neighborhood_field === 'yes') {
            $shipping['shipping_neighborhood'] = array('label' => __('Bairro', 'woo-better-shipping-calculator-for-brazil'), 'description' => '');
        }
        $shipping['shipping_city']     = $take($incoming_shipping, 'shipping_city', __('Cidade', 'woo-better-shipping-calculator-for-brazil'));
        $shipping['shipping_postcode'] = $take($incoming_shipping, 'shipping_postcode', __('CEP', 'woo-better-shipping-calculator-for-brazil'));
        $shipping['shipping_country']  = $take($incoming_shipping, 'shipping_country', __('País', 'woo-better-shipping-calculator-for-brazil'));
        $shipping['shipping_state']    = $take($incoming_shipping, 'shipping_state', __('Estado', 'woo-better-shipping-calculator-for-brazil'));
        if ($shows_phone) {
            $shipping['shipping_phone'] = array('label' => $this->get_phone_field_label(), 'description' => '');
        } elseif ('disabled' === $phone_mode && isset($incoming_shipping['shipping_phone'])) {
            // Modo "Desabilitar": preserva o campo nativo do telefone intacto.
            $shipping['shipping_phone'] = $incoming_shipping['shipping_phone'];
        }
        if ($shows_cellphone) {
            $shipping['shipping_cellphone'] = array('label' => $cellphone_label, 'description' => '');
        }

        $fields['shipping']['fields'] = $shipping;

        return $fields;
    }

    /**
     * Salva e normaliza os campos do woo-better na página de perfil do usuário.
     *
     * Roda DEPOIS do WooCommerce (prioridade 20 em personal_options_update /
     * edit_user_profile_update), que salva os campos nativos na prioridade 10:
     *   - divide o documento unificado (billing_document) em CPF/CNPJ/persontype;
     *   - grava os telefones no formato E.164 (+55 + dígitos), removendo a máscara;
     *   - normaliza IE/IM em maiúsculas.
     *
     * @param int $user_id
     * @return void
     */
    public function save_customer_meta_fields_extra($user_id)
    {
        if (! $user_id) {
            return;
        }

        // Só age quando o woo-better gerencia a tela de perfil. Caso contrário
        // (nem um recurso ativo), o Brazilian/nativo controla — não mexe nos metas.
        if (! $this->profile_manages_fields()) {
            return;
        }

        // 1. Documento unificado -> billing_cpf / billing_cnpj / billing_persontype.
        if (isset($_POST['billing_document'])) {
            $document = sanitize_text_field(wp_unslash($_POST['billing_document']));
            $clean = preg_replace('/[^0-9A-Z]/', '', strtoupper($document));

            if (strlen($clean) === 11) {
                update_user_meta($user_id, 'billing_persontype', '1');
                update_user_meta($user_id, 'billing_cpf', $document);
                update_user_meta($user_id, 'billing_cnpj', '');
            } elseif (strlen($clean) === 14) {
                update_user_meta($user_id, 'billing_persontype', '2');
                update_user_meta($user_id, 'billing_cnpj', $document);
                update_user_meta($user_id, 'billing_cpf', '');
            } elseif ('' === $clean) {
                // Campo esvaziado: limpa os campos derivados.
                update_user_meta($user_id, 'billing_persontype', '');
                update_user_meta($user_id, 'billing_cpf', '');
                update_user_meta($user_id, 'billing_cnpj', '');
            }
            // Valor inválido (nem 11 nem 14 dígitos): NÃO apaga o que já existe —
            // espelha o save_edit_address_custom_fields (evita destruir dado válido
            // com um valor digitado pela metade).

            update_user_meta($user_id, 'billing_document', $document);
        }

        // 2. Telefone NATIVO -> E.164 (+55 + dígitos), sem máscara/espaços.
        // Só quando o woo-better gerencia o telefone (no modo "Desabilitar" o plugin
        // não reformata o telefone nativo do perfil; o valor é preservado como enviado).
        if ($this->phone_mode_hides_native_option()) {
            foreach (array('billing_phone', 'shipping_phone') as $key) {
                if (! isset($_POST[$key])) {
                    continue;
                }

                $raw = sanitize_text_field(wp_unslash($_POST[$key]));
                if ('' === trim($raw)) {
                    update_user_meta($user_id, $key, '');
                    continue;
                }

                $normalized = $this->format_complete_phone($raw, '+55');
                update_user_meta($user_id, $key, '' !== $normalized ? $normalized : $raw);
            }
        }

        // 2a. Celular (meta `billing_cellphone`/`shipping_cellphone`) -> E.164.
        // É campo do PRÓPRIO plugin: normalizado sempre que o plugin ARMAZENA a meta
        // (inclusive no modo "Desabilitar" + "Campo de Celular", onde o campo é separado).
        // O DDI só entra quando o celular é o principal (Somente Celular) ou o espelho
        // oculto (shim); no "Campo de Celular" VISÍVEL fica sem o `+55`.
        if ($this->phone_mode_stores_cellphone()) {
            $cellphone_cc = $this->cellphone_meta_uses_ddi() ? '+55' : '';
            foreach (array('billing_cellphone', 'shipping_cellphone') as $key) {
                if (! isset($_POST[$key])) {
                    continue;
                }

                $raw = sanitize_text_field(wp_unslash($_POST[$key]));
                if ('' === trim($raw)) {
                    update_user_meta($user_id, $key, '');
                    continue;
                }

                $normalized = $this->format_complete_phone($raw, $cellphone_cc);
                update_user_meta($user_id, $key, '' !== $normalized ? $normalized : $raw);
            }
        }

        // 2b. Shim ("Celular Oculto"): o `*_cellphone` ESPELHA o telefone, mas o
        // campo de telefone aceita fixo E celular. Só grava o celular quando o
        // telefone é de fato um CELULAR (MOBILE); um fixo LIMPA o campo, deixando
        // apenas números de celular na meta (evita gateway/NFe receber fixo).
        if ($this->phone_mode_adds_cellphone_shim()) {
            foreach (array('billing', 'shipping') as $type) {
                $phone_key = $type . '_phone';
                if (! isset($_POST[$phone_key])) {
                    continue;
                }
                $mirrored = $this->mirror_phone_to_cellphone(
                    sanitize_text_field(wp_unslash($_POST[$phone_key])),
                    '+55'
                );
                update_user_meta($user_id, $type . '_cellphone', $mirrored);
            }
        }

        // 3. IE/IM e RG em maiúsculas (consistente com o checkout).
        foreach (array('billing_ie', 'billing_im') as $key) {
            if (isset($_POST[$key])) {
                update_user_meta($user_id, $key, strtoupper(sanitize_text_field(wp_unslash($_POST[$key]))));
            }
        }

        // 3b. RG (mesmo normalize do checkout: maiúsculas, sem símbolos estranhos).
        if ($this->rg_field_enabled() && isset($_POST['billing_rg'])) {
            update_user_meta($user_id, 'billing_rg', $this->sanitize_rg_value(wp_unslash($_POST['billing_rg'])));
        }
    }

    /**
     * Adiciona campos personalizados na página de edição de endereço de cobrança
     *
     * @param array $fields
     * @return array
     */
    public function add_edit_address_billing_fields($fields)
    {
        // Só adiciona campos se o país for Brasil
        $billing_country_value = '';
        if (isset($fields['billing_country'])) {
            if (isset($fields['billing_country']['value'])) {
                $billing_country_value = $fields['billing_country']['value'];
            } elseif (is_string($fields['billing_country'])) {
                $billing_country_value = $fields['billing_country'];
            }
        }
        
        if ($billing_country_value !== 'BR') {
            // Se não há valor ainda, verifica se o usuário tem BR como padrão
            $customer_country = WC()->customer ? WC()->customer->get_billing_country() : '';
            if ($customer_country !== 'BR') {
                return $fields;
            }
        }
        
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        $email_highlight_shortcode = get_option('woo_better_calc_email_field_position_shortcode', 'no');
        $phone_highlight = $this->is_phone_highlight() ? 'yes' : 'no';
        $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
        $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
        
        // Aplicar prioridades de campos conforme configurações
        if($email_highlight_shortcode === 'yes') {
            if (isset($fields['billing_email'])) {
                $fields['billing_email']['priority'] = 1;
            }
        }

        if ($phone_highlight === 'yes') {
            if (isset($fields['billing_phone'])) {
                $fields['billing_phone']['priority'] = 2;
            }
        } 

        // Campos de pessoa física e jurídica - PRIMEIRO para evitar conflitos
        if ($person_type !== 'none') {
            // Dar prioridade máxima ao campo de país quando person_type está habilitado
            if (isset($fields['billing_country'])) {
                $fields['billing_country']['priority'] = 3;
            }
        }
        
        // Contato (telefone/celular) — espelha o checkout clássico.
        $phone_priority = ($phone_highlight === 'yes') ? 2 : 90;

        if ( 'cellphone_only' === $this->get_phone_mode() ) {
            // "Somente Celular": o "Celular" é o campo principal (substitui o telefone).
            unset( $fields['billing_phone'] );
        }

        // "Celular" VISÍVEL: campo principal no modo "Somente Celular"; nos demais
        // (inclusive "Desabilitar" + "Campo de Celular") é um campo SEPARADO e básico
        // (sem máscara/DDI), posicionado no FIM do formulário.
        if ( $this->phone_mode_adds_cellphone_field() ) {
            $is_main_cellphone = ( 'cellphone_only' === $this->get_phone_mode() );
            $fields['billing_cellphone'] = array(
                'label'             => __( 'Celular', 'woo-better-shipping-calculator-for-brazil' ),
                'placeholder'       => $this->phone_field_placeholder(null, 'cellphone'),
                'required'          => $is_main_cellphone ? ( $phone_required === 'yes' ) : $this->is_cellphone_required(),
                'class'             => array( 'form-row-wide' ),
                'priority'          => $is_main_cellphone ? $phone_priority : 200,
                'type'              => 'tel',
                'custom_attributes' => array( self::CELLPHONE_FIELD_ATTR => '1' ),
            );
        }

        // Telefone nativo (principal) — quando o plugin GERENCIA o telefone e ele NÃO
        // foi substituído pelo "Celular" (modo "Somente Celular"). Espelha o checkout:
        // aparece mesmo quando NÃO é obrigatório (a obrigatoriedade segue "Telefone
        // (Contato) Obrigatório").
        if ( $this->phone_mode_hides_native_option() && 'cellphone_only' !== $this->get_phone_mode() ) {
            if (! isset($fields['billing_phone_country'])) {
                $fields['billing_phone_country'] = array(
                    'type'     => 'hidden',
                    'class'    => array('woo-better-hidden-field'),
                    'default'  => '+55',
                    'required' => false,
                );
            }

            if (isset($fields['billing_phone'])) {
                $fields['billing_phone']['label']    = $this->get_phone_field_label();
                $fields['billing_phone']['required'] = ($phone_required === 'yes');
                if ($this->is_phone_brazil_mask_active()) {
                    $fields['billing_phone']['placeholder'] = $this->phone_field_placeholder();
                }
            } else {
                $fields['billing_phone'] = array(
                    'label'       => $this->get_phone_field_label(),
                    'placeholder' => $this->phone_field_placeholder(),
                    'required'    => ($phone_required === 'yes'),
                    'class'       => array('form-row-wide'),
                    'priority'    => $phone_priority,
                    'type'        => 'tel',
                    'validate'    => array('phone')
                );
            }
        }
        
        // Adicionar campos de tipo de pessoa
        if ($person_type !== 'none') {
            // Campo unificado CPF/CNPJ
            $label_text = __('CPF/CNPJ', 'woo-better-shipping-calculator-for-brazil');
            $placeholder_text = __('Digite seu CPF ou CNPJ', 'woo-better-shipping-calculator-for-brazil');
            
            if ($person_type === 'physical') {
                $label_text = __('CPF', 'woo-better-shipping-calculator-for-brazil');
                $placeholder_text = __('000.000.000-00', 'woo-better-shipping-calculator-for-brazil');
            } elseif ($person_type === 'legal') {
                $label_text = __('CNPJ', 'woo-better-shipping-calculator-for-brazil');
                $placeholder_text = __('00.000.000/0000-00', 'woo-better-shipping-calculator-for-brazil');
            }
            
            $fields['billing_document'] = array(
                'label'       => $label_text,
                'placeholder' => $placeholder_text,
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 27,
                'type'        => 'text',
                'autocomplete' => 'off'
            );
            
            // Campo empresa para pessoa jurídica
            if ($person_type === 'legal' || $person_type === 'both') {
                // REASON: espelha o comportamento do IE. No modo "dynamic" o campo
                // nasce obrigatório (required => true) e a obrigação é removida no
                // submit quando o documento é CPF (ver disable_ie_required_on_edit_address_submit).
                // Nos modos "required"/"optional" respeitamos a configuração do lojista.
                // No modo "disabled" o campo não é criado (se outro plugin já o tiver
                // adicionado, ele fica opcional).
                $company_behavior = get_option('woo_better_calc_company_field_behavior', 'dynamic');

                if ('disabled' === $company_behavior) {
                    if (isset($fields['billing_company'])) {
                        $fields['billing_company']['required'] = false;
                    }
                } else {
                    $company_required = ($company_behavior === 'required' || $company_behavior === 'dynamic');

                    $fields['billing_company'] = array(
                        'label'       => __('Empresa', 'woo-better-shipping-calculator-for-brazil'),
                        'placeholder' => __('Nome da empresa', 'woo-better-shipping-calculator-for-brazil'),
                        'required'    => $company_required,
                        'class'       => array('form-row-wide'),
                        'priority'    => 28,
                        'type'        => 'text'
                    );
                }
            }
            
            // Campos hidden para compatibilidade
            $fields['billing_persontype'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 29
            );
            
            $fields['billing_cpf'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 30
            );
            
            $fields['billing_cnpj'] = array(
                'type'        => 'hidden',
                'required'    => false,
                'priority'    => 31
            );
        }
        
        // Campo de Inscrição Estadual (IE) - somente para Pessoa Jurídica
        $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
        if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $billing_ie_value = get_user_meta(get_current_user_id(), 'billing_ie', true);
            $fields['billing_ie'] = array(
                'label'       => __('Inscrição Estadual (IE)', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite a IE ou marque Isento', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide', 'woo-better-ie-field'),
                'priority'    => 32,
                'type'        => 'text',
                'value'       => $billing_ie_value,
                'custom_attributes' => array(
                    'maxlength' => '14',
                    'data-ie-field' => '1'
                )
            );
        }

        // Campo de Inscrição Municipal (IM) - somente para Pessoa Jurídica
        $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
        if ($im_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
            $billing_im_value = get_user_meta(get_current_user_id(), 'billing_im', true);
            $fields['billing_im'] = array(
                'label'       => __('Inscrição Municipal (IM)', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite a Inscrição Municipal (IM)', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide', 'woo-better-im-field'),
                'priority'    => 33,
                'type'        => 'text',
                'value'       => $billing_im_value,
                'custom_attributes' => array(
                    'maxlength' => '15',
                    'data-im-field' => '1'
                )
            );
        }

        // Campo de RG - somente para Pessoa Física (vinculado ao CPF).
        // Prioridade calculada (ver rg_field_priority): no edit-address a Empresa
        // ocupa 28, então o slot livre do RG é diferente do checkout clássico.
        if ($this->rg_field_enabled()) {
            $billing_rg_value = get_user_meta(get_current_user_id(), 'billing_rg', true);
            $fields['billing_rg'] = array(
                'label'       => __('RG', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Digite o RG', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => $this->rg_field_required(),
                'class'       => array('form-row-wide', 'woo-better-rg-field'),
                'priority'    => $this->rg_field_priority($fields),
                'type'        => 'text',
                'value'       => $billing_rg_value ? $this->sanitize_rg_value($billing_rg_value) : '',
                'custom_attributes' => array(
                    'maxlength' => '20',
                    'data-rg-field' => '1'
                )
            );
        }
        
        // Campo de data de nascimento
        if ($birthdate_enabled === 'yes') {
            $fields['billing_birthdate'] = array(
                'label'       => __('Data de Nascimento', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('DD/MM/AAAA', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => get_option('woo_better_calc_birthdate_required', 'yes') === 'yes',
                'class'       => array('form-row-wide'),
                'priority'    => 25,
                'type'        => 'date'
            );
        }
        
        // Campo de gênero
        if ($gender_enabled === 'yes') {
            $fields['billing_gender'] = array(
                'label'       => __('Gênero', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => false,
                'class'       => array('form-row-wide'),
                'priority'    => 26,
                'type'        => 'select',
                'options'     => array(
                    ''                                                    => __('Selecione...', 'woo-better-shipping-calculator-for-brazil'),
                    __('Masculino', 'woo-better-shipping-calculator-for-brazil')      => __('Masculino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Feminino', 'woo-better-shipping-calculator-for-brazil')       => __('Feminino', 'woo-better-shipping-calculator-for-brazil'),
                    __('Não-binário', 'woo-better-shipping-calculator-for-brazil')    => __('Não-binário', 'woo-better-shipping-calculator-for-brazil'),
                    __('Outro', 'woo-better-shipping-calculator-for-brazil')          => __('Outro', 'woo-better-shipping-calculator-for-brazil'),
                    __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil') => __('Prefiro não dizer', 'woo-better-shipping-calculator-for-brazil'),
                )
            );
        }
        
        // Campo de bairro
        if ($neighborhood_enabled === 'yes') {
            $fields['billing_neighborhood'] = array(
                'label'       => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Nome do bairro', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => ($number_enabled === 'yes'), // Obrigatório se número for obrigatório
                'class'       => array('form-row-wide'),
                'priority'    => 69
            );
        }
        
        // Campo de número
        if ($number_enabled === 'yes') {
            $fields['billing_number'] = array(
                'label'       => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Ex: 123a', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 56
            );

        }
        
        // Verificar se auto-preenchimento de CEP está habilitado
        $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
        $fill_checkout_address = get_option('woo_better_calc_enable_auto_address_fill', 'no');

        // Reposicionamento do CEP quando cep_position estiver ativo
        if ($cep_position === 'yes' && isset($fields['billing_postcode'])) {
            $fields['billing_postcode']['priority'] = 34;
        }

        if ($cep_position === 'yes' && $fill_checkout_address === 'yes') {
            // Adicionar checkbox para auto-preenchimento de CEP
            $fields['wc_better_calc_checkbox_billing'] = array(
                'type'        => 'checkbox',
                'label'       => __('Informe acima o código postal (CEP).', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => false,
                'class'       => array('form-row-wide'),
                'priority'    => 35,
                'id'          => 'wc_better_calc_checkbox_billing'
            );
        }
        
        return $fields;
    }

    /**
     * Remove a obrigatoriedade da IE no envio da página "editar endereço"
     * quando o documento enviado é um CPF.
     *
     * O WooCommerce valida campos obrigatórios em WC_Form_Handler::save_address
     * lendo `required` do array retornado por `woocommerce_billing_fields`.
     * Como esse filtro roda novamente durante o save (com prioridade menor que
     * este), só ajustamos o required aqui quando é um POST de edição de endereço.
     *
     * @param array $fields
     * @return array
     */
    public function disable_ie_required_on_edit_address_submit($fields)
    {
        // Apenas no submit do formulário "editar endereço" da Minha Conta.
        if (! isset($_POST['action']) || 'edit_address' !== $_POST['action']) {
            return $fields;
        }

        $document = isset($_POST['billing_document']) ? sanitize_text_field(wp_unslash($_POST['billing_document'])) : '';
        $clean_document = preg_replace('/[^0-9A-Z]/', '', strtoupper($document));
        $is_cpf_document = strlen($clean_document) === 11;

        // REASON: IE é obrigatória apenas para CNPJ. Se o documento é CPF,
        // remove o required para o WC_Form_Handler::save_address não acusar
        // "Inscrição Estadual (IE) é um campo obrigatório.".
        if ($is_cpf_document) {
            if (isset($fields['billing_ie'])) {
                $fields['billing_ie']['required'] = false;
            }

            // A IM (como o IE) só é obrigatória para CNPJ.
            if (isset($fields['billing_im'])) {
                $fields['billing_im']['required'] = false;
            }

            // Empresa no modo "dynamic" também é obrigatória apenas para CNPJ.
            // Nos modos "required"/"optional" a decisão do lojista é preservada.
            // No modo "disabled" o campo nunca é obrigatório.
            $company_behavior = get_option('woo_better_calc_company_field_behavior', 'dynamic');
            if (in_array($company_behavior, array('dynamic', 'disabled'), true) && isset($fields['billing_company'])) {
                $fields['billing_company']['required'] = false;
            }
        } elseif ($this->rg_field_enabled() && isset($fields['billing_rg'])) {
            // RG é o INVERSO do IE/IM: só existe para CPF. Com CNPJ o campo fica
            // oculto no formulário, então não pode ser exigido no save do endereço.
            $fields['billing_rg']['required'] = false;
        }

        return $fields;
    }

    /**
     * Adiciona campos personalizados na página de edição de endereço de entrega
     *
     * @param array $fields
     * @return array
     */
    public function add_edit_address_shipping_fields($fields)
    {
        // Só adiciona campos se o país for Brasil
        $shipping_country_value = '';
        if (isset($fields['shipping_country'])) {
            if (isset($fields['shipping_country']['value'])) {
                $shipping_country_value = $fields['shipping_country']['value'];
            } elseif (is_string($fields['shipping_country'])) {
                $shipping_country_value = $fields['shipping_country'];
            }
        }
        
        if ($shipping_country_value !== 'BR') {
            // Se não há valor ainda, verifica se o usuário tem BR como padrão
            $customer_country = WC()->customer ? WC()->customer->get_shipping_country() : '';
            if ($customer_country !== 'BR') {
                return $fields;
            }
        }
        
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $email_highlight_shortcode = get_option('woo_better_calc_email_field_position_shortcode', 'no');
        $phone_highlight = $this->is_phone_highlight() ? 'yes' : 'no';
        
        // Aplicar prioridades de campos conforme configurações
        if($email_highlight_shortcode === 'yes') {
            if (isset($fields['shipping_email'])) {
                $fields['shipping_email']['priority'] = 1;
            }
        }

        if ($phone_highlight === 'yes') {
            if (isset($fields['shipping_phone'])) {
                $fields['shipping_phone']['priority'] = 2;
            }
        } 

        // Campos de pessoa física e jurídica - PRIMEIRO para evitar conflitos
        if ($person_type !== 'none') {
            // Dar prioridade máxima ao campo de país quando person_type está habilitado
            if (isset($fields['shipping_country'])) {
                $fields['shipping_country']['priority'] = 3;
            }
        }
        
        // Campo empresa para pessoa jurídica (se configuração permitir).
        // No modo "disabled" o campo não é criado: se outro plugin já o tiver
        // adicionado, fica opcional (nunca obrigatório).
        if ($person_type === 'legal' || $person_type === 'both') {
            $company_behavior = get_option('woo_better_calc_company_field_behavior', 'dynamic');

            if ('disabled' === $company_behavior) {
                if (isset($fields['shipping_company'])) {
                    $fields['shipping_company']['required'] = false;
                }
            } else {
                $fields['shipping_company'] = array(
                    'label'       => __('Empresa', 'woo-better-shipping-calculator-for-brazil'),
                    'placeholder' => __('Nome da empresa', 'woo-better-shipping-calculator-for-brazil'),
                    'required'    => false,
                    'class'       => array('form-row-wide'),
                    'priority'    => 27,
                    'type'        => 'text'
                );
            }
        }
        
        // Contato (telefone/celular) — espelha o checkout clássico.
        $phone_priority = ($phone_highlight === 'yes') ? 2 : 90;

        if ( 'cellphone_only' === $this->get_phone_mode() ) {
            unset( $fields['shipping_phone'] );
        }

        if ( $this->phone_mode_adds_cellphone_field() ) {
            $is_main_cellphone = ( 'cellphone_only' === $this->get_phone_mode() );
            $fields['shipping_cellphone'] = array(
                'label'             => __( 'Celular', 'woo-better-shipping-calculator-for-brazil' ),
                'placeholder'       => $this->phone_field_placeholder(null, 'cellphone'),
                'required'          => $is_main_cellphone ? ( $phone_required === 'yes' ) : $this->is_cellphone_required(),
                'class'             => array( 'form-row-wide' ),
                'priority'          => $is_main_cellphone ? $phone_priority : 200,
                'type'              => 'tel',
                'custom_attributes' => array( self::CELLPHONE_FIELD_ATTR => '1' ),
            );
        }

        // Telefone nativo (principal) — quando o plugin gerencia e não foi substituído
        // pelo "Celular" (modo "Somente Celular"). Aparece mesmo quando opcional.
        if ($this->phone_mode_hides_native_option() && 'cellphone_only' !== $this->get_phone_mode()) {
            if (! isset($fields['shipping_phone_country'])) {
                $fields['shipping_phone_country'] = array(
                    'type'     => 'hidden',
                    'class'    => array('woo-better-hidden-field'),
                    'default'  => '+55',
                    'required' => false,
                );
            }

            if (isset($fields['shipping_phone'])) {
                $fields['shipping_phone']['label']    = $this->get_phone_field_label();
                $fields['shipping_phone']['required'] = ($phone_required === 'yes');
                if ($this->is_phone_brazil_mask_active()) {
                    $fields['shipping_phone']['placeholder'] = $this->phone_field_placeholder();
                }
            } else {
                $fields['shipping_phone'] = array(
                    'label'       => $this->get_phone_field_label(),
                    'placeholder' => $this->phone_field_placeholder(),
                    'required'    => ($phone_required === 'yes'),
                    'class'       => array('form-row-wide'),
                    'priority'    => $phone_priority,
                    'type'        => 'tel',
                    'validate'    => array('phone')
                );
            }
        }
        
        // Campo de bairro
        if ($neighborhood_enabled === 'yes') {
            $fields['shipping_neighborhood'] = array(
                'label'       => __('Bairro', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Nome do bairro', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => ($number_enabled === 'yes'), // Obrigatório se número for obrigatório
                'class'       => array('form-row-wide'),
                'priority'    => 69
            );
        }
        
        // Campo de número
        if ($number_enabled === 'yes') {
            $fields['shipping_number'] = array(
                'label'       => __('Número', 'woo-better-shipping-calculator-for-brazil'),
                'placeholder' => __('Ex: 123a', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => true,
                'class'       => array('form-row-wide'),
                'priority'    => 56
            );

        }
        
        // Verificar se auto-preenchimento de CEP está habilitado
        $cep_position = get_option('woo_better_calc_cep_field_position', 'no');
        $fill_checkout_address = get_option('woo_better_calc_enable_auto_address_fill', 'no');
        
        // Reposicionamento do CEP quando cep_position estiver ativo
        if ($cep_position === 'yes' && isset($fields['shipping_postcode'])) {
            $fields['shipping_postcode']['priority'] = 34;
        }

        if ($cep_position === 'yes' && $fill_checkout_address === 'yes') {
            // Adicionar checkbox para auto-preenchimento de CEP
            $fields['wc_better_calc_checkbox_shipping'] = array(
                'type'        => 'checkbox',
                'label'       => __('Informe acima o código postal (CEP).', 'woo-better-shipping-calculator-for-brazil'),
                'required'    => false,
                'class'       => array('form-row-wide'),
                'priority'    => 35,
                'id'          => 'wc_better_calc_checkbox_shipping'
            );
        }
        
        return $fields;
    }

    /**
     * Salva campos personalizados da página de edição de endereço
     *
     * @param int $user_id
     * @param string $load_address (billing|shipping)
     */
    public function save_edit_address_custom_fields($user_id, $load_address)
    {
        // Verifica se é Brasil
        $country = '';
        if ($load_address === 'billing') {
            $country = get_user_meta($user_id, 'billing_country', true);
        } elseif ($load_address === 'shipping') {
            $country = get_user_meta($user_id, 'shipping_country', true);
        }
        
        if ($country !== 'BR') {
            return;
        }
        
        $person_type = get_option('woo_better_calc_person_type_select', 'none');
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        $phone_required = get_option('woo_better_calc_contact_required', 'no');
        $birthdate_enabled = get_option('woo_better_calc_enable_birthdate_field', 'no');
        $gender_enabled = get_option('woo_better_calc_enable_gender_field', 'no');
        
        // Salvar campos de tipo de pessoa (apenas para billing)
        if ($load_address === 'billing' && $person_type !== 'none') {
            if (isset($_POST['billing_document'])) {
                $billing_document = sanitize_text_field(wp_unslash($_POST['billing_document']));
                update_user_meta($user_id, 'billing_document', $billing_document);
                
                // Processar o documento unificado para campos separados
                $clean_value = preg_replace('/[^0-9A-Z]/', '', strtoupper($billing_document));
                
                if (strlen($clean_value) === 11) {
                    // CPF
                    update_user_meta($user_id, 'billing_persontype', '1');
                    update_user_meta($user_id, 'billing_cpf', $billing_document);
                    update_user_meta($user_id, 'billing_cnpj', '');
                } elseif (strlen($clean_value) === 14) {
                    // CNPJ
                    update_user_meta($user_id, 'billing_persontype', '2');
                    update_user_meta($user_id, 'billing_cnpj', $billing_document);
                    update_user_meta($user_id, 'billing_cpf', '');
                }
            }
        }
        
        // Salvar campo de bairro
        if ($neighborhood_enabled === 'yes') {
            if ($load_address === 'billing' && isset($_POST['billing_neighborhood'])) {
                $neighborhood = sanitize_text_field(wp_unslash($_POST['billing_neighborhood']));
                update_user_meta($user_id, 'billing_neighborhood', $neighborhood);
            }
            
            if ($load_address === 'shipping' && isset($_POST['shipping_neighborhood'])) {
                $neighborhood = sanitize_text_field(wp_unslash($_POST['shipping_neighborhood']));
                update_user_meta($user_id, 'shipping_neighborhood', $neighborhood);
            }
        }
        
        // Salvar campo de número
        if ($number_enabled === 'yes') {
            if ($load_address === 'billing' && isset($_POST['billing_number'])) {
                $number = sanitize_text_field(wp_unslash($_POST['billing_number']));
                update_user_meta($user_id, 'billing_number', $number);
            }
            
            if ($load_address === 'shipping' && isset($_POST['shipping_number'])) {
                $number = sanitize_text_field(wp_unslash($_POST['shipping_number']));
                update_user_meta($user_id, 'shipping_number', $number);
            }
        }
        
        // Salvar campo empresa
        if ($person_type === 'legal' || $person_type === 'both') {
            // Determina se o documento submetido é CPF para limpar a empresa.
            // Espelha o comportamento do checkout: CPF não tem empresa.
            $is_cpf_document = false;
            if ($load_address === 'billing' && isset($_POST['billing_document'])) {
                $document_for_company = preg_replace('/[^0-9A-Z]/', '', strtoupper(sanitize_text_field(wp_unslash($_POST['billing_document']))));
                $is_cpf_document = strlen($document_for_company) === 11;
            }

            if ($load_address === 'billing' && isset($_POST['billing_company'])) {
                $company = sanitize_text_field(wp_unslash($_POST['billing_company']));

                // CPF não tem empresa: limpa o campo.
                if ($is_cpf_document) {
                    $company = '';
                }

                update_user_meta($user_id, 'billing_company', $company);

                // Sincroniza sessão/customer para o valor antigo não ressuscitar.
                if (function_exists('WC') && WC()->session) {
                    WC()->session->set('billing_company', $company);
                }
                if (function_exists('WC') && WC()->customer) {
                    WC()->customer->set_billing_company($company);
                }
            }

            if ($load_address === 'shipping' && isset($_POST['shipping_company'])) {
                $company = sanitize_text_field(wp_unslash($_POST['shipping_company']));
                update_user_meta($user_id, 'shipping_company', $company);

                if (function_exists('WC') && WC()->session) {
                    WC()->session->set('shipping_company', $company);
                }
                if (function_exists('WC') && WC()->customer) {
                    WC()->customer->set_shipping_company($company);
                }
            }
        }
        
        // Salvar campo de telefone (só quando o woo-better gerencia o telefone; no
        // modo "Desabilitar" o WooCommerce salva o valor nativo por conta própria).
        if ($phone_required === 'yes' && $this->phone_mode_hides_native_option()) {
            if ($load_address === 'billing' && isset($_POST['billing_phone'])) {
                $phone = sanitize_text_field(wp_unslash($_POST['billing_phone']));
                update_user_meta($user_id, 'billing_phone', $phone);
            }
            
            if ($load_address === 'shipping' && isset($_POST['shipping_phone'])) {
                $phone = sanitize_text_field(wp_unslash($_POST['shipping_phone']));
                update_user_meta($user_id, 'shipping_phone', $phone);
            }
        }

        // Modo shim ("Celular e Fixo" com o "Campo de Celular" DESLIGADO): mantém a
        // meta `*_cellphone` do usuário ESPELHANDO o telefone, para ela não divergir
        // (compatibilidade PagBank/Asaas/NFe). O campo hidden na tela já é espelhado
        // por JS; este espelho no servidor garante a consistência mesmo sem JS.
        if ($this->phone_mode_adds_cellphone_shim()) {
            if ($load_address === 'billing' && isset($_POST['billing_phone'])) {
                $billing_cc = isset($_POST['billing_phone_country']) ? sanitize_text_field(wp_unslash($_POST['billing_phone_country'])) : '+55';
                // Só espelha se o telefone for de fato CELULAR; um fixo limpa o campo.
                $cellphone = $this->mirror_phone_to_cellphone(sanitize_text_field(wp_unslash($_POST['billing_phone'])), $billing_cc);
                update_user_meta($user_id, 'billing_cellphone', $cellphone);
            }

            if ($load_address === 'shipping' && isset($_POST['shipping_phone'])) {
                $shipping_cc = isset($_POST['shipping_phone_country']) ? sanitize_text_field(wp_unslash($_POST['shipping_phone_country'])) : '+55';
                $cellphone = $this->mirror_phone_to_cellphone(sanitize_text_field(wp_unslash($_POST['shipping_phone'])), $shipping_cc);
                update_user_meta($user_id, 'shipping_cellphone', $cellphone);
            }
        }
        
        // Salvar campos de data de nascimento e gênero (apenas para billing)
        if ($load_address === 'billing') {
            if ($birthdate_enabled === 'yes' && isset($_POST['billing_birthdate'])) {
                $birthdate = sanitize_text_field(wp_unslash($_POST['billing_birthdate']));
                update_user_meta($user_id, 'billing_birthdate', $birthdate);
            }
            
            // CORREÇÃO: Sempre salva gênero quando habilitado para sobrescrever valores antigos "Masculino"
            if ($gender_enabled === 'yes') {
                $gender = isset($_POST['billing_gender']) ? sanitize_text_field(wp_unslash($_POST['billing_gender'])) : '';
                update_user_meta($user_id, 'billing_gender', $gender);
            }
            
            // Salvar Inscrição Estadual (IE)
            $ie_field_enabled = get_option('woo_better_calc_enable_ie_field', 'no');
            if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
                $billing_ie = isset($_POST['billing_ie']) ? strtoupper(sanitize_text_field(wp_unslash($_POST['billing_ie']))) : '';
                update_user_meta($user_id, 'billing_ie', $billing_ie);
            }

            // Salvar Inscrição Municipal (IM)
            $im_field_enabled = get_option('woo_better_calc_enable_im_field', 'no');
            if ($im_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
                $billing_im = isset($_POST['billing_im']) ? strtoupper(sanitize_text_field(wp_unslash($_POST['billing_im']))) : '';
                update_user_meta($user_id, 'billing_im', $billing_im);
            }

            // Salvar RG (documento de pessoa física, mesmo meta do Brazilian).
            if ($this->rg_field_enabled()) {
                $billing_rg = isset($_POST['billing_rg']) ? $this->sanitize_rg_value(wp_unslash($_POST['billing_rg'])) : '';
                update_user_meta($user_id, 'billing_rg', $billing_rg);
            }
        }
    }
    
    /**
     * Adiciona campos de número e bairro ao endereço formatado na página Minha Conta
     *
     * @param array $address Array com dados do endereço
     * @param int $customer_id ID do cliente
     * @param string $name Tipo de endereço (billing ou shipping)
     * @return array Array com dados do endereço incluindo número e bairro
     */
    public function my_account_formatted_address($address, $customer_id, $name)
    {
        // Verifica se o plugin woocommerce-extra-checkout-fields-for-brazil está ativo
        if (!function_exists('is_plugin_active')) {
            include_once(ABSPATH . 'wp-admin/includes/plugin.php');
        }
        
        // Se o plugin estiver ativo, não aplica as modificações
        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return $address;
        }
        
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled = get_option('woo_better_calc_number_required', 'no');
        
        // Adiciona bairro se habilitado
        if ($neighborhood_enabled === 'yes') {
            $neighborhood = get_user_meta($customer_id, $name . '_neighborhood', true);
            if (!empty($neighborhood)) {
                $address['neighborhood'] = $neighborhood;
            }
        }
        
        // Adiciona número se habilitado
        if ($number_enabled === 'yes') {
            $number = get_user_meta($customer_id, $name . '_number', true);
            if (!empty($number)) {
                $address['number'] = $number;
            }
        }
        
        return $address;
    }

    /**
     * Adiciona campos customizados brasileiros na resposta AJAX de detalhes do cliente.
     *
     * Disparado ao clicar em "Carregar endereço de cobrança/entrega" na edição de pedido no admin.
     *
     * @param array      $data     Dados do cliente já montados pelo WooCommerce.
     * @param WC_Customer $customer Objeto do cliente.
     * @param int        $user_id  ID do usuário.
     * @return array
     */
    public function add_custom_fields_to_customer_details($data, $customer, $user_id)
    {
        if (!$user_id) {
            return $data;
        }

        $person_type        = get_option('woo_better_calc_person_type_select', 'none');
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');
        $number_enabled     = get_option('woo_better_calc_number_required', 'no');
        $birthdate_enabled  = get_option('woo_better_calc_enable_birthdate_field', 'no');
        $gender_enabled     = get_option('woo_better_calc_enable_gender_field', 'no');
        $ie_field_enabled   = get_option('woo_better_calc_enable_ie_field', 'no');
        $im_field_enabled   = get_option('woo_better_calc_enable_im_field', 'no');

        // ── Billing ──────────────────────────────────────────────────────────
        if ($person_type !== 'none') {
            $billing_persontype = get_user_meta($user_id, 'billing_persontype', true);
            $billing_cpf        = get_user_meta($user_id, 'billing_cpf', true);
            $billing_cnpj       = get_user_meta($user_id, 'billing_cnpj', true);

            $data['billing']['persontype'] = $billing_persontype;
            $data['billing']['cpf']        = $billing_cpf;
            $data['billing']['cnpj']       = $billing_cnpj;

            if ($ie_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
                $data['billing']['ie'] = get_user_meta($user_id, 'billing_ie', true);
            }

            if ($im_field_enabled === 'yes' && ($person_type === 'legal' || $person_type === 'both')) {
                $data['billing']['im'] = get_user_meta($user_id, 'billing_im', true);
            }

            if ($this->rg_field_enabled()) {
                $data['billing']['rg'] = get_user_meta($user_id, 'billing_rg', true);
            }
        }

        if ($neighborhood_enabled === 'yes') {
            $data['billing']['neighborhood']  = get_user_meta($user_id, 'billing_neighborhood', true);
            $data['shipping']['neighborhood'] = get_user_meta($user_id, 'shipping_neighborhood', true);
        }

        if ($number_enabled === 'yes') {
            $data['billing']['number']  = get_user_meta($user_id, 'billing_number', true);
            $data['shipping']['number'] = get_user_meta($user_id, 'shipping_number', true);
        }

        if ($birthdate_enabled === 'yes') {
            $data['billing']['birthdate'] = get_user_meta($user_id, 'billing_birthdate', true);
        }

        if ($gender_enabled === 'yes') {
            $data['billing']['gender'] = get_user_meta($user_id, 'billing_gender', true);
        }

        return $data;
    }

    /**
     * Integração com FunnelKit Checkout.
     *
     * Retorna wcbcf_settings com merge: preserva as configurações reais do
     * Brazilian Market (rg, mailcheck, maskedinput, validate_cpf, etc.) e
     * sobrescreve apenas as chaves gerenciadas pelo Calculator quando ativas.
     *
     * @since    4.16.0
     * @param    mixed $default Valor padrão (não utilizado — a option real
     *                          é lida via remove_filter temporário).
     * @return   array
     */
    public function funnelkit_get_wcbcf_settings($default) {
        // REASON: Remove o filtro temporariamente para ler a option real
        // do Brazilian Market sem causar recursão. Depois faz merge com
        // as configs do Calculator, preservando chaves de terceiros (rg,
        // mailcheck, etc).
        remove_filter('pre_option_wcbcf_settings', array($this, 'funnelkit_get_wcbcf_settings'), 10);
        $real_settings = get_option('wcbcf_settings');
        add_filter('pre_option_wcbcf_settings', array($this, 'funnelkit_get_wcbcf_settings'), 10, 1);

        $settings = is_array($real_settings) ? $real_settings : array();

        $person_type          = get_option('woo_better_calc_person_type_select', 'none');
        $ie_enabled           = get_option('woo_better_calc_enable_ie_field', 'no');
        $birthdate_enabled    = get_option('woo_better_calc_enable_birthdate_field', 'no');
        $gender_enabled       = get_option('woo_better_calc_enable_gender_field', 'no');
        $number_enabled       = get_option('woo_better_calc_number_required', 'no');
        $neighborhood_enabled = get_option('woo_better_calc_enable_neighborhood_field', 'no');

        if ($person_type !== 'none') {
            $settings['person_type'] = 1;
        }

        if ($ie_enabled === 'yes' && in_array($person_type, array('legal', 'both'), true)) {
            $settings['ie'] = 1;
        }

        if ($birthdate_enabled === 'yes') {
            $settings['birthdate'] = 1;
        }

        if ($gender_enabled === 'yes') {
            $settings['gender'] = 1;
        }

        if ($number_enabled === 'yes') {
            $settings['number'] = 1;
        }

        if ($neighborhood_enabled === 'yes') {
            $settings['neighborhood'] = 1;
        }

        return $settings;
    }

    /**
     * Integração com FunnelKit Checkout: declara a classe stub
     * Extra_Checkout_Fields_For_Brazil_Front_End caso o plugin
     * "woocommerce-extra-checkout-fields-for-brazil" não esteja ativo.
     *
     * Executada no hook 'wp_loaded' com prioridade PHP_INT_MAX (a mais
     * baixa possível) para garantir que o plugin externo já tenha declarado
     * a classe real antes da verificação — evitando "Cannot redeclare class".
     *
     * @since    4.16.3
     * @return   void
     */
    public function register_funnelkit_stub_class() {
        // Se o plugin woocommerce-extra-checkout-fields-for-brazil estiver ativo,
        // a classe real já foi ou será declarada por ele — não criamos a stub.
        if (! function_exists('is_plugin_active')) {
            include_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        if (is_plugin_active('woocommerce-extra-checkout-fields-for-brazil/woocommerce-extra-checkout-fields-for-brazil.php')) {
            return;
        }

        require_once plugin_dir_path( __FILE__ ) . 'class-extra-checkout-fields-for-brazil-front-end-stub.php';
    }
}
