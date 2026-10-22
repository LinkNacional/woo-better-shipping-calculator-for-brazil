<?php
/**
 * Regressão: o checkbox "Informe acima o código postal (CEP)." só entra no checkout
 * quando as DUAS opções estão explicitamente ligadas.
 *
 * Bug relacionado (5.2.0): os campos que dependem de outro campo eram travados no
 * admin com o atributo `disabled` — que exclui o input do POST, fazendo o
 * WooCommerce MANTER o valor antigo da option (ver AGENTS.md § 7). Com isso a tela
 * mostrava "Desabilitar" e o checkout continuava exibindo o recurso. Além do fix no
 * JS, a leitura da option aqui deixou de ser uma comparação NEGATIVA (`=== 'no'`),
 * que mandava qualquer valor inesperado — inclusive uma option vazia de um
 * salvamento antigo — para o ramo do "adiciona o checkbox".
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class AutoAddressFillCheckboxTest extends WP_UnitTestCase {

    private const CHECKBOX = 'wc_better_calc_checkbox_billing';

    private function fields(): array {
        $plugin = new WcBetterShippingCalculatorForBrazil();

        return $plugin->wc_better_calc_checkout_fields(
            array(
                'billing'  => array(),
                'shipping' => array(),
            )
        );
    }

    public function test_checkbox_added_when_both_options_are_enabled(): void {
        update_option( 'woo_better_calc_cep_field_position', 'yes' );
        update_option( 'woo_better_calc_enable_auto_address_fill', 'yes' );

        $fields = $this->fields();

        $this->assertArrayHasKey(
            self::CHECKBOX,
            $fields['billing'],
            'Com as duas opções ligadas o checkbox de sugestão do CEP deve existir.'
        );
    }

    public function test_checkbox_not_added_when_auto_fill_is_disabled(): void {
        update_option( 'woo_better_calc_cep_field_position', 'yes' );
        update_option( 'woo_better_calc_enable_auto_address_fill', 'no' );

        $fields = $this->fields();

        $this->assertArrayNotHasKey( self::CHECKBOX, $fields['billing'] );
    }

    public function test_checkbox_not_added_when_cep_is_not_highlighted(): void {
        update_option( 'woo_better_calc_cep_field_position', 'no' );
        update_option( 'woo_better_calc_enable_auto_address_fill', 'yes' );

        $fields = $this->fields();

        $this->assertArrayNotHasKey( self::CHECKBOX, $fields['billing'] );
    }

    /**
     * Option VAZIA (efeito colateral do antigo `disabled` no admin): não é "yes",
     * então o checkbox não pode aparecer.
     */
    public function test_checkbox_not_added_when_option_value_is_empty(): void {
        update_option( 'woo_better_calc_cep_field_position', 'yes' );
        update_option( 'woo_better_calc_enable_auto_address_fill', '' );

        $fields = $this->fields();

        $this->assertArrayNotHasKey(
            self::CHECKBOX,
            $fields['billing'],
            'Valor vazio/legado não pode cair no ramo do "adiciona o checkbox".'
        );
    }
}
