<?php
/**
 * Regressão: campo que o formulário NÃO renderizou não pode continuar obrigatório.
 *
 * O `$data` do checkout traz uma chave para TODO campo registrado (mesmo com valor
 * vazio), então o `required` do array de campos barra o pedido mesmo quando o input
 * não existe na tela. Isso acontece em checkouts que montam o formulário pelo próprio
 * layout — o caso do FunnelKit (Aero), que desenha as seções do funil e não renderiza
 * o que não está nele. Sintoma do chamado: cliente PJ barrado com "Por favor, preencha
 * a Inscrição Estadual (IE) ou marque como ISENTO" e o campo invisível.
 *
 * A regra usada: chave AUSENTE do `$_POST` = campo não renderizado (não exigir); campo
 * renderizado e deixado em branco chega como string vazia (continua sendo exigido).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class UnrenderedRequiredFieldsTest extends WP_UnitTestCase {

    /** @var WcBetterShippingCalculatorForBrazil */
    private $plugin;

    public function set_up(): void {
        parent::set_up();

        // Os hooks só existem depois do run() (como no bootstrap do plugin).
        $this->plugin = new WcBetterShippingCalculatorForBrazil();
        $this->plugin->run();

        // `wc_add_notice()` sai cedo (e não emite nada) sem `woocommerce_init` e sem
        // sessão — no bootstrap da suíte eles podem não ter rodado ainda.
        if ( ! did_action( 'woocommerce_init' ) ) {
            do_action( 'woocommerce_init' );
        }
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }
        if ( WC()->session ) {
            WC()->session->set( 'wc_notices', array() );
        }

        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );
        update_option( 'woo_better_calc_number_required', 'yes' );
    }

    public function tear_down(): void {
        $_POST = array();
        parent::tear_down();
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return $this->plugin;
    }

    /**
     * Coleta as mensagens de erro que `wc_add_notice()` emitiria.
     *
     * Não usa `wc_get_notices()` porque ela exige `woocommerce_init` (o bootstrap
     * da suíte roda antes disso).
     */
    private function collect_error_notices( callable $callback ): array {
        $notices = array();
        $collect = function ( $message ) use ( &$notices ) {
            $notices[] = $message;
            return $message;
        };

        add_filter( 'woocommerce_add_error', $collect );
        $callback();
        remove_filter( 'woocommerce_add_error', $collect );

        return $notices;
    }

    /**
     * Roda a validação de campo obrigatório do WooCommerce + a nossa limpeza, na
     * mesma ordem do `WC_Checkout::validate_checkout()`.
     */
    private function validate( array $data ): \WP_Error {
        $errors = new \WP_Error();

        foreach ( $data as $key => $value ) {
            if ( '' === (string) $value ) {
                $errors->add( $key . '_required', $key . ' é um campo obrigatório.' );
            }
        }

        do_action( 'woocommerce_after_checkout_validation', $data, $errors );

        return $errors;
    }

    /**
     * O caso do funil: IE e IM exigidas na lista de campos, mas ausentes do formulário.
     */
    public function test_fields_absent_from_the_form_are_not_required(): void {
        $_POST = array( 'billing_document' => '11.222.333/0001-81' );

        $errors = $this->validate(
            array(
                'billing_country' => 'BR',
                'billing_document' => '11.222.333/0001-81',
                'billing_ie'      => '',
                'billing_im'      => '',
                'billing_number'  => '',
            )
        );

        $this->assertSame( '', $errors->get_error_message( 'billing_ie_required' ), 'IE não renderizada não pode barrar o pedido.' );
        $this->assertSame( '', $errors->get_error_message( 'billing_im_required' ), 'IM não renderizada não pode barrar o pedido.' );
        $this->assertSame( '', $errors->get_error_message( 'billing_number_required' ), 'Número não renderizado não pode barrar o pedido.' );
    }

    /**
     * O contrário: campo que EXISTE na tela e ficou em branco continua obrigatório.
     */
    public function test_rendered_but_empty_fields_stay_required(): void {
        $_POST = array(
            'billing_country'  => 'BR',
            'billing_document' => '11.222.333/0001-81',
            'billing_ie'       => '',
            'billing_number'   => '',
        );

        $errors = $this->validate(
            array(
                'billing_country'  => 'BR',
                'billing_document' => '11.222.333/0001-81',
                'billing_ie'       => '',
                'billing_number'   => '',
            )
        );

        $this->assertNotFalse( $errors->get_error_message( 'billing_ie_required' ) );
        $this->assertNotFalse( $errors->get_error_message( 'billing_number_required' ) );
    }

    /**
     * Campos de OUTROS plugins/tema não são tocados pela rede de segurança.
     */
    public function test_third_party_required_fields_are_untouched(): void {
        $_POST = array( 'billing_country' => 'BR' );

        $errors = $this->validate(
            array(
                'billing_country'   => 'BR',
                'billing_vat_number' => '',
            )
        );

        $this->assertNotFalse(
            $errors->get_error_message( 'billing_vat_number_required' ),
            'A rede de segurança só age nos campos gerenciados pelo plugin.'
        );
    }

    /**
     * Nossa validação de IE/IM também não pode exigir campo que não foi enviado.
     */
    public function test_state_registration_validation_skips_unrendered_fields(): void {
        $_POST = array(
            'billing_document' => '11.222.333/0001-81',
        );

        $plugin = $this->plugin();

        $notices = $this->collect_error_notices(
            function () use ( $plugin ) {
                $plugin->validate_ie_field_value_classic();
                $plugin->validate_im_field_value_classic();
            }
        );

        $this->assertEmpty( $notices, 'Sem o campo no formulário, a validação do plugin não pode emitir aviso.' );
    }

    /**
     * Mas se o campo foi enviado vazio, a mensagem do plugin continua aparecendo.
     */
    public function test_state_registration_validation_still_warns_when_the_field_is_empty(): void {
        $_POST = array(
            'billing_document' => '11.222.333/0001-81',
            'billing_ie'       => '',
            'billing_im'       => '',
        );

        $plugin = $this->plugin();

        $notices = $this->collect_error_notices(
            function () use ( $plugin ) {
                $plugin->validate_ie_field_value_classic();
                $plugin->validate_im_field_value_classic();
            }
        );

        $this->assertNotEmpty( $notices, 'IE/IM enviadas em branco precisam ser cobradas.' );
    }
}
