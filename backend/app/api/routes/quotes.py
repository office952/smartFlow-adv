from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.schemas.quotes import CommercialQuoteRecord, CreateCommercialQuoteResponse, QuotePreviewResponse
from app.services.quote_preview_service import QuotePreviewService
from app.services.workspace_store import workspace_store


router = APIRouter()


@router.get("/previews", response_model=list[QuotePreviewResponse])
async def list_quote_previews() -> list[QuotePreviewResponse]:
    return workspace_store.list_previews()


@router.get("", response_model=list[CommercialQuoteRecord])
async def list_quotes() -> list[CommercialQuoteRecord]:
    return workspace_store.list_quotes()


@router.post("/from-preview/{workspace_id}", response_model=CreateCommercialQuoteResponse)
async def create_quote_from_preview(workspace_id: str) -> CreateCommercialQuoteResponse:
    workspace = workspace_store.get_workspace(workspace_id)
    if workspace is None:
        raise HTTPException(status_code=404, detail="Workspace not found")

    existing_quote = workspace_store.get_quote_by_workspace_id(workspace_id)
    if existing_quote is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Commercial quote already exists for this workspace: {existing_quote.quote_code}",
        )

    preview = QuotePreviewService(workspace_store).build_preview(workspace_id)
    if preview.status != "ready" or preview.subtotal_net is None or preview.total_gross is None:
        raise HTTPException(status_code=400, detail="Preview is not ready for commercial quote creation")

    quote_id = str(uuid4())
    quote = CommercialQuoteRecord(
        id=quote_id,
        quote_code=f"Q-{quote_id[:8].upper()}",
        workspace_id=preview.workspace_id,
        workspace_title=preview.workspace_title,
        client_name=preview.client_name,
        status="priced",
        subtotal_net=preview.subtotal_net,
        vat_rate=preview.vat_rate,
        vat_amount=preview.vat_amount,
        total_gross=preview.total_gross,
        currency=preview.currency,
        lines=preview.lines,
    )
    saved = workspace_store.save_quote(quote)
    return CreateCommercialQuoteResponse(quote=saved, source_preview_status=preview.status)
