import { ethers } from "ethers";
import { QuantumHabitABI } from "@/abi/QuantumHabitABI";
import { QuantumHabitAddresses } from "@/abi/QuantumHabitAddresses";

export function getQuantumHabitByChainId(
  chainId: number | undefined
): {
  abi: typeof QuantumHabitABI.abi;
  address?: `0x${string}`;
  chainId?: number;
  chainName?: string;
} {
  if (!chainId) {
    return { abi: QuantumHabitABI.abi };
  }

  const entry =
    QuantumHabitAddresses[
      chainId.toString() as keyof typeof QuantumHabitAddresses
    ];

  // Check if entry exists and has a valid address
  if (!entry || !entry.address || entry.address === ethers.ZeroAddress) {
    return { abi: QuantumHabitABI.abi, chainId };
  }

  return {
    address: entry?.address as `0x${string}` | undefined,
    chainId: entry?.chainId ?? chainId,
    chainName: entry?.chainName,
    abi: QuantumHabitABI.abi,
  };
}

export function createQuantumHabitContract(
  address: `0x${string}`,
  abi: typeof QuantumHabitABI.abi,
  runner: ethers.ContractRunner
) {
  return new ethers.Contract(address, abi, runner);
}

