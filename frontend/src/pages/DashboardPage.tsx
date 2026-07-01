import { useEffect, useState } from "react";

import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Section } from "../components/ui/Section";
import { CommercialQuote, QuotePreview, WorkspaceSummary, listCommercialQuotes, listQuotePreviews, listWorkspaces } from "../lib/api";


export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [previews, setPreviews] = useState<QuotePreview[]>([]);
  const [quotes, setQuotes] = useState<CommercialQuote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [workspaceData, previewData, quoteData] = await Promise.all([
          listWorkspaces(),
          listQuotePreviews(),
          listCommercialQuotes(),
        ]);
        if (!active) {
          return;
        }
        setWorkspaces(workspaceData);
        setPreviews(previewData);
        setQuotes(quoteData);
      } catch (cause) {
        if (!active) {
          return;
        }
        setError(cause instanceof Error ? cause.message : "Failed to load dashboard data.");
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Workspace intake status, quote preview readiness, and backend-reported commercial records."
        actions={
          <Button as="link" to="/workspaces/new">
            New workspace
          </Button>
        }
      />

      <div className="stats">
        <article className="stat">
          <span>Workspaces</span>
          <strong>{workspaces.length}</strong>
        </article>
        <article className="stat">
          <span>Quote previews</span>
          <strong>{previews.length}</strong>
        </article>
        <article className="stat">
          <span>Commercial policy</span>
          <strong>Backend truth</strong>
        </article>
        <article className="stat">
          <span>Quotes</span>
          <strong>{quotes.length}</strong>
        </article>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="grid-two">
        <Section title="Workspaces">
          {workspaces.length === 0 ? (
            <EmptyState
              title="No workspaces yet"
              description="Create the first intake workspace. Future forms will be driven by product systems."
              action={
                <Button as="link" to="/workspaces/new" variant="secondary">
                  Create workspace
                </Button>
              }
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((workspace) => (
                  <tr key={workspace.id}>
                    <td>
                      <Button as="link" to={`/workspaces/${workspace.id}`} variant="ghost" className="table-link-button">
                        {workspace.title}
                      </Button>
                    </td>
                    <td>{workspace.client_name}</td>
                    <td>{workspace.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        <Section title="Last previews">
          {previews.length === 0 ? (
            <EmptyState title="No previews yet" description="Preview history appears after the first backend quote-preview request." />
          ) : (
            <div className="stack">
              {previews.slice(0, 5).map((preview) => (
                <Card key={preview.workspace_id} eyebrow={preview.client_name} title={preview.workspace_title}>
                  <p>Status: {preview.status}</p>
                  <p>Blockers: {preview.blockers.length}</p>
                </Card>
              ))}
            </div>
          )}
        </Section>

        <Section title="Commercial quotes">
          {quotes.length === 0 ? (
            <EmptyState title="No priced quotes" description="Official quotes are created only from a ready backend preview." />
          ) : (
            <div className="stack">
              {quotes.slice(0, 5).map((quote) => (
                <Card key={quote.id} eyebrow={quote.client_name} title={quote.quote_code}>
                  <p>{quote.workspace_title}</p>
                  <p>
                    Backend total: {quote.total_gross} {quote.currency}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </Section>
      </div>
    </section>
  );
}
