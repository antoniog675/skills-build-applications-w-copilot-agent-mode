import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardResponse = {
  leaderboard: Array<{ teamName: string; totalPoints: number; rank: number }>;
};

export default function Leaderboard() {
  return (
    <CapabilityCard<LeaderboardResponse>
      title="Leaderboard"
      description="Compare team point totals."
      path="/api/leaderboard"
      emptyMessage="No leaderboard rankings yet."
      renderItems={({ leaderboard }) => leaderboard.map((team) => (
        <li key={team.rank}>#{team.rank} {team.teamName}: {team.totalPoints} points</li>
      ))}
    />
  );
}
