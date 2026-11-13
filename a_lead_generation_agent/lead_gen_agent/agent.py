"""ADK entry point: `adk web` / `adk run` look for `root_agent` here."""
from dotenv import load_dotenv

load_dotenv()

from .pipeline import build_lead_gen_agent  # noqa: E402

root_agent = build_lead_gen_agent()
