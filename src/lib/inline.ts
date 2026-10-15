export type InlineToken =
  | { type: 'text' | 'code' | 'math'; text: string }
  | { type: 'break' }
  | { type: 'strong' | 'em'; children: InlineToken[] }
  | { type: 'link'; url: string; children: InlineToken[] };

function closing(text: string, start: number, delimiter: string): number {
  for (let i = start; i < text.length; i++) {
    if (text[i] === '\\') { i++; continue; }
    if (text.startsWith(delimiter, i)) return i;
  }
  return -1;
}

/** Inline authoring syntax, with nested formatting and balanced link destinations. */
export function parseInline(text: string, depth = 0): InlineToken[] {
  if (depth > 16) return [{ type: 'text', text }];
  const tokens: InlineToken[] = [];
  const plain = (value: string) => {
    const last = tokens.at(-1);
    if (last?.type === 'text') last.text += value;
    else tokens.push({ type: 'text', text: value });
  };
  for (let i = 0; i < text.length;) {
    if (text[i] === '\\' && /[\\`*_[\]()$]/.test(text[i + 1] || '')) {
      plain(text[i + 1]); i += 2; continue;
    }
    if (text[i] === '`') {
      const delimiter = text.slice(i).match(/^`+/)![0];
      const end = text.indexOf(delimiter, i + delimiter.length);
      if (end >= 0) {
        tokens.push({ type: 'code', text: text.slice(i + delimiter.length, end).replace(/\n/g, ' ') });
        i = end + delimiter.length; continue;
      }
    }
    if (text[i] === '[') {
      let labelEnd = i + 1, brackets = 1;
      for (; labelEnd < text.length; labelEnd++) {
        if (text[labelEnd] === '\\') { labelEnd++; continue; }
        if (text[labelEnd] === '[') brackets++;
        if (text[labelEnd] === ']' && --brackets === 0) break;
      }
      if (brackets === 0 && text[labelEnd + 1] === '(') {
        let end = labelEnd + 2, parentheses = 1;
        for (; end < text.length; end++) {
          if (text[end] === '\\') { end++; continue; }
          if (text[end] === '(') parentheses++;
          if (text[end] === ')' && --parentheses === 0) break;
        }
        const url = text.slice(labelEnd + 2, end).trim().replace(/^<(.+)>$/, '$1');
        if (parentheses === 0 && url && !/\s/.test(url)) {
          tokens.push({ type: 'link', url, children: parseInline(text.slice(i + 1, labelEnd), depth + 1) });
          i = end + 1; continue;
        }
      }
    }
    const double = text.slice(i, i + 2);
    const delimiter = double === '**' || double === '__' ? double : text[i];
    if ((delimiter === '**' || delimiter === '__' || delimiter === '*' || delimiter === '_') &&
        !/\s/.test(text[i + delimiter.length] || ' ') &&
        !(delimiter.includes('_') && /\w/.test(text[i - 1] || ''))) {
      const end = closing(text, i + delimiter.length, delimiter);
      if (end > i + delimiter.length && !/\s/.test(text[end - 1]) &&
          !(delimiter.includes('_') && /\w/.test(text[end + delimiter.length] || ''))) {
        tokens.push({ type: delimiter.length === 2 ? 'strong' : 'em', children: parseInline(text.slice(i + delimiter.length, end), depth + 1) });
        i = end + delimiter.length; continue;
      }
    }
    if (text[i] === '$') {
      const end = closing(text, i + 1, '$');
      if (end > i + 1) {
        tokens.push({ type: 'math', text: text.slice(i + 1, end) });
        i = end + 1; continue;
      }
    }
    // Imported notebook prose uses these simple breaks; other HTML stays literal.
    const lineBreak = text.slice(i).match(/^<br\s*\/?\s*>/i);
    if (lineBreak) { tokens.push({ type: 'break' }); i += lineBreak[0].length; continue; }
    plain(text[i++]);
  }
  return tokens;
}
