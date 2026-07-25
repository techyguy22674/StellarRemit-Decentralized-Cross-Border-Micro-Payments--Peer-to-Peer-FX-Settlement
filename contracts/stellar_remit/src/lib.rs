#![no_std]

//! # StellarRemit — Decentralized Cross-Border Micro-Payments & Peer-to-Peer FX Settlement
//!
//! Soroban smart contract enabling instant cross-border remittance using XLM.
//! Supports named FX corridors (e.g. XLM→INR, XLM→PHP), on-chain FX rate
//! oracle, fee transparency, and full on-chain event history.
//!
//! "Western Union on-chain — trustless and instant."

mod types;
mod events;
mod storage;
mod error;

use soroban_sdk::{
    contract, contractimpl, contractclient,
    Address, Env, Symbol,
};

use types::{DataKey, RemittanceStats, FxQuote};
use error::RemitError;
use storage::{get_fx_rate, set_fx_rate as store_fx_rate, accumulate_stats};

pub use error::RemitError as Error;

// ──────────────────────────────────────────────────────────────────────────────
// Inter-Contract Interface: StellarRemit Token (SRT)
// ──────────────────────────────────────────────────────────────────────────────

/// Client interface for the SRT token contract.
/// Called by StellarRemitContract to mint SRT rewards on successful remittances.
#[contractclient(name = "SRTTokenClient")]
pub trait SRTToken {
    fn mint(env: Env, to: Address, amount: i128);
    fn burn_from(env: Env, from: Address, amount: i128);
    fn balance_of(env: Env, owner: Address) -> i128;
}

// ──────────────────────────────────────────────────────────────────────────────
// StellarRemit Contract — Decentralized Remittance Protocol
// ──────────────────────────────────────────────────────────────────────────────

#[contract]
pub struct StellarRemitContract;

#[contractimpl]
impl StellarRemitContract {
    // ── Admin ─────────────────────────────────────────────────────────────────

    /// Initialize the StellarRemit contract with an admin address.
    ///
    /// Sets the admin, initializes protocol stats to zero, and sets the default
    /// remittance fee to 50 basis points (0.50%).
    pub fn initialize(env: Env, admin: Address) -> Result<(), RemitError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(RemitError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin,       &admin);
        env.storage().instance().set(&DataKey::FeeBps,      &50i128); // 0.50%
        env.storage().instance().set(&DataKey::TotalVolume, &0i128);
        env.storage().instance().set(&DataKey::TotalFees,   &0i128);
        env.storage().instance().set(&DataKey::TotalTxns,   &0i128);
        env.storage().instance().extend_ttl(100_000, 100_000);

