// ═══════════════════════════════════════════════════════
// MODULE: 05_navigation.js
// Lines 461–542 of original script.js
// ═══════════════════════════════════════════════════════

function switchTab(tab) {
    document.getElementById('btn-lounge').classList.remove('active');
    document.getElementById('btn-noroom').classList.remove('active');
    document.getElementById('btn-finance').classList.remove('active');
    
    document.getElementById('lounge-view').style.display = 'none';
    document.getElementById('noroom-view').style.display = 'none';
    document.getElementById('financial-view').style.display = 'none';
    document.getElementById('audits-view').style.display = 'none';
    document.getElementById('expenses-admin-view').style.display = 'none';
    document.getElementById('admin-games-view').style.display = 'none';
    const _sv = document.getElementById('stock-view');
    if (_sv) _sv.style.display = 'none';
    const _ev = document.getElementById('employee-view');
    if (_ev) _ev.style.display = 'none';
    const _nv = document.getElementById('notebook-admin-view');
    if (_nv) _nv.style.display = 'none';
    const _pv = document.getElementById('pending-admin-view');
    if (_pv) _pv.style.display = 'none';

    if(tab === 'lounge') {
        document.getElementById('btn-lounge').classList.add('active');
        document.getElementById('lounge-view').style.display = 'block';
    } else if (tab === 'noroom') {
        document.getElementById('btn-noroom').classList.add('active');
        document.getElementById('noroom-view').style.display = 'block';
    } else if (tab === 'finance') {
        document.getElementById('btn-finance').classList.add('active');
        document.getElementById('financial-view').style.display = 'block';
    }
}

function switchZone(zone) {
    currentZone = zone;
    
    // 1. Update active button styling
    document.querySelectorAll('.zone-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`zone-${zone}`).classList.add('active');
    
    // 2. Manage the Price Bar display securely
    const pBar = document.getElementById('price-bar-container');
    
    // Safely grab all spans by ID
    const sSingle = document.getElementById('lounge-rate-single');
    const sMulti = document.getElementById('lounge-rate-multi');
    const sIptv = document.getElementById('lounge-rate-iptv');
    const sPs5 = document.getElementById('lounge-rate-ps5'); 
    const sShared = document.getElementById('shared-rate-display');

    // New VIP category tags (PS4 / PS5 / IPTV) instead of one flat VIP tag
    const sVipPs4 = document.getElementById('vip-rate-ps4');
    const sVipPs5 = document.getElementById('vip-rate-ps5');
    const sVipIptv = document.getElementById('vip-rate-iptv');

    // First, hide EVERYTHING inside the bar to prevent sticking
    if(sSingle) sSingle.style.display = 'none';
    if(sMulti) sMulti.style.display = 'none';
    if(sIptv) sIptv.style.display = 'none';
    if(sPs5) sPs5.style.display = 'none'; 
    if(sShared) sShared.style.display = 'none';
    if(sVipPs4) sVipPs4.style.display = 'none';
    if(sVipPs5) sVipPs5.style.display = 'none';
    if(sVipIptv) sVipIptv.style.display = 'none';

    // Then, turn on only what is needed
    if (zone === 'vip') {
        pBar.style.setProperty('display', 'flex', 'important'); 
        if(sVipPs4) sVipPs4.style.display = 'inline';
        if(sVipPs5) sVipPs5.style.display = 'inline';
        if(sVipIptv) sVipIptv.style.display = 'inline';
    } else if (zone === 'shared') {
        pBar.style.setProperty('display', 'flex', 'important'); 
        if(sShared) sShared.style.display = 'inline';
    } else if (zone === 'cafe') {
        // Force hide the whole container for the Cafe
        pBar.style.setProperty('display', 'none', 'important');
    } else {
        // Default Lounge display
        pBar.style.setProperty('display', 'flex', 'important'); 
        if(sSingle) sSingle.style.display = 'inline';
        if(sMulti) sMulti.style.display = 'inline';
        if(sIptv) sIptv.style.display = 'inline';
        if(sPs5) sPs5.style.display = 'inline'; 
    }

    // 3. Render the correct grid based on the zone
    if (zone === 'shared') {
        renderSharedSpace();
    } else {
        buildConsoles();
    }
    
    // 4. Update the active timers/UI
    updateUI();
}