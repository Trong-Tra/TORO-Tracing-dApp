pub mod constants;
pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("2cbYretd93guxpURxqhq1UedBtwSHzT2NX6MsrBc4FWc");

#[program]
pub mod toro {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }

    pub fn add_factory_signer(ctx: Context<AddFactorySigner>, wallet: Pubkey) -> Result<()> {
        roles::add_handler(ctx, wallet)
    }

    pub fn remove_factory_signer(ctx: Context<RemoveFactorySigner>) -> Result<()> {
        roles::remove_handler(ctx)
    }

    pub fn authorize_station(ctx: Context<AuthorizeStation>, wallet: Pubkey) -> Result<()> {
        roles::authorize_handler(ctx, wallet)
    }

    pub fn revoke_station(ctx: Context<RevokeStation>) -> Result<()> {
        roles::revoke_handler(ctx)
    }

    pub fn mint_batch(ctx: Context<MintBatch>, batch_id: [u8; 32], data: Vec<u8>) -> Result<()> {
        mint_batch::handler(ctx, batch_id, data)
    }

    pub fn record_inventory(ctx: Context<RecordBatchStage>, data: Vec<u8>) -> Result<()> {
        record_batch_stage::inventory_handler(ctx, data)
    }

    pub fn record_manufacturing(ctx: Context<RecordBatchStage>, data: Vec<u8>) -> Result<()> {
        record_batch_stage::manufacturing_handler(ctx, data)
    }

    pub fn create_product_lot<'info>(
        ctx: Context<'info, CreateProductLot<'info>>,
        lot_code: [u8; 32],
        total_cans: u64,
        data: Vec<u8>,
    ) -> Result<()> {
        create_product_lot::handler(ctx, lot_code, total_cans, data)
    }

    pub fn record_warehouse(ctx: Context<RecordLotStage>, data: Vec<u8>) -> Result<()> {
        record_lot_stage::warehouse_handler(ctx, data)
    }

    pub fn record_distribution(ctx: Context<RecordLotStage>, data: Vec<u8>) -> Result<()> {
        record_lot_stage::distribution_handler(ctx, data)
    }

    pub fn transfer_authority(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
        transfer_authority::handler(ctx, new_authority)
    }
}
