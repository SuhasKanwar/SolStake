import { useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import Header from "../components/Header";
import { STAKES } from "../lib/config";
import { Button } from "../components/Button";
import {
    type CoinChoice,
    depositTreasury,
    fetchGame,
    fetchState,
    initializeTreasury,
    settleGame,
    startGame,
} from "../lib/anchor";

export default function HomePage() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [mode, setMode] = useState<"NORMAL" | "2X">("NORMAL");
    const [selectedStake, setSelectedStake] = useState<number>(STAKES[mode][0]);
    const [lastGame, setLastGame] = useState<PublicKey | null>(null);
    const [status, setStatus] = useState<string>("Connect Phantom to play.");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const is2x = mode === "2X";
    const stakeOptions = STAKES[mode];

    function switchMode() {
        const nextMode: typeof mode = is2x ? "NORMAL" : "2X";
        setMode(nextMode);
        setSelectedStake(STAKES[nextMode][0]);
    }

    function formatStake(value: number) {
        return value % 1 === 0 ? String(value) : String(value);
    }

    async function runTransaction(action: () => Promise<void>) {
        if (!wallet) {
            setError("Connect Phantom first.");
            return;
        }

        setLoading(true);
        setError("");
        try {
            await action();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Transaction failed";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    function handleOnChainFlip(choice: CoinChoice) {
        runTransaction(async () => {
            setStatus("Requesting ORAO randomness...");
            const result = await startGame(
                connection,
                wallet!,
                selectedStake,
                choice,
                is2x ? "DOUBLE" : "NORMAL",
            );
            setLastGame(result.game);
            setStatus(`Game started: ${result.game.toBase58()}`);
        });
    }

    function handleSettleLastGame() {
        runTransaction(async () => {
            if (!lastGame) {
                throw new Error("Start a game first.");
            }
            setStatus("Settling fulfilled randomness...");
            await settleGame(connection, wallet!, lastGame);
            const game = await fetchGame(connection, wallet!, lastGame);
            setStatus(game.settled ? (game.won ? "Settled: you won." : "Settled: you lost.") : "Not settled yet.");
        });
    }

    function handleInitialize() {
        runTransaction(async () => {
            const state = await fetchState(connection, wallet!);
            if (state) {
                setStatus("Treasury already initialized.");
                return;
            }
            await initializeTreasury(connection, wallet!);
            setStatus("Treasury initialized.");
        });
    }

    function handleDeposit() {
        runTransaction(async () => {
            await depositTreasury(connection, wallet!, selectedStake);
            setStatus(`Deposited ${selectedStake} SOL to treasury.`);
        });
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-(--bg-gradient-from) to-(--bg-gradient-to) px-4 py-10">
            <Header />
            <div className="mt-8 w-full max-w-2xl">
                <Button
                    variant={is2x ? "primary" : "secondary"}
                    className="w-full py-5 text-xl sm:text-2xl rounded-4xl"
                    action={switchMode}
                    disabled={loading}
                >
                    {is2x ? "SWITCH TO NORMAL MODE" : "SWITCH TO 2X MODE"}
                </Button>
            </div>

            <section className="mt-7 w-full max-w-2xl">
                <div className="grid grid-cols-4 gap-4">
                    {stakeOptions.map((stake) => {
                        const isSelected = selectedStake === stake;
                        const stakeVariant = is2x ? "secondary" : "primary";

                        return (
                            <Button
                                key={stake}
                                variant={stakeVariant}
                                className={
                                    "h-16 py-4 text-xl sm:text-2xl rounded-2xl " +
                                    (isSelected
                                        ? "text-white ring-4 ring-white/90"
                                        : "")
                                }
                                action={() => setSelectedStake(stake)}
                                disabled={loading}
                            >
                                {formatStake(stake)}
                            </Button>
                        );
                    })}
                </div>
            </section>

            <section className="mt-8 w-full max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Button
                        variant="primary"
                        className="w-full py-6 rounded-3xl text-2xl sm:text-3xl"
                        action={() => handleOnChainFlip("HEADS")}
                        disabled={loading || !wallet}
                    >
                        <span className="flex items-center justify-center gap-4">
                            <span>FLIP HEADS</span>
                        </span>
                    </Button>

                    <Button
                        variant="primary"
                        className="w-full py-6 rounded-3xl text-2xl sm:text-3xl"
                        action={() => handleOnChainFlip("TAILS")}
                        disabled={loading || !wallet}
                    >
                        <span className="flex items-center justify-center gap-4">
                            <span>FLIP TAILS</span>
                        </span>
                    </Button>
                </div>
            </section>

            <section className="mt-7 w-full max-w-2xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Button
                        variant="secondary"
                        className="min-h-14 rounded-2xl text-base sm:text-lg"
                        action={handleInitialize}
                        disabled={loading || !wallet}
                    >
                        INIT
                    </Button>
                    <Button
                        variant="secondary"
                        className="min-h-14 rounded-2xl text-base sm:text-lg"
                        action={handleDeposit}
                        disabled={loading || !wallet}
                    >
                        DEPOSIT
                    </Button>
                    <Button
                        variant="secondary"
                        className="min-h-14 rounded-2xl text-base sm:text-lg"
                        action={handleSettleLastGame}
                        disabled={loading || !wallet || !lastGame}
                    >
                        SETTLE
                    </Button>
                </div>
            </section>

            <section className="mt-6 w-full max-w-2xl rounded-2xl bg-black/25 px-5 py-4 text-center text-white">
                <p className="wrap-break-word text-base font-bold sm:text-lg">
                    {loading ? "Transaction pending..." : status}
                </p>
                {lastGame && (
                    <p className="mt-2 wrap-break-word text-sm text-white/75">
                        Last game: {lastGame.toBase58()}
                    </p>
                )}
                {error && <p className="mt-2 wrap-break-word text-sm font-bold text-red-200">{error}</p>}
            </section>
        </main>
    );
}
