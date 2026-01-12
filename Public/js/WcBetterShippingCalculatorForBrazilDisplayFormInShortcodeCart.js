/**
 * Script para forçar a exibição do formulário de cálculo de frete no carrinho shortcode
 * quando já existe um CEP salvo.
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // Função principal para forçar exibição do formulário
    function forceShippingCalculatorDisplay() {
        // Seleciona elementos da calculadora de frete
        const calculatorButtons = document.querySelectorAll('.shipping-calculator-button');
        const calculatorForms = document.querySelectorAll('.shipping-calculator-form');
        const calculatorContainers = document.querySelectorAll('.woocommerce-shipping-calculator');
        
        // Esconde todos os botões "Calcular frete"
        calculatorButtons.forEach(function(button) {
            button.style.display = 'none';
        });
        
        // Força exibição de todos os formulários
        calculatorForms.forEach(function(form) {
            form.style.display = 'block';
            form.style.visibility = 'visible';
        });
        
        // Força exibição dos containers principais
        calculatorContainers.forEach(function(container) {
            // Remove o primeiro parágrafo que contém o link "Calcular frete"
            const firstP = container.querySelector('p:first-child');
            if (firstP && firstP.textContent.includes('Calcular frete')) {
                firstP.style.display = 'none';
            }
        });
    }
    
    // Executa imediatamente
    forceShippingCalculatorDisplay();
    
    // Observa mudanças no DOM para garantir que funcione com AJAX
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.addedNodes.length > 0) {
                // Pequeno delay para garantir que elementos foram completamente adicionados
                setTimeout(forceShippingCalculatorDisplay, 100);
            }
        });
    });
    
    // Observa mudanças no carrinho
    const cartContainer = document.querySelector('.woocommerce-cart-form');
    if (cartContainer) {
        observer.observe(cartContainer, {
            childList: true,
            subtree: true
        });
    }
    
    // Também escuta eventos do WooCommerce
    if (typeof jQuery !== 'undefined') {
        jQuery(document.body).on('updated_cart_totals updated_shipping_method', function() {
            setTimeout(forceShippingCalculatorDisplay, 200);
        });
    }
    
    // CSS inline para garantir que funcione mesmo com temas conflituosos
    const style = document.createElement('style');
    style.textContent = `
        .shipping-calculator-form {
            display: block !important;
            visibility: visible !important;
            margin-top: 0px !important;
        }
        .shipping-calculator-button {
            display: none !important;
            margin-top: 0px !important;
        }
        .woocommerce-shipping-calculator > p:first-child:has(.shipping-calculator-button) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
});