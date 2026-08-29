/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table-facts. Base: table (vanilla "Table (no header)" variant).
 * Source: https://www.wknd.site/us/en/adventures/bali-surf-camp.html
 * Generated: 2026-08-29
 *
 * The adventure "trip details" facts panel is a content fragment rendered as a
 * definition list: <dl.cmp-contentfragment__elements> whose entries are
 * <div.cmp-contentfragment__element>, each holding a
 * <dt.cmp-contentfragment__element-title> (the label, e.g. "Activity") and a
 * <dd.cmp-contentfragment__element-value> (the value, e.g. "Surfing").
 * The fields are: Activity, Adventure Type, Trip Length, Group Size,
 * Difficulty, Price.
 *
 * Library convention (table-facts/library-description.txt → "Table"): multiple
 * columns, multiple rows. Row 1 = block name. Each subsequent row is a data
 * row whose cells hold labels/values. This facts panel maps to a 2-column
 * table: one row per fact, cell 1 = label, cell 2 = value.
 *
 * All selectors verified against migration-work/block-context/table-facts/source.html.
 * Fallbacks are included for cross-page resilience (the 32 adventure-detail
 * pages share this markup but carry different field sets / values).
 */
export default function parse(element, { document }) {
  const cells = [];

  // One row per content-fragment element (a label/value pair).
  let entries = Array.from(
    element.querySelectorAll('.cmp-contentfragment__element'),
  );
  // Fallback: derive pairs directly from <dt>/<dd> if the wrapper class differs.
  if (!entries.length) {
    const dts = Array.from(element.querySelectorAll('dt'));
    dts.forEach((dt) => {
      const dd = dt.nextElementSibling;
      const label = dt.textContent.trim();
      const value = dd ? dd.textContent.trim() : '';
      if (label) cells.push([label, value]);
    });
  } else {
    entries.forEach((entry) => {
      const labelEl = entry.querySelector(
        '.cmp-contentfragment__element-title, dt',
      );
      const valueEl = entry.querySelector(
        '.cmp-contentfragment__element-value, dd',
      );
      const label = labelEl ? labelEl.textContent.trim() : '';
      const value = valueEl ? valueEl.textContent.trim() : '';
      // Skip fully empty pairs; keep the row otherwise so columns stay aligned.
      if (label || value) cells.push([label, value]);
    });
  }

  // Empty-block guard: nothing extractable → unwrap rather than emit an empty block.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'table-facts', cells });
  element.replaceWith(block);
}
