# Member 1 — Authority Dashboard

**Branch:** `Sourav_ID_37`  
**Files to create:** `authority-dashboard.html` · `js/authority.js`

---

### Page Setup
- [ ] Create `authority-dashboard.html`
- [ ] Create `js/authority.js`
- [ ] Link `dashboard-base.css` and `utils.js`
- [ ] Protected route — authority and admin only

### Sidebar
- [ ] BAUET logo + "Authority Panel" label
- [ ] Nav: Overview, All Tickets, Open/Unresolved, Notices, My Profile
- [ ] User avatar with initials
- [ ] Sign Out button

### Top Header
- [ ] Page title updates on section switch
- [ ] EN / বাং language toggle

### Overview Section
- [ ] 4 stat cards — Total Tickets, Open, In Progress, Resolved This Month
- [ ] Tickets by category table (category | total | open | resolved)
- [ ] Tickets by status — visual breakdown with percentages
- [ ] Recent activity — last 10 tickets read-only table

### All Tickets Section
- [ ] Full system-wide ticket table
- [ ] Columns: Ticket No, Title, Student Name, Category, Priority, Status, Date
- [ ] Filter toolbar: All / Open / In Progress / Resolved / Closed
- [ ] Filter by priority
- [ ] Read-only detail modal on row click
- [ ] Modal shows ticket info + full reply thread (no reply input)

### Open / Unresolved Section
- [ ] Pre-filtered table for open and in-progress tickets
- [ ] "Days Open" column calculated from created_at
- [ ] Urgent tickets visually highlighted
- [ ] Sorted oldest first

### Notices Section
- [ ] Load from notices table
- [ ] Pinned notices shown first
- [ ] Read-only — no create/edit/delete

### Profile Section
- [ ] Display full name, email, student ID, role badge, member since
