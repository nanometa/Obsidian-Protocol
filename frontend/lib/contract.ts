export const TIMER_OPTIONS = [
  { label: "7D", seconds: 7 * 24 * 60 * 60 },
  { label: "14D", seconds: 14 * 24 * 60 * 60 },
  { label: "30D", seconds: 30 * 24 * 60 * 60 }
] as const;

export const STATUS_LABELS = {
  0: "NONE",
  1: "ACTIVE",
  2: "EXPIRED",
  3: "TRIGGERED"
} as const;

export type VaultStatusCode = keyof typeof STATUS_LABELS;
export type VaultStatusLabel = (typeof STATUS_LABELS)[VaultStatusCode];

export const OBSIDIAN_VAULT_ABI = [
  {
    type: "function",
    name: "createVault",
    stateMutability: "nonpayable",
    inputs: [
      { name: "ipfsHash", type: "string" },
      { name: "encryptedKeyPartA", type: "string" },
      { name: "encryptedKeyPartB", type: "string" },
      { name: "timerDuration", type: "uint256" },
      { name: "beneficiaries", type: "address[]" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "heartbeat",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: []
  },
  {
    type: "function",
    name: "activateTrigger",
    stateMutability: "nonpayable",
    inputs: [{ name: "user", type: "address" }],
    outputs: []
  },
  {
    type: "function",
    name: "getVault",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [
      { name: "exists", type: "bool" },
      { name: "owner", type: "address" },
      { name: "ipfsHash", type: "string" },
      { name: "encryptedKeyPartA", type: "string" },
      { name: "encryptedKeyPartB", type: "string" },
      { name: "timerDuration", type: "uint256" },
      { name: "createdAt", type: "uint256" },
      { name: "lastHeartbeat", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "triggered", type: "bool" },
      { name: "triggeredAt", type: "uint256" },
      { name: "beneficiaries", type: "address[]" }
    ]
  },
  {
    type: "function",
    name: "getStatus",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint8" }]
  },
  {
    type: "function",
    name: "nextDeadline",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "hasVault",
    stateMutability: "view",
    inputs: [{ name: "user", type: "address" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "event",
    name: "VaultCreated",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "ipfsHash", type: "string", indexed: false },
      { name: "timer", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "HeartbeatSent",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "nextDeadline", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "TriggerActivated",
    inputs: [
      { name: "user", type: "address", indexed: true },
      { name: "ipfsHash", type: "string", indexed: false },
      { name: "encryptedKeyPartA", type: "string", indexed: false },
      { name: "encryptedKeyPartB", type: "string", indexed: false }
    ],
    anonymous: false
  }
] as const;
