<?php
/**
 * Regressão: todo asset COMPILADO referenciado no PHP deve existir no disco.
 *
 * Bug corrigido: a página "Minha conta > editar endereço" (edit-address) enfileirava
 * `cssCompiled/WcBetterShippingCalculatorForBrazilCheckoutPhoneMask.COMPILED.css`, um
 * arquivo REMOVIDO no commit do "novo fluxo dos campos de telefone e celular". O
 * enqueue continuava apontando para o caminho antigo, gerando um
 * `net::ERR_ABORTED 404 (Not Found)` na tela.
 *
 * Este teste varre os arquivos PHP e verifica que cada `cssCompiled/...`/`jsCompiled/...`
 * referenciado existe no diretório do plugin correspondente, pegando essa classe de
 * erro (asset renomeado/removido com referência órfã) antes de ir para produção.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;

class EnqueuedAssetsExistTest extends WP_UnitTestCase {

    /**
     * Diretórios de código que referenciam assets compilados (relativos à raiz do plugin).
     */
    private const CODE_DIRS = array( 'Includes', 'Public', 'Admin' );

    public function test_all_referenced_compiled_assets_exist(): void {
        $plugin_root = dirname( __DIR__ );
        $missing     = array();

        foreach ( self::CODE_DIRS as $dir ) {
            $path = $plugin_root . '/' . $dir;

            if ( ! is_dir( $path ) ) {
                continue;
            }

            $iterator = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator( $path, \FilesystemIterator::SKIP_DOTS )
            );

            foreach ( $iterator as $file ) {
                if ( ! $file->isFile() || 'php' !== strtolower( $file->getExtension() ) ) {
                    continue;
                }

                $contents = (string) file_get_contents( $file->getPathname() );

                // Captura referências a assets compilados, com ou sem diretório
                // prefixado: 'cssCompiled/xxx.css', 'jsCompiled/xxx.js' ou
                // 'Admin/jsCompiled/xxx.js'.
                if ( ! preg_match_all( '#(?:[A-Za-z]+/)?(?:css|js)Compiled/[A-Za-z0-9_.\-]+\.(?:css|js)#', $contents, $matches ) ) {
                    continue;
                }

                foreach ( array_unique( $matches[0] ) as $relative ) {
                    // A referência pode ser relativa ao diretório do próprio arquivo
                    // (`plugin_dir_url(__FILE__) . 'cssCompiled/...'`) OU à raiz do
                    // plugin (`WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_URL . 'Admin/jsCompiled/...'`).
                    $candidates = array(
                        $file->getPath() . '/' . $relative,
                        $plugin_root . '/' . $relative,
                    );

                    $exists = false;
                    foreach ( $candidates as $candidate ) {
                        if ( file_exists( $candidate ) ) {
                            $exists = true;
                            break;
                        }
                    }

                    if ( ! $exists ) {
                        $missing[] = str_replace( $plugin_root . '/', '', $file->getPathname() ) . ' → ' . $relative;
                    }
                }
            }
        }

        $this->assertSame(
            array(),
            $missing,
            "Assets compilados referenciados mas inexistentes (rode o build ou corrija o caminho):\n - " . implode( "\n - ", $missing )
        );
    }
}
