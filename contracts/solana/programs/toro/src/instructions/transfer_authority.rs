use anchor_lang::prelude::*;

use crate::constants::CONFIG_SEED;
use crate::error::ToroError;
use crate::state::*;

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ ToroError::Unauthorized
    )]
    pub config: Account<'info, Config>,
}

pub fn handler(ctx: Context<TransferAuthority>, new_authority: Pubkey) -> Result<()> {
    ctx.accounts.config.authority = new_authority;
    msg!("TORO: authority transferred to {}", new_authority);
    Ok(())
}
