"use client";

import { useCallback, useEffect } from "react";
import { useWalletStore } from "@/store/wallet-store";
import {
  openWalletModal,
  signTransaction,
  disconnectWallet,
  setActiveWallet,
  getConnectedAddress,
} from "@/lib/stellar/wallet-kit";
import { fetchXlmBalance, fetchRewardBalance } from "@/lib/stellar/contract";
import { parseContractError } from "@/lib/utils";

// ──────────────────────────────────────────────────────────────────────────────
// useWallet Hook
// ──────────────────────────────────────────────────────────────────────────────

export function useWallet() {
  const store = useWalletStore();

  /** Fetch both XLM and SRT reward balances for an address */
  const fetchAllBalances = useCallback(
    async (address: string) => {
      try {
        const [balanceResult, rewardResult] = await Promise.allSettled([
          fetchXlmBalance(address),
          fetchRewardBalance(address),
        ]);

        if (balanceResult.status === "fulfilled") {
          store.setBalance(balanceResult.value);
        }
        if (rewardResult.status === "fulfilled") {
          store.setRewardBalance(rewardResult.value);
        }
      } catch (err) {
        console.error("Error in fetchAllBalances:", err);
      }
    },
    [store]
  );

  // Automatically fetch balances whenever wallet is connected and balance is null
  useEffect(() => {
    if (store.isConnected && store.address && store.balance === null) {
      fetchAllBalances(store.address);
    }
  }, [store.isConnected, store.address, store.balance, fetchAllBalances]);

  /** Open the wallet selection modal and connect */
  const connect = useCallback(async () => {
    store.setConnecting(true);
    store.setError(null);

    try {
      const { walletId, address } = await openWalletModal();
      store.setConnected(address, walletId);

      // Fetch XLM + SRT reward balances in parallel
      await fetchAllBalances(address);
    } catch (err) {
      const message = parseContractError(err);
      if (!message.includes("closed without")) {
        store.setError(message);
      } else {
        store.setConnecting(false);
      }
    }
  }, [store, fetchAllBalances]);

  /** Disconnect the current wallet */
  const disconnect = useCallback(async () => {
    await disconnectWallet();
    store.setDisconnected();
  }, [store]);

  /** Refresh the XLM + SRT balances */
  const refreshBalance = useCallback(async () => {
    if (!store.address) return;
    try {
      await fetchAllBalances(store.address);
    } catch {
      // Ignore balance fetch errors
    }
  }, [store, fetchAllBalances]);

  /** Restore wallet from persisted state on page load */
  const restoreWallet = useCallback(async () => {
    if (!store.isConnected || !store.address) return;

    try {
      if (store.walletId) {
        setActiveWallet(store.walletId);
      }
      const address = (await getConnectedAddress()) || store.address;
      if (address) {
        await fetchAllBalances(address);
      }
    } catch {
      // Fallback: fetch balances for saved address
      if (store.address) {
        await fetchAllBalances(store.address);
      }
    }
  }, [store, fetchAllBalances]);

  return {
    // State
    isConnected: store.isConnected,
    address: store.address,
    balance: store.balance,
    rewardBalance: store.rewardBalance,
    network: store.network,
    isConnecting: store.isConnecting,
    error: store.error,

    // Actions
    connect,
    disconnect,
    refreshBalance,
    restoreWallet,

    // Signing
    sign: signTransaction,
  };
}
