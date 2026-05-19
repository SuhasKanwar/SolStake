use anchor_lang::prelude::*;
use anchor_lang::system_program;
use crate::events::TreasuryDeposited;
use crate::constants::TREASURY_SEED;

pub fn handler(ctx: Context<DepositTreasury>, amount: u64) -> Result<()> {
    let cpi_accounts = system_program::Transfer {
        from: ctx.accounts.authority.to_account_info(),
        to: ctx.accounts.treasury.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.system_program.to_account_info(), cpi_accounts);

    system_program::transfer(cpi_ctx, amount)?;
    emit!(TreasuryDeposited {
        authority: ctx.accounts.authority.key(),
        amount,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct DepositTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}