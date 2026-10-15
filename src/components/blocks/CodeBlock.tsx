import React, { useEffect, useMemo, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import type { CodeBlock as CodeBlockType } from '../../types';
import SymbolText from './SymbolText';

// React renders tokens below. Prism must not replace those DOM nodes on load.
Prism.manual = true;

const CodeBlock: React.FC<{ block: CodeBlockType }> = ({ block }) => {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(copyTimer.current), []);
  const language = block.language.trim().toLowerCase();
  const grammarName = ({ ts: 'typescript', js: 'javascript', sh: 'bash', shell: 'bash', html: 'markup', xml: 'markup', svg: 'markup' } as Record<string, string>)[language] || language;

  const highlighted = useMemo(() => {
    const grammar = Prism.languages[grammarName];
    if (!grammar) return block.code;
    const render = (value: string | Prism.Token | (string | Prism.Token)[], key = 'root', literal = false): React.ReactNode => {
      if (typeof value === 'string') return literal ? value : <SymbolText text={value} code />;
      if (Array.isArray(value)) return value.map((child, index) => <React.Fragment key={`${key}-${index}`}>{render(child, `${key}-${index}`, literal)}</React.Fragment>);
      return <span className={`token ${value.type}`}>{render(value.content, key, literal || ['comment', 'string', 'template-string', 'regex'].includes(value.type))}</span>;
    };
    return render(Prism.tokenize(block.code, grammar));
  }, [block.code, grammarName]);

  const handleCopy = async () => {
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopied(false);
      setCopyError(true);
    }
    copyTimer.current = setTimeout(() => { setCopied(false); setCopyError(false); }, 2000);
  };

  return (
    <div className="doc-static-code">
      <button className={`code-copy-btn ${copied ? 'success' : ''}`} onClick={() => void handleCopy()} aria-label={copied ? 'Code copied' : copyError ? 'Copy failed; select and copy the code' : 'Copy code'} title={copyError ? 'Clipboard unavailable. Select and copy the code.' : 'Copy code'}>
        {copied ? (
          <span className="material-symbols-outlined">check</span>
        ) : (
          <span className="material-symbols-outlined">content_copy</span>
        )}
      </button>
      <span className="visually-hidden" role="status">{copied ? 'Code copied.' : copyError ? 'Clipboard unavailable. Select and copy the code.' : ''}</span>
      <pre className={`language-${grammarName}`} tabIndex={0} aria-label={`${language || 'Plain text'} code`}>
        <code className={`language-${grammarName}`}>{highlighted}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
