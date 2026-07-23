#!/usr/bin/env bash
# =============================================================================
# wp-cli-wrapper.sh — Wrapper WP-CLI com trava de segurança para Local WP
# =============================================================================
# Uso:
#   ./.reasonix/skills/wp-cli-wrapper.sh [--dry-run] [--test] <comando wp...>
#   ./.reasonix/skills/wp-cli-wrapper.sh --test db query "SELECT 1"
#   ./.reasonix/skills/wp-cli-wrapper.sh --dry-run plugin list
#   ./.reasonix/skills/wp-cli-wrapper.sh option get siteurl
#
# Modos:
#   (normal)   → banco principal do Local WP
#   --test     → banco local_tests (socket detectado)
#   --dry-run  → exibe comando sem executar
#
# Segurança:
#   Comandos destrutivos exigem confirmação "SIM" (maiúsculas).
# =============================================================================

set -euo pipefail

# ── Globais ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
WP_PATH="$(cd "$PROJECT_ROOT/../../.." && pwd)"                 # 3 níveis acima

MYSQL_SOCKET="$(php -r 'echo ini_get("mysqli.default_socket");')"
DRY_RUN=false
TEST_MODE=false
MYSQL_USER="root"
MYSQL_PASS="root"
TEST_DB="local_tests"
MYSQL_CMD="mysql --socket=$MYSQL_SOCKET -u$MYSQL_USER -p$MYSQL_PASS"
MYSQL_CMD_SUPPRESS="${MYSQL_CMD} --silent 2>&1 | grep -v 'Using a password on the command line interface'"

WP_CLI="wp"

# ── Funções utilitárias ─────────────────────────────────────────
die() { echo "[ERRO] $1" >&2; exit 2; }
warn() { echo "[AVISO] $1" >&2; }
info() { echo "[INFO] $1"; }

# Comandos que exigem trava de segurança
is_destructive() {
    local cmd="$1"
    case "$cmd" in
        db\ drop|db\ reset|db\ clean|db\ truncate|site\ delete|plugin\ delete|theme\ delete|user\ delete)
            return 0 ;;
        *)  return 1 ;;
    esac
}

# Gatilho: confirmação SIM
security_gate() {
    local cmd="$1"
    if is_destructive "$cmd"; then
        echo ""
        warn "COMANDO DESTRUTIVO: '$cmd'"
        warn "Isso apagará dados permanentemente."
        printf "Digite SIM para continuar: "
        read -r confirmation
        if [[ "$confirmation" != "SIM" ]]; then
            die "Confirmação negada. Abortando."
        fi
        echo ""
    fi
}

# ── Verificações de ambiente ────────────────────────────────────
check_env() {
    if [[ ! -f "$WP_PATH/wp-load.php" ]]; then
        die "WordPress não encontrado em: $WP_PATH"
    fi
    if ! command -v wp &>/dev/null; then
        die "WP-CLI não encontrado no PATH"
    fi
    if ! command -v mysql &>/dev/null; then
        die "mysql CLI não encontrado no PATH"
    fi
}

# ── Modo --test: comandos db via mysql CLI ──────────────────────
run_db_test() {
    local sub="$1"
    shift || true
    local query="${*:-}"

    case "$sub" in
        tables)
            local sql="SHOW TABLES"
            ;;
        check)
            local sql="SELECT 1"
            ;;
        query)
            if [[ -z "$query" ]]; then
                die "db query requer uma query SQL. Ex: wp-cli-wrapper.sh --test db query 'SELECT * FROM wp_options'"
            fi
            local sql="$query"
            ;;
        export)
            local dump_cmd="mysqldump --socket=$MYSQL_SOCKET -u$MYSQL_USER -p$MYSQL_PASS $TEST_DB 2>/dev/null"
            if $DRY_RUN; then
                echo "[DRY-RUN] $dump_cmd"
                return
            fi
            $dump_cmd || warn "mysqldump falhou. mysqldump está no PATH?"
            return
            ;;
        import)
            warn "db import: não automatizado. Use Adminer ou: mysql --socket=$MYSQL_SOCKET -uroot -proot local_tests < dump.sql"
            return
            ;;
        *)
            die "Subcomando db desconhecido: $sub (use: tables, check, query, export, import)"
            ;;
    esac

    if $DRY_RUN; then
        echo "[DRY-RUN] $MYSQL_CMD $TEST_DB -e \"$sql\""
        return
    fi

    $MYSQL_CMD "$TEST_DB" -e "$sql" 2>&1 | grep -v "Using a password on the command line interface" || true
}

