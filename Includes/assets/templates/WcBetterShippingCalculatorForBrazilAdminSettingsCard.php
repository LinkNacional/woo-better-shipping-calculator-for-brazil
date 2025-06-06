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
                <a target="_blank" href=<?php echo esc_url('https://github.com/LinkNacional/woo-better-shipping-calculator-for-brazil/'); ?>>
                    <b>•</b><?php echo esc_attr_e('Documentation', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
                <a target="_blank" href=<?php echo esc_url('https://www.linknacional.com.br/wordpress/planos/?utm=plugin'); ?>>
                    <b>•</b><?php echo esc_attr_e('WordPress VIP', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
            </div>
            <div>
                <a target="_blank" href=<?php echo esc_url('https://t.me/wpprobr'); ?>>
                    <b>•</b><?php echo esc_attr_e('Support via Telegram', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
                <a target="_blank" href=<?php echo esc_url('https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/'); ?>>
                    <b>•</b><?php echo esc_attr_e('WP Plugin', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
            </div>
        </div>
        <div id="WooBetterStarsDiv">
            <a target="_blank" href=<?php echo esc_url('https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews'); ?>>
                <p><?php echo esc_attr_e('Rate Plugin', 'woo-better-shipping-calculator-for-brazil'); ?></p>
                <div>
                    <?php //phpcs:disable PluginCheck.CodeAnalysis.ImageFunctions.NonEnqueuedImage ?>
                    <img src=<?php echo esc_url($stars); ?> alt="Logo">
                    <?php //phpcs:enable ?>
                </div>
            </a>
        </div>
    </div>
</div>