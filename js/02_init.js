// ═══════════════════════════════════════════════════════
// MODULE: 02_init.js
// Lines 84–148 of original script.js
// ═══════════════════════════════════════════════════════

// ── Splash screen controller ──────────────────────────
const Splash = (() => {
    let _bar   = null;
    let _label = null;
    let _el    = null;

    const STEPS = [
        { pct: 15, text: 'Connecting to database…'  },
        { pct: 35, text: 'Loading sessions…'         },
        { pct: 60, text: 'Restoring financial data…' },
        { pct: 80, text: 'Building workspace…'       },
        { pct: 100, text: 'Ready!'                   },
    ];

    function _get() {
        if (!_el)    _el    = document.getElementById('splash-screen');
        if (!_bar)   _bar   = document.getElementById('splash-loader-bar');
        if (!_label) _label = document.getElementById('splash-loader-label');
    }

    function step(index) {
        _get();
        if (!_bar || !_label || index >= STEPS.length) return;
        const s = STEPS[index];
        _bar.style.width   = s.pct + '%';
        _label.textContent = s.text;
    }

    function dismiss() {
        _get();
        if (!_el) return;
        // Small delay so the "Ready!" state is visible for a beat
        setTimeout(() => {
            _el.classList.add('splash-hiding');
            // Remove from DOM after animation completes
            _el.addEventListener('animationend', () => {
                _el.style.display = 'none';
            }, { once: true });
        }, 480);
    }

    return { step, dismiss };
})();


function updatePricingDisplays() {
    document.getElementById('display-rate-single').innerText = RATE_SINGLE;
    document.getElementById('display-rate-multi').innerText = RATE_MULTI;
    if(document.getElementById('display-rate-iptv')) document.getElementById('display-rate-iptv').innerText = RATE_LOUNGE_IPTV;
    if(document.getElementById('display-rate-shared')) document.getElementById('display-rate-shared').innerText = SHARED_HOURLY_RATE;
    if(document.getElementById('add-person-rate')) document.getElementById('add-person-rate').innerText = SHARED_HOURLY_RATE;

    // New VIP category displays (top price bar, VIP zone)
    if(document.getElementById('display-rate-vip-ps4')) document.getElementById('display-rate-vip-ps4').innerText = RATE_VIP_PS4;
    if(document.getElementById('display-rate-vip-ps5')) document.getElementById('display-rate-vip-ps5').innerText = RATE_VIP_PS5;
    if(document.getElementById('display-rate-vip-iptv')) document.getElementById('display-rate-vip-iptv').innerText = RATE_VIP_IPTV;

    // Update the PS5 Lounge text dynamically
    const ps5Text = document.getElementById('lounge-rate-ps5');
    if (ps5Text) ps5Text.innerText = `(+ ${RATE_PS5_EXTRA}/hr for PS5)`;

    document.getElementById('config-single').value = RATE_SINGLE;
    document.getElementById('config-multi').value = RATE_MULTI;
    if(document.getElementById('config-iptv')) document.getElementById('config-iptv').value = RATE_LOUNGE_IPTV;
    if(document.getElementById('config-shared')) document.getElementById('config-shared').value = SHARED_HOURLY_RATE;
    if(document.getElementById('config-ps5-extra')) document.getElementById('config-ps5-extra').value = RATE_PS5_EXTRA;

    // New VIP category admin inputs
    if(document.getElementById('config-vip-ps4')) document.getElementById('config-vip-ps4').value = RATE_VIP_PS4;
    if(document.getElementById('config-vip-ps5')) document.getElementById('config-vip-ps5').value = RATE_VIP_PS5;
    if(document.getElementById('config-vip-iptv')) document.getElementById('config-vip-iptv').value = RATE_VIP_IPTV;
}

