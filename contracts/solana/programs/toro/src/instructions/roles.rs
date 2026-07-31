use anchor_lang::prelude::*;

use crate::constants::{CONFIG_SEED, FACTORY_SEED, STATION_SEED};
use crate::error::ToroError;
use crate::state::*;

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct AddFactorySigner<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ ToroError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        space = Role::LEN,
        seeds = [FACTORY_SEED, wallet.as_ref()],
        bump
    )]
    pub role: Account<'info, Role>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RemoveFactorySigner<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ ToroError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        close = authority,
        seeds = [FACTORY_SEED, role.wallet.as_ref()],
        bump = role.bump
    )]
    pub role: Account<'info, Role>,
}

#[derive(Accounts)]
#[instruction(wallet: Pubkey)]
pub struct AuthorizeStation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ ToroError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = authority,
        space = Role::LEN,
        seeds = [STATION_SEED, wallet.as_ref()],
        bump
    )]
    pub role: Account<'info, Role>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeStation<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
        has_one = authority @ ToroError::Unauthorized
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        close = authority,
        seeds = [STATION_SEED, role.wallet.as_ref()],
        bump = role.bump
    )]
    pub role: Account<'info, Role>,
}

pub fn add_handler(ctx: Context<AddFactorySigner>, wallet: Pubkey) -> Result<()> {
    let role = &mut ctx.accounts.role;
    role.wallet = wallet;
    role.bump = ctx.bumps.role;
    msg!("TORO: factory signer added: {}", wallet);
    Ok(())
}

pub fn remove_handler(ctx: Context<RemoveFactorySigner>) -> Result<()> {
    msg!("TORO: factory signer removed: {}", ctx.accounts.role.wallet);
    Ok(())
}

pub fn authorize_handler(ctx: Context<AuthorizeStation>, wallet: Pubkey) -> Result<()> {
    let role = &mut ctx.accounts.role;
    role.wallet = wallet;
    role.bump = ctx.bumps.role;
    msg!("TORO: station authorized: {}", wallet);
    Ok(())
}

pub fn revoke_handler(ctx: Context<RevokeStation>) -> Result<()> {
    msg!("TORO: station revoked: {}", ctx.accounts.role.wallet);
    Ok(())
}
