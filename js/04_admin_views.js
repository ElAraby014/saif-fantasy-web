// ═══════════════════════════════════════════════════════
// MODULE: 04_admin_views.js
// Lines 237–460 of original script.js
// ═══════════════════════════════════════════════════════

function openAuditsView() {
    toggleAdminMenu(false);
    switchTab('none');
    document.getElementById('audits-view').style.display = 'block';
    switchAuditsTab('lounge');
    renderDrinksAdmin();
}

function closeAuditsView() {
    switchTab('lounge');
}

// ── Audits & Pricing tab switcher ───────────────────────
// Mirrors switchStockTab()/switchEmpTab() (12_stock.js/13_employees.js):
// toggles panel display + .active class on the tab buttons. Every panel's
// inputs stay in the DOM (just hidden) so saveAuditsConfig() never loses
// unsaved edits made in a tab the user has since navigated away from.
function switchAuditsTab(tab) {
    const tabs = ['lounge', 'vip', 'shared', 'menu'];
    tabs.forEach(function (t) {
        const panel = document.getElementById('audits-panel-' + t);
        const btn = document.getElementById('atab-' + t);
        if (panel) panel.style.display = (t === tab) ? 'block' : 'none';
        if (btn) btn.classList.toggle('active', t === tab);
    });

    if (tab === 'menu') renderDrinksAdmin();
}

function saveAuditsConfig() {
    const single = document.getElementById('config-single').value;
    const multi = document.getElementById('config-multi').value;
    const loungeIptv = document.getElementById('config-iptv').value;
    const shared = document.getElementById('config-shared') ? document.getElementById('config-shared').value : SHARED_HOURLY_RATE;
    const ps5Extra = document.getElementById('config-ps5-extra') ? document.getElementById('config-ps5-extra').value : RATE_PS5_EXTRA;

    const vipPs4 = document.getElementById('config-vip-ps4') ? document.getElementById('config-vip-ps4').value : RATE_VIP_PS4;
    const vipPs5 = document.getElementById('config-vip-ps5') ? document.getElementById('config-vip-ps5').value : RATE_VIP_PS5;
    const vipIptv = document.getElementById('config-vip-iptv') ? document.getElementById('config-vip-iptv').value : RATE_VIP_IPTV;

    if(!single || !multi || !loungeIptv || !shared || !ps5Extra || !vipPs4 || !vipPs5 || !vipIptv) {
        return customAlert(T('al-fill-pricing'));
    }

    localStorage.setItem('pricing_single', single);
    localStorage.setItem('pricing_multi', multi);
    localStorage.setItem('pricing_lounge_iptv', loungeIptv);
    localStorage.setItem('pricing_shared', shared);
    localStorage.setItem('pricing_ps5_extra', ps5Extra);
    localStorage.setItem('pricing_vip_ps4', vipPs4);
    localStorage.setItem('pricing_vip_ps5', vipPs5);
    localStorage.setItem('pricing_vip_iptv', vipIptv);

    // ── Sync fix: update the in-memory rate globals BEFORE writing to
    // Dexie. saveAppSettingsToDexie() reads RATE_SINGLE/RATE_MULTI/etc.
    // directly off these globals to build the row it pushes to
    // db.app_settings (and from there, to Supabase via 17_sync.js's
    // `updating` hook). Calling it before these assignments pushed the
    // *previous* prices to Dexie/Supabase every time — the edit looked
    // correct locally (localStorage + the UI were already updated) but
    // every other device, and even this device after its next reload,
    // saw the old numbers. Must stay in this order.
    RATE_SINGLE = parseFloat(single);
    RATE_MULTI = parseFloat(multi);
    RATE_LOUNGE_IPTV = parseFloat(loungeIptv);
    SHARED_HOURLY_RATE = parseFloat(shared);
    RATE_PS5_EXTRA = parseFloat(ps5Extra);
    RATE_VIP_PS4 = parseFloat(vipPs4);
    RATE_VIP_PS5 = parseFloat(vipPs5);
    RATE_VIP_IPTV = parseFloat(vipIptv);

    saveAppSettingsToDexie();

    updatePricingDisplays();
    customAlert(T('al-pricing-saved'));
}

