document.addEventListener("DOMContentLoaded", function () {
    let shippingAsBillingEventsBound = false;
    let updateDataTimeout = null; // Timeout para debounce do salvamento

    // Variável para salvar estado do checkbox
    let savedShippingAsBillingData = {
        use_shipping_as_billing: 'false'
    };

    /**
     * Observer para monitorar o checkbox "Usar o mesmo endereço para cobrança"
     */
    const shippingAsBillingObserver = new MutationObserver((mutations) => {
        const checkbox = findShippingAsBillingCheckbox();
        
        if (checkbox && !shippingAsBillingEventsBound) {
            setupShippingAsBillingEvents(checkbox);
            
            // Capturar estado inicial
            const initialState = checkbox.checked ? 'true' : 'false';
            savedShippingAsBillingData.use_shipping_as_billing = initialState;
            
            // Enviar estado inicial
            saveShippingAsBillingToExtensionData();
            
            shippingAsBillingEventsBound = true;
            
            // 🔥 OTIMIZAÇÃO: Desconectar observer após encontrar checkbox
            shippingAsBillingObserver.disconnect();
        }
        
        // Se o checkbox foi removido, resetar flag
        if (!checkbox && shippingAsBillingEventsBound) {
            shippingAsBillingEventsBound = false;
        }
    });

    // Iniciar observação
    shippingAsBillingObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
    });

    /**
     * Encontrar o checkbox "Usar o mesmo endereço para cobrança"
     * Baseado no HTML fornecido pelo usuário
     */
    function findShippingAsBillingCheckbox() {
        // Tentar múltiplos seletores para encontrar o checkbox
        const selectors = [
            '.wc-block-checkout__use-address-for-billing input[type="checkbox"]',
            '.wc-block-components-checkbox.wc-block-checkout__use-address-for-billing input[type="checkbox"]',
            'input[id^="checkbox-control"][class*="wc-block-components-checkbox__input"]'
        ];

        for (const selector of selectors) {
            const checkbox = document.querySelector(selector);
            if (checkbox) {
                // Verificar se é realmente o checkbox correto verificando o label
                const label = checkbox.closest('label') || checkbox.nextElementSibling;
                if (label && label.textContent && 
                    (label.textContent.includes('mesmo endereço') || 
                     label.textContent.includes('cobrança') ||
                     label.textContent.includes('Usar o mesmo'))) {
                    return checkbox;
                }
            }
        }

        return null;
    }

    /**
     * Configurar eventos do checkbox
     */
    function setupShippingAsBillingEvents(checkbox) {
        if (checkbox.dataset.shippingAsBillingListener) {
            return; // Já configurado
        }

        checkbox.addEventListener('change', function() {
            const isChecked = this.checked;
            savedShippingAsBillingData.use_shipping_as_billing = isChecked ? 'true' : 'false';
            
            // Salvar no Store API com debounce
            clearTimeout(updateDataTimeout);
            updateDataTimeout = setTimeout(() => {
                saveShippingAsBillingToExtensionData();
            }, 100); // Debounce menor para ser mais responsivo
        });

        checkbox.dataset.shippingAsBillingListener = 'true';
    }

    /**
     * Salvar estado do checkbox no Extension Data do WooCommerce
     */
    function saveShippingAsBillingToExtensionData() {
        const data = {
            use_shipping_as_billing: savedShippingAsBillingData.use_shipping_as_billing
        };

        // Usar setExtensionData (método principal)
        if (typeof wp !== 'undefined' && wp.data && wp.data.dispatch) {
            try {
                const { dispatch } = wp.data;
                if (dispatch('wc/store/checkout')) {
                    const checkoutDispatch = dispatch('wc/store/checkout');
                    if (checkoutDispatch.setExtensionData) {
                        checkoutDispatch.setExtensionData('woo_better_shipping_as_billing', data);
                    }
                }
            } catch (error) {
                console.warn('WooBetter: Erro ao usar setExtensionData:', error);
            }
        }

        // Usar extensionCartUpdate como backup
        if (window.wc && window.wc.blocksCheckout && typeof window.wc.blocksCheckout.extensionCartUpdate === 'function') {
            window.wc.blocksCheckout.extensionCartUpdate({
                namespace: 'woo_better_shipping_as_billing',
                data: data
            });
        }
    }

    // Verificação inicial quando o DOM carrega
    setTimeout(() => {
        const checkbox = findShippingAsBillingCheckbox();
        if (checkbox && !shippingAsBillingEventsBound) {
            setupShippingAsBillingEvents(checkbox);
            
            // Capturar estado inicial
            const initialState = checkbox.checked ? 'true' : 'false';
            savedShippingAsBillingData.use_shipping_as_billing = initialState;
            
            // Enviar estado inicial
            saveShippingAsBillingToExtensionData();
            
            shippingAsBillingEventsBound = true;
            
            // 🔥 OTIMIZAÇÃO: Desconectar observer se checkbox já foi encontrado
            shippingAsBillingObserver.disconnect();
        }
    }, 1000); // Aguardar 1 segundo para garantir que o DOM está completamente carregado
});