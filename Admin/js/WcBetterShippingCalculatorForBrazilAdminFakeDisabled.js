/**
 * "Desabilitado" apenas VISUAL para os campos das configurações.
 *
 * REGRA (AGENTS.md § 7): NUNCA usar o atributo `disabled` para fingir que um
 * campo de configuração está desabilitado.
 *
 * Motivo: input `disabled` NÃO vai no POST. O `WC_Admin_Settings::save_fields()`
 * recebe `null` para a option, cai no `continue` e MANTÉM o valor ANTIGO salvo —
 * a tela passa a mostrar "Não"/desabilitado enquanto o banco continua "yes", e o
 * recurso segue ativo no checkout (ex.: campo "Celular" fantasma, preenchimento
 * automático por CEP, "Celular Obrigatório" travando o pedido).
 *
 * Aqui o bloqueio é só de APARÊNCIA: classe `.woo-better-fake-disabled`
 * (opacidade + `cursor: not-allowed`, ver AdminSettings.css) e bloqueio de
 * clique/teclado em fase de captura. O input segue HABILITADO, então o valor
 * exibido (inclusive o que o JS força em `checked`) é o valor enviado.
 *
 * Uso:
 *   window.wcBetterFakeDisabled(radioOuNodeList, true);   // parece desabilitado
 *   window.wcBetterFakeDisabled(radioOuNodeList, false);  // volta ao normal
 *
 * @package Woo_Better_Shipping_Calculator_For_Brazil
 */

(function () {
	'use strict';

	var CLASS = 'woo-better-fake-disabled';

	// Sobe na árvore até achar um elemento marcado como "desabilitado visual".
	function fakeDisabledContainer(node) {
		while (node && node.nodeType === 1) {
			if (node.classList && node.classList.contains(CLASS)) {
				return node;
			}
			node = node.parentElement;
		}

		return null;
	}

	function blockMouseEvent(event) {
		if (!fakeDisabledContainer(event.target)) {
			return;
		}

		// `preventDefault` no clique do `<label>` também impede a ativação do
		// input associado — que é exatamente o comportamento de um disabled.
		event.preventDefault();
		event.stopPropagation();
	}

	function blockKeyboardEvent(event) {
		if (!fakeDisabledContainer(event.target)) {
			return;
		}

		var blocked = [' ', 'Spacebar', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

		if (blocked.indexOf(event.key) !== -1) {
			event.preventDefault();
			event.stopPropagation();
		}
	}

	document.addEventListener('click', blockMouseEvent, true);
	document.addEventListener('mousedown', blockMouseEvent, true);
	document.addEventListener('keydown', blockKeyboardEvent, true);

	function toggleClass(node, isDisabled) {
		if (!node || !node.classList) {
			return;
		}

		if (isDisabled) {
			node.classList.add(CLASS);
		} else {
			node.classList.remove(CLASS);
		}
	}

	function apply(element, isDisabled) {
		if (!element || element.nodeType !== 1) {
			return;
		}

		// Garante que o campo continua indo no POST (auto-cura de um estado
		// antigo, do tempo em que o atributo `disabled` era usado).
		element.removeAttribute('disabled');
		element.disabled = false;
		element.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');

		toggleClass(element, isDisabled);

		// O rótulo é um `<label>` irmão do input no layout de cards; marcar os
		// dois deixa o texto com o mesmo `cursor: not-allowed` e a mesma opacidade.
		if (element.closest) {
			toggleClass(element.closest('label'), isDisabled);
		}
	}

	/**
	 * Aplica (ou remove) o estado "desabilitado visual".
	 *
	 * @param {Element|NodeList|Array} targets    Input(s) alvo.
	 * @param {boolean}                isDisabled Se deve parecer desabilitado.
	 * @return {void}
	 */
	window.wcBetterFakeDisabled = function (targets, isDisabled) {
		if (!targets) {
			return;
		}

		if (targets.nodeType === 1) {
			apply(targets, isDisabled);

			return;
		}

		Array.prototype.forEach.call(targets, function (element) {
			apply(element, isDisabled);
		});
	};
}());
