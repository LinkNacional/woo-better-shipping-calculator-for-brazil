<?php
if (!defined('ABSPATH')) {
    exit();
}
?>

<div id="WooBetterLinkSettingsCard" style="background-image: url('<?php echo esc_url($backgrounds['right']); ?>'), url('<?php echo esc_url($backgrounds['left']); ?>'); display:none;">
    <div id="lknWooBetterDivLogo">
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
                <a target="_blank" href=<?php echo esc_url('https://wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/'); ?>>
                    <b>•</b><?php echo esc_attr_e('Documentação', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
                <a target="_blank" href=<?php echo esc_url('https://www.linknacional.com.br/wordpress/'); ?>>
                    <b>•</b><?php echo esc_attr_e('Hosting', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
            </div>
            <div>
                <a target="_blank" href=<?php echo esc_url('https://www.linknacional.com.br/wordpress/plugins/'); ?>>
                    <b>•</b><?php echo esc_attr_e('WP Plugin', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
                <a target="_blank" href=<?php echo esc_url('https://www.linknacional.com.br/wordpress/suporte/'); ?>>
                    <b>•</b><?php echo esc_attr_e('Suporte WP', 'woo-better-shipping-calculator-for-brazil'); ?>
                </a>
            </div>
        </div>
        <div class="WooBetterSupportLinks">
            <div id="WooBetterStarsDiv">
                <a target="_blank" href=<?php echo esc_url('https://br.wordpress.org/plugins/woo-better-shipping-calculator-for-brazil/#reviews'); ?>>
                    <p><?php echo esc_attr_e('Avaliar o plugin', 'woo-better-shipping-calculator-for-brazil'); ?></p>
                    <div class="WooBetterStars">
                        <span class="dashicons dashicons-star-filled lkn-stars"></span>
                        <span class="dashicons dashicons-star-filled lkn-stars"></span>
                        <span class="dashicons dashicons-star-filled lkn-stars"></span>
                        <span class="dashicons dashicons-star-filled lkn-stars"></span>
                        <span class="dashicons dashicons-star-filled lkn-stars"></span>
                    </div>
                </a>
            </div>
            <div class="WooBetterContactLinks">
                <a href=<?php echo esc_url('https://chat.whatsapp.com/IjzHhDXwmzGLDnBfOibJKO'); ?> target="_blank">
                    <?php //phpcs:disable PluginCheck.CodeAnalysis.ImageFunctions.NonEnqueuedImage ?>
                    <img src="<?php echo esc_url($whatsapp); ?>" alt="Whatsapp Icon" class="WooBetterContactIcon">
                    <?php //phpcs:enable ?>
                </a>
                <a href=<?php echo esc_url('https://t.me/wpprobr'); ?> target="_blank">
                    <?php //phpcs:disable PluginCheck.CodeAnalysis.ImageFunctions.NonEnqueuedImage ?>
                    <img src="<?php echo esc_url($telegram); ?>" alt="Telegram Icon" class="WooBetterContactIcon">
                    <?php //phpcs:enable ?>
                </a>
            </div>
        </div>
    </div>
</div>