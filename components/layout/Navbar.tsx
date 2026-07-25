"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Send } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useTransactionStore } from "@/store/transaction-store";
import { WalletConnect } from "@/components/wallet/WalletConnect";

const NAV_ITEMS = [
  { href: "/",           label: "Home" },
  { href: "/send",       label: "Send" },
  { href: "/corridors",  label: "Corridors" },
  { href: "/dashboard",  label: "Dashboard" },
  { href: "/activity",   label: "Activity" },
];

export function Navbar() {
  const pathname = usePathname();
  const { getPendingTransactions } = useTransactionStore();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const pending = getPendingTransactions();

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md lg:pl-64"
      style={{
        borderBottom: "1px solid var(--color-border)",
        background: "rgba(10, 15, 13, 0.85)",
      }}
    >
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-screen-2xl mx-auto">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2.5 lg:hidden">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shadow-glow"
            style={{ background: "linear-gradient(135deg, #10B981, #059669)" }}
          >
            <Send className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base gradient-text font-sans">StellarRemit</span>
        </Link>

        {/* Desktop: page breadcrumb */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold tracking-wider uppercase" style={{ color: "var(--color-text-muted)" }}>
          <span className="gradient-text font-bold">StellarRemit</span>
          <span style={{ color: "var(--color-border-light)" }}>/</span>
          <span style={{ color: "var(--color-text-primary)" }} className="font-bold">
            {NAV_ITEMS.find(
              (item) =>
                item.href === pathname ||
                (item.href !== "/" && pathname.startsWith(item.href))
            )?.label || "Home"}
          </span>
          <span
            className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold normal-case"
            style={{
              background: "rgba(16, 185, 129, 0.1)",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              color: "var(--color-primary-light)",
            }}
          >
            Soroban Testnet
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Pending transactions indicator */}
          {pending.length > 0 && (
            <div
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(245, 158, 11, 0.1)",
                border: "1px solid rgba(245, 158, 11, 0.25)",
              }}
            >
              <div className="dot-pending" />
              <span className="text-xs font-medium" style={{ color: "var(--color-accent)" }}>
                {pending.length} pending
              </span>
            </div>
          )}

          {/* Wallet connect button */}
          <WalletConnect />

          {/* Mobile menu toggle */}
          <button
            className="lg:hidden btn-ghost p-2"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" style={{ color: "var(--color-text-secondary)" }} />
          </button>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {showMobileMenu && (
        <div
          className="lg:hidden border-t shadow-lg"
          style={{ borderColor: "var(--color-border)", background: "var(--color-surface)" }}
        >
          <nav className="flex flex-col px-4 py-3 gap-1">
            {NAV_ITEMS.map(({ href, label }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "nav-item active"
                      : "nav-item"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
