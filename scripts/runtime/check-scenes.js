const $ = id => document.getElementById(id);
const options=new URLSearchParams(location.search);
const results = [], discovered = await fetch('./check-scenes.json').then(r => r.json());
const selected=options.getAll('example');
const prefixes=options.getAll('prefix');
const jobs=discovered.filter(job=>(!selected.length||selected.includes(job.id))&&(!prefixes.length||prefixes.some(prefix=>job.id.startsWith(prefix)))&&(options.get('collection')!=='curriculum'||job.curriculum));
let stopped = false, running = false, completed = 0;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function run(job) {
  if (job.requirements.length && options.get('includeSetup')!=='true') return { ...job, status:'requires-setup', details:job.requirements.join('\n') };
  const token = crypto.randomUUID(), iframe = document.createElement('iframe');
  iframe.title = `Verify ${job.id} ${job.export}`;
  iframe.allow = 'autoplay'; iframe.src = `./viewer.html?${new URLSearchParams({example:job.id,export:job.export,token})}`;
  let ready = false, failure = '', timer;
  const messages = [], metrics = [];
  let resolveStartup;
  const startup = new Promise(resolve => { resolveStartup = resolve; timer = setTimeout(resolve, 20000); });
  const send = (type, data={}) => iframe.contentWindow?.postMessage({type,token,...data},location.origin);
  const message = event => {
    if (event.source !== iframe.contentWindow || event.origin !== location.origin || event.data?.token !== token) return;
    const data = event.data;
    if (data.type === 'ready') { ready = true; clearTimeout(timer); resolveStartup(); }
    if (data.type === 'error') { failure = data.message; clearTimeout(timer); resolveStartup(); }
    if (data.type === 'visibility') send('resume');
    if (data.type === 'log' && ['warn','error'].includes(data.level)) messages.push(data.message);
    if (data.type === 'inspection') metrics.push(data.metrics);
  };
  window.addEventListener('message',message); $('stage').replaceChildren(iframe);
  try {
    await startup;
    if (ready && !failure) {
      send('inspect'); send('speed',{value:8}); send('resume');
      await delay(1200); send('inspect'); await delay(100);
      // Verify the viewer can also accept pause/resume without throwing.
      send('pause'); await delay(100); send('resume'); await delay(100);
    }
    return { ...job, status:failure ? 'error' : ready ? 'startup-passed' : 'timeout', details:failure || (ready ? 'Started and observed playback for 1.2 seconds.' : 'No ready/error message within 20 seconds.'), messages:[...new Set(messages)], metrics };
  } finally { clearTimeout(timer); send('destroy'); window.removeEventListener('message',message); iframe.remove(); }
}
function row(result) {
  const tr=document.createElement('tr');
  const observations=[result.details,...(result.messages||[]).map(message=>`Warning: ${message}`)];
  if(result.metrics?.length)observations.push(`Clock: ${result.metrics[0].time} → ${result.metrics.at(-1).time} ms; canvas: ${result.metrics.at(-1).width} × ${result.metrics.at(-1).height}.`);
  for(const value of [`${result.id} (${result.export})`,result.status,observations.join('\n')]){const td=document.createElement('td');td.textContent=value;tr.append(td);}
  $('results').append(tr);
}
function report() {
  const summary = Object.fromEntries([...new Set(results.map(r=>r.status))].map(status=>[status,results.filter(r=>r.status===status).length]));
  return {createdAt:new Date().toISOString(),userAgent:navigator.userAgent,scope:'startup and short playback; not full visual/interaction/export validation',total:jobs.length,completed:results.length,summary,results};
}
$('stop').onclick=()=>{stopped=true;};
$('start').onclick=async()=>{
  if(running)return;running=true;stopped=false;$('start').disabled=true;$('stop').disabled=false;
  for(const job of jobs.slice(completed)){
    if(stopped)break;
    $('progress').textContent=`Checking ${++completed} / ${jobs.length}: ${job.id} (${job.export})`;
    const result=await run(job);results.push(result);row(result);
    $('report').textContent=JSON.stringify(report(),null,2);
    $('progress').textContent=`${completed} / ${jobs.length} complete · ${JSON.stringify(report().summary)}`;
  }
  running=false;$('start').disabled=completed===jobs.length;$('stop').disabled=true;
  $('progress').textContent=`${completed===jobs.length?'Finished':'Stopped'} · ${completed} / ${jobs.length} · ${JSON.stringify(report().summary)}`;
  const blob=new Blob([JSON.stringify(report(),null,2)],{type:'application/json'});
  $('download').href=URL.createObjectURL(blob);$('download').hidden=false;
};
