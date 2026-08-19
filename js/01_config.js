// MODULE: 01_config.js
// Lines 1–83 of original script.js
// ═══════════════════════════════════════════════════════

const db = new Dexie("GamingCenterOfflineDB");
db.version(1).stores({
    sessions: 'id, active, mode, start_time, preset_mins, current_player_mode, segments, drinks, custom_extras',
    financial_data: 'id, date, time, type, amount, description, logged_by'
});
db.version(2).stores({
    sessions: 'id, active, mode, start_time, preset_mins, current_player_mode, segments, drinks, custom_extras',
    financial_data: 'id, date, time, type, amount, description, logged_by',
    games_history: 'id, date, time, type, games, logged_by'
});
db.version(3).stores({
    sessions: 'id, active, mode, start_time, preset_mins, current_player_mode, segments, drinks, custom_extras',
    financial_data: 'id, date, time, type, amount, description, logged_by',
    games_history: 'id, date, time, type, games, logged_by',
    notes: 'id, author, timestamp, mentionedUser, pinned, pinnedAt, unpinnedAt, edited'
});
db.version(4).stores({
    sessions: 'id, active, mode, start_time, preset_mins, current_player_mode, segments, drinks, custom_extras',
    financial_data: 'id, date, time, type, amount, description, logged_by',
    games_history: 'id, date, time, type, games, logged_by',
    notes: 'id, author, timestamp, mentionedUser, pinned, pinnedAt, unpinnedAt, edited',
    expense_edit_log: 'id, expenseId, editedBy, editedAt'
});
// v5: Escrow / Pending Checkout system (see 16_pending_checkout.js).
// Purely additive — no .upgrade() needed. Both new stores are stored
// camelCase in-memory with no snake_case mapping, same non-serialized
// convention already used for `notes` and `expense_edit_log`.
db.version(5).stores({
    sessions: 'id, active, mode, start_time, preset_mins, current_player_mode, segments, drinks, custom_extras',
    financial_data: 'id, date, time, type, amount, description, logged_by',
    games_history: 'id, date, time, type, games, logged_by',
    notes: 'id, author, timestamp, mentionedUser, pinned, pinnedAt, unpinnedAt, edited',
    expense_edit_log: 'id, expenseId, editedBy, editedAt',
    pending_checkouts: 'id, sourceType, amount, timestamp, details',
    pending_checkout_log: 'id, sourceType, amount, timestamp, resolvedBy, resolutionType'
});
// v6: shared_tables persistence (previously pure in-memory — occupants
// vanished on reload; see Multi-Device Sync plan Phase 1). Purely
// additive — no .upgrade() needed. Keyed by the same string ids
// sharedTables already uses in-memory ('shared-1', 'shared-2'), storing
// the whole { name, occupants } record per row.
db.version(6).stores({
    sessions: 'id, active, mode, start_time, preset_mins, current_player_mode, segments, drinks, custom_extras',
    financial_data: 'id, date, time, type, amount, description, logged_by',
    games_history: 'id, date, time, type, games, logged_by',
    notes: 'id, author, timestamp, mentionedUser, pinned, pinnedAt, unpinnedAt, edited',
    expense_edit_log: 'id, expenseId, editedBy, editedAt',
    pending_checkouts: 'id, sourceType, amount, timestamp, details',
    pending_checkout_log: 'id, sourceType, amount, timestamp, resolvedBy, resolutionType',
    shared_tables: 'id'
});
// v7: full-app sync scope expansion. Five stores that previously lived
// ONLY in localStorage (never had any Dexie presence) so they could
// never be part of the sync engine. Purely additive — no .upgrade()
// needed; 02_init.js's loadDataFromLocal() handles the one-time
// migration from existing localStorage data into these stores on each
// device's first run after this update.
// Explicitly OUT of scope (device-local, never synced): app_lang /
// device_id (per-device display prefs, not app data). Credentials
// (formerly ADMIN_PASSWORD / NATIVE_CREDENTIALS, now unified into
// app_credentials) are NO LONGER excluded — they're cloud-backed via
// Supabase's app_credentials table as of the License & Credentials
// Cloud Migration Plan, with a locally-cached copy for offline login.
db.version(7).stores({
    sessions: 'id, active, mode, start_time, preset_mins, current_player_mode, segments, drinks, custom_extras',
    financial_data: 'id, date, time, type, amount, description, logged_by',
    games_history: 'id, date, time, type, games, logged_by',
    notes: 'id, author, timestamp, mentionedUser, pinned, pinnedAt, unpinnedAt, edited',
    expense_edit_log: 'id, expenseId, editedBy, editedAt',
    pending_checkouts: 'id, sourceType, amount, timestamp, details',
    pending_checkout_log: 'id, sourceType, amount, timestamp, resolvedBy, resolutionType',
    shared_tables: 'id',
    employees: 'id, name',
    personal_use_log: 'id, empId, date',
    login_history: 'id, user, action, timestamp',
    app_settings: 'id',
    stock_data: 'id'
});

