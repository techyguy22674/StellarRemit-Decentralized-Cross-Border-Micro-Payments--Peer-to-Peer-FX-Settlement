use soroban_sdk::{contracttype, Symbol};

// ──────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ──────────────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum DataKey {
    /// Contract admin address
    Admin,
    /// SRT token contract address
    RemitToken,
    /// Global swap fee in basis points (e.g. 50 = 0.5%)
    FeeBps,
    /// Cumulative total remittance volume (in stroops)
    TotalVolume,
    /// Cumulative total fees collected (in stroops)
    TotalFees,
    /// Total remittance transaction count
    TotalTxns,
    /// FX rate for a given corridor (Symbol → i128)
    FxRate(Symbol),
}

// ──────────────────────────────────────────────────────────────────────────────
// Remittance Statistics
// ──────────────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug)]
pub struct RemittanceStats {
    /// Cumulative volume of XLM sent (in stroops)
    pub total_volume: i128,
    /// Cumulative fees collected (in stroops)
    pub total_fees: i128,
    /// Number of remittance transactions executed
    pub total_txns: i128,
    /// Current fee rate in basis points
    pub fee_bps: i128,
}

// ──────────────────────────────────────────────────────────────────────────────
// FX Quote — Returned before sending a remittance
// ──────────────────────────────────────────────────────────────────────────────

#[contracttype]
#[derive(Clone, Debug)]
pub struct FxQuote {
    /// Amount the recipient will receive (after fee)
    pub amount_out: i128,
    /// Fee deducted from the sender's amount (in stroops)
    pub fee: i128,
    /// FX rate used for this corridor
    pub rate: i128,
    /// Price impact in basis points (always 0 for oracle-based FX)
    pub price_impact_bps: i128,
}
