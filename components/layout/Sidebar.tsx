"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Send,
  Activity,
  Radio,
  Globe,
  ExternalLink,
} from "lucide-react";
import { cn, shortAddress } from "@/lib/utils";
import { useWalletStore } from "@/store/wallet-store";
import { STELLAR_CONFIG, REMIT_CONTRACT_ID } from "@/lib/stellar/config";
import { explorerContractUrl } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",           label: "Home",         icon: Radio },
  { href: "/send",       label: "Send Money",   icon: Send },
  { href: "/corridors",  label: "FX Corridors", icon: Globe },
  { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard },
  { href: "/activity",   label: "Activity Feed", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isConnected, address } = useWalletStore();

  return (
    <aside
      className="hidden lg:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-30 shadow-sm"
      style={{
        borderRight: "1px solid var(--color-border)",
        background: "var(--color-surface)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 py-6"
        style={{ borderBottom: "1px solid var(--color-border)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow"
          style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
        >
          <Send className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base gradient-text font-sans">StellarRemit</h1>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-primary)" }}
          >
            Remittance Protocol
          </p>
        </div>
      </div>

      {/* Gradient bar */}
      <div className="stream-bar mx-4 mt-0" />

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "nav-item group relative",
                isActive ? "active" : ""
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 flex-shrink-0",
                  isActive ? "" : ""
                )}
                style={{ color: isActive ? "var(--color-primary)" : "var(--color-text-muted)" }}
              />
              <span className="text-sm flex-1">{label}</span>
              {isActive && (
                <div className="flex items-center gap-2">
                  <div className="dot-active w-1.5 h-1.5" />
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div
        className="px-4 py-5 space-y-3"
        style={{
          borderTop: "1px solid var(--color-border)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        {/* Network badge */}
        <div
          className="flex items-center justify-between px-3 py-2.5 rounded-xl shadow-sm"
          style={{
            background: "var(--color-bg)",
            border: "1px solid var(--color-border)",
          }}
        >
          <div className="flex items-center gap-2">
            <div className="dot-active" />
            <span
              className="text-xs capitalize font-semibold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {STELLAR_CONFIG.network}
            </span>
          </div>
          <span
            className="text-[10px] font-mono font-bold"
            style={{ color: "var(--color-primary)" }}
          >
            Fee: 0.5%
          </span>
        </div>

        {/* Contract link */}
        {REMIT_CONTRACT_ID && (
          <a
            href={explorerContractUrl(REMIT_CONTRACT_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-200 group"
            style={{
              background: "var(--color-bg)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div
              className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(16, 185, 129, 0.15)" }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full group-hover:scale-125 transition-transform"
                style={{ background: "var(--color-primary)" }}
              />
            </div>
            <span
              className="text-xs font-mono flex-1 truncate font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              {shortAddress(REMIT_CONTRACT_ID, 4)}
            </span>
            <ExternalLink
              className="w-3 h-3 opacity-40 group-hover:opacity-100 transition-opacity"
              style={{ color: "var(--color-primary)" }}
            />
          </a>
        )}

        {/* SRT token label */}
        <div className="px-3 py-1.5 rounded-lg text-center">
          <span
            className="text-[10px] font-mono font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            SRT Reward Token · 50 bps Fee
          </span>
        </div>
      </div>
    </aside>
  );
}
