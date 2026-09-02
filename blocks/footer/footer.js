// WKND footer — content-first: reads /content/footer.plain.html and builds the footer.
// No hardcoded links/labels; all copy comes from the footer fragment.

/**
 * Fetch the footer fragment (metadata-independent dual-fetch).
 * /content first (localhost / aem up), then root (DA/EDS production).
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  block.textContent = '';

  const content = await fetchFooter();
  if (!content) return;

  // Fragment-relative images ("images/x.svg") resolve against the fragment
  // location, not the current page URL — rewrite to absolute paths.
  content.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !src.startsWith('/') && !/^https?:\/\//.test(src)) {
      img.setAttribute('src', `/${src.replace(/^\.?\/*/, '')}`);
    }
  });

  const sections = [...content.children].filter((el) => el.tagName === 'DIV');
  const [brandSection, socialSection, legalSection] = sections;

  const footer = document.createElement('div');
  footer.className = 'footer-inner';

  if (brandSection) {
    brandSection.classList.add('footer-brand');
    // Source footer nav omits "Home" (the logo is Home) — drop that link so the
    // footer nav matches the source's four items: Magazine, Adventures, FAQs, About Us.
    brandSection.querySelectorAll('nav li a, ul li a').forEach((a) => {
      if (a.textContent.trim().toLowerCase() === 'home') a.closest('li').remove();
    });
    footer.append(brandSection);
  }
  if (socialSection) {
    socialSection.classList.add('footer-social');
    footer.append(socialSection);
  }
  if (legalSection) {
    legalSection.classList.add('footer-legal');
    footer.append(legalSection);
  }

  block.append(footer);
}
