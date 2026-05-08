import { useState } from "react";
import Header from "../components/Header";
import { STAKES } from "../lib/config";
import { Button } from "../components/Button";

export default function HomePage() {
    const [mode, setMode] = useState<"NORMAL" | "2X">("NORMAL");
    const [selectedStake, setSelectedStake] = useState<number>(STAKES[mode][0]);

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

    function handleOnChainFlip(choice: "HEADS" | "TAILS") {
        // TODO: Implement on-chain flip logic
        console.log("flip", { choice, mode, selectedStake });
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-(--bg-gradient-from) to-(--bg-gradient-to) px-4 py-10">
            <Header />
            <div className="mt-8 w-full max-w-2xl">
                <Button
                    variant={is2x ? "primary" : "secondary"}
                    className="w-full py-5 text-xl sm:text-2xl rounded-4xl"
                    action={switchMode}
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
                    >
                        <span className="flex items-center justify-center gap-4">
                            <span>FLIP HEADS</span>
                        </span>
                    </Button>

                    <Button
                        variant="primary"
                        className="w-full py-6 rounded-3xl text-2xl sm:text-3xl"
                        action={() => handleOnChainFlip("TAILS")}
                    >
                        <span className="flex items-center justify-center gap-4">
                            <span>FLIP TAILS</span>
                        </span>
                    </Button>
                </div>
            </section>
        </main>
    );
}