from __future__ import annotations

from typing import Any

from app.domain.systems.components import COMPONENTS
from app.domain.systems.models import CommercialRuleDefinition, FORBIDDEN_COMMERCIAL_BASES
from app.domain.systems.owner_decisions import OWNER_DECISIONS
from app.domain.systems.registry_service import SystemsRegistryService, systems_registry
from app.schemas.intake_v6 import IntakeV6WorkspaceDetail
from app.schemas.quotes import QuoteBlocker, QuoteLine, QuoteOwnerDecision, QuotePreviewResponse
from app.services.quote_preview_contract import (
    BLOCKER_MANUAL_OWNER_REVIEW,
    BLOCKER_NO_COMMERCIAL_RULES,
    BLOCKER_OWNER_DECISION_MISSING,
    BLOCKER_OWNER_PRICE_MISSING,
    BLOCKER_REQUIRED_INPUT_MISSING,
    BLOCKER_UNSUPPORTED_BASIS,
    BLOCKER_UNSUPPORTED_TEMPLATE,
    BUC_QUANTITY_FIELDS,
    CONDITIONAL_INPUTS,
    ML_QUANTITY_FIELDS,
    MP_QUANTITY_FIELDS,
    NON_QUANTITY_BASES,
    PREVIEW_SOURCE,
    PROVENANCE,
    basis_type_display,
)
from app.services.workspace_intake_resolver import is_truthy, resolve_intake_payload, resolve_systems_template_code
from app.services.workspace_store import WorkspaceStore


VAT_RATE = 0.19


class IntakeContext:
    def __init__(
        self,
        payload: dict[str, Any],
        owner_decisions: dict[str, QuoteOwnerDecision],
    ) -> None:
        self._payload = payload
        self._owner_decisions = owner_decisions

    def get(self, code: str) -> Any:
        raw = self._payload.get(code)
        if raw is not None and raw != "":
            return raw
        decision = self._owner_decisions.get(code)
        if decision is not None and decision.status == "approved" and decision.selected_value not in (None, ""):
            return decision.selected_value
        return None


