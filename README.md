<div align="center">

<img src="./public/icon.svg" width="76" alt="Noxis" />

# Noxis

**Your mind, end-to-end encrypted.**

A sovereign second brain. Notes are encrypted in your browser and stored on
**0G Storage** — addressed by a Merkle root, retrievable from the decentralized
network, readable only by you. Log in with the same username and passphrase on
any device and your encrypted memory follows you.

Built for [**The Zero Cup**](https://0g.ai/arena/zero-cup) — 0G's global vibe-coding tournament.

</div>

---

## The idea

Most AI note apps ship your private thoughts to a server in plaintext. Noxis
flips that: your passphrase derives an AES-256 key **in the browser**, every note
is encrypted before it leaves your device, and the ciphertext is persisted on the
**0G decentralized storage network**. The server — and the network — only ever
see opaque bytes.

> Your keys, your storage. Sovereign by construction.

## How it uses the 0G stack

| Layer | What Noxis does | Status |
|-------|-----------------|--------|
| **0G Storage** | Every note is encrypted client-side, then uploaded as an opaque blob addressed by a Merkle root hash. An encrypted index manifest is also stored on 0G so the whole vault can be rebuilt on any device. | Live on Galileo testnet |
| **0G Chain (Galileo)** | Settles every storage submission. Each note shows its `root` + `tx` hash, linking out to the Galileo explorer. | Live |
| **0G Compute** | Designed path: questions answered by paid, TEE-verifiable inference, checked with `processResponse()` and settled on an on-chain ledger. The broker integration lives in `lib/zg/broker.ts`. | Designed — see note below |

### On inference

The 0G Compute broker is fully implemented in `lib/zg/broker.ts` (ledger
creation, provider acknowledgement, `getRequestHeaders`, `processResponse`
verification). For this demo the deployed **Ask** feature currently routes
through **OpenRouter** so it runs without a funded compute ledger. Swapping the
chat route back to `runInference()` re-enables the full on-chain, TEE-verified
path — the code is already there.

## Cross-device sync

Create a vault with a **username + passphrase**. From then on, the same
credentials unlock your notes on any device:

- On every save, Noxis encrypts a small **index manifest** (the list of note
  root-hashes + encrypted titles) and uploads it to 0G alongside the note itself.
- A lightweight **pointer** (`username -> latest manifest root`) is kept in a
  serverless KV so a fresh device can find the current manifest. The pointer key
  is derived from the username only and reveals nothing about your key.
- On unlock from a new device, Noxis reads the pointer, fetches the manifest from
  0G, decrypts it locally, and rebuilds your index — all notes reappear.

Your notes and your index both live on 0G as ciphertext; only the tiny mutable
pointer uses app infrastructure, because 0G testnet has no public mutable layer
a new app can use without running its own KV node.

## Architecture

```
Browser (client)                         Next.js API (server, holds funded key)        0G Network
-----------------                        --------------------------------------        ----------
username + passphrase -- PBKDF2 --> AES-256 key
note ---- encrypt (AES-GCM) --> ciphertext --> /api/storage/upload --- MemData -----> 0G Storage
index manifest -- encrypt --> ciphertext ----> /api/storage/upload ----------------> 0G Storage
                                                  manifest root --> /api/pointer (KV)
question -> local RAG select -> decrypt top-k -> /api/chat --> inference --> answer + [n] citations
```

- **The master key never leaves the browser.** The server only ever sees
  ciphertext (for storage) and the small decrypted snippets you explicitly ask
  about (for inference).
- **The funded private key never reaches the browser.** It lives only in
  server-side API routes (`ZG_PRIVATE_KEY`) and pays for storage submissions.

## Signature interactions

- **Decypher animation** — the headline resolves out of cipher glyphs on load.
- **Storage receipts** — every saved note shows its `root` + `tx` with Galileo
  explorer links and a live byte count of the ciphertext.
- **Pull from 0G** — re-download the ciphertext from the network and decrypt it,
  proving decentralized retrieval (not just local cache).
- **Cross-device unlock** — same username + passphrase on a new device rebuilds
  the whole vault from 0G.
- **Cited answers** — responses cite `[n]` back to the source memories.

## Run locally

```bash
npm install
cp .env.example .env.local   # add your keys (see below)
npm run dev                  # http://localhost:3000
```

### Environment

| Var | Description |
|-----|-------------|
| `ZG_PRIVATE_KEY` | **Server-only.** Funded 0G testnet key. Pays for storage submissions. |
| `ZG_EVM_RPC` | 0G Galileo RPC (default `https://evmrpc-testnet.0g.ai`). |
| `ZG_INDEXER_RPC` | 0G Storage indexer (default `https://indexer-storage-testnet-turbo.0g.ai`). |
| `OPENROUTER_API_KEY` | Inference backend for the Ask feature. |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | Serverless KV (Upstash) holding the sync pointer. |

### Funding

Get testnet OG from the [0G faucet](https://faucet.0g.ai) for the wallet behind
`ZG_PRIVATE_KEY`. A small balance (~0.5 OG) covers many note uploads — each
storage submission costs only a fraction of an OG plus gas.

## Privacy model — honest version

Encryption is real and client-side; the server cannot read your notes at rest.
Two honest caveats:

1. **Inference** decrypts the snippets relevant to a question in your browser and
   sends them through the server to the model, because it has to read them to
   answer. Everything at rest — local and on 0G — is ciphertext under a key only
   you hold.
2. **Sync** derives your encryption salt from your username so the same
   credentials reproduce the same key on any device. This means security rests on
   passphrase strength: choose a strong passphrase. (A random per-device salt
   would be stronger but cannot sync without extra infrastructure.)

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind · WebCrypto · ethers v6 ·
`@0gfoundation/0g-storage-ts-sdk` · `@0gfoundation/0g-compute-ts-sdk` · Upstash Redis

---

<div align="center">
<sub>Noxis · encrypted second brain · built on 0G Storage</sub>
</div>
