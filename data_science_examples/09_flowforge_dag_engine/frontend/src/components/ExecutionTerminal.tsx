import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types/domain';
import { Terminal, Trash2, CheckCircle2, AlertTriangle, Info, AlertCircle } from 'lucide-react';

interface ExecutionTerminalProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const ExecutionTerminal: React.FC<ExecutionTerminalProps> = ({
  logs,
  onClearLogs,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />;
      case 'success':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />;
      case 'warn':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />;
      case 'error':
        return <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />;
    }
  };

  const getLogColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return 'text-slate-300';
      case 'success':
        return 'text-emerald-300 font-semibold';
      case 'warn':
        return 'text-amber-300';
      case 'error':
        return 'text-rose-300 font-semibold';
    }
  };

  return (
    <div className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/90 overflow-hidden flex flex-col h-[280px] shadow-lg">
      {/* Header */}
      <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-wide">Live Execution SSE Stream</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {logs.length} events
          </span>
        </div>

        <button
          onClick={onClearLogs}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Clear Terminal Logs"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Log Feed */}
      <div
        ref={scrollRef}
        className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-1.5 scroll-smooth"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic text-center py-10">
            Waiting for DAG execution trigger... Click "Execute DAG" above.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 leading-relaxed hover:bg-slate-900/40 px-1.5 py-0.5 rounded">
              <span className="text-slate-500 shrink-0 select-none">[{log.timestamp}]</span>
              {getLogIcon(log.level)}
              {log.nodeId && (
                <span className="text-indigo-400 font-bold shrink-0">
                  [{log.nodeId}]
                </span>
              )}
              <span className={`break-words ${getLogColor(log.level)}`}>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
