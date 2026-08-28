/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * All selectors verified against migration-work/cleaned.html.
 *
 * Removes non-authorable site chrome (header experience fragment, footer
 * experience fragment, mobile navigation, tracking iframe) and leftover
 * empty elements so the import contains only page-level authorable content.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Adobe ID syncing / tracking iframe — verified: <iframe id="destination_publishing_iframe_wkndsite_0">
    // Mobile nav chrome — verified: #toggleNav (line 568), #mobileNav (line 574)
    WebImporter.DOMUtils.remove(element, [
      '#destination_publishing_iframe_wkndsite_0',
      '#toggleNav',
      '#mobileNav',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome — verified in cleaned.html:
    //   header.experiencefragment.cmp-experiencefragment--header (line 5)
    //   footer.experiencefragment.cmp-experiencefragment--footer (line 471)
    // Leftover empty <meta> tags inside cmp-image blocks (lines 183, 204, 227, 271, 334, 378)
    // and any stray iframe/noscript.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      'iframe',
      'noscript',
      'meta',
    ]);
  }
}
