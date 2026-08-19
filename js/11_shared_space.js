// ═══════════════════════════════════════════════════════
// MODULE: 11_shared_space.js
// Lines 1750–2031 of original script.js
// ═══════════════════════════════════════════════════════

// --- SHARED SPACE LOGIC ---
let SHARED_HOURLY_RATE = parseFloat(localStorage.getItem('pricing_shared')) || 25;
// Data store for shared tables. Structure: { tableId: { occupants: [] } }
let sharedTables = {
    'shared-1': { name: 'Shared Table 1', occupants: [] },
    'shared-2': { name: 'Shared Table 2', occupants: [] }
};

// Set by checkoutPerson() right when the receipt is built, and consumed by
// confirmPersonCheckout() so the itemized time/drinks/custom breakdown
// shown on the receipt survives into the saved finance record — otherwise
// "View Details" in the Finance tab has nothing but a one-line summary.
let pendingPersonCheckout = null;

// ── Dual-write helper (Multi-Device Sync plan, Phase 1) ───────────────
// Persists the current in-memory state of one shared table to Dexie.
// Centralized here (rather than duplicating db.shared_tables.put(...) at
// every mutation site across 11_shared_space.js/08_drinks.js/
// 16_pending_checkout.js) so the persisted shape can never drift from the
// in-memory shape. Call this immediately after any mutation to
// sharedTables[tableId], per the existing dual-write convention
// (memory first, then Dexie).
async function _persistSharedTable(tableId) {
    const table = sharedTables[tableId];
    if (!table) return;
    await db.shared_tables.put({
        id: tableId,
        name: table.name,
        occupants: table.occupants,
        updatedAt: new Date().toISOString()
    });
}

// 1. UI Rendering
function renderSharedSpace() {
    const grid = document.getElementById('console-grid-container');
    grid.innerHTML = ''; 
    
    Object.keys(sharedTables).forEach(tableId => {
        const table = sharedTables[tableId];
        
        let occupantsHtml = '';
        table.occupants.forEach(person => {
            const timeDiff = Date.now() - person.startTime;
            const hours = timeDiff / (1000 * 60 * 60);
            const cost = (hours * SHARED_HOURLY_RATE).toFixed(2);
            
            // Format time string (HH:MM)
            const m = Math.floor(timeDiff / 60000);
            const timeStr = `${Math.floor(m / 60)}h ${m % 60}m`;

            occupantsHtml += `
                <div class="occupant-row">
                    <div class="occupant-info">
                        <span class="occupant-name">${person.name}</span>
                        <span class="occupant-stats" id="shared-stats-${person.id}">⏱ ${timeStr} | 💰 ${cost} EGP</span>
                        <span class="occupant-stats">🥤 Extras: ${person.drinks.length || Object.keys(person.drinks).filter(k => person.drinks[k] > 0).length} items${Array.isArray(person.customExtras) && person.customExtras.length > 0 ? ' + ' + person.customExtras.length + ' custom' : ''}</span>
                    </div>
                    <div class="occupant-actions">
                        <button class="btn-small btn-blue" onclick="openDrinksForPerson('${tableId}', '${person.id}')">+ Drink</button>
                        <button class="btn-small btn-danger" onclick="checkoutPerson('${tableId}', '${person.id}')">Checkout</button>
                    </div>
                </div>
            `;
        });

        grid.innerHTML += `
            <div class="console-card">
                <div class="console-header">
                    <h3 class="console-title">${table.name}</h3>
                    <span class="status-badge status-playing">👥 ${table.occupants.length} Active</span>
                </div>
                <div style="margin-bottom: 15px;">
                    ${occupantsHtml || '<p style="color:var(--text-muted);font-size:13px;text-align:center;">No one here yet.</p>'}
                </div>
                <button class="btn-success" onclick="openAddPersonModal('${tableId}')">+ Add Person</button>
            </div>
        `;
    });
}

// 2. Add Person Logic
function openAddPersonModal(tableId) {
    document.getElementById('shared-target-id').value = tableId;
    document.getElementById('new-person-name').value = '';
    const rateEl = document.getElementById('add-person-rate');
    if (rateEl) rateEl.innerText = SHARED_HOURLY_RATE;
    document.getElementById('add-person-modal').style.display = 'flex';
}

async function confirmAddPerson() {
    const tableId = document.getElementById('shared-target-id').value;
    const name = document.getElementById('new-person-name').value;
    if (!name) return alert('Please enter a name');

    sharedTables[tableId].occupants.push({
        id: 'user_' + Date.now(),
        name: name,
        startTime: Date.now(),
        drinks: {},
        customExtras: []
    });
    await _persistSharedTable(tableId);

    document.getElementById('add-person-modal').style.display = 'none';
    if(currentZone === 'shared') renderSharedSpace(); 
}

