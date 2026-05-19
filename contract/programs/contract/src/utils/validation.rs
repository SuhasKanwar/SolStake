use anchor_lang::prelude::*;

use crate::{
    constants::{
        DOUBLE_MODE, DOUBLE_MODE_MAX_BET, DOUBLE_MODE_MIN_BET, DOUBLE_MODE_MULTIPLIER,
        NORMAL_MODE, NORMAL_MODE_MAX_BET, NORMAL_MODE_MIN_BET, NORMAL_MODE_MULTIPLIER,
    },
    errors::SolStakeError,
};

pub fn validate_bet(amount: u64, mode: u8) -> Result<u64> {
    let multiplier = match mode {
        NORMAL_MODE => {
            require!(amount >= NORMAL_MODE_MIN_BET, SolStakeError::BetTooLow);
            require!(amount <= NORMAL_MODE_MAX_BET, SolStakeError::BetTooHigh);
            NORMAL_MODE_MULTIPLIER
        }
        DOUBLE_MODE => {
            require!(amount >= DOUBLE_MODE_MIN_BET, SolStakeError::BetTooLow);
            require!(amount <= DOUBLE_MODE_MAX_BET, SolStakeError::BetTooHigh);
            DOUBLE_MODE_MULTIPLIER
        }
        _ => return err!(SolStakeError::InvalidGameMode),
    };

    amount
        .checked_mul(multiplier)
        .ok_or_else(|| SolStakeError::MathOverflow.into())
}