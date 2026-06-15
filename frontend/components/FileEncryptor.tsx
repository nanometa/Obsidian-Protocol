"use client";

import { FileLock2, UploadCloud } from "lucide-react";
import { ChangeEvent, DragEvent, useRef, useState } from "react";
import { encryptVaultFile, type EncryptedVaultFile } from "@/lib/encryption";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "video/mp4",
  "application/zip",
  "application/x-zip-compressed"
];

type FileEncryptorProps = {
  recipients: string[];
  disabled?: boolean;
  onEncrypted: (payload: EncryptedVaultFile) => void;
};

export function FileEncryptor({ recipients, disabled = false, onEncrypted }: FileEncryptorProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function encryptFile(file: File) {
    setError(null);

    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 50MB.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      console.warn("[obsidian] unusual file type");
    }

    setIsEncrypting(true);
    setFileName(file.name);
    try {
      const result = await encryptVaultFile(file, recipients);
      onEncrypted(result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Encryption failed.";
      console.error("[obsidian] encryption failed");
      setError(message);
    } finally {
      setIsEncrypting(false);
    }
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void encryptFile(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void encryptFile(file);
  }

  return (
    <div>
      <input ref={inputRef} type="file" className="hidden" onChange={handleInput} disabled={disabled || isEncrypting} />
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`terminal-border flex min-h-48 cursor-pointer flex-col items-center justify-center gap-4 px-4 py-6 text-center transition ${
          isDragging ? "bg-obsidian-green text-obsidian-black" : "text-obsidian-green hover:bg-obsidian-green hover:text-obsidian-black"
        } ${disabled || isEncrypting ? "pointer-events-none opacity-60" : ""}`}
      >
        {isEncrypting ? <FileLock2 size={32} /> : <UploadCloud size={32} />}
        <div className="max-w-full">
          <div className="text-sm font-bold">{isEncrypting ? "ENCRYPTING..." : "DROP FILE OR SELECT"}</div>
          <div className="mt-2 break-words text-xs opacity-80">{fileName || "AES-256-GCM + AGE KEY WRAP"}</div>
        </div>
      </div>
      {error ? <p className="mt-3 break-words text-xs text-obsidian-warning">{error}</p> : null}
    </div>
  );
}
