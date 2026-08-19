// ═══════════════════════════════════════════════════════
// MODULE: 17_sync.js
// Multi-Device Real-Time Sync — Phases 2, 3 & 4
// (Offline indicator, Supabase connection, Device Presence)
// Push/pull data sync + conflict resolution (Phase 6) is NOT in this
// file yet — that lands store-by-store in a follow-up pass, per the
// Multi-Device Sync plan.
// ═══════════════════════════════════════════════════════

// ── Phase 3: Supabase credentials & client ────────────────────────────
// NOTE: only the anon/publishable key belongs here. Never the
// service_role/secret key — that bypasses Row Level Security and must
// never ship inside a client app.
const SUPABASE_URL = 'https://dxtmluzzjpjgzjztswjf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4dG1sdXp6anBqZ3pqenRzd2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQyODU5NDksImV4cCI6MjA5OTg2MTk0OX0.ccb_IC93Q9EWPk5NxULvADtTCkoinI2kPoSf3dHjA6E';

const supabaseClient = (window.supabase && typeof window.supabase.createClient === 'function')
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// IMPORTANT: a top-level `const` in a classic <script> creates a global
// lexical binding, but does NOT become a property of `window` — that's
// a plain-JS quirk (unlike `var`/function declarations, which do).
// 01_config.js's syncAppCredentialsFromSupabase() and the website's
// js/18_web_gate.js both check window.supabaseClient specifically, so
// this explicit assignment is required or those checks always see
// `undefined` and silently no-op (this was the root cause of the
// website's credential/license-device sync never actually running).
window.supabaseClient = supabaseClient;

if (!supabaseClient) {
    console.error('17_sync.js: supabase.js failed to load or is out of date — sync disabled.');
}

// ── Combined connectivity state ────────────────────────────────────────
// navigator.onLine only reflects "has a network interface," not
// "internet actually works" — a WiFi-connected-but-no-internet café
// router would still report true. _reachable is the real signal and is
// only trusted once at least one check has completed.
let _syncState = {
    browserOnline: navigator.onLine,
    reachable: null,      // null = unknown (not checked yet), true/false after first check
    syncing: false        // reserved for Phase 6 — set true while a push/pull is in flight
};

const SYNC_REACHABILITY_INTERVAL_MS = 20000; // 20s — normal cadence once confirmed reachable
const SYNC_REACHABILITY_FAST_RETRY_MS = 3000; // 3s — used while NOT reachable, so reconnect is detected quickly
const SYNC_REACHABILITY_TIMEOUT_MS = 5000;   // 5s

async function _checkSupabaseReachable() {
    if (!supabaseClient) { _syncState.reachable = false; updateSyncIndicator(); return; }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SYNC_REACHABILITY_TIMEOUT_MS);

    try {
        // Trivial query against one of our own tables — this both proves
        // network reachability AND validates the anon key / RLS policy
        // are correct, not just that "some server" responded.
        const { error } = await supabaseClient
            .from('sessions')
            .select('id', { head: true, count: 'exact' })
            .limit(1)
            .abortSignal(controller.signal);

        _syncState.reachable = !error;
        if (error) {
            console.warn('17_sync.js: Supabase reachability check failed:', error.message);
        } else if (typeof syncAppCredentialsFromSupabase === 'function') {
            // Opportunistic — refreshes 01_config.js's cloud-backed
            // credential cache (app_credentials) whenever we confirm the
            // connection is actually up, not just on a fixed timer.
            syncAppCredentialsFromSupabase();
        }
    } catch (err) {
        _syncState.reachable = false;
        console.warn('17_sync.js: Supabase reachability check threw:', err.message || err);
    } finally {
        clearTimeout(timeoutId);
        updateSyncIndicator();
    }
}

function _startReachabilityLoop() {
    // Self-rescheduling rather than a fixed setInterval: while NOT
    // reachable, retry quickly (3s) so a reconnect is noticed fast; once
    // confirmed reachable, fall back to the slower 20s cadence since
    // there's nothing urgent to detect at that point. This replaces
    // relying on the browser's 'online' event for fast detection — that
    // event is well known to be unreliable (fires late or not at all)
    // inside Android/iOS WebViews, which is why reconnects were
    // previously taking up to ~40s (roughly two missed 20s ticks) to be
    // noticed instead of the intended near-immediate response.
    async function _tick() {
        await _checkSupabaseReachable();
        const nextDelay = (_syncState.browserOnline && _syncState.reachable === true)
            ? SYNC_REACHABILITY_INTERVAL_MS
            : SYNC_REACHABILITY_FAST_RETRY_MS;
        setTimeout(_tick, nextDelay);
    }
    _tick();
}

window.addEventListener('online', () => {
    _syncState.browserOnline = true;
    _checkSupabaseReachable(); // re-verify immediately rather than waiting for the next tick
});
window.addEventListener('offline', () => {
    _syncState.browserOnline = false;
    _syncState.reachable = false;
    updateSyncIndicator();
});

