// Runs in the browser's read-only DOM scope. Check the actual SVG geometry,
// including nodes outside the currently visible portion of a large hierarchy.
export function measureHierarchyCollisions(svg) {
  const bounds = svg.getBoundingClientRect();
  const [vx, vy, width, height] = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
  const sx = bounds.width / width, sy = bounds.height / height;
  const nodes = [...svg.querySelectorAll('.node:not(.junction)')].map(node => {
    const rect = node.querySelector('rect')?.getBoundingClientRect();
    return rect && { name: node.textContent.trim(),
      left: (rect.left - bounds.left + 1) / sx + vx, right: (rect.right - bounds.left - 1) / sx + vx,
      top: (rect.top - bounds.top + 1) / sy + vy, bottom: (rect.bottom - bounds.top - 1) / sy + vy };
  }).filter(Boolean);
  const intersects = (a, b, box) => {
    let first = 0, last = 1;
    for (const [start, delta, min, max] of [[a[0], b[0] - a[0], box.left, box.right], [a[1], b[1] - a[1], box.top, box.bottom]]) {
      if (Math.abs(delta) < 1e-9) { if (start <= min || start >= max) return false; }
      else {
        const t1 = (min - start) / delta, t2 = (max - start) / delta;
        first = Math.max(first, Math.min(t1, t2)); last = Math.min(last, Math.max(t1, t2));
      }
      if (first >= last) return false;
    }
    return true;
  };
  const edges = [];
  for (const path of svg.querySelectorAll('.edgePaths path')) {
    const d = path.getAttribute('d');
    if (/[ACHQSTVZ]/i.test(d)) throw new Error('Collision checks require linear hierarchy paths.');
    const values = d.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
    const points = Array.from({ length: values.length / 2 }, (_, i) => values.slice(i * 2, i * 2 + 2));
    for (const node of nodes) if (points.some((point, i) => i > 0 && intersects(points[i - 1], point, node))) {
      edges.push({ path: path.id, node: node.name });
    }
  }
  const boxes = [];
  for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
    if (nodes[i].left < nodes[j].right && nodes[i].right > nodes[j].left && nodes[i].top < nodes[j].bottom && nodes[i].bottom > nodes[j].top) boxes.push([nodes[i].name, nodes[j].name]);
  }
  return { nodes: nodes.length, edgeBoxCollisions: edges.length, nodeBoxCollisions: boxes.length, examples: edges.slice(0, 8) };
}

export async function checkDocsHierarchyLayout(tab, baseUrl = 'http://127.0.0.1:4174') {
  const cases = [['Entity','1'], ['Entity','2'], ['Entity','3'], ['Entity','all'], ['Animation','all'], ['Component','all'], ['Pass','all'], ['IPlugin','all'], ['Bezier','all',true]];
  const results = [];
  for (const [root, depth, implementations = false] of cases) {
    await tab.goto(`${baseUrl}/class-hierarchy?type=${root}#explorer`);
    const graph = tab.playwright.locator('.hierarchy-diagram');
    await graph.getByRole('link', { name: `Explore ${root}`, exact: true }).waitFor({ state: 'attached', timeoutMs: 20000 });
    await tab.playwright.getByLabel('Descendant levels', { exact: true }).selectOption(depth);
    if (implementations) await tab.playwright.getByRole('checkbox', { name: 'Show implementations', exact: true }).check();
    // Source changes temporarily remove the SVG while the replacement is laid out.
    await graph.getByRole('button', { name: 'Reset diagram view', exact: true }).waitFor({ state: 'visible', timeoutMs: 20000 });
    await graph.getByRole('link', { name: `Explore ${root}`, exact: true }).waitFor({ state: 'attached', timeoutMs: 20000 });
    const measured = await graph.locator('svg').evaluate(measureHierarchyCollisions);
    if (measured.edgeBoxCollisions || measured.nodeBoxCollisions) throw new Error(`${root} at ${depth} levels has collisions: ${JSON.stringify(measured)}`);
    results.push({ root, depth, implementations, ...measured });
  }
  return results;
}
