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
            var value = $input.val();
            var mask = phoneMasks[code] || '';
            // Lógica especial para Brasil (+55): fixo ou móvel
            if (code === '+55') {
                var digits = value.replace(/\D/g, '');
                if (digits.length === 11) {
                    mask = '(99) 99999-9999'; // móvel
                } else if (digits.length === 10) {
                    mask = '(99) 9999-9999'; // fixo
                }
            }
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
            var val = $input.val();
            // Se começa com +, tenta detectar código do país
            if (val.startsWith('+')) {
                // Detecta até 3 dígitos após o +
                var match = val.match(/^\+(\d{1,3})/);
                var code = match ? ('+' + match[1]) : '';
                // Se o usuário digitou 2 ou 3 dígitos após o +
                if (match && (match[1].length === 2 || match[1].length === 3)) {
                    // Se não existe código, apaga o input
                    if (!phoneMasks[code]) {
                        $input.val('');
                        return;
                    }
                }
                // Se existe código no select, seta
                if (code && phoneMasks[code]) {
                    $select.val(code);
                    $select.trigger('change');
                    // Limita o valor ao código detectado
                    if (val.length > code.length) {
                        val = val.slice(0, code.length);
                        $input.val(val);
                    }
                }
                // Não aplica máscara enquanto houver +
                return;
            }
            // Se o usuário digitar espaço após o código, remove o código e aplica máscara
            if (/^\+\d{1,3} /.test(val)) {
                // Remove o código e espaço
                var codeMatch = val.match(/^(\+\d{1,3}) /);
                if (codeMatch) {
                    val = val.replace(codeMatch[0], '');
                    $input.val(val);
                }
                maskHandler(true);
                return;
            }
            // Permite digitar números, (, ), -, espaço normalmente
            if (e.originalEvent && e.originalEvent.data && !(/[0-9\(\)\- ]/.test(e.originalEvent.data))) {
                // Bloqueia outros caracteres
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

        // Verifica se o select já está imediatamente após o input
        var $nextElem = $input.next('select');
        if ($nextElem.length > 0 && ($nextElem.attr('id') === phoneType + '_phone_country')) {
            // Já está no lugar, não movimenta
            return;
        }

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
        if ($select.length) {
            $select.val(code);
            $select.trigger('change');
        }
    }

    function observerCountrySelect() {
        var target = document.querySelector('#checkout, .woocommerce-checkout, form.checkout, body');
        if (!target) target = document.body;
        var observer = new MutationObserver(function () {
            moveCountrySelect('billing');
            moveCountrySelect('shipping');
        });
        observer.observe(target, { childList: true, subtree: true });

        // Chama apenas uma vez ao carregar a página
        setDefaultCountrySelect('billing');
        setDefaultCountrySelect('shipping');
    }

    observerCountrySelect();

});
