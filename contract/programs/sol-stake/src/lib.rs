use anchor_lang::prelude::*;

declare_id!("DiSkdsHWGxLR6strWwvhvVycGXNRV4nymGX6hKn1E96q");

#[program]
pub mod sol_stake {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
