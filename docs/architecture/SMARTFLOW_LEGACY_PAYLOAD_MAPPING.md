# SmartFlow Legacy Payload Mapping

**Version:** 1.0.0  
**Date:** 2026-07-01  
**Phase:** 2B contract (extended 2C artwork fields)  
**Legacy reference:** `workos-active` Intake V6 (`IntakeV4WorkspacePayload`)

---

## Canonical SmartFlow chain

```
SVG / Artwork
  → Layer groups + layer_role_setup
  → quote_geometry
  → finish_setup (letter_group_finishes, artwork_finishes, LED, mounting)
  → payload_json (workspace truth)
  → build_intake_snapshot(payload_json)
  → IntakeFieldRegistry (schema + validation)
  → OwnerDecisionRegistry (gates + ambiguities)
  → CommercialRuleRegistry (line skeleton + bases)
  → QuotePreviewService (blocked/ready, null totals)
  → Official Quote (Phase 4 — later)
  → Snapshot (Phase 5 — later)
  → Offer Output (Phase 6 — later)
```

**Rule:** `payload_json` is workspace truth. `intake_snapshot` is derived flat input for quote preview — never the other way around.

---

## Target `payload_json` envelope

```json
{
  "schema_version": "1.0.0",
  "template_code": "TPL-VOLUMETRIC-LETTERS_v2",
  "systems_template_code": "volumetric_letters_frontlit",

  "client": {
    "client_name": "string",
    "width_mm": 1200,
    "height_mm": 400
  },

  "svg_source": {
    "file_name": "optional.svg",
    "file_size_bytes": 4096,
    "mime_type": "image/svg+xml",
    "upload_status": "missing|analyzed|failed",
    "uploaded_at": "2026-07-01T12:00:00Z"
  },
  "svg_analysis_json": {
    "parser_version": "1.0.0",
    "width": 1200,
    "height": 400,
    "viewBox": "0 0 1200 400",
    "group_count": 2,
    "path_count": 5,
    "layers": []
  },
  "layer_role_setup": {
    "confirmation_status": "missing|draft|partial|confirmed",
    "layers": [
      {
        "layer_id": "face_a",
        "layer_name": "Face A",
        "source": "g_id",
        "suggested_role": "face",
        "confirmed_role": "face",
        "confirmed": true,
        "ignored": false,
        "metrics": { "face_area_m2": null, "perimeter_m": null }
      }
    ]
  },

  "quote_geometry": {
    "width_mm": 1200,
    "height_mm": 400,
    "letter_count": 5,
    "letter_perimeter_m": 12.5,
    "letter_face_area_m2": 1.2,
    "back_area_m2": null,
    "cut_length_ml": null,
    "finish_area_m2": null
  },

  "finish_setup": {
    "letter_group_finishes": [],
    "artwork_finishes": [],
    "illuminated": true,
    "lighting_system_type": "led_modules",
    "led_module_count": 20,
    "selected_psu_watts": 100,
    "light_color": "neutral",
    "backing_mode": "forex_10_no_bevel",
    "back_area_m2": null,
    "mounting_system": "direct_wall",
    "support_required": false,
    "support_type": null,
    "mounting_template_enabled": false,
    "mounting_template_area_m2": null,
    "mounting_template_material_type": null,
    "commercial_inputs": {
      "markup_percent": 35,
      "discount_percent": 0,
      "vat_percent": 19,
      "manual_adjustment_ron": 0
    }
  },

  "owner_decisions_snapshot": {},
  "intake_snapshot": null,
  "system_links": {
    "template_code": "volumetric_letters_frontlit",
    "family_code": "volumetric_letters",
    "component_codes": [],
    "commercial_rule_codes": []
  }
}
```

---

## Legacy → SmartFlow payload mapping

### Geometrie & SVG (Pas 1)

| Legacy path | SmartFlow path | Notes |
|-------------|----------------|-------|
| `client.width_mm` | `client.width_mm` | direct |
| `client.height_mm` | `client.height_mm` | direct |
| `svg_source.*` | `svg_source.*` | Phase 2C |
| `svg_analysis_json` | `svg_analysis_json` | Phase 2C |
| `layer_role_setup` | `layer_role_setup` | Phase 2C |
| `quote_geometry.letter_count` | `quote_geometry.letter_count` | SVG or form |
| `quote_geometry.letter_perimeter_m` | `quote_geometry.letter_perimeter_m` | sum groups or analyzer |
| `quote_geometry.letter_face_area_m2` | `quote_geometry.letter_face_area_m2` | sum groups or analyzer |

### Letter group finishes (Pas 2 — Finisaje)

| Legacy path | SmartFlow | Derivation |
|-------------|-----------|------------|
| `finish_setup.letter_group_finishes[]` | same | per-layer unit |
| `.face_area_m2`, `.perimeter_m` | same | from SVG |
| `.face_finish_type`, `.return_depth_mm` | same | operator input |
| `.confirmed` | same | gate: `letter_groups_confirmed` |

Aggregates (via `build_intake_snapshot`):

- `face_area_m2` ← sum confirmed groups or `quote_geometry.letter_face_area_m2`
- `perimeter_ml` ← sum confirmed groups or `quote_geometry.letter_perimeter_m`
- `cut_length_ml` ← `perimeter_ml` if missing
- `finish_area_m2` ← `face_area_m2` default

