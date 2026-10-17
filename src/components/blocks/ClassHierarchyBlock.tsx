import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { ClassHierarchyBlock as Block } from '../../types';
import { loadHierarchy } from '../../data/references';
import { hierarchyDiagram, hierarchyView, resolveHierarchyRoot } from '../../lib/hierarchy';
import type { HierarchyIndex } from '../../lib/hierarchy';
import DiagramBlock from './DiagramBlock';
import ExampleBlock from './ExampleBlock';

export default function ClassHierarchyBlock({ block }: { block: Block }) {
  const [params] = useSearchParams();
  const requested = (block.browse && params.get('type')) || block.root;
  const [index, setIndex] = useState<HierarchyIndex>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [focus, setFocus] = useState(requested);
  const [depth, setDepth] = useState<number | 'all'>(block.depth || 2);
  const [interfaces, setInterfaces] = useState(false);
  const [query, setQuery] = useState('');
  useEffect(() => { setFocus(requested); }, [requested]);
  useEffect(() => {
    let alive = true;
    setError('');
    loadHierarchy().then(data => { if (alive) setIndex(data); }).catch(reason => {
      if (alive) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => { alive = false; };
  }, [attempt]);
  const selected = index && resolveHierarchyRoot(index, focus);
  const contracts = interfaces || (selected !== undefined && selected.kind !== 'class');
  const view = useMemo(() => index && selected ? hierarchyView(index, selected.id, depth, contracts) : undefined, [index, selected, depth, contracts]);
  const diagram = useMemo(() => view && hierarchyDiagram(view), [view]);
  const choices = useMemo(() => {
    if (!index) return [];
    return block.browse ? index.nodes.filter(node => !node.external) : hierarchyView(index, block.root, 'all', true).nodes.filter(node => !node.external);
  }, [index, block.root, block.browse]);
  const matches = choices.filter(node => `${node.name} ${node.source}`.toLowerCase().includes(query.trim().toLowerCase()));
  const filtered = choices.filter(node => node.id === selected?.id || matches.includes(node));
  if (error) return <div role="alert"><p>{error}</p><button className="api-source" onClick={() => setAttempt(value => value + 1)}>Try again</button></div>;
  if (!index) return <p role="status">Loading class hierarchy…</p>;
  return <div className="class-hierarchy">
    <div className="hierarchy-options">
      {block.browse && <label>Find a type <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name or source file…" /></label>}
      <label>Focus on a type <select aria-label="Focus on a type" value={selected?.id || ''} onChange={event => setFocus(event.target.value)}>
        {!selected && <option value="" disabled>Choose a documented type</option>}
        {filtered.map(node => <option key={node.id} value={node.id}>{node.name}{node.kind !== 'class' ? ` · ${node.kind}` : ''}{choices.some(other => other.id !== node.id && other.name === node.name) ? ` · ${node.source}` : ''}</option>)}
      </select></label>
      <label>Descendant levels <select aria-label="Descendant levels" value={depth} onChange={event => setDepth(event.target.value === 'all' ? 'all' : Number(event.target.value))}>
        <option value={1}>1 level</option><option value={2}>2 levels</option><option value={3}>3 levels</option><option value="all">All levels</option>
      </select></label>
      <label className="hierarchy-contracts"><input type="checkbox" checked={contracts} disabled={selected !== undefined && selected.kind !== 'class'} onChange={event => setInterfaces(event.target.checked)} />Show implementations</label>
    </div>
    {query.trim() && <p className="hierarchy-matches" role="status">{matches.length ? `${matches.length} type matches. Choose a match from “Focus on a type”.` : 'No matching types. Try another name or source file.'}</p>}
    {!selected && <p role="alert">The requested type is unknown or ambiguous. Choose a type above.</p>}
    {view && diagram && <>
      <div className="hierarchy-summary">
        <span>{view.focus.name}{view.focus.abstract ? ' · abstract class' : ` · ${view.focus.kind}`} · {view.descendants} descendant{view.descendants === 1 ? '' : 's'} shown</span>
        {view.focus.url && <Link to={view.focus.url}>Open API reference</Link>}
      </div>
      {block.browse && view.focus.example && <details className="doc-details" key={view.focus.id}>
        <summary>{view.focus.abstract ? 'See a concrete implementation' : `See ${view.focus.name} in a scene`}</summary>
        <ExampleBlock block={{type:'example',example:view.focus.example}} />
      </details>}
      <DiagramBlock block={{ type: 'code', language: 'mermaid', code: diagram.code }} nodeLinks={diagram.links} label="Class hierarchy" fitMode="width" />
      <p className="hierarchy-legend">Arrows run from base to derived type. Solid: extends · Dashed: implements · Italic: abstract class. Click a type to open its API.</p>
      {!view.descendants && <p className="hierarchy-empty">This type has no documented descendants. Its ancestors are shown when available.</p>}
      <details className="doc-details hierarchy-list"><summary>Types in this view ({view.nodes.length})</summary><ul>
        {view.nodes.map(node => <li key={node.id}>{node.url ? <Link to={node.url}>{node.name}</Link> : node.name}{node.abstract ? ' · abstract' : ''}{node.kind !== 'class' ? ` · ${node.kind}` : ''}{node.external ? ' · outside the API index' : ''}<span>{node.source}</span></li>)}
      </ul></details>
    </>}
  </div>;
}
