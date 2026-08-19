// ═══════════════════════════════════════════════════════
// MODULE: 14_language.js
// Arabic / English toggle — full translations + applyLanguage
// Depends on: 01_config (DRINKS_MENU, RATE_*), 03_ui_core (toggleAdminMenu, showApp)
// ═══════════════════════════════════════════════════════

const TRANSLATIONS = {
    en: {
        /* ── Header ── */
        'lbl-session': 'Session',
        'lbl-logout': 'Logout',

        /* ── Bottom Nav ── */
        'nav-lounge': 'Lounge',
        'nav-noroom': 'No Room Ask',
        'nav-finance': 'Finance',

        /* ── Zone Buttons ── */
        'zone-vip': '👑 VIP',
        'zone-lounge': '🎮 Lounge',
        'zone-cafe': '☕ Cafe Tables',
        'zone-shared': '👥 Shared Space',

        /* ── Price Bar ── */
        'lounge-rate-single': 'Single: ',
        'lounge-rate-multi': 'Multi: ',
        'lounge-rate-iptv': 'IPTV: ',

        /* ── Views headings ── */
        'h2-noroom': 'No Room Ask',
        'noroom-desc': 'Log games requested by walk-in customers who didn\'t play.',
        'noroom-game-placeholder': 'Enter game name (e.g., FIFA 24)',
        'noroom-add-game': '+ Add another game',
        'noroom-submit': 'Log Walk-in Request',

        'h2-finance': 'Financial Tracker',
        'card-profit': 'NET PROFIT',
        'card-income': 'INCOME',
        'card-expense': 'EXPENSES',
        'lbl-add-expense': 'Add Expense (EGP)',
        'lbl-expense-desc': 'Description',
        'btn-log-expense': 'Log Expense',

        /* ── Audits ── */
        'btn-back-audits': '⬅ Back to Lounge',
        'h2-audits': 'Audits & Pricing',
        'tab-audits-lounge': 'Lounge',
        'tab-audits-vip': 'VIP',
        'tab-audits-shared': 'Shared Area',
        'tab-audits-menu': 'Drinks Menu',
        'h3-console-pricing': '🎮 Console Pricing',
        'h3-audits-vip': '👑 VIP Pricing',
        'h3-audits-shared': '🛋️ Shared Area Pricing',
        'h3-audits-menu': '🥤 Drinks Menu',
        'lbl-single': 'Single (EGP/hr):',
        'lbl-multi': 'Multi (EGP/hr):',
        'lbl-iptv': 'IPTV (EGP/hr):',
        'lbl-vip': 'VIP (EGP/hr):',
        'lbl-vip-ps4': 'VIP PS4 Gaming (EGP/hr):',
        'lbl-vip-ps5': 'VIP PS5 Gaming (EGP/hr):',
        'lbl-vip-iptv': 'VIP IPTV (EGP/hr):',
        'lbl-shared': 'Shared Space (EGP/hr):',
        'lbl-ps5-extra': 'PS5 Extra (EGP/hr):',
        'btn-save-pricing': 'Save Pricing',
        'h3-drinks': '🥤 Drinks Management',
        'drinks-desc': 'Update prices or add new items.',
        'h4-add-item': 'Add New Menu Item',
        'ph-drink-name': 'Display Name (e.g. Redbull)',
        'ph-drink-price': 'Price (EGP)',
        'btn-add-item': 'Add Item',

        /* ── Expenses Admin ── */
        'btn-back-expenses': '⬅ Back to Lounge',
        'h2-modify-expenses': 'Modify Expenses',
        'tab-expenses-edit': 'Edit Expenses',
        'tab-expenses-log': 'Edit History Log',
        'expenses-desc': 'View and edit previously logged expenses.',
        'expenses-log-desc': 'History of edits made to expense records.',
        'btn-edit-expense-item': '✏️ Edit',
        'lbl-no-expenses': 'No expenses logged.',
        'lbl-no-expense-edits': 'No expense edits logged yet.',
        'lbl-edited-by-at': 'Edited by {user} • {time}',
        'lbl-amount-diff': 'Amount: {before} → {after} EGP',
        'lbl-desc-diff': 'Description: "{before}" → "{after}"',

        /* ── Admin Games ── */
        'btn-back-games': '⬅ Back to Lounge',
        'btn-export-clients': 'Export Clients Data',
        'h2-games-asked': 'Games Asked For',
        'games-desc': 'History of all games requested (Sessions & Walk-ins).',

        /* ── Stock ── */
        'btn-back-stock': '⬅ Back to Lounge',
        'h2-stock': '📦 Stock Management',
        'stab-overview': 'Overview',
        'stab-purchase': 'Purchase',
        'stab-traceable': 'Traceable',
        'stab-components': 'Components',
        'stab-adjust': 'Adjust',
        'h3-stock-levels': 'Current Stock Levels',
        'btn-export-stock': '⬇ Export CSV',
        'h3-log-purchase': 'Log a Purchase',
        'purchase-desc': 'Select a menu item, enter quantity and total cost. An expense is logged automatically.',
        'lbl-purchase-item': 'Item',
        'lbl-purchase-qty': 'Quantity (pieces)',
        'lbl-purchase-cost': 'Total Cost Paid (EGP)',
        'lbl-purchase-notes': 'Notes (optional)',
        'ph-purchase-notes': 'e.g. Supplier: Ahmed',
        'btn-log-purchase': '✅ Log Purchase & Expense',
        'h3-purchase-history': 'Purchase History',
        'btn-export-purchases': '⬇ Export CSV',
        'h3-traceable': 'Traceable Items',
        'traceable-desc': 'Toggle which items are tracked in stock. Non-traceable items (e.g. Tea, Turkey Coffee) will never deduct from stock when sold.',
        'h3-components': '🧪 Stock Components',
        'components-desc': 'Raw ingredients or extras (e.g. Mint Syrup) that you purchase and track in stock, but that never appear on the customer menu by themselves. Link them to a drink\'s recipe from Drinks Management so selling that drink automatically deducts the right components.',
        'lbl-component-name': 'Component Name',
        'ph-component-name': 'e.g. Mint Syrup',
        'lbl-component-traceable': 'Track stock for this component',
        'btn-add-component': '+ Add Component',
        'h3-existing-components': 'Existing Components',
        'h3-adjust': 'Manual Stock Adjustment',
        'adjust-desc': 'Log missing or damaged stock. No financial expense is created — only stock is deducted.',
        'lbl-adjust-item': 'Item',
        'lbl-adjust-qty': 'Quantity to Deduct (pieces)',
        'lbl-adjust-reason': 'Reason',
        'ph-adjust-reason': 'e.g. Damaged, Missing, Counted short',
        'btn-log-adjust': '⚠️ Log Adjustment',
        'h3-adjust-history': 'Adjustment History',
        'btn-export-adjust': '⬇ Export CSV',

        /* ── Employee ── */
        'btn-back-emp': '⬅ Back to Lounge',
        'h2-employees': '👥 Employees & Personal Use',
        'etab-employees': 'Employees',
        'etab-personaluse': 'Personal Use Log',
        'h3-add-emp': 'Add Employee',
        'lbl-emp-name': 'Name',
        'ph-emp-name': 'e.g. Ahmed',
        'lbl-emp-salary': 'Monthly Salary (EGP)',
        'ph-emp-salary': 'e.g. 3000',
        'btn-add-emp': '➕ Add Employee',
        'h3-payroll': '📅 Month-End Payroll',
        'payroll-desc': 'Pay out all employees for the current month. Salary expenses are logged automatically and monthly deductions are reset to zero.',
        'btn-finalize-month': '📅 Finalize Month',
        'lbl-current-employees': 'Current Employees',
        'h3-log-personal': 'Log Personal Use / Salary Advance',
        'lbl-puse-emp': 'Employee',
        'lbl-puse-type': 'Type',
        'puse-item-option': 'Item Consumed',
        'puse-advance-option': 'Salary Advance (Cash)',
        'lbl-puse-menu-item': 'Menu Item',
        'lbl-puse-charge-mode': 'Charge Mode',
        'puse-half': '50% of menu price (default)',
        'puse-full': 'Full menu price',
        'puse-free': 'Free (no charge)',
        'puse-custom': 'Custom amount',
        'lbl-puse-custom': 'Custom Charge (EGP)',
        'lbl-puse-qty': 'Quantity',
        'lbl-advance-amount': 'Amount Taken (EGP)',
        'lbl-advance-note': 'Note (optional)',
        'ph-advance-note': 'e.g. Emergency',
        'puse-deduct-label': 'Will deduct from salary:',
        'btn-log-puse': '📋 Log Entry',
        'lbl-puse-filter': 'All Employees',
        'lbl-puse-history': 'History',
        'etab-loginhistory': 'Login History',
        'lbl-login-activity': 'Login / Logout Activity',
        'lbl-login-filter-all': 'All Users',
        'btn-clear-login-history': '🗑 Clear History',
        'lbl-no-login-history': 'No login activity recorded yet.',
        'badge-login': 'Login',
        'badge-logout': 'Logout',
        'lbl-role': 'Role:',

        /* ── Notebook ── */
        'notebook-title': '📓 Notebook',
        'notebook-composer-placeholder': 'Write a note…',
        'notebook-send': 'Send',
        'notebook-mention-everyone': 'Everyone',
        'notebook-mention-btn': '@',
        'notebook-pinned-section': '📌 Pinned',
        'notebook-empty': 'No notes yet. Start the conversation!',
        'notebook-edited-tag': 'edited',
        'notebook-msg-pinned': 'This message has been pinned',
        'notebook-msg-unpinned': 'This message has been unpinned',
        'notebook-edit-btn': 'Edit',
        'notebook-save-edit': 'Save',
        'notebook-cancel-edit': 'Cancel',
        'notebook-to-everyone': 'To: Everyone',
        'notebook-to-user': 'To: {name}',
        'admin-btn-notebook': '📓 Notebook',
        'notebook-admin-title': '📓 Notebook Admin',
        'notebook-admin-desc': 'Every note, visible here regardless of who has read it.',
        'notebook-admin-mark-read': 'Mark Read for All',
        'notebook-admin-delete': 'Delete for All',
        'notebook-admin-pin': 'Pin',
        'notebook-admin-unpin': 'Unpin',
        'notebook-admin-empty': 'No notes in the notebook.',
        'notebook-directory-title': '👤 Notebook User Directory',
        'notebook-directory-desc': 'Controls the @mention list and read/unread rules. Does not grant app login.',
        'ph-notebook-user-name': 'Name',
        'notebook-directory-add': '+ Add User',
        'notebook-directory-remove': 'Remove',
        'notebook-role-user': 'User',
        'notebook-role-admin': 'Admin',
        'btn-back-notebook': '⬅ Back to Lounge',
        'cf-delete-note': 'Delete this note for everyone? This cannot be undone.',
        'cf-remove-notebook-user': 'Remove this user from the Notebook Directory?',

        /* ── Admin Sidebar ── */
        'sidebar-title': 'System Admin',
        'admin-btn-audits': '📊 Audits & Pricing',
        'admin-btn-expenses': '💸 Modify Expenses',
        'admin-btn-games': '🎮 Games Asked For',
        'admin-btn-stock': '📦 Stock Management',
        'admin-btn-emp': '👥 Employees & Personal Use',
        'h3-data-engine': '💾 Data Engine',
        'data-engine-desc': 'Backup or restore your financial database.',
        'btn-export-csv': '⬇️ Export financial (CSV)',
        'lbl-restore': 'Restore Data',
        'btn-import': '⬆️ Import Data',
        'admin-btn-logout': '🚪 Logout',

        /* ── Modals ── */
        'alert-title-default': 'Notification',
        'confirm-title-default': 'Confirm Action',
        'btn-confirm-yes': 'Yes',
        'btn-confirm-no': 'No',

        'migrate-title': 'Migrate Table Charges',
        'migrate-desc': 'Move all drinks and extras to a PS session.',
        'lbl-migrate-target': 'Target PS Console:',
        'btn-migrate-confirm': 'Migrate Charges Now',
        'btn-migrate-cancel': 'Cancel',

        'drinks-modal-title': 'Drinks & Extras',
        'lbl-drinks-preview-time': 'Time So Far:',
        'lbl-drinks-preview-time-cost': 'Time Cost So Far:',
        'lbl-drinks-preview-extras': 'Extras Total',
        'lbl-ss-preview-console': 'Console:',
        'lbl-ss-preview-mode': 'Mode:',
        'lbl-ss-preview-rate': 'Rate:',
        'h4-add-custom': 'Add Custom Item',
        'btn-open-cwiz': '➕ Add Custom Item',
        'ph-custom-name': 'Item Name',
        'ph-custom-price': 'Price',
        'btn-custom-add': 'Add',
        'btn-drinks-done': 'Done',

        /* ── Custom Item Wizard Modal ── */
        'cwiz-title': '➕ Add Custom Item',
        'cwiz-desc': 'Fill in details below. Selling price must cover all components.',
        'lbl-cwiz-name': 'Item Name',
        'ph-cwiz-name': 'e.g. Special Combo',
        'lbl-cwiz-price': 'Selling Price (EGP)',
        'ph-cwiz-price': 'e.g. 50',
        'h-cwiz-stock-section': '📦 From Our Stock (Menu Items)',
        'btn-cwiz-add-row': '+ Add',
        'cwiz-stock-empty': 'No stock components added.',
        'h-cwiz-outside-section': '🛒 Purchased Outside (Not on Menu)',
        'cwiz-outside-empty': 'No outside purchases added.',
        'ph-cwiz-outside-name': 'e.g. Ice cream (bought outside)',
        'ph-cwiz-outside-cost': 'Cost',
        'lbl-cwiz-comp-total': 'Total component cost:',
        'lbl-cwiz-sell-price': 'Selling price:',
        'cwiz-warning-low-price': '⚠️ Selling price is lower than total component cost!',
        'cwiz-warning-stock': '⚠️ Not enough stock for one or more selected items — adjust quantities or restock before adding.',
        'btn-cwiz-confirm': '✅ Add to Order',
        'btn-cwiz-cancel': 'Cancel',
        'cwiz-stock-issue': '{name}: only {avail} left (need {qty}).',

        'checkout-title': 'Session Checkout',
        'lbl-chk-console': 'Console:',
        'lbl-chk-mode': 'Mode:',
        'lbl-chk-time': 'Total Time:',
        'lbl-chk-phone': 'Client Phone Number (Optional)',
        'ph-chk-phone': 'Enter phone number',
        'btn-chk-confirm': 'Confirm Payment',
        'btn-chk-cancel': 'Cancel',
        'lbl-amount-due': 'Amount Due',

        'edit-expense-title': 'Edit Expense Entry',
        'lbl-edit-exp-desc': 'Expense Description:',
        'lbl-edit-exp-amt': 'Amount (EGP):',
        'btn-save-expense': 'Save Changes',
        'btn-cancel-expense': 'Cancel',

        'start-session-title': 'Start Console Session',
        'start-session-desc': 'Log games requested for this session (optional)',
        'btn-add-game': '+ Add another game',
        'ph-start-game': 'Enter game name',
        'btn-start-confirm': 'Confirm & Start',
        'btn-start-cancel': 'Cancel',

        'add-person-title': 'Add Person',
        'add-person-desc': 'Billing starts immediately at 25 EGP/hr.',
        'ph-person-name': 'Enter person\'s name (e.g. Mohammed)',
        'btn-person-start': 'Start Person\'s Session',
        'btn-person-cancel': 'Cancel',

        'lbl-time-played': 'Time Played:',
        'lbl-time-cost': 'Time Cost (25/hr):',
        'ph-person-custom-name': 'Custom Item Name',
        'lbl-person-total': 'Total Due',
        'btn-person-confirm': 'Confirm Payment',
        'btn-person-cancel2': 'Cancel',

        'charge-emp-title': 'Charge Someone?',
        'lbl-charge-emp': 'Employee',
        'lbl-charge-mode': 'Charge Mode',
        'charge-half': '50% of menu price (default)',
        'charge-full': 'Full menu price',
        'charge-free': 'Free (no charge)',
        'deduct-label': 'Deduct from salary:',
        'btn-charge-confirm': '✅ Confirm Charge',
        'btn-charge-skip': 'Skip / No Charge',

        'edit-emp-title': 'Edit Employee',
        'lbl-edit-emp-name': 'Name',
        'lbl-edit-emp-salary': 'Monthly Salary (EGP)',
        'btn-edit-emp-save': 'Save',
        'btn-edit-emp-cancel': 'Cancel',

        'finalize-title': '🔐 Finalize Month',
        'finalize-desc': 'Review the payroll summary below. Enter your admin password to confirm and process.',
        'lbl-admin-pw': 'Admin Password',
        'ph-admin-pw': 'Enter admin password…',
        'btn-finalize-confirm': '✅ Confirm & Finalize',
        'btn-finalize-cancel': 'Cancel',
        'finalize-pw-error': '❌ Incorrect password. Please try again.',

        /* ── Dynamic render strings (used via T() in JS templates) ── */

        /* buildConsoles – cafe table card */
        'cafe-manage-desc':     'Manage Walk-in Orders & Extras',
        'btn-add-drinks':       '🥤 Add Drinks & Extras',
        'btn-ask-game-log':     '📝 Ask Game (Log Request)',
        'btn-migrate-session':  '➡️ Migrate to PS Session',
        'btn-checkout-table':   '💳 Checkout Table',
        'badge-open':           'Open',

        /* buildConsoles – PS / VIP card */
        'badge-available':      'Available',
        'badge-in-use':         'In Use',
        'btn-single':           'Single',
        'btn-multi':            'Multi',
        'btn-iptv':             'IPTV',
        'btn-start-open':       '⏱️ Start Open Time',
        'ph-custom-mins':       'Custom Mins',
        'btn-set':              'Set',
        'btn-add-extras':       '🥤 Add Extras',
        'btn-checkout':         'Checkout',

        /* updateUI – session info box */
        'lbl-type':             'Type:',
        'lbl-state':            'State:',
        'time-open':            'Open Time',
        'time-fixed':           'Fixed',
        'mode-single':          'Single Player',
        'mode-multi':           'Multiplayer',
        'mode-iptv':            'IPTV Viewing',

        /* renderSharedSpace */
        'shared-no-one':        'No one here yet.',
        'btn-add-drink-person': '+ Drink',
        'btn-checkout-person':  'Checkout',
        'btn-add-person':       '+ Add Person',
        'badge-active-count':   'Active',   /* prefix — number appended in JS */

        /* renderStockOverview */
        'lbl-price':            'Price:',
        'lbl-traceable':        'Traceable',
        'lbl-pcs':              'pcs',
        'lbl-not-tracked':      'Not Tracked',
        'lbl-not-traceable-note': 'Not traceable — stock not counted',
        'lbl-no-traceable-cfg': 'No traceable items configured.',
        'lbl-go-traceable-tab': 'Go to the Traceable tab to enable tracking.',
        'stock-label-out':      'OUT',
        'stock-label-low':      'LOW',

        /* renderTraceableList */
        'lbl-stock':            'Stock:',
        'lbl-not-tracked-short':'Not tracked',
        'lbl-no-menu-items':    'No items in the drinks menu yet.',

        /* populatePurchaseSelect / populateAdjustSelect */
        'ph-select-menu-item':  '— Select Item —',
        'ph-select-traceable':  '— Select Traceable Item —',
        'lbl-in-stock':         'in stock',
        'optgrp-menu-items':    'Menu Items',
        'lbl-component-type':   'Component',
        'lbl-components-not-tracked': 'Components — Not Tracked',

        /* renderPurchaseHistory */
        'lbl-qty':              'Qty:',
        'lbl-unit-cost':        'Unit cost:',
        'lbl-no-purchases':     'No purchases logged yet.',

        /* renderAdjustHistory */
        'lbl-before':           'Before:',
        'lbl-after':            'After:',
        'lbl-reason':           'Reason:',
        'lbl-no-adjustments':   'No adjustments logged yet.',
        'lbl-current-stock':    'Current stock:',

        /* adjust stock display */
        'adj-deducted':         'pcs',   /* "-3 pcs" */

        /* renderEmpList */
        'lbl-salary':           'Salary:',
        'lbl-per-month':        'EGP/mo',
        'lbl-net':              'Net:',
        'btn-edit-emp':         '✏️ Edit',
        'btn-remove-emp':       '🗑 Remove',
        'lbl-no-employees':     'No employees added yet.',

        /* renderPersonalUseLog */
        'lbl-no-entries':       'No entries yet.',

        /* openFinalizeMonthModal */
        'lbl-salary-word':      'Salary',
        'lbl-deductions':       'Deductions',
        'lbl-total-cash-out':   'Total Cash Out',

        /* populatePuseSelects */
        'ph-select-employee':   '— Select Employee —',
        'ph-select-item':       '— Select Item —',
        'ph-all-employees':     'All Employees',

        /* openChargeEmployeeModal */
        'ph-select-emp-charge': '— Select Employee —',

        /* renderGamesAdminUI */
        'lbl-total-requests':   'Total Requests:',
        'btn-view-details':     'View Details',
        'btn-hide-details':     'Hide Details',
        'lbl-no-games':         'No games requested yet.',

        /* toggleDetails (finance) */
        'lbl-day-in':           'In:',
        'lbl-day-out':          'Out:',

        /* endCafeSession / openMigrateModal */
        'lbl-table-order':      'Table Order',

        /* proceedToCheckoutUI */
        'chk-mode-open':        'Open Time',
        'chk-mode-fixed':       'Fixed',

        /* misc status */
        'lbl-active-badge':     'ACTIVE',

        /* ── Shared alert/confirm titles ── */
        'al-title-missing-field':  'Missing Field',
        'al-title-success':        'Success',
        'al-title-error':          'Error',
        'al-title-invalid-input':  'Invalid Input',
        'al-title-export-failed':  'Export Failed',
        'al-title-export':         'Export',

        /* ── 04_admin_views.js ── */
        'al-fill-pricing':         'Please fill all pricing fields.',
        'al-pricing-saved':        'Pricing Configuration Saved successfully!',
        'al-recipe-invalid-qty':   'Each recipe row needs a valid quantity greater than 0.',
        'al-title-invalid-recipe': 'Invalid Recipe',
        'al-recipe-saved':         'Recipe saved for "{name}".',
        'al-recipe-cleared':       'Recipe cleared for "{name}" — it\'s now a plain item.',
        'al-title-recipe-updated': 'Recipe Updated',
        'al-menu-item-updated':    'Menu item updated!',
        'al-invalid-name-price':   'Invalid name or price.',
        'cf-delete-menu-item':     'Delete this item from the menu?',
        'al-fill-fields-price':    'Please fill all fields correctly. Price must be a valid number.',
        'al-item-added':           'New item added to menu!',
        'al-no-financial-data':    'No financial data available to export.',
        'al-export-db-failed':     'Failed to export database.',
        'al-select-csv-first':     'Please select a CSV file first.',
        'al-title-import-failed':  'Import Failed',
        'al-csv-empty':            'CSV file seems empty.',
        'al-import-success':       'Successfully imported {count} records!',
        'al-import-db-error':      'Database error during import. Make sure format matches export.',

        /* ── 06_sessions.js ── */
        'al-invalid-minutes':      'Please enter a valid number of minutes.',
        'al-hardware-locked':      'This unit shares hardware with {partner}, which is currently in use. Please checkout that session first.',
        'al-title-hardware-locked':'Hardware Locked',
        'al-enter-game-name':      'Please enter at least one game name.',
        'al-title-empty-field':    'Empty Field',
        'al-walkin-logged':        'Walk-in request logged successfully!',

        /* ── 09_checkout.js ── */
        'al-session-under-10min':  'Session was under 10 minutes. It has been ignored.',
        'al-title-session-ignored':'Session Ignored',
        'cf-short-session-drinks': 'Session under 10 mins. Charge drinks?',
        'al-title-short-session':  'Short Session',
        'al-session-cancelled':    'Session cancelled entirely.',
        'al-title-cancelled':      'Cancelled',
        'al-table-empty':          'Table is empty. No charges to checkout.',
        'al-title-empty-table':    'Empty Table',
        'al-table-no-items-migrate':'Table has no active items to migrate.',
        'al-no-sessions-migrate':  'There are currently no active PS sessions available to migrate items to.',
        'al-title-no-sessions':    'No Available Sessions',
        'al-select-target-console':'Please select a target console.',
        'al-title-validation-error':'Validation Error',
        'al-migration-inactive':   'Cannot migrate items to an inactive console session.',
        'al-title-migration-blocked':'Migration Blocked',
        'al-merge-limit-reached':  'This session already has 2 tables merged into it. Maximum limit reached.',
        'al-title-merge-limit':    'Merge Limit Reached',
        'cf-merge-second-table':   'This session ({target}) already has 1 table merged. Are you sure you want to merge a second table ({source})? This is the maximum allowed.',
        'al-migration-complete':   'Successfully moved all Table charges to {target}.',
        'al-title-migration-complete':'Migration Complete!',
        'al-session-closed-no-charge':'Session closed with no charge.',
        'al-title-checkout-complete':'Checkout Complete',
        'al-checkout-success':     'Checkout successful! Income recorded.',

        /* ── 10_finance.js ── */
        'al-invalid-expense-amount':'Please enter a valid expense amount.',
        'al-expense-recorded':     'Expense has been recorded.',
        'al-invalid-amount':       'Please enter a valid amount.',
        'al-desc-empty':           'Description cannot be empty.',
        'al-expense-updated':      'Expense updated successfully!',

        /* ── 11_shared_space.js ── */
        'al-title-out-of-stock':   'Out of Stock',
        'al-person-checkout-success':'Checkout successful for {name}! Income recorded.',
        'al-no-client-data':       'No client data available to export.',
        'al-export-client-failed': 'Failed to export client data.',

        /* ── 12_stock.js ── */
        'al-enter-component-name': 'Please enter a component name.',
        'al-component-added':      '"{name}" added as a stock component.',
        'al-title-component-added':'Component Added',
        'cf-delete-component':     'Delete component "{name}"? Its stock history will be kept, but it will no longer be purchasable or trackable.{warning}',
        'cf-delete-component-warning':'\n\nWarning: this component is used in the recipe of: {items}. Those recipes will keep a dangling reference.',
        'al-select-item':          'Please select an item.',
        'al-invalid-qty':          'Please enter a valid quantity.',
        'al-invalid-total-cost':   'Please enter a valid total cost.',
        'al-purchase-logged':      'Purchased {qty}x {item} for {cost} EGP.\nExpense logged automatically.',
        'al-title-purchase-logged':'Purchase Logged',
        'al-select-traceable-item':'Please select a traceable item.',
        'al-enter-reason':         'Please enter a reason.',
        'al-adjustment-logged':    'Deducted {qty} pcs of {item}.\nStock: {before} → {after}',
        'al-title-adjustment-logged':'Adjustment Logged',
        'al-no-traceable-export':  'No traceable items to export.',
        'al-no-purchases-export':  'No purchases to export.',
        'al-no-adjustments-export':'No adjustments to export.',

        /* ── 13_employees.js ── */
        'al-enter-name':           'Please enter a name.',
        'al-invalid-salary':       'Please enter a valid salary.',
        'cf-delete-employee':      'Delete this employee? Their personal use log entries will remain.',
        'al-select-employee':      'Please select an employee.',
        'al-select-menu-item':     'Please select a menu item.',
        'al-invalid-advance-amount':'Please enter a valid advance amount.',
        'al-personal-use-logged':  'Logged: {label}\nDeducted {charge} EGP from {name}\'s salary.',
        'al-title-personal-use-logged':'Personal Use Logged',
        'al-no-employees-finalize':'No employees to finalize.',
        'al-title-payroll':        'Payroll',
        'al-payroll-finalized':    'Payroll finalized for {month}.\nAll deductions reset to zero.',
        'al-title-payroll-finalized':'Month Finalized ✅',
        'cf-clear-login-history':  'Clear all login/logout history? This cannot be undone.',

        /* ── 07_timer.js — native push notifications ── */
        'notif-title-10pct':      '⏰ Time Warning (10%)',
        'notif-body-10pct':       '{name} has only 10% of their session remaining.',
        'notif-title-5pct':       '⚠️ Urgent Time Warning (5%)',
        'notif-body-5pct':        '{name} has only 5% of their session remaining!',
        'notif-title-overtime':   '🚨 Overtime Started',
        'notif-body-overtime':    'Overtime started on session {name}',
        /* ── 17_sync.js — Multi-Device Sync indicator ── */
        'sync-offline-tooltip':    'Offline — changes will sync when reconnected',
        'sync-online-tooltip':     'Online — synced',
        'sync-syncing-tooltip':    'Syncing…',

        /* ── 16_pending_checkout.js — Escrow / Pending Checkout ── */
        'pc-menu-label':           'Pending Checkouts',
        'pc-back-label':           'Back to Lounge',
        'pc-lock-tooltip':         'Lock for later checkout',
        'pc-lock-label':           'Lock (Pending Checkout)',
        'pc-auth-title':           'Password Required',
        'pc-auth-body':            'Enter your login password to {action}.',
        'pc-auth-label':           'Password',
        'pc-auth-placeholder':     'Enter password…',
        'pc-auth-wrong':           'Incorrect password. Please try again.',
        'pc-auth-confirm':         'Confirm',
        'pc-auth-cancel':          'Cancel',
        'pc-action-lock':          'lock {name}',
        'pc-action-resolve':       'resolve this pending checkout',
        'pc-al-title-locked':      'Session Locked 🔒',
        'pc-al-locked':            '{name} was locked for later checkout. Amount pending: {amount} EGP.',
        'pc-desc-locked-tag':      'Locked (Pending Checkout)',
        'pc-no-charges':           'No charges',
        'pc-notebook-broadcast':   'System: Session {name} locked pending checkout. Amount: {amount} EGP.',
        'pc-admin-title':          '🔒 Pending Checkouts',
        'pc-admin-desc':           'Sessions/tables locked for later checkout. Resolving requires the password used at login.',
        'pc-empty':                'No pending checkouts right now.',
        'pc-src-console':          'Console / VIP',
        'pc-src-cafe':             'Cafe Table',
        'pc-src-shared':           'Shared Space',
        'pc-locked-by':            'Locked by',
        'pc-btn-forgive':          'Checkout Without Money',
        'pc-btn-deduct':           'Deduct from Employee',
        'pc-btn-checkout':         'Normal Checkout',
        'pc-al-forgiven':          'Pending checkout forgiven — no charge was recorded.',
        'pc-al-checkout-complete': 'Pending checkout resolved and recorded as income.',
        'pc-al-deduct-select-employee': 'Select the employee to deduct this amount from, then log the salary advance.',
        'pc-al-title-select-employee':  'Select Employee',
        'pc-deduct-note-prefill':  'Pending checkout: {desc}',
        'pc-finance-modal-title':  '🔒 Pending Checkouts',
        'pc-finance-modal-desc':   'Locked receipts awaiting checkout. Requires the password used at login.',
        'pc-finance-modal-close':  'Close',
        'pc-finance-btn-label':    'Pending Checkouts',

        /* ── Pending Checkouts ▸ History Log tab bar ── */
        'tab-pending-active':          'Pending Checkouts',
        'tab-pending-log':             'History Log',
        'pc-log-desc':                 'History of resolved pending checkouts — how each was resolved, by whom, and when.',
        'pc-log-empty':                'No resolved pending checkouts yet.',
        'pc-resolution-forgiven':      'Forgiven (No Charge)',
        'pc-resolution-deductemployee':'Deducted from Employee',
        'pc-resolution-checkout':      'Checked Out (Income Recorded)',
        'pc-resolved-by-at':           'Resolved by {user} • {time}',

        /* ── Document title ── */
        'app-title':              'saif-Fantasy',
    },

    ar: {
        /* ── Header ── */
        'lbl-session': 'الجلسة',
        'lbl-logout': 'تسجيل الخروج',

        /* ── Bottom Nav ── */
        'nav-lounge': 'الصالة',
        'nav-noroom': 'طلب بدون مكان',
        'nav-finance': 'المالية',

        /* ── Zone Buttons ── */
        'zone-vip': '👑 VIP',
        'zone-lounge': '🎮 الصالة',
        'zone-cafe': '☕ طاولات الكافيه',
        'zone-shared': '👥 المساحة المشتركة',

        /* ── Price Bar ── */
        'lounge-rate-single': 'فردي: ',
        'lounge-rate-multi': 'متعدد: ',
        'lounge-rate-iptv': 'IPTV: ',

        /* ── Views headings ── */
        'h2-noroom': 'طلب بدون مكان',
        'noroom-desc': 'سجّل الألعاب المطلوبة من زوار لم يلعبوا.',
        'noroom-game-placeholder': 'اسم اللعبة (مثال: FIFA 24)',
        'noroom-add-game': '+ أضف لعبة أخرى',
        'noroom-submit': 'تسجيل طلب الزيارة',

        'h2-finance': 'تتبع الماليات',
        'card-profit': 'صافي الربح',
        'card-income': 'الإيرادات',
        'card-expense': 'المصروفات',
        'lbl-add-expense': 'إضافة مصروف (ج.م.)',
        'lbl-expense-desc': 'الوصف',
        'btn-log-expense': 'تسجيل المصروف',

        /* ── Audits ── */
        'btn-back-audits': 'رجوع للصالة ⬅',
        'h2-audits': 'المراجعات والأسعار',
        'tab-audits-lounge': 'الصالة',
        'tab-audits-vip': 'VIP',
        'tab-audits-shared': 'المساحة المشتركة',
        'tab-audits-menu': 'قائمة المشروبات',
        'h3-console-pricing': '🎮 أسعار الكونسول',
        'h3-audits-vip': '👑 أسعار VIP',
        'h3-audits-shared': '🛋️ أسعار المساحة المشتركة',
        'h3-audits-menu': '🥤 قائمة المشروبات',
        'lbl-single': 'فردي (ج.م./ساعة):',
        'lbl-multi': 'متعدد (ج.م./ساعة):',
        'lbl-iptv': 'IPTV (ج.م./ساعة):',
        'lbl-vip': 'VIP (ج.م./ساعة):',
        'lbl-vip-ps4': 'VIP PS4 جيمنج (ج.م./ساعة):',
        'lbl-vip-ps5': 'VIP PS5 جيمنج (ج.م./ساعة):',
        'lbl-vip-iptv': 'VIP IPTV (ج.م./ساعة):',
        'lbl-shared': 'المساحة المشتركة (ج.م./ساعة):',
        'lbl-ps5-extra': 'إضافي PS5 (ج.م./ساعة):',
        'btn-save-pricing': 'حفظ الأسعار',
        'h3-drinks': '🥤 إدارة المشروبات',
        'drinks-desc': 'تعديل الأسعار أو إضافة عناصر جديدة.',
        'h4-add-item': 'إضافة عنصر جديد للقائمة',
        'ph-drink-name': 'الاسم (مثال: ريدبول)',
        'ph-drink-price': 'السعر (ج.م.)',
        'btn-add-item': 'إضافة عنصر',

        /* ── Expenses Admin ── */
        'btn-back-expenses': 'رجوع للصالة ⬅',
        'h2-modify-expenses': 'تعديل المصروفات',
        'tab-expenses-edit': 'تعديل المصروفات',
        'tab-expenses-log': 'سجل التعديلات',
        'expenses-desc': 'عرض وتعديل المصروفات المسجّلة مسبقاً.',
        'expenses-log-desc': 'سجل التعديلات التي تمت على المصروفات.',
        'btn-edit-expense-item': '✏️ تعديل',
        'lbl-no-expenses': 'لا توجد مصروفات مسجّلة.',
        'lbl-no-expense-edits': 'لا توجد تعديلات مصروفات مسجّلة بعد.',
        'lbl-edited-by-at': 'عدّله {user} • {time}',
        'lbl-amount-diff': 'المبلغ: {before} ← {after} ج.م.',
        'lbl-desc-diff': 'الوصف: "{before}" ← "{after}"',


        /* ── Admin Games ── */
        'btn-back-games': 'رجوع للصالة ⬅',
        'btn-export-clients': 'تصدير بيانات العملاء',
        'h2-games-asked': 'الألعاب المطلوبة',
        'games-desc': 'سجل كامل بجميع الألعاب المطلوبة (جلسات وزيارات).',

        /* ── Stock ── */
        'btn-back-stock': 'رجوع للصالة ⬅',
        'h2-stock': '📦 إدارة المخزون',
        'stab-overview': 'نظرة عامة',
        'stab-purchase': 'مشتريات',
        'stab-traceable': 'العناصر المتتبعة',
        'stab-components': 'المكوّنات',
        'stab-adjust': 'تعديل',
        'h3-stock-levels': 'مستويات المخزون الحالية',
        'btn-export-stock': '⬇ تصدير CSV',
        'h3-log-purchase': 'تسجيل مشترى',
        'purchase-desc': 'اختر عنصراً من القائمة وأدخل الكمية والتكلفة. يتم تسجيل المصروف تلقائياً.',
        'lbl-purchase-item': 'العنصر',
        'lbl-purchase-qty': 'الكمية (قطع)',
        'lbl-purchase-cost': 'إجمالي التكلفة (ج.م.)',
        'lbl-purchase-notes': 'ملاحظات (اختياري)',
        'ph-purchase-notes': 'مثال: المورد: أحمد',
        'btn-log-purchase': '✅ تسجيل المشترى والمصروف',
        'h3-purchase-history': 'سجل المشتريات',
        'btn-export-purchases': '⬇ تصدير CSV',
        'h3-traceable': 'العناصر المتتبعة',
        'traceable-desc': 'تحكم في العناصر التي يتم تتبعها في المخزون. العناصر غير المتتبعة لن تُخصم من المخزون عند البيع.',
        'h3-components': '🧪 مكوّنات المخزون',
        'components-desc': 'مكوّنات خام أو إضافات (مثل شراب النعناع) تشتريها وتتبعها في المخزون، لكنها لا تظهر بمفردها في قائمة العملاء. اربطها بوصفة مشروب من إدارة المشروبات حتى يتم خصم المكوّنات الصحيحة تلقائياً عند بيع ذلك المشروب.',
        'lbl-component-name': 'اسم المكوّن',
        'ph-component-name': 'مثال: شراب النعناع',
        'lbl-component-traceable': 'تتبّع مخزون هذا المكوّن',
        'btn-add-component': '+ إضافة مكوّن',
        'h3-existing-components': 'المكوّنات الحالية',
        'h3-adjust': 'تعديل المخزون يدوياً',
        'adjust-desc': 'سجّل المخزون المفقود أو التالف. لا يُنشأ مصروف مالي — فقط يُخصم من المخزون.',
        'lbl-adjust-item': 'العنصر',
        'lbl-adjust-qty': 'الكمية المخصومة (قطع)',
        'lbl-adjust-reason': 'السبب',
        'ph-adjust-reason': 'مثال: تالف، مفقود، عدد خاطئ',
        'btn-log-adjust': '⚠️ تسجيل التعديل',
        'h3-adjust-history': 'سجل التعديلات',
        'btn-export-adjust': '⬇ تصدير CSV',

        /* ── Employee ── */
        'btn-back-emp': 'رجوع للصالة ⬅',
        'h2-employees': '👥 الموظفون والاستخدام الشخصي',
        'etab-employees': 'الموظفون',
        'etab-personaluse': 'سجل الاستخدام الشخصي',
        'h3-add-emp': 'إضافة موظف',
        'lbl-emp-name': 'الاسم',
        'ph-emp-name': 'مثال: أحمد',
        'lbl-emp-salary': 'الراتب الشهري (ج.م.)',
        'ph-emp-salary': 'مثال: 3000',
        'btn-add-emp': '➕ إضافة موظف',
        'h3-payroll': '📅 كشف رواتب نهاية الشهر',
        'payroll-desc': 'صرف رواتب جميع الموظفين للشهر الحالي. تُسجَّل مصاريف الرواتب تلقائياً وتُصفَّر الخصومات الشهرية.',
        'btn-finalize-month': '📅 إغلاق الشهر',
        'lbl-current-employees': 'الموظفون الحاليون',
        'h3-log-personal': 'تسجيل استخدام شخصي / سلفة راتب',
        'lbl-puse-emp': 'الموظف',
        'lbl-puse-type': 'النوع',
        'puse-item-option': 'عنصر مستهلك',
        'puse-advance-option': 'سلفة راتب (نقدي)',
        'lbl-puse-menu-item': 'عنصر من القائمة',
        'lbl-puse-charge-mode': 'طريقة الاحتساب',
        'puse-half': '50% من سعر القائمة (افتراضي)',
        'puse-full': 'السعر الكامل',
        'puse-free': 'مجاني (بدون احتساب)',
        'puse-custom': 'مبلغ مخصص',
        'lbl-puse-custom': 'المبلغ المخصص (ج.م.)',
        'lbl-puse-qty': 'الكمية',
        'lbl-advance-amount': 'المبلغ المأخوذ (ج.م.)',
        'lbl-advance-note': 'ملاحظة (اختياري)',
        'ph-advance-note': 'مثال: طارئ',
        'puse-deduct-label': 'سيُخصم من الراتب:',
        'btn-log-puse': '📋 تسجيل الإدخال',
        'lbl-puse-filter': 'جميع الموظفين',
        'lbl-puse-history': 'السجل',
        'etab-loginhistory': 'سجل الدخول',
        'lbl-login-activity': 'نشاط تسجيل الدخول / الخروج',
        'lbl-login-filter-all': 'جميع المستخدمين',
        'btn-clear-login-history': '🗑 مسح السجل',
        'lbl-no-login-history': 'لم يتم تسجيل أي نشاط دخول بعد.',
        'badge-login': 'تسجيل دخول',
        'badge-logout': 'تسجيل خروج',
        'lbl-role': 'الدور:',

        /* ── Notebook ── */
        'notebook-title': '📓 دفتر الملاحظات',
        'notebook-composer-placeholder': 'اكتب ملاحظة…',
        'notebook-send': 'إرسال',
        'notebook-mention-everyone': 'الجميع',
        'notebook-mention-btn': '@',
        'notebook-pinned-section': '📌 مثبّتة',
        'notebook-empty': 'لا توجد ملاحظات بعد. ابدأ المحادثة!',
        'notebook-edited-tag': 'تم التعديل',
        'notebook-msg-pinned': 'تم تثبيت هذه الرسالة',
        'notebook-msg-unpinned': 'تم إلغاء تثبيت هذه الرسالة',
        'notebook-edit-btn': 'تعديل',
        'notebook-save-edit': 'حفظ',
        'notebook-cancel-edit': 'إلغاء',
        'notebook-to-everyone': 'إلى: الجميع',
        'notebook-to-user': 'إلى: {name}',
        'admin-btn-notebook': '📓 دفتر الملاحظات',
        'notebook-admin-title': '📓 إدارة دفتر الملاحظات',
        'notebook-admin-desc': 'جميع الملاحظات، تظهر هنا بغض النظر عمن قرأها.',
        'notebook-admin-mark-read': 'وضع علامة مقروء للجميع',
        'notebook-admin-delete': 'حذف للجميع',
        'notebook-admin-pin': 'تثبيت',
        'notebook-admin-unpin': 'إلغاء التثبيت',
        'notebook-admin-empty': 'لا توجد ملاحظات في الدفتر.',
        'notebook-directory-title': '👤 دليل مستخدمي دفتر الملاحظات',
        'notebook-directory-desc': 'يتحكم في قائمة الإشارة (@) وقواعد القراءة/عدم القراءة. لا يمنح دخولاً للتطبيق.',
        'ph-notebook-user-name': 'الاسم',
        'notebook-directory-add': '+ إضافة مستخدم',
        'notebook-directory-remove': 'إزالة',
        'notebook-role-user': 'مستخدم',
        'notebook-role-admin': 'مسؤول',
        'btn-back-notebook': 'رجوع للصالة ⬅',
        'cf-delete-note': 'حذف هذه الملاحظة للجميع؟ لا يمكن التراجع عن هذا.',
        'cf-remove-notebook-user': 'إزالة هذا المستخدم من دليل دفتر الملاحظات؟',

        /* ── Admin Sidebar ── */
        'sidebar-title': 'إدارة النظام',
        'admin-btn-audits': '📊 المراجعات والأسعار',
        'admin-btn-expenses': '💸 تعديل المصروفات',
        'admin-btn-games': '🎮 الألعاب المطلوبة',
        'admin-btn-stock': '📦 إدارة المخزون',
        'admin-btn-emp': '👥 الموظفون والاستخدام الشخصي',
        'h3-data-engine': '💾 محرك البيانات',
        'data-engine-desc': 'نسخ احتياطي أو استعادة قاعدة البيانات المالية.',
        'btn-export-csv': '⬇️ تصدير الماليات (CSV)',
        'lbl-restore': 'استعادة البيانات',
        'btn-import': '⬆️ استيراد البيانات',
        'admin-btn-logout': '🚪 تسجيل الخروج',

        /* ── Modals ── */
        'alert-title-default': 'إشعار',
        'confirm-title-default': 'تأكيد الإجراء',
        'btn-confirm-yes': 'نعم',
        'btn-confirm-no': 'لا',

        'migrate-title': 'نقل رسوم الطاولة',
        'migrate-desc': 'نقل جميع المشروبات والإضافات إلى جلسة PS.',
        'lbl-migrate-target': 'كونسول PS المستهدف:',
        'btn-migrate-confirm': 'نقل الرسوم الآن',
        'btn-migrate-cancel': 'إلغاء',

        'drinks-modal-title': 'المشروبات والإضافات',
        'lbl-drinks-preview-time': 'الوقت حتى الآن:',
        'lbl-drinks-preview-time-cost': 'تكلفة الوقت حتى الآن:',
        'lbl-drinks-preview-extras': 'إجمالي الإضافات',
        'lbl-ss-preview-console': 'الكونسول:',
        'lbl-ss-preview-mode': 'النمط:',
        'lbl-ss-preview-rate': 'السعر:',
        'h4-add-custom': 'إضافة عنصر مخصص',
        'btn-open-cwiz': '➕ إضافة عنصر مخصص',
        'ph-custom-name': 'اسم العنصر',
        'ph-custom-price': 'السعر',
        'btn-custom-add': 'إضافة',
        'btn-drinks-done': 'تم',

        /* ── Custom Item Wizard Modal ── */
        'cwiz-title': '➕ إضافة عنصر مخصص',
        'cwiz-desc': 'أدخل التفاصيل أدناه. يجب أن يغطي سعر البيع تكلفة جميع المكوّنات.',
        'lbl-cwiz-name': 'اسم العنصر',
        'ph-cwiz-name': 'مثال: كومبو خاص',
        'lbl-cwiz-price': 'سعر البيع (ج.م.)',
        'ph-cwiz-price': 'مثال: 50',
        'h-cwiz-stock-section': '📦 من مخزوننا (عناصر القائمة)',
        'btn-cwiz-add-row': '+ إضافة',
        'cwiz-stock-empty': 'لم تتم إضافة مكوّنات من المخزون.',
        'h-cwiz-outside-section': '🛒 مشتراة من الخارج (ليست في القائمة)',
        'cwiz-outside-empty': 'لم تتم إضافة مشتريات خارجية.',
        'ph-cwiz-outside-name': 'مثال: آيس كريم (تم شراؤه من الخارج)',
        'ph-cwiz-outside-cost': 'التكلفة',
        'lbl-cwiz-comp-total': 'إجمالي تكلفة المكوّنات:',
        'lbl-cwiz-sell-price': 'سعر البيع:',
        'cwiz-warning-low-price': '⚠️ سعر البيع أقل من إجمالي تكلفة المكوّنات!',
        'cwiz-warning-stock': '⚠️ لا يوجد مخزون كافٍ لعنصر واحد أو أكثر من العناصر المختارة — عدّل الكميات أو أعد التوريد قبل الإضافة.',
        'btn-cwiz-confirm': '✅ إضافة إلى الطلب',
        'btn-cwiz-cancel': 'إلغاء',
        'cwiz-stock-issue': '{name}: متبقٍ {avail} فقط (المطلوب {qty}).',

        'checkout-title': 'إنهاء الجلسة',
        'lbl-chk-console': 'الكونسول:',
        'lbl-chk-mode': 'النمط:',
        'lbl-chk-time': 'إجمالي الوقت:',
        'lbl-chk-phone': 'رقم هاتف العميل (اختياري)',
        'ph-chk-phone': 'أدخل رقم الهاتف',
        'btn-chk-confirm': 'تأكيد الدفع',
        'btn-chk-cancel': 'إلغاء',
        'lbl-amount-due': 'المبلغ المستحق',

        'edit-expense-title': 'تعديل إدخال المصروف',
        'lbl-edit-exp-desc': 'وصف المصروف:',
        'lbl-edit-exp-amt': 'المبلغ (ج.م.):',
        'btn-save-expense': 'حفظ التغييرات',
        'btn-cancel-expense': 'إلغاء',

        'start-session-title': 'بدء جلسة الكونسول',
        'start-session-desc': 'سجّل الألعاب المطلوبة لهذه الجلسة (اختياري)',
        'btn-add-game': '+ أضف لعبة أخرى',
        'ph-start-game': 'أدخل اسم اللعبة',
        'btn-start-confirm': 'تأكيد والبدء',
        'btn-start-cancel': 'إلغاء',

        'add-person-title': 'إضافة شخص',
        'add-person-desc': 'يبدأ الحساب فوراً بـ 25 ج.م./ساعة.',
        'ph-person-name': 'أدخل اسم الشخص (مثال: محمد)',
        'btn-person-start': 'بدء جلسة الشخص',
        'btn-person-cancel': 'إلغاء',

        'lbl-time-played': 'الوقت الذي لُعب:',
        'lbl-time-cost': 'تكلفة الوقت (25/ساعة):',
        'ph-person-custom-name': 'اسم العنصر المخصص',
        'lbl-person-total': 'الإجمالي المستحق',
        'btn-person-confirm': 'تأكيد الدفع',
        'btn-person-cancel2': 'إلغاء',

        'charge-emp-title': 'احتساب رسوم؟',
        'lbl-charge-emp': 'الموظف',
        'lbl-charge-mode': 'طريقة الاحتساب',
        'charge-half': '50% من سعر القائمة (افتراضي)',
        'charge-full': 'السعر الكامل',
        'charge-free': 'مجاني (بدون احتساب)',
        'deduct-label': 'سيُخصم من الراتب:',
        'btn-charge-confirm': '✅ تأكيد الاحتساب',
        'btn-charge-skip': 'تخطي / بدون احتساب',

        'edit-emp-title': 'تعديل بيانات الموظف',
        'lbl-edit-emp-name': 'الاسم',
        'lbl-edit-emp-salary': 'الراتب الشهري (ج.م.)',
        'btn-edit-emp-save': 'حفظ',
        'btn-edit-emp-cancel': 'إلغاء',

        'finalize-title': '🔐 إغلاق الشهر',
        'finalize-desc': 'راجع ملخص الرواتب أدناه. أدخل كلمة مرور المشرف للتأكيد والمعالجة.',
        'lbl-admin-pw': 'كلمة مرور المشرف',
        'ph-admin-pw': 'أدخل كلمة مرور المشرف…',
        'btn-finalize-confirm': '✅ تأكيد وإغلاق',
        'btn-finalize-cancel': 'إلغاء',
        'finalize-pw-error': '❌ كلمة المرور غير صحيحة. حاول مرة أخرى.',

        /* ── Dynamic render strings (used via T() in JS templates) ── */

        /* buildConsoles – cafe table card */
        'cafe-manage-desc':     'إدارة طلبات الزيارة والإضافات',
        'btn-add-drinks':       '🥤 إضافة مشروبات وإضافات',
        'btn-ask-game-log':     '📝 طلب لعبة (تسجيل طلب)',
        'btn-migrate-session':  '➡️ نقل إلى جلسة PS',
        'btn-checkout-table':   '💳 إنهاء الطاولة',
        'badge-open':           'مفتوح',

        /* buildConsoles – PS / VIP card */
        'badge-available':      'متاح',
        'badge-in-use':         'قيد الاستخدام',
        'btn-single':           'فردي',
        'btn-multi':            'متعدد',
        'btn-iptv':             'IPTV',
        'btn-start-open':       '⏱️ بدء وقت مفتوح',
        'ph-custom-mins':       'دقائق مخصصة',
        'btn-set':              'تعيين',
        'btn-add-extras':       '🥤 إضافة إضافات',
        'btn-checkout':         'إنهاء الجلسة',

        /* updateUI – session info box */
        'lbl-type':             'النوع:',
        'lbl-state':            'الحالة:',
        'time-open':            'وقت مفتوح',
        'time-fixed':           'ثابت',
        'mode-single':          'لاعب واحد',
        'mode-multi':           'متعدد اللاعبين',
        'mode-iptv':            'مشاهدة IPTV',

        /* renderSharedSpace */
        'shared-no-one':        'لا أحد هنا بعد.',
        'btn-add-drink-person': '+ مشروب',
        'btn-checkout-person':  'إنهاء',
        'btn-add-person':       '+ إضافة شخص',
        'badge-active-count':   'نشط',

        /* renderStockOverview */
        'lbl-price':            'السعر:',
        'lbl-traceable':        'متتبع',
        'lbl-pcs':              'قطعة',
        'lbl-not-tracked':      'غير متتبع',
        'lbl-not-traceable-note': 'غير متتبع — لا يُحسب في المخزون',
        'lbl-no-traceable-cfg': 'لا توجد عناصر متتبعة.',
        'lbl-go-traceable-tab': 'انتقل إلى تبويب "المتتبعة" لتفعيل التتبع.',
        'stock-label-out':      'نفد',
        'stock-label-low':      'منخفض',

        /* renderTraceableList */
        'lbl-stock':            'المخزون:',
        'lbl-not-tracked-short':'غير متتبع',
        'lbl-no-menu-items':    'لا توجد عناصر في قائمة المشروبات بعد.',

        /* populatePurchaseSelect / populateAdjustSelect */
        'ph-select-menu-item':  '— اختر عنصراً —',
        'ph-select-traceable':  '— اختر عنصراً متتبعاً —',
        'lbl-in-stock':         'في المخزون',
        'optgrp-menu-items':    'عناصر القائمة',
        'lbl-component-type':   'مكوّن',
        'lbl-components-not-tracked': 'المكوّنات — غير متتبعة',

        /* renderPurchaseHistory */
        'lbl-qty':              'الكمية:',
        'lbl-unit-cost':        'سعر الوحدة:',
        'lbl-no-purchases':     'لا توجد مشتريات مسجّلة بعد.',

        /* renderAdjustHistory */
        'lbl-before':           'قبل:',
        'lbl-after':            'بعد:',
        'lbl-reason':           'السبب:',
        'lbl-no-adjustments':   'لا توجد تعديلات مسجّلة بعد.',
        'lbl-current-stock':    'المخزون الحالي:',

        /* adj deducted unit */
        'adj-deducted':         'قطعة',

        /* renderEmpList */
        'lbl-salary':           'الراتب:',
        'lbl-per-month':        'ج.م./شهر',
        'lbl-net':              'الصافي:',
        'btn-edit-emp':         '✏️ تعديل',
        'btn-remove-emp':       '🗑 حذف',
        'lbl-no-employees':     'لم يتم إضافة موظفين بعد.',

        /* renderPersonalUseLog */
        'lbl-no-entries':       'لا توجد إدخالات بعد.',

        /* openFinalizeMonthModal */
        'lbl-salary-word':      'الراتب',
        'lbl-deductions':       'الخصومات',
        'lbl-total-cash-out':   'إجمالي الصرف',

        /* populatePuseSelects */
        'ph-select-employee':   '— اختر موظفاً —',
        'ph-select-item':       '— اختر عنصراً —',
        'ph-all-employees':     'جميع الموظفين',

        /* openChargeEmployeeModal */
        'ph-select-emp-charge': '— اختر موظفاً —',

        /* renderGamesAdminUI */
        'lbl-total-requests':   'إجمالي الطلبات:',
        'btn-view-details':     'عرض التفاصيل',
        'btn-hide-details':     'إخفاء التفاصيل',
        'lbl-no-games':         'لم يتم طلب ألعاب بعد.',

        /* toggleDetails (finance) */
        'lbl-day-in':           'داخل:',
        'lbl-day-out':          'خارج:',

        /* endCafeSession / openMigrateModal */
        'lbl-table-order':      'طلب طاولة',

        /* proceedToCheckoutUI */
        'chk-mode-open':        'وقت مفتوح',
        'chk-mode-fixed':       'ثابت',

        /* misc status */
        'lbl-active-badge':     'نشط',

        /* ── Shared alert/confirm titles ── */
        'al-title-missing-field':  'حقل ناقص',
        'al-title-success':        'تم بنجاح',
        'al-title-error':          'خطأ',
        'al-title-invalid-input':  'إدخال غير صالح',
        'al-title-export-failed':  'فشل التصدير',
        'al-title-export':         'تصدير',

        /* ── 04_admin_views.js ── */
        'al-fill-pricing':         'يرجى ملء جميع حقول التسعير.',
        'al-pricing-saved':        'تم حفظ إعدادات التسعير بنجاح!',
        'al-recipe-invalid-qty':   'كل صف في الوصفة يحتاج إلى كمية صالحة أكبر من 0.',
        'al-title-invalid-recipe': 'وصفة غير صالحة',
        'al-recipe-saved':         'تم حفظ الوصفة لـ "{name}".',
        'al-recipe-cleared':       'تم مسح الوصفة لـ "{name}" — أصبح الآن عنصرًا عاديًا.',
        'al-title-recipe-updated': 'تم تحديث الوصفة',
        'al-menu-item-updated':    'تم تحديث عنصر القائمة!',
        'al-invalid-name-price':   'اسم أو سعر غير صالح.',
        'cf-delete-menu-item':     'حذف هذا العنصر من القائمة؟',
        'al-fill-fields-price':    'يرجى ملء جميع الحقول بشكل صحيح. يجب أن يكون السعر رقمًا صالحًا.',
        'al-item-added':           'تمت إضافة عنصر جديد إلى القائمة!',
        'al-no-financial-data':    'لا توجد بيانات مالية متاحة للتصدير.',
        'al-export-db-failed':     'فشل تصدير قاعدة البيانات.',
        'al-select-csv-first':     'يرجى اختيار ملف CSV أولاً.',
        'al-title-import-failed':  'فشل الاستيراد',
        'al-csv-empty':            'يبدو أن ملف CSV فارغ.',
        'al-import-success':       'تم استيراد {count} سجل بنجاح!',
        'al-import-db-error':      'خطأ في قاعدة البيانات أثناء الاستيراد. تأكد من مطابقة التنسيق للتصدير.',

        /* ── 06_sessions.js ── */
        'al-invalid-minutes':      'يرجى إدخال عدد صحيح من الدقائق.',
        'al-hardware-locked':      'تشترك هذه الوحدة في نفس الجهاز مع {partner}، وهي قيد الاستخدام حاليًا. يرجى إنهاء تلك الجلسة أولاً.',
        'al-title-hardware-locked':'الجهاز مقفل',
        'al-enter-game-name':      'يرجى إدخال اسم لعبة واحدة على الأقل.',
        'al-title-empty-field':    'حقل فارغ',
        'al-walkin-logged':        'تم تسجيل طلب العميل بنجاح!',

        /* ── 09_checkout.js ── */
        'al-session-under-10min':  'كانت الجلسة أقل من 10 دقائق. تم تجاهلها.',
        'al-title-session-ignored':'تم تجاهل الجلسة',
        'cf-short-session-drinks': 'الجلسة أقل من 10 دقائق. هل تريد احتساب المشروبات؟',
        'al-title-short-session':  'جلسة قصيرة',
        'al-session-cancelled':    'تم إلغاء الجلسة بالكامل.',
        'al-title-cancelled':      'تم الإلغاء',
        'al-table-empty':          'الطاولة فارغة. لا توجد رسوم لإتمام الدفع.',
        'al-title-empty-table':    'طاولة فارغة',
        'al-table-no-items-migrate':'لا توجد عناصر نشطة في هذه الطاولة لنقلها.',
        'al-no-sessions-migrate':  'لا توجد حاليًا جلسات نشطة على أجهزة البلايستيشن لنقل العناصر إليها.',
        'al-title-no-sessions':    'لا توجد جلسات متاحة',
        'al-select-target-console':'يرجى اختيار جهاز الوجهة.',
        'al-title-validation-error':'خطأ في التحقق',
        'al-migration-inactive':   'لا يمكن نقل العناصر إلى جلسة جهاز غير نشطة.',
        'al-title-migration-blocked':'تم حظر النقل',
        'al-merge-limit-reached':  'تحتوي هذه الجلسة بالفعل على طاولتين مدمجتين. تم بلوغ الحد الأقصى.',
        'al-title-merge-limit':    'تم بلوغ حد الدمج',
        'cf-merge-second-table':   'تحتوي هذه الجلسة ({target}) بالفعل على طاولة واحدة مدمجة. هل أنت متأكد من دمج طاولة ثانية ({source})؟ هذا هو الحد الأقصى المسموح به.',
        'al-migration-complete':   'تم نقل جميع رسوم الطاولة بنجاح إلى {target}.',
        'al-title-migration-complete':'اكتمل النقل!',
        'al-session-closed-no-charge':'تم إغلاق الجلسة بدون رسوم.',
        'al-title-checkout-complete':'اكتمل الدفع',
        'al-checkout-success':     'تم الدفع بنجاح! تم تسجيل الإيراد.',

        /* ── 10_finance.js ── */
        'al-invalid-expense-amount':'يرجى إدخال مبلغ مصروف صالح.',
        'al-expense-recorded':     'تم تسجيل المصروف.',
        'al-invalid-amount':       'يرجى إدخال مبلغ صالح.',
        'al-desc-empty':           'لا يمكن أن يكون الوصف فارغًا.',
        'al-expense-updated':      'تم تحديث المصروف بنجاح!',

        /* ── 11_shared_space.js ── */
        'al-title-out-of-stock':   'نفدت الكمية',
        'al-person-checkout-success':'تم الدفع بنجاح لـ {name}! تم تسجيل الإيراد.',
        'al-no-client-data':       'لا توجد بيانات عملاء متاحة للتصدير.',
        'al-export-client-failed': 'فشل تصدير بيانات العملاء.',

        /* ── 12_stock.js ── */
        'al-enter-component-name': 'يرجى إدخال اسم المكوّن.',
        'al-component-added':      'تمت إضافة "{name}" كمكوّن مخزون.',
        'al-title-component-added':'تمت إضافة المكوّن',
        'cf-delete-component':     'حذف المكوّن "{name}"؟ سيتم الاحتفاظ بسجل المخزون الخاص به، لكن لن يعد قابلاً للشراء أو التتبع.{warning}',
        'cf-delete-component-warning':'\n\nتحذير: يُستخدم هذا المكوّن في وصفة: {items}. ستحتفظ تلك الوصفات بمرجع معلّق.',
        'al-select-item':          'يرجى اختيار عنصر.',
        'al-invalid-qty':          'يرجى إدخال كمية صالحة.',
        'al-invalid-total-cost':   'يرجى إدخال التكلفة الإجمالية الصحيحة.',
        'al-purchase-logged':      'تم شراء {qty}x {item} مقابل {cost} جنيه.\nتم تسجيل المصروف تلقائيًا.',
        'al-title-purchase-logged':'تم تسجيل الشراء',
        'al-select-traceable-item':'يرجى اختيار عنصر قابل للتتبع.',
        'al-enter-reason':         'يرجى إدخال السبب.',
        'al-adjustment-logged':    'تم خصم {qty} قطعة من {item}.\nالمخزون: {before} ← {after}',
        'al-title-adjustment-logged':'تم تسجيل التعديل',
        'al-no-traceable-export':  'لا توجد عناصر قابلة للتتبع للتصدير.',
        'al-no-purchases-export':  'لا توجد مشتريات للتصدير.',
        'al-no-adjustments-export':'لا توجد تعديلات للتصدير.',

        /* ── 13_employees.js ── */
        'al-enter-name':           'يرجى إدخال اسم.',
        'al-invalid-salary':       'يرجى إدخال راتب صالح.',
        'cf-delete-employee':      'حذف هذا الموظف؟ ستبقى سجلات الاستخدام الشخصي الخاصة به.',
        'al-select-employee':      'يرجى اختيار موظف.',
        'al-select-menu-item':     'يرجى اختيار عنصر من القائمة.',
        'al-invalid-advance-amount':'يرجى إدخال مبلغ سلفة صالح.',
        'al-personal-use-logged':  'تم التسجيل: {label}\nتم خصم {charge} جنيه من راتب {name}.',
        'al-title-personal-use-logged':'تم تسجيل الاستخدام الشخصي',
        'al-no-employees-finalize':'لا يوجد موظفون لإنهاء رواتبهم.',
        'al-title-payroll':        'الرواتب',
        'al-payroll-finalized':    'تم إنهاء رواتب {month}.\nتمت إعادة تعيين جميع الخصومات إلى الصفر.',
        'al-title-payroll-finalized':'تم إنهاء الشهر ✅',
        'cf-clear-login-history':  'مسح كل سجل الدخول/الخروج؟ لا يمكن التراجع عن هذا الإجراء.',

        /* ── 07_timer.js — native push notifications ── */
        'notif-title-10pct':      '⏰ تنبيه وقت (10%)',
        'notif-body-10pct':       'تبقّى لدى {name} 10% فقط من مدة الجلسة.',
        'notif-title-5pct':       '⚠️ تنبيه وقت عاجل (5%)',
        'notif-body-5pct':        'تبقّى لدى {name} 5% فقط من مدة الجلسة!',
        'notif-title-overtime':   '🚨 بدأ الوقت الإضافي',
        'notif-body-overtime':    'بدأ الوقت الإضافي لجلسة {name}',
        /* ── 17_sync.js — Multi-Device Sync indicator ── */
        'sync-offline-tooltip':    'غير متصل — سيتم المزامنة عند إعادة الاتصال',
        'sync-online-tooltip':     'متصل — تمت المزامنة',
        'sync-syncing-tooltip':    'جارِ المزامنة…',

        /* ── 16_pending_checkout.js — Escrow / Pending Checkout ── */
        'pc-menu-label':           'الحسابات المعلقة',
        'pc-back-label':           'العودة إلى الصالة',
        'pc-lock-tooltip':         'قفل للدفع لاحقًا',
        'pc-lock-label':           'قفل (حساب معلق)',
        'pc-auth-title':           'كلمة المرور مطلوبة',
        'pc-auth-body':            'أدخل كلمة مرور الدخول الخاصة بك لـ {action}.',
        'pc-auth-label':           'كلمة المرور',
        'pc-auth-placeholder':     'أدخل كلمة المرور…',
        'pc-auth-wrong':           'كلمة مرور غير صحيحة. حاول مرة أخرى.',
        'pc-auth-confirm':         'تأكيد',
        'pc-auth-cancel':          'إلغاء',
        'pc-action-lock':          'قفل {name}',
        'pc-action-resolve':       'حل هذا الحساب المعلق',
        'pc-al-title-locked':      'تم قفل الجلسة 🔒',
        'pc-al-locked':            'تم قفل {name} للدفع لاحقًا. المبلغ المعلق: {amount} جنيه.',
        'pc-desc-locked-tag':      'مقفل (حساب معلق)',
        'pc-no-charges':           'لا توجد رسوم',
        'pc-notebook-broadcast':   'النظام: تم قفل جلسة {name} في انتظار الدفع. المبلغ: {amount} جنيه.',
        'pc-admin-title':          '🔒 الحسابات المعلقة',
        'pc-admin-desc':           'الجلسات/الطاولات المقفلة لدفع لاحق. يتطلب حل الحساب كلمة مرور الدخول.',
        'pc-empty':                'لا توجد حسابات معلقة حاليًا.',
        'pc-src-console':          'جهاز / VIP',
        'pc-src-cafe':             'طاولة كافيه',
        'pc-src-shared':           'المساحة المشتركة',
        'pc-locked-by':            'تم القفل بواسطة',
        'pc-btn-forgive':          'دفع بدون مال',
        'pc-btn-deduct':           'خصم من الموظف',
        'pc-btn-checkout':         'دفع عادي',
        'pc-al-forgiven':          'تم إسقاط الحساب المعلق — لم يتم تسجيل أي رسوم.',
        'pc-al-checkout-complete': 'تم حل الحساب المعلق وتسجيله كدخل.',
        'pc-al-deduct-select-employee': 'اختر الموظف الذي سيُخصم منه هذا المبلغ، ثم سجّل السلفة.',
        'pc-al-title-select-employee':  'اختر الموظف',
        'pc-deduct-note-prefill':  'حساب معلق: {desc}',
        'pc-finance-modal-title':  '🔒 الحسابات المعلقة',
        'pc-finance-modal-desc':   'إيصالات مقفلة في انتظار الدفع. يتطلب كلمة مرور الدخول.',
        'pc-finance-modal-close':  'إغلاق',
        'pc-finance-btn-label':    'الحسابات المعلقة',

        /* ── 16_pending_checkout.js — Escrow / Pending Checkout ── */
        'pc-menu-label':           'الحسابات المعلقة',
        'pc-back-label':           'العودة إلى الصالة',
        'pc-lock-tooltip':         'قفل للدفع لاحقًا',
        'pc-lock-label':           'قفل (حساب معلّق)',
        'pc-auth-title':           'كلمة المرور مطلوبة',
        'pc-auth-body':            'أدخل كلمة مرور تسجيل الدخول الخاصة بك لـ {action}.',
        'pc-auth-label':           'كلمة المرور',
        'pc-auth-placeholder':     'أدخل كلمة المرور…',
        'pc-auth-wrong':           'كلمة مرور غير صحيحة. حاول مرة أخرى.',
        'pc-auth-confirm':         'تأكيد',
        'pc-auth-cancel':          'إلغاء',
        'pc-action-lock':          'قفل {name}',
        'pc-action-resolve':       'إنهاء هذا الحساب المعلّق',
        'pc-al-title-locked':      'تم قفل الجلسة 🔒',
        'pc-al-locked':            'تم قفل {name} للدفع لاحقًا. المبلغ المعلّق: {amount} جنيه.',
        'pc-desc-locked-tag':      'مقفلة (حساب معلّق)',
        'pc-no-charges':           'لا توجد رسوم',
        'pc-notebook-broadcast':   'النظام: تم قفل جلسة {name} في انتظار الدفع. المبلغ: {amount} جنيه.',
        'pc-admin-title':          '🔒 الحسابات المعلقة',
        'pc-admin-desc':           'الجلسات/الطاولات المقفلة لدفع لاحق. يتطلب الإنهاء نفس كلمة مرور تسجيل الدخول.',
        'pc-empty':                'لا توجد حسابات معلقة حاليًا.',
        'pc-src-console':          'جهاز / VIP',
        'pc-src-cafe':             'طاولة الكافيه',
        'pc-src-shared':           'المساحة المشتركة',
        'pc-locked-by':            'تم القفل بواسطة',
        'pc-btn-forgive':          'إنهاء بدون دفع',
        'pc-btn-deduct':           'خصم من الموظف',
        'pc-btn-checkout':         'دفع عادي',
        'pc-al-forgiven':          'تم إسقاط الحساب المعلّق — لم يتم تسجيل أي رسوم.',
        'pc-al-checkout-complete': 'تم إنهاء الحساب المعلّق وتسجيله كدخل.',
        'pc-al-deduct-select-employee': 'اختر الموظف الذي سيُخصم منه هذا المبلغ، ثم سجّل السلفة.',
        'pc-al-title-select-employee':  'اختيار الموظف',
        'pc-deduct-note-prefill':  'حساب معلّق: {desc}',
        'pc-finance-modal-title':  '🔒 الحسابات المعلقة',
        'pc-finance-modal-desc':   'إيصالات مقفلة بانتظار الدفع. يتطلب نفس كلمة مرور تسجيل الدخول.',
        'pc-finance-modal-close':  'إغلاق',
        'pc-finance-btn-label':    'الحسابات المعلقة',

        /* ── Pending Checkouts ▸ History Log tab bar ── */
        'tab-pending-active':          'الحسابات المعلقة',
        'tab-pending-log':             'سجل التاريخ',
        'pc-log-desc':                 'سجل الحسابات المعلقة التي تم حلها — كيف تم حلها، بواسطة من، ومتى.',
        'pc-log-empty':                'لا توجد حسابات معلقة تم حلها بعد.',
        'pc-resolution-forgiven':      'تم الإسقاط (بدون رسوم)',
        'pc-resolution-deductemployee':'تم الخصم من الموظف',
        'pc-resolution-checkout':      'تم الدفع (تم تسجيل الدخل)',
        'pc-resolved-by-at':           'تم الحل بواسطة {user} • {time}',

        /* ── Document title ── */
        'app-title':              'saif-Fantasy',
    }
};

