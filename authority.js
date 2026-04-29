// ─────────────────────────────────────────────
// BAUET Help Desk — authority.js
// Read-only oversight dashboard for Authority role
// ─────────────────────────────────────────────

var currentProfile  = null;
var allTickets      = [];
var activeTicketId  = null;
var allFilter       = { type: 'status', value: 'all' };

// ── INIT ──────────────────────────────────────
(async function init() {
    var auth = await requireAuth(['authority', 'admin']);
    if (!auth) return;

    currentProfile = auth.profile;

    var initials = currentProfile.full_name
        .split(' ')
        .map(function(w) { return w[0]; })
        .join('')
        .slice(0, 2)
        .toUpperCase();

    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-name').textContent   = currentProfile.full_name;
    document.getElementById('welcome-title').textContent =
        'Welcome, ' + currentProfile.full_name.split(' ')[0];

    await Promise.all([
        loadTickets(),
        loadNotices()
    ]);

    loadProfile();
    setLang(currentLang);
})();

// ── NAVIGATION ────────────────────────────────
var sectionTitles = {
    overview:   { en: 'Overview',              bn: 'সারসংক্ষেপ' },
    tickets:    { en: 'All Tickets',           bn: 'সব টিকেট' },
    unresolved: { en: 'Open / Unresolved',     bn: 'খোলা / অমীমাংসিত' },
    notices:    { en: 'Notices',               bn: 'নোটিশ' },
    profile:    { en: 'My Profile',            bn: 'আমার প্রোফাইল' }
};

