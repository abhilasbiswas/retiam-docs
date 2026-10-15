const check = (condition, message) => { if (!condition) throw new Error(message); };

export async function checkDocsFormatting(tab, viewport, baseUrl='http://127.0.0.1:4174', pageIds=[], widths=[1440,390]) {
  const results=[];
  const pages=[...new Set(pageIds.length ? pageIds : [
    'notes-player-controls-and-timeline-ui-architecture', 'notes-font-system-architecture',
    'notes-frame-graph-architecture-and-extensibility', 'project-map',
    'notes-3d-morphing-manim-shading-and-vertex-kinematics', 'notes-analytical-path-architecture',
    'notes-obj-loader-and-3d-model-pipeline-architecture', 'notes-svg-system-and-path-equalization-architecture',
    'notes-texture-atlas-and-sprite-animation-architecture', 'notes-track-builder-and-animation-architecture',
  ])];
  try {
    for(const width of widths) {
      await viewport.set({width,height:1000});
      for(const page of pages) {
        await tab.goto(`${baseUrl}/${page}`);
        await tab.playwright.locator('main .doc-section').first().waitFor({state:'attached'});
        const diagrams=await tab.playwright.locator('.doc-diagram').count();
        for(let i=0;i<diagrams;i++)await tab.playwright.locator('.doc-diagram').nth(i).locator('svg,.diagram-error').waitFor({state:'attached',timeoutMs:20000});
        const measurement=await tab.playwright.locator('main').evaluate(el=>({
          overflow:el.scrollWidth>el.clientWidth+1,
          padding:[...el.querySelectorAll('.doc-static-code pre')].every(pre=>+getComputedStyle(pre).paddingLeft.replace('px','')>=16&&+getComputedStyle(pre).paddingTop.replace('px','')>=16),
          tables:[...el.querySelectorAll('table.api-table')].every(table=>!!table.closest('.doc-table-scroll')),
          errors:[...el.querySelectorAll('.diagram-error')].map(error=>error.textContent),
          nestedLinks:!!el.querySelector('a a'),
        }));
        check(!measurement.overflow,`${page} at ${width}px: page overflows horizontally`);
        check(measurement.padding,`${page}: code needs padding`);
        check(measurement.tables,`${page}: table needs its own scroll container`);
        check(!measurement.errors.length,`${page}: ${measurement.errors.join('; ')}`);
        check(!measurement.nestedLinks,`${page}: links must not contain another link`);
        results.push({page,width,...measurement});
      }
    }
    return results;
  } finally { await viewport.reset(); }
}
