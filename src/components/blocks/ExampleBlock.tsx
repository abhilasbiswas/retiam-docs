import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { ExampleBlock as Block } from '../../types';
import { loadExample, type Example } from '../../data/references';
import InlineText from './InlineText';
import CodeBlock from './CodeBlock';
import LiveCodeEditor from './LiveCodeEditor';
import { browserDraftStorage, readDraft, saveDraft } from '../../lib/drafts';

const readPreference=(key:string)=>{try{return browserDraftStorage()?.getItem(key);}catch{return null;}};
const savePreference=(key:string,value:boolean)=>{try{browserDraftStorage()?.setItem(key,String(value));}catch{/* Settings remain active for this visit. */}};

const runtimeBase=`${import.meta.env.BASE_URL}runtime/`;
interface LogEntry {message:string;level:string}
export default function ExampleBlock({block}:{block:Block}) {
  const instance=useId();
  const [example,setExample]=useState<Example>(),[exampleError,setExampleError]=useState(''),[exampleAttempt,setExampleAttempt]=useState(0);
  const frame=useRef<HTMLIFrameElement>(null),root=useRef<HTMLDivElement>(null),workbench=useRef<HTMLDivElement>(null),stage=useRef<HTMLDivElement>(null),consoleOutput=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(false),[version,setVersion]=useState(0),[state,setState]=useState('idle'),[error,setError]=useState('');
  const [paused,setPaused]=useState(false),[source,setSource]=useState<string>(),[edited,setEdited]=useState('');
  const [loadSource,setLoadSource]=useState(false);
  const [sourceError,setSourceError]=useState(''),[sourceAttempt,setSourceAttempt]=useState(0);
  const [draftError,setDraftError]=useState('');
  const [isLive,setIsLive]=useState(()=>readPreference('retiam_pg_live')==='true');
  const [preserve,setPreserve]=useState(()=>{const val=readPreference('retiam_pg_preserve');if(val===null){savePreference('retiam_pg_preserve',true);return true;}return val!=='false';});
  const [showCode,setShowCode]=useState(true),[showCanvas,setShowCanvas]=useState(true),[showConsole,setShowConsole]=useState(false),[settings,setSettings]=useState(false),[fullscreen,setFullscreen]=useState(false);
  const [logs,setLogs]=useState<LogEntry[]>([]);
  const [selectedExport,setSelectedExport]=useState('default');
  const pendingCode=useRef<string|undefined>(undefined),pendingRestore=useRef<unknown>(undefined);
  const pendingRun=useRef<{code:string|undefined}|undefined>(undefined),snapshotTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  const editTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),inView=useRef(false),activeViewer=useRef(false);
  const token=`${instance}-${version}`;
  const send=useCallback((type:string,data:Record<string,unknown>={})=>frame.current?.contentWindow?.postMessage({type,token,...data},location.origin),[token]);
  const launch=useCallback((code?:string,restore?:unknown)=>{
    pendingRun.current=undefined;clearTimeout(snapshotTimer.current);
    pendingCode.current=code;pendingRestore.current=restore;
    activeViewer.current=true;
    window.dispatchEvent(new CustomEvent('retiam-example-start',{detail:instance}));
    setError('');setLogs([]);setPaused(false);setState('loading');setVersion(v=>v+1);setActive(true);
  },[instance]);
  const start=useCallback((code?:string,keepState=false)=>{
    clearTimeout(editTimer.current);clearTimeout(snapshotTimer.current);pendingRun.current=undefined;
    if(keepState&&active&&state==='ready'){
      pendingRun.current={code};send('snapshot');
      snapshotTimer.current=setTimeout(()=>{if(pendingRun.current)launch(pendingRun.current.code);},750);
    }else launch(code);
  },[active,state,send,launch]);
  const latest=useRef({start,edited,preserve,isLive,send,paused,source});latest.current={start,edited,preserve,isLive,send,paused,source};
  const changeCode=(code:string)=>{
    setEdited(code);clearTimeout(editTimer.current);
    if(example&&source!==undefined)setDraftError(saveDraft(example.id,example.sourceHash,code,source,browserDraftStorage())?'':'Browser storage is unavailable. Your edits survive navigation in this tab; copy them before closing it.');
    if(isLive)editTimer.current=setTimeout(()=>latest.current.start(code,latest.current.preserve),500);
  };
  useEffect(()=>{
    let cancelled=false;
    setExample(undefined);setExampleError('');setSource(undefined);setEdited('');setLoadSource(false);
    setActive(false);setState('idle');activeViewer.current=false;
    void loadExample(block.example).then(value=>{
      if(!cancelled){setExample(value);setSelectedExport(value.scenes[0]?.export||'default');}
    }).catch(value=>{if(!cancelled)setExampleError(value instanceof Error?value.message:String(value));});
    return()=>{cancelled=true;};
  },[block.example,exampleAttempt]);
  useEffect(()=>{
    if(!example)return;
    const target=root.current;
    if(!target||typeof IntersectionObserver==='undefined'){setLoadSource(true);return;}
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){setLoadSource(true);observer.disconnect();}
    },{rootMargin:'800px 0px'});
    observer.observe(target);return()=>observer.disconnect();
  },[example]);
  useEffect(()=>{
    if(!loadSource||!example)return;
    const controller=new AbortController();setSourceError('');
    fetch(`${runtimeBase}sources/${example.source}`,{signal:controller.signal}).then(async response=>{
      if(!response.ok)throw new Error('Could not load the original source.');return response.text();
    }).then(code=>{setSource(code);setEdited(readDraft(example.id,example.sourceHash,browserDraftStorage())??code);}).catch(e=>{if(!controller.signal.aborted)setSourceError(e instanceof Error?e.message:String(e));});
    return()=>controller.abort();
  },[loadSource,example,sourceAttempt]);
  useEffect(()=>{
    const onMessage=(event:MessageEvent)=>{
      if(event.source!==frame.current?.contentWindow||event.origin!==location.origin||event.data?.token!==token)return;
      if(event.data.type==='request-code')send('run',{code:pendingCode.current,restore:pendingRestore.current});
      if(event.data.type==='visibility')send(inView.current&&!latest.current.paused?'resume':'pause');
      if(event.data.type==='ready'){setState('ready');setPaused(!!event.data.paused);setError('');}
      if(event.data.type==='error'){setState('error');setError(event.data.message);}
      if(event.data.type==='log')setLogs(previous=>[...previous.slice(-199),{message:event.data.message,level:event.data.level}]);
      if(event.data.type==='snapshot'&&pendingRun.current)launch(pendingRun.current.code,event.data.snapshot);
    };
    window.addEventListener('message',onMessage);return()=>window.removeEventListener('message',onMessage);
  },[token,send,launch]);
  useEffect(()=>{
    // Release off-screen viewers, but let every visible preview keep playing.
    const onStart=(event:Event)=>{if((event as CustomEvent<string>).detail!==instance&&!inView.current){clearTimeout(snapshotTimer.current);clearTimeout(editTimer.current);pendingRun.current=undefined;activeViewer.current=false;setActive(false);setState('idle');}};
    window.addEventListener('retiam-example-start',onStart);return()=>window.removeEventListener('retiam-example-start',onStart);
  },[instance]);
  useEffect(()=>{
    if(!stage.current)return;
    const observer=new IntersectionObserver(entries=>{
      const visible=entries[entries.length-1].isIntersecting;
      const entering=visible&&!inView.current;
      inView.current=visible;
      const current=latest.current;
      if(activeViewer.current)current.send(visible&&!current.paused?'resume':'pause');
      else if(entering&&current.source!==undefined&&!example?.requirements?.length)current.start(current.edited===current.source?undefined:current.edited);
    },{threshold:0});
    observer.observe(stage.current);return()=>observer.disconnect();
    // Keep the observer stable across launches to avoid restarting a preview
    // that remains visible while its iframe mounts.
  },[example?.id,example?.requirements?.length]);
  useEffect(()=>{
    if(source!==undefined&&inView.current&&!activeViewer.current&&!example?.requirements?.length){const current=latest.current;current.start(current.edited===source?undefined:current.edited);}
  },[source,selectedExport,example?.requirements?.length]);
  useEffect(()=>{if(state==='ready'&&(paused||!inView.current))send('pause');},[state,paused,send]);
  useEffect(()=>{
    if(!active||state!=='loading')return;
    const timer=setTimeout(()=>setError('The scene is taking longer to start. Check its requirements, or run it again to try again.'),45000);
    return()=>clearTimeout(timer);
  },[active,state,token]);
  useEffect(()=>()=>{clearTimeout(editTimer.current);clearTimeout(snapshotTimer.current);},[]);
  useEffect(()=>{const update=()=>setFullscreen(document.fullscreenElement===workbench.current);document.addEventListener('fullscreenchange',update);return()=>document.removeEventListener('fullscreenchange',update);},[]);
  useEffect(()=>{if(consoleOutput.current)consoleOutput.current.scrollTop=consoleOutput.current.scrollHeight;},[logs,showConsole]);
  if(!example)return <div className="example-source-loading"><p role={exampleError?'alert':'status'}>{exampleError||'Loading example…'}</p>{exampleError&&<button onClick={()=>setExampleAttempt(value=>value+1)}>Retry example</button>}</div>;
  const stop=()=>{clearTimeout(editTimer.current);clearTimeout(snapshotTimer.current);pendingRun.current=undefined;activeViewer.current=false;send('destroy');setActive(false);setState('idle');};
  const reset=()=>{if(source!==undefined){setEdited(source);saveDraft(example.id,example.sourceHash,source,source,browserDraftStorage());setDraftError('');start();}};
  const run=()=>start(edited,preserve);
  const toggleLive=()=>{const next=!isLive;setIsLive(next);savePreference('retiam_pg_live',next);if(next&&source!==undefined)run();else clearTimeout(editTimer.current);};
  const url=`${runtimeBase}viewer.html?${new URLSearchParams({example:example.id,export:selectedExport,token,...(pendingCode.current!==undefined?{edited:'1'}:{})})}`;
  const sourcePanel=source===undefined?<div className="example-source-loading"><p role={sourceError?'alert':'status'}>{sourceError||(!loadSource?'Source loads when this example approaches the viewport.':'Loading TypeScript…')}</p>{sourceError&&<button onClick={()=>setSourceAttempt(value=>value+1)}>Retry source</button>}</div>:<LiveCodeEditor value={edited} label={`Edit ${example.title} TypeScript`} onChange={changeCode} onRun={run}/>;
  const responsiveScene=example.id.startsWith('labs/')||example.id.startsWith('highlights/')||(example.id.startsWith('motion/')&&example.id!=='motion/spline_demo');
  return <div className="live-example" ref={root}>
    <div className="example-heading"><h3>{block.title||example.title}</h3><span>{example.scenes.length?'Live scene':'Supporting source'}</span></div>
    {example.description&&<p><InlineText text={example.description}/></p>}
    {example.requirements?.length? <div className="example-requirements"><strong>Before you run this scene</strong><ul>{example.requirements.map((r,i)=><li key={i}><InlineText text={r}/></li>)}</ul></div>:null}
    {example.scenes.length>0&&<>
      <div ref={workbench} className={`playground-card example-workbench${showCode?'':' hide-code'}${showCanvas?'':' hide-canvas'}${showConsole?'':' hide-console'}`}>
        <div className="playground-toolbar">
          <div className="toolbar-group">
            <span className="material-symbols-outlined">code_blocks</span><span className="toolbar-label">Live Editor</span>
            <button className={`icon-btn${isLive?' active':''}`} onClick={toggleLive} title="Live Auto-Run" aria-label="Live Auto-Run" aria-pressed={isLive}><span className="material-symbols-outlined">bolt</span></button>
            <button className={`icon-btn${preserve?' active':''}`} onClick={()=>{const next=!preserve;setPreserve(next);savePreference('retiam_pg_preserve',next);}} title="Preserve State" aria-label="Preserve State" aria-pressed={preserve}><span className="material-symbols-outlined">save</span></button>
            <button className="icon-btn" onClick={reset} disabled={source===undefined} title="Reset Code" aria-label="Reset Code"><span className="material-symbols-outlined">refresh</span></button>
          </div>
          <div className="toolbar-group">
            {example.scenes.length>1&&<select aria-label="Scene" value={selectedExport} onChange={e=>{stop();setSelectedExport(e.target.value);}}>{example.scenes.map(s=><option key={s.export} value={s.export}>{s.name}</option>)}</select>}
            <button className="icon-btn" onClick={run} disabled={source===undefined} title="Run Scene (Ctrl/⌘+Enter)" aria-label="Run Scene"><span className="material-symbols-outlined">play_arrow</span></button>
            <button className="icon-btn" onClick={()=>{void (fullscreen?document.exitFullscreen():workbench.current?.requestFullscreen())?.catch(e=>setError(e.message));}} title="Toggle Fullscreen" aria-label="Toggle Fullscreen"><span className="material-symbols-outlined">{fullscreen?'fullscreen_exit':'fullscreen'}</span></button>
            <button className={`icon-btn${settings?' active':''}`} onClick={()=>setSettings(value=>!value)} title="View Settings" aria-label="View Settings" aria-expanded={settings}><span className="material-symbols-outlined">settings</span></button>
            {settings&&<div className="settings-dropdown">{[
              {label:'Show Code',value:showCode,toggle:()=>setShowCode(value=>!value)},
              {label:'Show Result',value:showCanvas,toggle:()=>setShowCanvas(value=>!value)},
              {label:'Show Console',value:showConsole,toggle:()=>setShowConsole(value=>!value)},
            ].map(item=><button key={item.label} className={`dropdown-item${item.value?' active':''}`} onClick={item.toggle} aria-label={item.label} aria-pressed={item.value}><span>{item.label}</span>{item.value&&<span className="material-symbols-outlined" aria-hidden="true">check</span>}</button>)}</div>}
          </div>
        </div>
        <div className="ide-body">
          <div className="code-panel">
            <div className="example-panel-heading">{example.source.split('/').pop()}</div>
            {sourcePanel}
            <div className="console-panel"><div className="console-header">Terminal Output</div><div className="console-output" ref={consoleOutput} role="log" aria-label="Scene console">{logs.length?logs.map((log,index)=><div key={index} className={`log-entry ${log.level}`}>&gt; {log.message}</div>):<div className="log-entry">&gt; Ready. Run the scene to see output.</div>}</div></div>
          </div>
          <div className="canvas-panel">
            <div className="example-panel-heading">Preview</div>
            <div className="example-stage" ref={stage} data-presentation={responsiveScene?'responsive':'landscape'}>
              {active?<iframe ref={frame} key={token} src={url} title={example.title} allow="fullscreen; autoplay" sandbox="allow-scripts allow-same-origin"/>:<div className="example-poster"><span className="material-symbols-outlined">play_circle</span><p>{example.requirements?.length?'Review the requirements above, then start this scene.':'Edit the code, then run the scene to explore it here.'}</p><button onClick={()=>start(source===undefined?undefined:edited)}>Start scene</button></div>}
            </div>
          </div>
        </div>
      </div>
    </>}
    {error&&<div className="example-error" role="alert"><p>{error}</p><button onClick={run} disabled={source===undefined}>Run again</button></div>}
    {draftError&&<p role="status">{draftError}</p>}
    {example.walkthrough?.length? <div className="example-walkthrough"><h4>What happens in this scene</h4>{example.walkthrough.map((text,i)=><p key={i}><InlineText text={text}/></p>)}</div>:null}
    {!example.walkthrough?.length&&example.sourceNotes?.length?<details className="example-source-notes"><summary>Follow the source annotations</summary><ol>{example.sourceNotes.map((note,i)=><li key={i}><InlineText text={note}/></li>)}</ol></details>:null}
    {example.experiments?.length? <div className="example-experiments"><h4>Try it yourself</h4><ul>{example.experiments.map((text,i)=><li key={i}><InlineText text={text}/></li>)}</ul></div>:null}
    {example.related?.length? <p>APIs and features used: <InlineText text={example.related.map(name=>`\`${name}\``).join(' · ')}/></p>:null}
    <p className="example-source-link"><a href={`https://github.com/abhilasbiswas/retiam-docs/blob/main/${example.source}`} target="_blank" rel="noopener noreferrer">{example.source}</a></p>
    {!example.scenes.length&&source!==undefined&&<CodeBlock block={{type:'code',language:'typescript',code:source}}/>}
    {!example.scenes.length&&sourceError&&<p role="alert">{sourceError}</p>}
  </div>;
}
