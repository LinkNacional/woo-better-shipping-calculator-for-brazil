import { bootPhoneField } from './core/PhoneField.js';

// Campo "Celular" — modo "Permitir somente Telefone Celular".
bootPhoneField({ kind: 'cellphone', modes: ['cellphone_only'] });
