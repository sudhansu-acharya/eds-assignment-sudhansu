/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-upnext. Base: cards (vanilla "Cards (no images)" variant).
 * Source: https://www.wknd.site/us/en/magazine/arctic-surfing.html
 * Generated: 2026-08-29
 *
 * The "Up Next" related-articles list is a text-only card list: a <ul.cmp-list>
 * whose <li.cmp-list__item> each hold a single link (a.cmp-list__item-link)
 * wrapping a title (span.cmp-list__item-title) and a publication date
 * (span.cmp-list__item-date). There are NO images.
 *
 * Library convention (cards-upnext/library-description.txt → "Cards (no images)"):
 *   1 column, multiple rows. Row 1 = block name. Each subsequent row = one card
 *   in a single cell: an optional heading (here the article title as a link) with
 *   a description below it (here the publication date). Because the items are
 *   text-only, the 1-column "no images" shape is used — every content row is a
 *   single cell.
 *
 * All selectors verified against migration-work/block-context/cards-upnext/source.html.
 * Fallbacks are included for cross-page resilience (union selectors in
 * page-templates.json may match slightly different markup on sibling articles).
 */
export default function parse(element, { document }) {
  const cells = [];

  // One card per list item. Fallback to <li> if the BEM class is absent.
  let items = Array.from(element.querySelectorAll('.cmp-list__item'));
  if (!items.length) items = Array.from(element.querySelectorAll('li'));

  items.forEach((item) => {
    // The whole item is a single link; title + date live inside it.
    const link = item.querySelector('a.cmp-list__item-link, a');
    const titleEl = item.querySelector('.cmp-list__item-title');
    const dateEl = item.querySelector('.cmp-list__item-date');

    // Title text: prefer the dedicated title span, else the link text minus date.
    let titleText = titleEl ? titleEl.textContent.trim() : '';
    if (!titleText && link) titleText = link.textContent.trim();
    const href = link && link.getAttribute('href');

    const contentCell = [];

    // Heading = article title, wrapped in the article link when present.
    if (titleText) {
      const heading = document.createElement('h3');
      if (href) {
        const a = document.createElement('a');
        a.href = href;
        a.textContent = titleText;
        heading.append(a);
      } else {
        heading.textContent = titleText;
      }
      contentCell.push(heading);
    }

    // Description = publication date, below the heading.
    if (dateEl) {
      const p = document.createElement('p');
      p.textContent = dateEl.textContent.trim();
      contentCell.push(p);
    }

    // 1-column row: one cell holding [heading, date].
    if (contentCell.length) cells.push([[...contentCell]]);
  });

  // Empty-block guard: nothing extractable → unwrap rather than emit an empty block.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-upnext', cells });
  element.replaceWith(block);
}
