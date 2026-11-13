INTENT_PROMPT = """You turn a sales/BD request into a structured search intent.
Extract industry, geography, company size, buyer roles, pain points and how many leads
are wanted (default 5, never more than 15). If something is unspecified use 'any' or an
empty list - never invent constraints the user did not state.
Reply ONLY with JSON matching the schema."""

FINDER_PROMPT = """You are the LeadFinder. Using web search, find real companies that match this intent:

{intent}

Find up to `max_leads` distinct companies. For each give: company name, website,
one sentence on why it fits, and the most relevant buyer role. Prefer companies with
verifiable web presence; do not fabricate companies or URLs. Output a plain-text list."""

FORMATTER_PROMPT = """Convert the following unstructured lead list into the required JSON schema.
Drop duplicates. Keep at most the requested number of leads.

{raw_leads}"""

RESEARCHER_PROMPT = """You are a lead researcher. Using web search, look for RECENT buying signals for:

Company: {company}
Website: {website}
Why it matched: {why_fit}

Look for funding rounds, hiring surges, product launches, leadership changes, expansions
and partnerships. Report each signal with a one-line description and a source URL.
If you find nothing credible, say so plainly - do not invent signals."""

RESEARCH_FORMATTER_PROMPT = """Convert this research note on {company} into the required JSON schema.
Only include signals that have a source URL in the note.

{note}"""

REPORT_PROMPT = """You are the ReportCompiler. Write a concise lead-generation report in markdown.

User intent:
{intent}

Scored leads (highest first, JSON):
{scored_leads}

Format: a ranked table (rank, company, score, top signal, contact role) followed by one short
paragraph per lead explaining the score and a suggested outreach angle. List sources at the end.
Only use facts present in the data above. Then call export_leads_csv to save the table."""
