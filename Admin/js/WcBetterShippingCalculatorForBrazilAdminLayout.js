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
    sideContainer.style.width = '400px';
    sideContainer.style.minWidth = '200px';
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

    tables.forEach((table, idx) => {
      // Monta o slug do subTitle igual ao href/hash
      const subtitleSlug = tabLinks[idx].textContent.replace(/\s+/g, '-').toLowerCase();
      const descId = 'woo_better_calc_title_' + subtitleSlug + '-description';
      const descDiv = document.getElementById(descId);
      if (descDiv && !table.querySelector('.lkn-description-row')) {
        //Cria o tr / td só se ainda não foi inserido
        const tr = document.createElement('tr');

        const th = document.createElement('th');
        th.className = 'titledesc wooBetterCustomTitle';
        th.setAttribute('scope', 'row');
        const label = document.createElement('label');
        label.setAttribute('for', descId);
        const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
        const capitalizedSubtitleSlug = capitalize(subtitleSlug);
        label.textContent = capitalizedSubtitleSlug
        th.appendChild(label);

        const td = document.createElement('td');
        td.className = 'forminp';
        td.appendChild(descDiv);

        tr.appendChild(th);
        tr.appendChild(td);

        let tbody = table.querySelector('tbody');
        if (!tbody) {
          tbody = document.createElement('tbody');
          table.appendChild(tbody);
        }
        tbody.insertBefore(tr, tbody.firstChild);
      }
    })

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
          forminp.style.border = '1px solid #dfdfdf'
          forminp.style.borderRadius = '8px';

          const titleDesc = row.querySelector('.wooBetterCustomTitle');
          if (titleDesc) {
            const pElement = document.createElement('p');
            pElement.textContent = "Use shortcodes para adicionar funcionalidades específicas em temas clássicos."
            pElement.style.fontWeight = 'normal';
            pElement.style.color = '#343B45';

            titleDesc.style.paddingLeft = '.5em';

            titleDesc.style.fontSize = '20px';
            titleDesc.appendChild(pElement);

            const customLabel = titleDesc.querySelector('label');
            if (customLabel) {

              const headerComponent = document.createElement('div');
              headerComponent.className = 'woo-forminp-header';
              headerComponent.style.minHeight = '44px';

              customLabel.style.color = '#121519'

              // Cria o <p> para o texto do label
              const headerText = document.createElement('p');
              headerText.classList.add('woo-forminp-header-text');
              headerText.style.fontWeight = 'bold';
              headerText.style.color = '#121519';
              headerText.style.paddingLeft = '6px';

              headerText.textContent = customLabel.textContent.trim();

              // Cria o <span> logo abaixo do <hr>
              const spanElement = document.createElement('span');
              spanElement.textContent = "Shortcodes são úteis para temas que não utilizam o editor de blocos Gutenberg."

              spanElement.style.color = '#343B45'; // Cinza suave
              spanElement.style.fontSize = '0.9em';
              spanElement.style.paddingLeft = '6px';

              // Cria o <hr> com uma linha cinza clara
              const hrElement = document.createElement('hr');
              hrElement.style.border = 'none';
              hrElement.style.borderTop = '1px solid #ddd'; // Linha cinza clara
              hrElement.style.margin = '8px 0';

              // Adiciona os elementos na ordem correta
              headerComponent.appendChild(headerText);
              headerComponent.appendChild(spanElement);
              headerComponent.appendChild(hrElement);

              // Cria o componente woo-forminp-body
              const bodyComponent = document.createElement('div');
              bodyComponent.className = 'woo-forminp-body';
              bodyComponent.style.display = 'flex';
              bodyComponent.style.flexDirection = 'column';
              bodyComponent.style.justifyContent = 'center';
              bodyComponent.style.padding = '20px 0px';
              bodyComponent.style.minHeight = '50px';
              bodyComponent.style.paddingLeft = '6px';

              while (forminp.firstChild) {
                bodyComponent.appendChild(forminp.firstChild);
              }

              forminp.innerHTML = ''; // Limpa o conteúdo original
              forminp.appendChild(headerComponent);
              forminp.appendChild(bodyComponent);
            }
          }

          let inputField = forminp.querySelector('input, select, textarea');
          let labelElement = ''
          if (inputField) {
            const headerComponent = document.createElement('div');
            headerComponent.className = 'woo-forminp-header';
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
              headerText.style.color = '#121519';
              headerText.style.paddingLeft = '6px';

              if (inputField.getAttribute('data-subtitle')) {
                headerText.textContent = inputField.getAttribute('data-subtitle');
              } else {
                headerText.textContent = labelElement.textContent.trim();
              }


              // Cria o <span> logo abaixo do <hr>
              const spanElement = document.createElement('span');

              if (inputField.getAttribute('data-title-description')) {
                spanElement.textContent = inputField.getAttribute('data-title-description');
              }

              spanElement.style.color = '#343B45'; // Cinza suave
              spanElement.style.fontSize = '0.9em';
              spanElement.style.paddingLeft = '6px';

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
            bodyComponent.style.minHeight = '50px';
            bodyComponent.style.paddingLeft = '6px';

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

            if (inputField.id.includes('postcode_current_style')) {
              // Cria a div que conterá o input, botão e texto
              const containerDiv = document.createElement('div');
              containerDiv.classList.add('woo-better-container-current-style');

              // Cria a div para agrupar o input com ícone e o botão
              const inputButtonGroup = document.createElement('div');
              inputButtonGroup.classList.add('woo-better-input-button-group-current-style');

              // Cria a div para o input e o ícone
              const inputWrapper = document.createElement('div');
              inputWrapper.classList.add('woo-better-input-wrapper-current-style');

              const styleComponents = {
                'woo_better_calc_cart_input_background_color_field': 'backgroundColor',
                'woo_better_calc_cart_input_color_field': 'color',
                'woo_better_calc_cart_input_border_width': 'borderWidth',
                'woo_better_calc_cart_input_border_style': 'borderStyle',
                'woo_better_calc_cart_input_border_color_field': 'borderColor',
                'woo_better_calc_cart_input_border_radius': 'borderRadius'
              };

              const placeholderInput = document.getElementById('woo_better_calc_cart_input_placeholder');

              // Cria o input de texto
              const textInput = document.createElement('input');
              textInput.type = 'text';
              textInput.id = 'woo_better_calc_cart_input_current_style_postcode_fake_custom';
              textInput.placeholder = placeholderInput ? placeholderInput.value : 'Insira seu CEP';
              textInput.classList.add('woo-better-input-current-style');
              textInput.style.cursor = 'pointer';
              textInput.readOnly = true; // Somente leitura

              // Adiciona o evento de clique
              textInput.addEventListener('click', function (e) {
                e.preventDefault(); // Evita o comportamento padrão
                e.stopPropagation(); // Impede a propagação do evento

                // Seleciona o elemento de destino
                const targetElement = document.getElementById('woo_better_calc_cart_input_background_color_field_input');

                if (targetElement) {
                  // Faz o scroll suave até o componente
                  targetElement.scrollIntoView({
                    behavior: 'smooth', // Animação suave
                    block: 'center' // Centraliza o elemento na tela
                  });
                }
              });

              // Aplica os valores de estilo dos campos ao textInput
              Object.keys(styleComponents).forEach(componentId => {
                const styleProperty = styleComponents[componentId];
                const controlElement = document.getElementById(componentId);

                if (controlElement && controlElement.value) {
                  // Aplica o valor do controle ao estilo do textInput
                  textInput.style[styleProperty] = controlElement.value;
                }
              });

              const radioOptions = document.querySelectorAll('input[name="woo_better_calc_cart_input_icon"]');

              // Cria o ícone
              const icon = document.createElement('img');
              icon.src = WCBetterCalcIcons['transit']; // Define um ícone padrão da variável global
              icon.alt = 'Ícone padrão';
              icon.classList.add('woo-better-icon-current-style');
              icon.classList.add('woo-better-input-icon');

              // Seleciona o dropdown de cor
              const colorSelect = document.getElementById('woo_better_calc_cart_input_icon_color');

              if (colorSelect) {
                // Adiciona um evento para atualizar a classe do ícone com base na cor selecionada
                colorSelect.addEventListener('change', function () {
                  const selectedColor = colorSelect.value; // Obtém o valor selecionado no dropdown

                  // Seleciona todos os elementos com a classe 'woo-better-icon-current-style'
                  const icons = document.querySelectorAll('.woo-better-input-icon');

                  icons.forEach(icon => {
                    // Remove todas as classes de cor existentes
                    icon.classList.remove('black-icon', 'white-icon', 'red-icon', 'pink-icon', 'green-icon', 'blue-icon');

                    // Adiciona a classe correspondente à cor selecionada
                    icon.classList.add(selectedColor);
                  });
                });

                // Define a classe inicial com base no valor padrão do select
                icon.classList.add(colorSelect.value);
              }

              // Adiciona o ícone ao DOM (adicione ao local desejado)
              const iconContainer = document.querySelector('.woo-better-input-wrapper-current-style'); // Ajuste o seletor conforme necessário
              if (iconContainer) {
                iconContainer.appendChild(icon);
              }

              // Atualiza o ícone dinamicamente com base na seleção do radio
              if (radioOptions.length > 0) {
                radioOptions.forEach(option => {
                  option.addEventListener('change', function () {
                    const selectedValue = option.value;

                    // Verifica se o valor selecionado existe na variável global
                    if (WCBetterCalcIcons[selectedValue]) {
                      icon.src = WCBetterCalcIcons[selectedValue]; // Atualiza o src do ícone
                      icon.alt = selectedValue; // Atualiza o alt do ícone
                    }
                  });

                  // Define o ícone inicial com base no radio selecionado por padrão
                  if (option.checked && WCBetterCalcIcons[option.value]) {
                    icon.src = WCBetterCalcIcons[option.value];
                    icon.alt = option.value;
                  }
                });
              }

              // Adiciona o input e o ícone ao wrapper
              inputWrapper.appendChild(textInput);
              inputWrapper.appendChild(icon);

              const buttonStyleComponents = {
                'woo_better_calc_cart_button_background_color_field': 'backgroundColor',
                'woo_better_calc_cart_button_color_field': 'color',
                'woo_better_calc_cart_button_border_width': 'borderWidth',
                'woo_better_calc_cart_button_border_style': 'borderStyle',
                'woo_better_calc_cart_button_border_color_field': 'borderColor',
                'woo_better_calc_cart_button_border_radius': 'borderRadius'
              };

              // Cria o botão
              const button = document.createElement('button');
              button.textContent = 'CONSULTAR';
              button.classList.add('woo-better-button-current-style');

              // Aplica os valores de estilo dos campos ao botão
              Object.keys(buttonStyleComponents).forEach(componentId => {
                const styleProperty = buttonStyleComponents[componentId];
                const controlElement = document.getElementById(componentId);

                if (controlElement && controlElement.value) {
                  // Aplica o valor do controle ao estilo do botão
                  button.style[styleProperty] = controlElement.value;
                }
              });

              button.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const targetElement = document.getElementById('woo_better_calc_cart_button_background_color_field_input');

                if (targetElement) {
                  // Faz o scroll suave até o componente
                  targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                  });
                }
              });

              // Adiciona o inputWrapper e o botão ao grupo
              inputButtonGroup.appendChild(inputWrapper);
              inputButtonGroup.appendChild(button);

              // Adiciona o grupo ao container
              containerDiv.appendChild(inputButtonGroup);

              // Cria o texto "Não sei meu CEP"
              const linkText = document.createElement('p');
              linkText.textContent = 'Não sei meu CEP';
              linkText.classList.add('woo-better-link-current-style');

              // Adiciona o texto ao container
              containerDiv.appendChild(linkText);

              // Insere a div antes do inputField
              inputField.parentNode.insertBefore(containerDiv, inputField);

              // Remove o inputField original
              inputField.remove();
            }

            if (inputField.id.includes('color_field')) {
              // Cria o campo de cor
              const colorField = document.createElement('input');
              colorField.type = 'color';
              colorField.id = inputField.id + '_input';
              colorField.name = inputField.name + '_input';
              colorField.className = 'woo-better-color-field';
              colorField.value = inputField.value || '#000000';

              // Sincroniza o valor do campo de cor com o inputField (campo de texto)
              colorField.addEventListener('input', function () {
                inputField.value = colorField.value; // Preenche o valor hexadecimal no campo de texto
              });

              // Cria a div pai para agrupar o inputField e o description
              const parentDiv = document.createElement('div');
              parentDiv.className = 'woo-better-color-wrapper';
              parentDiv.style.display = 'flex';
              parentDiv.style.alignItems = 'center';
              parentDiv.style.flexDirection = 'row';
              parentDiv.style.flexWrap = 'wrap';
              parentDiv.style.gap = '10px';

              // Verifica se existe um elemento com a classe 'description' próximo ao inputField
              const descriptionElement = inputField.nextElementSibling;


              if (descriptionElement && descriptionElement.classList.contains('description')) {
                descriptionElement.style.fontSize = '16px';
                descriptionElement.style.margin = '0';
                parentDiv.appendChild(descriptionElement);
              }

              // Insere a div pai antes do inputField no DOM
              inputField.parentNode.insertBefore(parentDiv, inputField);

              // Move o inputField para dentro da div pai
              parentDiv.appendChild(inputField);

              // Insere o campo de cor antes do inputField dentro da div pai
              parentDiv.insertBefore(colorField, descriptionElement || inputField);

              inputField.style.display = 'none'; // Esconde o inputField original
            }

            // Define relação entre mais de um componente em um bloco
            const targetComponentCartNames = {
              'woo_better_min_free_shipping_value': 'woo_better_enable_min_free_shipping',
              'woo_better_hidden_cart_address': 'woo_better_calc_cep_required',
              'woo_better_calc_cart_input_border_width': 'woo_better_calc_cart_input_background_color_field',
              'woo_better_calc_cart_input_color_field': 'woo_better_calc_cart_input_background_color_field',
              'woo_better_calc_cart_input_border_style': 'woo_better_calc_cart_input_background_color_field',
              'woo_better_calc_cart_input_border_color_field': 'woo_better_calc_cart_input_background_color_field',
              'woo_better_calc_cart_input_border_radius': 'woo_better_calc_cart_input_background_color_field',
              'woo_better_calc_cart_button_color_field': 'woo_better_calc_cart_button_background_color_field',
              'woo_better_calc_cart_button_border_width': 'woo_better_calc_cart_button_background_color_field',
              'woo_better_calc_cart_button_border_style': 'woo_better_calc_cart_button_background_color_field',
              'woo_better_calc_cart_button_border_color_field': 'woo_better_calc_cart_button_background_color_field',
              'woo_better_calc_cart_button_border_radius': 'woo_better_calc_cart_button_background_color_field',
              'woo_better_calc_cart_input_icon': 'woo_better_calc_cart_input_placeholder',
              'woo_better_calc_cart_input_icon_color': 'woo_better_calc_cart_input_placeholder'
            };

            forminp.innerHTML = ''; // Limpa o conteúdo original
            forminp.appendChild(headerComponent);
            forminp.appendChild(bodyComponent);

            if (inputField.name && targetComponentCartNames[inputField.name]) {
              const recieveComponentname = targetComponentCartNames[inputField.name];
              const recieveComponent = document.querySelector(`[name="${recieveComponentname}"]`);
              if (recieveComponent) {
                const forminpRecieveBody = recieveComponent.closest('.woo-forminp-body');
                if (forminpRecieveBody) {
                  bodyComponent.style.minHeight = 'auto'
                  forminp.style.padding = '0px';
                  forminp.style.margin = '0px';
                  forminp.style.paddingTop = '15px'
                  forminp.style.marginTop = '10px';
                  forminp.style.border = 'none';
                  forminp.style.marginLeft = '-6px';

                  forminpRecieveBody.appendChild(forminp);
                  row.remove()
                }
              }
            }
          }
        }
      });
    });

    const styleComponents = {
      'woo_better_calc_cart_input_background_color_field_input': { property: 'background-color', default: '#ffffff' },
      'woo_better_calc_cart_input_color_field_input': { property: 'color', default: '#2C3338' },
      'woo_better_calc_cart_input_border_width': { property: 'border-width', default: '1px' },
      'woo_better_calc_cart_input_border_style': { property: 'border-style', default: 'solid' },
      'woo_better_calc_cart_input_border_color_field_input': { property: 'border-color', default: '#ccc' },
      'woo_better_calc_cart_input_border_radius': { property: 'border-radius', default: '4px' }
    };

    // Lista de unidades CSS válidas
    const validInputCssUnits = ['px', '%', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax', 'cm', 'mm', 'in', 'pt', 'pc', 'ex', 'ch'];

    // Seleciona o componente principal que será estilizado
    const targetComponent = document.getElementById('woo_better_calc_cart_input_current_style_postcode_fake_custom');

    if (targetComponent) {
      // Itera sobre os controles de estilo
      Object.keys(styleComponents).forEach(componentId => {
        const { property, default: defaultValue } = styleComponents[componentId];
        const controlElement = document.getElementById(componentId);

        if (controlElement) {
          // Adiciona um evento de input ou change para atualizar os estilos dinamicamente
          controlElement.addEventListener('change', function () {
            const value = controlElement.value;

            // Verifica se o controle é do tipo texto e se o valor está no formato correto
            if (controlElement.type === 'text') {
              const regex = new RegExp(`^\\d+(\\.\\d+)?(${validInputCssUnits.join('|')})$`);
              if (!regex.test(value)) {
                controlElement.value = defaultValue; // Reverte para o valor padrão
                targetComponent.style.setProperty(property, defaultValue, 'important'); // Aplica o valor padrão
                return;
              }
            }

            // Aplica o estilo no componente principal com !important
            targetComponent.style.setProperty(property, value, 'important');
          });

          // Aplica o valor padrão inicial ao componente
          targetComponent.style.setProperty(property, defaultValue, 'important');
        }
      });
    }

    const buttonStyleComponents = {
      'woo_better_calc_cart_button_background_color_field_input': { property: 'background-color', default: '#0073aa' },
      'woo_better_calc_cart_button_color_field_input': { property: 'color', default: '#ffffff' },
      'woo_better_calc_cart_button_border_width': { property: 'border-width', default: '1px' },
      'woo_better_calc_cart_button_border_style': { property: 'border-style', default: 'none' },
      'woo_better_calc_cart_button_border_color_field_input': { property: 'border-color', default: 'transparent' },
      'woo_better_calc_cart_button_border_radius': { property: 'border-radius', default: '4px' }
    };

    const validCssButtonUnits = ['px', '%', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax', 'cm', 'mm', 'in', 'pt', 'pc', 'ex', 'ch'];

    // Seleciona o botão que será estilizado
    const targetButton = document.querySelector('.woo-better-button-current-style');

    if (targetButton) {
      // Itera sobre os controles de estilo
      Object.keys(buttonStyleComponents).forEach(componentId => {
        const { property, default: defaultValue } = buttonStyleComponents[componentId];
        const controlElement = document.getElementById(componentId);

        if (controlElement) {
          // Adiciona um evento de input ou change para atualizar os estilos dinamicamente
          controlElement.addEventListener('change', function () {
            const value = controlElement.value;

            // Verifica se o controle é do tipo texto e se o valor está no formato correto
            if (controlElement.type === 'text') {
              const regex = new RegExp(`^\\d+(\\.\\d+)?(${validCssButtonUnits.join('|')})$`);
              if (!regex.test(value)) {
                controlElement.value = defaultValue; // Reverte para o valor padrão
                targetButton.style.setProperty(property, defaultValue, 'important'); // Aplica o valor padrão
                return;
              }
            }

            // Aplica o estilo no botão com !important
            targetButton.style.setProperty(property, value, 'important');
          });
        }
      });
    }

    const placeholderInput = document.getElementById('woo_better_calc_cart_input_placeholder');

    // Seleciona o componente de texto
    const textInput = document.getElementById('woo_better_calc_cart_input_current_style_postcode_fake_custom');

    if (placeholderInput && textInput) {
      // Adiciona o evento change ao componente de placeholder
      placeholderInput.addEventListener('change', function () {
        const placeholderValue = placeholderInput.value;

        // Atualiza o placeholder do componente de texto
        textInput.placeholder = placeholderValue;
      });
    }

    const iconMap = {
      'transit': WCBetterCalcIcons['transit'],
      'bill': WCBetterCalcIcons['bill'],
      'truck': WCBetterCalcIcons['truck'],
      'postcode': WCBetterCalcIcons['postcode'],
      'zipcode': WCBetterCalcIcons['zipcode']
    };

    // Seleciona todos os inputs do tipo radio pelo atributo name
    const radioOptions = document.querySelectorAll('input[name="woo_better_calc_cart_input_icon"]');

    if (radioOptions.length > 0) {
      radioOptions.forEach(option => {
        const value = option.value;

        if (iconMap[value]) {
          // Cria o elemento de imagem
          const img = document.createElement('img');
          img.src = iconMap[value];
          img.alt = value;
          img.style.width = '40px';
          img.style.height = '40px';
          img.style.marginLeft = '10px';
          img.classList.add('woo-better-input-icon');
          const colorSelect = document.getElementById('woo_better_calc_cart_input_icon_color');
          img.classList.add(colorSelect ? colorSelect.value : 'black-icon'); // Adiciona a classe de cor inicial

          // Remove o texto do label e adiciona a imagem
          const label = option.closest('label');
          if (label) {
            label.textContent = ''; // Remove o texto
            label.appendChild(option); // Reinsere o input radio
            label.appendChild(img); // Adiciona a imagem
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.setProperty('margin', '14px 0', 'important');
          }
        }
      });
    }

    const targetIds = [
      'woo_better_calc_cart_input_background_color_field',
      'woo_better_calc_cart_button_background_color_field',
      'woo_better_calc_cart_input_placeholder'
    ];

    // Itera sobre os IDs
    targetIds.forEach(id => {
      const targetElement = document.getElementById('woo_better_calc_cart_input_current_style_postcode_fake_custom'); // Componente de destino fixo

      if (targetElement) {
        // Encontra o elemento pai com a classe .woo-forminp-body
        const parentForminpBody = document.getElementById(id)?.closest('.woo-forminp-body');

        if (parentForminpBody) {
          // Cria o link
          const link = document.createElement('a');
          link.href = `#woo_better_calc_cart_input_current_style_postcode_fake_custom`; // Aponta para o ID do componente
          link.textContent = `Ir para o componente de CEP`;

          // Estiliza o link
          link.style.display = 'flex';
          link.style.color = '#0073aa';
          link.style.textDecoration = 'none';
          link.style.width = 'fit-content';
          link.style.outline = 'none';
          link.style.boxShadow = 'none';

          // Adiciona o evento de clique para a animação de movimento
          link.addEventListener('click', function (e) {
            e.preventDefault(); // Evita o comportamento padrão do link

            // Faz o scroll suave até o componente
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });

            // Adiciona um destaque temporário ao componente
            targetElement.style.transition = 'box-shadow 0.3s ease';
            targetElement.style.boxShadow = '0 0 10px 2px #0073aa';

            // Remove o destaque após 1 segundo
            setTimeout(() => {
              targetElement.style.boxShadow = 'none';
            }, 1000);
          });

          // Cria o elemento <td>
          const td = document.createElement('td');
          td.style.padding = '0px';
          td.appendChild(link); // Adiciona o link dentro do <td>

          // Adiciona o <td> ao final do .woo-forminp-body
          parentForminpBody.appendChild(td);
        }
      }
    });

    // Seleciona o input color
    const colorPicker = document.getElementById('woo_better_calc_cart_input_icon_color_field_input'); // Substitua pelo ID correto do input color

    if (colorPicker) {
      // Adiciona um evento para atualizar o filtro do ícone com base na cor selecionada
      colorPicker.addEventListener('input', function () {
        const selectedColor = colorPicker.value; // Obtém o valor hexadecimal da cor selecionada

        const icon = document.querySelector('.woo-better-icon-current-style'); // Seleciona o ícone

        if (icon) {
          // Gera o filtro com base na cor selecionada
          const filter = generateFilter(selectedColor);

          console.log('Filtro gerado:', filter);

          // Aplica o filtro ao ícone
          icon.style.filter = filter;
        }
      });
    }

    // Função para gerar o filtro CSS com base no valor hexadecimal
    function generateFilter(hex) {
      const rgb = hexToRgb(hex);

      // Ajusta os valores para o filtro
      const r = rgb.r / 255;
      const g = rgb.g / 255;
      const b = rgb.b / 255;

      // Filtro ajustado para transformar preto em outras cores
      return `brightness(0) saturate(100%) invert(${calculateInvert(r, g, b)}) sepia(1) saturate(7458%) hue-rotate(${calculateHue(rgb)}deg) brightness(${calculateBrightness(r, g, b)}) contrast(1.05)`;
    }

    // Função para calcular o valor de invert com base nos valores RGB
    function calculateInvert(r, g, b) {
      console.log('Valores RGB:', r, g, b);

      // Ajusta o valor de invert para aproximar a cor desejada
      const invertValue = 0.9 + (r - Math.min(r, g, b)) / 2; // Usa a mesma fórmula de calculateBrightness

      console.log('Valor de invert calculado (decimal):', invertValue);

      // Converte para um valor percentual e adiciona o símbolo '%'
      return `${(invertValue * 10).toFixed(0)}%`; // Retorna o valor em porcentagem como string
    }

    // Função para calcular o brilho com base nos valores RGB
    function calculateBrightness(r, g, b) {
      // Ajusta o brilho para considerar todos os tons, com mais peso para vermelho e verde
      const brightnessValue = 0.9 + (0.6 * r + 0.3 * g + 0.1 * b); // Dá mais peso ao vermelho e verde
      return brightnessValue * 2;
    }

    // Função para converter hexadecimal em RGB
    function hexToRgb(hex) {
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;

      return { r, g, b };
    }

    // Função para calcular o hue com base nos valores RGB
    function calculateHue({ r, g, b }) {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);

      let hue = 0;

      if (max === min) {
        hue = 0; // Sem cor
      } else if (max === r) {
        hue = (60 * ((g - b) / (max - min)) + 360) % 360;
      } else if (max === g) {
        hue = (60 * ((b - r) / (max - min)) + 120) % 360;
      } else if (max === b) {
        hue = (60 * ((r - g) / (max - min)) + 240) % 360;
      }

      return hue;
    }

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