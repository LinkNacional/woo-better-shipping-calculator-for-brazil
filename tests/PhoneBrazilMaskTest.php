<?php
/**
 * Regressão: MÁSCARA BRASILEIRA sem a lib/DDI.
 *
 * Cenário do chamado: com a opção "Telefone com Máscara e DDI" DESLIGADA e o
 * plugin ainda gerenciando o telefone ("Permitir Telefone Celular e Fixo",
 * "Somente Celular" ou "Somente Fixo"), o campo continua formatado — só que
 * apenas no padrão brasileiro (fixo/celular), SEM bandeira e SEM seletor de país.
 *
 * No backend isso significa:
 *   - `is_phone_brazil_mask_active()` ligado (e `is_phone_mask_active()` desligado);
 *   - o telefone do pedido continua sendo normalizado em E.164 com o DDI do Brasil
 *     (+55), como no modo com lib;
 *   - a opção "Validar Número de Telefone" passa a valer SEM a lib, validando
 *     apenas números do Brasil;
 *   - no modo "Desabilitar" nada muda (o telefone não é do plugin).
 *
 * A máscara em si (digitação) é coberta em tests/js/brazil-phone-mask.test.js.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;
use Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic;

class PhoneBrazilMaskTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    /**
     * Garante sessão do WC + `woocommerce_init` disparado (pré-requisitos de
     * `wc_add_notice()`/notices de validação).
     */
    private function ensure_wc_ready() {
        if ( ! WC()->session ) {
            WC()->session = new \WC_Session_Handler();
            WC()->session->init();
        }

        if ( ! did_action( 'woocommerce_init' ) ) {
            do_action( 'woocommerce_init' );
        }

        if ( ! WC()->session ) {
            $this->markTestSkipped( 'Sessão do WooCommerce indisponível no ambiente de testes.' );
        }

        WC()->session->set( 'wc_notices', array() );

        return WC()->session;
    }

    private function error_notices(): array {
        $notices = WC()->session ? WC()->session->get( 'wc_notices', array() ) : array();

        return isset( $notices['error'] ) ? $notices['error'] : array();
    }

    private function invoke_private( string $method, array $args ) {
        $ref = new \ReflectionMethod( WcBetterShippingCalculatorForBrazil::class, $method );
        $ref->setAccessible( true );

        return $ref->invokeArgs( $this->plugin(), $args );
    }

    private function normalize_phone( string $phone, string $country_code = '' ): string {
        $order = new \WC_Order();
        $order->set_billing_phone( $phone );

        $this->invoke_private( 'normalize_order_phone', array( $order, 'billing', $country_code ) );

        return (string) $order->get_billing_phone();
    }

    // --- Estado da opção ----------------------------------------------------

    public function test_brazil_mask_is_active_when_mask_option_is_off(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        $this->assertTrue( $this->invoke_private( 'is_phone_brazil_mask_active', array() ) );
        $this->assertFalse( $this->invoke_private( 'is_phone_mask_active', array() ) );
    }

    public function test_brazil_mask_is_off_when_mask_option_is_on(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );

        $this->assertFalse( $this->invoke_private( 'is_phone_brazil_mask_active', array() ) );
        $this->assertTrue( $this->invoke_private( 'is_phone_mask_active', array() ) );
    }

    public function test_brazil_mask_is_off_in_unmanaged_modes(): void {
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        $this->assertFalse( $this->invoke_private( 'is_phone_brazil_mask_active', array() ) );

        update_option( 'woo_better_calc_phone_mode', 'disabled_native' );
        $this->assertFalse( $this->invoke_private( 'is_phone_brazil_mask_active', array() ) );
    }

    // --- Bundle enfileirado (checkout clássico e edit-address) --------------

    /**
     * @dataProvider mask_script_fixtures
     */
    public function test_phone_mask_script_for( string $mode, string $mask, string $expected, string $msg ): void {
        $this->assertSame(
            $expected,
            WcBetterShippingCalculatorForBrazilPublic::phone_mask_script_for( $mode, $mask ),
            $msg
        );
    }

    public static function mask_script_fixtures(): array {
        return array(
            'Com a lib/DDI ligada usa o bundle completo' => array(
                'phone_and_cellphone', 'yes',
                'WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskShortcode',
                'Com a máscara/DDI ligada o campo precisa do intl-tel-input.',
            ),
            'Sem a lib usa o bundle LEVE (só máscara BR)' => array(
                'phone_and_cellphone', 'no',
                'WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskBrazil',
                'Sem a lib basta a máscara brasileira (bundle leve).',
            ),
            'Somente Celular sem a lib usa o bundle leve' => array(
                'cellphone_only', 'no',
                'WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskBrazil',
                'O campo "Celular" também recebe a máscara BR.',
            ),
            'Somente Fixo sem a lib usa o bundle leve' => array(
                'landline_only', 'no',
                'WcBetterShippingCalculatorForBrazilCheckoutPhoneMaskBrazil',
                'O telefone fixo também recebe a máscara BR.',
            ),
            '"Deixar a configuração nativa" não enfileira nada' => array(
                'disabled', 'no', '',
                'Nesse modo o telefone não é do plugin.',
            ),
            '"Desabilitar o campo de telefone" não enfileira nada' => array(
                'disabled_native', 'yes', '',
                'Sem campo de telefone não há o que formatar (nem com a lib ligada).',
            ),
        );
    }

    // --- Labels no checkout em blocos ---------------------------------------

    /**
     * O JS dos blocos monta a própria label. O sufixo "(opcional)" tem que vir
     * traduzido (domínio do WooCommerce, o mesmo texto que os campos nativos usam).
     */
    public function test_phone_fields_config_has_the_optional_label(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $config = $this->phone_fields_config();

        $this->assertArrayHasKey( 'optionalLabel', $config );
        // Texto no domínio do WooCommerce (o mesmo dos campos nativos); o idioma do
        // ambiente define a tradução, então comparamos com a própria string.
        $this->assertSame( ' (' . __( 'optional', 'woocommerce' ) . ')', $config['optionalLabel'] );
        $this->assertSame( 'Celular/Telefone', $config['phoneLabel'], 'No "Celular e Fixo" o campo principal aceita os dois tipos.' );
        $this->assertSame( 'Celular', $config['cellphoneLabel'] );
    }

    public function test_phone_fields_config_labels_follow_the_mode(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $this->assertSame( 'Telefone', $this->phone_fields_config()['phoneLabel'] );

        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        $this->assertSame( 'Celular', $this->phone_fields_config()['phoneLabel'] );
    }

    /**
     * Payload `WooBetterPhoneFieldsData` (o que o JS dos blocos recebe).
     *
     * @return array
     */
    private function phone_fields_config(): array {
        $public = new WcBetterShippingCalculatorForBrazilPublic( 'wc-better-shipping-calculator-for-brazil', '5.3.0' );

        return $public->phone_fields_config();
    }

    // --- Métodos usados no enqueue não podem faltar -------------------------

    public function test_phone_mode_is_managed(): void {
        $this->assertTrue( WcBetterShippingCalculatorForBrazilPublic::phone_mode_is_managed( 'phone_and_cellphone' ) );
        $this->assertTrue( WcBetterShippingCalculatorForBrazilPublic::phone_mode_is_managed( 'cellphone_only' ) );
        $this->assertTrue( WcBetterShippingCalculatorForBrazilPublic::phone_mode_is_managed( 'landline_only' ) );
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::phone_mode_is_managed( 'disabled' ) );
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::phone_mode_is_managed( 'disabled_native' ) );
    }

    /**
     * Guarda de regressão: o enqueue do checkout em BLOCOS chamava
     * `$this->phone_mode_hides_native_option()` — método PRIVADO do Includes — e
     * derrubava a página com "Call to undefined method". Nenhuma chamada
     * `$this->metodo()`/`self::metodo()` pode apontar para método inexistente.
     */
    public function test_public_class_has_no_orphan_method_calls(): void {
        $orphans = $this->orphan_method_calls(
            dirname( __DIR__ ) . '/Public/WcBetterShippingCalculatorForBrazilPublic.php',
            new WcBetterShippingCalculatorForBrazilPublic( 'wc-better-shipping-calculator-for-brazil', '5.3.0' )
        );

        $this->assertSame( array(), $orphans, 'Chamadas a métodos inexistentes: ' . implode( ', ', $orphans ) );
    }

    public function test_includes_class_has_no_orphan_method_calls(): void {
        $orphans = $this->orphan_method_calls(
            dirname( __DIR__ ) . '/Includes/WcBetterShippingCalculatorForBrazil.php',
            $this->plugin()
        );

        $this->assertSame( array(), $orphans, 'Chamadas a métodos inexistentes: ' . implode( ', ', $orphans ) );
    }

    /**
     * Lista as chamadas `$this->x()` / `self::x()` do arquivo sem método na classe.
     *
     * @param string $file     Arquivo PHP da classe.
     * @param object $instance Instância da classe (para o reflection).
     * @return string[]
     */
    private function orphan_method_calls( string $file, $instance ): array {
        $src = (string) file_get_contents( $file );

        preg_match_all( '/\$this\s*->\s*([A-Za-z_][A-Za-z0-9_]*)\s*\(/', $src, $this_calls );
        preg_match_all( '/\b(?:self|static)::([A-Za-z_][A-Za-z0-9_]*)\s*\(/', $src, $self_calls );

        $names = array_unique( array_merge( $this_calls[1], $self_calls[1] ) );
        $class = new \ReflectionClass( $instance );

        $orphans = array();
        foreach ( $names as $name ) {
            if ( ! $class->hasMethod( $name ) ) {
                $orphans[] = $name;
            }
        }

        return array_values( $orphans );
    }

    // --- Placeholder (descreve o que se DIGITA, sem o +55) ------------------

    public function test_placeholder_of_the_cellphone_has_no_ddi_without_the_lib(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $plugin = $this->plugin();

        $billing = $plugin->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );
        $this->assertSame( '(00) 00000-0000', $billing['billing_cellphone']['placeholder'] );

        // Cobrança e entrega têm a MESMA regra — a assimetria é onde um `kind`
        // esquecido passaria despercebido.
        $shipping = $plugin->add_cellphone_shipping_fields( array( 'shipping_phone' => array( 'type' => 'tel' ) ) );
        $this->assertSame( '(00) 00000-0000', $shipping['shipping_cellphone']['placeholder'] );
    }

    public function test_placeholder_has_no_ddi_with_the_lib(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );

        $this->assertSame( '(00) 00000-0000', $fields['billing_cellphone']['placeholder'] );
    }

    public function test_checkout_phone_placeholder_follows_the_mask_mode(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );

        // "Somente Fixo": o modo só aceita 10 dígitos, então o placeholder é o do fixo.
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( array( 'billing' => array(), 'shipping' => array() ) );
        $this->assertSame( '(00) 0000-0000', $fields['billing']['billing_phone']['placeholder'] ?? '' );

        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );
        $fields = $this->plugin()->wc_better_calc_checkout_fields( array( 'billing' => array(), 'shipping' => array() ) );
        // Com a lib o DDI vem do seletor de país → o texto do checkout não muda.
        $this->assertSame( 'Digite o telefone', $fields['billing']['billing_phone']['placeholder'] ?? '' );
    }

    /**
     * "Celular e Fixo" aceita as DUAS máscaras (autodetecção pelo tamanho), então
     * nenhum formato fixo é verdadeiro: o placeholder aponta a composição (DDD +
     * número) em vez de prometer 5+4. O campo "Celular" continua 5+4.
     */
    public function test_auto_mode_phone_placeholder_does_not_promise_a_format(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->plugin()->wc_better_calc_checkout_fields( array( 'billing' => array(), 'shipping' => array() ) );
        $this->assertSame( '(DDD) número', $fields['billing']['billing_phone']['placeholder'] ?? '' );

        // O campo "Celular" é adicionado por `add_cellphone_billing_fields` (filtro
        // `woocommerce_billing_fields`), não pelo checkout_fields — e continua 5+4.
        $fields = $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );
        $this->assertSame( '(00) 00000-0000', $fields['billing_cellphone']['placeholder'] );
    }

    /**
     * "Somente Celular": o campo principal carrega o celular, então 5+4 — mesmo
     * quando o telefone nativo ainda é montado antes de ser removido.
     */
    public function test_cellphone_only_placeholder_is_the_mobile_format(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $fields = $this->plugin()->add_cellphone_billing_fields( array( 'billing_phone' => array( 'type' => 'tel' ) ) );
        $this->assertSame( '(00) 00000-0000', $fields['billing_cellphone']['placeholder'] );
    }

    /**
     * A edição de endereço (minha conta) usa a MESMA regra do checkout.
     */
    public function test_edit_address_phone_placeholder_follows_the_mode(): void {
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        $incoming = array(
            'billing_country' => array( 'value' => 'BR' ),
            'billing_phone'   => array( 'type' => 'tel' ),
        );

        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        $fields = $this->plugin()->add_edit_address_billing_fields( $incoming );
        $this->assertSame( '(00) 0000-0000', $fields['billing_phone']['placeholder'] ?? '' );

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        $fields = $this->plugin()->add_edit_address_billing_fields( $incoming );
        $this->assertSame( '(DDD) número', $fields['billing_phone']['placeholder'] ?? '' );
    }

    /**
     * O placeholder é extensível (mesma convenção dos demais pontos do plugin) e o
     * filtro recebe o campo e o modo, para um lojista/plugin ajustar só um deles.
     */
    public function test_phone_placeholder_is_filterable(): void {
        update_option( 'woo_better_calc_phone_mode', 'landline_only' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        $captured = array();
        $callback = function ( $placeholder, $kind, $mode ) use ( &$captured ) {
            $captured[] = array( $placeholder, $kind, $mode );

            return 'Meu telefone';
        };
        add_filter( 'wc_better_shipping_calculator_phone_placeholder', $callback, 10, 3 );

        $fields = $this->plugin()->wc_better_calc_checkout_fields( array( 'billing' => array(), 'shipping' => array() ) );

        remove_filter( 'wc_better_shipping_calculator_phone_placeholder', $callback, 10 );

        $this->assertSame( 'Meu telefone', $fields['billing']['billing_phone']['placeholder'] ?? '' );
        $this->assertNotEmpty( $captured );
        $this->assertSame( '(00) 0000-0000', $captured[0][0] );
        $this->assertSame( 'phone', $captured[0][1] );
        $this->assertSame( 'landline_only', $captured[0][2] );
    }

    // --- Sanitizador: digitação livre no modo sem lib -----------------------

    /**
     * @dataProvider brazil_only_fixtures
     */
    public function test_phone_mask_is_brazil_only( string $mode, string $mask, bool $expected ): void {
        $this->assertSame(
            $expected,
            WcBetterShippingCalculatorForBrazilPublic::phone_mask_is_brazil_only( $mode, $mask )
        );
    }

    public static function brazil_only_fixtures(): array {
        return array(
            'sem a lib → máscara BR apenas' => array( 'phone_and_cellphone', 'no', true ),
            'com a lib → não é só BR' => array( 'phone_and_cellphone', 'yes', false ),
            'modo desabilitado → não enfileira nada' => array( 'disabled', 'no', false ),
        );
    }

    // --- Normalização do telefone do pedido ---------------------------------

    public function test_order_phone_gets_brazilian_ddi_without_mask_lib(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        // Máscara BR aplicada no front: o POST chega formatado.
        $this->assertSame(
            '+5585988888888',
            $this->normalize_phone( '(85) 98888-8888' ),
            'Sem a lib, o telefone ainda é normalizado em E.164 com o DDI do Brasil.'
        );

        // Fixo (10 dígitos) também.
        $this->assertSame( '+558532323232', $this->normalize_phone( '(85) 3232-3232' ) );
    }

    public function test_order_phone_keeps_existing_ddi(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        $this->assertSame( '+5585988888888', $this->normalize_phone( '+5585988888888' ) );
        $this->assertSame( '+5585988888888', $this->normalize_phone( '5585988888888' ) );
    }

    public function test_unmanaged_mode_does_not_touch_native_phone(): void {
        update_option( 'woo_better_calc_phone_mode', 'disabled' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );

        $this->assertSame( '(85) 98888-8888', $this->normalize_phone( '(85) 98888-8888' ) );
    }

    // --- Validação "Validar Número de Telefone" ------------------------------

    public function test_validation_runs_without_mask_lib(): void {
        $this->ensure_wc_ready();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_validate_ddd', 'yes' );

        $_POST['billing_phone'] = '(11) 1234-5678';

        $this->plugin()->validate_phone_ddd_classic();

        $errors = $this->error_notices();
        $this->assertNotEmpty( $errors, 'Sem a lib, a validação brasileira deve bloquear um número inválido.' );

        unset( $_POST['billing_phone'] );
    }

    public function test_validation_accepts_valid_brazilian_numbers_without_lib(): void {
        $this->ensure_wc_ready();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_validate_ddd', 'yes' );

        $_POST['billing_phone'] = '(85) 98888-8888';
        $this->plugin()->validate_phone_ddd_classic();
        $this->assertEmpty( $this->error_notices(), 'Celular válido não deve bloquear o checkout.' );

        $_POST['billing_phone'] = '(85) 3232-3232';
        $this->plugin()->validate_phone_ddd_classic();
        $this->assertEmpty( $this->error_notices(), 'Fixo válido não deve bloquear o checkout.' );

        unset( $_POST['billing_phone'] );
    }

    public function test_validation_rejects_number_without_ddd_without_lib(): void {
        $this->ensure_wc_ready();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_validate_ddd', 'yes' );

        // 9 dígitos (sem DDD): não é um telefone brasileiro válido.
        $_POST['billing_phone'] = '98888-8888';

        $this->plugin()->validate_phone_ddd_classic();

        $this->assertNotEmpty( $this->error_notices(), 'Número sem DDD deve ser bloqueado pela validação BR.' );

        unset( $_POST['billing_phone'] );
    }

    public function test_validation_rejects_foreign_country_code_without_lib(): void {
        $this->ensure_wc_ready();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_validate_ddd', 'yes' );

        // Pode ser digitado, mas a validação da máscara BR é só brasileira.
        $_POST['billing_phone'] = '+1 (415) 555-2671';

        $this->plugin()->validate_phone_ddd_classic();

        $this->assertNotEmpty( $this->error_notices(), 'Número de outro país deve ser bloqueado sem a lib.' );

        unset( $_POST['billing_phone'] );
    }

    public function test_validation_accepts_foreign_number_with_the_lib(): void {
        $this->ensure_wc_ready();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'yes' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_validate_ddd', 'yes' );

        $_POST['billing_phone'] = '+1 (415) 555-2671';
        $_POST['billing_phone_country'] = '+1';

        $this->plugin()->validate_phone_ddd_classic();

        $this->assertEmpty( $this->error_notices(), 'Com a lib a validação cobre todos os países.' );

        unset( $_POST['billing_phone'], $_POST['billing_phone_country'] );
    }

    public function test_validation_respects_the_option(): void {
        $this->ensure_wc_ready();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_validate_ddd', 'no' );

        $_POST['billing_phone'] = '(11) 1234-5678';

        $this->plugin()->validate_phone_ddd_classic();

        $this->assertEmpty( $this->error_notices(), 'Com a validação desabilitada nada é bloqueado.' );

        unset( $_POST['billing_phone'] );
    }

    public function test_validation_is_skipped_for_optional_phone(): void {
        $this->ensure_wc_ready();

        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_apply_phone_mask', 'no' );
        update_option( 'woo_better_calc_contact_required', 'no' );
        update_option( 'woo_better_calc_validate_ddd', 'yes' );

        $_POST['billing_phone'] = '(11) 1234-5678';

        $this->plugin()->validate_phone_ddd_classic();

        $this->assertEmpty( $this->error_notices(), 'Campo opcional não é validado.' );

        unset( $_POST['billing_phone'] );
    }
}
