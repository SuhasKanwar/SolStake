use anchor_lang::prelude::*;

#[account]
pub struct Game {
    pub player: Pubkey,
    pub amount: u64,
    pub choice: bool,
    pub mode: u8,
    pub won: bool,
    pub settled: bool,
    pub randomness: [u8; 32],
    pub created_at: i64,
}

impl Game {
    pub const LEN: usize =
        8 +
        32 +
        8 +
        1 +
        1 +
        1 +
        1 +
        32 +
        8;
}