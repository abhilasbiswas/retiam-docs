export interface HierarchyNode {
  id: string;
  name: string;
  kind: 'class' | 'interface' | 'type';
  source: string;
  url?: string;
  abstract: boolean;
  external?: boolean;
  description?: string;
  example?: string;
  visibility: string;
}
export interface HierarchyEdge { from: string; to: string; kind: 'extends' | 'implements' }
export interface HierarchyIndex { nodes: HierarchyNode[]; edges: HierarchyEdge[] }

export function resolveHierarchyRoot(index: HierarchyIndex, root: string) {
  const matches = index.nodes.filter(node => node.id === root || `${node.source}:${node.name}` === root || node.name === root);
  return matches.length === 1 ? matches[0] : undefined;
}

/** Keep a focus type's ancestors for context; depth limits its descendants. */
export function hierarchyView(index: HierarchyIndex, root: string, depth: number | 'all', interfaces: boolean) {
  const focus = resolveHierarchyRoot(index, root);
  if (!focus) throw new Error(`Unknown or ambiguous hierarchy root: ${root}`);
  const edges = index.edges.filter(edge => interfaces || edge.kind === 'extends');
  const selected = new Set([focus.id]), ancestors = new Set([focus.id]);
  let frontier = [focus.id];
  while (frontier.length) {
    const parents = edges.filter(edge => frontier.includes(edge.to) && !ancestors.has(edge.from)).map(edge => edge.from);
    parents.forEach(id => { selected.add(id); ancestors.add(id); });
    frontier = parents;
  }
  const descendants = new Set([focus.id]);
  frontier = [focus.id];
  for (let level = 0; frontier.length && (depth === 'all' || level < depth); level++) {
    const children = edges.filter(edge => frontier.includes(edge.from) && !descendants.has(edge.to)).map(edge => edge.to);
    children.forEach(id => { selected.add(id); descendants.add(id); });
    frontier = children;
  }
  return { focus, nodes: index.nodes.filter(node => selected.has(node.id)),
    edges: edges.filter(edge => selected.has(edge.from) && selected.has(edge.to)),
    descendants: descendants.size - 1 };
}

export function hierarchyDiagram(view: ReturnType<typeof hierarchyView>) {
  const ids = new Map(view.nodes.map((node, index) => [node.id, `n${index}`]));
  const duplicates = new Set(view.nodes.filter(node => view.nodes.some(other => other.id !== node.id && other.name === node.name)).map(node => node.name));
  const links: Record<string, { url: string; name: string; source: string }> = {};
  const lines = ['---', 'config:', '  flowchart:', '    curve: linear', '    nodeSpacing: 28', '    rankSpacing: 96', '    padding: 8', '---', 'flowchart LR'];
  for (const node of view.nodes) {
    const label = duplicates.has(node.name) ? `${node.name} (${node.source})` : node.name;
    if (node.url) links[ids.get(node.id)!] = { url: node.url, name: node.name, source: node.source };
    lines.push(`  ${ids.get(node.id)}[${JSON.stringify(label)}]`);
    if (node.id === view.focus.id) lines.push(`  class ${ids.get(node.id)} focus`);
    if (node.kind !== 'class') lines.push(`  class ${ids.get(node.id)} contract`);
    if (node.abstract) lines.push(`  class ${ids.get(node.id)} abstract`);
    if (node.external) lines.push(`  class ${ids.get(node.id)} external`);
  }
  // Keep actual inheritance levels. Artificial branch junctions occupy a rank
  // and can place a vertical trunk through an unrelated sibling's descendants.
  // The canvas routes these edges through the gaps between the type columns.
  for (const edge of view.edges) {
    lines.push(`  ${ids.get(edge.from)} ${edge.kind === 'implements' ? '-.->' : '-->'} ${ids.get(edge.to)}`);
  }
  lines.push('  classDef focus stroke-width:3px', '  classDef contract stroke-dasharray:5 3', '  classDef abstract font-style:italic', '  classDef external opacity:0.65');
  return { code: lines.join('\n'), links };
}
