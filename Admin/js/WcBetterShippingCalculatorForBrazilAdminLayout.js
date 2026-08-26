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
      '<strong>NOVO:</strong> Formato para o CNPJ alfanumérico.'
    ]);

    // Cria o segundo bloco de mensagem
    const featureMessage2 = createFeatureMessage('✔️', [
      '<strong>AJUSTE:</strong> Novo sistema de frete por produto, prazos e comportamentos para frete grátis, além de ajustes na calculadora e no campo de número do Gutenberg.'
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
              pDescriptionField.innerHTML = inputField.getAttribute('data-description');
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

            // Define relação entre mais de um componente em um bloco
            const targetComponentCartNames = {
              'woo_better_calc_birthdate_required': 'woo_better_calc_enable_birthdate_field',

              //Checkout
              'woo_better_calc_enable_auto_address_fill': 'woo_better_calc_cep_field_position',
              'woo_better_calc_enable_silent_address_fill': 'woo_better_calc_cep_field_position',
              'woo_better_calc_contact_required': 'woo_better_calc_apply_phone_mask',
              'woo_better_calc_contact_field_position': 'woo_better_calc_apply_phone_mask',
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

    function handleAddressFillMutualExclusion() {
      const autoRadios   = document.querySelectorAll('input[name="woo_better_calc_enable_auto_address_fill"]');
      const silentRadios = document.querySelectorAll('input[name="woo_better_calc_enable_silent_address_fill"]');

      if (autoRadios.length === 0 || silentRadios.length === 0) {
        return;
      }

      autoRadios.forEach(function (radio) {
        radio.addEventListener('change', function () {
          if (this.value === 'yes' && this.checked) {
            const silentYes = document.querySelector('input[name="woo_better_calc_enable_silent_address_fill"][value="yes"]');
            if (silentYes && silentYes.checked) {
              const confirmed = confirm('O "Preenchimento Silencioso por CEP" está habilitado e será desabilitado. Deseja continuar?');
              if (!confirmed) {
                const autoNo = document.querySelector('input[name="woo_better_calc_enable_auto_address_fill"][value="no"]');
                if (autoNo) {
                  autoNo.checked = true;
                }
                return;
              }
            }
            const silentNo = document.querySelector('input[name="woo_better_calc_enable_silent_address_fill"][value="no"]');
            if (silentNo) {
              silentNo.checked = true;
              silentNo.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
      });

      silentRadios.forEach(function (radio) {
        radio.addEventListener('change', function () {
          if (this.value === 'yes' && this.checked) {
            const autoYes = document.querySelector('input[name="woo_better_calc_enable_auto_address_fill"][value="yes"]');
            if (autoYes && autoYes.checked) {
              const confirmed = confirm('O "Preenchimento Automático por CEP" está habilitado e será desabilitado. Deseja continuar?');
              if (!confirmed) {
                const silentNo = document.querySelector('input[name="woo_better_calc_enable_silent_address_fill"][value="no"]');
                if (silentNo) {
                  silentNo.checked = true;
                }
                return;
              }
            }
            const autoNo = document.querySelector('input[name="woo_better_calc_enable_auto_address_fill"][value="no"]');
            if (autoNo) {
              autoNo.checked = true;
              autoNo.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
      });
    }

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

    handleAddressFillMutualExclusion();

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