<?php
/**
 * Regressão: sincronização da option nativa `woocommerce_checkout_company_field`
 * com o comportamento do campo Empresa do woo-better, incluindo o modo
 * "Desabilitado".
 *
 * Contexto:
 *   - "Dinâmico" e "Desabilitado" usam `hidden` na option nativa (é o valor que
 *     faz o WooCommerce parar de gerar o campo, no clássico e nos blocos).
 *   - O sync reverso (updated_option) roda ao gravar a option nativa e, sem
 *     cuidado, converteria `hidden` de volta para "Dinâmico" — reativando o
 *     campo que o lojista acabou de desabilitar.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CompanyFieldNativeSyncTest extends WP_UnitTestCase {

    private function plugin(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    /**
     * Dispara o callback do hook `updated_option` como o WordPress faria.
     */
    private function fire_native_option_update( string $old, string $new ): void {
        update_option( 'woocommerce_checkout_company_field', $new );

        $this->plugin()->sync_company_field_on_option_update( 'woocommerce_checkout_company_field', $old, $new );
    }

    public function test_hidden_keeps_disabled_mode(): void {
        update_option( 'woo_better_calc_company_field_behavior', 'disabled' );

        // Gravar `hidden` é o que o modo Desabilitado faz ao salvar; o sync reverso
        // não pode transformar isso em "Dinâmico".
        $this->fire_native_option_update( 'optional', 'hidden' );

        $this->assertSame(
            'disabled',
            get_option( 'woo_better_calc_company_field_behavior' ),
            'O sync reverso não deve reativar o modo Dinâmico quando a escolha é Desabilitado.'
        );
    }

    public function test_hidden_maps_to_dynamic_when_mode_is_not_disabled(): void {
        update_option( 'woo_better_calc_company_field_behavior', 'optional' );

        $this->fire_native_option_update( 'optional', 'hidden' );

        $this->assertSame(
            'dynamic',
            get_option( 'woo_better_calc_company_field_behavior' ),
            'Fora do modo Desabilitado, `hidden` continua mapeando para Dinâmico.'
        );
    }

    public function test_native_optional_switches_off_disabled_mode(): void {
        update_option( 'woo_better_calc_company_field_behavior', 'disabled' );

        // Lojista ligou o campo no editor de blocos: a decisão explícita vence.
        $this->fire_native_option_update( 'hidden', 'optional' );

        $this->assertSame(
            'optional',
            get_option( 'woo_better_calc_company_field_behavior' ),
            'Ativar o campo Empresa na option nativa deve refletir no comportamento do plugin.'
        );
    }

    public function test_native_required_switches_mode_to_required(): void {
        update_option( 'woo_better_calc_company_field_behavior', 'disabled' );

        $this->fire_native_option_update( 'hidden', 'required' );

        $this->assertSame(
            'required',
            get_option( 'woo_better_calc_company_field_behavior' ),
            'Marcar Empresa como obrigatória na option nativa deve refletir no plugin.'
        );
    }
}
