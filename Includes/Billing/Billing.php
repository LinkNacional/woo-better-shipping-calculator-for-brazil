<?php
/**
 * Módulo de compra da licença PRO.
 *
 * O plugin gratuito é quem conversa com o cliente: abre o pop-up, manda os
 * dados de pagamento para a API de cobrança, instala o `.zip` e grava a chave
 * no plugin PRO.
 *
 * ── O que NÃO passa por aqui ──────────────────────────────────────────────
 * Nada de dado sensível fica neste site. O número do cartão vai do navegador
 * direto para a API de cobrança (HTTPS) e nunca é gravado, nem no navegador
 * nem no banco do WordPress. O que sobra aqui é a chave de licença — que é
 * pública para o dono da loja, é dele.
 *
 * ── Duas cópias ───────────────────────────────────────────────────────────
 * Este módulo é copiado no `shipping-simulator-for-woocommerce` (mesma
 * estrutura, namespace diferente), como já acontece com `Includes/License/`
 * dos PROs. O que muda entre as cópias está só na constante `CONFIG` de
 * `config()` — slug do produto, option da licença e basename do PRO.
 *
 * @package WcBetterShippingCalculatorForBrazil\Includes\Billing
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing;

// Impede acesso direto.
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Configuração do fluxo de compra e o boot dos hooks.
 */
final class Billing
{
    /** Versão do módulo (cache-busting dos assets próprios). */
    public const VERSION = '1.0.0';

    /**
     * A versão do asset sai do `filemtime`, não de `VERSION`.
     *
     * `VERSION` é fixa: só muda quando alguém lembra de bumpá-la. Sem isso o
     * navegador continua servindo o JS antigo depois de atualizar o plugin, e um
     * JS antigo fala o contrato antigo da API — o pop-up passa a receber 404
     * (`unknown_product`) porque o campo do produto mudou de nome.
     */
    private static function asset_version( string $file ): string {
        $path = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_DIR . 'Includes/Billing/assets/' . $file;
        $time = is_readable( $path ) ? filemtime( $path ) : false;

        return false === $time ? self::VERSION : self::VERSION . '.' . $time;
    }

    /** Prefixo/namespace das rotas REST. */
    public const REST_NAMESPACE = 'lkn-billing/v1';

    /**
     * Token público embutido no `.zip`.
     *
     * NÃO é senha: qualquer pessoa que baixe o plugin lê este valor. Serve só
     * para a API separar o tráfego do plugin do tráfego aleatório — quem
     * protege de verdade é o rate limit e o antifraude do PSP.
     */
    public const FREE_TOKEN = 'free-sbx-3f9a1c77d0b24e58a6c1';

    /**
     * Configuração desta cópia.
     *
     * @return array<string, mixed>
     */
    public static function config(): array
    {
        /**
         * URL da API de cobrança.
         *
         * Em produção aponta para o serviço da Link Nacional. Em
         * desenvolvimento (`WP_DEBUG`) vai para a instância local, para não
         * precisar de túnel só para testar o pop-up.
         */
        $api_url = defined('LKN_BILLING_API_URL')
            ? (string) constant('LKN_BILLING_API_URL')
            : ((defined('WP_DEBUG') && WP_DEBUG) ? 'http://localhost:8100' : 'https://billing.linknacional.com.br');

        return array(
            /**
             * Slug do produto na API de cobrança e na de licenças.
             *
             * É o nome da PASTA do plugin PRO — o mesmo `PRO_BASENAME` usado
             * para instalar/ativar logo abaixo, só sem o `/arquivo.php`.
             * Derivar daqui, e não de um apelido digitado à mão
             * (`woo-better-pro`), mantém os dois lados falando do MESMO
             * plugin: o `.zip` que o pop-up instala é
             * `woo-better-shipping-calculator-for-brazil-pro.zip` e a licença
             * é emitida para `woo-better-shipping-calculator-for-brazil-pro`.
             */
            'product' => dirname(
                \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::PRO_BASENAME
            ),
            /** Nome exibido no pop-up. */
            'product_name' => __('Campos Checkout Brasileiro PRO', 'woo-better-shipping-calculator-for-brazil'),
            /** Option da chave de licença, lida pelo plugin PRO. */
            'license_option' => 'woo_better_pro_license_key',
            /**
             * Options de estado do PRO, limpas na ativação para forçar
             * revalidação imediata (`state()` vira `unverified` e o
             * `maybe_check()` reconsulta em vez de esperar 24h).
             */
            'license_state_options' => array(
                'woo_better_pro_license_result',
                'woo_better_pro_license_last_error',
            ),
            /** Option de timestamp da última checagem (zerada na ativação). */
            'license_last_check_option' => 'woo_better_pro_license_last_check',
            /** Basename do plugin PRO (arquivo principal). Fonte: ProGate. */
            'pro_basename' => \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::PRO_BASENAME,
            /**
             * Manager de licença do PRO. É ele quem sabe ativar (chamada à API,
             * token, cert, estado); este módulo NÃO reimplementa isso.
             */
            'manager_class' => '\\Lkn\\WcBetterShippingCalculatorForBrazilPro\\Includes\\License\\Manager',
            /** API de cobrança, sem barra no final. */
            'api_url' => rtrim($api_url, '/'),
            /** Texto de apoio do rodapé do pop-up. */
            'support_url' => 'https://www.linknacional.com.br/wordpress/woocommerce/checkout-brasileiro/',
        );
    }

