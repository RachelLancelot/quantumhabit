"use client";

import Link from "next/link";
import { Habit } from "@/hooks/useHabitList";

interface HabitCardProps {
  habit: Habit;
}

export function HabitCard({ habit }: HabitCardProps) {
  return (
    <Link href={`/habits/${habit.id}`}>
      <div className="group bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-neutral-100 hover:border-blue-200 transform hover:-translate-y-1">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
            {habit.name}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            habit.isActive 
              ? "bg-green-100 text-green-700" 
              : "bg-neutral-100 text-neutral-600"
          }`}>
            {habit.isActive ? "Active" : "Inactive"}
          </span>
        </div>
        <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
          {habit.description || "No description"}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium text-neutral-700">
              Target: {habit.targetDays} days
            </span>
          </div>
          <svg className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
