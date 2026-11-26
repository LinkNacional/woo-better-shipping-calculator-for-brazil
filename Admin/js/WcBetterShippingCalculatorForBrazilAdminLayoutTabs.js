jQuery(document).ready(function ($) {
    // ── Pílula PRO ──
    // Dentro do nav a pílula fica aninhada no link da aba (um <a> não pode
    // conter outro <a>), então o clique é capturado na fase de CAPTURA: sem
    // isso o handler do link (que troca de aba) rodaria antes.
    document.addEventListener('click', function (e) {
        var pill = e.target.closest ? e.target.closest('.admin-layout-pro-pill') : null;
        if (!pill) return;
        e.preventDefault();
        e.stopPropagation();
        openProUrl(pill);
    }, true);

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        var pill = e.target.closest ? e.target.closest('.admin-layout-pro-pill[data-pro-url]') : null;
        if (!pill) return;
        e.preventDefault();
        e.stopPropagation();
        openProUrl(pill);
    }, true);

    function openProUrl(pill) {
        var url = pill.getAttribute('data-pro-url') || pill.getAttribute('href');
        // Enquanto a página comercial não estiver definida a constante aponta
        // para '#' — nesse caso só evita a troca de aba.
        if (url && url !== '#') {
            window.open(url, '_blank', 'noopener');
        }
    }

    // ── Guard de "alterações não salvas" do WooCommerce ──
    // O `editPrompt()` do `woocommerce/assets/js/admin/settings.js` liga o
    // `window.onbeforeunload` no primeiro `change` do formulário e só o desliga
    // ao clicar num `:input` DENTRO de `.submit`. Como o botão do layout fica em
    // `.admin-layout-submit-wrapper` (e o `p.submit` nativo é escondido por CSS),
    // o alerta continuava aparecendo ao salvar. Limpamos aqui nos dois caminhos:
    // clique no botão e submit do formulário (cobre o Enter nos campos).
    $(document).on('click', '.admin-layout-submit', function () {
        window.onbeforeunload = null;
    });

    $(document).on('submit', 'form', function () {
        window.onbeforeunload = null;
    });

    // ── Nav carousel ──
    var $outer = $('.admin-layout-top-menu-outer');
    var $clip  = $outer.find('.admin-layout-top-menu-clip');
    var $nav   = $clip.find('.admin-layout-top-menu');
    var $prev  = $outer.find('.admin-layout-nav-arrow--prev');
    var $next  = $outer.find('.admin-layout-nav-arrow--next');
    var offset = 0;

    // Sem menu de abas (uma única seção) nada a fazer.
    if (!$nav.length || !$clip.length) {
        return;
    }

    function getMaxOffset() {
        return Math.max(0, $nav[0].scrollWidth - $clip[0].clientWidth);
    }

    function applyOffset(newOffset) {
        var max = getMaxOffset();
        offset = Math.max(0, Math.min(newOffset, max));
        $nav[0].style.transform = 'translateX(-' + offset + 'px)';
        updateArrows();
    }

    function updateArrows() {
        var overflows = getMaxOffset() > 0;
        $outer.toggleClass('has-overflow', overflows);
        if (overflows) {
            $prev.prop('disabled', offset <= 0);
            $next.prop('disabled', offset >= getMaxOffset() - 1);
        }
    }

    function scrollTabIntoView(tabId) {
        var $tab = $('#nav-' + tabId);
        if (!$tab.length) return;
        var tabLeft  = $tab[0].offsetLeft;
        var tabRight = tabLeft + $tab[0].offsetWidth;
        var clipW    = $clip[0].clientWidth;
        if (tabLeft < offset) {
            applyOffset(tabLeft);
        } else if (tabRight > offset + clipW) {
            applyOffset(tabRight - clipW);
        }
    }

    $prev.on('click', function () {
        applyOffset(offset - Math.round($clip[0].clientWidth * 0.6));
    });

    $next.on('click', function () {
        applyOffset(offset + Math.round($clip[0].clientWidth * 0.6));
    });

    $(window).on('resize', function () {
        applyOffset(offset);
    });
    updateArrows();

    // ── Tab switching ──
    function switchBlock(tabId) {
        var $link = $('#nav-' + tabId);
        if (!$link.length) return;
        $('.admin-layout-title-link').removeClass('active');
        $link.addClass('active');
        $('.admin-layout-block').removeClass('active');
        $('#block-' + tabId).addClass('active');
    }

    function activateTab(tabId) {
        scrollTabIntoView(tabId);
        switchBlock(tabId);
    }

    $('.admin-layout-title-link').on('click', function (e) {
        e.preventDefault();
        activateTab($(this).attr('id').replace('nav-', ''));
    });

    $(document).on('click', '[data-goto-tab]', function (e) {
        e.preventDefault();
        var tabId = $(this).data('goto-tab');
        scrollTabIntoView(tabId);
        setTimeout(function () {
            switchBlock(tabId);
        }, 320);
    });

    // Activate initial tab
    var $firstActive = $('.admin-layout-title-link.active');
    if ($firstActive.length) {
        activateTab($firstActive.attr('id').replace('nav-', ''));
    }
});
