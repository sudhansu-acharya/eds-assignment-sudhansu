/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://www.wknd.site/us/en.html
 * Generated: 2026-08-28
 *
 * Library convention: 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one card: cell 1 = image (mandatory),
 * cell 2 = text content (title, description, optional CTA).
 */
export default function parse(element, { document }) {
  // Each list item is a card (validated against source.html)
  const items = Array.from(element.querySelectorAll('.cmp-image-list__item'));

  const cells = [];

  items.forEach((item) => {
    // Cell 1: image (mandatory)
    const image = item.querySelector('.cmp-image-list__item-image img, img');

    // Cell 2: text content — title (as a link) + description
    const titleLink = item.querySelector('.cmp-image-list__item-title-link');
    const titleText = item.querySelector('.cmp-image-list__item-title');
    const description = item.querySelector('.cmp-image-list__item-description');

    const contentCell = [];

    // Preserve the article link on the title: build a heading anchor
    if (titleLink && titleText) {
      const link = document.createElement('a');
      link.href = titleLink.getAttribute('href');
      link.textContent = titleText.textContent.trim();
      const heading = document.createElement('h3');
      heading.append(link);
      contentCell.push(heading);
    } else if (titleText) {
      const heading = document.createElement('h3');
      heading.textContent = titleText.textContent.trim();
      contentCell.push(heading);
    }

    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      contentCell.push(p);
    }

    if (image || contentCell.length) {
      cells.push([image || '', contentCell]);
    }
  });

  // Empty-block guard
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  element.replaceWith(block);
}
