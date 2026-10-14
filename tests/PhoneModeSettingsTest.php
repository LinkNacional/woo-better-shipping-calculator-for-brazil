<?php
/**
 * Regressão: normalização do bloco "Campo de Celular" na tela de configurações.
 *
 * No modo "Permitir somente Telefone Celular" os radios do bloco ficam `disabled`
 * (efeito visual) e não são enviados no submit — o servidor precisa forçar o valor
 * para "Desabilitar", senão um valor antigo permaneceria salvo e quebraria a lógica.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials\WcBetterShippingCalculatorForBrazilCheckoutSettings;

class PhoneModeSettingsTest extends WP_UnitTestCase {

    public function test_cellphone_only_forces_cellphone_block_disabled(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_cellphone_required', 'yes' );

        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'cellphone_only' );

        $this->assertSame( 'no', get_option( 'woo_better_calc_enable_cellphone_field' ) );
        $this->assertSame( 'no', get_option( 'woo_better_calc_cellphone_required' ) );
    }

    public function test_other_modes_leave_options_untouched(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_cellphone_required', 'yes' );

        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'phone_and_cellphone' );

        $this->assertSame( 'yes', get_option( 'woo_better_calc_enable_cellphone_field' ) );
        $this->assertSame( 'yes', get_option( 'woo_better_calc_cellphone_required' ) );
    }

    public function test_landline_only_leaves_options_untouched(): void {
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'landline_only' );

        $this->assertSame( 'yes', get_option( 'woo_better_calc_enable_cellphone_field' ) );
    }

    public function test_cellphone_shim_forced_off_outside_phone_and_cellphone(): void {
        // "Celular Oculto" só vale no modo "Celular e Fixo"; nos demais é forçado a "no".
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'cellphone_only' );
        $this->assertSame( 'no', get_option( 'woo_better_calc_enable_cellphone_shim' ) );

        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );
        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'landline_only' );
        $this->assertSame( 'no', get_option( 'woo_better_calc_enable_cellphone_shim' ) );
    }

    public function test_cellphone_shim_preserved_in_phone_and_cellphone(): void {
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'phone_and_cellphone' );

        $this->assertSame( 'yes', get_option( 'woo_better_calc_enable_cellphone_shim' ) );
    }

    public function test_cellphone_shim_disables_visible_cellphone_field(): void {
        // "Celular Oculto" ligado → o "Campo de Celular" (visível) é forçado a
        // "Desabilitar" (o shim espelha o telefone; não combina com um campo visível
        // separado). Precedência: o shim vence.
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_cellphone_required', 'yes' );

        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'phone_and_cellphone' );

        $this->assertSame( 'yes', get_option( 'woo_better_calc_enable_cellphone_shim' ) );
        $this->assertSame( 'no', get_option( 'woo_better_calc_enable_cellphone_field' ) );
        $this->assertSame( 'no', get_option( 'woo_better_calc_cellphone_required' ) );
    }

    public function test_visible_cellphone_field_kept_when_shim_off(): void {
        // Sem o "Celular Oculto", o "Campo de Celular" segue a escolha do lojista.
        update_option( 'woo_better_calc_enable_cellphone_shim', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        WcBetterShippingCalculatorForBrazilCheckoutSettings::enforce_cellphone_options_for_mode( 'phone_and_cellphone' );

        $this->assertSame( 'yes', get_option( 'woo_better_calc_enable_cellphone_field' ) );
    }
}