/* Map of element IDs to translation keys + how to update them.
   type: 'text'        → element.innerText
   type: 'placeholder' → element.placeholder
   type: 'html'        → element.innerHTML  (for price bar spans with nested <strong>)
*/
const ELEMENT_MAP = [
    /* ── Header ── */
    { id: 'lbl-session',        key: 'lbl-session',        type: 'text' },
    { id: 'lbl-logout',         key: 'lbl-logout',         type: 'text' },

    /* ── Bottom Nav ── */
    { id: 'btn-lounge',         key: 'nav-lounge',         type: 'nav-text' },
    { id: 'btn-noroom',         key: 'nav-noroom',         type: 'nav-text' },
    { id: 'btn-finance',        key: 'nav-finance',        type: 'nav-text' },

    /* ── Zone Buttons ── */
    { id: 'zone-vip',           key: 'zone-vip',           type: 'text' },
    { id: 'zone-lounge',        key: 'zone-lounge',        type: 'text' },
    { id: 'zone-cafe',          key: 'zone-cafe',          type: 'text' },
    { id: 'zone-shared',        key: 'zone-shared',        type: 'text' },

    /* ── Stock Tabs ── */
    { id: 'stab-overview',      key: 'stab-overview',      type: 'text' },
    { id: 'stab-purchase',      key: 'stab-purchase',      type: 'text' },
    { id: 'stab-traceable',     key: 'stab-traceable',     type: 'text' },
    { id: 'stab-components',    key: 'stab-components',    type: 'text' },
    { id: 'stab-adjust',        key: 'stab-adjust',        type: 'text' },

    /* ── Stock Components Panel ── */
    { id: 'h3-components',           key: 'h3-components',           type: 'text' },
    { id: 'components-desc',         key: 'components-desc',         type: 'text' },
    { id: 'lbl-component-name',      key: 'lbl-component-name',      type: 'text' },
    { id: 'new-component-name',      key: 'ph-component-name',       type: 'placeholder' },
    { id: 'lbl-component-traceable', key: 'lbl-component-traceable', type: 'text' },
    { id: 'btn-add-component',       key: 'btn-add-component',       type: 'text' },
    { id: 'h3-existing-components',  key: 'h3-existing-components',  type: 'text' },

    /* ── Employee Tabs ── */
    { id: 'etab-employees',     key: 'etab-employees',     type: 'text' },
    { id: 'etab-personaluse',   key: 'etab-personaluse',   type: 'text' },
    { id: 'etab-loginhistory',  key: 'etab-loginhistory',  type: 'text' },

    /* ── Login History Panel ── */
    { id: 'lbl-login-activity',       key: 'lbl-login-activity',       type: 'text' },
    { id: 'btn-clear-login-history',  key: 'btn-clear-login-history',  type: 'text' },

    /* ── 16_pending_checkout.js — static labels ── */
    { id: 'pc-menu-label-el',          key: 'pc-menu-label',          type: 'text' },
    { id: 'pc-back-label-el',          key: 'pc-back-label',          type: 'text' },
    { id: 'pc-admin-title-el',         key: 'pc-admin-title',         type: 'text' },
    { id: 'pc-admin-desc-el',          key: 'pc-admin-desc',          type: 'text' },
    { id: 'pc-finance-btn-label-el',   key: 'pc-finance-btn-label',   type: 'text' },
    { id: 'pc-finance-modal-title-el', key: 'pc-finance-modal-title', type: 'text' },
    { id: 'pc-finance-modal-desc-el',  key: 'pc-finance-modal-desc',  type: 'text' },
    { id: 'pc-finance-modal-close-el', key: 'pc-finance-modal-close', type: 'text' },
    { id: 'pctab-active',              key: 'tab-pending-active',     type: 'text' },
    { id: 'pctab-log',                 key: 'tab-pending-log',        type: 'text' },
    { id: 'pc-log-desc-el',            key: 'pc-log-desc',            type: 'text' },
];

