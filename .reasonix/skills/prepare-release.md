---
name: prepare-release
description: Prepara release: atualiza readme.txt (stable tag, changelog) e cabeçalho PHP (Version, Requires PHP) baseado no git log
---

# prepare-release

Atualiza `readme.txt` e cabeçalho PHP para uma nova release do plugin.

## Parâmetros (via `arguments`)

O usuário pode passar os valores diretamente: `"version=1.4.0 tested_up=6.5 php=8.0 highlights=Correção de bug X"`. Se algum valor faltar, pergunte.

- **version** — nova versão (Stable tag)
- **tested_up** — versão do WP testada (Tested up to)
- **php** — versão mínima do PHP (Requires PHP)
- **highlights** — resumo da versão (opcional, usa git log se vazio)

## Fluxo de execução

### 1. Coletar valores
Se não recebidos via arguments, pergunte ao usuário um por um. Detecte valores atuais no cabeçalho do PHP:
```
grep -E "Version:|Requires PHP:" *.php
```

### 2. Capturar git log
```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
if [ -z "$LAST_TAG" ]; then
    git log -n 10 --oneline
else
    git log ${LAST_TAG}..HEAD --oneline
fi
```

### 3. Ler template de referência
Leia `.reasonix/templates/README.txt` como gabarito de formatação.

### 4. Atualizar readme.txt
- Atualize `Stable tag:`, `Tested up to:`, `Requires PHP:` no cabeçalho
- Adicione entrada em `== Changelog ==`:
  ```
  = VERSION =
  * Item baseado nos commits
  * Outro item
  ```
- Se `highlights` foi fornecido e é relevante, avalie adicionar na `== Description ==` (NUNCA apague conteúdo existente)

### 5. Atualizar cabeçalho PHP
No arquivo principal do plugin (`.php` raiz com `Plugin Name:`), atualize:
- `Version: NOVA_VERSION`
- `Requires PHP: NOVA_PHP`

### 6. Validação final
Confirme que `readme.txt` e o arquivo PHP estão sincronizados na versão.
