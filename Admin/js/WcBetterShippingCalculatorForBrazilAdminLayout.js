(function ($) {
  $(window).on('load', function () {
    const mainForm = document.querySelector('#mainform');
    if (!mainForm) return;
    // Seleciona todas as tabelas e títulos dinamicamente
    const tables = Array.from(mainForm.querySelectorAll('table.form-table'));
    const subTitles = Array.from(mainForm.querySelectorAll('h2'));
    if (!tables.length || !subTitles.length) return;

    let font_class = wcBetterCalcAjax.font_class

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

    // Função para criar uma mensagem de warning
    function createWarningMessage(text) {
      // Cria um novo <tr>
      const spacerTr = document.createElement('tr');

      // Cria um <th> vazio
      const spacerTh = document.createElement('th');
      spacerTh.className = 'lkn-woo-spacer-row';
      spacerTh.textContent = '';

      // Cria um <td> para a mensagem
      const spacerTd = document.createElement('td');
      spacerTd.style.padding = '0px';

      // Cria o elemento de mensagem
      const warningMessage = document.createElement('div');
      warningMessage.className = 'warning-message';
      warningMessage.style.display = 'flex';
      warningMessage.style.alignItems = 'center';
      warningMessage.style.padding = '10px';
      warningMessage.style.border = '1px solid #ffcc00';
      warningMessage.style.borderLeftWidth = '5px';
      warningMessage.style.borderLeftColor = '#ffcc00';
      warningMessage.style.borderRadius = '5px';
      warningMessage.style.backgroundColor = '#fff8e1';
      warningMessage.style.color = '#000';
      warningMessage.style.fontSize = '14px';
      warningMessage.style.lineHeight = '1.5';
      warningMessage.style.verticalAlign = 'top';
      warningMessage.style.marginBottom = '10px';

      // Adiciona o ícone de alerta
      const alertIcon = document.createElement('span');
      alertIcon.textContent = '⚠️'; // Ícone de alerta
      alertIcon.style.marginRight = '10px';
      alertIcon.style.fontSize = '16px';

      // Adiciona o texto da mensagem
      const messageText = document.createElement('span');
      messageText.textContent = text;

      // Adiciona o ícone e o texto ao componente de mensagem
      warningMessage.appendChild(alertIcon);
      warningMessage.appendChild(messageText);

      // Adiciona a mensagem ao <td>
      spacerTd.appendChild(warningMessage);

      // Adiciona o <th> e o <td> ao <tr>
      spacerTr.appendChild(spacerTh);
      spacerTr.appendChild(spacerTd);

      return spacerTr;
    }

    if (WCBetterCalcWooVersion.status === 'valid') {
      // Configuração indisponível para temas em blocos foi removida
    }

    // Mensagem de Warning na versão do WooCommerce
    if (WCBetterCalcWooVersion.status === 'invalid') {
      const inputElement = document.querySelector('input[name="woo_better_calc_enable_cart_page"]');
      if (inputElement) {
        // Busca o elemento <tbody> mais próximo
        const closestTbody = inputElement.closest('tbody');

        if (closestTbody) {
          const cartWarning = createWarningMessage('Personalização do campo do CEP está disponível a partir do WooCommerce 10+. Faça o download da versão mais recente para adquirir todas as novas funcionalidades.');

          // Insere o <tr> no início do <tbody>
          closestTbody.insertBefore(cartWarning, closestTbody.firstChild);
        }
      }
    }

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

    const stickyContainer = document.createElement('div');
    stickyContainer.className = 'sticky-container';
    stickyContainer.style.position = 'sticky';
    stickyContainer.style.top = '120px';
    stickyContainer.style.maxWidth = '370px';

    function createFeatureMessage(iconText, messageLines) {
      const featureMessage = document.createElement('div');
      featureMessage.className = 'custom-feature-message'; // Classe reutilizável para estilização

      // Adiciona o ícone de informação
      const infoIcon = document.createElement('span');
      infoIcon.textContent = iconText; // Ícone de informação
      infoIcon.style.marginRight = '10px';
      infoIcon.style.fontSize = '16px';

      // Adiciona o texto da mensagem
      const textContainer = document.createElement('div');
      textContainer.style.display = 'flex';
      textContainer.style.flexDirection = 'column';

      // Adiciona as linhas de texto
      messageLines.forEach(line => {
        const messageLine = document.createElement('span');
        messageLine.innerHTML = line;
        messageLine.style.marginBottom = '5px'; // Espaço entre as linhas
        textContainer.appendChild(messageLine);
      });

      // Adiciona o ícone e o texto ao componente de mensagem
      featureMessage.appendChild(infoIcon);
      featureMessage.appendChild(textContainer);

      return featureMessage;
    }

    const featureMessage1 = createFeatureMessage('✔️', [
      '<strong>ATUALIZADO:</strong> Todas as funcionalidades disponíveis no editor de blocos agora estão disponíveis no shortcode!'
    ]);

    // Cria o segundo bloco de mensagem
    const featureMessage2 = createFeatureMessage('✔️', [
      '<strong>NOVO:</strong> Campos de CPF/CNPJ e Bairro para válidação dos dados do cliente.'
    ]);

    // Cria o cartão promocional do Plugin Link de Pagamento
    const promotionalCard = document.createElement('div');
    promotionalCard.className = 'woo-better-promotional-card';
    promotionalCard.style.cssText = `
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      padding: 20px;
      margin-top: 20px;
      color: white;
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
      position: relative;
      overflow: hidden;
    `;

    // Adiciona um elemento de fundo decorativo
    const backgroundDecor = document.createElement('div');
    backgroundDecor.style.cssText = `
      position: absolute;
      top: -50px;
      right: -50px;
      width: 100px;
      height: 100px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
      pointer-events: none;
    `;
    promotionalCard.appendChild(backgroundDecor);

    // Conteúdo do cartão
    const cardContent = document.createElement('div');
    cardContent.style.position = 'relative';
    cardContent.style.zIndex = '1';

    // Título do plugin
    const cardTitle = document.createElement('h3');
    cardTitle.textContent = 'Plugin: Link de Pagamento de Faturas para WooCommerce';
    cardTitle.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: white;
      line-height: 1.3;
    `;

    // Descrição do plugin
    const cardDescription = document.createElement('p');
    cardDescription.textContent = 'O Plugin Link de Pagamento é a solução completa para o seu negócio. Com ele, é possível gerar links de pagamento, parcelar compras em múltiplos cartões, configurar cobranças recorrentes, aplicar descontos e taxas, e criar orçamentos detalhados.';
    cardDescription.style.cssText = `
      margin: 0 0 16px 0;
      font-size: 14px;
      line-height: 1.5;
      color: rgba(255,255,255,0.9);
    `;

    // Container dos botões
    const buttonsContainer = document.createElement('div');
    buttonsContainer.style.cssText = `
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    `;

    // Botão Saiba mais (sempre presente) - aparece primeiro
    const learnMoreButton = document.createElement('button');
    learnMoreButton.textContent = 'Saiba mais';
    learnMoreButton.style.cssText = `
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.3);
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    `;

    learnMoreButton.addEventListener('mouseenter', function () {
      this.style.background = 'rgba(255,255,255,0.3)';
      this.style.transform = 'translateY(-1px)';
    });

    learnMoreButton.addEventListener('mouseleave', function () {
      this.style.background = 'rgba(255,255,255,0.2)';
      this.style.transform = 'translateY(0)';
    });

    learnMoreButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      // Abre o link do plugin no WordPress.org
      window.open('https://br.wordpress.org/plugins/invoice-payment-for-woocommerce/', '_blank');
    });

    // Adiciona o botão Saiba mais ao container primeiro
    buttonsContainer.appendChild(learnMoreButton);

    // Botão Instalar (apenas se o plugin não estiver instalado) - aparece depois
    if (!wcBetterCalcAjax.invoice_plugin_installed) {
      const installButton = document.createElement('button');
      installButton.textContent = 'Instalar';
      installButton.style.cssText = `
        background: rgba(255,255,255,0.9);
        border: none;
        color: #667eea;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
      `;

      installButton.addEventListener('mouseenter', function () {
        this.style.background = 'white';
        this.style.transform = 'translateY(-1px)';
        this.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
      });

      installButton.addEventListener('mouseleave', function () {
        this.style.background = 'rgba(255,255,255,0.9)';
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = 'none';
      });

      installButton.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();

        // Usa o nonce que já está disponível no wcBetterCalcAjax
        const installUrl = `/wp-admin/update.php?action=install-plugin&plugin=${wcBetterCalcAjax.plugin_slug}&_wpnonce=${wcBetterCalcAjax.install_nonce}`;

        // Abre a página de instalação direta
        window.open(installUrl, '_blank');
      });

      // Adiciona o botão Instalar ao container por segundo
      buttonsContainer.appendChild(installButton);
    }

    // Monta o conteúdo do cartão
    cardContent.appendChild(cardTitle);
    cardContent.appendChild(cardDescription);
    cardContent.appendChild(buttonsContainer);
    promotionalCard.appendChild(cardContent);


    const settingsCard = document.querySelector('#WooBetterLinkSettingsCard');
    if (settingsCard) {
      settingsCard.style.display = 'block'

      // Move o componente para o sideContainer
      stickyContainer.appendChild(settingsCard);

      stickyContainer.appendChild(featureMessage1);
      stickyContainer.appendChild(featureMessage2);
      stickyContainer.appendChild(promotionalCard);

      sideContainer.appendChild(stickyContainer);
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

        const floatingComponent = document.querySelector('.woo-better-floating-icon-container');
        if (tab.textContent === 'Carrinho' || tab.textContent === 'Produto') {
          if (floatingComponent) {
            floatingComponent.style.display = 'flex';
          }
        } else {
          if (floatingComponent) {
            floatingComponent.style.display = 'none';
          }
        }

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
          forminp.style.boxSizing = 'border-box';

          const titleDesc = row.querySelector('.wooBetterCustomTitle');
          if (titleDesc) {
            const pElement = document.createElement('p');
            pElement.textContent = "Utilize shortcodes para adicionar funcionalidades específicas do plugin a temas clássicos."
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
              spanElement.textContent = "Shortcodes são especialmente úteis para temas clássicos que não utilizam o editor de blocos (Gutenberg)."

              spanElement.style.color = '#343B45'; // Cinza suave
              spanElement.style.fontSize = '13px';
              spanElement.style.paddingLeft = '6px';
              spanElement.style.display = 'block';

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
              spanElement.style.fontSize = '13px';
              spanElement.style.paddingLeft = '6px';
              spanElement.style.display = 'block';

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
              const styleName = inputField.id.includes('cart') ? 'cart' : 'product';
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
                [`woo_better_calc_${styleName}_input_background_color_field`]: 'backgroundColor',
                [`woo_better_calc_${styleName}_input_color_field`]: 'color',
                [`woo_better_calc_${styleName}_input_border_width`]: 'borderWidth',
                [`woo_better_calc_${styleName}_input_border_style`]: 'borderStyle',
                [`woo_better_calc_${styleName}_input_border_color_field`]: 'borderColor',
                [`woo_better_calc_${styleName}_input_border_radius`]: 'borderRadius'
              };

              const placeholderInput = document.getElementById(`woo_better_calc_${styleName}_input_placeholder`);

              // Cria o input de texto
              const textInput = document.createElement('input');
              textInput.type = 'text';
              textInput.id = `woo_better_calc_${styleName}_input_current_style_postcode_fake_custom`;
              textInput.placeholder = placeholderInput ? placeholderInput.value : 'Insira seu CEP';
              textInput.classList.add('woo-better-input-current-style');
              if (font_class) {
                textInput.classList.add(font_class);
              }
              textInput.style.cursor = 'pointer';
              textInput.readOnly = true; // Somente leitura

              // Adiciona o evento de clique
              textInput.addEventListener('click', function (e) {
                e.preventDefault(); // Evita o comportamento padrão
                e.stopPropagation(); // Impede a propagação do evento

                // Seleciona o elemento de destino
                const targetElement = document.getElementById(`woo_better_calc_${styleName}_input_background_color_field_input`);

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

              const radioOptions = document.querySelectorAll(`input[name="woo_better_calc_${styleName}_input_icon"]`);

              // Cria o ícone
              const icon = document.createElement('img');
              icon.src = WCBetterCalcIcons['transit']; // Define um ícone padrão da variável global
              icon.alt = 'Ícone padrão';
              icon.classList.add('woo-better-icon-current-style');
              icon.classList.add('woo-better-input-icon');

              // Seleciona o dropdown de cor
              const colorSelect = document.getElementById(`woo_better_calc_${styleName}_input_icon_color`);

              if (colorSelect) {
                // Adiciona um evento para atualizar a classe do ícone com base na cor selecionada
                colorSelect.addEventListener('change', function () {
                  const selectedColor = colorSelect.value; // Obtém o valor selecionado no dropdown

                  // Seleciona todos os elementos com a classe 'woo-better-icon-current-style'
                  const icons = document.querySelectorAll('.woo-better-input-icon');

                  icons.forEach(icon => {
                    // Remove todas as classes de cor existentes
                    icon.classList.remove('black-icon', 'gray-icon', 'red-icon', 'pink-icon', 'green-icon', 'blue-icon');

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
                [`woo_better_calc_${styleName}_button_background_color_field`]: 'backgroundColor',
                [`woo_better_calc_${styleName}_button_color_field`]: 'color',
                [`woo_better_calc_${styleName}_button_border_width`]: 'borderWidth',
                [`woo_better_calc_${styleName}_button_border_style`]: 'borderStyle',
                [`woo_better_calc_${styleName}_button_border_color_field`]: 'borderColor',
                [`woo_better_calc_${styleName}_button_border_radius`]: 'borderRadius'
              };

              // Cria o botão
              const button = document.createElement('button');
              button.textContent = 'CONSULTAR';
              button.id = `woo_better_calc_${styleName}_button_current_style_postcode_fake_custom`;
              button.classList.add('woo-better-button-current-style');
              if (font_class) {
                button.classList.add(font_class);
              }

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

                const targetElement = document.getElementById(`woo_better_calc_${styleName}_button_background_color_field_input`);

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
              if (font_class) {
                linkText.classList.add(font_class);
              }

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
              'woo_better_min_free_shipping_success_message': 'woo_better_min_free_shipping_message',

              //Cart
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
              'woo_better_calc_cart_input_icon_color': 'woo_better_calc_cart_input_placeholder',
              'woo_better_calc_cart_custom_position': 'woo_better_calc_cart_input_position',

              //Product
              'woo_better_calc_product_input_border_width': 'woo_better_calc_product_input_background_color_field',
              'woo_better_calc_product_input_color_field': 'woo_better_calc_product_input_background_color_field',
              'woo_better_calc_product_input_border_style': 'woo_better_calc_product_input_background_color_field',
              'woo_better_calc_product_input_border_color_field': 'woo_better_calc_product_input_background_color_field',
              'woo_better_calc_product_input_border_radius': 'woo_better_calc_product_input_background_color_field',
              'woo_better_calc_product_button_color_field': 'woo_better_calc_product_button_background_color_field',
              'woo_better_calc_product_button_border_width': 'woo_better_calc_product_button_background_color_field',
              'woo_better_calc_product_button_border_style': 'woo_better_calc_product_button_background_color_field',
              'woo_better_calc_product_button_border_color_field': 'woo_better_calc_product_button_background_color_field',
              'woo_better_calc_product_button_border_radius': 'woo_better_calc_product_button_background_color_field',
              'woo_better_calc_product_input_icon': 'woo_better_calc_product_input_placeholder',
              'woo_better_calc_product_input_icon_color': 'woo_better_calc_product_input_placeholder',
              'woo_better_calc_product_custom_position': 'woo_better_calc_product_input_position',

              //Checkout
              'woo_better_calc_enable_auto_address_fill': 'woo_better_calc_cep_field_position',

              //Cache
              'woo_better_calc_cache_expiration_time': 'woo_better_calc_enable_auto_postcode_search',
              'woo_better_calc_enable_auto_cache_reset': 'woo_better_calc_enable_auto_postcode_search'
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

    function startEvenst(styleName) {
      const styleComponents = {
        [`woo_better_calc_${styleName}_input_background_color_field_input`]: { property: 'background-color', default: '#ffffff' },
        [`woo_better_calc_${styleName}_input_color_field_input`]: { property: 'color', default: '#2C3338' },
        [`woo_better_calc_${styleName}_input_border_width`]: { property: 'border-width', default: '1px' },
        [`woo_better_calc_${styleName}_input_border_style`]: { property: 'border-style', default: 'solid' },
        [`woo_better_calc_${styleName}_input_border_color_field_input`]: { property: 'border-color', default: '#ccc' },
        [`woo_better_calc_${styleName}_input_border_radius`]: { property: 'border-radius', default: '4px' }
      };

      // Lista de unidades CSS válidas
      const validInputCssUnits = ['px', '%', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax', 'cm', 'mm', 'in', 'pt', 'pc', 'ex', 'ch'];

      // Seleciona o componente principal que será estilizado
      const targetComponent = document.getElementById(`woo_better_calc_${styleName}_input_current_style_postcode_fake_custom`);

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
        [`woo_better_calc_${styleName}_button_background_color_field_input`]: { property: 'background-color', default: '#0073aa' },
        [`woo_better_calc_${styleName}_button_color_field_input`]: { property: 'color', default: '#ffffff' },
        [`woo_better_calc_${styleName}_button_border_width`]: { property: 'border-width', default: '1px' },
        [`woo_better_calc_${styleName}_button_border_style`]: { property: 'border-style', default: 'none' },
        [`woo_better_calc_${styleName}_button_border_color_field_input`]: { property: 'border-color', default: 'transparent' },
        [`woo_better_calc_${styleName}_button_border_radius`]: { property: 'border-radius', default: '4px' }
      };

      const validCssButtonUnits = ['px', '%', 'em', 'rem', 'vh', 'vw', 'vmin', 'vmax', 'cm', 'mm', 'in', 'pt', 'pc', 'ex', 'ch'];

      // Seleciona o botão que será estilizado
      const targetButton = document.querySelector(`#woo_better_calc_${styleName}_button_current_style_postcode_fake_custom`);

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

      const placeholderInput = document.getElementById(`woo_better_calc_${styleName}_input_placeholder`);

      // Seleciona o componente de texto
      const textInput = document.getElementById(`woo_better_calc_${styleName}_input_current_style_postcode_fake_custom`);

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
      const radioOptions = document.querySelectorAll(`input[name="woo_better_calc_${styleName}_input_icon"]`);

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
            const colorSelect = document.getElementById(`woo_better_calc_${styleName}_input_icon_color`);
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
    }

    function handleCustomPosition(styleName) {
      const customPosition = document.getElementById(`woo_better_calc_${styleName}_custom_position`);
      const selectPosition = document.getElementById(`woo_better_calc_${styleName}_input_position`);

      if (customPosition && selectPosition) {
        const forminp = customPosition.closest('.forminp');
        if (forminp) {
          if (selectPosition.value === 'custom') {
            forminp.style.display = 'flex';
          } else {
            forminp.style.display = 'none';
          }
        }
      }

      if (selectPosition) {
        selectPosition.addEventListener('change', function () {
          const selectedValue = selectPosition.value;

          if (customPosition) {
            const forminp = customPosition.closest('.forminp');
            if (forminp) {
              if (selectedValue === 'custom') {
                forminp.style.display = 'flex';
              } else {
                forminp.style.display = 'none';
              }
            }
          }
        });
      }
    }

    function handleCacheSettings() {
      const cacheExpirationTime = document.getElementById('woo_better_calc_cache_expiration_time');
      const autoCacheReset = document.getElementById('woo_better_calc_enable_auto_cache_reset');

      if (cacheExpirationTime && autoCacheReset) {
        const cacheExpirationForminp = cacheExpirationTime.closest('.forminp');
        const autoCacheResetForminp = autoCacheReset.closest('.forminp');

        // Função inicial para definir visibilidade baseada no valor atual
        const selectedValue = document.querySelector('input[name="woo_better_calc_enable_auto_postcode_search"]:checked')?.value;

        if (cacheExpirationForminp && autoCacheResetForminp) {
          if (selectedValue === 'yes') {
            cacheExpirationForminp.style.display = 'flex';
            autoCacheResetForminp.style.display = 'flex';
          } else {
            cacheExpirationForminp.style.display = 'none';
            autoCacheResetForminp.style.display = 'none';
          }
        }

        // Adiciona evento para todos os radios do grupo
        const radioOptions = document.querySelectorAll('input[name="woo_better_calc_enable_auto_postcode_search"]');
        radioOptions.forEach(radio => {
          radio.addEventListener('change', function () {
            const newSelectedValue = document.querySelector('input[name="woo_better_calc_enable_auto_postcode_search"]:checked')?.value;

            if (cacheExpirationForminp && autoCacheResetForminp) {
              if (newSelectedValue === 'yes') {
                cacheExpirationForminp.style.display = 'flex';
                autoCacheResetForminp.style.display = 'flex';
              } else {
                cacheExpirationForminp.style.display = 'none';
                autoCacheResetForminp.style.display = 'none';
              }
            }
          });
        });
      }
    }

    function handleClearCacheButton() {
      const cacheResetInput = document.getElementById('woo_better_calc_enable_auto_cache_reset');

      if (cacheResetInput) {
        // Esconde o input original
        cacheResetInput.style.display = 'none';

        // Cria o botão "Limpar o cache"
        const clearCacheButton = document.createElement('button');
        clearCacheButton.type = 'button';
        clearCacheButton.className = 'woo-better-cache-button components-button is-primary';
        clearCacheButton.textContent = 'Limpar o cache';

        // Função para gerar um novo token
        function generateNewToken() {
          const prefix = 'WCBCB_';
          const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
          let randomPart = '';

          for (let i = 0; i < 19; i++) {
            randomPart += characters.charAt(Math.floor(Math.random() * characters.length));
          }

          return prefix + randomPart;
        }

        // Adiciona o evento de clique
        clearCacheButton.addEventListener('click', function () {
          const confirmMessage = 'Tem certeza de que deseja limpar o cache?';

          if (confirm(confirmMessage)) {
            const newToken = generateNewToken();
            cacheResetInput.value = newToken;

            // Feedback visual - carregando
            clearCacheButton.textContent = 'Limpando cache...';
            clearCacheButton.disabled = true;
            clearCacheButton.style.backgroundColor = '#007cba';
            clearCacheButton.style.color = '#fff';

            const ajaxUrl = typeof wcBetterCalcAjax !== 'undefined' ? wcBetterCalcAjax.ajaxurl : (typeof ajaxurl !== 'undefined' ? ajaxurl : '/wp-admin/admin-ajax.php');

            // Primeiro, obtém um nonce dinâmico
            const nonceFormData = new FormData();
            nonceFormData.append('action', 'wc_better_calc_get_nonce');
            nonceFormData.append('action_nonce', 'woo_better_calc_update_cache_token');

            fetch(ajaxUrl, {
              method: 'POST',
              body: nonceFormData
            })
              .then(response => response.json())
              .then(nonceData => {
                if (nonceData.success && nonceData.data && nonceData.data.nonce) {
                  // Agora faz a requisição principal com o nonce obtido
                  clearCacheButton.textContent = 'Limpando cache...';

                  const formData = new FormData();
                  formData.append('action', 'woo_better_calc_update_cache_token');
                  formData.append('token', newToken);
                  formData.append('nonce', nonceData.data.nonce);

                  return fetch(ajaxUrl, {
                    method: 'POST',
                    body: formData
                  });
                } else {
                  throw new Error('Erro ao obter nonce: ' + (nonceData.data || 'Nonce inválido'));
                }
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  // Sucesso
                  clearCacheButton.textContent = 'Cache limpo!';
                  clearCacheButton.style.backgroundColor = '#00a32a';
                  clearCacheButton.style.color = '#fff';
                } else {
                  // Erro
                  clearCacheButton.textContent = 'Erro ao limpar cache';
                  clearCacheButton.style.backgroundColor = '#dc3232';
                  clearCacheButton.style.color = '#fff';
                  console.error('Erro ao atualizar token:', data.data);
                }
              })
              .catch(error => {
                // Erro de rede ou nonce
                clearCacheButton.textContent = 'Erro de conexão';
                clearCacheButton.style.backgroundColor = '#dc3232';
                clearCacheButton.style.color = '#fff';
                console.error('Erro:', error);
              })
              .finally(() => {
                // Restaura o estado original após 2 segundos
                setTimeout(() => {
                  clearCacheButton.textContent = 'Limpar o cache';
                  clearCacheButton.disabled = false;
                  clearCacheButton.style.backgroundColor = '';
                  clearCacheButton.style.color = '';
                }, 2000);
              });
          }
        });

        // Insere o botão após o input
        cacheResetInput.parentNode.insertBefore(clearCacheButton, cacheResetInput.nextSibling);
      }
    }

    const shortcodeElements = document.querySelectorAll('.woo-better-shortcode');

    shortcodeElements.forEach(function (codeEl) {
      // Cria o botão de copiar
      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'woo-better-copy-shortcode-btn';
      copyBtn.title = 'Copiar shortcode';
      copyBtn.innerHTML = '📋'; // Ícone de copiar

      // Estilização leve (adicione o resto no CSS)
      copyBtn.style.marginLeft = '8px';
      copyBtn.style.cursor = 'pointer';
      copyBtn.style.border = 'none';
      copyBtn.style.background = 'transparent';
      copyBtn.style.fontSize = '16px';
      copyBtn.style.transition = 'transform 0.2s';

      // Evento de copiar
      copyBtn.addEventListener('click', function () {
        const shortcodeText = codeEl.textContent.trim();
        navigator.clipboard.writeText(shortcodeText).then(function () {
          // Animação leve
          copyBtn.innerHTML = '✅';
          copyBtn.style.transform = 'scale(1.2)';
          setTimeout(function () {
            copyBtn.innerHTML = '📋';
            copyBtn.style.transform = 'scale(1)';
          }, 1200);
        });
      });

      // Insere o botão após o shortcode
      codeEl.parentNode.insertBefore(copyBtn, codeEl.nextSibling);
    });

    const positionRadios = document.querySelectorAll('input[name="woo_better_calc_cep_field_position"]');
    const autoAddressRadios = document.querySelectorAll('input[name="woo_better_calc_enable_auto_address_fill"]');

    function updateAutoAddressState() {
      // Considera habilitado se algum radio do pai estiver marcado como 'yes'
      const enabled = Array.from(positionRadios).some(radio => radio.checked && radio.value === 'yes');
      autoAddressRadios.forEach(radio => {
        radio.disabled = !enabled;
        radio.style.cursor = enabled ? '' : 'not-allowed';
        if (!enabled) {
          // Se desabilitar o pai, marca 'no' no filho
          if (radio.value === 'no') {
            radio.checked = true;
          } else if (radio.value === 'yes') {
            radio.checked = false;
          }
        }
      });
    }
    if (positionRadios.length > 0 && autoAddressRadios.length > 0) {
      updateAutoAddressState(); // Estado inicial
      positionRadios.forEach(radio => {
        radio.addEventListener('change', updateAutoAddressState);
      });
    }

    startEvenst('cart');
    startEvenst('product');

    handleCustomPosition('cart');
    handleCustomPosition('product');
    handleCacheSettings();
    handleClearCacheButton();

    if (WCBetterCalcWooVersion.status === 'invalid') {
      // Seleciona todos os inputs e selects com o padrão de name que contenham "cart" ou "product"
      const inputsToDisable = document.querySelectorAll(
        'input[name*="enable_cart"], input[name*="cart_input"], select[name*="cart_input"], select[name*="cart_button"], input[name*="cart_button"]'
      );

      // Itera sobre os elementos encontrados e desabilita todos
      inputsToDisable.forEach(input => {
        input.disabled = true;
        input.style.cursor = 'not-allowed';
      });
    }

    // Cria a div que conterá o ícone
    const floatingIconContainer = document.createElement('div');
    floatingIconContainer.className = 'woo-better-floating-icon-container';

    // Cria o ícone dentro da div
    const floatingIcon = document.createElement('img');
    floatingIcon.src = WCBetterCalcIcons.consult;
    floatingIcon.alt = 'Ir para o componente';
    floatingIcon.title = 'Ir para o componente';
    floatingIcon.className = 'woo-better-floating-icon';

    // Adiciona o evento de clique à div
    floatingIconContainer.addEventListener('click', function () {
      // Verifica a URL para determinar o contexto (cart ou product)
      const hash = window.location.hash;
      let styleName = '';

      if (hash.includes('carrinho')) {
        styleName = 'cart';
      } else if (hash.includes('produto')) {
        styleName = 'product';
      }

      if (styleName) {
        // Seleciona o componente de destino
        const targetElement = document.getElementById(`woo_better_calc_${styleName}_input_current_style_postcode_fake_custom`);

        if (targetElement) {
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
        }
      } else {
        alert('Componente disponível apenas nas abas de Carrinho ou Produto.');
      }
    });

    // Adiciona a imagem dentro da div
    floatingIconContainer.appendChild(floatingIcon);

    // Adiciona a div ao body
    document.body.appendChild(floatingIconContainer);

    // Verifica inicialmente se deve mostrar o floating icon baseado na tab ativa atual
    let initialActiveTab = tabLinks[0]; // Padrão é a primeira tab

    // Verifica se há um hash na URL para determinar a tab ativa
    const currentHash = window.location.hash;
    if (currentHash) {
      const hashIndex = tabLinks.findIndex(tab => tab.href.endsWith(currentHash));
      if (hashIndex >= 0) {
        initialActiveTab = tabLinks[hashIndex];
      }
    }

    // Mostra o floating icon apenas se a tab ativa for 'Carrinho' ou 'Produto'
    if (initialActiveTab && (initialActiveTab.textContent === 'Carrinho' || initialActiveTab.textContent === 'Produto')) {
      floatingIconContainer.style.display = 'flex';
    } else {
      floatingIconContainer.style.display = 'none';
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