use soroban_sdk::{Env, Symbol};
use crate::types::DataKey;

// ──────────────────────────────────────────────────────────────────────────────
// StellarRemit — Storage Helpers
// ──────────────────────────────────────────────────────────────────────────────

/// Get the FX rate for a corridor. Returns 0 if not set.
pub fn get_fx_rate(env: &Env, corridor_id: &Symbol) -> i128 {
    env.storage()
        .persistent()
        .get(&DataKey::FxRate(corridor_id.clone()))
        .unwrap_or(0i128)
}

/// Set the FX rate for a corridor.
pub fn set_fx_rate(env: &Env, corridor_id: &Symbol, rate: i128) {
    env.storage()
        .persistent()
        .set(&DataKey::FxRate(corridor_id.clone()), &rate);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::FxRate(corridor_id.clone()), 100_000, 100_000);
}

/// Increment cumulative stats after a remittance.
pub fn accumulate_stats(env: &Env, amount_in: i128, fee: i128) {
    let vol: i128 = env.storage().instance().get(&DataKey::TotalVolume).unwrap_or(0);
    let fees: i128 = env.storage().instance().get(&DataKey::TotalFees).unwrap_or(0);
    let txns: i128 = env.storage().instance().get(&DataKey::TotalTxns).unwrap_or(0);
    env.storage().instance().set(&DataKey::TotalVolume, &(vol + amount_in));
    env.storage().instance().set(&DataKey::TotalFees, &(fees + fee));
    env.storage().instance().set(&DataKey::TotalTxns, &(txns + 1));
}
