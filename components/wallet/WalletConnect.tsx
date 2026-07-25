"use client";

import { useState } from "react";
import { Wallet, ChevronDown, Copy, ExternalLink, LogOut, Check, Loader2 } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { cn, shortAddress, copyToClipboard, explorerContractUrl } from "@/lib/utils";
import { REMIT_CONTRACT_ID } from "@/lib/stellar/config";

export function WalletConnect() {
  const { isConnected, address, balance, rewardBalance, isConnecting, connect, disconnect } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!address) return;
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isConnected) {
    return (
      <button
        id="wallet-connect-btn"
        onClick={connect}
        disabled={isConnecting}
        className="btn-stellar"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin relative z-10" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4 relative z-10" />
            <span>Connect Wallet</span>
          </>
        )}
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        id="wallet-dropdown-btn"
        onClick={() => setShowDropdown(!showDropdown)}
        className={cn(
          "flex items-center gap-2.5 px-3.5 py-2 rounded-xl transition-all font-sans",
          "border shadow-sm",
          showDropdown && "ring-2 ring-emerald-500/20"
        )}
        style={{
          background: "var(--color-surface)",
          borderColor: showDropdown ? "var(--color-primary)" : "var(--color-border)",
        }}
      >
        {/* Avatar */}
        <div
          className="w-6 h-6 rounded-full flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
        />

        {/* Address */}
        <span className="text-sm font-mono font-semibold hidden sm:block" style={{ color: "var(--color-text-primary)" }}>
          {shortAddress(address!, 4)}
        </span>

        {/* Balance */}
        {balance && (
          <span className="text-xs font-semibold hidden md:block" style={{ color: "var(--color-text-secondary)" }}>
            {parseFloat(balance).toFixed(2)} XLM
          </span>
        )}

        <ChevronDown
          className={cn("w-4 h-4 transition-transform", showDropdown && "rotate-180")}
          style={{ color: "var(--color-text-muted)" }}
        />
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          <div
            id="wallet-dropdown"
            className="absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-xl z-50 overflow-hidden animate-fade-in"
            style={{
              background: "var(--color-surface-2)",
              border: "1px solid var(--color-border-light)",
            }}
          >
            {/* Header */}
            <div
              className="px-4 py-3"
              style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(0,0,0,0.2)" }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                  style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
                >
                  <Wallet className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                    Connected
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className="dot-active" />
                    <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>
                      Testnet
                    </span>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "var(--color-bg)", border: "1px solid var(--color-border)" }}
              >
                <span
                  className="text-xs font-mono font-medium flex-1 truncate"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {address}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex-shrink-0 p-1 rounded-lg transition-colors"
                  aria-label="Copy address"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5" style={{ color: "var(--color-primary)" }} />
                  ) : (
                    <Copy className="w-3.5 h-3.5" style={{ color: "var(--color-text-muted)" }} />
                  )}
                </button>
              </div>
            </div>

            {/* Balances (XLM & SRT) */}
            <div
              className="px-4 py-3 space-y-3"
              style={{ borderBottom: "1px solid var(--color-border)" }}
            >
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: "var(--color-text-muted)" }}>
                  XLM Balance
                </p>
                <p className="text-xl font-extrabold font-mono" style={{ color: "var(--color-text-primary)" }}>
                  {balance ? parseFloat(balance).toFixed(4) : "—"}{" "}
                  <span className="text-xs font-normal font-sans" style={{ color: "var(--color-text-muted)" }}>XLM</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider mb-0.5" style={{ color: "var(--color-primary)" }}>
                  SRT Tokens
                </p>
                <p className="text-xl font-extrabold gradient-text font-mono">
                  {rewardBalance !== null ? (rewardBalance / 10_000_000).toFixed(2) : "—"}{" "}
                  <span className="text-xs font-normal font-sans" style={{ color: "var(--color-text-muted)" }}>SRT</span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-2 py-2 space-y-1">
              <a
                href={explorerContractUrl(REMIT_CONTRACT_ID)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: "var(--color-text-secondary)" }}
                onClick={() => setShowDropdown(false)}
              >
                <ExternalLink className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                StellarRemit Contract
              </a>

              <button
                id="wallet-disconnect-btn"
                onClick={() => {
                  disconnect();
                  setShowDropdown(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                style={{ color: "var(--color-error)" }}
              >
                <LogOut className="w-4 h-4" style={{ color: "var(--color-error)" }} />
                Disconnect Wallet
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
