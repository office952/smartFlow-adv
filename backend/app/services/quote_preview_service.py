from __future__ import annotations

from app.schemas.quotes import QuoteBlocker, QuoteLine, QuoteOwnerDecision, QuotePreviewResponse
from app.services.workspace_store import WorkspaceStore


VAT_RATE = 0.19


class QuotePreviewService:
    def __init__(self, store: WorkspaceStore) -> None:
        self._store = store

    def build_preview(self, workspace_id: str) -> QuotePreviewResponse:
        workspace = self._store.get_workspace(workspace_id)
        if workspace is None:
            raise ValueError("Workspace not found")
        existing_quote = self._store.get_quote_by_workspace_id(workspace_id)

        stored_decisions = {decision.code: decision for decision in self._store.list_owner_decisions(workspace_id)}
        stored_prices = {price.line_code: price for price in self._store.list_line_prices(workspace_id)}

        default_back_decision = QuoteOwnerDecision(
            code="DEBITARE_SPATE_BASIS_ML_VS_M2",
            label="Debitare spate litere",
            detail="Owner must decide whether back cutting is sold by m2 or by ml.",
            line_code="debitare_spate",
        )
        back_decision = stored_decisions.get(default_back_decision.code, default_back_decision)

        back_basis = "unknown"
        back_unit = "unknown"
        back_quantity = round(workspace.letter_face_area_m2, 4)
        if back_decision.status == "approved" and back_decision.selected_value in {"m2", "ml"}:
            back_basis = back_decision.selected_value
            back_unit = back_decision.selected_value
            if back_decision.selected_value == "ml":
                back_quantity = round(workspace.letter_perimeter_m, 4)

        def build_line(*, code: str, label: str, basis_type: str, quantity: float | int | None, unit: str, owner_decision_required: bool = False) -> QuoteLine:
            price = stored_prices.get(code)
            subtotal = None
            if price is not None and quantity is not None:
                subtotal = round(float(quantity) * float(price.unit_price), 2)
            return QuoteLine(
                code=code,
                label=label,
                basis_type=basis_type,
                quantity=quantity,
                unit=unit,
                commercial_unit_price=price.unit_price if price is not None else None,
                subtotal=subtotal,
                owner_decision_required=owner_decision_required,
            )

        lines = [
            build_line(code="debitare_fata", label="Debitare față litere", basis_type="ml", quantity=round(workspace.letter_perimeter_m, 4), unit="ml"),
            build_line(code="modelare_cant_aluminiu", label="Modelare cant aluminiu", basis_type="ml", quantity=round(workspace.letter_perimeter_m, 4), unit="ml"),
            build_line(code="debitare_spate", label="Debitare spate litere", basis_type=back_basis, quantity=back_quantity, unit=back_unit, owner_decision_required=back_decision.status != "approved"),
            build_line(code="sistem_led_module", label="Sistem LED - module", basis_type="piece", quantity=workspace.led_module_count, unit="buc"),
            build_line(code="sursa_led", label="Sursă LED (PSU)", basis_type="piece", quantity=workspace.selected_psu_watts, unit="buc"),
            build_line(code="finisaje_colantare_vopsire", label="Finisaje - colantare / vopsire", basis_type="m2", quantity=round(workspace.letter_face_area_m2, 4), unit="m2"),
        ]

        blockers: list[QuoteBlocker] = []

        owner_decisions = [back_decision]
        if back_decision.status != "approved":
            blockers.insert(
                0,
                QuoteBlocker(
                    code="COMMERCIAL_BASIS_UNKNOWN",
                    message="Commercial basis remains unresolved for debitare_spate.",
                ),
            )

        owner_decisions.append(
            stored_decisions.get(
                "COMMERCIAL_UNIT_PRICES_REQUIRED",
                QuoteOwnerDecision(
                code="COMMERCIAL_UNIT_PRICES_REQUIRED",
                label="Commercial unit prices",
                detail="Face, return, LED, PSU, and finish lines still need owner-approved commercial prices.",
                ),
            )
        )

        if workspace.mounting_template_enabled and workspace.mounting_template_material_type == "forex":
            default_forex_decision = QuoteOwnerDecision(
                code="SABLON_FOREX_COMMERCIAL_PRICE",
                label="Șablon montaj Forex",
                detail="Owner must approve whether Forex template is sold separately and at what commercial price.",
                line_code="sablon_montaj_forex",
            )
            forex_decision = stored_decisions.get(default_forex_decision.code, default_forex_decision)
            lines.append(build_line(code="sablon_montaj_forex", label="Șablon montaj Forex", basis_type="m2", quantity=workspace.mounting_template_area_m2, unit="m2", owner_decision_required=forex_decision.status != "approved"))
            owner_decisions.append(forex_decision)
            if forex_decision.status != "approved":
                blockers.append(
                    QuoteBlocker(
                        code="SABLON_FOREX_COMMERCIAL_PRICE",
                        message="Forex template is active but has no approved commercial price.",
                    )
                )

        priced_line_candidates = [line for line in lines if line.owner_decision_required is False]
        missing_prices = [line.code for line in priced_line_candidates if line.commercial_unit_price is None]
        if missing_prices:
            blockers.append(
                QuoteBlocker(
                    code="OWNER_PRICE_INPUT_REQUIRED",
                    message="Commercial unit prices are intentionally unset until owner-approved inputs exist.",
                )
            )

        subtotal = round(sum(line.subtotal or 0 for line in lines), 2) if not missing_prices and not blockers else None
        vat_amount = round(subtotal * VAT_RATE, 2) if subtotal is not None else None
        total_gross = round(subtotal + vat_amount, 2) if subtotal is not None and vat_amount is not None else None
        status = "ready" if not blockers and subtotal is not None else "blocked"

        warnings = [
            "No fake totals: this clean scaffold returns blocked commercial previews until owner-approved rule data exists.",
        ]
        if workspace.selected_psu_watts:
            warnings.append(
                "PSU quantity currently mirrors selected watt class input; do not treat it as final commercial piece quantity."
            )

        preview = QuotePreviewResponse(
            workspace_id=workspace.id,
            workspace_title=workspace.title,
            client_name=workspace.client_name,
            status=status,
            existing_quote_id=existing_quote.id if existing_quote is not None else None,
            existing_quote_code=existing_quote.quote_code if existing_quote is not None else None,
            subtotal_net=subtotal,
            vat_rate=VAT_RATE,
            vat_amount=vat_amount,
            total_gross=total_gross,
            lines=lines,
            blockers=blockers,
            owner_decisions=owner_decisions,
            warnings=warnings,
        )
        return self._store.save_preview(preview)