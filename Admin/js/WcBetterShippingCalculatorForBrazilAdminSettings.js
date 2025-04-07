document.addEventListener('DOMContentLoaded', function () {
    const saveButton = document.querySelector('p.submit');
    if (saveButton) {
        const div = document.createElement('div');
        div.innerHTML = `
            <p>
                Avalie nosso plugin
                <a href="https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews" target="_blank">★★★★★</a>.
                Quer conhecer mais sobre nossos plugins ou tirar alguma dúvida? Acesse:
                <a href="https://www.linknacional.com.br/wordpress" target="_blank">Link Nacional</a>.
            </p>
        `;
        // Inserir abaixo do <p class="submit">
        saveButton.insertAdjacentElement('afterend', div);
    }
});