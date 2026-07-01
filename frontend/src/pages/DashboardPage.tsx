import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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
      <div className="page-head">
        <h2>Dashboard</h2>
        <p>Minimal V6 control room: draft workspaces, blocked previews, and owner-decision pressure points.</p>
      </div>

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
          <strong>No fake totals</strong>
        </article>
        <article className="stat">
          <span>Quotes</span>
          <strong>{quotes.length}</strong>
        </article>
      </div>

      {error ? <div className="error-box">{error}</div> : null}

      <div className="grid-two">
        <div className="summary">
          <span className="badge">Workspaces</span>
          {workspaces.length === 0 ? (
            <div className="empty">No workspaces yet. Create the first V6 intake workspace.</div>
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
                      <Link to={`/workspaces/${workspace.id}`}>{workspace.title}</Link>
                    </td>
                    <td>{workspace.client_name}</td>
                    <td>{workspace.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="summary">
          <span className="badge">Last previews</span>
          {previews.length === 0 ? (
            <div className="empty">Preview history will appear after the first quote-preview request.</div>
          ) : (
            <div className="stack">
              {previews.slice(0, 5).map((preview) => (
                <article key={preview.workspace_id} className="card">
                  <span>{preview.client_name}</span>
                  <strong>{preview.workspace_title}</strong>
                  <p>Status: {preview.status}</p>
                  <p>Blockers: {preview.blockers.length}</p>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="summary">
          <span className="badge">Commercial quotes</span>
          {quotes.length === 0 ? (
            <div className="empty">No priced quotes yet. Create one from a ready preview.</div>
          ) : (
            <div className="stack">
              {quotes.slice(0, 5).map((quote) => (
                <article key={quote.id} className="card">
                  <span>{quote.client_name}</span>
                  <strong>{quote.quote_code}</strong>
                  <p>{quote.workspace_title}</p>
                  <p>Total: {quote.total_gross} {quote.currency}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="actions">
        <Link className="button" to="/workspaces/new">
          Create workspace
        </Link>
      </div>
    </section>
  );
}
