import React from 'react';
import katex from 'katex';

interface MarkdownMathRendererProps {
  content: string;
}

export const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({ content }) => {
  const renderFormattedText = (text: string) => {
    // Process markdown sections: headings, tables, bold, italic, code blocks, lists
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const flushTable = () => {
      if (tableBuffer.length > 0) {
        elements.push(renderTable(tableBuffer, `table-${elements.length}`));
        tableBuffer = [];
        inTable = false;
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Table row detection
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        tableBuffer.push(trimmed);
        return;
      } else if (inTable) {
        flushTable();
      }

      // Display math $$...$$
      if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
        const mathExpr = trimmed.slice(2, -2).trim();
        try {
          const html = katex.renderToString(mathExpr, { displayMode: true, throwOnError: false });
          elements.push(
            <div
              key={`math-block-${index}`}
              className="my-4 py-2 px-4 bg-slate-900/70 border border-indigo-500/20 rounded-lg overflow-x-auto text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          elements.push(
            <pre key={`math-err-${index}`} className="text-amber-400 font-mono text-sm">
              {trimmed}
            </pre>
          );
        }
        return;
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl font-bold text-indigo-300 mt-6 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-indigo-500 rounded-full inline-block" />
            {renderInlineMathAndFormatting(trimmed.replace('### ', ''))}
          </h3>
        );
        return;
      }
      if (trimmed.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${index}`} className="text-2xl font-extrabold text-white mt-8 mb-4 border-b border-indigo-500/30 pb-2">
            {renderInlineMathAndFormatting(trimmed.replace('## ', ''))}
          </h2>
        );
        return;
      }
      if (trimmed.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${index}`} className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 mb-6">
            {renderInlineMathAndFormatting(trimmed.replace('# ', ''))}
          </h1>
        );
        return;
      }

      // Lists
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        elements.push(
          <li key={`li-${index}`} className="ml-5 text-slate-300 my-1 list-disc">
            {renderInlineMathAndFormatting(trimmed.slice(2))}
          </li>
        );
        return;
      }
      if (/^\d+\.\s/.test(trimmed)) {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        if (match) {
          elements.push(
            <li key={`oli-${index}`} className="ml-5 text-slate-300 my-1 list-decimal">
              {renderInlineMathAndFormatting(match[2])}
            </li>
          );
          return;
        }
      }

      // Empty lines
      if (!trimmed) {
        elements.push(<div key={`sp-${index}`} className="h-2" />);
        return;
      }

      // Standard Paragraph
      elements.push(
        <p key={`p-${index}`} className="text-slate-300 leading-relaxed my-2">
          {renderInlineMathAndFormatting(line)}
        </p>
      );
    });

    flushTable();
    return elements;
  };

  const renderTable = (rows: string[], key: string) => {
    if (rows.length < 2) return null;
    const headerRow = rows[0].split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim());
    // rows[1] is delimiter
    const bodyRows = rows.slice(2).map(r => r.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).map(c => c.trim()));

    return (
      <div key={key} className="my-6 overflow-x-auto rounded-lg border border-slate-700/60 shadow-lg bg-slate-900/50">
        <table className="w-full text-left text-sm text-slate-300 border-collapse">
          <thead className="bg-indigo-950/40 text-indigo-200 border-b border-indigo-500/20 uppercase text-xs tracking-wider">
            <tr>
              {headerRow.map((cell, idx) => (
                <th key={idx} className="py-3 px-4 font-semibold">
                  {renderInlineMathAndFormatting(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {bodyRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="py-2.5 px-4">
                    {renderInlineMathAndFormatting(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInlineMathAndFormatting = (text: string): React.ReactNode => {
    // Splits by inline math $...$
    const parts = text.split(/(\$[^$]+\$)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const math = part.slice(1, -1);
        try {
          const html = katex.renderToString(math, { displayMode: false, throwOnError: false });
          return <span key={idx} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-1 text-indigo-200" />;
        } catch {
          return <span key={idx} className="font-mono text-amber-300">{part}</span>;
        }
      }

      // Parse bold **text** and `code`
      const subParts = part.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
      return subParts.map((sub, sIdx) => {
        if (sub.startsWith('**') && sub.endsWith('**')) {
          return <strong key={sIdx} className="font-bold text-white">{sub.slice(2, -2)}</strong>;
        }
        if (sub.startsWith('`') && sub.endsWith('`')) {
          return <code key={sIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700">{sub.slice(1, -1)}</code>;
        }
        return sub;
      });
    });
  };

  return <div className="space-y-1">{renderFormattedText(content)}</div>;
};