# ── Modo --test: comandos não-db via wp-config.php temporário ───
run_wp_test() {
    local args=("$@")

    # Cria dir temporário com symlinks pro core
    local tmp_wp
    tmp_wp="$(mktemp -d)"

    # Symlinks do core WordPress
    for item in wp-settings.php wp-load.php wp-admin wp-includes; do
        if [[ -e "$WP_PATH/$item" ]]; then
            ln -s "$WP_PATH/$item" "$tmp_wp/$item"
        fi
    done

    # wp-config.php temporário com socket
    cat > "$tmp_wp/wp-config.php" <<WPCONFIG
<?php
define('DB_NAME', '$TEST_DB');
define('DB_USER', '$MYSQL_USER');
define('DB_PASSWORD', '$MYSQL_PASS');
define('DB_HOST', 'localhost:$MYSQL_SOCKET');
define('DB_CHARSET', 'utf8');
define('DB_COLLATE', '');
\$table_prefix = 'wptests_';
if (!defined('ABSPATH')) { define('ABSPATH', '$WP_PATH/'); }
WPCONFIG

    if $DRY_RUN; then
        echo "[DRY-RUN] $WP_CLI --path=$tmp_wp ${args[*]}"
        rm -rf "$tmp_wp"
        return
    fi

    # Executa wp-cli, filtra warnings esperados
    $WP_CLI --path="$tmp_wp" "${args[@]}" 2>&1 | grep -vE \
        -e 'Warning:.*ABSPATH.*already defined' \
        -e 'PHP Warning:' \
        -e 'PHP Notice:' \
        -e 'URL redirect is disabled' \
        -e '^$' \
        || true

    rm -rf "$tmp_wp"
}

# ── Modo normal ─────────────────────────────────────────────────
run_wp_normal() {
    local args=("$@")

    if $DRY_RUN; then
        echo "[DRY-RUN] $WP_CLI --path=$WP_PATH ${args[*]}"
        return
    fi

    $WP_CLI --path="$WP_PATH" "${args[@]}" 2>&1 || true
}

# ── Garantir que o banco local_tests existe ─────────────────────
ensure_test_db() {
    if ! $DRY_RUN; then
        $MYSQL_CMD -e "CREATE DATABASE IF NOT EXISTS \`$TEST_DB\`" 2>&1 | grep -v "Using a password" || {
            warn "Não foi possível criar o banco '$TEST_DB'."
            warn "Crie manualmente via Adminer do Local WP"
            warn "  Database: $TEST_DB | User: $MYSQL_USER | Pass: $MYSQL_PASS"
            return 1
        }
    fi
}

# ── Main ────────────────────────────────────────────────────────
main() {
    local args=()
    local cmd_first=""

    # Parse flags
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --test)
                TEST_MODE=true
                shift
                ;;
            --help|-h)
                echo "Uso: $0 [--dry-run] [--test] <comando wp...>"
                echo ""
                echo "Exemplos:"
                echo "  $0 plugin list"
                echo "  $0 --test db tables"
                echo "  $0 --test db query 'SELECT * FROM wptests_options LIMIT 5'"
                echo "  $0 --dry-run --test option get siteurl"
                echo "  $0 --test db export > dump.sql"
                exit 0
                ;;
            *)
                args+=("$1")
                shift
                ;;
        esac
    done

    if [[ ${#args[@]} -eq 0 ]]; then
        die "Nenhum comando especificado. Use --help."
    fi

    cmd_first="${args[0]}"

    check_env

    # Trava de segurança (pula em dry-run)
    if ! $DRY_RUN; then
        security_gate "$cmd_first"
    fi

    if $TEST_MODE; then
        ensure_test_db

        if [[ "$cmd_first" == "db" ]]; then
            # Comandos db → mysql CLI direto
            local sub="${args[1]:-}"
            shift 2 || true
            run_db_test "$sub" "${args[@]:-}"
        else
            # Outros comandos → wp-config.php temporário
            run_wp_test "${args[@]}"
        fi
    else
        # Modo normal
        run_wp_normal "${args[@]}"
    fi
}

main "$@"
