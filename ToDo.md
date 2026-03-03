# BAUET Help Desk System — Project Progress Tracker

> **Project:** Bangladesh Army University of Engineering & Technology — Student Help Desk
> **Stack:** HTML · CSS · Vanilla JS · Supabase (Auth + PostgreSQL)
> **Theme:** Military Green & Gold, bilingual EN/BN
> **Last Updated:** 2026-03-02

---

## ✅ Phase 1 — Database & Backend (Supabase)

- [x] Supabase project created and configured
- [x] `supabase_setup.sql` written and ready to run
- [x] `profiles` table (id, full_name, email, student_id, role, created_at)
- [x] `tickets` table (id, title, description, category, status, priority, student_id, assigned_to, created_at, updated_at)
- [x] `ticket_replies` table (id, ticket_id, author_id, message, created_at)
- [x] `notices` table (id, title, content, author_id, created_at, is_pinned)
- [x] `faqs` table (id, question, answer, category, order_index)
- [x] Row Level Security (RLS) policies defined for all tables
- [x] Role-based access: student / officer / authority / admin
- [x] Supabase anon key and project URL configured in JS

---

## ✅ Phase 2 — File Structure & Asset Organisation

- [x] Project refactored into separate HTML / CSS / JS files
- [x] `assets/images/bauet-logo.png` extracted and saved (real PNG, no base64)
- [x] `css/style.css` — landing page styles
- [x] `css/auth.css` — auth page styles
- [x] `js/main.js` — landing page interactions
- [x] `js/auth.js` — Supabase auth logic
- [x] All relative paths verified (`assets/images/bauet-logo.png`)
- [x] Google Fonts: Cinzel, Crimson Pro, Noto Sans Bengali

---

## ✅ Phase 3A — Landing / Home Page (`index.html`)

- [x] Fixed language bar (EN / বাং toggle)
- [x] Sticky navbar with scroll shrink effect
- [x] Hero section with headline, description, CTA buttons
- [x] Hero stats cards (4+ roles, 7 categories, 24/7, 100%)
- [x] About section with military frame + BAUET seal image
- [x] 4-module grid (Student, Officer, Authority, Admin)
- [x] "How It Works" 4-step flow with connecting gold line
- [x] Issue Categories chip grid (7 categories)
- [x] CTA section with "BAUET" watermark background text
- [x] Footer with nav links, access links, copyright
- [x] Scroll reveal animations (IntersectionObserver)
- [x] Fully bilingual (every text element has EN + BN variants)
- [x] Responsive breakpoints (1024px, 768px)

---

## ✅ Phase 3B — Login & Registration Page (`auth.html`)

- [x] Two-panel layout (branding left, forms right)
- [x] Tab switching: Sign In ↔ Create Account
- [x] Login form (email + password, show/hide toggle)
- [x] Register form (first name, last name, email, student ID, role selector, password, confirm password)
- [x] 4-role selector cards (Student, Officer, Authority, Admin)
- [x] Supabase `signInWithPassword()` integration
- [x] Supabase `signUp()` with profile upsert to `profiles` table
- [x] Loading spinner on submit button
- [x] Toast notification system (success / error / default)
- [x] Success overlay with redirect button
- [x] Password mismatch validation
- [x] `?tab=register` URL param support
- [x] Already-logged-in session detection
- [x] Back to Home link
- [x] Language toggle (synced with `localStorage`)
- [x] Mobile responsive (left panel hides, mobile header shown)

---

## 🔲 Phase 3C — Student Dashboard (`student-dashboard.html`)

- [ ] Protected route — redirect to `auth.html` if not logged in
- [ ] Top navbar with user name, role badge, logout button
- [ ] Sidebar navigation (My Tickets, Submit Ticket, Notices, FAQs, Profile)
- [ ] **Submit Ticket** form
  - [ ] Title, description textarea
  - [ ] Category dropdown (Academic, Hostel, Registration, Examination, IT, Medical, Other)
  - [ ] Priority selector (Low, Medium, High)
  - [ ] File attachment (optional)
  - [ ] Submit to Supabase `tickets` table
- [ ] **My Tickets** list view
  - [ ] Status badges (Open, In Progress, Resolved, Closed)
  - [ ] Filter by status / category
  - [ ] Click to open ticket detail / reply thread
- [ ] **Ticket Detail** modal or page
  - [ ] Full ticket info
  - [ ] Reply thread (read messages from officer)
  - [ ] Student reply input
