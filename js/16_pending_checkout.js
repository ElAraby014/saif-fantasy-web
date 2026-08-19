// ═══════════════════════════════════════════════════════
// MODULE: 16_pending_checkout.js  (Escrow / Pending Checkout System)
//
// Lets staff "lock" a Lounge/VIP/Cafe/Shared session — freeing the
// physical hardware immediately without collecting payment — and move the
// debt into a queue that Admins (3-way resolution) or Staff (checkout-only)
// resolve later.
//
// Loaded AFTER 15_notebook.js, for the exact same reason 15_notebook.js
// loads after 14_language.js: this module calls T()/Tf() directly for all
// of its own strings, so it needs none of 14_language.js's IIFE
// monkey-patches for itself. In exchange it wraps buildConsoles,
// renderSharedSpace, updateUI, refreshDynamicContentForLanguage, and
// showApp itself (all already wrapped once-or-twice by
// 14_language.js/15_notebook.js) — see AI Modification Guide §6 rule 1 in
// the architecture doc.
// ═══════════════════════════════════════════════════════

function _pcGenId() {
    return 'pc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

// ── Native-credential password gate ───────────────────────────────────
// Mirrors 13_employees.js's showAdminPasswordPrompt(), but validates
// against NATIVE_CREDENTIALS (01_config.js) instead of the separate,
// in-app ADMIN_PASSWORD — per the master prompt's §1 and the architecture
// doc's §3.6 (the two password systems must never be conflated).
// onSuccess(username) is called with the resolved staff/admin name so
// callers can stamp "lockedBy"/"resolvedBy" without a second lookup.
function _pcNativeAuthPrompt(actionLabel, onSuccess) {
    const existing = document.getElementById('pc-auth-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'pc-auth-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:340px;">
            <h3 style="margin-top:0; color:var(--accent-cyan); margin-bottom:6px;">🔐 ${T('pc-auth-title')}</h3>
            <p style="color:var(--text-muted); font-size:13px; margin:0 0 14px;">${Tf('pc-auth-body', { action: actionLabel })}</p>
            <label style="color:var(--text-muted); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">${T('pc-auth-label')}</label>
            <input type="password" id="pc-auth-input" placeholder="${T('pc-auth-placeholder')}" style="margin-bottom:6px;" autofocus>
            <div id="pc-auth-error" style="display:none; font-size:12px; color:var(--danger); margin-bottom:10px; padding:8px 12px; background:var(--danger-glow); border-radius:var(--radius-sm); border:1px solid rgba(240,75,75,0.3);">
                ❌ ${T('pc-auth-wrong')}
            </div>
            <div class="modal-actions" style="margin-top:8px; display:flex; gap:10px;">
                <button class="btn-success" id="pc-auth-confirm" style="flex:1;">${T('pc-auth-confirm')}</button>
                <button style="background:transparent; border:1px solid var(--border-color); color:white; flex:1;" id="pc-auth-cancel">${T('pc-auth-cancel')}</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const input   = document.getElementById('pc-auth-input');
    const errDiv  = document.getElementById('pc-auth-error');
    const confirm = document.getElementById('pc-auth-confirm');
    const cancel  = document.getElementById('pc-auth-cancel');

    const attempt = () => {
        const uname = verifyNativeCredential(input.value);
        if (uname) {
            modal.remove();
            onSuccess(uname);
        } else {
            errDiv.style.display = 'block';
            input.value = '';
            input.focus();
        }
    };

    confirm.addEventListener('click', attempt);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
    cancel.addEventListener('click', () => modal.remove());
}

// ── Queue plumbing ─────────────────────────────────────────────────────

function _pcUpdateDotState() {
    const show = pendingCheckoutsQueue.length > 0;
    document.querySelectorAll('.pending-dot').forEach(d => {
        d.style.display = show ? 'block' : 'none';
    });
}

// Posts a system note into the Notebook team chat announcing the lock.
// sendNotebookMessage() (15_notebook.js) reads its text from the composer
// DOM input rather than taking parameters, so instead of fighting that we
// build a note object the same way it does internally and push it through
// the same _nbSaveNote()/notesData path — every reader-side function
// (renderNotebookPanel, updateNotebookDotState, unread rules) works on
// notesData/db.notes directly and doesn't care how a note got there.
function _pcBroadcastLockNotice(rec) {
    if (typeof notesData === 'undefined' || typeof _nbGenId !== 'function' || typeof _nbSaveNote !== 'function') return;

    const label = rec.details.entityName || rec.details.personName || '—';
    const note = {
        id: _nbGenId(),
        author: 'System',
        text: Tf('pc-notebook-broadcast', { name: label, amount: rec.amount.toFixed(2) }),
        timestamp: Date.now(),
        mentionedUser: null,
        readBy: [],
        pinned: false,
        pinnedAt: null,
        unpinnedAt: null,
        unpinnedWithGrace: false,
        edited: false,
        editedAt: null
    };

    notesData.push(note);
    _nbSaveNote(note);

    if (typeof renderNotebookPanel === 'function') renderNotebookPanel();
    if (typeof updateNotebookDotState === 'function') updateNotebookDotState();
    if (typeof _nbIsAdminViewOpen === 'function' && _nbIsAdminViewOpen() && typeof renderNotebookAdminNotes === 'function') {
        renderNotebookAdminNotes();
    }
}

async function _pcPushPending(rec) {
    rec.updatedAt = new Date().toISOString();
    rec.notes = rec.notes || []; // record-attached notes — see 10_finance.js's openRecordReceipt()
    pendingCheckoutsQueue.push(rec);
    await db.pending_checkouts.put(rec);
    _pcUpdateDotState();
    _pcBroadcastLockNotice(rec);
}

// Deletes from the live queue, writes a resolution record to the log, and
// — for 'Checkout' only — posts the income to the finance ledger.
// 'Forgiven' never touches the finance ledger. 'DeductEmployee' also never
// touches it directly here: the actual charge is posted separately by the
// existing Personal Use ▸ Salary Advance flow (13_employees.js
// logPersonalUse()), which the admin completes right after this call.
async function _pcResolve(recId, resolutionType, resolvedBy) {
    const idx = pendingCheckoutsQueue.findIndex(r => r.id === recId);
    if (idx === -1) return null;
    const rec = pendingCheckoutsQueue[idx];

    if (resolutionType === 'Checkout') {
        await saveFinanceRecord('Income', rec.amount, rec.details.description);
    }

    pendingCheckoutsQueue.splice(idx, 1);
    await db.pending_checkouts.delete(recId);

    const logRec = {
        id: _pcGenId(),
        sourceType: rec.sourceType,
        amount: rec.amount,
        timestamp: rec.timestamp,
        resolvedBy: resolvedBy,
        resolutionType: resolutionType, // 'Forgiven' | 'DeductEmployee' | 'Checkout'
        resolvedAt: Date.now(),
        details: rec.details,
        updatedAt: new Date().toISOString() // append-only — always equals creation time
    };
    pendingCheckoutLog.push(logRec);
    await db.pending_checkout_log.put(logRec);

    _pcUpdateDotState();
    return logRec;
}

// ── Cost calculators (mirror endSession()/computeSessionExtras() math so
//    the locked amount always matches what a normal checkout would have
//    charged at that exact moment) ──────────────────────────────────────

function _pcComputeConsoleCost(id) {
    const sess = sessions[id];
    const now = Date.now();
    let singleMs = 0, multiMs = 0, iptvMs = 0, gamingMs = 0;

    sess.segments.forEach(seg => {
        const endTime = seg.end ? seg.end : now;
        const t = endTime - seg.start;
        if (seg.type === 'single') singleMs += t;
        else if (seg.type === 'multi') multiMs += t;
        else if (seg.type === 'iptv') iptvMs += t;
        else if (seg.type === 'gaming') gamingMs += t;
    });

    const consoleObj = ALL_ENTITIES.find(c => c.id === id);
    const isVip = consoleObj.type === 'vip';
    const isPS5 = consoleObj.name.includes('PS5');

    if (isVip) {
        gamingMs += singleMs + multiMs;
        singleMs = 0;
        multiMs = 0;
    }

    const singleHours = (singleMs / 1000) / 3600;
    const multiHours  = (multiMs / 1000) / 3600;
    const iptvHours   = (iptvMs / 1000) / 3600;
    const gamingHours = (gamingMs / 1000) / 3600;

    let rSingle = 0, rMulti = 0, rIptv = 0, rGaming = 0;
    if (isVip) {
        rGaming = isPS5 ? RATE_VIP_PS5 : RATE_VIP_PS4;
        rIptv = RATE_VIP_IPTV;
    } else {
        rSingle = RATE_SINGLE;
        rMulti = RATE_MULTI;
        rIptv = RATE_LOUNGE_IPTV;
        if (isPS5) { rSingle += RATE_PS5_EXTRA; rMulti += RATE_PS5_EXTRA; }
    }

    const singlePrice = Math.round((singleHours * rSingle) * 2) / 2;
    const multiPrice  = Math.round((multiHours * rMulti) * 2) / 2;
    const iptvPrice   = Math.round((iptvHours * rIptv) * 2) / 2;
    const gamingPrice = Math.round((gamingHours * rGaming) * 2) / 2;

    const extras = computeSessionExtras(sess);
    const timeTotal = singlePrice + multiPrice + iptvPrice + gamingPrice;
    const elapsedMins = Math.round((singleMs + multiMs + iptvMs + gamingMs) / 60000);

    const parts = [];
    if (isVip) {
        if (gamingPrice > 0) parts.push(`Gaming: ${gamingPrice}EGP`);
        if (iptvPrice > 0) parts.push(`IPTV: ${iptvPrice}EGP`);
    } else {
        if (singlePrice > 0) parts.push(`S: ${singlePrice}EGP`);
        if (multiPrice > 0) parts.push(`M: ${multiPrice}EGP`);
        if (iptvPrice > 0) parts.push(`IPTV: ${iptvPrice}EGP`);
    }
    if (extras.extrasTotal > 0) {
        parts.push(`Drinks: [${extras.extrasBreakdown.join(', ')}] (${extras.extrasTotal.toFixed(2)}EGP)`);
    }

    return {
        amount: timeTotal + extras.extrasTotal,
        elapsedMins,
        breakdown: parts.join(' | '),
        isVip
    };
}

// ── Lock actions (§3 of the master prompt) ─────────────────────────────

function lockConsoleSession(id) {
    const sess = sessions[id];
    if (!sess || !sess.active) return;
    const consoleObj = ALL_ENTITIES.find(c => c.id === id);
    if (!consoleObj) return;

    _pcNativeAuthPrompt(Tf('pc-action-lock', { name: consoleObj.name }), async (uname) => {
        const calc = _pcComputeConsoleCost(id);

        const rec = {
            id: _pcGenId(),
            sourceType: 'console',
            amount: calc.amount,
            timestamp: Date.now(),
            details: {
                entityId: id,
                entityName: consoleObj.name,
                zone: consoleObj.type,
                description: `${consoleObj.name} Session${calc.breakdown ? ' | ' + calc.breakdown : ''} | ${T('pc-desc-locked-tag')}`,
                breakdownText: calc.breakdown || T('pc-no-charges'),
                elapsedMins: calc.elapsedMins
            },
            lockedBy: uname
        };

        await _pcPushPending(rec);
        // Freeing the Hardware — same call a normal checkout ends with.
        await resetConsole(id);
        customAlert(Tf('pc-al-locked', { name: consoleObj.name, amount: calc.amount.toFixed(2) }), T('pc-al-title-locked'));
    });
}

function lockCafeTable(id) {
    const sess = sessions[id];
    if (!sess) return;
    const consoleObj = ALL_ENTITIES.find(c => c.id === id);
    if (!consoleObj) return;

    const extras = computeSessionExtras(sess);
    if (extras.extrasTotal <= 0) {
        return customAlert(T('al-table-empty'), T('al-title-empty-table'));
    }

    _pcNativeAuthPrompt(Tf('pc-action-lock', { name: consoleObj.name }), async (uname) => {
        const rec = {
            id: _pcGenId(),
            sourceType: 'cafe',
            amount: extras.extrasTotal,
            timestamp: Date.now(),
            details: {
                entityId: id,
                entityName: consoleObj.name,
                description: `${consoleObj.name} Table Order | Drinks: [${extras.extrasBreakdown.join(', ')}] | ${T('pc-desc-locked-tag')}`,
                breakdownText: extras.extrasBreakdown.join(', ')
            },
            lockedBy: uname
        };

        await _pcPushPending(rec);

        // Freeing the Hardware — empty drinks/extras so isTableEmpty()
        // flips back to true and the "Occupied" badge drops on next render.
        sess.drinks = {};
        sess.customExtras = [];
        await db.sessions.update(id, { drinks: {}, custom_extras: [], updated_at: new Date().toISOString() });
        updateUI();

        customAlert(Tf('pc-al-locked', { name: consoleObj.name, amount: extras.extrasTotal.toFixed(2) }), T('pc-al-title-locked'));
    });
}

function lockSharedPerson(tableId, personId) {
    const table = sharedTables[tableId];
    if (!table) return;
    const person = table.occupants.find(p => p.id === personId);
    if (!person) return;

    const timeDiff = Date.now() - person.startTime;
    const hours = timeDiff / (1000 * 60 * 60);
    const timeCost = hours * SHARED_HOURLY_RATE;
    const extras = computeSessionExtras(person);
    const amount = timeCost + extras.extrasTotal;

    _pcNativeAuthPrompt(Tf('pc-action-lock', { name: person.name }), async (uname) => {
        const descParts = [`Time: ${timeCost.toFixed(2)}EGP`];
        if (extras.extrasTotal > 0) {
            descParts.push(`Drinks: [${extras.extrasBreakdown.join(', ')}] (${extras.extrasTotal.toFixed(2)}EGP)`);
        }

        const rec = {
            id: _pcGenId(),
            sourceType: 'shared',
            amount,
            timestamp: Date.now(),
            details: {
                tableId,
                personId,
                personName: person.name,
                tableName: table.name,
                description: `Shared Space - ${table.name} (${person.name}) | ${descParts.join(' | ')} | ${T('pc-desc-locked-tag')}`,
                breakdownText: descParts.join(' | ')
            },
            lockedBy: uname
        };

        await _pcPushPending(rec);

        // Freeing the Hardware — sharedTables now persists to Dexie
        // (Multi-Device Sync plan, Phase 1 — it is no longer pure
        // in-memory state as the comment here previously assumed), so
        // splice the occupant out and write the removal through too.
        table.occupants = table.occupants.filter(p => p.id !== personId);
        if (typeof _persistSharedTable === 'function') await _persistSharedTable(tableId);
        if (currentZone === 'shared') renderSharedSpace();

        customAlert(Tf('pc-al-locked', { name: person.name, amount: amount.toFixed(2) }), T('pc-al-title-locked'));
    });
}

// ── Admin Resolution Hub (§5) ───────────────────────────────────────────

// ── Static label translation ────────────────────────────────────────
// This module loads after 14_language.js and isn't walked by its
// declarative ELEMENT_MAP, so — same pattern as 15_notebook.js's
// openNotebookAdminView() — static labels for the handful of elements
// this feature owns are set directly with T() whenever they're relevant
// (on open, and again on every language toggle via the refresh wrap below).
function _pcApplyStaticLabels() {
    const map = {
        'pc-menu-label-el':          'pc-menu-label',
        'pc-back-label-el':          'pc-back-label',
        'pc-admin-title-el':         'pc-admin-title',
        'pc-admin-desc-el':          'pc-admin-desc',
        'pc-finance-btn-label-el':   'pc-finance-btn-label',
        'pc-finance-modal-title-el': 'pc-finance-modal-title',
        'pc-finance-modal-desc-el':  'pc-finance-modal-desc',
        'pc-finance-modal-close-el': 'pc-finance-modal-close',
        // ── Pending Checkouts ▸ History Log tab bar (added alongside
        // renderPendingCheckoutLog() below) ──
        'pctab-active':              'tab-pending-active',
        'pctab-log':                 'tab-pending-log',
        'pc-log-desc-el':            'pc-log-desc'
    };
    Object.keys(map).forEach(function (elId) {
        const el = document.getElementById(elId);
        if (el) el.innerText = T(map[elId]);
    });
}

function openPendingAdminView() {
    switchTab('none');
    document.getElementById('pending-admin-view').style.display = 'block';
    _pcApplyStaticLabels();
    switchPendingTab('active');
}

// ── Pending Checkouts tab switcher ──────────────────────────────────────
// Same toggle pattern as switchExpensesTab()/switchStockTab()/switchAuditsTab()
// (10_finance.js / 12_stock.js / 04_admin_views.js) — two named panels,
// swap `display` + `.active` on the tab buttons, re-render whichever
// panel becomes visible.
function switchPendingTab(tab) {
    const tabs = ['active', 'log'];
    tabs.forEach(function (t) {
        const panel = document.getElementById('pending-panel-' + t);
        const btn = document.getElementById('pctab-' + t);
        if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });

    if (tab === 'active') renderPendingAdminList();
    if (tab === 'log') renderPendingCheckoutLog();
}

function pcAdminForgive(recId) {
    _pcNativeAuthPrompt(T('pc-action-resolve'), async (uname) => {
        const ok = await _pcResolve(recId, 'Forgiven', uname);
        if (!ok) return;
        renderPendingAdminList();
        customAlert(T('pc-al-forgiven'), T('al-title-success'));
    });
}

function pcAdminDeductEmployee(recId) {
    _pcNativeAuthPrompt(T('pc-action-resolve'), async (uname) => {
        const rec = pendingCheckoutsQueue.find(r => r.id === recId);
        if (!rec) return;
        const amount = rec.amount;
        const desc = rec.details.description;

        const ok = await _pcResolve(recId, 'DeductEmployee', uname);
        if (!ok) return;
        renderPendingAdminList();

        // Jump straight to Employees ▸ Personal Use ▸ Salary Advance,
        // pre-filled with the locked amount, and let the admin pick who
        // it's deducted from.
        switchTab('none');
        document.getElementById('employee-view').style.display = 'block';
        switchEmpTab('personaluse');
        populatePuseSelects();

        const typeSel = document.getElementById('puse-type');
        if (typeSel) { typeSel.value = 'advance'; togglePuseType(); }

        const amtInput = document.getElementById('puse-advance-amount');
        if (amtInput) amtInput.value = amount.toFixed(2);

        const noteInput = document.getElementById('puse-advance-note');
        if (noteInput) noteInput.value = Tf('pc-deduct-note-prefill', { desc });

        customAlert(T('pc-al-deduct-select-employee'), T('pc-al-title-select-employee'));
    });
}

function pcAdminNormalCheckout(recId) {
    _pcNativeAuthPrompt(T('pc-action-resolve'), async (uname) => {
        const ok = await _pcResolve(recId, 'Checkout', uname);
        if (!ok) return;
        renderPendingAdminList();
        customAlert(T('pc-al-checkout-complete'), T('al-title-success'));
    });
}

// ── Staff Resolution Hub (§6 — Finance ▸ Pending Checkouts) ─────────────

function openFinancePendingModal() {
    _pcApplyStaticLabels();
    renderFinancePendingList();
    document.getElementById('finance-pending-modal').style.display = 'flex';
}

function closeFinancePendingModal() {
    document.getElementById('finance-pending-modal').style.display = 'none';
}

function pcStaffNormalCheckout(recId) {
    _pcNativeAuthPrompt(T('pc-action-resolve'), async (uname) => {
        const ok = await _pcResolve(recId, 'Checkout', uname);
        if (!ok) return;
        renderFinancePendingList();
        customAlert(T('pc-al-checkout-complete'), T('al-title-success'));
    });
}

// ── Rendering ────────────────────────────────────────────────────────

function _pcSourceLabel(sourceType) {
    if (sourceType === 'console') return T('pc-src-console');
    if (sourceType === 'cafe') return T('pc-src-cafe');
    if (sourceType === 'shared') return T('pc-src-shared');
    return sourceType;
}

function _pcReceiptBoxHtml(rec, buttonsHtml) {
    const dt = new Date(rec.timestamp);
    const dateStr = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const label = rec.details.entityName || rec.details.personName || '—';
    const noteCount = (typeof getRecordNotes === 'function') ? getRecordNotes(rec).length : 0;
    const noteBadge = noteCount > 0
        ? ` <span style="font-size:11px; color:var(--text-muted); font-weight:400;">📝${noteCount}</span>`
        : '';

    return `
        <div class="pc-receipt-box" style="cursor:pointer;" onclick="if (typeof openRecordReceipt === 'function') openRecordReceipt('pending', '${rec.id}')">
            <div class="pc-receipt-header">
                <span class="pc-receipt-name">${label}${noteBadge}</span>
                <span class="pc-receipt-amount">${rec.amount.toFixed(2)} EGP</span>
            </div>
            <div class="pc-receipt-meta">${_pcSourceLabel(rec.sourceType)} • ${dateStr} • ${T('pc-locked-by')}: ${rec.lockedBy || '—'}</div>
            <div class="pc-receipt-desc">${rec.details.breakdownText || T('pc-no-charges')}</div>
            <div class="pc-receipt-actions" onclick="event.stopPropagation()">${buttonsHtml}</div>
        </div>
    `;
}

function renderPendingAdminList() {
    const container = document.getElementById('pc-admin-list');
    if (!container) return;

    if (pendingCheckoutsQueue.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">${T('pc-empty')}</div>`;
        return;
    }

    container.innerHTML = pendingCheckoutsQueue.map(rec => _pcReceiptBoxHtml(rec, `
        <button class="btn-small" style="background:transparent;border:1px solid var(--border-color);color:var(--text-main);" onclick="pcAdminForgive('${rec.id}')">🙈 ${T('pc-btn-forgive')}</button>
        <button class="btn-small btn-warning" onclick="pcAdminDeductEmployee('${rec.id}')">👤 ${T('pc-btn-deduct')}</button>
        <button class="btn-small btn-success" onclick="pcAdminNormalCheckout('${rec.id}')">💳 ${T('pc-btn-checkout')}</button>
    `)).join('');
}

function _pcResolutionLabel(resolutionType) {
    if (resolutionType === 'Forgiven') return T('pc-resolution-forgiven');
    if (resolutionType === 'DeductEmployee') return T('pc-resolution-deductemployee');
    if (resolutionType === 'Checkout') return T('pc-resolution-checkout');
    return resolutionType;
}

// ── Pending Checkouts ▸ History Log ─────────────────────────────────────
// Resolved receipts only — how each was resolved, by whom, and when.
// Reads straight from the in-memory pendingCheckoutLog[] array (never
// re-reads Dexie mid-session — same never-re-reads convention already
// used for notesData/expenseEditLog/pendingCheckoutsQueue, §4.1 of the
// architecture doc). Reuses the .stock-history-row visual style (same
// look as Purchase History / Modify Expenses ▸ Edit History Log) and
// calls T()/Tf() directly at render time rather than depending on
// 14_language.js's monkey-patch — same deliberate approach the rest of
// this module already uses.
function renderPendingCheckoutLog() {
    const container = document.getElementById('pc-history-log-list');
    if (!container) return;

    const entries = [...pendingCheckoutLog].sort((a, b) => b.resolvedAt - a.resolvedAt);

    if (entries.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">${T('pc-log-empty')}</div>`;
        return;
    }

    container.innerHTML = entries.map(rec => {
        const dt = new Date(rec.resolvedAt);
        const dateTimeStr = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const label = (rec.details && (rec.details.entityName || rec.details.personName)) || '—';

        return `
            <div class="stock-history-row">
                <div class="stock-history-header">
                    <span class="stock-history-title">${label}</span>
                    <span class="stock-history-amount">${rec.amount.toFixed(2)} EGP</span>
                </div>
                <div class="stock-history-meta">
                    ${_pcSourceLabel(rec.sourceType)} • ${_pcResolutionLabel(rec.resolutionType)}<br>
                    ${Tf('pc-resolved-by-at', { user: rec.resolvedBy || '—', time: dateTimeStr })}
                </div>
            </div>
        `;
    }).join('');
}

function renderFinancePendingList() {
    const container = document.getElementById('pc-finance-list');
    if (!container) return;

    if (pendingCheckoutsQueue.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">${T('pc-empty')}</div>`;
        return;
    }

    container.innerHTML = pendingCheckoutsQueue.map(rec => _pcReceiptBoxHtml(rec, `
        <button class="btn-small btn-success" onclick="pcStaffNormalCheckout('${rec.id}')">💳 ${T('pc-btn-checkout')}</button>
    `)).join('');
}

// ── UI injection: lock icon next to existing checkout buttons ─────────
// Post-processes the DOM after buildConsoles()/renderSharedSpace() run,
// rather than duplicating their HTML templates — those functions are
// already the 14_language.js-patched versions by the time this module
// loads, and re-templating them here would silently drift out of sync
// with future edits to 06_sessions.js/11_shared_space.js.

function _pcInjectConsoleLockIcons() {
    if (currentZone === 'cafe') {
        CAFE_TABLES.forEach(c => {
            const card = document.getElementById('card-' + c.id);
            if (!card) return;
            const titleGroup = card.querySelector('.console-title-group');
            if (!titleGroup || titleGroup.querySelector('.pc-lock-icon-btn')) return;
            const btn = _pcBuildLockIconBtn(() => lockCafeTable(c.id));
            titleGroup.appendChild(btn);
        });
    } else if (currentZone === 'lounge' || currentZone === 'vip') {
        const list = currentZone === 'lounge' ? LOUNGE_CONSOLES : VIP_CONSOLES;
        list.forEach(c => {
            const card = document.getElementById('card-' + c.id);
            if (!card) return;
            const titleGroup = card.querySelector('.console-title-group');
            if (!titleGroup || titleGroup.querySelector('.pc-lock-icon-btn')) return;
            const btn = _pcBuildLockIconBtn(() => lockConsoleSession(c.id));
            // Only meaningful while this unit actually has an active session
            // to lock — kept in sync afterwards by _pcSyncLockIconVisibility()
            // (called from the updateUI wrap below) rather than rebuilt here,
            // since buildConsoles() only reruns on a zone switch, not every tick.
            const sess = sessions[c.id];
            btn.style.display = (sess && sess.active) ? 'inline-flex' : 'none';
            titleGroup.appendChild(btn);
        });
    }
}

function _pcInjectSharedLockIcons() {
    Object.keys(sharedTables).forEach(tableId => {
        sharedTables[tableId].occupants.forEach(person => {
            const statsEl = document.getElementById('shared-stats-' + person.id);
            if (!statsEl) return;
            const row = statsEl.closest ? statsEl.closest('.occupant-row') : null;
            if (!row) return;
            const nameGroup = row.querySelector('.occupant-name-group');
            if (!nameGroup || nameGroup.querySelector('.pc-lock-icon-btn')) return;
            const btn = _pcBuildLockIconBtn(() => lockSharedPerson(tableId, person.id));
            btn.classList.add('pc-lock-icon-btn-small');
            nameGroup.appendChild(btn);
        });
    });
}

// Icon-only lock button — same visual language as the header's globe/
// notebook icons (transparent, borderless, accent-cyan) rather than the
// old full-width dashed button. Tooltip carries the accessible label
// since there's no longer visible text beside the icon.
function _pcBuildLockIconBtn(onClick) {
    const btn = document.createElement('button');
    btn.className = 'pc-lock-icon-btn';
    btn.type = 'button';
    btn.title = T('pc-lock-tooltip');
    btn.innerText = '🔒';
    btn.onclick = onClick;
    return btn;
}

// Console/VIP lock icons are only meaningful while that unit has an
// active session — this keeps their visibility in sync on every tick
// without needing to rebuild the whole card (buildConsoles() only runs
// on a zone switch). Cafe table icons have no such condition and are
// always shown once injected.
function _pcSyncLockIconVisibility() {
    if (currentZone !== 'lounge' && currentZone !== 'vip') return;
    const list = currentZone === 'lounge' ? LOUNGE_CONSOLES : VIP_CONSOLES;
    list.forEach(c => {
        const card = document.getElementById('card-' + c.id);
        if (!card) return;
        const btn = card.querySelector('.pc-lock-icon-btn');
        if (!btn) return;
        const sess = sessions[c.id];
        btn.style.display = (sess && sess.active) ? 'inline-flex' : 'none';
    });
}

// ── Wrapping (module load time) ────────────────────────────────────────

(function () {
    const _origBuildConsoles = window.buildConsoles;
    if (typeof _origBuildConsoles === 'function') {
        window.buildConsoles = function () {
            _origBuildConsoles.apply(this, arguments);
            _pcInjectConsoleLockIcons();
        };
    }

    const _origRenderSharedSpace = window.renderSharedSpace;
    if (typeof _origRenderSharedSpace === 'function') {
        window.renderSharedSpace = function () {
            _origRenderSharedSpace.apply(this, arguments);
            _pcInjectSharedLockIcons();
        };
    }

    // Keeps a console/VIP unit's lock icon shown/hidden in step with its
    // active-session state on every 1s tick (07_timer.js), since
    // buildConsoles() itself only reruns on a zone switch — it never
    // rebuilds cards just because a session started/ended.
    const _origUpdateUI = window.updateUI;
    if (typeof _origUpdateUI === 'function') {
        window.updateUI = function () {
            _origUpdateUI.apply(this, arguments);
            _pcSyncLockIconVisibility();
        };
    }

    // Re-render whichever pending list is currently open when the
    // language toggles — same pattern 15_notebook.js uses for its own
    // panels (§7 of the master prompt / architecture doc §6 rule 2).
    const _origRefresh = window.refreshDynamicContentForLanguage;
    if (typeof _origRefresh === 'function') {
        window.refreshDynamicContentForLanguage = function () {
            _origRefresh.apply(this, arguments);
            _pcApplyStaticLabels();
            const adminView = document.getElementById('pending-admin-view');
            if (adminView && adminView.style.display !== 'none') {
                const logPanel = document.getElementById('pending-panel-log');
                if (logPanel && logPanel.style.display !== 'none') {
                    renderPendingCheckoutLog();
                } else {
                    renderPendingAdminList();
                }
            }
            const financeModal = document.getElementById('finance-pending-modal');
            if (financeModal && financeModal.style.display === 'flex') renderFinancePendingList();
        };
    }

    // Refresh the red-dot state once the app becomes visible (covers the
    // case where pending receipts survived a logout/login cycle), and set
    // the always-visible static labels (sidebar entry, Finance button).
    const _origShowApp = window.showApp;
    if (typeof _origShowApp === 'function') {
        window.showApp = function () {
            _origShowApp.apply(this, arguments);
            _pcUpdateDotState();
            _pcApplyStaticLabels();
        };
    }
})();