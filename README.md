<div align="center">

<img src="./public/icon.svg" width="76" alt="Noxis" />

# Noxis

**Your mind, end-to-end encrypted.**

A sovereign second brain. Notes are encrypted in your browser and stored on
**0G Storage** — addressed by a Merkle root, retrievable from the decentralized
network, readable only by you.

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
| **0G Storage** | Every note is encrypted client-side, then uploaded as an opaque blob addressed by a Merkle root hash. Notes are re-fetched and decrypted directly from the network via "Pull from 0G". | Live on Galileo testnet |
| **0G Chain (Galileo)** | Settles every storage submission. Each note shows its `root` + `tx` hash, linking out to the Galileo explorer. | Live |
| **0G Compute** | Designed path: questions answered by paid, TEE-verifiable inference, checked with `processResponse()` and settled on an on-chain ledger. The broker integration lives in `lib/zg/broker.ts`. | Designed — see note below |

### On inference

The 0G Compute broker is fully implemented in `lib/zg/broker.ts` (ledger
creation, provider acknowledgement, `getRequestHeaders`, `processResponse`
verification). For this demo the deployed **Ask** feature currently routes
through **OpenRouter** so it runs without a funded compute ledger. Swapping the
chat route back to `runInference()` re-enables the full on-chain, TEE-verified
path — the code is already there.

## Architecture

```
Browser (client)                         Next.js API (server, holds funded key)        0G Network
-----------------                        --------------------------------------        ----------
passphrase -- PBKDF2 --> AES-256 key
note ---- encrypt (AES-GCM) --> ciphertext --> /api/storage/upload --- MemData -----> 0G Storage
                                  ^                                    rootHash,tx  <--+
local encrypted index (localStorage)
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

### Funding

Get testnet OG from the [0G faucet](https://faucet.0g.ai) for the wallet behind
`ZG_PRIVATE_KEY`. A small balance (~0.5 OG) covers many note uploads — each
storage submission costs only a fraction of an OG plus gas.

## Privacy model — honest version

Encryption is real and client-side; the server cannot read your notes at rest.
The one place plaintext is involved is **inference**: the snippets relevant to a
question are decrypted in your browser and sent through the server to the model,
because it has to read them to answer. Everything at rest — local and on 0G — is
ciphertext under a key only you hold.

## Stack

Next.js 15 · React 19 · TypeScript · Tailwind · WebCrypto · ethers v6 ·
`@0gfoundation/0g-storage-ts-sdk` · `@0gfoundation/0g-compute-ts-sdk`

---

<div align="center">
<sub>Noxis · encrypted second brain · built on 0G Storage</sub>
</div>