function showSection(name, navEl) {
    document.querySelectorAll('.page-section').forEach(function(s) {
        s.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(function(n) {
        n.classList.remove('active');
    });

    document.getElementById('section-' + name).classList.add('active');
    if (navEl) navEl.classList.add('active');

    var t = sectionTitles[name] || { en: name, bn: name };
    document.getElementById('header-title').innerHTML =
        '<span class="en-text">' + t.en + '</span>' +
        '<span class="bn-text" style="display:' + (currentLang === 'bn' ? '' : 'none') + '">' + t.bn + '</span>';

    closeSidebar();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar()   { document.getElementById('sidebar').classList.remove('open'); }

// ── LOAD ALL TICKETS ──────────────────────────
async function loadTickets() {
    var result = await sb
        .from('tickets')
        .select('*, categories(name_en, name_bn), profiles!tickets_student_id_fkey(full_name)')
        .order('created_at', { ascending: false });

    if (result.error) {
        showToast('Error', result.error.message, 'error');
        return;
    }

    allTickets = result.data || [];

    buildStats();
    buildCategoryBreakdown();
    buildStatusBreakdown();
    renderRecentActivity();
    renderAllTickets();
    renderUnresolved();
}

// ── BUILD STAT CARDS ──────────────────────────
function buildStats() {
    var total    = allTickets.length;
    var open     = allTickets.filter(function(t) { return t.status === 'open'; }).length;
    var progress = allTickets.filter(function(t) { return t.status === 'in_progress'; }).length;

    var now = new Date();
    var thisMonth = allTickets.filter(function(t) {
        var d = new Date(t.created_at);
        return t.status === 'resolved' &&
               d.getMonth() === now.getMonth() &&
               d.getFullYear() === now.getFullYear();
    }).length;

    document.getElementById('stat-total').textContent    = total;
    document.getElementById('stat-open').textContent     = open;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-month').textContent    = thisMonth;
}

// ── CATEGORY BREAKDOWN ────────────────────────
function buildCategoryBreakdown() {
    var el = document.getElementById('category-breakdown');

    // Group by category
    var cats = {};
    allTickets.forEach(function(t) {
        var name = t.categories ? t.categories.name_en : 'Uncategorised';
        if (!cats[name]) cats[name] = { total: 0, open: 0, resolved: 0 };
        cats[name].total++;
        if (t.status === 'open' || t.status === 'in_progress') cats[name].open++;
        if (t.status === 'resolved' || t.status === 'closed')  cats[name].resolved++;
    });

    var keys = Object.keys(cats);
    if (keys.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📂</div><div class="empty-title">No data yet</div></div>';
        return;
    }

    var rows = keys.map(function(name) {
        var c = cats[name];
        return '<tr>' +
            '<td style="font-size:0.88rem;color:var(--cream)">' + esc(name) + '</td>' +
            '<td style="text-align:center;font-family:Cinzel,serif;font-size:0.85rem;color:var(--gold)">' + c.total + '</td>' +
            '<td style="text-align:center">' + c.open + '</td>' +
            '<td style="text-align:center;color:var(--success)">' + c.resolved + '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table">' +
        '<thead><tr>' +
        '<th>Category</th>' +
        '<th style="text-align:center">Total</th>' +
        '<th style="text-align:center">Open</th>' +
        '<th style="text-align:center">Resolved</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '</table>';
}

// ── STATUS BREAKDOWN ──────────────────────────
function buildStatusBreakdown() {
    var el = document.getElementById('status-breakdown');
    var total = allTickets.length;

    if (total === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No data yet</div></div>';
        return;
    }

    var statuses = [
        { key: 'open',        label: 'Open',        labelBn: 'খোলা',         color: 'var(--info)' },
        { key: 'in_progress', label: 'In Progress',  labelBn: 'চলমান',        color: 'var(--warning)' },
        { key: 'resolved',    label: 'Resolved',     labelBn: 'সমাধান হয়েছে', color: 'var(--success)' },
        { key: 'closed',      label: 'Closed',       labelBn: 'বন্ধ',          color: '#666' }
    ];

    var html = '<div style="padding:16px 24px">';
    statuses.forEach(function(s) {
        var count = allTickets.filter(function(t) { return t.status === s.key; }).length;
        var pct   = Math.round((count / total) * 100);
        html +=
            '<div style="margin-bottom:18px">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">' +
            '<span style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:1px;color:var(--cream-dim)">' +
            '<span class="en-text">' + s.label + '</span>' +
            '<span class="bn-text" style="display:none">' + s.labelBn + '</span>' +
            '</span>' +
            '<span style="font-family:Cinzel,serif;font-size:0.75rem;color:' + s.color + '">' +
            count + ' <span style="color:var(--cream-faint);font-size:0.65rem">(' + pct + '%)</span>' +
            '</span></div>' +
            '<div style="height:6px;background:rgba(200,168,75,0.08);border-radius:3px">' +
            '<div style="height:100%;width:' + pct + '%;background:' + s.color + ';border-radius:3px;transition:width 0.6s ease"></div>' +
            '</div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
    setLang(currentLang);
}

// ── RECENT ACTIVITY (last 10) ─────────────────
function renderRecentActivity() {
    var el     = document.getElementById('recent-body');
    var recent = allTickets.slice(0, 10);

    if (recent.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-title">No tickets yet</div></div>';
        return;
    }

    var rows = recent.map(function(t) {
        var cat     = t.categories ? t.categories.name_en : '—';
        var student = t.profiles   ? t.profiles.full_name  : '—';
        return '<tr onclick="openModal(\'' + t.id + '\')" style="cursor:pointer">' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell"><div class="ticket-title-main">' + esc(t.title) + '</div></td>' +
            '<td style="font-size:0.85rem">' + esc(student) + '</td>' +
            '<td>' + esc(cat) + '</td>' +
            '<td>' + priorityBadge(t.priority) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table">' +
        '<thead><tr>' +
        '<th>Ticket No</th><th>Title</th><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';

    setLang(currentLang);
}

// ── ALL TICKETS ───────────────────────────────
function filterAllTickets(type, value, btn) {
    allFilter = { type: type, value: value };

    // Only deactivate buttons in the same group (status vs priority)
    var toolbar = document.querySelector('#section-tickets .toolbar');
    if (type === 'status') {
        // deactivate all status filters, keep priority filter state
        toolbar.querySelectorAll('.toolbar-filter').forEach(function(b, i) {
            if (i <= 4) b.classList.remove('active'); // first 5 are status
        });
    } else {
        toolbar.querySelectorAll('.toolbar-filter').forEach(function(b, i) {
            if (i > 4) b.classList.remove('active'); // last 2 are priority
        });
    }
    btn.classList.add('active');
    renderAllTickets();
}

function renderAllTickets() {
    var el = document.getElementById('all-tickets-body');
    var filtered = allTickets;

    if (allFilter.type === 'status' && allFilter.value !== 'all') {
        filtered = allTickets.filter(function(t) { return t.status === allFilter.value; });
    } else if (allFilter.type === 'priority') {
        filtered = allTickets.filter(function(t) { return t.priority === allFilter.value; });
    }

    renderTicketTable(filtered, el);
}

// ── OPEN / UNRESOLVED ─────────────────────────
function renderUnresolved() {
    var el = document.getElementById('unresolved-body');

    var unresolved = allTickets
        .filter(function(t) { return t.status === 'open' || t.status === 'in_progress'; })
        .sort(function(a, b) { return new Date(a.created_at) - new Date(b.created_at); }); // oldest first

    if (unresolved.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div>' +
            '<div class="empty-title"><span class="en-text">All clear</span><span class="bn-text">সব ঠিক আছে</span></div>' +
            '<div class="empty-msg"><span class="en-text">No open or unresolved tickets.</span><span class="bn-text">কোনো খোলা বা অমীমাংসিত টিকেট নেই।</span></div></div>';
        return;
    }

    var now  = new Date();
    var rows = unresolved.map(function(t) {
        var cat      = t.categories ? t.categories.name_en : '—';
        var student  = t.profiles   ? t.profiles.full_name  : '—';
        var daysOpen = Math.floor((now - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
        var isUrgent = t.priority === 'urgent';

        var urgentStyle = isUrgent
            ? 'border-left:3px solid var(--error);background:rgba(216,80,80,0.03)'
            : '';

        return '<tr onclick="openModal(\'' + t.id + '\')" style="cursor:pointer;' + urgentStyle + '">' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell">' +
            '<div class="ticket-title-main">' + esc(t.title) + '</div>' +
            '<div class="ticket-category">' + esc(cat) + '</div>' +
            '</td>' +
            '<td style="font-size:0.85rem">' + esc(student) + '</td>' +
            '<td>' + priorityBadge(t.priority) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' +
            '<span style="font-family:Cinzel,serif;font-size:0.75rem;color:' +
            (daysOpen > 3 ? 'var(--error)' : daysOpen > 1 ? 'var(--warning)' : 'var(--success)') + '">' +
            daysOpen + ' day' + (daysOpen !== 1 ? 's' : '') +
            '</span></td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table">' +
        '<thead><tr>' +
        '<th>Ticket No</th><th>Title</th><th>Student</th><th>Priority</th><th>Status</th><th>Days Open</th><th>Submitted</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';

    setLang(currentLang);
}

// ── GENERIC TICKET TABLE ──────────────────────
function renderTicketTable(tickets, el) {
    if (!tickets || tickets.length === 0) {
        el.innerHTML = '<div class="empty-state">' +
            '<div class="empty-icon">🎫</div>' +
            '<div class="empty-title"><span class="en-text">No tickets found</span><span class="bn-text">কোনো টিকেট পাওয়া যায়নি</span></div>' +
            '</div>';
        return;
    }

    var rows = tickets.map(function(t) {
        var cat     = t.categories ? t.categories.name_en : '—';
        var student = t.profiles   ? t.profiles.full_name  : '—';
        return '<tr onclick="openModal(\'' + t.id + '\')" style="cursor:pointer">' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell">' +
            '<div class="ticket-title-main">' + esc(t.title) + '</div>' +
            '</td>' +
            '<td style="font-size:0.85rem">' + esc(student) + '</td>' +
            '<td>' + esc(cat) + '</td>' +
            '<td>' + priorityBadge(t.priority) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table">' +
        '<thead><tr>' +
        '<th>Ticket No</th><th>Title</th><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';

    setLang(currentLang);
}

// ── TICKET DETAIL MODAL (read-only) ───────────
async function openModal(ticketId) {
    activeTicketId = ticketId;
    var ticket = allTickets.find(function(t) { return t.id === ticketId; });
    if (!ticket) return;

    var cat     = ticket.categories ? ticket.categories.name_en : '—';
    var student = ticket.profiles   ? ticket.profiles.full_name  : '—';

    document.getElementById('modal-ticket-no').textContent = ticket.ticket_no || 'Ticket';
    document.getElementById('modal-meta').textContent      =
        'Submitted by ' + student + ' · ' + fmtDateTime(ticket.created_at);
    document.getElementById('modal-title').textContent = ticket.title;
    document.getElementById('modal-desc').textContent  = ticket.description;
    document.getElementById('modal-badges').innerHTML  =
        statusBadge(ticket.status) + ' ' + priorityBadge(ticket.priority) +
        ' <span class="badge" style="background:var(--gold-faint);color:var(--gold);border:1px solid rgba(200,168,75,0.2)">' +
        esc(cat) + '</span>';

    document.getElementById('ticket-modal').classList.add('open');
    document.getElementById('thread-wrap').innerHTML =
        '<div class="spinner-wrap"><div class="spinner"></div></div>';

    setLang(currentLang);
    await loadThread(ticketId);
}

function closeModal() {
    document.getElementById('ticket-modal').classList.remove('open');
    activeTicketId = null;
}

// Close on backdrop click
document.getElementById('ticket-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

async function loadThread(ticketId) {
    var result = await sb
        .from('ticket_replies')
        .select('*, profiles(full_name, role)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    var wrap = document.getElementById('thread-wrap');

    if (!result.data || result.data.length === 0) {
        wrap.innerHTML =
            '<div class="empty-state" style="padding:24px 0">' +
            '<div class="empty-icon">💬</div>' +
            '<div class="empty-title" style="font-size:0.75rem">No replies yet</div>' +
            '</div>';
        return;
    }

    wrap.innerHTML = result.data.map(function(r) {
        var isOfficer  = r.profiles && (r.profiles.role === 'officer' || r.profiles.role === 'admin');
        var cls        = isOfficer ? 'reply-officer' : '';
        var authorName = r.profiles ? r.profiles.full_name : 'Unknown';
        var roleTxt    = isOfficer ? ' · Officer' : ' · Student';
        return '<div class="reply-bubble ' + cls + '">' +
            '<div class="reply-meta">' +
            '<span class="reply-author">' + esc(authorName) + roleTxt + '</span>' +
            '<span class="reply-time">' + fmtDateTime(r.created_at) + '</span>' +
            '</div>' +
            '<div class="reply-text">' + esc(r.message).replace(/\n/g, '<br>') + '</div>' +
            '</div>';
    }).join('');
}

// ── NOTICES ───────────────────────────────────
async function loadNotices() {
    var result = await sb
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

    var el = document.getElementById('notices-body');

    if (result.error || !result.data || result.data.length === 0) {
        el.innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-icon">📢</div>' +
            '<div class="empty-title">No notices</div>' +
            '<div class="empty-msg">No official notices at this time.</div>' +
            '</div>';
        return;
    }

    el.innerHTML = result.data.map(function(n) {
        var pinBadge = n.is_pinned
            ? ' <span class="badge badge-urgent" style="margin-left:8px;font-size:0.52rem">📌 Pinned</span>'
            : '';
        return '<div class="card" style="margin-bottom:14px">' +
            '<div class="card-header">' +
            '<div>' +
            '<div class="card-title">' + esc(n.title_en) + pinBadge + '</div>' +
            '<div style="font-size:0.72rem;color:var(--cream-faint);margin-top:3px">' +
            fmtDate(n.published_at) + '</div>' +
            '</div></div>' +
            '<div class="card-body" style="padding:16px 24px;font-size:0.93rem;color:var(--cream-dim);line-height:1.7">' +
            esc(n.body_en) +
            '</div></div>';
    }).join('');
}

// ── PROFILE ───────────────────────────────────
function loadProfile() {
    var p   = currentProfile;
    var el  = document.getElementById('profile-card');
    var ini = p.full_name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();

    el.innerHTML =
        '<div class="card-body">' +
        '<div style="display:flex;align-items:center;gap:20px;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--green-border)">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:var(--green-mid);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:Cinzel,serif;font-size:1.4rem;color:var(--gold);font-weight:700;flex-shrink:0">' +
        ini + '</div>' +
        '<div>' +
        '<div style="font-family:Cinzel,serif;font-size:1.05rem;color:var(--cream)">' + esc(p.full_name) + '</div>' +
        '<div style="font-size:0.8rem;color:var(--gold-dim);margin-top:3px">' + esc(p.email) + '</div>' +
        '<div style="margin-top:8px"><span class="badge badge-progress">Authority</span></div>' +
        '</div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">' +
        pField('Student / Staff ID', p.student_id || '—') +
        pField('Email', p.email) +
        pField('Department', p.department || '—') +
        pField('Phone', p.phone || '—') +
        pField('Member Since', fmtDate(p.created_at)) +
        pField('Account Status', p.is_active ? 'Active' : 'Inactive') +
        '</div></div>';
}

function pField(label, value) {
    return '<div style="padding:13px;background:rgba(27,50,16,0.4);border:1px solid var(--green-border)">' +
        '<div style="font-family:Cinzel,serif;font-size:0.57rem;letter-spacing:2px;color:var(--gold-dim);text-transform:uppercase;margin-bottom:5px">' + label + '</div>' +
        '<div style="font-size:0.9rem;color:var(--cream)">' + esc(value) + '</div>' +
        '</div>';
}
