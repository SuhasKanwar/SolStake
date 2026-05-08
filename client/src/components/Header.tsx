export default function Header() {
    return (
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
    );
}