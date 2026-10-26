document.addEventListener("DOMContentLoaded", function () {
    let shippingAsBillingEventsBound = false;
    let updateDataTimeout = null; // Timeout para debounce do salvamento

    // Variável para salvar estado do checkbox
    let savedShippingAsBillingData = {
        use_shipping_as_billing: 'false'
    };

    // Último valor enviado: evita reenviar o mesmo estado (e, com isso, disparar
    // um POST no Store API sem necessidade).
    let lastSentShippingAsBilling = null;

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
     *
     * REASON: aqui NÃO se usa `extensionCartUpdate`. Ele dispara um POST no Store
     * API e RESETA o checkout em blocos; como este checkbox também é observado
     * pelos campos injetados (PersonType/Birthdate/Gender/IE/IM/RG), cada reset
     * apagava e recriava esses campos, que reenviam dados ao carrinho — fechando
     * um loop infinito de requisições (a página travava e consumia toda a RAM).
     *
     * O valor não precisa ir ao servidor agora: ele viaja no POST do checkout em
     * `extensions.woo_better_shipping_as_billing`, que é justamente o que o PHP lê
     * em `process_shipping_as_billing_from_request()`.
     */
    function saveShippingAsBillingToExtensionData() {
        const data = {
            use_shipping_as_billing: savedShippingAsBillingData.use_shipping_as_billing
        };

        // Nada mudou desde o último envio: não reenvia.
        if (lastSentShippingAsBilling === data.use_shipping_as_billing) {
            return;
        }
        lastSentShippingAsBilling = data.use_shipping_as_billing;

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