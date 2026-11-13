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
     * Layout como o Aero salva depois que o plugin registrou os campos dele:
     * os campos do woo-better (número, bairro, celular, documento, RG) entraram no
     * FIM do bloco de endereço, porque foram registrados depois que o layout existia.
     * É a ordem real do funil de teste (post 6901).
     *
     * @return array
     */
    private function funnel_fieldsets() {
        return array(
            'single_step' => array(
                0 => array(
                    'name'   => 'Shipping Information',
                    'class'  => '',
                    'fields' => array(
                        // Fora de qualquer divisor: dados de contato.
                        array( 'id' => 'billing_email', 'priority' => '110', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_first_name', 'priority' => '10', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_last_name', 'priority' => '20', 'field_type' => 'billing' ),
                        // Bloco de ENTREGA, na ordem bagunçada (ordem salva).
                        array( 'id' => 'wfacp_divider_shipping', 'class' => array() ),
                        array( 'id' => 'shipping_address_1', 'priority' => '50', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_address_2', 'priority' => '60', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_city', 'priority' => '70', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_postcode', 'priority' => '45', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_country', 'priority' => '3', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_state', 'priority' => '80', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_cellphone', 'priority' => '93', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_number', 'priority' => '55', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_neighborhood', 'priority' => '65', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_wc_custom_field', 'priority' => '60', 'field_type' => 'shipping' ),
                        array( 'id' => 'wfacp_divider_shipping_end', 'class' => array() ),
                        // Bloco de COBRANÇA.
                        array( 'id' => 'wfacp_divider_billing', 'class' => array() ),
                        array( 'id' => 'billing_same_as_shipping', 'priority' => '100', 'class' => array() ),
                        array( 'id' => 'billing_address_1', 'priority' => '50', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_city', 'priority' => '70', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_postcode', 'priority' => '45', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_country', 'priority' => '3', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_state', 'priority' => '80', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_cellphone', 'priority' => '93', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_rg', 'priority' => '24', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_document', 'priority' => '23', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_number', 'priority' => '55', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_neighborhood', 'priority' => '65', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_wc_custom_field', 'priority' => '60', 'field_type' => 'billing' ),
                        array( 'id' => 'wfacp_divider_billing_end', 'class' => array() ),
                        // Fora do divisor, depois do bloco.
                        array( 'id' => 'billing_phone', 'priority' => '100', 'field_type' => 'billing' ),
                    ),
                ),
            ),
        );
    }

    /**
     * Ids dos campos de uma seção, na ordem em que o funil imprime.
     *
     * @param  array $fieldsets Layout.
     * @return string[]
     */
    private function section_ids( array $fieldsets ) {
        return array_values( array_map(
            function ( $field ) {
                return isset( $field['id'] ) ? $field['id'] : '';
            },
            $fieldsets['single_step'][0]['fields']
        ) );
    }

    /**
     * Só os campos de um bloco (entre o divisor e o seu fechamento).
     *
     * @param  array  $ids    Ids na ordem.
     * @param  string $prefix 'shipping' ou 'billing'.
     * @return string[]
     */
    private function block_ids( array $ids, $prefix ) {
        $start = array_search( 'wfacp_divider_' . $prefix, $ids, true );
        $end   = array_search( 'wfacp_divider_' . $prefix . '_end', $ids, true );

        return array_slice( $ids, $start + 1, $end - $start - 1 );
    }

    /**
     * O Aero imprime o layout na ORDEM DO ARRAY e ignora o `priority`. Os campos que
     * registramos entraram no fim do bloco, então o "Número" aparecia abaixo do
     * "Celular" e o "Bairro" abaixo do "Estado" — diferente do checkout do
     * WooCommerce, que ordena por `priority`.
     */
    public function test_aero_address_block_is_sorted_by_priority(): void {
        $this->enable_person_fields();

        $fieldsets = $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() );
        $ids       = $this->section_ids( $fieldsets );

        $this->assertSame(
            array(
                'shipping_country',
                'shipping_postcode',
                'shipping_address_1',
                'shipping_number',
                'shipping_address_2',
                'shipping_neighborhood',
                'shipping_city',
                'shipping_state',
                'shipping_cellphone',
                'shipping_wc_custom_field',
            ),
            $this->block_ids( $ids, 'shipping' ),
            'País, CEP, Endereço, Número, Complemento, Bairro, Cidade, Estado, Celular.'
        );
    }

    /**
     * O "Número" tem de ficar logo abaixo do "Endereço" — é o caso relatado.
     */
    public function test_aero_number_field_sits_right_after_the_address(): void {
        $this->enable_person_fields();

        $ids = $this->section_ids( $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() ) );

        $this->assertSame(
            'shipping_number',
            $ids[ array_search( 'shipping_address_1', $ids, true ) + 1 ],
            'O Número precisa vir imediatamente depois do Endereço.'
        );
    }

    /**
     * No bloco de cobrança o CPF/CNPJ sobe para junto dos outros dados de pessoa:
     * País → CPF/CNPJ → RG → CEP → Endereço → Número → ...
     */
    public function test_aero_billing_block_is_sorted_and_keeps_the_same_address_checkbox_first(): void {
        $this->enable_person_fields();

        $fieldsets = $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() );
        $ids       = $this->section_ids( $fieldsets );
        $block     = $this->block_ids( $ids, 'billing' );

        $this->assertSame( 'billing_same_as_shipping', $block[0], 'O checkbox de "mesmo endereço" abre o bloco — ele não entra na ordenação.' );
        $this->assertSame(
            array(
                'billing_same_as_shipping',
                'billing_country',
                'billing_document',
                'billing_rg',
                'billing_postcode',
                'billing_address_1',
                'billing_number',
                'billing_neighborhood',
                'billing_city',
                'billing_state',
                'billing_cellphone',
                'billing_wc_custom_field',
            ),
            array_slice( $block, 0, 12 )
        );
    }

    /**
     * Dados de contato e o telefone ficam FORA do divisor de endereço: a ordem deles
     * é escolha do lojista no editor do funil e não pode ser tocada.
     */
    public function test_aero_contact_fields_outside_the_divider_are_untouched(): void {
        $this->enable_person_fields();

        $ids = $this->section_ids( $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() ) );

        $this->assertSame(
            array( 'billing_email', 'billing_first_name', 'billing_last_name', 'wfacp_divider_shipping' ),
            array_slice( $ids, 0, 4 ),
            'E-mail, Nome e Sobrenome continuam antes do primeiro divisor, na ordem salva.'
        );
        $this->assertSame( 'billing_phone', end( $ids ), 'O telefone continua no fim, fora do divisor.' );
    }

    /**
     * O slot de campos de terceiros (`*_wc_custom_field`) não é campo de endereço:
     * ele fica no mesmo índice, senão o Aero passa a imprimir os terceiros no meio do
     * endereço.
     */
    public function test_aero_third_party_field_slot_keeps_its_position(): void {
        $this->enable_person_fields();

        $original = $this->funnel_fieldsets();
        $fields   = $this->plugin()->prepare_funnelkit_checkout_fields( $original );

        foreach ( array( 'shipping_wc_custom_field', 'billing_wc_custom_field' ) as $slot ) {
            $before = array_search( $slot, $this->section_ids( $original ), true );
            $after  = array_search( $slot, $this->section_ids( $fields ), true );

            $this->assertSame( $before, $after, $slot . ' não pode mudar de índice.' );
        }
    }

    /**
     * Nada além da ORDEM muda: mesmos campos, mesmos ids, mesmas prioridades e o
     * layout original (salvo no banco) segue intacto depois do filtro.
     */
    public function test_aero_sorting_only_changes_the_order(): void {
        $this->enable_person_fields();

        $original  = $this->funnel_fieldsets();
        $fieldsets = $this->plugin()->prepare_funnelkit_checkout_fields( $original );

        $before = $this->section_ids( $original );
        $after  = $this->section_ids( $fieldsets );

        sort( $before );
        sort( $after );

        $this->assertSame( $before, $after, 'Nenhum campo pode ser criado ou perdido.' );

        $this->assertSame(
            $this->funnel_fieldsets(),
            $original,
            'O array recebido não pode ser modificado (nada de alterar por referência).'
        );
    }

    /**
     * Duas passadas dão o mesmo resultado (o filtro roda a cada render).
     */
    public function test_aero_sorting_is_idempotent(): void {
        $this->enable_person_fields();

        $once  = $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() );
        $twice = $this->plugin()->prepare_funnelkit_checkout_fields( $once );

        $this->assertSame( $this->section_ids( $once ), $this->section_ids( $twice ) );
    }

    /**
     * Layout sem divisores de endereço (funil de uma coluna só): nada a ordenar.
     */
    public function test_aero_layout_without_address_dividers_is_untouched(): void {
        $this->enable_person_fields();

        $fieldsets = array(
            'single_step' => array(
                0 => array(
                    'name'   => 'Dados',
                    'fields' => array(
                        array( 'id' => 'billing_first_name', 'priority' => '10' ),
                        array( 'id' => 'billing_document', 'priority' => '23' ),
                        array( 'id' => 'billing_number', 'priority' => '55' ),
                    ),
                ),
            ),
        );

        $this->assertSame(
            $this->section_ids( $fieldsets ),
            $this->section_ids( $this->plugin()->prepare_funnelkit_checkout_fields( $fieldsets ) ),
            'Sem divisor de endereço a ordem não muda.'
        );
    }

    /**
     * Campo sem `priority` (campo customizado do funil) não sai do lugar.
     */
    public function test_aero_field_without_priority_keeps_its_position(): void {
        $fieldsets = $this->funnel_fieldsets();

        // Um campo customizado do lojista, sem priority, no meio do bloco.
        array_splice(
            $fieldsets['single_step'][0]['fields'],
            6,
            0,
            array( array( 'id' => 'shipping_meu_campo_custom', 'class' => array() ) )
        );

        $ids = $this->section_ids( $this->plugin()->prepare_funnelkit_checkout_fields( $fieldsets ) );

        $this->assertSame(
            'shipping_meu_campo_custom',
            $ids[6],
            'Campo sem priority não entra na ordenação e fica no índice em que o layout o colocou.'
        );
    }

    /**
     * Regressão: a ordenação vale para TODOS os funis, independente do "Tipo de
     * Cliente" — Número, Bairro e Celular têm de ficar na ordem certa mesmo com o
     * CPF/CNPJ desligado.
     */
    public function test_aero_sorting_does_not_depend_on_the_document_feature(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $ids = $this->section_ids( $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() ) );

        $this->assertSame(
            'shipping_number',
            $ids[ array_search( 'shipping_address_1', $ids, true ) + 1 ],
            'A ordem do endereço não pode depender do tipo de cliente estar ligado.'
        );
    }

    /**
     * O `required` do CPF/CNPJ vem do layout, e a compatibilidade do FunnelKit o
     * registra com `required => false` FIXO. Resultado: no funil o campo aparecia como
     * "(opcional)" — enquanto o checkout clássico e o de blocos o marcam como
     * obrigatório e a validação do plugin barra o pedido sem documento, com o cliente
     * lendo "opcional" na tela.
     */
    public function test_aero_document_is_required_when_the_person_type_is_enabled(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );

        $fieldsets = $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() );

        $this->assertTrue(
            $this->field_by_id( $fieldsets, 'billing_document' )['required'],
            'Com o tipo de cliente ligado o CPF/CNPJ precisa ser obrigatório no funil.'
        );
    }

    /**
     * RG é opcional por padrão (a opção "RG obrigatório" começa desligada) e passa a
     * obrigatório quando o lojista marca — o funil tem de seguir a opção do plugin, não
     * o layout.
     */
    public function test_aero_rg_required_follows_the_plugin_option(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );

        update_option( 'woo_better_calc_rg_required', 'no' );
        $this->assertArrayNotHasKey(
            'required',
            $this->field_by_id( $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() ), 'billing_rg' ),
            'RG opcional: a chave `required` precisa SAIR (não virar false) — o Aero marca wfacp_field_required em todo campo que TEM a chave.'
        );

        update_option( 'woo_better_calc_rg_required', 'yes' );
        $this->assertTrue(
            $this->field_by_id( $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() ), 'billing_rg' )['required'],
            'Com "RG obrigatório" o funil precisa exigir o RG.'
        );
    }

    /**
     * "Tipo de Cliente" em "Nenhum": o plugin não gera campo de pessoa em checkout
     * nenhum, então eles saem do funil (senão a loja pediria um dado que o plugin não
     * valida nem salva).
     */
    public function test_aero_person_fields_are_removed_when_the_feature_is_off(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $ids = $this->section_ids( $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() ) );

        foreach ( array( 'billing_document', 'billing_rg' ) as $field_id ) {
            $this->assertNotContains( $field_id, $ids, $field_id . ' não pode existir no funil com o tipo de cliente desligado.' );
        }
    }

    /**
     * Liga o tipo de cliente e o RG (os campos de pessoa que o layout de teste tem).
     */
    private function enable_person_fields(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_rg_field', 'yes' );
        update_option( 'woo_better_calc_rg_required', 'no' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'yes' );
        update_option( 'woo_better_calc_birthdate_required', 'no' );
        update_option( 'woo_better_calc_enable_gender_field', 'yes' );
    }

    /**
     * Campos de pessoa OPCIONAIS não podem sair do filtro com a chave `required`.
     *
     * O Aero adiciona `wfacp_field_required` a todo campo que TEM a chave — ele usa
     * `isset()`, não o valor (class-wfacp-template.php) — e o JS dele reaplica
     * `validate-required` quando o bloco de cobrança é aberto. Resultado: o Gênero
     * (opcional por configuração) aparecia com o rótulo "(opcional)" e o campo em
     * vermelho como obrigatório, e o WooCommerce barrava o envio.
     */
    public function test_aero_optional_person_fields_drop_the_required_key(): void {
        $this->enable_person_fields();
        update_option( 'woo_better_calc_rg_required', 'no' );

        $layout = $this->funnel_fieldsets();

        // Gênero e data de nascimento no bloco de cobrança, como o lojista faz no editor.
        array_splice(
            $layout['single_step'][0]['fields'],
            23,
            0,
            array(
                array( 'id' => 'billing_birthdate', 'priority' => '25', 'type' => 'date', 'field_type' => 'billing' ),
                array( 'id' => 'billing_gender', 'priority' => '26', 'type' => 'select', 'field_type' => 'billing', 'options' => array( '' => 'Selecione...' ) ),
            )
        );

        $fields = $this->plugin()->prepare_funnelkit_checkout_fields( $layout );

        foreach ( array( 'billing_gender', 'billing_birthdate', 'billing_rg' ) as $field_id ) {
            $this->assertArrayNotHasKey(
                'required',
                $this->field_by_id( $fields, $field_id ),
                $field_id . ' é opcional: a chave `required` não pode existir.'
            );
        }

        $this->assertTrue(
            $this->field_by_id( $fields, 'billing_document' )['required'],
            'O documento continua obrigatório.'
        );
    }

    /**
     * O `<select>` do plugin no funil precisa da classe que o WooCommerce usa para
     * aplicar o select2 (`select.country_select, select.state_select`, em
     * country-select.js). Sem ela o Gênero saía com a aparência crua, diferente dos
     * selects de País/Estado do mesmo formulário.
     */
    public function test_aero_gender_select_uses_the_same_class_as_the_state_select(): void {
        $this->enable_person_fields();

        $layout = $this->funnel_fieldsets();

        array_splice(
            $layout['single_step'][0]['fields'],
            23,
            0,
            array( array( 'id' => 'billing_gender', 'priority' => '26', 'type' => 'select', 'field_type' => 'billing', 'options' => array( '' => 'Selecione...' ) ) )
        );

        $gender = $this->field_by_id( $this->plugin()->prepare_funnelkit_checkout_fields( $layout ), 'billing_gender' );

        $this->assertContains( 'state_select', (array) $gender['input_class'], 'Sem `state_select` o WooCommerce não aplica o select2 no campo.' );
    }

    /**
     * Onde o campo não é `select`, nada de classe de select2 é injetada.
     */
    public function test_aero_text_fields_do_not_get_the_select2_class(): void {
        $this->enable_person_fields();

        $document = $this->field_by_id( $this->plugin()->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() ), 'billing_document' );

        $this->assertArrayNotHasKey( 'input_class', $document );
    }

    /**
     * Dado um layout, devolve a definição do campo pelo id.
     *
     * @param  array  $fieldsets Layout.
     * @param  string $field_id  Id do campo.
     * @return array
     */
    private function field_by_id( array $fieldsets, $field_id ) {
        foreach ( $fieldsets['single_step'][0]['fields'] as $field ) {
            if ( isset( $field['id'] ) && $field_id === $field['id'] ) {
                return $field;
            }
        }

        $this->fail( 'Campo não encontrado no layout: ' . $field_id );
    }
}
