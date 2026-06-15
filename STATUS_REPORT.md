# Obsidian Protocol Status Report

Generated: 2026-06-09
Project path: `C:\genlay\ARC\obsidian-protocol`

Audit scope: project-owned source, config, scripts, tests, docs, lockfiles, and generated status files were reviewed. Dependency and build output directories (`node_modules`, `.next`, `artifacts`, `cache`, `typechain-types`) are present but not enumerated file-by-file because they are generated/vendor content, not authored project files.

## 1. Project Overview

### What has been built so far

Obsidian Protocol currently includes:

- An immutable Solidity smart contract named `ObsidianVault`.
- A Hardhat project with deployment, verification, and contract tests.
- A deployed Arc Testnet contract.
- A Next.js frontend with:
  - Landing page.
  - Vault creation page.
  - Vault dashboard page.
  - Public verification page.
  - Documentation and roadmap page.
  - RainbowKit/Wagmi wallet connection.
  - Arc Testnet MetaMask auto-add/switch support.
  - Client-side AES-256-GCM encryption.
  - age-encryption key wrapping.
  - Pinata-backed encrypted JSON upload API route.

### Current state

- Smart contract: deployed on Arc Testnet.
- Frontend: running locally on `http://localhost:3003`.
- Production readiness: not production ready.
- Testnet readiness: partially ready, but blocked for complete vault creation because `NFT_STORAGE_API_KEY` is empty in root `.env`.

### Deployed contract

- Address: `0x3cd669bb7E38A4F346bB64bAc5461d7aDD36D00d`
- Network: Arc Testnet
- Chain ID: `5042002`
- Explorer: `https://testnet.arcscan.app/address/0x3cd669bb7E38A4F346bB64bAc5461d7aDD36D00d`
- Deployment record: `frontend/lib/deployment.json`

### Stack summary

- Solidity `0.8.24`
- Hardhat `^2.22.19`
- Next.js `14.2.35`
- React `18.3.1`
- TypeScript `^5.7.2`
- Tailwind CSS `^3.4.17`
- Wagmi `^2.14.7`
- Viem `^2.21.55`
- RainbowKit `^2.2.11`
- age-encryption `^0.3.0`
- Pinata IPFS pinning API
- Arc Testnet RPC: `https://rpc.testnet.arc.network`

## 2. File Structure Audit

Generated/vendor directories present:

- `node_modules/` - root dependency install output; generated/vendor.
- `frontend/node_modules/` - frontend dependency install output; generated/vendor.
- `frontend/.next/` - Next.js build/dev cache; generated.
- `artifacts/` - Hardhat compile artifacts; generated.
- `cache/` - Hardhat compile cache; generated.
- `typechain-types/` - generated TypeChain typings.

Project-owned files:

