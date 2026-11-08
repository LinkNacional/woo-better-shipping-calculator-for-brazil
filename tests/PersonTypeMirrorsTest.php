<?php
/**
 * Regressão: os ESPELHOS do tipo de pessoa (`billing_persontype`, `billing_cpf`,
 * `billing_cnpj`) chegavam VAZIOS no POST quando o documento vinha preenchido do
 * cadastro, e o pedido era barrado com "Tipo de pessoa é obrigatório".
 *
 * Contexto do chamado:
 *   O cliente fez o pedido na época em que se usava o plugin "Brazilian Market on
 *   WooCommerce" (que gravava o CPF nos campos separados) e depois passou a usar só
 *   o woo-better. No checkout o CPF aparece no campo unificado (vem do cadastro),
 *   mas o cliente não digita nada — e os hidden só eram preenchidos no evento de
 *   digitação (JS). Então:
 *
 *     POST = [billing_document => '123.456.789-09', billing_persontype => '', ...]
 *
 *   Quem lê o POST cru (o Brazilian valida em `woocommerce_checkout_process`) não
 *   encontrava o tipo e bloqueava. O paliativo do cliente — apagar e digitar o
 *   último dígito — funcionava porque disparava o JS que preenche os espelhos.
 *
 * Correção: `sync_person_type_mirrors_from_document()` deriva os espelhos do
 * documento no SERVIDOR (filtro `woocommerce_checkout_posted_data`, prioridade 5,
 * antes da validação de terceiros em 10), e o JS do checkout clássico semeia os
 * hidden no carregamento da página.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class PersonTypeMirrorsTest extends WP_UnitTestCase {

    public function set_up(): void {
        parent::set_up();
        update_option( 'woo_better_calc_person_type_select', 'both' );
    }

    public function tear_down(): void {
        unset(
            $_POST['billing_document'],
            $_POST['billing_persontype'],
            $_POST['billing_cpf'],
            $_POST['billing_cnpj']
        );
        parent::tear_down();
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function posted( array $data, array $post = array() ): array {
        $_POST    = $post;
        $_REQUEST = $post;

        return $this->plugin()->sync_person_type_mirrors_from_document( $data );
    }

    /**
     * Roda a sincronização do POST cru (a que acontece antes das validações).
     */
    private function posted_before_validation( array $post ): void {
        $_POST    = $post;
        $_REQUEST = $post;

        $this->plugin()->sync_person_type_mirrors_before_validation();
    }

    /**
     * O caso do chamado: CPF do cadastro, hidden vazios.
     */
    public function test_empty_mirrors_are_filled_from_the_document(): void {
        $result = $this->posted(
            array(
                'billing_document'   => '123.456.789-09',
                'billing_persontype' => '',
                'billing_cpf'        => '',
                'billing_cnpj'       => '',
            ),
            array( 'billing_document' => '123.456.789-09' )
        );

        $this->assertSame( '1', $result['billing_persontype'], 'Sem o tipo, o Brazilian barra com "Tipo de pessoa é obrigatório".' );
        $this->assertSame( '123.456.789-09', $result['billing_cpf'] );
        $this->assertSame( '', $result['billing_cnpj'] );
    }

    /**
     * O POST cru também é atualizado — é dele que o Brazilian lê.
     */
    public function test_the_raw_post_is_updated_for_third_party_validators(): void {
        $this->posted_before_validation(
            array( 'billing_document' => '123.456.789-09', 'billing_persontype' => '' )
        );

        $this->assertSame( '1', $_POST['billing_persontype'] );
        $this->assertSame( '123.456.789-09', $_POST['billing_cpf'] );
    }

    /**
     * ORDEM é o ponto central do bug: `WC_Checkout::process_checkout()` dispara
     * `woocommerce_checkout_process` e SÓ DEPOIS chama `get_posted_data()` (que passa
     * pelo filtro `woocommerce_checkout_posted_data`). Se a sincronização acontecesse
     * apenas no filtro, os validadores de terceiros — o Brazilian valida em
     * `woocommerce_checkout_process` prioridade 10 — já teriam barrado o pedido.
     */
    public function test_sync_runs_before_third_party_validators(): void {
        $plugin = $this->plugin();
        // A instância canônica registra os hooks no bootstrap; aqui registramos os
        // desta instância para poder consultar as prioridades registradas.
        $plugin->run();

        $priority = has_action(
            'woocommerce_checkout_process',
            array( $plugin, 'sync_person_type_mirrors_before_validation' )
        );

        $this->assertSame( 1, $priority, 'A sincronização precisa rodar em woocommerce_checkout_process prioridade 1.' );
        $this->assertLessThan(
            10,
            $priority,
            'Precisa ser anterior à prioridade 10, usada pelo "Brazilian Market on WooCommerce".'
        );

        $this->assertNotFalse(
            has_filter( 'woocommerce_checkout_posted_data', array( $plugin, 'sync_person_type_mirrors_from_document' ) ),
            'O array $data também precisa sair coerente.'
        );
    }

    /**
     * O documento unificado é derivado do POST — e não sobrescrevemos nada quando o
     * campo não foi enviado (checkout que não renderiza o documento).
     */
    public function test_the_raw_post_is_not_touched_without_the_document_field(): void {
        $this->posted_before_validation( array( 'billing_persontype' => '', 'billing_cpf' => '' ) );

        $this->assertSame( '', $_POST['billing_persontype'] );
        $this->assertSame( '', $_POST['billing_cpf'] );
    }

    /**
     * CNPJ alfanumérico curto (IN RFB 2.229/2024) tem 11 caracteres: o tamanho
     * sozinho o classificaria como CPF. Com letra, não adivinhamos nada.
     */
    public function test_alphanumeric_short_document_is_not_taken_as_cpf(): void {
        $result = $this->posted(
            array( 'billing_document' => '12ABC34501D', 'billing_persontype' => '', 'billing_cpf' => '' ),
            array( 'billing_document' => '12ABC34501D' )
        );

        $this->assertSame( '', $result['billing_persontype'] );
        $this->assertSame( '', $result['billing_cpf'] );
    }

    /**
     * Com "apenas pessoa física" o CNPJ não vira espelho (a validação dá a mensagem
     * certa em vez de gravar um tipo proibido).
     */
    public function test_cnpj_is_ignored_when_only_physical_is_enabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $result = $this->posted(
            array( 'billing_document' => '11.222.333/0001-81', 'billing_persontype' => '', 'billing_cnpj' => '' ),
            array( 'billing_document' => '11.222.333/0001-81' )
        );

        $this->assertSame( '', $result['billing_persontype'] );
        $this->assertSame( '', $result['billing_cnpj'] );
    }

    /**
     * CNPJ preenchido com o espelho do CPF ainda com o valor ANTIGO do cadastro
     * (JS não rodou): o documento manda e o espelho do CPF é limpo.
     */
    public function test_document_wins_over_a_stale_opposite_mirror(): void {
        $result = $this->posted(
            array(
                'billing_document'   => '11.222.333/0001-81',
                'billing_persontype' => '',
                'billing_cpf'        => '123.456.789-09',
                'billing_cnpj'       => '',
            ),
            array( 'billing_document' => '11.222.333/0001-81' )
        );

        $this->assertSame( '2', $result['billing_persontype'] );
        $this->assertSame( '11.222.333/0001-81', $result['billing_cnpj'] );
        $this->assertSame( '', $result['billing_cpf'], 'Um cliente não é CPF e CNPJ ao mesmo tempo.' );
    }

    /**
     * Nada a fazer quando o formulário já está coerente.
     */
    public function test_coherent_data_is_left_untouched(): void {
        $data = array(
            'billing_document'   => '123.456.789-09',
            'billing_persontype' => '1',
            'billing_cpf'        => '123.456.789-09',
            'billing_cnpj'       => '',
        );

        $this->assertSame( $data, $this->posted( $data, array( 'billing_document' => '123.456.789-09' ) ) );
        $this->assertArrayNotHasKey( 'billing_persontype', $_POST, 'Sem mudança, nada é escrito no POST.' );
    }

    /**
     * Documento ausente/vazio: não inventa tipo (quem barra é a validação).
     */
    public function test_no_document_means_no_mirrors(): void {
        $result = $this->posted(
            array( 'billing_document' => '', 'billing_persontype' => '', 'billing_cpf' => '', 'billing_cnpj' => '' )
        );

        $this->assertSame( '', $result['billing_persontype'] );
        $this->assertSame( '', $result['billing_cpf'] );
    }

    /**
     * Documento incompleto (nem CPF nem CNPJ): não adivinha.
     */
    public function test_incomplete_document_does_not_guess_the_type(): void {
        $result = $this->posted(
            array( 'billing_document' => '123.456.789', 'billing_persontype' => '', 'billing_cpf' => '' ),
            array( 'billing_document' => '123.456.789' )
        );

        $this->assertSame( '', $result['billing_persontype'] );
        $this->assertSame( '', $result['billing_cpf'] );
    }

    /**
     * Com o recurso desligado os campos são do Brazilian/do tema: não mexemos.
     */
    public function test_disabled_person_type_is_respected(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $result = $this->posted(
            array( 'billing_document' => '123.456.789-09', 'billing_persontype' => '', 'billing_cpf' => '' ),
            array( 'billing_document' => '123.456.789-09' )
        );

        $this->assertSame( '', $result['billing_persontype'] );
    }

    /**
     * O JS do checkout clássico precisa semear os hidden no carregamento — o
     * documento vem preenchido do cadastro e o cliente não digita nada.
     */
    public function test_classic_checkout_js_seeds_the_mirrors_on_load(): void {
        $source = dirname( __DIR__ ) . '/Public/js/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.js';
        $this->assertFileExists( $source );

        $js = file_get_contents( $source );

        $this->assertMatchesRegularExpression(
            '/if \(documentInput\) \{\s*setupFieldEvents\(\);\s*seedHiddenFields\(documentInput\);/',
            $js,
            'O init do checkout clássico deve semear os espelhos a partir do valor já presente no campo.'
        );

        $compiled = dirname( __DIR__ ) . '/Public/jsCompiled/WcBetterShippingCalculatorForBrazilPublicShortcodePersonType.COMPILED.js';
        $this->assertFileExists( $compiled );
        $this->assertStringContainsString(
            '(e.value||"").trim()',
            file_get_contents( $compiled ),
            'Compilado desatualizado: rode npm run build:public.'
        );
    }
}
