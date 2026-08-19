// ═══════════════════════════════════════════════════════
// MODULE: 08_drinks.js  (REBUILT FROM SCRATCH)
// Handles: the "Drinks & Extras" modal for PS/VIP consoles and
// Cafe tables (sessions[id].drinks / sessions[id].customExtras),
// and the Custom Item Wizard (name + price + optional stock
// components + optional outside purchases).
//
// NOTE ON COMPONENTS: raw stock "components" (from Stock → Components)
// are intentionally NEVER listed here. They only ever appear in:
//   - the recipe editor for a menu item (04_admin_views.js)
//   - Stock → Components / Overview / Purchase (12_stock.js)
// The drinks list and the custom-item "From Our Stock" picker below
// only ever offer DRINKS_MENU items, never raw components.
// ═══════════════════════════════════════════════════════

// Tracks which "mode" the custom item wizard is being used in, so
// cwizConfirm() knows whether to push the new item onto a console/cafe
// session or onto a person sitting at a shared table.
// 11_shared_space.js flips this to 'shared' before opening the wizard
// for a person; openDrinksModal() below resets it back to 'console'.
let _cwizContext = 'console';

// In-progress rows for the custom item wizard (cleared each time the
// wizard is opened / closed).
let _cwizStockRows   = [];   // [{ id, key, qty }]   — picks from DRINKS_MENU
let _cwizOutsideRows = [];   // [{ id, name, price }] — free-form, no stock impact
let _cwizRowSeq = 0;

// ══════════════════════════════════════════
//  SHARED PRICING/EXTRAS HELPERS
//  Single source of truth for "what does this session currently owe" so
//  the live preview shown while adding drinks/extras (and the Start
//  Session preview) always matches what the final checkout receipt — and
//  the finance record saved from it — will say.
// ══════════════════════════════════════════

// Totals up DRINKS_MENU items + custom extras for any object shaped like
// { drinks: {key: qty}, customExtras: [{name, price}] }. Works for console/
// VIP/cafe sessions AND shared-space occupants, since they share that shape.
function computeSessionExtras(sess) {
    let extrasTotal = 0;
    let extrasBreakdown = [];
    let drinksHtml = '';

    for (let key in DRINKS_MENU) {
        const qty = (sess.drinks && sess.drinks[key]) || 0;
        if (qty > 0) {
            const itemTotal = qty * DRINKS_MENU[key].price;
            extrasTotal += itemTotal;
            extrasBreakdown.push(`${DRINKS_MENU[key].name} x${qty}`);
            drinksHtml += `<div class="receipt-sub"><span>↳ ${DRINKS_MENU[key].name} x${qty}</span><strong>${itemTotal.toFixed(2)} EGP</strong></div>`;
        }
    }

    (sess.customExtras || []).forEach(item => {
        extrasTotal += item.price;
        extrasBreakdown.push(`${item.name} (${item.price})`);
        drinksHtml += `<div class="receipt-sub"><span>↳ ${item.name}</span><strong>${item.price.toFixed(2)} EGP</strong></div>`;
    });

    return { extrasTotal, extrasBreakdown, drinksHtml };
}

// Live (not-yet-ended) time-based pricing for a console/VIP session, using
// the exact same segment/rate logic as the real checkout in 09_checkout.js.
// Used only to preview "what would this cost right now" while extras are
// being added — the real charge is still computed by endSession() itself.
function computeSessionTiming(sess, consoleObj) {
    const now = Date.now();
    let singleMs = 0, multiMs = 0, iptvMs = 0, gamingMs = 0;

    (sess.segments || []).forEach(seg => {
        const endTime = seg.end ? seg.end : now;
        const timeSpent = endTime - seg.start;
        if (seg.type === 'single') singleMs += timeSpent;
        else if (seg.type === 'multi') multiMs += timeSpent;
        else if (seg.type === 'iptv') iptvMs += timeSpent;
        else if (seg.type === 'gaming') gamingMs += timeSpent;
    });

    const isVip = consoleObj.type === 'vip';
    const isPS5 = consoleObj.name.includes("PS5");

    if (isVip) {
        gamingMs += singleMs + multiMs;
        singleMs = 0;
        multiMs = 0;
    }

    let rSingle = 0, rMulti = 0, rIptv = 0, rGaming = 0;
    if (isVip) {
        rGaming = isPS5 ? RATE_VIP_PS5 : RATE_VIP_PS4;
        rIptv = RATE_VIP_IPTV;
    } else {
        rSingle = RATE_SINGLE;
        rMulti = RATE_MULTI;
        rIptv = RATE_LOUNGE_IPTV;
        if (isPS5) {
            rSingle += RATE_PS5_EXTRA;
            rMulti += RATE_PS5_EXTRA;
        }
    }

    const singlePrice = Math.round(((singleMs / 1000 / 3600) * rSingle) * 2) / 2;
    const multiPrice = Math.round(((multiMs / 1000 / 3600) * rMulti) * 2) / 2;
    const iptvPrice = Math.round(((iptvMs / 1000 / 3600) * rIptv) * 2) / 2;
    const gamingPrice = Math.round(((gamingMs / 1000 / 3600) * rGaming) * 2) / 2;

    const totalMs = singleMs + multiMs + iptvMs + gamingMs;
    const timePrice = singlePrice + multiPrice + iptvPrice + gamingPrice;

    return { totalMs, timePrice };
}

