#![no_std]

//! # StellarRemit Token (SRT)
//!
//! A fungible reward/LP token contract for the StellarRemit protocol.
//! Only the designated `admin` (the StellarRemit contract or deployer)
//! may mint new SRT tokens.
//!
//! Token holders can:
//! - Transfer SRT tokens to other accounts
//! - Check their SRT balance
//! - Burn SRT tokens (via burn_from)
//!
//! Tokenomics:
//! - SRT tokens are minted as loyalty/reward tokens on successful remittances
//! - Admin controls minting; supply is transparent on-chain
//!
//! Storage layout:
//!   Instance   → Admin    (Address)
//!   Instance   → Name     (String)  = "StellarRemit Token"
//!   Instance   → Symbol   (String)  = "SRT"
//!   Persistent → Balance(owner: Address) → i128
//!   Persistent → Allowance(owner, spender) → i128

use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    Address, Env, String,
};

// ── Storage Keys ─────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DataKey {
    Admin,
    Name,
    Symbol,
    Balance(Address),
    Allowance(Address, Address),
}

// ── Errors ───────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Clone, Debug, PartialEq)]
pub enum RemitTokenError {
    AlreadyInitialized    = 1,
    NotInitialized        = 2,
    Unauthorized          = 3,
    InvalidAmount         = 4,
    InsufficientBalance   = 5,
    InsufficientAllowance = 6,
}

// ── Contract ─────────────────────────────────────────────────────────────────

#[contract]
pub struct RemitTokenContract;

#[contractimpl]
impl RemitTokenContract {
    // ── Admin ─────────────────────────────────────────────────────────────────

    /// Initialize the SRT token with an admin (the StellarRemit contract).
    ///
    /// May only be called once. The admin is the only account that can mint
    /// new SRT tokens (done automatically on successful remittances).
    pub fn initialize(
        env: Env,
        admin: Address,
        name: String,
        symbol: String,
    ) -> Result<(), RemitTokenError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(RemitTokenError::AlreadyInitialized);
        }
        admin.require_auth();

        env.storage().instance().set(&DataKey::Admin,  &admin);
        env.storage().instance().set(&DataKey::Name,   &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
        env.storage().instance().extend_ttl(100_000, 100_000);

        Ok(())
    }

    // ── Mint (admin-only) ─────────────────────────────────────────────────────

    /// Mint new SRT tokens to an address (admin-only).
    ///
    /// Called by the StellarRemit contract to reward users for remittances.
    pub fn mint(
        env: Env,
        admin: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), RemitTokenError> {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(RemitTokenError::NotInitialized)?;

        if admin != stored_admin {
            return Err(RemitTokenError::Unauthorized);
        }

        if amount <= 0 {
            return Err(RemitTokenError::InvalidAmount);
        }

        let current: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(current + amount));
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Balance(to), 100_000, 100_000);

        Ok(())
    }

    // ── Burn ──────────────────────────────────────────────────────────────────

    /// Burn (reduce) SRT tokens from an address.
    ///
    /// The `from` address must authorize this call.
    pub fn burn_from(
        env: Env,
        from: Address,
        amount: i128,
    ) -> Result<(), RemitTokenError> {
        from.require_auth();

        if amount <= 0 {
            return Err(RemitTokenError::InvalidAmount);
        }

        let current: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);

        if current < amount {
            return Err(RemitTokenError::InsufficientBalance);
        }

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(current - amount));
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Balance(from), 100_000, 100_000);

        Ok(())
    }

    // ── Transfer ──────────────────────────────────────────────────────────────

    /// Transfer SRT tokens from one address to another.
    ///
    /// The `from` address must authorize this call.
    pub fn transfer(
        env: Env,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), RemitTokenError> {
        from.require_auth();

        if amount <= 0 {
            return Err(RemitTokenError::InvalidAmount);
        }

        let from_balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);

        if from_balance < amount {
            return Err(RemitTokenError::InsufficientBalance);
        }

        let to_balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));

        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Balance(from), 100_000, 100_000);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Balance(to), 100_000, 100_000);

        Ok(())
    }

    // ── Approve ───────────────────────────────────────────────────────────────

    /// Approve a spender to transfer up to `amount` SRT tokens on behalf of `owner`.
    pub fn approve(
        env: Env,
        owner: Address,
        spender: Address,
        amount: i128,
    ) -> Result<(), RemitTokenError> {
        owner.require_auth();

        env.storage()
            .persistent()
            .set(&DataKey::Allowance(owner.clone(), spender.clone()), &amount);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Allowance(owner, spender), 100_000, 100_000);

        Ok(())
    }

    // ── Transfer From (allowance) ─────────────────────────────────────────────

    /// Transfer SRT tokens using a previously set allowance.
    pub fn transfer_from(
        env: Env,
        spender: Address,
        from: Address,
        to: Address,
        amount: i128,
    ) -> Result<(), RemitTokenError> {
        spender.require_auth();

        if amount <= 0 {
            return Err(RemitTokenError::InvalidAmount);
        }

        let allowance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Allowance(from.clone(), spender.clone()))
            .unwrap_or(0);

        if allowance < amount {
            return Err(RemitTokenError::InsufficientAllowance);
        }

        let from_balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(from.clone()))
            .unwrap_or(0);

        if from_balance < amount {
            return Err(RemitTokenError::InsufficientBalance);
        }

        let to_balance: i128 = env
            .storage()
            .persistent()
            .get(&DataKey::Balance(to.clone()))
            .unwrap_or(0);

        env.storage()
            .persistent()
            .set(&DataKey::Balance(from.clone()), &(from_balance - amount));
        env.storage()
            .persistent()
            .set(&DataKey::Balance(to.clone()), &(to_balance + amount));
        env.storage()
            .persistent()
            .set(&DataKey::Allowance(from.clone(), spender.clone()), &(allowance - amount));

        env.storage().persistent().extend_ttl(&DataKey::Balance(from.clone()), 100_000, 100_000);
        env.storage().persistent().extend_ttl(&DataKey::Balance(to), 100_000, 100_000);
        env.storage().persistent().extend_ttl(&DataKey::Allowance(from, spender), 100_000, 100_000);

        Ok(())
    }

    // ── View Functions ────────────────────────────────────────────────────────

    /// Return the SRT balance of an account.
    pub fn balance_of(env: Env, owner: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Balance(owner))
            .unwrap_or(0)
    }

    /// Return the remaining allowance for a spender.
    pub fn allowance(env: Env, owner: Address, spender: Address) -> i128 {
        env.storage()
            .persistent()
            .get(&DataKey::Allowance(owner, spender))
            .unwrap_or(0)
    }

    /// Return the token name.
    pub fn name(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Name)
            .unwrap_or_else(|| String::from_str(&env, "StellarRemit Token"))
    }

    /// Return the token symbol.
    pub fn symbol(env: Env) -> String {
        env.storage()
            .instance()
            .get(&DataKey::Symbol)
            .unwrap_or_else(|| String::from_str(&env, "SRT"))
    }

    /// Return the admin address.
    pub fn admin(env: Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Admin)
    }
}

