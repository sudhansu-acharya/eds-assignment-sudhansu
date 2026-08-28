/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-hero. Base: carousel.
 * Source: https://www.wknd.site/us/en.html
 * Generated: 2026-08-28
 *
 * Library convention: 2 columns, multiple rows. First row = block name.
 * Each subsequent row = one slide: cell 1 = image (mandatory),
 * cell 2 = text content (title, description, CTA).
 */
export default function parse(element, { document }) {
  // Each carousel item wraps a teaser (validated against source.html)
  const items = Array.from(element.querySelectorAll('.cmp-carousel__item'));

  const cells = [];

  items.forEach((item) => {
    const teaser = item.querySelector('.cmp-teaser') || item;

    // Cell 1: image (mandatory)
    const image = teaser.querySelector('.cmp-teaser__image img, img');

    // Cell 2: text content (title + description + CTA)
    const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
    const description = teaser.querySelector('.cmp-teaser__description, p');
    const cta = teaser.querySelector('.cmp-teaser__action-link, a');

    const contentCell = [];
    if (title) contentCell.push(title);
    if (description) contentCell.push(description);
    if (cta) contentCell.push(cta);

    // Only add a slide row if there is meaningful content
    if (image || contentCell.length) {
      cells.push([image || '', contentCell]);
    }
  });

  // Empty-block guard
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-hero', cells });
  element.replaceWith(block);
}