let currentLang = localStorage.getItem('app_lang') || 'en';

/* ── Global translation shorthand ─────────────────────────────────
   Usage anywhere in the codebase: T('key')
   Returns the Arabic string when Arabic is active, English otherwise.
   Falls back to the key itself so nothing ever renders blank.
──────────────────────────────────────────────────────────────── */
function T(key) {
    const lang = currentLang || 'en';
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) || key;
}

/* ── Translation with variable interpolation ──────────────────────
   Usage: Tf('al-recipe-saved', { name: drink.name })
   Looks up T(key), then replaces every {varName} placeholder with the
   matching value from `vars`. Any placeholder without a matching value
   is left as-is so a missing var is easy to spot instead of silently
   disappearing.
──────────────────────────────────────────────────────────────── */
function Tf(key, vars) {
    let str = T(key);
    if (!vars) return str;
    Object.keys(vars).forEach(function (k) {
        str = str.split('{' + k + '}').join(vars[k]);
    });
    return str;
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'ar' : 'en';
    localStorage.setItem('app_lang', currentLang);
    applyLanguage();
    refreshDynamicContentForLanguage();
}

/* ── Force every dynamically-built list/grid to redraw in the new language
     right away, instead of waiting for the next navigation/render trigger.
     Safe to call even when a given view is hidden — the container elements
     stay in the DOM, they just aren't visible. ──────────────────────── */
