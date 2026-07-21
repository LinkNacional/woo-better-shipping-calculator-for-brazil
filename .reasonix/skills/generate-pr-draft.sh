#!/bin/bash
echo "=== 🐙 Assistente de Pull Request (GitHub) ==="
echo "Coletando metadados do plugin para gerar o rascunho do PR..."
echo ""

# Extrai metadados principais diretamente do arquivo PHP
PLUGIN_NAME=$(grep -h -E -i -m 1 "^[ \t]*\*[ \t]*Plugin Name:" *.php 2>/dev/null | awk -F ':' '{print $2}' | sed 's/^[ \t]*//')
CURRENT_VERSION=$(grep -h -E -i -m 1 "^[ \t]*\*[ \t]*Version:" *.php 2>/dev/null | awk -F ':' '{print $2}' | sed 's/^[ \t]*//')
CURRENT_PHP=$(grep -h -E -i -m 1 "^[ \t]*\*[ \t]*Requires PHP:" *.php 2>/dev/null | awk -F ':' '{print $2}' | sed 's/^[ \t]*//')
TESTED_UP=$(grep -h -E -i -m 1 "^[ \t]*\*[ \t]*Tested up to:" *.php 2>/dev/null | awk -F ':' '{print $2}' | sed 's/^[ \t]*//')

# Pega o nome do repositório (nome da pasta) para o título do PR
REPO_NAME=$(basename "$PWD")

if [ -z "$PLUGIN_NAME" ]; then
    PLUGIN_NAME="$REPO_NAME"
fi

echo "📦 Plugin detectado: $PLUGIN_NAME v$CURRENT_VERSION"
echo "⏳ Coletando histórico do Git..."

LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
if [ -z "$LAST_TAG" ]; then
    COMMITS=$(git log -n 10 --oneline)
else
    COMMITS=$(git log ${LAST_TAG}..HEAD --oneline)
fi

# Cria o prompt dinâmico que será lido pelo Reasonix
cat <<EOF > .reasonix/skills/task-pr.txt
Ação: Criar um rascunho de Pull Request baseado no padrão da Link Nacional.

Contexto:
- Nome do Plugin: $PLUGIN_NAME
- Repositório: $REPO_NAME
- Versão: $CURRENT_VERSION
- Requer PHP: $CURRENT_PHP
- Testado até: $TESTED_UP
- Commits recentes:
$COMMITS

Diretrizes de Execução:
1. Crie um arquivo chamado 'PR-DRAFT.md' na raiz do projeto.
2. A primeira linha do arquivo DEVE ser o título sugerido para o PR, no seguinte formato exato (substitua o texto entre parênteses por um micro-resumo do que mudou):
TITULO SUGERIDO: $CURRENT_VERSION - $REPO_NAME (Ajuste: Breve resumo baseado nos commits)

3. Pule duas linhas. O restante do arquivo será o corpo do PR.
4. Comece o corpo com '# $PLUGIN_NAME' seguido por uma lista de metadados em bullet points (Contribuidores: linknacional, Testado até: $TESTED_UP, Requer PHP: $CURRENT_PHP, Tag estável: $CURRENT_VERSION, Licença: GPLv2 ou posterior).
5. Inclua as seções padrão da empresa:
   - '## Descrição': Crie uma descrição breve sobre o plugin.
   - '## 📥 Como instalar?': Lista numerada genérica do WP.
   - '## 🔄 Fluxo de Desenvolvimento': Liste as 4 regras de automação (CodeQL, Plugin Check, Releases automatizados, Testes de PHP).
6. FINALIZAÇÃO CRÍTICA: Crie a seção '## 📋 Resumo da Versão $CURRENT_VERSION'. Aqui, transforme os 'Commits recentes' em uma lista de bullet points limpa, profissional e explicativa para o revisor (remova hashes do git).
EOF

echo "✅ Tarefa gerada com sucesso!"
echo "👉 Agora, peça ao Reasonix: 'Execute a tarefa descrita em .reasonix/skills/task-pr.txt'"
