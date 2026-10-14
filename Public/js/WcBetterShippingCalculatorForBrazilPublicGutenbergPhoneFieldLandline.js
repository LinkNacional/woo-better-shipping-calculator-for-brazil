import { bootPhoneField } from './core/PhoneField.js';

// Campo "Telefone" (fixo) — modo "Permitir somente Telefone Fixo".
bootPhoneField({ kind: 'phone', modes: ['landline_only'] });