async function loadDataFromLocal() {
    // step 0 → 15% "Connecting to database…"
    Splash.step(0);
    await db.open().catch(function (err) {
        console.error("Failed to open DB: " + err.stack || err);
    });

    // step 1 → 35% "Loading sessions…"
    Splash.step(1);
    const sessionData = await db.sessions.toArray();
    const _sessionIdsInDb = new Set();
    if (sessionData && sessionData.length > 0) {
        sessionData.forEach(row => {
            _sessionIdsInDb.add(row.id);
            sessions[row.id] = {
                active: row.active,
                mode: row.mode,
                startTime: row.start_time,
                presetMins: row.preset_mins,
                currentPlayerMode: row.current_player_mode,
                segments: row.segments || [],
                drinks: row.drinks || {}, 
                customExtras: row.custom_extras || [],
                mergedTablesCount: row.merged_tables_count || 0
            };
        });
    }

    ALL_ENTITIES.forEach(c => {
        if(!sessions[c.id]) {
            sessions[c.id] = { 
                active: false, mode: null, startTime: null, presetMins: 0, 
                currentPlayerMode: 'single', segments: [], 
                drinks: {}, customExtras: [], mergedTablesCount: 0
            };
        }
    });

    // ── Sync fix: give every entity a real Dexie row from first boot ──────
    // Cafe tables (and, defensively, anything else that hasn't had a
    // "start session" moment) never got a row created via db.sessions.put()
    // — but every later mutation site (updateDrinkQty, removeCustomItem,
    // cwizConfirm, _doMigration, resetConsole/checkout) only ever calls
    // db.sessions.update(id, ...). Dexie's update() silently no-ops when
    // the row doesn't exist yet: no error, no row created, no sync hook
    // fired, nothing pushed to Supabase. That was the root cause of drinks
    // and table state added to a cafe table never reaching other devices,
    // even though the in-memory UI on the device that added them looked
    // correct. Seed a placeholder row here for every entity Dexie doesn't
    // already have — stamped with the epoch, not "now", so it can never
    // win a Last-Write-Wins conflict against any genuine local or remote
    // update. It exists purely so every later .update() call has a row to
    // act on.
    for (const c of ALL_ENTITIES) {
        if (_sessionIdsInDb.has(c.id)) continue;
        const s = sessions[c.id];
        try {
            await db.sessions.put({
                id: c.id,
                active: s.active,
                mode: s.mode,
                start_time: s.startTime,
                preset_mins: s.presetMins,
                current_player_mode: s.currentPlayerMode,
                segments: s.segments,
                drinks: s.drinks,
                custom_extras: s.customExtras,
                merged_tables_count: s.mergedTablesCount,
                updated_at: new Date(0).toISOString()
            });
        } catch (err) {
            console.error(`Failed to seed Dexie session row for entity ${c.id}:`, err);
        }
    }

    // step 2 → 60% "Restoring financial data…"
    Splash.step(2);
    const finData = await db.financial_data.toArray();
    if (finData && finData.length > 0) {
        financialData = finData.map(row => ({
            id: row.id, date: row.date, time: row.time, type: row.type, 
            amount: row.amount, description: row.description, user: row.logged_by,
            linkedId: row.linked_id, notes: row.notes || []
        }));
    }

    const gData = await db.games_history.toArray();
    if (gData && gData.length > 0) {
        gamesData = gData;
    }

    const nData = await db.notes.toArray();
    if (nData && nData.length > 0) {
        notesData = nData;
    }

    const eData = await db.expense_edit_log.toArray();
    if (eData && eData.length > 0) {
        expenseEditLog = eData;
    }

    const pcData = await db.pending_checkouts.toArray();
    if (pcData && pcData.length > 0) {
        pendingCheckoutsQueue = pcData;
    }

    const pclData = await db.pending_checkout_log.toArray();
    if (pclData && pclData.length > 0) {
        pendingCheckoutLog = pclData;
    }

    // Shared Space persistence fix (Multi-Device Sync plan, Phase 1):
    // sharedTables previously lived only in memory and reset on every
    // reload. Hydrate any persisted rows over the in-memory defaults —
    // but only overwrite tables that actually have a saved row, so a
    // fresh/first-run DB still falls back to the two default tables
    // declared in 11_shared_space.js.
    const stData = await db.shared_tables.toArray();
    if (stData && stData.length > 0) {
        stData.forEach(row => {
            sharedTables[row.id] = {
                name: row.name,
                occupants: row.occupants || []
            };
        });
    }

    // ── Full-app sync scope: migrate localStorage-only stores into Dexie ──
    // Each store below previously had NO Dexie presence at all. On a
    // device's first run after this update, Dexie will be empty for
    // these stores — in that case, seed Dexie once from whatever this
    // device already had in localStorage (loaded into the in-memory
    // variables at file-load time in 01_config.js/12_stock.js/
    // 13_employees.js). On every later boot, Dexie already has the
    // synced/merged data, so it wins and overwrites the in-memory
    // defaults — this is what lets one device's edits reach another.
    const empData = await db.employees.toArray();
    if (empData && empData.length > 0) {
        employees = empData;
    } else if (employees.length > 0) {
        await db.employees.bulkPut(employees);
    }

    const puData = await db.personal_use_log.toArray();
    if (puData && puData.length > 0) {
        personalUseLog = puData;
    } else if (personalUseLog.length > 0) {
        await db.personal_use_log.bulkPut(personalUseLog);
    }

    const lhData = await db.login_history.toArray();
    if (lhData && lhData.length > 0) {
        loginHistory = lhData;
    } else if (loginHistory.length > 0) {
        await db.login_history.bulkPut(loginHistory);
    }

    const settingsRow = await db.app_settings.get('config');
    if (settingsRow) {
        RATE_SINGLE = settingsRow.pricing.single;
        RATE_MULTI = settingsRow.pricing.multi;
        RATE_LOUNGE_IPTV = settingsRow.pricing.loungeIptv;
        if (typeof SHARED_HOURLY_RATE !== 'undefined' && settingsRow.pricing.shared != null) {
            SHARED_HOURLY_RATE = settingsRow.pricing.shared;
        }
        RATE_PS5_EXTRA = settingsRow.pricing.ps5Extra;
        RATE_VIP_PS4 = settingsRow.pricing.vipPs4;
        RATE_VIP_PS5 = settingsRow.pricing.vipPs5;
        RATE_VIP_IPTV = settingsRow.pricing.vipIptv;
        DRINKS_MENU = settingsRow.drinksMenu || DRINKS_MENU;
        notebookUsers = settingsRow.notebookUsers || notebookUsers;
        // Pricing inputs/displays were already painted once from the
        // localStorage defaults at window.onload, before this hydration
        // ran — repaint now so a value pulled in from another device
        // actually shows up instead of silently sitting in memory only.
        updatePricingDisplays();
    } else {
        await saveAppSettingsToDexie();
    }

    const stockRow = await db.stock_data.get('stock');
    if (stockRow) {
        stockTraceable = stockRow.stockTraceable || {};
        stockLevels = stockRow.stockLevels || {};
        stockPurchases = stockRow.stockPurchases || [];
        stockAdjustments = stockRow.stockAdjustments || [];
        stockComponents = stockRow.stockComponents || {};
    } else if (Object.keys(stockTraceable).length > 0 || stockPurchases.length > 0) {
        await saveStockState();
    }

    // step 3 → 80% "Building workspace…"
    Splash.step(3);
    // Small pause so the bar visibly reaches 80% before finishing
    await new Promise(r => setTimeout(r, 300));

    // step 4 → 100% "Ready!"
    Splash.step(4);
    // Coordinate with initializeAuthenticatedSession:
    // If Flutter auth already arrived, dismiss immediately.
    // Otherwise set flag so the auth handler triggers dismiss.
    window._splashDataReady = true;
    if (window._splashAuthPending) {
        Splash.dismiss();
    }
}