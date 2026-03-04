// ─────────────────────────────────────────────
// BAUET Help Desk — officer.js
// ─────────────────────────────────────────────

var currentProfile = null;
var allTickets     = [];
var queueFilter    = 'all';
var activeTicket   = null;

// ── INIT ──────────────────────────────────────
(async function init() {
    var auth = await requireAuth(['officer', 'admin']);
    if (!auth) return;

    currentProfile = auth.profile;

    var ini = currentProfile.full_name.split(' ').map(function(w) { return w[0]; }).join('').slice(0,2).toUpperCase();
    document.getElementById('user-avatar').textContent = ini;
    document.getElementById('user-name').textContent   = currentProfile.full_name;
    document.getElementById('officer-welcome').textContent = 'Welcome, ' + currentProfile.full_name.split(' ')[0];

    await loadAllTickets();
    setLang(currentLang);
})();

// ── NAVIGATION ────────────────────────────────
var sectionTitles = {
    overview: { en: 'Overview',        bn: 'সারসংক্ষেপ' },
    queue:    { en: 'Ticket Queue',    bn: 'টিকেট কিউ' },
    mine:     { en: 'Assigned to Me',  bn: 'আমার নির্ধারিত' },
    notice:   { en: 'Post Notice',     bn: 'নোটিশ পোস্ট' }
};

