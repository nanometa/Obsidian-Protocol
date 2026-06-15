import * as dotenv from "dotenv";

dotenv.config();

async function testPinata() {
  const jwt = process.env.NFT_STORAGE_API_KEY;
  console.log("JWT present:", !!jwt);
  console.log("JWT starts with eyJ:", jwt?.startsWith("eyJ"));

  const testPayload = {
    pinataContent: {
      test: true,
      timestamp: Date.now(),
      project: "obsidian-protocol"
    },
    pinataMetadata: {
      name: "obsidian-test"
    }
  };

  const response = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(testPayload)
  });

  const result = await response.json();
  console.log("Status:", response.status);
  console.log("Result:", JSON.stringify(result, null, 2));

  if (response.ok) {
    console.log("✓ Pinata upload working");
    console.log("IPFS CID:", result.IpfsHash);
    console.log("View at: https://gateway.pinata.cloud/ipfs/" + result.IpfsHash);
  } else {
    console.log("✗ Pinata upload failed");
  }
}

testPinata().catch(console.error);
