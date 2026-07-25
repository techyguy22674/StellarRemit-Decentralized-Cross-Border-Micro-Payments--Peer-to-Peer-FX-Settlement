/**
 * lib/stellar/contract.ts
 *
 * StellarRemit — Soroban Contract Client
 *
 * Provides typed TypeScript wrappers for all StellarRemit smart contract
 * invocations: send_remittance, get_fx_rate, set_fx_rate, get_quote,
 * get_stats, get_remittance_fee, and SRT token queries.
 */

import * as StellarSdk from "@stellar/stellar-sdk";
import {
  Contract,
  TransactionBuilder,
  BASE_FEE,
  nativeToScVal,
  Address,
  scValToNative,
} from "@stellar/stellar-sdk";
import { rpc as SorobanRpc } from "@stellar/stellar-sdk";
import {
  STELLAR_CONFIG,
  REMIT_CONTRACT_ID,
  SRT_TOKEN_CONTRACT_ID,
  STROOPS_PER_XLM,
} from "./config";
import type { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RemittanceStats {
  total_volume: bigint; // Total volume in stroops
  total_fees: bigint;   // Total fees collected in stroops
  total_txns: bigint;   // Total remittance count
  fee_bps: bigint;      // Default 50 = 0.50%
}

export interface FxQuote {
  amount_out: bigint;
  fee: bigint;
  rate: bigint;
  price_impact_bps: bigint;
}

export type ContractCallResult<T> =
  | { success: true; value: T; txHash?: string }
  | { success: false; error: string };

// ── Helper to build a dummy Account for simulations ─────────────────────────

function makeDummyAccount(): StellarSdk.Account {
  return new StellarSdk.Account("GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF", "0");
}

// ── Contract Client Class ───────────────────────────────────────────────────

export class StellarRemitClient {
  private rpc: SorobanRpc.Server;
  private networkPassphrase: string;

  constructor() {
    this.rpc = new SorobanRpc.Server(STELLAR_CONFIG.rpcUrl);
    this.networkPassphrase = STELLAR_CONFIG.networkPassphrase;
  }

  // ── Read Calls ─────────────────────────────────────────────────────────────

  /** Read current FX rate for a corridor (e.g. "XLMINR") */
  async getFxRate(corridorId: string): Promise<number> {
    try {
      const contract = new Contract(REMIT_CONTRACT_ID);
      const operation = contract.call("get_fx_rate", nativeToScVal(corridorId, { type: "symbol" }));

      const dummyTx = new TransactionBuilder(makeDummyAccount(), {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const sim = await this.rpc.simulateTransaction(dummyTx);
      if (SorobanRpc.Api.isSimulationSuccess(sim) && sim.result) {
        const val = scValToNative(sim.result.retval);
        return Number(val) / 1_000_000; // FX rates are scaled by 10^6
      }
      return 0;
    } catch {
      return 0;
    }
  }

  /** Read global protocol stats */
  async getStats(): Promise<RemittanceStats> {
    try {
      const contract = new Contract(REMIT_CONTRACT_ID);
      const operation = contract.call("get_stats");

      const dummyTx = new TransactionBuilder(makeDummyAccount(), {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const sim = await this.rpc.simulateTransaction(dummyTx);
      if (SorobanRpc.Api.isSimulationSuccess(sim) && sim.result) {
        const native = scValToNative(sim.result.retval);
        return {
          total_volume: BigInt(native.total_volume ?? 0),
          total_fees: BigInt(native.total_fees ?? 0),
          total_txns: BigInt(native.total_txns ?? 0),
          fee_bps: BigInt(native.fee_bps ?? 50),
        };
      }
    } catch (e) {
      console.warn("Failed to fetch remittance stats:", e);
    }
    return { total_volume: 0n, total_fees: 0n, total_txns: 0n, fee_bps: 50n };
  }

  /** Get SRT token balance for an address */
  async getSrtBalance(ownerAddress: string): Promise<bigint> {
    try {
      const contract = new Contract(SRT_TOKEN_CONTRACT_ID);
      const operation = contract.call(
        "balance_of",
        new Address(ownerAddress).toScVal()
      );

      const dummyTx = new TransactionBuilder(makeDummyAccount(), {
        fee: BASE_FEE,
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(30)
        .build();

      const sim = await this.rpc.simulateTransaction(dummyTx);
      if (SorobanRpc.Api.isSimulationSuccess(sim) && sim.result) {
        return BigInt(scValToNative(sim.result.retval) ?? 0);
      }
    } catch (e) {
      console.warn("Failed to fetch SRT token balance:", e);
    }
    return 0n;
  }

  // ── Write Calls ────────────────────────────────────────────────────────────

  /** Execute a remittance on-chain */
  async sendRemittance(
    kit: StellarWalletsKit,
    senderAddress: string,
    recipientAddress: string,
    corridorId: string,
    amountXlm: number
  ): Promise<ContractCallResult<string>> {
    try {
      const amountStroops = BigInt(Math.floor(amountXlm * STROOPS_PER_XLM));
      const contract = new Contract(REMIT_CONTRACT_ID);

      const operation = contract.call(
        "send_remittance",
        new Address(senderAddress).toScVal(),
        new Address(recipientAddress).toScVal(),
        nativeToScVal(corridorId, { type: "symbol" }),
        nativeToScVal(amountStroops, { type: "i128" }),
        nativeToScVal(0n, { type: "i128" }) // min_amount_out
      );

      const accountRes = await fetch(
        `${STELLAR_CONFIG.horizonUrl}/accounts/${senderAddress}`
      );
      if (!accountRes.ok) {
        return { success: false, error: "Sender account not found on network" };
      }
      const accountData = await accountRes.json();
      const account = new StellarSdk.Account(senderAddress, accountData.sequence);

      const tx = new TransactionBuilder(account, {
        fee: (parseInt(BASE_FEE) * 10).toString(),
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(180)
        .build();

      const sim = await this.rpc.simulateTransaction(tx);
      if (SorobanRpc.Api.isSimulationError(sim)) {
        return { success: false, error: `Simulation failed: ${sim.error}` };
      }

      const assembled = SorobanRpc.assembleTransaction(tx, sim);
      const xdrString = assembled.build().toXDR();

      const { signedTxXdr } = await kit.signTransaction(xdrString);
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, this.networkPassphrase);

      const response = await this.rpc.sendTransaction(signedTx);
      if (response.status === "ERROR") {
        return { success: false, error: "Transaction submission rejected by node" };
      }

      return { success: true, value: response.hash, txHash: response.hash };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to execute remittance",
      };
    }
  }

  /** Set FX rate for a corridor (admin-only) */
  async setFxRate(
    kit: StellarWalletsKit,
    adminAddress: string,
    corridorId: string,
    rateScaled: bigint
  ): Promise<ContractCallResult<string>> {
    try {
      const contract = new Contract(REMIT_CONTRACT_ID);

      const operation = contract.call(
        "set_fx_rate",
        new Address(adminAddress).toScVal(),
        nativeToScVal(corridorId, { type: "symbol" }),
        nativeToScVal(rateScaled, { type: "i128" })
      );

      const accountRes = await fetch(
        `${STELLAR_CONFIG.horizonUrl}/accounts/${adminAddress}`
      );
      if (!accountRes.ok) {
        return { success: false, error: "Admin account not found on network" };
      }
      const accountData = await accountRes.json();
      const account = new StellarSdk.Account(adminAddress, accountData.sequence);

      const tx = new TransactionBuilder(account, {
        fee: (parseInt(BASE_FEE) * 10).toString(),
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(operation)
        .setTimeout(180)
        .build();

      const sim = await this.rpc.simulateTransaction(tx);
      if (SorobanRpc.Api.isSimulationError(sim)) {
        return { success: false, error: `Simulation failed: ${sim.error}` };
      }

      const assembled = SorobanRpc.assembleTransaction(tx, sim);
      const xdrString = assembled.build().toXDR();

      const { signedTxXdr } = await kit.signTransaction(xdrString);
      const signedTx = TransactionBuilder.fromXDR(signedTxXdr, this.networkPassphrase);

      const response = await this.rpc.sendTransaction(signedTx);
      if (response.status === "ERROR") {
        return { success: false, error: "Transaction submission rejected" };
      }

      return { success: true, value: response.hash, txHash: response.hash };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to set FX rate",
      };
    }
  }
}

export const remitClient = new StellarRemitClient();

/** Fetch native XLM balance for an address from Horizon API */
export async function fetchXlmBalance(address: string): Promise<string> {
  try {
    const res = await fetch(`${STELLAR_CONFIG.horizonUrl}/accounts/${address}`);
    if (!res.ok) return "0";
    const data = await res.json();
    const nativeBalance = data.balances?.find(
      (b: { asset_type: string; balance: string }) => b.asset_type === "native"
    );
    return nativeBalance ? nativeBalance.balance : "0";
  } catch (err) {
    console.error("Error fetching XLM balance:", err);
    return "0";
  }
}

/** Fetch SRT token reward balance for an address from Soroban contract */
export async function fetchRewardBalance(address: string): Promise<number> {
  try {
    const balanceBigInt = await remitClient.getSrtBalance(address);
    return Number(balanceBigInt);
  } catch (err) {
    console.error("Error fetching SRT reward balance:", err);
    return 0;
  }
}