function refreshDynamicContentForLanguage() {
    function safeCall(fn) {
        if (typeof fn === 'function') {
            try { fn(); } catch (e) { console.error(e); }
        }
    }

    // Console / table grid for whichever zone is currently selected
    if (currentZone === 'shared') {
        safeCall(window.renderSharedSpace);
    } else {
        safeCall(window.buildConsoles);
    }
    safeCall(window.updateUI);
    safeCall(window.updateSyncIndicator);

    // Finance tab
    safeCall(window.updateFinanceUI);

    // Admin sub-views (drinks menu, expenses list, games log, stock, employees)
    safeCall(window.renderDrinksAdmin);
    safeCall(window.renderExpensesAdmin);
    safeCall(window.renderExpenseEditLog);
    safeCall(window.renderGamesAdminUI);
    safeCall(window.renderStockOverview);
    safeCall(window.renderTraceableList);
    safeCall(window.populatePurchaseSelect);
    safeCall(window.populateAdjustSelect);
    safeCall(window.renderPurchaseHistory);
    safeCall(window.renderAdjustHistory);
    safeCall(window.renderEmpList);
    safeCall(window.renderPersonalUseLog);
    safeCall(window.populatePuseSelects);
    safeCall(window.renderLoginHistory);
    safeCall(window.populateLoginHistoryFilter);
}

