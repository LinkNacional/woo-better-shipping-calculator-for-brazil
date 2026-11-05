/**
 * Pop-up de compra da licença PRO.
 *
 * Máquina de estados simples, sem framework: o markup já traz todos os passos,
 * este script só troca `data-step` e conversa com a API de cobrança.
 *
 *   email (e-mail + meio) -> pix | card -> (pix: pix-wait) -> fulfilling
 *         -> ready -> tasks
 *
 *   A operadora não é perguntada: o par meio->PSP é fixo (Pix na Rede, cartão
 *   na Cielo) e quem decide é o plugin. Perguntar "qual PSP?" era uma escolha
 *   que o lojista não tinha como fazer bem — e enquanto o meio e o PSP eram
 *   passos separados, dava para pedir Pix na Cielo.
 *
 * Três regras que valem a pena estar escritas:
 *
 *  1. Falha de rede NÃO é pagamento recusado. Só `card_declined` (402) diz
 *     "cartão recusado"; todo o resto é "tente de novo".
 *  2. Depois de aprovado, o polling continua até a licença chegar. Pagamento
 *     aprovado com falha nossa não volta atrás — a tela tenta de novo.
 *  3. O número do cartão nunca é guardado nem logado aqui. Ele sai daqui para
 *     a API e o campo é limpo em seguida.
 */
