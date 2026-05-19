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

#[cfg(test)]
mod tests {
    use super::*;

    fn randomness_with_value(value: u64) -> [u8; 64] {
        let mut randomness = [0_u8; 64];
        randomness[0..8].copy_from_slice(&value.to_le_bytes());
        randomness
    }

    #[test]
    fn normal_mode_has_two_buckets() {
        assert!(did_win(true, NORMAL_MODE, &randomness_with_value(2)).unwrap());
        assert!(!did_win(true, NORMAL_MODE, &randomness_with_value(3)).unwrap());
        assert!(did_win(false, NORMAL_MODE, &randomness_with_value(3)).unwrap());
    }

    #[test]
    fn double_mode_has_two_winning_buckets_out_of_four() {
        assert!(did_win(true, DOUBLE_MODE, &randomness_with_value(4)).unwrap());
        assert!(did_win(false, DOUBLE_MODE, &randomness_with_value(5)).unwrap());
        assert!(!did_win(true, DOUBLE_MODE, &randomness_with_value(6)).unwrap());
        assert!(!did_win(false, DOUBLE_MODE, &randomness_with_value(7)).unwrap());
    }

    #[test]
    fn rejects_unknown_mode() {
        assert!(did_win(true, 9, &randomness_with_value(0)).is_err());
    }
}