    /**
     * Registra os hooks do módulo.
     *
     * Chamado uma vez pelo plugin principal.
     *
     * @return void
     */
    public static function boot(): void
    {
        Rest::boot();
    }

    /**
     * Enfileira os assets do pop-up (só na tela onde ele existe).
     *
     * @return void
     */
    public static function enqueue(): void
    {
        // O pop-up não deve reinstalar o que já está no disco: instalado é
        // instalado, com o plugin ativo ou desativado (`class_exists` e a
        // constante de versão só valem com o PRO carregado).
        $config = self::config();
        $pro_installed = \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_installed();
        $base = WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Includes/Billing/assets/';

        wp_enqueue_style(
            'wc-better-calc-billing',
            $base . 'billing.css',
            array(),
            self::asset_version( 'billing.css' ),
            'all'
        );

        wp_enqueue_script(
            'wc-better-calc-billing',
            $base . 'billing.js',
            array(),
            self::asset_version( 'billing.js' ),
            true
        );

        // `wp_localize_script` converte escalar para string (`false` vira "" e
        // `true` vira "1"), o que funciona por acaso no JS. `wp_json_encode` preserva
        // o tipo — o `proInstalled` chega booleano de verdade.
        wp_add_inline_script(
            'wc-better-calc-billing',
            'window.lknBilling = ' . wp_json_encode(
                array(
                'apiUrl' => $config['api_url'],
                'product' => $config['product'],
                'proInstalled' => (bool) $pro_installed,
                'productName' => $config['product_name'],
                'freeToken' => self::FREE_TOKEN,
                // SEM barra no fim: o JS concatena `/install` e `/activate`.
                // Com barra aqui a URL virava `.../lkn-billing/v1//install`, e o
                // WordPress respondia `rest_no_route` (404) — instalar e ativar
                // nunca funcionaram.
                'restUrl' => esc_url_raw(rest_url(self::REST_NAMESPACE)),
                'nonce' => wp_create_nonce('wp_rest'),
                'supportUrl' => $config['support_url'],
                'settingsUrl' => self::settings_url(),
                'i18n' => array(
                    'title' => __('Adquirir a licença PRO', 'woo-better-shipping-calculator-for-brazil'),
                    'stepEmail' => __('Para onde enviamos a licença?', 'woo-better-shipping-calculator-for-brazil'),
                    'email' => __('E-mail', 'woo-better-shipping-calculator-for-brazil'),
                    'chooseMethod' => __('Como você quer pagar?', 'woo-better-shipping-calculator-for-brazil'),
                    'chooseMethodRequired' => __('Escolha Pix ou cartão de crédito para continuar.', 'woo-better-shipping-calculator-for-brazil'),
                    'methodUnavailable' => __('Esta forma de pagamento não está disponível agora. Escolha outra.', 'woo-better-shipping-calculator-for-brazil'),
                    'pix' => __('Pix', 'woo-better-shipping-calculator-for-brazil'),
                    'pixHint' => __('Aprovação imediata. Aponte a câmera para o QR code.', 'woo-better-shipping-calculator-for-brazil'),
                    'card' => __('Cartão de crédito', 'woo-better-shipping-calculator-for-brazil'),
                    'cardHint' => __('Cobrança na hora, na fatura do cartão.', 'woo-better-shipping-calculator-for-brazil'),
                    'fullName' => __('Nome completo', 'woo-better-shipping-calculator-for-brazil'),
                    'taxId' => __('CPF ou CNPJ', 'woo-better-shipping-calculator-for-brazil'),
                    'cardNumber' => __('Número do cartão', 'woo-better-shipping-calculator-for-brazil'),
                    'cardHolder' => __('Nome impresso no cartão', 'woo-better-shipping-calculator-for-brazil'),
                    'cardExpiry' => __('Validade (MM/AA)', 'woo-better-shipping-calculator-for-brazil'),
                    'cardCvv' => __('Código de segurança', 'woo-better-shipping-calculator-for-brazil'),
                    'installments' => __('Parcelas', 'woo-better-shipping-calculator-for-brazil'),
                    'next' => __('Continuar', 'woo-better-shipping-calculator-for-brazil'),
                    'back' => __('Voltar', 'woo-better-shipping-calculator-for-brazil'),
                    'pay' => __('Pagar', 'woo-better-shipping-calculator-for-brazil'),
                    'copyPix' => __('Copiar código Pix', 'woo-better-shipping-calculator-for-brazil'),
                    'copied' => __('Copiado', 'woo-better-shipping-calculator-for-brazil'),
                    'waitingPayment' => __('Aguardando o pagamento. Esta tela se atualiza sozinha.', 'woo-better-shipping-calculator-for-brazil'),
                    'paid' => __('Pagamento aprovado', 'woo-better-shipping-calculator-for-brazil'),
                    'fulfilling' => __('Pagamento aprovado. Preparando sua licença…', 'woo-better-shipping-calculator-for-brazil'),
                    'installing' => __('Instalando…', 'woo-better-shipping-calculator-for-brazil'),
                    'activate' => __('Ativar licença', 'woo-better-shipping-calculator-for-brazil'),
                    'activating' => __('Ativando…', 'woo-better-shipping-calculator-for-brazil'),
                    'manualDownload' => __('Baixar o .zip e instalar manualmente', 'woo-better-shipping-calculator-for-brazil'),
                    'retry' => __('Tentar de novo', 'woo-better-shipping-calculator-for-brazil'),
                    'close' => __('Fechar', 'woo-better-shipping-calculator-for-brazil'),
                    'genericError' => __('Não foi possível concluir agora. Tente de novo em instantes.', 'woo-better-shipping-calculator-for-brazil'),
                    'rateLimited' => __('Muitas tentativas em pouco tempo. Aguarde um instante e tente de novo.', 'woo-better-shipping-calculator-for-brazil'),
                    'offlineError' => __('Não conseguimos falar com o servidor de pagamento. Verifique sua conexão e recarregue a página.', 'woo-better-shipping-calculator-for-brazil'),
                    'setupError' => __('Esta compra não está disponível agora. Fale com o suporte.', 'woo-better-shipping-calculator-for-brazil'),
                    'cardInvalid' => __('Confira os dados do cartão.', 'woo-better-shipping-calculator-for-brazil'),
                    'paidInFull' => __('à vista', 'woo-better-shipping-calculator-for-brazil'),
                    'installPlugin' => __('Instalar plugin', 'woo-better-shipping-calculator-for-brazil'),
                    'pluginInstalled' => __('Plugin instalado', 'woo-better-shipping-calculator-for-brazil'),
                    'licenseActive' => __('Licença ativa!', 'woo-better-shipping-calculator-for-brazil'),
                    'cvvInvalid' => __('Confira o código de segurança do cartão.', 'woo-better-shipping-calculator-for-brazil'),
                    'holderInvalid' => __('Informe o nome impresso no cartão.', 'woo-better-shipping-calculator-for-brazil'),
                    'expiryInvalid' => __('Confira a validade do cartão (MM/AA).', 'woo-better-shipping-calculator-for-brazil'),
                    'emailInvalid' => __('Informe um e-mail válido.', 'woo-better-shipping-calculator-for-brazil'),
                    'taxIdInvalid' => __('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).', 'woo-better-shipping-calculator-for-brazil'),
                    'nameInvalid' => __('Informe o nome completo do titular.', 'woo-better-shipping-calculator-for-brazil'),
                ),
                )
            ) . ';',
            'before'
        );
    }