(function () {
    'use strict';

    var config = window.lknBilling;
    if (!config) return;

    var root = document.getElementById('lkn-billing-modal');
    if (!root) return;

    /**
     * Ordem dos passos, só para saber a DIREÇÃO da transição.
     *
     * Avançar anima da direita para a esquerda; voltar, ao contrário. Sem essa
     * ordem a animação seria sempre igual e o "Voltar" pareceria avançar.
     */
    var STEP_ORDER = [
        'email',
        'pix',
        'card',
        'pix-wait',
        'fulfilling',
        'ready',
        // As três etapas finais (instalar/ativar/configurações) ocupam uma tela
        // só, depois do recibo.
        'tasks',
    ];

    /** Passos que não voltam sozinhos. */
    var POLL_MS = 3000;
    var MAX_POLL = 200; // ~10 min: Pix expira bem antes disso.

    /**
     * Meio de pagamento -> operadora que o processa.
     *
     * Lida do próprio botão (`data-lkn-provider`, renderizado pelo PHP). Antes
     * era um mapa fixo aqui dentro — e o mapa mente na primeira troca de PSP
     * (foi o que aconteceu quando a Rede saiu: o Pix continuava mandando
     * `rede`). O botão já declara a operadora para o `applyGateways`; usar a
     * mesma fonte para cobrar evita as duas versões discordarem.
     */
    function providerOf(method) {
        var button = q('[data-lkn-method="' + method + '"]');

        return button ? button.getAttribute('data-lkn-provider') : null;
    }

    var state = {
        step: 'email',
        checkoutId: null,
        /** `pix` | `card`: escolhido na PRIMEIRA tela, junto do e-mail. */
        method: null,
        /** `cielo`: derivado do meio (hoje é o único PSP). */
        provider: null,
        /** Gateways que a API informou estarem habilitados nesta instalação. */
        gateways: [],
        /** Valor cobrado, em centavos (para o recibo do fim). */
        amountCents: null,
        /** Parcelas escolhidas: 1 = à vista. */
        installments: 1,
        licenseKey: null,
        downloadUrl: null,
        polling: false,
        pollCount: 0,
    };

    // ── Atalhos de DOM ─────────────────────────────────────────────────────

    function q(selector) {
        return root.querySelector(selector);
    }

    function all(selector) {
        return Array.prototype.slice.call(root.querySelectorAll(selector));
    }

    // ── Passos ─────────────────────────────────────────────────────────────

    function stepIndex(name) {
        var index = STEP_ORDER.indexOf(name);

        return index === -1 ? 0 : index;
    }

    function reducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    /**
     * Mostra só um passo. `escopo` permite aplicar num clone (as faces do giro).
     */
    function aplicarPasso(step, escopo) {
        var secoes = escopo
            ? Array.prototype.slice.call(escopo.querySelectorAll('[data-step-name]'))
            : secoesReais();

        secoes.forEach(function (section) {
            section.hidden = section.getAttribute('data-step-name') !== step;
        });

        // Cada passo abre no TOPO. O corpo tem rolagem própria e ela sobrevive
        // à troca: quem rolou o passo do cartão (o mais alto) chegava no passo
        // seguinte já rolado, com o recibo escondido acima da área visível.
        var corpo = (escopo || document).querySelector('.lkn-billing__body');

        if (corpo) corpo.scrollTop = 0;
    }

    /**
     * Seções do card de verdade — sem as cópias que vivem dentro das faces.
     */
    function secoesReais() {
        return all('[data-step-name]').filter(function (section) {
            return ! section.closest('.lkn-billing__face');
        });
    }

    /**
     * Foco no primeiro campo do passo: teclado e leitor de tela seguem o fluxo.
     * `preventScroll` porque o pop-up é fixo.
     */
    function focarPrimeiro() {
        var first = null;

        secoesReais().forEach(function (section) {
            if (section.hidden || first) return;

            first = section.querySelector('input, select, button');
        });

        if (first && typeof first.focus === 'function') {
            first.focus({ preventScroll: true });
        }
    }

    /**
     * Monta uma face do giro: uma cópia do card com o passo pedido à mostra.
     *
     * A cópia é decoração — fica `inert`, sem `id` e sem os ganchos `data-lkn-*`
     * —, então nada nela pode receber clique, foco ou virar alvo do JS.
     */
    function montarFace(passo, lado, sentido) {
        var face = document.createElement('div');
        face.className = 'lkn-billing__face lkn-billing__face--' + lado + ' lkn-billing__face--' + sentido;
        face.setAttribute('aria-hidden', 'true');
        face.setAttribute('inert', '');

        var copia = q('.lkn-billing__dialog').cloneNode(true);

        copia.classList.remove('lkn-billing__dialog--escondido');
        face.appendChild(copia);

        if (passo) aplicarPasso(passo, copia);

        // `data-step-name` fica (a face é reaproveitada no meio do giro); o
        // resto dos ganchos sai.
        Array.prototype.forEach.call([ copia ].concat(Array.prototype.slice.call(copia.querySelectorAll('*'))), function (el) {
            Array.prototype.slice.call(el.attributes).forEach(function (attr) {
                if ('id' === attr.name || 'for' === attr.name || 0 === attr.name.indexOf('aria-') || 0 === attr.name.indexOf('data-lkn-')) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        return face;
    }

    /**
     * Troca de passo girando o card UMA VOLTA INTEIRA (360°), em 3D.
     *
     * Girar um elemento só mostraria o verso do conteúdo — texto espelhado — na
     * metade do caminho, e esconder o verso com `backface-visibility: hidden`
     * deixaria metade do giro com a tela vazia. Por isso são DUAS faces, 180°
     * defasadas: enquanto uma dá as costas, a outra está de frente. Nunca há um
     * quadro sem card e nunca aparece conteúdo espelhado.
     *
     * Cada face é um card completo (mesmo tamanho, mesma sombra), então o que
     * gira é o card, não só o conteúdo.
     *
     * ── Uma volta, e não duas ──────────────────────────────────────────────
     *
     * A troca de conteúdo é de graça aqui: a face que carrega o passo novo já
     * nasce com ele e entra só na segunda metade (o CSS a segura em -90°, de
     * perfil, durante o `animation-delay`). Nada de cronômetro para adivinhar
     * o instante — não há instante nenhum para acertar.
     *
     * 360° não serve para trocar de tela: uma volta inteira mostra a FRENTE
     * duas vezes (no começo e aos 180°), então o conteúdo chega no meio do
     * caminho, gira para longe e chega de novo no fim. O olho lê duas voltas.
     * Meia-volta (0° -> 90° -> 180°) tem uma chegada só.
     */
    function animateCard(step, direction, animar) {
        var card = q('.lkn-billing__dialog');

        // SEM giro quando não há troca de tela: abrir o pop-up, repintar o
        // mesmo passo, ou quem pediu menos animação.
        //
        // A regra é "o passo mudou?", e não "tem alguma seção à mostra?": a
        // seção do e-mail nasce visível no HTML, então o card girava à toa ao
        // abrir — uma volta inteira mostrando a MESMA tela, que se lê como
        // animação gratuita antes do primeiro clique.
        if (!card || !animar || reducedMotion()) {
            aplicarPasso(step);
            focarPrimeiro();
            return;
        }

        // Giro anterior interrompido (clique duplo): limpa antes de começar.
        all('.lkn-billing__face').forEach(function (face) {
            face.remove();
        });

        card.classList.remove('lkn-billing__dialog--escondido');

        var sentido = 'back' === direction ? 'voltar' : 'avancar';

        // A face da frente sai com o passo atual; a de trás já nasce com o
        // passo novo — ela só aparece na segunda metade, quando a primeira já
        // está de perfil. O conteúdo, então, troca sozinho, sem cronômetro.
        var frente = montarFace(null, 'frente', sentido);
        var verso = montarFace(step, 'verso', sentido);

        // O card de verdade sai de cena (sem sair do layout, para o pop-up não
        // mudar de lugar) e as duas faces ocupam o mesmo lugar.
        card.classList.add('lkn-billing__dialog--escondido');
        root.appendChild(frente);
        root.appendChild(verso);

        /**
         * Tempo total do giro, lido do CSS.
         *
         * A duração e o atraso da segunda metade moram no CSS; repetir os
         * números aqui era pedir para saírem de sincronia na primeira mexida.
         */
        function duracaoDoGiro() {
            var estilo = getComputedStyle(verso);
            var duracao = parseFloat(estilo.animationDuration) || 0;
            var atraso = parseFloat(estilo.animationDelay) || 0;

            return (duracao + atraso) * 1000;
        }

        function terminar() {
            if (!frente) return;

            frente.remove();
            verso.remove();
            frente = null;
            card.classList.remove('lkn-billing__dialog--escondido');

            aplicarPasso(step);
            focarPrimeiro();
        }

        // `animationend` sobe dos filhos (tique, barras): filtra pelo alvo. Quem
        // fecha o giro é a SEGUNDA metade (a face de trás) — a primeira para
        // de perfil. O `setTimeout` é rede de segurança se o evento não vier.
        verso.addEventListener('animationend', function (event) {
            if (event.target === verso) terminar();
        }, { once: true });

        setTimeout(terminar, duracaoDoGiro() + 150);
    }

    function show(step, options) {
        var anterior = state.step;

        // Voltando para a primeira tela, o "Continuar" precisa refletir o que
        // já está preenchido (não reabilitar nem bloquear por engano).
        if ('email' === step) refreshContinue();

        state.step = step;

        // Tela pós-pagamento SEMPRE com o recibo preenchido. Preencher é
        // idempotente e barato; deixar isso só no `afterPaid` fazia o caminho
        // do polling (Pix) chegar aqui com a tabela vazia e `hidden`.
        if ('ready' === step || 'tasks' === step) renderReceipt();

        var direcao =
            (options && options.direction) ||
            (stepIndex(step) < stepIndex(anterior) ? 'back' : 'forward');

        var body = q('.lkn-billing__body');
        if (body) body.setAttribute('data-step', step);

        // Gira só quando o passo realmente muda. Repintar o mesmo passo (ao
        // reabrir o pop-up, por exemplo) não é transição nenhuma.
        animateCard(step, direcao, step !== anterior);
    }

    function open() {
        root.hidden = false;
        document.documentElement.classList.add('lkn-billing-is-open');
        clearAlert();
        refreshContinue();
        show(state.checkoutId ? state.step : 'email');
    }

    function close() {
        state.polling = false;
        root.hidden = true;
        document.documentElement.classList.remove('lkn-billing-is-open');
    }

    // ── Avisos ─────────────────────────────────────────────────────────────

    function showAlert(message) {
        var box = q('[data-lkn-alert]');

        if (!box) return;

        box.textContent = message;
        box.hidden = false;

        // O aviso mora no TOPO do corpo, que rola por conta própria: erro
        // exibido fora da área visível é o mesmo que erro nenhum.
        var corpo = q('.lkn-billing__body');

        if (corpo) corpo.scrollTop = 0;
    }

    function clearAlert() {
        var box = q('[data-lkn-alert]');

        if (!box) return;

        box.textContent = '';
        box.hidden = true;
    }

    /**
     * Rótulo do botão.
     *
     * Alguns botões têm o tique DENTRO deles (as etapas finais). Escrever em
     * `textContent` apagaria o SVG, então o texto mora num `<span>` e é nele que
     * a gente mexe quando ele existe.
     */
    function setLabel(button, text) {
        if (!button) return;

        var span = button.querySelector('[data-lkn-btn-label]');

        if (span) {
            span.textContent = text;
            return;
        }

        button.textContent = text;
    }

    function getLabel(button) {
        var span = button ? button.querySelector('[data-lkn-btn-label]') : null;

        return span ? span.textContent : (button ? button.textContent : '');
    }

    function busy(button, isBusy, label) {
        if (!button) return;

        if (isBusy) {
            button.dataset.originalLabel = getLabel(button);
            setLabel(button, label || '…');
            button.disabled = true;
            button.classList.add('is-busy');
        } else {
            setLabel(button, button.dataset.originalLabel || getLabel(button));
            button.disabled = false;
            button.classList.remove('is-busy');
        }
    }

    // ── HTTP ───────────────────────────────────────────────────────────────

    /**
     * Chama a API de cobrança.
     *
     * Devolve `{ok, status, data}` e nunca lança por erro de negócio: o
     * chamador decide o que fazer com o `code`.
     */
    function api(path, body) {
        var options = {
            method: body === undefined ? 'GET' : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-lkn-free-token': config.freeToken,
            },
            credentials: 'omit',
        };

        if (body !== undefined) options.body = JSON.stringify(body);

        return fetch(config.apiUrl + path, options)
            .then(function (response) {
                return response
                    .json()
                    .catch(function () {
                        return {};
                    })
                    .then(function (data) {
                        return { ok: response.ok, status: response.status, data: data };
                    });
            })
            .catch(function () {
                // Falha de rede: `status: 0` é o sinal de "não sei o que houve".
                return { ok: false, status: 0, data: {} };
            });
    }

    /**
     * Junta a base do REST com o caminho, sem barra dupla.
     *
     * `config.restUrl` já vem sem barra no fim, mas a junção é feita aqui
     * também: uma barra dupla (`/lkn-billing/v1//install`) faz o WordPress
     * responder `rest_no_route`, e o erro aparece como 404 em vez de "rota
     * errada" — já aconteceu.
     */
    function restPath(path) {
        return String(config.restUrl || '').replace(/\/+$/, '') + '/' + String(path).replace(/^\/+/, '');
    }

    /** Chama o WordPress (instalar/ativar licença). */
    function wpRest(path, body) {
        return fetch(restPath(path), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-WP-Nonce': config.nonce,
            },
            credentials: 'same-origin',
            body: JSON.stringify(body || {}),
        })
            .then(function (response) {
                return response
                    .json()
                    .catch(function () {
                        return {};
                    })
                    .then(function (data) {
                        return { ok: response.ok, status: response.status, data: data };
                    });
            })
            .catch(function () {
                return { ok: false, status: 0, data: {} };
            });
    }

    /** Mensagem para o cliente a partir do `code` da API. */
    function messageFor(result) {
        var error = (result && result.data && result.data.error) || {};
        var code = error.code || '';

        // Falha de transporte (`status: 0`): a requisição nem chegou ao servidor
        // — rede, CORS ou página https chamando uma API http. Dizer "tente de
        // novo" manda a pessoa tentar algo que não vai funcionar.
        if (result && result.status === 0) return config.i18n.offlineError;

        if (code === 'rate_limited') return config.i18n.rateLimited;
        if (code === 'card_declined') return error.detail || config.i18n.genericError;
        if (code === 'unknown_product' || code === 'unknown_checkout') return config.i18n.setupError;
        if (code === 'invalid_client' || code === 'unauthorized') return config.i18n.setupError;
        if (code === 'invalid_email') return config.i18n.emailInvalid;
        if (code === 'invalid_tax_id') return config.i18n.taxIdInvalid;
        if (code === 'invalid_name') return config.i18n.nameInvalid;
        if (code === 'invalid_card' || code === 'invalid_card_number') return config.i18n.cardInvalid;
        if (code === 'invalid_cvv') return config.i18n.cvvInvalid;
        if (code === 'invalid_holder') return config.i18n.holderInvalid;
        if (code === 'invalid_expiry') return config.i18n.expiryInvalid;

        return config.i18n.genericError;
    }

    // ── Passo 1: e-mail ────────────────────────────────────────────────────

    /** O e-mail digitado tem cara de e-mail? (usado só para liberar o botão) */
    function emailIsValid() {
        var email = String((q('[data-lkn-email]') || {}).value || '').trim();

        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    }

    /**
     * Libera o "Continuar" só com e-mail válido E um meio escolhido.
     *
     * Antes o botão estava sempre ativo e o erro aparecia depois do clique: a
     * pessoa descobria o que faltava no susto. Desabilitado, o botão mostra o
     * requisito antes de qualquer tentativa.
     */
    function refreshContinue() {
        var button = q('[data-lkn-go="start"]');

        if (!button) return;

        button.disabled = ! (emailIsValid() && state.method);
    }

    function startCheckout(button) {
        var email = String((q('[data-lkn-email]') || {}).value || '').trim();

        if (!emailIsValid()) {
            showAlert(config.i18n.emailInvalid);
            return;
        }

        if (!state.method) {
            showAlert(config.i18n.chooseMethodRequired);
            return;
        }

        clearAlert();
        busy(button, true);

        api('/v1/billing/checkout/create', { product: config.product, email: email })
            .then(function (result) {
                busy(button, false);

                if (!result.ok) {
                    showAlert(messageFor(result));
                    return;
                }

                state.checkoutId = result.data.checkout_id;

                // O valor NÃO aparece mais no cabeçalho: ele só é mostrado
                // depois de pago, no recibo. Guardar aqui é o que permite isso.
                state.amountCents = result.data.amount_cents || null;
                state.installments = 1;

                if (! applyGateways(result.data.gateways)) return;

                show('card' === state.method ? 'card' : 'pix');
            });
    }

    /** Centavos -> "R$ 10,00". */
    function money(cents) {
        return 'R$ ' + (Number(cents) / 100).toFixed(2).replace('.', ',');
    }

    /**
     * Recibo: o pedido (1× produto), a parcela e o total.
     *
     * Aparece só depois de aprovado — antes do pagamento o valor é combinado
     * fora do pop-up, e mostrar preço fixo aqui daria a entender que o valor
     * final já está fechado.
     *
     * Existe em DUAS telas (a do recibo e a das etapas, onde a instalação
     * acontece), então preenche todas as cópias: quem está instalando continua
     * vendo o que comprou.
     */
    function renderReceipt(view) {
        var caixas = all('[data-lkn-receipt]');

        if (!caixas.length) return;

        if (view && view.amount_cents) state.amountCents = view.amount_cents;

        var parcelas = Number(state.installments) > 1 ? Number(state.installments) : 1;

        // Sem valor conhecido o recibo mostra travessão, mas APARECE: a tabela
        // era escondida quando faltava `amount_cents`, e um campo ausente na
        // resposta da API deixava a compra sem sumário nenhum — a pessoa pagava
        // e não via o que comprou. Recibo incompleto é melhor que recibo
        // inexistente, e o vazio fica visível em vez de silencioso.
        var desconhecido = '—';
        var condicao = desconhecido;

        if (state.amountCents) {
            condicao = parcelas > 1
                ? parcelas + 'x de ' + money(Math.round(state.amountCents / parcelas))
                : config.i18n.paidInFull;
        }

        function preencher(seletor, texto) {
            all(seletor).forEach(function (el) {
                el.textContent = texto;
            });
        }

        // Um checkout = uma licença, sempre.
        preencher('[data-lkn-receipt-name]', config.productName || config.product);
        preencher('[data-lkn-paid-amount]', state.amountCents ? money(state.amountCents) : desconhecido);
        preencher('[data-lkn-paid-terms]', condicao);

        // Total é o valor cheio da compra, parcelado ou não. O valor da linha
        // do pedido e o total coincidem à vista — e é assim mesmo: um mostra o
        // item comprado, o outro fecha a conta.
        preencher('[data-lkn-paid-total]', state.amountCents ? money(state.amountCents) : desconhecido);

        caixas.forEach(function (caixa) {
            caixa.hidden = false;
        });
    }

    // ── Meios de pagamento ─────────────────────────────────────────────────

    /**
     * Quais meios oferecer, segundo os PSPs habilitados na API.
     *
     * O plugin instalado no cliente é um `.zip` que não se atualiza sozinho: se
     * a lista morasse aqui, desabilitar um PSP no servidor exigiria atualizar
     * todos os sites. O PHP renderiza os dois botões (o texto precisa de i18n) e
     * este trecho esconde o meio cujo PSP não veio na resposta do `start`.
     *
     * Não é mais uma escolha de operadora: cada meio tem UM PSP fixo e o botão
     * do meio some se aquele PSP estiver fora.
     */
    function applyGateways(list) {
        state.gateways = Array.isArray(list) ? list.slice() : [];

        var visiveis = [];

        all('[data-lkn-method]').forEach(function (button) {
            var provider = button.getAttribute('data-lkn-provider');
            var disponivel = state.gateways.indexOf(provider) !== -1;

            button.hidden = ! disponivel;

            if (disponivel) visiveis.push(button.getAttribute('data-lkn-method'));
        });

        /*
         * A resposta do `start` é a primeira notícia sobre os PSPs, e ela chega
         * DEPOIS da escolha. Se o meio escolhido não estiver disponível, a tela
         * volta (sem mandar um `provider` que a API recusaria com
         * `unknown_provider`) e a pessoa é avisada do que aconteceu.
         */
        var indisponivel = state.method && visiveis.indexOf(state.method) === -1;

        if (indisponivel) chooseMethod(null);

        /*
         * Sobrou um meio só: marcar por ele. Não é escolha — é o único caminho,
         * e deixar em branco obrigaria a clicar no que já é obrigatório. Vale
         * também para o meio que acabou de cair (a alternativa fica escolhida).
         */
        if (! state.method && visiveis.length === 1) chooseMethod(visiveis[0]);

        if (indisponivel) {
            showAlert(config.i18n.methodUnavailable);

            return false;
        }

        return true;
    }

    /**
     * Marca o meio de pagamento escolhido na primeira tela.
     *
     * Não navega: o avanço é do "Continuar". Só grava o meio (e o PSP que ele
     * usa), pinta o botão escolhido e reavalia o botão de avançar.
     */
    function chooseMethod(id) {
        var provider = id ? providerOf(id) : null;
        var method = provider ? id : null;

        state.method = method;
        state.provider = method ? provider : null;

        all('[data-lkn-method]').forEach(function (button) {
            var selected = button.getAttribute('data-lkn-method') === method;

            button.classList.toggle('is-selected', selected);
            button.setAttribute('aria-pressed', selected ? 'true' : 'false');
        });

        clearAlert();
        refreshContinue();
    }

    // ── Passo 3a: Pix ──────────────────────────────────────────────────────

    function payPix(button) {
        var name = String((q('[data-lkn-pix-name]') || {}).value || '').trim();
        var taxId = String((q('[data-lkn-pix-tax]') || {}).value || '').replace(/\D/g, '');

        var nameParts = name.split(/\s+/).filter(Boolean);
        if (nameParts.length < 2 || name.length < 5) {
            showAlert(config.i18n.nameInvalid);
            return;
        }

        if (taxId.length !== 11 && taxId.length !== 14) {
            showAlert(config.i18n.taxIdInvalid);
            return;
        }

        clearAlert();
        busy(button, true);

        // Pix não parcela.
        state.installments = 1;

        api('/v1/billing/checkout/paypix/' + encodeURIComponent(state.checkoutId), {
            name: name,
            taxId: taxId,
            provider: state.provider,
        }).then(function (result) {
            busy(button, false);

            if (result.data && result.data.phase === 'ready') {
                afterPaid(result.data);
                return;
            }

            if (!result.ok) {
                showAlert(messageFor(result));
                return;
            }

            var pix = (result.data && result.data.pix) || {};
            var image = q('[data-lkn-qr]');
            var copy = q('[data-lkn-copy]');

            if (image && pix.qr_image) {
                image.src = /^data:/.test(pix.qr_image)
                    ? pix.qr_image
                    : 'data:image/png;base64,' + pix.qr_image;
                image.hidden = false;
            } else if (image) {
                image.hidden = true;
            }

            if (copy && pix.copy_paste) copy.value = pix.copy_paste;

            show('pix-wait');
            poll();
        });
    }

    // ── Passo 3c: cartão ───────────────────────────────────────────────────

    /**
     * Dado de cartão só trafega em https.
     *
     * Em desenvolvimento a API pode estar em `http://localhost` — e nesse caso
     * o PAN/CVV iriam em claro pela rede. É melhor recusar do que "funcionar no
     * teste": ninguém deve digitar cartão num canal sem TLS, nem por engano.
     */
    function cardChannelIsSecure() {
        return /^https:\/\//i.test(String(config.apiUrl || ''));
    }

    function payCard(button) {
        if (!cardChannelIsSecure()) {
            showAlert('O pagamento com cartão exige conexão segura (https). Use o Pix ou fale com o suporte.');
            return;
        }

        var number = String((q('[data-lkn-card-number]') || {}).value || '').replace(/\D/g, '');
        var holder = String((q('[data-lkn-card-holder]') || {}).value || '').trim();
        var expiry = String((q('[data-lkn-card-expiry]') || {}).value || '').trim();
        var cvv = String((q('[data-lkn-card-cvv]') || {}).value || '').replace(/\D/g, '');
        var installments = Number((q('[data-lkn-installments]') || {}).value || 1);

        clearAlert();
        busy(button, true);

        state.installments = installments;

        api('/v1/billing/checkout/paycard/' + encodeURIComponent(state.checkoutId), {
            installments: installments,
            provider: state.provider,
            card: { number: number, holder: holder, expiry: expiry, cvv: cvv },
        }).then(function (result) {
            busy(button, false);

            // Limpa CVV E número do DOM assim que a resposta chega: se o pop-up
            // ficar aberto na tela, o dado não fica exposto para quem passar
            // depois. O número não é reutilizável — e não deve ficar ali.
            var cvvInput = q('[data-lkn-card-cvv]');
            if (cvvInput) cvvInput.value = '';

            var numberInput = q('[data-lkn-card-number]');
            if (numberInput) numberInput.value = '';

            if (!result.ok) {
                showAlert(messageFor(result));
                return;
            }

            if (result.data && result.data.phase === 'ready') {
                afterPaid(result.data);
                return;
            }

            if (result.data && result.data.phase === 'fulfilling') {
                afterPaid(result.data);
                return;
            }

            // Aprovado mas ainda materializando: entra no mesmo polling.
            afterPaid(result.data);
        });
    }

    // ── Passo 4+: pago ─────────────────────────────────────────────────────

    function afterPaid(view) {
        if (view && view.license_key) state.licenseKey = view.license_key;
        if (view && view.download_url) state.downloadUrl = view.download_url;

        renderReceipt(view);

        if (view && view.phase === 'ready') {
            show('ready');
            return;
        }

        show('fulfilling');
        poll();
    }

    /** Polling do status. Para sozinho em `ready` ou em estado final. */
    function poll() {
        if (state.polling || !state.checkoutId) return;

        state.polling = true;
        state.pollCount = 0;

        var tick = function () {
            if (!state.polling) return;

            state.pollCount += 1;

            if (state.pollCount > MAX_POLL) {
                state.polling = false;
                showAlert(config.i18n.genericError);
                return;
            }

            api('/v1/billing/checkout/view/' + encodeURIComponent(state.checkoutId)).then(function (result) {
                if (!state.polling) return;

                if (!result.ok) {
                    // Erro de leitura não é "não pagou": tenta de novo.
                    setTimeout(tick, POLL_MS);
                    return;
                }

                var view = result.data;

                if (view.license_key) state.licenseKey = view.license_key;
                if (view.download_url) state.downloadUrl = view.download_url;

                // O recibo se preenche a CADA leitura, não só na primeira
                // resposta. Quem paga por Pix fica na tela de espera e chega no
                // `ready` por aqui: sem esta linha, a tabela do sumário ficava
                // `hidden` para sempre nesse caminho — o pagamento aprovava e a
                // pessoa não via o que comprou.
                renderReceipt(view);

                if (view.phase === 'ready') {
                    state.polling = false;
                    show('ready');
                    return;
                }

                if (view.phase === 'failed') {
                    state.polling = false;
                    showAlert(config.i18n.genericError);
                    return;
                }

                setTimeout(tick, POLL_MS);
            });
        };

        tick();
    }

    // ── Etapas finais: instalar -> ativar -> configurações ─────────────────
    //
    // As três convivem na mesma tela. Cada uma começa bloqueada e é liberada
    // pela anterior; a concluída vira um botão verde com tique, para a pessoa
    // ver o que já andou sem procurar mensagem em outro lugar.

    function taskEl(name) {
        return q('[data-lkn-task="' + name + '"]');
    }

    function taskButton(name) {
        var box = taskEl(name);

        return box ? box.querySelector('button, a') : null;
    }

    /**
     * Liga/desliga o carregamento da etapa — que mora NO FUNDO do botão.
     *
     * A classe `.is-busy` já faz o serviço todo: o preenchimento que corre é o
     * `::after` do próprio botão. Não há elemento de barra para mostrar.
     */
    function taskProgress(name, on) {
        var button = taskButton(name);

        if (!button) return;

        button.classList.toggle('is-busy', !!on);

        if (on) {
            button.classList.remove('is-done');
        }
    }

    /** Etapa em andamento: texto de progresso e barra verde. */
    function taskBusy(name, text) {
        var button = taskButton(name);

        if (!button) return;

        setLabel(button, text);
        button.disabled = true;
        button.classList.add('is-busy');
        taskProgress(name, true);
    }

    /** Etapa concluída: vira verde com tique e não clica mais. */
    function taskDone(name, text) {
        var button = taskButton(name);

        taskProgress(name, false);

        if (!button) return;

        setLabel(button, text);
        button.classList.remove('is-busy');
        button.classList.add('is-done');
        button.disabled = true;
    }

    /** Etapa que estava esperando agora pode ser usada. */
    function taskEnable(name) {
        var button = taskButton(name);

        if (!button) return;

        button.disabled = false;
        button.classList.remove('is-locked');
        button.removeAttribute('aria-disabled');
    }

    /** Falhou: devolve o botão ao normal com o texto original. */
    function taskReset(name, text) {
        var button = taskButton(name);

        taskProgress(name, false);

        if (!button) return;

        setLabel(button, text);
        button.disabled = false;
        button.classList.remove('is-busy');
    }

    function install(button) {
        // Plugin PRO já instalado (e ativo): não reinstalar por cima. O `.zip`
        // sobrescreveria a instalação existente sem necessidade — e, se a pasta
        // tiver sido renomeada pelo WordPress, criaria uma segunda cópia.
        if (config.proInstalled) {
            taskDone('install', config.i18n.pluginInstalled);
            taskEnable('activate');
            return;
        }

        clearAlert();
        taskBusy('install', config.i18n.installing);

        wpRest('/install', { download_url: state.downloadUrl }).then(function (result) {
            if (result.ok && result.data && result.data.ok) {
                taskDone('install', config.i18n.pluginInstalled);
                taskEnable('activate');
                return;
            }

            taskReset('install', config.i18n.installPlugin);

            var data = result.data || {};

            // Site sem permissão de escrita: o caminho é o .zip, que já está
            // logo abaixo do botão.
            if (data.code === 'lkn_billing_filesystem' || (data.data && data.data.manual)) {
                showAlert(data.message || config.i18n.genericError);
                return;
            }

            showAlert(data.message || config.i18n.genericError);
        });
    }

    function activate(button) {
        clearAlert();
        taskBusy('activate', config.i18n.activating);

        wpRest('/activate', { license_key: state.licenseKey }).then(function (result) {
            // A ATIVAÇÃO É O QUE CONTA. `ok` sozinho não serve: quando o PRO
            // ainda não carregou, a rota responde `{ok:true, activated:false}`
            // (só gravou a chave) — e dizer "licença ativa" ali seria mentira.
            var data = result.data || {};
            var ativou = result.ok && (data.activated === true || data.features === true);

            if (ativou) {
                taskDone('activate', config.i18n.licenseActive);
                taskEnable('settings');
                return;
            }

            taskReset('activate', config.i18n.activate);
            showAlert(data.message || config.i18n.genericError);
        });
    }

    /** Baixa o .zip sem abrir aba nova e sem perder o estado do pop-up. */
    function download() {
        if (!state.downloadUrl) {
            showAlert(config.i18n.genericError);
            return;
        }

        var link = document.createElement('a');

        link.href = state.downloadUrl;
        link.download = '';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // ── Eventos ────────────────────────────────────────────────────────────

    document.addEventListener('click', function (event) {
        var target = event.target;

        if (!(target instanceof Element)) return;

        // Botão que abre o pop-up: o card da tela de configurações. é um link
        // de verdade (funciona sem JS); com JS, o clique abre o pop-up.
        var opener = target.closest('[data-lkn-billing-open]');

        if (opener) {
            event.preventDefault();
            open();
            return;
        }

        if (!root.contains(target)) return;

        if (target.closest('[data-lkn-close]')) {
            event.preventDefault();
            close();
            return;
        }

        /*
         * Botão do meio de pagamento: só MARCA. Antes ele navegava direto e a
         * operadora era escolhida num passo anterior; agora a escolha é feita
         * aqui e quem avança é o "Continuar".
         */
        var method = target.closest('[data-lkn-method]');
        if (method) {
            event.preventDefault();
            chooseMethod(method.getAttribute('data-lkn-method'));
            return;
        }

        var go = target.closest('[data-lkn-go]');
        if (go) {
            event.preventDefault();

            var to = go.getAttribute('data-lkn-go');

            // Só o botão que ABRE o checkout tem `start`. Os "Voltar" dos
            // formulários usam `email` e são navegação pura — tratá-los como
            // `startCheckout` criava um checkout NOVO ao voltar.
            if (to === 'start') {
                startCheckout(go);
                return;
            }

            clearAlert();
            show(to);
            return;
        }

        var pay = target.closest('[data-lkn-pay]');
        if (pay) {
            event.preventDefault();

            if (pay.getAttribute('data-lkn-pay') === 'pix') {
                payPix(pay);
            } else {
                payCard(pay);
            }

            return;
        }

        var copyBtn = target.closest('[data-lkn-copy-btn]');
        if (copyBtn) {
            event.preventDefault();

            var textarea = q('[data-lkn-copy]');
            if (!textarea) return;

            textarea.select();

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textarea.value).then(function () {
                    copyBtn.textContent = config.i18n.copied;
                });
            } else {
                document.execCommand('copy');
                copyBtn.textContent = config.i18n.copied;
            }

            return;
        }

        if (target.closest('[data-lkn-download]')) {
            event.preventDefault();
            download();
            return;
        }

        // Etapa 3 bloqueada: o link existe (funciona sem JS) mas não navega
        // antes de a licença estar ativa.
        var settings = target.closest('[data-lkn-settings]');

        if (settings && settings.getAttribute('aria-disabled') === 'true') {
            event.preventDefault();
            return;
        }

        if (target.closest('[data-lkn-install]')) {
            event.preventDefault();
            install(target.closest('[data-lkn-install]'));
            return;
        }

        if (target.closest('[data-lkn-activate]')) {
            event.preventDefault();
            activate(target.closest('[data-lkn-activate]'));
        }
    });

    /*
     * O "Continuar" depende do que está digitado: sem isto ele só seria avaliado
     * ao abrir e ao clicar num meio, e o e-mail preenchido por autofill (ou
     * apagado depois) não mexia no botão.
     */
    root.addEventListener('input', function (event) {
        if (event.target && event.target.hasAttribute('data-lkn-email')) refreshContinue();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !root.hidden) close();
    });
})();