| File | Description | Flags |
|---|---|---|
| `.env` | Local runtime/deploy environment file. | Contains private key locally; `NFT_STORAGE_API_KEY` empty; `ARCSCAN_API_KEY` empty optional. Do not commit. |
| `.env.example` | Example environment template. | Placeholder values only; safe after private key was removed. |
| `.gitignore` | Ignore rules for dependencies, build outputs, env files, and tsbuildinfo. | Does not ignore `frontend/next-dev-3003.*.log`. |
| `README.md` | Project setup, deployment, and reference docs. | References planned env setup; no TODO found. |
| `STATUS_REPORT.md` | This report. | Generated audit artifact. |
| `contracts/ObsidianVault.sol` | Core dead man's switch smart contract. | Complete but design mismatch: `encryptedDecryptionKey` is readable before trigger and trigger only re-emits it. |
| `hardhat.config.ts` | Solidity compiler, Arc network, and explorer verification config. | Hardcoded RPC/explorer fallback values; private key is normalized with `0x` internally. |
| `package-lock.json` | Root dependency lockfile. | Large generated lockfile; npm audit reports vulnerabilities. |
| `package.json` | Root Hardhat scripts and dev dependencies. | No placeholder; scripts work. |
| `scripts/deploy.ts` | Deploys `ObsidianVault` and writes frontend deployment JSON. | Complete; prints deployment address. |
| `scripts/verify.ts` | Verifies deployed contract through Hardhat verify. | Requires `ARCSCAN_API_KEY` or explorer compatibility; not tested successfully. |
| `test/ObsidianVault.test.ts` | Hardhat tests for vault creation, timers, heartbeat, and trigger. | Tests pass; standalone root `tsc --noEmit` fails on typings. |
| `tsconfig.json` | Root TypeScript config for Hardhat project. | Includes tests that produce type errors under raw `tsc`. |
| `frontend/.env.example` | Frontend env template. | Placeholder only; missing deployed contract value. |
| `frontend/app/api/ipfs/upload/route.ts` | Server API route that pins encrypted JSON to Pinata/IPFS. | Uses `NFT_STORAGE_API_KEY` as the Pinata JWT variable for now. |
| `frontend/app/docs/page.tsx` | Documentation/Roadmap route with React tab state. | Complete. |
| `frontend/app/layout.tsx` | Root Next layout, fonts, providers, metadata. | Complete. |
| `frontend/app/page.tsx` | Landing page route composition. | Complete. |
| `frontend/app/providers.tsx` | Wagmi, React Query, RainbowKit config and theme. | Hardcoded RPC URL and local WalletConnect fallback project ID. |
| `frontend/app/vault/[address]/page.tsx` | Dynamic vault dashboard route wrapper. | Complete. |
| `frontend/app/vault/new/page.tsx` | New vault route wrapper. | Complete. |
| `frontend/app/verify/page.tsx` | Public verification route wrapper. | Complete. |
| `frontend/components/AppHeader.tsx` | Shared app header with landing/docs links and wallet button. | Complete. |
| `frontend/components/CountdownTimer.tsx` | Live deadline countdown UI. | Complete. |
| `frontend/components/CreateVaultClient.tsx` | Vault creation workflow: beneficiaries, age keys, encryption, upload, deploy. | Contract write path exists; upload now targets Pinata. |
| `frontend/components/FileEncryptor.tsx` | Drag/drop file selector and browser encryption trigger. | Complete. |
| `frontend/components/Terminal.tsx` | Shared terminal-style panel component. | Complete. |
| `frontend/components/VaultDashboardClient.tsx` | Vault dashboard, countdown, heartbeat, trigger, records, history. | Triggered vaults now show client-side beneficiary decrypt UI. |
| `frontend/components/VaultStatus.tsx` | Status badge mapping for vault status. | Complete. |
| `frontend/components/VerifyClient.tsx` | Public vault lookup and trigger UI. | Download link exists; triggered vaults now show client-side beneficiary decrypt UI. |
| `frontend/components/WalletConnect.tsx` | RainbowKit custom wallet button and Arc switch button. | Complete; actual MetaMask UX not browser-verified here. |
| `frontend/components/docs/ContractReference.tsx` | Docs table for contract functions/events. | Complete. |
| `frontend/components/docs/DocsTab.tsx` | Main documentation tab content. | Complete. |
| `frontend/components/docs/EncryptionDiagram.tsx` | Monospace encryption flow diagram. | Updated to beneficiary-only age private key decryption. |
| `frontend/components/docs/FAQ.tsx` | Documentation FAQ. | Complete. |
| `frontend/components/docs/RoadmapTab.tsx` | Roadmap wrapper and CTA section. | Complete. |
| `frontend/components/docs/RoadmapTimeline.tsx` | Visual roadmap timeline with phases and statuses. | Complete; Contact Protection is correctly described as future/planned. |
| `frontend/components/docs/SetupGuide.tsx` | Five-step setup guide. | Complete; `/vault/[address]` is shown as a route pattern, not a real dashboard link. |
| `frontend/components/landing/Footer.tsx` | Landing footer links/resources. | Complete; GitHub points to generic `https://github.com`, not a real repo. |
| `frontend/components/landing/ForOrganizations.tsx` | Landing section for organizations. | Complete. |
| `frontend/components/landing/HeroSection.tsx` | Landing hero and primary CTAs. | Complete. |
| `frontend/components/landing/HowItWorks.tsx` | Landing process section. | Complete. |
| `frontend/components/landing/ProblemSection.tsx` | Landing problem statement section. | Complete. |
| `frontend/components/landing/TerminalAnimation.tsx` | Animated terminal-style landing visual. | Complete. |
| `frontend/components/landing/ThreatModel.tsx` | Landing threat model section. | Complete. |
| `frontend/components/landing/WhyArc.tsx` | Landing Arc blockchain explanation. | Complete. |
| `frontend/hooks/useHeartbeat.ts` | Sends heartbeat transaction and tracks receipt. | Complete; assumes connected wallet is owner. |
| `frontend/hooks/useVault.ts` | Reads vault data/status/history from contract. | Complete; can be slow if `EVENT_START_BLOCK=0`. |
| `frontend/lib/arc-config.ts` | Arc chain config, explorer helpers, contract address fallback. | Hardcoded deployed address and RPC/explorer values. |
| `frontend/lib/contract.ts` | Frontend ABI and status/timer constants. | Complete. |
| `frontend/lib/deployment.json` | Last deployment metadata. | Complete. |
| `frontend/lib/encryption.ts` | AES-256-GCM encryption/decryption and age key wrapping. | Decrypt function exists but is not wired into UI. |
| `frontend/lib/ipfs.ts` | Browser upload helper and gateway URL conversion. | Complete; depends on server API route and env key. |
| `frontend/lib/wallet-network.ts` | MetaMask `wallet_addEthereumChain`, error code parsing, switch retry. | Complete. |
| `frontend/next-env.d.ts` | Next.js generated TypeScript declarations. | Generated. |
| `frontend/next.config.mjs` | Next.js config. | Minimal; complete. |
| `frontend/next-dev-3003.err.log` | Local dev server stderr log. | Generated runtime file; should be ignored or deleted. |
| `frontend/next-dev-3003.out.log` | Local dev server stdout log. | Generated runtime file; should be ignored or deleted. |
| `frontend/package-lock.json` | Frontend dependency lockfile. | Large generated lockfile; npm audit reports vulnerabilities. |
| `frontend/package.json` | Frontend scripts and dependencies. | Complete; dependency versions have audit findings. |
| `frontend/postcss.config.js` | PostCSS/Tailwind config. | Complete. |
| `frontend/styles/globals.css` | Global CSS, theme base, reveal helpers. | Complete. |
| `frontend/tailwind.config.ts` | Tailwind theme tokens and fonts. | Complete. |
| `frontend/tsconfig.json` | Frontend TypeScript config. | Complete. |
| `frontend/tsconfig.tsbuildinfo` | TypeScript incremental build metadata. | Generated; already ignored by `.gitignore`. |

