use anchor_lang::prelude::*;

#[constant]
pub const TREASURY_SEED: &[u8] = b"treasury";
#[constant]
pub const STATE_SEED: &[u8] = b"state";
#[constant]
pub const GAME_SEED: &[u8] = b"game";

#[constant]
pub const NORMAL_MODE_MIN_BET: u64 = 10_000_000u64;
#[constant]
pub const NORMAL_MODE_MAX_BET: u64 = 5_000_000_000u64;
#[constant]
pub const DOUBLE_MODE_MIN_BET: u64 = 20_000_000u64;
#[constant]
pub const DOUBLE_MODE_MAX_BET: u64 = 10_000_000_000u64;

#[constant]
pub const NORMAL_MODE: u8 = 1;
#[constant]
pub const DOUBLE_MODE: u8 = 2;

#[constant]
pub const NORMAL_MODE_MULTIPLIER: u64 = 2u64;
#[constant]
pub const DOUBLE_MODE_MULTIPLIER: u64 = 4u64;