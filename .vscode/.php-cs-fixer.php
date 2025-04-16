<?php

/**
 * php-cs-fixer config that follows the WordPress style guide for PHP.
 * Source: https://gist.github.com/srbrunoferreira/5b0d96955c3913f6b1cd805c2a14079d
 * Adapted from: https://github.com/vena/php-cs-fixer-wordpress/blob/main/src/WordPressRuleSet.php
 * WordPress style guide: https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/.
 */

return (new PhpCsFixer\Config())
    ->setRules(array(
        'short_scalar_cast' => true,
        'visibility_required' => true,
        'elseif' => true,
        'no_superfluous_elseif' => true,
        'align_multiline_comment' => array('comment_type' => 'phpdocs_like'),
        'array_syntax' => array('syntax' => 'long'),
        'binary_operator_spaces' => true,
        'blank_line_after_opening_tag' => false,
        'braces' => array(
            'position_after_functions_and_oop_constructs' => 'same',
        ),
        'cast_spaces' => true,
        'class_attributes_separation' => array(
            'elements' => array(
                'const' => 'one',
                'method' => 'one',
                'property' => 'only_if_meta',
            ),
        ),
        'class_definition' => array('single_line' => true),
        'class_keyword_remove' => true,
        'concat_space' => array('spacing' => 'one'),
        'control_structure_continuation_position' => true,
        'dir_constant' => true,
        'fully_qualified_strict_types' => true,
        'global_namespace_import' => false,
        'include' => true,
        'list_syntax' => array('syntax' => 'long'),
        'lowercase_cast' => true,
        'lowercase_static_reference' => true,
        'magic_constant_casing' => true,
        'magic_method_casing' => true,
        'method_chaining_indentation' => true,
        'native_constant_invocation' => true,
        'native_function_casing' => true,
        'native_function_type_declaration_casing' => true,
        'new_with_braces' => true,
        'no_alternative_syntax' => array('fix_non_monolithic_code' => false),
        'no_blank_lines_after_class_opening' => false,
        'no_blank_lines_after_phpdoc' => true,
        'no_empty_comment' => true,
        'no_extra_blank_lines' => array(
            'tokens' => array(
                'continue',
                'extra',
                'parenthesis_brace_block',
                'square_brace_block',
                'throw',
                'use',
            ),
        ),
        'no_spaces_around_offset' => array('positions' => array('outside')),
        'no_spaces_inside_parenthesis' => false,
        'not_operator_with_space' => true,
        // 'not_operator_with_successor_space' => true,
        'phpdoc_tag_casing' => true,
        'phpdoc_types_order' => array(
            'null_adjustment' => 'always_last',
            'sort_algorithm' => 'none',
        ),
        'single_line_throw' => true,
        'strict_param' => true,
        'trim_array_spaces' => true,
        // WPCS 3.0 proposal, yoda style is optional
        'yoda_style' => array(
            'always_move_variable' => true,
            'equal' => true,
            'identical' => true,
            'always_move_variable' => true,
        ),
        'modernize_types_casting' => true,
        'final_class' => false,
        'final_internal_class' => false,
        'final_public_method_for_abstract_class' => false,
        'void_return' => true,
        'logical_operators' => true,
        'array_indentation' => true,
        'whitespace_after_comma_in_array' => array(
            'ensure_single_space' => true,
        ),
        'method_argument_space' => array(
            'keep_multiple_spaces_after_comma' => false,
            'on_multiline' => 'ensure_fully_multiline',
        ),
        'native_function_invocation' => false,
        'native_constant_invocation' => false
    ))
    ->setIndent('    ')
    ->setLineEnding("\n")
    ->setRiskyAllowed(true)
;