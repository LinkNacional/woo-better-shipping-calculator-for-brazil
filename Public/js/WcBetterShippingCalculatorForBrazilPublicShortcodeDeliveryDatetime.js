/**
 * Delivery Date & Time Picker for Classic/Shortcode Checkout
 *
 * Uses flatpickr (npm) to provide a date+time picker that:
 * - Only allows selecting days marked as active in the delivery schedule
 * - Disables holidays (from holidays.json)
 * - Only allows future dates
 *
 * @since 4.17.0
 */
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    const deliveryInput = document.getElementById('billing_delivery_datetime');
    if (!deliveryInput) return;

    const scheduleData = window.WooBetterDeliverySchedule || {};
    const holidaysData = window.WooBetterDeliveryHolidays || [];

    // Conjunto de datas bloqueadas (feriados)
    const holidayDates = new Set();
    holidaysData.forEach(function (h) {
        if (h.date) holidayDates.add(h.date);
    });

    // Mapeamento de dias da semana ativos
    const dayIndexMap = {
        'sunday': 0,
        'monday': 1,
        'tuesday': 2,
        'wednesday': 3,
        'thursday': 4,
        'friday': 5,
        'saturday': 6,
    };

    const enabledDays = [];
    const daySchedule = {};

    Object.keys(scheduleData).forEach(function (key) {
        const day = scheduleData[key];
        if (day && day.active) {
            const idx = dayIndexMap[key];
            if (idx !== undefined) {
                enabledDays.push(idx);
                daySchedule[idx] = {
                    start: day.start || '08:00',
                    end: day.end || '18:00',
                };
            }
        }
    });

    // Se nenhum dia ativo, libera todos
    if (enabledDays.length === 0) {
        for (let i = 0; i < 7; i++) enabledDays.push(i);
    }

    // Calcula minTime e maxTime globais (menor start e maior end entre os dias ativos)
    let globalMinTime = '00:00';
    let globalMaxTime = '23:59';
    const timesFromSchedule = Object.values(daySchedule);
    if (timesFromSchedule.length > 0) {
        globalMinTime = timesFromSchedule.reduce(function (a, b) {
            return a.start < b.start ? a : b;
        }).start;
        globalMaxTime = timesFromSchedule.reduce(function (a, b) {
            return a.end > b.end ? a : b;
        }).end;
    }

    /**
     * Verifica se uma data deve ser desabilitada:
     * - Feriado OU dia da semana não ativo
     */
    function isDateDisabled(date) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const dd = String(date.getDate()).padStart(2, '0');
        const dateStr = yyyy + '-' + mm + '-' + dd;

        // Feriado
        if (holidayDates.has(dateStr)) return true;

        // Dia da semana não ativo
        const weekday = date.getDay();
        if (enabledDays.indexOf(weekday) === -1) return true;

        return false;
    }

    function initPicker(input) {
        const fp = flatpickr(input, {
            enableTime: true,
            dateFormat: 'd/m/Y H:i',
            minDate: 'today',
            time_24hr: true,
            locale: Portuguese,
            minTime: globalMinTime,
            maxTime: globalMaxTime,
            disable: [
                function (date) {
                    return isDateDisabled(date);
                },
            ],
            onChange: function (selectedDates, dateStr, instance) {
                // Dispara update_checkout do WooCommerce
                if (typeof jQuery !== 'undefined') {
                    jQuery('body').trigger('update_checkout');
                }
            },
        });

        input.dataset.flatpickrBound = '1';
        return fp;
    }

    // Inicialização
    initPicker(deliveryInput);

    // Observer para campos carregados dinamicamente (ex: AJAX checkout update)
    const observer = new MutationObserver(function () {
        const input = document.getElementById('billing_delivery_datetime');
        if (input && !input.dataset.flatpickrBound) {
            initPicker(input);
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
});
