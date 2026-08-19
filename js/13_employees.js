// MODULE: 13_employees.js
// Employees, Personal Use, Payroll / Month-End
// ═══════════════════════════════════════════════════════

// ── State ─────────────────────────────────────────────
let employees        = JSON.parse(localStorage.getItem('employees'))         || [];
let personalUseLog   = JSON.parse(localStorage.getItem('personal_use_log'))  || [];

// Admin password is now cloud-backed via 01_config.js's unified
// verifyAppCredential() (Supabase app_credentials table, offline-cached).
// This wraps it with a role check since both call sites below only ever
// wanted "is this a valid ADMIN password", not any staff password.
function _isValidAdminPassword(pw) {
    const result = verifyAppCredential(pw);
    return !!(result && result.role === 'admin');
}

// Mirrors `employees`/`personalUseLog` to localStorage only. This is
// NOT hooked into sync (harmless), so it's still safe to call after every
// edit. It deliberately does NOT touch Dexie anymore — a full clear+bulkPut
// here used to fire the sync `deleting` hook for every existing row on
// every single edit (pushing a DELETE to Supabase for every employee/
// personal-use-log entry) followed by a `creating` hook for all of them
// again, as two separate un-ordered network calls. Under network jitter a
// delete could land after the recreate-upsert and permanently wipe a
// record on every other device. See Sync_Bugs_And_Fix_Plan.md, Bug 1.
// Actual persistence now happens via the targeted _persistEmployee() /
// _deleteEmployeeRecord() / _persistPersonalUseEntry() helpers below,
// called at each call site with only the record that actually changed.
function saveEmployeeState() {
    localStorage.setItem('employees',        JSON.stringify(employees));
    localStorage.setItem('personal_use_log', JSON.stringify(personalUseLog));
}

async function _persistEmployee(emp) {
    try { await db.employees.put(emp); }
    catch (err) { console.error('_persistEmployee Dexie write failed:', err); }
}

async function _deleteEmployeeRecord(id) {
    try { await db.employees.delete(id); }
    catch (err) { console.error('_deleteEmployeeRecord Dexie write failed:', err); }
}

async function _persistPersonalUseEntry(entry) {
    try { await db.personal_use_log.put(entry); }
    catch (err) { console.error('_persistPersonalUseEntry Dexie write failed:', err); }
}

