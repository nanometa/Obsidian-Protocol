export type IpfsUploadResult = {
  cid: string;
  ipfsUri: string;
  gatewayUrl: string;
};

type PinataUploadResponse = Partial<IpfsUploadResult> & {
  url?: string;
  error?: string;
  details?: unknown;
};

const PINATA_GATEWAY = "https://gateway.pinata.cloud/ipfs";
const IPFS_FALLBACK_GATEWAY = "https://ipfs.io/ipfs";

export async function uploadEncryptedFile(file: File, signal?: AbortSignal): Promise<IpfsUploadResult> {
  const encryptedEnvelope = JSON.parse(await file.text());

  const response = await fetch("/api/ipfs/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(encryptedEnvelope),
    signal
  });

  const result = (await response.json()) as PinataUploadResponse;
  if (!response.ok) {
    throw new Error(result.error || "Encrypted IPFS upload failed.");
  }

  if (!result.cid) {
    throw new Error("IPFS upload response was incomplete.");
  }

  console.log("[obsidian] upload complete");
  return {
    cid: result.cid,
    ipfsUri: result.ipfsUri || `ipfs://${result.cid}`,
    gatewayUrl: result.gatewayUrl || result.url || ipfsToGatewayUrl(result.cid)
  };
}

export function ipfsToGatewayUrl(value: string) {
  const cid = value.startsWith("ipfs://") ? value.slice("ipfs://".length) : value;
  return `${PINATA_GATEWAY}/${cid.replace(/^\/+/, "")}`;
}

export function ipfsFallbackGatewayUrl(value: string) {
  const cid = value.startsWith("ipfs://") ? value.slice("ipfs://".length) : value;
  return `${IPFS_FALLBACK_GATEWAY}/${cid.replace(/^\/+/, "")}`;
}
