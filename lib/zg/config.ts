// Central 0G configuration. Server-only values are read from env.

export const ZG_EVM_RPC =
  process.env.ZG_EVM_RPC || "https://evmrpc.0g.ai";

export const ZG_INDEXER_RPC =
  process.env.ZG_INDEXER_RPC ||
  "https://indexer-storage-turbo.0g.ai";

export const ZG_COMPUTE_PROVIDER =
  process.env.ZG_COMPUTE_PROVIDER ||
  "0xa48f01287233509FD694a22Bf840225062E67836";

export const ZG_LEDGER_OG = Number(process.env.ZG_LEDGER_OG || "3");
export const ZG_PROVIDER_OG = Number(process.env.ZG_PROVIDER_OG || "1");

export const KNOWN_PROVIDERS: Record<string, string> = {
  "0xa48f01287233509FD694a22Bf840225062E67836": "qwen/qwen-2.5-7b-instruct",
  "0x8e60d466FD16798Bec4868aa4CE38586D5590049": "openai/gpt-oss-20b",
  "0x69Eb5a0BD7d0f4bF39eD5CE9Bd3376c61863aE08": "google/gemma-3-27b-it",
};

export const CHAIN_EXPLORER = "https://chainscan.0g.ai";
export const STORAGE_EXPLORER = "https://storagescan.0g.ai";

export function hasServerWallet(): boolean {
  return !!process.env.ZG_PRIVATE_KEY;
}
