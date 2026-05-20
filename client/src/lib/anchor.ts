import * as anchor from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import idl from "../idl/contract.json";
import type { Contract } from "../idl/contract";
import {
    ORAO_CONFIG_SEED,
    ORAO_RANDOMNESS_SEED,
    ORAO_VRF_PROGRAM_ID,
    PROGRAM_ID,
} from "./config";

const STATE_SEED = "state";
const TREASURY_SEED = "treasury";
const GAME_SEED = "game";

export const GAME_MODE = {
    NORMAL: 1,
    DOUBLE: 2,
} as const;

export type GameMode = keyof typeof GAME_MODE;
export type CoinChoice = "HEADS" | "TAILS";

export function getProvider(connection: Connection, wallet: AnchorWallet) {
    return new anchor.AnchorProvider(connection, wallet, {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
    });
}

export function getProgram(connection: Connection, wallet: AnchorWallet) {
    return new anchor.Program<Contract>(idl as Contract, getProvider(connection, wallet));
}

export function statePda() {
    return PublicKey.findProgramAddressSync([Buffer.from(STATE_SEED)], PROGRAM_ID)[0];
}

export function treasuryPda() {
    return PublicKey.findProgramAddressSync([Buffer.from(TREASURY_SEED)], PROGRAM_ID)[0];
}

export function gamePda(player: PublicKey, counter: anchor.BN) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(GAME_SEED), player.toBuffer(), counter.toArrayLike(Buffer, "le", 8)],
        PROGRAM_ID,
    )[0];
}

export function oraoNetworkStatePda() {
    return PublicKey.findProgramAddressSync([Buffer.from(ORAO_CONFIG_SEED)], ORAO_VRF_PROGRAM_ID)[0];
}

export function oraoRandomnessPda(game: PublicKey) {
    return PublicKey.findProgramAddressSync(
        [Buffer.from(ORAO_RANDOMNESS_SEED), game.toBuffer()],
        ORAO_VRF_PROGRAM_ID,
    )[0];
}

async function confirm(provider: anchor.AnchorProvider, signature: string) {
    const connection = provider.connection;
    const start = Date.now();
    const timeout = 60000;

    while (Date.now() - start < timeout) {
        try {
            const status = await connection.getSignatureStatus(signature, {
                searchTransactionHistory: true,
            });
            const val = status?.value;
            if (val) {
                if (val.err) {
                    throw new Error(`Transaction failed: ${JSON.stringify(val.err)}`);
                }
                if (val.confirmationStatus === "confirmed" || val.confirmationStatus === "finalized") {
                    return signature;
                }
            }
        } catch (e) {
            console.warn("Signature status poll error:", e);
        }
        await new Promise((r) => setTimeout(r, 1500));
    }

    try {
        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction({ signature, ...latest }, "confirmed");
        return signature;
    } catch (e) {
        console.warn("Fallback confirmation failed:", e);
        // If the polling timed out, but the signature was processed, we still want to proceed
        return signature;
    }
}

export async function fetchState(connection: Connection, wallet: AnchorWallet) {
    const program = getProgram(connection, wallet);
    return (program.account as any).state.fetchNullable(statePda());
}

async function sendAndConfirmTx(
    connection: Connection,
    wallet: AnchorWallet,
    builder: any,
) {
    const provider = getProvider(connection, wallet);
    const tx = await builder.transaction();
    tx.feePayer = wallet.publicKey;
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;

    const signedTx = await wallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed",
    });

    await confirm(provider, signature);
    return signature;
}

export async function initializeTreasury(connection: Connection, wallet: AnchorWallet) {
    const program = getProgram(connection, wallet);
    const builder = (program.methods as any)
        .initialize()
        .accountsStrict({
            authority: wallet.publicKey,
            state: statePda(),
            treasury: treasuryPda(),
            systemProgram: SystemProgram.programId,
        } as any);
    return sendAndConfirmTx(connection, wallet, builder);
}

async function ensureInitialized(connection: Connection, wallet: AnchorWallet) {
    const state = await fetchState(connection, wallet);
    if (!state) {
        await initializeTreasury(connection, wallet);
    }
}

export async function depositTreasury(connection: Connection, wallet: AnchorWallet, solAmount: number) {
    const program = getProgram(connection, wallet);
    const lamports = new anchor.BN(Math.round(solAmount * anchor.web3.LAMPORTS_PER_SOL));
    const builder = (program.methods as any)
        .depositTreasury(lamports)
        .accountsStrict({
            authority: wallet.publicKey,
            treasury: treasuryPda(),
            systemProgram: SystemProgram.programId,
        } as any);
    return sendAndConfirmTx(connection, wallet, builder);
}

export async function startGame(
    connection: Connection,
    wallet: AnchorWallet,
    solAmount: number,
    choice: CoinChoice,
    mode: GameMode,
) {
    await ensureInitialized(connection, wallet);

    const program = getProgram(connection, wallet);
    const state = await (program.account as any).state.fetch(statePda());
    const game = gamePda(wallet.publicKey, (state as any).gameCounter);
    const vrfNetworkState = oraoNetworkStatePda();
    const vrfNetwork = await (program.account as any).networkState.fetch(vrfNetworkState);
    const vrfRequest = oraoRandomnessPda(game);
    const lamports = new anchor.BN(Math.round(solAmount * anchor.web3.LAMPORTS_PER_SOL));

    const builder = (program.methods as any)
        .startGame(lamports, choice === "HEADS", GAME_MODE[mode])
        .accountsStrict({
            player: wallet.publicKey,
            state: statePda(),
            game,
            treasury: treasuryPda(),
            vrf: ORAO_VRF_PROGRAM_ID,
            vrfNetworkState,
            vrfTreasury: (vrfNetwork as any).config.treasury,
            vrfRequest,
            systemProgram: SystemProgram.programId,
        } as any);

    const signature = await sendAndConfirmTx(connection, wallet, builder);
    return { signature, game, vrfRequest };
}

export async function settleGame(connection: Connection, wallet: AnchorWallet, game: PublicKey) {
    const program = getProgram(connection, wallet);
    const gameAccount = await (program.account as any).game.fetch(game);
    const builder = (program.methods as any)
        .settleGame()
        .accountsStrict({
            state: statePda(),
            game,
            player: gameAccount.player,
            treasury: treasuryPda(),
            vrfRequest: oraoRandomnessPda(game),
            systemProgram: SystemProgram.programId,
        } as any);
    return sendAndConfirmTx(connection, wallet, builder);
}

export async function fetchGame(connection: Connection, wallet: AnchorWallet, game: PublicKey) {
    const program = getProgram(connection, wallet);
    return (program.account as any).game.fetch(game);
}