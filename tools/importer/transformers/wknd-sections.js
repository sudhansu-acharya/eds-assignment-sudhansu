/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND section breaks and section metadata.
 *
 * Template-agnostic: reads payload.template.sections directly, so it serves
 * every WKND template.
 *   - "adventures": 3 sections (page title, hero teaser, cards listing), all
 *     style: null → 2 <hr> breaks, 0 Section Metadata blocks.
 *   - "magazine": 4 sections (page title, featured teaser [style: highlight],
 *     All Articles grid, Members Only teasers) → 3 <hr> breaks + 1 Section
 *     Metadata block (highlight) for the featured section.
 * Section selectors are DOM-verified boundaries from page analysis
 * (page-templates.json) — used directly, not re-derived.
 *
 * Note on selectors that parsers replace: some section selectors point at the
 * exact element a block parser replaces (adventures .teaser.cmp-teaser--hero;
 * magazine .teaser.cmp-teaser--featured and .teaser.cmp-teaser--secure). That is
 * why breaks are inserted in beforeTransform (before parsing) while the section
 * elements still exist. Selectors that point at a wrapper the parser scopes
 * inside (adventures .tabs.panelcontainer; magazine .image-list.list) survive
 * parsing regardless.
 *
 * Leading intro siblings: on the magazine page the block a section selector
 * matches is preceded by intro content that belongs to the SAME section — the
 * "All Articles" / "Members Only" underline titles, the Members-Only sign-in
 * prompt (.text), and a decorative .separator. Inserting the break directly
 * before the block element would misfile that intro content into the previous
 * section, so the anchor walks back over consecutive intro siblings and places
 * the break before the earliest one. The plain page-title H1 (a .title WITHOUT
 * cmp-title--underline) is NOT an intro sibling, so it correctly stays in the
 * page-title section.
 *
 * Both hooks are required: block parsers run between beforeTransform and
 * afterTransform and replace the exact elements the section selectors match,
 * so <hr> breaks are inserted in beforeTransform (while section elements still
 * exist) using a marker attribute, and Section Metadata is inserted in
 * afterTransform anchored to that marker.
 */

const SECTION_MARKER_ATTR = 'data-excat-section-id';

// Intro content that visually introduces a section and must be grouped with the
// block that follows it (verified against migration-work/cleaned.html):
//   .cmp-title--underline — "All Articles" / "Members Only" underline headings
//   .text                 — the Members-Only sign-in prompt paragraph
//   .separator            — decorative rule above the secured teasers
const INTRO_SIBLING_SELECTOR = '.cmp-title--underline, .text, .separator';

/**
 * Given the element a section selector matched, return the element the section
 * break should be inserted before: the earliest consecutive preceding sibling
 * that is section intro content, or the section element itself when there is none.
 */
function sectionBreakAnchor(sectionEl) {
  let anchor = sectionEl;
  let prev = anchor.previousElementSibling;
  while (prev && prev.matches && prev.matches(INTRO_SIBLING_SELECTOR)) {
    anchor = prev;
    prev = anchor.previousElementSibling;
  }
  return anchor;
}

export default function transform(hookName, element, payload) {
  const sections = (payload.template && payload.template.sections) || [];

  if (hookName === 'beforeTransform') {
    // Insert breaks now, before parsers can replace any section element.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue; // first section: no leading break needed
      const sectionEl = element.querySelector(section.selector);
      if (!sectionEl) continue; // selector didn't match — skip, never guess

      // Group any leading intro content (underline titles, sign-in prompt,
      // separator) with this section by placing the break above it.
      const anchor = sectionBreakAnchor(sectionEl);

      const hr = document.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      anchor.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    // Parsers have now run and may have replaced section elements. Anchor each
    // styled section's Section Metadata block to whichever still exists: the
    // marker <hr> placed above, or the original element (first section only).
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || element.querySelector(section.selector);
      if (!anchor) continue; // neither survived — skip, never guess

      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove(); // section 0 never gets a real leading break
      }
    }
  }
}
