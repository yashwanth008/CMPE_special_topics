"""Pydantic contracts passed between pipeline stages (stored in session state)."""
from typing import Literal
from pydantic import BaseModel, Field

SignalType = Literal["funding", "hiring", "product_launch", "leadership_change", "expansion", "partnership", "other"]


class SearchIntent(BaseModel):
    """Structured version of the user's free-text ask."""
    industry: str = Field(description="Target industry / vertical.")
    geography: str = Field(default="any", description="Target region or 'any'.")
    company_size: str = Field(default="any", description="e.g. 'startup', '50-200 employees', 'enterprise'.")
    buyer_roles: list[str] = Field(default_factory=list, description="Job titles to reach.")
    pain_points: list[str] = Field(default_factory=list, description="Problems the seller solves.")
    max_leads: int = Field(default=5, ge=1, le=15, description="How many leads to return.")


class Lead(BaseModel):
    company_name: str
    website: str = ""
    why_fit: str = Field(description="One sentence on why this company matches the intent.")
    contact_role: str = ""


class LeadList(BaseModel):
    leads: list[Lead]


class Signal(BaseModel):
    type: SignalType
    description: str
    source_url: str = ""


class LeadResearch(BaseModel):
    company_name: str
    summary: str
    signals: list[Signal] = Field(default_factory=list)
    sources: list[str] = Field(default_factory=list)
