#!/usr/bin/env bash
# =============================================================================
# check-security.sh — Verifica violações de sanitização de superglobais
# =============================================================================
# Regra AGENTS.md: Toda superglobal ($_GET, $_POST, $_REQUEST, $_SERVER,
# $_COOKIE) deve passar por wp_unslash() + sanitização ANTES de qualquer uso.
#
# Uso:
#   ./.reasonix/skills/check-security.sh          # varre Includes/ + Admin/ + Public/
#   ./.reasonix/skills/check-security.sh --strict  # também verifica $_SESSION, $_FILES
#
# Exit codes:
#   0 — Nenhuma violação encontrada
#   1 — Violações encontradas (exibe diff com número da linha)
#   2 — Erro de execução (diretório não encontrado)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

TARGET_DIRS=("$PROJECT_ROOT/Includes" "$PROJECT_ROOT/Admin" "$PROJECT_ROOT/Public")
STRICT=false
VIOLATIONS=0
HAS_PHPCS=false

# ── Argument parsing ────────────────────────────────────────────
for arg in "$@"; do
    case "$arg" in
        --strict) STRICT=true ;;
        --help|-h)
            echo "Uso: $0 [--strict]"
            echo "Verifica violações de sanitização de superglobais em Includes/, Admin/ e Public/"
            exit 0
            ;;
    esac
done

# ── Verificar existência dos diretórios ─────────────────────────
for dir in "${TARGET_DIRS[@]}"; do
    if [[ ! -d "$dir" ]]; then
        echo "[ERRO] Diretório não encontrado: $dir" >&2
        exit 2
    fi
done

echo "=== check-security.sh ==="
echo "Alvo: Includes/ + Admin/ + Public/"
echo "Regra: \$_GET, \$_POST, \$_REQUEST, \$_SERVER, \$_COOKIE DEVEM ter wp_unslash + sanitize_*"
echo ""

# ── Padrão de superglobais ──────────────────────────────────────
SUPERGLOBAL_PATTERN='\$_((GET|POST|REQUEST|SERVER|COOKIE)\[|(GET|POST|REQUEST|SERVER|COOKIE)\()'

if $STRICT; then
    SUPERGLOBAL_PATTERN='\$_((GET|POST|REQUEST|SERVER|COOKIE|SESSION|FILES)\[|(GET|POST|REQUEST|SERVER|COOKIE|SESSION|FILES)\()'
fi

# ── Função: verificar se linha contém sanitização ───────────────
has_sanitization() {
    local line="$1"
    if echo "$line" | grep -q 'wp_unslash'; then
        return 0
    fi
    if echo "$line" | grep -qE '\b(sanitize_text_field|sanitize_email|sanitize_key|sanitize_file_name|sanitize_meta|sanitize_option|sanitize_term|sanitize_title|sanitize_user|sanitize_url|esc_url_raw|absint|floatval|intval|wp_kses_post|wp_kses|map_deep)\b'; then
        return 0
    fi
    return 1
}

# ── Varredura grep ──────────────────────────────────────────────
TEMP_FILE=$(mktemp)
trap 'rm -f "$TEMP_FILE"' EXIT

for dir in "${TARGET_DIRS[@]}"; do
    echo "[SCAN] $dir"

    while IFS= read -r line; do
        file_path=$(echo "$line" | cut -d: -f1)
        line_num=$(echo "$line" | cut -d: -f2)
        content=$(echo "$line" | cut -d: -f3-)

        if [[ "$file_path" == *"/vendor/"* ]]; then
            continue
        fi

        if ! has_sanitization "$content"; then
            if echo "$content" | grep -qE '^\s*(//|#|/\*|\*)'; then
                continue
            fi
            if echo "$content" | grep -qP '\bisset\s*\(\s*\$_'; then
                stripped=$(echo "$content" | sed 's/\bisset\s*(\s*\$_\(GET\|POST\|REQUEST\|SERVER\|COOKIE\)\[[^]]*\]\s*)//g')
                if ! echo "$stripped" | grep -qP "$SUPERGLOBAL_PATTERN"; then
                    continue
                fi
            fi

            echo "  ❌ $file_path:$line_num → $content" | tee -a "$TEMP_FILE"
            VIOLATIONS=$((VIOLATIONS + 1))
        fi
    done < <(grep -rnP "$SUPERGLOBAL_PATTERN" "$dir" --include="*.php" 2>/dev/null || true)
done

echo ""

# ── Tentar PHPCS se disponível ──────────────────────────────────
if command -v phpcs &>/dev/null; then
    HAS_PHPCS=true
elif [[ -f "$PROJECT_ROOT/vendor/bin/phpcs" ]]; then
    HAS_PHPCS=true
    PHPCS_BIN="$PROJECT_ROOT/vendor/bin/phpcs"
fi

if $HAS_PHPCS; then
    echo "[PHPCS] Regras WordPress.Security.ValidatedSanitizedInput + WordPress.Security.NonceVerification"
    PHPCS_CMD="${PHPCS_BIN:-phpcs}"

    $PHPCS_CMD \
        --standard=WordPress \
        --sniffs=WordPress.Security.ValidatedSanitizedInput,WordPress.Security.NonceVerification \
        --extensions=php \
        --ignore=vendor,node_modules,tests \
        -n \
        "$PROJECT_ROOT/Includes" "$PROJECT_ROOT/Admin" "$PROJECT_ROOT/Public" 2>/dev/null || true
    echo ""
fi

# ── Resultado final ─────────────────────────────────────────────
if [[ $VIOLATIONS -gt 0 ]]; then
    echo "=== RESULTADO: $VIOLATIONS violação(ões) encontrada(s) ==="
    echo ""
    echo "Ação necessária: Adicionar wp_unslash() + sanitize_*() em cada linha acima."
    echo "Consulte AGENTS.md — seção 'Segurança'."
    exit 1
else
    echo "=== RESULTADO: OK — Nenhuma violação de sanitização encontrada ==="
    exit 0
fi
