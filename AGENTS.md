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

## 6. Build & Qualidade

```bash
npm install && composer install   # setup
npm run build                      # assets
composer test                      # phpunit
composer psalm                     # análise estática
```
