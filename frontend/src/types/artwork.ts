/** Intake layer roles — operator-confirmed truth, not commercial pricing. */
export const LAYER_ROLES = [
  "face",
  "return_cant",
  "back",
  "cut",
  "print",
  "paint",
  "support",
  "reference",
  "ignored",
  "unknown",
] as const;

export type LayerRole = (typeof LAYER_ROLES)[number];

export type SvgParsedLayer = {
  layer_id: string;
  layer_name: string;
  source: "g_id" | "g_label" | "g_data_name" | "top_level";
  path_count: number;
  child_group_count: number;
};

export type SvgAnalysisJson = {
  parser_version: string;
  width: number | null;
  height: number | null;
  viewBox: string | null;
  group_count: number;
  path_count: number;
  layers: SvgParsedLayer[];
};

export type LayerRoleEntry = {
  layer_id: string;
  layer_name: string;
  source: string;
  suggested_role: LayerRole;
  confirmed_role: LayerRole;
  confirmed: boolean;
  ignored: boolean;
  path_count: number | null;
  metrics: {
    face_area_m2: number | null;
    perimeter_m: number | null;
  };
};

export type LayerRoleSetup = {
  confirmation_status: "draft" | "confirmed" | "missing" | "partial" | "complete";
  layers: LayerRoleEntry[];
};

export type LetterGroupFinish = {
  group_key: string;
  layer_name: string;
  role: LayerRole;
  face_area_m2: number | null;
  perimeter_m: number | null;
  face_finish_type: string | null;
  face_oracal_code: string | null;
  return_finish_type: string | null;
  return_depth_mm: number | null;
  face_vinyl_roll_width_mm: number | null;
  confirmed: boolean;
};

export type ArtworkIntakeState = {
  file: File | null;
  svgText: string | null;
  svgSource: {
    file_name: string | null;
    file_size_bytes: number | null;
    mime_type: string | null;
    upload_status: "missing" | "analyzed" | "failed";
    uploaded_at: string | null;
  };
  analysis: SvgAnalysisJson | null;
  layerRoleSetup: LayerRoleSetup;
  letterGroupFinishes: LetterGroupFinish[];
  parseError: string | null;
};

export function createEmptyArtworkState(): ArtworkIntakeState {
  return {
    file: null,
    svgText: null,
    svgSource: {
      file_name: null,
      file_size_bytes: null,
      mime_type: null,
      upload_status: "missing",
      uploaded_at: null,
    },
    analysis: null,
    layerRoleSetup: { confirmation_status: "missing", layers: [] },
    letterGroupFinishes: [],
    parseError: null,
  };
}
