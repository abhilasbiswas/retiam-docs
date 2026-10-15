import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useDoc } from '../../context/DocContext';
import { loadApi, resolveSymbol, useSymbolIndex } from '../../data/references';
import type { SymbolTarget } from '../../data/references';
import { shouldLinkSymbol, splitSymbolText } from '../../lib/symbols';

function SymbolLink({target,children}:{target:SymbolTarget;children:string}) {
  const id=useId(),anchor=useRef<HTMLAnchorElement>(null);
  const [preview,setPreview]=useState<{signature:string;description:string}>();
  const [position,setPosition]=useState<{left:number;top:number}>();
  const visible=!!position;
  useEffect(()=>{
    if(!visible)return;
    const close=()=>setPosition(undefined),escape=(event:KeyboardEvent)=>{if(event.key==='Escape')close();};
    window.addEventListener('scroll',close,true);window.addEventListener('resize',close);window.addEventListener('keydown',escape);
    return()=>{window.removeEventListener('scroll',close,true);window.removeEventListener('resize',close);window.removeEventListener('keydown',escape);};
  },[visible]);
  const show=()=>{
    const bounds=anchor.current?.getBoundingClientRect();
    if(bounds)setPosition({left:Math.max(12,Math.min(bounds.left,window.innerWidth-332)),top:Math.min(bounds.bottom+8,window.innerHeight-150)});
    if(!preview&&target.source)void loadApi(target.source).then(entries=>{
      const member=entries.find(entry=>target.url.endsWith(`#${entry.id}`));
      if(member)setPreview({signature:member.signatures[0],description:member.description.replace(/[`*]/g,'').slice(0,220)});
    }).catch(()=>{});
  };
  return <><Link ref={anchor} className="symbol-link" to={target.url} onMouseEnter={show} onMouseLeave={()=>setPosition(undefined)} onFocus={show} onBlur={()=>setPosition(undefined)} onClick={()=>setPosition(undefined)} onKeyDown={event=>{if(event.key==='Escape')setPosition(undefined);}} aria-describedby={position? id:undefined}>{children}</Link>
    {position&&createPortal(<span className="symbol-preview" id={id} role="tooltip" style={position}><code>{preview?.signature||target.name}</code>{preview?.description&&<span>{preview.description}</span>}</span>,document.body)}</>;
}

/** Link identifiers without rewriting source or guessing ambiguous targets. */
export default function SymbolText({text,code=false,owner=''}:{text:string;code?:boolean;owner?:string}) {
  useSymbolIndex();
  const {currentPage}=useDoc();
  const whole=shouldLinkSymbol(text,code)?resolveSymbol(text,currentPage.id,owner):undefined;
  if(whole)return <SymbolLink target={whole}>{text}</SymbolLink>;
  const parts=splitSymbolText(text);
  return <>{parts.map((part,i)=>{
    // Bare prose links engine names, not ordinary words such as add, value or run.
    const target=shouldLinkSymbol(part,code)?resolveSymbol(part,currentPage.id,owner):undefined;
    return target?<SymbolLink key={i} target={target}>{part}</SymbolLink>:<React.Fragment key={i}>{part}</React.Fragment>;
  })}</>;
}
