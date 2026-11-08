<?php
/**
 * Stub do `WFACP_Add_Address_Field` (FunnelKit Aero Checkout) para os testes.
 *
 * Reproduz só o que o nosso plugin usa: o construtor que registra o campo nas
 * listas de campos de endereço (`wfacp_default_{tipo}_address_fields`) e nas opções
 * do editor (`wfacp_{tipo}_address_options`).
 *
 * @package WcBetterShippingCalculatorForBrazil\Tests
 */

namespace Lkn\WcBetterShippingCalculatorForBrazil\Tests;

if ( ! class_exists( __NAMESPACE__ . '\\WFACP_Add_Address_Field_Stub' ) ) {
    #[\AllowDynamicProperties]
    class WFACP_Add_Address_Field_Stub {

        private $type = 'billing';
        private $id = '';
        private $field = array();

        public function __construct( $id, $field, $type = 'billing', $show_admin = true ) {
            if ( empty( $id ) || empty( $field ) ) {
                return;
            }

            $this->id    = $id;
            $this->field = $field;
            $this->type  = $type;

            add_filter( 'wfacp_default_' . $this->type . '_address_fields', array( $this, 'add_to_default_address_fields' ) );
            add_filter( 'wfacp_' . $this->type . '_address_options', array( $this, 'add_to_address_options' ) );
        }

        public function add_to_default_address_fields( $fields ) {
            $fields[ $this->id ] = $this->field;

            return $fields;
        }

        public function add_to_address_options( $options ) {
            $options[ $this->id ] = array(
                $this->id            => 'true',
                $this->id . '_label' => isset( $this->field['label'] ) ? $this->field['label'] : '',
                'required'           => isset( $this->field['required'] ) ? $this->field['required'] : false,
            );

            return $options;
        }
    }
}
