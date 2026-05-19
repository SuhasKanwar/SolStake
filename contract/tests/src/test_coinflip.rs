use std::{rc::Rc, str::FromStr};

use anchor_client::{
    solana_sdk::{
        commitment_config::CommitmentConfig,
        native_token::LAMPORTS_PER_SOL,
        pubkey::Pubkey,
        signature::{read_keypair_file, Keypair},
    },
    Client, Cluster, Program,
};

fn system_program_id() -> Pubkey {
    Pubkey::from_str("11111111111111111111111111111111").unwrap()
}

fn program_client() -> (Program<Rc<Keypair>>, Pubkey, Pubkey, Pubkey) {
    let wallet = std::env::var("ANCHOR_WALLET").expect("ANCHOR_WALLET is required");
    let payer = Rc::new(read_keypair_file(&wallet).expect("failed to read ANCHOR_WALLET"));
    let rpc_url =
        std::env::var("ANCHOR_TEST_RPC_URL").unwrap_or_else(|_| "http://127.0.0.1:8899".to_string());
    let ws_url =
        std::env::var("ANCHOR_TEST_WS_URL").unwrap_or_else(|_| "ws://127.0.0.1:8900".to_string());
    let client = Client::new_with_options(
        Cluster::Custom(rpc_url, ws_url),
        payer,
        CommitmentConfig::confirmed(),
    );
    let program = client.program(contract::ID).expect("failed to create program client");
    let (state, _) = Pubkey::find_program_address(&[contract::constants::STATE_SEED], &contract::ID);
    let (treasury, _) =
        Pubkey::find_program_address(&[contract::constants::TREASURY_SEED], &contract::ID);
    let authority = program.payer();
    (program, authority, state, treasury)
}

fn ensure_initialized(program: &Program<Rc<Keypair>>, authority: Pubkey, state: Pubkey, treasury: Pubkey) {
    let _ = program
        .request()
        .accounts(contract::accounts::Initialize {
            authority,
            state,
            treasury,
            system_program: system_program_id(),
        })
        .args(contract::instruction::Initialize {})
        .send();
}

#[test]
#[ignore = "run with `anchor test`; requires Anchor local validator"]
fn initialize_creates_state_with_expected_authority() {
    let (program, authority, state, treasury) = program_client();

    ensure_initialized(&program, authority, state, treasury);

    let state_account: contract::state::State =
        program.account(state).expect("state account should exist");

    assert_eq!(state_account.authority, authority);
    assert!(!state_account.paused);
    assert_eq!(state_account.game_counter, 0);
    assert_eq!(state_account.locked_liquidity, 0);
}

#[test]
#[ignore = "run with `anchor test`; requires Anchor local validator"]
fn deposit_treasury_moves_lamports_into_treasury_pda() {
    let (program, authority, state, treasury) = program_client();
    ensure_initialized(&program, authority, state, treasury);

    let before = program
        .rpc()
        .get_account(&treasury)
        .map(|account| account.lamports)
        .unwrap_or(0);
    let amount = LAMPORTS_PER_SOL / 10;

    program
        .request()
        .accounts(contract::accounts::DepositTreasury {
            authority,
            treasury,
            system_program: system_program_id(),
        })
        .args(contract::instruction::DepositTreasury { amount })
        .send()
        .expect("deposit_treasury should succeed");

    let after = program
        .rpc()
        .get_account(&treasury)
        .expect("treasury should exist")
        .lamports;

    assert_eq!(after.saturating_sub(before), amount);
}
