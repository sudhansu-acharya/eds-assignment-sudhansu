/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs-adventure. Base: tabs (vanilla "Tabs" variant).
 * Source: https://www.wknd.site/us/en/adventures/bali-surf-camp.html
 * Generated: 2026-08-29
 *
 * The adventure "tabbed trip content" is an AEM Tabs component:
 *   <div.cmp-tabs>
 *     <ol.cmp-tabs__tablist> → <li.cmp-tabs__tab> labels (Overview / Itinerary /
 *        What to Bring); the active one also carries cmp-tabs__tab--active.
 *     <div.cmp-tabs__tabpanel> (one per tab, in the same order as the tabs) →
 *        each holds a content fragment whose body (paragraphs, bold sub-heads,
 *        an image, links, and lists) is the tab content.
 *
 * IMPORTANT: every panel is real content and must be preserved — this parser
 * relies on ALL .cmp-tabs__tabpanel elements being present (the site-wide
 * cleanup transformer must NOT strip inactive panels for adventure-detail).
 *
 * Library convention (tabs-adventure/library-description.txt → "Tabs"): 2
 * columns, multiple rows. Row 1 = block name. Each subsequent row = one tab:
 *   cell 1 = tab label, cell 2 = tab content (media/markup preserved).
 *
 * All selectors verified against migration-work/block-context/tabs-adventure/source.html.
 * The panel content is preserved as real DOM nodes (paragraphs, lists, images,
 * links) — not flattened to plain text — so markdown conversion keeps semantics.
 */
export default function parse(element, { document }) {
  const cells = [];

  // Tab labels (in order). Fallback to any <li> in the tablist.
  let tabs = Array.from(element.querySelectorAll('.cmp-tabs__tab'));
  if (!tabs.length) tabs = Array.from(element.querySelectorAll('.cmp-tabs__tablist li'));

  // Tab panels (in the SAME order as the tabs). Fallback to any panel-like child.
  let panels = Array.from(element.querySelectorAll('.cmp-tabs__tabpanel'));
  if (!panels.length) panels = Array.from(element.querySelectorAll('[class*="tabpanel"]'));

  const count = Math.min(tabs.length, panels.length);

  for (let i = 0; i < count; i += 1) {
    const label = tabs[i].textContent.trim();
    const panel = panels[i];

    // Prefer the content-fragment body when present; else the whole panel.
    const contentRoot = panel.querySelector('.cmp-contentfragment__elements') || panel;

    // Collect meaningful content in document order, preserving semantic markup
    // (headings, paragraphs incl. inline <b>/links, lists, images). This skips
    // the many empty AEM layout-grid wrapper <div>s so the cell stays clean.
    let contentNodes = Array.from(
      contentRoot.querySelectorAll('h2, h3, h4, h5, h6, p, ul, ol, img'),
    );
    // Drop images nested inside a collected paragraph/list to avoid duplication
    // (querySelectorAll would return both the <p> and its descendant <img>).
    contentNodes = contentNodes.filter(
      (node) => !contentNodes.some((other) => other !== node && other.contains(node)),
    );

    const contentCell = contentNodes.length ? contentNodes : [contentRoot];

    // 2-column row: [tab label, tab content]. Pad label if somehow empty so the
    // row keeps both columns.
    cells.push([label || '', contentCell]);
  }

  // Empty-block guard: no tabs/panels extractable → unwrap rather than emit empty.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs-adventure', cells });
  element.replaceWith(block);
}
