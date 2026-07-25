import Link from "next/link";
import { Send, Zap, Shield, Globe, DollarSign, ChevronRight, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "StellarRemit | Cross-Border Micro-Payments & P2P FX Settlement on Stellar",
  description:
    "Send XLM across borders instantly. StellarRemit is the Soroban-powered decentralized remittance protocol — no banks, no intermediaries, 0.5% fee.",
};

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "Stellar confirms transactions in under 5 seconds. Your recipient gets funds instantly — no waiting days for SWIFT transfers or bank processing.",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
  },
  {
    icon: DollarSign,
    title: "Ultra-Low Fees",
    description:
      "Protocol charges only 0.5% (50 basis points) per remittance — a fraction of Western Union's 5–10% fees. Fully transparent, no hidden charges.",
    color: "#F59E0B",
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  {
    icon: Shield,
    title: "Non-Custodial",
    description:
      "All funds flow through Soroban smart contracts. No admin keys, no custodian risk — your money is governed by math, not middlemen.",
    color: "#38BDF8",
    bg: "rgba(56, 189, 248, 0.08)",
    border: "rgba(56, 189, 248, 0.2)",
  },
  {
    icon: Globe,
    title: "Cross-Border FX",
    description:
      "Send XLM, receive INR, PHP, USD, BDT, NGN and more. On-chain FX oracle sets rates for each corridor with full price transparency before you send.",
    color: "#10B981",
    bg: "rgba(16, 185, 129, 0.08)",
    border: "rgba(16, 185, 129, 0.2)",
  },
];

const STATS = [
  { label: "Total Sent",   value: "$1.2M+",   sub: "across all corridors" },
  { label: "Avg Fee",      value: "0.5%",      sub: "50 basis points" },
  { label: "Countries",    value: "120+",      sub: "supported corridors" },
  { label: "Avg Time",     value: "< 5s",      sub: "to settle on-chain" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Connect Wallet",
    desc: "Link your Freighter wallet. StellarRemit reads your XLM and SRT token balances directly from Stellar Testnet via Soroban RPC.",
  },
  {
    step: "02",
    title: "Choose Corridor & Amount",
    desc: "Select a payment corridor (e.g. XLM→INR), enter the amount and recipient Stellar address. See the exact FX rate and fee before sending.",
  },
  {
    step: "03",
    title: "Send & Settle Instantly",
    desc: "The Soroban smart contract calculates the FX rate, deducts the 0.5% fee, emits an on-chain event, and the recipient receives funds in seconds.",
  },
];

const CORRIDORS = [
  { id: "XLM→INR", flag: "🇮🇳", rate: "83.0",  vol: "$12,450" },
  { id: "XLM→PHP", flag: "🇵🇭", rate: "56.5",  vol: "$8,320" },
  { id: "XLM→USD", flag: "🇺🇸", rate: "0.10",  vol: "$31,200" },
  { id: "XLM→BDT", flag: "🇧🇩", rate: "11.0",  vol: "$5,670" },
  { id: "XLM→NGN", flag: "🇳🇬", rate: "160.0", vol: "$9,180" },
  { id: "XLM→MXN", flag: "🇲🇽", rate: "1.70",  vol: "$4,200" },
];

