// ═══════════════════════════════════════════════════════
// MODULE: 07_timer.js
// Lines 808–957 of original script.js
// ═══════════════════════════════════════════════════════

// ── Background-safe session state sync ──────────────────────────────────────
// Pushes all active fixed-time sessions to Flutter every 30 seconds.
// Flutter's native timer reads this from SharedPreferences and fires
// notifications independently — even when the WebView is backgrounded/closed.

let _bgSyncTick = 0;

function _syncSessionsToFlutter() {
    if (!window.SessionStateBridge) return;

    const activeSessions = [];
    ALL_ENTITIES.forEach(c => {
        if (c.type === 'cafe') return;
        const sess = sessions[c.id];
        if (!sess || !sess.active || sess.mode !== 'fixed') return;

        activeSessions.push({
            id:           c.id,
            name:         c.name,
            startTime:    sess.startTime,
            presetMins:   sess.presetMins,
            notified10:   sess.notified10   || false,
            notified5:    sess.notified5    || false,
            notifiedEnd:  sess.notifiedFinished || false
        });
    });

    try {
        window.SessionStateBridge.postMessage(JSON.stringify(activeSessions));
    } catch (_) {}
}
// ────────────────────────────────────────────────────────────────────────────

function startTimerLoop() {
    timerInterval = setInterval(() => {
        _bgSyncTick++;
        // Sync to Flutter every 30 seconds so background timer stays accurate
        if (_bgSyncTick % 30 === 0) _syncSessionsToFlutter();

        ALL_ENTITIES.forEach(c => {
            if(c.type === 'cafe') return;
            const id = c.id;
            const sess = sessions[id];
            if (sess && sess.active) {
                const elapsedMs = Date.now() - sess.startTime;
                const elapsedSec = Math.floor(elapsedMs / 1000);
                const timerEl = document.getElementById(`timer-${id}`);
                const cardEl = document.getElementById(`card-${id}`);

                if (timerEl && cardEl) {
                    if (sess.mode === 'open') {
                        timerEl.innerText = formatTime(elapsedSec);
                        timerEl.classList.remove('overtime-text');
                        cardEl.classList.remove('overtime');
                    } else if (sess.mode === 'fixed') {
                        const targetSec = sess.presetMins * 60;
                        const diffSec = targetSec - elapsedSec;

                        if (targetSec > 0) {
                            const percentRemaining = (diffSec / targetSec) * 100;

                            if (sess.notified10 === undefined) sess.notified10 = false;
                            if (sess.notified5 === undefined) sess.notified5 = false;
                            if (sess.notifiedFinished === undefined) sess.notifiedFinished = false;

                            const dispatchNotification = (title, bodyMessage) => {
                                if (window.NativeNotificationBridge) {
                                    window.NativeNotificationBridge.postMessage(JSON.stringify({
                                        title: title, body: bodyMessage
                                    }));
                                }
                            };

                            if (percentRemaining <= 20 && percentRemaining > 10 && !sess.notified10 && diffSec > 0) {
                                dispatchNotification(T('notif-title-10pct'), Tf('notif-body-10pct', { name: c.name }));
                                sess.notified10 = true;
                                // Immediately sync so Flutter knows this flag is now true
                                _syncSessionsToFlutter();
                            }

                            if (percentRemaining <= 5 && percentRemaining > 0 && !sess.notified5 && diffSec > 0) {
                                dispatchNotification(T('notif-title-5pct'), Tf('notif-body-5pct', { name: c.name }));
                                sess.notified5 = true;
                                _syncSessionsToFlutter();
                            }

                            if (diffSec <= 0 && !sess.notifiedFinished) {
                                dispatchNotification(T('notif-title-overtime'), Tf('notif-body-overtime', { name: c.name }));
                                sess.notifiedFinished = true;
                                _syncSessionsToFlutter();
                            }
                        }

                        if (diffSec >= 0) {
                            timerEl.innerText = formatTime(diffSec);
                            timerEl.classList.remove('overtime-text');
                            cardEl.classList.remove('overtime');
                        } else {
                            timerEl.innerText = "-" + formatTime(Math.abs(diffSec));
                            timerEl.classList.add('overtime-text');
                            cardEl.classList.add('overtime');
                        }
                    }
                }
            }
        });

        if (currentZone === 'shared') {
            Object.keys(sharedTables).forEach(tableId => {
                sharedTables[tableId].occupants.forEach(person => {
                    const timeDiff = Date.now() - person.startTime;
                    const hours = timeDiff / (1000 * 60 * 60);
                    const cost = (hours * SHARED_HOURLY_RATE).toFixed(2);
                    
                    const m = Math.floor(timeDiff / 60000);
                    const timeStr = `${Math.floor(m / 60)}h ${m % 60}m`;

                    const statsEl = document.getElementById(`shared-stats-${person.id}`);
                    if (statsEl) {
                        statsEl.innerText = `⏱ ${timeStr} | 💰 ${cost} EGP`;
                    }
                });
            });
        }
    }, 1000);
}

