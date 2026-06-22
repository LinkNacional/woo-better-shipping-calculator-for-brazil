/**
 * Delivery Date + Slot Picker for Classic/Shortcode Checkout
 *
 * The fields are rendered by PHP via woocommerce_checkout_before_order_review
 * (render_delivery_step_shortcode) using woocommerce_form_field(), positioned
 * above the payment section. This JS only adds flatpickr, mask, slot filtering,
 * and triggers update_checkout on selection changes.
 *
 * @since 4.17.0
 * @since 4.18.0 Fields are now rendered by PHP above payment; JS only handles picker.
 */
import flatpickr from 'flatpickr';
import { Portuguese } from 'flatpickr/dist/l10n/pt';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener('DOMContentLoaded', function () {
    'use strict';

    var input = document.getElementById('billing_delivery_date');
    if (!input) return;

    var slotSelect = document.getElementById('billing_delivery_time_slot');
    if (!slotSelect) return;

    // Apply padding to slot select
    slotSelect.style.padding = '8px 12.8px';

    var slotField = slotSelect.closest('.wc-better-slot-field') || slotSelect.closest('.form-row');
    var defaultOption = slotSelect.querySelector('option[value=""]');

    var scheduleData = window.WooBetterDeliverySchedule || {};
    var holidaysData = window.WooBetterDeliveryHolidays || [];
    var slotsData    = window.WooBetterDeliverySlots || [];
    var minPrepHours = (typeof window.WooBetterMinPrepHours !== 'undefined') ? parseInt(window.WooBetterMinPrepHours, 10) || 0 : 0;

    // ── Helpers ──────────────────────────────────────────────────────────

    function timeToMinutes(timeStr) {
        var p = timeStr.split(':');
        return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    }
    function formatDateKey(date) {
        return date.getFullYear() + '-' +
            String(date.getMonth() + 1).padStart(2, '0') + '-' +
            String(date.getDate()).padStart(2, '0');
    }

    // ── Mask (dd/mm/aaaa) ────────────────────────────────────────────────

    function applyMask(el) {
        var v = el.value.replace(/\D/g, '').substring(0, 8);
        if (v.length > 4) v = v.substring(0, 2) + '/' + v.substring(2, 4) + '/' + v.substring(4);
        else if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2);
        el.value = v;
    }
    function isComplete(str) { return /^\d{2}\/\d{2}\/\d{4}$/.test(str); }
    function parseParts(str) {
        var m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str);
        return m ? { day: +m[1], month: +m[2], year: +m[3] } : null;
    }

    // ── Feriados ─────────────────────────────────────────────────────────

    var fullHolidays = new Set();
    var partialHolidays = {};
    holidaysData.forEach(function (h) {
        if (!h.date) return;
        var s = typeof h.start_hour === 'number' ? h.start_hour : 0;
        var e = typeof h.end_hour   === 'number' ? h.end_hour   : 24;
        if (e - s >= 24 || (s === 0 && e === 0)) fullHolidays.add(h.date);
        else partialHolidays[h.date] = { startMin: s * 60, endMin: e * 60 };
    });

    // ── Schedule ─────────────────────────────────────────────────────────

    var dayMap = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
    var enabledDays = [];
    var daySchedule = {};
    Object.keys(scheduleData).forEach(function (k) {
        var d = scheduleData[k];
        if (d && d.active) {
            var idx = dayMap[k];
            if (idx !== undefined) {
                enabledDays.push(idx);
                daySchedule[idx] = { startMin: timeToMinutes(d.start || '08:00'), endMin: timeToMinutes(d.end || '18:00') };
            }
        }
    });
    if (!enabledDays.length) for (var i = 0; i < 7; i++) enabledDays.push(i);

    function isDisabled(date) {
        var ds = formatDateKey(date);
        if (fullHolidays.has(ds)) return true;
        return enabledDays.indexOf(date.getDay()) === -1;
    }

    // ── Slots ────────────────────────────────────────────────────────────

    function slotLabel(slot) { return slot[0] + ' às ' + slot[1]; }

    function getSlotsForDay(weekday, dateKey) {
        var sched = daySchedule[weekday];
        if (!sched || !slotsData.length) return [];
        var ds = sched.startMin, de = sched.endMin;
        var p = partialHolidays[dateKey];
        if (p) {
            if (p.startMin <= ds && p.endMin > ds) ds = p.endMin;
            else if (p.endMin >= de && p.startMin < de) de = p.startMin;
            else if (p.startMin > ds && p.endMin < de) {
                if (p.startMin - ds >= de - p.endMin) de = p.startMin;
                else ds = p.endMin;
            }
        }

        // Se é hoje, aplica tempo mínimo de preparo (incluindo agora com 0h)
        var todayKey = formatDateKey(new Date());
        if (dateKey === todayKey && minPrepHours >= 0) {
            var nowMin = new Date().getHours() * 60 + new Date().getMinutes() + minPrepHours * 60;
            if (nowMin > ds) ds = nowMin;
        }

        if (ds >= de) return [];
        return slotsData.filter(function (s) {
            var a = timeToMinutes(s[0]), b = timeToMinutes(s[1]);
            return a >= ds && b <= de;
        });
    }

    // ── Trigger update_checkout ──────────────────────────────────────────

    function triggerUpdate() {
        if (typeof jQuery !== 'undefined') jQuery('body').trigger('update_checkout');
    }

    // ── Populate slot select ─────────────────────────────────────────────

    function populateSlots(date) {
        var wd = date.getDay();
        var dk = formatDateKey(date);
        var slots = getSlotsForDay(wd, dk);

        // Save current selection before clearing
        var prevValue = slotSelect.value;

        // Remove all options except the default
        while (slotSelect.options.length > 1) slotSelect.remove(1);

        if (!slots.length) {
            if (slotField) slotField.style.display = 'block';
            slotSelect.value = '';
            slotSelect.options[0].textContent = 'Nenhum horário disponível...';
            triggerUpdate();
            return;
        }

        // Restaura texto original
        slotSelect.options[0].textContent = 'Selecione o horário...';

        slots.forEach(function (s) {
            var o = document.createElement('option');
            o.value = slotLabel(s); o.textContent = slotLabel(s);
            slotSelect.appendChild(o);
        });

        if (slotField) slotField.style.display = 'block';

        // Determine which slot to select:
        // 1. Cached slot for this exact date (page reload)
        // 2. Previous selection if it still exists in the new options (user changed date)
        var target = '';
        if (input._slotCache && input._slotCache.dateKey === dk) {
            target = input._slotCache.value;
        } else if (prevValue) {
            // Keep previous selection if it still exists
            for (var j = 0; j < slotSelect.options.length; j++) {
                if (slotSelect.options[j].value === prevValue) {
                    target = prevValue;
                    break;
                }
            }
        }

        slotSelect.value = target;
        triggerUpdate();
    }

    function populateSlotsFromStr(str) {
        var p = parseParts(str);
        if (!p) return;
        var d = new Date(p.year, p.month - 1, p.day);
        if (isNaN(d.getTime())) return;
        populateSlots(d);
    }

    // ── Calendar icon (RIGHT side) ───────────────────────────────────────

    function injectIcon() {
        var fw = document.getElementById('billing_delivery_date_field');
        if (!fw) return;
        var iw = fw.querySelector('.woocommerce-input-wrapper');
        if (!iw) return;
        if (document.getElementById('woo_better_delivery_calendar_icon')) return;

        iw.style.position = 'relative';

        var icon = document.createElement('span');
        icon.id = 'woo_better_delivery_calendar_icon';
        icon.setAttribute('style',
            'display:flex;align-items:center;justify-content:center;position:absolute;right:8px;top:50%;' +
            'transform:translateY(-50%);width:24px;height:24px;cursor:pointer;z-index:2;pointer-events:auto;'
        );
        icon.setAttribute('aria-label', 'Abrir calendário');
        icon.tabIndex = 0;
        icon.setAttribute('role', 'button');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';

        icon.addEventListener('click', function (e) {
            e.preventDefault(); e.stopPropagation();
            if (input._flatpickr) input._flatpickr.open();
        });

        input.style.paddingRight = '36px';
        iw.appendChild(icon);
    }

    // ── Flatpickr ────────────────────────────────────────────────────────

    function initPicker() {
        input._flatpickr = flatpickr(input, {
            enableTime: false,
            dateFormat: 'd/m/Y',
            minDate: 'today',
            locale: Portuguese,
            clickOpens: false,
            allowInput: true,
            disable: [isDisabled],
            onChange: function (sel) {
                if (sel.length && isComplete(input.value.trim())) populateSlots(sel[0]);
                else if (slotField) slotField.style.display = 'none';
            },
            onClose: function () {
                var v = input.value.trim();
                if (v && isComplete(v)) populateSlotsFromStr(v);
                triggerUpdate();
            },
            onKeyDown: function (_, __, ___, e) {
                if (e.ctrlKey || e.metaKey || e.altKey) return;
                if (/^(Backspace|Delete|Tab|Arrow|Home|End|Enter|Escape)$/.test(e.key)) return;
                if (!/^\d$/.test(e.key)) { e.preventDefault(); return; }
                setTimeout(function () { applyMask(input); }, 0);
            },
        });
        injectIcon();
    }

    // ── Events ───────────────────────────────────────────────────────────

    input.addEventListener('input', function () { applyMask(input); });
    input.addEventListener('blur', function () {
        var v = input.value.trim();
        if (v && isComplete(v)) populateSlotsFromStr(v);
    });

    slotSelect.addEventListener('change', function () {
        var d = input.value.trim();
        if (isComplete(d)) triggerUpdate();
    });

    // ── Init ─────────────────────────────────────────────────────────────

    // Hide slot field initially (JS controls visibility)
    if (slotField) slotField.style.display = 'none';

    initPicker();

    // Pre-fill from saved value (PHP already set select value + input value)
    var saved = (input.value || '').trim();
    var selVal = slotSelect.value;

    // Capture slot from PHP-rendered select (may be lost during flatpickr init)
    if (selVal) {
        input._slotCache = { dateKey: null, value: selVal };
    }

    if (saved && saved.length >= 10) {
        var dp = saved.split(' ')[0];
        var sp = saved.substring(dp.length + 1);
        // Prefer slot from select over combined value
        if (!input._slotCache || !input._slotCache.value) {
            if (sp) input._slotCache = { dateKey: null, value: sp };
        }
        if (dp && dp.length === 10) {
            var pp = parseParts(dp);
            if (pp) {
                // Update dateKey in cache
                if (input._slotCache) {
                    input._slotCache.dateKey = formatDateKey(new Date(pp.year, pp.month - 1, pp.day));
                }
                input._flatpickr.setDate(dp, true);
            }
        }
    }

    // ── Local pickup toggle ────────────────────────────────────────────

    var deliverySection = document.querySelector('.wc-better-delivery-shortcode-section');

    function isLocalPickupSelected() {
        // Usa o container #shipping_method (fixo no WooCommerce) para
        // encontrar o radio selecionado, independente do name exato.
        var container = document.getElementById('shipping_method');
        if (!container) return false;
        var checked = container.querySelector('input[type="radio"]:checked');
        if (!checked) return false;
        var val = checked.value;
        return val.indexOf('pickup_location') === 0 || val.indexOf('local_pickup') === 0 || val.indexOf('legacy_local_pickup') === 0;
    }

    function toggleDeliverySection() {
        if (!deliverySection && !(deliverySection = document.querySelector('.wc-better-delivery-shortcode-section'))) {
            return;
        }
        if (isLocalPickupSelected()) {
            deliverySection.style.display = 'none';
            // Desabilita required para não bloquear o submit
            if (input) input.required = false;
            if (slotSelect) slotSelect.required = false;
            // Limpa valores
            if (input) { input.value = ''; if (input._flatpickr) input._flatpickr.clear(); }
            if (slotSelect) { slotSelect.value = ''; }
            if (slotField) slotField.style.display = 'none';
        } else {
            deliverySection.style.display = '';
            if (input) input.required = true;
            if (slotSelect) slotSelect.required = true;
        }
    }

    // Executa na inicialização
    toggleDeliverySection();

    // Escuta o evento updated_checkout que o WooCommerce dispara após
    // aplicar os fragments AJAX do update_order_review
    if (typeof jQuery !== 'undefined') {
        jQuery(document.body).on('updated_checkout', toggleDeliverySection);
    }

    // Re-init on WooCommerce checkout update (fallback via MutationObserver)
    var obs = new MutationObserver(function () {
        var el = document.getElementById('billing_delivery_date');
        if (el && !el._flatpickr) {
            // Re-assign closure variables — WC may have replaced the DOM elements
            input = el;
            slotSelect = document.getElementById('billing_delivery_time_slot');
            if (!slotSelect) return;
            slotSelect.style.padding = '8px 12.8px';
            slotField = slotSelect.closest('.wc-better-slot-field') || slotSelect.closest('.form-row');
            initPicker();
            input.addEventListener('input', function () { applyMask(input); });
            input.addEventListener('blur', function () {
                var v = input.value.trim();
                if (v && isComplete(v)) populateSlotsFromStr(v);
            });
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
});
