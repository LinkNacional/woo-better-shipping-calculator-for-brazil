<?php
/**
 * Regressão: a decisão de enfileirar o script de ESPELHO Telefone → Celular (shim)
 * no checkout clássico/shortcode e na edição de endereço.
 *
 * O script `...CheckoutCellphoneMirrorShortcode` SÓ deve rodar quando o campo
 * `*_cellphone` ESCONDIDO (shim) é gerado — isto é:
 *   - modo "Permitir Telefone Celular e Fixo";
 *   - "Campo de Celular" (enable_cellphone_field) DESLIGADO (não há campo visível);
 *   - "Celular Oculto" (woo_better_calc_enable_cellphone_shim) LIGADO (default: DESLIGADO).
 *
 * Com o "Campo de Celular" LIGADO há um campo visível próprio (não se espelha). Com
 * o "Celular Oculto" DESLIGADO (padrão), nenhum `*_cellphone` é gerado — evita
 * conflito com outros plugins.
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
    public function test_mirror_required( string $mode, string $enable, string $shim, bool $expected, string $msg ): void {
        $this->assertSame(
            $expected,
            WcBetterShippingCalculatorForBrazilPublic::cellphone_mirror_required( $mode, $enable, $shim ),
            $msg
        );
    }

    public static function fixtures(): array {
        return array(
            'shim ligado (Celular e Fixo + Campo de Celular off + Celular Oculto on)' => array(
                'phone_and_cellphone', 'no', 'yes', true,
                'Deve espelhar/enfileirar: campo de celular é o shim escondido.',
            ),
            'Celular Oculto desligado (padrão) não espelha' => array(
                'phone_and_cellphone', 'no', 'no', false,
                'Com o "Celular Oculto" desabilitado nenhum campo de celular é gerado.',
            ),
            'Celular Oculto ausente cai no default (desligado)' => array(
                'phone_and_cellphone', 'no', '', false,
                'Sem valor explícito, o default é desligado (não gera o campo).',
            ),
            'Campo de Celular LIGADO não espelha' => array(
                'phone_and_cellphone', 'yes', 'yes', false,
                'Com o campo visível de Celular LIGADO não se espelha (nem enfileira o script).',
            ),
            'Somente Celular não espelha' => array(
                'cellphone_only', 'no', 'yes', false,
                'No modo Somente Celular o campo é o principal; não se espelha.',
            ),
            'Somente Fixo não espelha' => array(
                'landline_only', 'no', 'yes', false,
                'No modo Somente Fixo não há celular para espelhar.',
            ),
            'Desabilitar não espelha (shim)' => array(
                'disabled', 'no', 'yes', false,
                'O shim (espelho) só existe no modo "Celular e Fixo".',
            ),
        );
    }
}
