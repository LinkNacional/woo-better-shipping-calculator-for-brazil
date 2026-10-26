/**
 * Comportamentos das configurações "Campos Brasileiros".
 *
 * Portado do antigo `WcBetterShippingCalculatorForBrazilAdminLayout.js`: o layout
 * agora vem do template PHP (`Admin/templates/...AdminSettingsLayout.php`) e este
 * arquivo mantém apenas os comportamentos:
 *
 * 1. Agrupamento dos campos filhos dentro do card do campo pai.
 * 2. Exclusão mútua entre "Preenchimento Automático" e "Preenchimento Silencioso" por CEP.
 * 3. Estados de dependência (habilitar/desabilitar) do bloco de telefone/celular,
 *    endereço por CEP e data de nascimento.
 *
 * @package Woo_Better_Shipping_Calculator_For_Brazil
 */

(function () {
	'use strict';

	// ── 0. "Desabilitado" apenas VISUAL (ver AGENTS.md § 7) ────────────────
	/**
	 * Trava um grupo de campos SEM usar o atributo `disabled`.
	 *
	 * REASON: input `disabled` não é enviado no POST. O WooCommerce mantém a
	 * option com o valor ANTIGO, então a tela mostrava "Não"/desabilitado e o
	 * checkout continuava gerando o campo (ex.: "Celular" fantasma). O bloqueio
	 * aqui é só de aparência: o valor exibido segue indo no submit.
	 *
	 * @param {NodeList|Array} elements   Campos alvo.
	 * @param {boolean}       isDisabled Se devem parecer desabilitados.
	 * @return {void}
	 */
	function setDisabledState(elements, isDisabled) {
		Array.prototype.forEach.call(elements, function (element) {
			if (window.wcBetterFakeDisabled) {
				window.wcBetterFakeDisabled(element, isDisabled);
				return;
			}

			// Fallback (script auxiliar ausente): só aparência — o atributo
			// `disabled` NUNCA é aplicado.
			element.removeAttribute('disabled');
			element.disabled = false;
			element.style.opacity = isDisabled ? '0.6' : '';
			element.style.cursor = isDisabled ? 'not-allowed' : '';
		});
	}

	// ── 2. Exclusão mútua entre os preenchimentos por CEP ──────────────────
	function handleAddressFillMutualExclusion() {
		var autoRadios = document.querySelectorAll('input[name="woo_better_calc_enable_auto_address_fill"]');
		var silentRadios = document.querySelectorAll('input[name="woo_better_calc_enable_silent_address_fill"]');

		if (autoRadios.length === 0 || silentRadios.length === 0) {
			return;
		}

		autoRadios.forEach(function (radio) {
			radio.addEventListener('change', function () {
				if (this.value === 'yes' && this.checked) {
					var silentYes = document.querySelector('input[name="woo_better_calc_enable_silent_address_fill"][value="yes"]');
					if (silentYes && silentYes.checked) {
						var confirmed = window.confirm('O "Preenchimento Silencioso por CEP" está habilitado e será desabilitado. Deseja continuar?');
						if (!confirmed) {
							var autoNo = document.querySelector('input[name="woo_better_calc_enable_auto_address_fill"][value="no"]');
							if (autoNo) {
								autoNo.checked = true;
							}
							return;
						}
					}
					var silentNo = document.querySelector('input[name="woo_better_calc_enable_silent_address_fill"][value="no"]');
					if (silentNo) {
						silentNo.checked = true;
						silentNo.dispatchEvent(new Event('change', { bubbles: true }));
					}
				}
			});
		});

		silentRadios.forEach(function (radio) {
			radio.addEventListener('change', function () {
				if (this.value === 'yes' && this.checked) {
					var autoYes = document.querySelector('input[name="woo_better_calc_enable_auto_address_fill"][value="yes"]');
					if (autoYes && autoYes.checked) {
						var confirmed = window.confirm('O "Preenchimento Automático por CEP" está habilitado e será desabilitado. Deseja continuar?');
						if (!confirmed) {
							var silentNo = document.querySelector('input[name="woo_better_calc_enable_silent_address_fill"][value="no"]');
							if (silentNo) {
								silentNo.checked = true;
							}
							return;
						}
					}
					var autoNo = document.querySelector('input[name="woo_better_calc_enable_auto_address_fill"][value="no"]');
					if (autoNo) {
						autoNo.checked = true;
						autoNo.dispatchEvent(new Event('change', { bubbles: true }));
					}
				}
			});
		});
	}

	// ── 3.1 Campo RG: a obrigatoriedade só faz sentido com o campo habilitado ──
	function initRgFieldState() {
		var enableRgRadios = document.querySelectorAll('input[name="woo_better_calc_enable_rg_field"]');
		var rgRequiredRadios = document.querySelectorAll('input[name="woo_better_calc_rg_required"]');

		if (enableRgRadios.length === 0 || rgRequiredRadios.length === 0) {
			return;
		}

		function isRgEnabled() {
			return Array.prototype.some.call(enableRgRadios, function (radio) {
				return radio.checked && radio.value === 'yes';
			});
		}

		function updateRgRequiredState() {
			var enabled = isRgEnabled();

			setDisabledState(rgRequiredRadios, !enabled);
		}

		updateRgRequiredState();
		enableRgRadios.forEach(function (radio) {
			radio.addEventListener('change', updateRgRequiredState);
		});
	}

	// ── 3. Estados de dependência ──────────────────────────────────────────
	function initDependencies() {
		var positionRadios = document.querySelectorAll('input[name="woo_better_calc_cep_field_position"]');
		var autoAddressRadios = document.querySelectorAll('input[name="woo_better_calc_enable_auto_address_fill"]');
		var applyPhoneMaskRadios = document.querySelectorAll('input[name="woo_better_calc_apply_phone_mask"]');
		var showCountryCodeRadios = document.querySelectorAll('input[name="woo_better_calc_show_phone_country_code"]');
		var validateDddRadios = document.querySelectorAll('input[name="woo_better_calc_validate_ddd"]');
		var phoneModeSelect = document.querySelector('select[name="woo_better_calc_phone_mode"]');
		var contactRequiredRadios = document.querySelectorAll('input[name="woo_better_calc_contact_required"]');
		var contactFieldPositionRadios = document.querySelectorAll('input[name="woo_better_calc_contact_field_position"]');
		var enableCellphoneRadios = document.querySelectorAll('input[name="woo_better_calc_enable_cellphone_field"]');
		var cellphoneRequiredRadios = document.querySelectorAll('input[name="woo_better_calc_cellphone_required"]');
		var cellphoneShimRadios = document.querySelectorAll('input[name="woo_better_calc_enable_cellphone_shim"]');

		function isYes(group) {
			return Array.prototype.some.call(group, function (radio) {
				return radio.checked && radio.value === 'yes';
			});
		}

		// Modos em que o plugin NÃO gerencia o telefone: "Deixar a configuração
		// nativa do WooCommerce" (`disabled`) e "Desabilitar o campo de telefone"
		// (`disabled_native`). Espelha `phone_mode_is_unmanaged()` no PHP.
		function isUnmanagedMode() {
			return !!phoneModeSelect
				&& (phoneModeSelect.value === 'disabled' || phoneModeSelect.value === 'disabled_native');
		}

		function updateAutoAddressState() {
			var enabled = isYes(positionRadios);

			setDisabledState(autoAddressRadios, !enabled);

			if (!enabled) {
				autoAddressRadios.forEach(function (radio) {
					if (radio.value === 'no') {
						radio.checked = true;
					} else if (radio.value === 'yes') {
						radio.checked = false;
					}
				});
			}
		}

		if (positionRadios.length > 0 && autoAddressRadios.length > 0) {
			updateAutoAddressState();
			positionRadios.forEach(function (radio) {
				radio.addEventListener('change', updateAutoAddressState);
			});
		}

		// show_phone_country_code: desabilita e força 'no' quando a máscara está off.
		function updatePhoneChildState() {
			var enabled = isYes(applyPhoneMaskRadios);

			setDisabledState(showCountryCodeRadios, !enabled);

			if (!enabled) {
				showCountryCodeRadios.forEach(function (radio) {
					if (radio.value === 'no') {
						radio.checked = true;
					} else if (radio.value === 'yes') {
						radio.checked = false;
					}
				});
			}
		}

		// Textos do card "Validar Número de Telefone": o ESCOPO da validação muda com a
		// opção "Telefone com Máscara e DDI". Ligada, a validação usa a base
		// internacional (todos os países); desligada, o campo tem apenas a máscara
		// brasileira e a validação vale só para o Brasil.
		var VALIDATE_DDD_TEXTS = {
			mask: {
				title: 'Validar o número de telefone no checkout (todos os países)',
				sub: 'Valida o número de telefone no checkout em todos os países.',
				body: 'Requer que o telefone/celular seja obrigatório. Com a opção "Telefone com Máscara e DDI" habilitada, a validação usa a base internacional de telefonia (vale para todos os países). Quando ativada, o checkout impede o envio caso o número de telefone seja inválido.'
			},
			brazil: {
				title: 'Validar o número de telefone no checkout (Brasil)',
				sub: 'Valida o número de telefone no checkout apenas para o Brasil.',
				body: 'Requer que o telefone/celular seja obrigatório. Sem a opção "Telefone com Máscara e DDI", o campo usa a máscara brasileira (fixo/celular) e a validação vale apenas para números do Brasil (DDD válido + 8 dígitos para fixo ou 9 para celular). Quando ativada, o checkout impede o envio caso o número de telefone seja inválido.'
			}
		};

		/**
		 * Troca título/subtítulo/descrição do card "Validar Número de Telefone"
		 * conforme o escopo da validação (com ou sem lib/DDI).
		 *
		 * @return {void}
		 */
		function updateValidateDddTexts() {
			if (!validateDddRadios.length) {
				return;
			}

			var wrapper = validateDddRadios[0].closest('.admin-layout-field-component-bg')
				|| validateDddRadios[0].closest('.forminp');

			if (!wrapper) {
				return;
			}

			var texts = isYes(applyPhoneMaskRadios) ? VALIDATE_DDD_TEXTS.mask : VALIDATE_DDD_TEXTS.brazil;
			var title = wrapper.querySelector('.admin-layout-label-text');
			var sub = wrapper.querySelector('.admin-layout-block-sub-title');
			var body = wrapper.querySelector('.admin-layout-field-body-description');

			if (title) {
				title.textContent = texts.title;
			}
			if (sub) {
				sub.textContent = texts.sub;
			}
			if (body) {
				body.textContent = texts.body;
			}
		}

		// "Validar Número de Telefone": só depende do contato/celular obrigatório e do
		// modo de telefone. NÃO depende mais da máscara/DDI — sem ela o plugin valida
		// apenas números do Brasil (validação customizada, sem lib).
		function updateValidateDddState() {
			var cellphoneOn = isYes(enableCellphoneRadios);
			var requiredOn = isYes(contactRequiredRadios) || (cellphoneOn && isYes(cellphoneRequiredRadios));
			var on = requiredOn && !isUnmanagedMode();

			setDisabledState(validateDddRadios, !on);
			updateValidateDddTexts();
		}

		// "Celular Obrigatório" só fica ativo quando o "Campo de Celular" está habilitado
		// e o modo não é "somente Celular".
		function updateCellphoneRequiredState() {
			var enableYes = isYes(enableCellphoneRadios);
			var modeAllows = !phoneModeSelect || phoneModeSelect.value !== 'cellphone_only';
			var on = enableYes && modeAllows;

			setDisabledState(cellphoneRequiredRadios, !on);

			if (!modeAllows) {
				cellphoneRequiredRadios.forEach(function (radio) {
					if (radio.value === 'no') {
						radio.checked = true;
					}
				});
			}
		}

		function updatePhoneModeChildState() {
			if (!phoneModeSelect) {
				return;
			}
			var mode = phoneModeSelect.value;
			var enabled = !isUnmanagedMode();

			[applyPhoneMaskRadios, showCountryCodeRadios, contactRequiredRadios, contactFieldPositionRadios].forEach(function (group) {
				setDisabledState(group, !enabled);
			});

			// "Celular Oculto" só existe no modo "Permitir Telefone Celular e Fixo".
			var shimShown = (mode === 'phone_and_cellphone');
			cellphoneShimRadios.forEach(function (radio) {
				if (!shimShown && radio.value === 'no') {
					radio.checked = true;
				}
			});
			if (cellphoneShimRadios.length) {
				var shimBlock = cellphoneShimRadios[0].closest('.admin-layout-field-parent-flex');
				if (shimBlock) {
					// `''` devolve o valor do CSS (a linha aninhada usa `display: block`).
					shimBlock.style.display = shimShown ? '' : 'none';
				}
			}
			var shimOn = isYes(cellphoneShimRadios);

			// O bloco "Campo de Celular" fica desabilitado (só VISUALMENTE — o valor
			// precisa ir no POST) quando o modo é "Permitir somente Telefone Celular"
			// ou quando o "Celular Oculto" está ligado.
			var cellphoneModeBlocked = (mode === 'cellphone_only') || shimOn;

			setDisabledState(enableCellphoneRadios, cellphoneModeBlocked);

			if (cellphoneModeBlocked) {
				enableCellphoneRadios.forEach(function (radio) {
					if (radio.value === 'no') {
						radio.checked = true;
					}
				});
			}

			updateCellphoneRequiredState();

			if (enabled) {
				updatePhoneChildState();
			}
			updateValidateDddState();
		}

		updatePhoneChildState();
		updateValidateDddState();
		updateCellphoneRequiredState();
		updatePhoneModeChildState();

		applyPhoneMaskRadios.forEach(function (radio) {
			radio.addEventListener('change', function () {
				updatePhoneChildState();
				updateValidateDddState();
			});
		});
		contactRequiredRadios.forEach(function (radio) {
			radio.addEventListener('change', updateValidateDddState);
		});
		cellphoneRequiredRadios.forEach(function (radio) {
			radio.addEventListener('change', function () {
				updateCellphoneRequiredState();
				updateValidateDddState();
			});
		});
		if (phoneModeSelect) {
			phoneModeSelect.addEventListener('change', updatePhoneModeChildState);
		}
		enableCellphoneRadios.forEach(function (radio) {
			radio.addEventListener('change', function () {
				updateCellphoneRequiredState();
				updateValidateDddState();
			});
		});
		cellphoneShimRadios.forEach(function (radio) {
			radio.addEventListener('change', updatePhoneModeChildState);
		});

		handleAddressFillMutualExclusion();
	}

	function init() {
		if (!document.querySelector('.admin-layout-page-wrapper')) return;

		initDependencies();
		initRgFieldState();
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
}());