No authored source file contains `TODO` or `FIXME`.

## 3. Smart Contract Status

### Contract

- Name: `ObsidianVault`
- Location: `contracts/ObsidianVault.sol`
- Deployed on Arc Testnet: Yes
- Address: `0x3cd669bb7E38A4F346bB64bAc5461d7aDD36D00d`

### Functions implemented

- `createVault(string ipfsHash, string encryptedDecryptionKey, uint256 timerDuration, address[] beneficiaries)`
- `heartbeat()`
- `activateTrigger(address user)`
- `getVault(address user)`
- `getStatus(address user)`
- `nextDeadline(address user)`
- `hasVault(address user)`
- Internal/private:
  - `_deadline(Vault storage vault)`
  - `_isAllowedTimer(uint256 timerDuration)`
  - `_validateBeneficiaries(address[] calldata beneficiaries)`

### Events implemented

- `VaultCreated(address indexed user, string ipfsHash, uint256 timer)`
- `HeartbeatSent(address indexed user, uint256 nextDeadline)`
- `TriggerActivated(address indexed user, string ipfsHash, string decryptionKey)`

### Test status

Command run: `npx.cmd hardhat test`

Result:

- 5 passing
- 0 failing

Covered by current tests:

- Vault creation with allowed timer and beneficiaries.
- Invalid timer rejection.
- Duplicate beneficiary rejection.
- Owner heartbeat before expiry.
- Heartbeat rejection after expiry.
- Public trigger after expiry.
- Trigger lock after activation.

