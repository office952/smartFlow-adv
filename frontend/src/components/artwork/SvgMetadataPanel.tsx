import type { ArtworkIntakeState, SvgAnalysisJson } from "../../types/artwork";
import { Card } from "../ui/Card";

type SvgMetadataPanelProps = {
  analysis: SvgAnalysisJson;
  svgSource: ArtworkIntakeState["svgSource"];
};

export function SvgMetadataPanel({ analysis, svgSource }: SvgMetadataPanelProps) {
  return (
    <Card title="SVG metadata" className="svg-metadata-card">
      <dl className="metadata-grid">
        <div>
          <dt>File</dt>
          <dd>{svgSource.file_name ?? "—"}</dd>
        </div>
        <div>
          <dt>Size</dt>
          <dd>{svgSource.file_size_bytes != null ? `${svgSource.file_size_bytes} bytes` : "—"}</dd>
        </div>
        <div>
          <dt>Dimensions</dt>
          <dd>
            {analysis.width ?? "?"}
            {" × "}
            {analysis.height ?? "?"}
          </dd>
        </div>
        <div>
          <dt>viewBox</dt>
          <dd>{analysis.viewBox ?? "—"}</dd>
        </div>
        <div>
          <dt>Groups</dt>
          <dd>{analysis.group_count}</dd>
        </div>
        <div>
          <dt>Paths/shapes</dt>
          <dd>{analysis.path_count}</dd>
        </div>
        <div>
          <dt>Parser</dt>
          <dd>{analysis.parser_version}</dd>
        </div>
      </dl>
    </Card>
  );
}
