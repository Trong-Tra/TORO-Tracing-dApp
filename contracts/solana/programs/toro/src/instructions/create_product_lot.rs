use anchor_lang::prelude::*;

use crate::constants::{
    BATCH_SEED, CONFIG_SEED, FACTORY_SEED, LOT_SEED, MAX_LOT_INPUTS, STAGE_MANUFACTURING,
};
use crate::error::ToroError;
use crate::events::{LotCreated, TraceRecorded};
use crate::state::*;

#[derive(Accounts)]
#[instruction(lot_code: [u8; 32])]
pub struct CreateProductLot<'info> {
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
        space = Lot::LEN,
        seeds = [LOT_SEED, lot_code.as_ref()],
        bump
    )]
    pub lot: Account<'info, Lot>,

    pub system_program: Program<'info, System>,
    // remaining_accounts: the input batch PDAs (1..=MAX_LOT_INPUTS), all must
    // be at the manufacturing stage.
}

pub fn handler<'info>(
    ctx: Context<'info, CreateProductLot<'info>>,
    lot_code: [u8; 32],
    total_cans: u64,
    data: Vec<u8>,
) -> Result<()> {
    require!(
        ctx.accounts.recorder.key() == ctx.accounts.config.authority
            || ctx.accounts.role.is_some(),
        ToroError::Unauthorized
    );

    let inputs = ctx.remaining_accounts;
    require!(!inputs.is_empty(), ToroError::NoInputs);
    require!(inputs.len() <= MAX_LOT_INPUTS, ToroError::TooManyInputs);

    let clock = Clock::get()?;
    let recorder = ctx.accounts.recorder.key();

    let mut input_pubkeys = [Pubkey::default(); MAX_LOT_INPUTS];
    let mut input_ids: Vec<[u8; 32]> = Vec::with_capacity(inputs.len());

    for (i, account_info) in inputs.iter().enumerate() {
        require!(account_info.owner == &crate::ID, ToroError::InvalidBatchAccount);
        let account_data = account_info.try_borrow_data()?;
        let batch = Batch::try_deserialize(&mut &account_data[..])
            .map_err(|_| ToroError::InvalidBatchAccount)?;
        require!(batch.stage == STAGE_MANUFACTURING, ToroError::BatchNotAtManufacturing);

        let (expected_pda, _) =
            Pubkey::find_program_address(&[BATCH_SEED, batch.batch_id.as_ref()], &crate::ID);
        require!(account_info.key() == expected_pda, ToroError::InvalidBatchAccount);

        input_pubkeys[i] = account_info.key();
        input_ids.push(batch.batch_id);
    }

    let lot = &mut ctx.accounts.lot;
    lot.lot_code = lot_code;
    lot.stage = STAGE_MANUFACTURING;
    lot.total_cans = total_cans;
    lot.input_batches = input_pubkeys;
    lot.input_count = inputs.len() as u8;
    lot.created_at = clock.unix_timestamp;
    lot.updated_at = clock.unix_timestamp;
    lot.bump = ctx.bumps.lot;

    ctx.accounts.config.lot_count += 1;

    emit!(LotCreated {
        lot_code,
        input_batch_ids: input_ids,
        total_cans,
        data: data.clone(),
        timestamp: clock.unix_timestamp,
        recorder,
    });
    emit!(TraceRecorded {
        id: lot_code,
        stage: STAGE_MANUFACTURING,
        data,
        timestamp: clock.unix_timestamp,
        recorder,
    });

    Ok(())
}
