import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const STAKES = {
    "NORMAL": [0.1, 0.25, 0.5, 1, 2, 3, 4, 5],
    "2X": [0.2, 0.5, 1, 2, 4, 6, 8, 10],
};

const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

const PROVIDER_URLS = {
    "MAINNET": ALCHEMY_API_KEY
        ? `https://solana-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : clusterApiUrl("mainnet-beta"),
    "DEVNET": ALCHEMY_API_KEY
        ? `https://solana-devnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`
        : clusterApiUrl("devnet"),
}
const SOLANA_NETWORK: "MAINNET" | "DEVNET" = import.meta.env.VITE_SOLANA_NETWORK ?? "DEVNET";
export const PROVIDER_URL = PROVIDER_URLS[SOLANA_NETWORK];

function publicKeyFromEnv(value: string | undefined, fallback: string) {
    const candidate = value?.trim() || fallback;
    try {
        return new PublicKey(candidate);
    } catch {
        console.warn(`Invalid VITE_PROGRAM_ID "${value}", using deployed default ${fallback}`);
        return new PublicKey(fallback);
    }
}

export const PROGRAM_ID = publicKeyFromEnv(
    import.meta.env.VITE_PROGRAM_ID,
    "33vQPdG6AQCQ5QGHQjqJra49n4a64PjZLEYgEXdX6T39",
);

export const ORAO_VRF_PROGRAM_ID = new PublicKey("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
export const ORAO_CONFIG_SEED = "orao-vrf-network-configuration";
export const ORAO_RANDOMNESS_SEED = "orao-vrf-randomness-request";
