import "server-only";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomBytes } from "crypto";
import type { Indexer as IndexerType, MemData as MemDataType } from "@0gfoundation/0g-storage-ts-sdk";
import { getWallet } from "./broker";
import { ZG_EVM_RPC, ZG_INDEXER_RPC } from "./config";

const MIN_SIZE = 256;

type StorageSdk = { Indexer: typeof IndexerType; MemData: typeof MemDataType };

async function loadStorageSdk(): Promise<StorageSdk> {
  const mod = (await import("@0gfoundation/0g-storage-ts-sdk")) as Record<string, unknown> & {
    default?: Record<string, unknown>;
  };
  const src = (mod.Indexer ? mod : (mod.default ?? mod)) as Record<string, unknown>;
  return {
    Indexer: src.Indexer as typeof IndexerType,
    MemData: src.MemData as typeof MemDataType,
  };
}

const g = globalThis as unknown as { __noxisIndexer?: IndexerType };

async function getIndexer(): Promise<IndexerType> {
  if (!g.__noxisIndexer) {
    const { Indexer } = await loadStorageSdk();
    g.__noxisIndexer = new Indexer(ZG_INDEXER_RPC);
  }
  return g.__noxisIndexer;
}

export interface UploadResult {
  rootHash: string;
  txHash: string;
  alreadyExists: boolean;
}

export async function uploadBytes(data: Uint8Array): Promise<UploadResult> {
  // Pad to minimum chunk size to satisfy the flow contract
  let padded = data;
  if (data.length < MIN_SIZE) {
    padded = new Uint8Array(MIN_SIZE);
    padded.set(data);
  }

  const indexer = await getIndexer();
  const signer = getWallet();
  const { MemData } = await loadStorageSdk();
  const file = new MemData(padded);

  const [tree, treeErr] = await file.merkleTree();
  if (treeErr !== null || !tree) {
    throw new Error(`merkleTree failed: ${treeErr}`);
  }
  const rootHash = tree.rootHash() || "";

  try {
    const [res, uploadErr] = await indexer.upload(
      file,
      ZG_EVM_RPC,
      signer as unknown as Parameters<typeof indexer.upload>[2],
    );
    if (uploadErr !== null) {
      const msg = String(uploadErr);
      if (/already exist|exists|duplicate/i.test(msg)) {
        return { rootHash, txHash: "", alreadyExists: true };
      }
      throw new Error(msg);
    }
    return {
      rootHash: (res as any)?.rootHash || rootHash,
      txHash: (res as any)?.txHash || "",
      alreadyExists: false,
    };
  } catch (e) {
    const msg = (e as Error).message || String(e);
    if (/already exist|exists|duplicate/i.test(msg)) {
      return { rootHash, txHash: "", alreadyExists: true };
    }
    throw e;
  }
}

export async function downloadBytes(rootHash: string): Promise<Uint8Array> {
  const indexer = await getIndexer();
  const tmp = path.join(os.tmpdir(), `noxis-${randomBytes(8).toString("hex")}`);
  try {
    const err = await indexer.download(rootHash, tmp, true);
    if (err !== null) throw new Error(String(err));
    const buf = await fs.readFile(tmp);
    return new Uint8Array(buf);
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
}
