"use client";

import { useState } from "react";
import { Radio, Send, RefreshCw, ExternalLink, Globe } from "lucide-react";
import { REMIT_CONTRACT_ID } from "@/lib/stellar/config";
import { explorerContractUrl } from "@/lib/utils";

// ── Mock live event feed ─────────────────────────────────────────────────────

const MOCK_EVENTS = [
  {
    id: "evt-001",
    type: "remittance_sent",
    sender: "GCMVN...EQD",
    recipient: "GCLLR...VUC",
    corridor: "XLMINR",
    corridorLabel: "XLM → INR",
    flag: "🇮🇳",
    amountIn: "100.00 XLM",
    amountOut: "8,258.50 INR",
    fee: "0.50 XLM",
    time: "Just now",
    hash: "abc1234def",
  },
  {
    id: "evt-002",
    type: "remittance_sent",
    sender: "GDZUB...KMQ",
    recipient: "GBHMK...PZX",
    corridor: "XLMPHP",
    corridorLabel: "XLM → PHP",
    flag: "🇵🇭",
    amountIn: "50.00 XLM",
    amountOut: "2,810.87 PHP",
    fee: "0.25 XLM",
    time: "2 min ago",
    hash: "bcd2345efg",
  },
  {
    id: "evt-003",
    type: "fx_rate_updated",
    sender: "Admin",
    recipient: "Corridor: XLMUSD",
    corridor: "XLMUSD",
    corridorLabel: "XLM → USD",
    flag: "🇺🇸",
    amountIn: "Old: 0.098 USD",
    amountOut: "New: 0.100 USD",
    fee: "—",
    time: "5 min ago",
    hash: "cde3456fgh",
  },
  {
    id: "evt-004",
    type: "remittance_sent",
    sender: "GBNKP...WQR",
    recipient: "GCPQR...STU",
    corridor: "XLMBDT",
    corridorLabel: "XLM → BDT",
    flag: "🇧🇩",
    amountIn: "250.00 XLM",
    amountOut: "2,736.25 BDT",
    fee: "1.25 XLM",
    time: "12 min ago",
    hash: "def4567ghi",
  },
  {
    id: "evt-005",
    type: "remittance_sent",
    sender: "GCPQR...STU",
    recipient: "GCMVN...EQD",
    corridor: "XLMNGN",
    corridorLabel: "XLM → NGN",
    flag: "🇳🇬",
    amountIn: "500.00 XLM",
    amountOut: "79,600.00 NGN",
    fee: "2.50 XLM",
    time: "18 min ago",
    hash: "efg5678hij",
  },
];

export default function ActivityPage() {
  const [filter, setFilter] = useState<"all" | "remittance" | "rates">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = MOCK_EVENTS.filter((e) => {
    if (filter === "remittance") return e.type === "remittance_sent";
    if (filter === "rates")      return e.type === "fx_rate_updated";
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="badge-emerald inline-flex">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Live Event Log
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            Activity <span className="gradient-text">Feed</span>
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }} className="text-lg">
            Real-time on-chain remittance events emitted by the StellarRemit contract.
          </p>
        </div>

        <button
          id="refresh-feed-btn"
          onClick={handleRefresh}
          className="btn-ghost px-4 py-2.5 text-sm font-semibold gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2">
        {[
          { key: "all", label: "All Events" },
          { key: "remittance", label: "Remittances" },
          { key: "rates", label: "FX Rate Updates" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as any)}
            className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: filter === key ? "rgba(16, 185, 129, 0.15)" : "var(--color-surface)",
              border: `1px solid ${filter === key ? "rgba(16, 185, 129, 0.3)" : "var(--color-border)"}`,
              color: filter === key ? "var(--color-primary-light)" : "var(--color-text-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Events Feed Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table-remit">
            <thead>
              <tr>
                <th>Event</th>
                <th>Sender</th>
                <th>Recipient / Corridor</th>
                <th className="text-right">Sent</th>
                <th className="text-right">Received</th>
                <th className="text-right hidden sm:table-cell">Fee</th>
                <th className="text-right hidden md:table-cell">Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((evt) => (
                <tr key={evt.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{
                          background: evt.type === "remittance_sent"
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(245, 158, 11, 0.12)",
                        }}
                      >
                        {evt.type === "remittance_sent" ? (
                          <Send className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                        ) : (
                          <Globe className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-xs" style={{ color: "var(--color-text-primary)" }}>
                          {evt.type === "remittance_sent" ? "Remittance" : "FX Rate Update"}
                        </div>
                        <div className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>
                          {evt.corridor} {evt.flag}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {evt.sender}
                  </td>
                  <td className="text-xs" style={{ color: "var(--color-text-secondary)" }}>
                    {evt.recipient}
                  </td>
                  <td className="text-right font-mono text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    {evt.amountIn}
                  </td>
                  <td className="text-right font-mono text-xs font-bold gradient-text">
                    {evt.amountOut}
                  </td>
                  <td className="text-right font-mono text-xs hidden sm:table-cell" style={{ color: "var(--color-text-muted)" }}>
                    {evt.fee}
                  </td>
                  <td className="text-right text-xs hidden md:table-cell" style={{ color: "var(--color-text-muted)" }}>
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{evt.time}</span>
                      <a
                        href={explorerContractUrl(REMIT_CONTRACT_ID)}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-emerald-400 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
