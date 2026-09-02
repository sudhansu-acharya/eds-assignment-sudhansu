import {
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
  buildBlock,
} from './aem.js';

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  const innerTT = window.trustedTypes.createPolicy('tt-inner', {
    createHTML: (s) => s, // avoid stack overflow
  });

  window.trustedTypes.createPolicy('default', {
    createHTML: (input, type, sink) => {
      let processedInput = input;
      if (/srcdoc\s*=/i.test(processedInput)) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('iframe[srcdoc]').forEach((el) => el.removeAttribute('srcdoc'));
        processedInput = doc.body.innerHTML;
      }
      if (sink.includes('createContextualFragment') || sink.includes('Document write')) {
        const doc = new DOMParser().parseFromString(innerTT.createHTML(processedInput), 'text/html');
        doc.querySelectorAll('script').forEach((el) => el.remove());
        processedInput = doc.body.innerHTML;
      }
      return processedInput;
    },
    createScriptURL: (input) => input,
    createScript: (input) => input,
  });
}

/**
 * load fonts.css and set a session storage flag
 */
async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

/**
 * Turns `/widgets/...` links into widget blocks.
 * @param {Element} main The container element
 */
function buildWidgetAutoBlocks(main) {
  const widgetLinks = [...main.querySelectorAll('a[href*="/widgets/"]')];
  widgetLinks.forEach((link) => {
    if (link.closest('.widget')) return;
    const newLink = link.cloneNode(true);
    const widgetBlock = buildBlock('widget', { elems: [newLink] });
    const p = link.closest('p');
    if (
      p
      && p.querySelectorAll('a').length === 1
      && p.querySelector('a') === link
      && p.textContent.trim() === link.textContent.trim()
    ) {
      p.replaceWith(widgetBlock);
    } else {
      link.replaceWith(widgetBlock);
    }
  });
}

/**
 * Builds all synthetic blocks in a container element.
 * @param {Element} main The container element
 */
function buildAutoBlocks(main) {
  try {
    // auto load `*/fragments/*` references
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')].filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildWidgetAutoBlocks(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

/**
 * Decorates formatted links to style them as buttons.
 * @param {HTMLElement} main The main container element
 */
function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    // quick structural checks
    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    // skip URL display links
    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    const strong = a.closest('strong');
    const em = a.closest('em');

    // A lone navigational link that is the paragraph's only content is a WKND
    // CTA (e.g. "All Trips", "All Articles") — the source renders these as
    // yellow buttons. Exclude bare "#" links (author social links use those).
    const href = a.getAttribute('href') || '';
    const isLoneCta = !strong && !em
      && p.childElementCount === 1
      && href && href !== '#' && !href.startsWith('#');

    // otherwise require authored formatting for buttonization
    if (!strong && !em && !isLoneCta) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) { // high-impact call-to-action
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else if (em) {
      a.classList.add('secondary');
      em.replaceWith(a);
    } else {
      // lone CTA link — WKND yellow button
      a.classList.add('cta');
    }
  });
}

/**
 * Strip the `.html` extension from internal links.
 * The migrated content carries source links like `/us/en/magazine/x.html`, but
 * EDS serves pages extensionless — so those links 404. Rewrite same-origin
 * (and root-relative) links to drop a trailing `.html`, keeping any query/hash.
 * @param {Element} main The container element
 */
function rewriteInternalLinks(main) {
  main.querySelectorAll('a[href*=".html"]').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href) return;
    // only touch root-relative links or links on this site's origin
    const isRootRelative = href.startsWith('/');
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return;
    }
    if (!isRootRelative && url.origin !== window.location.origin) return;
    if (!url.pathname.endsWith('.html')) return;
    url.pathname = url.pathname.slice(0, -'.html'.length);
    // preserve the original relative/absolute form
    a.setAttribute('href', isRootRelative
      ? `${url.pathname}${url.search}${url.hash}`
      : url.href);
  });
}

/**
 * Magazine article pages (identified by the "Up Next" related-articles block)
 * have no template metadata. Tag the body so the article body typography can be
 * scoped, and drop the duplicate article title: the import captured the title
 * twice — as the H1 and again as an H3 right after the byline. The source shows
 * it once, so remove the redundant H3 that repeats the H1.
 * @param {Element} main The container element
 */
function decorateMagazineArticle(main) {
  if (!main.querySelector('.cards-upnext')) return;
  document.body.classList.add('magazine-article');

  const h1 = main.querySelector('h1');
  if (!h1) return;
  const title = h1.textContent.trim();
  main.querySelectorAll('h3').forEach((h3) => {
    // only the in-body duplicate (same text as the H1), not related-article headings
    if (h3.textContent.trim() === title && !h3.closest('.cards-upnext')) h3.remove();
  });
}

/**
 * Adventure detail pages (identified by the trip-facts + adventure-tabs blocks)
 * carry a lead "carousel" that imported as several stacked images plus a
 * leftover "Previous Next" line and empty dots list. Rebuild it as a single-
 * slide carousel (one image visible, prev/next + dots), and tag the body so the
 * facts panel can be laid out as a left sidebar beside the tabbed content.
 * @param {Element} main The container element
 */
