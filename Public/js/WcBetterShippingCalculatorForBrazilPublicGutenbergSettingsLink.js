function insertSettingsLink() {
    let submitBlockFound = false
    const submitBlock = document.querySelector('.wc-block-cart__submit');
    const cartForm = document.querySelector('form.cart');

    // Verifica se pelo menos um dos elementos existe
    if (!submitBlock && !cartForm) {
        submitBlockFound = false;
        return;
    }

    // Usa o elemento que estiver disponível (prioriza submitBlock)
    const targetElement = submitBlock || cartForm;

    // Verifica se já existe o link no DOM (não apenas dentro do targetElement)
    const existingLink = document.querySelector('.lkn-settings-link');

    // Garante que o elemento existe e evita duplicação do link
    if (targetElement && typeof lknCartData !== 'undefined' && !existingLink && !submitBlockFound) {
        submitBlockFound = true;
        const link = document.createElement('a');
        link.href = lknCartData.settingsUrl;
        link.textContent = 'Ir para Configurações da Calculadora de Frete';
        link.className = 'lkn-settings-link';
        link.style.marginTop = '10px';
        link.style.display = 'block';
        link.style.color = '#0073aa';
        link.style.textDecoration = 'none';

        // Se for o cartForm, insere após o formulário; se for submitBlock, insere dentro
        if (targetElement === cartForm) {
            targetElement.parentNode.insertBefore(link, targetElement.nextSibling);
        } else {
            targetElement.appendChild(link);
        }
    }
}

// Observer para detectar alterações no DOM
const observer = new MutationObserver(() => {
    insertSettingsLink();
});

// Inicia o observer após o DOM estar pronto
document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Tenta inserir imediatamente também
    insertSettingsLink();
});