---
name: generate-pr
description: Gera PR-DRAFT.md no padrão Link Nacional com metadados do plugin e changelog dos commits
---

# generate-pr

Gera rascunho de Pull Request no padrão Link Nacional.

## Parâmetros (via `arguments`)

Opcionais. Se não fornecidos, extraia do código.

- **version** — versão atual (extrair do header PHP)
- **tested_up** — WP testado (extrair do header PHP ou readme.txt)
- **php** — PHP mínimo (extrair do header PHP)
- **summary** — resumo opcional para o título

## Fluxo de execução

### 1. Extrair metadados
```bash
grep -E "Plugin Name:|Version:|Requires PHP:|Tested up to:" *.php
REPO_NAME=$(basename "$PWD")
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

### 3. Criar PR-DRAFT.md

Estrutura obrigatória:

```
TITULO SUGERIDO: VERSION - REPO_NAME (Ajuste: micro-resumo baseado nos commits)

# PLUGIN_NAME

* Contribuidores: linknacional
* Testado até: TESTED_UP
* Requer PHP: PHP_VERSION
* Tag estável: VERSION
* Licença: GPLv2 ou posterior

## Descrição
[Breve descrição do plugin baseada no readme.txt]

## 📥 Como instalar?
1. Acesse o painel de administração do WordPress e vá para **Plugins > Adicionar Novo**.
2. Pesquise por "PLUGIN_NAME".
3. Encontre o plugin, clique em **Instalar Agora** e depois em **Ativar**.
4. Pronto! Nenhuma configuração adicional é necessária.

## 🔄 Fluxo de Desenvolvimento
- CodeQL para análise de segurança
- Plugin Check para validação WordPress.org
- Releases automatizados via GitHub Actions
- Testes de PHP automatizados

## 📋 Resumo da Versão VERSION
[Lista de bullet points limpa baseada nos commits, sem hashes git]
```
