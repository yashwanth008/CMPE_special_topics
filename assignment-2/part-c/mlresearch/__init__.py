"""mlresearch — an autoresearch harness for ML pipelines."""

from .arbiter import Arbiter, Decision, paired_t_test
from .executor import Executor, build_pipeline
from .ledger import Ledger
from .loop import AutoResearchLoop, StudyConfig, StudyReport
from .proposer import HeuristicProposer, LLMProposer
from .types import Experiment, Hypothesis, LedgerEntry, Result

__version__ = "0.1.0"
__all__ = [
    "Arbiter", "Decision", "paired_t_test", "Executor", "build_pipeline",
    "Ledger", "AutoResearchLoop", "StudyConfig", "StudyReport",
    "HeuristicProposer", "LLMProposer",
    "Experiment", "Hypothesis", "LedgerEntry", "Result",
]