// Clean Global Application State
let sessions = {}; 
let financialData = [];
let gamesData = [];
let notesData = []; // Notebook: hydrated from db.notes at boot (02_init.js)
let expenseEditLog = []; // Modify Expenses ▸ Edit History Log: hydrated from db.expense_edit_log at boot (02_init.js)
let pendingCheckoutsQueue = []; // Escrow queue: hydrated from db.pending_checkouts at boot (02_init.js)
let pendingCheckoutLog = []; // Escrow resolution history: hydrated from db.pending_checkout_log at boot (02_init.js)

// ── Unified cloud-backed credentials (app_credentials table) ───────────────
// Replaces this file's old NATIVE_CREDENTIALS, main.dart's hardcoded
// _nativeUsers, AND 13_employees.js's in-app ADMIN_PASSWORD — all three
// now resolve through the same Supabase-synced cache. See the License &
// Credentials Cloud Migration Plan, Phase 2.
//
// _BOOTSTRAP_CREDENTIALS is a fallback ONLY, used if this device/browser
// has never once successfully synced app_credentials (e.g. very first
// run, always offline). Same 3 users as before, so a fresh install never
// bricks itself before its first internet connection.
const _BOOTSTRAP_CREDENTIALS = [
    { username: 'Body',         password: 'body808ab',    role: 'user'  },
    { username: 'Kareem',       password: 'adminaa123',   role: 'user'  },
    { username: 'fantasyadmin', password: 'managment124', role: 'admin' },
];

// Cache of {username, password_hash, role} rows pulled from Supabase's
// app_credentials table, mirrored to localStorage so it survives reloads
// and enables fully offline login/verification after the first sync.
let _cachedAppCredentials = [];
try {
    const _rawCreds = localStorage.getItem('cached_app_credentials');
    if (_rawCreds) _cachedAppCredentials = JSON.parse(_rawCreds);
} catch (_) {}

// Pulls the latest credential rows from Supabase and refreshes the local
// cache. Safe to call anytime — no-ops silently if offline/unreachable,
// and never overwrites a good cache with an empty/failed response.
// Called from 17_sync.js once supabaseClient + reachability are confirmed.
async function syncAppCredentialsFromSupabase() {
    if (!window.supabaseClient) return;
    try {
        const { data, error } = await window.supabaseClient
            .from('app_credentials')
            .select('username,password_hash,role');
        if (error || !data || data.length === 0) return;
        _cachedAppCredentials = data;
        localStorage.setItem('cached_app_credentials', JSON.stringify(data));
    } catch (_) {
        // Offline or unreachable — silently keep using whatever's cached.
    }
}

// Maps this project's DB role ('admin'/'staff') to the role string the
// rest of the app has always used ('admin'/'user').
function _dbRoleToAppRole(dbRole) { return dbRole === 'admin' ? 'admin' : 'user'; }

// Verifies a plain-text password against the cloud-synced cache first
// (bcrypt compare against every cached row — this remains a password-only
// check with no separate username field, same as the original design).
// Falls back to the hardcoded bootstrap list ONLY if the cache is empty.
// Returns { username, role } (role = 'admin'/'user') or null.
function verifyAppCredential(password) {
    if (_cachedAppCredentials.length > 0) {
        if (!window.bcrypt) {
            console.error('01_config.js: bcrypt.js not loaded — cannot verify cloud-synced credentials. Add bcrypt.js as a <script> before this module.');
            return null;
        }
        for (const row of _cachedAppCredentials) {
            try {
                if (window.bcrypt.compareSync(password, row.password_hash)) {
                    return { username: row.username, role: _dbRoleToAppRole(row.role) };
                }
            } catch (_) {}
        }
        return null;
    }
    const fallback = _BOOTSTRAP_CREDENTIALS.find(c => c.password === password);
    return fallback ? { username: fallback.username, role: fallback.role } : null;
}

// Legacy-shaped helper kept for 16_pending_checkout.js's Escrow lock/resolve
// gate, which only ever needed the resolved username string. Internally now
// backed by the unified cloud credential system above.
function verifyNativeCredential(password) {
    const result = verifyAppCredential(password);
    return result ? result.username : null;
}

