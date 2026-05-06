// ─────────────────────────────────────────────
// BAUET Help Desk — reset.js
// Password reset page — State A & State B
// ─────────────────────────────────────────────

var _toastTimer;
var currentLang = localStorage.getItem('bauet-lang') || 'en';

// ── LANGUAGE ──────────────────────────────────
function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('bauet-lang', lang);

    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-bn').classList.toggle('active', lang === 'bn');

    document.querySelectorAll('.en-inline').forEach(function(el) {
        el.style.display = lang === 'en' ? '' : 'none';
    });
    document.querySelectorAll('.bn-inline').forEach(function(el) {
        el.style.display = lang === 'bn' ? '' : 'none';
    });
}

// ── TOAST ─────────────────────────────────────
function showToast(title, msg, type) {
    type = type || 'default';
    var t = document.getElementById('toast');
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-msg').textContent   = msg;
    t.className = 'toast show toast-' + type;
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(function() { t.classList.remove('show'); }, 5500);
}

// ── PASSWORD SHOW / HIDE ──────────────────────
function togglePass(inputId, btn) {
    var input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.textContent = '🙈';
    } else {
        input.type = 'password';
        btn.textContent = '👁';
    }
}

// ── DETECT WHICH STATE TO SHOW ────────────────
(function detectState() {
    var hash = window.location.hash;
    var isRecovery = hash && hash.includes('access_token') && hash.includes('type=recovery');

    if (isRecovery) {
        // Show loading briefly while Supabase parses the token from the URL
        showState('loading');
        setTimeout(function() {
            showState('newpass');
            // Clean the ugly hash from the URL bar
            history.replaceState(null, '', window.location.pathname);
        }, 1200);
    } else {
        showState('request');
    }

    setLang(currentLang);
})();

function showState(state) {
    document.getElementById('state-request').style.display  = state === 'request' ? '' : 'none';
    document.getElementById('state-newpass').style.display  = state === 'newpass' ? '' : 'none';
    document.getElementById('state-loading').style.display  = state === 'loading' ? '' : 'none';
}

// ── STATE A — REQUEST RESET EMAIL ─────────────
async function handleRequestReset(e) {
    e.preventDefault();

    var email = document.getElementById('reset-email').value.trim();
    if (!email) return;

    var btn = document.getElementById('btn-request');
    btn.classList.add('loading');
    btn.disabled = true;

    var result = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://bauet-help-desk-system.vercel.app/reset-password.html'
    });

    btn.classList.remove('loading');
    btn.disabled = false;

    if (result.error) {
        showToast(
            currentLang === 'bn' ? 'ত্রুটি' : 'Error',
            result.error.message,
            'error'
        );
        return;
    }

    // Hide the form, show the success message
    document.getElementById('request-form').style.display = 'none';
    document.getElementById('sent-msg').style.display = '';
    setLang(currentLang);
}

// ── STATE B — SET NEW PASSWORD ─────────────────
async function handleSetNewPassword(e) {
    e.preventDefault();

    var newPass     = document.getElementById('new-password').value;
    var confirmPass = document.getElementById('confirm-password').value;
    var mismatchEl  = document.getElementById('pass-mismatch');

    // Validate length
    if (newPass.length < 8) {
        showToast(
            currentLang === 'bn' ? 'দুর্বল পাসওয়ার্ড' : 'Too Short',
            currentLang === 'bn'
                ? 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে।'
                : 'Password must be at least 8 characters.',
            'error'
        );
        return;
    }

    // Validate match
    if (newPass !== confirmPass) {
        mismatchEl.style.display = '';
        setLang(currentLang);
        document.getElementById('confirm-password').focus();
        return;
    }

    mismatchEl.style.display = 'none';

    var btn = document.getElementById('btn-newpass');
    btn.classList.add('loading');
    btn.disabled = true;

    // Supabase v2 automatically sets the session from the URL recovery token
    var result = await sb.auth.updateUser({ password: newPass });

    btn.classList.remove('loading');
    btn.disabled = false;

    if (result.error) {
        showToast(
            currentLang === 'bn' ? 'ত্রুটি' : 'Error',
            result.error.message,
            'error'
        );
        return;
    }

    // Show success overlay, then redirect to auth
    var overlay = document.getElementById('success-overlay');
    document.getElementById('success-heading').textContent =
        currentLang === 'bn' ? 'পাসওয়ার্ড আপডেট হয়েছে!' : 'Password Updated!';
    document.getElementById('success-sub').textContent =
        currentLang === 'bn'
            ? 'সাইন ইন পেজে নিয়ে যাওয়া হচ্ছে...'
            : 'Redirecting you to sign in...';
    overlay.classList.add('show');

    // Sign out first so they login fresh
    await sb.auth.signOut();

    setTimeout(function() {
        window.location.href = 'auth.html';
    }, 2200);
}