// ──────────────────────────────────────────────────────────────────────────────
// Unit Tests
// ──────────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Env, String};

    fn setup() -> (Env, RemitTokenContractClient<'static>, Address) {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(RemitTokenContract, ());
        let client = RemitTokenContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(
            &admin,
            &String::from_str(&env, "StellarRemit Token"),
            &String::from_str(&env, "SRT"),
        );
        (env, client, admin)
    }

    #[test]
    fn test_initialize_and_name() {
        let (env, client, _admin) = setup();
        assert_eq!(client.name(), String::from_str(&env, "StellarRemit Token"));
        assert_eq!(client.symbol(), String::from_str(&env, "SRT"));
    }

    #[test]
    fn test_mint_and_balance() {
        let (_env, client, admin) = setup();
        let user = Address::generate(&_env);
        client.mint(&admin, &user, &1_000_000i128);
        assert_eq!(client.balance_of(&user), 1_000_000);
    }

    #[test]
    fn test_transfer() {
        let (_env, client, admin) = setup();
        let alice = Address::generate(&_env);
        let bob = Address::generate(&_env);
        client.mint(&admin, &alice, &500_000i128);
        client.transfer(&alice, &bob, &200_000i128);
        assert_eq!(client.balance_of(&alice), 300_000);
        assert_eq!(client.balance_of(&bob), 200_000);
    }

    #[test]
    fn test_burn_from() {
        let (_env, client, admin) = setup();
        let user = Address::generate(&_env);
        client.mint(&admin, &user, &1_000_000i128);
        client.burn_from(&user, &400_000i128);
        assert_eq!(client.balance_of(&user), 600_000);
    }
}
