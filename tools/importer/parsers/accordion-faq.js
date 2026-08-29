/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion-faq. Base: accordion.
 * Source: https://www.wknd.site/us/en/faqs.html
 * Generated: 2026-08-29
 *
 * The FAQs page uses an AEM Accordion component (cmp-accordion) with 7 Q&A items:
 *   .accordion.panelcontainer            → instance selector (the whole accordion)
 *     .cmp-accordion                     → accordion root
 *       .cmp-accordion__item             → one Q&A item (×7)
 *         h3.cmp-accordion__header
 *           button.cmp-accordion__button
 *             span.cmp-accordion__title  → the QUESTION text
 *             span.cmp-accordion__icon   → decorative chevron (ignored)
 *         .cmp-accordion__panel[.cmp-accordion__panel--hidden]
 *           .container .cmp-container .text .cmp-text
 *             <p> (answer body), occasionally a stray empty <h3>&nbsp;</h3>
 *
 * IMPORTANT: the panels are collapsed in the DOM (cmp-accordion__panel--hidden),
 * but they still contain the full answer content — the site-wide cleanup
 * transformer must NOT strip hidden accordion panels, or answers would be lost.
 *
 * Library convention (accordion-faq/library-description.txt → "Accordion"): 2
 * columns, multiple rows. Row 1 = block name. Each subsequent row = one item:
 *   cell 1 = title/label (the question), cell 2 = content (the answer body).
 *
 * The import framework calls this parser ONCE for the matched
 * .accordion.panelcontainer element; this parser iterates over all items and
 * emits one 2-cell row per item, then replaces the container with the block.
 *
 * All selectors verified against migration-work/block-context/accordion-faq/source.html.
 * Answer content is preserved as real DOM nodes (paragraphs, links, lists,
 * images) — not flattened to plain text — so markdown conversion keeps semantics.
 */
export default function parse(element, { document }) {
  const cells = [];

  // One row per accordion item. Fallback to any item-like child if the exact
  // class ever varies.
  let items = Array.from(element.querySelectorAll('.cmp-accordion__item'));
  if (!items.length) items = Array.from(element.querySelectorAll('[class*="accordion__item"]'));

  items.forEach((item) => {
    // Question → the accordion title span; fall back to the button text.
    const titleEl = item.querySelector('.cmp-accordion__title')
      || item.querySelector('.cmp-accordion__button')
      || item.querySelector('.cmp-accordion__header');
    const title = titleEl ? titleEl.textContent.trim() : '';

    // Answer → the panel body. Prefer the .cmp-text bodies inside the panel,
    // else fall back to the whole panel.
    const panel = item.querySelector('.cmp-accordion__panel')
      || item.querySelector('[class*="accordion__panel"]');
    const contentRoot = panel || item;

    // Collect meaningful answer content in document order, preserving semantic
    // markup (paragraphs incl. inline <b>/links, lists, sub-headings, images).
    // This skips the many empty AEM layout-grid wrapper <div>s.
    let contentNodes = Array.from(
      contentRoot.querySelectorAll('h2, h3, h4, h5, h6, p, ul, ol, img'),
    );
    // Drop nodes nested inside another collected node to avoid duplication
    // (e.g. an <img> inside a collected <p>).
    contentNodes = contentNodes.filter(
      (node) => !contentNodes.some((other) => other !== node && other.contains(node)),
    );
    // Drop empty placeholder nodes (e.g. stray <h3>&nbsp;</h3>) that carry no
    // text and no media.
    contentNodes = contentNodes.filter(
      (node) => node.textContent.replace(/ /g, ' ').trim().length > 0
        || node.querySelector('img, a[href]'),
    );

    const contentCell = contentNodes.length ? contentNodes : [contentRoot];

    // Skip items with neither a question nor answer content.
    if (!title && !contentNodes.length) return;

    // 2-column row: [question, answer]. Pad the title if somehow empty so the
    // row keeps both columns.
    cells.push([title || '', contentCell]);
  });

  // Empty-block guard: no items extractable → unwrap rather than emit empty.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion-faq', cells });
  element.replaceWith(block);
}
