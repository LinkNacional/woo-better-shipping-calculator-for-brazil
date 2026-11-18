<?php
/**
 * Regressão: o checkbox "Informe acima o código postal (CEP)." entra no checkout
 * quando a opção de SUGESTÃO de endereço por CEP está ligada.
 *
 * Ele NÃO depende do "Destaque do Campo CEP" (`woo_better_calc_cep_field_position`):
 * essa opção só posiciona o campo no topo do formulário. Enquanto o checkbox (e o
 * próprio JS/CSS do recurso) ficavam atrás do destaque, a loja com o preenchimento
 * LIGADO e o destaque DESLIGADO digitava o CEP e nada acontecia — sem spinner, sem
 * checkbox e sem erro, porque o código não era impresso (relato do checkout do
 * FunnelKit Aero).
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
use Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic;

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

    public function test_checkbox_added_even_when_cep_is_not_highlighted(): void {
        update_option( 'woo_better_calc_cep_field_position', 'no' );
        update_option( 'woo_better_calc_enable_auto_address_fill', 'yes' );

        $fields = $this->fields();

        $this->assertArrayHasKey(
            self::CHECKBOX,
            $fields['billing'],
            'O "Destaque do Campo CEP" só reposiciona o campo: com a sugestão ligada o checkbox tem de existir de qualquer forma.'
        );
    }

    /**
     * O gate do RECURSO (JS/CSS) é a opção de preenchimento, não o destaque do campo.
     */
    public function test_autofill_required_ignores_the_cep_highlight_option(): void {
        $this->assertTrue( WcBetterShippingCalculatorForBrazilPublic::cep_autofill_required( 'yes', 'no' ) );
        $this->assertTrue( WcBetterShippingCalculatorForBrazilPublic::cep_autofill_required( 'no', 'yes' ) );
        $this->assertTrue( WcBetterShippingCalculatorForBrazilPublic::cep_autofill_required( 'yes', 'yes' ) );
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::cep_autofill_required( 'no', 'no' ) );
        $this->assertFalse( WcBetterShippingCalculatorForBrazilPublic::cep_autofill_required( '', '' ) );
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
