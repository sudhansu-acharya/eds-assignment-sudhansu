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
 * Fetch a locale's rows from a query-index, filtered to a path prefix and
 * ordered. Excludes locked members-only content.
 * @param {string} indexUrl e.g. "/article-index.json"
 * @param {string} localePrefix e.g. "/us/en/magazine/"
 * @param {object} [opts]
 * @param {number} [opts.limit] max rows to return (omit for all)
 * @param {'recent'|'title'} [opts.sort] ordering; newest-first or A→Z by title
 * @returns {Promise<Array|null>} index rows, or null if unavailable
 */
async function fetchIndex(indexUrl, localePrefix, { limit, sort = 'recent' } = {}) {
  try {
    const resp = await fetch(indexUrl);
    if (!resp.ok) return null;
    const { data = [] } = await resp.json();
    const rows = data
      .filter((r) => r.path && r.path.startsWith(localePrefix) && !r.path.includes('/members-only/'));
    if (sort === 'title') {
      rows.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else {
      rows.sort((a, b) => Number(b.lastModified || 0) - Number(a.lastModified || 0));
    }
    return limit ? rows.slice(0, limit) : rows;
  } catch {
    return null;
  }
}

/**
 * Render a card grid dynamically from a query-index, replacing the
 * statically-authored cards. Used for:
 *  - home page "Recent Articles" (magazine index, newest-first, top 4)
 *  - magazine listing "All Articles" (magazine index, newest-first, all)
 *  - adventures listing "Current Adventures" (adventure index, A→Z, all)
 * Leaves the authored cards in place if the index is unavailable. Never touches
 * the "Members Only" block, whose locked teasers are not indexed.
 * @param {Element} block the cards-article block
 * @param {Element} ul the decorated card list (static fallback)
 * @returns {Promise<Element>} the card list now in the DOM (fresh or original)
 */
async function renderArticleIndex(block, ul) {
  const heading = block.closest('.section')?.querySelector('h1,h2,h3');
  const headingText = heading ? heading.textContent : '';
  const path = window.location.pathname;

  // Home page: /{cc}/{lang} with no further segment → "Recent Articles", top 4.
  const homeMatch = path.match(/^\/([a-z]{2})\/([a-z]{2})\/?$/);
  // Magazine listing: /{cc}/{lang}/magazine → "All Articles", all articles.
  const magMatch = path.match(/^\/([a-z]{2})\/([a-z]{2})\/magazine\/?$/);
  // Adventures listing: /{cc}/{lang}/adventures → "Current Adventures", A→Z.
  const advMatch = path.match(/^\/([a-z]{2})\/([a-z]{2})\/adventures\/?$/);

  let indexUrl;
  let area;
  let opts;
  let match;
  if (homeMatch && /recent articles/i.test(headingText)) {
    indexUrl = '/article-index.json';
    area = 'magazine';
    opts = { limit: 4, sort: 'recent' };
    match = homeMatch;
  } else if (magMatch && /all articles/i.test(headingText)) {
    indexUrl = '/article-index.json';
    area = 'magazine';
    opts = { sort: 'recent' };
    match = magMatch;
  } else if (advMatch && /current adventures/i.test(headingText)) {
    indexUrl = '/adventure-index.json';
    area = 'adventures';
    opts = { sort: 'title' };
    match = advMatch;
  } else {
    return ul;
  }

  const localePrefix = `/${match[1]}/${match[2]}/${area}/`;
  const rows = await fetchIndex(indexUrl, localePrefix, opts);
  if (!rows || !rows.length) return ul;

  const freshUl = document.createElement('ul');
  rows.forEach((r) => freshUl.append(articleCard(r)));
  ul.replaceWith(freshUl);
  return freshUl;
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

  // Home ("Recent Articles"), magazine ("All Articles") and adventures listing
  // ("Current Adventures"): replace the authored cards with index-driven ones,
  // then wire up the adventures category filter on whichever list is rendered
  // (fresh dynamic list, or the original static one as fallback).
  renderArticleIndex(block, ul).then((finalUl) => addAdventureFilter(block, finalUl));
}
