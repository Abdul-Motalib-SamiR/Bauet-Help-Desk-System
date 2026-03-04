// ─────────────────────────────────────────────
// BAUET Help Desk — student.js
// ─────────────────────────────────────────────

var currentProfile  = null;
var allTickets      = [];
var currentFilter   = 'all';
var activeTicketId  = null;
var categoriesCache = [];

// ── INIT ──────────────────────────────────────
(async function init() {
    var auth = await requireAuth(['student']);
    if (!auth) return;

    currentProfile = auth.profile;

    // Populate UI with user info
    var initials = currentProfile.full_name.split(' ').map(function(w) { return w[0]; }).join('').slice(0,2).toUpperCase();
    document.getElementById('user-avatar').textContent = initials;
    document.getElementById('user-name').textContent   = currentProfile.full_name;
    document.getElementById('welcome-name').textContent = currentProfile.full_name.split(' ')[0];

    await Promise.all([
        loadCategories(),
        loadTickets(),
        loadNotices()
    ]);

    loadProfile();
    setLang(currentLang);
})();

// ── NAVIGATION ────────────────────────────────
var sectionTitles = {
    overview: { en: 'Overview',       bn: 'সারসংক্ষেপ' },
    submit:   { en: 'Submit Ticket',  bn: 'টিকেট জমা দিন' },
    tickets:  { en: 'My Tickets',     bn: 'আমার টিকেট' },
    notices:  { en: 'Notices',        bn: 'নোটিশ' },
    profile:  { en: 'My Profile',     bn: 'আমার প্রোফাইল' }
};

