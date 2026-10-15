import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { loadMonaco } from '../../lib/editor-runtime';

/** The original Monaco editing experience, with an editable fallback while it loads. */
export default function LiveCodeEditor({value,label,onChange,onRun}:{value:string;label:string;onChange:(value:string)=>void;onRun:()=>void}) {
  const {theme}=useTheme();
  const container=useRef<HTMLDivElement>(null),editor=useRef<any>(null);
  const current=useRef({value,onChange,onRun,theme});
  const [ready,setReady]=useState(false);
  current.current={value,onChange,onRun,theme};
  useEffect(()=>{
    let cancelled=false,localEditor:any,resize:ResizeObserver|undefined;
    const target=container.current;
    if(!target)return;
    const observer=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      observer.disconnect();
      loadMonaco().then(monaco=>{
        if(cancelled)return;
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({target:monaco.languages.typescript.ScriptTarget.ES2022,allowNonTsExtensions:true,noImplicitThis:false});
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({noSemanticValidation:true,noSyntaxValidation:false});
        localEditor=monaco.editor.create(target,{
          value:current.current.value,language:'typescript',ariaLabel:label,
          theme:current.current.theme==='dark'?'vs-dark':'vs',automaticLayout:false,
          minimap:{enabled:false},fontSize:14,fontFamily:"'Fira Code', monospace",fontLigatures:true,
          padding:{top:16,bottom:16},scrollbar:{verticalScrollbarSize:10,horizontalScrollbarSize:10},
        });
        editor.current=localEditor;
        localEditor.onDidChangeModelContent(()=>{
          const next=localEditor.getValue();
          if(next!==current.current.value)current.current.onChange(next);
        });
        localEditor.addCommand(monaco.KeyMod.CtrlCmd|monaco.KeyCode.Enter,()=>current.current.onRun());
        resize=new ResizeObserver(()=>localEditor.layout());resize.observe(target);
        setReady(true);
      }).catch(()=>{ /* The accessible textarea remains usable if Monaco is unavailable. */ });
    },{rootMargin:'200px'});
    observer.observe(target);
    return()=>{cancelled=true;observer.disconnect();resize?.disconnect();localEditor?.getModel()?.dispose();localEditor?.dispose();if(editor.current===localEditor)editor.current=null;};
  },[label]);
  useEffect(()=>{if(editor.current&&editor.current.getValue()!==value)editor.current.setValue(value);},[value]);
  useEffect(()=>{if(ready)window.monaco?.editor.setTheme(theme==='dark'?'vs-dark':'vs');},[theme,ready]);
  return <div className="example-code-editor">
    <div className="monaco-container" ref={container}/>
    {!ready&&<textarea className="example-editor" aria-label={label} spellCheck={false} value={value} onChange={event=>onChange(event.target.value)} onKeyDown={event=>{
      if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){event.preventDefault();onRun();}
      if(event.key==='Tab'){event.preventDefault();const input=event.currentTarget,start=input.selectionStart,end=input.selectionEnd;onChange(value.slice(0,start)+'  '+value.slice(end));requestAnimationFrame(()=>{input.selectionStart=input.selectionEnd=start+2;});}
    }}/>}
  </div>;
}
