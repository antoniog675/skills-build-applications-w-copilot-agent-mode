import { CapabilityCard } from './CapabilityCard.js';

type WorkoutResponse = {
  suggestions: Array<{ title: string; focus: string; minutes: number; difficulty: string; reason: string }>;
};

export default function Workouts() {
  return (
    <CapabilityCard<WorkoutResponse>
      title="Workout suggestions"
      description="Recommend workouts from activity patterns."
      path={`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`}
      emptyMessage="No workout suggestions are available."
      renderItems={({ suggestions }) => suggestions.map((workout, index) => (
        <li key={`${workout.title}-${index}`}>
          <strong>{workout.title}</strong> — {workout.focus}, {workout.minutes} minutes ({workout.difficulty}). {workout.reason}
        </li>
      ))}
    />
  );
}
