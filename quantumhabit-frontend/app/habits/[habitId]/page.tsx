import { HabitDetailPageClient } from "./HabitDetailPageClient";

// Server component that exports generateStaticParams
// This is required for static export with dynamic routes
// Since we don't know habit IDs at build time (they're on-chain),
// we generate a reasonable range. The client component will handle
// cases where a habit doesn't exist (showing "Habit not found").
export async function generateStaticParams() {
  // Generate params for habit IDs 0-100
  // This covers most use cases while keeping build size reasonable
  // Users can still access IDs outside this range, but they won't be pre-generated
  const maxHabitId = 100;
  return Array.from({ length: maxHabitId + 1 }, (_, i) => ({
    habitId: i.toString(),
  }));
}

// Default export wraps the client component
export default function HabitDetailPage() {
  return <HabitDetailPageClient />;
}