// Refreshes the small "current bill so far" preview box inside the
// Drinks & Extras modal — mirrors the numbers that will show up on the
// final checkout receipt, for either a console/VIP/cafe session or a
// shared-space occupant, whichever is currently open in the modal.
function updateDrinksPreview() {
    const timeRow = document.getElementById('drinks-preview-time-row');
    const costRow = document.getElementById('drinks-preview-time-cost-row');
    const extrasEl = document.getElementById('drinks-preview-extras-total');
    if (!extrasEl || !timeRow || !costRow) return; // markup not present, skip silently

    let extras;
    let totalMs = null;
    let timeCost = null;

    if (currentSharedTableId && currentSharedPersonId) {
        const table = sharedTables[currentSharedTableId];
        const person = table ? table.occupants.find(p => p.id === currentSharedPersonId) : null;
        if (!person) return;
        extras = computeSessionExtras(person);
        totalMs = Date.now() - person.startTime;
        timeCost = (totalMs / 1000 / 3600) * SHARED_HOURLY_RATE;
    } else if (currentDrinksSessionId !== null && currentDrinksSessionId !== undefined) {
        const sess = sessions[currentDrinksSessionId];
        if (!sess) return;
        extras = computeSessionExtras(sess);
        const entity = ALL_ENTITIES.find(c => c.id === currentDrinksSessionId);
        if (entity && entity.type !== 'cafe' && sess.active) {
            const timing = computeSessionTiming(sess, entity);
            totalMs = timing.totalMs;
            timeCost = timing.timePrice;
        }
    } else {
        return;
    }

    if (totalMs !== null) {
        timeRow.style.display = 'flex';
        costRow.style.display = 'flex';
        const timeEl = document.getElementById('drinks-preview-time');
        const costEl = document.getElementById('drinks-preview-time-cost');
        if (timeEl) timeEl.innerText = formatTime(Math.floor(totalMs / 1000));
        if (costEl) costEl.innerText = timeCost.toFixed(2) + ' EGP';
    } else {
        timeRow.style.display = 'none';
        costRow.style.display = 'none';
    }

    extrasEl.innerText = extras.extrasTotal.toFixed(2) + ' EGP';
}

// ══════════════════════════════════════════
//  DRINKS & EXTRAS MODAL (console / VIP / cafe)
// ══════════════════════════════════════════

function openDrinksModal(id) {
    currentDrinksSessionId = id;
    // Make sure we're not still pointed at a shared-space person
    currentSharedTableId  = null;
    currentSharedPersonId = null;
    _cwizContext = 'console';

    const sess = sessions[id];
    if (!sess) return;
    if (!sess.drinks) sess.drinks = {};
    if (!Array.isArray(sess.customExtras)) sess.customExtras = [];

    const entity = ALL_ENTITIES.find(c => c.id === id);
    document.getElementById('drinks-console-name').innerText = entity ? `Managing Extras for: ${entity.name}` : '';

    renderDrinksList();
    updateDrinksPreview();
    document.getElementById('drinks-modal').style.display = 'flex';
}

function closeDrinksModal() {
    document.getElementById('drinks-modal').style.display = 'none';
    // Refresh badges/cards (e.g. cafe table "Open"/empty state) now that
    // drinks/extras may have changed.
    updateUI();
    currentDrinksSessionId = null;
}

