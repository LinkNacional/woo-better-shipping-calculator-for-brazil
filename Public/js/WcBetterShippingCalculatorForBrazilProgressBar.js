(function ($) {
	'use strict';

	let previousPorcent = null;
	let isLoading = false;
	let loadingTimeout = null;
	let currentCartTotal = 0;
	let lastValidPercent = 0;
	let lastValidMessage = '';
	let cartUpdateTimeout = null; // Para debounce das atualizações do carrinho

	// Inicializa com o valor do PHP se disponível
	const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
	if (progressConfig.initial_cart_total) {
		currentCartTotal = parseFloat(progressConfig.initial_cart_total);
	}

	let minValue = typeof wc_better_shipping_progress !== 'undefined'
		? parseFloat(wc_better_shipping_progress.min_free_shipping_value)
		: 0;

	// Inicializa os valores válidos na primeira execução
	function initializeValidValues() {
		if (lastValidPercent === 0 && lastValidMessage === '') {
			const cartTotal = currentCartTotal;
			const currencySymbol = progressConfig.currency_symbol || 'R$';
			const successMessage = progressConfig.min_free_shipping_success_message || 'Parabéns! Você tem frete grátis!';
			let progressMessage = progressConfig.min_free_shipping_message || 'Falta(m) apenas mais {value} para obter FRETE GRÁTIS';

			// Calcula valores iniciais
			if (minValue <= 0) {
				lastValidPercent = 100;
				lastValidMessage = successMessage;
			} else {
				lastValidPercent = Math.min((cartTotal / minValue) * 100, 100);
				if (cartTotal >= minValue) {
					lastValidMessage = successMessage;
				} else {
					const remainingValue = (minValue - cartTotal).toFixed(2);
					const formattedValue = currencySymbol + remainingValue;
				lastValidMessage = progressMessage.includes('{value}') ? progressMessage.replace('{value}', formattedValue) : progressMessage;
				}
			}
		}
	}

	// Intercepta requisições para a API do WooCommerce Store ou shortcode
	function interceptCartRequests() {
		const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
		const isShortcode = !progressConfig.has_cart_block;
		const currentUrl = progressConfig.current_url || window.location.href;

		if (isShortcode) {
			// Para shortcode, usa observers do DOM ao invés de interceptar globalmente
			observeShortcodeChanges(currentUrl);
		} else {
			// Para blocks, intercepta apenas URLs específicas da Store API
			interceptStoreAPISpecific();
		}
	}

	// Abordagem alternativa para shortcode usando MutationObserver
	function observeShortcodeChanges(baseUrl) {
		// Observer para mudanças no DOM do carrinho/checkout
		const observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				if (mutation.type === 'childList' || mutation.type === 'characterData') {
					// Verifica se houve mudança nos totais
					const cartTotalElements = document.querySelectorAll([
						'td[data-title="Subtotal"] .woocommerce-Price-amount.amount bdi',
						'.cart-subtotal .woocommerce-Price-amount.amount bdi',
						'.order-total .woocommerce-Price-amount.amount bdi'
					].join(','));
					
					if (cartTotalElements.length > 0) {
						// Debounce para evitar atualizações excessivas
						clearTimeout(window.wcProgressBarTimeout);
						window.wcProgressBarTimeout = setTimeout(() => {
							currentCartTotal = getCartTotalFromDOM();
							insertOrUpdateProgressBar();
						}, 500);
					}
				}
			});
		});

		// Observa mudanças no carrinho e checkout
		const targets = document.querySelectorAll('.cart, .checkout, .woocommerce-cart, .woocommerce-checkout');
		targets.forEach(target => {
			observer.observe(target, {
				childList: true,
				subtree: true,
				characterData: true
			});
		});

		// Fallback: escuta eventos do WooCommerce
		$(document).on('updated_cart_totals updated_checkout', function() {
			setTimeout(() => {
				currentCartTotal = getCartTotalFromDOM();
				insertOrUpdateProgressBar();
			}, 300);
		});
	}

	// Função para obter dados do carrinho via WooCommerce REST API (para shortcode)
	function getCartDataViaAjax() {
		// Debounce para evitar múltiplas requisições simultâneas
		if (cartUpdateTimeout) {
			clearTimeout(cartUpdateTimeout);
		}
		
		cartUpdateTimeout = setTimeout(() => {
			cartUpdateTimeout = null;
			
			const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
			const cartApiUrl = progressConfig.cart_api_url || '/wp-json/wc/store/v1/cart';
			
			fetch(cartApiUrl, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
				}
			})
			.then(response => response.json())
			.then(data => {
				if (data && data.totals && data.totals.total_items) {
					// O valor vem em centavos, divide por 100 para obter o valor real
					const totalItems = parseInt(data.totals.total_items) / 100;
					currentCartTotal = totalItems;
				} else {
					// Fallback para DOM se API falhar
					currentCartTotal = getCartTotalFromDOM();
				}
				stopLoadingState();
			})
			.catch(error => {
				// Fallback para DOM se API falhar
				currentCartTotal = getCartTotalFromDOM();
				stopLoadingState();
			});
		}, 300); // Debounce de 300ms
	}

	// Interceptor específico e conservador para Store API
	function interceptStoreAPISpecific() {
		const originalFetch = window.fetch;
		
		window.fetch = function(...args) {
			const [url, config] = args;
			
			// Verificação MUITO específica - só intercepta se for EXATAMENTE Store API
			const isExactStoreAPI = url && (
				url.includes('/wp-json/wc/store/v1/batch') ||
				url.includes('/wp-json/wc/store/v1/cart')
			) && !url.includes('braspag') && !url.includes('cardinalcommerce');
			
			if (!isExactStoreAPI) {
				return originalFetch.apply(this, args);
			}
			
			// Só processa se for URL local (mesmo domínio)
			const currentDomain = window.location.hostname;
			let requestDomain = '';
			
			try {
				if (url.startsWith('http')) {
					requestDomain = new URL(url).hostname;
				} else {
					requestDomain = currentDomain; // URL relativa
				}
			} catch (e) {
				requestDomain = currentDomain;
			}
			
			// Se não for o mesmo domínio, não intercepta
			if (requestDomain !== currentDomain) {
				return originalFetch.apply(this, args);
			}

			// Inicia loading apenas para batch
			if (url.includes('/wp-json/wc/store/v1/batch')) {
				startLoadingState();
			}
			
			return originalFetch.apply(this, args)
				.then(response => {
					const clonedResponse = response.clone();
					
					if (url.includes('/wp-json/wc/store/v1/batch')) {
						clonedResponse.json()
							.then(data => {
								if (data && data.responses && data.responses[0] && data.responses[0].body) {
									const cartData = data.responses[0].body;
									
									if (cartData.totals && cartData.totals.total_items) {
										const totalItems = parseInt(cartData.totals.total_items) / 100;
										currentCartTotal = totalItems;
										
										setTimeout(() => {
											stopLoadingState();
										}, 300);
									}
								}
							})
							.catch(error => {
								stopLoadingState();
							});
					} else if (url.includes('/wp-json/wc/store/v1/cart')) {
						clonedResponse.json()
							.then(data => {
								if (data && data.totals && data.totals.total_items) {
									const totalItems = parseInt(data.totals.total_items) / 100;
									currentCartTotal = totalItems;
									insertOrUpdateProgressBar();
								}
							})
							.catch(error => {
								// Silencioso
							});
					}
					
					return response;
				})
				.catch(error => {
					if (url.includes('/wp-json/wc/store/v1/batch')) {
						stopLoadingState();
					}
					throw error;
				});
		};
	}

	// Função fallback para obter total do carrinho via DOM (caso a API não funcione)
	function getCartTotalFromDOM() {
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
			return currentCartTotal || 0;
		}

		const currencySettings = window.wcSettings?.currency || {};
		const decimalSeparator = currencySettings.decimalSeparator || ',';
		const thousandSeparator = currencySettings.thousandSeparator || '.';

		const effectiveDecimalSeparator = decimalSeparator === '.' || decimalSeparator === ',' ? decimalSeparator : ',';
		const effectiveThousandSeparator = thousandSeparator === '.' || thousandSeparator === ',' ? thousandSeparator : '.';

		let rawText = el.textContent.trim();
		let value = rawText
			.replace(new RegExp(`\\${effectiveThousandSeparator}`, 'g'), '')
			.replace(new RegExp(`\\${effectiveDecimalSeparator}`), '.')
			.replace(/[^\d.-]/g, '');

		let parsedValue = parseFloat(value) || 0;
		currentCartTotal = parsedValue;
		return parsedValue;
	}

	function insertOrUpdateProgressBar() {
		let cartTotal = currentCartTotal || getCartTotalFromDOM();
		let percent = 0;
		let message = '';

		// Obtém as configurações do localize
		const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
		const currencySymbol = progressConfig.currency_symbol || 'R$';
		const successMessage = progressConfig.min_free_shipping_success_message || 'Parabéns! Você tem frete grátis!';
		const enableProgressBarValue = progressConfig.enable_progress_bar_value !== 'no'; // padrão é true
		let progressMessage = progressConfig.min_free_shipping_message || 'Falta(m) apenas mais {value} para obter FRETE GRÁTIS';

		// Se está carregando, mantém os valores anteriores
		let barText = '';
		if (isLoading) {
			percent = lastValidPercent;
			message = 'Carregando...';
			barText = enableProgressBarValue ? 'Carregando...' : '';
		} else {
			// Calcula novos valores
			if (minValue <= 0) {
				percent = 100;
				message = successMessage;
				barText = enableProgressBarValue ? 'Completo!' : '';
			} else {
				percent = Math.min((cartTotal / minValue) * 100, 100);
				if (cartTotal >= minValue) {
					message = successMessage;
					barText = enableProgressBarValue ? 'Completo!' : '';
				} else {
					const remainingValue = (minValue - cartTotal).toFixed(2);
					const formattedValue = currencySymbol + remainingValue;
				message = progressMessage.includes('{value}') ? progressMessage.replace('{value}', formattedValue) : progressMessage;
					barText = enableProgressBarValue ? 'Falta ' + formattedValue : '';
				}
			}
			
			// Salva os valores válidos
			lastValidPercent = percent;
			lastValidMessage = message;
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
			progressBarWrapper.style.position = 'relative';

			// Cria a barra de progresso
			let progressBar = document.createElement('div');
			progressBar.className = 'wc-better-shipping-progress';
			progressBar.style.background = '#4caf50';
			progressBar.style.width = percent + '%';
			progressBar.style.height = '100%';
			progressBar.style.transition = 'width 0.5s ease-in-out';
			
			// Adiciona animação de carregamento quando necessário
			if (isLoading) {
				progressBar.style.background = 'linear-gradient(90deg, #ddd 0%, #aaa 50%, #ddd 100%)';
				progressBar.style.backgroundSize = '200% 100%';
				progressBar.style.animation = 'loading-shimmer 1.5s ease-in-out infinite';
				// Mantém o percent atual, não muda para 30%
			}

			// Cria o texto dentro da barra (apenas se estiver habilitado)
			if (enableProgressBarValue) {
				let progressBarInnerText = document.createElement('div');
				progressBarInnerText.className = 'wc-better-shipping-progress-inner-text';
				progressBarInnerText.style.position = 'absolute';
				progressBarInnerText.style.top = '50%';
				progressBarInnerText.style.left = '8px';
				progressBarInnerText.style.transform = 'translateY(-50%)';
				progressBarInnerText.style.fontSize = '12px';
				progressBarInnerText.style.fontWeight = 'bold';
				progressBarInnerText.style.color = '#fff';
				progressBarInnerText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
				progressBarInnerText.style.whiteSpace = 'nowrap';
				progressBarInnerText.style.zIndex = '10';
				progressBarInnerText.textContent = barText;

				// Adiciona a barra de progresso e o texto ao contêiner
				progressBarWrapper.appendChild(progressBar);
				progressBarWrapper.appendChild(progressBarInnerText);
			} else {
				// Adiciona apenas a barra de progresso ao contêiner
				progressBarWrapper.appendChild(progressBar);
			}

			// Cria o texto da barra de progresso
			let progressBarText = document.createElement('div');
			progressBarText.className = 'wc-better-shipping-progress-text';
			progressBarText.style.marginTop = '5px';
			progressBarText.style.fontSize = '14px';
			progressBarText.textContent = message;

			// Adiciona o contêiner da barra e o texto ao contêiner principal
			progressBarContainer.appendChild(progressBarWrapper);
			progressBarContainer.appendChild(progressBarText);

			// Adiciona estilos CSS para animação de carregamento
			if (!document.getElementById('wc-better-progress-styles')) {
				const style = document.createElement('style');
				style.id = 'wc-better-progress-styles';
				style.textContent = `
					@keyframes loading-shimmer {
						0% {
							background-position: -200% 0;
						}
						100% {
							background-position: 200% 0;
						}
					}
					.wc-better-shipping-progress.loading {
						background: linear-gradient(90deg, #ddd 0%, #aaa 50%, #ddd 100%) !important;
						background-size: 200% 100% !important;
						animation: loading-shimmer 1.5s ease-in-out infinite !important;
					}
				`;
				document.head.appendChild(style);
			}

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
			if (previousPorcent !== percent || isLoading) {
				let bar = progressBar.querySelector('.wc-better-shipping-progress');
				if (bar) {
					if (isLoading) {
						bar.classList.add('loading');
						// Mantém a largura atual, não altera para 30%
						bar.style.background = 'linear-gradient(90deg, #ddd 0%, #aaa 50%, #ddd 100%)';
						bar.style.backgroundSize = '200% 100%';
						bar.style.animation = 'loading-shimmer 1.5s ease-in-out infinite';
					} else {
						bar.classList.remove('loading');
						bar.style.width = percent + '%';
						bar.style.background = '#4caf50';
						bar.style.animation = 'none';
					}
				}
				// Atualiza o texto interno da barra (apenas se estiver habilitado)
				let innerText = progressBar.querySelector('.wc-better-shipping-progress-inner-text');
				if (enableProgressBarValue) {
					if (innerText) {
						innerText.textContent = barText;
					} else {
						// Se não existe mas deveria existir, cria o elemento
						let progressBarWrapper = progressBar.querySelector('.wc-better-shipping-progress').parentNode;
						let newInnerText = document.createElement('div');
						newInnerText.className = 'wc-better-shipping-progress-inner-text';
						newInnerText.style.position = 'absolute';
						newInnerText.style.top = '50%';
						newInnerText.style.left = '8px';
						newInnerText.style.transform = 'translateY(-50%)';
						newInnerText.style.fontSize = '12px';
						newInnerText.style.fontWeight = 'bold';
						newInnerText.style.color = '#fff';
						newInnerText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
						newInnerText.style.whiteSpace = 'nowrap';
						newInnerText.style.zIndex = '10';
						newInnerText.textContent = barText;
						progressBarWrapper.appendChild(newInnerText);
					}
				} else {
					// Se não deve mostrar o texto mas ele existe, remove
					if (innerText) {
						innerText.remove();
					}
				}
				// Atualiza o texto abaixo da barra
				let text = progressBar.querySelector('.wc-better-shipping-progress-text');
				if (text) {
					text.textContent = message;
				}
				previousPorcent = percent;
			}
		}
	}

	function startLoadingState() {
		isLoading = true;
		
		// Limpa timeout anterior se existir
		if (loadingTimeout) {
			clearTimeout(loadingTimeout);
		}
		
		insertOrUpdateProgressBar();
		
		// Timeout de segurança para garantir que não fique carregando para sempre
		loadingTimeout = setTimeout(() => {
			stopLoadingState();
		}, 5000);
	}

	function stopLoadingState() {
		isLoading = false;
		
		if (loadingTimeout) {
			clearTimeout(loadingTimeout);
			loadingTimeout = null;
		}
		
		// Pequeno delay para suavizar a transição
		setTimeout(() => {
			insertOrUpdateProgressBar();
		}, 200);
	}

	// Inicialização simples
	function init() {
		// Inicializa os valores válidos com base no subtotal do PHP
		initializeValidValues();
		
		// Intercept Cart requests (Store API ou Shortcode)
		interceptCartRequests();
		
		// Inicializa a barra de progresso
		insertOrUpdateProgressBar();
		
		// Evento simples para mudanças de quantidade (fallback)
		$(document).on('change', 'input.qty', function () {
			setTimeout(() => {
				insertOrUpdateProgressBar();
			}, 500);
		});
		
		// Eventos WooCommerce tradicionais (fallback)
		$(document).on('updated_cart_totals updated_checkout', function () {
			setTimeout(() => {
				insertOrUpdateProgressBar();
			}, 300);
		});
	}

	// Inicializa quando o DOM estiver pronto
	$(document).ready(function() {
		init();
	});

	// Também inicializa quando a página estiver completamente carregada
	$(window).on('load', function () {
		setTimeout(init, 500);
	});

})(jQuery);