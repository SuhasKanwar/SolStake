import { useState, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { Gem, Target, Loader2, Trophy, Frown, Timer, TriangleAlert } from "lucide-react";
import Header from "../components/Header";
import { STAKES } from "../lib/config";
import { Button } from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";
import {
    type CoinChoice,
    fetchGame,
    settleGame,
    startGame
} from "../lib/anchor";

const SETTLE_POLL_INTERVAL = 2500;
const SETTLE_MAX_RETRIES = 40;

export default function HomePage() {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [mode, setMode] = useState<"NORMAL" | "2X">("NORMAL");
    const [selectedStake, setSelectedStake] = useState<number>(STAKES[mode][0]);
    const [status, setStatus] = useState<string>("Connect Phantom to play.");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingChoice, setPendingChoice] = useState<CoinChoice | null>(null);
    const flipLockRef = useRef(false);

    const is2x = mode === "2X";
    const stakeOptions = STAKES[mode];

    function switchMode() {
        const nextMode: typeof mode = is2x ? "NORMAL" : "2X";
        setMode(nextMode);
        setSelectedStake(STAKES[nextMode][0]);
    }

    function formatStake(value: number) {
        return String(value);
    }

    function requestFlip(choice: CoinChoice) {
        if (!wallet || !wallet.publicKey) {
            setError("Connect Phantom first.");
            return;
        }
        setPendingChoice(choice);
        setModalOpen(true);
    }

    function cancelFlip() {
        setModalOpen(false);
        setPendingChoice(null);
    }

    const confirmFlip = useCallback(async () => {
        if (!wallet || !wallet.publicKey || !pendingChoice || flipLockRef.current) return;
        flipLockRef.current = true;
        setModalOpen(false);
        setLoading(true);
        setError("");

        try {
            setStatus("Sending your stake & requesting randomness...");
            const result = await startGame(
                connection,
                wallet,
                selectedStake,
                pendingChoice,
                is2x ? "DOUBLE" : "NORMAL",
            );

            setStatus("Waiting for randomness to be fulfilled...");

            let settled = false;
            for (let attempt = 0; attempt < SETTLE_MAX_RETRIES; attempt++) {
                await new Promise((r) => setTimeout(r, SETTLE_POLL_INTERVAL));

                try {
                    await settleGame(connection, wallet, result.game);
                    settled = true;
                    break;
                } catch (settleErr) {
                    const msg = settleErr instanceof Error ? settleErr.message : "";
                    if (msg.includes("Randomness") || msg.includes("not fulfilled") || msg.includes("0x1772")) {
                        setStatus(`Still waiting for randomness... (${attempt + 1}/${SETTLE_MAX_RETRIES})`);
                        continue;
                    }
                    throw settleErr;
                }
            }

            if (!settled) {
                setStatus("Randomness took too long. Try refreshing later.");
                return;
            }

            const game = await fetchGame(connection, wallet, result.game);
            if (game.won) {
                const potentialWin = is2x ? selectedStake * 4 : selectedStake * 2;
                setStatus(`YOU WON ${potentialWin} SOL!`);
            } else {
                setStatus(`You lost ${selectedStake} SOL. Better luck next time!`);
            }
        } catch (err) {
            console.error("Flip game error caught:", err);
            let message = "Transaction failed";
            if (err instanceof Error) {
                message = err.message;
                if ("logs" in err && Array.isArray((err as any).logs)) {
                    console.error("SendTransactionError logs:", (err as any).logs);
                    message += ` (Logs: ${(err as any).logs.slice(0, 5).join(" | ")})`;
                } else if (typeof (err as any).getLogs === "function") {
                    try {
                        const logs = (err as any).getLogs();
                        console.error("getLogs():", logs);
                        message += ` (Logs: ${logs.slice(0, 5).join(" | ")})`;
                    } catch (e) { }
                }
            } else if (typeof err === "object" && err !== null) {
                message = JSON.stringify(err);
            }
            
            if (
                message.includes("0x1773") || 
                message.includes("6003") || 
                message.toLowerCase().includes("insufficient")
            ) {
                message = "The contract treasury has insufficient liquidity to cover this bet size/mode. Please try a smaller bet, switch to Normal mode, or fund the treasury above!";
            }
            
            setError(message);
            setStatus("Ready to flip again.");
        } finally {
            setLoading(false);
            setPendingChoice(null);
            flipLockRef.current = false;
        }
    }, [wallet, pendingChoice, connection, selectedStake, is2x]);

    function renderStatusIcon() {
        const cls = "shrink-0";
        if (loading) return <Loader2 size={20} className={`${cls} animate-spin`} />;
        if (status.startsWith("YOU WON")) return <Trophy size={20} className={cls} />;
        if (status.startsWith("You lost")) return <Frown size={20} className={cls} />;
        if (status.includes("waiting") || status.includes("Waiting")) return <Timer size={20} className={cls} />;
        if (status.includes("too long")) return <TriangleAlert size={20} className={cls} />;
        return null;
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
                        action={() => requestFlip("HEADS")}
                        disabled={loading || !wallet}
                    >
                        <span className="flex items-center justify-center gap-3">
                            <Gem size={28} className="shrink-0" />
                            <span>FLIP HEADS</span>
                        </span>
                    </Button>

                    <Button
                        variant="primary"
                        className="w-full py-6 rounded-3xl text-2xl sm:text-3xl"
                        action={() => requestFlip("TAILS")}
                        disabled={loading || !wallet}
                    >
                        <span className="flex items-center justify-center gap-3">
                            <Target size={28} className="shrink-0" />
                            <span>FLIP TAILS</span>
                        </span>
                    </Button>
                </div>
            </section>

            <section className="mt-6 w-full max-w-2xl rounded-2xl bg-black/25 px-5 py-4 text-center text-white border border-white/5">
                <p className="flex items-center justify-center gap-2 wrap-break-word text-base font-bold sm:text-lg">
                    {renderStatusIcon()}
                    {loading ? "Transaction pending..." : status}
                </p>
                {error && <p className="mt-2 wrap-break-word text-sm font-bold text-red-200">{error}</p>}
            </section>

            <ConfirmModal
                open={modalOpen}
                choice={pendingChoice}
                stake={selectedStake}
                mode={mode}
                onConfirm={confirmFlip}
                onCancel={cancelFlip}
            />
        </main>
    );
}
