// MODULE: 03_ui_core.js
// Lines 149–236 of original script.js
// ═══════════════════════════════════════════════════════


function customAlert(message, title = "Notification") {
    document.getElementById('alert-title').innerText = title;
    document.getElementById('alert-message').innerText = message;
    document.getElementById('alert-modal').style.display = 'flex';
}

function closeAlert() {
    document.getElementById('alert-modal').style.display = 'none';
}

function showConfirm(message, onYes, onNo, title = "Confirm Action") {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-message').innerText = message;
    document.getElementById('confirm-modal').style.display = 'flex';
    
    document.getElementById('confirm-yes').onclick = function() {
        document.getElementById('confirm-modal').style.display = 'none';
        if (onYes) onYes();
    };
    document.getElementById('confirm-no').onclick = function() {
        document.getElementById('confirm-modal').style.display = 'none';
        if (onNo) onNo();
    };
}

function logout() {
    // 0. Record the logout event (must happen before we clear sessionStorage,
    //    since that's where the current user's name/role live).
    const _logoutUser = sessionStorage.getItem('gaming_user') || 'Unknown';
    const _logoutRole  = sessionStorage.getItem('gaming_role') || 'user';
    recordLoginEvent(_logoutUser, _logoutRole, 'logout');

    // 1. Clear session data
    sessionStorage.removeItem('gaming_auth');
    sessionStorage.removeItem('gaming_user');
    sessionStorage.removeItem('gaming_role');
    
    // 2. Stop the timer loop so it doesn't run in the background
    clearInterval(timerInterval);

    // 3. Send a message to Flutter to handle the actual screen change
    if (window.FlutterAuthBridge) {
        window.FlutterAuthBridge.postMessage('ACTION_LOGOUT');
    }
}

function showApp() {
    if(document.getElementById('login-view')) {
        document.getElementById('login-view').style.display = 'none';
    }
    document.getElementById('main-app').style.display = 'block';
    
    const currentUser = sessionStorage.getItem('gaming_user') || 'Unknown';
    const currentRole = sessionStorage.getItem('gaming_role') || 'user';
    
    document.getElementById('current-user-display').innerText = currentUser;

    if (currentRole === 'admin') {
        enableAdminFeatures();
    } else {
        disableAdminFeatures();
    }

    startTimerLoop();
    updateUI();
    updateFinanceUI();
}

function enableAdminFeatures() {
    document.getElementById('menu-icon-btn').style.display = 'block';
    document.getElementById('finance-summary').style.display = 'grid';
    document.getElementById('finance-table').style.display = 'block';
}

function disableAdminFeatures() {
    document.getElementById('menu-icon-btn').style.display = 'none';
    document.getElementById('finance-summary').style.display = 'none';
    document.getElementById('finance-table').style.display = 'none';
}

function toggleAdminMenu(open) {
    const sidebar = document.getElementById('adminMenu');
    const overlay = document.getElementById('admin-overlay');
    
    if (open) {
        sidebar.classList.add('open');
        overlay.style.display = 'block';
    } else {
        sidebar.classList.remove('open');
        overlay.style.display = 'none';
    }
}

