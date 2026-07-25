use soroban_sdk::{Address, Env, Symbol};

// ──────────────────────────────────────────────────────────────────────────────
// StellarRemit — On-Chain Events
// ──────────────────────────────────────────────────────────────────────────────

/// Emitted when a remittance is successfully sent.
///
/// Topics : ["remittance_sent", sender]
/// Data   : [recipient, corridor_id, amount_in, amount_out, fee]
pub fn remittance_sent(
    env: &Env,
    sender: &Address,
    recipient: &Address,
    corridor_id: &Symbol,
    amount_in: i128,
    amount_out: i128,
    fee: i128,
) {
    env.events().publish(
        (Symbol::new(env, "remittance_sent"), sender.clone()),
        (recipient.clone(), corridor_id.clone(), amount_in, amount_out, fee),
    );
}

/// Emitted when an admin updates the FX rate for a corridor.
///
/// Topics : ["fx_rate_updated", corridor_id]
/// Data   : [old_rate, new_rate]
pub fn fx_rate_updated(
    env: &Env,
    corridor_id: &Symbol,
    old_rate: i128,
    new_rate: i128,
) {
    env.events().publish(
        (Symbol::new(env, "fx_rate_updated"), corridor_id.clone()),
        (old_rate, new_rate),
    );
}
