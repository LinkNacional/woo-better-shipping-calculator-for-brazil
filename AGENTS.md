# AGENTS.md — Diretrizes Absolutas

Regras imutáveis. Qualquer desvio deve ser justificado no código via comentário `// REASON:`.

---

## 1. Arquitetura (SOLID + PSR-4)

### S — Single Responsibility
- 1 classe = 1 motivo para mudar.
- Separação física: `Admin/` → admin, `Public/` → frontend, `Includes/` → núcleo.
- Funções com >40 linhas: quebrar ou justificar.

### O — Open/Closed
- Extensão via hooks, nunca via edição de código existente.
- `apply_filters('wc_better_shipping_calculator_*', $value, $context)` em todo ponto de extensão.
- `do_action('wc_better_shipping_calculator_*', $data)` em todo ponto de ciclo de vida.

### L — Liskov Substitution
- Subclasse deve passar nos mesmos testes da classe pai.
- `instanceof` checks: proibidos para lógica de negócio. Usar polimorfismo.

### I — Interface Segregation
- Interfaces com ≤5 métodos.
- `interface AdminAction` ≠ `interface PublicAction`.

### D — Dependency Inversion
- Depender de interfaces/abstrações, não de concretos.
- Injeção de dependência para serviços externos (APIs, gateways).
- `@param SomeInterface` nos construtores, nunca `new ConcreteService()` dentro da classe.

### PSR-4
```
Lkn\WcBetterShippingCalculatorForBrazil\Includes\  → Includes/
Lkn\WcBetterShippingCalculatorForBrazil\Admin\      → Admin/
Lkn\WcBetterShippingCalculatorForBrazil\PublicView\  → Public/
Lkn\WcBetterShippingCalculatorForBrazil\Tests\       → tests/
```
- 1 classe por arquivo. Nome do arquivo = nome da classe.
- Namespace deve corresponder ao caminho do diretório.

---

## 2. Segurança

### Superglobais — sanitizar SEMPRE
```php
// Proibido
$id = $_GET['id'];

// Obrigatório
$id = isset($_GET['id']) ? absint($_GET['id']) : 0;
$name = isset($_POST['name']) ? sanitize_text_field(wp_unslash($_POST['name'])) : '';
```

### Nonces — toda requisição state-changing
```php
// Verificação obrigatória antes de qualquer write
if (!isset($_POST['_wpnonce']) || !wp_verify_nonce($_POST['_wpnonce'], 'wc_better_action')) {
    wp_die('Security check failed.');
}
```

### Output escaping
```php
// HTML context
echo esc_html($value);
// Attribute context
echo esc_attr($value);
// URL context
echo esc_url($url);
// Textarea/JS context
echo esc_textarea($value);
// Late escaping
echo wp_kses_post($html);
```

### SQL — prepared statements
```php
// Proibido
$wpdb->query("SELECT * FROM $wpdb->postmeta WHERE meta_key = '$key'");

// Obrigatório
$wpdb->prepare("SELECT * FROM $wpdb->postmeta WHERE meta_key = %s", $key);
```

---

## 3. Padrões WordPress

### Naming
- Classes: `WcBetterShippingCalculatorForBrazil{Nome}`
- Funções: `wc_better_shipping_calculator_{nome}`
- Hooks: `wc_better_shipping_calculator_{nome}`
- Options: `woo_better_calc_{nome}`

### Internacionalização
- Toda string visível ao usuário: `__()`, `_e()`, `_n()`
- Text domain: `woo-better-shipping-calculator-for-brazil`

### Assets
- `wp_enqueue_script()` + `wp_enqueue_style()` com versionamento
- `wp_localize_script()` para dados PHP → JS
- Dependências declaradas (jQuery, wp-api, etc.)

### Transients / Cache
- Chaves com prefixo: `woo_better_shipping_{tipo}_{chave}`
- `set_transient()` + TTL explícito. Sem TTL infinito.

---

## 4. Testes

### Estrutura
```
tests/
  bootstrap.php
  ExampleTest.php
```

### Ciclo TDD
1. **RED**: escrever teste que falha
2. **GREEN**: código mínimo para passar
3. **REFACTOR**: limpar sem quebrar testes

### Cobertura mínima
- 80% em caminhos críticos (cálculo de frete, validação de CEP, checkout)

---

## 5. Comunicação (Caveman Mode + RTK)

### Caveman Mode — ATIVO
- Zero saudações. Zero "claro!", "ótimo!", "vamos lá!".
- Zero resumos pós-entrega.
- Frases curtas. Sem períodos compostos.
- Código > prosa. Sempre.

### RTK (Rust Token Killer) — ATIVO
- Logs de terminal são comprimidos pelo RTK antes de chegar ao LLM.
- Nunca solicitar output verboso se snippet RTK estruturado já foi fornecido.
- Confiar no pré-parsing do RTK.

### Formato de resposta esperado
```
Tipo: [fix|feat|refactor|security]
Arquivo: path/to/file.php:123
Problema: descrição ≤1 linha
Solução: descrição ≤1 linha
---
[código/diff]
```

---

## 5-B. Configurações compartilhadas com a versão PRO (blocos PRO)

As opções da versão PRO vivem na MESMA página do plugin gratuito
(`wc-better-calc-checkout`, "Campos Brasileiros"). O plugin PRO **não registra
aba/página própria** — ele só reage (sanitização, dados, lógica).

- Declare o bloco e os campos no FREE com `'pro' => true` (no `title` do bloco
  e em cada campo). O bloco ganha a pílula vermelha `PRO` no nav, no banner e no
  título de cada card.
- `WcBetterShippingCalculatorForBrazilAdminProGate`:
  - `is_pro_active()` → `defined('WC_BETTER_SHIPPING_CALCULATOR_FOR_BRAZIL_PRO_VERSION')`
    (filtrável por `wc_better_shipping_calculator_is_pro_active`);
  - `guard_settings($settings)` roda em `save()`: com o PRO inativo os campos
    `pro` saem da lista do `WC_Admin_Settings::save_fields()` e a option volta
    ao `default` declarado;
  - `upgrade_url()` → constante `UPGRADE_URL` (`'#'` até a página comercial
    existir) ou `WC_BETTER_SHIPPING_CALCULATOR_PRO_UPGRADE_URL` (filtrável).
- Tipos de campo customizados: o template dispara
  `wc_better_shipping_calculator_admin_field_{type}`; registre o renderizador em
  `WcBetterShippingCalculatorForBrazilAdminDeliveryFields`.
- UI dos widgets PRO mora no FREE (o usuário explora, o valor não persiste); a
  **lógica** fica só no PRO. Nunca duplique lógica no FREE "para simular".

## 6. Build & Qualidade

```bash
npm install && composer install   # setup
npm run build                      # assets
composer test                      # phpunit (tests/*Test.php)
npm run test:js                    # testes JS (tests/js/*.test.js, node:test)
composer psalm                     # análise estática
```

- **NUNCA editar `jsCompiled/*.COMPILED.js`** — são artefatos gerados pelo webpack via `npm run build`. Edite apenas os fontes em `Public/js/*.js` (ou `Admin/js/*.js`) e rode o build para regenerar.
- Em mudanças de JS que afetam UX (máscara/validação/normalização de campo), aplicar a regra também no handler de digitação ao vivo, não só na carga inicial do valor salvo.
- !/bin/bash
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
- !/bin/bash
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
- !/bin/bash
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
- !/bin/bash
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
