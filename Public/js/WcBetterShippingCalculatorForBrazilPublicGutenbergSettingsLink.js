function insertSettingsLink() {
    let submitBlockFound = false
    const submitBlock = document.querySelector('.wc-block-cart__submit');

    if (!submitBlock) {
        submitBlockFound = false;
        return;
    }

    // Garante que o elemento existe e evita duplicação do link
    if (submitBlock && typeof lknCartData !== 'undefined' && !submitBlock.querySelector('.lkn-settings-link') && !submitBlockFound) {
        submitBlockFound = true;
        const link = document.createElement('a');
        link.href = lknCartData.settingsUrl;
        link.textContent = 'Ir para Configurações da Calculadora de Frete';
        link.className = 'lkn-settings-link';
        link.style.marginTop = '10px';
        link.style.display = 'block';
        link.style.color = '#0073aa';
        link.style.textDecoration = 'none';

        submitBlock.appendChild(link);
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