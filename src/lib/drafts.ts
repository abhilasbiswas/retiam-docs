const prefix = 'retiam.docs.draft:';
const memory = new Map<string,string|undefined>();
const keyFor = (id:string,revision:string) => `${prefix}${id}:${revision}`;
export function readDraft(id:string,revision:string,storage:Pick<Storage,'getItem'>|undefined):string|undefined {
  const key=keyFor(id,revision);
  if(memory.has(key))return memory.get(key);
  try { const saved=storage?.getItem(key); if(saved!==null&&saved!==undefined)return saved; } catch { /* Fall back to navigation-lifetime storage. */ }
  return memory.get(key);
}
export function saveDraft(id:string,revision:string,code:string,original:string,storage:Pick<Storage,'setItem'|'removeItem'>|undefined):boolean {
  const key=keyFor(id,revision);
  memory.set(key,code===original?undefined:code);
  try {
    if(!storage)return false;
    if(code===original)storage.removeItem(key);else storage.setItem(key,code);
    return true;
  } catch { return false; }
}
export function browserDraftStorage():Storage|undefined {
  try { return window.localStorage; } catch { return undefined; }
}
