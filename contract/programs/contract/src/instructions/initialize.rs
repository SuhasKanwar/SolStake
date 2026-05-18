use anchor_lang::prelude::*;

use crate::{constants::{STATE_SEED, TREASURY_SEED}, state::State};

pub fn handler(ctx: Context<Initialize>) -> Result<()> {
    let state = &mut ctx.accounts.state;
    state.authority = ctx.accounts.authority.key();
    state.treasury_bump = ctx.bumps.treasury;
    state.paused = false;
    state.game_counter = 0;
    Ok(())
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = State::LEN,
        seeds = [STATE_SEED],
        bump
    )]
    pub state: Account<'info, State>,

    #[account(
        seeds = [TREASURY_SEED],
        bump
    )]
    pub treasury: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}