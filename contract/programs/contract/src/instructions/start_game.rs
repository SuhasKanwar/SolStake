use anchor_lang::prelude::*;
use anchor_lang::system_program;
use orao_solana_vrf::{
    cpi::accounts::RequestV2, program::OraoVrf, state::NetworkState, CONFIG_ACCOUNT_SEED,
};

use crate::{
    constants::{GAME_SEED, STATE_SEED, TREASURY_SEED},
    errors::SolStakeError,
    events::GameStarted,
    security::assert_not_paused,
    state::{Game, State},
    utils::{randomness::randomness_seed, validation::validate_bet},
};

pub fn handler(ctx: Context<StartGame>, amount: u64, choice: bool, mode: u8) -> Result<()> {
    assert_not_paused(&ctx.accounts.state)?;
    let max_payout = validate_bet(amount, mode)?;
    let available_after_bet = ctx
        .accounts
        .treasury
        .to_account_info()
        .lamports()
        .checked_add(amount)
        .and_then(|balance| balance.checked_sub(ctx.accounts.state.locked_liquidity))
        .ok_or(SolStakeError::MathOverflow)?;
    require!(
        available_after_bet >= max_payout,
        SolStakeError::InsufficientTreasury
    );

    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.player.to_account_info(),
                to: ctx.accounts.treasury.to_account_info(),
            },
        ),
        amount,
    )?;

    let game_key = ctx.accounts.game.key();
    let seed = randomness_seed(&game_key);
    let expected_request = orao_solana_vrf::randomness_account_address(&orao_solana_vrf::ID, &seed);
    require_keys_eq!(
        expected_request,
        ctx.accounts.vrf_request.key(),
        SolStakeError::InvalidRandomnessAccount
    );

    orao_solana_vrf::cpi::request_v2(
        CpiContext::new(
            ctx.accounts.vrf.to_account_info(),
            RequestV2 {
                payer: ctx.accounts.player.to_account_info(),
                network_state: ctx.accounts.vrf_network_state.to_account_info(),
                treasury: ctx.accounts.vrf_treasury.to_account_info(),
                request: ctx.accounts.vrf_request.to_account_info(),
                system_program: ctx.accounts.system_program.to_account_info(),
            },
        ),
        seed,
    )?;

    let state = &mut ctx.accounts.state;
    let game = &mut ctx.accounts.game;
    game.player = ctx.accounts.player.key();
    game.amount = amount;
    game.choice = choice;
    game.mode = mode;
    game.won = false;
    game.settled = false;
    game.randomness = [0; 32];
    game.created_at = Clock::get()?.unix_timestamp;
    game.max_payout = max_payout;

    state.game_counter = state
        .game_counter
        .checked_add(1)
        .ok_or(SolStakeError::MathOverflow)?;
    state.locked_liquidity = state
        .locked_liquidity
        .checked_add(max_payout)
        .ok_or(SolStakeError::MathOverflow)?;

    emit!(GameStarted {
        game: game_key,
        player: game.player,
        amount,
        choice,
        mode,
        randomness_request: ctx.accounts.vrf_request.key(),
    });

    Ok(())
}

#[derive(Accounts)]
pub struct StartGame<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(mut, seeds = [STATE_SEED], bump)]
    pub state: Account<'info, State>,

    #[account(
        init,
        payer = player,
        space = Game::LEN,
        seeds = [GAME_SEED, player.key().as_ref(), &state.game_counter.to_le_bytes()],
        bump
    )]
    pub game: Account<'info, Game>,

    #[account(mut, seeds = [TREASURY_SEED], bump = state.treasury_bump)]
    pub treasury: SystemAccount<'info>,

    pub vrf: Program<'info, OraoVrf>,

    #[account(
        mut,
        seeds = [CONFIG_ACCOUNT_SEED],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub vrf_network_state: Account<'info, NetworkState>,

    /// CHECK: ORAO validates this treasury against its network configuration.
    #[account(mut)]
    pub vrf_treasury: AccountInfo<'info>,

    /// CHECK: Created and owned by ORAO VRF during the CPI request.
    #[account(mut)]
    pub vrf_request: AccountInfo<'info>,

    pub system_program: Program<'info, System>,
}