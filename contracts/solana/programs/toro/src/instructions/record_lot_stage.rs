use anchor_lang::prelude::*;

use crate::constants::{
    CONFIG_SEED, LOT_SEED, STAGE_DISTRIBUTION, STAGE_MANUFACTURING, STAGE_WAREHOUSE, STATION_SEED,
};
use crate::error::ToroError;
use crate::events::TraceRecorded;
use crate::state::*;

#[derive(Accounts)]
pub struct RecordLotStage<'info> {
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
        seeds = [LOT_SEED, lot.lot_code.as_ref()],
        bump = lot.bump
    )]
    pub lot: Account<'info, Lot>,
}

fn record(
    ctx: Context<RecordLotStage>,
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

    let lot = &mut ctx.accounts.lot;
    require!(lot.stage == from_stage, ToroError::InvalidStage);
    lot.stage = to_stage;
    lot.updated_at = clock.unix_timestamp;

    emit!(TraceRecorded {
        id: lot.lot_code,
        stage: to_stage,
        data,
        timestamp: clock.unix_timestamp,
        recorder,
    });

    Ok(())
}

pub fn warehouse_handler(ctx: Context<RecordLotStage>, data: Vec<u8>) -> Result<()> {
    record(ctx, STAGE_MANUFACTURING, STAGE_WAREHOUSE, data)
}

pub fn distribution_handler(ctx: Context<RecordLotStage>, data: Vec<u8>) -> Result<()> {
    record(ctx, STAGE_WAREHOUSE, STAGE_DISTRIBUTION, data)
}
