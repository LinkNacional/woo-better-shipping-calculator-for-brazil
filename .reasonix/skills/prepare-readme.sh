#!/bin/bash
echo "=== 🚀 Assistente de Release (Readme.txt) ==="
echo "Vamos preparar as informações para o Reasonix atualizar o readme."
echo ""

# Busca automaticamente a versão e o PHP atuais no cabeçalho do arquivo principal
CURRENT_VERSION=$(grep -h -E -i -m 1 "^[ \t]*\*[ \t]*Version:" *.php 2>/dev/null | awk -F ':' '{print $2}' | xargs)
CURRENT_PHP=$(grep -h -E -i -m 1 "^[ \t]*\*[ \t]*Requires PHP:" *.php 2>/dev/null | awk -F ':' '{print $2}' | xargs)

# Lógica de hints para Versão
if [ -z "$CURRENT_VERSION" ]; then
    VERSION_HINT="[ex: 1.3.0]"
else
    VERSION_HINT="[última foi: $CURRENT_VERSION]"
fi

# Lógica de hints para PHP
if [ -z "$CURRENT_PHP" ]; then
    PHP_HINT="[ex: 8.0]"
    DEFAULT_PHP="8.0"
else
    PHP_HINT="[atual: $CURRENT_PHP (pressione Enter para manter)]"
    DEFAULT_PHP="$CURRENT_PHP"
fi

read -p "1. Qual a nova versão (Stable tag)? $VERSION_HINT: " VERSION
read -p "2. Testado até qual versão do WP (Tested up to)? [ex: 6.5]: " TESTED_UP
read -p "3. Qual a versão mínima do PHP (Requires PHP)? $PHP_HINT: " INPUT_PHP
read -p "4. Resumo principal dessa versão (Deixe em branco para usar só o git log): " HIGHLIGHTS

# Se o usuário apenas apertar Enter na pergunta do PHP, mantemos a versão atual
PHP_VERSION="${INPUT_PHP:-$DEFAULT_PHP}"

echo ""
echo "⏳ Capturando histórico de commits..."
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
if [ -z "$LAST_TAG" ]; then
    COMMITS=$(git log -n 10 --oneline)
else
    COMMITS=$(git log ${LAST_TAG}..HEAD --oneline)
fi

# Cria o prompt dinâmico que será lido pelo Reasonix
cat <<EOF > .reasonix/skills/task-readme.txt
Ação: Atualizar os arquivos da release (readme.txt e cabeçalho PHP).

Contexto da Release:
- Nova Versão: $VERSION
- Tested up to: $TESTED_UP
- Requires PHP: $PHP_VERSION
- Destaques informados pelo usuário: $HIGHLIGHTS
- Commits recentes para basear o changelog:
$COMMITS

Diretrizes de Execução (Obrigatório):
1. Leia o arquivo '.reasonix/templates/README.txt' e use-o como gabarito rigoroso de formatação.
2. Atualize o cabeçalho do 'readme.txt' atual com as novas marcações: 'Stable tag: $VERSION', 'Tested up to: $TESTED_UP' e 'Requires PHP: $PHP_VERSION'.
3. Adicione a versão $VERSION na seção '== Changelog ==', transformando o log de commits em uma lista amigável e profissional.
4. Se o usuário forneceu 'Destaques', avalie se vale a pena adicionar um breve parágrafo na seção '== Description ==', mas NUNCA exclua ou sobrescreva o conteúdo que já existe lá (descrições, FAQs, etc.).
5. IMPORTANTE: Atualize também as marcações 'Version:' e 'Requires PHP:' no cabeçalho de comentários do arquivo PHP principal do plugin para manter 100% de sincronia com o readme.txt.
EOF

echo "✅ Dossiê gerado com sucesso!"
echo "👉 Agora, basta pedir para o Reasonix: 'Execute a tarefa descrita em .reasonix/skills/task-readme.txt'"
