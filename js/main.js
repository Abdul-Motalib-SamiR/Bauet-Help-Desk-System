function setLang(lang) {
    document.body.classList.remove('lang-en', 'lang-bn');
    document.body.classList.add('lang-' + lang);

    document.getElementById('btn-en').classList.toggle('active', lang === 'en');
    document.getElementById('btn-bn').classList.toggle('active', lang === 'bn');

    document.querySelectorAll('.en-inline').forEach(function(el) {
        el.style.display = lang === 'en' ? '' : 'none';
    });
    document.querySelectorAll('.bn-inline').forEach(function(el) {
        el.style.display = lang === 'bn' ? '' : 'none';
    });

    localStorage.setItem('bauet-lang', lang);
}

// Navbar scroll effect
window.addEventListener('scroll', function() {
    var navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Scroll reveal
var revealElements = document.querySelectorAll('.reveal');
var revealObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
        if (entry.isIntersecting) {
            setTimeout(function() {
                entry.target.classList.add('visible');
            }, i * 80);
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

revealElements.forEach(function(el) {
    revealObserver.observe(el);
});

// Restore saved language on page load
var savedLang = localStorage.getItem('bauet-lang') || 'en';
setLang(savedLang);
