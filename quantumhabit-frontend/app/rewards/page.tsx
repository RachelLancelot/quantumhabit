"use client";

import { useEffect, useState } from "react";
import { useQuantumHabit } from "@/hooks/useQuantumHabit";
import { useHabitList } from "@/hooks/useHabitList";
import { ethers } from "ethers";
import { getQuantumHabitByChainId, createQuantumHabitContract } from "@/lib/contract";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useFhevm } from "@/fhevm/useFhevm";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";

interface AvailableReward {
  habitId: number;
  rewardType: number; // 0: Milestone, 1: Consecutive
  milestonePercent?: number;
  consecutiveDays?: number;
  rewardAmount: number;
  eligible: boolean;
}

interface ClaimedReward {
  id: number;
  habitId: number;
  rewardType: number;
  milestonePercent?: number;
  consecutiveDays?: number;
  rewardAmount: number;
  claimedAt: number;
}

export default function RewardsPage() {
  const { habits, loading: habitsLoading } = useHabitList();
  const { contractAddress, contractWithSigner, contractInfo, isReady, isDeployed, ethersSigner, getHabitStats, fhevmInstance } = useQuantumHabit();
  const { ethersReadonlyProvider, chainId, accounts, provider } = useMetaMaskEthersSigner();
  const { storage } = useInMemoryStorage();
  const [availableRewards, setAvailableRewards] = useState<AvailableReward[]>([]);
  const [claimedRewards, setClaimedRewards] = useState<ClaimedReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<{ habitId: number; rewardType: number } | null>(null);

  useEffect(() => {
    console.log("[RewardsPage] useEffect triggered");
    const conditions = {
      isReady,
      isDeployed,
      habitsLoading,
      hasEthersReadonlyProvider: !!ethersReadonlyProvider,
      chainId,
      accountsLength: accounts?.length || 0,
      hasContractWithSigner: !!contractWithSigner,
      hasFhevmInstance: !!fhevmInstance,
      hasEthersSigner: !!ethersSigner,
      habitsCount: habits.length,
    };
    console.log("[RewardsPage] Conditions check:", conditions);
    
    // Check which specific conditions are missing
    const missingConditions = [];
    if (!isReady) missingConditions.push("isReady");
    if (!isDeployed) missingConditions.push("isDeployed");
    if (habitsLoading) missingConditions.push("habitsLoading");
    if (!ethersReadonlyProvider) missingConditions.push("ethersReadonlyProvider");
    if (!chainId) missingConditions.push("chainId");
    if (!accounts || accounts.length === 0) missingConditions.push("accounts");
    if (!contractWithSigner) missingConditions.push("contractWithSigner");
    if (!fhevmInstance) missingConditions.push("fhevmInstance");
    if (!ethersSigner) missingConditions.push("ethersSigner");
    
    if (missingConditions.length > 0) {
      console.log("[RewardsPage] Missing conditions:", missingConditions);
      setLoading(habitsLoading || !isReady);
      return;
    }
    
    console.log("[RewardsPage] All conditions met, starting reward check");

    const fetchRewards = async () => {
      setLoading(true);
      setError(null);

      try {
        if (!contractWithSigner || !accounts || accounts.length === 0) {
          throw new Error("Contract or wallet not ready");
        }
        
        // Get claimed rewards from contract
        const userRewards = await contractWithSigner.getUserRewards(accounts[0]);
        const claimed: ClaimedReward[] = userRewards
          .filter((r: any) => r.claimed)
          .map((reward: any) => ({
            id: Number(reward.id),
            habitId: Number(reward.habitId),
            rewardType: Number(reward.rewardType),
            milestonePercent: reward.milestonePercent ? Number(reward.milestonePercent) : undefined,
            consecutiveDays: reward.consecutiveDays ? Number(reward.consecutiveDays) : undefined,
            rewardAmount: 0, // Already claimed, amount doesn't matter
            claimedAt: Number(reward.claimedAt),
          }));
        setClaimedRewards(claimed);

        // Check available rewards for each habit
        // Optimize: load decryption signature once and reuse for all decryptions
        if (!fhevmInstance || !contractInfo.address || !ethersSigner) {
          throw new Error("FHEVM instance or contract not ready");
        }

        const sig = await FhevmDecryptionSignature.loadOrSign(
          fhevmInstance,
          [contractInfo.address as `0x${string}`],
          ethersSigner,
          storage
        );

        if (!sig) {
          throw new Error("Failed to load decryption signature");
        }

        console.log(`Loaded decryption signature, checking rewards for ${habits.length} habits...`);
        
        const available: AvailableReward[] = [];
        
        // Collect all reward checks to perform
        interface RewardCheck {
          habitId: number;
          habitName: string;
          type: 'milestone' | 'consecutive';
          value: number;
        }

        const rewardChecks: RewardCheck[] = [];
        
        // Optimization: Instead of calling getHabitStats for each habit (N transactions),
        // we'll check ALL possible milestones and consecutives directly.
        // The contract will return 0 for ineligible rewards.
        
        // Filter out already claimed rewards upfront
        const claimedRewardKeys = new Set(
          claimedRewards.map(r => 
            `${r.habitId}-${r.rewardType}-${r.rewardType === 0 ? r.milestonePercent : r.consecutiveDays}`
          )
        );
        
        console.log(`[Reward Check] Checking all possible rewards for ${habits.length} habits (optimized)`);
        
        // For each habit, check all standard milestones and consecutive targets
        // The contract will filter out ineligible ones
        const allMilestones = [25, 50, 75, 100];
        const allConsecutives = [7, 14, 30, 60];
        
        for (const habit of habits) {
          console.log(`[Reward Check] Habit ${habit.id} (${habit.name})`);
          
          // Check all unclaimed milestones
          const unclaimedMilestones = allMilestones.filter(m => {
            const rewardKey = `${habit.id}-0-${m}`;
            return !claimedRewardKeys.has(rewardKey);
          });
          
          if (unclaimedMilestones.length > 0) {
            console.log(`  - Will check milestones: ${unclaimedMilestones.join(', ')}%`);
            for (const milestone of unclaimedMilestones) {
              rewardChecks.push({
                habitId: habit.id,
                habitName: habit.name,
                type: 'milestone',
                value: milestone,
              });
            }
          }

          // Check all unclaimed consecutive targets
          const unclaimedConsecutives = allConsecutives.filter(c => {
            const rewardKey = `${habit.id}-1-${c}`;
            return !claimedRewardKeys.has(rewardKey);
          });
          
          if (unclaimedConsecutives.length > 0) {
            console.log(`  - Will check consecutive: ${unclaimedConsecutives.join(', ')} days`);
            for (const consecutive of unclaimedConsecutives) {
              rewardChecks.push({
                habitId: habit.id,
                habitName: habit.name,
                type: 'consecutive',
                value: consecutive,
              });
            }
          }
        }

        console.log(`Found ${rewardChecks.length} reward checks to perform`);
        
        // Group reward checks by habit for batch processing
        interface HabitRewardChecks {
          habitId: number;
          milestones: number[];
          consecutives: number[];
        }
        
        const habitRewardMap = new Map<number, HabitRewardChecks>();
        
        for (const check of rewardChecks) {
          if (!habitRewardMap.has(check.habitId)) {
            habitRewardMap.set(check.habitId, {
              habitId: check.habitId,
              milestones: [],
              consecutives: [],
            });
          }
          
          const habitChecks = habitRewardMap.get(check.habitId)!;
          if (check.type === 'milestone') {
            habitChecks.milestones.push(check.value);
          } else {
            habitChecks.consecutives.push(check.value);
          }
        }
        
        console.log(`Grouped into ${habitRewardMap.size} habit batch checks`);
        
        // Second pass: batch check rewards for each habit
        const handlesToDecrypt: Array<{ handle: string; habitId: number; type: 'milestone' | 'consecutive'; value: number }> = [];
        
        for (const [habitId, checks] of habitRewardMap.entries()) {
          try {
            console.log(`Batch checking habit ${habitId}: ${checks.milestones.length} milestones, ${checks.consecutives.length} consecutives`);
            
            // Convert arrays to the format expected by the contract
            const milestonePercents = checks.milestones.map(m => m as number);
            const consecutiveTargets = checks.consecutives.map(c => c as number);
            
            // Call batch function
            const tx = await contractWithSigner.checkMultipleRewards(
              habitId,
              milestonePercents,
              consecutiveTargets
            );
            await tx.wait();
            console.log(`  Batch authorization transaction confirmed`);
            
            // Get results
            const result = await contractWithSigner.checkMultipleRewards.staticCall(
              habitId,
              milestonePercents,
              consecutiveTargets
            );
            
            // Collect milestone handles
            for (let i = 0; i < result.milestoneRewards.length; i++) {
              handlesToDecrypt.push({
                handle: result.milestoneRewards[i],
                habitId: habitId,
                type: 'milestone',
                value: milestonePercents[i],
              });
            }
            
            // Collect consecutive handles
            for (let i = 0; i < result.consecutiveRewards.length; i++) {
              handlesToDecrypt.push({
                handle: result.consecutiveRewards[i],
                habitId: habitId,
                type: 'consecutive',
                value: consecutiveTargets[i],
              });
            }
          } catch (err) {
            console.error(`Failed to batch check rewards for habit ${habitId}:`, err);
          }
        }

        console.log(`Collected ${handlesToDecrypt.length} handles for batch decryption`);
        
        // Batch decrypt all handles at once
        if (handlesToDecrypt.length > 0 && contractInfo.address) {
          try {
            const handleObjects = handlesToDecrypt.map(h => ({
              handle: h.handle,
              contractAddress: contractInfo.address as `0x${string}`,
            }));
            
            const decrypted = await fhevmInstance.userDecrypt(
              handleObjects,
              sig.privateKey,
              sig.publicKey,
              sig.signature,
              sig.contractAddresses,
              sig.userAddress,
              sig.startTimestamp,
              sig.durationDays
            );
            
            // Process decrypted results
            // Note: Already filtered out claimed rewards before collecting checks
            console.log(`[Reward Decryption] Processing ${handlesToDecrypt.length} decrypted rewards:`);
            for (let i = 0; i < handlesToDecrypt.length; i++) {
              const check = handlesToDecrypt[i];
              const rewardAmount = Number((decrypted as any)[check.handle]);
              
              console.log(`  - Habit ${check.habitId}, ${check.type} ${check.value}: ${rewardAmount} points`);
              
              if (rewardAmount > 0) {
                if (check.type === 'milestone') {
                  available.push({
                    habitId: check.habitId,
                    rewardType: 0,
                    milestonePercent: check.value,
                    rewardAmount,
                    eligible: true,
                  });
                  console.log(`    ✓ Added milestone ${check.value}% reward`);
                } else {
                  available.push({
                    habitId: check.habitId,
                    rewardType: 1,
                    consecutiveDays: check.value,
                    rewardAmount,
                    eligible: true,
                  });
                  console.log(`    ✓ Added consecutive ${check.value} days reward`);
                }
              } else {
                console.log(`    ✗ Reward amount is 0, not eligible`);
              }
            }
          } catch (decryptErr) {
            console.error(`Failed to batch decrypt rewards:`, decryptErr);
          }
        }

        setAvailableRewards(available);
        console.log(`Found ${available.length} available rewards`);
      } catch (err) {
        console.error("Failed to fetch rewards:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch rewards");
      } finally {
        setLoading(false);
      }
    };

    fetchRewards();
  }, [habits, isReady, isDeployed, habitsLoading, ethersReadonlyProvider, chainId, accounts, contractAddress, contractWithSigner, fhevmInstance, ethersSigner, contractInfo, storage, getHabitStats]);

  const handleClaimReward = async (habitId: number, rewardType: number, milestoneOrConsecutiveValue: number) => {
    if (!contractWithSigner) {
      alert("Contract not ready");
      return;
    }

    setClaiming({ habitId, rewardType });
    try {
      // claimReward now requires milestone/consecutive value to prevent duplicate claims
      const tx = await contractWithSigner.claimReward(habitId, rewardType, milestoneOrConsecutiveValue);
      await tx.wait();
      alert("Reward claimed successfully!");
      // Refresh rewards
      window.location.reload();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes("Reward already claimed")) {
        alert("This reward has already been claimed.");
      } else {
        alert(`Failed to claim reward: ${errorMessage}`);
      }
    } finally {
      setClaiming(null);
    }
  };

  const getHabitName = (habitId: number) => {
    const habit = habits.find(h => h.id === habitId);
    return habit?.name || `Habit #${habitId}`;
  };

  if (!isDeployed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Rewards
          </h1>
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-xl">
            Contract not deployed on this network. Please deploy the contract first.
          </div>
        </div>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Rewards
          </h1>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-neutral-600">Initializing...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Rewards
          </h1>
          <p className="text-neutral-600">Earn rewards for your achievements and milestones</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-neutral-600">Loading rewards...</p>
          </div>
        ) : (
          <>
            {/* Available Rewards */}
            {availableRewards.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Available Rewards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableRewards.map((reward, index) => {
                    const isClaiming = claiming?.habitId === reward.habitId && claiming?.rewardType === reward.rewardType;
                    return (
                      <div key={`${reward.habitId}-${reward.rewardType}-${index}`} className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-200 hover:border-blue-400 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              reward.rewardType === 0 ? "bg-blue-100" : "bg-purple-100"
                            }`}>
                              <svg className={`w-6 h-6 ${reward.rewardType === 0 ? "text-blue-600" : "text-purple-600"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-900">
                                {reward.rewardType === 0 ? "Milestone Reward" : "Consecutive Reward"}
                              </h3>
                              <p className="text-sm text-neutral-600">{getHabitName(reward.habitId)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mb-4 space-y-2">
                          {reward.rewardType === 0 && reward.milestonePercent && (
                            <div className="flex items-center space-x-2 text-sm">
                              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="text-neutral-600">Milestone: {reward.milestonePercent}% completion</span>
                            </div>
                          )}
                          {reward.rewardType === 1 && reward.consecutiveDays && (
                            <div className="flex items-center space-x-2 text-sm">
                              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              <span className="text-neutral-600">Streak: {reward.consecutiveDays} consecutive days</span>
                            </div>
                          )}
                          <div className="pt-2 border-t border-neutral-200">
                            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                              {reward.rewardAmount} points
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleClaimReward(
                            reward.habitId, 
                            reward.rewardType,
                            reward.rewardType === 0 ? reward.milestonePercent! : reward.consecutiveDays!
                          )}
                          disabled={isClaiming}
                          className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                        >
                          {isClaiming ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              <span>Claiming...</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              <span>Claim Reward</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Claimed Rewards */}
            {claimedRewards.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Claimed Rewards</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {claimedRewards.map((reward) => (
                    <div key={reward.id} className="bg-white rounded-2xl shadow-md p-6 border border-neutral-200 opacity-75">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            reward.rewardType === 0 ? "bg-blue-50" : "bg-purple-50"
                          }`}>
                            <svg className={`w-6 h-6 ${reward.rewardType === 0 ? "text-blue-400" : "text-purple-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-neutral-900">
                              {reward.rewardType === 0 ? "Milestone Reward" : "Consecutive Reward"}
                            </h3>
                            <p className="text-sm text-neutral-600">{getHabitName(reward.habitId)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-4 space-y-2">
                        {reward.rewardType === 0 && reward.milestonePercent && (
                          <p className="text-sm text-neutral-600">
                            Milestone: {reward.milestonePercent}% completion
                          </p>
                        )}
                        {reward.rewardType === 1 && reward.consecutiveDays && (
                          <p className="text-sm text-neutral-600">
                            Streak: {reward.consecutiveDays} consecutive days
                          </p>
                        )}
                        <p className="text-sm text-neutral-500">
                          Claimed {new Date(reward.claimedAt * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="mt-2">
                        <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium">
                          ✓ Claimed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Rewards */}
            {availableRewards.length === 0 && claimedRewards.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-neutral-100">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-neutral-900 mb-3">No rewards available yet</h3>
                <p className="text-neutral-600 mb-4">
                  Keep completing your habits to earn rewards!
                </p>
                <p className="text-sm text-neutral-500">
                  Complete milestones (25%, 50%, 75%, 100%) or build streaks (7, 14, 30, 60 days) to unlock rewards.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
