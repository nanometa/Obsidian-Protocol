"use client";

import { Download, FileJson, KeyRound, LockOpen } from "lucide-react";
import { useState } from "react";
import { decryptVaultFileWithKeyParts, type EncryptedFileEnvelope } from "@/lib/encryption";
import { ipfsToGatewayUrl } from "@/lib/ipfs";
import { Terminal } from "./Terminal";

type DecryptVaultPanelProps = {
  ipfsHash: string;
  encryptedKeyPartA: string;
  encryptedKeyPartB: string;
};

export function DecryptVaultPanel({ ipfsHash, encryptedKeyPartA, encryptedKeyPartB }: DecryptVaultPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [identity, setIdentity] = useState("");
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  async function decryptSelectedFile() {
    setError(undefined);
    setMessage(undefined);

    if (!selectedFile) {
      setError("Select the encrypted .obsidian.json file downloaded from IPFS.");
      return;
    }

    if (!identity.trim()) {
      setError("Paste the beneficiary age private key before decrypting.");
      return;
    }

    try {
      setIsDecrypting(true);
      const envelope = JSON.parse(await selectedFile.text()) as EncryptedFileEnvelope;
      if (!envelope.ciphertext || !envelope.iv || !envelope.originalName) {
        throw new Error("Selected file is not a valid Obsidian encrypted envelope.");
      }

      const decryptedFile = await decryptVaultFileWithKeyParts(envelope, encryptedKeyPartA, encryptedKeyPartB, identity);
      const objectUrl = URL.createObjectURL(decryptedFile);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = decryptedFile.name || "obsidian-decrypted-file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setIdentity("");
      setMessage("Decrypted file downloaded.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Browser decrypt failed.");
    } finally {
      setIsDecrypting(false);
    }
  }

  return (
    <Terminal title="VAULT TRIGGERED">
      <div className="space-y-5">
        <div>
          <p className="text-base font-bold uppercase text-typeui-primary">Documents have been released.</p>
          <p className="mt-2 text-sm leading-6 text-typeui-cream">
            Designated beneficiaries can decrypt in this browser. The age private key never leaves this device.
          </p>
        </div>

        <div className="grid gap-4">
          <section className="grid gap-3 border border-typeui-primary/30 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-typeui-primary">
              <Download size={16} aria-hidden="true" />
              1. Download encrypted file
            </div>
            <a
              href={ipfsToGatewayUrl(ipfsHash)}
              target="_blank"
              rel="noreferrer"
              className="terminal-border inline-flex min-h-11 items-center justify-center gap-2 px-4 text-sm font-bold text-typeui-cream hover:bg-typeui-primary hover:text-typeui-night"
            >
              <Download size={17} aria-hidden="true" />
              DOWNLOAD FROM IPFS
            </a>
          </section>

          <section className="grid gap-3 border border-typeui-primary/30 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-typeui-primary">
              <FileJson size={16} aria-hidden="true" />
              2. Select encrypted file
            </div>
            <input
              type="file"
              accept="application/json,.json,.obsidian"
              onChange={(event) => setSelectedFile(event.target.files?.[0])}
              className="w-full border border-typeui-primary/35 bg-typeui-night p-2 text-xs text-typeui-cream file:mr-3 file:border-0 file:bg-typeui-primary file:px-3 file:py-2 file:text-xs file:font-bold file:text-typeui-night"
            />
            {selectedFile ? <p className="break-all text-xs text-typeui-muted">{selectedFile.name}</p> : null}
          </section>

          <section className="grid gap-3 border border-typeui-primary/30 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-typeui-primary">
              <KeyRound size={16} aria-hidden="true" />
              3. Paste your age private key
            </div>
            <textarea
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              rows={4}
              autoComplete="off"
              spellCheck={false}
              placeholder="AGE-SECRET-KEY-..."
              className="w-full resize-y border border-typeui-primary/35 bg-typeui-night p-3 font-mono text-xs text-typeui-cream outline-none focus:border-typeui-primary"
            />
          </section>

          <section className="grid gap-3 border border-typeui-primary/30 p-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase text-typeui-primary">
              <LockOpen size={16} aria-hidden="true" />
              4. Decrypt in browser
            </div>
            <button
              type="button"
              onClick={decryptSelectedFile}
              disabled={isDecrypting}
              className="terminal-border inline-flex min-h-11 items-center justify-center gap-2 bg-typeui-primary px-4 text-sm font-bold text-typeui-night hover:bg-typeui-cream disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LockOpen size={17} aria-hidden="true" />
              {isDecrypting ? "DECRYPTING..." : "DECRYPT FILE"}
            </button>
            <p className="text-xs leading-5 text-typeui-muted">Result downloads automatically.</p>
          </section>
        </div>

        {message ? <p className="break-words text-sm font-bold text-typeui-primary">{message}</p> : null}
        {error ? <p className="break-words text-sm font-bold text-typeui-warning">{error}</p> : null}
      </div>
    </Terminal>
  );
}
