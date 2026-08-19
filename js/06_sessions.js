// ═══════════════════════════════════════════════════════
// MODULE: 06_sessions.js
// Lines 543–807 of original script.js
// ═══════════════════════════════════════════════════════

function buildConsoles() {
    const container = document.getElementById('console-grid-container');
    container.innerHTML = ''; 

    let entitiesToBuild = [];
    if (currentZone === 'lounge') entitiesToBuild = LOUNGE_CONSOLES;
    else if (currentZone === 'vip') entitiesToBuild = VIP_CONSOLES;
    else if (currentZone === 'cafe') entitiesToBuild = CAFE_TABLES;

    entitiesToBuild.forEach(c => {
        if (c.type === 'cafe') {
            // Check if the table is empty and set the class
            let badgeClass = isTableEmpty(c.id) ? "status-badge inactive-badge" : "status-badge";
            
            container.innerHTML += `
            <div class="console-card" id="card-${c.id}">
                <div class="console-header">
                    <div class="console-title" style="color: var(--warning);">${c.name}</div>
                    <span class="${badgeClass}" id="badge-${c.id}" style="background: rgba(251, 191, 36, 0.15); color: var(--warning);">Open</span>
                </div>
                <div style="font-size: 13px; color: var(--text-muted); margin-bottom: 15px; text-align: center;">Manage Walk-in Orders & Extras</div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="btn-blue" onclick="openDrinksModal(${c.id})">🥤 Add Drinks & Extras</button>
                    <button style="background: transparent; border: 1px dashed #3b82f6; color: #3b82f6;" onclick="switchTab('noroom')">📝 Ask Game (Log Request)</button>
                    <button class="btn-warning" onclick="openMigrateModal(${c.id})">➡️ Migrate to PS Session</button>
                    <button class="btn-danger" onclick="endCafeSession(${c.id})">💳 Checkout Table</button>
                </div>
            </div>`;
        } else {
            const isPS5 = c.name.includes("PS5");
            const isVIP = c.type === 'vip';
            const titleColor = isPS5 || isVIP ? 'color: var(--accent-purple);' : '';

            // ── Hardware Mutual-Exclusion check ──────────────────────
            const partner = getLinkedPartner(c.id);
            const sessHere = sessions[c.id];
            const lockedByPartner = partner && sessions[partner.id] && sessions[partner.id].active && !(sessHere && sessHere.active);

            if (lockedByPartner) {
                container.innerHTML += `
                <div class="console-card locked-card" id="card-${c.id}">
                    <div class="console-header">
                        <div class="console-title" style="${titleColor}">${c.name}</div>
                        <span class="status-badge status-locked" id="status-${c.id}">🔒 Locked</span>
                    </div>
                    <div class="timer-display" id="timer-${c.id}">--:--:--</div>
                    <div style="font-size: 13px; color: var(--text-muted); text-align: center; padding: 25px 10px;">
                        In Use in Other Section${partner ? ` (${partner.name})` : ''}
                    </div>
                    <div class="controls-available" id="controls-avail-${c.id}" style="display:none;"></div>
                    <div class="controls-active" id="controls-act-${c.id}" style="display:none;"></div>
                </div>`;
                return; // Skip normal card rendering entirely — hardware is unavailable
            }

            // Mode toggle buttons: VIP rooms only get "Gaming" and "IPTV"
            const preModeButtons = isVIP ? `
                        <button class="mode-toggle-btn selected" id="pre-gaming-${c.id}" onclick="setPreStartMode(${c.id}, 'gaming')" style="flex:1;">🎮 Gaming</button>
                        <button class="mode-toggle-btn" id="pre-iptv-${c.id}" onclick="setPreStartMode(${c.id}, 'iptv')" style="flex:1;">📺 IPTV</button>
            ` : `
                        <button class="mode-toggle-btn selected" id="pre-single-${c.id}" onclick="setPreStartMode(${c.id}, 'single')" style="flex:1;">Single</button>
                        <button class="mode-toggle-btn" id="pre-multi-${c.id}" onclick="setPreStartMode(${c.id}, 'multi')" style="flex:1;">Multi</button>
                        <button class="mode-toggle-btn" id="pre-iptv-${c.id}" onclick="setPreStartMode(${c.id}, 'iptv')" style="flex:1;">IPTV</button>
            `;

            const activeModeButtons = isVIP ? `
                        <button class="mode-toggle-btn" onclick="switchActiveMode(${c.id}, 'gaming')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">🎮 Gaming</button>
                        <button class="mode-toggle-btn" onclick="switchActiveMode(${c.id}, 'iptv')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">📺 IPTV</button>
            ` : `
                        <button class="mode-toggle-btn" onclick="switchActiveMode(${c.id}, 'single')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">Single</button>
                        <button class="mode-toggle-btn" onclick="switchActiveMode(${c.id}, 'multi')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">Multi</button>
                        <button class="mode-toggle-btn" onclick="switchActiveMode(${c.id}, 'iptv')" style="flex:1; border: 1px solid var(--border-color); background: transparent; color: white;">IPTV</button>
            `;

            container.innerHTML += `
            <div class="console-card" id="card-${c.id}">
                <div class="console-header">
                    <div class="console-title" style="${titleColor}">${c.name}</div>
                    <span class="status-badge status-available" id="status-${c.id}">Available</span>
                </div>
                <div class="timer-display" id="timer-${c.id}">00:00:00</div>
                
                <div class="controls-available" id="controls-avail-${c.id}">
                    <div class="mode-toggle-group" id="mode-group-${c.id}">
                        ${preModeButtons}
                    </div>
                    
                    <button onclick="startSession(${c.id}, 'open', 0)" style="margin-bottom: 12px; background: transparent; border: 1px solid var(--border-color); color: white;">⏱️ Start Open Time</button>
                    <div class="preset-grid">
                        <button class="preset-btn" onclick="startSession(${c.id}, 'fixed', 30)">30m</button>
                        <button class="preset-btn" onclick="startSession(${c.id}, 'fixed', 60)">1h</button>
                        <button class="preset-btn" onclick="startSession(${c.id}, 'fixed', 90)">1.5h</button>
                        <button class="preset-btn" onclick="startSession(${c.id}, 'fixed', 120)">2h</button>
                    </div>
                    <div class="custom-time-row">
                        <input type="number" id="custom-time-${c.id}" placeholder="Custom Mins" min="1">
                        <button class="preset-btn" onclick="startCustomSession(${c.id})">Set</button>
                    </div>
                </div>

                <div class="controls-active" id="controls-act-${c.id}" style="display:none; flex-direction:column;">
                    <div class="session-info-box" id="mode-info-${c.id}"></div>
                    <div class="mode-toggle-group" style="margin-bottom: 12px; gap: 5px;">
                        ${activeModeButtons}
                    </div>                    
                    <button class="btn-blue" style="margin-bottom: 15px;" onclick="openDrinksModal(${c.id})">🥤 Add Extras</button>
                    <button class="btn-danger" onclick="endSession(${c.id})">Checkout</button>
                </div>
            </div>`;
        }
    });
}