function showSection(name, navEl) {
    document.querySelectorAll('.page-section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.getElementById('section-' + name).classList.add('active');
    if (navEl) navEl.classList.add('active');
    var titles = sectionTitles[name] || { en: name, bn: name };
    document.getElementById('header-title').innerHTML =
        '<span class="en-text">' + titles.en + '</span><span class="bn-text" style="display:' + (currentLang === 'bn' ? '' : 'none') + '">' + titles.bn + '</span>';
    closeSidebar();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar()   { document.getElementById('sidebar').classList.remove('open'); }

// ── LOAD CATEGORIES ───────────────────────────
async function loadCategories() {
    var result = await sb.from('categories').select('*').eq('is_active', true).order('id');
    if (result.error) return;
    categoriesCache = result.data;
    var sel = document.getElementById('t-category');
    result.data.forEach(function(cat) {
        var opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name_en;
        sel.appendChild(opt);
    });
}

// ── LOAD TICKETS ─────────────────────────────
async function loadTickets() {
    var result = await sb
        .from('tickets')
        .select('*, categories(name_en, name_bn)')
        .eq('student_id', currentProfile.id)
        .order('created_at', { ascending: false });

    if (result.error) {
        showToast('Error', result.error.message, 'error');
        return;
    }

    allTickets = result.data || [];

    // Update stat cards
    var open     = allTickets.filter(function(t) { return t.status === 'open'; }).length;
    var progress = allTickets.filter(function(t) { return t.status === 'in_progress'; }).length;
    var resolved = allTickets.filter(function(t) { return t.status === 'resolved' || t.status === 'closed'; }).length;

    document.getElementById('stat-total').textContent    = allTickets.length;
    document.getElementById('stat-open').textContent     = open;
    document.getElementById('stat-progress').textContent = progress;
    document.getElementById('stat-resolved').textContent = resolved;

    // Open count badge in sidebar
    var badge = document.getElementById('open-count');
    if (open > 0) { badge.textContent = open; badge.style.display = ''; }
    else { badge.style.display = 'none'; }

    renderRecentTickets();
    renderTicketsTable(allTickets);
}

// ── RENDER RECENT TICKETS (overview) ──────────
function renderRecentTickets() {
    var recent = allTickets.slice(0, 5);
    var el = document.getElementById('recent-tickets-body');

    if (recent.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-title">No tickets yet</div><div class="empty-msg">Submit your first support ticket above.</div></div>';
        return;
    }

    var html = '<table class="data-table"><thead><tr>' +
        '<th>Ticket No</th><th>Title</th><th>Category</th><th>Status</th><th>Date</th>' +
        '</tr></thead><tbody>';

    recent.forEach(function(t) {
        var cat = t.categories ? t.categories.name_en : '—';
        html += '<tr onclick="openTicketModal(\'' + t.id + '\')">' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell"><div class="ticket-title-main">' + esc(t.title) + '</div></td>' +
            '<td>' + esc(cat) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
    });

    html += '</tbody></table>';
    el.innerHTML = html;
    setLang(currentLang);
}

// ── RENDER TICKETS TABLE ──────────────────────
function renderTicketsTable(tickets) {
    var el = document.getElementById('tickets-body');

    if (tickets.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div>' +
            '<div class="empty-title">No tickets found</div>' +
            '<div class="empty-msg">No tickets match your current filter.</div></div>';
        return;
    }

    var html = '<table class="data-table"><thead><tr>' +
        '<th>Ticket No</th><th>Title</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th>' +
        '</tr></thead><tbody>';

    tickets.forEach(function(t) {
        var cat = t.categories ? t.categories.name_en : '—';
        html += '<tr onclick="openTicketModal(\'' + t.id + '\')">' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell"><div class="ticket-title-main">' + esc(t.title) + '</div><div class="ticket-category">' + esc(cat) + '</div></td>' +
            '<td>' + esc(cat) + '</td>' +
            '<td>' + priorityBadge(t.priority) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
    });

    html += '</tbody></table>';
    el.innerHTML = html;
    setLang(currentLang);
}

// ── FILTER TICKETS ────────────────────────────
function filterTickets(filter, btn) {
    currentFilter = filter;
    document.querySelectorAll('.toolbar-filter').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');

    var filtered = filter === 'all'
        ? allTickets
        : allTickets.filter(function(t) { return t.status === filter; });

    renderTicketsTable(filtered);
}

// ── SUBMIT TICKET ─────────────────────────────
async function handleSubmitTicket(e) {
    e.preventDefault();
    var btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.textContent = '...';

    var payload = {
        title:       document.getElementById('t-title').value.trim(),
        description: document.getElementById('t-desc').value.trim(),
        category_id: parseInt(document.getElementById('t-category').value),
        priority:    document.getElementById('t-priority').value,
        student_id:  currentProfile.id,
        status:      'open'
    };

    var result = await sb.from('tickets').insert(payload);

    if (result.error) {
        showToast('Error', result.error.message, 'error');
    } else {
        showToast(
            currentLang === 'bn' ? 'টিকেট জমা হয়েছে!' : 'Ticket Submitted!',
            currentLang === 'bn' ? 'আপনার সমস্যা রেকর্ড করা হয়েছে। শীঘ্রই প্রতিক্রিয়া পাবেন।' : 'Your issue has been recorded. You will receive a response soon.',
            'success'
        );
        document.getElementById('submit-form').reset();
        await loadTickets();
        showSection('tickets', document.querySelectorAll('.nav-item')[2]);
    }

    btn.disabled = false;
    btn.innerHTML = '<span class="en-text">Submit Ticket</span><span class="bn-text">টিকেট জমা দিন</span>';
    setLang(currentLang);
}

// ── TICKET MODAL ──────────────────────────────
async function openTicketModal(ticketId) {
    activeTicketId = ticketId;
    var ticket     = allTickets.find(function(t) { return t.id === ticketId; });
    if (!ticket) return;

    document.getElementById('modal-ticket-no').textContent = ticket.ticket_no || 'Ticket';
    document.getElementById('modal-ticket-date').textContent = fmtDateTime(ticket.created_at);
    document.getElementById('modal-title').textContent = ticket.title;
    document.getElementById('modal-desc').textContent  = ticket.description;

    var cat = ticket.categories ? ticket.categories.name_en : '—';
    document.getElementById('modal-badges').innerHTML =
        statusBadge(ticket.status) + ' ' + priorityBadge(ticket.priority) +
        ' <span class="badge" style="background:var(--gold-faint);color:var(--gold);border:1px solid rgba(200,168,75,0.2)">' + esc(cat) + '</span>';

    // Hide reply if resolved/closed
    var closed = ticket.status === 'closed';
    document.getElementById('reply-area').style.display = closed ? 'none' : '';

    document.getElementById('ticket-modal').classList.add('open');
    document.getElementById('thread-wrap').innerHTML = '<div class="spinner-wrap"><div class="spinner"></div></div>';

    setLang(currentLang);
    await loadThread(ticketId, currentProfile.id);
}

function closeModal() {
    document.getElementById('ticket-modal').classList.remove('open');
    activeTicketId = null;
}

// Close on backdrop click
document.getElementById('ticket-modal').addEventListener('click', function(e) {
    if (e.target === this) closeModal();
});

async function loadThread(ticketId, myId) {
    var result = await sb
        .from('ticket_replies')
        .select('*, profiles(full_name, role)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

    var wrap = document.getElementById('thread-wrap');

    if (result.error || !result.data || result.data.length === 0) {
        wrap.innerHTML = '<div class="empty-state" style="padding:30px 0"><div class="empty-icon">💬</div><div class="empty-title" style="font-size:0.75rem">No replies yet</div></div>';
        return;
    }

    wrap.innerHTML = result.data.map(function(r) {
        var isMine   = r.author_id === myId;
        var isOfficer = r.profiles && (r.profiles.role === 'officer' || r.profiles.role === 'admin');
        var cls = isMine ? 'reply-mine' : (isOfficer ? 'reply-officer' : '');
        var authorName = r.profiles ? r.profiles.full_name : 'Unknown';
        var roleTxt = isOfficer ? ' · Officer' : (isMine ? ' · You' : '');
        return '<div class="reply-bubble ' + cls + '">' +
            '<div class="reply-meta"><span class="reply-author">' + esc(authorName) + roleTxt + '</span>' +
            '<span class="reply-time">' + fmtDateTime(r.created_at) + '</span></div>' +
            '<div class="reply-text">' + esc(r.message).replace(/\n/g, '<br>') + '</div>' +
            '</div>';
    }).join('');
}

async function sendReply() {
    var msg = document.getElementById('reply-input').value.trim();
    if (!msg || !activeTicketId) return;

    var btn = document.querySelector('#reply-area .btn');
    btn.disabled = true;

    var result = await sb.from('ticket_replies').insert({
        ticket_id: activeTicketId,
        author_id: currentProfile.id,
        message:   msg
    });

    if (result.error) {
        showToast('Error', result.error.message, 'error');
    } else {
        document.getElementById('reply-input').value = '';
        await loadThread(activeTicketId, currentProfile.id);
    }

    btn.disabled = false;
}

// ── LOAD NOTICES ──────────────────────────────
async function loadNotices() {
    var result = await sb
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

    var el = document.getElementById('notices-body');

    if (result.error || !result.data || result.data.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📢</div><div class="empty-title">No notices</div><div class="empty-msg">No official notices at this time.</div></div>';
        return;
    }

    el.innerHTML = result.data.map(function(n) {
        var pinned = n.is_pinned
            ? '<span class="badge badge-urgent" style="margin-left:10px">📌 Pinned</span>'
            : '';
        return '<div class="card" style="margin-bottom:16px">' +
            '<div class="card-header">' +
            '<div><div class="card-title">' + esc(n.title_en) + pinned + '</div>' +
            '<div style="font-size:0.75rem;color:var(--cream-faint);margin-top:3px">' + fmtDate(n.published_at) + '</div></div>' +
            '</div>' +
            '<div class="card-body" style="padding:18px 24px;font-size:0.95rem;color:var(--cream-dim);line-height:1.7">' + esc(n.body_en) + '</div>' +
            '</div>';
    }).join('');
}

// ── LOAD PROFILE ──────────────────────────────
function loadProfile() {
    var p   = currentProfile;
    var el  = document.getElementById('profile-card');
    var ini = p.full_name.split(' ').map(function(w) { return w[0]; }).join('').slice(0,2).toUpperCase();

    el.innerHTML = '<div class="card-body">' +
        '<div style="display:flex;align-items:center;gap:20px;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--green-border)">' +
        '<div style="width:64px;height:64px;border-radius:50%;background:var(--green-mid);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center;font-family:Cinzel,serif;font-size:1.4rem;color:var(--gold);font-weight:700;flex-shrink:0">' + ini + '</div>' +
        '<div><div style="font-family:Cinzel,serif;font-size:1.1rem;color:var(--cream)">' + esc(p.full_name) + '</div>' +
        '<div style="font-size:0.8rem;color:var(--gold-dim);margin-top:3px">' + esc(p.email) + '</div>' +
        '<div style="margin-top:8px">' + '<span class="badge badge-open">Student</span>' + '</div>' +
        '</div></div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
        profileField('Student ID', p.student_id || '—') +
        profileField('Email', p.email) +
        profileField('Department', p.department || '—') +
        profileField('Phone', p.phone || '—') +
        profileField('Member Since', fmtDate(p.created_at)) +
        profileField('Account Status', p.is_active ? 'Active' : 'Inactive') +
        '</div></div>';
}

function profileField(label, value) {
    return '<div style="padding:14px;background:rgba(27,50,16,0.4);border:1px solid var(--green-border)">' +
        '<div style="font-family:Cinzel,serif;font-size:0.58rem;letter-spacing:2px;color:var(--gold-dim);text-transform:uppercase;margin-bottom:5px">' + label + '</div>' +
        '<div style="font-size:0.92rem;color:var(--cream)">' + esc(value) + '</div>' +
        '</div>';
}
