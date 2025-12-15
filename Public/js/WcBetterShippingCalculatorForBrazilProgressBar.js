(function ($) {
	'use strict';

	let previousPorcent = null;
	let isLoading = false;
	let loadingTimeout = null;
	let currentCartTotal = 0;
	let lastValidPercent = 0;
	let lastValidMessage = '';

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

			// Valida se a mensagem personalizada contém o placeholder {value}
			if (!progressMessage.includes('{value}')) {
				progressMessage = 'Falta(m) apenas mais {value} para obter FRETE GRÁTIS';
			}

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
					lastValidMessage = progressMessage.replace('{value}', formattedValue);
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
			// Para shortcode, intercepta requisições de form data
			interceptShortcodeRequests(currentUrl);
		} else {
			// Para blocks, intercepta API Store
			interceptStoreAPI();
		}
	}

	// Intercepta requisições do shortcode (update_cart e remove_cart via XHR)
	function interceptShortcodeRequests(baseUrl) {
		// Intercepta XMLHttpRequest (usado pelo shortcode)
		const originalXHROpen = XMLHttpRequest.prototype.open;
		const originalXHRSend = XMLHttpRequest.prototype.send;
		
		XMLHttpRequest.prototype.open = function(method, url, ...args) {
			this._intercepted_url = url;
			this._intercepted_method = method;
			return originalXHROpen.apply(this, [method, url, ...args]);
		};
		
		XMLHttpRequest.prototype.send = function(data) {
			const url = this._intercepted_url;
			let isCartAction = false;
			
			// Verifica se é atualização do carrinho
			if (url && url.includes(baseUrl) && data) {
				if (typeof data === 'string') {
					if (data.includes('update_cart') || data.includes('remove_item')) {
						isCartAction = true;
					}
				} else if (data instanceof FormData) {
					const action = data.get('update_cart') || data.get('remove_item');
					if (action) {
						isCartAction = true;
					}
				}
			}
			
			// Também verifica URLs com parâmetros para remove via GET
			if (url && url.includes('remove_item') && url.includes(baseUrl.split('?')[0])) {
				isCartAction = true;
			}
			
			if (isCartAction) {
				startLoadingState();
				
				// Adiciona listener para quando a requisição terminar
				this.addEventListener('readystatechange', function() {
					if (this.readyState === 4) {
						setTimeout(() => {
							getCartDataViaAjax();
						}, 500);
					}
				});
			}
			
			return originalXHRSend.apply(this, arguments);
		};
		
		// Mantém o interceptor fetch como fallback
		const originalFetch = window.fetch;
		
		window.fetch = function(...args) {
			const [url, config] = args;
			
			// Verifica se é requisição do shortcode para a URL atual
			if (url && url.includes(baseUrl) && config && config.body) {
				let isCartAction = false;
				
				// Se é FormData, verifica as ações
				if (config.body instanceof FormData) {
					const action = config.body.get('update_cart') || config.body.get('remove_item');
					if (action) {
						isCartAction = true;
					}
				}
				// Se é URLSearchParams ou string, verifica o conteúdo
				else if (typeof config.body === 'string') {
					if (config.body.includes('update_cart') || config.body.includes('remove_item')) {
						isCartAction = true;
					}
				}
				
				if (isCartAction) {
					startLoadingState();
				}
			}
			
			// Também verifica URLs com parâmetros para remove via GET
			if (url && url.includes('remove_item') && url.includes(baseUrl.split('?')[0])) {
				startLoadingState();
			}
			
			return originalFetch.apply(this, args)
				.then(response => {
					if (url && (url.includes(baseUrl) || url.includes('remove_item'))) {
						// Para shortcode, faz uma requisição AJAX para obter dados atualizados do carrinho
						setTimeout(() => {
							getCartDataViaAjax();
						}, 500);
					}
					
					return response;
				})
				.catch(error => {
					if (url && (url.includes(baseUrl) || url.includes('remove_item'))) {
						stopLoadingState();
					}
					throw error;
				});
		};
	}

	// Função para obter dados do carrinho via WooCommerce REST API (para shortcode)
	function getCartDataViaAjax() {
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
	}

	// Intercepta requisições para a API do WooCommerce Store (blocks)
	function interceptStoreAPI() {
		const originalFetch = window.fetch;
		
		window.fetch = function(...args) {
			const [url, config] = args;
			
			// Verifica se é uma requisição para a API do WooCommerce Store batch
			if (url && url.includes('/wp-json/wc/store/v1/batch')) {
				// Inicia o loading quando a requisição é feita
				startLoadingState();
			}
			
			return originalFetch.apply(this, args)
				.then(response => {
					// Clona a response para poder ler o JSON sem consumir o stream original
					const clonedResponse = response.clone();
					
					if (url && url.includes('/wp-json/wc/store/v1/batch')) {
						clonedResponse.json()
							.then(data => {
								if (data && data.responses && data.responses[0] && data.responses[0].body) {
									const cartData = data.responses[0].body;
									
									// Extrai o total dos itens do carrinho
									if (cartData.totals && cartData.totals.total_items) {
										// O valor vem em centavos, divide por 100 para obter o valor real
										const totalItems = parseInt(cartData.totals.total_items) / 100;
										currentCartTotal = totalItems;
										
										// Para o loading e atualiza a barra
										setTimeout(() => {
											stopLoadingState();
										}, 300);
									}
								}
							})
							.catch(error => {
								// Em caso de erro, para o loading
								stopLoadingState();
							});
					}
					
					return response;
				})
				.catch(error => {
					// Para o loading em caso de erro na requisição
					if (url && url.includes('/wp-json/wc/store/v1/batch')) {
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
		let progressMessage = progressConfig.min_free_shipping_message || 'Falta(m) apenas mais {value} para obter FRETE GRÁTIS';

		// Valida se a mensagem personalizada contém o placeholder {value}
		if (!progressMessage.includes('{value}')) {
			// Se não contém {value}, usa a mensagem padrão
			progressMessage = 'Falta(m) apenas mais {value} para obter FRETE GRÁTIS';
		}

		// Se está carregando, mantém os valores anteriores
		if (isLoading) {
			percent = lastValidPercent;
			message = 'Carregando...';
		} else {
			// Calcula novos valores
			if (minValue <= 0) {
				percent = 100;
				message = successMessage;
			} else {
				percent = Math.min((cartTotal / minValue) * 100, 100);
				if (cartTotal >= minValue) {
					message = successMessage;
				} else {
					const remainingValue = (minValue - cartTotal).toFixed(2);
					const formattedValue = currencySymbol + remainingValue;
					message = progressMessage.replace('{value}', formattedValue);
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