// ── Phase 2/7: Header indicator (three states) ─────────────────────────
// offline (red, "!")  /  syncing (amber, pulsing)  /  online-synced (cyan, normal)
function updateSyncIndicator() {
    const icon = document.getElementById('sync-status-icon');
    if (!icon) return;

    const isOnline = _syncState.browserOnline && _syncState.reachable === true;

    icon.style.display = 'inline-block';

    if (!isOnline) {
        icon.textContent = '!';
        icon.style.color = 'var(--danger, #ff5c5c)';
        icon.style.animation = 'none';
        icon.title = T('sync-offline-tooltip');
    } else if (_syncState.syncing) {
        icon.textContent = '●';
        icon.style.color = 'var(--warning, #f5a623)';
        icon.style.animation = 'sync-pulse 1s ease-in-out infinite';
        icon.title = T('sync-syncing-tooltip');
    } else {
        icon.textContent = '●';
        icon.style.color = 'var(--accent-cyan)';
        icon.style.animation = 'none';
        icon.title = T('sync-online-tooltip');
    }
}

// Minimal keyframes for the "syncing" pulse — injected once since there's
// no style.css in scope for this module to append to.
(function _injectSyncPulseKeyframes() {
    const style = document.createElement('style');
    style.textContent = '@keyframes sync-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }';
    document.head.appendChild(style);
})();

// Wrap updateUI() the same way 16_pending_checkout.js wraps it for
// _pcSyncLockIconVisibility(), since buildConsoles() only reruns on zone
// switch and this indicator needs to reflect state on every tick.
(function _wrapUpdateUIForSyncIndicator() {
    const _origUpdateUI = window.updateUI;
    if (typeof _origUpdateUI !== 'function') return;
    window.updateUI = function() {
        _origUpdateUI.apply(this, arguments);
        updateSyncIndicator();
    };
})();

// ── Phase 4: Device identity & Presence ────────────────────────────────
let _presenceChannel = null;

function _updateDeviceCountBadge(count) {
    const badge = document.getElementById('sync-device-count');
    if (!badge) return;
    if (count > 1) {
        badge.textContent = `(${count})`;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function _joinPresenceChannel() {
    if (!supabaseClient || _presenceChannel) return; // don't double-join on repeated reconnects

    _presenceChannel = supabaseClient.channel('gaming-center-presence', {
        config: { presence: { key: getDeviceId() } }
    });
    _presenceChannel
        .on('presence', { event: 'sync' }, () => {
            const state = _presenceChannel.presenceState();
            _updateDeviceCountBadge(Object.keys(state).length);
        })
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await _presenceChannel.track({
                    device_id: getDeviceId(),
                    online_at: new Date().toISOString()
                });
            }
        });
}

// ═══════════════════════════════════════════════════════
// Phase 6: Push/Pull sync engine + Last-Write-Wins conflict resolution
// ═══════════════════════════════════════════════════════
//
// One generic, config-driven engine for all 13 stores rather than 13
// near-duplicate implementations — a single code path exercised 13 times
// is easier to get right (and keep right) than 13 separate ones.
//
// Design:
//  • PUSH fires off Dexie's own hooks (creating/updating/deleting) — this
//    is why Phase 5's timestamp stamping didn't need a matching "push"
//    call added at every one of those 30+ write sites: every Dexie write
//    to a synced table automatically triggers a push, with no risk of a
//    future write site being added and silently missing the sync hook.
//  • PULL runs once at boot and again on every reconnect, asking Supabase
//    for rows newer than a per-store `sync_last_pulled_<table>` cursor.
//  • LIVE LISTEN subscribes to Postgres Changes per table so another
//    device's write shows up here in ~1s while both are online, not just
//    on the next reconnect.
//  • Conflict resolution compares timestamps; newer wins; a local write
//    that turns out to be newer than what a pull just saw gets pushed
//    back up instead of being overwritten.
//
// Known limitation: catch-up pull is timestamp-based, so it only sees
// rows that changed — a *deletion* that happened entirely while this
// device was offline won't be caught by the pull (the row is just gone
// from Supabase, which looks identical to "never existed"). Live listen
// does catch deletes in real time. In practice the only stores that ever
// delete locally are `notes` and `pending_checkouts`, and both are
// short-lived/soon-resolved records, so the exposure window is small —
// flagging this as a known gap rather than silently leaving it unhandled.

const SYNC_STORE_CONFIG = [
    { table: 'sessions',             singleRowId: null,     tsField: 'updated_at' },
    { table: 'financial_data',       singleRowId: null,     tsField: 'updated_at' },
    { table: 'games_history',        singleRowId: null,     tsField: 'updated_at' },
    { table: 'notes',                singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'expense_edit_log',     singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'pending_checkouts',    singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'pending_checkout_log', singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'shared_tables',        singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'employees',            singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'personal_use_log',     singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'login_history',        singleRowId: null,     tsField: 'updatedAt'  },
    { table: 'app_settings',         singleRowId: 'config', tsField: 'updatedAt'  },
    { table: 'stock_data',           singleRowId: 'stock',  tsField: 'updatedAt'  }
];

const SYNC_CURSOR_PREFIX = 'sync_last_pulled_';

function _syncTimestampOf(cfg, record) {
    if (!record) return 0;
    const v = record[cfg.tsField];
    return v ? new Date(v).getTime() : 0;
}

// One-shot suppression so a Dexie write WE make while applying a pulled/
// remote change doesn't immediately bounce back to Supabase as a
// redundant (harmless but wasteful) push.
const _suppressPush = new Set();
function _suppressKey(table, id) { return table + ':' + String(id); }

