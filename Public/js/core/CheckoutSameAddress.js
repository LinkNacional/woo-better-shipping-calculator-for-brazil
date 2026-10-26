/**
 * Checkbox "Usar o mesmo endereço para cobrança" do checkout em BLOCOS.
 *
 * Um único lugar decide se o endereço de cobrança é o mesmo da entrega. Antes,
 * cada script lia o checkbox do seu jeito:
 *
 *   • IE/IM/RG: `.wc-block-checkout__use-address-for-billing input[type=checkbox]`
 *   • Tipo de Pessoa/Data de nascimento/Gênero:
 *       `input[type=checkbox][id^="checkbox-control"]` + `closest(...)`
 *
 * O segundo seletor pega o PRIMEIRO checkbox da página — e o WooCommerce dá ids
 * sequenciais (`checkbox-control-0`, `-1`, …) conforme as seções montam e
 * desmontam. Resultado: ao alternar "usar o mesmo endereço", parte dos scripts
 * concluía "entrega" e outra parte concluía "cobrança", e os campos injetados
 * ficavam sendo movidos de um formulário para o outro — junto com o
 * reposicionamento contínuo, isso travava a página em loop (ver
 * `core/CheckoutFieldOrder.js`).
 *
 * A classe `wc-block-checkout__use-address-for-billing` é do PRÓPRIO WooCommerce,
 * aplicada no `CheckboxControl` desse campo: é o seletor estável.
 */

/**
 * O input do checkbox "usar o mesmo endereço para cobrança".
 *
 * @returns {HTMLInputElement|null}
 */
export function sameAddressCheckbox() {
    return document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]');
}

/**
 * O cliente está usando o endereço de entrega também como cobrança?
 *
 * Sem o checkbox (ex.: loja que não coleta entrega) a resposta é `false`, o
 * mesmo padrão que os scripts de campo já assumiam.
 *
 * @returns {boolean}
 */
export function isUsingSameAddress() {
    const checkbox = sameAddressCheckbox();

    return !!(checkbox && checkbox.checked);
}
