<?php
/**
 * Markup do pop-up de compra.
 *
 * Todos os passos vêm no HTML de uma vez e o JS alterna a visibilidade. É
 * menos elegante que montar por template no cliente, mas é o que faz o fluxo
 * funcionar mesmo se o JS falhar no meio: o conteúdo já está na página, e o
 * botão que abre o pop-up continua sendo um link para a página comercial.
 *
 * Ordem dos passos (o JS só troca `data-step`):
 *
 *   email (e-mail + forma de pagamento) -> pix | card -> (pix: pix-wait)
 *         -> fulfilling -> ready -> tasks
 *
 * A operadora NÃO é perguntada: o par meio->PSP é fixo (Pix na Rede, cartão na
 * Cielo) e quem decide é este plugin, não o lojista.
 *
 * @package WcBetterShippingCalculatorForBrazil\Includes\Billing
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes\Billing;

// Impede acesso direto.
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Renderiza o pop-up.
 */
final class Popup
{
    /**
     * Marca de "deu certo": círculo + tique desenhados por animação CSS.
     *
     * Texto sozinho ("Pagamento aprovado") não comunica que a etapa terminou —
     * e é justamente o instante em que a pessoa precisa de certeza para não
     * clicar de novo e cobrar duas vezes.
     *
     * @param string $label Texto que acompanha a marca.
     * @return string HTML já escapado.
     */
    private static function check_svg(string $extra_class = ''): string
    {
        $classes = 'lkn-billing__check' . ('' !== $extra_class ? ' ' . $extra_class : '');

        return '<svg class="' . esc_attr($classes) . '" viewBox="0 0 52 52" aria-hidden="true" focusable="false">'
            . '<circle class="lkn-billing__check-circle" cx="26" cy="26" r="23" fill="none" />'
            . '<path class="lkn-billing__check-mark" fill="none" d="M15 27l7 7 15-15" />'
            . '</svg>';
    }

    /**
     * Recibo em DUAS COLUNAS: rótulo à esquerda, valor à direita, uma linha por
     * informação (pedido, parcela, total).
     *
     * Tabela de verdade (e não `flex`): é uma lista de pares nome/valor, e
     * assim o leitor de tela anuncia cada valor junto do seu rótulo. Com o
     * `flex` anterior, a leitura saía solta.
     *
     * Nasce escondido e é preenchido pelo JS depois do pagamento. Fica em dois
     * lugares (a tela do recibo e a das etapas) e o JS preenche os dois.
     *
     * @return string
     */
    private static function receipt(): string
    {
        return '<table class="lkn-billing__receipt" data-lkn-receipt hidden>'
            . '<tbody>'
            . '<tr>'
            . '<th class="lkn-billing__receipt-k" scope="row">'
            . '<span class="lkn-billing__receipt-qty">1&times;</span> '
            . '<span data-lkn-receipt-name></span>'
            . '</th>'
            . '<td class="lkn-billing__receipt-v" data-lkn-paid-amount></td>'
            . '</tr>'
            . '<tr>'
            . '<th class="lkn-billing__receipt-k" scope="row">'
            . esc_html__('Parcela', 'woo-better-shipping-calculator-for-brazil')
            . '</th>'
            . '<td class="lkn-billing__receipt-v" data-lkn-paid-terms></td>'
            . '</tr>'
            . '<tr class="lkn-billing__receipt-row--total">'
            . '<th class="lkn-billing__receipt-k" scope="row">'
            . esc_html__('Total', 'woo-better-shipping-calculator-for-brazil')
            . '</th>'
            . '<td class="lkn-billing__receipt-v"><strong data-lkn-paid-total></strong></td>'
            . '</tr>'
            . '</tbody>'
            . '</table>';
    }

