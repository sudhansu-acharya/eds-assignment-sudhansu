/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-featured. Base: columns.
 * Source: https://www.wknd.site/us/en.html
 * Generated: 2026-08-28
 *
 * Library convention: multiple columns/rows. First row = block name.
 * Number of columns follows the natural visual grouping of content.
 * The featured teaser presents text content beside an image → 2 columns, 1 row.
 */
export default function parse(element, { document }) {
  const teaser = element.querySelector('.cmp-teaser') || element;

  // Text column: use the whole content container so pretitle, title,
  // description and CTA are preserved in their original order.
  const textContent = teaser.querySelector('.cmp-teaser__content');

  // Image column
  const image = teaser.querySelector('.cmp-teaser__image img, img');

  // Empty-block guard
  if (!textContent && !image) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [
    [textContent || '', image || ''],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-featured', cells });
  element.replaceWith(block);
}