function renderDrinksList() {
    const sess = sessions[currentDrinksSessionId];
    if (!sess) return;
    const listDiv = document.getElementById('drinks-list');
    listDiv.innerHTML = '';

    for (let key in DRINKS_MENU) {
        const item = DRINKS_MENU[key];
        const qty = sess.drinks[key] || 0;
        const outOfStock = (typeof isDrinkOutOfStock === 'function') && isDrinkOutOfStock(key);

        listDiv.innerHTML += `
            <div class="drink-row">
                <div class="drink-info">
                    <strong style="color: #fff; font-size: 15px; display: block;">
                        ${item.name}${outOfStock ? ' <span style="color:var(--danger); font-size:10px; font-weight:700; text-transform:uppercase;">OUT</span>' : ''}
                    </strong>
                    <span style="color: var(--text-muted); font-size: 12px;">${item.price} EGP</span>
                </div>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button class="qty-btn" onclick="updateDrinkQty('${key}', -1)">-</button>
                    <span class="qty-display">${qty}</span>
                    <button class="qty-btn" onclick="updateDrinkQty('${key}', 1)" ${outOfStock ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>+</button>
                </div>
            </div>
        `;
    }

    renderConsoleCustomItemsList();
    updateDrinksPreview();
}

function renderConsoleCustomItemsList() {
    const sess = sessions[currentDrinksSessionId];
    if (!sess) return;
    if (!Array.isArray(sess.customExtras)) sess.customExtras = [];

    const customDiv = document.getElementById('custom-items-list');
    customDiv.innerHTML = '';

    if (sess.customExtras.length === 0) {
        customDiv.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 10px;">No custom items added.</div>`;
        return;
    }

    sess.customExtras.forEach((item, index) => {
        customDiv.innerHTML += `
            <div class="custom-item-badge">
                <span>${item.name} <span style="color: var(--text-muted); margin-left: 10px;">${item.price.toFixed(2)} EGP</span></span>
                <button class="delete-btn" onclick="removeCustomItem(${index})">✕</button>
            </div>
        `;
    });
}

async function updateDrinkQty(key, delta) {
    const sess = sessions[currentDrinksSessionId];
    if (!sess) return;
    if (!sess.drinks[key]) sess.drinks[key] = 0;

    if (delta > 0) {
        if (typeof checkDrinkAvailability === 'function') {
            const check = checkDrinkAvailability(key, 1);
            if (!check.ok) {
                customAlert(check.message, 'Out of Stock');
                return;
            }
        }
        // Reserve stock the instant it's added, so levels/badges update live.
        if (typeof reserveStockForItem === 'function') reserveStockForItem(key, 1);
    } else if (delta < 0 && sess.drinks[key] > 0) {
        // Give the reserved stock back the instant a unit is removed.
        if (typeof releaseStockForItem === 'function') releaseStockForItem(key, 1);
    }

    let newQty = sess.drinks[key] + delta;
    if (newQty < 0) newQty = 0;
    sess.drinks[key] = newQty;

    renderDrinksList();
    if (currentZone === 'cafe') updateUI(); // live-refresh the table's "Open"/empty badge

    await db.sessions.update(currentDrinksSessionId, { drinks: sess.drinks, updated_at: new Date().toISOString() });
}

async function removeCustomItem(index) {
    const sess = sessions[currentDrinksSessionId];
    if (!sess || !Array.isArray(sess.customExtras)) return;

    // Give back whatever stock this custom item consumed when it was made.
    const item = sess.customExtras[index];
    if (item && Array.isArray(item.stockComponents) && typeof releaseStockForItem === 'function') {
        item.stockComponents.forEach(c => releaseStockForItem(c.key, c.qty));
    }

    sess.customExtras.splice(index, 1);
    renderDrinksList();
    if (currentZone === 'cafe') updateUI();

    await db.sessions.update(currentDrinksSessionId, { custom_extras: sess.customExtras, updated_at: new Date().toISOString() });
}

