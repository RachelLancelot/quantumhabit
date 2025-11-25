"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuantumHabit } from "@/hooks/useQuantumHabit";

export default function CreateHabitPage() {
  const router = useRouter();
  const { createHabit, isDeployed, isReady, fhevmStatus, fhevmError, diagnostics } = useQuantumHabit();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    targetDays: 30,
    habitType: 0,
    completionStandard: 75,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isDeployed) {
        throw new Error("Contract not deployed on this network");
      }

      await createHabit({
        name: formData.name,
        description: formData.description,
        targetDays: formData.targetDays,
        habitType: formData.habitType,
        completionStandard: formData.completionStandard,
      });

      router.push("/habits");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create habit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Habit
          </h1>
          <p className="text-neutral-600">Set up your habit tracking with complete privacy</p>
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

        {!isReady && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl">
            <div className="flex items-center space-x-2 mb-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600"></div>
              <p className="font-medium">Initializing...</p>
            </div>
            <div className="ml-7 mt-2 space-y-1 text-sm">
              <p className={diagnostics?.hasWallet ? "text-green-700" : "text-red-600"}>
                {diagnostics?.hasWallet ? "✓" : "✗"} Wallet: {diagnostics?.hasWallet ? "Connected" : "Not connected"}
              </p>
              <p className={diagnostics?.hasContract ? "text-green-700" : "text-red-600"}>
                {diagnostics?.hasContract ? "✓" : "✗"} Contract: {diagnostics?.hasContract ? "Deployed" : "Not deployed"}
              </p>
              <p className={diagnostics?.hasFhevm ? "text-green-700" : "text-red-600"}>
                {diagnostics?.hasFhevm ? "✓" : "✗"} FHEVM: {diagnostics?.hasFhevm ? fhevmStatus || "Ready" : "Initializing..."}
              </p>
              <p className={diagnostics?.hasContractInstance ? "text-green-700" : "text-red-600"}>
                {diagnostics?.hasContractInstance ? "✓" : "✗"} Contract Instance: {diagnostics?.hasContractInstance ? "Ready" : "Creating..."}
              </p>
            </div>
            {fhevmError && (
              <p className="text-sm mt-2 ml-7 text-red-600">
                Error: {fhevmError.message}
              </p>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8 border border-neutral-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Habit Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="e.g., Daily Exercise"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                rows={4}
                placeholder="Describe your habit..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Target Days *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.targetDays}
                  onChange={(e) => setFormData({ ...formData, targetDays: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Habit Type
                </label>
                <select
                  value={formData.habitType}
                  onChange={(e) => setFormData({ ...formData, habitType: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                >
                  <option value={0}>Daily</option>
                  <option value={1}>Weekly</option>
                  <option value={2}>Custom</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Completion Standard (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={formData.completionStandard}
                onChange={(e) => setFormData({ ...formData, completionStandard: parseInt(e.target.value) })}
                className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <p className="text-xs text-neutral-500 mt-1">Minimum completion percentage to count as done</p>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading || !isDeployed || !isReady}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </span>
                ) : (
                  "Create Habit"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-semibold hover:bg-neutral-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}