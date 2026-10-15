export interface DiagramGeometry {
  viewport: { width: number; height: number };
  size: { width: number; height: number };
  scale: number;
}
export interface DiagramPoint { x: number; y: number }

const offset = (available: number, drawn: number) => Math.max(0, (available - drawn) / 2);

/** Convert a pointer position in the viewport to a position in the original SVG. */
export function diagramAnchor(geometry: DiagramGeometry, point: DiagramPoint, scroll: { left: number; top: number }) {
  const { viewport, size, scale } = geometry;
  return {
    x: (scroll.left + point.x - offset(viewport.width, size.width * scale)) / scale,
    y: (scroll.top + point.y - offset(viewport.height, size.height * scale)) / scale,
  };
}

/** Keep the same SVG point under the pointer after zooming or pinching. */
export function diagramScroll(geometry: DiagramGeometry, point: DiagramPoint, anchor: DiagramPoint) {
  const { viewport, size, scale } = geometry;
  return {
    left: Math.max(0, anchor.x * scale + offset(viewport.width, size.width * scale) - point.x),
    top: Math.max(0, anchor.y * scale + offset(viewport.height, size.height * scale) - point.y),
  };
}

export function clampDiagramZoom(zoom: number) {
  return Math.min(8, Math.max(0.1, zoom));
}
