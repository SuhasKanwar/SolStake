use anchor_lang::prelude::*;

#[event]
pub struct GameStarted {
    pub player: Pubkey,
    pub amount: u64,
    pub mode: u8,
}

#[event]
pub struct GameSettled {
    pub player: Pubkey,
    pub won: bool,
    pub payout: u64,
}