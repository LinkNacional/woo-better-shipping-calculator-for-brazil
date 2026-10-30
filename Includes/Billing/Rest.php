<?php
/**
 * Rotas REST do fluxo de compra.
 *
 * Duas rotas, as duas de AÇÃO (`POST`), porque as duas mudam o estado deste
 * site:
 *
 *   POST lkn-billing/v1/install    baixa o .zip e ativa o PRO
 *   POST lkn-billing/v1/activate   grava a chave de licença
 *
 * ── Segurança ─────────────────────────────────────────────────────────────
 * As duas exigem `install_plugins`/`activate_plugins` E o nonce padrão do REST
 * (`X-WP-Nonce`), que o WordPress valida sozinho na autenticação por cookie.
 * Quem já pode instalar plugin neste site já tem o poder; aqui não se inventa
 * poder novo.
 *
 * A URL de download NÃO é aceita de qualquer lugar: o host precisa estar na
 * allowlist derivada de `LKN_BILLING_API_URL`, senão um clique em link
 * malicioso viraria "instale este zip arbitrário".
 *
 * @package WcBetterShippingCalculatorForBrazil\Includes\Billing
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing;

// Impede acesso direto.
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Rotas REST.
 */
final class Rest
{
    /**
     * Registra as rotas.
     *
     * @return void
     */
    public static function boot(): void
    {
        add_action('rest_api_init', array(__CLASS__, 'register'));
    }

