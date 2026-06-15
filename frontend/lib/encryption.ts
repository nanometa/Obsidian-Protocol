"use client";

import * as age from "age-encryption";

export type EncryptedFileEnvelope = {
  version: 1;
  algorithm: "AES-256-GCM";
  iv: string;
  originalName: string;
  originalType: string;
  originalSize: number;
  encryptedAt: string;
  ciphertext: string;
};

export type EncryptedVaultFile = {
  encryptedFile: File;
  encryptedKeyPartA: string;
  encryptedKeyPartB: string;
  envelope: Omit<EncryptedFileEnvelope, "ciphertext">;
};

export type AgeIdentityPair = {
  identity: string;
  recipient: string;
};

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
const AGE_RECIPIENT_PREFIX = "age1";

export async function generateAgeIdentityPair(): Promise<AgeIdentityPair> {
  console.log("[obsidian] generating age identity");
  const identity = await age.generateIdentity();
  const recipient = await age.identityToRecipient(identity);
  return { identity, recipient };
}

export async function encryptVaultFile(file: File, recipients: string[]): Promise<EncryptedVaultFile> {
  const normalizedRecipients = validateAgeRecipients(recipients);

  if (normalizedRecipients.length === 0) {
    throw new Error("At least one age recipient required.");
  }

  const plaintext = await file.arrayBuffer();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);

  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, plaintext);
  const split = await splitKey(aesKey);

  const envelope: EncryptedFileEnvelope = {
    version: 1,
    algorithm: "AES-256-GCM",
    iv: bytesToBase64(iv),
    originalName: file.name,
    originalType: file.type || "application/octet-stream",
    originalSize: file.size,
    encryptedAt: new Date().toISOString(),
    ciphertext: bytesToBase64(new Uint8Array(ciphertext))
  };

  const keyPartPayloadA = JSON.stringify({
    version: 2,
    algorithm: "AES-256-GCM-XOR-SPLIT",
    keyPart: split.partA,
    part: "A",
    iv: envelope.iv,
    originalName: envelope.originalName,
    originalType: envelope.originalType,
    encryptedAt: envelope.encryptedAt
  });

  const keyPartPayloadB = JSON.stringify({
    version: 2,
    algorithm: "AES-256-GCM-XOR-SPLIT",
    keyPart: split.partB,
    part: "B",
    iv: envelope.iv,
    originalName: envelope.originalName,
    originalType: envelope.originalType,
    encryptedAt: envelope.encryptedAt
  });

  const [encryptedKeyPartA, encryptedKeyPartB] = await Promise.all([
    ageEncryptText(keyPartPayloadA, normalizedRecipients),
    ageEncryptText(keyPartPayloadB, normalizedRecipients)
  ]);

  const encryptedFile = new File([JSON.stringify(envelope, null, 2)], `${file.name}.obsidian.json`, {
    type: "application/json"
  });

  console.log("[obsidian] encryption complete");

  return {
    encryptedFile,
    encryptedKeyPartA,
    encryptedKeyPartB,
    envelope: {
      version: envelope.version,
      algorithm: envelope.algorithm,
      iv: envelope.iv,
      originalName: envelope.originalName,
      originalType: envelope.originalType,
      originalSize: envelope.originalSize,
      encryptedAt: envelope.encryptedAt
    }
  };
}

export function isValidAgeRecipient(recipient: string) {
  return recipient.trim().startsWith(AGE_RECIPIENT_PREFIX);
}

function validateAgeRecipients(recipients: string[]) {
  if (!recipients || recipients.length === 0) {
    throw new Error("At least one age recipient required.");
  }

  return recipients.map((recipient) => {
    const normalizedRecipient = recipient.trim();

    if (!normalizedRecipient.startsWith(AGE_RECIPIENT_PREFIX)) {
      throw new Error(
        `Invalid age public key: "${normalizedRecipient}". Age public keys must start with "age1". Generate one using the age identity generator on the create vault page.`
      );
    }

    return normalizedRecipient;
  });
}

export async function decryptVaultFile(envelope: EncryptedFileEnvelope, armoredKey: string, identity: string) {
  return decryptVaultFileWithKeyParts(envelope, armoredKey, "", identity);
}

export async function decryptVaultFileWithKeyParts(
  envelope: EncryptedFileEnvelope,
  encryptedKeyPartA: string,
  encryptedKeyPartB: string,
  identity: string
) {
  if (!encryptedKeyPartB.trim()) {
    throw new Error("Vault not yet triggered. Documents locked until timer expires.");
  }

  const decrypter = new age.Decrypter();
  decrypter.addIdentity(identity.trim());
  const [partAText, partBText] = await Promise.all([
    ageDecryptText(encryptedKeyPartA, decrypter),
    ageDecryptText(encryptedKeyPartB, decrypter)
  ]);
  const partA = parseKeyPartPayload(partAText, "A");
  const partB = parseKeyPartPayload(partBText, "B");

  const cryptoKey = await recombineKey(partA.keyPart, partB.keyPart);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(partA.iv || envelope.iv) },
    cryptoKey,
    base64ToBytes(envelope.ciphertext)
  );

  console.log("[obsidian] decryption complete");
  return new File([plaintext], envelope.originalName, { type: envelope.originalType });
}

async function splitKey(aesKey: CryptoKey): Promise<{ partA: string; partB: string }> {
  const keyBytes = new Uint8Array(await crypto.subtle.exportKey("raw", aesKey));
  const mask = crypto.getRandomValues(new Uint8Array(keyBytes.length));
  const partA = new Uint8Array(keyBytes.length);
  const partB = new Uint8Array(keyBytes.length);

  for (let i = 0; i < keyBytes.length; i++) {
    partA[i] = mask[i];
    partB[i] = keyBytes[i] ^ mask[i];
  }

  return {
    partA: bytesToBase64(partA),
    partB: bytesToBase64(partB)
  };
}

async function recombineKey(partA: string, partB: string): Promise<CryptoKey> {
  const aBytes = base64ToBytes(partA);
  const bBytes = base64ToBytes(partB);

  if (aBytes.length !== bBytes.length) {
    throw new Error("Key parts do not match.");
  }

  const keyBytes = new Uint8Array(aBytes.length);
  for (let i = 0; i < aBytes.length; i++) {
    keyBytes[i] = aBytes[i] ^ bBytes[i];
  }

  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function ageEncryptText(value: string, recipients: string[]) {
  const encrypter = new age.Encrypter();
  recipients.forEach((recipient) => encrypter.addRecipient(recipient));
  const wrapped = await encrypter.encrypt(value);
  return age.armor.encode(wrapped);
}

async function ageDecryptText(value: string, decrypter: age.Decrypter) {
  const decoded = age.armor.decode(value);
  return decrypter.decrypt(decoded, "text");
}

function parseKeyPartPayload(value: string, expectedPart: "A" | "B") {
  const payload = JSON.parse(value) as {
    version?: number;
    algorithm?: string;
    keyPart?: string;
    part?: string;
    iv?: string;
  };

  if (
    payload.version !== 2 ||
    payload.algorithm !== "AES-256-GCM-XOR-SPLIT" ||
    payload.part !== expectedPart ||
    !payload.keyPart
  ) {
    throw new Error(`Invalid encrypted key part ${expectedPart}.`);
  }

  return {
    keyPart: payload.keyPart,
    iv: payload.iv
  };
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
