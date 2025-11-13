"use client";

import { useEffect, useState } from "react";
import { useMetaMaskEthersSigner } from "./metamask/useMetaMaskEthersSigner";
import { getQuantumHabitByChainId, createQuantumHabitContract } from "@/lib/contract";

export interface Habit {
  id: number;
  owner: string;
  name: string;
  description: string;
  targetDays: number;
  habitType: number;
  createdAt: bigint;
  isActive: boolean;
}

export function useHabitList() {
  const { ethersReadonlyProvider, chainId, accounts } = useMetaMaskEthersSigner();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | undefined>(undefined);

  useEffect(() => {
    if (!ethersReadonlyProvider || !chainId || !accounts || accounts.length === 0) {
      setHabits([]);
      setLoading(false);
      return;
    }

    const fetchHabits = async () => {
      try {
        setLoading(true);
        setError(undefined);

        const contractInfo = getQuantumHabitByChainId(chainId);
        if (!contractInfo.address) {
          setHabits([]);
          setLoading(false);
          return;
        }

        const contract = createQuantumHabitContract(
          contractInfo.address,
          contractInfo.abi,
          ethersReadonlyProvider
        );

        // Get user's habit IDs
        const habitIds = await contract.getUserHabits(accounts[0]);

        // Fetch each habit's details
        const habitPromises = habitIds.map(async (id: bigint) => {
          const habit = await contract.getHabit(id);
          return {
            id: Number(id),
            owner: habit.owner,
            name: habit.name,
            description: habit.description,
            targetDays: Number(habit.targetDays),
            habitType: Number(habit.habitType),
            createdAt: habit.createdAt,
            isActive: habit.isActive,
          } as Habit;
        });

        const fetchedHabits = await Promise.all(habitPromises);
        setHabits(fetchedHabits.filter((h) => h.isActive));
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setHabits([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHabits();
  }, [ethersReadonlyProvider, chainId, accounts]);

  return { habits, loading, error, refetch: () => {
    // Trigger refetch by updating a dependency
    setLoading(true);
  } };
}

