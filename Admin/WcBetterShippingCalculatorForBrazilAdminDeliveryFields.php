<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Admin;

// Prevent direct access
if (! defined('ABSPATH')) {
    exit;
}

/**
 * Renderização dos campos com tipo customizado da página "Campos Brasileiros".
 *
 * Os widgets abaixo ("Prazo de Entrega" e "Pedidos Pendentes") vieram da versão
 * PRO: a interface agora é compartilhada (o usuário do plugin gratuito pode
 * explorá-la), mas a lógica — cálculo do prazo, validação e a lista real de
 * pedidos — só existe no plugin PRO. Sem ele, o salvamento é bloqueado por
 * `WcBetterShippingCalculatorForBrazilAdminProGate`.
 *
 * O template do layout dispara `wc_better_shipping_calculator_admin_field_{type}`
 * para tipos que não conhece, e esta classe responde pelos três tipos PRO.
 *
 * @since 5.2.0
 */
class WcBetterShippingCalculatorForBrazilAdminDeliveryFields
{
    /**
     * Registra os renderizadores dos tipos customizados.
     */
    public function __construct()
    {
        add_action('wc_better_shipping_calculator_admin_field_delivery_schedule', array($this, 'render_delivery_schedule'), 10, 3);
        add_action('wc_better_shipping_calculator_admin_field_delivery_slots', array($this, 'render_delivery_slots'), 10, 3);
        add_action('wc_better_shipping_calculator_admin_field_delivery_orders_list', array($this, 'render_delivery_orders_list'), 10, 3);
    }

    /**
     * Dias da semana (chave => rótulo).
     *
     * @return array<string, string>
     */
    private function get_days(): array
    {
        return array(
            'sunday'    => __('Domingo', 'woo-better-shipping-calculator-for-brazil'),
            'monday'    => __('Segunda-feira', 'woo-better-shipping-calculator-for-brazil'),
            'tuesday'   => __('Terça-feira', 'woo-better-shipping-calculator-for-brazil'),
            'wednesday' => __('Quarta-feira', 'woo-better-shipping-calculator-for-brazil'),
            'thursday'  => __('Quinta-feira', 'woo-better-shipping-calculator-for-brazil'),
            'friday'    => __('Sexta-feira', 'woo-better-shipping-calculator-for-brazil'),
            'saturday'  => __('Sábado', 'woo-better-shipping-calculator-for-brazil'),
        );
    }