function renderDrinksAdmin() {
    const container = document.getElementById('drinks-admin-list');
    container.innerHTML = '';

    for (let key in DRINKS_MENU) {
        const d = DRINKS_MENU[key];
        const recipe = Array.isArray(d.recipe) ? d.recipe : [];
        const recipeSummary = recipe.length > 0
            ? recipe.map(r => `${stockItemName(r.componentKey)} ×${r.qty}`).join(', ')
            : 'No recipe — plain item';

        container.innerHTML += `
            <div style="border:1px solid var(--border-color); border-radius:8px; padding:10px; margin-bottom:10px;">
                <div style="display:flex; gap:8px; align-items:center;">
                    <input type="text" value="${d.name}" id="edit-name-${key}" style="margin:0; flex:2; font-size:14px;">
                    <input type="number" value="${d.price}" id="edit-price-${key}" style="margin:0; flex:1; font-size:14px;">
                    <button class="btn-blue" onclick="saveDrinkEdit('${key}')" style="width:auto; padding:12px; border-radius:6px;">💾</button>
                    <button class="btn-danger" onclick="deleteDrink('${key}')" style="width:auto; padding:12px; border-radius:6px;">🗑</button>
                </div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
                    <div style="font-size:12px; color:var(--text-muted);">🧪 Recipe: <span style="color:var(--text-main);">${recipeSummary}</span></div>
                    <button onclick="toggleRecipeEditor('${key}')" style="width:auto; padding:6px 12px; font-size:12px; background:transparent; border:1px solid var(--accent-cyan); color:var(--accent-cyan); border-radius:6px;">Edit Recipe</button>
                </div>
                <div id="recipe-editor-${key}" style="display:none; margin-top:10px; padding-top:10px; border-top:1px dashed var(--border-color);"></div>
            </div>
        `;
    }
    if(Object.keys(DRINKS_MENU).length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted); font-size:13px; text-align:center;">No items in menu.</p>';
    }
}

// ── Recipe editor (links a menu drink to stockComponents) ──────────

function toggleRecipeEditor(drinkKey) {
    const div = document.getElementById('recipe-editor-' + drinkKey);
    if (!div) return;
    const isOpen = div.style.display !== 'none';
    if (isOpen) {
        div.style.display = 'none';
        div.innerHTML = '';
    } else {
        div.style.display = 'block';
        renderRecipeEditor(drinkKey);
    }
}

function _recipeComponentOptions(selectedKey) {
    let options = '<option value="">— Select Component —</option>';
    for (let ckey in stockComponents) {
        const isTraceable = !!stockComponents[ckey].traceable;
        const sel = (ckey === selectedKey) ? ' selected' : '';
        options += `<option value="${ckey}"${sel}>${stockComponents[ckey].name}${isTraceable ? '' : ' (not tracked)'}</option>`;
    }
    return options;
}

function renderRecipeEditor(drinkKey) {
    const div   = document.getElementById('recipe-editor-' + drinkKey);
    const drink = DRINKS_MENU[drinkKey];
    if (!div || !drink) return;

    const recipe = Array.isArray(drink.recipe) ? drink.recipe : [];

    if (Object.keys(stockComponents).length === 0) {
        div.innerHTML = `<div style="font-size:12px; color:var(--text-muted); text-align:center; padding:10px 0;">
            No components exist yet. Add components from <strong style="color:var(--accent-cyan);">Stock → Components</strong> first.
        </div>`;
        return;
    }

    let rowsHtml = '';
    recipe.forEach((r, idx) => {
        rowsHtml += `
            <div class="recipe-row" data-idx="${idx}" style="display:flex; gap:6px; align-items:center; margin-bottom:6px;">
                <select style="flex:2; margin:0; font-size:13px; padding:8px 10px;">${_recipeComponentOptions(r.componentKey)}</select>
                <input type="number" value="${r.qty}" min="1" style="flex:1; margin:0; font-size:13px; padding:8px 10px;">
                <button onclick="this.closest('.recipe-row').remove()" style="width:auto; padding:6px 10px; background:transparent; border:1px solid var(--danger); color:var(--danger); border-radius:6px; font-size:13px;">✕</button>
            </div>
        `;
    });

    div.innerHTML = `
        <div id="recipe-rows-${drinkKey}">${rowsHtml}</div>
        <div style="display:flex; gap:8px; margin-top:6px;">
            <button onclick="addRecipeRow('${drinkKey}')" style="width:auto; padding:7px 12px; font-size:12px; background:transparent; border:1px dashed var(--border-color); color:var(--text-muted); border-radius:6px;">+ Add Component</button>
            <button class="btn-success" onclick="saveRecipe('${drinkKey}')" style="width:auto; padding:7px 14px; font-size:12px; border-radius:6px;">Save Recipe</button>
        </div>
    `;
}

