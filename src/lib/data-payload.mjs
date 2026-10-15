// Keep generated files normalized on disk and reconstruct the public viewer
// models at the fetch boundary. This module is shared by Node and the browser.
// A versioned format makes a stale or incompatible deployment fail explicitly.
const contractColumns = {
  returns: ['expression', 'line'],
  yields: ['expression', 'delegated', 'line'],
  writes: ['target', 'operation', 'value', 'line'],
  calls: ['target', 'construct', 'line'],
  throws: ['expression', 'line'],
  guards: ['condition', 'action', 'line'],
  members: ['name', 'optional', 'readonly'],
};
const inheritedColumns = ['name', 'declaredBy', 'url', 'visibility'];
const parameterUseColumns = ['kind', 'target'];
const searchColumns = ['pageId', 'sectionId', 'heading', 'snippet', 'type', 'tutorial', 'category'];

function packRows(rows, columns) {
  return rows.map(row => {
    for (const field of Object.keys(row)) {
      if (!columns.includes(field)) throw new Error(`Unmapped documentation payload field: ${field}`);
    }
    const values = columns.map(column => row[column]);
    // JSON encodes interior undefined values as null. Trailing optional fields
    // can be omitted entirely; the decoder restores only fields that existed.
    while (values.length && values.at(-1) === undefined) values.pop();
    return values;
  });
}

function unpackRows(rows, columns) {
  return rows.map(row => Object.fromEntries(columns.flatMap((column, index) =>
    index < row.length && row[index] !== null ? [[column, row[index]]] : [])));
}

function mapContract(contract, transform) {
  const result = { ...contract };
  for (const [field, columns] of Object.entries(contractColumns)) {
    if (result[field]) result[field] = transform(result[field], columns);
  }
  if (result.parameters) result.parameters = Object.fromEntries(Object.entries(result.parameters)
    .map(([name, uses]) => [name, transform(uses, parameterUseColumns)]));
  return result;
}

export function compactApiEntries(entries) {
  const common = {};
  for (const field of ['source', 'entryPoints', 'guides']) {
    if (entries.length && entries[0][field] !== undefined && entries.every(entry =>
      JSON.stringify(entry[field]) === JSON.stringify(entries[0][field]))) common[field] = entries[0][field];
  }
  return { format: 'api-v1', common, entries: entries.map(entry => {
    const result = { ...entry };
    for (const field of Object.keys(common)) delete result[field];
    if (result.inherited) result.inherited = packRows(result.inherited, inheritedColumns);
    if (result.contract) result.contract = mapContract(result.contract, packRows);
    return result;
  }) };
}

export function expandApiEntries(payload) {
  if (payload?.format !== 'api-v1' || !Array.isArray(payload.entries) || !payload.common) {
    throw new Error('Unsupported API reference format. Reload the documentation.');
  }
  return payload.entries.map(entry => ({ ...payload.common, ...entry,
    ...(entry.inherited ? { inherited: unpackRows(entry.inherited, inheritedColumns) } : {}),
    ...(entry.contract ? { contract: mapContract(entry.contract, unpackRows) } : {}),
  }));
}

export function compactSearchRecords(records) {
  const pages = {};
  for (const { pageId, title, group } of records) {
    if (Object.hasOwn(pages, pageId) && (pages[pageId].title !== title || pages[pageId].group !== group)) {
      throw new Error(`Inconsistent search metadata for page: ${pageId}`);
    }
    // Define own data properties even when a future page uses a prototype name.
    Object.defineProperty(pages, pageId, { value: { title, group }, enumerable: true, configurable: true });
  }
  return { format: 'search-v1', pages, records: packRows(records.map(({ title: _title, group: _group, ...record }) => record), searchColumns) };
}

export function expandSearchRecords(payload) {
  if (payload?.format !== 'search-v1' || !Array.isArray(payload.records) || !payload.pages) {
    throw new Error('Unsupported search index format. Reload the documentation.');
  }
  return unpackRows(payload.records, searchColumns).map(record => {
    if (!Object.hasOwn(payload.pages, record.pageId)) throw new Error('Missing search page metadata.');
    return { ...payload.pages[record.pageId], ...record };
  });
}
