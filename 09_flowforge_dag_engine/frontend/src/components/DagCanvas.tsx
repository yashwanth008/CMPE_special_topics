import React from 'react';
import { WorkflowNode, NodeId } from '../types/domain';
import {
  Radio,
  Sliders,
  Cpu,
  GitBranch,
  Send,
  Workflow,
  CheckCircle2,
  AlertCircle,
  Clock,
  Loader2,
} from 'lucide-react';

interface DagCanvasProps {
  nodes: WorkflowNode[];
  selectedNodeId: NodeId | null;
  onSelectNode: (nodeId: NodeId) => void;
}

export const DagCanvas: React.FC<DagCanvasProps> = ({
  nodes,
  selectedNodeId,
  onSelectNode,
}) => {
  const getNodeIcon = (kind: WorkflowNode['kind']) => {
    switch (kind) {
      case 'trigger':
        return <Radio className="w-4 h-4 text-emerald-400" />;
      case 'transform':
        return <Sliders className="w-4 h-4 text-amber-400" />;
      case 'inference':
        return <Cpu className="w-4 h-4 text-indigo-400" />;
      case 'condition':
        return <GitBranch className="w-4 h-4 text-purple-400" />;
      case 'action':
        return <Send className="w-4 h-4 text-cyan-400" />;
      case 'join':
        return <Workflow className="w-4 h-4 text-pink-400" />;
    }
  };

  const getNodeStatusBadge = (status: WorkflowNode['status']) => {
    switch (status) {
      case 'pending':
        return <span className="text-[10px] text-slate-500 font-mono">PENDING</span>;
      case 'running':
        return (
          <span className="flex items-center gap-1 text-[10px] text-indigo-400 font-mono">
            <Loader2 className="w-3 h-3 animate-spin" /> RUNNING
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
            <CheckCircle2 className="w-3 h-3" /> DONE
          </span>
        );
      case 'failed':
        return (
          <span className="flex items-center gap-1 text-[10px] text-rose-400 font-mono">
            <AlertCircle className="w-3 h-3" /> FAILED
          </span>
        );
      case 'skipped':
        return <span className="text-[10px] text-slate-600 font-mono">SKIPPED</span>;
    }
  };

  // Compute Kahn's topological concurrency level for each node so the
  // canvas can visibly label which nodes are eligible to run in parallel.
  const nodeLevels = React.useMemo(() => {
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    });
    nodes.forEach((n) => {
      n.dependencies.forEach((dep) => {
        adj.get(dep)?.push(n.id);
        inDegree.set(n.id, (inDegree.get(n.id) || 0) + 1);
      });
    });
    const levels = new Map<string, number>();
    let queue = nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id);
    queue.forEach((id) => levels.set(id, 0));
    const degrees = new Map(inDegree);
    while (queue.length) {
      const next: string[] = [];
      queue.forEach((id) => {
        (adj.get(id) || []).forEach((child) => {
          degrees.set(child, (degrees.get(child) || 0) - 1);
          levels.set(child, Math.max(levels.get(child) ?? 0, (levels.get(id) ?? 0) + 1));
          if (degrees.get(child) === 0) next.push(child);
        });
      });
      queue = next;
    }
    return levels;
  }, [nodes]);

  // Render SVG Edges
  const renderEdges = () => {
    const edges: JSX.Element[] = [];

    nodes.forEach((targetNode) => {
      targetNode.dependencies.forEach((sourceId) => {
        const sourceNode = nodes.find((n) => n.id === sourceId);
        if (!sourceNode) return;

        const x1 = sourceNode.position.x + 220; // right of source card
        const y1 = sourceNode.position.y + 45; // center vertical
        const x2 = targetNode.position.x; // left of target card
        const y2 = targetNode.position.y + 45;

        // Cubic bezier control points
        const dx = Math.abs(x2 - x1) * 0.5;
        const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

        const isSourceDone = sourceNode.status === 'completed';
        const isTargetRunning = targetNode.status === 'running';

        edges.push(
          <g key={`${sourceId}->${targetNode.id}`}>
            {/* Background Glow */}
            <path
              d={path}
              fill="none"
              stroke={isTargetRunning ? '#818cf8' : isSourceDone ? '#10b981' : '#334155'}
              strokeWidth={isTargetRunning ? 3 : 2}
              className={isTargetRunning ? 'edge-animated opacity-90' : 'opacity-40'}
            />
          </g>
        );
      });
    });

    return edges;
  };

  return (
    <div className="relative w-full h-[520px] bg-slate-950/60 rounded-2xl border border-slate-800/80 overflow-hidden shadow-inner flex flex-col justify-between">
      {/* Background Dot Grid */}
      <div
        className="absolute inset-0 opacity-[0.15] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* SVG Canvas for Topological Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        {renderEdges()}
      </svg>

      {/* Interactive Node Cards */}
      <div className="relative w-full h-full p-6">
        {nodes.map((node) => {
          const isSelected = selectedNodeId === node.id;
          const isRunning = node.status === 'running';
          const isDone = node.status === 'completed';
          const isFailed = node.status === 'failed';

          let borderStyle = 'border-slate-800 hover:border-slate-700 bg-slate-900/80';
          if (isSelected) borderStyle = 'border-indigo-500 bg-slate-900 shadow-lg shadow-indigo-500/20';
          if (isRunning) borderStyle = 'border-indigo-400 bg-slate-900 node-running';
          if (isDone) borderStyle = 'border-emerald-500/50 bg-slate-900/90';
          if (isFailed) borderStyle = 'border-rose-500/50 bg-slate-900/90';

          return (
            <div
              key={node.id}
              onClick={() => onSelectNode(node.id)}
              style={{
                position: 'absolute',
                left: `${node.position.x}px`,
                top: `${node.position.y}px`,
                width: '220px',
              }}
              className={`p-3.5 rounded-xl border backdrop-blur-md cursor-pointer transition-all duration-200 select-none ${borderStyle}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-slate-800/80">{getNodeIcon(node.kind)}</div>
                  <span className="text-xs font-bold text-white tracking-tight truncate max-w-[110px]">
                    {node.title}
                  </span>
                </div>
                {getNodeStatusBadge(node.status)}
              </div>

              {/* Node ID & Latency */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                <span className="font-mono text-slate-400 truncate max-w-[70px]">{node.id}</span>
                <span
                  className="font-mono text-indigo-300/90 bg-indigo-500/10 border border-indigo-500/20 rounded px-1.5 py-0.5 text-[10px]"
                  title="Kahn's topological concurrency level"
                >
                  L{nodeLevels.get(node.id) ?? 0}
                </span>
                {node.latency_ms !== undefined && (
                  <span className="flex items-center gap-1 text-slate-300 font-mono">
                    <Clock className="w-2.5 h-2.5 text-slate-500" />
                    {node.latency_ms}ms
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DAG Legend */}
      <div className="relative z-10 px-4 py-2 border-t border-slate-800/60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Trigger
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Transform
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Inference
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400"></span> Condition
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Action
          </span>
        </div>
        <span className="font-mono text-slate-500">Kahn's Topological DAG Canvas</span>
      </div>
    </div>
  );
};
