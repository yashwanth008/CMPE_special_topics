import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import {
  Send,
  Sparkles,
  Sliders,
  Terminal,
  Zap,
  RotateCcw,
  Bot,
  User,
  Clock,
  Gauge,
  ShieldAlert
} from 'lucide-react';

export const ChatInterface = ({ presets = [] }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I am NanoLlama, a modern neural language model built from scratch with Rotary Position Embeddings (RoPE), SwiGLU gated activations, and RMSNorm. Ask me a question, explore how I think, or try one of the prompt presets below!'
    }
  ]);
  const [input, setInput] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are NanoLlama, a helpful AI assistant.');
  const [temperature, setTemperature] = useState(0.0);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);
  const [repetitionPenalty, setRepetitionPenalty] = useState(1.05);
  const [maxTokens, setMaxTokens] = useState(180);

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMetrics, setStreamingMetrics] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleSend = async (customPrompt = null, customSystem = null) => {
    const textToSend = customPrompt || input;
    const sysToSend = customSystem || systemPrompt;
    if (!textToSend.trim() || isStreaming) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customPrompt) setInput('');

    setIsStreaming(true);
    setStreamingMetrics({ tokens: 0, tokSec: 0, ttft: 0 });

    // Placeholder assistant message
    const assistantMsg = { role: 'assistant', content: '', lowConfidence: false };
    setMessages((prev) => [...prev, assistantMsg]);

    await api.streamChat(
      {
        prompt: textToSend,
        system: sysToSend,
        temperature,
        top_p: topP,
        top_k: topK,
        repetition_penalty: repetitionPenalty,
        max_tokens: maxTokens
      },
      (chunk) => {
        // IMPORTANT: build a brand-new message object instead of mutating the
        // existing one in place. React 18 StrictMode (enabled in main.jsx)
        // intentionally double-invokes state updater functions in development
        // to surface exactly this class of bug -- an in-place mutation like
        // `last.content += chunk.text` leaves its side effect visible to the
        // second invocation, so every streamed character got appended twice,
        // producing scrambled, duplicated text in the chat UI (e.g. "2 2 ++ 22").
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last || last.role !== 'assistant') return prev;
          const updatedLast = {
            ...last,
            content: last.content + chunk.text,
            ...(chunk.low_confidence
              ? { lowConfidence: true, avgConfidence: chunk.avg_confidence }
              : {})
          };
          return [...prev.slice(0, -1), updatedLast];
        });
        setStreamingMetrics({
          tokens: chunk.tokens_generated,
          tokSec: chunk.tokens_per_sec,
          ttft: chunk.time_to_first_token_ms
        });
      },
      (doneData) => {
        setIsStreaming(false);
        setStreamingMetrics((prev) => ({
          ...prev,
          tokens: doneData.tokens_generated,
          tokSec: doneData.tokens_per_sec,
          totalTime: doneData.total_time_sec
        }));
        if (doneData.low_confidence) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (!last || last.role !== 'assistant') return prev;
            const updatedLast = {
              ...last,
              lowConfidence: true,
              avgConfidence: doneData.avg_confidence
            };
            return [...prev.slice(0, -1), updatedLast];
          });
        }
      },
      (err) => {
        setIsStreaming(false);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `[Generation Error: ${err}]` }
        ]);
      }
    );
  };

  const handleApplyPreset = (preset) => {
    if (preset.system) setSystemPrompt(preset.system);
    setInput(preset.user);
    handleSend(preset.user, preset.system);
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat history cleared. What would you like to explore next?'
      }
    ]);
    setStreamingMetrics(null);
  };

  return (
    <div className="chat-layout">
      {/* Main Conversation Stream */}
      <div className="chat-card">
        <div className="chat-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bot size={18} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>NanoLlama Autoregressive Generation</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {streamingMetrics && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', background: 'var(--bg-tertiary)', padding: '0.25rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ color: 'var(--accent-cyan-bright)' }}>{streamingMetrics.tokSec} tok/s</span>
                <span>•</span>
                <span style={{ color: 'var(--text-muted)' }}>TTFT: {streamingMetrics.ttft}ms</span>
                <span>•</span>
                <span style={{ color: 'var(--accent-emerald)' }}>{streamingMetrics.tokens} tokens</span>
              </div>
            )}

            <button
              onClick={handleClearChat}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.map((m, idx) => {
            const isUser = m.role === 'user';
            const isLatestAssistant = !isUser && idx === messages.length - 1;

            return (
              <div key={idx} className={`message-bubble ${m.role}`}>
                <div className={`avatar ${m.role}`}>
                  {isUser ? <User size={16} /> : <Zap size={16} />}
                </div>
                <div className="bubble-content">
                  {m.lowConfidence && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#f59e0b',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.2rem 0.5rem',
                        marginBottom: '0.45rem',
                        width: 'fit-content'
                      }}
                      title="This model detected its own generated text didn't resemble real words from its training vocabulary, and abstained instead of returning corrupted output."
                    >
                      <ShieldAlert size={12} />
                      <span>OUT-OF-DISTRIBUTION — ABSTAINED (avoiding corrupted output)</span>
                    </div>
                  )}
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {m.content}
                    {isStreaming && isLatestAssistant && <span className="cursor-blink" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="chat-input-area">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="input-row"
          >
            <input
              type="text"
              className="chat-input"
              placeholder="Ask NanoLlama anything (e.g. Write a story, Explain RoPE, Fibonacci in Python)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isStreaming}
            />
            <button type="submit" className="btn-send" disabled={isStreaming || !input.trim()}>
              <Send size={15} />
              <span>Generate</span>
            </button>
          </form>
        </div>
      </div>

      {/* Generation Hyperparameters & Presets Sidebar */}
      <div className="controls-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <Sliders size={16} style={{ color: 'var(--accent-cyan)' }} />
          <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>Decoding Hyperparameters</h4>
        </div>

        {/* Temperature */}
        <div className="control-group">
          <div className="control-label">
            <span>Temperature</span>
            <span style={{ color: 'var(--accent-cyan-bright)', fontFamily: 'var(--font-mono)' }}>{temperature}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="1.5"
            step="0.05"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Top-P Nucleus */}
        <div className="control-group">
          <div className="control-label">
            <span>Top-P (Nucleus)</span>
            <span style={{ color: 'var(--accent-purple-bright)', fontFamily: 'var(--font-mono)' }}>{topP}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={topP}
            onChange={(e) => setTopP(parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Top-K */}
        <div className="control-group">
          <div className="control-label">
            <span>Top-K Filter</span>
            <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{topK}</span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Repetition Penalty */}
        <div className="control-group">
          <div className="control-label">
            <span>Repetition Penalty</span>
            <span style={{ color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{repetitionPenalty}</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="2.0"
            step="0.05"
            value={repetitionPenalty}
            onChange={(e) => setRepetitionPenalty(parseFloat(e.target.value))}
            className="slider-input"
          />
        </div>

        {/* Presets */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            Curated Prompt Presets
          </div>
          <div className="presets-grid">
            {presets.map((p) => (
              <div key={p.id} className="preset-chip" onClick={() => handleApplyPreset(p)}>
                <div className="preset-title">{p.title}</div>
                <div className="preset-desc">{p.category}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
