<div align="center">
    <img src="Includes/assets/images/icon-256x256.png" alt="Logo do Projeto" width="200" />
</div>

# Calculadora de frete melhorada para lojas brasileiras

* Contribuidores: LinkNacional
* Link para doações: [LinkNacional](https://www.linknacional.com.br/)
* Tags: woocommerce, brasil, calculadora de frete, CEP
* Testado até: 6.8
* Requer PHP: 7.3
* Tag estável: 4.1.2
* Licença: GPLv2 ou posterior
* URI da licença: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)


## Versão mais recente no Wordpress

[![WordPress Plugin Version](https://img.shields.io/wordpress/plugin/v/woo-better-shipping-calculator-for-brazil?label=Plugin%20Version&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/)
[![WordPress Plugin Required PHP Version](https://img.shields.io/wordpress/plugin/required-php/woo-better-shipping-calculator-for-brazil?label=PHP%20Required&logo=php&logoColor=white&style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/)
[![WordPress Plugin Rating](https://img.shields.io/wordpress/plugin/stars/woo-better-shipping-calculator-for-brazil?label=Plugin%20Rating&logo=wordpress&style=flat-square)](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/reviews/)
[![WordPress Plugin Downloads](https://img.shields.io/wordpress/plugin/dt/woo-better-shipping-calculator-for-brazil.svg?label=Downloads&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/advanced/)
[![License](https://img.shields.io/badge/LICENSE-GPLv3-blue?style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/)

## Descrição

Calculadora de frete melhorada para lojas brasileiras:

* Remove os campos de país, estado e cidade.
* Mantém o campo de CEP sempre visível.
* Permite apenas a inserção de números no campo de CEP.
* Exibe um teclado numérico em dispositivos móveis.
* Habilita campo de número de endereço.
* Habilita verificador de cep.
* Desabilita frete no produto.

## Como instalar?

1. Acesse o painel de administração do WordPress e vá para **Plugins > Adicionar Novo**.
2. Pesquise por "Calculadora de frete melhorada para lojas brasileiras".
3. Encontre o plugin, clique em **Instalar Agora** e depois em **Ativar**.
4. Pronto! Nenhuma configuração adicional é necessária.

## Screenshots:

### Página de configuração:
<img src="Includes/assets/images/settingsPage.png" alt="Configuração do plugin" width="1000" />

### Antes(shortcode):
<img src="Includes/assets/images/oldShortShipping.png" alt="Frete antigo no shortcode" width="200" />

### Depois(shortcode):
<img src="Includes/assets/images/newShortShipping.png" alt="Frete novo no shortcode" width="200" />

### Antes(Gutenberg)
<img src="Includes/assets/images/defaultGutenbergCart.png" alt="Frete padrão no gutenberg" width="200" />

### Depois(Gutenberg)
<img src="Includes/assets/images/postCodeFieldGutenberg.png" alt="Frete novo no gutenberg" width="200" />

### Novo campo número
<img src="Includes/assets/images/shortcodeNumberField.png" alt="Campo número no checkout do shortcode" width="600" />

<img src="Includes/assets/images/gutenbergNumberField.png" alt="Campo número no checkout do shortcode" width="600" />


**OBS:** Os dados utilizados nas screenshots são meramente ilustrativos.

**Tema utilizado:** Twenty Twenty-Five

## Como configurar o Woo-better no playgroud:

### Certifique-se de configurar os dados iniciais do WooCommerce:

* Clique na opção para iniciar as configurações de preenchimento do Woocommerce:

<img src="Includes/assets/images/tutorial/woo-tela-inicial.png" alt="Woo página inicial" width="800" />

* Clique em `Skip this step` para prosseguir com a configuração:

<img src="Includes/assets/images/tutorial/woo-descricao.png" alt="Woo página de descrição" width="800" />

* Selecione o tipo de produtos oferecidos no comércio, juntamente com a localização, no caso, Brasil.

<img src="Includes/assets/images/tutorial/woo-local.png" alt="Woo página de local" width="800" />

* Desmaque todas as opções, pois não iremos utilizar esses recursos na modo de teste:

<img src="Includes/assets/images/tutorial/woo-recursos.png" alt="Woo página de recursos" width="800" />

* Siga para página de Woocommerce -> Settings. Localize o campo de `Postcode(CEP)` e preencha com um CEP de alguma localidade da sua região.

<img src="Includes/assets/images/tutorial/woo-configuracao.png" alt="Woo página de configuração" width="800" />

* Salve as configurações.

### Com as configurações inicias finalizada, siga para cadastrar um produto:

* Localize a opção `Products` e selecione `Add new product`:

<img src="Includes/assets/images/tutorial/woo-produto.png" alt="Woo configuração de produto" width="800" />

* Crie um produto simples e preencha seus dados e clique em `Publish`:

<img src="Includes/assets/images/tutorial/woo-produto-simples.png" alt="Woo página de configuração de produto simples" width="800" />

### Após o produto e configurações terem sido finalizados, verifique as opções disponíveis do nosso plugin, simplificando e melhorando o preenchimento dos dados no formulário de entrega do Woocommerce(Carrinho/Checkout):

* Para acessar as configurações do nosso plugin acesse `Woocommerce`-> `Settings`:

<img src="Includes/assets/images/settingsPage.png" alt="Woo-better página de configuração" width="800" />

* Para visualizar o funcionamento completo do nosso plugin deixe a entrega do produto como `padrão` e as demais funcionalidades marcado como `sim`.

* Acesse um produto clicando em `Products`-> `All Products`, então passe o mouse por cima do produto selecionado e clique na opção `View`:

* Clique em `Add to cart` ou `Adicionar ao carrinho`:

<img src="Includes/assets/images/tutorial/woo-add-cart.png" alt="Página do produto" width="800" />

* Clique em visualizar o carrinho:

<img src="Includes/assets/images/tutorial/woo-view-cart.png" alt="Mensagem para visualizar o carrinho" width="800" />

* Na página do carrinho verifique as funcionalidades do nosso plugin nas páginas de `Cart(Carrinho)` e `Checkout`.

* Insira um CEP e verifique as funcionalidades do carrinho, nos quais incluem:

- Validação de CEP.
- Botão de controle, permitindo apenas seguir após inserir um CEP válido.
- Ocultação de campo de endereço.
- Compatibilidade com o modo Legacy e Blocos (Gutenberg).

* Na página de Checkout as funcionalidades são:

- Campo de número(complementando o endereço via `checkbox` ou `text-input`).
- Ocultação de campo de endereço.
- Compatibilidade com o modo Legacy e Blocos (Gutenberg).

## Dicas:

Caso seu carrinho não apresente nenhuma mudança no layout da **Entrega**, tente fazer a seguinte abordagem:

Crie uma página com um novo nome, exemplo: `basic cart` (Carrinho básico), no conteúdo da página insira o **shortcode** do woocommerce referente ao carrinho:

`[woocommerce_cart]`

Você pode também personalizar sua nova página conforme desejar.

<img src="Includes/assets/images/newPage.png" alt="Nova página" width="800" />

Após criar a página, defina a mesma nas configurações do carrinho do `Woocommerce`.

Caminho: **WooCommerce** > **Configurações** > **Avançado** > **Página de instalação**

<img src="Includes/assets/images/woocommerceSettings.png" alt="Configurações do WooCommerce" width="800" />

**Considerações finais**: A partir dessas configurações básicas, seu carrinho personalizado irá carregar durante o processo de pagamento.

## Contato:

Possui dúvidas? Deseja dar um feedback sobre o que achou do plugin ou compartilhar novas ideias? Entre em contato conosco:

[Atendimento LinkNacional](https://www.linknacional.com.br/atendimento/)




