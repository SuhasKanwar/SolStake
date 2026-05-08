import playUiClick from "../utils/sound";

interface ButtonProps {
    variant?: "primary" | "secondary";
    className?: string;
    children: React.ReactNode;
    action?: () => void;
    disabled?: boolean;
}

export function Button({
    variant = "primary",
    className,
    children,
    action,
    disabled,
}: ButtonProps) {
    const baseClasses =
        "inline-flex items-center justify-center select-none rounded-2xl px-6 py-4 font-extrabold tracking-wide " +
        "border-4 ring-2 ring-[rgba(0,0,0,0.45)] " +
        "transition-transform active:translate-y-[1px] " +
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/40 " +
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:active:translate-y-0";

    const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
        primary:
            "bg-(--primary-button-color) text-[#814c0f] border-[rgba(0,0,0,0.25)] shadow-[inset_0_-8px_0_0_rgba(0,0,0,0.10),0_10px_0_0_rgba(0,0,0,0.30)]",
        secondary:
            "btn-secondary-animated bg-(--secondary-button-color) text-white border-[rgba(0,0,0,0.25)] shadow-[inset_0_6px_0_0_rgba(255,255,255,0.06),inset_0_-8px_0_0_rgba(0,0,0,0.14),0_10px_0_0_rgba(0,0,0,0.30)]",
    };
    
    return (
        <button
            type="button"
            className={`${baseClasses} ${variantClasses[variant]} ${className ?? ""}`}
            onClick={() => {
                if (disabled) return;
                playUiClick();
                action?.();
            }}
            disabled={disabled}
        >
            {children}
        </button>
    );
}