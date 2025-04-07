<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes;

abstract class WcBetterShippingCalculatorForBrazilHelpers
{
    protected static $values = [];

    // Get the value if set, otherwise return a default value or `null`. Prevents notices when data is not set.
    public static function get(&$var, $default = null)
    {
        return isset($var) ? $var : $default;
    }

    // Get the constant if set, otherwise return a default value or `null`.
    public static function get_defined($name, $default = null)
    {
        return defined($name) ? constant($name) : $default;
    }

    // returns `false` ONLY IF $var is null, empty array/object or empty string
    // note: `$var = false` returns `true` (because $var is filled with a boolean)
    public static function filled($var)
    {
        if (null === $var) {
            return false;
        }
        if (is_string($var) && '' === trim($var)) {
            return false;
        }
        if (is_array($var) && 0 === count($var)) {
            return false;
        }
        if (is_object($var) && 0 === count((array) $var)) {
            return false;
        }
        return \apply_filters(WcBetterShippingCalculatorForBrazilHelpers::prefix('is_value_filled'), true, $var);
    }

    // CONFIG SETTER AND GETTER
    public static function config_get($key, $default = null)
    {
        return WcBetterShippingCalculatorForBrazilHelpers::config_class_get($key, $default);
    }

    public static function config_set($key, $value)
    {
        return WcBetterShippingCalculatorForBrazilHelpers::config_class_set($key, $value);
    }

    public static function config_class_set($key, $value)
    {
        $key = mb_strtoupper($key);
        if (isset(self::$values[ $key ])) {
            throw new \Error(esc_html(__METHOD__ . ": Key \"$key\" has already been assigned. No key can be assigned more than once."));
        }
        self::$values[ $key ] = $value;
        return $value;
    }

    public static function config_class_get($key, $default = null)
    {
        $key = \mb_strtoupper($key);

        if (!isset(self::$values[$key])) {
            return $default;
        }

        return self::$values[$key];
    }

    // PLUGIN SLUG AND PREFIX
    public static function get_slug()
    {
        return WcBetterShippingCalculatorForBrazilHelpers::config_get('SLUG');
    }

    public static function prefix($appends = '', $sanitize = true)
    {
        $appends = $sanitize && $appends ? WcBetterShippingCalculatorForBrazilHelpers::sanitize_slug($appends, '_') : $appends;
        return 'wc_better_shipping_calculator_for_brazil_' . $appends;
    }

    // DEBUG
    public static function dd(...$values)
    {
        if (! WP_DEBUG) {
            return;
        }

        foreach ($values as $v) {
            $json = wp_json_encode($v, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
            echo '<pre>' . esc_html($json) . '</pre>';
        }

        exit(1);
    }

    public static function log(...$values)
    {
        if (! defined('WP_DEBUG_LOG') || ! WP_DEBUG_LOG) {
            return;
        }
        $slug = WcBetterShippingCalculatorForBrazilHelpers::get('SLUG');
        $message = '';
        foreach ($values as $value) {
            if (\is_object($value) || \is_array($value)) {
                $value = $value;
            } elseif (\is_bool($value)) {
                $value = $value ? '<TRUE>' : '<FALSE>';
            } elseif ('' === $value) {
                $value = '<EMPTY STRING>';
            } elseif (null === $value) {
                $value = '<NULL>';
            }
            $message .= $value;
        }
        $logger = WcBetterShippingCalculatorForBrazilHelpers::logger();
        if ($logger && \method_exists($logger, 'debug')) {
            $logger->debug($message);
        } else {
            echo esc_html("[$slug] $message");
        }
    }

    public static function log_wp_error($var, $code = null)
    {
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG && \is_wp_error($var)) {
            WcBetterShippingCalculatorForBrazilHelpers::log('WordPress ERROR: ' . $var->get_error_message($code));
        }
    }

    // CUSTOM LOG HANDLER GETTER
    public static function logger($args = [])
    {
        return \apply_filters(WcBetterShippingCalculatorForBrazilHelpers::prefix('get_logger'), null, $args);
    }

