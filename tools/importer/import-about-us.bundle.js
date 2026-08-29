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

  // tools/importer/import-about-us.js
  var import_about_us_exports = {};
  __export(import_about_us_exports, {
    default: () => import_about_us_default
  });

  // tools/importer/parsers/cards-team.js
  function parse(element, { document: document2 }) {
    const image = element.querySelector(".cmp-image img.cmp-image__image, .cmp-image img, img");
    const contentCell = [];
    const titleEls = Array.from(element.querySelectorAll(".title .cmp-title__text, .cmp-title__text"));
    const nameEl = titleEls[0];
    if (nameEl) {
      const heading = document2.createElement("h3");
      heading.textContent = nameEl.textContent.trim();
      contentCell.push(heading);
    }
    const roleEl = titleEls[1];
    if (roleEl) {
      const p = document2.createElement("p");
      p.textContent = roleEl.textContent.trim();
      contentCell.push(p);
    }
    const socialLinks = Array.from(
      element.querySelectorAll(".cmp-buildingblock--btn-list a[href], a.cmp-button[href]")
    );
    if (socialLinks.length) {
      const socialP = document2.createElement("p");
      socialLinks.forEach((source, i) => {
        const href = source.getAttribute("href");
        if (!href) return;
        const link = document2.createElement("a");
        link.href = href;
        const labelEl = source.querySelector(".cmp-button__text");
        let label = labelEl ? labelEl.textContent.trim() : "";
        if (!label) {
          const icon = source.querySelector('[class*="cmp-button__icon--"]');
          const iconClass = icon && (icon.className.match(/cmp-button__icon--([a-z]+)/) || [])[1];
          label = iconClass ? iconClass.charAt(0).toUpperCase() + iconClass.slice(1) : href.replace(/^#/, "");
        }
        link.textContent = label;
        socialP.append(link);
        if (i < socialLinks.length - 1) socialP.append(document2.createTextNode(" "));
      });
      if (socialP.childNodes.length) contentCell.push(socialP);
    }
    if (!image && !contentCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[image || "", contentCell]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-team", cells });
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

  // tools/importer/import-about-us.js
  var PAGE_TEMPLATE = {
    name: "about-us",
    description: "WKND About Us content page",
    urls: [
      "https://www.wknd.site/us/en/about-us.html"
    ],
    blocks: [
      {
        name: "cards-team",
        instances: [".experiencefragment.cmp-experience-fragment--contributor"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "About Us content",
        selector: "main.cmp-layout-container--fixed",
        style: null,
        blocks: ["cards-team"],
        defaultContent: ["h1", "h2", "p"]
      }
    ]
  };
  var parsers = {
    "cards-team": parse
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
  var import_about_us_default = {
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
  return __toCommonJS(import_about_us_exports);
})();
