// Máscaras de telefone por país
const phoneMasks = {
    '+1': '(999) 999-9999', // Estados Unidos
    '+7': '9 (999) 999-99-99', // Rússia
    '+20': '9999 999 9999', // Egito
    '+27': '999 999 9999', // África do Sul
    '+30': '999 9999 9999', // Grécia
    '+31': '99 999 9999', // Holanda
    '+32': '999 99 99 99', // Bélgica
    '+33': '99 99 99 99 99', // França
    '+34': '999 99 99 99', // Espanha
    '+36': '99 999 9999', // Hungria
    '+39': '999 999 9999', // Itália
    '+40': '9999 999 999', // Romênia
    '+41': '99 999 99 99', // Suíça
    '+43': '9999 999999', // Áustria
    '+44': '9999 999999', // Reino Unido
    '+45': '99 99 99 99', // Dinamarca
    '+46': '99-999 99 99', // Suécia
    '+47': '999 99 999', // Noruega
    '+48': '999-999-999', // Polônia
    '+49': '9999 9999999', // Alemanha
    '+51': '999 999 999', // Peru
    '+52': '999 999 9999', // México
    '+53': '999 999 9999', // Cuba
    '+54': '999 9999-9999', // Argentina
    '+55': '(99) 99999-9999', // Brasil
    '+56': '9 9999 9999', // Chile
    '+57': '999 9999999', // Colômbia
    '+58': '9999-9999999', // Venezuela
    '+60': '999-999 9999', // Malásia
    '+61': '9999 999 999', // Austrália
    '+62': '999-9999-9999', // Indonésia
    '+63': '9999 999 9999', // Filipinas
    '+64': '999 999 999', // Nova Zelândia
    '+65': '9999 9999', // Singapura
    '+66': '99 9999 9999', // Tailândia
    '+81': '99-9999-9999', // Japão
    '+82': '99-999-9999', // Coreia do Sul
    '+84': '9999 999 999', // Vietnã
    '+86': '999 9999 9999', // China
    '+90': '999 999 9999', // Turquia
    '+91': '99999-99999', // Índia
    '+92': '9999-9999999', // Paquistão
    '+93': '99 999 9999', // Afeganistão
    '+94': '999-9999999', // Sri Lanka
    '+98': '999 999 9999', // Irã
    '+212': '999-999999', // Marrocos
    '+213': '999 99 99 99', // Argélia
    '+216': '99 999 999', // Tunísia
    '+218': '99-9999999', // Líbia
    '+220': '999 9999', // Gâmbia
    '+221': '99 999 99 99', // Senegal
    '+222': '9999 9999', // Mauritânia
    '+223': '99 99 99 99', // Mali
    '+224': '999 99 99 99', // Guiné
    '+225': '99 999 999', // Costa do Marfim
    '+226': '99 99 99 99', // Burkina Faso
    '+227': '99 99 99 99', // Níger
    '+228': '99 99 99 99', // Togo
    '+229': '99 99 99 99', // Benin
    '+230': '999 9999', // Maurício
    '+231': '999 999 9999', // Libéria
    '+232': '99 999999', // Serra Leoa
    '+233': '999 999 9999', // Gana
    '+234': '999 999 9999', // Nigéria
    '+351': '99 999 99 99', // Portugal
};

function applyMask(value, mask) {
    let v = value.replace(/\D/g, '');
    let m = mask;
    let i = 0;
    let formatted = '';
    for (let c of m) {
        if (c === '9') {
            if (v[i]) {
                formatted += v[i++];
            } else {
                break;
            }
        } else {
            if (i < v.length) {
                formatted += c;
            }
        }
    }
    return formatted;
}

