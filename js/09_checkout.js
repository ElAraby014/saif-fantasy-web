// ═══════════════════════════════════════════════════════
// MODULE: 09_checkout.js
// Lines 1059–1416 of original script.js
// ═══════════════════════════════════════════════════════

function endSession(id) {
    const sess = sessions[id];
    const now = Date.now();
    let singleMs = 0;
    let multiMs = 0;
    let iptvMs = 0;
    let gamingMs = 0; // VIP-only bucket — replaces single/multi for VIP rooms

    sess.segments.forEach(seg => {
        const endTime = seg.end ? seg.end : now;
        const timeSpent = endTime - seg.start;
        if (seg.type === 'single') singleMs += timeSpent;
        else if (seg.type === 'multi') multiMs += timeSpent;
        else if (seg.type === 'iptv') iptvMs += timeSpent;
        else if (seg.type === 'gaming') gamingMs += timeSpent;
    });

    const consoleObj = ALL_ENTITIES.find(c => c.id === id);
    const isVip = consoleObj.type === 'vip';
    const isPS5 = consoleObj.name.includes("PS5");

    // Legacy safety net: a VIP unit should only ever log 'gaming' or 'iptv'
    // segments. If a stale build (or old data) let a 'single'/'multi'
    // segment slip in on a VIP console, fold that time into Gaming instead
    // of silently losing it / charging 0 for it.
    if (isVip) {
        gamingMs += singleMs + multiMs;
        singleMs = 0;
        multiMs = 0;
    }

    const totalMs = singleMs + multiMs + iptvMs + gamingMs;
    const singleHours = (singleMs / 1000) / 3600;
    const multiHours = (multiMs / 1000) / 3600;
    const iptvHours = (iptvMs / 1000) / 3600;
    const gamingHours = (gamingMs / 1000) / 3600;

    // --- PRICING OVERHAUL START ---
    let rSingle = 0, rMulti = 0, rIptv = 0, rGaming = 0;

    if (isVip) {
        // VIP rates are flat, hardware-specific categories.
        // RATE_PS5_EXTRA never applies here — the VIP PS5 rate already accounts for it.
        rGaming = isPS5 ? RATE_VIP_PS5 : RATE_VIP_PS4;
        rIptv = RATE_VIP_IPTV;
    } else {
        rSingle = RATE_SINGLE;
        rMulti = RATE_MULTI;
        rIptv = RATE_LOUNGE_IPTV; // flat 100/hr — never touched by the PS5 surcharge

        // PS5 surcharge applies ONLY to Lounge Single/Multi — never to IPTV
        if (isPS5) {
            rSingle += RATE_PS5_EXTRA;
            rMulti += RATE_PS5_EXTRA;
        }
    }
    // --- PRICING OVERHAUL END ---

    let singlePrice = Math.round((singleHours * rSingle) * 2) / 2;
    let multiPrice = Math.round((multiHours * rMulti) * 2) / 2;
    let iptvPrice = Math.round((iptvHours * rIptv) * 2) / 2;
    let gamingPrice = Math.round((gamingHours * rGaming) * 2) / 2;

    let extrasTotal = 0;
    let extrasBreakdown = [];
    let drinksHtml = '';

    for (let key in DRINKS_MENU) {
        let qty = sess.drinks[key] || 0;
        if (qty > 0) {
            let itemTotal = qty * DRINKS_MENU[key].price;
            extrasTotal += itemTotal;
            extrasBreakdown.push(`${DRINKS_MENU[key].name} x${qty}`);
            drinksHtml += `<div class="receipt-sub"><span>↳ ${DRINKS_MENU[key].name} x${qty}</span><strong>${itemTotal.toFixed(2)} EGP</strong></div>`;
        }
    }

    sess.customExtras.forEach(item => {
        extrasTotal += item.price;
        extrasBreakdown.push(`${item.name} (${item.price})`);
        drinksHtml += `<div class="receipt-sub"><span>↳ ${item.name}</span><strong>${item.price.toFixed(2)} EGP</strong></div>`;
    });

    if (totalMs < 600000) { 
        if (extrasTotal === 0) {
            customAlert(T('al-session-under-10min'), T('al-title-session-ignored'));
            resetConsole(id);
            return;
        } else {
            showConfirm(
                T('cf-short-session-drinks'),
                function onYes() {
                    proceedToCheckoutUI(id, singleMs, multiMs, iptvMs, gamingMs, 0, 0, 0, 0, extrasTotal, extrasBreakdown, drinksHtml);
                },
                function onNo() {
                    // Declining the charge cancels the session outright — give back
                    // every unit of stock this session reserved, exactly as if each
                    // drink had been "-"'d out and each custom item had been ✕'d out
                    // individually (updateDrinkQty()/removeCustomItem() in
                    // 08_drinks.js), since resetConsole() itself just wipes
                    // sess.drinks/customExtras with no idea stock was ever reserved.
                    if (typeof releaseStockForItem === 'function') {
                        for (let key in sess.drinks) {
                            const qty = sess.drinks[key] || 0;
                            if (qty > 0) releaseStockForItem(key, qty);
                        }
                        (sess.customExtras || []).forEach(item => {
                            if (Array.isArray(item.stockComponents)) {
                                item.stockComponents.forEach(c => releaseStockForItem(c.key, c.qty));
                            }
                        });
                    }
                    resetConsole(id);
                    customAlert(T('al-session-cancelled'), T('al-title-cancelled'));
                },
                T('al-title-short-session')
            );
            return;
        }
    }

    proceedToCheckoutUI(id, singleMs, multiMs, iptvMs, gamingMs, singlePrice, multiPrice, iptvPrice, gamingPrice, extrasTotal, extrasBreakdown, drinksHtml);
}

