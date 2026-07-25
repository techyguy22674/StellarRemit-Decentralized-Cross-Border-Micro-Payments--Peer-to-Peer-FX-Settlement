use soroban_sdk::contracterror;

// ──────────────────────────────────────────────────────────────────────────────
// StellarRemit — Error Codes
// ──────────────────────────────────────────────────────────────────────────────

#[contracterror]
#[derive(Clone, Debug, PartialEq)]
pub enum RemitError {
    /// Contract already initialized
    AlreadyInitialized  = 1,
    /// Contract not yet initialized
    NotInitialized      = 2,
    /// Caller is not the admin
    Unauthorized        = 3,
    /// Amount must be > 0
    InvalidAmount       = 4,
    /// Corridor FX rate is zero or not set
    CorridorNotFound    = 5,
    /// Output would be below the minimum requested
    SlippageExceeded    = 6,
    /// SRT token contract not linked
    TokenNotSet         = 7,
}
