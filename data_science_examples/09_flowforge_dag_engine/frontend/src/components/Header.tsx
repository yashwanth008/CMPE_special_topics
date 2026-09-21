import React from 'react';
import { Play, RotateCcw, ShieldCheck, Layers, Activity } from 'lucide-react';
import { EngineState } from '../types/domain';

interface HeaderProps {
  engineState: EngineState;
  onExecute: () => void;
  onReset: () => void;
  selectedTemplate: string;
  onSelectTemplate: (t: string) => void;
  activeTab: 'canvas' | 'ts-lab' | 'arch';
  setActiveTab: (tab: 'canvas' | 'ts-lab' | 'arch') => void;
}

export const Header: React.FC<HeaderProps> = ({
  engineState,
  onExecute,
  onReset,
  selectedTemplate,
  onSelectTemplate,
  activeTab,
  setActiveTab,
}) => {
  const isRunning = engineState === 'running' || engineState === 'compiling' || engineState === 'validating';

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white">FlowForge</h1>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Pocock Architecture
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Type-Safe Autonomous Workflow DAG Orchestrator
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('canvas')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'canvas'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            DAG Canvas
          </button>
          <button
            onClick={() => setActiveTab('ts-lab')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'ts-lab'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            TypeScript Lab
          </button>
          <button
            onClick={() => setActiveTab('arch')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'arch'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Architecture
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <select
            value={selectedTemplate}
            onChange={(e) => onSelectTemplate(e.target.value)}
            disabled={isRunning}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
          >
            <option value="cloud_incident">Cloud Incident DAG (5 Nodes)</option>
            <option value="kaggle_automl">AutoML Stacking DAG (5 Nodes)</option>
            <option value="rag_inference">RAG + NanoLlama Flow (5 Nodes)</option>
          </select>

          <button
            onClick={onExecute}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isRunning ? (
              <>
                <Activity className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute DAG</span>
              </>
            )}
          </button>

          <button
            onClick={onReset}
            disabled={isRunning}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-50 transition-colors"
            title="Reset Workflow"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
