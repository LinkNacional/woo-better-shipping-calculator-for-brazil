(function ($) {
	'use strict';

	let previousPorcent = null

	let minValue = typeof wc_better_shipping_progress !== 'undefined'
		? parseFloat(wc_better_shipping_progress.min_free_shipping_value)
		: 0;

	function getCartTotal() {
		// Lista de seletores possíveis para o valor do carrinho
		let selectors = [
			'.wc-block-formatted-money-amount.wc-block-components-totals-item__value',
			'td[data-title="Subtotal"] .woocommerce-Price-amount.amount bdi',
			'.cart-subtotal .woocommerce-Price-amount.amount bdi',
			'.cart-subtotal .woocommerce-Price-amount.amount',
			'.wc-block-components-totals-item__value .wc-block-formatted-money-amount',
			'.order-total .woocommerce-Price-amount.amount bdi',
			'.order-total .woocommerce-Price-amount.amount'
		];

		let el = null;
		for (let selector of selectors) {
			el = document.querySelector(selector);
			if (el && el.textContent.trim()) {
				break;
			}
		}

		if (!el || !el.textContent.trim()) {
			return 0;
		}

		// Obtém as configurações de moeda do WooCommerce
		const currencySettings = window.wcSettings?.currency || {};
		const decimalSeparator = currencySettings.decimalSeparator || ',';
		const thousandSeparator = currencySettings.thousandSeparator || '.';

		// Força os separadores padrão se forem diferentes
		const effectiveDecimalSeparator = decimalSeparator === '.' || decimalSeparator === ',' ? decimalSeparator : ',';
		const effectiveThousandSeparator = thousandSeparator === '.' || thousandSeparator === ',' ? thousandSeparator : '.';

		// Converte o valor do texto para número
		let rawText = el.textContent.trim();
		let value = rawText
			.replace(new RegExp(`\\${effectiveThousandSeparator}`, 'g'), '') // Remove o separador de milhar
			.replace(new RegExp(`\\${effectiveDecimalSeparator}`), '.') // Substitui o separador decimal por '.'
			.replace(/[^\d.-]/g, ''); // Remove caracteres não numéricos

		let parsedValue = parseFloat(value) || 0;

		return parsedValue;
	}

	function insertOrUpdateProgressBar() {
		let cartTotal = getCartTotal();
		let percent = 0;
		let message = '';

		if (minValue <= 0) {
			percent = 100;
			message = 'Parabéns! Você tem frete grátis!';
		} else {
			percent = Math.min((cartTotal / minValue) * 100, 100);
			message = cartTotal >= minValue
				? 'Parabéns! Você tem frete grátis!'
				: 'Falta(m) apenas mais R$' + (minValue - cartTotal).toFixed(2) + ' para obter FRETE GRÁTIS';
		}

		let progressBar = document.querySelector('.wc-better-shipping-progress-bar');
		if (!progressBar) {
			let progressBarContainer = document.createElement('div');
			progressBarContainer.className = 'wc-better-shipping-progress-bar';
			progressBarContainer.style.margin = '15px 0px';
			progressBarContainer.style.padding = '0px 16px';

			// Cria o contêiner da barra de progresso
			let progressBarWrapper = document.createElement('div');
			progressBarWrapper.style.background = '#eee';
			progressBarWrapper.style.borderRadius = '4px';
			progressBarWrapper.style.overflow = 'hidden';
			progressBarWrapper.style.height = '20px';

			// Cria a barra de progresso
			let progressBar = document.createElement('div');
			progressBar.className = 'wc-better-shipping-progress';
			progressBar.style.background = '#4caf50';
			progressBar.style.width = percent + '%';
			progressBar.style.height = '100%';
			progressBar.style.transition = 'width 0.5s';

			// Adiciona a barra de progresso ao contêiner
			progressBarWrapper.appendChild(progressBar);

			// Cria o texto da barra de progresso
			let progressBarText = document.createElement('div');
			progressBarText.className = 'wc-better-shipping-progress-text';
			progressBarText.style.marginTop = '5px';
			progressBarText.style.fontSize = '14px';
			progressBarText.textContent = message;

			// Adiciona o contêiner da barra e o texto ao contêiner principal
			progressBarContainer.appendChild(progressBarWrapper);
			progressBarContainer.appendChild(progressBarText);

			let targets = document.querySelectorAll('.cart-collaterals .cart_totals h2');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}

			targets = document.querySelectorAll('.woocommerce-checkout-review-order');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}

			targets = document.querySelectorAll('.wp-block-woocommerce-cart-order-summary-heading-block');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}
			targets = document.querySelectorAll('.wc-block-components-checkout-order-summary__title');
			if (targets.length > 0) {
				progressBarContainer.style.padding = '0px 10px';
				targets.forEach(function (target) {
					target.parentNode.insertBefore(progressBarContainer, target);
				});
			}
		} else {
			if (previousPorcent !== percent) {
				let bar = progressBar.querySelector('.wc-better-shipping-progress');
				if (bar) bar.style.width = percent + '%';
				let text = progressBar.querySelector('.wc-better-shipping-progress-text');
				if (text) {
					text.textContent = message;
				}
				previousPorcent = percent;
			}
		}
	}

	let observers = []; // Array para armazenar os observers

	function waitForCartTotalAndInit() {
		let attempts = 0; // Contador de tentativas

		function tryInit() {
			// Busca por múltiplos targets possíveis
			let targets = [
				'.wc-block-formatted-money-amount.wc-block-components-totals-item__value',
				'.cart-collaterals',
				'#order_review',
				'.woocommerce-cart-form',
				'.wc-block-cart',
				'.wc-block-checkout',
				'body' // Fallback para o body se não encontrar nada
			];

			let foundTarget = null;
			for (let selector of targets) {
				foundTarget = document.querySelector(selector);
				if (foundTarget) {
					break;
				}
			}

			if (!foundTarget && attempts < 30) {
				attempts++;
				setTimeout(tryInit, 200); // Tenta novamente após 200ms
				return;
			}

			// Se não encontrou target específico, usa o body como fallback
			if (!foundTarget) {
				foundTarget = document.body;
			}

			insertOrUpdateProgressBar();

			// Limpa observers anteriores
			observers.forEach(obs => obs.disconnect());
			observers = [];

			// Cria um novo observer com configurações mais abrangentes
			let observer = new MutationObserver(function (mutations) {
				let shouldUpdate = false;

				mutations.forEach(function (mutation) {
					// Verifica se houve mudanças relevantes
					if (mutation.type === 'childList' || mutation.type === 'characterData') {
						// Verifica se a mutação afeta elementos relacionados ao carrinho
						let target = mutation.target;
						
						// Verifica se target é um elemento DOM válido antes de usar closest
						if (target && target.nodeType === Node.ELEMENT_NODE && typeof target.closest === 'function') {
							if (target.classList?.contains('woocommerce-Price-amount') ||
								target.classList?.contains('wc-block-formatted-money-amount') ||
								target.closest('.cart-subtotal') ||
								target.closest('.wc-block-components-totals-item') ||
								target.closest('.woocommerce-cart-form') ||
								target.closest('.wc-block-cart') ||
								target.closest('.wc-block-checkout')
							) {
								shouldUpdate = true;
							}
						}
						// Verifica também se o target tem classes relevantes sem usar closest
						else if (target && target.classList) {
							if (target.classList.contains('woocommerce-Price-amount') ||
								target.classList.contains('wc-block-formatted-money-amount') ||
								target.classList.contains('cart-subtotal') ||
								target.classList.contains('wc-block-components-totals-item') ||
								target.classList.contains('woocommerce-cart-form') ||
								target.classList.contains('wc-block-cart') ||
								target.classList.contains('wc-block-checkout')
							) {
								shouldUpdate = true;
							}
						}
					}
				});

				if (shouldUpdate) {
					// Adiciona um pequeno delay para garantir que o DOM foi atualizado
					setTimeout(insertOrUpdateProgressBar, 100);
				}
			});

			observer.observe(foundTarget, {
				childList: true,
				characterData: true,
				subtree: true,
				attributes: true,
				attributeFilter: ['class', 'data-title']
			});

			observers.push(observer);

			// Também monitora eventos específicos do WooCommerce
			$(document).on('updated_cart_totals updated_checkout', function () {
				setTimeout(insertOrUpdateProgressBar, 100);
			});

			// Observer adicional para mudanças na quantidade de produtos
			$(document).on('change', 'input.qty', function () {
				setTimeout(insertOrUpdateProgressBar, 500);
			});

			// Observer para mudanças em blocos do Gutenberg (WooCommerce Blocks)
			$(document).on('wc-blocks_cart_updated wc-blocks_checkout_updated', function () {
				setTimeout(insertOrUpdateProgressBar, 100);
			});
		}

		tryInit(); // Inicia a primeira tentativa
	}

	// Função para verificar periodicamente se o observer ainda está funcionando
	function periodicCheck() {
		// Verifica se existe algum observer ativo
		if (observers.length === 0) {
			waitForCartTotalAndInit();
		}

		// Atualiza a barra de progresso periodicamente
		insertOrUpdateProgressBar();
	}

	// Inicializa quando o DOM estiver pronto
	$(waitForCartTotalAndInit);

	// Também inicializa quando a página estiver completamente carregada
	$(window).on('load', function () {
		setTimeout(waitForCartTotalAndInit, 500);
	});

	// Verifica periodicamente se o observer ainda está funcionando (a cada 5 segundos)
	setInterval(periodicCheck, 5000);

})(jQuery);