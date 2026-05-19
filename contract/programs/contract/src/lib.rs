use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod events;
pub mod instructions;
pub mod security;
pub mod state;
pub mod utils;

use instructions::*;

declare_id!("33vQPdG6AQCQ5QGHQjqJra49n4a64PjZLEYgEXdX6T39");

#[program]
pub mod contract {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        instructions::initialize::handler(ctx)
    }

    pub fn deposit_treasury(ctx: Context<DepositTreasury>, amount: u64) -> Result<()> {
        instructions::deposit_treasury::handler(ctx, amount)
    }

    pub fn start_game(ctx: Context<StartGame>, amount: u64, choice: bool, mode: u8) -> Result<()> {
        instructions::start_game::handler(ctx, amount, choice, mode)
    }

    pub fn settle_game(ctx: Context<SettleGame>) -> Result<()> {
        instructions::settle_game::handler(ctx)
    }

    pub fn withdraw_profit(ctx: Context<WithdrawProfit>, amount: u64) -> Result<()> {
        instructions::withdraw_profit::handler(ctx, amount)
    }
}
