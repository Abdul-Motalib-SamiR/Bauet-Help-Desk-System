# Member 3 — Password Reset · 404 Page · Polish

**Branch:** `Nakib__ID_29`  
**Files to create:** `reset-password.html` · `css/reset.css` · `js/reset.js` · `404.html` · `vercel.json`  
**Files to edit:** `auth.html` · `css/dashboard-base.css` · `js/utils.js`

---

### Forgot Password Link (auth.html edit)
- [ ] Add "Forgot password?" link below password field in login form
- [ ] Link points to `reset-password.html`
- [ ] Bilingual label (EN + BN)

### Password Reset Page — State A (request form)
- [ ] Same two-panel layout as `auth.html`
- [ ] Email input field
- [ ] "Send Reset Link" button
- [ ] Success message after email sent
- [ ] Error toast on failure

### Password Reset Page — State B (new password form)
- [ ] Detect recovery token in URL hash on page load
- [ ] Show new password form when token present
- [ ] New password input with show/hide toggle
- [ ] Confirm password input with show/hide toggle
- [ ] Password match validation
- [ ] Minimum 8 characters validation
- [ ] Success overlay on update → redirect to auth.html
- [ ] Error toast on failure

### 404 Page
- [ ] Create `404.html`
- [ ] Full-page centred layout, no sidebar
- [ ] BAUET logo small centered at top
- [ ] "404" in huge Cinzel gold text
- [ ] "Page Not Found" heading bilingual
- [ ] Description text bilingual
- [ ] Two buttons: Back to Home + Go to Login
- [ ] Subtle BAUET watermark background text
- [ ] Deep green theme matching rest of site
- [ ] Create `vercel.json` to route unknown URLs to 404.html

### Skeleton Loading States (dashboard-base.css edit)
- [ ] Add skeleton shimmer CSS animation
- [ ] Add `.skeleton` and `.skeleton-line` utility classes
- [ ] Add `.skeleton-num` class for stat card placeholders

### Network Error Handling (utils.js edit)
- [ ] Add global unhandled rejection listener
- [ ] Show toast on network/fetch errors

### Mobile Responsiveness Audit
- [ ] Test `index.html` at 375px — fix any overflow
- [ ] Test `auth.html` at 375px — form usable on mobile
- [ ] Test `student-dashboard.html` — sidebar closes on nav click
- [ ] Test `admin-panel.html` — tables scroll horizontally on mobile
- [ ] Add `data-table-wrap` scroll wrapper where needed
