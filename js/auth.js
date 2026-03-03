
// BAUET Help Desk — auth.js
// Handles: Login, Register, OTP, Role Requests
// ─────────────────────────────────────────────

const { createClient } = supabase;
const SUPABASE_URL  = 'https://ftqivgvszdihqyjgwsns.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0cWl2Z3ZzemRpaHF5amd3c25zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNzA1NTcsImV4cCI6MjA4NzY0NjU1N30.u-djLiFv9g8zA0F1WlBXs0T30fuSWUCQLJb_dS3csaM';
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

// Roles that require admin approval before being granted
const RESTRICTED_ROLES = ['officer', 'authority', 'admin'];

// OTP flow state
var otpState = {
    email:       '',
    type:        '',   // 'signup' or 'email'
    role:        '',
    profileData: null,
    timer:       null,
    seconds:     600
};

var currentLang = localStorage.getItem('bauet-lang') || 'en';


// LANGUAGE

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('bauet-lang', lang);

    document.querySelectorAll('.lang-btn').forEach(function(btn) {
        var txt = btn.textContent.trim();
        btn.classList.toggle('active', (lang === 'en' && txt === 'EN') || (lang === 'bn' && txt === 'বাং'));
    });

    document.querySelectorAll('.en-inline').forEach(function(el) {
        el.style.display = lang === 'en' ? '' : 'none';
    });
    document.querySelectorAll('.bn-inline').forEach(function(el) {
        el.style.display = lang === 'bn' ? '' : 'none';
    });
}


// TAB SWITCHING

function switchTab(tab) {
    document.querySelectorAll('.form-panel').forEach(function(p) { p.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('panel-' + tab).classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}


// SHOW / HIDE SECTIONS

function showOtpStep() {
    document.getElementById('auth-tabs').style.display = 'none';
    document.querySelectorAll('.form-panel').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('pending-screen').classList.remove('active');
    document.getElementById('otp-step').classList.add('active');
    document.getElementById('otp-0').focus();
    startOtpTimer();
}

function showPendingScreen(roleName) {
    document.getElementById('auth-tabs').style.display = 'none';
    document.querySelectorAll('.form-panel').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('otp-step').classList.remove('active');
    var badge = document.getElementById('pending-role-badge');
    badge.textContent = (currentLang === 'bn')
        ? roleName + ' প্রবেশাধিকার'
        : roleName.charAt(0).toUpperCase() + roleName.slice(1) + ' Access';
    document.getElementById('pending-screen').classList.add('active');
}

function showFormArea() {
    document.getElementById('auth-tabs').style.display = 'flex';
    document.getElementById('otp-step').classList.remove('active');
    document.getElementById('pending-screen').classList.remove('active');
}

function cancelOtp() {
    clearOtpTimer();
    clearOtpBoxes();
    showFormArea();
    var tab = otpState.type === 'signup' ? 'register' : 'login';
    switchTab(tab);
}

// PASSWORD TOGGLE

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

// TOAST

var toastTimer;
function showToast(title, msg, type) {
    type = type || 'default';
    var t = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent = msg;
    t.className = 'toast show ' + type + '-toast';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() { t.classList.remove('show'); }, 4500);
}


// SUCCESS OVERLAY

function showSuccess(title, msg, btnText, redirect) {
    document.getElementById('success-title').innerHTML = title;
    document.getElementById('success-msg').innerHTML = msg;
    var btn = document.getElementById('success-btn');
    btn.textContent = btnText;
    btn.onclick = function() { window.location.href = redirect; };
    document.getElementById('success-overlay').classList.add('show');
}


// OTP TIMER

function startOtpTimer() {
    clearOtpTimer();
    otpState.seconds = 600;
    updateTimerDisplay();
    otpState.timer = setInterval(function() {
        otpState.seconds--;
        updateTimerDisplay();
        if (otpState.seconds <= 0) {
            clearOtpTimer();
            document.getElementById('otp-timer-expired').style.display = '';
            document.getElementById('otp-timer-count').style.display = 'none';
            document.getElementById('otp-timer-count-bn').style.display = 'none';
            document.getElementById('resend-btn').disabled = false;
        }
    }, 1000);
    document.getElementById('resend-btn').disabled = true;
    document.getElementById('otp-timer-expired').style.display = 'none';
    document.getElementById('otp-timer-count').style.display = '';
    document.getElementById('otp-timer-count-bn').style.display = '';
}

function updateTimerDisplay() {
    var m = Math.floor(otpState.seconds / 60);
    var s = otpState.seconds % 60;
    var display = m + ':' + (s < 10 ? '0' : '') + s;
    document.getElementById('otp-timer-count').textContent = display;
    document.getElementById('otp-timer-count-bn').textContent = display;
}

function clearOtpTimer() {
    if (otpState.timer) { clearInterval(otpState.timer); otpState.timer = null; }
}

// OTP BOX BEHAVIOUR

function initOtpBoxes() {
    var boxes = document.querySelectorAll('.otp-box');
    boxes.forEach(function(box, i) {
        box.addEventListener('input', function(e) {
            var val = e.target.value.replace(/\D/g, '');
            e.target.value = val.slice(-1);
            e.target.classList.toggle('filled', !!val);
            if (val && i < 5) boxes[i + 1].focus();
        });

        box.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !box.value && i > 0) {
                boxes[i - 1].focus();
                boxes[i - 1].value = '';
                boxes[i - 1].classList.remove('filled');
            }
        });

        box.addEventListener('paste', function(e) {
            e.preventDefault();
            var pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
            pasted.split('').slice(0, 6).forEach(function(digit, idx) {
                if (boxes[idx]) {
                    boxes[idx].value = digit;
                    boxes[idx].classList.add('filled');
                }
            });
            var next = Math.min(pasted.length, 5);
            boxes[next].focus();
        });
    });
}