// ── Offline write queue ─────────────────────────────────────────────────
// A push attempted while offline is NOT safe to just drop — the catch-up
// pull only asks Supabase "what changed on the server?", which has
// nothing to say about a record that was created/edited entirely on this
// device while offline and never had a remote row to compare against.
// So every push/delete that can't go out right now gets queued here
// (deduped by table+id, last write wins) and flushed the moment this
// device is confirmed reachable again — persisted to localStorage so it
// survives the app being closed while still offline.
const OFFLINE_QUEUE_KEY = 'sync_offline_queue';

function _loadOfflineQueue() {
    try { return JSON.parse(localStorage.getItem(OFFLINE_QUEUE_KEY)) || []; }
    catch (e) { return []; }
}
function _saveOfflineQueue(queue) {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}
function _queueOfflineWrite(table, id, isDelete) {
    const queue = _loadOfflineQueue();
    const idx = queue.findIndex(q => q.table === table && String(q.id) === String(id));
    const entry = { table, id, isDelete: !!isDelete };
    if (idx === -1) queue.push(entry); else queue[idx] = entry;
    _saveOfflineQueue(queue);
}

// ── PUSH ────────────────────────────────────────────────────────────────
async function _pushRecord(table, record) {
    if (!record) return;
    const cfg = SYNC_STORE_CONFIG.find(c => c.table === table);
    if (!cfg || !supabaseClient) return;

    const rowId = cfg.singleRowId || record.id;
    const key = _suppressKey(table, rowId);
    if (_suppressPush.has(key)) { _suppressPush.delete(key); return; }

    if (!(_syncState.browserOnline && _syncState.reachable)) {
        _queueOfflineWrite(table, rowId, false);
        return;
    }

    _syncState.syncing = true; updateSyncIndicator();
    try {
        const { error } = await supabaseClient.from(table).upsert({
            id: String(rowId),
            data: record,
            updated_at: new Date(_syncTimestampOf(cfg, record) || Date.now()).toISOString(),
            updated_by_device: getDeviceId()
        });
        if (error) {
            console.error(`Sync push failed for ${table}:`, error.message);
            _queueOfflineWrite(table, rowId, false); // network blip mid-push — don't lose it, retry later
        }
    } catch (err) {
        console.error(`Sync push threw for ${table}:`, err.message || err);
        _queueOfflineWrite(table, rowId, false);
    } finally {
        _syncState.syncing = false; updateSyncIndicator();
    }
}

async function _pushDeleteRow(table, id) {
    if (!supabaseClient) return;
    if (!(_syncState.browserOnline && _syncState.reachable)) {
        _queueOfflineWrite(table, id, true);
        return;
    }
    try {
        const { error } = await supabaseClient.from(table).delete().eq('id', String(id));
        if (error) {
            console.error(`Sync push-delete failed for ${table}:`, error.message);
            _queueOfflineWrite(table, id, true);
        }
    } catch (err) {
        console.error(`Sync push-delete threw for ${table}:`, err.message || err);
        _queueOfflineWrite(table, id, true);
    }
}

// Flush anything that piled up while offline. Re-reads the CURRENT Dexie
// record at flush time (not a stale snapshot from when it was queued) so
// if a record was edited multiple times while offline, we push its final
// state once — not every intermediate edit.
async function _flushOfflineQueue() {
    if (!(_syncState.browserOnline && _syncState.reachable)) return;
    const queue = _loadOfflineQueue();
    if (queue.length === 0) return;

    _syncState.syncing = true; updateSyncIndicator();
    const stillFailed = [];

    for (const entry of queue) {
        const cfg = SYNC_STORE_CONFIG.find(c => c.table === entry.table);
        if (!cfg) continue; // stale entry from a removed store — drop it

        try {
            if (entry.isDelete) {
                const { error } = await supabaseClient.from(entry.table).delete().eq('id', String(entry.id));
                if (error) throw error;
            } else {
                const rowId = cfg.singleRowId || entry.id;
                const record = await db[entry.table].get(rowId);
                if (record) {
                    const { error } = await supabaseClient.from(entry.table).upsert({
                        id: String(rowId),
                        data: record,
                        updated_at: new Date(_syncTimestampOf(cfg, record) || Date.now()).toISOString(),
                        updated_by_device: getDeviceId()
                    });
                    if (error) throw error;
                }
                // If the record no longer exists locally (deleted again after
                // being queued), there's nothing left to push — just drop it.
            }
        } catch (err) {
            console.error(`Offline queue flush failed for ${entry.table}:${entry.id}:`, err.message || err);
            stillFailed.push(entry); // keep it queued, retry on the next flush
        }
    }

    _saveOfflineQueue(stillFailed);
    _syncState.syncing = false; updateSyncIndicator();
}

