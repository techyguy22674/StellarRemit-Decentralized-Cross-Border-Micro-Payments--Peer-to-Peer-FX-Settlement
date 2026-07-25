"use client";

import { useState } from "react";
import { Plus, Globe, Search } from "lucide-react";
import type { Metadata } from "next";
import { CORRIDORS } from "@/lib/stellar/config";
import { CorridorCard } from "@/components/remit/CorridorCard";
import { AddCorridorModal } from "@/components/remit/AddCorridorModal";
import { useWalletStore } from "@/store/wallet-store";
import { DEPLOYER_ADDRESS } from "@/lib/stellar/config";

export default function CorridorsPage() {
  const { isConnected, address } = useWalletStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");

  const isAdmin = isConnected && address === DEPLOYER_ADDRESS;

  const filteredCorridors = CORRIDORS.filter(
    (c) =>
      c.id.toLowerCase().includes(search.toLowerCase()) ||
      c.label.toLowerCase().includes(search.toLowerCase()) ||
      c.to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="badge-emerald inline-flex">
            <Globe className="w-3.5 h-3.5" />
            {CORRIDORS.length} Active Corridors
          </div>
          <h1
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            FX <span className="gradient-text">Corridors</span>
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }} className="text-lg">
            On-chain FX settlement rates. Powered by the StellarRemit oracle.
          </p>
        </div>

        {isAdmin && (
          <button
            id="add-corridor-open-btn"
            className="btn-amber px-5 py-2.5 text-sm font-bold flex items-center gap-2"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Add Corridor
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div
        className="grid grid-cols-3 gap-4 p-5 rounded-2xl"
        style={{
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
        }}
      >
        {[
          { label: "Total 24h Volume", value: "$71,020" },
          { label: "Total Transactions", value: "475" },
          { label: "Protocol Fee", value: "0.5% (50 bps)" },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-xl md:text-2xl font-extrabold gradient-text">{value}</div>
            <div className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
          style={{ color: "var(--color-text-muted)" }}
        />
        <input
          id="corridor-search"
          type="text"
          placeholder="Search corridors..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-stellar pl-10"
        />
      </div>

      {/* Corridor Grid */}
      {filteredCorridors.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCorridors.map((corridor) => (
            <CorridorCard key={corridor.id} corridor={corridor} />
          ))}
        </div>
      ) : (
        <div
          className="glass-card p-12 text-center"
          id="no-corridors-found"
        >
          <Globe
            className="w-12 h-12 mx-auto mb-4"
            style={{ color: "var(--color-text-muted)" }}
          />
          <h3 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
            No corridors found
          </h3>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-muted)" }}>
            Try a different search term or clear the filter
          </p>
        </div>
      )}

      {/* Add Corridor Modal */}
      <AddCorridorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={(id) => console.log("Corridor added:", id)}
      />
    </div>
  );
}
