import { services } from './runtime-config.js';
import { inspectRuntimeSource, isLoopbackOrigin, runtimeRequirements, runtimeSourceTransformer } from './source-transform.js';

const params=new URLSearchParams(location.search), token=params.get('token'), id=params.get('example');
const environment={allowLocalServices:isLoopbackOrigin(location.origin)};
const canvas=document.getElementById('scene'), status=document.getElementById('status');
// The composer treats width/height attributes as a fixed CSS size unless an
// inline size is supplied. Keep the embedded canvas tied to its viewport.
canvas.style.width='100%';canvas.style.height='100%';
let scene, manifest, descriptor, busy=false, failed=false, visibilityPaused=false;
const send=(type,data={})=>parent.postMessage({type,token,...data},location.origin);
function pauseScene(){if(scene?.composer)scene.composer.pause();else scene?.pause();}
function resumeScene(){if(scene?.composer)scene.composer.resume();else scene?.resume();}
function error(value){failed=true;const message=value?.message||String(value);status.textContent=message;send('error',{message});}
window.addEventListener('error',e=>error(e.error||e.message));
window.addEventListener('unhandledrejection',e=>{if(e.reason?.message!=='Scene Reset')error(e.reason);});
function logText(value){if(typeof value==='string')return value;if(value instanceof Error)return value.message;try{return JSON.stringify(value)??String(value);}catch{return String(value);}}
for(const level of ['log','info','warn','error']){
  const original=console[level].bind(console);
  console[level]=(...args)=>{original(...args);const message=args.map(logText).join(' ');send('log',{level,message});if(level==='error')error(message);};
}
function snapshot(){
  if(!scene)return;
  const camera=scene.camera;
  return {
    time:scene.time,
    paused:scene.isPaused,
    camera:camera?{
      position:camera.position?[camera.position.x,camera.position.y,camera.position.z]:undefined,
      rotation:camera.rotation?[camera.rotation.x,camera.rotation.y,camera.rotation.z,camera.rotation.w]:undefined,
      pitch:camera.pitch,
      yaw:camera.yaw,
      fov:camera.fov,
      model:camera.model,
      orthoScale:camera.orthoScale,
      lensShiftX:camera.lensShiftX,
      lensShiftY:camera.lensShiftY,
      aperture:camera.aperture,
      focusDist:camera.focusDist,
      bounces:camera.bounces,
      giMultiplier:camera.giMultiplier,
      targetCenter:scene.controls?.targetCenter?[scene.controls.targetCenter.x,scene.controls.targetCenter.y,scene.controls.targetCenter.z]:undefined,
      targetRadius:scene.controls?.targetRadius
    }:undefined
  };
}
async function restoreSnapshot(restore){
  if(!restore||!scene)return;
  function restoreCamera(cam,saved){
    if(!cam||!saved)return;
    if(saved.position&&cam.position)cam.position.set(saved.position);
    if(saved.rotation&&cam.rotation){
      if(Array.isArray(saved.rotation))cam.rotation.set(...saved.rotation);
      else if(typeof cam.rotation.copy==='function')cam.rotation.copy(saved.rotation);
    }
    for(const name of ['pitch','yaw','fov','model','orthoScale','lensShiftX','lensShiftY','aperture','focusDist','bounces','giMultiplier']){
      if(saved[name]!==undefined)cam[name]=saved[name];
    }
    cam.invalidateTransform?.();
    if(saved.targetCenter&&scene.controls?.targetCenter)scene.controls.targetCenter.set(saved.targetCenter);
    if(saved.targetRadius!==undefined&&scene.controls)scene.controls.targetRadius=saved.targetRadius;
    if(scene.controls&&typeof scene.controls.syncFromCamera==='function'){
      scene.controls.syncFromCamera();
    }
  }

  // 1. Restore camera and sync controller before seekTo
  if(scene.camera&&restore.camera){
    restoreCamera(scene.camera,restore.camera);
  }

  // 2. Step timeline to saved time
  if(typeof restore.time==='number'&&restore.time>0&&typeof scene.seekTo==='function'){
    try{
      await scene.seekTo(restore.time);
    }catch(err){
      if(err?.message!=='Scene Reset')console.warn('seekTo warning:',err);
    }
  }else if(typeof restore.time==='number'){
    scene.time=restore.time;
  }

  // 3. Re-assert camera state after seekTo (in case animations or checkpoints altered it)
  if(scene.camera&&restore.camera){
    restoreCamera(scene.camera,restore.camera);
  }

  if(restore.paused)pauseScene();
  scene.invalidate();
}
function resize(){const ratio=Math.min(devicePixelRatio,2);canvas.width=Math.max(1,Math.round(innerWidth*ratio));canvas.height=Math.max(1,Math.round(innerHeight*ratio));scene?.invalidate?.();}
window.addEventListener('resize',resize);resize();
async function start(code,restore){
  if(busy)return;busy=true;failed=false;status.textContent='Starting scene…';
  let blob;
  try{
    scene?.destroy();scene=undefined;
    if(!navigator.gpu)throw new Error('This browser does not provide WebGPU. Open the documentation in a WebGPU-capable browser to run this scene.');
    let module, js, requirements=descriptor.requirements;
    if(code!==undefined){
      if(!window.ts){await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='./typescript.js';s.onload=resolve;s.onerror=()=>reject(new Error('Could not load the TypeScript compiler.'));document.head.appendChild(s);});}
      requirements=inspectRuntimeSource(window.ts,code);
      const dependencyDetails=[];
      const resolveImport=spec=>{
        const replacement=descriptor.replacements?.[spec];
        if(replacement&&descriptor.dependencyRequirements?.[replacement])dependencyDetails.push(descriptor.dependencyRequirements[replacement]);
        return replacement?.startsWith('.')?new URL(replacement,location.href).href:replacement|| (spec.startsWith('.')?new URL(spec.replace(/\.ts$/,'.js')+( /\.[a-z]+$/i.test(spec)?'':'.js'),new URL(descriptor.module,location.href)).href:spec);
      };
      // Authored small labs omit imports; repository demos keep their normal imports.
      const implicitImports=!window.ts.createSourceFile('scene.ts',code,window.ts.ScriptTarget.Latest,true).statements.some(window.ts.isImportDeclaration);
      const missing=runtimeRequirements(requirements,services,environment);
      if(missing.length)throw new Error(missing.join('\n'));
      if(implicitImports){const engine=await import('retiam');code=`import { ${Object.keys(engine).filter(k=>k!=='default').join(',')} } from 'retiam';\n${code}`;}
      const output=window.ts.transpileModule(code,{reportDiagnostics:true,compilerOptions:{target:window.ts.ScriptTarget.ES2022,module:window.ts.ModuleKind.ESNext,experimentalDecorators:true},transformers:{after:[runtimeSourceTransformer(window.ts,{assetModule:new URL('./asset-url.js',location.href).href,resolveImport})]}});
      const errors=output.diagnostics?.filter(d=>d.category===window.ts.DiagnosticCategory.Error)||[];
      if(errors.length)throw new Error(errors.map(d=>{
        const position=d.file?.getLineAndCharacterOfPosition(d.start||0);
        const location=position?`line ${Math.max(1,position.line+1-Number(implicitImports))}, column ${position.character+1}: `:'';
        return `TypeScript ${location}${window.ts.flattenDiagnosticMessageText(d.messageText,'\n')}`;
      }).join('\n'));
      js=output.outputText;
      requirements={...requirements,tts:requirements.tts||dependencyDetails.some(detail=>detail.tts)};
      for(const key of ['services','localUrls','nodeImports'])requirements[key]=[...new Set([...(requirements[key]||[]),...dependencyDetails.flatMap(detail=>detail[key]||[])])];
    }
    const missing=runtimeRequirements(requirements||{},services,environment);
    if(missing.length)throw new Error(missing.join('\n'));
    const runtime=await import('retiam').catch(cause=>{throw new Error(`Could not load Retiam from the configured CDN. Check content/config.json and the CDN's CORS settings, then retry. ${cause.message}`);});Object.assign(globalThis,runtime);
    if(requirements?.tts){
      const {TTS}=await import('retiam/tts');
      TTS.configure({...(services.msedgeEndpoint?{msedgeEndpoint:services.msedgeEndpoint}:{}),...(services.modelBaseUrl?{localModelPath:services.modelBaseUrl}:{})});
    }
    if(code!==undefined){blob=URL.createObjectURL(new Blob([js],{type:'application/javascript'}));module=await import(blob);}
    else module=await import(new URL(descriptor.module,location.href).href);
    const exportName=params.get('export')||'default';
    const SceneClass=module[exportName];
    if(typeof SceneClass!=='function')throw new Error(`The source does not export scene ${exportName}.`);
    scene=new SceneClass();
    const lab=params.get('lab');if(lab)scene.lab=lab;
    await scene.start(canvas);await restoreSnapshot(restore);
    const paused=!!restore?.paused||(scene.isPaused&&!visibilityPaused&&!document.hidden);
    if(visibilityPaused||document.hidden)pauseScene();
    if(!failed){status.textContent='';send('ready',{paused});}
  }catch(e){scene?.destroy();scene=undefined;error(e);}finally{if(blob)URL.revokeObjectURL(blob);busy=false;}
}
window.addEventListener('message',async e=>{
  if(e.source!==parent||e.origin!==location.origin||e.data?.token!==token)return;
  const message=e.data;
  try{
    if(message.type==='pause'){visibilityPaused=true;pauseScene();}
    if(message.type==='destroy'){scene?.destroy();scene=undefined;}
    if(message.type==='resume'){visibilityPaused=false;if(!document.hidden)resumeScene();}
    if(message.type==='speed'&&scene)scene.timeScale=message.value;
    if(message.type==='parameter'&&scene?.setParameter)scene.setParameter(message.name,message.value);
    if(message.type==='snapshot')send('snapshot',{snapshot:snapshot()});
    if(message.type==='inspect'&&scene)send('inspection',{metrics:{time:scene.time,paused:scene.isPaused,entities:scene.entities?.length,width:canvas.width,height:canvas.height}});
    if(message.type==='run')await start(message.code,message.restore);
  }catch(e){error(e);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseScene();else send('visibility');});
window.addEventListener('pagehide',()=>scene?.destroy());
try{
  const response=await fetch('./examples.json');if(!response.ok)throw new Error('Could not load the example module manifest.');manifest=await response.json();descriptor=manifest[id];
  if(!descriptor)throw new Error('This scene was not included in the documentation build.');
  if(descriptor.error)throw new Error(descriptor.error);
  if(params.get('edited')==='1')send('request-code');
  else await start();
}catch(e){error(e);}
