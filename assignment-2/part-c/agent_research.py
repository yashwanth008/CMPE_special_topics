#!/usr/bin/env python3
"""The Part A agent, driving the Part C autoresearch loop.

This is the integration: the harness from Part A, with the autoresearch tools
from Part C registered into its tool registry. The agent decides what to study
and what the results mean; the loop owns the statistical protocol.

    python3 agent_research.py                       # offline mock provider
    python3 agent_research.py --real                 # needs OPENROUTER_API_KEY
    python3 agent_research.py "study the wine dataset with 15 experiments"

With no key the mock provider drives a scripted but genuine sequence -- load,
inspect the space, run, inspect the ledger, report -- and every tool call does
real work: real model fits, a real ledger, a real report on disk. Only the
*choice* of what to call next is scripted.
"""

from __future__ import annotations

import sys
from pathlib import Path

PART_A = Path(__file__).resolve().parents[1] / "part-a"
sys.path.insert(0, str(PART_A))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from minicoder.agent import Agent  # noqa: E402
from minicoder.config import Config  # noqa: E402
from minicoder.tools.base import ToolRegistry  # noqa: E402
from minicoder.types import Completion, Message, ToolCall, Usage  # noqa: E402

from mlresearch.plugin import register  # noqa: E402

SYSTEM_PROMPT = """You are an ML research agent with an autoresearch harness.

Your workflow:
1. research_load_dataset — load data and split off the held-out set.
2. research_search_space — see what pipelines may be proposed.
3. research_run_study — run the loop (this costs real compute).
4. research_inspect_ledger — read WHY things were accepted or rejected. Pay
   attention to the 'inconclusive' entries: those are the experiments a greedy
   loop would have promoted on noise.
5. research_write_report — produce the write-up.

When you report a result, always give the held-out score alongside the
validation score. A validation score that was selected over many trials is
optimistically biased; the held-out score is the one that estimates
generalisation. If they differ substantially, say so plainly.

You are working in: {workspace}
"""


class ScriptedResearchProvider:
    """Offline provider that drives a complete, genuine research session.

    Each step issues a real tool call; only the ordering is scripted. This is
    how the integration is demonstrated without an API key -- the work is real,
    the decision-making is canned.
    """

    name = "scripted-research"

    def __init__(self, dataset: str = "breast_cancer", budget: int = 12) -> None:
        self.plan = [
            ("research_load_dataset", {"name": dataset, "holdout_fraction": 0.25}),
            ("research_search_space", {}),
            ("research_set_protocol", {"alpha": 0.05, "min_effect": 0.002}),
            ("research_run_study", {"budget": budget, "seed": 0, "name": f"agent-{dataset}"}),
            ("research_inspect_ledger", {"verdict": "accepted", "limit": 5}),
            ("research_inspect_ledger", {"verdict": "inconclusive", "limit": 5}),
            ("research_write_report", {}),
        ]
        self.step = 0

    def complete(self, messages, tools=None, stream=False, on_text=None) -> Completion:
        if self.step < len(self.plan):
            name, args = self.plan[self.step]
            self.step += 1
            return Completion(
                message=Message(
                    role="assistant",
                    content=None,
                    tool_calls=[ToolCall(id=f"call_{self.step}", name=name, arguments=args)],
                ),
                finish_reason="tool_calls",
                model=self.name,
                usage=Usage(),
            )

        # Summarise from the actual tool results in the transcript.
        results = [m.text for m in messages if m.role == "tool"]
        study = next((r for r in results if "SELECTED" in r), "")
        selected = next((line.strip() for line in study.splitlines()
                         if line.startswith("SELECTED")), "(no pipeline accepted)")

        return Completion(
            message=Message(
                role="assistant",
                content=(
                    "Research session complete.\n\n"
                    f"{selected}\n\n"
                    "The report, the trace figure and the full ledger are on disk. "
                    "Both selection rules' held-out scores are in the report, so the "
                    "cost of the statistical gate is visible rather than asserted.\n\n"
                    "(This summary came from the scripted offline provider; the tool "
                    "calls above did real work. Set OPENROUTER_API_KEY and pass --real "
                    "to have a model drive the session.)"
                ),
            ),
            finish_reason="stop",
            model=self.name,
            usage=Usage(),
        )


def main() -> int:
    use_real = "--real" in sys.argv
    argv = [a for a in sys.argv[1:] if a != "--real"]
    task = " ".join(argv) or (
        "Study the breast_cancer dataset: run an autoresearch study with 12 "
        "experiments, inspect why things were accepted or rejected, and write the report."
    )

    # A research agent gets research tools plus read-only file access -- it has
    # no reason to run shell commands, and registry.subset() from Part A is how
    # that restriction is expressed.
    registry = ToolRegistry()
    register(registry)

    from minicoder.tools import files  # noqa: F401  (registers file tools)
    from minicoder.tools.base import registry as default_registry

    for tool_name in ("read_file", "list_dir"):
        if tool := default_registry.get(tool_name):
            registry._tools[tool_name] = tool

    config = Config.from_env(
        workspace=Path.cwd(), auto_approve=True, stream=False, max_turns=20,
        transcript_dir=Path("runs/transcripts"),
    )

    if use_real and not config.is_mock:
        provider = None  # Agent builds the OpenRouter provider itself
        print(f"driving with {config.model} via OpenRouter", file=sys.stderr)
    else:
        if use_real:
            print("no OPENROUTER_API_KEY found — using the scripted offline provider",
                  file=sys.stderr)
        provider = ScriptedResearchProvider()

    agent = Agent(
        config=config, provider=provider, tools=registry, system_prompt=SYSTEM_PROMPT
    )

    print(f"tools: {', '.join(registry.names())}\n", file=sys.stderr)
    answer = agent.run(task)

    print("\n" + "=" * 70)
    print(answer)
    print("=" * 70)
    print(agent.transcript.summary(), file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
