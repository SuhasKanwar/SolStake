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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::{
        DOUBLE_MODE_MAX_BET, DOUBLE_MODE_MIN_BET, NORMAL_MODE_MAX_BET, NORMAL_MODE_MIN_BET,
    };

    #[test]
    fn normal_mode_returns_2x_max_payout() {
        assert_eq!(validate_bet(NORMAL_MODE_MIN_BET, NORMAL_MODE).unwrap(), NORMAL_MODE_MIN_BET * 2);
    }

    #[test]
    fn double_mode_returns_4x_max_payout() {
        assert_eq!(validate_bet(DOUBLE_MODE_MIN_BET, DOUBLE_MODE).unwrap(), DOUBLE_MODE_MIN_BET * 4);
    }

    #[test]
    fn rejects_out_of_range_bets() {
        assert!(validate_bet(NORMAL_MODE_MIN_BET - 1, NORMAL_MODE).is_err());
        assert!(validate_bet(NORMAL_MODE_MAX_BET + 1, NORMAL_MODE).is_err());
        assert!(validate_bet(DOUBLE_MODE_MIN_BET - 1, DOUBLE_MODE).is_err());
        assert!(validate_bet(DOUBLE_MODE_MAX_BET + 1, DOUBLE_MODE).is_err());
    }

    #[test]
    fn rejects_unknown_mode() {
        assert!(validate_bet(NORMAL_MODE_MIN_BET, 9).is_err());
    }
}
