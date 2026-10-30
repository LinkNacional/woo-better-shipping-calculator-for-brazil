<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

// Prevent direct access
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Portão das opções exclusivas da versão PRO.
 *
 * O plugin gratuito EXIBE todos os campos da versão PRO (para o usuário
 * conhecer o recurso e poder mexer na interface), mas:
 *
 * - o valor enviado nunca é salvo: em `guard_settings()` os campos marcados
 *   com `'pro' => true` saem da lista entregue ao
 *   `WC_Admin_Settings::save_fields()` e a opção volta ao `default` declarado;
 * - nenhuma lógica é executada (a implementação vive apenas no plugin PRO);
 * - cada bloco PRO (e cada card de campo dentro dele) recebe a pílula
 *   vermelha `PRO`, que aponta para a página comercial (constante abaixo,
 *   ainda sem URL definitiva).
 *
 * O portão abre com DUAS condições: o plugin PRO ativo (constante de versão
 * definida) **e** a licença dele em vigor. Com o PRO ativo mas sem licença os
 * campos continuam bloqueados — ver `is_pro_unlocked()`.
 *
 * @since 5.2.0
 */
class WcBetterShippingCalculatorForBrazilAdminProGate
{
    /**
     * URL da página comercial da versão PRO.
     *
     * Pode ser trocada por filtro (`wc_better_shipping_calculator_pro_upgrade_url`)
     * ou pela constante `WC_BETTER_SHIPPING_CALCULATOR_PRO_UPGRADE_URL`.
     */
    public const UPGRADE_URL = 'https://www.linknacional.com.br/wordpress/woocommerce/checkout-brasileiro/';

    /**
     * Preço de entrada da licença (piso da faixa inicial).
     *
     * Só o número, sem período: o valor efetivo é anual e varia com o volume de
     * pedidos da loja, então exibir "R$ 10,00/ano" passaria a impressão de preço
     * fechado. O card apresenta como "a partir de".
     *
     * Ver `license_price()`.
     */
    public const LICENSE_PRICE = '10';

    /**
     * Constante definida pelo plugin PRO quando ele está ativo.
     */
    public const PRO_VERSION_CONSTANT = 'WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_PRO_VERSION';

    /**
     * A versão PRO está ativa neste site?
     *
     * O plugin PRO é um plugin separado: quando ativo, ele define a própria
     * constante de versão. O filtro existe para permitir cenários de teste
     * (ou de PRO embutida em outro plugin).
     *
     * @return bool
     */
    public static function is_pro_active(): bool
    {
        $active = defined(self::PRO_VERSION_CONSTANT);

        return (bool) apply_filters('wc_better_shipping_calculator_is_pro_active', $active);
    }

    /**
     * Arquivo principal do plugin PRO (basename relativo a `WP_PLUGIN_DIR`).
     */
    public const PRO_BASENAME = 'woo-better-shipping-calculator-for-brazil-pro/woo-better-shipping-calculator-for-brazil-pro.php';

    /**
     * Classe que responde "a licença do PRO está em vigor?".
     *
     * É o `Manager` do módulo `Includes/License/` do PRO (copiado entre os dois
     * PROs, então o nome muda junto com o namespace). Perguntar para o próprio
     * PRO é o que evita duplicar aqui a regra da licença — policy, cert, prazo.
     */
    public const PRO_LICENSE_MANAGER = 'Lkn\\WcBetterShippingCalculatorForBrazilPro\\Includes\\License\\Manager';

    /**
     * Instância do `Manager` do PRO nesta requisição.
     *
     * `null` = ainda não perguntei.
     *
     * @var object|null
     */
    private static $pro_license_manager = null;

    /**
     * Os recursos do PRO estão LIBERADOS nesta instalação?
     *
     * Duas condições, e as duas importam:
     *
     *  1. o plugin PRO está ATIVO — sem isso nenhum código dele roda;
     *  2. a licença do PRO está EM VIGOR — sem isso o PRO também não roda: ele
     *     não registra nenhum hook de recurso (`define_public_hooks()` sai antes
     *     quando `features_enabled()` é falso).
     *
     * A pergunta era só a primeira, e por isso a tela mentia: bastava instalar o
     * zip do PRO e ativá-lo — sem licença nenhuma — para as pílulas PRO sumirem,
     * o banner de aviso desaparecer e os campos PRO passarem pelo
     * `guard_settings()` e serem GRAVADOS. O lojista configurava um recurso que
     * não existia no checkout.
     *
     * @return bool
     */
    public static function is_pro_unlocked(): bool
    {
        $unlocked = self::is_pro_active() && self::license_in_force();

        return (bool) apply_filters('wc_better_shipping_calculator_is_pro_unlocked', $unlocked);
    }

