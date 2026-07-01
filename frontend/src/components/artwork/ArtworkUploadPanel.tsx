import { useRef } from "react";

import { readSvgFile } from "../../lib/svg/svgMetadata";
import {
  buildLayerRoleSetupFromAnalysis,
  buildLetterGroupsFromLayers,
  recomputeLayerRoleSetupConfirmation,
} from "../../lib/artwork/layerRoleSetup";
import type { ArtworkIntakeState } from "../../types/artwork";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { LetterGroupFinishesPanel } from "./LetterGroupFinishesPanel";
import { SvgMetadataPanel } from "./SvgMetadataPanel";
import { SvgLayerList } from "./SvgLayerList";

type ArtworkUploadPanelProps = {
  state: ArtworkIntakeState;
  onChange: (state: ArtworkIntakeState) => void;
  disabled?: boolean;
  finishTypeOptions: string[];
  returnFinishOptions: string[];
  defaultReturnDepthMm: number | null;
};

export function ArtworkUploadPanel({
  state,
  onChange,
  disabled = false,
  finishTypeOptions,
  returnFinishOptions,
  defaultReturnDepthMm,
}: ArtworkUploadPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }
    const result = await readSvgFile(file);
    if (!result.ok) {
      onChange({
        ...state,
        file,
        parseError: result.error,
        svgSource: {
          ...state.svgSource,
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type || "image/svg+xml",
          upload_status: "failed",
          uploaded_at: new Date().toISOString(),
        },
      });
      return;
    }

    const layerRoleSetup = buildLayerRoleSetupFromAnalysis(result.analysis);
    const letterGroupFinishes = buildLetterGroupsFromLayers(layerRoleSetup, [], {
      face_finish_type: finishTypeOptions[0] ?? null,
      return_finish_type: returnFinishOptions[0] ?? null,
      return_depth_mm: defaultReturnDepthMm,
    });

    onChange({
      ...state,
      file,
      svgText: result.svgText,
      parseError: null,
      analysis: result.analysis,
      layerRoleSetup,
      letterGroupFinishes,
      svgSource: {
        file_name: file.name,
        file_size_bytes: file.size,
        mime_type: file.type || "image/svg+xml",
        upload_status: "analyzed",
        uploaded_at: new Date().toISOString(),
      },
    });
  }

  function handleLayerSetupChange(nextSetup: ArtworkIntakeState["layerRoleSetup"]) {
    const setup = recomputeLayerRoleSetupConfirmation(nextSetup);
    const letterGroupFinishes = buildLetterGroupsFromLayers(setup, state.letterGroupFinishes, {
      face_finish_type: finishTypeOptions[0] ?? null,
      return_finish_type: returnFinishOptions[0] ?? null,
      return_depth_mm: defaultReturnDepthMm,
    });
    onChange({ ...state, layerRoleSetup: setup, letterGroupFinishes });
  }

  return (
    <div className="artwork-panel">
      <div className="note artwork-note">
        <Badge tone="default">Artwork intake</Badge> Layer roles are operator-confirmed intake truth. Pricing still
        comes from backend preview rules — not from this panel.
      </div>

      <div className="field-grid">
        <label className="field full">
          <span className="field-label-row">SVG artwork file</span>
          <input
            ref={inputRef}
            type="file"
            accept=".svg,image/svg+xml"
            disabled={disabled}
            onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
          />
          <small className="field-hint">Upload vector artwork. Geometry metrics stay null until operator confirms or enters them.</small>
        </label>
      </div>

      {state.parseError ? <div className="error-box">{state.parseError}</div> : null}

      {state.analysis ? <SvgMetadataPanel analysis={state.analysis} svgSource={state.svgSource} /> : null}

      {state.layerRoleSetup.layers.length > 0 ? (
        <SvgLayerList setup={state.layerRoleSetup} disabled={disabled} onChange={handleLayerSetupChange} />
      ) : null}

      {state.letterGroupFinishes.length > 0 ? (
        <LetterGroupFinishesPanel
          groups={state.letterGroupFinishes}
          disabled={disabled}
          finishTypeOptions={finishTypeOptions}
          returnFinishOptions={returnFinishOptions}
          onChange={(letterGroupFinishes) => onChange({ ...state, letterGroupFinishes })}
        />
      ) : null}

      {state.analysis ? (
        <div className="actions artwork-actions">
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            Replace SVG
          </Button>
        </div>
      ) : null}
    </div>
  );
}
