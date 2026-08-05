---
name: wp-cli
description: Executa comandos WP-CLI com segurança no ambiente Local WP (com modo --test e --dry-run)
---

# wp-cli

Wrapper seguro para WP-CLI no ambiente Local WP.

## Execução

O script está em `bin/wp-cli-wrapper.sh`. Se `bash` estiver disponível, execute:

```bash
bash bin/wp-cli-wrapper.sh [--dry-run] [--test] <comando wp...>
```

### Modos
- **(normal)**: banco principal do Local WP
- `--test`: banco `local_tests` (via socket MySQL)
- `--dry-run`: exibe o comando sem executar

### Exemplos
```bash
bash bin/wp-cli-wrapper.sh plugin list
bash bin/wp-cli-wrapper.sh --test db tables
bash bin/wp-cli-wrapper.sh --test db query "SELECT * FROM wptests_options LIMIT 5"
bash bin/wp-cli-wrapper.sh --dry-run --test option get siteurl
```

### Segurança
Comandos destrutivos (`db drop`, `db reset`, `plugin delete`, etc.) exigem confirmação digitando `SIM` (maiúsculas).

### Requisitos
- Local WP em execução
- WP-CLI instalado
- MySQL CLI disponível
