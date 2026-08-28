/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://www.wknd.site/us/en/magazine.html
 * Generated: 2026-08-28
 *
 * Library convention (cards-article/library-description.txt): 2 columns, multiple rows.
 * First row = block name. Each subsequent row = one card:
 *   cell 1 = image (mandatory), cell 2 = text content (title styled as heading,
 *   description below, optional CTA link).
 *
 * This parser is robust to the TWO DOM shapes that map to cards-article on the
 * WKND magazine page (both selectors verified against migration-work/cleaned.html
 * and block-context source.html):
 *   1. .image-list.list  → "All Articles" grid. The <ul> holds many
 *      .cmp-image-list__item cards (image link + title link + description).
 *   2. .teaser.cmp-teaser--secure → a single "Members Only" teaser card
 *      (cmp-teaser markup: .cmp-teaser__title + .cmp-teaser__description +
 *      .cmp-teaser__image img; the "Read More" action has no href when secured).
 *
 * The parser detects which shape it received and extracts image/title/
 * description/link accordingly, always emitting 2-column [image, content] rows.
 */

/**
 * Build one card row ([imageCell, contentCell]) from a card root element that
 * follows either the cmp-image-list__item or cmp-teaser markup.
 * Returns null when the root has neither an image nor any text content.
 */
function buildCardRow(root, document) {
  // Image (mandatory cell): image-list item image, teaser image, or any img.
  const image = root.querySelector(
    '.cmp-image-list__item-image img, .cmp-teaser__image img, img',
  );

  const contentCell = [];

  // Title → styled as a heading, wrapped in the card link when one exists.
  const titleEl = root.querySelector(
    '.cmp-image-list__item-title, .cmp-teaser__title',
  );
  // Card link: prefer a title/image link (image-list) or an action link (teaser).
  const linkEl = root.querySelector(
    '.cmp-image-list__item-title-link, .cmp-image-list__item-image-link, .cmp-teaser__action-link',
  );
  const href = linkEl && linkEl.getAttribute('href');

  if (titleEl) {
    const heading = document.createElement('h3');
    const titleText = titleEl.textContent.trim();
    if (href) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = titleText;
      heading.append(link);
    } else {
      heading.textContent = titleText;
    }
    contentCell.push(heading);
  }

  // Description → paragraph below the heading.
  const description = root.querySelector(
    '.cmp-image-list__item-description, .cmp-teaser__description',
  );
  if (description) {
    const p = document.createElement('p');
    p.textContent = description.textContent.trim();
    contentCell.push(p);
  }

  if (!image && !contentCell.length) return null;
  return [image || '', contentCell];
}

export default function parse(element, { document }) {
  const cells = [];

  // Shape 1: image-list grid — one card per .cmp-image-list__item.
  const listItems = Array.from(element.querySelectorAll('.cmp-image-list__item'));

  if (listItems.length) {
    listItems.forEach((item) => {
      const row = buildCardRow(item, document);
      if (row) cells.push(row);
    });
  } else {
    // Shape 2: cmp-teaser (e.g. Members Only) — the element itself is one card.
    const root = element.querySelector('.cmp-teaser') || element;
    const row = buildCardRow(root, document);
    if (row) cells.push(row);
  }

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
