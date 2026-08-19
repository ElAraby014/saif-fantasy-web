// ═══════════════════════════════════════════════════════
// MODULE: 10_finance.js
// Lines 1417–1749 of original script.js
// ═══════════════════════════════════════════════════════


// ── Business-day helpers (store closes at 04:00 AM) ─────
// The store's "day" runs 04:00 → 03:59:59 the next calendar day, not
// midnight-to-midnight. Any timestamp before 04:00 local time belongs to
// the PREVIOUS business day. This is the single source of truth for that
// boundary — both the admin Day/Month/Total filter and the normal-user
// "Today" view call these, so they can never disagree on which day a
// record belongs to. Do not duplicate this logic elsewhere.
//
// Finance records don't carry a raw timestamp field in memory (only a
// pre-formatted `date`/`time` display string), but `record.id` is set to
// `Date.now()` at the exact moment of creation (see saveFinanceRecord()
// below), so it doubles as that record's true creation timestamp.
function getBusinessDayKey(timestampOrDate) {
    const d = new Date(timestampOrDate);
    const shifted = new Date(d.getTime() - (4 * 60 * 60 * 1000));
    return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}-${String(shifted.getDate()).padStart(2, '0')}`;
}

function getBusinessMonthKey(timestampOrDate) {
    return getBusinessDayKey(timestampOrDate).slice(0, 7); // 'YYYY-MM'
}

function formatBusinessMonthLabel(monthKey) {
    const parts = monthKey.split('-');
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Role check — mirrors the 'gaming_role' sessionStorage flag set by
// window.initializeAuthenticatedSession() (01_config.js) and already relied
// on elsewhere in the app (e.g. hamburger admin-menu visibility).
function isAdminUser() {
    return sessionStorage.getItem('gaming_role') === 'admin';
}

// Admin-only Day/Month/Total ledger grouping. In-memory only — deliberately
// not persisted to Dexie/localStorage; always resets to 'day' on reload.
let _financeFilterMode = 'day'; // 'day' | 'month' | 'total'

function setFinanceFilterMode(mode) {
    if (['day', 'month', 'total'].indexOf(mode) === -1) return;
    _financeFilterMode = mode;

    ['day', 'month', 'total'].forEach(function (m) {
        const btn = document.getElementById('finance-filter-' + m);
        if (btn) btn.classList.toggle('active', m === mode);
    });

    updateFinanceUI();
}

async function addManualExpense() {
    const expense = parseFloat(document.getElementById('entry-expense').value);
    const comment = document.getElementById('entry-expense-comment').value.trim();

    if (!expense || expense <= 0) {
        customAlert(T('al-invalid-expense-amount'), T('al-title-invalid-input'));
        return;
    }

    const finalComment = comment !== '' ? comment : 'Manual Entry';

    await saveFinanceRecord('Expense', expense, finalComment);
    
    document.getElementById('entry-expense').value = '';
    document.getElementById('entry-expense-comment').value = '';
    
    customAlert(T('al-expense-recorded'), T('al-title-success'));
}

async function saveFinanceRecord(type, amount, desc, linkedId = null) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const currentUser = sessionStorage.getItem('gaming_user') || 'Unknown';

    const recordId = Date.now();
    
    const record = {
        id: recordId,
        date: dateStr,
        time: timeStr,
        type: type, 
        amount: amount,
        description: desc,
        user: currentUser,
        linkedId: linkedId,   // optional cross-reference, e.g. a personalUseLog entry id
        notes: []             // record-attached notes — see openRecordReceipt()/submitRecordNote()
    };

    financialData.push(record);
    updateFinanceUI();

    await db.financial_data.put({
        id: recordId,
        date: dateStr,
        time: timeStr,
        type: type,
        amount: amount,
        description: desc,
        logged_by: currentUser,
        linked_id: linkedId,
        notes: [],
        updated_at: new Date().toISOString()
    });

    // Callers that need to keep another record in sync with edits made
    // later in Modify Expenses (e.g. logPersonalUse) use this to store
    // a back-reference to this finance record.
    return recordId;
}

function updateFinanceUI() {
    // Top summary cards (NET PROFIT / INCOME / EXPENSES) always reflect
    // all-time totals for every role — unaffected by the admin filter below,
    // which only changes how the ledger underneath is grouped.
    let totalIncome = 0;
    let totalExpense = 0;
    financialData.forEach(record => {
        if (record.type === 'Income') totalIncome += record.amount;
        if (record.type === 'Expense') totalExpense += record.amount;
    });

    const netProfit = totalIncome - totalExpense;
    document.getElementById('sum-income').innerText = totalIncome.toFixed(2) + ' EGP';
    document.getElementById('sum-expense').innerText = totalExpense.toFixed(2) + ' EGP';

    const profitElement = document.getElementById('sum-profit');
    profitElement.innerText = netProfit.toFixed(2) + ' EGP';
    profitElement.className = 'amount ' + (netProfit >= 0 ? 'profit-positive' : 'profit-negative');

    const admin = isAdminUser();
    const filterToggle = document.getElementById('finance-filter-toggle');
    const ledgerContainer = document.getElementById('finance-table');
    const todayContainer = document.getElementById('finance-today-view');

    if (admin) {
        if (filterToggle) filterToggle.style.display = 'flex';
        if (ledgerContainer) ledgerContainer.style.display = 'block';
        if (todayContainer) todayContainer.style.display = 'none';
        renderAdminLedger();
    } else {
        if (filterToggle) filterToggle.style.display = 'none';
        if (ledgerContainer) ledgerContainer.style.display = 'none';
        if (todayContainer) todayContainer.style.display = 'block';
        renderTodayFinanceView();
    }
}

// ── Admin ledger — grouped by Day / Month / Total per _financeFilterMode ──
function renderAdminLedger() {
    const tbody = document.getElementById('records-body');
    tbody.innerHTML = '';

    const sortedRecords = [...financialData].sort((a, b) => b.id - a.id);

    if (sortedRecords.length === 0) {
        tbody.innerHTML = '<tr><td style="text-align:center; color: var(--text-muted); border: none;">No finance records yet.</td></tr>';
        return;
    }

    if (_financeFilterMode === 'total') {
        renderFinanceTotalRow(tbody, sortedRecords);
        return;
    }

    const groupByMonth = (_financeFilterMode === 'month');
    const keyFn = groupByMonth ? getBusinessMonthKey : getBusinessDayKey;

    const grouped = {};
    sortedRecords.forEach(record => {
        const key = keyFn(record.id); // record.id === Date.now() at creation
        if (!grouped[key]) grouped[key] = { income: 0, expense: 0, records: [] };
        if (record.type === 'Income') grouped[key].income += record.amount;
        if (record.type === 'Expense') grouped[key].expense += record.amount;
        grouped[key].records.push(record);
    });

    // 'YYYY-MM-DD' and 'YYYY-MM' both sort correctly as plain strings.
    const sortedKeys = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1));

    sortedKeys.forEach(key => {
        renderFinanceGroupRow(tbody, key, grouped[key], groupByMonth);
    });
}

function renderFinanceGroupRow(tbody, key, groupData, isMonth) {
    const net = groupData.income - groupData.expense;
    const label = isMonth ? formatBusinessMonthLabel(key) : key;

    const trSummary = document.createElement('tr');
    trSummary.style.backgroundColor = 'var(--bg-card)';
    trSummary.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: var(--accent-cyan); font-size: 16px;">${label}</strong>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    In: <span class="profit-positive">+${groupData.income.toFixed(2)}</span> | 
                    Out: <span class="profit-negative">-${groupData.expense.toFixed(2)}</span>
                </div>
            </div>
            <div style="text-align: right;">
                <strong class="${net >= 0 ? 'profit-positive' : 'profit-negative'}">${net.toFixed(2)} EGP</strong><br>
                <button style="margin-top: 8px; padding: 6px 12px; font-size: 11px; width: auto; background: transparent; border: 1px solid var(--border-color); color: var(--text-main);" onclick="toggleDetails('${key}', this)">View Details</button>
            </div>
        </div>
    `;
    tbody.appendChild(trSummary);

    const trDetails = document.createElement('tr');
    trDetails.id = `details-${key}`;
    trDetails.style.display = 'none';
    trDetails.style.backgroundColor = '#000';
    trDetails.style.borderTop = 'none';
    trDetails.style.marginTop = '-10px';
    trDetails.style.borderRadius = '0 0 12px 12px';
    trDetails.innerHTML = buildFinanceRecordListHTML(groupData.records);
    tbody.appendChild(trDetails);
}

