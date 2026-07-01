from __future__ import annotations

from typing import Literal

from pydantic import BaseModel


class QuoteLine(BaseModel):
    code: str
    label: str
    basis_type: str
    quantity: float | int | None = None
    unit: str
    commercial_unit_price: float | None = None
    subtotal: float | None = None
    owner_decision_required: bool = False


class QuoteBlocker(BaseModel):
    code: str
    message: str


class QuoteOwnerDecision(BaseModel):
    code: str
    label: str
    detail: str
    line_code: str | None = None
    status: Literal["pending", "approved", "rejected"] = "pending"
    selected_value: str | None = None
    resolution_notes: str | None = None


class QuoteOwnerDecisionUpdate(BaseModel):
    code: str
    label: str
    detail: str
    line_code: str | None = None
    status: Literal["pending", "approved", "rejected"]
    selected_value: str | None = None
    resolution_notes: str | None = None


class QuoteLinePrice(BaseModel):
    line_code: str
    unit_price: float
    currency: str = "RON"
    notes: str | None = None


class QuoteLinePriceUpdate(BaseModel):
    line_code: str
    unit_price: float
    currency: str = "RON"
    notes: str | None = None


class QuotePreviewResponse(BaseModel):
    workspace_id: str
    workspace_title: str
    client_name: str
    status: str
    existing_quote_id: str | None = None
    existing_quote_code: str | None = None
    subtotal_net: float | None = None
    vat_rate: float = 0.19
    vat_amount: float | None = None
    total_gross: float | None = None
    currency: str = "RON"
    lines: list[QuoteLine]
    blockers: list[QuoteBlocker]
    owner_decisions: list[QuoteOwnerDecision]
    warnings: list[str]


class CommercialQuoteRecord(BaseModel):
    id: str
    quote_code: str
    workspace_id: str
    workspace_title: str
    client_name: str
    status: Literal["priced"]
    subtotal_net: float
    vat_rate: float = 0.19
    vat_amount: float
    total_gross: float
    currency: str = "RON"
    lines: list[QuoteLine]


class CreateCommercialQuoteResponse(BaseModel):
    quote: CommercialQuoteRecord
    source_preview_status: str
