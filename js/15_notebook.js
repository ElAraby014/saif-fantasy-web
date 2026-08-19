// ═══════════════════════════════════════════════════════
// MODULE: 15_notebook.js
// Notebook — persistent, shared team notes board.
// Loaded AFTER 14_language.js: calls T()/Tf() directly, no monkey-patch
// mechanism needed for its own strings. Companion doc:
// Notebook_Feature_Spec.md.
// ═══════════════════════════════════════════════════════

const NOTE_LIFETIME_MS = 48 * 60 * 60 * 1000;   // 48h natural life
const NOTE_GRACE_MS    = 2  * 60 * 60 * 1000;   // 2h re-pin grace window
const NOTE_EDIT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h edit window
const NOTE_TRIPLE_TAP_WINDOW_MS = 1500;         // ~1.5s triple-tap window

// Transient, in-memory only — never persisted (per spec's "tapLog" note)
let _notebookTapLog = {};
let _notebookPinFeedback = {}; // { [noteId]: { pinned: bool, expiresAt } }
let _notebookPendingMention = null; // null = "Everyone"
let _notebookMentionPickerOpen = false;
let _notebookEditingId = null;

// ── Small helpers ─────────────────────────────────────
function _nbUser() { return sessionStorage.getItem('gaming_user') || 'Unknown'; }
function _nbRole() { return sessionStorage.getItem('gaming_role') || 'user'; }
function _nbGenId() { return 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }
function _nbIsDirectoryAdmin(name) {
    const u = notebookUsers.find(u => u.name === name);
    return !!(u && u.role === 'admin');
}
function _nbSaveNote(note) {
    note.updatedAt = new Date().toISOString();
    db.notes.put(note).catch(e => console.error('Notebook save failed:', e));
}

// ── Visibility / unread rule (spec §4.2) ──────────────
function _nbIsUnreadForUser(note, user) {
    if (note.readBy && note.readBy.includes(user)) return false;
    if (!note.mentionedUser || note.mentionedUser === 'all') return true;
    if (note.mentionedUser === user) return true;
    if (_nbIsDirectoryAdmin(user)) return true;
    return false;
}

function hasUnreadNotebookNotes() {
    const user = _nbUser();
    return notesData.some(n => _nbIsUnreadForUser(n, user));
}

function updateNotebookDotState() {
    const show = hasUnreadNotebookNotes();
    document.querySelectorAll('.notebook-dot').forEach(d => {
        d.style.display = show ? 'block' : 'none';
    });
}

// ── Lifecycle / auto-vanish (spec §4.5) ───────────────
function _nbShouldVanish(note, now) {
    if (note.pinned) return false;
    const age = now - note.timestamp;
    if (!note.unpinnedAt) {
        // Never pinned — plain 48h age-out.
        return age >= NOTE_LIFETIME_MS;
    }
    if (note.unpinnedWithGrace) {
        // Already "completed" its natural life while pinned — 2h grace
        // from the moment it was unpinned, to allow an accidental-unpin fix.
        return now >= (note.unpinnedAt + NOTE_GRACE_MS);
    }
    // Hadn't finished its natural life when unpinned — resume the normal
    // countdown from the original timestamp exactly as if never pinned.
    return age >= NOTE_LIFETIME_MS;
}

async function _nbRunCleanupSweep() {
    const now = Date.now();
    const toDelete = notesData.filter(n => _nbShouldVanish(n, now));
    if (toDelete.length === 0) return;

    for (const n of toDelete) {
        try { await db.notes.delete(n.id); } catch (e) { console.error(e); }
    }
    const deadIds = new Set(toDelete.map(n => n.id));
    notesData = notesData.filter(n => !deadIds.has(n.id));

    if (_nbIsPanelOpen()) renderNotebookPanel();
    if (_nbIsAdminViewOpen()) renderNotebookAdminNotes();
    updateNotebookDotState();
}

function _startNotebookCleanupSweep() {
    if (window._notebookSweepInterval) return;
    window._notebookSweepInterval = setInterval(_nbRunCleanupSweep, 45000);
}

// ── Panel open state helpers ───────────────────────────
function _nbIsPanelOpen() {
    const el = document.getElementById('notebook-panel-overlay');
    return !!(el && el.classList.contains('open'));
}
function _nbIsAdminViewOpen() {
    const el = document.getElementById('notebook-admin-view');
    return !!(el && el.style.display === 'block');
}

// ── Time formatting (WhatsApp-style: HH:MM today, date otherwise) ────
function _nbFormatTimestamp(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
}

