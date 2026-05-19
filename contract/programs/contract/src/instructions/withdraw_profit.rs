use anchor_lang::prelude::*;

use crate::{
    constants::{STATE_SEED, TREASURY_SEED},
    errors::SolStakeError,
    events::ProfitWithdrawn,
    security::assert_authority,
    state::State,
    utils::transfer::transfer_from_pda,
};

pub fn handler(ctx: Context<WithdrawProfit>, amount: u64) -> Result<()> {
    assert_authority(&ctx.accounts.state, &ctx.accounts.authority.key())?;
    let withdrawable = ctx
        .accounts
        .treasury
        .to_account_info()
        .lamports()
        .checked_sub(ctx.accounts.state.locked_liquidity)
        .ok_or(SolStakeError::MathOverflow)?;
    require!(amount > 0 && amount <= withdrawable, SolStakeError::NoProfit);

    let treasury_bump = [ctx.accounts.state.treasury_bump];
    let signer_seeds: &[&[&[u8]]] = &[&[TREASURY_SEED, &treasury_bump]];
    transfer_from_pda(
        ctx.accounts.treasury.to_account_info(),
        ctx.accounts.authority.to_account_info(),
        ctx.accounts.system_program.to_account_info(),
        amount,
        signer_seeds,
    )?;

    emit!(ProfitWithdrawn {
        authority: ctx.accounts.authority.key(),
        amount,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct WithdrawProfit<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [STATE_SEED], bump)]
    pub state: Account<'info, State>,

    #[account(mut, seeds = [TREASURY_SEED], bump = state.treasury_bump)]
    pub treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}