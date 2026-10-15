import fs from 'node:fs';

// Uses the connected browser's documented tab/viewport APIs. No second browser
// or GPU emulation is needed; run against a built preview and engine server.
const notes=Object.assign({},...['projects','comparisons','workshops','tutorials'].map(name=>JSON.parse(fs.readFileSync(new URL(`../content/example-notes/${name}.json`,import.meta.url),'utf8'))));
const projects=[['project-animated-chart','chart'],['project-draggable-diagram','diagram'],['project-mathematical-explanation','tangent'],['project-interactive-3d','model']];
const comparisons=[['transforms','anchor-pivot'],['entities','local-world'],['animation','sequence-parallel'],['paint-effects','geometry-paint']];
const check=(condition,message)=>{if(!condition)throw new Error(message);};
const exampleCard=(tab,title)=>tab.playwright.locator('.live-example').filter({has:tab.playwright.getByRole('heading',{name:title,exact:true})});

export async function checkDocsScenes(tab,baseUrl='http://127.0.0.1:4174') {
  const results=[];
  for(const [page,names] of [
    ...projects.map(([page,name])=>[page,[1,2,3].map(stage=>`project-${name}-${stage}`)]),
    ...comparisons.map(([page,name])=>[page,[`compare-${name}`]]),
  ]) {
    await tab.goto(`${baseUrl}/${page}`);
    for(const name of names) {
      const title=notes[`labs/${name}`].title;
      await exampleCard(tab,title).getByRole('button',{name:'Run Scene',exact:true}).click();
      await tab.playwright.frameLocator(`iframe[title="${title}"]`).locator('#status:empty').waitFor({state:'attached',timeoutMs:20000});
      const errors=await exampleCard(tab,title).locator('.example-error').allTextContents({timeoutMs:1000});
      check(!errors.length,`${name}: ${errors.join('; ')}`);
      results.push({scene:name,ready:true});
    }
  }
  return results;
}

export async function checkWorkshopScenes(tab,baseUrl='http://127.0.0.1:4174') {
  const results=[];
  for(const [page,names] of [
    ['extension-workshop',['component','modifier','uniforms','post-process']],
    ['animation-control',['animation-control']],
    ['performance',['performance']],
  ]) {
    await tab.goto(`${baseUrl}/${page}`);
    for(const name of names) {
      const title=notes[`labs/workshop-${name}`].title;
      await exampleCard(tab,title).getByRole('button',{name:'Run Scene',exact:true}).click();
      await tab.playwright.frameLocator(`iframe[title="${title}"]`).locator('#status:empty').waitFor({state:'attached',timeoutMs:20000});
      const errors=await exampleCard(tab,title).locator('.example-error').allTextContents({timeoutMs:1000});
      check(!errors.length,`${name}: ${errors.join('; ')}`);
      results.push({scene:`workshop-${name}`,ready:true});
    }
  }
  return results;
}

export async function checkTutorialScenes(tab,baseUrl='http://127.0.0.1:4174') {
  const results=[];
  for(const name of ['custom-entity','compute-kernel','frame-graph','custom-plugin']) {
    const id=`tutorial-${name}`,title=notes[`labs/${id}`].title;
    await tab.goto(`${baseUrl}/${id}`);
    const card=exampleCard(tab,title);
    for(const action of ['start','restart']) {
      await card.getByRole('button',{name:'Run Scene',exact:true}).click();
      await tab.playwright.frameLocator(`iframe[title="${title}"]`).locator('#status:empty').waitFor({state:'attached',timeoutMs:20000});
      const errors=await card.locator('.example-error').allTextContents({timeoutMs:1000});
      check(!errors.length,`${id} (${action}): ${errors.join('; ')}`);
    }
    results.push({scene:id,ready:true,restarted:true});
  }
  return results;
}

export async function checkDocsInterface(tab,viewport,baseUrl='http://127.0.0.1:4174') {
  try {
    await viewport.set({width:1440,height:1000});
    await tab.goto(`${baseUrl}/project-animated-chart`);
    const card=exampleCard(tab,notes['labs/project-chart-1'].title);
    await card.getByRole('button',{name:'Run Scene',exact:true}).click();
    const measure=()=>card.locator('.example-workbench').evaluate(el=>{
      const code=el.querySelector('.code-panel'),preview=el.querySelector('.canvas-panel'),body=el.querySelector('.ide-body'),stage=el.querySelector('.example-stage');
      return {codeTop:code.getBoundingClientRect().top,previewTop:preview.getBoundingClientRect().top,previewWidth:preview.clientWidth,bodyWidth:body.clientWidth,stageHeight:stage.clientHeight,codeDisplay:getComputedStyle(code).display};
    });
    let layout=await measure();
    check(Math.abs(layout.codeTop-layout.previewTop)<2,'Desktop code and preview must be side by side.');
    await card.getByRole('button',{name:'View Settings',exact:true}).click();
    await card.getByRole('button',{name:'Show Code',exact:true}).click();
    layout=await measure();
    check(layout.codeDisplay==='none'&&layout.previewWidth===layout.bodyWidth,'Hiding code must give the preview the whole workbench width.');
    await card.getByRole('button',{name:'Show Code',exact:true}).click();
    await card.getByRole('button',{name:'View Settings',exact:true}).click();
    await viewport.set({width:390,height:844});
    layout=await measure();
    check(layout.previewTop<layout.codeTop&&layout.previewWidth===layout.bodyWidth&&layout.stageHeight>=320,'Mobile preview must precede the code and keep its full width and minimum height.');
    check(await tab.playwright.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'The mobile document must not overflow horizontally.');
    await tab.playwright.getByRole('button',{name:'Search documentation',exact:true}).click();
    const input=tab.playwright.getByPlaceholder('Search docs — headings, APIs, topics...');
    await input.fill('Scene.play');
    await tab.playwright.locator('.search-result-title').first().waitFor({state:'visible',timeoutMs:10000});
    check(await tab.playwright.locator('.search-result-title').first().innerText({timeoutMs:1000})==='Scene.play','An exact API name must lead search results.');
    for(const [name,type] of [['API','api'],['Guides','section'],['Examples','example']]) {
      await tab.playwright.getByLabel('Search category',{exact:true}).getByRole('button',{name,exact:true}).click();
      const types=await tab.playwright.locator('.search-result-type-badge').allTextContents({timeoutMs:1000});
      check(types.length>0&&types.every(value=>value===type),`${name} filter returned a different category.`);
    }
    await input.press('Escape');
    await tab.playwright.locator('#search-modal').waitFor({state:'hidden',timeoutMs:3000});
    return {desktopSplit:true,fullWidthPreview:true,mobilePreviewFirst:true,mobileOverflow:false,exactApiSearch:true,searchFilters:true};
  } finally { await viewport.reset(); }
}

export { checkDocsFormatting } from './formatting-browser-checks.mjs';

export { checkDocsNavigation } from './navigation-browser-checks.mjs';
export { checkDocsHierarchy } from './hierarchy-browser-checks.mjs';
export { checkDocsHierarchyLayout } from './hierarchy-layout-checks.mjs';
