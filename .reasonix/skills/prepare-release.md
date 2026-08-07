---
name: prepare-release
description: Prepara release: atualiza readme.txt, readme.md, CHANGELOG.md, cabeçalho PHP, constante VERSION, fallback, testes, .yml workflows baseado no git log
---

# prepare-release

Atualiza **todos** os arquivos que contêm o número de versão para uma nova release do plugin.

## Parâmetros (via `arguments`)

O usuário pode passar os valores diretamente: `"version=1.4.0 tested_up=6.5 php=8.0 highlights=Correção de bug X"`. Se algum valor faltar, pergunte.

- **version** — nova versão (Stable tag)
- **tested_up** — versão do WP testada (Tested up to)
- **php** — versão mínima do PHP (Requires PHP)
- **highlights** — resumo da versão (opcional, usa git log se vazio)

## Fluxo de execução

### 1. Coletar valores
Se não recebidos via arguments, pergunte ao usuário um por um. Detecte a versão atual via grep no `.php` raiz:
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

### 3. Atualizar TODOS os arquivos com versão

A versão aparece em **11 locais** espalhados por **8 arquivos**. Atualize todos:

#### 3a. `readme.txt`
- `Stable tag:` → nova versão
- `Tested up to:` e `Requires PHP:` se alterados
- Adicionar entrada no `== Changelog ==` (topo da seção), **sempre em inglês**, usando a **data de hoje** (obtida via `date +%Y-%m-%d`). Deixar uma **linha em branco** entre a nova entrada e a anterior:
  ```
  # VERSION - YYYY-MM-DD
  * Item baseado nos commits

  # VERSAO_ANTERIOR - YYYY-MM-DD
  ```
- Se `highlights` foi fornecido, avalie adicionar na `== Description ==` (NUNCA apague conteúdo existente)

#### 3b. `CHANGELOG.md`
- Adicionar entrada no topo do arquivo, **em português**, usando a **data de hoje** (obtida via `date +%d/%m/%y`):
  ```
  # VERSION - DD/MM/AA
  * Item baseado nos commits
  ```

#### 3c. `README.md`
- Atualizar **três** campos no cabeçalho:
  - `* Tag estável: NOVA_VERSION`
  - `* Testado até: NOVO_TESTED_UP`
  - `* Requer PHP: NOVO_PHP`

#### 3d. Arquivo PHP principal (`.php` raiz com `Plugin Name:`)
- `* Version: NOVA_VERSION` (cabeçalho do plugin)
- `define('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION', 'NOVA_VERSION')` (constante)

#### 3e. `Includes/WcBetterShippingCalculatorForBrazil.php`
- `$this->version = 'NOVA_VERSION'` (fallback quando a constante não está definida)

#### 3f. `tests/ExampleTest.php`
- `$this->assertEquals( 'NOVA_VERSION', WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_VERSION )` (asserção de teste)

#### 3g. `.github/workflows/main.yml`
- `DEPLOY_TAG: "NOVA_VERSION"` (tag de deploy do workflow principal)

#### 3h. `.github/workflows/release-candidate.yml`
- `DEPLOY_TAG: "NOVA_VERSION-rc.1"` (tag de deploy do release candidate)

#### 3i. `.github/workflows/wordpress-release.yml`
- `DEPLOY_TAG: "NOVA_VERSION"` (tag de deploy do release WordPress.org)

#### 3j. `Includes/WcBetterShippingCalculatorForBrazil.php` — `$old_versions`
- Localizar o array `$old_versions`. Aplicar DUAS operações atômicas: (a) remover o **último** elemento do array, (b) adicionar `VERSAO_ANTIGA` como **primeiro** elemento.
- ⚠️ **O array NUNCA deve crescer.** Antes e depois o array DEVE ter o mesmo número de elementos.
- Exemplo concreto:
  ```php
  // Antes (14 elementos):  array( '4.16.9', '4.16.8', '4.16.7', ..., '4.15.0', '4.14.0' );
  // Depois (14 elementos): array( '4.16.10', '4.16.9', '4.16.8', '4.16.7', ..., '4.15.0' );
  ```
  Último (`'4.14.0'`) sai. `'4.16.10'` entra no início. Total: 14 → 14.

### 4. Validação final
Rodar grep com a versão **antiga** para confirmar que não restou nenhuma ocorrência fora do esperado:
```
grep -r "VERSAO_ANTIGA" --include="*.php" --include="*.md" --include="*.txt" --include="*.yml" .
```
O esperado: `readme.txt` e `CHANGELOG.md` ainda contêm a versão antiga **apenas** nas entradas antigas do Changelog (isso é correto). Qualquer outro arquivo retornando a versão antiga é **erro** e deve ser corrigido.

Depois, grep com a versão **nova** para confirmar que aparece em todos os **11+ locais** (8 arquivos):
```
grep -rn "NOVA_VERSAO" --include="*.php" --include="*.md" --include="*.txt" --include="*.yml" .
```
Deve retornar 11+ matches (múltiplas entradas no changelog do `readme.txt` são normais).