// ── Shared-space counterpart (referenced by 11_shared_space.js) ─────
// Removes a custom item from whichever person is currently open in the
// drinks modal in shared-space context.
function removeSharedCustomItem(index) {
    if (!currentSharedTableId || !currentSharedPersonId) return;
    const table = sharedTables[currentSharedTableId];
    if (!table) return;
    const person = table.occupants.find(p => p.id === currentSharedPersonId);
    if (!person || !Array.isArray(person.customExtras)) return;

    // Give back whatever stock this custom item consumed when it was made.
    const item = person.customExtras[index];
    if (item && Array.isArray(item.stockComponents) && typeof releaseStockForItem === 'function') {
        item.stockComponents.forEach(c => releaseStockForItem(c.key, c.qty));
    }

    person.customExtras.splice(index, 1);
    if (typeof _persistSharedTable === 'function') _persistSharedTable(currentSharedTableId);
    renderSharedDrinksList();
    if (currentZone === 'shared') renderSharedSpace();
}

// ══════════════════════════════════════════
//  CUSTOM ITEM WIZARD
//  Step 1: name + selling price
//  Step 2 (optional): components pulled "from our stock" (DRINKS_MENU
//          items — deducts their stock if traceable)
//  Step 3 (optional): items purchased outside (pure cost, no stock impact)
// ══════════════════════════════════════════

function openCustomItemWizard() {
    document.getElementById('cwiz-name').value = '';
    document.getElementById('cwiz-price').value = '';
    _cwizStockRows = [];
    _cwizOutsideRows = [];
    _renderCwizRows();
    cwizUpdateCostBar();
    document.getElementById('custom-item-wizard-modal').style.display = 'flex';
}

function cwizClose() {
    document.getElementById('custom-item-wizard-modal').style.display = 'none';
}

function _cwizDrinkOptions(selectedKey) {
    let options = `<option value="">${T('ph-select-item')}</option>`;
    for (let key in DRINKS_MENU) {
        const sel = (key === selectedKey) ? ' selected' : '';
        options += `<option value="${key}"${sel}>${DRINKS_MENU[key].name} (${DRINKS_MENU[key].price} EGP)</option>`;
    }
    return options;
}

function _renderCwizRows() {
    // Stock (menu item) rows
    const stockContainer = document.getElementById('cwiz-stock-rows');
    const stockEmpty     = document.getElementById('cwiz-stock-empty');
    stockContainer.innerHTML = '';
    stockEmpty.style.display = _cwizStockRows.length === 0 ? 'block' : 'none';

    _cwizStockRows.forEach(row => {
        const issue = _cwizStockRowIssue(row);
        stockContainer.innerHTML += `
            <div class="cwiz-row" style="display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; gap:6px; align-items:center;">
                    <select style="flex:2; margin:0; font-size:13px; padding:8px 10px;" onchange="_cwizUpdateStockRow(${row.id}, 'key', this.value)">${_cwizDrinkOptions(row.key)}</select>
                    <input id="cwiz-stock-qty-${row.id}" type="number" value="${row.qty}" min="1" style="flex:1; margin:0; font-size:13px; padding:8px 10px; ${issue ? 'border-color:var(--danger);' : ''}" oninput="_cwizUpdateStockRow(${row.id}, 'qty', this.value)">
                    <button onclick="_cwizRemoveStockRow(${row.id})" style="width:auto; padding:6px 10px; background:transparent; border:1px solid var(--danger); color:var(--danger); border-radius:6px; font-size:13px;">✕</button>
                </div>
                <div id="cwiz-stock-msg-${row.id}" style="color:var(--danger); font-size:11px; padding-left:2px; display:${issue ? 'block' : 'none'};">${issue ? '⚠️ ' + issue : ''}</div>
            </div>
        `;
    });

    // Outside-purchase rows
    const outsideContainer = document.getElementById('cwiz-outside-rows');
    const outsideEmpty     = document.getElementById('cwiz-outside-empty');
    outsideContainer.innerHTML = '';
    outsideEmpty.style.display = _cwizOutsideRows.length === 0 ? 'block' : 'none';

    _cwizOutsideRows.forEach(row => {
        outsideContainer.innerHTML += `
            <div class="cwiz-row" style="display:flex; gap:6px; align-items:center;">
                <input type="text" value="${row.name}" placeholder="${T('ph-cwiz-outside-name')}" style="flex:2; margin:0; font-size:13px; padding:8px 10px;" oninput="_cwizUpdateOutsideRow(${row.id}, 'name', this.value)">
                <input type="number" value="${row.price}" min="0" step="0.01" placeholder="${T('ph-cwiz-outside-cost')}" style="flex:1; margin:0; font-size:13px; padding:8px 10px;" oninput="_cwizUpdateOutsideRow(${row.id}, 'price', this.value)">
                <button onclick="_cwizRemoveOutsideRow(${row.id})" style="width:auto; padding:6px 10px; background:transparent; border:1px solid var(--danger); color:var(--danger); border-radius:6px; font-size:13px;">✕</button>
            </div>
        `;
    });
}

