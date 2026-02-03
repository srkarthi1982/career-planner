import {
  CareerGoals,
  CareerMilestones,
  CareerTasks,
  and,
  count,
  db,
  desc,
  eq,
  lt,
  sql,
} from "astro:db";

export type CareerPlannerDashboardSummaryV1 = {
  version: 1;
  generatedAt: string;
  totals: {
    activeGoals: number;
    milestonesTotal: number;
    milestonesDone: number;
    tasksTotal: number;
    tasksDone: number;
    overdueTasks: number;
  };
  activity: {
    lastCompletedAt: string | null;
    lastActivityAt: string;
  };
};

const toIso = (value?: Date | string | null) => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

const resolveLatest = (...values: Array<Date | string | null | undefined>) => {
  const normalized = values
    .map((value) => (value instanceof Date ? value : value ? new Date(value) : null))
    .filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime())));
  if (normalized.length === 0) return null;
  return new Date(Math.max(...normalized.map((value) => value.getTime())));
};

export const buildCareerPlannerSummary = async (
  userId: string,
): Promise<CareerPlannerDashboardSummaryV1> => {
  const generatedAt = new Date().toISOString();

  const [{ total: activeGoalsRaw } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerGoals)
    .where(and(eq(CareerGoals.userId, userId), eq(CareerGoals.status, "active")));

  const [{ total: milestonesTotalRaw } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerMilestones)
    .where(eq(CareerMilestones.userId, userId));

  const [{ total: milestonesDoneRaw } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerMilestones)
    .where(and(eq(CareerMilestones.userId, userId), eq(CareerMilestones.status, "done")));

  const [{ total: tasksTotalRaw } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerTasks)
    .where(eq(CareerTasks.userId, userId));

  const [{ total: tasksDoneRaw } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerTasks)
    .where(and(eq(CareerTasks.userId, userId), eq(CareerTasks.status, "done")));

  const now = new Date();
  const [{ total: overdueRaw } = { total: 0 }] = await db
    .select({ total: count() })
    .from(CareerTasks)
    .where(
      and(
        eq(CareerTasks.userId, userId),
        lt(CareerTasks.dueDate, now),
        sql`${CareerTasks.status} != 'done'`,
      ),
    );

  const lastCompletedTask = await db
    .select({ completedAt: CareerTasks.completedAt })
    .from(CareerTasks)
    .where(and(eq(CareerTasks.userId, userId), eq(CareerTasks.status, "done")))
    .orderBy(desc(CareerTasks.completedAt), desc(CareerTasks.updatedAt), desc(CareerTasks.id))
    .limit(1);

  const lastCompletedMilestone = await db
    .select({ completedAt: CareerMilestones.completedAt })
    .from(CareerMilestones)
    .where(and(eq(CareerMilestones.userId, userId), eq(CareerMilestones.status, "done")))
    .orderBy(desc(CareerMilestones.completedAt), desc(CareerMilestones.updatedAt), desc(CareerMilestones.id))
    .limit(1);

  const lastGoalUpdate = await db
    .select({ updatedAt: CareerGoals.updatedAt })
    .from(CareerGoals)
    .where(eq(CareerGoals.userId, userId))
    .orderBy(desc(CareerGoals.updatedAt), desc(CareerGoals.id))
    .limit(1);

  const lastMilestoneUpdate = await db
    .select({ updatedAt: CareerMilestones.updatedAt })
    .from(CareerMilestones)
    .where(eq(CareerMilestones.userId, userId))
    .orderBy(desc(CareerMilestones.updatedAt), desc(CareerMilestones.id))
    .limit(1);

  const lastTaskUpdate = await db
    .select({ updatedAt: CareerTasks.updatedAt })
    .from(CareerTasks)
    .where(eq(CareerTasks.userId, userId))
    .orderBy(desc(CareerTasks.updatedAt), desc(CareerTasks.id))
    .limit(1);

  const lastCompletedAt = resolveLatest(
    lastCompletedTask?.[0]?.completedAt ?? null,
    lastCompletedMilestone?.[0]?.completedAt ?? null,
  );

  const lastActivityAt =
    resolveLatest(
      lastGoalUpdate?.[0]?.updatedAt ?? null,
      lastMilestoneUpdate?.[0]?.updatedAt ?? null,
      lastTaskUpdate?.[0]?.updatedAt ?? null,
      lastCompletedAt,
    ) ?? new Date();

  return {
    version: 1,
    generatedAt,
    totals: {
      activeGoals: Number(activeGoalsRaw ?? 0),
      milestonesTotal: Number(milestonesTotalRaw ?? 0),
      milestonesDone: Number(milestonesDoneRaw ?? 0),
      tasksTotal: Number(tasksTotalRaw ?? 0),
      tasksDone: Number(tasksDoneRaw ?? 0),
      overdueTasks: Number(overdueRaw ?? 0),
    },
    activity: {
      lastCompletedAt: toIso(lastCompletedAt),
      lastActivityAt: toIso(lastActivityAt) ?? generatedAt,
    },
  };
};
