// =============================================
// TEST YOUR MIND — Main JS (Common Functions)
// SOULCAKEY | 2025
// =============================================

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initScrollTop();
  setActiveNav();
});

// ── Header scroll effect ──
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// ── Mobile nav toggle ──
function initMobileNav() {
  const hamburger = document.querySelector('.nav-hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;
  hamburger.addEventListener('click', () => {
    mobileNav.classList.toggle('open');
    const spans = hamburger.querySelectorAll('span');
    const open = mobileNav.classList.contains('open');
    if (open) {
      spans[0].style.transform = 'rotate(45deg) translate(5px,5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px,-5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  document.addEventListener('click', e => {
    if (!hamburger.contains(e.target) && !mobileNav.contains(e.target)) {
      mobileNav.classList.remove('open');
      hamburger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
}

// ── Scroll to top button ──
function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ── Active nav link ──
function setActiveNav() {
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html') || (path === 'index.html' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

// ── Helper: get URL param ──
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// ── Helper: format large numbers ──
function formatCount(n) {
  if (typeof n === 'string') return n;
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return n.toString();
}

// ── Build Nav HTML ──
function buildHeader(activePage) {
  return `
  <header class="header">
    <nav class="nav">
      <a href="index.html" class="nav-logo">
        <div class="logo-icon">🧠</div>
        Test Your Mind
      </a>
      <div class="nav-links">
        <a href="index.html" ${activePage === 'home' ? 'class="active"' : ''}>Home</a>
        <a href="tests.html" ${activePage === 'tests' ? 'class="active"' : ''}>Tests</a>
        <a href="articles.html" ${activePage === 'articles' ? 'class="active"' : ''}>Articles</a>
        <a href="about.html" ${activePage === 'about' ? 'class="active"' : ''}>About</a>
        <a href="tests.html" class="nav-cta">Take a Test ✨</a>
      </div>
      <button class="nav-hamburger" aria-label="Menu">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </header>
  <nav class="mobile-nav">
    <a href="index.html">🏠 Home</a>
    <a href="tests.html">🧪 Tests</a>
    <a href="articles.html">📖 Articles</a>
    <a href="about.html">💡 About</a>
    <a href="contact.html">✉️ Contact</a>
  </nav>`;
}

// ── Build Footer HTML ──
function buildFooter() {
  return `
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <div class="footer-logo">
            <div class="logo-icon">🧠</div>
            Test Your Mind
          </div>
          <p class="footer-brand-desc">A psychology test platform built for self-discovery. Our scientifically-grounded tests help you understand your personality, relationships, and mental wellbeing.</p>
        </div>
        <div>
          <div class="footer-col-title">Tests</div>
          <div class="footer-links">
            <a href="tests.html?cat=personality">Personality</a>
            <a href="tests.html?cat=love">Love & Relationships</a>
            <a href="tests.html?cat=mental-health">Mental Health</a>
            <a href="tests.html?cat=career">Career</a>
          </div>
        </div>
        <div>
          <div class="footer-col-title">Explore</div>
          <div class="footer-links">
            <a href="articles.html">Articles</a>
            <a href="about.html">About Us</a>
            <a href="contact.html">Contact</a>
          </div>
        </div>
        <div>
          <div class="footer-col-title">Legal</div>
          <div class="footer-links">
            <a href="privacy.html">Privacy Policy</a>
            <a href="terms.html">Terms of Service</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© 2025 Test Your Mind · SOULCAKEY. All rights reserved.</span>
        <div class="footer-bottom-links">
          <a href="privacy.html">Privacy</a>
          <a href="terms.html">Terms</a>
          <a href="contact.html">Contact</a>
        </div>
      </div>
    </div>
  </footer>
  <button id="scrollTop" aria-label="Back to top">↑</button>`;
}

// ── Render Header + Footer ──
function renderChrome(activePage) {
  const headerEl = document.getElementById('header-placeholder');
  const footerEl = document.getElementById('footer-placeholder');
  if (headerEl) headerEl.outerHTML = buildHeader(activePage);
  if (footerEl) footerEl.outerHTML = buildFooter();
  initHeader();
  initMobileNav();
  initScrollTop();
}

// ── Test card HTML ──
function buildTestCard(test) {
  const gradients = {
    rose: 'background: linear-gradient(135deg, rgba(244,63,94,0.25), rgba(251,113,133,0.1));',
    purple: 'background: linear-gradient(135deg, rgba(139,92,246,0.25), rgba(167,139,250,0.1));',
    teal: 'background: linear-gradient(135deg, rgba(20,184,166,0.25), rgba(45,212,191,0.1));',
    blue: 'background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(147,197,253,0.1));',
    gold: 'background: linear-gradient(135deg, rgba(245,158,11,0.25), rgba(251,191,36,0.1));',
  };
  const grad = gradients[test.categoryColor] || gradients.purple;
  return `
  <a href="test-detail.html?id=${test.slug}" class="test-card">
    <div class="test-card-thumb-placeholder" style="${grad}">${test.emoji}</div>
    <div class="test-card-body">
      <div class="test-card-meta">
        <span class="badge badge-${test.categoryColor}">${test.category}</span>
      </div>
      <div class="test-card-title">${test.title}</div>
      <div class="test-card-desc">${test.intro ? test.intro.substring(0, 120) + '…' : ''}</div>
      <div class="test-card-footer">
        <div class="test-card-info">
          <span>❓ ${Array.isArray(test.questions) ? test.questions.length : test.questions} Qs</span>
          <span>⏱ ${test.duration}</span>
        </div>
        <span style="font-size:0.82rem;color:var(--color-text-muted)">👥 ${test.participants}</span>
      </div>
    </div>
  </a>`;
}
