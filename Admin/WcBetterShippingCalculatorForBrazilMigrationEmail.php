<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

// Prevent direct access
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Envia um e-mail de aviso para os administradores quando o woo-better é
 * atualizado para a versão em que a Calculadora de Frete foi migrada para o
 * plugin "Shipping Simulator for WooCommerce".
 *
 * O envio é feito uma única vez (flag persistida) e apenas para usuários
 * legados que ainda não têm o shipping-simulator ativo. A detecção acontece
 * em qualquer requisição (admin ou front) via hook `init`; o disparo real é
 * agendado no WP-Cron para não bloquear a resposta da página.
 *
 * @since 5.0.0
 */
class WcBetterShippingCalculatorForBrazilMigrationEmail
{
    /** Opção que marca o e-mail como já enviado. */
    private const OPTION_SENT = 'woo_better_calc_migration_email_sent';

    /** Hook do cron que efetivamente envia o e-mail. */
    public const CRON_HOOK = 'woo_better_calc_send_migration_email';

    /** Caminho relativo do arquivo principal do shipping-simulator. */
    private const SHIPPING_PLUGIN_FILE = 'shipping-simulator-for-woocommerce/main.php';

    /** URL de download manual do shipping-simulator. */
    private const SHIPPING_DOWNLOAD_URL = 'https://wordpress.org/plugins/shipping-simulator-for-woocommerce/';

    /** Versão a partir da qual a migração passou a ser necessária. */
    private const VERSION_THRESHOLD = '4.17.1';

    /** Versão mínima do shipping-simulator que já contém os recursos migrados. */
    private const SHIPPING_UPDATE_THRESHOLD = '3.0.0';

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

    /**
     * Detecta a necessidade de migração e agenda o envio do e-mail uma única
     * vez. Roda no `init`, cobrindo as portas admin e front.
     *
     * @return void
     */
    public function maybe_schedule_email(): void
    {
        if (! $this->should_send()) {
            return;
        }

        if (! wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_single_event(time() + 15, self::CRON_HOOK);
        }
    }

    /**
     * Callback do cron: envia o e-mail para todos os administradores.
     *
     * @return void
     */
    public function send_migration_email(): void
    {
        if (! $this->should_send()) {
            return;
        }

        $recipients = $this->get_admin_emails();

        if (empty($recipients)) {
            return;
        }

        $subject = sprintf(
            '[%s] %s',
            __('Brazilian Checkout Fields for WooCommerce', 'woo-better-shipping-calculator-for-brazil'),
            __('Aviso: migração da Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil')
        );

        $body    = $this->build_email_body();
        $headers = array('Content-Type: text/plain; charset=UTF-8');

        // Envia individualmente para não expor os e-mails dos demais admins.
        foreach ($recipients as $recipient) {
            wp_mail($recipient, $subject, $body, $headers);
        }

        update_option(self::OPTION_SENT, 'yes');
    }

    /**
     * Verifica se o e-mail deve ser enviado neste momento.
     *
     * @return bool
     */
    private function should_send(): bool
    {
        if ('yes' === get_option(self::OPTION_SENT, 'no')) {
            return false;
        }

        // Só para usuários legados (que usavam a calculadora embutida).
        if (! $this->has_legacy_calculator_config()) {
            return false;
        }

        // Se o shipping-simulator já está ativo E atualizado (>= 3.0.0), não
        // há o que avisar. Caso contrário (inativo ou desatualizado), envia.
        if ($this->is_shipping_plugin_active() && $this->is_shipping_up_to_date()) {
            return false;
        }

        // Só na versão em que a migração passou a ser necessária.
        if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION')
            || ! version_compare(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION, self::VERSION_THRESHOLD, '>')) {
            return false;
        }

        // Só envia quando a atualização automática está habilitada para o
        // woo-better (flag persistida pelo toggle "Ativar atualizações
        // automáticas" da página de plugins).
        if (! $this->is_auto_update_enabled()) {
            return false;
        }

