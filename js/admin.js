// ─────────────────────────────────────────────
// BAUET Help Desk — admin.js
// Full system management for admin role
// ─────────────────────────────────────────────

var currentProfile   = null;
var allUsers         = [];
var allRequests      = [];
var allTickets       = [];
var allNotices       = [];
var allCategories    = [];
var userRoleFilter   = 'all';
var userSearchQuery  = '';
var editingUserId    = null;

// ── INIT ──────────────────────────────────────
(async function init() {
    var auth = await requireAuth(['admin']);
    if (!auth) return;

    currentProfile = auth.profile;

    var ini = currentProfile.full_name.split(' ').map(function(w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    document.getElementById('user-avatar').textContent = ini;
    document.getElementById('user-name').textContent   = currentProfile.full_name;

    await Promise.all([
        loadUsers(),
        loadRequests(),
        loadTickets(),
        loadNotices(),
        loadCategories()
    ]);

    buildOverview();
    setLang(currentLang);
})();

// ── NAVIGATION ────────────────────────────────
var sectionTitles = {
    overview:   'Overview',
    requests:   'Role Requests',
    users:      'User Management',
    tickets:    'All Tickets',
    notices:    'Notices',
    categories: 'Categories'
};

function showSection(name, navEl) {
    document.querySelectorAll('.page-section').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function(n) { n.classList.remove('active'); });
    document.getElementById('section-' + name).classList.add('active');
    if (navEl) navEl.classList.add('active');
    document.getElementById('header-title').textContent = sectionTitles[name] || name;
    closeSidebar();
}

function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
function closeSidebar()   { document.getElementById('sidebar').classList.remove('open'); }

// ── LOAD DATA ─────────────────────────────────
async function loadUsers() {
    var r = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    if (!r.error) allUsers = r.data || [];
    renderUsers();
}

async function loadRequests() {
    var r = await sb
        .from('role_requests')
        .select('*, profiles!role_requests_user_id_fkey(full_name, email, student_id)')
        .order('created_at', { ascending: false });
    if (!r.error) allRequests = r.data || [];

    var pending = allRequests.filter(function(req) { return req.status === 'pending'; }).length;
    var badge = document.getElementById('req-badge');
    if (pending > 0) { badge.textContent = pending; badge.style.display = ''; }
    else { badge.style.display = 'none'; }

    renderRequests('pending');
}

async function loadTickets() {
    var r = await sb
        .from('tickets')
        .select('*, categories(name_en), profiles!tickets_student_id_fkey(full_name)')
        .order('created_at', { ascending: false });
    if (!r.error) allTickets = r.data || [];
    renderAdminTickets(allTickets);
}

async function loadNotices() {
    var r = await sb.from('notices').select('*, profiles(full_name)').order('created_at', { ascending: false });
    if (!r.error) allNotices = r.data || [];
    renderNotices();
}

async function loadCategories() {
    var r = await sb.from('categories').select('*').order('id');
    if (!r.error) allCategories = r.data || [];
    renderCategories();
}

// ── BUILD OVERVIEW ────────────────────────────
function buildOverview() {
    var open     = allTickets.filter(function(t) { return t.status === 'open'; }).length;
    var progress = allTickets.filter(function(t) { return t.status === 'in_progress'; }).length;
    var resolved = allTickets.filter(function(t) { return t.status === 'resolved'; }).length;
    var pending  = allRequests.filter(function(r) { return r.status === 'pending'; }).length;

    document.getElementById('ov-users').textContent       = allUsers.length;
    document.getElementById('ov-open').textContent        = open;
    document.getElementById('ov-progress').textContent    = progress;
    document.getElementById('ov-resolved').textContent    = resolved;
    document.getElementById('ov-pending-req').textContent = pending;

    // Role breakdown
    var roles = { student: 0, officer: 0, authority: 0, admin: 0 };
    allUsers.forEach(function(u) { if (roles[u.role] !== undefined) roles[u.role]++; });

    var roleColors = { student: 'var(--info)', officer: 'var(--gold)', authority: 'var(--warning)', admin: 'var(--error)' };
    document.getElementById('role-breakdown').innerHTML = Object.keys(roles).map(function(role) {
        var count = roles[role];
        var pct   = allUsers.length > 0 ? Math.round((count / allUsers.length) * 100) : 0;
        return '<div style="margin-bottom:14px">' +
            '<div style="display:flex;justify-content:space-between;margin-bottom:5px">' +
            '<span style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:1px;color:var(--cream-dim);text-transform:capitalize">' + role + '</span>' +
            '<span style="font-family:Cinzel,serif;font-size:0.75rem;color:' + roleColors[role] + '">' + count + '</span></div>' +
            '<div style="height:4px;background:rgba(200,168,75,0.08);border-radius:2px">' +
            '<div style="height:100%;width:' + pct + '%;background:' + roleColors[role] + ';border-radius:2px;transition:width 0.5s ease"></div>' +
            '</div></div>';
    }).join('');

    // Overview pending requests (top 5)
    var pendingList = allRequests.filter(function(r) { return r.status === 'pending'; }).slice(0, 5);
    var reqEl = document.getElementById('overview-requests');
    if (pendingList.length === 0) {
        reqEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--cream-faint);font-size:0.85rem">No pending requests</div>';
    } else {
        reqEl.innerHTML = pendingList.map(function(req) {
            var profile = req.profiles || {};
            return '<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--green-border)">' +
                '<div>' +
                '<div style="font-size:0.88rem;color:var(--cream)">' + esc(profile.full_name || '—') + '</div>' +
                '<div style="font-size:0.72rem;color:var(--cream-faint)">' + esc(profile.email || '') + '</div>' +
                '</div>' +
                '<div style="display:flex;gap:8px;align-items:center">' +
                '<span class="badge badge-warning">' + esc(req.requested_role) + '</span>' +
                '<button class="btn btn-success btn-sm" onclick="approveRequest(\'' + req.id + '\',\'' + req.user_id + '\',\'' + req.requested_role + '\')">✓</button>' +
                '<button class="btn btn-danger btn-sm"  onclick="rejectRequest(\'' + req.id + '\')">✗</button>' +
                '</div></div>';
        }).join('');
    }

    // Overview recent tickets
    var recentEl = document.getElementById('overview-tickets');
    var recent   = allTickets.slice(0, 8);
    if (recent.length === 0) {
        recentEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-title">No tickets yet</div></div>';
        return;
    }
    var rows = recent.map(function(t) {
        var cat     = t.categories ? t.categories.name_en : '—';
        var student = t.profiles   ? t.profiles.full_name  : '—';
        return '<tr>' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell"><div class="ticket-title-main">' + esc(t.title) + '</div></td>' +
            '<td style="font-size:0.85rem">' + esc(student) + '</td>' +
            '<td>' + esc(cat) + '</td>' +
            '<td>' + priorityBadge(t.priority) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
    }).join('');
    recentEl.innerHTML = '<table class="data-table"><thead><tr><th>No</th><th>Title</th><th>Student</th><th>Category</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody></table>';
    setLang(currentLang);
}

