<?php
/**
 * Regressão: a página de configurações não pode ganhar rolagem horizontal.
 *
 * O defeito: com muitas abas, o nav (`flex-wrap: nowrap`, uma aba por bloco)
 * inflava o `min-content` do bloco inteiro. `.admin-layout-content` é item de
 * flex e o mínimo automático de um item de flex é `min-content`, então o
 * conteúdo ficava mais largo que a tela e o DOCUMENTO ganhava barra horizontal
 * — mesmo com o `overflow: hidden` do `.admin-layout-top-menu-clip` escondendo
 * as abas que sobravam (ele corta a pintura, não o mínimo). No wp-admin isso
 * aparece porque `#wpbody-content` usa `overflow: visible !important`.
 *
 * Duas travas garantem o conserto, e as duas são testadas aqui:
 *
 *  1. `min-width: 0` no `.admin-layout-content` — deixa o flex encolher até a
 *     largura do pai em vez de parar no `min-content`;
 *  2. as setas do carrossel ficam DENTRO da caixa do nav quando há o que rolar.
 *     Elas eram `left/right: -30px`, e um elemento posicionado 30px para fora
 *     conta para o overflow do ancestral (que no wp-admin é visível).
 *
 * O teste lê o CSS FONTE e o COMPILADO: o plugin carrega o `.COMPILED.css`, e
 * `npm run build:css` é fácil de esquecer.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;

class AdminLayoutOverflowTest extends WP_UnitTestCase {

    /**
     * Folhas de estilo do layout (fonte e compilada).
     *
     * @return array<string, string> apelido => caminho absoluto.
     */
    private function stylesheets(): array {
        $root = dirname( __DIR__ );

        return array(
            'fonte'    => $root . '/Admin/css/WcBetterShippingCalculatorForBrazilAdminLayoutSettings.css',
            'compilado' => $root . '/Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminLayoutSettings.COMPILED.css',
        );
    }

    /**
     * Corpo das declarações de um seletor (primeira ocorrência).
     *
     * @param string $css      Conteúdo da folha.
     * @param string $selector Seletor (regex, sem as chaves).
     *
     * @return string Declarações, ou '' quando o seletor não existe.
     */
    private function declarations( string $css, string $selector ): string {
        if ( ! preg_match( '/' . $selector . '\s*\{([^}]*)\}/', $css, $m ) ) {
            return '';
        }

        return $m[1];
    }

    /**
     * O `.admin-layout-content` precisa poder encolher abaixo do min-content.
     *
     * Sem isso, o nav de abas alarga a página inteira (é o bug relatado).
     */
    public function test_conteudo_pode_encolher_abaixo_do_min_content(): void {
        foreach ( $this->stylesheets() as $apelido => $arquivo ) {
            $this->assertFileExists( $arquivo, $apelido . ' deveria existir (rode `npm run build:css`).' );

            $css     = (string) file_get_contents( $arquivo );
            $bloco   = $this->declarations( $css, '\.admin-layout-content' );

            $this->assertNotSame( '', $bloco, $apelido . ': regra `.admin-layout-content` não encontrada.' );
            $this->assertMatchesRegularExpression(
                '/min-width:\s*0(?:px)?\b/',
                $bloco,
                $apelido . ': `.admin-layout-content` precisa de `min-width: 0` — item de flex com o padrão '
                . '`min-width: auto` não encolhe abaixo do `min-content` e a página ganha rolagem horizontal.'
            );
            $this->assertMatchesRegularExpression( '/display:\s*flex/', $bloco, $apelido . ': esperado `display: flex`.' );
        }
    }

    /**
     * As setas do carrossel não podem pender para fora da caixa do nav.
     *
     * São elas que estouravam a largura da página em janelas estreitas.
     */
    public function test_setas_do_carrossel_ficam_dentro_da_caixa(): void {
        foreach ( $this->stylesheets() as $apelido => $arquivo ) {
            $css = (string) file_get_contents( $arquivo );

            // O recuo que abre espaço para as setas, só quando há carrossel.
            $outer = $this->declarations( $css, '\.admin-layout-top-menu-outer\.has-overflow' );

            $this->assertNotSame( '', $outer, $apelido . ': falta a regra `.admin-layout-top-menu-outer.has-overflow`.' );
            $this->assertMatchesRegularExpression(
                '/padding:[^;}]*30px/',
                $outer,
                $apelido . ': com o carrossel ativo a caixa do nav precisa reservar o espaço das setas.'
            );

            foreach ( array( 'prev' => 'left', 'next' => 'right' ) as $lado => $propriedade ) {
                $seta = $this->declarations(
                    $css,
                    '\.admin-layout-top-menu-outer\.has-overflow\s+\.admin-layout-nav-arrow--' . $lado
                );

                $this->assertNotSame( '', $seta, $apelido . ': falta o reposicionamento da seta `' . $lado . '`.' );
                $this->assertMatchesRegularExpression(
                    '/' . $propriedade . ':\s*0(?:px)?\b/',
                    $seta,
                    $apelido . ': a seta `' . $lado . '` precisa de `' . $propriedade . ': 0` (dentro da caixa); '
                    . 'offset negativo conta para o overflow do documento.'
                );
            }
        }
    }

    /**
     * O layout só carrega o CSS COMPILADO.
     *
     * Se alguém "consertar" apenas o fonte, o site continua com o bug — e este
     * teste avisa antes do deploy.
     */
    public function test_a_tela_carrega_o_css_compilado(): void {
        $root = dirname( __DIR__ );

        $this->assertStringContainsString(
            'Admin/cssCompiled/WcBetterShippingCalculatorForBrazilAdminLayoutSettings.COMPILED.css',
            (string) file_get_contents( $root . '/Includes/WcBetterShippingCalculatorForBrazil.php' ),
            'A página de configurações enfileira o `.COMPILED.css`: ele é o que roda em produção.'
        );
    }
}
