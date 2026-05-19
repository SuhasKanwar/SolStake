use anchor_lang::prelude::*;

use crate::{
    constants::{DOUBLE_MODE, DOUBLE_MODE_WIN_MODULO, NORMAL_MODE, NORMAL_MODE_WIN_MODULO},
    errors::SolStakeError,
};

pub fn randomness_seed(game: &Pubkey) -> [u8; 32] {
    game.to_bytes()
}

pub fn randomness_to_u64(randomness: &[u8; 64]) -> u64 {
    u64::from_le_bytes(randomness[0..8].try_into().expect("slice length is fixed"))
}

pub fn first_32(randomness: &[u8; 64]) -> [u8; 32] {
    randomness[0..32].try_into().expect("slice length is fixed")
}

pub fn did_win(choice: bool, mode: u8, randomness: &[u8; 64]) -> Result<bool> {
    let value = randomness_to_u64(randomness);
    match mode {
        NORMAL_MODE => Ok((value % NORMAL_MODE_WIN_MODULO == 0) == choice),
        DOUBLE_MODE => {
            let winning_bucket = if choice { 0 } else { 1 };
            Ok(value % DOUBLE_MODE_WIN_MODULO == winning_bucket)
        }
        _ => err!(SolStakeError::InvalidGameMode),
    }
}