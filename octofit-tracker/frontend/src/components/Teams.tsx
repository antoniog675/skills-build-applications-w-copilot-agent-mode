import { CapabilityCard } from './CapabilityCard.js';

type TeamResponse = {
  teams: Array<{ _id?: string; name: string; mascot?: string; members?: string[] }>;
};

export default function Teams() {
  return (
    <CapabilityCard<TeamResponse>
      title="Teams"
      description="Manage teams and members."
      path="/api/teams"
      emptyMessage="No teams yet."
      renderItems={({ teams }) => teams.map((team, index) => (
        <li key={team._id ?? `${team.name}-${index}`}>
          {team.name}{team.mascot ? ` (${team.mascot})` : ''} — {team.members?.length ?? 0} members
        </li>
      ))}
    />
  );
}
