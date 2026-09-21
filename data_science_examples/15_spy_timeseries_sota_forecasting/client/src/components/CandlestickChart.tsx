import React, { useState, useEffect } from 'react';
import { BarChart2, Eye, Calendar, Layers, ShieldCheck, Activity } from 'lucide-react';
import { OHLCVBar } from '../types/spy';

export const CandlestickChart: React.FC = () => {
  const [bars, setBars] = useState<OHLCVBar[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hoveredBar, setHoveredBar] = useState<OHLCVBar | null>(null);
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showBB, setShowBB] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://127.0.0.1:8015/api/data/ohlcv')
      .then((res) => res.json())
      .then((data) => {
        setBars(data.bars || []);
        if (data.bars && data.bars.length > 0) {
          setHoveredBar(data.bars[data.bars.length - 1]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('OHLCV fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-12 text-center text-slate-400 font-mono text-xs">
        Loading 6-Month SPY Historical Market &amp; Macro Feeds...
      </div>
    );
  }

  // Calculate scaling for SVG
  const minPrice = Math.min(...bars.map((b) => b.low)) * 0.99;
  const maxPrice = Math.max(...bars.map((b) => b.high)) * 1.01;
  const maxVol = Math.max(...bars.map((b) => b.volume));

  const chartHeight = 280;
  const volHeight = 70;
  const chartWidth = 900;
  const barWidth = chartWidth / bars.length;

  const getY = (price: number) => chartHeight - ((price - minPrice) / (maxPrice - minPrice)) * (chartHeight - 30);
  const getVolY = (vol: number) => volHeight - (vol / maxVol) * (volHeight - 10);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="glass-panel p-6 border-slate-700/60 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-heading font-extrabold text-white">SPY 6-Month Technical Charting Studio</h2>
              <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                126 Daily Trading Bars
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Zero-leakage training split (First 105 bars) vs Out-of-Sample Forward Test split (Last 21 bars).
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs text-slate-300 font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={showEMA}
                onChange={(e) => setShowEMA(e.target.checked)}
                className="accent-cyan-400"
              />
              EMA 21/50
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-300 font-mono cursor-pointer">
              <input
                type="checkbox"
                checked={showBB}
                onChange={(e) => setShowBB(e.target.checked)}
                className="accent-emerald-400"
              />
              Bollinger Bands (20,2)
            </label>
          </div>
        </div>
      </div>

      {/* Active Bar Inspection Card */}
      {hoveredBar && (
        <div className="glass-panel p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 border-emerald-500/30">
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Date</div>
            <div className="text-xs font-bold font-mono text-white">{hoveredBar.timestamp}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Open</div>
            <div className="text-xs font-bold font-mono text-slate-200">${hoveredBar.open.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">High</div>
            <div className="text-xs font-bold font-mono text-emerald-400">${hoveredBar.high.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Low</div>
            <div className="text-xs font-bold font-mono text-rose-400">${hoveredBar.low.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Close</div>
            <div className={`text-xs font-bold font-mono ${hoveredBar.close >= hoveredBar.open ? 'text-emerald-400' : 'text-rose-400'}`}>
              ${hoveredBar.close.toFixed(2)}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">Volume</div>
            <div className="text-xs font-bold font-mono text-cyan-300">{(hoveredBar.volume / 1_000_000).toFixed(1)}M</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">CBOE VIX</div>
            <div className="text-xs font-bold font-mono text-amber-400">{hoveredBar.vix_close.toFixed(2)}</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-mono uppercase">10Y Yield</div>
            <div className="text-xs font-bold font-mono text-purple-400">{hoveredBar.tnx_yield.toFixed(3)}%</div>
          </div>
        </div>
      )}

      {/* Candlestick SVG Container */}
      <div className="glass-panel p-5 overflow-x-auto">
        <div className="min-w-[900px]">
          
          {/* Main Price Canvas */}
          <div className="h-[290px] w-full bg-slate-950/70 rounded-t-xl border border-slate-800 p-2 relative">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
              
              {/* Horizontal Price Grid */}
              {[0.2, 0.4, 0.6, 0.8].map((ratio) => {
                const p = minPrice + ratio * (maxPrice - minPrice);
                return (
                  <g key={ratio}>
                    <line x1="0" y1={getY(p)} x2={chartWidth} y2={getY(p)} stroke="#1e293b" strokeDasharray="3,3" />
                    <text x="10" y={getY(p) - 4} fill="#475569" fontSize="9" fontFamily="monospace">
                      ${p.toFixed(2)}
                    </text>
                  </g>
                );
              })}

              {/* Train vs Test Split Demarcation (Bar index 105) */}
              <line
                x1={105 * barWidth}
                y1="0"
                x2={105 * barWidth}
                y2={chartHeight}
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
              <rect x={105 * barWidth - 85} y="10" width="80" height="20" rx="4" fill="#064e3b" fillOpacity="0.8" />
              <text x={105 * barWidth - 45} y="24" fill="#6ee7b7" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                Train (5-Mo)
              </text>
              <rect x={105 * barWidth + 5} y="10" width="80" height="20" rx="4" fill="#0c4a6e" fillOpacity="0.8" />
              <text x={105 * barWidth + 45} y="24" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
                Test (1-Mo)
              </text>

              {/* Bollinger Bands Shading */}
              {showBB && (
                <path
                  d={
                    `M 0 ${getY(bars[0].bb_upper || bars[0].close)} ` +
                    bars.map((b, i) => `L ${i * barWidth + barWidth/2} ${getY(b.bb_upper || b.close)}`).join(' ') +
                    bars.slice().reverse().map((b, i) => `L ${(bars.length - 1 - i) * barWidth + barWidth/2} ${getY(b.bb_lower || b.close)}`).join(' ') +
                    ' Z'
                  }
                  fill="rgba(16, 185, 129, 0.06)"
                  stroke="rgba(16, 185, 129, 0.3)"
                  strokeWidth="1"
                />
              )}

              {/* EMA 21 (Cyan) */}
              {showEMA && (
                <path
                  d={`M 0 ${getY(bars[0].ema_21 || bars[0].close)} ` + bars.map((b, i) => `L ${i * barWidth + barWidth/2} ${getY(b.ema_21 || b.close)}`).join(' ')}
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="1.5"
                />
              )}

              {/* EMA 50 (Purple) */}
              {showEMA && (
                <path
                  d={`M 0 ${getY(bars[0].ema_50 || bars[0].close)} ` + bars.map((b, i) => `L ${i * barWidth + barWidth/2} ${getY(b.ema_50 || b.close)}`).join(' ')}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="1.5"
                />
              )}

              {/* Candlestick Bars */}
              {bars.map((bar, i) => {
                const isBullish = bar.close >= bar.open;
                const x = i * barWidth + barWidth / 2;
                const candleX = i * barWidth + barWidth * 0.15;
                const candleW = Math.max(2, barWidth * 0.7);
                const openY = getY(bar.open);
                const closeY = getY(bar.close);
                const topY = Math.min(openY, closeY);
                const bodyH = Math.max(1.5, Math.abs(openY - closeY));
                const highY = getY(bar.high);
                const lowY = getY(bar.low);

                return (
                  <g
                    key={bar.timestamp}
                    onMouseEnter={() => setHoveredBar(bar)}
                    className="cursor-pointer group"
                  >
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={highY}
                      x2={x}
                      y2={lowY}
                      stroke={isBullish ? '#34d399' : '#f87171'}
                      strokeWidth="1.2"
                    />

                    {/* Candle Body */}
                    <rect
                      x={candleX}
                      y={topY}
                      width={candleW}
                      height={bodyH}
                      fill={isBullish ? '#10b981' : '#ef4444'}
                      rx="1"
                      className="group-hover:stroke-white group-hover:stroke-1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Volume Sub-Chart */}
          <div className="h-[80px] w-full bg-slate-950/90 rounded-b-xl border-x border-b border-slate-800 p-2 relative">
            <svg viewBox={`0 0 ${chartWidth} ${volHeight}`} className="w-full h-full">
              {bars.map((bar, i) => {
                const isBullish = bar.close >= bar.open;
                const candleX = i * barWidth + barWidth * 0.15;
                const candleW = Math.max(2, barWidth * 0.7);
                const vY = getVolY(bar.volume);
                const vH = volHeight - vY;

                return (
                  <rect
                    key={bar.timestamp}
                    x={candleX}
                    y={vY}
                    width={candleW}
                    height={vH}
                    fill={isBullish ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'}
                    rx="1"
                  />
                );
              })}
            </svg>
          </div>

        </div>
      </div>

    </div>
  );
};
