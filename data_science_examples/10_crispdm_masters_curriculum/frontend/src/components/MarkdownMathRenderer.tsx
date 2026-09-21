import React from 'react';
import { Sparkles, Code, ChevronRight } from 'lucide-react';

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

const renderMathText = (rawText: string, displayMode: boolean = false): React.ReactNode => {
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

  return (
    <span
      className={`font-serif italic text-blue-300 ${
        displayMode
          ? 'block my-3 p-3 text-center bg-slate-950/80 rounded-xl border border-blue-500/20 overflow-x-auto tracking-wide text-sm'
          : 'inline-block px-1 font-mono text-xs bg-slate-950/50 rounded text-blue-200'
      }`}
    >
      {cleanTex}
    </span>
  );
};

const formatInlineText = (text: string): React.ReactNode[] => {
  const parts: React.ReactNode[] = [];
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
          className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-blue-300 font-mono text-[11px]"
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
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-3 text-xs text-slate-300 leading-relaxed ${className}`}>
      {rawBlocks.map((block, bIdx) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
          const tex = trimmed.slice(2, -2);
          return (
            <div
              key={bIdx}
              className="my-3 p-3.5 rounded-xl bg-slate-950/90 border border-blue-500/30 shadow-inner overflow-x-auto text-center"
            >
              <div className="text-[10px] font-mono text-blue-400/75 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                <Sparkles className="w-3 h-3 text-blue-400" /> Formal Mathematical Derivation
              </div>
              {renderMathText(tex, true)}
            </div>
          );
        }

        return (
          <p key={bIdx} className="text-slate-300 leading-relaxed">
            {formatInlineText(trimmed)}
          </p>
        );
      })}
    </div>
  );
};
