/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND site-wide cleanup.
 * Selectors verified against migration-work/cleaned.html and the live
 * adventures + magazine pages. Shared by every WKND template.
 *
 * Removes non-authorable site chrome (header experience fragment, footer
 * experience fragment incl. footer nav, mobile navigation, Adobe ID tracking
 * iframe), leftover empty <meta> tags, decorative separators, and the AEM Tabs
 * chrome (tab button list + inactive tab panels — adventures only) so the import
 * contains only page-level authorable content.
 *
 * Tab-panel note (adventures): the cards live inside the ACTIVE tab panel
 * (.cmp-tabs__tabpanel--active) and the cards-article parser scopes to it, so
 * NOTHING that touches tab panels runs in beforeTransform. Inactive tab panels
 * (duplicate, category-filtered copies of the same cards) and the tab button
 * list are removed only in afterTransform — after the parser has extracted the
 * active panel's image-list into a block. The magazine page has no tabs, so
 * these selectors simply match nothing there.
 *
 * Magazine note: this cleanup deliberately does NOT remove the "Members Only"
 * teasers (.teaser.cmp-teaser--secure) or the sign-in prompt (.text) — both are
 * authorable content. Only the decorative .separator above the secured teasers
 * is stripped (afterTransform, after the section transformer has placed its own
 * section break), and the featured teaser + secured teasers are left intact for
 * the columns-featured / cards-article parsers to consume.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Adobe ID syncing / tracking iframe — verified: <iframe id="destination_publishing_iframe_wkndsite_0"> (line 834)
    // Mobile nav chrome — verified: #toggleNav (line 836), #mobileNav (line 842)
    // These do not affect block parsing but are removed early as global chrome.
    // NOTE: no tab-panel selectors here — the parser needs the active tab panel intact.
    WebImporter.DOMUtils.remove(element, [
      '#destination_publishing_iframe_wkndsite_0',
      '#toggleNav',
      '#mobileNav',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Non-authorable site chrome — verified in cleaned.html:
    //   header.experiencefragment.cmp-experiencefragment--header (line 5)
    //   footer.experiencefragment.cmp-experiencefragment--footer (line 739; contains footer nav)
    // Decorative separator that would otherwise become a stray section break —
    //   .cmp-separator wraps a bare <hr class="cmp-separator__horizontal-rule"> (lines 728-731).
    //   Target the wrapper, never bare `hr`, so the section transformer's inserted <hr> breaks survive.
    // AEM Tabs chrome (adventures listing):
    //   .cmp-tabs__tablist — tab buttons "All/Climbing/…" (lines 202-209), non-authorable UI.
    //   .cmp-tabs__tabpanel:not(.cmp-tabs__tabpanel--active) — inactive panels (lines 456,492,543,594,630…)
    //     hold duplicate category-filtered copies of the same adventure cards; the active panel is preserved.
    // Leftover empty <meta> tag inside a cmp-image block (line 187) and any stray iframe/noscript.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      '.cmp-separator',
      '.cmp-tabs__tablist',
      '.cmp-tabs__tabpanel:not(.cmp-tabs__tabpanel--active)',
      'iframe',
      'noscript',
      'meta',
    ]);
  }
}