function cwizAddStockRow() {
    _cwizStockRows.push({ id: ++_cwizRowSeq, key: '', qty: 1 });
    _renderCwizRows();
    cwizUpdateCostBar();
}

function cwizAddOutsideRow() {
    _cwizOutsideRows.push({ id: ++_cwizRowSeq, name: '', price: 0 });
    _renderCwizRows();
    cwizUpdateCostBar();
}

// Returns a warning string if `row` currently asks for more of a traceable
// menu item than remains in stock, or null if it's fine. Single source of
// truth for both the live wizard UI (below) and the final cwizConfirm()
// safety-net check, so they can never disagree.
function _cwizStockRowIssue(row) {
    if (!row.key || !DRINKS_MENU[row.key]) return null;
    if (!stockTraceable[row.key]) return null;
    const available = stockLevels[row.key] || 0;
    if ((row.qty || 0) > available) {
        return T('cwiz-stock-issue')
            .replace('{name}', DRINKS_MENU[row.key].name)
            .replace('{avail}', available)
            .replace('{qty}', row.qty);
    }
    return null;
}

function _cwizUpdateStockRow(id, field, value) {
    const row = _cwizStockRows.find(r => r.id === id);
    if (!row) return;
    row[field] = field === 'qty' ? (parseFloat(value) || 0) : value;

    if (field === 'key') {
        // Which item is selected changed — safe (and needed) to fully
        // re-render this row, since the warning text depends on it.
        _renderCwizRows();
    } else {
        // Quantity changed via typing — update just this row's warning and
        // border in place, on every keystroke, without wiping the input
        // (a full re-render here would steal focus mid-keystroke).
        const issue   = _cwizStockRowIssue(row);
        const msgEl   = document.getElementById(`cwiz-stock-msg-${id}`);
        const inputEl = document.getElementById(`cwiz-stock-qty-${id}`);
        if (msgEl) {
            msgEl.style.display = issue ? 'block' : 'none';
            msgEl.innerText = issue ? `⚠️ ${issue}` : '';
        }
        if (inputEl) inputEl.style.borderColor = issue ? 'var(--danger)' : '';
    }

    cwizUpdateCostBar();
}

function _cwizUpdateOutsideRow(id, field, value) {
    const row = _cwizOutsideRows.find(r => r.id === id);
    if (!row) return;
    row[field] = field === 'price' ? (parseFloat(value) || 0) : value;
    cwizUpdateCostBar();
}

function _cwizRemoveStockRow(id) {
    _cwizStockRows = _cwizStockRows.filter(r => r.id !== id);
    _renderCwizRows();
    cwizUpdateCostBar();
}

function _cwizRemoveOutsideRow(id) {
    _cwizOutsideRows = _cwizOutsideRows.filter(r => r.id !== id);
    _renderCwizRows();
    cwizUpdateCostBar();
}

function cwizUpdateCostBar() {
    let compTotal = 0;
    _cwizStockRows.forEach(row => {
        if (row.key && DRINKS_MENU[row.key]) compTotal += DRINKS_MENU[row.key].price * (row.qty || 0);
    });
    _cwizOutsideRows.forEach(row => {
        compTotal += row.price || 0;
    });

    const sellPrice = parseFloat(document.getElementById('cwiz-price').value) || 0;

    document.getElementById('cwiz-comp-total').innerText   = compTotal.toFixed(2) + ' EGP';
    document.getElementById('cwiz-sell-display').innerText = sellPrice.toFixed(2) + ' EGP';

    document.getElementById('cwiz-warning').style.display = (sellPrice < compTotal) ? 'block' : 'none';

    // Live stock guard: recomputed on every click/keystroke so "Add to
    // Order" is blocked the instant a selected component doesn't have
    // enough stock left — instead of only catching it after confirming.
    const hasStockIssue = _cwizStockRows.some(row => !!_cwizStockRowIssue(row));
    const stockWarningEl = document.getElementById('cwiz-stock-warning');
    if (stockWarningEl) stockWarningEl.style.display = hasStockIssue ? 'block' : 'none';

    const confirmBtn = document.getElementById('cwiz-confirm-btn');
    if (confirmBtn) {
        confirmBtn.disabled = hasStockIssue;
        confirmBtn.style.opacity = hasStockIssue ? '0.4' : '1';
        confirmBtn.style.cursor = hasStockIssue ? 'not-allowed' : 'pointer';
    }
}

