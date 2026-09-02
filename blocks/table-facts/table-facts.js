/*
 * Table Facts Block
 * A vertical label/value facts panel (trip details).
 * Each authored row is a fact: cell 1 = label, cell 2 = value.
 */

/**
 * @param {Element} block
 */
export default async function decorate(block) {
  const dl = document.createElement('dl');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const fact = document.createElement('div');
    fact.className = 'table-facts-fact';

    const dt = document.createElement('dt');
    dt.innerHTML = cells[0] ? cells[0].innerHTML : '';
    fact.append(dt);

    if (cells[1]) {
      const dd = document.createElement('dd');
      dd.innerHTML = cells[1].innerHTML;
      fact.append(dd);
    }

    dl.append(fact);
  });

  block.replaceChildren(dl);
}
