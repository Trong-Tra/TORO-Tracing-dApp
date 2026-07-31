use anchor_lang::prelude::*;

use crate::constants::{
    BATCH_SEED, CONFIG_SEED, STAGE_INVENTORY, STAGE_MANUFACTURING, STAGE_SOURCE, STATION_SEED,
};
use crate::error::ToroError;
use crate::events::TraceRecorded;
use crate::state::*;

#[derive(Accounts)]
pub struct RecordBatchStage<'info> {
    #[account(mut)]
    pub recorder: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Station role PDA for the recorder. Optional: the config authority is
    /// always allowed (mirrors the EVM `onlyStation` modifier).
    #[account(
        seeds = [STATION_SEED, recorder.key().as_ref()],
        bump = role.bump
    )]
    pub role: Option<Account<'info, Role>>,

    #[account(
        mut,
        seeds = [BATCH_SEED, batch.batch_id.as_ref()],
        bump = batch.bump
    )]
    pub batch: Account<'info, Batch>,
}

fn record(
    ctx: Context<RecordBatchStage>,
    from_stage: u8,
    to_stage: u8,
    data: Vec<u8>,
) -> Result<()> {
    require!(
        ctx.accounts.recorder.key() == ctx.accounts.config.authority
            || ctx.accounts.role.is_some(),
        ToroError::Unauthorized
    );

    let clock = Clock::get()?;
    let recorder = ctx.accounts.recorder.key();

    let batch = &mut ctx.accounts.batch;
    require!(batch.stage == from_stage, ToroError::InvalidStage);
    batch.stage = to_stage;
    batch.updated_at = clock.unix_timestamp;

    emit!(TraceRecorded {
        id: batch.batch_id,
        stage: to_stage,
        data,
        timestamp: clock.unix_timestamp,
        recorder,
    });

    Ok(())
}

pub fn inventory_handler(ctx: Context<RecordBatchStage>, data: Vec<u8>) -> Result<()> {
    record(ctx, STAGE_SOURCE, STAGE_INVENTORY, data)
}

pub fn manufacturing_handler(ctx: Context<RecordBatchStage>, data: Vec<u8>) -> Result<()> {
    record(ctx, STAGE_INVENTORY, STAGE_MANUFACTURING, data)
}
