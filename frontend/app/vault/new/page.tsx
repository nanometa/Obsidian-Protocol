"use client";

import dynamic from "next/dynamic";

const CreateVaultClient = dynamic(
  () => import("@/components/CreateVaultClient").then((mod) => mod.CreateVaultClient),
  {
    loading: () => (
      <main className="mx-auto min-h-screen w-full max-w-6xl bg-typeui-base px-4 py-6 text-typeui-text sm:px-6 lg:px-8">
        <div className="terminal-border p-5 text-sm font-bold uppercase text-typeui-secondary">LOADING VAULT INITIALIZER...</div>
      </main>
    ),
    ssr: false
  }
);

export default function NewVaultPage() {
  return <CreateVaultClient />;
}