function renderFinanceTotalRow(tbody, allRecords) {
    let income = 0, expense = 0;
    allRecords.forEach(r => {
        if (r.type === 'Income') income += r.amount;
        if (r.type === 'Expense') expense += r.amount;
    });
    const net = income - expense;

    const trSummary = document.createElement('tr');
    trSummary.style.backgroundColor = 'var(--bg-card)';
    trSummary.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
                <strong style="color: var(--accent-cyan); font-size: 16px;">All-Time Total</strong>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                    In: <span class="profit-positive">+${income.toFixed(2)}</span> | 
                    Out: <span class="profit-negative">-${expense.toFixed(2)}</span>
                </div>
            </div>
            <div style="text-align: right;">
                <strong class="${net >= 0 ? 'profit-positive' : 'profit-negative'}">${net.toFixed(2)} EGP</strong><br>
                <button style="margin-top: 8px; padding: 6px 12px; font-size: 11px; width: auto; background: transparent; border: 1px solid var(--border-color); color: var(--text-main);" onclick="toggleDetails('total-all', this)">View Details</button>
            </div>
        </div>
    `;
    tbody.appendChild(trSummary);

    const trDetails = document.createElement('tr');
    trDetails.id = 'details-total-all';
    trDetails.style.display = 'none';
    trDetails.style.backgroundColor = '#000';
    trDetails.style.borderTop = 'none';
    trDetails.style.marginTop = '-10px';
    trDetails.style.borderRadius = '0 0 12px 12px';
    trDetails.innerHTML = buildFinanceRecordListHTML(allRecords);
    tbody.appendChild(trDetails);
}

// Shared by both the admin grouped rows and the non-admin Today view, so the
// per-transaction row markup never drifts between the two.
function buildFinanceRecordListHTML(records) {
    let html = `<div class="finance-records-scroll">`;
    records.forEach(record => {
        let loggedUser = record.user ? record.user : 'admin';
        const noteCount = getRecordNotes(record).length;
        const noteBadge = noteCount > 0
            ? ` <span style="font-size:11px; color:var(--text-muted); font-weight:400;">📝${noteCount}</span>`
            : '';
        html += `
            <div class="finance-record-row" style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-color); font-size: 13px; cursor: pointer;" onclick="openRecordReceipt('finance', '${record.id}')">
                <div style="display: flex; flex-direction: column;">
                    <strong class="${record.type === 'Income' ? 'profit-positive' : 'profit-negative'}">${record.type}${noteBadge}</strong>
                    <span style="color: var(--text-muted); font-size: 12px;">${record.time} • ${loggedUser}</span>
                    <span style="color: #fff; margin-top: 4px;">${record.description}</span>
                </div>
                <strong style="color: var(--text-main);">${record.amount.toFixed(2)} EGP</strong>
            </div>
        `;
    });
    html += `</div>`;
    return html;
}

// ── Non-admin view — current business day only (04:00 AM reset) ──────────
function renderTodayFinanceView() {
    const container = document.getElementById('finance-today-view');
    if (!container) return;

    const todayKey = getBusinessDayKey(Date.now());
    const todaysRecords = financialData
        .filter(r => getBusinessDayKey(r.id) === todayKey)
        .sort((a, b) => b.id - a.id);

    let income = 0, expense = 0;
    todaysRecords.forEach(r => {
        if (r.type === 'Income') income += r.amount;
        if (r.type === 'Expense') expense += r.amount;
    });
    const net = income - expense;

    let html = `
        <h3 style="margin-top:0; color: var(--text-main);">Today's Summary</h3>
        <div class="summary-cards">
            <div class="card">
                <h3>NET (TODAY)</h3>
                <div class="amount ${net >= 0 ? 'profit-positive' : 'profit-negative'}">${net.toFixed(2)} EGP</div>
            </div>
            <div style="display: flex; gap: 10px;">
                <div class="card" style="flex: 1; flex-direction: column; align-items: flex-start;">
                    <h3>REVENUE</h3>
                    <div class="amount profit-positive" style="font-size: 16px;">${income.toFixed(2)} EGP</div>
                </div>
                <div class="card" style="flex: 1; flex-direction: column; align-items: flex-start;">
                    <h3>EXPENSES</h3>
                    <div class="amount profit-negative" style="font-size: 16px;">${expense.toFixed(2)} EGP</div>
                </div>
            </div>
        </div>
        <div class="table-container">
    `;

    if (todaysRecords.length === 0) {
        html += `<p style="color:var(--text-muted); font-size:13px; text-align:center; padding: 15px 0;">No transactions logged today yet.</p>`;
    } else {
        html += buildFinanceRecordListHTML(todaysRecords);
    }

    html += `</div>`;
    container.innerHTML = html;
}

// The store's business day rolls over at 04:00 AM, which can happen while a
// staff member has the Finance tab open overnight. A plain page load would
// only pick this up on next reload, so poll once a minute and re-render the
// non-admin Today view if the boundary has been crossed while visible.
setInterval(function () {
    if (isAdminUser()) return;
    const view = document.getElementById('financial-view');
    if (view && view.style.display !== 'none') {
        renderTodayFinanceView();
    }
}, 60 * 1000);

function toggleDetails(date, btn) {
    const detailsRow = document.getElementById(`details-${date}`);
    if (detailsRow.style.display === 'none') {
        detailsRow.style.display = 'block';
        btn.innerText = 'Hide Details';
        btn.style.borderColor = 'var(--accent-cyan)';
        btn.style.color = 'var(--accent-cyan)';
    } else {
        detailsRow.style.display = 'none';
        btn.innerText = 'View Details';
        btn.style.borderColor = 'var(--border-color)';
        btn.style.color = 'var(--text-main)';
    }
}

function openExpensesAdminView() {
    toggleAdminMenu(false);
    switchTab('none');
    document.getElementById('expenses-admin-view').style.display = 'block';
    switchExpensesTab('edit');
    renderExpensesAdmin();
}

// ── Modify Expenses tab switcher ────────────────────────
// Same toggle pattern as switchStockTab()/switchEmpTab()/switchAuditsTab().
function switchExpensesTab(tab) {
    const tabs = ['edit', 'log'];
    tabs.forEach(function (t) {
        const panel = document.getElementById('expenses-panel-' + t);
        const btn = document.getElementById('xtab-' + t);
        if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });

    if (tab === 'edit') renderExpensesAdmin();
    if (tab === 'log') renderExpenseEditLog();
}

function renderExpensesAdmin() {
    const container = document.getElementById('expenses-admin-list');
    container.innerHTML = '';
    
    const expenses = financialData.filter(r => r.type === 'Expense').sort((a, b) => b.id - a.id);
    
    if (expenses.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center;">No expenses logged.</p>';
        return;
    }

    expenses.forEach(exp => {
        container.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; background: #000; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 10px;">
                <div style="display:flex; flex-direction:column; overflow:hidden; flex: 1; padding-right: 10px;">
                    <strong style="color: #fff; font-size: 15px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">${exp.description}</strong>
                    <span style="color: var(--danger); font-size: 14px; font-weight: bold; margin: 4px 0;">${exp.amount.toFixed(2)} EGP</span>
                    <span style="color: var(--text-muted); font-size: 11px;">${exp.date} • ${exp.time}</span>
                </div>
                <button class="btn-blue" onclick="openEditExpenseModal(${exp.id})" style="width: auto; padding: 10px 15px; font-size: 13px; border-radius: 8px;">✏️ Edit</button>
            </div>
        `;
    });
}

