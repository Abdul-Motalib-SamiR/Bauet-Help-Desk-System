// ─────────────────────────────────────────────
// BAUET Help Desk — utils.js
// Shared utilities for all dashboard pages
// ─────────────────────────────────────────────

const { createClient } = supabase;
const SUPABASE_URL  = 'https://ftqivgvszdihqyjgwsns.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cWl2Z3ZzemRpaHF5amd3c25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzA1NTcsImV4cCI6MjA4NzY0NjU1N30.u-djLiFv9g8zA0F1WlBXs0T30fuSWUCQLJb_dS3csaM';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Language ──────────────────────────────────
var currentLang = localStorage.getItem('bauet-lang') || 'en';

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('bauet-lang', lang);
    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        var txt = btn.textContent.trim();
        btn.classList.toggle('active',
            (lang === 'en' && txt === 'EN') || (lang === 'bn' && txt === 'বাং')
        );
    });
    document.querySelectorAll('.en-text').forEach(function(el) { el.style.display = lang === 'en' ? '' : 'none'; });
    document.querySelectorAll('.bn-text').forEach(function(el) { el.style.display = lang === 'bn' ? '' : 'none'; });
}

// ── Toast ─────────────────────────────────────
var _toastTimer;
function showToast(title, msg, type) {
    type = type || 'default';
    var t = document.getElementById('toast');
    if (!t) return;
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent   = msg;
    t.className = 'toast show toast-' + type;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() { t.classList.remove('show'); }, 5000);
}

// ── Auth guard ────────────────────────────────
async function requireAuth(allowedRoles) {
    var session = await sb.auth.getSession();
    if (!session.data || !session.data.session) {
        window.location.href = 'auth.html';
        return null;
    }
    var user = session.data.session.user;
    var result = await sb.from('profiles').select('*').eq('id', user.id).single();
    if (result.error || !result.data) {
        window.location.href = 'auth.html';
        return null;
    }
    var profile = result.data;
    if (allowedRoles && !allowedRoles.includes(profile.role)) {
        // Wrong dashboard for this role — redirect to correct one
        var map = { student: 'student-dashboard.html', officer: 'officer-dashboard.html', authority: 'authority-dashboard.html', admin: 'admin-panel.html' };
        window.location.href = map[profile.role] || 'auth.html';
        return null;
    }
    return { user: user, profile: profile };
}

// ── Logout ────────────────────────────────────
async function logout() {
    await sb.auth.signOut();
    window.location.href = 'auth.html';
}

// ── Status badge html ─────────────────────────
function statusBadge(status) {
    var map = {
        open:        { label: 'Open',        labelBn: 'খোলা',        cls: 'badge-open' },
        in_progress: { label: 'In Progress', labelBn: 'চলমান',       cls: 'badge-progress' },
        resolved:    { label: 'Resolved',    labelBn: 'সমাধান হয়েছে', cls: 'badge-resolved' },
        closed:      { label: 'Closed',      labelBn: 'বন্ধ',         cls: 'badge-closed' }
    };
    var s = map[status] || { label: status, labelBn: status, cls: '' };
    return '<span class="badge ' + s.cls + '"><span class="en-text">' + s.label + '</span><span class="bn-text" style="display:none">' + s.labelBn + '</span></span>';
}

// ── Priority badge html ───────────────────────
function priorityBadge(priority) {
    var map = {
        low:    { label: 'Low',    labelBn: 'কম',      cls: 'badge-low' },
        normal: { label: 'Normal', labelBn: 'স্বাভাবিক', cls: 'badge-normal' },
        high:   { label: 'High',   labelBn: 'উচ্চ',     cls: 'badge-high' },
        urgent: { label: 'Urgent', labelBn: 'জরুরি',   cls: 'badge-urgent' }
    };
    var p = map[priority] || { label: priority, labelBn: priority, cls: '' };
    return '<span class="badge ' + p.cls + '"><span class="en-text">' + p.label + '</span><span class="bn-text" style="display:none">' + p.labelBn + '</span></span>';
}

// ── Format date ───────────────────────────────
function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Format datetime ───────────────────────────
function fmtDateTime(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

// ── Escape HTML ───────────────────────────────
function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ── Role display name ─────────────────────────
function roleLabel(role, lang) {
    var map = {
        student:   { en: 'Student',   bn: 'শিক্ষার্থী' },
        officer:   { en: 'Officer',   bn: 'অফিসার' },
        authority: { en: 'Authority', bn: 'কর্তৃপক্ষ' },
        admin:     { en: 'Admin',     bn: 'অ্যাডমিন' }
    };
    var l = lang || currentLang;
    return (map[role] && map[role][l]) ? map[role][l] : role;
}
