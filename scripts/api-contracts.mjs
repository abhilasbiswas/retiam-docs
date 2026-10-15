// Structural facts complement authored API notes. Keep expressions literal:
// a direct assignment is evidence of that write, not proof of all side effects
// of the methods called from it. Never infer purity, ownership or units here.
function inlineCode(value) {
  const literal=String(value), runs=literal.match(/`+/g)||[];
  const delimiter='`'.repeat(Math.max(0,...runs.map(run=>run.length))+1);
  const padding=literal.startsWith('`')||literal.endsWith('`')?' ':'';
  return `${delimiter}${padding}${literal}${padding}${delimiter}`;
}

export function declarationContract(ts, node, source, checker) {
  const text = item => item?.getText(source).trim() || '';
  const line = item => source.getLineAndCharacterOfPosition(item.getStart(source)).line + 1;
  const contract = { declarationOnly: !node.body, parameterProperty: ts.isParameter(node) && ts.isConstructorDeclaration(node.parent) && ts.isParameterPropertyDeclaration(node,node.parent),
    async: !!node.modifiers?.some(m => m.kind === ts.SyntaxKind.AsyncKeyword),
    generator: !!node.asteriskToken,
    empty: !!node.body && ts.isBlock(node.body) && node.body.statements.length === 0,
    returns: [], yields: [], writes: [], calls: [], throws: [], guards: [], parameters: {}, variants: [] };
  const parameters = node.parameters || [];
  const includes = (item, parameter) => {
    let found = false;
    const symbol = checker?.getSymbolAtLocation(parameter.name);
    function visit(child) {
      if (ts.isIdentifier(child) && child.text === text(parameter.name) && (!checker || checker.getSymbolAtLocation(child) === symbol) &&
        !(ts.isPropertyAccessExpression(child.parent) && child.parent.name === child)) found = true;
      if (!found) ts.forEachChild(child, visit);
    }
    if (item) visit(item);
    return found;
  };
  const add = (items, item, key) => { if (!items.some(existing => key ? existing[key] === item[key] :
    Object.keys(item).filter(k=>k!=='line').every(k=>existing[k]===item[k]))) items.push(item); };
  function visit(item) {
    // Nested functions have a separate execution lifetime. Their writes/returns
    // must not be presented as immediate effects of calling the outer method.
    if (item !== node && (ts.isArrowFunction(item) || ts.isFunctionExpression(item) || ts.isFunctionDeclaration(item) ||
      ts.isMethodDeclaration(item) || ts.isGetAccessorDeclaration(item) || ts.isSetAccessorDeclaration(item) ||
      ts.isClassDeclaration(item) || ts.isClassExpression(item))) return;
    if (ts.isReturnStatement(item)) add(contract.returns, { expression: text(item.expression) || 'undefined', line: line(item) }, 'expression');
    if (ts.isYieldExpression(item)) add(contract.yields,{expression:text(item.expression)||'undefined',delegated:!!item.asteriskToken,line:line(item)});
    if (ts.isThrowStatement(item)) add(contract.throws, { expression: text(item.expression), line: line(item) }, 'expression');
    if (ts.isIfStatement(item) && (ts.isReturnStatement(item.thenStatement) || ts.isThrowStatement(item.thenStatement) ||
      ts.isBlock(item.thenStatement) && item.thenStatement.statements.length === 1 &&
      (ts.isReturnStatement(item.thenStatement.statements[0]) || ts.isThrowStatement(item.thenStatement.statements[0])))) {
      add(contract.guards, { condition: text(item.expression), action: text(item.thenStatement), line: line(item) }, 'condition');
    }
    if (ts.isBinaryExpression(item) && item.operatorToken.kind >= ts.SyntaxKind.FirstAssignment && item.operatorToken.kind <= ts.SyntaxKind.LastAssignment) {
      // Property writes are structural evidence. Do not claim that they are all
      // caller-visible: an object can be a locally constructed temporary.
      const target = text(item.left);
      if (ts.isPropertyAccessExpression(item.left) || ts.isElementAccessExpression(item.left)) add(contract.writes,
        { target, operation: text(item.operatorToken), value: text(item.right), line: line(item) });
    }
    if ((ts.isPrefixUnaryExpression(item) || ts.isPostfixUnaryExpression(item)) &&
      [ts.SyntaxKind.PlusPlusToken,ts.SyntaxKind.MinusMinusToken].includes(item.operator)) {
      const target = text(item.operand);
      if (ts.isPropertyAccessExpression(item.operand) || ts.isElementAccessExpression(item.operand)) add(contract.writes,
        {target,operation:item.operator===ts.SyntaxKind.PlusPlusToken?'++':'--',value:'',line:line(item)});
    }
    if(ts.isDeleteExpression(item)) add(contract.writes,{target:text(item.expression),operation:'delete',value:'',line:line(item)});
    if (ts.isCallExpression(item) || ts.isNewExpression(item)) {
      const target = text(item.expression);
      add(contract.calls, { target, construct: ts.isNewExpression(item), line: line(item) }, 'target');
    }
    ts.forEachChild(item, visit);
  }
  if (node.body) visit(node.body);
  if (node.initializer) contract.initializer = text(node.initializer);
  if (ts.isTypeAliasDeclaration(node)) {
    contract.definition = text(node.type);
    contract.variants = ts.isUnionTypeNode(node.type) ? node.type.types.map(text) : [];
  }
  if (ts.isEnumDeclaration(node)) contract.variants = node.members.map(member => text(member));
  if (ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) {
    contract.members = (node.members || []).filter(member => !member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword) &&
      !(member.name && ts.isPrivateIdentifier(member.name))).map(member => ({
      name: ts.isConstructorDeclaration(member) ? 'constructor' : text(member.name),
      optional: !!member.questionToken, readonly: !!member.modifiers?.some(m => m.kind === ts.SyntaxKind.ReadonlyKeyword),
    })).filter(member => member.name);
  }
  for (const parameter of parameters) {
    const name = text(parameter.name), uses = [];
    if (!ts.isIdentifier(parameter.name)) { contract.parameters[name] = []; continue; }
    function usesIn(item) {
      if (ts.isBinaryExpression(item) && item.operatorToken.kind === ts.SyntaxKind.EqualsToken && includes(item.right, parameter)) {
        const target = text(item.left);
        if (target.startsWith('this.') || target.startsWith('this[')) add(uses, { kind: 'stored', target }, 'target');
      }
      if ((ts.isCallExpression(item) || ts.isNewExpression(item)) && item.arguments?.some(arg => includes(arg, parameter))) {
        add(uses, { kind: 'passed', target: text(item.expression) }, 'target');
      }
      if (ts.isIfStatement(item) && includes(item.expression,parameter)) add(uses,{kind:'condition',target:text(item.expression)},'target');
      if (ts.isReturnStatement(item) && includes(item.expression,parameter)) add(uses,{kind:'returned',target:text(item.expression)},'target');
      if (ts.isBinaryExpression(item) && [ts.SyntaxKind.PlusToken,ts.SyntaxKind.MinusToken,ts.SyntaxKind.AsteriskToken,
        ts.SyntaxKind.SlashToken,ts.SyntaxKind.PercentToken,ts.SyntaxKind.AsteriskAsteriskToken].includes(item.operatorToken.kind) &&
        includes(item,parameter)) add(uses,{kind:'calculated',target:text(item)},'target');
      ts.forEachChild(item, usesIn);
    }
    if (node.body) usesIn(node.body);
    if (ts.isConstructorDeclaration(node) && ts.isParameterPropertyDeclaration(parameter,node)) add(uses,{kind:'stored',target:`this.${name}`},'target');
    contract.parameters[name] = uses;
  }
  return contract;
}

