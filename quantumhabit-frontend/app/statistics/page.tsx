"use client";

import { useEffect, useState } from "react";
import { useQuantumHabit } from "@/hooks/useQuantumHabit";
import { useHabitList } from "@/hooks/useHabitList";

interface HabitStatsData {
  habitId: number;
  name: string;
  completedDays: number;
  consecutiveDays: number;
  completionRate: number;
  completionPercentage: number;
}

export default function StatisticsPage() {
  const { habits, loading: habitsLoading } = useHabitList();
  const { getHabitStats, isReady, isDeployed } = useQuantumHabit();
  const [stats, setStats] = useState<HabitStatsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !isDeployed || habitsLoading) {
      setLoading(habitsLoading);
      return;
    }

    if (habits.length === 0) {
      setStats([]);
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      const statsData: HabitStatsData[] = [];

      for (const habit of habits) {
        try {
          const statsResult = await getHabitStats(habit.id);
          statsData.push({
            habitId: habit.id,
            name: habit.name,
            completedDays: Number(statsResult.completedDays),
            consecutiveDays: Number(statsResult.consecutiveDays),
            completionRate: Number(statsResult.completionRate),
            completionPercentage: Number(statsResult.completionPercentage),
          });
        } catch (err) {
          console.error(`Failed to fetch stats for habit ${habit.id}:`, err);
          // Continue with other habits even if one fails
        }
      }

      setStats(statsData);
      setLoading(false);
    };

    fetchStats();
  }, [habits, isReady, isDeployed, habitsLoading, getHabitStats]);

  // Calculate aggregate statistics
  const totalHabits = stats.length;
  const totalCompletedDays = stats.reduce((sum, s) => sum + s.completedDays, 0);
  const avgCompletionRate = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.completionRate, 0) / stats.length)
    : 0;
  const maxConsecutiveDays = stats.length > 0
    ? Math.max(...stats.map(s => s.consecutiveDays))
    : 0;

  if (!isDeployed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Statistics
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
            Statistics
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
            Statistics
          </h1>
          <p className="text-neutral-600">View your encrypted progress and achievements</p>
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
            <p className="text-neutral-600">Loading statistics...</p>
          </div>
        ) : stats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-neutral-100">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-3">No statistics yet</h3>
            <p className="text-neutral-600">Create your first habit to see statistics.</p>
          </div>
        ) : (
          <>
            {/* Aggregate Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-600">Total Habits</h3>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{totalHabits}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-600">Completed Days</h3>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{totalCompletedDays}</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-600">Avg. Rate</h3>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{avgCompletionRate}%</p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border border-neutral-100">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-neutral-600">Longest Streak</h3>
                </div>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{maxConsecutiveDays} days</p>
              </div>
            </div>

            {/* Per-Habit Statistics */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-100">
              <h2 className="text-2xl font-semibold mb-6 text-neutral-900">Habit Details</h2>
              <div className="space-y-6">
                {stats.map((stat) => (
                  <div key={stat.habitId} className="border-b border-neutral-200 pb-6 last:border-b-0 last:pb-0">
                    <h3 className="text-xl font-semibold mb-4 text-neutral-900">{stat.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-neutral-600 mb-1">Completed</p>
                        <p className="text-lg font-bold text-blue-600">{stat.completedDays} days</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <p className="text-xs text-neutral-600 mb-1">Streak</p>
                        <p className="text-lg font-bold text-purple-600">{stat.consecutiveDays} days</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-neutral-600 mb-1">Rate</p>
                        <p className="text-lg font-bold text-green-600">{stat.completionRate}%</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <p className="text-xs text-neutral-600 mb-1">Progress</p>
                        <p className="text-lg font-bold text-orange-600">{stat.completionPercentage}%</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-neutral-600">Progress</span>
                        <span className="text-sm font-medium text-neutral-900">{stat.completionPercentage}%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(stat.completionPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