// ── ROLE REQUESTS ─────────────────────────────
function filterRequests(status, btn) {
    document.querySelectorAll('#section-requests .toolbar-filter').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderRequests(status);
}

function renderRequests(filter) {
    var list = filter === 'all'
        ? allRequests
        : allRequests.filter(function(r) { return r.status === filter; });

    var el = document.getElementById('requests-body');
    if (list.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">✅</div><div class="empty-title">No requests</div><div class="empty-msg">No ' + filter + ' role requests.</div></div>';
        return;
    }

    var rows = list.map(function(req) {
        var p       = req.profiles || {};
        var badgeEl = req.status === 'pending'
            ? '<span class="badge badge-pending">Pending</span>'
            : req.status === 'approved'
                ? '<span class="badge badge-approved">Approved</span>'
                : '<span class="badge badge-rejected">Rejected</span>';

        var actions = req.status === 'pending'
            ? '<button class="btn btn-success btn-sm" onclick="approveRequest(\'' + req.id + '\',\'' + req.user_id + '\',\'' + req.requested_role + '\')">✓ Approve</button> ' +
              '<button class="btn btn-danger btn-sm" onclick="rejectRequest(\'' + req.id + '\')">✗ Reject</button>'
            : '<span style="font-size:0.75rem;color:var(--cream-faint)">' + fmtDate(req.reviewed_at) + '</span>';

        return '<tr>' +
            '<td><div style="font-size:0.9rem;color:var(--cream)">' + esc(p.full_name || '—') + '</div>' +
            '<div style="font-size:0.72rem;color:var(--cream-faint);margin-top:2px">' + esc(p.email || '') + '</div></td>' +
            '<td style="font-size:0.8rem">' + esc(p.student_id || '—') + '</td>' +
            '<td><span class="badge badge-high">' + esc(req.requested_role) + '</span></td>' +
            '<td>' + badgeEl + '</td>' +
            '<td>' + fmtDate(req.created_at) + '</td>' +
            '<td>' + actions + '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table"><thead><tr><th>User</th><th>Student ID</th><th>Requested Role</th><th>Status</th><th>Submitted</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

async function approveRequest(reqId, userId, role) {
    var r1 = await sb.from('profiles').update({ role: role }).eq('id', userId);
    if (r1.error) { showToast('Error', r1.error.message, 'error'); return; }

    var r2 = await sb.from('role_requests').update({
        status:      'approved',
        reviewed_by: currentProfile.id,
        reviewed_at: new Date().toISOString()
    }).eq('id', reqId);
    if (r2.error) { showToast('Error', r2.error.message, 'error'); return; }

    showToast('Approved', 'Role updated to ' + role + '.', 'success');
    await loadRequests();
    await loadUsers();
    buildOverview();
}

async function rejectRequest(reqId) {
    var r = await sb.from('role_requests').update({
        status:      'rejected',
        reviewed_by: currentProfile.id,
        reviewed_at: new Date().toISOString()
    }).eq('id', reqId);
    if (r.error) { showToast('Error', r.error.message, 'error'); return; }

    showToast('Rejected', 'Role request has been rejected.', 'warning');
    await loadRequests();
    buildOverview();
}

// ── USER MANAGEMENT ───────────────────────────
function renderUsers() {
    var filtered = allUsers.filter(function(u) {
        var matchRole   = userRoleFilter === 'all' || u.role === userRoleFilter;
        var q           = userSearchQuery.toLowerCase();
        var matchSearch = !q || u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.student_id || '').toLowerCase().includes(q);
        return matchRole && matchSearch;
    });

    var el = document.getElementById('users-body');
    if (filtered.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-title">No users found</div></div>';
        return;
    }

    var rows = filtered.map(function(u) {
        var roleColors = { student: 'badge-open', officer: 'badge-high', authority: 'badge-progress', admin: 'badge-urgent' };
        var badgeClass = roleColors[u.role] || '';
        var statusHtml = u.is_active
            ? '<span class="badge badge-resolved">Active</span>'
            : '<span class="badge badge-closed">Disabled</span>';

        return '<tr>' +
            '<td><div style="font-size:0.9rem;color:var(--cream)">' + esc(u.full_name) + '</div>' +
            '<div style="font-size:0.72rem;color:var(--cream-faint);margin-top:2px">' + esc(u.email) + '</div></td>' +
            '<td style="font-size:0.8rem">' + esc(u.student_id || '—') + '</td>' +
            '<td><span class="badge ' + badgeClass + '">' + esc(u.role) + '</span></td>' +
            '<td>' + statusHtml + '</td>' +
            '<td>' + fmtDate(u.created_at) + '</td>' +
            '<td><button class="btn btn-outline btn-sm" onclick="openUserModal(\'' + u.id + '\')">Edit Role</button></td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table"><thead><tr><th>User</th><th>ID</th><th>Role</th><th>Status</th><th>Joined</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

function filterUsers(query) {
    userSearchQuery = query;
    renderUsers();
}

function filterUserRole(role, btn) {
    userRoleFilter = role;
    document.querySelectorAll('#section-users .toolbar-filter').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    renderUsers();
}

function openUserModal(userId) {
    var user = allUsers.find(function(u) { return u.id === userId; });
    if (!user) return;
    editingUserId = userId;

    document.getElementById('user-modal-info').innerHTML =
        '<strong>' + esc(user.full_name) + '</strong> &nbsp;·&nbsp; ' + esc(user.email) +
        '<br><span style="font-size:0.78rem;color:var(--gold-dim)">Current role: <strong>' + user.role + '</strong> &nbsp;·&nbsp; ID: ' + esc(user.student_id || '—') + '</span>';

    document.getElementById('user-role-select').value   = user.role;
    document.getElementById('user-status-select').value = String(user.is_active);
    document.getElementById('user-modal').classList.add('open');
}

function closeUserModal() {
    document.getElementById('user-modal').classList.remove('open');
    editingUserId = null;
}

async function saveUserRole() {
    if (!editingUserId) return;
    var newRole   = document.getElementById('user-role-select').value;
    var newStatus = document.getElementById('user-status-select').value === 'true';

    var r = await sb.from('profiles').update({ role: newRole, is_active: newStatus }).eq('id', editingUserId);
    if (r.error) { showToast('Error', r.error.message, 'error'); return; }

    showToast('Saved', 'User role and status updated.', 'success');
    closeUserModal();
    await loadUsers();
    buildOverview();
}

// ── ALL TICKETS ───────────────────────────────
function filterAdminTickets(status, btn) {
    document.querySelectorAll('#section-tickets .toolbar-filter').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    var filtered = status === 'all'
        ? allTickets
        : allTickets.filter(function(t) { return t.status === status; });
    renderAdminTickets(filtered);
}

function renderAdminTickets(tickets) {
    var el = document.getElementById('admin-tickets-body');
    if (!tickets || tickets.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-title">No tickets</div></div>';
        return;
    }

    var rows = tickets.map(function(t) {
        var cat     = t.categories ? t.categories.name_en : '—';
        var student = t.profiles   ? t.profiles.full_name  : '—';
        return '<tr>' +
            '<td><span class="ticket-no">' + esc(t.ticket_no || '—') + '</span></td>' +
            '<td class="ticket-title-cell"><div class="ticket-title-main">' + esc(t.title) + '</div><div class="ticket-category">' + esc(cat) + '</div></td>' +
            '<td style="font-size:0.85rem">' + esc(student) + '</td>' +
            '<td>' + priorityBadge(t.priority) + '</td>' +
            '<td>' + statusBadge(t.status) + '</td>' +
            '<td>' + fmtDate(t.created_at) + '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table"><thead><tr><th>Ticket No</th><th>Title</th><th>Student</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead><tbody>' + rows + '</tbody></table>';
    setLang(currentLang);
}

// ── NOTICES ───────────────────────────────────
function renderNotices() {
    var el = document.getElementById('admin-notices-body');
    if (!allNotices || allNotices.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">📢</div><div class="empty-title">No notices</div></div>';
        return;
    }

    el.innerHTML = allNotices.map(function(n) {
        var author  = n.profiles ? n.profiles.full_name : '—';
        var pinned  = n.is_pinned ? ' 📌' : '';
        var visible = n.is_active
            ? '<span class="badge badge-resolved">Visible</span>'
            : '<span class="badge badge-closed">Hidden</span>';

        return '<div class="card" style="margin-bottom:14px">' +
            '<div class="card-header">' +
            '<div><div class="card-title">' + esc(n.title_en) + pinned + '</div>' +
            '<div style="font-size:0.72rem;color:var(--cream-faint);margin-top:3px">By ' + esc(author) + ' · ' + fmtDate(n.published_at) + '</div></div>' +
            '<div style="display:flex;align-items:center;gap:10px">' + visible +
            '<button class="btn btn-sm ' + (n.is_active ? 'btn-outline' : 'btn-success') + '" onclick="toggleNotice(\'' + n.id + '\',' + (!n.is_active) + ')">' +
            (n.is_active ? 'Hide' : 'Show') + '</button>' +
            '<button class="btn btn-danger btn-sm" onclick="deleteNotice(\'' + n.id + '\')">Delete</button>' +
            '</div></div>' +
            '<div class="card-body" style="padding:14px 24px;font-size:0.9rem;color:var(--cream-dim)">' + esc(n.body_en) + '</div>' +
            '</div>';
    }).join('');
}

async function toggleNotice(id, visible) {
    var r = await sb.from('notices').update({ is_active: visible }).eq('id', id);
    if (r.error) { showToast('Error', r.error.message, 'error'); return; }
    showToast('Updated', visible ? 'Notice is now visible.' : 'Notice hidden.', 'success');
    await loadNotices();
}

async function deleteNotice(id) {
    if (!confirm('Delete this notice? This cannot be undone.')) return;
    var r = await sb.from('notices').delete().eq('id', id);
    if (r.error) { showToast('Error', r.error.message, 'error'); return; }
    showToast('Deleted', 'Notice removed.', 'success');
    await loadNotices();
}

// ── CATEGORIES ────────────────────────────────
function renderCategories() {
    var el = document.getElementById('categories-body');
    if (!allCategories || allCategories.length === 0) {
        el.innerHTML = '<div class="empty-state"><div class="empty-icon">🏷️</div><div class="empty-title">No categories</div></div>';
        return;
    }

    var rows = allCategories.map(function(cat) {
        var visible = cat.is_active
            ? '<span class="badge badge-resolved">Active</span>'
            : '<span class="badge badge-closed">Inactive</span>';
        return '<tr>' +
            '<td>' + esc(cat.icon || '') + '</td>' +
            '<td style="font-size:0.9rem;color:var(--cream)">' + esc(cat.name_en) + '</td>' +
            '<td>' + esc(cat.name_bn) + '</td>' +
            '<td>' + visible + '</td>' +
            '<td>' +
            '<button class="btn btn-sm ' + (cat.is_active ? 'btn-outline' : 'btn-success') + '" onclick="toggleCategory(' + cat.id + ',' + (!cat.is_active) + ')">' +
            (cat.is_active ? 'Disable' : 'Enable') + '</button>' +
            '</td>' +
            '</tr>';
    }).join('');

    el.innerHTML = '<table class="data-table"><thead><tr><th>Icon</th><th>Name (EN)</th><th>Name (BN)</th><th>Status</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table>';
}

async function toggleCategory(id, active) {
    var r = await sb.from('categories').update({ is_active: active }).eq('id', id);
    if (r.error) { showToast('Error', r.error.message, 'error'); return; }
    showToast('Updated', 'Category ' + (active ? 'enabled' : 'disabled') + '.', 'success');
    await loadCategories();
}

function addCategory() {
    var icon = prompt('Icon (emoji):');
    if (!icon) return;
    var en = prompt('Name in English:');
    if (!en) return;
    var bn = prompt('Name in Bengali:');
    if (!bn) return;

    sb.from('categories').insert({ icon: icon, name_en: en, name_bn: bn }).then(function(r) {
        if (r.error) { showToast('Error', r.error.message, 'error'); return; }
        showToast('Added', 'Category created.', 'success');
        loadCategories();
    });
}

// ── CONFIRM MODAL HELPERS ─────────────────────
function openConfirm(title, msg, onOk) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent   = msg;
    document.getElementById('confirm-ok').onclick        = function() { closeConfirm(); onOk(); };
    document.getElementById('confirm-modal').classList.add('open');
}

function closeConfirm() { document.getElementById('confirm-modal').classList.remove('open'); }
