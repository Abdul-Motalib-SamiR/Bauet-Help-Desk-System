# Member : Samir _ Testing · Admin Enhancements · RLS Fixes
  
**Files to edit:** `admin-panel.html` · `js/admin.js` · `supabase_setup.sql`  

---

### Functions needs to update or resolve

**Auth flows**
- [x] solve email confirmation issue
- [x] run trigger sql in supabase
- [x] update sql code to remove auto admin selection
- [x] update auth.js for solve authentication issue

### End-to-End Testing

**Auth flows**
- [x] Register as student → confirm email → land on dashboard
- [ ] Register as officer → see pending screen
- [ ] Login wrong password → correct error shown
- [ ] Login unconfirmed email → correct message shown
- [X] Login as student → goes to student dashboard
- [ ] Login as officer → goes to officer dashboard
- [x] Login as admin → goes to admin panel
- [ ] Access officer dashboard as student → redirected away

**Student dashboard**
- [ ] Submit ticket → appears in My Tickets
- [ ] Status badges display correctly
- [ ] Click ticket → modal opens with correct data
- [ ] Send reply → appears in thread
- [ ] Filter by status works
- [ ] Language toggle works throughout
- [ ] Sign out works

**Officer dashboard**
- [ ] All tickets visible in queue
- [ ] Assign to Me button works
- [ ] Change ticket status works
- [ ] Reply visible to student
- [ ] Post notice → shows in student notices tab

**Admin panel**
- [x] Role request visible after officer registration
- [ ] Approve request → user can log in as officer
- [ ] Reject request → status updates
- [ ] Edit user role → updates correctly
- [ ] Disable user → login blocked
- [ ] Category toggle → affects student dropdown
- [x] Sign out works
### Admin Panel — FAQ Management (new feature)
- [ ] Add FAQs nav item to sidebar
- [ ] FAQs section shows all existing FAQs in a table
- [ ] Add FAQ modal — question EN, question BN, answer EN, answer BN, category, order
- [ ] Save new FAQ to database
- [ ] Edit FAQ — pre-fill modal with existing data
- [ ] Delete FAQ with confirm dialog
- [ ] Reorder FAQs with up/down buttons

### Admin Panel — Ticket Reassignment (new feature)
- [ ] Add "Reassign" button per row in All Tickets table
- [ ] Reassign modal with officers dropdown
- [ ] Save updates ticket's officer_id

### Admin Panel — Force Close Ticket (new feature)
- [ ] Add "Force Close" button per row in All Tickets table
- [ ] Confirm dialog before closing
- [ ] Updates status to closed and sets resolved_at

### Admin Panel — Stats Enhancement
- [ ] Add "This Month" stat card to overview
- [ ] Add tickets by category count summary to overview

### Supabase RLS Fixes
- [ ] Fix ticket update policy so assigned officers can update their tickets
- [ ] Fix notices policy so officers can delete their own notices
- [ ] Add category management policy for admin writes
- [ ] Run and verify each fix works

### Cross-Browser Testing
- [ ] Chrome — full site walkthrough
- [ ] Firefox — full site walkthrough
- [ ] Edge — full site walkthrough
- [ ] Chrome Mobile — full site walkthrough
- [ ] Fonts render correctly on all browsers
- [ ] Bengali text renders correctly
- [ ] No console errors on any page

### Final Pre-Launch
- [ ] Supabase redirect URL whitelist includes Vercel domain
- [ ] All other members' pages work after merge
- [ ] No leftover console.log statements in any JS file
- [ ] `supabase_setup.sql` updated with RLS fixes
- [ ] README updated to reflect all features complete