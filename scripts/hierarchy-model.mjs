import path from 'node:path';
import crypto from 'node:crypto';

// Resolve heritage through TypeScript symbols: aliases, generics and duplicate
// type names must point to their actual declarations, not a name-based guess.
export function buildClassHierarchy({ program, checker, api, lookup, root, ts }) {
  const nodes = new Map(), declarations = new Map(), edges = [];
  const sourcePath = node => path.relative(root, node.getSourceFile().fileName).split(path.sep).join('/');
  const key = node => `${sourcePath(node)}:${node.name?.text}`;
  for (const [source, entries] of Object.entries(api)) {
    const file = program.getSourceFile(path.join(root, source));
    if (!file) continue;
    for (const declaration of file.statements) {
      if (!ts.isClassDeclaration(declaration) && !ts.isInterfaceDeclaration(declaration)) continue;
      const entry = entries.find(entry => entry.name === declaration.name?.text && ['class', 'interface'].includes(entry.kind));
      if (!entry) continue;
      const target = lookup[entry.qualified]?.find(target => target.source === source);
      if (!target) continue;
      nodes.set(entry.id, { id: entry.id, name: entry.name, kind: entry.kind, source, url: target.url,
        abstract: !!declaration.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AbstractKeyword),
        description: entry.description, visibility: entry.visibility });
      declarations.set(key(declaration), { id: entry.id, declaration });
    }
  }
  for (const { id, declaration } of declarations.values()) {
    for (const clause of declaration.heritageClauses || []) for (const type of clause.types) {
      let symbol = checker.getSymbolAtLocation(type.expression);
      if (symbol?.flags & ts.SymbolFlags.Alias) symbol = checker.getAliasedSymbol(symbol);
      const base = symbol?.declarations?.find(node => ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node));
      const known = base && declarations.get(key(base));
      let baseId = known?.id;
      if (!baseId) {
        const identity = base ? key(base) : `${sourcePath(declaration)}:${type.expression.getText()}`;
        const entry = base && api[sourcePath(base)]?.find(entry => entry.name === base.name?.text && ['class', 'interface', 'type'].includes(entry.kind));
        const target = entry && lookup[entry.qualified]?.find(target => target.source === sourcePath(base));
        baseId = entry?.id || `external-${crypto.createHash('sha1').update(identity).digest('hex').slice(0, 12)}`;
        nodes.set(baseId, { id: baseId, name: base?.name?.text || type.expression.getText(),
          kind: base && ts.isClassDeclaration(base) ? 'class' : base && ts.isInterfaceDeclaration(base) ? 'interface' : 'type',
          source: base ? sourcePath(base) : '', url: target?.url, external: !target, abstract: false, visibility: entry?.visibility || 'public' });
      }
      const kind = clause.token === ts.SyntaxKind.ImplementsKeyword ? 'implements' : 'extends';
      if (!edges.some(edge => edge.from === baseId && edge.to === id && edge.kind === kind)) edges.push({ from: baseId, to: id, kind });
    }
  }
  return { nodes: [...nodes.values()].sort((a, b) => a.name.localeCompare(b.name) || a.source.localeCompare(b.source)), edges };
}
