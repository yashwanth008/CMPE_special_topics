import React from 'react';
import { Sparkles, Code, CheckCircle, FileText, ChevronRight } from 'lucide-react';

interface MarkdownMathRendererProps {
  content: string;
  className?: string;
}

declare global {
  interface Window {
    katex?: {
      renderToString: (tex: string, options?: { displayMode?: boolean; throwOnError?: boolean }) => string;
    };
  }
}

/**
 * Renders mathematical expressions using KaTeX if available, or structured HTML math formatting.
 */
const renderMathText = (rawText: string, displayMode: boolean = false): React.ReactNode => {
  // Clean up escaped backslashes common in JSON-serialized LaTeX
  const cleanTex = rawText.trim();

  if (typeof window !== 'undefined' && window.katex) {
    try {
      const html = window.katex.renderToString(cleanTex, {
        displayMode,
        throwOnError: false,
      });
      return (
        <span
          className={displayMode ? 'block my-3 text-center overflow-x-auto py-2' : 'inline-block px-1'}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      );
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }

  // Fallback LaTeX styling
  return (
    <span
      className={`font-serif italic text-cyan-300 ${
        displayMode
          ? 'block my-3 p-3 text-center bg-slate-950/80 rounded-xl border border-cyan-500/20 overflow-x-auto tracking-wide text-sm'
          : 'inline-block px-1 font-mono text-xs bg-slate-950/50 rounded text-cyan-200'
      }`}
    >
      {cleanTex}
    </span>
  );
};

/**
 * Formats inline markup: bold, inline code, inline math $...$, italics.
 */
const formatInlineText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
  // Tokenize by inline math $...$, bold **...**, inline code `...`, italic *...*
  const regex = /(\$\$[\s\S]*?\$\$|\$[^$\n]+?\$|\*\*[^*]+?\*\*|`[^`]+?`|\*[^*]+?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('$$') && token.endsWith('$$')) {
      const tex = token.slice(2, -2);
      parts.push(<React.Fragment key={match.index}>{renderMathText(tex, true)}</React.Fragment>);
    } else if (token.startsWith('$') && token.endsWith('$')) {
      const tex = token.slice(1, -1);
      parts.push(<React.Fragment key={match.index}>{renderMathText(tex, false)}</React.Fragment>);
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-[11px]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
};

export const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into structural blocks separated by double newlines or block delimiters
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        // Block Math: $$ ... $$
        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const tex = trimmed.slice(2, -2);
          return (
            <div
              key={bIdx}
              className="my-4 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 shadow-inner overflow-x-auto text-center"
            >
              <div className="text-[10px] font-mono text-cyan-400/75 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Formal Mathematical Formulation
              </div>
              {renderMathText(tex, true)}
            </div>
          );
        }

        // Code Block: ```lang ... ```
        if (trimmed.startsWith('```') && trimmed.endsWith('```')) {
          const lines = trimmed.split('\n');
          const lang = lines[0].replace('```', '').trim() || 'python';
          const codeBody = lines.slice(1, -1).join('\n');
          return (
            <div key={bIdx} className="my-3 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-lg">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5 uppercase font-bold text-cyan-400">
                  <Code className="w-3 h-3" /> {lang}
                </span>
                <span>Audited Source</span>
              </div>
              <pre className="p-4 text-xs font-mono text-cyan-200 overflow-x-auto leading-relaxed">
                <code>{codeBody}</code>
              </pre>
            </div>
          );
        }

        // Heading 3: ### ...
        if (trimmed.startsWith('### ')) {
          return (
            <h4
              key={bIdx}
              className="text-base font-bold text-white tracking-tight pt-2 border-l-2 border-cyan-500 pl-3 mt-4"
            >
              {formatInlineText(trimmed.replace('### ', ''))}
            </h4>
          );
        }

        // Heading 2: ## ...
        if (trimmed.startsWith('## ')) {
          return (
            <h3
              key={bIdx}
              className="text-lg font-bold text-white tracking-tight pt-3 border-b border-slate-800 pb-2 mt-5"
            >
              {formatInlineText(trimmed.replace('## ', ''))}
            </h3>
          );
        }

        // Markdown Table: | col | col |
        if (trimmed.includes('|') && trimmed.split('\n').every((l) => l.trim().startsWith('|') && l.trim().endsWith('|'))) {
          const rows = trimmed.split('\n').map((r) =>
            r
              .trim()
              .slice(1, -1)
              .split('|')
              .map((c) => c.trim())
          );
          const headerRow = rows[0];
          const dataRows = rows.slice(2); // Skip separator row

          return (
            <div key={bIdx} className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-lg">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-cyan-400 font-bold uppercase text-[10px]">
                    {headerRow.map((cell, cIdx) => (
                      <th key={cIdx} className="p-3">
                        {formatInlineText(cell)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {dataRows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-3">
                          {formatInlineText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        // Ordered list: 1. ... \n 2. ...
        const lines = trimmed.split('\n');
        if (lines.length > 1 && lines.every((l) => /^\d+\.\s+/.test(l.trim()))) {
          return (
            <ol key={bIdx} className="space-y-2.5 my-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^\d+\.\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 font-mono text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {lIdx + 1}
                    </span>
                    <span className="flex-1 text-slate-300">{formatInlineText(cleanLine)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Unordered list: * ... \n * ... or - ... \n - ...
        if (lines.length > 1 && lines.every((l) => /^[-*]\s+/.test(l.trim()))) {
          return (
            <ul key={bIdx} className="space-y-2 my-2">
              {lines.map((line, lIdx) => {
                const cleanLine = line.replace(/^[-*]\s+/, '');
                return (
                  <li key={lIdx} className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-1" />
                    <span className="flex-1 text-slate-300">{formatInlineText(cleanLine)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Standard Paragraph
        return (
          <p key={bIdx} className="text-slate-300 leading-relaxed">
            {formatInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