function applyLanguage() {
    const isAr = currentLang === 'ar';
    const T = TRANSLATIONS[currentLang];

    /* ── Document title ── */
    document.title = T['app-title'];

    /* ── Direction & font ── */
    document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', currentLang);

    /* ── Body font for Arabic ── */
    document.body.style.fontFamily = isAr
        ? "'Cairo', 'Segoe UI', 'Tahoma', sans-serif"
        : "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif";

    /* ── Sidebar direction ── */
    const sidebar = document.getElementById('adminMenu');
    if (sidebar) {
        if (isAr) {
            sidebar.style.left  = 'auto';
            sidebar.style.right = '0';
            sidebar.style.transform = 'translateX(100%)';
            sidebar.style.borderRight = 'none';
            sidebar.style.borderLeft = '0.5px solid rgba(255,255,255,0.07)';
            if (sidebar.classList.contains('open')) {
                sidebar.style.transform = 'translateX(0)';
            }
        } else {
            sidebar.style.right = 'auto';
            sidebar.style.left  = '0';
            sidebar.style.transform = sidebar.classList.contains('open') ? 'translateX(0)' : 'translateX(-100%)';
            sidebar.style.borderLeft  = 'none';
            sidebar.style.borderRight = '0.5px solid rgba(255,255,255,0.07)';
        }
    }

    /* ── Active console card stripe ── */
    const styleTag = document.getElementById('rtl-stripe-style') || (() => {
        const s = document.createElement('style');
        s.id = 'rtl-stripe-style';
        document.head.appendChild(s);
        return s;
    })();
    if (isAr) {
        styleTag.textContent = `
            .console-card.active::after,
            .console-card.overtime::after {
                left: auto !important;
                right: 0 !important;
                border-radius: 2px 0 0 2px !important;
            }
            .admin-menu-btn { text-align: right !important; }
            select {
                background-position: left 14px center !important;
                padding-right: 14px !important;
                padding-left: 36px !important;
            }
            .admin-sidebar { transform: translateX(100%); }
            .admin-sidebar.open { transform: translateX(0) !important; }
        `;
    } else {
        styleTag.textContent = `
            .admin-sidebar { transform: translateX(-100%); }
            .admin-sidebar.open { transform: translateX(0) !important; }
        `;
    }

    /* ── Static mapped elements ── */
    ELEMENT_MAP.forEach(function(entry) {
        const el = document.getElementById(entry.id);
        if (!el || !T[entry.key]) return;
        if (entry.type === 'text') {
            el.innerText = T[entry.key];
        } else if (entry.type === 'nav-text') {
            /* Nav buttons have an emoji span as first child; preserve it */
            const icon = el.querySelector('span');
            el.innerText = T[entry.key];
            if (icon) el.insertBefore(icon, el.firstChild);
        }
    });

    /* ── Price bar spans (contain nested <strong>) ── */
    _updatePriceBarLabel('lounge-rate-single', T['lounge-rate-single'], 'display-rate-single');
    _updatePriceBarLabel('lounge-rate-multi',  T['lounge-rate-multi'],  'display-rate-multi');
    _updatePriceBarLabel('lounge-rate-iptv',   T['lounge-rate-iptv'],   'display-rate-iptv');

    /* ── PS5 extra label ── */
    const ps5span = document.getElementById('lounge-rate-ps5');
    if (ps5span) {
        ps5span.innerText = isAr
            ? `(+ ${RATE_PS5_EXTRA}/ساعة لـ PS5)`
            : `(+ ${RATE_PS5_EXTRA}/hr for PS5)`;
    }

    /* ── VIP rate label ── */
    const vipSpan = document.getElementById('vip-rate-display');
    if (vipSpan) {
        const strong = vipSpan.querySelector('strong');
        const val = strong ? strong.outerHTML : '';
        vipSpan.innerHTML = (isAr ? 'VIP: ' : 'VIP: ') + val;
    }

    /* ── Shared rate label ── */
    const sharedSpan = document.getElementById('shared-rate-display');
    if (sharedSpan) {
        const strong = sharedSpan.querySelector('strong');
        const val = strong ? strong.outerHTML : '';
        sharedSpan.innerHTML = (isAr ? 'مشترك: ' : 'Shared Space: ') + val + (isAr ? '/ساعة' : '/hr');
    }

    /* ── No Room view ── */
    _setText('noroom-view',    'h2',  T['h2-noroom']);
    _setTextBySelector('#noroom-view .admin-section > p', T['noroom-desc']);
    _setAttrByClass('noroom-game-input', 'placeholder', T['noroom-game-placeholder']);
    _setButtonText('noroom-view', '.btn-blue',    T['noroom-add-game']);
    _setButtonText('noroom-view', '.btn-success', T['noroom-submit']);

    /* ── Finance view ── */
    _setText('financial-view', 'h2', T['h2-finance']);
    _setTextOnCard(0, 'h3', T['card-profit']);
    _setTextOnCard(1, 'h3', T['card-income']);
    _setTextOnCard(2, 'h3', T['card-expense']);
    _setLabelText('entry-expense',         T['lbl-add-expense']);
    _setLabelText('entry-expense-comment', T['lbl-expense-desc']);
    _setButtonInGrid('.form-grid button', T['btn-log-expense']);

    /* ── Audits view ── */
    _setText('audits-view', 'h2', T['h2-audits']);
    _setBackBtn('audits-view', T['btn-back-audits']);
    _setAuditsTabLabels(T);
    _setAuditsLabels(T, isAr);

    /* ── Expenses Admin view ── */
    _setText('expenses-admin-view', 'h2', T['h2-modify-expenses']);
    _setBackBtn('expenses-admin-view', T['btn-back-expenses']);
    _setElemText('xtab-edit', T['tab-expenses-edit']);
    _setElemText('xtab-log', T['tab-expenses-log']);
    _setElemText('p-expenses-edit-desc', T['expenses-desc']);
    _setElemText('p-expenses-log-desc', T['expenses-log-desc']);

    /* ── Admin Games view ── */
    _setText('admin-games-view', 'h2', T['h2-games-asked']);
    _setBackBtn('admin-games-view', T['btn-back-games']);
    _setTextBySelector('#admin-games-view > p', T['games-desc']);
    const exportClientBtn = document.querySelector('#admin-games-view .btn.btn-primary');
    if (exportClientBtn) exportClientBtn.innerText = T['btn-export-clients'];

    /* ── Stock view ── */
    _setText('stock-view', 'h2', T['h2-stock']);
    _setBackBtn('stock-view', T['btn-back-stock']);
    _setStockLabels(T, isAr);

    /* ── Employee view ── */
    _setText('employee-view', 'h2', T['h2-employees']);
    _setBackBtn('employee-view', T['btn-back-emp']);
    _setEmpLabels(T, isAr);

    /* ── Admin Sidebar ── */
    const sidebarTitle = document.querySelector('#adminMenu h2');
    if (sidebarTitle) sidebarTitle.innerText = T['sidebar-title'];
    _setSidebarMenuBtns(T);

    /* ── Modals ── */
    _setModalLabels(T, isAr);

    /* ── Globe button tooltip ── */
    const globeBtn = document.getElementById('lang-toggle-btn');
    if (globeBtn) globeBtn.title = isAr ? 'تبديل إلى الإنجليزية' : 'Toggle Arabic / English';
}

/* ── Helper: update a price-bar span while preserving its <strong> ── */
function _updatePriceBarLabel(spanId, labelText, strongId) {
    const span = document.getElementById(spanId);
    const strong = document.getElementById(strongId);
    if (!span || !strong) return;
    span.innerHTML = '';
    span.appendChild(document.createTextNode(labelText));
    span.appendChild(strong);
}

function _setText(viewId, selector, text) {
    if (!text) return;
    const view = document.getElementById(viewId);
    if (!view) return;
    const el = view.querySelector(selector);
    if (el) el.innerText = text;
}

function _setTextBySelector(selector, text) {
    if (!text) return;
    const el = document.querySelector(selector);
    if (el) el.innerText = text;
}

function _setAttrByClass(className, attr, val) {
    if (!val) return;
    document.querySelectorAll('.' + className).forEach(function(el) {
        el[attr] = val;
    });
}

function _setButtonText(viewId, btnSelector, text) {
    if (!text) return;
    const view = document.getElementById(viewId);
    if (!view) return;
    const btn = view.querySelector(btnSelector);
    if (btn) btn.innerText = text;
}

function _setTextOnCard(index, selector, text) {
    if (!text) return;
    const cards = document.querySelectorAll('#finance-summary .card');
    if (cards[index]) {
        const el = cards[index].querySelector(selector);
        if (el) el.innerText = text;
    }
}

function _setLabelText(inputId, text) {
    if (!text) return;
    const input = document.getElementById(inputId);
    if (!input) return;
    const label = input.previousElementSibling;
    if (label && label.tagName === 'LABEL') label.innerText = text;
}

function _setButtonInGrid(selector, text) {
    if (!text) return;
    const btn = document.querySelector(selector);
    if (btn) btn.innerText = text;
}

function _setBackBtn(viewId, text) {
    if (!text) return;
    const view = document.getElementById(viewId);
    if (!view) return;
    const btn = view.querySelector('button:first-child');
    if (btn) btn.innerText = text;
}

// Generic getElementById-based text setter. Used by any markup that carries
// a stable, unique id (per rule in Pricing_Selector_And_Expense_Log_Plan.md
// §2/§3 — no more querySelectorAll/positional DOM lookups for new views).
function _setElemText(elemId, text) {
    if (!text) return;
    const el = document.getElementById(elemId);
    if (el) el.innerText = text;
}

// Sets the 4 Audits & Pricing tab-bar button labels. Separate from
// _setAuditsLabels() (below) so it can also be called from switchAuditsTab's
// language re-apply without re-walking the whole view.
function _setAuditsTabLabels(T) {
    _setElemText('atab-lounge', T['tab-audits-lounge']);
    _setElemText('atab-vip', T['tab-audits-vip']);
    _setElemText('atab-shared', T['tab-audits-shared']);
    _setElemText('atab-menu', T['tab-audits-menu']);
}

// Rewritten per Pricing_Selector_And_Expense_Log_Plan.md §2: every element
// this function touches now carries a stable, unique id, so lookups go
// through getElementById() exclusively — no more querySelectorAll('h3') /
// positional labelMap, which is what silently mislabeled "VIP Pricing" as
// "Drinks Management" and left the VIP PS4/PS5/IPTV labels untranslated.
function _setAuditsLabels(T, isAr) {
    const v = document.getElementById('audits-view');
    if (!v) return;

    // Lounge tab
    _setElemText('h3-audits-lounge', T['h3-console-pricing']);
    _setElemText('lbl-audits-single', T['lbl-single']);
    _setElemText('lbl-audits-multi', T['lbl-multi']);
    _setElemText('lbl-audits-iptv', T['lbl-iptv']);
    _setElemText('lbl-audits-ps5-extra', T['lbl-ps5-extra']);
    _setElemText('btn-save-audits-lounge', T['btn-save-pricing']);

    // VIP tab
    _setElemText('h3-audits-vip', T['h3-audits-vip']);
    _setElemText('lbl-audits-vip-ps4', T['lbl-vip-ps4']);
    _setElemText('lbl-audits-vip-ps5', T['lbl-vip-ps5']);
    _setElemText('lbl-audits-vip-iptv', T['lbl-vip-iptv']);
    _setElemText('btn-save-audits-vip', T['btn-save-pricing']);

    // Shared Area tab
    _setElemText('h3-audits-shared', T['h3-audits-shared']);
    _setElemText('lbl-audits-shared', T['lbl-shared']);
    _setElemText('btn-save-audits-shared', T['btn-save-pricing']);

    // Drinks Menu tab
    _setElemText('h3-audits-menu', T['h3-audits-menu']);
    _setElemText('p-audits-menu-desc', T['drinks-desc']);
    _setElemText('h4-audits-add-item', T['h4-add-item']);
    _setElemText('btn-audits-add-item', T['btn-add-item']);

    const newDrinkName = document.getElementById('new-drink-name');
    if (newDrinkName) newDrinkName.placeholder = T['ph-drink-name'];
    const newDrinkPrice = document.getElementById('new-drink-price');
    if (newDrinkPrice) newDrinkPrice.placeholder = T['ph-drink-price'];
}

function _setStockLabels(T, isAr) {
    const v = document.getElementById('stock-view');
    if (!v) return;

    const overviewH3 = v.querySelector('#stock-panel-overview h3');
    if (overviewH3) overviewH3.innerText = T['h3-stock-levels'];

    const exportStockBtn = v.querySelector('button[onclick="exportStockCSV()"]');
    if (exportStockBtn) exportStockBtn.innerText = T['btn-export-stock'];

    /* Purchase tab */
    const purch = document.getElementById('stock-panel-purchase');
    if (purch) {
        const h3s = purch.querySelectorAll('h3');
        if (h3s[0]) h3s[0].innerText = T['h3-log-purchase'];
        if (h3s[1]) h3s[1].innerText = T['h3-purchase-history'];
        const desc = purch.querySelector('.admin-section p');
        if (desc) desc.innerText = T['purchase-desc'];
        const labels = purch.querySelectorAll('.admin-section label');
        const lkeys = ['lbl-purchase-item','lbl-purchase-qty','lbl-purchase-cost','lbl-purchase-notes'];
        labels.forEach(function(l, i){ if(lkeys[i] && T[lkeys[i]]) l.innerText = T[lkeys[i]]; });
        const purchNotes = document.getElementById('purchase-notes');
        if (purchNotes) purchNotes.placeholder = T['ph-purchase-notes'];
        const logBtn = purch.querySelector('button[onclick="logPurchase()"]');
        if (logBtn) logBtn.innerText = T['btn-log-purchase'];
        const exportBtn = purch.querySelector('button[onclick="exportPurchasesCSV()"]');
        if (exportBtn) exportBtn.innerText = T['btn-export-purchases'];
    }

    /* Traceable tab */
    const trace = document.getElementById('stock-panel-traceable');
    if (trace) {
        const h3 = trace.querySelector('h3');
        if (h3) h3.innerText = T['h3-traceable'];
        const desc = trace.querySelector('p');
        if (desc) desc.innerText = T['traceable-desc'];
    }

    /* Adjust tab */
    const adj = document.getElementById('stock-panel-adjust');
    if (adj) {
        const h3s = adj.querySelectorAll('h3');
        if (h3s[0]) h3s[0].innerText = T['h3-adjust'];
        if (h3s[1]) h3s[1].innerText = T['h3-adjust-history'];
        const desc = adj.querySelector('.admin-section p');
        if (desc) desc.innerText = T['adjust-desc'];
        const labels = adj.querySelectorAll('.admin-section label');
        const lkeys = ['lbl-adjust-item','lbl-adjust-qty','lbl-adjust-reason'];
        labels.forEach(function(l, i){ if(lkeys[i] && T[lkeys[i]]) l.innerText = T[lkeys[i]]; });
        const adjReason = document.getElementById('adjust-reason');
        if (adjReason) adjReason.placeholder = T['ph-adjust-reason'];
        const logBtn = adj.querySelector('button[onclick="logAdjustment()"]');
        if (logBtn) logBtn.innerText = T['btn-log-adjust'];
        const exportBtn = adj.querySelector('button[onclick="exportAdjustmentsCSV()"]');
        if (exportBtn) exportBtn.innerText = T['btn-export-adjust'];
    }
}

