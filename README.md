# OBSIDIAN PROTOCOL

OBSIDIAN PROTOCOL is a Dead Man's Switch platform for whistleblowers and journalists. It encrypts documents in the browser, stores only encrypted payloads on IPFS, and uses an immutable Arc Testnet smart contract to release the encrypted decryption package when a vault owner misses their heartbeat deadline.

## Why Arc

Arc is EVM compatible, uses USDC as the native gas token, and is designed for deterministic finality with no reorg waiting period. That matters for a dead man's switch because the vault state should be cheap to maintain, easy to reason about in dollar terms, and final once the release transaction is committed.

Current Arc Testnet settings:

- Network: Arc Testnet
- RPC: `https://rpc.testnet.arc.network`
- Chain ID: `5042002`
- Currency: `USDC`
- Explorer: `https://testnet.arcscan.app`
- Faucet: `https://faucet.circle.com`

## Architecture

```text
Browser only
  |
  | 1. Select document
  | 2. Generate AES-256-GCM key
  | 3. Encrypt document locally
  | 4. Wrap AES key with age recipient keys
  v
Encrypted JSON payload -----> Next.js API route -----> Pinata/IPFS
  |                                                   |
  |                                                   v
  |                                           ipfs://CID
  v
Arc Testnet contract
  - owner
  - encrypted file CID
  - age-encrypted AES key Part A
  - age-encrypted AES key Part B returned by getVault only after trigger
  - timer duration
  - last heartbeat
  - beneficiaries

After deadline:
  anyone calls activateTrigger(owner)
  contract emits TriggerActivated(owner, ipfsHash, encryptedKeyPartA, encryptedKeyPartB)
```

Important: EVM contracts do not execute automatically when time passes. The switch becomes releasable immediately after expiry, but a public transaction must call `activateTrigger(owner)` to emit the release event.

## Keeper Bot

Without a keeper bot, an expired vault does not trigger by itself. The timer can expire, but someone must still send a transaction that calls `activateTrigger(owner)`.

The project includes a one-shot keeper script that scans `VaultCreated` events, checks each vault status, and triggers expired vaults when execution is enabled.

Dry-run scan:

```bash
npm run keeper:dry-run
```

Execute real trigger transactions on Arc Testnet:

```powershell
$env:KEEPER_EXECUTE="true"
npm run keeper:arc
```

Useful environment variables:

```text
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_EVENT_START_BLOCK=46313342
KEEPER_FROM_BLOCK=46313342
KEEPER_TO_BLOCK=latest_block_optional
KEEPER_BLOCK_CHUNK_SIZE=9999
KEEPER_CONFIRMATIONS=1
```

Run this script from a cron job, PM2 process, GitHub Action, or hosted worker to make the protocol behave like a real dead man's switch after expiry.

## Keeper Bot - Automated (GitHub Actions)

The keeper runs automatically every hour via GitHub Actions at zero cost.

Setup:

1. Push project to GitHub
2. Go to Settings -> Secrets -> Actions
3. Add these secrets:

```text
KEEPER_PRIVATE_KEY  (without 0x)
ARC_RPC_URL         (https://rpc.testnet.arc.network)
CONTRACT_ADDRESS    (your deployed contract)
EVENT_START_BLOCK   (deployment block number)
```

The keeper wallet needs testnet USDC for gas.
Get it free: https://faucet.circle.com

To trigger manually:
GitHub -> Actions -> Obsidian Keeper Bot -> Run workflow

## Encryption

The frontend never uploads plaintext. `frontend/lib/encryption.ts` reads the selected file in the browser, encrypts it with AES-256-GCM, splits the AES key into two XOR shares, wraps each share with `age-encryption`, then sends only the encrypted JSON payload to `/api/ipfs/upload`.

Beneficiaries must provide an age recipient key like `age1...`; an EVM address alone is not enough to encrypt data to that person. The app includes a local age key generator for testing and onboarding.

## Cryptographic Design

Obsidian Protocol now uses a two-phase key splitting mechanism at the contract ABI and frontend layer.

At vault creation:

- AES-256-GCM key generated in browser
- Key split into Part A and Part B via XOR
- Both parts age-encrypted for beneficiaries
- Part A returned by `getVault()` while active
- Part B returns an empty string from `getVault()` until trigger

