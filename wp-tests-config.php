<?php
/**
 * Configuração de testes integrados para WP PHPUnit.
 *
 * Este arquivo é carregado pelo bootstrap do wp-phpunit/wp-phpunit.
 * O banco de dados `local_tests` deve ser criado via Adminer do Local WP.
 *
 * IMPORTANTE: NÃO use o mesmo banco de dados do site de desenvolvimento.
 * Os testes recriam as tabelas (prefixo wptests_) e destroem dados existentes.
 *
 * @package WcBetterShippingCalculatorForBrazil
 */

/* -------------------------------------------------------------------------- */
/*  Detecção automática do WordPress do Local WP                              */
/* -------------------------------------------------------------------------- */

// Sobe a partir de wp-content/plugins/woo-better-shipping-calculator-for-brazil/
// Estrutura esperada: app/public/wp-content/plugins/plugin-name/
if ( ! defined( 'ABSPATH' ) ) {
    // Tenta detecção automática: sobe 3 níveis (plugins → wp-content → app/public)
    $candidate_root = dirname( __DIR__, 3 );

    // Se não encontrou wp-load.php, permite override via constante de ambiente
    if ( ! file_exists( $candidate_root . '/wp-load.php' ) ) {
        $candidate_root = getenv( 'LOCAL_WP_PATH' ) ?: dirname( __DIR__, 3 );
    }

    define( 'ABSPATH', rtrim( $candidate_root, '/' ) . '/' );
}

/* -------------------------------------------------------------------------- */
/*  Banco de dados de teste (local_tests)                                     */
/* -------------------------------------------------------------------------- */

define( 'DB_NAME', getenv( 'WP_TESTS_DB_NAME' ) ?: 'local_tests' );
define( 'DB_USER', getenv( 'WP_TESTS_DB_USER' ) ?: 'root' );
define( 'DB_PASSWORD', getenv( 'WP_TESTS_DB_PASSWORD' ) ?: 'root' );

// Local WP: tenta socket primeiro (Linux no Docker), fallback para localhost
$socket_path = getenv( 'WP_TESTS_DB_SOCKET' ) ?: '';
if ( $socket_path && file_exists( $socket_path ) ) {
    define( 'DB_HOST', $socket_path );
} else {
    define( 'DB_HOST', getenv( 'WP_TESTS_DB_HOST' ) ?: 'localhost' );
}

// Charset e collation
define( 'DB_CHARSET', 'utf8' );
define( 'DB_COLLATE', '' );

/* -------------------------------------------------------------------------- */
/*  Prefixo das tabelas de teste                                              */
/* -------------------------------------------------------------------------- */

$table_prefix = 'wptests_';

/* -------------------------------------------------------------------------- */
/*  Constantes obrigatórias do wp-phpunit                                     */
/* -------------------------------------------------------------------------- */

define( 'WP_TESTS_DOMAIN', 'example.org' );
define( 'WP_TESTS_EMAIL', 'admin@example.org' );
define( 'WP_TESTS_TITLE', 'Test Blog' );
define( 'WP_PHP_BINARY', 'php' );

/* -------------------------------------------------------------------------- */
/*  Configuração de multisite (desabilitado por padrão)                       */
/* -------------------------------------------------------------------------- */

// define( 'WP_TESTS_MULTISITE', true );

/* -------------------------------------------------------------------------- */
/*  Desabilita instalação automática se as tabelas já existirem                */
/* -------------------------------------------------------------------------- */

// Para pular a instalação do zero e reaproveitar tabelas existentes:
// putenv( 'WP_TESTS_SKIP_INSTALL=1' );
