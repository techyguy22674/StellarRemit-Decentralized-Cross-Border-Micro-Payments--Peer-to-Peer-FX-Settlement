"use client";

import { useState, useEffect } from "react";
import {
  LayoutDashboard, Wallet, Coins, ArrowLeftRight, TrendingUp,
  ExternalLink, Copy, CheckCircle2, RefreshCw, Droplets,
} from "lucide-react";
import { DEPLOYER_ADDRESS, REMIT_CONTRACT_ID, SRT_TOKEN_CONTRACT_ID, NATIVE_TOKEN_ADDRESS } from "@/lib/stellar/config";

// ── Mock data (replaced by real wallet queries when connected) ───────────────

const MOCK_TX_HISTORY = [
  {
    id: "tx-1",
    type: "Remittance",
    description: "XLM → INR (XLMINR)",
    amount: "+8,300 INR",
    fee: "0.50%",
    time: "2 min ago",
    hash: "abc1234...",
    status: "success",
  },
  {
    id: "tx-2",
    type: "Remittance",
    description: "XLM → PHP (XLMPHP)",
    amount: "+565 PHP",
    fee: "0.50%",
    time: "1 hr ago",
    hash: "def5678...",
    status: "success",
  },
  {
    id: "tx-3",
    type: "Remittance",
    description: "XLM → USD (XLMUSD)",
    amount: "+10.00 USD",
    fee: "0.50%",
    time: "3 hr ago",
    hash: "ghi9012...",
    status: "success",
  },
];

function shortAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardPage() {
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Placeholder balances — replaced by live wallet data when connected
  const xlmBalance = 0;
  const splBalance = 0;
  const connectedAddress = "";

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRefresh() {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1200);
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stellar-gradient flex items-center justify-center shadow-md">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">Wallet Dashboard</h1>
          </div>
          <p className="text-slate-500 font-medium text-sm">
            Your XLM balance, SRT reward token holdings, and StellarRemit transaction history.
          </p>
        </div>
        <button
          id="refresh-dashboard-btn"
          onClick={handleRefresh}
          className="btn-ghost px-4 py-2.5 text-sm font-semibold gap-2"
        >
          <RefreshCw className={`w-4 h-4 text-slate-600 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Connection Status Banner */}
      <div className="glass-card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-blue-100">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${connectedAddress ? "bg-green-500 animate-pulse" : "bg-slate-300"}`} />
          <div>
            <p className="text-sm font-bold text-slate-900">
              {connectedAddress ? "Wallet Connected" : "No Wallet Connected"}
            </p>
            {connectedAddress ? (
              <div className="flex items-center gap-2 mt-0.5">
                <code className="text-xs font-mono text-slate-500">{shortAddress(connectedAddress)}</code>
                <button
                  id="copy-address-btn"
                  onClick={() => handleCopy(connectedAddress)}
                  className="text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 mt-0.5">Connect Freighter to view your balances</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs text-slate-500 font-medium">Stellar Testnet</span>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* XLM Balance */}
        <div className="glass-card p-6 space-y-4 hover:border-blue-300 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">XLM Balance</p>
                <p className="text-xs text-slate-400 font-mono">{shortAddress(NATIVE_TOKEN_ADDRESS ?? "")}</p>
              </div>
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/account/${DEPLOYER_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">
              {xlmBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-slate-500 font-medium mt-1">XLM</p>
          </div>
        </div>

        {/* SPL LP Token Balance */}
        <div className="glass-card p-6 space-y-4 hover:border-purple-300 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Droplets className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">SRT Tokens</p>
                <p className="text-xs text-slate-400 font-mono">{shortAddress(SRT_TOKEN_CONTRACT_ID ?? "")}</p>
              </div>
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${SRT_TOKEN_CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-purple-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">
              {splBalance.toLocaleString("en-US", { minimumFractionDigits: 4 })}
            </p>
            <p className="text-sm text-slate-500 font-medium mt-1">
              SRT · StellarRemit Reward Token
            </p>
          </div>
        </div>

        {/* Pool Position Card */}
        <div className="glass-card p-6 space-y-4 hover:border-indigo-300 transition-all duration-300 group">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">Pool Position</p>
              <p className="text-xs text-slate-400 font-medium">Your share of the pool</p>
            </div>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">0.00%</p>
            <p className="text-sm text-slate-500 font-medium mt-1">
              XLM Corridor · 0.50% fee
            </p>
          </div>
        </div>
      </div>

      {/* Contract Reference */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <Coins className="w-4 h-4 text-blue-600" />
          StellarRemit Contract Addresses
        </div>
        <div className="space-y-3">
          {[
            {
              label: "Remittance Contract (stellar_remit)",
              value: REMIT_CONTRACT_ID,
              href: `https://stellar.expert/explorer/testnet/contract/${REMIT_CONTRACT_ID}`,
            },
            {
              label: "SRT Token Contract (remit_token)",
              value: SRT_TOKEN_CONTRACT_ID,
              href: `https://stellar.expert/explorer/testnet/contract/${SRT_TOKEN_CONTRACT_ID}`,
            },
            {
              label: "Native XLM (SAC)",
              value: NATIVE_TOKEN_ADDRESS,
              href: `https://stellar.expert/explorer/testnet/contract/${NATIVE_TOKEN_ADDRESS}`,
            },
          ].map(({ label, value, href }) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 font-bold sm:w-64 flex-shrink-0">{label}</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <code className="text-xs font-mono text-slate-700 truncate flex-1">{value}</code>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    id={`copy-${label.replace(/\s+/g, "-").toLowerCase()}-btn`}
                    onClick={() => handleCopy(value)}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <a href={href} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-blue-600 transition-colors p-1">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">Transaction History</h2>
          <span className="text-xs text-slate-400 font-medium">Recent StellarRemit activity</span>
        </div>

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Details</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Fee</th>
                  <th className="text-right px-5 py-3.5 text-xs font-bold text-slate-500 uppercase tracking-wide hidden md:table-cell">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_TX_HISTORY.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-slate-400 text-sm">
                      No transactions yet. Connect your wallet and start sending!
                    </td>
                  </tr>
                ) : (
                  MOCK_TX_HISTORY.map((tx) => (
                    <tr key={tx.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {tx.type === "Swap" ? (
                            <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                              <ArrowLeftRight className="w-3.5 h-3.5 text-blue-600" />
                            </div>
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Droplets className="w-3.5 h-3.5 text-purple-600" />
                            </div>
                          )}
                          <span className="font-bold text-slate-800 text-xs">{tx.type}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-600 font-medium text-xs">{tx.description}</td>
                      <td className="px-5 py-4 text-right font-bold text-slate-900 text-xs font-mono">{tx.amount}</td>
                      <td className="px-5 py-4 text-right text-slate-500 text-xs hidden sm:table-cell">{tx.fee}</td>
                      <td className="px-5 py-4 text-right text-slate-400 text-xs hidden md:table-cell">{tx.time}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