function addRecipeRow(drinkKey) {
    const container = document.getElementById('recipe-rows-' + drinkKey);
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'recipe-row';
    row.style.cssText = 'display:flex; gap:6px; align-items:center; margin-bottom:6px;';
    row.innerHTML = `
        <select style="flex:2; margin:0; font-size:13px; padding:8px 10px;">${_recipeComponentOptions('')}</select>
        <input type="number" value="1" min="1" style="flex:1; margin:0; font-size:13px; padding:8px 10px;">
        <button onclick="this.closest('.recipe-row').remove()" style="width:auto; padding:6px 10px; background:transparent; border:1px solid var(--danger); color:var(--danger); border-radius:6px; font-size:13px;">✕</button>
    `;
    container.appendChild(row);
}

function saveRecipe(drinkKey) {
    const drink = DRINKS_MENU[drinkKey];
    if (!drink) return;

    const rows = document.querySelectorAll(`#recipe-rows-${drinkKey} .recipe-row`);
    const recipe = [];
    let hasInvalid = false;

    rows.forEach(row => {
        const sel = row.querySelector('select');
        const qtyInput = row.querySelector('input[type="number"]');
        const componentKey = sel ? sel.value : '';
        const qty = qtyInput ? parseFloat(qtyInput.value) : 0;
        if (!componentKey) return; // skip empty rows silently
        if (!qty || qty <= 0) { hasInvalid = true; return; }
        recipe.push({ componentKey, qty });
    });

    if (hasInvalid) return customAlert(T('al-recipe-invalid-qty'), T('al-title-invalid-recipe'));

    drink.recipe = recipe;
    DRINKS_MENU[drinkKey] = drink;
    localStorage.setItem('drinks_menu', JSON.stringify(DRINKS_MENU));
    saveAppSettingsToDexie();

    renderDrinksAdmin();
    customAlert(recipe.length > 0 ? Tf('al-recipe-saved', { name: drink.name }) : Tf('al-recipe-cleared', { name: drink.name }), T('al-title-recipe-updated'));
}

function saveDrinkEdit(key) {
    const newName = document.getElementById(`edit-name-${key}`).value;
    const newPrice = parseFloat(document.getElementById(`edit-price-${key}`).value);
    if(newName && newPrice >= 0) {
        const existingRecipe = DRINKS_MENU[key] && Array.isArray(DRINKS_MENU[key].recipe) ? DRINKS_MENU[key].recipe : undefined;
        DRINKS_MENU[key] = { name: newName, price: newPrice };
        if (existingRecipe) DRINKS_MENU[key].recipe = existingRecipe;
        localStorage.setItem('drinks_menu', JSON.stringify(DRINKS_MENU));
        saveAppSettingsToDexie();
        customAlert(T('al-menu-item-updated'));
    } else {
        customAlert(T('al-invalid-name-price'));
    }
}

function deleteDrink(key) {
    showConfirm(T('cf-delete-menu-item'), () => {
        delete DRINKS_MENU[key];
        localStorage.setItem('drinks_menu', JSON.stringify(DRINKS_MENU));
        saveAppSettingsToDexie();
        renderDrinksAdmin();
    }, null);
}

