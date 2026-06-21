import "server-only";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { randomBytes } from "crypto";
import { Indexer, MemData } from "@0glabs/0g-ts-sdk";
import { getWallet } from "./broker";
import { ZG_EVM_RPC, ZG_INDEXER_RPC } from "./config";

const g = globalThis as unknown as { __noxisIndexer?: Indexer };

function getIndexer(): Indexer {
  if (!g.__noxisIndexer) g.__noxisIndexer = new Indexer(ZG_INDEXER_RPC);
  return g.__noxisIndexer;
}

export interface UploadResult {
  rootHash: string;
  txHash: string;
  alreadyExists: boolean;
}

/**
 * Upload raw bytes (already client-side encrypted) to 0G Storage.
 * Returns the Merkle root hash that addresses the blob forever.
 */
export async function uploadBytes(data: Uint8Array): Promise<UploadResult> {
  const indexer = getIndexer();
  const signer = getWallet();

  const file = new MemData(data);

  // Precompute the root so we can still return it even if the network already
  // has this content (identical ciphertext -> identical root).
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr !== null || !tree) {
    throw new Error(`merkleTree failed: ${treeErr}`);
  }
  const rootHash = tree.rootHash() || "";

  try {
    // The SDK bundles its own ethers build; the Wallet is runtime-compatible
    // but its Signer type differs, so we bridge across the type boundary.
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
      rootHash: res?.rootHash || rootHash,
      txHash: res?.txHash || "",
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

/**
 * Download bytes addressed by a 0G Storage root hash.
 * The SDK writes to a file path, so we round-trip through the tmp dir.
 */
export async function downloadBytes(rootHash: string): Promise<Uint8Array> {
  const indexer = getIndexer();
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
