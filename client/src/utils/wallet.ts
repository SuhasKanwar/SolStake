import type { WalletContextState } from "@solana/wallet-adapter-react";
import { Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";

export async function getBalance(connection: Connection, wallet: WalletContextState): Promise<number | undefined> {
    if(wallet.publicKey) {
        const balance = await connection.getBalance(wallet.publicKey);
        return balance / LAMPORTS_PER_SOL;
    }
}

export async function sendTokens(toPubKey: PublicKey, amount: number, connection: Connection, wallet: WalletContextState): Promise<string> {
    if(!wallet.publicKey) {
        throw new Error("Wallet not connected");
    }

    const transaction = new Transaction();
    transaction.add(SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: toPubKey,
        lamports: amount * LAMPORTS_PER_SOL,
    }));

    const signature = await wallet.sendTransaction(transaction, connection);
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    
    if(confirmation.value.err) {
        throw new Error("Transaction failed: " + confirmation.value.err);
    }
    return signature;
}