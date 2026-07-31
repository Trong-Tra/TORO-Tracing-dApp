use anchor_lang::prelude::*;

use crate::constants::{BATCH_SEED, CONFIG_SEED, FACTORY_SEED, STAGE_SOURCE};
use crate::error::ToroError;
use crate::events::{BatchMinted, TraceRecorded};
use crate::state::*;

#[derive(Accounts)]
#[instruction(batch_id: [u8; 32])]
pub struct MintBatch<'info> {
    #[account(mut)]
    pub recorder: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump
    )]
    pub config: Account<'info, Config>,

    /// Factory role PDA for the recorder. Optional: the config authority is
    /// always allowed (mirrors the EVM `onlyFactorySigner` modifier).
    #[account(
        seeds = [FACTORY_SEED, recorder.key().as_ref()],
        bump = role.bump
    )]
    pub role: Option<Account<'info, Role>>,

    #[account(
        init,
        payer = recorder,
        space = Batch::LEN,
        seeds = [BATCH_SEED, batch_id.as_ref()],
        bump
    )]
    pub batch: Account<'info, Batch>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<MintBatch>, batch_id: [u8; 32], data: Vec<u8>) -> Result<()> {
    require!(
        ctx.accounts.recorder.key() == ctx.accounts.config.authority
            || ctx.accounts.role.is_some(),
        ToroError::Unauthorized
    );

    let clock = Clock::get()?;
    let recorder = ctx.accounts.recorder.key();

    let batch = &mut ctx.accounts.batch;
    batch.batch_id = batch_id;
    batch.stage = STAGE_SOURCE;
    batch.created_at = clock.unix_timestamp;
    batch.updated_at = clock.unix_timestamp;
    batch.bump = ctx.bumps.batch;

    ctx.accounts.config.batch_count += 1;

    emit!(BatchMinted {
        batch_id,
        data: data.clone(),
        timestamp: clock.unix_timestamp,
        recorder,
    });
    emit!(TraceRecorded {
        id: batch_id,
        stage: STAGE_SOURCE,
        data,
        timestamp: clock.unix_timestamp,
        recorder,
    });

    Ok(())
}
