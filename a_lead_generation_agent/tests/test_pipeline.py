import json
import os

from adk_testing import ScriptedLlm, call, last_text, run_agent_sync, text
from google.adk.tools import FunctionTool

from lead_gen_agent.pipeline import build_lead_gen_agent
from lead_gen_agent.tools import export_leads_csv, score_lead


def web_search(query: str) -> dict:
    """Stub search tool (replaces google_search offline)."""
    return {"results": [f"result for {query}"]}


def test_score_ignores_unsourced_signals():
    r = {"signals": [
        {"type": "funding", "description": "Series B", "source_url": "https://x.com/a"},
        {"type": "funding", "description": "rumour", "source_url": ""},
    ]}
    s = score_lead(r)
    assert s["score"] == 50 and s["verified_signal_count"] == 1 and s["top_signal"] == "Series B"


def test_score_caps_at_100_and_handles_none():
    many = {"signals": [{"type": "funding", "description": str(i), "source_url": "u"} for i in range(10)]}
    assert score_lead(many)["score"] <= 100
    assert score_lead(None)["top_signal"].startswith("No verified")


def test_csv_export_blocks_path_traversal(tmp_path, monkeypatch):
    monkeypatch.setenv("LEADGEN_OUTPUT_DIR", str(tmp_path))
    out = export_leads_csv([{"company_name": "A", "score": 1}], filename="../../evil.csv")
    assert os.path.dirname(out["path"]) == str(tmp_path)


def test_full_pipeline_offline(tmp_path, monkeypatch):
    monkeypatch.setenv("LEADGEN_OUTPUT_DIR", str(tmp_path))
    intent = {"industry": "fintech", "geography": "US", "max_leads": 2, "buyer_roles": ["CTO"]}
    leads = {"leads": [
        {"company_name": "Acme Pay", "website": "https://acme.example", "why_fit": "payments", "contact_role": "CTO"},
        {"company_name": "Bolt Ledger", "website": "https://bolt.example", "why_fit": "ledger", "contact_role": "VP Eng"},
    ]}
    research_acme = {"company_name": "Acme Pay", "summary": "Raised Series B.", "sources": ["https://n.example/1"],
                     "signals": [{"type": "funding", "description": "Series B $40M", "source_url": "https://n.example/1"}]}
    research_bolt = {"company_name": "Bolt Ledger", "summary": "Nothing notable.", "signals": [], "sources": []}

    llm = ScriptedLlm(rules=[
        ("turn a sales/BD request", [text(json.dumps(intent))]),
        ("You are the LeadFinder", [text("1. Acme Pay ... 2. Bolt Ledger ...")]),
        ("Convert the following unstructured lead list", [text(json.dumps(leads))]),
        ("Company: Acme Pay", [call("web_search", query="Acme Pay funding"), text("Acme raised Series B (https://n.example/1)")]),
        ("Company: Bolt Ledger", [text("No credible signals found.")]),
        ("research note on Acme Pay", [text(json.dumps(research_acme))]),
        ("research note on Bolt Ledger", [text(json.dumps(research_bolt))]),
        ("You are the ReportCompiler", [
            call("export_leads_csv", scored_leads=[{"company_name": "Acme Pay", "score": 50}]),
            text("# Report\n1. Acme Pay (50)\n2. Bolt Ledger (20)")]),
    ])
    agent = build_lead_gen_agent(smart_model=llm, fast_model=llm, search_tool=FunctionTool(web_search))
    events, state = run_agent_sync(agent, "Find 2 fintech leads in the US for our fraud product")

    assert state["intent"]["industry"] == "fintech"
    assert [l["company_name"] for l in state["leads"]["leads"]] == ["Acme Pay", "Bolt Ledger"]
    ranked = state["scored_leads"]
    assert [l["company_name"] for l in ranked] == ["Acme Pay", "Bolt Ledger"]
    assert ranked[0]["score"] == 50 and ranked[1]["score"] == 20
    assert "Report" in last_text(events)
    assert (tmp_path / "leads.csv").exists()
