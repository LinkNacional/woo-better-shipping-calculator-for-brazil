<?php
/**
 * Layout das configurações em cards com abas (portado do template da versão PRO).
 *
 * Renderiza os campos vindos de `get_settings()` em cards navegáveis, no mesmo
 * visual da versão PRO. Campos filhos são declarados com a chave `join` (o valor
 * aponta para o `id` do campo pai) e renderizados dentro do card dele.
 *
 * Compatibilidade de chaves: o template entende tanto as chaves usadas no FREE
 * (`custom_attributes['data-title-description']`, `['data-desc-tip']`,
 * `['data-description']`, `['data-subtitle']`) quanto as da versão PRO
 * (`block_title`, `block_sub_title`, `description`, `input_description`).
 *
 * @package Woo_Better_Shipping_Calculator_For_Brazil
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! isset( $form_fields ) || ! is_array( $form_fields ) ) {
	return;
}

/**
 * Extrai o texto de um campo, aceitando as chaves do FREE e as do PRO.
 *
 * @param array  $field Campo.
 * @param string $slot  'left_tip' | 'card_title' | 'card_sub' | 'body_desc'.
 * @return string
 */
$wb_layout_text = function ( $field, $slot ) {
	$attrs = isset( $field['custom_attributes'] ) && is_array( $field['custom_attributes'] )
		? $field['custom_attributes']
		: array();

	switch ( $slot ) {
		// Texto da coluna esquerda (acompanha o rótulo do campo).
		case 'left_tip':
			$value = $attrs['data-desc-tip'] ?? ( $field['block_intro'] ?? '' );
			break;

		// Título do card do campo (usa `data-subtitle` quando existir).
		case 'card_title':
			$value = $attrs['data-subtitle'] ?? ( $field['block_title'] ?? ( $field['title'] ?? '' ) );
			break;

		// Subtítulo do card do campo.
		case 'card_sub':
			$value = $attrs['data-title-description'] ?? ( $field['block_sub_title'] ?? '' );
			break;

		// Descrição exibida abaixo do campo.
		case 'body_desc':
			$value = $attrs['data-description'] ?? ( ! empty( $field['description'] ) ? $field['description'] : ( $field['desc'] ?? '' ) );
			break;

		default:
			$value = '';
			break;
	}

	return is_string( $value ) ? $value : '';
};

/**
 * Atributos HTML extras do campo, sem as chaves que só carregam texto.
 *
 * @param array $field Campo.
 * @return array<string, string>
 */
$wb_layout_attrs = function ( $field ) {
	$attrs = isset( $field['custom_attributes'] ) && is_array( $field['custom_attributes'] )
		? $field['custom_attributes']
		: array();

	unset(
		$attrs['data-desc-tip'],
		$attrs['data-description'],
		$attrs['data-title-description'],
		$attrs['data-subtitle']
	);

	$out = array();
	foreach ( $attrs as $attr_key => $attr_val ) {
		if ( is_scalar( $attr_val ) && '' !== (string) $attr_val ) {
			$out[ (string) $attr_key ] = (string) $attr_val;
		}
	}

	return $out;
};

/**
 * Mapa filho → pai, construído a partir da chave `join` dos campos.
 *
 * @param array $form_fields Campos.
 * @return array<string, array>
 */
$wb_layout_children_map = function ( $form_fields ) {
	$map = array();

	foreach ( $form_fields as $field_key => $field ) {
		if ( ! is_array( $field ) || empty( $field['join'] ) ) {
			continue;
		}

		$map[ (string) $field['join'] ][ $field_key ] = $field;
	}

	return $map;
};

/**
 * URL da página comercial da versão PRO.
 *
 * Fonte única dos links de upsell da tela (pílula `PRO`, banner do bloco e card
 * promocional lateral). Vem da constante/filtro do ProGate.
 */
$wb_layout_pro_pill_url = \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::upgrade_url();

/**
 * Pílula vermelha `PRO` (só aparece enquanto o PRO está inativo).
 *
 * Usada em três lugares: no item do menu de abas (span, porque um `a` não pode
 * conter outro `a`), no banner do bloco e no título de cada card (`a`).
 *
 * @param bool $as_link `true` = link (`<a>`), `false` = span.
 * @return string Markup escapado.
 */
