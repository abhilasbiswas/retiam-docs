import { useEffect, useSyncExternalStore } from 'react';
import rawApiFiles from './generated/api-files.json';
import { resolveSymbol as resolveLookup } from '../lib/symbols';
import type { SymbolTarget } from '../lib/symbols';
import type { HierarchyIndex } from '../lib/hierarchy';
import { expandApiEntries } from '../lib/data-payload.mjs';
import { createExampleLoader } from '../lib/example-loader';

export type { SymbolTarget } from '../lib/symbols';
export interface Example {
  id:string; source:string; sourceHash:string; title:string; description:string;
  scenes:{name:string; export:string}[];
  imports:{module:string; names:string[]}[]; calls:string[]; assets:string[];
  walkthrough?:string[]; experiments?:string[]; requirements?:string[]; related?:string[];
  controls?:{name:string; label:string; min?:number; max?:number; step?:number; value:number|string; options?:string[]}[];
  lab?:string;
  sourceNotes?:string[];
}
export interface ApiEntry {
  id:string; name:string; qualified:string; kind:string; visibility:string; source:string; line:number; endLine:number;
  entryPoints:string[]; signatures:string[]; description:string; notes:string[]; example?:string;
  descriptionOrigin?:'authored'|'jsdoc'|'source';
  contract?:{
    declarationOnly:boolean; async:boolean; generator?:boolean; parameterProperty?:boolean;
    returns:{expression:string;line:number}[];
    yields:{expression:string;delegated:boolean;line:number}[];
    writes:{target:string;operation:string;value:string;line:number}[];
    calls:{target:string;construct:boolean;line:number}[];
    throws:{expression:string;line:number}[];
    guards:{condition:string;action:string;line:number}[];
    parameters:Record<string,{kind:string;target:string}[]>;
    variants:string[]; definition?:string; initializer?:string;
    members?:{name:string;optional:boolean;readonly:boolean}[];
  };
  parameters:{name:string; type:string; optional:boolean; rest:boolean; default?:string; description:string; descriptionOrigin?:'source'|'authored-or-jsdoc'}[];
  overloads?:{signature:string;parameters:ApiEntry['parameters']}[];
  returns:string; returnsDescription?:string; default?:string; bases?:string[]; tags:{name:string; text:string}[];
  guides?:{title:string;url:string}[];
  inherited?:{name:string;declaredBy:string;url:string;visibility:string}[];
}
export let SYMBOLS:Record<string,SymbolTarget[]>={};
const symbolUrl=new URL('./generated/symbol-index.json',import.meta.url).href;
let symbolRequest:Promise<void>|undefined, revision=0;
const listeners=new Set<()=>void>();
const subscribe=(listener:()=>void)=>{listeners.add(listener);return()=>{listeners.delete(listener);};};
export function useSymbolIndex() {
  const current=useSyncExternalStore(subscribe,()=>revision,()=>0);
  useEffect(()=>{
    if(!symbolRequest)symbolRequest=fetch(symbolUrl).then(r=>{if(!r.ok)throw new Error('Could not load API navigation.');return r.json();}).then((data:{targets:SymbolTarget[];symbols:Record<string,number[]>})=>{SYMBOLS=Object.fromEntries(Object.entries(data.symbols).map(([name,ids])=>[name,ids.map(id=>data.targets[id])]));revision++;listeners.forEach(listener=>listener());}).catch(()=>{symbolRequest=undefined;});
  },[]);
  return current;
}
export const loadExample = createExampleLoader(new URL('./generated/example-index.json', import.meta.url).href);
const apiFiles=rawApiFiles as Record<string,string>;
const urls=import.meta.glob<string>('./generated/api/*.json',{eager:true,query:'?url&no-inline',import:'default'});
const cache=new Map<string,Promise<ApiEntry[]>>();
export function loadApi(source:string):Promise<ApiEntry[]> {
  if(cache.has(source))return cache.get(source)!;
  const url=urls[`./generated/api/${apiFiles[source]}`];
  if(!url)return Promise.reject(new Error(`Missing API reference: ${source}`));
  const request=fetch(url).then(r=>{if(!r.ok)throw new Error('Could not load API reference.');return r.json();}).then(expandApiEntries).catch(e=>{cache.delete(source);throw e;});
  cache.set(source,request);return request;
}
export function resolveSymbol(name:string,pageId='',owner=''):SymbolTarget|undefined {
  return resolveLookup(SYMBOLS,name,pageId,owner);
}

const hierarchyUrl = new URL('./generated/class-hierarchy.json', import.meta.url).href;
let hierarchyRequest: Promise<HierarchyIndex> | undefined;
export function loadHierarchy(): Promise<HierarchyIndex> {
  return hierarchyRequest ||= fetch(hierarchyUrl).then(response => {
    if (!response.ok) throw new Error('Could not load the class hierarchy.');
    return response.json() as Promise<HierarchyIndex>;
  }).catch(error => { hierarchyRequest = undefined; throw error; });
}
