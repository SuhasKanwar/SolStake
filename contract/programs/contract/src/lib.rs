use anchor_lang::prelude::*;

declare_id!("33vQPdG6AQCQ5QGHQjqJra49n4a64PjZLEYgEXdX6T39");

#[program]
pub mod contract {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