function _registerSyncHooks() {
    SYNC_STORE_CONFIG.forEach(cfg => {
        const tbl = db[cfg.table];
        if (!tbl || tbl.__syncHooked) return;
        tbl.__syncHooked = true;

        tbl.hook('creating', function (primKey, obj, transaction) {
            transaction.on('complete', () => _pushRecord(cfg.table, obj));
        });

        tbl.hook('updating', function (mods, primKey, obj, transaction) {
            // ⚠️ Do NOT reconstruct the pushed record as
            // Object.assign({}, obj, mods). For a full-record .put() onto
            // an EXISTING row (every single-row config/stock save, and any
            // targeted per-record write of a record with nested fields),
            // Dexie computes `mods` as a minimal set of DOTTED PATHS for
            // whatever changed inside nested objects/arrays — e.g.
            // "stockLevels.water": 15 or "drinksMenu.water.price": 7 —
            // not a full replacement object. `obj` here is the PRE-update
            // row. Object.assign just bolts the dotted key on as a new
            // top-level garbage property; the nested stockLevels/
            // drinksMenu actually pushed to Supabase stayed on its STALE
            // pre-update value. That's why editing a menu price or
            // logging a stock purchase looked correct on the device that
            // made the change (Dexie applied its own diff correctly) but
            // silently never reached other devices. Re-reading the row
            // after the transaction commits sidesteps the whole class of
            // bug — it's simply whatever Dexie actually has stored now.
            transaction.on('complete', async () => {
                const key = cfg.singleRowId || primKey;
                try {
                    const freshRecord = await db[cfg.table].get(key);
                    if (freshRecord) _pushRecord(cfg.table, freshRecord);
                } catch (err) {
                    console.error(`Sync updating-hook re-read failed for ${cfg.table}:`, err.message || err);
                }
            });
        });

        tbl.hook('deleting', function (primKey, obj, transaction) {
            transaction.on('complete', () => _pushDeleteRow(cfg.table, cfg.singleRowId || primKey));
        });
    });
}

// ── Apply a remote row into the in-memory state + Dexie + re-render ─────
// Per-store dispatch is unavoidable here — the in-memory shape (arrays vs.
// keyed objects vs. scattered globals for settings) differs store to
// store, unlike push/pull which are fully generic.
// Re-render whichever Pending-Checkouts surface is currently visible —
// same "only repaint what's open" pattern already used by
// refreshDynamicContentForLanguage() in 16_pending_checkout.js. Shared by
// both the update-apply case below and _applyRemoteDelete(), since a
// resolution (delete from pending_checkouts) needs the same repaint as a
// new lock (put into pending_checkouts).
function _pcRepaintOpenPanels() {
    const adminView = document.getElementById('pending-admin-view');
    if (adminView && adminView.style.display !== 'none') {
        const activePanel = document.getElementById('pending-panel-active');
        if (activePanel && activePanel.style.display !== 'none' && typeof renderPendingAdminList === 'function') {
            renderPendingAdminList();
        }
    }
    const financeModal = document.getElementById('finance-pending-modal');
    if (financeModal && financeModal.style.display === 'flex' && typeof renderFinancePendingList === 'function') {
        renderFinancePendingList();
    }
}