    // PLUGIN DIR URL PREPENDER
    public static function plugin_url($path = '')
    {
        // usage: `$script_url = WcBetterShippingCalculatorForBrazilHelpers::plugin_url( 'assets/js/app.js' );`
        return \plugins_url($path, WcBetterShippingCalculatorForBrazilHelpers::config_get('FILE'));
    }

    // PLUGIN VERSION
    public static function get_plugin_version()
    {
        return preg_replace('/[^0-9.]/', '', WcBetterShippingCalculatorForBrazilHelpers::config_get('VERSION', ''));
    }

    // WP OPTIONS (AUTO-PREFIXED)
    public static function update_option($key, $value)
    {
        if (! WcBetterShippingCalculatorForBrazilHelpers::filled($value)) {
            return \delete_option(WcBetterShippingCalculatorForBrazilHelpers::prefix($key));
        }
        return \update_option(WcBetterShippingCalculatorForBrazilHelpers::prefix($key), $value);
    }

    public static function get_option($key, $default = false)
    {
        return \get_option(WcBetterShippingCalculatorForBrazilHelpers::prefix($key), $default);
    }

    // CACHE/TRANSIENTS (AUTO-PREFIXED)
    public static function set_transient($transient, $value, $duration = 0)
    {
        if (is_callable($value)) {
            $value = \call_user_func($value);
        }
        if (WcBetterShippingCalculatorForBrazilHelpers::config_get('CACHE_ENABLED', true)) {
            $key = WcBetterShippingCalculatorForBrazilHelpers::get_transient_key($transient);
            if (! WcBetterShippingCalculatorForBrazilHelpers::filled($value)) {
                return \delete_transient($key);
            } else {
                $duration = \absint($duration);
                $duration = $duration !== 0 ? $duration : \apply_filters(
                    WcBetterShippingCalculatorForBrazilHelpers::prefix('transient_max_duration'),
                    3 * MONTH_IN_SECONDS, // by default, max is 3 months
                    $transient
                );
                \set_transient($key, $value, $duration);
            }
        }
        return $value;
    }

    public static function get_transient($transient, $default = null)
    {
        $key = WcBetterShippingCalculatorForBrazilHelpers::get_transient_key($transient);
        $value = \get_transient($key);
        return ! WcBetterShippingCalculatorForBrazilHelpers::filled($value) ? $default : $value;
    }

    public static function get_transient_key($transient)
    {
        return WcBetterShippingCalculatorForBrazilHelpers::prefix($transient) . '_' . WcBetterShippingCalculatorForBrazilHelpers::get_plugin_version();
    }

    // EXCEPTIONS
    public static function throw_if($condition, $message, $exception_class = null)
    {
        if ($condition) {
            if (! is_string($message) && \is_callable($message)) {
                $message = $message();
            }
            $exception_class = $exception_class ? $exception_class : \Error::class;
            throw new $exception_class(esc_html($message));
        }
    }

    public static function throw_wp_error($var, $code = null, $exception_class = null)
    {
        if (\is_wp_error($var)) {
            WcBetterShippingCalculatorForBrazilHelpers::throw_if(true, $var->get_error_message($code), $exception_class);
        }
    }

    public static function nothrow($callback, $default = null)
    {
        try {
            return $callback();
        } catch (\Throwable $e) {
        }
        return $default;
    }

    // SECURITY
    public static function sanitize_slug($string, $sep = '-')
    {
        return WcBetterShippingCalculatorForBrazilHelpers::config_sanitize_slug($string, $sep);
    }

    public static function config_sanitize_slug($string, $sep = '-')
    {
        $slug = \strtolower(\remove_accents($string)); // Convert to ASCII
        // Standard replacements
        $slug = \str_replace([ ' ', '_', '-' ], $sep, $slug);
        // Replace all non-alphanumeric by $separator
        $slug = \preg_replace("/[^a-z0-9\\$sep]/", $sep, $slug);
        // Replace any more than one $separator in a row
        $slug = \preg_replace("/\\$sep+/", $sep, $slug);
        // Remove last $separator if at the end
        $slug = \trim($slug, $sep);
        return $slug;
    }