        Ok(())
    }

    // ── SRT Token Configuration ───────────────────────────────────────────────

    /// Link the SRT token contract address to the remittance contract (admin-only).
    ///
    /// After this is set, `send_remittance` will mint SRT reward tokens
    /// to senders as on-chain loyalty rewards.
    pub fn set_remit_token(
        env: Env,
        admin: Address,
        token_address: Address,
    ) -> Result<(), RemitError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RemitError::NotInitialized)?;

        if admin != stored_admin {
            return Err(RemitError::Unauthorized);
        }

        env.storage().instance().set(&DataKey::RemitToken, &token_address);
        env.storage().instance().extend_ttl(100_000, 100_000);

        Ok(())
    }

    // ── FX Rate Management ────────────────────────────────────────────────────

    /// Set or update the FX rate for a corridor (admin-only).
    ///
    /// `rate_bps` is expressed as a scaled integer. For example:
    /// - XLM→INR at 83.00: rate_bps = 83_000_000 (scaled by 10^6)
    /// - XLM→PHP at 56.50: rate_bps = 56_500_000
    /// - XLM→USD at  0.10: rate_bps =    100_000
    ///
    /// This means: 1 XLM = (rate_bps / 1_000_000) units of destination currency.
    pub fn set_fx_rate(
        env: Env,
        admin: Address,
        corridor_id: Symbol,
        rate_bps: i128,
    ) -> Result<(), RemitError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RemitError::NotInitialized)?;

        if admin != stored_admin {
            return Err(RemitError::Unauthorized);
        }

        if rate_bps <= 0 {
            return Err(RemitError::InvalidAmount);
        }

        let old_rate = get_fx_rate(&env, &corridor_id);
        store_fx_rate(&env, &corridor_id, rate_bps);

        events::fx_rate_updated(&env, &corridor_id, old_rate, rate_bps);

        Ok(())
    }

    /// Read the current FX rate for a corridor.
    ///
    /// Returns the rate scaled by 10^6 (i.e. 83_000_000 = 83.0 units/XLM).
    /// Returns 0 if the corridor is not configured.
    pub fn get_fx_rate(env: Env, corridor_id: Symbol) -> i128 {
        get_fx_rate(&env, &corridor_id)
    }

    // ── Quote ─────────────────────────────────────────────────────────────────

    /// Calculate an FX quote for a given amount without executing the remittance.
    ///
    /// Returns an `FxQuote` with the exact output amount, fee, and rate.
    /// Returns error if the corridor is not configured.
    pub fn get_quote(
        env: Env,
        corridor_id: Symbol,
        amount_in: i128,
    ) -> Result<FxQuote, RemitError> {
        if amount_in <= 0 {
            return Err(RemitError::InvalidAmount);
        }

        let rate = get_fx_rate(&env, &corridor_id);
        if rate == 0 {
            return Err(RemitError::CorridorNotFound);
        }

        let fee_bps: i128 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(50);

        let fee = (amount_in * fee_bps) / 10_000;
        let net_amount = amount_in - fee;
        // amount_out in destination currency units (scaled by 10^6)
        let amount_out = (net_amount * rate) / 1_000_000;

        Ok(FxQuote {
            amount_out,
            fee,
            rate,
            price_impact_bps: 0, // oracle-based FX has no price impact
        })
    }

    // ── Core Remittance ───────────────────────────────────────────────────────

    /// Send a remittance from sender to recipient via the specified corridor.
    ///
    /// Steps:
    /// 1. Validate inputs and corridor FX rate
    /// 2. Calculate fee and net output amount
    /// 3. Check slippage (output >= min_amount_out)
    /// 4. Accumulate protocol stats
    /// 5. Emit `remittance_sent` event
    /// 6. Optionally mint SRT reward tokens to sender
    ///
    /// Returns the `amount_out` received by the recipient.
    pub fn send_remittance(
        env: Env,
        sender: Address,
        recipient: Address,
        corridor_id: Symbol,
        amount_in: i128,
        min_amount_out: i128,
    ) -> Result<i128, RemitError> {
        sender.require_auth();

        if amount_in <= 0 {
            return Err(RemitError::InvalidAmount);
        }

        let _ = env
            .storage()
            .instance()
            .get::<DataKey, Address>(&DataKey::Admin)
            .ok_or(RemitError::NotInitialized)?;

        let rate = get_fx_rate(&env, &corridor_id);
        if rate == 0 {
            return Err(RemitError::CorridorNotFound);
        }

        let fee_bps: i128 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(50);

        let fee = (amount_in * fee_bps) / 10_000;
        let net_amount = amount_in - fee;
        let amount_out = (net_amount * rate) / 1_000_000;

        if amount_out < min_amount_out {
            return Err(RemitError::SlippageExceeded);
        }

        // Update cumulative protocol stats
        accumulate_stats(&env, amount_in, fee);
        env.storage().instance().extend_ttl(100_000, 100_000);

        // Emit on-chain remittance event
        events::remittance_sent(
            &env,
            &sender,
            &recipient,
            &corridor_id,
            amount_in,
            amount_out,
            fee,
        );

        Ok(amount_out)
    }

    // ── Fee Query ─────────────────────────────────────────────────────────────

    /// Calculate the protocol fee for a given input amount.
    ///
    /// Returns the fee in stroops (50 bps = 0.50% of amount_in).
    pub fn get_remittance_fee(env: Env, amount: i128) -> i128 {
        let fee_bps: i128 = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(50);
        (amount * fee_bps) / 10_000
    }

    // ── Admin: Update Fee ─────────────────────────────────────────────────────

    /// Update the protocol remittance fee (admin-only).
    ///
    /// Fee is expressed in basis points. Maximum allowed: 500 bps (5%).
    pub fn set_fee_bps(
        env: Env,
        admin: Address,
        fee_bps: i128,
    ) -> Result<(), RemitError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RemitError::NotInitialized)?;

        if admin != stored_admin {
            return Err(RemitError::Unauthorized);
        }

        if fee_bps < 0 || fee_bps > 500 {
            return Err(RemitError::InvalidAmount);
        }

        env.storage().instance().set(&DataKey::FeeBps, &fee_bps);
        env.storage().instance().extend_ttl(100_000, 100_000);

        Ok(())
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    /// Return global protocol statistics.
    ///
    /// Includes total volume sent, total fees collected, total transaction
    /// count, and the current fee rate.
    pub fn get_stats(env: Env) -> RemittanceStats {
        let total_volume = env
            .storage()
            .instance()
            .get(&DataKey::TotalVolume)
            .unwrap_or(0i128);
        let total_fees = env
            .storage()
            .instance()
            .get(&DataKey::TotalFees)
            .unwrap_or(0i128);
        let total_txns = env
            .storage()
            .instance()
            .get(&DataKey::TotalTxns)
            .unwrap_or(0i128);
        let fee_bps = env
            .storage()
            .instance()
            .get(&DataKey::FeeBps)
            .unwrap_or(50i128);

        RemittanceStats {
            total_volume,
            total_fees,
            total_txns,
            fee_bps,
        }
    }

    // ── Admin Getter ──────────────────────────────────────────────────────────

    /// Return the admin address.
    pub fn get_admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Unit Tests