function _applyRemoteRecord(storeName, record) {
    switch (storeName) {
        case 'sessions': {
            sessions[record.id] = {
                active: record.active,
                mode: record.mode,
                startTime: record.start_time,
                presetMins: record.preset_mins,
                currentPlayerMode: record.current_player_mode,
                segments: record.segments || [],
                drinks: record.drinks || {},
                customExtras: record.custom_extras || [],
                mergedTablesCount: record.merged_tables_count || 0
            };
            if (typeof updateUI === 'function') updateUI();
            break;
        }
        case 'financial_data': {
            const mapped = {
                id: record.id, date: record.date, time: record.time, type: record.type,
                amount: record.amount, description: record.description,
                user: record.logged_by, linkedId: record.linked_id, notes: record.notes || []
            };
            const idx = financialData.findIndex(r => r.id === record.id);
            if (idx === -1) financialData.push(mapped); else financialData[idx] = mapped;
            if (typeof updateFinanceUI === 'function') updateFinanceUI();
            break;
        }
        case 'games_history': {
            const idx = gamesData.findIndex(r => r.id === record.id);
            if (idx === -1) gamesData.push(record); else gamesData[idx] = record;
            const gamesView = document.getElementById('admin-games-view');
            if (gamesView && gamesView.style.display !== 'none' && typeof renderGamesAdminUI === 'function') {
                renderGamesAdminUI();
            }
            break;
        }
        case 'notes': {
            const idx = notesData.findIndex(n => n.id === record.id);
            if (idx === -1) notesData.push(record); else notesData[idx] = record;
            if (typeof renderNotebookPanel === 'function') renderNotebookPanel();
            if (typeof updateNotebookDotState === 'function') updateNotebookDotState();
            break;
        }
        case 'expense_edit_log': {
            const idx = expenseEditLog.findIndex(r => r.id === record.id);
            if (idx === -1) expenseEditLog.push(record); else expenseEditLog[idx] = record;
            const expView = document.getElementById('expenses-admin-view');
            const expLogPanel = document.getElementById('expenses-panel-log');
            if (expView && expView.style.display !== 'none' && expLogPanel && expLogPanel.style.display !== 'none'
                && typeof renderExpenseEditLog === 'function') {
                renderExpenseEditLog();
            }
            break;
        }
        case 'pending_checkouts': {
            const idx = pendingCheckoutsQueue.findIndex(r => r.id === record.id);
            if (idx === -1) pendingCheckoutsQueue.push(record); else pendingCheckoutsQueue[idx] = record;
            if (typeof _pcUpdateDotState === 'function') _pcUpdateDotState();
            _pcRepaintOpenPanels();
            break;
        }
        case 'pending_checkout_log': {
            const idx = pendingCheckoutLog.findIndex(r => r.id === record.id);
            if (idx === -1) pendingCheckoutLog.push(record); else pendingCheckoutLog[idx] = record;
            const pcAdminView = document.getElementById('pending-admin-view');
            const pcLogPanel = document.getElementById('pending-panel-log');
            if (pcAdminView && pcAdminView.style.display !== 'none' && pcLogPanel && pcLogPanel.style.display !== 'none'
                && typeof renderPendingCheckoutLog === 'function') {
                renderPendingCheckoutLog();
            }
            break;
        }
        case 'shared_tables': {
            sharedTables[record.id] = { name: record.name, occupants: record.occupants || [] };
            if (currentZone === 'shared' && typeof renderSharedSpace === 'function') renderSharedSpace();
            break;
        }
        case 'employees': {
            const idx = employees.findIndex(e => e.id === record.id);
            if (idx === -1) employees.push(record); else employees[idx] = record;
            if (typeof renderEmpList === 'function') renderEmpList();
            break;
        }
        case 'personal_use_log': {
            const idx = personalUseLog.findIndex(r => r.id === record.id);
            if (idx === -1) personalUseLog.push(record); else personalUseLog[idx] = record;
            const empViewPu = document.getElementById('employee-view');
            const puPanel = document.getElementById('emp-panel-personaluse');
            if (empViewPu && empViewPu.style.display !== 'none' && puPanel && puPanel.style.display !== 'none'
                && typeof renderPersonalUseLog === 'function') {
                renderPersonalUseLog();
            }
            break;
        }
        case 'login_history': {
            const idx = loginHistory.findIndex(r => r.id === record.id);
            if (idx === -1) loginHistory.push(record); else loginHistory[idx] = record;
            const empViewLh = document.getElementById('employee-view');
            const lhPanel = document.getElementById('emp-panel-loginhistory');
            if (empViewLh && empViewLh.style.display !== 'none' && lhPanel && lhPanel.style.display !== 'none'
                && typeof renderLoginHistory === 'function') {
                renderLoginHistory();
            }
            break;
        }
        case 'app_settings': {
            if (!record.pricing) break;
            RATE_SINGLE = record.pricing.single;
            RATE_MULTI = record.pricing.multi;
            RATE_LOUNGE_IPTV = record.pricing.loungeIptv;
            if (typeof SHARED_HOURLY_RATE !== 'undefined' && record.pricing.shared != null) {
                SHARED_HOURLY_RATE = record.pricing.shared;
            }
            RATE_PS5_EXTRA = record.pricing.ps5Extra;
            RATE_VIP_PS4 = record.pricing.vipPs4;
            RATE_VIP_PS5 = record.pricing.vipPs5;
            RATE_VIP_IPTV = record.pricing.vipIptv;
            DRINKS_MENU = record.drinksMenu || DRINKS_MENU;
            notebookUsers = record.notebookUsers || notebookUsers;
            if (typeof updatePricingDisplays === 'function') updatePricingDisplays();
            break;
        }
        case 'stock_data': {
            stockTraceable = record.stockTraceable || {};
            stockLevels = record.stockLevels || {};
            stockPurchases = record.stockPurchases || [];
            stockAdjustments = record.stockAdjustments || [];
            stockComponents = record.stockComponents || {};
            const stockView = document.getElementById('stock-view');
            if (stockView && stockView.style.display !== 'none') {
                const ovPanel = document.getElementById('stock-panel-overview');
                const trPanel = document.getElementById('stock-panel-traceable');
                const cpPanel = document.getElementById('stock-panel-components');
                if (ovPanel && ovPanel.style.display !== 'none' && typeof renderStockOverview === 'function') renderStockOverview();
                if (trPanel && trPanel.style.display !== 'none' && typeof renderTraceableList === 'function') renderTraceableList();
                if (cpPanel && cpPanel.style.display !== 'none' && typeof renderComponentsList === 'function') renderComponentsList();
            }
            break;
        }
    }
}

// Only `notes` and `pending_checkouts` ever get hard-deleted locally
// today (see the known-limitation note above) — nothing to dispatch for
// the other 11 stores.
function _applyRemoteDelete(storeName, id) {
    if (storeName === 'notes') {
        notesData = notesData.filter(n => String(n.id) !== String(id));
        if (typeof renderNotebookPanel === 'function') renderNotebookPanel();
    } else if (storeName === 'pending_checkouts') {
        pendingCheckoutsQueue = pendingCheckoutsQueue.filter(r => String(r.id) !== String(id));
        if (typeof _pcUpdateDotState === 'function') _pcUpdateDotState();
        _pcRepaintOpenPanels();
    }
}

