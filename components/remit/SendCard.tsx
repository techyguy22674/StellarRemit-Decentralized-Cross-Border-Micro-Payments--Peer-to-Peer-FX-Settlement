"use client";

import { useState, useEffect } from "react";
import { Send, ChevronDown, AlertCircle, CheckCircle, Loader2, Info } from "lucide-react";
import { useWalletStore } from "@/store/wallet-store";
import { CORRIDORS, REMIT_FEE_BPS, STROOPS_PER_XLM } from "@/lib/stellar/config";
import { shortAddress, formatXlm } from "@/lib/utils";

interface SendCardProps {
  onSuccess?: (txHash: string) => void;
}

export function SendCard({ onSuccess }: SendCardProps) {
  const { isConnected, address, balance } = useWalletStore();

  const [selectedCorridorId, setSelectedCorridorId] = useState(CORRIDORS[0].id);
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [showCorridorMenu, setShowCorridorMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const corridor = CORRIDORS.find((c) => c.id === selectedCorridorId) || CORRIDORS[0];

  const amountNum = parseFloat(amount) || 0;
  const feeXlm = (amountNum * REMIT_FEE_BPS) / 10_000;
  const netXlm = amountNum - feeXlm;

  // Simulated FX rates (in production, read from contract)
  const FX_RATES: Record<string, number> = {
    XLMINR: 83.0,
    XLMPHP: 56.5,
    XLMUSD: 0.10,
    XLMBDT: 11.0,
    XLMNGN: 160.0,
    XLMMXN: 1.70,
  };
  const rate = FX_RATES[corridor.id] || 0;
  const amountOut = netXlm * rate;

  const isValidAmount =
    amountNum > 0 &&
    balance &&
    amountNum <= parseFloat(balance);
  const isValidRecipient =
    recipient.trim().length === 56 && recipient.trim().startsWith("G");
  const canSend = isConnected && isValidAmount && isValidRecipient;

  const handleSend = async () => {
    if (!canSend) return;
    setShowConfirm(false);
    setIsLoading(true);
    setError(null);

    try {
      // Simulate transaction (in production: call contract.send_remittance)
      await new Promise((r) => setTimeout(r, 2500));
      const mockHash = `TX${Date.now().toString(16).toUpperCase()}`;
      setTxHash(mockHash);
      onSuccess?.(mockHash);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (txHash) {
    return (
      <div
        className="glass-card p-8 max-w-md mx-auto text-center space-y-6"
        id="send-success"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto animate-glow-pulse"
          style={{ background: "rgba(16, 185, 129, 0.15)", border: "2px solid var(--color-primary)" }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: "var(--color-primary)" }} />
        </div>
        <div>
          <h3 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
            Remittance Sent! 🎉
          </h3>
          <p className="text-sm mt-2" style={{ color: "var(--color-text-secondary)" }}>
            {amountNum} XLM sent via {corridor.label}
          </p>
          <p className="text-lg font-bold mt-3 gradient-text">
            ≈ {amountOut.toFixed(2)} {corridor.to} received
          </p>
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
        >
          <p className="text-[10px] font-mono" style={{ color: "var(--color-text-muted)" }}>
            TX: {txHash}
          </p>
        </div>
        <button
          className="btn-ghost w-full"
          onClick={() => {
            setTxHash(null);
            setAmount("");
            setRecipient("");
          }}
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 max-w-md mx-auto space-y-5" id="send-card">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Send Remittance
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
            Cross-border payment · {REMIT_FEE_BPS} bps fee
          </p>
        </div>
        <div className="badge-emerald text-xs">
          <div className="dot-active w-1.5 h-1.5" />
          Live
        </div>
      </div>

      {/* Corridor Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Payment Corridor
        </label>
        <div className="relative">
          <button
            id="corridor-selector"
            onClick={() => setShowCorridorMenu(!showCorridorMenu)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all"
            style={{
              background: "var(--color-bg)",
              border: `1px solid ${showCorridorMenu ? "var(--color-primary)" : "var(--color-border)"}`,
              color: "var(--color-text-primary)",
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{corridor.flag}</span>
              <div className="text-left">
                <div className="font-bold text-sm">{corridor.label}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  Rate: {rate} {corridor.to}/XLM
                </div>
              </div>
            </div>
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{
                color: "var(--color-text-muted)",
                transform: showCorridorMenu ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {showCorridorMenu && (
            <div
              className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-xl z-10 overflow-hidden"
              style={{ background: "var(--color-surface-2)", border: "1px solid var(--color-border-light)" }}
            >
              {CORRIDORS.map((c) => (
                <button
                  key={c.id}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{
                    background: c.id === selectedCorridorId ? "rgba(16, 185, 129, 0.08)" : "transparent",
                    color: "var(--color-text-primary)",
                  }}
                  onClick={() => {
                    setSelectedCorridorId(c.id);
                    setShowCorridorMenu(false);
                  }}
                >
                  <span className="text-xl">{c.flag}</span>
                  <div>
                    <div className="font-semibold text-sm">{c.label}</div>
                    <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {FX_RATES[c.id]} {c.to}/XLM
                    </div>
                  </div>
                  {c.id === selectedCorridorId && (
                    <CheckCircle className="w-4 h-4 ml-auto" style={{ color: "var(--color-primary)" }} />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Amount Input */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
            You Send
          </label>
          {isConnected && balance && (
            <button
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--color-primary)" }}
              onClick={() => setAmount(balance)}
            >
              Max: {parseFloat(balance).toFixed(2)} XLM
            </button>
          )}
        </div>
        <div
          className="flex items-center gap-3 p-4 rounded-xl"
          style={{
            background: "var(--color-bg)",
            border: `1px solid ${amount && !isValidAmount ? "var(--color-error)" : "var(--color-border)"}`,
          }}
        >
          <input
            id="send-amount-input"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1 bg-transparent text-2xl font-bold outline-none"
            style={{ color: "var(--color-text-primary)" }}
          />
          <div
            className="px-3 py-1.5 rounded-lg font-bold text-sm"
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              color: "var(--color-primary)",
              border: "1px solid rgba(16, 185, 129, 0.2)",
            }}
          >
            XLM
          </div>
        </div>
      </div>

      {/* FX Quote */}
      {amountNum > 0 && rate > 0 && (
        <div
          className="rounded-xl p-4 space-y-2.5"
          style={{
            background: "rgba(16, 185, 129, 0.04)",
            border: "1px solid rgba(16, 185, 129, 0.15)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
            <span className="text-xs font-semibold" style={{ color: "var(--color-primary)" }}>
              FX Quote
            </span>
          </div>
          {[
            { label: "FX Rate", value: `${rate} ${corridor.to}/XLM` },
            { label: `Fee (${REMIT_FEE_BPS} bps)`, value: `${feeXlm.toFixed(4)} XLM` },
            { label: "Net Sent", value: `${netXlm.toFixed(4)} XLM` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
              <span className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>{value}</span>
            </div>
          ))}
          <div
            className="flex items-center justify-between pt-2"
            style={{ borderTop: "1px solid rgba(16, 185, 129, 0.15)" }}
          >
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>
              Recipient Receives
            </span>
            <span className="text-lg font-extrabold gradient-text">
              ≈ {amountOut.toFixed(2)} {corridor.to}
            </span>
          </div>
        </div>
      )}

      {/* Recipient Address */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
          Recipient Stellar Address
        </label>
        <textarea
          id="recipient-address-input"
          placeholder="G... (56-character Stellar address)"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          rows={2}
          className="input-stellar resize-none font-mono text-sm"
          style={{
            borderColor: recipient && !isValidRecipient ? "var(--color-error)" : undefined,
          }}
        />
        {recipient && !isValidRecipient && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>
            ⚠ Must be a valid 56-char Stellar address starting with G
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-center gap-2 p-3 rounded-xl text-sm"
          style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "var(--color-error)" }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Send Button */}
      {!isConnected ? (
        <div
          className="p-4 rounded-xl text-center text-sm font-medium"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "var(--color-accent)",
          }}
        >
          Connect your Freighter wallet to send
        </div>
      ) : (
        <button
          id="send-remittance-btn"
          className="btn-stellar w-full py-4 text-base font-bold"
          disabled={!canSend || isLoading}
          onClick={() => setShowConfirm(true)}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Sending…
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Send Remittance
            </>
          )}
        </button>
      )}

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}>
          <div className="glass-card-elevated p-6 max-w-sm w-full space-y-5 animate-fade-in">
            <h3 className="text-xl font-bold text-center" style={{ color: "var(--color-text-primary)" }}>
              Confirm Remittance
            </h3>

            <div className="space-y-3">
              {[
                { label: "Corridor", value: corridor.label },
                { label: "You Send", value: `${amountNum} XLM` },
                { label: "Fee (0.5%)", value: `${feeXlm.toFixed(4)} XLM` },
                { label: "Recipient Receives", value: `≈ ${amountOut.toFixed(2)} ${corridor.to}` },
                { label: "Recipient", value: shortAddress(recipient, 6) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>{label}</span>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-text-secondary)" }}>{value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                className="btn-ghost flex-1"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
              <button
                id="confirm-send-btn"
                className="btn-stellar flex-1"
                onClick={handleSend}
              >
                <Send className="w-4 h-4" /> Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
