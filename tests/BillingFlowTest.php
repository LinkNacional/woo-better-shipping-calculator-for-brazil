<?php
/**
 * Regressão do módulo de compra (pop-up + rotas REST).
 *
 * O que estes testes travam, em ordem de gravidade:
 *
 *  1. `normalize_key()` NÃO pode filtrar para `[A-Za-z0-9]`. O dígito
 *     verificador da chave é módulo 37 e o alfabeto inclui `*`, `~`, `$`, `=`
 *     e `U`: uma chave em cada ~7 termina com símbolo, e limpar a chave apaga
 *     o verificador — a licença legítima vira `invalid_key` sem explicação.
 *  2. O download só é aceito de host confiável (nossa API ou o próprio site).
 *  3. As duas rotas mudam estado, então são `POST` e exigem capacidade.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Billing;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Rest;
use WP_UnitTestCase;
use WP_REST_Request;

class BillingFlowTest extends WP_UnitTestCase {

    public function test_normalize_key_preserva_o_digito_verificador(): void {
        // `$` é um verificador válido (alfabeto módulo 37). Se a normalização
        // remover este caractere, a chave correta passa a ser recusada.
        $this->assertSame(
            'SSPKQXZQRA5MSZJG3YGA4MHZQK08Y1KQS$',
            Rest::normalize_key( 'SSP-KQXZQ-RA5MS-ZJG3Y-GA4MH-ZQK08-Y1KQS-$' )
        );

        foreach ( array( '*', '~', '$', '=', 'U' ) as $symbol ) {
            $key = 'WBP-AAAAA-BBBBB-CCCCC-DDDDD-EEEEE-' . $symbol;
            $this->assertStringEndsWith(
                $symbol,
                Rest::normalize_key( $key ),
                "O verificador `{$symbol}` foi perdido na normalização."
            );
        }
    }

    public function test_normalize_key_corrige_ambiguidades_do_crockford(): void {
        // O cliente cola do e-mail e confunde I/L com 1 e O com 0.
        // `ILO` -> `1`, `1`, `0` (o `L` também é ambíguo, não só o `I`).
        $this->assertSame( 'WBP110', Rest::normalize_key( 'wbp-ilo' ) );
        $this->assertSame( 'WBP113', Rest::normalize_key( ' wbp-1l3 ' ) );
    }

    public function test_aceita_download_do_host_da_api(): void {
        $this->assertTrue(
            Rest::is_allowed_download_host(
                'https://billing.linknacional.com.br/v1/billing/downloads/x.zip',
                'https://billing.linknacional.com.br'
            )
        );
    }

    public function test_aceita_download_servido_pelo_proprio_site(): void {
        // Cenário do ambiente de teste: o `.zip` sai de `uploads/`. O WordPress
        // recusa baixar de host diferente do site, então este caminho é o que
        // permite testar a instalação automática sem túnel.
        // https explícito: o teste roda em ambiente `production` (sem
        // WP_ENVIRONMENT_TYPE), onde a exceção de http não vale.
        $url = 'https://' . wp_parse_url( home_url(), PHP_URL_HOST ) . '/wp-content/uploads/lkn-downloads/x.zip';

        $this->assertTrue( Rest::is_allowed_download_host( $url, 'https://billing.linknacional.com.br' ) );
    }

    public function test_recusa_download_de_host_estranho(): void {
        $result = Rest::is_allowed_download_host(
            'https://site-malicioso.example/x.zip',
            'https://billing.linknacional.com.br'
        );

        $this->assertInstanceOf( \WP_Error::class, $result );
        $this->assertSame( 'lkn_billing_bad_url', $result->get_error_code() );
    }

    public function test_recusa_http_quando_a_api_e_https(): void {
        // O zip é INSTALADO e ATIVADO: em http qualquer um no caminho troca o
        // pacote. A exceção vale só para site declarado de desenvolvimento.
        if ( Rest::is_dev_environment() ) {
            $this->assertTrue(
                Rest::is_allowed_download_host(
                    'http://billing.linknacional.com.br/x.zip',
                    'http://billing.linknacional.com.br'
                )
            );
            return;
        }

        $result = Rest::is_allowed_download_host(
            'http://billing.linknacional.com.br/x.zip',
            'http://billing.linknacional.com.br'
        );

        $this->assertInstanceOf( \WP_Error::class, $result );
        $this->assertSame( 'lkn_billing_insecure_url', $result->get_error_code() );
    }

    public function test_nao_segue_redirect_no_download(): void {
        // Redirect a partir do host permitido instalaria pacote de outro host.
        $args = Rest::block_download_redirects( array( 'timeout' => 30 ) );

        $this->assertSame( 0, $args['redirection'] );
        $this->assertSame( 30, $args['timeout'] );
    }

    public function test_recusa_esquema_que_nao_e_http(): void {
        foreach ( array( 'ftp://billing.linknacional.com.br/x.zip', 'file:///etc/passwd' ) as $url ) {
            $result = Rest::is_allowed_download_host( $url, 'https://billing.linknacional.com.br' );
            $this->assertInstanceOf( \WP_Error::class, $result, $url );
        }
    }

    public function test_recusa_porta_diferente_do_host_da_api(): void {
        // Mesmo host, porta diferente: não é o nosso serviço.
        $result = Rest::is_allowed_download_host(
            'https://billing.linknacional.com.br:8443/x.zip',
            'https://billing.linknacional.com.br'
        );

        $this->assertInstanceOf( \WP_Error::class, $result );
    }

    public function test_rotas_existem_e_sao_post(): void {
        $routes = rest_get_server()->get_routes();

        $install = $routes['/lkn-billing/v1/install'] ?? array();
        $activate = $routes['/lkn-billing/v1/activate'] ?? array();

        $this->assertNotEmpty( $install, 'Rota de instalação não registrada.' );
        $this->assertNotEmpty( $activate, 'Rota de ativação não registrada.' );

        foreach ( array( $install, $activate ) as $handlers ) {
            $methods = $handlers[0]['methods'] ?? array();
            $this->assertArrayHasKey( 'POST', (array) $methods );
            $this->assertArrayNotHasKey( 'GET', (array) $methods );
        }
    }

    public function test_instalar_exige_poder_de_instalar_plugin(): void {
        wp_set_current_user( 0 );

        $request = new WP_REST_Request( 'POST', '/lkn-billing/v1/install' );
        $request->set_param( 'download_url', 'https://billing.linknacional.com.br/x.zip' );

        $response = rest_do_request( $request );

        $this->assertSame( 401, $response->get_status() );
    }

    public function test_ativar_recusa_chave_curta_antes_de_qualquer_rede(): void {
        wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

        $result = Rest::activate( $this->request( 'abc' ) );

        $this->assertInstanceOf( \WP_Error::class, $result );
        $this->assertSame( 'lkn_billing_invalid_key', $result->get_error_code() );
    }

    public function test_config_aponta_para_o_produto_deste_plugin(): void {
        $config = Billing::config();

        // O slug do produto é o nome da PASTA do PRO — derivado do mesmo
        // `pro_basename` que instala o `.zip`. Um apelido escrito à mão aqui
        // divergiria do que a API de licenças conhece.
        $this->assertSame( dirname( $config['pro_basename'] ), $config['product'] );
        $this->assertSame( 'woo_better_pro_license_key', $config['license_option'] );
        $this->assertStringContainsString( 'woo-better-shipping-calculator-for-brazil-pro/', $config['pro_basename'] );
        $this->assertNotSame( '', $config['api_url'] );
        // A URL nunca termina com barra: o JS concatena `/v1/...`.
        $this->assertStringEndsNotWith( '/', $config['api_url'] );
    }

    /**
     * @param string $key Chave.
     */
    private function request( string $key ): WP_REST_Request {
        $request = new WP_REST_Request( 'POST', '/lkn-billing/v1/activate' );
        $request->set_param( 'license_key', $key );

        return $request;
    }
}