    /**
     * Declara as rotas.
     *
     * @return void
     */
    public static function register(): void
    {
        register_rest_route(
            Billing::REST_NAMESPACE,
            '/install',
            array(
                'methods' => 'POST',
                'callback' => array(__CLASS__, 'install'),
                'permission_callback' => static function () {
                    return current_user_can('install_plugins') && current_user_can('activate_plugins');
                },
                'args' => array(
                    'download_url' => array(
                        'required' => true,
                        'type' => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            Billing::REST_NAMESPACE,
            '/activate',
            array(
                'methods' => 'POST',
                'callback' => array(__CLASS__, 'activate'),
                'permission_callback' => static function () {
                    return current_user_can('activate_plugins');
                },
                'args' => array(
                    'license_key' => array(
                        'required' => true,
                        'type' => 'string',
                    ),
                ),
            )
        );
    }

    /**
     * Baixa, instala e ativa o plugin PRO.
     *
     * @param \WP_REST_Request $request Requisição.
     * @return \WP_REST_Response|\WP_Error
     */
    public static function install($request)
    {
        $config = Billing::config();
        $url = (string) $request->get_param('download_url');

        $allowed = self::is_allowed_download_host($url, $config['api_url']);

        if (true !== $allowed) {
            return $allowed;
        }

        // O upgrader vive no admin e não é carregado no front/REST por padrão.
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/misc.php';
        require_once ABSPATH . 'wp-admin/includes/plugin.php';
        require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';

        $skin = new \Automatic_Upgrader_Skin();
        $upgrader = new \Plugin_Upgrader($skin);

        // `WP_Filesystem` pode pedir credenciais (FTP/SSH) em hospedagem com
        // permissão apertada. Nesse caso o download automático não existe: o
        // caminho honesto é mandar o cliente baixar e instalar na mão.
        if (! self::filesystem_ready()) {
            return new \WP_Error(
                'lkn_billing_filesystem',
                __('Este site não permite instalação automática de plugins. Baixe o .zip e instale manualmente.', 'woo-better-shipping-calculator-for-brazil'),
                array('status' => 409, 'manual' => true)
            );
        }

        // `Plugin_Upgrader::install()` já ativa a proteção contra sobrescrever
        // pacote em uso e devolve `true`/`WP_Error`. O texto de erro dele é
        // técnico demais para o cliente; o `detail` fica para o suporte.
        add_filter('http_request_args', array(__CLASS__, 'block_download_redirects'), 10, 1);

        try {
            $result = $upgrader->install($url);
        } finally {
            remove_filter('http_request_args', array(__CLASS__, 'block_download_redirects'), 10);
        }

        if (is_wp_error($result)) {
            return new \WP_Error(
                'lkn_billing_install_failed',
                $result->get_error_message(),
                array('status' => 502)
            );
        }

        if (true !== $result) {
            return new \WP_Error(
                'lkn_billing_install_failed',
                __('A instalação do PRO não foi concluída.', 'woo-better-shipping-calculator-for-brazil'),
                array('status' => 502)
            );
        }

        $basename = (string) $config['pro_basename'];
        $detected = $upgrader->plugin_info();

        // O nome da pasta pode vir com sufixo (`-pro-1`, etc.) em instalações
        // repetidas; o que o upgrader devolveu é a verdade.
        if (is_string($detected) && $detected !== '') {
            $basename = $detected;
        }

        $active = is_plugin_active($basename);

        if (! $active) {
            $activated = activate_plugin($basename);

            if (is_wp_error($activated)) {
                return new \WP_Error(
                    'lkn_billing_activate_failed',
                    $activated->get_error_message(),
                    array('status' => 502, 'installed' => true, 'plugin' => $basename)
                );
            }
        }

        return rest_ensure_response(
            array(
                'ok' => true,
                'plugin' => $basename,
                'active' => true,
            )
        );
    }

    /**
     * Ativa a licença no plugin PRO.
     *
     * A ATIVAÇÃO É DO PRO. Gravar a option não basta: a licença nasce
     * `pending` no servidor e só vira `active` quando o PRO chama
     * `/v1/license/activate` e guarda o token/cert. Se aqui só gravasse a
     * chave, o PRO revalidaria uma licença ainda `pending` e mostraria
     * "pertence a outro produto/site" — que é exatamente o defeito que este
     * método existe para não ter.
     *
     * Por isso chamamos `Manager::activate_key()` do próprio PRO quando ele
     * está carregado. O fallback (gravar a chave) só vale para o cenário raro
     * de a licença chegar antes de o PRO estar ativo.
     *
     * @param \WP_REST_Request $request Requisição.
     * @return \WP_REST_Response|\WP_Error
     */
    public static function activate($request)
    {
        $config = Billing::config();
        $key = self::normalize_key((string) $request->get_param('license_key'));

        if (strlen($key) < 8) {
            return new \WP_Error(
                'lkn_billing_invalid_key',
                __('A chave de licença recebida é inválida.', 'woo-better-shipping-calculator-for-brazil'),
                array('status' => 400)
            );
        }

        $manager = self::pro_manager($config);

        if (null !== $manager) {
            $result = $manager->activate_key($key);

            if (is_wp_error($result)) {
                $dados = (array) $result->get_error_data();
                $api_code = isset($dados['api_code']) ? (string) $dados['api_code'] : '';

                return new \WP_Error(
                    'lkn_billing_activate_failed',
                    self::activate_error_message($api_code, $result->get_error_message()),
                    array(
                        'status' => 409,
                        'api_code' => $api_code,
                        'license_option' => $config['license_option'],
                    )
                );
            }

            $active = method_exists($manager, 'features_enabled') && $manager->features_enabled();

            return rest_ensure_response(
                array(
                    'ok' => (bool) $active,
                    'activated' => true,
                    'features' => (bool) $active,
                    'license_option' => $config['license_option'],
                )
            );
        }

        // PRO ainda não carregou: deixa a chave pronta e limpa o estado antigo
        // para que a primeira checagem dele comece do zero.
        update_option($config['license_option'], $key);

        foreach ((array) $config['license_state_options'] as $option) {
            delete_option($option);
        }

        update_option($config['license_last_check_option'], 0);

        return rest_ensure_response(
            array(
                'ok' => true,
                'activated' => false,
                'features' => false,
                'license_option' => $config['license_option'],
            )
        );
    }

    /**
     * Mensagem de falha de ativação, em português.
     *
     * A API de licenças responde em INGLÊS ("this site already has an active
     * license for this product") e a mensagem crua ia para a tela do cliente,
     * no meio do wizard de compra. Aqui os casos que o cliente pode resolver
     * ganham texto próprio; o resto cai na mensagem genérica.
     *
     * @param string $api_code Código devolvido pela API (`error.code`).
     * @param string $fallback Mensagem original, usada quando não há tradução.
     * @return string
     */
    private static function activate_error_message(string $api_code, string $fallback): string
    {
        switch ($api_code) {
            case 'license_already_active_for_site':
                // Outra chave já ocupa este domínio para o produto. O cliente
                // precisa liberar ESTE site antes de ativar a chave nova.
                return __(
                    'Este site já tem uma licença ativa para este produto. Libere este site na instalação onde a licença está ativa e tente de novo.',
                    'woo-better-shipping-calculator-for-brazil'
                );

            case 'license_expired':
                return __('Esta licença está expirada. Fale com o suporte.', 'woo-better-shipping-calculator-for-brazil');

            case 'license_suspended':
            case 'license_banned':
                return __('Esta licença está bloqueada. Fale com o suporte.', 'woo-better-shipping-calculator-for-brazil');

            case 'activation_limit_reached':
                return __(
                    'Esta licença já atingiu o limite de sites ativos. Libere um deles para ativar aqui.',
                    'woo-better-shipping-calculator-for-brazil'
                );

            case 'license_not_found':
            case 'invalid_key':
                return __('A chave de licença não foi encontrada. Confira se copiou a chave inteira.', 'woo-better-shipping-calculator-for-brazil');

            case 'plugin_mismatch':
                return __('Esta chave é de outro produto.', 'woo-better-shipping-calculator-for-brazil');

            case 'unreachable':
                return __(
                    'Não conseguimos falar com o servidor de licenças. Verifique sua conexão e tente de novo.',
                    'woo-better-shipping-calculator-for-brazil'
                );
        }

        return wp_strip_all_tags($fallback);
    }

    /**
     * Instância do Manager de licença do PRO, se ele estiver carregado.
     *
     * @param array<string, mixed> $config Configuração do módulo.
     * @return object|null
     */
    private static function pro_manager(array $config)
    {
        $class = (string) ($config['manager_class'] ?? '');

        if ($class === '' || ! class_exists($class) || ! method_exists($class, 'instance')) {
            return null;
        }

        $manager = $class::instance();

        return is_object($manager) ? $manager : null;
    }

    /**
     * Normaliza a chave exatamente como o PRO faz.
     *
     * Maiúscula; remove só espaço, hífen, tab e quebra de linha; `I`/`L` viram
     * `1` e `O` vira `0`.
     *
     * O QUE NÃO SE PODE FAZER: filtrar para `[A-Za-z0-9]`. O dígito verificador
     * da chave é módulo 37 e o alfabeto inclui `*`, `~`, `$`, `=` e `U` — então
     * uma chave em cada ~7 termina com um símbolo, e "limpar" a chave apaga o
     * verificador. O resultado seria `invalid_key` para quem digitou certo, sem
     * nenhuma pista do motivo. (Já aconteceu: a primeira versão deste método
     * fazia isso.)
     *
     * @param string $key Chave crua.
     * @return string
     */
    public static function normalize_key(string $key): string
    {
        $cleaned = '';

        foreach (str_split(strtoupper(trim($key))) as $char) {
            if (false !== strpos(" -\t\r\n", $char)) {
                continue;
            }

            $cleaned .= $char;
        }

        $cleaned = str_replace(array('I', 'L'), '1', $cleaned);

        return str_replace('O', '0', $cleaned);
    }

    /**
     * O host da URL de download é confiável?
     *
     * Dois hosts passam: o da API de cobrança (de onde vem o link em produção)
     * e o do PRÓPRIO site (caso em que o `.zip` é servido de dentro do
     * WordPress, como no ambiente de teste).
     *
     * Aceitar o próprio site não abre nada: quem chega aqui já precisou de
     * `install_plugins`, e essa capacidade já permite subir um `.zip`
     * arbitrário pelo instalador do WordPress.
     *
     * @param string $url     URL enviada pelo navegador.
     * @param string $api_url Base da API de cobrança.
     * @return true|\WP_Error
     */
    public static function is_allowed_download_host(string $url, string $api_url)
    {
        $scheme = wp_parse_url($url, PHP_URL_SCHEME);
        $host = wp_parse_url($url, PHP_URL_HOST);
        $port = wp_parse_url($url, PHP_URL_PORT);

        if (! in_array($scheme, array('http', 'https'), true) || empty($host)) {
            return new \WP_Error(
                'lkn_billing_bad_url',
                __('Endereço de download inválido.', 'woo-better-shipping-calculator-for-brazil'),
                array('status' => 400)
            );
        }

        /*
         * O `.zip` vai ser INSTALADO e ATIVADO. Em `http` qualquer um no
         * caminho troca o pacote, então exigimos https — com uma exceção: site
         * de desenvolvimento (`local`/`development`), onde a API costuma rodar
         * em `http://localhost`. Essa exceção não vale em produção.
         */
        if ('http' === $scheme && ! self::is_dev_environment()) {
            return new \WP_Error(
                'lkn_billing_insecure_url',
                __('O download do PRO precisa ser por conexão segura (https).', 'woo-better-shipping-calculator-for-brazil'),
                array('status' => 400)
            );
        }

        $api_host = (string) wp_parse_url($api_url, PHP_URL_HOST);
        $api_port = (string) wp_parse_url($api_url, PHP_URL_PORT);

        if ($host === $api_host && (string) $port === $api_port) {
            return true;
        }

        // `.zip` servido pelo próprio WordPress: host do site, mesma porta.
        $site_host = (string) wp_parse_url(home_url(), PHP_URL_HOST);
        $site_port = (string) wp_parse_url(home_url(), PHP_URL_PORT);

        if ($host === $site_host && (string) $port === $site_port) {
            return true;
        }

        return new \WP_Error(
            'lkn_billing_bad_url',
            __('Endereço de download fora dos domínios confiáveis.', 'woo-better-shipping-calculator-for-brazil'),
            array('status' => 400)
        );
    }

    /**
     * O site é um ambiente de desenvolvimento declarado?
     *
     * `wp_get_environment_type()` é o jeito canônico (WP 5.5+): o site diz em
     * que ambiente está, em vez de o plugin adivinhar por `WP_DEBUG`.
     *
     * @return bool
     */
    public static function is_dev_environment(): bool
    {
        return in_array(wp_get_environment_type(), array('local', 'development'), true);
    }

    /**
     * Segue redirect no download?
     *
     * Não. `Plugin_Upgrader` baixa com `wp_safe_remote_get`, que segue até 5
     * redirects — e um redirect a partir do host permitido instalaria outro
     * pacote, de outro host, sem esta checagem. O filtro é registrado só em
     * volta do download e removido em seguida.
     *
     * @param array<string, mixed> $args Argumentos da requisição.
     * @return array<string, mixed>
     */
    public static function block_download_redirects(array $args): array
    {
        $args['redirection'] = 0;

        return $args;
    }

    /**
     * O site consegue escrever em `wp-content/plugins` sem pedir credencial?
     *
     * @return bool
     */
    public static function filesystem_ready(): bool
    {
        if (! function_exists('get_filesystem_method')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
        }

        // `direct` é o único método que permite instalar sem interação: os
        // outros (ftp/ssh) param para pedir usuário e senha, e requisição REST
        // não tem como abrir esse formulário.
        return get_filesystem_method() === 'direct';
    }
}