// ── Expenses ▸ Edit History Log ─────────────────────────
// Reuses the .stock-history-row visual style (same look as Purchase History
// in Stock Management). Calls T()/Tf() directly at render time rather than
// depending on 14_language.js's positional monkey-patch IIFE — same
// deliberate approach 15_notebook.js uses (see rule §4 in the plan).
function renderExpenseEditLog() {
    const container = document.getElementById('expense-edit-log-list');
    if (!container) return;
    container.innerHTML = '';

    const entries = [...expenseEditLog].sort((a, b) => b.id - a.id);

    if (entries.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); font-size:13px; text-align:center;">${T('lbl-no-expense-edits')}</p>`;
        return;
    }

    entries.forEach(entry => {
        const amountChanged = entry.beforeAmount !== entry.afterAmount;
        const descChanged = entry.beforeDesc !== entry.afterDesc;

        container.innerHTML += `
            <div class="stock-history-row">
                <div class="stock-history-header">
                    <span class="stock-history-title">${entry.afterDesc}</span>
                    <span class="stock-history-amount">${entry.afterAmount.toFixed(2)} EGP</span>
                </div>
                <div class="stock-history-meta">
                    ${Tf('lbl-edited-by-at', { user: entry.editedBy, time: entry.editedAt })}<br>
                    ${amountChanged ? Tf('lbl-amount-diff', { before: entry.beforeAmount.toFixed(2), after: entry.afterAmount.toFixed(2) }) + '<br>' : ''}
                    ${descChanged ? Tf('lbl-desc-diff', { before: entry.beforeDesc, after: entry.afterDesc }) : ''}
                </div>
            </div>
        `;
    });
}

