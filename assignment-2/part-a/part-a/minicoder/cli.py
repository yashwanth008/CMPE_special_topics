"""Command-line entry point.

    python -m minicoder "add type hints to utils.py"     # one task, then exit
    python -m minicoder                                   # interactive session
    python -m minicoder --list-tools
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from .agent import Agent
from .config import Config
from .tools.base import registry

# Importing the tool modules is what populates the registry.
from .tools import files, search, shell  # noqa: F401


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="minicoder",
        description="A small coding agent harness built on OpenRouter.",
    )
    parser.add_argument("task", nargs="*", help="The task. Omit for an interactive session.")
    parser.add_argument("-m", "--model", help="OpenRouter model id (e.g. google/gemini-2.5-flash).")
    parser.add_argument("-w", "--workspace", type=Path, default=Path.cwd(),
                        help="Directory the agent is confined to.")
    parser.add_argument("--max-turns", type=int, help="Turn limit before giving up.")
    parser.add_argument("-y", "--yes", action="store_true",
                        help="Auto-approve dangerous tools. Use in sandboxes only.")
    parser.add_argument("--no-stream", action="store_true", help="Wait for complete responses.")
    parser.add_argument("--transcript-dir", type=Path, default=Path(".minicoder"),
                        help="Where to write the JSONL session log.")
    parser.add_argument("--list-tools", action="store_true", help="Print the tool schemas and exit.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    if args.list_tools:
        for tool in registry:
            flag = "dangerous" if tool.dangerous else "safe"
            params = ", ".join(tool.schema["function"]["parameters"]["properties"])
            print(f"  {tool.name:<12} [{flag:^9}] ({params})")
            print(f"      {tool.description.splitlines()[0]}")
        return 0

    config = Config.from_env(
        model=args.model,
        workspace=args.workspace.resolve(),
        max_turns=args.max_turns,
        auto_approve=args.yes or None,
        stream=False if args.no_stream else None,
        transcript_dir=args.transcript_dir,
    )

    agent = Agent(config=config)

    banner = (
        f"minicoder  provider={agent.provider.name}  model={config.model}\n"
        f"workspace={config.workspace}  tools={len(registry)}"
    )
    print(banner, file=sys.stderr)
    if config.is_mock:
        print(
            "\033[33mno OPENROUTER_API_KEY found — running the offline mock provider\033[0m",
            file=sys.stderr,
        )

    if args.task:
        answer = agent.run(" ".join(args.task))
        print("\n" + answer)
        print("\n" + agent.transcript.summary(), file=sys.stderr)
        return 0

    # Interactive: one Agent, so context carries across turns.
    print("interactive session — ctrl-d or 'exit' to quit", file=sys.stderr)
    while True:
        try:
            task = input("\n\033[1m›\033[0m ").strip()
        except (EOFError, KeyboardInterrupt):
            print(file=sys.stderr)
            break
        if task.lower() in ("exit", "quit", ":q"):
            break
        if not task:
            continue
        try:
            print("\n" + agent.run(task))
        except Exception as exc:  # noqa: BLE001
            print(f"\033[31merror: {exc}\033[0m", file=sys.stderr)

    print(agent.transcript.summary(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
