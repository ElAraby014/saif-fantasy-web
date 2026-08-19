// ═══════════════════════════════════════════════════════════════════════
// 18_web_gate.js — Website-only entry gate (login + license activation)
//
// Reimplements, in plain browser JS, the two things main.dart owns on
// Android: the native login screen and the license-key/device-limit
// system. Everything downstream (01_config.js → 17_sync.js) is byte-
// identical to the app and has NO idea whether it's being driven by
// Dart or by this file — both call the exact same entry point,
// window.initializeAuthenticatedSession(username, role).
//
// Load order: must load AFTER 01_config.js (uses verifyAppCredential())
// and bcrypt.js, and should load early — before the rest of the app's
// modules run their window.onload logic — since it's responsible for
// showing/hiding the #web-gate-overlay before the app becomes visible.
// See index.html for the actual <script> ordering.
//
// Mirrors main.dart's algorithm exactly (same salt, same period math,
// same hash function) so a key generated for the Android app is valid
// on the website in the same 3-day window, and vice versa.
// ═══════════════════════════════════════════════════════════════════════

(function () {
    'use strict';

    const _SECRET_SALT = 'GrandDimension2026';
    const _PERIOD_EPOCH_MS = Date.UTC(2024, 0, 1); // 2024-01-01, matches main.dart's _periodEpoch

    // ── Period math (mirrors main.dart's _periodFor) ───────────────────────
    function _periodFor(date) {
        const daysSinceEpoch = Math.floor((date.getTime() - _PERIOD_EPOCH_MS) / 86400000);
        const periodIndex = Math.floor(daysSinceEpoch / 3);
        const startMs = _PERIOD_EPOCH_MS + periodIndex * 3 * 86400000;
        const endMs = startMs + 3 * 86400000;
        const id = String(periodIndex).padStart(8, '0');
        return { id, startMs, endMs };
    }

    // ── Deterministic hash key (mirrors main.dart's _generateHashKey,
    //    a 32-bit signed integer hash — same algorithm, same overflow
    //    behavior via |0, same base-36 encoding) ─────────────────────────
    function _generateHashKey(periodId) {
        const s = periodId + _SECRET_SALT;
        let hash = 0;
        for (let i = 0; i < s.length; i++) {
            hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0; // signed 32-bit wraparound
        }
        let r = Math.abs(hash).toString(36).toUpperCase();
        r = r.padStart(8, 'X');
        return r.length > 8 ? r.slice(0, 8) : r;
    }

    function _higherPeriod(a, b) {
        if (a == null) return b;
        if (b == null) return a;
        return a >= b ? a : b;
    }

    // ── localStorage-backed persistence (mirrors main.dart's
    //    flutter_secure_storage + public-vault-file pair, collapsed into
    //    a single localStorage store — weaker than the app's, since
    //    clearing browser data resets it; inherent to the web platform). ──
    const LS = {
        get(key) { try { return localStorage.getItem('wg_' + key); } catch (_) { return null; } },
        set(key, val) { try { localStorage.setItem('wg_' + key, val); } catch (_) {} },
        remove(key) { try { localStorage.removeItem('wg_' + key); } catch (_) {} },
    };

    function _getOrCreateFingerprint() {
        let fp = LS.get('device_fingerprint');
        if (fp) return fp;
        // RFC4122-ish v4 UUID via crypto.getRandomValues
        const bytes = new Uint8Array(16);
        (window.crypto || window.msCrypto).getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
        fp = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
        LS.set('device_fingerprint', fp);
        return fp;
    }

    // ── Supabase device-limit enforcement (identical schema/RLS/logic to
    //    main.dart's _tryRegisterLicenseDevice) ────────────────────────────
    // Returns: 'ok' | 'limitReached' | 'unreachable'
    async function _tryRegisterLicenseDevice(key, fingerprint) {
        if (!window.supabaseClient) return 'unreachable';
        try {
            // 1) Ensure a license_keys row exists for this period's key.
            await window.supabaseClient
                .from('license_keys')
                .upsert({ key, period_type: '3day', max_devices: 5 }, { onConflict: 'key', ignoreDuplicates: true });

            // 2) Read revoked flag + max_devices.
            const { data: keyRows, error: keyErr } = await window.supabaseClient
                .from('license_keys')
                .select('revoked,max_devices')
                .eq('key', key);
            if (keyErr || !keyRows || keyRows.length === 0) return 'unreachable';
            if (keyRows[0].revoked) return 'limitReached'; // same UI message path as the app
            const maxDevices = keyRows[0].max_devices || 5;

            // 3) Count distinct devices already registered.
            const { data: deviceRows, error: devErr } = await window.supabaseClient
                .from('license_key_devices')
                .select('device_fingerprint')
                .eq('key', key);
            if (devErr) return 'unreachable';
            const devices = new Set((deviceRows || []).map(r => r.device_fingerprint));
            if (!devices.has(fingerprint) && devices.size >= maxDevices) {
                return 'limitReached';
            }

            // 4) Upsert this device's registration.
            await window.supabaseClient
                .from('license_key_devices')
                .upsert(
                    { key, device_fingerprint: fingerprint, last_seen_at: new Date().toISOString() },
                    { onConflict: 'key,device_fingerprint' }
                );

            return 'ok';
        } catch (_) {
            return 'unreachable';
        }
    }

    // ── License validation (mirrors main.dart's _validateLicenseStatus) ────
    function _validateLicenseStatus() {
        const now = Date.now();
        const expiresStr = LS.get('license_expires');
        const lastKnownTime = parseInt(LS.get('last_known_time') || '0', 10);

        // Advance the highest-seen-period watermark (never goes backwards).
        const currentPeriodId = _periodFor(new Date(now)).id;
        let watermark = _higherPeriod(LS.get('highest_seen_period'), currentPeriodId);
        LS.set('highest_seen_period', watermark);

        // Clock-rollback guard.
        if (now < lastKnownTime) {
            _purgeLicenseData();
            return false;
        }
        LS.set('last_known_time', String(now));

        if (expiresStr) {
            const expiresAt = parseInt(expiresStr, 10) || 0;
            if (now < expiresAt) return true;
        }
        return false;
    }

    function _purgeLicenseData() {
        LS.remove('license_expires');
        LS.remove('last_known_time');
        // highest_seen_period and used_keys_ledger intentionally NOT purged —
        // same reasoning as main.dart: one-way watermark, permanently-consumed keys.
    }

    async function _reconcileLicenseDeviceWithSupabase() {
        const activeKey = LS.get('active_license_key');
        if (!activeKey) return;
        const fingerprint = _getOrCreateFingerprint();
        const result = await _tryRegisterLicenseDevice(activeKey, fingerprint);
        if (result === 'limitReached') {
            _purgeLicenseData();
            LS.remove('active_license_key');
            _showGate(); // remote revocation / device dropped — re-lock even mid-session
        }
    }

    // ── DOM: gate overlay ───────────────────────────────────────────────────
    function _gateEl() { return document.getElementById('web-gate-overlay'); }

    function _showGate() {
        const el = _gateEl();
        if (el) el.style.display = 'flex';
        document.body.classList.add('web-gate-active');
    }

    function _hideGate() {
        const el = _gateEl();
        if (el) el.style.display = 'none';
        document.body.classList.remove('web-gate-active');
    }

    function _setGateError(msg) {
        const errEl = document.getElementById('wg-error');
        if (errEl) {
            errEl.textContent = msg;
            errEl.style.display = msg ? 'block' : 'none';
        }
    }

    function _setGateStep(step) {
        // step: 'license' | 'login'
        const licenseStep = document.getElementById('wg-step-license');
        const loginStep = document.getElementById('wg-step-login');
        if (licenseStep) licenseStep.style.display = step === 'license' ? 'block' : 'none';
        if (loginStep) loginStep.style.display = step === 'login' ? 'block' : 'none';
        _setGateError('');
    }

    async function _handleLicenseActivation() {
        const input = document.getElementById('wg-license-input');
        const enteredKey = (input?.value || '').trim().toUpperCase();
        const now = new Date();
        const period = _periodFor(now);
        const expectedKey = _generateHashKey(period.id);

        if (enteredKey !== expectedKey) {
            _setGateError('Invalid Key — please use the current activation key.');
            return;
        }

        // Anti-reuse check.
        const usedKeys = (LS.get('used_keys_ledger') || '').split(',').filter(Boolean);
        const highestPeriod = LS.get('highest_seen_period');
        if (usedKeys.includes(enteredKey) || (highestPeriod && period.id < highestPeriod)) {
            _setGateError('This key has already been used or has expired.');
            return;
        }

        // Device-limit check against Supabase.
        const fingerprint = _getOrCreateFingerprint();
        const deviceCheck = await _tryRegisterLicenseDevice(enteredKey, fingerprint);
        if (deviceCheck === 'limitReached') {
            _setGateError('Device limit reached: this key is already active on 5 devices.');
            return;
        }

        // Activate.
        const exp = period.endMs - 1;
        const mergedUsed = Array.from(new Set([...usedKeys, enteredKey]));
        const mergedHighest = _higherPeriod(highestPeriod, period.id);

        LS.set('last_known_time', String(now.getTime()));
        LS.set('license_expires', String(exp));
        LS.set('highest_seen_period', mergedHighest);
        LS.set('used_keys_ledger', mergedUsed.join(','));
        LS.set('active_license_key', enteredKey);
        if (input) input.value = '';

        _setGateStep('login');
    }

    async function _handleLogin() {
        const input = document.getElementById('wg-password-input');
        const entered = (input?.value || '').trim();
        if (typeof verifyAppCredential !== 'function') {
            _setGateError('Login system not ready — please refresh the page.');
            return;
        }
        const user = verifyAppCredential(entered);
        if (!user) {
            _setGateError('Invalid Password');
            return;
        }
        _hideGate();
        if (typeof window.initializeAuthenticatedSession === 'function') {
            window.initializeAuthenticatedSession(user.username, user.role);
        }
        if (input) input.value = '';
    }

    // ── Patch logout() for the web (03_ui_core.js) ──────────────────────────
    // On Android, logout() clears sessionStorage and messages
    // FlutterAuthBridge, which is what actually swaps the screen back to
    // the native login view. On web there is no FlutterAuthBridge, so
    // without this patch the screen would just go blank after logout.
    // Same monkey-patch convention already used by 14_language.js
    // elsewhere in this codebase — wrap, call through, then do the
    // web-only part.
    function _patchLogoutForWeb() {
        if (typeof window.logout !== 'function' || window.logout._webGatePatched) return;
        const _originalLogout = window.logout;
        window.logout = function () {
            _originalLogout();
            const mainApp = document.getElementById('main-app');
            if (mainApp) mainApp.style.display = 'none';
            _setGateStep('login'); // license (if valid) still stands — only re-auth needed
            _showGate();
        };
        window.logout._webGatePatched = true;
    }

    function _init() {
        _patchLogoutForWeb();

        if (_validateLicenseStatus()) {
            _setGateStep('login');
        } else {
            _setGateStep('license');
        }
        _showGate();

        document.getElementById('wg-license-btn')?.addEventListener('click', _handleLicenseActivation);
        document.getElementById('wg-login-btn')?.addEventListener('click', _handleLogin);
        document.getElementById('wg-license-input')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') _handleLicenseActivation();
        });
        document.getElementById('wg-password-input')?.addEventListener('keydown', e => {
            if (e.key === 'Enter') _handleLogin();
        });

        // Continuous re-validation loop (mirrors main.dart's 5s timer) —
        // if the license expires while the app is open, re-lock.
        setInterval(() => {
            const gateCurrentlyHidden = _gateEl()?.style.display === 'none';
            if (!_validateLicenseStatus() && gateCurrentlyHidden) {
                // Gate isn't currently shown but license just expired.
                _showGate();
                _setGateStep('license');
            }
        }, 5000);

        // Credential + license-device reconcile, every 60s (mirrors
        // main.dart's _credentialSyncTimer).
        setInterval(() => {
            if (typeof syncAppCredentialsFromSupabase === 'function') syncAppCredentialsFromSupabase();
            _reconcileLicenseDeviceWithSupabase();
        }, 60000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }
})();
