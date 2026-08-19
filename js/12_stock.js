// ═══════════════════════════════════════════════════════
// MODULE: 12_stock.js
// Lines 2032–2526 of original script.js
// ═══════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
//  STOCK MANAGEMENT SYSTEM
//  Storage: localStorage (no DB migration needed – lightweight)
//  Keys:
//    stock_traceable   → { [itemKey]: true/false }       (drinks AND components share this map)
//    stock_levels      → { [itemKey]: number }  (current qty)
//    stock_purchases   → [ { id, date, time, itemKey, itemName, qty, costPerUnit, totalCost, notes, loggedBy } ]
//    stock_adjustments → [ { id, date, time, itemKey, itemName, qtyDeducted, reason, stockBefore, stockAfter, loggedBy } ]
//    stock_components  → { [compKey]: { name, traceable } }  (raw ingredients/extras, never shown on the menu)
//
//  Component keys are always prefixed "comp_" so they can never collide
//  with a DRINKS_MENU key. They live in the SAME stockTraceable/stockLevels
//  maps as drinks so all existing purchase/adjust/CSV logic works on them
//  without any changes.
// ══════════════════════════════════════════════════════════════════

let stockTraceable   = JSON.parse(localStorage.getItem('stock_traceable'))   || {};
let stockLevels      = JSON.parse(localStorage.getItem('stock_levels'))      || {};
let stockPurchases   = JSON.parse(localStorage.getItem('stock_purchases'))   || [];
let stockAdjustments = JSON.parse(localStorage.getItem('stock_adjustments')) || [];
let stockComponents  = JSON.parse(localStorage.getItem('stock_components'))  || {};

// ── Helpers ──────────────────────────────────────────────────────