function proceedToCheckoutUI(id, sMs, mMs, iMs, gMs, sPrice, mPrice, iPrice, gPrice, extrasTotal, extrasBreakdown, drinksHtml) {
    const consoleObj = ALL_ENTITIES.find(c => c.id === id);
    const sess = sessions[id];
    const isVip = consoleObj.type === 'vip';
    const finalPrice = sPrice + mPrice + iPrice + gPrice + extrasTotal;

    document.getElementById('chk-console').innerText = consoleObj.name;
    document.getElementById('chk-mode').innerText = sess.mode === 'open' ? 'Open Time' : `Fixed (${sess.presetMins}m)`;
    document.getElementById('chk-time').innerText = formatTime(Math.floor((sMs + mMs + iMs + gMs) / 1000));

    // For VIP rooms, the "Single" row is repurposed to show the flat Gaming Mode charge
    const singleLabel = document.getElementById('chk-single-label');
    if (isVip) {
        if (singleLabel) singleLabel.innerText = 'Gaming Mode';
        document.getElementById('chk-single-row').style.display = gMs > 0 ? 'flex' : 'none';
        document.getElementById('chk-single-time').innerText = Math.round(gMs / 60000) + 'm';
        document.getElementById('chk-single-price').innerText = `${gPrice.toFixed(2)} EGP`;
        document.getElementById('chk-multi-row').style.display = 'none';
    } else {
        if (singleLabel) singleLabel.innerText = 'Single';
        document.getElementById('chk-single-row').style.display = sMs > 0 ? 'flex' : 'none';
        document.getElementById('chk-single-time').innerText = Math.round(sMs / 60000) + 'm';
        document.getElementById('chk-single-price').innerText = `${sPrice.toFixed(2)} EGP`;

        document.getElementById('chk-multi-row').style.display = mMs > 0 ? 'flex' : 'none';
        document.getElementById('chk-multi-time').innerText = Math.round(mMs / 60000) + 'm';
        document.getElementById('chk-multi-price').innerText = `${mPrice.toFixed(2)} EGP`;
    }

    let iptvRow = document.getElementById('chk-iptv-row');
    if (iptvRow) {
        iptvRow.style.display = iMs > 0 ? 'flex' : 'none';
        document.getElementById('chk-iptv-time').innerText = Math.round(iMs / 60000) + 'm';
        document.getElementById('chk-iptv-price').innerText = `${iPrice.toFixed(2)} EGP`;
    }

    const drinksListContainer = document.getElementById('chk-drinks-list');
    if (extrasTotal > 0) {
        drinksListContainer.innerHTML = drinksHtml || "";
        drinksListContainer.style.display = 'block';
        document.getElementById('chk-extras-price').innerText = `${extrasTotal.toFixed(2)} EGP`;
        document.getElementById('chk-extras-row').style.display = 'flex';
    } else {
        drinksListContainer.style.display = 'none';
        document.getElementById('chk-extras-row').style.display = 'none';
    }

    document.getElementById('chk-price').innerText = `${finalPrice.toFixed(2)} EGP`;
    
    pendingCheckout = {
        id: id,
        name: consoleObj.name,
        amount: finalPrice,
        isGaming: isVip,
        sPrice: isVip ? gPrice : sPrice,
        mPrice: isVip ? 0 : mPrice,
        iPrice,
        sMins: isVip ? Math.round(gMs / 60000) : Math.round(sMs / 60000),
        mMins: isVip ? 0 : Math.round(mMs / 60000),
        iMins: Math.round(iMs / 60000),
        extrasTotal,
        extrasBreakdown: (extrasBreakdown || []).join(', ')
    };

    document.getElementById('chk-phone-number').value = '';
    document.getElementById('checkout-modal').style.display = 'flex';
}