Not covered by tests:

- Zero address beneficiary rejection.
- Empty IPFS hash rejection.
- Empty encrypted key rejection.
- Second vault creation rejection.
- `hasVault()`.
- `nextDeadline()` for nonexistent vault.
- Boundary condition at exactly deadline.
- Full integration with deployed Arc Testnet contract.

### Solidity/security observations

- No admin owner exists.
- No upgrade path exists.
- No payable paths or token custody exist.
- No external calls inside contract functions, so reentrancy risk is low.
- Timer uses `block.timestamp`; acceptable for day-scale timers, but not exact timekeeping.
- `encryptedDecryptionKey` is stored in contract storage and returned by `getVault()` before trigger (`contracts/ObsidianVault.sol:100-121`). It is encrypted, but the trigger does not make new secret material public; it emits the same encrypted value (`contracts/ObsidianVault.sol:97`).
- This means the current contract does not technically "release a plaintext decryption key" on trigger. The frontend/docs should be aligned with this reality or the protocol design must change.

## 4. Frontend Status

### `/` landing

Sections built:

- Hero section.
- Problem section.
- How it works.
- Why Arc.
- Threat model.
- For organizations.
- Footer.
- CTAs to `/vault/new`, `/verify`, and `/docs`.

Sections missing:

- None required by current build request.

Broken components:

- No broken component found during route check.
- `/` returned HTTP 200.

### `/vault/new`

Steps implemented:

- Beneficiary address input.
- age recipient input.
- age identity generation.
- AES-256-GCM file encryption.
- age wrapping of AES key.
- Pinata upload call through `/api/ipfs/upload`.
- Timer selection: 7D, 14D, 30D.
- Contract `createVault()` write.
- Arc network auto-add/switch before deploy.

Encryption working:

- Code path: Yes.
- Browser execution not manually verified in this report.

IPFS upload working:

- No, not currently end-to-end.
- Reason: root `.env` has `NFT_STORAGE_API_KEY=EMPTY` at line 5.
- The API route returns `500` if the key is missing (`frontend/app/api/ipfs/upload/route.ts:18-20`).

Contract interaction working:

- Code path: Yes.
- Deployed contract exists.
- End-to-end vault creation is blocked until IPFS upload works.

### `/vault/[address]`

Dashboard complete:

- Mostly yes.
- Shows status, countdown, owner, IPFS hash, timer, heartbeat date, deadline, beneficiaries, event history, heartbeat, trigger.

Countdown timer working:

- Code path: Yes (`frontend/components/CountdownTimer.tsx`).

Heartbeat button working:

- Code path: Yes (`frontend/hooks/useHeartbeat.ts`).
- Requires connected wallet to be vault owner and correct network.
- Not manually verified against a live created vault in this report.

Reading from contract:

- Code path: Yes (`frontend/hooks/useVault.ts`).
- Uses `getVault`, `getStatus`, and event queries.
- Potential performance issue: `EVENT_START_BLOCK=0` makes event scans start from genesis.

Broken or incomplete:

- No UI to decrypt a triggered vault file even though `decryptVaultFile()` exists.
- Triggered view only displays the encrypted age-wrapped key, not a full recovery/download/decrypt flow.

### `/verify`

Public verification working:

- Code path: Yes.
- User can enter owner address and read vault data/status.

IPFS download working:

- Partial.
- It provides a gateway link to the encrypted file.
- It does not verify gateway availability.
- It does not decrypt the file.

Broken or incomplete:

- No decryption UI.
- No direct display of `TriggerActivated` event payload beyond the stored encrypted key.

### `/docs`

Documentation complete:

- Yes, page exists and returns HTTP 200.
- Includes protocol overview, technical flow, contract reference, security model, setup guide, and FAQ.

Roadmap complete:

- Yes, includes status badge, vertical timeline, phases, and CTA buttons.

Known docs issue:

- Resolved: documentation now says the trigger emits an age-wrapped AES key and designated beneficiaries decrypt with their age private key.

## 5. Encryption Status

AES-256-GCM implemented:

