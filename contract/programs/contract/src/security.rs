use anchor_lang::prelude::*;

use crate::{errors::SolStakeError, state::State};

pub fn assert_authority(state: &State, authority: &Pubkey) -> Result<()> {
    require_keys_eq!(state.authority, *authority, SolStakeError::Unauthorized);
    Ok(())
}

pub fn assert_not_paused(state: &State) -> Result<()> {
    require!(!state.paused, SolStakeError::ProgramPaused);
    Ok(())
}