import { createPublicClient, http, defineChain } from "viem";

// Arbitrum Sepolia
export const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arbitrum-sepolia-rpc.publicnode.com"] },
    public: { http: ["https://arbitrum-sepolia-rpc.publicnode.com"] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
});

export const publicClient = createPublicClient({
  chain: arbitrumSepolia,
  transport: http(),
});

// Deployed contract address
export const CONTRACTS = {
  registry: "0x2119161e3f789e7946f7acae8516c63db8a57077",
} as const;

// Deployment block for event filtering
export const DEPLOYMENT_BLOCK = BigInt(271896448);

// Contract ABI
import registryAbi from "./abi/ToroRegistry.json";

export const ABIS = {
  registry: registryAbi,
} as const;
