export const STAKES = {
    "NORMAL": [0.1, 0.25, 0.5, 1, 2, 3, 4, 5],
    "2X": [0.2, 0.5, 1, 2, 4, 6, 8, 10],
};

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY!;

const PROVIDER_URLS = {
    "MAINNET": `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
    "DEVNET": `https://solana-devnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
}
const SOLANA_NETWORK: "MAINNET" | "DEVNET" = import.meta.env.VITE_SOLANA_NETWORK!;
export const PROVIDER_URL = PROVIDER_URLS[SOLANA_NETWORK];

export const PROGRAM_ID = import.meta.env.VITE_PROGRAM_ID!;