async function cwizConfirm() {
    const name  = document.getElementById('cwiz-name').value.trim();
    const price = parseFloat(document.getElementById('cwiz-price').value);

    if (!name) return customAlert('Please enter an item name.', 'Missing Field');
    if (isNaN(price) || price < 0) return customAlert('Please enter a valid selling price.', 'Missing Field');

    // Validate stock availability for any "from our stock" rows before touching anything
    for (let row of _cwizStockRows) {
        if (!row.key || !DRINKS_MENU[row.key]) continue;
        if (stockTraceable[row.key]) {
            const available = stockLevels[row.key] || 0;
            if ((row.qty || 0) > available) {
                return customAlert(`${DRINKS_MENU[row.key].name} is out of stock (${available} pcs remaining, need ${row.qty}).`, 'Out of Stock');
            }
        }
    }

    // Deduct stock for traceable menu items used as components
    const { dateStr, timeStr, user } = stockNow();
    let stockChanged = false;
    const consumedComponents = [];
    _cwizStockRows.forEach(row => {
        if (!row.key || !DRINKS_MENU[row.key] || !stockTraceable[row.key] || !row.qty) return;
        const before = stockLevels[row.key] || 0;
        stockLevels[row.key] = Math.max(0, before - row.qty);
        stockAdjustments.push({
            id: Date.now() + Math.random(),
            date: dateStr,
            time: timeStr,
            itemKey: row.key,
            itemName: stockItemName(row.key),
            qtyDeducted: row.qty,
            reason: `Custom item: ${name}`,
            stockBefore: before,
            stockAfter: stockLevels[row.key],
            loggedBy: user
        });
        consumedComponents.push({ key: row.key, qty: row.qty });
        stockChanged = true;
    });
    if (stockChanged) saveStockState();

    // Remember exactly what was deducted so removeCustomItem()/
    // removeSharedCustomItem() can give it back if this item is deleted
    // before checkout.
    const newItem = { id: Date.now(), name, price, stockComponents: consumedComponents };

    // Outside-purchased components ("From Outside" rows — not in our
    // stock, no stockLevels impact) represent real cash the business just
    // spent to buy something in order to make this item. That cost was
    // previously only shown in the wizard's live cost-preview bar and
    // never actually logged anywhere — meaning it silently never showed
    // up in Finance/Expenses at all. Log it now as an Expense, the same
    // way 12_stock.js's logPurchase() auto-logs a stock purchase. This is
    // logged once, at creation time, regardless of whether the custom
    // item is later removed before checkout — the money was already
    // spent outside either way.
    const outsideCost = _cwizOutsideRows.reduce((sum, row) => sum + (row.price || 0), 0);
    if (outsideCost > 0) {
        const outsideBreakdown = _cwizOutsideRows
            .filter(row => row.price)
            .map(row => `${row.name || 'Unnamed item'} (${row.price} EGP)`)
            .join(', ');
        await saveFinanceRecord('Expense', outsideCost, `Outside Purchase for Custom Item "${name}" — ${outsideBreakdown}`);
    }

    if (_cwizContext === 'shared') {
        const table = sharedTables[currentSharedTableId];
        const person = table ? table.occupants.find(p => p.id === currentSharedPersonId) : null;
        if (!person) { cwizClose(); return; }
        if (!Array.isArray(person.customExtras)) person.customExtras = [];
        person.customExtras.push(newItem);
        if (typeof _persistSharedTable === 'function') await _persistSharedTable(currentSharedTableId);
        renderSharedDrinksList();
        if (currentZone === 'shared') renderSharedSpace();
    } else {
        const sess = sessions[currentDrinksSessionId];
        if (!sess) { cwizClose(); return; }
        if (!Array.isArray(sess.customExtras)) sess.customExtras = [];
        sess.customExtras.push(newItem);
        await db.sessions.update(currentDrinksSessionId, { custom_extras: sess.customExtras, updated_at: new Date().toISOString() });
        renderDrinksList();
        if (currentZone === 'cafe') updateUI();
    }

    cwizClose();
}