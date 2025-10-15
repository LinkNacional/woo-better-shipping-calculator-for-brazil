document.addEventListener('DOMContentLoaded', function () {
    // Função para criar e inserir o checkbox abaixo da div pai do componente de CEP
    function insertCustomCheckboxBelowPostcode(type) {
        // type: 'shipping' ou 'billing'
        const postcodeInput = document.getElementById(`${type}-postcode`);
        if (!postcodeInput) return;
        const parentDiv = postcodeInput.parentNode;
        const checkboxId = `wc-better-checkbox-${type}`;

        // Verifica se já existe o checkbox
        if (parentDiv.parentNode.querySelector(`#${checkboxId}`)) return;

        const clonedCheckbox = document.createElement('div');
        clonedCheckbox.className = 'wc-block-components-checkbox wc-block-checkout__use-address-for-shipping wc-better';

        const checkboxLabel = document.createElement('label');
        checkboxLabel.setAttribute('for', checkboxId);

        const checkboxInput = document.createElement('input');
        checkboxInput.id = checkboxId;
        checkboxInput.className = 'wc-block-components-checkbox__input';
        checkboxInput.type = 'checkbox';
        checkboxInput.setAttribute('aria-invalid', 'false');
        checkboxInput.checked = true;

        const checkboxSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        checkboxSvg.setAttribute('class', 'wc-block-components-checkbox__mark');
        checkboxSvg.setAttribute('aria-hidden', 'true');
        checkboxSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        checkboxSvg.setAttribute('viewBox', '0 0 24 20');

        const checkboxPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        checkboxPath.setAttribute('d', 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');

        checkboxSvg.appendChild(checkboxPath);

        const checkboxText = document.createElement('span');
        checkboxText.className = 'wc-block-components-checkbox__label';
        checkboxText.textContent = 'Sem número (S/N)';

        checkboxLabel.appendChild(checkboxInput);
        checkboxLabel.appendChild(checkboxSvg);
        checkboxLabel.appendChild(checkboxText);
        clonedCheckbox.appendChild(checkboxLabel);

        // Insere o checkbox abaixo da div pai do componente de CEP
        if (parentDiv.nextSibling) {
            parentDiv.parentNode.insertBefore(clonedCheckbox, parentDiv.nextSibling);
        } else {
            parentDiv.parentNode.appendChild(clonedCheckbox);
        }
    }
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
            const countrySelect = document.getElementById(`${baseId}-country`);
            if (countrySelect) {
                const countryParentDiv = countrySelect.parentNode;
                // Move o campo de postcode para baixo da div pai do campo country
                if (countryParentDiv.nextSibling) {
                    countryParentDiv.parentNode.insertBefore(divComponent, countryParentDiv.nextSibling);
                } else {
                    countryParentDiv.parentNode.appendChild(divComponent);
                }
                insertCustomCheckboxBelowPostcode(baseId);
                divComponent.style.marginBottom = '20px';
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
});