function endCafeSession(id) {
    const sess = sessions[id];
    let extrasTotal = 0;
    let extrasBreakdown = [];
    let drinksHtml = '';

    for (let key in DRINKS_MENU) {
        let qty = sess.drinks[key] || 0;
        if (qty > 0) {
            let itemTotal = qty * DRINKS_MENU[key].price;
            extrasTotal += itemTotal;
            extrasBreakdown.push(`${DRINKS_MENU[key].name} x${qty}`);
            drinksHtml += `<div class="receipt-sub"><span>↳ ${DRINKS_MENU[key].name} x${qty}</span><strong>${itemTotal.toFixed(2)} EGP</strong></div>`;
        }
    }

    sess.customExtras.forEach(item => {
        extrasTotal += item.price;
        extrasBreakdown.push(`${item.name} (${item.price})`);
        drinksHtml += `<div class="receipt-sub"><span>↳ ${item.name}</span><strong>${item.price.toFixed(2)} EGP</strong></div>`;
    });

    if (extrasTotal === 0) return customAlert(T('al-table-empty'), T('al-title-empty-table'));

    const consoleObj = ALL_ENTITIES.find(c => c.id === id);
    document.getElementById('chk-console').innerText = consoleObj.name;
    document.getElementById('chk-mode').innerText = "Table Order";
    document.getElementById('chk-time').innerText = "--:--:--";
    
    document.getElementById('chk-single-row').style.display = 'none';
    document.getElementById('chk-multi-row').style.display = 'none';
    if (document.getElementById('chk-iptv-row')) document.getElementById('chk-iptv-row').style.display = 'none';

    const drinksListContainer = document.getElementById('chk-drinks-list');
    drinksListContainer.innerHTML = drinksHtml || "";
    drinksListContainer.style.display = 'block';
    
    document.getElementById('chk-extras-price').innerText = `${extrasTotal.toFixed(2)} EGP`;
    document.getElementById('chk-extras-row').style.display = 'flex';
    document.getElementById('chk-price').innerText = `${extrasTotal.toFixed(2)} EGP`;
    
    pendingCheckout = {
        id: id, name: consoleObj.name, amount: extrasTotal,
        sPrice: 0, mPrice: 0, iPrice: 0,
        sMins: 0, mMins: 0, iMins: 0,
        extrasTotal, extrasBreakdown: (extrasBreakdown || []).join(', ')
    };

    document.getElementById('checkout-modal').style.display = 'flex';
}

function openMigrateModal(sourceId) {
    const sess = sessions[sourceId];
    if (Object.keys(sess.drinks).length === 0 && sess.customExtras.length === 0) {
        return customAlert(T('al-table-no-items-migrate'), T('al-title-empty-table'));
    }
    
    migrateSourceId = sourceId;
    const select = document.getElementById('migrate-target');
    select.innerHTML = '<option value="">-- Select Target PS Session --</option>';
    
    let hasActiveSessions = false;
    
    [...LOUNGE_CONSOLES, ...VIP_CONSOLES].forEach(c => {
        if (sessions[c.id] && sessions[c.id].active) {
            const mergeCount = sessions[c.id].mergedTablesCount || 0;
            if (mergeCount >= 2) {
                // Show as disabled so staff can see it's at the limit
                select.innerHTML += `<option value="${c.id}" disabled style="color:#888;">🚫 ${c.name} (Merge limit reached)</option>`;
            } else {
                hasActiveSessions = true;
                const mergeLabel = mergeCount === 1 ? ' ⚠️ 1/2 tables merged' : '';
                select.innerHTML += `<option value="${c.id}">${c.name} (🟢 Active${mergeLabel})</option>`;
            }
        }
    });

    if (!hasActiveSessions) {
        return customAlert(T('al-no-sessions-migrate'), T('al-title-no-sessions'));
    }

    document.getElementById('migrate-modal').style.display = 'flex';
}

function closeMigrateModal() {
    document.getElementById('migrate-modal').style.display = 'none';
    migrateSourceId = null;
}

async function confirmMigration() {
    const targetId = parseInt(document.getElementById('migrate-target').value);
    if (!targetId || isNaN(targetId)) return customAlert(T('al-select-target-console'), T('al-title-validation-error'));

    const targetSess = sessions[targetId];

    // Constraint: Prevent migration if the target session is inactive
    if (!targetSess || !targetSess.active) {
        return customAlert(T('al-migration-inactive'), T('al-title-migration-blocked'));
    }

    // Capture sourceId NOW before closeMigrateModal() nulls migrateSourceId
    const sourceId = migrateSourceId;

    // Constraint: max 2 table merges per session
    const currentMergeCount = targetSess.mergedTablesCount || 0;
    if (currentMergeCount >= 2) {
        closeMigrateModal();
        return customAlert(T('al-merge-limit-reached'), T('al-title-merge-limit'));
    }

    // If this is the 2nd merge, ask for confirmation before proceeding
    if (currentMergeCount === 1) {
        const targetName = ALL_ENTITIES.find(c => c.id === targetId).name;
        const sourceObj = ALL_ENTITIES.find(c => c.id === sourceId);
        closeMigrateModal();
        showConfirm(
            Tf('cf-merge-second-table', { target: targetName, source: sourceObj ? sourceObj.name : '' }),
            async () => { await _doMigration(targetId, sourceId); }
        );
        return;
    }

    // First merge - close modal then proceed
    closeMigrateModal();
    await _doMigration(targetId, sourceId);
}