// ── PULL (catch-up on boot/reconnect) + conflict resolution ─────────────
async function _mergeRemoteRow(cfg, row) {
    const remoteRecord = row.data;
    if (!remoteRecord) return;
    const remoteTs = new Date(row.updated_at).getTime();
    const localKey = cfg.singleRowId || remoteRecord.id;

    let localRecord = null;
    try { localRecord = await db[cfg.table].get(localKey); } catch (e) { /* not found is fine */ }
    const localTs = _syncTimestampOf(cfg, localRecord);

    if (!localRecord || remoteTs > localTs) {
        _suppressPush.add(_suppressKey(cfg.table, localKey));
        await db[cfg.table].put(remoteRecord);
        _applyRemoteRecord(cfg.table, remoteRecord);
    } else if (localTs > remoteTs) {
        // This device was offline and edited after the remote's last
        // write — push ours up rather than letting the pull overwrite it.
        await _pushRecord(cfg.table, localRecord);
    }
    // Equal timestamps: already in sync, nothing to do.
}

async function _pullStore(cfg) {
    if (!supabaseClient) return;
    const cursorKey = SYNC_CURSOR_PREFIX + cfg.table;
    const lastSynced = localStorage.getItem(cursorKey) || '1970-01-01T00:00:00.000Z';

    try {
        const { data: rows, error } = await supabaseClient
            .from(cfg.table)
            .select('id, data, updated_at')
            .gt('updated_at', lastSynced)
            .order('updated_at', { ascending: true });

        if (error) { console.error(`Sync pull failed for ${cfg.table}:`, error.message); return; }
        if (!rows || rows.length === 0) return;

        // ⚠️ Each row is isolated in its own try/catch — do NOT let one
        // throwing row abort the whole batch. Before this fix, an
        // exception from _mergeRemoteRow() on any single row (e.g. a
        // downstream UI-apply function throwing on an unexpected/
        // not-yet-hydrated value) would propagate out of this loop,
        // skip the cursor update below entirely, and leave every OTHER
        // row in the batch un-applied too. Worse, the exact same
        // (still-unfetched-past) batch would be re-fetched and re-thrown
        // on every subsequent pull — permanently wedging that one
        // table's sync while every other table kept working fine, since
        // each table's cursor/pull is independent. `sessions` is the
        // store most exposed to this because applying a remote session
        // record calls updateUI(), which loops over every console/table
        // entity — unlike other stores' apply functions, which only
        // touch the single record that changed.
        for (const row of rows) {
            try {
                await _mergeRemoteRow(cfg, row);
            } catch (rowErr) {
                console.error(`Sync merge failed for ${cfg.table}:${row.id} — skipping this row, continuing batch:`, rowErr.message || rowErr);
            }
        }
        // Advance the cursor past the whole fetched batch regardless of
        // any per-row failures above — a row that keeps throwing is
        // logged for follow-up instead of being retried forever and
        // blocking everything behind it.
        localStorage.setItem(cursorKey, rows[rows.length - 1].updated_at);
    } catch (err) {
        console.error(`Sync pull threw for ${cfg.table}:`, err.message || err);
    }
}

async function _pullAllStores() {
    _syncState.syncing = true; updateSyncIndicator();
    try {
        for (const cfg of SYNC_STORE_CONFIG) {
            await _pullStore(cfg);
        }
    } finally {
        _syncState.syncing = false; updateSyncIndicator();
    }
}

// ── Live listen while online (Postgres Changes) ─────────────────────────
// ⚠️ Resilience note: a Supabase Realtime channel can silently drop
// (café WiFi blip, server-side timeout, a missing table in the
// `supabase_realtime` publication, etc.) with no other part of this app
// noticing. The original version of this function guarded itself with a
// permanent `_realtimeSubscribed = true` flag that was never reset, so a
// dropped channel meant that device stopped receiving ANY live update
// for the rest of the session — its own pushes kept working fine, which
// is exactly what made this failure invisible. `_realtimeSubscribed` is
// now tracked per-table so a single dropped channel can be torn down and
// re-subscribed without disturbing the others, and _pullAllStores() (see
// the periodic fallback pull below) acts as a safety net regardless.
let _realtimeChannels = {}; // table -> channel object, so we can remove/retry individually
let _realtimeSubscribed = {}; // table -> bool, replaces the old single global flag

// ── Application-level channel watchdog (heartbeat) ─────────────────────
// Closes the gap where a channel can look "subscribed" to Supabase's own
// status callback even though it's gone silently dead (café router that
// stops forwarding packets, a NAT/proxy killing an idle connection without
// a clean close handshake, etc). See Realtime Resilience Improvement Plan,
// Part B. Flip ENABLE_WATCHDOG to false to disable instantly in the field
// without a full rollback if it ever causes unexpected reconnect churn.
const ENABLE_WATCHDOG = true;
const HEARTBEAT_INTERVAL_MS = 8000;  // how often to ping each channel
const HEARTBEAT_STALE_MS = 15000;    // if no activity in this long, consider it dead
let _lastChannelActivity = {};       // table -> timestamp (ms) of last seen activity
let _heartbeatIntervals = {};        // table -> interval id, so teardown can clear it

function _subscribeRealtimeAll() {
    if (!supabaseClient) return;
    SYNC_STORE_CONFIG.forEach(cfg => _subscribeRealtimeTable(cfg));
}

