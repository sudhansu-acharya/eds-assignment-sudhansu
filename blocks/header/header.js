// WKND header — content-first: reads /content/nav.plain.html and builds the header.
// No hardcoded links/labels; all copy comes from the nav fragment.

const MOBILE_MQ = window.matchMedia('(width < 900px)');

/**
 * Fetch the nav fragment (metadata-independent dual-fetch).
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

function closeMenu(nav) {
  nav.classList.remove('is-open');
  const toggle = nav.querySelector('.nav-hamburger');
  if (toggle) toggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('nav-open');
}

function toggleMenu(nav) {
  const open = nav.classList.toggle('is-open');
  const toggle = nav.querySelector('.nav-hamburger');
  if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  document.body.classList.toggle('nav-open', open);
}

export default async function decorate(block) {
  block.textContent = '';

  const content = await fetchNav();
  if (!content) return;

  // Fragment-relative images (e.g. "images/logo.svg") must resolve against the
  // nav fragment location, not the current page URL. Rewrite to absolute paths.
  content.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !/^https?:\/\//.test(src)) {
      img.setAttribute('src', `/${src.replace(/^\.?\/*/, '')}`);
    }
  });

  const sections = [...content.children].filter((el) => el.tagName === 'DIV');
  const [brandSection, navSection, toolsSection] = sections;

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // Hamburger (mobile)
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.type = 'button';
  hamburger.setAttribute('aria-controls', 'nav');
  hamburger.setAttribute('aria-label', 'Open navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburger.addEventListener('click', () => toggleMenu(nav));

  // Brand (logo)
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  if (brandSection) brand.append(...brandSection.childNodes);

  // Nav links — promote the <ul> to a direct child of <nav> so the tree
  // mirrors the source (nav > ul > li > a). Keep the section's <ul>.
  const navLinks = (navSection && navSection.querySelector('ul')) || document.createElement('ul');
  navLinks.classList.add('nav-sections');
  navLinks.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => { if (MOBILE_MQ.matches) closeMenu(nav); });
  });

  // Tools (locale toggle + Sign In)
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  if (toolsSection) tools.append(...toolsSection.childNodes);

  nav.append(hamburger, brand, navLinks, tools);

  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);

  // Reset mobile menu when resizing up to desktop
  MOBILE_MQ.addEventListener('change', () => {
    if (!MOBILE_MQ.matches) closeMenu(nav);
  });

  // Close on Escape (mobile)
  document.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && MOBILE_MQ.matches) closeMenu(nav);
  });
}
