from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from app.schemas.intake_v6 import (
    IntakeV6WorkspaceCreate,
    IntakeV6WorkspaceDetail,
    IntakeV6WorkspaceSummary,
)
from app.schemas.quotes import (
    CommercialQuoteRecord,
    QuoteLinePrice,
    QuoteLinePriceUpdate,
    QuoteOwnerDecision,
    QuoteOwnerDecisionUpdate,
    QuotePreviewResponse,
)


class WorkspaceStore:
    def __init__(self, db_path: Path) -> None:
        self._db_path = db_path
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._ensure_schema()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self._db_path)
        connection.row_factory = sqlite3.Row
        return connection

    @staticmethod
    def _quote_from_json(raw_json: str) -> CommercialQuoteRecord:
        payload = json.loads(raw_json)
        subtotal_net = payload.get("subtotal_net")
        vat_rate = payload.get("vat_rate", 0.19)
        vat_amount = payload.get("vat_amount")
        if vat_amount is None and subtotal_net is not None:
            vat_amount = round(float(subtotal_net) * float(vat_rate), 2)
        if payload.get("total_gross") is None and subtotal_net is not None and vat_amount is not None:
            payload["total_gross"] = round(float(subtotal_net) + float(vat_amount), 2)
        payload["vat_rate"] = vat_rate
        payload["vat_amount"] = vat_amount
        return CommercialQuoteRecord.model_validate(payload)

    def _ensure_schema(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS workspaces (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    client_name TEXT NOT NULL,
                    template_code TEXT NOT NULL,
                    status TEXT NOT NULL,
                    width_mm REAL NOT NULL,
                    height_mm REAL NOT NULL,
                    letter_count INTEGER NOT NULL,
                    letter_perimeter_m REAL NOT NULL,
                    letter_face_area_m2 REAL NOT NULL,
                    return_depth_mm REAL NOT NULL,
                    illuminated INTEGER NOT NULL,
                    led_module_count INTEGER,
                    selected_psu_watts INTEGER,
                    mounting_template_enabled INTEGER NOT NULL,
                    mounting_template_area_m2 REAL,
                    mounting_template_material_type TEXT,
                    notes TEXT
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS previews (
                    workspace_id TEXT PRIMARY KEY,
                    preview_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS owner_decisions (
                    workspace_id TEXT NOT NULL,
                    code TEXT NOT NULL,
                    label TEXT NOT NULL,
                    detail TEXT NOT NULL,
                    line_code TEXT,
                    status TEXT NOT NULL,
                    selected_value TEXT,
                    resolution_notes TEXT,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (workspace_id, code),
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS line_prices (
                    workspace_id TEXT NOT NULL,
                    line_code TEXT NOT NULL,
                    unit_price REAL NOT NULL,
                    currency TEXT NOT NULL,
                    notes TEXT,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (workspace_id, line_code),
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
                )
                """
            )
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS quotes (
                    id TEXT PRIMARY KEY,
                    quote_code TEXT NOT NULL UNIQUE,
                    workspace_id TEXT NOT NULL,
                    quote_json TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (workspace_id) REFERENCES workspaces (id)
                )
                """
            )
            connection.commit()

    @staticmethod
    def _workspace_from_row(row: sqlite3.Row) -> IntakeV6WorkspaceDetail:
        return IntakeV6WorkspaceDetail(
            id=row["id"],
            title=row["title"],
            client_name=row["client_name"],
            template_code=row["template_code"],
            status=row["status"],
            width_mm=row["width_mm"],
            height_mm=row["height_mm"],
            letter_count=row["letter_count"],
            letter_perimeter_m=row["letter_perimeter_m"],
            letter_face_area_m2=row["letter_face_area_m2"],
            return_depth_mm=row["return_depth_mm"],
            illuminated=bool(row["illuminated"]),
            led_module_count=row["led_module_count"],
            selected_psu_watts=row["selected_psu_watts"],
            mounting_template_enabled=bool(row["mounting_template_enabled"]),
            mounting_template_area_m2=row["mounting_template_area_m2"],
            mounting_template_material_type=row["mounting_template_material_type"],
            notes=row["notes"],
        )

    def create_workspace(self, payload: IntakeV6WorkspaceCreate) -> IntakeV6WorkspaceDetail:
        workspace_id = str(uuid4())
        workspace = IntakeV6WorkspaceDetail(
            id=workspace_id,
            title=payload.title,
            client_name=payload.client_name,
            template_code=payload.template_code,
            status="draft",
            width_mm=payload.width_mm,
            height_mm=payload.height_mm,
            letter_count=payload.letter_count,
            letter_perimeter_m=payload.letter_perimeter_m,
            letter_face_area_m2=payload.letter_face_area_m2,
            return_depth_mm=payload.return_depth_mm,
            illuminated=payload.illuminated,
            led_module_count=payload.led_module_count,
            selected_psu_watts=payload.selected_psu_watts,
            mounting_template_enabled=payload.mounting_template_enabled,
            mounting_template_area_m2=payload.mounting_template_area_m2,
            mounting_template_material_type=payload.mounting_template_material_type,
            notes=payload.notes,
        )
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO workspaces (
                    id, title, client_name, template_code, status,
                    width_mm, height_mm, letter_count, letter_perimeter_m, letter_face_area_m2,
                    return_depth_mm, illuminated, led_module_count, selected_psu_watts,
                    mounting_template_enabled, mounting_template_area_m2, mounting_template_material_type, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    workspace.id,
                    workspace.title,
                    workspace.client_name,
                    workspace.template_code,
                    workspace.status,
                    workspace.width_mm,
                    workspace.height_mm,
                    workspace.letter_count,
                    workspace.letter_perimeter_m,
                    workspace.letter_face_area_m2,
                    workspace.return_depth_mm,
                    int(workspace.illuminated),
                    workspace.led_module_count,
                    workspace.selected_psu_watts,
                    int(workspace.mounting_template_enabled),
                    workspace.mounting_template_area_m2,
                    workspace.mounting_template_material_type,
                    workspace.notes,
                ),
            )
            connection.commit()
        return workspace

    def list_workspaces(self) -> list[IntakeV6WorkspaceSummary]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, title, client_name, template_code, status
                FROM workspaces
                ORDER BY rowid DESC
                """
            ).fetchall()
        return [
            IntakeV6WorkspaceSummary(
                id=row["id"],
                title=row["title"],
                client_name=row["client_name"],
                template_code=row["template_code"],
                status=row["status"],
            )
            for row in rows
        ]

    def get_workspace(self, workspace_id: str) -> IntakeV6WorkspaceDetail | None:
        with self._connect() as connection:
            row = connection.execute(
                "SELECT * FROM workspaces WHERE id = ?",
                (workspace_id,),
            ).fetchone()
        if row is None:
            return None
        return self._workspace_from_row(row)

    def save_preview(self, preview: QuotePreviewResponse) -> QuotePreviewResponse:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO previews (workspace_id, preview_json, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(workspace_id) DO UPDATE SET
                    preview_json = excluded.preview_json,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (preview.workspace_id, preview.model_dump_json()),
            )
            connection.commit()
        return preview

    def list_previews(self) -> list[QuotePreviewResponse]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT preview_json FROM previews ORDER BY updated_at DESC, rowid DESC"
            ).fetchall()
        return [QuotePreviewResponse.model_validate_json(row["preview_json"]) for row in rows]

    def list_owner_decisions(self, workspace_id: str) -> list[QuoteOwnerDecision]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT code, label, detail, line_code, status, selected_value, resolution_notes
                FROM owner_decisions
                WHERE workspace_id = ?
                ORDER BY updated_at DESC, rowid DESC
                """,
                (workspace_id,),
            ).fetchall()
        return [
            QuoteOwnerDecision(
                code=row["code"],
                label=row["label"],
                detail=row["detail"],
                line_code=row["line_code"],
                status=row["status"],
                selected_value=row["selected_value"],
                resolution_notes=row["resolution_notes"],
            )
            for row in rows
        ]

    def upsert_owner_decision(self, workspace_id: str, payload: QuoteOwnerDecisionUpdate) -> QuoteOwnerDecision:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO owner_decisions (
                    workspace_id, code, label, detail, line_code, status, selected_value, resolution_notes, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(workspace_id, code) DO UPDATE SET
                    label = excluded.label,
                    detail = excluded.detail,
                    line_code = excluded.line_code,
                    status = excluded.status,
                    selected_value = excluded.selected_value,
                    resolution_notes = excluded.resolution_notes,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    workspace_id,
                    payload.code,
                    payload.label,
                    payload.detail,
                    payload.line_code,
                    payload.status,
                    payload.selected_value,
                    payload.resolution_notes,
                ),
            )
            connection.commit()
        return QuoteOwnerDecision(
            code=payload.code,
            label=payload.label,
            detail=payload.detail,
            line_code=payload.line_code,
            status=payload.status,
            selected_value=payload.selected_value,
            resolution_notes=payload.resolution_notes,
        )

    def list_line_prices(self, workspace_id: str) -> list[QuoteLinePrice]:
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT line_code, unit_price, currency, notes
                FROM line_prices
                WHERE workspace_id = ?
                ORDER BY updated_at DESC, rowid DESC
                """,
                (workspace_id,),
            ).fetchall()
        return [
            QuoteLinePrice(
                line_code=row["line_code"],
                unit_price=row["unit_price"],
                currency=row["currency"],
                notes=row["notes"],
            )
            for row in rows
        ]

    def upsert_line_price(self, workspace_id: str, payload: QuoteLinePriceUpdate) -> QuoteLinePrice:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO line_prices (
                    workspace_id, line_code, unit_price, currency, notes, updated_at
                ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(workspace_id, line_code) DO UPDATE SET
                    unit_price = excluded.unit_price,
                    currency = excluded.currency,
                    notes = excluded.notes,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    workspace_id,
                    payload.line_code,
                    payload.unit_price,
                    payload.currency,
                    payload.notes,
                ),
            )
            connection.commit()
        return QuoteLinePrice(
            line_code=payload.line_code,
            unit_price=payload.unit_price,
            currency=payload.currency,
            notes=payload.notes,
        )

    def save_quote(self, quote: CommercialQuoteRecord) -> CommercialQuoteRecord:
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO quotes (id, quote_code, workspace_id, quote_json, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    quote.id,
                    quote.quote_code,
                    quote.workspace_id,
                    quote.model_dump_json(),
                    datetime.utcnow().isoformat(timespec="seconds"),
                ),
            )
            connection.commit()
        return quote

    def get_quote_by_workspace_id(self, workspace_id: str) -> CommercialQuoteRecord | None:
        with self._connect() as connection:
            row = connection.execute(
                """
                SELECT quote_json
                FROM quotes
                WHERE workspace_id = ?
                ORDER BY created_at DESC, rowid DESC
                LIMIT 1
                """,
                (workspace_id,),
            ).fetchone()
        if row is None:
            return None
        return self._quote_from_json(row["quote_json"])

    def list_quotes(self) -> list[CommercialQuoteRecord]:
        with self._connect() as connection:
            rows = connection.execute(
                "SELECT quote_json FROM quotes ORDER BY created_at DESC, rowid DESC"
            ).fetchall()
        return [self._quote_from_json(row["quote_json"]) for row in rows]


workspace_store = WorkspaceStore(Path(__file__).resolve().parents[2] / "data" / "workos_v6.db")
