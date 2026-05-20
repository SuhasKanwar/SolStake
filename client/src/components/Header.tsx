import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function Header() {
    const { connection } = useConnection();
    const { publicKey, connected } = useWallet();
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        const updateBalance = async () => {
            try {
                if (publicKey) {
                    const bal = await connection.getBalance(publicKey, "confirmed");
                    setBalance(bal / LAMPORTS_PER_SOL);
                } else {
                    setBalance(null);
                }
            } catch (e) {
                console.error(e);
            }
        };

        updateBalance();

        const intervalId = setInterval(updateBalance, 4000);
        return () => clearInterval(intervalId);
    }, [connection, publicKey, connected]);

    return (
        <>
            <div className="fixed top-4 right-4 z-50 flex flex-col items-end gap-1.5">
                <WalletMultiButton className="!rounded-xl !bg-[#f3c815] !font-bold !text-[#814c0f]" />
                {connected && balance !== null && (
                    <div className="rounded-xl border border-white/10 bg-black/50 px-3.5 py-1 text-sm font-bold text-white shadow-lg backdrop-blur-md transition-all animate-fade-in">
                        {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} SOL
                    </div>
                )}
            </div>

            <header className="w-full max-w-2xl flex flex-col items-center justify-center">
                <img
                    src="/cat.gif"
                    alt="Cat mascot"
                    className="h-40 w-40 select-none"
                    draggable={false}
                />
                <div className="w-full rounded-3xl bg-(--primary-button-color) p-3 shadow-[0_28px_70px_-30px_var(--card-shadow)]">
                    <div className="w-full rounded-2xl bg-linear-to-b from-(--card-surface) to-(--card-surface-2) px-6 py-10 text-center">
                        <h1
                            className="leading-none tracking-wide text-6xl sm:text-7xl md:text-8xl"
                            style={{ fontFamily: "var(--font-display)" }}
                        >
                            <span className="text-(--darker-primary-button-color)">SOL</span>
                            <span className="text-white">STAKE</span>
                        </h1>
                        <p className="text-lg sm:text-xl font-bold text-(--text-muted)">
                            Flip Tokens for Double or Nothing!
                        </p>
                    </div>
                </div>
            </header>
        </>
    );
}