export function contractSummary(entry) {
  const c = entry.contract;
  if (!c) return '';
  const code = inlineCode;
  const brief = value => value.length <= 180 && !value.includes('\n');
  if (c.definition) return brief(c.definition) ? `Defines ${code(entry.name)} as ${code(c.definition)}.` : `Defines ${code(entry.name)} with the type expression shown below.`;
  if (entry.kind === 'enum') return `Named values for ${code(entry.name)}: ${c.variants.map(code).join(', ')}.`;
  if (['interface','class'].includes(entry.kind)) {
    const base = entry.bases?.length ? ` It ${entry.kind === 'interface' ? 'extends' : 'inherits or implements'} ${entry.bases.map(code).join(', ')}.` : '';
    return `${entry.kind === 'interface' ? 'Contract' : 'Implementation'} for ${code(entry.name)}, exposing ${(c.members || []).length} declared members.${base}`;
  }
  if (entry.kind === 'constant' || entry.kind === 'property' && c.declarationOnly) {
    const initial = c.initializer || entry.default;
    if (c.parameterProperty) return `Assigned from the constructor argument ${code(entry.name)}${initial!==undefined&&brief(initial)?`; defaults to ${code(initial)} when omitted`:''}.`;
    return initial !== undefined ? brief(initial) ? `Initializer for ${code(entry.qualified)}: ${code(initial)}.` : `${code(entry.qualified)} uses the initializer shown below.` :
      `${code(entry.qualified)} is a declared ${entry.signatures.some(s => /\breadonly\b/.test(s)) ? 'readonly ' : ''}member. Its type and optionality are specified below.`;
  }
  if (c.declarationOnly) return `Declares ${code(entry.qualified)} with the arguments and result below; the implementing type supplies its behavior.`;
  if (c.empty) return `${code(entry.qualified)} has an empty implementation${entry.kind==='constructor'?' body':c.generator?' body; iteration completes immediately':c.async ? ' and resolves without a value' : ' and returns no value'}.`;
  const phrases = [];
  if (c.writes.length) phrases.push(`Contains direct writes to ${[...new Set(c.writes.map(write=>write.target))].slice(0,3).map(code).join(', ')}; changes and early exits are shown below.`);
  if (c.calls.length) phrases.push(`Its ${c.async ? 'asynchronous ' : ''}body includes calls to ${c.calls.slice(0,3).map(call => code(call.target)).join(', ')}${c.calls.length > 3 ? '; further call sites are listed below' : ''}.`);
  if (c.returns.length === 1) {
    const result = c.returns[0].expression;
    phrases.push(brief(result) ? `${c.generator?'Generator completion expression':'Explicit return expression'}: ${code(result)}.` : 'The explicit return expression is listed below.');
  } else if (c.returns.length) phrases.push('Its result depends on the branch taken; return expressions and early exits are listed below.');
  if (c.throws.length) phrases.push('Contains the explicit throw statements listed below.');
  return phrases.join(' ') || `${code(entry.qualified)} executes the statements in its implementation without an explicit return expression.`;
}

