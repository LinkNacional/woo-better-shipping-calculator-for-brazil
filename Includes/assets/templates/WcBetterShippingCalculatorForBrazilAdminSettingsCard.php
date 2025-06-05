<?php
if (!defined('ABSPATH')) {
    exit();
}
?>

<div id="WooBetterLinkSettingsCard" style="background-image: url('<?php echo esc_url($backgrounds['right']); ?>'), url('<?php echo esc_url($backgrounds['left']); ?>'); display:none;">
    <div id="lknCieloWoocommerceDivLogo">
        <div>
            <?php //phpcs:disable PluginCheck.CodeAnalysis.ImageFunctions.NonEnqueuedImage ?>
            <img src=<?php echo esc_url($logo); ?> alt="Logo">
            <?php //phpcs:enable ?>
        </div>
        <p><?php echo esc_attr($versions); ?></p>
    </div>
    <div id="WooBetterDivContent">
        <div id="WooBetterDivLinks">
            <div>
                <a target="_blank" href=<?php echo esc_url('https://www.linknacional.com.br/wordpress/woocommerce/rede/?utm=plugin'); ?>>
                    <b>•</b><?php echo esc_attr_e('Documentation', 'lkn-wc-gateway-cielo'); ?>
                </a>
                <a target="_blank" href=<?php echo esc_url('https://www.linknacional.com.br/wordpress/planos/?utm=plugin'); ?>>
                    <b>•</b><?php echo esc_attr_e('WordPress VIP', 'lkn-wc-gateway-cielo'); ?>
                </a>
            </div>
            <div>
                <a target="_blank" href=<?php echo esc_url('https://t.me/wpprobr'); ?>>
                    <b>•</b><?php echo esc_attr_e('Support via Telegram', 'lkn-wc-gateway-cielo'); ?>
                </a>
                <a target="_blank" href=<?php echo esc_url('https://cliente.linknacional.com.br/solicitar/wordpress-woo-gratis/?utm=plugin'); ?>>
                    <b>•</b><?php echo esc_attr_e('WP Hosting', 'lkn-wc-gateway-cielo'); ?>
                </a>
            </div>
        </div>
        <div id="WooBetterStarsDiv">
            <a target="_blank" href=<?php echo esc_url('https://wordpress.org/support/plugin/lkn-wc-gateway-cielo/reviews/#new-post'); ?>>
                <p><?php echo esc_attr_e('Rate Plugin', 'lkn-wc-gateway-cielo'); ?></p>
                <div>
                    <?php //phpcs:disable PluginCheck.CodeAnalysis.ImageFunctions.NonEnqueuedImage ?>
                    <img src=<?php echo esc_url($stars); ?> alt="Logo">
                    <?php //phpcs:enable ?>
                </div>
            </a>
        </div>
    </div>
</div>