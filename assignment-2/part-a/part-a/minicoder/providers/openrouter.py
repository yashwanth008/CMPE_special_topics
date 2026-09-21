"""The OpenRouter provider.

OpenRouter is an OpenAI-compatible gateway in front of ~everything: Gemini,
DeepSeek, Qwen, Llama, GPT, Claude. One key, one base URL, one payload shape,
and the model becomes a string you can change at runtime -- which is exactly
what a harness wants.
"""

from __future__ import annotations

import json
import time
from typing import Callable, Iterator

import httpx

from ..config import Config
from ..types import Completion, Message
from .base import accumulate_stream, parse_openai_message, parse_usage


class OpenRouterProvider:
    name = "openrouter"

    def __init__(self, config: Config) -> None:
        self.config = config
        self._client = httpx.Client(
            timeout=httpx.Timeout(config.timeout_seconds, connect=15.0),
            headers={
                "Authorization": f"Bearer {config.api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://github.com/your-username/harness-from-scratch",
                "X-Title": "minicoder",
            },
        )

    # ------------------------------------------------------------------ public

    def complete(
        self,
        messages: list[Message],
        tools: list[dict] | None = None,
        stream: bool = False,
        on_text: Callable[[str], None] | None = None,
    ) -> Completion:
        payload = {
            "model": self.config.model,
            "messages": [m.to_wire() for m in messages],
        }
        if tools:
            payload["tools"] = tools
            payload["tool_choice"] = "auto"
        if stream:
            payload["stream"] = True
            payload["stream_options"] = {"include_usage": True}

        if stream:
            return self._complete_streaming(payload, on_text)
        return self._complete_blocking(payload)

    # ---------------------------------------------------------------- internals

    def _post(self, payload: dict, stream: bool = False):
        """POST with retries. 429 and 5xx are normal operating conditions for a
        gateway, not exceptions -- the harness should ride them out."""
        url = f"{self.config.base_url}/chat/completions"
        last_error: Exception | None = None

        for attempt in range(4):
            try:
                if stream:
                    return self._client.stream("POST", url, json=payload)
                response = self._client.post(url, json=payload)
                if response.status_code in (429, 500, 502, 503, 504):
                    raise httpx.HTTPStatusError(
                        f"retryable {response.status_code}",
                        request=response.request,
                        response=response,
                    )
                response.raise_for_status()
                return response
            except (httpx.HTTPStatusError, httpx.TransportError) as exc:
                last_error = exc
                status = getattr(getattr(exc, "response", None), "status_code", None)
                if status is not None and status not in (429, 500, 502, 503, 504):
                    detail = exc.response.text[:400]
                    raise RuntimeError(f"OpenRouter error {status}: {detail}") from exc
                time.sleep(2**attempt)  # 1s, 2s, 4s

        raise RuntimeError(f"OpenRouter unreachable after retries: {last_error}")

    def _complete_blocking(self, payload: dict) -> Completion:
        body = self._post(payload).json()

        if "error" in body and not body.get("choices"):
            raise RuntimeError(f"OpenRouter error: {body['error']}")

        choice = body["choices"][0]
        return Completion(
            message=parse_openai_message(choice["message"]),
            finish_reason=choice.get("finish_reason") or "stop",
            model=body.get("model", self.config.model),
            usage=parse_usage(body.get("usage")),
        )

    def _complete_streaming(
        self, payload: dict, on_text: Callable[[str], None] | None
    ) -> Completion:
        def chunks() -> Iterator[dict]:
            with self._post(payload, stream=True) as response:
                response.raise_for_status()
                for line in response.iter_lines():
                    if not line or not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data.strip() == "[DONE]":
                        return
                    try:
                        chunk = json.loads(data)
                    except json.JSONDecodeError:
                        continue

                    # Echo text to the caller as it arrives, so the user sees
                    # the model thinking instead of a frozen terminal.
                    if on_text:
                        for choice in chunk.get("choices", []):
                            piece = choice.get("delta", {}).get("content")
                            if piece:
                                on_text(piece)
                    yield chunk

        raw, finish_reason, usage = accumulate_stream(chunks())
        return Completion(
            message=parse_openai_message(raw),
            finish_reason=finish_reason,
            model=self.config.model,
            usage=usage,
        )

    def close(self) -> None:
        self._client.close()
