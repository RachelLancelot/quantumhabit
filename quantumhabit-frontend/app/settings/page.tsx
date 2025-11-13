"use client";

import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export default function SettingsPage() {
  const { accounts } = useMetaMask();
  const { chainId } = useMetaMaskEthersSigner();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-xl font-semibold">Account Information</h2>
          <div>
            <p className="text-sm text-neutral-600">Wallet Address</p>
            <p className="font-mono text-sm">{accounts?.[0] || "Not connected"}</p>
          </div>
          <div>
            <p className="text-sm text-neutral-600">Network</p>
            <p className="text-sm">{chainId ? `Chain ID: ${chainId}` : "Not connected"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

