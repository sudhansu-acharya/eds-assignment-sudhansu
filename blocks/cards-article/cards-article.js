import { createOptimizedPicture } from '../../scripts/aem.js';

// Adventures listing category filter (matches wknd.site/us/en/adventures).
// The migrated content has no category metadata, so we map each adventure by
// its detail-page slug. Ordered tabs; "All" shows everything.
const ADVENTURE_CATEGORIES = [
  ['All', null],
  ['Climbing', ['climbing-new-zealand', 'colorado-rock-climbing']],
  ['Cycling', ['whistler-mountain-biking', 'cycling-tuscany', 'west-coast-cycling']],
  ['Skiing', ['downhill-skiing-wyoming', 'ski-touring-mont-blanc', 'tahoe-skiing']],
  ['Surfing', ['bali-surf-camp', 'surf-camp-costa-rica']],
  ['Travel', ['beervana-portland', 'cycling-tuscany', 'gastronomic-marais-tour',
    'napa-wine-tasting', 'riverside-camping-australia', 'yosemite-backpacking']],
];

/** slug from an adventure card's detail link, e.g. "bali-surf-camp". */
function cardSlug(li) {
  const a = li.querySelector('a[href*="/adventures/"]');
  if (!a) return null;
  return a.getAttribute('href').split('/').pop().replace(/\.html$/, '');
}

/**
 * Add the WKND category filter tabs above an adventures-listing card grid.
 * Only runs when every card links to an /adventures/<slug> detail page.
 * @param {Element} block the cards-article block
 * @param {Element} ul the decorated card list
 */
function addAdventureFilter(block, ul) {
  // Only on the adventures listing page — NOT the homepage "Where do you want
  // to go?" teaser (which is a 4-card cards-article whose cards also link to
  // /adventures/<slug>). The listing lives at a path ending in /adventures.
  if (!/\/adventures\/?$/.test(window.location.pathname)) return;

  const items = [...ul.children];
  const slugs = items.map(cardSlug);
  // Require the full catalog (many cards) all resolving to detail slugs.
  if (items.length < 8 || slugs.some((s) => !s)) return;

  const tablist = document.createElement('div');
  tablist.className = 'cards-article-tabs';
  tablist.setAttribute('role', 'tablist');

  const applyFilter = (allowed) => {
    items.forEach((li, i) => {
      li.hidden = allowed !== null && !allowed.includes(slugs[i]);
    });
  };

  ADVENTURE_CATEGORIES.forEach(([label, allowed], i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cards-article-tab';
    btn.textContent = label;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
    btn.addEventListener('click', () => {
      tablist.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', 'false'));
      btn.setAttribute('aria-selected', 'true');
      applyFilter(allowed);
    });
    tablist.append(btn);
  });

  block.prepend(tablist);
}

/** Build one article card <li> from a query-index row. */
function articleCard(row) {
  const li = document.createElement('li');

  const imageCell = document.createElement('div');
  imageCell.className = 'cards-article-card-image';
  if (row.image) {
    const pic = createOptimizedPicture(row.image, row.title || '', false, [{ width: '750' }]);
    const a = document.createElement('a');
    a.href = row.path;
    a.append(pic);
    imageCell.append(a);
  }

  const body = document.createElement('div');
  body.className = 'cards-article-card-body';
  const h3 = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = row.path;
  titleLink.textContent = row.title || row.path;
  h3.append(titleLink);
  body.append(h3);
  if (row.description) {
    const p = document.createElement('p');
    p.textContent = row.description;
    body.append(p);
  }

  li.append(imageCell, body);
  return li;
}

/**
 * Render the home page "Recent Articles" grid dynamically from the article
 * query-index (article-index.json) instead of the statically-authored cards.
 * Falls back to the authored cards if the index is unavailable. Scoped to the
 * home page's "Recent Articles" section and to the current locale.
 * @param {Element} block the cards-article block
 * @param {Element} ul the decorated card list (static fallback)
 * @returns {Promise<boolean>} true if the grid was populated from the index
 */
async function renderRecentArticles(block, ul) {
  const heading = block.closest('.section')?.querySelector('h1,h2,h3');
  const isRecent = heading && /recent articles/i.test(heading.textContent);
  // home page only: /{cc}/{lang} with no further path segment
  const localeMatch = window.location.pathname.match(/^\/([a-z]{2})\/([a-z]{2})\/?$/);
  if (!isRecent || !localeMatch) return false;

  const localePrefix = `/${localeMatch[1]}/${localeMatch[2]}/magazine/`;
  try {
    const resp = await fetch('/article-index.json');
    if (!resp.ok) return false;
    const { data = [] } = await resp.json();
    const rows = data
      .filter((r) => r.path && r.path.startsWith(localePrefix))
      .sort((a, b) => Number(b.lastModified || 0) - Number(a.lastModified || 0))
      .slice(0, 4);
    if (!rows.length) return false;

    const freshUl = document.createElement('ul');
    rows.forEach((r) => freshUl.append(articleCard(r)));
    ul.replaceWith(freshUl);
    return true;
  } catch {
    return false;
  }
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-article-card-image';
      else div.className = 'cards-article-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
  addAdventureFilter(block, ul);

  // Home page: replace the authored Recent Articles cards with index-driven ones.
  renderRecentArticles(block, ul);
}
