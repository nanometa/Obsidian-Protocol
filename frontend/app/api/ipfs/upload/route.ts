import { NextRequest, NextResponse } from "next/server";
import * as dotenv from "dotenv";
import * as path from "path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const requestId = randomUUID();
  console.log(`[upload] ${requestId} started`);

  const jwt = getStorageJwt();

  if (!jwt) {
    return NextResponse.json({ error: "Storage API key not configured" }, { status: 500 });
  }

  const rateLimitResponse = checkRateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const sizeLimitResponse = checkRequestSize(req);
  if (sizeLimitResponse) return sizeLimitResponse;

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || !body.ciphertext || !body.iv) {
      console.warn(`[upload] ${requestId} invalid encrypted payload structure`);
      return NextResponse.json({ error: "Invalid encrypted payload structure" }, { status: 400 });
    }

    if (typeof body?.originalSize === "number" && body.originalSize > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Max 50MB." }, { status: 413 });
    }

    const pinataPayload = {
      pinataContent: body,
      pinataMetadata: {
        name: `obsidian-vault-${Date.now()}`
      }
    };

    const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(pinataPayload)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error(`[upload] ${requestId} storage upload failed`);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    console.log(`[upload] ${requestId} completed`);

    return NextResponse.json({
      cid: result.IpfsHash,
      url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`
    });
  } catch {
    console.error(`[upload] ${requestId} route failed`);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getStorageJwt() {
  if (!process.env.NFT_STORAGE_API_KEY) {
    dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
  }

  return process.env.NFT_STORAGE_API_KEY;
}

function checkRateLimit(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim();
  const now = Date.now();
  const limit = rateLimitMap.get(ip);

  if (limit && now < limit.resetAt) {
    if (limit.count >= MAX_REQUESTS) {
      return NextResponse.json({ error: "Rate limit exceeded. Try again later." }, { status: 429 });
    }

    limit.count += 1;
    return null;
  }

  rateLimitMap.set(ip, {
    count: 1,
    resetAt: now + WINDOW_MS
  });

  return null;
}

function checkRequestSize(req: NextRequest) {
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number.parseInt(contentLength, 10) > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "File too large. Max 50MB." }, { status: 413 });
  }

  return null;
}