function _subscribeRealtimeTable(cfg) {
    if (!supabaseClient || _realtimeSubscribed[cfg.table]) return;
    _realtimeSubscribed[cfg.table] = true;

    const channel = supabaseClient
        .channel(`${cfg.table}-changes`, { config: { broadcast: { self: true } } })
        .on('postgres_changes', { event: '*', schema: 'public', table: cfg.table }, (payload) => {
            _lastChannelActivity[cfg.table] = Date.now();
            if (payload.eventType === 'DELETE') {
                const deletedId = payload.old ? payload.old.id : null;
                if (deletedId != null) {
                    _suppressPush.add(_suppressKey(cfg.table, cfg.singleRowId || deletedId));
                    db[cfg.table].delete(cfg.singleRowId ? cfg.singleRowId : deletedId).catch(() => {});
                    _applyRemoteDelete(cfg.table, deletedId);
                }
            } else if (payload.new) {
                _mergeRemoteRow(cfg, { id: payload.new.id, data: payload.new.data, updated_at: payload.new.updated_at });
            }
        })
        // Self-heartbeat: with broadcast.self = true, our own ping is echoed
        // straight back to us. Receiving it proves the channel is actually
        // carrying traffic in both directions, not just "looking" subscribed.
        .on('broadcast', { event: 'ping' }, () => {
            _lastChannelActivity[cfg.table] = Date.now();
        })
        .subscribe((status) => {
            // Possible statuses: SUBSCRIBED, TIMED_OUT, CHANNEL_ERROR, CLOSED
            if (status === 'SUBSCRIBED') {
                // Initialize now so a brand-new (genuinely healthy but quiet)
                // channel isn't immediately flagged stale before its first
                // heartbeat has had a chance to land.
                _lastChannelActivity[cfg.table] = Date.now();
                if (ENABLE_WATCHDOG) {
                    clearInterval(_heartbeatIntervals[cfg.table]);
                    _heartbeatIntervals[cfg.table] = setInterval(() => {
                        if (_realtimeSubscribed[cfg.table]) {
                            channel.send({ type: 'broadcast', event: 'ping', payload: {} });
                        }
                    }, HEARTBEAT_INTERVAL_MS);
                }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
                console.warn(`17_sync.js: realtime channel for "${cfg.table}" dropped (${status}) — will retry.`);
                _teardownRealtimeTable(cfg.table);
                // Retry shortly after, but only if we're actually reachable —
                // no point hammering a connection that's genuinely down; the
                // reachability loop/_checkAndReconcile will call this again
                // on the next tick regardless, this just speeds up recovery.
                setTimeout(() => {
                    if (_syncState.browserOnline && _syncState.reachable === true) {
                        _subscribeRealtimeTable(cfg);
                    }
                }, 3000);
            }
        });

    _realtimeChannels[cfg.table] = channel;
}

function _teardownRealtimeTable(table) {
    const channel = _realtimeChannels[table];
    if (channel && supabaseClient) {
        try { supabaseClient.removeChannel(channel); } catch (e) { /* already gone, fine */ }
    }
    clearInterval(_heartbeatIntervals[table]);
    delete _heartbeatIntervals[table];
    delete _realtimeChannels[table];
    _realtimeSubscribed[table] = false;
}

// Independently checks every table's last-seen activity and forces a
// reconnect for any that's gone quiet longer than HEARTBEAT_STALE_MS —
// rather than waiting for Supabase's own status callback (which may never
// fire for a connection that's silently dead) or the periodic pull to be
// the thing that eventually notices.
function _watchdogTick() {
    if (!ENABLE_WATCHDOG) return;
    if (!(_syncState.browserOnline && _syncState.reachable === true)) return;
    const now = Date.now();
    SYNC_STORE_CONFIG.forEach(cfg => {
        const last = _lastChannelActivity[cfg.table] || 0;
        if (_realtimeSubscribed[cfg.table] && (now - last) > HEARTBEAT_STALE_MS) {
            console.warn(`17_sync.js: watchdog — "${cfg.table}" channel silent for >${HEARTBEAT_STALE_MS}ms, forcing reconnect.`);
            _teardownRealtimeTable(cfg.table);
            _subscribeRealtimeTable(cfg);
        }
    });
}
if (ENABLE_WATCHDOG) setInterval(_watchdogTick, HEARTBEAT_INTERVAL_MS);

// Runs on every confirmed reconnect: push whatever piled up while
// offline FIRST, then pull — in that order, so a pull can't apply
// someone else's remote change over a local edit that hasn't gone up yet.
async function _onReconnected() {
    await _flushOfflineQueue();
    await _pullAllStores();
}

// ⚠️ Fallback safety net for the "device stays reachable, but the realtime
// channel silently dropped" case (see _subscribeRealtimeTable above). Even
// with the per-table retry logic there, a periodic pull costs almost
// nothing (cursor-based — only asks Supabase for rows newer than last seen
// per table) and guarantees this device can never drift more than
// PERIODIC_PULL_INTERVAL_MS behind another device's changes, regardless of
// what realtime is doing. This runs independently of the reachable-edge
// reconciliation below, which still exists for the offline-queue flush.
const PERIODIC_PULL_INTERVAL_MS = 8000; // 8s (was 20s — see Realtime Resilience Improvement Plan, Part A)