    /**
     * A licença do PRO está em vigor neste site? (pergunta ao próprio PRO)
     *
     * `features_enabled()` é decisão local — options + assinatura do `cert`,
     * sem chamada de rede —, então serve para desenhar a tela sem custo.
     *
     * @return bool
     */
    private static function license_in_force(): bool
    {
        if (! class_exists(self::PRO_LICENSE_MANAGER)) {
            // PRO ativo mas sem o módulo de licença (namespace renomeado?):
            // fecha o portão. Abrir por padrão seria dar o PRO de graça em
            // qualquer cenário em que a classe não carregue.
            return false;
        }

        if (null === self::$pro_license_manager) {
            $class = self::PRO_LICENSE_MANAGER;

            // O SINGLETON do PRO, não uma instância paralela. `activate_key()` e
            // `deactivate_site()` zeram o `state_cache` do singleton; uma cópia
            // aqui ficaria com o estado do começo da requisição. Importa porque o
            // pop-up de compra ativa a licença e, na sequência do mesmo
            // request, a tela pode ser desenhada.
            self::$pro_license_manager = method_exists($class, 'instance')
                ? $class::instance()
                : new $class();
        }

        return method_exists(self::$pro_license_manager, 'features_enabled')
            && (bool) self::$pro_license_manager->features_enabled();
    }

    /**
     * O plugin PRO está INSTALADO neste site (ativo ou não)?
     *
     * `is_pro_active()` responde "está carregado"; esta pergunta é outra:
     * desativar o plugin NÃO apaga os arquivos, então ele continua instalado —
     * e a tela não pode voltar a oferecer a compra só porque o lojista desativou
     * o PRO (era o que acontecia: card de compra e card promocional apareciam
     * juntos, cada um dizendo uma coisa).
     *
     * Detecção em dois passos, do barato para o caro:
     *
     *  1. o arquivo principal no caminho canônico (`PRO_BASENAME`);
     *  2. `get_plugins()`, porque reinstalações repetidas renomeiam a pasta
     *     (`...-pro-1`, `...-pro-2`) — só em admin, para não arrastar o
     *     `wp-admin/includes/plugin.php` em requisição de front.
     *
     * @return bool
     */
    public static function is_pro_installed(): bool
    {
        $installed = self::is_pro_active();

        if (! $installed && file_exists(WP_PLUGIN_DIR . '/' . self::PRO_BASENAME)) {
            $installed = true;
        }

        if (! $installed && (is_admin() || wp_doing_ajax())) {
            if (! function_exists('get_plugins') && is_readable(ABSPATH . 'wp-admin/includes/plugin.php')) {
                require_once ABSPATH . 'wp-admin/includes/plugin.php';
            }

            if (function_exists('get_plugins')) {
                $slug = dirname(self::PRO_BASENAME);

                foreach (array_keys((array) get_plugins()) as $plugin_file) {
                    // Pasta renomeada por reinstalação: mesmo plugin, sufixo no nome.
                    if ($plugin_file === self::PRO_BASENAME || 0 === strpos($plugin_file, $slug . '/') || 0 === strpos($plugin_file, $slug . '-')) {
                        $installed = true;
                        break;
                    }
                }
            }
        }

        return (bool) apply_filters('wc_better_shipping_calculator_is_pro_installed', $installed);
    }