function setPreStartMode(id, mode) {
    // Block mode selection entirely if this unit's hardware partner is active
    if (isHardwareLocked(id)) return;

    pendingModes[id] = mode;
    const btnSingle = document.getElementById(`pre-single-${id}`);
    const btnMulti = document.getElementById(`pre-multi-${id}`);
    const btnIptv = document.getElementById(`pre-iptv-${id}`);
    const btnGaming = document.getElementById(`pre-gaming-${id}`);
    
    if(btnSingle) btnSingle.classList.remove('selected');
    if(btnMulti) btnMulti.classList.remove('selected');
    if(btnIptv) btnIptv.classList.remove('selected');
    if(btnGaming) btnGaming.classList.remove('selected');
    
    if (mode === 'single' && btnSingle) {
        btnSingle.classList.add('selected');
    } else if (mode === 'multi' && btnMulti) {
        btnMulti.classList.add('selected');
    } else if (mode === 'iptv' && btnIptv) {
        btnIptv.classList.add('selected');
    } else if (mode === 'gaming' && btnGaming) {
        btnGaming.classList.add('selected');
    }
}

function startCustomSession(id) {
    const mins = parseInt(document.getElementById(`custom-time-${id}`).value);
    if (mins > 0) {
        startSession(id, 'fixed', mins);
    } else {
        customAlert(T('al-invalid-minutes'), T('al-title-invalid-input'));
    }
}

