"""minicoder — a coding agent harness built from scratch on OpenRouter."""

from .agent import Agent
from .config import Config
from .tools.base import registry
from .types import Message, ToolCall, ToolResult

__version__ = "0.1.0"
__all__ = ["Agent", "Config", "registry", "Message", "ToolCall", "ToolResult"]
