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

			rgRequiredRadios.forEach(function (radio) {
				radio.disabled = !enabled;
				radio.style.cursor = enabled ? '' : 'not-allowed';
			});
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

		function updateAutoAddressState() {
			var enabled = isYes(positionRadios);
			autoAddressRadios.forEach(function (radio) {
				radio.disabled = !enabled;
				radio.style.cursor = enabled ? '' : 'not-allowed';
				if (!enabled) {
					if (radio.value === 'no') {
						radio.checked = true;
					} else if (radio.value === 'yes') {
						radio.checked = false;
					}
				}
			});
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
			showCountryCodeRadios.forEach(function (radio) {
				radio.disabled = !enabled;
				radio.style.cursor = enabled ? '' : 'not-allowed';
				if (!enabled) {
					if (radio.value === 'no') {
						radio.checked = true;
					} else if (radio.value === 'yes') {
						radio.checked = false;
					}
				}
			});
		}

		// "Validar Número de Telefone": só faz sentido com máscara on, contato obrigatório
		// e o modo de telefone diferente de "Desabilitar".
		function updateValidateDddState() {
			var maskOn = isYes(applyPhoneMaskRadios);
			var cellphoneOn = isYes(enableCellphoneRadios);
			var requiredOn = isYes(contactRequiredRadios) || (cellphoneOn && isYes(cellphoneRequiredRadios));
			var modeOk = !phoneModeSelect || phoneModeSelect.value !== 'disabled';
			var on = maskOn && requiredOn && modeOk;

			validateDddRadios.forEach(function (radio) {
				radio.disabled = !on;
				radio.style.cursor = on ? '' : 'not-allowed';
			});
		}

		// "Celular Obrigatório" só fica ativo quando o "Campo de Celular" está habilitado
		// e o modo não é "somente Celular".
		function updateCellphoneRequiredState() {
			var enableYes = isYes(enableCellphoneRadios);
			var modeAllows = !phoneModeSelect || phoneModeSelect.value !== 'cellphone_only';
			var on = enableYes && modeAllows;

			cellphoneRequiredRadios.forEach(function (radio) {
				radio.disabled = !on;
				radio.style.cursor = on ? '' : 'not-allowed';
				if (!modeAllows && radio.value === 'no') {
					radio.checked = true;
				}
			});
		}

		function updatePhoneModeChildState() {
			if (!phoneModeSelect) {
				return;
			}
			var mode = phoneModeSelect.value;
			var enabled = mode !== 'disabled';

			[applyPhoneMaskRadios, showCountryCodeRadios, contactRequiredRadios, contactFieldPositionRadios].forEach(function (group) {
				group.forEach(function (radio) {
					radio.disabled = !enabled;
					radio.style.cursor = enabled ? '' : 'not-allowed';
				});
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

			// O bloco "Campo de Celular" fica desabilitado quando o modo é
			// "Permitir somente Telefone Celular" ou quando o "Celular Oculto" está ligado.
			var cellphoneModeBlocked = (mode === 'cellphone_only') || shimOn;
			enableCellphoneRadios.forEach(function (radio) {
				radio.disabled = cellphoneModeBlocked;
				radio.style.cursor = cellphoneModeBlocked ? 'not-allowed' : '';
				if (cellphoneModeBlocked && radio.value === 'no') {
					radio.checked = true;
				}
			});

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
