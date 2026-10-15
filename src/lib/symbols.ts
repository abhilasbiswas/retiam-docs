export interface SymbolTarget { url:string; name:string; source?:string; visibility?:string; canonical?:boolean }

// These words name internal types too, but ordinary prose uses them frequently.
// Explicit inline code still links them when the author means the identifier.
export function shouldLinkSymbol(name:string,code=false):boolean {
  if(code)return true;
  if(['State','Pass','Usage','Rate','Field','Set','Map','Array','Function','Promise','Write','Create','Cross'].includes(name))return false;
  return /^[A-Z]/.test(name)||name.includes('/')||name.includes('.');
}

/** Keep paths and qualified names intact when linking identifiers within prose. */
export function splitSymbolText(text:string):string[] {
  return text.split(/((?:src|libs|examples)\/[\w./-]+\.(?:ts|wgsl)|[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)/g);
}

/** Resolve only registered identifiers; Object prototype names are not symbols. */
export function resolveSymbol(lookup:Record<string,SymbolTarget[]>,name:string,pageId='',owner=''):SymbolTarget|undefined {
  const get=(key:string)=>Object.hasOwn(lookup,key)?lookup[key]:undefined;
  if (owner && name.startsWith('this.')) return resolveSymbol(lookup,`${owner}.${name.slice(5)}`,pageId);
  if (owner && name==='this') return resolveSymbol(lookup,owner,pageId);
  const normalized=name.replace(/^\.\.\//,'').replace(/^\.\//,'');
  const targets=get(name)||get(normalized)||(/\.(ts|wgsl)$/.test(name)?get(name.split('/').pop()!):undefined);
  if(!targets?.length)return;
  const local=targets.filter(target=>target.url.startsWith(`/${pageId}#`));
  if(local.length===1)return local[0];
  const canonical=targets.filter(target=>target.canonical);
  if(canonical.length===1)return canonical[0];
  const publicTargets=targets.filter(target=>target.visibility!=='internal');
  if(publicTargets.length===1)return publicTargets[0];
  if(targets.length===1)return targets[0];
}
