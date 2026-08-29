/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-article. Base: cards.
 * Source: https://www.wknd.site/us/en/magazine.html
 * Generated: 2026-08-28
 *
 * Library convention (cards-article/library-description.txt): 2 columns,
 * multiple rows. First row = block name. Each subsequent row = one card:
 *   image (mandatory) + text content (title styled as heading, description
 *   below, optional CTA link).
 *
 * This parser handles the TWO DOM shapes that map to cards-article on the WKND
 * magazine page (both selectors verified against the live magazine markup and
 * migration-work/block-context/cards-article/source.html):
 *
 *   1. .image-list.list  → "All Articles" grid. A <ul> holds many
 *      .cmp-image-list__item cards (image link + title link + description).
 *      Rows are emitted [image, content] so the image renders ABOVE the text,
 *      matching the source grid. One block, one row per item. UNCHANGED.
 *
 *   2. .teaser.cmp-teaser--secure → the "Members Only" secured teasers. On the
 *      page there are TWO sibling teasers that must render as ONE 2-up
 *      cards-article block, each card showing (in source order) the title,
 *      description and a "Read More" CTA ABOVE the image. So for secure teasers:
 *        - all sibling .teaser.cmp-teaser--secure elements are grouped into a
 *          SINGLE multi-row block (2 rows here) so they render side-by-side,
 *        - each row is emitted [content, image] so the image renders BELOW the
 *          text, matching source, and
 *        - the "Read More" action is preserved (as a link when the secured
 *          markup carries an href, otherwise as its faithful plain-text CTA —
 *          the secured teaser exposes "Read More" as text with no href).
 */

/**
 * Build one "All Articles" grid card row ([imageCell, contentCell]) from a
 * .cmp-image-list__item element. Returns null when it has neither image nor text.
 */
function buildImageListCard(root, document) {
  const image = root.querySelector('.cmp-image-list__item-image img, img');

  const contentCell = [];

  const titleEl = root.querySelector('.cmp-image-list__item-title');
  const linkEl = root.querySelector(
    '.cmp-image-list__item-title-link, .cmp-image-list__item-image-link',
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

  const description = root.querySelector('.cmp-image-list__item-description');
  if (description) {
    const p = document.createElement('p');
    p.textContent = description.textContent.trim();
    contentCell.push(p);
  }

  if (!image && !contentCell.length) return null;
  return [image || '', contentCell];
}

/**
 * Build one "Members Only" secured teaser card row from a .cmp-teaser root.
 * Emits [contentCell, imageCell] (text then image) so the image renders BELOW
 * the text, matching the source. contentCell = heading + description + the
 * "Read More" CTA. Returns null when the teaser has neither image nor text.
 */
function buildSecureTeaserCard(root, document) {
  const image = root.querySelector('.cmp-teaser__image img, img');

  const contentCell = [];

  const titleEl = root.querySelector('.cmp-teaser__title');
  if (titleEl) {
    const heading = document.createElement('h3');
    heading.textContent = titleEl.textContent.trim();
    contentCell.push(heading);
  }

  const description = root.querySelector('.cmp-teaser__description');
  if (description) {
    const descText = description.textContent.trim();
    if (descText) {
      const p = document.createElement('p');
      p.textContent = descText;
      contentCell.push(p);
    }
  }

  // "Read More" CTA. Prefer a real action link with an href; otherwise fall
  // back to the action container's plain text (secured teasers expose the CTA
  // label as text with no href). Preserve it either way so it is not dropped.
  const actionLink = root.querySelector('.cmp-teaser__action-link');
  const actionHref = actionLink && actionLink.getAttribute('href');
  const actionContainer = root.querySelector('.cmp-teaser__action-container');
  const ctaText = (
    (actionLink && actionLink.textContent.trim())
    || (actionContainer && actionContainer.textContent.trim())
    || ''
  );
  if (ctaText) {
    const p = document.createElement('p');
    if (actionHref) {
      const link = document.createElement('a');
      link.href = actionHref;
      link.textContent = ctaText;
      p.append(link);
    } else {
      p.textContent = ctaText;
    }
    contentCell.push(p);
  }

  if (!image && !contentCell.length) return null;
  return [contentCell, image || ''];
}

export default function parse(element, { document }) {
  // Shape 1: image-list grid — one card per .cmp-image-list__item. UNCHANGED.
  const listItems = Array.from(element.querySelectorAll('.cmp-image-list__item'));

  if (listItems.length) {
    const cells = [];
    listItems.forEach((item) => {
      const row = buildImageListCard(item, document);
      if (row) cells.push(row);
    });

    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }

    const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
    element.replaceWith(block);
    return;
  }

  // Shape 2: secured "Members Only" teaser(s). Group every sibling
  // .teaser.cmp-teaser--secure into a SINGLE multi-row block so they render
  // side-by-side (2-up) instead of as separate stacked single-card blocks.
  const parent = element.parentNode;
  const secureTeasers = parent
    ? Array.from(parent.children).filter(
      (el) => el.matches && el.matches('.teaser.cmp-teaser--secure'),
    )
    : [];
  const group = secureTeasers.length ? secureTeasers : [element];

  const cells = [];
  group.forEach((teaser) => {
    const root = teaser.querySelector('.cmp-teaser') || teaser;
    const row = buildSecureTeaserCard(root, document);
    if (row) cells.push(row);
  });

  // Empty-block guard.
  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-article', cells });
  // Replace the first teaser (in DOM order) with the single grouped block and
  // remove the rest. Their own later parse() call is a safe no-op: the import
  // runner skips blocks whose element has already been detached from the DOM.
  group[0].replaceWith(block);
  group.slice(1).forEach((teaser) => {
    if (teaser.parentNode) teaser.remove();
  });
}
