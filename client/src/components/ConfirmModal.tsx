import { useEffect, useRef } from "react";
import type { CoinChoice } from "../lib/anchor";
import playUiClick from "../utils/sound";
import { Gem, Target, Wallet, Award, Zap, Dice5 } from "lucide-react";

interface ConfirmModalProps {
    open: boolean;
    choice: CoinChoice | null;
    stake: number;
    mode: "NORMAL" | "2X";
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    choice,
    stake,
    mode,
    onConfirm,
    onCancel,
}: ConfirmModalProps) {
    const backdropRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    if (!open || !choice) return null;

    const isHeads = choice === "HEADS";
    const choiceLabel = isHeads ? "HEADS" : "TAILS";
    const potentialWin = mode === "2X" ? stake * 4 : stake * 2;

    return (
        <div
            ref={backdropRef}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-lg p-4"
            onClick={(e) => {
                if (e.target === backdropRef.current) {
                    playUiClick();
                    onCancel();
                }
            }}
        >
            <div className="relative w-full max-w-[420px] rounded-[2rem] border-4 border-[rgba(243,200,21,0.5)] bg-gradient-to-br from-[#3a1a6e] via-[#2b1050] to-[#1a0830] px-8 py-10 text-center animate-[modal-bounce-in_0.45s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
                <div className="flex justify-center mb-2 animate-[coin-bounce_1.2s_ease-in-out_infinite]">
                    {isHeads
                        ? <Gem size={64} strokeWidth={2.2} className="text-[#f3c815]" />
                        : <Target size={64} strokeWidth={2.2} className="text-[#ff4d5a]" />
                    }
                </div>

                <h2
                    className="text-[2.4rem] text-[#f3c815] tracking-wider mb-4 animate-[wiggle_0.6s_ease-in-out_infinite]"
                    style={{
                        fontFamily: "var(--font-display)",
                        textShadow: "0 3px 8px rgba(0,0,0,0.4)",
                    }}
                >
                    ARE YOU SURE?!
                </h2>

                <div className="rounded-2xl bg-black/30 border-2 border-white/[0.08] px-5 py-4 mb-4">
                    <div className="flex items-center justify-between py-1.5 text-[1.1rem] font-bold text-white/90" style={{ fontFamily: "var(--font-body)" }}>
                        <span className="flex items-center gap-2 text-white/65">
                            <Target size={18} className="shrink-0" />
                            Choice
                        </span>
                        <span className="text-white">{choiceLabel}</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-t border-white/[0.08] text-[1.1rem] font-bold text-white/90" style={{ fontFamily: "var(--font-body)" }}>
                        <span className="flex items-center gap-2 text-white/65">
                            <Wallet size={18} className="shrink-0" />
                            Stake
                        </span>
                        <span className="text-white">{stake} SOL</span>
                    </div>
                    <div className="flex items-center justify-between py-1.5 border-t border-white/[0.08] text-[1.1rem] font-bold text-white/90" style={{ fontFamily: "var(--font-body)" }}>
                        <span className="flex items-center gap-2 text-white/65">
                            <Award size={18} className="shrink-0" />
                            Win
                        </span>
                        <span className="text-[#5fff6e] text-[1.2rem]">
                            {potentialWin} SOL
                        </span>
                    </div>
                    {mode === "2X" && (
                        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff6b35] to-[#ff2d55] px-5 py-1.5 text-white" style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", letterSpacing: "0.1em" }}>
                            <Zap size={16} className="shrink-0" />
                            2X MODE
                            <Zap size={16} className="shrink-0" />
                        </div>
                    )}
                </div>

                <p className="flex items-center justify-center gap-2 text-base font-extrabold text-white/55 mb-5" style={{ fontFamily: "var(--font-body)" }}>
                    <Dice5 size={18} className="shrink-0" />
                    No take-backsies!
                    <Dice5 size={18} className="shrink-0" />
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-3 border-black/25 bg-gradient-to-b from-[#5dd85d] to-[#2ea82e] text-white text-[1.2rem] tracking-wide cursor-pointer transition-transform active:translate-y-0.5 shadow-[inset_0_-5px_0_0_rgba(0,0,0,0.15),0_8px_0_0_rgba(0,0,0,0.3)]"
                        style={{ fontFamily: "var(--font-display)" }}
                        onClick={() => {
                            playUiClick();
                            onConfirm();
                        }}
                    >
                        LET'S GOOO!
                    </button>
                    <button
                        type="button"
                        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border-3 border-black/25 bg-gradient-to-b from-[#666] to-[#444] text-white/85 text-[1.2rem] tracking-wide cursor-pointer transition-transform active:translate-y-0.5 shadow-[inset_0_-5px_0_0_rgba(0,0,0,0.15),0_8px_0_0_rgba(0,0,0,0.3)] hover:bg-gradient-to-b hover:from-[#777] hover:to-[#555]"
                        style={{ fontFamily: "var(--font-display)" }}
                        onClick={() => {
                            playUiClick();
                            onCancel();
                        }}
                    >
                        NAH, I'M SCARED
                    </button>
                </div>
            </div>
        </div>
    );
}
