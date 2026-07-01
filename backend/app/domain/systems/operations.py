from app.domain.systems.models import OperationDefinition

OPERATIONS: dict[str, OperationDefinition] = {
    "op_face_cut": OperationDefinition(
        operation_code="op_face_cut",
        display_name="Debitare fata",
        category="fabrication",
        internal_basis="ml",
        commercial_basis_allowed=["ml", "included", "manual_owner_review"],
        notes="Internal operation only — not commercial hour/minute pricing",
    ),
    "op_return_form": OperationDefinition(
        operation_code="op_return_form",
        display_name="Modelare cant",
        category="fabrication",
        internal_basis="ml",
        commercial_basis_allowed=["ml"],
    ),
    "op_back_panel": OperationDefinition(
        operation_code="op_back_panel",
        display_name="Debitare spate",
        category="fabrication",
        internal_basis="mp",
        commercial_basis_allowed=["mp"],
    ),
    "op_led_install": OperationDefinition(
        operation_code="op_led_install",
        display_name="Montaj LED",
        category="assembly",
        internal_basis="buc",
        commercial_basis_allowed=["buc"],
    ),
    "op_finish_apply": OperationDefinition(
        operation_code="op_finish_apply",
        display_name="Aplicare finisaj",
        category="finishing",
        internal_basis="mp",
        commercial_basis_allowed=["mp"],
    ),
}
