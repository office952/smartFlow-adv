import type { LayerRole, SvgAnalysisJson, SvgParsedLayer } from "../../types/artwork";

export const SVG_PARSER_VERSION = "smartflow-2c-1.0.0";

const SHAPE_TAGS = new Set(["path", "rect", "circle", "ellipse", "polygon", "polyline", "line"]);

function parseLength(raw: string | null | undefined): number | null {
  if (!raw) {
    return null;
  }
  const cleaned = raw.trim().replace(/mm|px|pt|cm|in/gi, "");
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function layerLabel(element: Element): string {
  const inkscape = element.getAttributeNS("http://www.inkscape.org/namespaces/inkscape", "label");
  if (inkscape?.trim()) {
    return inkscape.trim();
  }
  const dataName = element.getAttribute("data-name");
  if (dataName?.trim()) {
    return dataName.trim();
  }
  const id = element.getAttribute("id");
  if (id?.trim()) {
    return id.trim();
  }
  return "unnamed-layer";
}

function layerSource(element: Element): SvgParsedLayer["source"] {
  if (element.getAttributeNS("http://www.inkscape.org/namespaces/inkscape", "label")) {
    return "g_label";
  }
  if (element.getAttribute("data-name")) {
    return "g_data_name";
  }
  if (element.getAttribute("id")) {
    return "g_id";
  }
  return "top_level";
}

function countShapes(root: Element): number {
  let count = 0;
  for (const tag of SHAPE_TAGS) {
    count += root.getElementsByTagName(tag).length;
  }
  return count;
}

function countDirectChildGroups(element: Element): number {
  return Array.from(element.children).filter((child) => child.tagName.toLowerCase() === "g").length;
}

function extractLayers(svgRoot: SVGSVGElement): SvgParsedLayer[] {
  const groups = Array.from(svgRoot.querySelectorAll("g"));
  const layers: SvgParsedLayer[] = [];
  const seen = new Set<string>();

  for (const group of groups) {
    const id = group.getAttribute("id") ?? group.getAttribute("data-name") ?? layerLabel(group);
    const layerId = id.trim() || `layer-${layers.length + 1}`;
    if (seen.has(layerId)) {
      continue;
    }
    seen.add(layerId);
    layers.push({
      layer_id: layerId,
      layer_name: layerLabel(group),
      source: layerSource(group),
      path_count: countShapes(group),
      child_group_count: countDirectChildGroups(group),
    });
  }

  if (layers.length === 0) {
    layers.push({
      layer_id: "root",
      layer_name: svgRoot.getAttribute("id")?.trim() || "SVG root",
      source: "top_level",
      path_count: countShapes(svgRoot),
      child_group_count: countDirectChildGroups(svgRoot),
    });
  }

  return layers;
}

export function suggestLayerRole(layerName: string): LayerRole {
  const normalized = layerName.toLowerCase();
  if (/(logo|emblem|artwork|print)/.test(normalized)) {
    return "print";
  }
  if (/(back|spate|rear)/.test(normalized)) {
    return "back";
  }
  if (/(cant|return|lateral|side)/.test(normalized)) {
    return "return_cant";
  }
  if (/(support|struct|bar|mount)/.test(normalized)) {
    return "support";
  }
  if (/(cut|contur|outline)/.test(normalized)) {
    return "cut";
  }
  if (/(paint|vops|finish)/.test(normalized)) {
    return "paint";
  }
  if (/(ref|guide|grid|background|bg)/.test(normalized)) {
    return "reference";
  }
  if (/(face|fata|letter|litera|text)/.test(normalized)) {
    return "face";
  }
  return "unknown";
}

export type SvgParseResult =
  | { ok: true; analysis: SvgAnalysisJson; svgText: string }
  | { ok: false; error: string };

export function parseSvgMetadata(svgText: string): SvgParseResult {
  const trimmed = svgText.trim();
  if (!trimmed) {
    return { ok: false, error: "SVG file is empty." };
  }
  if (!trimmed.includes("<svg")) {
    return { ok: false, error: "File does not contain a valid SVG root element." };
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(trimmed, "image/svg+xml");
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    return { ok: false, error: "SVG XML could not be parsed." };
  }

  const svgRoot = doc.documentElement;
  if (!svgRoot || svgRoot.tagName.toLowerCase() !== "svg") {
    return { ok: false, error: "Missing SVG root element." };
  }

  const viewBox = svgRoot.getAttribute("viewBox");
  let width = parseLength(svgRoot.getAttribute("width"));
  let height = parseLength(svgRoot.getAttribute("height"));

  if ((!width || !height) && viewBox) {
    const parts = viewBox.split(/\s+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
      width = width ?? parts[2];
      height = height ?? parts[3];
    }
  }

  const layers = extractLayers(svgRoot as unknown as SVGSVGElement);

  return {
    ok: true,
    svgText: trimmed,
    analysis: {
      parser_version: SVG_PARSER_VERSION,
      width,
      height,
      viewBox,
      group_count: layers.length,
      path_count: countShapes(svgRoot),
      layers,
    },
  };
}

export async function readSvgFile(file: File): Promise<SvgParseResult> {
  if (!file.name.toLowerCase().endsWith(".svg") && file.type !== "image/svg+xml") {
    return { ok: false, error: "Only SVG files are supported in Phase 2C." };
  }
  try {
    const text = await file.text();
    return parseSvgMetadata(text);
  } catch {
    return { ok: false, error: "Could not read SVG file." };
  }
}
