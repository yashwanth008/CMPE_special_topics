# NanoLlama: a 505K-parameter transformer, and the two bugs that made it look dumber than it was

This is a transformer language model built entirely from scratch in PyTorch — Rotary Position Embeddings, SwiGLU gated feed-forward blocks, RMSNorm, KV-cache generation, the works — fine-tuned on a small hand-written knowledge base of AI research, coding, and math Q&A. It ships with a full chat studio, attention heatmap viewer, tokenizer inspector, and training telemetry dashboard.

It also has a debugging history worth telling, because it's more instructive than a clean success story.

## The ask, and the complaints

The original prompt: *"build a simple llm and chatbot with state of the art primitives but fit in my laptop gpu, follow CRISP-DM, and include a nice data science admin dashboard."* What followed were three rounds of "this is broken" — *"what is nanollama trained on, it's not looking good"*, then *"still giving garbage output, do a clean audit,"* then *"try it with Playwright, it's giving corrupt data."* Three complaints, and it turned out there were genuinely two separate bugs stacked on top of each other, not one.

## Bug one: a 505K-parameter model has no business being confident about novel input

At 505,728 parameters, trained purely by supervised fine-tuning on roughly forty memorized question templates with zero open-domain pretraining, training loss collapses to near zero. Feed it something genuinely out-of-vocabulary and it produces real character-soup — confidently, because the softmax is saturated from overfitting, so confidence-based guardrails don't catch it. The fix: check generated text against the model's own training vocabulary after generation, and abstain gracefully — with a visible amber "Out-of-Distribution — Abstained" badge — instead of showing corrupted text.

## Bug two: the frontend was silently doubling every streamed character

This one only surfaced by driving the actual chat UI through a browser instead of curling the API. A clean, correct backend answer was rendering on screen as "2 2 ++ 22 == 44" instead of "2 + 2 = 4." Cause: React Strict Mode double-invokes state updaters in development to catch exactly this class of bug, and the streaming handler was mutating the previous message object in place rather than creating a new one — so every streamed character landed twice. Rewritten to build a fresh message object per update. This bug, not the model, is likely what most of the "corrupt output" reports were actually seeing.

One more fix while in there: the Training & Loss tab was reading a field the API doesn't return and quietly showing hardcoded numbers (672K params, 0.89 loss). Remapped to the real values — 505,728 parameters, live per-epoch loss pulled from actual training telemetry.

## What you can actually do in it

**Chat Studio** — full generative interface: Top-P nucleus sampling, temperature, repetition penalty, curated research-prompt presets, and the abstention badge described above.

![NanoLlama Chat Studio](./screenshots/nanollama_chat_studio.png)

**Attention heatmaps** — per-layer, per-head visualization of $A = \text{softmax}(QK^T / \sqrt{d_k})$ across the multi-head self-attention stack.

![NanoLlama Attention Heatmaps](./screenshots/nanollama_attention_heatmaps.png)

**Tokenizer Studio** — interactive BPE decomposition: token IDs, byte lengths, color-coded token types.

![NanoLlama Tokenizer Studio](./screenshots/nanollama_tokenizer_studio.png)

**Training telemetry** — cross-entropy loss and perplexity curves across epochs, now wired to the real numbers.

![NanoLlama Training Curves](./screenshots/nanollama_training_curves.png)

**Architecture blueprint** — full forward-pass diagram through the RoPE multi-head attention and SwiGLU FFN blocks.

![NanoLlama Architecture](./screenshots/nanollama_architecture_blueprint.png)

## The primitives, in math

**Rotary Position Embeddings (RoPE):**

$$R_{\Theta, m}^d x_m = \begin{pmatrix} x_m^{(1)} \cos m\theta_1 - x_m^{(2)} \sin m\theta_1 \\ x_m^{(1)} \sin m\theta_1 + x_m^{(2)} \cos m\theta_1 \\ \vdots \end{pmatrix}$$

**SwiGLU activation:**

$$\text{SwiGLU}(x) = \text{Swish}(x W) \otimes (x V)$$

**RMSNorm:**

$$\bar{a}_i = \frac{a_i}{\text{RMS}(a)} g_i, \quad \text{RMS}(a) = \sqrt{\frac{1}{d} \sum_{i=1}^d a_i^2 + \epsilon}$$

## Packaged skills

`skills/` and `.agents/skills/` include `nano-llm-transformer` (full architecture pipeline), `pytorch-training-loop` (reproducible loop with mixed precision + gradient clipping), and `llm-finetuning` (SFT dataset formatting and loss optimization).

## Run it

```bash
# Backend — FastAPI, port 8002
cd server
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8002

# Frontend — Vite + React, port 5175
cd client
npm install
npm run dev   # http://localhost:5175/
```

See `VIDEO_SCRIPT.md` for the full narrated debugging walkthrough, and `screenshots/verified_walkthrough.png` for a post-fix capture confirming clean, non-doubled output in the browser.