export function parameterContract(parameter, entry) {
  const uses = entry.contract?.parameters?.[parameter.name] || [];
  const stored = uses.filter(use => use.kind === 'stored').map(use => inlineCode(use.target));
  const passed = uses.filter(use => use.kind === 'passed').map(use => inlineCode(use.target));
  const conditions = uses.filter(use=>use.kind==='condition').map(use=>inlineCode(use.target));
  const returned = uses.filter(use=>use.kind==='returned').map(use=>inlineCode(use.target));
  const calculations = uses.filter(use=>use.kind==='calculated').map(use=>inlineCode(use.target));
  const sentences = [];
  if (stored.length) sentences.push(`Used in assignments to ${stored.join(', ')}.`);
  if (passed.length) sentences.push(`Passed to ${passed.join(', ')}.`);
  if (conditions.length) sentences.push(`Tested in ${conditions.join(', ')}.`);
  if (returned.length) sentences.push(`Used in the return expression ${returned.join(', ')}.`);
  if (calculations.length) sentences.push(`Used in calculations including ${calculations.slice(0,3).join(', ')}.`);
  if (!sentences.length) sentences.push(entry.contract?.declarationOnly ? 'Part of the declared contract; the implementing type interprets this value.' :
    'No direct storage, call argument, conditional test or return expression was found for this parameter. Arithmetic and deferred callbacks can also use it; its declared type is shown here.');
  if (parameter.default !== undefined) sentences.push(`When omitted, defaults to ${inlineCode(parameter.default)}.`);
  else if (parameter.optional) sentences.push('May be omitted.');
  return sentences.join(' ');
}