function clearOtpBoxes() {
    document.querySelectorAll('.otp-box').forEach(function(b) {
        b.value = '';
        b.classList.remove('filled', 'error-box');
    });
}

function getOtpValue() {
    return Array.from(document.querySelectorAll('.otp-box')).map(function(b) { return b.value; }).join('');
}


// RESEND OTP

async function resendOtp() {
    var btn = document.getElementById('resend-btn');
    btn.disabled = true;
    try {
        await sb.auth.signInWithOtp({
            email: otpState.email,
            options: { shouldCreateUser: false }
        });
        clearOtpBoxes();
        startOtpTimer();
        showToast(
            currentLang === 'bn' ? 'কোড পুনরায় পাঠানো হয়েছে' : 'Code Resent',
            currentLang === 'bn' ? 'নতুন OTP আপনার ইমেইলে পাঠানো হয়েছে।' : 'A new OTP has been sent to your email.',
            'success'
        );
    } catch (err) {
        showToast(
            currentLang === 'bn' ? 'পুনরায় পাঠাতে ব্যর্থ' : 'Resend Failed',
            err.message || 'Could not resend OTP.',
            'error'
        );
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────────
// HANDLE LOGIN
// Flow: signInWithPassword → signOut → signInWithOtp → showOtpStep
// ─────────────────────────────────────────────
async function handleLogin(e) {
    e.preventDefault();

    var btn = document.getElementById('btn-login');
    btn.classList.add('loading');
    btn.disabled = true;

    var email    = document.getElementById('login-email').value.trim();
    var password = document.getElementById('login-password').value;

    try {
        // Step 1: Validate credentials
        var loginResult = await sb.auth.signInWithPassword({ email: email, password: password });
        if (loginResult.error) throw loginResult.error;

        // Step 2: Immediately sign out — session will be granted only after OTP
        await sb.auth.signOut();

        // Step 3: Send OTP to email
        var otpResult = await sb.auth.signInWithOtp({
            email: email,
            options: { shouldCreateUser: false }
        });
        if (otpResult.error) throw otpResult.error;

        // Step 4: Show OTP screen
        otpState.email = email;
        otpState.type  = 'email';
        document.getElementById('otp-email-display').textContent    = email;
        document.getElementById('otp-email-display-bn').textContent = email;
        showOtpStep();

    } catch (err) {
        var msg = err.message || 'Login failed.';
        if (msg.includes('Invalid login credentials')) {
            msg = currentLang === 'bn' ? 'ইমেইল বা পাসওয়ার্ড ভুল।' : 'Invalid email or password.';
        }
        if (msg.includes('Email not confirmed')) {
            msg = currentLang === 'bn' ? 'অনুগ্রহ করে প্রথমে আপনার ইমেইল যাচাই করুন।' : 'Please verify your email first.';
        }
        showToast(currentLang === 'bn' ? 'লগইন ব্যর্থ' : 'Login Failed', msg, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────────
// HANDLE REGISTER
// Flow: signUp → store profile data → showOtpStep
// Restricted roles: register as student + create role_request after OTP
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

    // Always register as 'student' — restricted roles go through approval
    var registrationRole = RESTRICTED_ROLES.includes(roleChoice) ? 'student' : roleChoice;

    try {
        var result = await sb.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name:  fullName,
                    student_id: studentId,
                    role:       registrationRole
                }
            }
        });

        if (result.error) throw result.error;

        // Store profile data — will be saved to profiles table after OTP
        otpState.email       = email;
        otpState.type        = 'signup';
        otpState.role        = roleChoice;
        otpState.profileData = {
            id:         result.data.user ? result.data.user.id : null,
            full_name:  fullName,
            email:      email,
            student_id: studentId,
            role:       registrationRole
        };

        document.getElementById('otp-email-display').textContent    = email;
        document.getElementById('otp-email-display-bn').textContent = email;
        showOtpStep();

    } catch (err) {
        var msg = err.message || 'Registration failed.';
        if (msg.includes('already registered') || msg.includes('already exists') || msg.includes('User already registered')) {
            msg = currentLang === 'bn'
                ? 'এই ইমেইল দিয়ে ইতিমধ্যে অ্যাকাউন্ট আছে।'
                : 'An account with this email already exists.';
        }
        showToast(currentLang === 'bn' ? 'নিবন্ধন ব্যর্থ' : 'Registration Failed', msg, 'error');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────────
// VERIFY OTP
// ─────────────────────────────────────────────
async function verifyOtp() {
    var code = getOtpValue();
    if (code.length < 6) {
        document.querySelectorAll('.otp-box').forEach(function(b) {
            if (!b.value) b.classList.add('error-box');
        });
        showToast(
            currentLang === 'bn' ? 'অসম্পূর্ণ কোড' : 'Incomplete Code',
            currentLang === 'bn' ? 'অনুগ্রহ করে সম্পূর্ণ ৬-সংখ্যার কোড দিন।' : 'Please enter the complete 6-digit code.',
            'error'
        );
        return;
    }

    var btn = document.getElementById('btn-verify-otp');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        var verifyResult = await sb.auth.verifyOtp({
            email: otpState.email,
            token: code,
            type:  otpState.type
        });

        if (verifyResult.error) throw verifyResult.error;

        clearOtpTimer();

        if (otpState.type === 'signup') {
            // After signup OTP — save profile and possibly create role_request
            await finishRegistration(verifyResult.data.user);
        } else {
            // After login OTP — load profile and redirect
            await finishLogin(verifyResult.data.user);
        }

    } catch (err) {
        var msg = err.message || 'Verification failed.';
        if (msg.includes('Token has expired') || msg.includes('otp_expired')) {
            msg = currentLang === 'bn' ? 'কোডের মেয়াদ শেষ। পুনরায় পাঠান।' : 'Code has expired. Please resend.';
            document.getElementById('resend-btn').disabled = false;
        } else if (msg.includes('Invalid') || msg.includes('invalid')) {
            msg = currentLang === 'bn' ? 'ভুল কোড। আবার চেষ্টা করুন।' : 'Incorrect code. Please try again.';
        }

        document.querySelectorAll('.otp-box').forEach(function(b) { b.classList.add('error-box'); });
        showToast(currentLang === 'bn' ? 'যাচাই ব্যর্থ' : 'Verification Failed', msg, 'error');

        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ─────────────────────────────────────────────
// FINISH REGISTRATION (after OTP verified)
// ─────────────────────────────────────────────
async function finishRegistration(user) {
    var pd = otpState.profileData;
    if (!pd) return;

    var uid = (user && user.id) ? user.id : pd.id;

    // Insert profile
    try {
        await sb.from('profiles').upsert({
            id:         uid,
            full_name:  pd.full_name,
            email:      pd.email,
            student_id: pd.student_id,
            role:       pd.role,
            created_at: new Date().toISOString()
        });
    } catch (profileErr) {
        console.warn('Profile save:', profileErr.message);
    }

    var requestedRole = otpState.role;
    var isRestricted  = RESTRICTED_ROLES.includes(requestedRole);

    if (isRestricted) {
        // Create a role upgrade request for admin to review
        try {
            await sb.from('role_requests').insert({
                user_id:        uid,
                requested_role: requestedRole,
                status:         'pending',
                note:           'Self-registered with requested role: ' + requestedRole
            });
        } catch (reqErr) {
            console.warn('Role request save:', reqErr.message);
        }

        // Sign out — they must wait for approval before meaningful access
        await sb.auth.signOut();
        showPendingScreen(requestedRole);

    } else {
        // Student — immediate access, redirect to dashboard
        showSuccess(
            currentLang === 'bn' ? 'অ্যাকাউন্ট তৈরি হয়েছে!' : 'Account Created!',
            currentLang === 'bn'
                ? 'স্বাগতম, ' + pd.full_name + '! ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...'
                : 'Welcome, ' + pd.full_name + '! Redirecting to your dashboard...',
            currentLang === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard',
            'student-dashboard.html'
        );
    }
}

// ─────────────────────────────────────────────
// FINISH LOGIN (after OTP verified)
// ─────────────────────────────────────────────
async function finishLogin(user) {
    var profileResult = await sb.from('profiles').select('role, full_name, is_active').eq('id', user.id).single();

    if (profileResult.error || !profileResult.data) {
        showToast(
            currentLang === 'bn' ? 'প্রোফাইল পাওয়া যায়নি' : 'Profile Not Found',
            currentLang === 'bn' ? 'আপনার প্রোফাইল লোড করতে সমস্যা হয়েছে।' : 'Could not load your profile.',
            'error'
        );
        return;
    }

    var profile = profileResult.data;

    if (!profile.is_active) {
        await sb.auth.signOut();
        showToast(
            currentLang === 'bn' ? 'অ্যাকাউন্ট নিষ্ক্রিয়' : 'Account Disabled',
            currentLang === 'bn' ? 'আপনার অ্যাকাউন্ট নিষ্ক্রিয় করা হয়েছে।' : 'Your account has been disabled. Contact admin.',
            'error'
        );
        return;
    }

    var dashboardMap = {
        'student':   'student-dashboard.html',
        'officer':   'officer-dashboard.html',
        'authority': 'authority-dashboard.html',
        'admin':     'admin-panel.html'
    };

    var redirect = dashboardMap[profile.role] || 'student-dashboard.html';

    showSuccess(
        currentLang === 'bn' ? 'আবার স্বাগতম!' : 'Welcome Back!',
        currentLang === 'bn'
            ? 'সাইন ইন সফল। ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে...'
            : 'Signed in as ' + profile.full_name + '. Redirecting...',
        currentLang === 'bn' ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard',
        redirect
    );
}

// ─────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────
(function init() {
    // URL params
    var params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'register') switchTab('register');

    // Mobile header
    if (window.innerWidth <= 900) {
        var mh = document.getElementById('mobile-header');
        if (mh) mh.style.display = 'flex';
    }

    // OTP boxes
    initOtpBoxes();

    // Check already logged in
    sb.auth.getSession().then(function(result) {
        if (result.data && result.data.session) {
            showToast(
                currentLang === 'bn' ? 'ইতিমধ্যে লগইন' : 'Already Signed In',
                currentLang === 'bn' ? 'আপনি ইতিমধ্যে লগ ইন আছেন।' : 'You are already logged in.',
                'success'
            );
        }
    });

    // Apply saved language
    setLang(currentLang);
})();
