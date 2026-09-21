import React, { useState, useEffect } from 'react';
import { Sparkles, Search, Layers, Image as ImageIcon, FileText, CheckCircle2, Shield, RefreshCw } from 'lucide-react';

export const MultimodalFusionWorkbench: React.FC = () => {
  const [activeSubtab, setActiveSubtab] = useState<'fusion' | 'retrieval'>('fusion');
  const [loading, setLoading] = useState<boolean>(false);
  const [fusionResult, setFusionResult] = useState<any>(null);

  // Form states for Multimodal product
  const [form, setForm] = useState({
    title: 'QuantumPro Ultra-Slim Noise Cancelling Headphones',
    description: 'Ergonomic over-ear wireless acoustic headphones featuring dual hybrid active noise cancellation, 40mm beryllium drivers, titanium headband, and 48-hour continuous battery life.',
    category: 'Electronics',
    brand: 'AcoustiQ',
    condition: 'New',
    seller_rating: 4.9
  });

  // Zero-shot search states
  const [searchQuery, setSearchQuery] = useState('ergonomic titanium headphones');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const runFusionPredict = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8014/api/multimodal/predict-fusion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      setFusionResult(data);
    } catch (e) {
      console.error('Fusion error:', e);
    } finally {
      setLoading(false);
    }
  };

  const runZeroShotSearch = async () => {
    setSearchLoading(true);
    try {
      const res = await fetch('http://127.0.0.1:8014/api/multimodal/zero-shot-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    runFusionPredict();
    runZeroShotSearch();
  }, []);

  const loadPreset = (category: string) => {
    if (category === 'road_bike') {
      setForm({
        title: 'AeroSwift Carbon Fiber Road Cycling Frame',
        description: 'Ultra-lightweight aerodynamic monocoque carbon fiber road bicycle frame designed for wind tunnel efficiency, internal cable routing, and electronic shifting group integration.',
        category: 'Sports & Outdoors',
        brand: 'Veloce',
        condition: 'New',
        seller_rating: 4.8
      });
    } else if (category === 'watch') {
      setForm({
        title: 'Chronos Classic Hand-Wound Mechanical Watch',
        description: 'Swiss-made sapphire crystal dial with open-heart escapement, genuine alligator leather strap, 38-hour power reserve, and 50m water resistance.',
        category: 'Luxury Goods',
        brand: 'GenevaHorology',
        condition: 'Refurbished',
        seller_rating: 4.7
      });
    } else {
      setForm({
        title: 'QuantumPro Ultra-Slim Noise Cancelling Headphones',
        description: 'Ergonomic over-ear wireless acoustic headphones featuring dual hybrid active noise cancellation, 40mm beryllium drivers, titanium headband, and 48-hour continuous battery life.',
        category: 'Electronics',
        brand: 'AcoustiQ',
        condition: 'New',
        seller_rating: 4.9
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="glass-panel p-6 border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              AutoGluon MultiModal Deep Learning Workbench
            </h2>
            <p className="text-sm text-slate-400">
              Late-fusion transformer architecture unifying DeBERTa text tokens, ViT/CLIP vision embeddings, and structured tabular signals.
            </p>
          </div>

          {/* Subtab navigation */}
          <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
            <button
              id="subtab-multimodal-fusion"
              onClick={() => setActiveSubtab('fusion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubtab === 'fusion' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Multimodal Fusion Valuation
            </button>
            <button
              id="subtab-zero-shot-search"
              onClick={() => setActiveSubtab('retrieval')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeSubtab === 'retrieval' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Zero-Shot Cross-Modal Retrieval
            </button>
          </div>
        </div>
      </div>

      {activeSubtab === 'fusion' ? (
        /* Multimodal Fusion Predictor */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Inputs */}
          <div className="lg:col-span-5 glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h3 className="text-sm font-bold text-slate-200">Multimodal Input Ingestion</h3>
              <div className="flex gap-1.5">
                <button
                  id="preset-audio"
                  onClick={() => loadPreset('audio')}
                  className="px-2 py-0.5 bg-violet-500/20 text-violet-300 border border-violet-500/30 text-[10px] rounded hover:bg-violet-500/30 font-medium cursor-pointer"
                >
                  Headphones
                </button>
                <button
                  id="preset-bike"
                  onClick={() => loadPreset('road_bike')}
                  className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] rounded hover:bg-cyan-500/30 font-medium cursor-pointer"
                >
                  Road Bike
                </button>
                <button
                  id="preset-watch"
                  onClick={() => loadPreset('watch')}
                  className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] rounded hover:bg-amber-500/30 font-medium cursor-pointer"
                >
                  Watch
                </button>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Product Title (Text Encoder):</span>
                <input
                  id="input-product-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 font-medium"
                />
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Description (DeBERTa-v3 Tokens):</span>
                <textarea
                  id="textarea-product-desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-400 block mb-1">Category:</span>
                  <select
                    id="select-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Sports & Outdoors">Sports & Outdoors</option>
                    <option value="Luxury Goods">Luxury Goods</option>
                    <option value="Computers">Computers</option>
                    <option value="Kitchen & Home">Kitchen & Home</option>
                  </select>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Condition:</span>
                  <select
                    id="select-condition"
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                  >
                    <option value="New">New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Open Box">Open Box</option>
                    <option value="Used">Used</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Seller Rating:</span>
                  <span className="font-semibold text-violet-300">★ {form.seller_rating.toFixed(1)} / 5.0</span>
                </div>
                <input
                  id="slider-seller-rating"
                  type="range"
                  min="3.0"
                  max="5.0"
                  step="0.1"
                  value={form.seller_rating}
                  onChange={(e) => setForm({ ...form, seller_rating: parseFloat(e.target.value) })}
                  className="w-full accent-violet-500"
                />
              </div>

              <button
                id="btn-execute-multimodal-fusion"
                onClick={runFusionPredict}
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-violet-500/20 cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Compute Multimodal Fusion</span>
              </button>
            </div>
          </div>

          {/* Right Fusion Prediction Breakdown */}
          <div className="lg:col-span-7 glass-panel p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <h3 className="text-sm font-bold text-slate-200">Fused Valuation & Cross-Modal Saliency</h3>
              {fusionResult && (
                <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                  Confidence: {(fusionResult.confidence_score * 100).toFixed(1)}%
                </span>
              )}
            </div>

            {fusionResult ? (
              <div className="space-y-5">
                {/* Price Output */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/60 to-indigo-950/60 border border-violet-500/40 shadow-lg">
                  <div className="text-xs text-violet-300 uppercase tracking-wider font-semibold">
                    AutoGluon MultiModal Predicted Fair Market Valuation:
                  </div>
                  <div className="text-3xl font-black text-white mt-1">
                    ${fusionResult.predicted_valuation_usd.toLocaleString()}
                    <span className="text-xs text-slate-400 font-normal ml-2">USD Fair Value</span>
                  </div>
                </div>

                {/* Modality Attention Weights */}
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Cross-Modal Fusion Attention Weights:
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold mb-1">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Text DeBERTa</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {(fusionResult.fusion_modality_weights.text_description_deberta * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 text-violet-400 font-semibold mb-1">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Vision ViT/CLIP</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {(fusionResult.fusion_modality_weights.vision_vit_embedding * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-semibold mb-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Tabular MLP</span>
                      </div>
                      <div className="text-lg font-bold text-white">
                        {(fusionResult.fusion_modality_weights.tabular_attributes_mlp * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Text Token Saliency */}
                <div>
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    DeBERTa-v3 Natural Language Token Saliency:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {fusionResult.token_saliency.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-xs flex items-center gap-2"
                      >
                        <span className="font-mono text-cyan-300 font-semibold">{item.token}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                          +{item.saliency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
                Evaluating multimodal representations...
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Zero-Shot Cross-Modal Semantic Retrieval */
        <div className="glass-panel p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Zero-Shot Cross-Modal Semantic Catalog Search</h3>
              <p className="text-xs text-slate-400">
                Matches arbitrary natural language search queries to visual catalog assets via CLIP/DeBERTa shared latent space.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="input-zero-shot-query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search catalog e.g. titanium headphones"
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 w-64"
              />
              <button
                id="btn-search-zero-shot"
                onClick={runZeroShotSearch}
                disabled={searchLoading}
                className="px-4 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/70 p-4 rounded-xl border border-slate-800 hover:border-violet-500/40 transition-all space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">{item.product_id}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                    Sim: {(item.cosine_similarity * 100).toFixed(1)}%
                  </span>
                </div>

                <div className="font-bold text-slate-100 text-sm">{item.title}</div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">{item.category}</span>
                  <span className="font-bold text-cyan-300 font-mono">${item.price.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
