<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes;
// Prevent direct access
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Fired during plugin activation
 *
 * @link       https://linknacional.com.br
 * @since      1.0.0
 *
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 */

/**
 * Fired during plugin activation.
 *
 * This class defines all code necessary to run during the plugin's activation.
 *
 * @since      1.0.0
 * @package    WcBetterShippingCalculatorForBrazil
 * @subpackage WcBetterShippingCalculatorForBrazil/includes
 * @author     Link Nacional <contato@linknacional.com>
 */
class WcBetterShippingCalculatorForBrazilActivator {

	/**
	 * Short Description. (use period)
	 *
	 * Long Description.
	 *
	 * @since    1.0.0
	 */
	public static function activate() {
		// Verifica se é multisite
		if (is_multisite()) {
			// Se estiver ativando na rede, ativa em todos os sites
			if (isset($_GET['networkwide']) && $_GET['networkwide'] == '1') {
				global $wpdb;
				
				// Obter todos os sites da rede
				$blog_ids = $wpdb->get_col("SELECT blog_id FROM $wpdb->blogs");
				
				foreach ($blog_ids as $blog_id) {
					switch_to_blog($blog_id);
					self::activate_single_site();
					restore_current_blog();
				}
				
				return;
			}
		}
		
		// Ativação em site único ou site individual do multisite
		self::activate_single_site();
	}
	
	/**
	 * Ativação em um site individual
	 * 
	 * @since 4.7.0
	 */
	private static function activate_single_site() {
		// Verificar se o WooCommerce está ativo
		if (!is_plugin_active('woocommerce/woocommerce.php')) {
			// Apenas mostrar aviso, não bloquear ativação pois pode ser ativado depois
			add_action('admin_notices', function() {
				echo '<div class="error"><p><strong>Calculadora de Frete e Campos Checkout para o Brasil:</strong> Este plugin requer o WooCommerce para funcionar corretamente.</p></div>';
			});
		}
		
		// Definir opções padrão se não existirem
		$default_options = array(
			'woo_better_calc_disabled_shipping' => 'default',
			'woo_better_calc_person_type_select' => 'none',
			'woo_better_calc_number_required' => 'no',
			'woo_better_calc_contact_required' => 'no',
			'woo_better_calc_enable_neighborhood_field' => 'no',
			'woo_better_calc_enable_order_details' => 'yes',
			'woo_better_calc_font_source' => 'yes',
			'woo_better_enable_min_free_shipping' => 'no',
			'woo_better_min_free_shipping_value' => '0',
			'woo_better_calc_enable_cart_page' => 'yes',
			'woo_better_calc_enable_product_page' => 'yes',
			'woo_better_calc_enable_auto_postcode_search' => 'yes',
			'woo_better_calc_cache_expiration_time' => '0',
			'woo_better_calc_enable_auto_cache_reset' => 'WCBCB_9X2K4M7P5R8T3N6Y1Q',
			'woo_better_calc_cep_field_position' => 'no',
			'woo_better_calc_enable_auto_address_fill' => 'no',
			'woo_better_calc_cart_input_icon' => 'transit',
			'woo_better_calc_product_input_icon' => 'transit',
			'woo_better_calc_enable_settings_link' => 'no',
			'woo_better_calc_apply_cpf_mask' => 'yes',
			'woo_better_calc_apply_cnpj_mask' => 'yes'
		);
		
		foreach ($default_options as $option_name => $default_value) {
			if (get_option($option_name) === false) {
				add_option($option_name, $default_value);
			}
		}
		
		// Criar diretório de cache se necessário
		$upload_dir = wp_upload_dir();
		$cache_dir = $upload_dir['basedir'] . '/woo-better-shipping-cache/';
		
		if (!file_exists($cache_dir)) {
			wp_mkdir_p($cache_dir);
		}
		
		// Flush rewrite rules se necessário
		flush_rewrite_rules();
	}

}
