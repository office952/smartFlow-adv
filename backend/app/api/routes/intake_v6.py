from fastapi import APIRouter, HTTPException

from app.schemas.intake_v6 import (
    IntakeV6WorkspaceCreate,
    IntakeV6WorkspaceDetail,
    IntakeV6WorkspaceSummary,
)
from app.schemas.quotes import (
    QuoteLinePrice,
    QuoteLinePriceUpdate,
    QuoteOwnerDecision,
    QuoteOwnerDecisionUpdate,
    QuotePreviewResponse,
)
from app.services.quote_preview_service import QuotePreviewService
from app.services.workspace_store import workspace_store


router = APIRouter()


@router.get("/workspaces", response_model=list[IntakeV6WorkspaceSummary])
async def list_workspaces() -> list[IntakeV6WorkspaceSummary]:
    return workspace_store.list_workspaces()


@router.post("/workspaces", response_model=IntakeV6WorkspaceDetail)
async def create_workspace(payload: IntakeV6WorkspaceCreate) -> IntakeV6WorkspaceDetail:
    return workspace_store.create_workspace(payload)


@router.get("/workspaces/{workspace_id}", response_model=IntakeV6WorkspaceDetail)
async def get_workspace(workspace_id: str) -> IntakeV6WorkspaceDetail:
    workspace = workspace_store.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.get("/workspaces/{workspace_id}/owner-decisions", response_model=list[QuoteOwnerDecision])
async def list_owner_decisions(workspace_id: str) -> list[QuoteOwnerDecision]:
    workspace = workspace_store.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace_store.list_owner_decisions(workspace_id)


@router.put("/workspaces/{workspace_id}/owner-decisions/{decision_code}", response_model=QuoteOwnerDecision)
async def update_owner_decision(
    workspace_id: str,
    decision_code: str,
    payload: QuoteOwnerDecisionUpdate,
) -> QuoteOwnerDecision:
    workspace = workspace_store.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if payload.code != decision_code:
        raise HTTPException(status_code=400, detail="Decision code mismatch")
    return workspace_store.upsert_owner_decision(workspace_id, payload)


@router.get("/workspaces/{workspace_id}/line-prices", response_model=list[QuoteLinePrice])
async def list_line_prices(workspace_id: str) -> list[QuoteLinePrice]:
    workspace = workspace_store.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace_store.list_line_prices(workspace_id)


@router.put("/workspaces/{workspace_id}/line-prices/{line_code}", response_model=QuoteLinePrice)
async def update_line_price(
    workspace_id: str,
    line_code: str,
    payload: QuoteLinePriceUpdate,
) -> QuoteLinePrice:
    workspace = workspace_store.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    if payload.line_code != line_code:
        raise HTTPException(status_code=400, detail="Line code mismatch")
    return workspace_store.upsert_line_price(workspace_id, payload)


@router.post("/workspaces/{workspace_id}/quote-preview", response_model=QuotePreviewResponse)
async def build_quote_preview(workspace_id: str) -> QuotePreviewResponse:
    workspace = workspace_store.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return QuotePreviewService(workspace_store).build_preview(workspace_id)
