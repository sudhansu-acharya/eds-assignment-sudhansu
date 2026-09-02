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
}