    public static function safe_html($html)
    {
        // remove all script and style tags with code
        $html = \preg_replace('/<(script|style)[^>]*?>.*?<\/\\1>/si', '', $html);
        // remove any script, style, link and iframe tags
        $html = \preg_replace('/<(script|style|iframe|link)[^>]*?>/si', '', $html);
        return $html;
    }

    // STRING
    public static function str_length($string, $encoding = null)
    {
        return \mb_strlen($string, $encoding ? $encoding : 'UTF-8');
    }

    public static function str_lower($string, $encoding = null)
    {
        return \mb_strtolower($string, $encoding ? $encoding : 'UTF-8');
    }

    public static function str_upper($string, $encoding = null)
    {
        return \mb_strtoupper($string, $encoding ? $encoding : 'UTF-8');
    }

    public static function str_before($string, $search)
    {
        return '' === $search ? $string : \explode($search, $string)[0];
    }

    public static function str_after($string, $search)
    {
        return '' === $search ? $string : \array_reverse(\explode($search, $string, 2))[0];
    }

    public static function str_starts_with($string, $search)
    {
        return WcBetterShippingCalculatorForBrazilHelpers::str_after($string, $search) !== $string;
    }

    public static function str_ends_with($string, $search)
    {
        return WcBetterShippingCalculatorForBrazilHelpers::str_before($string, $search) !== $string;
    }

    // usage: `WcBetterShippingCalculatorForBrazilHelpers::str_mask( 'XXX.XXX.XXX-XX', '83699642062' ); // outputs 836.996.420-62`
    public static function str_mask($string, $mask, $symbol = 'X')
    {
        $result = '';
        $k = 0;
        for ($i = 0; $i < \strlen($mask); ++$i) {
            if ($mask[ $i ] === $symbol) {
                if (isset($string[ $k ])) {
                    $result .= $string[ $k++ ];
                }
            } else {
                $result .= $mask[ $i ];
            }
        }
        return $result;
    }

    // Combines n functions. Like a pipe flowing left-to-right, calling each function with the output of the last one.
    // usage: `WcBetterShippingCalculatorForBrazilHelpers::pipe( '<h1>hello world</h1>', 'strtoupper', 'strip_tags' ); // => HELLO WORLD`
    public static function pipe($value, ...$fn)
    {
        $result = $value;
        foreach ($fn as $f) {
            $result = $f($result);
        }
        return $result;
    }

    // TEMPLATE RENDERER
    public static function get_template($path, $args = [])
    {
        $args = \apply_filters(WcBetterShippingCalculatorForBrazilHelpers::prefix('get_template_args'), $args, $path);
        $dir = \trim(WcBetterShippingCalculatorForBrazilHelpers::config_get('TEMPLATES_DIR', 'templates'), '/');
        $full_path = WcBetterShippingCalculatorForBrazilHelpers::config_get('DIR') . "/{$dir}/$path" . (! WcBetterShippingCalculatorForBrazilHelpers::str_ends_with($path, '.php') ? '.php' : '');
        $full_path = apply_filters(WcBetterShippingCalculatorForBrazilHelpers::prefix('get_template_full_path'), $full_path, $path);
        $html = '';
        try {
            \extract($args);
            \ob_start();
            require $full_path;
            $html = \ob_get_clean();
        } catch (\Throwable $e) {
            if (WcBetterShippingCalculatorForBrazilHelpers::get_defined('WP_DEBUG') && current_user_can('administrator')) {
                $error = wp_slash("Error while rendering template '$path': " . $e->getMessage());
                $html = '<script>alert("' . esc_js($error) . '")</script>';
            } else {
                throw new \Error(esc_html($e));
            }
        }
        return $html;
    }

    // YOUR CUSTOM HELPERS (ALWAYS STATIC)
    // public static function foo () {
    //     return 'bar';
    // }

    public static function sanitize_postcode($postcode)
    {
        return preg_replace('/[^0-9]/', '', $postcode);
    }
}