function openDrinksForPerson(tableId, personId) {
    currentDrinksSessionId = null; // Disable console logic
    currentSharedTableId = tableId;
    currentSharedPersonId = personId;

    const person = sharedTables[tableId].occupants.find(p => p.id === personId);
    
    // Ensure person has a drinks object, not an array, to match the Lounge logic
    if (Array.isArray(person.drinks)) {
        person.drinks = {}; 
    }

    // Ensure customExtras array exists
    if (!Array.isArray(person.customExtras)) {
        person.customExtras = [];
    }

    // Tell the custom item wizard we are in shared context
    if (typeof _cwizContext !== 'undefined') _cwizContext = 'shared';

    document.getElementById('drinks-console-name').innerText = `Managing Extras for: ${person.name}`;
    
    renderSharedDrinksList();
    document.getElementById('drinks-modal').style.display = 'flex';
}

function renderSharedDrinksList() {
    const person = sharedTables[currentSharedTableId].occupants.find(p => p.id === currentSharedPersonId);
    const listDiv = document.getElementById('drinks-list');
    listDiv.innerHTML = '';

    for (let key in DRINKS_MENU) {
        const item = DRINKS_MENU[key];
        const qty = person.drinks[key] || 0;
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
                    <button class="qty-btn" onclick="updateSharedDrinkQty('${key}', -1)">-</button>
                    <span class="qty-display">${qty}</span>
                    <button class="qty-btn" onclick="updateSharedDrinkQty('${key}', 1)" ${outOfStock ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>+</button>
                </div>
            </div>
        `;
    }

    // Ensure customExtras is always an array
    if (!Array.isArray(person.customExtras)) person.customExtras = [];

    const customDiv = document.getElementById('custom-items-list');
    customDiv.innerHTML = '';
    if (person.customExtras.length === 0) {
        customDiv.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 13px; margin-top: 10px;">No custom items added.</div>`;
    } else {
        person.customExtras.forEach((item, index) => {
            customDiv.innerHTML += `
                <div class="custom-item-badge">
                    <span>${item.name} <span style="color: var(--text-muted); margin-left: 10px;">${item.price} EGP</span></span>
                    <button class="delete-btn" onclick="removeSharedCustomItem(${index})">✕</button>
                </div>
            `;
        });
    }

    if (typeof updateDrinksPreview === 'function') updateDrinksPreview();
}

async function updateSharedDrinkQty(drinkKey, delta) {
    const person = sharedTables[currentSharedTableId].occupants.find(p => p.id === currentSharedPersonId);
    if (!person.drinks[drinkKey]) person.drinks[drinkKey] = 0;

    if (delta > 0) {
        // Same recipe-aware stock guard used for console/VIP/cafe sessions
        // (08_drinks.js) — block the "+" the instant stock hits 0, instead of
        // only catching it at checkout.
        if (typeof checkDrinkAvailability === 'function') {
            const check = checkDrinkAvailability(drinkKey, 1);
            if (!check.ok) {
                customAlert(check.message, T('al-title-out-of-stock'));
                return;
            }
        }
        // Reserve stock the instant it's added, so levels/badges update live.
        if (typeof reserveStockForItem === 'function') reserveStockForItem(drinkKey, 1);
    } else if (delta < 0 && person.drinks[drinkKey] > 0) {
        // Give the reserved stock back the instant a unit is removed.
        if (typeof releaseStockForItem === 'function') releaseStockForItem(drinkKey, 1);
    }

    let newQty = person.drinks[drinkKey] + delta;
    if (newQty < 0) newQty = 0;
    
    person.drinks[drinkKey] = newQty;
    await _persistSharedTable(currentSharedTableId);
    
    // Re-render immediately on every click so the OUT badges, quantities,
    // and the background shared-space grid all stay in sync in real time.
    renderSharedDrinksList();
    if(currentZone === 'shared') renderSharedSpace(); 
}

// 3. Checkout Person Logic
function checkoutPerson(tableId, personId) {
    const person = sharedTables[tableId].occupants.find(p => p.id === personId);
    if(!person) return;

    const timeDiff = Date.now() - person.startTime;
    const hours = timeDiff / (1000 * 60 * 60);
    const timeCost = hours * SHARED_HOURLY_RATE;
    
    // Format the time into HH:MM:SS
    const h = Math.floor(timeDiff / 3600000);
    const m = Math.floor((timeDiff % 3600000) / 60000);
    const s = Math.floor((timeDiff % 60000) / 1000);
    const formattedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    // Shared helper (08_drinks.js) — same logic used everywhere else drinks
    // + custom extras get totaled, so this always matches the receipt.
    const extras = computeSessionExtras(person);

    document.getElementById('chk-target-shared-id').value = tableId;
    document.getElementById('chk-target-person-id').value = personId;
    
    document.getElementById('chk-person-name').innerText = person.name;
    document.getElementById('chk-person-time-cost').innerText = timeCost.toFixed(2) + " EGP";
    document.getElementById('chk-person-time').innerText = formattedTime;
    
    document.getElementById('chk-person-drinks-list').innerHTML = extras.drinksHtml;
    let baseTotal = timeCost + extras.extrasTotal;
    // Save the base total so the custom input function can access it
    document.getElementById('chk-person-total').setAttribute('data-base-total', baseTotal);
    document.getElementById('chk-person-total').innerText = baseTotal.toFixed(2) + ' EGP';

    // Clear the custom fields for the new person
    document.getElementById('chk-person-custom-name').value = '';
    document.getElementById('chk-person-custom-price').value = '';

    // Stash the itemized breakdown so confirmPersonCheckout() can save it
    // into the finance record — this is what makes "View Details" in the
    // Finance tab show time played + each drink/custom item, instead of
    // just the bare table/person name.
    pendingPersonCheckout = {
        tableId,
        personId,
        personName: person.name,
        tableName: sharedTables[tableId].name,
        timeCost,
        formattedTime,
        extrasTotal: extras.extrasTotal,
        extrasBreakdown: extras.extrasBreakdown
    };

    document.getElementById('checkout-person-modal').style.display = 'flex';
}

async function confirmPersonCheckout() {
    const tableId = document.getElementById('chk-target-shared-id').value;
    const personId = document.getElementById('chk-target-person-id').value;
    
    // Grab the name and total string (e.g., "25.00 EGP") from the UI
    const personName = document.getElementById('chk-person-name').innerText;
    const totalText = document.getElementById('chk-person-total').innerText;
    
    // Convert the total string into a pure number so the database can do math with it
    const amountToCharge = parseFloat(totalText);
    const tableName = sharedTables[tableId].name;
    
    // Remove person from the table array
    sharedTables[tableId].occupants = sharedTables[tableId].occupants.filter(p => p.id !== personId);
    await _persistSharedTable(tableId);
    
    // --- DATABASE & FINANCE SAVE ---
    // We only log it if the amount is greater than 0
    if (amountToCharge > 0) {
        const customName = document.getElementById('chk-person-custom-name').value;
        const customPrice = parseFloat(document.getElementById('chk-person-custom-price').value) || 0;

        const info = pendingPersonCheckout;

        let description = `Shared Space - ${tableName} (${personName})`;
        let details = [];

        // Time played + time cost, itemized drinks/custom items with qty —
        // this is what makes "View Details" in Finance show the same
        // breakdown the receipt showed before confirming.
        if (info && info.timeCost > 0) {
            details.push(`Time: ${info.timeCost.toFixed(2)}EGP (${info.formattedTime})`);
        }
        if (info && info.extrasTotal > 0) {
            const itemsLabel = (info.extrasBreakdown && info.extrasBreakdown.length)
                ? `[${info.extrasBreakdown.join(', ')}] `
                : '';
            details.push(`Drinks: ${itemsLabel}(Total Extras: ${info.extrasTotal.toFixed(2)}EGP)`);
        }
        if (customPrice > 0) {
            details.push(`Custom: ${customName || 'Item'} (${customPrice}EGP)`);
        }

        if (details.length > 0) {
            description += ` | ${details.join(' | ')}`;
        }
    
        await saveFinanceRecord('Income', amountToCharge, description); 
    }

    pendingPersonCheckout = null;

    // Close modal and refresh UI
    document.getElementById('checkout-person-modal').style.display = 'none';
    if(currentZone === 'shared') renderSharedSpace(); 
    
    // Optional: Give the user a success message just like your main PlayStations do
    customAlert(Tf('al-person-checkout-success', { name: personName }), T('al-title-success'));
}

function updatePersonCheckoutTotal() {
    let baseTotal = parseFloat(document.getElementById('chk-person-total').getAttribute('data-base-total')) || 0;
    let customPrice = parseFloat(document.getElementById('chk-person-custom-price').value) || 0;
    
    let finalTotal = baseTotal + customPrice;
    document.getElementById('chk-person-total').innerText = finalTotal.toFixed(2) + ' EGP';
}

// CSV Data Engine for Client Requests
// CSV Data Engine for Client Requests (Combined String)
async function exportClientsDataToCSV() {
    try {
        let data = await db.games_history.toArray(); 
        if (data.length === 0) return customAlert(T('al-no-client-data'), T('al-title-export-failed'));

        // Headers set up for the exact database columns
        const headers = ['id', 'date', 'time', 'type', 'games_and_phone', 'logged_by'].join(',');

        const rows = data.map(row => {
            // Grab the raw string exactly as it is in the database
            const rawGamesString = row.games || '';

            return [
                row.id, 
                `"\t${row.date}"`, 
                `"\t${row.time}"`,
                `"${row.type}"`,
                // We keep the string together and just make sure any internal quotes are escaped
                `"${rawGamesString.replace(/"/g, '""')}"`, 
                `"${row.logged_by || 'Unknown'}"`
            ].join(',');
        });

        const csvContent = [headers, ...rows].join('\n');
        
        if (window.FlutterFinanceBridge) {
            window.FlutterFinanceBridge.postMessage(csvContent);
        } else {
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `client_database_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (error) {
        console.error("Export failed:", error);
        customAlert(T('al-export-client-failed'), T('al-title-error'));
    }
}