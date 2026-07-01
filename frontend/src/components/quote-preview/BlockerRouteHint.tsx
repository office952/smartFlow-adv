import type { QuoteBlocker } from "../../lib/api";
import { formatBlockerHeadline, routeBlocker } from "../../lib/blockerRouting";
import { BLOCKER_HINTS } from "../../lib/quotePreviewUtils";

type BlockerRouteHintProps = {
  blocker: QuoteBlocker;
  linkIntakeSections?: boolean;
};

export function BlockerRouteHint({ blocker, linkIntakeSections = false }: BlockerRouteHintProps) {
  const route = routeBlocker(blocker);
  const headline = formatBlockerHeadline(blocker);

  const anchorHref =
    route.anchor && !route.anchor.startsWith("review-")
      ? `#${route.anchor}`
      : linkIntakeSections && route.anchor
        ? `/workspaces/new#${route.anchor}`
        : null;

  return (
    <div className="blocker-route-hint">
      <p className="blocker-route-hint__headline">
        <strong>{headline}</strong>
      </p>
      <p className="blocker-route-hint__message">{blocker.message}</p>
      <dl className="blocker-route-hint__route">
        <div>
          <dt>Secțiune</dt>
          <dd>{route.section}</dd>
        </div>
        <div>
          <dt>Acțiune</dt>
          <dd>
            {anchorHref ? (
              <a href={anchorHref} className="blocker-route-hint__link">
                {route.action}
              </a>
            ) : (
              route.action
            )}
          </dd>
        </div>
      </dl>
      {BLOCKER_HINTS[blocker.code] ? (
        <p className="blocker-route-hint__backend-note">{BLOCKER_HINTS[blocker.code]}</p>
      ) : null}
    </div>
  );
}
