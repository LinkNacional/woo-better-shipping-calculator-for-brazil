/**
 * Ordem canônica dos campos INJETADOS no formulário de endereço do checkout em
 * blocos (CPF/CNPJ → Empresa → RG → IE → IM).
 *
 * ─── Por que este módulo existe ────────────────────────────────────────────────
 * Cada campo é montado por um bundle SEPARADO, com o seu próprio
 * `MutationObserver` em `document.body`. Todos eles reposicionavam o seu campo com
 * a mesma regra frágil:
 *
 *     if (meuCampo.previousElementSibling !== ancora) ancora.insertAdjacentElement(...)
 *
 * Isso só é verdadeiro para UM campo: quando dois (ou três) resolvem a MESMA
 * âncora, cada um empurra o outro para fora da posição e o próximo observer move
 * de volta — ping-pong infinito e síncrono. Era exatamente o que travava o
 * checkout ao desmarcar "usar o mesmo endereço para cobrança" (RG e IE caindo
 * ambos no container do `#billing_document` quando a Empresa está desabilitada e
 * o RG ainda não existe; IE e IM idem). A aba ficava sem responder e o consumo de
 * memória disparava (cada movimento cria nós/mutation records).
 *
 * A regra aqui é a mesma ideia, mas com posição TOTAL:
 *   • cada campo tem um antecessor ÚNICO na cadeia (Empresa → RG → IE → IM);
 *   • a checagem é "o primeiro campo NOSSO depois do antecessor sou eu?", que
 *     ignora inputs hidden (CPF/CNPJ/persontype do Tipo de Pessoa) e campos
 *     nativos do WooCommerce entre eles;
 *   • nunca move entre containers diferentes (o reposicionamento por troca de
 *     cobrança/entrega é responsabilidade de quem cria o campo).
 *
 * Com isso o conjunto converge para a ordem da cadeia e para de se mover.
 */

/**
 * Cadeia de campos, do primeiro para o último. A posição de cada campo é "logo
 * depois do anterior que existir".
 *
 * @type {string[]}
 */
export const FIELD_CHAIN = ['document', 'company', 'rg', 'ie', 'im'];

/** Seletor do container de cada campo (nossos containers são globais). */
const CONTAINER_SELECTOR = {
    document: '.wc-better-billing-document',
    company: '.wc-better-billing-company',
    rg: '.wc-better-billing-rg',
    ie: '.wc-better-billing-ie',
    im: '.wc-better-billing-im',
};

/**
 * Retorna o container de um campo da cadeia, dentro do formulário de endereço.
 *
 * @param {Element} container `#billing` / `#shipping`.
 * @param {string}  key       Chave na {@link FIELD_CHAIN}.
 * @param {string}  context   'billing' | 'shipping' (para o campo nativo Empresa).
 * @returns {Element|null}
 */
export function chainField(container, key, context) {
    if (!container) {
        return null;
    }

    const own = container.querySelector(CONTAINER_SELECTOR[key]);
    if (own) {
        return own;
    }

    // A Empresa pode ser o campo NATIVO do WooCommerce (modo "Desabilitado"/
    // "Dinâmico" sem campo nosso): ele também faz parte da cadeia.
    if (key === 'company') {
        const native = container.querySelector('#' + context + '-company');
        return native ? native.closest('.wc-block-components-text-input') : null;
    }

    return null;
}

/**
 * Antecessor canônico de um campo: o último campo da cadeia que EXISTE antes
 * dele. `null` quando nenhum existe (aí não há como posicionar — não mexe).
 *
 * @param {Element} container `#billing` / `#shipping`.
 * @param {string}  key       Chave do campo que se quer posicionar.
 * @param {string}  context   'billing' | 'shipping'.
 * @returns {Element|null}
 */
export function chainAnchor(container, key, context) {
    const index = FIELD_CHAIN.indexOf(key);

    if (index <= 0) {
        return null;
    }

    for (let i = index - 1; i >= 0; i -= 1) {
        const field = chainField(container, FIELD_CHAIN[i], context);
        if (field) {
            return field;
        }
    }

    return null;
}

/**
 * O elemento é um campo NOSSO da cadeia?
 *
 * @param {Element} element
 * @returns {boolean}
 */
function isChainField(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE || !element.classList) {
        return false;
    }

    return FIELD_CHAIN.some((key) => element.classList.contains(
        CONTAINER_SELECTOR[key].replace('.', '')
    ));
}

/**
 * O campo já está na posição canônica?
 *
 * "Na posição" = caminhando a partir do antecessor, o PRIMEIRO campo nosso
 * encontrado é este. Inputs hidden (persontype/CPF/CNPJ) e campos nativos ficam
 * entre eles sem invalidar a posição — era o que fazia o campo se mover a cada
 * mutação sem necessidade.
 *
 * @param {Element} container `#billing` / `#shipping`.
 * @param {string}  key       Chave do campo.
 * @param {Element} node      Container do campo.
 * @param {string}  context   'billing' | 'shipping'.
 * @returns {boolean}
 */
export function isChainFieldPlaced(container, key, node, context) {
    const anchor = chainAnchor(container, key, context);

    if (!anchor) {
        return true;
    }

    let sibling = anchor.nextElementSibling;

    while (sibling) {
        if (sibling === node) {
            return true;
        }
        if (isChainField(sibling)) {
            return false;
        }
        sibling = sibling.nextElementSibling;
    }

    return false;
}

/**
 * Garante a posição canônica do campo (idempotente).
 *
 * Só move quando: existe antecessor, o campo NÃO está na posição e ambos estão no
 * MESMO container (nunca arrasta o campo de cobrança para entrega ou vice-versa).
 *
 * @param {Element} container `#billing` / `#shipping`.
 * @param {string}  key       Chave do campo.
 * @param {Element} node      Container do campo.
 * @param {string}  context   'billing' | 'shipping'.
 * @returns {boolean} `true` quando reposicionou.
 */
export function placeChainField(container, key, node, context) {
    if (!container || !node || node.parentElement !== container) {
        return false;
    }

    if (isChainFieldPlaced(container, key, node, context)) {
        return false;
    }

    const anchor = chainAnchor(container, key, context);

    if (!anchor) {
        return false;
    }

    anchor.insertAdjacentElement('afterend', node);

    return true;
}
