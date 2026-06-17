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
                      '<div class="wc-better-cep-popup-icon">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#2271b1" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
                          '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>' +
                          '<circle cx="12" cy="10" r="3"></circle>' +
                        '</svg>' +
                      '</div>' +
                      '<h2 class="wc-better-cep-popup-title">' + (ajax.title || 'Consulte seu CEP') + '</h2>' +
                      '<p class="wc-better-cep-popup-subtitle">' + (ajax.subtitle || 'Verifique se há entregas disponíveis para sua região.') + '</p>' +
                      '<div class="wc-better-cep-popup-form">' +
                        '<input type="text" class="wc-better-cep-popup-input" placeholder="00000-000" maxlength="9" inputmode="numeric">' +
                        '<button class="wc-better-cep-popup-btn">Consultar</button>' +
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
            var addr = escapeHtml(data.address);
            if (data.neighborhood) addr += ' - ' + escapeHtml(data.neighborhood);
            addr += ', ' + escapeHtml(data.city) + '/' + escapeHtml(data.state);
            html += '<p class="wc-better-cep-back-address">' + addr + '</p>';
            html += '<p class="wc-better-cep-back-title">Entregamos na sua região!</p>';
            if (data.shipping_html) html += '<div class="wc-better-cep-popup-rates">' + data.shipping_html + '</div>';
            html += '<p class="wc-better-cep-back-msg">' + (getAjaxData().successMsg || 'Você já pode continuar suas compras!') + '</p>';
            html += '<button class="wc-better-cep-popup-back-btn">Voltar</button>';
            html += '</div>';
        } else {
            html += '<div class="' + cls + '">';
            html += '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c62828" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
            html += '<p class="wc-better-cep-back-title-err">Não entregamos na sua região.</p>';
            html += '<p class="wc-better-cep-back-msg">' + escapeHtml(data.message || 'Infelizmente não há entregas disponíveis para este CEP.') + '</p>';
            html += '<button class="wc-better-cep-popup-back-btn">Voltar</button>';
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

        function doValidate() {
            var cep = $input.val().replace(/\D/g, '');
            if (cep.length !== 8) {
                renderBackResult($back, false, { message: 'Digite um CEP válido com 8 dígitos.' });
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
                    renderBackResult($back, false, resp.data || { message: (resp.data && resp.data.message) || 'Erro ao consultar CEP.' });
                }
                flipToBack($card, $inner, $closeBtn);
            })
            .fail(function () {
                hideBorderSpinner();
                renderBackResult($back, false, { message: 'Erro de conexão. Tente novamente.' });
                flipToBack($card, $inner, $closeBtn);
            })
            .always(function () {
                isLoading = false;
                $btn.prop('disabled', false);
            });
        }

        $input.on('input', function () { applyCepMask(this); });
        $btn.on('click', doValidate);
        $input.on('keydown', function (e) { if (e.which === 13) { e.preventDefault(); doValidate(); } });


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