- Yes.
- Location: `frontend/lib/encryption.ts`
- Uses `crypto.subtle.generateKey({ name: "AES-GCM", length: 256 })`.
- Uses random 12-byte IV via `crypto.getRandomValues`.

age-encryption implemented:

- Yes.
- Location: `frontend/lib/encryption.ts`
- Generates age identity/recipient pairs.
- Wraps the AES key payload for one or more age recipients.
- Decrypt function exists.

Client-side only:

- Plaintext encryption: Yes, browser-side only.
- Encrypted file upload: server receives encrypted JSON only.
- Key wrapping: browser-side only.

Any data sent unencrypted:

- Plaintext file contents: No evidence found.
- Metadata sent in encrypted JSON: original filename, MIME type, size, timestamp, IV, and ciphertext are uploaded.
- Beneficiary wallet addresses and encrypted key are stored on-chain.

Known issues:

- Decrypt UI is not implemented.
- The AES key is age-wrapped to recipients at creation time; trigger does not reveal a plaintext key to the public.
- The encrypted file envelope includes original file name/type/size in plaintext metadata.
- Console logs disclose filenames, sizes, CIDs, owner addresses, and tx hashes in browser/server logs. This is not secret material, but it is operational metadata.

## 6. Wallet + Blockchain Connection

Wagmi v2 configured:

- Yes.
- Location: `frontend/app/providers.tsx`

Arc Testnet chain config correct:

- Mostly yes for MetaMask/RainbowKit.
- Chain ID: `5042002`
- RPC: `https://rpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`
- Native currency: `USDC`
- Native decimals: `18` for MetaMask compatibility.

wallet_addEthereumChain implemented:

- Yes.
- Location: `frontend/lib/wallet-network.ts`
- Called before connect modal and before switching to Arc.

nativeCurrency decimals fix applied:

- Yes.
- Location: `frontend/lib/arc-config.ts`
- `decimals: 18`

MetaMask connection working:

- Code path: Yes.
- Not manually verified through the actual MetaMask extension in this report.
- Route checks confirm the app loads.

## 7. Environment Variables

Root `.env` status, values not printed:

| Variable | Needed | Present |
|---|---:|---:|
| `PRIVATE_KEY` | Yes | Yes |
| `NEXT_PUBLIC_ARC_RPC_URL` | Yes | Yes |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | Yes |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Yes | Yes |
| `NFT_STORAGE_API_KEY` | Yes | No, empty |
| `NEXT_PUBLIC_EXPLORER_URL` | Yes | Yes |
| `ARCSCAN_API_KEY` | Optional | No, empty |
| `NEXT_PUBLIC_EVENT_START_BLOCK` | Recommended | Yes |

Important:

- `PRIVATE_KEY` is present and formatted without `0x`.
- `NFT_STORAGE_API_KEY` is missing, so vault creation cannot complete.
- `ARCSCAN_API_KEY` is optional for local operation but likely required for explorer source verification.

## 8. Known Bugs

