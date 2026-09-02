/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-team. Base: cards.
 * Source: https://www.wknd.site/us/en/about-us.html
 * Generated: 2026-08-29
 *
 * Library convention (cards-team/library-description.txt → "Cards"): 2 columns,
 * multiple rows. First row = block name. Each subsequent row = one card:
 *   cell 1 = image (mandatory), cell 2 = text content (title as heading,
 *   description below, optional CTA/links at the bottom).
 *
 * Instance selector (page-templates.json, verified against migration-work/cleaned.html):
 *   .experiencefragment.cmp-experience-fragment--contributor
 * This selector matches EACH of the 7 individual contributor experience
 * fragments on the About Us page (4 under "Our Contributors" + 3 under
 * "WKND Guides"). The import framework calls this parser ONCE PER matched
 * element, so each invocation converts ONE contributor XF into ONE card row and
 * replaces that element with a compact one-row cards-team block.
 *
 * Per-contributor DOM (verified against block-context/cards-team/source.html and
 * cleaned.html):
 *   .cmp-experiencefragment--{name}
 *     .image .cmp-image img.cmp-image__image        → circular portrait
 *     .title .cmp-title h3.cmp-title__text          → contributor name
 *     .title.cmp-title--black .cmp-title h5          → role / occupation
 *     .cmp-buildingblock--btn-list a.cmp-button      → up to 3 social icon links
 *         href="#facebook-…" / "#twitter-…" / "#insta-…"
 *         (label text lives in span.cmp-button__text: Facebook / Twitter / Instagram)
 */

export default function parse(element, { document }) {
  // Portrait image (mandatory first cell).
  const image = element.querySelector('.cmp-image img.cmp-image__image, .cmp-image img, img');

  const contentCell = [];

  // Name → first .cmp-title (rendered as an <h3>). Keep it as a real heading.
  const titleEls = Array.from(element.querySelectorAll('.title .cmp-title__text, .cmp-title__text'));
  const nameEl = titleEls[0];
  if (nameEl) {
    const heading = document.createElement('h3');
    heading.textContent = nameEl.textContent.trim();
    contentCell.push(heading);
  }

  // Role / occupation → second .cmp-title (the .cmp-title--black h5). Emit as a paragraph.
  const roleEl = titleEls[1];
  if (roleEl) {
    const p = document.createElement('p');
    p.textContent = roleEl.textContent.trim();
    contentCell.push(p);
  }

  // Social links → preserve as real <a> elements with their hrefs. Icon buttons
  // carry a visually-hidden label in .cmp-button__text; fall back to a label
  // derived from the icon class or the href when that text is absent.
  const socialLinks = Array.from(
    element.querySelectorAll('.cmp-buildingblock--btn-list a[href], a.cmp-button[href]'),
  );
  if (socialLinks.length) {
    const socialP = document.createElement('p');
    socialLinks.forEach((source, i) => {
      const href = source.getAttribute('href');
      if (!href) return;
      const link = document.createElement('a');
      link.href = href;

      const labelEl = source.querySelector('.cmp-button__text');
      let label = labelEl ? labelEl.textContent.trim() : '';
      if (!label) {
        const icon = source.querySelector('[class*="cmp-button__icon--"]');
        const iconClass = icon
          && (icon.className.match(/cmp-button__icon--([a-z]+)/) || [])[1];
        label = iconClass
          ? iconClass.charAt(0).toUpperCase() + iconClass.slice(1)
          : href.replace(/^#/, '');
      }
      link.textContent = label;

      socialP.append(link);
      if (i < socialLinks.length - 1) socialP.append(document.createTextNode(' '));
    });
    if (socialP.childNodes.length) contentCell.push(socialP);
  }

  // Empty-block guard: nothing meaningful to emit → unwrap in place.
  if (!image && !contentCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[image || '', contentCell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-team', cells });
  element.replaceWith(block);
}