function updateUI() {
    ALL_ENTITIES.forEach(c => {
        // Evaluate Cafe Tables dynamically instead of skipping them
        if (c.type === 'cafe') {
            const badge = document.getElementById(`badge-${c.id}`);
            if (badge) {
                if (isTableEmpty(c.id)) {
                    badge.classList.add('inactive-badge');
                } else {
                    badge.classList.remove('inactive-badge');
                }
                badge.innerText = T('badge-open');
            }
            return; // Stop here, as the rest below is for PS Consoles
        }

        const id = c.id;
        const sess = sessions[id];
        if(!sess) return;

        const card = document.getElementById(`card-${id}`);
        const status = document.getElementById(`status-${id}`);
        const availControls = document.getElementById(`controls-avail-${id}`);
        const actControls = document.getElementById(`controls-act-${id}`);
        const modeInfo = document.getElementById(`mode-info-${id}`);
        const timerEl = document.getElementById(`timer-${id}`);
        const customTimeInput = document.getElementById(`custom-time-${id}`);

        // ── Hardware Mutual-Exclusion state ──────────────────────
        const partner = getLinkedPartner(id);
        const isLockedByPartner = partner && sessions[partner.id] && sessions[partner.id].active && !sess.active;

        if (isLockedByPartner) {
            if (card) card.classList.add('locked-card');
            if (status) {
                status.className = 'status-badge status-locked';
                status.innerText = '🔒 Locked';
            }
            if (availControls) {
                availControls.style.display = 'block';
                availControls.querySelectorAll('button, input').forEach(el => el.disabled = true);
            }
            if (actControls) actControls.style.display = 'none';
            if (modeInfo) {
                modeInfo.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:13px;">In Use in Other Section${partner ? ` (${partner.name})` : ''}</div>`;
            }
            if (timerEl) timerEl.innerText = '--:--:--';
            if (customTimeInput) customTimeInput.value = '';
            return;
        }

        if (card) card.classList.remove('locked-card');
        if (availControls) {
            availControls.querySelectorAll('button, input').forEach(el => el.disabled = false);
        }

        if(card && status && availControls && actControls) {
            if (sess.active) {
                card.classList.add('active');
                status.className = 'status-badge status-playing';
                status.innerText = 'In Use';
                availControls.style.display = 'none';
                actControls.style.display = 'flex';

                const isVIP = c.type === 'vip';
                let timeModeText = sess.mode === 'open' ? "Open Time" : `Fixed (${sess.presetMins}m)`;
                let playerModeText;

                if (isVIP) {
                    // VIP rooms only ever show "Gaming" or "IPTV Viewing" — never Single/Multi
                    playerModeText = sess.currentPlayerMode === 'iptv' ? "IPTV Viewing" : "Gaming";
                } else {
                    playerModeText = "Single Player";
                    if (sess.currentPlayerMode === 'multi') playerModeText = "Multiplayer";
                    if (sess.currentPlayerMode === 'iptv') playerModeText = "IPTV Viewing";
                }
                
                modeInfo.innerHTML = `
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <span style="color:var(--text-muted)">Type:</span> <strong>${timeModeText}</strong>
                    </div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="color:var(--text-muted)">State:</span> <strong style="color:var(--accent-cyan)">${playerModeText}</strong>
                    </div>
                `;
                
            } else {
                card.classList.remove('active');
                card.classList.remove('overtime');
                status.className = 'status-badge status-available';
                status.innerText = 'Available';
                availControls.style.display = 'block';
                actControls.style.display = 'none';
                if(timerEl) timerEl.innerText = '00:00:00';
                if(timerEl) timerEl.classList.remove('overtime-text');
                if(customTimeInput) customTimeInput.value = '';
            }
        }
    });
}