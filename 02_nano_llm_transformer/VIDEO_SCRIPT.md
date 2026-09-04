# Video Walkthrough Script — NanoLlama Autoregressive SFT LLM

**Runtime target: ~3 minutes**

---

Okay, this project has a history, and I want to be honest about it on camera, because I think the debugging story is actually more interesting than if it had just worked perfectly the first time.

The original ask was: "build a simple llm and chatbot with state of the art primitives but fit in my laptop gpu, follow CRISP-DM, and include a nice data science admin dashboard." So what got built is NanoLlama — a from-scratch PyTorch transformer with Rotary Position Embeddings, SwiGLU gated activations, RMSNorm, and KV-cache generation, fine-tuned on a small hand-written knowledge base of AI research, coding, and math Q&A. But the follow-up prompts tell the real story: "what is nanollama trained on, it is not looking good," then "nano llama is still giving garbage output, do a clean audit and fix bugs," and finally "why is nano llm transformer not working, try it with Playwright, it's giving corrupt data." Three separate rounds of "this is broken." So when I picked this project up, my job was to actually find out why, not just take the existing fixes at face value.

Here's what I found. There were genuinely two separate bugs stacked on top of each other. The first: this model is only 505,000 parameters, trained purely by supervised fine-tuning on about forty memorized question templates, with no open-domain pretraining — so training loss gets driven essentially to zero. When I forced it to generate on a genuinely novel, out-of-vocabulary prompt, it produced real character-soup garbage, and it did so *confidently* — the softmax was totally saturated from the overfitting, so confidence-based safety checks don't work here at all. I fixed that by checking generated text against the model's own training vocabulary after generation, and if too much of it isn't real trained words, the model now abstains gracefully instead of showing corrupted text.

But here's the twist — that wasn't the whole story. When I actually drove the chat interface through a real browser instead of just hitting the API with curl, I found a second, much sneakier bug: even a perfectly correct, clean answer from the backend was rendering on screen as scrambled, duplicated text — things like "2 2 ++ 22 == 44" instead of "2 + 2 = 4." That one lives entirely in the React frontend. It turns out React Strict Mode — which is on by default in development — intentionally double-invokes state updater functions to catch exactly this class of bug, and the streaming chat handler was mutating the previous message object in place instead of creating a new one. So every single streamed character was getting appended twice. I rewrote it to build a fresh message object on every update. I'd bet this frontend bug is a big part of what those "corrupt data" complaints were actually seeing.

While I was in there, I also found the Training and Loss dashboard tab was quietly showing hardcoded fake numbers — 672K parameters, a 0.89 loss — because it was reading a field the API doesn't actually return. Fixed the field mapping, and now it shows the real 505,728 parameters and the real per-epoch loss curve pulled straight from training telemetry.

The architecture highlight worth calling out: this thing implements real modern LLM primitives from scratch — you can watch the multi-head attention heatmaps light up per layer in the Attention tab, and inspect exactly how the custom tokenizer breaks text into IDs in the Tokenizer Studio.

For my creative addition, I surfaced the new abstention logic directly in the chat UI — when the model catches itself about to say something incoherent, you'll now see an amber "Out-of-Distribution — Abstained" badge right on that message, so the demo is honest about what a tiny memorization-scale model can and can't do, instead of pretending it's bigger than it is.

That's NanoLlama — a real transformer built from scratch, a real debugging story, and now, actually working the way it was supposed to the whole time.
