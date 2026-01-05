<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes;

// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Fired during plugin deactivation
 *
 * @link       https://linknacional.com.br
 * @since      1.0.0
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 */

/**
 * Fired during plugin deactivation.
 *
 * This class defines all code necessary to run during the plugin's deactivation.
 *
 * @since      1.0.0
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 * @author     Link Nacional <contato@linknacional.com>
 */
class WcBetterShippingCalculatorForBrazilDeactivator
{
    /**
     * Short Description. (use period)
     *
     * Long Description.
     *
     * @since    1.0.0
     */
    public static function deactivate()
    {
        // Verifica se é multisite
        if (is_multisite()) {
            // Se estiver desativando da rede, desativa em todos os sites
            if (isset($_GET['networkwide']) && $_GET['networkwide'] == '1') {
                global $wpdb;
                
                // Obter todos os sites da rede
                $blog_ids = $wpdb->get_col("SELECT blog_id FROM $wpdb->blogs");
                
                foreach ($blog_ids as $blog_id) {
                    switch_to_blog($blog_id);
                    self::deactivate_single_site();
                    restore_current_blog();
                }
                
                return;
            }
        }
        
        // Desativação em site único ou site individual do multisite
        self::deactivate_single_site();
    }
    
    /**
     * Desativação em um site individual
     * 
     * @since 4.7.0
     */
    private static function deactivate_single_site()
    {
        // Limpar cache se existir
        $upload_dir = wp_upload_dir();
        $cache_dir = $upload_dir['basedir'] . '/woo-better-shipping-cache/';
        
        if (file_exists($cache_dir)) {
            $files = glob($cache_dir . '*');
            foreach ($files as $file) {
                if (is_file($file)) {
                    wp_delete_file($file);
                }
            }
        }
        
        // Limpar transients do plugin
        global $wpdb;
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                '_transient_woo_better_shipping%'
            )
        );
        
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
                '_transient_timeout_woo_better_shipping%'
            )
        );
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }

}