function showSection(name, navEl) {
    document.querySelectorAll('.page-section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.getElementById('section-' + name).classList.add('active');
    if (navEl) navEl.classList.add('active');
    var t = sectionTitles[name] || { en: name, bn: name };
    document.getElementById('header-title').innerHTML = '<span class="en-text">' + t.en + '</span><span class="bn-text" style="display:' + (currentLang === 'bn' ? '' : 'none') + '">' + t.bn + '</span>';
    closeSidebar();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar()   { document.getElementById('sidebar').classList.remove('open'); }

// ── LOAD TICKETS ──────────────────────────────
async function loadAllTickets() {
    var result = await sb
        .from('tickets')
        .select('*, categories(name_en), profiles!tickets_student_id_fkey(full_name, student_id)')
        .order('created_at', { ascending: false });

    if (result.error) {
        showToast('Error', result.error.message, 'error');
        return;
    }

    allTickets = result.data || [];

    var open     = allTickets.filter(function(t) { return t.status === 'open'; }).length;
    var progress = allTickets.filter(function(t) { return t.status === 'in_progress'; }).length;
    var resolved = allTickets.filter(function(t) { return t.status === 'resolved'; }).length;
    var mine     = allTickets.filter(function(t) { return t.officer_id === currentProfile.id; }).length;

    document.getElementById('stat-open').textContent     = open;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-resolved').textContent = resolved;
    document.getElementById('stat-mine').textContent     = mine;

    var queueCount = open + progress;
    var badge = document.getElementById('queue-count');
    if (queueCount > 0) { badge.textContent = queueCount; badge.style.display = ''; }
    else { badge.style.display = 'none'; }

    renderOverview();
    renderQueue(allTickets);
    renderMine();
}

// ── RENDER OVERVIEW ───────────────────────────
function renderOverview() {
    var urgent = allTickets.filter(function(t) {
        return (t.status === 'open' || t.status === 'in_progress') && (t.priority === 'urgent' || t.priority === 'high');
    });
    var pending = allTickets.filter(function(t) { return t.status === 'open'; }).slice(0, 8);
    var show = urgent.length > 0 ? urgent.slice(0, 8) : pending;

    renderTicketTable(show, 'overview-tickets-body');
}

// ── RENDER QUEUE ──────────────────────────────
function renderQueue(tickets) {
    renderTicketTable(tickets, 'queue-body', true);
}

// ── RENDER MINE ───────────────────────────────
function renderMine() {
    var mine = allTickets.filter(function(t) { return t.officer_id === currentProfile.id; });
    renderTicketTable(mine, 'mine-body');
}

// ── FILTER QUEUE ──────────────────────────────
function filterQueue(filter, btn) {
    document.querySelectorAll('.toolbar-filter').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    var filtered;
    if (filter === 'all')         filtered = allTickets;
    else if (filter === 'open')   filtered = allTickets.filter(function(t) { return t.status === 'open'; });
    else if (filter === 'in_progress') filtered = allTickets.filter(function(t) { return t.status === 'in_progress'; });
    else if (filter === 'high')   filtered = allTickets.filter(function(t) { return t.priority === 'high'; });
    else if (filter === 'urgent') filtered = allTickets.filter(function(t) { return t.priority === 'urgent'; });
    else filtered = allTickets;

    renderQueue(filtered);
}

// ── RENDER TICKET TABLE ───────────────────────
function renderTicketTable(tickets, containerId, showStudent) {
    var el = document.getElementById(containerId);

    if (!tickets || tickets.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div>' +
            '<div class="empty-title">All clear</div>' +
            '<div class="empty-msg">No tickets in this view.</div></div>';
        return;
    }

    var cols = '<th>Ticket No</th><th>Title</th>';
    if (showStudent) cols += '<th>Student</th>';
    cols += '<th>Category</th><th>Priority</th><th>Status</th><th>Date</th>';

    var rows = tickets.map(function(t) {
        var cat     = t.categories ? t.categories.name_en : '—';
        var student = t.profiles   ? t.profiles.full_name  : '—';
        var row = '<tr onclick="openTicketModal(\'' + t.id + '\')">' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell"><div class="ticket-title-main">' + esc(t.title) + '</div></td>';
        if (showStudent) row += '<td style="font-size:0.85rem">' + esc(student) + '</td>';
        row += '<td>' + esc(cat) + '</td>' +
            '<td>' + priorityBadge(t.priority) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
        return row;
    }).join('');

    el.innerHTML = '<table class="data-table"><thead><tr>' + cols + '</tr></thead><tbody>' + rows + '</tbody></table>';
    setLang(currentLang);
}

// ── TICKET MODAL ──────────────────────────────
async function openTicketModal(ticketId) {
    activeTicket = allTickets.find(function(t) { return t.id === ticketId; });
    if (!activeTicket) return;

    var t = activeTicket;
    var cat = t.categories ? t.categories.name_en : '—';
    var studentName = t.profiles ? t.profiles.full_name : 'Unknown';

    document.getElementById('modal-ticket-no').textContent   = (t.ticket_no || 'Ticket') + ' — ' + esc(t.title);
    document.getElementById('modal-student-name').textContent = 'Submitted by: ' + studentName + ' · ' + fmtDateTime(t.created_at);
    document.getElementById('modal-title').textContent       = t.title;
    document.getElementById('modal-desc').textContent        = t.description;
    document.getElementById('modal-badges').innerHTML        =
        statusBadge(t.status) + ' ' + priorityBadge(t.priority) +
        ' <span class="badge" style="background:var(--gold-faint);color:var(--gold);border:1px solid rgba(200,168,75,0.2)">' + esc(cat) + '</span>';

    document.getElementById('status-select').value = t.status;

    var isAssignedToMe = t.officer_id === currentProfile.id;
    var assignBtn = document.getElementById('assign-btn');
    assignBtn.style.display = isAssignedToMe ? 'none' : '';

    document.getElementById('ticket-modal').classList.add('open');
    document.getElementById('thread-wrap').innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

    await loadThread(ticketId);
    setLang(currentLang);
}

function closeModal() {
    document.getElementById('ticket-modal').classList.remove('open');
    activeTicket = null;
}

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
        wrap.innerHTML = '<div class="empty-state" style="padding:24px 0"><div class="empty-icon">💬</div><div class="empty-title" style="font-size:0.75rem">No replies yet</div></div>';
        return;
    }

    wrap.innerHTML = result.data.map(function(r) {
        var isOfficer = r.profiles && (r.profiles.role === 'officer' || r.profiles.role === 'admin');
        var isMe      = r.author_id === currentProfile.id;
        var cls       = isMe ? 'reply-mine' : (isOfficer ? 'reply-officer' : '');
        var authorName = r.profiles ? r.profiles.full_name : 'Unknown';
        var roleTxt    = isMe ? ' (You)' : (isOfficer ? ' · Officer' : ' · Student');
        return '<div class="reply-bubble ' + cls + '">' +
            '<div class="reply-meta"><span class="reply-author">' + esc(authorName) + roleTxt + '</span>' +
            '<span class="reply-time">' + fmtDateTime(r.created_at) + '</span></div>' +
            '<div class="reply-text">' + esc(r.message).replace(/\n/g, '<br>') + '</div></div>';
    }).join('');
}

