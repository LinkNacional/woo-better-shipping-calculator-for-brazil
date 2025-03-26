<?php

namespace Lkn\WcBetterShippingCalculatorForBrazil\Includes;

use Lkn\WcBetterShippingCalculatorForBrazil\Includes\WcBetterShippingCalculatorForBrazilHelpers as h;

final class WcBetterShippingCalculatorForBrazilStates
{
    public static function get_state_from_postcode($postcode)
    {
        $postcode = intval(ltrim(h::sanitize_postcode($postcode), '0'));
        foreach (self::get_states() as $state => $range) {
            $i = 0;
            while ($i < count($range)) {
                if ($postcode >= $range[ $i ] && $postcode <= $range[ $i + 1]) {
                    return $state;
                }
                $i += 2;
            }
        }
        return null;
    }

    protected static function get_states()
    {
        return [
            'SP' => [ 1000000, 19999999 ], /* 1000000 is 01000-000 */
            'RJ' => [ 20000000, 28999999 ],
            'ES' => [ 29000000, 29999999 ],
            'MG' => [ 30000000, 39999999 ],
            'BA' => [ 40000000, 48999999 ],
            'SE' => [ 49000000, 49999999 ],
            'PE' => [ 50000000, 56999999 ],
            'AL' => [ 57000000, 57999999 ],
            'PB' => [ 58000000, 58999999 ],
            'RN' => [ 59000000, 59999999 ],
            'CE' => [ 60000000, 63999999 ],
            'PI' => [ 64000000, 64999999 ],
            'MA' => [ 65000000, 65999999 ],
            'PA' => [ 66000000, 68899999 ],
            'AP' => [ 68900000, 68999999 ],
            'AM' => [
                69000000, 69299999,
                69400000, 69899999
            ],
            'RR' => [ 69300000, 69399999 ],
            'AC' => [ 69900000, 69999999 ],
            'DF' => [
                70000000, 72799999,
                73000000, 73699999
            ],
            'GO' => [
                72800000, 72999999,
                73700000, 76799999
            ],
            'TO' => [ 77000000, 77999999 ],
            'MT' => [ 78000000, 78899999 ],
            'RO' => [ 76800000, 76999999 ],
            'MS' => [ 79000000, 79999999 ],
            'PR' => [ 80000000, 87999999 ],
            'SC' => [ 88000000, 89999999 ],
            'RS' => [ 90000000, 99999999 ],
        ];
    }
}