    /**
     * A tela deve exibir o card BRANCO de compra (plugin + licença)?
     *
     * O sidebar tem dois cartões, e cada um responde a uma pergunta — nunca as
     * duas ao mesmo tempo (era o bug: PRO instalado e desativado deixava
     * `is_pro_active()` falso e os dois cartões apareciam juntos):
     *
     *  - branco (aqui): "quer o PRO?" -> só enquanto o plugin PRO **não** está
     *    instalado. Com o PRO instalado (ativo ou não) o caminho da licença é o
     *    bloco "Licença" que o próprio PRO injeta nesta tela, e quem quer
     *    conhecer o produto tem o card roxo ao lado;
     *  - roxo ("Conheça mais", no template): "quer ver o que é?" -> aparece
     *    sempre, instalado ou não, ativo ou não; é o link para a página
     *    comercial.
     *
     * Instalar **não** licencia (o PRO nasce bloqueado): a decisão aqui é a
     * PRESENÇA do plugin, não a licença.
     *
     * @return bool
     */
    public static function should_offer_purchase(): bool
    {
        return (bool) apply_filters(
            'wc_better_shipping_calculator_should_offer_purchase',
            ! self::is_pro_installed()
        );
    }

    /**
     * URL da página comercial da versão PRO.
     *
     * @return string
     */
    public static function upgrade_url(): string
    {
        $url = self::UPGRADE_URL;

        if (defined('WC_BETTER_SHIPPING_CALCULATOR_PRO_UPGRADE_URL')) {
            $url = (string) constant('WC_BETTER_SHIPPING_CALCULATOR_PRO_UPGRADE_URL');
        }

        return (string) apply_filters('wc_better_shipping_calculator_pro_upgrade_url', $url);
    }

    /**
     * Preço de entrada da licença, como texto (ex.: `10`).
     *
     * É o piso da tabela, não o preço final: a licença contabiliza o número de
     * pedidos do período, então o valor sobe conforme o volume de vendas da
     * loja. Fica aqui (e não no template) para ter uma fonte só do upsell —
     * quando a API de billing passar a responder os planos, este método troca
     * de origem e o card continua igual.
     *
     * @return string Valor sem símbolo de moeda nem período.
     */
    public static function license_price(): string
    {
        return (string) apply_filters('wc_better_shipping_calculator_pro_license_price', self::LICENSE_PRICE);
    }

    /**
     * O campo/bloco é exclusivo da versão PRO?
     *
     * @param array $definition Definição do campo ou do bloco (type `title`).
     * @return bool
     */
    public static function is_pro_definition(array $definition): bool
    {
        return ! empty($definition['pro']);
    }

    /**
     * Deve exibir a pílula `PRO` para esta definição?
     *
     * A pílula só faz sentido enquanto o recurso está bloqueado — ou seja,
     * enquanto o PRO não está ativo COM licença (`is_pro_unlocked()`).
     *
     * @param array $definition Definição do campo ou do bloco.
     * @return bool
     */
    public static function should_render_pill(array $definition): bool
    {
        return self::is_pro_definition($definition) && ! self::is_pro_unlocked();
    }

    /**
     * Ajusta a lista de campos antes de salvar.
     *
     * Com o PRO liberado (ativo E licenciado), devolve tudo (o salvamento
     * nativo do WooCommerce cuida do resto). Fora disso, remove os campos PRO da
     * lista (o que o usuário digitou é descartado) e regrava o `default` de cada
     * um deles — inclusive com o PRO instalado e ativo mas SEM licença, quando o
     * PRO não executa nenhuma lógica e salvar seria só perder a configuração.
     *
     * @param array $settings Campos da página de configurações.
     * @return array Campos que realmente serão salvos.
     */
    public static function guard_settings(array $settings): array
    {
        if (self::is_pro_unlocked()) {
            return $settings;
        }

        $allowed = array();

        foreach ($settings as $key => $field) {
            if (! is_array($field) || ! self::is_pro_definition($field)) {
                $allowed[$key] = $field;
                continue;
            }

            self::restore_default($field);
        }

        return $allowed;
    }

    /**
     * Regrava o `default` declarado de um campo PRO.
     *
     * @param array $field Definição do campo.
     * @return void
     */
    private static function restore_default(array $field): void
    {
        $option_id = isset($field['id']) ? (string) $field['id'] : '';

        // Campos somente de leitura (`is_option => false`) não são opções.
        if ('' === $option_id || (isset($field['is_option']) && false === $field['is_option'])) {
            return;
        }

        $default = array_key_exists('default', $field) ? $field['default'] : '';

        update_option($option_id, $default);
    }
}