    /**
     * Bloco "deu certo": tique animado + texto.
     *
     * @param string $label    Texto que acompanha a marca.
     * @param string $modifier Classe extra (ex.: `--plain`, sem o bloco verde
     *                         e com ícone em cima do texto).
     * @return string
     */
    private static function check(string $label, string $modifier = ''): string
    {
        $classes = 'lkn-billing__ok' . ('' !== $modifier ? ' ' . $modifier : '');

        return '<p class="' . esc_attr($classes) . '">'
            . self::check_svg()
            . '<span>' . esc_html($label) . '</span>'
            . '</p>';
    }

    /**
     * Botão de etapa (instalar / ativar / seguir).
     *
     * O tique mora DENTRO do botão e só aparece quando a etapa conclui: assim a
     * conclusão é lida no próprio controle, no lugar de a pessoa procurar uma
     * mensagem em outro ponto da tela.
     *
     * @param string $task     Nome da etapa (`install`, `activate`).
     * @param string $label    Texto do botão.
     * @param string $attr     Atributo que liga o botão ao handler (`data-lkn-install`).
     * @param bool   $done     Etapa já concluída.
     * @param bool   $locked   Etapa bloqueada (espera a anterior).
     * @return string
     */
    private static function task_button(string $task, string $label, string $attr, bool $done = false, bool $locked = false): string
    {
        $classes = 'lkn-billing__btn lkn-billing__btn--primary lkn-billing__btn--task';

        if ($done) {
            $classes .= ' is-done';
        }

        if ($locked) {
            $classes .= ' is-locked';
        }

        // O carregamento acontece DENTRO do botão (o preenchimento corre no
        // fundo dele). Uma barra embaixo ficava "por fora": parecia de outro
        // elemento e empurrava a lista a cada clique.
        return '<div class="lkn-billing__task" data-lkn-task="' . esc_attr($task) . '">'
            . '<button type="button" class="' . esc_attr($classes) . '" ' . $attr . ' '
            . ($done || $locked ? 'disabled' : '')
            . '>'
            . self::check_svg('lkn-billing__check--inline')
            . '<span data-lkn-btn-label>' . esc_html($label) . '</span>'
            . '</button>'
            . '</div>';
    }