(function _initSync() {
    updateSyncIndicator(); // show correct state immediately, before the first reachability check resolves
    _startReachabilityLoop();
    _registerSyncHooks(); // safe to register immediately — pushes just queue while offline

    // Presence, Realtime, and the flush+pull reconciliation all need a
    // *confirmed reachable* connection, not just "online" — track the
    // reachable→unreachable edge so the offline-queue flush runs once per
    // actual reconnect, not on every 20s tick while already connected.
    let _wasReachable = false;
    function _checkAndReconcile() {
        const nowReachable = _syncState.browserOnline && _syncState.reachable === true;
        if (nowReachable) {
            _joinPresenceChannel();
            _subscribeRealtimeAll(); // no-ops per-table if already subscribed; retries any dropped ones
            if (!_wasReachable) _onReconnected(); // edge: just became reachable — flush queue, then pull
        }
        _wasReachable = nowReachable;
    }

    // Runs on every tick regardless of the reachable edge — this is what
    // keeps a long-lived, continuously-online session in sync even if the
    // realtime subscription silently died and hasn't recovered yet. Only
    // pulls (never touches the offline queue) since a continuously-online
    // device has nothing queued.
    function _periodicPull() {
        if (_syncState.browserOnline && _syncState.reachable === true) {
            _pullAllStores();
        }
    }
    setInterval(_periodicPull, PERIODIC_PULL_INTERVAL_MS);

    // Run the first reconcile check as soon as the first reachability probe
    // has had a chance to resolve, instead of waiting for the first 20s
    // setInterval tick below. Without this, a fresh install (or any cold
    // boot) could sit there looking empty/disconnected for up to 20 seconds
    // even though the Supabase connection itself was confirmed almost
    // immediately by _startReachabilityLoop()'s own first check — the pull
    // that actually populates the app just hadn't been asked to run yet.
    setTimeout(_checkAndReconcile, SYNC_REACHABILITY_TIMEOUT_MS + 500);

    // Self-rescheduling, same reasoning as _startReachabilityLoop(): while
    // not yet reachable, re-check every 3s so the actual flush+pull follows
    // right behind reachability being detected, instead of the two being
    // able to drift up to ~20s apart (reachability confirmed quickly, but
    // the reconcile/pull still waiting on its own slower fixed interval).
    function _scheduleNextReconcile() {
        const nowReachable = _syncState.browserOnline && _syncState.reachable === true;
        const delay = nowReachable ? SYNC_REACHABILITY_INTERVAL_MS : SYNC_REACHABILITY_FAST_RETRY_MS;
        setTimeout(() => { _checkAndReconcile(); _scheduleNextReconcile(); }, delay);
    }
    _scheduleNextReconcile();

    // Also reconcile immediately on the browser's 'online' event (WiFi
    // restored), rather than waiting up to 20s for the next interval tick.
    window.addEventListener('online', () => {
        setTimeout(() => {
            if (_syncState.browserOnline && _syncState.reachable === true && !_wasReachable) {
                _wasReachable = true;
                _onReconnected();
            }
        }, SYNC_REACHABILITY_TIMEOUT_MS + 500); // give the reachability re-check a moment to resolve first
    });

    // ⚠️ App-resume fix (mobile WebView backgrounding).
    // Everything above assumes setInterval/online-offline events keep
    // firing on schedule — but a backgrounded WebView is commonly
    // throttled or fully paused by the OS to save battery, so:
    //   • the 8s periodic pull and 20s reachability loop can stall for
    //     the entire time the app is backgrounded;
    //   • 'online'/'offline' may not fire at all for a connectivity
    //     change that happened while backgrounded, leaving
    //     `_syncState.reachable` stuck on a STALE value from before
    //     backgrounding;
    //   • a stale-but-still-true `_wasReachable` means _checkAndReconcile()
    //     sees no false→true edge on resume and never calls _onReconnected().
    // This is exactly why "close the app, reopen it, nothing synced"
    // could happen even though the same logic works fine while the app
    // stays open in the foreground the whole time. Fix: force a fresh
    // reachability probe and an UNCONDITIONAL reconcile (not gated on an
    // edge, since the edge itself can't be trusted after a background
    // period) every time the page becomes visible again. Applies to all
    // 13 synced stores via _pullAllStores()/_onReconnected() — this is
    // not a sessions-only fix.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;

        _checkSupabaseReachable().then(() => {
            const nowReachable = _syncState.browserOnline && _syncState.reachable === true;
            if (!nowReachable) { _wasReachable = false; return; }

            // Realtime channels/presence may *look* subscribed (our local
            // flags never got a chance to update while backgrounded) even
            // though the underlying socket died — tear down and
            // re-subscribe everything unconditionally rather than relying
            // on the normal "no-op if already subscribed" fast path.
            SYNC_STORE_CONFIG.forEach(cfg => _teardownRealtimeTable(cfg.table));
            if (_presenceChannel) {
                try { supabaseClient.removeChannel(_presenceChannel); } catch (e) { /* already gone, fine */ }
                _presenceChannel = null;
            }
            _joinPresenceChannel();
            _subscribeRealtimeAll();

            // Unconditional, not edge-gated: flush anything queued while
            // backgrounded, then pull every store's latest state — covers
            // sessions, financial data, stock, employees, notes, shared
            // tables, pending checkouts, everything in SYNC_STORE_CONFIG.
            _wasReachable = true;
            _onReconnected();
        });
    });
})();