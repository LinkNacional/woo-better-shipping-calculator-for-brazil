---
name: plugin-check
description: Executa wp plugin check (WordPress.org) no plugin atual via WP-CLI
---

# plugin-check

Executa `wp plugin check` do WordPress.org no plugin atual.

## Execução

Se `bash` e `wp` estiverem disponíveis:

```bash
bash bin/plugin-check.sh
```

O script:
1. Verifica se WP-CLI está disponível
2. Instala o plugin `plugin-check` se necessário
3. Executa o check ignorando diretórios não relevantes (`vendor`, `node_modules`, `tests`, `.reasonix`, etc.)
4. Retorna JSON com erros e warnings
5. Exit code 0 = limpo, 1 = tem erros/warnings, 2 = falha de execução
