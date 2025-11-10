"use client";

import { useHabitList } from "@/hooks/useHabitList";
import { HabitCard } from "@/components/Habits/HabitCard";
import Link from "next/link";

export default function HabitsPage() {
  const { habits, loading, error } = useHabitList();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Habits
          </h1>
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-neutral-600">Loading habits...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            My Habits
          </h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error: {error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Habits
            </h1>
            <p className="text-neutral-600">Track your progress with complete privacy</p>
          </div>
          <Link
            href="/habits/create"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create Habit</span>
          </Link>
        </div>

        {habits.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-neutral-100">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-neutral-900 mb-3">No habits yet</h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Start your journey to better habits. Create your first habit and track your progress with complete privacy.
            </p>
            <Link
              href="/habits/create"
              className="inline-block px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              Create Your First Habit
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}