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
  - `is_pro_unlocked()` → **`is_pro_active()` E licença em vigor**. É o que a
    tela usa para decidir pílula/banner/salvamento (filtrável por
    `wc_better_shipping_calculator_is_pro_unlocked`);
  - `guard_settings($settings)` roda em `save()`: sem `is_pro_unlocked()` os
    campos `pro` saem da lista do `WC_Admin_Settings::save_fields()` e a option
    volta ao `default` declarado;
  - `upgrade_url()` → constante `UPGRADE_URL` (página comercial do PRO) ou
    `WC_BETTER_SHIPPING_CALCULATOR_PRO_UPGRADE_URL` (filtrável);
  - `is_pro_installed()` → plugin **no disco** (ativo ou não): `is_pro_active()`
    || `file_exists(WP_PLUGIN_DIR . PRO_BASENAME)`, com varredura por
    `get_plugins()` em admin para pasta renomeada por reinstalação
    (`...-pro-1`). Filtrável por `wc_better_shipping_calculator_is_pro_installed`;
  - `should_offer_purchase()` → `! is_pro_installed()` (filtrável por
    `wc_better_shipping_calculator_should_offer_purchase`). Ver 5-C.
- Tipos de campo customizados: o template dispara
  `wc_better_shipping_calculator_admin_field_{type}`; registre o renderizador em
  `WcBetterShippingCalculatorForBrazilAdminDeliveryFields`.
- UI dos widgets PRO mora no FREE (o usuário explora, o valor não persiste); a
  **lógica** fica só no PRO. Nunca duplique lógica no FREE "para simular".

### Portão: instalar NÃO é licenciar

`is_pro_active()` ("o plugin PRO está carregado") **não** basta para liberar a
UI. O PRO sem licença não registra nenhum hook de recurso
(`Manager::features_enabled()` é falso em `define_public_hooks()`), então
liberar a tela nesse estado é prometer o que o código não faz — era o bug de
quem baixava o `.zip`, ativava o plugin e via tudo liberado, com as pílulas e o
banner de aviso sumindo e os campos PRO sendo **gravados** sem efeito nenhum.

A decisão única é `is_pro_unlocked()` = `is_pro_active()` + a resposta do
`Manager` do PRO (`PRO_LICENSE_MANAGER`, consultado via `instance()` — o MESMO
objeto que `activate_key()`/`deactivate_site()` invalidam, para não ler estado
velho de meio de requisição). Se a classe não carregar, o portão **fecha**.

O banner do bloco bloqueado tem dois textos: PRO ativo sem licença fala da
**licença** ("enquanto a licença do PRO não estiver ativa"), PRO ausente fala
do **plugin**. O card do sidebar continua decidido por `is_pro_installed()`
(5-C): licença ausente não ressuscita o card branco de compra.

## 5-C. Sidebar das configurações: UM cartão do PRO por vez

A coluna lateral da tela de configurações termina com **um** cartão do PRO (o
restante — card da Link Nacional + cards verdes de novidades — vem antes). São
dois possíveis, mutuamente exclusivos (`if/else` no template):

| Card | Classe | Quando aparece |
| --- | --- | --- |
| Branco (compra) | `block-pro-offer` | PRO **fora** do site (`should_offer_purchase()`) |
| Roxo (conheça mais) | `block-promotional-card` | PRO **instalado**, ativo ou não |

- O branco traz a lista de recursos, o piso do preço (`license_price()`), a nota
  de licença anual/volume e o CTA `Adquirir a licença`
  (`data-lkn-billing-open` → pop-up de compra). O pop-up só é impresso junto com
  ele: **este CTA é o único gatilho** do pop-up na tela.
- O roxo é o link para `ProGate::upgrade_url()` (botão "Conheça mais"), com
  gradiente `#667eea → #764ba2`. Não é CTA de compra: é "conhecer o produto".
- Quem decide é a **presença do plugin** (`is_pro_installed()`), não a licença e
  nem o "está ativo": desativar o PRO não apaga os arquivos. Duas regressões já
  vieram daqui — os DOIS cartões juntos (com `is_pro_active()`, o plugin
  desativado ressuscitava o de compra) e a tela sem cartão nenhum. Instalar o
  PRO sem comprar deixa o bloco "Licença" (injetado pelo PRO nesta mesma tela)
  como caminho.