// Pricing Configuration
let RATE_SINGLE = parseFloat(localStorage.getItem('pricing_single')) || 70;
let RATE_MULTI = parseFloat(localStorage.getItem('pricing_multi')) || 100;
let RATE_LOUNGE_IPTV = parseFloat(localStorage.getItem('pricing_lounge_iptv')) || 100;
let RATE_VIP_PS4 = parseFloat(localStorage.getItem('pricing_vip_ps4')) || 120;
let RATE_VIP_PS5 = parseFloat(localStorage.getItem('pricing_vip_ps5')) || 150;
let RATE_VIP_IPTV = parseFloat(localStorage.getItem('pricing_vip_iptv')) || 125;
let RATE_PS5_EXTRA = parseFloat(localStorage.getItem('pricing_ps5_extra')) || 25; 

// Zone Management
let currentZone = 'lounge';

const LOUNGE_CONSOLES = [
    { id: 1, name: "PS4 - 01", type: "ps" },
    { id: 2, name: "PS4 - 02", type: "ps" },
    { id: 3, name: "PS4 - 03", type: "ps" },
    { id: 4, name: "PS4 - 04", type: "ps" },
    { id: 6, name: "PS4 - 05", type: "ps" },
    { id: 5, name: "PS5 - 01", type: "ps" }
];

const VIP_CONSOLES = [
    { id: 100, name: "PS4 VIP 1", type: "vip" },
    { id: 101, name: "PS4 VIP 2", type: "vip" },
    { id: 102, name: "PS5 VIP", type: "vip" }
];

const CAFE_TABLES = [
    { id: 200, name: "Table 1", type: "cafe" },
    { id: 300, name: "Table 2", type: "cafe" },
    { id: 400, name: "Table 3", type: "cafe" },
    { id: 500, name: "Table 4", type: "cafe" },
    { id: 600, name: "Table 5", type: "cafe" }
];

const ALL_ENTITIES = [...LOUNGE_CONSOLES, ...VIP_CONSOLES, ...CAFE_TABLES];

// ── Hardware Mutual-Exclusion Map ──────────────────────
// Some VIP rooms physically share the same console hardware with a Lounge
// unit. If one side of a pair is active, the other side is locked out from
// starting a new session until the active one is checked out.
const HARDWARE_LOCKS = {
    102: 5,    // PS5 VIP   ↔ PS5 - 01
    5:   102,
    100: 1,    // PS4 VIP 1 ↔ PS4 - 01
    1:   100,
    101: 2,    // PS4 VIP 2 ↔ PS4 - 02
    2:   101
};

function getLinkedPartner(id) {
    const partnerId = HARDWARE_LOCKS[id];
    return partnerId ? ALL_ENTITIES.find(e => e.id === partnerId) : null;
}

function isHardwareLocked(id) {
    const partnerId = HARDWARE_LOCKS[id];
    return !!(partnerId && sessions[partnerId] && sessions[partnerId].active);
}

let DRINKS_MENU = JSON.parse(localStorage.getItem('drinks_menu')) || {
    tea: { name: 'Tea', price: 20 },
    coffee: { name: 'Turkey Coffee', price: 30 },
    water: { name: 'Water', price: 10 },
    cola: { name: 'Cola', price: 25 },
    sships: { name: 'Small Shipsy', price: 10 },
    sbskot: { name: 'small Bskot', price: 10 },
    mbskot: { name: 'medium Bskot', price: 15 },
    mships: { name: 'medium Shipsy', price: 15 },
    lbskot: { name: 'large Bskot', price: 20 },
    lships: { name: 'large Shipsy', price: 20 },
    juice: { name: 'juice', price: 35 }
};

// ── Notebook User Directory ───────────────────────────
// Separate from native login (main.dart's hardcoded _nativeUsers) — this
// list only drives the @mention picker + read/unread rules inside the
// Notebook feature. Managed from Employees ▸ Notebook Admin section.
// Role mapping mirrors main.dart's _nativeUsers: Body/Kareem = 'user',
// fantasyadmin = 'admin'.
let notebookUsers = JSON.parse(localStorage.getItem('notebook_users')) || [
    { name: 'Body', role: 'user' },
    { name: 'Kareem', role: 'user' },
    { name: 'fantasyadmin', role: 'admin' }
];

