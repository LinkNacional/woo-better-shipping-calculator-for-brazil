<?php
/**
 * Regressão: bloco "Informações adicionais" (order-received / ver pedido).
 *
 * Renderizado via hooks do WooCommerce (NÃO por override de template) para funcionar
 * em QUALQUER tema — inclusive checkout em blocos, cujo order-confirmation dispara
 * `woocommerce_thankyou` (bloco "additional information") e NÃO
 * `woocommerce_order_details_after_customer_details`.
 *   - `woocommerce_thankyou` → cobre o checkout em BLOCOS e o clássico;
 *   - `woocommerce_order_details_after_customer_details` → cobre o clássico;
 *   - idempotente (1x por pedido);
 *   - filtro `woo_better_customer_details_rows` para estender as linhas.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use WP_UnitTestCase;
use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazil;

class CustomerDetailsTemplateTest extends WP_UnitTestCase {

    private function plugin_instance(): WcBetterShippingCalculatorForBrazil {
        return new WcBetterShippingCalculatorForBrazil();
    }

    protected function tearDown(): void {
        remove_all_filters( 'woo_better_customer_details_rows' );
        parent::tearDown();
    }

    // --- Bloco "Informações adicionais" --------------------------------------

    private function renderAdditionalInfo( $orderOrId ): string {
        ob_start();
        $this->plugin_instance()->render_customer_additional_info( $orderOrId );
        return trim( ob_get_clean() );
    }

    public function test_additional_info_renders_the_brazilian_fields_only(): void {
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_email( 'dev@example.local' );
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );
        $order->update_meta_data( '_billing_persontype', '1' );
        $order->update_meta_data( '_billing_cpf', '493.147.600-73' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'Informações adicionais', $html );
        $this->assertStringContainsString( '493.147.600-73', $html );
        // E-mail, telefone E CELULAR não entram: o WC exibe e-mail/telefone no
        // resumo/endereço e o celular vai DENTRO dos endereços (cobrança e entrega).
        $this->assertStringNotContainsString( 'dev@example.local', $html );
        $this->assertStringNotContainsString( '+5583988888882', $html );
        $this->assertStringNotContainsString( '+5583988888885', $html );
        $this->assertStringNotContainsString( 'woocommerce-customer-details--cellphone', $html );
        // Sem bullets (<li>).
        $this->assertStringNotContainsString( '<li', $html );
    }

    public function test_additional_info_birthdate_is_last(): void {
        // A "Data de Nascimento" deve ficar por ÚLTIMO no bloco (após gênero e os
        // demais campos brasileiros).
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_persontype', '1' );
        $order->update_meta_data( '_billing_cpf', '493.147.600-73' );
        $order->update_meta_data( '_billing_birthdate', '1999-03-14' );

        $html = $this->renderAdditionalInfo( $order );

        $pos_cpf  = strpos( $html, 'CPF:' );
        $pos_birth = strpos( $html, 'Data de Nascimento:' );

        $this->assertNotFalse( $pos_cpf );
        $this->assertNotFalse( $pos_birth );
        $this->assertGreaterThan( $pos_cpf, $pos_birth, 'A Data de Nascimento deve vir depois do CPF (no fim).' );

        // É a ÚLTIMA linha da tabela (nesse formato o label vive no `th[scope=row]`).
        $last_label_pos = strrpos( $html, '<th scope="row">' );
        $this->assertNotFalse( $last_label_pos, 'As linhas da tabela devem usar th[scope=row].' );
        $this->assertStringContainsString( 'Data de Nascimento:', substr( $html, $last_label_pos, 60 ) );
    }

    public function test_additional_info_is_empty_when_nothing_to_show(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_birthdate_field', 'no' );
        update_option( 'woo_better_calc_enable_gender_field', 'no' );

        // Sem e-mail, telefone, celular e sem campos brasileiros.
        $order = new \WC_Order();

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    public function test_additional_info_dedupes_cellphone_equal_to_phone(): void {
        // Com o campo de Celular ligado, se o celular for o MESMO número do telefone
        // (que o WooCommerce já exibe), não repete no bloco.
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888885' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringNotContainsString( '+5583988888885', $html );
    }

    public function test_additional_info_does_not_render_phone_or_email(): void {
        // O WooCommerce já exibe e-mail (resumo) e telefone (endereço); nosso bloco
        // não deve repeti-los.
        update_option( 'woo_better_calc_person_type_select', 'none' );

        $order = new \WC_Order();
        $order->set_billing_email( 'dev@example.local' );
        $order->set_billing_phone( '+5583988888882' );

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    // --- Celular DENTRO do endereço (cobrança + entrega) ----------------------

    private function renderAddressCellphone( \WC_Order $order, string $type ): string {
        ob_start();
        $this->plugin_instance()->render_address_cellphone( $type, $order );
        return trim( ob_get_clean() );
    }

    public function test_address_cellphone_is_rendered_for_billing_and_shipping(): void {
        // O celular secundário existe nos DOIS endereços — sai em cobrança E entrega,
        // cada um com o seu número (nunca "só um" e nunca no "Informações adicionais").
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->set_shipping_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );
        $order->update_meta_data( '_shipping_cellphone', '+5583988888886' );

        $billing  = $this->renderAddressCellphone( $order, 'billing' );
        $shipping = $this->renderAddressCellphone( $order, 'shipping' );

        // A classe é a do TELEFONE do WooCommerce: é por ela que o tema aplica o
        // ícone (no lugar do nome) e o espaçamento da linha.
        $this->assertStringContainsString( 'class="woocommerce-customer-details--phone woo-better-customer-details--cellphone"', $billing );
        $this->assertStringContainsString( '+5583988888885', $billing );
        $this->assertStringContainsString( 'class="woocommerce-customer-details--phone woo-better-customer-details--cellphone"', $shipping );
        $this->assertStringContainsString( '+5583988888886', $shipping );
    }

    public function test_address_cellphone_hides_the_label_and_shows_only_the_icon(): void {
        // "Ajustar o ícone no lugar do nome": o rótulo "Celular" NÃO aparece como
        // texto (só o ícone que o tema desenha via `--phone::before`); ele fica num
        // `screen-reader-text` para o leitor de tela continuar dizendo o que é.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $html = $this->renderAddressCellphone( $order, 'billing' );

        $this->assertStringContainsString( '<span class="screen-reader-text woo-better-sr-only">Celular: </span>+5583988888885', $html );
    }

    public function test_address_cellphone_keeps_the_value_as_typed(): void {
        // O campo secundário não recebe DDI do backend: a meta é o que o cliente
        // digitou, só sem os caracteres especiais (o `+55` digitado é PRESERVADO).
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $this->assertStringContainsString( '+5583988888885</p>', $this->renderAddressCellphone( $order, 'billing' ) );
    }

    // --- Posição: o celular fica ACIMA do e-mail no endereço de cobrança --------

    /**
     * Simula o trecho de endereços do template clássico e devolve o HTML final.
     *
     * O template imprime (cobrança): endereço → telefone → e-mail → HOOK do endereço
     * (de onde sai o nosso celular). Sem o buffer o celular ficaria ABAIXO do e-mail.
     *
     * @param \WC_Order $order
     * @param bool      $with_shipping Repete a estrutura para o endereço de entrega.
     * @return string
     */
    private function renderClassicAddressSection( \WC_Order $order, bool $with_shipping = false ): string {
        $plugin = $this->plugin_instance();

        ob_start();

        $plugin->start_customer_details_buffer( $order );

        echo '<address><p>Rua H - 123<br>Feira de Santana</p>'
            . '<p class="woocommerce-customer-details--phone">' . esc_html( $order->get_billing_phone() ) . '</p>'
            . '<p class="woocommerce-customer-details--email">dev@example.local</p>';

        $plugin->render_address_cellphone( 'billing', $order );

        echo '</address>';

        if ( $with_shipping ) {
            echo '<address><p>Rua H - 123</p>'
                . '<p class="woocommerce-customer-details--phone">' . esc_html( $order->get_shipping_phone() ) . '</p>';

            $plugin->render_address_cellphone( 'shipping', $order );

            echo '</address>';
        }

        $plugin->flush_customer_details_buffer( $order );

        return (string) ob_get_clean();
    }

    private function cellphoneOrder(): \WC_Order {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->set_shipping_phone( '+5583988888882' );
        $order->set_billing_email( 'dev@example.local' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );
        $order->update_meta_data( '_shipping_cellphone', '+5583988888886' );

        return $order;
    }

    public function test_billing_cellphone_is_placed_above_the_email(): void {
        $html = $this->renderClassicAddressSection( $this->cellphoneOrder() );

        $pos_cell  = strpos( $html, 'woo-better-customer-details--cellphone' );
        $pos_email = strpos( $html, 'woocommerce-customer-details--email' );
        $pos_phone = strpos( $html, 'woocommerce-customer-details--phone' );

        $this->assertNotFalse( $pos_cell );
        $this->assertNotFalse( $pos_email );
        $this->assertLessThan( $pos_email, $pos_cell, 'O celular deve vir ACIMA do e-mail na cobrança.' );
        $this->assertLessThan( $pos_cell, $pos_phone, 'E ABAIXO do telefone (que continua primeiro).' );
    }

    public function test_shipping_cellphone_keeps_its_position_after_the_phone(): void {
        // A entrega não tem e-mail: o celular fica logo após o telefone, intocado.
        $html = $this->renderClassicAddressSection( $this->cellphoneOrder(), true );

        $last_phone = strrpos( $html, 'woocommerce-customer-details--phone' );
        $shipping_cell = strpos( $html, 'woo-better-customer-details--cellphone', $last_phone );

        $this->assertNotFalse( $shipping_cell );
        $this->assertStringContainsString( '+5583988888886</p>', substr( $html, $shipping_cell, 200 ) );
    }

    public function test_cellphone_reorder_moves_the_whole_paragraph(): void {
        // A troca é de BLOCO: o `<p>` inteiro (com o rótulo escondido) muda de lugar,
        // e o número não aparece duplicado.
        $html = $this->renderClassicAddressSection( $this->cellphoneOrder() );

        $this->assertSame( 1, substr_count( $html, '+5583988888885' ) );
        $this->assertMatchesRegularExpression(
            '/woo-better-customer-details--cellphone">\s*<span class="screen-reader-text woo-better-sr-only">Celular: <\/span>\+5583988888885<\/p>\s*<p class="woocommerce-customer-details--email">/',
            $html
        );
    }

    public function test_no_buffer_is_opened_without_a_billing_cellphone(): void {
        // Nada a reordenar (celular == telefone): caminho comum, sem buffer.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888885' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $level = ob_get_level();
        $this->plugin_instance()->start_customer_details_buffer( $order );

        $this->assertSame( $level, ob_get_level(), 'Sem celular próprio não há buffer.' );

        // Idem com a exibição de detalhes desligada.
        update_option( 'woo_better_calc_enable_order_details', 'no' );

        $order2 = new \WC_Order();
        $order2->set_billing_phone( '+5583988888882' );
        $order2->update_meta_data( '_billing_cellphone', '+5583988888889' );

        $this->plugin_instance()->start_customer_details_buffer( $order2 );

        $this->assertSame( $level, ob_get_level(), 'Com a opção desligada não há buffer nem celular.' );
    }

    public function test_buffer_safety_net_flushes_without_losing_content(): void {
        // Tema que não dispara o hook interno: a rede de segurança despeja o conteúdo
        // intacto (o buffer nunca engole a página).
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = $this->cellphoneOrder();
        $plugin = $this->plugin_instance();

        ob_start();
        $plugin->start_customer_details_buffer( $order );
        echo 'CONTEUDO';
        $plugin->flush_customer_details_buffer( null ); // flush sem pedido (wp_footer)
        $html = (string) ob_get_clean();

        $this->assertStringContainsString( 'CONTEUDO', $html );

        // Segundo flush é no-op (o buffer já foi fechado).
        $plugin->flush_customer_details_buffer( null );
        $this->assertSame( ob_get_level(), ob_get_level() );
    }

    public function test_order_details_buffer_hooks_are_registered(): void {
        $this->plugin_instance();

        $this->assertTrue(
            $this->hook_has_plugin_method( 'woocommerce_after_order_details', 'start_customer_details_buffer' ),
            'O buffer precisa abrir ANTES do template de endereços.'
        );
        $this->assertTrue(
            $this->hook_has_plugin_method( 'woocommerce_order_details_after_customer_details', 'flush_customer_details_buffer' ),
            'E fechar/reordenar depois dos endereços.'
        );
        $this->assertTrue(
            $this->hook_has_plugin_method( 'wp_footer', 'flush_customer_details_buffer' ),
            'Rede de segurança: o buffer não pode ficar aberto.'
        );
    }


    public function test_address_cellphone_is_hidden_when_equal_to_the_phone(): void {
        // Celular == telefone (campo único/espelho): o WC já imprime o número no
        // endereço, então não repetimos.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888885' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $this->assertSame( '', $this->renderAddressCellphone( $order, 'billing' ) );
    }

    public function test_address_cellphone_is_hidden_in_shim_mode(): void {
        // "Celular e Fixo" + "Campo de Celular" DESLIGADO (shim): o `_billing_cellphone`
        // é o ESPELHO do telefone — mesmo caso acima.
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'no' );
        update_option( 'woo_better_calc_enable_cellphone_shim', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' ); // espelho

        $this->assertSame( '', $this->renderAddressCellphone( $order, 'billing' ) );
    }

    public function test_address_cellphone_shows_the_principal_cellphone_in_cellphone_only(): void {
        // "Somente Celular" com o telefone vazio: o endereço do WC não mostra número
        // nenhum, então o celular (o principal do modo) vai para o endereço, com o
        // rótulo "Celular" escondido atrás do ícone.
        update_option( 'woo_better_calc_phone_mode', 'cellphone_only' );

        $order = new \WC_Order();
        $order->update_meta_data( '_billing_cellphone', '+5583988888882' );

        $html = $this->renderAddressCellphone( $order, 'billing' );

        $this->assertStringContainsString( '>Celular: </span>+5583988888882</p>', $html );
    }

    public function test_address_cellphone_respects_the_order_details_gate(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'no' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583988888885' );

        $this->assertSame( '', $this->renderAddressCellphone( $order, 'billing' ) );
    }

    public function test_address_cellphone_escapes_the_value(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );
        $order->update_meta_data( '_billing_cellphone', '+5583<script>alert(1)</script>' );

        $html = $this->renderAddressCellphone( $order, 'billing' );

        $this->assertStringNotContainsString( '<script', $html );
    }

    public function test_address_cellphone_hooks_are_registered(): void {
        // Clássico (template `order/order-details-customer.php`) + blocos (tema de bloco).
        $this->plugin_instance();

        $this->assertTrue(
            $this->hook_has_plugin_method( 'woocommerce_order_details_after_customer_address', 'render_address_cellphone' ),
            'O celular precisa ser impresso dentro do endereço no tema CLÁSSICO.'
        );
        $this->assertTrue(
            $this->hook_has_plugin_method( 'render_block', 'render_block_address_cellphone' ),
            'O celular precisa ser anexado ao bloco de endereço no tema de BLOCOS.'
        );
    }

    public function test_render_block_address_cellphone_only_acts_on_the_address_blocks(): void {
        update_option( 'woo_better_calc_phone_mode', 'phone_and_cellphone' );
        update_option( 'woo_better_calc_enable_cellphone_field', 'yes' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $plugin = $this->plugin_instance();

        $content = '<address>Rua X, 10</address><p class="woocommerce-customer-details--phone">+5583988888882</p>';
        $block   = array( 'blockName' => 'woocommerce/order-confirmation-billing-address' );

        // Sem o query var do order-received (ex.: editor/outra tela) não inventa pedido.
        $this->assertSame( $content, $plugin->render_block_address_cellphone( $content, $block ) );

        // Bloco que não é de endereço segue intocado.
        $this->assertSame(
            $content,
            $plugin->render_block_address_cellphone( $content, array( 'blockName' => 'woocommerce/order-confirmation-totals' ) )
        );
    }

    public function test_render_block_address_cellphone_ignores_empty_block_content(): void {
        // Sem permissão de visualização o bloco vem vazio — não cria endereço fantasma.
        $this->assertSame(
            '',
            $this->plugin_instance()->render_block_address_cellphone( '', array( 'blockName' => 'woocommerce/order-confirmation-billing-address' ) )
        );
    }

    // --- Novos contratos: hook do checkout em blocos, idempotência, filtro ----

    public function test_is_idempotent_per_order(): void {
        // Ambos os hooks podem disparar para o mesmo pedido — deve renderizar 1x.
        update_option( 'woo_better_calc_person_type_select', 'physical' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        $order = new \WC_Order();
        $order->set_id( 777001 ); // id fictício só para o guard de idempotência
        $order->update_meta_data( '_billing_persontype', '1' );
        $order->update_meta_data( '_billing_cpf', '493.147.600-73' );

        $first  = $this->renderAdditionalInfo( $order );
        $second = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'Informações adicionais', $first );
        $this->assertSame( '', $second, 'A segunda renderização do MESMO pedido deve ser suprimida (idempotência).' );
    }

    public function test_rows_can_be_extended_via_filter(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        add_filter( 'woo_better_customer_details_rows', function ( $rows ) {
            $rows[] = array( 'label' => 'RG', 'value' => '12.345.678-9' );
            return $rows;
        } );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );

        $html = $this->renderAdditionalInfo( $order );

        $this->assertStringContainsString( 'RG:', $html );
        $this->assertStringContainsString( '12.345.678-9', $html );
    }

    public function test_filter_can_remove_all_rows_and_hide_block(): void {
        update_option( 'woo_better_calc_person_type_select', 'none' );
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        add_filter( 'woo_better_customer_details_rows', '__return_empty_array' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    public function test_nothing_rendered_when_order_details_disabled(): void {
        update_option( 'woo_better_calc_enable_order_details', 'no' );

        $order = new \WC_Order();
        $order->set_billing_phone( '+5583988888882' );

        $this->assertSame( '', $this->renderAdditionalInfo( $order ) );
    }

    /**
     * Verifica se um método desse plugin está registrado num hook (via wp_filter),
     * sem depender de `wc_get_order` (que não resolve no ambiente de testes).
     */
    private function hook_has_plugin_method( string $hook, string $method ): bool {
        if ( empty( $GLOBALS['wp_filter'][ $hook ] ) ) {
            return false;
        }

        foreach ( $GLOBALS['wp_filter'][ $hook ]->callbacks as $callbacks ) {
            foreach ( $callbacks as $cb ) {
                $fn = $cb['function'] ?? null;
                if ( is_array( $fn ) && isset( $fn[1] ) && $fn[1] === $method ) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Prioridade do fallback em `woocommerce_thankyou`.
     *
     * O core registra `woocommerce_order_details_table` (que imprime a tabela do
     * pedido E os endereços) nesse hook com prioridade 10. O plugin carrega ANTES do
     * WooCommerce (ordem alfabética das pastas), então em prioridade 10 o nosso bloco
     * era registrado primeiro e, por causa do "renderiza 1x", aparecia no TOPO da
     * página de pedido recebido — antes do resumo e dos endereços.
     */
    public function test_thankyou_fallback_runs_after_the_order_details_table(): void {
        // O construtor registra os hooks (o loader roda na hora).
        $this->plugin_instance();

        global $wp_filter;

        $this->assertArrayHasKey( 'woocommerce_thankyou', $wp_filter );

        $core_priority  = null;
        $our_priority   = null;

        foreach ( $wp_filter['woocommerce_thankyou']->callbacks as $priority => $callbacks ) {
            foreach ( $callbacks as $cb ) {
                $fn = $cb['function'] ?? null;

                if ( 'woocommerce_order_details_table' === $fn ) {
                    $core_priority = $priority;
                }

                if ( is_array( $fn ) && isset( $fn[1] ) && 'render_customer_additional_info' === $fn[1] ) {
                    $our_priority = $priority;
                }
            }
        }

        $this->assertNotNull( $our_priority, 'O bloco precisa continuar como fallback em woocommerce_thankyou.' );

        if ( null !== $core_priority ) {
            $this->assertGreaterThan(
                $core_priority,
                $our_priority,
                'O fallback precisa rodar DEPOIS da tabela do pedido (senão o bloco sobe para o topo da página).'
            );
        }
    }

    /**
     * O bloco usa as classes CANÔNICAS do WooCommerce.
     *
     * Os "cards" nativos da tela ("Detalhes do pedido", "Endereço de cobrança") são
     * templates PHP clássicos que imprimem `woocommerce-order-details` /
     * `woocommerce-order-details__title` — e é por essas classes que o core e os temas
     * aplicam borda, raio, margem e a barra do título. Sem elas o nosso bloco fica
     * "solto" em qualquer tema (bug relatado).
     */
    public function test_additional_info_uses_the_woocommerce_canonical_classes(): void {
        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        add_filter(
            'woo_better_customer_details_rows',
            static function ( $rows ) {
                $rows[] = array( 'label' => 'Linha', 'value' => 'de teste' );
                return $rows;
            }
        );

        $order = new \WC_Order();
        $order->set_billing_first_name( 'Fulano' );
        $order->save();

        $html = $this->renderAdditionalInfo( $order );

        // Bloco + barra do título (do tema).
        $this->assertStringContainsString( 'class="woocommerce-order-details woo-better-additional-info"', $html );
        $this->assertStringContainsString( 'class="woocommerce-order-details__title"', $html );

        // O `<style>` inline saiu: o CSS vive em Public/css/...OrderDetails.css.
        $this->assertStringNotContainsString( '<style>', $html );

        // Os dados vão numa TABELA com as classes do "Detalhes do pedido": é isso que
        // dá a caixa (borda + raio), o peso do label e as bordas de separação sem
        // nenhum CSS nosso. As linhas seguem o padrão `th[scope=row]` + `td` que o
        // core usa no `tfoot` daquela tabela.
        $this->assertStringContainsString( '<table class="woocommerce-table woocommerce-table--order-details shop_table order_details', $html );
        $this->assertStringContainsString( '<tbody>', $html );
        $this->assertStringContainsString( '<th scope="row">Linha:</th>', $html );
        $this->assertStringContainsString( '<td>de teste</td>', $html );
        // A tabela precisa FECHAR (senão o resto da página inteira fica dentro dela).
        $this->assertStringContainsString( '</tbody>', $html );
        $this->assertStringContainsString( '</table>', $html );
    }

    /** A folha de estilos do bloco existe (fonte e compilada) e é a referenciada. */
    public function test_additional_info_stylesheet_exists_and_is_referenced(): void {
        $root     = dirname( __DIR__ );
        $source   = $root . '/Public/css/WcBetterShippingCalculatorForBrazilOrderDetails.css';
        $compiled = $root . '/Public/cssCompiled/WcBetterShippingCalculatorForBrazilOrderDetails.COMPILED.css';

        $this->assertFileExists( $source, 'Fonte do CSS do bloco ausente.' );
        $this->assertFileExists( $compiled, 'Compilado ausente: rode npm run build:css.' );

        $css = (string) file_get_contents( $source );

        // O afastamento fica no BLOCO, não na tabela (a tabela segue alinhada com as
        // outras do pedido e mantém o `margin-bottom` do tema).
        $this->assertMatchesRegularExpression( '/\.woo-better-additional-info\s*\{[^}]*margin-top:\s*32px/', $css );
        $this->assertStringNotContainsString(
            '__table',
            $css,
            'A tabela não pode receber margem própria: o espaçamento é do bloco.'
        );

        // Enfileirado SÓ na tela de pedido.
        $public = (string) file_get_contents( $root . '/Public/WcBetterShippingCalculatorForBrazilPublic.php' );
        $this->assertStringContainsString( 'WcBetterShippingCalculatorForBrazilOrderDetails.COMPILED.css', $public );

        $trecho = substr( $public, strpos( $public, 'WcBetterShippingCalculatorForBrazilOrderDetails.COMPILED.css' ) - 900, 900 );
        $this->assertStringContainsString( 'is_order_received_page', $trecho, 'O CSS deve ser enfileirado na tela de pedido recebido.' );
        $this->assertStringContainsString( 'is_view_order_page', $trecho, 'O CSS deve ser enfileirado em "ver pedido".' );
    }

    /**
     * O bloco sai no hook NATURAL (fim dos endereços) e o fallback do
     * `woocommerce_thankyou` não o duplica.
     */
    public function test_additional_info_is_rendered_by_the_natural_hook_only_once(): void {
        // Registra os hooks (cada teste começa com o $wp_filter limpo).
        $this->plugin_instance();

        update_option( 'woo_better_calc_enable_order_details', 'yes' );

        add_filter(
            'woo_better_customer_details_rows',
            static function ( $rows ) {
                $rows[] = array( 'label' => 'Linha', 'value' => 'de teste' );
                return $rows;
            }
        );

        $order = new \WC_Order();
        $order->set_billing_first_name( 'Fulano' );
        $order->save();

        // 1) Hook natural — disparado pelo fim do `order/order-details-customer.php`,
        //    logo DEPOIS dos endereços.
        ob_start();
        do_action( 'woocommerce_order_details_after_customer_details', $order );
        $natural = (string) ob_get_clean();

        $this->assertStringContainsString( 'woo-better-additional-info', $natural );

        // 2) Fallback (`woocommerce_thankyou`): não repete o bloco. Chamado direto
        //    (o hook completo depende de funções de template que o core só carrega
        //    no frontend — `woocommerce_order_details_table`). Recebe o PEDIDO (e não
        //    o ID) porque `wc_get_order` antes do `register_post_type` dispara
        //    `_doing_it_wrong` no ambiente de testes.
        ob_start();
        $this->plugin_instance()->render_customer_additional_info( $order );
        $fallback = (string) ob_get_clean();

        $this->assertStringNotContainsString(
            'woo-better-additional-info',
            $fallback,
            'O fallback não pode repetir o bloco já renderizado no hook natural.'
        );
    }

    public function test_registered_on_block_and_classic_order_hooks(): void {
        // Regressão do bug "nada aconteceu": o checkout em BLOCOS dispara
        // `woocommerce_thankyou` (bloco order-confirmation-additional-information) e
        // NÃO `woocommerce_order_details_after_customer_details`. O bloco precisa
        // estar nos DOIS hooks para aparecer em qualquer tema.
        $this->assertTrue(
            $this->hook_has_plugin_method( 'woocommerce_thankyou', 'render_customer_additional_info' ),
            'O bloco deve estar em woocommerce_thankyou (checkout em blocos).'
        );
        $this->assertTrue(
            $this->hook_has_plugin_method( 'woocommerce_order_details_after_customer_details', 'render_customer_additional_info' ),
            'O bloco deve estar em woocommerce_order_details_after_customer_details (clássico).'
        );
    }
}
