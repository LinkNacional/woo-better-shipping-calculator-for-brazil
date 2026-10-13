<?php
/**
 * Regressão: precedência do woo-better sobre o plugin "Brazilian Market on
 * WooCommerce" na página MINHA CONTA > EDITAR ENDEREÇO (cobrança/entrega).
 *
 * Contexto do bug:
 *   No checkout clássico o woo-better reafirma seus campos em
 *   `woocommerce_checkout_fields` (prioridade 999), que roda DEPOIS do Brazilian
 *   (que usa `woocommerce_billing_fields`/`woocommerce_shipping_fields` na
 *   prioridade 10). Mas o edit-address NÃO dispara `woocommerce_checkout_fields`
 *   — só os hooks `woocommerce_(billing|shipping)_fields`. Como o Brazilian
 *   carrega DEPOIS do woo-better e ambos estavam na prioridade 10, no empate o
 *   Brazilian vencia em tudo (CPF/RG/IE/bairro/número...), sumindo com o campo
 *   unificado de CPF/CNPJ e o IE/IM do woo-better.
 *
 *   Correção: os callbacks de edit-address do woo-better rodam depois do Brazilian
 *   (prioridade 99) e a remoção do required do IE roda ainda depois (100).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class EditAddressBrazilianPrecedenceTest extends WP_UnitTestCase {

    /**
     * Prioridade da callback do woo-better para um método, num hook.
     * Retorna null se não registrada.
     */
    private function priority_of( string $hook, string $method ): ?int {
        global $wp_filter;

        if ( empty( $wp_filter[ $hook ] ) ) {
            return null;
        }

        foreach ( $wp_filter[ $hook ]->callbacks as $priority => $callbacks ) {
            foreach ( $callbacks as $callback ) {
                $fn = $callback['function'];
                if ( is_array( $fn ) && isset( $fn[1] ) && $fn[1] === $method ) {
                    return (int) $priority;
                }
            }
        }

        return null;
    }

    /**
     * Prioridade do callback do Brazilian "checkout_billing_fields"/"...shipping".
     */
    private function brazilian_priority( string $hook ): ?int {
        global $wp_filter;

        if ( empty( $wp_filter[ $hook ] ) ) {
            return null;
        }

        $brazilian_methods = array( 'checkout_billing_fields', 'checkout_shipping_fields' );

        foreach ( $wp_filter[ $hook ]->callbacks as $priority => $callbacks ) {
            foreach ( $callbacks as $callback ) {
                $fn = $callback['function'];
                if ( is_array( $fn ) && isset( $fn[1] ) && in_array( $fn[1], $brazilian_methods, true ) ) {
                    return (int) $priority;
                }
            }
        }

        return null;
    }

    public function test_edit_address_billing_runs_after_brazilian(): void {
        $ours = $this->priority_of( 'woocommerce_billing_fields', 'add_edit_address_billing_fields' );
        $this->assertNotNull( $ours, 'add_edit_address_billing_fields deve estar registrada em woocommerce_billing_fields.' );

        $brazilian = $this->brazilian_priority( 'woocommerce_billing_fields' );

        if ( null === $brazilian ) {
            // Sem o Brazilian, basta o woo-better rodar depois da prioridade padrão (10).
            $this->assertGreaterThan( 10, $ours );
            return;
        }

        $this->assertGreaterThan(
            $brazilian,
            $ours,
            'add_edit_address_billing_fields deve rodar DEPOIS do Brazilian para o woo-better vencer no edit-address.'
        );
    }

    public function test_edit_address_shipping_runs_after_brazilian(): void {
        $ours = $this->priority_of( 'woocommerce_shipping_fields', 'add_edit_address_shipping_fields' );
        $this->assertNotNull( $ours, 'add_edit_address_shipping_fields deve estar registrada em woocommerce_shipping_fields.' );

        $brazilian = $this->brazilian_priority( 'woocommerce_shipping_fields' );

        if ( null === $brazilian ) {
            $this->assertGreaterThan( 10, $ours );
            return;
        }

        $this->assertGreaterThan(
            $brazilian,
            $ours,
            'add_edit_address_shipping_fields deve rodar DEPOIS do Brazilian para o woo-better vencer.'
        );
    }

    public function test_disable_ie_required_runs_after_edit_address_fields(): void {
        $edit = $this->priority_of( 'woocommerce_billing_fields', 'add_edit_address_billing_fields' );
        $disable = $this->priority_of( 'woocommerce_billing_fields', 'disable_ie_required_on_edit_address_submit' );

        $this->assertNotNull( $disable );
        $this->assertNotNull( $edit );
        $this->assertGreaterThan(
            $edit,
            $disable,
            'A remoção do required do IE (CPF) precisa rodar DEPOIS de os campos serem montados.'
        );
    }

    /**
     * Cadeia funcional: rodando os callbacks registrados via apply_filters, o
     * campo unificado do woo-better aparece e o required do IE segue o documento.
     */
    public function test_woo_better_wins_and_ie_required_follows_document(): void {
        update_option( 'woo_better_calc_person_type_select', 'both' );
        update_option( 'woo_better_calc_enable_ie_field', 'yes' );

        // Campos como o WC os monta para o Brasil; o valor de país habilita o gate
        // do woo-better sem depender de WC()->customer.
        $base = function () {
            return array(
                'billing_country'      => array( 'value' => 'BR' ),
                'billing_first_name'   => array( 'label' => 'Nome' ),
                'billing_last_name'    => array( 'label' => 'Sobrenome' ),
                'billing_email'        => array( 'label' => 'E-mail' ),
                'billing_phone'        => array( 'label' => 'Telefone' ),
                'billing_postcode'     => array( 'label' => 'CEP' ),
                'billing_address_1'    => array( 'label' => 'Endereço' ),
                'billing_city'         => array( 'label' => 'Cidade' ),
                'billing_state'        => array( 'label' => 'Estado' ),
                'billing_company'      => array( 'label' => 'Company name', 'required' => true ),
                'billing_persontype'   => array( 'type' => 'select' ),
                'billing_cpf'          => array( 'type' => 'tel' ),
                'billing_cnpj'         => array( 'type' => 'tel' ),
                'billing_ie'           => array( 'label' => 'State Registration' ),
            );
        };

        $backup = $_POST;

        $_POST = array( 'action' => 'edit_address', 'billing_document' => '123.456.789-09' );
        $cpf = apply_filters( 'woocommerce_billing_fields', $base() );

        $this->assertArrayHasKey( 'billing_document', $cpf, 'O campo unificado CPF/CNPJ do woo-better deve vencer o Brazilian.' );
        $this->assertSame( 'hidden', $cpf['billing_cpf']['type'] ?? null, 'CPF do Brazilian deve virar hidden.' );
        $this->assertFalse(
            (bool) ( $cpf['billing_ie']['required'] ?? false ),
            'Com CPF, o IE do woo-better não pode ficar obrigatório.'
        );

        $_POST = array( 'action' => 'edit_address', 'billing_document' => '11.222.333/0001-81' );
        $cnpj = apply_filters( 'woocommerce_billing_fields', $base() );

        $this->assertTrue(
            (bool) ( $cnpj['billing_ie']['required'] ?? false ),
            'Com CNPJ, o IE do woo-better deve continuar obrigatório.'
        );

        $_POST = $backup;
    }
}
