import { bootPhoneField } from './core/PhoneField.js';

// Campo "Celular" SECUNDÁRIO do modo "Permitir Telefone Celular e Fixo":
// campo simples (sem lib/DDI e sem destaque), no fim do formulário de endereço,
// com extensão própria (`woo_better_cellphone`).
bootPhoneField({ kind: 'cellphone', modes: ['phone_and_cellphone'], secondary: true });
