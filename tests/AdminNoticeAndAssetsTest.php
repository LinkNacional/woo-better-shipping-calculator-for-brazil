<?php
/**
 * Regressão: card de novidades e entrega dos bundles de admin (release 5.2.0).
 *
 * Dois problemas reais que este teste trava:
 *
 *  1. O card de novidades anunciava recursos que NÃO entraram nesta versão
 *     (Inscrição Municipal e o novo fluxo de Telefone/Celular são da 5.1.0).
 *     Ele deve listar apenas o que a versão realmente entrega — o campo de RG.
 *
 *  2. Os bundles de admin eram enfileirados com a CONSTANTE de versão como
 *     cache-busting. Como eles são recompilados sem que a versão mude
 *     (iterações dentro da mesma release), o navegador seguia rodando o
 *     arquivo antigo e o ajuste no `join` do RG "não aparecia" após refresh.
 *     A versão precisa vir do mtime do arquivo.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;

class AdminNoticeAndAssetsTest extends WP_UnitTestCase {

    private function plugin_file(): string {
        return dirname( __DIR__ ) . '/Includes/WcBetterShippingCalculatorForBrazil.php';
    }

    private function main_file(): string {
        return dirname( __DIR__ ) . '/wc-better-shipping-calculator-for-brazil.php';
    }

    /**
     * Recorta o bloco do card de atualização (usuário veterano).
     */
    private function update_notice_markup(): string {
        $php = file_get_contents( $this->plugin_file() );

        $inicio = strpos( $php, 'Card de Atualização / Changelog' );
        $this->assertNotFalse( $inicio, 'O card de atualização deve existir.' );

        $fim = strpos( $php, 'AJAX handler para dispensar o notice', $inicio );
        $this->assertNotFalse( $fim, 'O fim do card de atualização deve existir.' );

        return substr( $php, $inicio, $fim - $inicio );
    }

    public function test_notice_anuncia_o_campo_de_rg() {
        $markup = $this->update_notice_markup();

        $this->assertStringContainsString(
            'Campo de RG',
            $markup,
            'A versão adiciona o campo de RG — ele precisa estar no card de novidades.'
        );
    }

    public function test_notice_nao_anuncia_recursos_de_versoes_anteriores() {
        $markup = $this->update_notice_markup();

        $this->assertStringNotContainsString(
            'Inscrição Municipal',
            $markup,
            'A Inscrição Municipal (IM) é da 5.1.0 — não pode aparecer como novidade desta versão.'
        );

        $this->assertStringNotContainsString(
            'Telefone e Celular',
            $markup,
            'O novo fluxo de Telefone/Celular é da 5.1.0 — não pode aparecer como novidade desta versão.'
        );
    }

    public function test_card_de_novidades_esta_ativo() {
        $main = file_get_contents( $this->main_file() );

        $this->assertMatchesRegularExpression(
            "/define\(\s*'WC_BETTER_SHIPPING_NEW_FEATURES'\s*,\s*true\s*\)/",
            $main,
            'A constante precisa estar em `true`, senão o card não é exibido para usuários veteranos.'
        );

        $this->assertTrue(
            WC_BETTER_SHIPPING_NEW_FEATURES,
            'A constante carregada em runtime também precisa ser `true`.'
        );
    }

    public function test_bundles_de_admin_usam_mtime_e_nao_a_constante() {
        $php = file_get_contents( $this->plugin_file() );

        $this->assertStringContainsString(
            '$asset_version(',
            $php,
            'Os bundles de admin devem usar a versão baseada em mtime.'
        );

        foreach ( array( 'AdminLayout', 'AdminSettings' ) as $bundle ) {
            $this->assertMatchesRegularExpression(
                "/'[^']*" . $bundle . "\.COMPILED\.js',\s*array\(\),\s*\\\$asset_version\(/",
                $php,
                "O bundle {$bundle} precisa enfileirar com \$asset_version(...) e não com a constante de versão."
            );
        }
    }

    public function test_asset_version_le_o_mtime_do_arquivo() {
        $arquivo = dirname( __DIR__ ) . '/Admin/jsCompiled/WcBetterShippingCalculatorForBrazilAdminSettings.COMPILED.js';

        $this->assertFileExists( $arquivo, 'O bundle compilado deve existir (rode `npm run build:admin`).' );
        $this->assertGreaterThan( 0, filemtime( $arquivo ), 'O mtime deve ser legível para servir de cache-busting.' );
    }
}
