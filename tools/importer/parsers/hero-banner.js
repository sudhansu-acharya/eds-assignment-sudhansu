/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://www.wknd.site/us/en.html
 * Generated: 2026-08-28
 *
 * Library convention: 1 column, up to 3 rows. First row = block name.
 * Row 2 (single cell) = background image (optional).
 * Row 3 (single cell) = title, subheading, CTA (optional).
 */
export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;

  // Row 2: background image (optional)
  const image = teaser.querySelector('.cmp-teaser__image img, img');

  // Row 3: title + description + CTA
  const title = teaser.querySelector('.cmp-teaser__title, h1, h2, h3');
  const description = teaser.querySelector('.cmp-teaser__description, p');
  const cta = teaser.querySelector('.cmp-teaser__action-link, a');

  const contentCell = [];
  if (title) contentCell.push(title);
  if (description) contentCell.push(description);
  if (cta) contentCell.push(cta);

  // Empty-block guard
  if (!image && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];
  if (image) cells.push([image]); // row 2: single cell, image only
  cells.push([contentCell]);      // row 3: single cell holding all text elements

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
