/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-magazine.js
  var import_magazine_exports = {};
  __export(import_magazine_exports, {
    default: () => import_magazine_default
  });

  // tools/importer/parsers/columns-featured.js
  function parse(element, { document: document2 }) {
    const teaser = element.querySelector(".cmp-teaser") || element;
    const textContent = teaser.querySelector(".cmp-teaser__content");
    const image = teaser.querySelector(".cmp-teaser__image img, img");
    if (!textContent && !image) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [
      [textContent || "", image || ""]
    ];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-featured", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function buildImageListCard(root, document2) {
    const image = root.querySelector(".cmp-image-list__item-image img, img");
    const contentCell = [];
    const titleEl = root.querySelector(".cmp-image-list__item-title");
    const linkEl = root.querySelector(
      ".cmp-image-list__item-title-link, .cmp-image-list__item-image-link"
    );
    const href = linkEl && linkEl.getAttribute("href");
    if (titleEl) {
      const heading = document2.createElement("h3");
      const titleText = titleEl.textContent.trim();
      if (href) {
        const link = document2.createElement("a");
        link.href = href;
        link.textContent = titleText;
        heading.append(link);
      } else {
        heading.textContent = titleText;
      }
      contentCell.push(heading);
    }
    const description = root.querySelector(".cmp-image-list__item-description");
    if (description) {
      const p = document2.createElement("p");
      p.textContent = description.textContent.trim();
      contentCell.push(p);
    }
    if (!image && !contentCell.length) return null;
    return [image || "", contentCell];
  }
  function buildSecureTeaserCard(root, document2) {
    const image = root.querySelector(".cmp-teaser__image img, img");
    const contentCell = [];
    const titleEl = root.querySelector(".cmp-teaser__title");
    if (titleEl) {
      const heading = document2.createElement("h3");
      heading.textContent = titleEl.textContent.trim();
      contentCell.push(heading);
    }
    const description = root.querySelector(".cmp-teaser__description");
    if (description) {
      const descText = description.textContent.trim();
      if (descText) {
        const p = document2.createElement("p");
        p.textContent = descText;
        contentCell.push(p);
      }
    }
    const actionLink = root.querySelector(".cmp-teaser__action-link");
    const actionHref = actionLink && actionLink.getAttribute("href");
    const actionContainer = root.querySelector(".cmp-teaser__action-container");
    const ctaText = actionLink && actionLink.textContent.trim() || actionContainer && actionContainer.textContent.trim() || "";
    if (ctaText) {
      const p = document2.createElement("p");
      if (actionHref) {
        const link = document2.createElement("a");
        link.href = actionHref;
        link.textContent = ctaText;
        p.append(link);
      } else {
        p.textContent = ctaText;
      }
      contentCell.push(p);
    }
    if (!image && !contentCell.length) return null;
    return [contentCell, image || ""];
  }
  function parse2(element, { document: document2 }) {
    const listItems = Array.from(element.querySelectorAll(".cmp-image-list__item"));
    if (listItems.length) {
      const cells2 = [];
      listItems.forEach((item) => {
        const row = buildImageListCard(item, document2);
        if (row) cells2.push(row);
      });
      if (!cells2.length) {
        element.replaceWith(...element.childNodes);
        return;
      }
      const block2 = WebImporter.Blocks.createBlock(document2, { name: "cards-article", cells: cells2 });
      element.replaceWith(block2);
      return;
    }
    const parent = element.parentNode;
    const secureTeasers = parent ? Array.from(parent.children).filter(
      (el) => el.matches && el.matches(".teaser.cmp-teaser--secure")
    ) : [];
    const group = secureTeasers.length ? secureTeasers : [element];
    const cells = [];
    group.forEach((teaser) => {
      const root = teaser.querySelector(".cmp-teaser") || teaser;
      const row = buildSecureTeaserCard(root, document2);
      if (row) cells.push(row);
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-article", cells });
    group[0].replaceWith(block);
    group.slice(1).forEach((teaser) => {
      if (teaser.parentNode) teaser.remove();
    });
  }

  // tools/importer/transformers/wknd-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        "#destination_publishing_iframe_wkndsite_0",
        "#toggleNav",
        "#mobileNav"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header.cmp-experiencefragment--header",
        "footer.cmp-experiencefragment--footer",
        ".cmp-separator",
        ".cmp-tabs__tablist",
        "iframe",
        "noscript",
        "meta"
      ]);
      const inactivePanels = element.querySelectorAll(
        ".cmp-tabs__tabpanel:not(.cmp-tabs__tabpanel--active)"
      );
      inactivePanels.forEach((panel) => {
        if (panel.querySelector(".image-list")) panel.remove();
      });
    }
  }

  // tools/importer/transformers/wknd-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  var INTRO_SIBLING_SELECTOR = ".cmp-title--underline, .text, .separator";
  function sectionBreakAnchor(sectionEl) {
    let anchor = sectionEl;
    let prev = anchor.previousElementSibling;
    while (prev && prev.matches && prev.matches(INTRO_SIBLING_SELECTOR)) {
      anchor = prev;
      prev = anchor.previousElementSibling;
    }
    return anchor;
  }
  function transform2(hookName, element, payload) {
    const sections = payload.template && payload.template.sections || [];
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = element.querySelector(section.selector);
        if (!sectionEl) continue;
        const anchor = sectionBreakAnchor(sectionEl);
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        anchor.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || element.querySelector(section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-magazine.js
  var PAGE_TEMPLATE = {
    name: "magazine",
    description: "WKND magazine listing page - featured article, all articles grid, members-only teasers",
    urls: [
      "https://www.wknd.site/us/en/magazine.html"
    ],
    blocks: [
      {
        name: "columns-featured",
        instances: [".teaser.cmp-teaser--featured"]
      },
      {
        name: "cards-article",
        instances: [".image-list.list", ".teaser.cmp-teaser--secure"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Page title",
        selector: "main.cmp-layout-container--fixed:nth-of-type(1)",
        style: null,
        blocks: [],
        defaultContent: ["h1"]
      },
      {
        id: "section-2",
        name: "Featured article teaser",
        selector: ".teaser.cmp-teaser--featured",
        style: "highlight",
        blocks: ["columns-featured"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "All articles grid",
        selector: ".image-list.list",
        style: null,
        blocks: ["cards-article"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "Members Only teasers",
        selector: ".teaser.cmp-teaser--secure",
        style: null,
        blocks: ["cards-article"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "columns-featured": parse,
    "cards-article": parse2
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_magazine_default = {
    transform: (payload) => {
      const {
        document: document2,
        url,
        html,
        params
      } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_magazine_exports);
})();