function addNewDrink() {
    let nameInput = document.getElementById('new-drink-name').value.trim();
    let priceInput = parseFloat(document.getElementById('new-drink-price').value);
    
    if(!nameInput || isNaN(priceInput) || priceInput < 0) {
        return customAlert(T('al-fill-fields-price'));
    }
    
    let baseId = nameInput.toLowerCase().replace(/[^a-z0-9]/g, '_');
    let finalId = baseId;
    let counter = 1;
    
    while(DRINKS_MENU[finalId]) {
        finalId = baseId + '_' + counter;
        counter++;
    }
    
    DRINKS_MENU[finalId] = { name: nameInput, price: priceInput };
    localStorage.setItem('drinks_menu', JSON.stringify(DRINKS_MENU));
    saveAppSettingsToDexie();
    
    document.getElementById('new-drink-name').value = '';
    document.getElementById('new-drink-price').value = '';
    
    renderDrinksAdmin();
    customAlert(T('al-item-added'));
}

// CSV Data Engine
// CSV Data Engine
async function exportDataToCSV() {
    try {
        let data = await db.financial_data.toArray(); 
        if (data.length === 0) return customAlert(T('al-no-financial-data'), T('al-title-export-failed'));

        // Sort data chronologically (oldest to newest) to ensure the running net profit calculates correctly
        data.sort((a, b) => a.id - b.id);

        // Updated headers to include the three new columns
        const headers = ['id', 'date', 'time', 'type', 'description', 'logged_by', 'income', 'expenses', 'net_profit'].join(',');
        
        let runningNetProfit = 0;

        const rows = data.map(row => {
            let incomeAmount = 0;
            let expenseAmount = 0;

            // Sort the amount into the correct column and update the running profit
            if (row.type === 'Income') {
                incomeAmount = row.amount;
                runningNetProfit += row.amount;
            } else if (row.type === 'Expense') {
                expenseAmount = row.amount;
                runningNetProfit -= row.amount;
            }

            return [
                row.id, 
                `"\t${row.date}"`, 
                `"\t${row.time}"`, 
                row.type, 
                `"${(row.description || '').replace(/"/g, '""')}"`, 
                row.logged_by,
                incomeAmount.toFixed(2),     // New Income column
                expenseAmount.toFixed(2),    // New Expenses column
                runningNetProfit.toFixed(2)  // New Net Profit column
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
            // Updated the default filename slightly to match the new button text concept
            link.setAttribute("download", `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }

    } catch (error) {
        console.error("Export failed:", error);
        customAlert(T('al-export-db-failed'), T('al-title-error'));
    }
}

function importDataFromCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];

    if (!file) return customAlert(T('al-select-csv-first'), T('al-title-import-failed'));

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const text = e.target.result;
            const lines = text.split('\n');
            if (lines.length < 2) return customAlert(T('al-csv-empty'), T('al-title-import-failed'));

            const importedData = [];

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue; 
                
                const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
                let cleanVals = values.map(v => v.replace(/^"|"$/g, '').trim());
                
                importedData.push({
                    id: parseFloat(cleanVals[0]),
                    date: cleanVals[1],
                    time: cleanVals[2],
                    type: cleanVals[3],
                    amount: parseFloat(cleanVals[4]),
                    description: cleanVals[5],
                    logged_by: cleanVals[6] || 'Unknown',
                    // Without this, financial_data's LWW comparison treats the
                    // row as timestamp zero and it silently loses to any
                    // remote row with the same id on the next pull. See
                    // Sync_Bugs_And_Fix_Plan.md, Bug 2.
                    updated_at: new Date().toISOString()
                });
            }

            await db.financial_data.bulkPut(importedData); 
            
            const finData = await db.financial_data.toArray();
            financialData = finData.map(row => ({
                id: row.id, date: row.date, time: row.time, type: row.type, 
                amount: row.amount, description: row.description, user: row.logged_by
            }));
            
            updateFinanceUI();
            fileInput.value = ''; 
            customAlert(Tf('al-import-success', { count: importedData.length }), T('al-title-success'));

        } catch (error) {
            console.error("Import failed:", error);
            customAlert(T('al-import-db-error'), T('al-title-error'));
        }
    };
    
    reader.readAsText(file);
}