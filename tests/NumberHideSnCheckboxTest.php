<?php
/**
 * Regressão: opção "Ocultar Checkbox S/N".
 *
 * `woo_better_calc_number_hide_sn_checkbox` é FILHA (join) do "Campo de Número do
 * Endereço" (`woo_better_calc_number_required`). Quando ligada, o atalho "S/N" não
 * pode ser criado em NENHUMA superfície do campo de Número:
 *   - checkout em BLOCOS (`Public/js/...GutenbergNumberField.js`);
 *   - checkout CLÁSSICO/shortcode (`Public/js/...ShortNumberField.js`);
 *   - edição de endereço da conta (o mesmo script do clássico).
 *
 * O backend só precisa entregar a flag certa (uma fonte de verdade, o helper
 * `number_hide_sn_checkbox()`), porque quem monta/omite o atalho é o JS. O
 * GOTCHA do "S/N" salvo (o plugin marca o checkbox e TRAVA o campo — sem o
 * checkbox o cliente não teria como destravar) é coberto no JS: `tests/js/
 * number-hide-sn-checkbox.test.js`.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic;

class NumberHideSnCheckboxTest extends WP_UnitTestCase {

    protected function tearDown(): void {
        delete_option( 'woo_better_calc_number_hide_sn_checkbox' );
        delete_option( 'woo_better_calc_number_required' );

        parent::tearDown();
    }

    public function test_flag_is_off_by_default(): void {
        // O checkbox "S/N" continua aparecendo para quem nunca mexeu na opção.
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::number_hide_sn_checkbox() );
    }

    public function test_flag_follows_the_option(): void {
        update_option( 'woo_better_calc_number_hide_sn_checkbox', 'yes' );
        $this->assertTrue( WcBetterShippingCalculatorForBrazilPublic::number_hide_sn_checkbox() );

        update_option( 'woo_better_calc_number_hide_sn_checkbox', 'no' );
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::number_hide_sn_checkbox() );
    }

    public function test_only_the_exact_yes_value_enables_it(): void {
        // Mesmo padrão das outras opções do plugin ('yes'/'no').
        update_option( 'woo_better_calc_number_hide_sn_checkbox', '1' );
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::number_hide_sn_checkbox() );

        update_option( 'woo_better_calc_number_hide_sn_checkbox', 'YES' );
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::number_hide_sn_checkbox() );
    }

    public function test_option_is_declared_with_the_same_id_used_by_the_helper(): void {
        // A declaração vive em Admin/partials/...CheckoutSettings.php; aqui basta
        // garantir que o option id usado pelo helper é o mesmo declarado na tela.
        $settings_file = dirname( __DIR__ ) . '/Admin/partials/WcBetterShippingCalculatorForBrazilCheckoutSettings.php';
        $this->assertFileExists( $settings_file );

        $contents = file_get_contents( $settings_file );

        $this->assertStringContainsString( "'woo_better_calc_number_hide_sn_checkbox'", $contents );
        $this->assertStringContainsString( "'default'  => 'no'", $contents );
    }
}
