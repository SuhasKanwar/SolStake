use anchor_lang::prelude::*;

#[event]
pub struct GameStarted {
    pub game: Pubkey,
    pub player: Pubkey,
    pub amount: u64,
    pub choice: bool,
    pub mode: u8,
    pub randomness_request: Pubkey,
}

#[event]
pub struct GameSettled {
    pub game: Pubkey,
    pub player: Pubkey,
    pub won: bool,
    pub payout: u64,
    pub randomness: [u8; 32],
}

#[event]
pub struct TreasuryDeposited {
    pub authority: Pubkey,
    pub amount: u64,
}

#[event]
pub struct ProfitWithdrawn {
    pub authority: Pubkey,
    pub amount: u64,
}