import { bootPhoneField } from './core/PhoneField.js';

// Campo "Celular" SECUNDÁRIO do modo "Desabilitar o campo de telefone" com o
// "Campo de Celular" ligado: o TELEFONE é o NATIVO do WooCommerce (o plugin não
// injeta campo de telefone nem mexe no nativo) e este é um "Celular" SEPARADO,
// simples (sem lib/DDI e sem destaque), no fim do formulário de endereço, com
// extensão própria (`woo_better_cellphone`).
bootPhoneField({ kind: 'cellphone', modes: ['disabled'], secondary: true });
