import { useState, useCallback, useRef, useEffect } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { Gem, Target, Loader2, Trophy, Frown, Timer, TriangleAlert } from "lucide-react";
import { EventParser } from "@coral-xyz/anchor";
import Header from "../components/Header";
import { STAKES } from "../lib/config";
import { Button } from "../components/Button";
import ConfirmModal from "../components/ConfirmModal";
import {
    type CoinChoice,
    fetchGame,
    settleGame,
    startGame,
    getProgram,
} from "../lib/anchor";

const SETTLE_POLL_INTERVAL = 2500;
const SETTLE_MAX_RETRIES = 40;

interface EventLog {
    id: string;
    name: string;
    time: string;
    details: string;
    type: "info" | "success" | "warning";
}

export default function HomePage() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [mode, setMode] = useState<"NORMAL" | "2X">("NORMAL");
    const [selectedStake, setSelectedStake] = useState<number>(STAKES[mode][0]);
    const [status, setStatus] = useState<string>("Connect Phantom to play.");
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [pendingChoice, setPendingChoice] = useState<CoinChoice | null>(null);
    const [events, setEvents] = useState<EventLog[]>([]);
    const flipLockRef = useRef(false);

    const is2x = mode === "2X";
    const stakeOptions = STAKES[mode];

    useEffect(() => {
        if (!wallet) {
            setEvents([]);
            return;
        }

        const program = getProgram(connection, wallet);
        const parsedSignatures = new Set<string>();

        const addEventLog = (id: string, name: string, time: string, details: string, type: "info" | "success" | "warning") => {
            setEvents((prev) => {
                if (prev.some((e) => e.id === id)) return prev;
                return [{ id, name, time, details, type }, ...prev].slice(0, 10);
            });
        };

        const pollEvents = async () => {
            try {
                const sigs = await connection.getSignaturesForAddress(program.programId, { limit: 6 }, "confirmed");
                const newSigs = sigs.filter(s => !parsedSignatures.has(s.signature));
                if (newSigs.length === 0) return;

                const eventParser = new EventParser(program.programId, program.coder);

                for (const sigInfo of newSigs) {
                    parsedSignatures.add(sigInfo.signature);

                    try {
                        const tx = await connection.getParsedTransaction(sigInfo.signature, {
                            commitment: "confirmed",
                            maxSupportedTransactionVersion: 0,
                        });

                        if (!tx || !tx.meta || !tx.meta.logMessages) continue;

                        const parsedEvents = eventParser.parseLogs(tx.meta.logMessages);
                        let index = 0;
                        for (const parsedEvent of parsedEvents) {
                            const eventName = parsedEvent.name;
                            const eventData = parsedEvent.data as any;
                            const eventId = `${sigInfo.signature}-${index++}`;

                            const time = sigInfo.blockTime
                                ? new Date(sigInfo.blockTime * 1000).toLocaleTimeString()
                                : new Date().toLocaleTimeString();

                            if (eventName === "GameStarted") {
                                addEventLog(
                                    eventId,
                                    "GameStarted",
                                    time,
                                    `Player ${eventData.player.toString().slice(0, 4)}... bet ${eventData.amount.toNumber() / 1e9} SOL on ${eventData.choice ? "HEADS" : "TAILS"}`,
                                    "info"
                                );
                            } else if (eventName === "GameSettled") {
                                const payoutSOL = eventData.payout.toNumber() / 1e9;
                                addEventLog(
                                    eventId,
                                    "GameSettled",
                                    time,
                                    `Player ${eventData.player.toString().slice(0, 4)}... ${eventData.won ? `WON ${payoutSOL} SOL! 🏆` : "LOST bet 😢"}`,
                                    eventData.won ? "success" : "warning"
                                );
                            }
                        }
                    } catch (txErr) {
                        console.warn(`Error parsing transaction ${sigInfo.signature}:`, txErr);
                        parsedSignatures.delete(sigInfo.signature);
                    }
                }
            } catch (e) {
                console.warn("Error polling events:", e);
            }
        };

        pollEvents();
        const intervalId = setInterval(pollEvents, 7000);

        return () => {
            clearInterval(intervalId);
        };
    }, [connection, wallet]);

    function switchMode() {
        const nextMode: typeof mode = is2x ? "NORMAL" : "2X";
        setMode(nextMode);
        setSelectedStake(STAKES[nextMode][0]);
    }

    function formatStake(value: number) {
        return String(value);
    }

    function requestFlip(choice: CoinChoice) {
        if (!wallet) {
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
        if (!wallet || !pendingChoice || flipLockRef.current) return;
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

            <section className="mt-6 w-full max-w-2xl rounded-2xl bg-black/25 px-5 py-4 text-center text-white border border-white/[0.05]">
                <p className="flex items-center justify-center gap-2 wrap-break-word text-base font-bold sm:text-lg">
                    {renderStatusIcon()}
                    {loading ? "Transaction pending..." : status}
                </p>
                {error && <p className="mt-2 wrap-break-word text-sm font-bold text-red-200">{error}</p>}
            </section>

            {/* Live Contract Events Panel */}
            <section className="mt-6 w-full max-w-2xl rounded-2xl bg-black/40 border border-white/[0.06] p-5 text-white shadow-xl backdrop-blur-md">
                <h3 className="text-lg font-bold text-[#f3c815] mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    LIVE CONTRACT EVENTS
                </h3>
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {events.length === 0 ? (
                        <p className="text-sm font-medium text-white/40 italic text-center py-4">
                            Waiting for contract events to emit...
                        </p>
                    ) : (
                        events.map((ev) => {
                            let badgeCls = "bg-blue-500/20 text-blue-300 border-blue-500/30";
                            if (ev.type === "success") badgeCls = "bg-green-500/20 text-green-300 border-green-500/30";
                            if (ev.type === "warning") badgeCls = "bg-red-500/20 text-red-300 border-red-500/30";

                            return (
                                <div key={ev.id} className="flex items-start justify-between gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs font-semibold animate-fade-in transition-all">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-md border text-[10px] uppercase font-bold tracking-wider ${badgeCls}`}>
                                            {ev.name}
                                        </span>
                                        <span className="text-white/80">{ev.details}</span>
                                    </div>
                                    <span className="text-white/40 text-[10px] shrink-0 font-medium">{ev.time}</span>
                                </div>
                            );
                        })
                    )}
                </div>
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
