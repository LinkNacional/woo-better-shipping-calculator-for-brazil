<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Aba "Calculadora de Frete" do woo-better.
 *
 * Exibe um card (mesmo layout da notificação de migração) com a ação
 * correta conforme o estado do plugin shipping-simulator-for-woocommerce:
 *  - não instalado (usuário legado)  → migração/instalar;
 *  - não instalado (usuário novo)    → instalar (mensagem diferente);
 *  - instalado e desatualizado (< 3.0.0) → atualizar;
 *  - instalado, atual e desativado   → ativar.
 *
 * Quando o plugin está instalado, atual (>= 3.0.0) e ativo, a aba não é
 * registrada.
 *
 * @since 5.0.0
 */
class WcBetterShippingCalculatorForBrazilShippingCalculatorSettings extends \WC_Settings_Page
{
    private const SHIPPING_PLUGIN_FILE = 'shipping-simulator-for-woocommerce/main.php';

    private const SHIPPING_PLUGIN_UPDATE_THRESHOLD = '3.0.0';

    /**
     * Options legadas da "Calculadora de frete" usadas para detectar um
     * usuário antigo do woo-better.
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

    public function __construct()
    {
        $this->id    = 'wc-better-calc-shipping-calculator';
        $this->label = __('Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil');
        parent::__construct();
    }

    public function add_settings_page($pages)
    {
        if ($this->should_show_tab()) {
            $pages[$this->id] = $this->label;
        }

        return $pages;
    }

    public function output()
    {
        global $hide_save_button;
        $hide_save_button = true;

        // A aba não é registrada nesse estado (instalado, atual e ativo).
        if (! $this->should_show_tab()) {
            return;
        }

        $is_installed = $this->is_shipping_plugin_installed();
        $is_outdated  = $this->shipping_plugin_is_outdated();

        $show_features = false;
        $install_action = 'install';

        if (! $is_installed) {
            if ($this->has_legacy_calculator_config()) {
                $title = __('Agora a Calculadora de Frete se chama Simulador de Frete.', 'woo-better-shipping-calculator-for-brazil');
                $lead  = __('Essa nova versão do seu plugin faz uma divisão importante entre campos brasileiros e o cálculo de frete. O plugin atual será exclusivo para os Campos de Checkout Brasileiros.', 'woo-better-shipping-calculator-for-brazil');
                $body  = __('Para continuar usando os recursos abaixo, clique no botão "Continuar utilizando os recursos da Calculadora de Frete".', 'woo-better-shipping-calculator-for-brazil');
                $action_label = __('Continuar utilizando Recursos do Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil');
                $install_action = 'install';
                $show_features = true;
            } else {
                $title = __('A Calculadora de Frete agora é um plugin separado.', 'woo-better-shipping-calculator-for-brazil');
                $lead  = __('A partir desta versão, o cálculo de frete passou a fazer parte do plugin Shipping Simulator for WooCommerce.', 'woo-better-shipping-calculator-for-brazil');
                $body  = __('Instale o plugin abaixo para usar a calculadora de frete nas páginas de produto e carrinho, frete grátis e demais recursos.', 'woo-better-shipping-calculator-for-brazil');
                $action_label = __('Instalar Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil');
                $install_action = 'install';
                $show_features = true;
            }
        } elseif ($is_outdated) {
            $title = __('Atualize o Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil');
            $lead  = __('A versão instalada do Shipping Simulator for WooCommerce não possui os novos recursos da calculadora de frete.', 'woo-better-shipping-calculator-for-brazil');
            $body  = __('Atualize o plugin para a versão mais recente para ter acesso aos recursos da calculadora de frete nas páginas de produto e carrinho, frete grátis e demais opções.', 'woo-better-shipping-calculator-for-brazil');
            $action_label = __('Atualizar Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil');
            $install_action = 'upgrade';
        } else {
            $title = __('Ative o Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil');
            $lead  = __('O plugin Shipping Simulator for WooCommerce está instalado, mas desativado.', 'woo-better-shipping-calculator-for-brazil');
            $body  = __('Ative o plugin para utilizar os recursos da calculadora de frete nas páginas de produto e carrinho, frete grátis e demais opções.', 'woo-better-shipping-calculator-for-brazil');
            $action_label = __('Ativar Shipping Simulator for WooCommerce', 'woo-better-shipping-calculator-for-brazil');
            $install_action = 'activate';
        }
        ?>
        <div class="woo-better-shipping-migration">
            <div class="woo-better-shipping-migration__card">
                <div class="woo-better-shipping-migration__badge" aria-hidden="true">🚚</div>

                <h1 class="woo-better-shipping-migration__title">
                    <?php echo esc_html($title); ?>
                </h1>

                <p class="woo-better-shipping-migration__lead">
                    <?php echo esc_html($lead); ?>
                </p>

                <div class="woo-better-shipping-migration__body">
                    <p><?php echo esc_html($body); ?></p>

                    <?php if ($show_features) : ?>
                        <ul class="woo-better-shipping-migration__features">
                            <li>🚚 <?php esc_html_e('Frete grátis por valor mínimo e por produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                            <li>🙈 <?php esc_html_e('Esconder campos de endereço conforme o tipo de produto (digital/virtual)', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                            <li>📦 <?php esc_html_e('Calculadora de frete na página do produto', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                            <li>🛒 <?php esc_html_e('Calculadora de frete na página do carrinho', 'woo-better-shipping-calculator-for-brazil'); ?></li>
                        </ul>
                    <?php endif; ?>
                </div>

                <div class="woo-better-shipping-migration__actions">
                    <button type="button" class="button button-primary button-hero woo-better-shipping-install-button" data-install-action="<?php echo esc_attr($install_action); ?>">
                        <span class="woo-better-shipping-install-button__bar" aria-hidden="true"></span>
                        <span class="woo-better-shipping-install-button__text"><?php echo esc_html($action_label); ?></span>
                    </button>
                </div>
            </div>
        </div>
        <?php
    }

    public function save()
    {
        // Nada a salvar: a aba é apenas informativa.
    }

    /**
     * Decide se a aba deve aparecer. Fica oculta apenas quando o
     * shipping-simulator está instalado, atual (>= 3.0.0) e ativo.
     *
     * @return bool
     */
    private function should_show_tab(): bool
    {
        if ($this->is_shipping_plugin_active() && ! $this->shipping_plugin_is_outdated()) {
            return false;
        }

        return true;
    }

    private function is_shipping_plugin_active(): bool
    {
        if (! function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        return is_plugin_active(self::SHIPPING_PLUGIN_FILE);
    }

    private function is_shipping_plugin_installed(): bool
    {
        if ($this->is_shipping_plugin_active()) {
            return true;
        }

        return file_exists(WP_PLUGIN_DIR . '/' . self::SHIPPING_PLUGIN_FILE);
    }

    private function shipping_plugin_version(): string
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

    private function shipping_plugin_is_outdated(): bool
    {
        $version = $this->shipping_plugin_version();

        if ('' === $version) {
            return false;
        }

        return version_compare($version, self::SHIPPING_PLUGIN_UPDATE_THRESHOLD, '<');
    }

    private function has_legacy_calculator_config(): bool
    {
        foreach (self::LEGACY_CALCULATOR_OPTIONS as $option) {
            if (false !== get_option($option, false)) {
                return true;
            }
        }

        return false;
    }
}
