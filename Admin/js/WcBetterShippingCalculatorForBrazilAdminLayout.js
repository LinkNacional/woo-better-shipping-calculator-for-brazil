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
    mainContainer.style.gap = '20px';

    // Conteúdo principal (tabs/tabelas)
    const contentContainer = document.createElement('div');
    contentContainer.className = 'lkn-settings-content';
    contentContainer.style.flex = '1';
    contentContainer.style.minWidth = '500px';
    contentContainer.style.boxSizing = 'border-box';

    // Lateral (logo/empresa)
    const sideContainer = document.createElement('div');
    sideContainer.className = 'lkn-settings-side';
    sideContainer.style.display = 'flex';
    sideContainer.style.flexDirection = 'column';
    sideContainer.style.minWidth = '400px';
    sideContainer.style.alignItems = 'center';
    sideContainer.style.justifyContent = 'flex-start';
    sideContainer.style.padding = '32px 16px';
    sideContainer.style.boxSizing = 'border-box';

    const settingsCard = document.querySelector('#WooBetterLinkSettingsCard');
    if (settingsCard) {
      settingsCard.style.display = 'block'
      // Move o componente para o sideContainer
      sideContainer.appendChild(settingsCard);
    }

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
      table.style.width = '100%';

      const ths = table.querySelectorAll('th');
      ths.forEach(th => {
        th.style.paddingTop = '68px';
      })

      const rows = table.querySelectorAll('tr'); // Busca todas as linhas da tabela
      rows.forEach(row => {
        // Lógica para '.forminp'
        const forminp = row.querySelector('.forminp');
        if (forminp) {
          forminp.style.display = 'flex'
          forminp.style.flexDirection = 'column';
          forminp.style.width = 'auto'
          forminp.style.padding = '15px 25px';
          forminp.style.backgroundColor = '#fff';
          forminp.style.borderRadius = '8px';

          let inputField = forminp.querySelector('input, select, textarea');
          let labelElement = ''
          if (inputField) {
            const headerComponent = document.createElement('div');
            headerComponent.className = 'woo-forminp-header';
            headerComponent.style.paddingLeft = '4px';
            headerComponent.style.minHeight = '44px';

            // Lógica para '.titledesc'
            const titleDesc = row.querySelector('.titledesc');
            if (titleDesc) {
              const tipElement = titleDesc.querySelector('.woocommerce-help-tip');
              if (tipElement) {
                tipElement.remove();
              }

              const pElement = document.createElement('p');
              pElement.style.fontWeight = 'normal';
              pElement.style.color = '#343B45';

              if (inputField.getAttribute('data-desc-tip')) {
                pElement.textContent = inputField.getAttribute('data-desc-tip');
              }

              titleDesc.style.paddingLeft = '.5em';

              // Insere o labelText no header
              labelElement = titleDesc.querySelector('label');
              if (!labelElement) {
                if (titleDesc.textContent && titleDesc.textContent !== '') {
                  labelElement = document.createElement('label');
                  labelElement.setAttribute('for', inputField.id || '');
                  labelElement.textContent = titleDesc.textContent;
                  titleDesc.replaceChildren(labelElement)
                }
              }

              titleDesc.style.fontSize = '20px';
              titleDesc.appendChild(pElement);
            }

            if (labelElement) {

              labelElement.style.color = '#121519'

              // Cria o <p> para o texto do label
              const headerText = document.createElement('p');
              headerText.classList.add('woo-forminp-header-text');
              headerText.style.fontWeight = 'bold';
              headerText.style.color = '#121519'

              headerText.textContent = labelElement.textContent.trim();

              // Cria o <span> logo abaixo do <hr>
              const spanElement = document.createElement('span');

              if (inputField.getAttribute('data-title-description')) {
                spanElement.textContent = inputField.getAttribute('data-title-description');
              }

              spanElement.style.color = '#343B45'; // Cinza suave
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
            bodyComponent.style.display = 'flex';
            bodyComponent.style.flexDirection = 'column';
            bodyComponent.style.justifyContent = 'center';
            bodyComponent.style.padding = '20px 0px';
            bodyComponent.style.minHeight = '136px';
            bodyComponent.style.paddingLeft = '4px';

            const descriptionField = inputField.closest('fieldset')?.querySelector('p.description');
            if (descriptionField) {
              descriptionField.remove()
            }

            const pDescriptionField = document.createElement('p');
            pDescriptionField.className = 'description';
            pDescriptionField.style.color = '#8F8F8F';

            if (inputField.getAttribute('data-description')) {
              pDescriptionField.textContent = inputField.getAttribute('data-description');
            }

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
              inputField.style.color = '#2C3338'
              bodyComponent.appendChild(inputField);
            } else if (inputField.tagName.toLowerCase() === 'input' && (inputField.type === 'checkbox' || inputField.type === 'radio')) {
              const fieldSetField = inputField.closest('fieldset');
              if (fieldSetField) {
                bodyComponent.appendChild(fieldSetField);
              } else {
                bodyComponent.appendChild(inputField);
              }
            } else {
              bodyComponent.appendChild(inputField);
            }

            bodyComponent.appendChild(pDescriptionField);


            const targetComponentNames = {
              'woo_better_min_free_shipping_value': 'woo_better_enable_min_free_shipping',
              'woo_better_hidden_cart_address': 'woo_better_calc_cep_required'
            };

            forminp.innerHTML = ''; // Limpa o conteúdo original
            forminp.appendChild(headerComponent);
            forminp.appendChild(bodyComponent);

            if (inputField.name && targetComponentNames[inputField.name]) {
              const recieveComponentname = targetComponentNames[inputField.name];
              const recieveComponent = document.querySelector(`[name="${recieveComponentname}"]`);
              if (recieveComponent) {
                const forminpRecieveBody = recieveComponent.closest('.woo-forminp-body');
                if (forminpRecieveBody) {
                  bodyComponent.style.minHeight = 'auto'
                  forminp.style.padding = '15px 0px'
                  forminp.style.marginTop = '10px';
                  forminpRecieveBody.appendChild(forminp);
                  row.remove()
                }
              }
            }
          }
        }
      });

      // Monta o slug do subTitle igual ao href/hash
      const subtitleSlug = tabLinks[idx].textContent.replace(/\s+/g, '-').toLowerCase();
      const descId = 'woo_better_calc_title_' + subtitleSlug + '-description';
      const descDiv = document.getElementById(descId);
      if (descDiv && !table.querySelector('.lkn-description-row')) {
        //Cria o tr / td só se ainda não foi inserido
        const tr = document.createElement('tr');
        tr.className = 'lkn-description-row';
        tr.appendChild(descDiv);
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