    /**
     * Tabela "Dias e Horários de Funcionamento".
     *
     * Mantém o JSON sincronizado em um campo oculto (o JS do admin cuida disso).
     *
     * @param string $field_id    Id do campo.
     * @param array  $field       Definição do campo.
     * @param mixed  $field_value Valor atual (JSON).
     * @return void
     */
    public function render_delivery_schedule($field_id, $field, $field_value): void
    {
        $schedule_json = is_string($field_value) && '' !== $field_value ? $field_value : '{}';
        $schedule      = json_decode($schedule_json, true);

        if (! is_array($schedule)) {
            $schedule = array();
        }
        ?>
        <input
            type="hidden"
            name="<?php echo esc_attr($field_id); ?>"
            id="<?php echo esc_attr($field_id); ?>"
            value="<?php echo esc_attr($schedule_json); ?>"
            class="wc-better-pro-delivery-schedule-json"
        />
        <div class="wc-better-pro-delivery-schedule-wrap">
            <table class="wc-better-pro-delivery-schedule-table widefat">
                <thead>
                    <tr>
                        <th scope="col"><?php esc_html_e('Dia', 'woo-better-shipping-calculator-for-brazil'); ?></th>
                        <th scope="col"><?php esc_html_e('Ativo', 'woo-better-shipping-calculator-for-brazil'); ?></th>
                        <th scope="col"><?php esc_html_e('Horário Inicial', 'woo-better-shipping-calculator-for-brazil'); ?></th>
                        <th scope="col"><?php esc_html_e('Horário Final', 'woo-better-shipping-calculator-for-brazil'); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    foreach ($this->get_days() as $day_key => $day_label) :
                        $is_checked = isset($schedule[$day_key]['active']) && $schedule[$day_key]['active'];
                        $start_time = isset($schedule[$day_key]['start']) ? $schedule[$day_key]['start'] : '08:00';
                        $end_time   = isset($schedule[$day_key]['end']) ? $schedule[$day_key]['end'] : '18:00';
                        ?>
                        <tr class="wc-better-pro-delivery-day-row" data-day="<?php echo esc_attr($day_key); ?>">
                            <td><strong><?php echo esc_html($day_label); ?></strong></td>
                            <td>
                                <input
                                    type="checkbox"
                                    class="wc-better-pro-delivery-day-checkbox"
                                    value="1"
                                    <?php checked($is_checked); ?>
                                />
                            </td>
                            <td>
                                <input
                                    type="time"
                                    class="wc-better-pro-delivery-time-start"
                                    value="<?php echo esc_attr($start_time); ?>"
                                    <?php disabled(! $is_checked); ?>
                                />
                            </td>
                            <td>
                                <input
                                    type="time"
                                    class="wc-better-pro-delivery-time-end"
                                    value="<?php echo esc_attr($end_time); ?>"
                                    <?php disabled(! $is_checked); ?>
                                />
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    /**
     * Lista "Faixas de Horário de Entrega".
     *
     * @param string $field_id    Id do campo.
     * @param array  $field       Definição do campo.
     * @param mixed  $field_value Valor atual (JSON).
     * @return void
     */
    public function render_delivery_slots($field_id, $field, $field_value): void
    {
        $slots_json = is_string($field_value) && '' !== $field_value ? $field_value : '[]';
        $slots      = json_decode($slots_json, true);

        if (! is_array($slots)) {
            $slots = array();
        }
        ?>
        <input
            type="hidden"
            name="<?php echo esc_attr($field_id); ?>"
            id="<?php echo esc_attr($field_id); ?>"
            value="<?php echo esc_attr($slots_json); ?>"
            class="wc-better-pro-delivery-slots-json"
        />
        <div class="wc-better-pro-delivery-slots-container">
            <div class="wc-better-pro-delivery-slots-list">
                <?php foreach ($slots as $slot) : ?>
                    <?php
                    if (! isset($slot[0], $slot[1])) {
                        continue;
                    }
                    ?>
                    <div class="wc-better-pro-delivery-slot-row">
                        <input type="time" class="wc-better-pro-delivery-slot-start" value="<?php echo esc_attr((string) $slot[0]); ?>" />
                        <span class="wc-better-pro-delivery-slot-sep"><?php esc_html_e('às', 'woo-better-shipping-calculator-for-brazil'); ?></span>
                        <input type="time" class="wc-better-pro-delivery-slot-end" value="<?php echo esc_attr((string) $slot[1]); ?>" />
                        <button
                            type="button"
                            class="button wc-better-pro-delivery-slot-remove"
                            title="<?php esc_attr_e('Remover faixa', 'woo-better-shipping-calculator-for-brazil'); ?>"
                        >&times;</button>
                    </div>
                <?php endforeach; ?>
            </div>
            <button type="button" class="button wc-better-pro-delivery-slot-add">
                <?php esc_html_e('+ Adicionar faixa', 'woo-better-shipping-calculator-for-brazil'); ?>
            </button>
        </div>
        <?php
    }

    /**
     * Painel "Pedidos Pendentes" (somente leitura).
     *
     * A lista é montada pelo JS a partir de `window.wooBetterDeliveryOrders`,
     * publicado pelo plugin PRO. Por isso a barra de busca/ordenação só é
     * renderizada quando o PRO está ativo: no plugin gratuito o link de
     * ordenação (e os botões) não teriam dados nem handler, ficando como
     * controles vazios na tela.
     *
     * @param string $field_id    Id do campo.
     * @param array  $field       Definição do campo.
     * @param mixed  $field_value Valor atual.
     * @return void
     */
    public function render_delivery_orders_list($field_id, $field, $field_value): void
    {
        $is_pro = \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_active();
        ?>
        <div class="wc-better-pro-delivery-orders-wrap">
            <?php if ($is_pro) : ?>
                <div class="wc-better-pro-delivery-orders-toolbar">
                    <input
                        type="text"
                        id="delivery_orders_search"
                        name="delivery_orders_search"
                        value=""
                        placeholder="<?php esc_attr_e('Buscar por nome do cliente ou ID do pedido...', 'woo-better-shipping-calculator-for-brazil'); ?>"
                        class="wc-better-pro-delivery-orders-search"
                    />
                    <button type="button" id="delivery_orders_search_btn" class="button">
                        <?php esc_html_e('Buscar', 'woo-better-shipping-calculator-for-brazil'); ?>
                    </button>
                    <a href="#" id="delivery_orders_clear_btn" class="button wc-better-pro-delivery-orders-clear">
                        <?php esc_html_e('Limpar', 'woo-better-shipping-calculator-for-brazil'); ?>
                    </a>
                    <a href="#" id="delivery_orders_sort_link" class="button"><?php esc_html_e('▲ Mais próximos', 'woo-better-shipping-calculator-for-brazil'); ?></a>
                </div>
            <?php endif; ?>
            <div id="delivery-orders-table-container" class="wc-better-pro-delivery-orders-table-wrap">
                <p class="delivery-orders-no-results">
                    <?php
                    echo $is_pro
                        ? esc_html__('Nenhum pedido com prazo de entrega pendente.', 'woo-better-shipping-calculator-for-brazil')
                        : esc_html__('A lista de pedidos com prazo de entrega é exibida pela versão PRO.', 'woo-better-shipping-calculator-for-brazil');
                    ?>
                </p>
            </div>
        </div>
        <?php
    }
}
