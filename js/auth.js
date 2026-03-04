// ─────────────────────────────────────────────
// BAUET Help Desk — auth.js
// Handles: Login, Register, Role Requests
// ─────────────────────────────────────────────

const { createClient } = supabase;
const SUPABASE_URL  = 'https://ftqivgvszdihqyjgwsns.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cWl2Z3ZzemRpaHF5amd3c25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzA1NTcsImV4cCI6MjA4NzY0NjU1N30.u-djLiFv9g8zA0F1WlBXs0T30fuSWUCQLJb_dS3csaM';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// Roles that need admin approval before being granted
const RESTRICTED_ROLES = ['officer', 'authority', 'admin'];

var currentLang = localStorage.getItem('bauet-lang') || 'en';

// ─────────────────────────────────────────────
// LANGUAGE
// ─────────────────────────────────────────────
function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('bauet-lang', lang);

    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        var txt = btn.textContent.trim();
        btn.classList.toggle('active',
            (lang === 'en' && txt === 'EN') || (lang === 'bn' && txt === 'বাং')
        );
    });

    document.querySelectorAll('.en-inline').forEach(function(el) {
        el.style.display = lang === 'en' ? '' : 'none';
    });
    document.querySelectorAll('.bn-inline').forEach(function(el) {
        el.style.display = lang === 'bn' ? '' : 'none';
    });
}

