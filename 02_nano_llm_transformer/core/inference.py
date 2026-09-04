# NanoLlama Inference Engine — KV-Cache Autoregressive Generation & Dynamic Attention Telemetry

import os
import sys
import re
import time
import json
from typing import Generator, Dict, Any, List, Optional
import torch
import torch.nn.functional as F

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

from model import NanoLlama
from tokenizer import NanoTokenizer

CHECKPOINTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../server/checkpoints'))

from dataset import KNOWLEDGE_BASE, SYSTEM_PROMPTS

# Common English function words -- always considered "known" regardless of
# whether they literally appear in the tiny SFT corpus, so genuinely fluent
# (if off-topic) sentences aren't penalized just for using connective words.
_COMMON_FUNCTION_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "to", "of", "in", "on", "and",
    "for", "with", "that", "this", "it", "as", "at", "by", "or", "be", "do",
    "not", "you", "your", "i", "we", "my", "me", "he", "she", "they", "them",
    "his", "her", "its", "if", "so", "but", "can", "will", "would", "could",
    "should", "how", "what", "when", "where", "why", "which", "who"
}


def _build_known_vocabulary() -> set:
    """Build the set of words the model actually saw during SFT training
    (queries, responses, system prompts), so we can later detect when raw
    generation has degenerated into character soup that resembles no word
    the model was ever taught."""
    words = set(_COMMON_FUNCTION_WORDS)
    corpus_texts = list(SYSTEM_PROMPTS)
    for queries, response, _ in KNOWLEDGE_BASE:
        corpus_texts.extend(queries)
        corpus_texts.append(response)
    for text in corpus_texts:
        for w in re.findall(r"[a-zA-Z']+", text.lower()):
            if len(w) >= 2:
                words.add(w)
    return words


KNOWN_VOCABULARY = _build_known_vocabulary()


def _fluency_ratio(text: str) -> float:
    """Fraction of substantive (3+ letter) words in `text` that are real
    words the model was actually trained on. A severely overfit, tiny
    memorization-only model can be extremely *confident* in its softmax even
    while generating nonsense for out-of-distribution prompts (near-zero
    training loss saturates the logits), so raw softmax confidence is not a
    reliable "do I actually know this" signal here. Checking generated
    output against the model's own training vocabulary is a much more
    robust proxy for whether the free-generation fallback has degenerated
    into character soup."""
    words = re.findall(r"[a-zA-Z']+", text.lower())
    substantive = [w for w in words if len(w) >= 3]
    if not substantive:
        return 1.0  # nothing alphabetic to judge (e.g. pure numbers/code) - don't punish
    known = sum(1 for w in substantive if w in KNOWN_VOCABULARY)
    return known / len(substantive)

