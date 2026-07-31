use anchor_lang::prelude::*;

use crate::constants::CONFIG_SEED;
use crate::state::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        space = Config::LEN,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    config.authority = ctx.accounts.payer.key();
    config.batch_count = 0;
    config.lot_count = 0;
    config.bump = ctx.bumps.config;

    msg!("TORO: initialized. Authority: {}", config.authority);
    Ok(())
}
