jQuery(function ($) {
    // Máscaras por código de país
    const phoneMasks = {
        '+1': '(999) 999-9999',
        '+7': '9 (999) 999-99-99',
        '+20': '9999 999 9999',
        '+27': '999 999 9999',
        '+30': '999 9999 9999',
        '+31': '99 999 9999',
        '+32': '999 99 99 99',
        '+33': '99 99 99 99 99',
        '+34': '999 99 99 99',
        '+36': '99 999 9999',
        '+39': '999 999 9999',
        '+40': '9999 999 999',
        '+41': '99 999 99 99',
        '+43': '9999 999999',
        '+44': '9999 999999',
        '+45': '99 99 99 99',
        '+46': '99-999 99 99',
        '+47': '999 99 999',
        '+48': '999-999-999',
        '+49': '9999 9999999',
        '+51': '999 999 999',
        '+52': '999 999 9999',
        '+53': '999 999 9999',
        '+54': '999 9999-9999',
        '+55': '(99) 99999-9999',
        '+56': '9 9999 9999',
        '+57': '999 9999999',
        '+58': '9999-9999999',
        '+60': '999-999 9999',
        '+61': '9999 999 999',
        '+62': '999-9999-9999',
        '+63': '9999 999 9999',
        '+64': '999 999 999',
        '+65': '9999 9999',
        '+66': '99 9999 9999',
        '+81': '99-9999-9999',
        '+82': '99-999-9999',
        '+84': '9999 999 999',
        '+86': '999 9999 9999',
        '+90': '999 999 9999',
        '+91': '99999-99999',
        '+92': '9999-9999999',
        '+93': '99 999 9999',
        '+94': '999-9999999',
        '+98': '999 999 9999',
        '+212': '999-999999',
        '+213': '999 99 99 99',
        '+216': '99 999 999',
        '+218': '99-9999999',
        '+220': '999 9999',
        '+221': '99 999 99 99',
        '+222': '9999 9999',
        '+223': '99 99 99 99',
        '+224': '999 99 99 99',
        '+225': '99 999 999',
        '+226': '99 99 99 99',
        '+227': '99 99 99 99',
        '+228': '99 99 99 99',
        '+229': '99 99 99 99',
        '+230': '999 9999',
        '+231': '999 999 9999',
        '+232': '99 999999',
        '+233': '999 999 9999',
        '+234': '999 999 9999',
        '+351': '99 999 99 99',
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
        // Se não houver dígitos, mantém os caracteres especiais digitados
        if (v.length === 0) {
            return value.replace(/[0-9]/g, '');
        }
        return formatted;
    }

    function bindPhoneMaskEvents(phoneType) {
        var inputId = '#' + phoneType + '_phone';
        var selectId = '#' + phoneType + '_phone_country';
        var $input = $(inputId);
        var $select = $(selectId);
        if ($input.length === 0 || $select.length === 0) return;

        var inputTimeout;
        function maskHandler(triggerChange = false) {
            var code = $select.val();
            var mask = phoneMasks[code] || '';
            var value = $input.val();
            var masked = mask ? applyMask(value, mask) : value.replace(/[^0-9()\- ]/g, '');
            var inputEl = $input[0];
            if (inputEl) {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
                // Só dispara evento se o valor mudou
                if (inputEl.value !== masked) {
                    nativeSetter.call(inputEl, masked);
                    inputEl.setAttribute('value', masked);
                    if (triggerChange) {
                        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                }
            } else {
                $input.val(masked);
            }
        }

        $input.on('input', function (e) {
            // Permite digitar números, (, ), -, espaço normalmente
            if (e.originalEvent && e.originalEvent.data && !(/[0-9\(\)\- ]/.test(e.originalEvent.data))) {
                // Bloqueia outros caracteres
                var val = $input.val();
                $input.val(val.replace(/[^0-9\(\)\- ]/g, ''));
                return;
            }
            maskHandler(true);
        });
        $select.on('change', function () {
            $input.val('');
            maskHandler();
        });

        // Se já existe valor, formata imediatamente
        if ($input.val().length > 0) {
            maskHandler();
        }
    }


    function moveCountrySelect(phoneType) {
        var inputId = '#' + phoneType + '_phone';
        var selectFieldId = '#' + phoneType + '_phone_country_field';
        var $input = $(inputId);
        var $selectField = $(selectFieldId);
        if ($input.length === 0 || $selectField.length === 0) return;

        // Já foi movimentado? (verifica se já existe select com position absolute)
        var $wrapper = $input.closest('.woocommerce-input-wrapper');
        if ($wrapper.length === 0) return;
        if ($wrapper.css('position') === 'relative' && $wrapper.find('select').css('position') === 'absolute') return;

        // Remove label do select
        $selectField.find('label').remove();

        // Pega o select
        var $select = $selectField.find('select');
        if ($select.length === 0) return;

        // Move o select para dentro do wrapper
        $wrapper.append($select);
        $selectField.remove();

        // Aplica position relative no wrapper
        $wrapper.css('position', 'relative');

        // Estiliza o select como absolute à esquerda do input
        $select.css({
            position: 'absolute',
            left: '0',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '100px',
            minWidth: '100px',
            height: $input.outerHeight(),
            fontSize: 'small',
            zIndex: 2,
            background: '#fff',
            borderRadius: '4px',
            border: '1px solid #ccc',
            padding: '0 24px 0 4px',
            appearance: 'auto',
            WebkitAppearance: 'auto',
            MozAppearance: 'auto'
        });

        // Empurra o input pra direita
        $input.css({
            paddingLeft: '120px',
            boxSizing: 'border-box'
        });

        // Aplica máscara dinâmica ao telefone
        setTimeout(function () {
            bindPhoneMaskEvents(phoneType);
        }, 100);
    }

    function setDefaultCountrySelect(phoneType) {
        var selectId = '#' + phoneType + '_phone_country';
        var $select = $(selectId);
        var defaultCode = '+55';
        var localized = window.wc_better_phone_country_shortcode || {};
        var code = localized[phoneType + '_phone_country'] || '';
        if (!code) code = defaultCode;
        if ($select.length && !$select.val()) {
            $select.val(code).trigger('change');
        }
    }

    function observerCountrySelect() {
        var target = document.querySelector('#checkout, .woocommerce-checkout, form.checkout, body');
        if (!target) target = document.body;
        var observer = new MutationObserver(function () {
            moveCountrySelect('billing');
            moveCountrySelect('shipping');
            setDefaultCountrySelect('billing');
            setDefaultCountrySelect('shipping');
        });
        observer.observe(target, { childList: true, subtree: true });
    }

    observerCountrySelect();

});