function decorateAdventureDetail(main) {
  if (!(main.querySelector('.table-facts') && main.querySelector('.tabs-adventure'))) return;
  document.body.classList.add('adventure-detail');

  // The lead is the first default-content wrapper: it holds the breadcrumb list,
  // the slide images, a "Previous Next" paragraph and an empty dots <ol>.
  const lead = main.querySelector('.default-content-wrapper');
  if (!lead) return;
  const pics = [...lead.querySelectorAll('p > picture')];
  if (pics.length < 2) return;

  const carousel = document.createElement('div');
  carousel.className = 'lead-carousel';
  const track = document.createElement('div');
  track.className = 'lead-carousel-track';
  pics.forEach((pic, i) => {
    const slide = document.createElement('div');
    slide.className = 'lead-carousel-slide';
    if (i === 0) slide.classList.add('active');
    slide.append(pic.closest('p') || pic);
    track.append(slide);
  });
  carousel.append(track);

  const slides = [...track.children];
  const dotsWrap = document.createElement('div');
  dotsWrap.className = 'lead-carousel-dots';
  const dots = [];

  const show = (idx) => {
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    dots.forEach((d, i) => d.setAttribute('aria-selected', i === idx ? 'true' : 'false'));
    carousel.dataset.index = idx;
  };

  // dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Show slide ${i + 1}`);
    dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    dot.addEventListener('click', () => show(i));
    dotsWrap.append(dot);
    dots.push(dot);
  });

  // prev / next
  const nav = (label, delta) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `lead-carousel-${label}`;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', () => {
      const n = slides.length;
      const cur = Number(carousel.dataset.index || 0);
      show((((cur + delta) % n) + n) % n);
    });
    return b;
  };
  carousel.append(nav('prev', -1), nav('next', 1), dotsWrap);

  // Remove the leftover "Previous Next" text and empty dots list, then swap in
  // the carousel where the first image paragraph was.
  lead.querySelectorAll('ol').forEach((ol) => {
    if (!ol.querySelector('a')) ol.remove(); // empty dots list (keep breadcrumb <ol>)
  });
  [...lead.querySelectorAll('p')].forEach((p) => {
    if (!p.querySelector('picture') && /^\s*Previous\s+Next\s*$/i.test(p.textContent)) p.remove();
  });
  lead.append(carousel);
}

/**
 * Decorates the main element.
 * @param {Element} main The main element
 */
// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
  rewriteInternalLinks(main);
  decorateMagazineArticle(main);
  decorateAdventureDetail(main);
}

/**
 * Loads everything needed to get to LCP.
 * @param {Element} doc The container element
 */
async function loadEager(doc) {
  document.documentElement.lang = 'en';
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    /* if desktop (proxy for fast connection) or fonts already loaded, load fonts.css */
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

/**
 * Inject JSON-LD structured data for richer search results:
 * - Organization + WebSite on every page,
 * - Article on magazine article pages (byline author, hero image, description),
 * - BreadcrumbList wherever a breadcrumb list is present.
 * @param {Document} doc The document
 */
function addStructuredData(doc) {
  const add = (obj) => {
    const s = doc.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(obj);
    doc.head.append(s);
  };
  const { origin } = window.location;
  const canonical = doc.querySelector('link[rel="canonical"]')?.href || window.location.href;
  const desc = doc.querySelector('meta[name="description"]')?.content || '';

  // Organization + WebSite (site-wide)
  add({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WKND Adventures and Travel',
    url: origin,
    logo: `${origin}/images/wknd-logo.svg`,
  });
  add({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WKND Adventures and Travel',
    url: origin,
  });

  const main = doc.querySelector('main');

  // Article (magazine article pages)
  if (doc.body.classList.contains('magazine-article')) {
    const headline = doc.querySelector('main h1')?.textContent.trim() || doc.title;
    const byline = [...doc.querySelectorAll('main h4')].find((h) => /^By /i.test(h.textContent));
    const author = byline ? byline.textContent.replace(/^By\s+/i, '').trim() : undefined;
    const img = main?.querySelector('img')?.src;
    add({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline,
      description: desc,
      ...(img ? { image: [img] } : {}),
      ...(author ? { author: { '@type': 'Person', name: author } } : {}),
      publisher: { '@type': 'Organization', name: 'WKND Adventures and Travel' },
      mainEntityOfPage: canonical,
    });
  }

  // BreadcrumbList (any page with a breadcrumb ordered list)
  const bcList = main?.querySelector('.default-content-wrapper ol');
  const bcItems = bcList ? [...bcList.querySelectorAll('li')] : [];
  if (bcItems.length >= 2) {
    add({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: bcItems.map((li, i) => {
        const a = li.querySelector('a');
        return {
          '@type': 'ListItem',
          position: i + 1,
          name: (a || li).textContent.replace(/[▸▸]/g, '').trim(),
          ...(a ? { item: new URL(a.getAttribute('href'), origin).href } : {}),
        };
      }),
    });
  }
}

/**
 * Loads everything that doesn't need to be delayed.
 * @param {Element} doc The container element
 */
async function loadLazy(doc) {
  loadHeader(doc.querySelector('body > header'));

  const main = doc.querySelector('main');
  await loadSections(main);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('body > footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();

  addStructuredData(doc);
}

/**
 * Loads everything that happens a lot later,
 * without impacting the user experience.
 */
function loadDelayed() {
  import('./consent-check.js');
  // load anything that can be postponed to the latest here
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
