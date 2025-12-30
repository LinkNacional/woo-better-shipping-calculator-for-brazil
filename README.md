<div align="center">
    <img src="Includes/assets/images/icon-256x256.png" alt="Logo do Projeto" width="200" />
</div>

# Calculadora de frete melhorada para lojas brasileiras

* Contribuidores: LinkNacional, luizbills
* Link para doações: [LinkNacional](https://www.linknacional.com.br/)
* Tags: woocommerce, brasil, calculadora de frete, CEP, entrega
* Testado até: 6.8
* Requer PHP: 7.3
* Tag estável: 4.7.0-rc.3
* Licença: GPLv2 ou posterior
* URI da licença: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)


## Versão mais recente no Wordpress

[![WordPress Plugin Version](https://img.shields.io/wordpress/plugin/v/woo-better-shipping-calculator-for-brazil?label=Plugin%20Version&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/)
[![WordPress Plugin Required PHP Version](https://img.shields.io/wordpress/plugin/required-php/woo-better-shipping-calculator-for-brazil?label=PHP%20Required&logo=php&logoColor=white&style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/)
[![WordPress Plugin Rating](https://img.shields.io/wordpress/plugin/stars/woo-better-shipping-calculator-for-brazil?label=Plugin%20Rating&logo=wordpress&style=flat-square)](https://wordpress.org/support/plugin/woo-better-shipping-calculator-for-brazil/reviews/)
[![WordPress Plugin Downloads](https://img.shields.io/wordpress/plugin/dt/woo-better-shipping-calculator-for-brazil.svg?label=Downloads&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/advanced/)
[![License](https://img.shields.io/badge/LICENSE-GPLv3-blue?style=flat-square)](https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/)

## Descrição

Calculadora de frete melhorada para lojas brasileiras, facilitando e melhorando o fluxo de preenchimendo dos dados nas páginas de carrinho e checkout:

> Na página de Carrinho:

- Validação de CEP.
- Controle no botão de envio, permitindo apenas seguir após inserir um CEP válido.
- Ocultação de campos de endereço.
- Compatibilidade com o modo Legacy e Blocos (Gutenberg).

> Na página de Checkout:

- Campo de número(complementando o endereço via `checkbox` ou `text-input`).
- Ocultação de campos de endereço.
- Compatibilidade com o modo Legacy e Blocos (Gutenberg).

> Funcionalidades Adicionais:

- Opção para definir um valor mínimo no carrinho para frete grátis.
- Totalmente personalizável através das configurações do plugin.

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

### Barra de progresso em Legacy(Cart / Checkout):

<img src="Includes/assets/images/progressBarInLegacyCart.png" alt="Barra de progresso em carrinho legacy" width="600" />

<img src="Includes/assets/images/progressBarInLegacyCheckout.png" alt="Barra de progresso em checkout legacy" width="600" />

### Barra de progresso em Gutenberg(Cart / Checkout):

<img src="Includes/assets/images/progressBarInGutenbergCart.png" alt="Barra de progresso em carrinho do Gutenberg" width="600" />

<img src="Includes/assets/images/progressBarInGutenbergCheckout.png" alt="Barra de progresso em checkout do Gutenberg" width="600" />


**OBS:** Os dados utilizados nas screenshots são meramente ilustrativos.

**Tema utilizado:** Twenty Twenty-Five

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