    /**
     * Bloco do nav que a tela de configuração deve abrir depois do fluxo.
     *
     * O fluxo termina com a licença ativa e o PRO instalado; o próximo passo
     * natural é configurar o recurso que acabou de ser comprado, não a primeira
     * aba da tela. "Prazo de Entrega" é o recurso PRO do plugin (é o que o card
     * de compra anuncia), então o link final cai direto nele.
     *
     * Filtrável porque o dia em que este plugin tiver outro recurso PRO como
     * carro-chefe basta apontar para outro bloco, sem tocar no resto.
     */
    public const LANDING_BLOCK = 'pro_prazo_entrega';

    /**
     * URL da tela de configuração do plugin (destino do link final).
     *
     * Leva `lkn_open`, que o template do layout interpreta para abrir o bloco
     * direto: o nav é controlado por JS (as abas não têm `href` de âncora), então
     * uma URL com `#bloco` não levaria a lugar nenhum.
     *
     * @return string
     */
    public static function settings_url(): string
    {
        $url = admin_url('admin.php?page=wc-settings&tab=wc-better-calc-checkout');

        $block = (string) apply_filters('wc_better_shipping_calculator_landing_block', self::LANDING_BLOCK);

        if ('' === $block) {
            return $url;
        }

        return add_query_arg('lkn_open', rawurlencode($block), $url);
    }
}