class QuotePreviewService:
    def __init__(
        self,
        store: WorkspaceStore,
        registry: SystemsRegistryService | None = None,
    ) -> None:
        self._store = store
        self._registry = registry or systems_registry

    def build_preview(self, workspace_id: str) -> QuotePreviewResponse:
        workspace = self._store.get_workspace(workspace_id)
        if workspace is None:
            raise ValueError("Workspace not found")

        existing_quote = self._store.get_quote_by_workspace_id(workspace_id)
        stored_decisions = {decision.code: decision for decision in self._store.list_owner_decisions(workspace_id)}
        stored_prices = {price.line_code: price for price in self._store.list_line_prices(workspace_id)}

        template_code = resolve_systems_template_code(workspace)
        intake_payload = resolve_intake_payload(workspace)
        context = IntakeContext(intake_payload, stored_decisions)

        preview_blockers: list[QuoteBlocker] = []
        lines: list[QuoteLine] = []
        warnings = [
            "Preview lines are derived from CommercialRuleRegistry — not a hardcoded catalog.",
            "No fake totals: blocked previews keep null totals until required inputs, decisions, and owner prices exist.",
        ]

        if template_code is None:
            preview_blockers.append(
                QuoteBlocker(
                    code=BLOCKER_UNSUPPORTED_TEMPLATE,
                    message=f"Workspace template '{workspace.template_code}' has no systems registry mapping.",
                )
            )
            return self._finalize_preview(
                workspace=workspace,
                template_code=None,
                existing_quote=existing_quote,
                lines=lines,
                blockers=preview_blockers,
                owner_decisions=[],
                warnings=warnings,
            )

        rules = self._registry.list_commercial_rules_for_template(template_code)
        if not rules:
            preview_blockers.append(
                QuoteBlocker(
                    code=BLOCKER_NO_COMMERCIAL_RULES,
                    message=f"No commercial rules registered for template '{template_code}'.",
                )
            )

        for rule in rules:
            lines.append(self._build_line(rule, context, stored_prices))

        owner_decisions = self._collect_owner_decisions(template_code, rules, stored_decisions)

        if context.get("estimated_power_w") is not None:
            warnings.append(
                "PSU quantity uses estimated_power_w from intake; treat as provisional until owner confirms commercial piece count."
            )

        return self._finalize_preview(
            workspace=workspace,
            template_code=template_code,
            existing_quote=existing_quote,
            lines=lines,
            blockers=preview_blockers,
            owner_decisions=owner_decisions,
            warnings=warnings,
        )

    def _build_line(
        self,
        rule: CommercialRuleDefinition,
        context: IntakeContext,
        stored_prices: dict[str, Any],
    ) -> QuoteLine:
        line_blockers: list[QuoteBlocker] = []

        if rule.commercial_basis in FORBIDDEN_COMMERCIAL_BASES:
            line_blockers.append(
                QuoteBlocker(
                    code=BLOCKER_UNSUPPORTED_BASIS,
                    message=f"Rule '{rule.rule_code}' uses forbidden commercial basis '{rule.commercial_basis}'.",
                )
            )

        if self._is_not_applicable(rule, context):
            return QuoteLine(
                code=rule.rule_code,
                rule_code=rule.rule_code,
                component_code=rule.component_code,
                component_display_name=self._component_display_name(rule.component_code),
                label=rule.display_name,
                basis_type=basis_type_display(rule.commercial_basis),
                line_status="not_applicable",
                quantity=None,
                unit=basis_type_display(rule.commercial_basis),
                commercial_unit_price=None,
                subtotal=None,
                owner_decision_required=False,
                blockers=line_blockers,
                required_inputs=list(rule.required_inputs),
                required_owner_decisions=list(rule.required_owner_decisions),
                source=PREVIEW_SOURCE,
                client_visible=rule.client_visible,
            )

        missing_inputs = self._missing_required_inputs(rule, context)
        missing_decisions = self._missing_owner_decisions(rule, context)

        for input_code in missing_inputs:
            line_blockers.append(
                QuoteBlocker(
                    code=BLOCKER_REQUIRED_INPUT_MISSING,
                    message=f"Required input '{input_code}' missing for rule '{rule.rule_code}'.",
                )
            )
        for decision_code in missing_decisions:
            line_blockers.append(
                QuoteBlocker(
                    code=BLOCKER_OWNER_DECISION_MISSING,
                    message=f"Owner decision '{decision_code}' missing or not approved for rule '{rule.rule_code}'.",
                )
            )

        basis = rule.commercial_basis
        line_status = "blocked"
        owner_decision_required = bool(missing_decisions)

        if basis == "included" or "included" in rule.commercial_basis_alternatives and self._is_included(rule, context):
            line_status = "included"
        elif basis in NON_QUANTITY_BASES or rule.blocking_behavior == "manual_owner_review":
            if not line_blockers:
                line_status = "manual_review"
            if basis in {"manual_owner_review", "service_fixed", "external_service"} and not line_blockers:
                line_blockers.append(
                    QuoteBlocker(
                        code=BLOCKER_MANUAL_OWNER_REVIEW,
                        message=f"Rule '{rule.rule_code}' requires manual owner review or owner price.",
                    )
                )

        quantity, unit = self._resolve_quantity(rule, context)
        if quantity is None and basis not in NON_QUANTITY_BASES and basis != "included" and line_status != "not_applicable":
            if not any(blocker.code == BLOCKER_REQUIRED_INPUT_MISSING for blocker in line_blockers):
                line_blockers.append(
                    QuoteBlocker(
                        code=BLOCKER_REQUIRED_INPUT_MISSING,
                        message=f"Quantity could not be resolved for rule '{rule.rule_code}' ({basis}).",
                    )
                )

        price_record = stored_prices.get(rule.rule_code)
        unit_price = price_record.unit_price if price_record is not None else None
        subtotal = None

        if line_status == "included":
            subtotal = None
        elif line_blockers:
            line_status = "blocked"
        elif unit_price is None and line_status in {"blocked", "manual_review"}:
            line_blockers.append(
                QuoteBlocker(
                    code=BLOCKER_OWNER_PRICE_MISSING,
                    message=f"Owner unit price missing for rule '{rule.rule_code}'.",
                )
            )
            line_status = "blocked"
        elif unit_price is not None and quantity is not None and basis not in NON_QUANTITY_BASES:
            subtotal = round(float(quantity) * float(unit_price), 2)
            line_status = "priced"
        elif unit_price is not None and basis in NON_QUANTITY_BASES:
            subtotal = round(float(unit_price), 2)
            quantity = quantity if quantity is not None else 1
            line_status = "priced"
        elif unit_price is not None:
            subtotal = round(float(unit_price), 2)
            line_status = "priced"

        return QuoteLine(
            code=rule.rule_code,
            rule_code=rule.rule_code,
            component_code=rule.component_code,
            component_display_name=self._component_display_name(rule.component_code),
            label=rule.display_name,
            basis_type=basis_type_display(basis),
            line_status=line_status,
            quantity=quantity,
            unit=unit,
            commercial_unit_price=unit_price,
            subtotal=subtotal,
            owner_decision_required=owner_decision_required,
            blockers=line_blockers,
            required_inputs=list(rule.required_inputs),
            required_owner_decisions=list(rule.required_owner_decisions),
            source=PREVIEW_SOURCE,
            client_visible=rule.client_visible,
        )

    @staticmethod
    def _component_display_name(component_code: str) -> str | None:
        component = COMPONENTS.get(component_code)
        return component.display_name if component is not None else None

    def _is_not_applicable(self, rule: CommercialRuleDefinition, context: IntakeContext) -> bool:
        if rule.rule_code == "support_rule":
            return not is_truthy(context.get("support_required"))
        if rule.rule_code == "mounting_rule":
            return not is_truthy(context.get("mounting_required"))
        if rule.rule_code == "packaging_rule":
            return not is_truthy(context.get("packaging_required"))
        return False

    def _is_included(self, rule: CommercialRuleDefinition, context: IntakeContext) -> bool:
        return False

    def _input_required(self, rule: CommercialRuleDefinition, input_code: str, context: IntakeContext) -> bool:
        if input_code not in rule.required_inputs:
            return False
        conditional = CONDITIONAL_INPUTS.get(input_code)
        if conditional is not None:
            gate_field, expected = conditional
            return is_truthy(context.get(gate_field)) == expected
        return True

    def _missing_required_inputs(self, rule: CommercialRuleDefinition, context: IntakeContext) -> list[str]:
        missing: list[str] = []
        for input_code in rule.required_inputs:
            if not self._input_required(rule, input_code, context):
                continue
            if context.get(input_code) is None:
                missing.append(input_code)
        return missing

    def _missing_owner_decisions(self, rule: CommercialRuleDefinition, context: IntakeContext) -> list[str]:
        missing: list[str] = []
        for decision_code in rule.required_owner_decisions:
            if context.get(decision_code) is None:
                missing.append(decision_code)
        return missing

    def _resolve_quantity(self, rule: CommercialRuleDefinition, context: IntakeContext) -> tuple[float | int | None, str]:
        basis = rule.commercial_basis
        unit = basis_type_display(basis)
        if basis in NON_QUANTITY_BASES or basis == "included":
            return None, unit

        if basis == "mp":
            fields = [field for field in MP_QUANTITY_FIELDS if field in rule.required_inputs]
        elif basis == "ml":
            fields = [field for field in ML_QUANTITY_FIELDS if field in rule.required_inputs]
        elif basis == "buc":
            fields = [field for field in BUC_QUANTITY_FIELDS if field in rule.required_inputs]
        else:
            return None, unit

        for field in fields:
            raw = context.get(field)
            if raw is None:
                continue
            numeric = float(raw)
            return round(numeric, 4), unit
        return None, unit

    def _collect_owner_decisions(
        self,
        template_code: str,
        rules: list[CommercialRuleDefinition],
        stored_decisions: dict[str, QuoteOwnerDecision],
    ) -> list[QuoteOwnerDecision]:
        seen: set[str] = set()
        collected: list[QuoteOwnerDecision] = []
        for rule in rules:
            for decision_code in rule.required_owner_decisions:
                if decision_code in seen:
                    continue
                seen.add(decision_code)
                stored = stored_decisions.get(decision_code)
                if stored is not None:
                    collected.append(
                        stored.model_copy(update={"line_code": stored.line_code or rule.rule_code})
                    )
                    continue
                definition = OWNER_DECISIONS.get(decision_code)
                collected.append(
                    QuoteOwnerDecision(
                        code=decision_code,
                        label=definition.label if definition else decision_code,
                        detail=definition.notes if definition and definition.notes else f"Required for commercial rules on {template_code}.",
                        line_code=rule.rule_code,
                        status="pending",
                    )
                )
        return collected

    def _finalize_preview(
        self,
        *,
        workspace: IntakeV6WorkspaceDetail,
        template_code: str | None,
        existing_quote: Any,
        lines: list[QuoteLine],
        blockers: list[QuoteBlocker],
        owner_decisions: list[QuoteOwnerDecision],
        warnings: list[str],
    ) -> QuotePreviewResponse:
        line_blockers = [blocker for line in lines for blocker in line.blockers]
        all_blockers = blockers + self._dedupe_blockers(line_blockers)

        priced_or_included = [
            line
            for line in lines
            if line.line_status in {"priced", "included"} and line.client_visible
        ]
        active_lines = [line for line in lines if line.line_status != "not_applicable" and line.client_visible]

        has_open_line_blockers = any(line.line_status == "blocked" for line in active_lines)
        missing_prices = [
            line.rule_code or line.code
            for line in active_lines
            if line.line_status not in {"priced", "included", "not_applicable"} and not line.blockers
        ]

        if missing_prices and not has_open_line_blockers:
            all_blockers.append(
                QuoteBlocker(
                    code=BLOCKER_OWNER_PRICE_MISSING,
                    message="One or more commercial rules still need owner-approved unit prices.",
                )
            )

        subtotal = None
        if not all_blockers and not has_open_line_blockers and active_lines:
            if all(line.line_status in {"priced", "included"} for line in active_lines):
                subtotal = round(
                    sum(line.subtotal or 0 for line in active_lines if line.line_status == "priced"),
                    2,
                )

        vat_amount = round(subtotal * VAT_RATE, 2) if subtotal is not None else None
        total_gross = round(subtotal + vat_amount, 2) if subtotal is not None and vat_amount is not None else None
        status = "ready" if subtotal is not None and not all_blockers and not has_open_line_blockers else "blocked"

        preview = QuotePreviewResponse(
            workspace_id=workspace.id,
            workspace_title=workspace.title,
            client_name=workspace.client_name,
            template_code=template_code,
            status=status,
            existing_quote_id=existing_quote.id if existing_quote is not None else None,
            existing_quote_code=existing_quote.quote_code if existing_quote is not None else None,
            subtotal_net=subtotal,
            vat_rate=VAT_RATE,
            vat_amount=vat_amount,
            total_gross=total_gross,
            lines=lines,
            blockers=self._dedupe_blockers(all_blockers),
            owner_decisions=owner_decisions,
            warnings=warnings,
            provenance=PROVENANCE,
        )
        return self._store.save_preview(preview)

    @staticmethod
    def _dedupe_blockers(blockers: list[QuoteBlocker]) -> list[QuoteBlocker]:
        seen: set[tuple[str, str]] = set()
        unique: list[QuoteBlocker] = []
        for blocker in blockers:
            key = (blocker.code, blocker.message)
            if key in seen:
                continue
            seen.add(key)
            unique.append(blocker)
        return unique