- [ ] **Notices** tab — read-only list from `notices` table
- [ ] **FAQs** tab — accordion list from `faqs` table
- [ ] **Profile** tab — view/edit own profile info
- [ ] Bilingual EN/BN support throughout
- [ ] Responsive mobile layout

---

## 🔲 Phase 3D — Help Desk Officer Dashboard (`officer-dashboard.html`)

- [ ] Protected route — redirect if not `role = officer`
- [ ] Sidebar: All Tickets, Assigned to Me, Resolved, Upload Notice, Profile
- [ ] **Ticket Queue** — list of all open/in-progress tickets
  - [ ] Assign ticket to self
  - [ ] Filter by category, priority, status
  - [ ] Sort by date / priority
- [ ] **Ticket Detail & Reply**
  - [ ] View full student submission
  - [ ] Type and send reply (saves to `ticket_replies`)
  - [ ] Update ticket status (Open → In Progress → Resolved)
  - [ ] Upload document/attachment to ticket
- [ ] **Upload Notice**
  - [ ] Title, content, pin toggle
  - [ ] Saves to `notices` table
- [ ] **Stats Overview** — tickets resolved this week/month
- [ ] Bilingual support
- [ ] Responsive layout

---

## 🔲 Phase 3E — Authority Dashboard (`authority-dashboard.html`)

- [ ] Protected route — redirect if not `role = authority`
- [ ] Read-only overview of all tickets system-wide
- [ ] **Reports view**
  - [ ] Tickets by category (chart or table)
  - [ ] Tickets by status
  - [ ] Average resolution time
  - [ ] Officer performance summary
- [ ] **Unresolved / overdue ticket alerts**
- [ ] Ability to view any ticket thread (read-only)
- [ ] Export report as PDF or CSV (optional)
- [ ] Bilingual support

---

## 🔲 Phase 3F — Admin Panel (`admin-panel.html`)

- [ ] Protected route — redirect if not `role = admin`
- [ ] **User Management**
  - [ ] List all users with role and status
  - [ ] Change user role
  - [ ] Deactivate / delete user
- [ ] **Ticket Management**
  - [ ] View all tickets
  - [ ] Reassign ticket to different officer
  - [ ] Force-close ticket
- [ ] **Category Management**
  - [ ] Add / edit / delete ticket categories
- [ ] **FAQ Management**
  - [ ] Add / edit / delete FAQs
  - [ ] Reorder FAQs
- [ ] **Notice Management**
  - [ ] Pin / unpin / delete notices
- [ ] **System Stats** — total users, tickets, open issues
- [ ] Bilingual support

---

## 🔲 Phase 3G — Notice Board & FAQ Page (`notices.html`)

- [ ] Public-facing page (no login required)
- [ ] Pinned notices displayed at top
- [ ] Notices list sorted by date with category tag
- [ ] FAQ accordion by category (Academic, Hostel, IT, etc.)
- [ ] Search/filter notices and FAQs
- [ ] Link back to `index.html` and `auth.html`
- [ ] Bilingual EN/BN support
- [ ] Consistent military green/gold theme

---

## 🔲 Phase 4 — Polish & Cross-Cutting

- [ ] 404 error page (`404.html`) in theme
- [ ] Shared `css/global.css` for common variables and resets
- [ ] Shared `js/utils.js` — toast, session check, lang helper (DRY)
- [ ] `js/supabase-client.js` — single shared Supabase initialisation
- [ ] Email verification flow (Supabase email template customisation)
- [ ] Password reset page (`reset-password.html`)
- [ ] Loading skeleton screens on dashboard data fetch
- [ ] Offline / network error state handling
- [ ] Final mobile responsiveness audit across all pages
- [ ] Cross-browser test (Chrome, Firefox, Edge)

---

## 📁 Current File Inventory

```
bauet-project/
├── index.html              ✅ Complete
├── auth.html               ✅ Complete
├── student-dashboard.html  🔲 Not started
├── officer-dashboard.html  🔲 Not started
├── authority-dashboard.html 🔲 Not started
├── admin-panel.html        🔲 Not started
├── notices.html            🔲 Not started
├── css/
│   ├── style.css           ✅ Complete
│   └── auth.css            ✅ Complete
├── js/
│   ├── main.js             ✅ Complete
│   └── auth.js             ✅ Complete
├── assets/
│   └── images/
│       └── bauet-logo.png  ✅ Saved (14KB real PNG)
└── supabase_setup.sql      ✅ Complete
```

---

