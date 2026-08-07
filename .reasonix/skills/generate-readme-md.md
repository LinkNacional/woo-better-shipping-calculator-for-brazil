---
name: generate-readme-md
description: Gera README.md para GitHub com badges do shields.io, descrição e seções padrão Link Nacional a partir do readme.txt
---

# generate-readme-md

Gera/atualiza `README.md` para GitHub baseado no `readme.txt` do WordPress.

## Fluxo de execução

### 1. Extrair metadados
Leia `readme.txt` e o header do PHP principal para obter:
- Plugin Name
- Version / Stable tag
- Requires PHP
- Tested up to
- Contributors
- Tags
- Description
- Screenshots (se houver)

### 2. Slug
Use `basename "$PWD"` ou extraia do readme.txt.

### 3. Criar/sobrescrever README.md

Estrutura obrigatória (GitHub Flavored Markdown):

```markdown
<div align="center">
    <img src="Includes/assets/images/icon-256x256.png" alt="Logo do Projeto" width="200" />
</div>

# [Plugin Name]

* Contribuidores: [do readme.txt]
* Link para doações: [LinkNacional](https://www.linknacional.com.br/)
* Tags: [do readme.txt]
* Testado até: [do readme.txt]
* Requer PHP: [do readme.txt]
* Tag estável: [do readme.txt]
* Licença: GPLv2 ou posterior
* URI da licença: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)

## Versão mais recente no Wordpress

[![WordPress Plugin Version](https://img.shields.io/wordpress/plugin/v/SLUG?label=Plugin%20Version&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/SLUG/)
[![WordPress Plugin Required PHP Version](https://img.shields.io/wordpress/plugin/required-php/SLUG?label=PHP%20Required&logo=php&logoColor=white&style=flat-square)](https://wordpress.org/plugins/SLUG/)
[![WordPress Plugin Rating](https://img.shields.io/wordpress/plugin/stars/SLUG?label=Plugin%20Rating&logo=wordpress&style=flat-square)](https://wordpress.org/support/plugin/SLUG/reviews/)
[![WordPress Plugin Downloads](https://img.shields.io/wordpress/plugin/dt/SLUG.svg?label=Downloads&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/SLUG/advanced/)
[![License](https://img.shields.io/badge/LICENSE-GPLv3-blue?style=flat-square)](https://wordpress.org/plugins/SLUG/)

## Descrição
[Transforme a seção '== Description ==' do readme.txt em Markdown elegante, usando blockquotes (>) para destaques e listas com hífens.]

## Como instalar?
1. Acesse o painel de administração do WordPress e vá para **Plugins > Adicionar Novo**.
2. Pesquise por "[Plugin Name]".
3. Encontre o plugin, clique em **Instalar Agora** e depois em **Ativar**.
4. Pronto! Nenhuma configuração adicional é necessária.

## Screenshots:
[Liste as imagens da seção '== Screenshots ==' do readme.txt. Se não houver, crie um placeholder descritivo.]

## Contato:
Possui dúvidas? Deseja dar um feedback sobre o que achou do plugin ou compartilhar novas ideias? Entre em contato conosco:

[Atendimento LinkNacional](https://www.linknacional.com.br/atendimento/)
```

### 4. Regras
- Substitua `SLUG` pelo slug real em todas as badges
- NUNCA invente dados — tudo vem do `readme.txt`
- Se não existir `icon-256x256.png`, use um placeholder ou omita a div da logo
