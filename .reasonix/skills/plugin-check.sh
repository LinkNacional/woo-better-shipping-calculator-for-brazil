#!/bin/bash
# Valida disponibilidade do WP-CLI
if ! command -v wp &> /dev/null; then echo '{"error": "WP-CLI não encontrado."}'; exit 2; fi

# Instala plugin-check se não existir
if ! wp plugin is-installed plugin-check --quiet; then
    wp plugin install plugin-check --activate --quiet
fi

# Captura o slug do plugin baseado no diretório atual
PLUGIN_SLUG=$(basename "$PWD")

# Executa o check ignorando diretórios pesados/testes
OUTPUT=$(wp plugin check "$PLUGIN_SLUG" \
  --exclude-directories="vendor,node_modules,wordpress,wp-content,.reasonix,tests,.phan,.github,.vscode,.devcontainer" \
  --format=json 2>&1)

# Valida integridade do output
if [[ -z "$OUTPUT" ]] || [[ "$OUTPUT" == *"Error:"* && "$OUTPUT" != *"["* ]]; then
    echo '{"error": "Falha na execução do Plugin Check.", "raw_output": "'"$OUTPUT"'"}'
    exit 2
fi

# Parse de erros e warnings
ERRORS=$(echo "$OUTPUT" | grep -o '"type":"error"' | wc -l)
WARNINGS=$(echo "$OUTPUT" | grep -o '"type":"warning"' | wc -l)

echo "$OUTPUT"

# Falha o script se houver qualquer erro ou warning (--strict)
if [ "$ERRORS" -gt 0 ] || [ "$WARNINGS" -gt 0 ]; then
    exit 1
fi
exit 0