function openEditExpenseModal(id) {
    const exp = financialData.find(r => r.id === id);
    if (!exp) return;
    
    document.getElementById('edit-expense-id').value = exp.id;
    document.getElementById('edit-expense-amount').value = exp.amount;
    document.getElementById('edit-expense-desc').value = exp.description;
    document.getElementById('edit-expense-modal').style.display = 'flex';
}

function closeEditExpenseModal() {
    document.getElementById('edit-expense-modal').style.display = 'none';
}

async function saveEditedExpense() {
    const id = parseFloat(document.getElementById('edit-expense-id').value);
    const newAmount = parseFloat(document.getElementById('edit-expense-amount').value);
    const newDesc = document.getElementById('edit-expense-desc').value.trim();
    
    if (!newAmount || newAmount <= 0) {
        return customAlert(T('al-invalid-amount'), T('al-title-invalid-input'));
    }
    if (newDesc === '') {
        return customAlert(T('al-desc-empty'), T('al-title-invalid-input'));
    }

    const expIndex = financialData.findIndex(r => r.id === id);
    if (expIndex !== -1) {
        const oldAmount = financialData[expIndex].amount;
        const oldDesc = financialData[expIndex].description;
        financialData[expIndex].amount = newAmount;
        financialData[expIndex].description = newDesc;
        
        await db.financial_data.update(id, {
            amount: newAmount,
            description: newDesc,
            updated_at: new Date().toISOString()
        });

        // Record this edit in the Expenses ▸ Edit History Log — a separate,
        // append-only trail distinct from the finance record itself (Dexie
        // `expense_edit_log` store, §3 of Pricing_Selector_And_Expense_Log_Plan.md).
        const editRecord = {
            id: Date.now(),
            expenseId: id,
            editedBy: sessionStorage.getItem('gaming_user') || 'Unknown',
            editedAt: new Date().toLocaleString(),
            beforeAmount: oldAmount,
            beforeDesc: oldDesc,
            afterAmount: newAmount,
            afterDesc: newDesc,
            updatedAt: new Date().toISOString() // append-only record — always equals creation time
        };
        expenseEditLog.push(editRecord);
        await db.expense_edit_log.add(editRecord);

        // If this expense was created from Employees ▸ Personal Use (e.g. a
        // salary advance), keep that log entry and the employee's running
        // deduction total in sync instead of letting them drift from the
        // corrected finance number.
        const linkedEntry = (typeof personalUseLog !== 'undefined')
            ? personalUseLog.find(e => e.financeRecordId === id)
            : null;

        if (linkedEntry) {
            const delta = newAmount - oldAmount;
            linkedEntry.charge = newAmount;

            const emp = (typeof employees !== 'undefined')
                ? employees.find(e => e.id === linkedEntry.empId)
                : null;
            if (emp) {
                emp.monthDeductions = Math.max(0, (emp.monthDeductions || 0) + delta);
            }

            if (typeof saveEmployeeState === 'function') saveEmployeeState();
            if (typeof renderPersonalUseLog === 'function') renderPersonalUseLog();
            if (typeof renderEmpList === 'function') renderEmpList();
        }
        
        closeEditExpenseModal();
        renderExpensesAdmin(); 
        updateFinanceUI();     
        customAlert(T('al-expense-updated'), T('al-title-success'));
    }
}

