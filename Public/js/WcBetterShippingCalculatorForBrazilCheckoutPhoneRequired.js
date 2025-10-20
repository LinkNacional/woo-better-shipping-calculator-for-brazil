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
        var $select = $('<select></select>')
            .addClass('phone-country-select')
            .attr('id', 'phone-country-select-' + fieldId)
            .css({
                position: 'absolute',
                left: '0',
                top: '0',
                width: selectWidth + 'px',
                height: $field.outerHeight(),
                maxHeight: '120px',
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

        $.each(countries, function (_, country) {
            var $option = $('<option></option>')
                .val(country.code)
                .text(country.flag + ' ' + country.code);
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
        });
    }

    function observeFields(fieldIds) {
        var observer = new MutationObserver(function () {
            $.each(fieldIds, function (_, id) {
                createCountrySelect(id);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        // Checagem inicial
        $.each(fieldIds, function (_, id) {
            createCountrySelect(id);
        });
    }

    observeFields(['billing-phone', 'shipping-phone']);
});