// ── App Settings dual-write (Multi-Device Sync — full scope) ─────────
// Covers everything that was previously localStorage-only "settings"
// data: pricing rates, the drinks menu, and the notebook user list.
// Single-row store (id: 'config') since this is one config blob, not a
// record collection — mirrors the plan's jsonb-column reasoning.
async function saveAppSettingsToDexie() {
    try {
        await db.app_settings.put({
            id: 'config',
            pricing: {
                single: RATE_SINGLE,
                multi: RATE_MULTI,
                loungeIptv: RATE_LOUNGE_IPTV,
                shared: (typeof SHARED_HOURLY_RATE !== 'undefined') ? SHARED_HOURLY_RATE : null,
                ps5Extra: RATE_PS5_EXTRA,
                vipPs4: RATE_VIP_PS4,
                vipPs5: RATE_VIP_PS5,
                vipIptv: RATE_VIP_IPTV
            },
            drinksMenu: DRINKS_MENU,
            notebookUsers: notebookUsers,
            updatedAt: new Date().toISOString()
        });
    } catch (err) {
        console.error('saveAppSettingsToDexie failed:', err);
    }
}

function saveNotebookUsers() {
    localStorage.setItem('notebook_users', JSON.stringify(notebookUsers));
    saveAppSettingsToDexie();
}

// ── Stable device identity (Multi-Device Sync — Presence) ────────────
// Generated once on first boot, never regenerated. Used solely to count
// distinct devices online (17_sync.js); carries no personal data.
function getDeviceId() {
    let id = localStorage.getItem('device_id');
    if (!id) {
        id = (crypto.randomUUID && crypto.randomUUID()) ||
            ('dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10));
        localStorage.setItem('device_id', id);
    }
    return id;
}

function syncToNativeStorage(key, value) {
    if (window.SecuritySyncHandler && typeof window.SecuritySyncHandler.postMessage === 'function') {
        window.SecuritySyncHandler.postMessage(key + '|' + value.toString());
    }
}

// ── Login / Logout History ────────────────────────────
// Every time a user is authenticated by the native Flutter shell, or logs
// out from within the app, we record an entry here so it can be reviewed
// later from Employees ▸ Login History.
let loginHistory = JSON.parse(localStorage.getItem('login_history')) || [];

function saveLoginHistory() {
    localStorage.setItem('login_history', JSON.stringify(loginHistory));
    if (loginHistory.length === 0) {
        db.login_history.clear().catch(err => console.error('login_history Dexie clear failed:', err));
    } else {
        db.login_history.put(loginHistory[loginHistory.length - 1]).catch(err =>
            console.error('login_history Dexie write failed:', err)
        );
    }
}

function recordLoginEvent(userName, role, action) {
    const now = new Date();
    loginHistory.push({
        id:        Date.now() + Math.random(),   // avoid id clashes if login/logout land in the same ms
        user:      userName || 'Unknown',
        role:      role || 'user',
        action:    action,                       // 'login' | 'logout'
        date:      `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`,
        time:      now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: now.getTime(),
        updatedAt: now.toISOString() // login records are append-only/immutable — this always equals creation time
    });
    saveLoginHistory();
}

// Native security bridge triggered by Flutter
window.initializeAuthenticatedSession = function(userName, role) {
    sessionStorage.setItem('gaming_auth', 'true');
    sessionStorage.setItem('gaming_user', userName);
    sessionStorage.setItem('gaming_role', role);

    recordLoginEvent(userName, role, 'login');

    // If loadDataFromLocal already finished (bar at 100%), dismiss splash now.
    // Otherwise set a flag so loadDataFromLocal dismisses it when it's done.
    if (window._splashDataReady) {
        Splash.dismiss();
        // Show main app after the splash exit animation completes (550ms)
        setTimeout(() => {
            document.getElementById('main-app').style.display = 'block';
            showApp();
        }, 560);
    } else {
        // Data still loading — store credentials, show app once splash hides
        window._splashAuthPending = { userName, role };
        // Patch: loadDataFromLocal will call Splash.dismiss() and then we pick up here
        const _origDismiss = Splash.dismiss.bind(Splash);
        Splash.dismiss = function() {
            _origDismiss();
            setTimeout(() => {
                document.getElementById('main-app').style.display = 'block';
                showApp();
            }, 560);
        };
    }
};

let pendingModes = {
    1: 'single', 2: 'single', 3: 'single', 4: 'single', 5: 'single', 6: 'single',
    100: 'gaming', 101: 'gaming', 102: 'gaming'
};
let timerInterval;
let pendingCheckout = null;
let currentDrinksSessionId = null;
let pendingSessionStart = null; 
let migrateSourceId = null;
let currentSharedTableId = null;
let currentSharedPersonId = null

window.onload = async function() {
    updatePricingDisplays(); 
    buildConsoles();
    await loadDataFromLocal();
};