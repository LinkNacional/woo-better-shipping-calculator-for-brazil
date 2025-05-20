jQuery(document).ready(function ($) {
    let countInterval = 0;
    const bodyInterval = setInterval(function () {
        if (countInterval > 20) {
            clearInterval(bodyInterval);
            return;
        }

        if ($('body').length) {
            clearInterval(bodyInterval);

            $(".woo-better-tab-nav li").on("click", function () {
                var tab = $(this).data("tab");

                $(".woo-better-tab-nav li").removeClass("active");
                $(this).addClass("active");

                $(".woo-better-tab-content").removeClass("active");
                $("#" + tab).addClass("active");
            });

            const $lodingField = $('#wc-better-calc-root');
            const $disableShipping = $('#woo_better_calc_disabled_shipping');
            const $disableShippingLabel = $('label[for="woo_better_calc_disabled_shipping"]');

            const $numberField = $('#woo_better_calc_number_required');
            const $numberFieldLabel = $('label[for="woo_better_calc_number_required"]');

            const $requirePostcode = $('#woo_better_calc_cep_required');
            const $requirePostocodeLabel = $('label[for="woo_better_calc_cep_required"]');

            const $hiddenField = $('#woo_better_hidden_cart_address');
            const $hiddenFieldLabel = $('label[for="woo_better_hidden_cart_address"]');

            if ($disableShipping.length) {
                handleDisableShippingChange($numberField, $hiddenField, $requirePostcode).call($disableShipping[0]);
                handleRequirePostcodeChange($hiddenField).call($requirePostcode[0]);

                $disableShipping.on('change', handleDisableShippingChange($numberField, $hiddenField, $requirePostcode));
                $requirePostcode.on('change', handleRequirePostcodeChange($hiddenField));

                // Estilo do campo(disabled)
                const $tdDisabled = $disableShipping.closest('td');
                $tdDisabled.addClass('woo-better-box');

                $disableShipping.before(`
                    <div style="margin-bottom: 10px;">
                        <strong>Entrega de Produto</strong>
                        <hr style="margin: 4px 0;">
                    </div>
                `);

                // Estilo de campo(number)
                const $tdNumber = $numberField.closest('td');
                $tdNumber.addClass('woo-better-box');

                $numberField.before(`
                    <div style="margin-bottom: 10px;">
                        <strong>Campo de número no formulário checkout</strong>
                        <hr style="margin: 4px 0;">
                    </div>
                `);

                // Estilo de campo(require postcode)
                const $tdRequirePostcode = $requirePostcode.closest('td');
                $tdRequirePostcode.addClass('woo-better-box');

                $requirePostcode.before(`
                    <div style="margin-bottom: 10px;">
                        <strong>Definir um CEP obrigatório antes de seguir para o Checkout</strong>
                        <hr style="margin: 4px 0;">
                    </div>
                `);

                // Estilo de campo(hidden address)
                const $tdHiddenAddress = $hiddenField.closest('td');
                $tdHiddenAddress.addClass('woo-better-box');

                $hiddenField.before(`
                    <div style="margin-bottom: 10px;">
                        <strong>Oculta os campos de endereço no carrinho</strong>
                        <hr style="margin: 4px 0;">
                    </div>
                `);

                // Caixa de descrição
                const $descBox = $('<div>', {
                    class: 'woo-better-calc-desc-box',
                    css: { marginTop: '10px' }
                });

                $disableShippingLabel.after($descBox);
                $numberFieldLabel.after($descBox);
                $requirePostocodeLabel.after($descBox);
                $hiddenFieldLabel.after($descBox);

                const numberDescriptions = {
                    yes: 'Ao habilitar este campo, será adicionado um componente de número para dar complemento adicional ao campo de endereço.',
                    no: 'O campo de número não será exibido no checkout.'
                };

                const disabledDescriptions = {
                    all: 'Todos os métodos de entrega e campos de endereço serão desabilitados.',
                    digital: 'Entrega será desabilitada apenas se o carrinho tiver somente produtos digitais.',
                    default: 'Entrega dinâmica será mantida conforme o padrão do Woocommerce.'
                };

                const requireCepDescriptions = {
                    yes: 'Ao tornar o CEP obrigatório, o usuário precisa validar um CEP no carrinho antes de prosseguir para o checkout.',
                    no: 'O usuário poderá prosseguir para o checkout mesmo sem validar um CEP no carrinho.'
                };

                const hiddenAddressDescriptions = {
                    yes: 'Ao habilitar este campo, será desabilitado os campos de endereços na página de carrinho do Gutenberg.',
                    no: 'Os campos de endereços permanecerão visíveis na página de carrinho do Gutenberg.'
                };

                // Aplicar nos campos
                createDescBox($disableShippingLabel, disabledDescriptions, $disableShipping);
                createDescBox($numberFieldLabel, numberDescriptions, $numberField);
                createDescBox($requirePostocodeLabel, requireCepDescriptions, $requirePostcode);
                createDescBox($hiddenFieldLabel, hiddenAddressDescriptions, $hiddenField);
            }

            // Inserir mensagem no rodapé
            const $saveButton = $('p.submit');
            if ($saveButton.length) {
                const $footerMessage = $(`
                    <div>
                        <p>
                            Quer conhecer mais sobre nossos plugins? Suporte WordPress 24h:
                            <a href="https://www.linknacional.com.br/wordpress" target="_blank">Link Nacional</a>
                            | Avalie nosso plugin
                            <a href="https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews" target="_blank">★★★★★</a>.
                        </p>
                    </div>
                `);
                $saveButton.after($footerMessage);
            }

            // Esconder o loader com fade
            if ($lodingField.length) {
                $lodingField.fadeOut(400); // 400ms é o padrão do jQuery

                $('.woocommerce-save-button').on('click', function () {
                    const $loadingField = $('#wc-better-calc-root');
                    if ($loadingField.length) {
                        $loadingField.fadeIn(200);
                    }
                });
            }
        }

        countInterval++;
    }, 10);

    function createDescBox($label, descriptionsMap, $input) {
        const $box = $('<div>', {
            class: 'woo-better-calc-desc-box',
            css: { marginTop: '10px' }
        });

        $label.after($box);

        function updateDescription() {
            const selected = $input.val();
            const text = descriptionsMap[selected] || '';
            $box.html(text ? '<p>' + text + '</p>' : '');
        }

        updateDescription();
        $input.on('change', updateDescription);
    }

    function handleDisableShippingChange($numberField, $hiddenField, $requirePostcode) {
        return function () {
            const selectedValue = $(this).val();

            if (selectedValue === 'all') {
                $numberField.prop('disabled', true).css({
                    backgroundColor: '#f1f1f1',
                    cursor: 'not-allowed'
                });
                $hiddenField.prop('disabled', true).css({
                    backgroundColor: '#f1f1f1',
                    cursor: 'not-allowed'
                });
                $requirePostcode.prop('disabled', true).css({
                    backgroundColor: '#f1f1f1',
                    cursor: 'not-allowed'
                });
            } else {
                $numberField.prop('disabled', false).css({
                    backgroundColor: '',
                    cursor: ''
                });
                $hiddenField.prop('disabled', false).css({
                    backgroundColor: '',
                    cursor: ''
                });
                $requirePostcode.prop('disabled', false).css({
                    backgroundColor: '',
                    cursor: ''
                });
            }
        }
    }

    function handleRequirePostcodeChange($hiddenField) {
        return function () {
            const selectedValue = $(this).val();

            if (selectedValue === 'no') {
                $hiddenField.prop('disabled', true).css({
                    backgroundColor: '#f1f1f1',
                    cursor: 'not-allowed'
                });
            } else {
                $hiddenField.prop('disabled', false).css({
                    backgroundColor: '',
                    cursor: ''
                });
            }
        }
    }
});
