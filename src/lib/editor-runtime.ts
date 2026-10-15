const monacoBase = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs';
let monacoRequest: Promise<Window['monaco']> | undefined;
let compilerRequest: Promise<Window['ts']> | undefined;

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); reject(new Error(`Could not load ${url}.`)); };
    document.head.appendChild(script);
  });
}

/** Editors are optional: reading documentation never waits for the external loader. */
export function loadMonaco(): Promise<Window['monaco']> {
  if (window.monaco) return Promise.resolve(window.monaco);
  return monacoRequest ||= (async () => {
    if (!window.require) await loadScript(`${monacoBase}/loader.min.js`);
    window.require.config({ paths: { vs: monacoBase } });
    await new Promise<void>((resolve, reject) => window.require(['vs/editor/editor.main'], resolve, reject));
    return window.monaco;
  })().catch(error => { monacoRequest = undefined; throw error; });
}

/** Share the installed compiler with the scene iframe and load it only for execution. */
export function loadTypeScript(): Promise<Window['ts']> {
  if (window.ts) return Promise.resolve(window.ts);
  return compilerRequest ||= loadScript(`${import.meta.env.BASE_URL}runtime/typescript.js`).then(() => {
    if (!window.ts) throw new Error('The TypeScript compiler did not initialize.');
    return window.ts;
  }).catch(error => { compilerRequest = undefined; throw error; });
}