// ── Admin Password Gate ───────────────────────────────
// Shows a small inline password prompt modal, then calls onSuccess() if correct.
function showAdminPasswordPrompt(actionLabel, onSuccess) {
    // Reuse finalize-month modal infrastructure: build a dedicated mini-modal
    const existing = document.getElementById('emp-admin-pw-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'emp-admin-pw-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:340px;">
            <h3 style="margin-top:0; color:var(--accent-cyan); margin-bottom:6px;">🔐 Admin Required</h3>
            <p style="color:var(--text-muted); font-size:13px; margin:0 0 14px;">Enter admin password to <strong style="color:var(--text-main);">${actionLabel}</strong>.</p>
            <label style="color:var(--text-muted); font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">Admin Password</label>
            <input type="password" id="emp-admin-pw-input" placeholder="Enter password…" style="margin-bottom:6px;" autofocus>
            <div id="emp-admin-pw-error" style="display:none; font-size:12px; color:var(--danger); margin-bottom:10px; padding:8px 12px; background:var(--danger-glow); border-radius:var(--radius-sm); border:1px solid rgba(240,75,75,0.3);">
                ❌ Incorrect password. Please try again.
            </div>
            <div class="modal-actions" style="margin-top:8px; display:flex; gap:10px;">
                <button class="btn-success" id="emp-admin-pw-confirm" style="flex:1;">Confirm</button>
                <button style="background:transparent; border:1px solid var(--border-color); color:white; flex:1;" id="emp-admin-pw-cancel">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    const input   = document.getElementById('emp-admin-pw-input');
    const errDiv  = document.getElementById('emp-admin-pw-error');
    const confirm = document.getElementById('emp-admin-pw-confirm');
    const cancel  = document.getElementById('emp-admin-pw-cancel');

    const attempt = () => {
        if (_isValidAdminPassword(input.value)) {
            modal.remove();
            onSuccess();
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

// ── Navigation ────────────────────────────────────────

function openEmployeeView() {
    switchTab('none');
    document.getElementById('employee-view').style.display = 'block';
    switchEmpTab('employees');
}

function switchEmpTab(tab) {
    ['employees', 'personaluse', 'loginhistory'].forEach(t => {
        document.getElementById('emp-panel-' + t).style.display = (t === tab) ? 'block' : 'none';
        const btn = document.getElementById('etab-' + t);
        if (btn) btn.classList.toggle('active', t === tab);
    });
    if (tab === 'employees')    renderEmpList();
    if (tab === 'personaluse')  { populatePuseSelects(); renderPersonalUseLog(); }
    if (tab === 'loginhistory') { populateLoginHistoryFilter(); renderLoginHistory(); }
}

// ── Add / Edit / Delete Employees ────────────────────

function addEmployee() {
    const name   = document.getElementById('emp-add-name').value.trim();
    const salary = parseFloat(document.getElementById('emp-add-salary').value);

    if (!name)              return customAlert(T('al-enter-name'), T('al-title-missing-field'));
    if (isNaN(salary) || salary < 0) return customAlert(T('al-invalid-salary'), T('al-title-missing-field'));

    const newEmp = {
        id:             Date.now(),
        name,
        salary,
        monthDeductions: 0,   // cumulative deductions this month
        updatedAt: new Date().toISOString()
    };
    employees.push(newEmp);
    saveEmployeeState();
    _persistEmployee(newEmp);

    document.getElementById('emp-add-name').value   = '';
    document.getElementById('emp-add-salary').value = '';
    renderEmpList();
}

function openEditEmployeeModal(id) {
    const emp = employees.find(e => e.id === id);
    if (!emp) return;

    showAdminPasswordPrompt('Edit Employee', () => {
        document.getElementById('edit-emp-id').value     = id;
        document.getElementById('edit-emp-name').value   = emp.name;
        document.getElementById('edit-emp-salary').value = emp.salary;
        document.getElementById('edit-emp-modal').style.display = 'flex';
    });
}

function saveEditEmployee() {
    const id     = parseInt(document.getElementById('edit-emp-id').value);
    const name   = document.getElementById('edit-emp-name').value.trim();
    const salary = parseFloat(document.getElementById('edit-emp-salary').value);

    if (!name)                   return customAlert(T('al-enter-name'), T('al-title-missing-field'));
    if (isNaN(salary) || salary < 0) return customAlert(T('al-invalid-salary'), T('al-title-missing-field'));

    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    emp.name   = name;
    emp.salary = salary;
    emp.updatedAt = new Date().toISOString();
    saveEmployeeState();
    _persistEmployee(emp);
    document.getElementById('edit-emp-modal').style.display = 'none';
    renderEmpList();
}

function deleteEmployee(id) {
    showAdminPasswordPrompt('Delete Employee', () => {
        showConfirm(T('cf-delete-employee'), () => {
            employees = employees.filter(e => e.id !== id);
            saveEmployeeState();
            _deleteEmployeeRecord(id);
            renderEmpList();
        });
    });
}

function renderEmpList() {
    const container = document.getElementById('emp-list');
    container.innerHTML = '';

    if (employees.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">No employees added yet.</div>`;
        return;
    }

    employees.forEach(emp => {
        const net = Math.max(0, emp.salary - (emp.monthDeductions || 0));
        container.innerHTML += `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                    <div>
                        <div style="font-size:15px; font-weight:700; color:var(--text-main);">${emp.name}</div>
                        <div style="font-size:12px; color:var(--text-muted);">Salary: ${emp.salary.toFixed(2)} EGP/mo</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px; color:var(--danger);">−${(emp.monthDeductions||0).toFixed(2)} EGP</div>
                        <div style="font-size:14px; font-weight:700; color:var(--success);">Net: ${net.toFixed(2)} EGP</div>
                    </div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button onclick="openEditEmployeeModal(${emp.id})" style="background:transparent; border:1px solid var(--border-color); color:var(--text-muted); width:auto; padding:7px 12px; font-size:12px; border-radius:8px; flex:1;">✏️ Edit</button>
                    <button onclick="deleteEmployee(${emp.id})" class="btn-danger" style="width:auto; padding:7px 12px; font-size:12px; border-radius:8px; flex:1;">🗑 Remove</button>
                </div>
            </div>
        `;
    });
}

// ── Personal Use ──────────────────────────────────────

function populatePuseSelects() {
    // Employee select
    const empSel = document.getElementById('puse-emp-select');
    const filterSel = document.getElementById('puse-filter-emp');
    empSel.innerHTML    = '<option value="">— Select Employee —</option>';
    filterSel.innerHTML = '<option value="">All Employees</option>';

    employees.forEach(emp => {
        empSel.innerHTML    += `<option value="${emp.id}">${emp.name}</option>`;
        filterSel.innerHTML += `<option value="${emp.id}">${emp.name}</option>`;
    });

    // Item select
    const itemSel = document.getElementById('puse-item-select');
    itemSel.innerHTML = '<option value="">— Select Item —</option>';
    for (let key in DRINKS_MENU) {
        const item = DRINKS_MENU[key];
        itemSel.innerHTML += `<option value="${key}">${item.name} (${item.price} EGP)</option>`;
    }
}

function togglePuseType() {
    const type = document.getElementById('puse-type').value;
    document.getElementById('puse-item-fields').style.display    = (type === 'item')    ? 'block' : 'none';
    document.getElementById('puse-advance-fields').style.display = (type === 'advance') ? 'block' : 'none';
    document.getElementById('puse-total-preview').style.display  = 'none';
    document.getElementById('puse-charge-preview').innerHTML     = '';
}

function updatePuseCharge() {
    const key  = document.getElementById('puse-item-select').value;
    const mode = document.getElementById('puse-charge-mode').value;
    const qty  = parseInt(document.getElementById('puse-qty').value) || 1;
    const customRow = document.getElementById('puse-custom-amount-row');

    customRow.style.display = mode === 'custom' ? 'block' : 'none';

    if (!key) return;
    const item = DRINKS_MENU[key];
    if (!item) return;

    let charge = 0;
    if      (mode === 'half')   charge = (item.price * 0.5) * qty;
    else if (mode === 'full')   charge = item.price * qty;
    else if (mode === 'free')   charge = 0;
    else if (mode === 'custom') {
        const custom = parseFloat(document.getElementById('puse-custom-amount').value) || 0;
        charge = custom * qty;
    }

    document.getElementById('puse-charge-preview').innerHTML =
        `<span style="color:var(--text-muted);">Unit charge: <strong style="color:var(--accent-cyan);">${(charge/qty).toFixed(2)} EGP</strong></span>`;

    const totalDiv = document.getElementById('puse-total-preview');
    totalDiv.style.display = 'flex';
    document.getElementById('puse-total-display').textContent = `${charge.toFixed(2)} EGP`;
}

async function logPersonalUse() {
    const empId = parseInt(document.getElementById('puse-emp-select').value);
    const type  = document.getElementById('puse-type').value;
    const emp   = employees.find(e => e.id === empId);

    if (!emp) return customAlert(T('al-select-employee'), T('al-title-missing-field'));

    const d = new Date();
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const user    = sessionStorage.getItem('gaming_user') || 'Unknown';

    let entry = { id: Date.now(), empId, empName: emp.name, type, date: dateStr, time: timeStr, loggedBy: user };

    if (type === 'item') {
        const key  = document.getElementById('puse-item-select').value;
        const mode = document.getElementById('puse-charge-mode').value;
        const qty  = parseInt(document.getElementById('puse-qty').value) || 1;
        if (!key) return customAlert(T('al-select-menu-item'), T('al-title-missing-field'));

        const item  = DRINKS_MENU[key];
        let   charge = 0;
        if      (mode === 'half')   charge = (item.price * 0.5) * qty;
        else if (mode === 'full')   charge = item.price * qty;
        else if (mode === 'free')   charge = 0;
        else if (mode === 'custom') {
            charge = (parseFloat(document.getElementById('puse-custom-amount').value) || 0) * qty;
        }

        entry.itemKey  = key;
        entry.itemName = item.name;
        entry.qty      = qty;
        entry.mode     = mode;
        entry.charge   = charge;
        entry.label    = `${item.name} ×${qty} (${mode})`;

        // Deduct from stock if traceable
        if (stockTraceable[key]) {
            if (!stockLevels[key]) stockLevels[key] = 0;
            stockLevels[key] = Math.max(0, stockLevels[key] - qty);
            saveStockState();
        }

    } else if (type === 'advance') {
        const amount = parseFloat(document.getElementById('puse-advance-amount').value);
        const note   = document.getElementById('puse-advance-note').value.trim();
        if (!amount || amount <= 0) return customAlert(T('al-invalid-advance-amount'), T('al-title-missing-field'));

        entry.charge = amount;
        entry.label  = `Salary Advance${note ? ' — ' + note : ''}`;

        // Cash actually leaves the drawer today, so it must hit the Finance
        // ledger today too — not just as a deduction against month-end
        // payroll. Without this, daily physical cash vs. the app's numbers
        // drift by the advance amount until the month is finalized.
        // (No double-count: confirmFinalizeMonth() still pays out
        // salary - monthDeductions, i.e. only what's left AFTER this advance.)
        // The two records are linked in both directions so that editing
        // the amount later, from Modify Expenses, can keep this entry and
        // the employee's deductions in sync instead of silently drifting.
        entry.financeRecordId = await saveFinanceRecord(
            'Expense', amount, `${entry.label} — ${emp.name}`, entry.id
        );
    }

    // Add deduction to employee
    emp.monthDeductions = (emp.monthDeductions || 0) + entry.charge;
    emp.updatedAt = new Date().toISOString();
    personalUseLog.push(entry);
    saveEmployeeState();
    _persistEmployee(emp);
    _persistPersonalUseEntry(entry);

    // Reset form — clear all fields and restore default visibility
    document.getElementById('puse-emp-select').value         = '';
    document.getElementById('puse-type').value               = 'item';
    document.getElementById('puse-item-select').value        = '';
    document.getElementById('puse-qty').value                = '1';
    document.getElementById('puse-charge-mode').value        = 'half';
    document.getElementById('puse-custom-amount').value      = '';
    document.getElementById('puse-advance-amount').value     = '';
    document.getElementById('puse-advance-note').value       = '';
    document.getElementById('puse-total-preview').style.display    = 'none';
    document.getElementById('puse-charge-preview').innerHTML       = '';
    document.getElementById('puse-item-fields').style.display      = 'block';
    document.getElementById('puse-advance-fields').style.display   = 'none';
    document.getElementById('puse-custom-amount-row').style.display = 'none';

    renderPersonalUseLog();
    renderEmpList();

    customAlert(Tf('al-personal-use-logged', { label: entry.label, charge: entry.charge.toFixed(2), name: emp.name }), T('al-title-personal-use-logged'));
}

function renderPersonalUseLog() {
    const container = document.getElementById('puse-history-list');
    const filterEmp = document.getElementById('puse-filter-emp').value;
    container.innerHTML = '';

    let log = [...personalUseLog].sort((a, b) => b.id - a.id);
    if (filterEmp) log = log.filter(e => e.empId === parseInt(filterEmp));

    if (log.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">No entries yet.</div>`;
        return;
    }

    let inner = '';
    log.forEach(r => {
        inner += `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px 14px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                    <div style="font-size:14px; font-weight:600; color:var(--text-main);">${r.empName}</div>
                    <div style="font-size:14px; font-weight:700; color:var(--warning);">−${r.charge.toFixed(2)} EGP</div>
                </div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">
                    ${r.label}<br>
                    ${r.date} ${r.time} &nbsp;•&nbsp; ${r.loggedBy}
                </div>
            </div>
        `;
    });
    container.innerHTML = `<div style="max-height:350px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--accent-cyan) transparent;">${inner}</div>`;
}

// ── Month-End Payroll ─────────────────────────────────

function openFinalizeMonthModal() {
    if (employees.length === 0) return customAlert(T('al-no-employees-finalize'), T('al-title-payroll'));

    let summaryHtml = '';
    let totalPayout = 0;

    employees.forEach(emp => {
        const deductions = emp.monthDeductions || 0;
        const net        = Math.max(0, emp.salary - deductions);
        totalPayout     += net;
        summaryHtml += `
            <div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding:8px 0; font-size:13px;">
                <div>
                    <strong style="color:var(--text-main);">${emp.name}</strong><br>
                    <span style="color:var(--text-muted);">Salary ${emp.salary} − Deductions ${deductions.toFixed(2)}</span>
                </div>
                <strong style="color:var(--success);">${net.toFixed(2)} EGP</strong>
            </div>
        `;
    });

    summaryHtml += `
        <div style="display:flex; justify-content:space-between; padding-top:12px; font-size:16px; font-weight:700;">
            <span style="color:var(--text-muted);">Total Cash Out</span>
            <span style="color:var(--warning);">${totalPayout.toFixed(2)} EGP</span>
        </div>
    `;

    document.getElementById('finalize-month-summary').innerHTML = summaryHtml;
    document.getElementById('finalize-admin-pw').value          = '';
    document.getElementById('finalize-pw-error').style.display  = 'none';
    document.getElementById('finalize-month-modal').style.display = 'flex';
}

async function confirmFinalizeMonth() {
    const pw = document.getElementById('finalize-admin-pw').value;
    if (!_isValidAdminPassword(pw)) {
        document.getElementById('finalize-pw-error').style.display = 'block';
        return;
    }
    document.getElementById('finalize-pw-error').style.display = 'none';

    const d = new Date();
    const monthLabel = d.toLocaleString('default', { month: 'long', year: 'numeric' });

    for (const emp of employees) {
        const deductions = emp.monthDeductions || 0;
        const net        = Math.max(0, emp.salary - deductions);
        const desc       = `Payroll — ${emp.name} — ${monthLabel} (Salary: ${emp.salary} EGP, Deductions: ${deductions.toFixed(2)} EGP)`;
        await saveFinanceRecord('Expense', net, desc);
        if (deductions !== 0) {
            emp.monthDeductions = 0; // reset for new month
            emp.updatedAt = new Date().toISOString();
            await _persistEmployee(emp); // only employees that actually changed
        }
    }

    saveEmployeeState();
    closeFinalizeMonthModal();
    renderEmpList();
    customAlert(Tf('al-payroll-finalized', { month: monthLabel }), T('al-title-payroll-finalized'));
}

function closeFinalizeMonthModal() {
    document.getElementById('finalize-month-modal').style.display = 'none';
}

// ── Charge Employee (Stock Adjustment hook) ───────────

let _pendingChargeItemKey  = null;
let _pendingChargeItemQty  = 1;
let _pendingChargeCallback = null;

function openChargeEmployeeModal(itemKey, qty, callback) {
    _pendingChargeItemKey  = itemKey;
    _pendingChargeItemQty  = qty || 1;
    _pendingChargeCallback = callback || null;

    const item   = DRINKS_MENU[itemKey];
    const ctx    = item ? `${qty}× ${item.name} (menu: ${item.price} EGP/unit)` : itemKey;
    document.getElementById('charge-emp-context').textContent = ctx;

    // Populate employee select
    const sel = document.getElementById('charge-emp-select');
    sel.innerHTML = '<option value="">— Select Employee —</option>';
    employees.forEach(emp => { sel.innerHTML += `<option value="${emp.id}">${emp.name}</option>`; });

    document.getElementById('charge-emp-mode').value            = 'half';
    document.getElementById('charge-emp-preview').style.display = 'none';
    document.getElementById('charge-emp-modal').style.display   = 'flex';
}

function updateChargePreview() {
    const empId = document.getElementById('charge-emp-select').value;
    const mode  = document.getElementById('charge-emp-mode').value;
    const item  = _pendingChargeItemKey ? DRINKS_MENU[_pendingChargeItemKey] : null;

    if (!empId || !item) {
        document.getElementById('charge-emp-preview').style.display = 'none';
        return;
    }

    let charge = 0;
    if      (mode === 'half') charge = (item.price * 0.5) * _pendingChargeItemQty;
    else if (mode === 'full') charge = item.price * _pendingChargeItemQty;
    else                      charge = 0;

    document.getElementById('charge-emp-amount-display').textContent  = `${charge.toFixed(2)} EGP`;
    document.getElementById('charge-emp-preview').style.display        = 'flex';
}

function confirmChargeEmployee() {
    const empId = parseInt(document.getElementById('charge-emp-select').value);
    const mode  = document.getElementById('charge-emp-mode').value;
    const emp   = employees.find(e => e.id === empId);
    const item  = _pendingChargeItemKey ? DRINKS_MENU[_pendingChargeItemKey] : null;

    if (emp && item && mode !== 'free') {
        let charge = 0;
        if      (mode === 'half') charge = (item.price * 0.5) * _pendingChargeItemQty;
        else if (mode === 'full') charge = item.price * _pendingChargeItemQty;

        if (charge > 0) {
            emp.monthDeductions = (emp.monthDeductions || 0) + charge;
            emp.updatedAt = new Date().toISOString();
            personalUseLog.push({
                id: Date.now(), empId, empName: emp.name,
                type: 'item', itemKey: _pendingChargeItemKey,
                itemName: item.name, qty: _pendingChargeItemQty, mode, charge,
                label: `${item.name} ×${_pendingChargeItemQty} (adjustment charge — ${mode})`,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                loggedBy: sessionStorage.getItem('gaming_user') || 'Unknown',
                updatedAt: new Date().toISOString()
            });
            saveEmployeeState();
            _persistEmployee(emp);
            _persistPersonalUseEntry(personalUseLog[personalUseLog.length - 1]);
        }
    }

    document.getElementById('charge-emp-modal').style.display = 'none';
    if (_pendingChargeCallback) _pendingChargeCallback();
    _pendingChargeCallback = null;
}

// ── Login / Logout History ─────────────────────────────
// Reads from `loginHistory` (state + persistence lives in 01_config.js,
// entries are written by recordLoginEvent() on login and on logout).

function populateLoginHistoryFilter() {
    const sel = document.getElementById('login-history-filter');
    if (!sel) return;
    const current = sel.value;

    // Build a unique, sorted list of users who appear in the history
    const users = [...new Set(loginHistory.map(e => e.user))].sort((a, b) => a.localeCompare(b));

    sel.innerHTML = `<option value="">${T('lbl-login-filter-all')}</option>`;
    users.forEach(u => { sel.innerHTML += `<option value="${u}">${u}</option>`; });

    // Restore previous selection if it's still valid
    if (users.includes(current)) sel.value = current;
}

function renderLoginHistory() {
    const container  = document.getElementById('login-history-list');
    const filterSel   = document.getElementById('login-history-filter');
    const filterUser  = filterSel ? filterSel.value : '';
    if (!container) return;

    container.innerHTML = '';

    let log = [...loginHistory].sort((a, b) => b.timestamp - a.timestamp);
    if (filterUser) log = log.filter(e => e.user === filterUser);

    if (log.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">${T('lbl-no-login-history')}</div>`;
        return;
    }

    let inner = '';
    log.forEach(r => {
        const isLogin = r.action === 'login';
        const badgeColor = isLogin ? 'var(--success)' : 'var(--danger)';
        const badgeIcon  = isLogin ? '🟢' : '🔴';
        const badgeLabel = isLogin ? T('badge-login') : T('badge-logout');

        inner += `
            <div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px 14px; margin-bottom:8px;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                    <div style="font-size:14px; font-weight:600; color:var(--text-main);">${r.user}</div>
                    <div style="font-size:13px; font-weight:700; color:${badgeColor};">${badgeIcon} ${badgeLabel}</div>
                </div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.5;">
                    ${T('lbl-role')} ${r.role} &nbsp;•&nbsp; ${r.date} ${r.time}
                </div>
            </div>
        `;
    });
    container.innerHTML = `<div style="max-height:350px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--accent-cyan) transparent;">${inner}</div>`;
}

function clearLoginHistory() {
    showAdminPasswordPrompt('Clear Login History', () => {
        showConfirm(T('cf-clear-login-history'), () => {
            loginHistory = [];
            saveLoginHistory();
            renderLoginHistory();
            populateLoginHistoryFilter();
        });
    });
}