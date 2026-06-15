const functions = [
  {
    name: "createVault()",
    access: "Public",
    description: "Create a new vault with timer, IPFS hash, encrypted key Part A, encrypted key Part B, and beneficiaries."
  },
  {
    name: "heartbeat()",
    access: "Owner",
    description: "Reset the timer. Must be called before the deadline expires."
  },
  {
    name: "activateTrigger(address user)",
    access: "Public",
    description:
      "Anyone can call after deadline. Reveals encrypted key Part B through the public getter and trigger event."
  },
  {
    name: "getVault(address user)",
    access: "Public",
    description: "Read vault data. Key Part B returns an empty string until the vault is triggered."
  },
  {
    name: "getStatus(address user)",
    access: "Public",
    description: "Read the current lifecycle state: none, active, expired, or triggered."
  },
  {
    name: "nextDeadline(address user)",
    access: "Public",
    description: "Read the exact timestamp when the vault becomes triggerable."
  }
] as const;

const events = [
  "VaultCreated(address indexed user, string ipfsHash, uint256 timer)",
  "HeartbeatSent(address indexed user, uint256 nextDeadline)",
  "TriggerActivated(address indexed user, string ipfsHash, string encryptedKeyPartA, string encryptedKeyPartB)"
] as const;

export function ContractReference() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-typeui-primary">ObsidianVault.sol</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-typeui-cream">
          The contract is an immutable registry for encrypted vault metadata and heartbeat state. It never stores
          plaintext documents.
        </p>
      </div>

      <div className="overflow-x-auto border border-typeui-primary/35">
        <table className="min-w-[44rem] w-full border-collapse text-left text-sm">
          <thead className="bg-typeui-secondary text-typeui-cream">
            <tr>
              <th className="border-b border-typeui-primary/35 px-4 py-3 font-bold uppercase">Function</th>
              <th className="border-b border-typeui-primary/35 px-4 py-3 font-bold uppercase">Access</th>
              <th className="border-b border-typeui-primary/35 px-4 py-3 font-bold uppercase">Description</th>
            </tr>
          </thead>
          <tbody>
            {functions.map((item) => (
              <tr key={item.name} className="border-b border-typeui-primary/20 last:border-b-0">
                <td className="px-4 py-3 font-mono text-xs text-typeui-primary">{item.name}</td>
                <td className="px-4 py-3 font-bold uppercase text-typeui-warning">{item.access}</td>
                <td className="px-4 py-3 leading-6 text-typeui-cream">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border border-typeui-primary/35 bg-typeui-secondary/30 p-4">
        <h4 className="text-sm font-bold uppercase text-typeui-primary">Events</h4>
        <ul className="mt-3 space-y-2 font-mono text-xs leading-5 text-typeui-cream">
          {events.map((event) => (
            <li key={event}>{event}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