        return true;
    }

    /**
     * Verifica se a atualização automática está habilitada para o woo-better.
     *
     * O toggle da página de plugins grava o basename do plugin na option
     * `auto_update_plugins`.
     *
     * @return bool
     */
    private function is_auto_update_enabled(): bool
    {
        if (! function_exists('wp_is_auto_update_enabled_for_type')) {
            return false;
        }

        if (! wp_is_auto_update_enabled_for_type('plugin')) {
            return false;
        }

        if (! defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME')) {
            return false;
        }

        $auto_update_plugins = (array) get_site_option('auto_update_plugins', array());

        return in_array(WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_BASENAME, $auto_update_plugins, true);
    }

    /**
     * Coleta os e-mails de todos os usuários com role administrator.
     *
     * @return string[]
     */
    private function get_admin_emails(): array
    {
        $users = get_users(array(
            'role'   => 'administrator',
            'fields' => array('user_email'),
        ));

        $emails = array();

        foreach ($users as $user) {
            if (! empty($user->user_email) && is_email($user->user_email)) {
                $emails[] = $user->user_email;
            }
        }

        return array_values(array_unique($emails));
    }

    /**
     * Monta o corpo do e-mail (texto puro, em português).
     *
     * Há dois caminhos possíveis:
     *  1. Migração — shipping-simulator inativo (instalar);
     *  2. Atualização — shipping-simulator ativo, porém desatualizado (< 3.0.0).
     *
     * @return string
     */
    private function build_email_body(): string
    {
        $site_name = get_bloginfo('name');
        $site_url  = get_bloginfo('url');

        $lines = array();

        $lines[] = __('Olá!', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = '';

        $lines[] = sprintf(
            /* translators: 1: nome do site, 2: URL do site */
            __('Uma atualização importante foi aplicada ao plugin Brazilian Checkout Fields for WooCommerce no site %1$s (%2$s).', 'woo-better-shipping-calculator-for-brazil'),
            $site_name,
            $site_url
        );
        $lines[] = '';

        $lines[] = __('Os recursos da Calculadora de Frete foram movidos para o plugin Simulador de Frete para WooCommerce (Shipping Simulator for WooCommerce). Se você estava utilizando algum dos recursos abaixo, é necessário agir para continuar usando:', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = '';
        $lines[] = '- ' . __('Frete grátis por valor mínimo e por produto', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = '- ' . __('Esconder campos de endereço conforme o tipo de produto (digital/virtual)', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = '- ' . __('Calculadora de frete na página do produto', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = '- ' . __('Calculadora de frete na página do carrinho', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = '';

        if ($this->is_shipping_plugin_active()) {
            // Caminho 2: shipping-simulator ativo, porém desatualizado.
            $lines[] = __('O plugin Simulador de Frete para WooCommerce já está instalado e ativo no seu site, porém em uma versão desatualizada. Para continuar usando os recursos acima, basta realizar a atualização dos plugins.', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '';
            $lines[] = __('Como atualizar:', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '1. ' . __('Acesse o painel administrativo do WordPress.', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '2. ' . __('Vá até a página "Plugins".', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '3. ' . __('Atualize o plugin Simulador de Frete para WooCommerce para a versão 3.0.0 ou superior.', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '';
        } else {
            // Caminho 1: shipping-simulator inativo (migração/instalação).
            $lines[] = __('Como migrar:', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '1. ' . __('Acesse o painel administrativo do WordPress.', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '2. ' . __('Você será redirecionado automaticamente para a página de migração.', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '3. ' . sprintf(
                /* translators: %s: nome do botão de migração */
                __('Clique no botão "%s" e o plugin será instalado automaticamente.', 'woo-better-shipping-calculator-for-brazil'),
                __('Continuar utilizando Recursos do Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil')
            );
            $lines[] = '4. ' . __('Suas configurações antigas serão migradas junto.', 'woo-better-shipping-calculator-for-brazil');
            $lines[] = '';
        }

        $lines[] = __('Recomendamos realizar o processo o mais breve possível para não interromper o uso dos recursos da calculadora de frete.', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = '';

        $lines[] = __('Se preferir fazer o processo manualmente, baixe o plugin em:', 'woo-better-shipping-calculator-for-brazil');
        $lines[] = self::SHIPPING_DOWNLOAD_URL;
        $lines[] = '';

        $lines[] = sprintf(
            /* translators: %s: nome do site */
            __('Atenciosamente, equipe %s', 'woo-better-shipping-calculator-for-brazil'),
            $site_name
        );

        return implode("\n", $lines);
    }

    /**
     * Verifica se existe configuração legada da calculadora de frete.
     *
     * @return bool
     */
    private function has_legacy_calculator_config(): bool
    {
        foreach (self::LEGACY_CALCULATOR_OPTIONS as $option) {
            if (false !== get_option($option, false)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verifica se o shipping-simulator está ativo.
     *
     * @return bool
     */
    private function is_shipping_plugin_active(): bool
    {
        if (! function_exists('is_plugin_active')) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        return is_plugin_active(self::SHIPPING_PLUGIN_FILE);
    }

    /**
     * Verifica se o shipping-simulator está na versão que já contém os
     * recursos migrados (>= 3.0.0).
     *
     * @return bool
     */
    private function is_shipping_up_to_date(): bool
    {
        $version = $this->get_shipping_version();

        if ('' === $version) {
            return false;
        }

        return version_compare($version, self::SHIPPING_UPDATE_THRESHOLD, '>=');
    }

    /**
     * Lê a versão do shipping-simulator diretamente do arquivo.
     *
     * @return string Versão (ex.: '3.0.0') ou '' se não instalado.
     */
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
}