// ── Android hardware back-button handling ──────────────────────────────
// Called from Dart (main.dart's PopScope, on every back press/gesture)
// via runJavaScriptReturningResult('window.handleAndroidBack()'). Closes
// whatever UI is topmost in priority order — admin sidebar, then the
// notebook slide-out panel, then any open modal, then (new) any admin
// sub-view reached via the hamburger menu, returning to the lounge —
// and returns true if it did. Dart falls through to its own
// exit-confirmation only when this returns false, so a lone back press
// never silently exits the app while something is still open here.
function handleAndroidBack() {
    // 1. Admin sidebar
    const adminMenu = document.getElementById('adminMenu');
    if (adminMenu && adminMenu.classList.contains('open')) {
        toggleAdminMenu(false);
        return true;
    }

    // 2. Notebook slide-out panel — its own overlay class
    // (`.notebook-panel-overlay`), not `.modal-overlay`, so it needs its
    // own check rather than falling into step 3 below.
    const notebookOverlay = document.getElementById('notebook-panel-overlay');
    if (notebookOverlay && getComputedStyle(notebookOverlay).display !== 'none') {
        if (typeof closeNotebookPanel === 'function') closeNotebookPanel();
        else notebookOverlay.style.display = 'none';
        return true;
    }

    // 3. Any open modal. `.modal-overlay` covers every modal in this app,
    // static (alert/confirm, drinks, migrate, checkout, employee/finance
    // dialogs, the custom-item wizard) AND dynamically created at runtime
    // (13_employees.js's admin-password prompt, 16_pending_checkout.js's
    // native-auth prompt) — both use the same className. A future modal
    // gets back-button support for free as long as it reuses this class
    // and has some kind of Cancel/Close/Done/skip control, without this
    // function needing to know its name.
    const openModals = Array.from(document.querySelectorAll('.modal-overlay'))
        .filter(el => getComputedStyle(el).display !== 'none');
    if (openModals.length > 0) {
        // Last in DOM order = rendered on top when more than one is open
        // (e.g. the custom-item wizard, z-index 1100, stacked over the
        // drinks modal underneath it).
        const topModal = openModals[openModals.length - 1];

        // Known simple cases first — cheapest and least ambiguous.
        if (topModal.id === 'alert-modal' && typeof closeAlert === 'function') {
            closeAlert();
            return true;
        }
        if (topModal.id === 'confirm-modal') {
            const no = document.getElementById('confirm-no');
            if (no) { no.click(); return true; }
        }

        // General case: find a dismiss button inside this modal. The
        // most reliable signal is the button's own onclick *source* —
        // some dismiss buttons have label text that gives no hint at all
        // (e.g. charge-emp-modal's "Skip / No Charge", whose onclick
        // just hides the modal) — so check that before falling back to
        // the visible label text.
        const buttons = Array.from(topModal.querySelectorAll('button'));
        const closePattern = /close|cancel|display\s*=\s*['"]none['"]/i;
        let dismissBtn = buttons.find(b => closePattern.test(b.getAttribute('onclick') || ''));
        if (!dismissBtn) {
            const dismissWords = ['cancel', 'close', 'done', 'ok', 'no', 'skip', '×', '✕'];
            dismissBtn = buttons.find(b => {
                const text = (b.innerText || b.textContent || '').trim().toLowerCase();
                return dismissWords.some(w => text === w || text.includes(w));
            });
        }

        if (dismissBtn) {
            dismissBtn.click();
        } else {
            // No recognizable dismiss control — hide it directly rather
            // than leaving the back press with no effect at all.
            topModal.style.display = 'none';
        }
        return true;
    }

    // 4. An admin sub-view reached via the hamburger sidebar (Audits,
    // Modify Expenses, Games Asked For, Stock Management, Employees,
    // the Notebook admin view, or the Pending Checkouts admin hub —
    // 04_admin_views.js / 12_stock.js / 13_employees.js / 15_notebook.js /
    // 16_pending_checkout.js). Every one of these views already has its
    // own "⬅ Back to Lounge" button in index.html, and — with the sole
    // exception of Audits (see below) — that button's onclick is just
    // switchTab('lounge') (05). Back should do exactly what that button
    // does, so a lone back press from deep inside any admin section
    // returns straight to the lounge in one step, not one modal/menu
    // layer at a time.
    //
    // Deliberately excludes 'noroom-view'/'financial-view': those are
    // reached from the main nav tab bar (btn-noroom/btn-finance), not
    // the hamburger admin menu, and switchTab() already treats them as
    // ordinary tabs — back from there should fall through to Dart's
    // double-back-to-exit guard like any other top-level screen, not be
    // treated as "leaving the admin menu."
    const ADMIN_SECTION_VIEW_IDS = [
        'audits-view', 'expenses-admin-view', 'admin-games-view',
        'stock-view', 'employee-view', 'notebook-admin-view', 'pending-admin-view'
    ];
    const openAdminSectionId = ADMIN_SECTION_VIEW_IDS.find(function (id) {
        const el = document.getElementById(id);
        return el && getComputedStyle(el).display !== 'none';
    });
    if (openAdminSectionId) {
        // audits-view is the one exception: its back button calls
        // closeAuditsView() (04) rather than switchTab('lounge')
        // directly. closeAuditsView() itself just calls
        // switchTab('lounge') today, but routing through it here too
        // means any Audits-specific cleanup added there later isn't
        // silently bypassed by the back button.
        if (openAdminSectionId === 'audits-view' && typeof closeAuditsView === 'function') {
            closeAuditsView();
        } else if (typeof switchTab === 'function') {
            switchTab('lounge');
        }
        return true;
    }

    // Nothing open in the web layer — let Dart decide (its own
    // double-back-to-exit confirmation).
    return false;
}