import fs from 'node:fs';
import { expandApiEntries } from '../src/lib/data-payload.mjs';

const check=(condition,message)=>{if(!condition)throw new Error(message);};

export async function checkDocsNavigation(tab,viewport,baseUrl='http://127.0.0.1:4174') {
  const catalog=JSON.parse(fs.readFileSync(new URL('../src/data/generated/page-catalog.json',import.meta.url),'utf8'));
  const tutorialCount=catalog.pages.filter(page=>page.difficulty&&page.outcome).length;
  const entries=expandApiEntries(JSON.parse(fs.readFileSync(new URL('../src/data/generated/api/src_engine__core_Entity.ts.json',import.meta.url),'utf8')));
  const internal=entries.find(entry=>entry.visibility==='internal');
  const move=entries.find(entry=>entry.qualified==='Entity.move');
  try {
    await viewport.set({width:1440,height:1000});
    await tab.goto(`${baseUrl}/coordinates-colors`);
    await tab.playwright.getByRole('heading',{name:'Coordinates, units and colors',exact:true}).waitFor({state:'visible',timeoutMs:10000});
    check(await tab.playwright.locator('h1').count()===1,'Each page must have one main heading.');
    check(await tab.playwright.locator('.doc-page-summary').isVisible(),'The guide needs its purpose statement.');
    check(await tab.playwright.locator('.doc-pagination .next').getAttribute('href')==='/entities','Previous/Next must follow the authored learning sequence.');

    const media=tab.playwright.getByRole('button',{name:'Text and media',exact:true});
    if(await media.getAttribute('aria-expanded')==='true')await media.click();
    await media.click();
    await tab.reload();
    await tab.playwright.getByRole('heading',{name:'Coordinates, units and colors',exact:true}).waitFor({state:'visible',timeoutMs:10000});
    check(await media.getAttribute('aria-expanded')==='true','Expanded sidebar groups must persist after reload.');
    await media.click();

    await tab.goto(`${baseUrl}/tutorials`);
    await tab.playwright.locator('.tutorial-card').first().waitFor({state:'visible',timeoutMs:10000});
    check(await tab.playwright.locator('.tutorial-card').count()===tutorialCount,'The tutorial catalog must include every registered lesson.');
    await tab.playwright.getByLabel('Find a tutorial',{exact:true}).fill('ComputeKernel');
    check(await tab.playwright.locator('.tutorial-card').count()===1,'Tutorial search must narrow the catalog.');
    await tab.playwright.getByRole('link',{name:'Use ComputeKernel to generate an image',exact:true}).click();
    await tab.playwright.getByRole('heading',{name:'Use ComputeKernel to generate an image',exact:true}).waitFor({state:'visible',timeoutMs:10000});
    check(await tab.playwright.locator('.tutorial-meta').first().isVisible(),'Tutorials must show difficulty and time.');

    await tab.goto(`${baseUrl}/installation`);
    await tab.playwright.locator('.doc-pagination .next[href="/first-scene"]').waitFor({state:'visible',timeoutMs:10000});
    await tab.playwright.locator('.doc-pagination .next').click();
    await tab.playwright.locator('.doc-pagination .next[href="/coordinates-colors"]').waitFor({state:'visible',timeoutMs:10000});
    check(await tab.playwright.locator('.reading-path').count()===0,'The linear guide sequence must not have a path chooser.');
    await tab.goto(`${baseUrl}/first-scene?path=animation`);
    await tab.playwright.locator('.doc-pagination .next[href="/coordinates-colors"]').waitFor({state:'visible',timeoutMs:10000});
    await tab.reload();
    await tab.playwright.locator('.doc-pagination .next[href="/coordinates-colors"]').waitFor({state:'visible',timeoutMs:10000});
    check(await tab.playwright.locator('.doc-pagination .prev').getAttribute('href')==='/installation','Old path queries must retain the original guide sequence.');

    await tab.goto(`${baseUrl}/api-core-entity`);
    await tab.playwright.locator(`#${move.id}`).waitFor({state:'visible',timeoutMs:10000});
    check(!await tab.playwright.locator(`#${internal.id}`).isVisible(),'Internal members should be hidden by default.');
    check(await tab.playwright.getByRole('heading',{name:'Transforms',exact:true}).isVisible(),'Large classes need behavioral groups.');
    const scope=tab.playwright.getByRole('checkbox',{name:'Include internal and protected members',exact:true});
    await scope.check();
    check(await tab.playwright.locator(`#${internal.id}`).isVisible(),'The scope toggle must reveal internal members.');
    await scope.uncheck();

    await tab.goto(`${baseUrl}/api-core-entity#${internal.id}`);
    const target=tab.playwright.locator(`#${internal.id}`);
    await target.waitFor({state:'visible',timeoutMs:10000});
    check(await target.getAttribute('open')!==null,'An internal deep link must open its member.');
    check(await tab.playwright.getByRole('button',{name:'Engine API',exact:true}).getAttribute('aria-expanded')==='true','The active reference group must open automatically.');
    check(await tab.playwright.locator('#nav-api-core-entity').evaluate(el=>{
      const item=el.getBoundingClientRect(),drawer=el.closest('nav').getBoundingClientRect();
      return item.top>=drawer.top&&item.bottom<=drawer.bottom;
    }),'The active page must be revealed within the sidebar.');

    await tab.goto(`${baseUrl}/first-scene`);
    check(await tab.playwright.locator('.doc-page-prerequisites').isVisible(),'Tutorial prerequisites must be shown.');
    check(await tab.playwright.locator('.doc-page-outcome').isVisible(),'Tutorial outcomes must be shown.');
    await viewport.set({width:390,height:844});
    await tab.playwright.getByRole('button',{name:'Toggle menu',exact:true}).click();
    await tab.playwright.locator('#sidebar-nav.open').waitFor({state:'visible',timeoutMs:3000});
    const animation=tab.playwright.getByRole('button',{name:'Animation and timing',exact:true});
    if(await animation.getAttribute('aria-expanded')!=='true')await animation.click();
    await tab.playwright.locator('#nav-animation').click();
    await tab.playwright.getByRole('heading',{name:'Animation and asynchronous choreography',exact:true}).waitFor({state:'visible',timeoutMs:10000});
    check(await tab.playwright.locator('#sidebar-nav').evaluate(el=>!el.classList.contains('open')),'Choosing a mobile page must close the menu.');
    check(await tab.playwright.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'The mobile header must not overflow.');
    await tab.playwright.getByRole('button',{name:'Toggle theme',exact:true}).click();
    check(await tab.playwright.evaluate(()=>document.documentElement.getAttribute('data-theme'))==='light','The updated page must support the light theme.');
    return {pageHeaders:true,guideSequence:true,tutorialCatalog:true,tutorialSearch:true,linearGuideSequence:true,legacyQueryIgnored:true,sidebarPersistence:true,activePageReveal:true,publicApiFilter:true,apiGroups:true,internalDeepLinks:true,mobileMenu:true,mobileOverflow:false,lightTheme:true};
  } finally { await viewport.reset(); }
}
