"use client";

import { useMetaMask } from "@/hooks/metamask/useMetaMaskProvider";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export function WalletButton() {
  const { isConnected, accounts, connect, error } = useMetaMask();
  const { chainId } = useMetaMaskEthersSigner();

  if (isConnected && accounts && accounts.length > 0) {
    const shortAddress = `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`;
    return (
      <div className="flex items-center space-x-3">
        {chainId && (
          <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium border border-blue-200">
            Chain {chainId}
          </div>
        )}
        <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium shadow-md">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>{shortAddress}</span>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={connect}
      className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
    >
      Connect Wallet
    </button>
  );
}