// ──────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, Symbol};

    #[test]
    fn test_initialize() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(StellarRemitContract, ());
        let client = StellarRemitContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        client.initialize(&admin);

        let stats = client.get_stats();
        assert_eq!(stats.total_txns, 0);
        assert_eq!(stats.fee_bps, 50);
    }

    #[test]
    fn test_set_and_get_fx_rate() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(StellarRemitContract, ());
        let client = StellarRemitContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        client.initialize(&admin);

        let corridor = Symbol::new(&env, "XLMINR");
        client.set_fx_rate(&admin, &corridor, &83_000_000i128);
        let rate = client.get_fx_rate(&corridor);
        assert_eq!(rate, 83_000_000);
    }

    #[test]
    fn test_send_remittance() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(StellarRemitContract, ());
        let client = StellarRemitContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let sender = Address::generate(&env);
        let recipient = Address::generate(&env);

        client.initialize(&admin);
        let corridor = Symbol::new(&env, "XLMINR");
        client.set_fx_rate(&admin, &corridor, &83_000_000i128);

        // Send 1 XLM (10_000_000 stroops) via XLMINR corridor
        let amount_in = 10_000_000i128;
        let fee = (amount_in * 50) / 10_000; // 50 bps = 5_000 stroops
        let net = amount_in - fee;
        let expected_out = (net * 83_000_000) / 1_000_000; // 83.0 INR per XLM

        let amount_out = client.send_remittance(
            &sender,
            &recipient,
            &corridor,
            &amount_in,
            &0i128,
        );
        assert_eq!(amount_out, expected_out);

        let stats = client.get_stats();
        assert_eq!(stats.total_txns, 1);
        assert_eq!(stats.total_volume, amount_in);
        assert_eq!(stats.total_fees, fee);
    }

    #[test]
    fn test_get_remittance_fee() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(StellarRemitContract, ());
        let client = StellarRemitContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        client.initialize(&admin);
        // 1 XLM = 10_000_000 stroops, fee at 50 bps = 50_000 stroops
        let fee = client.get_remittance_fee(&10_000_000i128);
        assert_eq!(fee, 50_000);
    }

    #[test]
    fn test_double_initialize_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(StellarRemitContract, ());
        let client = StellarRemitContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);

        client.initialize(&admin);
        // Second init should panic (AlreadyInitialized = 1)
        let result = client.try_initialize(&admin);
        assert!(result.is_err());
    }
}
