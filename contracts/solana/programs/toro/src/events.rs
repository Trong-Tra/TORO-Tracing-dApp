use anchor_lang::prelude::*;

/// Mirrors the EVM `BatchMinted` event. `data` is the same
/// abi.encode(uint256[] codes, bytes32[] values) blob used on EVM.
#[event]
pub struct BatchMinted {
    pub batch_id: [u8; 32],
    pub data: Vec<u8>,
    pub timestamp: i64,
    pub recorder: Pubkey,
}

/// Mirrors the EVM `TraceRecorded` event (emitted for every stage transition
/// of both batches and lots).
#[event]
pub struct TraceRecorded {
    pub id: [u8; 32],
    pub stage: u8,
    pub data: Vec<u8>,
    pub timestamp: i64,
    pub recorder: Pubkey,
}

/// Mirrors the EVM `LotCreated` event.
#[event]
pub struct LotCreated {
    pub lot_code: [u8; 32],
    pub input_batch_ids: Vec<[u8; 32]>,
    pub total_cans: u64,
    pub data: Vec<u8>,
    pub timestamp: i64,
    pub recorder: Pubkey,
}