function _setEmpLabels(T, isAr) {
    const v = document.getElementById('employee-view');
    if (!v) return;

    /* Employees panel */
    const empPanel = document.getElementById('emp-panel-employees');
    if (empPanel) {
        const h3s = empPanel.querySelectorAll('h3');
        if (h3s[0]) h3s[0].innerText = T['h3-add-emp'];
        /* payroll h3 */
        const payH3 = empPanel.querySelector('.admin-section:nth-child(2) h3');
        if (payH3) payH3.innerText = T['h3-payroll'];
        const payDesc = empPanel.querySelector('.admin-section:nth-child(2) p');
        if (payDesc) payDesc.innerText = T['payroll-desc'];
        const payBtn = empPanel.querySelector('button[onclick="openFinalizeMonthModal()"]');
        if (payBtn) payBtn.innerText = T['btn-finalize-month'];

        const labels = empPanel.querySelectorAll('.admin-section:first-child label');
        if (labels[0]) labels[0].innerText = T['lbl-emp-name'];
        if (labels[1]) labels[1].innerText = T['lbl-emp-salary'];
        const empAddName = document.getElementById('emp-add-name');
        if (empAddName) empAddName.placeholder = T['ph-emp-name'];
        const empAddSalary = document.getElementById('emp-add-salary');
        if (empAddSalary) empAddSalary.placeholder = T['ph-emp-salary'];
        const addEmpBtn = empPanel.querySelector('button[onclick="addEmployee()"]');
        if (addEmpBtn) addEmpBtn.innerText = T['btn-add-emp'];

        const currentEmpLabel = empPanel.querySelector('div[style*="text-transform:uppercase"]');
        if (currentEmpLabel) currentEmpLabel.innerText = T['lbl-current-employees'];
    }

    /* Personal use panel */
    const pusePanel = document.getElementById('emp-panel-personaluse');
    if (pusePanel) {
        const h3 = pusePanel.querySelector('h3');
        if (h3) h3.innerText = T['h3-log-personal'];
        const labels = pusePanel.querySelectorAll('.admin-section label');
        const lkeys = ['lbl-puse-emp','lbl-puse-type','lbl-puse-menu-item','lbl-puse-charge-mode'];
        labels.forEach(function(l, i){ if(lkeys[i] && T[lkeys[i]]) l.innerText = T[lkeys[i]]; });

        /* select options */
        const typeSelect = document.getElementById('puse-type');
        if (typeSelect && typeSelect.options[0]) {
            typeSelect.options[0].text = T['puse-item-option'];
            if (typeSelect.options[1]) typeSelect.options[1].text = T['puse-advance-option'];
        }
        const modeSelect = document.getElementById('puse-charge-mode');
        if (modeSelect) {
            const modeKeys = ['puse-half','puse-full','puse-free','puse-custom'];
            Array.from(modeSelect.options).forEach(function(opt, i){
                if (modeKeys[i] && T[modeKeys[i]]) opt.text = T[modeKeys[i]];
            });
        }

        /* charge mode in charge-emp-modal */
        const chargeModeSelect = document.getElementById('charge-emp-mode');
        if (chargeModeSelect) {
            const cm = ['charge-half','charge-full','charge-free'];
            Array.from(chargeModeSelect.options).forEach(function(opt, i){
                if (cm[i] && T[cm[i]]) opt.text = T[cm[i]];
            });
        }

        const customLabel = pusePanel.querySelector('#puse-custom-amount-row label');
        if (customLabel) customLabel.innerText = T['lbl-puse-custom'];
        const qtyLabel = pusePanel.querySelector('#puse-item-fields > label:last-of-type');

        const advanceLabels = pusePanel.querySelectorAll('#puse-advance-fields label');
        if (advanceLabels[0]) advanceLabels[0].innerText = T['lbl-advance-amount'];
        if (advanceLabels[1]) advanceLabels[1].innerText = T['lbl-advance-note'];
        const advNote = document.getElementById('puse-advance-note');
        if (advNote) advNote.placeholder = T['ph-advance-note'];

        const deductLabel = pusePanel.querySelector('#puse-total-preview span');
        if (deductLabel) deductLabel.innerText = T['puse-deduct-label'];

        const logBtn = pusePanel.querySelector('button[onclick="logPersonalUse()"]');
        if (logBtn) logBtn.innerText = T['btn-log-puse'];

        const filterSel = document.getElementById('puse-filter-emp');
        if (filterSel && filterSel.options[0]) filterSel.options[0].text = T['lbl-puse-filter'];

        const histLabel = pusePanel.querySelector('div[style*="text-transform:uppercase"]');
        if (histLabel) histLabel.innerText = T['lbl-puse-history'];
    }

    /* Login history panel */
    const loginPanel = document.getElementById('emp-panel-loginhistory');
    if (loginPanel) {
        const filterSel = document.getElementById('login-history-filter');
        if (filterSel && filterSel.options[0]) filterSel.options[0].text = T['lbl-login-filter-all'];
    }
}

function _setSidebarMenuBtns(T) {
    const menuBtns = document.querySelectorAll('.admin-menu-btn');
    const btnMap = [
        'admin-btn-audits',
        'admin-btn-expenses',
        'admin-btn-games',
        'admin-btn-stock',
        'admin-btn-emp',
        'admin-btn-notebook'
    ];
    let nonLogoutIdx = 0;
    menuBtns.forEach(function(btn) {
        const isLogout = btn.classList.contains('logout-btn');
        if (isLogout) {
            btn.innerText = T['admin-btn-logout'];
        } else if (btn.id === 'admin-btn-notebook') {
            /* Has a nested notebook-dot span — innerText would delete it, so rebuild around it instead */
            const dot = document.getElementById('notebook-dot-admin-menu');
            btn.innerHTML = T['admin-btn-notebook'] + ' ';
            if (dot) btn.appendChild(dot);
            else btn.insertAdjacentHTML('beforeend', '<span class="notebook-dot" id="notebook-dot-admin-menu" style="display:none; position:static; margin-left:6px;"></span>');
            nonLogoutIdx++;
        } else {
            if (btnMap[nonLogoutIdx] && T[btnMap[nonLogoutIdx]]) {
                btn.innerText = T[btnMap[nonLogoutIdx]];
            }
            nonLogoutIdx++;
        }
    });

    /* Data Engine section */
    const dataH3 = document.querySelector('.admin-section h3');
    if (dataH3) dataH3.innerText = T['h3-data-engine'];
    const dataDesc = document.querySelector('.admin-section p');
    if (dataDesc) dataDesc.innerText = T['data-engine-desc'];

    const exportBtn = document.querySelector('button[onclick="exportDataToCSV()"]');
    if (exportBtn) exportBtn.innerHTML = '<span>⬇️</span> ' + T['btn-export-csv'];

    const restoreLabel = document.querySelector('.admin-section label[style*="color: white"]');
    if (restoreLabel) restoreLabel.innerText = T['lbl-restore'];

    const importBtn = document.querySelector('button[onclick="importDataFromCSV()"]');
    if (importBtn) importBtn.innerHTML = '<span>⬆️</span> ' + T['btn-import'];
}

function _setModalLabels(T, isAr) {
    /* Alert modal */
    const alertTitle = document.getElementById('alert-title');
    if (alertTitle && alertTitle.innerText === 'Notification' || alertTitle && alertTitle.innerText === 'إشعار') {
        alertTitle.innerText = T['alert-title-default'];
    }
    const alertOk = document.querySelector('#alert-modal button');
    if (alertOk) alertOk.innerText = isAr ? 'حسناً' : 'OK';

    /* Confirm modal */
    const confirmTitle = document.getElementById('confirm-title');
    if (confirmTitle) confirmTitle.innerText = T['confirm-title-default'];
    const yesBtn = document.getElementById('confirm-yes');
    if (yesBtn) yesBtn.innerText = T['btn-confirm-yes'];
    const noBtn  = document.getElementById('confirm-no');
    if (noBtn)  noBtn.innerText  = T['btn-confirm-no'];

    /* Migrate modal */
    const migTitle = document.querySelector('#migrate-modal h3');
    if (migTitle) migTitle.innerText = T['migrate-title'];
    const migDesc = document.querySelector('#migrate-modal p');
    if (migDesc) migDesc.innerText = T['migrate-desc'];
    const migLabel = document.querySelector('#migrate-modal label');
    if (migLabel) migLabel.innerText = T['lbl-migrate-target'];
    const migConfirm = document.querySelector('button[onclick="confirmMigration()"]');
    if (migConfirm) migConfirm.innerText = T['btn-migrate-confirm'];
    const migCancel = document.querySelector('button[onclick="closeMigrateModal()"]');
    if (migCancel) migCancel.innerText = T['btn-migrate-cancel'];

    /* Drinks modal */
    const drinksTitle = document.querySelector('#drinks-modal h3');
    if (drinksTitle) drinksTitle.innerText = T['drinks-modal-title'];
    const h4Custom = document.querySelector('#drinks-modal h4');
    if (h4Custom) h4Custom.innerText = T['h4-add-custom'];
    const openCwizBtn = document.querySelector('button[onclick="openCustomItemWizard()"]');
    if (openCwizBtn) openCwizBtn.innerText = T['btn-open-cwiz'];
    const customName = document.getElementById('custom-item-name');
    if (customName) customName.placeholder = T['ph-custom-name'];
    const customPrice = document.getElementById('custom-item-price');
    if (customPrice) customPrice.placeholder = T['ph-custom-price'];
    const addCustomBtn = document.querySelector('button[onclick="addCustomDrink()"]');
    if (addCustomBtn) addCustomBtn.innerText = T['btn-custom-add'];
    const doneBtn = document.querySelector('button[onclick="closeDrinksModal()"]');
    if (doneBtn) doneBtn.innerText = T['btn-drinks-done'];

    /* Drinks modal — live bill preview */
    const drinksPrevTimeLabel = document.getElementById('drinks-preview-time-label');
    if (drinksPrevTimeLabel) drinksPrevTimeLabel.innerText = T['lbl-drinks-preview-time'];
    const drinksPrevCostLabel = document.getElementById('drinks-preview-time-cost-label');
    if (drinksPrevCostLabel) drinksPrevCostLabel.innerText = T['lbl-drinks-preview-time-cost'];
    const drinksPrevExtrasLabel = document.getElementById('drinks-preview-extras-label');
    if (drinksPrevExtrasLabel) drinksPrevExtrasLabel.innerText = T['lbl-drinks-preview-extras'];

    /* Custom Item Wizard modal */
    const cwizTitle = document.querySelector('#custom-item-wizard-modal h3');
    if (cwizTitle) cwizTitle.innerText = T['cwiz-title'];
    const cwizDesc = document.querySelector('#custom-item-wizard-modal > .modal-content > p');
    if (cwizDesc) cwizDesc.innerText = T['cwiz-desc'];
    const cwizLabels = document.querySelectorAll('#custom-item-wizard-modal > .modal-content > label');
    if (cwizLabels[0]) cwizLabels[0].innerText = T['lbl-cwiz-name'];
    if (cwizLabels[1]) cwizLabels[1].innerText = T['lbl-cwiz-price'];
    const cwizNameInput = document.getElementById('cwiz-name');
    if (cwizNameInput) cwizNameInput.placeholder = T['ph-cwiz-name'];
    const cwizPriceInput = document.getElementById('cwiz-price');
    if (cwizPriceInput) cwizPriceInput.placeholder = T['ph-cwiz-price'];
    const cwizSectionSpans = document.querySelectorAll('#custom-item-wizard-modal > .modal-content > div > div > span');
    if (cwizSectionSpans[0]) cwizSectionSpans[0].innerText = T['h-cwiz-stock-section'];
    if (cwizSectionSpans[1]) cwizSectionSpans[1].innerText = T['h-cwiz-outside-section'];
    const cwizAddStockBtn = document.querySelector('button[onclick="cwizAddStockRow()"]');
    if (cwizAddStockBtn) cwizAddStockBtn.innerText = T['btn-cwiz-add-row'];
    const cwizAddOutsideBtn = document.querySelector('button[onclick="cwizAddOutsideRow()"]');
    if (cwizAddOutsideBtn) cwizAddOutsideBtn.innerText = T['btn-cwiz-add-row'];
    const cwizStockEmpty = document.getElementById('cwiz-stock-empty');
    if (cwizStockEmpty) cwizStockEmpty.innerText = T['cwiz-stock-empty'];
    const cwizOutsideEmpty = document.getElementById('cwiz-outside-empty');
    if (cwizOutsideEmpty) cwizOutsideEmpty.innerText = T['cwiz-outside-empty'];
    const cwizCompTotalLabel = document.querySelector('#cwiz-cost-bar > div:nth-child(1) > span');
    if (cwizCompTotalLabel) cwizCompTotalLabel.innerText = T['lbl-cwiz-comp-total'];
    const cwizSellLabel = document.querySelector('#cwiz-cost-bar > div:nth-child(2) > span');
    if (cwizSellLabel) cwizSellLabel.innerText = T['lbl-cwiz-sell-price'];
    const cwizWarning = document.getElementById('cwiz-warning');
    if (cwizWarning) cwizWarning.innerText = T['cwiz-warning-low-price'];
    const cwizStockWarning = document.getElementById('cwiz-stock-warning');
    if (cwizStockWarning) cwizStockWarning.innerText = T['cwiz-warning-stock'];
    const cwizConfirmBtn = document.getElementById('cwiz-confirm-btn');
    if (cwizConfirmBtn) cwizConfirmBtn.innerText = T['btn-cwiz-confirm'];
    const cwizCancelBtn = document.querySelector('button[onclick="cwizClose()"]');
    if (cwizCancelBtn) cwizCancelBtn.innerText = T['btn-cwiz-cancel'];
    // Re-render any in-progress wizard rows so per-row placeholders/options
    // (rendered by 08_drinks.js's _renderCwizRows) pick up the new language too.
    const cwizModal = document.getElementById('custom-item-wizard-modal');
    if (cwizModal && cwizModal.style.display !== 'none' && typeof window._renderCwizRows === 'function') {
        window._renderCwizRows();
    }

    /* Checkout modal */
    const chkTitle = document.querySelector('#checkout-modal h2');
    if (chkTitle) chkTitle.innerText = T['checkout-title'];
    const chkConsoleLabel = document.querySelector('#checkout-modal .receipt-row:nth-child(1) span');
    if (chkConsoleLabel) chkConsoleLabel.innerText = T['lbl-chk-console'];
    const chkModeLabel = document.querySelector('#checkout-modal .receipt-row:nth-child(2) span');
    if (chkModeLabel) chkModeLabel.innerText = T['lbl-chk-mode'];
    const chkTimeLabel = document.querySelector('#checkout-modal .receipt-row:nth-child(3) span');
    if (chkTimeLabel) chkTimeLabel.innerText = T['lbl-chk-time'];
    const phoneDesc = document.querySelector('#checkout-modal > .modal-content > div:nth-child(4) p');
    if (phoneDesc) phoneDesc.innerText = T['lbl-chk-phone'];
    const phoneInput = document.getElementById('chk-phone-number');
    if (phoneInput) phoneInput.placeholder = T['ph-chk-phone'];
    const chkConfirm = document.querySelector('button[onclick="confirmCheckout()"]');
    if (chkConfirm) chkConfirm.innerText = T['btn-chk-confirm'];
    const chkCancel = document.querySelector('button[onclick="closeCheckoutModal()"]');
    if (chkCancel) chkCancel.innerText = T['btn-chk-cancel'];
    const amountDue = document.querySelector('#checkout-modal .receipt-total > span');
    if (amountDue) amountDue.innerText = T['lbl-amount-due'];

    /* Edit expense modal */
    const editExpTitle = document.querySelector('#edit-expense-modal h3');
    if (editExpTitle) editExpTitle.innerText = T['edit-expense-title'];
    const editExpDescLabel = document.querySelector('label[for="edit-expense-desc"]') ||
        document.querySelector('#edit-expense-modal label:nth-of-type(1)');
    if (editExpDescLabel) editExpDescLabel.innerText = T['lbl-edit-exp-desc'];
    const editExpAmtLabel = document.querySelector('label[for="edit-expense-amount"]') ||
        document.querySelector('#edit-expense-modal label:nth-of-type(2)');
    if (editExpAmtLabel) editExpAmtLabel.innerText = T['lbl-edit-exp-amt'];
    const saveExpBtn = document.getElementById('save-expense-btn');
    if (saveExpBtn) saveExpBtn.innerText = T['btn-save-expense'];
    const cancelExpBtn = document.querySelector('#edit-expense-modal .modal-actions button:last-child');
    if (cancelExpBtn) cancelExpBtn.innerText = T['btn-cancel-expense'];

    /* Start session modal */
    const startTitle = document.querySelector('#start-session-modal h3');
    if (startTitle) startTitle.innerText = T['start-session-title'];
    const startDesc = document.querySelector('#start-session-modal > .modal-content > p');
    if (startDesc) startDesc.innerText = T['start-session-desc'];
    const addGameBtn = document.querySelector('button[onclick*="addGameInput(\'start-games-container"]');
    if (addGameBtn) addGameBtn.innerText = T['btn-add-game'];
    const startConfirm = document.querySelector('button[onclick="confirmSessionStart()"]');
    if (startConfirm) startConfirm.innerText = T['btn-start-confirm'];
    const startCancel = document.querySelector('button[onclick="closeStartSessionModal()"]');
    if (startCancel) startCancel.innerText = T['btn-start-cancel'];

    /* Start session modal — specs preview */
    const ssPrevConsoleLabel = document.getElementById('ss-preview-console-label');
    if (ssPrevConsoleLabel) ssPrevConsoleLabel.innerText = T['lbl-ss-preview-console'];
    const ssPrevModeLabel = document.getElementById('ss-preview-mode-label');
    if (ssPrevModeLabel) ssPrevModeLabel.innerText = T['lbl-ss-preview-mode'];
    const ssPrevRateLabel = document.getElementById('ss-preview-rate-label');
    if (ssPrevRateLabel) ssPrevRateLabel.innerText = T['lbl-ss-preview-rate'];

    /* Add person modal */
    const addPersonTitle = document.querySelector('#add-person-modal h3');
    if (addPersonTitle) addPersonTitle.innerText = T['add-person-title'];
    const addPersonDesc = document.querySelector('#add-person-modal p');
    if (addPersonDesc) addPersonDesc.innerText = T['add-person-desc'];
    const personNameInput = document.getElementById('new-person-name');
    if (personNameInput) personNameInput.placeholder = T['ph-person-name'];
    const personStart = document.querySelector('button[onclick="confirmAddPerson()"]');
    if (personStart) personStart.innerText = T['btn-person-start'];
    const personCancel = document.querySelector('#add-person-modal .modal-actions button:last-child');
    if (personCancel) personCancel.innerText = T['btn-person-cancel'];

    /* Checkout person modal */
    const chkPersonTimeLabel = document.querySelector('#checkout-person-modal .receipt-row:nth-child(1) span');
    if (chkPersonTimeLabel) chkPersonTimeLabel.innerText = T['lbl-time-played'];
    const chkPersonCostLabel = document.querySelector('#checkout-person-modal .receipt-row:nth-child(2) span');
    if (chkPersonCostLabel) chkPersonCostLabel.innerText = T['lbl-time-cost'];
    const personCustomName = document.getElementById('chk-person-custom-name');
    if (personCustomName) personCustomName.placeholder = T['ph-person-custom-name'];
    const personTotalLabel = document.querySelector('#checkout-person-modal .receipt-total > span');
    if (personTotalLabel) personTotalLabel.innerText = T['lbl-person-total'];
    const personConfirmBtn = document.querySelector('button[onclick="confirmPersonCheckout()"]');
    if (personConfirmBtn) personConfirmBtn.innerText = T['btn-person-confirm'];

    /* Charge employee modal */
    const chargeTitle = document.querySelector('#charge-emp-modal h3');
    if (chargeTitle) chargeTitle.innerText = T['charge-emp-title'];
    const chargeEmpLabel = document.querySelector('#charge-emp-modal label:nth-of-type(1)');
    if (chargeEmpLabel) chargeEmpLabel.innerText = T['lbl-charge-emp'];
    const chargeModeLabel = document.querySelector('#charge-emp-modal label:nth-of-type(2)');
    if (chargeModeLabel) chargeModeLabel.innerText = T['lbl-charge-mode'];
    const chargeDeductLabel = document.querySelector('#charge-emp-preview span');
    if (chargeDeductLabel) chargeDeductLabel.innerText = T['deduct-label'];
    const chargeConfirmBtn = document.querySelector('button[onclick="confirmChargeEmployee()"]');
    if (chargeConfirmBtn) chargeConfirmBtn.innerText = T['btn-charge-confirm'];
    const chargeSkipBtn = document.querySelector('#charge-emp-modal .modal-actions button:last-child');
    if (chargeSkipBtn) chargeSkipBtn.innerText = T['btn-charge-skip'];

    /* Edit employee modal */
    const editEmpTitle = document.querySelector('#edit-emp-modal h3');
    if (editEmpTitle) editEmpTitle.innerText = T['edit-emp-title'];
    const editEmpNameLabel = document.querySelector('#edit-emp-modal label:nth-of-type(1)');
    if (editEmpNameLabel) editEmpNameLabel.innerText = T['lbl-edit-emp-name'];
    const editEmpSalaryLabel = document.querySelector('#edit-emp-modal label:nth-of-type(2)');
    if (editEmpSalaryLabel) editEmpSalaryLabel.innerText = T['lbl-edit-emp-salary'];
    const editEmpSaveBtn = document.querySelector('button[onclick="saveEditEmployee()"]');
    if (editEmpSaveBtn) editEmpSaveBtn.innerText = T['btn-edit-emp-save'];
    const editEmpCancelBtn = document.querySelector('#edit-emp-modal .modal-actions button:last-child');
    if (editEmpCancelBtn) editEmpCancelBtn.innerText = T['btn-edit-emp-cancel'];

    /* Finalize month modal */
    const finalTitle = document.querySelector('#finalize-month-modal h3');
    if (finalTitle) finalTitle.innerText = T['finalize-title'];
    const finalDesc = document.querySelector('#finalize-month-modal > .modal-content > p');
    if (finalDesc) finalDesc.innerText = T['finalize-desc'];
    const finalPwLabel = document.querySelector('#finalize-month-modal label');
    if (finalPwLabel) finalPwLabel.innerText = T['lbl-admin-pw'];
    const finalPwInput = document.getElementById('finalize-admin-pw');
    if (finalPwInput) finalPwInput.placeholder = T['ph-admin-pw'];
    const finalPwError = document.getElementById('finalize-pw-error');
    if (finalPwError) finalPwError.innerText = T['finalize-pw-error'];
    const finalConfirmBtn = document.querySelector('button[onclick="confirmFinalizeMonth()"]');
    if (finalConfirmBtn) finalConfirmBtn.innerText = T['btn-finalize-confirm'];
    const finalCancelBtn = document.querySelector('button[onclick="closeFinalizeMonthModal()"]');
    if (finalCancelBtn) finalCancelBtn.innerText = T['btn-finalize-cancel'];
}

