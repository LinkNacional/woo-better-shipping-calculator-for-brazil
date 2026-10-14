document.addEventListener("DOMContentLoaded", function () {
	let imInput = null
	let placeOrderBound = false
	let updateDataTimeout = null
	let fieldContainerType = null

	let savedIMData = {
		billing_im: typeof WooBetterIMData !== 'undefined' && WooBetterIMData.billing_im ? WooBetterIMData.billing_im : ''
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
		if (typeof WooBetterIMConfig !== 'undefined' && WooBetterIMConfig.person_type) {
			return WooBetterIMConfig.person_type
		}

		if (typeof WooBetterPersonTypeConfig !== 'undefined' && WooBetterPersonTypeConfig.person_type) {
			return WooBetterPersonTypeConfig.person_type
		}

		return 'both'
	}

	function isCnpjContext() {
		const personTypeConfig = getPersonTypeConfig()
		const billingDocumentInput = document.getElementById('billing_document')
		const personTypeInput = document.getElementById('billing-persontype')

		if (!billingDocumentInput) {
			return false
		}

		const cleanDocument = billingDocumentInput.value.replace(/[^0-9A-Za-z]/g, '').toUpperCase()
		const currentPersonType = personTypeInput ? personTypeInput.value : ''
		const hasCompleteCnpj = cleanDocument.length === 14

		if (!hasCompleteCnpj) {
			return false
		}

		if (personTypeConfig === 'legal') {
			return true
		}

		if (personTypeConfig === 'both') {
			return currentPersonType === '2' || currentPersonType === ''
		}

		return false
	}

	function shouldShowIMField() {
		if (!isBrazilSelected()) {
			return false
		}

		return isCnpjContext()
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

	function updateIMStoreData(value) {
		const payload = {
			billing_im: (value || '').toString().trim().toUpperCase()
		}

		if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
			try {
				const { dispatch } = wp.data
				const checkoutDispatch = dispatch('wc/store/checkout')
				if (checkoutDispatch && checkoutDispatch.setExtensionData) {
					checkoutDispatch.setExtensionData('woo_better_im_field', payload)
				}
			} catch (error) {
				// Silenciar erro de integração para não quebrar a UI do checkout.
			}
		}

		if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
			window.wc.blocksCheckout.extensionCartUpdate({
				namespace: 'woo_better_im_field',
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

	function getIMContainer() {
		return document.querySelector('.wc-better-billing-im')
	}

	function getIMErrorContainer() {
		return document.querySelector('.wc-block-components-validation-error.wc-better-im')
	}

	function hideIMValidationError() {
		const errorContainer = getIMErrorContainer()
		if (errorContainer) {
			errorContainer.style.display = 'none'
		}

		const container = getIMContainer()
		if (container) {
			container.classList.remove('has-error')
		}

		if (imInput) {
			imInput.setAttribute('aria-invalid', 'false')
		}
	}

	function showIMValidationError(message) {
		const errorContainer = getIMErrorContainer()
		if (errorContainer) {
			const messageElement = errorContainer.querySelector('span')
			if (messageElement) {
				messageElement.textContent = message || 'Por favor, preencha a Inscrição Municipal (IM).'
			}
			errorContainer.style.display = 'block'
		}

		const container = getIMContainer()
		if (container) {
			container.classList.add('has-error')
		}

		if (imInput) {
			imInput.setAttribute('aria-invalid', 'true')
		}
	}

	function setIMRequired(isRequired) {
		const container = getIMContainer()
		if (!imInput || !container) {
			return
		}

		if (isRequired) {
			imInput.setAttribute('required', '')
			container.classList.add('is-required')
		} else {
			imInput.removeAttribute('required')
			container.classList.remove('is-required')
		}
	}

	function getReferenceElement(container, containerType) {
		// O campo IM deve ficar logo APÓS o campo IE (quando ele existe), e não
		// ancorado no mesmo elemento que o IE (empresa/documento). Se ambos usarem
		// o MESMO âncora, cada script reposiciona seu campo no observer e os dois
		// ficam se reordenando mutuamente para sempre — o que trava o checkout em
		// blocos (loop infinito de mutações no DOM).
		const ieContainer = document.querySelector('.wc-better-billing-ie')
		if (ieContainer) {
			return ieContainer
		}

		const customCompany = container.querySelector('.wc-better-billing-company')
		if (customCompany) {
			return customCompany
		}

		const documentInput = document.getElementById('billing_document')
		if (documentInput) {
			const documentContainer = documentInput.closest('.wc-block-components-text-input')
			if (documentContainer) {
				return documentContainer
			}
		}

		const nativeCompany = container.querySelector(`#${containerType}-company`)
		if (nativeCompany) {
			const nativeCompanyContainer = nativeCompany.closest('.wc-block-components-text-input')
			if (nativeCompanyContainer) {
				return nativeCompanyContainer
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

	function createIMField(referenceElement) {
		const existing = getIMContainer()
		if (existing) {
			return existing
		}

		const container = document.createElement('div')
		container.className = 'wc-block-components-text-input wc-block-components-address-form__im wc-better-billing-im'

		const fieldMainWrapper = document.createElement('div')
		fieldMainWrapper.className = 'wc-better-im-main-wrapper'
		fieldMainWrapper.style.position = 'relative'

		const input = document.createElement('input')
		input.type = 'text'
		input.id = 'billing-im'
		input.name = 'billing_im'
		input.setAttribute('autocomplete', 'off')
		input.setAttribute('aria-label', 'Inscrição Municipal (IM)')
		input.setAttribute('aria-invalid', 'false')

		const label = document.createElement('label')
		label.setAttribute('for', 'billing-im')
		label.textContent = 'Inscrição Municipal (IM)'

		const errorDiv = document.createElement('div')
		errorDiv.className = 'wc-block-components-validation-error wc-better-im'
		errorDiv.setAttribute('role', 'alert')
		errorDiv.style.display = 'none'

		const errorParagraph = document.createElement('p')
		errorParagraph.id = 'validate-error-billing-im'

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
		errorMessage.textContent = 'Por favor, preencha a Inscrição Municipal (IM).'

		errorSvg.appendChild(errorPath)
		errorParagraph.appendChild(errorSvg)
		errorParagraph.appendChild(errorMessage)
		errorDiv.appendChild(errorParagraph)

		fieldMainWrapper.appendChild(input)

		// O LABEL precisa ser filho DIRETO do container (e não do wrapper) para
		// herdar as regras de tema que usam combinador de FILHO DIRETO — ex.:
		// Woodmart `… .wc-block-components-text-input>label{top:21px;line-height:1}`.
		// É assim que os campos nativos e o CPF/CNPJ ficam alinhados no repouso;
		// com o label dentro do wrapper ele não recebia a regra e ficava ~4px baixo.
		container.appendChild(fieldMainWrapper)
		container.appendChild(label)
		container.appendChild(errorDiv)

		referenceElement.insertAdjacentElement('afterend', container)

		imInput = input

		bindFieldEvents()
		applyInitialData()

		return container
	}

	function applyInitialData() {
		if (!imInput) {
			return
		}

		const value = String(savedIMData.billing_im || '').replace(/[^A-Za-z0-9\-\/\. ]/g, '').trim().toUpperCase()
		if (!value) {
			return
		}

		setInputValue(imInput, value)
	}

	function bindFieldEvents() {
		if (!imInput) {
			return
		}

		if (!imInput.dataset.eventsBound) {
			imInput.addEventListener('input', function () {
				const normalizedValue = imInput.value.replace(/[^A-Za-z0-9\-\/\. ]/g, '').toUpperCase()
				if (normalizedValue !== imInput.value) {
					setInputValue(imInput, normalizedValue)
					return
				}

				savedIMData.billing_im = normalizedValue
				hideIMValidationError()

				if (updateDataTimeout) {
					clearTimeout(updateDataTimeout)
				}

				updateDataTimeout = setTimeout(() => {
					updateIMStoreData(normalizedValue)
				}, 400)
			})

			imInput.addEventListener('blur', function () {
				const container = getIMContainer()
				if (container && !imInput.value.trim()) {
					container.classList.remove('is-active')
				}

				if (!shouldShowIMField()) {
					return
				}

				if (!imInput.value.trim()) {
					showIMValidationError()
				}
			})

			imInput.addEventListener('focus', function () {
				const container = getIMContainer()
				if (container) {
					container.classList.add('is-active')
				}
			})

			imInput.dataset.eventsBound = 'true'
		}
	}

	function hideIMField() {
		const container = getIMContainer()
		if (!container) {
			return
		}

		container.style.display = 'none'
		container.style.height = '0px'
		container.style.margin = '0px'
		container.style.padding = '0px'
		container.style.overflow = 'hidden'

		setIMRequired(false)
		hideIMValidationError()
	}

	function showIMField() {
		const container = getIMContainer()
		if (!container) {
			return
		}

		container.style.display = ''
		container.style.height = ''
		container.style.margin = ''
		container.style.padding = ''
		container.style.overflow = ''

		if (imInput && imInput.value) {
			container.classList.add('is-active')
		}

		setIMRequired(true)
	}

	function updateVisibilityState() {
		const container = getIMContainer()
		if (!container) {
			return
		}

		if (shouldShowIMField()) {
			showIMField()
		} else {
			hideIMField()
		}
	}

	function ensureIMFieldInCurrentContainer() {
		const context = getTargetContext()
		if (!context.container) {
			return
		}

		const editorOpen = ensureAddressEditorOpen(context.containerType)
		if (!editorOpen) {
			return
		}

		const currentContainer = getIMContainer()
		if (currentContainer && fieldContainerType && fieldContainerType !== context.containerType) {
			currentContainer.remove()
			imInput = null
		}

		const referenceElement = getReferenceElement(context.container, context.containerType)
		if (!referenceElement) {
			return
		}

		// Reposiciona o campo quando o ancoradouro correto muda. O campo é criado
		// cedo (DOMContentLoaded), antes de Empresa/CPF-CNPJ existirem, e nesse
		// caso cai no fallback de sobrenome. Quando a Empresa/CPF-CNPJ aparecem,
		// movemos o IM para logo abaixo do ancoradouro correto.
		const existingContainer = getIMContainer()
		if (existingContainer && existingContainer.previousElementSibling !== referenceElement) {
			referenceElement.insertAdjacentElement('afterend', existingContainer)
		}

		createIMField(referenceElement)
		fieldContainerType = context.containerType
		updateVisibilityState()
	}

	function bindExternalFieldListeners() {
		const documentInput = document.getElementById('billing_document')
		if (documentInput && !documentInput.dataset.imVisibilityListener) {
			documentInput.addEventListener('input', updateVisibilityState)
			documentInput.addEventListener('change', updateVisibilityState)
			documentInput.dataset.imVisibilityListener = 'true'
		}

		const personTypeInput = document.getElementById('billing-persontype')
		if (personTypeInput && !personTypeInput.dataset.imVisibilityListener) {
			personTypeInput.addEventListener('change', updateVisibilityState)
			personTypeInput.dataset.imVisibilityListener = 'true'
		}

		const billingCountryField = document.querySelector('#billing-country')
		if (billingCountryField && !billingCountryField.dataset.imVisibilityListener) {
			billingCountryField.addEventListener('change', function () {
				setTimeout(updateVisibilityState, 200)
			})
			billingCountryField.dataset.imVisibilityListener = 'true'
		}

		const shippingCountryField = document.querySelector('#shipping-country')
		if (shippingCountryField && !shippingCountryField.dataset.imVisibilityListener) {
			shippingCountryField.addEventListener('change', function () {
				setTimeout(updateVisibilityState, 200)
			})
			shippingCountryField.dataset.imVisibilityListener = 'true'
		}

		const sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]')
		if (sameAddressCheckbox && !sameAddressCheckbox.dataset.imContainerListener) {
			sameAddressCheckbox.addEventListener('change', function () {
				setTimeout(() => {
					ensureIMFieldInCurrentContainer()
				}, 300)
			})
			sameAddressCheckbox.dataset.imContainerListener = 'true'
		}
	}

	function bindPlaceOrderValidation() {
		const placeOrderButton = document.querySelector('.wc-block-components-checkout-place-order-button') ||
			document.querySelector('.wc-block-checkout__actions_row button')

		if (!placeOrderButton || placeOrderBound) {
			return
		}

		placeOrderButton.addEventListener('click', function (event) {
			const container = getIMContainer()
			if (!container || container.style.display === 'none') {
				return
			}

			if (!shouldShowIMField()) {
				return
			}

			if (!imInput || !imInput.value.trim()) {
				event.stopPropagation()
				event.preventDefault()
				showIMValidationError()
				if (imInput) {
					imInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
					setTimeout(() => {
						imInput.focus()
					}, 250)
				}
				return
			}

			hideIMValidationError()
		})

		placeOrderBound = true
	}

	const observer = new MutationObserver(() => {
		ensureIMFieldInCurrentContainer()
		bindExternalFieldListeners()
		bindPlaceOrderValidation()
	})

	observer.observe(document.body, { childList: true, subtree: true })

	// Primeira execução para carregar dados iniciais no checkout sem aguardar mutações.
	ensureIMFieldInCurrentContainer()
	bindExternalFieldListeners()
	bindPlaceOrderValidation()
})
