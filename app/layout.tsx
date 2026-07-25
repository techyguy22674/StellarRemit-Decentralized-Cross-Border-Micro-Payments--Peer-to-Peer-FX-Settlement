import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/Providers";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  variable: "--font-fira-code",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "StellarRemit | Decentralized Cross-Border Micro-Payments & P2P FX Settlement",
  description:
    "Send XLM across borders instantly. StellarRemit is a Soroban-powered decentralized remittance protocol on Stellar — no banks, no intermediaries, ultra-low fees.",
  keywords: [
    "StellarRemit",
    "Stellar",
    "Soroban",
    "remittance",
    "cross-border payments",
    "micro-payments",
    "peer-to-peer",
    "FX settlement",
    "XLM",
    "blockchain",
    "DeFi",
    "smart contracts",
    "non-custodial",
    "Freighter wallet",
  ],
  openGraph: {
    title: "StellarRemit — Decentralized Cross-Border Micro-Payments & P2P FX Settlement",
    description:
      "Send money across borders instantly. On-chain. No banks. Powered by Soroban smart contracts on Stellar.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${firaCode.variable} font-sans antialiased`}
        style={{ background: "var(--color-bg)", color: "var(--color-text-primary)" }}
      >
        <Providers>
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="lg:pl-64 min-h-screen flex flex-col">
            {/* Navbar */}
            <Navbar />

            {/* Page content */}
            <main className="flex-1 px-4 md:px-8 py-8 max-w-screen-2xl mx-auto w-full">
              {children}
            </main>

            {/* Footer */}
            <footer
              className="lg:pl-0 border-t px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-surface)",
                color: "var(--color-text-muted)",
              }}
            >
              <span>
                © {new Date().getFullYear()}{" "}
                <span className="gradient-text font-bold">StellarRemit</span>
                {" — "}Decentralized Cross-Border Micro-Payments & P2P FX Settlement
              </span>
              <div className="flex items-center gap-4">
                <a
                  href="https://github.com/techyguy22674/StellarRemit-Decentralized-Cross-Border-Micro-Payments--Peer-to-Peer-FX-Settlement"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--color-text-muted)" }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://stellar.expert/explorer/testnet"
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "var(--color-text-muted)" }}
                  className="hover:text-emerald-400 transition-colors"
                >
                  Explorer
                </a>
                <span className="flex items-center gap-1.5">
                  <span className="dot-active w-2 h-2" />
                  Testnet
                </span>
              </div>
            </footer>
          </div>

          {/* Toast notifications */}
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            theme="dark"
            toastOptions={{
              style: {
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                color: "var(--color-text-primary)",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
