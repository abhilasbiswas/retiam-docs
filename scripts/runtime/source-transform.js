// Shared by the build and the editor so edited examples behave like originals.
// TypeScript is supplied by the caller; this module has no Node dependencies.
export const isDocsAsset = value => /^\/(?:res|fonts|vendor|assets|src\/assets\/fonts)\//.test(value);

export function inspectRuntimeSource(ts, code, fileName = 'scene.ts') {
  const source = ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);
  const assets = new Set(), localUrls = new Set(), nodeImports = new Set();
  let tts = false;
  function visit(node) {
    if (ts.isStringLiteralLike(node)) {
      if (isDocsAsset(node.text)) assets.add(node.text);
      if (/^https?:\/\//i.test(node.text)) {
        try {
          const host = new URL(node.text).hostname.toLowerCase().replace(/\.$/, '');
          if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal') ||
            /^(?:127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host) ||
            /^\[(?:::1|::|f[cd][\da-f:]*|fe80:[\da-f:]*)\]$/i.test(host)) localUrls.add(node.text);
        } catch { /* Non-URL example text is not a service dependency. */ }
      }
    }
    const specifier = (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) ? node.moduleSpecifier
      : ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword ? node.arguments[0] : undefined;
    if (specifier && ts.isStringLiteralLike(specifier) && !node.importClause?.isTypeOnly && !node.isTypeOnly) {
      if (specifier.text === 'retiam/tts' || /(?:^|\/)libs\/tts(?:\/index)?$/.test(specifier.text)) {
        // Captions can use frozen local audio and do not need speech synthesis.
        const bindings = node.importClause?.namedBindings;
        const captionsOnly = bindings && ts.isNamedImports(bindings) && bindings.elements.every(element =>
          element.isTypeOnly || ['Subtitles', 'SUBTITLE_PRESETS'].includes((element.propertyName || element.name).text));
        if (!captionsOnly) tts = true;
      }
      if (/^(?:node:|msedge-tts$|module$|fs$|path$|child_process$)/.test(specifier.text)) nodeImports.add(specifier.text);
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  const services = tts ? ['msedgeEndpoint'] : [];
  return { assets: [...assets], services, localUrls: [...localUrls], nodeImports: [...nodeImports], tts };
}

export function runtimeSourceTransformer(ts, { assetModule, resolveImport = specifier => specifier }) {
  return context => source => {
    const f = context.factory;
    const assetFunction = f.createUniqueName('__docsAssetUrl');
    let usesAssets = false;
    function visit(node) {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteralLike(node.moduleSpecifier)) {
        const specifier = f.createStringLiteral(resolveImport(node.moduleSpecifier.text));
        return ts.isImportDeclaration(node)
          ? f.updateImportDeclaration(node, node.modifiers, node.importClause, specifier, node.attributes)
          : f.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, specifier, node.attributes);
      }
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments[0] && ts.isStringLiteralLike(node.arguments[0])) {
        return f.updateCallExpression(node, node.expression, node.typeArguments, [f.createStringLiteral(resolveImport(node.arguments[0].text)), ...node.arguments.slice(1)]);
      }
      if (ts.isTemplateExpression(node) && isDocsAsset(node.head.text)) {
        usesAssets = true;
        return f.createCallExpression(assetFunction, undefined, [ts.visitEachChild(node, visit, context)]);
      }
      if (ts.isStringLiteralLike(node) && isDocsAsset(node.text)) {
        // String property names, module declarations and literal types are syntax,
        // rather than URL values. Leave those unchanged.
        if (node.parent && (node.parent.name === node || ts.isLiteralTypeNode(node.parent))) return node;
        usesAssets = true;
        return f.createCallExpression(assetFunction, undefined, [f.createStringLiteral(node.text)]);
      }
      return ts.visitEachChild(node, visit, context);
    }
    const transformed = ts.visitNode(source, visit);
    if (!usesAssets) return transformed;
    const helper = f.createImportDeclaration(undefined, f.createImportClause(false, undefined,
      f.createNamedImports([f.createImportSpecifier(false, f.createIdentifier('docsAssetUrl'), assetFunction)])), f.createStringLiteral(assetModule));
    return f.updateSourceFile(transformed, [helper, ...transformed.statements]);
  };
}

export function isLoopbackOrigin(origin) {
  try {
    const url = new URL(origin), host = url.hostname.toLowerCase().replace(/\.$/, '');
    return ['http:', 'https:'].includes(url.protocol) && (host === 'localhost' || host.endsWith('.localhost') || /^127\./.test(host) || host === '[::1]');
  } catch { return false; }
}

export function runtimeRequirements(metadata, services = {}, { allowLocalServices = false } = {}) {
  const reasons = [];
  for (const service of metadata.services || []) {
    if (services[service]) continue;
    reasons.push('Live speech needs a Microsoft Edge TTS backend. Configure services.msedgeEndpoint in content/config.json (or RETIAM_DOCS_MSEDGE_ENDPOINT), then rebuild the documentation.');
  }
  if (metadata.localUrls?.length && !allowLocalServices) reasons.push(`This example uses a local service: ${metadata.localUrls.join(', ')}. Edit the source to use a reachable HTTPS service, or run the example in your local development project.`);
  if (metadata.nodeImports?.length) reasons.push(`This example imports Node-only modules (${metadata.nodeImports.join(', ')}). Run it in the local Retiam development project.`);
  return reasons;
}