| Severity | Error / bug | File and line | Suggested fix |
|---|---|---:|---|
| Critical | IPFS upload depends on a valid Pinata JWT in `NFT_STORAGE_API_KEY`. | `.env`, `frontend/app/api/ipfs/upload/route.ts` | Add valid Pinata JWT to root `.env` and retest upload. |
| Medium | Release semantics are beneficiary-only, not public decryption. | `contracts/ObsidianVault.sol`, `frontend/components/docs/EncryptionDiagram.tsx`, `frontend/components/landing/HowItWorks.tsx` | Resolved in docs/UI copy: trigger emits age-encrypted key material; designated beneficiaries decrypt with their age private key. |
| Medium | Root `npx tsc --noEmit` fails on Hardhat test contract typings (`heartbeat` / `activateTrigger` not found on `BaseContract`). | `test/ObsidianVault.test.ts:58`, `:60`, `:75`, `:83`, `:90`, `:95`, `:96` | Type the deployed contract with generated TypeChain types or adjust `tsconfig`/test typing pattern. |
| Medium | Frontend has a hardcoded deployed contract fallback. | `frontend/lib/arc-config.ts:34` | Keep `NEXT_PUBLIC_CONTRACT_ADDRESS` as the single source of truth; remove fallback before production. |
| Medium | Event history scans from block 0 by default if env is missing. | `.env`, `frontend/hooks/useVault.ts:105-128` | Resolved locally: `NEXT_PUBLIC_EVENT_START_BLOCK=46313342`. |
| Medium | Triggered vault decrypt flow needed an in-app beneficiary UI. | `frontend/lib/encryption.ts`, `frontend/components/VerifyClient.tsx`, `frontend/components/VaultDashboardClient.tsx` | Resolved locally with `DecryptVaultPanel`: download encrypted envelope, paste age identity, decrypt in browser, download plaintext. |
| Medium | Contract source verification is not proven. | `scripts/verify.ts:4-11`, `.env:6` | Set `ARCSCAN_API_KEY` if required and run `npm run verify:arc`. |
| Minor | Next build warns about optional wallet dependencies: `@react-native-async-storage/async-storage`, `pino-pretty`. | Build output from `npm.cmd run build` | Usually safe for browser build; suppress/alias only if warning noise is unacceptable. |
| Minor | Runtime dev log files are in project root under frontend and not ignored. | `frontend/next-dev-3003.log`, `frontend/next-dev-3003.err.log` | Resolved locally: `.gitignore` includes `frontend/next-dev-*.log` and `frontend/next-dev-*.err.log`. |
| Minor | Landing footer GitHub link is generic. | `frontend/components/landing/Footer.tsx` | Replace `https://github.com` with actual repository URL. |

## 9. Missing Features

| Feature | Why it matters | Complexity |
|---|---|---|
| Valid Pinata JWT and successful upload test | Vault creation cannot complete without encrypted file upload. | Easy |
| Decrypt/recovery UI | Implemented for triggered vaults; still needs browser/user testing with a real triggered vault and beneficiary key. | Medium |
| Hosted keeper bot | One-shot keeper script exists; it still needs hosting/cron to run automatically. | Medium |
| Contract source verification on ArcScan | Users cannot independently inspect verified source on explorer. | Easy/Medium |
| Deployment block stored in env | Implemented locally with deployment block `46313342`. | Easy |
| Public vs beneficiary release redesign | Resolved by documenting the current beneficiary-only model honestly instead of claiming public decryption. | Hard |
| Distress code | Roadmap item; important for coercion scenarios. | Hard |
| Multi-signature heartbeat | Reduces single-wallet failure risk. | Hard |
| Timelock on modifications | Not currently relevant because vault settings are immutable, but would matter if mutability is added. | Medium |
| Redundant IPFS pinning | Single provider availability is a resilience risk. | Medium |
| Notifications | Users may miss heartbeat deadlines. | Medium |
| Multiple files per vault | Current flow handles one encrypted file. | Medium |
| Beneficiary notification | Beneficiaries are not notified when trigger activates. | Medium |
| Real GitHub/security links | CTA links are placeholders/generic. | Easy |
| Automated frontend tests | UI has no unit/e2e tests. | Medium |
| Contract coverage report | Tests pass but no coverage metric is generated. | Easy |
| Security audit | No independent review has been performed. | Hard |

## 10. Security Issues

### Private keys in code

- No private key was found in source files.
- `PRIVATE_KEY` exists in root `.env`; this is expected for deployment but must never be committed.
- Earlier risk was corrected: private key had been placed in `.env.example`, then moved to `.env` and removed from `.env.example`.

### API keys exposed in frontend

- No `NFT_STORAGE_API_KEY` is exposed with a `NEXT_PUBLIC_` prefix.
- Server route reads it from `process.env.NFT_STORAGE_API_KEY`.
- Current problem: the key is empty, so upload fails.

### Unencrypted data sent to server

- Plaintext file bytes are encrypted client-side before upload.
- The server receives the encrypted JSON payload.
- Metadata in the encrypted JSON is not itself encrypted: original filename, MIME type, original size, encryption timestamp, IV, and ciphertext.
- On-chain data includes IPFS URI, beneficiary wallet addresses, and the age-encrypted AES key.

