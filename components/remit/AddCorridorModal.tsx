"use client";

import { useState } from "react";
import { X, Globe, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useWalletStore } from "@/store/wallet-store";

interface AddCorridorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (corridorId: string) => void;
}

const CURRENCY_OPTIONS = [
  { code: "INR", name: "Indian Rupee", flag: "🇮🇳", suggestedRate: "83000000" },
  { code: "PHP", name: "Philippine Peso", flag: "🇵🇭", suggestedRate: "56500000" },
  { code: "USD", name: "US Dollar", flag: "🇺🇸", suggestedRate: "100000" },
  { code: "BDT", name: "Bangladeshi Taka", flag: "🇧🇩", suggestedRate: "11000000" },
  { code: "NGN", name: "Nigerian Naira", flag: "🇳🇬", suggestedRate: "160000000" },
  { code: "MXN", name: "Mexican Peso", flag: "🇲🇽", suggestedRate: "1700000" },
  { code: "PKR", name: "Pakistani Rupee", flag: "🇵🇰", suggestedRate: "27000000" },
  { code: "BRL", name: "Brazilian Real", flag: "🇧🇷", suggestedRate: "500000" },
];

export function AddCorridorModal({ isOpen, onClose, onSuccess }: AddCorridorModalProps) {
  const { isConnected, address } = useWalletStore();
  const [destinationCurrency, setDestinationCurrency] = useState(CURRENCY_OPTIONS[0].code);
  const [rate, setRate] = useState(CURRENCY_OPTIONS[0].suggestedRate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const selectedCurrency = CURRENCY_OPTIONS.find((c) => c.code === destinationCurrency) || CURRENCY_OPTIONS[0];
  const corridorId = `XLM${destinationCurrency}`;
  const rateDisplay = (parseInt(rate) / 1_000_000).toFixed(4);

  const handleAddCorridor = async () => {
    if (!isConnected) return;
    setIsLoading(true);
    setError(null);

    try {
      // Simulate: call contract.set_fx_rate(admin, corridorId, rate)
      await new Promise((r) => setTimeout(r, 2000));
      setSuccess(true);
      onSuccess?.(corridorId);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add corridor. Admin access required.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(8px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card-elevated p-6 w-full max-w-md space-y-5 animate-fade-in"
        id="add-corridor-modal"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #10B981, #059669)",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
                Add FX Corridor
              </h2>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Admin function · Sets on-chain FX rate
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 rounded-xl"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>

        <div className="stream-bar" />

        {/* Destination Currency */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            Destination Currency
          </label>
          <div className="grid grid-cols-4 gap-2">
            {CURRENCY_OPTIONS.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  setDestinationCurrency(c.code);
                  setRate(c.suggestedRate);
                }}
                className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all"
                style={{
                  background: destinationCurrency === c.code
                    ? "rgba(16, 185, 129, 0.12)"
                    : "var(--color-bg)",
                  border: `1px solid ${destinationCurrency === c.code
                    ? "rgba(16, 185, 129, 0.35)"
                    : "var(--color-border)"}`,
                }}
              >
                <span className="text-lg">{c.flag}</span>
                <span
                  className="text-[10px] font-bold"
                  style={{
                    color: destinationCurrency === c.code
                      ? "var(--color-primary)"
                      : "var(--color-text-muted)",
                  }}
                >
                  {c.code}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Corridor Preview */}
        <div
          className="p-3 rounded-xl flex items-center justify-between"
          style={{
            background: "rgba(16, 185, 129, 0.05)",
            border: "1px solid rgba(16, 185, 129, 0.15)",
          }}
        >
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
            Corridor ID
          </span>
          <div className="corridor-badge">{corridorId}</div>
        </div>

        {/* FX Rate */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            FX Rate (scaled × 10⁶)
          </label>
          <input
            id="fx-rate-input"
            type="number"
            min="1"
            placeholder="e.g. 83000000"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="input-stellar font-mono"
          />
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            = 1 XLM → <strong style={{ color: "var(--color-primary)" }}>{rateDisplay}</strong>{" "}
            {selectedCurrency.name}
          </p>
        </div>

        {/* Admin Warning */}
        <div
          className="p-3 rounded-xl flex items-start gap-2 text-sm"
          style={{
            background: "rgba(245, 158, 11, 0.07)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "var(--color-accent)",
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span className="text-xs">
            This calls <code className="font-mono">set_fx_rate()</code> on the StellarRemit
            contract. Admin authorization required.
          </span>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--color-error)",
            }}
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            className="flex items-center gap-2 p-3 rounded-xl text-sm"
            style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
              color: "var(--color-primary)",
            }}
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            Corridor {corridorId} added successfully!
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose}>
            Cancel
          </button>
          <button
            id="add-corridor-btn"
            className="btn-stellar flex-1"
            onClick={handleAddCorridor}
            disabled={!isConnected || isLoading || !rate || parseInt(rate) <= 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding…
              </>
            ) : (
              <>
                <Globe className="w-4 h-4" />
                Add Corridor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
