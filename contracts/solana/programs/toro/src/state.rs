use anchor_lang::prelude::*;

use crate::constants::MAX_LOT_INPUTS;

#[account]
pub struct Config {
    pub authority: Pubkey,
    pub batch_count: u64,
    pub lot_count: u64,
    pub bump: u8,
}

impl Config {
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}

/// Marker account: its existence authorizes the wallet as a factory signer
/// (seeds = ["factory", wallet]) or station (seeds = ["station", wallet]).
#[account]
pub struct Role {
    pub wallet: Pubkey,
    pub bump: u8,
}

impl Role {
    pub const LEN: usize = 8 + 32 + 1;
}

/// Raw-material batch (e.g. a vessel catch or farm harvest).
/// Rich trace data is event-only, same as the EVM version.
#[account]
pub struct Batch {
    pub batch_id: [u8; 32],
    pub stage: u8,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl Batch {
    pub const LEN: usize = 8 + 32 + 1 + 8 + 8 + 1;
}

/// Finished-product lot, merged from 1..=MAX_LOT_INPUTS batches.
#[account]
pub struct Lot {
    pub lot_code: [u8; 32],
    pub stage: u8,
    pub total_cans: u64,
    pub input_batches: [Pubkey; MAX_LOT_INPUTS],
    pub input_count: u8,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

impl Lot {
    pub const LEN: usize = 8 + 32 + 1 + 8 + (32 * MAX_LOT_INPUTS) + 1 + 8 + 8 + 1;
}
