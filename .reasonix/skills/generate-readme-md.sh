#!/bin/bash
echo "=== 📘 Assistente de README.md (GitHub) ==="
echo "Preparando instruções para o Reasonix gerar o README.md..."
echo ""

# Extrai o slug do plugin baseado no nome da pasta atual (necessário para as badges)
PLUGIN_SLUG=$(basename "$PWD")

# Tenta extrair o nome principal do plugin
PLUGIN_NAME=$(grep -h -E -i -m 1 "^[ \t]*\*[ \t]*Plugin Name:" *.php 2>/dev/null | awk -F ':' '{print $2}' | sed 's/^[ \t]*//')
if [ -z "$PLUGIN_NAME" ]; then
    PLUGIN_NAME="$PLUGIN_SLUG"
fi

# Cria o prompt dinâmico que será lido pelo Reasonix
cat <<EOF > .reasonix/skills/task-readme-md.txt
Ação: Criar/Atualizar o arquivo 'README.md' para o GitHub com base no 'readme.txt'.

Contexto:
- Nome do Plugin: $PLUGIN_NAME
- Slug (para URLs e Badges): $PLUGIN_SLUG
- Fonte de dados principal: Leia o arquivo 'readme.txt' atual na raiz do projeto para obter a versão, PHP, testado até, descrição, etc.

Diretrizes de Execução (Obrigatório):
1. Crie ou sobrescreva o arquivo 'README.md' na raiz do projeto utilizando Markdown (GFM).
2. O arquivo DEVE seguir estritamente o layout e a ordem abaixo.
3. Substitua as informações dinâmicas (versão, PHP, tags) pelos dados reais lidos do 'readme.txt'.
4. As URLs das badges do shields.io DEVEM utilizar o slug '$PLUGIN_SLUG'.

📋 ESTRUTURA OBRIGATÓRIA DO ARQUIVO:

<div align="center">
    <img src="Includes/assets/images/icon-256x256.png" alt="Logo do Projeto" width="200" />
</div>

# [Nome do Plugin]

* Contribuidores: [Leia do readme.txt]
* Link para doações: [LinkNacional](https://www.linknacional.com.br/)
* Tags: [Leia do readme.txt]
* Testado até: [Leia do readme.txt]
* Requer PHP: [Leia do readme.txt]
* Tag estável: [Leia do readme.txt]
* Licença: GPLv2 ou posterior
* URI da licença: [https://www.gnu.org/licenses/gpl-2.0.html](https://www.gnu.org/licenses/gpl-2.0.html)

## Versão mais recente no Wordpress

[![WordPress Plugin Version](https://img.shields.io/wordpress/plugin/v/$PLUGIN_SLUG?label=Plugin%20Version&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/$PLUGIN_SLUG/)
[![WordPress Plugin Required PHP Version](https://img.shields.io/wordpress/plugin/required-php/$PLUGIN_SLUG?label=PHP%20Required&logo=php&logoColor=white&style=flat-square)](https://wordpress.org/plugins/$PLUGIN_SLUG/)
[![WordPress Plugin Rating](https://img.shields.io/wordpress/plugin/stars/$PLUGIN_SLUG?label=Plugin%20Rating&logo=wordpress&style=flat-square)](https://wordpress.org/support/plugin/$PLUGIN_SLUG/reviews/)
[![WordPress Plugin Downloads](https://img.shields.io/wordpress/plugin/dt/$PLUGIN_SLUG.svg?label=Downloads&logo=wordpress&style=flat-square)](https://wordpress.org/plugins/$PLUGIN_SLUG/advanced/)
[![License](https://img.shields.io/badge/LICENSE-GPLv3-blue?style=flat-square)](https://wordpress.org/plugins/$PLUGIN_SLUG/)

## Descrição

[Transforme a seção '== Description ==' do readme.txt em um Markdown elegante, utilizando blockquotes (>) para destaques e listas com hífens, conforme o padrão da empresa.]

## Como instalar?

1. Acesse o painel de administração do WordPress e vá para **Plugins > Adicionar Novo**.
2. Pesquise por "$PLUGIN_NAME".
3. Encontre o plugin, clique em **Instalar Agora** e depois em **Ativar**.
4. Pronto! Nenhuma configuração adicional é necessária.

## Screenshots:
[Verifique se existe uma seção '== Screenshots ==' no readme.txt e liste as imagens aqui seguindo a estrutura <img src="..." />. Se não houver, crie um placeholder descritivo]

## Contato:

Possui dúvidas? Deseja dar um feedback sobre o que achou do plugin ou compartilhar novas ideias? Entre em contato conosco:

[Atendimento LinkNacional](https://www.linknacional.com.br/atendimento/)
EOF

echo "✅ Tarefa de README.md gerada com sucesso!"
echo "👉 Peça ao Reasonix: 'Execute a tarefa descrita em .reasonix/skills/task-readme-md.txt'"