- `proInstalled` (config do pop-up) usa a mesma detecção: o pop-up nunca tenta
  instalar por cima de uma pasta que já existe. Na prática ele sai sempre
  `false`, porque o pop-up só é impresso junto do card branco (PRO ausente) —
  o parâmetro fica para o caso de o plugin aparecer no disco entre o render e o
  clique.
- CSS em `Admin/css/WcBetterShippingCalculatorForBrazilAdminLayoutSettings.css`
  (`/* Card promocional roxo */`), compilado por `npm run build:css` em
  `Admin/cssCompiled/*.COMPILED.css` (esse é o arquivo enfileirado).
- Regressão: `tests/ProPurchaseCardTest.php`.

---

## 5-D. Pop-up de compra da licença (`Includes/Billing/`)

O pop-up vive no FREE e conversa com a API de cobrança (não com a de licença).

**Fluxo (máquina de estados no `assets/billing.js`, markup em `Popup.php`):**

```
email (e-mail + forma de pagamento) -> pix | card -> (pix: pix-wait)
      -> fulfilling -> ready -> tasks (instalar/ativar/configurações)
```

- A **operadora não é perguntada**. O par meio → PSP é fixo em
  `METHOD_PROVIDER = { pix: 'rede', card: 'cielo' }` (JS) e cada botão de meio
  carrega `data-lkn-provider`. Antes eram três passos (e-mail → operadora →
  método) e dava para pedir Pix na Cielo.
- O **"Continuar" nasce `disabled`** e só libera com e-mail válido **e** um meio
  marcado (`refreshContinue()`, reavaliado no `input` do e-mail, no clique do
  meio, ao abrir e ao voltar para a tela). Clicar num meio **só marca**
  (`aria-pressed` + `.is-selected`): quem avança é o "Continuar".
- `applyGateways()` roda depois do `/checkout/start` (é ali que a API informa os
  PSPs habilitados): esconde o meio cujo PSP não veio, pré-marca o único
  restante e, se o meio já escolhido desapareceu, volta à primeira tela com
  aviso em vez de mandar um `provider` que a API recusaria (`unknown_provider`).
- `.lkn-billing__method` é `display: flex`, então **precisa** de
  `.lkn-billing__method[hidden] { display: none }` — sem isso esconder não
  esconde.
- `proInstalled` (config do pop-up) vem de `ProGate::is_pro_installed()`.

**Why:** escolher PSP é decisão que o lojista não tem como tomar bem, e o
contrato comercial já é fixo; separar meio e operadora só criava combinação
inválida. **How to apply:** mexer no fluxo = `Popup.php` (markup) + `billing.js`
(estado) + `Billing.php` (i18n no `wp_add_inline_script`); regressão em
`tests/ProPurchaseCardTest.php`.

---

## 5-E. Layout das configurações: nunca alargar a página

A tela roda dentro do `#wpbody-content`, que no wp-admin é
`overflow: visible !important`: **qualquer** coisa que passe da borda direita do
container vira barra de rolagem horizontal no documento inteiro. Duas regras
seguram isso, e as duas têm teste (`tests/AdminLayoutOverflowTest.php`):

1. `.admin-layout-content` tem `min-width: 0`. Ele é item de flex de
   `.admin-layout-page-wrapper` e o mínimo automático de item de flex é
   `min-content`; como o nav de abas é `flex-wrap: nowrap` com uma aba por
   bloco, esse mínimo fica maior que a tela. O `overflow: hidden` do
   `.admin-layout-top-menu-clip` **esconde** as abas que sobram, mas não encolhe
   o mínimo — era esse o "o nav estica a página mesmo cortado".
2. As setas do carrossel ficam **dentro** da caixa do nav. Elas eram
   `left/right: -30px`; offset negativo de elemento posicionado conta para o
   overflow do ancestral. Com `.has-overflow` a caixa ganha `padding: 0 30px` e
   as setas vão para `left/right: 0` (o recuo só entra quando há o que rolar).