/* ════════════════════════════════════════════════════════════════
   FUNCTION PATCHES
   Strategy: For functions that inject HTML templates with hardcoded
   English, we replace them entirely so they call T() at render time.
   For simple navigation functions, we wrap them and call applyLanguage().
════════════════════════════════════════════════════════════════ */

(function () {

    /* ── Tiny wrap helper ── */
    function _patch(name, after) {
        var orig = window[name];
        if (typeof orig !== 'function') return;
        window[name] = function () {
            var result = orig.apply(this, arguments);
            after(arguments);
            return result;
        };
    }

    /* ── toggleAdminMenu: RTL sidebar fix ── */
    _patch('toggleAdminMenu', function (args) {
        var open = args[0];
        var sidebar = document.getElementById('adminMenu');
        if (!sidebar) return;
        if (currentLang === 'ar') {
            sidebar.style.transform = open ? 'translateX(0)' : 'translateX(100%)';
        }
    });

    /* ── Simple nav/tab switches: just re-apply language after render ── */
    ['switchTab', 'openAuditsView', 'closeAuditsView', 'openExpensesAdminView',
     'openAdminGamesView', 'openStockView', 'openEmployeeView',
     'saveAuditsConfig', 'addManualExpense', 'submitNoRoomGames',
     'addNewDrink', 'saveEditEmployee', 'confirmFinalizeMonth'].forEach(function (fn) {
        _patch(fn, function () { if (currentLang === 'ar') applyLanguage(); });
    });

    /* ── showApp ── */
    _patch('showApp', function () { if (currentLang === 'ar') applyLanguage(); });

    /* ════════════════════════════════════════════════════════════════
       FULL REWRITES — functions that inject HTML templates
    ════════════════════════════════════════════════════════════════ */

    /* ── buildConsoles (06_sessions.js) ── */
    window.buildConsoles = function () {
        var container = document.getElementById('console-grid-container');
        container.innerHTML = '';

        var entitiesToBuild = [];
        if (currentZone === 'lounge') entitiesToBuild = LOUNGE_CONSOLES;
        else if (currentZone === 'vip') entitiesToBuild = VIP_CONSOLES;
        else if (currentZone === 'cafe') entitiesToBuild = CAFE_TABLES;

        entitiesToBuild.forEach(function (c) {
            if (c.type === 'cafe') {
                var badgeClass = isTableEmpty(c.id) ? 'status-badge inactive-badge' : 'status-badge';
                container.innerHTML += '<div class="console-card" id="card-' + c.id + '">' +
                    '<div class="console-header">' +
                    '<div class="console-title-group"><div class="console-title" style="color: var(--warning);">' + c.name + '</div></div>' +
                    '<span class="' + badgeClass + '" id="badge-' + c.id + '" style="background: rgba(251, 191, 36, 0.15); color: var(--warning);">' + T('badge-open') + '</span>' +
                    '</div>' +
                    '<div style="font-size: 13px; color: var(--text-muted); margin-bottom: 15px; text-align: center;">' + T('cafe-manage-desc') + '</div>' +
                    '<div style="display: flex; flex-direction: column; gap: 10px;">' +
                    '<button class="btn-blue" onclick="openDrinksModal(' + c.id + ')">' + T('btn-add-drinks') + '</button>' +
                    '<button style="background: transparent; border: 1px dashed #3b82f6; color: #3b82f6;" onclick="switchTab(\'noroom\')">' + T('btn-ask-game-log') + '</button>' +
                    '<button class="btn-warning" onclick="openMigrateModal(' + c.id + ')">' + T('btn-migrate-session') + '</button>' +
                    '<button class="btn-danger" onclick="endCafeSession(' + c.id + ')">' + T('btn-checkout-table') + '</button>' +
                    '</div></div>';
            } else {
                var isPS5 = c.name.includes('PS5');
                var isVIP = c.type === 'vip';
                var titleColor = (isPS5 || isVIP) ? 'color: var(--accent-purple);' : '';
                container.innerHTML += '<div class="console-card" id="card-' + c.id + '">' +
                    '<div class="console-header">' +
                    '<div class="console-title-group"><div class="console-title" style="' + titleColor + '">' + c.name + '</div></div>' +
                    '<span class="status-badge status-available" id="status-' + c.id + '">' + T('badge-available') + '</span>' +
                    '</div>' +
                    '<div class="timer-display" id="timer-' + c.id + '">00:00:00</div>' +
                    '<div class="controls-available" id="controls-avail-' + c.id + '">' +
                    '<div class="mode-toggle-group" id="mode-group-' + c.id + '">' +
                    '<button class="mode-toggle-btn selected" id="pre-single-' + c.id + '" onclick="setPreStartMode(' + c.id + ', \'single\')" style="flex:1;">' + T('btn-single') + '</button>' +
                    '<button class="mode-toggle-btn" id="pre-multi-' + c.id + '" onclick="setPreStartMode(' + c.id + ', \'multi\')" style="flex:1;">' + T('btn-multi') + '</button>' +
                    '<button class="mode-toggle-btn" id="pre-iptv-' + c.id + '" onclick="setPreStartMode(' + c.id + ', \'iptv\')" style="flex:1;">' + T('btn-iptv') + '</button>' +
                    '</div>' +
                    '<button onclick="startSession(' + c.id + ', \'open\', 0)" style="margin-bottom: 12px; background: transparent; border: 1px solid var(--border-color); color: white;">' + T('btn-start-open') + '</button>' +
                    '<div class="preset-grid">' +
                    '<button class="preset-btn" onclick="startSession(' + c.id + ', \'fixed\', 30)">30m</button>' +
                    '<button class="preset-btn" onclick="startSession(' + c.id + ', \'fixed\', 60)">1h</button>' +
                    '<button class="preset-btn" onclick="startSession(' + c.id + ', \'fixed\', 90)">1.5h</button>' +
                    '<button class="preset-btn" onclick="startSession(' + c.id + ', \'fixed\', 120)">2h</button>' +
                    '</div>' +
                    '<div class="custom-time-row">' +
                    '<input type="number" id="custom-time-' + c.id + '" placeholder="' + T('ph-custom-mins') + '" min="1">' +
                    '<button class="preset-btn" onclick="startCustomSession(' + c.id + ')">' + T('btn-set') + '</button>' +
                    '</div></div>' +
                    '<div class="controls-active" id="controls-act-' + c.id + '" style="display:none; flex-direction:column;">' +
                    '<div class="session-info-box" id="mode-info-' + c.id + '"></div>' +
                    '<div class="mode-toggle-group" style="margin-bottom: 12px; gap: 5px;">' +
                    '<button class="mode-toggle-btn" onclick="switchActiveMode(' + c.id + ', \'single\')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">' + T('btn-single') + '</button>' +
                    '<button class="mode-toggle-btn" onclick="switchActiveMode(' + c.id + ', \'multi\')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">' + T('btn-multi') + '</button>' +
                    '<button class="mode-toggle-btn" onclick="switchActiveMode(' + c.id + ', \'iptv\')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">' + T('btn-iptv') + '</button>' +
                    '</div>' +
                    '<button class="btn-blue" style="margin-bottom: 15px;" onclick="openDrinksModal(' + c.id + ')">' + T('btn-add-extras') + '</button>' +
                    '<button class="btn-danger" onclick="endSession(' + c.id + ')">' + T('btn-checkout') + '</button>' +
                    '</div></div>';
            }
        });
    };

    /* ── updateUI (07_timer.js) — status badges & session info box ── */
    var _origUpdateUI = window.updateUI;
    window.updateUI = function () {
        _origUpdateUI.apply(this, arguments);
        ALL_ENTITIES.forEach(function (c) {
            if (c.type === 'cafe') return;
            var id = c.id;
            var sess = sessions[id];
            if (!sess) return;
            var status = document.getElementById('status-' + id);
            var modeInfo = document.getElementById('mode-info-' + id);
            if (sess.active) {
                if (status) status.innerText = T('badge-in-use');
                if (modeInfo) {
                    var timeModeText = sess.mode === 'open'
                        ? T('time-open')
                        : T('time-fixed') + ' (' + sess.presetMins + 'm)';
                    var playerModeText = T('mode-single');
                    if (sess.currentPlayerMode === 'multi') playerModeText = T('mode-multi');
                    if (sess.currentPlayerMode === 'iptv') playerModeText = T('mode-iptv');
                    modeInfo.innerHTML =
                        '<div style="display:flex; justify-content:space-between; margin-bottom:5px;">' +
                        '<span style="color:var(--text-muted)">' + T('lbl-type') + '</span> <strong>' + timeModeText + '</strong>' +
                        '</div>' +
                        '<div style="display:flex; justify-content:space-between;">' +
                        '<span style="color:var(--text-muted)">' + T('lbl-state') + '</span> <strong style="color:var(--accent-cyan)">' + playerModeText + '</strong>' +
                        '</div>';
                }
            } else {
                if (status) status.innerText = T('badge-available');
            }
        });
        /* Also fix cafe badges */
        ALL_ENTITIES.forEach(function (c) {
            if (c.type !== 'cafe') return;
            var badge = document.getElementById('badge-' + c.id);
            if (badge) badge.innerText = T('badge-open');
        });
    };

    /* ── renderSharedSpace (11_shared_space.js) ── */
    window.renderSharedSpace = function () {
        var grid = document.getElementById('console-grid-container');
        grid.innerHTML = '';

        Object.keys(sharedTables).forEach(function (tableId) {
            var table = sharedTables[tableId];
            var occupantsHtml = '';

            table.occupants.forEach(function (person) {
                var timeDiff = Date.now() - person.startTime;
                var hours = timeDiff / (1000 * 60 * 60);
                var cost = (hours * SHARED_HOURLY_RATE).toFixed(2);
                var m = Math.floor(timeDiff / 60000);
                var timeStr = Math.floor(m / 60) + 'h ' + (m % 60) + 'm';

                occupantsHtml +=
                    '<div class="occupant-row">' +
                    '<div class="occupant-info">' +
                    '<div class="occupant-name-group"><span class="occupant-name">' + person.name + '</span></div>' +
                    '<span class="occupant-stats" id="shared-stats-' + person.id + '">⏱ ' + timeStr + ' | 💰 ' + cost + ' EGP</span>' +
                    '<span class="occupant-stats">🥤 ' + T('btn-add-extras').replace('🥤 ', '') + ': ' + person.drinks.length + ' items</span>' +
                    '</div>' +
                    '<div class="occupant-actions">' +
                    '<button class="btn-small btn-blue" onclick="openDrinksForPerson(\'' + tableId + '\', \'' + person.id + '\')">' + T('btn-add-drink-person') + '</button>' +
                    '<button class="btn-small btn-danger" onclick="checkoutPerson(\'' + tableId + '\', \'' + person.id + '\')">' + T('btn-checkout-person') + '</button>' +
                    '</div></div>';
            });

            grid.innerHTML +=
                '<div class="console-card">' +
                '<div class="console-header">' +
                '<h3 class="console-title">' + table.name + '</h3>' +
                '<span class="status-badge status-playing">👥 ' + table.occupants.length + ' ' + T('badge-active-count') + '</span>' +
                '</div>' +
                '<div style="margin-bottom: 15px;">' +
                (occupantsHtml || '<p style="color:var(--text-muted);font-size:13px;text-align:center;">' + T('shared-no-one') + '</p>') +
                '</div>' +
                '<button class="btn-success" onclick="openAddPersonModal(\'' + tableId + '\')">' + T('btn-add-person') + '</button>' +
                '</div>';
        });
    };

    /* ── renderStockOverview (12_stock.js) ── */
    window.renderStockOverview = function () {
        var container = document.getElementById('stock-overview-list');
        container.innerHTML = '';

        var traceableKeys = Object.keys(stockTraceable).filter(function (k) {
            return stockTraceable[k] && DRINKS_MENU[k];
        });

        if (traceableKeys.length === 0) {
            container.innerHTML =
                '<div style="text-align:center; color:var(--text-muted); padding:30px 0; font-size:13px;">' +
                T('lbl-no-traceable-cfg') + '<br>' +
                '<strong style="color:var(--accent-cyan);">' + T('lbl-go-traceable-tab') + '</strong></div>';
            return;
        }

        traceableKeys.forEach(function (key) {
            var item = DRINKS_MENU[key];
            if (!item) return;
            var qty = stockLevels[key] || 0;
            var cardClass = 'stock-item-card';
            var qtyClass  = 'stock-qty-badge qty-ok';
            var label     = '';

            if (qty === 0) {
                cardClass += ' out-of-stock';
                qtyClass   = 'stock-qty-badge qty-zero';
                label = '<span style="color:var(--danger); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">' + T('stock-label-out') + '</span>';
            } else if (qty <= 5) {
                cardClass += ' low-stock';
                qtyClass   = 'stock-qty-badge qty-low';
                label = '<span style="color:var(--warning); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">' + T('stock-label-low') + '</span>';
            }

            container.innerHTML +=
                '<div class="' + cardClass + '">' +
                '<div>' +
                '<div class="stock-item-name">' + item.name + '</div>' +
                '<div class="stock-item-meta">' + T('lbl-price') + ' ' + item.price + ' EGP &nbsp;•&nbsp; ' + T('lbl-traceable') + ' ' + label + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                '<div class="' + qtyClass + '">' + qty + '</div>' +
                '<div style="font-size:10px; color:var(--text-muted); margin-top:2px;">' + T('lbl-pcs') + '</div>' +
                '</div></div>';
        });

        var nonTraceable = Object.keys(DRINKS_MENU).filter(function (k) { return !stockTraceable[k]; });
        if (nonTraceable.length > 0) {
            container.innerHTML += '<div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.6px; margin:16px 0 8px;">' + T('lbl-not-tracked') + '</div>';
            nonTraceable.forEach(function (key) {
                var item = DRINKS_MENU[key];
                container.innerHTML +=
                    '<div class="stock-item-card" style="opacity:0.4;">' +
                    '<div><div class="stock-item-name">' + item.name + '</div>' +
                    '<div class="stock-item-meta">' + T('lbl-not-traceable-note') + '</div></div>' +
                    '<div style="font-size:12px; color:var(--text-dim);">—</div>' +
                    '</div>';
            });
        }

        /* ── Components section ── */
        var compTraceableKeys = Object.keys(stockComponents).filter(function (k) { return stockTraceable[k]; });
        if (compTraceableKeys.length > 0) {
            container.innerHTML += '<div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.6px; margin:16px 0 8px;">' + T('stab-components') + '</div>';
            compTraceableKeys.forEach(function (key) {
                var comp = stockComponents[key];
                var qty  = stockLevels[key] || 0;
                var cardClass = 'stock-item-card';
                var qtyClass  = 'stock-qty-badge qty-ok';
                var label     = '';

                if (qty === 0) {
                    cardClass += ' out-of-stock';
                    qtyClass   = 'stock-qty-badge qty-zero';
                    label = '<span style="color:var(--danger); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">' + T('stock-label-out') + '</span>';
                } else if (qty <= 5) {
                    cardClass += ' low-stock';
                    qtyClass   = 'stock-qty-badge qty-low';
                    label = '<span style="color:var(--warning); font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">' + T('stock-label-low') + '</span>';
                }

                container.innerHTML +=
                    '<div class="' + cardClass + '">' +
                    '<div>' +
                    '<div class="stock-item-name">' + comp.name + '</div>' +
                    '<div class="stock-item-meta">' + T('lbl-component-type') + ' &nbsp;•&nbsp; ' + T('lbl-traceable') + ' ' + label + '</div>' +
                    '</div>' +
                    '<div style="text-align:right;">' +
                    '<div class="' + qtyClass + '">' + qty + '</div>' +
                    '<div style="font-size:10px; color:var(--text-muted); margin-top:2px;">' + T('lbl-pcs') + '</div>' +
                    '</div></div>';
            });
        }

        var compNonTraceable = Object.keys(stockComponents).filter(function (k) { return !stockTraceable[k]; });
        if (compNonTraceable.length > 0) {
            container.innerHTML += '<div style="font-size:10px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.6px; margin:16px 0 8px;">' + T('lbl-components-not-tracked') + '</div>';
            compNonTraceable.forEach(function (key) {
                var comp = stockComponents[key];
                container.innerHTML +=
                    '<div class="stock-item-card" style="opacity:0.4;">' +
                    '<div><div class="stock-item-name">' + comp.name + '</div>' +
                    '<div class="stock-item-meta">' + T('lbl-not-traceable-note') + '</div></div>' +
                    '<div style="font-size:12px; color:var(--text-dim);">—</div>' +
                    '</div>';
            });
        }
    };

    /* ── renderTraceableList (12_stock.js) ── */
    window.renderTraceableList = function () {
        var container = document.getElementById('traceable-items-list');
        container.innerHTML = '';

        var keys = Object.keys(DRINKS_MENU);
        if (keys.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">' + T('lbl-no-menu-items') + '</div>';
            return;
        }

        keys.forEach(function (key) {
            var item    = DRINKS_MENU[key];
            var tracked = !!stockTraceable[key];
            var qty     = stockLevels[key] || 0;
            var subText = tracked
                ? T('lbl-stock') + ' <strong style="color:var(--accent-cyan);">' + qty + ' ' + T('lbl-pcs') + '</strong>'
                : T('lbl-not-tracked-short');

            container.innerHTML +=
                '<div class="traceable-row">' +
                '<div><div class="traceable-label">' + item.name + '</div>' +
                '<div class="traceable-sub">' + item.price + ' EGP &nbsp;•&nbsp; ' + subText + '</div>' +
                '</div>' +
                '<label class="toggle-switch">' +
                '<input type="checkbox" ' + (tracked ? 'checked' : '') + ' onchange="toggleTraceable(\'' + key + '\', this.checked)">' +
                '<span class="toggle-slider"></span>' +
                '</label></div>';
        });
    };

    /* ── populatePurchaseSelect (12_stock.js) ── */
    window.populatePurchaseSelect = function () {
        var sel = document.getElementById('purchase-item-select');
        sel.innerHTML = '<option value="">' + T('ph-select-menu-item') + '</option>';

        var drinkOptions = '';
        for (var key in DRINKS_MENU) {
            var item = DRINKS_MENU[key];
            drinkOptions += '<option value="' + key + '">' + item.name + ' (' + item.price + ' EGP/unit)</option>';
        }
        if (drinkOptions) sel.innerHTML += '<optgroup label="' + T('optgrp-menu-items') + '">' + drinkOptions + '</optgroup>';

        var compOptions = '';
        for (var ckey in stockComponents) {
            var comp = stockComponents[ckey];
            compOptions += '<option value="' + ckey + '">' + comp.name + '</option>';
        }
        if (compOptions) sel.innerHTML += '<optgroup label="' + T('stab-components') + '">' + compOptions + '</optgroup>';

        sel.onchange = function () {
            var key = this.value;
            var qtyLabel = document.getElementById('purchase-qty-label');
            var qtyInput = document.getElementById('purchase-qty');
            if (!key) {
                qtyLabel.style.display = '';
                qtyInput.style.display = '';
                qtyInput.value = '';
                return;
            }
            var isTraceable = !!stockTraceable[key];
            qtyLabel.style.display = isTraceable ? '' : 'none';
            qtyInput.style.display = isTraceable ? '' : 'none';
            if (!isTraceable) qtyInput.value = '1';
        };
    };

    /* ── populateAdjustSelect (12_stock.js) ── */
    window.populateAdjustSelect = function () {
        var sel = document.getElementById('adjust-item-select');
        sel.innerHTML = '<option value="">' + T('ph-select-traceable') + '</option>';

        var drinkOptions = '';
        for (var key in DRINKS_MENU) {
            if (!stockTraceable[key]) continue;
            var item = DRINKS_MENU[key];
            var qty  = stockLevels[key] || 0;
            drinkOptions += '<option value="' + key + '">' + item.name + ' — ' + qty + ' ' + T('lbl-pcs') + ' ' + T('lbl-in-stock') + '</option>';
        }
        if (drinkOptions) sel.innerHTML += '<optgroup label="' + T('optgrp-menu-items') + '">' + drinkOptions + '</optgroup>';

        var compOptions = '';
        for (var ckey in stockComponents) {
            if (!stockTraceable[ckey]) continue;
            var comp = stockComponents[ckey];
            var cqty = stockLevels[ckey] || 0;
            compOptions += '<option value="' + ckey + '">' + comp.name + ' — ' + cqty + ' ' + T('lbl-pcs') + ' ' + T('lbl-in-stock') + '</option>';
        }
        if (compOptions) sel.innerHTML += '<optgroup label="' + T('stab-components') + '">' + compOptions + '</optgroup>';

        sel.onchange = function () {
            var k   = this.value;
            var div = document.getElementById('adjust-current-stock');
            if (k && stockTraceable[k]) {
                var qty = stockLevels[k] || 0;
                div.innerHTML = T('lbl-current-stock') + ' <strong style="color:var(--accent-cyan);">' + qty + ' ' + T('lbl-pcs') + '</strong>';
            } else {
                div.innerHTML = '';
            }
        };
    };

    /* ── renderPurchaseHistory (12_stock.js) ── */
    window.renderPurchaseHistory = function () {
        var container = document.getElementById('purchase-history-list');
        container.innerHTML = '';

        if (stockPurchases.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">' + T('lbl-no-purchases') + '</div>';
            return;
        }

        var sorted = stockPurchases.slice().sort(function (a, b) { return b.id - a.id; });
        sorted.forEach(function (r) {
            container.innerHTML +=
                '<div class="stock-history-row">' +
                '<div class="stock-history-header">' +
                '<div class="stock-history-title">' + r.itemName + '</div>' +
                '<div class="stock-history-amount">' + r.totalCost.toFixed(2) + ' EGP</div>' +
                '</div>' +
                '<div class="stock-history-meta">' +
                T('lbl-qty') + ' <strong style="color:var(--text-main);">' + r.qty + ' ' + T('lbl-pcs') + '</strong> &nbsp;•&nbsp; ' +
                T('lbl-unit-cost') + ' ' + r.costPerUnit.toFixed(2) + ' EGP<br>' +
                r.date + ' ' + r.time + ' &nbsp;•&nbsp; ' + r.loggedBy +
                (r.notes ? '<br>📝 ' + r.notes : '') +
                '</div></div>';
        });
    };

    /* ── renderAdjustHistory (12_stock.js) ── */
    window.renderAdjustHistory = function () {
        var container = document.getElementById('adjust-history-list');
        container.innerHTML = '';

        if (stockAdjustments.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">' + T('lbl-no-adjustments') + '</div>';
            return;
        }

        var sorted = stockAdjustments.slice().sort(function (a, b) { return b.id - a.id; });
        sorted.forEach(function (r) {
            container.innerHTML +=
                '<div class="stock-history-row">' +
                '<div class="stock-history-header">' +
                '<div class="stock-history-title">' + r.itemName + '</div>' +
                '<div style="font-size:13px; font-weight:700; color:var(--warning);">-' + r.qtyDeducted + ' ' + T('lbl-pcs') + '</div>' +
                '</div>' +
                '<div class="stock-history-meta">' +
                T('lbl-before') + ' ' + r.stockBefore + ' → ' + T('lbl-after') + ' <strong style="color:var(--accent-cyan);">' + r.stockAfter + '</strong><br>' +
                T('lbl-reason') + ' <strong style="color:var(--text-main);">' + r.reason + '</strong><br>' +
                r.date + ' ' + r.time + ' &nbsp;•&nbsp; ' + r.loggedBy +
                '</div></div>';
        });
    };

    /* ── renderEmpList (13_employees.js) ── */
    window.renderEmpList = function () {
        var container = document.getElementById('emp-list');
        container.innerHTML = '';

        if (employees.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">' + T('lbl-no-employees') + '</div>';
            return;
        }

        employees.forEach(function (emp) {
            var net = Math.max(0, emp.salary - (emp.monthDeductions || 0));
            container.innerHTML +=
                '<div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:14px; margin-bottom:8px;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
                '<div>' +
                '<div style="font-size:15px; font-weight:700; color:var(--text-main);">' + emp.name + '</div>' +
                '<div style="font-size:12px; color:var(--text-muted);">' + T('lbl-salary') + ' ' + emp.salary.toFixed(2) + ' ' + T('lbl-per-month') + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                '<div style="font-size:12px; color:var(--danger);">−' + (emp.monthDeductions || 0).toFixed(2) + ' EGP</div>' +
                '<div style="font-size:14px; font-weight:700; color:var(--success);">' + T('lbl-net') + ' ' + net.toFixed(2) + ' EGP</div>' +
                '</div></div>' +
                '<div style="display:flex; gap:8px;">' +
                '<button onclick="openEditEmployeeModal(' + emp.id + ')" style="background:transparent; border:1px solid var(--border-color); color:var(--text-muted); width:auto; padding:7px 12px; font-size:12px; border-radius:8px; flex:1;">' + T('btn-edit-emp') + '</button>' +
                '<button onclick="deleteEmployee(' + emp.id + ')" class="btn-danger" style="width:auto; padding:7px 12px; font-size:12px; border-radius:8px; flex:1;">' + T('btn-remove-emp') + '</button>' +
                '</div></div>';
        });
    };

    /* ── renderPersonalUseLog (13_employees.js) ── */
    window.renderPersonalUseLog = function () {
        var container = document.getElementById('puse-history-list');
        var filterEmp = document.getElementById('puse-filter-emp').value;
        container.innerHTML = '';

        var log = personalUseLog.slice().sort(function (a, b) { return b.id - a.id; });
        if (filterEmp) log = log.filter(function (e) { return e.empId === parseInt(filterEmp); });

        if (log.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--text-muted); padding:20px 0; font-size:13px;">' + T('lbl-no-entries') + '</div>';
            return;
        }

        var inner = '';
        log.forEach(function (r) {
            inner +=
                '<div style="background:var(--bg-card); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:12px 14px; margin-bottom:8px;">' +
                '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">' +
                '<div style="font-size:14px; font-weight:600; color:var(--text-main);">' + r.empName + '</div>' +
                '<div style="font-size:14px; font-weight:700; color:var(--warning);">−' + r.charge.toFixed(2) + ' EGP</div>' +
                '</div>' +
                '<div style="font-size:12px; color:var(--text-muted); line-height:1.5;">' +
                r.label + '<br>' + r.date + ' ' + r.time + ' &nbsp;•&nbsp; ' + r.loggedBy +
                '</div></div>';
        });
        container.innerHTML = '<div style="max-height:350px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:var(--accent-cyan) transparent;">' + inner + '</div>';
    };

    /* ── populatePuseSelects (13_employees.js) ── */
    window.populatePuseSelects = function () {
        var empSel    = document.getElementById('puse-emp-select');
        var filterSel = document.getElementById('puse-filter-emp');
        empSel.innerHTML    = '<option value="">' + T('ph-select-employee') + '</option>';
        filterSel.innerHTML = '<option value="">' + T('ph-all-employees') + '</option>';
        employees.forEach(function (emp) {
            empSel.innerHTML    += '<option value="' + emp.id + '">' + emp.name + '</option>';
            filterSel.innerHTML += '<option value="' + emp.id + '">' + emp.name + '</option>';
        });

        var itemSel = document.getElementById('puse-item-select');
        itemSel.innerHTML = '<option value="">' + T('ph-select-item') + '</option>';
        for (var key in DRINKS_MENU) {
            var item = DRINKS_MENU[key];
            itemSel.innerHTML += '<option value="' + key + '">' + item.name + ' (' + item.price + ' EGP)</option>';
        }
    };

    /* ── openChargeEmployeeModal (13_employees.js) — employee select placeholder ── */
    var _origOpenCharge = window.openChargeEmployeeModal;
    if (typeof _origOpenCharge === 'function') {
        window.openChargeEmployeeModal = function (itemKey, qty, callback) {
            _origOpenCharge(itemKey, qty, callback);
            var sel = document.getElementById('charge-emp-select');
            if (sel && sel.options[0] && sel.options[0].value === '') {
                sel.options[0].text = T('ph-select-emp-charge');
            }
        };
    }

    /* ── openFinalizeMonthModal (13_employees.js) ── */
    var _origOpenFinalize = window.openFinalizeMonthModal;
    if (typeof _origOpenFinalize === 'function') {
        window.openFinalizeMonthModal = function () {
            if (employees.length === 0) return customAlert(T('lbl-no-employees'), 'Payroll');

            var summaryHtml = '';
            var totalPayout = 0;

            employees.forEach(function (emp) {
                var deductions = emp.monthDeductions || 0;
                var net        = Math.max(0, emp.salary - deductions);
                totalPayout   += net;
                summaryHtml   +=
                    '<div style="display:flex; justify-content:space-between; border-bottom:1px solid var(--border-color); padding:8px 0; font-size:13px;">' +
                    '<div><strong style="color:var(--text-main);">' + emp.name + '</strong><br>' +
                    '<span style="color:var(--text-muted);">' + T('lbl-salary-word') + ' ' + emp.salary + ' − ' + T('lbl-deductions') + ' ' + deductions.toFixed(2) + '</span></div>' +
                    '<strong style="color:var(--success);">' + net.toFixed(2) + ' EGP</strong>' +
                    '</div>';
            });

            summaryHtml +=
                '<div style="display:flex; justify-content:space-between; padding-top:12px; font-size:16px; font-weight:700;">' +
                '<span style="color:var(--text-muted);">' + T('lbl-total-cash-out') + '</span>' +
                '<span style="color:var(--warning);">' + totalPayout.toFixed(2) + ' EGP</span>' +
                '</div>';

            document.getElementById('finalize-month-summary').innerHTML = summaryHtml;
            document.getElementById('finalize-admin-pw').value          = '';
            document.getElementById('finalize-pw-error').style.display  = 'none';
            document.getElementById('finalize-month-modal').style.display = 'flex';

            if (currentLang === 'ar') applyLanguage();
        };
    }

    /* ── renderExpensesAdmin (10_finance.js) ── */
    window.renderExpensesAdmin = function () {
        var container = document.getElementById('expenses-admin-list');
        container.innerHTML = '';

        var expenses = financialData.filter(function (r) { return r.type === 'Expense'; })
            .sort(function (a, b) { return b.id - a.id; });

        if (expenses.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center;">' + T('lbl-no-expenses') + '</p>';
            return;
        }

        expenses.forEach(function (exp) {
            container.innerHTML +=
                '<div style="display:flex; justify-content:space-between; align-items:center; background: #000; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 10px;">' +
                '<div style="display:flex; flex-direction:column; overflow:hidden; flex: 1; padding-right: 10px;">' +
                '<strong style="color: #fff; font-size: 15px; white-space: nowrap; text-overflow: ellipsis; overflow: hidden;">' + exp.description + '</strong>' +
                '<span style="color: var(--danger); font-size: 14px; font-weight: bold; margin: 4px 0;">' + exp.amount.toFixed(2) + ' EGP</span>' +
                '<span style="color: var(--text-muted); font-size: 11px;">' + exp.date + ' • ' + exp.time + '</span>' +
                '</div>' +
                '<button class="btn-blue" onclick="openEditExpenseModal(' + exp.id + ')" style="width: auto; padding: 10px 15px; font-size: 13px; border-radius: 8px;">' + T('btn-edit-expense-item') + '</button>' +
                '</div>';
        });
    };

    /* ── renderGamesAdminUI (10_finance.js) ── */
    window.renderGamesAdminUI = function () {
        var tbody = document.getElementById('games-records-body');
        tbody.innerHTML = '';

        var groupedByDate = {};
        var sortedRecords = gamesData.slice().sort(function (a, b) { return b.id - a.id; });

        sortedRecords.forEach(function (record) {
            if (!groupedByDate[record.date]) groupedByDate[record.date] = { records: [] };
            groupedByDate[record.date].records.push(record);
        });

        var sortedDates = Object.keys(groupedByDate).sort(function (a, b) { return new Date(b) - new Date(a); });

        sortedDates.forEach(function (date) {
            var dayData = groupedByDate[date];

            var trSummary = document.createElement('tr');
            trSummary.style.backgroundColor = 'var(--bg-card)';
            trSummary.innerHTML =
                '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                '<div><strong style="color: var(--accent-cyan); font-size: 16px;">' + date + '</strong>' +
                '<div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">' +
                T('lbl-total-requests') + ' <span style="color: #fff;">' + dayData.records.length + '</span></div></div>' +
                '<div style="text-align: right;">' +
                '<button style="margin-top: 8px; padding: 6px 12px; font-size: 11px; width: auto; background: transparent; border: 1px solid var(--border-color); color: var(--text-main);" ' +
                'onclick="toggleDetails(\'games-' + date + '\', this)">' + T('btn-view-details') + '</button>' +
                '</div></div>';
            tbody.appendChild(trSummary);

            var trDetails = document.createElement('tr');
            trDetails.id = 'details-games-' + date;
            trDetails.style.display = 'none';
            trDetails.style.backgroundColor = '#000';
            trDetails.style.borderTop = 'none';
            trDetails.style.marginTop = '-10px';
            trDetails.style.borderRadius = '0 0 12px 12px';

            var detailsHTML = '';
            dayData.records.forEach(function (record) {
                var loggedUser = record.logged_by || 'admin';
                var typeColor  = record.type === 'Walk-in (No Room)' ? 'var(--warning)' : 'var(--success)';
                detailsHTML +=
                    '<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed var(--border-color); font-size: 13px;">' +
                    '<div style="display: flex; flex-direction: column;">' +
                    '<strong style="color: ' + typeColor + ';">' + record.type + '</strong>' +
                    '<span style="color: var(--text-muted); font-size: 12px;">' + record.time + ' • ' + loggedUser + '</span>' +
                    '<span style="color: #fff; margin-top: 6px;">Games: <strong style="color: var(--accent-purple);">' + record.games + '</strong></span>' +
                    '</div></div>';
            });

            trDetails.innerHTML = detailsHTML;
            tbody.appendChild(trDetails);
        });

        if (sortedDates.length === 0) {
            tbody.innerHTML = '<tr><td style="text-align: center; color: var(--text-muted); border: none;">' + T('lbl-no-games') + '</td></tr>';
        }
    };

    /* ── toggleDetails (10_finance.js) — View/Hide Details button text ── */
    window.toggleDetails = function (date, btn) {
        var detailsRow = document.getElementById('details-' + date);
        if (detailsRow.style.display === 'none') {
            detailsRow.style.display = 'block';
            btn.innerText = T('btn-hide-details');
            btn.style.borderColor = 'var(--accent-cyan)';
            btn.style.color = 'var(--accent-cyan)';
        } else {
            detailsRow.style.display = 'none';
            btn.innerText = T('btn-view-details');
            btn.style.borderColor = 'var(--border-color)';
            btn.style.color = 'var(--text-main)';
        }
    };

    /* ── proceedToCheckoutUI (09_checkout.js) — mode labels ──
       IMPORTANT: forward every argument via `arguments`/`.apply()` instead
       of naming each parameter. The real function's signature has grown
       over time (VIP "gaming" time/price were added later) and a wrapper
       with its own fixed, outdated parameter list would silently drop the
       trailing args (extrasBreakdown, drinksHtml) — which is exactly what
       made checkout receipts stop showing itemized drinks. */
    var _origProceedCheckout = window.proceedToCheckoutUI;
    if (typeof _origProceedCheckout === 'function') {
        window.proceedToCheckoutUI = function () {
            _origProceedCheckout.apply(this, arguments);
            var id = arguments[0];
            var sess = sessions[id];
            var modeEl = document.getElementById('chk-mode');
            if (modeEl && sess) {
                modeEl.innerText = sess.mode === 'open'
                    ? T('chk-mode-open')
                    : T('chk-mode-fixed') + ' (' + sess.presetMins + 'm)';
            }
        };
    }

    /* ── endCafeSession (09_checkout.js) — Table Order label ── */
    var _origEndCafe = window.endCafeSession;
    if (typeof _origEndCafe === 'function') {
        window.endCafeSession = function (id) {
            _origEndCafe(id);
            var modeEl = document.getElementById('chk-mode');
            if (modeEl) modeEl.innerText = T('lbl-table-order');
        };
    }

    /* ── switchZone: rebuild grid then apply language ── */
    _patch('switchZone', function () { if (currentLang === 'ar') applyLanguage(); });

    /* ── switchStockTab / switchEmpTab / switchAuditsTab / switchExpensesTab ── */
    _patch('switchStockTab',    function () { if (currentLang === 'ar') applyLanguage(); });
    _patch('switchEmpTab',      function () { if (currentLang === 'ar') applyLanguage(); });
    _patch('switchAuditsTab',   function () { if (currentLang === 'ar') applyLanguage(); });
    _patch('switchExpensesTab', function () { if (currentLang === 'ar') applyLanguage(); });

    /* ── Data mutations that re-render lists ── */
    ['logPurchase', 'logAdjustment', 'addEmployee', 'logPersonalUse',
     'confirmCheckout', 'confirmPersonCheckout', 'confirmAddPerson', 'confirmMigration'
    ].forEach(function (fn) {
        _patch(fn, function () { if (currentLang === 'ar') applyLanguage(); });
    });

})();

/* ── Apply saved language on page load ── */
document.addEventListener('DOMContentLoaded', function () {
    if (currentLang === 'ar') applyLanguage();
});