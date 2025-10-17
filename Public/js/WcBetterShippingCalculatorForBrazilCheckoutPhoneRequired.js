jQuery(function ($) {
    // Dados dos países
    var countries = [
        { code: '+55', name: 'Brasil', flag: '🇧🇷' },
        { code: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
        { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
        { code: '+351', name: 'Portugal', flag: '🇵🇹' },
        { code: '+34', name: 'Espanha', flag: '🇪🇸' },
        { code: '+33', name: 'França', flag: '🇫🇷' },
        { code: '+49', name: 'Alemanha', flag: '🇩🇪' },
        // ...adicione mais países se quiser
    ];

    function createCountrySelect(fieldId) {
        var $field = $('#' + fieldId);
        if ($field.length === 0) {
            return;
        }
        if ($field.parent().find('.phone-country-select').length) {
            return;
        }

        // Cria um wrapper para posicionamento absoluto
        var $wrapper = $('<div></div>').css({
            position: 'relative',
            display: 'inline-block',
            width: $field.outerWidth() || 220 // fallback para largura padrão
        });

        $field.wrap($wrapper);
        var $newWrapper = $field.parent();

        var selectWidth = 80;
        var $select = $('<select></select>')
            .addClass('phone-country-select')
            .css({
                position: 'absolute',
                left: 0,
                top: 0,
                height: $field.outerHeight(),
                width: selectWidth + 'px',
                zIndex: 2,
                border: '1px solid #ccc',
                borderRadius: '4px',
                background: '#fff',
                paddingLeft: '4px'
            });

        $.each(countries, function (_, country) {
            var $option = $('<option></option>')
                .val(country.code)
                .text(country.flag + ' ' + country.code + ' (' + country.name + ')');
            $select.append($option);
        });

        $newWrapper.prepend($select);
        $field.css({
            paddingLeft: (selectWidth + 10) + 'px',
            boxSizing: 'border-box'
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
