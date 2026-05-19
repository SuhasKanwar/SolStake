use anchor_lang::prelude::*;
use orao_solana_vrf::{state::RandomnessV2, RANDOMNESS_ACCOUNT_SEED};

use crate::{
    constants::{STATE_SEED, TREASURY_SEED},
    errors::SolStakeError,
    events::GameSettled,
    state::{Game, State},
    utils::{
        randomness::{did_win, first_32, randomness_seed},
        transfer::transfer_from_pda,
    },
};

pub fn handler(ctx: Context<SettleGame>) -> Result<()> {
    require!(!ctx.accounts.game.settled, SolStakeError::AlreadySettled);

    let seed = randomness_seed(&ctx.accounts.game.key());
    require!(
        ctx.accounts.vrf_request.seed() == &seed,
        SolStakeError::InvalidRandomnessAccount
    );
    let fulfilled = ctx
        .accounts
        .vrf_request
        .fulfilled()
        .ok_or(SolStakeError::RandomnessNotFulfilled)?;

    let randomness = fulfilled.randomness;
    let won = did_win(ctx.accounts.game.choice, ctx.accounts.game.mode, &randomness)?;
    let payout = if won { ctx.accounts.game.max_payout } else { 0 };

    if payout > 0 {
        require!(
            ctx.accounts.treasury.to_account_info().lamports() >= payout,
            SolStakeError::InsufficientTreasury
        );
        let treasury_bump = [ctx.accounts.state.treasury_bump];
        let signer_seeds: &[&[&[u8]]] = &[&[TREASURY_SEED, &treasury_bump]];
        transfer_from_pda(
            ctx.accounts.treasury.to_account_info(),
            ctx.accounts.player.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            payout,
            signer_seeds,
        )?;
    }

    let state = &mut ctx.accounts.state;
    state.locked_liquidity = state
        .locked_liquidity
        .checked_sub(ctx.accounts.game.max_payout)
        .ok_or(SolStakeError::MathOverflow)?;

    let game = &mut ctx.accounts.game;
    game.won = won;
    game.settled = true;
    game.randomness = first_32(&randomness);

    emit!(GameSettled {
        game: game.key(),
        player: game.player,
        won,
        payout,
        randomness: game.randomness,
    });

    Ok(())
}

#[derive(Accounts)]
pub struct SettleGame<'info> {
    #[account(mut, seeds = [STATE_SEED], bump)]
    pub state: Account<'info, State>,

    #[account(mut, has_one = player)]
    pub game: Account<'info, Game>,

    /// CHECK: Receives payout and is constrained by `game.has_one`.
    #[account(mut)]
    pub player: AccountInfo<'info>,

    #[account(mut, seeds = [TREASURY_SEED], bump = state.treasury_bump)]
    pub treasury: SystemAccount<'info>,

    #[account(
        seeds = [RANDOMNESS_ACCOUNT_SEED, &randomness_seed(&game.key())],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub vrf_request: Account<'info, RandomnessV2>,

    pub system_program: Program<'info, System>,
}