### Iluminare

| Legacy path | intake_snapshot key |
|-------------|---------------------|
| `finish_setup.illuminated` | `illuminated` |
| `finish_setup.lighting_system_type` | `lighting_system_type` |
| `finish_setup.led_module_count` | `estimated_led_count` |
| `finish_setup.selected_psu_watts` | `estimated_power_w` |
| `finish_setup.light_color` | `light_color` |

### Spate & montaj

| Legacy path | intake_snapshot key |
|-------------|---------------------|
| `finish_setup.backing_mode` | maps to owner `back_material` |
| `quote_geometry.back_area_m2` | `back_area_m2` |
| `finish_setup.mounting_template_enabled` | `mounting_required` |
| `finish_setup.mounting_template_area_m2` | `mounting_template_area_m2` |
| `finish_setup.mounting_template_material_type` | `mounting_type` |
| `finish_setup.mounting_system` | `support_required` + `support_type` |

Derivation:

```
mounting_system ∈ {steel_bars, aluminum_bars}
  → support_required = true
  → support_type = mounting_system
```

### Commercial inputs (non-canonical)

| Legacy path | Used in QuotePreview? |
|-------------|----------------------|
| `finish_setup.commercial_inputs.*` | **No** — operator display only; not commercial truth |

---

## IntakeFieldRegistry gaps (Phase 2B)

| field_code | Source path | feeds_rules |
|------------|-------------|-------------|
| `letter_count` | `quote_geometry.letter_count` | `face_cut_rule` |
| `cut_length_ml` | derived | `face_cut_rule` |
| `illuminated` | `finish_setup.illuminated` | `led_modules_rule` gate |
| `lighting_system_type` | `finish_setup.lighting_system_type` | metadata |
| `mounting_template_area_m2` | `finish_setup.mounting_template_area_m2` | `sablon_montaj_rule` |
| `letter_groups_confirmed` | derived | preview gate |
| `artwork_confirmed` | derived | preview gate |

Collection types (payload only, Phase 2C UI):

- `letter_group_finishes`
- `artwork_finishes`
- `layer_role_setup.layers`

---

## OwnerDecisionRegistry gaps (Phase 2B)

| decision_code | Legacy equivalent | feeds_rules |
|---------------|-------------------|-------------|
| `back_cut_basis` | `DEBITARE_SPATE_BASIS_ML_VS_M2` | `back_panel_rule` |
| `forex_template_price` | `SABLON_FOREX_COMMERCIAL_PRICE` | `sablon_montaj_rule` |
| `packaging_commercial` | `AMBALARE_COMMERCIAL_RULE` | `packaging_rule` |
| `site_mount_commercial` | `MONTAJ_COMMERCIAL_RULE` | `mounting_rule` |

---

## CommercialRuleRegistry gaps (Phase 2B)

| rule_code | Legacy line | basis | required_inputs |
|-----------|-------------|-------|-----------------|
| `sablon_montaj_rule` | `sablon_montaj` | mp | `mounting_template_area_m2`, `mounting_required` |

`back_panel_rule` notes extended: owner may choose ml vs m² via `back_cut_basis`.

---

## `build_intake_snapshot(payload_json)` resolver

**Location:** `backend/app/services/intake_snapshot_builder.py`

**Resolver priority** (`workspace_intake_resolver.py`):

1. `build_intake_snapshot(payload_json)`
2. `payload_json.intake_snapshot` cache (if dict, merge only missing keys)
3. Notes `System-driven intake snapshot:` legacy hack
4. Flat workspace columns fallback

**Canonical output keys:**

- `template_code`, `systems_template_code`
- `artwork_width_mm`, `artwork_height_mm`, `letter_count`
- `face_area_m2`, `back_area_m2`, `perimeter_ml`, `cut_length_ml`
- `return_depth_mm`, `finish_area_m2`
- `estimated_led_count`, `estimated_power_w`
- `illuminated`, `lighting_system_type`, `light_color`
- `support_required`, `support_type`
- `mounting_required`, `mounting_type`, `mounting_template_area_m2`
- `packaging_required`, `package_size_class`
- `letter_groups_confirmed`, `artwork_confirmed`

**Never:** invent missing numbers; commercial totals; fake defaults for required geometry.

---

## Cross-layer blockers

| Blocker | Layer |
|---------|-------|
| `letter_groups_confirmed = false` | payload → snapshot |
| `artwork_confirmed = false` | payload → snapshot |
| `REQUIRED_INPUT_MISSING` | IntakeField → CommercialRule |
| `OWNER_DECISION_MISSING` | OwnerDecision → CommercialRule |
| `back_cut_basis` pending | OwnerDecision |
| `forex_template_price` pending | OwnerDecision |
| `OWNER_PRICE_MISSING` | line_prices by `rule_code` |

---

## Implementation order (Phase 2B)

1. Payload schema types (`schemas/workspace_payload.py`)
2. SQLite `payload_json` column (idempotent)
3. `build_intake_snapshot()`
4. Resolver rewrite
5. Registry extensions
6. Frontend payload builder + adapter
7. Tests + docs

**Next after 2B:** Phase 2C — SVG upload, layer roles, letter group review UX.