async function _doMigration(targetId, sourceId) {
    const targetSess = sessions[targetId];
    const sourceSess = sessions[sourceId];

    for (let key in sourceSess.drinks) {
        if (!targetSess.drinks[key]) targetSess.drinks[key] = 0;
        targetSess.drinks[key] += sourceSess.drinks[key];
    }
    targetSess.customExtras = targetSess.customExtras.concat(sourceSess.customExtras);
    targetSess.mergedTablesCount = (targetSess.mergedTablesCount || 0) + 1;

    sourceSess.drinks = {};
    sourceSess.customExtras = [];

    await db.sessions.update(targetId, {
        drinks: targetSess.drinks,
        custom_extras: targetSess.customExtras,
        merged_tables_count: targetSess.mergedTablesCount,
        updated_at: new Date().toISOString()
    });
    await db.sessions.update(sourceId, { drinks: {}, custom_extras: [], updated_at: new Date().toISOString() });

    // Immediately refresh the UI so the source table badge updates without navigation
    updateUI();

    const targetName = ALL_ENTITIES.find(c => c.id === targetId).name;
    migrateSourceId = null;
    customAlert(Tf('al-migration-complete', { target: targetName }), T('al-title-migration-complete'));
}

async function confirmCheckout() {
    if (pendingCheckout) {
        if (pendingCheckout.amount <= 0) {
            await resetConsole(pendingCheckout.id);
            closeCheckoutModal();
            customAlert(T('al-session-closed-no-charge'), T('al-title-checkout-complete'));
            return;
        }

        // 1. Grab the phone number from the new input
        const phoneInput = document.getElementById('chk-phone-number').value.trim();

        let desc = `${pendingCheckout.name} Session`;
        let details = [];
        if (pendingCheckout.sPrice > 0) details.push(`${pendingCheckout.isGaming ? 'Gaming Mode' : 'S'}: ${pendingCheckout.sPrice}EGP (${pendingCheckout.sMins}m)`);
        if (pendingCheckout.mPrice > 0) details.push(`M: ${pendingCheckout.mPrice}EGP (${pendingCheckout.mMins}m)`);
        if (pendingCheckout.iPrice > 0) details.push(`IPTV: ${pendingCheckout.iPrice}EGP (${pendingCheckout.iMins}m)`);
        
        if (pendingCheckout.extrasTotal > 0) {
            // Show the itemized list when we have it, but never let a missing/empty
            // breakdown string hide the fact that extras were actually charged.
            const itemsLabel = pendingCheckout.extrasBreakdown ? `[${pendingCheckout.extrasBreakdown}] ` : '';
            details.push(`Drinks: ${itemsLabel}(Total Extras: ${pendingCheckout.extrasTotal}EGP)`);
        }

        if (details.length > 0) {
            desc += ` | ${details.join(' | ')}`;
        }

        // 2. If a phone number was entered, log it!
        if (phoneInput !== '') {
            desc += ` | Phone: ${phoneInput}`;
            
            // --- NEW LOGIC: Merge phone with existing game request ---
            const targetType = `Session Start (${pendingCheckout.name})`;
            let targetRecord = null;
            
            // Search backwards to find the most recent game start for this console
            for (let i = gamesData.length - 1; i >= 0; i--) {
                if (gamesData[i].type === targetType) {
                    targetRecord = gamesData[i];
                    break;
                }
            }

            if (targetRecord) {
                // Update the existing record with the phone number
                targetRecord.games += ` | Phone: ${phoneInput}`;
                await db.games_history.update(targetRecord.id, { games: targetRecord.games, updated_at: new Date().toISOString() });
            } else {
                // Fallback: If no games were logged at start, create a new record
                await saveGameRecord(`Checkout Phone (${pendingCheckout.name})`, [phoneInput]);
            }
            // --------------------------------------------------------
        }

        console.log('DEBUG_CHECKOUT pendingCheckout=' + JSON.stringify(pendingCheckout) + ' desc=' + desc);
        await saveFinanceRecord('Income', pendingCheckout.amount, desc);
        await resetConsole(pendingCheckout.id);
        
        closeCheckoutModal();
        customAlert(T('al-checkout-success'), T('al-title-success'));
    }
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').style.display = 'none';
    pendingCheckout = null; 
}