// ─────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────
function switchTab(tab) {
    document.querySelectorAll('.form-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('panel-' + tab).classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('auth-tabs').style.display = 'flex';
    document.getElementById('pending-screen').classList.remove('active');
}

// ─────────────────────────────────────────────
// PASSWORD TOGGLE
// ─────────────────────────────────────────────
function togglePass(id, btn) {
    var inp = document.getElementById(id);
    if (inp.type === 'password') {
        inp.type = 'text';
        btn.textContent = '🙈';
    } else {
        inp.type = 'password';
        btn.textContent = '👁';
    }
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────
var toastTimer;
function showToast(title, msg, type) {
    type = type || 'default';
    var t = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent   = msg;
    t.className = 'toast show ' + type + '-toast';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { t.classList.remove('show'); }, 5000);
}

// ─────────────────────────────────────────────
// SUCCESS OVERLAY
// ─────────────────────────────────────────────
function showSuccess(title, msg, btnText, redirect) {
    document.getElementById('success-title').innerHTML = title;
    document.getElementById('success-msg').innerHTML   = msg;
    var btn = document.getElementById('success-btn');
    btn.textContent = btnText;
    btn.onclick     = function() { window.location.href = redirect; };
    document.getElementById('success-overlay').classList.add('show');
}

// ─────────────────────────────────────────────
// PENDING ROLE REQUEST SCREEN
// ─────────────────────────────────────────────
function showPendingScreen(roleName) {
    document.getElementById('auth-tabs').style.display = 'none';
    document.querySelectorAll('.form-panel').forEach(function(p) { p.classList.remove('active'); });

    var badge = document.getElementById('pending-role-badge');
    badge.textContent = (currentLang === 'bn')
        ? roleName + ' প্রবেশাধিকার'
        : roleName.charAt(0).toUpperCase() + roleName.slice(1) + ' Access';

    document.getElementById('pending-screen').classList.add('active');
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();

    var btn = document.getElementById('btn-login');
    btn.classList.add('loading');
    btn.disabled = true;

    var email    = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;

    try {
        var result = await sb.auth.signInWithPassword({ email: email, password: password });
        if (result.error) throw result.error;

        var profileResult = await sb.from('profiles')
            .select('role, full_name, is_active')
            .eq('id', result.data.user.id)
            .single();

        if (profileResult.error || !profileResult.data) {
            throw new Error('Could not load your profile. Please contact admin.');
        }

        var profile = profileResult.data;

        if (!profile.is_active) {
            await sb.auth.signOut();
            throw new Error(
                currentLang === 'bn'
                    ? 'আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে। অ্যাডমিনের সাথে যোগাযোগ করুন।'
                    : 'Your account has been disabled. Please contact the admin.'
            );
        }

        var dashboardMap = {
            student:   'student-dashboard.html',
            officer:   'officer-dashboard.html',
            authority: 'authority-dashboard.html',
            admin:     'admin-panel.html'
        };

        showSuccess(
            currentLang === 'bn' ? 'আবার স্বাগতম!' : 'Welcome Back!',
            currentLang === 'bn'
                ? 'সফলভাবে সাইন ইন হয়েছে। ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...'
                : 'Signed in as ' + profile.full_name + '. Redirecting...',
            currentLang === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard',
            dashboardMap[profile.role] || 'student-dashboard.html'
        );

    } catch (err) {
        var msg = err.message || 'Login failed.';
        if (msg.includes('Invalid login credentials')) {
            msg = currentLang === 'bn'
                ? 'ইমেইল বা পাসওয়ার্ড ভুল।'
                : 'Invalid email or password.';
        }
        if (msg.includes('Email not confirmed')) {
            msg = currentLang === 'bn'
                ? 'আপনার ইমেইল এখনও যাচাই হয়নি। ইনবক্স চেক করুন এবং কনফার্ম লিংকে ক্লিক করুন।'
                : 'Email not confirmed yet. Please check your inbox and click the confirmation link.';
        }
        showToast(currentLang === 'bn' ? 'লগইন ব্যর্থ' : 'Login Failed', msg, 'error');

        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
async function handleRegister(e) {
    e.preventDefault();

    var password = document.getElementById('reg-password').value;
    var confirm  = document.getElementById('reg-confirm').value;

    if (password !== confirm) {
        document.getElementById('reg-confirm-err').classList.add('show');
        return;
    }
    document.getElementById('reg-confirm-err').classList.remove('show');

    var btn = document.getElementById('btn-register');
    btn.classList.add('loading');
    btn.disabled = true;

    var firstName  = document.getElementById('reg-firstname').value.trim();
    var lastName   = document.getElementById('reg-lastname').value.trim();
    var email      = document.getElementById('reg-email').value.trim();
    var studentId  = document.getElementById('reg-student-id').value.trim();
    var roleChoice = document.querySelector('input[name="role"]:checked').value;
    var fullName   = firstName + ' ' + lastName;
    var isRestricted = RESTRICTED_ROLES.includes(roleChoice);

    // Restricted roles are registered as 'student' first, pending approval
    var registrationRole = isRestricted ? 'student' : roleChoice;

    try {
        var result = await sb.auth.signUp({
            email:    email,
            password: password,
            options: {
                data: {
                    full_name:  fullName,
                    student_id: studentId,
                    role:       registrationRole
                },
                // After email confirmation, redirect back to auth page
                emailRedirectTo: 'https://bauet-help-desk-system.vercel.app/auth.html'
            }
        });

        if (result.error) throw result.error;

        var userId = result.data.user ? result.data.user.id : null;

        // Save profile immediately (works even before email confirmation)
        if (userId) {
            await sb.from('profiles').upsert({
                id:         userId,
                full_name:  fullName,
                email:      email,
                student_id: studentId,
                role:       registrationRole,
                created_at: new Date().toISOString()
            });

            // If restricted role requested, file a role upgrade request
            if (isRestricted) {
                await sb.from('role_requests').insert({
                    user_id:        userId,
                    requested_role: roleChoice,
                    status:         'pending',
                    note:           'Self-registered, requested role: ' + roleChoice
                });
            }
        }

        if (isRestricted) {
            showPendingScreen(roleChoice);
        } else {
            // Show confirm-email notice
            showSuccess(
                currentLang === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে!' : 'Account Created!',
                currentLang === 'bn'
                    ? 'স্বাগতম, ' + fullName + '! আপনার ইমেইলে একটি নিশ্চিতকরণ লিংক পাঠানো হয়েছে। লিংকে ক্লিক করার পরে সাইন ইন করুন।'
                    : 'Welcome, ' + fullName + '! A confirmation link has been sent to <strong>' + email + '</strong>. Click it to activate your account, then sign in.',
                currentLang === 'bn' ? 'সাইন ইনে যান' : 'Go to Sign In',
                'auth.html'
            );
        }

    } catch (err) {
        var msg = err.message || 'Registration failed.';
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('User already registered')) {
            msg = currentLang === 'bn'
                ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।'
                : 'An account with this email already exists.';
        }
        showToast(currentLang === 'bn' ? 'নিবন্ধন ব্যর্থ' : 'Registration Failed', msg, 'error');

        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────────
// HANDLE EMAIL CONFIRMATION REDIRECT
// When Supabase redirects back after confirmation
// link click, auto sign-in and go to dashboard
// ─────────────────────────────────────────────
async function handleAuthCallback() {
    var hash = window.location.hash;
    if (!hash || !hash.includes('access_token')) return;

    // Show a brief loading state
    document.getElementById('auth-tabs').style.display = 'none';
    document.querySelectorAll('.form-panel').forEach(function(p) { p.classList.remove('active'); });

    var loadingDiv = document.createElement('div');
    loadingDiv.style.cssText = 'text-align:center;padding:60px 20px';
    loadingDiv.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.9rem;color:var(--gold);letter-spacing:2px;margin-bottom:16px">VERIFYING EMAIL...</div>' +
        '<div style="width:32px;height:32px;border:2px solid rgba(200,168,75,0.2);border-top-color:var(--gold);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto"></div>';
    document.querySelector('.form-wrapper').appendChild(loadingDiv);

    try {
        // Supabase JS v2 automatically parses the token from the URL hash
        var sessionResult = await sb.auth.getSession();

        if (!sessionResult.data || !sessionResult.data.session) {
            // Token may have expired — ask them to log in manually
            loadingDiv.remove();
            document.getElementById('auth-tabs').style.display = 'flex';
            document.getElementById('panel-login').classList.add('active');
            history.replaceState(null, '', window.location.pathname);
            showToast(
                currentLang === 'bn' ? 'লিংক মেয়াদোত্তীর্ণ' : 'Link Expired',
                currentLang === 'bn'
                    ? 'কনফার্মেশন লিংকটি মেয়াদোত্তীর্ণ। অনুগ্রহ করে সাইন ইন করুন।'
                    : 'The confirmation link has expired. Please sign in manually.',
                'warning'
            );
            return;
        }

        var user    = sessionResult.data.session.user;
        var urlParams = new URLSearchParams(hash.substring(1));
        var type    = urlParams.get('type'); // 'signup' or 'recovery'

        // Load their profile to get role
        var profileResult = await sb.from('profiles')
            .select('role, full_name, is_active')
            .eq('id', user.id)
            .single();

        // Clean the ugly token hash from the URL immediately
        history.replaceState(null, '', window.location.pathname);

        if (profileResult.error || !profileResult.data) {
            // Profile missing — show sign-in form with success toast
            loadingDiv.remove();
            document.getElementById('auth-tabs').style.display = 'flex';
            document.getElementById('panel-login').classList.add('active');
            showToast(
                currentLang === 'bn' ? 'ইমেইল যাচাই সম্পন্ন!' : 'Email Confirmed!',
                currentLang === 'bn'
                    ? 'অ্যাকাউন্ট সক্রিয়। সাইন ইন করুন।'
                    : 'Account activated. Please sign in to continue.',
                'success'
            );
            return;
        }

        var profile = profileResult.data;
        var dashboardMap = {
            student:   'student-dashboard.html',
            officer:   'officer-dashboard.html',
            authority: 'authority-dashboard.html',
            admin:     'admin-panel.html'
        };

        // Auto-redirect to their dashboard — no need to sign in again
        showSuccess(
            currentLang === 'bn' ? 'ইমেইল যাচাই সম্পন্ন!' : '✅ Email Verified!',
            currentLang === 'bn'
                ? 'স্বাগতম, ' + profile.full_name + '! আপনার অ্যাকাউন্ট সক্রিয় হয়েছে। ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...'
                : 'Welcome, ' + profile.full_name + '! Your account is now active. Taking you to your dashboard...',
            currentLang === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard',
            dashboardMap[profile.role] || 'student-dashboard.html'
        );

        // Auto-redirect after 2.5 seconds without waiting for button click
        setTimeout(function() {
            window.location.href = dashboardMap[profile.role] || 'student-dashboard.html';
        }, 2500);

    } catch (err) {
        loadingDiv.remove();
        document.getElementById('auth-tabs').style.display = 'flex';
        document.getElementById('panel-login').classList.add('active');
        history.replaceState(null, '', window.location.pathname);
        showToast('Error', err.message || 'Verification failed. Please try signing in.', 'error');
    }
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
(function init() {
    // Handle email confirmation redirect
    handleAuthCallback();

    // URL tab param
    var params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') switchTab('register');

    // Mobile header
    if (window.innerWidth <= 900) {
        var mh = document.getElementById('mobile-header');
        if (mh) mh.style.display = 'flex';
    }

    // If already logged in, show notice
    sb.auth.getSession().then(function(result) {
        if (result.data && result.data.session) {
            showToast(
                currentLang === 'bn' ? 'ইতিমধ্যে লগইন' : 'Already Signed In',
                currentLang === 'bn'
                    ? 'আপনি ইতিমধ্যে লগ ইন আছেন।'
                    : 'You are already signed in.',
                'success'
            );
        }
    });

    setLang(currentLang);
})();
