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

  // tools/importer/import-adventure-detail.js
  var import_adventure_detail_exports = {};
  __export(import_adventure_detail_exports, {
    default: () => import_adventure_detail_default
  });

  // tools/importer/parsers/table-facts.js
  function parse(element, { document: document2 }) {
    const cells = [];
    let entries = Array.from(
      element.querySelectorAll(".cmp-contentfragment__element")
    );
    if (!entries.length) {
      const dts = Array.from(element.querySelectorAll("dt"));
      dts.forEach((dt) => {
        const dd = dt.nextElementSibling;
        const label = dt.textContent.trim();
        const value = dd ? dd.textContent.trim() : "";
        if (label) cells.push([label, value]);
      });
    } else {
      entries.forEach((entry) => {
        const labelEl = entry.querySelector(
          ".cmp-contentfragment__element-title, dt"
        );
        const valueEl = entry.querySelector(
          ".cmp-contentfragment__element-value, dd"
        );
        const label = labelEl ? labelEl.textContent.trim() : "";
        const value = valueEl ? valueEl.textContent.trim() : "";
        if (label || value) cells.push([label, value]);
      });
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "table-facts", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/tabs-adventure.js
  function parse2(element, { document: document2 }) {
    const cells = [];
    let tabs = Array.from(element.querySelectorAll(".cmp-tabs__tab"));
    if (!tabs.length) tabs = Array.from(element.querySelectorAll(".cmp-tabs__tablist li"));
    let panels = Array.from(element.querySelectorAll(".cmp-tabs__tabpanel"));
    if (!panels.length) panels = Array.from(element.querySelectorAll('[class*="tabpanel"]'));
    const count = Math.min(tabs.length, panels.length);
    for (let i = 0; i < count; i += 1) {
      const label = tabs[i].textContent.trim();
      const panel = panels[i];
      const contentRoot = panel.querySelector(".cmp-contentfragment__elements") || panel;
      let contentNodes = Array.from(
        contentRoot.querySelectorAll("h2, h3, h4, h5, h6, p, ul, ol, img")
      );
      contentNodes = contentNodes.filter(
        (node) => !contentNodes.some((other) => other !== node && other.contains(node))
      );
      const contentCell = contentNodes.length ? contentNodes : [contentRoot];
      cells.push([label || "", contentCell]);
    }
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document2, { name: "tabs-adventure", cells });
    element.replaceWith(block);
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

  // tools/importer/import-adventure-detail.js
  var PAGE_TEMPLATE = {
    name: "adventure-detail",
    description: "WKND adventure detail page (individual trip)",
    urls: [
      "https://www.wknd.site/us/en/adventures/bali-surf-camp.html"
    ],
    blocks: [
      {
        name: "table-facts",
        instances: [".contentfragment.cmp-contentfragment--elements"]
      },
      {
        name: "tabs-adventure",
        instances: [".tabs.panelcontainer"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Lead image",
        selector: ".carousel.panelcontainer.cmp-carousel--mini",
        style: null,
        blocks: [],
        defaultContent: ["img"]
      },
      {
        id: "section-2",
        name: "Trip title",
        selector: ".title.cmp-title--underline",
        style: null,
        blocks: [],
        defaultContent: ["h1"]
      },
      {
        id: "section-3",
        name: "Trip details facts panel",
        selector: ".contentfragment.cmp-contentfragment--elements",
        style: null,
        blocks: ["table-facts"],
        defaultContent: []
      },
      {
        id: "section-4",
        name: "Tabbed trip content",
        selector: ".tabs.panelcontainer",
        style: null,
        blocks: ["tabs-adventure"],
        defaultContent: []
      }
    ]
  };
  var parsers = {
    "table-facts": parse,
    "tabs-adventure": parse2
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
  var import_adventure_detail_default = {
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
  return __toCommonJS(import_adventure_detail_exports);
})();
