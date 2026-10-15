import { useEffect, useId, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { ApiReferenceBlock as Block } from '../../types';
import { loadApi } from '../../data/references';
import type { ApiEntry } from '../../data/references';
import InlineText from './InlineText';
import SymbolText from './SymbolText';
import ExampleBlock from './ExampleBlock';
import { groupApiEntries, matchesApiEntry } from '../../lib/apiBrowsing';

export default function ApiReferenceBlock({block}:{block:Block}) {
  const [entries,setEntries]=useState<ApiEntry[]>([]),[error,setError]=useState(''),[query,setQuery]=useState('');
  const [includeInternal,setIncludeInternal]=useState(false);
  const scopeId=useId();
  const location=useLocation();
  let selectedId=location.hash.slice(1);
  try { selectedId=decodeURIComponent(selectedId); } catch { /* Keep malformed hashes literal. */ }
  const families=useMemo(()=>groupApiEntries(entries),[entries]);
  useEffect(()=>{setQuery('');},[location.hash]);
  useEffect(()=>{let alive=true;setEntries([]);setError('');setIncludeInternal(false);loadApi(block.source).then(e=>{if(alive)setEntries(e);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[block.source]);
  useEffect(()=>{
    if(!entries.length)return;
    const selected=entries.find(entry=>entry.id===selectedId);
    if(!selected)return;
    if(selected.visibility!=='public')setIncludeInternal(true);
    const frame=requestAnimationFrame(()=>document.getElementById(selectedId)?.scrollIntoView({block:'start'}));
    return()=>cancelAnimationFrame(frame);
  },[entries,selectedId,location.key]);
  if(error)return <p role="alert">{error}</p>;
  if(!entries.length)return <p role="status">Loading API members…</p>;
  const visibleCount=entries.filter(entry=>matchesApiEntry(entry,query,includeInternal)).length;
  const internalCount=entries.filter(entry=>entry.visibility!=='public').length;
  return <div className="api-reference">
    <div className="api-reference-toolbar">
      <label className="api-member-search">Find a member <input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Name, parameter or behavior…" /></label>
      <div className="api-reference-scope">
        <label htmlFor={scopeId}><input id={scopeId} type="checkbox" checked={includeInternal} onChange={event=>setIncludeInternal(event.target.checked)} />Include internal and protected members</label>
        <span role="status">{visibleCount} {includeInternal?'members':'public members'}{query.trim()?' match':''}{!includeInternal&&internalCount>0?` · ${internalCount} internal or protected hidden`:''}</span>
      </div>
    </div>
    {families.map(family=><section className="api-family" key={family.owner} hidden={!family.categories.some(category=>category.entries.some(entry=>matchesApiEntry(entry,query,includeInternal)))}>
      <h3 className="api-family-title">{family.owner||'Module exports'}</h3>
      {family.categories.map(category=><div className="api-category" key={category.title} hidden={!category.entries.some(entry=>matchesApiEntry(entry,query,includeInternal))}>
        {category.title!=='Members'&&<h4>{category.title}</h4>}
        {category.entries.map(entry=><ApiMember key={entry.id} entry={entry} selected={selectedId===entry.id} hidden={!matchesApiEntry(entry,query,includeInternal)} includeInternal={includeInternal} />)}
      </div>)}
    </section>)}
    {!visibleCount&&<p role="status">No {includeInternal?'members':'public members'} match this search.{!includeInternal&&internalCount>0?' Include internal and protected members to search implementation details.':''}</p>}
  </div>;
}


function ApiMember({entry,selected,hidden,includeInternal}:{entry:ApiEntry;selected:boolean;hidden:boolean;includeInternal:boolean}) {
  const [open,setOpen]=useState(selected);
  const owner=entry.qualified.includes('.')?entry.qualified.slice(0,entry.qualified.lastIndexOf('.')):entry.name;
  useEffect(()=>{if(selected)setOpen(true);},[selected]);
  return <details className="api-member" id={entry.id} hidden={hidden} open={open} onToggle={event=>setOpen(event.currentTarget.open)}>
        <summary><code>{entry.qualified}</code><span className="api-kind">{entry.kind}{entry.visibility!=='public'?` · ${entry.visibility}`:''}</span><Link to={`#${entry.id}`} onClick={e=>e.stopPropagation()} aria-label={`Link to ${entry.qualified}`}>#</Link></summary>
        {open&&<div className="api-member-body">
          {['class','interface'].includes(entry.kind) && <p><Link to={`/class-hierarchy?type=${encodeURIComponent(entry.id)}#explorer`}>View {entry.name} in the class hierarchy</Link></p>}
          {entry.description&&<p>{entry.descriptionOrigin==='source'&&<strong>From the implementation: </strong>}<InlineText text={entry.description} /></p>}
          {entry.signatures.map((sig,i)=><pre key={i} className="api-signature"><code><SymbolText text={sig} code /></code></pre>)}
          {entry.bases?.length? <p>Extends or implements <SymbolText text={entry.bases.join(', ')} code />. Inherited members are documented on the base type.</p>:null}
          {entry.inherited?.some(member=>includeInternal||member.visibility==='public')?<details className="api-inherited"><summary>Inherited members ({entry.inherited.filter(member=>includeInternal||member.visibility==='public').length})</summary><ul>{entry.inherited.filter(member=>includeInternal||member.visibility==='public').map(member=><li key={member.name}><Link to={member.url}><code>{member.declaredBy}</code></Link>{member.visibility!=='public'?` · ${member.visibility}`:''}</li>)}</ul></details>:null}
          {entry.entryPoints.length>0&&<p className="api-import">Import from <code>{entry.entryPoints.join(' or ')}</code>.</p>}
          {(entry.overloads||[{signature:entry.signatures[0],parameters:entry.parameters}]).map((overload,index)=>overload.parameters.length>0?<div key={index}>
            {entry.overloads&&<h4>Arguments for signature {index+1}</h4>}
            <div className="doc-table-scroll" role="region" aria-label={`Arguments for ${entry.qualified}`} tabIndex={0}>
            <table className="api-table api-arguments"><thead><tr><th>Parameter</th><th>Type / default</th><th>Usage</th></tr></thead><tbody>{overload.parameters.map(p=><tr key={p.name}><td><code>{p.rest?'…':''}{p.name}{p.optional?'?':''}</code></td><td><SymbolText text={p.type} code />{p.default!==undefined&&<><br/>Default: <code>{p.default}</code></>}</td><td>{p.descriptionOrigin==='source'&&<strong>From source: </strong>}<InlineText text={p.description||'—'} /></td></tr>)}</tbody></table>
            </div>
          </div>:null)}
          {entry.returns&&<p>Returns <code><SymbolText text={entry.returns} code /></code>. {entry.returnsDescription?<InlineText text={entry.returnsDescription}/>:entry.returns==='this'?'The same instance, for chaining.':entry.returns==='void'?'No return value.':null}</p>}
          {entry.default!==undefined&&<p>Initializer: <code><SymbolText text={entry.default} code /></code>.</p>}
          {entry.notes.map((note,i)=><p key={i}><InlineText text={note}/></p>)}
          {entry.contract&&!entry.contract.declarationOnly&&<details className="api-contract">
            <summary>Behavior in the current implementation</summary>
            <p>Behavior recorded for the documented library version. Follow linked calls for related API contracts.</p>
            {entry.contract.generator&&<p>This generator body runs as its iterator advances. Yielded values are separate from its final completion value.</p>}
            {entry.contract.guards.length>0&&<><h4>Early exits</h4><ul>{entry.contract.guards.map((guard,i)=><li key={i}>When <code><SymbolText text={guard.condition} code owner={owner}/></code>: <code><SymbolText text={guard.action} code owner={owner}/></code>.</li>)}</ul></>}
            {entry.contract.writes.length>0&&<><h4>State written directly</h4><div className="doc-table-scroll" role="region" aria-label={`State changes in ${entry.qualified}`} tabIndex={0}><table className="api-table"><thead><tr><th>Target</th><th>Change</th></tr></thead><tbody>{entry.contract.writes.map((write,i)=><tr key={i}><td><code><SymbolText text={write.target} code owner={owner}/></code></td><td><code><SymbolText text={`${write.operation} ${write.value}`} code owner={owner}/></code></td></tr>)}</tbody></table></div></>}
            {entry.contract.returns.length>0&&<><h4>Return expressions</h4><ul>{entry.contract.returns.map((value,i)=><li key={i}><code><SymbolText text={value.expression} code owner={owner}/></code></li>)}</ul></>}
            {entry.contract.yields.length>0&&<><h4>Yield expressions</h4><ul>{entry.contract.yields.map((value,i)=><li key={i}><code><SymbolText text={`${value.delegated?'yield*':'yield'} ${value.expression}`} code owner={owner}/></code></li>)}</ul></>}
            {entry.contract.throws.length>0&&<><h4>Explicit throw statements</h4><ul>{entry.contract.throws.map((value,i)=><li key={i}><code><SymbolText text={value.expression} code owner={owner}/></code></li>)}</ul></>}
            {entry.contract.calls.length>0&&<><h4>Calls made by this implementation</h4><p><SymbolText text={entry.contract.calls.map(call=>`${call.construct?'new ':''}${call.target}`).join(', ')} code owner={owner}/></p></>}
          </details>}
          {entry.guides?.length?<p>Learn the workflow: {entry.guides.map((guide,index)=><span key={guide.url}>{index>0?' · ':''}<Link to={guide.url}>{guide.title}</Link></span>)}</p>:null}
          {entry.tags.filter(tag=>!['return','returns'].includes(tag.name)).map((tag,i)=><p key={i}><strong>{tag.name}: </strong><InlineText text={tag.text}/></p>)}
          {entry.example&&<ExampleBlock block={{type:'example',example:entry.example}} />}

        </div>}
  </details>;

}
