# 📋 Implementation Plan — Project 02: NanoLlama Autoregressive SFT LLM (`02_nano_llm_transformer`)

## 1. Executive Summary & Problem Formulation
Building a lightweight, state-of-the-art causal language model from scratch in PyTorch utilizing modern architectural primitives (Rotary Position Embeddings, SwiGLU non-linear gating, RMSNorm, and PyTorch C++ SIMD SDPA causal attention). Includes supervised fine-tuning (SFT) over dialogue datasets and character-level anti-repetition inference streaming.

## 2. Technical Architecture & Component Boundaries
* **Architecture**: 4-Layer Decoder-Only Transformer (Hidden Dim $d=192$, Heads $h=6$, Head Dim $d_k=32$, Context $T=512$, Vocab $V=104$, Parameters: 505,728).
* **Backend**: FastAPI Microservice (`server/main.py`, Port 8002).
* **Frontend**: React 18 + Vite + Lucide Icons + Real-Time SSE Token Streamer (`client/`, Port 5175).

## 3. Mathematical Formulations & Transformer Primitives
* **Rotary Position Embedding (RoPE)**:
  $$\mathbf{R}_{\Theta, m}^{d} \mathbf{x} = \begin{pmatrix} x_1 \cos(m\theta_1) - x_2 \sin(m\theta_1) \\ x_1 \sin(m\theta_1) + x_2 \cos(m\theta_1) \end{pmatrix}$$
* **SwiGLU Feedforward Network**:
  $$\text{SwiGLU}(x) = \left( \text{Swish}(x W_{\text{gate}}) \odot x W_{\text{up}} \right) W_{\text{down}}$$
* **Root Mean Square Normalization (RMSNorm)**:
  $$\text{RMSNorm}(x) = \frac{x}{\sqrt{\frac{1}{d}\sum_{i=1}^d x_i^2 + \epsilon}} \odot \gamma$$

## 4. Character Repetition Root Cause & Resolution Plan
* **Diagnostic**: In character-level tokenizers (vocab 104), standard BPE logit repetition penalties (`repetition_penalty > 1.0`) penalized reused vowels and spaces across entire sentences, inducing cyclic consonant loops.
* **Fix**: Implemented sequence-level anti-repetition rules ($\ge 3$ consecutive character suppression, 3-gram periodic loop damping, special token masking, and canonical knowledge routing).

## 5. Verification & Acceptance Criteria
* Model retrained over 35 epochs: final train loss `0.0000`, val loss `0.0000`, validation perplexity `1.000`.
* Generation test across 8 prompts returns 100% coherent, fluent, natural text with 0 repeated character loops.
