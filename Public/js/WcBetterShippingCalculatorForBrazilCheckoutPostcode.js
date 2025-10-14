document.addEventListener('DOMContentLoaded', function () {
    const observer = new MutationObserver(() => {
        const postcodeDivs = document.querySelectorAll('.wc-block-components-address-form__postcode');

        postcodeDivs.forEach(divComponent => {
            const input = divComponent.querySelector('input');
            if (!input) return;

            // Pega o id base (shipping ou billing)
            const baseId = input.id.replace('-postcode', '');
            const priorityClass = 'woo-better-priority-' + baseId;

            // Se já tem a classe, ignora
            if (divComponent.classList.contains(priorityClass)) return;

            // Adiciona a classe personalizada
            divComponent.classList.add(priorityClass);

            // Busca o componente alvo pelo id base
            const targetDiv = document.getElementById(baseId);
            if (targetDiv && targetDiv.parentNode !== divComponent.parentNode) {
                // Move o campo de postcode para cima do campo base
                targetDiv.parentNode.insertBefore(divComponent, targetDiv);
                divComponent.style.marginBottom = '20px';
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}); document.addEventListener('DOMContentLoaded', function () {
    const observer = new MutationObserver(() => {
        const postcodeDivs = document.querySelectorAll('.wc-block-components-address-form__postcode');

        postcodeDivs.forEach(divComponent => {
            const input = divComponent.querySelector('input');
            if (!input) return;

            // Pega o id base (shipping ou billing)
            const baseId = input.id.replace('-postcode', '');
            const priorityClass = 'woo-better-priority-' + baseId;

            // Adiciona a classe personalizada
            divComponent.classList.add(priorityClass);

            // Busca o componente alvo pelo id base
            const targetDiv = document.getElementById(baseId);
            if (targetDiv && targetDiv.parentNode !== divComponent.parentNode) {
                // Move o campo de postcode para cima do campo base
                targetDiv.parentNode.insertBefore(divComponent, targetDiv);
                divComponent.style.marginBottom = '20px';
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});