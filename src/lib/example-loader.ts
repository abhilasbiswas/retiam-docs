import type { Example } from '../data/references';

/** Share example metadata across scenes while keeping it outside the entry bundle. */
export function createExampleLoader(url: string, fetcher: typeof fetch = fetch) {
  let request: Promise<Record<string, Example>> | undefined;
  return async (id: string): Promise<Example> => {
    const examples = await (request ||= fetcher(url).then(async response => {
      if (!response.ok) throw new Error(`Could not load example metadata (${response.status}).`);
      const value: unknown = await response.json();
      if (!value || typeof value !== 'object' || Array.isArray(value) || Object.entries(value).some(([key, example]) =>
        !example || typeof example !== 'object' || example.id !== key || typeof example.title !== 'string' ||
        typeof example.description !== 'string' || typeof example.source !== 'string' || typeof example.sourceHash !== 'string' ||
        !Array.isArray(example.scenes) || !Array.isArray(example.imports) || !Array.isArray(example.calls) || !Array.isArray(example.assets))) {
        throw new Error('Invalid example metadata response.');
      }
      return value as Record<string, Example>;
    }).catch(error => { request = undefined; throw error; }));
    if (!Object.hasOwn(examples, id)) throw new Error(`Unknown example: ${id}`);
    return examples[id];
  };
}
