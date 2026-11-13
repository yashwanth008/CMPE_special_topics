from dotenv import load_dotenv

load_dotenv()
from .pipeline import build_review_assistant  # noqa: E402

root_agent = build_review_assistant()
