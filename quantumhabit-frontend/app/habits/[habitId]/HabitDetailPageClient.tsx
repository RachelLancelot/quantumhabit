"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useQuantumHabit } from "@/hooks/useQuantumHabit";
import { ethers } from "ethers";
import { getQuantumHabitByChainId, createQuantumHabitContract } from "@/lib/contract";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";

export function HabitDetailPageClient() {
  const params = useParams();
  const habitId = Number(params.habitId);
  const { contractAddress, recordCompletion, isDeployed } = useQuantumHabit();
  const { ethersReadonlyProvider, chainId, accounts } = useMetaMaskEthersSigner();
  const [habit, setHabit] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ethersReadonlyProvider || !chainId || !contractAddress) {
      setLoading(false);
      return;
    }

    const fetchHabit = async () => {
      try {
        const contractInfo = getQuantumHabitByChainId(chainId);
        if (!contractInfo.address) return;

        const contract = createQuantumHabitContract(
          contractInfo.address,
          contractInfo.abi,
          ethersReadonlyProvider
        );

        const habitData = await contract.getHabit(habitId);
        setHabit({
          id: habitId,
          name: habitData.name,
          description: habitData.description,
          targetDays: Number(habitData.targetDays),
          habitType: Number(habitData.habitType),
          isActive: habitData.isActive,
        });
      } catch (err) {
        console.error("Failed to fetch habit:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHabit();
  }, [ethersReadonlyProvider, chainId, contractAddress, habitId]);

  const handleMarkComplete = async () => {
    try {
      await recordCompletion(habitId, 1);
      alert("Completion recorded!");
    } catch (err) {
      alert(`Failed to record completion: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-neutral-600">Loading habit details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!habit) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-neutral-100">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-3">Habit not found</h3>
            <p className="text-neutral-600">The habit you're looking for doesn't exist.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {habit.name}
          </h1>
          <p className="text-lg text-neutral-600">{habit.description || "No description"}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-neutral-100">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Habit Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-xl">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Target Days</p>
                <p className="text-lg font-semibold text-neutral-900">{habit.targetDays} days</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-neutral-600">Habit Type</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {habit.habitType === 0 ? "Daily" : habit.habitType === 1 ? "Weekly" : "Custom"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-100">
          <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Actions</h2>
          <button
            onClick={handleMarkComplete}
            disabled={!isDeployed}
            className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Mark Complete (Today)</span>
          </button>
        </div>
      </div>
    </div>
  );
}

