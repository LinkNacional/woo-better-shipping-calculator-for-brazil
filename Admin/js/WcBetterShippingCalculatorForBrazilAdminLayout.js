(function ($) {
  $(window).on('load', function () {
    const mainForm = document.querySelector('#mainform');
    if (!mainForm) return;
    // Seleciona todas as tabelas e títulos dinamicamente
    const tables = Array.from(mainForm.querySelectorAll('table.form-table'));
    const subTitles = Array.from(mainForm.querySelectorAll('h2'));
    if (!tables.length || !subTitles.length) return;

    const mainContainer = document.createElement('div');
    mainContainer.style.display = 'flex';
    mainContainer.style.flexWrap = 'wrap';
    mainContainer.style.boxSizing = 'border-box';
    mainContainer.style.marginTop = '40px';

    // Conteúdo principal (tabs/tabelas)
    const contentContainer = document.createElement('div');
    contentContainer.style.flex = '1';
    contentContainer.style.paddingRight = '32px';
    contentContainer.style.boxSizing = 'border-box';

    // Lateral (logo/empresa)
    const sideContainer = document.createElement('div');
    sideContainer.style.flex = '0 0 30%';
    sideContainer.style.minWidth = '30%';
    sideContainer.style.display = 'flex';
    sideContainer.style.flexDirection = 'column';
    sideContainer.style.alignItems = 'center';
    sideContainer.style.justifyContent = 'flex-start';
    sideContainer.style.background = '#f7f7f7';
    sideContainer.style.borderRadius = '8px';
    sideContainer.style.padding = '32px 16px';
    sideContainer.style.minHeight = '400px';
    sideContainer.style.boxSizing = 'border-box';

    // Exemplo de conteúdo lateral
    sideContainer.innerHTML = `
      <img src="https://placehold.co/120x120?text=Logo" alt="Logo" style="margin-bottom: 24px; border-radius: 50%;">
      <h2 style="margin: 0 0 12px 0; font-size: 1.3em;">Sua Empresa</h2>
      <p style="color: #555; text-align: center;">Exemplo de texto institucional ou informações de contato.<br>Adapte como quiser!</p>
    `;

    mainContainer.appendChild(contentContainer);
    mainContainer.appendChild(sideContainer);

    subTitles.forEach(h2 => contentContainer.appendChild(h2));
    tables.forEach(table => contentContainer.appendChild(table));

    const submitContent = mainForm.querySelector('.submit');
    if (submitContent) {
      submitContent.before(mainContainer);
    }

    // Cria o menu de tabs
    const tabMenu = document.createElement('div');
    tabMenu.className = 'lkn-settings-tabs';
    tabMenu.style.height = '40px';
    const tabLinks = [];

    subTitles.forEach((subTitle, idx) => {
      const tab = document.createElement('a');
      tab.textContent = subTitle.textContent;
      tab.href = '#' + subTitle.textContent.replace(/\s+/g, '-').toLowerCase();
      tab.className = 'nav-tab';
      tab.onclick = (e) => {
        e.preventDefault();
        tabLinks.forEach((el, i) => {
          el.className = i === idx ? 'nav-tab nav-tab-active' : 'nav-tab';
        });
        showTable(idx);
        // Atualiza o hash da URL
        window.location.hash = tab.hash;
      };
      tabMenu.appendChild(tab);
      tabLinks.push(tab);
      subTitle.remove();
    });

    // Ativa a primeira tab
    tabLinks[0].className = 'nav-tab nav-tab-active';

    // Insere o menu de tabs antes da primeira tabela
    tables[0].parentNode.insertBefore(tabMenu, tables[0]);

    tables.forEach((table, idx) => {
      table.style.width = 'auto';

      const rows = table.querySelectorAll('tr'); // Busca todas as linhas da tabela
      rows.forEach(row => {
        // Lógica para '.titledesc'
        const titleDesc = row.querySelector('.titledesc');
        if (titleDesc) {
          const pElement = document.createElement('p');
          titleDesc.style.paddingLeft = '.5em';
          titleDesc.appendChild(pElement);

          const tipElement = titleDesc.querySelector('.woocommerce-help-tip');
          if (tipElement) {
            const contentElement = tipElement.getAttribute('aria-label');
            if (contentElement) {
              pElement.textContent = contentElement;
              tipElement.remove();
            }
          }
        }

        // Lógica para '.forminp'
        const forminp = row.querySelector('.forminp');
        if (forminp) {
          const inputFields = forminp.querySelectorAll('input, select, textarea');
          inputFields.forEach(inputField => {
            const headerComponent = document.createElement('div');
            headerComponent.className = 'woo-forminp-header';

            // Insere o labelText no header
            let labelElement = titleDesc.querySelector('label');
            if (!labelElement) {
              labelElement = titleDesc;
            }
            if (labelElement) {
              const labelText = labelElement.textContent?.trim();

              // Cria o <p> para o texto do label
              const headerText = document.createElement('p');
              headerText.textContent = labelText;

              // Cria o <span> logo abaixo do <hr>
              const spanElement = document.createElement('span');
              spanElement.textContent = 'Descrição adicional aqui'; // Substitua pelo texto desejado
              spanElement.style.color = '#888'; // Cinza suave
              spanElement.style.fontSize = '0.9em';

              // Cria o <hr> com uma linha cinza clara
              const hrElement = document.createElement('hr');
              hrElement.style.border = 'none';
              hrElement.style.borderTop = '1px solid #ddd'; // Linha cinza clara
              hrElement.style.margin = '8px 0';

              // Adiciona os elementos na ordem correta
              headerComponent.appendChild(headerText);
              headerComponent.appendChild(spanElement);
              headerComponent.appendChild(hrElement);
            }

            // Cria o componente woo-forminp-body
            const bodyComponent = document.createElement('div');
            bodyComponent.className = 'woo-forminp-body';

            // Move o input para o body
            if (
              (inputField.tagName.toLowerCase() === 'input' && (inputField.type === 'text' || inputField.type === 'number')) ||
              inputField.tagName.toLowerCase() === 'select' ||
              inputField.tagName.toLowerCase() === 'textarea'
            ) {
              // Aplica os estilos apenas para input (texto ou número), select e textarea
              inputField.style.width = '100%';
              inputField.style.maxWidth = '400px';
              inputField.style.boxSizing = 'border-box';
            }
            bodyComponent.appendChild(inputField);

            // Insere os componentes no forminp
            forminp.innerHTML = ''; // Limpa o conteúdo original
            forminp.appendChild(headerComponent);
            forminp.appendChild(bodyComponent);
          });
        }
      });

      // Monta o slug do subTitle igual ao href/hash
      const subtitleSlug = tabLinks[idx].textContent.replace(/\s+/g, '-').toLowerCase();
      const descId = 'woo_better_calc_title_' + subtitleSlug + '-description';
      const descDiv = document.getElementById(descId);
      if (descDiv && !table.querySelector('.lkn-description-row')) {
        // Cria o tr/td só se ainda não foi inserido
        const tr = document.createElement('tr');
        tr.className = 'lkn-description-row';
        const td = document.createElement('td');
        td.colSpan = 2;
        td.appendChild(descDiv);
        tr.appendChild(td);
        let tbody = table.querySelector('tbody');
        if (!tbody) {
          tbody = document.createElement('tbody');
          table.appendChild(tbody);
        }
        tbody.insertBefore(tr, tbody.firstChild);
      }
    });

    // Função para mostrar/esconder tabelas dinamicamente
    function showTable(activeIdx) {
      tables.forEach((table, idx) => {
        table.style.display = idx === activeIdx ? 'table' : 'none';
      });
    }
    showTable(0);

    // Suporte ao hash na URL para abrir a tab correta
    const urlHash = window.location.hash;
    if (urlHash) {
      const idx = tabLinks.findIndex(a => a.href.endsWith(urlHash));
      if (idx >= 0) tabLinks[idx].click();
    }


  });
})(jQuery);