// Shows "what this session is about to cost" in the Start Session modal —
// console name, chosen mode, applicable hourly rate, and open/fixed timing —
// so staff can double check the specs before confirming the start.
function updateStartSessionPreview(id, mode, mins) {
    const consoleObj = ALL_ENTITIES.find(c => c.id === id);
    if (!consoleObj) return;

    const isVip = consoleObj.type === 'vip';
    const isPS5 = consoleObj.name.includes("PS5");
    const playerMode = pendingModes[id] || (isVip ? 'gaming' : 'single');

    let rate = 0;
    let modeLabel = '';

    if (isVip) {
        if (playerMode === 'iptv') {
            rate = RATE_VIP_IPTV;
            modeLabel = 'IPTV Viewing';
        } else {
            rate = isPS5 ? RATE_VIP_PS5 : RATE_VIP_PS4;
            modeLabel = 'Gaming';
        }
    } else {
        if (playerMode === 'multi') {
            rate = RATE_MULTI + (isPS5 ? RATE_PS5_EXTRA : 0);
            modeLabel = 'Multiplayer';
        } else if (playerMode === 'iptv') {
            rate = RATE_LOUNGE_IPTV;
            modeLabel = 'IPTV Viewing';
        } else {
            rate = RATE_SINGLE + (isPS5 ? RATE_PS5_EXTRA : 0);
            modeLabel = 'Single Player';
        }
    }

    const timeLabel = mode === 'open' ? 'Open Time' : `Fixed — ${mins} min`;

    const elConsole = document.getElementById('ss-preview-console');
    const elMode = document.getElementById('ss-preview-mode');
    const elRate = document.getElementById('ss-preview-rate');
    if (elConsole) elConsole.innerText = consoleObj.name;
    if (elMode) elMode.innerText = `${modeLabel} • ${timeLabel}`;
    if (elRate) elRate.innerText = `${rate} EGP/hr`;
}

function startSession(id, mode, mins) {
    // Hardware Mutual-Exclusion — block starting if the linked partner is active
    const partner = getLinkedPartner(id);
    if (partner && sessions[partner.id] && sessions[partner.id].active) {
        return customAlert(
            Tf('al-hardware-locked', { partner: partner.name }),
            T('al-title-hardware-locked')
        );
    }

    pendingSessionStart = { id, mode, mins };
    
    const container = document.getElementById('start-games-container');
    container.innerHTML = '<input type="text" class="start-game-input" placeholder="Enter game name (optional)">';

    updateStartSessionPreview(id, mode, mins);

    document.getElementById('start-session-modal').style.display = 'flex';
}

