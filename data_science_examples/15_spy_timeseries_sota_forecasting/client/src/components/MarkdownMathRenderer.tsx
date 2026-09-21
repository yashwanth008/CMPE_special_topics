import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    renderMathInElement?: (el: HTMLElement, options?: any) => void;
    mermaid?: any;
  }
}

interface MarkdownMathRendererProps {
  content: string;
  className?: string;
}

export const MarkdownMathRenderer: React.FC<MarkdownMathRendererProps> = ({ content, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && window.renderMathInElement) {
      window.renderMathInElement(containerRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }, [content]);

  // Convert markdown headings, lists, bold, codeblocks into clean HTML
  const formatMarkdown = (text: string) => {
    let formatted = text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-emerald-400 mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-extrabold text-cyan-300 mt-6 mb-3 pb-1 border-b border-slate-700">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-white mt-8 mb-4">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-emerald-300 font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-slate-300 italic">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-xs border border-slate-700">$1</code>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc text-slate-300 my-1">$1</li>')
      .replace(/\n\n/g, '<p class="my-3 text-slate-300 leading-relaxed"></p>');

    return formatted;
  };

  return (
    <div
      ref={containerRef}
      className={`prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
    />
  );
};