function openAdminGamesView() {
    toggleAdminMenu(false);
    switchTab('none');
    document.getElementById('admin-games-view').style.display = 'block';
    renderGamesAdminUI();
}

function isTableEmpty(id) {
    const sess = sessions[id];
    if (!sess) return true;
    
    // Check if any standard drink has a quantity > 0
    let hasDrinks = false;
    for (let key in sess.drinks) {
        if (sess.drinks[key] > 0) {
            hasDrinks = true;
            break;
        }
    }
    
    // Check if there are any custom items
    let hasCustom = sess.customExtras && sess.customExtras.length > 0;
    
    // Return true only if BOTH are empty
    return !(hasDrinks || hasCustom);
}

function renderGamesAdminUI() {
    const tbody = document.getElementById('games-records-body');
    tbody.innerHTML = '';

    const groupedByDate = {};
    const sortedRecords = [...gamesData].sort((a, b) => b.id - a.id);

    sortedRecords.forEach(record => {
        if(!groupedByDate[record.date]) {
            groupedByDate[record.date] = { records: [] };
        }
        groupedByDate[record.date].records.push(record);
    });

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(date => {
        const dayData = groupedByDate[date];
        
        const trSummary = document.createElement('tr');
        trSummary.style.backgroundColor = 'var(--bg-card)';
        trSummary.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong style="color: var(--accent-cyan); font-size: 16px;">${date}</strong>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
                        Total Requests: <span style="color: #fff;">${dayData.records.length}</span>
                    </div>
                </div>
                <div style="text-align: right;">
                    <button style="margin-top: 8px; padding: 6px 12px; font-size: 11px; width: auto; background: transparent; border: 1px solid var(--border-color); color: var(--text-main);" onclick="toggleDetails('games-${date}', this)">View Details</button>
                </div>
            </div>
        `;
        tbody.appendChild(trSummary);

        const trDetails = document.createElement('tr');
        trDetails.id = `details-games-${date}`;
        trDetails.style.display = 'none';
        trDetails.style.backgroundColor = '#000';
        trDetails.style.borderTop = 'none';
        trDetails.style.marginTop = '-10px';
        trDetails.style.borderRadius = '0 0 12px 12px';

        let detailsHTML = '';
        dayData.records.forEach(record => {
            let loggedUser = record.logged_by ? record.logged_by : 'admin';
            let typeColor = record.type === 'Walk-in (No Room)' ? 'var(--warning)' : 'var(--success)';
            
            detailsHTML += `
                <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-color); font-size: 13px;">
                    <div style="display: flex; flex-direction: column;">
                        <strong style="color: ${typeColor};">${record.type}</strong>
                        <span style="color: var(--text-muted); font-size: 12px;">${record.time} • ${loggedUser}</span>
                        <span style="color: #fff; margin-top: 6px;">Games: <strong style="color: var(--accent-purple);">${record.games}</strong></span>
                    </div>
                </div>
            `;
        });

        trDetails.innerHTML = detailsHTML;
        tbody.appendChild(trDetails);
    });

    if (sortedDates.length === 0) {
        tbody.innerHTML = '<tr><td style="text-align: center; color: var(--text-muted); border: none;">No games requested yet.</td></tr>';
    }
}

function triggerNativeNotification(title, message) {
    if (window.NativeNotificationBridge) {
        window.NativeNotificationBridge.postMessage(JSON.stringify({
            title: title,
            body: message
        }));
    }
}

// ═══════════════════════════════════════════════════════════════════════
// Record Receipt popup — Finance ledger + Pending Checkout records
// ═══════════════════════════════════════════════════════════════════════
// A generic, read-only detail popup for any EXISTING record — distinct
// from `#checkout-modal` (09_checkout.js), which is a live in-progress
// checkout confirmation, not a finished/pending record's detail view.
// Reuses the .pc-receipt-box visual language (16_pending_checkout.js /
// style.css) so a finance record and a pending-checkout record look
// consistent when opened this way, even though their underlying data
// shapes differ (see _rrFindRecord/_rrRenderReceiptBox below).
//
// Opened by tapping a Finance ledger row (buildFinanceRecordListHTML,
// above) or a Pending Checkout box (16_pending_checkout.js's
// _pcReceiptBoxHtml). Closes via the ✕ button or a tap on the overlay
// outside the card (#record-receipt-modal in index.html handles both).
//
// Notes added here are stored TWICE, deliberately:
//   1. On the record itself (record.notes[]) — persisted to that
//      record's own Dexie row, so it's visible again next time this
//      exact record's receipt is reopened, on any device (regular
//      Dexie/17_sync.js sync — no new Supabase table or schema change
//      needed, since sync pushes each row as a JSON blob, not fixed
//      columns — see 17_sync.js's SYNC_STORE_CONFIG/_pushRecord).
//   2. As a real Notebook note (notesData/db.notes), broadcast to every
//      user (`mentionedUser: null`) — mirrors 16_pending_checkout.js's
//      _pcBroadcastLockNotice() pattern exactly, so "attach a note" also
//      means "the whole team sees it in the Notebook," per spec.
// ═══════════════════════════════════════════════════════════════════════

let _rrCurrentRecord = null; // { type: 'finance' | 'pending', id }

// Defensive accessor — records created before this feature shipped have
// no `notes` field at all; treat that as an empty list rather than
// throwing everywhere this is read.
function getRecordNotes(record) {
    return (record && Array.isArray(record.notes)) ? record.notes : [];
}

function _rrFindRecord(type, id) {
    if (type === 'finance') {
        return financialData.find(r => String(r.id) === String(id)) || null;
    }
    if (type === 'pending') {
        return pendingCheckoutsQueue.find(r => String(r.id) === String(id)) || null;
    }
    return null;
}

function _rrRecordLabel(rec, type) {
    if (type === 'finance') return `${rec.type} — ${rec.amount.toFixed(2)} EGP`;
    const label = (rec.details && (rec.details.entityName || rec.details.personName)) || '—';
    return `${label} — ${rec.amount.toFixed(2)} EGP`;
}

function openRecordReceipt(type, id) {
    const rec = _rrFindRecord(type, id);
    if (!rec) return;
    _rrCurrentRecord = { type, id };
    _rrRenderReceiptBox(rec, type);
    _rrRenderNotesList(rec);
    const input = document.getElementById('rr-note-input');
    if (input) input.value = '';
    const modal = document.getElementById('record-receipt-modal');
    if (modal) modal.style.display = 'flex';
}

function closeRecordReceipt() {
    const modal = document.getElementById('record-receipt-modal');
    if (modal) modal.style.display = 'none';
    _rrCurrentRecord = null;
}

function _rrRenderReceiptBox(rec, type) {
    const box = document.getElementById('rr-receipt-box');
    if (!box) return;

    if (type === 'finance') {
        const isIncome = rec.type === 'Income';
        box.innerHTML = `
            <div class="pc-receipt-header">
                <span class="pc-receipt-name">${rec.type}</span>
                <span class="pc-receipt-amount" style="color: ${isIncome ? 'var(--accent-cyan)' : 'var(--danger)'};">${isIncome ? '+' : '-'}${rec.amount.toFixed(2)} EGP</span>
            </div>
            <div class="pc-receipt-meta">${rec.date} • ${rec.time} • ${(typeof T === 'function' ? T('pc-locked-by') : 'By')}: ${rec.user || 'admin'}</div>
            <div class="pc-receipt-desc">${rec.description || '—'}</div>
        `;
    } else {
        const label = (rec.details && (rec.details.entityName || rec.details.personName)) || '—';
        const dt = new Date(rec.timestamp);
        const dateStr = dt.toLocaleDateString() + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const sourceLabel = (typeof _pcSourceLabel === 'function') ? _pcSourceLabel(rec.sourceType) : rec.sourceType;
        box.innerHTML = `
            <div class="pc-receipt-header">
                <span class="pc-receipt-name">${label}</span>
                <span class="pc-receipt-amount">${rec.amount.toFixed(2)} EGP</span>
            </div>
            <div class="pc-receipt-meta">${sourceLabel} • ${dateStr} • ${(typeof T === 'function' ? T('pc-locked-by') : 'Locked by')}: ${rec.lockedBy || '—'} • ⏳ Pending</div>
            <div class="pc-receipt-desc">${(rec.details && rec.details.breakdownText) || (typeof T === 'function' ? T('pc-no-charges') : 'No charges')}</div>
        `;
    }
}

function _rrEscapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str == null ? '' : str;
    return div.innerHTML;
}

function _rrRenderNotesList(rec) {
    const list = document.getElementById('rr-notes-list');
    if (!list) return;
    const notes = getRecordNotes(rec);
    if (notes.length === 0) {
        list.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:10px 0;">No notes yet.</div>`;
        return;
    }
    // Newest first.
    list.innerHTML = notes.slice().reverse().map(n => `
        <div class="rr-note-item">
            <div class="rr-note-meta"><strong>${_rrEscapeHtml(n.author)}</strong> • ${new Date(n.timestamp).toLocaleString()}</div>
            <div class="rr-note-text">${_rrEscapeHtml(n.text)}</div>
        </div>
    `).join('');
}

async function submitRecordNote() {
    if (!_rrCurrentRecord) return;
    const input = document.getElementById('rr-note-input');
    const text = (input && input.value ? input.value : '').trim();
    if (!text) return;

    const { type, id } = _rrCurrentRecord;
    const rec = _rrFindRecord(type, id);
    if (!rec) return;

    const user = sessionStorage.getItem('gaming_user') || 'Unknown';
    const noteEntry = {
        id: 'rn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        author: user,
        text: text,
        timestamp: Date.now()
    };

    rec.notes = getRecordNotes(rec);
    rec.notes.push(noteEntry);

    // Persist to the record's own Dexie row (regular sync then carries it
    // to every other device — see the module header comment above).
    try {
        if (type === 'finance') {
            await db.financial_data.update(rec.id, { notes: rec.notes, updated_at: new Date().toISOString() });
        } else {
            await db.pending_checkouts.update(rec.id, { notes: rec.notes, updatedAt: new Date().toISOString() });
        }
    } catch (e) {
        console.error('Failed to save record note:', e);
    }

    _rrBroadcastNoteToNotebook(rec, type, text, user);

    input.value = '';
    _rrRenderNotesList(rec);

    // Keep whichever list is currently on screen (including the note-count
    // badge) in sync without needing to close/reopen the popup.
    if (type === 'finance' && typeof renderAdminLedger === 'function') renderAdminLedger();
    if (type === 'finance' && typeof renderTodayFinanceView === 'function') renderTodayFinanceView();
    if (type === 'pending') {
        if (typeof renderPendingAdminList === 'function') renderPendingAdminList();
        if (typeof renderFinancePendingList === 'function') renderFinancePendingList();
    }
}

// Broadcasts the note to every user via the Notebook — mirrors
// 16_pending_checkout.js's _pcBroadcastLockNotice() shape exactly.
// Defensively guarded: 15_notebook.js loads AFTER this file (module
// order), but since this only ever runs at click-time (well after every
// module has loaded), that's safe — the guard just protects against the
// Notebook feature being stripped/broken in some future build.
function _rrBroadcastNoteToNotebook(rec, type, text, user) {
    if (typeof notesData === 'undefined' || typeof _nbGenId !== 'function' || typeof _nbSaveNote !== 'function') return;

    const note = {
        id: _nbGenId(),
        author: user,
        text: `📋 Note on ${_rrRecordLabel(rec, type)}: ${text}`,
        timestamp: Date.now(),
        mentionedUser: null, // null = "Everyone" — see 15_notebook.js's _nbIsUnreadForUser
        readBy: [user],
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