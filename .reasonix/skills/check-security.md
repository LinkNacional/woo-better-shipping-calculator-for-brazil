---
name: check-security
description: Varre o código PHP em busca de superglobais não sanitizadas ($_GET, $_POST, etc.) — regra de segurança do AGENTS.md
---

# check-security

Varre `Includes/`, `Admin/` e `Public/` em busca de superglobais (`$_GET`, `$_POST`, `$_REQUEST`, `$_SERVER`, `$_COOKIE`) usadas sem `wp_unslash()` + sanitização.

## Modo de execução

1. Use `grep` com o padrão `\$_((GET|POST|REQUEST|SERVER|COOKIE)\[|(GET|POST|REQUEST|SERVER|COOKIE)\()` nos diretórios `Includes/`, `Admin/`, `Public/` — apenas arquivos `.php`, ignorando `vendor/`.
2. Para cada match, verifique se a linha contém `wp_unslash` OU uma função de sanitização (`sanitize_text_field`, `sanitize_email`, `sanitize_key`, `absint`, `esc_url_raw`, `wp_kses_post`, etc.).
3. Ignore linhas comentadas (`//`, `#`, `/*`, `*`).
4. Se a linha tem `isset($_...)`, extraia a parte após o `isset` e reavalie.
5. Liste as violações como: `❌ arquivo.php:linha → código`.

## Regras AGENTS.md aplicáveis
- Seção "Segurança > Superglobais — sanitizar SEMPRE"
- Seção "Segurança > SQL — prepared statements" (se houver queries com concatenação)

## Pós-análise
Se houver violações, reporte o total e indique que cada linha precisa de `wp_unslash()` + sanitização adequada ao contexto.

## Alternativa
Se `bash` estiver disponível no ambiente, execute: `bash bin/check-security.sh [--strict]`
