<?php
/**
 * Regressão: a decisão de enfileirar o script de ESPELHO Telefone → Celular (shim)
 * no checkout clássico/shortcode.
 *
 * O script `...CheckoutCellphoneMirrorShortcode` SÓ deve rodar quando NÃO existe
 * um campo "Celular" VISÍVEL — ou seja, no modo "Permitir Telefone Celular e Fixo"
 * com o bloco "Campo de Celular" (woo_better_calc_enable_cellphone_field) DESLIGADO
 * (nesse caso o `*_cellphone` é um campo ESCONDIDO de compatibilidade com
 * PagBank/Asaas/NFe).
 *
 * Com o "Campo de Celular" LIGADO há um campo visível próprio: não se espelha e o
 * script nem deve ser enfileirado.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\PublicView\WcBetterShippingCalculatorForBrazilPublic;

class CellphoneMirrorEnqueueTest extends WP_UnitTestCase {

    /**
     * @dataProvider fixtures
     */
    public function test_mirror_required( string $mode, string $enable, bool $expected, string $msg ): void {
        $this->assertSame(
            $expected,
            WcBetterShippingCalculatorForBrazilPublic::cellphone_mirror_required( $mode, $enable ),
            $msg
        );
    }

    public static function fixtures(): array {
        return array(
            'shim: Celular e Fixo + Campo de Celular desligado' => array(
                'phone_and_cellphone', 'no', true,
                'Deve espelhar/enfileirar: campo de celular é o shim escondido.',
            ),
            'Campo de Celular LIGADO não espelha' => array(
                'phone_and_cellphone', 'yes', false,
                'Com o campo visível de Celular LIGADO não se espelha (nem enfileira o script).',
            ),
            'Somente Celular não espelha' => array(
                'cellphone_only', 'no', false,
                'No modo Somente Celular o campo é o principal; não se espelha.',
            ),
            'Somente Celular (opção forçada a no) não espelha' => array(
                'cellphone_only', 'yes', false,
                'Mesmo com a option residual em yes, o modo Somente Celular não espelha.',
            ),
            'Somente Fixo não espelha' => array(
                'landline_only', 'no', false,
                'No modo Somente Fixo não há celular para espelhar.',
            ),
            'Desabilitar não espelha' => array(
                'disabled', 'no', false,
                'No modo Desabilitar não há telefone/celular.',
            ),
            'Option ausente cai no default (shim ativo)' => array(
                'phone_and_cellphone', '', true,
                'Sem valor explícito (default no), o shim permanece ativo.',
            ),
        );
    }
}
