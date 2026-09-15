---
name: open-pr
description: Abre PR da branch dev para main no padrão Link Nacional (título VERSION - repo - resumo; corpo com readme/metadados)
---

# open-pr

Abre um Pull Request de `dev` → `main` via `gh pr create`, no padrão Link Nacional.

## Parâmetros (via `arguments`)

O usuário pode passar: `version=5.0.0 tested_up=7.1 php=8.2 summary=Migração dos recursos para o shipping-simulation`. Qualquer valor ausente é extraído do código.

- **version** — versão da release (Stable tag / cabeçalho PHP)
- **tested_up** — WP testado até
- **php** — PHP mínimo requerido
- **summary** — resumo CURTO das mudanças (usado no TÍTULO). Se ausente, derive do git log.

## Fluxo de execução

### 1. Extrair metadados (se não vierem nos arguments)

```bash
# Header PHP (fonte da verdade)
grep -m1 -E "^\s*\*\s*Version:" *.php
grep -m1 -E "^\s*\*\s*Requires PHP:" *.php

# README.txt (fallback para Tested up to)
grep -m1 -i "^Tested up to:" README.txt
grep -m1 -i "^Requires PHP:" README.txt
grep -m1 -i "^Stable tag:" README.txt

# Nome do repositório
REPO_NAME=$(basename "$PWD")
```

### 2. Capturar git log (para o resumo, se `summary` não foi dado)

```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)
if [ -z "$LAST_TAG" ]; then
    git log -n 15 --oneline
else
    git log "${LAST_TAG}..HEAD" --oneline
fi
```

Transforme os commits em uma frase curta (≤ ~12 palavras) para o TÍTULO e em bullet points limpos (sem hash) para o corpo.

### 3. Montar TÍTULO

Formato exato (obrigatório):

```
VERSION - REPO_NAME (RESUMO_CURTO)
```

Exemplo:
```
5.0.0 - woo-better-shipping-calculator-for-brazil (Migração dos recursos da calculadora de frete para o shipping-simulation)
```

### 4. Montar CORPO

Use como gabarito o modelo abaixo. Extraia os campos fixos do `README.txt` (Contributors, Tags, License, License URI, Description, etc.). Substitua APENAS os placeholders `{...}`:

```markdown
# {PLUGIN_NAME}

* Contribuidores: {CONTRIBUTORS}
* Link para doações: [LinkNacional](https://www.linknacional.com.br/)
* Tags: {TAGS}
* Testado até: {TESTED_UP}
* Requer PHP: {PHP}
* Tag estável: {VERSION}
* Licença: GPLv2 ou posterior
* URI da licença: {LICENSE_URI}
* Traduções: Português(Brasil)

## Descrição

{COLE A DESCRIÇÃO DO README.TXT — seção == Description ==. NUNCA invente nem resuma demais; preserve o texto real.}

## 📥 Como instalar?

1. Acesse o painel de administração do WordPress e vá para **Plugins > Adicionar Novo**.
2. Pesquise por "{PLUGIN_NAME}".
3. Encontre o plugin, clique em **Instalar Agora** e depois em **Ativar**.
4. **Pronto!** O plugin funciona automaticamente.

## 🔄 Fluxo de Desenvolvimento

Este plugin utiliza um fluxo de desenvolvimento automatizado com:
- **Análise de segurança** via CodeQL
- **Verificação de qualidade** WordPress Plugin Check
- **Releases automatizados** com versionamento semântico
- **Testes de compatibilidade** em múltiplas versões do PHP

## 📋 Resumo da Versão {VERSION}

{BULLETS baseados no git log — limpos, sem hashes. Ex.: "* Novo: Migração dos recursos da calculadora de frete para o shipping-simulation."}
```

### 5. Abrir o PR

Sempre `dev` → `main`:

```bash
gh pr create \
  --base main \
  --head dev \
  --title "VERSION - REPO_NAME (RESUMO_CURTO)" \
  --body "$(cat <<'EOF'
...corpo...
EOF
)"
```

### 6. Confirmar

Mostre a URL retornada pelo `gh` e o comando usado. Se o PR já existir para `dev` → `main`, `gh` vai avisar — não force `--force` sem pedir.

## Regras

- **Nunca** edite arquivos do repo para abrir o PR (é só `gh pr create`).
- Título SEMPRE `dev → main` no formato `VERSION - REPO_NAME (resumo)`.
- Corpo SEMPRE com Testado até, Requer PHP, Tag estável, Resumo da Versão e a própria versão.
- Se `version`, `tested_up` ou `php` estiverem divergindo entre header PHP e README.txt, use o **header PHP** e avise.
- Nunca inclua hashes de commit no corpo.