### npm audit summary

Root Hardhat project:

- Total vulnerabilities: 43
- Critical: 0
- High: 4
- Moderate: 21
- Low: 18
- Main affected chains: Hardhat, ethers v5 transitive packages, lodash, serialize-javascript, tmp, undici, ws.
- Fixes generally require major upgrades: Hardhat 3.x / Hardhat toolbox 7.x.

Frontend project:

- Total vulnerabilities: 27
- Critical: 0
- High: 4
- Moderate: 23
- Low: 0
- Main affected chains: Next.js 14.2.35, eslint-config-next, Wagmi/RainbowKit/WalletConnect/MetaMask transitive packages, ws, uuid.
- Fixes generally require major upgrades: Next 16.x, Wagmi 3.x, eslint-config-next 16.x.

### Other vulnerabilities / design risks

- No independent smart contract audit.
- No circuit breaker by design; good for immutability, bad if a bug is found after production deployment.
- One-shot keeper script exists at `scripts/keeper.ts`; expired vaults still require this script to be run by cron/PM2/worker/GitHub Action.
- Public claim mismatch around decryption release could create dangerous false confidence.
- Browser console/server logs reveal operational metadata.
- `EVENT_START_BLOCK=0` increases RPC load and may leak more query activity than needed.

## 11. What Works End to End

A user can currently:

1. Open the landing page at `http://localhost:3003/`.
2. Open documentation at `http://localhost:3003/docs`.
3. Connect a wallet through RainbowKit.
4. Ask MetaMask to add Arc Testnet automatically.
5. Switch to Arc Testnet.
6. Generate an age identity/recipient pair in the browser.
7. Select a local file and encrypt it in the browser with AES-256-GCM.
8. Wrap the AES key for age recipients.

What is currently blocked or not fully connected:

1. Creating a vault end-to-end is blocked because `NFT_STORAGE_API_KEY` is empty.
2. The deploy transaction from `/vault/new` cannot be reached until upload succeeds.
3. No live vault was created through the frontend during this audit.
4. Dashboard heartbeat/trigger logic exists but was not manually verified on a real vault created through the UI.
5. Public verification can read a vault if one exists, but there is no app-level decryption workflow.
6. Triggered vaults expose/display an encrypted age-wrapped key, not a public plaintext decrypt key.

Confirmed command results:

- `npx.cmd hardhat test`: 5 passing.
- `npm.cmd run typecheck` in `frontend`: passing.
- `npm.cmd run build` in `frontend`: passing with warnings.
- `npx.cmd tsc --noEmit` in root: failing because tests are typed as `BaseContract`.
- `npm.cmd audit --json` in root: 43 vulnerabilities.
- `npm.cmd audit --json` in frontend: 27 vulnerabilities.

## 12. Next Steps - Priority Order

### CRITICAL - must fix before demo

1. Add `NFT_STORAGE_API_KEY` to root `.env` and test `/vault/new` all the way through vault creation.
2. Browser-test triggered vault beneficiary decryption with a real encrypted envelope and age identity.

### IMPORTANT - should fix before hackathon

1. Verify the contract source on ArcScan.
2. Fix root TypeScript test typings so `npx tsc --noEmit` passes.
3. Address high npm audit findings, especially frontend Next.js advisories.
4. Add e2e test coverage for wallet connect, encrypt, upload, create vault, dashboard, heartbeat, verify.
5. Replace placeholder/generic GitHub links with real repository and security policy links.
6. Add zero-address, empty hash/key, duplicate vault, and boundary timestamp tests.
7. Add production-safe logging policy to avoid leaking filenames/CIDs in normal logs.

### NICE TO HAVE - future

1. Host the keeper bot so `scripts/keeper.ts` runs automatically and calls `activateTrigger()` for expired vaults.
2. Redundant IPFS pinning across multiple providers.
3. Email/Telegram heartbeat reminders.
4. Multiple files per vault.
5. Beneficiary notification system.
6. Multi-signature heartbeat.
7. Distress code.
8. Mobile heartbeat app.
9. Formal security audit.
10. Mainnet deployment plan after testnet validation.
