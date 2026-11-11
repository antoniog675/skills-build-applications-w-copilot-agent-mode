import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

type ActivityInput = {
  userId: string;
  teamId: string;
  type: string;
  minutes: number;
};

type TeamInput = {
  name: string;
  mascot: string;
  members?: string[];
};

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

function notFound(message: string) {
  return Object.assign(new Error(message), { status: 404 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);
}

function parseActivityInput(input: unknown): ActivityInput {
  if (!isRecord(input)) throw badRequest('Activity details are required');
  const { userId, teamId, type, minutes } = input;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw badRequest('Valid userId and teamId are required');
  if (typeof type !== 'string' || type.trim().length === 0) throw badRequest('Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) {
    throw badRequest('Minutes must be a positive number');
  }
  return { userId, teamId, type: type.trim(), minutes };
}

function parseTeamInput(input: unknown): TeamInput {
  if (!isRecord(input)) throw badRequest('Team details are required');
  const { name, mascot, members } = input;
  if (typeof name !== 'string' || name.trim().length === 0) throw badRequest('Team name is required');
  if (typeof mascot !== 'string' || mascot.trim().length === 0) throw badRequest('Team mascot is required');
  if (members !== undefined && (!Array.isArray(members) || !members.every(isObjectId))) {
    throw badRequest('Members must be an array of valid user IDs');
  }
  return {
    name: name.trim(),
    mascot: mascot.trim(),
    members: members?.map((member) => {
      if (!isObjectId(member)) throw badRequest('Members must be an array of valid user IDs');
      return member;
    }),
  };
}

function focusForActivity(type: string): string {
  const normalized = type.trim().toLowerCase();
  if (['run', 'running', 'cycle', 'cycling', 'bike', 'biking'].includes(normalized)) return 'endurance';
  if (['walk', 'walking', 'yoga', 'stretch', 'stretching'].includes(normalized)) return 'mobility';
  return normalized;
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  const activity = parseActivityInput(input);
  const [user, team] = await Promise.all([
    User.findById(activity.userId).select('_id').lean(),
    Team.findById(activity.teamId).select('_id').lean(),
  ]);
  if (!user || !team) throw notFound('The specified user or team does not exist');
  return Activity.create({
    user: user._id,
    team: team._id,
    type: activity.type,
    minutes: activity.minutes,
    points: activity.minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  const teamInput = parseTeamInput(input);
  const members = teamInput.members ?? [];
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== members.length) throw notFound('One or more team members do not exist');
  }
  return Team.create({ ...teamInput, members });
}

export async function getLeaderboard() {
  const [teams, totals] = await Promise.all([
    Team.find().select('name').lean(),
    Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const pointsByTeam = new Map(totals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: pointsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).select('fitnessGoal').lean();
  if (!user) throw notFound('No user was found for that email address');

  const [recentActivities, workouts] = await Promise.all([
    Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(10).select('type').lean(),
    Workout.find().lean(),
  ]);
  const goalFocus = user.fitnessGoal.trim().toLowerCase();
  const activityFocus = recentActivities.length > 0 ? focusForActivity(recentActivities[0].type) : undefined;
  const goalMatches = workouts.filter((workout) => workout.focus.toLowerCase() === goalFocus);
  const activityMatches = activityFocus
    ? workouts.filter((workout) => workout.focus.toLowerCase() === activityFocus)
    : [];
  const recommendations = goalMatches.length > 0 ? goalMatches : activityMatches;

  return recommendations.map((workout) => ({
    ...workout,
    reason: goalMatches.length > 0
      ? `Matches your ${user.fitnessGoal} fitness goal.`
      : `Suggested based on your recent ${recentActivities[0].type} activity.`,
  }));
}

export { User };
