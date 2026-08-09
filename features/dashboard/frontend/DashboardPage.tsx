"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardSummary } from "../contracts/types";
import { api, formatMoney, stageLabel } from "../../../app/platform/http/api";

export function DashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ dashboard: DashboardSummary }>("/api/dashboard")
      .then((payload) => {
        if (!cancelled) setData(payload.dashboard);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>A live snapshot of companies, people, and open pipeline.</p>
        </div>
        <Link className="btn" href="/deals">
          Open pipeline
        </Link>
      </header>

      {error ? <p className="error">{error}</p> : null}

      <div className="stats">
        <article className="stat">
          <div className="label">Companies</div>
          <div className="value">{data?.companyCount ?? "—"}</div>
        </article>
        <article className="stat">
          <div className="label">Contacts</div>
          <div className="value">{data?.contactCount ?? "—"}</div>
        </article>
        <article className="stat">
          <div className="label">Open deals</div>
          <div className="value">{data?.openDealCount ?? "—"}</div>
        </article>
        <article className="stat">
          <div className="label">Pipeline value</div>
          <div className="value">
            {data ? formatMoney(data.pipelineValueCents) : "—"}
          </div>
        </article>
      </div>

      <div className="grid-2">
        <section className="panel" aria-labelledby="recent-deals-heading">
          <div className="panel-header">
            <h2 id="recent-deals-heading">Recent deals</h2>
          </div>
          {!data ? (
            <p className="empty">Loading…</p>
          ) : data.recentDeals.length === 0 ? (
            <p className="empty">No deals yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Deal</th>
                  <th scope="col">Stage</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.recentDeals.map((deal) => (
                  <tr key={deal.id}>
                    <td>
                      <strong>{deal.title}</strong>
                      <div className="muted">{deal.companyName ?? "No company"}</div>
                    </td>
                    <td>
                      <span className={`badge ${deal.stage}`}>
                        {stageLabel(deal.stage)}
                      </span>
                    </td>
                    <td>{formatMoney(deal.valueCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="panel" aria-labelledby="pipeline-heading">
          <div className="panel-header">
            <h2 id="pipeline-heading">Pipeline by stage</h2>
          </div>
          {!data ? (
            <p className="empty">Loading…</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Stage</th>
                  <th scope="col">Deals</th>
                  <th scope="col">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.pipeline.map((row) => (
                  <tr key={row.stage}>
                    <td>{stageLabel(row.stage)}</td>
                    <td>{row.count}</td>
                    <td>{formatMoney(row.totalCents)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </section>
  );
}
