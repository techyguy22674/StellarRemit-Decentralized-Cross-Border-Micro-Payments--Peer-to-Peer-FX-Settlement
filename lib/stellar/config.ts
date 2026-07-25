import { StellarConfig } from "@/types";

// ──────────────────────────────────────────────────────────────────────────────
// StellarRemit — Network Configuration
// ──────────────────────────────────────────────────────────────────────────────

export const STELLAR_CONFIG: StellarConfig = {
  network: (process.env.NEXT_PUBLIC_STELLAR_NETWORK as "testnet" | "mainnet") || "testnet",
  rpcUrl:
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ||
    process.env.NEXT_PUBLIC_STELLAR_RPC_URL ||
    "https://soroban-testnet.stellar.org",
  networkPassphrase:
    process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE ||
    "Test SDF Network ; September 2015",
  horizonUrl:
    process.env.NEXT_PUBLIC_HORIZON_URL ||
    "https://horizon-testnet.stellar.org",
  contractId:
    process.env.NEXT_PUBLIC_STELLAR_REMIT_CONTRACT_ID ||
    "CBSADMCXP32LOXM5MB7Q44HYVCUNOXZTMN6XXITNLTFFRTYRAIXIRBCT",
  rewardTokenId:
    process.env.NEXT_PUBLIC_SRT_TOKEN_CONTRACT_ID ||
    "CBCLW5ZUAN2YN677JC2672QMGAPDMWIUZWLOVAACCWU66SNS7KSIYIZN",
};

/** StellarRemit main contract ID (Deployed on Testnet) */
export const REMIT_CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_STELLAR_REMIT_CONTRACT_ID ||
  STELLAR_CONFIG.contractId ||
  "CBSADMCXP32LOXM5MB7Q44HYVCUNOXZTMN6XXITNLTFFRTYRAIXIRBCT";

/** StellarRemit Token (SRT) contract ID (Deployed on Testnet) */
export const SRT_TOKEN_CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_SRT_TOKEN_CONTRACT_ID ||
  STELLAR_CONFIG.rewardTokenId ||
  "CBCLW5ZUAN2YN677JC2672QMGAPDMWIUZWLOVAACCWU66SNS7KSIYIZN";

/** Testnet native XLM SAC address */
export const NATIVE_TOKEN_ADDRESS =
  process.env.NEXT_PUBLIC_NATIVE_TOKEN_ADDRESS ||
  "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC";

/** Deployer / admin address (Freighter Wallet) */
export const DEPLOYER_ADDRESS =
  process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS ||
  process.env.NEXT_PUBLIC_FREIGHTER_WALLET ||
  "GCMVNWEORWXFEXITRRMFVAZBW65GRZKJA5PQM4OG3X3YSJMZ2PG3MEQD";

/** Protocol remittance fee in basis points (50 = 0.50%) */
export const REMIT_FEE_BPS = 50;

/** Token decimals (same as XLM = 7 decimal places) */
export const TOKEN_DECIMALS = 7;

/** Stroops per XLM */
export const STROOPS_PER_XLM = 10_000_000;

/** Event poll interval (milliseconds) */
export const EVENT_POLL_INTERVAL = 5_000;

/** Transaction confirmation poll interval (milliseconds) */
export const TX_POLL_INTERVAL = 2_000;

/** Maximum number of events to display in the activity feed */
export const MAX_EVENTS_IN_FEED = 50;

// ── Supported FX Corridors ───────────────────────────────────────────────────

export interface Corridor {
  id: string;         // Symbol name used in contract (e.g. "XLMINR")
  label: string;      // Display label (e.g. "XLM → INR")
  from: string;       // Source currency
  to: string;         // Destination currency
  flag: string;       // Emoji flag for destination
  rateDisplay: string;// Human-readable seed rate
}

export const CORRIDORS: Corridor[] = [
  { id: "XLMINR", label: "XLM → INR", from: "XLM", to: "INR", flag: "🇮🇳", rateDisplay: "83.0" },
  { id: "XLMPHP", label: "XLM → PHP", from: "XLM", to: "PHP", flag: "🇵🇭", rateDisplay: "56.5" },
  { id: "XLMUSD", label: "XLM → USD", from: "XLM", to: "USD", flag: "🇺🇸", rateDisplay: "0.10" },
  { id: "XLMBDT", label: "XLM → BDT", from: "XLM", to: "BDT", flag: "🇧🇩", rateDisplay: "11.0" },
  { id: "XLMNGN", label: "XLM → NGN", from: "XLM", to: "NGN", flag: "🇳🇬", rateDisplay: "160.0" },
  { id: "XLMMXN", label: "XLM → MXN", from: "XLM", to: "MXN", flag: "🇲🇽", rateDisplay: "1.70" },
];

// Backwards compat aliases
export const POOL_CONTRACT_ID = REMIT_CONTRACT_ID;
export const SPL_TOKEN_CONTRACT_ID = SRT_TOKEN_CONTRACT_ID;
export const SWAP_FEE_BPS = REMIT_FEE_BPS;
