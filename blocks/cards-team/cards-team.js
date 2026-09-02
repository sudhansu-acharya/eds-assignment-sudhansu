import { createOptimizedPicture } from '../../scripts/aem.js';

// Social networks we can render as an icon. WKND uses an icon font (domain-locked
// and unavailable here), so we swap the plain text link ("Facebook"/"Twitter"/
// "Instagram") for the matching SVG we already ship for the footer.
const SOCIAL_ICONS = ['facebook', 'twitter', 'instagram'];

/**
 * Replace a card's social text links with SVG icons. The label text is kept as
 * the link's accessible name so screen readers still announce the network.
 * @param {Element} body the .cards-team-card-body element
 */
function decorateSocial(body) {
  // The social row is the last paragraph that holds only anchors.
  const row = [...body.querySelectorAll('p')].reverse().find((p) => {
    const links = p.querySelectorAll('a');
    return links.length > 0
      && p.textContent.trim() === [...links].map((a) => a.textContent.trim()).join(' ');
  });
  if (!row) return;

  row.classList.add('cards-team-card-social');
  row.querySelectorAll('a').forEach((a) => {
    const label = a.textContent.trim();
    const network = SOCIAL_ICONS.find((n) => label.toLowerCase().includes(n));
    if (!network) return;
    a.setAttribute('aria-label', label);
    a.textContent = '';
    const img = document.createElement('img');
    img.src = `/images/social-${network}.svg`;
    img.alt = label;
    img.width = 24;
    img.height = 24;
    img.loading = 'lazy';
    a.append(img);
  });
}

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-team-card-image';
      else div.className = 'cards-team-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => {
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    img.closest('picture').replaceWith(optimizedPic);
  });
  ul.querySelectorAll('.cards-team-card-body').forEach(decorateSocial);
  block.textContent = '';
  block.append(ul);
}
