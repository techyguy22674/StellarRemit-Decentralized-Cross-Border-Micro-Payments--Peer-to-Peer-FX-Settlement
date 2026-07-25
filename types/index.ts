// ──────────────────────────────────────────────────────────────────────────────
// Stellar / Soroban Types — StellarRemit
// ──────────────────────────────────────────────────────────────────────────────

export type Network = "testnet" | "mainnet" | "futurenet";

export interface StellarConfig {
  network: Network;
  rpcUrl: string;
  networkPassphrase: string;
  horizonUrl: string;
  contractId: string;
  rewardTokenId?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Wallet Types
// ──────────────────────────────────────────────────────────────────────────────

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  network: Network | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
}

// ──────────────────────────────────────────────────────────────────────────────
// Remittance Protocol Types
// ──────────────────────────────────────────────────────────────────────────────

export interface RemittanceCorridor {
  id: string;          // Symbol name used in contract (e.g. "XLMINR")
  label: string;       // Display label (e.g. "XLM → INR")
  from: string;        // Source currency
  to: string;          // Destination currency
  flag: string;        // Emoji flag for destination
  rateDisplay: string; // Seed rate
}

export interface FxQuoteUI {
  amountOut: number;
  feeXlm: number;
  rate: number;
  priceImpactBps: number;
}

// ──────────────────────────────────────────────────────────────────────────────
// Transaction Types
// ──────────────────────────────────────────────────────────────────────────────

export type TransactionStatus = "pending" | "success" | "failed";
export type TransactionType =
  | "send_remittance"
  | "set_fx_rate"
  | "initialize"
  | "mint_srt";

export interface Transaction {
  id: string;
  hash: string;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: Date;
  corridorId?: string;
  amount?: number; // in XLM
  description: string;
  error?: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Event Types (from contract events)
// ──────────────────────────────────────────────────────────────────────────────

export type EventType =
  | "remittance_sent"
  | "fx_rate_updated"
  | "srt_minted";

export interface ContractEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  ledger: number;
  txHash: string;
  corridorId: string;
  walletAddress: string;
  amount?: number; // in XLM
  description: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// UI State Types
// ──────────────────────────────────────────────────────────────────────────────

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "pending" | "info";
  title: string;
  description?: string;
  txHash?: string;
  duration?: number;
}
