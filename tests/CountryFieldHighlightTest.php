<?php
/**
 * Regressão (#295): o campo País subia para a primeira posição do checkout
 * sempre que o "Tipo de Cliente" estava habilitado, sem que a loja tivesse
 * pedido. A posição agora depende do novo "Destaque do Campo País", ligado
 * por padrão (mantém o comportamento antigo) e desligável para deixar o País
 * na ordem padrão do WooCommerce (priority 40).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CountryFieldHighlightTest extends WP_UnitTestCase {

    public function tear_down(): void {
        delete_option( 'woo_better_calc_country_field_position' );
        delete_option( 'woo_better_calc_person_type_select' );
        parent::tear_down();
    }

    private function checkout_fields(): array {
        return array(
            'billing'  => array(
                'billing_first_name' => array( 'priority' => 10 ),
                'billing_country'    => array( 'priority' => 40 ),
            ),
            'shipping' => array(
                'shipping_first_name' => array( 'priority' => 10 ),
                'shipping_country'    => array( 'priority' => 40 ),
            ),
        );
    }

    private function apply( string $person_type, ?string $highlight ): array {
        update_option( 'woo_better_calc_person_type_select', $person_type );
        if ( null !== $highlight ) {
            update_option( 'woo_better_calc_country_field_position', $highlight );
        }

        return ( new WcBetterShippingCalculatorForBrazil() )
            ->wc_better_calc_checkout_fields( $this->checkout_fields() );
    }

    public function test_country_is_highlighted_by_default_when_person_type_is_on(): void {
        $fields = $this->apply( 'physical', null );

        $this->assertSame( 3, $fields['billing']['billing_country']['priority'], 'Sem opção gravada o destaque vem ligado (comportamento anterior).' );
        $this->assertSame( 3, $fields['shipping']['shipping_country']['priority'] );
    }

    public function test_country_keeps_woocommerce_order_when_highlight_is_off(): void {
        $fields = $this->apply( 'physical', 'no' );

        $this->assertSame( 40, $fields['billing']['billing_country']['priority'], 'Com o destaque desligado o País segue a prioridade padrão do WooCommerce.' );
        $this->assertSame( 40, $fields['shipping']['shipping_country']['priority'] );
    }

    /**
     * O destaque é INDEPENDENTE do "Tipo de Cliente": a opção sozinha manda.
     */
    public function test_country_is_highlighted_even_without_person_type(): void {
        $fields = $this->apply( 'none', 'yes' );

        $this->assertSame( 3, $fields['billing']['billing_country']['priority'], 'Destaque ligado sobe o País mesmo sem "Tipo de Cliente".' );
        $this->assertSame( 3, $fields['shipping']['shipping_country']['priority'] );
    }

    public function test_country_keeps_woocommerce_order_without_person_type_when_off(): void {
        $fields = $this->apply( 'none', 'no' );

        $this->assertSame( 40, $fields['billing']['billing_country']['priority'] );
        $this->assertSame( 40, $fields['shipping']['shipping_country']['priority'] );
    }

    public function test_locale_priority_respects_the_highlight_option(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_country_field_position', 'no' );

        $locale = ( new WcBetterShippingCalculatorForBrazil() )
            ->lkn_checkout_fields_locale_priority( array( 'BR' => array() ) );

        $this->assertArrayNotHasKey( 'country', $locale['BR'], 'Sem o destaque o locale do País não recebe prioridade.' );

        update_option( 'woo_better_calc_country_field_position', 'yes' );
        $locale = ( new WcBetterShippingCalculatorForBrazil() )
            ->lkn_checkout_fields_locale_priority( array( 'BR' => array() ) );

        $this->assertSame( 3, $locale['BR']['country']['priority'] );

        // Independe do "Tipo de Cliente": com ele desligado o destaque continua.
        update_option( 'woo_better_calc_person_type_select', 'none' );
        $locale = ( new WcBetterShippingCalculatorForBrazil() )
            ->lkn_checkout_fields_locale_priority( array( 'BR' => array() ) );

        $this->assertSame( 3, $locale['BR']['country']['priority'], 'O destaque não depende do Tipo de Cliente.' );
    }

    /**
     * O funil (FunnelKit) imprime o layout salvo: sem o destaque, o País volta
     * para a prioridade padrão do WooCommerce em vez da 3 gravada no layout.
     */
    public function test_funnel_country_position_follows_the_highlight_option(): void {
        $plugin = new WcBetterShippingCalculatorForBrazil();

        update_option( 'woo_better_calc_country_field_position', 'no' );
        $off = $this->funnel_fieldsets();
        $off = $plugin->prepare_funnelkit_checkout_fields( $off );

        $this->assertSame( 40, $this->funnel_priority( $off, 'billing_country' ) );
        $this->assertSame( 40, $this->funnel_priority( $off, 'shipping_country' ) );

        update_option( 'woo_better_calc_country_field_position', 'yes' );
        $on = $plugin->prepare_funnelkit_checkout_fields( $this->funnel_fieldsets() );

        $this->assertSame( 3, $this->funnel_priority( $on, 'billing_country' ), 'Com o destaque ligado o layout salvo (3) continua valendo.' );
    }

    private function funnel_fieldsets(): array {
        return array(
            'single_step' => array(
                0 => array(
                    'name'   => 'Shipping Information',
                    'fields' => array(
                        array( 'id' => 'wfacp_divider_billing', 'class' => array() ),
                        array( 'id' => 'billing_address_1', 'priority' => '50', 'field_type' => 'billing' ),
                        array( 'id' => 'billing_country', 'priority' => '3', 'field_type' => 'billing' ),
                        array( 'id' => 'wfacp_divider_billing_end', 'class' => array() ),
                        array( 'id' => 'wfacp_divider_shipping', 'class' => array() ),
                        array( 'id' => 'shipping_address_1', 'priority' => '50', 'field_type' => 'shipping' ),
                        array( 'id' => 'shipping_country', 'priority' => '3', 'field_type' => 'shipping' ),
                        array( 'id' => 'wfacp_divider_shipping_end', 'class' => array() ),
                    ),
                ),
            ),
        );
    }

    private function funnel_priority( array $fieldsets, string $id ): int {
        foreach ( $fieldsets['single_step'][0]['fields'] as $field ) {
            if ( isset( $field['id'] ) && $id === $field['id'] ) {
                return (int) $field['priority'];
            }
        }

        $this->fail( 'Campo ' . $id . ' não encontrado no layout do funil.' );
    }
}
