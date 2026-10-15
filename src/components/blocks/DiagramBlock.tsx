import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CodeBlock as CodeBlockType } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { renderMermaid } from '../../lib/mermaid';
import CodeBlock from './CodeBlock';
import { useDoc } from '../../context/DocContext';
import { resolveSymbol, useSymbolIndex } from '../../data/references';
import type { SymbolTarget } from '../../data/references';
import { shouldLinkSymbol, splitSymbolText } from '../../lib/symbols';
import { clampDiagramZoom, diagramAnchor, diagramScroll } from '../../lib/diagram-view';
import type { DiagramPoint } from '../../lib/diagram-view';

const DiagramBlock: React.FC<{ block: CodeBlockType; nodeLinks?: Record<string, SymbolTarget>; label?: string; fitMode?: 'contain' | 'width' }> = ({ block, nodeLinks, label: customLabel, fitMode = 'contain' }) => {
  const { theme } = useTheme();
  const { currentPage } = useDoc();
  const navigate = useNavigate();
  const symbolRevision = useSymbolIndex();
  const [svg, setSvg] = useState('');
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [viewport, setViewport] = useState({ width: 800, height: 400 });
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [dragging, setDragging] = useState(false);
  const viewerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);
  const inlineHeight = useRef(0);
  const zoomRef = useRef(1);
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);
  const pointers = useRef(new Map<number, DiagramPoint>());
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const pinch = useRef<{ distance: number; zoom: number; anchor: DiagramPoint } | null>(null);
  const suppressClick = useRef(false);

  const linkedSvg = useMemo(() => {
    if (!svg || (symbolRevision === 0 && !nodeLinks)) return svg;
    const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const createLink = (target: SymbolTarget, namespace: string | null) => {
      const link = document.createElementNS(namespace || 'http://www.w3.org/2000/svg', 'a');
      link.setAttribute('href', `${import.meta.env.BASE_URL}${target.url.slice(1)}`);
      link.setAttribute('data-api-href', target.url);
      link.setAttribute('aria-label', `Explore ${target.name}`);
      link.setAttribute('class', 'diagram-api-link');
      link.setAttribute('tabindex', '0');
      return link;
    };
    if (nodeLinks) {
      for (const node of document.querySelectorAll('.node')) {
        const nodeId = node.getAttribute('id')?.match(/(?:^|-)flowchart-(n\d+)-\d+$/)?.[1];
        const target = nodeId && nodeLinks[nodeId];
        if (!target) continue;
        const link = createLink(target, node.namespaceURI);
        link.setAttribute('data-hierarchy-id', nodeId);
        node.replaceWith(link);
        link.append(node);
      }
      return new XMLSerializer().serializeToString(document.documentElement);
    }
    for (const label of document.querySelectorAll('.nodeLabel, .node .label text')) {
      if (label.closest('a')) continue;
      const target = resolveSymbol(label.textContent?.trim() || '', currentPage.id);
      if (target) {
        const link = createLink(target, label.namespaceURI);
        label.replaceWith(link);
        link.append(label);
        continue;
      }
      // Keep Mermaid's positioned text and line breaks; only wrap identifiers.
      // This also links a class name when its node includes an explanation.
      const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
      const textNodes: Text[] = [];
      while (walker.nextNode()) textNodes.push(walker.currentNode as Text);
      for (const text of textNodes) {
        if (text.parentElement?.closest('a')) continue;
        const fragment = document.createDocumentFragment();
        let linked = false;
        for (const part of splitSymbolText(text.data)) {
          const partTarget = shouldLinkSymbol(part) ? resolveSymbol(part, currentPage.id) : undefined;
          if (partTarget) {
            const link = createLink(partTarget, text.parentElement?.namespaceURI || null);
            link.textContent = part;
            fragment.append(link);
            linked = true;
          } else fragment.append(document.createTextNode(part));
        }
        if (linked) text.replaceWith(fragment);
      }
    }
    return new XMLSerializer().serializeToString(document.documentElement);
  }, [svg, currentPage.id, symbolRevision, nodeLinks]);

  useEffect(() => {
    let cancelled = false;
    setSvg('');
    setError('');
    zoomRef.current = 1;
    pendingScroll.current = null;
    setZoom(1);
    renderMermaid(block.code, theme, !!nodeLinks).then((result) => {
      if (!cancelled) {
        setSize({ width: result.width, height: result.height });
        setSvg(result.svg);
      }
    }).catch((reason: unknown) => {
      if (cancelled) return;
      setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => { cancelled = true; };
  }, [block.code, theme, attempt, nodeLinks]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (expanded && !dialog.open) dialog.showModal();
    if (!expanded && dialog.open) dialog.close();
  }, [expanded]);

  useEffect(() => {
    const root = viewerRef.current;
    if (!root) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setViewport({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(root);
    return () => observer.disconnect();
  }, [expanded, error]);

  const widthScale = Math.min(viewport.width / size.width, 1);
  const naturalHeight = size.height * (fitMode === 'width' ? Math.max(0.75, widthScale) : widthScale);
  const fittedScale = Math.min(widthScale, fitMode === 'contain' ? viewport.height / size.height : 1);
  const baseScale = Math.max(0.75, fittedScale);
  const scale = baseScale * zoom;
  const width = size.width * scale;
  const height = size.height * scale;

  const positionInitially = useCallback(() => {
    const root = viewerRef.current, focus = nodeLinks && root?.querySelector('.node.focus');
    if (!root) return;
    if (focus) {
      const item = focus.getBoundingClientRect(), bounds = root.getBoundingClientRect();
      root.scrollTo({ left: root.scrollLeft + item.left - bounds.left + item.width / 2 - root.clientWidth / 2,
        top: root.scrollTop + item.top - bounds.top + item.height / 2 - root.clientHeight / 2, behavior: 'instant' });
    } else root.scrollTo({ left: 0, top: 0, behavior: 'instant' });
  }, [nodeLinks]);

  useEffect(() => {
    const frame = requestAnimationFrame(positionInitially);
    return () => cancelAnimationFrame(frame);
  }, [positionInitially, linkedSvg, expanded]);

  useEffect(() => {
    // Scrollbars can change the content dimensions during zoom. Keep the
    // pointer's anchor instead of recentering the selected class in that case.
    if (zoomRef.current !== 1) return;
    const frame = requestAnimationFrame(positionInitially);
    return () => cancelAnimationFrame(frame);
  }, [positionInitially, viewport.width, viewport.height]);

  useLayoutEffect(() => {
    if (!pendingScroll.current) return;
    viewerRef.current?.scrollTo({ ...pendingScroll.current, behavior: 'instant' });
    pendingScroll.current = null;
  }, [zoom]);

  const pointInViewport = useCallback((clientX: number, clientY: number) => {
    const root = viewerRef.current!;
    const bounds = root.getBoundingClientRect(), style = getComputedStyle(root);
    return { x: clientX - bounds.left - root.clientLeft - parseFloat(style.paddingLeft),
      y: clientY - bounds.top - root.clientTop - parseFloat(style.paddingTop) };
  }, []);

  const anchorAt = useCallback((point: DiagramPoint) => diagramAnchor({ viewport, size, scale: baseScale * zoomRef.current }, point,
    pendingScroll.current || { left: viewerRef.current?.scrollLeft || 0, top: viewerRef.current?.scrollTop || 0 }), [viewport, size, baseScale]);

  const changeZoom = useCallback((next: number, point = { x: viewport.width / 2, y: viewport.height / 2 }, anchor = anchorAt(point)) => {
    const root = viewerRef.current;
    next = clampDiagramZoom(next);
    const scroll = diagramScroll({ viewport, size, scale: baseScale * next }, point, anchor);
    if (next === zoomRef.current) {
      root?.scrollTo({ ...scroll, behavior: 'instant' });
      return;
    }
    pendingScroll.current = scroll;
    zoomRef.current = next;
    setZoom(next);
  }, [viewport, size, baseScale, anchorAt]);

  useEffect(() => {
    const root = viewerRef.current;
    if (!root || !svg) return;
    const wheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? root.clientHeight : 1);
      changeZoom(zoomRef.current * Math.exp(-delta * 0.002), pointInViewport(event.clientX, event.clientY));
    };
    // A non-passive listener prevents the browser from zooming the entire page.
    root.addEventListener('wheel', wheel, { passive: false });
    return () => root.removeEventListener('wheel', wheel);
  }, [svg, expanded, changeZoom, pointInViewport]);

  const clearGesture = () => {
    pointers.current.clear();
    drag.current = null;
    pinch.current = null;
    setDragging(false);
  };

  const closeExpanded = () => {
    clearGesture();
    setExpanded(false);
    requestAnimationFrame(() => expandButtonRef.current?.focus());
  };

  const fit = () => {
    pendingScroll.current = null;
    zoomRef.current = 1;
    setZoom(1);
    requestAnimationFrame(positionInitially);
  };

  const highlightConnections = (target: Element | null) => {
    if (!nodeLinks) return;
    const type = target?.closest('[data-hierarchy-id]')?.getAttribute('data-hierarchy-id') ||
      target?.closest('[data-edge-from]')?.getAttribute('data-edge-from');
    viewerRef.current?.querySelectorAll('[data-edge-from]').forEach(path => {
      const connected = path.getAttribute('data-edge-from') === type || path.getAttribute('data-edge-to') === type;
      path.classList.toggle('hierarchy-active', !!type && connected);
      path.classList.toggle('hierarchy-muted', !!type && !connected);
    });
  };

  const kind = block.code.trimStart().split(/[\s\n]/)[0];
  const label = customLabel || (kind === 'flowchart' || kind === 'graph' ? 'Flowchart' :
    kind === 'sequenceDiagram' ? 'Sequence' : kind.startsWith('stateDiagram') ? 'State diagram' :
      kind === 'timeline' ? 'Timeline' : 'Diagram');
  const icon = (name: string) => <span className="material-symbols-outlined" aria-hidden="true">{name}</span>;
  const releasePointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointers.current.delete(event.pointerId);
    pinch.current = null;
    if (pointers.current.size === 1) {
      const point = [...pointers.current.values()][0];
      drag.current = { ...point, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
    } else drag.current = null;
    setDragging(false);
  };
  const card = (
    <div className="diagram-card" ref={cardRef}>
      <div className="diagram-corner-controls" role="group" aria-label="Diagram controls">
        <button aria-label="Reset diagram view" title="Reset view" disabled={!svg} onClick={fit}>{icon('center_focus_strong')}</button>
        <button ref={expandButtonRef} aria-label={expanded ? 'Close expanded diagram' : 'Expand diagram'}
          title={expanded ? 'Close expanded view' : 'Expand diagram'} onClick={() => {
            if (expanded) closeExpanded();
            else {
              clearGesture();
              inlineHeight.current = cardRef.current?.getBoundingClientRect().height ?? 0;
              setExpanded(true);
            }
          }}>{icon(expanded ? 'close' : 'open_in_full')}</button>
      </div>

      {error && <div className="diagram-error" role="alert">
        <p>This diagram could not be rendered.</p>
        <details><summary>Rendering error</summary><pre>{error}</pre></details>
        <button onClick={() => setAttempt(value => value + 1)}>Try again</button>
        <details className="diagram-source"><summary>Diagram source</summary><CodeBlock block={block} /></details>
      </div>}

      {!error && <div className={`diagram-viewport ${dragging ? 'dragging' : ''}`} ref={viewerRef}
        style={{ '--diagram-fit-height': `${naturalHeight + 48}px` } as React.CSSProperties}
        tabIndex={0} role="region" aria-label={`${label} canvas`}
        aria-description="Control or Command plus mouse wheel to zoom. Drag to pan, or pinch on touchscreens. Plus and minus zoom; 0 resets the view."
        aria-keyshortcuts="+ - 0 ArrowUp ArrowDown ArrowLeft ArrowRight" data-zoom={zoom}
        onKeyDown={event => {
          if (event.target !== event.currentTarget || !svg) return;
          if (['+', '=', '-', '0'].includes(event.key)) {
            event.preventDefault();
            if (event.key === '0') fit();
            else changeZoom(zoomRef.current * (event.key === '-' ? 1 / 1.25 : 1.25));
          } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
            event.preventDefault();
            event.currentTarget.scrollBy({ left: event.key === 'ArrowRight' ? 80 : event.key === 'ArrowLeft' ? -80 : 0,
              top: event.key === 'ArrowDown' ? 80 : event.key === 'ArrowUp' ? -80 : 0, behavior: 'instant' });
          }
        }}
        onPointerDown={event => {
          if (!svg || event.button !== 0) return;
          suppressClick.current = false;
          const point = { x: event.clientX, y: event.clientY };
          pointers.current.set(event.pointerId, point);
          if (pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            pinch.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), zoom: zoomRef.current,
              anchor: anchorAt(pointInViewport((a.x + b.x) / 2, (a.y + b.y) / 2)) };
            suppressClick.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
          } else if (pointers.current.size === 1) {
            drag.current = { ...point, left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop };
            if (!(event.target as Element).closest('a')) event.currentTarget.focus({ preventScroll: true });
          }
        }}
        onPointerMove={event => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pinch.current && pointers.current.size === 2) {
            const [a, b] = [...pointers.current.values()];
            changeZoom(pinch.current.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.distance,
              pointInViewport((a.x + b.x) / 2, (a.y + b.y) / 2), pinch.current.anchor);
            event.preventDefault();
          } else if (drag.current) {
            const dx = event.clientX - drag.current.x, dy = event.clientY - drag.current.y;
            if (!suppressClick.current && Math.hypot(dx, dy) < 5) return;
            suppressClick.current = true;
            if (!event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.setPointerCapture(event.pointerId);
            setDragging(true);
            event.currentTarget.scrollTo({ left: drag.current.left - dx, top: drag.current.top - dy, behavior: 'instant' });
            event.preventDefault();
          }
        }}
        onPointerUp={releasePointer} onPointerCancel={releasePointer}
        onLostPointerCapture={event => { if (pointers.current.has(event.pointerId)) releasePointer(event); }}
        onClickCapture={event => {
          if (suppressClick.current && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); }
        }}>
        {svg ? <div className="diagram-artwork" style={{
          width: Math.max(viewport.width, width), height: Math.max(viewport.height, height),
          '--diagram-width': `${width}px`,
        } as React.CSSProperties}
          onPointerOver={event => highlightConnections(event.target as Element)}
          onPointerLeave={() => highlightConnections(document.activeElement?.closest('[data-hierarchy-id]') || null)}
          onFocusCapture={event => highlightConnections(event.target as Element)}
          onBlurCapture={event => highlightConnections(event.relatedTarget instanceof Element ? event.relatedTarget : null)}
          onClick={event => {
            const link = (event.target as Element).closest('a[data-api-href]');
            if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            navigate(link.getAttribute('data-api-href')!);
          }}
          dangerouslySetInnerHTML={{ __html: linkedSvg }} /> :
          <p className="diagram-loading" role="status">Rendering diagram…</p>}
      </div>}
    </div>
  );

  return <figure className={`doc-diagram${nodeLinks ? ' hierarchy-diagram' : ''}`}>
    {expanded ? <div style={{ height: inlineHeight.current }} /> : card}
    <dialog className="diagram-dialog" ref={dialogRef} aria-label="Expanded diagram"
      onCancel={closeExpanded} onClose={closeExpanded}>
      {expanded && card}
    </dialog>
  </figure>;
};

export default DiagramBlock;