export default function HomePage() {
  return (
    <div className="space-y-28 pb-24">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center text-center pt-12 pb-16 gap-8 overflow-hidden">
        {/* Background glow orbs */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full blur-[140px] pointer-events-none"
          style={{ background: "rgba(16, 185, 129, 0.06)" }}
        />
        <div
          className="absolute top-40 right-1/4 w-[400px] h-[350px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "rgba(245, 158, 11, 0.05)" }}
        />

        {/* Badge */}
        <div
          id="hero-badge"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold animate-fade-in badge-emerald"
        >
          <div className="dot-active" />
          Live on Stellar Soroban Testnet · 0.5% Protocol Fee · No Banks
        </div>

        {/* Headline */}
        <div className="space-y-6 animate-fade-in max-w-5xl">
          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] font-sans"
            style={{ color: "var(--color-text-primary)" }}
          >
            Send money across borders.{" "}
            <br />
            <span className="gradient-text font-extrabold">
              Instantly. On-chain. No banks.
            </span>
          </h1>
          <p
            className="text-base md:text-xl max-w-3xl mx-auto leading-relaxed font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            StellarRemit is the Soroban-powered decentralized remittance protocol on Stellar.
            Send XLM, settle in INR, PHP, USD and more — without banks, intermediaries, or
            hidden fees. Think{" "}
            <strong style={{ color: "var(--color-primary)" }}>Western Union on-chain</strong>
            , trustless and instant.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in pt-2">
          <Link
            href="/send"
            id="hero-send-btn"
            className="btn-stellar px-8 py-4 text-base font-bold shadow-glow-stream"
          >
            <Send className="w-5 h-5 relative z-10" />
            <span>Send Remittance</span>
          </Link>
          <Link
            href="/corridors"
            id="hero-corridors-btn"
            className="btn-ghost px-8 py-4 text-base font-semibold"
          >
            View Corridors
            <ArrowRight className="w-4 h-4" style={{ color: "var(--color-primary)" }} />
          </Link>
        </div>

        {/* Network indicator */}
        <div
          className="flex items-center gap-2 text-sm font-medium animate-fade-in pt-2"
          style={{ color: "var(--color-text-muted)" }}
        >
          <div className="dot-active" />
          Live on Stellar Soroban Testnet · Powered by Soroban SDK v22
        </div>
      </section>

      {/* ── Live Stats Ticker ─────────────────────────────────────────── */}
      <section
        className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto"
        aria-label="Protocol statistics"
      >
        {STATS.map(({ label, value, sub }, i) => (
          <div
            key={label}
            className="glass-card p-6 md:p-8 text-center animate-fade-in group"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-3xl md:text-4xl font-extrabold gradient-text">{value}</p>
            <p
              className="text-xs md:text-sm mt-2 font-bold tracking-wide uppercase"
              style={{ color: "var(--color-text-muted)" }}
            >
              {label}
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
          </div>
        ))}
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section className="space-y-12 max-w-6xl mx-auto">
        <div className="text-center space-y-4">
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            DeFi-Grade Remittance on Stellar
          </h2>
          <p
            className="max-w-2xl mx-auto text-base md:text-lg font-medium"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Battle-tested Soroban contracts, sub-cent fees, and provably fair on-chain FX settlement.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {FEATURES.map(({ icon: Icon, title, description, color, bg, border }, i) => (
            <div
              key={title}
              className="glass-card p-6 md:p-8 flex gap-6 animate-fade-in group"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <Icon className="w-6 h-6 md:w-7 md:h-7" style={{ color }} />
              </div>
              <div className="text-left">
                <h3
                  className="font-bold text-lg mb-2 group-hover:text-emerald-400 transition-colors"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Live Corridors ────────────────────────────────────────────── */}
      <section className="space-y-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2
              className="text-3xl md:text-4xl font-extrabold tracking-tight"
              style={{ color: "var(--color-text-primary)" }}
            >
              Active FX Corridors
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-muted)" }}>
              Live on-chain FX rates powered by the StellarRemit oracle
            </p>
          </div>
          <Link href="/corridors" className="btn-ghost px-5 py-2.5 text-sm gap-1">
            All Corridors <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CORRIDORS.map(({ id, flag, rate, vol }, i) => (
            <Link
              key={id}
              href="/send"
              className="glass-card p-4 text-center group hover:border-emerald-500/40 transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="text-2xl mb-2">{flag}</div>
              <div
                className="font-bold text-sm"
                style={{ color: "var(--color-text-primary)" }}
              >
                {id}
              </div>
              <div
                className="text-xs font-mono mt-1"
                style={{ color: "var(--color-primary)" }}
              >
                {rate}
              </div>
              <div className="text-[10px] mt-1" style={{ color: "var(--color-text-muted)" }}>
                {vol} vol
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────── */}
      <section className="space-y-12 max-w-6xl mx-auto">
        <div className="text-center space-y-4">
          <h2
            className="text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            How StellarRemit Works
          </h2>
          <p className="text-base md:text-lg font-medium" style={{ color: "var(--color-text-secondary)" }}>
            Permissionless remittance — no sign-ups, no KYC, no custody
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {HOW_IT_WORKS.map(({ step, title, desc }, i) => (
            <div
              key={step}
              className="glass-card p-6 md:p-8 space-y-4 animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div
                className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #10B981, #059669)",
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.3)",
                }}
              >
                <span className="font-extrabold text-white text-sm md:text-base">{step}</span>
              </div>
              <h3
                className="font-bold text-lg"
                style={{ color: "var(--color-text-primary)" }}
              >
                {title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────────────────── */}
      <section
        className="glass-card max-w-5xl mx-auto p-10 md:p-14 lg:p-16 text-center space-y-8 relative overflow-hidden"
        style={{ border: "1px solid rgba(16, 185, 129, 0.2)" }}
      >
        <div className="absolute inset-x-0 top-0 stream-bar" />
        <div
          className="absolute -top-24 -right-24 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
          style={{ background: "rgba(16, 185, 129, 0.07)" }}
        />
        <h2
          className="text-4xl md:text-5xl font-extrabold relative tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          Ready to send your first{" "}
          <span className="gradient-text">remittance?</span>
        </h2>
        <p
          className="max-w-2xl mx-auto relative text-base md:text-lg font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Join the StellarRemit protocol. Send $10 to Manila. Receive in seconds.
          Zero banks. Powered by Soroban smart contracts on Stellar.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative">
          <Link
            href="/send"
            id="cta-send-btn"
            className="btn-stellar px-8 py-3.5 text-base font-bold shadow-glow-stream"
          >
            <Send className="w-5 h-5 relative z-10" />
            <span>Send Remittance Now</span>
          </Link>
          <Link
            href="/activity"
            id="cta-activity-btn"
            className="btn-ghost px-8 py-3.5 text-base"
          >
            View Live Activity
          </Link>
        </div>
      </section>
    </div>
  );
}
