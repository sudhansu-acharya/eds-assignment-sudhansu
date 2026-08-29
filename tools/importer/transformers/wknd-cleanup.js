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
 * chrome (tab button list + inactive category-filter tab panels — adventures
 * listing only) so the import contains only page-level authorable content.
 *
 * Tab-panel note — PAGE-AWARE (adventures listing vs adventure-detail):
 * There are two very different .tabs.panelcontainer shapes on WKND, and the
 * inactive-panel cleanup must only ever touch the FIRST one:
 *   1. adventures LISTING: the cards live inside the ACTIVE tab panel
 *      (.cmp-tabs__tabpanel--active) and the cards-article parser scopes to it
 *      via `.cmp-tabs__tabpanel--active .image-list.list`, replacing only the
 *      image-list. The tabs container + its inactive panels SURVIVE parsing;
 *      the inactive panels are duplicate, category-filtered copies of the same
 *      adventure cards (each contains its own .image-list) and are non-authorable.
 *   2. adventure-detail: the tabs-adventure parser's instance selector IS the
 *      whole `.tabs.panelcontainer`, and it needs ALL panels (Overview /
 *      Itinerary / What to Bring are real content). It replaces the entire
 *      container with a block during parsing, so by afterTransform there are
 *      normally no panels left to touch here at all.
 * To keep this safe regardless of parser ordering/changes, the inactive-panel
 * removal is SCOPED: an inactive .cmp-tabs__tabpanel is removed ONLY when it
 * contains an `.image-list` (the listing's duplicate card filters). The
 * adventure-detail content panels have no .image-list, so they are never
 * removed — the tabs-adventure parser always receives all panels. NOTHING that
 * touches tab panels runs in beforeTransform. The magazine page has no tabs, so
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
    //   .cmp-tabs__tablist — tab buttons "All/Climbing/…", non-authorable UI. Safe
    //     to remove on both templates: the tabs-adventure parser has already read the
    //     labels into the block, and the adventures cards-article parser doesn't use it.
    // Leftover empty <meta> tag inside a cmp-image block (line 187) and any stray iframe/noscript.
    WebImporter.DOMUtils.remove(element, [
      'header.cmp-experiencefragment--header',
      'footer.cmp-experiencefragment--footer',
      '.cmp-separator',
      '.cmp-tabs__tablist',
      'iframe',
      'noscript',
      'meta',
    ]);

    // Inactive tab panels — PAGE-AWARE removal (see header note). Remove an
    // inactive .cmp-tabs__tabpanel ONLY when it holds an .image-list: those are
    // the adventures-listing duplicate, category-filtered copies of the same
    // cards (the active panel was already parsed into cards-article). The
    // adventure-detail content panels (Overview/Itinerary/What to Bring) contain
    // no .image-list, so they are preserved for the tabs-adventure parser — and
    // in practice that parser has already replaced the whole container by now.
    const inactivePanels = element.querySelectorAll(
      '.cmp-tabs__tabpanel:not(.cmp-tabs__tabpanel--active)',
    );
    inactivePanels.forEach((panel) => {
      if (panel.querySelector('.image-list')) panel.remove();
    });
  }
}