$wb_layout_pro_pill = function ( $as_link = false ) use ( $wb_layout_pro_pill_url ) {
	$url   = $wb_layout_pro_pill_url;
	$label = __( 'PRO', 'woo-better-shipping-calculator-for-brazil' );

	if ( $as_link ) {
		return sprintf(
			'<a class="admin-layout-pro-pill" href="%s" data-pro-url="%s" target="_blank" rel="noopener noreferrer">%s</a>',
			esc_url( $url ),
			esc_attr( $url ),
			esc_html( $label )
		);
	}

	return sprintf(
		'<span class="admin-layout-pro-pill admin-layout-pro-pill--nav" role="button" tabindex="0" data-pro-url="%s" title="%s">%s</span>',
		esc_attr( $url ),
		esc_attr__( 'Conheça a versão PRO', 'woo-better-shipping-calculator-for-brazil' ),
		esc_html( $label )
	);
};

/**
 * Renderiza um campo (e, recursivamente, os filhos declarados via `join`).
 *
 * @param string|int $field_key    Chave do campo na lista.
 * @param array      $field        Campo.
 * @param array      $children_map Mapa filho → pai.
 * @param int        $depth        0 = campo raiz; > 0 = aninhado no pai.
 * @return void
 */
$wb_layout_field = function ( $field_key, $field, $children_map, $depth = 0 ) use ( &$wb_layout_field, $wb_layout_text, $wb_layout_attrs, $wb_layout_pro_pill ) {
	$field_id    = ! empty( $field['id'] ) ? $field['id'] : $field_key;
	$field_type  = isset( $field['type'] ) ? $field['type'] : 'text';

	// No layout original qualquer campo com `color_field` no id vira color picker
	// (alguns são declarados como `text` e outros como `color`).
	if ( 'color_field' === substr( $field_id, -11 ) ) {
		$field_type = 'color';
	}
	$field_value = get_option( $field_id, isset( $field['default'] ) ? $field['default'] : '' );
	$attrs       = $wb_layout_attrs( $field );

	// Filhos: procurados pelo `id` do campo ou pela chave dele na lista.
	$children = array();
	if ( isset( $children_map[ $field_id ] ) ) {
		$children = $children_map[ $field_id ];
	} elseif ( isset( $children_map[ $field_key ] ) ) {
		$children = $children_map[ $field_key ];
	}

	$card_title = $wb_layout_text( $field, 'card_title' );
	$card_sub   = $wb_layout_text( $field, 'card_sub' );

	$body_desc  = $wb_layout_text( $field, 'body_desc' );
	$left_tip   = $wb_layout_text( $field, 'left_tip' );

	// Card de um campo exclusivo da versão PRO (pílula ao lado do título).
	$is_pro_card = \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::should_render_pill( $field );
	?>
	<div class="admin-layout-field-parent-flex<?php echo $depth > 0 ? ' admin-layout-field-nested' : ''; ?>">
		<?php if ( 0 === $depth ) : ?>
			<div class="admin-layout-field-label-desc">
				<?php if ( ! empty( $field['title'] ) ) : ?>
					<span class="admin-layout-label"><?php echo esc_html( $field['title'] ); ?></span>
				<?php endif; ?>
				<?php if ( '' !== $left_tip ) : ?>
					<div class="admin-layout-description admin-layout-field-tip"><?php echo wp_kses_post( $left_tip ); ?></div>
				<?php endif; ?>
			</div>
		<?php endif; ?>
		<div class="admin-layout-field-component-bg">
			<span class="admin-layout-label<?php echo $is_pro_card ? ' admin-layout-label--pro' : ''; ?>">
				<span class="admin-layout-label-text"><?php echo esc_html( $card_title ); ?></span>
				<?php
				if ( $is_pro_card ) {
					echo $wb_layout_pro_pill( true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup escapado na closure.
				}
				?>
			</span>
			<?php if ( '' !== $card_sub ) : ?>
				<div class="admin-layout-description admin-layout-block-sub-title"><?php echo wp_kses_post( $card_sub ); ?></div>
			<?php endif; ?>
			<hr class="admin-layout-hr">
			<div class="admin-layout-field-input-wrapper">
				<?php
				switch ( $field_type ) {
					case 'text':
					case 'password':
					case 'number':
					case 'email':
					case 'url':
						?>
						<input
							type="<?php echo esc_attr( $field_type ); ?>"
							name="<?php echo esc_attr( $field_id ); ?>"
							id="<?php echo esc_attr( $field_id ); ?>"
							value="<?php echo esc_attr( $field_value ); ?>"
							class="admin-layout-input"
							<?php if ( ! empty( $field['placeholder'] ) ) : ?>
								placeholder="<?php echo esc_attr( $field['placeholder'] ); ?>"
							<?php endif; ?>
							<?php foreach ( $attrs as $attr_key => $attr_val ) : ?>
								<?php echo esc_attr( $attr_key ); ?>="<?php echo esc_attr( $attr_val ); ?>"
							<?php endforeach; ?>
						/>
						<?php
						break;

					case 'color':
						// Mantém o contrato antigo: `{id}_input` é o swatch e `{id}` o valor salvo.
						?>
						<div class="admin-layout-color-wrapper">
							<input
								type="color"
								id="<?php echo esc_attr( $field_id . '_input' ); ?>"
								class="admin-layout-color-swatch"
								data-target="<?php echo esc_attr( $field_id ); ?>"
								value="<?php echo esc_attr( preg_match( '/^#[0-9a-fA-F]{6}$/', (string) $field_value ) ? $field_value : '#000000' ); ?>"
							/>
							<input
								type="text"
								name="<?php echo esc_attr( $field_id ); ?>"
								id="<?php echo esc_attr( $field_id ); ?>"
								value="<?php echo esc_attr( $field_value ); ?>"
								class="admin-layout-input"
							/>
						</div>
						<?php
						break;

					case 'textarea':
						?>
						<textarea
							name="<?php echo esc_attr( $field_id ); ?>"
							id="<?php echo esc_attr( $field_id ); ?>"
							class="admin-layout-textarea"
							<?php if ( ! empty( $field['placeholder'] ) ) : ?>
								placeholder="<?php echo esc_attr( $field['placeholder'] ); ?>"
							<?php endif; ?>
							<?php foreach ( $attrs as $attr_key => $attr_val ) : ?>
								<?php echo esc_attr( $attr_key ); ?>="<?php echo esc_attr( $attr_val ); ?>"
							<?php endforeach; ?>
						><?php echo esc_textarea( $field_value ); ?></textarea>
						<?php
						break;

					case 'checkbox':
						?>
						<div class="admin-layout-checkbox-wrapper">
							<label class="admin-layout-checkbox-label">
								<input
									type="checkbox"
									name="<?php echo esc_attr( $field_id ); ?>"
									id="<?php echo esc_attr( $field_id ); ?>"
									value="yes"
									class="admin-layout-checkbox"
									<?php checked( 'yes', $field_value ); ?>
									<?php foreach ( $attrs as $attr_key => $attr_val ) : ?>
										<?php echo esc_attr( $attr_key ); ?>="<?php echo esc_attr( $attr_val ); ?>"
									<?php endforeach; ?>
								/>
								<?php if ( ! empty( $field['label'] ) ) : ?>
									<span class="admin-layout-checkbox-label-text"><?php echo wp_kses_post( $field['label'] ); ?></span>
								<?php endif; ?>
							</label>
						</div>
						<?php
						break;

					case 'radio':
						if ( ! empty( $field['options'] ) && is_array( $field['options'] ) ) {
							foreach ( $field['options'] as $option_value => $option_label ) {
								?>
								<label class="admin-layout-radio-label">
									<input
										type="radio"
										name="<?php echo esc_attr( $field_id ); ?>"
										value="<?php echo esc_attr( $option_value ); ?>"
										id="<?php echo esc_attr( $field_id . '_' . $option_value ); ?>"
										class="admin-layout-radio"
										<?php checked( (string) $field_value, (string) $option_value ); ?>
									/>
									<span class="admin-layout-radio-label-text"><?php echo esc_html( $option_label ); ?></span>
								</label>
								<?php
							}
						}
						break;

					case 'select':
						if ( ! empty( $field['options'] ) && is_array( $field['options'] ) ) {
							?>
							<select
								name="<?php echo esc_attr( $field_id ); ?>"
								id="<?php echo esc_attr( $field_id ); ?>"
								class="admin-layout-select"
								<?php foreach ( $attrs as $attr_key => $attr_val ) : ?>
									<?php echo esc_attr( $attr_key ); ?>="<?php echo esc_attr( $attr_val ); ?>"
								<?php endforeach; ?>
							>
								<?php foreach ( $field['options'] as $option_value => $option_label ) : ?>
									<option value="<?php echo esc_attr( $option_value ); ?>" <?php selected( (string) $field_value, (string) $option_value ); ?>>
										<?php echo esc_html( $option_label ); ?>
									</option>
								<?php endforeach; ?>
							</select>
							<?php
						}
						break;

					default:
						// Tipos customizados (ex.: widgets da versão PRO que agora vivem
						// no FREE): quem trata é o hook do tipo, se houver.
						$wb_layout_custom_hook = 'wc_better_shipping_calculator_admin_field_' . $field_type;

						if ( has_action( $wb_layout_custom_hook ) ) {
							do_action( $wb_layout_custom_hook, $field_id, $field, $field_value );
						} elseif ( function_exists( 'woocommerce_form_field' ) ) {
							// Tipo não mapeado: renderiza pelo helper nativo do WooCommerce.
							woocommerce_form_field(
								$field_id,
								array(
									'type'    => $field_type,
									'default' => $field_value,
									'options' => isset( $field['options'] ) ? $field['options'] : array(),
								),
								$field_value
							);
						}
						break;
				}

				if ( ! empty( $field['input_description'] ) ) {
					echo '<div class="admin-layout-input-description">' . esc_html( $field['input_description'] ) . '</div>';
				}

				if ( '' !== $body_desc ) {
					echo '<div class="admin-layout-description admin-layout-field-body-description">' . wp_kses_post( $body_desc ) . '</div>';
				}

				if ( ! empty( $children ) && $depth < 5 ) {
					echo '<div class="admin-layout-nested-fields">';
					foreach ( $children as $child_key => $child_field ) {
						$wb_layout_field( $child_key, $child_field, $children_map, $depth + 1 );
					}
					echo '</div>';
				}
				?>
			</div>
		</div>
	</div>
	<?php
};

// Agrupa os campos em blocos, delimitados por `type === 'title'`.
$wb_layout_blocks       = array();
$wb_layout_current      = null;
$wb_layout_first_block  = null;
$wb_layout_block_count  = 0;

foreach ( $form_fields as $field_key => $field ) {
	if ( ! is_array( $field ) || empty( $field['type'] ) ) {
		continue;
	}

	if ( 'title' === $field['type'] ) {
		$block_id = ! empty( $field['block_id'] )
			? (string) $field['block_id']
			: sanitize_title( isset( $field['title'] ) ? $field['title'] : 'bloco' );

		if ( '' === $block_id ) {
			$block_id = 'bloco';
		}

		// Garante ids únicos (títulos repetidos).
		$base_id = $block_id;
		while ( isset( $wb_layout_blocks[ $block_id ] ) ) {
			++$wb_layout_block_count;
			$block_id = $base_id . '-' . $wb_layout_block_count;
		}

		if ( null === $wb_layout_first_block ) {
			$wb_layout_first_block = $block_id;
		}

		$wb_layout_blocks[ $block_id ] = array(
			'title'     => isset( $field['title'] ) ? $field['title'] : '',
			'desc'      => isset( $field['desc'] ) ? $field['desc'] : '',
			'intro'     => isset( $field['block_intro'] ) ? $field['block_intro'] : '',
			'sub_title' => isset( $field['block_sub_title'] ) ? $field['block_sub_title'] : '',
			// Bloco exclusivo da versão PRO (pílula vermelha no nav e no bloco).
			'pro'       => ! empty( $field['pro'] ),
			'fields'    => array(),
		);

		$wb_layout_current = $block_id;
		continue;
	}

	if ( 'sectionend' === $field['type'] ) {
		$wb_layout_current = null;
		continue;
	}

	if ( null !== $wb_layout_current ) {
		$wb_layout_blocks[ $wb_layout_current ]['fields'][ $field_key ] = $field;
	}
}

$wb_layout_children = $wb_layout_children_map( $form_fields );
$wb_layout_title    = isset( $method_title ) ? $method_title : __( 'Configurações', 'woo-better-shipping-calculator-for-brazil' );

?>
<div class="admin-layout-page-wrapper">
	<div class="admin-layout-content">
		<div class="admin-layout-main">
			<div class="admin-layout-header">
				<h2 class="admin-layout-title"><?php echo esc_html( $wb_layout_title ); ?></h2>
			</div>
			<?php if ( count( $wb_layout_blocks ) > 1 ) : ?>
				<div class="admin-layout-top-menu-outer">
					<button type="button" class="admin-layout-nav-arrow admin-layout-nav-arrow--prev" aria-label="<?php esc_attr_e( 'Anterior', 'woo-better-shipping-calculator-for-brazil' ); ?>">&#8249;</button>
					<div class="admin-layout-top-menu-clip">
						<nav class="admin-layout-top-menu">
							<?php foreach ( $wb_layout_blocks as $block_id => $block ) : ?>
								<a href="#" id="nav-<?php echo esc_attr( $block_id ); ?>" class="admin-layout-title-link<?php echo $block_id === $wb_layout_first_block ? ' active' : ''; ?><?php echo $block['pro'] ? ' admin-layout-title-link--pro' : ''; ?>" data-target="block-<?php echo esc_attr( $block_id ); ?>">
									<span class="admin-layout-title-link-text"><?php echo esc_html( '' !== $block['title'] ? $block['title'] : ucfirst( $block_id ) ); ?></span>
									<?php
									if ( $block['pro'] && ! \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_active() ) {
										echo $wb_layout_pro_pill( false ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup escapado na closure.
									}
									?>
								</a>
							<?php endforeach; ?>
						</nav>
					</div>
					<button type="button" class="admin-layout-nav-arrow admin-layout-nav-arrow--next" aria-label="<?php esc_attr_e( 'Próximo', 'woo-better-shipping-calculator-for-brazil' ); ?>">&#8250;</button>
				</div>
			<?php endif; ?>

			<?php foreach ( $wb_layout_blocks as $block_id => $block ) : ?>
				<?php $wb_layout_pro_block = $block['pro'] && ! \Lkn\WcBetterShippingCalculatorForBrazil\Admin\WcBetterShippingCalculatorForBrazilAdminProGate::is_pro_active(); ?>
				<div class="admin-layout-block<?php echo $block_id === $wb_layout_first_block ? ' active' : ''; ?><?php echo $wb_layout_pro_block ? ' admin-layout-block--pro' : ''; ?>" id="block-<?php echo esc_attr( $block_id ); ?>">
					<?php if ( $wb_layout_pro_block ) : ?>
						<div class="admin-layout-pro-banner">
							<?php echo $wb_layout_pro_pill( true ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Markup escapado na closure. ?>
							<span class="admin-layout-pro-banner-text"><?php esc_html_e( 'Recurso exclusivo da versão PRO. Você pode explorar as opções, mas elas não são salvas enquanto o PRO não estiver ativo.', 'woo-better-shipping-calculator-for-brazil' ); ?></span>
						</div>
					<?php endif; ?>
					<?php if ( ! empty( $block['desc'] ) || ! empty( $block['intro'] ) || ! empty( $block['sub_title'] ) ) : ?>
						<div class="admin-layout-field-parent-flex admin-layout-block-desc-row">
							<div class="admin-layout-field-label-desc">
								<span class="admin-layout-label"><?php echo esc_html( '' !== $block['title'] ? $block['title'] : ucfirst( $block_id ) ); ?></span>
								<?php if ( ! empty( $block['intro'] ) ) : ?>
									<div class="admin-layout-description admin-layout-field-tip"><?php echo wp_kses_post( $block['intro'] ); ?></div>
								<?php endif; ?>
							</div>
							<div class="admin-layout-field-component-bg">
								<span class="admin-layout-label"><?php echo esc_html( '' !== $block['title'] ? $block['title'] : ucfirst( $block_id ) ); ?></span>
								<?php if ( ! empty( $block['sub_title'] ) ) : ?>
									<div class="admin-layout-description admin-layout-block-sub-title"><?php echo wp_kses_post( $block['sub_title'] ); ?></div>
								<?php endif; ?>
								<hr class="admin-layout-hr">
								<div class="admin-layout-field-input-wrapper">
									<?php echo wp_kses_post( $block['desc'] ); ?>
								</div>
							</div>
						</div>
					<?php endif; ?>

					<?php
					foreach ( $block['fields'] as $field_key => $field ) {
						// Campos filhos são renderizados dentro do card do pai.
						if ( ! empty( $field['join'] ) ) {
							continue;
						}

						$wb_layout_field( $field_key, $field, $wb_layout_children );
					}
					?>
				</div>
			<?php endforeach; ?>

			<div class="admin-layout-submit-wrapper">
				<button type="submit" name="save" class="button button-primary admin-layout-submit" value="<?php esc_attr_e( 'Salvar alterações', 'woo-better-shipping-calculator-for-brazil' ); ?>">
					<?php esc_html_e( 'Salvar alterações', 'woo-better-shipping-calculator-for-brazil' ); ?>
				</button>
			</div>
		</div>

		<div class="admin-layout-sidebar-bar">
			<div class="admin-layout-sidebar">
				<div class="admin-layout-card">
					<?php
					if ( isset( $sidebar_card ) && is_callable( $sidebar_card ) ) {
						$wb_layout_sidebar_html = call_user_func( $sidebar_card );
						if ( is_string( $wb_layout_sidebar_html ) ) {
							echo $wb_layout_sidebar_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Card já escapa internamente.
						}
					}
					?>
				</div>
				<?php
				$wb_layout_features = isset( $sidebar_features ) && is_array( $sidebar_features ) ? $sidebar_features : array();
				foreach ( $wb_layout_features as $wb_layout_feature ) :
					if ( empty( $wb_layout_feature ) || ! is_array( $wb_layout_feature ) ) {
						continue;
					}
					?>
					<div class="admin-layout-card">
						<div class="custom-feature-message">
							<span class="custom-feature-message-icon">&#10004;&#65039;</span>
							<div class="custom-feature-message-lines">
								<?php foreach ( $wb_layout_feature as $wb_layout_feature_line ) : ?>
									<span class="custom-feature-message-line"><?php echo wp_kses_post( $wb_layout_feature_line ); ?></span>
								<?php endforeach; ?>
							</div>
						</div>
					</div>
				<?php endforeach; ?>
				<div class="admin-layout-card">
					<div class="block-promotional-card">
						<div class="block-promotional-card-bg"></div>
						<div class="block-promotional-card-content">
							<h3 class="block-promotional-card-title"><?php esc_html_e( 'Campos Checkout Brasileiro para WooCommerce PRO', 'woo-better-shipping-calculator-for-brazil' ); ?></h3>
							<hr class="block-promotional-card-hr">
							<p class="block-promotional-card-description"><?php esc_html_e( 'Agendamento de data e horário de entrega no checkout, bloqueio de datas e turnos esgotados, prazo mínimo de preparo e ocultação do endereço na retirada no local.', 'woo-better-shipping-calculator-for-brazil' ); ?></p>
							<div class="block-promotional-card-buttons">
								<a class="block-promotional-card-btn block-promotional-card-btn-learn" href="<?php echo esc_url( $wb_layout_pro_pill_url ); ?>" target="_blank" rel="noopener noreferrer">
									<?php esc_html_e( 'Conheça mais', 'woo-better-shipping-calculator-for-brazil' ); ?>
								</a>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
