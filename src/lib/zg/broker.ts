import "server-only";
import { ethers } from "ethers";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import OpenAI from "openai";
import {
  ZG_EVM_RPC,
  ZG_COMPUTE_PROVIDER,
  ZG_LEDGER_OG,
  ZG_PROVIDER_OG,
  KNOWN_PROVIDERS,
} from "./config";

type Broker = Awaited<ReturnType<typeof createZGComputeNetworkBroker>>;

// Cache across serverless invocations (warm lambdas reuse the broker).
const g = globalThis as unknown as {
  __noxisBroker?: Broker;
  __noxisWallet?: ethers.Wallet;
  __noxisReady?: Set<string>;
  __noxisInit?: Promise<void>;
};

g.__noxisReady ??= new Set<string>();

function requireKey(): string {
  const key = process.env.ZG_PRIVATE_KEY;
  if (!key) {
    throw new Error(
      "ZG_PRIVATE_KEY is not set. Add the funded 0G testnet key to your environment.",
    );
  }
  return key;
}

export function getWallet(): ethers.Wallet {
  if (!g.__noxisWallet) {
    const provider = new ethers.JsonRpcProvider(ZG_EVM_RPC);
    g.__noxisWallet = new ethers.Wallet(requireKey(), provider);
  }
  return g.__noxisWallet;
}

export async function getBroker(): Promise<Broker> {
  if (!g.__noxisBroker) {
    g.__noxisBroker = await createZGComputeNetworkBroker(getWallet());
  }
  return g.__noxisBroker;
}

/**
 * Idempotently make sure the on-chain ledger exists and the chosen provider is
 * acknowledged + funded. Safe to call before every inference; the heavy work
 * runs at most once per warm instance.
 */
export async function ensureFunded(
  provider = ZG_COMPUTE_PROVIDER,
): Promise<void> {
  if (g.__noxisReady!.has(provider)) return;
  if (g.__noxisInit) {
    await g.__noxisInit;
    if (g.__noxisReady!.has(provider)) return;
  }

  g.__noxisInit = (async () => {
    const broker = await getBroker();

    // 1. Ledger — create if missing, otherwise leave as-is.
    let hasLedger = false;
    try {
      const ledger = await broker.ledger.getLedger();
      hasLedger = !!ledger && ledger.totalBalance !== undefined;
    } catch {
      hasLedger = false;
    }
    if (!hasLedger) {
      try {
        await broker.ledger.addLedger(ZG_LEDGER_OG);
      } catch (e) {
        // If it already exists we'll keep going; otherwise surface the reason.
        const msg = (e as Error).message || "";
        if (!/exist|already/i.test(msg)) throw e;
      }
    }

    // 2. Acknowledge the provider's TEE signer (required once per provider).
    try {
      await broker.inference.acknowledgeProviderSigner(provider);
    } catch (e) {
      const msg = (e as Error).message || "";
      if (!/acknowledg|exist|already/i.test(msg)) {
        // Non-fatal: some SDK versions auto-acknowledge on first request.
        console.warn("acknowledgeProviderSigner:", msg);
      }
    }

    // 3. Best-effort: pre-fund the provider sub-account. Newer SDKs auto-fund
    //    from the ledger during inference, so a failure here is non-fatal.
    try {
      // transferFund takes the amount in neuron (wei).
      await broker.ledger.transferFund(
        provider,
        "inference",
        ethers.parseEther(String(ZG_PROVIDER_OG)),
      );
    } catch (e) {
      console.warn("transferFund (non-fatal):", (e as Error).message);
    }

    g.__noxisReady!.add(provider);
  })();

  try {
    await g.__noxisInit;
  } finally {
    g.__noxisInit = undefined;
  }
}

export interface InferenceResult {
  answer: string;
  model: string;
  provider: string;
  providerLabel: string;
  chatId: string;
  verified: boolean;
  endpoint: string;
}

/**
 * Run a verifiable chat completion through 0G Compute.
 * Every call is paid from the on-chain ledger and the response is checked
 * against the provider's TEE signature via `processResponse`.
 */
export async function runInference(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  provider = ZG_COMPUTE_PROVIDER,
): Promise<InferenceResult> {
  await ensureFunded(provider);
  const broker = await getBroker();

  const { endpoint, model } =
    await broker.inference.getServiceMetadata(provider);

  // Billing headers are single-use and double as the settlement proof.
  const lastUser =
    [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const headers = await broker.inference.getRequestHeaders(provider, lastUser);

  const openai = new OpenAI({
    baseURL: endpoint,
    apiKey: "",
    defaultHeaders: headers as unknown as Record<string, string>,
  });

  const completion = await openai.chat.completions.create({
    model,
    messages,
    temperature: 0.3,
  });

  const answer = completion.choices[0]?.message?.content || "";
  const chatId = completion.id || "";

  let verified = false;
  try {
    verified =
      (await broker.inference.processResponse(provider, chatId, answer)) ===
      true;
  } catch (e) {
    console.warn("processResponse:", (e as Error).message);
  }

  return {
    answer,
    model,
    provider,
    providerLabel: KNOWN_PROVIDERS[provider] || model,
    chatId,
    verified,
    endpoint,
  };
}

export interface LedgerStatus {
  address: string;
  nativeBalanceOG: string;
  ledgerBalanceOG: string | null;
  hasLedger: boolean;
  provider: string;
  providerLabel: string;
  ready: boolean;
}

export async function getLedgerStatus(): Promise<LedgerStatus> {
  const wallet = getWallet();
  const native = await wallet.provider!.getBalance(wallet.address);

  let ledgerBalanceOG: string | null = null;
  let hasLedger = false;
  try {
    const broker = await getBroker();
    const ledger = await broker.ledger.getLedger();
    if (ledger && ledger.totalBalance !== undefined) {
      hasLedger = true;
      ledgerBalanceOG = ethers.formatEther(ledger.totalBalance.toString());
    }
  } catch {
    hasLedger = false;
  }

  return {
    address: wallet.address,
    nativeBalanceOG: ethers.formatEther(native),
    ledgerBalanceOG,
    hasLedger,
    provider: ZG_COMPUTE_PROVIDER,
    providerLabel: KNOWN_PROVIDERS[ZG_COMPUTE_PROVIDER] || "unknown",
    ready: hasLedger,
  };
}
