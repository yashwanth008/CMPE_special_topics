"""Configuration, resolved once from the environment and .env."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


def _load_dotenv(path: Path) -> None:
    """Minimal .env reader. No dependency, no surprises, does not override
    variables that are already set in the real environment."""
    if not path.is_file():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip().strip("'\""))


@dataclass
class Config:
    api_key: str | None = None
    base_url: str = "https://openrouter.ai/api/v1"
    model: str = "google/gemini-2.5-flash"

    # Loop control
    max_turns: int = 25
    timeout_seconds: float = 180.0

    # Context control
    context_limit_tokens: int = 100_000
    compact_at_fraction: float = 0.75
    tool_result_char_limit: int = 20_000

    # Safety
    auto_approve: bool = False
    workspace: Path = field(default_factory=Path.cwd)
    bash_timeout: int = 60

    # Output
    stream: bool = True
    transcript_dir: Path | None = None

    @property
    def is_mock(self) -> bool:
        return os.environ.get("MINICODER_MOCK") == "1" or not self.api_key

    @classmethod
    def from_env(cls, **overrides) -> "Config":
        _load_dotenv(Path.cwd() / ".env")

        cfg = cls(
            api_key=os.environ.get("OPENROUTER_API_KEY"),
            base_url=os.environ.get("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            model=os.environ.get("MINICODER_MODEL", "google/gemini-2.5-flash"),
            auto_approve=os.environ.get("AUTO_APPROVE") == "1",
        )
        if max_turns := os.environ.get("MINICODER_MAX_TURNS"):
            cfg.max_turns = int(max_turns)

        for key, value in overrides.items():
            if value is not None and hasattr(cfg, key):
                setattr(cfg, key, value)
        return cfg