    /**
     * Devolve o markup do pop-up.
     *
     * @param array<string, mixed> $args {
     *     @type bool $pro_installed O plugin PRO já está instalado e ativo.
     *                               Nesse caso o pop-up NÃO reinstala: vai
     *                               direto para a ativação da licença.
     * }
     * @return string
     */
    public static function html(array $args = array()): string
    {
        $config = Billing::config();
        $pro_installed = ! empty($args['pro_installed']);

        ob_start();
        ?>
<div class="lkn-billing" id="lkn-billing-modal" hidden>
    <div class="lkn-billing__backdrop" data-lkn-close></div>

    <div class="lkn-billing__dialog" role="dialog" aria-modal="true" aria-labelledby="lkn-billing-title">
        <button type="button" class="lkn-billing__close" data-lkn-close aria-label="<?php echo esc_attr__('Fechar', 'woo-better-shipping-calculator-for-brazil'); ?>">&times;</button>

        <header class="lkn-billing__header">
            <span class="lkn-billing__eyebrow"><?php esc_html_e('Versão PRO', 'woo-better-shipping-calculator-for-brazil'); ?></span>
            <h2 class="lkn-billing__title" id="lkn-billing-title"><?php echo esc_html($config['product_name']); ?></h2>
        </header>

        <div class="lkn-billing__body" data-step="email">
            <div class="lkn-billing__alert" data-lkn-alert hidden></div>

            <?php
            /*
             * 1. E-mail + forma de pagamento na MESMA tela.
             *
             * Eram três passos (e-mail -> operadora -> método) e a operadora
             * existia só porque `pickProvider()` aceitava qualquer PSP para
             * qualquer meio. O contrato comercial é fixo — Pix na Rede, cartão
             * na Cielo —, então escolher operadora era uma decisão que o lojista
             * não tinha como tomar bem. Agora o par (meio -> operadora) é
             * decidido pelo plugin, e esta tela pergunta só o que ele sabe
             * responder.
             *
             * Os dois botões abaixo só MARCAM (`aria-pressed`); quem abre o
             * checkout é o "Continuar", que nasce desabilitado e só libera com
             * e-mail válido + um meio escolhido (ver `refreshContinue()` no JS).
             */
            ?>
            <section class="lkn-billing__step" data-step-name="email">
                <label class="lkn-billing__label" for="lkn-billing-email"><?php esc_html_e('Para onde enviamos a licença?', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                <input type="email" id="lkn-billing-email" class="lkn-billing__input" data-lkn-email
                    autocomplete="email" placeholder="voce@loja.com.br" required>
                <p class="lkn-billing__hint"><?php esc_html_e('A chave chega neste e-mail e fica vinculada a este site.', 'woo-better-shipping-calculator-for-brazil'); ?></p>

                <p class="lkn-billing__label"><?php esc_html_e('Como você quer pagar?', 'woo-better-shipping-calculator-for-brazil'); ?></p>

                <?php
                /*
                 * `data-lkn-method` = escolha (não navega) e o valor é o MEIO.
                 * `data-lkn-provider` é o PSP que aquele meio usa, conferido
                 * contra a lista que a API devolve no `create`: se o PSP estiver
                 * desabilitado no servidor, o meio correspondente não é
                 * oferecido (o `.zip` no cliente não se atualiza sozinho).
                 *
                 * Hoje os dois meios são da Cielo (a Rede saiu do projeto). O
                 * atributo continua por botão porque é ele que permite desligar
                 * um meio no servidor sem atualizar o plugin no cliente.
                 */
                ?>
                <button type="button" class="lkn-billing__method" data-lkn-method="pix"
                    data-lkn-provider="cielo" aria-pressed="false">
                    <span class="lkn-billing__method-icon" aria-hidden="true">PIX</span>
                    <span class="lkn-billing__method-text">
                        <strong><?php esc_html_e('Pix', 'woo-better-shipping-calculator-for-brazil'); ?></strong>
                        <small><?php esc_html_e('Aprovação imediata. Aponte a câmera para o QR code.', 'woo-better-shipping-calculator-for-brazil'); ?></small>
                    </span>
                </button>

                <button type="button" class="lkn-billing__method" data-lkn-method="card"
                    data-lkn-provider="cielo" aria-pressed="false">
                    <span class="lkn-billing__method-icon" aria-hidden="true">&#9679;&#9679;&#9679;&#9679;</span>
                    <span class="lkn-billing__method-text">
                        <strong><?php esc_html_e('Cartão de crédito', 'woo-better-shipping-calculator-for-brazil'); ?></strong>
                        <small><?php esc_html_e('Cobrança na hora, na fatura do cartão.', 'woo-better-shipping-calculator-for-brazil'); ?></small>
                    </span>
                </button>

                <?php /* `data-lkn-go="start"` = este botão ABRE o checkout. */ ?>
                <button type="button" class="lkn-billing__btn lkn-billing__btn--primary" data-lkn-go="start" disabled>
                    <?php esc_html_e('Continuar', 'woo-better-shipping-calculator-for-brazil'); ?>
                </button>
            </section>

            <?php /* 4a. Pix */ ?>
            <section class="lkn-billing__step" data-step-name="pix" hidden>
                <label class="lkn-billing__label" for="lkn-billing-pix-name"><?php esc_html_e('Nome completo', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                <input type="text" id="lkn-billing-pix-name" class="lkn-billing__input" data-lkn-pix-name
                    autocomplete="name" required>

                <label class="lkn-billing__label" for="lkn-billing-pix-tax"><?php esc_html_e('CPF ou CNPJ', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                <input type="text" id="lkn-billing-pix-tax" class="lkn-billing__input" data-lkn-pix-tax
                    inputmode="numeric" placeholder="000.000.000-00" required>

                <button type="button" class="lkn-billing__btn lkn-billing__btn--primary" data-lkn-pay="pix">
                    <?php esc_html_e('Gerar o Pix', 'woo-better-shipping-calculator-for-brazil'); ?>
                </button>
                <button type="button" class="lkn-billing__link" data-lkn-go="email"><?php esc_html_e('Voltar', 'woo-better-shipping-calculator-for-brazil'); ?></button>
            </section>

            <?php /* 3b. Pix aguardando */ ?>
            <section class="lkn-billing__step" data-step-name="pix-wait" hidden>
                <p class="lkn-billing__label"><?php esc_html_e('Escaneie o QR code ou use o código abaixo', 'woo-better-shipping-calculator-for-brazil'); ?></p>

                <div class="lkn-billing__qr">
                    <img data-lkn-qr alt="<?php esc_attr_e('QR code do Pix', 'woo-better-shipping-calculator-for-brazil'); ?>">
                </div>

                <textarea class="lkn-billing__copy" data-lkn-copy readonly rows="3"></textarea>
                <button type="button" class="lkn-billing__btn lkn-billing__btn--secondary" data-lkn-copy-btn>
                    <?php esc_html_e('Copiar código Pix', 'woo-better-shipping-calculator-for-brazil'); ?>
                </button>

                <p class="lkn-billing__waiting" data-lkn-waiting>
                    <span class="lkn-billing__spinner" aria-hidden="true"></span>
                    <?php esc_html_e('Aguardando o pagamento. Esta tela se atualiza sozinha.', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>
            </section>

            <?php /* 3c. Cartão */ ?>
            <section class="lkn-billing__step" data-step-name="card" hidden>
                <label class="lkn-billing__label" for="lkn-billing-card-number"><?php esc_html_e('Número do cartão', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                <input type="text" id="lkn-billing-card-number" class="lkn-billing__input" data-lkn-card-number
                    inputmode="numeric" autocomplete="cc-number" placeholder="0000 0000 0000 0000" required>

                <label class="lkn-billing__label" for="lkn-billing-card-holder"><?php esc_html_e('Nome impresso no cartão', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                <input type="text" id="lkn-billing-card-holder" class="lkn-billing__input" data-lkn-card-holder
                    autocomplete="cc-name" required>

                <div class="lkn-billing__row">
                    <div>
                        <label class="lkn-billing__label" for="lkn-billing-card-expiry"><?php esc_html_e('Validade (MM/AA)', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                        <input type="text" id="lkn-billing-card-expiry" class="lkn-billing__input" data-lkn-card-expiry
                            inputmode="numeric" autocomplete="cc-exp" placeholder="MM/AA" required>
                    </div>
                    <div>
                        <label class="lkn-billing__label" for="lkn-billing-card-cvv"><?php esc_html_e('Código de segurança', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                        <input type="text" id="lkn-billing-card-cvv" class="lkn-billing__input" data-lkn-card-cvv
                            inputmode="numeric" autocomplete="cc-csc" placeholder="123" required>
                    </div>
                </div>

                <label class="lkn-billing__label" for="lkn-billing-installments"><?php esc_html_e('Parcelas', 'woo-better-shipping-calculator-for-brazil'); ?></label>
                <select id="lkn-billing-installments" class="lkn-billing__input" data-lkn-installments>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                </select>

                <button type="button" class="lkn-billing__btn lkn-billing__btn--primary" data-lkn-pay="card">
                    <?php esc_html_e('Pagar', 'woo-better-shipping-calculator-for-brazil'); ?>
                </button>
                <p class="lkn-billing__hint lkn-billing__hint--secure">
                    <?php esc_html_e('Os dados do cartão vão direto para a Link Nacional e não são gravados neste site.', 'woo-better-shipping-calculator-for-brazil'); ?>
                </p>
                <button type="button" class="lkn-billing__link" data-lkn-go="email"><?php esc_html_e('Voltar', 'woo-better-shipping-calculator-for-brazil'); ?></button>
            </section>

            <?php /* 4. Preparando a licença */ ?>
            <section class="lkn-billing__step lkn-billing__step--center" data-step-name="fulfilling" hidden>
                <span class="lkn-billing__spinner lkn-billing__spinner--big" aria-hidden="true"></span>
                <p class="lkn-billing__label"><?php esc_html_e('Pagamento aprovado. Preparando sua licença…', 'woo-better-shipping-calculator-for-brazil'); ?></p>

                <?php /* Barra que desliza: sem movimento a tela parece travada e a
                          pessoa não sabe se ainda está andando. */ ?>
                <div class="lkn-billing__progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"
                    aria-label="<?php echo esc_attr__('Preparando a licença', 'woo-better-shipping-calculator-for-brazil'); ?>">
                    <span class="lkn-billing__progress-bar"></span>
                </div>

                <p class="lkn-billing__hint"><?php esc_html_e('Isso costuma levar alguns segundos.', 'woo-better-shipping-calculator-for-brazil'); ?></p>
            </section>

            <?php /* 5. Pagamento aprovado: recibo e início da instalação. */ ?>
            <section class="lkn-billing__step lkn-billing__step--center" data-step-name="ready" hidden>
                <?php
                /*
                 * Ícone e texto centralizados, SEM o bloco verde: aqui a tela é
                 * uma confirmação, não um aviso de sucesso no meio do conteúdo.
                 */
                echo self::check(__('Pagamento aprovado', 'woo-better-shipping-calculator-for-brazil'), 'lkn-billing__ok--plain');
                ?>

                <?php echo self::receipt(); ?>

                <?php /* Só o início. As três etapas aparecem na tela seguinte. */ ?>
                <button type="button" class="lkn-billing__btn lkn-billing__btn--primary" data-lkn-go="tasks">
                    <?php echo esc_html($pro_installed
                        ? __('Continuar', 'woo-better-shipping-calculator-for-brazil')
                        : __('Instalar automaticamente', 'woo-better-shipping-calculator-for-brazil')); ?>
                </button>

                <?php
                /*
                 * Caminho alternativo ABAIXO do principal: quem vai instalar
                 * automaticamente não precisa esbarrar no .zip, e quem quer o
                 * arquivo acha o link mesmo assim.
                 */
                ?>
                <p class="lkn-billing__manual">
                    <button type="button" class="lkn-billing__link" data-lkn-download>
                        <?php esc_html_e('Baixar o .zip e instalar manualmente', 'woo-better-shipping-calculator-for-brazil'); ?>
                    </button>
                </p>
            </section>

            <?php /* 6. Etapas: instalar -> ativar -> configurações, na mesma tela. */ ?>
            <section class="lkn-billing__step" data-step-name="tasks" hidden>
                <div class="lkn-billing__tasks">
                    <?php
                    /*
                     * As três etapas ficam na MESMA página, em sequência: cada
                     * uma libera a seguinte. Trocar de tela a cada passo fazia a
                     * pessoa perder o fio do que faltava fazer.
                     */
                    echo self::task_button(
                        'install',
                        $pro_installed ? __('Plugin instalado', 'woo-better-shipping-calculator-for-brazil') : __('Instalar plugin', 'woo-better-shipping-calculator-for-brazil'),
                        'data-lkn-install',
                        $pro_installed
                    );
                    ?>

                    <?php
                    echo self::task_button(
                        'activate',
                        __('Ativar licença', 'woo-better-shipping-calculator-for-brazil'),
                        'data-lkn-activate',
                        false,
                        ! $pro_installed
                    );
                    ?>

                    <?php /* Terceira etapa: só libera depois de a licença ativar. */ ?>
                    <div class="lkn-billing__task" data-lkn-task="settings">
                        <a class="lkn-billing__btn lkn-billing__btn--primary lkn-billing__btn--task is-locked"
                            data-lkn-settings href="<?php echo esc_url(Billing::settings_url()); ?>" aria-disabled="true">
                            <span data-lkn-btn-label><?php esc_html_e('Ir para as configurações do PRO', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                        </a>
                    </div>
                </div>
            </section>
        </div>

        <footer class="lkn-billing__footer">
            <?php esc_html_e('Pagamento processado pela Link Nacional.', 'woo-better-shipping-calculator-for-brazil'); ?>
        </footer>
    </div>
</div>
        <?php

        return (string) ob_get_clean();
    }
}
