import type { Theme } from '../types';
import { routeHierarchyEdges } from './hierarchy-routing';

export interface RenderedDiagram {
  svg: string;
  width: number;
  height: number;
}

// Mermaid shares configuration and a measuring DOM. Keep initialization and rendering
// together so diagrams on the same page cannot overwrite one another's theme.
let renderQueue = Promise.resolve();
let nextDiagramId = 0;

export function renderMermaid(source: string, theme: Theme, hierarchy = false): Promise<RenderedDiagram> {
  const result = renderQueue.then(async () => {
    const { default: mermaid } = await import('mermaid');
    const dark = theme === 'dark';
    const background = dark ? '#111416' : '#FCFCFF';
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      suppressErrorRendering: true,
      htmlLabels: false,
      layout: 'dagre',
      theme: 'base',
      fontFamily: 'Arial, sans-serif',
      secure: ['securityLevel', 'startOnLoad', 'suppressErrorRendering', 'htmlLabels', 'maxTextSize', 'maxEdges'],
      themeVariables: {
        darkMode: dark,
        background,
        primaryColor: dark ? '#004B70' : '#CAE6FF',
        primaryTextColor: dark ? '#E2E2E5' : '#1A1C1E',
        primaryBorderColor: dark ? '#8DCDFF' : '#006493',
        secondaryColor: dark ? '#1D2024' : '#F0F4F8',
        tertiaryColor: dark ? '#2B2E32' : '#E1E6EA',
        lineColor: dark ? '#C1C7CE' : '#41474D',
        textColor: dark ? '#E2E2E5' : '#1A1C1E',
        clusterBkg: dark ? '#1D2024' : '#F0F4F8',
        clusterBorder: dark ? '#41474D' : '#C1C7CE',
        edgeLabelBackground: background,
        fontSize: '16px',
      },
      flowchart: { htmlLabels: false, useMaxWidth: false, wrappingWidth: 320 },
    });

    // Measure off-screen without exposing temporary SVGs or Mermaid error graphics.
    const stage = document.createElement('div');
    stage.style.cssText = 'position:fixed;left:-100000px;top:0;visibility:hidden;pointer-events:none';
    document.body.append(stage);
    try {
      const { svg } = await mermaid.render(`retiam-diagram-${++nextDiagramId}`, source, stage);
      stage.innerHTML = svg;
      const element = stage.querySelector('svg')!;
      element.style.backgroundColor = background;
      let bounds = element.getAttribute('viewBox')?.split(/[\s,]+/).map(Number);
      if (hierarchy) {
        const rootMatrix = element.getCTM()!.inverse();
        const boxes = [...element.querySelectorAll<SVGGElement>('.node')].map(node => {
          const id = node.id.match(/(?:^|-)flowchart-(n\d+)-\d+$/)?.[1];
          const rect = node.querySelector('rect');
          if (!id || !rect) throw new Error('A hierarchy type is missing its layout box.');
          node.setAttribute('data-hierarchy-id', id);
          const box = rect.getBBox(), matrix = rootMatrix.multiply(rect.getCTM()!);
          const point = new DOMPoint(box.x, box.y).matrixTransform(matrix);
          return { id, x: point.x + box.width * matrix.a / 2, y: point.y + box.height * matrix.d / 2,
            width: box.width * matrix.a, height: box.height * matrix.d };
        });
        const paths = [...element.querySelectorAll<SVGPathElement>('.edgePaths path')];
        const edges = paths.map(path => {
          const ids = path.id.match(/-L_(n\d+)_(n\d+)_\d+$/);
          if (!ids) throw new Error('A hierarchy connector is missing its declaration IDs.');
          return { id: path.id, from: ids[1], to: ids[2], kind: path.classList.contains('edge-pattern-dashed') || path.classList.contains('edge-pattern-dotted') ? 'implements' as const : 'extends' as const };
        });
        const routes = routeHierarchyEdges(boxes, edges);
        let top = bounds?.[1] || 0;
        for (const route of routes) {
          const path = paths.find(path => path.id === route.id)!;
          path.setAttribute('d', route.d);
          path.setAttribute('data-edge-from', route.from);
          path.setAttribute('data-edge-to', route.to);
          path.style.stroke = `var(--hierarchy-edge-${route.branch})`;
          path.style.strokeWidth = '1.5px';
          const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
          const name = (id: string) => element.querySelector(`[data-hierarchy-id="${id}"]`)!.textContent!.trim();
          title.textContent = `${name(route.from)} → ${name(route.to)} (${route.kind})`;
          path.append(title);
          top = Math.min(top, ...route.points.map(point => point.y - 16));
        }
        if (bounds && top < bounds[1]) {
          bounds = [bounds[0], top, bounds[2], bounds[3] + bounds[1] - top];
          element.setAttribute('viewBox', bounds.join(' '));
        }
      }
      return {
        svg: new XMLSerializer().serializeToString(element),
        width: bounds?.[2] && bounds[2] > 0 ? bounds[2] : 800,
        height: bounds?.[3] && bounds[3] > 0 ? bounds[3] : 600,
      };
    } finally {
      stage.remove();
    }
  });
  // A malformed diagram must not stop later diagrams from rendering.
  renderQueue = result.then(() => {}, () => {});
  return result;
}
