<?php
/**
 * Regressão: telefone obrigatório no checkout CLÁSSICO/shortcode com destaque.
 *
 * Contexto do bug (commit c1aa6af):
 *   Com "Destaque do Campo Telefone" + "Telefone (Contato) Obrigatório" ligados,
 *   o campo nativo fica oculto (woocommerce_checkout_phone_field = hidden) e o
 *   filtro de locale passou a gravar 'phone.required = false'. No checkout em
 *   blocos isso é correto (evita o "Undefined array key label" no OrderController
 *   do Store API). Porém, no clássico/shortcode, o address-i18n.js aplica o
 *   'required' do locale ao campo VISÍVEL no cliente e rebaixa o telefone para
 *   "(opcional)".
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class PhoneRequiredLocaleTest extends WP_UnitTestCase {

    private function locale_phone_required(): bool {
        if ( function_exists( 'WC' ) && WC()->countries ) {
            WC()->countries->locale = array(); // limpa cache de locale
            $locale = WC()->countries->get_country_locale();
            if ( isset( $locale['BR']['phone']['required'] ) ) {
                return (bool) $locale['BR']['phone']['required'];
            }
        }

        // Fallback determinístico: chama o filtro diretamente.
        $plugin = new WcBetterShippingCalculatorForBrazil();
        $locale = $plugin->wc_better_calc_phone_number( array() );
        return (bool) ( $locale['BR']['phone']['required'] ?? false );
    }

    public function test_required_stays_true_in_classic_checkout(): void {
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_contact_field_position', 'yes' );
        update_option( 'woocommerce_checkout_phone_field', 'hidden' );

        $this->assertTrue(
            $this->locale_phone_required(),
            'No checkout clássico/shortcode o locale de telefone deve seguir a opção de contato obrigatório.'
        );
    }

    public function test_optional_when_contact_not_required(): void {
        update_option( 'woo_better_calc_contact_required', 'no' );
        update_option( 'woo_better_calc_contact_field_position', 'yes' );
        update_option( 'woocommerce_checkout_phone_field', 'hidden' );

        $this->assertFalse( $this->locale_phone_required() );
    }

    public function test_store_api_context_does_not_require_hidden_phone(): void {
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_contact_field_position', 'yes' );
        update_option( 'woocommerce_checkout_phone_field', 'hidden' );

        // Simula a requisição do Store API (REST) sem depender da constante global.
        add_filter( 'wc_better_calc_is_store_api_request', '__return_true' );
        $required = $this->locale_phone_required();
        remove_filter( 'wc_better_calc_is_store_api_request', '__return_true' );

        $this->assertFalse(
            $required,
            'No Store API (campo nativo oculto) o telefone não pode ser exigido sem label.'
        );
    }

    /**
     * Regressão do bug "Ocorreu um problema com o endereço de entrega informado:
     * é obrigatório": com o nativo oculto, o Store API não pode exigir 'phone' no
     * locale (o label fica vazio e o OrderController emite " is required").
     *
     * Reproduz fielmente o merge+loop de OrderController::validate_address_fields
     * (o container de DI do WooCommerce não está disponível no phpunit).
     */
    public function test_store_api_shipping_validation_has_no_empty_label_error(): void {
        update_option( 'woo_better_calc_contact_required', 'yes' );
        update_option( 'woo_better_calc_contact_field_position', 'yes' );
        update_option( 'woocommerce_checkout_phone_field', 'hidden' );

        add_filter( 'wc_better_calc_is_store_api_request', '__return_true' );
        if ( ! WC()->countries ) {
            WC()->countries = new \WC_Countries();
        }
        WC()->countries->locale = array();

        // Cópia do merge de locales do OrderController (linhas ~473-486).
        $all_locales    = WC()->countries->get_country_locale();
        $address        = array(
            'first_name' => 'João', 'address_1' => 'Rua X, 123',
            'city' => 'São Paulo', 'state' => 'SP', 'postcode' => '01001000', 'country' => 'BR',
        );
        $current_locale = $all_locales['BR'] ?? array();
        foreach ( $all_locales['default'] as $key => $value ) {
            $current_locale[ $key ] = ! empty( $current_locale[ $key ] )
                ? wp_parse_args( $current_locale[ $key ], $value )
                : $value;
        }

        $required_without_label = array();
        foreach ( $current_locale as $key => $field ) {
            if ( true !== wc_string_to_bool( $field['required'] ?? false ) || true === wc_string_to_bool( $field['hidden'] ?? false ) ) {
                continue;
            }
            $is_empty = ! isset( $address[ $key ] ) || ( is_string( $address[ $key ] ) && '' === trim( $address[ $key ] ) );
            if ( $is_empty && ! isset( $field['label'] ) ) {
                $required_without_label[] = $key;
            }
        }

        remove_filter( 'wc_better_calc_is_store_api_request', '__return_true' );

        $this->assertEmpty(
            $required_without_label,
            'Campos exigidos sem label no Store API (geram " is required"): ' . wp_json_encode( $required_without_label )
        );
    }
}
