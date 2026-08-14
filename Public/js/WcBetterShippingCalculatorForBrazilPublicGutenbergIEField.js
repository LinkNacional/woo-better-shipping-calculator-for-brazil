document.addEventListener("DOMContentLoaded", function () {
	let ieInput = null
	let isentoCheckbox = null
	let placeOrderBound = false
	let updateDataTimeout = null
	let fieldContainerType = null
	let isentoResizeBound = false
	let lastIsentoOverlayWidth = 96

	let savedIEData = {
		billing_ie: typeof WooBetterIEData !== 'undefined' && WooBetterIEData.billing_ie ? WooBetterIEData.billing_ie : ''
	}

	function isUsingSameAddressForBilling() {
		const checkbox = document.querySelector('input[type="checkbox"][id^="checkbox-control"]')
		if (!checkbox) {
			return false
		}

		const checkboxContainer = checkbox.closest('.wc-block-checkout__use-address-for-billing')
		return !!checkboxContainer && checkbox.checked
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
		if (typeof WooBetterIEConfig !== 'undefined' && WooBetterIEConfig.person_type) {
			return WooBetterIEConfig.person_type
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

	function shouldShowIEField() {
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

	function updateIEStoreData(value) {
		const payload = {
			billing_ie: (value || '').toString().trim().toUpperCase()
		}

		if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
			try {
				const { dispatch } = wp.data
				const checkoutDispatch = dispatch('wc/store/checkout')
				if (checkoutDispatch && checkoutDispatch.setExtensionData) {
					checkoutDispatch.setExtensionData('woo_better_ie_field', payload)
				}
			} catch (error) {
				// Silenciar erro de integração para não quebrar a UI do checkout.
			}
		}

		if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
			window.wc.blocksCheckout.extensionCartUpdate({
				namespace: 'woo_better_ie_field',
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

	function setIEFieldDisabled(disabled) {
		if (!ieInput) {
			return
		}

		if (disabled) {
			ieInput.setAttribute('readonly', 'readonly')
			ieInput.classList.add('wc-better-readonly-disabled')
			ieInput.style.backgroundColor = '#e0e0e0'
			ieInput.style.color = '#808080'
			ieInput.style.cursor = 'not-allowed'
		} else {
			ieInput.removeAttribute('readonly')
			ieInput.classList.remove('wc-better-readonly-disabled')
			ieInput.style.backgroundColor = ''
			ieInput.style.color = ''
			ieInput.style.cursor = ''
		}
	}

	function getIEContainer() {
		return document.querySelector('.wc-better-billing-ie')
	}

	function getIEErrorContainer() {
		return document.querySelector('.wc-block-components-validation-error.wc-better-ie')
	}

	function getIsentoOverlay() {
		return document.querySelector('.wc-better-ie-isento-overlay')
	}

	function getIsentoLabel() {
		return document.querySelector('.wc-better-ie-isento-label')
	}

	function applyIsentoOverlayLayout() {
		const overlay = getIsentoOverlay()
		const label = getIsentoLabel()

		if (!overlay || !label || !ieInput) {
			return
		}

		const measuredLabelWidth = Math.ceil(label.getBoundingClientRect().width)
		const safeLabelWidth = measuredLabelWidth > 0 ? measuredLabelWidth : lastIsentoOverlayWidth - 20
		const overlayWidth = Math.max(84, safeLabelWidth + 20)

		lastIsentoOverlayWidth = overlayWidth
		overlay.style.width = `${overlayWidth}px`
		ieInput.style.paddingRight = `${overlayWidth + 12}px`
	}

	function bindIsentoResizeHandler() {
		if (isentoResizeBound) {
			return
		}

		window.addEventListener('resize', function () {
			applyIsentoOverlayLayout()
		})

		isentoResizeBound = true
	}

	function hideIEValidationError() {
		const errorContainer = getIEErrorContainer()
		if (errorContainer) {
			errorContainer.style.display = 'none'
		}

		const container = getIEContainer()
		if (container) {
			container.classList.remove('has-error')
		}

		if (ieInput) {
			ieInput.setAttribute('aria-invalid', 'false')
		}
	}

	function showIEValidationError(message) {
		const errorContainer = getIEErrorContainer()
		if (errorContainer) {
			const messageElement = errorContainer.querySelector('span')
			if (messageElement) {
				messageElement.textContent = message || 'Por favor, preencha a Inscrição Estadual (IE) ou marque Isento.'
			}
			errorContainer.style.display = 'block'
		}

		const container = getIEContainer()
		if (container) {
			container.classList.add('has-error')
		}

		if (ieInput) {
			ieInput.setAttribute('aria-invalid', 'true')
		}
	}

	function setIERequired(isRequired) {
		const container = getIEContainer()
		if (!ieInput || !container) {
			return
		}

		if (isRequired) {
			ieInput.setAttribute('required', '')
			container.classList.add('is-required')
		} else {
			ieInput.removeAttribute('required')
			container.classList.remove('is-required')
		}
	}

	function getReferenceElement(container, containerType) {
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

	function createIEField(referenceElement) {
		const existing = getIEContainer()
		if (existing) {
			return existing
		}

		const container = document.createElement('div')
		container.className = 'wc-block-components-text-input wc-block-components-address-form__ie wc-better-billing-ie'

		const fieldMainWrapper = document.createElement('div')
		fieldMainWrapper.className = 'wc-better-ie-main-wrapper'
		fieldMainWrapper.style.position = 'relative'

		const input = document.createElement('input')
		input.type = 'text'
		input.id = 'billing-ie'
		input.name = 'billing_ie'
		input.setAttribute('autocomplete', 'off')
		input.setAttribute('aria-label', 'Inscrição Estadual (IE)')
		input.setAttribute('aria-invalid', 'false')
		input.style.paddingRight = '112px'

		const label = document.createElement('label')
		label.setAttribute('for', 'billing-ie')
		label.textContent = 'Inscrição Estadual (IE)'

		const isentoOverlay = document.createElement('div')
		isentoOverlay.className = 'wc-better-ie-isento-overlay'
		isentoOverlay.style.position = 'absolute'
		isentoOverlay.style.right = '0'
		isentoOverlay.style.top = '0'
		isentoOverlay.style.height = '100%'
		isentoOverlay.style.zIndex = '2'

		const isentoBlock = document.createElement('div')
		isentoBlock.className = 'wc-better-ie-isento-block'
		isentoBlock.style.position = 'relative'
		isentoBlock.style.height = '100%'

		const isentoLabel = document.createElement('label')
		isentoLabel.className = 'wc-better-ie-isento-label'
		isentoLabel.setAttribute('for', 'wc-better-ie-isento-checkbox')
		isentoLabel.style.position = 'absolute'
		isentoLabel.style.top = '50%'
		isentoLabel.style.left = '50%'
		isentoLabel.style.transform = 'translate(-50%, -50%)'
		isentoLabel.style.display = 'inline-flex'
		isentoLabel.style.alignItems = 'center'
		isentoLabel.style.gap = '6px'
		isentoLabel.style.cursor = 'pointer'
		isentoLabel.style.fontSize = '12px'
		isentoLabel.style.lineHeight = '1'
		isentoLabel.style.whiteSpace = 'nowrap'

		const checkbox = document.createElement('input')
		checkbox.type = 'checkbox'
		checkbox.id = 'wc-better-ie-isento-checkbox'
		checkbox.className = 'wc-block-components-checkbox__input'
		checkbox.setAttribute('aria-invalid', 'false')

		const isentoText = document.createElement('span')
		isentoText.textContent = 'Isento'

		isentoLabel.appendChild(checkbox)
		isentoLabel.appendChild(isentoText)
		isentoBlock.appendChild(isentoLabel)
		isentoOverlay.appendChild(isentoBlock)

		const errorDiv = document.createElement('div')
		errorDiv.className = 'wc-block-components-validation-error wc-better-ie'
		errorDiv.setAttribute('role', 'alert')
		errorDiv.style.display = 'none'

		const errorParagraph = document.createElement('p')
		errorParagraph.id = 'validate-error-billing-ie'

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
		errorMessage.textContent = 'Por favor, preencha a Inscrição Estadual (IE) ou marque Isento.'

		errorSvg.appendChild(errorPath)
		errorParagraph.appendChild(errorSvg)
		errorParagraph.appendChild(errorMessage)
		errorDiv.appendChild(errorParagraph)

		fieldMainWrapper.appendChild(input)
		fieldMainWrapper.appendChild(label)
		fieldMainWrapper.appendChild(isentoOverlay)

		container.appendChild(fieldMainWrapper)
		container.appendChild(errorDiv)

		referenceElement.insertAdjacentElement('afterend', container)

		ieInput = input
		isentoCheckbox = checkbox

		bindFieldEvents()
		bindIsentoResizeHandler()
		applyInitialData()
		applyIsentoOverlayLayout()
		setTimeout(applyIsentoOverlayLayout, 50)

		return container
	}

	function applyInitialData() {
		if (!ieInput || !isentoCheckbox) {
			return
		}

		const value = String(savedIEData.billing_ie || '').replace(/[^A-Za-z0-9\-\/\. ]/g, '').trim().toUpperCase()
		if (!value) {
			setIEFieldDisabled(false)
			return
		}

		setInputValue(ieInput, value)

		if (value === 'ISENTO') {
			isentoCheckbox.checked = true
			setIEFieldDisabled(true)
		} else {
			isentoCheckbox.checked = false
			setIEFieldDisabled(false)
		}
	}

	function bindFieldEvents() {
		if (!ieInput || !isentoCheckbox) {
			return
		}

		if (!ieInput.dataset.eventsBound) {
			ieInput.addEventListener('input', function () {
				const normalizedValue = ieInput.value.toUpperCase()
				if (normalizedValue !== ieInput.value) {
					setInputValue(ieInput, normalizedValue)
					return
				}

				savedIEData.billing_ie = normalizedValue
				hideIEValidationError()

				if (isentoCheckbox.checked && normalizedValue !== 'ISENTO') {
					isentoCheckbox.checked = false
					setIEFieldDisabled(false)
				}

				if (updateDataTimeout) {
					clearTimeout(updateDataTimeout)
				}

				updateDataTimeout = setTimeout(() => {
					updateIEStoreData(normalizedValue)
				}, 400)
			})

			ieInput.addEventListener('blur', function () {
				const container = getIEContainer()
				if (container && !ieInput.value.trim()) {
					container.classList.remove('is-active')
				}

				if (!shouldShowIEField()) {
					return
				}

				if (!ieInput.value.trim()) {
					showIEValidationError()
				}
			})

			ieInput.addEventListener('focus', function () {
				const container = getIEContainer()
				if (container) {
					container.classList.add('is-active')
				}
			})

			ieInput.dataset.eventsBound = 'true'
		}

		if (!isentoCheckbox.dataset.eventsBound) {
			isentoCheckbox.addEventListener('change', function (event) {
				event.stopPropagation()

				if (isentoCheckbox.checked) {
					setInputValue(ieInput, 'ISENTO')
					setIEFieldDisabled(true)
					savedIEData.billing_ie = 'ISENTO'
					hideIEValidationError()
					updateIEStoreData('ISENTO')
				} else {
					setIEFieldDisabled(false)
					setInputValue(ieInput, '')
					savedIEData.billing_ie = ''
					updateIEStoreData('')
					ieInput.focus()
				}
			})

			isentoCheckbox.dataset.eventsBound = 'true'
		}
	}

	function hideIEField() {
		const container = getIEContainer()
		if (!container) {
			return
		}

		container.style.display = 'none'
		container.style.height = '0px'
		container.style.margin = '0px'
		container.style.padding = '0px'
		container.style.overflow = 'hidden'

		setIERequired(false)
		hideIEValidationError()
	}

	function showIEField() {
		const container = getIEContainer()
		if (!container) {
			return
		}

		container.style.display = ''
		container.style.height = ''
		container.style.margin = ''
		container.style.padding = ''
		container.style.overflow = ''

		if (ieInput && ieInput.value) {
			container.classList.add('is-active')
		}

		applyIsentoOverlayLayout()

		setIERequired(true)
	}

	function updateVisibilityState() {
		const container = getIEContainer()
		if (!container) {
			return
		}

		if (shouldShowIEField()) {
			showIEField()
		} else {
			hideIEField()
		}
	}

	function ensureIEFieldInCurrentContainer() {
		const context = getTargetContext()
		if (!context.container) {
			return
		}

		const editorOpen = ensureAddressEditorOpen(context.containerType)
		if (!editorOpen) {
			return
		}

		const currentContainer = getIEContainer()
		if (currentContainer && fieldContainerType && fieldContainerType !== context.containerType) {
			currentContainer.remove()
			ieInput = null
			isentoCheckbox = null
		}

		const referenceElement = getReferenceElement(context.container, context.containerType)
		if (!referenceElement) {
			return
		}

		createIEField(referenceElement)
		fieldContainerType = context.containerType
		updateVisibilityState()
	}

	function bindExternalFieldListeners() {
		const documentInput = document.getElementById('billing_document')
		if (documentInput && !documentInput.dataset.ieVisibilityListener) {
			documentInput.addEventListener('input', updateVisibilityState)
			documentInput.addEventListener('change', updateVisibilityState)
			documentInput.dataset.ieVisibilityListener = 'true'
		}

		const personTypeInput = document.getElementById('billing-persontype')
		if (personTypeInput && !personTypeInput.dataset.ieVisibilityListener) {
			personTypeInput.addEventListener('change', updateVisibilityState)
			personTypeInput.dataset.ieVisibilityListener = 'true'
		}

		const billingCountryField = document.querySelector('#billing-country')
		if (billingCountryField && !billingCountryField.dataset.ieVisibilityListener) {
			billingCountryField.addEventListener('change', function () {
				setTimeout(updateVisibilityState, 200)
			})
			billingCountryField.dataset.ieVisibilityListener = 'true'
		}

		const shippingCountryField = document.querySelector('#shipping-country')
		if (shippingCountryField && !shippingCountryField.dataset.ieVisibilityListener) {
			shippingCountryField.addEventListener('change', function () {
				setTimeout(updateVisibilityState, 200)
			})
			shippingCountryField.dataset.ieVisibilityListener = 'true'
		}

		const sameAddressCheckbox = document.querySelector('.wc-block-checkout__use-address-for-billing input[type="checkbox"]')
		if (sameAddressCheckbox && !sameAddressCheckbox.dataset.ieContainerListener) {
			sameAddressCheckbox.addEventListener('change', function () {
				setTimeout(() => {
					ensureIEFieldInCurrentContainer()
				}, 300)
			})
			sameAddressCheckbox.dataset.ieContainerListener = 'true'
		}
	}

	function bindPlaceOrderValidation() {
		const placeOrderButton = document.querySelector('.wc-block-components-checkout-place-order-button') ||
			document.querySelector('.wc-block-checkout__actions_row button')

		if (!placeOrderButton || placeOrderBound) {
			return
		}

		placeOrderButton.addEventListener('click', function (event) {
			const container = getIEContainer()
			if (!container || container.style.display === 'none') {
				return
			}

			if (!shouldShowIEField()) {
				return
			}

			if (!ieInput || !ieInput.value.trim()) {
				event.stopPropagation()
				event.preventDefault()
				showIEValidationError()
				if (ieInput) {
					ieInput.scrollIntoView({ behavior: 'smooth', block: 'center' })
					setTimeout(() => {
						ieInput.focus()
					}, 250)
				}
				return
			}

			hideIEValidationError()
		})

		placeOrderBound = true
	}

	const observer = new MutationObserver(() => {
		ensureIEFieldInCurrentContainer()
		bindExternalFieldListeners()
		bindPlaceOrderValidation()
	})

	observer.observe(document.body, { childList: true, subtree: true })

	// Primeira execução para carregar dados iniciais no checkout sem aguardar mutações.
	ensureIEFieldInCurrentContainer()
	bindExternalFieldListeners()
	bindPlaceOrderValidation()
})
