import type { Metadata } from "next";
import { SendCard } from "@/components/remit/SendCard";
import { Info, Shield, Zap, Globe } from "lucide-react";

export const metadata: Metadata = {
  title: "Send Remittance | StellarRemit — Cross-Border Micro-Payments",
  description:
    "Send XLM across borders instantly. Choose a corridor (XLM→INR, XLM→PHP), enter amount and recipient, see exact FX rate and fee before sending.",
};

const TIPS = [
  { icon: Zap, title: "Instant", desc: "Settles in under 5 seconds on Stellar" },
  { icon: Shield, title: "Non-Custodial", desc: "Funds flow through smart contracts only" },
  { icon: Globe, title: "Global Reach", desc: "6 corridors across 4 continents" },
  { icon: Info, title: "Fee: 0.5%", desc: "50 basis points, fully transparent" },
];

export default function SendPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="badge-emerald inline-flex">
          <div className="dot-active w-1.5 h-1.5" />
          Live on Stellar Testnet
        </div>
        <h1
          className="text-4xl md:text-5xl font-extrabold tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Send <span className="gradient-text">Remittance</span>
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }} className="text-lg">
          Cross-border micro-payments. No banks. No middlemen. Instant settlement.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        {/* SendCard — Left 2 columns */}
        <div className="lg:col-span-2">
          <SendCard />
        </div>

        {/* Info Panel — Right column */}
        <div className="space-y-4">
          {/* Protocol Info */}
          <div
            className="glass-card p-5 space-y-4"
            id="protocol-info-card"
          >
            <h3
              className="font-bold text-sm uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Protocol Details
            </h3>
            {TIPS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.15)",
                  }}
                >
                  <Icon className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
                </div>
                <div>
                  <div
                    className="font-semibold text-sm"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {title}
                  </div>
                  <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How Fees Work */}
          <div
            className="glass-card p-5 space-y-3"
            id="fee-info-card"
          >
            <h3
              className="font-bold text-sm"
              style={{ color: "var(--color-text-primary)" }}
            >
              💰 Fee Transparency
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              StellarRemit charges a flat{" "}
              <strong style={{ color: "var(--color-accent)" }}>50 basis points (0.5%)</strong>{" "}
              per remittance — fixed, on-chain, and visible before you send. Compare that to
              traditional remittance services charging 5–10%.
            </p>
            <div
              className="p-3 rounded-lg text-center"
              style={{
                background: "rgba(245, 158, 11, 0.06)",
                border: "1px solid rgba(245, 158, 11, 0.15)",
              }}
            >
              <div className="text-2xl font-extrabold" style={{ color: "var(--color-accent)" }}>
                0.5%
              </div>
              <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                vs. 5–10% traditional
              </div>
            </div>
          </div>

          {/* SRT Rewards */}
          <div
            className="glass-card p-5 space-y-3"
            id="srt-rewards-card"
          >
            <h3
              className="font-bold text-sm"
              style={{ color: "var(--color-text-primary)" }}
            >
              🎁 Earn SRT Tokens
            </h3>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Every successful remittance earns you{" "}
              <strong style={{ color: "var(--color-primary)" }}>SRT (StellarRemit Token)</strong>{" "}
              rewards — minted on-chain as loyalty tokens for protocol participants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
