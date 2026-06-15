const diagram = String.raw`
+------------------------------------------------+
|              OBSIDIAN PROTOCOL                 |
|              ENCRYPTION FLOW                   |
+------------------------------------------------+

[YOUR BROWSER]
      |
      +- 1. Select document
      +- 2. Generate AES-256-GCM key (random)
      +- 3. Encrypt document with AES key
      +- 4. XOR-split AES key into Part A + Part B
      +- 5. Age-wrap each part for beneficiaries
      |
      v
[IPFS NETWORK]
      |
      +- 6. Upload encrypted document
      +- 7. Receive IPFS hash (CID)
      |
      v
[ARC BLOCKCHAIN]
      |
      +- 8. Store: IPFS hash
      +- 9. Store: encrypted key Part A
      +- 10. Store: encrypted key Part B
      +- 11. getVault returns Part B as "" until trigger
      +- 12. Arm dead man's switch
      |
      v
[EVERY X DAYS]
      |
      +- Owner sends heartbeat transaction
      +- Timer resets
      |
      v (if no heartbeat)
[TRIGGER ACTIVATED]
      |
      +- Encrypted Part B is revealed through getVault + event
      +- Anyone can download encrypted file from IPFS
      +- Beneficiaries decrypt both parts with age private key
      +- Part A XOR Part B restores AES key in browser
`;

export function EncryptionDiagram() {
  return (
    <div className="overflow-x-auto border border-typeui-primary/35 bg-obsidian-black p-4">
      <pre className="min-w-[42rem] whitespace-pre font-mono text-xs leading-5 text-typeui-primary sm:text-sm">
        {diagram.trim()}
      </pre>
    </div>
  );
}
