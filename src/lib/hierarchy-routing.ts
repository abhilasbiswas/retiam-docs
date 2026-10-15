export interface HierarchyBox { id: string; x: number; y: number; width: number; height: number }
export interface HierarchyRoute { id: string; from: string; to: string; kind: 'extends' | 'implements' }

/** Route through empty column gutters, never through the columns containing types. */
export function routeHierarchyEdges(boxes: HierarchyBox[], edges: HierarchyRoute[]) {
  const columns: { x: number; left: number; right: number; nodes: HierarchyBox[] }[] = [];
  for (const box of [...boxes].sort((a, b) => a.x - b.x || a.y - b.y)) {
    let column = columns.find(column => Math.abs(column.x - box.x) < 0.1);
    if (!column) { column = { x: box.x, left: box.x - box.width / 2, right: box.x + box.width / 2, nodes: [] }; columns.push(column); }
    column.nodes.push(box);
    column.left = Math.min(column.left, box.x - box.width / 2);
    column.right = Math.max(column.right, box.x + box.width / 2);
  }
  const positions = new Map(columns.flatMap((column, i) => column.nodes.map(node => [node.id, { box: node, column: i }] as const)));
  const branches = columns.map(() => [] as string[]);
  for (const edge of edges) {
    const source = positions.get(edge.from);
    if (!source || !positions.has(edge.to)) throw new Error(`Unknown hierarchy edge: ${edge.id}`);
    const key = `${edge.from}:${edge.kind}`;
    if (!branches[source.column].includes(key)) branches[source.column].push(key);
  }
  branches.forEach(keys => keys.sort());
  const top = Math.min(...boxes.map(box => box.y - box.height / 2));
  let outer = 0;
  return edges.map(edge => {
    const source = positions.get(edge.from)!, target = positions.get(edge.to)!;
    if (source.column >= target.column) throw new Error(`Hierarchy edge must run from base to derived type: ${edge.id}`);
    const key = `${edge.from}:${edge.kind}`, lane = branches[source.column].indexOf(key);
    const gapLeft = columns[source.column].right, gapRight = columns[source.column + 1].left;
    if (gapRight <= gapLeft) throw new Error('Hierarchy columns overlap.');
    const trunk = gapLeft + (gapRight - gapLeft) * (lane + 1) / (branches[source.column].length + 1);
    const start = { x: source.box.x + source.box.width / 2, y: source.box.y };
    const end = { x: target.box.x - target.box.width / 2 - 4, y: target.box.y };
    const points = [start, { x: trunk, y: start.y }];
    if (target.column > source.column + 1) {
      // A long edge crosses several columns. Keep its horizontal segment above
      // every node, then descend through the target column's empty left gutter.
      const above = top - 24 - outer++ * 16;
      const targetTrunk = (columns[target.column - 1].right + columns[target.column].left) / 2;
      points.push({ x: trunk, y: above }, { x: targetTrunk, y: above }, { x: targetTrunk, y: end.y });
    } else points.push({ x: trunk, y: end.y });
    points.push(end);
    return { ...edge, points, branch: lane % 6,
      d: points.map((point, i) => `${i ? 'L' : 'M'}${point.x},${point.y}`).join('') };
  });
}
