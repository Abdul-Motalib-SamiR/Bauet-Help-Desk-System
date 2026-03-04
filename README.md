<div align="center">

<br/>

```
██████╗  █████╗ ██╗   ██╗███████╗████████╗
██╔══██╗██╔══██╗██║   ██║██╔════╝╚══██╔══╝
██████╔╝███████║██║   ██║█████╗     ██║   
██╔══██╗██╔══██║██║   ██║██╔══╝     ██║   
██████╔╝██║  ██║╚██████╔╝███████╗   ██║   
╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝  
```

# 🛡️ BAUET Help Desk System

**Bangladesh Army University of Engineering & Technology**  
*Official Student Support & Issue Tracking Platform*

<br/>

[![Status](https://img.shields.io/badge/Status-Active%20Development-brightgreen?style=for-the-badge&logo=github)](#)
[![Built With](https://img.shields.io/badge/Built%20With-HTML%20%7C%20CSS%20%7C%20JS-C8A84B?style=for-the-badge&logo=html5)](#)
[![Backend](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase)](#)
[![Language](https://img.shields.io/badge/Language-EN%20%7C%20বাংলা-1B3210?style=for-the-badge)](#)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://bauet-help-desk-system.vercel.app/)

<br/>

🌐 **Live at:** [https://bauet-help-desk-system.vercel.app](https://bauet-help-desk-system.vercel.app/)

<br/>

---

</div>

## 📖 About the Project

The **BAUET Help Desk System** is a full-featured, bilingual (English & Bengali) student support platform built for Bangladesh Army University of Engineering & Technology. Students can submit issues and track resolutions, officers can manage and respond to tickets, and administrators have complete oversight of the entire system  all through a unified, role-based web interface.

> Built with a military-grade design aesthetic: deep forest green, ceremonial gold, and Cinzel serif typography  designed to reflect BAUET's institutional character.

<br/>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Role-Based Access** | Student, Officer, Authority, Admin — each with a dedicated dashboard |
| 📧 **Email Confirmation** | Supabase-powered email verification on signup |
| 🛡️ **Approval Workflow** | Officer / Authority / Admin roles require admin approval before access |
| 🎫 **Ticket System** | Students submit issues; officers respond and update status |
| 💬 **Reply Threads** | Full conversation history on every ticket |
| 📢 **Notice Board** | Officers and admins post official announcements |
| 🌐 **Bilingual UI** | Every page available in English and বাংলা |
| 📱 **Responsive Design** | Mobile-friendly with collapsible sidebar navigation |
| 📊 **Admin Analytics** | Role breakdown, stats, system-wide ticket oversight |

<br/>

---

## 🗂️ Project Structure

```
Bauet-Help-Desk-System/
│
├── index.html                  ← Public landing page
├── auth.html                   ← Login & registration
│
├── student-dashboard.html      ← Student portal
├── officer-dashboard.html      ← Officer management panel
├── admin-panel.html            ← System administration
│
├── css/
│   ├── style.css               ← Landing page styles
│   ├── auth.css                ← Authentication page styles
│   └── dashboard-base.css      ← Shared dashboard styles (all roles)
│
├── js/
│   ├── main.js                 ← Landing page interactions
│   ├── auth.js                 ← Login, register, role request logic
│   ├── utils.js                ← Shared: Supabase client, auth guard, helpers
│   ├── student.js              ← Student dashboard logic
│   ├── officer.js              ← Officer dashboard logic
│   └── admin.js                ← Admin panel logic
│
├── assets/
│   └── images/
│       └── bauet-logo.png      ← Official BAUET shield logo
│
├── supabase_setup.sql          ← Full database schema + RLS policies
└── README.md                   ← This file
```

<br/>

---

## 👥 User Roles

```
┌─────────────────────────────────────────────────────────────────┐
│                        ROLE HIERARCHY                           │
│                                                                 │
│   🎓 STUDENT          → Instant access on signup               │
│      └─ Submit tickets, track status, read notices             │
│                                                                 │
│   🛡️  OFFICER         → Requires admin approval                │
│      └─ Manage ticket queue, reply to students, post notices   │
│                                                                 │
│   🏛️  AUTHORITY       → Requires admin approval                │
│      └─ Oversight view, reports (coming soon)                  │
│                                                                 │
│   ⚙️  ADMIN           → Hard-coded or admin-granted            │
│      └─ Full system access: users, roles, tickets, notices     │
└─────────────────────────────────────────────────────────────────┘
```

> **Note:** When a user registers with a restricted role (Officer / Authority / Admin), their account is created as **Student** with a `role_requests` record submitted to the admin for review. The admin approves or rejects from the Admin Panel.

<br/>

---

## 🗃️ Database Schema

```sql
profiles          ← Linked to Supabase auth; stores role, name, student ID
role_requests     ← Pending role upgrade requests (approved by admin)
tickets           ← Support tickets submitted by students
ticket_replies    ← Threaded replies on each ticket
categories        ← Issue categories (Academic, Hostel, IT, etc.)
notices           ← Official announcements from officers/admins
faqs              ← Frequently asked questions (planned)
```

All tables have **Row Level Security (RLS)** enabled:
- Students only see their own tickets
- Officers and admins see all tickets
- Only admins can approve role requests and manage users

<br/>

---

## 🔧 Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/Abdul-Motalib-SamiR/Bauet-Help-Desk-System.git
cd Bauet-Help-Desk-System
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Open **SQL Editor** → **New Query**
3. Paste the full contents of `supabase_setup.sql` and run it
4. This creates all tables, RLS policies, triggers, and the auto-admin trigger

### 3. Configure Authentication

In your Supabase Dashboard → **Authentication → Settings**:

| Setting | Value |
|---|---|
| Email Confirmations | ✅ Enabled |
| Redirect URLs | Your site URL (e.g. `http://localhost:5500`) |
| Minimum Password Length | 8 |

### 4. Update Credentials

In `js/auth.js` and `js/utils.js`, confirm your Supabase URL and anon key are correct:

```js
const SUPABASE_URL  = 'https://your-project.supabase.co';
const SUPABASE_ANON = 'your-anon-key-here';
```

### 5. Serve Locally

Use any static server. With VS Code:
- Install the **Live Server** extension
- Right-click `index.html` → **Open with Live Server**

Or with Python:
```bash
python3 -m http.server 5500
```

Then visit `http://localhost:5500`

<br/>

---

## 🗺️ Page Flow

```
index.html  (Landing)
    │
    └──► auth.html  (Login / Register)
              │
              ├──► student-dashboard.html    [role: student]
              │        ├── Overview & stats
              │        ├── Submit new ticket
              │        ├── My tickets (with reply thread modal)
              │        ├── Official notices
              │        └── My profile
              │
              ├──► officer-dashboard.html   [role: officer]
              │        ├── Ticket queue (all open/in-progress)
              │        ├── Assigned to me
              │        ├── Update ticket status
              │        ├── Reply to students
              │        └── Post official notices
              │
              ├──► admin-panel.html         [role: admin]
              │        ├── System overview & stats
              │        ├── Role request approvals ← KEY FEATURE
              │        ├── User management (edit role/status)
              │        ├── All tickets
              │        ├── Notice management
              │        └── Category management
              │
              └──► authority-dashboard.html [role: authority] ← Coming Soon
```

<br/>

---

## 🎨 Design System

| Element | Value |
|---|---|
| **Primary Background** | `#0C1A08` Deep forest green |
| **Panel Background** | `#172610` Dark green |
| **Accent Gold** | `#C8A84B` Ceremonial gold |
| **Text Primary** | `#F7F0DC` Warm cream |
| **Display Font** | Cinzel (serif, Latin) |
| **Body Font** | Crimson Pro + Noto Sans Bengali |
| **Border Radius** | 2px (sharp, institutional) |
| **Motion** | Subtle fade-in, translateY reveals |

<br/>

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES2017+) |
| **Backend / Auth** | [Supabase](https://supabase.com) (PostgreSQL + Auth + RLS) |
| **Fonts** | Google Fonts — Cinzel, Crimson Pro, Noto Sans Bengali |
| **Supabase SDK** | `@supabase/supabase-js@2` via CDN |
| **Hosting** | GitHub Pages / Any static host |

No build tools, no bundlers, no frameworks — runs directly in the browser.

<br/>

---

## 🗓️ Development Roadmap

| Phase | Page | Status |
|---|---|---|
| ✅ Phase 1 | Database schema, RLS, Supabase setup | **Complete** |
| ✅ Phase 2 | File structure, assets, BAUET logo | **Complete** |
| ✅ Phase 3A | `index.html` — Landing page | **Complete** |
| ✅ Phase 3B | `auth.html` — Login & Registration | **Complete** |
| ✅ Phase 3C | `student-dashboard.html` | **Complete** |
| ✅ Phase 3D | `officer-dashboard.html` | **Complete** |
| ✅ Phase 3E | `admin-panel.html` | **Complete** |
| 🔄 Phase 3F | `authority-dashboard.html` | *Planned* |
| 🔜 Phase 3G | `notices.html` — Public notice board | *Planned* |
| 🔜 Phase 4 | Polish, shared utilities, mobile audit | *Planned* |

<br/>

---

## 📜 License

This project is developed for **BAUET (Bangladesh Army University of Engineering & Technology)** as an internal student support system. All rights reserved.

<br/>

---

<div align="center">

**Built with 💚 for BAUET**

*Bangladesh Army University of Engineering & Technology*  
*Natore, Rajshahi Division, Bangladesh*

<br/>

```
★ KNOWLEDGE & TECHNOLOGY ★
```

</div>
