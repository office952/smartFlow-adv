import type {
  ArtworkIntakeState,
  LayerRole,
  LayerRoleEntry,
  LayerRoleSetup,
  LetterGroupFinish,
  SvgAnalysisJson,
} from "../../types/artwork";
import { suggestLayerRole } from "../svg/svgMetadata";

export function buildLayerRoleSetupFromAnalysis(analysis: SvgAnalysisJson): LayerRoleSetup {
  const layers: LayerRoleEntry[] = analysis.layers.map((layer) => {
    const suggested = suggestLayerRole(layer.layer_name);
    return {
      layer_id: layer.layer_id,
      layer_name: layer.layer_name,
      source: layer.source,
      suggested_role: suggested,
      confirmed_role: suggested,
      confirmed: false,
      ignored: suggested === "reference" || suggested === "ignored",
      path_count: layer.path_count,
      metrics: {
        face_area_m2: null,
        perimeter_m: null,
      },
    };
  });

  return {
    confirmation_status: layers.length > 0 ? "draft" : "missing",
    layers,
  };
}

export function recomputeLayerRoleSetupConfirmation(setup: LayerRoleSetup): LayerRoleSetup {
  const active = setup.layers.filter((layer) => !layer.ignored);
  if (active.length === 0) {
    return { ...setup, confirmation_status: setup.layers.length > 0 ? "partial" : "missing" };
  }
  const allConfirmed = active.every((layer) => layer.confirmed && layer.confirmed_role !== "unknown");
  const anyConfirmed = active.some((layer) => layer.confirmed);
  let status: LayerRoleSetup["confirmation_status"] = "draft";
  if (allConfirmed) {
    status = "confirmed";
  } else if (anyConfirmed) {
    status = "partial";
  }
  return { ...setup, confirmation_status: status };
}

export function updateLayerRole(
  setup: LayerRoleSetup,
  layerId: string,
  patch: Partial<Pick<LayerRoleEntry, "confirmed_role" | "confirmed" | "ignored">>,
): LayerRoleSetup {
  const layers = setup.layers.map((layer) =>
    layer.layer_id === layerId
      ? {
          ...layer,
          ...patch,
          confirmed: patch.ignored ? false : (patch.confirmed ?? layer.confirmed),
        }
      : layer,
  );
  return recomputeLayerRoleSetupConfirmation({ ...setup, layers });
}

export function confirmAllLayerRoles(setup: LayerRoleSetup): LayerRoleSetup {
  const layers = setup.layers.map((layer) =>
    layer.ignored
      ? layer
      : {
          ...layer,
          confirmed_role: layer.confirmed_role === "unknown" ? layer.suggested_role : layer.confirmed_role,
          confirmed: true,
        },
  );
  return recomputeLayerRoleSetupConfirmation({ ...setup, layers });
}

export function buildLetterGroupsFromLayers(
  setup: LayerRoleSetup,
  existing: LetterGroupFinish[],
  defaults: { return_depth_mm: number | null; return_finish_type: string | null; face_finish_type: string | null },
): LetterGroupFinish[] {
  const existingByKey = new Map(existing.map((row) => [row.group_key, row]));
  const faceLayers = setup.layers.filter(
    (layer) => !layer.ignored && (layer.confirmed_role === "face" || layer.suggested_role === "face"),
  );

  return faceLayers.map((layer) => {
    const prior = existingByKey.get(layer.layer_id);
    return {
      group_key: layer.layer_id,
      layer_name: layer.layer_name,
      role: layer.confirmed_role,
      face_area_m2: prior?.face_area_m2 ?? layer.metrics.face_area_m2,
      perimeter_m: prior?.perimeter_m ?? layer.metrics.perimeter_m,
      face_finish_type: prior?.face_finish_type ?? defaults.face_finish_type,
      face_oracal_code: prior?.face_oracal_code ?? null,
      return_finish_type: prior?.return_finish_type ?? defaults.return_finish_type,
      return_depth_mm: prior?.return_depth_mm ?? defaults.return_depth_mm,
      face_vinyl_roll_width_mm: prior?.face_vinyl_roll_width_mm ?? null,
      confirmed: prior?.confirmed ?? false,
    };
  });
}

export function deriveQuoteGeometryFromArtwork(
  analysis: SvgAnalysisJson | null,
  letterGroups: LetterGroupFinish[],
  layerSetup: LayerRoleSetup,
): {
  width_mm: number | null;
  height_mm: number | null;
  letter_count: number | null;
  letter_face_area_m2: number | null;
  letter_perimeter_m: number | null;
  cut_length_ml: number | null;
  finish_area_m2: number | null;
} {
  const confirmedGroups = letterGroups.filter((group) => group.confirmed);
  const groupsForCount =
    confirmedGroups.length > 0
      ? confirmedGroups
      : letterGroups.filter((group) => group.role === "face");

  let faceArea: number | null = null;
  let perimeter: number | null = null;

  const sumMetric = (key: "face_area_m2" | "perimeter_m", confirmedOnly: boolean) => {
    const rows = confirmedOnly ? letterGroups.filter((g) => g.confirmed) : letterGroups;
    let total = 0;
    let counted = 0;
    for (const row of rows) {
      const value = row[key];
      if (value !== null && value > 0) {
        total += value;
        counted += 1;
      }
    }
    return counted > 0 ? total : null;
  };

  faceArea = sumMetric("face_area_m2", true) ?? sumMetric("face_area_m2", false);
  perimeter = sumMetric("perimeter_m", true) ?? sumMetric("perimeter_m", false);

  const confirmedFaceLayers = layerSetup.layers.filter(
    (layer) => layer.confirmed && !layer.ignored && layer.confirmed_role === "face",
  );

  return {
    width_mm: analysis?.width ?? null,
    height_mm: analysis?.height ?? null,
    letter_count:
      confirmedGroups.length > 0
        ? confirmedGroups.length
        : confirmedFaceLayers.length > 0
          ? confirmedFaceLayers.length
          : groupsForCount.length > 0
            ? groupsForCount.length
            : null,
    letter_face_area_m2: faceArea,
    letter_perimeter_m: perimeter,
    cut_length_ml: perimeter,
    finish_area_m2: faceArea,
  };
}

export function artworkHasParsedSvg(state: ArtworkIntakeState): boolean {
  return state.analysis !== null && state.svgSource.upload_status === "analyzed";
}
