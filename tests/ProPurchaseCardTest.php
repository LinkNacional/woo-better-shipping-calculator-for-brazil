<?php
/**
 * Regressão: os cartões laterais da tela de configurações.
 *
 * Há DOIS cartões possíveis no rodapé do sidebar, mas só UM aparece por vez:
 *
 *  - BRANCO (`block-pro-offer`): "quer o PRO?" — compra plugin + licença, com o
 *    piso da licença anual e a nota de que o valor sobe com o volume de
 *    pedidos. Só existe enquanto o plugin PRO **não** está instalado.
 *  - ROXO (`block-promotional-card`): "conheça o produto" — botão "Conheça
 *    mais" apontando para a página comercial. Só existe quando o PRO **está**
 *    instalado (ativo ou não): aí não há o que comprar.
 *
 * A decisão do card branco é a PRESENÇA do plugin (`is_pro_installed()`) — não
 * a licença e nem o "está ativo": desativar o PRO não apaga os arquivos, e era
 * exatamente aí que os DOIS cartões apareciam juntos (com o plugin desativado,
 * `is_pro_active()` é falso). Quem instala o PRO sem comprar tem o bloco
 * "Licença" (injetado pelo próprio PRO nesta tela) como caminho, e um upsell ao
 * lado dele só confunde.
 *
 * O preço vem do ProGate (`license_price()`), não do template: quando a API de
 * billing passar a responder os planos, só a origem muda.
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

use Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate;
use Lkn\WcBetterShippingCalculatorForBrazil\Admin\partials\WcBetterShippingCalculatorForBrazilCheckoutSettings;
use WP_UnitTestCase;

class ProPurchaseCardTest extends WP_UnitTestCase {

    /**
     * Simula o PRO AUSENTE do site.
     *
     * Necessário porque esta suíte roda no WordPress de verdade, onde o plugin
     * PRO está instalado — `is_pro_installed()` veria os arquivos no disco e
     * esconderia o card branco em todos os testes.
     */
    private function with_pro_absent( callable $assertions ): void {
        add_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_false' );

        try {
            $assertions();
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_false' );
        }
    }

    /**
     * Simula o PRO INSTALADO (ativo ou não), sem depender do disco.
     *
     * O plugin PRO é removido/instalado no meio dos testes manuais deste
     * ambiente, então o estado não pode vir da pasta — vem de filtro.
     */
    private function with_pro_installed( callable $assertions ): void {
        add_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_true' );

        try {
            $assertions();
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_true' );
        }
    }

    /**
     * Renderiza a tela de configurações inteira (os cartões vivem na lateral).
     *
     * Por padrão simula o PRO AUSENTE: é o único estado em que o pop-up de
     * compra é impresso, e a maior parte dos testes aqui inspeciona o pop-up.
     * Quem quer o estado real do ambiente passa `false`.
     *
     * @param bool $pro_absent Simular o plugin PRO fora do site?
     */
    private function render_screen( bool $pro_absent = true ): string {
        if ( ! $pro_absent ) {
            return $this->do_render();
        }

        add_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_false' );

        try {
            return $this->do_render();
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_false' );
        }
    }

    /**
     * Render cru da tela, sem mexer em filtro nenhum.
     */
    private function do_render(): string {
        $page = new WcBetterShippingCalculatorForBrazilCheckoutSettings();

        ob_start();
        $page->output();
        $html = ob_get_clean();

        return is_string( $html ) ? $html : '';
    }

    /**
     * Sem o PRO no site o cartão é o de COMPRA — e o roxo não entra junto.
     */
    public function test_sem_pro_exibe_apenas_o_card_de_compra(): void {
        $this->with_pro_absent(
            function () {
                $this->assertFalse( WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_installed() );

                $html = $this->render_screen();

                $this->assertStringContainsString( 'block-pro-offer-price-value', $html );
                $this->assertStringContainsString( 'R$ ' . WcBetterShippingCalculatorForBrazilAdminProGate::license_price(), $html );
                $this->assertStringContainsString( 'block-pro-offer-cta', $html );

                // Cada recurso é um item de lista (o parágrafo corrido antigo saiu).
                $this->assertMatchesRegularExpression( '/<ul class="block-pro-offer-features">/', $html );
                $this->assertGreaterThanOrEqual( 4, substr_count( $html, '<li>' ), 'Esperado um <li> por recurso do PRO.' );

                // Um cartão por vez: com o PRO fora do site, o roxo não entra.
                $this->assertStringNotContainsString( 'block-promotional-card', $html );
                $this->assertStringNotContainsString( 'Conheça mais', $html );

                // O pop-up de compra vem junto (o CTA dele é o único gatilho).
                $this->assertSame( 1, substr_count( $html, 'data-lkn-billing-open' ) );
            }
        );
    }

    /**
     * O "Conheça mais" leva para a página comercial (não para "#" como antes).
     *
     * O cartão roxo só existe com o PRO instalado.
     */
    public function test_card_promocional_aponta_para_a_pagina_comercial(): void {
        $this->with_pro_installed(
            function () {
                $html = $this->render_screen( false );

                $this->assertMatchesRegularExpression(
                    '/block-promotional-card-btn-learn"[^>]*href="' . preg_quote( WcBetterShippingCalculatorForBrazilAdminProGate::upgrade_url(), '/' ) . '"/',
                    $html
                );
            }
        );
    }

    /**
     * O preço é o piso da faixa, não o valor fechado: por isso aparece como
     * "a partir de" e sem período colado no número (o valor varia com o volume
     * de pedidos da loja).
     */
    public function test_preco_aparece_como_piso_sem_periodo_colado(): void {
        $this->with_pro_absent(
            function () {
                $html = $this->render_screen();

                $this->assertMatchesRegularExpression( '/block-pro-offer-price-label">\s*A partir de/', $html );

                // Nem "R$ 10/ano" nem "R$ 10,00/ano": o número não pode sugerir preço fixo.
                $this->assertDoesNotMatchRegularExpression( '/R\$\s*10(,\d+)?\s*\/\s*ano/i', $html );
                $this->assertDoesNotMatchRegularExpression( '/block-pro-offer-price-period/', $html );
            }
        );
    }

    /**
     * A nota precisa explicar o modelo de preço, senão o piso parece o valor
     * final da licença.
     */
    public function test_nota_explica_licenca_anual_e_preco_por_volume(): void {
        $this->with_pro_absent(
            function () {
                $html = $this->render_screen();

                $this->assertMatchesRegularExpression( '/Licença anual/', $html );
                $this->assertMatchesRegularExpression( '/volume de pedidos/i', $html );
            }
        );
    }

    /**
     * Com o PRO instalado o card BRANCO sai (quem decide é a presença do
     * plugin, não a licença) e o ROXO fica.
     *
     * O caminho da licença de quem já instalou é o bloco "Licença" que o
     * próprio PRO injeta nesta tela; a tela do gratuito não repete o upsell.
     */
    public function test_com_pro_instalado_mostra_so_o_card_promocional(): void {
        $this->with_pro_installed(
            function () {
                $html = $this->render_screen( false );

                // O de compra sai — junto com o pop-up (o CTA dele é o único gatilho).
                $this->assertStringNotContainsString( 'block-pro-offer', $html );
                $this->assertStringNotContainsString( 'data-lkn-billing-open', $html );
                $this->assertStringNotContainsString( 'lkn-billing__', $html );

                // O promocional fica, ativo ou não o PRO.
                $this->assertStringContainsString( 'block-promotional-card', $html );
                $this->assertStringContainsString( 'Conheça mais', $html );
            }
        );
    }

    /**
     * O bug relatado: PRO INSTALADO mas DESATIVADO.
     *
     * Desativar o plugin não apaga os arquivos, mas zera a constante de versão —
     * `is_pro_active()` fica falso. Enquanto a decisão era por "ativo", a tela
     * mostrava os DOIS cartões ao mesmo tempo (um oferecendo comprar o plugin
     * que já está ali, outro convidando a conhecê-lo).
     */
    public function test_com_pro_instalado_e_desativado_mostra_so_o_card_promocional(): void {
        add_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_false' );
        add_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_true' );

        try {
            $this->assertFalse( WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_active() );

            $html = $this->render_screen( false );

            $this->assertStringNotContainsString( 'block-pro-offer', $html );
            $this->assertStringNotContainsString( 'Adquirir a licença', $html );
            $this->assertStringContainsString( 'block-promotional-card', $html );
            $this->assertStringContainsString( 'Conheça mais', $html );
        } finally {
            remove_filter( 'wc_better_shipping_calculator_is_pro_active', '__return_false' );
            remove_filter( 'wc_better_shipping_calculator_is_pro_installed', '__return_true' );
        }
    }

    /**
     * Um cartão, nunca os dois — e nunca nenhum.
     *
     * A regra é exclusiva por construção (o template usa `if/else`), mas o teste
     * protege as duas combinações que já quebraram na prática: os dois juntos
     * (plugin desativado ressuscitando o card de compra) e nenhum.
     */
    public function test_nunca_mostra_os_dois_cartoes(): void {
        $combos = array(
            'PRO ausente (nem ativo, nem instalado)' => array( false, false, true ),
            'PRO instalado e ativo'                  => array( true, true, false ),
            'PRO instalado e desativado'             => array( false, true, false ),
        );

        foreach ( $combos as $rotulo => $combo ) {
            list( $active, $installed, $expect_offer ) = $combo;

            add_filter( 'wc_better_shipping_calculator_is_pro_active', $active ? '__return_true' : '__return_false' );
            add_filter( 'wc_better_shipping_calculator_is_pro_installed', $installed ? '__return_true' : '__return_false' );

            try {
                $html = $this->render_screen( false );

                $this->assertSame(
                    $expect_offer ? 1 : 0,
                    substr_count( $html, 'block-pro-offer-title' ),
                    $rotulo . ': card branco'
                );
                $this->assertSame(
                    $expect_offer ? 0 : 1,
                    substr_count( $html, 'block-promotional-card-title' ),
                    $rotulo . ': card roxo'
                );
                $this->assertSame(
                    1,
                    substr_count( $html, 'block-pro-offer-title' ) + substr_count( $html, 'block-promotional-card-title' ),
                    $rotulo . ': total de cartões'
                );
            } finally {
                remove_filter( 'wc_better_shipping_calculator_is_pro_active', $active ? '__return_true' : '__return_false' );
                remove_filter( 'wc_better_shipping_calculator_is_pro_installed', $installed ? '__return_true' : '__return_false' );
            }
        }
    }

    /**
     * O JS precisa saber se o PRO já está instalado (para não reinstalar).
     *
     * Isso não vai no markup: vai no `wp_localize_script`, junto do resto da
     * configuração do pop-up.
     */
    public function test_config_do_popup_informa_se_o_pro_ja_esta_instalado(): void {
        $this->with_pro_installed(
            function () {
                wp_enqueue_scripts();
                wp_scripts()->registered = array();
                wp_scripts()->queue = array();

                \Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Billing::enqueue();

                $data = wp_scripts()->get_data( 'wc-better-calc-billing', 'before' );
                $data = is_array( $data ) ? implode( "\n", $data ) : (string) $data;

                $this->assertNotSame( '', $data, 'O pop-up não publicou a própria configuração.' );
                $this->assertStringContainsString( 'proInstalled', $data );
                // Instalado (ainda que desativado): o pop-up não reinstala por
                // cima. Quem manda é o disco, não a constante de versão.
                $this->assertMatchesRegularExpression( '/"proInstalled":true/', (string) $data );
                // O `product` publicado no JS é o nome da pasta do PRO.
                $this->assertStringContainsString(
                    '"product":"' . dirname( WcBetterShippingCalculatorForBrazilAdminProGate::PRO_BASENAME ) . '"',
                    $data
                );
            }
        );
    }

    /**
     * Sem o PRO no disco, o pop-up instala (é o caminho de quem ainda não tem).
     */
    public function test_config_do_popup_instala_quando_o_pro_nao_esta_instalado(): void {
        $this->with_pro_absent(
            function () {
                wp_enqueue_scripts();
                wp_scripts()->registered = array();
                wp_scripts()->queue = array();

                \Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Billing::enqueue();

                $data = wp_scripts()->get_data( 'wc-better-calc-billing', 'before' );
                $data = is_array( $data ) ? implode( "\n", $data ) : (string) $data;

                $this->assertMatchesRegularExpression( '/"proInstalled":false/', (string) $data );
            }
        );
    }

    /**
     * Sem o PRO instalado, a oferta é a de sempre: comprar plugin + licença.
     */
    public function test_sem_pro_instalado_oferece_instalar(): void {
        $this->with_pro_absent(
            function () {
                $html = $this->render_screen();

                $this->assertStringContainsString( 'Versão PRO', $html );
                $this->assertStringContainsString( 'Instalar plugin', $html );
                $this->assertStringNotContainsString( 'Falta ativar a licença', $html );
            }
        );
    }

    /**
     * O preço é filtrável — é por aqui que a API de billing assume a fonte.
     */
    public function test_preco_e_periodo_sao_filtraveis(): void {
        $this->assertSame( '10', WcBetterShippingCalculatorForBrazilAdminProGate::license_price() );

        add_filter(
            'wc_better_shipping_calculator_pro_license_price',
            static function () {
                return '29';
            }
        );

        try {
            $this->assertSame( '29', WcBetterShippingCalculatorForBrazilAdminProGate::license_price() );

            $this->with_pro_absent(
                function () {
                    $this->assertStringContainsString( 'R$ 29', $this->render_screen() );
                }
            );
        } finally {
            remove_all_filters( 'wc_better_shipping_calculator_pro_license_price' );
        }
    }

    /**
     * E-mail e forma de pagamento na MESMA tela — e a operadora não é perguntada.
     *
     * Antes eram três passos (e-mail -> operadora -> método). Escolher PSP é
     * decisão que o lojista não tem como tomar bem, e o par meio->operadora é
     * fixo no contrato: Pix na Rede, cartão na Cielo. Perguntar os dois abria a
     * porta de pedir Pix na Cielo.
     */
    public function test_pagamento_e_escolhido_na_tela_do_email(): void {
        $html = $this->render_screen();

        $pos_email = strpos( $html, 'data-step-name="email"' );
        $pos_pix   = strpos( $html, 'data-lkn-method="pix"' );
        $pos_card  = strpos( $html, 'data-lkn-method="card"' );

        $this->assertNotFalse( $pos_email );
        $this->assertNotFalse( $pos_pix );
        $this->assertNotFalse( $pos_card );

        // Os dois meios vivem DENTRO da tela do e-mail...
        $this->assertGreaterThan( $pos_email, $pos_pix, 'O Pix tem que estar na tela do e-mail.' );
        $this->assertGreaterThan( $pos_email, $pos_card, 'O cartão tem que estar na tela do e-mail.' );

        // ...e não existe mais passo de operadora nem de método solto.
        $this->assertStringNotContainsString( 'data-step-name="gateway"', $html );
        $this->assertStringNotContainsString( 'data-step-name="method"', $html );
        $this->assertStringNotContainsString( 'Qual operadora', $html );
    }

    /**
     * Cada meio carrega o PSP que o processa: Pix -> Rede, cartão -> Cielo.
     */
    public function test_cada_meio_declara_a_operadora_fixa(): void {
        $html = $this->render_screen();

        // A Rede saiu do projeto: os DOIS meios são da Cielo. O atributo segue
        // por botão porque é ele que permite desligar um meio no servidor.
        $this->assertMatchesRegularExpression(
            '/data-lkn-method="pix"\s+data-lkn-provider="cielo"/',
            $html,
            'Pix processa na Cielo.'
        );
        $this->assertMatchesRegularExpression(
            '/data-lkn-method="card"\s+data-lkn-provider="cielo"/',
            $html,
            'Cartão processa na Cielo.'
        );
    }

    /**
     * O "Continuar" nasce desabilitado: só libera com e-mail válido E um meio
     * escolhido (o JS reavalia no `input` e no clique do meio).
     */
    public function test_continuar_nasce_desabilitado(): void {
        $html = $this->render_screen();

        $this->assertMatchesRegularExpression(
            '/data-lkn-go="start"\s+disabled/',
            $html,
            'O Continuar precisa começar desabilitado.'
        );
        $this->assertStringContainsString( 'refreshContinue', file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' ) );
    }

    /**
     * A lista de gateways vem da API, não do markup: o `.zip` instalado no
     * cliente não se atualiza sozinho.
     */
    public function test_script_busca_os_gateways_na_resposta_da_api(): void {
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );

        $this->assertIsString( $js );
        $this->assertStringContainsString( 'applyGateways(result.data.gateways)', preg_replace( '/\s+/', ' ', $js ) );
        $this->assertStringContainsString( 'provider: state.provider', $js );
    }

    /**
     * `restUrl` sem barra no fim.
     *
     * Com barra, o JS montava `.../lkn-billing/v1//install` e o WordPress
     * respondia `rest_no_route` (404): instalar e ativar NUNCA funcionaram.
     */
    public function test_config_do_popup_publica_rest_url_sem_barra_final(): void {
        wp_scripts()->registered = array();
        wp_scripts()->queue = array();

        \Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Billing::enqueue();

        $data = wp_scripts()->get_data( 'wc-better-calc-billing', 'before' );
        $data = is_array( $data ) ? implode( "\n", $data ) : (string) $data;

        // Decodifica a config em vez de casar com o escape do JSON: o que
        // importa é a URL final, não como ela aparece escapada.
        preg_match( '/window\.lknBilling = (\{.*\});/s', $data, $m );

        $this->assertNotEmpty( $m, 'Não achei a config do pop-up no script inline.' );

        $cfg = json_decode( $m[1], true );

        $this->assertIsArray( $cfg );
        $this->assertArrayHasKey( 'restUrl', $cfg );

        $rest_url = (string) $cfg['restUrl'];

        // A barra no fim é o bug: `/lkn-billing/v1` + `/install` = `v1//install`,
        // que o WordPress recusa com `rest_no_route`.
        $this->assertNotSame(
            '/',
            substr( $rest_url, -1 ),
            'restUrl não pode terminar em barra: o JS acrescenta `/install`.'
        );

        $this->assertStringEndsWith( '/lkn-billing/v1', $rest_url );
    }

    /**
     * O preço saiu do cabeçalho e virou recibo no fim: antes do pagamento o
     * valor é combinado fora do pop-up.
     */
    public function test_popup_nao_mostra_preco_antes_de_pagar(): void {
        wp_scripts()->registered = array();
        wp_scripts()->queue = array();

        \Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Billing::enqueue();
        $html = \Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Popup::html();

        $this->assertStringNotContainsString( 'A partir de', $html );
        $this->assertStringNotContainsString( 'Licença anual. O valor final depende do volume', $html );
        $this->assertStringNotContainsString( 'lkn-billing__price', $html );

        // O recibo existe, mas escondido até o pagamento.
        $this->assertStringContainsString( 'data-lkn-receipt', $html );
        $this->assertMatchesRegularExpression( '/data-lkn-receipt[^>]*hidden/', $html );
    }

    /**
     * Confirmação visual: tique desenhado e barra que desliza. Texto sozinho
     * não diz que a etapa terminou.
     */
    public function test_popup_usa_tique_e_barra_de_progresso(): void {
        wp_scripts()->registered = array();
        wp_scripts()->queue = array();

        \Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Billing::enqueue();
        $html = \Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\Popup::html();

        $this->assertStringContainsString( 'lkn-billing__check-circle', $html );
        $this->assertStringContainsString( 'lkn-billing__check-mark', $html );
        $this->assertStringContainsString( 'lkn-billing__progress-bar', $html );
        $this->assertStringContainsString( 'role="progressbar"', $html );
    }

    /**
     * Só o botão do e-mail ABRE o checkout.
     *
     * Ele dividia `data-lkn-go="method"` com os "Voltar" do Pix e do cartão — e
     * o handler tratava todo mundo como `startCheckout`, então voltar criava um
     * checkout NOVO (e, com mais de um gateway, jogava a pessoa no passo da
     * operadora de novo).
     */
    public function test_apenas_o_botao_do_email_inicia_o_checkout(): void {
        $html = $this->render_screen();

        $this->assertStringContainsString( 'data-lkn-go="start"', $html, 'O Continuar do e-mail precisa de marcador próprio.' );

        // Os "Voltar" do Pix e do cartão são navegação pura e voltam para a
        // primeira tela, onde a escolha do meio continua marcada.
        $this->assertSame(
            2,
            substr_count( $html, 'data-lkn-go="email"' ),
            'Esperado dois "Voltar" (Pix e cartão) apontando para a primeira tela.'
        );
        $this->assertSame( 1, substr_count( $html, 'data-lkn-go="start"' ) );
    }

    /**
     * Recibo: tabela de DUAS COLUNAS abaixo da confirmação.
     *
     * Três linhas — o pedido (1× produto e valor), a parcela e o total — cada
     * uma com rótulo à esquerda e valor à direita, como num recibo de verdade.
     */
    public function test_recibo_tem_item_valor_condicao_e_total(): void {
        $html = $this->render_screen();

        foreach ( array( 'data-lkn-receipt-name', 'data-lkn-paid-amount', 'data-lkn-paid-terms', 'data-lkn-paid-total' ) as $campo ) {
            $this->assertStringContainsString( $campo, $html, 'Falta o campo ' . $campo . ' no recibo.' );
        }

        $this->assertStringContainsString( 'lkn-billing__receipt-qty', $html );
        $this->assertStringContainsString( 'lkn-billing__receipt-row--total', $html );

        // Duas colunas de verdade: `<th scope="row">` (rótulo) + `<td>` (valor).
        // Com `flex` o leitor de tela lia os valores soltos, sem o rótulo.
        $this->assertMatchesRegularExpression(
            '/<table[^>]*lkn-billing__receipt/',
            $html,
            'O recibo tem que ser uma tabela.'
        );
        $this->assertStringContainsString( '<th class="lkn-billing__receipt-k" scope="row">', $html );
        $this->assertStringContainsString( 'class="lkn-billing__receipt-v"', $html );

        // Uma linha por informação, na ordem de leitura: pedido, parcela, total.
        // O rótulo exato (`>Parcela</th>`) porque "Parcelas" também é o label do
        // select de parcelas do cartão, que aparece bem antes no documento.
        $pos_pedido  = strpos( $html, 'data-lkn-receipt-name' );
        $pos_parcela = strpos( $html, '>Parcela</th>' );
        $pos_total   = strpos( $html, 'data-lkn-paid-total' );

        $this->assertNotFalse( $pos_parcela, 'Falta a linha "Parcela" no recibo.' );

        $this->assertLessThan( $pos_parcela, $pos_pedido, 'O pedido abre o recibo.' );
        $this->assertLessThan( $pos_total, $pos_parcela, 'O total fecha o recibo.' );

        // O recibo virou tabela: nada de "Valor pago"/"Condição" (rótulos da
        // versão em `<p>` empilhados).
        $this->assertStringNotContainsString( 'Valor pago', $html );
        $this->assertStringNotContainsString( 'Condição', $html );

        // A confirmação vem primeiro (ícone + "Pagamento aprovado"), o recibo
        // logo abaixo: é a ordem de leitura do recibo de verdade.
        $pos_ok     = strpos( $html, 'lkn-billing__ok--plain' );
        $pos_recibo = strpos( $html, 'data-lkn-receipt' );

        $this->assertNotFalse( $pos_ok );
        $this->assertNotFalse( $pos_recibo );
        $this->assertLessThan( $pos_recibo, $pos_ok, 'A confirmação tem que vir acima do recibo.' );
    }

    /**
     * As três etapas convivem na MESMA página.
     *
     * Antes cada uma trocava de tela (`ready` -> `installed` -> `activated`), e
     * a pessoa perdia o fio do que já tinha feito e do que faltava.
     */
    public function test_as_tres_etapas_ficam_na_mesma_pagina(): void {
        $html = $this->render_screen();

        foreach ( array( 'install', 'activate', 'settings' ) as $etapa ) {
            $this->assertStringContainsString(
                'data-lkn-task="' . $etapa . '"',
                $html,
                'Falta a etapa ' . $etapa . ' na tela de conclusão.'
            );
        }

        // Ordem: instalar -> ativar -> configurações (as três na mesma tela).
        $pos_install  = strpos( $html, 'data-lkn-task="install"' );
        $pos_activate = strpos( $html, 'data-lkn-task="activate"' );
        $pos_settings = strpos( $html, 'data-lkn-task="settings"' );

        $this->assertLessThan( $pos_activate, $pos_install );
        $this->assertLessThan( $pos_settings, $pos_activate );

        // O .zip fica na tela do recibo, mas DEPOIS do botão principal: é o
        // caminho alternativo, e não deve competir com o automático.
        $pos_download = strpos( $html, 'data-lkn-download' );
        $pos_iniciar  = strpos( $html, 'data-lkn-go="tasks"' );

        $this->assertLessThan( $pos_download, $pos_iniciar, 'O botão principal vem antes do .zip.' );
        $this->assertLessThan( $pos_install, $pos_download, 'O .zip mora na tela do recibo.' );

        // As telas antigas não existem mais.
        $this->assertStringNotContainsString( 'data-step-name="installed"', $html );
        $this->assertStringNotContainsString( 'data-step-name="activated"', $html );
    }

    /**
     * Ativar e seguir começam BLOQUEADOS: a etapa anterior libera a próxima.
     */
    public function test_ativar_comeca_bloqueado_quando_o_pro_nao_esta_instalado(): void {
        $html = $this->render_screen();

        $this->assertMatchesRegularExpression(
            '/data-lkn-activate[^>]*disabled|disabled[^>]*data-lkn-activate/',
            $html,
            'Ativar precisa começar desabilitado sem o PRO instalado.'
        );

        $this->assertMatchesRegularExpression(
            '/data-lkn-settings[^>]*aria-disabled="true"|aria-disabled="true"[^>]*data-lkn-settings/',
            $html,
            'O botão de configurações só libera depois de ativar.'
        );

        // O botão de instalar é o único que começa acionável.
        $this->assertDoesNotMatchRegularExpression(
            '/data-lkn-install[^>]*\sdisabled/',
            $html,
            'Instalar tem que estar acionável.'
        );
    }

    /**
     * Erro de ativação não pode passar por sucesso.
     *
     * A rota responde `{ok:true, activated:false}` quando o PRO ainda não
     * carregou (só gravou a chave). Ler `ok` mostrava "Licença ativa" sem
     * licença nenhuma; o que conta é `activated`/`features`.
     */
    public function test_ativacao_exige_activated_true(): void {
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );

        $this->assertIsString( $js );
        $this->assertStringContainsString( 'data.activated === true', $js );
        $this->assertStringContainsString( 'data.features === true', $js );
        $this->assertStringContainsString( 'licenseActive', $js );
    }

    /**
     * O .zip é um BOTÃO (baixa sem sair da página), não um link para outra aba.
     */
    public function test_download_do_zip_e_botao_nao_link_externo(): void {
        $html = $this->render_screen();

        $this->assertStringContainsString( 'data-lkn-download', $html );
        $this->assertStringContainsString( 'Baixar o .zip e instalar manualmente', $html );

        // Nada de `target="_blank"` no download: abrir aba nova perde o fluxo.
        $this->assertStringNotContainsString( 'data-lkn-manual-link', $html );

        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertStringContainsString( 'function download()', $js );
        $this->assertStringContainsString( "link.download = ''", $js );
    }

    /**
     * A chave da licença não é exibida (ela já chegou no e-mail).
     */
    public function test_nao_exibe_a_chave_da_licenca(): void {
        $html = $this->render_screen();

        $this->assertStringNotContainsString( 'data-lkn-license-key', $html );
    }

    /**
     * Etapa concluída vira botão verde com tique; bloqueada fica cinza.
     */
    public function test_css_tem_estados_de_concluido_e_bloqueado(): void {
        $css = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.css' );

        $this->assertIsString( $css );
        $this->assertStringContainsString( '.lkn-billing__btn.is-done', $css );
        $this->assertStringContainsString( '.lkn-billing__btn.is-locked', $css );
        $this->assertStringContainsString( '.lkn-billing__check--inline', $css );

        // Carregando: preenchimento no FUNDO do botão, não barra por fora.
        $this->assertStringContainsString( '.lkn-billing__btn--task.is-busy', $css );
        $this->assertStringContainsString( 'lkn-billing-btn-sheen', $css );
        $this->assertStringNotContainsString( '.lkn-billing__progress--task', $css );
    }

    /**
     * A tela do recibo mostra a confirmação SEM o bloco verde.
     *
     * O bloco pintado funciona como aviso no meio do conteúdo; aqui ele é o
     * resultado da tela inteira, e a caixa verde deixava o momento pesado.
     */
    public function test_confirmacao_nao_usa_bloco_verde(): void {
        $html = $this->render_screen();

        $this->assertStringContainsString( 'lkn-billing__ok--plain', $html );
        $this->assertStringContainsString( 'lkn-billing__step--center', $html );

        $css = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.css' );
        $this->assertIsString( $css );
        $this->assertStringContainsString( '.lkn-billing__ok--plain', $css );
        // Sem fundo: a variante é a que tira o verde.
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__ok--plain\s*\{[^}]*background:\s*none/',
            $css,
            'A variante --plain tem que remover o fundo verde.'
        );
        $this->assertStringContainsString( 'flex-direction: column', $css );
    }

    /**
     * Ordem da tela: confirmação -> recibo -> botão principal -> .zip.
     *
     * O link do .zip é a saída de emergência: fica embaixo, depois da ação
     * principal, para não disputar o clique de quem vai instalar sozinho.
     */
    public function test_ordem_da_tela_de_recibo(): void {
        $html = $this->render_screen();

        $pos_ok       = strpos( $html, 'lkn-billing__ok--plain' );
        $pos_recibo   = strpos( $html, 'data-lkn-receipt' );
        $pos_iniciar  = strpos( $html, 'data-lkn-go="tasks"' );
        $pos_download = strpos( $html, 'data-lkn-download' );

        $this->assertLessThan( $pos_recibo, $pos_ok, 'Confirmação primeiro.' );
        $this->assertLessThan( $pos_iniciar, $pos_recibo, 'Recibo antes do botão de instalar.' );
        $this->assertLessThan( $pos_download, $pos_iniciar, 'O .zip vem depois do botão principal.' );
    }

    /**
     * As três etapas só aparecem DEPOIS de clicar em instalar.
     *
     * A tela do recibo tem um botão só ("Instalar automaticamente"); as etapas
     * moram na tela seguinte, que entra com o flip.
     */
    public function test_etapas_ficam_em_tela_propria_apos_o_recibo(): void {
        $html = $this->render_screen();

        $this->assertStringContainsString( 'data-step-name="tasks"', $html );
        $this->assertStringContainsString( 'Instalar automaticamente', $html );

        // As etapas estão na seção `tasks`, não na `ready`.
        $pos_ready = strpos( $html, 'data-step-name="ready"' );
        $pos_tasks = strpos( $html, 'data-step-name="tasks"' );
        $pos_install = strpos( $html, 'data-lkn-task="install"' );

        $this->assertLessThan( $pos_tasks, $pos_ready, 'A tela do recibo vem antes das etapas.' );
        $this->assertLessThan( $pos_install, $pos_tasks, 'Os botões moram na tela de etapas.' );

        // `tasks` entra na ordem dos passos, senão o flip perde a direção.
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertStringContainsString( "'tasks'", $js );
    }

    /**
     * Troca de passo: UMA volta no card (180°), em duas metades sequenciais.
     *
     * Um giro de 360° mostra a frente duas vezes — no começo e aos 180° —, e é
     * isso que se vê como "girou duas vezes": o conteúdo chega no meio do
     * caminho, continua girando e chega de novo no fim. Meia-volta tem uma
     * chegada só, que é o que este teste trava.
     */
    public function test_card_da_uma_volta_so_com_duas_faces(): void {
        $css = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.css' );
        $this->assertIsString( $css );

        // Face = card completo, fora do fluxo, sem verso espelhado à mostra.
        $this->assertStringContainsString( '.lkn-billing__face {', $css );
        $this->assertMatchesRegularExpression( '/\.lkn-billing__face\s*\{[^}]*position:\s*absolute/s', $css );
        $this->assertMatchesRegularExpression( '/\.lkn-billing__face\s*\{[^}]*backface-visibility:\s*hidden/s', $css );

        // Uma volta: 0 -> 90 na saída e -90 -> 0 na chegada (e o espelho).
        $saida = $this->pegar_keyframe( $css, 'turn-out' );
        $this->assertStringContainsString( 'rotateY(0)', $saida );
        $this->assertStringContainsString( 'rotateY(90deg)', $saida );

        $chegada = $this->pegar_keyframe( $css, 'turn-in' );
        $this->assertStringContainsString( 'rotateY(-90deg)', $chegada );
        $this->assertStringContainsString( 'rotateY(0)', $chegada );

        $this->assertStringContainsString( 'rotateY(-90deg)', $this->pegar_keyframe( $css, 'turn-out-back' ) );
        $this->assertStringContainsString( 'rotateY(90deg)', $this->pegar_keyframe( $css, 'turn-in-back' ) );

        // UMA volta, não duas: nada de 180/360/540 nos keyframes.
        foreach ( array( 'turn-out', 'turn-in', 'turn-out-back', 'turn-in-back' ) as $nome ) {
            $bloco = $this->pegar_keyframe( $css, $nome );
            $this->assertDoesNotMatchRegularExpression(
                '/rotateY\(-?(1[89]\d|2\d\d|3\d\d|5\d\d)deg\)/',
                $bloco,
                'O keyframe ' . $nome . ' passa de meia-volta: o card giraria duas vezes.'
            );
        }

        // NADA de opacidade: opacidade é o que fazia o card "sumir e voltar".
        foreach ( array( 'turn-out', 'turn-in', 'turn-out-back', 'turn-in-back' ) as $nome ) {
            $this->assertStringNotContainsString( 'opacity', $this->pegar_keyframe( $css, $nome ) );
        }

        // As metades são SEQUENCIAIS: a face de trás espera a da frente sair,
        // senão as duas aparecem ao mesmo tempo e o card duplica.
        $this->assertMatchesRegularExpression(
            '/face--verso\.lkn-billing__face--avancar\s*\{\s*animation:[^;]*\s0\.24s\s/',
            $css,
            'A segunda metade precisa de `animation-delay` igual à duração da primeira.'
        );

        // A primeira acelera (sai) e a segunda desacelera (assenta).
        $this->assertMatchesRegularExpression( '/face--frente\.lkn-billing__face--avancar\s*\{\s*animation:[^;]*ease-in/', $css );

        // O card de verdade sai de cena sem sair do layout.
        $this->assertMatchesRegularExpression( '/\.lkn-billing__dialog--escondido\s*\{\s*visibility:\s*hidden/s', $css );

        // Tela estreita: as faces seguem o card colado embaixo.
        $this->assertMatchesRegularExpression(
            '/max-width: 480px[\s\S]*\.lkn-billing__face\s*\{[^}]*align-items:\s*flex-end/',
            $css
        );
    }

    /**
     * Extrai o bloco de um `@keyframes` (do início até o `}` que o fecha).
     */
    private function pegar_keyframe( string $css, string $nome ): string {
        $ini = strpos( $css, '@keyframes lkn-billing-card-' . $nome );

        $this->assertNotFalse( $ini, 'Keyframe inexistente: ' . $nome );

        $abre  = strpos( $css, '{', $ini );
        $nivel = 0;

        for ( $i = $abre; $i < strlen( $css ); $i++ ) {
            if ( '{' === $css[ $i ] ) {
                $nivel++;
            } elseif ( '}' === $css[ $i ] ) {
                $nivel--;

                if ( 0 === $nivel ) {
                    return substr( $css, $ini, $i - $ini );
                }
            }
        }

        $this->fail( 'Keyframe sem fechamento: ' . $nome );

        return '';
    }

    /**
     * O JS monta as duas faces e não precisa cronometrar a troca de conteúdo.
     *
     * A face de trás já nasce com o passo novo e o CSS a segura de perfil
     * durante o `animation-delay` — então não existe instante para acertar.
     */
    public function test_js_monta_as_duas_faces_sem_cronometrar_a_troca(): void {
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );

        $this->assertIsString( $js );
        $this->assertStringContainsString( 'function montarFace', $js );
        $this->assertStringContainsString( 'cloneNode', $js, 'A face é uma cópia do card.' );
        $this->assertStringContainsString( "lkn-billing__face--' + lado", $js );
        $this->assertStringContainsString( "lkn-billing__face--' + sentido", $js );

        // A face da frente sai com o passo atual; a de trás nasce com o novo.
        $this->assertStringContainsString( "montarFace(null, 'frente'", $js );
        $this->assertStringContainsString( "montarFace(step, 'verso'", $js );

        // A cópia é decoração: não recebe clique, foco nem duplica `id`.
        $this->assertStringContainsString( "setAttribute('inert'", $js );
        $this->assertStringContainsString( 'aria-hidden', $js );
        $this->assertStringContainsString( 'removeAttribute', $js );

        // As cópias não podem entrar nas consultas do fluxo real.
        $this->assertStringContainsString( 'function secoesReais', $js );
        $this->assertStringContainsString( 'closest', $js );

        // O card real fica escondido durante o giro e volta no fim.
        $this->assertStringContainsString( "'lkn-billing__dialog--escondido'", $js );

        // Quem fecha o giro é a SEGUNDA metade (a primeira para de perfil).
        $this->assertStringContainsString( 'verso.addEventListener', $js );

        // Duração lida do CSS, não repetida no JS.
        $this->assertStringContainsString( 'duracaoDoGiro', $js );
        $this->assertStringContainsString( 'animationDelay', $js );

        // Abrir o pop-up NÃO gira: só há transição quando o passo muda.
        // (A regra anterior perguntava "tem seção à mostra?" — e a seção do
        // e-mail nasce visível no HTML, então o card virava à toa ao abrir.)
        $this->assertStringContainsString( 'step !== anterior', $js );
        $this->assertStringNotContainsString( 'algumaAVista', $js );

        // Quem pediu menos animação troca de tela direto, sem montar faces.
        $this->assertStringContainsString( 'prefers-reduced-motion: reduce', $js );
        $this->assertStringContainsString( 'STEP_ORDER', $js );
    }

    /**
     * O recibo existe UMA vez: na tela da confirmação.
     *
     * Ele chegou a ser duplicado na tela das etapas (instalar/ativar), o que
     * repetia o mesmo sumário em duas telas seguidas. Quem acabou de pagar vê o
     * recibo logo abaixo de "Pagamento aprovado"; a tela de etapas é só ação.
     */
    public function test_recibo_existe_so_na_tela_da_confirmacao(): void {
        $html = $this->render_screen();

        $this->assertSame(
            1,
            substr_count( $html, 'data-lkn-receipt hidden' ),
            'O recibo aparece uma vez só, na tela da confirmação.'
        );

        // E está DENTRO do passo `ready`, não das etapas.
        $inicio_ready = strpos( $html, 'data-step-name="ready"' );
        $inicio_tasks = strpos( $html, 'data-step-name="tasks"' );
        $pos_recibo   = strpos( $html, 'data-lkn-receipt' );

        $this->assertGreaterThan( $inicio_ready, $pos_recibo, 'O recibo mora na tela da confirmação.' );
        $this->assertLessThan( $inicio_tasks, $pos_recibo, 'A tela de etapas não tem recibo.' );

        // A tela de etapas abre direto no bloco de tarefas.
        $etapas = substr( $html, strpos( $html, '>', $inicio_tasks ) + 1 );
        $this->assertStringStartsWith(
            '<div class="lkn-billing__tasks">',
            trim( $etapas ),
            'A seção das etapas começa no bloco de tarefas, sem recibo acima.'
        );
    }

    /**
     * O botão das etapas finais é um `<a>` e não pode parecer link.
     */
    public function test_link_botao_das_etapas_nao_fica_sublinhado(): void {
        $css = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.css' );
        $this->assertIsString( $css );

        $bloco = $this->pegar_bloco_css( $css, '.lkn-billing__btn {' );
        $this->assertStringContainsString( 'text-decoration: none', $bloco, 'O `<a>` herdava o sublinhado de link.' );

        // Hover/foco também: o CSS do admin reaplica o sublinhado nesses estados.
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__btn:focus[^{]*\{[^}]*text-decoration:\s*none/s',
            $css
        );
    }

    /**
     * Posição da n-ésima ocorrência (1-based).
     */
    private function nth_strpos( string $texto, string $agulha, int $n ): int {
        $pos = -1;

        for ( $i = 0; $i < $n; $i++ ) {
            $pos = strpos( $texto, $agulha, $pos + 1 );

            $this->assertNotFalse( $pos, 'Ocorrência ' . $i . ' de ' . $agulha . ' não existe.' );
        }

        return $pos;
    }

    /**
     * Extrai um bloco `seletor { ... }` do CSS.
     */
    private function pegar_bloco_css( string $css, string $seletor ): string {
        $ini = strpos( $css, $seletor );

        $this->assertNotFalse( $ini, 'Bloco inexistente: ' . $seletor );

        $fim = strpos( $css, '}', $ini );

        return substr( $css, $ini, $fim - $ini );
    }

    /**
     * O carregamento de cada etapa acontece DENTRO do botão.
     *
     * Antes era uma barra embaixo do botão: parecia de outro elemento e
     * empurrava a lista a cada clique (a altura do card mudava no meio da ação).
     * Agora o preenchimento corre no fundo do próprio botão, atrás do texto.
     */
    public function test_carregamento_da_etapa_acontece_dentro_do_botao(): void {
        $html = $this->render_screen();

        // Nada de elemento de barra dentro das etapas.
        $this->assertStringNotContainsString( 'data-lkn-task-progress', $html );

        $css = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.css' );
        $this->assertIsString( $css );

        // O preenchimento é o `::after` do botão, preso nele pelo `overflow`.
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__btn--task\.is-busy\s*\{[^}]*position:\s*relative[^}]*overflow:\s*hidden/s',
            $css
        );
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__btn--task\.is-busy::after\s*\{[^}]*position:\s*absolute/s',
            $css
        );

        // O texto tem de ficar acima do preenchimento, senão some atrás dele.
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__btn--task\.is-busy > \*\s*\{[^}]*z-index:\s*1/s',
            $css
        );

        // E o JS só liga a classe — não existe mais barra para mostrar.
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertIsString( $js );
        $this->assertStringContainsString( "toggle('is-busy'", $js );
        $this->assertStringNotContainsString( 'data-lkn-task-progress', $js );
    }

    /**
     * Cada passo abre no TOPO da área de rolagem.
     *
     * O corpo do pop-up rola sozinho e a rolagem sobrevive à troca de passo:
     * quem rolou o passo do cartão (o mais alto) chegava no passo seguinte já
     * rolado, com o recibo escondido acima da área visível.
     */
    public function test_troca_de_passo_volta_a_rolagem_para_o_topo(): void {
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertIsString( $js );

        // `aplicarPasso` é o único caminho de troca de tela (o flip passa por
        // ele duas vezes: no meio e no fim).
        $this->assertStringContainsString( 'scrollTop = 0', $js );
        $this->assertMatchesRegularExpression(
            '/function aplicarPasso\([^)]*\)\s*\{[\s\S]{0,900}?scrollTop = 0/',
            $js,
            'O reset de rolagem tem que estar em `aplicarPasso`.'
        );
    }

    /**
     * O sumário aparece logo abaixo de "Pagamento aprovado" — e não some.
     *
     * Ele dependia de `amount_cents` para ser exibido: quando a resposta da API
     * não trazia o campo, a tabela ficava oculta e a pessoa pagava sem ver o que
     * comprou. Agora o recibo sempre aparece; valor desconhecido vira travessão.
     */
    public function test_sumario_fica_abaixo_da_confirmacao_e_nunca_some(): void {
        $html = $this->render_screen();

        // Posição: bloco "Pagamento aprovado" -> tabela -> botão de instalar.
        $pos_ok    = strpos( $html, 'lkn-billing__ok--plain' );
        $pos_rec   = strpos( $html, 'data-lkn-receipt' );
        $pos_btn   = strpos( $html, 'data-lkn-go="tasks"' );

        $this->assertLessThan( $pos_rec, $pos_ok, 'A confirmação abre a tela.' );
        $this->assertLessThan( $pos_btn, $pos_rec, 'O sumário vem logo abaixo da confirmação.' );

        // O JS não pode mais esconder o recibo quando falta o valor.
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertIsString( $js );

        $corpo = substr( $js, strpos( $js, 'function renderReceipt' ), 2200 );

        $this->assertStringNotContainsString(
            'caixa.hidden = true',
            $corpo,
            'Esconder o recibo sem valor deixava a compra sem sumário.'
        );
        $this->assertStringContainsString( 'caixa.hidden = false', $corpo );
        $this->assertStringContainsString( "'—'", $corpo, 'Valor desconhecido precisa de travessão.' );

        // A tabela nasce oculta (antes do pagamento) e aparece depois.
        $this->assertStringContainsString( 'data-lkn-receipt hidden', $html );
    }

    /**
     * O SUMÁRIO TEM QUE APARECER POR QUALQUER CAMINHO ATÉ O `ready`.
     *
     * Bug real: no polling (o caminho de quem paga por Pix), o código fazia
     * `show('ready')` sem preencher o recibo. A pessoa pagava, a tela virava
     * "Pagamento aprovado" e a tabela continuava `hidden` — pagou sem ver o que
     * comprou. Os testes anteriores só cobriam a resposta imediata do
     * `pay-pix`, que passa pelo `afterPaid` e preenchia o recibo.
     */
    public function test_sumario_aparece_no_caminho_do_polling(): void {
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertIsString( $js );

        // `function poll(` ate a proxima funcao de nivel 0 (`\n    function `),
        // que e onde o poll termina. O `function ` solto aparecia antes, dentro
        // de `var tick = function ()`.
        $poll = substr( $js, strpos( $js, 'function poll(' ) );
        $poll = substr( $poll, 0, strpos( $poll, "\n    function " ) );

        // A leitura de status preenche o recibo ANTES de trocar de tela.
        $pos_recibo = strpos( $poll, 'renderReceipt(view)' );
        $pos_ready  = strpos( $poll, "show('ready')" );

        $this->assertNotFalse( $pos_recibo, 'O polling tem que preencher o recibo.' );
        $this->assertNotFalse( $pos_ready, 'O polling leva ao passo `ready`.' );
        $this->assertLessThan( $pos_ready, $pos_recibo, 'Preencher ANTES de mostrar a tela.' );

        // E `show()` preenche ao entrar em qualquer tela pós-pagamento — assim
        // nenhum caminho novo pode esquecer.
        $show = substr( $js, strpos( $js, 'function show(' ) );
        $show = substr( $show, 0, strpos( $show, "\n    function " ) );

        $this->assertMatchesRegularExpression(
            "/if \\('ready' === step \\|\\| 'tasks' === step\\) renderReceipt\\(\\);/",
            $show,
            '`show()`` precisa garantir o recibo nas telas pós-pagamento.'
        );
    }

    /**
     * O recibo é uma tabela limpa: 3 linhas, 2 colunas, só borda.
     *
     * Tinha `background`, e o "1×" era um selo (fundo verde + padding + canto
     * arredondado) que criava um bloco visual dentro da célula e desalinhava a
     * linha do nome do produto. E só a linha do total tinha hairline: a do meio
     * ficava solta, sem borda nenhuma, e o recibo parecia lista de texto.
     */
    public function test_recibo_e_tabela_limpa_com_texto_a_esquerda(): void {
        $css = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.css' );
        $this->assertIsString( $css );

        $tabela = $this->pegar_bloco_css( $css, '.lkn-billing__receipt {' );
        $this->assertStringContainsString( 'background: none', $tabela, 'O recibo não tem fundo.' );
        $this->assertStringContainsString( 'border: 1px solid', $tabela, 'Só a borda fica.' );
        $this->assertStringContainsString( 'text-align: left', $tabela, 'Tudo alinhado à esquerda.' );

        // Cada célula tem o respiro em cima/embaixo e nas laterais.
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__receipt th,\s*\n\.lkn-billing__receipt td\s*\{[^}]*padding:\s*10px 14px/s',
            $css,
            'O padding das células é o espaço em cima/embaixo e nas pontas.'
        );
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__receipt th,\s*\n\.lkn-billing__receipt td\s*\{[^}]*text-align:\s*left/s',
            $css
        );

        // TODA linha depois da primeira tem a sua hairline — inclusive a da
        // parcela, que estava sem borda.
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__receipt tr \+ tr th,\s*\n\.lkn-billing__receipt tr \+ tr td\s*\{[^}]*border-top:\s*1px solid/s',
            $css,
            'A linha entre as linhas vem do `tr + tr`.'
        );
        $this->assertStringNotContainsString(
            'lkn-billing__receipt-row--total .lkn-billing__receipt-k,
.lkn-billing__receipt-row--total .lkn-billing__receipt-v {
    padding-top: 8px;
    border-top',
            $css,
            'A borda do total não é mais um caso especial.'
        );

        // Nenhuma coluna pode realinhar o texto: a esquerda vem das células.
        // Todos os blocos que terminam num seletor de coluna, inclusive os
        // compostos (`td.lkn-billing__receipt-v`).
        preg_match_all(
            '/[^{}]*\.lkn-billing__receipt-[kv][^{}]*\{([^}]*)\}/',
            $css,
            $blocos,
            PREG_SET_ORDER
        );
        $this->assertNotEmpty( $blocos, 'Não achei os blocos das colunas do recibo.' );

        foreach ( $blocos as $bloco ) {
            $this->assertDoesNotMatchRegularExpression(
                '/text-align:\s*(center|right)/',
                $bloco[1],
                'Coluna do recibo realinhada: ' . trim( $bloco[0] )
            );
        }

        // "1×" é texto puro: nada de fundo, padding, canto ou cor própria.
        $qty = $this->pegar_bloco_css( $css, '.lkn-billing__receipt-qty {' );
        foreach ( array( 'background: none', 'padding: 0', 'border-radius: 0' ) as $regra ) {
            $this->assertStringContainsString( $regra, $qty, 'O "1×" não pode ter efeito de selo: ' . $regra );
        }
        $this->assertStringNotContainsString( '#e3efe5', $qty, 'O fundo do selo antigo não existe mais.' );

        // A divisória entre as colunas existe, e vem da segunda coluna.
        // Seletor composto: `.lkn-billing__receipt td { border: 0 }` vence uma
        // classe sozinha e zerava essa borda (a divisória não aparecia).
        $this->assertMatchesRegularExpression(
            '/\.lkn-billing__receipt td\.lkn-billing__receipt-v\s*\{[^}]*border-left:\s*1px solid/s',
            $css,
            'Falta a divisória vertical entre as duas colunas.'
        );

        // E só UMA divisória: nada de borda vertical na primeira coluna.
        $celulas = $this->pegar_bloco_css( $css, '.lkn-billing__receipt th,' );
        $this->assertStringNotContainsString( 'border-left', $celulas );
        $this->assertStringNotContainsString( 'border-right', $celulas );
    }

    /**
     * Falha de ativação chega ao cliente em PORTUGUÊS.
     *
     * A API de licenças responde em inglês ("this site already has an active
     * license for this product") e a mensagem crua ia para a tela, no meio do
     * wizard de compra. Cada caso que o cliente pode resolver ganhou texto
     * próprio; o resto cai na mensagem original, mas sempre limpa de HTML.
     */
    public function test_falha_de_ativacao_e_traduzida(): void {
        $class = 'Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing\\Rest';

        if ( ! class_exists( $class ) ) {
            $class = '\\' . ltrim( $class, '\\' );
        }

        $this->assertTrue( class_exists( $class ), 'A classe Rest precisa carregar: ' . $class );

        $metodo = new \ReflectionMethod( $class, 'activate_error_message' );
        $metodo->setAccessible( true );

        $mensagens = array(
            'license_already_active_for_site' => 'já tem uma licença ativa',
            'activation_limit_reached'        => 'limite de sites',
            'license_expired'                 => 'expirada',
            'license_suspended'               => 'bloqueada',
            'invalid_key'                     => 'não foi encontrada',
            'plugin_mismatch'                 => 'outro produto',
            'unreachable'                     => 'servidor de licenças',
        );

        foreach ( $mensagens as $codigo => $trecho ) {
            $texto = $metodo->invoke( null, $codigo, 'this site already has an active license for this product' );

            $this->assertStringContainsString( $trecho, $texto, 'Mensagem para ' . $codigo . ' não foi traduzida.' );
            $this->assertStringNotContainsString( 'already has', $texto, 'Sobrou inglês em ' . $codigo . '.' );
        }

        // Código desconhecido: mantém o original (sem HTML), não inventa texto.
        $this->assertSame( 'erro xyz', $metodo->invoke( null, 'codigo_novo', '<b>erro xyz</b>' ) );
    }

    /**
     * O aviso de erro aparece no TOPO visível.
     *
     * O alerta mora no começo do corpo, que rola por conta própria: se a pessoa
     * estiver com o conteúdo rolado (o passo do cartão é alto), a mensagem fica
     * fora da área visível — erro que ninguém vê é o mesmo que erro nenhum.
     */
    public function test_aviso_de_erro_traz_a_rolagem_para_o_topo(): void {
        $js = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertIsString( $js );

        $trecho = substr( $js, strpos( $js, 'function showAlert' ) );
        $trecho = substr( $trecho, 0, strpos( $trecho, "\n    function " ) );

        $this->assertStringContainsString( 'scrollTop = 0', $trecho, 'O aviso precisa trazer o corpo para o topo.' );
        $this->assertStringContainsString( 'lkn-billing__body', $trecho );
    }

    /**
     * Abrir o pop-up não gira; só a troca de passo gira.
     *
     * A seção do e-mail nasce SEM `hidden` no HTML, então a regra antiga
     * ("tem alguma seção à mostra?") dava verdadeiro já na abertura e o card
     * dava uma volta inteira mostrando a mesma tela. A condição certa é o passo
     * ter MUDADO.
     */
    public function test_abrir_o_popup_nao_dispara_o_giro(): void {
        $html = $this->render_screen();
        $js   = file_get_contents( __DIR__ . '/../Includes/Billing/assets/billing.js' );
        $this->assertIsString( $js );

        // A seção do e-mail é a única sem `hidden` — é dela que o guard antigo
        // se confundia.
        $this->assertMatchesRegularExpression(
            '/<section class="lkn-billing__step" data-step-name="email">/',
            $html,
            'A primeira seção nasce visível; o guard tem que olhar o passo, não a visibilidade.'
        );

        // `show()` passa a decisão de animar, comparando com o passo anterior.
        $show = substr( $js, strpos( $js, 'function show(' ) );
        $show = substr( $show, 0, strpos( $show, "\n    function " ) );
        $this->assertStringContainsString( 'step !== anterior', $show );
        $this->assertMatchesRegularExpression(
            '/animateCard\(\s*step,\s*direcao,\s*step !== anterior\s*\)/',
            $show
        );

        // E `animateCard` só monta as faces quando recebe `animar` verdadeiro.
        $anim = substr( $js, strpos( $js, 'function animateCard' ) );
        $anim = substr( $anim, 0, strpos( $anim, "\n    function " ) );
        $this->assertMatchesRegularExpression(
            '/if \(\s*!card \|\| !animar \|\| reducedMotion\(\)\s*\)/',
            $anim,
            'Sem troca de passo, `animateCard` aplica o passo e sai sem montar faces.'
        );
    }

    /**
     * Options de licença do PRO + o boolean da página de boas-vindas.
     *
     * A MESMA lista que está no `uninstall.php`. A duplicação é inevitável: na
     * desinstalação não há garantia de que as classes do plugin carreguem, então
     * o `uninstall.php` fica de pé sozinho. Para não virarem duas verdades
     * diferentes, `test_uninstall_lista_de_licenca_esta_completa` compara esta
     * lista com o que o arquivo realmente apaga.
     *
     * @return array<int, string>
     */
    private function licencas_esperadas(): array {
        $prefixo = 'woo_better_pro_license_';

        return array(
            $prefixo . 'key',
            $prefixo . 'token',
            $prefixo . 'license_id',
            $prefixo . 'domain',
            $prefixo . 'cert',
            $prefixo . 'policy',
            $prefixo . 'result',
            $prefixo . 'last_check',
            $prefixo . 'last_error',
            $prefixo . 'expires_at',
            $prefixo . 'installed',
            $prefixo . 'onboarding_pending',
            $prefixo . 'onboarding_done',
            $prefixo . 'onboarding_shown',
        );
    }

    /**
     * Desinstalar apaga licença e o boolean da página de boas-vindas.
     *
     * Estas options ficam no banco DESTE site mesmo sendo escritas pelo PRO (e
     * pela rota de ativação daqui). Sobrevivendo à desinstalação, a próxima
     * instalação nasceria "suja": com a chave de uma compra anterior e com
     * `onboarding_done` gravado — e a página de boas-vindas só aparece quando
     * esses booleanos estão vazios.
     */
    public function test_uninstall_apaga_licenca_e_onboarding(): void {
        $options = $this->licencas_esperadas();
        $this->assertCount( 14, $options );

        // Semeia TODAS as options que o uninstall deve limpar...
        foreach ( $options as $option ) {
            update_option( $option, 'valor-de-teste' );
        }

        // ...e o guarda de boas-vindas por usuário (transiente): no slug atual
        // (nome da pasta do PRO) E no apelido legado. O uninstall precisa
        // limpar os dois — quem atualizou o plugin tem guarda com o slug velho.
        $pro_slug = dirname( WcBetterShippingCalculatorForBrazilAdminProGate::PRO_BASENAME );
        set_transient( 'lkn_pro_ob_1_' . $pro_slug, 1, HOUR_IN_SECONDS );
        set_transient( 'lkn_pro_ob_1_woo-better-pro', 1, HOUR_IN_SECONDS );

        // Uma option de configuração do plugin, que NÃO é de licença.
        update_option( 'opcao_de_configuracao_intocada', 'manter' );

        // `uninstall.php` só roda com a constante definida (proteção contra
        // acesso direto). Roda NO PROCESSO do teste — nunca em subprocesso com
        // `wp-load.php`, que apontaria para o banco do site de verdade e
        // apagaria a licença real.
        if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
            define( 'WP_UNINSTALL_PLUGIN', 'woo-better-shipping-calculator-for-brazil/woo-better-shipping-calculator-for-brazil.php' );
        }

        require __DIR__ . '/../uninstall.php';

        foreach ( $options as $option ) {
            $this->assertFalse(
                get_option( $option, false ),
                'A option ' . $option . ' sobreviveu à desinstalação.'
            );
        }

        // Direto no banco: o DELETE do uninstall é SQL puro e não limpa o
        // object cache, então `get_transient` devolveria o valor cacheado.
        global $wpdb;
        $sobras = $wpdb->get_col(
            "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE '%lkn_pro_ob%'"
        );

        $this->assertSame(
            array(),
            array_values(
                array_filter(
                    $sobras,
                    static function ( $nome ) {
                        // `_woo-better` cobre o slug atual
                        // (`_woo-better-shipping-calculator-for-brazil-pro`) e o
                        // legado (`_woo-better-pro`).
                        return false !== strpos( (string) $nome, '_woo-better' );
                    }
                )
            ),
            'O guarda da boas-vindas sobreviveu à desinstalação.'
        );

        // Não saiu apagando o que não é licença.
        $this->assertSame( 'manter', get_option( 'opcao_de_configuracao_intocada' ) );

        delete_option( 'opcao_de_configuracao_intocada' );
    }

    /**
     * O `uninstall.php` apaga exatamente a lista esperada.
     *
     * Sem esta checagem, tirar uma option da lista (ou errar o prefixo, como já
     * aconteceu no shipping: filtrava só `wc_shipping_simulator_%` e deixava
     * `shipping_simulator_pro_license_*` para trás) passaria em silêncio.
     */
    public function test_uninstall_lista_de_licenca_esta_completa(): void {
        $uninstall = file_get_contents( __DIR__ . '/../uninstall.php' );
        $this->assertIsString( $uninstall );

        preg_match_all( "/'([a-z0-9_]*licen[sc]e[a-z0-9_]*)'/i", $uninstall, $achados );

        $no_uninstall = array_values( array_unique( $achados[1] ) );
        $esperadas    = $this->licencas_esperadas();

        sort( $no_uninstall );
        sort( $esperadas );

        $this->assertSame(
            $esperadas,
            $no_uninstall,
            'Divergiu: só no teste = ' . implode( ', ', array_diff( $esperadas, $no_uninstall ) )
                . ' | só no uninstall = ' . implode( ', ', array_diff( $no_uninstall, $esperadas ) )
        );
    }
}
