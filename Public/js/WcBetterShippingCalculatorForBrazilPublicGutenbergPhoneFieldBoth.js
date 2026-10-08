import { bootPhoneField } from './core/PhoneField.js';

// Campo "Telefone" (fixo) do modo "Permitir Telefone Celular e Fixo".
bootPhoneField({ kind: 'phone', modes: ['phone_and_cellphone'] });