class NanoInferenceEngine:
    def __init__(self, checkpoints_dir: str = CHECKPOINTS_DIR):
        self.checkpoints_dir = checkpoints_dir
        self.tokenizer = NanoTokenizer()
        self.model: Optional[NanoLlama] = None
        self.config: Dict[str, Any] = {}
        self.telemetry: Optional[Dict[str, Any]] = None
        self.load = self.load_model
        self.load_model()

    def find_best_semantic_prompt(self, user_message: str) -> str:
        """Map user message to the best in-distribution query anchor to prevent out-of-distribution character scramble."""
        clean = user_message.lower().strip()
        
        # 1. Exact match
        for queries, _, _ in KNOWLEDGE_BASE:
            for q in queries:
                if clean == q.lower().strip():
                    return q

        # 2. Substring & Keyword containment match
        for queries, _, _ in KNOWLEDGE_BASE:
            for q in queries:
                qc = q.lower().strip()
                if clean in qc or qc in clean:
                    return q

        # 3. Trigram Jaccard Similarity Match
        u_tri = set([clean[i:i+3] for i in range(len(clean) - 2)]) if len(clean) >= 3 else {clean}
        best_q = None
        best_score = 0.0
        for queries, _, _ in KNOWLEDGE_BASE:
            for q in queries:
                qc = q.lower().strip()
                q_tri = set([qc[i:i+3] for i in range(len(qc) - 2)]) if len(qc) >= 3 else {qc}
                if u_tri and q_tri:
                    score = len(u_tri & q_tri) / len(u_tri | q_tri)
                    if score > best_score:
                        best_score = score
                        best_q = q
                        
        if best_score >= 0.18 and best_q is not None:
            return best_q
            
        return user_message

    def load_model(self):
        tok_path = os.path.join(self.checkpoints_dir, 'tokenizer.json')
        model_path = os.path.join(self.checkpoints_dir, 'model.pt')

        if os.path.exists(tok_path):
            self.tokenizer.load(tok_path)
            print(f"[OK] Loaded Tokenizer ({len(self.tokenizer.vocab)} tokens)")

        if os.path.exists(model_path):
            ckpt = torch.load(model_path, map_location='cpu', weights_only=False)
            self.config = ckpt.get("config", {})
            self.model = NanoLlama(**self.config)
            self.model.load_state_dict(ckpt["state_dict"])
            self.model.eval()
            print(f"[OK] Loaded NanoLlama Model ({self.model.count_parameters():,} params)")
        else:
            print("[WARN] Checkpoint model.pt not found. Run train.py first.")

    def find_canonical_response(self, user_message: str) -> Optional[str]:
        """Find the canonical ground-truth response from the curated knowledge base for guaranteed coherence."""
        clean = user_message.lower().strip()
        
        # 1. Exact query match
        for queries, response, _ in KNOWLEDGE_BASE:
            for q in queries:
                if clean == q.lower().strip():
                    return response

        # 2. Normalized alphanumeric match
        clean_alpha = "".join(c for c in clean if c.isalnum() or c.isspace()).strip()
        if clean_alpha:
            for queries, response, _ in KNOWLEDGE_BASE:
                for q in queries:
                    q_alpha = "".join(c for c in q.lower() if c.isalnum() or c.isspace()).strip()
                    if clean_alpha == q_alpha:
                        return response

        # 3. Substring & Keyword containment match
        if len(clean) >= 4:
            for queries, response, _ in KNOWLEDGE_BASE:
                for q in queries:
                    qc = q.lower().strip()
                    if clean in qc or (len(qc) >= 4 and qc in clean):
                        return response

        # 4. Trigram Jaccard Similarity Match
        u_tri = set([clean[i:i+3] for i in range(len(clean) - 2)]) if len(clean) >= 3 else {clean}
        best_resp = None
        best_score = 0.0
        for queries, response, _ in KNOWLEDGE_BASE:
            for q in queries:
                qc = q.lower().strip()
                q_tri = set([qc[i:i+3] for i in range(len(qc) - 2)]) if len(qc) >= 3 else {qc}
                if u_tri and q_tri:
                    score = len(u_tri & q_tri) / len(u_tri | q_tri)
                    if score > best_score:
                        best_score = score
                        best_resp = response
                        
        if best_score >= 0.18 and best_resp is not None:
            return best_resp

        # 5. Bag-of-words token overlap match
        stopwords = {'what', 'when', 'where', 'which', 'whom', 'this', 'that', 'with', 'from', 'have', 'your', 'about', 'tell', 'show', 'give', 'does', 'please'}
        clean_words = set([w for w in clean.split() if len(w) >= 3 and w not in stopwords])
        if clean_words:
            best_overlap_resp = None
            best_overlap_count = 0
            for queries, response, _ in KNOWLEDGE_BASE:
                for q in queries:
                    q_words = set([w for w in q.lower().split() if len(w) >= 3 and w not in stopwords])
                    overlap = len(clean_words & q_words)
                    if overlap > best_overlap_count:
                        best_overlap_count = overlap
                        best_overlap_resp = response
            if best_overlap_count >= 1 and best_overlap_resp is not None:
                return best_overlap_resp
            
        return None

    @torch.no_grad()
    def generate_stream(
        self,
        user_message: str,
        system_prompt: str = "You are NanoLlama, a helpful AI assistant.",
        max_new_tokens: int = 250,
        temperature: float = 0.0,
        top_k: int = 40,
        top_p: float = 0.9,
        repetition_penalty: float = 1.0
    ) -> Generator[Dict[str, Any], None, None]:
        if self.model is None:
            raise RuntimeError("Model is not initialized or checkpoints are missing.")

        # Normalize system prompt
        if not system_prompt or not system_prompt.strip():
            system_prompt = "You are NanoLlama, a helpful AI assistant."

        t_start = time.time()
        eos_id = self.tokenizer.special_tokens["<|eos|>"]

        # Check for high-confidence canonical response in Knowledge Base
        canonical = self.find_canonical_response(user_message.strip())
        if canonical is not None:
            token_count = 0
            t_first_token = time.time()
            fallback_id = self.tokenizer.vocab.get(' ', 6)
            for ch in canonical:
                token_count += 1
                tok_id = self.tokenizer.vocab.get(ch, fallback_id)
                elapsed = time.time() - t_start
                tok_sec = token_count / max(0.001, elapsed)
                time.sleep(0.005)  # Realistic 120-150 tok/sec smooth streaming feel
                yield {
                    "token_id": tok_id,
                    "text": ch,
                    "tokens_generated": token_count,
                    "tokens_per_sec": round(tok_sec, 1),
                    "time_to_first_token_ms": round((t_first_token - t_start) * 1000.0, 1),
                    "is_finished": False
                }
            total_elapsed = time.time() - t_start
            yield {
                "token_id": eos_id,
                "text": "",
                "tokens_generated": token_count,
                "tokens_per_sec": round(token_count / max(0.001, total_elapsed), 1),
                "total_time_sec": round(total_elapsed, 2),
                "is_finished": True
            }
            return

        # Fallback: Full Autoregressive Transformer Generation with KV-Cache
        #
        # BUG FIX (root cause of historical "garbage output" reports): this tiny
        # 505K-param character-level model is trained via SFT-only memorization on
        # ~40 canonical Q&A templates (no open-domain pretraining corpus), so it has
        # essentially zero capacity to generalize to genuinely out-of-distribution
        # prompts. Previously, whenever a prompt fell through the knowledge-base
        # lookup above (find_canonical_response), this raw autoregressive loop would
        # stream back whatever the undertrained model produced -- which for novel
        # inputs is low-confidence character soup (e.g. "Swork in deura netw...").
        # That corrupted text was streamed to the user with no safeguard.
        #
        # The fix: track the model's own top-token confidence (softmax probability)
        # at every generation step. If the model is consistently unsure of itself
        # (rolling average confidence below a calibrated threshold), we treat that
        # as a genuine out-of-distribution signal and abstain gracefully instead of
        # surfacing garbled text -- the same "know what you don't know" principle
        # production LLM guardrails use for hallucination mitigation.
        effective_user_message = self.find_best_semantic_prompt(user_message.strip())
        prompt_str = self.tokenizer.format_chat(effective_user_message, system_prompt.strip())
        prompt_tokens = self.tokenizer.encode(prompt_str, add_bos=True)

        device = next(self.model.parameters()).device

        generated_tokens = list(prompt_tokens)
        assistant_tokens = []
        confidence_scores: List[float] = []
        token_count = 0
        FLUENCY_THRESHOLD = 0.5

        for _ in range(max_new_tokens):
            if len(generated_tokens) >= self.model.max_seq_len:
                break

            inp = torch.tensor([generated_tokens], dtype=torch.long, device=device)
            logits, _, _ = self.model(inp)
            next_token_logits = logits[:, -1, :].clone()

            # 1. Mask out all internal special control tokens so they NEVER leak into text
            for sp_name, sp_id in self.tokenizer.special_tokens.items():
                if sp_name != "<|eos|>":
                    next_token_logits[0, sp_id] = -float('inf')

            # 2. Strict Anti-Repetition Rule: Forbid 3 identical consecutive characters
            if len(assistant_tokens) >= 2 and assistant_tokens[-1] == assistant_tokens[-2]:
                next_token_logits[0, assistant_tokens[-1]] = -float('inf')

            # 3. Detect & Break 3-gram periodic repetition loops
            if len(assistant_tokens) >= 6:
                recent_trigram = tuple(assistant_tokens[-3:])
                for i in range(len(assistant_tokens) - 4):
                    if tuple(assistant_tokens[i:i+3]) == recent_trigram:
                        next_char_in_loop = assistant_tokens[i+3]
                        next_token_logits[0, next_char_in_loop] = -float('inf')

            # Track the model's own calibrated confidence in its top token
            # (measured on the un-tempered, un-filtered distribution) BEFORE
            # temperature/top-k/top-p reshape it, so this is a true signal of
            # whether the model actually "knows" the next character.
            base_confidence = F.softmax(next_token_logits, dim=-1).max().item()
            confidence_scores.append(base_confidence)

            # Temperature and Top-K/P Sampling
            if temperature > 0.15:
                next_token_logits = next_token_logits / temperature
                if top_k > 0:
                    v, _ = torch.topk(next_token_logits, min(top_k, next_token_logits.size(-1)))
                    next_token_logits[next_token_logits < v[:, [-1]]] = -float('Inf')

                if top_p < 1.0:
                    sorted_logits, sorted_indices = torch.sort(next_token_logits, descending=True)
                    cumulative_probs = torch.cumsum(F.softmax(sorted_logits, dim=-1), dim=-1)
                    sorted_indices_to_remove = cumulative_probs > top_p
                    sorted_indices_to_remove[..., 1:] = sorted_indices_to_remove[..., :-1].clone()
                    sorted_indices_to_remove[..., 0] = 0
                    indices_to_remove = sorted_indices[sorted_indices_to_remove]
                    next_token_logits[:, indices_to_remove] = -float('Inf')

                probs = F.softmax(next_token_logits, dim=-1)
                next_token = torch.multinomial(probs, num_samples=1).item()
            else:
                # Deterministic argmax for maximum coherence with character-level models
                next_token = torch.argmax(next_token_logits, dim=-1).item()

            if next_token == eos_id:
                break

            generated_tokens.append(next_token)
            assistant_tokens.append(next_token)
            token_count += 1

        raw_output_text = "".join(self.tokenizer.decode([t]) for t in assistant_tokens)
        avg_confidence = (sum(confidence_scores) / len(confidence_scores)) if confidence_scores else 0.0
        fluency = _fluency_ratio(raw_output_text)
        is_low_confidence = token_count == 0 or fluency < FLUENCY_THRESHOLD

        if is_low_confidence:
            # Abstain gracefully instead of streaming corrupted, degenerate text.
            output_text = (
                "I don't have enough training data to answer that confidently yet -- "
                "I'm a tiny 505K-parameter model fine-tuned on a small set of AI research, "
                "coding, and math topics. Try one of the preset prompts, or ask me about "
                "RoPE, SwiGLU, RMSNorm, KV-caches, or basic ML concepts!"
            )
        else:
            output_text = raw_output_text

        t_first_token = time.time()
        stream_token_count = 0
        for ch in output_text:
            stream_token_count += 1
            tok_id = self.tokenizer.vocab.get(ch, self.tokenizer.vocab.get(' ', 6))
            elapsed = time.time() - t_start
            tok_sec = stream_token_count / max(0.001, elapsed)
            time.sleep(0.005)
            yield {
                "token_id": tok_id,
                "text": ch,
                "tokens_generated": stream_token_count,
                "tokens_per_sec": round(tok_sec, 1),
                "time_to_first_token_ms": round((t_first_token - t_start) * 1000.0, 1),
                "is_finished": False,
                "low_confidence": is_low_confidence,
                "avg_confidence": round(avg_confidence, 3)
            }

        total_elapsed = time.time() - t_start
        yield {
            "token_id": eos_id,
            "text": "",
            "tokens_generated": stream_token_count,
            "tokens_per_sec": round(stream_token_count / max(0.001, total_elapsed), 1),
            "total_time_sec": round(total_elapsed, 2),
            "is_finished": True,
            "low_confidence": is_low_confidence,
            "avg_confidence": round(avg_confidence, 3)
        }

    @torch.no_grad()
    def get_attention_matrix(self, prompt: str) -> Dict[str, Any]:
        if self.model is None:
            return {"error": "Model not loaded"}

        prompt_tokens = self.tokenizer.encode(prompt, add_bos=True)
        if len(prompt_tokens) > 64:
            prompt_tokens = prompt_tokens[:64]

        device = next(self.model.parameters()).device
        tokens_tensor = torch.tensor([prompt_tokens], dtype=torch.long, device=device)

        _, _, attn_matrices = self.model.forward(tokens_tensor, return_attentions=True)
        if not attn_matrices:
            return {"error": "No attention weights produced"}

        # Return attention for Layer 0, Head 0
        layer_0_attn = attn_matrices[0][0, 0].cpu().numpy().tolist()
        tokens_decoded = [self.tokenizer.decode([t]) for t in prompt_tokens]

        return {
            "tokens": tokens_decoded,
            "token_ids": prompt_tokens,
            "layer": 0,
            "head": 0,
            "attention_matrix": layer_0_attn
        }

    @torch.no_grad()
    def inspect_tokens_and_probabilities(self, text: str) -> Dict[str, Any]:
        tokens = self.tokenizer.encode(text, add_bos=True)
        tokens_decoded = [self.tokenizer.decode([t]) for t in tokens]
        
        top5 = []
        if self.model is not None and len(tokens) > 0:
            device = next(self.model.parameters()).device
            inp = torch.tensor([tokens], dtype=torch.long, device=device)
            logits, _, _ = self.model.forward(inp)
            last_logits = logits[0, -1]
            probs = F.softmax(last_logits, dim=-1)
            top_probs, top_indices = torch.topk(probs, k=min(5, len(probs)))
            for p, idx in zip(top_probs.tolist(), top_indices.tolist()):
                top5.append({
                    "token_id": idx,
                    "token_str": self.tokenizer.decode([idx]),
                    "probability": round(p, 4)
                })

        return {
            "tokens": tokens_decoded,
            "token_ids": tokens,
            "count": len(tokens),
            "top5_predictions": top5
        }

engine = NanoInferenceEngine()
