document.addEventListener("DOMContentLoaded", function () {
    const shippingNumberField = document.querySelector("#lkn_billing_shipping_number");
    const shippingNumberFieldWrapper = document.querySelector("#lkn_billing_shipping_number_field");
    const checkbox = document.querySelector("#lkn_billing_checkbox");

    if (checkbox && shippingNumberField) {
        checkbox.addEventListener("change", async function () {
            if (this.checked) {
                shippingNumberField.focus()
                shippingNumberField.value = ""; // Limpa antes de começar a digitação
                await typeCharacter(shippingNumberField, "S/N");
                shippingNumberField.blur()

                shippingNumberField.setAttribute("disabled", "disabled");
                shippingNumberFieldWrapper.style.opacity = "0.5";
                shippingNumberField.dispatchEvent(new Event("change", { bubbles: true }));
            } else {
                shippingNumberField.value = "";
                shippingNumberField.removeAttribute("disabled");
                shippingNumberFieldWrapper.style.opacity = "1";
            }
        });
    }

    (function () {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;

        XMLHttpRequest.prototype.open = function (method, url) {
            this._isCheckoutRequest = url.includes("wc-ajax=checkout");
            return originalOpen.apply(this, arguments);
        };

        XMLHttpRequest.prototype.send = function (body) {
            if (this._isCheckoutRequest && typeof body === "string") {

                // Converte a string para um objeto URLSearchParams
                const params = new URLSearchParams(body);

                const checkbox = document.querySelector("#lkn_billing_checkbox");
                if (checkbox && checkbox.checked) {
                    params.set("lkn_billing_shipping_number", "S/N");
                }

                // Converte de volta para string antes de enviar
                body = params.toString();
            }

            return originalSend.call(this, body);
        };
    })();
});

async function typeCharacter(field, text) {
    let index = 0;

    while (index < text.length) {
        field.value += text[index];
        field.dispatchEvent(new Event("input", { bubbles: true }));
        index++;
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}