The math:

```text
partA XOR partB = original AES key
```

Before trigger:

- `getVault()` returns Part B as an empty string
- The frontend refuses decryption without Part B
- A beneficiary cannot reconstruct the AES key through the normal app or ABI path

After trigger:

- Part B is revealed by `getVault()` and `TriggerActivated`
- Beneficiaries decrypt both parts with their age private key
- XOR recombination restores the AES key
- File decrypts in browser

Important security limitation:

Arc Testnet is a public EVM chain. If encrypted Part B is submitted to contract storage at vault creation, a determined attacker may inspect raw storage outside the contract getter. This update fixes accidental early disclosure through the app, ABI, dashboard, and verification page, but it is not the same as true on-chain secrecy. A production-grade cryptographic dead man's switch should keep Part B off-chain until trigger, use threshold trustees, a keeper-held release share, timelock encryption, or a future private-state layer such as Arc Privacy.

## Setup

1. Install dependencies:

   ```bash
   npm install
   npm --prefix frontend install
   ```

2. Create root Hardhat env:

   ```bash
   cp .env.example .env
   ```

3. Create frontend env:

   ```bash
   cp frontend/.env.example frontend/.env.local
   ```

4. Fill these values:

   ```text
   PRIVATE_KEY=your_arc_testnet_deployer_private_key
   NFT_STORAGE_API_KEY=your_pinata_jwt
   NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
   ```

## Testnet USDC

1. Add Arc Testnet to your wallet:
   - RPC: `https://rpc.testnet.arc.network`
   - Chain ID: `5042002`
   - Symbol: `USDC`
   - Explorer: `https://testnet.arcscan.app`

2. Open `https://faucet.circle.com` and request testnet USDC for the same wallet address.

## Contract

Compile and test:

```bash
npm run compile
npm test
```

Deploy to Arc Testnet:

```bash
npm run deploy:arc
```

Copy the deployed address into:

```text
frontend/.env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
```

Verify, if ArcScan verification API is available for your key:

```bash
CONTRACT_ADDRESS=0x... npm run verify:arc
```

## Frontend

Run locally:

```bash
npm run frontend:dev
```

Build:

```bash
npm run frontend:build
```

Routes:

- `/` landing terminal
- `/vault/new` create vault
- `/vault/[address]` vault dashboard for the owner address
- `/verify` public verification and encrypted-file download

## Deployment

For Vercel, set the project root to `frontend/` and configure the same frontend environment variables in Vercel. Keep `NFT_STORAGE_API_KEY` server-side only; do not prefix it with `NEXT_PUBLIC_`. Despite the legacy variable name, this value is the Pinata JWT.

## Security Notes

- The contract is immutable: no admin role, no proxy, and no pause path.
- Key shares are age-encrypted before submission. Part B is hidden from the normal getter until trigger, but public-chain raw storage should not be treated as a private storage layer.
- npm audit on June 9, 2026 reports production advisories that only clear by moving beyond the requested stack to Next 16 and Wagmi 3. This project stays on Next.js 14 and Wagmi v2 as specified, with Next pinned to `14.2.35`.

## Post-Quantum Security

Current state (Testnet):

- Standard ECDSA - not yet quantum-resistant.
- Post-quantum features are on the Arc roadmap and not yet available on Arc.

Arc Mainnet launch:

- SLH-DSA-SHA2-128s wallet signatures (opt-in)
- Protects against signature forgery

Arc Privacy launch (near-term):

- X-Wing KEM (X25519 + ML-KEM-768) + AES-256-GCM
- Protects against harvest-now, decrypt-later attacks
- No code changes needed on Obsidian Protocol

Reference:
https://docs.arc.io/arc/concepts/post-quantum-security

## Links

- Arc Docs: https://docs.arc.io
- Arc Testnet Explorer: https://testnet.arcscan.app
- Arc Testnet Connection: https://docs.arc.io/integrate/connect-to-arc
- USDC Faucet: https://faucet.circle.com
- Pinata: https://app.pinata.cloud
- Pinata Docs: https://docs.pinata.cloud
- age encryption: https://github.com/FiloSottile/age
- age-encryption npm package: https://github.com/FiloSottile/typage
- Wagmi v2: https://wagmi.sh
- Hardhat: https://hardhat.org/docs
