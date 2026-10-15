import fs from 'node:fs';

const check = (condition, message) => { if (!condition) throw new Error(message); };

export async function checkDocsHierarchy(tab, viewport, baseUrl = 'http://127.0.0.1:4174') {
  const index = JSON.parse(fs.readFileSync(new URL('../src/data/generated/class-hierarchy.json', import.meta.url), 'utf8'));
  const type = name => index.nodes.find(node => node.name === name);
  const focus = tab.playwright.getByLabel('Focus on a type', { exact: true });
  const graph = tab.playwright.locator('.hierarchy-diagram');
  const rendered = async name => {
    await graph.getByRole('link', { name: `Explore ${name}`, exact: true }).waitFor({ state: 'attached', timeoutMs: 20000 });
    check(await graph.locator('.node.focus').textContent({ timeoutMs: 1000 }) === name, `The focused type must be ${name}.`);
    check(!await graph.locator('.diagram-error').count(), 'The hierarchy must render without Mermaid errors.');
  };
  try {
    await viewport.set({ width: 1440, height: 1000 });
    await tab.goto(`${baseUrl}/class-hierarchy#explorer`);
    await rendered('Entity');
    check(await graph.locator('a[data-api-href]').count() === await graph.locator('.node:not(.junction)').count(), 'Every indexed node needs its exact API link.');
    await tab.playwright.getByLabel('Find a type', { exact: true }).fill('circle');
    check(await focus.locator('option').count() < 15, 'Type search must narrow the picker.');
    await focus.selectOption(type('Circle').id);
    await rendered('Circle');
    for (const name of ['Entity','VectorEntity']) check(await graph.getByRole('link', { name: `Explore ${name}`, exact: true }).count() === 1, `${name} must remain as ancestor context.`);
    check(await graph.getByRole('link', { name: 'Explore Circle', exact: true }).getAttribute('data-api-href') === type('Circle').url, 'Circle must link to its own API declaration.');
    await graph.getByRole('link', { name: 'Explore Circle', exact: true }).click();
    await tab.playwright.getByRole('link', { name: 'View Circle in the class hierarchy', exact: true }).waitFor({ state: 'visible', timeoutMs: 10000 });
    await tab.playwright.getByRole('link', { name: 'View Circle in the class hierarchy', exact: true }).click();
    await rendered('Circle');
    check(await focus.evaluate(el => el.value) === type('Circle').id, 'The API link must focus the requested type.');

    await tab.goto(`${baseUrl}/class-hierarchy?type=IPlugin#explorer`);
    await rendered('IPlugin');
    const contract = tab.playwright.getByRole('checkbox', { name: 'Show implementations', exact: true });
    check(await contract.evaluate(el => el.checked) && !await contract.isEnabled(), 'Interface roots must show their implementations.');
    check(await graph.getByRole('link', { name: 'Explore AudioPlugin', exact: true }).count() === 1, 'IPlugin needs the AudioPlugin implementation.');

    await tab.goto(`${baseUrl}/class-hierarchy?type=Animation#explorer`);
    await rendered('Animation');
    const direct = await graph.locator('.node').count();
    await tab.playwright.getByLabel('Descendant levels', { exact: true }).selectOption('all');
    await graph.getByRole('link', { name: 'Explore Create', exact: true }).waitFor({ state: 'attached', timeoutMs: 20000 });
    check(await graph.locator('.node').count() > direct, 'All levels must include deeper animation branches.');
    check(!await graph.locator('.diagram-toolbar,.diagram-hint,[role="tablist"]').count(), 'The canvas must have no toolbar or footer.');
    const canvas = graph.getByRole('region', { name: 'Class hierarchy canvas', exact: true });
    await canvas.press('+');
    check(Number(await canvas.getAttribute('data-zoom')) === 1.25, 'Keyboard zoom must respond.');
    await graph.getByRole('button', { name: 'Reset diagram view', exact: true }).click();
    check(Number(await canvas.getAttribute('data-zoom')) === 1, 'Reset must restore the initial zoom.');
    check(await canvas.evaluate(el => el.clientHeight) >= 700, 'Large hierarchies need a taller canvas.');
    await graph.getByRole('button', { name: 'Expand diagram', exact: true }).click();
    await tab.playwright.getByRole('dialog', { name: 'Expanded diagram', exact: true }).waitFor({ state: 'visible', timeoutMs: 3000 });
    await tab.playwright.getByRole('button', { name: 'Close expanded diagram', exact: true }).click();
    await tab.playwright.getByRole('dialog', { name: 'Expanded diagram', exact: true }).waitFor({ state: 'hidden', timeoutMs: 3000 });
    await rendered('Animation');

    await viewport.set({ width: 390, height: 844 });
    await graph.getByRole('button', { name: 'Expand diagram', exact: true }).click();
    await tab.playwright.getByRole('dialog', { name: 'Expanded diagram', exact: true }).waitFor({ state: 'visible', timeoutMs: 3000 });
    check(await tab.playwright.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'The mobile hierarchy must not overflow the document.');
    await tab.playwright.getByRole('button', { name: 'Close expanded diagram', exact: true }).click();
    await tab.playwright.getByRole('button', { name: 'Toggle theme', exact: true }).click();
    await rendered('Animation');
    check(await tab.playwright.evaluate(() => document.documentElement.getAttribute('data-theme')) === 'light', 'The hierarchy must render in the light theme.');
    await tab.goto(`${baseUrl}/class-hierarchy?type=Scene#explorer`);
    await rendered('Scene');
    check(await graph.locator('.node').count() === 1, 'A standalone class must still render.');
    return { sourceLinks:true, focusAndSearch:true, ancestorContext:true, apiRoundTrip:true, interfaces:true, depth:true, zoom:true, expandedView:true, minimalCanvas:true, reset:true, mobileOverflow:false, lightTheme:true, standaloneTypes:true };
  } finally { await viewport.reset(); }
}
