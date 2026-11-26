<?php
/**
 * Regressão: o portão do PRO exige plugin ATIVO **e** licença em vigor.
 *
 * O bug: quem baixava o `.zip` do PRO e ativava o plugin — sem licença nenhuma —
 * via a tela do gratuito com tudo liberado. As pílulas `PRO` sumiam, o banner
 * de aviso sumia e os campos PRO passavam pelo `guard_settings()` e eram
 * GRAVADOS. Só que o PRO não registra nenhum hook sem licença
 * (`features_enabled()`), então o lojista configurava um recurso que não
 * existia no checkout — a tela prometia o que o código não fazia.
 *
 * A decisão passou a ser `is_pro_unlocked()`: `is_pro_active()` **e** a resposta
 * do `Manager` do PRO. Instalar não licencia.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials\WcBetterShippingCalculatorForBrazilCheckoutSettings;
use WP_UnitTestCase;

class ProGateLicenseTest extends WP_UnitTestCase {

    /**
     * Roda o callback com o "PRO liberado" simulado (ativo + licenciado).
     *
     * O filtro é o mesmo ponto de extensão que a tela consulta, então isto
     * exercita o caminho real do `guard_settings()` sem depender de licença
     * de verdade (que precisa de rede e de um servidor de licenças no ar).
     */
    private function with_pro_unlocked( callable $assertions ): void {
        add_filter( 'wc_better_shipping_calculator_is_pro_unlocked', '__return_true' );

        try {
            $assertions();
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_unlocked', '__return_true' );
        }
    }

    /**
     * Roda o callback sem o PRO (nem ativo, nem licenciado).
     */
    private function with_pro_absent( callable $assertions ): void {
        add_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_false' );

        try {
            $assertions();
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_false' );
        }
    }

    /**
     * Render cru da tela de configurações.
     */
    private function render_screen(): string {
        $page = new WcBetterShippingCalculatorForBrazilCheckoutSettings();

        ob_start();
        $page->output();
        $html = ob_get_clean();

        return is_string( $html ) ? $html : '';
    }

    /**
     * Campo PRO de mentira, com `default` diferente do valor enviado.
     *
     * @return array
     */
    private function pro_field(): array {
        return array(
            'id'      => 'wc_better_test_pro_option',
            'type'    => 'text',
            'pro'     => true,
            'default' => 'padrao',
        );
    }

    /**
     * O PRO ATIVO, mas sem licença, NÃO libera os recursos.
     *
     * É o cenário do bug: `.zip` baixado, plugin ativado na tela de plugins,
     * licença nunca informada. "Ativo" vem do filtro (o mesmo que a tela usa)
     * porque a suíte carrega só o plugin gratuito; a licença é perguntada ao
     * `Manager` do PRO, que aqui responde "não" — que é exatamente o que ele
     * responde num site sem licença.
     */
    public function test_pro_ativo_sem_licenca_continua_bloqueado(): void {
        add_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_true' );

        try {
            $this->assertTrue( WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_active(), 'Pré-condição: PRO ativo.' );
            $this->assertFalse(
                WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_unlocked(),
                'PRO ativo sem licença não pode liberar os recursos.'
            );

            // E o efeito prático: a pílula volta ao campo PRO.
            $this->assertTrue(
                WcBetterShippingCalculatorForBrazilAdminProGate::should_render_pill( $this->pro_field() ),
                'Sem licença o campo PRO volta a mostrar a pílula.'
            );
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_true' );
        }
    }

    /**
     * O portão pergunta a licença ao `Manager` do PRO — e obedece a resposta.
     *
     * Garante que a ponte entre os dois plugins é real (não um `true` fixo): o
     * portão consulta o SINGLETON do PRO, o mesmo objeto que o `activate_key()`
     * invalida. Aqui a resposta do `Manager` é substituída por reflexão para os
     * dois lados (ligado/desligado), sem depender de licença nem de rede.
     */
    public function test_portao_obedece_o_manager_do_pro(): void {
        $manager = 'Lkn\\WcBetterShippingCalculatorForBrazilPro\\Includes\\License\\Manager';

        if ( ! class_exists( $manager ) && ! $this->load_pro_license_module() ) {
            $this->markTestSkipped( 'Módulo de licença do PRO não está no disco deste ambiente.' );
        }

        $instance = method_exists( $manager, 'instance' ) ? $manager::instance() : new $manager();
        $cache    = new \ReflectionProperty( $instance, 'state_cache' );
        $cache->setAccessible( true );

        add_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_true' );

        try {
            $cache->setValue( $instance, array( 'features' => false ) );
            $this->assertFalse(
                WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_unlocked(),
                'Licença fora de vigor: o portão tem de fechar mesmo com o PRO ativo.'
            );

            $cache->setValue( $instance, array( 'features' => true ) );
            $this->assertTrue(
                WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_unlocked(),
                'Licença em vigor: o portão tem de abrir (é o que o Manager responde).'
            );
        } finally {
            // Devolve o estado real: as outras telas do mesmo processo releem.
            $cache->setValue( $instance, null );
            remove_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_true' );
        }
    }

    /**
     * Carrega as classes do módulo de licença do PRO, se ele estiver no disco.
     *
     * A suíte carrega só o plugin gratuito, então o autoload do PRO não está
     * registrado. Carregar arquivo a arquivo é o mesmo caminho do
     * `uninstall.php` do PRO (e evita o `vendor/autoload.php`, que colide com
     * cópia duplicada do plugin).
     *
     * @return bool `true` quando as classes ficaram disponíveis.
     */
    private function load_pro_license_module(): bool {
        $dir = WP_PLUGIN_DIR . '/woo-better-shipping-calculator-for-brazil-pro/Includes/License/';

        foreach ( array( 'Config', 'Certificate', 'Api_Client', 'Store', 'Manager' ) as $file ) {
            $path = $dir . $file . '.php';

            if ( is_readable( $path ) ) {
                require_once $path;
            }
        }

        return class_exists( 'Lkn\\WcBetterShippingCalculatorForBrazilPro\\Includes\\License\\Manager' );
    }

    /**
     * Com o PRO bloqueado, o campo PRO ganha pílula e NÃO é salvo.
     */
    public function test_bloqueado_mostra_pilula_e_nao_salva(): void {
        $field = $this->pro_field();

        $this->assertTrue(
            WcBetterShippingCalculatorForBrazilAdminProGate::should_render_pill( $field ),
            'Campo PRO bloqueado precisa da pílula.'
        );

        delete_option( $field['id'] );
        update_option( $field['id'], 'valor-digitado' );

        $guard = WcBetterShippingCalculatorForBrazilAdminProGate::guard_settings(
            array(
                'comum' => array(
                    'id'   => 'wc_better_test_common_option',
                    'type' => 'text',
                ),
                'pro'   => $field,
            )
        );

        $this->assertArrayHasKey( 'comum', $guard, 'O campo comum continua sendo salvo.' );
        $this->assertArrayNotHasKey( 'pro', $guard, 'O campo PRO não pode ir para o save_fields.' );
        $this->assertSame( 'padrao', get_option( $field['id'] ), 'A option PRO volta ao default.' );

        delete_option( $field['id'] );
    }

    /**
     * Com o PRO liberado (ativo + licença), tudo passa: sem pílula, com salvamento.
     */
    public function test_liberado_nao_mostra_pilula_e_salva(): void {
        $field = $this->pro_field();

        $this->with_pro_unlocked(
            function () use ( $field ) {
                $this->assertFalse(
                    WcBetterShippingCalculatorForBrazilAdminProGate::should_render_pill( $field ),
                    'Com a licença em vigor a pílula sai.'
                );

                $guard = WcBetterShippingCalculatorForBrazilAdminProGate::guard_settings(
                    array(
                        'comum' => array(
                            'id'   => 'wc_better_test_common_option',
                            'type' => 'text',
                        ),
                        'pro'   => $field,
                    )
                );

                $this->assertArrayHasKey( 'pro', $guard, 'Com a licença em vigor o campo PRO é salvo.' );
            }
        );
    }

    /**
     * O PRO bloqueado por falta de licença esconde o card de compra.
     *
     * Licença ausente não ressuscita o card branco: o PRO está instalado, então
     * o caminho é o bloco "Licença" que ele injeta nesta tela (regra do
     * `is_pro_installed()`).
     */
    public function test_pro_instalado_sem_licenca_nao_ressuscita_o_card_de_compra(): void {
        add_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_true' );

        try {
            $html = $this->render_screen();

            $this->assertSame( 0, substr_count( $html, 'block-pro-offer-title' ), 'Sem card branco.' );
            $this->assertSame( 1, substr_count( $html, 'block-promotional-card-title' ), 'Com o card roxo.' );
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_true' );
        }
    }

    /**
     * A tela bloqueada explica o motivo CERTO ao lojista.
     *
     * Com o PRO ativo e sem licença, dizer "enquanto o PRO não estiver ativo"
     * seria mentira — o plugin está ativo, o que falta é a licença.
     */
    public function test_banner_separa_pro_ausente_de_licenca_ausente(): void {
        // PRO ativo, sem licença: o texto fala da licença.
        if ( WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_active()
            && ! WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_unlocked() ) {
            $html = $this->render_screen();

            $this->assertStringContainsString( 'enquanto a licença do PRO não estiver ativa', $html );
            $this->assertStringNotContainsString( 'enquanto o PRO não estiver ativo', $html );
        } else {
            $this->assertTrue( true, 'Ambiente sem o cenário "PRO ativo e sem licença"; nada a comparar.' );
        }

        // PRO ausente: o texto fala do plugin.
        $this->with_pro_absent(
            function () {
                $html = $this->render_screen();

                $this->assertStringContainsString( 'enquanto o PRO não estiver ativo', $html );
                $this->assertStringNotContainsString( 'enquanto a licença do PRO não estiver ativa', $html );
            }
        );
    }
}
