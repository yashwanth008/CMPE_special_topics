"""Tool registration.

A tool is three things at once:
  1. a JSON schema the model reads to decide whether to call it,
  2. a Python callable the harness runs,
  3. a risk classification the permission layer enforces.

Letting one decorator produce all three from a single annotated function keeps
them in sync. The most common bug in hand-rolled harnesses is a schema that no
longer matches the function it describes; this design makes that impossible.
"""

from __future__ import annotations

import inspect
from dataclasses import dataclass
from typing import Any, Callable, get_args, get_origin, get_type_hints

from ..types import ToolResult

JSON_TYPES: dict[Any, str] = {
    str: "string",
    int: "integer",
    float: "number",
    bool: "boolean",
    list: "array",
    dict: "object",
}


@dataclass
class Tool:
    name: str
    description: str
    fn: Callable[..., Any]
    schema: dict
    dangerous: bool
    # Read-only tools are safe to run concurrently; mutating ones are not.
    read_only: bool

    def run(self, **kwargs: Any) -> ToolResult:
        try:
            result = self.fn(**kwargs)
        except TypeError as exc:
            # Almost always the model passing the wrong argument names. Telling
            # it exactly what the signature is gets a correct retry.
            signature = inspect.signature(self.fn)
            return ToolResult(
                f"Error: bad arguments for {self.name}{signature}: {exc}", ok=False
            )
        except Exception as exc:  # noqa: BLE001
            return ToolResult(f"Error in {self.name}: {type(exc).__name__}: {exc}", ok=False)

        if isinstance(result, ToolResult):
            return result
        return ToolResult(str(result))


class ToolRegistry:
    def __init__(self) -> None:
        self._tools: dict[str, Tool] = {}

    def register(
        self,
        fn: Callable | None = None,
        *,
        dangerous: bool = False,
        read_only: bool = True,
    ):
        """Decorator. Derives the schema from type hints and the docstring.

        The docstring matters more than it looks: it is the only description the
        model gets, and a vague one produces a tool the model never calls or
        calls wrongly. Write them as instructions to the model, not notes to
        yourself.
        """

        def decorator(func: Callable) -> Callable:
            hints = get_type_hints(func)
            signature = inspect.signature(func)
            properties: dict[str, dict] = {}
            required: list[str] = []

            doc = inspect.getdoc(func) or ""
            param_docs = _parse_param_docs(doc)

            for param_name, param in signature.parameters.items():
                annotation = hints.get(param_name, str)
                properties[param_name] = {
                    "type": _json_type(annotation),
                    "description": param_docs.get(param_name, f"The {param_name}."),
                }
                if param.default is inspect.Parameter.empty:
                    required.append(param_name)

            tool = Tool(
                name=func.__name__,
                description=doc.split("\n\nArgs:")[0].strip(),
                fn=func,
                dangerous=dangerous,
                read_only=read_only,
                schema={
                    "type": "function",
                    "function": {
                        "name": func.__name__,
                        "description": doc.split("\n\nArgs:")[0].strip(),
                        "parameters": {
                            "type": "object",
                            "properties": properties,
                            "required": required,
                        },
                    },
                },
            )
            self._tools[func.__name__] = tool
            return func

        return decorator(fn) if fn else decorator

    # ------------------------------------------------------------------ access

    def __contains__(self, name: str) -> bool:
        return name in self._tools

    def __len__(self) -> int:
        return len(self._tools)

    def __iter__(self):
        return iter(self._tools.values())

    def get(self, name: str) -> Tool | None:
        return self._tools.get(name)

    def names(self) -> list[str]:
        return sorted(self._tools)

    def schemas(self) -> list[dict]:
        """Exactly what goes into the `tools` field of the request."""
        return [tool.schema for tool in self._tools.values()]

    def subset(self, names: list[str]) -> "ToolRegistry":
        """A registry with only some tools -- how you build a read-only agent or
        a restricted subagent without forking the tool code."""
        clone = ToolRegistry()
        for name in names:
            if tool := self._tools.get(name):
                clone._tools[name] = tool
        return clone


def _json_type(annotation: Any) -> str:
    if annotation in JSON_TYPES:
        return JSON_TYPES[annotation]
    origin = get_origin(annotation)
    if origin in JSON_TYPES:
        return JSON_TYPES[origin]
    if origin is not None:  # Optional[X] / X | None
        args = [a for a in get_args(annotation) if a is not type(None)]
        if args:
            return _json_type(args[0])
    return "string"


def _parse_param_docs(doc: str) -> dict[str, str]:
    """Pull `Args:` entries out of a Google-style docstring so each parameter
    gets its own description in the schema."""
    if "Args:" not in doc:
        return {}
    out: dict[str, str] = {}
    for line in doc.split("Args:", 1)[1].splitlines():
        line = line.strip()
        if not line or line.endswith(":"):
            continue
        if ":" in line:
            key, _, value = line.partition(":")
            out[key.strip()] = value.strip()
    return out


# The registry every tool module attaches to.
registry = ToolRegistry()
