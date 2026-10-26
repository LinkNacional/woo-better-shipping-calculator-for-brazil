import { placeChainField } from './core/CheckoutFieldOrder.js';

document.addEventListener("DOMContentLoaded", function () {
	let rgInput = null
	let placeOrderBound = false
	let updateDataTimeout = null
	let fieldContainerType = null

	const RG_MAX_LENGTH = 20
	const RG_ERROR_MESSAGE = 'Por favor, preencha o RG.'

	// Debounce do envio ao Store API: `extensionCartUpdate` dispara uma requisição
	// ao servidor, então NÃO pode ir a cada tecla. 500ms agrupa a digitação e ainda
	// mantém o valor sincronizado bem antes do submit.
	const UPDATE_DATA_DELAY = 500

	let savedRGData = {
		billing_rg: typeof WooBetterRGData !== 'undefined' && WooBetterRGData.billing_rg ? WooBetterRGData.billing_rg : ''
	}

	// Último valor enviado ao carrinho: evita POST repetido com o mesmo dado.
	let lastSentRGValue = null

	// Mesmo normalize do servidor (PHP): maiúsculas, sem símbolos estranhos.
	function sanitizeRGValue(value) {
		return String(value || '')
			.replace(/[^A-Za-z0-9\-\/\. ]/g, '')
			.toUpperCase()
			.slice(0, RG_MAX_LENGTH)
	}

	function isUsingSameAddressForBilling() {
		const checkbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]')
		if (!checkbox) {
			return false
		}

		return checkbox.checked
	}

	function isBrazilSelected() {
		const countryField = document.querySelector('#billing-country') ||
			document.querySelector('#shipping-country') ||
			document.querySelector('select[name="billing_country"]') ||
			document.querySelector('select[name="shipping_country"]') ||
			document.querySelector('input[name="billing_country"]') ||
			document.querySelector('input[name="shipping_country"]')

		if (!countryField) {
			return true
		}

		return countryField.value === 'BR'
	}

	function getPersonTypeConfig() {
		if (typeof WooBetterRGConfig !== 'undefined' && WooBetterRGConfig.person_type) {
			return WooBetterRGConfig.person_type
		}

		if (typeof WooBetterPersonTypeConfig !== 'undefined' && WooBetterPersonTypeConfig.person_type) {
			return WooBetterPersonTypeConfig.person_type
		}

		return 'both'
	}

	function isRGRequired() {
		if (typeof WooBetterRGConfig === 'undefined' || typeof WooBetterRGConfig.required === 'undefined') {
			return false
		}

		return !!WooBetterRGConfig.required
	}

	// O RG é VINCULADO ao CPF: só aparece quando o documento é um CPF completo
	// (11 dígitos). Com CNPJ — ou documento vazio/parcial — fica escondido.
	function isCpfContext() {
		const personTypeConfig = getPersonTypeConfig()
		const billingDocumentInput = document.getElementById('billing_document')
		const personTypeInput = document.getElementById('billing-persontype')

		if (!billingDocumentInput) {
			return false
		}

		const cleanDocument = billingDocumentInput.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
		const currentPersonType = personTypeInput ? personTypeInput.value : ''
		const hasCompleteCpf = cleanDocument.length === 11

		if (!hasCompleteCpf) {
			return false
		}

		if (personTypeConfig === 'physical') {
			return true
		}

		if (personTypeConfig === 'both') {
			return currentPersonType === '1' || currentPersonType === ''
		}

		// Configuração exclusivamente jurídica: RG nunca aparece.
		return false
	}

	function shouldShowRGField() {
		if (!isBrazilSelected()) {
			return false
		}

		return isCpfContext()
	}

	function getTargetContext() {
		const useShippingAsBilling = isUsingSameAddressForBilling()
		const containerType = useShippingAsBilling ? 'shipping' : 'billing'
		const container = document.querySelector(`#${containerType}`)

		return {
			container,
			containerType
		}
	}

	function updateRGStoreData(value) {
		const payload = {
			billing_rg: (value || '').toString().trim().toUpperCase()
		}

		if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
			try {
				const { dispatch } = wp.data
				const checkoutDispatch = dispatch('wc/store/checkout')
				if (checkoutDispatch && checkoutDispatch.setExtensionData) {
					checkoutDispatch.setExtensionData('woo_better_rg_field', payload)
				}
			} catch (error) {
				// Silenciar erro de integração para não quebrar a UI do checkout.
			}
		}

		// REASON: `extensionCartUpdate` dispara um POST no Store API e RESETA o
		// checkout em blocos. Na recriação do campo (ex.: ao alternar "usar o mesmo
		// endereço para cobrança") o `setInputValue` dispara `input` com o MESMO
		// valor, o que reenviaria o POST e realimentaria o reset — loop infinito.
		// Só envia quando o valor realmente mudou.
		if (lastSentRGValue === payload.billing_rg) {
			return
		}
		lastSentRGValue = payload.billing_rg

		if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
			window.wc.blocksCheckout.extensionCartUpdate({
				namespace: 'woo_better_rg_field',
				data: payload
			})
		}
	}

	function setInputValue(element, value) {
		if (!element) {
			return
		}

		const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
		nativeSetter.call(element, value)
		element.dispatchEvent(new Event('input', { bubbles: true }))
	}

	function getRGContainer() {
		return document.querySelector('.wc-better-billing-rg')
	}

	function getRGErrorContainer() {
		return document.querySelector('.wc-block-components-validation-error.wc-better-rg')
	}

	function hideRGValidationError() {
		const errorContainer = getRGErrorContainer()
		if (errorContainer) {
			errorContainer.style.display = 'none'
		}

		const container = getRGContainer()
		if (container) {
			container.classList.remove('has-error')
		}

		if (rgInput) {
			rgInput.setAttribute('aria-invalid', 'false')
		}
	}

	function showRGValidationError(message) {
		const errorContainer = getRGErrorContainer()
		if (errorContainer) {
			const messageElement = errorContainer.querySelector('span')
			if (messageElement) {
				messageElement.textContent = message || RG_ERROR_MESSAGE
			}
			errorContainer.style.display = 'block'
		}

		const container = getRGContainer()
		if (container) {
			container.classList.add('has-error')
		}

		if (rgInput) {
			rgInput.setAttribute('aria-invalid', 'true')
		}
	}

	function setRGRequired(isRequired) {
		const container = getRGContainer()
		if (!rgInput || !container) {
			return
		}

		// O required só vale quando a opção "RG obrigatório" está ligada.
		const required = !!isRequired && isRGRequired()

		if (required) {
			rgInput.setAttribute('required', '')
			container.classList.add('is-required')
		} else {
			rgInput.removeAttribute('required')
			container.classList.remove('is-required')
		}
	}

	function getReferenceElement(container, containerType) {
		// O RG fica logo APÓS o campo CPF/CNPJ (documento unificado). O IE/IM se
		// ancoram na Empresa (ou no campo RG, quando a Empresa não existe), então
		// este é o único ponto de ancoragem do RG — evita que dois scripts
		// reposicionem os campos um do outro em loop no observer.
		// O `#billing_document` é GLOBAL: com "usar o mesmo endereço" ligado ele pode
		// estar dentro do container de ENTREGA. Ancorar num elemento de outro
		// formulário colocava o RG no lugar errado (e a recriação virava loop), por
		// isso a âncora só vale se estiver dentro do container do contexto atual.
		const documentInput = document.getElementById('billing_document')
		if (documentInput && container.contains(documentInput)) {
			const documentContainer = documentInput.closest('.wc-block-components-text-input')
			if (documentContainer) {
				return documentContainer
			}
		}

		const lastNameField = container.querySelector(`#${containerType}-last_name`)
		return lastNameField ? lastNameField.closest('.wc-block-components-text-input') : null
	}

	function ensureAddressEditorOpen(containerType) {
		const editButton = document.querySelector(`span.wc-block-components-address-card__edit[aria-controls="${containerType}"]`)
		if (!editButton) {
			return false
		}

		if (editButton.getAttribute('aria-expanded') !== 'true') {
			editButton.click()
		}

		return editButton.getAttribute('aria-expanded') === 'true'
	}

	function createRGField(referenceElement) {
		const existing = getRGContainer()
		if (existing) {
			return existing
		}

		const container = document.createElement('div')
		container.className = 'wc-block-components-text-input wc-block-components-address-form__rg wc-better-billing-rg'

		const fieldMainWrapper = document.createElement('div')
		fieldMainWrapper.className = 'wc-better-rg-main-wrapper'
		fieldMainWrapper.style.position = 'relative'

		const input = document.createElement('input')
		input.type = 'text'
		input.id = 'billing-rg'
		input.name = 'billing_rg'
		input.setAttribute('autocomplete', 'off')
		input.setAttribute('maxlength', String(RG_MAX_LENGTH))
		input.setAttribute('aria-label', 'RG')
		input.setAttribute('aria-invalid', 'false')

		const label = document.createElement('label')
		label.setAttribute('for', 'billing-rg')
		label.textContent = 'RG'

		const errorDiv = document.createElement('div')
		errorDiv.className = 'wc-block-components-validation-error wc-better-rg'
		errorDiv.setAttribute('role', 'alert')
		errorDiv.style.display = 'none'

		const errorParagraph = document.createElement('p')
		errorParagraph.id = 'validate-error-billing-rg'

		const errorSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
		errorSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
		errorSvg.setAttribute('viewBox', '-2 -2 24 24')
		errorSvg.setAttribute('width', '24')
		errorSvg.setAttribute('height', '24')
		errorSvg.setAttribute('aria-hidden', 'true')
		errorSvg.setAttribute('focusable', 'false')

		const errorPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
		errorPath.setAttribute('d', 'M10 2c4.42 0 8 3.58 8 8s-3.58 8-8 8-8-3.58-8-8 3.58-8 8-8zm1.13 9.38l.35-6.46H8.52l.35 6.46h2.26zm-.09 3.36c.24-.23.37-.55.37-.96 0-.42-.12-.74-.36-.97s-.59-.35-1.06-.35-.82.12-1.07.35-.37.55-.37.97c0 .41.13.73.38.96.26.23.61.34 1.06.34s.8-.11 1.05-.34z')

		const errorMessage = document.createElement('span')
		errorMessage.textContent = RG_ERROR_MESSAGE

		errorSvg.appendChild(errorPath)
		errorParagraph.appendChild(errorSvg)
		errorParagraph.appendChild(errorMessage)
		errorDiv.appendChild(errorParagraph)

		fieldMainWrapper.appendChild(input)

		// O LABEL precisa ser filho DIRETO do container (e não do wrapper) para
		// herdar as regras de tema que usam combinador de FILHO DIRETO (ex.:
		// Woodmart) — igual aos campos nativos e ao CPF/CNPJ.
		container.appendChild(fieldMainWrapper)
		container.appendChild(label)
		container.appendChild(errorDiv)

		referenceElement.insertAdjacentElement('afterend', container)

		rgInput = input

		bindFieldEvents()
		applyInitialData()

		return container
	}

	function applyInitialData() {
		if (!rgInput) {
			return
		}

		const value = sanitizeRGValue(savedRGData.billing_rg).trim()
		if (!value) {
			return
		}

		setInputValue(rgInput, value)
	}

	function bindFieldEvents() {
		if (!rgInput) {
			return
		}

		if (!rgInput.dataset.eventsBound) {
			rgInput.addEventListener('input', function () {
				const normalizedValue = sanitizeRGValue(rgInput.value)
				if (normalizedValue !== rgInput.value) {
					setInputValue(rgInput, normalizedValue)
					return
				}

				savedRGData.billing_rg = normalizedValue
				hideRGValidationError()

				if (updateDataTimeout) {
					clearTimeout(updateDataTimeout)
				}

				updateDataTimeout = setTimeout(() => {
					updateRGStoreData(normalizedValue)
				}, UPDATE_DATA_DELAY)
			})

			rgInput.addEventListener('blur', function () {
				const container = getRGContainer()
				if (container && !rgInput.value.trim()) {
					container.classList.remove('is-active')
				}

				if (!shouldShowRGField()) {
					return
				}

				if (isRGRequired() && !rgInput.value.trim()) {
					showRGValidationError()
				}
			})

			rgInput.addEventListener('focus', function () {
				const container = getRGContainer()
				if (container) {
					container.classList.add('is-active')
				}
			})

			rgInput.dataset.eventsBound = 'true'
		}
	}

	function hideRGField() {
		const container = getRGContainer()
		if (!container) {
			return
		}

		container.style.display = 'none'
		container.style.height = '0px'
		container.style.margin = '0px'
		container.style.padding = '0px'
		container.style.overflow = 'hidden'

		setRGRequired(false)
		hideRGValidationError()
	}

	function showRGField() {
		const container = getRGContainer()
		if (!container) {
			return
		}

		container.style.display = ''
		container.style.height = ''
		container.style.margin = ''
		container.style.padding = ''
		container.style.overflow = ''

		if (rgInput && rgInput.value) {
			container.classList.add('is-active')
		}

		setRGRequired(true)
	}

	function updateVisibilityState() {
		const container = getRGContainer()
		if (!container) {
			return
		}

		if (shouldShowRGField()) {
			showRGField()
		} else {
			hideRGField()
		}
	}

	function ensureRGFieldInCurrentContainer() {
		const context = getTargetContext()
		if (!context.container) {
			return
		}

		const editorOpen = ensureAddressEditorOpen(context.containerType)
		if (!editorOpen) {
			return
		}

		// O campo pertence ao formulário do contexto atual (cobrança/entrega).
		// A checagem olha o PAI REAL no DOM — antes comparava só a flag
		// `fieldContainerType`, que podia dizer "cobrança" enquanto o campo estava
		// fisicamente na entrega (os ids são globais: `billing_document` pode ser
		// criado dentro do container de entrega). Nesse estado o campo ficava no
		// formulário errado para sempre.
		const currentContainer = getRGContainer()
		if (currentContainer && currentContainer.parentElement !== context.container) {
			currentContainer.remove()
			rgInput = null
		}

		const referenceElement = getReferenceElement(context.container, context.containerType)
		if (!referenceElement) {
			return
		}

		// Reposiciona o campo quando o ancoradouro correto muda (o campo é criado
		// cedo, antes do CPF/CNPJ existir). A posição é decidida pela cadeia
		// canônica (`core/CheckoutFieldOrder.js`): RG e IE caem no MESMO container
		// do documento quando a Empresa não existe, e a checagem antiga
		// (`previousElementSibling !== referencia`) fazia os dois se empurrarem
		// para sempre — loop síncrono que travava o checkout.
		const existingContainer = getRGContainer()
		if (existingContainer && existingContainer.parentElement === context.container) {
			placeChainField(context.container, 'rg', existingContainer, context.containerType)
		}

		createRGField(referenceElement)
		fieldContainerType = context.containerType
		updateVisibilityState()
	}

	function bindExternalFieldListeners() {
		const documentInput = document.getElementById('billing_document')
		if (documentInput && !documentInput.dataset.rgVisibilityListener) {
			documentInput.addEventListener('input', updateVisibilityState)
			documentInput.addEventListener('change', updateVisibilityState)
			documentInput.dataset.rgVisibilityListener = 'true'
		}

		const personTypeInput = document.getElementById('billing-persontype')
		if (personTypeInput && !personTypeInput.dataset.rgVisibilityListener) {
			personTypeInput.addEventListener('change', updateVisibilityState)
			personTypeInput.dataset.rgVisibilityListener = 'true'
		}

		const billingCountryField = document.querySelector('#billing-country')
		if (billingCountryField && !billingCountryField.dataset.rgVisibilityListener) {
			billingCountryField.addEventListener('change', function () {
				setTimeout(updateVisibilityState, 200)
			})
			billingCountryField.dataset.rgVisibilityListener = 'true'
		}

		const shippingCountryField = document.querySelector('#shipping-country')
		if (shippingCountryField && !shippingCountryField.dataset.rgVisibilityListener) {
			shippingCountryField.addEventListener('change', function () {
				setTimeout(updateVisibilityState, 200)
			})
			shippingCountryField.dataset.rgVisibilityListener = 'true'
		}

		const sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]')
		if (sameAddressCheckbox && !sameAddressCheckbox.dataset.rgContainerListener) {
			sameAddressCheckbox.addEventListener('change', function () {
				setTimeout(() => {
					ensureRGFieldInCurrentContainer()
				}, 300)
			})
			sameAddressCheckbox.dataset.rgContainerListener = 'true'
		}
	}

	function bindPlaceOrderValidation() {
		const placeOrderButton = document.querySelector('.wc-block-components-checkout-place-order-button') ||
			document.querySelector('.wc-block-checkout__actions_row button')

		if (!placeOrderButton || placeOrderBound) {
			return
		}

		placeOrderButton.addEventListener('click', function (event) {
			const container = getRGContainer()
			if (!container || container.style.display === 'none') {
				return
			}

			if (!shouldShowRGField()) {
				return
			}

			if (!isRGRequired()) {
				return
			}

			if (!rgInput || !rgInput.value.trim()) {
				event.stopPropagation()
				event.preventDefault()
				showRGValidationError()
				if (rgInput) {
					rgInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
					setTimeout(() => {
						rgInput.focus()
					}, 250)
				}
				return
			}

			hideRGValidationError()
		})

		placeOrderBound = true
	}

	const observer = new MutationObserver(() => {
		ensureRGFieldInCurrentContainer()
		bindExternalFieldListeners()
		bindPlaceOrderValidation()
	})

	observer.observe(document.body, { childList: true, subtree: true })

	// Primeira execução para carregar dados iniciais no checkout sem aguardar mutações.
	ensureRGFieldInCurrentContainer()
	bindExternalFieldListeners()
	bindPlaceOrderValidation()
})