jQuery(function ($) {
    // Dados dos países
    var countries = [
        { code: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
        { code: '+7', name: 'Rússia', flag: '🇷🇺' },
        { code: '+20', name: 'Egito', flag: '🇪🇬' },
        { code: '+27', name: 'África do Sul', flag: '🇿🇦' },
        { code: '+30', name: 'Grécia', flag: '🇬🇷' },
        { code: '+31', name: 'Holanda', flag: '🇳🇱' },
        { code: '+32', name: 'Bélgica', flag: '🇧🇪' },
        { code: '+33', name: 'França', flag: '🇫🇷' },
        { code: '+34', name: 'Espanha', flag: '🇪🇸' },
        { code: '+36', name: 'Hungria', flag: '🇭🇺' },
        { code: '+39', name: 'Itália', flag: '🇮🇹' },
        { code: '+40', name: 'Romênia', flag: '🇷🇴' },
        { code: '+41', name: 'Suíça', flag: '🇨🇭' },
        { code: '+43', name: 'Áustria', flag: '🇦🇹' },
        { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
        { code: '+45', name: 'Dinamarca', flag: '🇩🇰' },
        { code: '+46', name: 'Suécia', flag: '🇸🇪' },
        { code: '+47', name: 'Noruega', flag: '🇳🇴' },
        { code: '+48', name: 'Polônia', flag: '🇵🇱' },
        { code: '+49', name: 'Alemanha', flag: '🇩🇪' },
        { code: '+51', name: 'Peru', flag: '🇵🇪' },
        { code: '+52', name: 'México', flag: '🇲🇽' },
        { code: '+53', name: 'Cuba', flag: '🇨🇺' },
        { code: '+54', name: 'Argentina', flag: '🇦🇷' },
        { code: '+55', name: 'Brasil', flag: '🇧🇷' },
        { code: '+56', name: 'Chile', flag: '🇨🇱' },
        { code: '+57', name: 'Colômbia', flag: '🇨🇴' },
        { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
        { code: '+60', name: 'Malásia', flag: '🇲🇾' },
        { code: '+61', name: 'Austrália', flag: '🇦🇺' },
        { code: '+62', name: 'Indonésia', flag: '🇮🇩' },
        { code: '+63', name: 'Filipinas', flag: '🇵🇭' },
        { code: '+64', name: 'Nova Zelândia', flag: '🇳🇿' },
        { code: '+65', name: 'Singapura', flag: '🇸🇬' },
        { code: '+66', name: 'Tailândia', flag: '🇹🇭' },
        { code: '+81', name: 'Japão', flag: '🇯🇵' },
        { code: '+82', name: 'Coreia do Sul', flag: '🇰🇷' },
        { code: '+84', name: 'Vietnã', flag: '🇻🇳' },
        { code: '+86', name: 'China', flag: '🇨🇳' },
        { code: '+90', name: 'Turquia', flag: '🇹🇷' },
        { code: '+91', name: 'Índia', flag: '🇮🇳' },
        { code: '+92', name: 'Paquistão', flag: '🇵🇰' },
        { code: '+93', name: 'Afeganistão', flag: '🇦🇫' },
        { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
        { code: '+98', name: 'Irã', flag: '🇮🇷' },
        { code: '+212', name: 'Marrocos', flag: '🇲🇦' },
        { code: '+213', name: 'Argélia', flag: '🇩🇿' },
        { code: '+216', name: 'Tunísia', flag: '🇹🇳' },
        { code: '+218', name: 'Líbia', flag: '🇱🇾' },
        { code: '+220', name: 'Gâmbia', flag: '🇬🇲' },
        { code: '+221', name: 'Senegal', flag: '🇸🇳' },
        { code: '+222', name: 'Mauritânia', flag: '🇲🇷' },
        { code: '+223', name: 'Mali', flag: '🇲🇱' },
        { code: '+224', name: 'Guiné', flag: '🇬🇳' },
        { code: '+225', name: 'Costa do Marfim', flag: '🇨🇮' },
        { code: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
        { code: '+227', name: 'Níger', flag: '🇳🇪' },
        { code: '+228', name: 'Togo', flag: '🇹🇬' },
        { code: '+229', name: 'Benin', flag: '🇧🇯' },
        { code: '+230', name: 'Maurício', flag: '🇲🇺' },
        { code: '+231', name: 'Libéria', flag: '🇱🇷' },
        { code: '+232', name: 'Serra Leoa', flag: '🇸🇱' },
        { code: '+233', name: 'Gana', flag: '🇬🇭' },
        { code: '+234', name: 'Nigéria', flag: '🇳🇬' },
        { code: '+351', name: 'Portugal', flag: '🇵🇹' },
        // ...adicione mais países se quiser
    ];

    function createCountrySelect(fieldId) {
        var $field = $('#' + fieldId);
        if ($field.length === 0) {
            return;
        }
        var $parentDiv = $field.parent();
        if ($parentDiv.find('.phone-country-select').length) {
            return;
        }

        var selectWidth = 118;
        $parentDiv.css('position', 'relative');
        var fieldHeight = $field.outerHeight() || 40;
        var $select = $('<select></select>')
            .addClass('phone-country-select')
            .attr('id', 'woo-better-country-select-' + fieldId)
            .css({
                position: 'absolute',
                left: '0',
                top: '0',
                width: selectWidth + 'px',
                height: '100%',
                maxHeight: fieldHeight + 'px',
                overflowY: 'auto',
                zIndex: 2,
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                paddingLeft: '4px',
                fontSize: 'medium',
                appearance: 'auto',
                '-webkit-appearance': 'menulist',
                '-moz-appearance': 'menulist'
            });

        // Função para atualizar o max-height do select
        function updateSelectHeight() {
            var newHeight = $field.outerHeight() || 40;
            $select.css('maxHeight', newHeight + 'px');
        }
        // Observa mudanças no parentDiv (ex: erro de validação)
        var heightObserver = new MutationObserver(function () {
            updateSelectHeight();
        });
        heightObserver.observe($parentDiv[0], { childList: true, subtree: true });
        // Atualiza também ao focar, desfocar e ao inicializar
        $field.on('focus blur input', updateSelectHeight);
        updateSelectHeight();
        // Atualiza ao redimensionar a janela (mobile/desktop)
        $(window).on('resize', updateSelectHeight);

        // Define o valor do país pelo PHP/session, se disponível
        let countryCode = '+55';
        if (typeof wc_better_phone_country !== 'undefined') {
            if (fieldId === 'billing-phone' && wc_better_phone_country.billing_phone_country) {
                countryCode = wc_better_phone_country.billing_phone_country;
            }
            if (fieldId === 'shipping-phone' && wc_better_phone_country.shipping_phone_country) {
                countryCode = wc_better_phone_country.shipping_phone_country;
            }
        }
        $.each(countries, function (_, country) {
            var $option = $('<option></option>')
                .val(country.code)
                .text(country.flag + ' ' + country.code);
            if (country.code === countryCode) {
                $option.attr('selected', 'selected');
            }
            $select.append($option);
        });

        $parentDiv.prepend($select);
        $field.css({
            paddingLeft: (selectWidth + 10) + 'px',
            boxSizing: 'border-box'
        });
        var $label = $parentDiv.find('label[for="' + fieldId + '"]');
        var initialPadding = (selectWidth + 10) + 'px';
        if ($field.val()) {
            initialPadding = (selectWidth + 40) + 'px';
        }
        $label.css({
            paddingLeft: initialPadding,
            display: 'block',
            transition: 'padding-left 0.2s'
        });
        $field.on('focus', function () {
            $label.css('paddingLeft', (selectWidth + 40) + 'px');
        });
        $field.on('blur', function () {
            if ($field.val()) {
                $label.css('paddingLeft', (selectWidth + 40) + 'px');
            } else {
                $label.css('paddingLeft', (selectWidth + 10) + 'px');
            }
            // Aplica máscara e força valor formatado no input
            const input = $field[0];
            if (!input) return;
            const code = $select.val();
            const mask = phoneMasks[code] || '';
            let currentValue = $field.val();
            let numeric = currentValue.replace(/\D/g, '');
            let maxDigits = (mask.match(/9/g) || []).length;
            numeric = numeric.substring(0, maxDigits);
            const maskedValue = applyMask(numeric, mask);
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(input, maskedValue);
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });
        // Remove todos os eventos antigos relacionados à máscara
        $field.off('input keypress change');
        $select.off('change');

        // Callback para input
        function maskInputCallback(e) {

            const code = $select.val();
            const mask = phoneMasks[code] || '';
            if (mask) {
                let input = $field[0];
                let currentValue = $field.val();
                let maxDigits = (mask.match(/9/g) || []).length;


                // Permite digitar apenas números, (, ), - e espaço
                if (e.inputType === 'insertText' && e.data && !(/[0-9\(\)\- ]/.test(e.data))) {
                    // Remove o último caractere inserido se não for permitido
                    $field.val(currentValue.slice(0, -1));
                    $field[0].setAttribute('value', currentValue.slice(0, -1));
                    $field[0].dispatchEvent(new Event('input', { bubbles: true }));
                    return;
                }

                // Extrai todos os dígitos do campo
                let numeric = '';
                let cursorPos = input.selectionStart;
                let digitsBeforeCursor = 0;
                for (let i = 0; i < currentValue.length; i++) {
                    if (/\d/.test(currentValue[i])) {
                        numeric += currentValue[i];
                        if (i < cursorPos) digitsBeforeCursor++;
                    }
                }

                // Permite digitação livre se não houver números
                if (numeric.length === 0) {
                    return;
                }

                // Aplica máscara normalmente se houver números
                numeric = numeric.substring(0, maxDigits);
                let maskedValue = applyMask(numeric, mask);
                if (maskedValue !== currentValue) {
                    // Mantém caracteres especiais permitidos digitados manualmente
                    let specials = currentValue.replace(/[0-9]/g, '');
                    let finalValue = '';
                    let digitIdx = 0;
                    for (let i = 0; i < maskedValue.length; i++) {
                        if (/[0-9]/.test(maskedValue[i])) {
                            finalValue += maskedValue[i];
                            digitIdx++;
                        } else {
                            finalValue += maskedValue[i];
                        }
                    }
                    for (let c of specials) {
                        if (!finalValue.includes(c) && /[\(\)\- ]/.test(c)) {
                            finalValue += c;
                        }
                    }
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                    if (input.value !== finalValue) {
                        nativeSetter.call(input, finalValue);
                        // Reposiciona o cursor na posição equivalente ao número inserido
                        let maskCursorPos = 0;
                        let digitsCounted = 0;
                        while (maskCursorPos < finalValue.length && digitsCounted < digitsBeforeCursor) {
                            if (/\d/.test(finalValue[maskCursorPos])) {
                                digitsCounted++;
                            }
                            maskCursorPos++;
                        }
                        maskCursorPos = Math.min(maskCursorPos, finalValue.length);
                        input.setSelectionRange(maskCursorPos, maskCursorPos);
                    }
                }
            }
        }

        // Evento de input para aplicar máscara
        $field.on('input', maskInputCallback);
        $select.on('change', function () {
            const input = $field[0];
            if (!input) return;

            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            // Agora seta vazio e dispara input para atualizar o React
            nativeSetter.call(input, '');
            input.dispatchEvent(new Event('input', { bubbles: true }));

            // Ajusta o padding do label se o campo estiver vazio
            const $label = $parentDiv.find('label[for="' + fieldId + '"]');
            if ($field.val() === '') {
                $label.css('paddingLeft', (selectWidth + 10) + 'px');
            }
        });
    }

    function observeFields(fieldIds) {
        var observer = new MutationObserver(function () {
            $.each(fieldIds, function (_, id) {
                createCountrySelect(id);
            });
            // Atualiza ambos os campos no WooCommerce Blocks sempre que houver mutação
            if (window.wc && window.wc.blocksCheckout) {
                var $billingSelect = $('#woo-better-country-select-billing-phone');
                var $shippingSelect = $('#woo-better-country-select-shipping-phone');
                var billingCode = $billingSelect.length ? $billingSelect.val() : null;
                var shippingCode = $shippingSelect.length ? $shippingSelect.val() : null;

                // Se só um dos selects existe, usa o mesmo código para ambos
                if (billingCode && !shippingCode) {
                    shippingCode = billingCode;
                } else if (!billingCode && shippingCode) {
                    billingCode = shippingCode;
                }

                var data = {};
                if (billingCode) {
                    data.billing_phone_country = billingCode;
                }
                if (shippingCode) {
                    data.shipping_phone_country = shippingCode;
                }

                window.wc.blocksCheckout.extensionCartUpdate({
                    namespace: 'woo_better_phone_validation',
                    data: data
                });
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // Checagem inicial
        $.each(fieldIds, function (_, id) {
            createCountrySelect(id);
        });
        // Atualiza ambos os campos no WooCommerce Blocks na checagem inicial
        if (window.wc && window.wc.blocksCheckout) {
            var $billingSelect = $('#woo-better-country-select-billing-phone');
            var $shippingSelect = $('#woo-better-country-select-shipping-phone');
            var billingCode = $billingSelect.length ? $billingSelect.val() : null;
            var shippingCode = $shippingSelect.length ? $shippingSelect.val() : null;

            if (billingCode && !shippingCode) {
                shippingCode = billingCode;
            } else if (!billingCode && shippingCode) {
                billingCode = shippingCode;
            }

            var data = {};
            if (billingCode) {
                data.billing_phone_country = billingCode;
            }
            if (shippingCode) {
                data.shipping_phone_country = shippingCode;
            }

            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_phone_validation',
                data: data
            });
        }
    }

    observeFields(['billing-phone', 'shipping-phone']);
});
