// ─────────────────────────────────────────────
// BAUET Help Desk — notices.js
// Public notices & FAQ page — no login required
// ─────────────────────────────────────────────

var allNotices   = [];
var allFaqs      = [];
var activeFaqCat = 'all';
var openFaqId    = null;

// ── LANGUAGE ──────────────────────────────────
var currentLang = localStorage.getItem('bauet-lang') || 'en';

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

    // Re-render notices and FAQs to show the correct language text
    if (allNotices.length > 0) renderNotices(allNotices);
    if (allFaqs.length > 0)    renderFaqs(getFilteredFaqs());
}

// ── NAVBAR SCROLL SHRINK ──────────────────────
window.addEventListener('scroll', function() {
    var nav = document.getElementById('navbar');
    if (window.scrollY > 40) nav.classList.add('scrolled');
    else                      nav.classList.remove('scrolled');
});

// ── MOBILE MENU ───────────────────────────────
function toggleMobileMenu() {
    document.getElementById('mobile-menu').classList.toggle('open');
}

function closeMobileMenu() {
    document.getElementById('mobile-menu').classList.remove('open');
}

// ── INIT ──────────────────────────────────────
(async function init() {
    await Promise.all([
        loadNotices(),
        loadFaqs()
    ]);
    setLang(currentLang);
})();

// ── LOAD NOTICES ──────────────────────────────
async function loadNotices() {
    var spinner = document.getElementById('notices-spinner');

    var result = await sb
        .from('notices')
        .select('*')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false });

    spinner.style.display = 'none';

    if (result.error || !result.data) {
        document.getElementById('notices-list').innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-icon">📢</div>' +
            '<div class="empty-title">Could not load notices</div>' +
            '<div class="empty-msg">Please try again later.</div>' +
            '</div>';
        return;
    }

    allNotices = result.data;
    renderNotices(allNotices);
}

// ── RENDER NOTICES ────────────────────────────
function renderNotices(notices) {
    var el = document.getElementById('notices-list');

    if (!notices || notices.length === 0) {
        el.innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-icon">📢</div>' +
            '<div class="empty-title">No notices at this time</div>' +
            '<div class="empty-msg">Check back later for official announcements.</div>' +
            '</div>';
        return;
    }

    el.innerHTML = notices.map(function(n) {
        var pinBadge = n.is_pinned
            ? '<span class="pin-badge">📌 Pinned</span>'
            : '';

        // Pick title and body based on current language
        var title = (currentLang === 'bn' && n.title_bn) ? n.title_bn : n.title_en;
        var body  = (currentLang === 'bn' && n.body_bn)  ? n.body_bn  : n.body_en;

        var date = new Date(n.published_at).toLocaleDateString('en-GB', {
            day: '2-digit', month: 'short', year: 'numeric'
        });

        return '<div class="notice-card' + (n.is_pinned ? ' pinned' : '') + '">' +
            '<div class="notice-card-header">' +
            '<div>' +
            '<div class="notice-title">' + escHtml(title) + '</div>' +
            '<div class="notice-meta">' +
            '<span class="notice-date">' + date + '</span>' +
            pinBadge +
            '</div>' +
            '</div>' +
            '</div>' +
            '<div class="notice-body">' + escHtml(body).replace(/\n/g, '<br>') + '</div>' +
            '</div>';
    }).join('');
}

// ── SEARCH NOTICES (client-side) ──────────────
function filterNotices(query) {
    var q = query.toLowerCase().trim();
    if (!q) {
        renderNotices(allNotices);
        return;
    }
    var filtered = allNotices.filter(function(n) {
        return n.title_en.toLowerCase().includes(q) ||
               (n.title_bn && n.title_bn.toLowerCase().includes(q)) ||
               n.body_en.toLowerCase().includes(q);
    });
    renderNotices(filtered);
}

// ── LOAD FAQs ─────────────────────────────────
async function loadFaqs() {
    var spinner = document.getElementById('faq-spinner');

    var result = await sb
        .from('faqs')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

    spinner.style.display = 'none';

    if (result.error || !result.data) {
        document.getElementById('faq-list').innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-icon">❓</div>' +
            '<div class="empty-title">Could not load FAQs</div>' +
            '</div>';
        return;
    }

    allFaqs = result.data;
    renderFaqs(allFaqs);
}

// ── FILTER FAQs BY CATEGORY ───────────────────
function filterFaqs(cat, btn) {
    activeFaqCat = cat;
    openFaqId    = null; // close any open accordion on tab switch

    document.querySelectorAll('.faq-tab').forEach(function(b) {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    renderFaqs(getFilteredFaqs());
}

function getFilteredFaqs() {
    if (activeFaqCat === 'all') return allFaqs;
    return allFaqs.filter(function(f) { return f.category === activeFaqCat; });
}

// ── RENDER FAQs ───────────────────────────────
function renderFaqs(faqs) {
    var el = document.getElementById('faq-list');

    if (!faqs || faqs.length === 0) {
        el.innerHTML =
            '<div class="empty-state">' +
            '<div class="empty-icon">❓</div>' +
            '<div class="empty-title">No FAQs in this category</div>' +
            '<div class="empty-msg">Try selecting a different category above.</div>' +
            '</div>';
        return;
    }

    el.innerHTML = faqs.map(function(f) {
        var question = (currentLang === 'bn' && f.question_bn) ? f.question_bn : f.question_en;
        var answer   = (currentLang === 'bn' && f.answer_bn)   ? f.answer_bn   : f.answer_en;
        var isOpen   = openFaqId === f.id;

        return '<div class="faq-item' + (isOpen ? ' open' : '') + '" id="faq-' + f.id + '">' +
            '<div class="faq-question" onclick="toggleFaq(\'' + f.id + '\')">' +
            '<span class="faq-q-text">' + escHtml(question) + '</span>' +
            '<span class="faq-chevron">▼</span>' +
            '</div>' +
            '<div class="faq-answer">' +
            '<div class="faq-answer-text">' + escHtml(answer).replace(/\n/g, '<br>') + '</div>' +
            '</div>' +
            '</div>';
    }).join('');
}

// ── ACCORDION TOGGLE ──────────────────────────
function toggleFaq(id) {
    var clickedItem = document.getElementById('faq-' + id);
    var isAlreadyOpen = clickedItem.classList.contains('open');

    // Close any currently open FAQ
    if (openFaqId && openFaqId !== id) {
        var prev = document.getElementById('faq-' + openFaqId);
        if (prev) prev.classList.remove('open');
    }

    if (isAlreadyOpen) {
        clickedItem.classList.remove('open');
        openFaqId = null;
    } else {
        clickedItem.classList.add('open');
        openFaqId = id;
    }
}

// ── HTML ESCAPE ───────────────────────────────
function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
