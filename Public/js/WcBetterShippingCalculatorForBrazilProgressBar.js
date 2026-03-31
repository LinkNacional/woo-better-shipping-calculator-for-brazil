(function ($) {
	'use strict';

	let previousPorcent = null;
	let isLoading = false;
	let loadingTimeout = null;
	let currentCartTotal = 0;
	let lastValidPercent = 0;
	let lastValidMessage = '';
	let cartUpdateTimeout = null; // Para debounce das atualizações do carrinho
	let currentFreeShippingStatus = false; // Status atual do frete gratuito
	let observerInitialized = false; // Evita múltiplas inicializações
	let hasApiError = false; // Flag para indicar erro na API

	// NÃO inicializa com valor do PHP - vai fazer requisição para obter dados atuais
	const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
	// Comentado: não define currentCartTotal inicialmente
	// if (progressConfig.initial_cart_total) {
	//	currentCartTotal = parseFloat(progressConfig.initial_cart_total);
	// }

	let minValue = typeof wc_better_shipping_progress !== 'undefined'
		? parseFloat(wc_better_shipping_progress.min_free_shipping_value)
		: 0;

// Função removida - não vamos mais calcular valores iniciais com data do PHP
	// Os valores serão obtidos via requisição AJAX na inicialização

	// Intercepta requisições para a API do WooCommerce Blocks apenas
	function interceptCartRequests() {
		// Evita múltiplas inicializações
		if (observerInitialized) {
			return;
		}
		
		const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
		
		// Só funciona para blocks - remove completamente o suporte a shortcode
		if (!progressConfig.has_cart_block) {
			return;
		}
		
		// Intercepta apenas URLs específicas da Store API
		interceptStoreAPISpecific();
		
		// Marca como inicializado
		observerInitialized = true;
	}

	// Nova função para obter dados do carrinho via AJAX e verificar frete selecionado
	function getCartShippingData() {
		// Debounce para evitar múltiplas requisições simultâneas
		if (cartUpdateTimeout) {
			clearTimeout(cartUpdateTimeout);
		}
		
		cartUpdateTimeout = setTimeout(() => {
			cartUpdateTimeout = null;
			
			const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
			const ajaxUrl = progressConfig.ajax_url || '/wp-admin/admin-ajax.php';
			
			// ✅ NOVA IMPLEMENTAÇÃO: Usa a rota AJAX personalizada
			const formData = new FormData();
			formData.append('action', 'wc_better_get_cart_shipping_status');
			
			fetch(ajaxUrl, {
				method: 'POST',
				body: formData
			})
			.then(response => response.json())
			.then(data => {
				if (data && data.success && data.data) {
					const responseData = data.data;
					
					// Atualiza o total do carrinho  
					currentCartTotal = parseFloat(responseData.cartTotal) || 0;
					
					// ✅ ATUALIZA STATUS DO FRETE GRATUITO baseado na resposta
					currentFreeShippingStatus = responseData.freeShipping || false;
					
					// Remove flag de erro se sucesso
					hasApiError = false;
					
					// Para o loading e atualiza a barra
					stopLoadingState();
				} else {
					// Erro na API - ativa flag de erro
					hasApiError = true;
					currentFreeShippingStatus = false;
					stopLoadingState();
				}
			})
			.catch(error => {
				// Erro na API - ativa flag de erro
				hasApiError = true;
				currentFreeShippingStatus = false;
				stopLoadingState();
			});
		}, 300); // Debounce de 300ms
	}

	// Interceptor específico para Store API - similar ao arquivo de carrinho
	function interceptStoreAPISpecific() {
		const originalFetch = window.fetch;
		
		window.fetch = function(...args) {
			const [url, config] = args;
			
			// ✅ NOVA LÓGICA: Intercepta URLs de carrinho similar ao outro arquivo
			const isCartUpdateRequest = url && (
				url.includes('/wp-json/wc/store/v1/batch') ||
				url.includes('cart/update-item') ||
				url.includes('cart/delete-item') ||
				url.includes('cart/remove-item')
			) && !url.includes('braspag') && !url.includes('cardinalcommerce');
			
			if (!isCartUpdateRequest) {
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

			// ✅ MELHORIA: Inicia loading mantendo o width atual
			startLoadingState();
			
			return originalFetch.apply(this, args)
				.then(response => {
					// ✅ Aguarda a requisição concluir antes de consultar o carrinho
					setTimeout(() => {
						getCartShippingData();
					}, 100); // Pequeno delay para garantir que o carrinho foi atualizado
					
					return response;
				})
				.catch(error => {
					stopLoadingState();
					throw error;
				});
		};
	}

	// Função fallback para obter total do carrinho via DOM (caso a API não funcione)
	function getCartTotalFromDOM() {
		let selectors = [
			// Específico para subtotal total do carrinho (não itens individuais)
			'tr.cart-subtotal td[data-title="Subtotal"] .woocommerce-Price-amount.amount bdi',
			'.cart-subtotal .woocommerce-Price-amount.amount bdi',
			'.cart-subtotal .amount bdi',
			// Para blocos WC
			'.wc-block-formatted-money-amount.wc-block-components-totals-item__value',
			'.wc-block-components-totals-item__value .wc-block-formatted-money-amount',
			// Fallbacks mais gerais
			'td[data-title="Subtotal"] .woocommerce-Price-amount.amount bdi:last-of-type',
			'.order-total .woocommerce-Price-amount.amount bdi',
			'.order-total .woocommerce-Price-amount.amount'
		];

		let el = null;
		let foundSelector = '';
		for (let selector of selectors) {
			const elements = document.querySelectorAll(selector);
			
			// Se há múltiplos elementos, pega o que NÃO está dentro de .cart_item ou .woocommerce-cart-form__cart-item
			for (let element of elements) {
				if (element && element.textContent.trim()) {
					// Verifica se não está dentro de um item individual do carrinho
					const isWithinCartItem = element.closest('.cart_item, .woocommerce-cart-form__cart-item, .wc-block-cart-item');
					
					if (!isWithinCartItem) {
						el = element;
						foundSelector = selector;
						break;
					} else {
						// Ignora elementos de itens individuais
					}
				}
			}
			
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
		// Se não tem dados do carrinho, tenta obter do DOM
		let cartTotal = currentCartTotal || getCartTotalFromDOM();
		
		let percent = 0;
		let message = '';
		let barColor = '#4caf50'; // Verde padrão

		// Obtém as configurações do localize
		const progressConfig = typeof wc_better_shipping_progress !== 'undefined' ? wc_better_shipping_progress : {};
		const currencySymbol = progressConfig.currency_symbol || 'R$';
		// Remove fallbacks automáticos - se usuário deixar vazio, fica vazio
		const successMessage = progressConfig.min_free_shipping_success_message || '';
		const enableProgressBarValue = progressConfig.enable_progress_bar_value !== 'no'; // padrão é true
		let progressMessage = progressConfig.min_free_shipping_message || '';
		
		// Verifica se carrinho tem apenas produtos digitais
		const onlyDigitalProducts = progressConfig.only_digital_products || false;

		// Se está carregando, mantém os valores anteriores ou exibe loading
		let barText = '';
		if (isLoading) {
			percent = lastValidPercent || 30; // Usa lastValidPercent se disponível, senão 30%
			message = 'Carregando...';
			barText = enableProgressBarValue ? 'Carregando...' : '';
		} else if (hasApiError) {
			// Caso de erro na API
			percent = 0;
			barColor = '#f44336'; // Vermelho para erro
			message = 'Um erro desconhecido ocorreu';
			barText = enableProgressBarValue ? 'Erro' : '';
		} else if (onlyDigitalProducts) {
			// Caso especial: apenas produtos digitais
			percent = 100;
			barColor = '#9e9e9e'; // Cinza para produtos digitais
			message = 'Carrinho contém apenas produto(s) digital(s).';
			barText = enableProgressBarValue ? 'Digital' : '';
		} else if (currentFreeShippingStatus && cartTotal >= minValue && minValue > 0) {
			// ✅ FRETE GRÁTIS DO PLUGIN: Valor mínimo atingido + freeShipping detectado
			percent = 100;
			barColor = '#4caf50';
			message = successMessage; // Sem fallback - respeita se usuário deixou vazio
			barText = enableProgressBarValue ? (successMessage ? 'Frete Grátis!' : '') : '';
		} else if (currentFreeShippingStatus && (minValue <= 0 || cartTotal < minValue)) {
			// ✅ FRETE GRÁTIS DO WOOCOMMERCE: Detectado via configurações nativas (não do plugin)
			percent = 100;
			barColor = '#2196f3'; // Azul para diferenciar do frete grátis do plugin
			message = 'Frete grátis disponível através da região de entrega.'; // Mensagem para frete grátis do WooCommerce
			barText = enableProgressBarValue ? 'Frete Grátis (WC)' : '';
		} else {
			// Calcula valores normais baseados no valor mínimo
			if (minValue <= 0) {
				percent = 100;
				message = successMessage; // Sem fallback
				barText = enableProgressBarValue ? (successMessage ? 'Completo!' : '') : '';
			} else {
				percent = Math.min((cartTotal / minValue) * 100, 100);
				
				if (cartTotal >= minValue) {
					message = successMessage; // Sem fallback
					barText = enableProgressBarValue ? (successMessage ? 'Completo!' : '') : '';
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
			progressBar.style.background = barColor;
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
					// ✅ MANTÉM A LARGURA ATUAL - não altera para 30%
					bar.style.background = 'linear-gradient(90deg, #e0e0e0 0%, #bdbdbd 50%, #e0e0e0 100%)';
						bar.style.backgroundSize = '200% 100%';
						bar.style.animation = 'loading-shimmer 1.5s ease-in-out infinite';
					} else {
						bar.classList.remove('loading');
						bar.style.width = percent + '%';
						bar.style.background = barColor;
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
		
		// Força a atualização visual resetando previousPorcent para garantir que a barra seja atualizada
		previousPorcent = null;
		
		// ✅ Se já qualifica para frete grátis (detectado via API ou valor), atualiza imediatamente
		if (currentFreeShippingStatus || (currentCartTotal >= minValue && minValue > 0)) {
			// Se já qualifica, atualiza imediatamente sem delay
			insertOrUpdateProgressBar();
		} else {
			// Pequeno delay para suavizar a transição apenas quando necessário
			setTimeout(() => {
				insertOrUpdateProgressBar();
			}, 200);
		}
	}

	// Inicialização simples
	function init() {
		// ✅ NOVA LÓGICA: Inicia no estado de loading e faz requisição inicial
		startLoadingState();
		
		// Faz requisição inicial para obter dados atuais do carrinho
		getCartShippingData();
		
		// ✅ Intercept Cart requests apenas para Blocks
		interceptCartRequests();
		
		// Eventos WooCommerce tradicionais (fallback)
		$(document).on('updated_cart_totals updated_checkout', function () {
			// ✅ SHORTCODE: Inicia loading e faz requisição AJAX para dados atualizados
			startLoadingState();
			
			setTimeout(() => {
				getCartShippingData(); // Faz requisição para obter dados atualizados
			}, 100); // Pequeno delay para garantir que eventos anteriores terminaram
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