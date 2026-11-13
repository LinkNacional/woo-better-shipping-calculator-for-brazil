<?php
/**
 * Regressão: integração com o FunnelKit Aero Checkout.
 *
 * O Aero Checkout (FunnelKit) desenha o formulário a partir do layout do funil e
 * NÃO do `woocommerce_checkout_fields`. Dois reflexos no nosso plugin:
 *
 * 1. Telado — no modo "Somente Celular" o plugin remove o telefone nativo dos campos
 *    e cria o `billing_cellphone`; se o checkout não renderiza o `billing_cellphone`
 *    (é o caso do Aero, que ainda remove esse campo do slot de terceiros), o número
 *    digitado no telefone nativo era descartado e o pedido ficava sem telefone.
 * 2. Paleta — o "Celular" e o RG não existiam no editor do funil (a compatibilidade
 *    oficial registra só CPF/CNPJ, Número e Bairro), então não havia como
 *    configurá-los.
 *
 * O FunnelKit não é dependência: sem `WFACP_Add_Address_Field` nada é registrado.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class FunnelKitCheckoutCompatTest extends WP_UnitTestCase {

    public function tear_down(): void {
        unset( $_POST['billing_phone'], $_POST['shipping_phone'], $_POST['billing_phone_country'], $_POST['shipping_phone_country'] );
        parent::tear_down();
    }

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    private function cellphone_only(): void {
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );
    }

    /**
     * Checkout que NÃO renderiza o campo "Celular" (FunnelKit Aero): o número vem no
     * telefone nativo e precisa sobreviver — indo também para a meta `*_cellphone`,
     * que é onde o modo "Somente Celular" guarda o número.
     */
    public function test_cellphone_only_keeps_the_posted_phone_when_cellphone_is_not_rendered(): void {
        $this->cellphone_only();

        $_POST['billing_phone'] = '+55 (83) 99999-8888';

        $data = array(
            'billing_first_name' => 'Fulano',
            'billing_phone'      => '',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertSame( '+55 (83) 99999-8888', $result['billing_phone'], 'O telefone postado não pode ser descartado quando nenhum campo de celular foi renderizado.' );
        $this->assertSame( '83999998888', $result['billing_cellphone'], 'O telefone precisa ser espelhado no celular (é onde o modo guarda o número).' );
    }

    /**
     * O formulário do próprio plugin manda o `*_cellphone`: o comportamento original
     * continua — o telefone do pedido fica VAZIO.
     */
    public function test_cellphone_only_empties_the_phone_when_the_cellphone_field_was_rendered(): void {
        $this->cellphone_only();

        $_POST['billing_phone'] = '(83) 3333-4444';

        $data = array(
            'billing_phone'     => '(83) 3333-4444',
            'billing_cellphone' => '(83) 99999-8888',
        );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_phone', $result );
        $this->assertSame( '(83) 99999-8888', $result['billing_cellphone'] );
    }

    /**
     * Nada preenchido: segue sem telefone (não inventa valor no fallback).
     */
    public function test_cellphone_only_empties_the_phone_when_nothing_was_posted(): void {
        $this->cellphone_only();

        $data = array( 'billing_phone' => '' );

        $result = $this->plugin()->handle_cellphone_posted_data( $data );

        $this->assertArrayNotHasKey( 'billing_phone', $result );
        $this->assertArrayNotHasKey( 'billing_cellphone', $result );
    }

    /**
     * Sem FunnelKit ativo (classe inexistente) o registro não pode fazer nada nem
     * fatal error — é o caminho de quem não tem o plugin instalado.
     */
    public function test_aero_registration_is_a_noop_without_funnelkit(): void {
        if ( class_exists( 'WFACP_Add_Address_Field' ) ) {
            $this->markTestSkipped( 'Ambiente com o FunnelKit ativo.' );
        }

        $this->cellphone_only();
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $before = has_filter( 'wfacp_default_billing_address_fields' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $this->assertSame( $before, has_filter( 'wfacp_default_billing_address_fields' ), 'Sem o FunnelKit nenhum filtro dele pode ser registrado.' );
    }

    /**
     * Com o FunnelKit presente, o "Celular" e o RG entram na lista de campos de
     * endereço do Aero (é o que faz os campos existirem no editor do funil).
     */
    public function test_aero_registration_adds_cellphone_and_rg_fields(): void {
        if ( ! class_exists( 'WFACP_Add_Address_Field' ) ) {
            if ( ! class_exists( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub' ) ) {
                require_once __DIR__ . '/fixtures/wfacp-add-address-field-stub.php';
            }

            if ( ! class_exists( 'WFACP_Add_Address_Field' ) ) {
                // O stub vive no namespace do teste; o plugin procura a classe global.
                class_alias( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub', 'WFACP_Add_Address_Field' );
            }
        }

        $this->cellphone_only();
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $billing = apply_filters( 'wfacp_default_billing_address_fields', array(), 'BR' );

        $this->assertArrayHasKey( 'cellphone', $billing, 'O campo Celular precisa existir na paleta do Aero.' );
        $this->assertSame( 'tel', $billing['cellphone']['type'] );
        $this->assertArrayHasKey( 'rg', $billing, 'O campo RG precisa existir na paleta do Aero.' );
    }

    /**
     * Garante a classe `WFACP_Add_Address_Field` disponível (o plugin a procura no
     * escopo global; o stub dos testes vive no namespace do teste).
     */
    private function ensure_aero_field_class(): void {
        if ( class_exists( 'WFACP_Add_Address_Field' ) ) {
            return;
        }

        if ( ! class_exists( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub' ) ) {
            require_once __DIR__ . '/fixtures/wfacp-add-address-field-stub.php';
        }

        if ( ! class_exists( 'WFACP_Add_Address_Field' ) ) {
            class_alias( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub', 'WFACP_Add_Address_Field' );
        }
    }

    /**
     * IE, IM, data de nascimento e gênero também precisam entrar na paleta do funil.
     *
     * A compatibilidade do FunnelKit REMOVE esses campos da lista de "campos de
     * terceiros" e não os registra como campo do Aero — sem registro eles não são
     * renderizados em lugar nenhum do funil, e o cliente PJ é barrado com "Por favor,
     * preencha a Inscrição Estadual (IE) ou marque como ISENTO" sem ter onde digitar.
     */
    public function test_aero_registration_adds_state_and_city_registration_fields(): void {
        $this->ensure_aero_field_class();

        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'yes' );
        update_option( 'woo_better_calc_enable_gender_field', 'yes' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $billing = apply_filters( 'wfacp_default_billing_address_fields', array(), 'BR' );

        $this->assertArrayHasKey( 'ie', $billing, 'A IE precisa existir na paleta do Aero.' );
        $this->assertArrayHasKey( 'im', $billing, 'A IM precisa existir na paleta do Aero.' );
        $this->assertArrayHasKey( 'birthdate', $billing, 'A data de nascimento precisa existir na paleta do Aero.' );
        $this->assertArrayHasKey( 'gender', $billing, 'O gênero precisa existir na paleta do Aero.' );
        $this->assertSame( 'select', $billing['gender']['type'] );
        $this->assertArrayHasKey( 'options', $billing['gender'] );
    }

    /**
     * Precedência: com o recurso DESLIGADO no woo-better quem manda é o Brazilian (ou
     * o tema) — nada é registrado, como no checkout clássico.
     */
    public function test_aero_registration_respects_the_feature_switches(): void {
        $this->ensure_aero_field_class();

        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_ie_field', 'no' );
        update_option( 'woo_better_calc_enable_im_field', 'no' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'no' );
        update_option( 'woo_better_calc_enable_gender_field', 'no' );
        update_option( 'woo_better_calc_enable_rg_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $billing = apply_filters( 'wfacp_default_billing_address_fields', array(), 'BR' );

        $this->assertArrayNotHasKey( 'ie', $billing );
        $this->assertArrayNotHasKey( 'im', $billing );
        $this->assertArrayNotHasKey( 'birthdate', $billing );
        $this->assertArrayNotHasKey( 'gender', $billing );
        $this->assertArrayNotHasKey( 'rg', $billing );
    }

    /**
     * IE/IM só existem para pessoa jurídica: com "apenas pessoa física" não entram.
     */
    public function test_aero_registration_skips_pj_fields_on_physical_only(): void {
        $this->ensure_aero_field_class();

        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );
        update_option( 'woo_better_calc_enable_im_field', 'yes' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $billing = apply_filters( 'wfacp_default_billing_address_fields', array(), 'BR' );

        $this->assertArrayNotHasKey( 'ie', $billing );
        $this->assertArrayNotHasKey( 'im', $billing );
    }

    /**
     * O DDI do seletor de país é respeitado ao espelhar (não assume sempre +55).
     */
    public function test_cellphone_fallback_respects_the_posted_country_code(): void {
        $this->cellphone_only();

        $_POST['billing_phone']         = '+1 555 123 4567';
        $_POST['billing_phone_country'] = '+1';

        $result = $this->plugin()->handle_cellphone_posted_data( array( 'billing_phone' => '' ) );

        $this->assertSame( '+1 555 123 4567', $result['billing_phone'] );
        $this->assertSame( '5551234567', $result['billing_cellphone'], 'O DDI postado precisa sair do número espelhado.' );

        unset( $_POST['billing_phone_country'] );
    }

    /**
     * Vale para a entrega também (o `$data` pode nem trazer o shipping quando o
     * checkout usa o mesmo endereço para cobrança).
     */
    public function test_cellphone_fallback_covers_the_shipping_phone(): void {
        $this->cellphone_only();

        $_POST['shipping_phone']         = '(83) 98888-7777';
        $_POST['shipping_phone_country'] = '+55';

        $result = $this->plugin()->handle_cellphone_posted_data( array( 'billing_cellphone' => '(83) 99999-8888' ) );

        $this->assertSame( '(83) 98888-7777', $result['shipping_phone'] );
        $this->assertSame( '83988887777', $result['shipping_cellphone'] );

        unset( $_POST['shipping_phone_country'] );
    }

    /**
     * Os campos que registramos no Aero também entram na lista de campos REGISTRADOS
     * dele — é o que impede o `find_extra_fields()` do FunnelKit de tratá-los como
     * "campos de terceiros" e renderizá-los uma segunda vez no funil.
     *
     * O filtro é ADITIVO: nada do que já estava na lista (inclusive o que a compat
     * oficial do Brazilian adiciona, em prioridade 99) pode sair.
     */
    public function test_aero_registered_fields_include_the_fields_we_register(): void {
        if ( ! class_exists( 'WFACP_Add_Address_Field' ) ) {
            if ( ! class_exists( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub' ) ) {
                require_once __DIR__ . '/fixtures/wfacp-add-address-field-stub.php';
            }

            if ( ! class_exists( 'WFACP_Add_Address_Field' ) ) {
                class_alias( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub', 'WFACP_Add_Address_Field' );
            }
        }

        $this->cellphone_only();
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        $this->plugin()->register_funnelkit_checkout_fields();

        $existing = array( 'billing_phone', 'shipping_phone', 'billing_document' );
        $registered = apply_filters( 'wfacp_aero_registered_checkout_fields', $existing );

        foreach ( $existing as $key ) {
            $this->assertContains( $key, $registered, 'A lista de campos do Aero é aditiva: nada pode sair.' );
        }

        $this->assertContains( 'billing_cellphone', $registered );
        $this->assertContains( 'shipping_cellphone', $registered, 'O compat oficial do Brazilian não cobre o shipping_cellphone.' );
        $this->assertContains( 'billing_rg', $registered );
    }

    /**
     * Layout de um funil como o Aero salva: um grupo de endereço escondido (o de
     * cobrança, atrás do "usar um endereço de cobrança diferente") e o outro à vista.
     *
     * @param  bool $billing_hidden O grupo de cobrança começa escondido?
     * @return array
     */
    private function funnel_fieldsets( $billing_hidden = true ) {
        $hidden = $billing_hidden ? array( 'wfacp_billing_fields', 'wfacp_billing_field_hide' ) : array();

        return array(
            'single_step' => array(
                0 => array(
                    'name'   => 'Shipping Information',
                    'class'  => '',
                    'fields' => array(
                        array( 'id' => 'billing_email', 'field_type' => 'billing', 'class' => array() ),
                        array( 'id' => 'wfacp_divider_shipping', 'class' => array() ),
                        array( 'id' => 'shipping_country', 'field_type' => 'shipping', 'class' => array( 'form-row-wide', 'address-field' ) ),
                        array( 'id' => 'shipping_number', 'field_type' => 'shipping', 'class' => array( 'form-row-first', 'address-field' ) ),
                        array( 'id' => 'shipping_neighborhood', 'field_type' => 'shipping', 'class' => array( 'form-row-first', 'address-field' ) ),
                        array( 'id' => 'shipping_wc_custom_field', 'field_type' => 'shipping', 'class' => array() ),
                        array( 'id' => 'wfacp_divider_shipping_end', 'class' => array() ),
                        array( 'id' => 'wfacp_divider_billing', 'class' => array() ),
                        array( 'id' => 'billing_same_as_shipping', 'class' => array() ),
                        array( 'id' => 'billing_address_1', 'field_type' => 'billing', 'class' => array_merge( array( 'form-row-wide' ), $hidden ) ),
                        array(
                            'id'         => 'billing_rg',
                            'field_type' => 'billing',
                            'required'   => false,
                            'class'      => array_merge( array( 'form-row-wide', 'woo-better-rg-field' ), $hidden ),
                        ),
                        array(
                            'id'         => 'billing_document',
                            'field_type' => 'billing',
                            'required'   => false,
                            'class'      => array_merge( array( 'form-row-wide', 'person-type-field' ), $hidden ),
                        ),
                        array( 'id' => 'billing_wc_custom_field', 'field_type' => 'billing', 'class' => array() ),
                    ),
                ),
            ),
        );
    }

    /**
     * Ids dos campos da seção, na ordem em que o funil imprime.
     *
     * @param  array $fieldsets Layout.
     * @return string[]
     */
    private function section_ids( array $fieldsets ) {
        return array_map(
            function ( $field ) {
                return isset( $field['id'] ) ? $field['id'] : '';
            },
            $fieldsets['single_step'][0]['fields']
        );
    }

    /**
     * O CPF/CNPJ é um campo de COBRANÇA, mas o funil do teste (e o caso comum) exibe o
     * endereço de ENTREGA — o de cobrança fica escondido atrás do checkbox. Sem mover o
     * campo, o cliente nunca vê onde digitar o documento (Número e Bairro aparecem
     * porque existem nos dois grupos).
     */
    public function test_aero_document_is_moved_to_the_address_group_the_funnel_shows(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $fieldsets = $this->plugin()->place_person_fields_in_visible_address_group( $this->funnel_fieldsets() );
        $ids       = $this->section_ids( $fieldsets );

        $this->assertContains( 'billing_document', $ids, 'O documento não pode desaparecer do layout.' );
        $this->assertLessThan(
            array_search( 'wfacp_divider_billing', $ids, true ),
            array_search( 'billing_document', $ids, true ),
            'O documento precisa ficar NO GRUPO DE ENTREGA (antes do divisor da cobrança).'
        );
        $this->assertLessThan(
            array_search( 'shipping_wc_custom_field', $ids, true ),
            array_search( 'billing_document', $ids, true ),
            'O documento entra antes do slot de campos de terceiros, não no meio deles.'
        );

        $document = $fieldsets['single_step'][0]['fields'][ array_search( 'billing_document', $ids, true ) ];

        $this->assertSame( 'billing_document', $document['id'], 'O id/name do campo é o mesmo: POST, pedido e cadastro não mudam.' );
        $this->assertNotContains( 'wfacp_billing_field_hide', $document['class'], 'Sem a classe que esconde o grupo o campo aparece.' );
        $this->assertNotContains( 'person-type-field', $document['class'], 'O JS do Brazilian esconde todo .person-type-field e não reexibe os nossos.' );
        $this->assertTrue( $document['required'], 'No funil o documento é obrigatório, como no checkout clássico.' );
    }

    /**
     * O layout real do funil NÃO tem chaves numéricas sequenciais: os divisores de
     * endereço entram com chave textual (`wfacp_start_divider_shipping`), então a
     * CHAVE de um campo não é a posição dele na lista. Usar a chave como offset do
     * `array_splice` jogava o documento para o meio do endereço (antes do Bairro).
     */
    public function test_aero_document_position_ignores_the_layout_keys(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $fieldsets = $this->funnel_fieldsets();

        $with_string_keys = array();

        foreach ( $fieldsets['single_step'][0]['fields'] as $field ) {
            $key = 'wfacp_divider_shipping' === $field['id'] ? 'wfacp_start_divider_shipping' : $field['id'];

            $with_string_keys[ $key ] = $field;
        }

        $fieldsets['single_step'][0]['fields'] = $with_string_keys;

        $ids = array_values( $this->section_ids( $this->plugin()->place_person_fields_in_visible_address_group( $fieldsets ) ) );

        $this->assertSame(
            array( 'shipping_neighborhood', 'billing_document', 'billing_rg', 'shipping_wc_custom_field' ),
            array_slice( $ids, array_search( 'shipping_neighborhood', $ids, true ), 4 ),
            'O documento vem DEPOIS do último campo de endereço e antes do slot de terceiros.'
        );
    }

    /**
     * O RG é do mesmo grupo e segue o documento (é o campo "de pessoa" que fica logo
     * abaixo do CPF/CNPJ no checkout clássico).
     */
    public function test_aero_person_fields_keep_their_order_when_moved(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $ids = $this->section_ids( $this->plugin()->place_person_fields_in_visible_address_group( $this->funnel_fieldsets() ) );

        $this->assertSame(
            array( 'billing_document', 'billing_rg', 'shipping_wc_custom_field' ),
            array_slice( $ids, array_search( 'billing_document', $ids, true ), 3 ),
            'O RG vem logo depois do documento e o slot de terceiros fica por último.'
        );
        $this->assertNotContains( 'billing_rg', array_slice( $ids, array_search( 'wfacp_divider_billing', $ids, true ) ), 'O RG saiu do grupo escondido.' );
    }

    /**
     * Quando o funil exibe o endereço de COBRANÇA, o documento já está no lugar certo:
     * nada é movido (só a obrigatoriedade é reafirmada).
     */
    public function test_aero_document_keeps_its_place_when_billing_is_the_visible_group(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $fieldsets = $this->plugin()->place_person_fields_in_visible_address_group( $this->funnel_fieldsets( false ) );
        $ids       = $this->section_ids( $fieldsets );

        $this->assertSame(
            array( 'billing_rg', 'billing_document', 'billing_wc_custom_field' ),
            array_slice( $ids, array_search( 'billing_rg', $ids, true ), 3 ),
            'A ordem do layout não pode mudar quando o grupo visível é o de cobrança.'
        );

        $document = $fieldsets['single_step'][0]['fields'][ array_search( 'billing_document', $ids, true ) ];

        $this->assertTrue( $document['required'] );
    }

    /**
     * "Tipo de Cliente" em "Nenhum" = o plugin não gera documento: o layout do funil
     * não é tocado.
     */
    public function test_aero_layout_is_untouched_without_the_document_feature(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $original  = $this->funnel_fieldsets();
        $fieldsets = $this->plugin()->place_person_fields_in_visible_address_group( $original );

        $this->assertSame( $original, $fieldsets );
    }

    /**
     * Funil cujo layout NUNCA teve o campo (salvo antes de a compatibilidade do
     * FunnelKit passar a oferecer o `document`): o campo é criado no grupo visível.
     * Campo fora do layout não é impresso — é o mesmo sintoma de não ter o campo.
     */
    public function test_aero_document_is_created_when_the_layout_never_had_it(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $fieldsets = $this->funnel_fieldsets();
        $fieldsets['single_step'][0]['fields'] = array_values( array_filter(
            $fieldsets['single_step'][0]['fields'],
            function ( $field ) {
                return 'billing_document' !== $field['id'];
            }
        ) );

        $this->assertNotContains( 'billing_document', $this->section_ids( $fieldsets ) );

        $placed = $this->plugin()->place_person_fields_in_visible_address_group( $fieldsets );
        $ids    = $this->section_ids( $placed );

        $this->assertContains( 'billing_document', $ids, 'O documento precisa existir no funil mesmo quando o layout é antigo.' );
        $this->assertLessThan(
            array_search( 'shipping_wc_custom_field', $ids, true ),
            array_search( 'billing_document', $ids, true ),
            'O campo criado entra no grupo visível, antes do slot de terceiros.'
        );

        $document = $placed['single_step'][0]['fields'][ array_search( 'billing_document', $ids, true ) ];

        $this->assertSame( 'text', $document['type'] );
        $this->assertNotEmpty( $document['label'] );
        $this->assertTrue( $document['required'] );
    }

    /**
     * Layout sem o grupo de entrega (funil só com cobrança): não há para onde mover —
     * o campo tem de ficar onde está, nunca sumir.
     */
    public function test_aero_document_is_kept_when_there_is_no_shipping_group(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $fieldsets = $this->funnel_fieldsets();
        $fieldsets['single_step'][0]['fields'] = array_values( array_filter(
            $fieldsets['single_step'][0]['fields'],
            function ( $field ) {
                return 0 !== strpos( (string) $field['id'], 'shipping_' );
            }
        ) );

        $ids = $this->section_ids( $this->plugin()->place_person_fields_in_visible_address_group( $fieldsets ) );

        $this->assertContains( 'billing_document', $ids, 'Sem grupo de entrega o campo não pode ser perdido.' );
        $this->assertGreaterThan(
            array_search( 'wfacp_divider_billing', $ids, true ),
            array_search( 'billing_document', $ids, true ),
            'Ele continua no grupo de cobrança.'
        );
    }
}