function _nbEscapeHtml(str) {
    const div = document.createElement('div');
    div.innerText = str == null ? '' : str;
    return div.innerHTML;
}

// ── Panel open / close ─────────────────────────────────
function openNotebookPanel() {
    const overlay = document.getElementById('notebook-panel-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    renderNotebookPanel();
    const list = document.getElementById('notebook-messages-list');
    if (list) list.scrollTop = list.scrollHeight;
}

function closeNotebookPanel() {
    const overlay = document.getElementById('notebook-panel-overlay');
    if (overlay) overlay.classList.remove('open');
    _notebookMentionPickerOpen = false;
    const picker = document.getElementById('notebook-mention-picker');
    if (picker) picker.style.display = 'none';
}

// ── Rendering: main panel ──────────────────────────────
function renderNotebookPanel() {
    const titleEl = document.getElementById('notebook-panel-title-el');
    if (titleEl) titleEl.innerText = T('notebook-title');

    const pinnedContainer = document.getElementById('notebook-pinned-list');
    const msgContainer = document.getElementById('notebook-messages-list');
    if (!pinnedContainer || !msgContainer) return;

    const user = _nbUser();
    const sorted = notesData.slice().sort((a, b) => a.timestamp - b.timestamp);
    const pinned = sorted.filter(n => n.pinned).sort((a, b) => (a.pinnedAt || 0) - (b.pinnedAt || 0));
    const normal = sorted;

    pinnedContainer.innerHTML = pinned.length
        ? pinned.map(n => _nbRenderBubble(n, user, true)).join('')
        : '';

    msgContainer.innerHTML = normal.length
        ? normal.map(n => _nbRenderBubble(n, user, false)).join('')
        : `<div style="text-align:center; color:var(--text-muted); font-size:13px; padding:30px 0;">${T('notebook-empty')}</div>`;

    _nbRenderMentionChip();
}

function _nbRenderBubble(note, user, inPinnedSection) {
    const unread = _nbIsUnreadForUser(note, user) ? ' unread' : '';
    const pinnedClass = note.pinned ? ' pinned-bubble' : '';
    const mentionBadge = note.mentionedUser && note.mentionedUser !== 'all'
        ? `<span class="notebook-mention-badge">${Tf('notebook-to-user', { name: _nbEscapeHtml(note.mentionedUser) })}</span>`
        : (note.mentionedUser === 'all' ? `<span class="notebook-mention-badge">${T('notebook-to-everyone')}</span>` : '');
    const editedBadge = note.edited ? `<span class="notebook-edited-badge">(${T('notebook-edited-tag')})</span>` : '';
    const pinBadge = note.pinned ? `<span class="notebook-pin-badge">📌</span>` : '';

    const canEdit = note.author === user && (Date.now() - note.timestamp) < NOTE_EDIT_WINDOW_MS;
    const isEditing = _notebookEditingId === note.id;

    const feedback = _notebookPinFeedback[note.id];
    let feedbackHtml = '';
    if (feedback && feedback.expiresAt > Date.now()) {
        feedbackHtml = `<div class="notebook-feedback-caption">${T(feedback.pinned ? 'notebook-msg-pinned' : 'notebook-msg-unpinned')}</div>`;
    }

    let bodyHtml;
    if (isEditing) {
        bodyHtml = `
            <textarea id="notebook-edit-textarea-${note.id}" style="width:100%; margin:4px 0; font-size:14px; min-height:56px;">${_nbEscapeHtml(note.text)}</textarea>
            <div style="display:flex; gap:8px;">
                <button class="btn-success" style="width:auto; padding:6px 12px; font-size:12px;" onclick="event.stopPropagation(); saveNoteEdit('${note.id}')">${T('notebook-save-edit')}</button>
                <button style="width:auto; padding:6px 12px; font-size:12px; background:transparent; border:1px solid var(--border-color); color:white;" onclick="event.stopPropagation(); cancelNoteEdit()">${T('notebook-cancel-edit')}</button>
            </div>
        `;
    } else {
        bodyHtml = `<div class="notebook-bubble-text">${_nbEscapeHtml(note.text)}</div>`;
    }

    const editBtn = (canEdit && !isEditing)
        ? `<button style="width:auto; padding:2px 8px; font-size:10px; background:transparent; border:1px solid var(--border-color); color:var(--text-muted); border-radius:6px;" onclick="event.stopPropagation(); startNoteEdit('${note.id}')">${T('notebook-edit-btn')}</button>`
        : '';

    return `
        <div class="notebook-bubble${unread}${pinnedClass}" data-note-id="${note.id}" onclick="onNotebookNoteTap('${note.id}')">
            <div class="notebook-bubble-head">
                <span class="notebook-bubble-author">${_nbEscapeHtml(note.author)}</span>
                <span class="notebook-bubble-time">${_nbFormatTimestamp(note.timestamp)}</span>
            </div>
            ${bodyHtml}
            <div class="notebook-bubble-meta">
                ${pinBadge}${mentionBadge}${editedBadge}${editBtn}
            </div>
            ${feedbackHtml}
        </div>
    `;
}

// ── Tap / triple-tap detection (spec §4.1) ─────────────
function onNotebookNoteTap(id) {
    if (_notebookEditingId === id) return; // don't interfere while editing
    const note = notesData.find(n => n.id === id);
    if (!note) return;
    const user = _nbUser();
    const now = Date.now();

    // 1-tap read marking — idempotent after the first time.
    if (!note.readBy) note.readBy = [];
    if (!note.readBy.includes(user)) {
        note.readBy.push(user);
        _nbSaveNote(note);
        updateNotebookDotState();
    }

    // 3-tap-in-~1.5s pin toggle — independent tracking per note.
    let log = _notebookTapLog[id];
    if (!log || (now - log.firstTap) > NOTE_TRIPLE_TAP_WINDOW_MS) {
        log = { count: 0, firstTap: now };
    }
    log.count++;
    _notebookTapLog[id] = log;

    if (log.count >= 3) {
        _notebookTapLog[id] = null;
        toggleNotePin(note);
    }

    renderNotebookPanel();
    if (_nbIsAdminViewOpen()) renderNotebookAdminNotes();
}

function toggleNotePin(note) {
    const now = Date.now();
    if (!note.pinned) {
        note.pinned = true;
        note.pinnedAt = now;
        note.unpinnedAt = null;
        note.unpinnedWithGrace = false;
        _notebookPinFeedback[note.id] = { pinned: true, expiresAt: now + 3000 };
    } else {
        const ageAtUnpin = now - note.timestamp;
        note.pinned = false;
        note.unpinnedAt = now;
        note.unpinnedWithGrace = ageAtUnpin >= NOTE_LIFETIME_MS;
        _notebookPinFeedback[note.id] = { pinned: false, expiresAt: now + 3000 };
    }
    _nbSaveNote(note);

    // Auto-clear the transient feedback + re-render after it fades.
    setTimeout(() => {
        delete _notebookPinFeedback[note.id];
        if (_nbIsPanelOpen()) renderNotebookPanel();
    }, 3000);
}

// ── Editing (spec §4.3) ────────────────────────────────
function startNoteEdit(id) {
    const note = notesData.find(n => n.id === id);
    if (!note) return;
    if (note.author !== _nbUser() || (Date.now() - note.timestamp) >= NOTE_EDIT_WINDOW_MS) return;
    _notebookEditingId = id;
    renderNotebookPanel();
}

function cancelNoteEdit() {
    _notebookEditingId = null;
    renderNotebookPanel();
}

function saveNoteEdit(id) {
    const note = notesData.find(n => n.id === id);
    const textarea = document.getElementById('notebook-edit-textarea-' + id);
    if (!note || !textarea) { _notebookEditingId = null; return; }

    const newText = textarea.value.trim();
    if (newText) {
        note.text = newText;
        note.edited = true;
        note.editedAt = Date.now();
        _nbSaveNote(note);
    }
    _notebookEditingId = null;
    renderNotebookPanel();
}

// ── Mention picker + composer ──────────────────────────
function toggleMentionPicker() {
    _notebookMentionPickerOpen = !_notebookMentionPickerOpen;
    const picker = document.getElementById('notebook-mention-picker');
    if (!picker) return;
    if (_notebookMentionPickerOpen) {
        picker.innerHTML = _nbMentionPickerHtml();
        picker.style.display = 'block';
    } else {
        picker.style.display = 'none';
    }
}

function _nbMentionPickerHtml() {
    let html = `<div class="notebook-mention-picker-item" onclick="selectNotebookMention(null)">🌐 ${T('notebook-mention-everyone')}</div>`;
    notebookUsers.forEach(u => {
        html += `<div class="notebook-mention-picker-item" onclick="selectNotebookMention('${_nbEscapeHtml(u.name)}')">${u.role === 'admin' ? '⭐ ' : ''}${_nbEscapeHtml(u.name)}</div>`;
    });
    return html;
}

function selectNotebookMention(name) {
    _notebookPendingMention = name; // null = everyone
    _notebookMentionPickerOpen = false;
    const picker = document.getElementById('notebook-mention-picker');
    if (picker) picker.style.display = 'none';
    _nbRenderMentionChip();
}

function _nbRenderMentionChip() {
    const chip = document.getElementById('notebook-mention-chip');
    if (!chip) return;
    if (_notebookPendingMention) {
        chip.style.display = 'inline-flex';
        chip.innerHTML = `${Tf('notebook-to-user', { name: _nbEscapeHtml(_notebookPendingMention) })} <button onclick="selectNotebookMention(null); event.stopPropagation();">✕</button>`;
    } else {
        chip.style.display = 'none';
        chip.innerHTML = '';
    }
}

function sendNotebookMessage() {
    const input = document.getElementById('notebook-composer-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const user = _nbUser();
    const note = {
        id: _nbGenId(),
        author: user,
        text: text,
        timestamp: Date.now(),
        mentionedUser: _notebookPendingMention || null,
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

    input.value = '';
    _notebookPendingMention = null;
    _nbRenderMentionChip();
    renderNotebookPanel();
    updateNotebookDotState();
    if (_nbIsAdminViewOpen()) renderNotebookAdminNotes();

    const list = document.getElementById('notebook-messages-list');
    if (list) list.scrollTop = list.scrollHeight;
}

// ── Admin section: navigation ──────────────────────────
function openNotebookAdminView() {
    switchTab('none');
    document.getElementById('notebook-admin-view').style.display = 'block';

    const titleEl = document.getElementById('notebook-admin-title-el');
    if (titleEl) titleEl.innerText = T('notebook-admin-title');
    const backBtn = document.getElementById('btn-back-notebook');
    if (backBtn) backBtn.innerText = T('btn-back-notebook');
    const dirTitle = document.getElementById('notebook-directory-title-el');
    if (dirTitle) dirTitle.innerText = T('notebook-directory-title');
    const dirDesc = document.getElementById('notebook-directory-desc-el');
    if (dirDesc) dirDesc.innerText = T('notebook-directory-desc');
    const adminDesc = document.getElementById('notebook-admin-desc-el');
    if (adminDesc) adminDesc.innerText = T('notebook-admin-desc');
    const nameInput = document.getElementById('notebook-new-user-name');
    if (nameInput) nameInput.placeholder = T('ph-notebook-user-name');
    const addBtn = document.getElementById('notebook-directory-add-btn');
    if (addBtn) addBtn.innerText = T('notebook-directory-add');

    renderNotebookDirectory();
    renderNotebookAdminNotes();
}

// ── Admin section: notes management ────────────────────
function renderNotebookAdminNotes() {
    const container = document.getElementById('notebook-admin-notes-list');
    if (!container) return;

    const sorted = notesData.slice().sort((a, b) => b.timestamp - a.timestamp);
    if (sorted.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:13px; padding:16px 0;">${T('notebook-admin-empty')}</div>`;
        return;
    }

    container.innerHTML = sorted.map(note => {
        const mention = note.mentionedUser && note.mentionedUser !== 'all'
            ? Tf('notebook-to-user', { name: _nbEscapeHtml(note.mentionedUser) })
            : (note.mentionedUser === 'all' ? T('notebook-to-everyone') : '');
        const readCount = (note.readBy || []).length;
        return `
            <div class="notebook-admin-note-row">
                <div style="display:flex; justify-content:space-between; gap:10px;">
                    <strong style="color:var(--text-main); font-size:14px;">${_nbEscapeHtml(note.author)}</strong>
                    <span style="color:var(--text-muted); font-size:11px;">${_nbFormatTimestamp(note.timestamp)}</span>
                </div>
                <div style="color:var(--text-main); font-size:13px; margin:6px 0; white-space:pre-wrap; word-break:break-word;">${_nbEscapeHtml(note.text)}</div>
                <div style="color:var(--text-muted); font-size:11px;">${mention ? mention + ' • ' : ''}${readCount} read${note.pinned ? ' • 📌' : ''}${note.edited ? ' • ' + T('notebook-edited-tag') : ''}</div>
                <div class="notebook-admin-note-actions">
                    <button class="btn-blue" style="width:auto; padding:6px 10px; font-size:11px; border-radius:6px;" onclick="markNoteReadForAll('${note.id}')">${T('notebook-admin-mark-read')}</button>
                    <button style="width:auto; padding:6px 10px; font-size:11px; border-radius:6px; background:transparent; border:1px solid var(--warning); color:var(--warning);" onclick="toggleNotePinAdmin('${note.id}')">${note.pinned ? T('notebook-admin-unpin') : T('notebook-admin-pin')}</button>
                    <button class="btn-danger" style="width:auto; padding:6px 10px; font-size:11px; border-radius:6px;" onclick="deleteNoteForAll('${note.id}')">${T('notebook-admin-delete')}</button>
                </div>
            </div>
        `;
    }).join('');
}

function markNoteReadForAll(id) {
    const note = notesData.find(n => n.id === id);
    if (!note) return;
    note.readBy = notebookUsers.map(u => u.name);
    _nbSaveNote(note);
    renderNotebookAdminNotes();
    updateNotebookDotState();
    if (_nbIsPanelOpen()) renderNotebookPanel();
}

function toggleNotePinAdmin(id) {
    const note = notesData.find(n => n.id === id);
    if (!note) return;
    toggleNotePin(note);
    renderNotebookAdminNotes();
    if (_nbIsPanelOpen()) renderNotebookPanel();
}

function deleteNoteForAll(id) {
    showConfirm(T('cf-delete-note'), () => {
        db.notes.delete(id).catch(e => console.error(e));
        notesData = notesData.filter(n => n.id !== id);
        renderNotebookAdminNotes();
        updateNotebookDotState();
        if (_nbIsPanelOpen()) renderNotebookPanel();
    }, null);
}

// ── Admin section: Notebook User Directory ─────────────
function renderNotebookDirectory() {
    const container = document.getElementById('notebook-directory-list');
    if (!container) return;

    container.innerHTML = notebookUsers.map(u => `
        <div class="notebook-directory-row">
            <span>${_nbEscapeHtml(u.name)} <span style="color:var(--text-muted); font-size:11px;">(${u.role === 'admin' ? T('notebook-role-admin') : T('notebook-role-user')})</span></span>
            <button class="btn-danger" style="width:auto; padding:5px 10px; font-size:11px; border-radius:6px;" onclick="removeNotebookUser('${_nbEscapeHtml(u.name)}')">${T('notebook-directory-remove')}</button>
        </div>
    `).join('');
}

function addNotebookUser() {
    const nameInput = document.getElementById('notebook-new-user-name');
    const roleSelect = document.getElementById('notebook-new-user-role');
    if (!nameInput || !roleSelect) return;

    const name = nameInput.value.trim();
    const role = roleSelect.value === 'admin' ? 'admin' : 'user';
    if (!name) return customAlert(T('al-enter-name'), T('al-title-missing-field'));
    if (notebookUsers.some(u => u.name === name)) {
        return customAlert(T('al-enter-name'), T('al-title-missing-field'));
    }

    notebookUsers.push({ name, role });
    saveNotebookUsers();
    nameInput.value = '';
    renderNotebookDirectory();
    updateNotebookDotState();
}

function removeNotebookUser(name) {
    showConfirm(T('cf-remove-notebook-user'), () => {
        notebookUsers = notebookUsers.filter(u => u.name !== name);
        saveNotebookUsers();
        renderNotebookDirectory();
        updateNotebookDotState();
    }, null);
}

// ── Wiring into existing app lifecycle ─────────────────
// showApp() (03_ui_core.js) is already wrapped once by 14_language.js;
// wrap it again here (loading after) to boot the notebook once the app
// becomes visible and the current user is known.
(function () {
    const _origShowApp = window.showApp;
    if (typeof _origShowApp === 'function') {
        window.showApp = function () {
            _origShowApp.apply(this, arguments);
            updateNotebookDotState();
            _startNotebookCleanupSweep();
        };
    }

    // Make sure a language toggle redraws any currently-open notebook UI
    // immediately, per the master doc's "new dynamic-list renderers" rule.
    const _origRefresh = window.refreshDynamicContentForLanguage;
    if (typeof _origRefresh === 'function') {
        window.refreshDynamicContentForLanguage = function () {
            _origRefresh.apply(this, arguments);
            if (_nbIsPanelOpen()) renderNotebookPanel();
            if (_nbIsAdminViewOpen()) {
                const titleEl = document.getElementById('notebook-admin-title-el');
                if (titleEl) titleEl.innerText = T('notebook-admin-title');
                renderNotebookDirectory();
                renderNotebookAdminNotes();
            }
        };
    }
})();