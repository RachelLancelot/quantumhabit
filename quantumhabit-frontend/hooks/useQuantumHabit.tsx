"use client";

import { useCallback, useMemo, useRef } from "react";
import { ethers } from "ethers";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { getQuantumHabitByChainId, createQuantumHabitContract } from "@/lib/contract";
import { useInMemoryStorage } from "./useInMemoryStorage";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

export interface CreateHabitData {
  name: string;
  description: string;
  targetDays: number;
  habitType: number; // 0: Daily, 1: Weekly, 2: Custom
  completionStandard: number; // 0-100, optional
}

export function useQuantumHabit() {
  const {
    ethersSigner,
    ethersReadonlyProvider,
    chainId,
    sameChain,
    sameSigner,
    provider, // EIP-1193 provider from MetaMask
  } = useMetaMaskEthersSigner();
  // Memoize mockChains to prevent unnecessary re-renders
  const mockChains = useMemo(() => ({ 31337: "http://localhost:8545" }), []);
  
  const { instance: fhevmInstance, status: fhevmStatus, error: fhevmError } = useFhevm({
    provider: provider, // Use the EIP-1193 provider directly, not ethersSigner?.provider
    mockChains: mockChains,
  });
  const { storage } = useInMemoryStorage();

  const contractInfo = useMemo(() => {
    return getQuantumHabitByChainId(chainId);
  }, [chainId]);

  const contract = useMemo(() => {
    if (!contractInfo.address || !ethersReadonlyProvider) {
      return undefined;
    }
    return createQuantumHabitContract(
      contractInfo.address,
      contractInfo.abi,
      ethersReadonlyProvider
    );
  }, [contractInfo, ethersReadonlyProvider]);

  const contractWithSigner = useMemo(() => {
    if (!contractInfo.address || !ethersSigner) {
      return undefined;
    }
    return createQuantumHabitContract(
      contractInfo.address,
      contractInfo.abi,
      ethersSigner
    );
  }, [contractInfo, ethersSigner]);

  const createHabit = useCallback(
    async (habitData: CreateHabitData) => {
      // Detailed error messages
      if (!ethersSigner) {
        throw new Error("Wallet not connected. Please connect your wallet first.");
      }
      if (!contractInfo.address) {
        throw new Error(`Contract not deployed on chain ${chainId}. Please deploy the contract first.`);
      }
      if (!contractWithSigner) {
        throw new Error("Contract instance not ready. Please try again.");
      }
      if (!fhevmInstance) {
        if (fhevmError) {
          throw new Error(`FHEVM initialization failed: ${fhevmError.message}`);
        }
        throw new Error(`FHEVM instance not ready. Status: ${fhevmStatus || "initializing"}. Please wait for initialization to complete.`);
      }

      // Encrypt completion standard
      const input = fhevmInstance.createEncryptedInput(
        contractInfo.address,
        ethersSigner!.address
      );
      input.add8(habitData.completionStandard);
      const encrypted = await input.encrypt();

      // Call contract
      const tx = await contractWithSigner.createHabit(
        habitData.name,
        habitData.description,
        habitData.targetDays,
        habitData.habitType,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await tx.wait();
      return tx.hash;
    },
    [contractWithSigner, fhevmInstance, contractInfo.address, ethersSigner, chainId, fhevmError, fhevmStatus]
  );

  const recordCompletion = useCallback(
    async (habitId: number, status: number, date?: number) => {
      if (!contractWithSigner || !fhevmInstance || !contractInfo.address) {
        throw new Error("Contract or FHEVM instance not ready");
      }

      const targetDate =
        date || Math.floor(Date.now() / 86400000) * 86400000; // Round to day

      // Encrypt completion status
      const input = fhevmInstance.createEncryptedInput(
        contractInfo.address,
        ethersSigner!.address
      );
      input.add8(status);
      const encrypted = await input.encrypt();

      // Call contract
      const tx = await contractWithSigner.recordCompletion(
        habitId,
        targetDate,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await tx.wait();
      return tx.hash;
    },
    [contractWithSigner, fhevmInstance, contractInfo.address, ethersSigner]
  );

  const getHabitStats = useCallback(
    async (habitId: number) => {
      if (!contractWithSigner || !fhevmInstance || !contractInfo.address || !ethersSigner) {
        throw new Error("Contract or FHEVM instance not ready");
      }

      // getHabitStats is not view, but we can use staticCall to get the result without sending a transaction
      // Then we need to send a transaction to authorize decryption
      const stats = await contractWithSigner.getHabitStats.staticCall(habitId);
      
      // Send a transaction to authorize decryption (this will execute FHE.allow calls)
      const tx = await contractWithSigner.getHabitStats(habitId);
      await tx.wait();

      // Load or create decryption signature
      const sig: FhevmDecryptionSignature | null =
        await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [contractInfo.address as `0x${string}`],
          ethersSigner,
          storage
        );

      if (!sig) {
        throw new Error("Unable to build FHEVM decryption signature");
      }

      // Decrypt stats
      const decrypted = {
        completedDays: (await fhevmInstance.userDecrypt(
          [{ handle: stats.completedDays, contractAddress: contractInfo.address }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        ))[stats.completedDays],
        consecutiveDays: (await fhevmInstance.userDecrypt(
          [{ handle: stats.consecutiveDays, contractAddress: contractInfo.address }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        ))[stats.consecutiveDays],
        completionRate: (await fhevmInstance.userDecrypt(
          [{ handle: stats.completionRate, contractAddress: contractInfo.address }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        ))[stats.completionRate],
        completionPercentage: (await fhevmInstance.userDecrypt(
          [{ handle: stats.completionPercentage, contractAddress: contractInfo.address }],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        ))[stats.completionPercentage],
      };

      return decrypted;
    },
    [contract, fhevmInstance, contractInfo.address, ethersSigner, storage]
  );

  const isReady = Boolean(
    contractWithSigner &&
    fhevmInstance &&
    contractInfo.address &&
    ethersSigner
  );

  // Detailed diagnostic info
  const diagnostics = {
    hasWallet: Boolean(ethersSigner),
    hasContract: Boolean(contractInfo.address),
    hasFhevm: Boolean(fhevmInstance),
    hasContractInstance: Boolean(contractWithSigner),
  };

  // Log diagnostics when not ready (for debugging)
  if (!isReady) {
    console.log("[useQuantumHabit] Not ready. Diagnostics:", diagnostics);
  }

  return {
    contract,
    contractWithSigner,
    contractAddress: contractInfo.address,
    contractInfo,
    isDeployed: Boolean(contractInfo.address),
    isReady,
    fhevmStatus,
    fhevmError,
    fhevmInstance,
    ethersSigner,
    diagnostics,
    createHabit,
    recordCompletion,
    getHabitStats,
  };
}