Ao mexer no layout, confira no navegador: `document.documentElement.scrollWidth`
tem de ser igual a `clientWidth` em 1920/1440/1024/782/500 px, com e sem o
carrossel ativo (`.has-overflow`). Edite o CSS **fonte** em `Admin/css/` e rode
`npm run build:css` — o plugin carrega o `.COMPILED.css`.

---

## 5-F. Link final do fluxo de compra: abre a aba do recurso PRO

O pop-up de compra termina com "Ir para configurações". Esse link não vai para a
raiz da tela — vai para o bloco do recurso que o cliente acabou de comprar:

| Plugin | Bloco | Constante |
| --- | --- | --- |
| woo-better | `pro_prazo_entrega` (Prazo de Entrega) | `Billing::LANDING_BLOCK` |
| shipping | `pro_popup_cep` (Pop-up de CEP) | `Billing::LANDING_BLOCK` |

`Billing::settings_url()` acrescenta `?lkn_open=<bloco>` (filtrável por
`wc_better_shipping_calculator_landing_block` / `wc_shipping_simulator_landing_block`;
string vazia desliga).

**Quem interpreta é o template do layout, no SERVIDOR**: ele marca o bloco pedido
como `active` no markup. O JS das abas parte do link que já tem `.active` e faz o
resto (inclusive rolar o carrossel). Não use JS/`load` para isso — depender da
hora em que o handler das abas fica pronto fazia a primeira aba piscar antes de
trocar.

Regras: o id vem de `sanitize_key()` (**não** `sanitize_title()`, que troca `_`
por `-` e quebra `pro_prazo_entrega`); o bloco precisa **existir** na tela; e
bloco `pro` só é destino com `is_pro_unlocked()` — cair numa aba bloqueada
(banner de venda) é pior que cair na primeira. O nav tem abas, não âncoras:
`#bloco` na URL não faz nada.

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

---

## 7. Configurações do admin: "desabilitado" é só VISUAL

**NUNCA** use o atributo `disabled` (nem `element.disabled = true`, `$.prop('disabled', true)`,
`disabled(...)` no PHP) para fingir que um campo de configuração está desabilitado por
dependência de outro campo. Use `window.wcBetterFakeDisabled(elementos, true|false)`
(`Admin/js/WcBetterShippingCalculatorForBrazilAdminFakeDisabled.js` + classe
`.woo-better-fake-disabled` do `AdminSettings.css`).

**Por quê (bug grotesco da 5.2.0):** input `disabled` **não vai no POST**. O
`WC_Admin_Settings::save_fields()` recebe `null`, cai no `continue` e **mantém o valor
antigo da option**. Resultado: a tela mostrava "Não"/cinza (o JS ainda forçava
`checked = 'no'`), o banco continuava `yes` e o checkout **seguia gerando o campo**
— era assim que um "Campo de Celular" desabilitado no admin aparecia no checkout, e o
mesmo valia para "Celular Obrigatório", "Preenchimento Automático por CEP", "DDI",
"Validar Número de Telefone", "Tempo Mínimo de Preparo" etc.

**Regras:**
- O input continua **habilitado** e o valor exibido (inclusive o que o JS força em
  `checked`) é o valor **enviado**. Tela e banco nunca divergem.
- Bloqueio de interação: clique/`mousedown`/teclado em fase de **captura** (o
  `preventDefault` no `<label>` também impede a ativação), não `pointer-events`.
- O valor coerente com o pai desligado continua sendo forçado no JS **e** reforçado no
  servidor (ex.: `enforce_cellphone_options_for_mode()`), como rede de segurança para
  quem salva com JS bloqueado.
- Exceção: campos **sem `name`** cujo valor é lido pelo próprio JS (checkboxes/horários
  do "Prazo de Entrega", que sincronizam um hidden JSON) podem usar `disabled` real —
  eles não são enviados pelo POST de qualquer forma.
- Guarda de regressão: `tests/js/admin-fake-disabled.test.js` falha se voltar
  `disabled` em campo de opção das telas de configuração.

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
