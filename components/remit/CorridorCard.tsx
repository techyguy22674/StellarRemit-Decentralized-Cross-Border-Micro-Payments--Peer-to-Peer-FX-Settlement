"use client";

import { ExternalLink, TrendingUp, DollarSign, Activity } from "lucide-react";
import { CORRIDORS } from "@/lib/stellar/config";
import { explorerContractUrl } from "@/lib/utils";
import Link from "next/link";

interface CorridorCardProps {
  corridor: typeof CORRIDORS[0];
  volume?: string;
  txCount?: number;
  isActive?: boolean;
}

// Simulated live data
const MOCK_DATA: Record<string, { volume: string; txCount: number; change: string; isUp: boolean }> = {
  XLMINR: { volume: "$12,450", txCount: 89, change: "+2.4%", isUp: true },
  XLMPHP: { volume: "$8,320",  txCount: 54, change: "+1.1%", isUp: true },
  XLMUSD: { volume: "$31,200", txCount: 201, change: "-0.3%", isUp: false },
  XLMBDT: { volume: "$5,670",  txCount: 37, change: "+5.2%", isUp: true },
  XLMNGN: { volume: "$9,180",  txCount: 66, change: "+0.8%", isUp: true },
  XLMMXN: { volume: "$4,200",  txCount: 28, change: "+3.1%", isUp: true },
};

const FX_RATES: Record<string, number> = {
  XLMINR: 83.0,
  XLMPHP: 56.5,
  XLMUSD: 0.10,
  XLMBDT: 11.0,
  XLMNGN: 160.0,
  XLMMXN: 1.70,
};

export function CorridorCard({ corridor }: CorridorCardProps) {
  const data = MOCK_DATA[corridor.id] || { volume: "$0", txCount: 0, change: "0%", isUp: true };
  const rate = FX_RATES[corridor.id] || 0;

  return (
    <div
      className="glass-card p-6 space-y-5 group hover:border-emerald-500/30 transition-all duration-300"
      id={`corridor-card-${corridor.id.toLowerCase()}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{corridor.flag}</div>
          <div>
            <h3
              className="font-bold text-base"
              style={{ color: "var(--color-text-primary)" }}
            >
              {corridor.label}
            </h3>
            <div className="corridor-badge mt-1">{corridor.id}</div>
          </div>
        </div>
        <a
          href={explorerContractUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <ExternalLink className="w-4 h-4" style={{ color: "var(--color-text-muted)" }} />
        </a>
      </div>

      {/* FX Rate */}
      <div
        className="p-4 rounded-xl space-y-1"
        style={{
          background: "rgba(16, 185, 129, 0.04)",
          border: "1px solid rgba(16, 185, 129, 0.12)",
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Current FX Rate
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-extrabold gradient-text">{rate}</span>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            {corridor.to}/XLM
          </span>
        </div>
        <div
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: data.isUp ? "var(--color-primary)" : "var(--color-error)" }}
        >
          <TrendingUp className="w-3 h-3" />
          {data.change} 24h
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="p-3 rounded-xl text-center"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="w-3 h-3" style={{ color: "var(--color-accent)" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              24h Volume
            </span>
          </div>
          <div className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            {data.volume}
          </div>
        </div>
        <div
          className="p-3 rounded-xl text-center"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
        >
          <div className="flex items-center justify-center gap-1 mb-1">
            <Activity className="w-3 h-3" style={{ color: "var(--color-primary)" }} />
            <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
              Transactions
            </span>
          </div>
          <div className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            {data.txCount}
          </div>
        </div>
      </div>

      {/* Fee */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Protocol Fee</span>
        <span
          className="text-xs font-bold px-2 py-1 rounded-full"
          style={{
            background: "rgba(245, 158, 11, 0.1)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "var(--color-accent)",
          }}
        >
          0.5% (50 bps)
        </span>
      </div>

      {/* CTA */}
      <Link
        href="/send"
        className="btn-stellar w-full justify-center py-3 text-sm"
        id={`send-via-${corridor.id.toLowerCase()}`}
      >
        Send via {corridor.id}
      </Link>
    </div>
  );
}
