use anchor_lang::prelude::*;

#[error_code]
pub enum SolStakeError {
    #[msg("Bet amount too low")]
    BetTooLow,

    #[msg("Bet amount too high")]
    BetTooHigh,

    #[msg("Game already settled")]
    AlreadySettled,

    #[msg("Treasury insufficient")]
    InsufficientTreasury,

    #[msg("Unauthorized")]
    Unauthorized,

    #[msg("Invalid game mode")]
    InvalidGameMode,

    #[msg("Program paused")]
    ProgramPaused,

    #[msg("Invalid bet choice")]
    InvalidChoice,

    #[msg("Arithmetic overflow")]
    MathOverflow,

    #[msg("Randomness has not been fulfilled yet")]
    RandomnessNotFulfilled,

    #[msg("Invalid randomness account")]
    InvalidRandomnessAccount,

    #[msg("Invalid treasury account")]
    InvalidTreasury,

    #[msg("No withdrawable profit")]
    NoProfit,
}