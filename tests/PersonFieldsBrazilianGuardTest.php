<?php
/**
 * Regressão: avisos de "campo obrigatório" do plugin "Brazilian Market on
 * WooCommerce" para TIPO DE PESSOA, CPF, CNPJ e IE no checkout CLÁSSICO/shortcode,
 * com o woo-better ativo junto.
 *
 * Contexto do bug:
 *   O `valid_checkout_fields()` do Brazilian (hook `woocommerce_checkout_process`,
 *   prioridade 10) valida o POST CRU dos campos DELE (`billing_persontype`,
 *   `billing_cpf`, `billing_cnpj`, `billing_ie`). No woo-better esses campos são
 *   ESPELHOS escondidos do campo unificado `billing_document`, preenchidos pelo
 *   nosso JS — quando ele não roda (autofill do navegador, checkout de terceiros
 *   como o FunnelKit Aero, erro de script) o pedido era BLOQUEADO com
 *   "CPF/Person type/State Registration is a required field", mesmo com o
 *   documento preenchido.
 *
 * Regra: com o recurso de tipo de pessoa ligado no woo-better, a validação dele é a
 * que vale; com o recurso desligado, o Brazilian segue no comando.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class PersonFieldsBrazilianGuardTest extends WP_UnitTestCase {

    /**
     * Avisos exatos gerados pelo Brazilian (sem tradução, como ficam com o text
     * domain não carregado). Hardcoded de propósito: se a string do Brazilian mudar,
     * o teste quebra e o guard é revisado.
     */
    private const BRAZILIAN_NOTICES = array(
        'person_type' => '<strong>Person type</strong> is a required field.',
        'cpf'         => '<strong>CPF</strong> is a required field.',
        'cnpj'        => '<strong>CNPJ</strong> is a required field.',
        'ie'          => '<strong>State Registration</strong> is a required field.',
        'rg'          => '<strong>RG</strong> is a required field.',
    );

    public function set_up(): void {
        parent::set_up();

        // O guard casa a mensagem EXATA do Brazilian, montada com `__()` no text
        // domain dele. Fixar o locale em en_US mantém as duas pontas (a mensagem
        // semeada aqui e a que o plugin monta) no mesmo idioma — com o pt_BR
        // carregado a comparação deixaria de valer e o teste falharia sem bug.
        add_filter( 'locale', array( $this, 'force_english_locale' ) );
    }

    public function force_english_locale( $locale ) {
        return 'en_US';
    }

    private function ensure_session() {
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        if ( ! WC()->session ) {
            $this->markTestSkipped( 'Sessão do WooCommerce indisponível no ambiente de testes.' );
        }

        return WC()->session;
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function seed_error_notices( array $messages ): void {
        $error = array();
        foreach ( $messages as $message ) {
            $error[] = array( 'notice' => $message, 'data' => array() );
        }

        $this->ensure_session()->set( 'wc_notices', array( 'error' => $error ) );
    }

    /**
     * @return array Mensagens de erro restantes na sessão.
     */
    private function error_notices(): array {
        $notices = $this->ensure_session()->get( 'wc_notices', array() );
        $messages = array();

        if ( ! empty( $notices['error'] ) && is_array( $notices['error'] ) ) {
            foreach ( $notices['error'] as $notice ) {
                $messages[] = (string) $notice['notice'];
            }
        }

        return $messages;
    }

    public function tear_down(): void {
        unset( $_POST['billing_document'], $_POST['billing_cpf'] );
        remove_filter( 'locale', array( $this, 'force_english_locale' ) );
        parent::tear_down();
    }

    private function manage_person_type(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );
    }

    public function test_brazilian_person_type_and_document_notices_are_removed_when_we_manage_the_fields(): void {
        $this->manage_person_type();

        $this->seed_error_notices( array(
            self::BRAZILIAN_NOTICES['person_type'],
            self::BRAZILIAN_NOTICES['cpf'],
            self::BRAZILIAN_NOTICES['cnpj'],
            self::BRAZILIAN_NOTICES['ie'],
        ) );

        $this->plugin()->guard_brazilian_person_fields_required();

        $this->assertSame( array(), $this->error_notices(), 'Com o tipo de pessoa ligado no woo-better, os avisos do Brazilian não podem bloquear o envio.' );
    }

    public function test_other_notices_are_preserved(): void {
        $this->manage_person_type();

        $this->seed_error_notices( array(
            self::BRAZILIAN_NOTICES['cpf'],
            '<strong>Nome</strong> é um campo obrigatório.',
            '<strong>E-mail</strong> is a required field.',
        ) );

        $this->plugin()->guard_brazilian_person_fields_required();

        $this->assertSame(
            array( '<strong>Nome</strong> é um campo obrigatório.', '<strong>E-mail</strong> is a required field.' ),
            $this->error_notices(),
            'Só os avisos dos campos que o woo-better gerencia podem sair.'
        );
    }

    public function test_ie_notice_is_kept_when_our_ie_field_is_disabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_ie_field', 'no' );

        $this->seed_error_notices( array( self::BRAZILIAN_NOTICES['ie'] ) );

        $this->plugin()->guard_brazilian_person_fields_required();

        $this->assertSame(
            array( self::BRAZILIAN_NOTICES['ie'] ),
            $this->error_notices(),
            'Sem o nosso campo de IE, a exigência do Brazilian continua valendo.'
        );
    }

    public function test_nothing_is_removed_when_we_do_not_manage_person_type(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $this->seed_error_notices( array(
            self::BRAZILIAN_NOTICES['person_type'],
            self::BRAZILIAN_NOTICES['cpf'],
            self::BRAZILIAN_NOTICES['cnpj'],
            self::BRAZILIAN_NOTICES['ie'],
        ) );

        $this->plugin()->guard_brazilian_person_fields_required();

        $this->assertCount( 4, $this->error_notices(), 'Com o recurso desligado, os campos do Brazilian estão na tela e ele segue no comando.' );
    }
}
