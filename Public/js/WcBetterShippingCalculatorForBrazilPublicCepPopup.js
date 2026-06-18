/**
 * CEP Pop-up Validation
 *
 * jQuery-powered modal with 3D card flip animation:
 * - Front: CEP input + consult button
 * - Back: result (success/error) + back button
 * Border-tracing "cobrinha" spinner on the front face during loading.
 * Saves close state to localStorage for 2 days.
 *
 * @since 4.17.0
 */
(function ($) {
    'use strict';

    var POPUP_STORAGE_KEY = 'woo_better_cep_popup_closed';
    var POPUP_EXPIRY_DAYS = 2;

    function shouldShowPopup() {
        var stored = localStorage.getItem(POPUP_STORAGE_KEY);
        if (!stored) return true;
        try {
            var data = JSON.parse(stored);
            var closedAt = new Date(data.closedAt).getTime();
            var now = Date.now();
            return (now - closedAt) / 86400000 >= POPUP_EXPIRY_DAYS;
        } catch (e) { return true; }
    }

    function markPopupClosed() {
        localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify({ closedAt: new Date().toISOString() }));
    }

    function getAjaxData() { return window.WooBetterCepPopup || {}; }
    function escapeHtml(t) { var d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

    // ── Spinner (cobrinha) ──────────────────────────────────────────────

    var spinnerEl = null, spinnerRestoredStatic = false;

    function injectSpinnerCss() {
        if (document.getElementById('wc-better-cep-popup-spinner-css')) return;
        var s = document.createElement('style');
        s.id = 'wc-better-cep-popup-spinner-css';
        s.textContent = '.wc-better-cep-popup-spinner-overlay{pointer-events:none;z-index:10;overflow:visible}';
        document.head.appendChild(s);
    }

    /**
     * Exibe cobrinha na borda da face frontal do card.
     */
    function showBorderSpinner($frontFace) {
        hideBorderSpinner();
        injectSpinnerCss();
        var c = $frontFace[0]; if (!c) return;
        var cs = window.getComputedStyle(c);
        if (cs.position === 'static') { c.style.position = 'relative'; spinnerRestoredStatic = true; }
        var bw = parseFloat(cs.borderTopWidth) || 0;
        var outerRadius = parseFloat(cs.borderTopLeftRadius) || 12;
        var rx = Math.max(0, outerRadius - bw / 2);
        var ow = c.offsetWidth, oh = c.offsetHeight;
        var straightW = Math.max(0, ow - bw - 2 * rx);
        var straightH = Math.max(0, oh - bw - 2 * rx);
        var perimeter = 2 * (straightW + straightH) + 2 * Math.PI * rx;
        var trailLength = perimeter * 0.25;
        var ns = 'http://www.w3.org/2000/svg';
        var svg = document.createElementNS(ns, 'svg');
        svg.setAttribute('width', ow); svg.setAttribute('height', oh);
        svg.setAttribute('class', 'wc-better-cep-popup-spinner-overlay');
        svg.style.cssText = 'position:absolute;top:-' + bw + 'px;left:-' + bw + 'px;pointer-events:none;z-index:10;overflow:visible;';
        var rect = document.createElementNS(ns, 'rect');
        rect.setAttribute('x', bw / 2); rect.setAttribute('y', bw / 2);
        rect.setAttribute('width', ow - bw); rect.setAttribute('height', oh - bw);
        rect.setAttribute('rx', rx); rect.setAttribute('ry', rx);
        rect.setAttribute('fill', 'none'); rect.setAttribute('stroke', '#2271b1');
        rect.setAttribute('stroke-width', '3');
        rect.setAttribute('stroke-dasharray', trailLength + ' ' + (perimeter - trailLength));
        rect.setAttribute('stroke-linecap', 'round');
        svg.appendChild(rect);
        c.appendChild(svg);
        spinnerEl = svg;
        rect.animate([{ strokeDashoffset: '0' }, { strokeDashoffset: '' + (-perimeter) }],
            { duration: 1200, iterations: Infinity, easing: 'linear' });
    }

    function hideBorderSpinner() {
        if (spinnerEl) { spinnerEl.remove(); spinnerEl = null; }
        if (spinnerRestoredStatic) {
            var front = document.querySelector('.wc-better-cep-flip-front');
            if (front) front.style.position = '';
            spinnerRestoredStatic = false;
        }
    }

    // ── 3D Flip ─────────────────────────────────────────────────────────

    function flipToBack($card, $inner, $closeBtn) {
        // Esconde o X enquanto o cartão está virado
        $closeBtn.addClass('wc-better-cep-close-hidden');

        var $back = $card.find('.wc-better-cep-flip-back');
        var $front = $card.find('.wc-better-cep-flip-front');

        var origPos = $back.css('position');
        var origVis = $back.css('backface-visibility');
        var origInset = $back.css('inset');

        $back.css({ position: 'relative', backfaceVisibility: 'visible', inset: '', top: '', right: '', bottom: '', left: '', transform: 'none' });
        $back[0].offsetHeight; // reflow
        var backH = $back[0].scrollHeight;
        var frontH = $front[0].scrollHeight;
        $back.css({ position: origPos, backfaceVisibility: origVis, inset: origInset, transform: '' });

        var targetH = Math.max(backH, frontH);
        requestAnimationFrame(function () {
            $inner.css('min-height', targetH + 'px');
            requestAnimationFrame(function () {
                $card.addClass('wc-better-cep-flipped');
            });
        });
    }

    function flipToFront($card, $inner, $closeBtn) {
        $card.removeClass('wc-better-cep-flipped wc-better-cep-success');
        // Reseta min-height + mostra o X só depois da transição terminar (600ms)
        setTimeout(function () {
            $inner.css('min-height', '');
            $closeBtn.removeClass('wc-better-cep-close-hidden');
        }, 620);
    }

    // ── Build DOM ────────────────────────────────────────────────────────

    function buildPopup() {
        var ajax = getAjaxData();
        var $overlay = $('<div class="wc-better-cep-popup-overlay"></div>');

        var $popup = $(
            '<div class="wc-better-cep-popup">' +
              '<button class="wc-better-cep-popup-close" aria-label="Fechar">&times;</button>' +
              '<div class="wc-better-cep-flip-card" style="position:relative;">' +
                '<div class="wc-better-cep-flip-inner">' +

                  // ── FRENTE ──
                  '<div class="wc-better-cep-flip-front">' +
                    '<div class="wc-better-cep-popup-content">' +
                      '<h2 class="wc-better-cep-popup-title">' + (ajax.title || 'Qual a sua preferência?') + '</h2>' +
                      (ajax.local_pickup_available ?
                        '<div class="wc-better-cep-popup-option">' +
                          '<div class="wc-better-cep-popup-option-header">' +
                            '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                              '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>' +
                              '<polyline points="9 22 9 12 15 12 15 22"></polyline>' +
                            '</svg>' +
                            '<span class="wc-better-cep-popup-option-label">' + (ajax.local_pickup_label || 'Retirada em Loja') + '</span>' +
                          '</div>' +
                          '<div class="wc-better-cep-popup-option-body">' +
                            (ajax.pickup_address ? '<p class="wc-better-cep-pickup-address">' + escapeHtml(ajax.pickup_address) + '</p>' : '') +
                            '<button class="wc-better-cep-popup-pickup-continue-btn">' + (ajax.pickup_continue_label || 'CONTINUAR COMPRA') + '</button>' +
                          '</div>' +
                        '</div>' : ''
                      ) +
                      '<div class="wc-better-cep-popup-option">' +
                        '<div class="wc-better-cep-popup-option-header">' +
                          '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                            '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>' +
                            '<circle cx="12" cy="10" r="3"></circle>' +
                          '</svg>' +
                          '<span class="wc-better-cep-popup-option-label">' + (ajax.delivery_label || 'Entregar no Endereço') + '</span>' +
                        '</div>' +
                        '<div class="wc-better-cep-popup-option-body">' +
                          '<div class="wc-better-cep-popup-form">' +
                            '<input type="text" class="wc-better-cep-popup-input" placeholder="00000-000" maxlength="9" inputmode="numeric">' +
                            '<button class="wc-better-cep-popup-btn">Consultar</button>' +
                          '</div>' +
                        '</div>' +
                      '</div>' +
                    '</div>' +
                  '</div>' +

                  // ── VERSO ──
                  '<div class="wc-better-cep-flip-back">' +
                    '<div class="wc-better-cep-popup-back-content">' +
                      '<div class="wc-better-cep-popup-back-result"></div>' +
                    '</div>' +
                  '</div>' +

                '</div>' +
              '</div>' +
            '</div>'
        );

        return { $overlay: $overlay, $popup: $popup };
    }

    function applyCepMask(input) {
        var v = input.value.replace(/\D/g, '');
        if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5, 8);
        input.value = v;
    }

    function renderBackResult($back, success, data) {
        var cls = success ? 'wc-better-cep-back-success' : 'wc-better-cep-back-error';
        var html = '';

        if (success) {
            html += '<div class="' + cls + '">';
            html += '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
            html += '<p class="wc-better-cep-back-title">Entregamos na sua região!</p>';
            html += '<div class="wc-better-cep-popup-back-actions">';
            html += '<button class="wc-better-cep-popup-back-btn">Voltar</button>';
            html += '<button class="wc-better-cep-popup-continue-btn">Continuar Compra</button>';
            html += '</div>';
            html += '</div>';
        } else {
            var whatsapp = (getAjaxData().whatsapp_number || '').replace(/\D/g, '');
            var postcodeFormatted = (data.postcode || '').replace(/\D/g, '');
            var waMsg = 'Estou tendo dificuldades com meu CEP: ' + (postcodeFormatted || '_____') + ', pode me ajudar?';
            html += '<div class="' + cls + '">';
            html += '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            html += '<p class="wc-better-cep-back-title-err">Não entregamos na sua região.</p>';
            html += '<p class="wc-better-cep-back-msg">' + escapeHtml(data.message || 'Entre em contato conosco para organizar sua entrega.') + '</p>';
            html += '<div class="wc-better-cep-popup-back-actions">';
            html += '<button class="wc-better-cep-popup-back-btn">Voltar</button>';
            if (whatsapp) {
                html += '<a class="wc-better-cep-popup-whatsapp-btn" href="https://wa.me/55' + whatsapp + '?text=' + encodeURIComponent(waMsg) + '" target="_blank" rel="noopener">';
                html += '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>';
                html += ' WhatsApp</a>';
            }
            html += '</div>';
            html += '</div>';
        }

        $back.html(html);
    }

    function closePopup($overlay, $popup) {
        hideBorderSpinner();
        $popup.fadeOut(300);
        $overlay.fadeOut(300, function () { $overlay.remove(); markPopupClosed(); });
    }

    // ── Init ─────────────────────────────────────────────────────────────

    function init() {
        if (!shouldShowPopup()) return;
        var ajax = getAjaxData();
        if (!ajax.ajaxurl || !ajax.nonce || !ajax.enabled) return;

        var parts = buildPopup();
        var $overlay  = parts.$overlay;
        var $popup    = parts.$popup;

        $('body').append($overlay).append($popup);
        $overlay.hide().fadeIn(400);
        $popup.hide().fadeIn(500);

        var $card      = $popup.find('.wc-better-cep-flip-card');
        var $inner     = $popup.find('.wc-better-cep-flip-inner');
        var $frontFace = $popup.find('.wc-better-cep-flip-front');
        var $input     = $popup.find('.wc-better-cep-popup-input');
        var $btn       = $popup.find('.wc-better-cep-popup-btn');
        var $back      = $popup.find('.wc-better-cep-popup-back-result');
        var $closeBtn  = $popup.find('.wc-better-cep-popup-close');
        var isLoading  = false;

        // Event delegation para o botão "Voltar" (renderizado dinamicamente)
        $popup.on('click', '.wc-better-cep-popup-back-btn', function () {
            flipToFront($card, $inner, $closeBtn);
        });

        // Event delegation para o botão "Continuar Compra" (renderizado dinamicamente)
        $popup.on('click', '.wc-better-cep-popup-continue-btn', function () {
            closePopup($overlay, $popup);
        });

        function doValidate() {
            var cep = $input.val().replace(/\D/g, '');
            if (cep.length !== 8) {
                renderBackResult($back, false, { message: 'Digite um CEP válido com 8 dígitos.', postcode: cep });
                flipToBack($card, $inner, $closeBtn);
                return;
            }
            if (isLoading) return;
            isLoading = true;
            $btn.prop('disabled', true);
            showBorderSpinner($frontFace);

            $.post(ajax.ajaxurl, { action: 'wc_better_cep_popup_validate', postcode: cep, nonce: ajax.nonce })
            .done(function (resp) {
                hideBorderSpinner();
                if (resp.success && resp.data && resp.data.has_shipping) {
                    renderBackResult($back, true, resp.data);
                    $card.addClass('wc-better-cep-success');
                    if (typeof localStorage !== 'undefined') {
                        try {
                            var cd = JSON.parse(localStorage.getItem('woo_better_token_cache_data') || '{}');
                            cd.shared_postcode = cep.slice(0, 5) + '-' + cep.slice(5);
                            localStorage.setItem('woo_better_token_cache_data', JSON.stringify(cd));
                        } catch (e) {}
                    }
                } else {
                    var errData = resp.data || { message: (resp.data && resp.data.message) || 'Erro ao consultar CEP.' };
                    errData.postcode = cep;
                    renderBackResult($back, false, errData);
                }
                flipToBack($card, $inner, $closeBtn);
            })
            .fail(function () {
                hideBorderSpinner();
                renderBackResult($back, false, { message: 'Erro de conexão. Tente novamente.', postcode: cep });
                flipToBack($card, $inner, $closeBtn);
            })
            .always(function () {
                isLoading = false;
                var digits = $input.val().replace(/\D/g, '');
                $btn.prop('disabled', digits.length !== 8);
            });
        }

        // Botão desabilitado até o CEP ter 8 dígitos
        $btn.prop('disabled', true);

        $input.on('input', function () {
            applyCepMask(this);
            var digits = this.value.replace(/\D/g, '');
            $btn.prop('disabled', digits.length !== 8 || isLoading);
        });
        $btn.on('click', doValidate);
        $input.on('keydown', function (e) {
            if (e.which === 13) {
                e.preventDefault();
                var digits = this.value.replace(/\D/g, '');
                if (digits.length === 8) doValidate();
            }
        });


        // Botão "Retirada no Local" — fecha o popup (usuário escolhe retirada no checkout)
        $popup.on('click', '.wc-better-cep-popup-pickup-continue-btn', function () {
            closePopup($overlay, $popup);
        });

        // Fechar — X sempre fecha
        $closeBtn.on('click', function () { closePopup($overlay, $popup); });
        $popup.on('click', function (e) { e.stopPropagation(); });

        // Overlay: só fecha no blur quando o cartão está em sucesso
        // (verso verde). Frente e erro não fecham no overlay.
        $overlay.on('click', function () {
            if ($card.hasClass('wc-better-cep-flipped') && $card.hasClass('wc-better-cep-success')) {
                closePopup($overlay, $popup);
            }
        });
    }

    $(document).ready(init);
})(jQuery);