async function sendReply() {
    var msg = document.getElementById('reply-input').value.trim();
    if (!msg || !activeTicket) return;

    var btn = document.querySelector('#ticket-modal .modal-body .btn-gold');
    btn.disabled = true;

    // Auto-assign to this officer if not yet assigned
    if (!activeTicket.officer_id) {
        await sb.from('tickets').update({ officer_id: currentProfile.id, status: 'in_progress' }).eq('id', activeTicket.id);
    }

    var result = await sb.from('ticket_replies').insert({
        ticket_id: activeTicket.id,
        author_id: currentProfile.id,
        message:   msg
    });

    if (result.error) {
        showToast('Error', result.error.message, 'error');
    } else {
        document.getElementById('reply-input').value = '';
        showToast('Reply Sent', 'Your reply has been sent to the student.', 'success');
        await loadThread(activeTicket.id);
        await loadAllTickets();
    }

    btn.disabled = false;
}

async function updateTicketStatus() {
    if (!activeTicket) return;
    var newStatus = document.getElementById('status-select').value;

    var update = { status: newStatus };
    if (newStatus === 'resolved') update.resolved_at = new Date().toISOString();

    var result = await sb.from('tickets').update(update).eq('id', activeTicket.id);

    if (result.error) {
        showToast('Error', result.error.message, 'error');
    } else {
        showToast('Updated', 'Ticket status changed to ' + newStatus + '.', 'success');
        activeTicket.status = newStatus;
        document.getElementById('modal-badges').innerHTML = statusBadge(newStatus) + ' ' + priorityBadge(activeTicket.priority);
        await loadAllTickets();
    }
}

async function assignToMe() {
    if (!activeTicket) return;
    var result = await sb.from('tickets').update({ officer_id: currentProfile.id, status: 'in_progress' }).eq('id', activeTicket.id);

    if (result.error) {
        showToast('Error', result.error.message, 'error');
    } else {
        showToast('Assigned', 'Ticket assigned to you.', 'success');
        document.getElementById('assign-btn').style.display = 'none';
        activeTicket.officer_id = currentProfile.id;
        await loadAllTickets();
    }
}

// ── POST NOTICE ───────────────────────────────
async function handlePostNotice(e) {
    e.preventDefault();
    var btn = document.getElementById('notice-btn');
    btn.disabled = true;
    btn.textContent = '...';

    var result = await sb.from('notices').insert({
        title_en:  document.getElementById('n-title-en').value.trim(),
        title_bn:  document.getElementById('n-title-bn').value.trim() || null,
        body_en:   document.getElementById('n-body-en').value.trim(),
        body_bn:   document.getElementById('n-body-bn').value.trim() || null,
        author_id: currentProfile.id,
        is_pinned: document.getElementById('n-pinned').checked,
        is_active: true
    });

    if (result.error) {
        showToast('Error', result.error.message, 'error');
    } else {
        showToast('Published', 'Notice published successfully.', 'success');
        document.getElementById('notice-form').reset();
    }

    btn.disabled = false;
    btn.innerHTML = '<span class="en-text">Publish Notice</span><span class="bn-text">নোটিশ প্রকাশ করুন</span>';
    setLang(currentLang);
}
