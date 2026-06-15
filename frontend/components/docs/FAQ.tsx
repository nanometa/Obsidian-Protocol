const faqs = [
  {
    question: "Can Obsidian Protocol be shut down?",
    answer:
      "No. The smart contract is deployed and immutable on Arc blockchain. There is no off switch. The developers cannot modify or stop it."
  },
  {
    question: "What happens if IPFS loses my file?",
    answer:
      "The blockchain stores the proof hash forever, but the file itself needs to stay pinned on IPFS. Obsidian uses Pinata for reliable pinning."
  },
  {
    question: "What if I lose my wallet?",
    answer:
      "Your vault will eventually trigger and release the documents. Keep your seed phrase safe. Without it, you cannot send heartbeats."
  },
  {
    question: "Is this legal?",
    answer:
      "Obsidian Protocol is a neutral tool. Using it to publish documents is subject to the laws of your jurisdiction. We do not provide legal advice."
  },
  {
    question: "Can someone stop the trigger?",
    answer:
      "Only the vault owner can reset the timer by sending a heartbeat. Once the deadline passes, anyone can call activateTrigger() and nothing can stop the publication."
  }
] as const;

export function FAQ() {
  return (
    <div className="grid gap-3">
      {faqs.map((faq) => (
        <article key={faq.question} className="border border-typeui-primary/35 bg-typeui-secondary/30 p-4">
          <h3 className="text-sm font-bold uppercase text-typeui-primary">{faq.question}</h3>
          <p className="mt-3 text-sm leading-6 text-typeui-cream">{faq.answer}</p>
        </article>
      ))}
    </div>
  );
}