async function saveStockState() {
    localStorage.setItem('stock_traceable',   JSON.stringify(stockTraceable));
    localStorage.setItem('stock_levels',      JSON.stringify(stockLevels));
    localStorage.setItem('stock_purchases',   JSON.stringify(stockPurchases));
    localStorage.setItem('stock_adjustments', JSON.stringify(stockAdjustments));
    localStorage.setItem('stock_components',  JSON.stringify(stockComponents));
    try {
        await db.stock_data.put({
            id: 'stock',
            stockTraceable, stockLevels, stockPurchases, stockAdjustments, stockComponents,
            updatedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('saveStockState Dexie write failed:', err);
    }
}

// Returns the display name for ANY stock-tracked key — a menu drink or a component.
function stockItemName(key) {
    if (DRINKS_MENU[key]) return DRINKS_MENU[key].name;
    if (stockComponents[key]) return stockComponents[key].name;
    return key;
}

// Returns true if `key` refers to a component (not a menu drink)
function isComponentKey(key) {
    return !!stockComponents[key];
}

function getStockNow() {
    return now => {
        const d = new Date();
        return {
            dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
            timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            user:    sessionStorage.getItem('gaming_user') || 'Unknown'
        };
    };
}

function stockNow() {
    const d = new Date();
    return {
        dateStr: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
        timeStr: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user:    sessionStorage.getItem('gaming_user') || 'Unknown'
    };
}

// ── Deduct stock when a drink is sold (LEGACY — kept for reference only) ──
// This used to be called at final checkout, but stock is now reserved live
// the instant each item is added (see reserveStockForItem below), so this
// function is no longer invoked anywhere. Left in place in case a future
// bulk-import or migration script needs "deduct a whole drinks map at once"
// semantics.
// If a drink has a recipe (DRINKS_MENU[key].recipe = [{componentKey, qty}]),
// its COMPONENTS are deducted instead of the drink key itself — the recipe
// is the source of truth for what gets consumed.
function deductStockForSale(drinksObj) {
    // drinksObj: { [drinkKey]: qty }
    let changed = false;
    const { dateStr, timeStr, user } = stockNow();

    for (let key in drinksObj) {
        const qty = drinksObj[key] || 0;
        if (qty <= 0) continue;

        const recipe = DRINKS_MENU[key] && Array.isArray(DRINKS_MENU[key].recipe) ? DRINKS_MENU[key].recipe : null;

        if (recipe && recipe.length > 0) {
            // Recipe-based drink: deduct each component, logged as an adjustment for traceability
            recipe.forEach(comp => {
                const compKey = comp.componentKey;
                if (!compKey || !stockTraceable[compKey]) return; // component not tracked
                const deduction = (comp.qty || 0) * qty;
                if (deduction <= 0) return;
                if (stockLevels[compKey] === undefined) stockLevels[compKey] = 0;
                const before = stockLevels[compKey];
                stockLevels[compKey] = Math.max(0, before - deduction);
                stockAdjustments.push({
                    id: Date.now() + Math.random(),
                    date: dateStr,
                    time: timeStr,
                    itemKey: compKey,
                    itemName: stockItemName(compKey),
                    qtyDeducted: deduction,
                    reason: `Sold: ${DRINKS_MENU[key].name} x${qty}`,
                    stockBefore: before,
                    stockAfter: stockLevels[compKey],
                    loggedBy: user
                });
                changed = true;
            });
        } else if (stockTraceable[key]) {
            // Plain traceable drink, no recipe — deduct the drink's own key as before
            if (stockLevels[key] === undefined) stockLevels[key] = 0;
            stockLevels[key] = Math.max(0, stockLevels[key] - qty);
            changed = true;
        }
    }
    if (changed) saveStockState();
}

// ── Stock availability guard ────────────────────────────────────────
// Call this BEFORE adding/consuming a drink (menu item OR custom item)
// or a raw component. Returns { ok: true } if the add/consume is allowed,
// or { ok: false, message: '...' } if it must be blocked because the item
// is traceable and stock is at 0.
//
// `key` works for a DRINKS_MENU key, a custom item registered under some
// key, or a stockComponents key — they all share the same
// stockTraceable / stockLevels maps.
function checkStockAvailability(key) {
    if (!key) return { ok: true };
    if (!stockTraceable[key]) return { ok: true }; // not tracked — no restriction

    const qty = stockLevels[key] || 0;
    if (qty <= 0) {
        const name = stockItemName(key);
        return {
            ok: false,
            message: `${name} is out of stock (0 pcs remaining). Restock it from the Stock view before adding it again.`
        };
    }
    return { ok: true };
}

// ── Recipe-aware availability guard ─────────────────────────────────
// Call this BEFORE adding a drink that may have a recipe (components).
// If the drink has a recipe, every traceable component must have enough
// stock for `qty` units of the drink. If it has no recipe, falls back to
// checking the drink's own key (legacy behaviour).
// Returns { ok: true } or { ok: false, message: '...' }.
function checkDrinkAvailability(drinkKey, qty = 1) {
    const drink = DRINKS_MENU[drinkKey];
    const recipe = drink && Array.isArray(drink.recipe) ? drink.recipe : null;

    if (!recipe || recipe.length === 0) {
        return checkStockAvailability(drinkKey);
    }

    for (let comp of recipe) {
        const compKey = comp.componentKey;
        if (!compKey || !stockTraceable[compKey]) continue; // not tracked, unlimited
        const needed = (comp.qty || 0) * qty;
        const available = stockLevels[compKey] || 0;
        if (needed > available) {
            const name = stockItemName(compKey);
            return {
                ok: false,
                message: `${name} is out of stock (${available} pcs remaining, need ${needed}). Restock it from the Stock view before adding "${drink.name}" again.`
            };
        }
    }
    return { ok: true };
}

// Convenience boolean version for quick checks (e.g. disabling a button)
function isOutOfStock(key) {
    return !checkStockAvailability(key).ok;
}

// ── Recipe-aware "is this out of stock RIGHT NOW" check ─────────────
// Used by every live drinks/extras list (console, VIP, cafe, AND shared
// space) to paint the "OUT" badge and disable the "+" button the instant
// a menu item — or any of its recipe components — runs out. Unlike
// isOutOfStock() above, this also accounts for recipe-based drinks whose
// stock lives on their components rather than the drink key itself.
function isDrinkOutOfStock(drinkKey) {
    return !checkDrinkAvailability(drinkKey, 1).ok;
}

// ── Live stock reservation ───────────────────────────────────────────
// Stock now moves the INSTANT an item is added to (or removed from) any
// pending order — console/VIP/cafe session, or a shared-space person —
// not just when the final checkout is confirmed. This is what makes
// "Current Stock Levels" and every "+"/OUT check reflect reality in real
// time: click "+" on Water and the count drops right away; click "-" (or
// delete a custom item) and it comes back.
//
// Recipe-aware: for a drink with a recipe, its COMPONENTS are what
// actually move; for anything else (a plain traceable menu item, or a
// component key used directly) the item's own key moves.
//
// `qty` is how many units of `key` are being added/removed (almost
// always 1, since this is driven by the +/- buttons, but kept general).
function _shiftStock(key, qty, releasing) {
    if (!key || !qty) return false;

    const recipe = DRINKS_MENU[key] && Array.isArray(DRINKS_MENU[key].recipe) ? DRINKS_MENU[key].recipe : null;
    let changed = false;

    if (recipe && recipe.length > 0) {
        recipe.forEach(comp => {
            const compKey = comp.componentKey;
            if (!compKey || !stockTraceable[compKey]) return; // not tracked
            const amount = (comp.qty || 0) * qty;
            if (!amount) return;
            if (stockLevels[compKey] === undefined) stockLevels[compKey] = 0;
            stockLevels[compKey] = Math.max(0, stockLevels[compKey] + (releasing ? amount : -amount));
            changed = true;
        });
    } else if (stockTraceable[key]) {
        if (stockLevels[key] === undefined) stockLevels[key] = 0;
        stockLevels[key] = Math.max(0, stockLevels[key] + (releasing ? qty : -qty));
        changed = true;
    }

    if (changed) saveStockState();
    return changed;
}

// Call the instant an item is added to an order (a "+" click, or a custom
// item that consumes it as a component). Assumes checkDrinkAvailability()
// was already used to confirm there's enough stock — this function does
// not itself block, it only moves the numbers.
function reserveStockForItem(key, qty = 1) {
    return _shiftStock(key, qty, false);
}

// Call the instant an item is removed from an order (a "-" click, or a
// custom item with stock components being deleted) so the stock it was
// holding comes back immediately.
function releaseStockForItem(key, qty = 1) {
    return _shiftStock(key, qty, true);
}

// ── Open / close stock view ───────────────────────────────────────

function openStockView() {
    switchTab('none');
    document.getElementById('stock-view').style.display = 'block';
    switchStockTab('overview'); // default to overview
}

// ── Tab switcher ─────────────────────────────────────────────────

function switchStockTab(tab) {
    const tabs   = ['overview', 'purchase', 'traceable', 'components', 'adjust'];
    tabs.forEach(t => {
        document.getElementById('stock-panel-' + t).style.display = (t === tab) ? 'block' : 'none';
        const btn = document.getElementById('stab-' + t);
        if (btn) btn.classList.toggle('active', t === tab);
    });

    // Render the appropriate panel
    if (tab === 'overview')   renderStockOverview();
    if (tab === 'purchase')  { populatePurchaseSelect(); renderPurchaseHistory(); }
    if (tab === 'traceable')  renderTraceableList();
    if (tab === 'components') renderComponentsList();
    if (tab === 'adjust')    { populateAdjustSelect(); renderAdjustHistory(); }
}

// ── Make sure stock-view is hidden in switchTab ───────────────────
// switchTab already hides stock-view natively (patched inline)

// ══════════════════════════════════════════
//  OVERVIEW
// ══════════════════════════════════════════

function renderStockOverview() {
    const container = document.getElementById('stock-overview-list');
    container.innerHTML = '';

    const traceableKeys = Object.keys(stockTraceable).filter(k => stockTraceable[k] && DRINKS_MENU[k]);

    if (traceableKeys.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:30px 0; font-size:13px;">No traceable items configured.<br>Go to the <strong style="color:var(--accent-cyan);">Traceable</strong> tab to enable tracking.</div>`;
        return;
    }

    traceableKeys.forEach(key => {
        const item = DRINKS_MENU[key];
        if (!item) return;
        const qty = stockLevels[key] || 0;
        let cardClass = 'stock-item-card';
        let qtyClass  = 'stock-qty-badge qty-ok';
        let label     = '';

        if (qty === 0)      { cardClass += ' out-of-stock'; qtyClass = 'stock-qty-badge qty-zero'; label = '<span style="color:var(--danger); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">OUT</span>'; }
        else if (qty <= 5)  { cardClass += ' low-stock';    qtyClass = 'stock-qty-badge qty-low';  label = '<span style="color:var(--warning); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">LOW</span>'; }

        container.innerHTML += `
            <div class="${cardClass}">
                <div>
                    <div class="stock-item-name">${item.name}</div>
                    <div class="stock-item-meta">Price: ${item.price} EGP &nbsp;•&nbsp; Traceable ${label}</div>
                </div>
                <div style="text-align:right;">
                    <div class="${qtyClass}">${qty}</div>
                    <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">pcs</div>
                </div>
            </div>
        `;
    });

    // Also show non-traceable items as a reference (greyed out)
    const nonTraceable = Object.keys(DRINKS_MENU).filter(k => !stockTraceable[k]);
    if (nonTraceable.length > 0) {
        container.innerHTML += `<div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.6px; margin:16px 0 8px;">Not Tracked</div>`;
        nonTraceable.forEach(key => {
            const item = DRINKS_MENU[key];
            container.innerHTML += `
                <div class="stock-item-card" style="opacity:0.4;">
                    <div>
                        <div class="stock-item-name">${item.name}</div>
                        <div class="stock-item-meta">Not traceable — stock not counted</div>
                    </div>
                    <div style="font-size:12px; color:var(--text-dim);">—</div>
                </div>
            `;
        });
    }

    // ── Components section ──────────────────────────────────────────
    const compTraceableKeys = Object.keys(stockComponents).filter(k => stockTraceable[k]);
    if (compTraceableKeys.length > 0) {
        container.innerHTML += `<div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.6px; margin:16px 0 8px;">Components</div>`;
        compTraceableKeys.forEach(key => {
            const comp = stockComponents[key];
            const qty  = stockLevels[key] || 0;
            let cardClass = 'stock-item-card';
            let qtyClass  = 'stock-qty-badge qty-ok';
            let label     = '';

            if (qty === 0)      { cardClass += ' out-of-stock'; qtyClass = 'stock-qty-badge qty-zero'; label = '<span style="color:var(--danger); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">OUT</span>'; }
            else if (qty <= 5)  { cardClass += ' low-stock';    qtyClass = 'stock-qty-badge qty-low';  label = '<span style="color:var(--warning); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">LOW</span>'; }

            container.innerHTML += `
                <div class="${cardClass}">
                    <div>
                        <div class="stock-item-name">${comp.name}</div>
                        <div class="stock-item-meta">Component &nbsp;•&nbsp; Traceable ${label}</div>
                    </div>
                    <div style="text-align:right;">
                        <div class="${qtyClass}">${qty}</div>
                        <div style="font-size:10px; color:var(--text-muted); margin-top:2px;">pcs</div>
                    </div>
                </div>
            `;
        });
    }

    const compNonTraceable = Object.keys(stockComponents).filter(k => !stockTraceable[k]);
    if (compNonTraceable.length > 0) {
        container.innerHTML += `<div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.6px; margin:16px 0 8px;">Components — Not Tracked</div>`;
        compNonTraceable.forEach(key => {
            const comp = stockComponents[key];
            container.innerHTML += `
                <div class="stock-item-card" style="opacity:0.4;">
                    <div>
                        <div class="stock-item-name">${comp.name}</div>
                        <div class="stock-item-meta">Not traceable — stock not counted</div>
                    </div>
                    <div style="font-size:12px; color:var(--text-dim);">—</div>
                </div>
            `;
        });
    }
}

// ══════════════════════════════════════════
//  TRACEABLE MANAGEMENT
// ══════════════════════════════════════════

function renderTraceableList() {
    const container = document.getElementById('traceable-items-list');
    container.innerHTML = '';

    const keys = Object.keys(DRINKS_MENU);
    if (keys.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">No items in the drinks menu yet.</div>`;
        return;
    }

    keys.forEach(key => {
        const item    = DRINKS_MENU[key];
        const tracked = !!stockTraceable[key];
        const qty     = stockLevels[key] || 0;

        container.innerHTML += `
            <div class="traceable-row">
                <div>
                    <div class="traceable-label">${item.name}</div>
                    <div class="traceable-sub">${item.price} EGP &nbsp;•&nbsp; ${tracked ? 'Stock: <strong style="color:var(--accent-cyan);">' + qty + ' pcs</strong>' : 'Not tracked'}</div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" ${tracked ? 'checked' : ''} onchange="toggleTraceable('${key}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
    });
}

function toggleTraceable(key, enabled) {
    stockTraceable[key] = enabled;
    if (enabled && stockLevels[key] === undefined) {
        stockLevels[key] = 0; // initialise to 0 when first enabled
    }
    saveStockState();
    renderTraceableList();
    // also refresh overview if visible
    if (document.getElementById('stock-panel-overview').style.display !== 'none') renderStockOverview();
}

// ══════════════════════════════════════════
//  COMPONENTS (raw ingredients / extras — never shown on the menu)
// ══════════════════════════════════════════

function _genComponentKey(name) {
    let base = 'comp_' + name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    if (!base || base === 'comp_') base = 'comp_item';
    let finalKey = base;
    let counter = 1;
    while (stockComponents[finalKey]) {
        finalKey = base + '_' + counter;
        counter++;
    }
    return finalKey;
}

function addNewComponent() {
    const nameInput = document.getElementById('new-component-name');
    const traceInput = document.getElementById('new-component-traceable');
    const name = nameInput.value.trim();

    if (!name) return customAlert(T('al-enter-component-name'), T('al-title-missing-field'));

    const key = _genComponentKey(name);
    const traceable = traceInput ? traceInput.checked : true;

    stockComponents[key] = { name, traceable };
    stockTraceable[key] = traceable;
    if (traceable && stockLevels[key] === undefined) stockLevels[key] = 0;

    saveStockState();

    nameInput.value = '';
    if (traceInput) traceInput.checked = true;

    renderComponentsList();
    customAlert(Tf('al-component-added', { name: name }), T('al-title-component-added'));
}

function toggleComponentTraceable(key, enabled) {
    if (!stockComponents[key]) return;
    stockComponents[key].traceable = enabled;
    stockTraceable[key] = enabled;
    if (enabled && stockLevels[key] === undefined) stockLevels[key] = 0;
    saveStockState();
    renderComponentsList();
    if (document.getElementById('stock-panel-overview').style.display !== 'none') renderStockOverview();
}

function deleteComponent(key) {
    const comp = stockComponents[key];
    if (!comp) return;

    // Warn if any drink recipe currently references this component
    const usedBy = Object.values(DRINKS_MENU).filter(d => Array.isArray(d.recipe) && d.recipe.some(r => r.componentKey === key));
    const warning = usedBy.length > 0
        ? Tf('cf-delete-component-warning', { items: usedBy.map(d => d.name).join(', ') })
        : '';

    showConfirm(Tf('cf-delete-component', { name: comp.name, warning: warning }), () => {
        delete stockComponents[key];
        delete stockTraceable[key];
        delete stockLevels[key];
        saveStockState();
        renderComponentsList();
    }, null);
}

function renderComponentsList() {
    const container = document.getElementById('components-list');
    container.innerHTML = '';

    const keys = Object.keys(stockComponents);
    if (keys.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">No components added yet.</div>`;
        return;
    }

    keys.forEach(key => {
        const comp = stockComponents[key];
        const tracked = !!comp.traceable;
        const qty = stockLevels[key] || 0;

        container.innerHTML += `
            <div class="traceable-row">
                <div>
                    <div class="traceable-label">${comp.name}</div>
                    <div class="traceable-sub">${tracked ? 'Stock: <strong style="color:var(--accent-cyan);">' + qty + ' pcs</strong>' : 'Not tracked'}</div>
                </div>
                <div style="display:flex; align-items:center; gap:10px;">
                    <label class="toggle-switch">
                        <input type="checkbox" ${tracked ? 'checked' : ''} onchange="toggleComponentTraceable('${key}', this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <button class="btn-danger" onclick="deleteComponent('${key}')" style="width:auto; padding:8px 10px; border-radius:6px; font-size:12px;">🗑</button>
                </div>
            </div>
        `;
    });
}

// ══════════════════════════════════════════
//  PURCHASE LOGGING
// ══════════════════════════════════════════

function populatePurchaseSelect() {
    const sel = document.getElementById('purchase-item-select');
    sel.innerHTML = '<option value="">— Select Item —</option>';

    let drinkOptions = '';
    for (let key in DRINKS_MENU) {
        const item = DRINKS_MENU[key];
        drinkOptions += `<option value="${key}">${item.name} (${item.price} EGP/unit)</option>`;
    }
    if (drinkOptions) sel.innerHTML += `<optgroup label="Menu Items">${drinkOptions}</optgroup>`;

    let compOptions = '';
    for (let key in stockComponents) {
        const comp = stockComponents[key];
        compOptions += `<option value="${key}">${comp.name}</option>`;
    }
    if (compOptions) sel.innerHTML += `<optgroup label="Components">${compOptions}</optgroup>`;

    // Show or hide the quantity row based on whether the selected item is traceable
    sel.onchange = function() {
        const key = this.value;
        const qtyLabel = document.getElementById('purchase-qty-label');
        const qtyInput = document.getElementById('purchase-qty');
        if (!key) {
            // No selection — show qty by default
            qtyLabel.style.display = '';
            qtyInput.style.display = '';
            qtyInput.value = '';
            return;
        }
        const isTraceable = !!stockTraceable[key];
        qtyLabel.style.display = isTraceable ? '' : 'none';
        qtyInput.style.display = isTraceable ? '' : 'none';
        if (!isTraceable) qtyInput.value = '1'; // default 1 so logPurchase() won't reject it
    };
}

async function logPurchase() {
    const itemKey  = document.getElementById('purchase-item-select').value;
    const qty      = parseInt(document.getElementById('purchase-qty').value);
    const cost     = parseFloat(document.getElementById('purchase-cost').value);
    const notes    = document.getElementById('purchase-notes').value.trim();

    if (!itemKey)          return customAlert(T('al-select-item'), T('al-title-missing-field'));
    if (!qty || qty < 1)   return customAlert(T('al-invalid-qty'), T('al-title-missing-field'));
    if (isNaN(cost) || cost < 0) return customAlert(T('al-invalid-total-cost'), T('al-title-missing-field'));

    const itemName = stockItemName(itemKey);
    const { dateStr, timeStr, user } = stockNow();
    const costPerUnit = cost / qty;

    // 1. Log to purchase history
    const record = {
        id: Date.now(),
        date: dateStr,
        time: timeStr,
        itemKey,
        itemName,
        qty,
        costPerUnit: parseFloat(costPerUnit.toFixed(4)),
        totalCost: cost,
        notes: notes || '',
        loggedBy: user
    };
    stockPurchases.push(record);

    // 2. Add to stock levels if traceable
    if (stockTraceable[itemKey]) {
        if (stockLevels[itemKey] === undefined) stockLevels[itemKey] = 0;
        stockLevels[itemKey] += qty;
    }

    saveStockState();

    // 3. Auto-log as Expense in finance
    const expenseDesc = `Stock Purchase — ${itemName} x${qty} pcs${notes ? ' | ' + notes : ''}`;
    await saveFinanceRecord('Expense', cost, expenseDesc);

    // 4. Clear form
    document.getElementById('purchase-item-select').value = '';
    document.getElementById('purchase-qty').value = '';
    document.getElementById('purchase-cost').value = '';
    document.getElementById('purchase-notes').value = '';

    renderPurchaseHistory();
    customAlert(Tf('al-purchase-logged', { qty: qty, item: itemName, cost: cost.toFixed(2) }), T('al-title-purchase-logged'));
}

function renderPurchaseHistory() {
    const container = document.getElementById('purchase-history-list');
    container.innerHTML = '';

    if (stockPurchases.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">No purchases logged yet.</div>`;
        return;
    }

    const sorted = [...stockPurchases].sort((a, b) => b.id - a.id);
    sorted.forEach(r => {
        container.innerHTML += `
            <div class="stock-history-row">
                <div class="stock-history-header">
                    <div class="stock-history-title">${r.itemName}</div>
                    <div class="stock-history-amount">${r.totalCost.toFixed(2)} EGP</div>
                </div>
                <div class="stock-history-meta">
                    Qty: <strong style="color:var(--text-main);">${r.qty} pcs</strong> &nbsp;•&nbsp; Unit cost: ${r.costPerUnit.toFixed(2)} EGP<br>
                    ${r.date} ${r.time} &nbsp;•&nbsp; ${r.loggedBy}${r.notes ? '<br>📝 ' + r.notes : ''}
                </div>
            </div>
        `;
    });
}

// ══════════════════════════════════════════
//  MANUAL ADJUSTMENT (LOSSES / MISSING)
// ══════════════════════════════════════════

function populateAdjustSelect() {
    const sel = document.getElementById('adjust-item-select');
    sel.innerHTML = '<option value="">— Select Traceable Item —</option>';

    let drinkOptions = '';
    for (let key in DRINKS_MENU) {
        if (!stockTraceable[key]) continue;
        const item = DRINKS_MENU[key];
        const qty  = stockLevels[key] || 0;
        drinkOptions += `<option value="${key}">${item.name} — ${qty} pcs in stock</option>`;
    }
    if (drinkOptions) sel.innerHTML += `<optgroup label="Menu Items">${drinkOptions}</optgroup>`;

    let compOptions = '';
    for (let key in stockComponents) {
        if (!stockTraceable[key]) continue;
        const comp = stockComponents[key];
        const qty  = stockLevels[key] || 0;
        compOptions += `<option value="${key}">${comp.name} — ${qty} pcs in stock</option>`;
    }
    if (compOptions) sel.innerHTML += `<optgroup label="Components">${compOptions}</optgroup>`;

    // live update the "current stock" hint
    sel.onchange = function() {
        const k   = this.value;
        const div = document.getElementById('adjust-current-stock');
        if (k && stockTraceable[k]) {
            const qty = stockLevels[k] || 0;
            div.innerHTML = `Current stock: <strong style="color:var(--accent-cyan);">${qty} pcs</strong>`;
        } else {
            div.innerHTML = '';
        }
    };
}

function logAdjustment() {
    const itemKey = document.getElementById('adjust-item-select').value;
    const qty     = parseInt(document.getElementById('adjust-qty').value);
    const reason  = document.getElementById('adjust-reason').value.trim();

    if (!itemKey)         return customAlert(T('al-select-traceable-item'), T('al-title-missing-field'));
    if (!qty || qty < 1)  return customAlert(T('al-invalid-qty'), T('al-title-missing-field'));
    if (!reason)          return customAlert(T('al-enter-reason'), T('al-title-missing-field'));

    const itemName     = stockItemName(itemKey);
    const stockBefore  = stockLevels[itemKey] || 0;
    const stockAfter   = Math.max(0, stockBefore - qty);
    const { dateStr, timeStr, user } = stockNow();

    const record = {
        id: Date.now(),
        date: dateStr,
        time: timeStr,
        itemKey,
        itemName,
        qtyDeducted: qty,
        reason,
        stockBefore,
        stockAfter,
        loggedBy: user
    };

    stockAdjustments.push(record);
    stockLevels[itemKey] = stockAfter;
    saveStockState();

    // Refresh the select so qty updates
    populateAdjustSelect();
    document.getElementById('adjust-qty').value    = '';
    document.getElementById('adjust-reason').value = '';
    document.getElementById('adjust-current-stock').innerHTML = '';

    renderAdjustHistory();
    customAlert(Tf('al-adjustment-logged', { qty: qty, item: itemName, before: stockBefore, after: stockAfter }), T('al-title-adjustment-logged'));
}

function renderAdjustHistory() {
    const container = document.getElementById('adjust-history-list');
    container.innerHTML = '';

    if (stockAdjustments.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">No adjustments logged yet.</div>`;
        return;
    }

    const sorted = [...stockAdjustments].sort((a, b) => b.id - a.id);
    sorted.forEach(r => {
        container.innerHTML += `
            <div class="stock-history-row">
                <div class="stock-history-header">
                    <div class="stock-history-title">${r.itemName}</div>
                    <div style="font-size:13px; font-weight:700; color:var(--warning);">-${r.qtyDeducted} pcs</div>
                </div>
                <div class="stock-history-meta">
                    Before: ${r.stockBefore} → After: <strong style="color:var(--accent-cyan);">${r.stockAfter}</strong><br>
                    Reason: <strong style="color:var(--text-main);">${r.reason}</strong><br>
                    ${r.date} ${r.time} &nbsp;•&nbsp; ${r.loggedBy}
                </div>
            </div>
        `;
    });
}

// ══════════════════════════════════════════
//  STOCK DEDUCTION — now handled LIVE, not at checkout
//  Stock is reserved the instant an item is added (see reserveStockForItem
//  in updateDrinkQty / updateSharedDrinkQty / cwizConfirm) and released the
//  instant it's removed (see releaseStockForItem in the matching "-"/
//  remove-item functions). Checkout no longer touches stock at all — doing
//  so here too would deduct the same units a second time.
// ══════════════════════════════════════════

// ══════════════════════════════════════════
//  CSV EXPORTS
// ══════════════════════════════════════════

function exportStockCSV() {
    const traceableKeys = Object.keys(stockTraceable).filter(k => stockTraceable[k] && (DRINKS_MENU[k] || stockComponents[k]));
    if (traceableKeys.length === 0) return customAlert(T('al-no-traceable-export'), T('al-title-export'));

    const headers = ['item_key', 'item_name', 'item_type', 'price_egp', 'current_qty', 'traceable'].join(',');
    const rows = [];

    for (let key in DRINKS_MENU) {
        const item    = DRINKS_MENU[key];
        const tracked = !!stockTraceable[key];
        const qty     = tracked ? (stockLevels[key] || 0) : '';
        rows.push([
            key,
            `"${item.name}"`,
            'menu_item',
            item.price,
            qty,
            tracked ? 'Yes' : 'No'
        ].join(','));
    }

    for (let key in stockComponents) {
        const comp    = stockComponents[key];
        const tracked = !!stockTraceable[key];
        const qty     = tracked ? (stockLevels[key] || 0) : '';
        rows.push([
            key,
            `"${comp.name}"`,
            'component',
            '',
            qty,
            tracked ? 'Yes' : 'No'
        ].join(','));
    }

    _downloadCSV([headers, ...rows].join('\n'), `stock_levels_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportPurchasesCSV() {
    if (stockPurchases.length === 0) return customAlert(T('al-no-purchases-export'), T('al-title-export'));

    const headers = ['id', 'date', 'time', 'item_key', 'item_name', 'qty', 'cost_per_unit_egp', 'total_cost_egp', 'notes', 'logged_by'].join(',');
    const rows = stockPurchases.map(r => [
        r.id,
        `"\t${r.date}"`,
        `"\t${r.time}"`,
        r.itemKey,
        `"${r.itemName}"`,
        r.qty,
        r.costPerUnit.toFixed(4),
        r.totalCost.toFixed(2),
        `"${(r.notes || '').replace(/"/g, '""')}"`,
        `"${r.loggedBy}"`
    ].join(','));

    _downloadCSV([headers, ...rows].join('\n'), `stock_purchases_${new Date().toISOString().split('T')[0]}.csv`);
}

function exportAdjustmentsCSV() {
    if (stockAdjustments.length === 0) return customAlert(T('al-no-adjustments-export'), T('al-title-export'));

    const headers = ['id', 'date', 'time', 'item_key', 'item_name', 'qty_deducted', 'stock_before', 'stock_after', 'reason', 'logged_by'].join(',');
    const rows = stockAdjustments.map(r => [
        r.id,
        `"\t${r.date}"`,
        `"\t${r.time}"`,
        r.itemKey,
        `"${r.itemName}"`,
        r.qtyDeducted,
        r.stockBefore,
        r.stockAfter,
        `"${r.reason.replace(/"/g, '""')}"`,
        `"${r.loggedBy}"`
    ].join(','));

    _downloadCSV([headers, ...rows].join('\n'), `stock_adjustments_${new Date().toISOString().split('T')[0]}.csv`);
}

function _downloadCSV(content, filename) {
    if (window.FlutterFinanceBridge) {
        window.FlutterFinanceBridge.postMessage(content);
        return;
    }
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}