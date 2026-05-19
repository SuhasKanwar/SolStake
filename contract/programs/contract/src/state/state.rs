use anchor_lang::prelude::*;

#[account]
pub struct State {
    pub authority: Pubkey,
    pub treasury_bump: u8,
    pub paused: bool,
    pub game_counter: u64,
    pub locked_liquidity: u64,
}

impl State {
    pub const LEN: usize =
        8 +
        32 +
        1 +
        1 +
        8 +
        8;
}