async function confirmSessionStart() {
    if (!pendingSessionStart) return;
    const { id, mode, mins } = pendingSessionStart;

    const inputs = document.querySelectorAll('.start-game-input');
    let gamesAsked = [];
    inputs.forEach(input => {
        if (input.value.trim() !== '') gamesAsked.push(input.value.trim());
    });

    if (gamesAsked.length > 0) {
        const consoleObj = ALL_ENTITIES.find(c => c.id === id);
        const consoleName = consoleObj ? consoleObj.name : "Unknown Console";
        await saveGameRecord(`Session Start (${consoleName})`, gamesAsked);
    }

    const consoleObjForStart = ALL_ENTITIES.find(c => c.id === id);
    const defaultMode = (consoleObjForStart && consoleObjForStart.type === 'vip') ? 'gaming' : 'single';
    const playerMode = pendingModes[id] || defaultMode;
    const startTimeVal = Date.now();
    const segmentsList = [{ type: playerMode, start: startTimeVal, end: null }];
    const initialDrinks = {};

    sessions[id] = {
        active: true,
        mode: mode,
        startTime: startTimeVal,
        presetMins: mins,
        currentPlayerMode: playerMode,
        segments: segmentsList,
        drinks: initialDrinks,
        customExtras: [],
        mergedTablesCount: 0
    };

    updateUI();

    await db.sessions.put({
        id: id,
        active: true,
        mode: mode,
        start_time: startTimeVal,
        preset_mins: mins,
        current_player_mode: playerMode,
        segments: segmentsList,
        drinks: initialDrinks,
        custom_extras: [],
        merged_tables_count: 0,
        updated_at: new Date().toISOString()
    });

    // Immediately push state to Flutter so background timer is aware
    _syncSessionsToFlutter();

    closeStartSessionModal();
}

function closeStartSessionModal() {
    document.getElementById('start-session-modal').style.display = 'none';
    pendingSessionStart = null;
}

function addGameInput(containerId, inputClass) {
    const container = document.getElementById(containerId);
    const input = document.createElement('input');
    input.type = 'text';
    input.className = inputClass;
    input.placeholder = 'Enter game name';
    container.appendChild(input);
}

async function submitNoRoomGames() {
    const inputs = document.querySelectorAll('.noroom-game-input');
    let gamesAsked = [];
    inputs.forEach(input => {
        if (input.value.trim() !== '') gamesAsked.push(input.value.trim());
    });

    if (gamesAsked.length === 0) {
        return customAlert(T('al-enter-game-name'), T('al-title-empty-field'));
    }

    await saveGameRecord('Walk-in (No Room)', gamesAsked);

    const container = document.getElementById('noroom-games-container');
    container.innerHTML = '<input type="text" class="noroom-game-input" placeholder="Enter game name (e.g., FIFA 24)">';
    
    customAlert(T('al-walkin-logged'), T('al-title-success'));
}

async function saveGameRecord(type, gamesList) {
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
        games: gamesList.join(', '),
        logged_by: currentUser,
        updated_at: new Date().toISOString()
    };

    gamesData.push(record);
    await db.games_history.put(record);
}

async function switchActiveMode(id, newMode) {
    const sess = sessions[id];
    
    // If they click the mode they are already playing, do nothing
    if (sess.currentPlayerMode === newMode) return;

    const now = Date.now();
    
    // Stop the timer for the previous mode
    if (sess.segments.length > 0) {
        sess.segments[sess.segments.length - 1].end = now;
    }
    
    // Start the timer for the newly selected mode
    sess.currentPlayerMode = newMode;
    sess.segments.push({ type: sess.currentPlayerMode, start: now, end: null });
    
    updateUI();

    // Save the change to the local database so it survives a page refresh
    await db.sessions.update(id, {
        current_player_mode: sess.currentPlayerMode,
        segments: sess.segments,
        updated_at: new Date().toISOString()
    });
}

async function resetConsole(id) {
    sessions[id] = { 
        active: false, mode: null, startTime: null, presetMins: 0, 
        currentPlayerMode: 'single', segments: [], drinks: {}, customExtras: [],
        notified10: false, notified5: false, notifiedFinished: false,
        mergedTablesCount: 0
    };
    updateUI();
    await db.sessions.update(id, {
        active: false, mode: null, start_time: null, preset_mins: 0,
        current_player_mode: 'single', segments: [], drinks: {}, custom_extras: [],
        merged_tables_count: 0,
        updated_at: new Date().toISOString()
    });
    // Tell Flutter this session is gone so it stops background notifications for it
    _syncSessionsToFlutter();
}

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}