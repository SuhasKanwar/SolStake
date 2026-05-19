use anchor_lang::prelude::*;
use anchor_lang::solana_program::{program::invoke_signed, system_instruction};

pub fn transfer_from_pda<'info>(
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    system_program: AccountInfo<'info>,
    amount: u64,
    signer_seeds: &[&[&[u8]]],
) -> Result<()> {
    invoke_signed(
        &system_instruction::transfer(from.key, to.key, amount),
        &[from, to, system_program],
        signer_seeds,
    )?;
    Ok(())
}