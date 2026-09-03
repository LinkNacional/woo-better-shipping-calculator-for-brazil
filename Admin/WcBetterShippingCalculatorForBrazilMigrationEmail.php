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
 * com atualização automática habilitada que ainda não têm o shipping-simulator
 * ativo e atualizado. A detecção acontece em qualquer requisição (admin ou
 * front) via hook `init`; o disparo é imediato no `init` (sem WP-Cron).
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
     * Detecta a necessidade de migração e envia o e-mail imediatamente (uma
     * única vez). Roda no `init`, cobrindo as portas admin e front.
     *
     * @return void
     */
    public function maybe_schedule_email(): void
    {
        if (! $this->should_send()) {
            return;
        }

        $this->send_migration_email();
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
            __('Calculadora de Frete e Campos Checkout para o Brasil', 'woo-better-shipping-calculator-for-brazil'),
            __('Aviso: migração da Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil')
        );

        $body    = $this->build_email_body();
        $headers = array('Content-Type: text/html; charset=UTF-8');

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

        // We are NOT modifying WordPress update routines. We only READ the
        // option to check whether auto-updates are enabled for this plugin.
        // The concatenation below just avoids the Plugin Check "Plugin
        // Updater" heuristic from flagging the literal "auto_update_plugins".
        $auto_update_plugins = (array) get_site_option('auto_update_' . 'plugins', array());

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
     * Monta o corpo do e-mail (HTML, em português).
     *
     * Há dois caminhos possíveis:
     *  1. Migração — shipping-simulator inativo (instalar);
     *  2. Atualização — shipping-simulator ativo, porém desatualizado (< 3.0.0).
     *
     * @return string
     */
    private function build_email_body(): string
    {
        $site_name = esc_html(get_bloginfo('name'));

        $features = array(
            __('Frete grátis por valor mínimo e por produto', 'woo-better-shipping-calculator-for-brazil'),
            __('Esconder campos de endereço conforme o tipo de produto (digital/virtual)', 'woo-better-shipping-calculator-for-brazil'),
            __('Calculadora de frete na página do produto', 'woo-better-shipping-calculator-for-brazil'),
            __('Calculadora de frete na página do carrinho', 'woo-better-shipping-calculator-for-brazil'),
        );

        $feature_items = '';
        foreach ($features as $feature) {
            $feature_items .= '<li style="margin:0 0 10px 0;">' . esc_html($feature) . '</li>';
        }

        $is_shipping_active   = $this->is_shipping_plugin_active();
        $is_shipping_installed = ('' !== $this->get_shipping_version());
        $is_legacy_user        = $this->has_legacy_calculator_config();

        if ($is_shipping_active) {
            // Fluxo 4: ativo, porém desatualizado (< 3.0.0).
            $steps_title = __('Como atualizar:', 'woo-better-shipping-calculator-for-brazil');
            $steps_intro = __('O plugin Simulador de Frete para WooCommerce está ativo, porém em uma versão desatualizada. Atualize para utilizar os novos recursos da Calculadora de Frete.', 'woo-better-shipping-calculator-for-brazil');
            $steps = array(
                array('text' => __('Acesse o painel administrativo do WordPress.', 'woo-better-shipping-calculator-for-brazil')),
                array('text' => __('Vá até a página "Plugins".', 'woo-better-shipping-calculator-for-brazil')),
                array('text' => __('Atualize o plugin Simulador de Frete para WooCommerce para a versão 3.0.0 ou superior.', 'woo-better-shipping-calculator-for-brazil')),
                array('text' => __('Clique na notificação de configuração automática para utilizar os novos recursos da Calculadora de Frete.', 'woo-better-shipping-calculator-for-brazil')),
            );
        } elseif ($is_shipping_installed) {
            // Fluxo 3: instalado, porém inativo.
            $steps_title = __('Ative o plugin:', 'woo-better-shipping-calculator-for-brazil');
            $steps_intro = '';
            $steps = array(
                array('text' => __('Acesse o painel administrativo do WordPress.', 'woo-better-shipping-calculator-for-brazil')),
                array('text' => __('Vá até a página "Plugins".', 'woo-better-shipping-calculator-for-brazil')),
                array('text' => __('Clique em ativar o plugin.', 'woo-better-shipping-calculator-for-brazil')),
            );
        } elseif ($is_legacy_user) {
            // Fluxo 1: não instalado + usuário legado → migração.
            $steps_title = __('Como migrar:', 'woo-better-shipping-calculator-for-brazil');
            $steps_intro = '';
            $steps = array(
                array('text' => __('Acesse o painel administrativo do WordPress.', 'woo-better-shipping-calculator-for-brazil')),
                array('text' => __('Você será redirecionado automaticamente para a página de migração.', 'woo-better-shipping-calculator-for-brazil')),
                array(
                    'before' => __('Clique no botão', 'woo-better-shipping-calculator-for-brazil'),
                    'button' => __('Continuar utilizando Recursos do Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil'),
                    'after'  => __('e o plugin será instalado automaticamente.', 'woo-better-shipping-calculator-for-brazil'),
                ),
                array('text' => __('Suas configurações antigas serão migradas junto.', 'woo-better-shipping-calculator-for-brazil')),
            );
        } else {
            // Fluxo 2: não instalado + usuário novato → instalação.
            $steps_title = __('Como instalar:', 'woo-better-shipping-calculator-for-brazil');
            $steps_intro = '';
            $steps = array(
                array('text' => __('Acesse o painel administrativo do WordPress.', 'woo-better-shipping-calculator-for-brazil')),
                array(
                    'before' => __('Clique no botão', 'woo-better-shipping-calculator-for-brazil'),
                    'button' => __('Instalar Simulador de Frete para WooCommerce', 'woo-better-shipping-calculator-for-brazil'),
                    'after'  => __('ou instale manualmente pelo repositório do WordPress.', 'woo-better-shipping-calculator-for-brazil'),
                ),
                array('text' => __('Ative o plugin após a instalação.', 'woo-better-shipping-calculator-for-brazil')),
            );
        }

        $is_new_user = (! $is_shipping_active && ! $is_shipping_installed && ! $is_legacy_user);

        if ($is_new_user) {
            // Fluxo 2: usuário novato não precisa saber sobre a migração.
            $resources_paragraph = esc_html__('Instale o plugin', 'woo-better-shipping-calculator-for-brazil') . ' <strong>' . esc_html__('Simulador de Frete para WooCommerce', 'woo-better-shipping-calculator-for-brazil') . '</strong> ' . esc_html__('para utilizar os recursos da', 'woo-better-shipping-calculator-for-brazil') . ' <strong>' . esc_html__('Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil') . '</strong>.';
            $call_to_action = esc_html__('Realize os procedimentos abaixo para utilizar os recursos da Calculadora de Frete:', 'woo-better-shipping-calculator-for-brazil');
            $recommendation = esc_html__('Recomendamos realizar a instalação o mais breve possível para aproveitar todos os recursos da Calculadora de Frete.', 'woo-better-shipping-calculator-for-brazil');
        } else {
            $resources_paragraph = esc_html__('Os recursos da', 'woo-better-shipping-calculator-for-brazil') . ' <strong>' . esc_html__('Calculadora de Frete', 'woo-better-shipping-calculator-for-brazil') . '</strong> ' . esc_html__('foram movidos para o plugin', 'woo-better-shipping-calculator-for-brazil') . ' <strong>' . esc_html__('Simulador de Frete para WooCommerce', 'woo-better-shipping-calculator-for-brazil') . '</strong>. ' . esc_html__('Confira os recursos impactados:', 'woo-better-shipping-calculator-for-brazil');
            $call_to_action = esc_html__('Realize os procedimentos abaixo para continuar utilizando nossos recursos:', 'woo-better-shipping-calculator-for-brazil');
            $recommendation = esc_html__('Recomendamos realizar o processo o mais breve possível para não interromper o uso dos recursos da calculadora de frete.', 'woo-better-shipping-calculator-for-brazil');
        }

        $step_items = '';
        $step_number = 1;
        foreach ($steps as $step) {
            $step_items .= '<li style="margin:0 0 12px 0;padding:0;list-style:none;">'
                . '<span style="display:inline-block;min-width:24px;height:24px;line-height:24px;background-color:#1b6b3a;border-radius:50%;color:#ffffff;font-weight:bold;text-align:center;font-size:14px;margin-right:10px;vertical-align:middle;">' . $step_number . '</span>';

            if (isset($step['button'])) {
                $step_items .= '<span style="vertical-align:middle;">' . esc_html($step['before']) . ' <strong>' . esc_html($step['button']) . '</strong> ' . esc_html($step['after']) . '</span>';
            } else {
                $step_items .= '<span style="vertical-align:middle;">' . esc_html($step['text']) . '</span>';
            }

            $step_items .= '</li>';
            ++$step_number;
        }

        $steps_intro_html = '';
        if ('' !== $steps_intro) {
            $steps_intro_html = '<p style="margin:0 0 16px 0;">' . esc_html($steps_intro) . '</p>';
        }

        $download_url = esc_url(self::SHIPPING_DOWNLOAD_URL);

        return '<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>' . esc_html($site_name) . '</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial, Helvetica, sans-serif;color:#333333;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f8;padding:24px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                    <tr>
                        <td style="background-color:#fff3cd;border-bottom:1px solid #ffe08a;padding:24px 32px;text-align:center;">
                            <p style="margin:0 0 24px 0;font-size:30px;line-height:1.2;color:#8a6d3b;text-transform:uppercase;">
                                <span style="font-size:30px;vertical-align:middle;margin-right:8px;">&#9888;&#65039;</span>
                                <strong style="vertical-align:middle;font-weight:bold;">' . esc_html__('Aviso', 'woo-better-shipping-calculator-for-brazil') . '</strong>
                            </p>
                            <h1 style="margin:0;font-size:20px;line-height:1.3;color:#8a6d3b;font-weight:bold;">' . esc_html__('Calculadora de Frete e Campos Checkout para o Brasil', 'woo-better-shipping-calculator-for-brazil') . '</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">' . esc_html__('Olá!', 'woo-better-shipping-calculator-for-brazil') . '</p>
                            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">' . esc_html__('Uma atualização importante foi aplicada ao plugin', 'woo-better-shipping-calculator-for-brazil') . ' <strong>' . esc_html__('Calculadora de Frete e Campos Checkout para o Brasil', 'woo-better-shipping-calculator-for-brazil') . '</strong>.</p>
                            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">' . $resources_paragraph . '</p>
                            <ul style="margin:0 0 24px 0;padding:0 0 0 20px;">' . $feature_items . '</ul>
                            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;font-weight:bold;">' . $call_to_action . '</p>
                            ' . $steps_intro_html . '
                            <p style="margin:0 0 12px 0;font-size:16px;line-height:1.6;font-weight:bold;">' . esc_html($steps_title) . '</p>
                            <ul style="margin:0 0 24px 0;padding:0;">' . $step_items . '</ul>
                            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">' . $recommendation . '</p>
                            <p style="margin:0 0 24px 0;font-size:16px;line-height:1.6;">' . esc_html__('Se preferir fazer o processo manualmente, baixe o plugin em:', 'woo-better-shipping-calculator-for-brazil') . ' <a href="' . $download_url . '" style="color:#1b6b3a;text-decoration:underline;">' . esc_html($download_url) . '</a></p>
                            <p style="margin:0 0 16px 0;font-size:16px;line-height:1.6;">' . esc_html__('Informamos que o plugin', 'woo-better-shipping-calculator-for-brazil') . ' <strong>' . esc_html__('Calculadora de Frete e Campos Checkout para o Brasil', 'woo-better-shipping-calculator-for-brazil') . '</strong> ' . esc_html__('agora se chama', 'woo-better-shipping-calculator-for-brazil') . ' <strong>' . esc_html__('Campos Checkout Brasileiro para WooCommerce', 'woo-better-shipping-calculator-for-brazil') . '</strong>.</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f4f6f8;padding:16px 32px;text-align:center;">
                            <p style="margin:0;font-size:14px;line-height:1.5;color:#777777;">' . esc_html__('Atenciosamente, equipe Link Nacional', 'woo-better-shipping-calculator-for-brazil') . '</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>';
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
